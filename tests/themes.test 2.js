/** Thèmes personnalisés et saisonniers : node tests/themes.test.js */
"use strict";
const T = require("../js/themes.js");
let n = 0, fails = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
let seed = 99; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const hex = () => "#" + Array.from({ length: 3 }, () => Math.floor(rnd() * 256).toString(16).padStart(2, "0")).join("");
let worst = { text: 99, muted: 99, accent: 99, onAccent: 99 };
for (let i = 0; i < 20000; i++) {
  const d = T.derive(hex(), hex());
  Object.keys(worst).forEach((k) => { worst[k] = Math.min(worst[k], d.ratio[k]); });
}
ok(worst.text >= 4.5, "texte lisible quel que soit le fond (pire cas " + worst.text.toFixed(2) + ")");
ok(worst.muted >= 4.5, "texte discret lisible (pire cas " + worst.muted.toFixed(2) + ")");
ok(worst.accent >= 3, "accent visible sur le fond (pire cas " + worst.accent.toFixed(2) + ")");
ok(worst.onAccent >= 4.5, "texte sur bouton d'accent lisible (pire cas " + worst.onAccent.toFixed(2) + ")");
// cas extrêmes
["#000000", "#ffffff", "#808080", "#777777", "#ff0000", "#00ff00"].forEach((bg) => ["#000000", "#ffffff", bg].forEach((ac) => { const d = T.derive(bg, ac); ok(d.ratio.text >= 4.5 && d.ratio.accent >= 3, "extrême " + bg + "/" + ac); }));
// code de partage
const c = { bg: "#0f172a", accent: "#38bdf8" };
ok(T.code(c) === "MA-0F172A-38BDF8" && JSON.stringify(T.parse(T.code(c))) === JSON.stringify(c), "code de partage aller-retour");
ok(T.parse("n'importe quoi") === null && T.parse("MA-12345-ABCDEF") === null, "code invalide refusé");
// saisons
const s = (m, d) => T.seasonNow({ m, d });
ok(s(10, 26) === null && s(10, 27) === "halloween" && s(11, 2) === "halloween" && s(11, 3) === null, "Halloween 27/10 → 2/11");
ok(s(12, 1) === null && s(12, 2) === "noel" && s(12, 28) === "noel", "Noël 2/12 → 28/12");
ok(s(12, 29) === "nouvelan" && s(12, 31) === "nouvelan" && s(1, 1) === "nouvelan" && s(1, 3) === "nouvelan" && s(1, 4) === null, "Nouvel an 29/12 → 3/1");
ok(s(7, 14) === null, "été : aucune saison");
console.log(fails ? "\n" + fails + " ÉCHEC(S) sur " + n : "themes.test : " + n + " vérifications OK");
process.exit(fails ? 1 : 0);
