"use strict";
/** Régressions de l'audit « perfection PC + mobile » : marque en double, contrastes, bouton « ? », défis, traductions. */
const fs = require("fs"), path = require("path"), assert = require("assert");
const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
let n = 0; const ok = (label, fn) => { fn(); n++; console.log("  ok - " + label); };

// 1. marque jamais écrite deux fois (« Nissan Nissan Silvia S15 »)
const nameOfSrc = (f) => { const m = read(f).match(/const nameOf = (\(c\) => \{[^\n]*\});/); assert(m, f + " : nameOf introuvable"); return eval("(" + m[1] + ")"); };
["js/car-of-day.js", "js/fiche-plus.js", "js/studio-home.js"].forEach((f) => ok("nameOf sans doublon : " + f, () => {
  const nameOf = nameOfSrc(f);
  assert.strictEqual(nameOf({ brand: "Nissan", model: "Nissan Silvia S15" }), "Nissan Silvia S15");
  assert.strictEqual(nameOf({ brand: "Mazda", model: "Mazda MX-5 Miata (NA)" }), "Mazda MX-5 Miata");
  assert.strictEqual(nameOf({ brand: "Peugeot", model: "205 GTI (1.9)" }), "Peugeot 205 GTI");
  assert.strictEqual(nameOf({ brand: "Seat", model: "Seatrick" }), "Seat Seatrick");   // pas de faux positif : il faut brand + espace
}));
ok("cartes : la marque n'est pas répétée dans le nom", () => assert(/model\.toLowerCase\(\)\.startsWith\(bl \+ " "\)\) model = model\.slice/.test(read("js/cards.js"))));

