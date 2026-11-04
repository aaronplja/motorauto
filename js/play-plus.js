/**
 * MOTORAUTO — Jeu : fusion de cartes, marché de cartes entre pilotes, fil « je cherche / je propose ».
 *   #/fusion   5 doublons d'une rareté → 1 carte de la rareté au-dessus (animation) — fuseCards
 *   #/marche   vente et achat de doublons contre des cristaux, 10 % de commission détruits — marketList / marketBuy / marketCancel
 *   #/souhaits cartes recherchées et doublons proposés par les pilotes, avec les correspondances avec ta collection
 * Les cartes ne bougent que côté serveur (Cloud Functions) ; cet écran ne fait que les demander.
 */
(function () {
  "use strict";
  const G = window.MAGameCore, MC = () => window.MACards;
  let C = null;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);
  const dust = (n, px) => `${window.MA.dustIcon(px || 14)} <b>${n}</b>`;
  const loginNote = (what) => `<div class="empty-note">${T("Connecte-toi pour")} ${what}.<br><button type="button" class="cta-btn fill-btn mt" data-action="open-auth">${T("Me connecter")}</button></div>`;
  const rootOf = (n) => document.getElementById(n + "-root");
  const cardOf = (id) => MC().cardObj(id);
  const rarOf = (id) => { const c = cardOf(id); return c ? MC().rarityOf(c) : "common"; };
  const mini = (id, extra) => { const c = cardOf(id); return c ? MC().cardHtml(c, { cls: "tcg-mini " + (extra || "") }) : `<span class="wish-chip">${T("carte retirée")}</span>`; };
  const label = (id) => { const c = cardOf(id); return c ? String(c.model || id).replace(/\s*\(.*$/, "") : id; };
  async function ready() { try { await MC().loadRarOv(); } catch (_) { /* surcharge facultative */ } return MC().load(); }
  function spareMap(doc) {
    const out = {};
    Object.keys(doc.owned || {}).forEach((id) => { const q = doc.owned[id] || 0; if (q > 1 && !G.isSpecial(id) && cardOf(id)) out[id] = q - 1; });
    return out;
  }

  // ====================================================================== FUSION
  const FZ_ORDER = ["common", "rare", "epic"];
  let fz = { doc: null, r: "", ids: [], busy: false };
  function fzDups(doc, r) {
    const sp = spareMap(doc);
    return Object.keys(sp).filter((id) => rarOf(id) === r).map((id) => ({ id, spare: sp[id] })).sort((a, b) => b.spare - a.spare || (a.id < b.id ? -1 : 1));
  }
  function fzRender() {
    const root = rootOf("fusion"); if (!root) return;
    if (!C.user) { root.innerHTML = loginNote(T("fusionner tes doublons")); return; }
    if (!fz.doc) { root.innerHTML = `<div class="tcg-skeleton" aria-busy="true"><i></i><i></i><i></i></div>`; return; }
    const RAR = MC().RAR;
    root.innerHTML = `<div class="fz-intro"><p>${T("Rassemble")} <b>${G.FUSE_COUNT}</b> ${T("doublons de la même rareté : ils fusionnent en une carte de la rareté supérieure, tirée au hasard (une carte que tu n'as pas encore en priorité).")}</p>
      <p class="lap-meta">${T("Tu gardes toujours un exemplaire de chaque carte. Les raretés Shiny et Légende ne se fusionnent pas : elles se gagnent en packs et en albums.")}</p></div>` +
      FZ_ORDER.map((r) => {
        const dups = fzDups(fz.doc, r), total = dups.reduce((t, d) => t + d.spare, 0), mine = fz.r === r ? fz.ids : [];
        const next = G.FUSE_NEXT[r], can = total >= G.FUSE_COUNT, picked = mine.length;
        const btnLabel = picked === G.FUSE_COUNT ? T("Fusionner la sélection") : picked ? `${picked} / ${G.FUSE_COUNT}` : T("Fusionner automatiquement");
        return `<section class="cg-block fz-block rar-${r}" data-r="${r}"><header class="cg-bh"><h3>${RAR[r].label} <span class="fz-arrow">→</span> ${RAR[next].label}</h3><span class="cg-sub">${total} ${T(total > 1 ? "doublons" : "doublon")} · ${T("il en faut")} ${G.FUSE_COUNT}</span></header>
          ${dups.length ? `<div class="fz-grid">${dups.map((d) => { const n = mine.filter((x) => x === d.id).length; return `<button type="button" class="fz-pick${n ? " on" : ""}" data-fz-pick="${C.esc(d.id)}" data-r="${r}" aria-pressed="${n ? "true" : "false"}" aria-label="${C.esc(label(d.id))}">${mini(d.id)}<span class="fz-x">×${d.spare}</span>${n ? `<span class="fz-sel">${n}</span>` : ""}</button>`; }).join("")}</div>` : `<p class="empty-note small">${T("Aucun doublon de cette rareté pour l'instant.")}</p>`}
          <div class="fz-actions"><button type="button" class="cta-btn fill-btn" data-fz-go="${r}" ${can && !fz.busy && (!picked || picked === G.FUSE_COUNT) ? "" : "disabled"}>${btnLabel}</button>${picked ? `<button type="button" class="cta-btn btn-ghost" data-fz-reset>${T("Vider la sélection")}</button>` : ""}</div></section>`;
      }).join("");
  }
  function fzOverlay(res, usedIds) {
    return new Promise((resolve) => {
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ov = document.createElement("div"); ov.className = "fz-overlay"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", T("Résultat de la fusion"));
      const RAR = MC().RAR, r = rarOf(res.got);
      ov.innerHTML = `<div class="fz-stage"><div class="fz-ring">${usedIds.map((id, i) => `<span class="fz-fly" style="--a:${i * 72}deg">${mini(id)}</span>`).join("")}</div><i class="fz-flash"></i>
        <div class="fz-result rar-${r}" hidden>${mini(res.got, "big")}<h3>${res.isNew ? T("Nouvelle carte !") : T("Un doublon de plus…")}</h3><p>${C.esc(label(res.got))} · ${RAR[r].label}</p><button type="button" class="cta-btn fill-btn" data-fz-close>${T("Continuer")}</button></div></div>`;
      document.body.appendChild(ov);
      const show = () => { ov.classList.add("done"); const rs = ov.querySelector(".fz-result"); rs.hidden = false; const b = ov.querySelector("[data-fz-close]"); if (b) b.focus(); };
      const close = () => { document.removeEventListener("keydown", esc); ov.remove(); resolve(); };
      const esc = (e) => { if (e.key === "Escape") close(); };
      document.addEventListener("keydown", esc);
      ov.addEventListener("click", (e) => { if (e.target.closest("[data-fz-close]") || (e.target === ov && ov.classList.contains("done"))) close(); });
      if (reduce) show(); else { requestAnimationFrame(() => ov.classList.add("go")); setTimeout(show, 1300); }
    });
  }
  async function fzGo(r) {
    if (fz.busy) return;
    const used = fz.r === r && fz.ids.length === G.FUSE_COUNT ? fz.ids.slice() : null;
    fz.busy = true; fzRender();
    try {
      const res = await window.MAGameAPI.call("fuseCards", used ? { rarity: r, ids: used } : { rarity: r });
      MC().applyDoc(res.doc); fz.doc = MC().mine() || res.doc; fz.ids = []; fz.r = "";
      document.dispatchEvent(new CustomEvent("ma:cards"));
      fz.busy = false; fzRender();
      await fzOverlay(res, res.used || []);
    } catch (e) { C.toast(e.message || T("Fusion impossible."), "err"); fz.busy = false; fzRender(); }
  }
  function fzEnter() {
    if (!C.user) { fzRender(); return; }
    fz.ids = []; fz.r = ""; fzRender();
    ready().then((d) => { fz.doc = d || MC().mine(); fzRender(); }).catch((e) => { const root = rootOf("fusion"); if (root) root.innerHTML = `<div class="empty-note error">${C.esc(e.message || "")}</div>`; });
  }

  // ====================================================================== MARCHÉ
  let mk = { confirm: "", tab: "buy", list: [], mine: [], doc: null, sell: "", rar: "all", sort: "new", q: "", busy: false, err: "" };
  async function mkLoad() {
    try {
      const snap = await C.db.collection("card_listings").where("status", "==", "open").limit(250).get();
      mk.list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((l) => cardOf(l.cardId)).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
      if (C.user) { const m = await C.db.collection("card_listings").where("uid", "==", C.user.uid).limit(80).get(); mk.mine = m.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)); }
      mk.err = "";
    } catch (e) { mk.err = T("Le marché n'est pas encore disponible (règles Firestore à publier)."); }
  }
  const MK_COL = { common: "#94a3b8", rare: "#3b82f6", epic: "#a855f7", legendary: "#f59e0b", shiny: "#22d3ee", legend: "#ef4444", mythic: "#ec4899" };
  const EMPTY = (svg, title, sub) => `<div class="mkt-empty"><svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</div>`;
  const ICO_SHOP = '<path d="M8 24h48l-4 30H12z"/><path d="M22 24v-6a10 10 0 0 1 20 0v6"/>', ICO_TAG = '<path d="M8 8h24l24 24-20 20L8 28z"/><circle cx="20" cy="20" r="3"/>', ICO_CARD = '<rect x="14" y="8" width="36" height="48" rx="6"/><path d="M22 22h20M22 32h20M22 42h10"/>';
  /** une annonce = une vraie carte, son prix en grand, un seul bouton */
  function mkItem(l) {
    const R = MC().RAR[l.rar] || MC().RAR.common, own = C.user && C.user.uid === l.uid, can = C.user && mk.doc && mk.doc.dust >= l.price, sure = mk.confirm === l.id;
    const btn = own ? `<button type="button" class="cta-btn btn-ghost mkt-btn" data-mk-cancel="${C.esc(l.id)}" ${mk.busy ? "disabled" : ""}>${T("Retirer")}</button>`
      : `<button type="button" class="cta-btn ${sure ? "mkt-sure" : "fill-btn"} mkt-btn${C.user && !can ? " lack" : ""}" data-mk-buy="${C.esc(l.id)}" ${!C.user || !can || mk.busy ? "disabled" : ""}>${C.user && !can ? T("Pas assez") : sure ? T("Confirmer") + " · " + l.price : T("Acheter")}</button>`;
    return `<article class="mkt-card${own ? " own" : ""}" style="--mk:${MK_COL[l.rar] || MK_COL.common}">
      <div class="mkt-art">${mini(l.cardId)}</div>
      <div class="mkt-body"><span class="mkt-rar">${R.label}</span><b class="mkt-name">${C.esc(label(l.cardId))}</b>
        <small class="mkt-seller">${own ? T("ton annonce") : `${T("par")} <a href="#/pilote/${encodeURIComponent(l.uid)}">${C.esc(l.name || T("Pilote"))}</a>`}</small>
        <div class="mkt-price">${dust(l.price, 20)}</div>${btn}</div></article>`;
  }
  function mkRender() {
    const root = rootOf("cardmarket"); if (!root) return;
    const RAR = MC().RAR, seg = [["buy", T("Acheter")], ["sell", T("Vendre")], ["mine", T("Mes annonces")]];
    const openMine = mk.mine.filter((l) => l.status === "open").length, soldMine = mk.mine.filter((l) => l.status === "sold").length;
    const head = `<section class="mkt-hero"><div class="mkt-stats">
        <div class="mkt-stat main"><small>${T("Tes cristaux")}</small><span>${C.user && mk.doc ? dust(mk.doc.dust, 26) : "—"}</span></div>
        <div class="mkt-stat"><small>${T("En vente")}</small><b>${mk.list.length}</b></div>
        <div class="mkt-stat"><small>${T("Mes annonces")}</small><b>${openMine}<i>/${G.MARKET_MAX_LISTINGS}</i></b></div></div>
      <p class="mkt-note">${T("Prix fixe en cristaux. Seuls les doublons se vendent ; la carte est mise de côté jusqu'à la vente. 10 % du prix disparaissent (commission), le reste va au vendeur.")}</p></section>
      <div class="page-tabs fit mkt-tabs" role="tablist" aria-label="${T("Marché")}" style="--n:3">${seg.map(([k, l]) => `<button type="button" role="tab" class="page-tab${mk.tab === k ? " active" : ""}" data-mk-tab="${k}" aria-selected="${mk.tab === k}"><span class="tl" data-s="${l}">${l}</span></button>`).join("")}</div>`;
    let body = "";
    if (mk.err) body = `<div class="empty-note error">${C.esc(mk.err)}</div>`;
    else if (mk.tab === "buy") {
      let items = mk.list.filter((l) => (mk.rar === "all" || l.rar === mk.rar) && (!mk.q || (label(l.cardId) + " " + (cardOf(l.cardId).brand || "")).toLowerCase().includes(mk.q.toLowerCase())));
      items = items.sort(mk.sort === "price" ? (a, b) => a.price - b.price : mk.sort === "rar" ? (a, b) => G.ORDER.indexOf(a.rar) - G.ORDER.indexOf(b.rar) || a.price - b.price : (a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
      const chips = [["all", T("Toutes raretés")]].concat(G.ORDER.filter((r) => r !== "mythic").map((r) => [r, RAR[r].label]));
      body = `<div class="mkt-tools"><input type="search" id="mk-q" placeholder="${T("Rechercher une carte…")}" value="${C.esc(mk.q)}" aria-label="${T("Rechercher une carte")}" autocomplete="off">
        <select id="mk-sort" aria-label="${T("Trier par")}">${[["new", T("Plus récentes")], ["price", T("Prix croissant")], ["rar", T("Rareté")]].map(([k, l]) => `<option value="${k}" ${mk.sort === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="mkt-chips" role="group" aria-label="${T("Rareté")}">${chips.map(([k, l]) => `<button type="button" class="mkt-chip${mk.rar === k ? " on" : ""}" data-mk-rar="${k}" style="--mk:${MK_COL[k] || "var(--accent)"}">${l}</button>`).join("")}</div>
        ${items.length ? `<div class="mkt-grid">${items.map(mkItem).join("")}</div>` : EMPTY(ICO_SHOP, T("Aucune carte en vente pour ces critères."), "")}`;
    } else if (!C.user) body = loginNote(T("vendre tes cartes"));
    else if (mk.tab === "sell") {
      const sp = mk.doc ? spareMap(mk.doc) : {}, ids = Object.keys(sp).filter((id) => rarOf(id) !== "mythic").sort((a, b) => G.ORDER.indexOf(rarOf(a)) - G.ORDER.indexOf(rarOf(b)));
      const sel = mk.sell && sp[mk.sell] ? mk.sell : "";
      let form = "";
      if (sel) { const r = rarOf(sel), b = G.marketBounds(r), sug = Math.min(b.max, Math.max(b.min, Math.round(MC().RAR[r].craft * 0.5)));
        form = `<form class="mkt-sell" data-mk-form style="--mk:${MK_COL[r] || MK_COL.common}"><div class="mkt-sell-art">${mini(sel)}</div>
          <div class="mkt-sell-f"><span class="mkt-rar">${MC().RAR[r].label}</span><b class="mkt-name">${C.esc(label(sel))}</b>
            <label for="mk-price">${T("Prix en cristaux")} <small>(${b.min} – ${b.max})</small></label>
            <input id="mk-range" type="range" min="${b.min}" max="${b.max}" step="1" value="${sug}" aria-label="${T("Prix en cristaux")}">
            <div class="mk-row"><input id="mk-price" type="number" min="${b.min}" max="${b.max}" step="1" value="${sug}" inputmode="numeric" required><button type="submit" class="cta-btn fill-btn" ${mk.busy ? "disabled" : ""}>${T("Mettre en vente")}</button></div>
            <small class="mk-hint" id="mk-hint">${T("Tu recevras")} <b>${G.marketNet(sug)}</b> ${T("cristaux")}.</small></div></form>`; }
      body = (form || "") + (ids.length ? `<p class="mkt-sub">${T("Choisis un doublon à mettre en vente :")}</p><div class="fz-grid mkt-pick-grid">${ids.map((id) => `<button type="button" class="fz-pick${sel === id ? " on" : ""}" data-mk-pick="${C.esc(id)}">${mini(id)}<span class="fz-x">×${sp[id]}</span></button>`).join("")}</div>` : EMPTY(ICO_CARD, T("Tu n'as aucun doublon à vendre pour l'instant. Ouvre des packs !"), ""));
    } else {
      const open = mk.mine.filter((l) => l.status === "open"), sold = mk.mine.filter((l) => l.status === "sold").slice(0, 20);
      body = `<h3 class="mkt-sub">${T("En vente")} <span>${open.length} / ${G.MARKET_MAX_LISTINGS}</span></h3>${open.length ? `<div class="mkt-grid">${open.map(mkItem).join("")}</div>` : EMPTY(ICO_TAG, T("Aucune annonce en cours."), "")}
        ${sold.length ? `<h3 class="mkt-sub">${T("Ventes récentes")}</h3><div class="mkt-sold">${sold.map((l) => `<div class="mkt-sold-row" style="--mk:${MK_COL[l.rar] || MK_COL.common}"><span class="mkt-sold-art">${mini(l.cardId)}</span><b>${C.esc(label(l.cardId))}</b><em>${T("vendue")}</em><span class="mkt-sold-gain">+${dust(G.marketNet(l.price), 16)}</span></div>`).join("")}</div>` : ""}`;
    }
    const q = document.activeElement && document.activeElement.id === "mk-q" ? document.activeElement : null, pos = q ? q.selectionStart : 0;
    root.innerHTML = head + body;
    if (q) { const n = document.getElementById("mk-q"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) { /* ignoré */ } } }
  }
  window.MACardMarket = { state: () => mk, render: () => mkRender() };
  async function mkEnter() {
    mkRender();
    if (C.user) ready().then((d) => { mk.doc = d || MC().mine(); mkRender(); }).catch(() => {});
    await mkLoad(); mkRender();
  }
  async function mkDo(fn, ok) {
    if (mk.busy) return; mk.busy = true; mkRender();
    try { const r = await fn(); if (ok) C.toast(ok(r), "ok"); await ready(); mk.doc = MC().mine(); await mkLoad(); }
    catch (e) { C.toast(e.message || T("Action impossible."), "err"); }
    mk.busy = false; mkRender();
  }

  // ====================================================================== SOUHAITS / ÉCHANGES
  let wf = { rows: [], me: null, onlyMatch: true, loaded: false, err: "" };
  async function wfLoad() {
    try {
      const [ws, cs, all] = await Promise.all([
        C.db.collection("wishlists").orderBy("updatedAt", "desc").limit(80).get(),
        C.db.collection("collections").orderBy("updatedAt", "desc").limit(160).get(),
        window.MAGame ? window.MAGame.loadAll().catch(() => null) : null
      ]);
      const owned = new Map(); cs.forEach((d) => owned.set(d.id, d.data().owned || {}));
      const users = all && all.users ? all.users : new Map();
      const mine = C.user ? (MC().mine() ? MC().mine().owned : {}) : {}, myWish = new Set(MC().myWish ? MC().myWish() : []);
      wf.rows = ws.docs.map((d) => {
        const uid = d.id, o = owned.get(uid) || {}, wants = (d.data().ids || []).filter((id) => cardOf(id) && !(o[id] > 0));
        const offers = Object.keys(o).filter((id) => o[id] > 1 && !G.isSpecial(id) && cardOf(id));
        const give = wants.filter((id) => (mine[id] || 0) > 1), take = offers.filter((id) => myWish.has(id) && !(mine[id] > 0));
        return { uid, user: users.get(uid) || {}, wants, offers, give, take, at: tsMs(d.data().updatedAt) };
      }).filter((r) => r.uid !== (C.user && C.user.uid) && (r.wants.length || r.offers.length));
      wf.err = ""; wf.loaded = true;
    } catch (e) { wf.err = T("Impossible de charger le fil pour l'instant."); wf.loaded = true; }
  }
  function wfRender() {
    const root = rootOf("wishfeed"); if (!root) return;
    if (!wf.loaded) { root.innerHTML = `<div class="tcg-skeleton" aria-busy="true"><i></i><i></i><i></i></div>`; return; }
    if (wf.err) { root.innerHTML = `<div class="empty-note error">${C.esc(wf.err)}</div>`; return; }
    const rows = wf.rows.filter((r) => !wf.onlyMatch || !C.user || r.give.length || r.take.length).sort((a, b) => (b.give.length + b.take.length) - (a.give.length + a.take.length) || b.at - a.at);
    const chips = (ids, hot) => ids.slice(0, 8).map((id) => `<span class="wish-chip${hot && hot.includes(id) ? " match" : ""}" title="${C.esc(label(id))}">${C.esc(label(id))}</span>`).join("") + (ids.length > 8 ? `<span class="wish-chip more">+${ids.length - 8}</span>` : "");
    root.innerHTML = `<div class="wf-top"><label class="wf-toggle"><input type="checkbox" id="wf-only" ${wf.onlyMatch ? "checked" : ""}> ${T("Seulement les correspondances avec ma collection")}</label>
        <a class="cta-btn btn-ghost compact-btn" href="#/jouer/echanges">${T("Mes échanges")}</a></div>
      <p class="lap-meta">${T("Une correspondance, c'est un pilote qui cherche un de tes doublons, ou qui propose en double une carte de ta wishlist (★ dans ta collection).")}</p>
      <div class="wf-list">${rows.length ? rows.map((r) => {
        const nm = r.user.username || T("Pilote");
        return `<article class="wf-row${r.give.length || r.take.length ? " hot" : ""}"><header><a class="wf-who" href="#/pilote/${encodeURIComponent(r.uid)}"><b>${C.esc(nm)}</b></a>
          ${r.give.length ? `<span class="wf-tag">${T("Tu as ce qu'il cherche")} (${r.give.length})</span>` : ""}${r.take.length ? `<span class="wf-tag alt">${T("Il a ce que tu cherches")} (${r.take.length})</span>` : ""}</header>
          ${r.wants.length ? `<div class="wf-line"><small>${T("Cherche")}</small><div class="wish-list">${chips(r.wants, r.give)}</div></div>` : ""}
          ${r.offers.length ? `<div class="wf-line"><small>${T("Propose (doublons)")}</small><div class="wish-list">${chips(r.offers, r.take)}</div></div>` : ""}
          ${C.user && (r.give.length || r.take.length) ? `<a class="cta-btn fill-btn compact-btn" href="#/jouer/echanges" data-trade-with="${C.esc(r.uid)}">${T("Proposer un échange")}</a>` : ""}</article>`;
      }).join("") : `<div class="empty-note">${wf.onlyMatch && C.user ? T("Aucune correspondance pour l'instant. Ajoute des cartes à ta wishlist (★) ou décoche le filtre pour voir tout le monde.") : T("Personne n'a encore publié de liste de souhaits.")}</div>`}</div>`;
  }
  async function wfEnter() {
    wf.loaded = false; wfRender();
    if (C.user) await ready().catch(() => {});
    await wfLoad(); wfRender();
  }

  // ====================================================================== événements
  function bind() {
    document.addEventListener("click", (e) => {
      const t = e.target;
      let b = t.closest("[data-fz-pick]");
      if (b && fz.doc) {
        const r = b.dataset.r, id = b.dataset.fzPick, spare = (spareMap(fz.doc)[id] || 0);
        if (fz.r !== r) { fz.r = r; fz.ids = []; }
        const n = fz.ids.filter((x) => x === id).length;
        if (n >= spare) fz.ids = fz.ids.filter((x) => x !== id);
        else if (fz.ids.length < G.FUSE_COUNT) fz.ids.push(id);
        else C.toast(`${G.FUSE_COUNT} ${T("cartes au maximum.")}`, "err");
        fzRender(); return;
      }
      if (t.closest("[data-fz-reset]")) { fz.ids = []; fz.r = ""; fzRender(); return; }
      b = t.closest("[data-fz-go]"); if (b) { fzGo(b.dataset.fzGo); return; }
      b = t.closest("[data-mk-tab]"); if (b) { mk.tab = b.dataset.mkTab; mk.confirm = ""; mkRender(); return; }
      b = t.closest("[data-mk-rar]"); if (b) { mk.rar = b.dataset.mkRar; mkRender(); return; }
      b = t.closest("[data-mk-pick]"); if (b) { mk.sell = b.dataset.mkPick; mkRender(); return; }
      b = t.closest("[data-mk-buy]");
      if (b) {
        const l = mk.list.find((x) => x.id === b.dataset.mkBuy); if (!l) return;
        if (mk.confirm !== l.id) { mk.confirm = l.id; mkRender(); clearTimeout(mk.ct); mk.ct = setTimeout(() => { mk.confirm = ""; mkRender(); }, 4000); return; }
        mk.confirm = ""; mkDo(() => window.MAGameAPI.call("marketBuy", { id: l.id }), () => `${T("Carte achetée")} : ${label(l.cardId)}`); return;
      }
      b = t.closest("[data-mk-cancel]");
      if (b) { mkDo(() => window.MAGameAPI.call("marketCancel", { id: b.dataset.mkCancel }), () => T("Annonce retirée : la carte est revenue dans ta collection.")); return; }
    });
    document.addEventListener("submit", (e) => {
      const f = e.target.closest("[data-mk-form]"); if (!f) return;
      e.preventDefault();
      const price = Math.floor(Number(f.querySelector("#mk-price").value)), id = mk.sell;
      mkDo(() => window.MAGameAPI.call("marketList", { cardId: id, price }), () => { mk.sell = ""; mk.tab = "mine"; return `${T("En vente")} : ${label(id)} · ${price} ${T("cristaux")}`; });
    });
    document.addEventListener("input", (e) => {
      if (e.target.id === "mk-q") { mk.q = e.target.value; mkRender(); }
      else if (e.target.id === "mk-price" || e.target.id === "mk-range") {
        const v = Math.floor(Number(e.target.value) || 0), o = document.getElementById(e.target.id === "mk-price" ? "mk-range" : "mk-price"); if (o) o.value = v;
        const h = document.getElementById("mk-hint"); if (h) h.innerHTML = `${T("Tu recevras")} <b>${G.marketNet(v)}</b> ${T("cristaux")}.`;
      }
    });
    document.addEventListener("change", (e) => {
      if (e.target.id === "mk-sort") { mk.sort = e.target.value; mkRender(); }
      else if (e.target.id === "wf-only") { wf.onlyMatch = e.target.checked; wfRender(); }
    });
    document.addEventListener("ma:auth", () => { fz.doc = null; mk.doc = null; mk.mine = []; wf.loaded = false; const n = C.Router.current() && C.Router.current().name; if (n === "fusion") fzEnter(); else if (n === "cardmarket") mkEnter(); else if (n === "wishfeed") wfEnter(); });
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("fusion", { enter: () => fzEnter() });
    ctx.Router.register("cardmarket", { enter: () => mkEnter() });
    ctx.Router.register("wishfeed", { enter: () => wfEnter() });
    bind();
  });
})();
