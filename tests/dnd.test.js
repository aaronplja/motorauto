/** « Ne pas déranger » : node tests/dnd.test.js (les dépendances Firebase sont simulées) */
"use strict";
const Module = require("module"), orig = Module._load;
Module._load = function (req, ...a) { if (/^firebase-(functions|admin)/.test(req)) return new Proxy({}, { get: () => () => ({}) }); return orig.call(this, req, ...a); };
const { inQuietHours: q } = require("../functions/push.js");
let n = 0, f = 0; const t = (c, m) => { n++; if (!c) { f++; console.log("FAIL:", m); } };
const d = (h, m) => new Date(Date.UTC(2026, 9, 31, h - 1, m)); // heure de Paris (UTC+1 le 31/10/2026)
t(q("22:00", "08:00", d(23, 0)), "23h dedans"); t(q("22:00", "08:00", d(3, 0)), "3h dedans");
t(!q("22:00", "08:00", d(12, 0)), "midi dehors"); t(!q("22:00", "08:00", d(8, 0)), "8h00 dehors"); t(q("22:00", "08:00", d(22, 0)), "22h00 dedans");
t(q("13:00", "14:00", d(13, 30)) && !q("13:00", "14:00", d(14, 0)), "plage dans la journée");
t(!q("10:00", "10:00", d(10, 0)), "plage vide = jamais"); t(!q("x", "y", d(1, 0)), "valeurs invalides ignorées");
console.log(f ? f + " ÉCHEC(S)" : "dnd.test : " + n + " vérifications OK"); process.exit(f ? 1 : 0);
