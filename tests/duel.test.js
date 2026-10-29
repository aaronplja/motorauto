"use strict";
const assert = require("assert");
const E = require("../js/duel-engine.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const car = (o) => Object.assign({ hp: 200, kg: 1300, drive: "F", vmax: 230, zero: 7, year: 2010, category: "Coupé", name: "x" }, o);

// calage sur le 0-100 publié
[[177, 1130, "F", 220, 7.4, 2003], [230, 1350, "F", 250, 6.4, 2013], [115, 960, "R", 195, 9.4, 1990], [570, 1740, "A", 315, 2.9, 2012]].forEach(([hp, kg, d, v, z, y]) => {
  const s = E.simulate(car({ hp, kg, drive: d, vmax: v, zero: z, year: y }));
  ok(Math.abs(s.t100 - z) < 0.35, "0-100 calé " + z + " → " + s.t100.toFixed(2));
  ok(s.t100 < s.t400 && s.t400 < s.t1000, "temps croissants");
  ok(s.vmax > 0, "vitesse maxi");
});
// plus de puissance = plus vite (sans 0-100 publié)
const a = E.simulate(car({ hp: 150, zero: 0, vmax: 0 })), b = E.simulate(car({ hp: 300, zero: 0, vmax: 0 }));
ok(b.t400 < a.t400 && b.v400 > a.v400, "puissance : 400 m plus court, vitesse de passage plus haute");
// plus lourd = plus lent
ok(E.simulate(car({ kg: 1800, zero: 0, vmax: 0 })).t400 > E.simulate(car({ kg: 1100, zero: 0, vmax: 0 })).t400, "poids");
// sol mouillé : la propulsion puissante perd beaucoup, le 4x4 peu
const dry = (d) => E.simulate(car({ hp: 500, kg: 1600, drive: d, zero: 0, vmax: 300 }), { surface: "dry" }), wet = (d) => E.simulate(car({ hp: 500, kg: 1600, drive: d, zero: 0, vmax: 300 }), { surface: "wet" });
ok(wet("R").t100 - dry("R").t100 > 1.5, "propulsion sur le mouillé : grosse perte");
ok(wet("A").t100 - dry("A").t100 < wet("R").t100 - dry("R").t100, "le 4x4 perd moins que la propulsion");
// pilote
ok(E.simulate(car({ zero: 0, vmax: 0 }), { driver: "amateur" }).t400 > E.simulate(car({ zero: 0, vmax: 0 }), { driver: "pro" }).t400, "pilote pro plus rapide");
// boîte : séquentielle plus rapide qu'une manuelle ancienne
ok(E.build({ hp: 300, kg: 900, year: 1995, category: "Le Mans" }).shift < E.build({ hp: 100, kg: 900, year: 1975, category: "Coupé" }).shift, "temps de passage");
// vitesse maxi inatteignable : 200 km/h non atteint
ok(E.simulate(car({ hp: 70, kg: 1000, vmax: 160, zero: 14, year: 1985 })).t200 == null, "200 km/h non atteint par une 160 km/h");
// interpolation
const s = E.simulate(car({})); const f = E.at(s, 3); ok(f.x > 0 && f.v > 0 && f.g >= 1, "échantillon à t=3 s");
console.log(n + " vérifications duel OK");
