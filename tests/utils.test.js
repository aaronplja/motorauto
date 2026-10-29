const assert = require("assert");
const MA = require("../js/utils.js");

let passed = 0;
function test(name, fn) { fn(); passed++; console.log("  ok -", name); }

test("esc neutralise le HTML et les quotes", () => {
  assert.strictEqual(MA.esc(`<img src=x onerror="a('b')">`), "&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;");
  assert.strictEqual(MA.esc(null), "");
});

test("safeUrl refuse javascript: et data: non image", () => {
  assert.strictEqual(MA.safeUrl("javascript:alert(1)"), "");
  assert.strictEqual(MA.safeUrl("data:text/html;base64,AAAA"), "");
  assert.strictEqual(MA.safeUrl("https://x.com/a.png"), "https://x.com/a.png");
  assert.strictEqual(MA.safeUrl("img/206-rc.jpg"), "img/206-rc.jpg");
  assert.strictEqual(MA.safeUrl("data:image/png;base64,AAAA", { allowData: true }), "data:image/png;base64,AAAA");
  assert.strictEqual(MA.safeUrl("data:image/png;base64,AAAA"), "");
});

test("parseLapTime : formats valides", () => {
  assert.strictEqual(MA.parseLapTime("7:44.88"), 464880);
  assert.strictEqual(MA.parseLapTime("1:04.2"), 64200);
  assert.strictEqual(MA.parseLapTime("10:05,123"), 605123);
  assert.strictEqual(MA.parseLapTime("2:04"), 124000);
});

test("parseLapTime : formats invalides", () => {
  for (const bad of ["", "abc", "7:99.00", "0:05.00", "61:00.00", "7.44.88", "Spéciale", "317 km/h"]) {
    assert.strictEqual(MA.parseLapTime(bad), null, bad);
  }
});

test("tri numérique : 7:44 passe avant 10:05 (bug localeCompare)", () => {
  const laps = [{ chrono: "10:05.20" }, { chrono: "7:44.88" }, { chrono: "1:04.20" }, { chrono: "n'importe quoi" }];
  const sorted = MA.sortLaps(laps).map((l) => l.chrono);
  assert.deepStrictEqual(sorted, ["1:04.20", "7:44.88", "10:05.20", "n'importe quoi"]);
});

test("formatLapTime aller-retour", () => {
  assert.strictEqual(MA.formatLapTime(MA.parseLapTime("7:44.88")), "7:44.880");
  assert.strictEqual(MA.formatLapTime(64200), "1:04.200");
});

test("trackKey regroupe les variantes d'un circuit", () => {
  assert.strictEqual(MA.trackKey("Nürburgring  Nordschleife"), MA.trackKey("nurburgring nordschleife"));
});

test("brandGroup", () => {
  assert.strictEqual(MA.brandGroup("Renault Sport"), "Renault");
  assert.strictEqual(MA.brandGroup("Nissan / Datsun"), "Nissan");
  assert.strictEqual(MA.brandGroup("Vilebrequin & W Auto Sport"), "Vilebrequin");
  assert.strictEqual(MA.brandGroup("Citroën Racing"), "Citroën");
  assert.strictEqual(MA.brandGroup("Peugeot / Pininfarina"), "Peugeot");
});

test("normalizeCar : types numériques, stats, moteurs vides", () => {
  const car = MA.normalizeCar({
    id: "x", brand: "Peugeot", model: "206",
    phases: [{ phaseName: "P1", engines: [{ name: "a", power: "138", speed: 210, zeroToHundred: "8.3" }] }]
  });
  assert.strictEqual(car.stats.power, 138);
  assert.strictEqual(car.stats.zero, 8.3);
  const empty = MA.normalizeCar({ id: "y", phases: [{ phaseName: "P", engines: [] }] });
  assert.strictEqual(empty.stats.power, 0);
  assert.strictEqual(empty.stats.zero, null);
  assert.ok(MA.normalizeCar({ id: "z" }).phases.length === 1);
});

test("recherche sans accents et multi-mots", () => {
  const car = MA.normalizeCar({ id: "c", brand: "Citroën", model: "Xsara VTS", phases: [{ phaseName: "p", engines: [{ name: "2.0 16V XU10J4RS" }] }] });
  assert.ok(MA.matchesQuery(car, "citroen"));
  assert.ok(MA.matchesQuery(car, "xsara xu10j4rs"));
  assert.ok(!MA.matchesQuery(car, "xsara golf"));
});

test("recherche tolérante : fautes, surnoms, mots collés", () => {
  const car = MA.normalizeCar({ id: "g", brand: "Volkswagen", model: "Golf 7 GTI Clubsport", phases: [{ phaseName: "p", engines: [{ name: "2.0 TSI" }] }] });
  assert.ok(MA.matchesQuery(car, "volkswagon"), "faute de frappe");
  assert.ok(MA.matchesQuery(car, "vw"), "surnom");
  assert.ok(MA.matchesQuery(car, "golf7"), "mots collés");
  assert.ok(MA.matchesQuery(car, "gti clubsprot"), "lettres inversées");
  assert.ok(!MA.matchesQuery(car, "ferrari"), "pas de faux positif");
  assert.ok(!MA.matchesQuery(car, "clio"), "pas de faux positif court");
});

test("authErrorMessage", () => {
  assert.strictEqual(MA.authErrorMessage({ code: "auth/email-already-in-use" }), "Cette adresse e-mail est déjà utilisée.");
  assert.ok(MA.authErrorMessage({}).length > 0);
});

