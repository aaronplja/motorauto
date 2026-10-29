/**
 * Prépare le dossier functions/ avant un déploiement des Cloud Functions :
 *   1. copie js/game-core.js (règles du jeu partagées avec le site) dans functions/game-core.js ;
 *   2. génère functions/catalog-static.json (identifiant + puissance de chaque voiture du catalogue local),
 *      que le serveur utilise pour tirer les cartes. Les voitures ajoutées dans l'administration (Firestore)
 *      sont lues directement par le serveur : pas besoin de relancer ce script pour elles.
 * À relancer chaque fois que js/data.js ou js/data2.js change :  node scripts/sync-functions.js
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const MA = require(path.join(root, "js/utils.js"));

fs.copyFileSync(path.join(root, "js/game-core.js"), path.join(root, "functions/game-core.js"));
// le même moteur tourne aussi dans le navigateur quand les Cloud Functions ne sont pas déployées (js/game-api.js)
fs.copyFileSync(path.join(root, "functions/game.js"), path.join(root, "js/game-engine.js"));
const src = fs.readFileSync(path.join(root, "js/data.js"), "utf8").replace(/^const MOTORAUTO_DATABASE/m, "var MOTORAUTO_DATABASE")
  + "\n" + fs.readFileSync(path.join(root, "js/data2.js"), "utf8")
  + "\n" + fs.readdirSync(path.join(root, "js")).filter((f) => /^data-(alfa|audi|lemans|enrich.*)\.js$/.test(f)).map((f) => f.replace(/\.js$/, "")).sort((a, b) => (/enrich/.test(a) - /enrich/.test(b)) || (a < b ? -1 : 1)).concat([]).reduce((a, f) => a.concat(f), ["data-kit"]).map((f) => fs.readFileSync(path.join(root, "js/" + f + ".js"), "utf8")).join("\n");
const cars = new Function(src + ";return MOTORAUTO_DATABASE;")();
const list = cars.map((c) => MA.normalizeCar(c)).map((c) => ({ id: c.id, power: c.stats.power, name: (c.brand + " " + c.model).trim() }));
fs.writeFileSync(path.join(root, "functions/catalog-static.json"), JSON.stringify(list));
console.log("functions/game-core.js copié · " + list.length + " voitures dans functions/catalog-static.json");
