#!/usr/bin/env node
/**
 * MOTORAUTO — recherche automatique des photos de voitures (Wikipédia / Wikimedia Commons, images libres).
 *
 * Usage (depuis le dossier du projet) :
 *   node scripts/fetch-images.js                 -> toutes les voitures dont l'image manque (fichier absent du dossier img/)
 *   node scripts/fetch-images.js --limit 20      -> seulement les 20 premières (pour essayer)
 *   node scripts/fetch-images.js --ids a,b,c     -> seulement ces identifiants
 *   node scripts/fetch-images.js --dry           -> affiche ce qui serait trouvé, sans rien télécharger ni écrire
 *   node scripts/fetch-images.js --force         -> refait aussi les voitures déjà traitées par ce script
 *   node scripts/fetch-images.js --all           -> traite même les voitures qui ont déjà une image valide
 *
 * Ce que fait le script, pour chaque voiture :
 *   1. cherche la page Wikipédia (fr puis en) qui correspond à « marque modèle » ;
 *   2. récupère la photo principale de la page, uniquement si elle est sur Wikimedia Commons (licence libre) ;
 *   3. la télécharge en 900 px dans img/auto/ et note l'auteur, la licence et le lien dans img/auto/credits.json ;
 *   4. génère js/data-enrich-zzz-images.js, qui rattache l'image à la fiche (et le crédit « Photo : auteur, licence »).
 * Aucun module à installer : il suffit de Node 18 ou plus.
 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const OUT_DIR = path.join(root, "img", "auto");
const CREDITS = path.join(OUT_DIR, "credits.json");
const REPORT = path.join(OUT_DIR, "rapport.json");
const PATCH = path.join(root, "js", "data-enrich-zzz-images.js");
const UA = "MotorautoImageFetcher/1.0 (projet personnel motorauto.fr ; recherche de photos libres)";
const WIDTH = 900;

const argv = process.argv.slice(2);
const has = (k) => argv.includes("--" + k);
const val = (k) => { const i = argv.indexOf("--" + k); return i >= 0 ? argv[i + 1] : ""; };
const DRY = has("dry"), FORCE = has("force"), ALL = has("all");
const LIMIT = Number(val("limit")) || 0, IDS = val("ids") ? val("ids").split(",").map((s) => s.trim()).filter(Boolean) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// ---------------------------------------------------------------- lecture du catalogue (mêmes fichiers que le site)
function loadCars() {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const files = [...html.matchAll(/src="(js\/data[^"]*\.js)"/g)].map((m) => m[1]).filter((f) => !/data-enrich-zzz-images/.test(f));
  const ctx = { console: { log() {}, warn() {}, error() {} } }; ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
  files.forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f }));
  const db = vm.runInContext('typeof MOTORAUTO_DATABASE !== "undefined" ? MOTORAUTO_DATABASE : null', ctx);
  if (!db) throw new Error("Catalogue introuvable (MOTORAUTO_DATABASE).");
  return db;
}
const hasValidImage = (c) => [c.image].concat(c.images || []).filter(Boolean).some((p) => /^https?:/i.test(p) || fs.existsSync(path.join(root, p)));

// ---------------------------------------------------------------- appels API
async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams(Object.assign({ format: "json", formatversion: "2" }, params));
  for (let t = 0; t < 4; t++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
      if (r.status === 429 || r.status >= 500) { await sleep(1500 * (t + 1)); continue; }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) { if (t === 3) throw e; await sleep(800 * (t + 1)); }
  }
  return null;
}
async function download(url) {
  for (let t = 0; t < 4; t++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.status === 429 || r.status >= 500) { await sleep(2000 * (t + 1)); continue; }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (t === 3) throw e; await sleep(1000 * (t + 1)); }
  }
  return null;
}

// ---------------------------------------------------------------- correspondance voiture <-> page
const NOISE = new Set(["phase", "restylage", "generation", "gen", "serie", "series", "version", "versions", "edition", "berline", "portes", "porte", "et", "and", "de", "du", "la", "le", "les", "the", "mk", "type"]);
function modelTokens(car) {
  const m = norm(String(car.model || "").replace(/\([^)]*\)/g, " "));
  return m.split(" ").filter((t) => t && !NOISE.has(t) && (t.length > 2 || /\d/.test(t)));
}
function firstYear(car) { const m = String(car.years || "").match(/(1[89]\d\d|20\d\d)/); return m ? m[1] : ""; }
function scoreTitle(title, car) {
  const t = " " + norm(title) + " ", brand = norm(car.brand).split(" ").filter(Boolean);
  if (/homonymie|disambiguation|liste d|list of/i.test(title)) return 0;
  const brandHit = brand.length ? brand.some((b) => t.includes(" " + b + " ")) : true;
  const toks = modelTokens(car); if (!toks.length) return brandHit ? 0.5 : 0;
  const cov = toks.filter((k) => t.includes(" " + k + " ")).length / toks.length;
  return Math.round((0.3 * (brandHit ? 1 : 0) + 0.7 * cov) * 100) / 100;
}
function queriesFor(car) {
  const model = String(car.model || "").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  const y = firstYear(car), q = [`${car.brand} ${model}`];
  if (y) q.push(`${car.brand} ${model} ${y}`);
  return [...new Set(q.map((s) => s.trim()))];
}
const BAD_FILE = /logo|badge|emblem|embleme|icon|\.svg$|\.gif$|diagram|schema|map\b|signature|flag/i;

/** informations de licence d'un fichier Commons (null si le fichier n'est pas libre ou introuvable) */
async function commonsInfo(file) {
  const j = await api("commons.wikimedia.org", { action: "query", titles: "File:" + file, prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: String(WIDTH) });
  const p = j && j.query && j.query.pages && j.query.pages[0], ii = p && !p.missing && p.imageinfo && p.imageinfo[0];
  if (!ii) return null;
  if (!/^image\/(jpeg|png)$/.test(ii.mime || "")) return null;
  const md = ii.extmetadata || {}, g = (k) => String((md[k] && md[k].value) || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const lic = g("LicenseShortName") || g("License");
  if (/fair use|non-free|nonfree|all rights reserved/i.test(lic + " " + g("UsageTerms"))) return null;
  return { thumb: ii.thumburl || ii.url, mime: ii.mime, author: g("Artist") || "auteur inconnu", license: lic || "licence libre", page: ii.descriptionurl || "" };
}

/** meilleure photo trouvée pour une voiture */
async function findImage(car) {
  const cands = new Map();
  for (const host of ["fr.wikipedia.org", "en.wikipedia.org"]) {
    for (const q of queriesFor(car)) {
      let j = null;
      try { j = await api(host, { action: "query", generator: "search", gsrsearch: q, gsrlimit: "5", gsrnamespace: "0", prop: "pageimages", piprop: "name", pilimit: "5" }); } catch (_) { continue; }
      const pages = (j && j.query && j.query.pages) || [];
      pages.forEach((p) => {
        if (!p.pageimage || BAD_FILE.test(p.pageimage)) return;
        const s = scoreTitle(p.title, car), key = host + "|" + p.title;
        const prev = cands.get(key); if (!prev || s > prev.score) cands.set(key, { host, title: p.title, file: p.pageimage, score: s, rank: p.index || 9 });
      });
      await sleep(120);
    }
    const best = [...cands.values()].sort((a, b) => b.score - a.score)[0];
    if (best && best.score >= 0.85) break;   // inutile d'interroger l'autre langue
  }
  const list = [...cands.values()].filter((c) => c.score >= 0.5).sort((a, b) => (b.score - a.score) || (a.rank - b.rank));
  for (const c of list.slice(0, 4)) {
    const info = await commonsInfo(c.file).catch(() => null);
    if (info) return Object.assign({ title: c.title, wiki: c.host, file: c.file, score: c.score, query: queriesFor(car)[0] }, info);
  }
  return null;
}

// ---------------------------------------------------------------- fichiers générés
function readJson(f, d) { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (_) { return d; } }
function writePatch(credits) {
  const M = {};
  Object.keys(credits).forEach((id) => {
    const c = credits[id]; if (!c || !c.path) return;
    M[id] = [c.path, `Photo : ${c.author}, ${c.license}`];
  });
  const js = `/** MOTORAUTO — photos trouvées automatiquement (généré par scripts/fetch-images.js : ne pas modifier à la main).
 *  Sources et licences : img/auto/credits.json. Ne touche qu'aux voitures listées ci-dessous. */
(function () {
  "use strict";
  if (typeof MOTORAUTO_DATABASE === "undefined") return;
  const M = ${JSON.stringify(M, null, 1)};
  MOTORAUTO_DATABASE.forEach((c) => {
    const m = M[c.id]; if (!m) return;
    c.image = m[0]; c.images = [m[0]].concat((c.images || []).filter((x) => x !== m[0] && !/^img\\/auto\\//.test(x))); c.imageCredit = m[1];
  });
})();
`;
  fs.writeFileSync(PATCH, js);
}

// ---------------------------------------------------------------- principal
(async () => {
  const cars = loadCars();
  const credits = readJson(CREDITS, {});
  let todo = cars.filter((c) => (IDS ? IDS.includes(c.id) : (ALL || !hasValidImage(c)) && (FORCE || !credits[c.id] || !credits[c.id].path)));
  if (LIMIT) todo = todo.slice(0, LIMIT);
  console.log(`${cars.length} voitures au catalogue, ${todo.length} à traiter${DRY ? " (essai à blanc : rien n'est écrit)" : ""}.`);
  if (!todo.length) { console.log("Rien à faire."); return; }
  if (!DRY) fs.mkdirSync(OUT_DIR, { recursive: true });
  const rep = { ok: [], check: [], none: [], error: [] };
  let n = 0;
  for (const car of todo) {
    n++;
    const tag = `[${n}/${todo.length}] ${car.brand} ${car.model}`;
    try {
      const r = await findImage(car);
      if (!r) { rep.none.push({ id: car.id, name: `${car.brand} ${car.model}` }); console.log(`✖ ${tag} : aucune photo libre trouvée`); continue; }
      const level = r.score >= 0.85 ? "ok" : "check";
      if (DRY) { console.log(`${level === "ok" ? "✔" : "⚠"} ${tag} -> « ${r.title} » (${r.file}) ${r.license}`); (level === "ok" ? rep.ok : rep.check).push({ id: car.id }); continue; }
      const buf = await download(r.thumb);
      if (!buf || buf.length < 5000) throw new Error("téléchargement vide");
      const ext = r.mime === "image/png" ? "png" : "jpg", rel = `img/auto/${car.id}.${ext}`;
      fs.writeFileSync(path.join(root, rel), buf);
      credits[car.id] = { path: rel, author: r.author, license: r.license, source: r.page, wikipedia: `https://${r.wiki}/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`, page: r.title, score: r.score, level };
      (level === "ok" ? rep.ok : rep.check).push({ id: car.id, name: `${car.brand} ${car.model}`, trouve: r.title, score: r.score });
      console.log(`${level === "ok" ? "✔" : "⚠"} ${tag} -> « ${r.title} »${level === "check" ? " (à vérifier)" : ""}`);
      if (n % 20 === 0) { fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 1)); writePatch(credits); }
    } catch (e) { rep.error.push({ id: car.id, erreur: e.message }); console.log(`! ${tag} : ${e.message}`); }
    await sleep(200);
  }
  if (!DRY) {
    fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 1)); writePatch(credits);
    fs.writeFileSync(REPORT, JSON.stringify(rep, null, 1));
  }
  console.log(`\nTerminé : ${rep.ok.length} image(s) trouvée(s) sûres · ${rep.check.length} à vérifier · ${rep.none.length} sans photo libre · ${rep.error.length} erreur(s).`);
  if (!DRY) console.log("Détail : img/auto/rapport.json  ·  crédits : img/auto/credits.json");
})().catch((e) => { console.error("Erreur :", e.message); process.exit(1); });
