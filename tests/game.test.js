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
  ok(r.cards.every((c) => ids.includes(c.id)), "cartes issues du catalogue");
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
    if (x.cards.length !== 2) shopBad++;
    if (!x.cards.some((c) => c.rarity !== "common")) shopBad++;
    shopDust = x.doc.dust;
  }
  await rejects(G.openPack(U4, { kind: "shop" }), "failed-precondition", "pack acheté : 3e achat refusé (poussière épuisée)");
  ok(shopBad === 0, "pack acheté : toujours 2 cartes dont 1 rare ou mieux");
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
  ok(r.freshBadges >= 1 && r.doc.claimed.includes("streak3") && r.doc.bonus === s0 + r.freshBadges, "badge « 3 jours d'affilée » → pack bonus (" + r.freshBadges + ")");
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

  console.log(fails ? "\n" + fails + " ÉCHEC(S) sur " + n : "\nTOUT OK (" + n + " vérifications)");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
