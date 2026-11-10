/**
 * MOTORAUTO — Studio : petits mouvements.
 *   • les gros chiffres s'animent une fois quand ils apparaissent ;
 *   • barre de lecture sur les longues fiches (bord droit de l'écran) ;
 *   • tirer une fenêtre vers le bas (téléphone) pour la fermer.
 * Aucun effet si l'utilisateur a demandé de réduire les animations.
 */
(function () {
  "use strict";
  const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nf = (n) => n.toLocaleString("fr-FR");

  // ---------- compteurs
  const SEL = ".gh-num, .sh-proof b, .sh-rec b, .pro-stat b, .stat-tile b, .sx-kpi b";
  function countUp() {
    if (calm()) return;
    document.querySelectorAll(SEL).forEach((el) => {
      if (el.dataset.cu || el.children.length) return;
      el.dataset.cu = "1";
      const m = /^\s*(\d[\d\s  ]*)\s*$/.exec(el.textContent || ""); if (!m) return;
      const to = parseInt(m[1].replace(/\D/g, ""), 10); if (!(to >= 10)) return;
      const t0 = performance.now(), dur = 750;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = nf(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); else el.textContent = nf(to); };
      requestAnimationFrame(step);
    });
  }
  setInterval(() => { if (!document.hidden) countUp(); }, 1200);

  // ---------- barre de lecture
  let bar = null;
  const longPage = () => /^#\/(voiture|pilote|actualites|news)\b/.test(location.hash);
  function onScroll(e) {
    if (!longPage()) { if (bar) bar.classList.remove("on"); return; }
    const t = e.target === document || e.target === document.documentElement || e.target === document.body ? document.scrollingElement : e.target;
    if (!t || !(t.scrollHeight > t.clientHeight + 40) || t.clientHeight < innerHeight * 0.5) return;
    if (!bar) { bar = document.createElement("div"); bar.id = "ma-read"; bar.setAttribute("aria-hidden", "true"); document.body.appendChild(bar); }
    const s = t.scrollTop / (t.scrollHeight - t.clientHeight);
    bar.style.setProperty("--s", Math.max(0, Math.min(1, s)).toFixed(3)); bar.classList.add("on");
  }
  document.addEventListener("scroll", onScroll, { capture: true, passive: true });
  window.addEventListener("hashchange", () => { if (bar) bar.classList.remove("on"); });

  // ---------- glisser vers le bas pour fermer une fenêtre
  let st = null;
  const scrolledAncestor = (el, stop) => { for (; el && el !== stop; el = el.parentElement) if (el.scrollTop > 0) return true; return false; };
  document.addEventListener("touchstart", (e) => {
    st = null; if (e.touches.length !== 1) return;
    const dlg = e.target.closest && e.target.closest(".modal-layer.active:not(.page-layer) .modal-dialog"); if (!dlg) return;
    if (e.target.closest("input, textarea, select, [contenteditable], .car-slides, .no-swipe")) return;
    if (scrolledAncestor(e.target, dlg.parentElement) || dlg.scrollTop > 0) return;
    st = { dlg, y: e.touches[0].clientY, x: e.touches[0].clientX, dy: 0, on: false };
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!st) return;
    const dy = e.touches[0].clientY - st.y, dx = e.touches[0].clientX - st.x;
    if (!st.on) { if (dy > 12 && Math.abs(dy) > Math.abs(dx) * 1.4) { st.on = true; st.dlg.classList.add("ma-drag"); } else if (dy < -8 || Math.abs(dx) > 14) { st = null; return; } else return; }
    st.dy = Math.max(0, dy); st.dlg.style.transform = "translateY(" + (st.dy * 0.7).toFixed(0) + "px)"; st.dlg.style.opacity = String(Math.max(0.4, 1 - st.dy / 500));
  }, { passive: true });
  function end() {
    if (!st) return; const s = st; st = null;
    s.dlg.classList.remove("ma-drag");
    if (s.on && s.dy > 110) {
      const btn = s.dlg.querySelector(".dialog-close-btn, [data-close]");
      s.dlg.style.transform = ""; s.dlg.style.opacity = "";
      if (btn) btn.click();
    } else { s.dlg.style.transform = ""; s.dlg.style.opacity = ""; }
  }
  document.addEventListener("touchend", end, { passive: true });
  document.addEventListener("touchcancel", end, { passive: true });
})();
