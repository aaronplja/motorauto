/**
 * MOTORAUTO — cartes à collectionner. Chaque fiche du catalogue est une carte (la collection s'agrandit toute seule quand on
 * ajoute des voitures). Les packs, la fabrication et les échanges sont décidés par le SERVEUR (Cloud Functions) : le site
 * affiche et demande, il ne peut plus s'attribuer de cartes.
 *   collections/{uid}   { owned: {carId: n}, count, specials, dust, lastPack, bonus, claimed, opened, trades, chal }   (lecture publique, écriture serveur)
 *   wishlists/{uid}     { ids: [carId], updatedAt }                                                                    (écrit par le pilote)
 *   special_cards/{id}  cartes à édition limitée créées par l'administrateur (id « sp-… »)
 *   special_grants/{id_uid}  { serials: [n°] }                                                                          (écrit par le serveur)
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, doc = null, loadedFor = null, loadedAt = 0, busy = false, filter = "all", rarFilter = "all", query = "", wish = null, notice = "";
  let specials = new Map(), specialsAt = 0;
  const RAR = G.RAR, ORDER = G.ORDER;
  const day = () => G.dayKey();

  // ------------------------------------------------------------------ cartes
  let rarityMap = new Map(), numbering = new Map(), sig = "";
  function indexCars() {
    const cars = C.cars, s = cars.length + ":" + (cars[cars.length - 1] || {}).id;
    if (s === sig) return;
    sig = s; numbering = new Map();
    rarityMap = G.computeRarities(cars.map((c) => ({ id: c.id, power: c.stats.power })));
    cars.forEach((c, i) => numbering.set(c.id, i + 1));
  }
  const rarityOf = (car) => { if (car.special) return "special"; indexCars(); return rarityMap.get(car.id) || "common"; };
  const numberOf = (car) => { indexCars(); return numbering.get(car.id) || 0; };
  /** une carte, qu'elle vienne du catalogue ou d'une édition limitée */
  function cardObj(id) {
    const sp = specials.get(id);
    if (sp) return { id, brand: sp.edition || "Édition limitée", model: sp.name || id, image: sp.image || "", category: "", years: "", stats: { power: Number(sp.power) || 0, speed: Number(sp.speed) || 0, zero: Number(sp.zero) || null }, special: sp };
    return C.carsById.get(id) || null;
  }
  const isOwned = (id) => !!(doc && (doc.owned[id] || 0) > 0);
  const countOf = (id) => (doc && doc.owned[id]) || 0;

  function cardHtml(car, o) {
    o = o || {};
    const esc = C.esc, r = rarityOf(car), R = RAR[r], owned = o.owned !== false, sp = car.special;
    const img = car.image && C.safeUrl(car.image) ? `<img class="${owned ? "" : "tcg-ghost"}" src="${esc(C.safeUrl(car.image))}" alt="" loading="lazy" decoding="async" draggable="false" data-fallback="car">${owned ? "" : `<span class="tcg-q tcg-q-over" aria-hidden="true">?</span>`}` : `<span class="tcg-q" aria-hidden="true">${owned && sp ? "✦" : "?"}</span>`;
    const model = String(car.model || "").replace(/\s*\(.*$/, "");
    const hasStats = !sp || car.stats.power > 0;
    const bar = (v) => `<i style="--v:${Math.max(0, Math.min(1, v)).toFixed(2)}"></i>`;
    const st = car.stats || {}, z = Number(st.zero) || 0;
    const stats = hasStats
      ? `<div class="tcg-stats"><span><b>${owned ? st.power : "?"}</b>ch${bar(owned ? st.power / 1200 : 0)}</span><span><b>${owned ? st.speed : "?"}</b>km/h${bar(owned ? st.speed / 400 : 0)}</span><span><b>${owned ? (z || "—") : "?"}</b>0-100${bar(owned && z ? (14 - z) / 11 : 0)}</span></div>`
      : `<p class="tcg-note">${owned ? esc(sp.text || "") : ""}</p>`;
    const no = sp ? "★" : "#" + String(numberOf(car)).padStart(3, "0");
    const color = sp && sp.color ? " tcg-c-" + esc(sp.color) : "";
    return `<div class="tcg tcg-${r}${color} ${owned ? "" : "locked"} ${o.cls || ""}" data-card="${esc(car.id)}" role="button" tabindex="0" aria-label="${owned ? esc(car.brand + " " + model) : "Carte non débloquée " + no}, ${R.label}">
      <div class="tcg-art">${img}<i class="tcg-foil" aria-hidden="true"></i></div><i class="tcg-holo" aria-hidden="true"></i>
      <div class="tcg-body"><span class="tcg-brand">${owned || sp ? esc(car.brand) : "—"}</span><b class="tcg-name">${owned || sp ? esc(model) : "Carte à débloquer"}</b>${stats}</div>
      <span class="tcg-rar">${sp ? "✦ " : ""}${R.label}</span><span class="tcg-no">${no}</span>
      ${o.count > 1 ? `<span class="tcg-dup">×${o.count}</span>` : ""}${o.isNew ? `<span class="tcg-new-pill">NEW</span>` : ""}${o.wish ? `<span class="tcg-wish" title="Dans ta wishlist" aria-label="Dans ta wishlist">★</span>` : ""}
    </div>`;
  }

  // ------------------------------------------------------------------ données
  const col = (uid) => C.db.collection("collections").doc(uid);
  const blank = () => Object.assign(G.blankCollection(), { bonus: 0 });
  const API = (name, data) => window.MAGameAPI.call(name, data);
  function applyDoc(v) {
    doc = Object.assign(blank(), doc || {}, v); loadedAt = Date.now();
    if (window.MAGame) window.MAGame.invalidate();
    document.dispatchEvent(new CustomEvent("ma:cards", { detail: { doc } }));
  }
  async function loadSpecials(force) {
    if (!force && Date.now() - specialsAt < 60000) return;
    try {
      const s = await C.db.collection("special_cards").limit(200).get();
      specials = new Map(); s.forEach((d) => { const x = d.data(); if (x.active !== false) specials.set(d.id, Object.assign({ id: d.id }, x)); });
      specialsAt = Date.now();
    } catch (e) { /* règles non publiées : pas d'éditions spéciales */ }
  }
  async function loadWish(uid) {
    try { const s = await C.db.collection("wishlists").doc(uid).get(); return s.exists && Array.isArray(s.data().ids) ? s.data().ids : []; } catch (_) { return []; }
  }
  /** charge ma collection : affichage immédiat depuis Firestore, puis synchronisation serveur (packs bonus des badges) */
  async function load(force) {
    if (!C.user) { doc = null; loadedFor = null; wish = null; return null; }
    if (doc && loadedFor === C.user.uid && !force && Date.now() - loadedAt < 45000) return doc;
    const uid = C.user.uid;
    if (loadedFor !== uid) { doc = null; wish = null; }
    loadedFor = uid;
    const [snap, w] = await Promise.all([col(uid).get().catch(() => null), loadWish(uid), loadSpecials()]);
    wish = w;
    if (snap && snap.exists) applyDoc(Object.assign({}, snap.data(), { bonus: snap.data().bonus || 0 }));
    notice = "";
    try {
      const r = await API("syncCollection");
      applyDoc(r.doc);
      if (r.freshBadges) C.toast(`🎁 ${r.freshBadges} pack${r.freshBadges > 1 ? "s" : ""} bonus gagné${r.freshBadges > 1 ? "s" : ""} grâce à tes badges !`, "ok");
    } catch (e) { notice = e.message; if (!doc) applyDoc(blank()); }
    return doc;
  }

  // ------------------------------------------------------------------ wishlist
  async function toggleWish(id) {
    if (!C.requireLogin()) return;
    wish = wish || [];
    const has = wish.includes(id);
    if (!has && wish.length >= 40) { C.toast("40 cartes maximum dans la wishlist.", "err"); return; }
    const next = has ? wish.filter((x) => x !== id) : wish.concat([id]), prev = wish;
    wish = next; renderGrid(); refreshDetail(id);
    try { await C.db.collection("wishlists").doc(C.user.uid).set({ ids: next, updatedAt: C.FieldValue.serverTimestamp() }); C.toast(has ? "Retirée de ta wishlist." : "★ Ajoutée à ta wishlist : les autres pilotes la voient sur ton profil.", "ok"); }
    catch (e) { wish = prev; renderGrid(); refreshDetail(id); C.toast("Wishlist indisponible : " + e.message, "err"); }
  }

  // ------------------------------------------------------------------ packs et fabrication (serveur)
  async function openPack(kind) {
    if (busy || !C.requireLogin()) return;
    busy = true; renderHero();
    // le pack apparaît tout de suite pendant que le serveur tire les cartes (plus d'écran figé)
    mountOverlay("pack", "Ouverture de pack", `<div class="pk3 pk3-loading" id="pk3"><h2>${kind === "shop" ? "Ton pack cristal" : "Ton pack"}</h2><div class="pk3-pack ${C.esc(kind)} pk3-wait" aria-hidden="true"><b>MOTOR<span>AUTO</span></b></div><p class="tcg-hint" role="status">Préparation du pack…</p></div>`);
    try {
      if (!doc) await load();
      const r = await API("openPack", { kind });
      applyDoc(r.doc);
      showPack(r.cards.map((c) => ({ car: cardObj(c.id), fresh: c.fresh })).filter((x) => x.car), r.dust, kind);
    } catch (e) { closeOverlay(); C.toast(e.message, "err"); await load(true).catch(() => {}); }
    finally { busy = false; renderHero(); }
  }
  // ----- historique de poussière
  function showDustLog() {
    if (!doc) return;
    const log = (doc.dustLog || []).slice().reverse(), fmt = (t) => new Date(t).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const lo = mountOverlay("dustlog", "Historique de poussière", `<div class="tcg-stage"><div class="dustlog"><h2>${window.MA.dustIcon(24)} Ta poussière</h2><p class="dustlog-bal"><b>${doc.dust}</b> en réserve</p>
      ${log.length ? `<ul>${log.map((l) => `<li class="${l.n > 0 ? "gain" : "spend"}"><span>${C.esc(l.w || "")}<small>${fmt(l.t)}</small></span><b>${l.n > 0 ? "+" : "−"}${Math.abs(l.n)} ${window.MA.dustIcon(14)}</b></li>`).join("")}</ul>` : `<p class="tcg-hint">Rien pour l'instant : la poussière vient des doublons et des défis.</p>`}
      <div class="tcg-actions"><button type="button" class="cta-btn btn-ghost" data-close>Fermer</button></div></div></div>`);
    lo.addEventListener("click", (e) => { if (e.target === lo || e.target.closest("[data-close]")) closeOverlay(); });
  }
  async function craft(id) {
    if (busy || !C.requireLogin()) return;
    const car = cardObj(id); if (!car) return;
    const cost = RAR[rarityOf(car)].craft;
    if (!confirm(`Fabriquer « ${car.brand} ${car.model} » pour ${cost} poussière ?`)) return;
    busy = true;
    try {
      const r = await API("craftCard", { id });
      applyDoc(r.doc); C.toast("Carte fabriquée !", "ok"); closeOverlay();
    } catch (e) { C.toast(e.message, "err"); }
    finally { busy = false; render(); }
  }

  // ------------------------------------------------------------------ fenêtres (pack, détail)
  let overlay = null, lastFocus = null;
  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove("on");
    const o = overlay; overlay = null;
    document.removeEventListener("keydown", onKey);
    document.body.classList.remove("tcg-open");
    setTimeout(() => o.remove(), 180);
    if (lastFocus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (_) { /* ignoré */ } }
    render();
  }
  function onKey(e) {
    if (e.key === "Escape") { closeOverlay(); return; }
    if (overlay && overlay.dataset.kind === "detail" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); stepDetail(e.key === "ArrowLeft" ? -1 : 1); return; }
    if (e.key === "Tab" && overlay) {                       // le focus reste dans la fenêtre
      const f = Array.from(overlay.querySelectorAll("button:not([hidden]):not([disabled]), a[href], [tabindex='0']")).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function mountOverlay(kind, label, html) {
    if (overlay) { overlay.remove(); overlay = null; }
    else lastFocus = document.activeElement;
    overlay = document.createElement("div");
    overlay.className = "tcg-overlay"; overlay.dataset.kind = kind; overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", label);
    overlay.innerHTML = html;
    document.body.appendChild(overlay); document.body.classList.add("tcg-open");
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => overlay && overlay.classList.add("on"));
    return overlay;
  }

  // ------------------------------------------------------------------ mémoire locale : vues, tri, cartes « NEW »
  const store = { get(k, d) { try { return localStorage.getItem(k) || d; } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* ignoré */ } } };
  let seen = null;
  function seenSet() {
    if (!C.user || !doc) return new Set();
    if (seen && seen.uid === C.user.uid) return seen.set;
    let arr = null; try { arr = JSON.parse(localStorage.getItem("ma_cards_seen_" + C.user.uid) || "null"); } catch (_) { /* ignoré */ }
    seen = { uid: C.user.uid, set: new Set(Array.isArray(arr) ? arr : Object.keys(doc.owned).filter((k) => doc.owned[k] > 0)) };
    if (!Array.isArray(arr)) saveSeen();                                  // première visite : tout l'existant est considéré comme vu
    return seen.set;
  }
  function saveSeen() { if (seen) store.set("ma_cards_seen_" + seen.uid, JSON.stringify(Array.from(seen.set).slice(-3000))); }
  function markSeen(id) { const s = seenSet(); if (!s.has(id)) { s.add(id); saveSeen(); } }

  // ------------------------------------------------------------------ ouverture d'un pack
  const BURST = { rare: "#3b82f6", epic: "#a855f7", legendary: "#f59e0b", shiny: "#ff7ad9", special: "#cbd5e1" };
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) { /* ignoré */ } };
  function sparks(el, n) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4, d = 70 + Math.random() * 80, s = document.createElement("i");
      s.className = "spark"; s.style.setProperty("--dx", Math.round(Math.cos(a) * d) + "px"); s.style.setProperty("--dy", Math.round(Math.sin(a) * d) + "px");
      el.appendChild(s); setTimeout(() => s.remove(), 1000);
    }
  }
  function showPack(results, dust, kind) {
    const rank = (r) => (r === "special" ? ORDER.length + 2 : ORDER.length - ORDER.indexOf(r));
    const best = results.reduce((b, r) => (rank(rarityOf(r.car)) > rank(rarityOf(b.car)) ? r : b), results[0]);
    const o = mountOverlay("pack", "Ouverture de pack", `<div class="pk3" id="pk3"><h2>Ton pack</h2><button type="button" class="pk3-pack ${C.esc(kind || "daily")}" id="pk3-open" aria-label="Ouvrir le pack"><b>MOTOR<span>AUTO</span></b></button><p class="tcg-hint">Touche le pack pour l'ouvrir</p></div>`);
    const openBtn = o.querySelector("#pk3-open"); openBtn.focus();
    let started = false;
    openBtn.addEventListener("click", () => {
      if (started) return; started = true; buzz(20);
      openBtn.classList.add("shake");
      setTimeout(() => { openBtn.classList.remove("shake"); openBtn.classList.add("gone"); }, 560);
      setTimeout(stage, 980);
    });
    function stage() {
      const box = o.querySelector("#pk3"); if (!box || overlay !== o) return;
      box.innerHTML = `<h2>Ton pack</h2><p class="tcg-hint" id="tcg-hint">Touche chaque carte pour la révéler</p>
        <div class="tcg-flips">${results.map((r, i) => `<div class="flip deal" style="--i:${i}" data-i="${i}" data-r="${rarityOf(r.car)}" role="button" tabindex="0" aria-label="Révéler la carte ${i + 1}"><div class="flip-in"><div class="flip-face flip-back"><b>MOTOR<span>AUTO</span></b><small>CARTE</small></div><div class="flip-face flip-front">${cardHtml(r.car)}<span class="tcg-tag ${r.fresh ? "new" : "dup"}">${r.fresh ? "NOUVELLE" : "DOUBLON +" + RAR[rarityOf(r.car)].dust}</span></div></div><i class="flip-ring" aria-hidden="true"></i></div>`).join("")}</div>
        <div class="tcg-actions"><button type="button" class="cta-btn btn-ghost" id="tcg-all">Tout révéler</button></div>
        <div class="pk3-sum" id="tcg-sum" hidden></div>
        <div class="tcg-actions" id="tcg-end" hidden><button type="button" class="cta-btn fill-btn" id="tcg-done">Terminer</button></div>`;
      let shown = 0;
      const reveal = (el) => {
        if (el.classList.contains("on")) return;
        el.classList.add("on"); shown++;
        const rr = el.dataset.r;
        if (rr === "rare") buzz(15);
        else if (rr === "epic") { sparks(el, 10); buzz([20, 30, 20]); }
        else if (rr === "legendary" || rr === "shiny" || rr === "special") { sparks(el, 18); buzz([30, 40, 60]); }
        if (BURST[rr] && rr !== "rare") { o.style.setProperty("--burst", BURST[rr]); o.classList.remove("flash"); void o.offsetWidth; o.classList.add("flash"); }
        if (shown === results.length) finish();
      };
      const finish = () => {
        const news = results.filter((r) => r.fresh).length, dups = results.length - news;
        const sum = o.querySelector("#tcg-sum");
        sum.innerHTML = `<span>${news} nouvelle${news > 1 ? "s" : ""}</span><span>${dups} doublon${dups > 1 ? "s" : ""}</span>${dust ? `<span>+${dust} ${window.MA.dustIcon(15)} poussière</span>` : ""}`;
        if (rank(rarityOf(best.car)) > 1) sum.insertAdjacentHTML("afterend", `<p class="pk3-best">Meilleure carte : ${C.esc(best.car.brand + " " + String(best.car.model).replace(/\s*\(.*$/, ""))} · ${RAR[rarityOf(best.car)].label}</p>`);
        sum.hidden = false; o.querySelector("#tcg-end").hidden = false; o.querySelector("#tcg-all").parentNode.hidden = true; o.querySelector("#tcg-hint").textContent = "";
        const again = doc && (doc.lastPack !== day() ? "daily" : doc.bonus > 0 ? "bonus" : "");
        if (again) o.querySelector("#tcg-end").insertAdjacentHTML("afterbegin", `<button type="button" class="cta-btn btn-ghost" id="tcg-again">Ouvrir un autre pack</button>`);
        const ag = o.querySelector("#tcg-again"); if (ag) ag.addEventListener("click", () => { closeOverlay(); setTimeout(() => openPack(again), 220); });
        o.querySelector("#tcg-done").focus();
      };
      o.querySelectorAll(".flip").forEach((f) => { f.addEventListener("click", () => reveal(f)); f.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(f); } }); });
      o.querySelector("#tcg-all").addEventListener("click", () => o.querySelectorAll(".flip").forEach((f, i) => setTimeout(() => reveal(f), i * 260)));
      o.querySelector("#tcg-done").addEventListener("click", closeOverlay);
      const f0 = o.querySelector(".flip"); if (f0) f0.focus({ preventScroll: true });
    }
  }

  // ------------------------------------------------------------------ détail : carte 3D, retournable, navigation
  let navIds = [];
  function backHtml(car, id) {
    const n = countOf(id), R = RAR[rarityOf(car)], sp = car.special, e = C.esc;
    if (n === 0) return `<h3>Carte à débloquer</h3><p>Ouvre des packs pour la trouver${sp ? "." : " ou fabrique-la avec de la poussière."}</p><dl><dt>Rareté</dt><dd>${R.label}</dd><dt>N°</dt><dd>${sp ? "★" : "#" + String(numberOf(car)).padStart(3, "0")}</dd></dl>`;
    if (sp) return `<h3>${e(car.model)}</h3><p>${e(sp.text || "")}</p><dl><dt>Édition</dt><dd>${e(car.brand)}</dd><dt>Exemplaires</dt><dd>${n}</dd></dl>`;
    const all = C.cars.filter((c) => c.brand === car.brand), have = all.filter((c) => countOf(c.id) > 0).length, st = car.stats;
    const desc = String(car.description || "").replace(/\s+/g, " ");
    return `<h3>${e(car.brand)} ${e(String(car.model).replace(/\s*\(.*$/, ""))}</h3>
      <dl><dt>Années</dt><dd>${e(car.years || "—")}</dd><dt>Catégorie</dt><dd>${e(car.category)}</dd><dt>Rareté</dt><dd>${R.label}</dd><dt>N°</dt><dd>#${String(numberOf(car)).padStart(3, "0")}</dd><dt>Puissance</dt><dd>${st.power} ch</dd><dt>Vitesse</dt><dd>${st.speed} km/h</dd><dt>0-100</dt><dd>${st.zero ? st.zero + " s" : "—"}</dd><dt>Exemplaires</dt><dd>${n}</dd></dl>
      <div><small>Album ${e(car.brand)} : ${have} / ${all.length}</small><div class="ab-bar"><i style="width:${Math.round((have / all.length) * 100)}%"></i></div></div>${desc ? `<p>${e(desc.slice(0, 150))}${desc.length > 150 ? "…" : ""}</p>` : ""}`;
  }
  function detailHtml(id, back) {
    const car = cardObj(id), n = countOf(id), R = RAR[rarityOf(car)], sp = car.special, inWish = (wish || []).includes(id);
    const info = sp
      ? `Édition limitée${sp.supply ? " · " + (sp.granted || 0) + " / " + sp.supply + " exemplaires attribués" : ""}. ${n > 0 ? "Elle fait partie de ta collection." : "Elle s'obtient uniquement en la gagnant (événements, concours)."}`
      : n > 0 ? `Tu possèdes cette carte${n > 1 ? " en " + n + " exemplaires" : ""}.` : `Carte ${R.label.toLowerCase()} · fabrication : ${R.craft} ${window.MA.dustIcon(14)} (tu en as ${doc ? doc.dust : 0}).`;
    const actions = [`<button type="button" class="cta-btn btn-ghost" data-flipcard>↻ Retourner</button>`];
    if (n > 0 && !sp) actions.push(`<a class="cta-btn btn-ghost" href="#/voiture/${encodeURIComponent(id)}" data-close>Voir la fiche</a>`);
    if (n > 1) actions.push(`<button type="button" class="cta-btn fill-btn" data-swap>🔄 Proposer à l'échange</button>`);
    if (n > 0) actions.push(`<button type="button" class="cta-btn btn-ghost" data-share>↗ Partager</button>`);
    if (n === 0 && !sp) actions.push(`<button type="button" class="cta-btn fill-btn" data-craft ${doc && doc.dust >= R.craft ? "" : "disabled"}>Fabriquer (${R.craft} ${window.MA.dustIcon(14)})</button>`);
    if (n === 0 && !sp) actions.push(`<button type="button" class="cta-btn btn-ghost" data-wish aria-pressed="${inWish}">${inWish ? "★ Dans ma wishlist" : "☆ Wishlist"}</button>`);
    actions.push(`<button type="button" class="cta-btn btn-ghost" data-close>Fermer</button>`);
    const i = navIds.indexOf(id), nav = i >= 0 && navIds.length > 1 ? `<div class="tcg-nav"><button type="button" data-nav="-1" aria-label="Carte précédente" ${i > 0 ? "" : "disabled"}>‹</button><span class="tcg-hint">${i + 1} / ${navIds.length}</span><button type="button" data-nav="1" aria-label="Carte suivante" ${i < navIds.length - 1 ? "" : "disabled"}>›</button></div>` : "";
    return `<div class="tcg-stage"><div class="tcg-solo"><div class="tcg-3d rest${back ? " back" : ""}" id="tcg-3d"><div class="tcg-3d-in"><div class="tcg-3d-face">${cardHtml(car, { owned: n > 0, count: n })}</div><div class="tcg-3d-face rev">${backHtml(car, id)}</div></div></div></div>${nav}<p class="tcg-hint" id="tcg-serial">${C.esc(info)}</p>${sp && sp.text && sp.power > 0 ? `<p class="tcg-hint">${C.esc(sp.text)}</p>` : ""}<div class="tcg-actions">${actions.join("")}</div></div>`;
  }
  function showDetail(id, ids) {
    const car = cardObj(id); if (!car) return;
    if (ids) navIds = ids;
    if (countOf(id) > 0) markSeen(id);
    const o = mountOverlay("detail", "Détail de la carte", detailHtml(id, false));
    o.dataset.id = id;
    o.addEventListener("click", (e) => {
      if (e.target === o || e.target.closest("[data-close]")) closeOverlay();
      else if (e.target.closest("[data-craft]")) craft(id);
      else if (e.target.closest("[data-wish]")) toggleWish(id);
      else if (e.target.closest("[data-flipcard]") || e.target.closest(".tcg-3d")) { const t = o.querySelector("#tcg-3d"); if (t) t.classList.toggle("back"); }
      else if (e.target.closest("[data-nav]")) stepDetail(Number(e.target.closest("[data-nav]").dataset.nav));
      else if (e.target.closest("[data-swap]")) { closeOverlay(); if (window.MATrades) window.MATrades.prefill(id); C.Router.go("/jouer/echanges"); }
      else if (e.target.closest("[data-share]") && window.MAShare) window.MAShare.shareCard(car, RAR[rarityOf(car)].label, numberOf(car));
    });
    const first = o.querySelector(".cta-btn"); if (first) first.focus({ preventScroll: true });
    const sp = car.special;
    if (sp && C.user && countOf(id) > 0) {                       // numéro d'exemplaire
      C.db.collection("special_grants").doc(id + "_" + C.user.uid).get().then((s) => { const t = o.querySelector("#tcg-serial"); if (s.exists && t && s.data().serials) t.textContent += " Exemplaire n° " + s.data().serials.join(", ") + (sp.supply ? " / " + sp.supply : "") + "."; }).catch(() => {});
    }
  }
  function stepDetail(d) {
    if (!overlay || overlay.dataset.kind !== "detail") return;
    const i = navIds.indexOf(overlay.dataset.id), t = navIds[i + d];
    if (i >= 0 && t) showDetail(t);
  }
  function refreshDetail(id) {
    if (!overlay || overlay.dataset.kind !== "detail" || overlay.dataset.id !== id) return;
    const st = overlay.querySelector(".tcg-stage"), back = !!overlay.querySelector(".tcg-3d.back");
    if (st) st.outerHTML = detailHtml(id, back);
    const first = overlay.querySelector(".cta-btn"); if (first) first.focus({ preventScroll: true });
  }

  // reflet holographique et inclinaison : un seul écouteur, un calcul par image (requestAnimationFrame), uniquement sur la carte survolée
  let tiltPend = null, tiltRaf = 0;
  function tiltApply() {
    tiltRaf = 0; const p = tiltPend; if (!p) return;
    const r = p.t.getBoundingClientRect(); if (!r.width) return;
    const px = Math.max(0, Math.min(1, (p.x - r.left) / r.width)), py = Math.max(0, Math.min(1, (p.y - r.top) / r.height));
    const is3d = p.t.classList.contains("tcg-3d"), card = is3d ? p.t.querySelector(".tcg") : p.t;
    if (card) { card.style.setProperty("--mx", (px * 100).toFixed(0) + "%"); card.style.setProperty("--my", (py * 100).toFixed(0) + "%"); card.classList.add("tcg-tilting"); }
    if (is3d) { p.t.classList.remove("rest"); p.t.style.setProperty("--rx", ((0.5 - py) * 16).toFixed(1) + "deg"); p.t.style.setProperty("--ry", ((px - 0.5) * 18).toFixed(1) + "deg"); }
  }
  function tiltMove(e) {
    if (!overlay || e.pointerType === "touch") return;
    const t = e.target.closest && e.target.closest(".tcg-3d, .tcg-flips .tcg");
    if (!t) { tiltReset(); return; }
    tiltPend = { t, x: e.clientX, y: e.clientY };
    if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltApply);
  }
  function tiltReset() {
    tiltPend = null;
    if (!overlay) return;
    overlay.querySelectorAll(".tcg-tilting").forEach((c) => c.classList.remove("tcg-tilting"));
    overlay.querySelectorAll(".tcg-3d").forEach((t) => { t.classList.add("rest"); t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); });
  }

  // ------------------------------------------------------------------ page « Cartes »
  let sortBy = store.get("ma_cards_sort", "num"), view = store.get("ma_cards_view", "grid");
  const zeroKey = (c) => Number(c.stats.zero) || 99;
  function sortList(list) {
    const byNum = (a, b) => numberOf(a) - numberOf(b);
    const cmp = {
      num: byNum,
      rar: (a, b) => ORDER.indexOf(rarityOf(a)) - ORDER.indexOf(rarityOf(b)) || byNum(a, b),
      power: (a, b) => b.stats.power - a.stats.power || byNum(a, b),
      speed: (a, b) => b.stats.speed - a.stats.speed || byNum(a, b),
      zero: (a, b) => zeroKey(a) - zeroKey(b) || byNum(a, b),
      brand: (a, b) => a.brand.localeCompare(b.brand, "fr") || a.model.localeCompare(b.model, "fr") || byNum(a, b),
      owned: (a, b) => countOf(b.id) - countOf(a.id) || byNum(a, b)
    };
    return list.sort(cmp[sortBy] || byNum);
  }
  function visibleList() {
    indexCars();
    const q = C.normalize(query);
    const list = C.cars.filter((c) => {
      const n = countOf(c.id);
      if (filter === "owned" && !n) return false;
      if (filter === "missing" && n) return false;
      if (filter === "dups" && n < 2) return false;
      if (filter === "wish" && !(wish || []).includes(c.id)) return false;
      if (rarFilter !== "all" && rarityOf(c) !== rarFilter) return false;
      return !q || C.normalize(c.brand + " " + c.model).includes(q);
    });
    return sortList(list);
  }
  function renderHero() {
    const el = document.getElementById("tcg-hero"); if (!el || !doc) return;
    indexCars();
    const total = C.cars.length, owned = doc.count, pct = Math.round((owned / Math.max(1, total)) * 100), canDaily = doc.lastPack !== day();
    const byR = ORDER.map((r) => { const all = C.cars.filter((c) => rarityOf(c) === r); const have = all.filter((c) => countOf(c.id) > 0).length; return `<span class="tcg-rar-chip ${r}">${RAR[r].label} <b>${have}/${all.length}</b></span>`; }).join("");
    const dups = Object.keys(doc.owned).filter((k) => doc.owned[k] > 1).length;
    const canBattle = Object.keys(doc.owned).filter((k) => doc.owned[k] > 0 && C.carsById.has(k)).length >= 3;
    el.innerHTML = `<div class="tcg-progress"><div class="tcg-pg-top"><span><b>${owned}</b> / ${total} cartes</span><em>${pct} %</em></div><div class="xp-bar"><i style="width:${pct}%"></i></div><div class="tcg-rar-row">${byR}${doc.specials ? `<span class="tcg-rar-chip special">✦ Éditions <b>${doc.specials}</b></span>` : ""}</div></div>
      <div class="tcg-packs">
        <button type="button" class="tcg-pack ${canDaily ? "ready" : "done"}" data-pack="daily" ${canDaily && !busy ? "" : "disabled"} aria-label="Pack du jour"><span class="pk-logo">MOTOR<i>AUTO</i></span><b>${canDaily ? "Pack du jour" : "Reviens demain"}</b><small>${canDaily ? "3 cartes gratuites" : "déjà ouvert"}</small></button>
        <button type="button" class="tcg-pack shop ${doc.dust >= G.SHOP_PACK.cost ? "ready" : "done"}" data-pack="shop" ${doc.dust >= G.SHOP_PACK.cost && !busy ? "" : "disabled"} aria-label="Pack cristal : ${G.SHOP_PACK.cost} poussière"><span class="pk-logo">${window.MA.dustIcon(34)}</span><b>Pack cristal</b><small>${G.SHOP_PACK.cards} voitures dont 1 rare+ · ${G.SHOP_PACK.cost} ${window.MA.dustIcon(13)}</small></button>
        <button type="button" class="tcg-pack bonus ${doc.bonus ? "ready" : "done"}" data-pack="bonus" ${doc.bonus && !busy ? "" : "disabled"} aria-label="Pack bonus"><span class="pk-logo">★</span><b>${doc.bonus} pack${doc.bonus > 1 ? "s" : ""} bonus</b><small>badges, défis, parrainage</small></button>
        <button type="button" class="tcg-pack battle ${canBattle ? "ready" : "done"}" data-battle ${canBattle ? "" : "disabled"} aria-label="Bataille de cartes"><span class="pk-logo">⚔</span><b>Bataille</b><small>${canBattle ? "entraînement, sans récompense" : "3 cartes minimum"}</small></button>
        <button type="button" class="tcg-dust" data-dust-log title="Poussière issue des doublons et des défis : fabrique des cartes ou achète un pack. Touche pour voir l'historique"><b>${window.MA.dustIcon(20)} ${doc.dust}</b><small>poussière${dups ? " · " + dups + " doublon" + (dups > 1 ? "s" : "") : ""}</small></button>
      </div>${notice ? `<p class="tcg-alert" role="status">⚠ ${C.esc(notice)}</p>` : ""}`;
  }

  let curList = [], shown = 0, io = null, albumBrands = [];
  const CH = 36;
  const cardTpl = (c, w, sn) => cardHtml(c, { owned: countOf(c.id) > 0, count: countOf(c.id), wish: w.has(c.id) && !countOf(c.id), isNew: countOf(c.id) > 0 && !sn.has(c.id) });
  function appendChunk() {
    const el = document.getElementById("tcg-grid"); if (!el || view === "albums") return;
    const old = el.querySelector(".tcg-sentinel"); if (old) old.remove();
    const w = new Set(wish || []), sn = seenSet(), slice = curList.slice(shown, shown + CH);
    shown += slice.length;
    el.insertAdjacentHTML("beforeend", slice.map((c) => cardTpl(c, w, sn)).join(""));
    if (shown < curList.length) {
      const s = document.createElement("div"); s.className = "tcg-sentinel"; el.appendChild(s);
      if ("IntersectionObserver" in window) {
        io = io || new IntersectionObserver((ents) => { if (ents.some((x) => x.isIntersecting)) appendChunk(); }, { rootMargin: "900px" });
        io.disconnect(); io.observe(s);
      } else appendChunk();
    }
  }
  function fillAlbum(d) {
    const g = d.querySelector("[data-fill]"); if (!g || g.dataset.done) return;
    g.dataset.done = "1";
    const w = new Set(wish || []), sn = seenSet();
    g.innerHTML = curList.filter((c) => c.brand === d.dataset.brand).map((c) => cardTpl(c, w, sn)).join("");
  }
  function renderAlbums(el) {
    const by = new Map(); curList.forEach((c) => { if (!by.has(c.brand)) by.set(c.brand, true); });
    albumBrands = Array.from(by.keys()).sort((a, b) => a.localeCompare(b, "fr"));
    el.innerHTML = albumBrands.map((b) => {
      const all = C.cars.filter((c) => c.brand === b), have = all.filter((c) => countOf(c.id) > 0).length, shownN = curList.filter((c) => c.brand === b).length;
      return `<details class="tcg-album ${have === all.length ? "done" : ""}" data-brand="${C.esc(b)}"><summary><span class="ab-name">${C.esc(b)}<small>${have} / ${all.length} cartes${shownN !== all.length ? " · " + shownN + " affichée" + (shownN > 1 ? "s" : "") : ""}</small></span><span class="ab-bar" aria-hidden="true"><i style="width:${Math.round((have / all.length) * 100)}%"></i></span></summary><div class="tcg-grid compact" data-fill></div></details>`;
    }).join("") || `<div class="empty-note tcg-empty">Aucune carte pour ce filtre.</div>`;
    if (albumBrands.length === 1) { const d = el.querySelector(".tcg-album"); if (d) { d.open = true; fillAlbum(d); } }
  }
  function renderGrid() {
    const el = document.getElementById("tcg-grid"); if (!el || !doc) return;
    if (io) io.disconnect();
    curList = visibleList(); shown = 0;
    const cnt = document.getElementById("tcg-count"); if (cnt) cnt.textContent = curList.length + " carte" + (curList.length > 1 ? "s" : "");
    el.className = view === "albums" ? "tcg-albums" : "tcg-grid" + (view === "compact" ? " compact" : "");
    if (view === "albums") { renderAlbums(el); return; }
    const sp = Array.from(specials.values()).filter((s) => (filter === "all" ? true : filter === "owned" ? countOf(s.id) > 0 : false) && rarFilter === "all" && sortBy === "num");
    const sn = seenSet();
    el.innerHTML = sp.length && !query ? `<div class="tcg-sec">✦ Éditions limitées</div>${sp.map((s) => cardHtml(cardObj(s.id), { owned: countOf(s.id) > 0, count: countOf(s.id), isNew: countOf(s.id) > 0 && !sn.has(s.id) })).join("")}<div class="tcg-sec">Catalogue</div>` : "";
    if (!curList.length) { el.insertAdjacentHTML("beforeend", `<div class="empty-note tcg-empty">Aucune carte pour ce filtre.</div>`); return; }
    appendChunk();
  }
  function syncToolbar() {
    document.querySelectorAll("#cards-root [data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    const s = document.getElementById("cards-sort"); if (s) s.value = sortBy;
  }
  function render() {
    const root = document.getElementById("cards-root"); if (!root) return;
    if (!C.user) { root.innerHTML = `<div class="empty-note">Connecte-toi pour ouvrir des packs et collectionner les cartes du catalogue.<br><button type="button" class="cta-btn fill-btn mt" data-action="open-auth">Me connecter</button></div>`; return; }
    if (!doc) { root.innerHTML = `<div class="tcg-skeleton" aria-busy="true" aria-label="Chargement de ta collection"><i></i><i></i><i></i></div>`; return; }
    if (!document.getElementById("tcg-grid")) {
      root.innerHTML = `<div class="tcg-hero" id="tcg-hero"></div>
        <div class="tcg-tools"><input type="search" id="cards-search" placeholder="Rechercher une carte…" aria-label="Rechercher une carte" value="${C.esc(query)}" autocomplete="off">
          <select id="cards-rar" aria-label="Rareté"><option value="all">Toutes raretés</option>${ORDER.map((r) => `<option value="${r}">${RAR[r].label}</option>`).join("")}</select>
          <span class="tcg-count" id="tcg-count" aria-live="polite"></span></div>
        <div class="chip-row" role="group" aria-label="Filtrer">${[["all", "Toutes"], ["owned", "Possédées"], ["missing", "Manquantes"], ["dups", "Doublons"], ["wish", "★ Wishlist"]].map(([k, l]) => `<button type="button" class="chip" data-cf="${k}">${l}</button>`).join("")}</div>
        <div class="tcg-toolbar"><div class="seg" role="group" aria-label="Affichage">${[["grid", "Grille"], ["compact", "Compact"], ["albums", "Albums"]].map(([k, l]) => `<button type="button" data-view="${k}" aria-pressed="false">${l}</button>`).join("")}</div>
          <select id="cards-sort" aria-label="Trier par">${[["num", "Tri : numéro"], ["rar", "Tri : rareté"], ["owned", "Tri : possédées d'abord"], ["power", "Tri : puissance"], ["speed", "Tri : vitesse"], ["zero", "Tri : 0 à 100"], ["brand", "Tri : marque"]].map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div>
        <div class="tcg-grid" id="tcg-grid"></div>`;
    }
    root.querySelectorAll("[data-cf]").forEach((b) => { const on = b.dataset.cf === filter; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); });
    const sel = document.getElementById("cards-rar"); if (sel) sel.value = rarFilter;
    syncToolbar(); renderHero(); renderGrid();
  }

  // ------------------------------------------------------------------ profil public : collection et wishlist
  async function renderProfile(uid) {
    let el = document.getElementById("pub-cards");
    if (!el) { const a = document.getElementById("pub-gamify") || document.getElementById("pub-badges-slot"); if (!a) return; el = document.createElement("div"); el.id = "pub-cards"; el.className = "game-zone"; a.insertAdjacentElement("afterend", el); }
    el._uid = uid; el.innerHTML = "";
    try {
      await loadSpecials();
      const [snap, w] = await Promise.all([col(uid).get(), loadWish(uid)]);
      if (el._uid !== uid) return;
      const d = snap.exists ? snap.data() : { owned: {} };
      const ids = Object.keys(d.owned || {}).filter((k) => d.owned[k] > 0 && cardObj(k));
      const wl = w.filter((id) => cardObj(id) && !(d.owned && d.owned[id] > 0));
      if (!ids.length && !wl.length) return;
      ids.sort((a, b) => (G.isSpecial(b) ? 1 : 0) - (G.isSpecial(a) ? 1 : 0) || ORDER.indexOf(rarityOf(cardObj(a))) - ORDER.indexOf(rarityOf(cardObj(b))));
      const mine = C.user && C.user.uid !== uid ? await myCollection() : null;
      const offer = (id) => mine && (mine.owned[id] || 0) > 1;
      el.innerHTML = `${ids.length ? `<div class="panel-section-title">Collection de cartes <span class="lap-meta">${(d.count || 0)} / ${C.cars.length}${d.specials ? " · ✦ " + d.specials : ""}</span></div>
        <div class="tcg-strip">${ids.slice(0, 10).map((id) => `<a href="${G.isSpecial(id) ? "#/jouer/cartes" : "#/voiture/" + encodeURIComponent(id)}" class="tcg-mini-link">${cardHtml(cardObj(id), { cls: "tcg-mini" })}</a>`).join("")}</div>` : ""}
        ${wl.length ? `<div class="panel-section-title">★ Cartes recherchées <span class="lap-meta">${wl.length}</span></div>
        <div class="wish-list">${wl.slice(0, 12).map((id) => { const c = cardObj(id); return `<span class="wish-chip ${offer(id) ? "match" : ""}" title="${C.esc(c.brand + " " + c.model)}">${C.esc(String(c.model).replace(/\s*\(.*$/, "").slice(0, 26))}${offer(id) ? " · tu l'as en double" : ""}</span>`; }).join("")}</div>
        ${mine && wl.some(offer) ? `<a class="cta-btn fill-btn compact-btn" href="#/jouer/echanges" data-trade-with="${C.esc(uid)}">🔄 Proposer un échange</a>` : ""}` : ""}`;
    } catch (e) { /* collection privée ou règles non publiées */ }
  }
  async function myCollection() { try { await load(); return doc; } catch (_) { return null; } }

  window.MACards = { pool: () => C.cars, rarityOf, numberOf, cardHtml, cardObj, RAR, load: (f) => load(f), mine: () => doc, myWish: () => wish || [], loadSpecials, specials: () => specials, loadWish, applyDoc, isOwned, countOf };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("play", { enter: async (p) => {
      if (p.tab !== "cartes") return;
      render();
      await load().catch(() => {});
      render();
    } });
    ctx.Router.register("pilot", { enter: (p) => renderProfile(p.uid) });
    document.addEventListener("ma:auth", () => { doc = null; loadedFor = null; wish = null; if (ctx.Router.is("play", { tab: "cartes" })) { render(); load(true).then(render).catch(() => {}); } });
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-dust-log]")) { showDustLog(); return; }
      const pk = e.target.closest("[data-pack]");
      if (pk) { openPack(pk.dataset.pack); return; }
      const cf = e.target.closest("[data-cf]");
      if (cf) { filter = cf.dataset.cf; render(); return; }
      const vw = e.target.closest("#cards-root [data-view]");
      if (vw) { view = vw.dataset.view; store.set("ma_cards_view", view); syncToolbar(); renderGrid(); return; }
      if (e.target.closest("#cards-root [data-battle]")) { if (window.MABattle) window.MABattle.open(); return; }
      const cd = e.target.closest("#cards-root [data-card]");
      if (cd) showDetail(cd.dataset.card, curList.map((c) => c.id));
    });
    document.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("#cards-root [data-card]")) { e.preventDefault(); showDetail(e.target.dataset.card, curList.map((c) => c.id)); }
    });
    document.addEventListener("pointermove", tiltMove, { passive: true });
    document.addEventListener("toggle", (e) => { const d = e.target; if (d && d.matches && d.matches(".tcg-album") && d.open) fillAlbum(d); }, true);
    document.addEventListener("input", (e) => { if (e.target.id === "cards-search") { query = e.target.value; renderGrid(); } });
    document.addEventListener("change", (e) => {
      if (e.target.id === "cards-rar") { rarFilter = e.target.value; renderGrid(); }
      else if (e.target.id === "cards-sort") { sortBy = e.target.value; store.set("ma_cards_sort", sortBy); renderGrid(); }
    });
    document.addEventListener("ma:game", () => { if (doc && ctx.Router.is("play", { tab: "cartes" })) load(true).then(render).catch(() => {}); });
  });
})();
