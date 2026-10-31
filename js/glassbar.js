/**
 * MOTORAUTO — barre du bas mobile « verre liquide » (iOS 26/27).
 *  - capsule flottante en verre dépoli ; une bulle de verre suit l'onglet actif et s'étire quand elle se déplace ;
 *  - on peut glisser le doigt d'un onglet à l'autre : la bulle suit le doigt, l'onglet se valide au relâchement ;
 *  - pendant le défilement vers le bas, la barre se réduit en petite capsule d'icônes ; elle se rouvre au retour ou au toucher.
 */
(function () {
  "use strict";
  const bar = document.getElementById("mobile-touch-bar");
  if (!bar) return;
  const items = () => Array.from(bar.querySelectorAll(".touch-bar-item"));
  const bubble = document.createElement("span");
  bubble.className = "glass-bubble"; bubble.setAttribute("aria-hidden", "true");
  bar.prepend(bubble);
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const buzz = () => { try { if (window.MAHaptic) window.MAHaptic.tap(); } catch (_) { /* ignoré */ } };

  function activeIndex() { const i = items().findIndex((x) => x.classList.contains("active")); return i < 0 ? 0 : i; }
  function place(i, stretch) {
    const it = items()[i]; if (!it) return;
    bubble.style.setProperty("--bx", it.offsetLeft + "px"); bubble.style.setProperty("--bw", it.offsetWidth + "px");
    if (stretch && !reduce) { bubble.classList.add("moving"); clearTimeout(place.t); place.t = setTimeout(() => bubble.classList.remove("moving"), 320); }
  }
  let lastIdx = -1;
  function sync(stretch) { const i = activeIndex(); place(i, stretch && i !== lastIdx); lastIdx = i; }

  // l'onglet actif est posé par le routeur : on suit ses changements de classe
  new MutationObserver(() => { if (!drag) sync(true); }).observe(bar, { subtree: true, attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", () => sync(false));
  window.addEventListener("orientationchange", () => setTimeout(() => sync(false), 250));
  requestAnimationFrame(() => sync(false));
  setTimeout(() => sync(false), 400);

  // ---- glisser entre les onglets
  let drag = null;
  const indexAt = (x) => { const r = bar.getBoundingClientRect(), n = items().length, i = Math.floor(((x - r.left) / r.width) * n); return Math.max(0, Math.min(n - 1, i)); };
  bar.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag = { x: e.clientX, id: e.pointerId, moved: false, idx: indexAt(e.clientX) };
    bar.classList.remove("mini");
  });
  bar.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.abs(e.clientX - drag.x) > 8) { drag.moved = true; bar.classList.add("dragging"); try { bar.setPointerCapture(e.pointerId); } catch (_) { /* ignoré */ } }
    if (!drag.moved) return;
    const i = indexAt(e.clientX);
    if (i !== drag.idx) { drag.idx = i; buzz(); }
    place(i, true);
    items().forEach((it, k) => it.classList.toggle("peek", k === i));
  });
  const end = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag; drag = null; bar.classList.remove("dragging");
    items().forEach((it) => it.classList.remove("peek"));
    if (d.moved) {
      const it = items()[d.idx]; swallow = true; setTimeout(() => { swallow = false; }, 400);
      if (it && !it.classList.contains("active")) it.click(); else sync(false);
    }
  };
  let swallow = false;
  bar.addEventListener("pointerup", end); bar.addEventListener("pointercancel", end);
  bar.addEventListener("click", (e) => { if (swallow && e.isTrusted) { e.preventDefault(); e.stopPropagation(); } }, true);

  // ---- réduction pendant le défilement
  let lastY = window.scrollY, ticking = false, idle = 0;
  window.addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY, dy = y - lastY;
      if (Math.abs(dy) > 6) { bar.classList.toggle("mini", dy > 0 && y > 120); lastY = y; }
      if (y < 60) bar.classList.remove("mini");
      clearTimeout(idle); idle = setTimeout(() => { if (window.scrollY < 120) bar.classList.remove("mini"); }, 600);
      setTimeout(() => sync(false), 330);
    });
  }, { passive: true });
  bar.addEventListener("click", () => { if (bar.classList.contains("mini")) bar.classList.remove("mini"); }, true);
})();
