/* MOTORAUTO — chat : teinte clair/sombre du verre, hauteur de l'en-tête flottant, couleur de la barre iPhone */
(function () {
  "use strict";
  function tone() {
    const c = (getComputedStyle(document.documentElement).getPropertyValue("--bg-core") || "").trim();
    const m = /^#?([0-9a-f]{6})$/i.exec(c); if (!m) return;
    const v = parseInt(m[1], 16), ch = [v >> 16, (v >> 8) & 255, v & 255].map((x) => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
    document.documentElement.setAttribute("data-tone", .2126 * ch[0] + .7152 * ch[1] + .0722 * ch[2] < .25 ? "dark" : "light");
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", "#" + m[1]);
  }
  tone();
  new MutationObserver(() => requestAnimationFrame(tone)).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });
  const head = document.querySelector(".conv-head");
  if (head && window.ResizeObserver) new ResizeObserver(() => document.documentElement.style.setProperty("--head-h", head.offsetHeight + "px")).observe(head);
})();
