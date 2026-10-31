/**
 * MOTORAUTO — notifications push (Firebase Cloud Messaging) + installation du site (PWA).
 *   push_tokens/{id}   { uid, token, ua, createdAt }   un document par appareil
 *   notif_prefs/{uid}  { dm, mention, reply, follow, like, comment, event, game, maint }  préférences (true par défaut)
 * Le serveur (Cloud Function pushOnNotification) envoie la notification à chaque appareil, selon les préférences.
 */
(function () {
  "use strict";
  const KINDS = [
    ["dm", "Messages privés", "Quand un pilote t'écrit"],
    ["mention", "Mentions", "Quand on te mentionne dans le salon"],
    ["reply", "Réponses", "Quand on répond à ton message"],
    ["follow", "Nouveaux abonnés", "Quand un pilote s'abonne à toi"],
    ["like", "J'aime", "Quand on aime ta voiture"],
    ["comment", "Commentaires", "Quand on commente ta voiture"],
    ["event", "Sorties", "Quand un pilote rejoint ta sortie"],
    ["game", "Jeu", "Échanges, défis, cartes spéciales, concours"],
    ["maint", "Entretien", "Rappels d'entretien de ta voiture"]
  ];
  const CAT = { reply: "reply", mention: "mention", dm: "dm", follow: "follow", like: "like", comment: "comment", event: "event", maint: "maint", game: "game" };
  let C = null, prefs = null, deferredInstall = null;
  const TOKEN_KEY = "motorauto_push_token";
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) { /* ignoré */ } };
  const db = () => window.MAFB.db;

  // ------------------------------------------------------------------ préférences
  async function loadPrefs(uid) {
    prefs = {}; KINDS.forEach(([k]) => { prefs[k] = true; });
    try { const d = await db().collection("notif_prefs").doc(uid).get(); if (d.exists) KINDS.forEach(([k]) => { if (d.data()[k] === false) prefs[k] = false; }); } catch (_) { /* règles non publiées : tout activé */ }
    return prefs;
  }
  async function setPref(uid, kind, on) {
    prefs = prefs || {}; prefs[kind] = on;
    const data = {}; KINDS.forEach(([k]) => { data[k] = prefs[k] !== false; });
    data.updatedAt = window.MAFB.FieldValue.serverTimestamp();
    await db().collection("notif_prefs").doc(uid).set(data);
  }
  const allows = (type) => !prefs || !CAT[type] || prefs[CAT[type]] !== false;

  // ------------------------------------------------------------------ push
  const supported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!(window.firebase && firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported());
  const standalone = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function state() {
    if (!window.MA_VAPID_KEY) return "noconfig";
    if (isIOS() && !standalone()) return "ios-install";
    if (!supported()) return "unsupported";
    if (Notification.permission === "denied") return "denied";
    return lsGet(TOKEN_KEY) && Notification.permission === "granted" ? "on" : "off";
  }
  async function enable(user) {
    if (!window.MA_VAPID_KEY) throw new Error("Clé VAPID manquante (voir js/push-config.js).");
    if (!supported()) throw new Error("Ce navigateur ne gère pas les notifications push.");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error("Autorisation refusée : active-la dans les réglages du navigateur.");
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;
    const token = await firebase.messaging().getToken({ vapidKey: window.MA_VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) throw new Error("Impossible d'obtenir l'identifiant de cet appareil.");
    await db().collection("push_tokens").doc(token.slice(-60).replace(/[^\w-]/g, "_")).set({ uid: user.uid, token, ua: navigator.userAgent.slice(0, 160), createdAt: window.MAFB.FieldValue.serverTimestamp() });
    lsSet(TOKEN_KEY, token); return token;
  }
  async function disable() {
    const token = lsGet(TOKEN_KEY);
    try { if (token) { await db().collection("push_tokens").doc(token.slice(-60).replace(/[^\w-]/g, "_")).delete(); if (window.firebase && firebase.messaging) await firebase.messaging().deleteToken().catch(() => {}); } } finally { lsSet(TOKEN_KEY, null); }
  }
  /** installation du site (Android / ordinateur) */
  async function install() { if (!deferredInstall) return false; deferredInstall.prompt(); const r = await deferredInstall.userChoice; deferredInstall = null; return r && r.outcome === "accepted"; }
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; document.dispatchEvent(new CustomEvent("ma:install-ready")); });
  window.addEventListener("appinstalled", () => { deferredInstall = null; });

  const docId = (token) => token.slice(-60).replace(/[^\w-]/g, "_");
  /** retire cet appareil du pilote connecté (à appeler AVANT la déconnexion) : il ne recevra plus ses notifications */
  async function release() {
    const token = lsGet(TOKEN_KEY); if (!token || !window.MAFB) return;
    try { await db().collection("push_tokens").doc(docId(token)).delete(); } catch (_) { /* déjà supprimé */ }
    lsSet(TOKEN_KEY, null);
  }
  /** appareil déjà autorisé : on renouvelle l'identifiant et on le rattache au pilote connecté (sans rien demander) */
  async function refresh(user) {
    if (!user || !window.MA_VAPID_KEY || !supported() || Notification.permission !== "granted") return;
    try {
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js"); await navigator.serviceWorker.ready;
      const token = await firebase.messaging().getToken({ vapidKey: window.MA_VAPID_KEY, serviceWorkerRegistration: reg });
      if (!token) return;
      const ref = db().collection("push_tokens").doc(docId(token)), snap = await ref.get().catch(() => null);
      if (!snap || !snap.exists || snap.data().uid !== user.uid || lsGet(TOKEN_KEY) !== token)
        await ref.set({ uid: user.uid, token, ua: navigator.userAgent.slice(0, 160), createdAt: window.MAFB.FieldValue.serverTimestamp() });
      lsSet(TOKEN_KEY, token);
    } catch (_) { /* réseau / règles : on réessaiera à la prochaine visite */ }
  }

  // ------------------------------------------------------------------ invitation (une seule fois par appareil)
  const ASKED = "motorauto_push_asked";
  function closeAsk() { const b = document.getElementById("push-ask"); if (b) b.remove(); }
  function showAsk(user, kind) {
    if (document.getElementById("push-ask")) return;
    lsSet(ASKED, String(Date.now()));
    const box = document.createElement("aside");
    box.id = "push-ask"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Activer les notifications");
    const ios = kind === "ios";
    box.innerHTML = '<div class="push-ask-txt"><b>' + (ios ? "Installe MOTORAUTO pour être prévenu" : "Reste dans la course") + '</b><span>' +
      (ios ? "Touche le bouton Partager de Safari puis « Sur l\u2019écran d\u2019accueil ». Ouvre ensuite le site depuis son icône pour activer les notifications."
           : "Active les notifications : messages privés, réponses, échanges de cartes, défis.") + '</span></div>' +
      '<div class="push-ask-btns">' + (ios ? "" : '<button type="button" class="cta-btn fill-btn compact-btn" data-push-yes>Activer</button>') + '<button type="button" class="ghost-btn compact-btn" data-push-no>' + (ios ? "Compris" : "Plus tard") + '</button></div>';
    document.body.appendChild(box);
    box.addEventListener("click", async (e) => {
      if (e.target.closest("[data-push-no]")) { closeAsk(); return; }
      if (e.target.closest("[data-push-yes]")) {
        closeAsk();
        try { await enable(user); if (C && C.toast) C.toast("Notifications activées sur cet appareil 🔔", "ok"); }
        catch (err) { if (C && C.toast) C.toast(err.message || "Activation impossible.", "err"); }
      }
    });
  }
  let askTimer = 0;
  function onAuth(user) {
    clearTimeout(askTimer); closeAsk();
    if (!user) return;
    if (typeof Notification !== "undefined" && Notification.permission === "granted") { refresh(user); return; }
    if (lsGet(ASKED) || !window.MA_VAPID_KEY) return;
    if (typeof Notification === "undefined" || Notification.permission === "denied") return;
    const st = state();
    if (st !== "off" && st !== "ios-install") return;
    askTimer = setTimeout(() => { if (!lsGet(ASKED) && document.visibilityState === "visible") showAsk(user, st === "ios-install" ? "ios" : "web"); }, 6000);
  }

  window.MAPush = { release, refresh, KINDS, state, enable, disable, install, canInstall: () => !!deferredInstall, standalone, isIOS, loadPrefs, setPref, allows, prefs: () => prefs };
  document.addEventListener("ma:auth", (e) => { const u = e.detail && e.detail.user; if (u) loadPrefs(u.uid); else prefs = null; onAuth(u || null); });
  // enregistre le service worker (site installable) dès que possible, sans demander d'autorisation
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load", () => { navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {}); });
  (window.MAModules = window.MAModules || []).push(function (ctx) { C = ctx; if (ctx.user) loadPrefs(ctx.user.uid); });
})();
