/**
 * MOTORAUTO — popups d'aide : un petit message explicatif à la première visite de chaque page / onglet.
 * La case « Ne plus montrer » est mémorisée dans l'appareil (localStorage) et, si le pilote est connecté, dans son compte :
 *   guides/{uid}  { off: { "play/cartes": true, … }, updatedAt }
 * Le bouton « ? » (en haut à droite de chaque page) rouvre l'aide ; Réglages › Profil permet de tout réafficher.
 */
(function () {
  "use strict";
  const G = {
    "home": ["Bienvenue sur MOTORAUTO", "L'archive vivante des sportives de route, écrite par ceux qui les conduisent. Ici, chaque fiche voiture est comparable, chaque pilote a son garage et tout se joue en cartes.", ["Cherche une voiture, au clavier ou à la voix sur mobile", "Découvre la voiture du jour", "Touche le compte-tours pour rouvrir cette aide"]],
    "catalog": ["Le catalogue", "Toutes les fiches techniques réunies au même endroit : puissance, couple, 0 à 100, vitesse maxi, motorisations et histoire de chaque modèle.", ["Filtre par marque, catégorie ou transmission", "Touche une fiche pour voir tous les détails", "Compare plusieurs voitures côte à côte"]],
    "community/fil": ["Le fil de la communauté", "Les dernières nouveautés des pilotes : voitures ajoutées, records, cartes obtenues et publications.", ["Réagis et commente pour échanger", "Suis des pilotes pour ne rien rater", "Publie toi aussi quand tu as du neuf"]],
    "community/voitures": ["Les voitures des pilotes", "Les voitures réelles partagées par la communauté, avec leurs photos, leurs modifications et leurs chiffres.", ["Like et note les voitures qui te plaisent", "Ouvre une fiche pour lire les avis", "Ajoute la tienne depuis ton garage"]],
    "community/pilotes": ["Les pilotes", "Retrouve les membres du site, leur garage, leurs badges et leur collection de cartes.", ["Ouvre un profil pour voir sa vitrine", "Écris en message privé depuis son profil", "Suis les pilotes qui t'intéressent"]],
    "community/evenements": ["Les événements", "Rassemblements, balades, journées circuit et salons organisés par la communauté.", ["Filtre la carte par type et par région", "Indique ta participation", "Propose le tien si tu organises une sortie"]],
    "clubs": ["Les clubs", "Rejoins un club autour d'une marque ou d'une passion, ou crée le tien pour réunir ses membres.", ["Chaque semaine, ton club affronte un club de taille proche au défi de clubs", "Discute dans le chat du club et inscris-toi à ses sorties", "Respecte les règles affichées dans la fiche du club"]],
    "market": ["Les annonces", "Les petites annonces des pilotes : voitures, pièces et accessoires.", ["Contacte le vendeur en message privé", "Reste prudent : ne paie jamais avant d'avoir vu le produit", "Signale toute annonce suspecte"]],
    "play": ["Bienvenue dans Jouer", "Le coin jeu de MOTORAUTO : collectionne des cartes de voitures, relève les défis et la saison, joue aux quiz et affronte les autres pilotes.", ["Un pack gratuit t'attend chaque jour, avec une chance garantie qui se remplit", "Les défis changent chaque lundi, la saison dure un mois", "Échange tes doublons, même en lot, avec les autres pilotes"]],
    "play/cartes": ["Tes cartes", "Ouvre des packs, complète des albums par pays et fais monter le niveau de tes cartes. Plus une voiture est rare, plus sa carte est précieuse.", ["Les doublons se transforment en cristaux", "Complète un album pour gagner une carte Légende", "Ta vitrine : choisis 6 cartes, leur ordre et un fond"]],
    "play/echanges": ["Les échanges", "Échange un doublon contre le doublon d'un autre pilote. Seuls les exemplaires en trop peuvent être échangés.", ["L'onglet Pilotes propose les échanges possibles", "Le mode lot envoie jusqu'à 5 propositions d'un coup", "Ta liste « Je donne » et « Je cherche » est visible sur ton profil"]],
    "play/defis": ["Défis de la semaine", "Des défis chaque lundi et un défi du jour, avec des packs bonus à la clé.", ["Récupère chaque défi validé pour gagner des packs bonus", "Les défis changent chaque lundi"]],
    "pass": ["Pass de saison", "Une saison d'un mois, renouvelée à la fin du mois avec un pass gratuit de 30 paliers, des quêtes enchaînées, des gels de série, des cadres et des titres.", ["Chaque pack, quiz ou visite rapporte des points de saison", "Récupère chaque palier gagné, ou tout d'un coup", "Équipe un cadre et un titre : ils s'affichent dans le chat et les classements"]],
    "play/concours": ["Le concours photo", "Chaque mois, envoie ta plus belle photo de voiture. La communauté vote et le gagnant reçoit une carte spéciale.", ["Une seule participation par pilote", "Vote pour les photos que tu préfères", "Le thème du mois est affiché en haut"]],
    "duel": ["Le mode duel", "Choisis deux voitures (catalogue, communauté ou les tiennes) et regarde-les s'affronter en 0 à 100 km/h et sur 400 mètres.", ["Les résultats s'appuient sur les chiffres des fiches", "Les valeurs estimées sont signalées", "Partage ton duel avec un lien"]],
    "leaderboard/chronos": ["Les chronos", "Le classement des meilleurs temps réalisés par les pilotes sur les circuits.", ["Choisis un circuit pour voir son top", "Ajoute ton temps depuis ton garage", "Seuls les temps validés apparaissent"]],
    "leaderboard/circuits": ["Les circuits", "Tous les circuits référencés, avec leurs caractéristiques et les records de la communauté.", ["Ouvre un circuit pour voir sa fiche", "Compare les temps par voiture", "Retrouve ton meilleur tour"]],
    "leaderboard/voitures": ["Les voitures les plus aimées", "Le palmarès des voitures selon les likes, les notes et les commentaires de la communauté.", ["Bascule entre likes et notes", "Les voitures de pilotes sont incluses", "Ouvre une fiche pour voter à ton tour"]],
    "leaderboard/pilotes": ["Les pilotes", "Le classement des pilotes les plus actifs et les plus récompensés.", ["Les badges et les cartes font monter ton score", "Touche un pilote pour voir son profil", "Participe aux défis pour grimper"]],
    "leaderboard/collection": ["Les collections", "Qui possède le plus de cartes ? Le classement des plus belles collections du site.", ["Chaque carte distincte compte", "Les cartes rares et Légendes valent plus", "Complète tes albums pour monter"]],
    "garage": ["Ton garage", "Ton espace personnel : tes voitures, ton suivi d'entretien et tes projets.", ["Ajoute tes voitures avec leurs photos et leurs chiffres", "Suis tes entretiens et ton budget", "Tes voitures peuvent devenir des cartes de jeu"]],
    "garage/voitures": ["Mes voitures", "Ajoute et modifie tes voitures : photos, motorisation, puissance, 0 à 100, vitesse maxi et modifications.", ["Lie ta voiture à une fiche du catalogue pour reprendre ses données", "La première photo devient la photo principale", "Tu peux transformer ta voiture en carte de jeu"]],
    "garage/suivi": ["Le suivi", "Entretiens, budget et projets de tes voitures au même endroit pour ne rien oublier.", ["Note chaque intervention", "Garde un œil sur ton budget", "Planifie tes prochains projets"]],
    "settings/profil": ["Ton profil", "Choisis ton pseudo, ton avatar et ta présentation. C'est ce que les autres pilotes voient de toi.", ["Un pseudo unique te distingue", "Tu peux choisir un titre affiché près de ton nom", "Rien n'est public sans ton accord"]],
    "settings/ambiance": ["L'ambiance du site", "Choisis les couleurs et le thème qui te plaisent. Le changement s'applique partout, tout de suite.", ["Plusieurs ambiances disponibles", "Le choix est mémorisé sur ton appareil", "Tu peux en changer quand tu veux"]],
    "settings/notifications": ["Les notifications", "Décide de ce dont tu veux être prévenu : messages, réponses, défis et événements.", ["Active seulement ce qui t'intéresse", "Les alertes importantes restent visibles", "Tu peux tout couper à tout moment"]],
    "settings/carte": ["La carte", "Réglages de l'affichage des cartes et des cartes de circuits.", ["Choisis le fond de carte", "Ces réglages restent sur ton appareil", "Ils n'affectent que ton affichage"]],
    "admin/tableau": ["Le tableau de bord admin", "Une vue d'ensemble de l'activité du site et de ce qui reste à traiter.", ["Les tuiles montrent les tâches en attente", "Touche une tuile pour y accéder directement", "Le journal garde la trace des actions"]],
    "admin/moderation": ["La modération", "Traite les signalements, gère les sourdines et veille au respect des règles de la communauté.", ["Lis le contexte avant de décider", "Chaque action est enregistrée au journal", "Tu peux répondre avec un message type"]],
    "admin/catalogue": ["Le catalogue", "Ajoute ou corrige des fiches voitures : motorisations, chiffres, photos, transmission et circuit.", ["Les modifications apparaissent tout de suite sur le site", "Les chiffres alimentent aussi les cartes de jeu", "Marque une fiche comme indicative si les valeurs sont estimées"]],
    "admin/jeu": ["L'administration du jeu", "Gère les cartes spéciales, les raretés, le concours photo et les attributions de cartes.", ["Tu peux modifier la rareté d'une carte existante", "Les cartes spéciales ne sortent jamais des packs", "Clôture le concours pour couronner le gagnant"]],
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
