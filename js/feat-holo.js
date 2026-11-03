/**
 * MOTORAUTO — effet hologramme des cartes rares (légendaire, shiny, légende, édition limitée).
 * Le reflet suit le pointeur sur ordinateur et l'inclinaison du téléphone (gyroscope) sur mobile.
 * Aucune carte n'est modifiée : un calque décoratif (pointer-events: none) est ajouté après coup.
 */
(function () {
  "use strict";
  const SEL = ".tcg.tcg-legendary, .tcg.tcg-shiny, .tcg.tcg-mythic, .tcg.tcg-special";
  const reduce = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  let gyro = false, asked = false;

  function decorate(scope) {
    (scope.querySelectorAll ? scope.querySelectorAll(SEL) : []).forEach((c) => {
      if (c.querySelector(":scope > .tcg-holo")) return;
      const h = document.createElement("i"); h.className = "tcg-holo"; h.setAttribute("aria-hidden", "true"); c.appendChild(h);
    });
    if (scope.matches && scope.matches(SEL) && !scope.querySelector(":scope > .tcg-holo")) { const h = document.createElement("i"); h.className = "tcg-holo"; h.setAttribute("aria-hidden", "true"); scope.appendChild(h); }
  }
  let queued = false;
  new MutationObserver((muts) => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; muts.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) decorate(n); })); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  decorate(document);

  // pointeur : le reflet suit le doigt / la souris au-dessus d'une carte
  document.addEventListener("pointermove", (e) => {
    if (gyro || reduce()) return;
    const c = e.target.closest && e.target.closest(SEL); if (!c) return;
    const r = c.getBoundingClientRect(); if (!r.width) return;
    c.style.setProperty("--hx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
    c.style.setProperty("--hy", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
  }, { passive: true });
  document.addEventListener("pointerleave", () => {}, { passive: true });

  // gyroscope : inclinaison du téléphone (iOS demande l'autorisation après un toucher)
  function onTilt(e) {
    if (e.gamma == null || e.beta == null) return;
    gyro = true;
    const x = Math.max(0, Math.min(100, 50 + (e.gamma / 45) * 50)), y = Math.max(0, Math.min(100, 50 + ((e.beta - 45) / 45) * 50));
    root.style.setProperty("--tilt-x", x.toFixed(1) + "%"); root.style.setProperty("--tilt-y", y.toFixed(1) + "%");
    root.classList.add("has-tilt");
  }
  function startTilt() {
    if (asked || reduce() || !("DeviceOrientationEvent" in window)) return;
    asked = true;
    const D = window.DeviceOrientationEvent;
    if (typeof D.requestPermission === "function") D.requestPermission().then((r) => { if (r === "granted") window.addEventListener("deviceorientation", onTilt); }).catch(() => {});
    else window.addEventListener("deviceorientation", onTilt);
  }
  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) document.addEventListener("pointerdown", () => { if (document.querySelector(SEL)) startTilt(); }, { once: false, passive: true });
})();
