/* Tests des données et calculs des nouvelles fonctions (node tests/features.test.js) */
const fs = require("fs"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..");
const MA = require(path.join(root, "js/utils.js"));
const src = fs.readFileSync(path.join(root, "js/data.js"), "utf8").replace(/^const MOTORAUTO_DATABASE/m, "var MOTORAUTO_DATABASE") + "\n" + fs.readFileSync(path.join(root, "js/data2.js"), "utf8");
const cars = new Function(src + ";return MOTORAUTO_DATABASE;")().map(MA.normalizeCar);
const w = {}; new Function("window", fs.readFileSync(path.join(root, "js/data-extra.js"), "utf8"))(w);
const X = w.MAExtra;
let n = 0; const t = (name, fn) => { fn(); n++; console.log("  ok - " + name); };

t("chaque fiche a une ligne dans data-extra (poids, transmission, budget)", () => {
  const missing = cars.filter((c) => !X.table[c.id]).map((c) => c.id);
  assert.deepStrictEqual(missing, [], "fiches sans données : " + missing.join(", "));
});
t("poids et budgets plausibles", () => {
  cars.forEach((c) => { const x = X.carExtra(c); assert(x.kg >= 500 && x.kg <= 2600, c.id + " poids " + x.kg); assert(x.band >= 1 && x.band <= 5, c.id + " budget"); assert("FRAM".includes(x.drive), c.id + " transmission"); });
});
t("rapport poids/puissance cohérent", () => {
  cars.forEach((c) => { const p = X.powerToWeight(c); if (p) assert(p.hpPerTon > 20 && p.hpPerTon < 2000, c.id + " ch/t " + p.hpPerTon); });
});
t("fiche inconnue : estimation", () => { const x = X.carExtra({ id: "zzz", category: "Break", stats: { power: 130 } }); assert(x.est && x.kg > 1000); });
t("règles Firestore : accolades équilibrées", () => {
  const r = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
  assert.strictEqual((r.match(/\{/g) || []).length, (r.match(/\}/g) || []).length);
  ["streaks", "collections", "reactions", "clubs", "club_members", "club_posts", "listings", "listing_reports", "circuit_info", "canned_replies", "costs", "journal"].forEach((k) => assert(r.includes("match /" + k + "/"), "règle manquante : " + k));
});
console.log(n + " tests réussis");
