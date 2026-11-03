/**
 * MOTORAUTO — présence : « en ligne » / « dernière connexion il y a… » sur les profils et dans le chat.
 *   presence/{uid}  { at: horodatage de la dernière activité, hide: true si le pilote a désactivé l'affichage }
 * Activée par défaut ; chaque pilote peut la désactiver dans Réglages › Profil › Confidentialité.
 * Quand elle est désactivée, le pilote n'affiche rien et ne voit pas non plus celle des autres (réciprocité).
 */
(function () {
  "use strict";
  const BEAT = 150000, ONLINE = 5 * 60000, LS = "ma_presence_hide";
  let me = null, hide = false, timer = null, loaded = false;
  const cache = new Map();   // uid -> { t, v }
  const db = () => (window.MAFB && window.MAFB.db) || null;
  const FV = () => window.MAFB && window.MAFB.FieldValue;
  try { hide = localStorage.getItem(LS) === "1"; } catch (_) { /* stockage indisponible */ }

  function ms(t) { return t && t.toMillis ? t.toMillis() : t && t.seconds ? t.seconds * 1000 : 0; }
  function text(at) {
    const d = Date.now() - at;
    if (d < ONLINE) return "En ligne";
    const m = Math.round(d / 60000);
    if (m < 60) return "Vu il y a " + m + " min";
    const h = Math.round(m / 60);
    if (h < 24) return "Vu il y a " + h + " h";
    const j = Math.round(h / 24);
    if (j === 1) return "Vu hier";
    if (j < 30) return "Vu il y a " + j + " jours";
    return "Vu il y a plus d'un mois";
  }
  async function beat() {
    if (!me || !db() || document.hidden) return;
    try { await db().collection("presence").doc(me.uid).set({ at: FV().serverTimestamp(), hide: !!hide }); } catch (_) { /* hors ligne ou règles non publiées */ }
  }
  function start() { stop(); beat(); timer = setInterval(beat, BEAT); }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  async function setHidden(b) {
    hide = !!b; try { localStorage.setItem(LS, hide ? "1" : "0"); } catch (_) { /* ignoré */ }
    cache.clear(); await beat();
  }
  /** { online, text } ou null si le pilote masque sa présence (ou si on masque la sienne) */
  async function get(uid) {
    if (!uid || hide || !me || !db()) return null;
    const c = cache.get(uid); if (c && Date.now() - c.t < 60000) return c.v;
    let v = null;
    try {
      const s = await db().collection("presence").doc(uid).get();
      if (s.exists) { const x = s.data(), at = ms(x.at); if (!x.hide && at) v = { online: Date.now() - at < ONLINE, text: text(at), at }; }
    } catch (_) { v = null; }
    cache.set(uid, { t: Date.now(), v }); return v;
  }
  /** ajoute un point vert aux éléments [data-presence="uid"] dont le pilote est en ligne */
  function paint(root) {
    (root || document).querySelectorAll("[data-presence]").forEach(async (el) => {
      const p = await get(el.dataset.presence);
      const host = el.closest(".conv-item") || el.parentNode;
      if (!host) return;
      const old = host.querySelector(".presence-dot"); if (old) old.remove();
      if (p && p.online) { const i = document.createElement("i"); i.className = "presence-dot"; i.title = "En ligne"; const n = host.querySelector(".conv-name"); (n || host).appendChild(i); }
    });
  }
  function syncCheckbox() { const cb = document.getElementById("settings-show-presence"); if (cb) cb.checked = !hide; }

  function init() {
    if (!window.MAFB || !window.MAFB.auth) return setTimeout(init, 300);
    window.MAFB.auth.onAuthStateChanged(async (u) => {
      me = u || null; loaded = false;
      if (!me) { stop(); return; }
      try { const s = await db().collection("presence").doc(me.uid).get(); if (s.exists && typeof s.data().hide === "boolean") { hide = s.data().hide; try { localStorage.setItem(LS, hide ? "1" : "0"); } catch (_) { /* ignoré */ } } } catch (_) { /* valeur locale */ }
      loaded = true; syncCheckbox(); start();
    });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) beat(); });
    document.addEventListener("change", (e) => { if (e.target && e.target.id === "settings-show-presence") setHidden(!e.target.checked).then(() => { if (window.MA && window.MA.toast) window.MA.toast(e.target.checked ? "Ta présence est visible." : "Ta présence est masquée.", "ok"); }); });
    document.addEventListener("ma:route", syncCheckbox);
    syncCheckbox();
  }
  window.MAPresence = { get, paint, setHidden, isHidden: () => hide, text };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
