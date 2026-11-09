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
  const CSS_OK = new Set(["color", "background-color", "background-image", "background-size", "background-position", "background-repeat", "font-size", "font-weight", "font-style", "font-family", "letter-spacing", "line-height", "text-align", "text-transform", "text-decoration", "text-shadow", "white-space", "border-radius", "border-width", "border-style", "border-color", "border-top-width", "border-bottom-width", "border-left-width", "border-right-width", "outline", "outline-offset", "box-shadow", "filter", "backdrop-filter", "mix-blend-mode", "padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "width", "min-width", "max-width", "height", "min-height", "max-height", "aspect-ratio", "opacity", "gap", "row-gap", "column-gap", "flex-direction", "flex-wrap", "flex-grow", "flex-shrink", "flex-basis", "justify-content", "justify-items", "align-items", "align-content", "align-self", "justify-self", "grid-template-columns", "grid-column", "object-fit", "object-position", "transform", "translate", "rotate", "scale", "transition", "overflow", "overflow-x", "overflow-y", "display", "position", "top", "right", "bottom", "left", "z-index", "cursor"]);
  const GVARS = ["--accent", "--bg-core", "--bg-surface", "--bg-elevated", "--color-ink", "--color-muted", "--stroke-line", "--on-accent", "--corner-sm", "--corner-md", "--corner-xs"];
  const FONTS = { sans: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", serif: "Georgia,'Times New Roman',serif", mono: "ui-monospace,Menlo,Consolas,monospace", rounded: "'Trebuchet MS','Arial Rounded MT Bold',system-ui,sans-serif", condensed: "'Arial Narrow','Impact',sans-serif", elegant: "'Palatino Linotype',Palatino,'Book Antiqua',serif" };
  const HOVERS = { grow: "scale:1.05", lift: "transform:translateY(-4px);box-shadow:0 14px 30px -12px rgba(0,0,0,.6)", glow: "box-shadow:0 0 24px 2px var(--accent)", dim: "opacity:.75", tilt: "rotate:2deg", bright: "filter:brightness(1.18)" };
  const ANIMS = { fade: "ed-fade", up: "ed-up", pulse: "ed-pulse", float: "ed-float", spin: "ed-spin", bounce: "ed-bounce", shake: "ed-shake", glow: "ed-glow" };
  const KEYFRAMES = "@keyframes ed-fade{from{opacity:0}to{opacity:1}}@keyframes ed-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}@keyframes ed-pulse{50%{transform:scale(1.06)}}@keyframes ed-float{50%{transform:translateY(-8px)}}@keyframes ed-spin{to{transform:rotate(360deg)}}@keyframes ed-bounce{40%{transform:translateY(-14px)}60%{transform:translateY(-6px)}}@keyframes ed-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}@keyframes ed-glow{50%{filter:drop-shadow(0 0 10px var(--accent))}}\n";
  const BLOCK_CSS = ".ed-added{margin:.6rem 0;max-width:100%}.ed-banner-in{display:grid;gap:.4rem;padding:1rem;border-radius:16px;background:var(--bg-elevated);border:1px solid var(--stroke-line)}.ed-image img{max-width:100%;border-radius:12px;display:block}.ed-card{display:grid;gap:.5rem;padding:.8rem;border-radius:16px;background:var(--bg-elevated);border:1px solid var(--stroke-line)}.ed-card img{width:100%;border-radius:12px;display:block;aspect-ratio:16/9;object-fit:cover}.ed-card h3,.ed-card p{margin:0}.ed-list ul{margin:0;padding-left:1.2rem;display:grid;gap:.25rem}.ed-video iframe,.ed-video video{width:100%;aspect-ratio:16/9;border:0;border-radius:12px;display:block}.ed-countdown{text-align:center}.ed-countdown b{display:block;font-size:1.8rem;font-variant-numeric:tabular-nums}.ed-stat{text-align:center}.ed-stat b{display:block;font-size:2.4rem;line-height:1.1}.ed-divider hr{border:0;height:1px;background:var(--stroke-line);margin:0}.ed-emoji{text-align:center}.ed-emoji .big{font-size:3rem;line-height:1.1}.ed-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:.5rem}.ed-gallery img{width:100%;border-radius:10px;aspect-ratio:1;object-fit:cover;display:block}.ed-quote blockquote{margin:0;padding:.6rem 1rem;border-left:4px solid var(--accent);font-style:italic}.ed-quote cite{display:block;opacity:.7;font-size:.85em;margin-top:.3rem}";
  const ROOT_SEL = ".page, [id$='-modal'], #admin-panel-modal";
  const IGNORE_CLS = /^(on|active|selected|open|opened|is-|has-|ed-|hover|focus|loading|hidden|show|shown|visible|current|page-on|reveal|in-view|anim)/;
  const SAFE_VAL = /^[^;{}<>\\]*$/;   // pas de ; { } < > \ dans une valeur CSS
  const SAFE_SEL = /^[^;{}<\\]*$/;   // sélecteur : le combinateur > est permis
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => { u = String(u || "").trim(); return /^(https?:\/\/|\/|#|mailto:|img\/|assets\/)/i.test(u) && !/^\s*javascript:/i.test(u) ? u : ""; };
  const device = () => (window.matchMedia(MQ.pc).matches ? "pc" : "mobile");
  const empty = () => ({ v: 1, pc: {}, mobile: {} });

  let layout = empty(), eff = empty(), sceneOpt, styleEl = null, obs = null, timer = 0, inApply = false, editHooks = null;

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
      if (cur.id && /^[a-z][\w-]*$/i.test(cur.id) && (/^ed-b-/.test(cur.id) || !/\d{3,}/.test(cur.id))) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      parts.unshift(segment(cur)); cur = cur.parentElement;
    }
    const sel = parts.join(" > ");
    try { if (root.querySelectorAll(sel).length !== 1) return null; } catch (_) { return null; }
    return { root: root.id, sel };
  }
  const find = (rootId, sel) => { const r = document.getElementById(rootId); if (!r) return null; try { return r.querySelector(sel); } catch (_) { return null; } };

  // ---------------------------------------------------------------- CSS généré
  function okVal(k, v) {
    v = String(v); if (!SAFE_VAL.test(v) || v.length > 300 || /expression|javascript:|@import|behavior|binding/i.test(v)) return false;
    const u = v.match(/url\s*\(/gi);
    if (u) { if (k !== "background-image") return false; const good = v.match(/url\(\s*["']?(https:\/\/[^"')\s]+|img\/[^"')\s]+|assets\/[^"')\s]+)["']?\s*\)/gi) || []; if (good.length !== u.length) return false; }
    if (k === "position" && !/^(relative|absolute|static)$/.test(v)) return false;
    if (k === "z-index") { const n = +v; if (!(n >= -5 && n <= 50)) return false; }
    return true;
  }
  const cssDecl = (css) => Object.keys(css || {}).filter((k) => CSS_OK.has(k) && okVal(k, css[k])).map((k) => `${k}:${css[k]}!important`).join(";");
  const num = (v, a, b, d) => { v = Number(v); return isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
  /** déplacement / rotation / échelle (tf) → propriétés « translate / rotate / scale » */
  function tfDecl(tf) {
    if (!tf) return "";
    const d = [];
    if (tf.x || tf.y) d.push(`translate:${num(tf.x, -3000, 3000, 0)}px ${num(tf.y, -3000, 3000, 0)}px!important`);
    if (tf.r) d.push(`rotate:${num(tf.r, -360, 360, 0)}deg!important`);
    if (tf.s && tf.s !== 1) d.push(`scale:${num(tf.s, 0.1, 5, 1)}!important`);
    return d.join(";");
  }
  // ---- scènes planifiées : une scène est une couche de modifications active entre deux dates
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function mergeLayers(base, extra) {
    const out = clone(base); if (!extra) return out;
    ["pc", "mobile"].forEach((d) => {
      out[d] = out[d] || {}; const ep = extra[d] || {};
      Object.keys(ep).forEach((rid) => {
        const o = (out[d][rid] = out[d][rid] || { s: {}, add: [] }); o.s = o.s || {}; o.add = o.add || []; const e = ep[rid];
        Object.keys(e.s || {}).forEach((sel) => { const a = (o.s[sel] = o.s[sel] || {}), b = e.s[sel]; Object.keys(b).forEach((k) => { if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) a[k] = Object.assign({}, a[k], b[k]); else a[k] = b[k]; }); });
        (e.add || []).forEach((x) => o.add.push(x));
      });
    });
    const g = extra.g || {}; out.g = out.g || {}; out.g.vars = Object.assign({}, out.g.vars, g.vars); ["font", "scale"].forEach((k) => { if (g[k] !== undefined && g[k] !== "") out.g[k] = g[k]; });
    return out;
  }
  /** mise en page réellement appliquée : base + scènes actives (scene : undefined = selon les dates, "" = aucune, id = celle-là) */
  function effective(lay, scene, now) {
    const sc = (lay && lay.scenes) || []; let out = clone(lay || empty()); delete out.scenes; now = now || Date.now();
    sc.forEach((x) => {
      const on = scene === undefined ? (x.on !== false && (!x.from || x.from <= now) && (!x.to || x.to >= now)) : scene === x.id;
      if (on && x.layout) out = mergeLayers(out, x.layout);
    });
    return out;
  }
  function globalCss(g) {
    if (!g) return ""; let o = "";
    const v = Object.keys(g.vars || {}).filter((k) => GVARS.includes(k) && SAFE_VAL.test(String(g.vars[k]))).map((k) => `${k}:${g.vars[k]}!important`);
    if (v.length) o += `:root{${v.join(";")}}\n`;
    if (g.font && FONTS[g.font]) o += `body,button,input,select,textarea{font-family:${FONTS[g.font]}!important}\n`;
    if (g.scale && g.scale !== 100) o += `html{font-size:${num(g.scale, 75, 135, 100)}%!important}\n`;
    return o;
  }
  function cssFor(lay) {
    let out = KEYFRAMES + globalCss(lay && lay.g);
    ["pc", "mobile"].forEach((dev) => {
      const pages = (lay && lay[dev]) || {}, rules = [], anims = [];
      Object.keys(pages).forEach((rid) => {
        if (!/^[a-z][\w-]*$/i.test(rid)) return;
        const s = (pages[rid] && pages[rid].s) || {};
        Object.keys(s).forEach((sel) => {
          if (!SAFE_SEL.test(sel)) return;
          const e = s[sel] || {}, d = [cssDecl(e.css), tfDecl(e.tf)];
          if (e.hide) d.push("display:none!important");
          if (typeof e.order === "number" && isFinite(e.order)) d.push(`order:${Math.round(e.order)}!important`);
          if (e.hv && HOVERS[e.hv]) d.push("transition:all .2s ease!important");
          const dec = d.filter(Boolean).join(";");
          if (dec) rules.push(`#${rid} ${sel}{${dec}}`);
          if (e.hv && HOVERS[e.hv]) rules.push(`#${rid} ${sel}:hover{${HOVERS[e.hv].split(";").map((x) => x + "!important").join(";")}}`);
          if (e.an && ANIMS[e.an.n]) anims.push(`#${rid} ${sel}{animation:${ANIMS[e.an.n]} ${num(e.an.d, 0.1, 20, 1)}s ease ${num(e.an.dl, 0, 20, 0)}s ${e.an.l ? "infinite" : "1"} both!important}`);
          if (e.pf && e.pp !== undefined && SAFE_SEL.test(e.pp)) rules.push(`#${rid} ${e.pp}{display:flex!important;flex-direction:column!important}`);
        });
      });
      if (rules.length) out += `@media ${MQ[dev]}{${rules.join("\n")}}\n`;
      if (anims.length) out += `@media ${MQ[dev]} and (prefers-reduced-motion:no-preference){${anims.join("\n")}}\n`;
    });
    return out;
  }

  // ---------------------------------------------------------------- blocs ajoutés, textes, attributs
  const ytId = (u) => { const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/.exec(u || ""); return m ? m[1] : ""; };
  const lines = (t) => String(t || "").split(/\n+/).map((x) => x.trim()).filter(Boolean).slice(0, 30);
  function blockEl(a) {
    const p = a.props || {}, el = document.createElement("div"), t = String(a.type).replace(/[^a-z]/g, "");
    el.className = "ed-added ed-" + t; el.dataset.edAdd = a.id; el.id = "ed-b-" + String(a.id).replace(/[^a-z0-9]/gi, "");
    const img = (src, alt) => { const u = safeUrl(src); return u ? `<img src="${esc(u)}" alt="${esc(alt || "")}" loading="lazy">` : ""; };
    const link = (href, label, cls) => { const u = safeUrl(href); return u ? `<a class="${cls || "cta-btn fill-btn"}" href="${esc(u)}"${/^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : ""}>${esc(label || "Voir")}</a>` : ""; };
    if (t === "text") el.innerHTML = `${p.title ? `<h3>${esc(p.title)}</h3>` : ""}${p.text ? `<p>${esc(p.text)}</p>` : ""}`;
    else if (t === "image") el.innerHTML = img(p.src, p.alt);
    else if (t === "button") el.innerHTML = link(p.href || "#", p.label || "Bouton");
    else if (t === "banner") el.innerHTML = `<div class="ed-banner-in"><b>${esc(p.title || "")}</b><span>${esc(p.text || "")}</span>${link(p.href, p.label)}</div>`;
    else if (t === "card") el.innerHTML = `${img(p.src, p.title)}<h3>${esc(p.title || "")}</h3><p>${esc(p.text || "")}</p>${link(p.href, p.label)}`, el.classList.add("ed-card");
    else if (t === "list") el.innerHTML = `${p.title ? `<h3>${esc(p.title)}</h3>` : ""}<ul>${lines(p.items).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    else if (t === "video") { const y = ytId(p.src), u = safeUrl(p.src); el.innerHTML = y ? `<iframe src="https://www.youtube-nocookie.com/embed/${y}" title="Vidéo" loading="lazy" allowfullscreen></iframe>` : u && /\.(mp4|webm|mov)(\?|$)/i.test(u) ? `<video src="${esc(u)}" controls playsinline preload="metadata"></video>` : ""; }
    else if (t === "countdown") { const d = Date.parse(p.to || ""); el.innerHTML = `<span>${esc(p.label || "")}</span><b data-ed-to="${isFinite(d) ? d : 0}">—</b>`; }
    else if (t === "stat") el.innerHTML = `<b>${esc(p.value || "0")}</b><span>${esc(p.label || "")}</span>`;
    else if (t === "divider") el.innerHTML = "<hr>";
    else if (t === "emoji") el.innerHTML = `<div class="big">${esc(p.emoji || "🏁")}</div>${p.text ? `<p>${esc(p.text)}</p>` : ""}`;
    else if (t === "gallery") el.innerHTML = lines(p.srcs).map((x) => img(x, "")).join("");
    else if (t === "quote") el.innerHTML = `<blockquote>${esc(p.text || "")}${p.who ? `<cite>— ${esc(p.who)}</cite>` : ""}</blockquote>`;
    else if (t === "spacer") el.style.height = Math.max(4, Math.min(400, Number(p.h) || 24)) + "px";
    el.dataset.edSig = JSON.stringify([a.type, p]);
    return el;
  }
  function tickCountdowns() {
    document.querySelectorAll("[data-ed-to]").forEach((n) => {
      const to = +n.dataset.edTo; if (!to) { n.textContent = "—"; return; }
      let d = Math.floor((to - Date.now()) / 1000); if (d <= 0) { n.textContent = "C'est parti !"; return; }
      const j = Math.floor(d / 86400); d %= 86400; const h = String(Math.floor(d / 3600)).padStart(2, "0"), m = String(Math.floor((d % 3600) / 60)).padStart(2, "0"), sec = String(d % 60).padStart(2, "0");
      n.textContent = (j ? j + " j " : "") + `${h}:${m}:${sec}`;
    });
  }
  function applyDom() {
    const dev = device(), pages = (eff && eff[dev]) || {};
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
  function recompute() {
    eff = effective(layout, sceneOpt);
    if (!styleEl) { styleEl = document.createElement("style"); styleEl.id = "ed-layout-css"; document.head.appendChild(styleEl); }
    styleEl.textContent = BLOCK_CSS + "\n" + cssFor(eff); applyDom(); tickCountdowns();
  }
  function setLayout(l, opts) {
    layout = l && typeof l === "object" ? l : empty(); if (!layout.pc) layout.pc = {}; if (!layout.mobile) layout.mobile = {};
    sceneOpt = opts && "scene" in opts ? opts.scene : undefined; recompute();
  }
  function watch() {
    if (obs) return;
    obs = new MutationObserver(() => { if (!inApply) schedule(); });
    const host = document.getElementById("page-main") || document.body;
    obs.observe(host, { childList: true, subtree: true });
    document.addEventListener("ma:route", schedule); setInterval(tickCountdowns, 1000); setInterval(() => { if (sceneOpt === undefined) recompute(); }, 60000);
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
    st.textContent = `.ed-hover{outline:2px dashed #38bdf8!important;outline-offset:1px;cursor:crosshair!important}.ed-sel{outline:3px solid #f59e0b!important;outline-offset:1px}.ed-reorder{outline:3px solid #22c55e!important;outline-offset:2px}`;
    document.head.appendChild(st);
    let hov = null, sel = null;
    const ok = (t) => t && t.nodeType === 1 && !t.closest(".ed-chrome") && pathOf(t);
    document.addEventListener("mouseover", (e) => { if (ED.mode() !== "edit") return; if (hov) hov.classList.remove("ed-hover"); hov = ok(e.target) ? e.target : null; if (hov) hov.classList.add("ed-hover"); }, true);
    document.addEventListener("click", (e) => {
      if (ED.mode() !== "edit") return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (justDragged) return;
      const t = e.target; if (!ok(t)) { ED.onPick(null); return; }
      if (sel) { sel.classList.remove("ed-sel"); sel.style.touchAction = ""; } sel = t; t.classList.add("ed-sel"); t.style.touchAction = "none"; if (hov) hov.classList.remove("ed-hover");
      ED.onPick(describe(t));
    }, true);
    ["submit", "keydown", "mousedown", "pointerdown", "touchstart"].forEach((ev) => document.addEventListener(ev, (e) => { if (ED.mode() === "edit" && ev !== "keydown") e.stopPropagation(); if (ev === "submit" && ED.mode() === "edit") e.preventDefault(); }, true));
    // ---- glisser-déposer libre (déplacer), poignée de redimensionnement, réordonner
    let handle = null, drag = null, justDragged = false;
    const mkHandle = () => { if (handle) return handle; handle = document.createElement("div"); handle.className = "ed-chrome ed-handle"; handle.style.cssText = "position:fixed;width:26px;height:26px;border-radius:50%;background:#f59e0b;border:3px solid #fff;z-index:2147483000;display:none;touch-action:none;cursor:nwse-resize;box-shadow:0 2px 8px rgba(0,0,0,.5)"; document.body.appendChild(handle); handle.addEventListener("pointerdown", (e) => { if (!sel) return; e.preventDefault(); e.stopPropagation(); const r = sel.getBoundingClientRect(); drag = { kind: "resize", x0: e.clientX, y0: e.clientY, w0: r.width, h0: r.height, moved: true }; }); return handle; };
    setInterval(() => { const h = mkHandle(); if (!sel || !sel.isConnected || ED.mode() !== "edit") { h.style.display = "none"; return; } const r = sel.getBoundingClientRect(); h.style.display = "block"; h.style.left = Math.max(0, Math.min(innerWidth - 26, r.right - 13)) + "px"; h.style.top = Math.max(0, Math.min(innerHeight - 26, r.bottom - 13)) + "px"; }, 120);
    const clearInline = () => { if (!sel) return; ["translate", "width", "height"].forEach((k) => sel.style.removeProperty(k)); };
    document.addEventListener("pointerdown", (e) => {
      if (ED.mode() !== "edit" || !sel || !sel.contains(e.target) || (handle && handle.contains(e.target))) return;
      const tf = ED.tfOf(pathOf(sel)) || {}; drag = { kind: ED.dragMode() === "reorder" ? "reorder" : "move", x0: e.clientX, y0: e.clientY, bx: tf.x || 0, by: tf.y || 0, moved: false };
    }, true);
    document.addEventListener("pointermove", (e) => {
      if (!drag || !sel) return; const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return; drag.moved = true; e.preventDefault();
      if (drag.kind === "move") sel.style.setProperty("translate", `${Math.round(drag.bx + dx)}px ${Math.round(drag.by + dy)}px`, "important");
      else if (drag.kind === "resize") { sel.style.setProperty("width", Math.max(16, Math.round(drag.w0 + dx)) + "px", "important"); sel.style.setProperty("height", Math.max(16, Math.round(drag.h0 + dy)) + "px", "important"); }
      else { document.querySelectorAll(".ed-reorder").forEach((n) => n.classList.remove("ed-reorder")); const t = sibAt(e.clientX, e.clientY); if (t) t.classList.add("ed-reorder"); }
    }, true);
    const sibAt = (x, y) => { if (!sel || !sel.parentElement) return null; const els = document.elementsFromPoint(x, y); for (const n of els) { let c = n; while (c && c.parentElement !== sel.parentElement) c = c.parentElement; if (c && c !== sel && pathOf(c)) return c; } return null; };
    document.addEventListener("pointerup", (e) => {
      if (!drag) return; const d = drag; drag = null; if (!d.moved) return; justDragged = true; setTimeout(() => { justDragged = false; }, 50);
      const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (d.kind === "move") { clearInline(); ED.drag({ type: "move", x: Math.round(d.bx + dx), y: Math.round(d.by + dy) }); }
      else if (d.kind === "resize") { const w = Math.max(16, Math.round(d.w0 + dx)), h = Math.max(16, Math.round(d.h0 + dy)); clearInline(); ED.drag({ type: "resize", w, h }); }
      else { const t = sibAt(e.clientX, e.clientY); document.querySelectorAll(".ed-reorder").forEach((n) => n.classList.remove("ed-reorder")); if (t) { const r = t.getBoundingClientRect(), after = (e.clientY - r.top) / r.height > .5 && Math.abs(e.clientY - (r.top + r.height / 2)) > Math.abs(e.clientX - (r.left + r.width / 2)) * 0 ? true : e.clientX > r.left + r.width / 2; ED.drag({ type: "reorder", target: (pathOf(t) || {}).sel, after }); } }
    }, true);
    window.__edSelect = (el) => { if (sel) { sel.classList.remove("ed-sel"); sel.style.touchAction = ""; } sel = el; if (el) { el.classList.add("ed-sel"); el.style.touchAction = "none"; } };
    ED.attach(window);
  }
  function describe(el) {
    const p = pathOf(el), cs = getComputedStyle(el), par = el.parentElement, pcs = par ? getComputedStyle(par) : null, r = el.getBoundingClientRect();
    const px = (v) => parseFloat(v) || 0, hex = (c) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c || ""); if (!m || (m[4] !== undefined && +m[4] === 0)) return ""; return "#" + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, "0")).join(""); };
    const leaf = !el.children.length && !!el.textContent.trim();
    let i = 0; for (let s = el.previousElementSibling; s; s = s.previousElementSibling) i++;
    return {
      root: p.root, sel: p.sel, tag: el.tagName.toLowerCase(), blk: (el.closest("[data-ed-add]") || {}).dataset ? el.closest("[data-ed-add]").dataset.edAdd : "", blkTop: !!el.dataset.edAdd, leaf, text: leaf ? el.textContent : "", isImg: el.tagName === "IMG", src: el.getAttribute("src") || "", href: el.getAttribute("href") || "", alt: el.getAttribute("alt") || "",
      index: i, count: par ? par.children.length : 1, parentSel: par && par !== rootOf(el) ? (pathOf(par) || {}).sel || "" : "", parentDisplay: pcs ? pcs.display : "",
      rect: { w: Math.round(r.width), h: Math.round(r.height) },
      cs: { color: hex(cs.color), bg: hex(cs.backgroundColor), fontSize: px(cs.fontSize), fontWeight: cs.fontWeight, radius: px(cs.borderTopLeftRadius), padding: px(cs.paddingTop), margin: px(cs.marginTop), opacity: cs.opacity, align: cs.textAlign, gap: px(cs.rowGap), pt: px(cs.paddingTop), pr: px(cs.paddingRight), pb: px(cs.paddingBottom), pl: px(cs.paddingLeft), mt: px(cs.marginTop), mr: px(cs.marginRight), mb: px(cs.marginBottom), ml: px(cs.marginLeft), borderW: px(cs.borderTopWidth), display: cs.display }
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
  window.MASiteLayout = { effective, FONTS, HOVERS, ANIMS, GVARS, openEditor, cssFor, setLayout, applyDom, pathOf, find, rootOf, device, empty, describe, safeUrl, CSS_OK, BREAK, INFRAME: !!INFRAME };
})();
