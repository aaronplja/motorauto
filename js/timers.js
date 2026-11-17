/**
 * MOTORAUTO — minuteries : les répétitions rapides (5 s ou moins) se mettent en pause quand l'onglet ou l'appli est en arrière-plan.
 * Rien ne s'exécute pour rien : moins de recalculs, moins de batterie. Le travail reprend au premier tour après le retour au premier plan.
 */
(function () {
  "use strict";
  const native = window.setInterval;
  window.setInterval = function (fn, ms) {
    if (typeof fn !== "function" || !(ms <= 5000)) return native.apply(window, arguments);
    const rest = Array.prototype.slice.call(arguments, 2);
    return native.call(window, function () { if (!document.hidden) fn.apply(this, rest); }, ms);
  };
})();
