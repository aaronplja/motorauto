/**
 * MOTORAUTO — Studio : puces « Époque » du catalogue.
 * Elles pilotent les champs « Produite à partir de / Jusqu'en » des filtres avancés (le moteur de filtres ne change pas).
 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  /** le bandeau des marques est injecté par app.js avant la barre d'outils : on le range à droite, sous la recherche */
  function place() {
    const strip = $("brand-strip"), search = $("catalog-search-container");
    if (strip && search && strip.parentElement !== search.parentElement) search.insertAdjacentElement("afterend", strip);
  }
  function init() {
    place();
    const host = $("main-catalog-view"); if (host) new MutationObserver(place).observe(host, { childList: true, subtree: true });
    const box = $("era-chips"), from = $("adv-yfrom"), to = $("adv-yto");
    if (!box || !from || !to) return;
    const fire = (el, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
    const sync = () => {
      const f = from.value, t = to.value;
      box.querySelectorAll("[data-era]").forEach((b) => {
        const [a, z] = b.dataset.era.split("-");
        b.classList.toggle("active", (a === "0" ? "" : a) === f && z === t);
      });
    };
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-era]"); if (!b) return;
      const [a, z] = b.dataset.era.split("-"), on = b.classList.contains("active");
      fire(from, on || a === "0" ? "" : a); fire(to, on ? "" : z); sync();
    });
    [from, to].forEach((el) => el.addEventListener("input", sync));
    const reset = $("adv-reset"); if (reset) reset.addEventListener("click", () => setTimeout(sync, 0));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
