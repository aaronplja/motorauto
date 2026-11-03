/**
 * MOTORAUTO — accessibilité & fluidité : animations (Complet / Fluide / Réduit), taille du texte, contraste renforcé.
 * Réglages gardés dans le navigateur (localStorage) et appliqués dès le chargement ; panneau dans Réglages › Ambiance.
 */
(function () {
  "use strict";
  const K = "motorauto_a11y";
  const read = () => { try { return JSON.parse(localStorage.getItem(K) || "{}"); } catch (_) { return {}; } };
  const write = (v) => { try { localStorage.setItem(K, JSON.stringify(v)); } catch (_) { /* ignoré */ } };
  const auto = () => {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";
    const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
    return weak || (window.matchMedia && matchMedia("(pointer: coarse)").matches) ? "smooth" : "full";
  };
  const SIZES = { normal: 100, grand: 112.5, "tres-grand": 125 };
  function apply() {
    const p = read(), de = document.documentElement;
    de.setAttribute("data-anim", p.anim && p.anim !== "auto" ? p.anim : auto());
    de.style.fontSize = (SIZES[p.text] || 100) + "%";
    if (p.contrast) de.setAttribute("data-contrast", "high"); else de.removeAttribute("data-contrast");
  }
  apply();
  const btn = (grp, val, label, cur) => `<button type="button" data-a11y="${grp}" data-val="${val}" aria-pressed="${String(cur === val)}">${label}</button>`;
  function panel() {
    const host = document.getElementById("settings-theme"); if (!host) return;
    let card = document.getElementById("a11y-card");
    if (!card) { card = document.createElement("section"); card.id = "a11y-card"; card.className = "set-card col a11y-card"; host.appendChild(card); }
    const p = read(), anim = p.anim || "auto", text = p.text || "normal";
    card.innerHTML = `<h3>♿ Confort & fluidité</h3>
      <p class="lap-meta">Animations — « Fluide » allège le verre pendant le défilement (recommandé sur téléphone), « Réduit » supprime les animations.</p>
      <div class="a11y-row" role="group" aria-label="Animations">${btn("anim", "auto", "Auto", anim)}${btn("anim", "full", "Complet", anim)}${btn("anim", "smooth", "Fluide", anim)}${btn("anim", "reduced", "Réduit", anim)}</div>
      <p class="lap-meta" style="margin-top:.8rem">Taille du texte</p>
      <div class="a11y-row" role="group" aria-label="Taille du texte">${btn("text", "normal", "Normal", text)}${btn("text", "grand", "Grand", text)}${btn("text", "tres-grand", "Très grand", text)}</div>
      <label class="set-toggle" style="margin-top:.8rem"><span><b>Contraste renforcé</b><small>Bordures et textes plus marqués</small></span><input type="checkbox" id="a11y-contrast" ${p.contrast ? "checked" : ""}></label>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-a11y]"); if (!b) return;
    const p = read(); p[b.dataset.a11y] = b.dataset.val; write(p); apply(); panel();
  });
  document.addEventListener("change", (e) => { if (e.target.id === "a11y-contrast") { const p = read(); p.contrast = e.target.checked; write(p); apply(); } });
  window.addEventListener("hashchange", () => setTimeout(panel, 80));
  window.addEventListener("DOMContentLoaded", () => setTimeout(panel, 300));
  window.MAA11y = { apply, panel };
})();
