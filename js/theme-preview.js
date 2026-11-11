/**
 * MOTORAUTO — aperçu d'une ambiance avant de l'adopter.
 * Un clic sur une ambiance l'affiche sur tout le site (la fenêtre se ferme pour que tu voies le résultat) avec une barre
 * « Garder / Annuler ». Rien n'est enregistré tant que tu n'as pas confirmé. « Appliquer directement » désactive l'aperçu.
 */
(function () {
  "use strict";
  const MA = window.MA, root = document.documentElement;
  if (!MA || !MA.applyTheme) return;
  const KEY = "motorauto_theme", SKIP = "ma_theme_nopreview";
  const get = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* facultatif */ } };
  const T = (s) => (window.MAI18n && window.MAI18n.t ? window.MAI18n.t(s) : s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let bar = null, base = "", cand = "", timer = 0;

  function css() {
    if (document.getElementById("tprev-css")) return;
    const s = document.createElement("style"); s.id = "tprev-css";
    s.textContent = `#tprev{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:9400;display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 24px);padding:10px 14px;border-radius:16px;background:var(--bg-elevated);color:var(--color-ink);border:1px solid var(--accent);box-shadow:var(--shadow-pop,0 20px 50px rgba(0,0,0,.5))}
      #tprev span{font-size:.88rem}#tprev b{color:var(--accent)}#tprev button{font:inherit;font-size:.85rem;border-radius:999px;padding:7px 14px;cursor:pointer;border:1px solid var(--stroke-line);background:var(--bg-surface);color:var(--color-ink)}
      #tprev button.ok{background:var(--accent);color:var(--on-accent);border-color:transparent}#tprev a{font-size:.75rem;color:var(--color-secondary);cursor:pointer;text-decoration:underline}`;
    document.head.appendChild(s);
  }
  function stop(keep) {
    clearTimeout(timer); if (bar) { bar.remove(); bar = null; }
    if (!keep && base) MA.applyTheme(base);
    cand = "";
  }
  function start(id, label) {
    css(); if (!bar) base = root.getAttribute("data-theme") || get(KEY) || "studio-creme";
    cand = id; MA.applyTheme(id);
    if (bar) bar.remove();
    bar = document.createElement("div"); bar.id = "tprev"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", T("Aperçu de l'ambiance"));
    bar.innerHTML = `<span>👁 ${T("Aperçu")} : <b>${esc(label)}</b></span><button type="button" class="ok" data-tp="keep">${T("Garder")}</button><button type="button" data-tp="cancel">${T("Annuler")}</button><a data-tp="direct">${T("Appliquer directement à l'avenir")}</a>`;
    document.body.appendChild(bar);
    bar.addEventListener("click", (e) => {
      const a = e.target.closest("[data-tp]"); if (!a) return;
      if (a.dataset.tp === "cancel") { stop(false); return; }
      set(KEY, cand); const l = label; if (a.dataset.tp === "direct") set(SKIP, "1");
      stop(true); if (MA.toast) MA.toast("Ambiance « " + l + " » appliquée.", "ok");
    });
    timer = setTimeout(() => { if (bar) stop(false); }, 60000);     // aperçu abandonné : retour à l'ambiance d'avant
    try { const m = document.getElementById("theme-modal"); if (m && m.getAttribute("aria-hidden") === "false") { const x = document.getElementById("close-theme-modal"); if (x) x.click(); } } catch (_) { /* facultatif */ }
  }
  document.addEventListener("click", (e) => {
    const tile = e.target.closest && e.target.closest("[data-set-theme]");
    if (!tile || get(SKIP) === "1") return;
    const id = tile.dataset.setTheme; if (!id || id === (get(KEY) || "studio-creme") && !bar) return;   // déjà l'ambiance en cours
    e.preventDefault(); e.stopImmediatePropagation();
    const t = tile.querySelector(".tile-title");
    start(id, t ? t.textContent.trim() : id);
  }, true);
  window.MAThemePreview = { reset: () => { set(SKIP, "0"); } };
})();
