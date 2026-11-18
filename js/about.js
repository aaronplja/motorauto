/** MOTORAUTO — page « À propos » : chiffres du site repris de l'accueil (ADD-110). */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  function fill() {
    [["about-cars", "stat-cars"], ["about-engines", "stat-engines"], ["about-brands", "stat-brands"]].forEach(([to, from]) => {
      const a = $(to), b = $(from); if (a && b && b.textContent.trim() && b.textContent.trim() !== "0") a.textContent = b.textContent.trim();
    });
  }
  if (window.Router) window.Router.register("about", { enter: () => { fill(); setTimeout(fill, 1200); } });
})();
