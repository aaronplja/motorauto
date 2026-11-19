"use strict";
/** Lot 3 : Atelier de cartes, un seul onglet Échanges, Boutique dans Jouer, anciennes adresses conservées */
const { assert, read, ok } = require("./_helpers");
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");

ok("anciennes adresses redirigées, jamais supprimées", () => {
  const r = read("js/router.js");
  [["/fusion", "/jouer/collection"], ["/marche", "/jouer/echanges"], ["/souhaits", "/jouer/echanges"], ["/jouer/boutique", "/jouer/minijeux"], ["/jouer/troc", "/jouer/echanges"], ["/jouer/cartes", "/jouer/collection"]]
    .forEach(([a, b]) => assert(r.includes('"' + a + '": "' + b + '"'), a + " -> " + b));
  assert(/HINTS = \{[^}]*"\/marche": "market"[^}]*"\/souhaits": "wish"[^}]*"\/fusion": "fuse"/.test(r), "sections voulues mémorisées");
});
ok("play : onglets réduits, défaut = accueil Jouer", () => {
  const r = read("js/router.js");
  assert(/tabs: \["collection", "echanges", "minijeux", "communaute", "defis", "concours"\]/.test(r));
  assert(/play: "minijeux"/.test(r));
});
ok("les pages Fusion, Marché et Souhaits ne sont plus dupliquées (un identifiant = un élément)", () => {
  const src = read("index.src.html"), play = read("pages/play.html");
  ["fusion", "cardmarket", "wishfeed"].forEach((n) => assert(!src.includes("pages/" + n + ".html"), n));
  ["cards-root", "trades-root", "cardmarket-root", "wishfeed-root", "shop-host", "cards-host"].forEach((id) => assert((play.match(new RegExp('id="' + id + '"', "g")) || []).length === 1, id));
});
ok("Atelier : sélection, barre d'actions, fusion et ancienne adresse #/fusion", () => {
  const c = read("js/game/cards.js");
  ["data-atelier-toggle", "atelier-bar", "atActions", "atPreselectFuse", "isCardsRoute", 'MAExchange.fuse', "shop-host", "cards-host"].forEach((k) => assert(c.includes(k), k));
  assert(/Fusionner " \+ FN \+ " doublons/.test(c), "libellé de fusion");
});
ok("Échanges : Pilotes, Marché, Souhaits, Reçues, Envoyées, Historique dans un seul onglet", () => {
  const t = read("js/game/trades.js"), p = read("js/game/play-plus.js");
  ["pilots", "market", "wish", "in", "out", "done"].forEach((k) => assert(t.includes('["' + k + '"'), k));
  assert(/window\.MAExchange = \{/.test(p) && /fuse:/.test(p) && /sell:/.test(p));
});
ok("Atelier : styles présents et nouveaux textes traduits", () => {
  assert(/\.at-bar\b/.test(read("css/components/cards.css")));
  ["en", "es", "de", "it"].forEach((l) => assert(read("js/i18n/" + l + ".js").includes('"Sélectionner"'), l));
});
