/** Initialise Firebase une seule fois et expose window.MAFB (partagé par l'accueil et le salon). */
(function () {
  "use strict";
  const firebaseConfig = {
    apiKey: "AIzaSyA_0Y40KgUm20M4lowGCx9QG8C6CDwYhbE",
    authDomain: "motorautoireyv.firebaseapp.com",
    projectId: "motorautoireyv",
    storageBucket: "motorautoireyv.firebasestorage.app",
    messagingSenderId: "163440700630",
    appId: "1:163440700630:web:83bc46e3cf474bd490ad77",
    measurementId: "G-L0DB7Q786G"
  };
  // App Check (TECH-101) : colle ici la clé de site reCAPTCHA v3 créée dans la console Firebase > App Check.
  // Tant qu'elle est vide, App Check reste désactivé et le site fonctionne comme avant.
  const APPCHECK_SITE_KEY = "";
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  try { if (APPCHECK_SITE_KEY && firebase.appCheck) firebase.appCheck().activate(APPCHECK_SITE_KEY, true); } catch (_) { /* facultatif */ }
  window.MAFB = {
    auth: firebase.auth(),
    db: firebase.firestore(),
    storage: typeof firebase.storage === "function" ? firebase.storage() : null,
    // fonctions du jeu (tirage des cartes, échanges, défis…) : même région que functions/index.js
    functions: typeof firebase.functions === "function" ? firebase.app().functions("europe-west1") : null,
    FieldValue: firebase.firestore.FieldValue,
    FieldPath: firebase.firestore.FieldPath,
    firebase
  };
})();
