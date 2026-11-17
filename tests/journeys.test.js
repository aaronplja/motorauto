/**
 * MOTORAUTO — parcours de bout en bout (navigateur réel, mode invité, sans Firebase) : npm run test:journeys
 * Demande Playwright (npm i -D playwright && npx playwright install chromium) ; sans lui, le test se déclare « ignoré » et sort en succès.
 * Vérifie : chaque grande page s'affiche et reste sans erreur de script, la page 404, la mémoire du dernier onglet, la barre Pilotes à trois univers.
 */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
let pw; try { pw = require("playwright"); } catch (_) { console.log("journeys : ignoré (Playwright non installé)"); process.exit(0); }
const root = path.join(__dirname, "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2" };
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+$/, "/index.html"));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r);
});
let n = 0; const ok = (m, c) => { if (!c) { console.error("ÉCHEC : " + m); process.exitCode = 1; } else { n++; console.log("  ok - " + m); } };
srv.listen(0, async () => {
  const base = "http://localhost:" + srv.address().port + "/index.html";
  const b = await pw.chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, locale: "fr-FR" });
  await ctx.addInitScript("window.__LOGGED=false;try{sessionStorage.setItem('ma_boot','1');localStorage.setItem('ma_studio_b','1')}catch(e){}");
  await ctx.addInitScript(require("./helpers/firebase-stub.js"));
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));   // aucun appel extérieur (Firebase, polices, images)
  const p = await ctx.newPage(), errs = []; p.on("pageerror", (e) => { if (!/MAFB|firebase|Cannot destructure/i.test(e.message)) errs.push(e.message.slice(0, 160)); });
  const go = async (h) => { await p.goto(base + "#/" + h, { waitUntil: "load" }); await p.waitForTimeout(900); return p.evaluate(() => (document.querySelector(".page-on") || {}).id || ""); };
  const pages = { "": "page-home", catalogue: "page-catalog", "communaute/fil": "page-community", "jouer/cartes": "page-play", "classement/chronos": "leaderboard-modal", quiz: "page-quizgame", frise: "page-timeline", nouveautes: "page-news", "legal/cgu": "page-legal", contact: "page-contact" };
  for (const [h, id] of Object.entries(pages)) ok("page #/" + h + " → " + id, (await go(h)) === id);
  ok("adresse inconnue → page 404", (await go("n-importe-quoi")) === "page-notfound");
  await go("jouer/defis"); await go("catalogue");
  await p.goto(base + "#/jouer", { waitUntil: "load" }); await p.waitForTimeout(700);
  ok("dernier onglet de « Jouer » mémorisé", (await p.evaluate(() => window.Router.current().params.tab)) === "defis");
  await go("communaute/fil");
  const labels = await p.evaluate(() => [...document.querySelectorAll("#page-community nav[data-section=pilotes] > .page-tabs:first-child .page-tab")].map((e) => e.textContent.trim()));
  ok("barre Pilotes : Communauté et Classement (Mon espace réservé aux connectés)", labels.some((l) => /Communaut/.test(l)) && labels.some((l) => /Classement/.test(l)) && !labels.some((l) => /^(Garage|Profil)$/.test(l)));
  ok("aucune erreur de script pendant les parcours", errs.length === 0 && (console.log(errs.slice(0, 3)), true) || errs.length === 0);
  await b.close(); srv.close(); console.log(n + " parcours vérifiés");
});
