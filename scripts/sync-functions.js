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
  + "\n" + fs.readdirSync(path.join(root, "js")).filter((f) => /^data-(alfa|audi|lemans|bmw.*|mercedes.*|renault.*|alpine.*|rally.*|split|enrich.*)\.js$/.test(f)).map((f) => f.replace(/\.js$/, "")).sort((a, b) => (/enrich/.test(a) - /enrich/.test(b)) || (a < b ? -1 : 1)).concat([]).reduce((a, f) => a.concat(f), ["data-kit"]).map((f) => fs.readFileSync(path.join(root, "js/" + f + ".js"), "utf8")).join("\n");
const cars = new Function(src + ";return MOTORAUTO_DATABASE;")();
const list = cars.map((c) => MA.normalizeCar(c)).map((c) => ({ id: c.id, power: c.stats.power, speed: c.stats.speed || 0, zero: c.stats.zero || 0, name: (c.brand + " " + c.model).trim(), brand: c.brand, category: c.category, year: require(path.join(root, "js/game-core.js")).yearOf(c), pics: require(path.join(root, "js/game-core.js")).picKeys(c) }));
fs.writeFileSync(path.join(root, "functions/catalog-static.json"), JSON.stringify(list));
console.log("functions/game-core.js copié · " + list.length + " voitures dans functions/catalog-static.json");

// « Un modèle = une carte » dans le plus-ou-moins : les fiches qui regroupent plusieurs modèles (« 205 GTI (1.6 & 1.9) »,
// « MX-5 (NB & NBFL) »…) sont éclatées en une entrée par motorisation, avec ses propres chiffres.
const SEP = / \/ | & | et |\+|,/;
const variants = [];
cars.forEach((raw) => {
  const c = MA.normalizeCar(raw), full = (c.brand + " " + c.model).trim();
  if (!SEP.test(full)) return;
  const seen = new Set(), mine = [];
  (raw.phases || []).forEach((ph) => (ph.engines || []).forEach((e) => {
    const power = Number(e.power) || 0, speed = Number(e.speed) || 0, zero = Number(e.zeroToHundred) || 0, key = [e.name, power, speed, zero].join("|");
    if (power > 0 && !seen.has(key)) { seen.add(key); mine.push({ name: String(e.name || "").trim(), power, speed, zero }); }
  }));
  if (mine.length < 2) return;
  mine.forEach((m, i) => variants.push({ id: c.id + "~" + (i + 1), base: c.id, power: m.power, speed: m.speed, zero: m.zero, name: full + " · " + m.name, brand: c.brand, category: c.category, year: require(path.join(root, "js/game-core.js")).yearOf(c), label: String(c.model).trim() + " · " + m.name }));
});
fs.writeFileSync(path.join(root, "functions/catalog-variants.json"), JSON.stringify(variants));
fs.writeFileSync(path.join(root, "js/car-variants.js"), "/* généré par scripts/sync-functions.js : ne pas modifier à la main */\nwindow.MA_VARIANTS = " + JSON.stringify(variants.map((v) => [v.id, v.base, v.label, v.power, v.speed, v.zero])) + ";\n");
console.log("functions/catalog-variants.json · " + variants.length + " modèles séparés (plus ou moins) issus de " + new Set(variants.map((v) => v.base)).size + " fiches");

// index léger des voitures pour les mentions « #bmw-m3-e46 » (messages, commentaires, bio) : identifiant, nom, années — chargé aussi par le chat
const idx = cars.map((c) => [c.id, ((c.brand || "") + " " + (c.model || "")).replace(/\s+/g, " ").trim(), String(c.years || "")]);
fs.writeFileSync(path.join(root, "js/car-index.js"), "/* généré par scripts/sync-functions.js : ne pas modifier à la main */\nwindow.MA_CAR_INDEX = " + JSON.stringify(idx) + ";\n");
console.log("js/car-index.js · " + idx.length + " voitures");
