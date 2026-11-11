/* Évolution de saison : « II », « III »… une fois la version précédente débloquée. */
const core = require("../js/game-core.js");
let n = 0, fails = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.error("ÉCHEC : " + m); } };
const cosm = [];
ok(core.nextVariant(cosm, "f", "s_gold") === "s_gold", "première saison : version de base");
ok(core.grantVariant(cosm, "f", "s_gold") === "s_gold" && cosm.indexOf("f:s_gold") >= 0, "accordée");
ok(core.nextVariant(cosm, "f", "s_gold") === "s_gold_2" && core.FRAMES.s_gold_2.name === "Saison II", "saison suivante : II");
ok(core.grantVariant(cosm, "f", "s_gold") === "s_gold_2" && core.grantVariant(cosm, "f", "s_gold") === "s_gold_3", "III à la suivante");
ok(core.FRAMES.s_gold_4.name === "Saison IV" && core.TITLES.t30_2.name === "Champion du pass II", "noms romains");
ok(core.FRAMES.s_eclipse_2.name === "Éclipse II (rare)" && core.FRAMES.s_eclipse_2.anim === true, "éclipse II conserve (rare)");
ok(core.FRAMES.s_gold_10 && !core.FRAMES.s_gold_11 && core.FRAMES.s_gold_10.name === "Saison X", "plafond X");
const inv = [], all = []; for (let i = 0; i < 12; i++) all.push(core.grantVariant(inv, "t", "t10"));
ok(all.slice(0, 10).every(Boolean) && all[10] === "" && all[11] === "", "plus rien à accorder au-delà de X (pas de doublon)");
ok(!core.FRAMES.aurora_2 && !core.FRAMES.gold_2 && !core.TITLES.rookie_2, "les cosmétiques de niveau ne sont pas concernés");
ok(Object.keys(core.FRAMES).every((id) => id.length <= 24), "identifiants ≤ 24 caractères (règle Firestore)");
// rang et quêtes
ok(core.seasonRank([]) === 1 && core.seasonRank(["f:quest"]) === 2 && core.seasonRank(["f:quest", "f:quest_2", "f:quest_3"]) === 4, "rang de saison");
const q1 = core.questList(1), q3 = core.questList(3);
ok(q1[0].goal === 10 && q1[0].label === "Ouvrir 10 packs" && q3[0].goal === 15 && q3[0].label.indexOf("(III)") > 0, "quêtes relevées au rang III");
ok(q3[3].dust > q1[3].dust, "récompense relevée");
const d = { cosm: ["f:quest"], season: null };
const s = core.seasonOf(d, Date.UTC(2026, 11, 10));
ok(s.rk === 2 && core.questState(s).quest.goal === 13, "nouvelle saison : rang 2 mémorisé, objectifs relevés");
d.cosm.push("f:quest_2"); ok(core.seasonOf(d, Date.UTC(2026, 11, 12)).rk === 2, "le rang ne change pas en cours de saison");
ok(core.passLabel(core.passReward(15), ["f:s_gold"], false).indexOf("Saison II") > 0 && core.passLabel(core.passReward(15)).indexOf("Saison") > 0, "libellé du palier selon le joueur");
console.log(fails ? "\n" + fails + " ÉCHEC(S) sur " + n : "season-rank.test : " + n + " vérifications OK"); process.exit(fails ? 1 : 0);
