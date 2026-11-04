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
      <span class="pm-img">${img ? `<img src="${C.esc(img)}" alt="" loading="lazy" data-fallback="car">` : ""}</span><b>${C.esc(carName(c))}</b><small>${pm.pair && pm.pair.stat === "year" && !res ? "" : C.esc((c && c.years) || "")}</small>
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
  let qz = { mode: "quiz", state: "menu", cat: "", level: 1, seed: "", qs: [], i: 0, answers: [], picked: -1, result: null, best: {}, busy: false, rows: null, err: "" };
  const SV = (d) => '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>";
  const QICON = { brands: SV('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'), history: SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), engines: SV('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'), motorsport: SV('<path d="M5 21V4M5 4h13l-2 4 2 4H5"/><path d="M9 4v8M13 4v8" stroke-width="1.2"/>'), countries: SV('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'), circuits: SV('<path d="M4 15c0-5 4-3 6-6s4-4 7-1 1 8-3 9-10 2-10-2z"/>'), numbers: SV('<path d="M5 9h14M5 15h14M9 4l-2 16M17 4l-2 16"/>'), trivia: SV('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'), japan: SV('<circle cx="12" cy="12" r="6"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke-width="1.2"/>'), rally: SV('<path d="M3 17c3 0 3-6 7-6s3 6 7 6 3-9 4-9"/><circle cx="6" cy="19" r="1.3"/><circle cx="18" cy="19" r="1.3"/>'), ev: SV('<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>') };
  const QDESC = { brands: "Logos, pays, constructeurs", history: "Dates, modèles, légendes", engines: "Puissance, cylindres, technique", motorsport: "Rallye, Le Mans, circuits", countries: "D'où vient chaque constructeur", circuits: "Le Mans, Spa, Nürburgring, Monza", numbers: "Puissance, 0 à 100, vitesse, années", trivia: "Codes moteurs, anecdotes, records", japan: "Toyota, Nissan, Honda, drift, kei cars", rally: "WRC, Dakar, Groupe B, légendes", ev: "Batteries, recharge, hybrides, Formule E" };
  function quizPool() {
    return (C.cars || []).map((c) => ({ id: c.id, power: Number(c.stats && c.stats.power) || 0, speed: Number(c.stats && c.stats.speed) || 0, zero: Number(c.stats && c.stats.zero) || 0, name: ((c.brand || "") + " " + (c.model || "")).trim(), brand: c.brand || "", category: c.category || "", year: G.yearOf(c) }));
  }
  const newSeed = () => { const a = new Uint32Array(2); (window.crypto || window.msCrypto).getRandomValues(a); return a[0].toString(36) + a[1].toString(36); };
  function qzRender() {
    const root = rootOf("quizgame"); if (!root) return;
    if (qz.rows === null) { qz.rows = []; board("quizPts", 10).then((r) => { qz.rows = r; if (qz.state === "menu" || qz.state === "end") qzRender(); }); }
    const lb = `<h3 class="sec-title">${T("Classement des quiz")}</h3>${boardHtml(qz.rows || [], T("pts"))}<p class="lap-meta">${T("Points = somme de tes meilleurs scores sur toutes les combinaisons catégorie × niveau.")}</p>`;
    if (!C.user) { root.innerHTML = loginNote(T("jouer au quiz")) + lb; return; }
    if (qz.err) { root.innerHTML = `<div class="empty-note error">${C.esc(qz.err)}</div><button type="button" class="cta-btn btn-ghost" data-qz-menu>${T("Retour")}</button>`; return; }
    if (qz.state === "menu") {
      const tabs = `<div class="qz-tabs" role="tablist">${[["quiz", "Quiz"], ["train", "Entraînement"], ["chrono", "Chrono"]].map(([k, l]) => `<button type="button" role="tab" aria-selected="${qz.mode === k}" class="${qz.mode === k ? "on" : ""}" data-qz-mode="${k}">${T(l)}</button>`).join("")}</div>`;
      const LV = [1, 2, 3, 4];
      if (qz.mode === "chrono") {
        const lv = qz.cLevel || 2, wk = qz.cRows && qz.cRows[lv];
        if (!qz.cRows) { qz.cRows = {}; }
        if (!wk) board(G.chronoField(Date.now(), lv), 10).then((r) => { qz.cRows[lv] = r; if (qz.state === "menu" && qz.mode === "chrono") qzRender(); });
        root.innerHTML = `${tabs}<p class="lap-meta">${G.CHRONO.secs} ${T("secondes, toutes catégories mélangées")} · +1 ${T("par bonne réponse")} · −${G.CHRONO.penalty} s ${T("par erreur")} · ${G.CHRONO.reward} ${T("cristaux par bonne réponse")} (${T("plafond")} ${G.CHRONO.cap} ${T("par jour")})</p>
          <div class="qz-levels chrono">${LV.map((l) => `<button type="button" class="qz-lv lv${l}" data-qz-chrono="${l}" ${qz.busy ? "disabled" : ""}><span>${T(G.QLEVELS[l])}</span><small>${(qz.cBest && qz.cBest[l]) ? T("record") + " " + qz.cBest[l] : "—"}</small></button>`).join("")}</div>
          <h3 class="sec-title">${T("Classement de la semaine")}</h3>
          <div class="qz-tabs small" role="tablist">${LV.map((l) => `<button type="button" role="tab" aria-selected="${lv === l}" class="${lv === l ? "on" : ""}" data-qz-cb="${l}">${T(G.QLEVELS[l])}</button>`).join("")}</div>
          ${boardHtml(wk || [], T("bonnes réponses"))}<p class="lap-meta">${T("Le classement repart à zéro chaque semaine (lundi).")}</p>`;
        return;
      }
      const train = qz.mode === "train", attr = train ? "data-qz-train" : "data-qz-start";
      root.innerHTML = `${tabs}<p class="lap-meta">${train ? T("Entraînement : questions illimitées, sans récompense, avec la correction et les chiffres de la fiche après chaque réponse.") : `${G.QUIZ_N} ${T("questions par partie")} · ${G.QUIZ_REWARD} ${T("cristaux par bonne réponse")} (${T("plafond")} ${G.QUIZ_DAILY_CAP} ${T("par jour")})`}</p>
        <div class="qz-cats">${Object.keys(G.QCATS).map((k) => `<section class="qz-cat"><header><i aria-hidden="true">${QICON[k]}</i><div><b>${T(G.QCATS[k])}</b><small>${T(QDESC[k])}</small></div></header>
          <div class="qz-levels">${LV.map((l) => { const b = qz.best[k + "_" + l]; return `<button type="button" class="qz-lv lv${l}" ${attr}="${k}" data-level="${l}" ${qz.busy ? "disabled" : ""}><span>${T(G.QLEVELS[l])}</span><small>${train ? "∞" : b !== undefined ? b + " / " + G.QUIZ_N : "—"}</small></button>`; }).join("")}</div></section>`).join("")}</div>${train ? "" : lb}`;
      return;
    }
    if (qz.state === "chrono") { chronoRender(root); return; }
    if (qz.state === "play") {
      const q = qz.qs[qz.i], picked = qz.picked, done = picked >= 0, multi = !!q.m, sel = qz.sel || [];
      const cls = (i) => multi ? (done ? (q.m.includes(i) ? (sel.includes(i) ? " good" : " miss") : sel.includes(i) ? " bad" : "") : (sel.includes(i) ? " sel" : "")) : (done ? (i === q.a ? " good" : i === picked ? " bad" : "") : "");
      root.innerHTML = `<section class="mg-card qz-card"><div class="qz-head"><span>${T(G.QCATS[qz.cat])} · ${T(G.QLEVELS[qz.level])}${qz.train ? " · " + T("entraînement") : ""}</span><b>${qz.i + 1} / ${qz.qs.length}</b></div>
        <div class="xp-bar small" aria-hidden="true"><i style="width:${(qz.i / qz.qs.length) * 100}%"></i></div>
        <h2 class="qz-q">${C.esc(q.q)}</h2>${multi ? `<p class="qz-multi">${T("Plusieurs réponses possibles : coche-les toutes, puis valide.")}</p>` : ""}
        <div class="qz-opts">${q.o.map((o, i) => `<button type="button" class="qz-opt${cls(i)}" data-qz-pick="${i}" ${multi ? `role="checkbox" aria-checked="${sel.includes(i)}"` : ""} ${done ? "disabled" : ""}>${multi ? `<i class="qz-box" aria-hidden="true">${sel.includes(i) || (done && q.m.includes(i)) ? "✓" : ""}</i>` : ""}${C.esc(o)}</button>`).join("")}</div>
        ${multi && !done ? `<button type="button" class="cta-btn fill-btn mt" data-qz-ok ${sel.length ? "" : "disabled"}>${T("Valider")}</button>` : ""}
        ${done && qz.train ? explainHtml(q) : ""}
        ${done ? `<button type="button" class="cta-btn fill-btn mt" data-qz-next autofocus>${qz.i + 1 >= qz.qs.length ? T("Voir mon résultat") : T("Question suivante")}</button>` : ""}</section>`;
      return;
    }
    if (qz.state === "sending") { root.innerHTML = `<div class="empty-note">${T("Correction par le serveur…")}</div>`; return; }
    const r = qz.result || { score: 0, total: G.QUIZ_N, reward: 0, best: 0 };
    root.innerHTML = `<section class="mg-card qz-end"><h2>${r.score} / ${r.total}</h2><p>${r.score === r.total ? T("Sans faute, bravo !") : r.score >= r.total * 0.7 ? T("Très bien joué !") : r.score >= r.total * 0.4 ? T("Pas mal, tu peux faire mieux.") : T("Courage, la prochaine sera la bonne.")}</p>
      <p class="lap-meta">${qz.train ? T("Entraînement : aucune récompense.") : `${T("Ton meilleur score ici")} : ${r.best} / ${r.total}${r.reward ? ` · +${dust(r.reward, 13)}` : ` · ${T("plafond de cristaux du jour atteint")}`}`}</p>
      <div class="fz-actions"><button type="button" class="cta-btn fill-btn" ${qz.train ? "data-qz-train" : "data-qz-start"}="${qz.cat}" data-level="${qz.level}">${T("Rejouer")}</button><button type="button" class="cta-btn btn-ghost" data-qz-menu>${T("Autre quiz")}</button></div></section>${lb}`;
  }
  /** correction détaillée (entraînement) : bonne réponse + chiffres de la fiche, avec lien vers chaque voiture */
  function explainHtml(q) {
    const good = q.m ? q.m.map((i) => q.o[i]).join(" · ") : q.o[q.a];
    const link = (id, label) => id ? `<a href="#/voiture/${encodeURIComponent(id)}">${C.esc(label)}</a>` : C.esc(label);
    let body = "";
    if (q.ex) body = `<ul class="qz-ex">${q.o.map((o, i) => `<li class="${i === q.a ? "good" : ""}">${link(q.ids && q.ids[i], o)}<small>${C.esc(q.ex[i] || "")}</small></li>`).join("")}</ul>`;
    else if (q.note) body = `<p class="qz-note">${q.ids && q.ids[0] ? link(q.ids[0], q.note) : C.esc(q.note)}</p>`;
    return `<div class="qz-explain" role="status"><b>${T("Bonne réponse")} : ${C.esc(good)}</b>${body}</div>`;
  }
  function qzTrain(cat, level) {
    qz.train = true; qz.cat = cat; qz.level = level; qz.seed = newSeed(); qz.i = 0; qz.answers = []; qz.picked = -1; qz.sel = []; qz.result = null; qz.err = "";
    try { qz.qs = G.quizBuild(qz.seed, cat, level, quizPool(), { t: T, lang: lang() }); } catch (e) { qz.err = T("Impossible de préparer le quiz."); }
    if (!qz.qs.length) qz.err = qz.err || T("Pas assez de questions pour cette catégorie.");
    qz.state = qz.err ? "menu" : "play"; qzRender();
  }
  // ---- chrono : 60 s, +1 / bonne réponse, −5 s / erreur
  let ch = { qs: [], i: 0, ok: 0, wrong: 0, answers: [], end: 0, timer: 0, left: 0, flash: "", seed: "", level: 2, result: null, lock: false };
  function chronoRender(root) {
    root = root || rootOf("quizgame"); if (!root) return;
    if (ch.result) {
      const r = ch.result;
      root.innerHTML = `<section class="mg-card qz-end"><h2>${r.score}</h2><p>${T("bonnes réponses en")} ${G.CHRONO.secs} s</p><p class="lap-meta">${T("Record")} : ${r.best} · ${T("Meilleur de la semaine")} : ${r.weekBest}${r.reward ? ` · +${dust(r.reward, 13)}` : ` · ${T("plafond de cristaux du jour atteint")}`}</p>
        <div class="fz-actions"><button type="button" class="cta-btn fill-btn" data-qz-chrono="${ch.level}">${T("Rejouer")}</button><button type="button" class="cta-btn btn-ghost" data-qz-menu>${T("Autre quiz")}</button></div></section>`;
      return;
    }
    const q = ch.qs[ch.i];
    if (!q) { chronoStop(); return; }
    root.innerHTML = `<section class="mg-card qz-card qz-chrono"><div class="qz-head"><span>${T(G.QLEVELS[ch.level])} · ${T("Chrono")}</span><b>✓ ${ch.ok}</b></div>
      <div class="qz-clock"><b id="qz-left">${Math.ceil(ch.left)}</b><span>s</span>${ch.flash ? `<em class="qz-fl ${ch.flash[0] === "-" ? "bad" : "good"}">${C.esc(ch.flash)}</em>` : ""}</div>
      <h2 class="qz-q">${C.esc(q.q)}</h2><div class="qz-opts">${q.o.map((o, i) => `<button type="button" class="qz-opt" data-qz-cpick="${i}">${C.esc(o)}</button>`).join("")}</div></section>`;
  }
  function chronoTick() {
    ch.left = Math.max(0, (ch.end - Date.now()) / 1000);
    const el = document.getElementById("qz-left"); if (el) el.textContent = Math.ceil(ch.left);
    if (ch.left <= 0) chronoStop();
  }
  async function chronoStart(level) {
    if (qz.busy) return; qz.busy = true; qz.err = ""; qzRender();
    try {
      const r = await window.MAGameAPI.call("chronoStart", { level });
      ch = { qs: G.chronoQuestions(r.seed, r.level, quizPool(), { t: T, lang: lang() }), i: 0, ok: 0, wrong: 0, answers: [], end: Date.now() + G.CHRONO.secs * 1000, timer: 0, left: G.CHRONO.secs, flash: "", seed: r.seed, level: r.level, result: null, lock: false };
      if (!ch.qs.length) throw new Error(T("Pas assez de questions pour cette catégorie."));
      qz.state = "chrono"; qz.busy = false; chronoRender();
      ch.timer = setInterval(chronoTick, 200);
    } catch (e) { qz.err = e.message; qz.state = "menu"; qz.busy = false; qzRender(); }
  }
  function chronoPick(n) {
    if (ch.lock || !ch.qs[ch.i]) return;
    const q = ch.qs[ch.i]; ch.answers.push(n);
    if (n === q.a) { ch.ok++; ch.flash = "+1"; }
    else { ch.wrong++; ch.end -= G.CHRONO.penalty * 1000; ch.flash = "−" + G.CHRONO.penalty + " s"; }
    ch.i++; chronoTick();
    if (ch.left > 0) { chronoRender(); setTimeout(() => { ch.flash = ""; }, 600); }
  }
  async function chronoStop() {
    if (ch.timer) { clearInterval(ch.timer); ch.timer = 0; }
    if (ch.lock) return; ch.lock = true;
    qz.state = "sending"; qzRender();
    try {
      const r = await window.MAGameAPI.call("chronoSubmit", { answers: ch.answers });
      ch.result = r; qz.cBest = Object.assign(qz.cBest || {}, { [ch.level]: r.best }); qz.cRows = null;
      if (r.doc) { window.MACards.applyDoc(r.doc); document.dispatchEvent(new CustomEvent("ma:cards")); }
      qz.state = "chrono";
    } catch (e) { qz.err = e.message; qz.state = "menu"; }
    qzRender();
  }
  function qzBegin(cat, level) {
    qz.train = false;
    qz.cat = cat; qz.level = level; qz.seed = newSeed(); qz.i = 0; qz.answers = []; qz.picked = -1; qz.sel = []; qz.result = null; qz.err = "";
    try { qz.qs = G.quizBuild(qz.seed, cat, level, quizPool(), { t: T, lang: lang() }); } catch (e) { qz.err = T("Impossible de préparer le quiz."); }
    if (!qz.qs.length) qz.err = qz.err || T("Pas assez de questions pour cette catégorie.");
    qz.state = qz.err ? "menu" : "play"; qzRender();
  }
  async function qzFinish() {
    if (qz.train) { qz.result = { score: G.quizScore(qz.qs, qz.answers), total: qz.qs.length, reward: 0, best: 0 }; qz.state = "end"; qzRender(); return; }
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
    qz.err = ""; qz.rows = null; qz.cRows = null; if (ch.timer) { clearInterval(ch.timer); ch.timer = 0; } if (qz.state !== "play") qz.state = "menu";
    const g = await myStats(); qz.best = g && g.quizBest ? g.quizBest : {}; qz.cBest = g && g.chronoBest ? g.chronoBest : {};
    qzRender();
  }

  // ====================================================================== SUCCÈS
  let ac = { filter: "all", tier: "all" };
  const tierName = (t) => ({ "": T("Bronze"), silver: T("Argent"), gold: T("Or") }[t || ""]);
  function acInfo(b, s, earned) {
    const goal = typeof b.goal === "function" ? b.goal() : b.goal, cur = Math.min(goal, b.get(s) || 0);
    return { on: earned.has(b.id), goal, cur, pct: goal ? Math.round((cur / goal) * 100) : 0 };
  }
  async function acRender() {
    const root = rootOf("achievements"); if (!root) return;
    if (!C.user) { root.innerHTML = loginNote(T("voir tes succès")); return; }
    const s = window.MAGame.statsOf(C.user.uid), earned = new Set(s.badges), B = window.MAGame.BADGES;
    const list = B.filter((b) => (ac.filter === "all" || (ac.filter === "on") === earned.has(b.id)) && (ac.tier === "all" || (b.tier || "bronze") === ac.tier));
    const count = (t) => `${B.filter((b) => b.tier === t && earned.has(b.id)).length} / ${B.filter((b) => b.tier === t).length}`;
    const chip = (grp, k, l, cur) => `<button type="button" class="chip${cur === k ? " active" : ""}" data-ac-${grp}="${k}" aria-pressed="${cur === k}">${l}</button>`;
    // obtenus d'abord, puis les plus proches d'être débloqués
    const sorted = list.map((b) => ({ b, i: acInfo(b, s, earned) })).sort((x, y) => (y.i.on - x.i.on) || (y.i.pct - x.i.pct));
    root.innerHTML = `${window.MAGame.levelHtml(s)}
      <div class="ac-sum"><span><b>${s.badges.length}</b> / ${B.length} ${T("succès")}</span>${["", "silver", "gold"].map((t) => `<span class="ac-t ${t}">${tierName(t)} <b>${count(t)}</b></span>`).join("")}</div>
      <div class="chip-row" role="group" aria-label="${T("Filtrer")}">${[["all", T("Tous")], ["on", T("Obtenus")], ["off", T("À débloquer")]].map(([k, l]) => chip("f", k, l, ac.filter)).join("")}</div>
      <div class="chip-row" role="group" aria-label="${T("Palier")}">${[["all", T("Tous les paliers")], ["bronze", T("Bronze")], ["silver", T("Argent")], ["gold", T("Or")]].map(([k, l]) => chip("t", k, l, ac.tier)).join("")}</div>
      <p class="ac-hint">${T("Touche un succès pour voir son détail.")}</p>
      <div class="badge-grid" role="list">${sorted.map(({ b, i }) => `<button type="button" class="badge-tile ac-tile ${i.on ? "on " + b.tier : "off"}" role="listitem" data-ac-open="${C.esc(b.id)}" aria-label="${C.esc(b.label)}"><i aria-hidden="true">${b.icon}</i><b>${C.esc(b.label)}</b><span class="ac-bar" aria-hidden="true"><u style="width:${i.pct}%"></u></span><small>${i.on ? T("Obtenu") : `${window.MAGame.nf(i.cur)} / ${window.MAGame.nf(i.goal)}`}</small></button>`).join("") || `<p class="ac-hint">${T("Aucun succès dans cette sélection.")}</p>`}</div>`;
  }
  function acSheet(id) {
    const s = window.MAGame.statsOf(C.user.uid), earned = new Set(s.badges), b = window.MAGame.BADGES.find((x) => x.id === id); if (!b) return;
    const i = acInfo(b, s, earned), nf = window.MAGame.nf;
    document.querySelectorAll(".ac-sheet").forEach((n) => n.remove());
    const ov = document.createElement("div"); ov.className = "ac-sheet"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", b.label);
    ov.innerHTML = `<div class="ac-card ${i.on ? "on " + (b.tier || "") : "off"}"><button type="button" class="ac-x" data-ac-x aria-label="${T("Fermer")}">×</button>
      <i class="ac-big" aria-hidden="true">${b.icon}</i><h3>${C.esc(b.label)}</h3>
      <p class="ac-state ${i.on ? "ok" : ""}">${i.on ? T("Succès obtenu") : T("À débloquer")} · ${tierName(b.tier)}</p>
      <p class="ac-d">${C.esc(b.desc)}</p>
      <div class="ac-prog"><span class="ac-bar big"><u style="width:${i.pct}%"></u></span><small>${nf(i.cur)} / ${nf(i.goal)} · ${i.pct} %</small></div>
      ${i.on ? "" : `<p class="ac-left">${T("Encore")} <b>${nf(Math.max(0, i.goal - i.cur))}</b> ${T("pour le débloquer.")}</p>`}</div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); document.removeEventListener("keydown", key); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    ov.addEventListener("click", (e) => { if (e.target === ov || e.target.closest("[data-ac-x]")) close(); });
    const x = ov.querySelector("[data-ac-x]"); if (x) x.focus();
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
      if ((b = t.closest("[data-qz-train]"))) { qzTrain(b.dataset.qzTrain, Number(b.dataset.level) || 1); return; }
      if ((b = t.closest("[data-qz-mode]"))) { qz.mode = b.dataset.qzMode; qzRender(); return; }
      if ((b = t.closest("[data-qz-chrono]"))) { chronoStart(Number(b.dataset.qzChrono) || 2); return; }
      if ((b = t.closest("[data-qz-cb]"))) { qz.cLevel = Number(b.dataset.qzCb) || 2; qzRender(); return; }
      if ((b = t.closest("[data-qz-cpick]"))) { chronoPick(Number(b.dataset.qzCpick)); return; }
      if ((b = t.closest("[data-qz-pick]"))) {
        if (qz.picked >= 0) return; const n = Number(b.dataset.qzPick), q = qz.qs[qz.i];
        if (q && q.m) { qz.sel = qz.sel || []; const at = qz.sel.indexOf(n); if (at >= 0) qz.sel.splice(at, 1); else qz.sel.push(n); qzRender(); return; }
        qz.picked = n; qz.answers[qz.i] = n; qzRender(); return;
      }
      if (t.closest("[data-qz-ok]")) { if (qz.picked >= 0 || !(qz.sel && qz.sel.length)) return; qz.answers[qz.i] = qz.sel.slice().sort((x, y) => x - y); qz.picked = 0; qzRender(); return; }
      if (t.closest("[data-qz-next]")) { if (qz.i + 1 >= qz.qs.length) { qzFinish(); } else { qz.i++; qz.picked = -1; qz.sel = []; qzRender(); } return; }
      if (t.closest("[data-qz-menu]")) { qz.state = "menu"; qz.err = ""; qzRender(); return; }
      if ((b = t.closest("[data-ac-f]"))) { ac.filter = b.dataset.acF; acRender(); }
      else if ((b = t.closest("[data-ac-t]"))) { ac.tier = b.dataset.acT; acRender(); }
      else if ((b = t.closest("[data-ac-open]"))) { if (C.user) acSheet(b.dataset.acOpen); }
    });
    document.addEventListener("ma:auth", () => { pm.state = "idle"; pm.rows = null; qz.state = "menu"; qz.rows = null; const n = ctx.Router.current() && ctx.Router.current().name; if (n === "plusmoins") pmEnter(); else if (n === "quizgame") qzEnter(); else if (n === "achievements") acEnter(); });
  });
})();
