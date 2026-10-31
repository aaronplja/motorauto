/**
 * MOTORAUTO — services communs aux deux pages : thème, toasts, suivi des messages non lus.
 * Étend window.MA (défini par utils.js).
 */
(function () {
  "use strict";
  const MA = window.MA;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* navigation privée */ } }
  };
  MA.store = store;

  // ------------------------------------------------------------------ thème
  MA.applyTheme = function (theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (window.MATheme) { if (theme === "custom") MATheme.applyCustom(); else MATheme.clear(); }
    document.querySelectorAll("[data-set-theme]").forEach((t) => t.classList.toggle("active", t.dataset.setTheme === theme));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) requestAnimationFrame(() => { meta.content = getComputedStyle(document.documentElement).getPropertyValue("--bg-core").trim() || "#09090b"; });
  };
  MA.applyTheme(store.get("motorauto_theme") || "onyx-carbon");


  // ------------------------------------------------------------------ admin
  // Admin = claim { admin: true } OU compte admin@motorauto.fr (voir firestore.rules).
  MA.ADMIN_EMAIL = "admin@motorauto.fr";
  // Admin principal : claim ou compte admin@motorauto.fr (nomme / retire les autres admins).
  MA.checkSuper = async function (user) {
    if (!user) return false;
    if ((user.email || "").toLowerCase() === MA.ADMIN_EMAIL) return true;
    try { return (await user.getIdTokenResult()).claims.admin === true; } catch (_) { return false; }
  };
  // Admin = admin principal OU pilote promu (document admins/{uid}, voir firestore.rules).
  MA.checkAdmin = async function (user) {
    if (!user) return false;
    if (await MA.checkSuper(user)) return true;
    try {
      const snap = await window.MAFB.db.collection("admins").doc(user.uid).get();
      return snap.exists;
    } catch (_) { return false; }
  };

  // L'admin publie son uid (config/admin) pour que les pilotes puissent lui écrire en message privé.
  MA.registerAdmin = async function (db, user) {
    try {
      const ref = db.collection("config").doc("admin");
      const snap = await ref.get();
      if (!snap.exists || snap.data().uid !== user.uid) await ref.set({ uid: user.uid });
    } catch (e) { console.warn("config/admin :", e.code || e.message); }
  };

  // Tag « admin » : ensemble des uid admins (admin principal + promus), chargé une fois.
  MA.admins = (function () {
    const set = new Set();
    let p = null;
    const api = {
      has: (uid) => set.has(uid),
      add: (uid) => { set.add(uid); },
      remove: (uid) => { set.delete(uid); },
      load(db) {
        if (p) return p;
        p = Promise.all([
          db.collection("config").doc("admin").get().then((s) => { if (s.exists && s.data().uid) set.add(s.data().uid); }).catch(() => {}),
          db.collection("admins").limit(200).get().then((s) => s.forEach((d) => set.add(d.id))).catch(() => {})
        ]).then(() => set);
        return p;
      },
      reload(db) { p = null; set.clear(); return api.load(db); },
      tag(uid) { return set.has(uid) ? ' <span class="admin-tag" title="Administrateur">admin</span>' : ""; }
    };
    return api;
  })();

  // Signale la connexion : une Cloud Function envoie l'e-mail de bienvenue / de bon retour (voir functions/).
  // Une seule fois par session de navigation.
  MA.loginPing = function (db, user) {
    try {
      if (!user || sessionStorage.getItem("ma_ping_" + user.uid)) return;
      sessionStorage.setItem("ma_ping_" + user.uid, "1");
    } catch (_) { /* navigation privée : on envoie quand même */ }
    db.collection("login_events").doc(user.uid).set({ at: window.MAFB.FieldValue.serverTimestamp() }).catch(() => {});
  };

  // ------------------------------------------------------------ images
  // Redimensionne une image (déjà choisie par l'utilisateur) en JPEG ; renvoie un Blob.
  MA.resizeImage = function (file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const k = Math.min(1, maxDim / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(img.width * k));
        cv.height = Math.max(1, Math.round(img.height * k));
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion impossible"))), "image/jpeg", quality || 0.88);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image illisible")); };
      img.src = url;
    });
  };

  // ------------------------------------------------------------------ toasts
  MA.toast = function (message, type) {
    let region = document.getElementById("toast-region");
    if (!region) {
      region = document.createElement("div");
      region.id = "toast-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    const t = document.createElement("div");
    t.className = "toast " + (type || "");
    t.textContent = message;
    region.appendChild(t);
    const close = () => { t.classList.add("out"); setTimeout(() => t.remove(), 320); };
    setTimeout(close, type === "err" ? 6000 : 3600);
    t.addEventListener("click", close);
  };

  // ------------------------------------------------------- clés de discussion
  MA.chatKey = (c) => (c.type === "global" ? "global" : c.type === "channel" ? "chan:" + c.id : c.type === "club" ? "club:" + c.id : "dm:" + c.id);

  // ----------------------------------------------------------- messages non lus
  MA.unread = (function () {
    let user = null, db = null;
    let lastRead = {};
    const keys = new Set();
    const unsubs = new Map();
    const listeners = new Set();
    let channelsUnsub = null;
    let channels = [];
    let loaded = false;
    let activeKey = null;

    const storageKey = () => "motorauto_lastread_" + user.uid;
    const emit = () => listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    const persist = () => store.set(storageKey(), JSON.stringify(lastRead));

    function watch(key, collection) {
      if (unsubs.has(key)) return;
      const unsub = collection.orderBy("timestamp", "desc").limit(1).onSnapshot((snap) => {
        if (snap.empty || !user) return;
        const m = snap.docs[0].data({ serverTimestamps: "estimate" });
        const t = m.timestamp ? m.timestamp.toMillis() : Date.now();
        if (lastRead[key] == null) { lastRead[key] = t; persist(); return; } // première visite : on part de l'existant
        if (m.uid === user.uid) return;
        if (activeKey === key) { markRead(key); return; }
        if (t > lastRead[key] && !keys.has(key)) { keys.add(key); emit(); }
      }, (err) => console.warn("Notifications indisponibles pour", key, err.message));
      unsubs.set(key, unsub);
    }

    function markRead(key) {
      lastRead[key] = Date.now();
      const had = keys.delete(key);
      if (user) persist();
      if (had) emit();
    }

    function start(u, firestore) {
      stop();
      user = u; db = firestore;
      try { lastRead = JSON.parse(store.get(storageKey()) || "{}"); } catch (_) { lastRead = {}; }
      watch("global", db.collection("global_chat"));
      channelsUnsub = db.collection("custom_channels").onSnapshot((snap) => {
        channels = [];
        snap.forEach((d) => channels.push({ id: d.id, name: (d.data() || {}).name || d.id }));
        channels.sort((a, b) => a.name.localeCompare(b.name, "fr"));
        loaded = true;
        const live = new Set(channels.map((c) => "chan:" + c.id));
        channels.forEach((c) => watch("chan:" + c.id, db.collection("custom_channels").doc(c.id).collection("messages")));
        unsubs.forEach((unsub, key) => {
          if (key.startsWith("chan:") && !live.has(key)) { unsub(); unsubs.delete(key); keys.delete(key); }
        });
        emit();
      }, (err) => console.warn("Liste des canaux indisponible :", err.message));
    }

    function stop() {
      unsubs.forEach((u) => u());
      unsubs.clear();
      if (channelsUnsub) { channelsUnsub(); channelsUnsub = null; }
      keys.clear(); channels = []; loaded = false; user = null; activeKey = null;
      emit();
    }

    return {
      start, stop, markRead, watch,
      setActive(key) { activeKey = key; if (key) markRead(key); },
      has: (k) => keys.has(k),
      count: () => keys.size,
      channels: () => channels.slice(),
      loaded: () => loaded,
      onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    };
  })();


  // ------------------------------------------------------------- notifications
  // users/{uid}/notifications/{id} : réponses, mentions, messages privés, décisions sur les propositions.
  MA.notif = (function () {
    let user = null, db = null, unsub = null, items = [], loaded = false;
    const listeners = new Set();
    let panel = null, anchor = null, badge = null;
    const api = { activeLink: null };

    const typeLabel = (n) => {
      const who = n.from || "Un pilote";
      if (n.type === "reply") return `${who} t'a répondu`;
      if (n.type === "mention") return `${who} t'a mentionné`;
      if (n.type === "dm") return `Message de ${who}`;
      if (n.type === "follow") return `${who} s'est abonné à toi`;
      if (n.type === "role") return "Grade d'administrateur";
      if (n.type === "like") return `${who} aime ta voiture`;
      if (n.type === "comment") return `${who} a commenté`;
      if (n.type === "event") return `${who} participe à ta sortie`;
      if (n.type === "maint") return "Rappel d'entretien";
      if (n.type === "mute") return "Modération";
      if (n.type === "game") return "Jeu MOTORAUTO";
      return n.from || "MOTORAUTO";
    };
    const ICON_OF = { reply: "undo", mention: "at", dm: "mail", suggestion: "check", follow: "star", role: "shield", like: "heart", comment: "chat", event: "calendar", maint: "wrench", mute: "mute", game: "cards" };
    const icon = (t) => (window.MAIcons ? window.MAIcons.svg(ICON_OF[t] || "bell", 18) : "•");
    function ago(ms) {
      const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
      if (s < 60) return "à l'instant";
      if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
      if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
      return `il y a ${Math.floor(s / 86400)} j`;
    }
    const unreadCount = () => items.filter((n) => !n.read).length;

    function updateBadge() {
      const c = unreadCount();
      if (!badge) return;
      badge.textContent = c > 9 ? "9+" : String(c);
      badge.hidden = c === 0;
      if (anchor) anchor.setAttribute("aria-label", c ? `Notifications (${c} non lues)` : "Notifications");
    }
    function emit() {
      updateBadge();
      if (panel && !panel.hidden) renderPanel();
      listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    }

    function start(u, firestore) {
      stop();
      user = u; db = firestore;
      if (anchor) anchor.hidden = false;
      if (window.MAPush) window.MAPush.loadPrefs(u.uid).then(() => { if (loaded) emit(); });
      const allowed = (n) => !window.MAPush || window.MAPush.allows(n.type);
      unsub = db.collection("users").doc(u.uid).collection("notifications").orderBy("createdAt", "desc").limit(30).onSnapshot((snap) => {
        const fresh = [];
        if (loaded) snap.docChanges().forEach((ch) => { if (ch.type === "added") fresh.push(Object.assign({ id: ch.doc.id }, ch.doc.data({ serverTimestamps: "estimate" }))); });
        items = snap.docs.map((d) => Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" }))).filter(allowed);
        loaded = true;
        // déjà en train de lire la conversation concernée : inutile de notifier
        items.filter((n) => !n.read && api.activeLink && n.link === api.activeLink).forEach((n) => markRead(n.id));
        emit();
        fresh.filter((n) => allowed(n) && !n.read && !(api.activeLink && n.link === api.activeLink)).slice(0, 3)
          .forEach((n) => MA.toast(`${typeLabel(n)}${n.text ? " : " + n.text : ""}`, "ok"));
      }, (err) => console.warn("Notifications indisponibles :", err.message));
    }
    function stop() {
      if (unsub) { unsub(); unsub = null; }
      items = []; loaded = false; user = null;
      if (anchor) anchor.hidden = true;
      if (panel) panel.hidden = true;
      emit();
    }

    function markRead(id) {
      const n = items.find((x) => x.id === id);
      if (!n || n.read || !db || !user) return;
      n.read = true; emit();
      db.collection("users").doc(user.uid).collection("notifications").doc(id).update({ read: true }).catch(() => {});
    }
    function markAllRead() {
      const unread = items.filter((n) => !n.read);
      if (!unread.length || !db || !user) return;
      const batch = db.batch();
      unread.forEach((n) => { n.read = true; batch.update(db.collection("users").doc(user.uid).collection("notifications").doc(n.id), { read: true }); });
      emit();
      batch.commit().catch(() => {});
    }

    // suppression avec « Annuler » pendant 5 s : on garde les données pour les réécrire si besoin
    let undoBuf = null, undoTimer = null;
    const raw = (n) => { const o = Object.assign({}, n); delete o.id; return o; };
    function armUndo(list) {
      undoBuf = list; clearTimeout(undoTimer);
      undoTimer = setTimeout(() => { undoBuf = null; if (panel && !panel.hidden) renderPanel(); }, 5000);
    }
    function undo() {
      if (!undoBuf || !db || !user) return;
      const list = undoBuf, batch = db.batch(), uid = user.uid; undoBuf = null; clearTimeout(undoTimer);
      list.forEach((n) => batch.set(db.collection("users").doc(uid).collection("notifications").doc(n.id), raw(n)));
      list.forEach((n) => { if (!items.some((x) => x.id === n.id)) items.push(n); });
      items.sort((a, b) => ((b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0)));
      emit();
      batch.commit().catch(() => {});
    }
    function remove(id) {
      const i = items.findIndex((x) => x.id === id);
      if (i < 0 || !db || !user) return;
      const gone = items.splice(i, 1); armUndo(gone); emit();
      db.collection("users").doc(user.uid).collection("notifications").doc(id).delete().catch(() => {});
    }
    function removeAll() {
      if (!items.length || !db || !user) return;
      const batch = db.batch(), uid = user.uid, gone = items.slice();
      items.forEach((n) => batch.delete(db.collection("users").doc(uid).collection("notifications").doc(n.id)));
      items = []; armUndo(gone); emit();
      batch.commit().catch(() => {});
    }

    // envoi d'une notification à un autre pilote (id fixe = une seule ligne par expéditeur, pour les messages privés)
    function send(targetUid, payload, docId) {
      if (!db || !user || !targetUid || targetUid === user.uid) return Promise.resolve();
      const col = db.collection("users").doc(targetUid).collection("notifications");
      const data = {
        type: payload.type, fromUid: user.uid, from: String(payload.from || "Pilote").slice(0, 40),
        text: String(payload.text || "").slice(0, 120), link: String(payload.link || "").slice(0, 200),
        read: false, createdAt: window.MAFB.FieldValue.serverTimestamp()
      };
      const p = docId ? col.doc(docId).set(data) : col.add(data);
      return p.catch((e) => console.warn("Notification non envoyée :", e.message));
    }

    function go(n) {
      markRead(n.id);
      closePanel();
      if (!n.link) return;
      const [page, hash] = n.link.split("#");
      const here = location.pathname.split("/").pop() || "index.html";
      if (hash !== undefined && page === here) { location.hash = "#" + hash; return; }
      location.href = n.link;
    }

    function renderPanel() {
      const trash = window.MAIcons ? window.MAIcons.svg("trash", 17) : "×";
      const list = items.length ? items.map((n) => `
        <div class="notif-row ${n.read ? "" : "unread"}">
          <button type="button" class="notif-item ${n.read ? "" : "unread"}" data-nid="${MA.esc(n.id)}">
            <span class="notif-ico">${icon(n.type)}</span>
            <span class="notif-body"><b>${MA.esc(typeLabel(n))}</b>${n.text ? `<span>${MA.esc(n.text)}</span>` : ""}
              <time>${n.createdAt && n.createdAt.toMillis ? ago(n.createdAt.toMillis()) : ""}</time></span>
          </button>
          <button type="button" class="notif-del" data-del="${MA.esc(n.id)}" aria-label="Supprimer cette notification" title="Supprimer">${trash}</button>
        </div>`).join("") : `<div class="notif-empty">Rien pour l'instant.<br><small>Tu seras prévenu ici quand quelqu'un te répond, te mentionne ou t'écrit.</small></div>`;
      panel.innerHTML = `<div class="notif-head"><b>Notifications</b><span class="notif-actions"><button type="button" class="notif-all" ${unreadCount() ? "" : "disabled"}>Tout lire</button><button type="button" class="notif-clear" ${items.length ? "" : "disabled"} aria-label="Tout effacer" title="Tout effacer">${trash}</button></span></div><div class="notif-list">${list}</div>${undoBuf ? `<div class="notif-undo" role="status"><span>${undoBuf.length > 1 ? undoBuf.length + " notifications supprimées" : "Notification supprimée"}</span><button type="button" class="notif-undo-btn">Annuler</button></div>` : ""}`;
    }
    function placePanel() {
      const r = anchor.getBoundingClientRect();
      const narrow = window.innerWidth < 600;
      panel.style.top = Math.round(r.bottom + 10) + "px";
      panel.style.right = narrow ? "0.6rem" : Math.max(8, Math.round(window.innerWidth - r.right - 4)) + "px";
      panel.style.left = narrow ? "0.6rem" : "auto";
    }
    function openPanel() { renderPanel(); placePanel(); panel.hidden = false; anchor.setAttribute("aria-expanded", "true"); }
    function closePanel() { if (panel) panel.hidden = true; if (anchor) anchor.setAttribute("aria-expanded", "false"); }

    function mount(btn) {
      anchor = btn; badge = btn.querySelector(".notif-badge");
      btn.hidden = !user;
      panel = document.createElement("div");
      panel.className = "notif-panel"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Notifications");
      document.body.appendChild(panel);
      btn.setAttribute("aria-haspopup", "dialog"); btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", (e) => { e.stopPropagation(); panel.hidden ? openPanel() : closePanel(); });
      panel.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.target.closest(".notif-all")) { markAllRead(); return; }
        if (e.target.closest(".notif-clear")) { removeAll(); return; }
        if (e.target.closest(".notif-undo-btn")) { undo(); return; }
        const del = e.target.closest(".notif-del"); if (del) { remove(del.dataset.del); return; }
        const it = e.target.closest(".notif-item");
        if (it) { const n = items.find((x) => x.id === it.dataset.nid); if (n) go(n); }
      });
      // tactile : glisser une notification vers la gauche pour la supprimer
      let sw = null;
      panel.addEventListener("touchstart", (e) => {
        const row = e.target.closest(".notif-row"); if (!row || e.touches.length !== 1) return;
        sw = { row, x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, lock: null };
      }, { passive: true });
      panel.addEventListener("touchmove", (e) => {
        if (!sw) return;
        const dx = e.touches[0].clientX - sw.x, dy = e.touches[0].clientY - sw.y;
        if (sw.lock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) sw.lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (sw.lock !== "x") return;
        sw.dx = Math.min(0, dx); sw.row.style.transition = "none"; sw.row.style.transform = `translateX(${sw.dx}px)`; sw.row.style.opacity = String(Math.max(.35, 1 - Math.abs(sw.dx) / 260));
      }, { passive: true });
      const endSwipe = () => {
        if (!sw) return; const s = sw; sw = null;
        s.row.style.transition = "transform .2s, opacity .2s";
        if (s.lock === "x" && s.dx < -90) {
          s.row.style.transform = "translateX(-110%)"; s.row.style.opacity = "0";
          const id = s.row.querySelector(".notif-del").dataset.del; setTimeout(() => remove(id), 180);
        } else { s.row.style.transform = ""; s.row.style.opacity = ""; }
      };
      panel.addEventListener("touchend", endSwipe); panel.addEventListener("touchcancel", endSwipe);
      document.addEventListener("click", () => closePanel());
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });
      window.addEventListener("resize", () => { if (!panel.hidden) placePanel(); }, { passive: true });
      updateBadge();
    }

    Object.assign(api, { start, stop, mount, send, markRead, markAllRead, remove, removeAll, unreadCount, items: () => items.slice(), onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); } });
    return api;
  })();

  // ------------------------------------------------------------- sourdine (modération)
  // mutes/{uid} : { untilMs, perma, reason, byName } — écrit par un admin, lu par le pilote concerné.
  MA.mute = (function () {
    let rec = null;
    const api = {
      async load(db, user) {
        rec = null;
        if (!user) return;
        try { const d = await db.collection("mutes").doc(user.uid).get(); rec = d.exists ? d.data() : null; } catch (e) { rec = null; }
      },
      clear() { rec = null; },
      active() { return !!rec && (!!rec.perma || Number(rec.untilMs) > Date.now()); },
      message() {
        if (!api.active()) return "";
        const until = rec.perma ? "jusqu'à nouvel ordre" : "jusqu'au " + new Date(Number(rec.untilMs)).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
        return "Tu es en sourdine " + until + (rec.reason ? " (" + String(rec.reason).slice(0, 140) + ")" : "") + ". Tu peux lire, mais pas publier.";
      }
    };
    return api;
  })();
  window.MAMute = MA.mute;

  // pseudo -> jeton de mention (@Jean_Dupont) et inversement
  MA.mentionToken = (name) => String(name || "").trim().replace(/\s+/g, "_");
  MA.parseMentions = (text) => {
    const out = new Set();
    String(text || "").replace(/(^|[\s(])@([\p{L}\p{N}_.-]{2,24})/gu, (_, __, tok) => { out.add(tok.replace(/[.-]+$/, "").toLowerCase()); return ""; });
    return Array.from(out).slice(0, 4);
  };

  // ------------------------------------------------ images cassées -> image de secours
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (!t || t.tagName !== "IMG" || !t.dataset.fallback) return;
    const fb = t.dataset.fallback === "avatar" ? MA.FALLBACK_AVATAR : MA.FALLBACK_CAR;
    delete t.dataset.fallback; // évite une boucle si l'image de secours échoue aussi
    t.src = fb;
  }, true);

  // ----------------------------------------------------- hauteur d'écran mobile
  // 100dvh couvre la plupart des cas ; cette variable sert de repli pour les anciens navigateurs.
  function setVh() { document.documentElement.style.setProperty("--vh", window.innerHeight * 0.01 + "px"); }
  setVh();
  window.addEventListener("resize", setVh, { passive: true });
  window.addEventListener("orientationchange", setVh, { passive: true });
})();
