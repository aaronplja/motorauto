/**
 * MOTORAUTO — bouton « Caractéristiques » des profils : une fiche complète d'un pilote (niveau, classement, cartes, chronos,
 * communauté, jeu). Fonctionne sur son propre garage et sur les profils des autres pilotes ; tout vient de données publiques.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, token = 0;
  const reduce = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nf = (n) => Math.round(n).toLocaleString("fr-FR");

  function tile(value, label, o) {
    o = o || {};
    return `<div class="stat-tile ${o.cls || ""}"><b data-count="${Number(value) || 0}">${o.text != null ? o.text : nf(value)}</b><span>${label}</span>${o.sub ? `<small>${o.sub}</small>` : ""}</div>`;
  }
  const section = (title, tiles) => `<section class="stats-sec"><h3>${title}</h3><div class="stats-grid">${tiles.join("")}</div></section>`;

  async function collect(uid) {
    const data = await window.MAGame.loadAll(true);
    const s = window.MAGame.statsOf(uid), u = data.users.get(uid) || {};
    const ranked = Array.from(data.map.values()).filter((x) => data.users.has(x.uid) && x.xp > 0).sort((a, b) => b.xp - a.xp);
    const rank = ranked.findIndex((x) => x.uid === uid) + 1;
    let col = { owned: {}, count: 0, specials: 0, dust: 0, trades: 0, chal: 0 };
    try { await window.MACards.loadSpecials(); const snap = await C.db.collection("collections").doc(uid).get(); if (snap.exists) col = Object.assign(col, snap.data()); } catch (_) { /* collection illisible */ }
    const cars = (window.MAApp.getCommunityCars() || []).filter((c) => c.uid === uid);
    return { s, u, rank, ranked: ranked.length, col, cars };
  }

  const ICON = {
    cards: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="12" height="17" rx="2.5"/><path d="M8 7h4M19 7v13a2 2 0 0 1-2 2H9"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M5 21V4m0 0h11l-2 4 2 4H5"/></svg>',
    car: '<svg viewBox="0 0 24 24"><path d="M4 15l1.6-5A2 2 0 0 1 7.5 8.5h9a2 2 0 0 1 1.9 1.5L20 15v3h-3v-1.5H7V18H4z"/><circle cx="8" cy="13.5" r=".7"/><circle cx="16" cy="13.5" r=".7"/></svg>',
    game: '<svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/></svg>'
  };
  const sec = (ico, title, tiles) => `<section class="stats-sec"><h3><i aria-hidden="true">${ICON[ico] || ""}</i>${title}</h3><div class="stats-grid">${tiles.filter(Boolean).join("")}</div></section>`;

  function render(uid, d, self) {
    const esc = C.esc, L = G.levelOf(d.s.xp), s = d.s, col = d.col;
    const RARS = [["mythic", "Légende"], ["shiny", "Shiny"], ["legendary", "Légendaire"], ["epic", "Épique"], ["rare", "Rare"], ["common", "Commune"]];
    const rar = {}; RARS.forEach(([k]) => { rar[k] = [0, 0]; });
    C.cars.forEach((c) => { const r = window.MACards.rarityOf(c); const row = rar[r] || (rar[r] = [0, 0]); row[1]++; if ((col.owned[c.id] || 0) > 0) row[0]++; });
    const dups = Object.keys(col.owned || {}).filter((k) => col.owned[k] > 1).reduce((n, k) => n + (col.owned[k] - 1), 0);
    const hp = d.cars.reduce((n, c) => n + (Number(c.power) || 0), 0), total = Math.max(1, C.cars.length), pct = Math.round(((col.count || 0) / total) * 100);
    const name = d.u.username || (self ? C.pilotName() : "Pilote");
    document.getElementById("stats-title").textContent = name;
    document.getElementById("stats-sub").textContent = `Niveau ${L.level.n} · ${L.level.name}${d.rank ? " · n° " + d.rank + " sur " + d.ranked : ""}`;
    const kpi = (v, l, ico) => `<div class="sx-kpi"><b data-count="${Number(v) || 0}">${nf(v)}</b><span>${l}</span></div>`;
    const earned = new Set(s.badges), top = G.BADGES.filter((b) => earned.has(b.id)).sort((a, b) => ({ gold: 0, silver: 1 }[a.tier] ?? 2) - ({ gold: 0, silver: 1 }[b.tier] ?? 2)).slice(0, 12);
    document.getElementById("stats-body").innerHTML = `
      <div class="sx-hero"><div class="lvl-ring" style="--p:${L.pct}%" data-lv-open="${s.xp}" role="button" tabindex="0" aria-label="Voir tous les niveaux"><b>${L.level.n}</b><small>NIV.</small></div>
        <div class="lvl-main"><h3>${esc(L.level.name)}</h3><div class="xp-bar"><i style="width:${L.pct}%"></i></div><small>${nf(s.xp)} XP${L.next ? ` · encore ${nf(L.toNext)} pour « ${esc(L.next.name)} »` : " · niveau maximum"}</small></div>
        ${d.rank ? `<div class="sx-rank"><b>n° ${d.rank}</b><span>sur ${d.ranked} pilotes</span></div>` : ""}</div>
      <div class="sx-kpis">${kpi(col.count || 0, "cartes")}${kpi(s.badges.length, "succès")}${kpi(s.laps, "chronos")}${kpi(s.records, "records")}</div>
      <section class="stats-sec"><h3><i aria-hidden="true">${ICON.cards}</i>Collection</h3>
        <div class="sx-coll"><div class="pv2-ring" style="--p:${pct}%"><b>${pct}%</b><small>complète</small></div>
          <div class="sx-rarlist">${RARS.map(([k, l]) => { const r = rar[k] || [0, 0], w = r[1] ? Math.round((r[0] / r[1]) * 100) : 0; return `<div class="sx-rar"><span><i class="r-${k}"></i>${l}</span><div class="sx-track"><u class="r-${k}" style="width:${w}%"></u></div><b>${r[0]}<small>/${r[1]}</small></b></div>`; }).join("")}</div></div>
        <div class="stats-grid">${[tile(col.specials || 0, "éditions limitées", { cls: "rar-special" }), tile(dups, "doublons"), tile(col.trades || 0, "échanges réalisés"), self ? tile(col.dust || 0, "cristaux") : ""].filter(Boolean).join("")}</div></section>
      ${sec("flag", "Pilotage", [tile(s.laps, "chronos"), tile(s.records, "records"), tile(s.podiums, "podiums"), tile(s.tracks, "circuits roulés")])}
      ${sec("car", "Garage et communauté", [tile(d.cars.length, "voitures publiées", { sub: hp ? nf(hp) + " ch au total" : "" }), tile(s.comments, "commentaires"), tile(s.likes, "voitures aimées"), tile(s.events, "sorties organisées"), tile(s.rsvps, "sorties rejointes")])}
      ${sec("game", "Jeu", [tile(s.badges.length, "succès", { text: s.badges.length + " / " + G.BADGES.length }), tile(s.days, "jours de série", { sub: "record : " + s.best }), tile(col.chal || 0, "défis validés"), tile(s.entries, "photos au concours"), tile(s.wins, "concours gagnés")])}
      ${top.length ? `<section class="stats-sec"><h3><i aria-hidden="true">${ICON.game}</i>Meilleurs succès</h3><div class="sx-badges">${top.map((b) => `<span class="sx-b ${b.tier}" title="${esc(b.label)} : ${esc(b.desc)}"><i aria-hidden="true">${b.icon}</i><em>${esc(b.label)}</em></span>`).join("")}</div></section>` : ""}
      <p class="stats-foot"><a class="cta-btn btn-ghost compact-btn" href="${self ? "#/succes" : "#/pilote/" + encodeURIComponent(uid)}" data-close-stats>${self ? "Mes succès" : "Voir le profil"}</a></p>`;
    if (!reduce()) countUp(document.getElementById("stats-body"));
  }
  function countUp(root) {
    root.querySelectorAll("b[data-count]").forEach((el) => {
      const target = Number(el.dataset.count), text = el.textContent;
      if (!target || /\//.test(text) || target > 100000) return;
      const t0 = performance.now(), dur = 600;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - k, 3))); el.textContent = k < 1 ? nf(v) : text; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  async function open(uid, self) {
    const modal = document.getElementById("stats-modal"); if (!modal) return;
    const my = ++token;
    document.getElementById("stats-title").textContent = "Caractéristiques"; document.getElementById("stats-sub").textContent = "";
    document.getElementById("stats-body").innerHTML = `<div class="tcg-skeleton" aria-busy="true"><i></i><i></i><i></i></div>`;
    C.openModal(modal);
    try { const d = await collect(uid); if (my === token) render(uid, d, self); }
    catch (e) { if (my === token) document.getElementById("stats-body").innerHTML = `<div class="empty-note error">Impossible de charger les caractéristiques : ${C.esc(e.message)}</div>`; }
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    document.addEventListener("click", (e) => {
      if (e.target.closest("#close-stats-modal") || e.target.closest("[data-close-stats]")) { C.closeModal(document.getElementById("stats-modal")); return; }
      const b = e.target.closest('[data-action="show-stats"]'); if (!b) return;
      if (b.dataset.self) { if (!C.user) return C.requireLogin(); open(C.user.uid, true); return; }
      const r = C.Router.current(); if (r && r.name === "pilot") open(r.params.uid, !!(C.user && C.user.uid === r.params.uid));
    });
  });
})();
