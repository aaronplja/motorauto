"use strict";
/** Série 2xx, lot B : erreurs, minuteries, règles, CSP, cache hors-ligne */
const { assert, read, ok } = require("./_helpers");
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");

ok("aucun catch vide : chaque erreur ignorée est commentée ou signalée (TECH-201)", () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : /\.js$/.test(e.name) && !/\.min\.js$/.test(e.name) ? [path.join(d, e.name)] : []);
  const bad = walk(path.join(root, "js")).filter((f) => /catch\s*(\([^)]*\))?\s*\{\s*\}/.test(fs.readFileSync(f, "utf8")));
  assert.deepStrictEqual(bad, []);
});
ok("message unique « Action impossible, réessaie. » sur échec d'une action (UX-203)", () => { const j = read("js/errors.js"); assert(/Action impossible, réessaie\./.test(j) && /userFacing/.test(j)); });
ok("écouteurs Firestore libérés à la fermeture (TECH-202)", () => { assert(/unsubSeasons\(\)/.test(read("js/game/seasonal.js")) && /unsub\(\)/.test(read("js/maintenance.js"))); });
ok("minuteries recensées et mises au ralenti hors focus (TECH-203)", () => { const j = read("js/timers.js"); assert(/MATimers/.test(j) && /hasFocus/.test(j)); });
ok("anti-flood des commentaires dans les règles + lot côté client (TECH-204)", () => {
  assert(/function rateOkS\(secs\)/.test(read("firestore.rules")) && /rateOkS\(3\)/.test(read("firestore.rules")));
  assert(/feed_rate/.test(read("js/social/social.js")));
});
ok("CSP appliquée (plus en simple rapport) (TECH-206)", () => { const v = JSON.parse(read("vercel.json")); const all = v.headers.flatMap((h) => h.headers); assert(all.some((x) => x.key === "Content-Security-Policy" && /default-src 'self'/.test(x.value)) && !all.some((x) => /Report-Only/.test(x.key))); });
ok("cache hors-ligne versionné par l'empreinte du build (TECH-207)", () => { assert(/const CACHE = "ma-offline-[a-f0-9]{10}";/.test(read("firebase-messaging-sw.js")) && /buildId/.test(read("scripts/build.js"))); });
