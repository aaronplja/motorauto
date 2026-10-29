/**
 * MOTORAUTO — niveaux, badges, série de visites et classement des pilotes les plus actifs.
 * Tout est CALCULÉ à partir des données publiques (chronos, commentaires, j'aime, voitures, sorties, cartes) :
 * la série de visites est tenue par le serveur (Cloud Function touchStreak), comme les packs de cartes.
 *   streaks/{uid}  { days, best, last: "yyyy-mm-dd", updatedAt }   (lecture seule côté site)
 */
(function () {
  "use strict";
  let C = null;
  const G = window.MAGameCore;                                 // niveaux, badges et calendrier : définis une seule fois (js/game-core.js)
  const LEVELS = G.LEVELS, BADGES = G.BADGES, levelOf = G.levelOf, goalOf = G.goalOf;
  const day = (ms) => G.dayKey(ms);
  const nf = (n) => Math.round(n).toLocaleString("fr-FR");

  // ------------------------------------------------------------------ agrégation
  let cache = { at: 0, map: new Map(), users: new Map() };
  let loading = null;
  async function safe(p, fallback) { try { return await p; } catch (e) { return fallback; } }

  async function loadAll(force) {
    if (!force && Date.now() - cache.at < 90000) return cache;
    if (loading) return loading;
    loading = (async () => {
      const app = window.MAApp;
      const [laps, , usersSnap, streakSnap, colSnap, ev, entSnap, winSnap] = await Promise.all([
        safe(app.getLaps(), []), safe(window.MASocial ? window.MASocial.loadStats(force) : null, null), safe(C.db.collection("users").limit(400).get(), null),
        safe(C.db.collection("streaks").limit(500).get(), null), safe(C.db.collection("collections").limit(500).get(), null),
        safe(window.MACommunity ? window.MACommunity.loadEvents() : null, null),
        safe(C.db.collection("contest_entries").where("status", "==", "approved").limit(500).get(), null), safe(C.db.collection("contests").limit(80).get(), null)
      ]);
      await safe(app.loadCommunityOnce ? app.loadCommunityOnce() : null, null);
      const map = new Map(), users = new Map();
      const get = (uid) => { if (!map.has(uid)) map.set(uid, { uid, laps: 0, tracks: new Set(), records: 0, podiums: 0, comments: 0, likes: 0, cars: 0, events: 0, rsvps: 0, days: 0, best: 0, last: "", cards: 0, specials: 0, trades: 0, chal: 0, entries: 0, wins: 0 }); return map.get(uid); };
      if (usersSnap) usersSnap.forEach((d) => { users.set(d.id, d.data()); get(d.id); });
      // chronos
      const byTrack = new Map();
      (laps || []).forEach((l) => {
        if (!l.pilotUid) return;
        const s = get(l.pilotUid); s.laps++;
        const k = l.trackKey || (C.MA.trackKey ? C.MA.trackKey(l.track || "") : l.track);
        if (!k) return;
        s.tracks.add(k);
        if (!byTrack.has(k)) byTrack.set(k, new Map());
        const m = byTrack.get(k), ms = l.chronoMs;
        if (ms > 0 && (!m.has(l.pilotUid) || m.get(l.pilotUid) > ms)) m.set(l.pilotUid, ms);
      });
      byTrack.forEach((m) => {
        if (m.size < 2) return;
        const rank = Array.from(m.entries()).sort((a, b) => a[1] - b[1]);
        rank.forEach(([uid], i) => { if (i === 0) get(uid).records++; else if (i < 3) get(uid).podiums++; });
      });
      // commentaires et j'aime
      const raw = window.MASocial && window.MASocial.raw ? window.MASocial.raw() : null;
      if (raw) {
        raw.comments.forEach((arr) => arr.forEach((c) => { if (c.uid) get(c.uid).comments++; }));
        raw.likes.forEach((set) => set.forEach((uid) => { get(uid).likes++; }));
      }
      // voitures, sorties
      ((app.getCommunityCars && app.getCommunityCars()) || []).forEach((c) => { if (c.uid) get(c.uid).cars++; });
      if (ev && window.MACommunity) {
        (ev || []).forEach((e) => { if (e.uid) get(e.uid).events++; });
        window.MACommunity.rsvps().forEach((m) => m.forEach((r, uid) => { get(uid).rsvps++; }));
      }
      if (streakSnap) streakSnap.forEach((d) => { const x = d.data(); const s = get(d.id); s.days = x.days || 0; s.best = Math.max(x.best || 0, x.days || 0); s.last = x.last || ""; });
      if (colSnap) colSnap.forEach((d) => { const x = d.data(), s = get(d.id); s.cards = Number(x.count) || 0; s.specials = Number(x.specials) || 0; s.trades = Number(x.trades) || 0; s.chal = Number(x.chal) || 0; });
      if (entSnap) entSnap.forEach((d) => { const x = d.data(); if (x.uid) get(x.uid).entries++; });
      if (winSnap) winSnap.forEach((d) => { const x = d.data(); if (x.winnerUid) get(x.winnerUid).wins++; });
      map.forEach((s) => finish(s));
      cache = { at: Date.now(), map, users };
      return cache;
    })();
    try { return await loading; } finally { loading = null; }
  }

  /** xp, niveau et badges d'un jeu de compteurs (mêmes règles que le serveur) */
  const finish = (s) => G.finish(s, C ? C.cars.length : 0);

  function statsOf(uid) { return cache.map.get(uid) || finish(Object.assign(G.BLANK_STATS(), { uid })); }

  // ------------------------------------------------------------------ série de visites
  async function touchStreak() {
    if (!C.user || !window.MAGameAPI) return;
    const k = "ma_streak_" + C.user.uid, today = day();
    try { if (localStorage.getItem(k) === today) return; } catch (_) { /* ignoré */ }
    try {
      const r = await window.MAGameAPI.call("touchStreak");
      try { localStorage.setItem(k, today); } catch (_) { /* ignoré */ }
      cache.at = 0;
      if (r.fresh && r.days === 7) C.toast("🔥 7 jours d'affilée ! Un badge t'attend.", "ok");
      else if (r.fresh && r.days > 1) C.toast(`🔥 ${r.days} jours d'affilée sur MOTORAUTO !`, "ok");
    } catch (e) { console.warn("Série de visites :", e.message); }
  }

  // ------------------------------------------------------------------ rendu
  function levelHtml(s) {
    const L = levelOf(s.xp);
    return `<div class="game-card" aria-label="Niveau ${L.level.n}, ${nf(s.xp)} points d'expérience">
      <div class="lvl-ring" style="--p:${L.pct}%"><b>${L.level.n}</b><small>NIV.</small></div>
      <div class="lvl-main"><h3>${C.esc(L.level.name)}</h3>
        <div class="xp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${L.pct}"><i style="width:${L.pct}%"></i></div>
        <small>${nf(s.xp)} XP${L.next ? ` · encore ${nf(L.toNext)} pour « ${C.esc(L.next.name)} »` : " · niveau maximum"}</small></div>
      <div class="streak-chip ${s.days >= 7 ? "hot" : ""} ${s.days >= 30 ? "blaze" : ""}" title="Série de visites : ${s.days} jour(s) d'affilée (record ${s.best})"><span aria-hidden="true">🔥</span><b>${s.days}</b><small>jour${s.days > 1 ? "s" : ""}</small></div>
    </div>`;
  }
  function badgeGridHtml(s) {
    const earned = new Set(s.badges);
    const list = BADGES.slice().sort((a, b) => (earned.has(b.id) ? 1 : 0) - (earned.has(a.id) ? 1 : 0));
    return `<div class="badge-grid" role="list">${list.map((b) => {
      const on = earned.has(b.id), g = goalOf(b), cur = Math.min(g, b.get(s));
      return `<div class="badge-tile ${on ? "on " + b.tier : "off"}" role="listitem" title="${C.esc(b.desc)}"><i aria-hidden="true">${b.icon}</i><b>${C.esc(b.label)}</b><small>${on ? "Obtenu" : `${nf(cur)} / ${nf(g)}`}</small></div>`;
    }).join("")}</div>`;
  }
  function blockHtml(s, title) {
    return `<div class="panel-section-title">${C.esc(title || "Niveau & badges")} <span class="lap-meta">${s.badges.length} / ${BADGES.length}</span></div>${levelHtml(s)}${badgeGridHtml(s)}`;
  }

  async function renderInto(el, uid, title) {
    if (!el) return;
    try { await loadAll(); } catch (e) { return; }
    if (el._uid !== uid) return;
    el.innerHTML = blockHtml(statsOf(uid), title);
  }
  function ensureBlock(id, anchorSel, where) {
    let el = document.getElementById(id);
    if (!el) {
      const a = document.querySelector(anchorSel);
      if (!a) return null;
      el = document.createElement("div"); el.id = id; el.className = "game-zone";
      a.insertAdjacentElement(where || "afterend", el);
    }
    return el;
  }

  // ------------------------------------------------------------------ classement des pilotes
  async function renderRanking() {
    const box = document.getElementById("pilots-rank-list");
    if (!box) return;
    box.innerHTML = `<li class="empty-note">Chargement…</li>`;
    let data;
    try { data = await loadAll(true); } catch (e) { box.innerHTML = `<li class="empty-note error">Classement indisponible.</li>`; return; }
    const rows = Array.from(data.map.values()).filter((s) => s.xp > 0 && data.users.has(s.uid)).sort((a, b) => b.xp - a.xp).slice(0, 50);
    box.innerHTML = rows.length ? rows.map((s, i) => {
      const u = data.users.get(s.uid) || {}, L = levelOf(s.xp).level;
      return `<li><a class="rank-row" href="#/pilote/${encodeURIComponent(s.uid)}"><span class="rank-pos">${i + 1}</span>${C.avatarImg(u.avatar, "pilot-row-avatar")}<span class="rank-main"><b>${C.esc(u.username || "Pilote")}${C.MA.admins ? C.MA.admins.tag(s.uid) : ""}</b><small>Niv. ${L.n} ${C.esc(L.name)} · ${s.badges.length} badge${s.badges.length > 1 ? "s" : ""}${s.days ? " · 🔥 " + s.days + " j" : ""}</small></span><span class="rank-score">${nf(s.xp)}<small>XP</small></span></a></li>`;
    }).join("") : `<li class="empty-note">Pas encore de pilote actif : poste un chrono, un commentaire ou une voiture pour apparaître ici.</li>`;
  }
  async function renderHomeRank() {
    const box = document.getElementById("home-active-pilots");
    if (!box) return;
    try {
      const data = await loadAll();
      const rows = Array.from(data.map.values()).filter((s) => s.xp > 0 && data.users.has(s.uid)).sort((a, b) => b.xp - a.xp).slice(0, 5);
      box.innerHTML = rows.length ? rows.map((s, i) => { const u = data.users.get(s.uid) || {}, L = levelOf(s.xp).level;
        return `<a class="mini-row" href="#/pilote/${encodeURIComponent(s.uid)}"><span class="mini-rank">${i + 1}</span><span class="mini-main"><b>${C.esc(u.username || "Pilote")}</b><small>Niv. ${L.n} ${C.esc(L.name)}</small></span><span class="rank-score">${nf(s.xp)}<small>XP</small></span></a>`; }).join("")
        : `<div class="empty-note small">Aucun pilote actif pour l'instant.</div>`;
    } catch (e) { box.innerHTML = ""; }
  }

  // ------------------------------------------------------------------ annonces de nouveaux badges
  async function announce() {
    if (!C.user) return;
    try {
      await loadAll(true);
      const s = statsOf(C.user.uid), k = "ma_badges_" + C.user.uid;
      let seen = null;
      try { seen = JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { seen = null; }
      const fresh = seen ? s.badges.filter((id) => !seen.badges.includes(id)) : [];
      if (fresh.length) {
        const b = BADGES.find((x) => x.id === fresh[0]);
        C.toast(`🏅 Nouveau badge : ${b.icon} ${b.label}${fresh.length > 1 ? ` (+${fresh.length - 1} autre${fresh.length > 2 ? "s" : ""})` : ""} — une carte t'attend !`, "ok");
      }
      if (seen && s.level > seen.level) C.toast(`⬆️ Niveau ${s.level} atteint : ${levelOf(s.xp).level.name} !`, "ok");
      try { localStorage.setItem(k, JSON.stringify({ badges: s.badges, level: s.level })); } catch (_) { /* ignoré */ }
      document.dispatchEvent(new CustomEvent("ma:game", { detail: { uid: C.user.uid, stats: s } }));
    } catch (e) { /* silencieux */ }
  }

  window.MAGame = { BADGES, LEVELS, levelOf, loadAll, statsOf, blockHtml, levelHtml, badgeGridHtml, day: () => day(), nf, finish,
    earned: (uid) => statsOf(uid).badges, invalidate: () => { cache.at = 0; } };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx); C.app = window.MAApp;
    ctx.Router.register("pilot", { enter: (p) => {
      const el = ensureBlock("pub-gamify", "#pub-badges-slot", "beforeend");
      if (el) { el._uid = p.uid; el.innerHTML = ""; renderInto(el, p.uid, "Niveau & badges"); }
    } });
    ctx.Router.register("garage", { enter: (p) => {
      if (!ctx.user) return;
      if (p.tab !== "apercu") return;
      const el = ensureBlock("garage-gamify", "#garage-social");
      if (el) { el._uid = ctx.user.uid; renderInto(el, ctx.user.uid, "Mon niveau & mes badges"); }
    } });
    ctx.Router.register("leaderboard", { enter: (p) => { if (p.tab === "pilotes") renderRanking(); } });
    ctx.Router.register("home", { enter: () => renderHomeRank() });
    document.addEventListener("ma:auth", () => { cache.at = 0; touchStreak().then(announce); });
    document.addEventListener("ma:social", () => { cache.at = 0; });
    if (ctx.user) touchStreak().then(announce);
  });
})();
