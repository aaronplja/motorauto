"use strict";
/** Série 2 lot 1 : sécurité et dette technique (TECH-1xx) */
const { fs, path, assert, jsFiles, read, ok } = require("./_helpers");

// TECH-108 : toute minuterie rapide passe par timers.js (pause en arrière-plan) ; les 3 sondages globaux sont espacés
ok("minuteries : timers.js chargé avant les autres scripts, sondages globaux espacés", () => {
  const src = read("index.src.html");
  assert(src.indexOf("js/timers.js") > -1 && src.indexOf("js/timers.js") < src.indexOf("js/common.js"), "timers.js doit précéder common.js");
  assert(/setInterval\(tick, 4000\)/.test(read("js/game/fab-pack.js")) && /setInterval\(run, 3000\)/.test(read("js/chat/chat-plus.js")), "sondages espacés");
});

// ---- Série 2, lot 1 : sécurité et dette technique
ok("sécurité : le super-admin par e-mail exige une adresse vérifiée (règles, Storage, fonctions, interface)", () => {
  assert(/admin@motorauto\.fr' && request\.auth\.token\.email_verified == true/.test(read("firestore.rules")), "firestore.rules");
  assert(/admin@motorauto\.fr' && request\.auth\.token\.email_verified == true/.test(read("storage.rules")), "storage.rules");
  assert(/email_verified === true/.test(read("functions/index.js")) && /email_verified === true/.test(read("functions/roles.js")) && /email_verified === true/.test(read("functions/pro.js")), "fonctions");
  assert(/emailVerified === true/.test(read("js/common.js")), "interface");
});
ok("vie privée : emailNotifs vit dans users/{uid}/private/prefs (règles, site, e-mails)", () => {
  const r = read("firestore.rules"); assert(/match \/private\/\{docId\}/.test(r) && /allow read, delete: if isOwner\(uid\)/.test(r), "règle private");
  const a = read("js/app.js"); assert(/collection\("private"\)\.doc\("prefs"\)\.set\(\{ emailNotifs/.test(a), "écriture privée");
  assert(!/mods: profile\.mods \|\| "", emailNotifs/.test(a), "le profil public ne porte plus emailNotifs");
  assert(/collection\("private"\)\.doc\("prefs"\)/.test(read("functions/mail-functions.js")), "lecture côté e-mails");
});
ok("CSP : directives sûres appliquées (object, base, frame-ancestors, form-action) + politique complète en observation", () => {
  const v = JSON.parse(read("vercel.json")), all = v.headers.flatMap((h) => h.headers), enf = all.find((x) => x.key === "Content-Security-Policy");
  assert(enf && /object-src 'none'/.test(enf.value) && /frame-ancestors 'self'/.test(enf.value) && /base-uri 'self'/.test(enf.value), "CSP bloquante");
  assert(all.some((x) => x.key === "Content-Security-Policy" && /script-src/.test(x.value)), "CSP complète appliquée (TECH-206)");
});
ok("App Check : prêt côté site (clé vide = désactivé) et côté fonctions (ENFORCE_APPCHECK)", () => {
  assert(/APPCHECK_SITE_KEY = ""/.test(read("js/firebase-init.js")) && /firebase-app-check-compat\.js/.test(read("index.src.html")));
  assert(/enforceAppCheck: APPCHECK_ENFORCED/.test(read("functions/index.js")));
});
ok("build : esbuild épinglé (exact) et vérification ignorée si la version diffère", () => {
  assert(/"esbuild": "\d+\.\d+\.\d+"/.test(read("package.json")), "version exacte");
  assert(/SAME_ESBUILD/.test(read("scripts/build.js")));
});
ok("emojis du HTML statique remplacés par des SVG au build", () => {
  const h = read("index.html"); assert((h.match(/class="mi-w"/g) || []).length >= 20, "icônes à la source");
});
ok("CI : un job de parcours navigateur (journeys)", () => { const w = read("docs/ci/tests.yml"); assert(/journeys:/.test(w) && /test:journeys/.test(w) && /playwright install/.test(w)); });
