/** MOTORAUTO — bandeau des marques : défile tout seul, mais se glisse au doigt, à la souris (glisser) et à la molette. */
(function () {
  "use strict";
  const wrap = document.querySelector(".brand-marquee");
  const track = document.getElementById("brand-marquee");
  if (!wrap || !track) return;
  wrap.classList.add("is-scroller");
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPEED = 42;              // pixels par seconde
  let pos = 0, last = 0, lastUser = 0, down = false, hover = false, visible = true, moved = 0, startX = 0, startLeft = 0, dragging = false;
  const now = () => performance.now();
  const half = () => track.scrollWidth / 4;   // une « période » = le contenu répété 4 fois

  function wrapLoop() {
    const h = half();
    if (h < 50) return;
    // on garde toujours la position dans [h, 2h) : le contenu est identique à chaque période
    const sl = wrap.scrollLeft;
    if (sl >= 2 * h) wrap.scrollLeft = sl - h;
    else if (sl < h) wrap.scrollLeft = sl + h;
  }

  function frame(t) {
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    if (visible && !document.hidden) {
      // un déplacement qui ne vient pas de nous = l'utilisateur : on se resynchronise et on attend
      if (Math.abs(wrap.scrollLeft - pos) > 2.5) { pos = wrap.scrollLeft; lastUser = now(); }
      const idle = now() - lastUser > 1600 && !down && !hover && !reduced;
      if (idle && half() > 50) {
        pos += (SPEED * dt) / 1000;
        wrap.scrollLeft = pos;
      } else pos = wrap.scrollLeft;
      wrapLoop();
    }
    requestAnimationFrame(frame);
  }

  // souris : glisser-déposer
  wrap.addEventListener("pointerdown", (e) => {
    down = true; moved = 0; lastUser = now();
    if (e.pointerType === "mouse") { dragging = true; startX = e.clientX; startLeft = wrap.scrollLeft; wrap.classList.add("grabbing"); }
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    wrap.scrollLeft = startLeft - dx; lastUser = now(); wrapLoop();
  });
  const end = () => { down = false; dragging = false; wrap.classList.remove("grabbing"); lastUser = now(); };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  // après un glissé à la souris, pas de clic fantôme sur la marque
  wrap.addEventListener("click", (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  wrap.addEventListener("mouseenter", () => { hover = true; });
  wrap.addEventListener("mouseleave", () => { hover = false; lastUser = now(); });
  // molette : fait défiler le bandeau (verticale ou horizontale)
  wrap.addEventListener("wheel", (e) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    e.preventDefault();
    wrap.scrollLeft += d; lastUser = now(); wrapLoop();
  }, { passive: false });
  // clavier : flèches quand une marque a le focus
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { wrap.scrollLeft += 160; lastUser = now(); }
    if (e.key === "ArrowLeft") { wrap.scrollLeft -= 160; lastUser = now(); }
  });
  if ("IntersectionObserver" in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(wrap);
  requestAnimationFrame(frame);
})();
