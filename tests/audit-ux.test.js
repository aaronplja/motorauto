"use strict";
/** Série 2 lot 2 : design et UX (UI-1xx, UX-1xx) */
const { fs, path, assert, jsFiles, read, ok } = require("./_helpers");

// ---- Série 2, lot 2 : design et UX
ok("page Jouer : l'étiquette n'est plus identique au titre (UI-101)", () => {
  const h = read("index.src.html");
  assert(!/<span class="status-tag-verified">Jouer<\/span>\s*<h1[^>]*>Jouer<\/h1>/.test(h) && /status-tag-verified">Cartes, jeux &amp?;? ?défis|status-tag-verified">Cartes, jeux & défis/.test(h), "étiquette Jouer");
});
ok("couleur de la barre du navigateur alignée sur le thème par défaut dès le premier octet (UI-104)", () => { assert(/theme-color" content="#f6f3ec"/.test(read("index.src.html"))); });
ok("mot de passe : œil afficher/masquer + jauge à l'inscription (UI-107)", () => {
  const j = read("js/password-field.js"); assert(/pw-eye/.test(j) && /pw-meter/.test(j) && /aria-pressed/.test(j) && /new-password/.test(j));
  assert(/password-field\.js/.test(read("index.src.html")) && /\.pw-eye/.test(read("css/account.css")));
});
ok("états vides : catalogue sans résultat propose de réinitialiser (UI-110, UX-110)", () => {
  const a = read("js/app.js"); assert(/data-action="reset-all-filters"/.test(a) && /class="empty-state"/.test(a) && /\.empty-state/.test(read("css/system.css")));
});
ok("titre d'onglet avec la sous-page : « Boutique · Jouer » (UX-101)", () => { assert(/function titleOf\(route, pageEl\)/.test(read("js/router.js")) && /document\.title = titleOf\(route, pageEl\)/.test(read("js/router.js"))); });
ok("filtres du catalogue gardés pour la session + retour au même endroit (UX-105)", () => {
  assert(/sessionStorage\.setItem\("ma\.filters"/.test(read("js/app.js")) && /restoreFilters\(\)/.test(read("js/app.js")));
  assert(/n\+\+ < 20/.test(read("js/router.js")), "défilement : nouvelles tentatives");
});
ok("boutons occupés : MA.busy utilisé à la connexion, l'inscription, le contact et les réglages (UX-106)", () => {
  assert(/MA\.busy = function/.test(read("js/common.js")));
  assert((read("js/app.js").match(/MA\.busy\(/g) || []).length >= 8, "usages");
  assert(/button\.is-busy::after/.test(read("css/system.css")));
});
ok("plus de confirm() natif dans l'administration : tout passe par MA.confirm (UX-107)", () => {
  for (const f of ["admin-extra", "admin-game", "site-editor"]) assert(!/[^.\w]confirm\(/.test(read((f === "site-editor" ? "js/" : "js/admin/") + f + ".js").replace(/MA\.confirm\(/g, "")), f);
});
ok("changement de page annoncé aux lecteurs d'écran (UX-109)", () => { assert(/id = "ma-live"/.test(read("js/ux-polish.js")) && /ux-polish\.js/.test(read("index.src.html"))); });
ok("traductions : les 4 fichiers restent valides", () => { for (const l of ["en", "es", "de", "it"]) { new Function("window", read("js/i18n/" + l + ".js"))({}); } });
