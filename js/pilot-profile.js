/**
 * MOTORAUTO — profil public d'un pilote : réseaux sociaux, chiffres clés, vitrine de cartes et onglets de section.
 * Appelé par app.js (renderPublicProfile) ; toutes les données viennent de documents publics (users, collections).
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  const WEIGHT = { special: 6, shiny: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
  let token = 0;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function setTab(name) {
    const nav = $("pub-tabs"); if (!nav) return;
    nav.querySelectorAll(".pro-tab").forEach((b) => { const on = b.dataset.pt === name; b.classList.toggle("active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    document.querySelectorAll("#public-profile-modal .pro-panel").forEach((p) => { p.hidden = p.dataset.pp !== name; });
  }
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("#pub-tabs .pro-tab"); if (b) setTab(b.dataset.pt); });

  function ctx() { return window.MAApp && window.MAApp.ctx ? window.MAApp.ctx() : null; }

  async function render(uid, data) {
    const my = ++token;
    setTab("vitrine");
    const soc = $("pub-socials"); if (soc) soc.innerHTML = window.MANets ? window.MANets.html(data, esc) : "";
    if (window.MAIcons) window.MAIcons.apply($("public-profile-modal"));
    const vit = $("pub-vitrine"), sc = $("pub-stat-cards"), sl = $("pub-stat-level");
    if (sc) sc.querySelector("b").textContent = "–";
    if (sl) sl.querySelector("b").textContent = "–";
    if (vit) vit.innerHTML = `<div class="empty-note">Chargement de la vitrine…</div>`;
    const C = ctx(); if (!C || !window.MACards) { if (vit) vit.innerHTML = ""; return; }
    let col = null;
    try {
      await window.MACards.loadSpecials();
      const snap = await C.db.collection("collections").doc(uid).get();
      col = snap.exists ? snap.data() : null;
    } catch (_) { col = null; }
    if (my !== token) return;
    const owned = col && col.owned ? col.owned : {};
    const ids = Object.keys(owned).filter((k) => owned[k] > 0).map((id) => window.MACards.cardObj(id)).filter(Boolean);
    if (sc) sc.querySelector("b").textContent = String(col ? col.count || ids.length : 0);
    try {
      if (window.MAGame) { await window.MAGame.loadAll(false); const s = window.MAGame.statsOf(uid); if (sl && s) sl.querySelector("b").textContent = String(G.levelOf(s.xp).level.n); }
    } catch (_) { /* niveau indisponible */ }
    if (my !== token) return;
    if (!ids.length) { vit.innerHTML = `<div class="empty-note">Ce pilote n'a pas encore ouvert de pack.</div>`; return; }
    ids.sort((a, b) => (WEIGHT[window.MACards.rarityOf(b)] - WEIGHT[window.MACards.rarityOf(a)]) || ((b.stats && b.stats.power) || 0) - ((a.stats && a.stats.power) || 0));
    const best = ids.slice(0, 6);
    vit.innerHTML = `<div class="pro-vitrine-head"><h3 class="sec-title nomargin">Ses plus belles cartes</h3><a class="pro-link" href="#/classement/collection">Classement des collectionneurs →</a></div>
      <div class="tcg-grid pro-vitrine-grid">${best.map((c) => window.MACards.cardHtml(c, { owned: true, count: owned[c.id] })).join("")}</div>`;
    if (window.MAIcons) window.MAIcons.apply(vit);
  }
  // ---------------------------------------------------------------- classement des collectionneurs
  async function renderCollectors() {
    const box = $("collectors-rank-list"), C = ctx(); if (!box || !C) return;
    box.innerHTML = `<li class="empty-note">Chargement…</li>`;
    let docs = [], users = new Map();
    try {
      const snap = await C.db.collection("collections").orderBy("count", "desc").limit(50).get();
      docs = snap.docs.map((d) => Object.assign({ uid: d.id }, d.data())).filter((d) => (d.count || 0) > 0);
      if (window.MAGame) { const all = await window.MAGame.loadAll(false); users = all.users; }
    } catch (e) { box.innerHTML = `<li class="empty-note error">Classement indisponible.</li>`; return; }
    docs = docs.filter((d) => users.has(d.uid));
    const total = Math.max(1, (C.cars || []).length);
    box.innerHTML = docs.length ? docs.map((d, i) => {
      const u = users.get(d.uid) || {}, pct = Math.round(((d.count || 0) / total) * 100);
      return `<li><a class="rank-row" href="#/pilote/${encodeURIComponent(d.uid)}"><span class="rank-pos">${i + 1}</span>${C.avatarImg(u.avatar, "pilot-row-avatar")}<span class="rank-main"><b>${esc(u.username || "Pilote")}</b><small>${pct} % de la collection${d.specials ? " · " + d.specials + " édition" + (d.specials > 1 ? "s" : "") + " limitée" + (d.specials > 1 ? "s" : "") : ""}</small></span><span class="rank-score"><b>${d.count || 0}</b><small>cartes</small></span></a></li>`;
    }).join("") : `<li class="empty-note">Personne n'a encore de cartes : ouvre ton premier pack dans l'onglet Jouer.</li>`;
  }
  if (window.Router) window.Router.register("leaderboard", { enter(params) { if (params.tab === "collection") renderCollectors(); } });
  window.MAPilot = { render, setTab, renderCollectors };
})();
