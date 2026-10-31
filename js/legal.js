/**
 * MOTORAUTO — pages légales : mentions légales, politique de confidentialité, conditions d'utilisation.
 * Routes : #/legal/mentions · #/legal/confidentialite · #/legal/cgu
 * ► À COMPLÉTER : les informations de l'éditeur ci-dessous (nom, adresse). Si elles sont vides, la page l'indique de façon neutre.
 *   Un particulier qui édite un site à titre non professionnel peut rester anonyme à condition que l'hébergeur détienne son identité.
 */
(function () {
  "use strict";
  const LEGAL = {
    siteName: "MOTORAUTO",
    siteUrl: "https://motorauto.fr",
    editorName: "PELLEJA Aaron",
    editorAddress: "",
    publicationDirector: "PELLEJA Aaron",
    contactEmail: "motorautofr@gmail.com",
    updated: "28 octobre 2026"
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mail = () => `<a href="mailto:${esc(LEGAL.contactEmail)}">${esc(LEGAL.contactEmail)}</a>`;

  const DOCS = {
    mentions: {
      title: "Mentions légales",
      html: () => `
        <h2>Éditeur du site</h2>
        <p>${esc(LEGAL.siteName)} (${esc(LEGAL.siteUrl)}) est un site communautaire non commercial dédié aux voitures sportives, édité à titre non professionnel${LEGAL.editorName ? " par <b>" + esc(LEGAL.editorName) + "</b>" : ""}${LEGAL.editorAddress ? ", " + esc(LEGAL.editorAddress) : ""}.</p>
        <p>Directeur de la publication : ${esc(LEGAL.publicationDirector || LEGAL.editorName || "l'éditeur du site")}.<br>Contact : ${mail()}</p>
        <h2>Hébergement et services techniques</h2>
        <ul>
          <li><b>Site (pages)</b> : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com</li>
          <li><b>Comptes, base de données, fichiers et fonctions serveur</b> : Google Firebase / Google Cloud — Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande. Les données sont hébergées dans l'Union européenne.</li>
          <li><b>Envoi d'e-mails</b> : Brevo (Sendinblue SAS), 106 boulevard Haussmann, 75008 Paris, France.</li>
          <li><b>Nom de domaine</b> : OVH SAS, 2 rue Kellermann, 59100 Roubaix, France.</li>
        </ul>
        <h2>Propriété intellectuelle</h2>
        <p>Le code, la charte graphique, les textes rédigés par l'éditeur et le logo ${esc(LEGAL.siteName)} sont protégés. Les marques et noms de constructeurs ou de modèles cités appartiennent à leurs propriétaires respectifs et ne sont utilisés qu'à titre informatif ; ${esc(LEGAL.siteName)} n'est affilié à aucun constructeur. Les photos et textes publiés par les pilotes restent leur propriété (voir les conditions d'utilisation).</p>
        <h2>Responsabilité</h2>
        <p>Les fiches techniques sont fournies à titre indicatif et peuvent contenir des erreurs : vérifie toujours auprès du constructeur ou d'un professionnel avant toute modification de ton véhicule. Les contenus publiés par les pilotes n'engagent que leurs auteurs ; un contenu illicite peut être signalé via la page Contact ou le bouton « Signaler ».</p>
        <h2>Données personnelles</h2>
        <p>Le traitement de tes données est décrit dans la <a href="#/legal/confidentialite">politique de confidentialité</a>.</p>`
    },
    confidentialite: {
      title: "Politique de confidentialité",
      html: () => `
        <p>Cette page explique quelles données ${esc(LEGAL.siteName)} collecte, pourquoi, combien de temps, et comment exercer tes droits (RGPD). Mise à jour : ${esc(LEGAL.updated)}.</p>
        <h2>Qui est responsable ?</h2>
        <p>Le responsable du traitement est l'éditeur du site (voir les <a href="#/legal/mentions">mentions légales</a>). Contact : ${mail()}.</p>
        <h2>Données collectées</h2>
        <ul>
          <li><b>Compte</b> : adresse e-mail, mot de passe (géré par Firebase Authentication, jamais lisible par l'éditeur), pseudo.</li>
          <li><b>Profil (public)</b> : avatar, biographie, voiture actuelle, photo et modifications, réseaux sociaux (pseudos Instagram, TikTok, Snapchat), choix de rendre ton garage public ou privé.</li>
          <li><b>Activité</b> : chronos, voitures publiées, commentaires, likes et notes, événements et inscriptions, annonces, messages du salon et messages privés, signalements, photos envoyées.</li>
          <li><b>Jeu</b> : collection de cartes, cristaux, défis, série de visites, échanges, participations au concours photo et votes.</li>
          <li><b>Technique</b> : date de dernière connexion, jetons de session. Aucune publicité, aucun traceur publicitaire.</li>
        </ul>
        <h2>Pourquoi ? (bases légales)</h2>
        <ul>
          <li><b>Exécution du service</b> (création de compte, profil, communauté, jeu, notifications) : nécessaire pour te fournir le site.</li>
          <li><b>Intérêt légitime</b> : sécurité, lutte contre les abus, modération, statistiques de fréquentation agrégées.</li>
          <li><b>Consentement</b> : e-mails facultatifs (tu peux les couper dans Mon garage → Réglages), publication volontaire de ton profil et de tes contenus.</li>
        </ul>
        <h2>E-mails envoyés</h2>
        <p>Un e-mail de bienvenue à ta première connexion, un message de retour après une longue absence et un message quand quelqu'un s'inscrit à un événement que tu as organisé. Aucun e-mail publicitaire. Tu peux les désactiver à tout moment.</p>
        <h2>Destinataires et sous-traitants</h2>
        <p>Google (Firebase : authentification, base de données, stockage, fonctions), Vercel (hébergement des pages), Brevo (envoi des e-mails). Ils n'utilisent pas tes données pour eux-mêmes. Certains traitements peuvent impliquer un transfert hors de l'Union européenne, encadré par les clauses contractuelles types de la Commission européenne. Ce que tu publies (profil, voitures, commentaires, chronos, vitrine de cartes…) est visible par les autres visiteurs selon tes réglages.</p>
        <h2>Durée de conservation</h2>
        <p>Tes données sont conservées tant que ton compte existe. Quand tu supprimes ton compte, ton profil, tes contenus, ta collection de cartes et tes photos sont effacés ; les copies de sauvegarde techniques disparaissent sous quelques semaines. Les journaux de modération peuvent être conservés jusqu'à 12 mois pour la sécurité du site.</p>
        <h2>Tes droits</h2>
        <p>Accès, rectification, effacement, limitation, opposition, portabilité, retrait du consentement. Tu peux <b>modifier ton profil</b> et <b>supprimer ton compte</b> toi-même dans <a href="#/garage/parametres">Mon garage → Réglages</a>. Pour toute autre demande (ex. copie de tes données), écris à ${mail()} ; réponse sous un mois. Tu peux aussi saisir la CNIL (cnil.fr).</p>
        <h2>Stockage dans ton navigateur</h2>
        <p>Le site enregistre dans ton navigateur uniquement des préférences techniques (thème, filtres, brouillons) et la session de connexion. Pas de cookie publicitaire ni de suivi inter-sites.</p>
        <h2>Mineurs</h2>
        <p>Le site s'adresse aux personnes d'au moins 15 ans. En dessous, l'accord d'un parent est nécessaire.</p>
        <h2>Sécurité</h2>
        <p>Connexion chiffrée (HTTPS), règles d'accès strictes sur la base de données, tirages du jeu effectués côté serveur. Aucun système n'étant infaillible, signale toute faille à ${mail()}.</p>`
    },
    cgu: {
      title: "Conditions d'utilisation",
      html: () => `
        <p>En créant un compte ou en utilisant ${esc(LEGAL.siteName)}, tu acceptes ces conditions. Mise à jour : ${esc(LEGAL.updated)}.</p>
        <h2>1. Le service</h2>
        <p>${esc(LEGAL.siteName)} propose un catalogue de voitures sportives, une communauté de pilotes (profils, voitures, chronos, événements, annonces, salon de discussion) et un jeu de cartes à collectionner. Le service est gratuit, fourni « en l'état » et peut évoluer ou s'interrompre.</p>
        <h2>2. Ton compte</h2>
        <p>Tu fournis des informations exactes, tu gardes ton mot de passe secret et tu es responsable de ce qui se fait avec ton compte. Un compte par personne. Tu peux le supprimer à tout moment depuis Mon garage → Réglages.</p>
        <h2>3. Tes contenus</h2>
        <p>Tu restes propriétaire de tes photos et textes, et tu nous autorises à les afficher sur le site (y compris dans le jeu et le concours) tant qu'ils sont publiés. Tu garantis avoir le droit de les publier. Sont interdits : contenus illégaux, haineux, harcelants, pornographiques, trompeurs, atteintes à la vie privée (plaques d'immatriculation lisibles, visages de tiers sans accord…), spam, publicité non sollicitée, piratage, tricherie, usurpation d'identité.</p>
        <h2>4. Modération</h2>
        <p>Les administrateurs peuvent masquer un contenu, couper la parole temporairement ou définitivement, ou suspendre un compte en cas de manquement. Tu peux signaler un contenu avec le bouton « Signaler » ou via la page Contact.</p>
        <h2>5. Le jeu de cartes</h2>
        <p>Les cartes, packs, cristaux et éditions limitées sont des objets <b>virtuels sans valeur monétaire</b> : ils ne peuvent être ni achetés, ni vendus, ni échangés contre de l'argent. Ils servent uniquement à jouer. Les tirages sont aléatoires et réalisés par le serveur. Les échanges se font entre pilotes volontaires, sans contrepartie financière. Toute tentative de triche (scripts, failles, comptes multiples pour gagner des cartes) peut entraîner la remise à zéro de la collection et la suspension du compte. Nous pouvons ajuster, rééquilibrer ou retirer des cartes pour le bon fonctionnement du jeu.</p>
        <h2>6. Concours photo</h2>
        <p>Une photo par pilote et par mois, validée par la modération. Tu ne peux pas voter pour ta propre photo. La récompense (badge, carte spéciale, cristaux) est purement virtuelle. Le concours est gratuit, sans obligation d'achat ; l'éditeur peut écarter une participation non conforme.</p>
        <h2>7. Annonces entre pilotes</h2>
        <p>${esc(LEGAL.siteName)} met en relation mais n'intervient pas dans les ventes ou échanges de pièces : vérifie l'état et l'origine des pièces, méfie-toi des paiements à l'avance, et signale toute annonce douteuse.</p>
        <h2>8. Sécurité routière et responsabilité</h2>
        <p>Les chronos et performances se réalisent sur circuit fermé, jamais sur route ouverte. Les informations techniques sont indicatives. L'éditeur ne peut être tenu responsable des dommages liés à l'utilisation du site, à une modification de véhicule, à un contenu publié par un tiers ou à une indisponibilité du service, dans les limites permises par la loi.</p>
        <h2>9. Données personnelles</h2>
        <p>Voir la <a href="#/legal/confidentialite">politique de confidentialité</a>.</p>
        <h2>10. Modifications et droit applicable</h2>
        <p>Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de page, et la poursuite de l'utilisation vaut acceptation. Elles sont soumises au droit français. Contact : ${mail()}.</p>`
    }
  };
  const ORDER = ["mentions", "confidentialite", "cgu"];

  function render(params) {
    const key = DOCS[params.doc] ? params.doc : "mentions", d = DOCS[key];
    const root = document.getElementById("legal-root"), title = document.getElementById("legal-title"), nav = document.getElementById("legal-nav");
    if (!root) return;
    title.textContent = d.title;
    nav.innerHTML = ORDER.map((k) => `<a class="page-tab${k === key ? " active" : ""}" href="#/legal/${k}"${k === key ? ' aria-current="page"' : ""}>${esc(DOCS[k].title)}</a>`).join("");
    root.innerHTML = d.html();
    document.title = d.title + " | MOTORAUTO";
  }
  window.MALegal = { render, config: LEGAL };
  if (window.Router) window.Router.register("legal", { enter: (params) => render(params) });
})();
