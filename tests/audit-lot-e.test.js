"use strict";
/** Série 2xx, lot E : adresses propres, rangement, types, changelog */
const { assert, read, ok } = require("./_helpers");
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");

ok("adresses propres à l'ouverture : réécriture Vercel + script d'entrée (ADD-201)", () => {
  const v = JSON.parse(read("vercel.json")); assert(v.rewrites && /catalogue/.test(v.rewrites[0].source) && v.rewrites[0].destination === "/index.html");
  assert(!/\(([^)]*\|)?voiture(\||\))/.test(v.rewrites[0].source.replace("voiture-pilote", "")), "les dossiers statiques voiture/ et marque/ ne sont pas masqués");
  assert(/ADD-201/.test(read("index.src.html")));
});
ok("js/ et css/ rangés par rôle ; chaque fichier déclaré existe (ORG-203, ORG-204)", () => {
  ["js/game", "js/social", "js/catalogue", "js/chat", "css/base", "css/components", "css/pages", "css/themes"].forEach((d) => assert(fs.existsSync(path.join(root, d)), d));
  ["index.src.html", "chat.html"].forEach((f) => [...read(f).matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)/g)].forEach((m) => assert(fs.existsSync(path.join(root, m[1])), f + " : " + m[1])));
  assert(!fs.existsSync(path.join(root, "js/cards.js")) && fs.existsSync(path.join(root, "js/game/cards.js")));
});
ok("vérification de types configurée sur utils, game-core, quiz-bank (ORG-205)", () => {
  const t = JSON.parse(read("tsconfig.check.json")); assert(t.compilerOptions.checkJs === true && t.files.includes("js/game-core.js") && t.files.includes("js/utils.js"));
  assert(JSON.parse(read("package.json")).scripts["check:types"]);
});
ok("CHANGELOG généré depuis js/news-seed.js (ORG-206)", () => { const c = read("docs/CHANGELOG.md"); assert(/Fichier généré/.test(c) && /2026-11-19/.test(c)); });
ok("nouveautés : l'entrée du jour est publiée (FR + EN)", () => { const w = {}; new Function("window", read("js/news-seed.js"))(w); const e = w.MA_NEWS_SEED.find((x) => x.id === "s-2026-11-19"); assert(e && e.fr.title && e.en.title); });

ok(".vercelignore : chaque ligne est ancrée à la racine (sinon css/pages/ et js/data/ ne sont pas déployés)", () => {
  read(".vercelignore").split("\n").filter((l) => l.trim() && !l.startsWith("#")).forEach((l) => assert(l.startsWith("/"), "ligne non ancrée : " + l));
});

ok("images : la liste des fichiers présents (img-index) existe et les fiches générées ne pointent que vers des fichiers connus (lot 1)", () => {
  const idx = read("js/data/img-index.js"); assert(/window\.MA_IMG = new Set\(\[/.test(idx) && idx.length > 1000, "liste vide");
  assert(/MA_IMG/.test(read("js/data/data-kit.js")) && /MA_IMG/.test(read("js/data/data-split.js")));
  assert(read("index.src.html").indexOf("js/data/img-index.js") < read("index.src.html").indexOf("js/data/data.js"), "la liste doit se charger avant les données");
});
ok("boucles : en onglet masqué, bannière, clubs et pack du jour ne travaillent plus (lot 1)", () => {
  assert(/document\.hidden/.test(read("js/social/profile-banner.js")) && /!document\.hidden/.test(read("js/social/clubs-plus.js")) && /!document\.hidden/.test(read("js/game/fab-pack.js")));
});
