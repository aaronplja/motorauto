#!/usr/bin/env node
/**
 * MOTORAUTO — construction du site pour la mise en ligne.
 *
 * Source de vérité : index.src.html (+ js/*.js et css/*.css, que l'on continue d'éditer comme avant).
 * Ce script produit :
 *   - css/bundle.min.css : toutes les feuilles de style de index.src.html, dans le même ordre, minifiées
 *   - js/bundle.min.js   : tous les scripts locaux (defer) de index.src.html, dans le même ordre, minifiés
 *   - index.html         : la page réellement servie (2 fichiers au lieu de ~180, chargés dès le <head>)
 * Les fichiers js/ et css/ d'origine restent en place (chat.html et l'éditeur visuel s'en servent encore).
 *
 * Usage : node scripts/build.js          (à lancer après toute modification de index.src.html, js/ ou css/)
 *         node scripts/build.js --check  (vérifie que index.html est à jour, sans rien écrire ; code 1 sinon)
 * Minification : utilise « esbuild » s'il est installé (npm i -D esbuild) ; sinon les fichiers sont seulement regroupés.
 */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = path.join(__dirname, "..");
const rd = (f) => fs.readFileSync(path.join(root, f), "utf8");
let es = null;
for (const p of ["esbuild", path.join(root, "node_modules/esbuild"), "/opt/npm-tools/node_modules/esbuild"]) { try { es = require(p); break; } catch (_) { /* suivant */ } }
if (!es) console.warn("⚠ esbuild introuvable : regroupement sans minification (npm i -D esbuild pour minifier).");

const src = rd("index.src.html");
const CSS_RE = /^[ \t]*<link rel="stylesheet" href="(css\/[^"?]+\.css)">[ \t]*\r?\n/gm;
const JS_RE = /^[ \t]*<script defer src="(js\/[^"?]+\.js)"><\/script>[ \t]*\r?\n/gm;

const cssFiles = [...src.matchAll(CSS_RE)].map((m) => m[1]);
const jsFiles = [...src.matchAll(JS_RE)].map((m) => m[1]);
if (!cssFiles.length || !jsFiles.length) { console.error("Aucune feuille de style ou aucun script trouvé dans index.src.html."); process.exit(1); }

// --- modules « à la demande » : chargés après le premier affichage (administration pour les administrateurs, quiz+ sur la page quiz)
//     le fichier reste listé dans index.src.html (mode développement sans build) ; le build le sort des bundles principaux
const LAZY = {
  admin: ["js/admin-dot.js", "js/admin-extra.js", "js/admin-game.js", "js/admin-logos.js", "js/admin-noimg.js", "js/admin-rarity.js", "js/admin-steps.js", "js/pro-admin.js"],
  quiz: ["js/quiz-plus.js"]
};
const lazyOf = new Map(); Object.keys(LAZY).forEach((k) => LAZY[k].forEach((f) => lazyOf.set(f, k)));
const mainFiles = jsFiles.filter((f) => !lazyOf.has(f));

const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
const minJs = (code, f) => { if (!es) return code; try { return es.transformSync(code, { minify: true, target: "es2019", charset: "utf8", legalComments: "none" }).code; } catch (e) { throw new Error(f + " : " + e.message); } };
const minCss = (code, f) => { if (!es) return code; try { return es.transformSync(code, { loader: "css", minify: true, charset: "utf8", legalComments: "none" }).code; } catch (e) { throw new Error(f + " : " + e.message); } };

// --- CSS : un seul fichier, ordre conservé
const cssOut = cssFiles.map((f) => minCss(rd(f), f)).join("\n");
const cssHash = hash(cssOut);

