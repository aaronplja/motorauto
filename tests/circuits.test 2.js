const assert = require("assert");
const C = require("../js/data-circuits.js");
assert(C.list.length > 300, "liste assez complète");
assert.strictEqual(new Set(C.list.map((c) => c.key)).size, C.list.length, "clés uniques");
assert.strictEqual(C.canon("nurburgring nordschleife").name, "Nürburgring – Nordschleife");
assert.strictEqual(C.canon("Dijon").name, "Dijon-Prenois");
assert.strictEqual(C.canon("circuit inconnu xyz"), null);
assert.strictEqual(C.canonKey("Circuit inconnu XYZ"), "circuit inconnu xyz");
console.log("circuits OK", C.list.length);
