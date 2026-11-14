/**
 * MOTORAUTO — barre du bas « dock » (mobile) + barre du haut qui se masque + teinte clair/sombre.
 *  - le dock est un verre flottant, toujours centré ; une bulle de verre suit l'onglet actif (ressort + étirement) ;
 *  - on peut glisser le doigt d'un onglet à l'autre : la bulle suit le doigt, l'onglet se valide au relâchement ;
 *  - en descendant, le dock se réduit (zoom depuis le centre-bas) ; en remontant, au toucher ou en changeant de page, il regonfle avec un ressort ;
 *  - un seul écouteur de défilement (rAF) pilote le dock ET la barre du haut, avec hystérésis pour éviter tout tremblement.
 * Le style vit dans css/dock.css : on n'anime que transform / opacity.
 */
(function () {
  "use strict";
  const de = document.documentElement;

  // ---- teinte du thème (sombre / clair) + couleur de la barre d'état
  function tone() {
    const c = (getComputedStyle(de).getPropertyValue("--bg-core") || "").trim();
    const m = /^#?([0-9a-f]{6})$/i.exec(c); if (!m) return;
    const v = parseInt(m[1], 16), ch = [v >> 16, (v >> 8) & 255, v & 255].map((x) => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
    de.setAttribute("data-tone", .2126 * ch[0] + .7152 * ch[1] + .0722 * ch[2] < .25 ? "dark" : "light");
    const mt = document.querySelector('meta[name="theme-color"]'); if (mt) mt.setAttribute("content", "#" + m[1]);
  }
  tone();
  new MutationObserver(() => requestAnimationFrame(tone)).observe(de, { attributes: true, attributeFilter: ["data-theme", "style"] });

  // ---- dock
  const bar = document.getElementById("mobile-touch-bar");
  let dock = null, bubble = null, drag = null, swallow = false, lastIdx = -1, movingT = 0;
  const items = () => (dock ? Array.from(dock.querySelectorAll(".touch-bar-item")) : []);
  const buzz = () => { try { if (window.MAHaptic) window.MAHaptic.tap(); } catch (_) { /* ignoré */ } };
  const activeIndex = () => { const i = items().findIndex((x) => x.classList.contains("active")); return i < 0 ? 0 : i; };
  function place(i, stretch) {
    bubble.style.setProperty("--i", String(i));
    if (stretch && i !== lastIdx) { bubble.classList.remove("go"); void bubble.offsetWidth; bubble.classList.add("go"); }
    lastIdx = i;
  }
  const sync = () => place(activeIndex(), true);
  function pulse(ms) { if (!dock) return; dock.classList.add("moving"); clearTimeout(movingT); movingT = setTimeout(() => dock.classList.remove("moving"), ms || 520); }

  let compact = false, hold = 0;
  function setCompact(on) {
    if (!dock || on === compact) return; compact = on; pulse(on ? 460 : 580);
    dock.classList.toggle("compact", on);
  }

  if (bar) {
    dock = document.createElement("div"); dock.className = "dock";
    bubble = document.createElement("span"); bubble.className = "glass-bubble"; bubble.setAttribute("aria-hidden", "true"); bubble.innerHTML = "<i></i>";
    dock.appendChild(bubble);
    Array.from(bar.children).forEach((c) => { if (c !== dock) dock.appendChild(c); });
    bar.appendChild(dock);
    requestAnimationFrame(sync); setTimeout(sync, 400);
    // l'onglet actif est posé par le routeur : on suit ses changements de classe
    new MutationObserver(() => { if (!drag) sync(); }).observe(dock, { subtree: true, attributes: true, attributeFilter: ["class"] });

    const indexAt = (x) => { const r = dock.getBoundingClientRect(), n = items().length, i = Math.floor(((x - r.left) / r.width) * n); return Math.max(0, Math.min(n - 1, i)); };
    dock.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (compact) { setCompact(false); hold = Date.now() + 900; }      // un appui rouvre le dock, l'onglet touché fonctionne normalement
      drag = { x: e.clientX, id: e.pointerId, moved: false, idx: indexAt(e.clientX) };
    });
    dock.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x) > 8) { drag.moved = true; dock.classList.add("dragging"); try { dock.setPointerCapture(e.pointerId); } catch (_) { /* ignoré */ } }
      if (!drag.moved) return;
      const i = indexAt(e.clientX);
      if (i !== drag.idx) { drag.idx = i; buzz(); items().forEach((it, k) => it.classList.toggle("peek", k === i)); }
      place(i, false);
    });
    const end = (e) => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const d = drag; drag = null; dock.classList.remove("dragging"); items().forEach((it) => it.classList.remove("peek"));
      if (d.moved) {
        const it = items()[d.idx]; swallow = true; setTimeout(() => { swallow = false; }, 400);
        if (it && !it.classList.contains("active")) it.click(); else sync();
      }
    };
    dock.addEventListener("pointerup", end); dock.addEventListener("pointercancel", end);
    dock.addEventListener("click", (e) => { if (swallow && e.isTrusted) { e.preventDefault(); e.stopPropagation(); } }, true);
    const expand = () => { hold = Date.now() + 700; setCompact(false); setTimeout(sync, 60); };
    window.addEventListener("hashchange", expand); window.addEventListener("popstate", expand);
  }

  // ---- barre du haut : se cache en descendant, revient en remontant
  const head = document.querySelector(".app-header");
  let headHidden = false;
  function setHead(hide) {
    if (!head || hide === headHidden) return; headHidden = hide;
    head.classList.toggle("hide-up", hide); de.classList.toggle("hdr-hidden", hide);
  }
  if (head) {
    head.addEventListener("focusin", () => setHead(false));
    const setH = () => de.style.setProperty("--hdr-h", head.offsetHeight + "px");
    setH(); if (window.ResizeObserver) new ResizeObserver(setH).observe(head);
  }

  // ---- un seul écouteur de défilement, avec hystérésis (distance cumulée dans un sens) pour que rien ne tremble
  let lastY = Math.max(0, window.scrollY), acc = 0, dir = 0, raf = 0, scTimer = 0, isScrolling = false;
  // la classe « is-scrolling » est posée sur les 4 barres concernées et non sur <html> : poser une classe sur la racine
  // faisait recalculer les styles de toute la page à chaque début/fin de défilement (mesuré : ~2× plus de saccades sur les longues listes).
  const setScrolling = (on) => {
    isScrolling = on;
    document.querySelectorAll(".app-header, #mobile-touch-bar .dock, .page-tabs, .toolbar-cluster").forEach((el) => el.classList.toggle("is-scrolling", on));
  };
  window.addEventListener("scroll", () => {
    if (!isScrolling) setScrolling(true);
    clearTimeout(scTimer); scTimer = setTimeout(() => setScrolling(false), 160);
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const y = Math.max(0, window.scrollY), dy = y - lastY; lastY = y;
      if (!dy || Date.now() < hold) return;
      const d = dy > 0 ? 1 : -1; if (d !== dir) { dir = d; acc = 0; } acc += dy;
      const menuOpen = !!document.querySelector(".modal-layer.active, .notif-panel:not([hidden])");
      if (y < 60) { setCompact(false); setHead(false); }
      else if (dir > 0) { if (acc > 40 && y > 110) setCompact(true); if (acc > 48 && y > 140 && !menuOpen) setHead(true); }
      else { if (acc < -16) setCompact(false); if (acc < -10) setHead(false); }
    });
  }, { passive: true });
})();
