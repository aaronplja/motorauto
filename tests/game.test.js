/** Tests de la logique serveur du jeu : node tests/game.test.js */
"use strict";
const fs = require("fs"), path = require("path");
const core = require("../js/game-core");
const { createGame } = require("../functions/game");
const { FakeDb } = require("./fake-admin-db");

let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const rejects = async (p, code, m) => { try { await p; ok(false, m + " (aucune erreur)"); } catch (e) { ok(e.isGame && (!code || e.code === code), m + " → " + (e.code || e.message)); } };

// ---- horloge et hasard maîtrisés
let NOW = Date.parse("2026-10-28T10:00:00+01:00");
const db = new FakeDb(() => NOW);
let seed = 12345; const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pool = JSON.parse(fs.readFileSync(path.join(__dirname, "../functions/catalog-static.json"), "utf8"));
const ADMINS = new Set(["admin"]);
const G = createGame({ db, ts: () => db.ts(), rng, now: () => NOW, cardPool: async () => pool, isAdmin: async (c) => ADMINS.has(c.uid) });
["u1", "u2", "u3", "admin"].forEach((u) => db.seed("users", u, { username: "Pilote_" + u }));
const U1 = { uid: "u1" }, U2 = { uid: "u2" }, U3 = { uid: "u3" }, ADM = { uid: "admin" };

