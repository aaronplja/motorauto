/* Ambiances de saison (Halloween, Noël, Nouvel an) : ornements par-dessus le thème de chacun.
   Activables / désactivables par l'admin (site_settings/seasons) et par chaque pilote. */
(function () {
  "use strict";
  const T = window.MATheme;
  if (!T) return;
  const root = document.documentElement;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* ignoré */ } } };
  const OFF = "motorauto_season_off", ECO = "motorauto_eco";
  const state = { flags: { halloween: true, noel: true, nouvelan: true }, raf: 0, canvas: null, parts: [] };

  const reduced = () => (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || store.get(ECO) === "1";
  const bgNow = () => T.hex2rgb((getComputedStyle(root).getPropertyValue("--bg-core") || "").trim()) || [9, 9, 11];

  function active() {
    if (store.get(OFF) === "1") return null;
    const k = T.seasonNow();
    return k && state.flags[k] !== false ? k : null;
  }

  function stopParticles() {
    cancelAnimationFrame(state.raf); state.raf = 0;
    if (state.canvas) { state.canvas.remove(); state.canvas = null; }
  }

  function startParticles(k) {
    stopParticles();
    if (reduced() || document.hidden) return;
    const s = T.SEASONS[k], bg = bgNow();
    const cols = [T.ensure(T.hex2rgb(s.color), bg, 3), T.ensure(T.hex2rgb(s.color2), bg, 3)].map((c) => T.rgb2hex(c));
    const cv = document.createElement("canvas");
    cv.className = "season-fx"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv); state.canvas = cv;
    const ctx = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    const fit = () => { w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit(); addEventListener("resize", fit);
    const N = Math.min(26, Math.round(w / 45));
    const mk = (init) => ({ x: Math.random() * w, y: init ? Math.random() * h : -10, r: 1.5 + Math.random() * 2.6, v: .25 + Math.random() * .7, dx: (Math.random() - .5) * .4, c: cols[Math.random() < .6 ? 0 : 1], ph: Math.random() * 6 });
    state.parts = Array.from({ length: N }, () => mk(true));
    (function loop(t) {
      if (!state.canvas) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of state.parts) {
        p.y += p.v; p.x += p.dx + Math.sin(t / 1400 + p.ph) * .25;
        if (p.y > h + 10) Object.assign(p, mk(false));
        ctx.globalAlpha = .55; ctx.fillStyle = p.c;
        ctx.beginPath();
        if (k === "halloween") ctx.arc(p.x, p.y, p.r * .8, 0, 6.3);       // lucioles
        else if (k === "nouvelan") { ctx.rect(p.x, p.y, p.r * 1.6, p.r * .8); } // confettis
        else ctx.arc(p.x, p.y, p.r, 0, 6.3);                               // flocons
        ctx.fill();
      }
      state.raf = requestAnimationFrame(loop);
    })(0);
  }

  function apply() {
    const k = active();
    if (!k) { root.removeAttribute("data-season"); root.style.removeProperty("--season"); root.style.removeProperty("--season-2"); stopParticles(); return; }
    const s = T.SEASONS[k], bg = bgNow();
    root.setAttribute("data-season", k);
    root.style.setProperty("--season", T.rgb2hex(T.ensure(T.hex2rgb(s.color), bg, 3)));
    root.style.setProperty("--season-2", T.rgb2hex(T.ensure(T.hex2rgb(s.color2), bg, 3)));
    startParticles(k);
  }

  // un changement de thème change le fond : recalcul des couleurs de saison
  new MutationObserver(() => apply()).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopParticles(); else apply(); });

  // réglage global (admin) lu en direct
  function watch() {
    const fb = window.MAFB;
    if (!fb || !fb.db) return;
    try {
      fb.db.collection("site_settings").doc("seasons").onSnapshot((d) => {
        if (d.exists) Object.assign(state.flags, d.data());
        apply(); renderPanel();
      }, () => { /* lecture refusée / hors ligne : valeurs par défaut */ });
    } catch (_) { /* ignoré */ }
  }

  // ---- panneau de réglage dans la fenêtre « ambiances »
  let isAdmin = false;
  function renderPanel() {
    const box = document.getElementById("season-box");
    if (!box) return;
    const k = T.seasonNow(), name = k ? T.SEASONS[k].label : "aucune en ce moment";
    const adminRows = isAdmin ? `<div class="season-admin"><small>Visible par tous les pilotes (admin)</small>${Object.keys(T.SEASONS).map((id) =>
      `<label class="sw"><input type="checkbox" data-season-flag="${id}" ${state.flags[id] !== false ? "checked" : ""}><span>${T.SEASONS[id].label}</span></label>`).join("")}</div>` : "";
    box.innerHTML = `<div class="theme-family-title">✨ Ambiance de saison</div>
      <p class="ct-note">Saison actuelle : <b>${name}</b>. Un liseré et de petites particules s'ajoutent à ton thème, sans changer tes couleurs.</p>
      <label class="sw"><input type="checkbox" id="season-on" ${store.get(OFF) === "1" ? "" : "checked"}><span>Afficher les ambiances de saison</span></label>
      <label class="sw"><input type="checkbox" id="eco-on" ${store.get(ECO) === "1" ? "checked" : ""}><span>Mode économie (sans animations de fond)</span></label>${adminRows}`;
  }
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "season-on") { store.set(OFF, t.checked ? "0" : "1"); apply(); }
    else if (t.id === "eco-on") { store.set(ECO, t.checked ? "1" : "0"); root.classList.toggle("eco", t.checked); apply(); }
    else if (t.dataset && t.dataset.seasonFlag && isAdmin) {
      state.flags[t.dataset.seasonFlag] = t.checked;
      try { MAFB.db.collection("site_settings").doc("seasons").set({ [t.dataset.seasonFlag]: t.checked }, { merge: true }); } catch (_) { /* ignoré */ }
      apply();
    }
  });

  function mountPanel() {
    const ct = document.getElementById("ct-box");
    if (!ct || document.getElementById("season-box")) return;
    const box = document.createElement("section"); box.id = "season-box"; box.className = "ct-box";
    ct.after(box); renderPanel();
  }
  root.classList.toggle("eco", store.get(ECO) === "1");

  function boot() {
    mountPanel(); apply(); watch();
    const fb = window.MAFB;
    if (fb && fb.auth && window.MA && MA.checkAdmin) fb.auth.onAuthStateChanged(async (u) => { isAdmin = u ? await MA.checkAdmin(u).catch(() => false) : false; renderPanel(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
