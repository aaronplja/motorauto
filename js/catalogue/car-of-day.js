/**
 * MOTORAUTO — « Voiture du jour » : une fiche mise en avant sur l'accueil, la même pour tout le monde.
 * Tirage automatique (jamais la même voiture à moins de 60 jours d'écart), avec possibilité pour l'admin de forcer une fiche
 * (site_settings/carOfDay → { days: { "AAAA-MM-JJ": "id-de-la-voiture" } }). Rappel facultatif, par pilote, dans l'appli.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, forced = null, perms = [];
  const GAP = 60, DAY = 86400000, KEY = "ma_cod_notif";
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const dayNum = (key) => Math.floor(Date.parse(key + "T00:00:00Z") / DAY);
  const keyOfNum = (n) => new Date(n * DAY).toISOString().slice(0, 10);
  function rngOf(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  /** ordre du cycle n : mélange déterministe, sans que les GAP premières voitures aient figuré dans les GAP dernières du cycle précédent */
  function permOf(ids, n) {
    while (perms.length <= n) {
      const c = perms.length, r = rngOf(c + 7), a = ids.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      if (c > 0) {
        const bad = new Set(perms[c - 1].slice(-GAP));
        for (let i = 0; i < GAP; i++) if (bad.has(a[i])) { let j = GAP; while (j < a.length && bad.has(a[j])) j++; if (j < a.length) { const t = a[i]; a[i] = a[j]; a[j] = t; } }
      }
      perms.push(a);
    }
    return perms[n];
  }
  function pickFor(key) {
    if (forced && forced[key] && C.carsById.get(forced[key])) return C.carsById.get(forced[key]);
    const ids = (C.cars || []).filter((c) => c.image || (c.images && c.images.length) || true).map((c) => c.id).sort(); if (!ids.length) return null;
    const n = dayNum(key), L = ids.length;
    return C.carsById.get(permOf(ids, Math.floor(n / L))[n % L]) || null;
  }
  async function loadForced() {
    try { const s = await C.db.collection("site_settings").doc("carOfDay").get(); forced = s.exists && s.data().days ? s.data().days : {}; } catch (_) { forced = {}; }
  }
  const nameOf = (c) => { const b = String(c.brand || ""), m = String(c.model || ""); return [b && m.toLowerCase().startsWith(b.toLowerCase() + " ") ? "" : b, m].filter(Boolean).join(" ").replace(/\s*\(.*$/, ""); };
  async function paint() {
    if (!C || !C.cars || !C.cars.length) return;
    const host = document.querySelector("#page-home .hero-stage"); if (!host) return;
    if (forced === null) await loadForced();
    let box = document.getElementById("cod-home");
    if (!box) { box = document.createElement("section"); box.id = "cod-home"; box.className = "cod"; box.setAttribute("aria-label", T("Voiture du jour")); host.insertAdjacentElement("afterend", box); }
    const today = G.dayKey(), car = pickFor(today); if (!car) return;
    const img = C.safeUrl(car.image || (car.images && car.images[0])) || "";
    const power = (car.stats && car.stats.power) || 0, zero = car.stats && car.stats.zero, speed = car.stats && car.stats.speed;
    const past = [1, 2, 3, 4, 5].map((i) => pickFor(keyOfNum(dayNum(today) - i))).filter(Boolean);
    let on = false; try { on = localStorage.getItem(KEY) === "1"; } catch (_) { /* ignoré */ }
    box.innerHTML = `<a class="cod-card" href="#/voiture/${encodeURIComponent(car.id)}">${img ? `<img src="${C.esc(img)}" alt="" loading="lazy" data-fallback="car">` : `<span class="cod-ph"></span>`}
        <span class="cod-txt"><small>${T("Voiture du jour")}</small><b>${C.esc(nameOf(car))}</b><em>${C.esc(String(car.years || ""))}${car.category ? " · " + C.esc(car.category) : ""}</em>
        <span class="cod-k">${power ? `<i>${power} ch</i>` : ""}${zero ? `<i>0-100 : ${zero} s</i>` : ""}${speed ? `<i>${speed} km/h</i>` : ""}</span></span></a>
      <div class="cod-foot"><label class="cod-notif"><input type="checkbox" id="cod-notif"${on ? " checked" : ""}> ${T("Me rappeler chaque jour dans l'appli")}</label>
        <details><summary>${T("Les jours précédents")}</summary><ul>${past.map((c, i) => `<li><span>${T(i === 0 ? "Hier" : "Il y a " + (i + 1) + " jours")}</span><a href="#/voiture/${encodeURIComponent(c.id)}">${C.esc(nameOf(c))}</a></li>`).join("")}</ul></details></div>`;
    if (on) remind(car, today);
  }
  function remind(car, today) {
    try { if (localStorage.getItem("ma_cod_seen") === today) return; localStorage.setItem("ma_cod_seen", today); } catch (_) { return; }
    C.toast("Voiture du jour : " + nameOf(car), "ok");
  }
  // ------------------------------------------------------------------ administration : forcer une fiche pour un jour donné
  async function adminMount(ctx) {
    C = C || ctx; const anchor = document.getElementById("feat-plan"); if (!anchor) return;
    if (forced === null) await loadForced();
    let box = document.getElementById("cod-admin");
    if (!box) { box = document.createElement("div"); box.id = "cod-admin"; anchor.insertAdjacentElement("afterend", box); }
    const esc = C.esc, label = (c) => [String(c.model || "").toLowerCase().startsWith(String(c.brand || "").toLowerCase() + " ") ? "" : c.brand, c.model].filter(Boolean).join(" ");
    const rows = Array.from({ length: 7 }, (_, i) => { const k = keyOfNum(dayNum(G.dayKey()) + i), f = forced[k] && C.carsById.get(forced[k]), auto = pickFor(k);
      return `<div class="feat-row"><div class="feat-wk"><b>${i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : k}</b><small>${esc(k)} · auto : ${esc(auto ? nameOf(auto) : "—")}</small></div>
        <input type="text" list="cod-cars" data-cod-day="${esc(k)}" placeholder="Automatique" value="${f ? esc(label(f)) : ""}" autocomplete="off" aria-label="Voiture du jour ${esc(k)}"><button type="button" class="cta-btn btn-ghost compact-btn" data-cod-save="${esc(k)}">Enregistrer</button></div>`; }).join("");
    box.innerHTML = `<div class="admin-sec-head"><h3 class="admin-h3 nomargin">Voiture du jour</h3></div><p class="admin-note">Tirage automatique (jamais deux fois la même voiture à moins de 60 jours). Choisis une fiche pour forcer un jour précis ; laisse vide pour revenir au tirage.</p>
      <datalist id="cod-cars">${(C.cars || []).map((c) => `<option value="${esc(label(c))}"></option>`).join("")}</datalist>${rows}`;
  }
  async function saveDay(k) {
    const input = document.querySelector(`[data-cod-day="${k}"]`); if (!input) return;
    const v = input.value.trim().toLowerCase(), car = v ? (C.cars || []).find((c) => [c.brand, c.model].filter(Boolean).join(" ").toLowerCase() === v) : null;
    if (v && !car) { C.toast("Choisis une voiture dans la liste proposée.", "err"); return; }
    const days = Object.assign({}, forced || {}); if (car) days[k] = car.id; else delete days[k];
    const keep = Object.keys(days).sort().slice(-60), out = {}; keep.forEach((x) => { out[x] = days[x]; });
    try { await C.db.collection("site_settings").doc("carOfDay").set({ days: out }); forced = out; C.toast(car ? "Voiture du jour enregistrée." : "Retour au tirage automatique.", "ok"); paint(); }
    catch (e) { C.toast("Enregistrement impossible : " + e.message, "err"); }
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.Router.register("home", { enter: () => setTimeout(paint, 200) });
    setTimeout(paint, 1200);
    document.addEventListener("change", (e) => { if (e.target.id === "cod-notif") { try { localStorage.setItem(KEY, e.target.checked ? "1" : "0"); } catch (_) { /* ignoré */ } if (e.target.checked) C.toast("Rappel activé.", "ok"); } });
    document.addEventListener("click", (e) => { const s = e.target.closest("[data-cod-save]"); if (s) saveDay(s.dataset.codSave); });
  });
  window.MACarOfDay = { adminMount, pickFor, today: () => pickFor(G.dayKey()) };
})();