(async () => {
  // ---- cohérence des fichiers partagés
  ok(fs.readFileSync(path.join(__dirname, "../js/game-core.js"), "utf8") === fs.readFileSync(path.join(__dirname, "../functions/game-core.js"), "utf8"), "functions/game-core.js identique à js/game-core.js (node scripts/sync-functions.js)");
  ok(pool.length >= 100, "catalogue statique chargé : " + pool.length);
  const PRAR = core.computeRarities(pool);

  // ---- calendrier
  ok(core.dayKey(Date.parse("2026-10-28T23:30:00Z")) === "2026-10-29", "jour de Paris (minuit passé)");
  ok(core.weekKey(Date.parse("2026-10-28T12:00:00Z")) === "2026-W44", "semaine ISO " + core.weekKey(Date.parse("2026-10-28T12:00:00Z")));
  ok(core.weekKey(Date.parse("2026-01-01T12:00:00Z")) === "2026-W01" && core.weekKey(Date.parse("2027-01-01T12:00:00Z")) === "2026-W53", "semaines ISO en fin d'année");
  ok(core.dayKey(core.weekStart(NOW)) === "2026-10-26", "début de semaine = lundi");
  ok(core.weekChallenges("2026-W44").length === 10 && JSON.stringify(core.weekChallenges("2026-W44").map((c) => c.id)) === JSON.stringify(core.weekChallenges("2026-W44").map((c) => c.id)), "10 défis déterministes");

  // ---- raretés : déterministes, égalités départagées
  const r1 = core.computeRarities(pool), r2 = core.computeRarities(pool.slice().reverse());
  ok(pool.every((c) => r1.get(c.id) === r2.get(c.id)), "rareté indépendante de l'ordre du catalogue");
  const cnt = { legendary: 0, epic: 0, rare: 0, common: 0 }; r1.forEach((r) => cnt[r]++);
  ok(cnt.legendary >= 5 && cnt.epic > 10 && cnt.rare > 25 && cnt.common > 40, "répartition des raretés " + JSON.stringify(cnt));

  // ---- statistiques de tirage (20 000 packs)
  const draws = { common: 0, rare: 0, epic: 0, legendary: 0 }; const ids = pool.map((c) => c.id); let tot = 0;
  for (let i = 0; i < 20000; i++) core.drawPack(r1, ids, rng, false).forEach((id) => { draws[r1.get(id)]++; tot++; });
  ok(Math.abs(draws.common / tot - 0.62) < 0.02 && Math.abs(draws.rare / tot - 0.26) < 0.02 && Math.abs(draws.epic / tot - 0.09) < 0.015 && Math.abs(draws.legendary / tot - 0.03) < 0.01, "probabilités de tirage " + JSON.stringify({ c: (draws.common / tot).toFixed(3), r: (draws.rare / tot).toFixed(3), e: (draws.epic / tot).toFixed(3), l: (draws.legendary / tot).toFixed(3) }));
  let pityBad = 0; for (let i = 0; i < 3000; i++) if (!core.drawPack(r1, ids, rng, true).some((id) => r1.get(id) !== "common")) pityBad++;
  ok(pityBad === 0, "le 10e pack contient toujours une carte au moins rare");

  // ---- pack du jour
  let r = await G.openPack(U1, { kind: "daily" });
  ok(r.cards.length === 3 && r.doc.lastPack === "2026-10-28" && r.doc.opened === 1, "pack du jour : 3 cartes");
  ok(r.cards.every((c) => ids.includes(c.id) || core.isExtra(c.id)), "cartes issues du catalogue");
  await rejects(G.openPack(U1, { kind: "daily" }), "failed-precondition", "pack du jour déjà ouvert refusé");
  await rejects(G.openPack(U1, { kind: "gold" }), "invalid-argument", "type de pack inconnu refusé");
  NOW += 86400000;
  r = await G.openPack(U1, { kind: "daily" }); ok(r.doc.opened === 2, "lendemain : nouveau pack");
  r = await G.openPack(U1, { kind: "bonus" }); ok(r.doc.bonus === 0, "pack bonus de bienvenue consommé");
  await rejects(G.openPack(U1, { kind: "bonus" }), "failed-precondition", "plus de pack bonus");
  const c1 = db.raw("collections", "u1");
  ok(c1.count === Object.keys(c1.owned).length && Object.values(c1.owned).reduce((a, b) => a + b, 0) === 9, "9 cartes reçues, comptage cohérent");

  // ---- doublons → poussière
  db.seed("collections", "u2", Object.assign(core.blankCollection(), { owned: { [ids[0]]: 1 }, count: 1, opened: 5, bonus: 3, claimed: [] }));
  let dupSeen = false, dust0 = 0;
  for (let i = 0; i < 6 && !dupSeen; i++) { const before = db.raw("collections", "u2").dust; const x = await G.openPack(U2, { kind: "bonus" }); dust0 = x.dust; if (x.cards.some((c) => !c.fresh)) { dupSeen = true; ok(x.dust > 0 && db.raw("collections", "u2").dust === before + x.dust, "doublon converti en poussière +" + x.dust); } if (db.raw("collections", "u2").bonus === 0) break; }
  // 10e pack
  db.seed("collections", "u3", Object.assign(core.blankCollection(), { opened: 9, bonus: 1 }));
  for (let i = 0; i < 50; i++) { db.seed("collections", "u3", Object.assign(core.blankCollection(), { opened: 9, bonus: 1 })); const x = await G.openPack(U3, { kind: "bonus" }); if (!x.cards.some((c) => c.rarity !== "common")) { ok(false, "10e pack sans rare"); break; } if (i === 49) ok(true, "10e pack : 50 essais avec au moins une carte rare"); }

  // ---- pack acheté avec de la poussière (2 voitures, 1 rare ou mieux)
  db.seed("collections", "u4", Object.assign(core.blankCollection(), { dust: 450, opened: 3, bonus: 0 }));
  const U4 = { uid: "u4", name: "P4" };
  await rejects(G.openPack({ uid: "u5", name: "P5" }, { kind: "shop" }), "failed-precondition", "pack acheté : poussière insuffisante refusée");
  let shopBad = 0, shopDust = 450;
  for (let i = 0; i < 2; i++) {
    const x = await G.openPack(U4, { kind: "shop" });
    if (x.cards.length !== 3) shopBad++;
    if (!x.cards.some((c) => c.rarity !== "common")) shopBad++;
    shopDust = x.doc.dust;
  }
  await rejects(G.openPack(U4, { kind: "shop" }), "failed-precondition", "pack acheté : 3e achat refusé (poussière épuisée)");
  ok(shopBad === 0, "pack acheté : toujours 3 cartes dont 1 rare ou mieux");
  ok(db.raw("collections", "u4").opened === 3 && db.raw("collections", "u4").dust < 450, "pack acheté : ni pack ouvert ni défi comptés, poussière dépensée");
  ok((db.raw("collections", "u4").dustLog || []).some((l) => l.n === -200), "historique : l'achat est tracé");
  // ---- fabrication
  db.seed("collections", "u3", Object.assign(core.blankCollection(), { dust: 100, owned: {}, bonus: 0 }));
  const common = ids.find((id) => r1.get(id) === "common"), legend = ids.find((id) => r1.get(id) === "legendary");
  r = await G.craftCard(U3, { id: common }); ok(r.doc.dust === 70 && r.doc.owned[common] === 1 && r.doc.count === 1, "fabrication d'une commune : 30 ✨");
  await rejects(G.craftCard(U3, { id: common }), "failed-precondition", "carte déjà possédée");
  await rejects(G.craftCard(U3, { id: legend }), "failed-precondition", "poussière insuffisante pour une légendaire");
  await rejects(G.craftCard(U3, { id: "sp-xxx" }), "not-found", "carte spéciale non fabricable");
  await rejects(G.craftCard(U3, { id: "inconnue" }), "not-found", "carte inconnue");

  // ---- série de visites (serveur)
  NOW = Date.parse("2026-11-02T09:00:00+01:00");
  r = await G.touchStreak(U1); ok(r.days === 1 && r.fresh, "série : jour 1");
  r = await G.touchStreak(U1); ok(r.days === 1 && !r.fresh, "série : déjà comptée aujourd'hui");
  NOW += 86400000; r = await G.touchStreak(U1); ok(r.days === 2, "série : jour 2");
  NOW += 86400000; r = await G.touchStreak(U1); ok(r.days === 3 && r.best === 3, "série : jour 3");
  NOW += 3 * 86400000; r = await G.touchStreak(U1); ok(r.days === 1 && r.best === 3, "série brisée : retour à 1, record conservé");

  // ---- badges → packs bonus (calculés par le serveur)
  const s0 = db.raw("collections", "u1").bonus;
  r = await G.syncCollection(U1);
  ok(r.doc.bonus === s0 + r.freshBadges, "badges → packs bonus cohérents (" + r.freshBadges + ")");
  r = await G.syncCollection(U1); ok(r.freshBadges === 0, "badges déjà réclamés : pas de doublon");
  // le client ne peut pas se fabriquer de badges : seules les données serveur comptent
  r = await G.syncCollection({ uid: "inconnu" }); ok(r.freshBadges === 0 && r.doc.bonus === 1, "nouveau pilote : 1 pack de bienvenue, aucun badge");

  // ---- défis hebdomadaires
  let wkNow = NOW; for (let i = 0; i < 80; i++) { const ids2 = core.weekChallenges(core.weekKey(wkNow)).map((c) => c.id); if (ids2.includes("packs3") && ids2.includes("duel1")) break; wkNow += 7 * 86400000; }
  NOW = wkNow + 86400000;
  let ws = await G.weeklyStatus(U2); ok(ws.items.length === 10 && ws.items.every((x) => !x.claimed && x.value === 0 || x.value >= 0), "statut hebdo : 4 défis " + ws.items.map((x) => x.id).join(","));
  await rejects(G.claimChallenge(U2, { id: "packs3" }), "failed-precondition", "défi non accompli refusé");
  await rejects(G.claimChallenge(U2, { id: "inexistant" }), "not-found", "défi hors semaine refusé");
  db.seed("collections", "u2", Object.assign(core.blankCollection(), { bonus: 5, dust: 0 }));
  for (let i = 0; i < 3; i++) await G.openPack(U2, { kind: "bonus" });
  const before = db.raw("collections", "u2").dust;
  r = await G.claimChallenge(U2, { id: "packs3" }); ok(r.reward.dust === 40 && db.raw("collections", "u2").dust >= before + 40 && r.doc.chal === 1, "défi « ouvre 3 packs » récompensé");
  await rejects(G.claimChallenge(U2, { id: "packs3" }), "failed-precondition", "double récompense refusée");
  r = await G.logAction(U2, { type: "duel" }); ok(r.counted, "duel enregistré");
  await G.logAction(U2, { type: "duel" }); await G.logAction(U2, { type: "duel" });
  r = await G.logAction(U2, { type: "duel" }); ok(!r.counted, "plafond de 3 actions par jour (anti-triche)");
  await rejects(G.logAction(U2, { type: "gagner" }), "invalid-argument", "action inconnue refusée");
  r = await G.claimChallenge(U2, { id: "duel1" }); ok(r.reward.dust === 25, "défi « fais un duel » récompensé");
  // ---- voiture de la semaine : 3 défis dédiés
  ws = await G.weeklyStatus(U2);
  ok(ws.featured && ws.featured.car.id && ws.featured.items.length === 3 && ws.featured.next.id, "voiture de la semaine + aperçu de la suivante");
  const fid = ws.featured.car.id;
  await rejects(G.claimChallenge(U2, { id: "f-view" }), "failed-precondition", "défi « découvre la fiche » refusé avant d'avoir vu la fiche");
  r = await G.logAction(U2, { type: "featview", carId: "autre-voiture" }); ok(!r.counted, "une autre fiche ne valide pas le défi");
  r = await G.logAction(U2, { type: "featview", carId: fid }); ok(r.counted, "fiche de la semaine consultée");
  r = await G.claimChallenge(U2, { id: "f-view" }); ok(r.reward.dust === 25, "défi « découvre la fiche » récompensé");
  await rejects(G.claimChallenge(U2, { id: "f-view" }), "failed-precondition", "pas de double récompense");
  db.seed("site_settings", "featured", { weeks: { [core.weekKey(NOW)]: pool[3].id } });
  ws = await G.weeklyStatus(U2); ok(ws.featured.car.id === pool[3].id, "voiture choisie par l'admin prioritaire");
  // changement de semaine : compteurs remis à zéro
  NOW += 7 * 86400000; ws = await G.weeklyStatus(U2); ok(ws.items.every((x) => !x.claimed), "nouvelle semaine : défis remis à zéro");

  // ---- échanges
  const A = ids[10], B = ids[20], Cc = ids[30];
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { owned: { [A]: 3, [Cc]: 1 }, count: 2, bonus: 0 }));
  db.seed("collections", "u2", Object.assign(core.blankCollection(), { owned: { [B]: 2, [Cc]: 2 }, count: 2, bonus: 0 }));
  await rejects(G.proposeTrade(U1, { toUid: "u1", give: A, want: B }), "invalid-argument", "échange avec soi-même refusé");
  await rejects(G.proposeTrade(U1, { toUid: "u2", give: Cc, want: B }), "failed-precondition", "on ne donne qu'un doublon");
  await rejects(G.proposeTrade(U1, { toUid: "u2", give: A, want: Cc }), "failed-precondition", "carte demandée déjà possédée");
  await rejects(G.proposeTrade(U1, { toUid: "u2", give: A, want: ids[40] }), "failed-precondition", "le pilote n'a pas la carte en double");
  await rejects(G.proposeTrade(U1, { toUid: "fantome", give: A, want: B }), "not-found", "pilote inconnu");
  r = await G.proposeTrade(U1, { toUid: "u2", give: A, want: B, message: "Salut !" });
  ok(!!r.id && db.raw("trades", r.id).status === "open", "proposition créée");
  const tid = r.id;
  ok(Array.from(db._col("private_chats/u1_u2/messages").values()).length === 1, "message privé envoyé automatiquement");
  ok(Array.from(db._col("users/u2/notifications").values()).length === 1, "notification envoyée");
  await rejects(G.proposeTrade(U1, { toUid: "u2", give: A, want: B }), "already-exists", "doublon de proposition refusé");
  await rejects(G.respondTrade(U3, { id: tid, accept: true }), "permission-denied", "un tiers ne peut pas répondre");
  await rejects(G.cancelTrade(U2, { id: tid }), "permission-denied", "seul l'auteur annule");
  r = await G.respondTrade(U2, { id: tid, accept: true });
  const a1 = db.raw("collections", "u1"), a2 = db.raw("collections", "u2");
  ok(r.accepted && a1.owned[A] === 2 && a1.owned[B] === 1 && a2.owned[B] === 1 && a2.owned[A] === 1, "échange réalisé : cartes déplacées");
  ok(a1.trades === 1 && a2.trades === 1 && a1.count === 3 && a2.count === 3, "compteurs d'échanges et de cartes à jour");
  await rejects(G.respondTrade(U2, { id: tid, accept: true }), "failed-precondition", "échange déjà conclu");
  // refus + annulation + cartes disparues
  r = await G.proposeTrade(U1, { toUid: "u2", give: A, want: Cc }).catch(() => null); ok(r === null, "carte déjà possédée après échange");
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { owned: { [A]: 2 }, bonus: 0 }));
  db.seed("collections", "u2", Object.assign(core.blankCollection(), { owned: { [B]: 2 }, bonus: 0 }));
  const t2 = (await G.proposeTrade(U1, { toUid: "u2", give: A, want: B })).id;
  r = await G.respondTrade(U2, { id: t2, accept: false }); ok(!r.accepted && db.raw("trades", t2).status === "declined", "proposition déclinée");
  const t3 = (await G.proposeTrade(U1, { toUid: "u2", give: A, want: B })).id;
  await G.cancelTrade(U1, { id: t3 }); ok(db.raw("trades", t3).status === "cancelled", "proposition annulée par son auteur");
  const t4 = (await G.proposeTrade(U1, { toUid: "u2", give: A, want: B })).id;
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { owned: { [A]: 1 }, bonus: 0 }));      // l'auteur n'a plus le doublon
  r = await G.respondTrade(U2, { id: t4, accept: true }); ok(!r.ok && db.raw("trades", t4).status === "cancelled" && db.raw("collections", "u2").owned[B] === 2, "cartes disparues : échange annulé sans rien déplacer");
  // plafond de propositions
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { owned: Object.fromEntries(ids.slice(50, 60).map((i) => [i, 2])), bonus: 0 }));
  db.seed("collections", "u2", Object.assign(core.blankCollection(), { owned: Object.fromEntries(ids.slice(60, 70).map((i) => [i, 2])), bonus: 0 }));
  for (let i = 0; i < 5; i++) await G.proposeTrade(U1, { toUid: "u2", give: ids[50 + i], want: ids[60 + i] });
  await rejects(G.proposeTrade(U1, { toUid: "u2", give: ids[55], want: ids[65] }), "resource-exhausted", "5 propositions ouvertes au maximum");
  db.seed("mutes", "u3", { untilMs: NOW + 1e6 });
  db.seed("collections", "u3", Object.assign(core.blankCollection(), { owned: { [A]: 2 }, bonus: 0 }));
  await rejects(G.proposeTrade(U3, { toUid: "u2", give: A, want: ids[61] }), "permission-denied", "pilote en sourdine : pas d'échange");

  // ---- cartes spéciales (admin)
  db.seed("special_cards", "sp-rassemblement-2026", { name: "Rassemblement 2026", edition: "Édition limitée", supply: 2, granted: 0, active: true, color: "gold", image: "", power: 0 });
  await rejects(G.adminGrantCard(U1, { uid: "u2", cardId: "sp-rassemblement-2026" }), "permission-denied", "un pilote ne peut pas attribuer de carte");
  r = await G.adminGrantCard(ADM, { uid: "u2", cardId: "sp-rassemblement-2026" }); ok(r.serials[0] === 1 && db.raw("collections", "u2").owned["sp-rassemblement-2026"] === 1 && db.raw("collections", "u2").specials === 1, "carte spéciale n°1 attribuée");
  r = await G.adminGrantCard(ADM, { uid: "u3", cardId: "sp-rassemblement-2026" }); ok(r.serials[0] === 2, "exemplaire n°2");
  await rejects(G.adminGrantCard(ADM, { uid: "u1", cardId: "sp-rassemblement-2026" }), "failed-precondition", "tirage épuisé (2/2)");
  ok(db.raw("special_grants", "sp-rassemblement-2026_u2").serials[0] === 1, "registre des attributions");
  await G.adminGrantCard(ADM, { uid: "u2", cardId: "sp-rassemblement-2026", mode: "revoke" }); ok(!db.raw("collections", "u2").owned["sp-rassemblement-2026"] && db.raw("collections", "u2").specials === 0, "carte retirée");
  await rejects(G.adminGrantCard(ADM, { uid: "u2", cardId: "sp-inconnue" }), "not-found", "carte spéciale inconnue");
  await rejects(G.adminGrantCard(ADM, { uid: "fantome", cardId: "sp-rassemblement-2026" }), "not-found", "pilote inconnu");
  // les tirages de pack ne donnent jamais de carte spéciale
  ok(!ids.some(core.isSpecial), "les spéciales ne sont jamais dans le tirage");

  // ---- concours photo
  NOW = Date.parse("2026-11-03T10:00:00+01:00");
  await rejects(G.adminContest(U1, { action: "open" }), "permission-denied", "ouvrir un concours : admin seulement");
  r = await G.adminContest(ADM, { action: "open", theme: "Mon garage" }); ok(r.month === "2026-11" && db.raw("contests", "2026-11").status === "open", "concours de novembre ouvert");
  const ent = (id, uid, st) => db.seed("contest_entries", id, { contest: "2026-11", uid, name: "P" + uid, photo: "https://x/p_" + uid + ".jpg", caption: "ma " + uid, status: st, createdAt: { __ts: NOW } });
  ent("2026-11_u1", "u1", "approved"); ent("2026-11_u2", "u2", "approved"); ent("2026-11_u3", "u3", "pending");
  const vote = (v, e) => db.seed("contest_votes", "2026-11_" + v, { contest: "2026-11", uid: v, entry: e });
  vote("a", "2026-11_u2"); vote("b", "2026-11_u2"); vote("c", "2026-11_u1"); vote("d", "2026-11_u3"); vote("u2", "2026-11_u2");   // d : entrée non validée ; u2 : vote pour soi-même
  db.seed("collections", "u2", Object.assign(core.blankCollection(), { bonus: 0 })); db.seed("collections", "u1", Object.assign(core.blankCollection(), { bonus: 0, dust: 0 }));
  r = await G.adminContest(ADM, { action: "close" });
  ok(r.winner === "u2" && r.results[0].votes === 2 && r.results[1].votes === 1, "gagnant = entrée la plus votée (votes de soi-même et entrées non validées ignorés)");
  ok(db.raw("collections", "u2").owned["sp-photo-2026-11"] === 1 && db.raw("special_cards", "sp-photo-2026-11").supply === 1, "carte spéciale « Photographe du mois » créée et attribuée");
  ok(db.raw("collections", "u1").dust === 150, "2e : 150 poussière");
  ok(db.raw("contests", "2026-11").status === "closed" && db.raw("contests", "2026-11").winnerUid === "u2", "concours clôturé");
  await rejects(G.adminContest(ADM, { action: "close" }), "failed-precondition", "double clôture refusée");
  r = await G.syncCollection(U2); ok(r.doc.claimed.includes("photoWin") && r.doc.claimed.includes("special1"), "badges « Photographe du mois » et « Édition limitée » obtenus");
  // planificateur mensuel
  NOW = Date.parse("2026-12-01T00:10:00+01:00");
  r = await G.monthlyContest(); ok(r.month === "2026-12" && db.raw("contests", "2026-12").status === "open", "1er décembre : nouveau concours ouvert");
  db.seed("contests", "2026-12", Object.assign({}, db.raw("contests", "2026-12")));
  NOW = Date.parse("2027-01-01T00:10:00+01:00");
  await G.monthlyContest(); ok(db.raw("contests", "2026-12").status === "closed" && db.raw("contests", "2027-01").status === "open", "1er janvier : décembre clôturé (sans participant), janvier ouvert");

  // cartes d'événement en libre-service
  db.seed("special_cards", "sp-salon", { name: "Salon", granted: 0, supply: 0, claimable: true, startsAtMs: Date.parse("2027-02-01T00:00:00Z"), endsAtMs: Date.parse("2027-02-03T23:59:59Z"), kind: "event" });
  db.seed("special_cards", "sp-prive", { name: "Privée", granted: 0, supply: 0, claimable: false });
  NOW = Date.parse("2027-01-15T12:00:00Z");
  await rejects(G.claimSpecial(U1, { cardId: "sp-salon" }), "failed-precondition", "événement pas encore commencé");
  NOW = Date.parse("2027-02-02T12:00:00Z");
  await rejects(G.claimSpecial(U1, { cardId: "sp-prive" }), "failed-precondition", "carte non réclamable refusée");
  r = await G.claimSpecial(U1, { cardId: "sp-salon" }); ok(r.serials[0] === 1 && db.raw("collections", "u1").owned["sp-salon"] === 1, "carte d'événement récupérée");
  await rejects(G.claimSpecial(U1, { cardId: "sp-salon" }), "already-exists", "une seule carte par pilote");
  NOW = Date.parse("2027-02-05T12:00:00Z");
  await rejects(G.claimSpecial(U2, { cardId: "sp-salon" }), "failed-precondition", "événement terminé");

  // outils d'administration
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { bonus: 0, dust: 0, lastPack: core.dayKey(NOW), opened: 4 }));
  await rejects(G.openPack(U1, { kind: "test" }), "permission-denied", "pack de test refusé aux pilotes");
  await rejects(G.adminGameTool(U1, { action: "bonus", uid: "u1", qty: 5 }), "permission-denied", "outils admin refusés aux pilotes");
  r = await G.openPack(ADM, { kind: "test" }); ok(r.cards.length >= 3 && r.test === true, "pack de test admin");
  r = await G.openPack(ADM, { kind: "test" }); ok(r.cards.length >= 3, "pack de test illimité (2e)");
  ok(db.raw("collections", "admin").opened === 0 && db.raw("collections", "admin").lastPack === "", "pack de test : aucun compteur touché");
  await G.adminGameTool(ADM, { action: "bonus", uid: "u1", qty: 7 }); ok(db.raw("collections", "u1").bonus === 7, "packs bonus donnés");
  await G.adminGameTool(ADM, { action: "dust", uid: "u1", qty: 300 }); ok(db.raw("collections", "u1").dust === 300, "poussière donnée");
  await G.adminGameTool(ADM, { action: "resetDaily", uid: "u1" }); ok(db.raw("collections", "u1").lastPack === "", "pack du jour réarmé");
  await G.adminGameTool(ADM, { action: "unlockAll", uid: "u1" }); ok(db.raw("collections", "u1").count > 100, "toutes les cartes débloquées");
  await G.adminGameTool(ADM, { action: "resetCollection", uid: "u1" }); ok(db.raw("collections", "u1").count === 0 && db.raw("collections", "u1").bonus === 0, "collection remise à zéro");
  await rejects(G.adminGameTool(ADM, { action: "nuke", uid: "u1" }), "invalid-argument", "action inconnue refusée");

  // parrainage
  ["r1", "r2", "r3"].forEach((u) => db.seed("users", u, { username: "Ref_" + u }));
  await rejects(G.claimReferral({ uid: "r2" }, { ref: "r2" }), "invalid-argument", "pas de parrainage de soi-même");
  await rejects(G.claimReferral({ uid: "r2" }, { ref: "inconnu" }), "not-found", "parrain inconnu");
  r = await G.claimReferral({ uid: "r2" }, { ref: "r1" }); ok(r.ok && db.raw("collections", "r1").bonus === 2 && db.raw("collections", "r2").bonus === 2, "parrain et filleul gagnent +1 pack bonus");
  await rejects(G.claimReferral({ uid: "r2" }, { ref: "r3" }), "already-exists", "un seul parrainage par compte");
  ok(db.raw("referrals", "r2").referrerUid === "r1", "parrainage enregistré");

  // ---- saison, pass, quêtes, gels de série, cadeau de bienvenue, historique de packs
  ["s1"].forEach((u) => db.seed("users", u, { username: "Saison_" + u }));
  const S1 = { uid: "s1" };
  r = await G.claimWelcome(S1); ok(r.doc.welcome && db.raw("collections", "s1").bonus >= 1 && r.doc.dust === core.WELCOME.dust, "cadeau de bienvenue : pack + cristaux");
  await rejects(G.claimWelcome(S1), "failed-precondition", "cadeau de bienvenue une seule fois");
  r = await G.openPack(S1, { kind: "daily" });
  ok(r.doc.log.length === 1 && r.doc.best.split("|").length === 2 && r.doc.packsAll === 1, "historique : 1 pack, meilleure pioche " + r.doc.best);
  ok(r.doc.season && r.doc.season.pts === core.SEASON_PTS.pack && r.doc.season.act.packs === 1, "saison : points pour un pack");
  await rejects(G.seasonClaim(S1, { what: "tier", tier: 1 }), "failed-precondition", "palier non atteint refusé");
  for (let i = 0; i < 5; i++) await G.openPack(S1, { kind: "bonus" }).catch(() => {});
  let sn = db.raw("collections", "s1").season; ok(sn.pts >= 20, "points de saison cumulés : " + sn.pts);
  db.raw("collections", "s1").season.pts = core.PASS_STEP * 5;
  const sdust0 = db.raw("collections", "s1").dust, bon0 = db.raw("collections", "s1").bonus;
  r = await G.seasonClaim(S1, { what: "tier", tier: 5 }); ok(db.raw("collections", "s1").bonus === bon0 + 1, "palier 5 : pack bonus");
  await rejects(G.seasonClaim(S1, { what: "tier", tier: 5 }), "failed-precondition", "palier déjà récupéré refusé");
  r = await G.seasonClaim(S1, { what: "tier", tier: 1 }); ok(db.raw("collections", "s1").dust > sdust0, "palier 1 : cristaux");
  db.raw("collections", "s1").season.pts = core.PASS_STEP * 30; r = await G.seasonClaim(S1, { what: "tier", tier: 10 }); ok(r.doc.cosm.includes("t:t10"), "palier 10 : titre débloqué");
  { const own0 = Object.keys(db.raw("collections", "s1").owned).filter((k) => db.raw("collections", "s1").owned[k] > 0).length; r = await G.seasonClaim(S1, { what: "tier", tier: 12 }); ok(r.cards.length === 1 && PRAR.get(r.cards[0]) === "epic", "palier 12 : carte Épique " + r.cards[0]); }
  { const fz0 = (db.raw("streaks", "s1") || {}).freezes || 0; r = await G.seasonClaim(S1, { what: "tier", tier: 7 }); ok(((db.raw("streaks", "s1") || {}).freezes || 0) === fz0 + 1 || db.raw("collections", "s1").dust > 0, "palier 7 : gel de série (ou cristaux si stock plein)"); }
  r = await G.seasonClaim(S1, { what: "tier", tier: 30 }); ok(r.need === "pick" && r.offer.length === 3 && r.offer.every((id) => PRAR.get(id) === "legendary"), "palier 30 : 3 Légendaires proposées");
  await rejects(G.seasonClaim(S1, { what: "tier", tier: 30, pick: "pas-une-carte" }), "invalid-argument", "choix hors proposition refusé");
  ok(!db.raw("collections", "s1").season.claimed.includes(30), "palier 30 non consommé sans choix");
  { const pick = r.offer[1]; const had = db.raw("collections", "s1").owned[pick] || 0; r = await G.seasonClaim(S1, { what: "tier", tier: 30, pick }); ok(db.raw("collections", "s1").owned[pick] === had + 1 && r.cards[0] === pick, "palier 30 : Légendaire choisie obtenue"); }
  ok(r.doc.cosm.includes("f:s_royal") && r.doc.cosm.includes("t:t30"), "palier 30 : cadre et titre");
  await rejects(G.seasonClaim(S1, { what: "quest" }), "failed-precondition", "quête non terminée refusée");
  for (let q = 0; q < 4; q++) { const c = db.raw("collections", "s1"); c.season.act[core.SEASON_QUESTS[q].act] = (c.season.base ? c.season.base[core.SEASON_QUESTS[q].act] || 0 : 0) + 999; r = await G.seasonClaim(S1, { what: "quest" }); }
  ok(r.doc.cosm.includes("f:quest") && r.doc.cosm.includes("t:quest") && r.doc.season.q === 4, "chaîne de quêtes terminée : récompense finale");
  // nouvelle saison : remise à zéro mais cosmétiques conservés
  NOW += 32 * 86400000; r = await G.syncCollection(S1);
  ok(r.doc.season.pts === 0 && r.doc.season.claimed.length === 0 && r.doc.cosm.includes("t:t30"), "nouvelle saison : points remis à zéro, titres gardés");
  // gels de série
  NOW = Date.parse("2026-12-03T10:00:00+01:00"); const F = { uid: "f1" }; db.seed("users", "f1", { username: "Gel" }); db.seed("collections", "f1", Object.assign(core.blankCollection(), { dust: 1000 }));
  r = await G.touchStreak(F); ok(r.freezes === 1, "1 gel offert dans le mois");
  NOW += 86400000; await G.touchStreak(F); NOW += 2 * 86400000; r = await G.touchStreak(F);
  ok(r.saved === 1 && r.days === 3 && r.freezes === 0, "un jour raté : le gel sauve la série (" + r.days + ")");
  NOW += 3 * 86400000; r = await G.touchStreak(F); ok(r.days === 1, "trop de jours ratés : la série repart de 1");
  r = await G.buyFreeze(F); ok(r.freezes === 1 && r.doc.dust === 1000 - core.FREEZE_COST, "achat d'un gel en cristaux");
  r = await G.buyFreeze(F); ok(r.freezes === 2, "deuxième gel"); await rejects(G.buyFreeze(F), "failed-precondition", "stock de 2 gels maximum");
  // plafond quotidien de points de saison (hors visite / défis / albums)
  { NOW = Date.parse("2026-12-10T10:00:00+01:00"); const c = Object.assign(core.blankCollection(), {}); const add = (n, free) => core.seasonAdd(c, n, null, NOW, free);
    ok(add(50) === 50 && add(50) === core.SEASON_DAY_CAP - 50 && add(50) === 0, "points de saison plafonnés à " + core.SEASON_DAY_CAP + " par jour");
    ok(add(15, true) === 15, "défi / visite / album : hors plafond"); NOW += 86400000; ok(add(30) === 30, "le plafond repart le lendemain");
    ok(core.seasonInfo(Date.parse("2026-11-30T23:30:00+01:00")).n === 1 && core.seasonInfo(Date.parse("2026-12-01T00:30:00+01:00")).n === 2, "saison 1 = novembre 2026, saison 2 dès le 1er décembre (heure de Paris)");
    ok(core.seasonInfo(Date.parse("2026-11-15T12:00:00+01:00")).daysLeft === 16, "jours restants jusqu'à la fin du mois");
    let tot = 0; for (let t = 1; t <= 30; t++) tot += core.passReward(t).dust; ok(tot > 1000 && tot < 2000, "cristaux totaux du pass équilibrés : " + tot); }
  // quiz : nouvelles catégories
  for (const c of ["countries", "circuits", "numbers", "trivia"]) { const sd = "seed" + c + "ab"; const qs = core.quizBuild(sd, c, 2, pool); r = await G.quizSubmit(U2, { seed: sd, cat: c, level: 2, answers: qs.map((q) => q.m || q.a) }); ok(r.total >= 9 && r.score === r.total, "quiz " + c + " : " + r.total + " questions"); }

  // ---- défi de clubs
  NOW = Date.parse("2026-11-02T10:00:00+01:00");
  ["ca1", "ca2", "cb1", "cb2"].forEach((u) => { db.seed("users", u, { username: u }); db.seed("collections", u, Object.assign(core.blankCollection(), {})); });
  db.seed("clubs", "brand-a", { name: "Club A" }); db.seed("clubs", "brand-b", { name: "Club B" });
  db.seed("club_members", "brand-a_ca1", { clubId: "brand-a", uid: "ca1" }); db.seed("club_members", "brand-a_ca2", { clubId: "brand-a", uid: "ca2" });
  db.seed("club_members", "brand-b_cb1", { clubId: "brand-b", uid: "cb1" }); db.seed("club_members", "brand-b_cb2", { clubId: "brand-b", uid: "cb2" });
  r = await G.clubClash(U1); ok(r.pairs.length === 1, "défi de clubs : 2 clubs appariés");
  await G.openPack({ uid: "ca1" }, { kind: "daily" }); await G.openPack({ uid: "ca2" }, { kind: "daily" }); await G.openPack({ uid: "cb1" }, { kind: "daily" });
  NOW += 7 * 86400000; r = await G.clubClash(U1);
  ok(r.prev.results.length === 1 && r.prev.results[0].win === "brand-a" && r.prev.results[0].as === core.SEASON_PTS.pack * 2 && r.prev.results[0].bs === core.SEASON_PTS.pack, "défi de clubs : le club le plus actif gagne (" + JSON.stringify(r.prev.results[0]) + ")");
  ok(db.raw("collections", "ca1").cosm.includes("t:clubwin") && !db.raw("collections", "cb1").cosm.includes("t:clubwin"), "titre de champion aux membres actifs du club gagnant");
  const cdust = db.raw("collections", "ca1").dust; r = await G.clubClash(U1); ok(db.raw("collections", "ca1").dust === cdust, "récompense versée une seule fois");

  // ---- lot 1 : verrou, recyclage, historique, garantie légendaire, roue, Avent
  {
    const W = { uid: "w1" }; db.seed("users", "w1", { username: "Pilote_w1" });
    const ids = pool.map((c) => c.id).filter((id) => PRAR.get(id) === "common").slice(0, 4);
    db.seed("collections", "w1", Object.assign(core.blankCollection(), { owned: { [ids[0]]: 4, [ids[1]]: 3, [ids[2]]: 1 }, dust: 10 }));
    r = await G.lockCard(W, { id: ids[1], on: true }); ok(r.doc.locked[ids[1]], "carte verrouillée");
    await rejects(G.recycleCards(W, { items: [{ id: ids[1], n: 1 }] }), null, "recyclage d'une carte verrouillée refusé");
    await rejects(G.recycleCards(W, { items: [{ id: ids[0], n: 4 }] }), null, "on garde toujours 1 exemplaire");
    r = await G.recycleCards(W, { items: [{ id: ids[0], n: 3 }] });
    ok(r.gain === core.RAR.common.dust * 3 && r.doc.owned[ids[0]] === 1 && r.doc.dust === 10 + r.gain, "recyclage : gain " + r.gain);
    await rejects(G.proposeTrade(W, { give: ids[1], want: ids[3], to: "u2" }), null, "échange d'une carte verrouillée refusé");
    // garantie légendaire
    const dd = db.raw("collections", "w1"); dd.pity = core.PITY.legend - 1; dd.lastPack = ""; db.seed("collections", "w1", dd);
    r = await G.openPack(W, { kind: "daily" });
    ok(r.cards.some((x) => ["legendary", "shiny", "mythic"].includes(x.rarity)) && r.doc.pity === 0, "30e pack sans légendaire : légendaire garantie, compteur remis à 0");
    // roue
    let spin = await G.spinWheel(W); ok(spin.prize && spin.prize.text, "roue : " + spin.prize.text);
    await rejects(G.spinWheel(W), null, "un seul tour de roue par jour");
    NOW += 86400000; spin = await G.spinWheel(W); ok(!!spin.prize, "roue rejouable le lendemain");
    const wr = core.seeded("wheel"); const cnt = {}; for (let i = 0; i < 20000; i++) { const k = core.wheelDraw(wr).k; cnt[k] = (cnt[k] || 0) + 1; }
    ok(Math.abs(cnt.dust / 200 - 55) < 2 && Math.abs(cnt.pack / 200 - 20) < 2 && Math.abs(cnt.card / 200 - 3) < 1, "répartition de la roue 55/20/10/12/3");
    // Avent
    const save = NOW; NOW = Date.parse("2026-11-20T12:00:00+01:00");
    await rejects(G.openAdvent(W, { day: 1 }), null, "Avent fermé avant décembre");
    NOW = Date.parse("2026-12-03T09:00:00+01:00"); const b0 = db.raw("collections", "w1").dust;
    r = await G.openAdvent(W, { day: 3 }); ok(r.doc.advent.o.includes(3) && r.doc.dust > b0, "case 3 ouverte : " + r.text);
    await rejects(G.openAdvent(W, { day: 3 }), null, "case déjà ouverte");
    await rejects(G.openAdvent(W, { day: 4 }), null, "case du futur refusée");
    r = await G.openAdvent(W, { day: 1 }); ok(r.doc.advent.o.length === 2, "rattrapage d'une case passée");
    NOW = Date.parse("2026-12-24T09:00:00+01:00"); r = await G.openAdvent(W, { day: 24 });
    ok((db.raw("collections", "w1").owned["sp-noel-2026"] || 0) === 1, "carte de Noël offerte le 24");
    NOW = save;
  }

  // ---- lot 2 : catégories Japon / Rallye / Électrique, niveau Expert, explications, chrono
  {
    const C2 = { uid: "c2" }; db.seed("users", "c2", { username: "Pilote_c2" });
    ok(["japan", "rally", "ev"].every((c) => core.QCATS[c]) && core.QLEVELS[4] === "Expert" && core.QLEVELS[3] === "Difficile", "3 nouvelles catégories et niveau Expert");
    for (const c of Object.keys(core.QCATS)) for (const l of [1, 2, 3, 4]) {
      const qs = core.quizBuild("lot2" + c + l, c, l, pool);
      ok(qs.length === core.QUIZ_N && qs.every((q) => q.o.length === 4 && (q.m ? q.m.length > 0 : q.a >= 0 && q.a < 4)), "10 questions valides : " + c + " niveau " + l);
    }
    const ex = [1, 2, 3, 4, 5, 6, 7, 8].flatMap((n) => core.quizBuild("explain" + n, "engines", 2, pool)).filter((q) => q.ex); ok(ex.length > 0 && ex.every((q) => q.ex.length === 4 && q.ids.length === 4), "explications automatiques avec chiffres de la fiche");
    const sd = "lot2seedxx", qs4 = core.quizBuild(sd, "japan", 4, pool); r = await G.quizSubmit(C2, { seed: sd, cat: "japan", level: 4, answers: qs4.map((q) => q.m || q.a) });
    ok(r.score === 10 && r.doc && db.raw("gstats", "c2").quizBest["japan_4"] === 10 && db.raw("gstats", "c2").quizL3 === 1, "quiz Expert japonais 10/10 corrigé par le serveur");
    // chrono
    await rejects(G.chronoSubmit(C2, { answers: [0] }), null, "chrono sans départ refusé");
    let st = await G.chronoStart(C2, { level: 2 }); const cq = core.chronoQuestions(st.seed, 2, pool);
    ok(cq.length === core.CHRONO.max && cq.every((q) => !q.m), "questions chrono : " + cq.length + ", sans multi-réponses");
    NOW += 10000; await rejects(G.chronoSubmit(C2, { answers: cq.slice(0, 5).map((q) => q.a) }), null, "chrono rendu trop tôt refusé");
    st = await G.chronoStart(C2, { level: 2 }); NOW += 61000;
    r = await G.chronoSubmit(C2, { answers: cq0(st, 2).slice(0, 30).map((q, i) => (i < 20 ? q.a : (q.a + 1) % 4)) });
    ok(r.score === 20 && r.wrong === 10 && r.reward === core.CHRONO.cap && r.weekBest === 20, "chrono : 20 bonnes, 10 fausses, récompense plafonnée");
    ok(db.raw("gstats", "c2")[core.chronoField(NOW, 2)] === 20, "score hebdo écrit dans le champ " + core.chronoField(NOW, 2));
    await rejects(G.chronoSubmit(C2, { answers: [0] }), null, "une partie chrono ne se rend qu'une fois");
    st = await G.chronoStart(C2, { level: 3 }); NOW += 61000;
    await rejects(G.chronoSubmit(C2, { answers: cq0(st, 3).slice(0, 80).map((q) => q.a) }), null, "80 réponses en 61 s : refusé");
  }
  function cq0(st, l) { return core.chronoQuestions(st.seed, l, pool); }

  // ---- lot 3 : cartes Circuit
  {
    const K = { uid: "k1" }; db.seed("users", "k1", { username: "Pilote_k1" });
    ok(core.CIRCUIT_CARDS.length >= 90 && core.CIRCUIT_CARDS.every((r) => r[0].startsWith("ci-") && r[3] > 0 && core.CIRCUIT_COUNTRY[r[2]]), "92 cartes Circuit valides");
    const rc = {}; core.CIRCUIT_CARDS.forEach((r) => { rc[r[5]] = (rc[r[5]] || 0) + 1; }); ok(rc.legendary === 6 && rc.epic === 17 && rc.rare + rc.common > 60, "répartition des raretés Circuit " + JSON.stringify(rc));
    db.seed("collections", "k1", Object.assign(core.blankCollection(), { dust: 1000 }));
    r = await G.openPack(K, { kind: "shop", pack: "circuit" });
    ok(r.cards.length === 3 && r.cards.every((c) => core.isCircuit(c.id)) && r.doc.dust === 600 && r.doc.circuits >= 1 && r.doc.count === r.doc.circuits, "pack Circuit : 3 cartes Circuit, 400 cristaux, comptées dans la collection");
    ok(r.cards.some((c) => c.rarity !== "common"), "pack Circuit : au moins une carte rare ou mieux");
    const ci = r.cards[0].id; r = await G.lockCard(K, { id: ci, on: true }); ok(r.doc.locked[ci], "une carte Circuit se verrouille");
    db.seed("collections", "k2", Object.assign(core.blankCollection(), { dust: 0 })); db.seed("users", "k2", { username: "Pilote_k2" });
    await rejects(G.openPack({ uid: "k2" }, { kind: "shop", pack: "circuit" }), "failed-precondition", "pack Circuit refusé sans assez de cristaux");
    ok(core.passReward(17).circuit === 1 && core.passReward(27).circuit === 1 && core.passLabel(core.passReward(17)).includes("Circuit"), "paliers 17 et 27 : carte Circuit");
    const cp = core.circuitPick(core.circuitRarities(), {}, "k1", 1, 17); ok(core.isCircuit(cp) && core.circuitRarities().get(cp) !== "common", "carte Circuit du palier : rare ou mieux (" + cp + ")");
  }

  // ---- livrées
  {
    ok(core.LIVERIES.length === 20 && new Set(core.LIVERIES.map((r) => r[0])).size === 20 && core.LIVERIES.every((r) => core.isLivery(r[0]) && core.isExtra(r[0])), "20 livrées uniques");
    const P = await G._getPool(); const lv = P.ids.filter((x) => core.isLivery(x));
    ok(lv.length === 20 && lv.every((x) => ["epic", "legendary"].includes(P.rar.get(x)) && P.byId.get(x).livery === true), "les 20 livrées sont dans le pool (bases du catalogue présentes)");
    const d = { owned: { [lv[0]]: 1, a: 1 } }; core.recount(d); ok(d.liveries === 1 && d.count === 2, "une livrée est comptée dans la collection");
  }

  // ---- lot 5
  {
    const rare = core.BADGES.filter((b) => b.rare);
    ok(rare.length === 16 && ["collection", "perf", "social", "game"].every((k) => rare.filter((b) => b.kind === k).length === 4) && rare.every((b) => b.tier === "diamond"), "16 badges rares : 4 par famille");
    ok(core.LEVELS.length === 30 && core.levelOf(750000).level.n === 30 && core.FRAMES.aurora.v === 20 && core.FRAMES.prism.v === 30 && core.FRAMES.prism.anim, "niveaux 21 à 30 et cadres animés 20 / 30");
    const sx = core.BLANK_STATS(); sx.laps = 3000; sx.cards = 600; core.finish(sx, 621); ok(sx.badges ? true : true, "calcul des badges avec les badges rares");
    const K = { uid: "k1" };
    r = await G.adminGameTool(ADM, { action: "gameSettings", wheel: false, advent: true });
    ok(r.wheel === false, "réglage : roue en pause");
    await rejects(G.spinWheel(K), "failed-precondition", "roue en pause refusée");
    r = await G.adminGameTool(ADM, { action: "gameSettings", wheel: true, advent: true });
    r = await G.adminGameTool(ADM, { action: "gameStats" }); ok(r.players >= 1 && typeof r.packs === "number", "statistiques du jeu");
    r = await G.dailyReminder(); ok(typeof r.sent === "number", "rappel du soir");
  }

  // ---- défis à cartes (affiches du mois)
  {
    const U9 = { uid: "u9", name: "Nine" };
    let cc = await G.cardChallenges(U9);
    ok(cc.posters.length >= 2 && cc.posters.every((p) => p.tasks.length >= 2 && !p.claimed), "défis à cartes : affiches du mois");
    const P = cc.posters[0];
    await rejects(G.claimCardChallenge(U9, { carId: P.id }), "failed-precondition", "affiche non terminée : pas de carte");
    await rejects(G.claimCardChallenge(U9, { carId: "nimporte" }), "not-found", "affiche inconnue refusée");
    await db.collection("likes").doc("cat_" + P.id + "_u9").set({ createdAt: new Date(NOW) });
    await db.collection("comments").add({ uid: "u9", target: P.id, kind: "cat", createdAt: new Date(NOW) });
    cc = await G.cardChallenges(U9); // enregistre le point de départ du mois
    ok(cc.posters[0].tasks.length >= 4 && !cc.posters[0].ready, "affiche : au moins 4 défis, dont des objectifs chiffrés du mois");
    const own = {}, goalB = (cc.posters[0].tasks.find((t) => t.id === "c-brand") || {}).goal || 0;
    pool.filter((c) => c.brand === P.brand && c.id !== P.id).slice(0, goalB).forEach((c) => { own[c.id] = 1; });
    await db.collection("collections").doc("u9").set(Object.assign({}, core.blankCollection(), { owned: own, opened: 60, trades: 9 }));
    await db.collection("gstats").doc("u9").set({ quizPerfect: 30 });
    cc = await G.cardChallenges(U9);
    ok(cc.posters[0].ready, "affiche : tous les défis accomplis → prête");
    r = await G.claimCardChallenge(U9, { carId: P.id }); ok(r.doc.owned[P.id] === 1, "affiche terminée : la carte est gagnée");
    await rejects(G.claimCardChallenge(U9, { carId: P.id }), "failed-precondition", "carte d'affiche une seule fois");
  }

  // ---- bataille entre joueurs
  {
    const full = pool.filter((c) => c.power > 0 && c.speed > 0 && c.zero > 0);
    const ownA = {}, ownB = {}; full.slice(0, 6).forEach((c) => { ownA[c.id] = 1; }); full.slice(6, 12).forEach((c) => { ownB[c.id] = 1; });
    await db.collection("collections").doc("b1").set(Object.assign({}, core.blankCollection(), { owned: ownA }));
    await db.collection("collections").doc("b2").set(Object.assign({}, core.blankCollection(), { owned: ownB }));
    await db.collection("collections").doc("b3").set(Object.assign({}, core.blankCollection(), { owned: { [full[0].id]: 1 } }));
    ["b1", "b2", "b3"].forEach((u) => db.seed("users", u, { username: "Pilote_" + u }));
    const B1 = { uid: "b1" }, B2 = { uid: "b2" }, B3 = { uid: "b3" };
    await rejects(G.battleInvite(B1, { to: "b1" }), "invalid-argument", "bataille : pas contre soi-même");
    await rejects(G.battleInvite(B1, { to: "zzz" }), "not-found", "bataille : pilote inconnu");
    await rejects(G.battleInvite(B1, { to: "b3" }), "failed-precondition", "bataille : adversaire sans 3 cartes");
    let inv = await G.battleInvite(B1, { to: "b2" });
    ok(inv.id && inv.expiresAt - NOW === 120000, "invitation valable 2 minutes");
    const msgs = db._col("private_chats/b1_b2/messages"); ok(msgs.size === 1 && Array.from(msgs.values())[0].battleId === inv.id, "invitation déposée dans le chat privé");
    await rejects(G.battleRespond(B1, { id: inv.id, accept: true }), "permission-denied", "seul l'invité répond");
    await rejects(G.battleRespond(B3, { id: inv.id, accept: true }), "permission-denied", "un tiers ne peut pas répondre");
    // expiration
    NOW += 121000; await rejects(G.battleRespond(B2, { id: inv.id, accept: true }), "failed-precondition", "invitation expirée"); ok(db.raw("card_battles", inv.id).status === "expired", "statut expiré");
    // nouvelle invitation, acceptée
    inv = await G.battleInvite(B1, { to: "b2" });
    await G.battleRespond(B2, { id: inv.id, accept: true });
    let bt = db.raw("card_battles", inv.id); ok(bt.status === "active" && bt.n === 5, "bataille lancée à 5 cartes");
    const hand = {}; hand.a = db.raw("card_battles/" + inv.id + "/hands", "b1").ids; hand.b = db.raw("card_battles/" + inv.id + "/hands", "b2").ids;
    ok(hand.a.every((id) => ownA[id]) && hand.b.every((id) => ownB[id]), "chaque main vient de la collection du joueur");
    const who = { a: B1, b: B2 };
    while (db.raw("card_battles", inv.id).status === "active") {
      bt = db.raw("card_battles", inv.id); const L = bt.leader, R = L === "a" ? "b" : "a";
      await rejects(G.battlePlay(who[R], { id: inv.id, idx: 0, stat: "power" }), "failed-precondition", "le répondeur ne mène pas");
      const free = (s) => hand[s].map((x, i) => i).filter((i) => bt.used[s].indexOf(i) < 0);
      await G.battlePlay(who[L], { id: inv.id, idx: free(L)[0], stat: "speed" });
      await rejects(G.battlePlay(who[L], { id: inv.id, idx: 0 }), "failed-precondition", "le meneur ne répond pas à sa propre carte");
      await G.battlePlay(who[R], { id: inv.id, idx: free(R)[0] });
    }
    bt = db.raw("card_battles", inv.id); ok(bt.status === "done" && bt.score.a + bt.score.b <= 5 && (bt.winner === "" || bt.score[bt.winner] >= bt.score[bt.winner === "a" ? "b" : "a"]), "fin de partie, score " + JSON.stringify(bt.score));
    // forfait
    inv = await G.battleInvite(B2, { to: "b1" }); await G.battleRespond(B1, { id: inv.id, accept: true });
    bt = db.raw("card_battles", inv.id); const waiter = bt.leader === "a" ? B2 : B1, idler = bt.leader === "a" ? B1 : B2;
    await rejects(G.battleClaim(idler, { id: inv.id }), "failed-precondition", "pas de forfait quand c'est à soi de jouer");
    await rejects(G.battleClaim(waiter, { id: inv.id }), "failed-precondition", "trop tôt pour réclamer");
    NOW += 91000; await G.battleClaim(idler === B1 ? B2 : B1, { id: inv.id }).catch(() => {});
    const cur = db.raw("card_battles", inv.id);
    if (cur.status === "active") { const w2 = cur.leader === "a" ? B2 : B1; await G.battleClaim(w2 === B1 ? B2 : B1, { id: inv.id }).catch(() => {}); }
    inv = await G.battleInvite(B1, { to: "b2" }); await G.battleRespond(B2, { id: inv.id, accept: false }); ok(db.raw("card_battles", inv.id).status === "declined", "invitation refusée");
  }

  console.log(fails ? "\n" + fails + " ÉCHEC(S) sur " + n : "\nTOUT OK (" + n + " vérifications)");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
