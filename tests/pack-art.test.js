/** Faces de packs : tous les packs et thèmes se construisent, SVG valides ; chaque rareté a son style de carte : node tests/pack-art.test.js */
"use strict";
const fs = require("fs"), path = require("path");
global.window = { MA: { register(n, a) { global.window["MA" + n] = a; } } };
const G = require("../js/game-core");
require("../js/game/pack-art.js");
const A = global.window.MAPackArt;
let n = 0, fails = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
ok(!!A && typeof A.face === "function", "MAPackArt est exposé");

const themes = Object.values(G.THEME_PACKS || {});
ok(themes.length >= 10, themes.length + " packs thématiques");
themes.forEach((t) => A.addTheme(t));

const ids = new Set([].concat(
  Object.keys(G.PACKS).map((k) => A.idFor(k, "")),
  themes.map((t) => t.id),
  ["daily", "bonus", "test", "", "inconnu"].map((k) => A.idFor("", k))
));
ok(ids.size >= 20, ids.size + " ids de packs distincts testés");
const balanced = (s, tag) => (s.match(new RegExp("<" + tag + "[\\s>/]", "g")) || []).length === (s.match(new RegExp("</" + tag + ">", "g")) || []).length + (s.match(new RegExp("<" + tag + "[^>]*/>", "g")) || []).length;
const seen = new Set();
ids.forEach((id) => {
  [["face", A.face(id)], ["dos", A.face(id, { back: true })], ["fond", A.bg(id)]].forEach(([k, h]) => {
    ok(typeof h === "string" && h.length > 200, id + " (" + k + ") : rendu non vide");
    ok(!/undefined|NaN|\[object/.test(h), id + " (" + k + ") : aucune valeur manquante");
    ok(balanced(h, "svg") && balanced(h, "defs") && balanced(h, "pattern") && balanced(h, "g"), id + " (" + k + ") : balises SVG équilibrées");
    (h.match(/ id="([^"]+)"/g) || []).forEach((m) => { ok(!seen.has(m), id + " : identifiant SVG unique " + m); seen.add(m); });
  });
  const f = A.face(id), b = A.face(id, { back: true });
  ok(/MOTORAUTO/.test(f) && !/MOTORAUTO|cartes?<|mieux|jour/.test(b.replace(/<svg[\s\S]*?<\/svg>/g, "")), id + " : le dos n'a ni marque ni nombre de cartes");
  ok(/^#|rgb|hsl/i.test(A.color(id)), id + " : couleur définie");
});
// les motifs propres : chaque thème n'a pas le motif générique (rayures + anneau)
const gen = (h) => /M-10 120 90 -10M14 150 114 20M-34 90 66 -40/.test(h);
themes.forEach((t) => ok(!gen(A.bg(t.id)), t.id + " : motif dédié"));

// raretés : chaque échelon / rareté interne a son style de carte dans le CSS
const css = ["css/components/cards.css", "css/components/cards2.css", "css/components/card-style.css", "css/components/cards-dual.css"].map((f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8")).join("\n");
Object.keys(G.RAR).forEach((r) => ok(new RegExp("\\.tcg-" + r + "\\b").test(css), "rareté « " + r + " » : style .tcg-" + r + " présent"));
console.log(fails ? fails + " ÉCHEC(S) sur " + n : "OK " + n + " vérifications (packs et cartes)");
process.exit(fails ? 1 : 0);
