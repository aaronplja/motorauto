/** Plus ou moins : chaque modèle d'une fiche multi-modèles est une entrée séparée — node tests/variants.test.js */
const assert = require("assert");
const core = require("../js/game-core.js");
const stat = require("../functions/catalog-static.json");
const variants = require("../functions/catalog-variants.json");
let n = 0; const ok = (c, m) => { assert(c, m); n++; };

const bases = new Set(variants.map((v) => v.base));
ok(variants.length > 300, "beaucoup de modèles séparés");
ok(variants.every((v) => v.id === v.base + "~" + v.id.split("~")[1] && v.power > 0 && v.name && v.label), "variantes bien formées");
ok(new Set(variants.map((v) => v.id)).size === variants.length, "identifiants uniques");
ok([...bases].every((b) => stat.some((c) => c.id === b)), "chaque variante pointe vers une fiche existante");
ok([...bases].every((b) => variants.filter((v) => v.base === b).length >= 2), "au moins deux modèles par fiche éclatée");

const list = stat.filter((c) => !bases.has(c.id)).concat(variants), byId = new Map(list.map((c) => [c.id, c]));
let seed = 7; const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
let seenVariant = 0, prev = null;
for (let i = 0; i < 600; i++) {
  const p = core.pmPair(list, rng, prev, i % 12);
  ok(p && p.a !== p.b, "paire valide");
  const a = byId.get(p.a), b = byId.get(p.b);
  ok(a && b, "les deux voitures existent");
  ok((a.base || a.id) !== (b.base || b.id), "jamais deux modèles de la même fiche face à face");
  ok(core.pmWinner(p, byId) === "a" || core.pmWinner(p, byId) === "b", "un gagnant est désigné");
  if (a.base || b.base) seenVariant++;
  prev = p;
}
ok(seenVariant > 50, "les modèles séparés sortent bien (" + seenVariant + "/600)");
console.log("variants.test OK : " + n + " vérifications");
