#!/usr/bin/env node
/**
 * MOTORAUTO — ajoute des voitures au catalogue en lot : UNE FICHE PAR VOITURE, à partir d'un simple tableau.
 *
 *   node scripts/add-cars.js voitures.csv            -> crée js/data-enrich-pack-voitures.js et l'ajoute au site
 *   node scripts/add-cars.js voitures.csv --photos   -> en plus, cherche les photos libres (Wikimedia) des nouvelles voitures
 *   node scripts/add-cars.js voitures.csv --dry      -> montre ce qui serait créé, sans rien écrire
 *
 * Le tableau (CSV ou TSV, 1re ligne = en-têtes ; export Excel / Numbers / Google Sheets accepté) :
 *   marque ; modele ; categorie ; annees ; puissance ; couple ; vmax ; zero ; moteur ; transmission ; description ; histoire ; palmares
 *   (histoire = la biographie de la fiche · palmares = plusieurs lignes séparées par « ¦ », chacune « Titre : texte » ou juste un texte)
 * Seuls marque et modele sont obligatoires. « annees » : « 1998 - 2005 ». « zero » : le 0 à 100 km/h en secondes.
 * Une ligne = une voiture = une fiche (jamais plusieurs modèles sur la même fiche). L'identifiant est tiré de « marque modele ».
 * Les chiffres saisis sont marqués « indicatifs » sur la fiche.
 *
 * Ensuite : node scripts/sync-functions.js  (pools de jeu)  ·  node scripts/build-seo.js  (pages voiture)  ·  node scripts/build.js
 * Aucun module à installer (Node 18+).
 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const root = path.join(__dirname, "..");
const args = process.argv.slice(2), file = args.find((a) => !a.startsWith("--"));
const DRY = args.includes("--dry"), PHOTOS = args.includes("--photos");
if (!file) { console.error("Usage : node scripts/add-cars.js voitures.csv [--photos] [--dry]"); process.exit(1); }

const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const num = (v) => { const n = parseFloat(String(v || "").replace(",", ".").replace(/[^\d.]/g, "")); return isFinite(n) ? n : 0; };

// ---- lecture CSV / TSV (guillemets acceptés)
function parse(text) {
  text = text.replace(/^﻿/, "");
  const first = text.split(/\r?\n/)[0], sep = first.includes("\t") ? "\t" : (first.split(";").length >= first.split(",").length ? ";" : ",");
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x.trim())) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
const KEY = { marque: "brand", brand: "brand", modele: "model", model: "model", categorie: "category", category: "category", annees: "years", years: "years", annee: "years",
  puissance: "power", ch: "power", couple: "torque", vmax: "speed", vitessemax: "speed", zero: "zero", "0100": "zero", moteur: "engine", engine: "engine",
  transmission: "trans", boite: "trans", description: "desc", histoire: "history", palmares: "records", palmaresrecords: "records", records: "records", anecdote: "anecdote" };
const rows = parse(fs.readFileSync(path.resolve(file), "utf8"));
const head = rows.shift().map((h) => KEY[slug(h).replace(/-/g, "")] || null);
if (!head.includes("brand") || !head.includes("model")) { console.error("Il faut au moins les colonnes « marque » et « modele »."); process.exit(1); }
const list = rows.map((r) => { const o = {}; head.forEach((k, i) => { if (k) o[k] = (r[i] || "").trim(); }); return o; }).filter((o) => o.brand && o.model);

// ---- identifiants déjà pris
const html = fs.readFileSync(path.join(root, "index.src.html"), "utf8");
const files = [...html.matchAll(/src="(js\/data[^"]*\.js)"/g)].map((m) => m[1]).filter((f) => !/data-enrich-zzz-images/.test(f));
const ctx = { console: { log() {}, warn() {}, error() {} } }; ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
files.forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f }));
const taken = new Set(vm.runInContext("MOTORAUTO_DATABASE.map(c=>c.id)", ctx));

const out = [], skipped = [];
list.forEach((o) => {
  const id = slug(o.brand + " " + o.model);
  if (taken.has(id)) { skipped.push(id); return; }
  taken.add(id);
  const years = o.years || "";
  const desc = o.desc || `${o.brand} ${o.model}${years ? " (" + years + ")" : ""}${o.category ? ", " + o.category.toLowerCase() : ""}.`;
  const recs = (o.records || "").split("¦").map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf(" : "); return i > 0 && i < 40 ? [x.slice(0, i), x.slice(i + 3)] : ["Palmarès", x]; });
  out.push({ id, brand: o.brand, model: o.model, category: o.category || "Coupé", years, desc, history: o.history || "", recs,
    e: [o.engine || "—", num(o.power), num(o.torque), num(o.speed), num(o.zero), o.trans || "—"] });
});
const name = slug(path.basename(file, path.extname(file))) || "pack";
const target = path.join(root, "js", `data-enrich-pack-${name}.js`);
console.log(`${list.length} ligne(s) lue(s) · ${out.length} voiture(s) à créer · ${skipped.length} déjà au catalogue${skipped.length ? " (" + skipped.join(", ") + ")" : ""}.`);
if (DRY || !out.length) { out.slice(0, 8).forEach((c) => console.log("  +", c.id)); if (DRY) console.log("(essai à blanc : rien n'est écrit)"); process.exit(0); }

const js = `/** MOTORAUTO — pack « ${name} » : ${out.length} voiture(s), une fiche chacune (généré par scripts/add-cars.js, modifiable à la main). */
(function () {
  "use strict";
  const { E, P, C, push } = MAKIT;
  push([
${out.map((c) => `    C(${JSON.stringify(c.id)}, ${JSON.stringify(c.brand)}, ${JSON.stringify(c.model)}, ${JSON.stringify(c.category)}, ${JSON.stringify(c.years)}, ${JSON.stringify(c.desc)},
      [P("Version principale", "", [E(${c.e.map((v) => JSON.stringify(v)).join(", ")})])], { h: ${JSON.stringify(c.history)}, r: ${JSON.stringify(c.recs)}, approx: true })`).join(",\n")}
  ]);
})();
`;
fs.writeFileSync(target, js);
// rattache le fichier au site (avant les photos automatiques)
const tag = `  <script defer src="js/data-enrich-pack-${name}.js"></script>\n`;
let src = fs.readFileSync(path.join(root, "index.src.html"), "utf8");
if (!src.includes(`data-enrich-pack-${name}.js`)) {
  const anchor = src.indexOf('  <script defer src="js/data-enrich-zzz-images.js"></script>');
  if (anchor < 0) { console.error("Point d'insertion introuvable dans index.src.html : ajoute la balise à la main :\n" + tag); process.exit(1); }
  src = src.slice(0, anchor) + tag + src.slice(anchor); fs.writeFileSync(path.join(root, "index.src.html"), src);
}
console.log(`✔ js/data-enrich-pack-${name}.js créé et ajouté à index.src.html (${out.length} voitures).`);
if (PHOTOS) {
  console.log("Recherche des photos libres…");
  cp.spawnSync(process.execPath, [path.join(__dirname, "fetch-images.js"), "--ids", out.map((c) => c.id).join(","), "--jobs", "4"], { stdio: "inherit" });
}
console.log("\nÀ faire ensuite :\n  node scripts/sync-functions.js && node scripts/build-seo.js && node scripts/build.js\n  puis, pour les cartes de jeu : cd functions && firebase deploy --only functions");
