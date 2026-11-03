/**
 * MOTORAUTO — mentorat : les pilotes de niveau 4 et plus peuvent se proposer comme mentors ; un nouveau pilote leur écrit
 * (demande + message privé + notification). Quand le mentor accepte, il gagne de l'XP et des badges.
 *   mentors/{uid}                    { uid, name, avatar, createdAt }
 *   mentor_requests/{mentor}_{uid}   { mentorUid, uid, name, status: "open" | "accepted", createdAt }
 */
(function () {
  "use strict";
  let C = null;
  const MIN_LEVEL = 4, T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const hashUid = () => { const m = /#\/pilote\/([^/?#]+)/.exec(location.hash || ""); return m ? decodeURIComponent(m[1]) : ""; };
  const levelOf = (uid) => { try { return window.MAGame.levelOf(window.MAGame.statsOf(uid).xp).level.n; } catch (_) { return 1; } };
  async function paint() {
    const uid = hashUid(), host = document.getElementById("pub-level-card"); if (!uid || !host || !C.user) return;
    host.querySelectorAll(".mentor-zone").forEach((n) => n.remove());
    try { if (window.MAGame) await window.MAGame.loadAll(); } catch (_) { /* niveau inconnu */ }
    const me = C.user.uid, mine = uid === me;
    let ment = null, reqs = [];
    try { const s = await C.db.collection("mentors").doc(uid).get(); ment = s.exists ? s.data() : null; } catch (_) { /* règles */ }
    if (mine) { try { reqs = (await C.db.collection("mentor_requests").where("mentorUid", "==", me).limit(30).get()).docs.map((d) => Object.assign({ id: d.id }, d.data())); } catch (_) { /* règles */ } }
    let sent = null; if (!mine && ment) { try { const s = await C.db.collection("mentor_requests").doc(uid + "_" + me).get(); sent = s.exists ? s.data() : null; } catch (_) { /* règles */ } }
    const z = document.createElement("div"); z.className = "mentor-zone";
    const open = reqs.filter((r) => r.status === "open");
    if (mine) {
      const ok = levelOf(me) >= MIN_LEVEL;
      z.innerHTML = ment ? `<p><b>🎓 ${T("Tu es mentor")}</b> · ${T("les nouveaux pilotes peuvent te demander conseil.")}</p>${open.length ? `<ul class="mentor-reqs">${open.map((r) => `<li><span>${C.esc(r.name || "Pilote")}</span><a class="cta-btn btn-ghost compact-btn" href="chat.html#dm/${encodeURIComponent(r.uid)}">💬</a><button type="button" class="cta-btn fill-btn compact-btn" data-mentor-accept="${C.esc(r.id)}">${T("Accepter")}</button></li>`).join("")}</ul>` : ""}<button type="button" class="cta-btn btn-ghost compact-btn" data-mentor-toggle="off">${T("Ne plus être mentor")}</button>`
        : ok ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-mentor-toggle="on">🎓 ${T("Devenir mentor")}</button><small class="lap-meta">${T("Aide les nouveaux pilotes : badge et XP à la clé.")}</small>` : `<small class="lap-meta">🎓 ${T("Le mentorat s'ouvre au niveau")} ${MIN_LEVEL}.</small>`;
    } else if (ment) {
      z.innerHTML = `<p><b>🎓 ${T("Mentor")}</b> · ${T("ce pilote aide les nouveaux venus.")}</p>${sent ? `<small class="lap-meta">${sent.status === "accepted" ? T("Demande acceptée") : T("Demande envoyée")}</small>` : `<button type="button" class="cta-btn fill-btn compact-btn" data-mentor-ask="${C.esc(uid)}">${T("Demander un mentorat")}</button>`}`;
    } else return;
    host.appendChild(z);
  }
  async function toggle(on) {
    const me = C.user.uid; try {
      if (on) await C.db.collection("mentors").doc(me).set({ uid: me, name: String(C.pilotName ? C.pilotName() : "Pilote").slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400), createdAt: C.FieldValue.serverTimestamp() });
      else await C.db.collection("mentors").doc(me).delete();
      C.toast(on ? "Tu es mentor : merci !" : "Mentorat désactivé.", "ok"); paint();
    } catch (e) { C.toast(e.message, "err"); }
  }
  async function ask(mentorUid) {
    if (!C.requireLogin()) return;
    const me = C.user.uid, name = String(C.pilotName ? C.pilotName() : "Pilote").slice(0, 40);
    try {
      await C.db.collection("mentor_requests").doc(mentorUid + "_" + me).set({ mentorUid, uid: me, name, status: "open", createdAt: C.FieldValue.serverTimestamp() });
      try { C.MA.notif.send(mentorUid, { type: "mentor", from: name, text: "te demande un mentorat", link: "index.html?pilot=" + encodeURIComponent(me) }, "mentor_" + me); } catch (_) { /* facultatif */ }
      C.toast("Demande envoyée. Tu peux aussi lui écrire en message privé.", "ok");
      location.href = "chat.html#dm/" + encodeURIComponent(mentorUid);
    } catch (e) { C.toast(e.message, "err"); }
  }
  async function accept(id) {
    try { await C.db.collection("mentor_requests").doc(id).update({ status: "accepted" }); C.toast("Mentorat accepté : +XP et badge de mentor.", "ok"); if (window.MAGame) window.MAGame.invalidate(); paint(); } catch (e) { C.toast(e.message, "err"); }
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.Router.register("pilot", { enter: () => { setTimeout(paint, 900); setTimeout(paint, 2400); } });
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-mentor-toggle]"); if (t) { toggle(t.dataset.mentorToggle === "on"); return; }
      const a = e.target.closest("[data-mentor-ask]"); if (a) { ask(a.dataset.mentorAsk); return; }
      const c = e.target.closest("[data-mentor-accept]"); if (c) accept(c.dataset.mentorAccept);
    });
  });
})();
