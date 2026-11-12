/**
 * MOTORAUTO — fil d'actualité : réactions rapides (👍 🔥 ❤️ 😮) et réponses sous chaque publication.
 *   reactions/{feed_<idPublication>_<uid>}  { kind:"feed", target, uid, emoji, createdAt }
 *   comments/{auto}                         { kind:"feed", target, uid, pilot, avatar, text, createdAt }
 * Même collections que les fiches (règles : kind « feed » accepté). Le pilote qui a publié est prévenu.
 */
(function () {
  "use strict";
  const EMOJIS = [["up", "👍", "J'aime"], ["fire", "🔥", "Canon"], ["love", "❤️", "J'adore"], ["wow", "😮", "Impressionnant"]];
  const reacts = new Map(), comments = new Map(), open = new Set();
  let C = null, loadedAt = 0, loading = null;
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : t && t.seconds ? t.seconds * 1000 : typeof t === "number" ? t : Date.now());
  const ago = (ms) => { const m = Math.max(0, Math.round((Date.now() - ms) / 60000)); return m < 1 ? "à l'instant" : m < 60 ? m + " min" : m < 1440 ? Math.floor(m / 60) + " h" : Math.floor(m / 1440) + " j"; };

  async function load(force) {
    if (!force && Date.now() - loadedAt < 30000) return;
    if (loading) return loading;
    loading = (async () => {
      try {
        const [r, c] = await Promise.all([C.db.collection("reactions").where("kind", "==", "feed").limit(1500).get(), C.db.collection("comments").where("kind", "==", "feed").limit(1500).get()]);
        reacts.clear(); comments.clear();
        r.docs.forEach((d) => { const x = d.data(); if (!reacts.has(x.target)) reacts.set(x.target, new Map()); reacts.get(x.target).set(x.uid, x.emoji); });
        c.docs.forEach((d) => { const x = d.data(); if (!comments.has(x.target)) comments.set(x.target, []); comments.get(x.target).push(Object.assign({ id: d.id }, x)); });
        comments.forEach((l) => l.sort((a, b) => tsMs(a.createdAt) - tsMs(b.createdAt)));
        loadedAt = Date.now();
      } catch (_) { /* lecture refusée : on affiche simplement des compteurs à zéro */ }
      loading = null;
    })();
    return loading;
  }
  function barHtml(fid) {
    const esc = C.esc, me = C.user && C.user.uid, m = reacts.get(fid) || new Map(), cs = comments.get(fid) || [], mine = me ? m.get(me) : null;
    const count = (e) => { let n = 0; m.forEach((v) => { if (v === e) n++; }); return n; };
    const btns = EMOJIS.map(([k, ic, lab]) => { const n = count(k); return `<button type="button" class="fs-btn${mine === k ? " on" : ""}" data-fs-react="${k}" aria-pressed="${mine === k}" aria-label="${esc(lab)}${n ? " (" + n + ")" : ""}"><span aria-hidden="true">${ic}</span>${n ? `<b>${n}</b>` : ""}</button>`; }).join("");
    const thread = open.has(fid) ? `<div class="fs-thread">${cs.map((c) => `<div class="fs-cmt"><b>${esc(c.pilot || "Pilote")}</b> <span>${esc(c.text)}</span> <small>${ago(tsMs(c.createdAt))}</small>${me && (c.uid === me || C.isAdmin) ? ` <button type="button" class="fs-del" data-fs-del="${esc(c.id)}" aria-label="Supprimer">✕</button>` : ""}</div>`).join("")}
      <form class="fs-form" data-fs-form><input type="text" maxlength="300" placeholder="Répondre…" aria-label="Ta réponse" autocomplete="off"><button type="submit" class="cta-btn fill-btn compact-btn">Envoyer</button></form></div>` : "";
    return `<div class="fs-bar">${btns}<button type="button" class="fs-btn fs-reply${open.has(fid) ? " on" : ""}" data-fs-thread aria-expanded="${open.has(fid)}"><span aria-hidden="true">💬</span><b>${cs.length ? cs.length : "Répondre"}</b></button></div>${thread}`;
  }
  function paint(el) { const typed = el.querySelector(".fs-form input"); const v = typed ? typed.value : ""; const had = typed && document.activeElement === typed; el.innerHTML = barHtml(el.dataset.fid); const i = el.querySelector(".fs-form input"); if (i) { i.value = v; if (had) i.focus(); } }
  async function hydrate(root) {
    const els = Array.from((root || document).querySelectorAll(".feed-soc[data-fid]")); if (!els.length) return;
    els.forEach(paint);
    await load(false);
    els.forEach((el) => { if (document.body.contains(el)) paint(el); });
  }
  function ping(el, text, tag) {
    const uid = el.dataset.uid; if (!uid || !C.user || uid === C.user.uid || !C.MA || !C.MA.notif || !C.MA.notif.send) return;
    try { C.MA.notif.send(uid, { type: "comment", from: C.pilotName(), text, link: "index.html#/communaute/fil" }, "feed_" + el.dataset.fid + "_" + C.user.uid + "_" + tag); } catch (_) { /* facultatif */ }
  }
  async function react(el, emoji) {
    if (!C.requireLogin()) return;
    const fid = el.dataset.fid, me = C.user.uid;
    if (!reacts.has(fid)) reacts.set(fid, new Map());
    const m = reacts.get(fid), prev = m.get(me) || null, next = prev === emoji ? null : emoji, ref = C.db.collection("reactions").doc("feed_" + fid + "_" + me);
    if (next) m.set(me, next); else m.delete(me);
    paint(el);
    try {
      if (!next) await ref.delete(); else { await ref.set({ kind: "feed", target: fid, uid: me, emoji: next, createdAt: C.FieldValue.serverTimestamp() }); if (!prev) ping(el, "a réagi à ta publication " + (EMOJIS.find((x) => x[0] === next) || [])[1], "r"); }
    } catch (e) { if (prev) m.set(me, prev); else m.delete(me); paint(el); C.toast("Réaction refusée : " + e.message, "err"); }
  }
  async function reply(el, text) {
    if (!C.requireLogin()) return false;
    text = String(text || "").trim().slice(0, 300); if (!text) return false;
    const doc = { kind: "feed", target: el.dataset.fid, uid: C.user.uid, pilot: C.pilotName().slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400), text, createdAt: C.FieldValue.serverTimestamp() };
    try {
      const ref = await C.db.collection("comments").add(doc);
      if (!comments.has(doc.target)) comments.set(doc.target, []);
      comments.get(doc.target).push(Object.assign({ id: ref.id }, doc, { createdAt: Date.now() }));
      ping(el, "a répondu : " + text.slice(0, 80), "c" + Date.now()); paint(el); return true;
    } catch (e) { C.toast("Réponse refusée : " + e.message, "err"); return false; }
  }
  window.MAFeedSocial = { hydrate };
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    document.addEventListener("click", async (e) => {
      const el = e.target.closest(".feed-soc"); if (!el) return;
      const r = e.target.closest("[data-fs-react]"), t = e.target.closest("[data-fs-thread]"), d = e.target.closest("[data-fs-del]");
      if (r) react(el, r.dataset.fsReact);
      else if (t) { const f = el.dataset.fid; if (open.has(f)) open.delete(f); else open.add(f); paint(el); const i = el.querySelector(".fs-form input"); if (i) i.focus(); }
      else if (d) { const f = el.dataset.fid, id = d.dataset.fsDel; try { await C.db.collection("comments").doc(id).delete(); comments.set(f, (comments.get(f) || []).filter((x) => x.id !== id)); paint(el); } catch (er) { C.toast("Suppression refusée : " + er.message, "err"); } }
    });
    document.addEventListener("submit", async (e) => {
      const f = e.target.closest("[data-fs-form]"); if (!f) return;
      e.preventDefault(); const el = f.closest(".feed-soc"), i = f.querySelector("input");
      if (await reply(el, i.value)) i.value = "";
    });
  });
})();
