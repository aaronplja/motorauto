/**
 * MOTORAUTO — cadres d'avatar et titres.
 * Purement décoratifs : l'équipement choisi est stocké dans cosmetics/{uid} (lisible par tous) ;
 * les droits sont calculés ici d'après le niveau d'XP, les succès, le pass de saison et le classement.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  if (!G) return;
  const cache = new Map(), pending = new Set();
  let db = null, me = null, timer = 0, T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const dbOf = () => db || (window.firebase && window.firebase.apps && window.firebase.apps.length ? (db = window.firebase.firestore()) : null);
  const frameOk = (id) => !!G.FRAMES[id], titleOk = (id) => !!G.TITLES[id];

  /** récupère les cosmétiques de plusieurs pilotes (10 par requête) puis redécore la page */
  async function load(uids) {
    const d = dbOf(); if (!d) return;
    const need = Array.from(new Set(uids)).filter((u) => u && !cache.has(u) && !pending.has(u));
    need.forEach((u) => pending.add(u));
    for (let i = 0; i < need.length; i += 10) {
      const part = need.slice(i, i + 10);
      try {
        const s = await d.collection("cosmetics").where(window.firebase.firestore.FieldPath.documentId(), "in", part).get();
        part.forEach((u) => cache.set(u, {}));
        s.forEach((x) => cache.set(x.id, x.data() || {}));
      } catch (_) { part.forEach((u) => cache.set(u, {})); }
      part.forEach((u) => pending.delete(u));
    }
    decorate(document);
  }
  const get = (uid) => cache.get(uid) || {};
  const hashUid = () => { const m = /#\/pilote\/([^/?#]+)/.exec(location.hash || ""); return m ? decodeURIComponent(m[1]) : ""; };
  const uidOf = (el) => {
    if (el.id === "pub-profile-avatar") return hashUid();
    if (el.dataset && el.dataset.uid) return el.dataset.uid;
    const a = el.closest && el.closest('a[href*="#/pilote/"]');
    if (a) { const m = /#\/pilote\/([^/?#]+)/.exec(a.getAttribute("href") || ""); if (m) return decodeURIComponent(m[1]); }
    const w = el.closest && el.closest("[data-uid]"); return w ? w.dataset.uid : "";
  };
  /** applique cadres et titres aux avatars et noms du bloc donné */
  function decorate(root) {
    root = root || document;
    const imgs = root.querySelectorAll ? root.querySelectorAll("img.pilot-row-avatar, img.avatar[data-uid], img.avatar[data-action='profile'], #pub-profile-avatar") : [];
    const want = [];
    imgs.forEach((im) => { const u = uidOf(im); if (u) { want.push(u); const c = cache.get(u); if (c) paint(im, c, u); } });
    const rows = root.querySelectorAll ? root.querySelectorAll("a.rank-row") : [];
    rows.forEach((r) => { const u = uidOf(r); if (u) { want.push(u); const c = cache.get(u); if (c) title(r.querySelector(".rank-main b"), c); } });
    (root.querySelectorAll ? root.querySelectorAll(".msg-author[data-uid]") : []).forEach((b) => { const u = b.dataset.uid; want.push(u); const c = cache.get(u); if (c) title(b, c); });
    const pn = root.querySelector && root.querySelector("#pub-profile-name"), pu = hashUid();
    if (pn && pu) { want.push(pu); const c = cache.get(pu); if (c) { const old = pn.parentElement.querySelector(".cosm-title"); if (old) old.remove(); title(pn, c); } }
    const need = want.filter((u) => !cache.has(u) && !pending.has(u));
    if (need.length) { clearTimeout(timer); timer = setTimeout(() => load(need), 60); }
  }
  function paint(im, c, u) {
    const f = frameOk(c.frame) ? c.frame : "";
    const cur = im.dataset.cosmF || "";
    if (cur === f) return;
    im.classList.remove("cosm-f", ...Array.from(im.classList).filter((x) => x.indexOf("cf-") === 0));
    if (f) { im.classList.add("cosm-f", "cf-" + f); im.style.setProperty("--cf", G.FRAMES[f].color); }
    im.dataset.cosmF = f;
  }
  function title(b, c) {
    if (!b || !titleOk(c.title) || b.parentElement.querySelector(".cosm-title")) return;
    const s = document.createElement("small"); s.className = "cosm-title"; s.textContent = T(G.TITLES[c.title].name); b.insertAdjacentElement("afterend", s);
  }
  /** html d'un titre pour un pilote (peut être vide tant que les données ne sont pas là) */
  const titleHtml = (uid) => { const c = get(uid); return titleOk(c.title) ? `<span class="cosm-title">${T(G.TITLES[c.title].name)}</span>` : ""; };

  // ------------------------------------------------------------------ droits
  function badgeName(id) { const b = (window.MAGame && window.MAGame.BADGES || []).find((x) => x.id === id); return b ? b.name || b.label || id : id; }
  function levelN(uid) { try { return window.MAGame.levelOf(window.MAGame.statsOf(uid).xp).level.n; } catch (_) { return 1; } }
  function unlocked(kind, id, uid, doc) {
    const def = (kind === "f" ? G.FRAMES : G.TITLES)[id]; if (!def) return false;
    const cosm = (doc && doc.cosm) || [], mine = get(uid);
    if (def.src === "level") return levelN(uid) >= def.v;
    if (def.src === "badge") { try { return window.MAGame.earned(uid).indexOf(def.v) >= 0; } catch (_) { return false; } }
    if (def.src === "tier" || def.src === "quest" || def.src === "clash") return cosm.indexOf(kind + ":" + id) >= 0;
    if (def.src === "top") return (Number(mine.top) || 99) <= def.v;
    const bt = (doc && doc.bt) || {};
    if (def.src === "bwin") return (Number(bt.w) || 0) >= def.v;
    if (def.src === "bflaw") return (Number(bt.flawless) || 0) >= def.v;
    if (def.src === "bbest") return (Number(bt.best) || 0) >= def.v;
    if (def.src === "bgiant") return (Number(bt.giant) || 0) >= def.v;
    return false;
  }
  function req(kind, id) {
    const d = (kind === "f" ? G.FRAMES : G.TITLES)[id];
    return d.src === "bwin" ? `${d.v} victoires en bataille contre l'IA` : d.src === "bflaw" ? "Gagner une bataille 5-0" : d.src === "bbest" ? `${d.v} victoires de suite en bataille` : d.src === "bgiant" ? "Battre une Épique ou une Légendaire avec une Commune" : d.src === "level" ? `Niveau ${d.v}` : d.src === "badge" ? `Succès « ${badgeName(d.v)} »` : d.src === "tier" ? `Palier ${d.v} du pass de saison` : d.src === "quest" ? "Terminer la chaîne de quêtes de saison" : d.src === "clash" ? "Faire gagner ton club au défi de la semaine" : `Top ${d.v} du classement des pilotes`;
  }
  async function equip(uid, patch) {
    const d = dbOf(); if (!d) throw new Error("Base indisponible.");
    const cur = Object.assign({}, get(uid), patch);
    const data = { frame: cur.frame || "", title: cur.title || "", top: Number(cur.top) || 0, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() };
    await d.collection("cosmetics").doc(uid).set(data);
    cache.set(uid, Object.assign({}, data)); decorate(document);
  }
  /** appelé par le classement : un podium débloque les cosmétiques « Top » */
  async function noteTop(uid, rank) {
    if (!uid || rank < 1 || rank > 3) return;
    const c = get(uid); if (c.top && c.top <= rank) return;
    try { await equip(uid, { top: rank }); } catch (_) { /* cosmétique : sans importance */ }
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) { me = ctx; db = ctx.db; if (ctx.user) load([ctx.user.uid]); });
  window.MACosm = { load, get, decorate, titleHtml, unlocked, req, equip, noteTop, frames: G.FRAMES, titles: G.TITLES };
  const obs = () => { let q = 0; new MutationObserver(() => { if (q) return; q = requestAnimationFrame(() => { q = 0; decorate(document); }); }).observe(document.body, { childList: true, subtree: true }); };
  if (document.body) obs(); else document.addEventListener("DOMContentLoaded", obs);
})();
