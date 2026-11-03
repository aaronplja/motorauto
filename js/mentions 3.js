/**
 * MOTORAUTO — mentions de voitures : écrire #bmw-m3-e46 dans un message, un commentaire ou une bio crée un lien vers la fiche,
 * avec une mini-carte au survol. En tapant « # » dans un champ de saisie, une liste de suggestions s'affiche.
 * Fonctionne sur le site et dans le chat (index léger des voitures : js/car-index.js, généré par scripts/sync-functions.js).
 */
(function () {
  "use strict";
  const IDX = window.MA_CAR_INDEX || [];
  if (!IDX.length) return;
  const byId = new Map(IDX.map((r) => [r[0].toLowerCase(), r]));
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const onChat = /chat\.html/i.test(location.pathname);
  const href = (id) => (onChat ? "index.html" : "") + "#/voiture/" + encodeURIComponent(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TOKEN = /(^|[\s(\[>.,;:!?])#([a-z0-9][a-z0-9._-]{2,80})/gi;
  const SELECTORS = ".bubble .txt, .cmt-body > div:last-child, #pub-profile-bio, .feed-text, .ev-desc, .event-desc, .cc-desc, .listing-desc, .thread-text";

  // ------------------------------------------------------------------ transformation du texte affiché
  function linkNode(rec) {
    const a = document.createElement("a");
    a.className = "car-mention"; a.href = href(rec[0]); a.dataset.carMention = rec[0];
    a.textContent = "#" + rec[1];
    return a;
  }
  function processText(node) {
    const text = node.nodeValue; if (text.indexOf("#") < 0) return;
    TOKEN.lastIndex = 0;
    let m, last = 0, frag = null;
    while ((m = TOKEN.exec(text))) {
      let id = m[2].replace(/[.,;:!?-]+$/, ""), rec = byId.get(id.toLowerCase());
      if (!rec) continue;
      const start = m.index + m[1].length;
      frag = frag || document.createDocumentFragment();
      frag.appendChild(document.createTextNode(text.slice(last, start)));
      frag.appendChild(linkNode(rec));
      last = start + 1 + id.length;
      TOKEN.lastIndex = last;
    }
    if (!frag) return;
    frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  function processElement(el) {
    if (el.dataset && el.dataset.mnt === "1") return;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.indexOf("#") >= 0 && !n.parentNode.closest("a,button,code,script,style,textarea") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    const list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(processText);
    if (el.dataset) el.dataset.mnt = "1";
  }
  let queue = new Set(), raf = 0;
  function flush() {
    raf = 0; const q = queue; queue = new Set();
    q.forEach((el) => { if (el.isConnected) processElement(el); });
  }
  function enqueue(el) { queue.add(el); if (!raf) raf = requestAnimationFrame(flush); }
  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches(SELECTORS)) enqueue(root);
    root.querySelectorAll && root.querySelectorAll(SELECTORS).forEach(enqueue);
    const p = root.closest && root.closest(SELECTORS); if (p) { delete p.dataset.mnt; enqueue(p); }
  }
  new MutationObserver((muts) => { muts.forEach((m) => { m.addedNodes.forEach(scan); if (m.type === "characterData" && m.target.parentElement) scan(m.target.parentElement); }); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", () => scan(document.body));
  if (document.body) scan(document.body);

  // ------------------------------------------------------------------ mini-carte au survol
  let peek = null, peekFor = "";
  function carInfo(id) {
    const rec = byId.get(id.toLowerCase()); if (!rec) return null;
    let img = "";
    try { const c = window.MAApp && window.MAApp.ctx().carsById.get(rec[0]); if (c && c.image) img = window.MAApp.ctx().safeUrl(c.image) || ""; } catch (_) { /* pas de photo */ }
    return { id: rec[0], name: rec[1], years: rec[2], img };
  }
  function showPeek(a) {
    const info = carInfo(a.dataset.carMention); if (!info) return;
    if (!peek) { peek = document.createElement("div"); peek.className = "car-peek"; peek.setAttribute("role", "tooltip"); document.body.appendChild(peek); }
    peekFor = info.id;
    peek.innerHTML = `${info.img ? `<img src="${esc(info.img)}" alt="" loading="lazy">` : ""}<div><b>${esc(info.name)}</b><small>${esc(info.years)}</small><em>${esc(T("Voir la fiche"))}</em></div>`;
    peek.hidden = false;
    const r = a.getBoundingClientRect(), pw = Math.min(300, window.innerWidth - 16);
    peek.style.width = pw + "px";
    peek.style.left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left)) + "px";
    const below = r.bottom + 8 + 90 < window.innerHeight;
    peek.style.top = below ? r.bottom + 8 + "px" : "auto"; peek.style.bottom = below ? "auto" : window.innerHeight - r.top + 8 + "px";
  }
  const hidePeek = () => { if (peek) peek.hidden = true; peekFor = ""; };
  document.addEventListener("mouseover", (e) => { const a = e.target.closest && e.target.closest("a.car-mention"); if (a) showPeek(a); else if (peekFor && !e.target.closest(".car-peek")) hidePeek(); });
  document.addEventListener("focusin", (e) => { const a = e.target.closest && e.target.closest("a.car-mention"); if (a) showPeek(a); });
  document.addEventListener("focusout", hidePeek);
  window.addEventListener("scroll", hidePeek, { passive: true });

  // ------------------------------------------------------------------ complétion automatique dans les champs de saisie
  const FIELD = "#chat-input-message, .cmt-form input[type=text], #settings-bio, #ev-desc, #mc-desc, #mc-mods, #settings-mods, [data-mention-ok]";
  let pop = null, ac = { el: null, start: 0, items: [], sel: 0 };
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const search = IDX.map((r) => ({ r, k: norm(r[1] + " " + r[0]) }));
  function suggest(q) {
    const parts = norm(q).split(/[\s._-]+/).filter(Boolean); if (!parts.length) return [];
    return search.filter((x) => parts.every((p) => x.k.indexOf(p) >= 0)).sort((a, b) => a.r[0].length - b.r[0].length).slice(0, 6).map((x) => x.r);
  }
  function closePop() { if (pop) pop.hidden = true; ac.items = []; }
  function drawPop() {
    if (!pop) { pop = document.createElement("div"); pop.className = "mention-pop"; pop.setAttribute("role", "listbox"); document.body.appendChild(pop); pop.addEventListener("mousedown", (e) => { const b = e.target.closest("[data-m-id]"); if (!b) return; e.preventDefault(); choose(b.dataset.mId); }); }
    if (!ac.items.length) { pop.hidden = true; return; }
    pop.innerHTML = ac.items.map((r, i) => `<button type="button" role="option" class="${i === ac.sel ? "on" : ""}" data-m-id="${esc(r[0])}" aria-selected="${i === ac.sel}"><b>${esc(r[1])}</b><small>#${esc(r[0])}</small></button>`).join("");
    pop.hidden = false;
    const r = ac.el.getBoundingClientRect(), w = Math.min(380, window.innerWidth - 16);
    pop.style.width = w + "px"; pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + "px";
    const room = window.innerHeight - r.bottom;
    if (room > 230) { pop.style.top = r.bottom + 4 + "px"; pop.style.bottom = "auto"; } else { pop.style.bottom = window.innerHeight - r.top + 4 + "px"; pop.style.top = "auto"; }
  }
  function choose(id) {
    const el = ac.el; if (!el) return;
    const val = el.value, caret = el.selectionStart, after = val.slice(caret);
    el.value = val.slice(0, ac.start) + "#" + id + " " + after.replace(/^[\w.-]*/, "");
    const pos = ac.start + id.length + 2; el.setSelectionRange(pos, pos);
    el.dispatchEvent(new Event("input", { bubbles: true })); closePop(); el.focus();
  }
  document.addEventListener("input", (e) => {
    const el = e.target; if (!el.matches || !el.matches(FIELD)) return;
    const caret = el.selectionStart, before = el.value.slice(0, caret), m = /(^|[\s(])#([\w.-]{1,40})$/.exec(before);
    if (!m) { closePop(); return; }
    ac = { el, start: caret - m[2].length - 1, items: suggest(m[2]), sel: 0 };
    drawPop();
  });
  document.addEventListener("keydown", (e) => {
    if (!pop || pop.hidden || !ac.items.length) return;
    if (e.key === "ArrowDown") { ac.sel = (ac.sel + 1) % ac.items.length; drawPop(); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === "ArrowUp") { ac.sel = (ac.sel + ac.items.length - 1) % ac.items.length; drawPop(); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === "Enter" || e.key === "Tab") { choose(ac.items[ac.sel][0]); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === "Escape") { closePop(); e.stopPropagation(); }
  }, true);
  document.addEventListener("click", (e) => { if (!e.target.closest(".mention-pop")) closePop(); });

  window.MAMention = { html: (escaped) => String(escaped).replace(TOKEN, (m, pre, id) => { const rec = byId.get(id.toLowerCase()); return rec ? `${pre}<a class="car-mention" href="${href(rec[0])}" data-car-mention="${esc(rec[0])}">#${esc(rec[1])}</a>` : m; }) };
})();
