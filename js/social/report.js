/**
 * MOTORAUTO — signalement simple : une petite fenêtre avec 4 motifs à toucher (plus de saisie libre).
 *   MAReport.ask(titre) → Promise<"scam"|"illegal"|"spam"|"other"|null>
 */
(function () {
  "use strict";
  const REASONS = [["scam", "🎭", "Arnaque / faux"], ["illegal", "⛔", "Illégal / dangereux"], ["spam", "📢", "Spam / publicité"], ["other", "💬", "Autre raison"]];
  function ask(title) {
    return new Promise((resolve) => {
      const o = document.createElement("div"); o.id = "report-sheet"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Signaler");
      const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      o.innerHTML = `<div class="rp-box"><b>Signaler ${esc(title || "ce contenu")}</b><p>Pourquoi ? La modération regardera rapidement.</p>${REASONS.map(([k, i, l]) => `<button type="button" data-r="${k}"><span>${i}</span>${l}</button>`).join("")}<button type="button" class="rp-cancel" data-r="">Annuler</button></div>`;
      const done = (v) => { o.classList.remove("on"); setTimeout(() => o.remove(), 200); document.removeEventListener("keydown", key); resolve(v || null); };
      const key = (e) => { if (e.key === "Escape") done(null); };
      o.addEventListener("click", (e) => { if (e.target === o) done(null); const b = e.target.closest("[data-r]"); if (b) done(b.dataset.r); });
      document.addEventListener("keydown", key); document.body.appendChild(o); requestAnimationFrame(() => o.classList.add("on"));
    });
  }
  window.MAReport = { ask, REASONS };
})();
