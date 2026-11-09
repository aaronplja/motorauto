/**
 * MOTORAUTO — éditeur visuel de l'interface (administrateurs uniquement ; chargé à la demande).
 * Le site s'ouvre dans un cadre (PC 1280 px ou mobile 390 px) : on clique un élément puis on le glisse (déplacement libre, ou réordonnancement),
 * on le redimensionne avec la poignée, on change ses styles (couleurs, dégradés, ombres, filtres, survol, animations…), son texte ou son image,
 * ou on ajoute des blocs (texte, image, carte, vidéo, compte à rebours…). Réglages globaux du site, scènes planifiées (ex. décor de Noël),
 * arbre des éléments, modèles de blocs, comparaison avant/après. PC et mobile ont chacun leur propre mise en page.
 * Brouillon enregistré automatiquement (ui_layout/draft) → « Publier » l'applique à tout le monde (ui_layout/live) et garde une version.
 * La sécurité vient des règles Firestore : seuls les admins écrivent dans ui_layout*.
 */
(function () {
  "use strict";
  const L = window.MASiteLayout;
  if (!L || window.MASiteEditor) return;
  const PAGES = [["Accueil", "/"], ["Catalogue", "/catalogue"], ["Communauté", "/communaute"], ["Communauté › Pilotes", "/communaute/pilotes"], ["Jouer", "/jouer"], ["Jouer › Collection", "/jouer/collection"], ["Jouer › Boutique", "/jouer/boutique"], ["Jouer › Échanges", "/jouer/echanges"], ["Jouer › Mini-jeux", "/jouer/minijeux"], ["Jouer › Défis", "/jouer/defis"], ["Classement", "/classement"], ["Garage", "/garage"], ["Réglages", "/reglages"], ["Clubs", "/clubs"], ["Annonces", "/annonces"], ["Marché des cartes", "/marche"], ["Fusion", "/fusion"], ["Souhaits", "/souhaits"], ["Succès", "/succes"], ["Pass", "/pass"], ["Frise", "/frise"], ["Nouveautés", "/nouveautes"], ["Contact", "/contact"], ["Légal", "/legal"]];
  const BLOCKS = {
    text: ["Texte", { title: "Nouveau titre", text: "Ton texte ici." }, [["title", "Titre"], ["text", "Texte", 1]]],
    image: ["Image", { src: "", alt: "" }, [["src", "Adresse de l'image", 0, "up"], ["alt", "Texte alternatif"]]],
    button: ["Bouton", { label: "Mon bouton", href: "#/" }, [["label", "Texte"], ["href", "Lien (#/jouer ou https://…)"]]],
    banner: ["Bannière", { title: "Titre", text: "Texte de la bannière", label: "Voir", href: "#/" }, [["title", "Titre"], ["text", "Texte", 1], ["label", "Bouton"], ["href", "Lien"]]],
    card: ["Carte", { src: "", title: "Titre de la carte", text: "Description", label: "Voir", href: "#/" }, [["src", "Image", 0, "up"], ["title", "Titre"], ["text", "Texte", 1], ["label", "Bouton"], ["href", "Lien"]]],
    list: ["Liste", { title: "Ma liste", items: "Premier point\nDeuxième point\nTroisième point" }, [["title", "Titre"], ["items", "Un point par ligne", 1]]],
    video: ["Vidéo", { src: "" }, [["src", "Lien YouTube ou fichier .mp4"]]],
    countdown: ["Compte à rebours", { label: "Prochain événement dans", to: "" }, [["label", "Texte"], ["to", "Date et heure (ex : 2026-12-25 18:00)"]]],
    stat: ["Chiffre clé", { value: "1 000", label: "voitures" }, [["value", "Chiffre"], ["label", "Légende"]]],
    divider: ["Séparateur", {}, []],
    emoji: ["Grand symbole", { emoji: "🏁", text: "" }, [["emoji", "Symbole / emoji"], ["text", "Texte", 1]]],
    gallery: ["Galerie", { srcs: "" }, [["srcs", "Une adresse d'image par ligne", 1]]],
    quote: ["Citation", { text: "Une belle citation.", who: "" }, [["text", "Texte", 1], ["who", "Auteur"]]],
    spacer: ["Espace vide", { h: 32 }, [["h", "Hauteur (px)"]]]
  };
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let ctx = null, ov = null, frame = null, win = null, draft = L.empty(), live = L.empty(), dev = "pc", mode = "edit", picked = null, undo = [], redo = [], saveT = 0, status = "", route = "/", ready = false;
  let tgt = "", cmp = false, dragMode = "move", openG = { pos: true }, upTarget = null, lastKey = "", treeNodes = [];

  const db = () => window.MAFB.db;
  const toast = (m, k) => { try { ctx.toast(m, k || "ok"); } catch (_) { /* ignoré */ } };

  // ---------------------------------------------------------------- données
  /** couche en cours d'édition : le brouillon de base, ou une scène planifiée */
  const lay = () => {
    if (tgt) { const sc = (draft.scenes || []).find((x) => x.id === tgt); if (sc) { sc.layout = sc.layout || {}; sc.layout.pc = sc.layout.pc || {}; sc.layout.mobile = sc.layout.mobile || {}; return sc.layout; } tgt = ""; }
    draft.pc = draft.pc || {}; draft.mobile = draft.mobile || {}; return draft;
  };
  const P = () => lay()[dev];
  const entry = (rid, sel, make) => { const pg = (P()[rid] = P()[rid] || { s: {}, add: [] }); pg.s = pg.s || {}; pg.add = pg.add || []; if (!pg.s[sel] && make) pg.s[sel] = {}; return pg.s[sel]; };
  const curE = () => (picked && ((P()[picked.root] || {}).s || {})[picked.sel]) || {};
  function pruneLayer(l) {
    ["pc", "mobile"].forEach((d) => { l[d] = l[d] || {}; Object.keys(l[d]).forEach((rid) => {
      const pg = l[d][rid];
      Object.keys(pg.s || {}).forEach((sel) => {
        const e = pg.s[sel];
        ["css", "attr", "tf", "p"].forEach((k) => { if (e[k] && !Object.keys(e[k]).length) delete e[k]; });
        if (e.tf) { ["x", "y", "r"].forEach((k) => { if (!e.tf[k]) delete e.tf[k]; }); if (!e.tf.s || e.tf.s === 1) delete e.tf.s; if (!Object.keys(e.tf).length) delete e.tf; }
        if (!e.hv) delete e.hv; if (!e.an || !e.an.n) delete e.an;
        if (!e.hide) delete e.hide;
        if (!Object.keys(e).filter((k) => k !== "pf" && k !== "pp").length) delete pg.s[sel];
      });
      if (!Object.keys(pg.s || {}).length && !(pg.add || []).length) delete l[d][rid];
    }); });
    if (l.g) { if (l.g.vars) Object.keys(l.g.vars).forEach((k) => { if (!l.g.vars[k]) delete l.g.vars[k]; }); if (l.g.vars && !Object.keys(l.g.vars).length) delete l.g.vars; if (!l.g.font) delete l.g.font; if (!l.g.scale || l.g.scale === 100) delete l.g.scale; if (!Object.keys(l.g).length) delete l.g; }
  }
  function prune() { pruneLayer(draft); (draft.scenes || []).forEach((sc) => { if (sc.layout) pruneLayer(sc.layout); }); }
  function change(fn, keepUndo) {
    if (!keepUndo) { undo.push(JSON.stringify(draft)); if (undo.length > 80) undo.shift(); redo = []; }
    fn(); prune(); push(); autosave(); paintBar();
  }
  const push = () => {
    if (!win || !win.MASiteLayout) return;
    if (cmp) win.MASiteLayout.setLayout(clone(live)); else win.MASiteLayout.setLayout(clone(draft), { scene: tgt });
  };
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
.ed-bar button,.ed-bar select,.ed-pan button,.ed-pan select,.ed-pan input,.ed-pan textarea,.ed-box input,.ed-box button,.ed-box select{font:inherit;color:#e5e7eb;background:#1f2937;border:1px solid #374151;border-radius:8px;padding:.35rem .6rem}
.ed-bar button,.ed-pan button,.ed-box button{cursor:pointer}.ed-bar button:hover,.ed-pan button:hover,.ed-box button:hover{border-color:#38bdf8}
.ed-bar button.on{background:#0369a1;border-color:#38bdf8}.ed-bar button.pub{background:#16a34a;border-color:#22c55e;font-weight:700}.ed-bar button[disabled],.ed-pan button[disabled]{opacity:.4;cursor:default}
.ed-bar button.warn{background:#7c3aed;border-color:#a78bfa}
.ed-sp{flex:1}.ed-st{font-size:.8rem;color:#9ca3af}
.ed-main{display:grid;grid-template-columns:1fr 340px;min-height:0}
.ed-stage{position:relative;overflow:auto;display:grid;place-items:start center;padding:12px;background:#030712}
.ed-fw{transform-origin:top left;border-radius:14px;overflow:hidden;border:1px solid #374151;background:#000;flex:none}
.ed-fw iframe{border:0;display:block;background:#0b1020}
.ed-pan{overflow:auto;padding:.7rem;background:#111827;border-left:1px solid #1f2937;display:grid;gap:.6rem;align-content:start}
.ed-pan h4,.ed-box h4,.ed-sec>summary{margin:0;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af}
.ed-sec{display:grid;gap:.45rem;padding:.6rem;border:1px solid #1f2937;border-radius:10px}
details.ed-sec>summary{cursor:pointer;font-weight:700;list-style:none;padding:.1rem 0}details.ed-sec>summary::before{content:"▸ "}details.ed-sec[open]>summary::before{content:"▾ "}
.ed-row{display:flex;gap:.4rem;align-items:flex-end;flex-wrap:wrap}.ed-row>label{flex:1 1 84px;display:grid;gap:.15rem;font-size:.72rem;color:#9ca3af}
.ed-row input[type=number],.ed-row select,.ed-row input[type=text],.ed-row input[type=datetime-local],.ed-pan textarea,.ed-pan input[type=text],.ed-box input[type=text],.ed-box input[type=datetime-local]{width:100%}
.ed-row input[type=color]{width:100%;height:32px;padding:2px}.ed-row input[type=checkbox]{width:auto}
.ed-pan textarea{min-height:70px}.ed-hint{color:#9ca3af;font-size:.8rem;margin:0}.ed-sel{font-weight:700;word-break:break-all}
.ed-note{padding:.5rem .6rem;border-radius:10px;background:#312e81;color:#e0e7ff;font-size:.8rem}
.ed-modal{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:rgba(0,0,0,.6)}
.ed-box{width:min(560px,94vw);max-height:84vh;overflow:auto;padding:1rem;border-radius:14px;background:#111827;border:1px solid #374151;display:grid;gap:.6rem}
.ed-tree details{margin-left:.8rem}.ed-tree summary{cursor:pointer;color:#cbd5e1}.ed-tree .ed-leaf{margin-left:.8rem}.ed-tree button{border:0;background:none;padding:.15rem .3rem;text-align:left;color:#e5e7eb}.ed-tree button:hover{background:#1f2937}.ed-tree .dim{opacity:.4}.ed-tree .mod{color:#fbbf24}
@media (max-width:900px){.ed-bar{flex-wrap:nowrap;overflow-x:auto;gap:.3rem;padding:.4rem .5rem;font-size:.8rem}.ed-bar>*{flex:none}.ed-bar button,.ed-bar select{padding:.3rem .5rem}.ed-st{display:none}.ed-main{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) 42vh}.ed-pan{border-left:0;border-top:1px solid #1f2937}.ed-stage{padding:6px}}
.ed-fab{position:fixed;left:12px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:7000;padding:.55rem .85rem;border-radius:99px;border:1px solid var(--accent);background:var(--bg-elevated);color:var(--color-ink);font:700 .85rem system-ui;cursor:pointer;box-shadow:0 8px 24px -8px rgba(0,0,0,.5)}
@media (min-width:900px){.ed-fab{bottom:18px}}`;

  function open(startRoute) {
    if (ov) return;
    if (!$("#ed-css")) { const st = document.createElement("style"); st.id = "ed-css"; st.textContent = css; document.head.appendChild(st); }
    ov = document.createElement("div"); ov.className = "ed-ov ed-chrome"; ov.setAttribute("data-no-i18n", ""); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Éditeur visuel");
    ov.innerHTML = `<div class="ed-bar" id="ed-bar"></div><div class="ed-main"><div class="ed-stage" id="ed-stage"></div><div class="ed-pan" id="ed-pan"></div></div><input type="file" id="ed-file" accept="image/*" hidden>`;
    document.body.appendChild(ov); document.documentElement.style.overflow = "hidden";
    ov.addEventListener("click", onClick); ov.addEventListener("input", onInput); ov.addEventListener("change", onInput);
    ov.addEventListener("toggle", (e) => { const d = e.target; if (d && d.dataset && d.dataset.g) openG[d.dataset.g] = d.open; }, true);
    dev = innerWidth < 900 ? "mobile" : "pc";
    route = startRoute || (location.hash.replace(/^#/, "") || "/");
    status = "Chargement…"; paintBar(); paintPanel();
    loadAll().then(() => { ready = true; mountFrame(); paintBar(); paintPanel(); });
  }
  function close() {
    if (!ov) return;
    if (undo.length && /non enregistr/.test(status)) saveDraft();
    ov.remove(); ov = null; frame = null; win = null; document.documentElement.style.overflow = ""; picked = null; cmp = false;
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
    win = w; picked = null; paintPanel(); push();
    const sync = () => { try { const h = w.location.hash.replace(/^#/, "") || "/"; route = h; const s = $("#ed-route"); if (s) { const ix = PAGES.findIndex((p) => p[1] === h); s.value = ix >= 0 ? PAGES[ix][1] : ""; } } catch (_) { /* ignoré */ } };
    w.addEventListener("hashchange", () => { picked = null; sync(); paintPanel(); }); sync();
  }
  function onPick(info) { picked = info; paintPanel(); }
  const pageRoot = () => { try { const r = win.document.querySelector(".page.page-on") || win.document.querySelector("[id$='-modal'].open"); return r && r.id ? r.id : ""; } catch (_) { return ""; } };

  // ---------------------------------------------------------------- barre du haut
  function paintBar() {
    const b = $("#ed-bar"); if (!b) return;
    const dirty = JSON.stringify(draft) !== JSON.stringify(live), sc = draft.scenes || [];
    b.innerHTML = `<b>Éditeur</b>
      <button type="button" data-ed="dev-pc" class="${dev === "pc" ? "on" : ""}">PC</button><button type="button" data-ed="dev-mobile" class="${dev === "mobile" ? "on" : ""}">Mobile</button>
      <select id="ed-route" aria-label="Page">${PAGES.map((p) => `<option value="${p[1]}" ${p[1] === route ? "selected" : ""}>${esc(p[0])}</option>`).join("")}<option value="" ${PAGES.some((p) => p[1] === route) ? "hidden" : "selected"}>${esc(route)}</option></select>
      <button type="button" data-ed="mode-edit" class="${mode === "edit" ? "on" : ""}">Modifier</button><button type="button" data-ed="mode-nav" class="${mode === "nav" ? "on" : ""}">Naviguer</button>
      <button type="button" data-ed="undo" ${undo.length ? "" : "disabled"}>Annuler</button><button type="button" data-ed="redo" ${redo.length ? "" : "disabled"}>Rétablir</button>
      <select id="ed-tgt" aria-label="Couche modifiée" title="Modifier la base ou une scène planifiée"><option value="">Base (toujours)</option>${sc.map((x) => `<option value="${esc(x.id)}" ${x.id === tgt ? "selected" : ""}>Scène : ${esc(x.name || "sans nom")}</option>`).join("")}</select>
      <button type="button" data-ed="scenes">Scènes</button><button type="button" data-ed="tree">Arbre</button><button type="button" data-ed="cmp" class="${cmp ? "warn" : ""}">${cmp ? "Retour au brouillon" : "Avant / après"}</button>
      <span class="ed-sp"></span><span class="ed-st" id="ed-st"></span>
      <button type="button" data-ed="versions">Versions</button><button type="button" data-ed="discard" ${dirty ? "" : "disabled"}>Abandonner</button>
      <button type="button" data-ed="publish" class="pub" ${dirty ? "" : "disabled"}>Publier</button><button type="button" data-ed="quit">Quitter</button>`;
    paintStatus();
  }
  function paintStatus() { const s = $("#ed-st"); if (s) s.textContent = cmp ? "Aperçu de la version PUBLIÉE (lecture seule)" : status; }

  // ---------------------------------------------------------------- briques du panneau
  const cur = (k) => { const e = curE(); return e.css && e.css[k] !== undefined ? e.css[k] : ""; };
  const numIn = (k, label, base, unit) => `<label>${label}<input type="number" step="any" data-css="${k}" data-u="${unit === undefined ? "px" : unit}" value="${parseFloat(cur(k)) || (parseFloat(cur(k)) === 0 ? 0 : "")}" placeholder="${Math.round((base || 0) * 100) / 100}"></label>`;
  const hexOf = (v, d) => (/^#[0-9a-f]{6}$/i.test(v) ? v : d || "#000000");
  const colIn = (k, label, base) => `<label>${label}<input type="color" data-css="${k}" data-u="" value="${hexOf(cur(k), base)}"></label><button type="button" data-ed="clr" data-k="${k}" title="Retirer ce réglage">✕</button>`;
  const selIn = (attr, label, list, val) => `<label>${label}<select ${attr}><option value="">—</option>${list.map((o) => { const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return `<option value="${esc(v)}" ${String(val) === String(v) ? "selected" : ""}>${esc(t)}</option>`; }).join("")}</select></label>`;
  const cssSel = (k, label, list) => selIn(`data-css="${k}" data-u=""`, label, list, cur(k));
  const tfIn = (k, label, ph) => { const e = curE(); return `<label>${label}<input type="number" step="any" data-tf="${k}" value="${e.tf && e.tf[k] !== undefined ? e.tf[k] : ""}" placeholder="${ph}"></label>`; };
  const pv = (g, k, d) => { const e = curE(); return e.p && e.p[g] && e.p[g][k] !== undefined ? e.p[g][k] : d; };
  const pNum = (g, k, label, d, step) => `<label>${label}<input type="number" step="${step || 1}" data-p="${g}.${k}" value="${pv(g, k, d)}"></label>`;
  const pCol = (g, k, label, d) => `<label>${label}<input type="color" data-p="${g}.${k}" value="${hexOf(pv(g, k, d), d)}"></label>`;
  const pChk = (g, k, label) => `<label style="display:flex;gap:.4rem;align-items:center;flex-direction:row"><input type="checkbox" data-p="${g}.${k}" ${pv(g, k, false) ? "checked" : ""}>${label}</label>`;
  const grp = (id, title, inner) => `<details class="ed-sec" data-g="${id}" ${openG[id] ? "open" : ""}><summary>${title}</summary>${inner}</details>`;
  const SIDES = [["top", "Haut"], ["right", "Droite"], ["bottom", "Bas"], ["left", "Gauche"]];

  // couleur/valeur par défaut d'une variable du thème, lue dans le site
  function themeVar(v) {
    try { const raw = getComputedStyle(win.document.documentElement).getPropertyValue(v).trim(); if (/^#[0-9a-f]{6}$/i.test(raw)) return raw; const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(raw); if (m) return "#" + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, "0")).join(""); if (/^#[0-9a-f]{3}$/i.test(raw)) return "#" + raw.slice(1).split("").map((c) => c + c).join(""); } catch (_) { /* ignoré */ }
    return "#000000";
  }
  function globalPanel() {
    const g = lay().g || {}, vars = g.vars || {};
    const names = { "--accent": "Couleur d'accent", "--bg-core": "Fond principal", "--bg-surface": "Fond des zones", "--bg-elevated": "Fond des cartes", "--color-ink": "Couleur du texte", "--color-muted": "Texte discret", "--stroke-line": "Traits et bordures", "--on-accent": "Texte sur accent" };
    const cols = Object.keys(names).map((v) => `<div class="ed-row"><label>${names[v]}<input type="color" data-gv="${v}" value="${hexOf(vars[v], themeVar(v))}"></label><button type="button" data-ed="gclr" data-v="${v}" title="Revenir au thème">✕</button></div>`).join("");
    const rad = ["--corner-sm", "--corner-md"].map((v) => `<label>${v === "--corner-sm" ? "Arrondi petit" : "Arrondi moyen"} (px)<input type="number" data-gv="${v}" data-u="px" value="${parseFloat(vars[v]) || ""}" placeholder="${parseFloat((() => { try { return getComputedStyle(win.document.documentElement).getPropertyValue(v); } catch (_) { return ""; } })()) || ""}"></label>`).join("");
    return grp("glob", "Site entier : couleurs, police, arrondis", `<p class="ed-hint">S'applique à toutes les pages (PC et mobile) et passe devant le thème choisi par chaque visiteur. Les ✕ rendent la main au thème.</p>${cols}<div class="ed-row">${rad}</div><div class="ed-row">${selIn(`data-gfont="1"`, "Police du site", [["sans", "Moderne"], ["serif", "Classique (serif)"], ["mono", "Technique (mono)"], ["rounded", "Arrondie"], ["condensed", "Condensée"], ["elegant", "Élégante"]], g.font || "")}<label>Taille du texte (%)<input type="number" data-gscale="1" min="75" max="135" value="${g.scale || ""}" placeholder="100"></label></div>`);
  }

  function blockFields(a, rid) {
    const def = BLOCKS[a.type]; if (!def) return "";
    const f = def[2].map(([k, l, multi, up]) => `<label class="ed-hint">${l}${multi ? `<textarea data-blk="${esc(a.id)}" data-k="${k}" data-r="${esc(rid)}">${esc((a.props || {})[k] || "")}</textarea>` : `<input type="text" data-blk="${esc(a.id)}" data-k="${k}" data-r="${esc(rid)}" value="${esc((a.props || {})[k] == null ? "" : (a.props || {})[k])}">`}${up ? `<button type="button" data-ed="blkup" data-id="${esc(a.id)}" data-r="${esc(rid)}" data-k="${k}">Téléverser une image…</button>` : ""}</label>`).join("");
    return `<div class="ed-sec"><b>${esc(def[0])}</b>${f}</div>`;
  }
  const addOptions = () => `<optgroup label="Blocs">${Object.keys(BLOCKS).map((k) => `<option value="${k}">${BLOCKS[k][0]}</option>`).join("")}</optgroup>${(draft.tpl || []).length ? `<optgroup label="Mes modèles">${draft.tpl.map((t) => `<option value="tpl:${esc(t.id)}">${esc(t.name)}</option>`).join("")}</optgroup>` : ""}`;

  function paintPanel() {
    const p = $("#ed-pan"); if (!p) return;
    if (!ready) { p.innerHTML = `<p class="ed-hint">Chargement…</p>`; return; }
    const sc = tgt && (draft.scenes || []).find((x) => x.id === tgt);
    let h = `<div class="ed-sec"><h4>Appareil : ${dev === "pc" ? "PC (≥ 900 px)" : "Mobile (< 900 px)"}</h4><p class="ed-hint">Chaque appareil a sa propre mise en page. Clique un élément dans l'aperçu : glisse-le pour le déplacer, tire la pastille orange pour le redimensionner.</p></div>`;
    if (sc) h += `<div class="ed-note">Tu modifies la scène « ${esc(sc.name || "sans nom")} » : ces changements s'ajoutent à la base uniquement pendant ses dates.</div>`;
    if (!picked) {
      h += `<div class="ed-sec"><h4>Ajouter un bloc à la fin de la page</h4><div class="ed-row"><label>Type<select id="ed-addtype">${addOptions()}</select></label><button type="button" data-ed="add">Ajouter</button></div></div>` + globalPanel() + allBlocks();
      p.innerHTML = h; return;
    }
    const e = curE(), c = picked.cs, pg = P()[picked.root] || {}, blk = picked.blk ? (pg.add || []).find((x) => x.id === picked.blk) : null;
    h += `<div class="ed-sec"><h4>Élément</h4><div class="ed-sel">&lt;${picked.tag}&gt; · ${picked.rect.w}×${picked.rect.h}</div><div class="ed-row"><button type="button" data-ed="parent">↑ Parent</button><button type="button" data-ed="tree">Arbre</button><button type="button" data-ed="reset">Réinitialiser</button></div></div>`;
    if (blk) h += blockFields(blk, picked.root) + `<div class="ed-sec"><div class="ed-row"><button type="button" data-ed="dup">Dupliquer</button><button type="button" data-ed="blkdel" data-id="${esc(blk.id)}" data-r="${esc(picked.root)}">Supprimer le bloc</button></div><div class="ed-row"><label>Nom du modèle<input type="text" id="ed-tplname" placeholder="Ex : Ma bannière"></label><button type="button" data-ed="tplsave">Enregistrer en modèle</button></div></div>`;
    h += grp("pos", "Position et taille", `<div class="ed-row"><label>Glisser pour<select id="ed-dm"><option value="move" ${dragMode === "move" ? "selected" : ""}>Déplacer librement</option><option value="reorder" ${dragMode === "reorder" ? "selected" : ""}>Changer l'ordre</option></select></label></div>
      <div class="ed-row"><button type="button" data-ed="up">↑ Monter</button><button type="button" data-ed="down">↓ Descendre</button><button type="button" data-ed="hide">${e.hide ? "Afficher" : "Masquer"}</button>${blk ? "" : `<button type="button" data-ed="del">Supprimer</button>`}</div>
      <div class="ed-row">${tfIn("x", "Décalage X (px)", 0)}${tfIn("y", "Décalage Y (px)", 0)}${tfIn("r", "Rotation (°)", 0)}${tfIn("s", "Échelle (1 = normal)", 1)}</div>
      <div class="ed-row">${numIn("width", "Largeur (px)", picked.rect.w)}${cssSel("width", "Largeur rapide", ["auto", "100%", "75%", "50%", "33%", "25%"])}</div><div class="ed-row">${numIn("height", "Hauteur (px)", picked.rect.h)}${numIn("min-height", "Hauteur min", 0)}</div><div class="ed-row">${numIn("max-width", "Largeur max", 0)}${numIn("min-width", "Largeur min", 0)}${numIn("max-height", "Hauteur max", 0)}</div><div class="ed-row">${cssSel("aspect-ratio", "Proportions", ["1 / 1", "4 / 3", "16 / 9", "3 / 4", "21 / 9"])}${cssSel("object-fit", "Image dans le cadre", ["cover", "contain", "fill"])}${numIn("z-index", "Superposition (-5 à 50)", 0, "")}</div>
      <p class="ed-hint">Monter/descendre change l'ordre parmi les voisins. « Supprimer » masque (récupérable avec Afficher ou Versions).</p>`);
    h += grp("lay", "Disposition des enfants", `<div class="ed-row">${cssSel("display", "Affichage", [["block", "Bloc"], ["flex", "Flex (ligne/colonne)"], ["grid", "Grille"], ["inline-block", "En ligne"], ["contents", "Transparent"]])}${cssSel("flex-direction", "Sens", [["row", "En ligne"], ["column", "En colonne"], ["row-reverse", "Ligne inversée"], ["column-reverse", "Colonne inversée"]])}</div>
      <div class="ed-row">${cssSel("flex-wrap", "Retour à la ligne", [["wrap", "Oui"], ["nowrap", "Non"]])}${cssSel("justify-content", "Alignement horizontal", [["flex-start", "Début"], ["center", "Centre"], ["flex-end", "Fin"], ["space-between", "Espacé"], ["space-around", "Réparti"]])}${cssSel("align-items", "Alignement vertical", [["flex-start", "Haut"], ["center", "Centre"], ["flex-end", "Bas"], ["stretch", "Étiré"]])}</div>
      <div class="ed-row">${numIn("gap", "Espace entre enfants", c.gap)}${cssSel("grid-template-columns", "Colonnes (grille)", [["1fr", "1"], ["1fr 1fr", "2"], ["repeat(3,1fr)", "3"], ["repeat(4,1fr)", "4"], ["repeat(auto-fit,minmax(140px,1fr))", "Auto"]])}${cssSel("overflow", "Débordement", [["visible", "Visible"], ["hidden", "Coupé"], ["auto", "Défilement"]])}</div><div class="ed-row">${cssSel("align-self", "Cet élément", [["flex-start", "Début"], ["center", "Centre"], ["flex-end", "Fin"], ["stretch", "Étiré"]])}${numIn("flex-grow", "Pousse (flex)", 0, "")}</div>`);
    h += grp("space", "Espacements", `<div class="ed-row">${numIn("padding", "Marge interne (tout)", c.pt)}${numIn("margin", "Marge externe (tout)", c.mt)}</div><div class="ed-row">${SIDES.map(([s, l]) => numIn("padding-" + s, "Interne " + l.toLowerCase(), c["p" + s[0]])).join("")}</div><div class="ed-row">${SIDES.map(([s, l]) => numIn("margin-" + s, "Externe " + l.toLowerCase(), c["m" + s[0]])).join("")}</div>`);
    if (picked.leaf) h += grp("txt0", "Contenu texte", `<textarea data-text="1">${esc(e.text !== undefined ? e.text : picked.text)}</textarea>`);
    h += grp("txt", "Typographie", `<div class="ed-row">${cssSel("font-family", "Police", [["system-ui,-apple-system,'Segoe UI',sans-serif", "Moderne"], ["Georgia,'Times New Roman',serif", "Classique"], ["ui-monospace,Menlo,Consolas,monospace", "Technique"], ["'Trebuchet MS',system-ui,sans-serif", "Arrondie"], ["'Arial Narrow',Impact,sans-serif", "Condensée"], ["'Palatino Linotype',Palatino,serif", "Élégante"]])}${numIn("font-size", "Taille", c.fontSize)}</div>
      <div class="ed-row">${cssSel("font-weight", "Graisse", [["300", "Fin"], ["400", "Normal"], ["600", "Semi-gras"], ["800", "Gras"], ["900", "Très gras"]])}${cssSel("font-style", "Style", [["normal", "Normal"], ["italic", "Italique"]])}${cssSel("text-align", "Alignement", [["left", "Gauche"], ["center", "Centre"], ["right", "Droite"], ["justify", "Justifié"]])}</div>
      <div class="ed-row">${cssSel("text-transform", "Casse", [["none", "Normale"], ["uppercase", "MAJUSCULES"], ["lowercase", "minuscules"], ["capitalize", "Initiales"]])}${cssSel("text-decoration", "Décoration", [["none", "Aucune"], ["underline", "Souligné"], ["line-through", "Barré"]])}${cssSel("text-shadow", "Ombre du texte", [["none", "Aucune"], ["0 2px 6px rgba(0,0,0,.5)", "Douce"], ["0 0 12px var(--accent)", "Lueur"], ["2px 2px 0 rgba(0,0,0,.6)", "Dure"]])}</div>
      <div class="ed-row">${numIn("letter-spacing", "Espacement lettres", 0)}${numIn("line-height", "Interligne (ex 1.5)", 0, "")}</div><div class="ed-row">${colIn("color", "Couleur du texte", c.color)}</div>`);
    h += grp("bg", "Fond", `<div class="ed-row">${colIn("background-color", "Couleur de fond", c.bg)}<button type="button" data-ed="transp" title="Fond transparent">∅</button></div>
      ${pChk("g", "on", "Dégradé")}<div class="ed-row">${pCol("g", "c1", "Couleur 1", "#3b82f6")}${pCol("g", "c2", "Couleur 2", "#a855f7")}${pNum("g", "a", "Angle (°)", 135)}</div>
      <div class="ed-row"><label>Image de fond (adresse)<input type="text" data-bgimg="1" value="${esc(((cur("background-image") || "").match(/^url\(["']?([^"')]+)/) || [])[1] || "")}" placeholder="https://…"></label></div><div class="ed-row"><button type="button" data-ed="upbg">Téléverser une image de fond…</button>${cssSel("background-size", "Ajustement", [["cover", "Remplir"], ["contain", "Contenir"], ["auto", "Normal"]])}${cssSel("background-position", "Position", [["center", "Centre"], ["top", "Haut"], ["bottom", "Bas"], ["left", "Gauche"], ["right", "Droite"]])}</div>`);
    h += grp("bd", "Bordures et ombres", `<div class="ed-row">${numIn("border-width", "Épaisseur", c.borderW)}${cssSel("border-style", "Trait", [["solid", "Plein"], ["dashed", "Tirets"], ["dotted", "Points"], ["double", "Double"]])}</div><div class="ed-row">${colIn("border-color", "Couleur de bordure", c.color)}${numIn("border-radius", "Arrondi", c.radius)}</div>
      ${pChk("sh", "on", "Ombre personnalisée")}<div class="ed-row">${pNum("sh", "x", "X", 0)}${pNum("sh", "y", "Y", 8)}${pNum("sh", "b", "Flou", 24)}${pNum("sh", "s", "Étendue", 0)}</div><div class="ed-row">${pCol("sh", "c", "Couleur", "#000000")}${pNum("sh", "o", "Opacité %", 45)}${pChk("sh", "i", "Intérieure")}</div>`);
    h += grp("fx", "Effets, survol et animation", `<div class="ed-row">${numIn("opacity", "Opacité (0 à 1)", c.opacity, "")}${cssSel("mix-blend-mode", "Fusion", [["normal", "Normale"], ["multiply", "Multiplier"], ["screen", "Écran"], ["overlay", "Superposition"], ["difference", "Différence"]])}</div>
      ${pChk("fl", "on", "Filtres")}<div class="ed-row">${pNum("fl", "blur", "Flou (px)", 0)}${pNum("fl", "bri", "Luminosité %", 100)}${pNum("fl", "con", "Contraste %", 100)}</div><div class="ed-row">${pNum("fl", "sat", "Saturation %", 100)}${pNum("fl", "hue", "Teinte (°)", 0)}${pNum("fl", "gray", "Gris %", 0)}${pNum("fl", "bd", "Flou d'arrière-plan", 0)}</div>
      <div class="ed-row">${selIn(`data-hv="1"`, "Au survol / toucher", [["grow", "Grossit"], ["lift", "Monte avec ombre"], ["glow", "Lueur"], ["dim", "S'estompe"], ["tilt", "Penche"], ["bright", "S'éclaire"]], e.hv || "")}</div>
      <div class="ed-row">${selIn(`data-an="n"`, "Animation", [["fade", "Apparition"], ["up", "Monte en apparaissant"], ["pulse", "Pulsation"], ["float", "Flottement"], ["spin", "Rotation"], ["bounce", "Rebond"], ["shake", "Secousse"], ["glow", "Lueur pulsée"]], (e.an || {}).n || "")}<label>Durée (s)<input type="number" step="0.1" data-an="d" value="${(e.an || {}).d || ""}" placeholder="1"></label><label>Délai (s)<input type="number" step="0.1" data-an="dl" value="${(e.an || {}).dl || ""}" placeholder="0"></label></div><div class="ed-row"><label style="display:flex;gap:.4rem;align-items:center;flex-direction:row"><input type="checkbox" data-an="l" ${(e.an || {}).l ? "checked" : ""}>En boucle</label></div>`);
    if (picked.isImg) h += grp("img", "Image", `<label class="ed-hint">Adresse</label><input type="text" data-attr="src" value="${esc((e.attr && e.attr.src) || picked.src)}"><label class="ed-hint">Texte alternatif</label><input type="text" data-attr="alt" value="${esc((e.attr && e.attr.alt) || picked.alt)}"><div class="ed-row"><button type="button" data-ed="upload">Téléverser une image…</button></div>`);
    if (picked.tag === "a") h += grp("lnk", "Lien", `<input type="text" data-attr="href" value="${esc((e.attr && e.attr.href) || picked.href)}" placeholder="#/jouer ou https://…">`);
    h += grp("add", "Ajouter un bloc après cet élément", `<div class="ed-row"><label>Type<select id="ed-addtype">${addOptions()}</select></label><button type="button" data-ed="add">Ajouter</button></div>`);
    h += grp("cp", "Copier vers l'autre appareil", `<button type="button" data-ed="copy">Copier ce réglage vers ${dev === "pc" ? "le mobile" : "le PC"}</button>`);
    p.innerHTML = h + globalPanel() + allBlocks();
  }
  function allBlocks() {
    const all = []; Object.keys(P()).forEach((rid) => (P()[rid].add || []).forEach((a) => all.push([rid, a])));
    if (!all.length) return "";
    return grp("blocks", `Tous les blocs ajoutés (${all.length})`, all.map(([rid, a]) => blockFields(a, rid) + `<button type="button" data-ed="blkdel" data-id="${esc(a.id)}" data-r="${esc(rid)}">Supprimer ce bloc</button>`).join(""));
  }

  // ---------------------------------------------------------------- actions
  function ordersOf() {
    const w = win; if (!w || !picked) return null; const info = w.MASiteLayout, el = info.find(picked.root, picked.sel); if (!el || !el.parentElement) return null;
    const kids = Array.from(el.parentElement.children).map((k, i) => { const p = info.pathOf(k); return { sel: p ? p.sel : "", i }; });
    const get = (k) => { const e = k.sel && (P()[picked.root] || { s: {} }).s[k.sel]; return e && typeof e.order === "number" ? e.order : k.i; };
    return { el, ord: kids.map((k) => ({ k, o: get(k) })).sort((a, b) => a.o - b.o || a.k.i - b.k.i), info };
  }
  function commitOrder(ord, el, info) {
    const pcs = win.getComputedStyle(el.parentElement), needFlex = !/flex|grid/.test(pcs.display), psel = (info.pathOf(el.parentElement) || {}).sel || "";
    change(() => { ord.forEach((x, n) => { if (!x.k.sel) return; const e = entry(picked.root, x.k.sel, true); e.order = n; if (needFlex) { e.pf = true; e.pp = psel; } }); });
  }
  function move(dir) {
    const o = ordersOf(); if (!o) return; const ix = o.ord.findIndex((x) => x.k.sel === picked.sel), j = ix + dir;
    if (ix < 0 || j < 0 || j >= o.ord.length) { toast(dir < 0 ? "Déjà en premier." : "Déjà en dernier."); return; }
    const t = o.ord[ix]; o.ord[ix] = o.ord[j]; o.ord[j] = t; commitOrder(o.ord, o.el, o.info); paintPanel();
  }
  function dragEnd(d) {
    if (!picked) return;
    if (d.type === "move") change(() => { const en = entry(picked.root, picked.sel, true); en.tf = en.tf || {}; en.tf.x = d.x; en.tf.y = d.y; });
    else if (d.type === "resize") change(() => { const en = entry(picked.root, picked.sel, true); en.css = en.css || {}; en.css.width = d.w + "px"; en.css.height = d.h + "px"; });
    else if (d.type === "reorder") {
      const o = ordersOf(); if (!o || !d.target) return; const ix = o.ord.findIndex((x) => x.k.sel === picked.sel), tx = o.ord.findIndex((x) => x.k.sel === d.target); if (ix < 0 || tx < 0) return;
      const it = o.ord.splice(ix, 1)[0], at = o.ord.findIndex((x) => x.k.sel === d.target) + (d.after ? 1 : 0); o.ord.splice(at, 0, it); commitOrder(o.ord, o.el, o.info);
    }
    paintPanel();
  }
  function recompute(en) {
    const p = en.p || {}; en.css = en.css || {};
    const n = (v, d) => (isFinite(+v) && v !== "" ? +v : d), rgba = (hex, o) => { const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ""); return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${Math.max(0, Math.min(1, n(o, 45) / 100))})` : "rgba(0,0,0,.45)"; };
    if (p.g) { if (p.g.on) en.css["background-image"] = `linear-gradient(${n(p.g.a, 135)}deg,${p.g.c1 || "#3b82f6"},${p.g.c2 || "#a855f7"})`; else if (/^linear-gradient/.test(en.css["background-image"] || "")) delete en.css["background-image"]; }
    if (p.sh) { if (p.sh.on) en.css["box-shadow"] = `${p.sh.i ? "inset " : ""}${n(p.sh.x, 0)}px ${n(p.sh.y, 8)}px ${n(p.sh.b, 24)}px ${n(p.sh.s, 0)}px ${rgba(p.sh.c || "#000000", p.sh.o)}`; else delete en.css["box-shadow"]; }
    if (p.fl) {
      if (p.fl.on) { const f = [], b = n(p.fl.blur, 0), br = n(p.fl.bri, 100), co = n(p.fl.con, 100), sa = n(p.fl.sat, 100), hu = n(p.fl.hue, 0), gr = n(p.fl.gray, 0); if (b) f.push(`blur(${b}px)`); if (br !== 100) f.push(`brightness(${br}%)`); if (co !== 100) f.push(`contrast(${co}%)`); if (sa !== 100) f.push(`saturate(${sa}%)`); if (hu) f.push(`hue-rotate(${hu}deg)`); if (gr) f.push(`grayscale(${gr}%)`); if (f.length) en.css.filter = f.join(" "); else delete en.css.filter; const bd = n(p.fl.bd, 0); if (bd) en.css["backdrop-filter"] = `blur(${bd}px)`; else delete en.css["backdrop-filter"]; }
      else { delete en.css.filter; delete en.css["backdrop-filter"]; }
    }
  }
  function cloneBlockStyles(rid, oldId, newId) {
    const pg = P()[rid]; if (!pg) return; const a = "#ed-b-" + String(oldId).replace(/[^a-z0-9]/gi, ""), b = "#ed-b-" + String(newId).replace(/[^a-z0-9]/gi, "");
    Object.keys(pg.s || {}).filter((k) => k === a || k.startsWith(a + " ")).forEach((k) => { pg.s[b + k.slice(a.length)] = clone(pg.s[k]); });
  }
  const newId = () => "b" + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36);
  function addBlock() {
    const v = ($("#ed-addtype") || {}).value || "text", root = picked ? picked.root : pageRoot(); if (!root) { toast("Ouvre d'abord une page.", "err"); return; }
    const id = newId();
    change(() => {
      const pg = (P()[root] = P()[root] || { s: {}, add: [] }); pg.add = pg.add || []; pg.s = pg.s || {};
      let type = v, props, styles = null;
      if (v.startsWith("tpl:")) { const t = (draft.tpl || []).find((x) => x.id === v.slice(4)); if (!t) return; type = t.type; props = clone(t.props || {}); styles = t.styles; } else props = clone(BLOCKS[v][1]);
      pg.add.push({ id, after: picked ? picked.sel : null, type, props });
      if (styles) Object.keys(styles).forEach((suf) => { pg.s["#ed-b-" + id + suf] = clone(styles[suf]); });
    });
    picked = null; paintPanel();
  }
  function delBlock(rid, id) {
    change(() => { const pg = P()[rid]; if (!pg) return; pg.add = (pg.add || []).filter((x) => x.id !== id); const a = "#ed-b-" + String(id).replace(/[^a-z0-9]/gi, ""); Object.keys(pg.s || {}).filter((k) => k === a || k.startsWith(a + " ")).forEach((k) => delete pg.s[k]); });
  }
  function onClick(e) {
    const t = e.target.closest("[data-ed]"); if (!t) return; const a = t.dataset.ed;
    if (a === "quit") { close(); return; }
    if (a === "dev-pc" || a === "dev-mobile") { dev = a === "dev-pc" ? "pc" : "mobile"; picked = null; mountFrame(); paintBar(); paintPanel(); return; }
    if (a === "mode-edit" || a === "mode-nav") { mode = a === "mode-edit" ? "edit" : "nav"; if (win && win.__edSelect && mode === "nav") win.__edSelect(null); paintBar(); return; }
    if (a === "undo" && undo.length) { redo.push(JSON.stringify(draft)); draft = JSON.parse(undo.pop()); lay(); push(); autosave(); paintBar(); paintPanel(); return; }
    if (a === "redo" && redo.length) { undo.push(JSON.stringify(draft)); draft = JSON.parse(redo.pop()); lay(); push(); autosave(); paintBar(); paintPanel(); return; }
    if (a === "publish") { publish(); return; }
    if (a === "discard") { if (confirm("Abandonner toutes les modifications non publiées ?")) { change(() => { draft = clone(live); ["pc", "mobile"].forEach((k) => { draft[k] = draft[k] || {}; }); }); tgt = ""; picked = null; paintBar(); paintPanel(); } return; }
    if (a === "versions") { versions(); return; }
    if (a === "scenes") { scenesModal(); return; }
    if (a === "tree") { treeModal(); return; }
    if (a === "cmp") { cmp = !cmp; if (cmp && win && win.__edSelect) win.__edSelect(null); push(); paintBar(); return; }
    if (a === "closemodal") { const m = $(".ed-modal"); if (m) m.remove(); return; }
    if (a === "loadver") { loadVersion(t.dataset.id); return; }
    if (a === "treepick") { const el = treeNodes[+t.dataset.i]; if (el && win) { const d = win.MASiteLayout.describe(el); if (d && win.MASiteLayout.pathOf(el)) { win.__edSelect(el); picked = d; el.scrollIntoView({ block: "center" }); const m = $(".ed-modal"); if (m) m.remove(); mode = "edit"; paintBar(); paintPanel(); } } return; }
    if (a === "scnew") { const id = "s" + Date.now().toString(36), now = Date.now(); change(() => { draft.scenes = draft.scenes || []; draft.scenes.push({ id, name: "Nouvelle scène", from: now, to: now + 7 * 86400000, on: true, layout: { pc: {}, mobile: {} } }); }); scenesModal(); paintBar(); return; }
    if (a === "scdel") { if (!confirm("Supprimer cette scène et ses modifications ?")) return; change(() => { draft.scenes = (draft.scenes || []).filter((x) => x.id !== t.dataset.id); }); if (tgt === t.dataset.id) { tgt = ""; push(); } scenesModal(); paintBar(); paintPanel(); return; }
    if (a === "scedit") { tgt = t.dataset.id; picked = null; const m = $(".ed-modal"); if (m) m.remove(); push(); paintBar(); paintPanel(); return; }
    if (a === "blkdel") { delBlock(t.dataset.r, t.dataset.id); picked = null; paintPanel(); return; }
    if (a === "blkup") { upTarget = { kind: "blk", id: t.dataset.id, r: t.dataset.r, k: t.dataset.k }; $("#ed-file").click(); return; }
    if (a === "gclr") { change(() => { const g = lay().g; if (g && g.vars) delete g.vars[t.dataset.v]; }); paintPanel(); return; }
    if (!picked) return;
    if (a === "up") move(-1); else if (a === "down") move(1);
    else if (a === "hide" || a === "del") { change(() => { const en = entry(picked.root, picked.sel, true); en.hide = a === "del" ? true : !en.hide; }); paintPanel(); }
    else if (a === "reset") { change(() => { const pg = P()[picked.root]; if (pg && pg.s) delete pg.s[picked.sel]; }); paintPanel(); }
    else if (a === "clr") { change(() => { const en = entry(picked.root, picked.sel, true); if (en.css) delete en.css[t.dataset.k]; }); paintPanel(); }
    else if (a === "transp") { change(() => { const en = entry(picked.root, picked.sel, true); en.css = en.css || {}; en.css["background-color"] = "transparent"; en.css["background-image"] = "none"; if (en.p && en.p.g) en.p.g.on = false; }); paintPanel(); }
    else if (a === "parent") { try { const el = L.find(picked.root, picked.sel), par = el && el.parentElement, d = par && par !== L.rootOf(par) && win.MASiteLayout.describe(par); if (d) { win.__edSelect(par); picked = d; paintPanel(); } else toast("Pas de parent modifiable."); } catch (_) { /* ignoré */ } }
    else if (a === "add") addBlock();
    else if (a === "dup") { const pg = P()[picked.root], b = pg && (pg.add || []).find((x) => x.id === picked.blk); if (!b) return; const id = newId(); change(() => { pg.add.push({ id, after: "#ed-b-" + b.id.replace(/[^a-z0-9]/gi, ""), type: b.type, props: clone(b.props || {}) }); cloneBlockStyles(picked.root, b.id, id); }); picked = null; paintPanel(); toast("Bloc dupliqué."); }
    else if (a === "tplsave") {
      const pg = P()[picked.root], b = pg && (pg.add || []).find((x) => x.id === picked.blk); if (!b) return; const name = (($("#ed-tplname") || {}).value || "").trim() || BLOCKS[b.type][0], pre = "#ed-b-" + b.id.replace(/[^a-z0-9]/gi, ""), styles = {};
      Object.keys(pg.s || {}).filter((k) => k === pre || k.startsWith(pre + " ")).forEach((k) => { styles[k.slice(pre.length)] = clone(pg.s[k]); });
      change(() => { draft.tpl = draft.tpl || []; draft.tpl.push({ id: newId(), name, type: b.type, props: clone(b.props || {}), styles }); }); toast("Modèle « " + name + " » enregistré : il apparaît dans « Ajouter un bloc »."); paintPanel();
    }
    else if (a === "copy") { const o = dev === "pc" ? "mobile" : "pc"; change(() => { const src = (P()[picked.root] || { s: {} }).s[picked.sel]; if (!src) return; const l = lay(); l[o] = l[o] || {}; const pg = (l[o][picked.root] = l[o][picked.root] || { s: {}, add: [] }); pg.s[picked.sel] = clone(src); }); toast("Copié vers " + (o === "pc" ? "le PC" : "le mobile") + "."); }
    else if (a === "upload") { upTarget = { kind: "src" }; $("#ed-file").click(); }
    else if (a === "upbg") { upTarget = { kind: "bg" }; $("#ed-file").click(); }
  }
  function onInput(e) {
    const t = e.target, isInput = e.type === "input";
    if (t.id === "ed-route") { route = t.value; picked = null; if (frame) { try { win.location.hash = "#" + route; } catch (_) { frame.src = location.pathname + "?editor=1#" + route; } } return; }
    if (t.id === "ed-tgt") { tgt = t.value; picked = null; push(); paintBar(); paintPanel(); return; }
    if (t.id === "ed-dm") { dragMode = t.value; return; }
    if (t.id === "ed-file") { upload(t.files && t.files[0]); t.value = ""; return; }
    if (t.dataset.sc) { const sc = (draft.scenes || []).find((x) => x.id === t.dataset.id); if (!sc) return; change(() => { const k = t.dataset.sc; if (k === "name") sc.name = t.value; else if (k === "on") sc.on = t.checked; else { const ms = Date.parse(t.value); sc[k] = isFinite(ms) ? ms : 0; } }, isInput); return; }
    if (t.dataset.blk) { change(() => { const pg = P()[t.dataset.r]; const b = pg && pg.add.find((x) => x.id === t.dataset.blk); if (b) { b.props = b.props || {}; b.props[t.dataset.k] = t.dataset.k === "h" ? +t.value || 24 : t.value; } }, isInput && lastKey === "b" + t.dataset.blk + t.dataset.k); lastKey = "b" + t.dataset.blk + t.dataset.k; return; }
    if (t.dataset.gv) { change(() => { const g = (lay().g = lay().g || {}); g.vars = g.vars || {}; g.vars[t.dataset.gv] = t.dataset.u === "px" ? (t.value === "" ? "" : t.value + "px") : t.value; }, isInput && lastKey === t.dataset.gv); lastKey = t.dataset.gv; return; }
    if (t.dataset.gfont) { change(() => { const g = (lay().g = lay().g || {}); g.font = t.value; }); return; }
    if (t.dataset.gscale) { change(() => { const g = (lay().g = lay().g || {}); g.scale = t.value === "" ? 0 : Math.max(75, Math.min(135, +t.value)); }, isInput && lastKey === "gscale"); lastKey = "gscale"; return; }
    if (!picked) return;
    const keep = (k) => isInput && lastKey === k;
    if (t.dataset.css !== undefined) {
      let v = t.value; if (v !== "" && t.dataset.u === "px") v = v + "px";
      if (t.tagName === "SELECT" && v === "") { change(() => { const en = entry(picked.root, picked.sel, true); if (en.css) delete en.css[t.dataset.css]; }); lastKey = ""; return; }
      change(() => { const en = entry(picked.root, picked.sel, true); en.css = en.css || {}; if (v === "" || v === "px") delete en.css[t.dataset.css]; else { en.css[t.dataset.css] = v; if (t.dataset.css === "border-width") en.css["border-style"] = en.css["border-style"] || "solid"; } }, keep(t.dataset.css));
      lastKey = t.dataset.css; return;
    }
    if (t.dataset.tf) { change(() => { const en = entry(picked.root, picked.sel, true); en.tf = en.tf || {}; if (t.value === "") delete en.tf[t.dataset.tf]; else en.tf[t.dataset.tf] = +t.value; }, keep("tf" + t.dataset.tf)); lastKey = "tf" + t.dataset.tf; return; }
    if (t.dataset.p) {
      const [g, k] = t.dataset.p.split("."), v = t.type === "checkbox" ? t.checked : t.type === "number" ? (t.value === "" ? "" : +t.value) : t.value;
      change(() => { const en = entry(picked.root, picked.sel, true); en.p = en.p || {}; en.p[g] = en.p[g] || {}; en.p[g][k] = v; if (g === "fl" && k !== "on" && !en.p.fl.on) en.p.fl.on = true; recompute(en); }, keep(t.dataset.p));
      lastKey = t.dataset.p; if (t.type === "checkbox") paintPanel(); return;
    }
    if (t.dataset.hv) { change(() => { entry(picked.root, picked.sel, true).hv = t.value; }); return; }
    if (t.dataset.an) { change(() => { const en = entry(picked.root, picked.sel, true); en.an = en.an || {}; const k = t.dataset.an; if (k === "n") en.an.n = t.value; else if (k === "l") en.an.l = t.checked; else en.an[k] = t.value === "" ? 0 : +t.value; }, keep("an" + t.dataset.an)); lastKey = "an" + t.dataset.an; return; }
    if (t.dataset.bgimg) { change(() => { const en = entry(picked.root, picked.sel, true); en.css = en.css || {}; if (t.value.trim() === "") { if (/^url/.test(en.css["background-image"] || "")) delete en.css["background-image"]; } else { en.css["background-image"] = `url("${t.value.trim()}")`; en.css["background-size"] = en.css["background-size"] || "cover"; en.css["background-position"] = en.css["background-position"] || "center"; en.css["background-repeat"] = "no-repeat"; if (en.p && en.p.g) en.p.g.on = false; } }, keep("bgimg")); lastKey = "bgimg"; return; }
    if (t.dataset.text) { change(() => { entry(picked.root, picked.sel, true).text = t.value; }, keep("text")); lastKey = "text"; return; }
    if (t.dataset.attr) { change(() => { const en = entry(picked.root, picked.sel, true); en.attr = en.attr || {}; if (t.value === "") delete en.attr[t.dataset.attr]; else en.attr[t.dataset.attr] = t.value; }, keep("attr" + t.dataset.attr)); lastKey = "attr" + t.dataset.attr; }
  }
  async function upload(file) {
    if (!file || !upTarget) return;
    try {
      const st = window.MAFB.storage; if (!st) throw new Error("Stockage indisponible");
      const ref = st.ref(`ui_images/${ctx.user.uid}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_").slice(-40)}`);
      await ref.put(file); const url = await ref.getDownloadURL(), u = upTarget;
      if (u.kind === "blk") change(() => { const pg = P()[u.r], b = pg && pg.add.find((x) => x.id === u.id); if (b) { b.props = b.props || {}; b.props[u.k] = url; } });
      else if (!picked) throw new Error("Sélectionne d'abord un élément");
      else if (u.kind === "bg") change(() => { const en = entry(picked.root, picked.sel, true); en.css = en.css || {}; en.css["background-image"] = `url("${url}")`; en.css["background-size"] = "cover"; en.css["background-position"] = "center"; en.css["background-repeat"] = "no-repeat"; if (en.p && en.p.g) en.p.g.on = false; });
      else change(() => { const en = entry(picked.root, picked.sel, true); en.attr = en.attr || {}; en.attr.src = url; });
      paintPanel(); toast("Image téléversée.");
    } catch (e) { toast("Téléversement impossible : " + (e.code === "storage/unauthorized" ? "règles Storage non publiées" : e.message), "err"); }
  }

  // ---------------------------------------------------------------- arbre des éléments et scènes
  function treeModal() {
    if (!win) return; const root = picked ? win.document.getElementById(picked.root) : win.document.querySelector(".page.page-on"); if (!root) { toast("Aucune page à explorer."); return; }
    treeNodes = []; let count = 0; const SKIP = /^(script|style|link|meta|svg|path|noscript|template)$/i;
    const modded = (el) => { const p = win.MASiteLayout.pathOf(el); return p && ((P()[p.root] || {}).s || {})[p.sel]; };
    const label = (el) => { const cls = Array.from(el.classList).filter((c) => !/^(ed-|on$|active)/.test(c))[0], txt = (el.children.length ? "" : (el.textContent || "").trim()).slice(0, 28); return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (cls ? "." + cls : "") + (txt ? ` « ${txt} »` : ""); };
    const walk = (el, depth) => {
      let out = ""; const kids = Array.from(el.children).filter((k) => !SKIP.test(k.tagName) && !k.classList.contains("ed-chrome")).slice(0, 40);
      kids.forEach((k) => {
        if (count > 500) return; count++; const ok = win.MASiteLayout.pathOf(k), i = treeNodes.push(k) - 1, btn = `<button type="button" data-ed="treepick" data-i="${i}" class="${ok ? (modded(k) ? "mod" : "") : "dim"}" ${ok ? "" : "disabled"}>${esc(label(k))}${modded(k) ? " ●" : ""}</button>`;
        const sub = depth < 8 ? walk(k, depth + 1) : "";
        out += sub ? `<details ${depth < 2 ? "open" : ""}><summary>${btn}</summary>${sub}</details>` : `<div class="ed-leaf">${btn}</div>`;
      });
      return out;
    };
    const m = document.createElement("div"); m.className = "ed-modal";
    m.innerHTML = `<div class="ed-box"><h4>Arbre de la page</h4><p class="ed-hint">Touche un élément pour le sélectionner (● = déjà modifié, grisé = non modifiable).</p><div class="ed-tree">${walk(root, 0) || "<p class='ed-hint'>Vide</p>"}</div><button type="button" data-ed="closemodal">Fermer</button></div>`;
    ov.appendChild(m);
  }
  const toLocal = (ms) => (ms ? new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
  function scenesModal() {
    const old = $(".ed-modal"); if (old) old.remove();
    const sc = draft.scenes || [], m = document.createElement("div"); m.className = "ed-modal";
    m.innerHTML = `<div class="ed-box"><h4>Scènes planifiées</h4><p class="ed-hint">Une scène est une série de modifications (PC et mobile) qui ne s'applique qu'entre deux dates, par exemple un décor de Noël. Laisse « fin » vide pour ne jamais l'arrêter. Après avoir créé la scène, choisis « Éditer » : tout ce que tu modifies ensuite va dans la scène, pas dans la base. N'oublie pas de Publier.</p>
      ${sc.length ? sc.map((x) => `<div class="ed-sec"><label class="ed-hint">Nom<input type="text" data-sc="name" data-id="${esc(x.id)}" value="${esc(x.name || "")}"></label><div class="ed-row"><label>Début<input type="datetime-local" data-sc="from" data-id="${esc(x.id)}" value="${toLocal(x.from)}"></label><label>Fin<input type="datetime-local" data-sc="to" data-id="${esc(x.id)}" value="${toLocal(x.to)}"></label></div><div class="ed-row"><label style="display:flex;gap:.4rem;align-items:center;flex-direction:row"><input type="checkbox" data-sc="on" data-id="${esc(x.id)}" ${x.on !== false ? "checked" : ""}>Activée</label><button type="button" data-ed="scedit" data-id="${esc(x.id)}">Éditer cette scène</button><button type="button" data-ed="scdel" data-id="${esc(x.id)}">Supprimer</button></div></div>`).join("") : `<p class="ed-hint">Aucune scène pour l'instant.</p>`}
      <div class="ed-row"><button type="button" data-ed="scnew">+ Nouvelle scène</button><button type="button" data-ed="closemodal">Fermer</button></div></div>`;
    ov.appendChild(m);
  }

  // ---------------------------------------------------------------- publication et versions
  async function publish() {
    if (!confirm("Publier ces changements pour TOUT LE MONDE ?")) return;
    clearTimeout(saveT);
    try {
      const json = JSON.stringify(draft), at = Date.now(), by = ctx.user ? ctx.user.uid : "";
      if (json.length > 800000) throw new Error("mise en page trop volumineuse");
      await db().collection("ui_layout_versions").doc(String(at)).set({ layout: JSON.stringify(live), at, by, label: "Avant publication du " + new Date(at).toLocaleString("fr-FR") });
      await db().collection("ui_layout").doc("live").set({ layout: json, at, by });
      await db().collection("ui_layout").doc("draft").set({ layout: json, at, by });
      live = clone(draft); status = "Publié à " + new Date(at).toLocaleTimeString("fr-FR");
      try { localStorage.setItem("ma_ui_layout", json); } catch (_) { /* ignoré */ }
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
    try { const s = await db().collection("ui_layout_versions").doc(String(id)).get(); if (!s.exists) return; const l = JSON.parse(s.data().layout); change(() => { draft = l; ["pc", "mobile"].forEach((k) => { draft[k] = draft[k] || {}; }); }); tgt = ""; const m = $(".ed-modal"); if (m) m.remove(); picked = null; paintBar(); paintPanel(); toast("Version chargée dans le brouillon."); }
    catch (e) { toast("Chargement impossible.", "err"); }
  }

  window.MASiteEditor = {
    open, close, attach, onPick, mode: () => (cmp ? "nav" : mode), draft: () => draft, drag: dragEnd, dragMode: () => dragMode,
    tfOf: (p) => { const e = p && ((P()[p.root] || {}).s || {})[p.sel]; return e && e.tf; },
    _state: () => ({ dev, draft, live, picked, tgt }), _setCtx: (c) => { ctx = c; }
  };
  document.dispatchEvent(new CustomEvent("ma:editor-ready"));
})();
