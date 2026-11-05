/**
 * MOTORAUTO — bouton flottant « Pack du jour » : visible sur les pages (sauf l'accueil, qui a déjà le gros bouton)
 * tant que le pack gratuit du jour n'a pas été ouvert. Il ne touche pas aux barres du site.
 */
(function () {
  "use strict";
  let C = null, btn = null;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const icon = () => (window.MAEmoji ? window.MAEmoji.html("🎁") : "🎁");
  function show(on) {
    if (!on) { if (btn) btn.hidden = true; return; }
    if (!btn) { btn = document.createElement("a"); btn.id = "fab-pack"; btn.className = "fab-pack"; btn.href = "#/jouer/boutique"; btn.setAttribute("aria-label", T("Ouvrir mon pack du jour")); btn.innerHTML = icon() + "<span>" + T("Pack du jour") + "</span>"; document.body.appendChild(btn); }
    btn.hidden = false;
  }
  function tick() {
    const h = location.hash;
    const skip = !C || !C.user || h === "" || h === "#" || h === "#/" || /^#\/jouer\/(boutique|cartes)/.test(h) || document.body.classList.contains("modal-open");
    if (skip || !window.MACards || !window.MAGame) return show(false);
    const doc = window.MACards.mine(); if (!doc) return show(false);
    show(doc.lastPack !== window.MAGame.day());
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) { C = ctx; setInterval(tick, 1500); window.addEventListener("hashchange", () => setTimeout(tick, 50)); });
})();
