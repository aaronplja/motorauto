/**
 * MOTORAUTO — fiche voiture : on fait glisser le doigt à gauche / à droite pour passer d'un onglet à l'autre
 * (Aperçu · Moteurs · Circuit · Photos). Les barres défilantes (motorisations, galeries) et les champs ne déclenchent rien.
 */
(function () {
  "use strict";
  let x0 = 0, y0 = 0, t0 = 0, ok = false;
  const body = () => document.querySelector("#vehicle-detail-content .sheet-core-body.sheet-tabbed");
  const blocked = (el) => !!(el && el.closest && el.closest(".phases-strip,.sheet-tabs,input,textarea,select,.community-gallery,.slides,.gallery-track,[data-no-swipe],.table-wrap,.stats-table"));
  function go(dir) {
    const b = body(); if (!b) return;
    const btns = Array.from(b.querySelectorAll("[data-sheet-tab]")); if (btns.length < 2) return;
    const i = btns.findIndex((x) => x.getAttribute("aria-selected") === "true"), n = i + dir;
    if (n < 0 || n >= btns.length) return;
    b.dataset.dir = dir > 0 ? "next" : "prev"; btns[n].click();
    try { btns[n].scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); } catch (_) { /* ignoré */ }
  }
  document.addEventListener("touchstart", (e) => {
    const b = body(); ok = !!(b && b.contains(e.target)) && !blocked(e.target) && e.touches.length === 1;
    if (ok) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); }
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (!ok) return; ok = false; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if (Date.now() - t0 > 700 || Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    go(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (!body() || /input|textarea|select/i.test((e.target || {}).tagName || "")) return;
    if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1);
  });
})();
