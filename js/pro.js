/**
 * MOTORAUTO PRO — extension payante (page #/pro) : présentation de l'offre, explorateur des modifications, gestion de l'abonnement.
 *
 *   pro_config/cats      { cats: [{ id, label, icon, pin?, subs: [{ id, label }] }] }   structure modifiable par les administrateurs
 *   pro_config/settings  { signups: bool, live: bool, priceEur: number, trialDays: number }   interrupteurs (administrateurs)
 *   pro_mods/{id}        une modification d'une voiture : { carId, cat, sub, title, description, gain, difficulty, cost, compat, risks, homolog,
 *                         engineKey?, status: draft|reviewed|published, author, reviewedBy?, order, updatedAt }   écriture : administrateurs seulement
 *   pro_subs/{uid}       { status: trialing|active|past_due|canceled|expired, accessUntil, trialEnd?, cancelAtPeriodEnd, trialUsed, mode }
 *                         écrit UNIQUEMENT par les Cloud Functions (webhook Stripe) ; lisible par son propriétaire et les administrateurs
 * L'accès aux modifications est contrôlé par les règles Firestore (jamais seulement par cette interface) :
 * un abonné actif ne lit que les modifications « publiées » ; un administrateur lit et écrit tout, sans abonnement.
 * Aucun contenu technique n'est écrit dans le code : tout vient de la base remplie par l'équipe.
 */
