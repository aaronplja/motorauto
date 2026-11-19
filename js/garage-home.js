/**
 * MOTORAUTO — accueil « Garage » (pilotes connectés).
 * Un résumé personnel en haut de l'accueil : niveau, cristaux, série de jours, collection, et le bouton du pack du jour.
 * Les visiteurs non connectés gardent l'accueil d'origine. Rien n'est écrit : on lit seulement la collection et les stats.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, last = "";
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const nf = (n) => Number(n || 0).toLocaleString("fr-FR");
  const onHome = () => /^#?\/?$/.test(location.hash.replace(/^#/, "#")) || location.hash === "" || location.hash === "#/";
  function who() {
    const u = C.user || {}; let n = "";
    try { n = (C.me && (C.me.username || C.me.pseudo)) || ""; } catch (_) { /* ignoré */ }
    return n || (u.displayName || "").split(" ")[0] || T("pilote");
  }
  function ring(pct) {
    const r = 15.5, c = 2 * Math.PI * r;
    return `<svg class="gh-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="${r}" class="gh-ring-bg"/><circle cx="18" cy="18" r="${r}" class="gh-ring-fg" style="stroke-dasharray:${(c * pct / 100).toFixed(1)} ${c.toFixed(1)}"/></svg>`;
  }
  /** menus de l'accueil : fermés par défaut pour le pilote connecté (sauf choix déjà fait), toujours ouverts pour un visiteur */
  function homeAcc(garage) {
    const A = window.MAAcc; if (!A) return;
    document.querySelectorAll("#page-home details.home-acc[data-acc]").forEach((d) => {
      if (!garage) { A.quiet(d, true); return; }
      let saved = null; try { saved = localStorage.getItem("ma_acc_" + d.dataset.acc); } catch (_) { /* ignoré */ }
      if (saved === null) A.quiet(d, false);
    });
  }
  /** pilote déjà connu lors d'une visite précédente : on réserve la place tout de suite, sans montrer l'ancien accueil */
  function skeleton() {
    const page = document.getElementById("page-home");
    if (!page || document.getElementById("home-garage") || !document.documentElement.classList.contains("ma-garage")) return;
    const b = document.createElement("section"); b.id = "home-garage"; b.className = "stage-shell home-section gh gh-skel"; b.setAttribute("aria-busy", "true");
    b.innerHTML = '<div class="gh-head"><div><h2 class="gh-title">&nbsp;<br>&nbsp;</h2></div></div>';
    page.insertAdjacentElement("afterbegin", b);
  }
  /** visiteur : deux boutons d'action sous les chiffres du hero (créer un compte, parcourir le catalogue) */
  function visitorCta() {
    const st = document.querySelector("#page-home .hero-stats"); if (!st || document.getElementById("hero-cta")) return;
    const d = document.createElement("div"); d.id = "hero-cta"; d.className = "hero-cta";
    d.innerHTML = `<button type="button" class="cta-btn fill-btn" data-action="open-auth">${T("Créer mon compte")}</button><a class="cta-btn btn-ghost" href="#/catalogue">${T("Parcourir le catalogue")}</a>`;
    st.insertAdjacentElement("afterend", d);
  }
  /** compte à rebours jusqu'au prochain pack du jour (minuit, heure de Paris) */
  let cdT = null;
  function nextMidnight() {
    const now = Date.now(), k = G.dayKey(now);
    for (let h = 1; h <= 30; h++) { const t = now + h * 3600000; if (G.dayKey(t) !== k) return G.parisMidnight(G.dayKey(t)); }
    return now + 86400000;
  }
  function countdown(on) {
    if (cdT) { clearInterval(cdT); cdT = null; }
    if (!on) return;
    const end = nextMidnight(), pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      const el = document.querySelector("[data-gh-cd]"); if (!el) return;
      const d = Math.max(0, end - Date.now()), h = Math.floor(d / 3600000), m = Math.floor(d % 3600000 / 60000), s = Math.floor(d % 60000 / 1000);
      el.textContent = pad(h) + ":" + pad(m) + ":" + pad(s);
      if (d <= 0) { clearInterval(cdT); cdT = null; last = ""; paint(); }
    };
    tick(); cdT = setInterval(tick, 1000);
  }
  /** pilotes suivis : pastilles « en ligne » (présence réciproque, voir js/social/presence.js) */
  let frFor = "";
  async function friends() {
    const box = document.getElementById("gh-friends"); if (!box || !C.user || !C.db) return;
    const me = C.user.uid;
    if (frFor === me && box.dataset.done === "1") return;
    try {
      const f = await C.db.collection("users").doc(me).collection("following").limit(40).get();
      const ids = f.docs.map((d) => d.id).slice(0, 24); if (!ids.length) { frFor = me; box.dataset.done = "1"; return; }
      const rows = await Promise.all(ids.map(async (uid) => {
        let u = {}, pr = null;
        try { const d = await C.db.collection("users").doc(uid).get(); u = d.exists ? d.data() : {}; } catch (_) { /* ignoré */ }
        try { pr = window.MAPresence ? await window.MAPresence.get(uid) : null; } catch (_) { /* ignoré */ }
        return { uid, name: u.username || u.pseudo || "", photo: u.photoURL || u.avatar || "", on: !!(pr && pr.online) };
      }));
      const on = rows.filter((r) => r.on && r.name).slice(0, 8);
      frFor = me; box.dataset.done = "1";
      if (!on.length) return;
      box.innerHTML = `<span class="gh-lab">${T("Amis en ligne")}</span><div class="gh-fr">${on.map((r) => `<a class="gh-av" href="#/pilote/${encodeURIComponent(r.uid)}" title="${C.esc(r.name)}">${r.photo ? `<img src="${C.esc(C.safeUrl(r.photo) || "")}" alt="" data-fallback="avatar">` : `<span>${C.esc(r.name.slice(0, 1).toUpperCase())}</span>`}<i class="gh-dot"></i></a>`).join("")}</div>`;
      box.hidden = false;
    } catch (_) { /* règles non publiées ou hors ligne : on n'affiche rien */ }
  }
  // un seul dessin à la fois : plusieurs paint() qui se chevauchaient (entrée de page, minuterie, intervalle) créaient chacun leur bandeau → doublons
  let painting = false, again = false;
  async function paint() {
    if (painting) { again = true; return; }
    painting = true;
    try { await paint1(); } finally { painting = false; if (again) { again = false; setTimeout(paint, 80); } }
  }
  async function paint1() {
    const page = document.getElementById("page-home"); if (!page) return;
    const host = page;
    let box = document.getElementById("home-garage");
    if (!C) return;
    try { await C.authReady; } catch (_) { /* ignoré */ }
    box = document.getElementById("home-garage");
    if (!C.user) { visitorCta(); if (box) box.remove(); const rest = document.getElementById("home-garage-rest"); if (rest) rest.remove(); homeAcc(false);  document.documentElement.classList.remove("ma-garage"); try { localStorage.removeItem("ma_in"); } catch (_) { /* ignoré */ } last = ""; return; }
    try { localStorage.setItem("ma_in", "1"); } catch (_) { /* ignoré */ }
    if (!window.MACards || !window.MAGame) return;
    let doc = window.MACards.mine();
    if (!doc) { try { doc = await window.MACards.load(false); } catch (_) { doc = null; } }
    if (!doc) doc = { dust: 0, count: 0, lastPack: "", bonus: 0 };
    if (!C.user) return;   // déconnexion pendant le chargement : on ne dessine rien (sinon « n.user.uid » sur null)
    const me = C.user.uid;
    let st = { xp: 0, days: 0 };
    try { await window.MAGame.loadAll(); st = window.MAGame.statsOf(me); } catch (_) { /* stats indisponibles */ }
    if (!C.user) return;
    const lv = window.MAGame.levelOf(st.xp || 0), total = (C.cars ? C.cars.length : 0) + (G.CIRCUIT_CARDS ? G.CIRCUIT_CARDS.length : 0) + (G.LIVERIES ? G.LIVERIES.length : 0);
    const day = window.MAGame.day(), canDaily = doc.lastPack !== day, bonus = Number(doc.bonus) || 0;
    const sig = [me, st.xp, st.days, doc.dust, doc.count, doc.lastPack, bonus, total, Math.floor((nextMidnight() - Date.now()) / 60000 / 15)].join("|");
    if (box && sig === last && !box.classList.contains("gh-skel")) return; last = sig;
    if (box) { box.classList.remove("gh-skel"); box.removeAttribute("aria-busy"); }
    box = document.getElementById("home-garage") || box;
    document.querySelectorAll("#home-garage").forEach((x, i) => { if (i) x.remove(); });
    if (!box) { box = document.createElement("section"); box.id = "home-garage"; box.className = "stage-shell home-section gh"; box.setAttribute("aria-label", T("Mon garage")); host.insertAdjacentElement("afterbegin", box); }
    const icon = (n) => (window.MAEmoji ? window.MAEmoji.html(n) : n);
    const dust = window.MA && window.MA.dustIcon ? window.MA.dustIcon(22) : icon("💎");
    const cta = canDaily ? { t: T("Ouvrir mon pack du jour"), ic: "🎁", cl: "ready" } : bonus > 0 ? { t: T("Ouvrir un pack bonus") + " (" + bonus + ")", ic: "🎁", cl: "ready" } : { t: T("Voir ma collection"), ic: "🎴", cl: "" };
    const href = canDaily || bonus > 0 ? "#/jouer/boutique" : "#/jouer/collection";
    const nm = who(), long = nm.length > 20 ? " gh-xl" : nm.length > 12 ? " gh-long" : "";
    const nd = st.days || 0;
    box.innerHTML = `<div class="gh-head${long}"><h2 class="gh-title${long}">${T("Bon retour")},<br><em>${C.esc(nm)}.</em></h2>${nd ? `<a class="gh-streak" href="#/jouer/defis" aria-label="${T("Série")} : ${nd} ${T("jours")}"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg><b>${nf(nd)}</b><small>${T("jours")}</small></a>` : ""}</div>`;
    let rest = document.getElementById("home-garage-rest");
    if (!rest) { rest = document.createElement("section"); rest.id = "home-garage-rest"; rest.className = "stage-shell home-section gh gh-rest"; box.insertAdjacentElement("afterend", rest); }
    document.querySelectorAll("#home-garage-rest").forEach((x, i) => { if (i) x.remove(); });
    const left = nextMidnight() - Date.now(), alertTxt = canDaily && left > 0 && left <= 6 * 3600000
      ? T("Plus que") + " " + (left < 3600000 ? Math.max(1, Math.ceil(left / 60000)) + " min" : Math.ceil(left / 3600000) + " h") + " " + T("pour ouvrir ton pack du jour") : "";
    rest.innerHTML = `${alertTxt ? `<a class="gh-alert" href="#/jouer/boutique">${alertTxt}</a>` : ""}
      <a class="gh-cta ${cta.cl}" href="${href}">${icon(cta.ic)}<span class="gh-cta-t"><small>${canDaily ? T("Pack du jour") : bonus > 0 ? T("Pack bonus") : T("Prochain pack dans") + ' <span data-gh-cd>--:--:--</span>'}</small>${cta.t}</span></a>
      <div class="gh-grid">
        <a class="gh-tile" href="#/jouer/boutique"><span class="gh-lab">${T("Cristaux")}</span><b class="gh-num gh-row">${dust}${nf(doc.dust)}</b></a>
        <a class="gh-tile gh-level" href="#/garage" aria-label="${T("Niveau")}"><span class="gh-lab">${T("Niveau")}</span><b class="gh-num">${lv.level.n}</b><small>${C.esc(lv.level.name || lv.level.label || "")}</small></a>
        <a class="gh-tile" href="#/jouer/collection"><span class="gh-lab">${T("Cartes")}</span><b class="gh-num">${nf(doc.count)}<i>/ ${nf(total)}</i></b><span class="gh-bar"><u style="width:${total ? Math.min(100, Math.round((doc.count / total) * 100)) : 0}%"></u></span></a>
      </div>
      <div class="gh-duo">
        <a class="gh-card" href="${lv.next ? "#/garage" : "#/jouer/collection"}"><span class="gh-lab">${T("Prochain objectif")}</span><b>${lv.next ? nf(lv.toNext) + " XP " + T("pour le niveau") + " " + (lv.level.n + 1) : nf(Math.max(0, total - doc.count)) + " " + T("cartes à trouver")}</b><span class="gh-bar"><u style="width:${lv.next ? lv.pct : (total ? Math.round(doc.count / total * 100) : 0)}%"></u></span><small>${lv.next ? nf(Math.max(0, total - doc.count)) + " " + T("cartes pour compléter la collection") : T("Collection en cours")}</small><i class="gh-go" aria-hidden="true">→</i></a>
        <a class="gh-card gh-chal-link" href="#/jouer/defis"><span class="gh-lab">${T("Défi du jour")}</span><b>${T("Relève le défi")}</b><small>${T("Gagne des cristaux et de l'XP")}</small><i class="gh-go" aria-hidden="true">→</i></a>
      </div>
      <div class="gh-friends" id="gh-friends" hidden></div>
      <div class="gh-links"><a href="#/quiz">${icon("🎯")}${T("Quiz")}</a><a href="#/duel">${icon("⚔")}${T("Duel")}</a><a class="gh-chal-link" href="#/jouer/defis">${icon("🏆")}${T("Défis")}</a><a href="#/jouer/echanges">${icon("🔄")}${T("Échanges")}</a></div>`;
    homeAcc(true);
    document.documentElement.classList.add("ma-garage");
    countdown(!canDaily && !(bonus > 0));
    friends();
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    skeleton();
    ctx.Router.register("home", { enter: () => { last = ""; setTimeout(paint, 250); } });
    setTimeout(paint, 1500);
    setInterval(() => { if (document.getElementById("page-home") && !document.hidden) paint(); }, 4000);
  });
})();

/** écran de chargement : retiré dès que le catalogue et la connexion sont prêts (ou après 8 s au plus) */
(function () {
  "use strict";
  const el = () => document.getElementById("boot-splash");
  let gone = false, t0 = Date.now();
  function hide() {
    if (gone) return; gone = true; const e = el(); if (!e) return;
    const min = document.documentElement.classList.contains("splash-ran") ? 600 : 1700;   // le tracé du logo dure ~1,6 s
    const wait = Math.max(0, min - (Date.now() - t0));
    setTimeout(() => { e.classList.add("out"); setTimeout(() => e.remove(), 520); }, wait);
  }
  setTimeout(hide, 8000);
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    Promise.all([ctx.authReady, ctx.catReady]).then(() => setTimeout(hide, 250), hide);
  });
})();
