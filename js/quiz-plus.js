/**
 * MOTORAUTO — Quiz : mode « Survie » (3 vies, temps par question décroissant, corrigé par le serveur),
 * « Mes erreurs » (révision des questions ratées), questions proposées par les pilotes (validées par l'administration,
 * traduites en français, anglais, espagnol, allemand et italien) et jeu sur les questions de la communauté.
 * Les boutons s'ajoutent sous les onglets du quiz ; l'administration trouve « Questions proposées » à côté de « Voitures sans image ».
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  if (!G || !G.survivalPlay) return;
  let C = null, ov = null, timer = 0;
  const T = (s) => (window.MAI18n && window.MAI18n.t ? window.MAI18n.t(s) : s);
  const lang = () => (window.MAI18n && window.MAI18n.lang ? window.MAI18n.lang() : "fr");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LANGS = { en: "English", es: "Español", de: "Deutsch", it: "Italiano" };
  const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* ignoré */ } } };
  const key = (n) => "ma_" + n + "_" + (C && C.user ? C.user.uid : "anon");
  const wrongs = () => store.get(key("wrongs"), []);
  const saveWrongs = (l) => store.set(key("wrongs"), l.slice(-120));
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const quizPool = () => (C.cars || []).map((c) => ({ id: c.id, power: Number(c.stats && c.stats.power) || 0, speed: Number(c.stats && c.stats.speed) || 0, zero: Number(c.stats && c.stats.zero) || 0, name: ((c.brand || "") + " " + (c.model || "")).trim(), brand: c.brand || "", category: c.category || "", year: G.yearOf(c) }));

  function addWrong(q) {   // q : { q, o, a:[indices] }
    const l = wrongs(); if (l.some((x) => x.q === q.q)) return;
    l.push({ q: q.q, o: q.o.slice(), a: q.a.slice(), t: Date.now() }); saveWrongs(l);
  }
  function css() {
    if (document.getElementById("qzp-css")) return;
    const s = document.createElement("style"); s.id = "qzp-css";
    s.textContent = `#qzp{position:fixed;inset:0;z-index:9300;background:var(--bg-core);color:var(--color-ink);display:flex;flex-direction:column}
      #qzp header{display:flex;gap:10px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--stroke-line);background:var(--bg-surface)}#qzp header h2{margin:0;font-size:1.05rem;flex:1}
      #qzp .qp-body{flex:1;overflow:auto;padding:16px;max-width:42rem;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:12px}
      #qzp .qp-lv{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}#qzp .qp-lv button,#qzp .qp-opt{font:inherit;color:var(--color-ink);background:var(--bg-surface);border:1px solid var(--stroke-line);border-radius:12px;padding:12px;cursor:pointer;text-align:left}
      #qzp .qp-opt{display:block;width:100%;margin-top:8px}#qzp .qp-opt.good{border-color:#22c55e;background:color-mix(in srgb,#22c55e 18%,var(--bg-surface))}#qzp .qp-opt.bad{border-color:#ef4444;background:color-mix(in srgb,#ef4444 18%,var(--bg-surface))}
      #qzp .qp-hud{display:flex;justify-content:space-between;align-items:center;font-weight:700}#qzp .qp-bar{height:8px;background:var(--bg-elevated);border-radius:99px;overflow:hidden}#qzp .qp-bar i{display:block;height:100%;background:var(--accent);width:100%}
      #qzp .qp-q{font-size:1.15rem;font-weight:700;margin:6px 0 0}#qzp .mut,#qzp small{color:var(--color-secondary)}
      #qzp input,#qzp select,#qzp textarea{font:inherit;padding:10px 12px;border-radius:10px;border:1px solid var(--stroke-line);background:var(--bg-elevated);color:var(--color-ink);width:100%;box-sizing:border-box}
      #qzp label{display:flex;flex-direction:column;gap:4px;font-size:.85rem;color:var(--color-secondary)}#qzp .qp-card{background:var(--bg-surface);border:1px solid var(--stroke-line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px}
      #qzp .qp-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}#qzp .qp-tag{font-size:.75rem;border-radius:99px;padding:2px 9px;background:var(--bg-elevated)}`;
    document.head.appendChild(s);
  }
  function mount(title, body) {
    css(); close();
    ov = document.createElement("div"); ov.id = "qzp"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", title);
    ov.innerHTML = `<header><h2>${esc(title)}</h2><button type="button" class="cta-btn btn-ghost compact-btn" data-qp-x>${T("Fermer")}</button></header><div class="qp-body">${body || ""}</div>`;
    document.body.appendChild(ov); document.body.classList.add("tcg-open");
    ov.addEventListener("click", (e) => { if (e.target.closest("[data-qp-x]")) close(); });
    document.addEventListener("keydown", esc2);
    return ov.querySelector(".qp-body");
  }
  const esc2 = (e) => { if (e.key === "Escape") close(); };
  function close() { clearInterval(timer); timer = 0; if (ov) { ov.remove(); ov = null; document.body.classList.remove("tcg-open"); } document.removeEventListener("keydown", esc2); }
  const needLogin = () => !(C && C.requireLogin && C.requireLogin());

  // ================================================================== SURVIE
  function survivalMenu() {
    if (needLogin()) return;
    const best = store.get(key("survbest"), {});
    const b = mount("❤️ " + T("Quiz survie"), `<p class="mut">${T("3 vies. Une erreur ou un temps écoulé coûte une vie. Le temps par question raccourcit avec ta série.")} ${G.SURVIVAL.reward} ${T("cristal par bonne réponse")} (${T("plafond")} ${G.SURVIVAL.cap} ${T("par jour")}).</p>
      <div class="qp-lv">${[1, 2, 3, 4].map((l) => `<button type="button" data-lv="${l}"><b>${T(G.QLEVELS[l])}</b><br><small>${best[l] ? T("record") + " " + best[l] : "—"}</small></button>`).join("")}</div>`);
    b.addEventListener("click", (e) => { const l = e.target.closest("[data-lv]"); if (l) survivalRun(Number(l.dataset.lv)); });
  }
  async function survivalRun(level) {
    let r; const b = ov.querySelector(".qp-body"); b.innerHTML = `<p class="mut">${T("Préparation…")}</p>`;
    try { r = await window.MAGameAPI.call("survivalStart", { level }); } catch (e) { C.toast(e.message || "Erreur", "err"); return survivalMenu(); }
    const qs = G.survivalQuestions(r.seed, r.level, quizPool(), { t: T, lang: lang() });
    const st = { i: 0, ok: 0, lives: G.SURVIVAL.lives, answers: [], lock: false };
    const draw = () => {
      const q = qs[st.i]; if (!q) return finish();
      const secs = G.survivalSecs(st.ok), end = Date.now() + secs * 1000;
      b.innerHTML = `<div class="qp-hud"><span>${"❤️".repeat(st.lives)}${"🖤".repeat(G.SURVIVAL.lives - st.lives)}</span><span>✓ ${st.ok}</span></div><div class="qp-bar" aria-hidden="true"><i></i></div>
        <h3 class="qp-q">${esc(q.q)}</h3><div>${q.o.map((o, i) => `<button type="button" class="qp-opt" data-i="${i}">${esc(o)}</button>`).join("")}</div>`;
      st.lock = false; clearInterval(timer);
      const bar = b.querySelector(".qp-bar i");
      timer = setInterval(() => { const left = end - Date.now(); if (bar) bar.style.width = Math.max(0, left / (secs * 10)) + "%"; if (left <= 0) answer(-1); }, 100);
      const answer = (i) => {
        if (st.lock) return; st.lock = true; clearInterval(timer); st.answers.push(i);
        const good = i === q.a; if (good) st.ok++; else { st.lives--; addWrong({ q: q.q, o: q.o, a: [q.a] }); }
        b.querySelectorAll(".qp-opt").forEach((el, k) => { el.disabled = true; if (k === q.a) el.classList.add("good"); else if (k === i) el.classList.add("bad"); });
        setTimeout(() => { st.i++; if (st.lives <= 0) finish(); else draw(); }, good ? 450 : 1100);
      };
      b.onclick = (e) => { const o = e.target.closest("[data-i]"); if (o) answer(Number(o.dataset.i)); };
    };
    async function finish() {
      clearInterval(timer); b.onclick = null; b.innerHTML = `<p class="mut">${T("Correction par le serveur…")}</p>`;
      try {
        const res = await window.MAGameAPI.call("survivalSubmit", { answers: st.answers });
        if (res.doc && window.MACards) window.MACards.applyDoc(res.doc);
        const bs = store.get(key("survbest"), {}); bs[level] = Math.max(bs[level] || 0, res.best || res.score); store.set(key("survbest"), bs);
        b.innerHTML = `<div class="qp-card" style="text-align:center"><h2 style="margin:0">${res.score} ${T("bonnes réponses")}</h2><p class="mut">${res.record ? "🏆 " + T("Nouveau record !") : T("Ton record") + " : " + res.best}${res.reward ? ` · +${res.reward} ${T("cristaux")}` : ` · ${T("plafond de cristaux du jour atteint")}`}</p>
          <div class="qp-row" style="justify-content:center"><button type="button" class="cta-btn fill-btn" data-again>${T("Rejouer")}</button><button type="button" class="cta-btn btn-ghost" data-menu>${T("Autre niveau")}</button>${wrongs().length ? `<button type="button" class="cta-btn btn-ghost" data-review>${T("Revoir mes erreurs")}</button>` : ""}</div></div>`;
        b.onclick = (e) => { if (e.target.closest("[data-again]")) survivalRun(level); else if (e.target.closest("[data-menu]")) survivalMenu(); else if (e.target.closest("[data-review]")) review(); };
      } catch (e) { b.innerHTML = `<div class="empty-note error">${esc(e.message || "Erreur")}</div><button type="button" class="cta-btn btn-ghost" data-menu>${T("Retour")}</button>`; b.onclick = (ev) => { if (ev.target.closest("[data-menu]")) survivalMenu(); }; }
    }
    draw();
  }

  // ================================================================== MES ERREURS + QUESTIONS DE LA COMMUNAUTÉ
  /** joue une liste de questions { q, o, a:[indices] } sans récompense ; onRight(q) / onWrong(q) appelés à chaque réponse */
  function playList(title, list, hooks) {
    const b = mount(title, ""); let i = 0, good = 0;
    const draw = () => {
      if (i >= list.length) { b.innerHTML = `<div class="qp-card" style="text-align:center"><h2 style="margin:0">${good} / ${list.length}</h2><p class="mut">${hooks.endText ? hooks.endText() : ""}</p><button type="button" class="cta-btn fill-btn" data-x2>${T("Terminer")}</button></div>`; b.onclick = (e) => { if (e.target.closest("[data-x2]")) close(); }; return; }
      const q = list[i], order = shuffle(q.o.map((o, k) => k));
      b.innerHTML = `<div class="qp-hud"><span>${i + 1} / ${list.length}</span><span>✓ ${good}</span></div><h3 class="qp-q">${esc(q.q)}</h3><div>${order.map((k) => `<button type="button" class="qp-opt" data-k="${k}">${esc(q.o[k])}</button>`).join("")}</div>`;
      b.onclick = (e) => {
        const o = e.target.closest("[data-k]"); if (!o || b.dataset.lock === String(i)) return; b.dataset.lock = String(i);
        const k = Number(o.dataset.k), ok = q.a.indexOf(k) >= 0; if (ok) { good++; hooks.right && hooks.right(q); } else hooks.wrong && hooks.wrong(q);
        b.querySelectorAll(".qp-opt").forEach((el) => { el.disabled = true; const kk = Number(el.dataset.k); if (q.a.indexOf(kk) >= 0) el.classList.add("good"); else if (kk === k) el.classList.add("bad"); });
        b.insertAdjacentHTML("beforeend", `<button type="button" class="cta-btn fill-btn" data-next>${i + 1 >= list.length ? T("Voir mon résultat") : T("Question suivante")}</button>`);
        const nx = b.querySelector("[data-next]"); nx.focus(); nx.onclick = () => { i++; delete b.dataset.lock; draw(); };
      };
    };
    draw();
  }
  function review() {
    if (needLogin()) return;
    const l = wrongs();
    if (!l.length) { const b = mount("🔁 " + T("Mes erreurs"), `<div class="empty-note">${T("Aucune erreur à réviser pour l'instant : les questions que tu rates (quiz, survie) apparaîtront ici.")}</div>`); return b; }
    playList("🔁 " + T("Mes erreurs") + " (" + l.length + ")", shuffle(l).slice(0, 15), {
      right: (q) => { saveWrongs(wrongs().filter((x) => x.q !== q.q)); },    // question maîtrisée : elle sort de la liste
      wrong: () => {},
      endText: () => wrongs().length ? wrongs().length + " " + T("question(s) à revoir encore.") : T("Plus aucune erreur : bravo !")
    });
  }

  // ---- questions de la communauté
  const trOf = (d) => { const t = d.tr && d.tr[lang()]; return t && t.q && Array.isArray(t.o) && t.o.length === 4 && t.o.every(Boolean) ? { q: t.q, o: t.o } : { q: d.q, o: d.o }; };
  async function communityPlay() {
    if (needLogin()) return;
    const b = mount("👥 " + T("Questions de la communauté"), `<p class="mut">${T("Chargement…")}</p>`);
    try {
      const snap = await C.db.collection("quiz_proposals").where("status", "==", "approved").limit(200).get();
      const all = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      if (!all.length) { b.innerHTML = `<div class="empty-note">${T("Pas encore de question validée : propose les tiennes !")}</div>`; return; }
      playList("👥 " + T("Questions de la communauté"), shuffle(all).slice(0, 10).map((d) => { const t = trOf(d); return { q: t.q, o: t.o, a: [d.a] }; }), { wrong: (q) => addWrong(q), endText: () => T("Merci aux pilotes qui les ont proposées !") });
    } catch (e) { b.innerHTML = `<div class="empty-note error">${esc(e.message || "Erreur")}</div>`; }
  }

  // ================================================================== PROPOSER UNE QUESTION
  async function propose() {
    if (needLogin()) return;
    const b = mount("✍️ " + T("Proposer une question"), "");
    const mine = await C.db.collection("quiz_proposals").where("uid", "==", C.user.uid).limit(30).get().then((s) => s.docs.map((d) => Object.assign({ id: d.id }, d.data()))).catch(() => []);
    const ST = { pending: T("en attente"), approved: T("validée"), rejected: T("refusée") };
    b.innerHTML = `<p class="mut">${T("Écris une question avec 4 réponses (la première est la bonne : elles seront mélangées). L'administration la relit avant de la publier.")}</p>
      <form class="qp-card" id="qp-form"><label>${T("Catégorie")}<select name="cat">${Object.keys(G.QCATS).map((k) => `<option value="${k}">${esc(T(G.QCATS[k]))}</option>`).join("")}</select></label>
        <label>${T("Question")}<input name="q" maxlength="200" required minlength="10" placeholder="${T("Quelle voiture a remporté…")}"></label>
        <label>${T("Bonne réponse")}<input name="o0" maxlength="120" required></label><label>${T("Mauvaise réponse")} 1<input name="o1" maxlength="120" required></label>
        <label>${T("Mauvaise réponse")} 2<input name="o2" maxlength="120" required></label><label>${T("Mauvaise réponse")} 3<input name="o3" maxlength="120" required></label>
        <label>${T("Explication (facultatif)")}<input name="note" maxlength="200"></label><button type="submit" class="cta-btn fill-btn">${T("Envoyer")}</button><small id="qp-msg"></small></form>
      <div class="qp-row"><button type="button" class="cta-btn btn-ghost" data-comm>${T("Jouer les questions de la communauté")}</button></div>
      ${mine.length ? `<h3>${T("Mes propositions")}</h3>${mine.map((d) => `<div class="qp-card"><b>${esc(d.q)}</b><span class="qp-tag">${ST[d.status] || d.status}</span></div>`).join("")}` : ""}`;
    b.querySelector("[data-comm]").onclick = communityPlay;
    b.querySelector("#qp-form").onsubmit = async (e) => {
      e.preventDefault(); const f = new FormData(e.target), v = (n) => String(f.get(n) || "").trim(), msg = b.querySelector("#qp-msg");
      const o = [v("o0"), v("o1"), v("o2"), v("o3")];
      if (new Set(o.map((x) => x.toLowerCase())).size < 4) { msg.textContent = T("Les 4 réponses doivent être différentes."); return; }
      try {
        await C.db.collection("quiz_proposals").add({ uid: C.user.uid, username: String((C.profile && C.profile.username) || C.user.displayName || "Pilote").slice(0, 40), cat: v("cat"), q: v("q"), o, a: 0, note: v("note"), status: "pending", createdAt: C.FieldValue.serverTimestamp() });
        msg.textContent = "✓ " + T("Merci ! Ta question sera relue avant d'être publiée."); e.target.reset(); C.toast("Question envoyée à l'administration.", "ok");
      } catch (err) { msg.textContent = T("Envoi impossible") + " : " + (err.message || ""); }
    };
  }

  // ================================================================== ADMINISTRATION
  async function adminOpen() {
    if (!(C && C.isAdmin)) return;
    const b = mount("❓ " + T("Questions proposées"), `<p class="mut">${T("Chargement…")}</p>`);
    let docs = [];
    try { docs = (await C.db.collection("quiz_proposals").where("status", "==", "pending").limit(60).get()).docs.map((d) => Object.assign({ id: d.id }, d.data())); }
    catch (e) { b.innerHTML = `<div class="empty-note error">${esc(e.message)}</div>`; return; }
    if (!docs.length) { b.innerHTML = `<div class="empty-note">${T("Aucune question en attente.")}</div>`; return; }
    const card = (d) => `<form class="qp-card" data-id="${esc(d.id)}"><div class="qp-row"><span class="qp-tag">${esc(T(G.QCATS[d.cat] || d.cat))}</span><small>${esc(d.username || "")}</small></div>
      <label>Question (fr)<input name="q" value="${esc(d.q)}" maxlength="200"></label>
      ${[0, 1, 2, 3].map((i) => `<label>${i === 0 ? "Bonne réponse (fr)" : "Mauvaise réponse " + i + " (fr)"}<input name="o${i}" value="${esc(d.o[i])}" maxlength="120"></label>`).join("")}
      ${d.note ? `<small>Explication proposée : ${esc(d.note)}</small>` : ""}
      <details><summary>Traductions (en, es, de, it) — laisse vide pour garder le français</summary>${Object.keys(LANGS).map((k) => `<fieldset class="qp-card"><legend>${LANGS[k]}</legend><label>Question<input name="${k}-q" maxlength="200"></label>${[0, 1, 2, 3].map((i) => `<label>${i === 0 ? "Bonne réponse" : "Mauvaise " + i}<input name="${k}-o${i}" maxlength="120"></label>`).join("")}</fieldset>`).join("")}</details>
      <div class="qp-row"><button type="submit" class="cta-btn fill-btn" data-act="ok">✓ Valider et publier</button><button type="button" class="cta-btn btn-ghost" data-act="no">Refuser</button></div><small class="qp-err"></small></form>`;
    b.innerHTML = docs.map(card).join("");
    const val = (f, n) => String((f.elements[n] || {}).value || "").trim();
    b.addEventListener("click", async (e) => {
      const no = e.target.closest('[data-act="no"]'); if (!no) return;
      const f = no.closest("form"); try { await C.db.collection("quiz_proposals").doc(f.dataset.id).update({ status: "rejected", by: C.user.uid, reviewedAt: C.FieldValue.serverTimestamp() }); f.remove(); } catch (err) { f.querySelector(".qp-err").textContent = err.message; }
    });
    b.addEventListener("submit", async (e) => {
      e.preventDefault(); const f = e.target, id = f.dataset.id, o = [0, 1, 2, 3].map((i) => val(f, "o" + i)), err = f.querySelector(".qp-err");
      if (val(f, "q").length < 10 || o.some((x) => !x)) { err.textContent = "Question et 4 réponses obligatoires."; return; }
      const tr = {};
      Object.keys(LANGS).forEach((k) => { const q = val(f, k + "-q"), oo = [0, 1, 2, 3].map((i) => val(f, k + "-o" + i)); if (q && oo.every(Boolean)) tr[k] = { q: q.slice(0, 200), o: oo.map((x) => x.slice(0, 120)) }; });
      try { await C.db.collection("quiz_proposals").doc(id).update({ q: val(f, "q"), o, status: "approved", tr, by: C.user.uid, reviewedAt: C.FieldValue.serverTimestamp() }); f.remove(); C.toast("Question publiée (" + (Object.keys(tr).length + 1) + " langue(s)).", "ok"); }
      catch (er) { err.textContent = er.message; }
    });
  }

  // ================================================================== boutons
  function injectTabs() {
    const root = document.getElementById("quizgame-root"), tabs = root && root.querySelector(".qz-tabs:not(.small)");
    if (!tabs || tabs.querySelector("[data-qzp]")) return;
    [["surv", "❤️ " + T("Survie"), survivalMenu], ["review", "🔁 " + T("Mes erreurs") + (wrongs().length ? " (" + wrongs().length + ")" : ""), review], ["prop", "✍️ " + T("Proposer"), propose]].forEach(([k, label, fn]) => {
      const bt = document.createElement("button"); bt.type = "button"; bt.dataset.qzp = k; bt.textContent = label; bt.addEventListener("click", fn); tabs.appendChild(bt);
    });
  }
  // « Mes erreurs » : on note les questions ratées du quiz habituel en lisant l'écran (bonne réponse colorée + réponse fausse)
  const seenQ = new Set();
  function capture() {
    const root = document.getElementById("quizgame-root"); if (!root || !C || !C.user) return;
    const q = root.querySelector(".qz-q"), opts = Array.from(root.querySelectorAll(".qz-opt"));
    if (!q || opts.length < 2 || !opts.some((o) => o.classList.contains("bad") || o.classList.contains("miss"))) return;
    const txt = q.textContent.trim(); if (seenQ.has(txt)) return; seenQ.add(txt);
    const o = opts.map((x) => x.textContent.replace(/^\s*✓/, "").trim()), a = opts.map((x, i) => (x.classList.contains("good") || x.classList.contains("miss") ? i : -1)).filter((i) => i >= 0);
    if (a.length) addWrong({ q: txt, o, a });
  }
  function adminBtn() {
    const host = document.getElementById("ani-btn") || document.getElementById("open-site-editor"); let b = document.getElementById("qzp-admin-btn");
    if (!(C && C.isAdmin) || !host) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("button"); b.type = "button"; b.id = "qzp-admin-btn"; b.className = "cta-btn btn-ghost"; b.textContent = "❓ Questions proposées"; b.onclick = adminOpen; host.insertAdjacentElement("afterend", b); }
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx; let q = 0;
    new MutationObserver(() => { if (q) return; q = requestAnimationFrame(() => { q = 0; injectTabs(); capture(); }); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    Promise.resolve(C.authReady).then(() => { adminBtn(); setTimeout(adminBtn, 900); });
    document.addEventListener("ma:auth", () => setTimeout(adminBtn, 100)); document.addEventListener("ma:route", () => setTimeout(adminBtn, 250));
  });
  window.MAQuizPlus = { survivalMenu, review, propose, communityPlay, adminOpen, wrongs };
})();
