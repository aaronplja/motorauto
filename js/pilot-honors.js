/**
 * MOTORAUTO — distinctions publiques d'un pilote : titre et cadre équipés, meilleurs succès (bandeau du profil)
 * et collection complète de cadres / titres débloqués (onglet « Badges »). Données : cosmetics/{uid} + collections/{uid}, lisibles par tous.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  if (!G) return;
  let C = null, token = 0;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TIER = { gold: 3, silver: 2, bronze: 1, "": 0 };

  function ensure(id, anchor, where, cls) {
    let el = document.getElementById(id);
    if (!el) { const a = typeof anchor === "string" ? document.querySelector(anchor) : anchor; if (!a) return null; el = document.createElement("div"); el.id = id; el.className = cls || ""; a.insertAdjacentElement(where, el); }
    return el;
  }
  const avatarSrc = () => { const im = document.getElementById("pub-profile-avatar"); return im ? im.getAttribute("src") || "" : ""; };
  const frameTile = (id, f, on, equipped, uid) => {
    const av = avatarSrc();
    return `<div class="ph-tile ${on ? "on" : "off"}${equipped ? " eq" : ""}" title="${esc(on ? T(f.name) : T(window.MACosm.req("f", id)))}">
      <span class="ph-av cosm-f cf-${id}" style="--cf:${f.color}">${av ? `<img src="${esc(av)}" alt="" data-fallback="avatar">` : "<i></i>"}</span>
      <b>${esc(T(f.name))}</b><small>${equipped ? T("Équipé") : on ? T("Débloqué") : esc(T(window.MACosm.req("f", id)))}</small></div>`;
  };
  const titleTile = (id, t, on, equipped) => `<div class="ph-tile ph-t ${on ? "on" : "off"}${equipped ? " eq" : ""}" title="${esc(on ? T(t.name) : T(window.MACosm.req("t", id)))}">
      <span class="cosm-title ph-title">${esc(T(t.name))}</span><small>${equipped ? T("Équipé") : on ? T("Débloqué") : esc(T(window.MACosm.req("t", id)))}</small></div>`;

  async function render(uid) {
    const my = ++token, M = window.MACosm, MG = window.MAGame;
    const hero = document.getElementById("pub-honors"); if (hero) { hero.hidden = true; hero.innerHTML = ""; }
    const slot = document.getElementById("pub-cosm-slot"); if (slot) slot.innerHTML = "";
    if (!M || !MG || !C) return;
    let col = null, stats = null;
    try { await Promise.all([M.load([uid]), MG.loadAll(false)]); stats = MG.statsOf(uid); const s = await C.db.collection("collections").doc(uid).get(); col = s.exists ? s.data() : null; } catch (_) { /* partiel */ }
    if (my !== token) return;
    const eq = M.get(uid) || {}, doc = col || {};
    const fr = Object.keys(G.FRAMES).map((id) => [id, M.unlocked("f", id, uid, doc)]), ti = Object.keys(G.TITLES).map((id) => [id, M.unlocked("t", id, uid, doc)]);
    const nF = fr.filter((x) => x[1]).length, nT = ti.filter((x) => x[1]).length;
    // bandeau du profil : titre équipé, cadre équipé, meilleurs succès
    const earned = stats ? new Set(stats.badges) : new Set();
    const top = (MG.BADGES || []).filter((b) => earned.has(b.id)).sort((a, b) => (TIER[b.tier || ""] || 0) - (TIER[a.tier || ""] || 0)).slice(0, 6);
    const chips = [];
    if (eq.title && G.TITLES[eq.title]) chips.push(`<span class="ph-chip ph-chip-title">🎖 ${esc(T(G.TITLES[eq.title].name))}</span>`);
    if (eq.frame && G.FRAMES[eq.frame]) chips.push(`<span class="ph-chip" style="--cf:${G.FRAMES[eq.frame].color}"><i class="ph-dot"></i>${T("Cadre")} ${esc(T(G.FRAMES[eq.frame].name))}</span>`);
    const badgesHtml = top.map((b) => `<span class="ph-badge ${esc(b.tier || "")}" title="${esc(b.label)} — ${esc(b.desc || "")}">${b.icon}</span>`).join("");
    if (hero && (chips.length || top.length)) {
      hero.innerHTML = (chips.length ? `<div class="ph-chips">${chips.join("")}</div>` : "") +
        (top.length ? `<div class="ph-badges" aria-label="${T("Meilleurs succès")}">${badgesHtml}${earned.size > top.length ? `<button type="button" class="ph-more" data-pt-go="badges">+${earned.size - top.length}</button>` : `<button type="button" class="ph-more" data-pt-go="badges">${T("Tout voir")} ›</button>`}</div>` : "");
      hero.hidden = false;
    }
    // onglet Badges : collection de cadres et titres
    if (slot) {
      slot.innerHTML = `<div class="panel-section-title">${T("Cadres et titres")} <span class="lap-meta">${nF + nT} / ${fr.length + ti.length}</span></div>
        <h4 class="ph-h">${T("Cadres d'avatar")} <small>${nF} / ${fr.length}</small></h4>
        <div class="ph-grid">${fr.slice().sort((a, b) => b[1] - a[1]).map(([id, on]) => frameTile(id, G.FRAMES[id], on, eq.frame === id, uid)).join("")}</div>
        <h4 class="ph-h">${T("Titres")} <small>${nT} / ${ti.length}</small></h4>
        <div class="ph-grid ph-grid-t">${ti.slice().sort((a, b) => b[1] - a[1]).map(([id, on]) => titleTile(id, G.TITLES[id], on, eq.title === id)).join("")}</div>`;
      if (window.MAIcons) window.MAIcons.apply(slot);
    }
  }

  window.MAHonors = { render };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("pilot", { enter: (p) => {
      ensure("pub-honors", "#pub-profile-bio", "afterend", "ph-honors").hidden = true;
      ensure("pub-cosm-slot", "#pub-badges-slot", "afterend", "ph-cosm");
      setTimeout(() => render(p.uid), 250);
    } });
    document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-pt-go]"); if (b) { const t = document.querySelector('#pub-tabs .pro-tab[data-pt="' + b.dataset.ptGo + '"]'); if (t) { t.click(); t.scrollIntoView({ block: "center", behavior: "smooth" }); } } });
  });
})();
