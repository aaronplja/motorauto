/**
 * Copie le site (dossier parent) dans app-ios/www : c'est ce dossier que Capacitor embarque dans l'application.
 * On n'embarque que ce qui sert au site : pas les Cloud Functions, les tests, les scripts ni les pages SEO statiques.
 */
const fs = require("fs");
const path = require("path");
const src = path.join(__dirname, "..", "..");
const out = path.join(__dirname, "..", "www");

const KEEP = ["index.html", "chat.html", "css", "js", "assets", "manifest.webmanifest"];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
KEEP.forEach((name) => {
  const from = path.join(src, name);
  if (!fs.existsSync(from)) { console.warn("absent :", name); return; }
  fs.cpSync(from, path.join(out, name), { recursive: true });
});
// la version « app » charge le pont natif : rien d'autre à modifier, js/native.js s'active seul dans Capacitor
const count = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);
console.log("www prêt : " + count(out) + " fichiers");