(function () {
  "use strict";
  let C = null, sub = null, subUid = "", cats = null, cfg = { signups: false, live: false, priceEur: 5, trialDays: 90 }, loaded = false, selCar = "", busy = false;
  const modsCache = new Map();
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const $ = (id) => document.getElementById(id);
  const ms = (t) => (t && t.toMillis ? t.toMillis() : t && t.seconds ? t.seconds * 1000 : Number(t) || 0);
  const defaults = () => JSON.parse(JSON.stringify(window.MA_PRO_DEFAULT_CATS || []));
  const dateStr = (t) => { const v = ms(t); if (!v) return ""; try { return new Date(v).toLocaleDateString(window.MAI18n ? window.MAI18n.locale() : "fr-FR", { day: "numeric", month: "long", year: "numeric" }); } catch (_) { return new Date(v).toISOString().slice(0, 10); } };

  // ---------------------------------------------------------------- données
  async function loadConfig(force) {
    if (loaded && !force) return;
    try {
      const [a, b] = await Promise.all([C.db.collection("pro_config").doc("cats").get(), C.db.collection("pro_config").doc("settings").get()]);
      cats = a.exists && Array.isArray(a.data().cats) && a.data().cats.length ? a.data().cats : defaults();
      if (b.exists) cfg = Object.assign(cfg, b.data());
    } catch (_) { cats = cats || defaults(); }
    loaded = true;
  }
  async function loadSub(force) {
    const uid = C.user ? C.user.uid : "";
    if (!uid) { sub = null; subUid = ""; return null; }
    if (!force && subUid === uid) return sub;
    subUid = uid; sub = null;
    try { const d = await C.db.collection("pro_subs").doc(uid).get(); sub = d.exists ? d.data() : null; } catch (_) { sub = null; }
    return sub;
  }
  /** état d'accès : admin (gratuit) · trial · active · expired · none */
  function access() {
    if (C.isAdmin) return { kind: "admin", ok: true };
    if (!C.user) return { kind: "out", ok: false };
    if (!sub) return { kind: "none", ok: false };
    const until = ms(sub.accessUntil), live = until > Date.now();
    if (sub.status === "trialing" && live) return { kind: "trial", ok: true, until, trialEnd: ms(sub.trialEnd) || until };
    if ((sub.status === "active" || sub.status === "past_due") && live) return { kind: "active", ok: true, until, cancel: !!sub.cancelAtPeriodEnd, late: sub.status === "past_due" };
    return { kind: "expired", ok: false, until };
  }
  async function callFn(name, data) {
    const fns = window.MAFB && window.MAFB.functions;
    if (!fns) throw new Error("offline");
    return (await fns.httpsCallable(name)(data || {})).data;
  }

  // ---------------------------------------------------------------- présentation
  const BENEFITS = [
    ["🧑‍🔧", "Écrit et relu par l'équipe", "Aucune IA et aucune base externe : chaque modification est saisie, relue puis publiée par les administrateurs de MOTORAUTO."],
    ["🚗", "Voiture par voiture", "Pour chaque modèle : freinage, châssis, suspensions, liaison au sol, aérodynamisme, refroidissement, moteur et swaps, échappement, boîte, allègement."],
    ["📋", "Une fiche claire par modification", "Description, gain ou effet, difficulté, coût indicatif, compatibilité, risques et remarque d'homologation."],
    ["⚠️", "Prudence avant tout", "Chaque fiche rappelle qu'il s'agit d'un conseil général à faire contrôler par un professionnel, avec les limites route / piste."]
  ];
  const price = () => String(cfg.priceEur || 5).replace(".", ",") + " €";
  const trialMonths = () => Math.max(1, Math.round((Number(cfg.trialDays) || 90) / 30));
  function testBanner() { return cfg.live ? "" : `<p class="mp-test" role="note"><b>${T("Mode test")}</b> <span>${T("Aucun paiement réel n'est possible pour le moment.")}</span></p>`; }

  function ctaHtml(a) {
    const closed = !cfg.signups && !C.isAdmin;
    if (a.kind === "admin") return `<a class="cta-btn fill-btn" href="#/pro/explorer">${T("Explorer les modifications")}</a><p class="mp-note">${T("Accès administrateur : gratuit, sans abonnement.")}</p>`;
    if (a.kind === "trial" || a.kind === "active") return `<a class="cta-btn fill-btn" href="#/pro/explorer">${T("Explorer les modifications")}</a><a class="cta-btn btn-ghost" href="#/pro/abonnement">${T("Mon abonnement")}</a>`;
    if (!C.user) return `<button type="button" class="cta-btn fill-btn" data-mp="login">${T("Se connecter pour essayer")}</button>`;
    if (closed) return `<button type="button" class="cta-btn fill-btn" disabled>${T("Ouverture prochaine")}</button><p class="mp-note">${T("Les inscriptions ne sont pas encore ouvertes. Reviens bientôt !")}</p>`;
    if (a.kind === "expired") return `<button type="button" class="cta-btn fill-btn" data-mp="subscribe">${T("S'abonner")} · ${price()} ${T("par mois")}</button>`;
    return `<button type="button" class="cta-btn fill-btn" data-mp="subscribe">${T("Essayer 3 mois gratuits")}</button><p class="mp-note">${T("Puis")} ${price()} ${T("par mois")}. ${T("Sans engagement : résiliable en un clic.")}</p>`;
  }
  function renderOffer() {
    const root = $("pro-offer"); if (!root) return;
    const a = access(), esc = C.esc;
    root.innerHTML = `${testBanner()}
      <section class="mp-hero">
        <span class="mp-badge">PRO</span>
        <h2>${T("Les modifications, voiture par voiture")}</h2>
        <p>${T("Une base de données rédigée et relue par l'équipe MOTORAUTO pour préparer ta voiture : quoi modifier, pour quel gain, à quel coût et avec quels risques.")}</p>
        <div class="mp-price"><b>${trialMonths()} ${T("mois offerts")}</b><span>${T("puis")} ${price()} / ${T("mois")}</span></div>
        <div class="mp-cta">${ctaHtml(a)}</div>
      </section>
      <section class="mp-benefits">${BENEFITS.map((b) => `<article class="mp-benefit"><span aria-hidden="true">${b[0]}</span><h3>${T(b[1])}</h3><p>${T(b[2])}</p></article>`).join("")}</section>
      <section class="cg-block"><header class="cg-bh"><h3>${T("Les rubriques")}</h3><span class="cg-sub">${T("La liste s'enrichit au fil du temps.")}</span></header>
        <div class="mp-cats">${(cats || []).map((c) => `<span class="mp-cat"><i aria-hidden="true">${esc(c.icon || "🔧")}</i>${esc(c.label)}</span>`).join("")}</div></section>
      <p class="mp-fine">${T("La base est en cours de constitution : de nouvelles modifications sont publiées après relecture. Les informations restent des conseils généraux et ne remplacent jamais l'avis d'un professionnel.")}</p>`;
  }

  // ---------------------------------------------------------------- explorateur
  const norm = (s) => (C.normalize ? C.normalize(s) : String(s).toLowerCase());
  const carName = (c) => (c.brand + " " + c.model).trim();
  function lockHtml(a) {
    const why = !C.user ? T("Connecte-toi pour accéder aux modifications PRO.") : a.kind === "expired" ? T("Ton abonnement PRO a expiré.") : T("Cette partie est réservée aux abonnés MOTORAUTO PRO.");
    return `<div class="mp-lock"><span aria-hidden="true">🔒</span><h3>${why}</h3><div class="mp-cta">${ctaHtml(a)}</div><a class="link-more" href="#/pro/offre">${T("Découvrir l'offre")}</a></div>`;
  }
  function renderExplorer() {
    const root = $("pro-explorer"); if (!root) return;
    const a = access();
    if (!a.ok) { root.innerHTML = lockHtml(a); return; }
    const car = selCar && C.carsById.get(selCar);
    root.innerHTML = `<div class="mp-pick"><label for="mp-q">${T("Choisis une voiture")}</label>
      <input id="mp-q" type="search" autocomplete="off" placeholder="${T("Marque ou modèle…")}" aria-label="${T("Rechercher une voiture")}" value="${car ? C.esc(carName(car)) : ""}"><div id="mp-res" class="mp-res" role="listbox"></div></div>
      <div id="mp-mods">${car ? `<div class="empty-note">${T("Chargement…")}</div>` : `<div class="empty-note">${T("Cherche une voiture pour voir ses modifications.")}</div>`}</div>`;
    if (car) showMods(car.id);
  }
  function suggest(q) {
    const res = $("mp-res"); if (!res) return;
    const n = norm(q).trim();
    if (n.length < 2) { res.innerHTML = ""; return; }
    const words = n.split(/\s+/), out = [];
    for (const c of C.cars) { const h = norm(carName(c)); if (words.every((w) => h.includes(w))) { out.push(c); if (out.length >= 12) break; } }
    res.innerHTML = out.map((c) => `<button type="button" role="option" class="mp-opt" data-mp-car="${C.esc(c.id)}">${C.esc(carName(c))}${c.years ? `<small>${C.esc(String(c.years))}</small>` : ""}</button>`).join("") || `<div class="lap-meta">${T("Aucune voiture trouvée.")}</div>`;
  }
  async function fetchMods(carId, force) {
    const hit = modsCache.get(carId);
    if (!force && hit && Date.now() - hit.at < 120000) return hit.list;
    let q = C.db.collection("pro_mods").where("carId", "==", carId);
    if (!C.isAdmin) q = q.where("status", "==", "published");
    const s = await q.limit(400).get();
    const list = s.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    modsCache.set(carId, { at: Date.now(), list });
    return list;
  }
  const FIELDS = [["gain", "Gain / effet"], ["difficulty", "Difficulté"], ["cost", "Coût indicatif"], ["compat", "Compatibilité"], ["risks", "Risques"], ["homolog", "Homologation"]];
  const LEVEL = Object.fromEntries((window.MA_PRO_LEVELS || []).filter((x) => x[0]));
  const STATUS = Object.fromEntries(window.MA_PRO_STATUS || []);
  function modHtml(m, subLabel) {
    const esc = C.esc, swap = m.sub === "swap-moteur" || !!m.engineKey;
    const rows = FIELDS.map(([k, l]) => { const v = k === "difficulty" ? (LEVEL[m[k]] || "") : m[k]; return v ? `<div><dt>${T(l)}</dt><dd data-no-i18n>${k === "difficulty" ? T(v) : esc(v)}</dd></div>` : ""; }).join("");
    return `<article class="mp-mod ${m.status !== "published" ? "mp-mod-draft" : ""}">
      <header><h4 data-no-i18n>${esc(m.title || "")}</h4>${C.isAdmin ? `<span class="mp-status mp-${esc(m.status)}">${T(STATUS[m.status] || m.status)}</span>` : `<span class="mp-status mp-published">${T("Relu et publié")}</span>`}</header>
      ${subLabel ? `<p class="mp-sub" data-no-i18n>${esc(subLabel)}</p>` : ""}
      ${m.description ? `<p class="mp-desc" data-no-i18n>${esc(m.description).replace(/\n/g, "<br>")}</p>` : ""}
      ${rows ? `<dl class="mp-fields">${rows}</dl>` : ""}
      ${swap ? `<p class="mp-swap"><b>${T("Swap moteur")}</b> <span>${T(window.MA_PRO_SWAP_NOTE)}</span>${m.engineKey ? ` <a href="#/moteur/${encodeURIComponent(m.engineKey)}">${T("Voir la fiche moteur")}</a>` : ""}</p>` : ""}
      <p class="mp-warn" role="note"><span aria-hidden="true">⚠</span> <span>${T(window.MA_PRO_WARNING)}</span></p>
    </article>`;
  }
  async function showMods(carId) {
    const box = $("mp-mods"); if (!box) return;
    selCar = carId;
    const car = C.carsById.get(carId); if (!car) return;
    box.innerHTML = `<div class="empty-note">${T("Chargement…")}</div>`;
    let list = [];
    try { list = await fetchMods(carId); }
    catch (_) { box.innerHTML = `<div class="empty-note error">${T("Lecture impossible pour le moment.")}</div>`; return; }
    if (selCar !== carId || !$("mp-mods")) return;
    const byCat = new Map(); list.forEach((m) => { const k = m.cat || ""; (byCat.get(k) || byCat.set(k, []).get(k)).push(m); });
    const known = new Set((cats || []).map((c) => c.id));
    const order = (cats || []).filter((c) => byCat.has(c.id)).concat(Array.from(byCat.keys()).filter((k) => !known.has(k)).map((k) => ({ id: k, label: k, subs: [] })));
    box.innerHTML = `<header class="mp-car"><h3 data-no-i18n>${C.esc(carName(car))}</h3><a class="link-more" href="#/voiture/${encodeURIComponent(car.id)}">${T("Fiche de la voiture")}&nbsp;➔</a></header>` +
      (order.length ? order.map((c) => {
        const mods = byCat.get(c.id).slice().sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.title).localeCompare(String(b.title), "fr"));
        const subLabel = (id) => { const s = (c.subs || []).find((x) => x.id === id); return s ? s.label : ""; };
        return `<details class="adm-sec mp-catblk" open><summary><span class="adm-t"><i aria-hidden="true">${C.esc(c.icon || "🔧")}</i> ${C.esc(c.label)} <small>(${mods.length})</small></span></summary><div class="adm-body">${mods.map((m) => modHtml(m, subLabel(m.sub))).join("")}</div></details>`;
      }).join("") : `<div class="empty-note">${T("Aucune modification publiée pour cette voiture pour l'instant. La base se remplit au fil des semaines.")}</div>`);
  }

  // ---------------------------------------------------------------- abonnement
  function renderAccount() {
    const root = $("pro-account"); if (!root) return;
    const a = access(), esc = C.esc;
    if (!C.user) { root.innerHTML = `<div class="mp-lock"><span aria-hidden="true">👤</span><h3>${T("Connecte-toi pour voir ton abonnement.")}</h3><div class="mp-cta"><button type="button" class="cta-btn fill-btn" data-mp="login">${T("Me connecter")}</button></div></div>`; return; }
    let badge, line = "", actions = "";
    if (a.kind === "admin") { badge = ["mp-ok", "Administrateur"]; line = T("Tu as un accès gratuit et permanent en tant qu'administrateur."); }
    else if (a.kind === "trial") { badge = ["mp-ok", "Essai gratuit"]; line = `${T("Ton essai gratuit se termine le")} ${dateStr(a.trialEnd)}. ${T("Sans carte enregistrée, l'accès s'arrête simplement à cette date.")}`; actions = `<button type="button" class="cta-btn fill-btn" data-mp="portal">${T("Gérer mon abonnement")}</button>`; }
    else if (a.kind === "active") { badge = [a.late ? "mp-warn-b" : "mp-ok", a.late ? "Paiement en retard" : "Abonnement actif"]; line = a.late ? T("Le dernier paiement a échoué : mets à jour ta carte pour garder l'accès.") : a.cancel ? `${T("Résilié : l'accès reste ouvert jusqu'au")} ${dateStr(a.until)}.` : `${T("Prochain renouvellement le")} ${dateStr(a.until)}.`; actions = `<button type="button" class="cta-btn fill-btn" data-mp="portal">${T("Gérer mon abonnement")}</button>${a.cancel ? "" : `<button type="button" class="cta-btn btn-ghost" data-mp="cancel">${T("Résilier")}</button>`}`; }
    else if (a.kind === "expired") { badge = ["mp-off", "Expiré"]; line = `${T("Ton accès PRO a pris fin le")} ${dateStr(a.until)}.`; actions = ctaHtml(a); }
    else { badge = ["mp-off", "Aucun abonnement"]; line = T("Tu n'as pas encore d'abonnement MOTORAUTO PRO."); actions = ctaHtml(a); }
    root.innerHTML = `${testBanner()}<section class="cg-block mp-acct"><header class="cg-bh"><h3>${T("Mon abonnement")}</h3><span class="mp-pill ${badge[0]}">${T(badge[1])}</span></header>
      <p>${line}</p><div class="mp-cta">${actions}</div>
      <p class="mp-fine">${T("Résiliation en un clic, sans frais. L'accès est coupé à la fin de la période payée.")} <a href="#/legal">${T("Conditions et mentions légales")}</a></p></section>`;
  }

  async function act(kind) {
    if (busy) return; busy = true;
    try {
      if (!C.user) { C.requireLogin(); return; }
      if (kind === "cancel" && !confirm(T("Résilier ton abonnement ? L'accès reste ouvert jusqu'à la fin de la période déjà payée."))) return;
      const fn = { subscribe: "proCheckout", portal: "proPortal", cancel: "proCancel" }[kind];
      const r = await callFn(fn, { origin: location.origin + location.pathname });
      if (r && r.url) { location.href = r.url; return; }
      await loadSub(true); paintAll();
      C.toast(T("C'est fait."), "ok");
    } catch (e) {
      const m = String((e && e.message) || "");
      C.toast(/closed|fermé|signups/i.test(m) ? T("Les inscriptions ne sont pas encore ouvertes.") : T("Le paiement n'est pas disponible pour le moment. Réessaie plus tard."), "err");
    } finally { busy = false; }
  }

  function paintAll() { renderOffer(); renderExplorer(); renderAccount(); paintChip(); }
  function paintChip() {
    const b = $("pro-btn"); if (!b) return;
    if (/^#\/pro(\/|$)/.test(location.hash)) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    const a = C && C.user ? access() : null;
    b.classList.toggle("mp-on", !!(a && a.ok));
  }
  async function enter() {
    await loadConfig(); await loadSub(true); paintAll();
  }

  window.MAPro = { access: () => (C ? access() : { kind: "out", ok: false }), cats: () => cats || defaults(), cfg: () => cfg, reload: async () => { await loadConfig(true); paintAll(); }, defaults, modsCache, fetchMods };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.Router.register("pro", { enter });
    document.addEventListener("ma:auth", () => { subUid = ""; modsCache.clear(); if (/^#\/pro/.test(location.hash)) enter(); else loadSub(true).then(paintChip); });
    document.addEventListener("ma:route", () => paintChip());
    setTimeout(() => { loadConfig().then(() => loadSub()).then(paintChip); }, 1500);
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-mp]");
      if (b) { if (b.dataset.mp === "login") C.requireLogin(); else act(b.dataset.mp); return; }
      const o = e.target.closest("[data-mp-car]");
      if (o) { const res = $("mp-res"); if (res) res.innerHTML = ""; const car = C.carsById.get(o.dataset.mpCar); const q = $("mp-q"); if (q && car) q.value = carName(car); showMods(o.dataset.mpCar); }
    });
    document.addEventListener("input", (e) => { if (e.target.id === "mp-q") suggest(e.target.value); });
  });
})();
