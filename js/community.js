/**
 * MOTORAUTO — fil d'actualité et sorties / événements.
 *   feed/{auto}          { type: member|car|record|catalog|event, uid, pilot, avatar, text, link, createdAt }
 *   events/{auto}        { title, kind, place, dateMs, description, uid, pilot, avatar, createdAt }
 *   rsvps/{event}_{uid}  { event, uid, pilot, avatar, createdAt }
 */
(function () {
  "use strict";
  let C = null;
  const FEED_ICON = { member: "🧑‍✈️", car: "🚗", record: "🏁", catalog: "📖", event: "📅" };
  const KIND_LABEL = { circuit: "Journée circuit", rassemblement: "Rassemblement", balade: "Balade", autre: "Autre" };
  const MONTHS = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUN", "JUI", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : t && t.seconds ? t.seconds * 1000 : typeof t === "number" ? t : Date.now());

  function ago(ms) {
    const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
    if (s < 60) return "à l'instant";
    if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
    if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
    if (s < 86400 * 30) return `il y a ${Math.floor(s / 86400)} j`;
    return new Date(ms).toLocaleDateString("fr-FR");
  }

  // ------------------------------------------------------------------ fil
  let feedCache = { list: [], at: 0 }, feedShown = 12, feedMode = "all", followSet = null, followFor = null;
  async function loadFollowing() {
    if (!C.user) return new Set();
    if (followSet && followFor === C.user.uid) return followSet;
    const s = await C.db.collection("users").doc(C.user.uid).collection("following").limit(300).get();
    followSet = new Set(s.docs.map((d) => d.id)); followFor = C.user.uid; return followSet;
  }
  async function loadFeed(force) {
    if (!force && Date.now() - feedCache.at < 20000) return feedCache.list;
    const s = await C.db.collection("feed").orderBy("createdAt", "desc").limit(feedMode === "follow" ? 150 : 60).get();
    feedCache = { list: s.docs.map((d) => Object.assign({ id: d.id }, d.data())), at: Date.now() };
    return feedCache.list;
  }
  function feedItemHtml(f) {
    const esc = C.esc, link = f.link ? String(f.link) : "";
    const safeLink = /^#\/[\w\-/%.]*$/.test(link) ? link : "";
    const inner = `${f.avatar ? `<img class="feed-avatar" src="${esc(C.safeUrl(f.avatar) || "")}" alt="" data-fallback="avatar">` : `<span class="feed-ico" aria-hidden="true">${FEED_ICON[f.type] || "🔔"}</span>`}
      <span class="feed-text"><b>${esc(f.pilot || "MOTORAUTO")}</b> ${esc(f.text)}<span class="feed-when">${FEED_ICON[f.type] || ""} ${ago(tsMs(f.createdAt))}</span></span>`;
    return safeLink ? `<a class="feed-item" href="${safeLink}">${inner}</a>` : `<div class="feed-item">${inner}</div>`;
  }
  async function renderFeed() {
    const box = document.getElementById("feed-list");
    if (!box) return;
    box.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try {
      document.querySelectorAll("[data-feed-mode]").forEach((b) => { b.classList.toggle("active", b.dataset.feedMode === feedMode); b.setAttribute("aria-selected", String(b.dataset.feedMode === feedMode)); });
      let list = await loadFeed(true);
      if (feedMode === "follow") {
        if (!C.user) { box.innerHTML = `<div class="empty-note">Connecte-toi pour voir l'actualité des pilotes que tu suis.</div>`; document.getElementById("feed-more").hidden = true; return; }
        const f = await loadFollowing(); list = list.filter((x) => x.uid && f.has(x.uid));
        if (!list.length) { box.innerHTML = `<div class="empty-note">${f.size ? "Les pilotes que tu suis n'ont rien publié récemment." : "Tu ne suis encore personne : abonne-toi depuis un profil de pilote."}</div>`; document.getElementById("feed-more").hidden = true; return; }
      }
      box.innerHTML = list.length ? list.slice(0, feedShown).map(feedItemHtml).join("") : `<div class="empty-note">Rien pour l'instant : ajoute une voiture ou un chrono pour lancer l'actualité.</div>`;
      document.getElementById("feed-more").hidden = list.length <= feedShown;
    } catch (e) { box.innerHTML = `<div class="empty-note error">Fil indisponible.</div>`; }
  }
  async function renderHomeFeed() {
    const box = document.getElementById("home-feed");
    if (!box) return;
    try {
      const list = await loadFeed();
      box.innerHTML = list.length ? list.slice(0, 6).map(feedItemHtml).join("") : `<div class="empty-note">Rien pour l'instant. Les nouveaux pilotes, voitures et records apparaîtront ici.</div>`;
    } catch (e) { box.innerHTML = `<div class="empty-note error">Actualité indisponible.</div>`; }
  }
  async function postFeed(type, text, link) {
    if (!C || !C.user) return;
    try {
      await C.db.collection("feed").add({
        type, uid: C.user.uid, pilot: C.pilotName().slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400),
        text: String(text).slice(0, 160), link: String(link || "").slice(0, 160), createdAt: C.FieldValue.serverTimestamp()
      });
      feedCache.at = 0;
    } catch (e) { console.warn("Fil : publication impossible :", e.message); }
  }

  // ------------------------------------------------------------------ événements
  const rsvps = new Map(); // event -> Map(uid -> doc)
  let eventsCache = { list: [], at: 0 };
  async function loadEvents(force) {
    if (!force && Date.now() - eventsCache.at < 15000) return eventsCache.list;
    const [e, r] = await Promise.all([
      C.db.collection("events").orderBy("dateMs", "asc").limit(150).get(),
      C.db.collection("rsvps").limit(3000).get()
    ]);
    eventsCache = { list: e.docs.map((d) => Object.assign({ id: d.id }, d.data())), at: Date.now() };
    rsvps.clear();
    r.forEach((d) => { const x = d.data(); if (!rsvps.has(x.event)) rsvps.set(x.event, new Map()); rsvps.get(x.event).set(x.uid, x); });
    return eventsCache.list;
  }
  function eventCardHtml(ev) {
    const esc = C.esc, d = new Date(ev.dateMs), going = rsvps.get(ev.id) || new Map();
    const me = C.user && going.has(C.user.uid), past = ev.dateMs < Date.now() - 6 * 3600 * 1000;
    const names = Array.from(going.values()).slice(0, 4).map((g) => esc(g.pilot || "Pilote")).join(", ");
    const canDel = C.user && (C.user.uid === ev.uid || C.isAdmin);
    return `<article class="event-card">
      <div class="event-date" aria-hidden="true"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div>
      <div class="event-main">
        <span class="event-kind">${esc(KIND_LABEL[ev.kind] || "Sortie")}</span>
        <h3>${esc(ev.title)}</h3>
        <div class="event-meta">📍 ${esc([ev.place, ev.city].filter(Boolean).join(", "))}${ev.address ? " (" + esc(ev.address) + ")" : ""} · 🕒 ${d.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</div>
        ${ev.description ? `<p class="event-desc">${esc(ev.description)}</p>` : ""}
        <div class="event-meta">Proposé par <b data-ev="profile" data-uid="${esc(ev.uid)}" style="cursor:pointer">${esc(ev.pilot || "Pilote")}</b></div>
        <div class="event-meta">${going.size} participant${going.size > 1 ? "s" : ""}${names ? " : " + names + (going.size > 4 ? "…" : "") : ""}</div>
        <div class="event-actions">
          ${past ? `<span class="due">Terminé</span>` : `<button type="button" class="cta-btn ${me ? "btn-ghost" : "fill-btn"} compact-btn" data-ev="go" data-id="${esc(ev.id)}" aria-pressed="${!!me}">${me ? "✓ J'y vais (annuler)" : "J'y vais"}</button>`}
          ${canDel ? `<button type="button" class="secondary-destructive-btn" data-ev="del" data-id="${esc(ev.id)}">Supprimer</button>` : ""}
        </div>
      </div></article>`;
  }
  async function renderEvents() {
    const up = document.getElementById("events-list"), past = document.getElementById("events-past");
    if (!up) return;
    up.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try {
      const list = await loadEvents(true), now = Date.now() - 6 * 3600 * 1000;
      const next = list.filter((e) => e.dateMs >= now), old = list.filter((e) => e.dateMs < now).reverse();
      document.getElementById("events-count").textContent = `${next.length} à venir`;
      up.innerHTML = next.length ? next.map(eventCardHtml).join("") : `<div class="empty-note">Aucune sortie prévue. Propose la première !</div>`;
      past.innerHTML = old.length ? old.slice(0, 20).map(eventCardHtml).join("") : `<div class="empty-note small">Rien de passé.</div>`;
      document.dispatchEvent(new CustomEvent("ma:events-rendered", { detail: { list } }));
    } catch (e) { up.innerHTML = `<div class="empty-note error">Sorties indisponibles.</div>`; }
  }
  async function renderHomeEvents() {
    const box = document.getElementById("home-events");
    if (!box) return;
    try {
      const list = (await loadEvents()).filter((e) => e.dateMs >= Date.now() - 6 * 3600 * 1000).slice(0, 3), esc = C.esc;
      box.innerHTML = list.length ? list.map((ev) => { const d = new Date(ev.dateMs); const n = (rsvps.get(ev.id) || new Map()).size;
        return `<a class="mini-row" href="#/communaute/evenements"><span class="mini-rank">${d.getDate()}<small>${MONTHS[d.getMonth()]}</small></span><span class="mini-main"><b>${esc(ev.title)}</b><small>📍 ${esc(ev.place)} · ${n} partant${n > 1 ? "s" : ""}</small></span></a>`; }).join("")
        : `<div class="empty-note small">Aucune sortie prévue. <a href="#/communaute/evenements">Propose-en une !</a></div>`;
    } catch (e) { box.innerHTML = `<div class="empty-note small error">Sorties indisponibles.</div>`; }
  }

  async function toggleGoing(id) {
    if (!C.requireLogin()) return;
    if (window.MAMute && MAMute.active()) { C.toast(MAMute.message(), "err"); return; }
    const ev = eventsCache.list.find((e) => e.id === id);
    if (!ev) return;
    if (!rsvps.has(id)) rsvps.set(id, new Map());
    const m = rsvps.get(id), me = C.user.uid, had = m.has(me);
    const ref = C.db.collection("rsvps").doc(id + "_" + me);
    try {
      if (had) { await ref.delete(); m.delete(me); }
      else {
        const doc = { event: id, uid: me, pilot: C.pilotName().slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400), createdAt: C.FieldValue.serverTimestamp() };
        await ref.set(doc); m.set(me, doc);
        C.MA.notif.send(ev.uid, { type: "event", from: C.pilotName(), text: ev.title, link: "index.html#/communaute/evenements" }, "event_" + id + "_" + me);
      }
    } catch (e) { C.toast("Action refusée : " + e.message, "err"); }
    renderEvents(); if (C.Router.is("home")) renderHomeEvents();
  }

  async function submitEvent(e) {
    e.preventDefault();
    const err = document.getElementById("ev-error"); err.textContent = "";
    if (!C.requireLogin()) return;
    if (window.MAMute && MAMute.active()) { err.textContent = MAMute.message(); return; }
    const title = document.getElementById("ev-title").value.trim(), place = document.getElementById("ev-place").value.trim();
    const dateMs = new Date(document.getElementById("ev-date").value).getTime();
    if (title.length < 3) { err.textContent = "Donne un titre à la sortie."; return; }
    if (place.length < 2) { err.textContent = "Indique le lieu."; return; }
    if (!Number.isFinite(dateMs) || dateMs < Date.now() - 3600000) { err.textContent = "Choisis une date à venir."; return; }
    try {
      const doc = {
        title: title.slice(0, 80), kind: document.getElementById("ev-kind").value, place: place.slice(0, 120), dateMs,
        description: document.getElementById("ev-desc").value.trim().slice(0, 600), uid: C.user.uid, pilot: C.pilotName().slice(0, 40),
        avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400), createdAt: C.FieldValue.serverTimestamp()
      };
      const city = (document.getElementById("ev-city") || {}).value, addr = (document.getElementById("ev-address") || {}).value;
      if (city && city.trim()) doc.city = city.trim().slice(0, 80);
      if (addr && addr.trim()) doc.address = addr.trim().slice(0, 160);
      if (window.MAMap) { const g = (await window.MAMap.geocode(window.MAMap.evQuery(doc))) || (doc.city ? await window.MAMap.geocode(doc.city) : null) || (await window.MAMap.geocode(place)); if (g) { doc.lat = g.lat; doc.lng = g.lng; } }
      const ref = await C.db.collection("events").add(doc);
      postFeed("event", `propose une sortie : ${doc.title} (${doc.place})`, "#/communaute/evenements");
      C.closeModal(document.getElementById("event-modal"));
      document.getElementById("event-form").reset();
      eventsCache.at = 0;
      C.toast("Sortie publiée.", "ok");
      renderEvents();
    } catch (ex) { err.textContent = "Publication impossible : " + ex.message; }
  }
  async function deleteEvent(id) {
    if (!confirm("Supprimer cette sortie ?")) return;
    try {
      await C.db.collection("events").doc(id).delete();
      if (C.isAdmin && window.MALog) window.MALog.log("event-delete", { target: id, detail: "sortie supprimée" });
      eventsCache.at = 0; renderEvents();
    } catch (e) { C.toast("Suppression impossible : " + e.message, "err"); }
  }

  window.MACommunity = { loadEvents: (f) => loadEvents(f), rsvps: () => rsvps, events: () => eventsCache.list, postFeed: (t, x, l) => postFeed(t, x, l), ago, tsMs };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    document.addEventListener("ma:feed", (e) => postFeed(e.detail.type, e.detail.text, e.detail.link));
    ctx.Router.register("home", { enter: () => { renderHomeFeed(); renderHomeEvents(); } });
    ctx.Router.register("community", { enter: (p) => {
      if (p.tab === "fil") { feedShown = 12; renderFeed(); }
      else if (p.tab === "evenements") renderEvents();
    } });
    document.addEventListener("click", (e) => {
      const fm = e.target.closest("[data-feed-mode]");
      if (fm) { feedMode = fm.dataset.feedMode; feedShown = 12; renderFeed(); return; }
      const t = e.target.closest("[data-action], [data-ev]");
      if (!t) return;
      if (t.dataset.action === "feed-more") { feedShown += 12; renderFeed(); }
      else if (t.dataset.action === "event-new") {
        if (!ctx.requireLogin()) return;
        const inp = document.getElementById("ev-date"); const d = new Date(Date.now() + 7 * 86400000); d.setMinutes(0, 0, 0);
        inp.min = new Date(Date.now() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        inp.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById("ev-error").textContent = "";
        ctx.openModal(document.getElementById("event-modal"));
      } else if (t.dataset.ev === "go") toggleGoing(t.dataset.id);
      else if (t.dataset.ev === "del") deleteEvent(t.dataset.id);
      else if (t.dataset.ev === "profile") ctx.openProfile(t.dataset.uid);
    });
    document.getElementById("event-form").addEventListener("submit", submitEvent);
  });
})();
