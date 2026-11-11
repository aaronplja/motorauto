#!/usr/bin/env node
/**
 * MOTORAUTO — recherche automatique des photos de voitures (Wikipédia / Wikimedia Commons, images libres).
 *
 * Usage (depuis le dossier du projet) :
 *   node scripts/fetch-images.js                 -> toutes les voitures dont l'image manque (fichier absent du dossier img/)
 *   node scripts/fetch-images.js --limit 20      -> seulement les 20 premières (pour essayer)
 *   node scripts/fetch-images.js --ids a,b,c     -> seulement ces identifiants
 *   node scripts/fetch-images.js --dry           -> affiche ce qui serait trouvé, sans rien télécharger ni écrire
 *   node scripts/fetch-images.js --jobs 6        -> 6 voitures en parallèle (8 par défaut, 12 au maximum)
 *   node scripts/fetch-images.js --reject a,b    -> retire les photos de ces voitures (mauvaise photo) : voir img/auto/revue.html
 *   node scripts/fetch-images.js --force         -> refait aussi les voitures déjà traitées par ce script
 *   node scripts/fetch-images.js --all           -> traite même les voitures qui ont déjà une image valide
 *
 * Ce que fait le script, pour chaque voiture :
 *   1. cherche la page Wikipédia (fr, en, de, it, es) qui correspond à « marque modèle » avec plusieurs variantes de nom, puis, à défaut, directement dans Wikimedia Commons (photo alors marquée « à vérifier ») ;
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
  const html = fs.readFileSync(path.join(root, "index.src.html"), "utf8");
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
  const raw = String(car.model || ""), model = raw.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  const paren = (raw.match(/\(([^)]*)\)/g) || []).map((x) => x.replace(/[()]/g, "").trim()).filter(Boolean);
  const y = firstYear(car), B = car.brand, q = [`${B} ${model}`];
  if (y) q.push(`${B} ${model} ${y}`);
  paren.forEach((pp) => { q.push(`${B} ${model} ${pp}`); if (/^[A-Za-z]{0,2}\d{2,3}[A-Za-z]?$|^[A-Z]{1,3}\d{0,3}$|^[A-Z]\d{2,3}$/.test(pp)) q.push(`${B} ${pp}`); });
  const t = model.split(" ");
  if (t.length > 2) q.push(`${B} ${t.slice(0, 2).join(" ")}`);     // « Porsche 911 Carrera » si le nom est long
  if (t.length > 1) q.push(`${B} ${t[0]}`);                          // « Porsche 911 »
  q.push(`${model} ${y || ""} automobile`.trim());                    // sans la marque, au cas où elle est écrite autrement
  return [...new Set(q.map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean))];
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
  const cands = new Map(), qs = queriesFor(car);
  const search = async (host, q) => {
    let j = null;
    try { j = await api(host, { action: "query", generator: "search", gsrsearch: q, gsrlimit: "8", gsrnamespace: "0", prop: "pageimages", piprop: "name", pilimit: "8" }); } catch (_) { return; }
    ((j && j.query && j.query.pages) || []).forEach((p) => {
      if (!p.pageimage || BAD_FILE.test(p.pageimage)) return;
      const s = scoreTitle(p.title, car), key = host + "|" + p.title;
      const prev = cands.get(key); if (!prev || s > prev.score) cands.set(key, { host, title: p.title, file: p.pageimage, score: s, rank: p.index || 9 });
    });
  };
  const top = () => [...cands.values()].sort((a, b) => b.score - a.score)[0];
  for (const host of ["fr.wikipedia.org", "en.wikipedia.org", "de.wikipedia.org", "it.wikipedia.org", "es.wikipedia.org"]) {
    await search(host, qs[0]);                                           // 1re requête seule : suffit dans la grande majorité des cas
    if (top() && top().score >= 0.85) break;
    await Promise.all(qs.slice(1).map((q) => search(host, q)));          // sinon, toutes les autres variantes en même temps
    if (top() && top().score >= 0.85) break;
  }
  const list = [...cands.values()].filter((c) => c.score >= 0.5).sort((a, b) => (b.score - a.score) || (a.rank - b.rank));
  if (!(list[0] && list[0].score >= 0.85)) {                              // pas de page Wikipédia sûre : on fouille la catégorie Commons du modèle
    const viaCat = await categoryImage(car).catch(() => null); if (viaCat) return viaCat;
  }
  for (const c of list.slice(0, 8)) {
    const info = await commonsInfo(c.file).catch(() => null);
    if (info) return Object.assign({ title: c.title, wiki: c.host, file: c.file, score: c.score, query: qs[0] }, info);
  }
  return (await categoryImage(car).catch(() => null)) || (await commonsSearch(car)) || (await openverseSearch(car));
}

/** catégorie Wikimedia Commons du modèle (« Category:Lamborghini Miura ») : contient des dizaines de photos de la voiture ; on garde la meilleure vue extérieure, grande et horizontale */
async function categoryImage(car) {
  const seen = new Set(); let bestCat = null;
  for (const q of queriesFor(car).slice(0, 4)) {
    let j = null;
    try { j = await api("commons.wikimedia.org", { action: "query", generator: "search", gsrsearch: q, gsrnamespace: "14", gsrlimit: "6" }); } catch (_) { continue; }
    ((j && j.query && j.query.pages) || []).forEach((p) => {
      if (seen.has(p.title)) return; seen.add(p.title);
      const nm = String(p.title).replace(/^Category:/, ""); if (/interior|engine|wheels|logo|badge|models of|museum|in popular culture/i.test(nm)) return;
      const sc = scoreTitle(nm, car); if (sc >= 0.8 && (!bestCat || sc > bestCat.sc || (sc === bestCat.sc && nm.length < bestCat.nm.length))) bestCat = { title: p.title, nm, sc };
    });
    if (bestCat && bestCat.sc >= 0.95) break;
  }
  if (!bestCat) return null;
  const j = await api("commons.wikimedia.org", { action: "query", generator: "categorymembers", gcmtitle: bestCat.title, gcmtype: "file", gcmlimit: "60", prop: "imageinfo", iiprop: "url|mime|size|extmetadata", iiurlwidth: String(WIDTH) });
  const yr = firstYear(car); let best = null;
  ((j && j.query && j.query.pages) || []).forEach((p) => {
    const ii = p.imageinfo && p.imageinfo[0]; if (!ii || !/^image\/jpeg$/.test(ii.mime || "") || !(ii.width >= 1200) || ii.width < ii.height * 1.2) return;
    const name = String(p.title).replace(/^File:/, "").replace(/\.[a-z]+$/i, "");
    if (BAD_FILE.test(name) || /interior|innen|interieur|engine|motor|wheel|dashboard|cockpit|detail|logo|rear view only|museum plate|seat|steering|badge|emblem|poster|brochure|advert|drawing|model car|scale/i.test(name)) return;
    const md = ii.extmetadata || {}, g = (k) => String((md[k] && md[k].value) || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    const lic = g("LicenseShortName") || g("License"); if (/fair use|non-free|nonfree|all rights reserved/i.test(lic + " " + g("UsageTerms"))) return;
    // meilleure photo : le nom du fichier cite le modèle, vue de trois quarts avant, bonne résolution
    const v = scoreTitle(name, car) * 3 + (/front|avant|3.?4|three|quarter|vorne/i.test(name) ? 0.8 : 0) + (yr && name.includes(yr) ? 0.4 : 0) + Math.min(ii.width, 4000) / 8000;
    if (!best || v > best.v) best = { v, title: bestCat.nm, wiki: "commons.wikimedia.org", file: String(p.title).replace(/^File:/, ""), score: bestCat.sc >= 0.95 ? 0.9 : 0.84, thumb: ii.thumburl || ii.url, mime: ii.mime, author: g("Artist") || "auteur inconnu", license: lic || "licence libre", page: ii.descriptionurl || "", query: bestCat.nm };
  });
  return best;
}

/** repli : cherche directement une photo dans Wikimedia Commons (nom de fichier contenant la marque et le modèle). Toujours signalée « à vérifier ». */
async function commonsSearch(car) {
  const found = new Map();
  for (const q of queriesFor(car).slice(0, 4)) {
    let j = null;
    try { j = await api("commons.wikimedia.org", { action: "query", generator: "search", gsrsearch: q + " filetype:bitmap", gsrlimit: "12", gsrnamespace: "6", prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: String(WIDTH) }); } catch (_) { continue; }
    ((j && j.query && j.query.pages) || []).forEach((p) => {
      const ii = p.imageinfo && p.imageinfo[0]; if (!ii || !/^image\/(jpeg|png)$/.test(ii.mime || "")) return;
      const name = String(p.title || "").replace(/^File:/, "").replace(/\.[a-z]+$/i, "");
      if (BAD_FILE.test(name) || /interior|innen|interieur|engine|motor|wheel|dashboard|cockpit|detail|logo/i.test(name)) return;
      const sc = scoreTitle(name, car); if (sc < 0.8) return;
      const md = ii.extmetadata || {}, g = (k) => String((md[k] && md[k].value) || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      const lic = g("LicenseShortName") || g("License");
      if (/fair use|non-free|nonfree|all rights reserved/i.test(lic + " " + g("UsageTerms"))) return;
      const yr = firstYear(car), bonus = yr && name.includes(yr) ? 0.05 : 0;
      const prev = found.get(p.title); const score = Math.min(0.84, sc + bonus);
      if (!prev || score > prev.score) found.set(p.title, { title: name, wiki: "commons.wikimedia.org", file: String(p.title).replace(/^File:/, ""), score, thumb: ii.thumburl || ii.url, mime: ii.mime, author: g("Artist") || "auteur inconnu", license: lic || "licence libre", page: ii.descriptionurl || "", query: q });
    });
    await sleep(120);
  }
  return [...found.values()].sort((a, b) => b.score - a.score)[0] || null;
}

/** dernier repli : Openverse (moteur de recherche d'images sous licence Creative Commons, dont Flickr), uniquement les licences qui autorisent la réutilisation et la modification. Toujours « à vérifier ». */
async function openverseSearch(car) {
  const best = new Map();
  for (const q of queriesFor(car).slice(0, 3)) {
    let j = null;
    try {
      const r = await fetch("https://api.openverse.org/v1/images/?" + new URLSearchParams({ q, page_size: "15", license_type: "commercial,modification", category: "photograph", mature: "false" }), { headers: { "User-Agent": UA } });
      if (!r.ok) continue; j = await r.json();
    } catch (_) { continue; }
    ((j && j.results) || []).forEach((x) => {
      const name = String(x.title || ""); if (!name || BAD_FILE.test(name) || /interior|engine|wheel|dashboard|cockpit|detail|logo|model car|toy|lego|diecast/i.test(name)) return;
      const sc = scoreTitle(name, car); if (sc < 0.85) return;
      const url = x.thumbnail || x.url; if (!url) return;
      const yr = firstYear(car), score = Math.min(0.84, sc - 0.01 + (yr && name.includes(yr) ? 0.02 : 0));
      const key = x.id || url, prev = best.get(key);
      if (!prev || score > prev.score) best.set(key, { title: name, wiki: "openverse.org", file: name, score, thumb: url, mime: /\.png(\?|$)/i.test(url) ? "image/png" : "image/jpeg", author: x.creator || "auteur inconnu", license: String(x.license || "cc").toUpperCase() + (x.license_version ? " " + x.license_version : ""), page: x.foreign_landing_url || x.url || "", query: q });
    });
    await sleep(300);
  }
  return [...best.values()].sort((a, b) => b.score - a.score)[0] || null;
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
  if (val("reject")) {      // --reject id1,id2 : retire ces photos (mauvaise voiture) ; elles ne seront plus cherchées automatiquement
    val("reject").split(",").map((x) => x.trim()).filter(Boolean).forEach((id) => {
      const c = credits[id]; if (c && c.path) { try { fs.unlinkSync(path.join(root, c.path)); } catch (_) { /* déjà supprimée */ } }
      credits[id] = { rejected: true }; console.log("✖ photo retirée :", id);
    });
    fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 1)); writePatch(credits);
    console.log("Ajoute ensuite la bonne photo depuis le site (« + Photo » ou « + Lien »)."); return;
  }
  let todo = cars.filter((c) => (IDS ? IDS.includes(c.id) : (ALL || !hasValidImage(c)) && (FORCE || !credits[c.id] || (!credits[c.id].path && !credits[c.id].rejected))));
  if (LIMIT) todo = todo.slice(0, LIMIT);
  console.log(`${cars.length} voitures au catalogue, ${todo.length} à traiter${DRY ? " (essai à blanc : rien n'est écrit)" : ""}.`);
  if (!todo.length) { console.log("Rien à faire."); return; }
  if (!DRY) fs.mkdirSync(OUT_DIR, { recursive: true });
  const rep = { ok: [], check: [], none: [], error: [] };
  let n = 0, next = 0;
  const work = async (car) => {
    n++;
    const tag = `[${n}/${todo.length}] ${car.brand} ${car.model}`;
    try {
      const r = await findImage(car);
      if (!r) { rep.none.push({ id: car.id, name: `${car.brand} ${car.model}` }); console.log(`✖ ${tag} : aucune photo libre trouvée`); return; }
      const level = r.score >= 0.85 ? "ok" : "check";
      if (DRY) { console.log(`${level === "ok" ? "✔" : "⚠"} ${tag} -> « ${r.title} » (${r.file}) ${r.license}`); (level === "ok" ? rep.ok : rep.check).push({ id: car.id }); return; }
      const buf = await download(r.thumb);
      if (!buf || buf.length < 5000) throw new Error("téléchargement vide");
      const ext = r.mime === "image/png" ? "png" : "jpg", rel = `img/auto/${car.id}.${ext}`;
      fs.writeFileSync(path.join(root, rel), buf);
      credits[car.id] = { path: rel, author: r.author, license: r.license, source: r.page, wikipedia: /commons|openverse/.test(r.wiki) ? r.page : `https://${r.wiki}/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`, page: r.title, score: r.score, level };
      (level === "ok" ? rep.ok : rep.check).push({ id: car.id, name: `${car.brand} ${car.model}`, trouve: r.title, score: r.score });
      console.log(`${level === "ok" ? "✔" : "⚠"} ${tag} -> « ${r.title} »${level === "check" ? " (à vérifier)" : ""}`);
      if (n % 20 === 0) { fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 1)); writePatch(credits); }
    } catch (e) { rep.error.push({ id: car.id, erreur: e.message }); console.log(`! ${tag} : ${e.message}`); }
    await sleep(30);
  };
  const JOBS = Math.max(1, Math.min(12, Number(val("jobs")) || 8));      // voitures traitées en parallèle (8 par défaut ; baisse à 4 si Wikimedia ralentit)
  await Promise.all(Array.from({ length: JOBS }, async () => { while (next < todo.length) await work(todo[next++]); }));
  if (!DRY) {
    fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 1)); writePatch(credits);
    fs.writeFileSync(REPORT, JSON.stringify(rep, null, 1));
  }
  console.log(`\nTerminé : ${rep.ok.length} image(s) trouvée(s) sûres · ${rep.check.length} à vérifier · ${rep.none.length} sans photo libre · ${rep.error.length} erreur(s).`);
  if (!DRY) console.log("Détail : img/auto/rapport.json  ·  crédits : img/auto/credits.json");
})().catch((e) => { console.error("Erreur :", e.message); process.exit(1); });
