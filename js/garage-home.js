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
      <a class="gh-cta ${cta.cl}" href="${href}">${icon(cta.ic)}<span class="gh-cta-t"><small>${canDaily ? T("Pack du jour") : T("Ma collection")}</small>${cta.t}</span></a>
      <div class="gh-links"><a href="#/quiz">${icon("🎯")}${T("Quiz")}</a><a href="#/duel">${icon("⚔")}${T("Duel")}</a><a class="gh-chal-link" href="#/jouer/defis">${icon("🏆")}${T("Défis")}</a><a href="#/jouer/echanges">${icon("🔄")}${T("Échanges")}</a></div>`;
    document.documentElement.classList.add("ma-garage");
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
