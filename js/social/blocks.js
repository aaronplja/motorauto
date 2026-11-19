/**
 * MOTORAUTO — blocage de pilotes (exigé pour les contenus créés par les utilisateurs).
 *   blocks/{uid}  { uids: [uid, …], updatedAt }   (lisible et modifiable uniquement par le pilote)
 * Un pilote bloqué n'apparaît plus dans les salons, les messages privés ni les commentaires de celui qui l'a bloqué.
 */
(function () {
  "use strict";
  const LS = "ma_blocks";
  let set = new Set(), uid = "", ready = null;
  try { JSON.parse(localStorage.getItem(LS) || "[]").forEach((x) => set.add(x)); } catch (_) { /* ignoré */ }
  const keep = () => { try { localStorage.setItem(LS, JSON.stringify(Array.from(set))); } catch (_) { /* ignoré */ } };
  const fire = () => document.dispatchEvent(new CustomEvent("ma:blocks", { detail: { uids: Array.from(set) } }));
  async function load(user) {
    if (!user || !window.MAFB) { uid = ""; return; }
    uid = user.uid;
    try {
      const s = await window.MAFB.db.collection("blocks").doc(uid).get();
      const r = s.exists && Array.isArray(s.data().uids) ? s.data().uids : [];
      set = new Set(r.concat(Array.from(set))); keep(); fire();
    } catch (_) { /* règles non publiées : blocage local seulement */ }
  }
  async function save() {
    keep(); fire();
    if (!uid || !window.MAFB) return;
    try { await window.MAFB.db.collection("blocks").doc(uid).set({ uids: Array.from(set).slice(0, 400), updatedAt: window.MAFB.FieldValue.serverTimestamp() }); } catch (_) { /* local */ }
  }
  const api = {
    has: (id) => !!id && set.has(id),
    list: () => Array.from(set),
    async toggle(target) { if (!target || target === uid) return false; if (set.has(target)) set.delete(target); else set.add(target); await save(); return set.has(target); }
  };
  window.MABlocks = api;
  document.addEventListener("ma:auth", (e) => { const u = e.detail && e.detail.user; if (u) load(u); else { uid = ""; set = new Set(); keep(); fire(); } });
  // salon (chat.html) : pas d'évènement ma:auth, on suit directement Firebase Auth
  if (window.MAFB && window.MAFB.auth && !window.MA_APP_PAGE) window.MAFB.auth.onAuthStateChanged((u) => { if (u) load(u); });
})();
