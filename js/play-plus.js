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
  let mk = { tab: "buy", list: [], mine: [], doc: null, sell: "", rar: "all", sort: "new", q: "", busy: false, err: "" };
  async function mkLoad() {
    try {
      const snap = await C.db.collection("card_listings").where("status", "==", "open").limit(250).get();
      mk.list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((l) => cardOf(l.cardId)).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
      if (C.user) { const m = await C.db.collection("card_listings").where("uid", "==", C.user.uid).limit(80).get(); mk.mine = m.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)); }
      mk.err = "";
    } catch (e) { mk.err = T("Le marché n'est pas encore disponible (règles Firestore à publier)."); }
  }
  function mkItem(l, mine) {
    const R = MC().RAR[l.rar] || MC().RAR.common, own = C.user && C.user.uid === l.uid, can = C.user && mk.doc && mk.doc.dust >= l.price;
    return `<article class="mk-item rar-${l.rar}"><div class="mk-card">${mini(l.cardId)}</div>
      <div class="mk-info"><b>${C.esc(label(l.cardId))}</b><small>${R.label} · ${own ? T("ton annonce") : `${T("par")} <a href="#/pilote/${encodeURIComponent(l.uid)}">${C.esc(l.name || T("Pilote"))}</a>`}</small></div>
      <div class="mk-buy"><span class="mk-price">${dust(l.price, 16)}</span><small>${T("le vendeur reçoit")} ${G.marketNet(l.price)}</small>
      ${own ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-mk-cancel="${C.esc(l.id)}" ${mk.busy ? "disabled" : ""}>${T("Retirer")}</button>` : `<button type="button" class="cta-btn fill-btn compact-btn" data-mk-buy="${C.esc(l.id)}" ${!C.user || !can || mk.busy ? "disabled" : ""}>${C.user && !can ? T("Pas assez") : T("Acheter")}</button>`}</div></article>`;
  }
  function mkRender() {
    const root = rootOf("cardmarket"); if (!root) return;
    const RAR = MC().RAR, seg = [["buy", T("Acheter")], ["sell", T("Vendre")], ["mine", T("Mes annonces")]];
    const head = `<div class="mk-top"><span class="seg" role="group" aria-label="${T("Marché")}">${seg.map(([k, l]) => `<button type="button" data-mk-tab="${k}" aria-pressed="${mk.tab === k}">${l}</button>`).join("")}</span>
      ${C.user && mk.doc ? `<span class="mk-bal" title="${T("Tes cristaux")}">${dust(mk.doc.dust, 18)}</span>` : ""}</div>
      <p class="lap-meta mk-note">${T("Prix fixe en cristaux. Seuls les doublons se vendent ; la carte est mise de côté jusqu'à la vente. 10 % du prix disparaissent (commission), le reste va au vendeur.")}</p>`;
    let body = "";
    if (mk.err) body = `<div class="empty-note error">${C.esc(mk.err)}</div>`;
    else if (mk.tab === "buy") {
      let items = mk.list.filter((l) => (mk.rar === "all" || l.rar === mk.rar) && (!mk.q || (label(l.cardId) + " " + (cardOf(l.cardId).brand || "")).toLowerCase().includes(mk.q.toLowerCase())));
      items = items.sort(mk.sort === "price" ? (a, b) => a.price - b.price : mk.sort === "rar" ? (a, b) => G.ORDER.indexOf(a.rar) - G.ORDER.indexOf(b.rar) || a.price - b.price : (a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
      body = `<div class="cg-tools"><input type="search" id="mk-q" placeholder="${T("Rechercher une carte…")}" value="${C.esc(mk.q)}" aria-label="${T("Rechercher une carte")}" autocomplete="off">
        <select id="mk-rar" aria-label="${T("Rareté")}"><option value="all">${T("Toutes raretés")}</option>${G.ORDER.filter((r) => r !== "mythic").map((r) => `<option value="${r}" ${mk.rar === r ? "selected" : ""}>${RAR[r].label}</option>`).join("")}</select>
        <select id="mk-sort" aria-label="${T("Trier par")}">${[["new", T("Plus récentes")], ["price", T("Prix croissant")], ["rar", T("Rareté")]].map(([k, l]) => `<option value="${k}" ${mk.sort === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="mk-list">${items.length ? items.map((l) => mkItem(l)).join("") : `<div class="empty-note">${T("Aucune carte en vente pour ces critères.")}</div>`}</div>`;
    } else if (!C.user) body = loginNote(T("vendre tes cartes"));
    else if (mk.tab === "sell") {
      const sp = mk.doc ? spareMap(mk.doc) : {}, ids = Object.keys(sp).filter((id) => rarOf(id) !== "mythic").sort((a, b) => G.ORDER.indexOf(rarOf(a)) - G.ORDER.indexOf(rarOf(b)));
      const sel = mk.sell && sp[mk.sell] ? mk.sell : "";
      let form = "";
      if (sel) { const r = rarOf(sel), b = G.marketBounds(r), sug = Math.min(b.max, Math.max(b.min, Math.round(MC().RAR[r].craft * 0.5)));
        form = `<form class="mk-form" data-mk-form><div class="mk-sel">${mini(sel)}<div><b>${C.esc(label(sel))}</b><small>${MC().RAR[r].label}</small></div></div>
          <label for="mk-price">${T("Prix en cristaux")} <small>(${b.min} – ${b.max})</small></label>
          <div class="mk-row"><input id="mk-price" type="number" min="${b.min}" max="${b.max}" step="1" value="${sug}" inputmode="numeric" required><button type="submit" class="cta-btn fill-btn" ${mk.busy ? "disabled" : ""}>${T("Mettre en vente")}</button></div>
          <small class="mk-hint" id="mk-hint">${T("Tu recevras")} ${G.marketNet(sug)} ${T("cristaux")}.</small></form>`; }
      body = (form || "") + (ids.length ? `<p class="lap-meta">${T("Choisis un doublon à mettre en vente :")}</p><div class="fz-grid">${ids.map((id) => `<button type="button" class="fz-pick${sel === id ? " on" : ""}" data-mk-pick="${C.esc(id)}">${mini(id)}<span class="fz-x">×${sp[id]}</span></button>`).join("")}</div>` : `<div class="empty-note">${T("Tu n'as aucun doublon à vendre pour l'instant. Ouvre des packs !")}</div>`);
    } else {
      const open = mk.mine.filter((l) => l.status === "open"), sold = mk.mine.filter((l) => l.status === "sold").slice(0, 20);
      body = `<h3 class="sec-title">${T("En vente")} <span class="lap-meta">${open.length} / ${G.MARKET_MAX_LISTINGS}</span></h3><div class="mk-list">${open.length ? open.map((l) => mkItem(l)).join("") : `<div class="empty-note small">${T("Aucune annonce en cours.")}</div>`}</div>
        ${sold.length ? `<h3 class="sec-title">${T("Ventes récentes")}</h3><div class="mk-list">${sold.map((l) => `<article class="mk-item sold"><div class="mk-card">${mini(l.cardId)}</div><div class="mk-info"><b>${C.esc(label(l.cardId))}</b><small>${T("vendue")}</small></div><div class="mk-buy"><span class="mk-price">+${dust(G.marketNet(l.price), 16)}</span></div></article>`).join("")}</div>` : ""}`;
    }
    root.innerHTML = head + body;
  }
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
      b = t.closest("[data-mk-tab]"); if (b) { mk.tab = b.dataset.mkTab; mkRender(); return; }
      b = t.closest("[data-mk-pick]"); if (b) { mk.sell = b.dataset.mkPick; mkRender(); return; }
      b = t.closest("[data-mk-buy]");
      if (b) {
        const l = mk.list.find((x) => x.id === b.dataset.mkBuy); if (!l) return;
        if (!confirm(`${T("Acheter")} « ${label(l.cardId)} » ${T("pour")} ${l.price} ${T("cristaux")} ?`)) return;
        mkDo(() => window.MAGameAPI.call("marketBuy", { id: l.id }), () => `${T("Carte achetée")} : ${label(l.cardId)}`); return;
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
      if (e.target.id === "mk-q") { mk.q = e.target.value; const pos = e.target.selectionStart; mkRender(); const q = document.getElementById("mk-q"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (_) { /* ignoré */ } } }
      else if (e.target.id === "mk-price") { const h = document.getElementById("mk-hint"); if (h) h.textContent = `${T("Tu recevras")} ${G.marketNet(Math.floor(Number(e.target.value) || 0))} ${T("cristaux")}.`; }
    });
    document.addEventListener("change", (e) => {
      if (e.target.id === "mk-rar") { mk.rar = e.target.value; mkRender(); }
      else if (e.target.id === "mk-sort") { mk.sort = e.target.value; mkRender(); }
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
