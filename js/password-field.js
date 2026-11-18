/**
 * MOTORAUTO — champs mot de passe : œil pour afficher / masquer + jauge de robustesse à l'inscription (UI-107).
 * S'applique à tous les <input type="password"> présents dans la page ; la jauge seulement au champ d'inscription.
 */
(function () {
  "use strict";
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const EYE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  const LEVELS = ["Trop court", "Faible", "Correct", "Solide", "Très solide"];

  function score(v) {
    if (v.length < 6) return 0;
    let s = 1;
    if (v.length >= 10) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v) && /[^\d]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v) && v.length >= 8) s++;
    return Math.min(4, Math.max(1, s - (v.length < 8 ? 1 : 0)));
  }

  function enhance(input) {
    if (input.dataset.pw) return;
    input.dataset.pw = "1";
    const wrap = document.createElement("div"); wrap.className = "pw-wrap";
    input.parentNode.insertBefore(wrap, input); wrap.appendChild(input);
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "pw-eye"; btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", T("Afficher le mot de passe")); btn.innerHTML = EYE;
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", show ? "true" : "false");
      btn.setAttribute("aria-label", T(show ? "Masquer le mot de passe" : "Afficher le mot de passe"));
      btn.innerHTML = show ? EYE_OFF : EYE;
    });
    wrap.appendChild(btn);

    if (input.autocomplete !== "new-password") return;
    const meter = document.createElement("div"); meter.className = "pw-meter"; meter.setAttribute("aria-live", "polite");
    meter.innerHTML = '<span class="pw-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="pw-label"></span>';
    wrap.parentNode.insertBefore(meter, wrap.nextSibling);
    const bars = meter.querySelectorAll("i"), label = meter.querySelector(".pw-label");
    const paint = () => {
      const v = input.value, s = v ? score(v) : -1;
      meter.hidden = s < 0; meter.dataset.level = String(Math.max(s, 0));
      bars.forEach((b, i) => b.classList.toggle("on", i < s));
      label.textContent = s < 0 ? "" : T(LEVELS[s]);
    };
    input.addEventListener("input", paint); paint();
  }

  function init() { document.querySelectorAll('input[type="password"]').forEach(enhance); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
