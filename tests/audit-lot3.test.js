"use strict";
/** Lot 3 : Atelier de cartes, un seul onglet Échanges, Boutique dans Jouer, anciennes adresses conservées */
const { assert, read, ok } = require("./_helpers");
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");

ok("anciennes adresses redirigées, jamais supprimées", () => {
  const r = read("js/router.js");
  [["/marche", "/jouer/echanges"], ["/souhaits", "/jouer/echanges"], ["/jouer/troc", "/jouer/echanges"]]
    .forEach(([a, b]) => assert(r.includes('"' + a + '": "' + b + '"'), a + " -> " + b));
  assert(/HINTS = \{[^}]*"\/marche": "market"[^}]*"\/souhaits": "wish"[^}]*"\/fusion": "fuse"/.test(r), "sections voulues mémorisées");
  assert(!r.includes('"/jouer/cartes": "') && !r.includes('"/jouer/apercu": "'), "Jouer et Cartes ont leur propre écran, sans redirection");
});
ok("play : entrée en tuiles (apercu), pages Cartes / Albums / Raretés / Vitrine, plus de barre Collection/Boutique", () => {
  const r = read("js/router.js");
  assert(/tabs: \["apercu", "cartes", "albums", "raretes", "vitrine", "collection", "boutique", "echanges", "minijeux", "communaute", "defis", "concours"\]/.test(r));
  assert(/play: "apercu"/.test(r), "#/jouer ouvre l'écran à tuiles");
  assert(!/\["Boutique", "#\/jouer\/boutique"/.test(r), "la barre Collection/Boutique est retirée");
});
ok("les pages Fusion, Marché et Souhaits ne sont plus dupliquées (un identifiant = un élément)", () => {
  const src = read("index.src.html"), play = read("pages/play.html");
  ["fusion", "cardmarket", "wishfeed"].forEach((n) => assert(!src.includes("pages/" + n + ".html"), n));
  ["cards-root", "trades-root", "cardmarket-root", "wishfeed-root"].forEach((id) => assert((play.match(new RegExp('id="' + id + '"', "g")) || []).length === 1, id));
});
ok("Atelier : sélection, barre d'actions, fusion et ancienne adresse #/fusion", () => {
  const c = read("js/game/cards.js");
  ["data-atelier-toggle", "atelier-bar", "atActions", "atPreselectFuse", "isCardsRoute", 'MAExchange.fuse' ].forEach((k) => assert(c.includes(k), k));
  assert(/Fusionner " \+ FN \+ " doublons/.test(c), "libellé de fusion");
});
ok("Échanges : Pilotes, Marché, Souhaits, Mes échanges dans un seul onglet", () => {
  const t = read("js/game/trades.js"), p = read("js/game/play-plus.js");
  ["pilots", "market", "wish", "mine"].forEach((k) => assert(t.includes('["' + k + '"'), k));
  assert(/window\.MAExchange = \{/.test(p) && /fuse:/.test(p) && /sell:/.test(p));
});
ok("Atelier : styles présents et nouveaux textes traduits", () => {
  assert(/\.at-bar\b/.test(read("css/components/cards.css")));
  ["en", "es", "de", "it"].forEach((l) => assert(read("js/i18n/" + l + ".js").includes('"Sélectionner"'), l));
});
ok("promesses d'arrière-plan : classements, défis, suivi et pass ne laissent plus d'erreur non gérée (lot 5)", () => {
  assert(/board\("pmBest", 10\)\.then[^\n]*\.catch\(/.test(read("js/game/minigames.js")));
  assert(/loadWeekly\(true\)\.then\(renderChallenges\)\.catch\(/.test(read("js/game/play.js")));
  assert(/touchStreak\(\)\.then\(announce\)\.catch\(/.test(read("js/game/gamify.js")));
  assert(/load\(true\)\.then\(paint\)\.catch\(/.test(read("js/social/follow.js")));
});
ok("catalogue : filtres lisibles dans l'adresse (categorie, marque, tri, de, a) sans casser ?q= ni ?car=", () => {
  const a = read("js/app.js");
  ["q.get(\"categorie\")", "q.get(\"marque\")", "q.get(\"tri\")", "q.get(\"de\")", "q.get(\"a\")", "search = q.get(\"q\")", "car = q.get(\"car\")"].forEach((k) => assert(a.includes(k), k));
});
ok("fiche du catalogue : marque et dates alignées au centre (pas sur la ligne de base du logo)", () => {
  assert(/\.car-make-row:where[^\n]*align-items: center/.test(read("css/themes/studio-b.css")));
});
