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
    const buzz = () => { try { if (window.MAHaptic) window.MAHaptic.tap(); } catch (_) { /* ignoré */ } };

  function activeIndex() { const i = items().findIndex((x) => x.classList.contains("active")); return i < 0 ? 0 : i; }
  // la bulle se place par colonne (en % de sa propre largeur) : elle suit la barre quand celle-ci change de taille, sans mesure en pixels
  function place(i) { bubble.style.setProperty("--i", String(i)); }
  function sync() { place(activeIndex()); }

  // teinte du thème (sombre / clair) : le verre est plus discret sur fond sombre
  function tone() {
    const c = (getComputedStyle(document.documentElement).getPropertyValue("--bg-core") || "").trim();
    const m = /^#?([0-9a-f]{6})$/i.exec(c); if (!m) return;
    const v = parseInt(m[1], 16), ch = [v >> 16, (v >> 8) & 255, v & 255].map((x) => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
    document.documentElement.setAttribute("data-tone", .2126 * ch[0] + .7152 * ch[1] + .0722 * ch[2] < .25 ? "dark" : "light");
  }
  tone();
  new MutationObserver(() => requestAnimationFrame(tone)).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });

  // l'onglet actif est posé par le routeur : on suit ses changements de classe
  new MutationObserver(() => { if (!drag) sync(); }).observe(bar, { subtree: true, attributes: true, attributeFilter: ["class"] });
  requestAnimationFrame(sync);
  setTimeout(sync, 400);

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
    place(i);
    items().forEach((it, k) => it.classList.toggle("peek", k === i));
  });
  const end = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag; drag = null; bar.classList.remove("dragging");
    items().forEach((it) => it.classList.remove("peek"));
    if (d.moved) {
      const it = items()[d.idx]; swallow = true; setTimeout(() => { swallow = false; }, 400);
      if (it && !it.classList.contains("active")) it.click(); else sync();
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
    });
  }, { passive: true });
  bar.addEventListener("click", () => { if (bar.classList.contains("mini")) bar.classList.remove("mini"); }, true);
})();