// 2. lisibilité : puces de la carte et paliers de succès
ok("puces de la carte : texte foncé sur fond translucide", () => assert(/\.mm-bar \.chip\.on \{[^}]*color: var\(--color-ink\)/.test(read("css/refonte.css"))));
ok("paliers argent/or lisibles en clair et en sombre", () => { const c = read("css/plus.css"); assert(/\.ac-t\.silver b \{ color: #55657a; \}/.test(c) && /data-tone="dark"\] \.ac-t\.gold b/.test(c)); });

// 3. bouton « ? » : place réservée en haut à droite de l'en-tête
ok("bouton ? : marge réservée dans l'en-tête de page", () => assert(/\.page-head:has\(> \.guide-help\) > :not\(\.page-head-actions\):not\(\.guide-help\) \{ padding-right: 50px; \}/.test(read("css/guides.css"))));

// 4. défis : une réponse serveur vide ne fait plus planter la route
ok("défis : réponse sans « items » → message d'erreur, pas d'exception", () => assert(/Array\.isArray\(weekly\.items\)\) throw new Error/.test(read("js/play.js"))));

// 5. traductions : mêmes {0}/{1} dans les 4 langues, aucune valeur vide
const dict = (l) => { const m = []; new Function("window", read("js/i18n/" + l + ".js"))({ __MA_DICT: m }); const o = {}; m.forEach((e) => Object.assign(o, e[1])); return o; };
const en = dict("en");
["es", "de", "it"].forEach((l) => ok("traductions " + l + " : gabarits {0} cohérents avec l'anglais", () => {
  const d = dict(l), ph = (s) => (String(s).match(/\{n?\d\}/g) || []).sort().join();
  Object.keys(en).forEach((k) => { if (d[k] === undefined) return; assert(String(d[k]).trim(), l + " : vide : " + k); assert.strictEqual(ph(d[k]), ph(en[k]), l + " : gabarit différent : " + k); });
}));

// 6. anti-spam du fil : règle Firestore présente
ok("règles : réponses du fil limitées par feed_rate", () => { const r = read("firestore.rules"); assert(/function feedRateOk\(\)/.test(r) && /kind != 'feed' \|\| feedRateOk\(\)/.test(r) && /match \/feed_rate\/\{uid\}/.test(r)); });

// 7. économie : packs -40 %, doublons x2 (option C)
const gc = require("../js/game-core.js");
ok("économie : packs -40 %, doublons x2, équilibre des raretés conservé", () => {
  assert.strictEqual(gc.PACKS.world.cost, 120);
  assert(Object.keys(gc.PACKS).every((k) => gc.PACKS[k].cost >= 10 && gc.PACKS[k].cost <= 300));
  assert.deepStrictEqual(["common", "rare", "epic", "legendary", "shiny"].map((r) => gc.RAR[r].dust), [10, 30, 80, 200, 800]);
  assert(gc.RAR.common.dust < gc.RAR.rare.dust && gc.RAR.rare.dust < gc.RAR.epic.dust && gc.RAR.epic.dust < gc.RAR.legendary.dust);
});

// 8. MOTORAUTO PRO : structure de départ, règles d'accès, aucun secret ni contenu technique dans le code
ok("PRO : catégories de départ complètes, ids uniques, aucun contenu technique", () => {
  const w = {}; new Function("window", read("js/pro-cats.js"))(w);
  const c = w.MA_PRO_DEFAULT_CATS, ids = c.map((x) => x.id);
  ["freinages", "chassis", "suspensions", "liaison-au-sol", "aerodynamisme", "refroidissement", "moteur", "echappement", "boite-de-vitesses", "allegement"].forEach((k) => assert(ids.includes(k), "catégorie absente : " + k));
  assert.strictEqual(new Set(ids).size, ids.length);
  c.forEach((x) => { const s = x.subs.map((y) => y.id); assert.strictEqual(new Set(s).size, s.length, "sous-catégories en double : " + x.id); assert(x.subs.length >= 3); });
  assert(c.find((x) => x.id === "moteur").subs.some((y) => y.id === "swap-moteur"));
  assert(/professionnel/.test(w.MA_PRO_WARNING) && /homologation/.test(w.MA_PRO_WARNING));
});
ok("PRO : règles Firestore — abonnement écrit par le serveur seul, fiches publiées pour les abonnés actifs, écriture admin", () => {
  const r = read("firestore.rules");
  assert(/match \/pro_subs\/\{uid\}[\s\S]*?allow write: if false;/.test(r));
  assert(/match \/pro_mods\/\{mid\}[\s\S]*?resource\.data\.status == 'published' && proActive\(\)/.test(r));
  assert(/allow create, update: if validProMod\(\);/.test(r) && /function validProMod\(\) \{[\s\S]*?isAdmin\(\)/.test(r));
  assert(/accessUntil > request\.time/.test(r));
});
ok("PRO : accès offert par un admin — règles, lecture client et écriture réservée aux admins", () => {
  const r = read("firestore.rules"), pro = read("js/pro.js"), adm = read("js/pro-admin.js");
  assert(/function proGiftOk\(uid\)[\s\S]*?pro_grants\/\$\(uid\)[\s\S]*?\.until > request\.time/.test(r));
  assert(/function proActive\(\) \{\s*return signedIn\(\) && \(proSubOk\(request\.auth\.uid\) \|\| proGiftOk\(request\.auth\.uid\)\);/.test(r));
  const g = r.match(/match \/pro_grants\/\{uid\} \{[\s\S]*?\n    \}/)[0];
  assert(/allow read: if isOwner\(uid\) \|\| isAdmin\(\);/.test(g) && /allow create, update: if isAdmin\(\)/.test(g) && /allow delete: if isAdmin\(\);/.test(g));
  assert(/pro_grants/.test(pro) && /kind: "gift"/.test(pro) && /pro_grants/.test(adm));
  assert(/pro_grants/.test(read("functions/delete-account.js")));
});
ok("accueil : déconnexion pendant le chargement du garage sans erreur (n.user.uid sur null)", () => {
  const g = read("js/garage-home.js");
  assert(!/C\.user\.uid/.test(g.replace(/const me = C\.user\.uid;/g, "")), "C.user.uid ne doit être lu qu'une fois, juste après un contrôle");
  assert(/if \(!C\.user\) return;\s*\/\/ déconnexion/.test(g));
});
ok("PRO : aucune clé secrète dans le code du site", () => {
  ["js/pro.js", "js/pro-admin.js", "js/pro-cats.js", "index.src.html"].forEach((f) => assert(!/sk_(live|test)_|whsec_|rk_(live|test)_/.test(read(f)), f));
});
ok("PRO : entrée unique dans la barre du haut + route + onglet admin", () => {
  const h = read("index.src.html"), rt = read("js/router.js");
  assert.strictEqual((h.match(/id="pro-btn"/g) || []).length, 1);
  assert(/name: "pro", re:/.test(rt) && /"jeu", "pro", "journal"/.test(rt) && /data-tab="pro"/.test(h));
});
console.log(n + " vérifications audit OK");
