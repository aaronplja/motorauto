/**
 * MOTORAUTO — profil public d'un pilote : réseaux sociaux, chiffres clés, vitrine de cartes et onglets de section.
 * Appelé par app.js (renderPublicProfile) ; toutes les données viennent de documents publics (users, collections).
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  const WEIGHT = { mine: 0, mythic: 7, special: 6, shiny: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
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
    { const pr = $("pub-presence"); if (pr) { pr.hidden = true; if (window.MAPresence) window.MAPresence.get(uid).then((v) => { if (my !== token || !v) return; pr.textContent = v.text; pr.className = "presence-line" + (v.online ? " on" : ""); pr.hidden = false; }); } }
    const soc = $("pub-socials"); if (soc) soc.innerHTML = window.MANets ? window.MANets.html(data, esc) : "";
    if (window.MAIcons) window.MAIcons.apply($("public-profile-modal"));
    const vit = $("pub-vitrine"), sc = $("pub-stat-cards"), sl = $("pub-stat-level"), lc = $("pub-level-card");
    if (lc) { lc.hidden = true; lc.innerHTML = ""; }
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
      if (window.MAGame) {
        const all = await window.MAGame.loadAll(false), s = window.MAGame.statsOf(uid);
        if (sl && s) sl.querySelector("b").textContent = String(G.levelOf(s.xp).level.n);
        if (lc && s) {
          const L = G.levelOf(s.xp), nf = (n) => Math.round(n).toLocaleString("fr-FR");
          const ranked = Array.from(all.map.values()).filter((x) => all.users.has(x.uid) && x.xp > 0).sort((a, b) => b.xp - a.xp);
          const rank = ranked.findIndex((x) => x.uid === uid) + 1;
          lc.innerHTML = `<div class="lvl-ring" style="--p:${L.pct}%" data-lv-open="${s.xp}" role="button" tabindex="0" aria-label="Voir tous les niveaux"><b>${L.level.n}</b><small>NIV.</small></div>
            <div class="pv2-lv-main"><h3>${esc(L.level.name)}</h3><div class="xp-bar"><i style="width:${L.pct}%"></i></div>
              <small>${nf(s.xp)} XP${L.next ? " · encore " + nf(L.toNext) + " pour « " + esc(L.next.name) + " »" : " · niveau maximum"}</small></div>
            <ul class="pv2-facts"><li><b>${rank ? "n° " + rank : "–"}</b><span>classement</span></li><li><b>${s.badges.length}</b><span>succès</span></li><li><b>${nf(s.laps)}</b><span>chronos</span></li><li><b>${nf(s.records)}</b><span>records</span></li></ul>`;
          lc.hidden = false;
          { const st = $("pub-profile-subtitle"); if (st) st.textContent = L.level.name; }
        }
      }
    } catch (_) { /* niveau indisponible */ }
    if (my !== token) return;
    if (!ids.length) { vit.innerHTML = `<div class="empty-note">Ce pilote n'a pas encore ouvert de pack.</div>`; return; }
    ids.sort((a, b) => (WEIGHT[window.MACards.rarityOf(b)] - WEIGHT[window.MACards.rarityOf(a)]) || ((b.stats && b.stats.power) || 0) - ((a.stats && a.stats.power) || 0));
    const best = ids.slice(0, 6);
    const RAR = [["mythic", "Légende"], ["special", "Édition limitée"], ["shiny", "Shiny"], ["legendary", "Légendaire"], ["epic", "Épique"], ["rare", "Rare"], ["common", "Commune"]], cnt = {};
    ids.forEach((c) => { const r = window.MACards.rarityOf(c); cnt[r] = (cnt[r] || 0) + 1; });
    const nCat = Math.max(1, ((C.cars || []).length) || 1), pct = Math.min(100, Math.round((ids.length / nCat) * 100));
    const dist = `<div class="pv2-coll"><div class="pv2-ring" style="--p:${pct}%"><b>${pct}%</b><small>collection</small></div>
      <div class="pv2-rar"><div class="pv2-rar-bar" role="img" aria-label="Répartition des raretés">${RAR.filter(([k]) => cnt[k]).map(([k]) => `<i class="r-${k}" style="flex:${cnt[k]}"></i>`).join("")}</div>
        <ul>${RAR.filter(([k]) => cnt[k]).map(([k, l]) => `<li><i class="r-${k}"></i>${l}<b>${cnt[k]}</b></li>`).join("")}</ul></div></div>`;
    vit.innerHTML = dist + `<div class="pro-vitrine-head"><h3 class="sec-title nomargin">Ses plus belles cartes</h3><a class="pro-link" href="#/classement/collection">Classement des collectionneurs →</a></div>
      <div class="tcg-grid pro-vitrine-grid">${best.map((c) => window.MACards.cardHtml(c, { owned: true, count: owned[c.id] })).join("")}</div>`;
    if (window.MAIcons) window.MAIcons.apply(vit);
  }
  // ---------------------------------------------------------------- classement des collectionneurs
  let collMode = "count", collCache = null;
  const VAL = { common: 1, rare: 3, epic: 8, legendary: 20, shiny: 30, mythic: 50 };
  const MODES = [["count", "Cartes uniques"], ["value", "Valeur"], ["legend", "Rares et +"]];
  async function renderCollectors() {
    const box = $("collectors-rank-list"), C = ctx(); if (!box || !C) return;
    let bar = document.getElementById("collectors-modes");
    if (!bar) { bar = document.createElement("div"); bar.id = "collectors-modes"; bar.className = "seg-switch"; bar.setAttribute("role", "tablist"); bar.setAttribute("aria-label", "Critère du classement"); box.parentNode.insertBefore(bar, box); bar.addEventListener("click", (e) => { const b = e.target.closest("[data-cmode]"); if (!b) return; collMode = b.dataset.cmode; renderCollectors(); }); }
    bar.innerHTML = MODES.map(([k, l]) => `<button type="button" role="tab" class="seg-btn${k === collMode ? " active" : ""}" data-cmode="${k}" aria-selected="${k === collMode}">${l}</button>`).join("");
    box.innerHTML = `<li class="empty-note">Chargement…</li>`;
    let rows = [], users = new Map();
    try {
      if (!collCache || Date.now() - collCache.at > 60000) {
        const snap = await C.db.collection("collections").orderBy("count", "desc").limit(150).get();
        collCache = { at: Date.now(), docs: snap.docs.map((d) => Object.assign({ uid: d.id }, d.data())).filter((d) => (d.count || 0) > 0) };
      }
      if (window.MAGame) { const all = await window.MAGame.loadAll(false); users = all.users; }
      if (window.MACards && window.MACards.loadRarOv) { try { await window.MACards.loadRarOv(); } catch (_) { /* rareté automatique */ } }
      rows = collCache.docs.filter((d) => users.has(d.uid)).map((d) => {
        let value = 0, rare = 0;
        Object.keys(d.owned || {}).forEach((id) => { if (!(d.owned[id] > 0)) return; const car = window.MACards && window.MACards.cardObj(id); if (!car) return; const r = window.MACards.rarityOf(car); value += VAL[r] || 1; if (r === "legendary" || r === "shiny" || r === "mythic" || r === "special") rare++; });
        return { d, value, rare };
      });
    } catch (e) { box.innerHTML = `<li class="empty-note error">Classement indisponible.</li>`; return; }
    const key = { count: (r) => r.d.count || 0, value: (r) => r.value, legend: (r) => r.rare }[collMode];
    rows.sort((a, b) => key(b) - key(a) || (b.d.count || 0) - (a.d.count || 0));
    rows = rows.slice(0, 50);
    const total = Math.max(1, (C.cars || []).length);
    box.innerHTML = rows.length ? rows.map((r, i) => {
      const d = r.d, u = users.get(d.uid) || {}, pct = Math.round(((d.count || 0) / total) * 100);
      const main = collMode === "value" ? `<b>${r.value}</b><small>points</small>` : collMode === "legend" ? `<b>${r.rare}</b><small>rare${r.rare > 1 ? "s" : ""}+</small>` : `<b>${d.count || 0}</b><small>cartes</small>`;
      const sub = `${pct} % de la collection${d.specials ? " · " + d.specials + " édition" + (d.specials > 1 ? "s" : "") + " spéciale" + (d.specials > 1 ? "s" : "") : ""}`;
      return `<li><a class="rank-row" href="#/pilote/${encodeURIComponent(d.uid)}"><span class="rank-pos">${i + 1}</span>${C.avatarImg(u.avatar, "pilot-row-avatar")}<span class="rank-main"><b>${esc(u.username || "Pilote")}</b><small>${sub}</small></span><span class="rank-score">${main}</span></a></li>`;
    }).join("") : `<li class="empty-note">Personne n'a encore de cartes : ouvre ton premier pack dans l'onglet Jouer.</li>`;
  }
  if (window.Router) window.Router.register("leaderboard", { enter(params) { if (params.tab === "collection") renderCollectors(); } });
  window.MAPilot = { render, setTab, renderCollectors };
})();
