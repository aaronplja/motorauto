"use strict";
/** Série 2xx, lot C : e-mail à vérifier, préférences d'e-mails, RSS, Mon année */
const { assert, read, ok } = require("./_helpers");
ok("bandeau « Vérifie ton e-mail » avec renvoi du lien (ADD-205)", () => { const j = read("js/my-year.js"); assert(/ma-verify-bar/.test(j) && /sendEmailVerification/.test(j) && /my-year\.js/.test(read("index.src.html"))); });
ok("e-mails par type : réglages, règles, fonctions (ADD-206)", () => {
  assert(/settings-email-login/.test(read("pages/settings.html")) && /settings-email-event/.test(read("pages/settings.html")));
  assert(/'emailLogin', 'emailEvent'/.test(read("firestore.rules")));
  const f = read("functions/mail-functions.js"); assert(/noLogin/.test(f) && /noEvent/.test(f));
  assert(/delete o\.emailLogin/.test(read("js/app.js")), "ces préférences ne vont jamais dans le profil public");
});
ok("flux RSS des Nouveautés généré au build (ADD-208)", () => { assert(/application\/rss\+xml/.test(read("index.src.html")) && /<rss version="2\.0">/.test(read("feed.xml")) && /<item>/.test(read("feed.xml"))); });
ok("« Mon année » : récapitulatif + image à partager (ADD-209)", () => { assert(/openYear/.test(read("js/my-year.js")) && /yearImage/.test(read("js/catalogue/share.js")) && /my-year-btn/.test(read("pages/settings.html"))); });
