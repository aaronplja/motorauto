/**
 * MOTORAUTO — mini-jeux et succès.
 *   #/plusmoins  Plus ou moins : deux voitures, laquelle a la plus grande valeur ? Série sans faute = cristaux (pmPlay, côté serveur).
 *   #/quiz       Quiz par catégorie et niveau : questions tirées du catalogue + questions écrites ; le serveur rejoue la graine et corrige (quizSubmit).
 *   #/succes     tous les badges, avec la progression et un filtre.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const lang = () => (window.MAI18n ? window.MAI18n.lang() : "fr");
  const dust = (n, px) => `${window.MA.dustIcon(px || 14)} <b>${n}</b>`;
  const rootOf = (n) => document.getElementById(n + "-root");
  const loginNote = (what) => `<div class="empty-note">${T("Connecte-toi pour")} ${what}.<br><button type="button" class="cta-btn fill-btn mt" data-action="open-auth">${T("Me connecter")}</button></div>`;
  const car = (id) => (C.carsById && C.carsById.get(id)) || null;
  const carName = (c) => (c ? String(((c.brand || "") + " " + (c.model || "")).trim()) : "");
  const pilotName = (users, uid) => (users.get(uid) && users.get(uid).username) || T("Pilote");
  async function usersMap() { try { const a = await window.MAGame.loadAll(); return a.users || new Map(); } catch (_) { return new Map(); } }
  const myStats = async () => { if (!C.user) return null; try { const s = await C.db.collection("gstats").doc(C.user.uid).get(); return s.exists ? s.data() : null; } catch (_) { return null; } };
  async function board(field, n) {
    try {
      const snap = await C.db.collection("gstats").orderBy(field, "desc").limit(n || 10).get(), users = await usersMap();
      return snap.docs.map((d) => ({ uid: d.id, v: Number(d.data()[field]) || 0, name: pilotName(users, d.id) })).filter((r) => r.v > 0);
    } catch (_) { return []; }
  }
  const boardHtml = (rows, unit) => rows.length ? `<ol class="mg-board">${rows.map((r, i) => `<li class="${C.user && C.user.uid === r.uid ? "me" : ""}"><span class="mg-rk">${i + 1}</span><a href="#/pilote/${encodeURIComponent(r.uid)}">${C.esc(r.name)}</a><b>${r.v}</b><small>${unit}</small></li>`).join("")}</ol>` : `<p class="empty-note small">${T("Personne n'est encore classé. Sois le premier !")}</p>`;

  // ====================================================================== PLUS OU MOINS
  let pm = { state: "idle", pair: null, streak: 0, best: 0, res: null, reward: 0, busy: false, err: "", rows: null };
  const statVal = (c, stat) => {
    if (!c) return "";
    const st = c.stats || {};
    if (stat === "power") return (st.power || 0) + " ch";
    if (stat === "speed") return (st.speed || 0) + " km/h";
    if (stat === "zero") return (st.zero || 0) + " s";
    return String(G.yearOf(c) || "");
  };
  function pmCar(id, side, res) {
    const c = car(id), win = res && res.answer === side, img = c && C.safeUrl(c.image || "");
    return `<button type="button" class="pm-car${res ? (win ? " win" : " lose") : ""}" data-pm-pick="${side}" ${res || pm.busy ? "disabled" : ""} aria-label="${C.esc(carName(c))}">
      <span class="pm-img">${img ? `<img src="${C.esc(img)}" alt="" loading="lazy" data-fallback="car">` : ""}</span><b>${C.esc(carName(c))}</b><small>${C.esc((c && c.years) || "")}</small>
      <span class="pm-val">${res ? C.esc(statVal(c, res.pair.stat)) : "?"}</span></button>`;
  }
  async function pmRender() {
    const root = rootOf("plusmoins"); if (!root) return;
    if (pm.rows === null) { pm.rows = []; board("pmBest", 10).then((r) => { pm.rows = r; if (pm.state === "idle" || pm.state === "over") pmRender(); }); }
    const rules = `<div class="mg-rules"><b>${T("Séries qui rapportent")}</b> ${G.PM_REWARDS.map((r) => `${r[0]} → ${dust(r[1], 13)}`).join(" · ")} <small>(${T("plafond")} ${G.PM_DAILY_CAP} ${T("par jour")})</small></div>`;
    const lb = `<h3 class="sec-title">${T("Meilleures séries")}</h3>${boardHtml(pm.rows || [], T("de suite"))}`;
    if (!C.user) { root.innerHTML = loginNote(T("jouer à Plus ou moins")) + lb; return; }
    if (pm.err) { root.innerHTML = `<div class="empty-note error">${C.esc(pm.err)}</div>`; return; }
    if (pm.state === "idle") { root.innerHTML = `<section class="mg-card"><p>${T("On te montre deux voitures : devine laquelle a la plus grande valeur. Une mauvaise réponse arrête la série.")}</p>${rules}<p class="mg-best">${T("Ton record")} : <b>${pm.best}</b></p><button type="button" class="cta-btn fill-btn" data-pm-start ${pm.busy ? "disabled" : ""}>${T("Commencer")}</button></section>${lb}`; return; }
    const stat = pm.pair ? pm.pair.stat : "power", res = pm.res;
    root.innerHTML = `<section class="mg-card pm-card">
      <div class="pm-bar"><div><small>${T("Série")}</small><b>${pm.streak}</b></div><div><small>${T("Record")}</small><b>${pm.best}</b></div>${pm.reward ? `<div class="pm-gain">+${dust(pm.reward, 14)}</div>` : ""}</div>
      <p class="pm-q">${T(G.PM_STATS[stat].q)}</p>
      <div class="pm-duel">${pmCar(pm.pair.a, "a", res)}<span class="pm-vs">VS</span>${pmCar(pm.pair.b, "b", res)}</div>
      ${pm.state === "over" ? `<div class="pm-over"><b>${T("Perdu !")}</b> ${T("Ta série s'arrête à")} ${pm.final}.<br><button type="button" class="cta-btn fill-btn mt" data-pm-start>${T("Rejouer")}</button></div>` : res ? `<p class="pm-ok">${T("Bonne réponse !")}</p>` : ""}
    </section>${pm.state === "over" ? lb : ""}`;
  }
  async function pmStart() {
    if (pm.busy) return; pm.busy = true; pm.err = "";
    try { const r = await window.MAGameAPI.call("pmPlay", { action: "start" }); pm.pair = r.next; pm.streak = 0; pm.best = Number(r.best) || pm.best; pm.res = null; pm.reward = 0; pm.state = pm.pair ? "ask" : "idle"; }
    catch (e) { pm.err = e.message; }
    pm.busy = false; pmRender();
  }
  async function pmPick(side) {
    if (pm.busy || pm.state !== "ask") return; pm.busy = true; pmRender();
    try {
      const r = await window.MAGameAPI.call("pmPlay", { action: "answer", pick: side });
      pm.res = r.result; pm.best = r.best; pm.reward = r.reward || 0; if (r.doc) { window.MACards.applyDoc(r.doc); document.dispatchEvent(new CustomEvent("ma:cards")); }
      if (r.result.ok) {
        pm.streak = r.streak; pm.busy = false; pmRender();
        if (pm.reward) C.toast(`${T("Série de")} ${r.streak} : +${pm.reward} ${T("cristaux")}`, "ok");
        const next = r.next; setTimeout(() => { if (pm.state !== "ask") return; pm.pair = next; pm.res = null; pm.reward = 0; pmRender(); }, 1500);
        return;
      }
      pm.final = pm.streak; pm.state = "over"; pm.rows = null;
    } catch (e) { pm.err = e.message; }
    pm.busy = false; pmRender();
  }
  async function pmEnter() {
    pm.err = ""; pm.rows = null; if (pm.state === "ask" && !pm.pair) pm.state = "idle";
    const g = await myStats(); if (g) pm.best = Number(g.pmBest) || 0;
    pmRender();
  }

  // ====================================================================== QUIZ
  let qz = { state: "menu", cat: "", level: 1, seed: "", qs: [], i: 0, answers: [], picked: -1, result: null, best: {}, busy: false, rows: null, err: "" };
  const SV = (d) => '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>";
  const QICON = { brands: SV('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'), history: SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), engines: SV('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'), motorsport: SV('<path d="M5 21V4M5 4h13l-2 4 2 4H5"/><path d="M9 4v8M13 4v8" stroke-width="1.2"/>') };
  const QDESC = { brands: "Logos, pays, constructeurs", history: "Dates, modèles, légendes", engines: "Puissance, cylindres, technique", motorsport: "Rallye, Le Mans, circuits" };
  function quizPool() {
    return (C.cars || []).map((c) => ({ id: c.id, power: Number(c.stats && c.stats.power) || 0, speed: Number(c.stats && c.stats.speed) || 0, zero: Number(c.stats && c.stats.zero) || 0, name: ((c.brand || "") + " " + (c.model || "")).trim(), brand: c.brand || "", category: c.category || "", year: G.yearOf(c) }));
  }
  const newSeed = () => { const a = new Uint32Array(2); (window.crypto || window.msCrypto).getRandomValues(a); return a[0].toString(36) + a[1].toString(36); };
  function qzRender() {
    const root = rootOf("quizgame"); if (!root) return;
    if (qz.rows === null) { qz.rows = []; board("quizPts", 10).then((r) => { qz.rows = r; if (qz.state === "menu" || qz.state === "end") qzRender(); }); }
    const lb = `<h3 class="sec-title">${T("Classement des quiz")}</h3>${boardHtml(qz.rows || [], T("pts"))}<p class="lap-meta">${T("Points = somme de tes meilleurs scores sur les 12 combinaisons catégorie × niveau (maximum 120).")}</p>`;
    if (!C.user) { root.innerHTML = loginNote(T("jouer au quiz")) + lb; return; }
    if (qz.err) { root.innerHTML = `<div class="empty-note error">${C.esc(qz.err)}</div><button type="button" class="cta-btn btn-ghost" data-qz-menu>${T("Retour")}</button>`; return; }
    if (qz.state === "menu") {
      root.innerHTML = `<p class="lap-meta">${G.QUIZ_N} ${T("questions par partie")} · ${G.QUIZ_REWARD} ${T("cristaux par bonne réponse")} (${T("plafond")} ${G.QUIZ_DAILY_CAP} ${T("par jour")})</p>
        <div class="qz-cats">${Object.keys(G.QCATS).map((k) => `<section class="qz-cat"><header><i aria-hidden="true">${QICON[k]}</i><div><b>${T(G.QCATS[k])}</b><small>${T(QDESC[k])}</small></div></header>
          <div class="qz-levels">${[1, 2, 3].map((l) => { const b = qz.best[k + "_" + l]; return `<button type="button" class="qz-lv lv${l}" data-qz-start="${k}" data-level="${l}" ${qz.busy ? "disabled" : ""}><span>${T(G.QLEVELS[l])}</span><small>${b !== undefined ? b + " / " + G.QUIZ_N : "—"}</small></button>`; }).join("")}</div></section>`).join("")}</div>${lb}`;
      return;
    }
    if (qz.state === "play") {
      const q = qz.qs[qz.i], picked = qz.picked, done = picked >= 0;
      root.innerHTML = `<section class="mg-card qz-card"><div class="qz-head"><span>${T(G.QCATS[qz.cat])} · ${T(G.QLEVELS[qz.level])}</span><b>${qz.i + 1} / ${qz.qs.length}</b></div>
        <div class="xp-bar small" aria-hidden="true"><i style="width:${(qz.i / qz.qs.length) * 100}%"></i></div>
        <h2 class="qz-q">${C.esc(q.q)}</h2>
        <div class="qz-opts">${q.o.map((o, i) => `<button type="button" class="qz-opt${done ? (i === q.a ? " good" : i === picked ? " bad" : "") : ""}" data-qz-pick="${i}" ${done ? "disabled" : ""}>${C.esc(o)}</button>`).join("")}</div>
        ${done ? `<button type="button" class="cta-btn fill-btn mt" data-qz-next autofocus>${qz.i + 1 >= qz.qs.length ? T("Voir mon résultat") : T("Question suivante")}</button>` : ""}</section>`;
      return;
    }
    if (qz.state === "sending") { root.innerHTML = `<div class="empty-note">${T("Correction par le serveur…")}</div>`; return; }
    const r = qz.result || { score: 0, total: G.QUIZ_N, reward: 0, best: 0 };
    root.innerHTML = `<section class="mg-card qz-end"><h2>${r.score} / ${r.total}</h2><p>${r.score === r.total ? T("Sans faute, bravo !") : r.score >= r.total * 0.7 ? T("Très bien joué !") : r.score >= r.total * 0.4 ? T("Pas mal, tu peux faire mieux.") : T("Courage, la prochaine sera la bonne.")}</p>
      <p class="lap-meta">${T("Ton meilleur score ici")} : ${r.best} / ${r.total}${r.reward ? ` · +${dust(r.reward, 13)}` : ` · ${T("plafond de cristaux du jour atteint")}`}</p>
      <div class="fz-actions"><button type="button" class="cta-btn fill-btn" data-qz-start="${qz.cat}" data-level="${qz.level}">${T("Rejouer")}</button><button type="button" class="cta-btn btn-ghost" data-qz-menu>${T("Autre quiz")}</button></div></section>${lb}`;
  }
  function qzBegin(cat, level) {
    qz.cat = cat; qz.level = level; qz.seed = newSeed(); qz.i = 0; qz.answers = []; qz.picked = -1; qz.result = null; qz.err = "";
    try { qz.qs = G.quizBuild(qz.seed, cat, level, quizPool(), { t: T, lang: lang() }); } catch (e) { qz.err = T("Impossible de préparer le quiz."); }
    if (!qz.qs.length) qz.err = qz.err || T("Pas assez de questions pour cette catégorie.");
    qz.state = qz.err ? "menu" : "play"; qzRender();
  }
  async function qzFinish() {
    qz.state = "sending"; qzRender();
    try {
      const r = await window.MAGameAPI.call("quizSubmit", { seed: qz.seed, cat: qz.cat, level: qz.level, answers: qz.answers });
      qz.result = r; qz.best[qz.cat + "_" + qz.level] = r.best; qz.rows = null;
      if (r.doc) { window.MACards.applyDoc(r.doc); document.dispatchEvent(new CustomEvent("ma:cards")); }
      if (window.MAGame) window.MAGame.invalidate();
      qz.state = "end";
    } catch (e) { qz.err = e.message; qz.state = "menu"; }
    qzRender();
  }
  async function qzEnter() {
    qz.err = ""; qz.rows = null; if (qz.state !== "play") qz.state = "menu";
    const g = await myStats(); qz.best = g && g.quizBest ? g.quizBest : {};
    qzRender();
  }

  // ====================================================================== SUCCÈS
  let ac = { filter: "all" };
  async function acRender() {
    const root = rootOf("achievements"); if (!root) return;
    if (!C.user) { root.innerHTML = loginNote(T("voir tes succès")); return; }
    const s = window.MAGame.statsOf(C.user.uid), earned = new Set(s.badges), B = window.MAGame.BADGES;
    const list = B.filter((b) => ac.filter === "all" || (ac.filter === "on") === earned.has(b.id));
    const tiers = { "": T("Bronze"), silver: T("Argent"), gold: T("Or") };
    const count = (t) => `${B.filter((b) => b.tier === t && earned.has(b.id)).length} / ${B.filter((b) => b.tier === t).length}`;
    root.innerHTML = `${window.MAGame.levelHtml(s)}
      <div class="ac-sum"><span><b>${s.badges.length}</b> / ${B.length} ${T("succès")}</span>${["", "silver", "gold"].map((t) => `<span class="ac-t ${t}">${tiers[t]} <b>${count(t)}</b></span>`).join("")}</div>
      <div class="chip-row" role="group" aria-label="${T("Filtrer")}">${[["all", T("Tous")], ["on", T("Obtenus")], ["off", T("À débloquer")]].map(([k, l]) => `<button type="button" class="chip${ac.filter === k ? " active" : ""}" data-ac-f="${k}" aria-pressed="${ac.filter === k}">${l}</button>`).join("")}</div>
      <div class="badge-grid" role="list">${list.sort((a, b) => (earned.has(b.id) ? 1 : 0) - (earned.has(a.id) ? 1 : 0) ).map((b) => {
        const on = earned.has(b.id), goal = typeof b.goal === "function" ? b.goal() : b.goal, cur = Math.min(goal, b.get(s));
        return `<div class="badge-tile ${on ? "on " + b.tier : "off"}" role="listitem" title="${C.esc(b.desc)}"><i aria-hidden="true">${b.icon}</i><b>${C.esc(b.label)}</b><small>${on ? T("Obtenu") : `${window.MAGame.nf(cur)} / ${window.MAGame.nf(goal)}`}</small><em class="ac-desc">${C.esc(b.desc)}</em></div>`; }).join("")}</div>`;
  }
  async function acEnter() {
    const root = rootOf("achievements"); if (root && C.user) root.innerHTML = `<div class="tcg-skeleton" aria-busy="true"><i></i><i></i><i></i></div>`;
    if (C.user) { try { await window.MAGame.loadAll(true); } catch (_) { /* affichage partiel */ } }
    acRender();
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("plusmoins", { enter: () => pmEnter() });
    ctx.Router.register("quizgame", { enter: () => qzEnter() });
    ctx.Router.register("achievements", { enter: () => acEnter() });
    document.addEventListener("click", (e) => {
      const t = e.target; let b;
      if ((b = t.closest("[data-pm-start]"))) { pmStart(); return; }
      if ((b = t.closest("[data-pm-pick]"))) { pmPick(b.dataset.pmPick); return; }
      if ((b = t.closest("[data-qz-start]"))) { qzBegin(b.dataset.qzStart, Number(b.dataset.level) || 1); return; }
      if ((b = t.closest("[data-qz-pick]"))) { if (qz.picked >= 0) return; qz.picked = Number(b.dataset.qzPick); qz.answers[qz.i] = qz.picked; qzRender(); return; }
      if (t.closest("[data-qz-next]")) { if (qz.i + 1 >= qz.qs.length) { qzFinish(); } else { qz.i++; qz.picked = -1; qzRender(); } return; }
      if (t.closest("[data-qz-menu]")) { qz.state = "menu"; qz.err = ""; qzRender(); return; }
      if ((b = t.closest("[data-ac-f]"))) { ac.filter = b.dataset.acF; acRender(); }
    });
    document.addEventListener("ma:auth", () => { pm.state = "idle"; pm.rows = null; qz.state = "menu"; qz.rows = null; const n = ctx.Router.current() && ctx.Router.current().name; if (n === "plusmoins") pmEnter(); else if (n === "quizgame") qzEnter(); else if (n === "achievements") acEnter(); });
  });
})();
