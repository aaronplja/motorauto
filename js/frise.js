/**
 * MOTORAUTO — frise chronologique (#/frise) : toutes les voitures du catalogue posées sur une règle des années,
 * filtrables par marque, pays, catégorie ou texte (un modèle = sa recherche). Chaque vignette ouvre la fiche.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, st = { brand: "", country: "", cat: "", q: "", ppy: 22 };
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const CHIP_W = 138, LANE_H = 58;

  function filtered() {
    const q = st.q.trim().toLowerCase();
    return C.cars.filter((c) => (!st.brand || G.familyOf(c.brand) === st.brand) && (!st.country || G.countryOf(c.brand) === st.country) && (!st.cat || c.category === st.cat)
      && (!q || (c.brand + " " + c.model + " " + (c.years || "")).toLowerCase().includes(q))).map((c) => ({ c, y: G.yearOf(c) })).filter((x) => x.y > 1880).sort((a, b) => a.y - b.y || (a.c.id < b.c.id ? -1 : 1));
  }
  function render() {
    const root = document.getElementById("timeline-root"); if (!root) return;
    const brands = Array.from(new Set(C.cars.map((c) => G.familyOf(c.brand)))).filter(Boolean).sort((a, b) => a.localeCompare(b, "fr"));
    const cats = Array.from(new Set(C.cars.map((c) => c.category))).filter(Boolean).sort();
    const opt = (v, cur, l) => `<option value="${C.esc(v)}" ${cur === v ? "selected" : ""}>${C.esc(l === undefined ? v : l)}</option>`;
    const items = filtered();
    const controls = `<div class="cg-tools fr-tools"><input type="search" id="fr-q" placeholder="${T("Un modèle, une marque…")}" value="${C.esc(st.q)}" aria-label="${T("Rechercher")}" autocomplete="off">
      <select id="fr-brand" aria-label="${T("Marque")}"><option value="">${T("Toutes les marques")}</option>${brands.map((b) => opt(b, st.brand)).join("")}</select>
      <select id="fr-country" aria-label="${T("Pays")}"><option value="">${T("Tous pays")}</option>${G.COUNTRIES.map((k) => opt(k.id, st.country, k.label)).join("")}</select>
      <select id="fr-cat" aria-label="${T("Catégorie")}"><option value="">${T("Toutes catégories")}</option>${cats.map((b) => opt(b, st.cat)).join("")}</select>
      <label class="fr-zoom">${T("Zoom")} <input type="range" id="fr-zoom" min="8" max="60" step="2" value="${st.ppy}" aria-label="${T("Zoom de la frise")}"></label></div>`;
    if (!items.length) { root.innerHTML = controls + `<div class="empty-note">${T("Aucune voiture pour ces critères.")}</div>`; return; }
    const y0 = Math.floor(items[0].y / 10) * 10, y1 = Math.ceil((items[items.length - 1].y + 1) / 10) * 10, W = (y1 - y0) * st.ppy + CHIP_W + 40;
    const laneEnd = []; let showImg = st.ppy >= 18 && items.length <= 220;
    const chips = items.map(({ c, y }) => {
      const x = (y - y0) * st.ppy + 20; let lane = laneEnd.findIndex((e) => e + 6 <= x); if (lane < 0) { lane = laneEnd.length; laneEnd.push(0); } laneEnd[lane] = x + CHIP_W;
      const img = showImg && C.safeUrl(c.image || "") ? `<img src="${C.esc(C.safeUrl(c.image))}" alt="" loading="lazy" decoding="async" data-fallback="car">` : `<i class="fr-dot"></i>`;
      const model = String(c.model || "").replace(/\s*\(.*$/, "");
      return { html: `<a class="fr-chip cat-${C.esc(String(c.category || "").toLowerCase().replace(/[^a-z]/g, ""))}" style="left:${x}px;top:${lane * LANE_H}px" href="#/voiture/${encodeURIComponent(c.id)}" title="${C.esc(c.brand + " " + c.model + " (" + (c.years || y) + ")")}">${img}<span><b>${C.esc(model)}</b><small>${C.esc(st.brand ? "" : c.brand + " · ")}${y}</small></span></a>` };
    });
    const H = Math.max(1, laneEnd.length) * LANE_H + 8;
    let ticks = ""; const step = st.ppy >= 30 ? 1 : st.ppy >= 14 ? 5 : 10;
    for (let y = y0; y <= y1; y += step) ticks += `<span class="fr-tick${y % 10 === 0 ? " big" : ""}" style="left:${(y - y0) * st.ppy + 20}px">${y % 10 === 0 || step === 1 ? y : ""}</span>`;
    root.innerHTML = controls + `<p class="lap-meta fr-count">${items.length} ${T(items.length > 1 ? "voitures" : "voiture")} · ${items[0].y} → ${items[items.length - 1].y}</p>
      <div class="fr-scroll" id="fr-scroll" tabindex="0" role="region" aria-label="${T("Frise chronologique")}"><div class="fr-ruler" style="width:${W}px">${ticks}</div><div class="fr-lanes" style="width:${W}px;height:${H}px">${chips.map((x) => x.html).join("")}</div></div>
      <p class="lap-meta">${T("Fais défiler horizontalement. Les vignettes sont classées par année de sortie.")}</p>`;
  }
  function bind() {
    const redo = (keepFocus) => { const pos = document.activeElement && document.activeElement.selectionStart; const id = document.activeElement && document.activeElement.id; const sc = document.getElementById("fr-scroll"), left = sc ? sc.scrollLeft : 0; render(); const s2 = document.getElementById("fr-scroll"); if (s2) s2.scrollLeft = keepFocus === "zoom" ? left : 0; if (id) { const el = document.getElementById(id); if (el) { el.focus(); if (pos != null && el.setSelectionRange && el.type === "search") try { el.setSelectionRange(pos, pos); } catch (_) { /* ignoré */ } } } };
    document.addEventListener("input", (e) => { if (e.target.id === "fr-q") { st.q = e.target.value; redo(); } else if (e.target.id === "fr-zoom") { st.ppy = Number(e.target.value) || 22; redo("zoom"); } });
    document.addEventListener("change", (e) => { const m = { "fr-brand": "brand", "fr-country": "country", "fr-cat": "cat" }[e.target.id]; if (m) { st[m] = e.target.value; redo(); } });
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("timeline", { enter: async () => { try { await ctx.catReady; } catch (_) { /* catalogue partiel */ } render(); } });
    bind();
  });
})();
