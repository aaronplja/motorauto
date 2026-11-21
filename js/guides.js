/**
 * MOTORAUTO — popups d'aide : un petit message explicatif à la première visite de chaque page / onglet.
 * La case « Ne plus montrer » est mémorisée dans l'appareil (localStorage) et, si le pilote est connecté, dans son compte :
 *   guides/{uid}  { off: { "play/cartes": true, … }, updatedAt }
 * Le bouton « ? » (en haut à droite de chaque page) rouvre l'aide ; Réglages › Profil permet de tout réafficher.
 */
(function () {
  "use strict";
  const G = {
    "home": ["Bienvenue sur MOTORAUTO", "L'archive vivante des sportives de route, écrite par ceux qui les conduisent. Chaque fiche voiture est comparable, chaque pilote a son garage et tout se joue en cartes.", ["Cherche une voiture, au clavier ou à la voix sur mobile", "Découvre la voiture du jour", "La barre flottante en bas (ou en haut sur ordinateur) te mène partout : Catalogue, Jouer, Pilotes, Moi", "Touche le compte-tours pour rouvrir cette aide"]],
    "catalog": ["Le catalogue", "Toutes les fiches techniques réunies au même endroit : puissance, couple, 0 à 100, vitesse maxi, motorisations et histoire de chaque modèle.", ["Filtre par marque, catégorie ou transmission", "Touche une fiche pour voir tous les détails", "Coche plusieurs voitures pour les comparer côte à côte", "La frise chronologique raconte toute l'histoire de l'automobile"]],
    "compare": ["La comparaison", "Plusieurs voitures côte à côte, chiffre par chiffre : le meilleur de chaque ligne est mis en avant.", ["Ajoute ou retire des voitures sans quitter la page", "Partage la comparaison avec un lien", "Les valeurs estimées sont signalées"]],
    "car": ["La fiche voiture", "Chiffres, motorisations, histoire et photos d'un modèle. Tu peux la liker, la noter et la commenter.", ["Choisis la motorisation avec les variantes", "Lance un duel ou ajoute-la à une comparaison", "Les modifications détaillées sont dans MOTORAUTO PRO"]],
    "engine": ["La fiche moteur", "Les caractéristiques d'un moteur et toutes les voitures qui l'ont équipé.", ["Touche une voiture pour ouvrir sa fiche", "Compare les générations entre elles"]],
    "brand": ["La page marque", "L'histoire d'un constructeur, ses modèles et ses chiffres clés.", ["Parcours les modèles par époque", "Touche un modèle pour ouvrir sa fiche"]],
    "timeline": ["La frise chronologique", "Toute l'histoire de l'automobile sur une ligne : les modèles et les dates qui comptent.", ["Fais défiler pour voyager dans le temps", "Touche un repère pour ouvrir la fiche"]],
    "circuit": ["La fiche circuit", "Le tracé, les caractéristiques et les meilleurs tours de la communauté sur ce circuit.", ["Compare les temps par voiture", "Ajoute ton chrono depuis ton garage"]],
    "pilotes": ["Ton espace Pilotes", "Le profil, le garage, la communauté et les classements réunis. Les onglets en haut changent de section, les sous-onglets affinent.", ["Profil et Garage demandent un compte", "Communauté : fil, voitures, sorties et clubs", "Classement : chronos, circuits, voitures, pilotes et collections"]],
    "community/fil": ["Le fil de la communauté", "Les dernières nouveautés des pilotes : voitures ajoutées, records, cartes obtenues et publications.", ["Réagis et commente pour échanger", "Suis des pilotes pour ne rien rater", "Publie toi aussi quand tu as du neuf"]],
    "community/voitures": ["Les voitures des pilotes", "Les voitures réelles partagées par la communauté, avec leurs photos, leurs modifications et leurs chiffres.", ["Like et note les voitures qui te plaisent", "Ouvre une fiche pour lire les avis", "Ajoute la tienne depuis ton garage"]],
    "community/pilotes": ["Les pilotes", "Retrouve les membres du site, leur garage, leurs badges et leur collection de cartes.", ["Ouvre un profil pour voir sa vitrine", "Écris en message privé depuis son profil", "Suis les pilotes qui t'intéressent"]],
    "community/hub-pilotes": ["Pilotes", "Tout sur les pilotes : la liste, leurs voitures et le fil d'actualité.", ["Touche une tuile pour ouvrir la liste, les voitures ou le fil", "Le salon te permet de discuter en direct"]],
    "community/hub-clubs": ["Clubs, sorties et carte", "Les clubs, les sorties organisées par la communauté et la carte pour les trouver.", ["Rejoins un club pour avoir son fil privé et le défi de clubs", "La carte se filtre par type et par région"]],
    "community/hub-classements": ["Classements", "Chronos, circuits, voitures préférées, pilotes et collectionneurs.", ["Chaque classement a son onglet", "Les 3 premiers pilotes débloquent un cadre et un titre"]],
    "community/carte": ["La carte des sorties", "Toutes les sorties et les pilotes qui acceptent d'apparaître, sur une carte.", ["Filtre par type et par région", "Touche un repère pour voir la sortie"]],
    "community/evenements": ["Les événements", "Rassemblements, balades, journées circuit et salons organisés par la communauté.", ["Filtre la carte par type et par région", "Indique ta participation", "Propose le tien si tu organises une sortie"]],
    "commcar": ["Voiture d'un pilote", "La fiche d'une voiture réelle : photos, modifications, chiffres et avis de la communauté.", ["Like, note et commente", "Contacte le pilote depuis son profil", "Tu peux la comparer à une voiture du catalogue"]],
    "pilot": ["Profil d'un pilote", "Son titre, son cadre, ses meilleurs succès, sa vitrine de cartes et son garage.", ["L'onglet Badges montre tous ses cadres et titres débloqués", "Sur ton propre profil, « Personnaliser le profil » ouvre le panneau de réglages", "Envoie-lui un message privé ou propose un échange"]],
    "clubs": ["Les clubs", "Rejoins un club autour d'une marque ou d'une passion, ou crée le tien pour réunir ses membres.", ["Chaque semaine, ton club affronte un club de taille proche au défi de clubs", "Discute dans le chat du club et inscris-toi à ses sorties", "Respecte les règles affichées dans la fiche du club"]],
    "club": ["Ton club", "Le fil, les membres, les sorties et le défi de la semaine de ce club.", ["Les points de chaque membre comptent pour le club", "Les règles du club sont affichées en haut", "Le chat du club est réservé à ses membres"]],
    "market": ["Les annonces", "Les petites annonces des pilotes : voitures, pièces et accessoires.", ["Contacte le vendeur en message privé", "Reste prudent : ne paie jamais avant d'avoir vu le produit", "Signale toute annonce suspecte"]],
    "chat": ["Le salon et les messages", "Le salon des pilotes pour discuter en direct, et tes messages privés. Les cadres et les titres s'affichent à côté des pseudos.", ["Change de discussion avec la liste (ou la flèche de retour sur mobile)", "Une cloche te prévient des nouveaux messages", "Signale un message inapproprié depuis son menu"]],
    "play": ["Bienvenue dans Jouer", "Le coin jeu de MOTORAUTO : collectionne des cartes de voitures, relève les défis et la saison, joue aux quiz et affronte les autres pilotes.", ["Quatre groupes : Cartes, Jeux, Échanges et Défis, chacun avec ses sous-onglets", "Un pack gratuit et une carte offerte t'attendent chaque jour", "Les défis changent chaque lundi, la saison dure un mois"]],
    "play/cartes": ["Tes cartes", "Ouvre des packs, complète des albums et fais monter le niveau de tes cartes. Chaque carte a un IC (collection) et un IP (performance) : plus ils sont hauts, plus la carte est précieuse.", ["Collection, Boutique et Fusion sont les sous-onglets de ce groupe", "Les doublons se transforment en cristaux", "Complète un album pour gagner une carte Héritage"]],
    "play/collection": ["Ta collection", "Toutes tes cartes, tes albums par pays, par marque ou par décennie, et ta vitrine de 6 cartes visible sur ton profil.", ["Trie par rareté, niveau, puissance ou doublons d'abord", "Touche une carte pour l'améliorer ou la verrouiller", "♻️ Recycler transforme tes doublons en cristaux, en gardant toujours un exemplaire", "Ta voiture du garage peut devenir une carte unique"]],
    "play/boutique": ["La boutique", "Là où tu récupères tes cartes : cadeaux du jour, packs par pays et offres, à ouvrir avec tes cristaux.", ["Le pack du jour et la carte du jour sont gratuits : touche la carte face cachée pour la révéler", "Les packs bonus viennent des badges, des défis et du parrainage", "La chance garantie se remplit à chaque pack : rare, épique puis légendaire", "Tes cristaux se gagnent avec les doublons, le quiz et les défis"]],
    "fusion": ["La fusion de cartes", "Rassemble 5 doublons de la même rareté : ils fusionnent en une carte de rareté supérieure, tirée au hasard (une carte que tu n'as pas encore en priorité).", ["Choisis tes 5 doublons, il t'en reste toujours un exemplaire de chaque", "Les cartes verrouillées 🔒 ne sont pas proposées", "Passe par Collection ou Boutique avec les sous-onglets du dessus"]],
    "play/echanges": ["Les échanges", "Échange un doublon contre le doublon d'un autre pilote. Seuls les exemplaires en trop peuvent être échangés.", ["L'onglet Pilotes propose les échanges possibles", "Le mode lot envoie jusqu'à 5 propositions d'un coup", "Ta liste « Je donne » et « Je cherche » est visible sur ton profil"]],
    "cardmarket": ["Le marché de cartes", "Vends tes doublons ou achète les cartes qui te manquent, en cristaux.", ["Une petite commission de 10 % est prélevée sur chaque vente", "Tu peux avoir 8 annonces en même temps", "Les prix restent dans une fourchette fixée selon la rareté"]],
    "wishfeed": ["Souhaits et échanges", "Qui cherche quoi, qui propose quoi : le fil des listes de souhaits des pilotes.", ["Ajoute les cartes qui te manquent à tes souhaits", "Propose un échange en un geste quand une carte te correspond"]],
    "play/minijeux": ["Les mini-jeux", "Quiz, Plus ou moins, Duel et Bataille de cartes : des parties courtes qui rapportent des cristaux et des points de saison.", ["Quiz et Plus ou moins ont un plafond de gains par jour", "La Bataille se joue avec tes propres cartes"]],
    "quizgame": ["Le quiz", "10 questions : choisis ta catégorie et ton niveau, de Facile à Expert.", ["3 cristaux par bonne réponse, 60 par jour au maximum", "Chaque quiz rapporte aussi des points de saison", "Les catégories vont des marques au rallye en passant par l'électrique"]],
    "plusmoins": ["Plus ou moins", "Deux voitures, une seule bonne réponse : laquelle a la plus grande valeur ? Chaque série réussie te rapproche d'une récompense.", ["Des cristaux aux paliers 5, 10, 20 et 30", "Une erreur arrête la série", "Le gain journalier est plafonné"]],
    "duel": ["Le mode duel", "Choisis deux voitures (catalogue, communauté ou les tiennes) et regarde-les s'affronter en 0 à 100 km/h et sur 400 mètres.", ["Les résultats s'appuient sur les chiffres des fiches", "Les valeurs estimées sont signalées", "Partage ton duel avec un lien"]],
    "play/defis": ["Défis de la semaine", "Des défis chaque lundi et un défi du jour, avec des packs bonus à la clé.", ["Récupère chaque défi validé pour gagner des packs bonus", "Le défi de clubs oppose chaque semaine deux clubs de taille proche", "Les défis changent chaque lundi"]],
    "achievements": ["Les succès", "Tous tes badges et ta progression. Certains donnent un pack bonus, un cadre ou un titre.", ["Touche un badge pour voir comment l'obtenir", "Équipe tes cadres et titres favoris depuis ton profil"]],
    "pass": ["Pass de saison", "Une saison d'un mois, renouvelée à la fin du mois avec un pass gratuit de 30 paliers, des quêtes enchaînées, des gels de série, des cadres et des titres.", ["Chaque pack, quiz ou visite rapporte des points de saison", "Récupère chaque palier gagné, ou tout d'un coup", "Un gel de série (2 au maximum) protège ta série si tu rates un jour", "Équipe un cadre et un titre : ils s'affichent dans le chat et les classements"]],
    "play/concours": ["Le concours photo", "Chaque mois, envoie ta plus belle photo de voiture. La communauté vote et le gagnant reçoit une carte spéciale.", ["Une seule participation par pilote", "Vote pour les photos que tu préfères", "Le thème du mois est affiché en haut"]],
    "leaderboard/chronos": ["Les chronos", "Le classement des meilleurs temps réalisés par les pilotes sur les circuits.", ["Choisis un circuit pour voir son top", "Ajoute ton temps depuis ton garage", "Seuls les temps validés apparaissent"]],
    "leaderboard/circuits": ["Les circuits", "Tous les circuits référencés, avec leurs caractéristiques et les records de la communauté.", ["Ouvre un circuit pour voir sa fiche", "Compare les temps par voiture", "Retrouve ton meilleur tour"]],
    "leaderboard/voitures": ["Les voitures les plus aimées", "Le palmarès des voitures selon les likes, les notes et les commentaires de la communauté.", ["Bascule entre likes et notes", "Les voitures de pilotes sont incluses", "Ouvre une fiche pour voter à ton tour"]],
    "leaderboard/pilotes": ["Les pilotes", "Le classement des pilotes les plus actifs et les plus récompensés.", ["Les badges et les cartes font monter ton score", "Touche un pilote pour voir son profil", "Participe aux défis pour grimper"]],
    "leaderboard/collection": ["Les collections", "Qui possède le plus de cartes ? Le classement des plus belles collections du site.", ["Chaque carte distincte compte", "Les cartes d'échelon élevé et les Héritages valent plus", "Complète tes albums pour monter"]],
    "garage": ["Ton garage", "Ton espace personnel : tes voitures, ton suivi d'entretien et tes projets.", ["Ajoute tes voitures avec leurs photos et leurs chiffres", "Suis tes entretiens et ton budget", "Tes voitures peuvent devenir des cartes de jeu"]],
    "garage/voitures": ["Mes voitures", "Ajoute et modifie tes voitures : photos, motorisation, puissance, 0 à 100, vitesse maxi et modifications.", ["Lie ta voiture à une fiche du catalogue pour reprendre ses données", "La première photo devient la photo principale", "Tu peux transformer ta voiture en carte de jeu"]],
    "garage/suivi": ["Le suivi", "Entretiens, budget et projets de tes voitures au même endroit pour ne rien oublier.", ["Note chaque intervention", "Garde un œil sur ton budget", "Planifie tes prochains projets"]],
    "pro": ["MOTORAUTO PRO", "Les modifications de ta voiture, rédigées et relues par l'équipe : un abonnement mensuel avec des mois offerts au départ.", ["Explore les catégories de modifications avant de t'abonner", "Gère ton abonnement depuis cette page"]],
    "settings/profil": ["Ton profil", "Choisis ton pseudo, ton avatar et ta présentation. C'est ce que les autres pilotes voient de toi.", ["Un pseudo unique te distingue", "Tu peux choisir un titre affiché près de ton nom", "Rien n'est public sans ton accord"]],
    "settings/ambiance": ["L'ambiance du site", "Choisis les couleurs et le thème qui te plaisent. Le changement s'applique partout, tout de suite, y compris à l'écran de démarrage.", ["Plusieurs ambiances claires et sombres", "Le choix est mémorisé sur ton appareil", "Tu peux en changer quand tu veux"]],
    "settings/notifications": ["Les notifications", "Décide de ce dont tu veux être prévenu : messages, réponses, défis et événements.", ["Active seulement ce qui t'intéresse", "Les alertes importantes restent visibles", "Tu peux tout couper à tout moment"]],
    "settings/carte": ["La carte", "Réglages de l'affichage des cartes et des cartes de circuits.", ["Choisis le fond de carte", "Ces réglages restent sur ton appareil", "Ils n'affectent que ton affichage"]],
    "news": ["Les nouveautés", "Le journal des mises à jour de MOTORAUTO : ce qui change, ce qui arrive.", ["Les dernières mises à jour sont en haut", "Reviens de temps en temps : le site évolue souvent"]],
    "contact": ["Nous écrire", "Une idée, un bug, une voiture manquante : ton message arrive directement dans la messagerie privée de l'administrateur.", ["Tu es prévenu de la réponse par la cloche", "Décris le problème et la page concernée"]],
    "admin/tableau": ["Le tableau de bord admin", "Une vue d'ensemble de l'activité du site et de ce qui reste à traiter.", ["Les tuiles montrent les tâches en attente", "Touche une tuile pour y accéder directement", "Le journal garde la trace des actions"]],
    "admin/moderation": ["La modération", "Traite les signalements, gère les sourdines et veille au respect des règles de la communauté.", ["Lis le contexte avant de décider", "Chaque action est enregistrée au journal", "Tu peux répondre avec un message type"]],
    "admin/catalogue": ["Le catalogue", "Ajoute ou corrige des fiches voitures : motorisations, chiffres, photos, transmission et circuit.", ["Les modifications apparaissent tout de suite sur le site", "Les chiffres alimentent aussi les cartes de jeu", "Marque une fiche comme indicative si les valeurs sont estimées"]],
    "admin/jeu": ["L'administration du jeu", "Gère les cartes spéciales, les raretés, le concours photo et les attributions de cartes.", ["Tu peux modifier la rareté d'une carte existante", "Les cartes spéciales ne sortent jamais des packs", "Clôture le concours pour couronner le gagnant"]],
    "admin/pro": ["L'administration PRO", "Les abonnés PRO, les accès offerts et les contenus de modifications.", ["Offre un accès PRO pour une durée donnée", "Les paiements en retard sont signalés"]],
    "admin/journal": ["Le journal", "L'historique des actions d'administration et de modération.", ["Retrouve qui a fait quoi et quand", "Filtre pour trouver une action précise", "Rien ne s'efface automatiquement"]],
    "admin/erreurs": ["Le journal des erreurs", "Les erreurs rencontrées par les visiteurs, regroupées pour t'aider à corriger vite.", ["Les plus fréquentes sont en haut", "Une erreur répétée mérite une correction", "Tu peux vider les anciennes entrées"]]
  };
  const LS = "ma_guides_off";
  let C = null, off = {}, user = null, shown = new Set(), current = "", pending = 0, root = null;

  const read = () => { try { return JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (_) { return {}; } };
  const keep = () => { try { localStorage.setItem(LS, JSON.stringify(off)); } catch (_) { /* navigation privée */ } };
  const keyOf = (r) => { const n = r.name, t = r.params && r.params.tab; return G[n + "/" + t] ? n + "/" + t : G[n] ? n : ""; };
  async function loadRemote() {
    if (!user || !C) return;
    try {
      const s = await C.db.collection("guides").doc(user.uid).get();
      const r = s.exists && s.data().off ? s.data().off : {};
      const merged = Object.assign({}, off, r);
      const grew = Object.keys(merged).length > Object.keys(r).length;
      off = merged; keep();
      if (grew) save();
    } catch (_) { /* règles non publiées : l'appareil suffit */ }
  }
  function save() {
    keep();
    if (!user || !C) return;
    C.db.collection("guides").doc(user.uid).set({ off, updatedAt: C.FieldValue ? C.FieldValue.serverTimestamp() : window.firebase.firestore.FieldValue.serverTimestamp() }).catch(() => {});
  }
  const busy = () => document.documentElement.classList.contains("splash-on") || !!document.querySelector(".modal-layer.active, .tcg-overlay, .guide-ov");

  function close() { if (root) { root.classList.remove("on"); const r = root; root = null; setTimeout(() => r.remove(), 220); } }
  function open(key, force) {
    const g = G[key]; if (!g || root) return;
    const esc = (C && C.esc) || ((s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
    const ov = document.createElement("div"); ov.className = "guide-ov"; root = ov;
    ov.innerHTML = `<div class="guide-card" role="dialog" aria-modal="true" aria-labelledby="guide-t">
      <button type="button" class="guide-x" data-guide-close aria-label="Fermer">&times;</button>
      <span class="guide-eyebrow">Aide</span>
      <h2 id="guide-t">${esc(g[0])}</h2>
      <p class="guide-text">${esc(g[1])}</p>
      <ul class="guide-points">${g[2].map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <label class="guide-check"><input type="checkbox" id="guide-off"${off[key] ? " checked" : ""}><span class="guide-box" aria-hidden="true"></span><span>Ne plus montrer ce message</span></label>
      <label class="guide-check"><input type="checkbox" id="guide-all"${off.__all ? " checked" : ""}><span class="guide-box" aria-hidden="true"></span><span>Ne montrer aucun tutoriel</span></label>
      <button type="button" class="cta-btn fill-btn guide-ok" data-guide-close>Compris</button></div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add("on"));
    ov._key = key;
    const ok = ov.querySelector(".guide-ok"); if (ok) ok.focus({ preventScroll: true });
  }
  function done() {
    if (!root) return;
    const key = root._key, cb = root.querySelector("#guide-off"), want = !!(cb && cb.checked);
    const all = !!(root.querySelector("#guide-all") || {}).checked;
    let ch = false;
    if (want && !off[key]) { off[key] = true; ch = true; } else if (!want && off[key]) { delete off[key]; ch = true; }
    if (all && !off.__all) { off.__all = true; ch = true; } else if (!all && off.__all) { delete off.__all; ch = true; }
    if (ch) save();
    close();
  }
  function decorate(route) {
    const page = document.querySelector(".page.page-on"); if (!page) return;
    page.querySelectorAll(".guide-help").forEach((b) => b.remove());
    const key = keyOf(route); if (!key) return;
    const gauge = page.querySelector("#hero-gauge");
    if (gauge) {   // accueil : le compteur ouvre le tutoriel (plus de bouton « ? » séparé)
      if (!gauge.dataset.guide) {
        gauge.dataset.guide = "1"; gauge.setAttribute("role", "button"); gauge.tabIndex = 0; gauge.title = "Toucher le compteur : afficher l'aide de l'accueil"; gauge.setAttribute("aria-label", "Compte-tours : toucher pour afficher l'aide de l'accueil");
        const chip = document.createElement("i"); chip.className = "gauge-help"; chip.setAttribute("aria-hidden", "true"); chip.textContent = "?"; gauge.appendChild(chip);
        const go = () => open("home", true);
        gauge.addEventListener("click", go);
        gauge.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      }
      return;
    }
    const host = page.querySelector(".page-head"); if (!host) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "guide-help"; b.setAttribute("aria-label", "Afficher l'aide de cette page"); b.title = "Aide"; b.textContent = "?";
    b.addEventListener("click", () => open(keyOf((window.Router && window.Router.current()) || route) || key, true));
    host.appendChild(b);
  }
  function settingsReset(route) {
    if (route.name !== "settings") return;
    const panel = document.querySelector('#page-settings .tab-panel[data-tab="profil"]'); if (!panel || panel.querySelector(".guide-reset")) return;
    const d = document.createElement("div"); d.className = "guide-reset";
    d.innerHTML = `<div><b>Messages d'aide</b><small>Les petits popups explicatifs (y compris si tu as choisi « Ne montrer aucun tutoriel »).</small></div><button type="button" class="cta-btn btn-ghost compact-btn" data-guide-reset>Réafficher les aides</button>`;
    panel.appendChild(d);
  }
  function onRoute(route) {
    decorate(route); settingsReset(route);
    const key = keyOf(route); current = key; clearTimeout(pending);
    return;   // les aides ne s'ouvrent plus toutes seules : on les ouvre avec le bouton (?)
    if (!key || off.__all || off[key] || shown.has(key)) return;
    const tryShow = (n) => {
      if (current !== key) return;
      if (busy()) { if (n < 8) pending = setTimeout(() => tryShow(n + 1), 1200); return; }
      shown.add(key); open(key, false);
    };
    pending = setTimeout(() => tryShow(0), 1100);
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-guide-close]")) { done(); return; }
    if (e.target.classList && e.target.classList.contains("guide-ov")) { done(); return; }
    if (e.target.closest("[data-guide-reset]")) {
      off = {}; shown = new Set(); save();
      if (C && C.toast) C.toast("Les aides s'afficheront à nouveau.", "ok");
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root) done(); });
  document.addEventListener("ma:route", (e) => { if (C) onRoute(e.detail); });
  document.addEventListener("ma:auth", (e) => { user = e.detail && e.detail.user || null; loadRemote(); });

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx; off = read(); user = ctx.user || null;
    if (user) loadRemote();
    try { const r = ctx.Router && ctx.Router.current && ctx.Router.current(); if (r) onRoute(r); } catch (_) { /* première route reçue par l'évènement */ }
  });
  window.MAGuides = { reset() { off = {}; shown = new Set(); save(); }, keys: () => Object.keys(G) };
})();
