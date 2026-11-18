/**
 * MOTORAUTO — Administration : « Logos de marques ».
 * Même principe que « Voitures sans image » : une ligne par marque, on colle le lien https du logo puis Entrée, et on passe à la marque suivante.
 * Les liens sont enregistrés dans Firestore config/brand_logos { map: { cléDeMarque: url } } (lecture publique, écriture admin) ;
 * js/brand-logos.js les lit et remplace les initiales de la marque par son logo, partout sur le site.
 * Un logo déjà présent dans assets/brands/ (fichier du site) ou déjà enregistré par lien est détecté : ces marques sont masquées par défaut.
 */
(function () {
  "use strict";
  let C = null, map = {}, shown = 60, added = 0;
  const done = new Set();
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const key = (b) => window.MABrandLogos.key(b);
  const label = (b) => String(b || "").split(/\s*[\/&]\s*/)[0].trim();
  const filesChecked = new Map();   // clé -> true/false (logo fichier assets/brands/<clé>.svg)

  function brands() {
    const m = new Map();
    C.cars.forEach((c) => { if (c.special || !c.brand) return; const k = key(c.brand); if (!k) return; const o = m.get(k) || { k, name: label(c.brand), n: 0 }; o.n++; m.set(k, o); });
    return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }
  const hasFile = (k) => filesChecked.get(k) === true;
  const hasLogo = (b) => !!map[b.k] || hasFile(b.k);

  async function probeFiles(list) {
    const todo = list.filter((b) => !filesChecked.has(b.k));
    for (let i = 0; i < todo.length; i += 10) {
      await Promise.all(todo.slice(i, i + 10).map((b) => new Promise((ok) => {
        const im = new Image(); im.onload = () => { filesChecked.set(b.k, true); ok(); }; im.onerror = () => { filesChecked.set(b.k, false); ok(); };
        im.src = new URL("assets/brands/" + b.k + ".svg", document.baseURI).href;
      })));
    }
  }

  function css() {
    if (document.getElementById("abl-css")) return;
    const s = document.createElement("style"); s.id = "abl-css";
    s.textContent = `#abl{position:fixed;inset:0;z-index:9300;background:var(--bg-core);color:var(--color-ink);display:flex;flex-direction:column}
      #abl header{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:14px 16px;border-bottom:1px solid var(--stroke-line);background:var(--bg-surface)}
      #abl header h2{margin:0;font-size:1.1rem;flex:1 1 200px}#abl .abl-tools{display:flex;gap:8px;flex-wrap:wrap;width:100%;align-items:center}
      #abl input[type=url],#abl input[type=search]{font:inherit;padding:9px 12px;border-radius:10px;border:1px solid var(--stroke-line);background:var(--bg-elevated);color:var(--color-ink);min-width:0}
      #abl .abl-q{flex:1 1 180px}
      #abl .abl-body{flex:1;overflow:auto;padding:10px 16px 40px;display:flex;flex-direction:column;gap:8px}
      #abl .abl-row{display:grid;grid-template-columns:minmax(150px,1fr) minmax(180px,2fr) auto;gap:10px;align-items:center;background:var(--bg-surface);border:1px solid var(--stroke-line);border-radius:12px;padding:10px}
      #abl .abl-row.done{opacity:.55}
      #abl .abl-name{display:flex;gap:10px;align-items:center;min-width:0}#abl .abl-name b{display:block}#abl .abl-name small{color:var(--color-secondary)}
      #abl .abl-logo{width:44px;height:44px;border-radius:50%;background:#fff center/68% no-repeat;border:1px solid var(--stroke-line);flex:none;display:grid;place-items:center;font-weight:700;color:#475569;font-size:.8rem}
      #abl .abl-in{display:flex;gap:8px;align-items:center;min-width:0}#abl .abl-in input{flex:1}
      #abl .abl-act{display:flex;gap:6px;align-items:center}#abl a.abl-s{font-size:.8rem;color:var(--accent);text-decoration:none;white-space:nowrap}
      #abl .abl-err{color:#ef4444;font-size:.78rem;grid-column:1/-1}
      @media(max-width:700px){#abl .abl-row{grid-template-columns:1fr}}`;
    document.head.appendChild(s);
  }

  function rows() {
    const q = ((document.getElementById("abl-q") || {}).value || "").toLowerCase(), all = !!(document.getElementById("abl-all") || {}).checked;
    const list = brands();
    const want = list.filter((b) => (all || !hasLogo(b) || done.has(b.k)) && (!q || b.name.toLowerCase().includes(q)));
    return { list, want };
  }
  function logoUrl(b) { return map[b.k] || (hasFile(b.k) ? new URL("assets/brands/" + b.k + ".svg", document.baseURI).href : ""); }
  function paint() {
    const body = document.querySelector("#abl .abl-body"); if (!body) return;
    const { list, want } = rows(), todo = list.filter((b) => !hasLogo(b)).length;
    document.getElementById("abl-count").textContent = `${todo} marque${todo > 1 ? "s" : ""} sans logo · ${list.length - todo} avec logo · ${added} ajouté${added > 1 ? "s" : ""} pendant cette session`;
    body.innerHTML = want.slice(0, shown).map((b) => {
      const u = logoUrl(b);
      return `<div class="abl-row ${done.has(b.k) ? "done" : ""}" data-k="${esc(b.k)}">
      <div class="abl-name"><span class="abl-logo" ${u ? `style="background-image:url('${esc(u)}')"` : ""}>${u ? "" : esc(b.name.slice(0, 2).toUpperCase())}</span><div><b>${esc(b.name)}</b><small>${b.n} voiture${b.n > 1 ? "s" : ""}${map[b.k] ? " · logo par lien" : hasFile(b.k) ? " · logo du site" : ""}</small></div></div>
      <div class="abl-in"><input type="url" inputmode="url" placeholder="${u ? "Remplacer : colle un autre lien https" : "Colle le lien https du logo puis Entrée"}" aria-label="Lien du logo de ${esc(b.name)}"></div>
      <div class="abl-act"><a class="abl-s" target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(b.name + " logo png fond transparent")}">Chercher ↗</a>
        <button type="button" class="cta-btn compact-btn" data-abl-add>Ajouter</button>${map[b.k] ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-abl-del>Retirer</button>` : ""}</div>
      <div class="abl-err" hidden></div></div>`; }).join("")
      + (want.length > shown ? `<button type="button" class="cta-btn btn-ghost" data-abl-more>Afficher plus (${want.length - shown} restantes)</button>` : "")
      + (!want.length ? `<p style="color:var(--color-secondary)">Rien à afficher.</p>` : "");
  }

  async function write(next) {
    await C.db.collection("config").doc("brand_logos").set({ map: next });
    map = next; window.MABrandLogos.setRemote(map);
  }
  async function add(row) {
    const k = row.dataset.k, inp = row.querySelector("input"), err = row.querySelector(".abl-err"), url = inp.value.trim();
    err.hidden = true;
    if (!/^https:\/\//i.test(url) || url.length > 500) { err.textContent = "L'adresse doit commencer par https:// (500 caractères maximum)."; err.hidden = false; inp.focus(); return; }
    const ok = await new Promise((res) => { const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = url; });
    if (!ok) { err.textContent = "Ce lien ne donne pas une image lisible : vérifie qu'il mène bien au fichier du logo (.png, .svg, .webp…)."; err.hidden = false; return; }
    const b = row.querySelector("[data-abl-add]"); b.disabled = true;
    try { await write(Object.assign({}, map, { [k]: url })); }
    catch (e) { b.disabled = false; err.textContent = "Enregistrement refusé : " + (e.code === "permission-denied" ? "règles Firestore à publier (config/brand_logos)." : e.message); err.hidden = false; return; }
    b.disabled = false; done.add(k); added++; row.classList.add("done"); inp.value = ""; inp.disabled = true;
    const lg = row.querySelector(".abl-logo"); lg.textContent = ""; lg.style.backgroundImage = `url('${url}')`;
    const next = row.nextElementSibling && row.nextElementSibling.querySelector && row.nextElementSibling.querySelector("input:not(:disabled)");
    if (next) { next.focus(); next.scrollIntoView({ block: "center", behavior: "smooth" }); }
    const n = document.getElementById("abl-count"); if (n) n.textContent = n.textContent.replace(/^\d+/, (x) => Math.max(0, Number(x) - 1));
  }
  async function del(row) {
    const k = row.dataset.k, next = Object.assign({}, map); delete next[k];
    try { await write(next); } catch (e) { const er = row.querySelector(".abl-err"); er.textContent = "Échec : " + e.message; er.hidden = false; return; }
    paint();
  }

  async function open() {
    if (!C || !C.isAdmin || document.getElementById("abl")) return;
    css(); added = 0; shown = 60; done.clear();
    const d = document.createElement("div"); d.id = "abl"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Logos de marques");
    d.innerHTML = `<header><h2>Logos de marques</h2><button type="button" class="cta-btn btn-ghost compact-btn" data-abl-x>Fermer</button>
      <div class="abl-tools"><input type="search" class="abl-q" id="abl-q" placeholder="Rechercher une marque…" aria-label="Rechercher">
      <label style="display:flex;gap:6px;align-items:center;font-size:.85rem"><input type="checkbox" id="abl-all"> Afficher aussi celles qui ont déjà un logo</label></div>
      <small id="abl-count" style="width:100%;color:var(--color-secondary)">Chargement…</small></header><div class="abl-body"></div>`;
    document.body.appendChild(d); document.body.classList.add("tcg-open");
    const close = () => { d.remove(); document.body.classList.remove("tcg-open"); document.removeEventListener("keydown", esc2); if (added) C.toast(added + " logo" + (added > 1 ? "s ajoutés" : " ajouté"), "ok"); };
    const esc2 = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", esc2);
    d.addEventListener("click", (e) => {
      if (e.target.closest("[data-abl-x]")) return close();
      if (e.target.closest("[data-abl-more]")) { shown += 60; return paint(); }
      const a = e.target.closest("[data-abl-add]"); if (a) return add(a.closest(".abl-row"));
      const r = e.target.closest("[data-abl-del]"); if (r) del(r.closest(".abl-row"));
    });
    d.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches(".abl-row input")) { e.preventDefault(); add(e.target.closest(".abl-row")); } });
    d.addEventListener("input", (e) => { if (e.target.matches("#abl-q")) { shown = 60; paint(); } });
    d.addEventListener("change", (e) => { if (e.target.matches("#abl-all")) { shown = 60; paint(); } });
    map = await window.MABrandLogos.load(true);
    await probeFiles(brands());
    if (document.getElementById("abl")) { paint(); const f = d.querySelector(".abl-row input"); if (f) f.focus(); }
  }

  function sync() {
    const host = document.getElementById("ani-btn") || document.getElementById("open-site-editor"); if (!host) return;
    let b = document.getElementById("abl-btn");
    if (!(C && C.isAdmin)) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("button"); b.type = "button"; b.id = "abl-btn"; b.className = "cta-btn btn-ghost"; b.textContent = "Logos de marques"; b.onclick = open; host.insertAdjacentElement("afterend", b); }
    else if (b.previousElementSibling !== host && host.id === "ani-btn") host.insertAdjacentElement("afterend", b);
  }
  function start() {
    if (!window.MAApp || !window.MABrandLogos) return setTimeout(start, 300);
    C = window.MAApp.ctx();
    let t = 0; new MutationObserver(() => { if (t) return; t = requestAnimationFrame(() => { t = 0; C = window.MAApp.ctx(); sync(); }); }).observe(document.body, { childList: true, subtree: true });
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
