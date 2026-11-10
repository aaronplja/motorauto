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
  /** pilote déjà connu lors d'une visite précédente : on réserve la place tout de suite, sans montrer l'ancien accueil */
  function skeleton() {
    const page = document.getElementById("page-home");
    if (!page || document.getElementById("home-garage") || !document.documentElement.classList.contains("ma-garage")) return;
    const b = document.createElement("section"); b.id = "home-garage"; b.className = "stage-shell home-section gh gh-skel"; b.setAttribute("aria-busy", "true");
    b.innerHTML = '<div class="gh-head"><div><span class="gh-k">&nbsp;</span><h2 class="gh-title">&nbsp;</h2></div></div><div class="gh-grid"><i class="gh-tile"></i><i class="gh-tile"></i><i class="gh-tile"></i><i class="gh-tile"></i></div><i class="gh-cta"></i>';
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
  /** pilotes suivis : pastilles « en ligne » (présence réciproque, voir js/presence.js) */
  let frFor = "";
  async function friends() {
    const box = document.getElementById("gh-friends"); if (!box || !C.user || !C.db) return;
    if (frFor === C.user.uid && box.dataset.done === "1") return;
    try {
      const f = await C.db.collection("users").doc(C.user.uid).collection("following").limit(40).get();
      const ids = f.docs.map((d) => d.id).slice(0, 24); if (!ids.length) { frFor = C.user.uid; box.dataset.done = "1"; return; }
      const rows = await Promise.all(ids.map(async (uid) => {
        let u = {}, pr = null;
        try { const d = await C.db.collection("users").doc(uid).get(); u = d.exists ? d.data() : {}; } catch (_) { /* ignoré */ }
        try { pr = window.MAPresence ? await window.MAPresence.get(uid) : null; } catch (_) { /* ignoré */ }
        return { uid, name: u.username || u.pseudo || "", photo: u.photoURL || u.avatar || "", on: !!(pr && pr.online) };
      }));
      const on = rows.filter((r) => r.on && r.name).slice(0, 8);
      frFor = C.user.uid; box.dataset.done = "1";
      if (!on.length) return;
      box.innerHTML = `<span class="gh-lab">${T("Amis en ligne")}</span><div class="gh-fr">${on.map((r) => `<a class="gh-av" href="#/pilote/${encodeURIComponent(r.uid)}" title="${C.esc(r.name)}">${r.photo ? `<img src="${C.esc(C.safeUrl(r.photo) || "")}" alt="" data-fallback="avatar">` : `<span>${C.esc(r.name.slice(0, 1).toUpperCase())}</span>`}<i class="gh-dot"></i></a>`).join("")}</div>`;
      box.hidden = false;
    } catch (_) { /* règles non publiées ou hors ligne : on n'affiche rien */ }
  }
  async function paint() {
    const page = document.getElementById("page-home"); if (!page) return;
    const host = page;
    let box = document.getElementById("home-garage");
    if (!C) return;
    try { await C.authReady; } catch (_) { /* ignoré */ }
    box = document.getElementById("home-garage");
    if (!C.user) { visitorCta(); if (box) box.remove(); document.documentElement.classList.remove("ma-garage"); try { localStorage.removeItem("ma_in"); } catch (_) { /* ignoré */ } last = ""; return; }
    try { localStorage.setItem("ma_in", "1"); } catch (_) { /* ignoré */ }
    if (!window.MACards || !window.MAGame) return;
    let doc = window.MACards.mine();
    if (!doc) { try { doc = await window.MACards.load(false); } catch (_) { doc = null; } }
    if (!doc) doc = { dust: 0, count: 0, lastPack: "", bonus: 0 };
    let st = { xp: 0, days: 0 };
    try { await window.MAGame.loadAll(); st = window.MAGame.statsOf(C.user.uid); } catch (_) { /* stats indisponibles */ }
    const lv = window.MAGame.levelOf(st.xp || 0), total = (C.cars ? C.cars.length : 0) + (G.CIRCUIT_CARDS ? G.CIRCUIT_CARDS.length : 0) + (G.LIVERIES ? G.LIVERIES.length : 0);
    const day = window.MAGame.day(), canDaily = doc.lastPack !== day, bonus = Number(doc.bonus) || 0;
    const sig = [C.user.uid, st.xp, st.days, doc.dust, doc.count, doc.lastPack, bonus, total].join("|");
    if (box && sig === last && !box.classList.contains("gh-skel")) return; last = sig;
    if (box) { box.classList.remove("gh-skel"); box.removeAttribute("aria-busy"); }
    if (!box) { box = document.createElement("section"); box.id = "home-garage"; box.className = "stage-shell home-section gh"; box.setAttribute("aria-label", T("Mon garage")); host.insertAdjacentElement("afterbegin", box); }
    const icon = (n) => (window.MAEmoji ? window.MAEmoji.html(n) : n);
    const dust = window.MA && window.MA.dustIcon ? window.MA.dustIcon(22) : icon("💎");
    const cta = canDaily ? { t: T("Ouvrir mon pack du jour"), ic: "🎁", cl: "ready" } : bonus > 0 ? { t: T("Ouvrir un pack bonus") + " (" + bonus + ")", ic: "🎁", cl: "ready" } : { t: T("Voir ma collection"), ic: "🎴", cl: "" };
    const href = canDaily || bonus > 0 ? "#/jouer/boutique" : "#/jouer/collection";
    box.innerHTML = `<div class="gh-head"><div><span class="gh-k">${T("Bon retour")}, ${C.esc(who())}</span><h2 class="gh-title">${T("Le garage,")} <em>${T("c'est ici.")}</em></h2></div></div>
      <div class="gh-grid">
        <a class="gh-tile gh-level" href="#/garage" aria-label="${T("Niveau")}">${ring(lv.pct)}<span class="gh-lab">${T("Niveau")}</span><b class="gh-num">${lv.level.n}</b><small>${C.esc(lv.level.name || lv.level.label || "")}${lv.next ? " · " + nf(lv.toNext) + " XP" : ""}</small></a>
        <a class="gh-tile" href="#/jouer/boutique"><span class="gh-lab">${T("Cristaux")}</span><b class="gh-num gh-row">${dust}${nf(doc.dust)}</b><small>${T("Boutique")}</small></a>
        <a class="gh-tile gh-chal-link" href="#/jouer/defis"><span class="gh-lab">${T("Série")}</span><b class="gh-num gh-row">${icon("🔥")}${nf(st.days || 0)}<i>${T("jours")}</i></b><small>${T("Reviens chaque jour")}</small></a>
        <a class="gh-tile" href="#/jouer/collection"><span class="gh-lab">${T("Cartes")}</span><b class="gh-num">${nf(doc.count)}<i>/ ${nf(total)}</i></b><span class="gh-bar"><u style="width:${total ? Math.min(100, Math.round((doc.count / total) * 100)) : 0}%"></u></span></a>
      </div>
      <a class="gh-cta ${cta.cl}" href="${href}">${icon(cta.ic)}<span class="gh-cta-t"><small>${canDaily ? T("Pack du jour") : bonus > 0 ? T("Pack bonus") : T("Prochain pack dans") + ' <span data-gh-cd>--:--:--</span>'}</small>${cta.t}</span></a>
      <div class="gh-duo">
        <a class="gh-card gh-chal-link" href="#/jouer/defis"><span class="gh-lab">${T("Défi du jour")}</span><b>${T("Relève le défi")}</b><small>${T("Gagne des cristaux et de l'XP")}</small><i class="gh-go" aria-hidden="true">→</i></a>
        <a class="gh-card" href="${lv.next ? "#/garage" : "#/jouer/collection"}"><span class="gh-lab">${T("Prochain objectif")}</span><b>${lv.next ? nf(lv.toNext) + " XP " + T("pour le niveau") + " " + (lv.level.n + 1) : nf(Math.max(0, total - doc.count)) + " " + T("cartes à trouver")}</b><span class="gh-bar"><u style="width:${lv.next ? lv.pct : (total ? Math.round(doc.count / total * 100) : 0)}%"></u></span><small>${lv.next ? nf(Math.max(0, total - doc.count)) + " " + T("cartes pour compléter la collection") : T("Collection en cours")}</small><i class="gh-go" aria-hidden="true">→</i></a>
      </div>
      <div class="gh-friends" id="gh-friends" hidden></div>
      <div class="gh-links"><a href="#/quiz">${icon("🎯")}${T("Quiz")}</a><a href="#/duel">${icon("⚔")}${T("Duel")}</a><a class="gh-chal-link" href="#/jouer/defis">${icon("🏆")}${T("Défis")}</a><a href="#/jouer/echanges">${icon("🔄")}${T("Échanges")}</a></div>`;
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
    const wait = Math.max(0, 600 - (Date.now() - t0));
    setTimeout(() => { e.classList.add("out"); setTimeout(() => e.remove(), 520); }, wait);
  }
  setTimeout(hide, 8000);
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    Promise.all([ctx.authReady, ctx.catReady]).then(() => setTimeout(hide, 250), hide);
  });
})();
