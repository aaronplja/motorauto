"use strict";
/** Série 2xx, lot D : polices hébergées, requêtes de démarrage, banque de quiz à la demande, démontage de pages */
const { assert, read, ok } = require("./_helpers");
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");

ok("polices hébergées : plus de Google Fonts, fichiers présents, CSP resserrée (DEL-201)", () => {
  const h = read("index.src.html") + read("chat.html"); assert(!/fonts\.(googleapis|gstatic)\.com/.test(h));
  const css = read("css/fonts.css"); const files = [...css.matchAll(/url\(\.\.\/fonts\/([^)]+)\)/g)].map((m) => m[1]);
  assert(files.length >= 16); files.forEach((f) => assert(fs.existsSync(path.join(root, "fonts", f)), "police absente : " + f));
  const v = JSON.parse(read("vercel.json")).headers.flatMap((b) => b.headers).find((x) => x.key === "Content-Security-Policy").value; assert(!/fonts\.g/.test(v));
});
ok("logos de marques demandés seulement près de l'écran (DEL-203)", () => { assert(/IntersectionObserver/.test(read("js/catalogue/brand-logos.js"))); });
ok("banque de quiz : fichier séparé, même contenu qu'avant, copie serveur identique (DEL-204)", () => {
  const core = require("../js/game-core.js"); assert(core.QBANK.length >= 600 && typeof core.ensureBank === "function");
  assert.strictEqual(read("js/quiz-bank.js"), read("functions/quiz-bank.js")); assert.strictEqual(read("js/game-core.js"), read("functions/game-core.js"));
  assert(!/QBANK = \[\n/.test(read("js/game-core.js")) && /ensureBank/.test(read("js/game/minigames.js")));
  const b = fs.readFileSync(path.join(root, "scripts/build.js"), "utf8"); assert(/quizbank: \["js\/quiz-bank\.js"\]/.test(b));
});
ok("démontage du catalogue et du profil pilote à la sortie (DEL-205)", () => { const j = read("js/unmount.js"); assert(/vehicles-grid/.test(j) && /pub-profile-cars/.test(j) && /unmount\.js/.test(read("index.src.html"))); });
