#!/usr/bin/env node
/**
 * MOTORAUTO — récupère les logos de marques (SVG monochromes) depuis le paquet « simple-icons » (licence CC0)
 * et les range dans assets/brands/, avec la liste assets/brands/index.json lue par js/brand-logos.js.
 *
 *   npm i --no-save simple-icons
 *   node scripts/brand-logos.js
 *
 * Les logos sont recolorés par le thème (masque CSS) : ils restent lisibles dans les 18 thèmes.
 * Les marques sans logo dans le paquet gardent leurs initiales.
 * Les logos restent la propriété de leurs marques : ils servent ici uniquement à les identifier (voir mentions légales).
 */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
let dir = path.join(root, "node_modules", "simple-icons", "icons");
if (!fs.existsSync(dir)) { try { dir = path.join(path.dirname(require.resolve("simple-icons")), "icons"); } catch (_) { /* ignoré */ } }
if (!fs.existsSync(dir)) { console.error("Paquet manquant : lance d'abord  npm i --no-save simple-icons  (depuis la racine du projet)"); process.exit(1); }
// nom MOTORAUTO (minuscules, sans accents ni espaces) -> nom simple-icons
const MAP = {
  abarth: "abarth", alfaromeo: "alfaromeo", astonmartin: "astonmartin", audi: "audi", bentley: "bentley", bmw: "bmw", bugatti: "bugatti", cadillac: "cadillac",
  chevrolet: "chevrolet", citroen: "citroen", dacia: "dacia", datsun: "datsun", fiat: "fiat", ford: "ford", honda: "honda", hyundai: "hyundai", jaguar: "jaguar",
  lamborghini: "lamborghini", lancia: "lancia", lagonda: "lagonda", mazda: "mazda", mclaren: "mclaren", mercedesbenz: "mercedes", mg: "mg", mini: "mini", mitsubishi: "mitsubishi",
  nissan: "nissan", opel: "opel", peugeot: "peugeot", porsche: "porsche", renault: "renault", saab: "saab", seat: "seat", skoda: "skoda", subaru: "subaru", suzuki: "suzuki",
  talbot: "talbot", toyota: "toyota", volkswagen: "volkswagen", volvo: "volvo", alpine: "alpine", ferrari: "ferrari", matra: "matra"
};
const out = path.join(root, "assets", "brands"); fs.mkdirSync(out, { recursive: true });
const have = [], missing = [];
for (const [name, si] of Object.entries(MAP)) {
  const f = path.join(dir, si + ".svg");
  if (fs.existsSync(f)) { fs.copyFileSync(f, path.join(out, name + ".svg")); have.push(name); } else missing.push(name);
}
// logos déposés à la main (assets/brands/<nom>.svg) : ajoutés à la liste
fs.readdirSync(out).filter((n) => /\.svg$/.test(n)).forEach((n) => { const k = n.replace(/\.svg$/, ""); if (!have.includes(k)) have.push(k); });
fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(have.sort()));
console.log(have.length + " logos prêts.  Sans logo (initiales conservées) : " + (missing.join(", ") || "aucune"));
