"use strict";
/** Série 2xx, lot A : accessibilité, CLS, annulation, hors-ligne, brouillons, claviers mobiles */
const { assert, read, ok } = require("./_helpers");

ok("CLS : la marge négative du hero est contenue dans #page-home (UI-206)", () => { assert(/#page-home\.page-on \{ display: flow-root; \}/.test(read("css/system.css"))); });
ok("tailles minimales de texte (UI-202)", () => { const c = read("css/system.css"); assert(/max\(12px, \.8em\)/.test(c) && /\.spec-u \{ font-size: max\(11px/.test(c)); });
ok("un h1 sur Contact et sur l'accueil (UX-201)", () => { assert(/<h1>Une idée/.test(read("pages/contact.html")) && /id="home-sr-h1"/.test(read("pages/home.html"))); });
ok("focus sur le titre après changement de page, bandeau hors-ligne, claviers mobiles (UX-202/205/207)", () => {
  const j = read("js/ux-polish.js"); assert(/h\.focus\(\{ preventScroll: true \}\)/.test(j) && /ma-offline/.test(j) && /enterkeyhint/.test(j) && /inputmode/.test(j));
});
ok("suppressions annulables : dépense, photo du journal, ligne du carnet (UX-204)", () => {
  assert(/MA\.undoable = /.test(read("js/common.js")) && /undoable/.test(read("js/garage-extra.js")) && /undoable/.test(read("js/garage-tools.js")));
});
ok("brouillons : contact, réglages, sortie (UX-206)", () => { const j = read("js/ux-polish.js"); assert(/key: "contact"/.test(j) && /MADraft\.clear\("contact"\)/.test(read("js/app.js"))); });
