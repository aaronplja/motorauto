/**
 * MOTORAUTO — « Réessayer » : tout message d'erreur de chargement (.empty-note.error, .form-error de liste)
 * reçoit un bouton qui rejoue le chargement de la page affichée, sans tout recharger.
 */
(function () {
  "use strict";
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  let queued = false;
  function decorate() {
    queued = false;
    document.querySelectorAll(".empty-note.error:not([data-retry-ok])").forEach((n) => {
      n.setAttribute("data-retry-ok", "1");
      const b = document.createElement("button");
      b.type = "button"; b.className = "cta-btn btn-ghost compact-btn retry-btn"; b.textContent = T("Réessayer");
      b.addEventListener("click", async () => {
        b.disabled = true; b.textContent = T("Nouvelle tentative…");
        try { const R = window.MARouter || (window.MAApp && window.MAApp.ctx && window.MAApp.ctx().Router); if (R && R.reload) await R.reload(); else location.reload(); } catch (_) { /* le chargement affichera son propre message */ }
        if (b.isConnected) { b.disabled = false; b.textContent = T("Réessayer"); }
      });
      n.appendChild(document.createElement("br")); n.appendChild(b);
    });
  }
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(decorate); } }).observe(document.body, { childList: true, subtree: true });
})();
