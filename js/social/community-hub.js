/**
 * MOTORAUTO — pages d'accueil des trois groupes de la Communauté (Pilotes, Clubs, Classements), présentées comme celles de « Jouer ».
 */
(function () {
  "use strict";
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const tile = (href, ico, title, sub, cls) => `<a class="hub-tile ${cls || ""}" href="${href}"><i class="hub-ico" aria-hidden="true">${ico}</i><b>${T(title)}</b><small>${T(sub)}</small></a>`;
  const SV = (d) => `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const I = {
    fil: SV('<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v9a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/>'),
    membres: SV('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.6"/><path d="M17 14.2c2.6.2 4.5 2 4.5 5"/>'),
    garages: SV('<path d="M3 10l9-7 9 7v11H3z"/><path d="M8 21v-7h8v7M8 17.5h8"/>'),
    clubs: SV('<path d="M12 3l8 3v6c0 4.5-3.4 7.8-8 9-4.6-1.2-8-4.5-8-9V6z"/>'),
    sorties: SV('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    classement: SV('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3 3 0 0 0 7 10.5M17 6h3v1.5a3 3 0 0 1-3 3M12 14v4M8.5 20h7"/>')
  };
  const HUBS = {
    apercu: () => `<div class="hub-grid hub-grid-main">
      ${tile("#/communaute/fil", I.fil, "Fil", "Ce que font les pilotes que tu suis")}
      ${tile("#/communaute/pilotes", I.membres, "Membres", "Trouve un pilote, suis-le, découvre son profil")}
      ${tile("#/communaute/voitures", I.garages, "Garages", "Les voitures partagées par la communauté")}
      ${tile("#/clubs", I.clubs, "Clubs", "Rejoins un club, son fil privé et le défi de clubs")}
      ${tile("#/communaute/evenements", I.sorties, "Sorties", "Balades, rassemblements, journées circuit")}
      ${tile("#/classement/chronos", I.classement, "Classement", "Chronos, circuits, modèles, pilotes, cartes")}
    </div>`,
    pilotes: () => `<div class="hub-grid">
      ${tile("#/communaute/pilotes", "👥", "Liste des pilotes", "Trouve un pilote, suis-le, découvre son profil", "hub-feature")}
      ${tile("#/communaute/voitures", "🚗", "Voitures des pilotes", "Les voitures partagées par la communauté")}
      ${tile("#/communaute/fil", "📰", "Fil d'actualité", "Ce que font les pilotes que tu suis")}
      ${tile("#/chat", "💬", "Salon", "Discute en direct avec les pilotes")}
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
    ctx.Router.register("community", { enter: (p) => { document.body.dataset.commTab = p.tab || ""; if (p.tab === "apercu" || /^hub-/.test(p.tab || "")) draw(); } });
  });
})();
