/**
 * MOTORAUTO — pont avec l'application iPhone (Capacitor). Inactif sur le site web.
 *  • connexion native Google et « Se connecter avec Apple » (plugin @capacitor-firebase/authentication) ;
 *  • notifications push natives (plugin @capacitor-firebase/messaging) : jeton enregistré dans push_tokens avec platform:"ios".
 */
(function () {
  "use strict";
  const cap = window.Capacitor;
  const isNative = !!(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform());
  const plugin = (n) => (cap && cap.registerPlugin ? cap.registerPlugin(n) : null);
  const FLAG = "ma_native_push", TOKEN_KEY = "motorauto_push_token";
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) { /* ignoré */ } };
  const docId = (t) => t.slice(-60).replace(/[^\w-]/g, "_");
  const api = { isNative, platform: isNative ? cap.getPlatform() : "web" };
  window.MANative = api;
  if (!isNative) return;
  document.documentElement.classList.add("is-native-app");

  // ------------------------------------------------------------ connexion
  async function credentialLogin(kind) {
    const FA = plugin("FirebaseAuthentication"), fb = window.firebase;
    if (kind === "google") {
      const r = await FA.signInWithGoogle({ skipNativeAuth: true });
      const c = r && r.credential; if (!c || !c.idToken) throw new Error("Connexion Google annulée.");
      return window.MAFB.auth.signInWithCredential(fb.auth.GoogleAuthProvider.credential(c.idToken));
    }
    const r = await FA.signInWithApple({ skipNativeAuth: true });
    const c = r && r.credential; if (!c || !c.idToken) throw new Error("Connexion Apple annulée.");
    const cred = new fb.auth.OAuthProvider("apple.com").credential({ idToken: c.idToken, rawNonce: c.nonce });
    return window.MAFB.auth.signInWithCredential(cred);
  }
  async function run(kind, btn) {
    if (btn) btn.disabled = true;
    try {
      await credentialLogin(kind);
      const m = document.getElementById("auth-modal"); const x = document.getElementById("close-auth-modal"); if (m && x) x.click();
    } catch (e) {
      const msg = String((e && e.message) || e);
      if (!/cancel|annul|1001|12501/i.test(msg) && window.MA && window.MA.toast) window.MA.toast("Connexion impossible : " + msg, "err");
    } finally { if (btn) btn.disabled = false; }
  }
  // le bouton Google existant passe par le flux natif (la fenêtre popup n'existe pas dans l'application)
  document.addEventListener("click", (e) => {
    const g = e.target.closest("#google-login-btn"); if (g) { e.preventDefault(); e.stopImmediatePropagation(); run("google", g); return; }
    const a = e.target.closest("#apple-login-btn"); if (a) { e.preventDefault(); run("apple", a); }
  }, true);
  function addAppleButton() {
    const g = document.getElementById("google-login-btn"); if (!g || document.getElementById("apple-login-btn")) return;
    const b = document.createElement("button"); b.type = "button"; b.id = "apple-login-btn"; b.className = "google-auth-btn apple-auth-btn";
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.9zM14.1 5.8c.6-.8 1.1-1.8.9-2.8-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.7 1 .1 2-.5 2.6-1.3z"/></svg><span>Continuer avec Apple</span>';
    g.parentNode.insertBefore(b, g);
  }
  new MutationObserver(addAppleButton).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", addAppleButton);

  // ------------------------------------------------------------ notifications push
  const FM = () => plugin("FirebaseMessaging");
  api.pushState = () => (lsGet(FLAG) === "granted" && lsGet(TOKEN_KEY) ? "on" : lsGet(FLAG) === "denied" ? "denied" : "off");
  async function store(user, token) {
    await window.MAFB.db.collection("push_tokens").doc(docId(token)).set({ uid: user.uid, token, ua: "ios-app", platform: "ios", createdAt: window.MAFB.FieldValue.serverTimestamp() });
    lsSet(TOKEN_KEY, token);
  }
  api.pushEnable = async (user) => {
    const p = await FM().requestPermissions();
    if (p.receive !== "granted") { lsSet(FLAG, "denied"); throw new Error("Autorisation refusée : active-la dans Réglages › MOTORAUTO › Notifications."); }
    lsSet(FLAG, "granted");
    const t = await FM().getToken(); if (!t || !t.token) throw new Error("Impossible d'obtenir l'identifiant de cet appareil.");
    await store(user, t.token); return t.token;
  };
  api.pushRefresh = async (user) => {
    if (lsGet(FLAG) !== "granted" || !user) return;
    try { const t = await FM().getToken(); if (t && t.token) await store(user, t.token); } catch (_) { /* réessai à la prochaine ouverture */ }
  };
  // toucher une notification ouvre la bonne page
  try {
    FM().addListener("notificationActionPerformed", (ev) => {
      const link = ev && ev.notification && ev.notification.data && ev.notification.data.link; if (!link) return;
      const h = String(link).split("#")[1]; if (h) location.hash = "#" + h;
    });
  } catch (_) { /* plugin absent */ }
})();
