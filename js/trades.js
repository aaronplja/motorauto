/**
 * MOTORAUTO — échanges de cartes entre pilotes (onglet Jouer › Échanges).
 * On n'échange que des DOUBLONS : « je te donne ma carte A (que j'ai en double) contre ta carte B (que tu as en double) ».
 * Les propositions, acceptations et déplacements de cartes passent par le serveur ; chaque proposition envoie aussi un message privé.
 *   trades/{id}  { fromUid, fromName, toUid, toName, give, want, message, status: open|accepted|declined|cancelled, createdAt, updatedAt }
 */
(function () {
  "use strict";
  let C = null, others = [], trades = [], users = new Map(), loadedAt = 0, prefillGive = "", openRow = "", picks = {}, busy = false, error = "";
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);
  const card = (id) => window.MACards.cardObj(id);
  const mini = (id, extra) => { const c = card(id); return c ? window.MACards.cardHtml(c, { cls: "tcg-mini " + (extra || "") }) : `<span class="wish-chip">carte retirée</span>`; };
  const name = (id) => { const c = card(id); return c ? String(c.model).replace(/\s*\(.*$/, "") : id; };
  const dm = (uid) => "chat.html#dm/" + encodeURIComponent(uid);

  async function load(force) {
    if (!C.user) return;
    if (!force && Date.now() - loadedAt < 20000) return;
    error = "";
    const uid = C.user.uid;
    await Promise.all([window.MACards.load(), window.MACards.loadSpecials()]);
    const q = (f) => C.db.collection("trades").where(f, "==", uid).limit(60).get().then((s) => s.docs.map((d) => Object.assign({ id: d.id }, d.data())));
    const [a, b, us, cols, wishes] = await Promise.all([
      q("toUid").catch((e) => { error = "Échanges indisponibles (règles Firestore à publier ?)."; return []; }), q("fromUid").catch(() => []),
      C.db.collection("users").limit(400).get(), C.db.collection("collections").limit(400).get().catch(() => null), C.db.collection("wishlists").limit(400).get().catch(() => null)
    ]);
    trades = a.concat(b).sort((x, y) => tsMs(y.updatedAt) - tsMs(x.updatedAt));
    users = new Map(); us.forEach((d) => users.set(d.id, d.data()));
    const wl = new Map(); if (wishes) wishes.forEach((d) => wl.set(d.id, (d.data().ids || [])));
    others = [];
    if (cols) cols.forEach((d) => {
      if (d.id === uid || !users.has(d.id)) return;
      const owned = d.data().owned || {}, dups = Object.keys(owned).filter((k) => owned[k] > 1 && card(k));
      others.push({ uid: d.id, dups, wish: (wl.get(d.id) || []).filter((k) => card(k)) });
    });
    loadedAt = Date.now();
  }

  /** ce que je peux proposer à un pilote : mes doublons ↔ ses doublons que je n'ai pas */
  function matchFor(o) {
    const me = window.MACards.mine() || { owned: {} }, myWish = new Set(window.MACards.myWish());
    const myDups = Object.keys(me.owned).filter((k) => me.owned[k] > 1 && card(k));
    const give = myDups, want = o.dups.filter((k) => !(me.owned[k] > 0));
    const theyWantMine = give.filter((k) => o.wish.includes(k)), iWantTheirs = want.filter((k) => myWish.has(k));
    return { give, want, theyWantMine, iWantTheirs, score: (theyWantMine.length ? 2 : 0) + (iWantTheirs.length ? 2 : 0) + (give.length && want.length ? 1 : 0) };
  }

  const who = (uid) => { const u = users.get(uid) || {}; return u.username || "Pilote"; };
  /** pastille « tu l'as déjà » pour la carte que je recevrais */
  const own = (id, receiving) => { if (!receiving) return ""; const n = ((window.MACards.mine() || { owned: {} }).owned || {})[id] || 0; return n > 0 ? `<span class="own-badge">Tu l'as déjà ×${n}</span>` : `<span class="own-badge new">Nouvelle pour toi</span>`; };
  function tradeRow(t) {
    const esc = C.esc, mineSent = t.fromUid === C.user.uid, other = mineSent ? t.toUid : t.fromUid;
    const st = { open: "En attente", accepted: "Échange réalisé", declined: "Refusée", cancelled: "Annulée" }[t.status] || t.status;
    const actions = t.status === "open" ? (mineSent
      ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-trade-cancel="${esc(t.id)}">Annuler</button>`
      : `<button type="button" class="cta-btn fill-btn compact-btn" data-trade-yes="${esc(t.id)}">Accepter</button><button type="button" class="cta-btn btn-ghost compact-btn" data-trade-no="${esc(t.id)}">Décliner</button>`) : "";
    return `<article class="trade-row ${t.status}"><div class="trade-head"><b>${esc(mineSent ? "Pour " + (t.toName || who(other)) : "De " + (t.fromName || who(other)))}</b><span class="trade-st ${t.status}">${st}</span></div>
      <div class="trade-swap"><div><small>${mineSent ? "Tu donnes" : "Il te donne"}</small>${mini(t.give)}${own(t.give, !mineSent)}</div><i aria-hidden="true">⇄</i><div><small>${mineSent ? "Tu reçois" : "Tu donnes"}</small>${mini(t.want)}${own(t.want, mineSent)}</div></div>
      ${t.message ? `<p class="trade-msg">« ${esc(t.message)} »</p>` : ""}<div class="trade-actions">${actions}<a class="cta-btn btn-ghost compact-btn" href="${dm(other)}">💬 Discuter</a></div></article>`;
  }

  function composer(o, m) {
    const p = picks[o.uid] || {}, esc = C.esc;
    const pick = (kind, ids, chosen) => `<div class="pick-row" role="radiogroup" aria-label="${kind === "give" ? "Carte que tu donnes" : "Carte que tu reçois"}">${ids.map((id) => `<button type="button" class="pick ${chosen === id ? "on" : ""}" role="radio" aria-checked="${chosen === id}" data-pick="${kind}" data-id="${esc(id)}" data-uid="${esc(o.uid)}">${mini(id)}</button>`).join("")}</div>`;
    const give = p.give || (m.theyWantMine[0] || (prefillGive && m.give.includes(prefillGive) ? prefillGive : "")), want = p.want || (m.iWantTheirs[0] || "");
    return `<div class="trade-composer"><div class="comp-col"><h4>Tu donnes <small>(un de tes doublons)</small></h4>${m.give.length ? pick("give", m.give, give) : `<p class="lap-meta">Tu n'as aucun doublon : ouvre des packs !</p>`}</div>
      <div class="comp-col"><h4>Tu reçois <small>(un de ses doublons)</small></h4>${m.want.length ? pick("want", m.want, want) : `<p class="lap-meta">Il n'a aucun doublon qui te manque.</p>`}</div>
      <div class="comp-send"><input type="text" maxlength="140" placeholder="Un petit mot (facultatif)" aria-label="Message" data-trade-msg="${esc(o.uid)}"><button type="button" class="cta-btn fill-btn" data-trade-send="${esc(o.uid)}" ${give && want ? "" : "disabled"}>Envoyer la proposition</button></div></div>`;
  }
  function pilotRow(o, m) {
    const esc = C.esc, u = users.get(o.uid) || {}, open = openRow === o.uid;
    const tags = [m.theyWantMine.length ? `<span class="match-tag">⭐ cherche ta ${esc(name(m.theyWantMine[0]))}</span>` : "", m.iWantTheirs.length ? `<span class="match-tag me">⭐ a ta ${esc(name(m.iWantTheirs[0]))}</span>` : ""].join("");
    return `<article class="pilot-trade ${open ? "open" : ""}"><button type="button" class="pt-head" data-trade-open="${esc(o.uid)}" aria-expanded="${open}">${C.avatarImg(u.avatar, "pilot-row-avatar")}<span class="pt-main"><b>${esc(u.username || "Pilote")}</b><small>${m.want.length} doublon${m.want.length > 1 ? "s" : ""} pour toi · ${m.give.length} de ton côté</small>${tags}</span><span class="pt-go" aria-hidden="true">${open ? "−" : "+"}</span></button>${open ? composer(o, m) : ""}</article>`;
  }

  function render() {
    const root = document.getElementById("trades-root"); if (!root) return;
    if (!C.user) { root.innerHTML = `<div class="empty-note">Connecte-toi pour échanger tes doublons avec les autres pilotes.<br><button type="button" class="cta-btn fill-btn mt" data-action="open-auth">Me connecter</button></div>`; return; }
    if (!loadedAt) { root.innerHTML = `<div class="tcg-skeleton" aria-busy="true"><i></i><i></i><i></i></div>`; return; }
    const me = window.MACards.mine() || { owned: {} }, myDups = Object.keys(me.owned).filter((k) => me.owned[k] > 1).length;
    const incoming = trades.filter((t) => t.toUid === C.user.uid && t.status === "open"), sent = trades.filter((t) => t.fromUid === C.user.uid && t.status === "open");
    const done = trades.filter((t) => t.status !== "open").slice(0, 8);
    const withDups = others.filter((o) => o.dups.length), lackable = withDups.filter((o) => matchFor(o).want.length);
    const whyNone = [];
    if (!myDups) whyNone.push("Tu n'as encore <b>aucun doublon</b> : ouvre des packs, un doublon est une carte que tu possèdes en 2 exemplaires.");
    if (!others.length) whyNone.push("Aucun autre pilote n'a encore de collection de cartes.");
    else if (!withDups.length) whyNone.push("Aucun autre pilote n'a de <b>doublon</b> pour l'instant (" + others.length + " pilote" + (others.length > 1 ? "s" : "") + " ont des cartes).");
    else if (!lackable.length) whyNone.push("Les doublons des autres pilotes sont des cartes que tu possèdes déjà.");
    if (myDups && lackable.length) whyNone.push("Il y a des pilotes avec des doublons qui te manquent, mais il faut aussi un de <b>tes</b> doublons à leur donner.");
    const rows = others.map((o) => ({ o, m: matchFor(o) })).filter((x) => x.m.give.length && x.m.want.length).sort((a, b) => b.m.score - a.m.score).slice(0, 30);
    root.innerHTML = `${error ? `<p class="tcg-alert">⚠ ${C.esc(error)}</p>` : ""}
      <p class="sec-lead">On n'échange que des <b>doublons</b> : tu donnes un exemplaire en trop contre un exemplaire en trop d'un autre pilote. Tu as <b>${myDups}</b> doublon${myDups > 1 ? "s" : ""}.${prefillGive ? ` Tu proposes : <b>${C.esc(name(prefillGive))}</b>.` : ""}</p>
      ${incoming.length ? `<h3 class="sec-title">Propositions reçues <span class="count-pill">${incoming.length}</span></h3><div class="trade-list">${incoming.map(tradeRow).join("")}</div>` : ""}
      ${sent.length ? `<h3 class="sec-title">Mes propositions en attente</h3><div class="trade-list">${sent.map(tradeRow).join("")}</div>` : ""}
      <h3 class="sec-title">Échanges possibles</h3>
      ${rows.length ? `<div class="pilot-trades">${rows.map((x) => pilotRow(x.o, x.m)).join("")}</div>` : `<div class="empty-note">Aucun échange possible pour l'instant.<ul class="trade-why">${whyNone.map((x) => `<li>${x}</li>`).join("")}</ul>Ajoute des cartes à ta <a href="#/jouer/cartes">wishlist</a> pour que les autres sachent quoi te proposer !</div>`}
      ${done.length ? `<h3 class="sec-title">Historique</h3><div class="trade-list compact">${done.map(tradeRow).join("")}</div>` : ""}`;
  }

  async function act(fn, okMsg) {
    if (busy) return; busy = true;
    try { const r = await fn(); if (okMsg) C.toast(typeof okMsg === "function" ? okMsg(r) : okMsg, "ok"); }
    catch (e) { C.toast(e.message, "err"); }
    finally { busy = false; }
    try { await window.MACards.load(true); await load(true); } catch (_) { /* ignoré */ }
    render();
  }

  window.MATrades = { prefill: (id) => { prefillGive = id; loadedAt = 0; } };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("play", { enter: async (p) => {
      if (p.tab !== "echanges") return;
      render();
      try { await load(); } catch (e) { error = "Échanges indisponibles : " + e.message; loadedAt = Date.now(); }
      render();
    } });
    document.addEventListener("ma:auth", () => { loadedAt = 0; trades = []; others = []; if (ctx.Router.is("play", { tab: "echanges" })) { render(); load(true).then(render).catch(() => {}); } });
    document.addEventListener("click", (e) => {
      const t = e.target;
      const op = t.closest("[data-trade-open]"); if (op) { openRow = openRow === op.dataset.tradeOpen ? "" : op.dataset.tradeOpen; render(); return; }
      const pk = t.closest("[data-pick]"); if (pk) { const u = pk.dataset.uid; picks[u] = Object.assign(picks[u] || {}, { [pk.dataset.pick]: pk.dataset.id }); const msg = document.querySelector(`[data-trade-msg="${CSS.escape(u)}"]`), v = msg ? msg.value : ""; render(); const m2 = document.querySelector(`[data-trade-msg="${CSS.escape(u)}"]`); if (m2) m2.value = v; return; }
      const sd = t.closest("[data-trade-send]");
      if (sd) {
        const uid = sd.dataset.tradeSend, o = others.find((x) => x.uid === uid), m = matchFor(o), p = picks[uid] || {};
        const give = p.give || m.theyWantMine[0] || (prefillGive && m.give.includes(prefillGive) ? prefillGive : ""), want = p.want || m.iWantTheirs[0] || "";
        const msg = (document.querySelector(`[data-trade-msg="${CSS.escape(uid)}"]`) || {}).value || "";
        if (!give || !want) { C.toast("Choisis la carte que tu donnes et celle que tu reçois.", "err"); return; }
        act(() => window.MAGameAPI.call("proposeTrade", { toUid: uid, give, want, message: msg }).then((r) => { openRow = ""; delete picks[uid]; prefillGive = ""; return r; }), "Proposition envoyée 📨 (un message privé a été envoyé).");
        return;
      }
      const y = t.closest("[data-trade-yes]"); if (y) { act(() => window.MAGameAPI.call("respondTrade", { id: y.dataset.tradeYes, accept: true }).then((r) => { if (!r.ok) throw new Error(r.message); return r; }), "Échange réalisé 🎉 Les cartes sont dans ta collection."); return; }
      const n = t.closest("[data-trade-no]"); if (n) { act(() => window.MAGameAPI.call("respondTrade", { id: n.dataset.tradeNo, accept: false }), "Proposition déclinée."); return; }
      const c = t.closest("[data-trade-cancel]"); if (c) { act(() => window.MAGameAPI.call("cancelTrade", { id: c.dataset.tradeCancel }), "Proposition annulée."); return; }
      const tw = t.closest("[data-trade-with]"); if (tw) { openRow = tw.dataset.tradeWith; loadedAt = 0; }
    });
  });
})();
