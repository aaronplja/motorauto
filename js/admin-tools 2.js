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
  // cache court des grosses lectures de l'admin (pilotes, chronos, catalogue) : évite de les relire à chaque onglet
  const _cache = new Map();
  window.MAAdminCache = {
    get(key, fn, ttl) {
      const hit = _cache.get(key), t = Date.now();
      if (hit && t - hit.at < (ttl || 90000)) return hit.p;
      const p = Promise.resolve().then(fn); _cache.set(key, { at: t, p });
      p.catch(() => _cache.delete(key));
      return p;
    },
    clear() { _cache.clear(); }
  };
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
  let dashState = { days: 30 };
  const nf = (n) => Number(n || 0).toLocaleString("fr-FR");
  function chartSvg(series) {
    const W = 640, H = 200, P = { l: 34, r: 10, t: 12, b: 24 }, w = W - P.l - P.r, h = H - P.t - P.b;
    const max = Math.max(4, ...series.map((x) => x.v)), step = Math.ceil(max / 4), top = step * 4;
    const x = (i) => P.l + (series.length < 2 ? w / 2 : (i / (series.length - 1)) * w), y = (v) => P.t + h - (v / top) * h;
    const line = series.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.v).toFixed(1)).join(" ");
    const area = line + ` L${x(series.length - 1).toFixed(1)} ${P.t + h} L${x(0).toFixed(1)} ${P.t + h} Z`;
    const grid = [0, 1, 2, 3, 4].map((k) => { const v = k * step, yy = y(v).toFixed(1); return `<line x1="${P.l}" x2="${W - P.r}" y1="${yy}" y2="${yy}" class="dg"/><text x="${P.l - 6}" y="${(+yy + 3.5).toFixed(1)}" text-anchor="end" class="dt">${v}</text>`; }).join("");
    const every = Math.max(1, Math.ceil(series.length / 6));
    const ticks = series.map((p, i) => (i % every === 0 || i === series.length - 1) ? `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="dt">${p.k.slice(8)}/${p.k.slice(5, 7)}</text>` : "").join("");
    const hits = series.map((p, i) => `<g><rect x="${(x(i) - w / series.length / 2).toFixed(1)}" y="${P.t}" width="${(w / series.length).toFixed(1)}" height="${h}" class="dh"/><circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3.5" class="dp"/><title>${p.k} : ${p.v} visite(s), ${p.s} inscription(s)</title></g>`).join("");
    const sg = series.map((p, i) => p.s ? `<rect x="${(x(i) - 3).toFixed(1)}" y="${y(Math.min(p.s, top)).toFixed(1)}" width="6" height="${(P.t + h - y(Math.min(p.s, top))).toFixed(1)}" rx="2" class="ds"/>` : "").join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Visites par jour sur ${series.length} jours" class="dash-svg"><defs><linearGradient id="dgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#dgrad)"/>${sg}<path d="${line}" class="dl" fill="none"/>${ticks}${hits}</svg>`;
  }
  function delta(cur, prev) {
    if (!prev && !cur) return `<em class="dd flat">—</em>`;
    if (!prev) return `<em class="dd up">nouveau</em>`;
    const p = Math.round(((cur - prev) / prev) * 100);
    return `<em class="dd ${p > 0 ? "up" : p < 0 ? "down" : "flat"}">${p > 0 ? "+" : ""}${p} %</em>`;
  }
  function paintChart(box) {
    const data = box._series, n = dashState.days, s = data.slice(-n);
    const host = box.querySelector("#dash-chart"); if (!host) return;
    host.innerHTML = chartSvg(s);
    box.querySelector("#dash-chart-total").textContent = nf(s.reduce((a, x) => a + x.v, 0)) + " visites · " + nf(s.reduce((a, x) => a + x.s, 0)) + " inscriptions";
    box.querySelectorAll("[data-dash-days]").forEach((b) => { const on = Number(b.dataset.dashDays) === n; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  }
  async function renderDash() {
    const box = document.getElementById("adm-dash"), esc = C.esc;
    if (!box) return;
    box.innerHTML = `<div class="dash-skel"><i></i><i></i><i></i></div>`;
    try {
      const [st, views, usersS, lapsS, logS, collS] = await Promise.all([
        window.MAAdminCache.get("stats", () => C.db.collection("stats").limit(120).get()),
        window.MAAdminCache.get("car_views", () => C.db.collection("car_views").limit(400).get()),
        window.MAAdminCache.get("users", () => C.db.collection("users").limit(500).get(), 60000).catch(() => ({ size: 0 })),
        window.MAAdminCache.get("laps", () => C.db.collection("global_laps").limit(500).get(), 60000).catch(() => ({ size: 0 })),
        C.db.collection("admin_log").orderBy("createdAt", "desc").limit(8).get().catch(() => ({ docs: [] })),
        window.MAAdminCache.get("collections", () => C.db.collection("collections").limit(500).get(), 60000).catch(() => null)
      ]);
      let packsN = 0, cardsN = 0, collectorsN = 0; if (collS) collS.forEach((d) => { const x = d.data() || {}; packsN += x.opened || 0; cardsN += x.count || 0; if ((x.count || 0) > 0) collectorsN++; });
      const usersN = usersS.size, lapsN = lapsS.size;
      const logHtml = (logS.docs || []).map((d) => { const x = d.data(), t = tsMs(x.createdAt); return `<li><time>${t ? new Date(t).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</time><span><b>${esc(x.byName || "Admin")}</b> ${esc(ACTION_LABEL[x.action] || x.action)}${x.targetName ? " — " + esc(x.targetName) : ""}</span></li>`; }).join("");
      const days = new Map(); st.forEach((d) => days.set(d.id, d.data()));
      const series = [];
      for (let i = 89; i >= 0; i--) { const dd = new Date(Date.now() - i * 86400000), k = day(dd); series.push({ k, v: (days.get(k) || {}).visits || 0, s: (days.get(k) || {}).signups || 0 }); }
      const sum = (arr, f) => arr.reduce((a, x) => a + (x[f] || 0), 0);
      const v7 = sum(series.slice(-7), "v"), p7 = sum(series.slice(-14, -7), "v"), v30 = sum(series.slice(-30), "v"), p30 = sum(series.slice(-60, -30), "v"), s7 = sum(series.slice(-7), "s"), sp7 = sum(series.slice(-14, -7), "s");
      const top = [];
      views.forEach((d) => { const car = C.carsById.get(d.id); top.push({ id: d.id, n: (d.data() || {}).n || 0, name: car ? car.brand + " " + car.model : d.id }); });
      top.sort((a, b) => b.n - a.n);
      const topMax = Math.max(1, top.length ? top[0].n : 1);
      const brands = new Map(); C.carsById.forEach((c) => { const g = c.group || c.brand || "Autres"; brands.set(g, (brands.get(g) || 0) + 1); });
      const bl = [...brands.entries()].sort((a, b) => b[1] - a[1]), bMax = Math.max(1, bl.length ? bl[0][1] : 1);
      box.innerHTML = `
        <div class="adm-block-head"><h2>Vue d'ensemble</h2><span>Une visite = un navigateur, une fois par jour</span></div>
        <div class="dash-kpis">
          <div class="dash-kpi"><span>Visites · 7 jours</span><b>${nf(v7)}</b>${delta(v7, p7)}</div>
          <div class="dash-kpi"><span>Visites · 30 jours</span><b>${nf(v30)}</b>${delta(v30, p30)}</div>
          <div class="dash-kpi"><span>Inscriptions · 7 jours</span><b>${nf(s7)}</b>${delta(s7, sp7)}</div>
          <div class="dash-kpi"><span>Pilotes</span><b>${nf(usersN)}</b><em class="dd flat">inscrits</em></div>
          <div class="dash-kpi"><span>Véhicules</span><b>${nf(C.carsById.size)}</b><em class="dd flat">fiches</em></div>
          <div class="dash-kpi"><span>Chronos</span><b>${nf(lapsN)}</b><em class="dd flat">enregistrés</em></div>
          <div class="dash-kpi"><span>Packs ouverts</span><b>${nf(packsN)}</b><em class="dd flat">au total</em></div>
          <div class="dash-kpi"><span>Cartes collectées</span><b>${nf(cardsN)}</b><em class="dd flat">${nf(collectorsN)} collectionneur${collectorsN > 1 ? "s" : ""}</em></div>
        </div>
        <section class="dash-card2">
          <header><div><h3>Visites par jour</h3><small id="dash-chart-total"></small></div>
            <div class="seg" role="group" aria-label="Période"><button type="button" data-dash-days="7">7 j</button><button type="button" data-dash-days="30">30 j</button><button type="button" data-dash-days="90">90 j</button></div></header>
          <div id="dash-chart" class="dash-chart"></div>
          <div class="dash-legend"><span><i class="l1"></i>Visites</span><span><i class="l2"></i>Inscriptions</span></div>
        </section>
        <div class="dash-two">
          <section class="dash-card2"><header><div><h3>Voitures les plus consultées</h3><small>${top.length ? "Top " + Math.min(8, top.length) : "Pas encore de données"}</small></div></header>
            <ol class="dash-rank">${top.length ? top.slice(0, 8).map((t, i) => `<li><a href="#/voiture/${encodeURIComponent(t.id)}"><span class="rk">${i + 1}</span><span class="nm">${esc(t.name)}</span><span class="vl">${nf(t.n)}</span><i style="width:${Math.max(4, Math.round((t.n / topMax) * 100))}%"></i></a></li>`).join("") : `<li class="empty">Les vues apparaîtront ici dès les premières consultations.</li>`}</ol></section>
          <section class="dash-card2"><header><div><h3>Catalogue par marque</h3><small>${nf(C.carsById.size)} fiches · ${nf(bl.length)} marques</small></div></header>
            <ol class="dash-rank">${bl.slice(0, 8).map(([g, n], i) => `<li><span class="row"><span class="rk">${i + 1}</span><span class="nm">${esc(g)}</span><span class="vl">${nf(n)}</span><i style="width:${Math.max(4, Math.round((n / bMax) * 100))}%"></i></span></li>`).join("")}</ol></section>
        </div>`;
      box.insertAdjacentHTML("beforeend", `<section class="dash-card2"><header><div><h3>Activité récente</h3><small>Dernières actions d'administration</small></div><a class="cta-btn btn-ghost compact-btn" href="#/admin/journal">Tout le journal</a></header><ul class="dash-activity">${logHtml || `<li class="empty">Aucune action enregistrée.</li>`}</ul></section>
        <div class="adm-block-head"><h2>Raccourcis</h2></div><div class="admin-quick"><a class="cta-btn btn-ghost" href="#/admin/moderation">Modération</a><a class="cta-btn btn-ghost" href="#/admin/catalogue">Catalogue</a><a class="cta-btn btn-ghost" href="#/communaute/pilotes">Pilotes</a><a class="cta-btn btn-ghost" href="#/admin/erreurs">Erreurs</a></div>`);
      box._series = series; paintChart(box);
      box.onclick = (e) => { const b = e.target.closest("[data-dash-days]"); if (b) { dashState.days = Number(b.dataset.dashDays); paintChart(box); } };
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
