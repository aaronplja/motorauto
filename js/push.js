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

  window.MAPush = { KINDS, state, enable, disable, install, canInstall: () => !!deferredInstall, standalone, isIOS, loadPrefs, setPref, allows, prefs: () => prefs };
  document.addEventListener("ma:auth", (e) => { if (e.detail && e.detail.user) loadPrefs(e.detail.user.uid); else { prefs = null; } });
  // enregistre le service worker (site installable) dès que possible, sans demander d'autorisation
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load", () => { navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {}); });
  (window.MAModules = window.MAModules || []).push(function (ctx) { C = ctx; if (ctx.user) loadPrefs(ctx.user.uid); });
})();
