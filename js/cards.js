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
    rarityMap = G.computeRarities(cars.map((c) => ({ id: c.id, power: c.stats.power, speed: c.stats.speed || 0, zero: c.stats.zero || 0, name: (c.brand + " " + c.model).trim(), brand: c.brand, category: c.category, year: G.yearOf(c) })));
    cars.forEach((c, i) => numbering.set(c.id, i + 1));
  }
  let rarOv = {}, rarAuto = {}, circPhotos = {};
  let cardPct = {}, pctTotal = 0;
  async function loadCardPct() { try { const s = await C.db.collection("config").doc("cardStats").get(); if (s.exists) { cardPct = s.data().map || {}; pctTotal = s.data().total || 0; } } catch (_) { /* pas de stats */ } }
  const pctHtml = (id) => pctTotal >= 5 ? `<p class="tcg-hint cg-realpct">Possédée par <b>${String(cardPct[id] || 0).replace(".", ",")} %</b> des pilotes</p>` : "";
  async function loadCircPhotos() { try { const s = await C.db.collection("config").doc("circuitPhotos").get(); circPhotos = s.exists && s.data().map ? s.data().map : {}; } catch (_) { /* pas de photos */ } }
  async function loadRarOv() { loadCircPhotos(); loadCardPct(); try { const a = await C.db.collection("config").doc("rarityAuto").get(); rarAuto = a.exists && a.data().map ? a.data().map : {}; } catch (_) { /* calcul local */ } try { const s = await C.db.collection("config").doc("rarities").get(); rarOv = s.exists && s.data().map ? s.data().map : {}; } catch (_) { /* pas de surcharge */ } }
  const rarityOf = (car) => { if (car.mine) return "mine"; if (car.special) return "special"; if (car.circuit || car.livery) { const o = rarOv[car.id]; return o && ORDER.indexOf(o) >= 0 ? o : car.rar; } indexCars(); const o = rarOv[car.id]; if (o && ORDER.indexOf(o) >= 0) return o; const sv = rarAuto[car.id]; if (sv && ORDER.indexOf(sv) >= 0) return sv; return rarityMap.get(car.id) || "common"; };
  const numberOf = (car) => { indexCars(); return numbering.get(car.id) || 0; };
  /** une carte, qu'elle vienne du catalogue ou d'une édition limitée */
  function cardObj(id) {
    const sp = specials.get(id);
    if (sp) return { id, brand: sp.edition || "Édition limitée", model: sp.name || id, image: sp.image || "", images: Array.isArray(sp.images) ? sp.images.slice(0, 12) : [], category: "", years: "", stats: { power: Number(sp.power) || 0, speed: Number(sp.speed) || 0, zero: Number(sp.zero) || null }, special: sp };
    if (G.isLivery && G.isLivery(id)) { const r = G.LIVERIES.find((x) => x[0] === id), base = r && C.carsById.get(r[1]); return base ? Object.assign({}, base, { id, livery: true, baseId: r[1], liveryName: r[2], rar: r[3], model: String(base.model || "").replace(/\s*\(.*$/, "") + " · " + r[2] }) : null; }
    if (G.isCircuit && G.isCircuit(id)) { const c = G.CIRCUIT_BY_ID.get(id); return c ? Object.assign({}, c, { image: circPhotos[id] || "", images: [], category: "Circuit", years: String(c.since), stats: { power: 0, speed: 0, zero: null } }) : null; }
    return C.carsById.get(id) || null;
  }
  const circNo = (car) => { const i = G.CIRCUIT_CARDS.findIndex((r) => r[0] === car.id); return "C" + String(i + 1).padStart(2, "0"); };
  /** illustration d'un circuit sans tracé officiel : ruban d'asphalte généré à partir de l'identifiant (stable, jamais présenté comme le vrai plan) */
  function illusSvg(car) {
    let h = 2166136261; for (const ch of car.id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    const rnd = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
    const kind = /daytona|talladega|indianapolis/.test(car.id) ? "oval" : /pikes|goodwood-hill/.test(car.id) ? "hill" : /mille|targa|pescara|charade|nordschleife|le-mans$|spa-old|bremgarten/.test(car.id) ? "road" : "circuit";
    let pts = [];
    if (kind === "oval") { for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push([50 + Math.cos(a) * 38, 50 + Math.sin(a) * 22 * (1 + (i % 8 === 0 ? 0.04 : 0))]); } }
    else if (kind === "hill") { for (let i = 0; i < 9; i++) pts.push([18 + (i % 2 ? 64 : 0) * (0.7 + rnd() * 0.3) + (i % 2 ? 0 : rnd() * 10), 90 - i * 10]); }
    else { const n = kind === "road" ? 11 : 10; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, r = 20 + rnd() * 24; pts.push([50 + Math.cos(a) * r * (kind === "road" ? 1.1 : 1), 50 + Math.sin(a) * r * 0.85]); } }
    const closed = kind !== "hill", L = pts.length, P = (i) => pts[closed ? (i + L) % L : Math.max(0, Math.min(L - 1, i))];
    let d = "M" + P(0)[0].toFixed(1) + " " + P(0)[1].toFixed(1);
    for (let i = 0; i < (closed ? L : L - 1); i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); d += "C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1); }
    if (closed) d += "Z";
    return `<svg class="tcg-trace tcg-illus" viewBox="0 0 100 100" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#2b2f36" stroke-width="4.6" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#f8fafc" stroke-width=".7" stroke-dasharray="2.2 2.2" stroke-linecap="round"/><circle cx="${P(0)[0].toFixed(1)}" cy="${P(0)[1].toFixed(1)}" r="2.6" fill="currentColor"/></svg>`;
  }
  function traceSvg(car) {
    const d = (window.MACircuitTraces || {})[car.id];
    if (!d) return illusSvg(car);
    return d ? `<svg class="tcg-trace" viewBox="0 0 100 100" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></svg>` : `<span class="tcg-q" aria-hidden="true">🏁</span>`;
  }
  const isOwned = (id) => !!(doc && (doc.owned[id] || 0) > 0);
  const countOf = (id) => (doc && doc.owned[id]) || 0;

  // ----- cartes à plusieurs images : une image se débloque à chaque nouvelle copie obtenue (pas un doublon)
  function picInfo(car) {
    if (!car || car.special || car.mine || !G.picUrls) return null;
    const urls = G.picUrls(car).filter((u) => C.safeUrl(u)); if (urls.length < 2) return null;
    const keys = urls.map(G.picKey), have = doc ? G.picsHave(doc, car.id, keys) : [];
    return { urls, keys, have };
  }
  const picPrefKey = (id) => "ma_pic_" + id;
  function shownUrl(car, pi) {
    let k = ""; try { k = localStorage.getItem(picPrefKey(car.id)) || ""; } catch (_) { /* stockage indisponible */ }
    const key = k && pi.have.indexOf(k) >= 0 ? k : pi.have[0], i = pi.keys.indexOf(key);
    return pi.urls[i >= 0 ? i : 0];
  }
  function cardHtml(car, o) {
    o = o || {};
    const esc = C.esc, r = rarityOf(car), R = RAR[r] || { label: "Ma voiture" }, owned = o.owned !== false, sp = car.special, lv = Math.max(1, Math.min(5, Number(o.lv) || 1));
    const pi = owned && !sp ? picInfo(car) : null, cardImage = o.image || (pi && pi.have.length ? shownUrl(car, pi) : car.image);
    const img = cardImage && C.safeUrl(cardImage) ? `<img class="${owned ? "" : "tcg-ghost"}" src="${esc(C.safeUrl(cardImage))}" alt="" loading="lazy" decoding="async" draggable="false" data-fallback="car">${owned ? "" : `<span class="tcg-q tcg-q-over" aria-hidden="true">?</span>`}` : `<span class="tcg-q" aria-hidden="true">${owned && sp ? "✦" : "?"}</span>`;
    const circ = !!car.circuit;
    const mosaic = owned && sp && Array.isArray(car.images) && car.images.length > 1 ? car.images.map((u) => C.safeUrl(u)).filter(Boolean).slice(0, 4) : null;
    const model = String(car.model || "").replace(/\s*\(.*$/, "");
    const hasStats = !sp || car.stats.power > 0;
    const bar = (v) => `<i style="--v:${Math.max(0, Math.min(1, v)).toFixed(2)}"></i>`;
    const st = car.stats || {}, z = Number(st.zero) || 0;
    const stats = circ
      ? `<div class="tcg-stats tcg-cstats"><span><b>${owned ? car.km.toString().replace(".", ",") : "?"}</b>km</span><span><b>${owned ? esc(car.countryLabel) : "?"}</b>pays</span><span><b>${owned ? car.since : "?"}</b>depuis</span></div>`
      : hasStats
      ? `<div class="tcg-stats"><span><b>${owned ? st.power : "?"}</b>ch${bar(owned ? st.power / 1200 : 0)}</span><span><b>${owned ? (st.speed || "—") : "?"}</b>km/h${bar(owned ? st.speed / 400 : 0)}</span><span><b>${owned ? (z || "—") : "?"}</b>0-100${bar(owned && z ? (14 - z) / 11 : 0)}</span></div>`
      : `<p class="tcg-note">${owned ? esc(sp.text || "") : ""}</p>`;
    const no = car.mine ? "MA" : circ ? circNo(car) : car.livery ? "LV" : sp ? "★" : "#" + String(numberOf(car)).padStart(3, "0");
    const color = sp && sp.color ? " tcg-c-" + esc(sp.color) : "";
    return `<div class="tcg tcg-${r}${color}${lv > 1 ? " has-lv lvl" + lv : ""} ${owned ? "" : "locked"} ${o.cls || ""}" data-card="${esc(car.id)}" role="button" tabindex="0" aria-label="${owned ? esc(car.brand + " " + model) : "Carte non débloquée " + no}, ${R.label}">
      <div class="tcg-art ${mosaic ? "tcg-mosaic m" + mosaic.length : ""}${circ && !(cardImage && owned) ? " tcg-circ" : ""}">${circ && !(cardImage && owned) ? (owned ? traceSvg(car) : `<span class="tcg-q" aria-hidden="true">?</span>`) : mosaic ? mosaic.map((u) => `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" draggable="false" data-fallback="car">`).join("") : img}<i class="tcg-foil" aria-hidden="true"></i>${owned && isLk(car.id) ? `<i class="tcg-lk" aria-hidden="true">🔒</i>` : ""}${owned && !sp && car.drives && car.drives[0] && window.MATrack ? `<span class="tcg-drv" title="${esc(window.MATrack.DRIVES[car.drives[0]][0])}">${window.MATrack.driveIcon(car.drives[0], 14)}</span>` : ""}</div><i class="tcg-holo" aria-hidden="true"></i>
      <div class="tcg-body"><span class="tcg-brand">${owned || sp ? esc(car.brand) : "—"}</span><b class="tcg-name">${owned || sp ? esc(model) : "Carte à débloquer"}</b>${stats}</div>
      ${lv > 1 ? `<i class="tcg-frame lv${lv}" aria-hidden="true"></i>` : ""}<span class="tcg-rar">${sp ? "✦ " : ""}${R.label}</span>${car.livery ? `<span class="tcg-livtag" title="Livrée célèbre">🎨</span>` : ""}<span class="tcg-no">${no}</span>
      ${pi ? `<span class="tcg-pics" title="Images débloquées : ${pi.have.length} sur ${pi.keys.length}"><i></i>${pi.have.length}/${pi.keys.length}</span>` : ""}
      ${o.count > 1 ? `<span class="tcg-dup">×${o.count}</span>` : ""}${o.isNew ? `<span class="tcg-new-pill">NEW</span>` : ""}${o.wish ? `<span class="tcg-wish" title="Dans ta wishlist" aria-label="Dans ta wishlist">★</span>` : ""}
    </div>`;
  }

  // ------------------------------------------------------------------ données
  const col = (uid) => C.db.collection("collections").doc(uid);
  const blank = () => Object.assign(G.blankCollection(), { bonus: 0 });
  const API = (name, data) => window.MAGameAPI.call(name, data);
  function applyDoc(v) {
    doc = Object.assign(blank(), doc || {}, v); loadedAt = Date.now();
    G.recount(doc);   // le compteur se recalcule toujours depuis les cartes possédées (circuits et livrées inclus)
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
    const [snap, w] = await Promise.all([col(uid).get().catch(() => null), loadWish(uid), loadSpecials(), loadRarOv()]);
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

  /** « Je cherche cette carte » : ajoute la carte d'une vitrine à ma wishlist (sans jamais la retirer) */
  async function addWish(id, btn) {
    if (!C.requireLogin()) return;
    await load().catch(() => {});
    if (countOf(id) > 0) { C.toast("Tu as déjà cette carte.", "ok"); return; }
    if ((wish || []).includes(id)) { C.toast("Elle est déjà dans ta wishlist.", "ok"); return; }
    await toggleWish(id);
    if (btn && (wish || []).includes(id)) { btn.disabled = true; btn.textContent = "★ Dans ta wishlist"; }
  }

  // ------------------------------------------------------------------ packs et fabrication (serveur)
  /** décor d'un pack : drapeau du pays (bandes de couleur), plaque centrale lisible quel que soit le fond */
  function packTheme(id) {
    if (id === "circuit") return { label: "Circuit", f: "world", style: "--p1:#111827;--p2:#ef4444;--p3:#f9fafb" };
    if (id === "prestige") return { label: "Prestige", f: "world", style: "--p1:#1c1917;--p2:#d4af37;--p3:#fef3c7" };
    const tp = G.THEME_PACKS && G.THEME_PACKS[id]; if (tp) return { label: tp.name, f: "world", style: tp.style };
    const k = (G.COUNTRIES || []).find((x) => x.id === id);
    return k ? { label: k.label, f: k.f, style: `--p1:${k.c[0]};--p2:${k.c[1]};--p3:${k.c[2]}` } : { label: "Monde", f: "world", style: "--p1:#f59e0b;--p2:#78350f;--p3:#fbbf24" };
  }
  function packInner(id, sub) {
    const t = packTheme(id);
    return `<i class="pkart-flag" data-f="${t.f}" aria-hidden="true"></i><span class="pkart-plate"><small>MOTORAUTO</small><b>${C.esc(t.label)}</b><em>${C.esc(sub || "3 cartes")}</em></span>`;
  }
  async function openPack(kind, packId, offer) {
    if (busy || !C.requireLogin()) return;
    const shopId = kind === "shop" ? (packId || "world") : "";
    const theme = shopId && shopId !== "world" ? packTheme(shopId) : null;
    busy = true; renderHero();
    // le pack apparaît tout de suite pendant que le serveur tire les cartes (plus d'écran figé)
    mountOverlay("pack", "Ouverture de pack", `<div class="pk3 pk3-loading" id="pk3"><h2>${theme ? C.esc("Pack " + theme.label) : kind === "shop" ? "Ton pack cristal" : "Ton pack"}</h2><div class="pk3-pack ${C.esc(kind)}${theme ? " country" : ""} pk3-wait" ${theme ? `style="${theme.style}"` : ""} aria-hidden="true">${theme ? packInner(shopId) : `<b>MOTOR<span>AUTO</span></b>`}</div><p class="tcg-hint" role="status">Préparation du pack…</p></div>`);
    try {
      if (!doc) await load();
      const r = await API("openPack", shopId ? (offer ? { kind, pack: shopId, offer: true } : { kind, pack: shopId }) : { kind });
      missionToast(r);
      applyDoc(r.doc);
      showPack(r.cards.map((c) => { const car = cardObj(c.id), pi = picInfo(car), at = c.newPic && pi ? pi.keys.indexOf(c.newPic) : -1; return { car, fresh: c.fresh, newPic: at >= 0, image: at >= 0 ? pi.urls[at] : "", picN: c.picN, picTotal: c.picTotal, reward: c.reward || 0 }; }).filter((x) => x.car), r.dust, kind, r.bonus || 0, shopId);
    } catch (e) { closeOverlay(); C.toast(e.message, "err"); await load(true).catch(() => {}); }
    finally { busy = false; renderHero(); }
  }
  // ----- historique de poussière
  function showDustLog() {
    if (!doc) return;
    const log = (doc.dustLog || []).slice().reverse(), fmt = (t) => new Date(t).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const lo = mountOverlay("dustlog", "Historique des cristaux", `<div class="tcg-stage"><div class="dustlog"><h2>${window.MA.dustIcon(24)} Tes cristaux</h2><p class="dustlog-bal"><b>${doc.dust}</b> en réserve</p>
      ${log.length ? `<ul>${log.map((l) => `<li class="${l.n > 0 ? "gain" : "spend"}"><span>${C.esc(l.w || "")}<small>${fmt(l.t)}</small></span><b>${l.n > 0 ? "+" : "−"}${Math.abs(l.n)} ${window.MA.dustIcon(14)}</b></li>`).join("")}</ul>` : `<p class="tcg-hint">Rien pour l'instant : les cristaux viennent des doublons et des défis.</p>`}
      <div class="tcg-actions"><button type="button" class="cta-btn btn-ghost" data-close>Fermer</button></div></div></div>`);
    lo.addEventListener("click", (e) => { if (e.target === lo || e.target.closest("[data-close]")) closeOverlay(); });
  }
  async function upgrade(id) {
    if (busy || !C.requireLogin()) return;
    busy = true;
    try {
      const r = await API("upgradeCard", { id });
      applyDoc(r.doc); buzz([20, 30, 40]); C.toast("Carte améliorée : niveau " + r.level + " (" + G.LV_NAMES[r.level] + ").", "ok"); missionToast(r);
    } catch (e) { C.toast(e.message, "err"); }
    finally { busy = false; refreshDetail(id); renderGrid(); renderHero(); }
  }
  async function buyOffer(id) {
    if (busy || !C.requireLogin()) return;
    busy = true; renderHero();
    try {
      const r = await API("craftCard", { id, offer: true });
      applyDoc(r.doc); C.toast("Carte du jour achetée !", "ok"); missionToast(r);
    } catch (e) { C.toast(e.message, "err"); await load(true).catch(() => {}); }
    finally { busy = false; renderHero(); }
  }
  // ------------------------------------------------------------------ roue quotidienne et calendrier de l'Avent
  const WHEEL_SEG = ["dust", "pack", "dust", "pts", "dust", "freeze", "dust", "pack", "pts", "card"];
  const WHEEL_ICON = { dust: "💎", pack: "🎁", freeze: "❄️", pts: "⭐", card: "🃏" };
  function wheelHtml() {
    if (!doc || !C.user) return "";
    const ready = doc.wheelDay !== day();
    return `<section class="cg-block cg-wheelblk" aria-label="Roue du jour"><header class="cg-bh"><h3>Roue du jour</h3><span class="cg-sub">1 tour gratuit par jour · ${ready ? "prêt !" : "reviens dans <b data-nextday>" + leftToday() + "</b>"}</span></header>
      <div class="wh-row"><span class="wh-mini" aria-hidden="true">🎡</span><p class="tcg-hint">Cristaux, pack bonus, gel de série, points de saison… et parfois une carte rare ou épique.</p><button type="button" class="cta-btn fill-btn" data-wheel ${ready && !busy ? "" : "disabled"}>${ready ? "Tourner la roue" : "Déjà tournée"}</button></div></section>`;
  }
  function wheelOpen() {
    if (busy || !C.requireLogin()) return;
    const o = mountOverlay("wheel", "Roue du jour", `<div class="wh-box"><h2>🎡 Roue du jour</h2><div class="wh-wrap"><i class="wh-pin" aria-hidden="true">▼</i><div class="wh-wheel" id="wh-wheel">${WHEEL_SEG.map((k, i) => `<span style="--a:${i * 36 + 18}deg">${WHEEL_ICON[k]}</span>`).join("")}</div></div><p class="wh-res" id="wh-res" aria-live="polite">Lance la roue !</p><div class="tcg-actions"><button type="button" class="cta-btn fill-btn" id="wh-go">Tourner</button><button type="button" class="cta-btn btn-ghost" data-close>Fermer</button></div></div>`);
    o.addEventListener("click", async (e) => {
      if (e.target === o || e.target.closest("[data-close]")) return closeOverlay();
      if (!e.target.closest("#wh-go") || busy) return;
      busy = true; const go = o.querySelector("#wh-go"); go.disabled = true;
      try {
        const r = await API("spinWheel"), pr = r.prize, idx = []; WHEEL_SEG.forEach((k, i) => { if (k === pr.k) idx.push(i); });
        const seg = idx[Math.floor(Math.random() * idx.length)] || 0, turn = 360 * 5 + (360 - (seg * 36 + 18));
        const w = o.querySelector("#wh-wheel"); w.style.setProperty("--to", turn + "deg"); void w.offsetWidth; w.classList.add("spin"); buzz(15);
        applyDoc(r.doc);
        setTimeout(() => {
          const res = o.querySelector("#wh-res"); if (!res) return;
          res.innerHTML = `<b>${WHEEL_ICON[pr.k]} Tu gagnes ${C.esc(pr.text)} !</b>`; buzz([30, 40, 60]);
          if (pr.k === "card" && pr.cardId && cardObj(pr.cardId)) { go.textContent = "Voir la carte"; go.disabled = false; go.onclick = () => { closeOverlay(); setTimeout(() => showDetail(pr.cardId), 200); }; }
          else go.hidden = true;
          render();
        }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 3600);
      } catch (er) { C.toast(er.message, "err"); go.disabled = false; }
      finally { busy = false; }
    });
  }
  /** état du calendrier : à ouvrir maintenant, en attente de demain, ou en attente du 1er décembre */
  function adventState() {
    const now = Date.now(), at = G.adventToday(now), opened = doc && doc.advent && at && doc.advent.y === at.y ? doc.advent.o : [];
    if (!at) {
      const y = Number(G.dayKey(now).slice(0, 4));
      let t = G.parisMidnight(y + "-12-01"); if (t <= now) t = G.parisMidnight((y + 1) + "-12-01");
      return { mode: "wait", left: t - now, opened: [], at: null };
    }
    let next = 0;
    if (at.d >= 1 && opened.indexOf(at.d) < 0) next = at.d;                                   // la case du jour
    else for (let n = 1; n <= at.d; n++) if (opened.indexOf(n) < 0) { next = n; break; }       // case manquée, rattrapable jusqu'au 31
    if (next) return { mode: "ready", n: next, opened, at };
    if (at.d < 24) return { mode: "tomorrow", n: at.d + 1, left: Math.max(0, G.parisMidnight(G.dayKey(now + 86400000)) - now), opened, at };
    return { mode: "done", opened, at };
  }
  function fmtLeft(ms) {
    const m = Math.max(0, Math.floor(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return d ? d + " j " + h + " h" : h ? h + " h " + String(mm).padStart(2, "0") + " min" : mm + " min";
  }
  function adventBtnHtml() {
    const st = adventState();
    const lab = st.mode === "ready" ? ["Case " + st.n + " à ouvrir", "récompense du jour"] : st.mode === "tomorrow" ? ["Case " + st.n + " dans", fmtLeft(st.left)] : st.mode === "done" ? ["Calendrier terminé", "à l'an prochain"] : ["Ouvre dans", fmtLeft(st.left)];
    return `<button type="button" class="cg-gift adv ${st.mode === "ready" ? "ready" : "off-soft"}" data-advent-go ${busy ? "disabled" : ""} aria-label="Calendrier de l'Avent : ${C.esc(lab[0] + " " + lab[1])}"><span class="cg-gi">🎄</span><b>${C.esc(lab[0])}</b><small${st.mode === "tomorrow" || st.mode === "wait" ? " data-adv-left" : ""}>${C.esc(lab[1])}</small></button>`;
  }
  function adventHtml() {
    if (!doc) return "";
    const st = adventState(), at = st.at || { y: 0, d: 0 }, opened = st.opened;
    const cells = Array.from({ length: 24 }, (_, i) => {
      const n = i + 1, got = opened.indexOf(n) >= 0, can = !got && n <= at.d, r = G.adventReward(n);
      return `<button type="button" class="adv-c ${got ? "got" : can ? "can" : "lock"}${n === 24 ? " big" : ""}" ${can ? `data-advent="${n}"` : "disabled"} aria-label="Case ${n}${got ? " ouverte" : can ? " à ouvrir" : " pas encore"}"><b>${n}</b><span>${got ? "✓" : can ? (n === 24 ? "🎄" : "🎁") : "🔒"}</span>${got ? `<small>${C.esc(G.adventLabel(r).replace(/ cristaux/, "💎"))}</small>` : ""}</button>`;
    }).join("");
    const sub = st.mode === "wait" ? "ouvre le 1er décembre · dans <b data-adv-left>" + fmtLeft(st.left) + "</b>" : opened.length + " / 24 · une case par jour jusqu'au 24 décembre · packs Prestige offerts les cases 12 et 24";
    return `<section class="cg-block cg-advent" id="cg-advent" aria-label="Calendrier de l'Avent"><header class="cg-bh"><h3>🎄 Calendrier de l'Avent</h3><span class="cg-sub">${sub}</span></header><div class="adv-grid">${cells}</div></section>`;
  }
  async function adventOpen(n) {
    if (busy || !C.requireLogin()) return;
    busy = true;
    try { const r = await API("openAdvent", { day: n }); applyDoc(r.doc); C.toast(`🎄 Case ${n} : ${r.text} !`, "ok"); buzz([20, 30, 40]); }
    catch (e) { C.toast(e.message, "err"); }
    finally { busy = false; render(); }
  }
  const isLk = (id) => !!(doc && doc.locked && doc.locked[id]);
  async function toggleLock(id) {
    if (busy || !C.requireLogin()) return;
    busy = true;
    try {
      const on = !isLk(id), r = await API("lockCard", { id, on });
      applyDoc(r.doc); C.toast(on ? "🔒 Carte verrouillée : ni vente, ni échange, ni fusion, ni recyclage." : "Carte déverrouillée.", "ok"); refreshDetail(id); renderGrid();
    } catch (e) { C.toast(e.message, "err"); }
    finally { busy = false; }
  }
  /** origine de chaque exemplaire : 6 dernières arrivées + total */
  function histHtml(id) {
    const h = doc && doc.hist && doc.hist[id], L = G.HIST_LABEL || {};
    if (countOf(id) < 1) return "";
    const fmt = (ms) => { const d = new Date(ms); return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "Europe/Paris" }); };
    if (!h || !h.e || !h.e.length) return `<details class="cg-hist"><summary>Historique de la carte</summary><p class="tcg-hint">Origine inconnue (avant la mise en place de l'historique).</p></details>`;
    return `<details class="cg-hist"><summary>Historique de la carte · ${h.n} exemplaire${h.n > 1 ? "s" : ""} reçu${h.n > 1 ? "s" : ""}</summary><ul>${h.e.slice().reverse().map((x) => `<li><span>${C.esc(fmt(x[0]))}</span><b>${C.esc(L[x[1]] || x[1])}</b></li>`).join("")}</ul>${h.n > h.e.length ? `<p class="tcg-hint">Les ${h.e.length} plus récents sont affichés.</p>` : ""}</details>`;
  }
  // ------------------------------------------------------------------ recyclage manuel des doublons
  function recycleOpen() {
    if (!doc || !C.requireLogin()) return;
    const rows = Object.keys(doc.owned || {}).filter((id) => countOf(id) > 1 && !isLk(id) && !G.isSpecial(id) && cardObj(id)).map((id) => ({ id, car: cardObj(id), spare: countOf(id) - 1, unit: RAR[rarityOf(cardObj(id))].dust || 0 })).filter((r) => r.unit > 0)
      .sort((a, b) => b.unit - a.unit || a.car.brand.localeCompare(b.car.brand));
    const sel = {};
    const o = mountOverlay("recycle", "Recycler des doublons", `<div class="rc-box"><h2>♻️ Recycler des doublons</h2><p class="tcg-hint">Tu gardes toujours 1 exemplaire. Les cartes verrouillées 🔒 n'apparaissent pas.</p>
      ${rows.length ? `<div class="rc-list">${rows.map((r) => `<div class="rc-row" data-id="${C.esc(r.id)}"><span class="rc-n"><b>${C.esc(r.car.brand + " " + String(r.car.model).replace(/\s*\(.*$/, ""))}</b><small class="${rarityOf(r.car)}">${RAR[rarityOf(r.car)].label} · +${r.unit} / doublon</small></span><span class="rc-q"><button type="button" data-d="-1" aria-label="Moins">−</button><output>0</output><button type="button" data-d="1" aria-label="Plus">+</button><small>/ ${r.spare}</small></span></div>`).join("")}</div>` : `<div class="empty-note">Aucun doublon à recycler pour l'instant.</div>`}
      <div class="rc-foot"><button type="button" class="cta-btn btn-ghost" id="rc-all" ${rows.length ? "" : "disabled"}>Tout sélectionner</button><button type="button" class="cta-btn fill-btn" id="rc-go" disabled>Recycler</button><button type="button" class="cta-btn btn-ghost" data-close>Fermer</button></div></div>`);
    const upd = () => {
      const tot = Object.keys(sel).reduce((a, id) => a + sel[id], 0), gain = rows.reduce((a, r) => a + (sel[r.id] || 0) * r.unit, 0), go = o.querySelector("#rc-go");
      go.disabled = !tot; go.innerHTML = tot ? `Recycler ${tot} doublon${tot > 1 ? "s" : ""} · +${gain} ${window.MA.dustIcon(14)}` : "Recycler";
    };
    const set = (id, v) => { const r = rows.find((x) => x.id === id); v = Math.max(0, Math.min(r.spare, v)); if (v) sel[id] = v; else delete sel[id]; const out = o.querySelector(`.rc-row[data-id="${CSS.escape(id)}"] output`); if (out) out.textContent = v; };
    o.addEventListener("click", async (e) => {
      if (e.target === o || e.target.closest("[data-close]")) return closeOverlay();
      const b = e.target.closest("[data-d]");
      if (b) { const id = b.closest(".rc-row").dataset.id; set(id, (sel[id] || 0) + Number(b.dataset.d)); upd(); return; }
      if (e.target.closest("#rc-all")) { let left = G.RECYCLE_MAX; rows.forEach((r) => { const v = Math.min(r.spare, left); left -= v; set(r.id, v); }); upd(); return; }
      if (e.target.closest("#rc-go")) {
        const items = Object.keys(sel).map((id) => ({ id, n: sel[id] }));
        if (items.length > G.RECYCLE_MAX) { C.toast(`${G.RECYCLE_MAX} cartes différentes au maximum par recyclage.`, "err"); return; }
        if (busy) return; busy = true;
        try { const r = await API("recycleCards", { items }); applyDoc(r.doc); C.toast(`♻️ +${r.gain} cristaux (${r.count} doublon${r.count > 1 ? "s" : ""} recyclé${r.count > 1 ? "s" : ""})`, "ok"); closeOverlay(); }
        catch (er) { C.toast(er.message, "err"); }
        finally { busy = false; render(); }
      }
    });
  }
  async function craft(id) {
    if (busy || !C.requireLogin()) return;
    const car = cardObj(id); if (!car) return;
    const cost = RAR[rarityOf(car)].craft; if (!cost) { C.toast("Une carte Légende se gagne en complétant un album.", "err"); return; }
    if (!confirm(`Fabriquer « ${car.brand} ${car.model} » pour ${cost} cristaux ?`)) return;
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
  const BURST = { rare: "#3b82f6", epic: "#a855f7", legendary: "#f59e0b", shiny: "#ff7ad9", mythic: "#fde047", special: "#cbd5e1" };
  const buzz = () => {};   // vibrations supprimées
  function sparks(el, n) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4, d = 70 + Math.random() * 80, s = document.createElement("i");
      s.className = "spark"; s.style.setProperty("--dx", Math.round(Math.cos(a) * d) + "px"); s.style.setProperty("--dy", Math.round(Math.sin(a) * d) + "px");
      el.appendChild(s); setTimeout(() => s.remove(), 1000);
    }
  }
  function showPack(results, dust, kind, bonus, shopId) {
    const theme = shopId && shopId !== "world" ? packTheme(shopId) : null;
    const rank = (r) => (r === "special" ? ORDER.length + 2 : ORDER.length - ORDER.indexOf(r));
    const best = results.reduce((b, r) => (rank(rarityOf(r.car)) > rank(rarityOf(b.car)) ? r : b), results[0]);
    const o = mountOverlay("pack", "Ouverture de pack", `<div class="pk3" id="pk3"><h2>${theme ? C.esc("Pack " + theme.label) : "Ton pack"}</h2><button type="button" class="pk3-pack ${C.esc(kind || "daily")}${theme ? " country" : ""}" id="pk3-open" ${theme ? `style="${theme.style}"` : ""} aria-label="Ouvrir le pack"> ${theme ? packInner(shopId) : `<b>MOTOR<span>AUTO</span></b>`}</button><p class="tcg-hint">Touche le pack pour l'ouvrir</p></div>`);
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
        <div class="tcg-flips">${results.map((r, i) => `<div class="flip deal" style="--i:${i}" data-i="${i}" data-r="${rarityOf(r.car)}" role="button" tabindex="0" aria-label="Révéler la carte ${i + 1}"><div class="flip-in"><div class="flip-face flip-back"><span class="fb-frame" aria-hidden="true"></span><svg class="fb-mark" viewBox="180 280 660 466" aria-hidden="true"><polygon points="415,288 544,288 320,736 192,736"/><polygon points="703,288 832,288 608,736 480,736"/></svg><b>MOTOR<span>AUTO</span></b><small>Révéler</small><i class="fb-shine" aria-hidden="true"></i></div><div class="flip-face flip-front">${cardHtml(r.car, r.newPic ? { image: r.image } : null)}<span class="tcg-tag ${r.fresh || r.newPic ? "new" : "dup"}">${r.fresh ? "NOUVELLE" : r.newPic ? "NOUVELLE IMAGE " + r.picN + "/" + r.picTotal + (r.reward ? " · +" + r.reward : "") : "DOUBLON +" + RAR[rarityOf(r.car)].dust}</span></div></div><i class="flip-ring" aria-hidden="true"></i></div>`).join("")}</div>
        <div class="tcg-actions"><button type="button" class="cta-btn btn-ghost" id="tcg-all">Tout révéler</button></div>
        <div class="pk3-sum" id="tcg-sum" hidden></div>
        <div class="tcg-actions" id="tcg-end" hidden><button type="button" class="cta-btn fill-btn" id="tcg-done">Terminer</button></div>`;
      let shown = 0;
      const SUSP = { epic: 450, legendary: 900, shiny: 1200, special: 1200, mythic: 1400 };
      const reveal = (el) => {
        if (el.classList.contains("on") || el.classList.contains("pend")) return;
        const w = SUSP[el.dataset.r];
        if (w && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
          el.classList.add("pend", "susp-" + el.dataset.r); buzz([10, 60, 10]); o.classList.add("dim");
          return void setTimeout(() => { el.classList.remove("pend"); o.classList.remove("dim"); doReveal(el); }, w);
        }
        doReveal(el);
      };
      const doReveal = (el) => {
        if (el.classList.contains("on")) return;
        el.classList.add("on"); shown++;
        const rr = el.dataset.r;
        if (rr === "rare") buzz(15);
        else if (rr === "epic") { sparks(el, 10); buzz([20, 30, 20]); }
        else if (rr === "legendary" || rr === "shiny" || rr === "special" || rr === "mythic") { sparks(el, 18); buzz([30, 40, 60]); }
        if (BURST[rr] && rr !== "rare") { o.style.setProperty("--burst", BURST[rr]); o.classList.remove("flash"); void o.offsetWidth; o.classList.add("flash"); }
        if (shown === results.length) finish();
      };
      const finish = () => {
        const news = results.filter((r) => r.fresh).length, pics = results.filter((r) => r.newPic).length, dups = results.length - news - pics;
        const sum = o.querySelector("#tcg-sum");
        sum.innerHTML = `<span>${news} nouvelle${news > 1 ? "s" : ""}</span>${pics ? `<span>${pics} nouvelle${pics > 1 ? "s" : ""} image${pics > 1 ? "s" : ""}</span>` : ""}<span>${dups} doublon${dups > 1 ? "s" : ""}</span>${bonus ? `<span>+${bonus} ${window.MA.dustIcon(15)} collection d'images</span>` : ""}${dust ? `<span>+${dust} ${window.MA.dustIcon(15)} cristaux</span>` : ""}`;
        if (rank(rarityOf(best.car)) > 1) sum.insertAdjacentHTML("afterend", `<p class="pk3-best">Meilleure carte : ${C.esc(best.car.brand + " " + String(best.car.model).replace(/\s*\(.*$/, ""))} · ${RAR[rarityOf(best.car)].label}</p>`);
        sum.hidden = false; o.querySelector("#tcg-end").hidden = false; o.querySelector("#tcg-all").parentNode.hidden = true; o.querySelector("#tcg-hint").textContent = "";
        const again = kind === "shop" ? "" : doc && (doc.lastPack !== day() ? "daily" : doc.bonus > 0 ? "bonus" : "");
        const shopAgain = kind === "shop" && doc && shopId && G.PACKS[shopId] && doc.dust >= G.PACKS[shopId].cost ? shopId : "";
        if (shopAgain) o.querySelector("#tcg-end").insertAdjacentHTML("afterbegin", `<button type="button" class="cta-btn btn-ghost" id="tcg-again-shop">Racheter ce pack (${G.PACKS[shopId].cost} ${window.MA.dustIcon(14)})</button>`);
        const sa = o.querySelector("#tcg-again-shop"); if (sa) sa.addEventListener("click", () => { closeOverlay(); setTimeout(() => openPack("shop", shopAgain), 220); });
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
  let peek = "";
  const cnt = (id) => countOf(id) || (peek === id ? 1 : 0);
  /** infos de la fiche voiture reprises sur la carte : couple, transmission, circuit, motorisations (même source que la fiche) */
  function fiche(car) {
    const e = C.esc, T = window.MATrack, engs = (car.phases || []).reduce((a, p) => a.concat(p.engines || []), []);
    const tq = Math.max(0, ...engs.map((x) => Number(x.torque) || 0)), out = [];
    if (tq) out.push(`<dt>Couple</dt><dd>${tq} Nm</dd>`);
    if (engs.length) out.push(`<dt>Moteurs</dt><dd>${engs.length} version${engs.length > 1 ? "s" : ""}</dd>`);
    if (T && car.drives && car.drives.length) out.push(`<dt>Transmission</dt><dd>${e(car.drives.map((d) => (T.DRIVES[d] || [d])[0]).join(", "))}</dd>`);
    if (T && car.track && T.VERDICTS[car.track.verdict]) out.push(`<dt>Circuit</dt><dd>${e(T.VERDICTS[car.track.verdict][0])}</dd>`);
    return out.join("");
  }
  /** bloc « Carte à collectionner » affiché sur la fiche : même rareté et mêmes chiffres que dans le jeu */
  function sheetBadge(car) {
    try {
      if (!car || !C || !C.cars || !car.stats) return "";
      const r = rarityOf(car), R = RAR[r]; if (!R) return "";
      const n = doc ? countOf(car.id) : 0, st = car.stats;
      return `<div class="sheet-cardlink"><span class="scl-pill tcg-${r}">${C.esc(R.label)}</span><span class="scl-txt"><b>Carte #${String(numberOf(car)).padStart(3, "0")}</b><small>${st.power} ch · ${st.speed || "—"} km/h · ${st.zero ? st.zero + " s" : "—"} · ${n > 0 ? "dans ta collection" + (n > 1 ? " ×" + n : "") : "à collectionner"}</small></span><button type="button" class="cta-btn btn-ghost compact-btn" data-sheet-card="${C.esc(car.id)}">Voir la carte</button></div>`;
    } catch (_) { return ""; }
  }
  function backHtml(car, id) {
    const n = cnt(id), R = RAR[rarityOf(car)], sp = car.special, e = C.esc;
    if (n === 0) return `<h3>Carte à débloquer</h3><p>Ouvre des packs pour la trouver${sp ? "." : " ou fabrique-la avec des cristaux."}</p><dl><dt>Rareté</dt><dd>${R.label}</dd><dt>N°</dt><dd>${sp ? "★" : car.circuit ? circNo(car) : "#" + String(numberOf(car)).padStart(3, "0")}</dd></dl>`;
    if (car.livery) return `<h3>${e(car.brand)} ${e(String(car.model).replace(/\s*\(.*$/, ""))}</h3><dl><dt>Livrée</dt><dd>${e(car.liveryName)}</dd><dt>Rareté</dt><dd>${R.label}</dd><dt>Puissance</dt><dd>${car.stats.power} ch</dd><dt>Vitesse</dt><dd>${car.stats.speed} km/h</dd><dt>0-100</dt><dd>${car.stats.zero ? car.stats.zero + " s" : "—"}</dd><dt>Exemplaires</dt><dd>${n}</dd></dl>`;
    if (car.circuit) return `<h3>${e(car.model)}</h3><dl><dt>Pays</dt><dd>${e(car.countryLabel)}</dd><dt>Longueur</dt><dd>${String(car.km).replace(".", ",")} km</dd><dt>Depuis</dt><dd>${car.since}</dd><dt>Rareté</dt><dd>${R.label}</dd><dt>N°</dt><dd>${circNo(car)}</dd><dt>Exemplaires</dt><dd>${n}</dd></dl>${!(window.MACircuitTraces || {})[car.id] ? `<p><small>Illustration : le tracé officiel de ce circuit n'est pas encore disponible.</small></p>` : ""}`;
    if (sp) return `<h3>${e(car.model)}</h3><p>${e(sp.text || "")}</p><dl><dt>Édition</dt><dd>${e(car.brand)}</dd><dt>Exemplaires</dt><dd>${n}</dd></dl>`;
    const all = C.cars.filter((c) => c.brand === car.brand), have = all.filter((c) => countOf(c.id) > 0).length, st = car.stats;
    const desc = String(car.description || "").replace(/\s+/g, " ");
    return `<h3>${e(car.brand)} ${e(String(car.model).replace(/\s*\(.*$/, ""))}</h3>
      <dl><dt>Années</dt><dd>${e(car.years || "—")}</dd><dt>Catégorie</dt><dd>${e(car.category)}</dd><dt>Rareté</dt><dd>${R.label}</dd><dt>N°</dt><dd>#${String(numberOf(car)).padStart(3, "0")}</dd><dt>Puissance</dt><dd>${st.power} ch</dd><dt>Vitesse</dt><dd>${st.speed} km/h</dd><dt>0-100</dt><dd>${st.zero ? st.zero + " s" : "—"}</dd>${fiche(car)}<dt>Exemplaires</dt><dd>${n}</dd></dl>
      <div><small>Album ${e(car.brand)} : ${have} / ${all.length}</small><div class="ab-bar"><i style="width:${Math.round((have / all.length) * 100)}%"></i></div></div>${desc ? `<p>${e(desc.slice(0, 150))}${desc.length > 150 ? "…" : ""}</p>` : ""}`;
  }
  /** courbe de progression des images d'une carte : images débloquées (choisis celle qui s'affiche) et silhouettes verrouillées */
  function picGallery(car, n) {
    const pi = n > 0 ? picInfo(car) : null; if (!pi) return "";
    const e = C.esc, N = pi.keys.length, have = pi.have.length, pct = Math.round((have / N) * 100), shown = shownUrl(car, pi), claims = (doc && doc.picClaims && doc.picClaims[car.id]) || 0;
    const R = RAR[rarityOf(car)], half = N >= 4 ? Math.ceil(N / 2) : 0;
    const marks = (half ? `<i class="pg-mark" style="left:${Math.round((half / N) * 100)}%" title="Palier ${half}/${N} : +${R.dust * 4} cristaux${claims & 1 ? " (obtenu)" : ""}"></i>` : "");
    const thumbs = pi.urls.map((u, i) => pi.have.indexOf(pi.keys[i]) >= 0
      ? `<button type="button" class="pg-th${u === shown ? " on" : ""}" data-pic="${e(pi.keys[i])}" aria-label="Afficher l'image ${i + 1}"><img src="${e(C.safeUrl(u))}" alt="" loading="lazy" data-fallback="car"></button>`
      : `<span class="pg-th lock" aria-label="Image ${i + 1} verrouillée"><b>?</b></span>`).join("");
    const rewards = have >= N ? "Collection d'images complète !" : `Obtiens la carte à nouveau pour débloquer une image au hasard${half && !(claims & 1) ? ` · palier ${half}/${N} : +${R.dust * 4}` : ""} · complète : +${R.craft}`;
    return `<div class="pic-gal"><div class="pg-head"><b>Images ${have}/${N}</b><span>${pct} %</span></div><div class="pg-bar"><i style="width:${pct}%"></i>${marks}</div><div class="pg-row">${thumbs}</div><small class="tcg-hint">${e(rewards)}</small></div>`;
  }
  function detailHtml(id, back) {
    const car = cardObj(id), n = cnt(id), R = RAR[rarityOf(car)], sp = car.special, inWish = (wish || []).includes(id);
    const info = sp
      ? `Édition limitée${sp.supply ? " · " + (sp.granted || 0) + " / " + sp.supply + " exemplaires attribués" : ""}. ${n > 0 ? "Elle fait partie de ta collection." : "Elle s'obtient uniquement en la gagnant (événements, concours)."}`
      : peek === id && !countOf(id) ? "Carte liée à cette fiche ou partagée par un pilote : tu ne l'as pas encore dans ta collection."
      : n > 0 ? `Tu possèdes cette carte${n > 1 ? " en " + n + " exemplaires" : ""}.` : (R.craft ? `Carte ${R.label.toLowerCase()} · fabrication : ${R.craft} \u0001 (tu en as ${doc ? doc.dust : 0}).` : `Carte ${R.label.toLowerCase()} : elle ne s'achète pas avec des cristaux, elle se gagne en complétant un album.`);
    const lv = lvOf(id), next = lv < G.LV_MAX ? G.upgradeCost(sp ? "special" : rarityOf(car), lv + 1) : 0;
    const lvBlock = n > 0 ? `<div class="cg-lvbox"><span class="cg-lvpips" aria-hidden="true">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= lv ? "on" : ""}"></i>`).join("")}</span><b>Niveau ${lv} · ${G.LV_NAMES[lv]}</b>${lv < G.LV_MAX ? `<button type="button" class="cta-btn fill-btn compact-btn${doc && doc.dust < next ? " lack" : ""}" data-upgrade ${doc && doc.dust >= next && !peek ? "" : "disabled"}>Améliorer (${next} ${window.MA.dustIcon(14)})${doc && doc.dust < next ? ` · il manque ${next - doc.dust}` : ""}</button>` : `<span class="tcg-hint">niveau maximum</span>`}</div>` : "";
    const actions = [`<button type="button" class="cta-btn btn-ghost" data-flipcard>↻ Retourner</button>`];
    if (n > 0 && !sp && !car.circuit && !car.livery) actions.push(`<a class="cta-btn btn-ghost" href="#/voiture/${encodeURIComponent(id)}" data-close>Voir la fiche</a>`);
    if (n > 1) actions.push(`<button type="button" class="cta-btn fill-btn" data-swap>🔄 Proposer à l'échange</button>`);
    if (n > 0 && !peek && !sp) actions.push(`<button type="button" class="cta-btn btn-ghost" data-lock aria-pressed="${isLk(id)}">${isLk(id) ? "🔓 Déverrouiller" : "🔒 Verrouiller"}</button>`);
    if (n > 0) actions.push(`<button type="button" class="cta-btn btn-ghost" data-share>↗ Partager</button>`);
    if (n > 0) actions.push(`<button type="button" class="cta-btn btn-ghost" data-chatshare>💬 Dans un chat</button>`);
    if (n === 0 && !sp && R.craft > 0) actions.push(`<button type="button" class="cta-btn fill-btn${doc && doc.dust < R.craft ? " lack" : ""}" data-craft ${doc && doc.dust >= R.craft ? "" : "disabled"}>Fabriquer (${R.craft} ${window.MA.dustIcon(14)})${doc && doc.dust < R.craft ? ` · il manque ${R.craft - doc.dust}` : ""}</button>`);
    if (n === 0 && !sp) actions.push(`<button type="button" class="cta-btn btn-ghost" data-wish aria-pressed="${inWish}">${inWish ? "★ Dans ma wishlist" : "☆ Wishlist"}</button>`);
    actions.push(`<button type="button" class="cta-btn btn-ghost" data-close>Fermer</button>`);
    const i = navIds.indexOf(id), nav = i >= 0 && navIds.length > 1 ? `<div class="tcg-nav"><button type="button" data-nav="-1" aria-label="Carte précédente" ${i > 0 ? "" : "disabled"}>‹</button><span class="tcg-hint">${i + 1} / ${navIds.length}</span><button type="button" data-nav="1" aria-label="Carte suivante" ${i < navIds.length - 1 ? "" : "disabled"}>›</button></div>` : "";
    return `<div class="tcg-stage"><div class="tcg-solo"><div class="tcg-3d rest${back ? " back" : ""}" id="tcg-3d"><div class="tcg-3d-in"><div class="tcg-3d-face">${cardHtml(car, { owned: n > 0, count: n, lv: n > 0 && !peek ? lv : 1 })}</div><div class="tcg-3d-face rev">${backHtml(car, id)}</div></div></div></div>${nav}<p class="tcg-hint" id="tcg-serial">${C.esc(info).replace(/\u0001/g, window.MA.dustIcon(14))}</p>${sp ? "" : pctHtml(id)}${lvBlock}${picGallery(car, n)}${sp && sp.text && sp.power > 0 ? `<p class="tcg-hint">${C.esc(sp.text)}</p>` : ""}${peek ? "" : histHtml(id)}${car.circuit && C.isAdmin ? `<div class="cg-cphoto"><label for="cp-url">Photo du circuit (admin) : adresse https d'une image</label><div class="inline-field"><input type="url" id="cp-url" value="${C.esc(circPhotos[id] || "")}" placeholder="https://…/photo.jpg"><button type="button" class="cta-btn fill-btn compact-btn" data-cphoto>Enregistrer</button></div><small class="tcg-hint">Vide = retirer la photo (le tracé reste affiché).</small></div>` : ""}<div class="tcg-actions">${actions.join("")}</div></div>`;
  }
  function showDetail(id, ids, opts) {
    peek = opts && opts.peek ? id : "";
    const car = cardObj(id); if (!car) return;
    if (ids) navIds = ids;
    if (countOf(id) > 0) markSeen(id);
    const o = mountOverlay("detail", "Détail de la carte", detailHtml(id, false));
    o.dataset.id = id;
    o.addEventListener("click", (e) => {
      if (e.target === o || e.target.closest("[data-close]")) closeOverlay();
      else if (e.target.closest("[data-craft]")) craft(id);
      else if (e.target.closest("[data-upgrade]")) upgrade(id);
      else if (e.target.closest("[data-cphoto]")) {
        const url = (o.querySelector("#cp-url").value || "").trim();
        if (url && !C.safeUrl(url)) { C.toast("L'adresse doit commencer par https://", "err"); return; }
        API("adminGameTool", { action: "circuitPhoto", id, url }).then(() => { if (url) circPhotos[id] = url; else delete circPhotos[id]; C.toast(url ? "Photo enregistrée." : "Photo retirée.", "ok"); refreshDetail(id); renderGrid(); }).catch((ex) => C.toast(ex.message, "err"));
      }
      else if (e.target.closest("[data-lock]")) toggleLock(id);
      else if (e.target.closest("[data-wish]")) toggleWish(id);
      else if (e.target.closest("[data-flipcard]") || e.target.closest(".tcg-3d")) { const t = o.querySelector("#tcg-3d"); if (t) t.classList.toggle("back"); }
      else if (e.target.closest("[data-pic]")) { const k = e.target.closest("[data-pic]").dataset.pic; try { localStorage.setItem(picPrefKey(id), k); } catch (_) { /* facultatif */ } refreshDetail(id); renderGrid(); }
      else if (e.target.closest("[data-nav]")) stepDetail(Number(e.target.closest("[data-nav]").dataset.nav));
      else if (e.target.closest("[data-swap]")) { closeOverlay(); if (window.MATrades) window.MATrades.prefill(id); C.Router.go("/jouer/echanges"); }
      else if (e.target.closest("[data-chatshare]") && window.MAShareCar) { closeOverlay(); window.MAShareCar.open(id, { card: car, rarity: RAR[rarityOf(car)].label }); }
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

  // ------------------------------------------------------------------ page « Cartes » : deux onglets (Boutique / Mes cartes)
  let ctab = "mine", albumKind = store.get("ma_cards_albums", "country"), countryFilter = "all", minPower = 0;
  let claims = null, claimsUid = "", showcase = null, showcaseUid = "", setsSig = "", setsList = [];
  const dust$ = (n) => `${n} ${window.MA.dustIcon(14)}`;
  const lvOf = (id) => (doc && doc.lv && doc.lv[id]) || 1;
  const pct = (a, b) => Math.round((a / Math.max(1, b)) * 100);
  const gauge = (a, b, cls) => `<span class="cg-gauge ${cls || ""}" role="img" aria-label="${a} sur ${b}"><i style="width:${pct(a, b)}%"></i></span>`;
  function missionToast(r) {
    const m = r && r.missions; if (m && m.gain) C.toast("Mission accomplie : +" + m.gain + " cristaux (" + m.names.join(", ") + ")", "ok");
  }
  async function loadClaims(force) {
    if (!C.user) { claims = {}; return; }
    if (claims && claimsUid === C.user.uid && !force) return;
    try { const s = await C.db.collection("set_claims").doc(C.user.uid).get(); claims = s.exists ? (s.data().done || {}) : {}; } catch (_) { claims = {}; }
    claimsUid = C.user.uid;
  }
  const SC_BG = { carbon: "Carbone", sunset: "Coucher de soleil", night: "Nuit étoilée", garage: "Garage", neon: "Néon", gold: "Or" };
  async function loadShowcase(uid) {
    try { const s = await C.db.collection("showcases").doc(uid).get(); const d = s.exists ? s.data() : {}; return { ids: Array.isArray(d.ids) ? d.ids : [], cars: Array.isArray(d.cars) ? d.cars : [], bg: SC_BG[d.bg] ? d.bg : "" }; } catch (_) { return { ids: [], cars: [] }; }
  }
  async function loadMyShowcase(force) {
    if (!C.user) { showcase = null; return; }
    if (showcase && showcaseUid === C.user.uid && !force) return;
    showcase = await loadShowcase(C.user.uid); showcaseUid = C.user.uid;
  }
  async function saveShowcase(next) {
    const prev = showcase; showcase = Object.assign({ ids: [], cars: [], bg: "" }, showcase, next);
    const base = { ids: showcase.ids.slice(0, 6), cars: showcase.cars.slice(0, 3), updatedAt: C.FieldValue.serverTimestamp() }, ref = C.db.collection("showcases").doc(C.user.uid);
    try {
      if (SC_BG[showcase.bg]) { try { await ref.set(Object.assign({ bg: showcase.bg }, base)); return true; } catch (_) { C.toast("Fond non enregistré : règles Firestore à publier.", "err"); showcase.bg = ""; } }
      await ref.set(base); return true;
    }
    catch (e) { showcase = prev; C.toast("Vitrine indisponible : " + e.message + " (règles Firestore à publier ?)", "err"); return false; }
  }
  function allSets() { indexCars(); if (setsSig !== sig) { setsSig = sig; setsList = G.setsOf(C.cars); } return setsList; }

  // ----- Boutique
  function missionsHtml() {
    const m = doc.mis && doc.mis.day === day() ? doc.mis : { p: {}, done: [] };
    const list = G.dailyMissions(day()).map((x) => Object.assign({}, x, { n: Math.min(x.goal, m.p[x.id] || 0), ok: (m.done || []).indexOf(x.id) >= 0 }));
    const left = list.filter((x) => !x.ok).length;
    return `<section class="cg-block cg-missions" aria-label="Missions du jour"><header class="cg-bh"><h3>Missions du jour</h3><span class="cg-sub">${left ? left + " à faire" : "toutes terminées"} · nouvelles à minuit</span></header>
      <div class="cg-mlist">${list.map((x) => `<div class="cg-mission${x.ok ? " ok" : ""}"><span class="cg-mi" aria-hidden="true">${x.ok ? "✓" : x.n + "/" + x.goal}</span><span class="cg-mt"><b>${C.esc(x.label)}</b>${gauge(x.n, x.goal)}</span><span class="cg-mr">+${dust$(x.reward)}</span></div>`).join("")}</div></section>`;
  }
  function packTileHtml(p, o) {
    o = o || {};
    const free = p.id === "prestige" && (doc.prestigeFree || 0) > 0 && o.cost == null;
    const dust = doc.dust, cost = free ? 0 : o.cost != null ? o.cost : p.cost, ok = dust >= cost && !busy && p.total >= 2 && !o.used, miss = Math.max(0, cost - dust), full = p.total > 0 && p.have >= p.total;
    const st = p.id === "world" ? `style="--p1:#f59e0b;--p2:#78350f;--p3:#fbbf24"` : `style="${packTheme(p.id).style}"`;
    const art = p.id === "world" ? `<i class="pkart-flag" data-f="world" aria-hidden="true"></i><span class="pkart-plate"><small>MOTORAUTO</small><b>Monde</b><em>3 cartes</em>
</span>` : packInner(p.id, p.id === "circuit" ? "3 cartes" : p.id === "prestige" ? "épique ou mieux" : "");
    const lack = dust < cost, price = free ? `<b>Offert ×${doc.prestigeFree}</b> 🎄` : o.cost != null ? `<s>${p.cost}</s> <b>${cost}</b> ${window.MA.dustIcon(14)}` : `<b>${cost}</b> ${window.MA.dustIcon(14)}`;
    return `<button type="button" class="cg-pack ${ok ? "ready" : "off"}${o.cost != null ? " promo" : ""}" data-pack="shop" data-shop="${p.id}"${o.offer ? ` data-offer="1"` : ""} ${ok ? "" : "disabled"} aria-label="${C.esc(p.id === "world" ? "Pack mondial" : "Pack " + p.label)} : ${cost} cristaux">
      ${o.cost != null ? `<span class="cg-ribbon">-${G.OFFER_PCT} %</span>` : ""}<span class="cg-art" ${st}>${art}</span>
      <span class="cg-pm"><b>${p.id === "world" ? "Pack mondial" : p.id === "circuit" ? "Pack Circuit" : C.esc(p.label)}</b><span class="cg-price${lack ? " lack" : ""}">${price}</span></span>
      <span class="cg-have">${gauge(p.have, p.total, full ? "full" : "")}<small>${p.have} / ${p.total} cartes${full ? " · complet" : ""}</small></span>
      ${o.used ? `<small class="cg-note">Offre déjà utilisée aujourd'hui</small>` : !ok && miss && !full ? `<small class="cg-note">il manque ${miss}</small>` : ""}</button>`;
  }
  function packRows() {
    indexCars();
    const cars = C.cars;
    const circ = { id: "circuit", label: "Circuit", cost: G.PACKS.circuit.cost, total: G.CIRCUIT_CARDS.length, have: G.CIRCUIT_CARDS.filter((r) => countOf(r[0]) > 0).length };
    const pres = cars.filter((c) => G.isPrestige && G.isPrestige(c) && rarityOf(c) !== "mythic");
    const prestige = { id: "prestige", label: "Prestige", cost: G.PACKS.prestige.cost, total: pres.length, have: pres.filter((c) => countOf(c.id) > 0).length };
    return [{ id: "world", label: "Monde", cost: G.PACKS.world.cost, total: cars.length, have: cars.filter((c) => countOf(c.id) > 0).length }, circ, prestige].concat((G.COUNTRIES || []).map((k) => {
      const list = cars.filter((c) => G.countryOf(c.brand) === k.id && rarityOf(c) !== "mythic");
      return { id: k.id, label: k.label, cost: k.cost, total: list.length, have: list.filter((c) => countOf(c.id) > 0).length };
    }));
  }
  /** temps restant avant minuit (heure de Paris) */
  function leftToday() {
    const ms = Math.max(0, G.parisMidnight(G.dayKey(Date.now() + 86400000)) - Date.now()), h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return (h ? h + " h " : "") + String(m).padStart(2, "0") + " min";
  }
  let shownDay = "";
  /** à minuit : la boutique, le pack du jour et les missions se renouvellent sans recharger la page */
  function dayWatch() {
    const t = day();
    if (!shownDay) { shownDay = t; return; }
    document.querySelectorAll("[data-nextday]").forEach((el) => { el.textContent = leftToday(); });
    if (doc) { const st = adventState(); document.querySelectorAll("[data-adv-left]").forEach((el) => { if (st.left != null) el.textContent = fmtLeft(st.left); }); }
    if (t === shownDay) return;
    shownDay = t;
    if (doc) load(true).then(() => { if (C.Router.is("play", { tab: "collection" }) || C.Router.is("play", { tab: "boutique" })) render(); }).catch(() => {});
  }
  function offersHtml(rows) {
    indexCars();
    const of = doc.offerToday && doc.offerToday.day === day() ? doc.offerToday : G.dailyOffers(day(), C.cars, rarityMap), used = doc.offers && doc.offers.day === day() ? doc.offers : { pack: 0, card: 0 };
    const row = rows.find((r) => r.id === of.pack), car = of.card ? cardObj(of.card) : null;
    const packOffer = row ? packTileHtml(row, { cost: G.offerPackCost(row.id), offer: true, used: !!used.pack }) : "";
    const owned = car && countOf(car.id) > 0, can = car && !owned && !used.card && doc.dust >= of.cardCost && !busy;
    const cardOffer = car ? `<div class="cg-cardoffer${used.card || owned ? " off" : ""}"><span class="cg-ribbon">-30 %</span><div class="cg-co-card">${cardHtml(car, { owned: !!owned, count: 0, cls: "tcg-mini" })}</div>
      <div class="cg-co-info"><b>Carte du jour</b><span>${C.esc(car.brand + " " + String(car.model).replace(/\s*\(.*$/, ""))}</span><span class="cg-price${doc.dust < of.cardCost && !owned ? " lack" : ""}"><s>${of.cardFull}</s> <b>${of.cardCost}</b> ${window.MA.dustIcon(14)}</span>
      <button type="button" class="cta-btn fill-btn compact-btn" data-offer-card="${C.esc(car.id)}" ${can ? "" : "disabled"}>${owned ? "Tu l'as déjà" : used.card ? "Offre utilisée" : "Acheter"}</button></div></div>` : "";
    return `<section class="cg-block cg-offers" aria-label="Offres du jour"><header class="cg-bh"><h3>Offres du jour</h3><span class="cg-sub">changent à minuit · <b data-nextday>${leftToday()}</b></span></header><div class="cg-offer-row">${packOffer}${cardOffer}</div></section>`;
  }
  /** compteurs de chance garantie + historique des ouvertures */
  function packStatsHtml() {
    const op = doc.opened || 0, toRare = G.PITY.rare - (op % G.PITY.rare), toEpic = G.PITY.epic - (op % G.PITY.epic), toLeg = Math.max(1, G.PITY.legend - (doc.pity || 0)), all = Math.max(doc.packsAll || 0, op);
    const best = String(doc.best || "").split("|"), bc = best[0] && cardObj(best[0]), br = best[1] && RAR[best[1]];
    const log = (doc.log || []).slice(-8).reverse();
    const kinds = { daily: "Pack du jour", bonus: "Pack bonus", shop: "Pack acheté" };
    const bar = (n, tot, lbl, cls) => `<div class="pity ${cls}"><div class="pity-t"><b>${n === 1 ? "Le prochain pack" : "Plus que " + n + " packs"}</b><small>${lbl}</small></div><span class="pity-bar" aria-hidden="true"><u style="width:${Math.round(100 * (tot - n) / tot)}%"></u></span></div>`;
    return `<section class="cg-block cg-pity" aria-label="Chance garantie et historique"><header class="cg-bh"><h3>Chance garantie</h3><span class="cg-sub">sur les packs du jour et les packs bonus</span></header>
      ${bar(toRare, G.PITY.rare, "contient une carte rare ou mieux, garantie", "rare")}${bar(toEpic, G.PITY.epic, "contient une carte épique ou mieux, garantie", "epic")}${bar(toLeg, G.PITY.legend, "contient une carte légendaire ou mieux, garantie", "legendary")}
      <div class="pity-stats"><div><b>${all}</b><small>packs ouverts</small></div>${bc && br ? `<div class="pity-best"><b class="${best[1]}">${br.label}</b><small>meilleure pioche : ${C.esc((bc.brand || "") + " " + (bc.model || ""))}</small></div>` : `<div><b>–</b><small>meilleure pioche</small></div>`}</div>
      ${log.length ? `<details class="pity-log"><summary>Historique des derniers packs</summary><ul>${log.map((l) => { const c = cardObj(l.id), rr = RAR[l.r]; return `<li><span class="pl-d">${C.esc(String(l.t || "").slice(5).split("-").reverse().join("/"))}</span><span class="pl-k">${kinds[l.k] || "Pack"}</span><span class="pl-r tcg-rar-chip ${l.r}">${rr ? rr.label : l.r}</span><span class="pl-c">${c ? C.esc((c.brand || "") + " " + (c.model || "")) : ""}</span></li>`; }).join("")}</ul></details>` : ""}</section>`;
  }
  function shopHtml() {
    const rows = packRows(), canDaily = doc.lastPack !== day();
        return `<div class="cg-free">
        <button type="button" class="cg-gift ${canDaily ? "ready" : "off"}" data-pack="daily" ${canDaily && !busy ? "" : "disabled"} aria-label="Pack du jour"><span class="cg-gi">🎁</span><b>${canDaily ? "Pack du jour" : "Reviens demain"}</b><small>${canDaily ? "3 cartes gratuites" : "déjà ouvert"}</small></button>
        <button type="button" class="cg-gift bonus ${doc.bonus ? "ready" : "off"}" data-pack="bonus" ${doc.bonus && !busy ? "" : "disabled"} aria-label="Pack bonus"><span class="cg-gi">★</span><b>${doc.bonus} pack${doc.bonus > 1 ? "s" : ""} bonus</b><small>badges, défis, parrainage</small></button>
        ${adventBtnHtml()}
      </div>${wheelHtml()}${adventHtml()}${packStatsHtml()}${offersHtml(rows)}${missionsHtml()}
      <section class="cg-block" aria-label="Packs par pays"><header class="cg-bh"><h3>Packs par pays</h3><span class="cg-sub">3 voitures du pays, dont 1 rare ou mieux · Pack Circuit : 3 circuits · Pack Prestige : grandes marques, 1 épique ou mieux · les doublons rapportent des cristaux</span></header><div class="cg-packgrid">${rows.map((r) => packTileHtml(r)).join("")}</div></section>`;
  }

  // ----- Mes cartes
  function rarityChips() {
    return ORDER.map((r) => { const all = C.cars.filter((c) => rarityOf(c) === r); if (!all.length) return ""; const have = all.filter((c) => countOf(c.id) > 0).length; return `<span class="tcg-rar-chip ${r}">${RAR[r].label} <b>${have}/${all.length}</b></span>`; }).join("");
  }
  function showcaseHtml() {
    const ids = ((showcase && showcase.ids) || []).filter((id) => isOwned(id) && cardObj(id)).slice(0, 6);
    const slots = [];
    for (let i = 0; i < 6; i++) slots.push(ids[i] ? `<div class="cg-slot" data-card="${C.esc(ids[i])}">${cardHtml(cardObj(ids[i]), { owned: true, count: 0, lv: lvOf(ids[i]) })}</div>` : `<button type="button" class="cg-slot empty" data-show-edit aria-label="Ajouter une carte à ma vitrine"><span>+</span></button>`);
    return `<section class="cg-block cg-showcase" aria-label="Ma vitrine"><header class="cg-bh"><h3>Ma vitrine</h3><span class="cg-sub">tes 6 cartes préférées, visibles sur ton profil</span><button type="button" class="cta-btn btn-ghost compact-btn" data-show-edit>Modifier</button></header><div class="cg-slots" data-bg="${(showcase && showcase.bg) || ""}">${slots.join("")}</div></section>`;
  }
  function myCarObj(c) {
    const photos = (c.photos || []).filter((u) => C.safeUrl(u));
    return { id: "mine-" + c.id, mine: true, brand: c.pilot || "Ma voiture", model: c.name || "Ma voiture", image: photos[0] || "", images: photos, category: "", years: c.year || "", stats: { power: Number(c.power) || 0, speed: Number(c.speed) || 0, zero: Number(c.zero) || null } };
  }
  function myCarsHtml() {
    const cars = ((window.MAApp && window.MAApp.getMyCars && window.MAApp.getMyCars()) || []).slice(0, 6), pub = new Set((showcase && showcase.cars) || []);
    return `<section class="cg-block cg-mycars" aria-label="Ma voiture en carte"><header class="cg-bh"><h3>Ma voiture en carte</h3><span class="cg-sub">une carte unique faite avec ta photo et tes caractéristiques</span></header>
      ${cars.length ? `<div class="cg-mc-row">${cars.map((c) => `<div class="cg-mc"><div class="cg-mc-card">${cardHtml(myCarObj(c), { owned: true, count: 0 })}</div><button type="button" class="cta-btn ${pub.has(c.id) ? "fill-btn" : "btn-ghost"} compact-btn" data-mycar-pub="${C.esc(c.id)}" aria-pressed="${pub.has(c.id)}">${pub.has(c.id) ? "Visible sur mon profil" : "Privée · afficher sur mon profil"}</button></div>`).join("")}</div>`
        : `<p class="lap-meta">Ajoute une voiture dans ton garage (Moi › Garage) pour la transformer en carte. Elle reste privée tant que tu ne l'affiches pas sur ton profil.</p>`}</section>`;
  }
  const kindLabel = { country: "Pays", decade: "Décennies", brand: "Marques", category: "Familles", theme: "Thèmes" };
  function albumsHtml() {
    const sets = allSets().map((s) => { const have = s.ids.filter((id) => countOf(id) > 0).length; return Object.assign({ have, done: !!(claims && claims[s.id]), full: have === s.ids.length }, s); });
    const ready = sets.filter((s) => s.full && !s.done), list = sets.filter((s) => s.kind === albumKind).sort((a, b) => (b.full && !b.done) - (a.full && !a.done) || (a.done - b.done) || (b.have / b.ids.length) - (a.have / a.ids.length));
    const tile = (s) => {
      const leg = s.legend && cardObj(s.legend), got = leg && countOf(leg.id) > 0, p = pct(s.have, s.ids.length), left = s.ids.length - s.have;
      return `<button type="button" class="cg-album ab2${s.done ? " done" : ""}${s.full && !s.done ? " ready" : ""}" data-album="${C.esc(s.id)}" style="--ab:${p}%">
        <span class="ab-top"><b>${C.esc(s.name)}</b><em class="ab-pct">${p}<small>%</small></em></span>
        <span class="ab-track" aria-hidden="true"><u style="width:${p}%"></u></span>
        <span class="ab-sub"><span>${s.have} / ${s.ids.length}</span><span>${s.done ? "✓ Terminé" : s.full ? "À récupérer !" : "encore " + left}</span></span>
        <span class="ab-foot"><span>${s.done ? "" : "+" + s.reward + " ◆"}</span>${leg ? `<span class="ab-leg${got ? " got" : ""}" title="Carte Légende : ${got ? C.esc(leg.brand + " " + leg.model) : "à découvrir"}">${got ? "Légende obtenue" : "Légende à gagner"}</span>` : ""}</span></button>`;
    };
    return `<section class="cg-block cg-albums" aria-label="Albums"><header class="cg-bh"><h3>Albums</h3><span class="cg-sub">${sets.filter((s) => s.done).length} / ${sets.length} terminés · complète un album pour des cristaux (et une carte Légende)</span>${ready.length ? `<button type="button" class="cta-btn fill-btn compact-btn" data-set-claim ${busy ? "disabled" : ""}>Récupérer ${dust$(ready.reduce((t, s) => t + s.reward, 0))}</button>` : ""}</header>
      <div class="seg cg-seg" role="group" aria-label="Type d'album">${Object.keys(kindLabel).map((k) => `<button type="button" data-akind="${k}" aria-pressed="${k === albumKind}">${kindLabel[k]}</button>`).join("")}</div>
      <div id="cg-titles" class="cg-titles"></div>
      <div class="cg-albumgrid">${list.map(tile).join("") || `<p class="lap-meta">Aucun album de ce type.</p>`}</div></section>`;
  }
  let albumFilt = "all", albumRar = "all", albumShow = 24;
  const albumCars = (cars) => cars.filter((c) => (albumFilt === "all" || (albumFilt === "owned") === (countOf(c.id) > 0)) && (albumRar === "all" || rarityOf(c) === albumRar));
  /** haut de l'album : anneau de progression, récompenses, jalons et raretés (cliquables pour filtrer) */
  function albumHead(cars, s, done, leg) {
    const have = cars.filter((c) => countOf(c.id) > 0).length, p = pct(have, cars.length), left = cars.length - have, full = left === 0;
    const rows = ORDER.map((r) => { const all = cars.filter((c) => rarityOf(c) === r); if (!all.length) return ""; const h = all.filter((c) => countOf(c.id) > 0).length;
      return `<button type="button" class="ab3-rar r-${r}${albumRar === r ? " on" : ""}" data-arar="${r}" aria-pressed="${albumRar === r}"><i></i><span>${RAR[r].label}</span><b>${h}/${all.length}</b></button>`; }).join("");
    const marks = [25, 50, 75].map((m) => `<i class="${p >= m ? "on" : ""}" style="left:${m}%"></i>`).join("");
    const state = done ? `<span class="ab3-state ok">✓ Terminé · récompense récupérée</span>` : full ? `<span class="ab3-state ready">Complet : récupère ta récompense</span>` : `<span class="ab3-state">Encore ${left} carte${left > 1 ? "s" : ""}</span>`;
    return `<div class="ab3-hero"><div class="ab3-ring" style="--p:${p}%"><b>${p}<small>%</small></b><span>${have} / ${cars.length}</span></div>
      <div class="ab3-info">${state}
        <span class="ab3-meter" aria-hidden="true"><u style="width:${p}%"></u>${marks}</span>
        <div class="ab3-rewards"><span class="ab3-rw">◆ ${s.reward} cristaux</span>${leg ? `<span class="ab3-rw leg">★ Carte Légende</span>` : ""}</div></div></div>
      <div class="ab3-rars" role="group" aria-label="Raretés">${rows}</div>
      <div class="ab3-filt" role="group" aria-label="Filtrer">${[["all", "Toutes", cars.length], ["missing", "Manquantes", left], ["owned", "Possédées", have]].map(([k, l, n]) => `<button type="button" class="${albumFilt === k ? "on" : ""}" data-afilt="${k}" aria-pressed="${albumFilt === k}">${l} <em>${n}</em></button>`).join("")}</div>`;
  }
  function albumPage(cars) {
    const list = albumCars(cars);
    if (!list.length) return `<p class="ab3-empty">${albumFilt === "owned" ? "Tu n'as encore aucune carte de cette sélection." : "Rien à afficher : tout est déjà dans ta collection !"}</p>`;
    return list.slice(0, albumShow).map((c) => cardHtml(c, { owned: countOf(c.id) > 0, count: countOf(c.id), lv: lvOf(c.id) })).join("") +
      (list.length > albumShow ? `<button type="button" class="ab3-more" data-amore>Afficher plus <em>${list.length - albumShow}</em></button>` : "");
  }
  function showAlbum(id) {
    const s = allSets().find((x) => x.id === id); if (!s) return;
    albumFilt = "all"; albumRar = "all"; albumShow = 24;
    const cars = s.ids.map((i) => C.carsById.get(i)).filter(Boolean).sort((a, b) => numberOf(a) - numberOf(b));
    const have = cars.filter((c) => countOf(c.id) > 0).length, done = !!(claims && claims[s.id]), full = have === cars.length, leg = s.legend && cardObj(s.legend);
    const o = mountOverlay("album", "Album " + s.name, `<div class="tcg-stage cg-album-ov ab3">
      <header class="ab3-bar"><button type="button" class="ab3-back" data-close aria-label="Retour">‹</button><div><small>${C.esc(kindLabel[s.kind] || "Album")}</small><h2>${C.esc(s.name)}</h2></div></header>
      <div id="ab-head">${albumHead(cars, s, done, leg)}</div>
      <div class="ab3-grid" id="cg-album-grid">${albumPage(cars)}</div>
      ${leg ? `<section class="ab3-legend"><h3>★ Récompense : carte Légende</h3><p>${countOf(leg.id) > 0 ? "Tu l'as déjà obtenue." : "Termine l'album pour l'obtenir."}</p><div class="cg-legend-slot">${cardHtml(leg, { owned: countOf(leg.id) > 0, count: 0, lv: lvOf(leg.id) })}</div></section>` : ""}
      <div class="ab3-dock">${full && !done ? `<button type="button" class="cta-btn fill-btn" data-set-claim>Récupérer la récompense</button>` : ""}<button type="button" class="cta-btn btn-ghost" data-close>Fermer</button></div></div>`);
    const redraw = () => { const g = o.querySelector("#cg-album-grid"), h = o.querySelector("#ab-head"); if (g) g.innerHTML = albumPage(cars); if (h) h.innerHTML = albumHead(cars, s, done, leg); };
    o.addEventListener("click", (e) => {
      if (e.target === o || e.target.closest("[data-close]")) { closeOverlay(); return; }
      const af = e.target.closest("[data-afilt]"); if (af) { albumFilt = af.dataset.afilt; albumShow = 24; redraw(); return; }
      const ar = e.target.closest("[data-arar]"); if (ar) { albumRar = albumRar === ar.dataset.arar ? "all" : ar.dataset.arar; albumShow = 24; redraw(); return; }
      if (e.target.closest("[data-amore]")) { albumShow += 24; const g = o.querySelector("#cg-album-grid"); if (g) g.innerHTML = albumPage(cars); return; }
      const cd = e.target.closest("[data-card]"); if (cd) { showDetail(cd.dataset.card, albumCars(cars).map((c) => c.id)); return; }
      if (e.target.closest("[data-set-claim]")) claimAlbums(true);
    });
  }
  async function claimAlbums(fromOverlay) {
    if (busy) return; busy = true; renderHero();
    try {
      const r = await API("claimSets", {});
      claims = r.done || claims; applyDoc(r.doc);
      if (r.claimed && r.claimed.length) {
        C.toast("Album complété : " + r.claimed.map((x) => x.name).join(", ") + " · +" + r.total + " cristaux" + (r.legends && r.legends.length ? " · carte Légende obtenue !" : ""), "ok");
        if (r.legends && r.legends.length) { buzz([30, 40, 60]); const lg = cardObj(r.legends[0]); if (lg) { busy = false; if (fromOverlay) closeOverlay(); showDetail(lg.id, [], {}); return; } }
      } else C.toast("Aucun album à récupérer.", "ok");
      if (fromOverlay) closeOverlay();
    } catch (e) { C.toast(e.message || "Impossible pour l'instant.", "err"); }
    finally { busy = false; renderHero(); }
  }
  function editShowcase() {
    if (!doc || !C.requireLogin()) return;
    let sel = ((showcase && showcase.ids) || []).filter(isOwned).slice(0, 6), q = "", bg = (showcase && showcase.bg) || "", rf = "";
    const owned = Object.keys(doc.owned).filter((id) => doc.owned[id] > 0 && cardObj(id)).map(cardObj).sort((a, b) => ORDER.indexOf(rarityOf(b)) - ORDER.indexOf(rarityOf(a)) || (b.stats.power || 0) - (a.stats.power || 0));
    const acts = (cls) => `<div class="vt-actions ${cls}"><button type="button" class="cta-btn fill-btn" data-sc-save>Enregistrer ma vitrine</button><button type="button" class="cta-btn btn-ghost" data-close>Annuler</button></div>`;
    const o = mountOverlay("showcase", "Choisir ma vitrine", `<div class="vt">
      <header class="vt-top"><div><h2>Ma vitrine</h2><p id="sc-count" class="vt-sub"></p></div><button type="button" class="vt-x" data-close aria-label="Fermer">×</button></header>
      <div class="vt-body">
        <aside class="vt-side"><div class="vt-prev" id="sc-prev"></div><h3 class="vt-h">Fond</h3><div class="vt-bgs" id="sc-bgs" role="group" aria-label="Fond de la vitrine"></div>${acts("d")}</aside>
        <section class="vt-main"><div class="vt-tools"><input type="search" id="sc-q" placeholder="Rechercher parmi tes cartes…" aria-label="Rechercher une carte" autocomplete="off"><div class="vt-chips" id="sc-rf" role="group" aria-label="Rareté"></div></div><div class="vt-grid" id="sc-grid"></div></section>
      </div>${acts("m")}</div>`);
    const slot = (i) => { const c = sel[i] ? cardObj(sel[i]) : null, u = c && c.image && C.safeUrl(c.image);
      return c ? `<div class="vt-slot on r-${rarityOf(c)}"><span class="vt-n">${i + 1}</span>${u ? `<img src="${C.esc(u)}" alt="" data-fallback="car">` : ""}<b>${C.esc((c.brand + " " + c.model).slice(0, 26))}</b><div class="vt-sb"><button type="button" data-sc-mv="${i}" data-d="-1" ${i ? "" : "disabled"} aria-label="Avancer">◀</button><button type="button" data-sc-rm="${i}" aria-label="Retirer">✕</button><button type="button" data-sc-mv="${i}" data-d="1" ${i < sel.length - 1 ? "" : "disabled"} aria-label="Reculer">▶</button></div></div>` : `<div class="vt-slot"><span class="vt-n">${i + 1}</span><small>Libre</small></div>`; };
    const paint = (full) => {
      const nq = C.normalize(q), list = owned.filter((c) => (!rf || rarityOf(c) === rf) && (!nq || C.normalize(c.brand + " " + c.model).includes(nq))).slice(0, 240);
      o.querySelector("#sc-count").textContent = sel.length + " / 6 cartes · touche une carte pour l'ajouter ou la retirer";
      const pv = o.querySelector("#sc-prev"); pv.dataset.bg = bg; pv.innerHTML = [0, 1, 2, 3, 4, 5].map(slot).join("");
      o.querySelector("#sc-bgs").innerHTML = `<button type="button" class="vt-bg${bg ? "" : " on"}" data-sc-bg="" title="Aucun fond"><i></i><span>Aucun</span></button>` + Object.keys(SC_BG).map((k) => `<button type="button" class="vt-bg${bg === k ? " on" : ""}" data-sc-bg="${k}" title="${SC_BG[k]}"><i data-bg="${k}"></i><span>${SC_BG[k]}</span></button>`).join("");
      if (full !== false) {
        const have = ORDER.filter((r) => owned.some((c) => rarityOf(c) === r)).reverse();
        o.querySelector("#sc-rf").innerHTML = `<button type="button" class="vt-chip${rf ? "" : " on"}" data-sc-rf="">Toutes</button>` + have.map((r) => `<button type="button" class="vt-chip${rf === r ? " on" : ""}" data-sc-rf="${r}">${C.esc((RAR[r] || {}).label || r)}</button>`).join("");
      }
      o.querySelector("#sc-grid").innerHTML = list.map((c) => `<div class="cg-pickcard${sel.indexOf(c.id) >= 0 ? " on" : ""}" data-pick="${C.esc(c.id)}" role="button" tabindex="0" aria-pressed="${sel.indexOf(c.id) >= 0}">${cardHtml(c, { owned: true, count: 0 })}<span class="cg-tick" aria-hidden="true">${sel.indexOf(c.id) >= 0 ? sel.indexOf(c.id) + 1 : ""}</span></div>`).join("") || `<p class="lap-meta">Aucune carte.</p>`;
    };
    paint();
    o.addEventListener("input", (e) => { if (e.target.id === "sc-q") { q = e.target.value; paint(false); } });
    o.addEventListener("keydown", (e) => { const pk = e.target.closest && e.target.closest("[data-pick]"); if (pk && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pk.click(); } });
    o.addEventListener("click", async (e) => {
      if (e.target === o || e.target.closest("[data-close]")) { closeOverlay(); return; }
      const mv = e.target.closest("[data-sc-mv]");
      if (mv) { const i = Number(mv.dataset.scMv), j = i + Number(mv.dataset.d); if (j >= 0 && j < sel.length) { const t = sel[i]; sel[i] = sel[j]; sel[j] = t; paint(false); } return; }
      const rm = e.target.closest("[data-sc-rm]"); if (rm) { sel.splice(Number(rm.dataset.scRm), 1); paint(false); return; }
      const rfb = e.target.closest("[data-sc-rf]"); if (rfb) { rf = rfb.dataset.scRf; paint(); return; }
      const gb = e.target.closest("[data-sc-bg]"); if (gb) { bg = gb.dataset.scBg; paint(false); return; }
      const pk = e.target.closest("[data-pick]");
      if (pk) { const id = pk.dataset.pick, i = sel.indexOf(id); if (i >= 0) sel.splice(i, 1); else if (sel.length < 6) sel.push(id); else C.toast("6 cartes maximum.", "err"); paint(false); return; }
      if (e.target.closest("[data-sc-save]")) { if (await saveShowcase({ ids: sel, bg })) { C.toast("Vitrine enregistrée.", "ok"); closeOverlay(); } }
    });
  }
  async function toggleMyCar(id) {
    if (!showcase) await loadMyShowcase();
    const cur = (showcase.cars || []).slice(), i = cur.indexOf(id);
    if (i >= 0) cur.splice(i, 1); else if (cur.length >= 3) { C.toast("3 voitures maximum sur ton profil.", "err"); return; } else cur.push(id);
    if (await saveShowcase({ cars: cur })) { C.toast(i >= 0 ? "Carte masquée de ton profil." : "Carte visible sur ton profil.", "ok"); renderHero(); }
  }

  // ----- collection : recherche, filtres, tri
  let sortBy = store.get("ma_cards_sort", "num"), view = store.get("ma_cards_view", "grid");
  const zeroKey = (c) => Number(c.stats.zero) || 99;
  function sortList(list) {
    const byNum = (a, b) => (numberOf(a) || (a.circuit ? 9000 : 0)) - (numberOf(b) || (b.circuit ? 9000 : 0)) || String(a.id).localeCompare(String(b.id));
    const cmp = {
      num: byNum,
      rar: (a, b) => ORDER.indexOf(rarityOf(a)) - ORDER.indexOf(rarityOf(b)) || byNum(a, b),
      power: (a, b) => b.stats.power - a.stats.power || byNum(a, b),
      speed: (a, b) => b.stats.speed - a.stats.speed || byNum(a, b),
      zero: (a, b) => zeroKey(a) - zeroKey(b) || byNum(a, b),
      brand: (a, b) => a.brand.localeCompare(b.brand, "fr") || a.model.localeCompare(b.model, "fr") || byNum(a, b),
      owned: (a, b) => countOf(b.id) - countOf(a.id) || byNum(a, b),
      level: (a, b) => lvOf(b.id) - lvOf(a.id) || byNum(a, b),
      year: (a, b) => (G.yearOf(a) || 9999) - (G.yearOf(b) || 9999) || byNum(a, b),
      yeard: (a, b) => (G.yearOf(b) || 0) - (G.yearOf(a) || 0) || byNum(a, b)
    };
    return list.sort(cmp[sortBy] || byNum);
  }
  function visibleList() {
    indexCars();
    const q = C.normalize(query);
    const base = filter === "circuits" ? G.CIRCUIT_CARDS.map((r) => cardObj(r[0])).concat(G.LIVERIES.map((r) => cardObj(r[0]))).filter(Boolean) : C.cars;
    const list = base.filter((c) => {
      const n = countOf(c.id);
      if (filter === "owned" && !n) return false;
      if (filter === "missing" && n) return false;
      if (filter === "dups" && n < 2) return false;
      if (filter === "wish" && !(wish || []).includes(c.id)) return false;
      if (rarFilter !== "all" && rarityOf(c) !== rarFilter) return false;
      if (countryFilter !== "all" && !c.circuit && G.countryOf(c.brand) !== countryFilter) return false;
      if (minPower && !c.circuit && c.stats.power < minPower) return false;
      return !q || C.normalize(c.brand + " " + c.model).includes(q);
    });
    return sortList(list);
  }
  let curList = [], gridPage = 0, gridSig = "";
  const PAGE = 25;
  const cardTpl = (c, w, sn) => cardHtml(c, { owned: countOf(c.id) > 0, count: countOf(c.id), wish: w.has(c.id) && !countOf(c.id), isNew: countOf(c.id) > 0 && !sn.has(c.id), lv: lvOf(c.id) });
  /** pagination : 25 cartes par page, boutons Précédent / Suivant */
  function pagerHtml(attr, page, n) {
    const pages = Math.ceil(n / PAGE); if (pages <= 1) return "";
    return `<nav class="cg-pager" aria-label="Pages"><button type="button" class="cta-btn btn-ghost compact-btn" ${attr}="${page - 1}" ${page <= 0 ? "disabled" : ""}>Précédent</button><span class="cg-pg-n">Page ${page + 1} sur ${pages}</span><button type="button" class="cta-btn btn-ghost compact-btn" ${attr}="${page + 1}" ${page >= pages - 1 ? "disabled" : ""}>Suivant</button></nav>`;
  }
  function appendChunk() {
    const el = document.getElementById("tcg-grid"); if (!el) return;
    const old = el.querySelector(".cg-pager"); if (old) old.remove();
    const w = new Set(wish || []), sn = seenSet(), slice = curList.slice(gridPage * PAGE, (gridPage + 1) * PAGE);
    el.insertAdjacentHTML("beforeend", slice.map((c) => cardTpl(c, w, sn)).join("") + pagerHtml("data-gpage", gridPage, curList.length));
  }
  function renderGrid() {
    const el = document.getElementById("tcg-grid"); if (!el || !doc) return;
    curList = visibleList();
    const sig = [filter, rarFilter, countryFilter, minPower, sortBy, query, view].join("|");
    if (sig !== gridSig) { gridSig = sig; gridPage = 0; }
    if (gridPage * PAGE >= curList.length) gridPage = Math.max(0, Math.ceil(curList.length / PAGE) - 1);
    const cnt = document.getElementById("tcg-count"); if (cnt) cnt.textContent = curList.length + " carte" + (curList.length > 1 ? "s" : "");
    el.className = "tcg-grid" + (view === "compact" ? " compact" : view === "binder" ? " binder" : "");
    const sp = Array.from(specials.values()).filter((s) => (filter === "all" ? (countOf(s.id) > 0 || (s.claimable && s.active !== false)) : filter === "owned" ? countOf(s.id) > 0 : false) && rarFilter === "all" && countryFilter === "all" && !minPower && sortBy === "num");
    const sn = seenSet();
    el.innerHTML = sp.length && !query ? `<div class="tcg-sec">✦ Éditions limitées</div>${sp.map((s) => cardHtml(cardObj(s.id), { owned: countOf(s.id) > 0, count: countOf(s.id), isNew: countOf(s.id) > 0 && !sn.has(s.id), lv: lvOf(s.id) })).join("")}<div class="tcg-sec">Catalogue</div>` : "";
    if (!curList.length) { el.insertAdjacentHTML("beforeend", `<div class="empty-note tcg-empty">Aucune carte pour ce filtre.</div>`); return; }
    appendChunk();
  }
  function syncToolbar() {
    document.querySelectorAll("#cards-root [data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    const s = document.getElementById("cards-sort"); if (s) s.value = sortBy;
    const c = document.getElementById("cards-country"); if (c) c.value = countryFilter;
    const m = document.getElementById("cards-minp"); if (m) m.value = String(minPower);
    const r = document.getElementById("cards-rar"); if (r) r.value = rarFilter;
    document.querySelectorAll("#cards-root [data-cf]").forEach((b) => { const on = b.dataset.cf === filter; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); });
  }

  // ----- structure de la page
  /** met à jour l'en-tête et le panneau visible (pas la grille de la collection) */
  function renderHero() {
    const top = document.getElementById("cg-top"); if (!top || !doc) return;
    indexCars();
    const total = C.cars.length + G.CIRCUIT_CARDS.length + G.LIVERIES.length, owned = doc.count, dups = Object.keys(doc.owned).filter((k) => doc.owned[k] > 1).length;
    top.innerHTML = `<div class="cg-prog"><div class="cg-pt"><b>${owned}</b><span> / ${total} cartes</span><em>${pct(owned, total)} %</em></div>${gauge(owned, total, "big")}</div>
      <button type="button" class="cg-dust" data-dust-log title="Historique des cristaux"><span class="cg-di">${window.MA.dustIcon(22)}</span><b>${doc.dust}</b><small>cristaux${dups ? " · " + dups + " doublon" + (dups > 1 ? "s" : "") : ""}</small></button>`;
    document.querySelectorAll("#cards-root [data-ctab]").forEach((b) => { const on = b.dataset.ctab === ctab; b.classList.toggle("active", on); b.setAttribute("aria-selected", String(on)); });
    const shop = document.getElementById("cg-shop"), mine = document.getElementById("cg-mine");
    shop.hidden = ctab !== "shop"; mine.hidden = ctab !== "mine";
    if (ctab === "shop") shop.innerHTML = (notice ? `<p class="tcg-alert" role="status">⚠ ${C.esc(notice)}</p>` : "") + shopHtml();
    else { const t = document.getElementById("cg-mine-top"); if (t) t.innerHTML = `<div class="tcg-rar-row">${rarityChips()}${doc.specials ? `<span class="tcg-rar-chip special">✦ Éditions <b>${doc.specials}</b></span>` : ""}</div>${showcaseHtml()}${albumsHtml()}${myCarsHtml()}`; }
  }
  function fillTitles() {
    const box = document.getElementById("cg-titles"); if (!box || !window.MATitles || !doc) return;
    window.MATitles.pickerHtml(doc.claimed || []).then((h) => { const b = document.getElementById("cg-titles"); if (b) b.innerHTML = h; }).catch(() => {});
  }
  function render() {
    const root = document.getElementById("cards-root"); if (!root) return;
    if (!C.user) { root.innerHTML = `<div class="empty-note">Connecte-toi pour ouvrir des packs et collectionner les cartes du catalogue.<br><button type="button" class="cta-btn fill-btn mt" data-action="open-auth">Me connecter</button></div>`; return; }
    if (!doc) { root.innerHTML = `<div class="tcg-skeleton" aria-busy="true" aria-label="Chargement de ta collection"><i></i><i></i><i></i></div>`; return; }
    if (!document.getElementById("cg-top")) {
      const countries = (G.COUNTRIES || []).map((k) => `<option value="${k.id}">${C.esc(k.label)}</option>`).join("");
      root.innerHTML = `<div class="cg"><div class="cg-top" id="cg-top"></div>
        <div id="cg-shop" role="tabpanel"></div>
        <div id="cg-mine" role="tabpanel" hidden><div id="cg-mine-top"></div>
          <section class="cg-block" aria-label="Collection"><header class="cg-bh"><h3>Collection</h3><button type="button" class="cg-recycle" data-recycle>♻️ Recycler</button><span class="tcg-count" id="tcg-count" aria-live="polite"></span></header>
            <div class="cg-tools"><input type="search" id="cards-search" placeholder="Rechercher une carte…" aria-label="Rechercher une carte" value="${C.esc(query)}" autocomplete="off">
              <select id="cards-rar" aria-label="Rareté"><option value="all">Toutes raretés</option>${ORDER.map((r) => `<option value="${r}">${RAR[r].label}</option>`).join("")}</select>
              <select id="cards-country" aria-label="Pays"><option value="all">Tous pays</option>${countries}</select>
              <select id="cards-minp" aria-label="Puissance minimale">${[[0, "Toute puissance"], [150, "150 ch et +"], [300, "300 ch et +"], [500, "500 ch et +"], [800, "800 ch et +"]].map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>
              <select id="cards-sort" aria-label="Trier par">${[["num", "Tri : numéro"], ["rar", "Tri : rareté"], ["owned", "Tri : doublons d'abord"], ["level", "Tri : niveau"], ["power", "Tri : puissance"], ["speed", "Tri : vitesse"], ["zero", "Tri : 0 à 100"], ["brand", "Tri : marque"], ["year", "Tri : année (anciennes)"], ["yeard", "Tri : année (récentes)"]].map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div>
            <div class="chip-row" role="group" aria-label="Filtrer">${[["all", "Toutes"], ["owned", "Possédées"], ["missing", "Manquantes"], ["dups", "Doublons"], ["wish", "★ Wishlist"], ["circuits", "🏁 Circuits et livrées"]].map(([k, l]) => `<button type="button" class="chip" data-cf="${k}">${l}</button>`).join("")}
              <span class="seg cg-viewseg" role="group" aria-label="Affichage">${[["grid", "Grille"], ["compact", "Compact"], ["binder", "Classeur"]].map(([k, l]) => `<button type="button" data-view="${k}" aria-pressed="false">${l}</button>`).join("")}</span></div>
            <div class="tcg-grid" id="tcg-grid"></div></section></div></div>`;
    }
    syncToolbar(); renderHero(); if (ctab === "mine") renderGrid();
    fillTitles();
  }

  // ------------------------------------------------------------------ profil public : collection et wishlist
  function profPage(ids, page) {
    return ids.slice(page * PAGE, (page + 1) * PAGE).map((id) => `<a href="${G.isSpecial(id) ? "#/jouer/collection" : "#/voiture/" + encodeURIComponent(id)}" class="tcg-mini-link">${cardHtml(cardObj(id), { cls: "tcg-mini" })}</a>`).join("") + pagerHtml("data-ppage", page, ids.length);
  }
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
      const give = Object.keys(d.owned || {}).filter((id) => d.owned[id] > 1 && cardObj(id)).sort((a, b) => ORDER.indexOf(rarityOf(cardObj(a))) - ORDER.indexOf(rarityOf(cardObj(b))));
      ids.sort((a, b) => (G.isSpecial(b) ? 1 : 0) - (G.isSpecial(a) ? 1 : 0) || ORDER.indexOf(rarityOf(cardObj(a))) - ORDER.indexOf(rarityOf(cardObj(b))));
      const mine = C.user && C.user.uid !== uid ? await myCollection() : null;
      const offer = (id) => mine && (mine.owned[id] || 0) > 1;
      const sc = await loadShowcase(uid), vit = (sc.ids || []).filter((id) => (d.owned || {})[id] > 0 && cardObj(id)).slice(0, 6);
      const carDocs = await Promise.all((sc.cars || []).slice(0, 3).map((cid) => C.db.collection("community_cars").doc(cid).get().then((x) => (x.exists && x.data().uid === uid ? Object.assign({ id: x.id }, x.data()) : null)).catch(() => null)));
      const pubCars = carDocs.filter(Boolean);
      if (!ids.length && !wl.length && !vit.length && !give.length) return;
      const vitHtml = vit.length || pubCars.length ? `<div class="panel-section-title">Vitrine</div><div class="cg-pshow" data-bg="${sc.bg || ""}">${vit.map((id) => `<div class="cg-pshow-i"><a href="${G.isSpecial(id) ? "#/jouer/collection" : "#/voiture/" + encodeURIComponent(id)}" class="tcg-mini-link">${cardHtml(cardObj(id), { owned: true, count: 0 })}</a>${mine && !(mine.owned[id] > 0) ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-wish-add="${C.esc(id)}">★ Je cherche cette carte</button>` : ""}</div>`).join("")}${pubCars.map((c) => `<div class="cg-pshow-i">${cardHtml(myCarObj(c), { owned: true, count: 0 })}<small class="tcg-hint">Sa voiture</small></div>`).join("")}</div>` : "";
      el.innerHTML = `${vitHtml}${ids.length ? `<div class="panel-section-title">Collection de cartes <span class="lap-meta">${G.recount(Object.assign({}, d)).count} / ${C.cars.length + G.CIRCUIT_CARDS.length + G.LIVERIES.length}${d.specials ? " · ✦ " + d.specials : ""}</span></div>
        <div class="tcg-strip" id="pub-cards-strip">${profPage(ids, 0)}</div>` : ""}
        ${give.length ? `<div class="panel-section-title">🔁 Je donne <span class="lap-meta">${give.length} doublon${give.length > 1 ? "s" : ""}</span></div><div class="wish-list give-list">${give.slice(0, 12).map((id) => { const c = cardObj(id); return `<span class="wish-chip give">${C.esc(String(c.model).replace(/\s*\(.*$/, "").slice(0, 26))} ×${(d.owned || {})[id]}</span>`; }).join("")}</div>` : ""}
        ${wl.length ? `<div class="panel-section-title">★ Je cherche <span class="lap-meta">${wl.length}</span></div>
        <div class="wish-list">${wl.slice(0, 12).map((id) => { const c = cardObj(id); return `<span class="wish-chip ${offer(id) ? "match" : ""}" title="${C.esc(c.brand + " " + c.model)}">${C.esc(String(c.model).replace(/\s*\(.*$/, "").slice(0, 26))}${offer(id) ? " · tu l'as en double" : ""}</span>`; }).join("")}</div>
        ${mine && wl.some(offer) ? `<a class="cta-btn fill-btn compact-btn" href="#/jouer/echanges" data-trade-with="${C.esc(uid)}">🔄 Proposer un échange</a>` : ""}` : ""}`;
      el.onclick = (ev) => { const pp = ev.target.closest("[data-ppage]"); if (!pp) return; const st = el.querySelector("#pub-cards-strip"); if (st) st.innerHTML = profPage(ids, Math.max(0, Number(pp.dataset.ppage) || 0)); };
    } catch (e) { /* collection privée ou règles non publiées */ }
  }
  async function myCollection() { try { await load(); return doc; } catch (_) { return null; } }

  document.addEventListener("click", (e) => { const b = e.target.closest("[data-sheet-card]"); if (b && C && C.user) showDetail(b.dataset.sheetCard, [], { peek: true }); else if (b) C && C.toast && C.toast("Connecte-toi pour voir la carte.", "err"); });
  window.MACards = { editShowcase: () => editShowcase(), loadRarOv, sheetBadge, setRarOv: (m) => { rarOv = m || {}; }, rarOv: () => rarOv, autoRarity: (car) => { indexCars(); return rarityMap.get(car.id) || "common"; }, lvOf, pool: () => C.cars, rarityOf, numberOf, cardHtml, cardObj, RAR, load: (f) => load(f), mine: () => doc, myWish: () => wish || [], loadSpecials, specials: () => specials, loadWish, applyDoc, isOwned, countOf };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("play", { enter: async (p) => {
      if (p.tab !== "collection" && p.tab !== "boutique") return;
      ctab = p.tab === "boutique" ? "shop" : "mine";
      render();
      await load().catch(() => {});
      await Promise.all([loadClaims(), loadMyShowcase()]).catch(() => {});
      render();
      let want = "";
      try { const u = new URL(location.href); want = u.searchParams.get("carte") || ""; if (want) { u.searchParams.delete("carte"); history.replaceState(null, "", u.pathname + (u.search || "") + u.hash); } } catch (_) { /* facultatif */ }
      if (want) {
        if (/^sp-/.test(want)) await loadSpecials().catch(() => {});
        if (cardObj(want)) showDetail(want, [], { peek: true }); else C.toast("Cette carte n'existe plus.", "err");
      }
    } });
    ctx.Router.register("pilot", { enter: (p) => renderProfile(p.uid) });
    document.addEventListener("ma:auth", () => { doc = null; loadedFor = null; wish = null; claims = null; showcase = null; if (ctx.Router.is("play", { tab: "collection" }) || ctx.Router.is("play", { tab: "boutique" })) { render(); load(true).then(render).catch(() => {}); } });
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-dust-log]")) { showDustLog(); return; }
      if (e.target.closest("#cards-root [data-recycle]")) { recycleOpen(); return; }
      if (e.target.closest("#cards-root [data-wheel]")) { wheelOpen(); return; }
      const adv = e.target.closest("#cards-root [data-advent]"); if (adv) { adventOpen(Number(adv.dataset.advent)); return; }
      const advGo = e.target.closest("#cards-root [data-advent-go]");
      if (advGo) {
        const st = adventState();
        if (st.mode === "ready") { adventOpen(st.n); return; }
        C.toast(st.mode === "wait" ? "🎄 Le calendrier de l'Avent ouvre le 1er décembre, dans " + fmtLeft(st.left) + "." : st.mode === "tomorrow" ? "🎄 La case " + st.n + " ouvre à minuit, dans " + fmtLeft(st.left) + "." : "🎄 Toutes les cases sont ouvertes. À l'an prochain !", "ok");
        const sec = document.getElementById("cg-advent"); if (sec && sec.scrollIntoView) sec.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
        return;
      }
      const pk = e.target.closest("[data-pack]");
      if (pk) { openPack(pk.dataset.pack, pk.dataset.shop, pk.dataset.offer === "1"); return; }
      const ct = e.target.closest("#cards-root [data-ctab]");
      if (ct) { ctab = ct.dataset.ctab; store.set("ma_cards_tab", ctab); render(); return; }
      const ak = e.target.closest("#cards-root [data-akind]");
      if (ak) { albumKind = ak.dataset.akind; store.set("ma_cards_albums", albumKind); renderHero(); return; }
      const al = e.target.closest("#cards-root [data-album]");
      if (al) { showAlbum(al.dataset.album); return; }
      if (e.target.closest("#cards-root [data-show-edit]")) { editShowcase(); return; }
      const mp = e.target.closest("#cards-root [data-mycar-pub]");
      if (mp) { toggleMyCar(mp.dataset.mycarPub); return; }
      const oc = e.target.closest("#cards-root [data-offer-card]");
      if (oc) { buyOffer(oc.dataset.offerCard); return; }
      if (e.target.closest("#cards-root [data-set-claim]")) { claimAlbums(false); return; }
      const wa = e.target.closest("[data-wish-add]");
      if (wa) { addWish(wa.dataset.wishAdd, wa); return; }
      const gp = e.target.closest("[data-gpage]");
      if (gp) { gridPage = Math.max(0, Number(gp.dataset.gpage) || 0); renderGrid(); const g = document.getElementById("tcg-grid"); if (g) g.scrollIntoView({ block: "start", behavior: "smooth" }); return; }
      const cf = e.target.closest("[data-cf]");
      if (cf) { filter = cf.dataset.cf; syncToolbar(); renderGrid(); return; }
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
      else if (e.target.id === "cards-country") { countryFilter = e.target.value; renderGrid(); }
      else if (e.target.id === "cards-minp") { minPower = Number(e.target.value) || 0; renderGrid(); }
      else if (e.target.id === "cards-sort") { sortBy = e.target.value; store.set("ma_cards_sort", sortBy); renderGrid(); }
    });
    shownDay = day(); setInterval(dayWatch, 20000); document.addEventListener("visibilitychange", () => { if (!document.hidden) dayWatch(); });
    document.addEventListener("ma:game", () => { if (doc && (ctx.Router.is("play", { tab: "collection" }) || ctx.Router.is("play", { tab: "boutique" }))) load(true).then(render).catch(() => {}); });
  });
})();