// Données réelles : tout le catalogue doit se normaliser sans erreur
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/../js/data.js", "utf8").replace(/^const MOTORAUTO_DATABASE/m, "var MOTORAUTO_DATABASE")
  + "\n" + fs.readFileSync(__dirname + "/../js/data2.js", "utf8");
const db = new Function(src + ";return MOTORAUTO_DATABASE;")();
test(`catalogue réel (${db.length} véhicules) normalisé sans erreur`, () => {
  const cars = db.map(MA.normalizeCar);
  assert.ok(cars.every((c) => c.stats.power > 0 && c.stats.speed > 0));
  assert.ok(cars.every((c) => c.stats.zero > 0));
  const groups = new Set(cars.map((c) => c.group));
  assert.ok(groups.has("Nissan") && groups.has("Renault") && !groups.has("Nissan /"));
});

test("catégories : transmission et turbo", () => {
  const car = (id, names, category) => ({ id, category: category || "Coupé", phases: [{ engines: names.map((name) => ({ name })) }] });
  assert.strictEqual(MA.driveOf(car("mazda-mx5-na", ["1.6"])), "Propulsion");
  assert.strictEqual(MA.driveOf(car("nissan-skyline-gtr-r34", ["RB26 Biturbo"])), "4x4");
  assert.strictEqual(MA.driveOf(car("peugeot-106-s16", ["1.6 16V"])), "Traction");
  assert.strictEqual(MA.driveOf({ id: "x", drive: "4x4" }), "4x4");
  assert.strictEqual(MA.isTurbo(car("a", ["2.0 TFSI"])), true);
  assert.strictEqual(MA.isTurbo(car("a", ["1.6 16V"])), false);
  assert.strictEqual(MA.isTurbo(car("a", ["1.8T 20V"])), true);
  assert.strictEqual(MA.inCategory(car("peugeot-106-s16", ["1.6"]), "traction"), true);
  assert.strictEqual(MA.inCategory(car("peugeot-106-s16", ["1.6"]), "propulsion"), false);
  assert.strictEqual(MA.inCategory(car("a", ["x"], "Coupé"), "coupé"), true);
  assert.strictEqual(MA.inCategory(car("a", ["x"]), "all"), true);
});

test("CSV : aller-retour, regroupement des moteurs, erreurs", () => {
  const csv = "id;marque;modele;annees;categorie;image;description;records;phase;phase_details;editions;engine;power;torque;speed;zero;transmission\n"
    + 'test-car;Test;Car GT;1999 - 2004;Coupé;https://x.com/a.jpg;"Une ""belle"" voiture\nsur 2 lignes";Ring|8:00||Anecdote|Truc;Phase 1;;Série A||Série B;1.6 16V;120;150;200;8,5;Manuelle 5\n'
    + "test-car;;;;;;;;Phase 2;;;2.0 Turbo;200;280;240;6.1;Manuelle 6\n"
    + "bad;Foo;Bar;;;;;;;;;moteur;abc;1;1;1;x\n";
  const r = MA.csvToCars(csv);
  assert.strictEqual(r.cars.length, 1);
  assert.strictEqual(r.errors.length, 1);
  const c = r.cars[0];
  assert.strictEqual(c.phases.length, 2);
  assert.strictEqual(c.phases[0].engines[0].zeroToHundred, 8.5);
  assert.strictEqual(c.description, 'Une "belle" voiture\nsur 2 lignes');
  assert.strictEqual(c.records.length, 2);
  assert.deepStrictEqual(c.phases[0].notableEditions, ["Série A", "Série B"]);
  const back = MA.csvToCars(MA.carsToCsv(r.cars));
  assert.strictEqual(back.errors.length, 0);
  assert.strictEqual(back.cars[0].phases[1].engines[0].name, "2.0 Turbo");
  assert.strictEqual(back.cars[0].description, c.description);
  assert.strictEqual(MA.csvToCars("a,b\n1,2").errors.length > 0, true);
  // tout le catalogue réel survit à l'aller-retour
  const real = db.map(MA.normalizeCar);
  const rt = MA.csvToCars(MA.carsToCsv(real, ","));
  assert.strictEqual(rt.cars.length, real.length, rt.errors.slice(0, 3).join(" | "));
});

test("moteurs : clé, index partagé et nouveaux champs de fiche", () => {
  assert.strictEqual(MA.engineKey({ name: "1.6 16V (TU5JP4)" }), "tu5jp4");
  assert.strictEqual(MA.engineKey({ name: "2.0 Turbo", code: "EJ20" }), "ej20");
  assert.strictEqual(MA.engineKey({ name: "V8 Biturbo" }), "v8-biturbo");
  const real = db.map(MA.normalizeCar), idx = MA.buildEngineIndex(real);
  const shared = Array.from(idx.values()).filter((e) => new Set(e.cars.map((c) => c.car.id)).size > 1);
  assert.ok(shared.length > 0, "au moins un moteur partagé entre plusieurs voitures");
  const c = MA.normalizeCar({ id: "x", brand: "A", model: "B", history: "h", anecdotes: ["a", { title: "t", text: "u" }, { text: "" }], archives: [{ title: "Brochure 1998", url: "https://x.fr/a.pdf" }, { title: "KO", url: "javascript:1" }], phases: [] });
  assert.strictEqual(c.anecdotes.length, 2); assert.strictEqual(c.archives.length, 1); assert.strictEqual(c.history, "h");
});

console.log(`\n${passed} tests réussis`);
