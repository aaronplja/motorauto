/* Ressenti : squelettes de chargement, tirer pour actualiser. */
(function () {
  "use strict";
  const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* ignoré */ } } };
  const coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;

  window.MAHaptic = { tap() {}, ok() {}, enabled: () => false };   // vibrations supprimées du site
  try { localStorage.removeItem("motorauto_haptic"); } catch (_) { /* ignoré */ }

  // ---- squelettes : « Chargement… » devient un squelette animé
  function skel(el) {
    if (el.dataset.skel) return;
    const t = (el.textContent || "").trim();
    if (!/^(chargement|chargement des .{0,30})(…|\.\.\.)?$/i.test(t)) return;
    el.dataset.skel = "1"; el.setAttribute("aria-busy", "true"); el.setAttribute("aria-label", "Chargement");
    el.innerHTML = '<div class="skel-wrap"><i class="skel skel-line w60"></i><i class="skel skel-block"></i><i class="skel skel-line w80"></i><i class="skel skel-line w40"></i></div>';
  }
  // observation légère : on regroupe les ajouts du DOM et on ne traite qu'une fois par image, sans parcourir de gros blocs
  let pending = [], queued = false;
  function flush() {
    queued = false; const list = pending; pending = [];
    for (const n of list) {
      if (!n.isConnected) continue;
      if (n.classList && n.classList.contains("empty-note")) { skel(n); continue; }
      if (n.childElementCount && n.childElementCount < 60) n.querySelectorAll(".empty-note").forEach(skel);
    }
  }
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.tagName !== "CANVAS" && n.tagName !== "SCRIPT") pending.push(n);
    if (pending.length && !queued) { queued = true; (window.requestIdleCallback || requestAnimationFrame)(flush); }
  }).observe(document.body || document.documentElement, { childList: true, subtree: true });

  // ---- tirer pour actualiser (mobile, en haut de page)
  if (coarse && !location.pathname.endsWith("chat.html")) {
    let y0 = 0, pull = 0, on = false, bar = null;
    const mk = () => { bar = document.createElement("div"); bar.className = "ptr"; bar.setAttribute("aria-hidden", "true"); bar.innerHTML = "<span></span>"; document.body.appendChild(bar); };
    // uniquement sur les pages de listes, jamais quand une fenêtre / le menu « Moi » / un pack est ouvert
    const LISTS = { catalog: 1, community: 1, leaderboard: 1, market: 1, clubs: 1, play: 1 };
    const blocked = () => document.body.classList.contains("me-open") || document.body.classList.contains("mm-lock") || !!document.querySelector(".modal-layer[aria-hidden=\"false\"], .modal-layer.open, .modal-layer.on, .me-layer.on, .tcg-overlay, .pk3-overlay, [class*=\"overlay\"].on");
    const okRoute = () => { try { const r = window.Router && Router.current && Router.current(); return !!(r && LISTS[r.name]); } catch (_) { return false; } };
    document.addEventListener("touchstart", (e) => { on = window.scrollY <= 0 && e.touches.length === 1 && okRoute() && !blocked() && !e.target.closest("input, textarea, select, .modal-layer, .tcg-overlay, #map, .events-map, .mobile-touch-bar, [data-no-ptr]"); y0 = e.touches[0].clientY; pull = 0; }, { passive: true });
    document.addEventListener("touchmove", (e) => {
      if (!on) return;
      pull = Math.max(0, e.touches[0].clientY - y0);
      if (window.scrollY > 0) { on = false; return; }
      if (pull > 8) { if (!bar) mk(); const p = Math.min(pull, 110); bar.style.transform = "translate(-50%," + (p * .6 - 30) + "px)"; bar.classList.toggle("ready", pull > 80); }
    }, { passive: true });
    document.addEventListener("touchend", () => {
      if (!on || !bar) { on = false; return; }
      const go = pull > 80; on = false;
      if (go) { bar.classList.add("spin"); setTimeout(() => { try { window.Router && Router.refresh(); document.dispatchEvent(new CustomEvent("ma:pull-refresh")); } catch (_) { /* ignoré */ } }, 50); setTimeout(() => { if (bar) { bar.remove(); bar = null; } }, 900); }
      else { bar.remove(); bar = null; }
    });
  }
})();
