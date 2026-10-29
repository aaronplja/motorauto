/**
 * MOTORAUTO — outils d'administration : tableau de bord (visites, inscriptions, voitures les plus
 * consultées, signalements), sourdine des pilotes, journal des actions.
 *   stats/{yyyy-mm-dd}  { visits, signups }          (compteurs +1)
 *   car_views/{carId}   { n }                          (compteur +1)
 *   mutes/{uid}         { untilMs, perma, reason, by, byName, createdAt }
 *   admin_log/{auto}    { by, byName, action, target, targetName, detail, createdAt }
 */
(function () {
  "use strict";
  let C = null;
  const day = (d) => (d || new Date()).toISOString().slice(0, 10);
  const SS = { get: (k) => { try { return sessionStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (_) { /* ignoré */ } } };
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : t && t.seconds ? t.seconds * 1000 : 0);
  const ACTION_LABEL = {
    "lap-delete": "Chrono supprimé", "user-delete": "Profil supprimé", "car-delete": "Fiche supprimée", "suggestion-approve": "Proposition acceptée",
    "suggestion-reject": "Proposition refusée", "report-delete": "Message signalé supprimé", "report-dismiss": "Signalement ignoré", "admin-grant": "Grade accordé",
    "admin-revoke": "Grade retiré", "contact-delete": "Message de contact supprimé", "mute": "Mise en sourdine", "unmute": "Sourdine levée",
    "comment-delete": "Commentaire supprimé", "event-delete": "Sortie supprimée", "chat-delete": "Message du salon supprimé"
  };

  // ---------------------------------------------------------------- journal
  window.MALog = {
    async log(action, o) {
      if (!C || !C.user || !C.isAdmin) return;
      o = o || {};
      try {
        await C.db.collection("admin_log").add({
          by: C.user.uid, byName: C.pilotName().slice(0, 40), action: String(action).slice(0, 40),
          target: String(o.target || "").slice(0, 120), targetName: String(o.targetName || "").slice(0, 80), detail: String(o.detail || "").slice(0, 200),
          createdAt: C.FieldValue.serverTimestamp()
        });
      } catch (e) { console.warn("Journal : écriture impossible :", e.message); }
    }
  };

  // ---------------------------------------------------------------- compteurs publics
  function countVisit() {
    const k = "ma_visit_" + day();
    if (SS.get(k)) return;
    SS.set(k, "1");
    C.db.collection("stats").doc(day()).set({ visits: C.FieldValue.increment(1) }, { merge: true }).catch(() => {});
  }
  function countSignup() { C.db.collection("stats").doc(day()).set({ signups: C.FieldValue.increment(1) }, { merge: true }).catch(() => {}); }
  function countCarView(car) {
    const k = "ma_view_" + car.id;
    if (SS.get(k)) return;
    SS.set(k, "1");
    C.db.collection("car_views").doc(car.id).set({ n: C.FieldValue.increment(1) }, { merge: true }).catch(() => {});
  }

  // ---------------------------------------------------------------- tableau de bord
  async function renderDash(extra) {
    const box = document.getElementById("adm-dash"), esc = C.esc;
    if (!box) return;
    box.innerHTML = `<div class="empty-note">Chargement du tableau de bord…</div>`;
    try {
      const [st, views, mem] = await Promise.all([
        C.db.collection("stats").limit(120).get(),
        C.db.collection("car_views").limit(400).get(),
        C.db.collection("users").limit(500).get()
      ]);
      const days = new Map();
      st.forEach((d) => days.set(d.id, d.data()));
      const series = [];
      for (let i = 29; i >= 0; i--) { const dd = new Date(Date.now() - i * 86400000), k = day(dd); series.push({ k, v: (days.get(k) || {}).visits || 0, s: (days.get(k) || {}).signups || 0 }); }
      const sum = (arr, f) => arr.reduce((a, x) => a + (x[f] || 0), 0);
      const max = Math.max(1, ...series.map((x) => x.v));
      const top = [];
      views.forEach((d) => { const car = C.carsById.get(d.id); top.push({ id: d.id, n: (d.data() || {}).n || 0, name: car ? car.brand + " " + car.model : d.id }); });
      top.sort((a, b) => b.n - a.n);
      const sgSnap = await C.db.collection("suggestions").where("status", "==", "pending").limit(100).get().catch(() => ({ size: 0 }));
      const rpSnap = await C.db.collection("reports").where("status", "==", "open").limit(100).get().catch(() => ({ size: 0 }));
      box.innerHTML = `
        <div class="dash-grid">
          <div class="dash-card"><b>${sum(series.slice(-7), "v")}</b><span>Visites (7 jours)</span></div>
          <div class="dash-card"><b>${sum(series, "v")}</b><span>Visites (30 jours)</span></div>
          <div class="dash-card"><b>${sum(series.slice(-7), "s")}</b><span>Inscriptions (7 jours)</span></div>
          <div class="dash-card"><b>${mem.size}</b><span>Pilotes inscrits</span></div>
          <a class="dash-card ${rpSnap.size ? "alert" : ""}" href="#/admin/moderation" style="text-decoration:none;color:inherit"><b>${rpSnap.size}</b><span>Signalements en attente</span></a>
          <a class="dash-card ${sgSnap.size ? "alert" : ""}" href="#/admin/moderation" style="text-decoration:none;color:inherit"><b>${sgSnap.size}</b><span>Propositions en attente</span></a>
        </div>
        <div class="dash-cols">
          <div class="chart-box"><div class="panel-section-title nomargin">Visites par jour (30 derniers jours)</div>
            <div class="bars" role="img" aria-label="Histogramme des visites : ${sum(series, "v")} au total sur 30 jours">${series.map((x) => `<i style="height:${Math.max(2, Math.round((x.v / max) * 100))}%" title="${x.k} : ${x.v} visite(s), ${x.s} inscription(s)"></i>`).join("")}</div>
            <div class="bars-legend"><span>${series[0].k.slice(5)}</span><span>aujourd'hui</span></div></div>
          <div class="chart-box"><div class="panel-section-title nomargin">Voitures les plus consultées</div>
            <ol class="rank-list" style="list-style:none;padding:0;margin:.5rem 0 0">${top.length ? top.slice(0, 8).map((t, i) => `<li><a class="rank-row" href="#/voiture/${encodeURIComponent(t.id)}"><span class="rank-pos">${i + 1}</span><span class="rank-main"><b>${esc(t.name)}</b></span><span class="rank-score">${t.n}<small>vues</small></span></a></li>`).join("") : `<li class="empty-note small">Pas encore de consultations enregistrées.</li>`}</ol></div>
        </div>
        <p class="admin-note">Les visites comptent une fois par jour et par navigateur. Données basées sur les 30 derniers jours.</p>`;
    } catch (e) { box.innerHTML = `<div class="empty-note error">Tableau de bord indisponible (règles Firestore à republier ?) : ${esc(e.message)}</div>`; }
  }

  // ---------------------------------------------------------------- journal (affichage)
  async function renderLog() {
    const box = document.getElementById("admin-log-list"), esc = C.esc;
    box.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try {
      const s = await C.db.collection("admin_log").orderBy("createdAt", "desc").limit(100).get();
      box.innerHTML = s.empty ? `<div class="empty-note">Aucune action enregistrée pour l'instant.</div>` : s.docs.map((d) => {
        const x = d.data(), t = tsMs(x.createdAt);
        return `<div class="log-row"><time>${t ? new Date(t).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : ""}</time><b>${esc(x.byName || "Admin")}</b><span>${esc(ACTION_LABEL[x.action] || x.action)}${x.targetName ? " — " + esc(x.targetName) : ""}${x.detail ? " · " + esc(x.detail) : ""}</span></div>`;
      }).join("");
    } catch (e) { box.innerHTML = `<div class="empty-note error">Journal illisible : ${esc(e.message)}</div>`; }
  }

  // ---------------------------------------------------------------- sourdine
  let muteTarget = null;
  function openMute(uid, name) {
    muteTarget = { uid, name };
    document.getElementById("mute-who").textContent = "Pilote : " + name;
    document.getElementById("mute-reason").value = "";
    C.openModal(document.getElementById("mute-modal"));
  }
  const DUR = { "1h": 3600e3, "24h": 86400e3, "7d": 7 * 86400e3, "30d": 30 * 86400e3 };
  async function submitMute(e) {
    e.preventDefault();
    if (!C.isAdmin || !muteTarget) return;
    const d = document.getElementById("mute-dur").value, reason = document.getElementById("mute-reason").value.trim().slice(0, 140);
    const perma = d === "perma";
    try {
      await C.db.collection("mutes").doc(muteTarget.uid).set({
        untilMs: perma ? 4102444800000 : Date.now() + DUR[d], perma, reason, by: C.user.uid, byName: C.pilotName().slice(0, 40), createdAt: C.FieldValue.serverTimestamp()
      });
      window.MALog.log("mute", { target: muteTarget.uid, targetName: muteTarget.name, detail: (perma ? "définitive" : d) + (reason ? " — " + reason : "") });
      C.MA.notif.send(muteTarget.uid, { type: "mute", from: "MOTORAUTO", text: "Tu as été mis en sourdine" + (reason ? " : " + reason : "."), link: "index.html" });
      C.toast(muteTarget.name + " est en sourdine.", "ok");
      C.closeModal(document.getElementById("mute-modal"));
      if (C.Router.is("admin", { tab: "moderation" })) renderMutes();
    } catch (err) { C.toast("Sourdine impossible : " + err.message + " (règles Firestore publiées ?)", "err"); }
  }
  async function unmute(uid, name) {
    try {
      await C.db.collection("mutes").doc(uid).delete();
      window.MALog.log("unmute", { target: uid, targetName: name, detail: "sourdine levée" });
      C.toast("Sourdine levée.", "ok");
      renderMutes();
    } catch (err) { C.toast("Action refusée : " + err.message, "err"); }
  }
  async function renderMutes() {
    const box = document.getElementById("admin-mute-list"), esc = C.esc;
    if (!box) return;
    box.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try {
      const [ms, us] = await Promise.all([C.db.collection("mutes").limit(100).get(), C.db.collection("users").limit(500).get()]);
      const names = new Map(); us.forEach((d) => names.set(d.id, (d.data() || {}).username || "Pilote"));
      const rows = ms.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((m) => m.perma || m.untilMs > Date.now());
      box.innerHTML = rows.length ? rows.map((m) => `<div class="telemetry-row"><div class="pilot-row-text"><div class="pilot-row-name">${esc(names.get(m.id) || m.id)} <span class="mute-tag">${m.perma ? "définitive" : "jusqu'au " + new Date(m.untilMs).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span></div><div class="lap-meta">${esc(m.reason || "Sans motif")} · par ${esc(m.byName || "admin")}</div></div><button type="button" class="cta-btn btn-ghost compact-btn" data-mod="unmute" data-uid="${esc(m.id)}" data-name="${esc(names.get(m.id) || "")}">Lever</button></div>`).join("") : `<div class="empty-note">Aucun pilote en sourdine.</div>`;
    } catch (e) { box.innerHTML = `<div class="empty-note error">Lecture impossible : ${esc(e.message)}</div>`; }
  }

  function decorateProfile(uid) {
    const host = document.getElementById("pub-social");
    if (!host) return;
    let b = document.getElementById("pub-mute-btn");
    const show = C.isAdmin && C.user && uid !== C.user.uid && !C.MA.admins.has(uid);
    if (!show) { if (b) b.hidden = true; return; }
    if (!b) { b = document.createElement("button"); b.type = "button"; b.id = "pub-mute-btn"; b.className = "cta-btn btn-ghost compact-btn mute-btn"; b.textContent = "Mettre en sourdine"; host.appendChild(b); b.addEventListener("click", () => openMute(b.dataset.uid, b.dataset.name)); }
    b.hidden = false; b.dataset.uid = uid;
    b.dataset.name = (document.getElementById("pub-profile-name").textContent || "Pilote").trim();
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    countVisit();
    document.addEventListener("ma:car-rendered", (e) => countCarView(e.detail.car));
    document.addEventListener("ma:feed", (e) => { if (e.detail.type === "member") countSignup(); });
    // accès à l'administration depuis le garage (le bouton de l'en-tête est masqué sur petit écran)
    document.addEventListener("ma:auth", (e) => {
      const host = document.querySelector("#garage-modal .page-head-actions");
      if (!host) return;
      let a = document.getElementById("garage-admin-link");
      if (e.detail.isAdmin && !a) { a = document.createElement("a"); a.id = "garage-admin-link"; a.className = "cta-btn btn-ghost compact-btn"; a.href = "#/admin"; a.textContent = "🛡 Administration"; host.prepend(a); }
      else if (!e.detail.isAdmin && a) a.remove();
    });
    ctx.Router.register("admin", { enter: (p) => {
      if (p.tab === "tableau") renderDash();
      else if (p.tab === "moderation") renderMutes();
      else if (p.tab === "journal") renderLog();
    } });
    ctx.Router.register("pilot", { enter: (p) => { setTimeout(() => decorateProfile(p.uid), 400); } });
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-mod]");
      if (!t) return;
      e.stopPropagation();
      if (t.dataset.mod === "mute") openMute(t.dataset.uid, t.dataset.name);
      else if (t.dataset.mod === "unmute") unmute(t.dataset.uid, t.dataset.name);
    }, true);
    document.getElementById("mute-form").addEventListener("submit", submitMute);
  });
})();
