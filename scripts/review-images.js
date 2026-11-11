#!/usr/bin/env node
/**
 * MOTORAUTO — page de contrôle des photos trouvées automatiquement.
 *   node scripts/review-images.js     -> crée img/auto/revue.html (à ouvrir dans le navigateur : double-clic)
 * Toutes les photos s'affichent avec le nom de la voiture, la page d'où elle vient et le niveau de confiance (les « à vérifier » en premier).
 * Coche celles qui ne correspondent pas à la voiture, clique « Copier la commande » et colle-la dans le Terminal :
 *   node scripts/fetch-images.js --reject id1,id2,…
 */
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const credits = JSON.parse(fs.readFileSync(path.join(root, "img/auto/credits.json"), "utf8"));
const names = {};
try {   // noms lisibles (marque + modèle) : lus dans les fichiers de données
  const vm = require("vm"), html = fs.readFileSync(path.join(root, "index.src.html"), "utf8");
  const ctx = { console: { log() {}, warn() {}, error() {} } }; ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
  [...html.matchAll(/src="(js\/data[^"]*\.js)"/g)].map((m) => m[1]).filter((f) => !/zzz-images/.test(f)).forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx));
  vm.runInContext("MOTORAUTO_DATABASE", ctx).forEach((c) => { names[c.id] = `${c.brand} ${c.model} (${c.years})`; });
} catch (_) { /* sans noms : on affiche les identifiants */ }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const list = Object.keys(credits).filter((id) => credits[id].path).sort((a, b) => ((credits[a].level === "ok") - (credits[b].level === "ok")) || a.localeCompare(b));
const cards = list.map((id) => { const c = credits[id];
  return `<label class="c ${c.level === "ok" ? "" : "chk"}"><img loading="lazy" src="${esc(path.basename(c.path))}"><input type="checkbox" value="${esc(id)}"><b>${esc(names[id] || id)}</b><small>${c.level === "ok" ? "✔ sûre" : "⚠ à vérifier"} · trouvée sur « ${esc(c.page || "")} » · ${esc(c.license || "")}</small></label>`; }).join("\n");
fs.writeFileSync(path.join(root, "img/auto/revue.html"), `<!doctype html><meta charset="utf-8"><title>Contrôle des photos</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font:14px system-ui;margin:0;background:#f6f3ea;color:#1a1a17}header{position:sticky;top:0;background:#1a1a17;color:#fff;padding:12px 16px;display:flex;gap:12px;align-items:center;z-index:2}header button{background:#6fcf97;border:0;border-radius:99px;padding:8px 16px;font-weight:600;cursor:pointer}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;padding:16px}.c{background:#fff;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 1px 4px #0002}.c.chk{outline:2px solid #e3a008}
.c img{width:100%;aspect-ratio:16/10;object-fit:cover}.c b{padding:8px 10px 0}.c small{padding:2px 10px 10px;color:#666}.c input{position:absolute;top:8px;right:8px;width:24px;height:24px}.c:has(input:checked){outline:3px solid #d33}</style>
<header><strong>${list.length} photos</strong><span id="n">0 à retirer</span><button id="go">Copier la commande</button></header><main>${cards}</main>
<script>const n=document.getElementById("n"),ids=()=>[...document.querySelectorAll("input:checked")].map(i=>i.value);document.addEventListener("change",()=>n.textContent=ids().length+" à retirer");
document.getElementById("go").onclick=()=>{const c="node scripts/fetch-images.js --reject "+ids().join(",");navigator.clipboard.writeText(c).then(()=>alert("Commande copiée : colle-la dans le Terminal."),()=>prompt("Copie cette commande :",c))};</script>`);
console.log(`✔ img/auto/revue.html créé (${list.length} photos). Ouvre-le dans ton navigateur.`);
