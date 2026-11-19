/**
 * MOTORAUTO — minuteries : les répétitions rapides (5 s ou moins)
 *  - se mettent en pause quand l'onglet ou l'appli est en arrière-plan ;
 *  - passent au ralenti (1 tour sur 4) quand la fenêtre est visible mais n'a plus le focus (autre fenêtre devant) ;
 *  - sont recensées : MATimers.stats() donne le nombre de répétitions actives (TECH-203), et MATimers.stopAll() les arrête (tests, démontage).
 * Rien ne s'exécute pour rien : moins de recalculs, moins de batterie. Le travail reprend au premier tour après le retour au premier plan.
 */
(function () {
  "use strict";
  const native = window.setInterval, nativeClear = window.clearInterval, live = new Map();
  window.setInterval = function (fn, ms) {
    if (typeof fn !== "function" || !(ms <= 5000)) return native.apply(window, arguments);
    const rest = Array.prototype.slice.call(arguments, 2);
    let n = 0;
    const id = native.call(window, function () {
      if (document.hidden) return;
      if (ms < 2000 && document.hasFocus && !document.hasFocus() && (++n % 4)) return;
      fn.apply(this, rest);
    }, ms);
    live.set(id, ms);
    return id;
  };
  window.clearInterval = function (id) { live.delete(id); return nativeClear.apply(window, arguments); };
  window.MATimers = {
    stats() { return { active: live.size, fast: Array.from(live.values()).filter((m) => m <= 1000).length }; },
    stopAll() { Array.from(live.keys()).forEach((id) => nativeClear(id)); live.clear(); }
  };
})();