// --- JS : groupes consécutifs ; un fichier qui commence par "use strict" reste seul (sinon la directive serait perdue ou s'étendrait aux voisins)
const isStrict = (code) => /^\s*(\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*["']use strict["']/.test(code);
const groups = []; let curG = null;
mainFiles.forEach((f) => {
  const code = rd(f);
  if (isStrict(code)) { groups.push({ strict: true, files: [f], parts: [minJs(code, f)] }); curG = null; return; }
  if (!curG) { curG = { strict: false, files: [], parts: [] }; groups.push(curG); }
  curG.files.push(f); curG.parts.push(minJs(code, f));
});
const outputs = groups.map((g, i) => { const name = groups.length === 1 ? "bundle.min.js" : `bundle${i + 1}.min.js`; const body = g.parts.join("\n;\n") + "\n"; return { name, body, h: hash(body), files: g.files }; });

const lazyOut = Object.keys(LAZY).map((k) => { const body = LAZY[k].filter((f) => jsFiles.includes(f)).map((f) => minJs(rd(f), f)).join("\n;\n") + "\n"; return { key: k, name: `lazy-${k}.min.js`, body, h: hash(body) }; });

// --- index.html
let html = src, firstCss = true, jsIdx = new Map();
// regroupe : on remplace le 1er fichier de chaque groupe par la balise du bundle, on supprime les autres
const firstOf = new Map(outputs.map((o) => [o.files[0], o]));
const skip = new Set(outputs.flatMap((o) => o.files.slice(1)));
html = html.replace(CSS_RE, (m, f) => { if (!firstCss) return ""; firstCss = false; return `  <link rel="stylesheet" href="css/bundle.min.css?v=${cssHash}">\n`; });
let headTags = "";
html = html.replace(JS_RE, (m, f) => { if (lazyOf.has(f)) return ""; if (firstOf.has(f)) { const o = firstOf.get(f); headTags += `  <script defer src="js/${o.name}?v=${o.h}"></script>\n`; } return ""; });
// les scripts regroupés partent dans le <head> (téléchargement dès le début), juste après les scripts Firebase déjà présents
headTags = `  <script>window.MA_LAZY=${JSON.stringify(Object.fromEntries(lazyOut.map((o) => [o.key, "js/" + o.name + "?v=" + o.h])))};</script>\n` + headTags;
const lastFb = [...html.matchAll(/<script defer src="https:\/\/www\.gstatic\.com\/firebasejs\/[^"]+"><\/script>\r?\n/g)].pop();
if (!lastFb) { console.error("Scripts Firebase introuvables dans <head>."); process.exit(1); }
const at = lastFb.index + lastFb[0].length;
html = html.slice(0, at) + headTags + html.slice(at);
html = html.replace(/<head>/, "<head>\n<!-- FICHIER GÉNÉRÉ par scripts/build.js — ne pas modifier : éditer index.src.html puis relancer « node scripts/build.js » -->");

const files = { "index.html": html, "css/bundle.min.css": cssOut };
fs.readdirSync(path.join(root, "js")).filter((n) => /^(bundle\d*|lazy-[a-z]+)\.min\.js$/.test(n)).forEach((n) => { if (!outputs.find((o) => o.name === n) && !lazyOut.find((o) => o.name === n)) files["js/" + n] = null; });
outputs.forEach((o) => { files["js/" + o.name] = o.body; });
lazyOut.forEach((o) => { files["js/" + o.name] = o.body; });

if (process.argv.includes("--check")) {
  const bad = Object.keys(files).filter((f) => { const p = path.join(root, f); return files[f] === null ? fs.existsSync(p) : !fs.existsSync(p) || fs.readFileSync(p, "utf8") !== files[f]; });
  if (bad.length) { console.error("Pas à jour : " + bad.join(", ") + "\n→ lance : node scripts/build.js"); process.exit(1); }
  console.log("OK : index.html et les bundles sont à jour."); process.exit(0);
}
Object.keys(files).forEach((f) => { const p = path.join(root, f); if (files[f] === null) { fs.rmSync(p, { force: true }); return; } fs.writeFileSync(p, files[f]); });
const kb = (n) => Math.round(n / 1024) + " Ko";
console.log(`CSS : ${cssFiles.length} fichiers → 1 (${kb(cssOut.length)})`);
console.log(`JS  : ${jsFiles.length} fichiers → ${outputs.length} (${outputs.map((o) => o.name + " " + kb(o.body.length)).join(", ")}) + à la demande : ${lazyOut.map((o) => o.name + " " + kb(o.body.length)).join(", ")}`);
console.log("index.html régénéré.");
