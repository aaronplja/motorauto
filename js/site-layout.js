/**
 * MOTORAUTO — moteur de mise en page éditable (visiteurs + éditeur).
 *
 * L'administrateur modifie l'interface depuis l'éditeur visuel (js/site-editor.js). Ses changements sont enregistrés dans Firestore
 * (ui_layout/live) et appliqués ici, pour tout le monde, SANS toucher au code :
 *   { v:1, pc:{ <idPage>:{ s:{ <sélecteur>:{ css:{…}, hide, text, attr:{…}, order, pf } }, add:[ {id, after, type, props} ] } }, mobile:{…} }
 * « pc » s'applique à partir de 900 px de large, « mobile » en dessous : deux mises en page indépendantes.
 * Les sélecteurs partent de la page (ou de la fenêtre) qui contient l'élément ; la barre de navigation et la barre du haut ne sont jamais modifiables.
 */
(function () {
  "use strict";
  const BREAK = 900;
  const MQ = { pc: `(min-width:${BREAK}px)`, mobile: `(max-width:${BREAK - 1}px)` };
  // propriétés CSS que l'éditeur a le droit d'écrire (liste blanche : rien d'autre n'est appliqué)
  const CSS_OK = new Set(["color", "background-color", "background-image", "font-size", "font-weight", "font-style", "letter-spacing", "line-height", "text-align", "text-transform", "border-radius", "border-width", "border-style", "border-color", "box-shadow", "padding", "margin", "width", "max-width", "min-height", "height", "opacity", "gap", "flex-direction", "flex-wrap", "justify-content", "align-items", "grid-template-columns", "object-fit", "transform", "overflow", "display"]);
  const ROOT_SEL = ".page, [id$='-modal'], #admin-panel-modal";
  const IGNORE_CLS = /^(on|active|selected|open|opened|is-|has-|ed-|hover|focus|loading|hidden|show|shown|visible|current|page-on|reveal|in-view|anim)/;
  const SAFE_VAL = /^[^;{}<>\\]*$/;   // pas de ; { } < > \ dans une valeur CSS
  const SAFE_SEL = /^[^;{}<\\]*$/;   // sélecteur : le combinateur > est permis
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => { u = String(u || "").trim(); return /^(https?:\/\/|\/|#|mailto:|img\/|assets\/)/i.test(u) && !/^\s*javascript:/i.test(u) ? u : ""; };
  const device = () => (window.matchMedia(MQ.pc).matches ? "pc" : "mobile");
  const empty = () => ({ v: 1, pc: {}, mobile: {} });

  let layout = empty(), styleEl = null, obs = null, timer = 0, inApply = false, editHooks = null;

  // ---------------------------------------------------------------- sélecteurs
  const rootOf = (el) => el && el.closest ? el.closest(ROOT_SEL) : null;
  function segment(el) {
    const p = el.parentElement; let i = 1; for (let s = el.previousElementSibling; s; s = s.previousElementSibling) i++;
    const cls = Array.from(el.classList).filter((c) => !IGNORE_CLS.test(c) && /^[a-z][\w-]*$/i.test(c)).slice(0, 2).map((c) => "." + CSS.escape(c)).join("");
    return el.tagName.toLowerCase() + cls + (p && p.children.length > 1 ? `:nth-child(${i})` : "");
  }
  /** chemin CSS stable de l'élément, relatif à sa page ; null si l'élément n'est pas modifiable */
  function pathOf(el) {
    const root = rootOf(el); if (!root || el === root || !root.id) return null;
    const parts = []; let cur = el;
    while (cur && cur !== root && parts.length < 12) {
      if (cur.id && /^[a-z][\w-]*$/i.test(cur.id) && !/\d{3,}/.test(cur.id)) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      parts.unshift(segment(cur)); cur = cur.parentElement;
    }
    const sel = parts.join(" > ");
    try { if (root.querySelectorAll(sel).length !== 1) return null; } catch (_) { return null; }
    return { root: root.id, sel };
  }
  const find = (rootId, sel) => { const r = document.getElementById(rootId); if (!r) return null; try { return r.querySelector(sel); } catch (_) { return null; } };

  // ---------------------------------------------------------------- CSS généré
  const cssDecl = (css) => Object.keys(css || {}).filter((k) => CSS_OK.has(k) && SAFE_VAL.test(String(css[k]))).map((k) => `${k}:${css[k]}!important`).join(";");
  function cssFor(lay) {
    let out = "";
    ["pc", "mobile"].forEach((dev) => {
      const pages = (lay && lay[dev]) || {}, rules = [];
      Object.keys(pages).forEach((rid) => {
        if (!/^[a-z][\w-]*$/i.test(rid)) return;
        const s = (pages[rid] && pages[rid].s) || {};
        Object.keys(s).forEach((sel) => {
          if (!SAFE_SEL.test(sel)) return;
          const e = s[sel] || {}, d = [cssDecl(e.css)];
          if (e.hide) d.push("display:none!important");
          if (typeof e.order === "number" && isFinite(e.order)) d.push(`order:${Math.round(e.order)}!important`);
          const dec = d.filter(Boolean).join(";");
          if (dec) rules.push(`#${rid} ${sel}{${dec}}`);
          if (e.pf && e.pp !== undefined && SAFE_SEL.test(e.pp)) rules.push(`#${rid} ${e.pp}{display:flex!important;flex-direction:column!important}`);
        });
      });
      if (rules.length) out += `@media ${MQ[dev]}{${rules.join("\n")}}\n`;
    });
    return out;
  }

  // ---------------------------------------------------------------- blocs ajoutés, textes, attributs
  function blockEl(a) {
    const p = a.props || {}, el = document.createElement("div");
    el.className = "ed-added ed-" + String(a.type).replace(/[^a-z]/g, ""); el.dataset.edAdd = a.id;
    if (a.type === "text") el.innerHTML = `${p.title ? `<h3>${esc(p.title)}</h3>` : ""}${p.text ? `<p>${esc(p.text)}</p>` : ""}`;
    else if (a.type === "image") { const u = safeUrl(p.src); el.innerHTML = u ? `<img src="${esc(u)}" alt="${esc(p.alt || "")}" loading="lazy">` : ""; }
    else if (a.type === "button") { const u = safeUrl(p.href) || "#"; el.innerHTML = `<a class="cta-btn fill-btn" href="${esc(u)}"${/^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : ""}>${esc(p.label || "Bouton")}</a>`; }
    else if (a.type === "banner") { const u = safeUrl(p.href); el.innerHTML = `<div class="ed-banner-in"><b>${esc(p.title || "")}</b><span>${esc(p.text || "")}</span>${u ? `<a class="cta-btn fill-btn" href="${esc(u)}">${esc(p.label || "Voir")}</a>` : ""}</div>`; }
    else if (a.type === "spacer") el.style.height = Math.max(4, Math.min(400, Number(p.h) || 24)) + "px";
    el.dataset.edSig = JSON.stringify([a.type, p]);
    return el;
  }
  function applyDom() {
    const dev = device(), pages = (layout && layout[dev]) || {};
    inApply = true;
    try {
      // retire d'abord les blocs ajoutés qui ne sont plus dans la mise en page courante
      const want = new Set();
      Object.keys(pages).forEach((rid) => (pages[rid].add || []).forEach((a) => want.add(a.id)));
      document.querySelectorAll("[data-ed-add]").forEach((n) => { if (!want.has(n.dataset.edAdd)) n.remove(); });
      // restaure les textes / attributs que l'on ne modifie plus
      document.querySelectorAll("[data-ed-orig-text],[data-ed-orig-attr]").forEach((n) => {
        const rid = rootOf(n) && rootOf(n).id, hit = rid && pages[rid] && Object.keys(pages[rid].s || {}).some((sel) => find(rid, sel) === n && (pages[rid].s[sel].text !== undefined || pages[rid].s[sel].attr));
        if (hit) return;
        if (n.dataset.edOrigText !== undefined) { n.textContent = n.dataset.edOrigText; delete n.dataset.edOrigText; }
        if (n.dataset.edOrigAttr) { try { const o = JSON.parse(n.dataset.edOrigAttr); Object.keys(o).forEach((k) => (o[k] == null ? n.removeAttribute(k) : n.setAttribute(k, o[k]))); } catch (_) { /* ignoré */ } delete n.dataset.edOrigAttr; }
      });
      Object.keys(pages).forEach((rid) => {
        const pg = pages[rid], root = document.getElementById(rid); if (!root) return;
        Object.keys(pg.s || {}).forEach((sel) => {
          const e = pg.s[sel], el = find(rid, sel); if (!el) return;
          if (typeof e.text === "string" && !el.children.length && el.textContent !== e.text) { if (el.dataset.edOrigText === undefined) el.dataset.edOrigText = el.textContent; el.textContent = e.text; }
          if (e.attr) {
            const o = el.dataset.edOrigAttr ? JSON.parse(el.dataset.edOrigAttr) : {};
            ["src", "href", "alt", "title"].forEach((k) => {
              if (e.attr[k] === undefined) return;
              const v = k === "alt" || k === "title" ? String(e.attr[k]) : safeUrl(e.attr[k]); if (!v) return;
              if (el.getAttribute(k) !== v) { if (!(k in o)) o[k] = el.getAttribute(k); el.setAttribute(k, v); if (k === "src") el.removeAttribute("srcset"); }
            });
            if (Object.keys(o).length) el.dataset.edOrigAttr = JSON.stringify(o);
          }
        });
        (pg.add || []).forEach((a) => {
          const anchor = a.after ? find(rid, a.after) : root; if (!anchor) return;
          let cur = document.querySelector(`[data-ed-add="${CSS.escape(a.id)}"]`);
          const sig = JSON.stringify([a.type, a.props || {}]);
          if (cur && cur.dataset.edSig !== sig) { const n = blockEl(a); cur.replaceWith(n); cur = n; }
          if (!cur) { cur = blockEl(a); a.after ? anchor.insertAdjacentElement("afterend", cur) : anchor.appendChild(cur); }
          else if (a.after && cur.previousElementSibling !== anchor) anchor.insertAdjacentElement("afterend", cur);
          if (a.css) cur.style.cssText = cssDecl(a.css).replace(/!important/g, "");
        });
      });
    } finally { inApply = false; }
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(applyDom, 80); }
  function setLayout(l) {
    layout = l && typeof l === "object" ? l : empty(); if (!layout.pc) layout.pc = {}; if (!layout.mobile) layout.mobile = {};
    if (!styleEl) { styleEl = document.createElement("style"); styleEl.id = "ed-layout-css"; document.head.appendChild(styleEl); }
    styleEl.textContent = cssFor(layout); applyDom();
  }
  function watch() {
    if (obs) return;
    obs = new MutationObserver(() => { if (!inApply) schedule(); });
    const host = document.getElementById("page-main") || document.body;
    obs.observe(host, { childList: true, subtree: true });
    document.addEventListener("ma:route", schedule);
    window.matchMedia(MQ.pc).addEventListener && window.matchMedia(MQ.pc).addEventListener("change", () => applyDom());
  }

  // ---------------------------------------------------------------- chargement (visiteurs)
  const CACHE = "ma_ui_layout";
  async function loadLive(db) {
    try { const c = localStorage.getItem(CACHE); if (c) setLayout(JSON.parse(c)); } catch (_) { /* ignoré */ }
    try {
      const s = await db.collection("ui_layout").doc("live").get();
      const d = s.exists ? (s.data() || {}) : empty(), lay = d.layout ? JSON.parse(d.layout) : empty();
      setLayout(lay); try { localStorage.setItem(CACHE, JSON.stringify(lay)); } catch (_) { /* ignoré */ }
    } catch (_) { /* règles non publiées ou hors ligne : on garde le cache */ }
  }

  // ---------------------------------------------------------------- mode éditeur (page chargée dans le cadre de l'éditeur)
  const INFRAME = (() => { try { return window.parent !== window && /(?:^|[?&])editor=1/.test(location.search) && window.parent.MASiteEditor; } catch (_) { return false; } })();
  function editInit() {
    const ED = window.parent.MASiteEditor, st = document.createElement("style");
    st.textContent = `.ed-hover{outline:2px dashed #38bdf8!important;outline-offset:1px;cursor:crosshair!important}.ed-sel{outline:3px solid #f59e0b!important;outline-offset:1px}.ed-added{margin:.6rem 0}.ed-banner-in{display:grid;gap:.4rem;padding:1rem;border-radius:16px;background:var(--bg-elevated);border:1px solid var(--stroke-line)}.ed-image img{max-width:100%;border-radius:12px;display:block}`;
    document.head.appendChild(st);
    let hov = null, sel = null;
    const ok = (t) => t && t.nodeType === 1 && !t.closest(".ed-chrome") && pathOf(t);
    document.addEventListener("mouseover", (e) => { if (ED.mode() !== "edit") return; if (hov) hov.classList.remove("ed-hover"); hov = ok(e.target) ? e.target : null; if (hov) hov.classList.add("ed-hover"); }, true);
    document.addEventListener("click", (e) => {
      if (ED.mode() !== "edit") return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      const t = e.target; if (!ok(t)) { ED.onPick(null); return; }
      if (sel) sel.classList.remove("ed-sel"); sel = t; t.classList.add("ed-sel"); if (hov) hov.classList.remove("ed-hover");
      ED.onPick(describe(t));
    }, true);
    ["submit", "keydown", "mousedown", "pointerdown", "touchstart"].forEach((ev) => document.addEventListener(ev, (e) => { if (ED.mode() === "edit" && ev !== "keydown") e.stopPropagation(); if (ev === "submit" && ED.mode() === "edit") e.preventDefault(); }, true));
    window.__edSelect = (el) => { if (sel) sel.classList.remove("ed-sel"); sel = el; if (el) el.classList.add("ed-sel"); };
    ED.attach(window);
  }
  function describe(el) {
    const p = pathOf(el), cs = getComputedStyle(el), par = el.parentElement, pcs = par ? getComputedStyle(par) : null, r = el.getBoundingClientRect();
    const px = (v) => parseFloat(v) || 0, hex = (c) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c || ""); if (!m || (m[4] !== undefined && +m[4] === 0)) return ""; return "#" + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, "0")).join(""); };
    const leaf = !el.children.length && !!el.textContent.trim();
    let i = 0; for (let s = el.previousElementSibling; s; s = s.previousElementSibling) i++;
    return {
      root: p.root, sel: p.sel, tag: el.tagName.toLowerCase(), leaf, text: leaf ? el.textContent : "", isImg: el.tagName === "IMG", src: el.getAttribute("src") || "", href: el.getAttribute("href") || "", alt: el.getAttribute("alt") || "",
      index: i, count: par ? par.children.length : 1, parentSel: par && par !== rootOf(el) ? (pathOf(par) || {}).sel || "" : "", parentDisplay: pcs ? pcs.display : "",
      rect: { w: Math.round(r.width), h: Math.round(r.height) },
      cs: { color: hex(cs.color), bg: hex(cs.backgroundColor), fontSize: px(cs.fontSize), fontWeight: cs.fontWeight, radius: px(cs.borderTopLeftRadius), padding: px(cs.paddingTop), margin: px(cs.marginTop), opacity: cs.opacity, align: cs.textAlign, gap: px(cs.rowGap), borderW: px(cs.borderTopWidth), display: cs.display }
    };
  }

  // ---------------------------------------------------------------- accès administrateur : bouton « Éditeur » (chargé à la demande)
  let ctxRef = null, fabEl = null, edLoading = null;
  function loadEditor() {
    if (window.MASiteEditor) return Promise.resolve();
    if (!edLoading) edLoading = new Promise((ok, ko) => { const sc = document.createElement("script"); sc.src = "js/site-editor.js"; sc.onload = ok; sc.onerror = () => { edLoading = null; ko(new Error("éditeur introuvable")); }; document.head.appendChild(sc); });
    return edLoading;
  }
  function openEditor(route) { return loadEditor().then(() => { window.MASiteEditor._setCtx(ctxRef); window.MASiteEditor.open(route); }); }
  function fabSync() {
    const on = !!(ctxRef && ctxRef.isAdmin && ctxRef.user);
    if (on && !fabEl) {
      fabEl = document.createElement("button"); fabEl.type = "button"; fabEl.className = "ed-fab"; fabEl.setAttribute("data-no-i18n", ""); fabEl.textContent = "Éditeur"; fabEl.setAttribute("aria-label", "Ouvrir l'éditeur visuel de l'interface");
      fabEl.addEventListener("click", () => openEditor().catch(() => ctxRef.toast("Éditeur indisponible.", "err")));
      document.body.appendChild(fabEl);
      if (!document.getElementById("ed-css-fab")) { const st = document.createElement("style"); st.id = "ed-css-fab"; st.textContent = ".ed-fab{position:fixed;left:12px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:7000;padding:.55rem .85rem;border-radius:99px;border:1px solid var(--accent);background:var(--bg-elevated);color:var(--color-ink);font:700 .85rem system-ui;cursor:pointer;box-shadow:0 8px 24px -8px rgba(0,0,0,.5)}@media (min-width:900px){.ed-fab{bottom:18px}}"; document.head.appendChild(st); }
    }
    if (fabEl) fabEl.hidden = !on;
  }

  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#open-site-editor") && ctxRef) openEditor().catch(() => ctxRef.toast("Éditeur indisponible.", "err")); });

  function init(ctx) {
    ctxRef = ctx; watch();
    if (INFRAME) { editInit(); return; }
    if (/(?:^|[?&])noed=1/.test(location.search)) { try { localStorage.removeItem(CACHE); } catch (_) { /* ignoré */ } }   // secours : ?noed=1 désactive la mise en page éditée
    else if (ctx && ctx.db) loadLive(ctx.db);
    setInterval(fabSync, 3000); setTimeout(fabSync, 1500);
  }
  (window.MAModules = window.MAModules || []).push(init);
  window.MASiteLayout = { openEditor, cssFor, setLayout, applyDom, pathOf, find, rootOf, device, empty, describe, safeUrl, CSS_OK, BREAK, INFRAME: !!INFRAME };
})();
