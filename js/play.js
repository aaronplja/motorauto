/**
 * MOTORAUTO — page « Jouer » : vue d'ensemble (accès rapide à tout le jeu) et défis de la semaine.
 * Les défis sont tirés au sort par semaine (identiques pour tous) ; leur avancement et leurs récompenses sont gérés par le serveur.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, weekly = null, weeklyAt = 0, weeklyErr = "", busy = false, tick = null;
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);

  function remaining(ms) {
    const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return d ? `${d} j ${h} h` : h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
  }
  const rewardText = (r, plain) => [r.dust ? `+${r.dust} ${plain ? "cristaux" : window.MA.dustIcon(14)}` : "", r.bonus ? `🎁 ${r.bonus} pack` : ""].filter(Boolean).join(" ");

  async function loadWeekly(force) {
    if (!C.user) { weekly = null; return null; }
    if (!force && weekly && Date.now() - weeklyAt < 20000) return weekly;
    try { weekly = await window.MAGameAPI.call("weeklyStatus"); weeklyErr = ""; weeklyAt = Date.now(); }
    catch (e) { weeklyErr = e.message; weekly = null; }
    return weekly;
  }

  // ------------------------------------------------------------------ défis
  function renderChallenges() {
    const root = document.getElementById("challenges-root"); if (!root) return;
    if (!C.user) { root.innerHTML = `<div class="empty-note">Connecte-toi pour relever les défis de la semaine.<br><button type="button" class="cta-btn fill-btn mt" data-action="open-auth">Me connecter</button></div>`; return; }
    if (!weekly) { root.innerHTML = weeklyErr ? `<div class="empty-note error">${C.esc(weeklyErr)}</div>` : `<div class="tcg-skeleton" aria-busy="true"><i></i><i></i><i></i></div>`; return; }
    const esc = C.esc, done = weekly.items.filter((x) => x.claimed).length;
    const dl = weekly.daily, dpct = dl ? Math.round((dl.value / dl.goal) * 100) : 0;
    const dailyHtml = dl ? `<section class="chal-daily"><div class="chal-head"><div><h3 class="sec-title nomargin">Défi du jour</h3><p class="lap-meta">1 nouveau défi chaque jour, à minuit</p></div></div>
      <article class="chal ${dl.claimed ? "claimed" : dl.done ? "ready" : ""}"><span class="chal-ico" aria-hidden="true">${dl.icon}</span>
        <div class="chal-main"><b>${esc(dl.label)}</b><div class="xp-bar small" aria-hidden="true"><i style="width:${dpct}%"></i></div><small>${dl.value} / ${dl.goal} · récompense ${rewardText(dl.reward)}</small></div>
        ${dl.claimed ? `<span class="chal-done">✓ Récupéré</span>` : dl.done ? `<button type="button" class="cta-btn fill-btn compact-btn" data-chal-claim="${esc(dl.id)}" ${busy ? "disabled" : ""}>Récupérer</button>` : `<a class="cta-btn btn-ghost compact-btn" href="${hintOf(dl.id)}">Y aller</a>`}</article></section>` : "";
    const ft = weekly.featured, fc = ft && ft.car && (C.carsById || new Map()).get ? C.carsById.get(ft.car.id) : null;
    const fImg = fc ? (C.safeUrl ? C.safeUrl(fc.image || fc.img || "") : (fc.image || fc.img || "")) : "";
    const chalRow = (x) => { const pct = Math.round((x.value / x.goal) * 100); return `<article class="chal ${x.claimed ? "claimed" : x.done ? "ready" : ""}"><span class="chal-ico" aria-hidden="true">${x.icon}</span>
          <div class="chal-main"><b>${esc(x.label)}</b><div class="xp-bar small" aria-hidden="true"><i style="width:${pct}%"></i></div><small>${x.value} / ${x.goal} · récompense ${rewardText(x.reward)}</small></div>
          ${x.claimed ? `<span class="chal-done">✓ Récupéré</span>` : x.done ? `<button type="button" class="cta-btn fill-btn compact-btn" data-chal-claim="${esc(x.id)}" ${busy ? "disabled" : ""}>Récupérer</button>` : `<a class="cta-btn btn-ghost compact-btn" href="#/voiture/${encodeURIComponent(ft.car.id)}">Y aller</a>`}</article>`; };
    const featHtml = ft && ft.car && ft.car.id ? `<section class="chal-feat"><div class="feat-head">${fImg ? `<img class="feat-img" src="${esc(fImg)}" alt="" loading="lazy" data-fallback="car">` : ""}<div><span class="status-tag-verified">Voiture de la semaine</span><h3 class="sec-title nomargin">${esc(ft.car.name)}</h3>
      <p class="lap-meta">3 défis sur cette voiture · ${ft.next && ft.next.name ? `la semaine prochaine : <b>${esc(ft.next.name)}</b>` : "nouvelle voiture chaque lundi"}</p></div></div>
      <div class="chal-list">${ft.items.map(chalRow).join("")}</div></section>` : "";
    root.innerHTML = dailyHtml + featHtml + `<div class="chal-head chal-week-head"><div><h3 class="sec-title nomargin">Défis de la semaine</h3><p class="lap-meta">Nouveaux défis chaque lundi · <b id="chal-left">${remaining(weekly.endsAt - Date.now())}</b> restantes</p></div>
        <div class="chal-score" aria-label="${done} défis sur ${weekly.items.length} récupérés"><b>${done}</b>/${weekly.items.length}</div></div>
      <div class="xp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${weekly.items.length}" aria-valuenow="${done}"><i style="width:${(done / weekly.items.length) * 100}%"></i></div>
      <div class="chal-list">${weekly.items.map((x) => {
        const pct = Math.round((x.value / x.goal) * 100);
        return `<article class="chal ${x.claimed ? "claimed" : x.done ? "ready" : ""}"><span class="chal-ico" aria-hidden="true">${x.icon}</span>
          <div class="chal-main"><b>${esc(x.label)}</b><div class="xp-bar small" aria-hidden="true"><i style="width:${pct}%"></i></div><small>${x.value} / ${x.goal} · récompense ${rewardText(x.reward)}</small></div>
          ${x.claimed ? `<span class="chal-done">✓ Récupéré</span>` : x.done ? `<button type="button" class="cta-btn fill-btn compact-btn" data-chal-claim="${esc(x.id)}" ${busy ? "disabled" : ""}>Récupérer</button>` : `<a class="cta-btn btn-ghost compact-btn" href="${hintOf(x.id)}">Y aller</a>`}</article>`;
      }).join("")}</div>
      <p class="sec-lead">🎁 Les ${weekly.items.length} défis validés dans la semaine rapportent <b>${weekly.perfectBonus} pack bonus</b> en plus.</p>`;
  }
  function hintOf(id) {
    id = String(id).replace(/^d-/, "").replace(/1$|3$/, (m) => m);
    return { "pack": "#/jouer/cartes", like3: "#/catalogue", comment1: "#/catalogue", react2: "#/catalogue", chat3: "chat.html", packs5: "#/jouer/cartes", comment5: "#/catalogue", duel3: "#/duel", share3: "#/catalogue", like15: "#/catalogue", chat5: "chat.html", packs3: "#/jouer/cartes", daily3: "#/jouer/cartes", comment2: "#/catalogue", duel1: "#/duel", share1: "#/catalogue", lap1: "#/classement/chronos", like5: "#/catalogue", react3: "#/catalogue", rsvp1: "#/communaute/evenements", vote1: "#/jouer/concours", trade1: "#/jouer/echanges", wish3: "#/jouer/cartes" }[id] || "#/jouer";
  }
  async function claim(id) {
    if (busy) return; busy = true; renderChallenges();
    try {
      const r = await window.MAGameAPI.call("claimChallenge", { id });
      window.MACards.applyDoc(r.doc);
      // affichage immédiat : on marque le défi comme récupéré sans attendre un second aller-retour serveur
      if (weekly) { const all = weekly.items.concat(weekly.daily ? [weekly.daily] : []); const it = all.find((x) => x.id === id); if (it) it.claimed = true; }
      C.toast(`🎯 Défi validé : ${rewardText(r.reward, true)}${r.perfect ? " · semaine parfaite : +1 pack bonus !" : ""}`, "ok");
      busy = false; renderChallenges();
      loadWeekly(true).then(renderChallenges);            // resynchronisation en arrière-plan
      return;
    } catch (e) { C.toast(e.message, "err"); }
    busy = false; await loadWeekly(true); renderChallenges();
  }

  // ------------------------------------------------------------------ événements saisonniers (cartes à récupérer pendant une période)
  async function renderEvents() {
    const root = document.getElementById("play-hub"); if (!root || !C.user) return;
    let list = [];
    try {
      const snap = await C.db.collection("special_cards").where("claimable", "==", true).limit(10).get(), t = Date.now();
      list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((c) => c.active !== false && (!c.startsAtMs || t >= c.startsAtMs) && (!c.endsAtMs || t <= c.endsAtMs));
      const own = await Promise.all(list.map((c) => C.db.collection("special_grants").doc(c.id + "_" + C.user.uid).get().then((s) => s.exists && (s.data().serials || []).length).catch(() => false)));
      list = list.filter((c, i) => !own[i] && !(c.supply > 0 && (c.granted || 0) >= c.supply));
    } catch (_) { return; }
    if (!list.length || !C.Router.is("play", { tab: "apercu" })) return;
    root.querySelectorAll(".event-banner").forEach((n) => n.remove());
    const box = document.createElement("div"); box.className = "event-banner-wrap";
    box.innerHTML = list.map((c) => `<div class="event-banner" data-ev="${C.esc(c.id)}"><div class="event-txt"><small>Événement en cours</small><b>${C.esc(c.name)}</b><span>${C.esc(c.edition || "Carte spéciale")}${c.endsAtMs ? " · jusqu'au " + new Date(c.endsAtMs).toLocaleDateString("fr-FR") : ""}${c.supply ? " · " + Math.max(0, c.supply - (c.granted || 0)) + " restantes" : ""}</span></div><button type="button" class="cta-btn fill-btn" data-claim-ev="${C.esc(c.id)}">Récupérer ma carte</button></div>`).join("");
    root.prepend(box);
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-claim-ev]"); if (!b || b.disabled) return;
    b.disabled = true;
    try {
      const r = await window.MAGameAPI.call("claimSpecial", { cardId: b.dataset.claimEv });
      C.toast("Carte « " + (r.name || "") + " » ajoutée à ta collection !", "ok");
      const w = b.closest(".event-banner"); if (w) w.remove();
    } catch (ex) { C.toast(ex.message || "Impossible de récupérer la carte.", "err"); b.disabled = false; }
  });

  // ------------------------------------------------------------------ vue d'ensemble
  const SVI = (d) => `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const HUBI = {fusion: SVI('<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><path d="M7 10v2c0 2 5 2 5 6M17 10v2c0 2-5 2-5 6"/><circle cx="12" cy="20" r="1.4"/>'),market: SVI('<path d="M3 10l2-5h14l2 5"/><path d="M4 10v10h16V10"/><path d="M9 20v-6h6v6"/>'),wish: SVI('<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>'),pm: SVI('<path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/>'),quiz: SVI('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8"/><circle cx="12" cy="17" r=".6"/>'),ach: SVI('<circle cx="12" cy="9" r="5.5"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>'),time: SVI('<path d="M3 12h18"/><circle cx="7" cy="12" r="2"/><circle cx="14" cy="12" r="2"/><path d="M7 10V6M14 14v4"/>'),news: SVI('<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v9a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/>')};
  async function renderHub() {
    const root = document.getElementById("play-hub"); if (!root) return;
    const month = G.monthKey(), canDaily = (d) => d && d.lastPack !== G.dayKey();
    const tile = (href, ico, title, sub, badge, cls) => `<a class="hub-tile ${cls || ""}" href="${href}"><i class="hub-ico" aria-hidden="true">${ico}</i><b>${title}</b><small>${sub}</small>${badge ? `<span class="hub-badge">${badge}</span>` : ""}</a>`;
    const draw = (st) => {
      root.innerHTML = `<div class="hub-grid">
        ${tile("#/jouer/cartes", "🎴", "Cartes", st.cards, st.cardsBadge, "hub-feature")}
        ${tile("#/jouer/defis", "🎯", "Défis", st.chal, st.chalBadge)}
        ${tile("#/jouer/echanges", "🔄", "Échanges", st.trade, st.tradeBadge)}
        ${tile("#/jouer/concours", "📸", "Concours photo", st.contest, "")}
        <a class="hub-tile" href="#/jouer/cartes" data-battle-tile role="button"><i class="hub-ico hub-ico-svg" aria-hidden="true"><svg viewBox="0 0 48 48" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><rect x="5" y="9" width="21" height="30" rx="4" transform="rotate(-14 15.5 24)"/><rect x="22" y="9" width="21" height="30" rx="4" transform="rotate(14 32.5 24)" fill="var(--accent)" stroke="var(--accent)"/><path d="M26.5 14l-5 10h6l-4 10" stroke="#fff" stroke-width="2.6"/></svg></i><b>Bataille contre l'IA</b><small>Entraînement avec tes cartes, sans récompense</small></a>
        ${tile("#/duel", "🏁", "Duel", "0-100 km/h et 400 m en course", "")}
        ${tile("#/classement", "🏆", "Classements", "Chronos, circuits, pilotes", "")}
        ${tile("#/fusion", HUBI.fusion, T("Fusion"), T("5 doublons → 1 carte au-dessus"), "")}
        ${tile("#/marche", HUBI.market, T("Marché"), T("Vends et achète des cartes"), st.mkBadge)}
        ${tile("#/souhaits", HUBI.wish, T("Souhaits"), T("Qui cherche quoi, qui propose quoi"), "")}
        ${tile("#/plusmoins", HUBI.pm, T("Plus ou moins"), T("Séries sans faute = cristaux"), "")}
        ${tile("#/quiz", HUBI.quiz, T("Quiz"), T("4 catégories, 3 niveaux"), "")}
        ${tile("#/succes", HUBI.ach, T("Succès"), T("Tes badges et ta progression"), "")}
        ${tile("#/frise", HUBI.time, T("Frise"), T("Toute l'histoire sur une ligne"), "")}
        ${tile("#/nouveautes", HUBI.news, T("Nouveautés"), T("Le journal des mises à jour"), st.newsBadge)}
      </div>`;
    };
    const st = { cards: C.user ? "Pack du jour, collection, wishlist" : "Un pack gratuit par jour", cardsBadge: "", chal: "4 nouveaux défis chaque lundi", chalBadge: "", trade: "Échange tes doublons avec les pilotes", tradeBadge: "", contest: "Thème du mois, vote de la communauté" };
    draw(st);
    if (!C.user) return;
    const [col, wk, trades, contest] = await Promise.all([
      window.MACards.load().catch(() => null), loadWeekly(),
      C.db.collection("trades").where("toUid", "==", C.user.uid).limit(60).get().then((s) => s.docs.filter((d) => d.data().status === "open").length).catch(() => 0),
      C.db.collection("contests").doc(month).get().then((s) => (s.exists ? s.data() : null)).catch(() => null)
    ]);
    if (col) { st.cards = canDaily(col) ? "Ton pack du jour t'attend !" : `${col.count} / ${C.cars.length} cartes · ${window.MA.dustIcon(13)} ${col.dust}`; st.cardsBadge = canDaily(col) ? "1" : col.bonus ? String(col.bonus) : ""; }
    if (wk) { const done = wk.items.filter((x) => x.claimed).length, ready = wk.items.filter((x) => x.done && !x.claimed).length; st.chal = `${done} / ${wk.items.length} validés · fin dans ${remaining(wk.endsAt - Date.now())}`; st.chalBadge = ready ? String(ready) : ""; }
    st.trade = trades ? `${trades} proposition${trades > 1 ? "s" : ""} à traiter` : "Échange tes doublons avec les pilotes"; st.tradeBadge = trades ? String(trades) : "";
    if (contest) st.contest = contest.status === "open" ? `Thème : « ${contest.theme} »` : `Concours de ${G.monthLabel(month)} terminé`;
    if (window.MANews) { try { const n = await window.MANews.unread(); st.newsBadge = n ? String(n) : ""; } catch (_) { /* pastille facultative */ } }
    if (C.Router.is("play", { tab: "apercu" })) { draw(st); renderEvents(); if (window.MAReferral) window.MAReferral.mount(root); }
  }

  // ------------------------------------------------------------------ actions signalées au serveur (duel, quiz, partage)
  const sentAt = {};
  function log(type) {
    if (!C.user || !window.MAGameAPI || Date.now() - (sentAt[type] || 0) < 20000) return;
    sentAt[type] = Date.now();
    window.MAGameAPI.call("logAction", { type }).then(() => { weeklyAt = 0; }).catch(() => {});
  }

  /** ouvrir la fiche de la voiture de la semaine valide le défi « Découvre la fiche » */
  async function logFeatView(carId) {
    if (!C.user || !window.MAGameAPI || !carId) return;
    if (sentAt.featview === carId) return;
    const w = await loadWeekly(false);
    if (!w || !w.featured || !w.featured.car || w.featured.car.id !== carId) return;
    sentAt.featview = carId;
    window.MAGameAPI.call("logAction", { type: "featview", carId }).then(() => { weeklyAt = 0; }).catch(() => { sentAt.featview = ""; });
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("car", { enter: (p) => { setTimeout(() => logFeatView(p.id), 1500); } });
    ctx.Router.register("play", { enter: async (p) => {
      clearInterval(tick);
      if (p.tab === "apercu") renderHub();
      else if (p.tab === "defis") { renderChallenges(); await loadWeekly(true); renderChallenges(); tick = setInterval(() => { const el = document.getElementById("chal-left"); if (el && weekly) el.textContent = remaining(weekly.endsAt - Date.now()); else clearInterval(tick); }, 30000); }
    } });
    document.addEventListener("ma:auth", () => { weekly = null; weeklyAt = 0; if (ctx.Router.is("play", { tab: "apercu" })) renderHub(); else if (ctx.Router.is("play", { tab: "defis" })) { renderChallenges(); loadWeekly(true).then(renderChallenges); } });
    document.addEventListener("click", (e) => { const c = e.target.closest("[data-chal-claim]"); if (c) claim(c.dataset.chalClaim); });
    document.addEventListener("ma:duel-done", () => log("duel"));
    document.addEventListener("ma:shared", () => log("share"));
    document.addEventListener("ma:cards", () => { weeklyAt = 0; });
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-battle-tile]"); if (!b) return;
    e.preventDefault();
    if (!window.MABattle) { location.hash = "#/jouer/cartes"; return; }
    Promise.resolve(window.MACards && window.MACards.load ? window.MACards.load() : null).catch(() => {}).then(() => window.MABattle.open());
  });
})();