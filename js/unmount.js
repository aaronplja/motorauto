/**
 * MOTORAUTO — libère le DOM des pages lourdes quand on les quitte (DEL-205), comme la frise et les succès (DEL-104).
 * Mémoire de page : un clic sur la barre de navigation garde l'état (filtres, onglet, page, défilement) ; ces valeurs vivent en JS,
 * pas dans le DOM, donc la page est redessinée à l'identique au retour. Deux clics ramènent à la page initiale (comportement du routeur, inchangé).
 *  - catalogue : la grille des véhicules ;
 *  - profil de pilote : listes de voitures, chronos et favoris.
 */
(function () {
  "use strict";
  const clear = (ids) => ids.forEach((id) => { const el = document.getElementById(id); if (el && el.childNodes.length) el.innerHTML = ""; });
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    ctx.Router.register("catalog", { leave: () => clear(["vehicles-grid", "pagination-container"]) });
    ctx.Router.register("pilot", { leave: () => clear(["pub-profile-cars", "pub-profile-telemetry", "pub-profile-favorites", "pub-profile-public-content"]) });
  });
})();
