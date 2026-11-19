"use strict";
/** Série 2 lot 3 : fonctionnalités (ADD-1xx) */
const { fs, path, assert, jsFiles, read, ok } = require("./_helpers");

// ---------- Lot 3 : fonctionnalités
ok("sécurité du compte : mot de passe / e-mail avec ré-authentification (ADD-101)", () => {
  const j = read("js/account-security.js"), h = read("index.src.html");
  assert(/reauthenticateWithCredential/.test(j) && /updatePassword/.test(j) && /verifyBeforeUpdateEmail/.test(j));
  assert(/id="security-pw"/.test(h) && /id="security-mail"/.test(h) && /account-security\.js/.test(h));
  assert(h.indexOf('id="security-pw"') < h.indexOf('class="danger-zone'), "placé avant la zone sensible");
});
ok("export RGPD « Télécharger mes données » (ADD-102)", () => {
  assert(/id="export-data-btn"/.test(read("index.src.html")) && /motorauto-mes-donnees\.json/.test(read("js/account-security.js")));
});
ok("mode hors-ligne : service worker avec cache, sans intercepter Firebase (ADD-103)", () => {
  const s = read("firebase-messaging-sw.js");
  assert(/addEventListener\("fetch"/.test(s) && /url\.origin !== self\.location\.origin/.test(s) && /req\.method !== "GET"/.test(s));
  new Function(s.replace(/importScripts\([^)]*\);?/g, "")) ;
});
ok("données structurées Car + BreadcrumbList sur les fiches (ADD-105)", () => {
  assert(/BreadcrumbList/.test(read("js/seo-live.js")) && /seo-live\.js/.test(read("index.src.html")) && /BreadcrumbList/.test(read("scripts/build-seo.js")));
});
ok("partage d'un chrono (garage et classement) (ADD-106)", () => {
  assert((read("js/app.js").match(/data-share-lap/g) || []).length >= 2 && /\[data-share-lap\]/.test(read("js/catalogue/share.js")));
});
ok("page À propos / Plan du site + redirections (ADD-110)", () => {
  assert(/id="page-about"/.test(read("index.src.html")) && /\/a-propos/.test(read("js/router.js")));
});

// ---------- Lot 4 : organisation
ok("Chat : une seule implémentation, le site ne charge pas chat.js (DEL-106)", () => {
  const h = read("index.src.html");
  assert(!/js\/chat\/chat\.js/.test(h) && /js\/chat\/chat-embed\.js/.test(h) && /js\/chat\/chat\.js/.test(read("chat.html")));
  assert(!/chat\.html/.test(read("sitemap.xml")));
});
ok("pages en fragments : chaque include existe et index.src.html reste court (ORG-101)", () => {
  const raw = fs.readFileSync(path.join(__dirname, "../index.src.html"), "utf8");
  const inc = [...raw.matchAll(/<!--@include ([^>]+?)-->/g)].map((m) => m[1]);
  assert(inc.length >= 40, "fragments : " + inc.length);
  inc.forEach((f) => assert(fs.existsSync(path.join(__dirname, "..", f)), f));
  assert(raw.split("\n").length < 700, "index.src.html trop long");
});
ok("ranger : data/, docs/, js/data/, js/admin/ ; plus de fichier de données à la racine (ORG-102/103, DEL-105)", () => {
  const top = fs.readdirSync(path.join(__dirname, ".."));
  assert(!top.some((f) => /^(enrich-.*\.txt|cars-.*\.csv|IMAGES-A-AJOUTER\.txt|SECURITE\.md|GO-LIVE\.md|PRO-STRIPE\.md|FEATURES\.md)$/.test(f)), "fichiers à la racine");
  assert(fs.existsSync(path.join(__dirname, "../docs/NAVIGATION.md")) && fs.existsSync(path.join(__dirname, "../js/data/data.js")) && fs.existsSync(path.join(__dirname, "../js/admin/admin-extra.js")));
  assert(!fs.readdirSync(path.join(__dirname, "../js")).some((f) => /^(data|admin-)/.test(f) && f.endsWith(".js")), "js/data-*.js et js/admin-*.js doivent être dans leurs dossiers");
});

ok("écouteur de clic central : ordre, retrait, stopImmediatePropagation, erreurs isolées (DEL-107)", () => {
  const doc = new EventTarget(); const g = global.document; global.document = doc;
  const timers = []; const st = global.setTimeout; global.setTimeout = (f) => timers.push(f);
  try {
    new Function(read("js/click-hub.js"))();
    const out = []; const a = () => out.push("a"), b = () => { out.push("b"); throw new Error("boom"); }, c = (e) => { out.push("c"); e.stopImmediatePropagation(); }, d = () => out.push("d");
    [a, b, c, d].forEach((f) => doc.addEventListener("click", f));
    doc.addEventListener("click", a);                    // doublon ignoré
    doc.dispatchEvent(new Event("click"));
    assert.deepStrictEqual(out, ["a", "b", "c"]);
    assert.strictEqual(timers.length, 1, "l'erreur de b est rapportée");
    doc.removeEventListener("click", c); out.length = 0;
    doc.dispatchEvent(new Event("click"));
    assert.deepStrictEqual(out, ["a", "b", "d"]);
    const o = []; doc.addEventListener("click", () => o.push(1), { once: true }); doc.dispatchEvent(new Event("click")); doc.dispatchEvent(new Event("click"));
    assert.strictEqual(o.length, 1, "options once : écouteur natif");
    assert.strictEqual(doc.__maClickHub.size(), 3);
  } finally { global.document = g; global.setTimeout = st; }
  assert(/click-hub\.js/.test(read("index.src.html")));
});

// ---------- Lot 5 : poids et CSS
ok("!important : le nombre ne dépasse pas le plafond actuel (DEL-101)", () => {
  const dir = path.join(__dirname, "../css");
  const n = fs.readdirSync(dir).filter((f) => f.endsWith(".css") && !/bundle/.test(f)).reduce((t, f) => t + (fs.readFileSync(path.join(dir, f), "utf8").match(/!important/g) || []).length, 0);
  assert(n <= 546, n + " !important (plafond 546) : ajoute la règle dans la feuille de la page sans !important");
});
ok("démontage des pages lourdes quittées : frise et succès libèrent leur DOM (DEL-104)", () => {
  const r = read("js/router.js");
  assert(/h\.leave/.test(r) && /PAGE_ID\[previous\.name\] !== PAGE_ID\[route\.name\]/.test(r), "routeur : leave() jamais sur un bloc réutilisé");
  assert(/leave: \(\) =>/.test(read("js/game/frise.js")) && /leave: \(\) =>/.test(read("js/game/minigames.js")));
});

ok("Vercel : aucun build en ligne (le site est déjà construit ; scripts/ n'y est pas déployé)", () => {
  const v = JSON.parse(read("vercel.json"));
  assert(v.buildCommand === null && v.installCommand === null);
  assert(!("build" in (JSON.parse(read("package.json")).scripts || {})), "pas de script « build » : Vercel le lancerait");
});
