/**
 * MOTORAUTO — pages d'accueil des trois groupes de la Communauté (Pilotes, Clubs, Classements), présentées comme celles de « Jouer ».
 */
(function () {
  "use strict";
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const tile = (href, ico, title, sub, cls) => `<a class="hub-tile ${cls || ""}" href="${href}"><i class="hub-ico" aria-hidden="true">${ico}</i><b>${T(title)}</b><small>${T(sub)}</small></a>`;
  const HUBS = {
    pilotes: () => `<div class="hub-grid">
      ${tile("#/communaute/pilotes", "👥", "Liste des pilotes", "Trouve un pilote, suis-le, découvre son profil", "hub-feature")}
      ${tile("#/communaute/voitures", "🚗", "Voitures des pilotes", "Les voitures partagées par la communauté")}
      ${tile("#/communaute/fil", "📰", "Fil d'actualité", "Ce que font les pilotes que tu suis")}
      ${tile("chat.html", "💬", "Salon", "Discute en direct avec les pilotes")}
    </div>`,
    clubs: () => `<div class="hub-grid">
      ${tile("#/clubs", "🛡️", "Clubs", "Rejoins un club, son fil privé et le défi de clubs", "hub-feature")}
      ${tile("#/communaute/evenements", "📅", "Sorties", "Balades, rassemblements, journées circuit, salons")}
      ${tile("#/communaute/carte", "🗺️", "Carte", "Les sorties et les clubs près de chez toi")}
    </div>`,
    classements: () => `<div class="hub-grid">
      ${tile("#/classement/chronos", "⏱️", "Chronos", "Les meilleurs temps par circuit", "hub-feature")}
      ${tile("#/classement/circuits", "🏁", "Circuits", "Tous les circuits et leurs records")}
      ${tile("#/classement/voitures", "🚘", "Voitures", "Les voitures préférées de la communauté")}
      ${tile("#/classement/pilotes", "🏆", "Pilotes", "Le classement d'XP et de niveau")}
      ${tile("#/classement/collection", "🎴", "Cartes", "Les plus beaux collectionneurs")}
    </div>`
  };
  function draw() { Object.keys(HUBS).forEach((k) => { const el = document.getElementById("comm-hub-" + k); if (el) el.innerHTML = HUBS[k](); }); }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    ctx.Router.register("community", { enter: (p) => { document.body.dataset.commTab = p.tab || ""; if (/^hub-/.test(p.tab || "")) draw(); } });
  });
})();
