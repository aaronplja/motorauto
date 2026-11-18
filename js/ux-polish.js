/**
 * MOTORAUTO — finitions d'usage (UX-109) :
 *  - changement de page annoncé aux lecteurs d'écran (zone « polie » invisible) ;
 *  (« Réessayer » sur les erreurs de chargement : js/retry.js ; forme unique des états vides : css/system.css.)
 */
(function () {
  "use strict";
  // ---- annonce de changement de page (lecteurs d'écran)
  let live = null, last = "";
  function announce(msg) {
    if (!msg || msg === last) return;
    last = msg;
    if (!live) { live = document.createElement("div"); live.id = "ma-live"; live.className = "sr-only"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite"); live.setAttribute("aria-atomic", "true"); document.body.appendChild(live); }
    live.textContent = ""; setTimeout(() => { live.textContent = msg; }, 60);
  }
  document.addEventListener("ma:route", () => setTimeout(() => announce(document.title.replace(/\s*\|\s*MOTORAUTO\s*$/, "")), 400));

})();
