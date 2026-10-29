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

  function render(uid, d, self) {
    const esc = C.esc, L = G.levelOf(d.s.xp), s = d.s, col = d.col;
    const rar = { legendary: [0, 0], epic: [0, 0], rare: [0, 0], common: [0, 0] };
    C.cars.forEach((c) => { const r = window.MACards.rarityOf(c); rar[r][1]++; if ((col.owned[c.id] || 0) > 0) rar[r][0]++; });
    const dups = Object.keys(col.owned || {}).filter((k) => col.owned[k] > 1).reduce((n, k) => n + (col.owned[k] - 1), 0);
    const hp = d.cars.reduce((n, c) => n + (Number(c.power) || 0), 0), pct = Math.round(((col.count || 0) / Math.max(1, C.cars.length)) * 100);
    const name = d.u.username || (self ? C.pilotName() : "Pilote");
    document.getElementById("stats-title").textContent = name;
    document.getElementById("stats-sub").textContent = `Niveau ${L.level.n} · ${L.level.name}${d.rank ? " · n° " + d.rank + " sur " + d.ranked : ""}`;
    document.getElementById("stats-body").innerHTML = `
      <div class="stats-lvl"><div class="lvl-ring" style="--p:${L.pct}%"><b>${L.level.n}</b><small>NIV.</small></div>
        <div class="lvl-main"><h3>${esc(L.level.name)}</h3><div class="xp-bar"><i style="width:${L.pct}%"></i></div><small>${nf(s.xp)} XP${L.next ? ` · encore ${nf(L.toNext)} pour « ${esc(L.next.name)} »` : " · niveau maximum"}</small></div></div>
      ${section("Cartes à collectionner", [
        tile(col.count || 0, "cartes différentes", { text: nf(col.count || 0) + " / " + C.cars.length, sub: pct + " % de la collection", cls: "wide" }),
        tile(rar.legendary[0], "légendaires", { text: rar.legendary[0] + "/" + rar.legendary[1], cls: "rar-legendary" }),
        tile(rar.epic[0], "épiques", { text: rar.epic[0] + "/" + rar.epic[1], cls: "rar-epic" }),
        tile(rar.rare[0], "rares", { text: rar.rare[0] + "/" + rar.rare[1], cls: "rar-rare" }),
        tile(rar.common[0], "communes", { text: rar.common[0] + "/" + rar.common[1] }),
        tile(col.specials || 0, "éditions limitées", { cls: "rar-special" }),
        tile(dups, "doublons"), tile(col.trades || 0, "échanges réalisés"),
        self ? tile(col.dust || 0, "poussière ✨") : ""
      ].filter(Boolean))}
      ${section("Pilotage", [tile(s.laps, "chronos"), tile(s.records, "records"), tile(s.podiums, "podiums"), tile(s.tracks, "circuits roulés")])}
      ${section("Garage et communauté", [tile(d.cars.length, "voitures publiées", { sub: hp ? nf(hp) + " ch au total" : "" }), tile(s.comments, "commentaires"), tile(s.likes, "voitures aimées"), tile(s.events, "sorties organisées"), tile(s.rsvps, "sorties rejointes")])}
      ${section("Jeu", [tile(s.badges.length, "badges", { text: s.badges.length + " / " + G.BADGES.length }), tile(s.days, "jours de série", { sub: "record : " + s.best }), tile(col.chal || 0, "défis validés"), tile(s.entries, "photos au concours"), tile(s.wins, "concours gagnés")])}
      <p class="stats-foot"><a class="cta-btn btn-ghost compact-btn" href="${self ? "#/garage/apercu" : "#/pilote/" + encodeURIComponent(uid)}" data-close-stats>${self ? "Mes badges" : "Voir le profil"}</a></p>`;
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
