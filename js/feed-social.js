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
  // signalement : clé « f:<publication> » ou « c:<réponse> » en cours de saisie ; ensemble de ce que j'ai déjà signalé (cette session)
  const reporting = new Set(), reported = new Set();
  const REASONS = [["insulte", "Insultes / harcèlement"], ["spam", "Spam / publicité"], ["illegal", "Contenu choquant ou illégal"], ["perso", "Informations personnelles"], ["autre", "Autre"]];
  // anti-spam des réponses : délai mini entre deux réponses, plafond par minute, pas de doublon, pas de rafale de liens
  const COOLDOWN_MS = 9000, PER_MIN = 5, MAX_LINKS = 2;
  const sent = []; let lastText = "";
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
  const el_uid = (fid) => { const e = document.querySelector('.feed-soc[data-fid="' + String(fid).replace(/"/g, "") + '"]'); return e ? e.dataset.uid : ""; };
  function reportForm(key) {
    const esc = C.esc;
    return `<form class="fs-report" data-fs-rform="${esc(key)}"><label>Motif <select name="reason">${REASONS.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></label><button type="submit" class="cta-btn fill-btn compact-btn">Envoyer le signalement</button><button type="button" class="cta-btn btn-ghost compact-btn" data-fs-rcancel="${esc(key)}">Annuler</button></form>`;
  }
  function barHtml(fid) {
    const esc = C.esc, me = C.user && C.user.uid, m = reacts.get(fid) || new Map(), cs = comments.get(fid) || [], mine = me ? m.get(me) : null;
    const count = (e) => { let n = 0; m.forEach((v) => { if (v === e) n++; }); return n; };
    const btns = EMOJIS.map(([k, ic, lab]) => { const n = count(k); return `<button type="button" class="fs-btn${mine === k ? " on" : ""}" data-fs-react="${k}" aria-pressed="${mine === k}" aria-label="${esc(lab)}${n ? " (" + n + ")" : ""}"><span aria-hidden="true">${ic}</span>${n ? `<b>${n}</b>` : ""}</button>`; }).join("");
    const thread = open.has(fid) ? `<div class="fs-thread">${cs.map((c) => `<div class="fs-cmt"><b>${esc(c.pilot || "Pilote")}</b> <span>${esc(c.text)}</span> <small>${ago(tsMs(c.createdAt))}</small>${me && (c.uid === me || C.isAdmin) ? ` <button type="button" class="fs-del" data-fs-del="${esc(c.id)}" aria-label="Supprimer">✕</button>` : ""}${c.uid !== me ? ` <button type="button" class="fs-del fs-flag${reported.has("c:" + c.id) ? " on" : ""}" data-fs-report="c:${esc(c.id)}" aria-label="Signaler cette réponse" title="Signaler">⚑</button>` : ""}</div>${reporting.has("c:" + c.id) ? reportForm("c:" + c.id) : ""}`).join("")}
      <form class="fs-form" data-fs-form><input type="text" maxlength="300" placeholder="Répondre…" aria-label="Ta réponse" autocomplete="off"><button type="submit" class="cta-btn fill-btn compact-btn">Envoyer</button></form></div>` : "";
    const own = me && el_uid(fid) === me, flag = own ? "" : `<button type="button" class="fs-btn fs-flag${reported.has("f:" + fid) ? " on" : ""}" data-fs-report="f:${esc(fid)}" aria-label="Signaler cette publication" title="Signaler"><span aria-hidden="true">⚑</span></button>`;
    return `<div class="fs-bar">${btns}${flag}<button type="button" class="fs-btn fs-reply${open.has(fid) ? " on" : ""}" data-fs-thread aria-expanded="${open.has(fid)}"><span aria-hidden="true">💬</span><b>${cs.length ? cs.length : "Répondre"}</b></button></div>${reporting.has("f:" + fid) ? reportForm("f:" + fid) : ""}${thread}`;
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
  /** signalement : même collection « reports » que le chat (l'administrateur les traite dans Admin › Signalements) */
  async function sendReport(el, key, reason) {
    if (!C.requireLogin()) return;
    const kind = key.charAt(0), id = key.slice(2), fid = el.dataset.fid;
    let msgPath, msgUid, msgPilot, msgText;
    if (kind === "c") {
      const c = (comments.get(fid) || []).find((x) => x.id === id); if (!c) return;
      msgPath = "comments/" + id; msgUid = c.uid || ""; msgPilot = c.pilot || "Pilote"; msgText = c.text || "";
    } else {
      const ent = el.closest(".feed-entry"), who = ent && ent.querySelector(".feed-text b"), tx = ent && ent.querySelector(".feed-text");
      msgPath = "feed/" + fid; msgUid = el.dataset.uid || ""; msgPilot = who ? who.textContent : "MOTORAUTO";
      msgText = tx ? tx.textContent.replace(msgPilot, "").trim() : "";
    }
    try {
      await C.db.collection("reports").doc(C.user.uid + "_" + (kind === "c" ? id : fid)).set({
        msgPath: msgPath.slice(0, 200), msgId: (kind === "c" ? id : fid).slice(0, 60), msgUid: String(msgUid).slice(0, 60), msgPilot: String(msgPilot).slice(0, 40),
        msgText: String(msgText).slice(0, 300), reporterUid: C.user.uid, reporter: C.pilotName().slice(0, 40),
        reason: REASONS.some((r) => r[0] === reason) ? reason : "autre", details: "fil d'actualité", status: "open", createdAt: C.FieldValue.serverTimestamp()
      });
      reported.add(key); reporting.delete(key); paint(el);
      C.toast("Merci, le signalement a été transmis à l'administrateur.", "ok");
    } catch (e) {
      reporting.delete(key); reported.add(key); paint(el);
      C.toast(e && e.code === "permission-denied" ? "Tu as déjà signalé ça." : "Signalement impossible : " + e.message, e && e.code === "permission-denied" ? "ok" : "err");
    }
  }
  /** garde-fous côté navigateur (la règle Firestore impose aussi un délai mini entre deux réponses) */
  function spamCheck(text) {
    const now = Date.now(); while (sent.length && now - sent[0] > 60000) sent.shift();
    if (sent.length && now - sent[sent.length - 1] < COOLDOWN_MS) return "Doucement : attends quelques secondes avant de répondre.";
    if (sent.length >= PER_MIN) return "Tu envoies trop de réponses : réessaie dans une minute.";
    if (lastText && text.toLowerCase() === lastText) return "Tu as déjà envoyé ce message.";
    if ((text.match(/https?:\/\/|www\./gi) || []).length > MAX_LINKS) return "Les liens sont limités à 2 par réponse.";
    return "";
  }
  async function reply(el, text) {
    if (!C.requireLogin()) return false;
    text = String(text || "").trim().slice(0, 300); if (!text) return false;
    if (C.MA && C.MA.mute && C.MA.mute.active()) { C.toast(C.MA.mute.message(), "err"); return false; }
    const bad = spamCheck(text); if (bad) { C.toast(bad, "err"); return false; }
    const doc = { kind: "feed", target: el.dataset.fid, uid: C.user.uid, pilot: C.pilotName().slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400), text, createdAt: C.FieldValue.serverTimestamp() };
    try {
      // la réponse et le « tampon » d'horodatage partent ensemble : la règle Firestore refuse une réponse sans lui ou trop rapprochée de la précédente
      const ref = C.db.collection("comments").doc(), batch = C.db.batch();
      batch.set(ref, doc); batch.set(C.db.collection("feed_rate").doc(C.user.uid), { at: C.FieldValue.serverTimestamp() });
      await batch.commit();
      sent.push(Date.now()); lastText = text.toLowerCase();
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
      const r = e.target.closest("[data-fs-react]"), t = e.target.closest("[data-fs-thread]"), d = e.target.closest("[data-fs-del]"), fl = e.target.closest("[data-fs-report]"), rc = e.target.closest("[data-fs-rcancel]");
      if (fl) { if (!C.requireLogin()) return; const k = fl.dataset.fsReport; if (reported.has(k)) { C.toast("Tu as déjà signalé ça.", "ok"); return; } if (reporting.has(k)) reporting.delete(k); else reporting.add(k); paint(el); }
      else if (rc) { reporting.delete(rc.dataset.fsRcancel); paint(el); }
      else if (r) react(el, r.dataset.fsReact);
      else if (t) { const f = el.dataset.fid; if (open.has(f)) open.delete(f); else open.add(f); paint(el); const i = el.querySelector(".fs-form input"); if (i) i.focus(); }
      else if (d) { const f = el.dataset.fid, id = d.dataset.fsDel; try { await C.db.collection("comments").doc(id).delete(); comments.set(f, (comments.get(f) || []).filter((x) => x.id !== id)); paint(el); } catch (er) { C.toast("Suppression refusée : " + er.message, "err"); } }
    });
    document.addEventListener("submit", async (e) => {
      const rf = e.target.closest("[data-fs-rform]");
      if (rf) { e.preventDefault(); const el = rf.closest(".feed-soc"); if (el) sendReport(el, rf.dataset.fsRform, rf.querySelector("select").value); return; }
      const f = e.target.closest("[data-fs-form]"); if (!f) return;
      e.preventDefault(); const el = f.closest(".feed-soc"), i = f.querySelector("input");
      if (await reply(el, i.value)) i.value = "";
    });
  });
})();
