/**
 * MOTORAUTO — Bataille de cartes contre un autre joueur, en direct.
 *  • « Bataille » ouvre un choix : contre l'IA (js/card-battle.js) ou contre un joueur.
 *  • Contre un joueur : on choisit un pilote, l'invitation part dans le chat privé (valable 2 minutes) et la partie se joue en direct.
 *  • Une notification volante prévient l'invité sur tout le site ; elle se désactive (Réglages → Notifications, ou « Ne plus afficher »).
 * Tout le jeu est réglé par le serveur (callables battleInvite / battleRespond / battlePlay / battleClaim) ; ici on ne fait qu'afficher le document card_battles/{id}.
 */
(function () {
  "use strict";
  let holdUntil = 0, ledId = "", C = null, ov = null, unsub = null, timer = null, bid = "", bt = null, hand = [], pick = -1, busy = false, sentNote = "";
  let incUnsub = null, toastEl = null, toastId = "", toastTimer = null;
  const LS = "ma_battle_alert";
  const STATS = [["power", "Puissance", "ch"], ["speed", "Vitesse", "km/h"], ["zero", "0 à 100", "s"]];
  const $ = (s, r) => (r || document).querySelector(s);
  const alertOn = () => { try { return localStorage.getItem(LS) !== "0"; } catch (_) { return true; } };
  const setAlert = (on) => { try { localStorage.setItem(LS, on ? "1" : "0"); } catch (_) { /* ignoré */ } if (!on) hideToast(); };
  const T = (s) => (window.MAi18n && window.MAi18n.t ? window.MAi18n.t(s) : s);
  const carOf = (id) => (C.carsById && C.carsById.get(id)) || C.cars.find((c) => c.id === id);
  const card = (id) => { const c = carOf(id); return c ? window.MACards.cardHtml(c, { owned: true }) : `<div class="bt-hidden">?</div>`; };
  const val = (id, k) => { const c = carOf(id); return Number(c && c.stats && c.stats[k]) || 0; };
  const fmtT = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const call = (name, data) => window.MAGameAPI.call(name, data);
  const side = () => (bt && bt.a === C.user.uid ? "a" : "b"), other = () => (side() === "a" ? "b" : "a");

  // ------------------------------------------------------------------ fenêtre
  function shell(label) {
    if (!ov) {
      ov = document.createElement("div");
      ov.className = "tcg-overlay"; ov.dataset.kind = "battle"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", label || "Bataille");
      ov.innerHTML = `<div class="tcg-stage"><div class="bt bl"></div><button type="button" class="cta-btn btn-ghost" data-bl="close">Quitter</button></div>`;
      document.body.appendChild(ov); document.body.classList.add("tcg-open");
      document.addEventListener("keydown", onKey);
      requestAnimationFrame(() => ov && ov.classList.add("on"));
      ov.addEventListener("click", onClick);
    }
    return $(".bl", ov);
  }
  function close() {
    stopWatch();
    if (!ov) return;
    document.removeEventListener("keydown", onKey);
    document.body.classList.remove("tcg-open");
    const o = ov; ov = null; o.classList.remove("on"); setTimeout(() => o.remove(), 180);
  }
  const onKey = (e) => { if (e.key === "Escape") leave(); };
  function leave() {
    // quitter une partie en cours = forfait ; une invitation envoyée est annulée
    if (bt && bid && (bt.status === "pending" && bt.a === C.user.uid || bt.status === "active")) call("battleCancel", { id: bid }).catch(() => {});
    close();
  }

  // ------------------------------------------------------------------ choix du mode
  function chooser() {
    if (!C.user) { C.toast("Connecte-toi pour lancer une bataille.", "err"); return; }
    close();
    const box = shell("Choisir le mode de bataille");
    box.innerHTML = `<h2>Bataille de cartes</h2><p class="tcg-hint">Choisis ton adversaire</p>
      <div class="bl-modes">
        <button type="button" class="bl-mode" data-bl="ai"><b>Contre l'IA</b><small>Entraînement tout de suite, sans récompense</small></button>
        <button type="button" class="bl-mode" data-bl="players"><b>Contre un joueur</b><small>Il reçoit une invitation dans le chat, vous jouez en direct</small></button>
      </div>`;
  }

  // ------------------------------------------------------------------ liste des joueurs
  async function players() {
    const box = shell(); box.innerHTML = `<h2>Choisis un joueur</h2><input type="search" class="bl-q" id="bl-q" placeholder="Rechercher un pilote…" autocomplete="off" aria-label="Rechercher un pilote"><div class="bl-list" id="bl-list"><p class="tcg-hint">Chargement…</p></div><button type="button" class="cta-btn btn-ghost" data-bl="back">Retour</button>`;
    let users = [], online = new Set();
    try {
      const [us, ps] = await Promise.all([C.db.collection("users").limit(300).get(), C.db.collection("presence").limit(300).get().catch(() => ({ docs: [] }))]);
      us.docs.forEach((d) => { if (d.id !== C.user.uid) { const x = d.data(); users.push({ id: d.id, name: String(x.username || "Pilote"), avatar: C.safeUrl(x.avatar) || "" }); } });
      ps.docs.forEach((d) => { const x = d.data(), at = x.at && x.at.toMillis ? x.at.toMillis() : 0; if (!x.hide && at && Date.now() - at < 5 * 60000) online.add(d.id); });
    } catch (e) { const l = $("#bl-list", ov); if (l) l.innerHTML = `<p class="form-error">Liste des pilotes indisponible.</p>`; return; }
    users.sort((a, b) => (online.has(b.id) - online.has(a.id)) || a.name.localeCompare(b.name));
    const draw = () => {
      const q = (($("#bl-q", ov) || {}).value || "").trim().toLowerCase(), list = $("#bl-list", ov); if (!list) return;
      const rows = users.filter((u) => !q || u.name.toLowerCase().includes(q)).slice(0, 60);
      list.innerHTML = rows.length ? rows.map((u) => `<button type="button" class="bl-user" data-to="${C.esc(u.id)}">${u.avatar ? `<img src="${C.esc(u.avatar)}" alt="" loading="lazy" data-fallback="avatar">` : `<i class="bl-av"></i>`}<span><b>${C.esc(u.name)}</b><small>${online.has(u.id) ? "● En ligne" : "Hors ligne : il verra l'invitation à son retour (2 min)"}</small></span></button>`).join("") : `<p class="tcg-hint">Aucun pilote trouvé.</p>`;
    };
    draw(); const q = $("#bl-q", ov); if (q) q.addEventListener("input", draw);
  }
  async function invite(to) {
    if (busy) return; busy = true;
    try { await window.MACards.load(); const r = await call("battleInvite", { to }); watch(r.id); }
    catch (e) { C.toast(e.message, "err"); }
    busy = false;
  }

  // ------------------------------------------------------------------ suivi en direct
  function stopWatch() { if (unsub) { unsub(); unsub = null; } if (timer) { clearInterval(timer); timer = null; } bt = null; bid = ""; hand = []; pick = -1; }
  function watch(id) {
    stopWatch(); bid = id; shell();
    unsub = C.db.collection("card_battles").doc(id).onSnapshot((s) => {
      if (!s.exists) { C.toast("Bataille introuvable.", "err"); close(); return; }
      const was = bt; bt = s.data();
      if (bt.status === "active" && !hand.length) loadHand().then(render); else { if (was && was.round !== bt.round) { pick = -1; holdUntil = Date.now() + 4500; setTimeout(() => { if (ov && bt) render(); }, 4600); } render(); }
    }, () => { C.toast("Connexion à la bataille impossible.", "err"); close(); });
    timer = setInterval(() => { if (bt && ov) tick(); }, 1000);
  }
  async function loadHand() {
    try { const s = await C.db.collection("card_battles").doc(bid).collection("hands").doc(C.user.uid).get(); hand = s.exists ? s.data().ids || [] : []; } catch (_) { hand = []; }
  }
  function tick() {
    const el = $("#bl-clock", ov);
    if (bt.status === "pending") {
      const left = bt.expiresAt - Date.now();
      if (el) el.textContent = fmtT(left);
      if (left <= 0) { call("battleClaim", { id: bid }).catch(() => {}); bt = Object.assign({}, bt, { status: "expired" }); render(); }
    } else if (bt.status === "active") {
      const left = bt.turnAt + 90000 - Date.now(), btn = $("[data-act=claim]", ov);
      if (left <= 0 && waitingForOpp() && !btn) render();
    }
  }
  const myTurn = () => bt.phase === "lead" ? bt.leader === side() : bt.phase === "reply" ? bt.leader !== side() : false;
  const waitingForOpp = () => bt.status === "active" && !myTurn();

  function render() {
    if (!ov || !bt) return;
    const box = $(".bl", ov), me = side(), foe = other(), nm = (s) => C.esc(bt.names[s]);
    if (bt.status === "pending") {
      if (bt.a === C.user.uid) box.innerHTML = `<h2>Invitation envoyée</h2><p class="tcg-hint">En attente de <b>${nm("b")}</b>… Elle a aussi été déposée dans votre conversation privée.</p><div class="bl-clock" id="bl-clock">${fmtT(bt.expiresAt - Date.now())}</div><div class="tcg-actions"><button type="button" class="cta-btn btn-ghost" data-bl="cancel">Annuler l'invitation</button></div>`;
      else box.innerHTML = `<h2>⚔️ ${nm("a")} te défie !</h2><p class="tcg-hint">Bataille de cartes en direct, sans récompense. Il te reste :</p><div class="bl-clock" id="bl-clock">${fmtT(bt.expiresAt - Date.now())}</div><div class="tcg-actions"><button type="button" class="cta-btn fill-btn" data-bl="accept">Accepter</button><button type="button" class="cta-btn btn-ghost" data-bl="decline">Refuser</button></div>`;
      return;
    }
    if (bt.status !== "active" && bt.status !== "done") {
      const why = { expired: "L'invitation a expiré (2 minutes).", declined: "L'invitation a été refusée.", cancelled: "L'invitation a été annulée." }[bt.status] || "Bataille terminée.";
      box.innerHTML = `<h2>Bataille</h2><p class="tcg-hint">${why}</p><div class="tcg-actions"><button type="button" class="cta-btn fill-btn" data-bl="close">Fermer</button></div>`; return;
    }
    const done = bt.status === "done", last = bt.last, UI = window.MABattleUI, total = bt.n;
    const mark = (w) => (w === me ? "w" : w ? "l" : "t"), hist = bt.hist || [], mk = (f) => hist.map(f).concat(Array(Math.max(0, total - hist.length)).fill(""));
    const holding = Date.now() < holdUntil, showLast = !!last && !(myTurn() && pick >= 0 && bt.phase === "lead") && (done || holding || bt.phase === "lead");   // résultat de la manche : les deux cartes se révèlent
    let myCard = "", foeCard = "";
    if (showLast) { myCard = card(last.ids[me]); foeCard = card(last.ids[foe]); }
    else if (bt.phase === "lead" && myTurn() && pick >= 0) myCard = card(hand[pick]);
    else if (bt.phase === "reply" && bt.leader === me && ledId) myCard = card(ledId);
    const myScore = bt.score[me], foeScore = bt.score[foe];
    const m = {
      ak: bt.round + "-" + bt.status + "-" + (showLast ? 1 : 0) + "-" + pick,
      me: { name: bt.names[me], score: myScore, pips: mk((w) => mark(w)) }, foe: { name: bt.names[foe], score: foeScore, pips: mk((w) => (w === me ? "l" : w ? "w" : "t")) },
      mid: done ? "Terminé" : "Manche " + Math.min(bt.round + 1, total) + " / " + total,
      turn: done ? "" : myTurn() ? "me" : "foe", myCard, foeCard, reveal: showLast,
      timer: done ? null : { start: bt.turnAt, dur: 90000 },
      emotes: { list: EMOTES.map((x) => [x[0], x[1]]) },
      note: "Mains équilibrées" + (bt.profile ? " : " + profileTxt(bt.profile) : "") + " · 90 s maximum par coup."
    };
    if (bt.emote && Date.now() - bt.emote.t < 3500) { const em = EMOTES.find((x) => x[0] === bt.emote.k); if (em) m.bubble = { side: bt.emote.s === me ? "me" : "foe", label: em[1], t: bt.emote.t }; }
    if (last && !showLast) { const win = last.winner, st1 = STATS.find((x) => x[0] === last.stat); m.recap = { cls: win === me ? "win" : win ? "lose" : "tie", text: "Manche " + (last.round + 1) + " : " + (win === me ? "gagnée" : win ? "perdue" : "égalité") + " · " + st1[1] + " " + last.vals[me] + " contre " + last.vals[foe] + " " + st1[2] }; }
    if (showLast) {
      const win = last.winner;
      m.cmp = STATS.map(([k, label, unit, dir]) => { const a = k === last.stat ? last.vals[me] : val(last.ids[me], k), b2 = k === last.stat ? last.vals[foe] : val(last.ids[foe], k), r = (a - b2) * dir; return { label, unit, my: a || "—", foe: b2 || "—", dir, hot: k === last.stat, win: r > 0 ? "me" : r < 0 ? "foe" : "tie" }; });
      if (!done) m.verdict = { cls: win === me ? "win" : win ? "lose" : "tie", text: (win === me ? "Manche gagnée" : win ? "Manche perdue" : "Égalité") + " · " + STATS.find((x) => x[0] === last.stat)[1] };
    }
    if (done) {
      const w = bt.winner, note = bt.why === "forfeit" ? " (forfait)" : bt.why === "timeout" ? " (temps écoulé)" : "", rw = bt.reward && bt.reward[me];
      const dust = window.MA && window.MA.dustIcon ? window.MA.dustIcon(18) : "";
      m.end = { cls: w === me ? "win" : w ? "lose" : "tie", title: w === me ? "Victoire !" : w ? "Défaite" : "Match nul", sub: myScore + " – " + foeScore + note,
        prize: rw && (rw.dust || rw.pack) ? (rw.dust ? `<span>+${rw.dust} ${dust} cristaux</span>` : "") + (rw.pack ? `<span>+1 pack bonus</span>` : "") : "" };
      if (rw && rw.capped) m.note = rw.capped === "pair" ? "Plafond atteint : 3 batailles récompensées par jour contre le même pilote." : "Plafond du jour atteint (120 cristaux par jour en bataille).";
      else if (!rw) m.note = "Pas de récompense pour une partie abandonnée.";
      m.actions = [{ a: "rematch", label: "Revanche", primary: true }, { a: "close", label: "Fermer" }];
      m.emotes = null;
    } else if (myTurn()) {
      m.banner = { main: "C'est à toi !", sub: bt.phase === "reply" ? "Réponds au défi sur la " + STATS.find((x) => x[0] === bt.lead.stat)[1].toLowerCase() : pick < 0 ? "Choisis la carte que tu joues" : "Choisis la caractéristique" };
      if (bt.phase === "lead" && pick >= 0) { m.stats = STATS.map(([k, label, unit]) => ({ k, label, unit, val: val(hand[pick], k) })); m.actions = [{ a: "unpick", label: "Changer de carte" }]; }
      else { m.hint = bt.phase === "reply" ? "Ton adversaire joue une carte secrète : vous la verrez toutes les deux au résultat." : "Ta carte reste cachée de l'adversaire jusqu'au résultat."; m.hand = handList(); }
    } else {
      m.banner = { main: "Tour de " + bt.names[foe], sub: bt.phase === "lead" ? "Il choisit sa carte…" : "Il choisit sa réponse…" };
      m.hand = handList(); m.handOff = true;
    }
    if (!done && waitingForOpp() && Date.now() - bt.turnAt > 90000) m.actions = (m.actions || []).concat([{ a: "claim", label: "Il ne joue plus : réclamer la victoire", primary: true }]);
    UI.render(box, m);
  }
  const EMOTES = [["gg", "GG 🤝"], ["bravo", "👏 Bravo"], ["wow", "😮 Wow"], ["oups", "😅 Oups"], ["feu", "🔥"]];
  const RL = { common: "commune", rare: "rare", epic: "épique", legendary: "légendaire", shiny: "shiny", mythic: "légende", special: "édition limitée" };
  const profileTxt = (p) => { const c = {}; p.forEach((r) => { c[r] = (c[r] || 0) + 1; }); return Object.keys(c).map((r) => c[r] + " " + (RL[r] || r) + (c[r] > 1 && r !== "legendary" && !/s$/.test(RL[r] || "") ? "s" : "")).join(", "); };
  const handList = () => hand.map((id, i) => { const c = carOf(id); return { i, html: card(id), used: (bt.used && bt.used[side()] || []).indexOf(i) >= 0, sel: pick === i, label: c ? c.brand + " " + c.model : id }; });

  async function onClick(e) {
    const b = e.target.closest("[data-bl],[data-act]"), h = e.target.closest("[data-h]"), s = e.target.closest("[data-stat]"), u = e.target.closest("[data-to]"), em = e.target.closest("[data-em]");
    if (e.target === ov) { leave(); return; }
    try {
      if (u) { invite(u.dataset.to); return; }
      if (em) { if (!busy) call("battleEmote", { id: bid, e: em.dataset.em }).catch(() => {}); return; }
      if (b) {
        const a = b.dataset.bl || b.dataset.act;
        if (a === "rematch") { const to = bt.a === C.user.uid ? bt.b : bt.a; await invite(to); return; }
        if (a === "close") close();
        else if (a === "ai") { close(); aiOpen(); }
        else if (a === "players") { await window.MACards.load().catch(() => {}); players(); }
        else if (a === "back") chooser();
        else if (a === "cancel") { call("battleCancel", { id: bid }).catch(() => {}); close(); }
        else if (a === "accept") { await window.MACards.load().catch(() => {}); await call("battleRespond", { id: bid, accept: true }); }
        else if (a === "decline") { await call("battleRespond", { id: bid, accept: false }).catch(() => {}); close(); }
        else if (a === "unpick") { pick = -1; render(); }
        else if (a === "claim") await call("battleClaim", { id: bid });
        return;
      }
      if (!bt || bt.status !== "active" || !myTurn()) return;
      if (h) {
        const i = Number(h.dataset.h); if ((bt.used[side()] || []).indexOf(i) >= 0 || busy) return;
        if (bt.phase === "lead") { pick = i; render(); }
        else { busy = true; try { ledId = ""; await call("battlePlay", { id: bid, idx: i }); } finally { busy = false; } }
      } else if (s && pick >= 0 && bt.phase === "lead" && !busy) {
        busy = true; try { const i = pick; ledId = hand[i]; pick = -1; await call("battlePlay", { id: bid, idx: i, stat: s.dataset.stat }); } finally { busy = false; }
      }
    } catch (err) { busy = false; C.toast(err.message, "err"); }
  }
  let aiOpen = () => {};

  // ------------------------------------------------------------------ notification volante (toute l'application)
  function hideToast() { clearTimeout(toastTimer); if (toastEl) { const t = toastEl; toastEl = null; t.classList.remove("on"); setTimeout(() => t.remove(), 250); } toastId = ""; }
  function showToast(id, b) {
    if (!alertOn() || (ov && bid === id)) return;
    if (toastEl && toastId === id) return;
    hideToast(); toastId = id;
    const el = document.createElement("div"); el.className = "bl-toast"; el.setAttribute("role", "alertdialog"); el.setAttribute("aria-label", "Invitation à une bataille");
    el.innerHTML = `<div class="bl-toast-t"><b>⚔️ ${C.esc(b.names.a)} te défie !</b><small>Bataille de cartes · <span class="bl-toast-c"></span></small></div>
      <div class="bl-toast-a"><button type="button" class="cta-btn fill-btn compact-btn" data-bt-do="accept">Accepter</button><button type="button" class="cta-btn btn-ghost compact-btn" data-bt-do="decline">Refuser</button></div>
      <button type="button" class="bl-toast-x" data-bt-do="mute" title="Ne plus afficher ces alertes">Ne plus afficher</button>`;
    document.body.appendChild(el); toastEl = el; requestAnimationFrame(() => el.classList.add("on"));
    const c = $(".bl-toast-c", el), upd = () => { const left = b.expiresAt - Date.now(); if (left <= 0) { hideToast(); return; } c.textContent = fmtT(left); toastTimer = setTimeout(upd, 1000); };
    upd();
    el.addEventListener("click", async (e) => {
      const d = e.target.closest("[data-bt-do]"); if (!d) return;
      const a = d.dataset.btDo;
      if (a === "mute") { setAlert(false); C.toast("Alertes de bataille désactivées (réactivables dans Réglages → Notifications).", "ok"); return; }
      hideToast();
      if (a === "accept") { try { await window.MACards.load().catch(() => {}); await call("battleRespond", { id, accept: true }); watch(id); } catch (err) { C.toast(err.message, "err"); } }
      else call("battleRespond", { id, accept: false }).catch(() => {});
    });
  }
  function watchIncoming() {
    if (incUnsub) { incUnsub(); incUnsub = null; } hideToast();
    if (!C.user) return;
    incUnsub = C.db.collection("card_battles").where("b", "==", C.user.uid).where("status", "==", "pending").onSnapshot((snap) => {
      const live = snap.docs.filter((d) => d.data().expiresAt > Date.now()).sort((x, y) => y.data().createdAt - x.data().createdAt)[0];
      if (live) showToast(live.id, live.data()); else hideToast();
    }, () => { /* règles non publiées : pas d'alerte */ });
  }

  function openFromLink() {
    let id = ""; try { id = new URLSearchParams(location.search).get("bataille") || ""; } catch (_) { /* ignoré */ }
    if (!id || !C.user) return;
    try { const u = new URL(location.href); u.searchParams.delete("bataille"); history.replaceState(null, "", u.pathname + u.search + u.hash); } catch (_) { /* ignoré */ }
    window.MACards.load().catch(() => {}).then(() => watch(id));
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    if (window.MABattle) { aiOpen = window.MABattle.open; window.MABattle.open = chooser; }
    document.addEventListener("ma:auth", () => { setTimeout(() => { watchIncoming(); openFromLink(); }, 900); });
    if (C.user) { watchIncoming(); openFromLink(); }
  });
  window.MABattleLive = { _test: { setDb: (d) => { C = Object.create(C, { db: { value: d } }); } }, alertOn, setAlert, open: chooser, watch: (id) => { shell(); watch(id); } };
})();
