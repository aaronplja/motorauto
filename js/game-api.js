/**
 * MOTORAUTO — appels du jeu (packs, craft, défis, série, concours, cartes spéciales).
 *   MAGameAPI.call("openPack", { kind: "daily" }) → résultat, ou lève une Error portant un message lisible en français.
 *
 * Deux modes, choisis automatiquement :
 *   • serveur  : Cloud Functions déployées (functions/game.js) — tirage vérifié côté serveur, échanges disponibles ;
 *   • local    : si les fonctions ne répondent pas (pas déployées), le même moteur (js/game-engine.js, copie de functions/game.js)
 *                tourne dans le navigateur et écrit dans Firestore avec les droits du pilote. Les échanges sont alors indisponibles.
 */
(function () {
  "use strict";
  const FRIENDLY = {
    unauthenticated: "Connecte-toi pour jouer.",
    "permission-denied": "Action refusée : republie firestore.rules (Firebase → Firestore → Règles).",
    unavailable: "Le jeu est momentanément indisponible, réessaie dans un instant.",
    "deadline-exceeded": "Le serveur met trop de temps à répondre, réessaie."
  };
  const SERVER_ONLY = { proposeTrade: 1, respondTrade: 1, cancelTrade: 1, claimSpecial: 1, adminBroadcast: 1, claimReferral: 1, claimSets: 1, marketList: 1, marketBuy: 1, marketCancel: 1 };
  const FALLBACK_CODES = /^(not-found|internal|unavailable|failed-to-fetch|unknown|cancelled)$/;
  let localMode = false, engine = null;

  const clean = (e) => String(e && e.code || "").replace(/^functions\//, "");
  function friendly(e) {
    if (e && e.isGame) return e;
    const code = clean(e);
    const err = new Error(FRIENDLY[code] || (e && e.message && !/^(internal|not-found)$/i.test(e.message) ? e.message : "Le service de jeu n'est pas disponible pour l'instant."));
    err.code = code; return err;
  }

  // ---- adaptateur Firestore (SDK navigateur) → interface « admin » attendue par le moteur
  function adapter(fb) {
    const snap = (s) => ({ id: s.id, exists: s.exists, data: () => s.data(), ref: doc(s.ref) });
    const doc = (r) => ({ id: r.id, __r: r, async get() { return snap(await r.get()); }, set: (d) => r.set(d), update: (d) => r.update(d), delete: () => r.delete(), collection: (n) => col(r.collection(n)) });
    const col = (c) => ({
      doc: (id) => doc(id ? c.doc(id) : c.doc()), async add(d) { return doc(await c.add(d)); },
      where: (f, o, v) => col(c.where(f, o, v)), limit: (n) => col(c.limit(n)),
      async get() { const s = await c.get(); const docs = s.docs.map(snap); return { docs, size: docs.length, empty: !docs.length, forEach: (f) => docs.forEach(f) }; }
    });
    return {
      collection: (p) => col(fb.collection(p)),
      runTransaction: (fn) => fb.runTransaction(async (raw) => fn({
        get: async (w) => snap(await raw.get(w.__r)), set: (w, d) => { raw.set(w.__r, d); }, update: (w, d) => { raw.update(w.__r, d); }, delete: (w) => { raw.delete(w.__r); }
      }))
    };
  }
  function getEngine() {
    if (engine) return engine;
    const MB = window.MAFB, app = window.MAApp && window.MAApp.ctx && window.MAApp.ctx();
    if (!window.MAGameServer || !MB || !app) throw new Error("Le moteur de jeu n'est pas chargé.");
    const rnd = () => { const a = new Uint32Array(1); (window.crypto || window.msCrypto).getRandomValues(a); return a[0] / 4294967296; };
    engine = window.MAGameServer.createGame({
      db: adapter(MB.db), ts: () => MB.FieldValue.serverTimestamp(), rng: rnd, now: Date.now,
      variants: () => (window.MA_VARIANTS || []).map((v) => ({ id: v[0], base: v[1], name: v[2], power: v[3], speed: v[4], zero: v[5], brand: "", category: "", year: 0 })),
      cardPool: async () => (window.MAApp.ctx().cars || []).map((c) => ({ id: c.id, power: Number(c.stats && c.stats.power) || 0, speed: Number(c.stats && c.stats.speed) || 0, zero: Number(c.stats && c.stats.zero) || 0, name: ((c.brand || "") + " " + (c.model || "")).trim(), brand: c.brand || "", category: c.category || "", year: window.MAGameCore.yearOf(c), pics: window.MAGameCore.picKeys(c) })),
      isAdmin: async () => !!window.MAApp.ctx().isAdmin
    });
    return engine;
  }
  async function callLocal(name, data) {
    if (SERVER_ONLY[name]) { const e = new Error("Les échanges ont besoin du serveur de jeu (Cloud Functions), qui n'est pas encore déployé."); e.code = "unavailable"; throw e; }
    const user = window.MAFB.auth.currentUser;
    if (!user) { const e = new Error(FRIENDLY.unauthenticated); e.code = "unauthenticated"; throw e; }
    const g = getEngine();
    try { return await g[name]({ uid: user.uid, name: user.displayName || "" }, JSON.parse(JSON.stringify(data || {}))); }
    catch (e) { throw friendly(e); }
  }

  // ---- attente visible : le bouton qui a déclenché l'appel affiche un petit chargement jusqu'à la réponse
  let lastBtn = null, lastAt = 0;
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("button, [role=button], .cta-btn"); if (b) { lastBtn = b; lastAt = Date.now(); } }, true);
  async function call(name, data) {
    const btn = lastBtn && lastBtn.isConnected && Date.now() - lastAt < 800 && !lastBtn.classList.contains("ma-busy") ? lastBtn : null;
    if (btn) { btn.classList.add("ma-busy"); btn.setAttribute("aria-busy", "true"); }
    try { return await callInner(name, data); }
    finally { if (btn) { btn.classList.remove("ma-busy"); btn.removeAttribute("aria-busy"); } }
  }
  async function callInner(name, data) {
    if (!localMode) {
      const fns = window.MAFB && window.MAFB.functions;
      if (fns) {
        try { return (await fns.httpsCallable(name)(data || {})).data; }
        catch (e) {
          const code = clean(e);
          if (!FALLBACK_CODES.test(code) && !(e && /fetch|network|cors/i.test(e.message || ""))) throw friendly(e);
          localMode = true;
        }
      } else localMode = true;
    }
    return callLocal(name, data);
  }
  window.MAGameAPI = { call, mode: () => (localMode ? "local" : "serveur") };
})();
