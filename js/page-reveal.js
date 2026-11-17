/**
 * MOTORAUTO — apparition échelonnée du contenu à chaque changement de page.
 * Au moment du changement, les blocs déjà présents reçoivent une classe (rv1 : sections, rv2 : cartes) et un délai ;
 * ce que le réseau ajoute ensuite n'est pas animé, ce qui évite tout clignotement.
 */
(function () {
  "use strict";
  const SKIP = /overlay|sheet|modal|skip-link/i;
  let lastPage = "", lastAt = 0;
  const tag = (el, cls, i, base, step) => {
    if (el.nodeType !== 1 || /^(SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName) || el.hidden || SKIP.test(el.className || "")) return false;
    el.classList.add(cls); el.style.setProperty("--rvd", (base + Math.min(i, 5) * step) + "ms"); return true;
  };
  document.addEventListener("ma:route", () => {
    const pg = document.querySelector(".page.page-on");
    if (!pg || pg.id === "page-chat") return;
    const now = Date.now();
    if (pg.id === lastPage && now - lastAt < 1500) return;       // simple changement d'onglet dans la même page : pas de nouvelle cascade
    lastPage = pg.id; lastAt = now;
    pg.querySelectorAll(".rv1, .rv2").forEach((e) => e.classList.remove("rv1", "rv2"));
    let i = 0;
    Array.prototype.forEach.call(pg.children, (c) => {
      if (!tag(c, "rv1", i, 40, 60)) return;
      i++; let j = 0;
      Array.prototype.forEach.call(c.children, (g) => { if (j < 8 && tag(g, "rv2", j, 110, 50)) j++; });
    });
  });
})();
