/**
 * MOTORAUTO — Salon des pilotes (page indépendante chat.html)
 * Routage par ancre : #global · #channel/<id> · #dm/<uid>  (sur mobile : liste ⇄ conversation)
 */
(function () {
  "use strict";
  const { esc, safeUrl, normalize, authErrorMessage, FALLBACK_AVATAR } = window.MA;
  const { auth, db, storage, FieldValue, FieldPath } = window.MAFB;
  const MA = window.MA;
  const $ = (id) => document.getElementById(id);

  const EMOJIS = ["👍", "❤️", "🔥", "🏎️", "🏁"];
  const PICKER = ["😀", "😂", "😍", "😎", "🤝", "👏", "🙌", "💪", "🔥", "🏎️", "🏁", "🚗", "⚙️", "🔧", "🛞", "⛽", "💨", "🏆", "👍", "👎", "❤️", "😮", "🤔", "😅", "😭", "🙏", "👀", "💯", "🎉", "✅", "❌", "⚡"];
  const THEMES = [
    ["onyx-carbon", "Onyx Carbon", "#09090b", "#ef4444"], ["midnight-blue", "Midnight Blue", "#060913", "#3b82f6"],
    ["asphalt-smoke", "Asphalt Smoke", "#111111", "#f59e0b"], ["monza-night", "Monza Night", "#0a0507", "#e11d48"],
    ["tokyo-neon", "Tokyo Neon", "#050508", "#a855f7"], ["cyber-matrix", "Cyber Matrix", "#022c22", "#10b981"],
    ["abyss-titanium", "Abyss Titanium", "#070d1a", "#06b6d4"], ["velvet-gothic", "Velvet Gothic", "#18050f", "#ec4899"],
    ["carrara-white", "Carrara White", "#f8fafc", "#dc2626"], ["silver-arrow", "Silver Arrow", "#f1f5f9", "#0284c7"],
    ["ivory-dune", "Ivory Dune", "#fbf9f5", "#b45309"], ["nordic-frost", "Nordic Frost", "#f0fdf4", "#16a34a"],
    ["solar-flare", "Solar Flare", "#fffbeb", "#d97706"], ["alpine-horizon", "Alpine Horizon", "#eff6ff", "#2563eb"],
    ["rose-gold-gt", "Rose Gold GT", "#fff1f2", "#e11d48"], ["mint-speedway", "Mint Speedway", "#ecfdf5", "#0d9488"]
  ];

  const state = {
    user: null, isAdmin: false, profile: { username: "Pilote", avatar: "" },
    conv: null, pilots: [], channelsLoaded: false,
    msgs: new Map(), lastCount: 0, firstRender: true, newBelow: 0,
    replyTo: null, photo: null, photoUrl: "", sending: false, unsub: null, filter: "",
    clubs: [], convs: new Map(), seenBy: new Map(), seenUnsubs: new Map(), unsubConvs: null, showPicker: false
  };

  const desktop = () => window.matchMedia("(min-width: 861px)").matches;
  const coarse = () => window.matchMedia("(pointer: coarse)").matches;
  const app = $("chat-app");
  const scroller = $("chat-messages-container");

  function setView(v) { app.dataset.view = v; }

  // ------------------------------------------------------------------ routage
  function parseHash() {
    const h = location.hash.slice(1);
    if (!h) return null;
    const [t, ...r] = h.split("/");
    const id = decodeURIComponent(r.join("/"));
    if (t === "global") return { type: "global", id: "global" };
    if (t === "channel" && id) return { type: "channel", id };
    if (t === "club" && id) return { type: "club", id };
    if (t === "dm" && id) return { type: "private", id };
    return null;
  }
  const hashFor = (c) => (c.type === "global" ? "#global" : c.type === "channel" ? "#channel/" + encodeURIComponent(c.id) : c.type === "club" ? "#club/" + encodeURIComponent(c.id) : "#dm/" + encodeURIComponent(c.id));

  function route() {
    if (!state.user) return;
    const c = parseHash();
    if (!c) {
      if (desktop()) { location.replace("#global"); return; }
      closeConversation();
      setView("list");
      return;
    }
    openConversation(c);
  }

  // ---- « il y a… »
  function ago(ms) {
    if (!ms) return "";
    const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (s < 45) return "à l'instant";
    const m = Math.round(s / 60);
    if (m < 60) return "il y a " + m + " min";
    const h = Math.round(m / 60);
    if (h < 24) return "il y a " + h + " h";
    const d = Math.round(h / 24);
    if (d < 7) return "il y a " + d + " j";
    if (d < 60) return "il y a " + Math.round(d / 7) + " sem.";
    return "il y a " + Math.round(d / 30) + " mois";
  }
  const convIdOf = (other) => [state.user.uid, other].sort().join("_");
  const msOf = (t) => (t && t.toMillis ? t.toMillis() : t && t.seconds ? t.seconds * 1000 : 0);

  // ---- liste des conversations privées : private_chats/{conv} = { uids, lastUid, lastName, lastText, lastAt }
  function watchConvs() {
    if (state.unsubConvs) { state.unsubConvs(); state.unsubConvs = null; }
    state.unsubConvs = db.collection("private_chats").where("uids", "array-contains", state.user.uid).onSnapshot((snap) => {
      const next = new Map();
      snap.forEach((d) => {
        const v = d.data({ serverTimestamps: "estimate" });
        const other = (v.uids || []).find((u) => u !== state.user.uid);
        if (!other) return;
        next.set(other, { other, otherName: v.lastUid !== state.user.uid ? v.lastName || "" : "", lastUid: v.lastUid, lastName: v.lastName, lastText: v.lastText, lastAt: msOf(v.lastAt) || Date.now() });
      });
      state.convs = next;
      next.forEach((c, other) => {
        MA.unread.watch("dm:" + other, db.collection("private_chats").doc(convIdOf(other)).collection("messages"));
        if (!state.seenUnsubs.has(other)) {
          state.seenUnsubs.set(other, db.collection("private_chats").doc(convIdOf(other)).collection("seen").doc(other).onSnapshot((sd) => {
            state.seenBy.set(other, sd.exists ? msOf(sd.data().at) : 0);
            renderLists();
          }, () => {}));
        }
      });
      renderLists();
    }, (err) => console.warn("Liste des conversations indisponible (règles à republier ?) :", err.message));
  }
  // enregistre le dernier message dans le résumé de conversation
  function touchSummary(conv, text) {
    if (!conv || conv.type !== "private" || !state.user) return;
    const ids = [state.user.uid, conv.id].sort();
    db.collection("private_chats").doc(ids.join("_")).set({
      uids: ids, lastUid: state.user.uid, lastName: (state.profile.username || "Pilote").slice(0, 40),
      lastText: String(text || "").replace(/\s+/g, " ").slice(0, 120), lastAt: FieldValue.serverTimestamp()
    }, { merge: true }).catch(() => { /* règles non publiées : liste simplement moins vivante */ });
  }

  /** après suppression du dernier message : l'aperçu de la liste reprend le message précédent */
  function refreshSummary(conv, prev) {
    if (!conv || conv.type !== "private" || !state.user) return;
    const ids = [state.user.uid, conv.id].sort();
    const text = prev ? (prev.text || (prev.mediaUrl ? "📷 Photo" : prev.tradeId ? "🃏 Proposition d'échange" : "")) : "";
    db.collection("private_chats").doc(ids.join("_")).set({
      uids: ids, lastUid: prev && ids.includes(prev.uid) ? prev.uid : state.user.uid, lastName: String(prev ? prev.pilot || prev.username || "Pilote" : state.profile.username || "Pilote").slice(0, 40),
      lastText: String(text).replace(/\s+/g, " ").slice(0, 120), lastAt: FieldValue.serverTimestamp()
    }, { merge: true }).catch(() => {});
  }

  // ------------------------------------------------------------ listes (gauche)
  function convName(c) {
    if (c.type === "global") return "Salon général";
    if (c.type === "channel") { const f = MA.unread.channels().find((x) => x.id === c.id); return f ? f.name : c.id; }
    if (c.type === "club") { const k = clubOf(c.id); return k ? k.name : "Club"; }
    const p = state.pilots.find((x) => x.id === c.id);
    return p ? p.username || "Pilote" : c.name || "Pilote";
  }
  // ---- canaux de club : clubs/{id}/chat — membres du club + admins (modération)
  const clubOf = (id) => state.clubs.find((k) => k.id === id) || null;
  async function loadClubs() {
    const out = new Map();
    try {
      const mem = await db.collection("club_members").where("uid", "==", state.user.uid).limit(50).get();
      const docs = await Promise.all(mem.docs.map((d) => db.collection("clubs").doc(d.data().clubId).get().catch(() => null)));
      docs.forEach((d) => { if (d && d.exists && d.data().chatEnabled) out.set(d.id, Object.assign({ id: d.id, mine: true }, d.data(), { name: d.data().chatName || d.data().name || "Club" })); });
      if (state.isAdmin) { const all = await db.collection("clubs").where("chatEnabled", "==", true).limit(100).get(); all.forEach((d) => { if (!out.has(d.id)) out.set(d.id, Object.assign({ id: d.id, mine: false }, d.data(), { name: d.data().chatName || d.data().name || "Club" })); }); }
    } catch (e) { console.warn("Canaux de club :", e.code || e.message); }
    state.clubs = Array.from(out.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
    renderLists();
    const h = parseHash();
    if (h && h.type === "club") { if (state.conv && state.conv.type === "club") updateHeader(); else route(); }
  }
  const isActive = (type, id) => state.conv && state.conv.type === type && state.conv.id === id;

  function renderLists() {
    const q = normalize(state.filter.trim());
    const match = (name) => !q || normalize(name).includes(q);

    const chans = [{ type: "global", id: "global", name: "Salon général", icon: "🌐" }]
      .concat(MA.unread.channels().map((c) => ({ type: "channel", id: c.id, name: c.name, icon: "#" })))
      .concat(state.clubs.map((k) => ({ type: "club", id: k.id, name: k.name + (k.mine ? "" : " (modération)"), icon: "🏁" })))
      .filter((c) => match(c.name));
    $("chat-channels-list").innerHTML = chans.length ? chans.map((c) => {
      const unread = MA.unread.has(MA.chatKey(c)) && !isActive(c.type, c.id);
      const del = state.isAdmin && c.type === "channel"
        ? `<button type="button" class="conv-del" data-action="delete-channel" data-id="${esc(c.id)}" aria-label="Supprimer le canal ${esc(c.name)}" title="Supprimer ce canal">&times;</button>` : "";
      return `<div class="conv-item ${isActive(c.type, c.id) ? "active" : ""} ${unread ? "has-unread" : ""}" role="button" tabindex="0" data-action="open" data-type="${c.type}" data-id="${esc(c.id)}">
        <span class="conv-ico">${esc(c.icon)}</span>
        <span class="conv-name">${esc(c.name)}</span>
        ${unread ? `<span class="unread-pip" aria-label="Nouveaux messages"></span>` : ""}${del}
      </div>`;
    }).join("") : `<div class="empty-note small">Aucun canal.</div>`;

    // --- conversations privées : les plus récentes en haut, aperçu + « il y a… »
    const pilotOf = (id) => state.pilots.find((x) => x.id === id);
    const convRows = Array.from(state.convs.values())
      .filter((c) => c.lastAt)
      .map((c) => ({ c, p: pilotOf(c.other) }))
      .filter((r) => match((r.p && r.p.username) || r.c.otherName || ""))
      .sort((a, b) => b.c.lastAt - a.c.lastAt);
    $("chat-convs-list").innerHTML = convRows.length ? convRows.map(({ c, p }) => {
      const name = (p && p.username) || c.otherName || "Pilote";
      const mine = c.lastUid === state.user.uid;
      const unread = MA.unread.has("dm:" + c.other) && !isActive("private", c.other);
      let meta = ago(c.lastAt);
      let status = "";
      if (mine) {
        const seenAt = state.seenBy.get(c.other) || 0;
        status = seenAt && seenAt >= c.lastAt - 1500 ? `<span class="dm-status seen">Vu ${esc(ago(seenAt))}</span>` : `<span class="dm-status">Envoyé ${esc(ago(c.lastAt))}</span>`;
      }
      const preview = (mine ? "Toi : " : "") + (c.lastText || "…");
      return `<div class="conv-item dm ${isActive("private", c.other) ? "active" : ""} ${unread ? "has-unread" : ""}" role="button" tabindex="0" data-action="open" data-type="private" data-id="${esc(c.other)}" data-name="${esc(name)}">
        <img class="avatar" src="${esc(safeUrl(p && p.avatar) || FALLBACK_AVATAR)}" alt="" loading="lazy" data-fallback="avatar">
        <span class="dm-body">
          <span class="dm-top"><span class="conv-name">${esc(name)}</span><time class="dm-ago">${esc(meta)}</time></span>
          <span class="dm-preview">${esc(preview)}</span>
          ${status ? `<span class="dm-sub">${status}</span>` : ""}
        </span>
        ${unread ? `<span class="unread-pip" aria-label="Nouveaux messages"></span>` : ""}
      </div>`;
    }).join("") : `<div class="empty-note small">${state.convs.size ? "Aucune conversation trouvée." : "Aucune discussion pour l'instant. Touche « ✉ Nouveau » pour écrire à un pilote."}</div>`;

    // --- sélecteur de pilote (nouvelle conversation) : visible à la demande ou pendant une recherche
    const showPicker = state.showPicker || !!q;
    $("dm-picker").hidden = !showPicker;
    $("new-dm-btn").setAttribute("aria-expanded", String(state.showPicker));
    if (showPicker) {
      const pilots = state.pilots.filter((p) => match(p.username || ""));
      $("chat-private-pilots-list").innerHTML = pilots.length ? pilots.map((p) => `
      <div class="conv-item ${isActive("private", p.id) ? "active" : ""}" role="button" tabindex="0" data-action="open" data-type="private" data-id="${esc(p.id)}" data-name="${esc(p.username || "Pilote")}">
        <img class="avatar sm" src="${esc(safeUrl(p.avatar) || FALLBACK_AVATAR)}" alt="" loading="lazy" data-fallback="avatar">
        <span class="conv-name">${esc(p.username || "Pilote")}</span>
      </div>`).join("") : `<div class="empty-note small">${state.pilots.length ? "Aucun pilote trouvé." : "Aucun autre pilote pour l'instant."}</div>`;
    }

    const dot = MA.unread.count() > 0;
    document.title = (dot && document.hidden ? "● " : "") + "Salon des pilotes | MOTORAUTO";
  }

  async function loadPilots() {
    try {
      const snap = await db.collection("users").limit(200).get();
      state.pilots = [];
      snap.forEach((d) => { if (d.id !== state.user.uid) state.pilots.push(Object.assign({ id: d.id }, d.data())); });
      state.pilots.sort((a, b) => String(a.username || "").localeCompare(String(b.username || ""), "fr"));
    } catch (err) { console.error("Liste des pilotes :", err); }
    renderLists();
    if (state.conv) updateHeader();
  }

  // ------------------------------------------------------------ conversation
  function updateHeader() {
    const c = state.conv;
    if (!c) return;
    const name = convName(c);
    const badge = $("conv-badge");
    if (c.type === "private") {
      const p = state.pilots.find((x) => x.id === c.id);
      badge.innerHTML = `<img class="avatar" src="${esc(safeUrl(p && p.avatar) || FALLBACK_AVATAR)}" alt="" data-fallback="avatar">`;
      $("chat-header-title").textContent = name;
      $("chat-header-sub").textContent = "Conversation privée entre vous deux";
    } else if (c.type === "global") {
      badge.textContent = "🌐";
      $("chat-header-title").textContent = "Salon général";
      $("chat-header-sub").textContent = "Canal public de la communauté";
    } else if (c.type === "club") {
      const k = clubOf(c.id);
      badge.textContent = "🏁";
      $("chat-header-title").textContent = name;
      $("chat-header-sub").textContent = "Canal privé du club · membres et administrateurs" + (k && k.viceName ? " · vice-président : " + k.viceName : "");
    } else {
      badge.textContent = "#";
      $("chat-header-title").textContent = name;
      $("chat-header-sub").textContent = "Canal thématique";
    }
    {
      const narrow = window.innerWidth < 480, cut = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
      $("chat-input-message").placeholder = narrow
        ? (c.type === "private" ? "Écrire…" : c.type === "channel" || c.type === "club" ? cut(`#${name}`, 14) : "Message…")
        : (c.type === "private" ? `Message à ${name}` : c.type === "channel" || c.type === "club" ? `Écrire dans #${name}` : "Écrire un message");
    }
  }

  function collection(c) {
    if (c.type === "global") return db.collection("global_chat");
    if (c.type === "channel") return db.collection("custom_channels").doc(c.id).collection("messages");
    if (c.type === "club") return db.collection("clubs").doc(c.id).collection("chat");
    return db.collection("private_chats").doc([state.user.uid, c.id].sort().join("_")).collection("messages");
  }

  function stopSub() {
    if (state.unsub) { state.unsub(); state.unsub = null; }
    if (state.unsubSeen) { state.unsubSeen(); state.unsubSeen = null; }
    state.otherSeen = 0; state.lastList = null;
  }
  // ---- « Vu » (messages privés) : private_chats/{conv}/seen/{uid} = { at }
  const seenRef = (uid) => db.collection("private_chats").doc([state.user.uid, state.conv.id].sort().join("_")).collection("seen").doc(uid);
  let seenTimer = 0;
  function markSeen() {
    if (!state.conv || !state.user || document.visibilityState === "hidden") return;
    const now = Date.now();
    if (now - seenTimer < 2500) return;
    seenTimer = now;
    if (state.conv.type !== "private") { groupSeenCol(state.conv).doc(state.user.uid).set({ at: FieldValue.serverTimestamp(), name: String(state.profile.username || "Pilote").slice(0, 40) }).catch(() => {}); return; }
    seenRef(state.user.uid).set({ at: FieldValue.serverTimestamp() }).catch(() => {});
  }
  /** « vu par » des salons de groupe : global_seen/{uid} ou custom_channels/{id}/seen/{uid} = { at, name } */
  const groupSeenCol = (c) => (c.type === "global" ? db.collection("global_seen") : c.type === "club" ? db.collection("clubs").doc(c.id).collection("seen") : db.collection("custom_channels").doc(c.id).collection("seen"));
  function watchSeen(c) {
    if (c.type !== "private") {
      state.groupSeen = new Map();
      state.unsubSeen = groupSeenCol(c).limit(200).onSnapshot((snap) => {
        const m = new Map();
        snap.forEach((d) => { const v = d.data(), at = v.at && v.at.toMillis ? v.at.toMillis() : 0; if (at) m.set(d.id, { at, name: v.name || "Pilote" }); });
        state.groupSeen = m; paintReceipt();
      }, () => { /* règles non publiées : pas de « vu par » */ });
      markSeen();
      return;
    }
    state.unsubSeen = seenRef(c.id).onSnapshot((d) => {
      const at = d.exists && d.data().at;
      state.otherSeen = at && at.toMillis ? at.toMillis() : at && at.seconds ? at.seconds * 1000 : 0;
      paintReceipt();
    }, () => { /* règles non publiées : pas de « vu » */ });
    markSeen();
  }
  function groupReceiptHtml(list) {
    const last = list[list.length - 1];
    if (!last || !last.timestamp || !state.groupSeen) return "";
    const sent = last.timestamp.toMillis();
    const who = [...state.groupSeen.entries()].filter(([uid, v]) => uid !== state.user.uid && uid !== last.uid && v.at >= sent - 1500).sort((a, b) => b[1].at - a[1].at).map(([, v]) => v.name);
    if (!who.length) return "";
    const shown = who.slice(0, 3).map(esc).join(", "), more = who.length - 3;
    return `<div class="seen-receipt seen group" role="status">Vu par ${shown}${more > 0 ? " et " + more + " autre" + (more > 1 ? "s" : "") : ""}</div>`;
  }
  function receiptHtml(list) {
    if (state.conv && state.conv.type !== "private" && list && list.length) return groupReceiptHtml(list);
    if (!state.conv || state.conv.type !== "private" || !list || !list.length) return "";
    const last = list[list.length - 1];
    if (!last || last.uid !== state.user.uid || !last.timestamp) return "";
    const sent = last.timestamp.toMillis();
    const seen = state.otherSeen && state.otherSeen >= sent - 1500;
    return `<div class="seen-receipt ${seen ? "seen" : ""}" role="status">${seen ? "Vu " + esc(ago(state.otherSeen)) + " · " + esc(timeFmt.format(new Date(state.otherSeen))) : "Envoyé " + esc(ago(sent))}</div>`;
  }
  function paintReceipt() {
    if (!state.lastList) return;
    const old = scroller.querySelector(".seen-receipt");
    if (old) old.remove();
    const h = receiptHtml(state.lastList);
    if (h) { const stick = nearBottom(); scroller.insertAdjacentHTML("beforeend", h); if (stick) toBottom(false); }
  }
  function closeConversation() { stopSub(); state.conv = null; MA.unread.setActive(null); MA.notif.activeLink = null; renderLists(); }

  async function openConversation(c) {
    if (state.conv && state.conv.type === c.type && state.conv.id === c.id && state.unsub) { setView("conv"); return; }
    stopSub();
    state.conv = c;
    state.msgs = new Map(); state.lastCount = 0; state.firstRender = true; state.newBelow = 0;
    clearReply(); clearPhoto(); hideEmoji();
    $("jump-latest").hidden = true;
    scroller.innerHTML = `<div class="msg-empty"><span class="spinner"></span><span>Chargement des messages…</span></div>`;
    if (c.type === "private" && !state.pilots.find((p) => p.id === c.id)) {
      try {
        const d = await db.collection("users").doc(c.id).get();
        if (d.exists) state.pilots.push(Object.assign({ id: d.id }, d.data()));
      } catch (_) { /* nom générique */ }
      if (!state.conv || state.conv.id !== c.id) return; // l'utilisateur a changé de conversation entre-temps
    }
    updateHeader();
    MA.unread.setActive(MA.chatKey(c));
    MA.notif.activeLink = "chat.html" + hashFor(c);
    MA.notif.items().filter((n) => !n.read && n.link === MA.notif.activeLink).forEach((n) => MA.notif.markRead(n.id));
    renderLists();
    setView("conv");
    subscribe(c);
    watchSeen(c);
    if (desktop()) $("chat-input-message").focus();
  }

  function subscribe(c) {
    const key = MA.chatKey(c);
    state.unsub = collection(c).orderBy("timestamp", "desc").limit(150).onSnapshot((snap) => {
      if (!state.conv || MA.chatKey(state.conv) !== key) return;
      const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" }))).reverse();
      const foreign = list.filter((m) => m.uid !== state.user.uid).length;
      const prevForeign = state.lastCount;
      state.lastCount = foreign;
      state.msgs = new Map(list.map((m) => [m.id, m]));
      state.lastList = list;
      render(list, foreign - prevForeign);
      if (foreign > 0) markSeen();
      MA.unread.setActive(key);
    }, (err) => {
      console.error("Erreur salon :", err);
      scroller.innerHTML = `<div class="msg-empty error"><b>Impossible de charger cette conversation.</b><span>${esc(err.code === "permission-denied" ? "Tu n'as pas accès à ces messages." : "Vérifie ta connexion puis recharge la page.")}</span></div>`;
    });
  }

  // ------------------------------------------------------------------ rendu
  const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
  function dayLabel(d) {
    const today = new Date(); const y = new Date(); y.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === y.toDateString()) return "Hier";
    return dayFmt.format(d);
  }
  function linkify(text) {
    const me = MA.mentionToken(state.profile.username).toLowerCase();
    return esc(text)
      .replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`)
      .replace(/(^|[\s(>])@([\p{L}\p{N}_.-]{2,24})/gu, (_, pre, tok) => `${pre}<span class="mention${tok.toLowerCase() === me ? " me" : ""}">@${tok}</span>`);
  }

  function audioHtml(m) {
    const u = safeUrl(m.audioUrl); if (!u) return "";
    const sec = Math.round((Number(m.audioMs) || 0) / 1000);
    return `<div class="voice-msg"><audio controls preload="none" src="${esc(u)}"></audio><small>${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}</small></div>`;
  }
  function carCardHtml(m) {
    if (!m.carId) return "";
    const img = safeUrl(m.carImage);
    return `<a class="car-share" href="index.html#/voiture/${encodeURIComponent(m.carId)}" target="_blank" rel="noopener">${img ? `<img src="${esc(img)}" alt="" loading="lazy" data-fallback="car">` : ""}<span><small>Fiche véhicule</small><b>${esc(m.carName || m.carId)}</b></span></a>`;
  }
  const TRADE_LABEL = { open: "En attente de réponse", accepted: "Échange réalisé 🎉", declined: "Refusé", cancelled: "Annulé" };
  function tradeCardHtml(m) {
    if (!m.tradeId) return "";
    const st = m.tradeStatus || "open";
    const mine = m.uid === state.user.uid;
    const buttons = st !== "open" ? "" : mine
      ? `<button type="button" class="trade-btn ghost" data-action="trade-cancel" data-trade="${esc(m.tradeId)}">Annuler ma proposition</button>`
      : `<button type="button" class="trade-btn yes" data-action="trade-accept" data-trade="${esc(m.tradeId)}">✓ Accepter</button><button type="button" class="trade-btn no" data-action="trade-decline" data-trade="${esc(m.tradeId)}">✕ Refuser</button>`;
    return `<div class="trade-card st-${esc(st)}">
      <div class="tc-head"><span>🃏 Proposition d'échange</span><b class="tc-st">${esc(TRADE_LABEL[st] || st)}</b></div>
      <div class="tc-body">
        <div class="tc-side"><small>${mine ? "Tu donnes" : "Il donne"}</small><b>${esc(m.tradeGiveName || "une carte")}</b></div>
        <div class="tc-arrow" aria-hidden="true">⇄</div>
        <div class="tc-side"><small>${mine ? "Tu reçois" : "Tu donnes"}</small><b>${esc(m.tradeWantName || "une carte")}</b></div>
      </div>
      ${m.tradeNote ? `<p class="tc-note">« ${esc(m.tradeNote)} »</p>` : ""}
      ${buttons ? `<div class="tc-actions">${buttons}</div>` : ""}
    </div>`;
  }
  async function tradeAct(btn, name, payload, okMsg) {
    btn.disabled = true;
    try {
      const r = await window.MAGameAPI.call(name, payload);
      if (r && r.ok === false) MA.toast(r.message || "Échange impossible.", "err"); else MA.toast(okMsg, "ok");
    } catch (err) { MA.toast(err.message || "Action impossible.", "err"); btn.disabled = false; }
  }
  function renderMessage(m, first, grouped) {
    const mine = m.uid === state.user.uid;
    const d = m.timestamp ? m.timestamp.toDate() : new Date();
    const media = safeUrl(m.mediaUrl, { allowData: true });
    const kc = state.conv && state.conv.type === "club" ? clubOf(state.conv.id) : null, canDelete = state.isAdmin || mine || (kc && (kc.ownerUid === state.user.uid || kc.viceUid === state.user.uid));
    const quote = m.replyTo ? `<div class="quote"><b>${esc(m.replyTo.pilot)}</b><span>${esc(m.replyTo.text)}</span></div>` : "";
    let reactions = "";
    if (m.reactions) {
      const pills = Object.entries(m.reactions).filter(([, u]) => Array.isArray(u) && u.length).map(([e, u]) =>
        `<button type="button" class="react-pill ${u.includes(state.user.uid) ? "on" : ""}" data-action="react" data-id="${esc(m.id)}" data-emoji="${esc(e)}" aria-label="Réaction ${esc(e)}, ${u.length}">${esc(e)} <span>${u.length}</span></button>`);
      if (pills.length) reactions = `<div class="reactions">${pills.join("")}</div>`;
    }
    const avatar = first
      ? `<img class="avatar" src="${esc(safeUrl(m.avatar) || FALLBACK_AVATAR)}" alt="" loading="lazy" data-fallback="avatar" data-action="profile" data-uid="${esc(m.uid)}" title="Voir le profil">`
      : `<span class="avatar-spacer"></span>`;
    return `
      <article class="msg ${mine ? "mine" : "theirs"} ${grouped ? "grouped" : ""}" data-id="${esc(m.id)}">
        ${mine ? "" : avatar}
        <div class="msg-col">
          ${first ? `<header class="msg-meta"><button type="button" class="msg-author" data-action="profile" data-uid="${esc(m.uid)}">${esc(mine ? "Toi" : m.pilot || "Pilote")}</button>${MA.admins.tag(m.uid)}<time>${esc(timeFmt.format(d))}</time></header>` : ""}
          <div class="bubble" title="${esc(timeFmt.format(d))}">
            ${quote}
            ${m.text && !m.tradeId ? `<p class="txt">${linkify(m.text)}</p>` : ""}
            ${carCardHtml(m)}
            ${tradeCardHtml(m)}
            ${audioHtml(m)}
            ${media ? `<img class="photo" src="${esc(media)}" alt="Photo partagée" loading="lazy" data-action="lightbox" data-src="${esc(media)}">` : ""}
          </div>
          ${reactions}
          <div class="msg-actions" role="toolbar" aria-label="Actions sur le message">
            ${EMOJIS.map((e) => `<button type="button" data-action="react" data-id="${esc(m.id)}" data-emoji="${e}" aria-label="Réagir ${e}">${e}</button>`).join("")}
            <span class="sep"></span>
            <button type="button" data-action="reply" data-id="${esc(m.id)}" aria-label="Répondre" title="Répondre">↩</button>
            ${mine ? "" : `<button type="button" data-action="report-msg" data-id="${esc(m.id)}" aria-label="Signaler" title="Signaler ce message">⚑</button>`}
            ${canDelete ? `<button type="button" class="danger" data-action="delete-msg" data-id="${esc(m.id)}" aria-label="Supprimer" title="Supprimer">🗑</button>` : ""}
          </div>
        </div>
      </article>`;
  }

  function nearBottom() { return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 140; }
  function toBottom(smooth) { scroller.scrollTo({ top: scroller.scrollHeight, behavior: smooth ? "smooth" : "auto" }); }

  function render(list, newForeign) {
    if (list.length === 0) {
      const c = state.conv;
      scroller.innerHTML = `<div class="msg-empty"><svg viewBox="0 0 64 64" class="empty-ico" aria-hidden="true"><path d="M12 46 26 18h8L20 46zm18 0 14-28h8L38 46z"/></svg><b>Aucun message pour l'instant</b><span>${c.type === "private" ? "Lance la discussion avec un premier message." : "Sois le premier à écrire dans ce canal."}</span></div>`;
      return;
    }
    const stick = state.firstRender || nearBottom();
    const keepFromBottom = scroller.scrollHeight - scroller.scrollTop;
    let html = "", prevDay = "", prev = null, prevDate = 0;
    for (const m of list) {
      const d = m.timestamp ? m.timestamp.toDate() : new Date();
      const day = d.toDateString();
      if (day !== prevDay) { html += `<div class="day-sep"><span>${esc(dayLabel(d))}</span></div>`; prevDay = day; prev = null; }
      const grouped = !!prev && prev.uid === m.uid && d - prevDate < 5 * 60000 && !m.replyTo;
      html += renderMessage(m, !grouped, grouped);
      prev = m; prevDate = d;
    }
    scroller.innerHTML = html + receiptHtml(list);
    if (stick) { toBottom(false); state.newBelow = 0; $("jump-latest").hidden = true; }
    else {
      scroller.scrollTop = scroller.scrollHeight - keepFromBottom;
      if (newForeign > 0) { state.newBelow += newForeign; showJump(); }
    }
    state.firstRender = false;
  }
  function showJump() {
    $("jump-latest").hidden = false;
    $("jump-count").textContent = state.newBelow > 0 ? String(state.newBelow) : "";
  }

  // --------------------------------------------------------------- composer
  /** réponses toutes prêtes (administrateurs) : un menu dans la barre de saisie qui insère le texte choisi */
  async function loadCannedReplies() {
    try {
      const snap = await db.collection("canned_replies").limit(50).get();
      const list = snap.docs.map((d) => d.data()).filter((c) => c.title && c.text);
      let sel = $("canned-select");
      if (!list.length) { if (sel) sel.hidden = true; return; }
      if (!sel) {
        sel = document.createElement("select"); sel.id = "canned-select"; sel.className = "canned-select"; sel.setAttribute("aria-label", "Réponse rapide");
        $("chat-send-form").insertBefore(sel, $("chat-input-message"));
        sel.addEventListener("change", () => {
          const t = $("chat-input-message"); if (!sel.value) return;
          t.value = (t.value ? t.value + "\n" : "") + sel.value; sel.value = ""; autosize(); t.focus();
        });
      }
      sel.hidden = false;
      sel.innerHTML = `<option value="">⚡ Réponse rapide</option>` + list.map((c) => `<option value="${String(c.text).replace(/"/g, "&quot;")}">${String(c.title).replace(/</g, "&lt;")}</option>`).join("");
    } catch (_) { /* collection absente ou règles non publiées : le menu reste caché */ }
  }

  function autosize() {
    const t = $("chat-input-message");
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 140) + "px";
  }
  function setReply(id) {
    const m = state.msgs.get(id);
    if (!m) return;
    const text = m.text || "📷 Photo";
    state.replyTo = { uid: m.uid, pilot: String(m.pilot || "Pilote").slice(0, 40), text: text.slice(0, 80) };
    $("reply-author-name").textContent = state.replyTo.pilot;
    $("reply-text-preview").textContent = text.length > 70 ? text.slice(0, 70) + "…" : text;
    $("chat-reply-preview").hidden = false;
    $("chat-input-message").focus();
  }
  function clearReply() { state.replyTo = null; $("chat-reply-preview").hidden = true; }
  function clearPhoto() {
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    state.photo = null; state.photoUrl = ""; $("chat-media-input").value = ""; $("chat-photo-preview-bar").hidden = true;
  }
  function hideEmoji() { $("emoji-panel").hidden = true; $("emoji-toggle").setAttribute("aria-expanded", "false"); }

  async function send() {
    if (state.sending || !state.user || !state.conv) return;
    const input = $("chat-input-message");
    const text = input.value.trim().slice(0, 1000);
    if (!text && !state.photo) return;
    if (MA.mute && MA.mute.active()) { MA.toast(MA.mute.message(), "err"); return; }
    state.sending = true;
    $("send-btn").disabled = true;
    try {
      let mediaUrl = "";
      if (state.photo) {
        if (!storage) throw new Error("Firebase Storage n'est pas chargé.");
        // Photo d'origine conservée (jusqu'à 20 Mo) si le navigateur sait l'afficher ; sinon (HEIC…) conversion en JPEG haute qualité.
        const f = state.photo;
        const native = /^image\/(jpeg|png|webp|gif)$/.test(f.type);
        const blob = native ? f : await MA.resizeImage(f, 4096, 0.9);
        if (blob.size >= 20 * 1024 * 1024) throw new Error("Photo trop lourde (20 Mo maximum).");
        const ext = native ? f.type.split("/")[1].replace("jpeg", "jpg") : "jpg";
        const ref = storage.ref(`chat_media/${state.user.uid}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`);
        await ref.put(blob, { contentType: native ? f.type : "image/jpeg" });
        mediaUrl = await ref.getDownloadURL();
      }
      await collection(state.conv).add({
        uid: state.user.uid, pilot: (state.profile.username || "Pilote").slice(0, 40),
        avatar: safeUrl(state.profile.avatar) || "", text, mediaUrl,
        replyTo: state.replyTo, reactions: {}, timestamp: FieldValue.serverTimestamp()
      });
      notifyAfterSend(text, state.replyTo, state.conv);
      touchSummary(state.conv, text || (mediaUrl ? "📷 Photo" : ""));
      input.value = ""; autosize(); clearPhoto(); clearReply(); hideEmoji(); hideMentions();
      state.firstRender = true; // force le défilement vers son propre message
    } catch (err) {
      MA.toast("Envoi impossible : " + (err.code === "permission-denied" ? "action refusée par les règles de sécurité." : err.message), "err");
    } finally {
      state.sending = false; $("send-btn").disabled = false;
    }
  }

  // ------------------------------------------------------------ messages vocaux
  const voice = { rec: null, chunks: [], start: 0, timer: 0, stream: null, mime: "" };
  const fmtT = (ms) => { const t = Math.floor(ms / 1000); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
  function stopStream() { if (voice.stream) voice.stream.getTracks().forEach((t) => t.stop()); voice.stream = null; clearInterval(voice.timer); }
  async function startVoice() {
    if (voice.rec || !state.conv) return;
    if (MA.mute && MA.mute.active()) { MA.toast(MA.mute.message(), "err"); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { MA.toast("L'enregistrement vocal n'est pas disponible sur ce navigateur.", "err"); return; }
    try {
      voice.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
      voice.mime = mime; voice.chunks = [];
      voice.rec = new MediaRecorder(voice.stream, mime ? { mimeType: mime } : undefined);
      voice.rec.ondataavailable = (e) => { if (e.data && e.data.size) voice.chunks.push(e.data); };
      voice.rec.start(250); voice.start = Date.now();
      $("voice-bar").hidden = false; $("voice-btn").classList.add("rec");
      $("voice-time").textContent = "0:00";
      voice.timer = setInterval(() => { const el = Date.now() - voice.start; $("voice-time").textContent = fmtT(el); if (el >= 120000) finishVoice(true); }, 250);
    } catch (e) {
      stopStream(); voice.rec = null;
      MA.toast(e && e.name === "NotAllowedError" ? "Autorise le micro dans ton navigateur pour envoyer un vocal." : "Micro indisponible.", "err");
    }
  }
  function cancelVoice() {
    if (voice.rec && voice.rec.state !== "inactive") { voice.rec.onstop = null; voice.rec.stop(); }
    stopStream(); voice.rec = null; voice.chunks = []; $("voice-bar").hidden = true; $("voice-btn").classList.remove("rec");
  }
  function finishVoice(auto) {
    if (!voice.rec) return;
    const rec = voice.rec, ms = Date.now() - voice.start, mime = voice.mime || rec.mimeType || "audio/webm";
    $("voice-label").textContent = auto ? "Durée maximale atteinte : envoi…" : "Envoi…";
    rec.onstop = async () => {
      stopStream();
      const blob = new Blob(voice.chunks, { type: mime.split(";")[0] });
      voice.rec = null; voice.chunks = [];
      try {
        if (ms < 700 || blob.size < 500) throw new Error("Message trop court.");
        if (blob.size > 5 * 1024 * 1024) throw new Error("Message trop lourd.");
        const ext = /mp4/.test(mime) ? "m4a" : /ogg/.test(mime) ? "ogg" : "webm";
        const ref = storage.ref(`chat_voice/${state.user.uid}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`);
        await ref.put(blob, { contentType: blob.type });
        const audioUrl = await ref.getDownloadURL();
        await postMessage({ audioUrl, audioMs: Math.min(120000, ms) }, "🎤 Message vocal");
      } catch (e) { MA.toast("Vocal non envoyé : " + (e.message || "erreur"), "err"); }
      $("voice-bar").hidden = true; $("voice-btn").classList.remove("rec"); $("voice-label").textContent = "Enregistrement…";
    };
    rec.stop();
  }
  async function postMessage(extra, snippet) {
    await collection(state.conv).add(Object.assign({
      uid: state.user.uid, pilot: (state.profile.username || "Pilote").slice(0, 40),
      avatar: safeUrl(state.profile.avatar) || "", text: "", mediaUrl: "",
      replyTo: state.replyTo, reactions: {}, timestamp: FieldValue.serverTimestamp()
    }, extra));
    notifyAfterSend(snippet, state.replyTo, state.conv);
    touchSummary(state.conv, snippet);
    clearReply(); state.firstRender = true;
  }

  async function react(id, emoji) {
    if (!EMOJIS.includes(emoji) || !state.conv) return;
    const m = state.msgs.get(id);
    const on = m && m.reactions && Array.isArray(m.reactions[emoji]) && m.reactions[emoji].includes(state.user.uid);
    try {
      await collection(state.conv).doc(id).update(new FieldPath("reactions", emoji),
        on ? FieldValue.arrayRemove(state.user.uid) : FieldValue.arrayUnion(state.user.uid));
    } catch (err) { console.error(err); MA.toast("Réaction impossible.", "err"); }
  }

  async function deleteMessage(id) {
    const m = state.msgs.get(id);
    const kc2 = state.conv && state.conv.type === "club" ? clubOf(state.conv.id) : null;
    if (!m || !(state.isAdmin || m.uid === state.user.uid || (kc2 && (kc2.ownerUid === state.user.uid || kc2.viceUid === state.user.uid)))) return;
    if (!confirm("Supprimer ce message pour tout le monde ?")) return;
    try {
      const remaining = [...state.msgs.values()].filter((x) => x.id !== id && x.timestamp).sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      const wasLast = !remaining.length || (state.msgs.get(id).timestamp && state.msgs.get(id).timestamp.toMillis() >= remaining[remaining.length - 1].timestamp.toMillis());
      await collection(state.conv).doc(id).delete();
      if (wasLast) refreshSummary(state.conv, remaining[remaining.length - 1]);
      if (state.isAdmin && m.uid !== state.user.uid) {
        db.collection("admin_log").add({ by: state.user.uid, byName: String(state.profile.username || "Admin").slice(0, 40), action: "chat-delete", target: String(m.uid || ""), targetName: String(m.pilot || "").slice(0, 80), detail: String(m.text || "📷 photo").slice(0, 120), createdAt: FieldValue.serverTimestamp() }).catch(() => {});
      }
    } catch (err) { MA.toast("Suppression impossible : " + err.message, "err"); }
  }

  // -------------------------------------------------------------- signalements
  let reportTarget = null;
  function openReport(id) {
    const m = state.msgs.get(id);
    if (!m || m.uid === state.user.uid) return;
    reportTarget = { id, m, path: collection(state.conv).doc(id).path };
    $("report-quote").textContent = (m.pilot || "Pilote") + " : " + (m.text || (m.mediaUrl ? "📷 Photo" : ""));
    $("report-details").value = ""; $("report-error").textContent = ""; $("report-reason").value = "insulte";
    $("report-send").disabled = false;
    $("report-modal").hidden = false;
  }
  async function sendReport() {
    if (!reportTarget) return;
    const { id, m, path } = reportTarget;
    $("report-send").disabled = true;
    try {
      await db.collection("reports").doc(state.user.uid + "_" + id).set({
        msgPath: path.slice(0, 200), msgId: id, msgUid: m.uid || "", msgPilot: String(m.pilot || "Pilote").slice(0, 40),
        msgText: String(m.text || (m.mediaUrl ? "📷 Photo" : "")).slice(0, 300),
        reporterUid: state.user.uid, reporter: String(state.profile.username || "Pilote").slice(0, 40),
        reason: $("report-reason").value, details: $("report-details").value.trim().slice(0, 200),
        status: "open", createdAt: FieldValue.serverTimestamp()
      });
      $("report-modal").hidden = true; reportTarget = null;
      MA.toast("Merci, le signalement a été transmis à l'administrateur.", "ok");
    } catch (err) {
      $("report-error").textContent = err.code === "permission-denied" ? "Tu as déjà signalé ce message (ou les règles Firestore sont à republier)." : "Envoi impossible : " + err.message;
      $("report-send").disabled = false;
    }
  }

  // ------------------------------------------------------------------ admin
  async function createChannel(name) {
    const display = name.trim().slice(0, 30);
    const id = normalize(display).replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
    if (!id) throw new Error("Nom de canal invalide.");
    if (MA.unread.channels().some((c) => c.id === id)) throw new Error("Ce canal existe déjà.");
    await db.collection("custom_channels").doc(id).set({ name: display, createdAt: FieldValue.serverTimestamp() });
    return id;
  }
  async function deleteChannel(id) {
    if (!state.isAdmin || !confirm(`Supprimer définitivement le canal « ${id} » et tous ses messages ?`)) return;
    try {
      const msgs = db.collection("custom_channels").doc(id).collection("messages");
      for (;;) {
        const snap = await msgs.limit(400).get();
        if (snap.empty) break;
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      await db.collection("custom_channels").doc(id).delete();
      MA.toast("Canal supprimé.", "ok");
      if (state.conv && state.conv.type === "channel" && state.conv.id === id) location.hash = "#global";
    } catch (err) { MA.toast("Suppression impossible : " + err.message, "err"); }
  }

  // ----------------------------------------------------------------- session
  function paintMuteBanner() {
    let b = document.getElementById("mute-banner");
    const form = $("chat-send-form");
    if (!MA.mute.active()) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("div"); b.id = "mute-banner"; b.className = "mute-banner"; b.setAttribute("role", "status"); form.parentNode.insertBefore(b, form); }
    b.textContent = MA.mute.message();
  }
  async function onUser(user) {
    state.user = user;
    $("chat-loading").hidden = true;
    if (!user) {
      stopSub(); MA.unread.stop(); MA.notif.stop(); state.conv = null;
      if (state.unsubConvs) { state.unsubConvs(); state.unsubConvs = null; }
      state.seenUnsubs.forEach((u) => u()); state.seenUnsubs.clear(); state.convs = new Map();
      $("chat-gate").hidden = false;
      $("side-me").hidden = true;
      app.dataset.view = "gate";
      return;
    }
    $("chat-gate").hidden = true;
    app.dataset.view = "list";
    const sup = await MA.checkSuper(user);
    state.isAdmin = sup || await MA.checkAdmin(user);
    if (sup) MA.registerAdmin(db, user);
    await MA.admins.load(db);
    MA.loginPing(db, user);
    await MA.mute.load(db, user);
    paintMuteBanner();
    try {
      const d = await db.collection("users").doc(user.uid).get();
      const p = d.exists ? d.data() : {};
      state.profile = { username: p.username || user.displayName || (user.email || "pilote").split("@")[0], avatar: p.avatar || user.photoURL || "" };
    } catch (_) {
      state.profile = { username: user.displayName || "Pilote", avatar: user.photoURL || "" };
    }
    $("me-name").textContent = state.profile.username;
    $("me-role").textContent = state.isAdmin ? "Administrateur" : "Pilote";
    $("me-avatar").src = safeUrl(state.profile.avatar) || FALLBACK_AVATAR;
    $("side-me").hidden = false;
    $("admin-add-channel-btn").hidden = !state.isAdmin;
    if (state.isAdmin) loadCannedReplies();

    MA.unread.start(user, db);
    MA.notif.start(user, db);
    loadPilots();
    loadClubs();
    watchConvs();
    renderLists();
    route();
  }

  // ---------------------------------------------------------------- notifications & mentions
  function notifyAfterSend(text, replyTo, conv) {
    if (!conv) return;
    const me = state.profile.username || "Pilote";
    const snippet = text || "📷 Photo";
    const link = "chat.html" + hashFor(conv);
    if (conv.type === "private") {
      // une seule notification par expéditeur : elle est simplement mise à jour à chaque message
      MA.notif.send(conv.id, { type: "dm", from: me, text: snippet, link: "chat.html#dm/" + encodeURIComponent(state.user.uid) }, "dm_" + state.user.uid);
      return;
    }
    const done = new Set([state.user.uid]);
    if (replyTo && replyTo.uid && !done.has(replyTo.uid)) {
      done.add(replyTo.uid);
      MA.notif.send(replyTo.uid, { type: "reply", from: me, text: snippet, link });
    }
    MA.parseMentions(text).forEach((tok) => {
      const p = state.pilots.find((x) => MA.mentionToken(x.username).toLowerCase() === tok);
      if (p && !done.has(p.id)) { done.add(p.id); MA.notif.send(p.id, { type: "mention", from: me, text: snippet, link }); }
    });
  }

  const mentionPop = $("mention-pop");
  let mentionList = [], mentionIdx = 0;
  function hideMentions() { mentionPop.hidden = true; mentionList = []; }
  function updateMentions() {
    const ta = $("chat-input-message");
    const before = ta.value.slice(0, ta.selectionStart);
    const m = before.match(/(^|\s)@([\p{L}\p{N}_.-]{0,24})$/u);
    if (!m || !state.conv || state.conv.type === "private") { hideMentions(); return; }
    const q = m[2].toLowerCase();
    mentionList = state.pilots.filter((p) => MA.mentionToken(p.username).toLowerCase().startsWith(q) && p.username).slice(0, 5);
    if (!mentionList.length) { hideMentions(); return; }
    mentionIdx = 0;
    mentionPop.innerHTML = mentionList.map((p, i) => `<button type="button" role="option" class="${i === 0 ? "on" : ""}" data-i="${i}"><img src="${esc(safeUrl(p.avatar) || FALLBACK_AVATAR)}" alt="" data-fallback="avatar"><span>${esc(p.username)}</span></button>`).join("");
    mentionPop.hidden = false;
  }
  function pickMention(i) {
    const p = mentionList[i];
    if (!p) return;
    const ta = $("chat-input-message");
    const pos = ta.selectionStart;
    const before = ta.value.slice(0, pos).replace(/@([\p{L}\p{N}_.-]{0,24})$/u, "@" + MA.mentionToken(p.username) + " ");
    ta.value = before + ta.value.slice(pos);
    ta.setSelectionRange(before.length, before.length);
    hideMentions(); ta.focus(); autosize();
  }

  // ------------------------------------------------------------------ événements
  function init() {
    MA.notif.mount($("notif-btn"));
    // thèmes
    $("theme-grid").innerHTML = THEMES.map(([id, label, bg, ac]) =>
      `<button type="button" class="theme-opt" data-set-theme="${id}"><i style="background:${bg};border-color:${ac}"></i><span>${esc(label)}</span></button>`).join("");
    MA.applyTheme(MA.store.get("motorauto_theme") || "onyx-carbon");
    $("new-dm-btn").addEventListener("click", () => { state.showPicker = !state.showPicker; renderLists(); if (state.showPicker) { const f = $("side-filter"); if (f) f.focus(); } });
    setInterval(() => { if (state.user && !document.hidden) renderLists(); }, 30000);
    $("theme-btn").addEventListener("click", () => { $("theme-sheet").hidden = false; });
    $("theme-close").addEventListener("click", () => { $("theme-sheet").hidden = true; });
    $("theme-grid").addEventListener("click", (e) => {
      const b = e.target.closest("[data-set-theme]");
      if (!b) return;
      MA.store.set("motorauto_theme", b.dataset.setTheme);
      MA.applyTheme(b.dataset.setTheme);
    });

    // clics délégués
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-action]");
      if (!t) {
        if (!e.target.closest(".emoji-panel, #emoji-toggle")) hideEmoji();
        const msg = e.target.closest(".msg");
        document.querySelectorAll(".msg.show-actions").forEach((n) => { if (n !== msg) n.classList.remove("show-actions"); });
        if (msg && coarse() && !e.target.closest("a, img, button")) msg.classList.toggle("show-actions");
        return;
      }
      const d = t.dataset;
      switch (d.action) {
        case "open": {
          const c = { type: d.type, id: d.id, name: d.name };
          if (c.type === "private") state.showPicker = false;
          const h = hashFor(c);
          if (location.hash === h) openConversation(c); else location.hash = h;
          break;
        }
        case "trade-accept": tradeAct(t, "respondTrade", { id: d.trade, accept: true }, "Échange réalisé 🎉 Les cartes sont dans ta collection."); break;
        case "trade-decline": tradeAct(t, "respondTrade", { id: d.trade, accept: false }, "Proposition refusée."); break;
        case "trade-cancel": tradeAct(t, "cancelTrade", { id: d.trade }, "Proposition annulée."); break;
        case "delete-channel": e.stopPropagation(); deleteChannel(d.id); break;
        case "react": react(d.id, d.emoji); document.querySelectorAll(".msg.show-actions").forEach((n) => n.classList.remove("show-actions")); break;
        case "reply": setReply(d.id); document.querySelectorAll(".msg.show-actions").forEach((n) => n.classList.remove("show-actions")); break;
        case "delete-msg": deleteMessage(d.id); break;
        case "report-msg": openReport(d.id); document.querySelectorAll(".msg.show-actions").forEach((n) => n.classList.remove("show-actions")); break;
        case "profile": location.href = "index.html?pilot=" + encodeURIComponent(d.uid); break;
        case "lightbox":
          $("lightbox-img-src").src = d.src; $("lightbox-download-btn").href = d.src; $("photo-lightbox-modal").hidden = false; break;
      }
    });
    document.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches('.conv-item[role="button"]')) { e.preventDefault(); e.target.click(); }
      if (e.key === "Escape") {
        if (!$("photo-lightbox-modal").hidden) $("photo-lightbox-modal").hidden = true;
        else if (!$("report-modal").hidden) $("report-modal").hidden = true;
        else if (!$("channel-modal").hidden) $("channel-modal").hidden = true;
        else if (!$("theme-sheet").hidden) $("theme-sheet").hidden = true;
        else if (!$("emoji-panel").hidden) hideEmoji();
        else if (state.replyTo) clearReply();
      }
    });
    $("report-form").addEventListener("submit", (e) => { e.preventDefault(); sendReport(); });
    $("report-cancel").addEventListener("click", () => { $("report-modal").hidden = true; });
    $("report-modal").addEventListener("click", (e) => { if (e.target.id === "report-modal") $("report-modal").hidden = true; });
    $("lightbox-close").addEventListener("click", () => { $("photo-lightbox-modal").hidden = true; });
    $("photo-lightbox-modal").addEventListener("click", (e) => { if (e.target.id === "photo-lightbox-modal") $("photo-lightbox-modal").hidden = true; });
    ["channel-modal", "theme-sheet"].forEach((id) => $(id).addEventListener("click", (e) => { if (e.target.id === id) $(id).hidden = true; }));

    $("back-to-list").addEventListener("click", () => { location.hash = ""; });
    $("side-filter").addEventListener("input", (e) => { state.filter = e.target.value; renderLists(); });
    $("jump-latest").addEventListener("click", () => { toBottom(true); state.newBelow = 0; $("jump-latest").hidden = true; });
    scroller.addEventListener("scroll", () => { if (nearBottom()) { state.newBelow = 0; $("jump-latest").hidden = true; } else if (scroller.scrollHeight > scroller.clientHeight * 1.5) showJump(); }, { passive: true });

    // canal admin
    $("admin-add-channel-btn").addEventListener("click", () => { $("channel-error").textContent = ""; $("channel-name").value = ""; $("channel-modal").hidden = false; setTimeout(() => $("channel-name").focus(), 50); });
    $("channel-cancel").addEventListener("click", () => { $("channel-modal").hidden = true; });
    $("channel-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const id = await createChannel($("channel-name").value);
        $("channel-modal").hidden = true;
        MA.toast("Canal créé.", "ok");
        location.hash = "#channel/" + encodeURIComponent(id);
      } catch (err) { $("channel-error").textContent = err.message; }
    });

    // composer
    const input = $("chat-input-message");
    input.addEventListener("input", () => { autosize(); updateMentions(); });
    input.addEventListener("click", updateMentions);
    mentionPop.addEventListener("mousedown", (e) => { const b = e.target.closest("button[data-i]"); if (b) { e.preventDefault(); pickMention(Number(b.dataset.i)); } });
    input.addEventListener("keydown", (e) => {
      if (!mentionPop.hidden) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          mentionIdx = (mentionIdx + (e.key === "ArrowDown" ? 1 : -1) + mentionList.length) % mentionList.length;
          mentionPop.querySelectorAll("button").forEach((b, i) => b.classList.toggle("on", i === mentionIdx));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pickMention(mentionIdx); return; }
        if (e.key === "Escape") { e.preventDefault(); hideMentions(); return; }
      }
      if (e.key === "Enter" && !e.shiftKey && !coarse() && !e.isComposing) { e.preventDefault(); send(); }
    });
    $("chat-send-form").addEventListener("submit", (e) => { e.preventDefault(); send(); });
    document.addEventListener("visibilitychange", () => { seenTimer = 0; markSeen(); });
    window.addEventListener("focus", () => { seenTimer = 0; markSeen(); });
    $("chat-media-input").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) { MA.toast("Seules les images sont acceptées.", "err"); e.target.value = ""; return; }
      if (f.size > 20 * 1024 * 1024) { MA.toast("Photo trop volumineuse (20 Mo maximum).", "err"); e.target.value = ""; return; }
      clearPhoto();
      state.photo = f; state.photoUrl = URL.createObjectURL(f);
      $("chat-photo-thumb").src = state.photoUrl; $("chat-photo-preview-bar").hidden = false;
    });
    $("cancel-photo-btn").addEventListener("click", clearPhoto);
    $("voice-btn").addEventListener("click", () => { if (voice.rec) finishVoice(false); else startVoice(); });
    $("voice-send").addEventListener("click", () => finishVoice(false));
    $("voice-cancel").addEventListener("click", cancelVoice);
    $("cancel-reply-btn").addEventListener("click", clearReply);
    $("emoji-panel").innerHTML = PICKER.map((e) => `<button type="button" data-emoji-pick="${e}" aria-label="${e}">${e}</button>`).join("");
    $("emoji-toggle").addEventListener("click", () => {
      const open = $("emoji-panel").hidden;
      $("emoji-panel").hidden = !open;
      $("emoji-toggle").setAttribute("aria-expanded", String(open));
    });
    $("emoji-panel").addEventListener("click", (e) => {
      const b = e.target.closest("[data-emoji-pick]");
      if (!b) return;
      const s = input.selectionStart ?? input.value.length, en = input.selectionEnd ?? s;
      input.value = input.value.slice(0, s) + b.dataset.emojiPick + input.value.slice(en);
      input.selectionStart = input.selectionEnd = s + b.dataset.emojiPick.length;
      input.focus(); autosize();
    });

    MA.unread.onChange(() => {
      renderLists();
      if (state.conv && state.conv.type === "channel") {
        updateHeader();
        if (MA.unread.loaded() && !MA.unread.channels().some((c) => c.id === state.conv.id) && state.user) {
          MA.toast("Ce canal n'existe plus.", "err"); location.hash = "#global";
        }
      }
    });
    window.addEventListener("hashchange", route);
    window.addEventListener("resize", () => { if (state.user && desktop() && !parseHash()) location.replace("#global"); });
    document.addEventListener("visibilitychange", renderLists);

    auth.onAuthStateChanged(onUser);
    setTimeout(() => { if (!$("chat-loading").hidden && !state.user) { $("chat-loading").innerHTML = `<span>Connexion lente… vérifie ta connexion internet.</span>`; } }, 8000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
