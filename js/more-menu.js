/**
 * MOTORAUTO — menu « Plus » : une page garde son bouton principal visible, les actions secondaires ajoutées par les modules
 * (Progression, Ma carte pilote, Survie, Mes erreurs, Proposer…) sont rangées dans un menu (feuille du bas sur téléphone).
 * Les boutons sont seulement DÉPLACÉS : leurs écouteurs et leurs modules d'origine ne changent pas.
 */
(function () {
  "use strict";
  const T = (s) => (window.MAI18n && window.MAI18n.t ? window.MAI18n.t(s) : s);
  // où chercher, où mettre le menu, quels boutons y ranger
  const CONFIG = [
    { id: "collection", root: "cards-root", host: 'section[aria-label="Collection"] > header.cg-bh', items: ["[data-cplus]", "[data-pcard]"], before: ".cg-bh > .cg-sub, .cg-bh > :last-child" },
    { id: "quiz", root: "quizgame-root", host: ".qz-tabs:not(.small)", items: ["[data-qzp]"], tab: true }
  ];
  let cur = null;

  function close(focus) {
    if (!cur) return;
    cur.pop.hidden = true; cur.btn.setAttribute("aria-expanded", "false");
    if (cur.back) cur.back.remove();
    // le menu revient dans son conteneur (il en sort à l'ouverture pour échapper aux filtres/flous des cartes parentes)
    if (cur.wrap && cur.wrap.isConnected) cur.wrap.appendChild(cur.pop); else cur.pop.remove();
    const b = cur.btn; cur = null;
    if (focus) { try { b.focus({ preventScroll: true }); } catch (_) { /* ignoré */ } }
  }
  function place(btn, pop) {
    if (window.matchMedia("(max-width: 720px)").matches) { pop.style.top = ""; pop.style.left = ""; return; }
    const r = btn.getBoundingClientRect(), w = Math.min(pop.offsetWidth || 260, innerWidth - 16);
    pop.style.top = Math.min(r.bottom + 6, innerHeight - pop.offsetHeight - 8) + "px";
    pop.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + "px";
  }
  function toggle(mm) {
    if (cur && cur.pop === mm.pop) { close(true); return; }
    close();
    const back = document.createElement("div"); back.className = "ui-more-back"; document.body.appendChild(back);
    back.addEventListener("click", () => close(true));
    document.body.appendChild(mm.pop);
    mm.pop.hidden = false; mm.btn.setAttribute("aria-expanded", "true"); place(mm.btn, mm.pop);
    cur = { pop: mm.pop, btn: mm.btn, wrap: mm.wrap, back };
    const first = mm.pop.querySelector("button, a, [tabindex]"); if (first) { try { first.focus({ preventScroll: true }); } catch (_) { /* ignoré */ } }
  }
  function make(cfg) {
    const wrap = document.createElement("span"); wrap.className = "ui-more"; wrap.dataset.moreMenu = cfg.id;
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "ui-more-btn"; btn.setAttribute("aria-haspopup", "menu"); btn.setAttribute("aria-expanded", "false");
    btn.textContent = "⋯ " + T("Plus");
    const pop = document.createElement("div"); pop.className = "ui-more-pop"; pop.setAttribute("role", "menu"); pop.hidden = true;
    // marqueur invisible : les modules vérifient « mon bouton existe-t-il ? » dans la page ; tant que le menu est ouvert (déplacé dans <body>), ce marqueur leur évite de recréer leurs boutons en double
    const ph = document.createElement("i"); ph.className = "ui-more-ph"; ph.hidden = true; ph.setAttribute("aria-hidden", "true");
    cfg.items.forEach((sel) => { const m = /^\[([\w-]+)\]$/.exec(sel); if (m) ph.setAttribute(m[1], "1"); });
    wrap.append(btn, pop, ph);
    const mm = { wrap, btn, pop }; btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggle(mm); });
    pop.addEventListener("click", (e) => { if (e.target.closest("button, a")) setTimeout(() => close(), 0); });
    return mm;
  }
  function adopt(cfg) {
    const root = document.getElementById(cfg.root); if (!root) return;
    const host = root.querySelector(cfg.host); if (!host) return;
    let wrap = host.querySelector(":scope > .ui-more");
    const els = cfg.items.reduce((a, s) => a.concat(Array.from(root.querySelectorAll(s))), []).filter((e) => !e.classList.contains("ui-more-ph") && !(e.closest && e.closest(".ui-more-pop")));
    if (!els.length) return;
    let mm;
    if (wrap) mm = { wrap, btn: wrap.querySelector(".ui-more-btn"), pop: wrap.querySelector(".ui-more-pop") || (cur && cur.wrap === wrap ? cur.pop : null) };
    if (mm) { if (!mm.pop) return; }
    else { mm = make(cfg); host.appendChild(mm.wrap); }
    els.forEach((e) => { e.classList.remove("cg-recycle"); e.setAttribute("role", "menuitem"); mm.pop.appendChild(e); });
  }
  const run = () => CONFIG.forEach(adopt);

  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && cur) { e.stopPropagation(); close(true); } }, true);
  window.addEventListener("hashchange", () => close());
  window.addEventListener("resize", () => { if (cur) place(cur.btn, cur.pop); });
  window.addEventListener("scroll", () => { if (cur && !window.matchMedia("(max-width: 720px)").matches) close(); }, { passive: true });

  (window.MAModules = window.MAModules || []).push(function () {
    let q = 0;
    const watch = (id) => { const r = document.getElementById(id); if (!r || r.__mmWatched) return; r.__mmWatched = true; new MutationObserver(() => { if (q) return; q = requestAnimationFrame(() => { q = 0; run(); }); }).observe(r, { childList: true, subtree: true }); };
    const arm = () => { CONFIG.forEach((c) => watch(c.root)); run(); };
    arm(); document.addEventListener("ma:route", () => setTimeout(arm, 0)); setTimeout(arm, 1200);
  });
  window.MAMore = { adopt, close };
})();
