/**
 * MOTORAUTO — clubs / équipes par marque ou par région, avec fil réservé aux membres et classement (somme de l'XP des membres).
 *   clubs/{kind-slug}        { kind: brand|region, key, name, desc, ownerUid, createdAt }   (un seul club par marque / région)
 *   club_members/{club_uid}  { clubId, uid, name, avatar, joinedAt }
 *   club_posts/{auto}        { clubId, uid, name, avatar, text, createdAt }
 */
(function () {
  "use strict";
  let C = null, clubs = [], members = [], kindFilter = "all", cur = null;
  const REGIONS = ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Centre-Val de Loire", "Corse", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandie", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur", "Outre-mer", "Belgique", "Suisse", "Luxembourg", "Autre pays"];
  const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);
  const nf = (n) => Number(n).toLocaleString("fr-FR");
  const isMember = (id) => !!C.user && members.some((m) => m.clubId === id && m.uid === C.user.uid);

  async function loadAll() {
    const [cs, ms] = await Promise.all([C.db.collection("clubs").limit(300).get(), C.db.collection("club_members").limit(2000).get()]);
    clubs = cs.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    members = ms.docs.map((d) => Object.assign({ id: d.id }, d.data()));
  }
  async function xpMap() {
    try { if (window.MAGame) { const d = await window.MAGame.loadAll(); return (uid) => (d.map.get(uid) || { xp: 0 }).xp; } } catch (_) { /* classement sans XP */ }
    return () => 0;
  }
  const membersOf = (id) => members.filter((m) => m.clubId === id);

  // ------------------------------------------------------------------ liste
  async function renderList() {
    const root = document.getElementById("clubs-root"); if (!root) return;
    root.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try { await loadAll(); } catch (e) { root.innerHTML = `<div class="empty-note error">Clubs indisponibles (règles Firestore à publier ?).</div>`; return; }
    const xp = await xpMap();
    const rows = clubs.filter((c) => kindFilter === "all" || c.kind === kindFilter)
      .map((c) => { const ms = membersOf(c.id); return Object.assign({}, c, { n: ms.length, xp: ms.reduce((s, m) => s + xp(m.uid), 0) }); })
      .sort((a, b) => b.xp - a.xp || b.n - a.n);
    const brands = Array.from(new Set(C.cars.map((c) => c.brand))).sort((a, b) => a.localeCompare(b, "fr"));
    root.innerHTML = `<div class="chip-row" role="group" aria-label="Type de club">${[["all", "Tous"], ["brand", "Par marque"], ["region", "Par région"]].map(([k, l]) => `<button type="button" class="chip ${kindFilter === k ? "active" : ""}" data-club-kind="${k}" aria-pressed="${kindFilter === k}">${l}</button>`).join("")}</div>
      <ol class="top-list clubs-rank">${rows.length ? rows.map((c, i) => `<li><a class="rank-row" href="#/club/${encodeURIComponent(c.id)}"><span class="rank-pos">${i + 1}</span><span class="club-ico" aria-hidden="true">${c.kind === "brand" ? "🏎" : "📍"}</span><span class="rank-main"><b>${C.esc(c.name)}</b><small>${c.kind === "brand" ? "Club de marque" : "Club régional"} · ${c.n} membre${c.n > 1 ? "s" : ""}</small></span><span class="rank-score">${nf(c.xp)}<small>XP</small></span></a></li>`).join("") : `<li class="empty-note">Aucun club pour l'instant : crée le premier !</li>`}</ol>
      <form class="club-new" id="club-new" novalidate><h3>Créer un club</h3>
        <div class="form-grid"><div class="input-stack"><label for="cn-kind">Type</label><select id="cn-kind" class="custom-select"><option value="brand">Marque</option><option value="region">Région</option></select></div>
        <div class="input-stack"><label for="cn-key">Marque / région</label><select id="cn-key" class="custom-select">${brands.map((b) => `<option>${C.esc(b)}</option>`).join("")}</select></div>
        <div class="input-stack wide"><label for="cn-desc">Description (facultatif)</label><input type="text" id="cn-desc" maxlength="160" placeholder="Ex. Les fans de Peugeot sportives"></div></div>
        <div class="form-feedback error-txt" id="cn-error" role="alert"></div><button type="submit" class="cta-btn fill-btn">Créer le club</button></form>`;
    const kindSel = document.getElementById("cn-kind"), keySel = document.getElementById("cn-key");
    kindSel.addEventListener("change", () => { keySel.innerHTML = (kindSel.value === "brand" ? brands : REGIONS).map((b) => `<option>${C.esc(b)}</option>`).join(""); });
    document.getElementById("club-new").addEventListener("submit", create);
  }
  async function create(e) {
    e.preventDefault();
    const err = document.getElementById("cn-error"); err.textContent = "";
    if (!C.requireLogin()) return;
    if (window.MAMute && window.MAMute.active()) { err.textContent = window.MAMute.message(); return; }
    const kind = document.getElementById("cn-kind").value, key = document.getElementById("cn-key").value, id = kind + "-" + slug(key);
    if (clubs.some((c) => c.id === id)) { err.textContent = "Ce club existe déjà : rejoins-le !"; return; }
    try {
      await C.db.collection("clubs").doc(id).set({ kind, key, name: kind === "brand" ? "Club " + key : key, desc: document.getElementById("cn-desc").value.trim().slice(0, 160), ownerUid: C.user.uid, createdAt: C.FieldValue.serverTimestamp() });
      await join(id, true);
      C.toast("Club créé !", "ok"); C.Router.go({ name: "club", params: { id } });
    } catch (ex) { err.textContent = "Création impossible : " + ex.message; }
  }

  // ------------------------------------------------------------------ détail
  async function renderClub(id) {
    const root = document.getElementById("club-root"), title = document.querySelector("#page-club .page-title"), sub = document.querySelector("#page-club .page-sub");
    if (!root) return;
    root.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try { await loadAll(); } catch (e) { root.innerHTML = `<div class="empty-note error">Club indisponible.</div>`; return; }
    cur = id;
    const club = clubs.find((c) => c.id === id);
    if (!club) { if (title) title.textContent = "Club introuvable"; root.innerHTML = `<div class="empty-note">Ce club n'existe pas ou a été supprimé.</div>`; return; }
    if (title) title.textContent = club.name; if (sub) sub.textContent = club.desc || (club.kind === "brand" ? "Club de marque" : "Club régional");
    const ms = membersOf(id), mem = isMember(id), xp = await xpMap();
    let posts = [];
    try { const s = await C.db.collection("club_posts").where("clubId", "==", id).limit(80).get(); posts = s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)); } catch (_) { /* règles */ }
    const total = ms.reduce((s, m) => s + xp(m.uid), 0), cars = C.cars.filter((c) => club.kind === "brand" && c.brand === club.key);
    root.innerHTML = `<div class="club-head"><div class="stats-ribbon"><div class="ribbon-card"><span class="ribbon-value">${ms.length}</span><span class="ribbon-key">Membres</span></div><div class="ribbon-card"><span class="ribbon-value">${nf(total)}</span><span class="ribbon-key">XP cumulée</span></div>${club.kind === "brand" ? `<div class="ribbon-card"><span class="ribbon-value">${cars.length}</span><span class="ribbon-key">Fiches</span></div>` : ""}</div>
      <button type="button" class="cta-btn ${mem ? "btn-ghost" : "fill-btn"}" data-club-join="${C.esc(id)}">${mem ? "Quitter le club" : "Rejoindre le club"}</button>${C.isAdmin || (C.user && club.ownerUid === C.user.uid) ? `<button type="button" class="secondary-destructive-btn" data-club-del="${C.esc(id)}">Supprimer le club</button>` : ""}</div>
      <div class="club-cols"><div>
        ${mem ? `<form id="club-post-form" class="club-post-form"><textarea id="club-post-text" maxlength="500" rows="2" placeholder="Un message pour le club…" aria-label="Message au club"></textarea><button type="submit" class="cta-btn fill-btn compact-btn">Publier</button></form>` : `<p class="lap-meta">Rejoins le club pour publier dans son fil.</p>`}
        <div class="feed-list">${posts.length ? posts.map((p) => `<div class="feed-item">${C.avatarImg(p.avatar, "feed-avatar")}<span class="feed-text"><a href="#/pilote/${encodeURIComponent(p.uid)}"><b>${C.esc(p.name || "Pilote")}</b></a> ${C.esc(p.text)}<span class="feed-when">${window.MACommunity ? window.MACommunity.ago(tsMs(p.createdAt)) : ""}${C.user && (C.user.uid === p.uid || C.isAdmin) ? ` · <button type="button" class="cmt-del" data-club-post-del="${C.esc(p.id)}" aria-label="Supprimer">🗑</button>` : ""}</span></span></div>`).join("") : `<div class="empty-note">Le fil du club est vide.</div>`}</div></div>
        <aside><h3 class="panel-section-title">Membres</h3><div class="club-members">${ms.slice().sort((a, b) => xp(b.uid) - xp(a.uid)).map((m) => `<a class="mini-row" href="#/pilote/${encodeURIComponent(m.uid)}">${C.avatarImg(m.avatar, "pilot-row-avatar")}<span class="mini-main"><b>${C.esc(m.name || "Pilote")}</b><small>${nf(xp(m.uid))} XP</small></span></a>`).join("") || `<div class="empty-note small">Personne pour l'instant.</div>`}</div>
        ${cars.length ? `<h3 class="panel-section-title">Fiches ${C.esc(club.key)}</h3><div class="club-cars">${cars.slice(0, 12).map((c) => `<a href="#/voiture/${encodeURIComponent(c.id)}" class="chip">${C.esc(String(c.model).replace(/\s*\(.*$/, ""))}</a>`).join("")}</div>` : ""}</aside></div>`;
    const f = document.getElementById("club-post-form");
    if (f) f.addEventListener("submit", post);
  }
  async function join(id, silent) {
    if (!C.requireLogin()) return;
    if (window.MAMute && window.MAMute.active() && !isMember(id)) { C.toast(window.MAMute.message(), "err"); return; }
    const ref = C.db.collection("club_members").doc(id + "_" + C.user.uid);
    try {
      if (isMember(id)) { await ref.delete(); members = members.filter((m) => !(m.clubId === id && m.uid === C.user.uid)); }
      else { const d = { clubId: id, uid: C.user.uid, name: C.pilotName().slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400), joinedAt: C.FieldValue.serverTimestamp() }; await ref.set(d); members.push(Object.assign({ id: ref.id }, d)); if (!silent) C.toast("Bienvenue dans le club !", "ok"); }
      if (!silent) renderClub(id);
    } catch (e) { C.toast("Action impossible : " + e.message, "err"); }
  }
  async function post(e) {
    e.preventDefault();
    if (window.MAMute && window.MAMute.active()) { C.toast(window.MAMute.message(), "err"); return; }
    const ta = document.getElementById("club-post-text"), text = ta.value.trim().slice(0, 500);
    if (!text || !cur) return;
    try {
      await C.db.collection("club_posts").add({ clubId: cur, uid: C.user.uid, name: C.pilotName().slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400), text, createdAt: C.FieldValue.serverTimestamp() });
      renderClub(cur);
    } catch (ex) { C.toast("Publication impossible : " + ex.message, "err"); }
  }
  async function delClub(id) {
    if (!confirm("Supprimer ce club ? (les messages restent en base mais ne sont plus affichés)")) return;
    try { await C.db.collection("clubs").doc(id).delete(); if (window.MALog && C.isAdmin) window.MALog.log("club-delete", { target: id, detail: "club supprimé" }); C.Router.go("/clubs"); } catch (e) { C.toast("Suppression impossible : " + e.message, "err"); }
  }

  window.MAClubs = { membersOf: (id) => membersOf(id), load: loadAll, myClubs: () => clubs.filter((c) => isMember(c.id)) };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("clubs", { enter: () => renderList() });
    ctx.Router.register("club", { enter: (p) => renderClub(p.id) });
    // lien « Clubs » dans l'onglet Communauté : bandeau d'accès
    document.addEventListener("click", (e) => {
      const k = e.target.closest("[data-club-kind]"); if (k) { kindFilter = k.dataset.clubKind; renderList(); return; }
      const j = e.target.closest("[data-club-join]"); if (j) { join(j.dataset.clubJoin); return; }
      const d = e.target.closest("[data-club-del]"); if (d) { delClub(d.dataset.clubDel); return; }
      const pd = e.target.closest("[data-club-post-del]");
      if (pd && confirm("Supprimer ce message ?")) C.db.collection("club_posts").doc(pd.dataset.clubPostDel).delete().then(() => renderClub(cur)).catch((x) => C.toast("Suppression impossible : " + x.message, "err"));
    });
    document.addEventListener("ma:auth", () => { if (ctx.Router.is("clubs")) renderList(); else if (ctx.Router.current() && ctx.Router.current().name === "club") renderClub(cur); });
  });
})();
