/** Tests du jeu de cartes v4 : albums + cartes Légende, niveaux, offres du jour, missions : node tests/cards4.test.js */
"use strict";
const fs = require("fs"), path = require("path");
const core = require("../js/game-core");
const { createGame } = require("../functions/game");
const { FakeDb } = require("./fake-admin-db");
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const rejects = async (p, m) => { try { await p; ok(false, m + " (aucune erreur)"); } catch (e) { ok(!!e.isGame, m + " → " + (e.code || e.message)); } };
let NOW = Date.parse("2026-11-02T10:00:00+01:00");
const db = new FakeDb(() => NOW);
let seed = 777; const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pool = JSON.parse(fs.readFileSync(path.join(__dirname, "../functions/catalog-static.json"), "utf8"));
const G = createGame({ db, ts: () => db.ts(), rng, now: () => NOW, cardPool: async () => pool, isAdmin: async () => false });
const U = { uid: "u1" };
const col = async () => (await db.collection("collections").doc("u1").get()).data();

(async () => {
  const rar = core.computeRarities(pool), today = core.dayKey(NOW);
  // ---- cartes Légende
  const NLEG = Object.keys(core.LEGENDS).length;
  ok(core.LEGEND_IDS.length === NLEG && NLEG >= 50 && new Set(core.LEGEND_IDS).size === NLEG, NLEG + " légendes distinctes (pays, décennies, marques, collections)");
  ok(core.LEGEND_IDS.every((id) => pool.some((c) => c.id === id)), "chaque légende existe dans le catalogue");
  ok(core.LEGEND_IDS.every((id) => rar.get(id) === "mythic"), "les légendes ont la rareté « mythic »");
  ok(core.LEGEND_IDS.every((id) => !core.SHINY.includes(id)), "aucune légende n'est déjà Shiny");
  const bad = []; for (let i = 0; i < 4000; i++) { core.drawPack(rar, pool.map((c) => c.id), rng, i % 10 === 0, i % 30 === 0).concat(core.drawShopPack(rar, pool.map((c) => c.id), rng, "rare")).forEach((id) => { if (rar.get(id) === "mythic") bad.push(id); }); }
  ok(!bad.length, "aucune légende dans 4000 packs (" + bad.length + ")");
  // ---- albums
  const sets = core.setsOf(pool);
  const leg = sets.filter((s) => s.legend);
  ok(leg.length === NLEG && sets.some((s) => s.kind === "country") && sets.some((s) => s.kind === "decade") && sets.some((s) => s.kind === "brand"), "albums pays / décennies / marques : " + sets.length + " dont " + leg.length + " avec Légende");
  ok(leg.every((s) => s.ids.indexOf(s.legend) < 0 && s.ids.length >= 2), "la Légende n'est pas exigée dans son propre album");
  ok(sets.every((s) => new Set(s.ids).size === s.ids.length), "pas de doublon dans un album");
  ok(core.decadeOf({ years: "1984 - 1994" }) === 1980 && core.decadeOf({ year: 1937 }) === 1940 && core.decadeOf({ years: "" }) === 0, "décennies");
  // ---- niveaux
  ok(core.upgradeCost("common", 2) < core.upgradeCost("common", 3) && core.upgradeCost("epic", 2) > core.upgradeCost("common", 2) && core.upgradeCost("common", 6) === 0, "coût des niveaux croissant");
  // ---- offres et missions : même résultat partout, valeurs valides
  const o1 = core.dailyOffers(today, pool, rar), o2 = core.dailyOffers(today, pool.slice().reverse(), rar);
  ok(JSON.stringify(o1) === JSON.stringify(o2) && o1.card && o1.cardCost > 0 && o1.cardCost < o1.cardFull && core.PACKS[o1.pack], "offres identiques quel que soit l'ordre : " + JSON.stringify(o1));
  ok(core.offerPackCost("fr") === 175 && core.offerPackCost("de") === 140, "prix des packs à -30 % : " + core.offerPackCost("fr"));
  const ms = core.dailyMissions(today);
  ok(ms.length === 3 && new Set(ms.map((m) => m.id)).size === 3 && JSON.stringify(ms) === JSON.stringify(core.dailyMissions(today)), "3 missions distinctes et stables");
  const seen = new Set(); for (let d = 0; d < 40; d++) core.dailyMissions("2026-12-" + String(d + 1).padStart(2, "0")).forEach((m) => seen.add(m.type)); ok(seen.size >= 4, "variété des missions : " + Array.from(seen));

  // ---- serveur : niveaux
  const ids = pool.map((c) => c.id), c0 = ids.find((i) => rar.get(i) === "common");
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { owned: { [c0]: 1 }, count: 1, dust: 2000, bonus: 0 }));
  let r = await G.upgradeCard(U, { id: c0 });
  ok(r.level === 2 && r.doc.lv[c0] === 2 && r.doc.dust === 2000 - core.upgradeCost("common", 2), "niveau 2 : " + r.doc.dust + " cristaux restants");
  await G.upgradeCard(U, { id: c0 }); await G.upgradeCard(U, { id: c0 }); r = await G.upgradeCard(U, { id: c0 });
  ok(r.level === 5, "montée jusqu'au niveau " + r.doc.lv[c0]);
  await rejects(G.upgradeCard(U, { id: ids.find((i) => i !== c0) }), "améliorer une carte non possédée");
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { owned: { [c0]: 1 }, lv: { [c0]: 5 }, count: 1, dust: 9999 }));
  await rejects(G.upgradeCard(U, { id: c0 }), "niveau maximum");
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { owned: { [c0]: 1 }, count: 1, dust: 1 }));
  await rejects(G.upgradeCard(U, { id: c0 }), "pas assez de cristaux");

  // ---- serveur : légende d'album
  const se = sets.find((s) => s.id === "country:se"), owned = {}; se.ids.forEach((i) => { owned[i] = 1; });
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { owned, count: se.ids.length, dust: 0 }));
  r = await G.claimSets(U);
  ok(r.claimed.some((x) => x.id === "country:se") && r.legends.includes("rally-saab-96") && r.doc.owned["rally-saab-96"] === 1 && r.doc.dust >= se.reward, "album Suède : Légende + " + r.doc.dust + " cristaux");
  r = await G.claimSets(U); ok(!r.claimed.some((x) => x.id === "country:se"), "récompense versée une seule fois");
  await rejects(G.craftCard(U, { id: "rally-saab-96" }), "une Légende ne se fabrique pas");

  // ---- serveur : offre du jour (pack et carte), une fois par jour
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { dust: 1000, bonus: 0 }));
  const cost = core.offerPackCost(o1.pack);
  r = await G.openPack(U, { kind: "shop", pack: o1.pack, offer: true });
  ok(r.cards.length === 3 && r.doc.dust >= 1000 - cost && r.doc.dust <= 1000 - cost + 400, "pack en offre payé " + cost + " (reste " + r.doc.dust + ")");
  ok(r.missions && r.doc.mis.day === today, "missions suivies");
  await rejects(G.openPack(U, { kind: "shop", pack: o1.pack, offer: true }), "offre pack déjà utilisée");
  const other = core.COUNTRIES.find((k) => k.id !== o1.pack).id;
  await rejects(G.openPack(U, { kind: "shop", pack: other, offer: true }), "offre sur un autre pack refusée");
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { dust: 1000 }));
  r = await G.craftCard(U, { id: o1.card, offer: true });
  ok(r.doc.dust >= 1000 - o1.cardCost && r.doc.dust <= 1000 - o1.cardCost + 60 && r.doc.owned[o1.card] === 1, "carte du jour à " + o1.cardCost);
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { dust: 1000 }));
  await rejects(G.craftCard(U, { id: ids.find((i) => i !== o1.card && rar.get(i) === "rare"), offer: true }), "offre carte : mauvaise carte refusée");

  // ---- missions : récompense versée à la fin
  const mm = core.dailyMissions(today).find((m) => m.type === "shop");
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { dust: 1000 }));
  r = await G.openPack(U, { kind: "shop", pack: mm.country });
  ok(r.missions.names.indexOf(mm.label) >= 0 && r.doc.mis.done.indexOf(mm.id) >= 0, "mission « " + mm.label + " » terminée (+" + mm.reward + ")");
  // ---- saison 2 : Pack Prestige permanent et nouveaux packs thématiques
  db.seed("collections", "u1", Object.assign(core.blankCollection(), { dust: 2000 }));
  r = await G.openPack(U, { kind: "shop", pack: "prestige" });
  ok(r.cards.length === 3 && r.cards.every((c) => core.isPrestige(pool.find((p) => p.id === c.id))) && ["epic", "legendary", "shiny"].indexOf(r.cards[0].rarity) >= 0 && r.doc.dust === 2000 - core.PACKS.prestige.cost, "Pack Prestige : grandes marques, 1re carte épique ou mieux, " + core.PACKS.prestige.cost + " cristaux");
  const wk1 = (await db.collection("weekly").doc("u1").get()).data();
  ok(wk1 && wk1.logs.theme === 1 && wk1.logs.epic >= 1 && !wk1.packs, "défis de la semaine : Prestige compté (log:theme), épiques piochées, sans compter comme pack du jour");
  ok(["theme1", "epic2", "album1"].every((id) => core.CHALLENGES.some((c) => c.id === id && /^log:/.test(c.src))), "nouveaux défis hebdomadaires liés aux packs, raretés et albums");
  ok(core.cardChalCars("2026-11", pool.map((c) => c.id), rar).some((id) => rar.get(id) === "shiny") && core.CARD_GOALS.shiny.album >= 1, "affiche Shiny dans les défis à cartes du mois");
  ["th_hypercar", "th_classic", "th_sport_de", "th_prestige"].forEach((id) => ok(core.THEME_PACKS[id] && core.PACKS[id] && pool.filter((c) => core.themeMatch(id, c)).length >= 6, "pack thématique " + id + " jouable"));
  ok(core.PACKS.th_prestige.min === "epic" && core.PACKS.th_hypercar.min === "epic" && core.PACKS.th_jdm.min === "rare", "rareté minimale des packs thématiques");
  ok(core.countryOf("Hennessey") === "us" && core.countryOf("Isuzu") === "jp" && core.countryOf("SSC North America") === "us", "pays des constructeurs corrigés");
  ok(core.SHINY.length >= 30 && core.SHINY.every((i) => pool.some((c) => c.id === i)), core.SHINY.length + " cartes Shiny, toutes dans le catalogue");
  ok(core.PIN_EPIC.every((i) => pool.some((c) => c.id === i)) && core.PIN_EPIC.every((i) => ["epic", "legendary", "shiny", "mythic"].indexOf(rar.get(i)) >= 0), "icônes épiques au minimum");
  // ---- taux de drop recalculés d'après le nombre de cartes de chaque rareté
  { const dr = core.dropRates(rar), sum = dr.reduce((s, x) => s + x.odds, 0), pc = dr.map((x) => x.perCard);
    ok(Math.abs(sum - 1) < 1e-9 && pc.every((v, i) => i === 0 || v < pc[i - 1]), "taux de drop : somme = 100 % et chaque carte est plus rare à mesure que la rareté monte");
    ok(dr.find((x) => x.rarity === "common").odds > 0.55 && dr.find((x) => x.rarity === "shiny").odds < 0.01 && dr.find((x) => x.rarity === "legendary").odds < dr.find((x) => x.rarity === "epic").odds, "taux de drop cohérents (communes majoritaires, shiny < 1 %)"); }
  console.log(n + " vérifications cards4" + (fails ? " — " + fails + " ÉCHEC(S)" : " OK"));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
