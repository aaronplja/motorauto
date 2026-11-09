/**
 * MOTORAUTO — éditeur visuel de l'interface (administrateurs uniquement ; chargé à la demande).
 * Le site s'ouvre dans un cadre (PC 1280 px ou mobile 390 px) : on clique sur un élément, puis on le déplace, le masque, le restyle,
 * change son texte / son image, ou on ajoute un bloc. PC et mobile ont chacun leur propre mise en page.
 * Brouillon enregistré automatiquement (ui_layout/draft) → « Publier » l'applique à tout le monde (ui_layout/live) et garde une version.
 * La sécurité vient des règles Firestore : seuls les admins écrivent dans ui_layout*.
 */
(function () {
  "use strict";
  const L = window.MASiteLayout;
  if (!L || window.MASiteEditor) return;
  const PAGES = [["Accueil", "/"], ["Catalogue", "/catalogue"], ["Communauté", "/communaute"], ["Communauté › Pilotes", "/communaute/pilotes"], ["Jouer", "/jouer"], ["Jouer › Collection", "/jouer/collection"], ["Jouer › Boutique", "/jouer/boutique"], ["Jouer › Échanges", "/jouer/echanges"], ["Jouer › Mini-jeux", "/jouer/minijeux"], ["Jouer › Défis", "/jouer/defis"], ["Classement", "/classement"], ["Garage", "/garage"], ["Réglages", "/reglages"], ["Clubs", "/clubs"], ["Annonces", "/annonces"], ["Marché des cartes", "/marche"], ["Fusion", "/fusion"], ["Souhaits", "/souhaits"], ["Succès", "/succes"], ["Pass", "/pass"], ["Frise", "/frise"], ["Nouveautés", "/nouveautes"], ["Contact", "/contact"], ["Légal", "/legal"]];
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let ctx = null, ov = null, frame = null, win = null, draft = L.empty(), live = L.empty(), dev = "pc", mode = "edit", picked = null, undo = [], redo = [], saveT = 0, status = "", route = "/", ready = false;

  const db = () => window.MAFB.db;
  const toast = (m, k) => { try { ctx.toast(m, k || "ok"); } catch (_) { /* ignoré */ } };

  // ---------------------------------------------------------------- données
  const entry = (rid, sel, make) => { const pg = ((draft[dev][rid] = draft[dev][rid] || { s: {}, add: [] })); pg.s = pg.s || {}; pg.add = pg.add || []; if (!pg.s[sel] && make) pg.s[sel] = {}; return pg.s[sel]; };
  function prune() {
    ["pc", "mobile"].forEach((d) => Object.keys(draft[d]).forEach((rid) => {
      const pg = draft[d][rid]; Object.keys(pg.s || {}).forEach((sel) => { const e = pg.s[sel]; if (e.css && !Object.keys(e.css).length) delete e.css; if (e.attr && !Object.keys(e.attr).length) delete e.attr; if (!Object.keys(e).filter((k) => k !== "pf" && k !== "pp").length) delete pg.s[sel]; });
      if (!Object.keys(pg.s || {}).length && !(pg.add || []).length) delete draft[d][rid];
    }));
  }
  function change(fn, keepUndo) {
    if (!keepUndo) { undo.push(JSON.stringify(draft)); if (undo.length > 80) undo.shift(); redo = []; }
    fn(); prune(); push(); autosave(); paintBar();
  }
  const push = () => { if (win && win.MASiteLayout) win.MASiteLayout.setLayout(clone(draft)); };
  function autosave() { status = "Modifications non enregistrées…"; paintStatus(); clearTimeout(saveT); saveT = setTimeout(saveDraft, 1200); }
  async function saveDraft() {
    try { await db().collection("ui_layout").doc("draft").set({ layout: JSON.stringify(draft), by: ctx.user ? ctx.user.uid : "", at: Date.now() }); status = "Brouillon enregistré"; }
    catch (e) { status = "Enregistrement impossible : " + (e.code === "permission-denied" ? "règles Firestore non publiées" : e.message); }
    paintStatus();
  }
  async function loadAll() {
    try { const s = await db().collection("ui_layout").doc("live").get(); live = s.exists && s.data().layout ? JSON.parse(s.data().layout) : L.empty(); } catch (_) { live = L.empty(); }
    let d = null; try { const s = await db().collection("ui_layout").doc("draft").get(); d = s.exists && s.data().layout ? JSON.parse(s.data().layout) : null; } catch (_) { /* ignoré */ }
    draft = d || clone(live); ["pc", "mobile"].forEach((k) => { draft[k] = draft[k] || {}; live[k] = live[k] || {}; });
    status = d ? "Brouillon repris" : "Version publiée chargée";
  }

  // ---------------------------------------------------------------- fenêtre
  const css = `
.ed-ov{position:fixed;inset:0;z-index:12000;display:grid;grid-template-rows:auto 1fr;background:#0b1020;color:#e5e7eb;font:14px/1.4 system-ui,sans-serif}
.ed-ov *{box-sizing:border-box}
.ed-bar{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;padding:.5rem .7rem;background:#111827;border-bottom:1px solid #1f2937}
.ed-bar button,.ed-bar select,.ed-pan button,.ed-pan select,.ed-pan input,.ed-pan textarea{font:inherit;color:#e5e7eb;background:#1f2937;border:1px solid #374151;border-radius:8px;padding:.35rem .6rem}
.ed-bar button,.ed-pan button{cursor:pointer}.ed-bar button:hover,.ed-pan button:hover{border-color:#38bdf8}
.ed-bar button.on{background:#0369a1;border-color:#38bdf8}.ed-bar button.pub{background:#16a34a;border-color:#22c55e;font-weight:700}.ed-bar button[disabled],.ed-pan button[disabled]{opacity:.4;cursor:default}
.ed-sp{flex:1}.ed-st{font-size:.8rem;color:#9ca3af}
.ed-main{display:grid;grid-template-columns:1fr 320px;min-height:0}
.ed-stage{position:relative;overflow:auto;display:grid;place-items:start center;padding:12px;background:#030712}
.ed-fw{transform-origin:top left;border-radius:14px;overflow:hidden;border:1px solid #374151;background:#000;flex:none}
.ed-fw iframe{border:0;display:block;background:#0b1020}
.ed-pan{overflow:auto;padding:.7rem;background:#111827;border-left:1px solid #1f2937;display:grid;gap:.7rem;align-content:start}
.ed-pan h4{margin:0;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af}
.ed-sec{display:grid;gap:.45rem;padding:.6rem;border:1px solid #1f2937;border-radius:10px}
.ed-row{display:flex;gap:.4rem;align-items:center;flex-wrap:wrap}.ed-row>label{flex:1 1 90px;display:grid;gap:.15rem;font-size:.75rem;color:#9ca3af}
.ed-row input[type=number],.ed-row select,.ed-row input[type=text],.ed-pan textarea,.ed-pan input[type=text]{width:100%}
.ed-row input[type=color]{width:100%;height:32px;padding:2px}
.ed-pan textarea{min-height:70px}.ed-hint{color:#9ca3af;font-size:.8rem;margin:0}.ed-sel{font-weight:700;word-break:break-all}
.ed-modal{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:rgba(0,0,0,.6)}
.ed-box{width:min(520px,92vw);max-height:80vh;overflow:auto;padding:1rem;border-radius:14px;background:#111827;border:1px solid #374151;display:grid;gap:.6rem}
@media (max-width:900px){.ed-main{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) 45vh}.ed-pan{border-left:0;border-top:1px solid #1f2937}.ed-stage{padding:6px}}
.ed-fab{position:fixed;left:12px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:7000;padding:.55rem .85rem;border-radius:99px;border:1px solid var(--accent);background:var(--bg-elevated);color:var(--color-ink);font:700 .85rem system-ui;cursor:pointer;box-shadow:0 8px 24px -8px rgba(0,0,0,.5)}
@media (min-width:900px){.ed-fab{bottom:18px}}`;

  function open(startRoute) {
    if (ov) return;
    if (!$("#ed-css")) { const st = document.createElement("style"); st.id = "ed-css"; st.textContent = css; document.head.appendChild(st); }
    ov = document.createElement("div"); ov.className = "ed-ov ed-chrome"; ov.setAttribute("data-no-i18n", ""); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Éditeur visuel");
    ov.innerHTML = `<div class="ed-bar" id="ed-bar"></div><div class="ed-main"><div class="ed-stage" id="ed-stage"></div><div class="ed-pan" id="ed-pan"></div></div>`;
    document.body.appendChild(ov); document.documentElement.style.overflow = "hidden";
    ov.addEventListener("click", onClick); ov.addEventListener("input", onInput); ov.addEventListener("change", onInput);
    route = startRoute || (location.hash.replace(/^#/, "") || "/");
    status = "Chargement…"; paintBar(); paintPanel();
    loadAll().then(() => { ready = true; mountFrame(); paintBar(); paintPanel(); });
  }
  function close() {
    if (!ov) return;
    if (undo.length && /non enregistr/.test(status)) saveDraft();
    ov.remove(); ov = null; frame = null; win = null; document.documentElement.style.overflow = ""; picked = null;
  }

  function mountFrame() {
    const stage = $("#ed-stage"); if (!stage) return;
    stage.innerHTML = ""; const w = dev === "pc" ? 1280 : 390, h = dev === "pc" ? 800 : 844, fw = document.createElement("div");
    fw.className = "ed-fw"; fw.id = "ed-fw";
    frame = document.createElement("iframe"); frame.title = "Aperçu du site"; frame.width = w; frame.height = h;
    frame.src = location.pathname + "?editor=1#" + route; fw.appendChild(frame); stage.appendChild(fw);
    fit();
    frame.addEventListener("load", () => { win = frame.contentWindow; });
  }
  function fit() {
    const stage = $("#ed-stage"), fw = $("#ed-fw"); if (!stage || !fw || !frame) return;
    const aw = stage.clientWidth - 24, ah = stage.clientHeight - 24, w = +frame.width;
    let h = dev === "pc" ? Math.max(500, Math.round(ah / Math.min(1, aw / w))) : Math.min(844, ah);
    const k = Math.min(1, aw / w, dev === "mobile" ? 1 : 9); frame.height = h;
    fw.style.width = w + "px"; fw.style.height = h + "px"; fw.style.transform = `scale(${k})`; fw.style.marginBottom = -(h * (1 - k)) + "px"; fw.style.marginRight = -(w * (1 - k)) + "px";
  }
  window.addEventListener("resize", () => ov && fit());

  // appelé par la page dans le cadre
  function attach(w) {
    win = w; picked = null; paintPanel();
    w.MASiteLayout.setLayout(clone(draft));
    const sync = () => { try { const h = w.location.hash.replace(/^#/, "") || "/"; route = h; const s = $("#ed-route"); if (s) { const ix = PAGES.findIndex((p) => p[1] === h); s.value = ix >= 0 ? PAGES[ix][1] : ""; } } catch (_) { /* ignoré */ } };
    w.addEventListener("hashchange", () => { picked = null; sync(); paintPanel(); }); sync();
  }
  function onPick(info) { picked = info; paintPanel(); }

  // ---------------------------------------------------------------- barre du haut
  function paintBar() {
    const b = $("#ed-bar"); if (!b) return;
    const dirty = JSON.stringify(draft) !== JSON.stringify(live);
    b.innerHTML = `<b>Éditeur</b>
      <button type="button" data-ed="dev-pc" class="${dev === "pc" ? "on" : ""}">PC</button><button type="button" data-ed="dev-mobile" class="${dev === "mobile" ? "on" : ""}">Mobile</button>
      <select id="ed-route" aria-label="Page">${PAGES.map((p) => `<option value="${p[1]}" ${p[1] === route ? "selected" : ""}>${esc(p[0])}</option>`).join("")}<option value="" ${PAGES.some((p) => p[1] === route) ? "hidden" : "selected"}>${esc(route)}</option></select>
      <button type="button" data-ed="mode-edit" class="${mode === "edit" ? "on" : ""}">Modifier</button><button type="button" data-ed="mode-nav" class="${mode === "nav" ? "on" : ""}">Naviguer</button>
      <button type="button" data-ed="undo" ${undo.length ? "" : "disabled"}>Annuler</button><button type="button" data-ed="redo" ${redo.length ? "" : "disabled"}>Rétablir</button>
      <span class="ed-sp"></span><span class="ed-st" id="ed-st"></span>
      <button type="button" data-ed="versions">Versions</button><button type="button" data-ed="discard" ${dirty ? "" : "disabled"}>Abandonner</button>
      <button type="button" data-ed="publish" class="pub" ${dirty ? "" : "disabled"}>Publier</button><button type="button" data-ed="quit">Quitter</button>`;
    paintStatus();
  }
  function paintStatus() { const s = $("#ed-st"); if (s) s.textContent = status; }

  // ---------------------------------------------------------------- panneau
  const px = (v) => (v === "" || v == null ? "" : Math.round(+v) + "px");
  const cur = (k) => { const e = picked && ((draft[dev][picked.root] || {}).s || {})[picked.sel]; return e && e.css && e.css[k] !== undefined ? e.css[k] : ""; };
  const numIn = (k, label, base, unit) => `<label>${label}<input type="number" data-css="${k}" data-u="${unit || "px"}" value="${parseFloat(cur(k)) || ""}" placeholder="${Math.round(base || 0)}"></label>`;
  const colIn = (k, label, base) => `<label>${label}<input type="color" data-css="${k}" value="${/^#[0-9a-f]{6}$/i.test(cur(k)) ? cur(k) : base || "#000000"}"></label><button type="button" data-ed="clr" data-k="${k}" title="Retirer">✕</button>`;
  function paintPanel() {
    const p = $("#ed-pan"); if (!p) return;
    if (!ready) { p.innerHTML = `<p class="ed-hint">Chargement…</p>`; return; }
    const pg = (picked && draft[dev][picked.root]) || null, adds = (draft[dev] && picked ? (draft[dev][picked.root] || {}).add : currentAdds()) || [];
    let h = `<div class="ed-sec"><h4>Appareil : ${dev === "pc" ? "PC (≥ 900 px)" : "Mobile (< 900 px)"}</h4><p class="ed-hint">Chaque appareil a sa propre mise en page. Clique un élément dans l'aperçu pour le modifier.</p></div>`;
    if (!picked) { p.innerHTML = h + pageBlocks(); return; }
    const e = ((pg || {}).s || {})[picked.sel] || {}, c = picked.cs;
    h += `<div class="ed-sec"><h4>Élément</h4><div class="ed-sel">&lt;${picked.tag}&gt; · ${picked.rect.w}×${picked.rect.h}</div><div class="ed-row"><button type="button" data-ed="parent">↑ Sélectionner le parent</button><button type="button" data-ed="reset">Réinitialiser</button></div></div>
    <div class="ed-sec"><h4>Disposition</h4><div class="ed-row"><button type="button" data-ed="up">↑ Monter</button><button type="button" data-ed="down">↓ Descendre</button><button type="button" data-ed="hide">${e.hide ? "Afficher" : "Masquer"}</button><button type="button" data-ed="del">Supprimer</button></div><p class="ed-hint">Monter/descendre change l'ordre parmi les éléments voisins. « Supprimer » masque l'élément (récupérable avec Afficher ou Versions).</p>
      <div class="ed-row">${numIn("width", "Largeur (px)", picked.rect.w)}<label>Largeur rapide<select data-css="width" data-u=""><option value="">—</option><option>auto</option><option>100%</option><option>75%</option><option>50%</option><option>33%</option></select></label></div><div class="ed-row">${numIn("height", "Hauteur (px)", picked.rect.h)}${numIn("gap", "Espacement interne", c.gap)}</div></div>`;
    if (picked.leaf) h += `<div class="ed-sec"><h4>Texte</h4><textarea data-text="1">${esc(e.text !== undefined ? e.text : picked.text)}</textarea></div>`;
    if (picked.isImg) h += `<div class="ed-sec"><h4>Image</h4><label class="ed-hint">Adresse</label><input type="text" data-attr="src" value="${esc((e.attr && e.attr.src) || picked.src)}"><label class="ed-hint">Texte alternatif</label><input type="text" data-attr="alt" value="${esc((e.attr && e.attr.alt) || picked.alt)}"><div class="ed-row"><button type="button" data-ed="upload">Téléverser une image…</button></div><input type="file" id="ed-file" accept="image/*" hidden></div>`;
    if (picked.tag === "a") h += `<div class="ed-sec"><h4>Lien</h4><input type="text" data-attr="href" value="${esc((e.attr && e.attr.href) || picked.href)}" placeholder="#/jouer ou https://…"></div>`;
    h += `<div class="ed-sec"><h4>Couleurs</h4><div class="ed-row">${colIn("color", "Texte", c.color)}</div><div class="ed-row">${colIn("background-color", "Fond", c.bg)}</div><div class="ed-row">${colIn("border-color", "Bordure", c.color)}</div></div>
    <div class="ed-sec"><h4>Texte et formes</h4><div class="ed-row">${numIn("font-size", "Taille texte", c.fontSize)}<label>Graisse<select data-css="font-weight" data-u=""><option value="">—</option><option value="400">Normal</option><option value="600">Semi-gras</option><option value="800">Gras</option></select></label></div>
      <div class="ed-row"><label>Alignement<select data-css="text-align" data-u=""><option value="">—</option><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option></select></label>${numIn("border-radius", "Arrondi", c.radius)}</div>
      <div class="ed-row">${numIn("border-width", "Bordure", c.borderW)}<label>Ombre<select data-css="box-shadow" data-u=""><option value="">—</option><option value="none">Aucune</option><option value="0 6px 18px -8px rgba(0,0,0,.45)">Douce</option><option value="0 16px 40px -10px rgba(0,0,0,.7)">Forte</option><option value="0 0 24px 2px var(--accent)">Lueur</option></select></label></div>
      <div class="ed-row">${numIn("padding", "Marge interne", c.padding)}${numIn("margin", "Marge externe", c.margin)}</div><div class="ed-row">${numIn("opacity", "Opacité (0-1)", c.opacity, "")}</div></div>`;
    h += `<div class="ed-sec"><h4>Ajouter un bloc après</h4><div class="ed-row"><label>Type<select id="ed-addtype"><option value="text">Texte</option><option value="image">Image</option><option value="button">Bouton</option><option value="banner">Bannière</option><option value="spacer">Espace vide</option></select></label></div><button type="button" data-ed="add">Ajouter</button></div>`;
    h += `<div class="ed-sec"><h4>Copier</h4><button type="button" data-ed="copy">Copier ce réglage vers ${dev === "pc" ? "le mobile" : "le PC"}</button></div>`;
    p.innerHTML = h + pageBlocks();
    // restaure les valeurs des listes déroulantes
    p.querySelectorAll("select[data-css]").forEach((s) => { const v = cur(s.dataset.css); if (v && Array.from(s.options).some((o) => o.value === v || o.text === v)) s.value = v; });
  }
  function currentAdds() { try { const root = win && win.document.querySelector(".page.page-on"); return root && draft[dev][root.id] ? draft[dev][root.id].add : []; } catch (_) { return []; } }
  function pageBlocks() {
    const all = []; Object.keys(draft[dev]).forEach((rid) => (draft[dev][rid].add || []).forEach((a) => all.push([rid, a])));
    if (!all.length) return "";
    return `<div class="ed-sec"><h4>Blocs ajoutés (${dev === "pc" ? "PC" : "mobile"})</h4>${all.map(([rid, a]) => {
      const f = a.type === "text" ? [["title", "Titre"], ["text", "Texte"]] : a.type === "image" ? [["src", "Adresse de l'image"], ["alt", "Texte alternatif"]] : a.type === "button" ? [["label", "Texte"], ["href", "Lien"]] : a.type === "banner" ? [["title", "Titre"], ["text", "Texte"], ["label", "Bouton"], ["href", "Lien"]] : [["h", "Hauteur (px)"]];
      return `<div class="ed-sec"><b>${esc(a.type)}</b>${f.map(([k, l]) => `<label class="ed-hint">${l}<input type="text" data-blk="${esc(a.id)}" data-k="${k}" data-r="${esc(rid)}" value="${esc((a.props || {})[k] || "")}"></label>`).join("")}<button type="button" data-ed="blkdel" data-id="${esc(a.id)}" data-r="${esc(rid)}">Supprimer ce bloc</button></div>`;
    }).join("")}</div>`;
  }

  // ---------------------------------------------------------------- actions
  function siblingOrders() {
    // ordre actuel (valeur « order » enregistrée, sinon position) de l'élément et de ses voisins
    const el = L.find(picked.root, picked.sel); if (!el || !el.parentElement) return null;
    const par = el.parentElement, kids = Array.from(par.children), out = [];
    kids.forEach((k, i) => { const pth = (win.MASiteLayout.pathOf(k) || {}); out.push({ el: k, sel: pth.sel || "", i }); });
    return { kids: out, par };
  }
  function move(dir) {
    const w = win; if (!w) return; const info = w.MASiteLayout; const el = info.find(picked.root, picked.sel); if (!el || !el.parentElement) return;
    const kids = Array.from(el.parentElement.children).map((k, i) => { const p = info.pathOf(k); return { sel: p ? p.sel : "", i }; });
    const get = (k) => { const e = k.sel && ((draft[dev][picked.root] || {}).s || {})[k.sel]; return e && typeof e.order === "number" ? e.order : k.i; };
    const ord = kids.map((k) => ({ k, o: get(k) })).sort((a, b) => a.o - b.o || a.k.i - b.k.i);
    const ix = ord.findIndex((x) => x.k.sel === picked.sel), j = ix + dir; if (ix < 0 || j < 0 || j >= ord.length) { toast(dir < 0 ? "Déjà en premier." : "Déjà en dernier."); return; }
    const t = ord[ix]; ord[ix] = ord[j]; ord[j] = t;
    const pcs = w.getComputedStyle(el.parentElement), needFlex = !/flex|grid/.test(pcs.display), psel = (info.pathOf(el.parentElement) || {}).sel || "";
    change(() => { ord.forEach((x, n) => { if (!x.k.sel) return; const e = entry(picked.root, x.k.sel, true); e.order = n; if (needFlex) { e.pf = true; e.pp = psel; } }); });
    paintPanel();
  }
  function onClick(e) {
    const t = e.target.closest("[data-ed]"); if (!t) return; const a = t.dataset.ed;
    if (a === "quit") { close(); return; }
    if (a === "dev-pc" || a === "dev-mobile") { dev = a === "dev-pc" ? "pc" : "mobile"; picked = null; mountFrame(); paintBar(); paintPanel(); return; }
    if (a === "mode-edit" || a === "mode-nav") { mode = a === "mode-edit" ? "edit" : "nav"; if (win && win.__edSelect && mode === "nav") win.__edSelect(null); paintBar(); return; }
    if (a === "undo" && undo.length) { redo.push(JSON.stringify(draft)); draft = JSON.parse(undo.pop()); push(); autosave(); paintBar(); paintPanel(); return; }
    if (a === "redo" && redo.length) { undo.push(JSON.stringify(draft)); draft = JSON.parse(redo.pop()); push(); autosave(); paintBar(); paintPanel(); return; }
    if (a === "publish") { publish(); return; }
    if (a === "discard") { if (confirm("Abandonner toutes les modifications non publiées ?")) { change(() => { draft = clone(live); }); picked = null; paintPanel(); } return; }
    if (a === "versions") { versions(); return; }
    if (a === "closemodal") { const m = $(".ed-modal"); if (m) m.remove(); return; }
    if (a === "loadver") { const v = t.dataset.id; loadVersion(v); return; }
    if (a === "blkdel") { change(() => { const pg = draft[dev][t.dataset.r]; if (pg) pg.add = pg.add.filter((x) => x.id !== t.dataset.id); }); paintPanel(); return; }
    if (!picked) return;
    if (a === "up") move(-1); else if (a === "down") move(1);
    else if (a === "hide" || a === "del") { change(() => { const en = entry(picked.root, picked.sel, true); en.hide = a === "del" ? true : !en.hide; }); paintPanel(); }
    else if (a === "reset") { change(() => { const pg = draft[dev][picked.root]; if (pg && pg.s) delete pg.s[picked.sel]; }); paintPanel(); }
    else if (a === "clr") { change(() => { const en = entry(picked.root, picked.sel, true); if (en.css) delete en.css[t.dataset.k]; }); paintPanel(); }
    else if (a === "parent") { try { const el = L.find(picked.root, picked.sel), par = el && el.parentElement, d = par && par !== L.rootOf(par) && win.MASiteLayout.describe(par); if (d) { win.__edSelect(par); picked = d; paintPanel(); } else toast("Pas de parent modifiable."); } catch (_) { /* ignoré */ } }
    else if (a === "add") addBlock();
    else if (a === "copy") { const o = dev === "pc" ? "mobile" : "pc"; change(() => { const src = ((draft[dev][picked.root] || {}).s || {})[picked.sel]; if (!src) return; const pg = (draft[o][picked.root] = draft[o][picked.root] || { s: {}, add: [] }); pg.s[picked.sel] = clone(src); }); toast("Copié vers " + (o === "pc" ? "le PC" : "le mobile") + "."); }
    else if (a === "upload") { const f = $("#ed-file"); if (f) f.click(); }
  }
  function addBlock() {
    const type = ($("#ed-addtype") || {}).value || "text", id = "b" + Date.now().toString(36), defaults = { text: { title: "Nouveau titre", text: "Ton texte ici." }, image: { src: "", alt: "" }, button: { label: "Mon bouton", href: "#/" }, banner: { title: "Titre", text: "Texte de la bannière", label: "Voir", href: "#/" }, spacer: { h: 32 } };
    change(() => { const pg = (draft[dev][picked.root] = draft[dev][picked.root] || { s: {}, add: [] }); pg.add = pg.add || []; pg.add.push({ id, after: picked.sel, type, props: defaults[type] }); });
    picked = null; paintPanel();
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === "ed-route") { route = t.value; picked = null; if (frame) { try { win.location.hash = "#" + route; } catch (_) { frame.src = location.pathname + "?editor=1#" + route; } } return; }
    if (t.id === "ed-file") { upload(t.files && t.files[0]); return; }
    if (t.dataset.blk) { change(() => { const pg = draft[dev][t.dataset.r]; const b = pg && pg.add.find((x) => x.id === t.dataset.blk); if (b) { b.props = b.props || {}; b.props[t.dataset.k] = t.dataset.k === "h" ? +t.value || 24 : t.value; } }, e.type === "input" && undo.length); return; }
    if (!picked) return;
    if (t.dataset.css !== undefined) {
      let v = t.value; if (v !== "" && t.dataset.u === "px") v = v + "px";
      if (t.dataset.css === "width" && t.tagName === "SELECT" && v === "") return;
      change(() => { const en = entry(picked.root, picked.sel, true); en.css = en.css || {}; if (v === "" || v === "px") delete en.css[t.dataset.css]; else { en.css[t.dataset.css] = v; if (t.dataset.css === "border-width") en.css["border-style"] = "solid"; } }, e.type === "input" && undo.length && lastKey === t.dataset.css);
      lastKey = t.dataset.css; return;
    }
    if (t.dataset.text) { change(() => { entry(picked.root, picked.sel, true).text = t.value; }, e.type === "input" && lastKey === "text"); lastKey = "text"; return; }
    if (t.dataset.attr) { change(() => { const en = entry(picked.root, picked.sel, true); en.attr = en.attr || {}; if (t.value === "") delete en.attr[t.dataset.attr]; else en.attr[t.dataset.attr] = t.value; }, e.type === "input" && lastKey === "attr" + t.dataset.attr); lastKey = "attr" + t.dataset.attr; }
  }
  let lastKey = "";
  async function upload(file) {
    if (!file || !picked) return;
    try {
      const st = window.MAFB.storage; if (!st) throw new Error("Stockage indisponible");
      const ref = st.ref(`ui_images/${ctx.user.uid}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_").slice(-40)}`);
      await ref.put(file); const url = await ref.getDownloadURL();
      change(() => { const en = entry(picked.root, picked.sel, true); en.attr = en.attr || {}; en.attr.src = url; }); paintPanel(); toast("Image téléversée.");
    } catch (e) { toast("Téléversement impossible : " + (e.code === "storage/unauthorized" ? "règles Storage non publiées" : e.message), "err"); }
  }

  // ---------------------------------------------------------------- publication et versions
  async function publish() {
    if (!confirm("Publier ces changements pour TOUT LE MONDE ?")) return;
    clearTimeout(saveT);
    try {
      const json = JSON.stringify(draft), at = Date.now(), by = ctx.user ? ctx.user.uid : "";
      await db().collection("ui_layout_versions").doc(String(at)).set({ layout: JSON.stringify(live), at, by, label: "Avant publication du " + new Date(at).toLocaleString("fr-FR") });
      await db().collection("ui_layout").doc("live").set({ layout: json, at, by });
      await db().collection("ui_layout").doc("draft").set({ layout: json, at, by });
      live = clone(draft); status = "Publié à " + new Date(at).toLocaleTimeString("fr-FR");
      try { localStorage.setItem("ma_ui_layout", json); } catch (_) { /* ignoré */ }
      // garde les 30 dernières versions
      try { const s = await db().collection("ui_layout_versions").orderBy("at", "desc").get(); const old = s.docs.slice(30); for (const d of old) await d.ref.delete(); } catch (_) { /* ignoré */ }
      paintBar(); toast("Publié : tout le monde voit tes changements.");
    } catch (e) { toast("Publication impossible : " + (e.code === "permission-denied" ? "règles Firestore non publiées ou compte non admin" : e.message), "err"); }
  }
  async function versions() {
    let rows = []; try { const s = await db().collection("ui_layout_versions").orderBy("at", "desc").limit(30).get(); rows = s.docs.map((d) => d.data()); } catch (e) { toast("Versions indisponibles.", "err"); return; }
    const m = document.createElement("div"); m.className = "ed-modal";
    m.innerHTML = `<div class="ed-box"><h4>Versions précédentes</h4><p class="ed-hint">Chaque publication garde automatiquement la version d'avant. Charger une version la met dans ton brouillon ; il faut ensuite Publier.</p>${rows.length ? rows.map((r) => `<div class="ed-row"><span style="flex:1">${esc(r.label || new Date(r.at).toLocaleString("fr-FR"))}</span><button type="button" data-ed="loadver" data-id="${r.at}">Charger</button></div>`).join("") : `<p class="ed-hint">Aucune version pour l'instant.</p>`}<button type="button" data-ed="closemodal">Fermer</button></div>`;
    ov.appendChild(m);
  }
  async function loadVersion(id) {
    try { const s = await db().collection("ui_layout_versions").doc(String(id)).get(); if (!s.exists) return; const lay = JSON.parse(s.data().layout); change(() => { draft = lay; ["pc", "mobile"].forEach((k) => { draft[k] = draft[k] || {}; }); }); const m = $(".ed-modal"); if (m) m.remove(); picked = null; paintPanel(); toast("Version chargée dans le brouillon."); }
    catch (e) { toast("Chargement impossible.", "err"); }
  }

  window.MASiteEditor = { open, close, attach, onPick, mode: () => mode, draft: () => draft, _state: () => ({ dev, draft, live, picked }), _setCtx: (c) => { ctx = c; } };
  document.dispatchEvent(new CustomEvent("ma:editor-ready"));
})();
