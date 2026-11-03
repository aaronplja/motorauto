/**
 * MOTORAUTO — frise chronologique (#/frise) : toutes les voitures du catalogue posées sur une règle des années,
 * filtrables par marque, pays, catégorie ou texte (un modèle = sa recherche). Chaque vignette ouvre la fiche.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, st = { brand: "", country: "", cat: "", q: "", ppy: 24 };
  const ZMIN = 8, ZMAX = 60;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  function filtered() {
    const q = st.q.trim().toLowerCase();
    return C.cars.filter((c) => (!st.brand || G.familyOf(c.brand) === st.brand) && (!st.country || G.countryOf(c.brand) === st.country) && (!st.cat || c.category === st.cat)
      && (!q || (c.brand + " " + c.model + " " + (c.years || "")).toLowerCase().includes(q))).map((c) => ({ c, y: G.yearOf(c) })).filter((x) => x.y > 1880).sort((a, b) => a.y - b.y || (a.c.id < b.c.id ? -1 : 1));
  }
  /** les commandes ne sont dessinées qu'une fois : seul le corps de la frise est refait (le curseur de zoom reste en place) */
  function shell() {
    const root = document.getElementById("timeline-root"); if (!root) return;
    const brands = Array.from(new Set(C.cars.map((c) => G.familyOf(c.brand)))).filter(Boolean).sort((a, b) => a.localeCompare(b, "fr"));
    const cats = Array.from(new Set(C.cars.map((c) => c.category))).filter(Boolean).sort();
    const opt = (v, cur, l) => `<option value="${C.esc(v)}" ${cur === v ? "selected" : ""}>${C.esc(l === undefined ? v : l)}</option>`;
    root.innerHTML = `<div class="cg-tools fr-tools"><input type="search" id="fr-q" placeholder="${T("Un modèle, une marque…")}" value="${C.esc(st.q)}" aria-label="${T("Rechercher")}" autocomplete="off">
      <select id="fr-brand" aria-label="${T("Marque")}"><option value="">${T("Toutes les marques")}</option>${brands.map((b) => opt(b, st.brand)).join("")}</select>
      <select id="fr-country" aria-label="${T("Pays")}"><option value="">${T("Tous pays")}</option>${G.COUNTRIES.map((k) => opt(k.id, st.country, k.label)).join("")}</select>
      <select id="fr-cat" aria-label="${T("Catégorie")}"><option value="">${T("Toutes catégories")}</option>${cats.map((b) => opt(b, st.cat)).join("")}</select>
      <label class="fr-zoom">${T("Zoom")} <input type="range" id="fr-zoom" min="${ZMIN}" max="${ZMAX}" step="2" value="${st.ppy}" aria-label="${T("Zoom de la frise")}"></label></div><div id="fr-body"></div>`;
    body();
  }
  function body(keepLeft) {
    const host = document.getElementById("fr-body"); if (!host) return;
    const items = filtered();
    if (!items.length) { host.innerHTML = `<div class="empty-note">${T("Aucune voiture pour ces critères.")}</div>`; return; }
    const ppy = st.ppy, compact = ppy < 18, W_CHIP = compact ? 14 : ppy >= 34 ? 150 : 128, LANE = compact ? 18 : 58;
    const y0 = Math.floor(items[0].y / 10) * 10, y1 = Math.ceil((items[items.length - 1].y + 1) / 10) * 10, W = (y1 - y0) * ppy + W_CHIP + 40;
    const laneEnd = [], showImg = !compact && items.length <= 160, parts = [];
    for (const { c, y } of items) {
      const x = Math.round((y - y0) * ppy + 20); let lane = 0; while (lane < laneEnd.length && laneEnd[lane] + 4 > x) lane++;
      if (lane === laneEnd.length) laneEnd.push(0); laneEnd[lane] = x + W_CHIP;
      const cat = C.esc(String(c.category || "").toLowerCase().replace(/[^a-z]/g, "")), href = `#/voiture/${encodeURIComponent(c.id)}`, ttl = C.esc(c.brand + " " + c.model + " (" + (c.years || y) + ")");
      if (compact) { parts.push(`<a class="fr-chip fr-mini cat-${cat}" style="left:${x}px;top:${lane * LANE}px" href="${href}" title="${ttl}" aria-label="${ttl}"></a>`); continue; }
      const img = showImg && C.safeUrl(c.image || "") ? `<img src="${C.esc(C.safeUrl(c.image))}" alt="" loading="lazy" decoding="async" data-fallback="car">` : `<i class="fr-dot"></i>`;
      const model = String(c.model || "").replace(/\s*\(.*$/, "");
      parts.push(`<a class="fr-chip cat-${cat}" style="left:${x}px;top:${lane * LANE}px;width:${W_CHIP}px" href="${href}" title="${ttl}">${img}<span><b>${C.esc(model)}</b><small>${C.esc(st.brand ? "" : c.brand + " · ")}${y}</small></span></a>`);
    }
    const H = Math.max(1, laneEnd.length) * LANE + 8, step = ppy >= 30 ? 1 : ppy >= 14 ? 5 : 10;
    let ticks = ""; for (let y = y0; y <= y1; y += step) ticks += `<span class="fr-tick${y % 10 === 0 ? " big" : ""}" style="left:${(y - y0) * ppy + 20}px">${y % 10 === 0 || step === 1 ? y : ""}</span>`;
    const old = document.getElementById("fr-scroll"), left = keepLeft && old ? old.scrollLeft : 0;
    host.innerHTML = `<p class="lap-meta fr-count">${items.length} ${T(items.length > 1 ? "voitures" : "voiture")} · ${items[0].y} → ${items[items.length - 1].y}</p>
      <div class="fr-scroll" id="fr-scroll" tabindex="0" role="region" aria-label="${T("Frise chronologique")}"><div class="fr-ruler" style="width:${W}px">${ticks}</div><div class="fr-lanes" style="width:${W}px;height:${H}px">${parts.join("")}</div></div>
      <p class="lap-meta">${T("Fais défiler horizontalement. Les vignettes sont classées par année de sortie.")}</p>`;
    if (keepLeft) { const s = document.getElementById("fr-scroll"); if (s) s.scrollLeft = left; }
  }
  let timer = 0;
  const later = (keepLeft) => { clearTimeout(timer); timer = setTimeout(() => body(keepLeft), 140); };
  function bind() {
    document.addEventListener("input", (e) => {
      if (e.target.id === "fr-q") { st.q = e.target.value; later(false); }
      else if (e.target.id === "fr-zoom") { st.ppy = Math.min(ZMAX, Math.max(ZMIN, Number(e.target.value) || 22)); later(true); }
    });
    document.addEventListener("change", (e) => { const m = { "fr-brand": "brand", "fr-country": "country", "fr-cat": "cat" }[e.target.id]; if (m) { st[m] = e.target.value; clearTimeout(timer); body(false); } });
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("timeline", { enter: async () => { try { await ctx.catReady; } catch (_) { /* catalogue partiel */ } shell(); } });
    bind();
  });
})();
