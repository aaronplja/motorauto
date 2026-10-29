/**
 * MOTORAUTO — application principale
 * Catalogue, recherche, profils, chronos, classement, chat, admin.
 *
 * Règles de ce fichier :
 *  - aucune donnée utilisateur n'est injectée dans le HTML sans MA.esc() ;
 *  - aucun gestionnaire inline (onclick=…) : tout passe par data-action + délégation ;
 *  - aucun secret dans le code : l'admin repose sur le claim { admin: true } (voir scripts/set-admin.js)
 *    et surtout sur firestore.rules / storage.rules.
 */
(function () {
  "use strict";

  const {
    esc, safeUrl, normalize, parseLapTime, formatLapTime, trackKey, lapMs, sortLaps,
    normalizeCar, matchesQuery, authErrorMessage, FALLBACK_AVATAR, FALLBACK_CAR
  } = window.MA;

  const ITEMS_PER_PAGE = 20;
  const ADMIN_FIELDS_ALLOWED = ["username", "currentCar", "avatar", "bio", "isPublicGarage", "carPhoto", "mods", "emailNotifs", "instagram", "snapchat", "tiktok"];

  const { auth, db, storage, FieldValue } = window.MAFB;
  const MA = window.MA;

  // ------------------------------------------------------------------ état
  let currentUser = null;
  let isAdmin = false;
  let isSuper = false; // admin principal : peut nommer / retirer les autres admins
  let profile = defaultProfile();
  let garage = { favorites: [], telemetry: [] };
  let pendingRegistration = null;

  let CATALOGUE = [];
  let carsById = new Map();
  let localIds = new Set();
  let cloudIds = new Set();
  let cloudCars = [];

  const filters = { category: "all", brand: "all", sort: "name-asc", query: "", page: 1, drive: "all", turbo: "all", pmin: null, pmax: null, zero: null, vmax: null, yfrom: null, yto: null };

  let modalStack = [];
  let allLaps = [];
  let editingCar = null;

  function defaultProfile() {
    return { username: "Pilote", currentCar: "Non renseignée", avatar: "", bio: "", isPublicGarage: true, carPhoto: "", mods: "", emailNotifs: true, instagram: "", snapchat: "", tiktok: "" };
  }

  // ------------------------------------------------------------- utilitaires DOM
  const $ = (id) => document.getElementById(id);
  const storageGet = MA.store.get, storageSet = MA.store.set;

  const isPage = (el) => !!el && el.classList.contains("page");
  const PAGE_FALLBACK = { "vehicle-modal": "/catalogue", "public-profile-modal": "/communaute/pilotes", "garage-modal": "/", "admin-panel-modal": "/", "leaderboard-modal": "/" };
  function openModal(modal) {
    if (!modal || isPage(modal)) return; // les pages sont affichées par le routeur
    if (!modalStack.includes(modal)) { modalStack.push(modal); modal._prevFocus = document.activeElement; }
    modal.style.zIndex = String(1000 + modalStack.length * 10);
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    const first = modal.querySelector(".dialog-close-btn, input, button");
    if (first && window.matchMedia("(pointer: fine)").matches) setTimeout(() => first.focus({ preventScroll: true }), 60);
  }

  function closeModal(modal) {
    if (!modal) return;
    if (isPage(modal)) { if (Router.current() && document.getElementById(modal.id) && modal.classList.contains("page-on")) Router.back(PAGE_FALLBACK[modal.id] || "/"); return; }
    modalStack = modalStack.filter((m) => m !== modal);
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    if (modalStack.length === 0) document.body.classList.remove("modal-open");
    const prev = modal._prevFocus;
    if (prev && document.contains(prev)) { try { prev.focus({ preventScroll: true }); } catch (_) { /* ignoré */ } }
    modal._prevFocus = null;
  }

  // pastille coulissante de la navigation (suit le survol, revient sur l'onglet actif)
  function moveGlider(target) {
    const nav = $("desktop-nav"), g = $("nav-glider");
    if (!nav || !g) return;
    const el = target || nav.querySelector(".nav-link.active");
    if (!el || !nav.offsetWidth) { g.style.opacity = "0"; return; }
    g.style.opacity = "1";
    g.style.width = el.offsetWidth + "px";
    g.style.transform = `translateX(${el.offsetLeft}px)`;
  }

  function requireLogin() {
    if (currentUser) return true;
    openModal($("auth-modal"));
    return false;
  }

  function pilotName() {
    return profile.username || (currentUser && (currentUser.displayName || currentUser.email.split("@")[0])) || "Pilote";
  }

  function avatarImg(url, cls, extra = "") {
    return `<img src="${esc(safeUrl(url) || FALLBACK_AVATAR)}" alt="Avatar" class="${cls}" data-fallback="avatar" ${extra}>`;
  }

  // ---------------------------------------------------------------- catalogue
  function rebuildCatalogue() {
    const map = new Map();
    MOTORAUTO_DATABASE.forEach((c) => map.set(c.id, c));
    cloudCars.forEach((c) => map.set(c.id, c));
    CATALOGUE = Array.from(map.values()).map(normalizeCar);
    carsById = new Map(CATALOGUE.map((c) => [c.id, c]));
    populateBrandSelect();
  }

  const SCALE = { power: 1, torque: 1, speed: 1 };
  function computeScale() {
    SCALE.power = SCALE.torque = SCALE.speed = 1;
    CATALOGUE.forEach((c) => c.phases.forEach((p) => p.engines.forEach((e) => {
      SCALE.power = Math.max(SCALE.power, e.power); SCALE.torque = Math.max(SCALE.torque, e.torque); SCALE.speed = Math.max(SCALE.speed, e.speed);
    })));
  }

  function countUp(node, target) {
    if (!node) return;
    const from = Number(node.dataset.v || 0);
    node.dataset.v = target;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || from === target) { node.textContent = target; return; }
    const t0 = performance.now(), dur = 1200;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      node.textContent = Math.round(from + (target - from) * e);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function renderHeroExtras(groups) {
    countUp($("stat-cars"), CATALOGUE.length);
    countUp($("stat-engines"), CATALOGUE.reduce((n, c) => n + c.phases.reduce((m, p) => m + p.engines.length, 0), 0));
    countUp($("stat-brands"), groups.length);
    const items = groups.map((g) => `<button type="button" class="marquee-item" data-action="filter-brand" data-brand="${esc(g)}" tabindex="-1">${esc(g)}</button>`).join("");
    $("brand-marquee").innerHTML = items + items + items + items; // répété pour une boucle sans coupure (js/marquee.js)
  }

  function populateBrandSelect() {
    const select = $("brand-select");
    if (!select) return;
    const current = filters.brand;
    const groups = Array.from(new Set(CATALOGUE.map((c) => c.group))).sort((a, b) => a.localeCompare(b, "fr"));
    select.innerHTML = `<option value="all">Toutes les marques</option>` +
      groups.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join("");
    select.value = groups.includes(current) ? current : "all";
    filters.brand = select.value;
    computeScale();
    renderHeroExtras(groups);
  }

  async function loadPublicCatalog() {
    try {
      const snapshot = await db.collection("motorauto_catalog").get();
      cloudCars = [];
      snapshot.forEach((doc) => cloudCars.push(Object.assign({ id: doc.id }, doc.data())));
      cloudIds = new Set(cloudCars.map((c) => c.id));
    } catch (err) {
      console.warn("Catalogue cloud indisponible, base locale utilisée :", err);
    }
    rebuildCatalogue();
    renderCatalog();
  }

  const socStat = (id) => (window.MASocial && window.MASocial.carStats && window.MASocial.carStats("cat", id)) || { likes: 0, avg: 0, votes: 0 };
  function heroMatches() {
    const el = $("global-search-input");
    const q = el ? el.value.trim() : "";
    return q ? CATALOGUE.filter((c) => matchesQuery(c, q)) : CATALOGUE;
  }
  function getFilteredCars() {
    let result = CATALOGUE;
    if (filters.query.trim()) result = result.filter((c) => matchesQuery(c, filters.query));
    if (filters.category !== "all") result = result.filter((c) => c.category === filters.category);
    if (filters.brand !== "all") result = result.filter((c) => c.group === filters.brand);
    if (filters.drive !== "all") result = result.filter((c) => MA.inCategory(c, filters.drive));
    if (filters.turbo !== "all") result = result.filter((c) => MA.inCategory(c, filters.turbo));
    if (filters.pmin != null) result = result.filter((c) => c.stats.power >= filters.pmin);
    if (filters.pmax != null) result = result.filter((c) => c.stats.power > 0 && c.stats.power <= filters.pmax);
    if (filters.zero != null) result = result.filter((c) => c.stats.zero != null && c.stats.zero <= filters.zero);
    if (filters.vmax != null) result = result.filter((c) => c.stats.speed >= filters.vmax);
    if (filters.yfrom != null) result = result.filter((c) => c.yearRange && c.yearRange[1] >= filters.yfrom);
    if (filters.yto != null) result = result.filter((c) => c.yearRange && c.yearRange[0] <= filters.yto);

    const sorted = result.slice();
    if (filters.sort === "power-desc") sorted.sort((a, b) => b.stats.power - a.stats.power);
    else if (filters.sort === "speed-desc") sorted.sort((a, b) => b.stats.speed - a.stats.speed);
    else if (filters.sort === "zero-asc") sorted.sort((a, b) => (a.stats.zero == null) - (b.stats.zero == null) || a.stats.zero - b.stats.zero);
    else if (filters.sort === "torque-desc") sorted.sort((a, b) => b.stats.torque - a.stats.torque);
    else if (filters.sort === "year-desc") sorted.sort((a, b) => (b.yearRange ? b.yearRange[0] : 0) - (a.yearRange ? a.yearRange[0] : 0));
    else if (filters.sort === "year-asc") sorted.sort((a, b) => (a.yearRange ? a.yearRange[0] : 9999) - (b.yearRange ? b.yearRange[0] : 9999));
    else if (filters.sort === "likes-desc") sorted.sort((a, b) => socStat(b.id).likes - socStat(a.id).likes || a.model.localeCompare(b.model, "fr", { numeric: true }));
    else if (filters.sort === "rating-desc") sorted.sort((a, b) => socStat(b.id).avg - socStat(a.id).avg || socStat(b.id).votes - socStat(a.id).votes);
    else sorted.sort((a, b) => a.model.localeCompare(b.model, "fr", { numeric: true }));
    return sorted;
  }

  // Carrousel : plusieurs photos défilables en glissant (scroll-snap) ou avec les flèches
  function slidesHtml(car, lazy) {
    const imgs = car.images && car.images.length ? car.images : [car.image];
    const one = (u, i) => `<img src="${esc(safeUrl(u) || FALLBACK_CAR)}" alt="${esc(car.model)}${imgs.length > 1 ? " (" + (i + 1) + "/" + imgs.length + ")" : ""}" ${lazy && i ? 'loading="lazy"' : ""} draggable="false" data-fallback="car">`;
    if (imgs.length < 2) return `<div class="car-slides single">${one(imgs[0], 0)}</div>`;
    return `<div class="car-slides" data-slides>${imgs.map(one).join("")}</div>
      <button type="button" class="slide-arrow prev" data-action="slide" data-dir="-1" aria-label="Photo précédente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>
      <button type="button" class="slide-arrow next" data-action="slide" data-dir="1" aria-label="Photo suivante"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>
      <div class="slide-dots" aria-hidden="true">${imgs.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>`;
  }
  function slideBy(node, dir) {
    const box = node.closest(".car-thumb-wrap, .sheet-hero-banner");
    const sl = box && box.querySelector("[data-slides]");
    if (!sl) return;
    const n = sl.children.length;
    const i = Math.round(sl.scrollLeft / sl.clientWidth);
    const to = (i + dir + n) % n;
    sl.scrollTo({ left: to * sl.clientWidth, behavior: "smooth" });
  }
  document.addEventListener("scroll", (e) => {
    const sl = e.target;
    if (!sl || !sl.matches || !sl.matches("[data-slides]")) return;
    const dots = sl.parentElement.querySelectorAll(".slide-dots i");
    const i = Math.round(sl.scrollLeft / Math.max(1, sl.clientWidth));
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
  }, true);

  function carCard(car) {
    const isFav = garage.favorites.includes(car.id);
    const s = car.stats;
    const adminActions = isAdmin ? `
      <div class="car-admin-actions">
        <button type="button" class="cta-btn fill-btn compact-btn" data-action="edit-car" data-id="${esc(car.id)}">Modifier</button>
        <button type="button" class="secondary-destructive-btn" data-action="delete-car" data-id="${esc(car.id)}">Supprimer</button>
      </div>` : "";

    return `
      <div class="car-box" data-action="open-car" data-id="${esc(car.id)}" role="button" tabindex="0">
        <div class="car-thumb-wrap">
          ${slidesHtml(car, true)}
          <span class="badge-tag-phase">${esc(car.phases[0].phaseName)}</span>
          <button type="button" class="btn-compare-action ${compareIds.includes(car.id) ? "on" : ""}" data-action="toggle-compare" data-id="${esc(car.id)}" title="Ajouter au comparateur" aria-label="Ajouter au comparateur"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/></svg></button>
          <button type="button" class="btn-bookmark-action ${isFav ? "bookmarked" : ""}" data-action="toggle-fav" data-id="${esc(car.id)}" title="Marquer en favori" aria-label="Marquer en favori"><svg viewBox="0 0 24 24" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg></button>
        </div>
        <div class="car-card-body">
          <div class="car-make-row">
            <span class="car-brand-name">${esc(car.brand)}</span>
            <span class="car-years-label">${esc(car.years)}</span>
          </div>
          <h3 class="car-model-name">${esc(car.model)}</h3>
          <div class="specs-trio">
            <div class="spec-entry"><span class="spec-lbl">Puissance</span><span class="spec-val">${s.power ? s.power + '<i class="spec-u">ch</i>' : "—"}</span></div>
            <div class="spec-entry"><span class="spec-lbl">V-Max</span><span class="spec-val">${s.speed ? s.speed + '<i class="spec-u">km/h</i>' : "—"}</span></div>
            <div class="spec-entry"><span class="spec-lbl">0-100</span><span class="spec-val">${s.zero ? s.zero + '<i class="spec-u">s</i>' : "—"}</span></div>
          </div>
          ${window.MASocial ? window.MASocial.badge("cat", car.id) : ""}
          <div class="badge-record-preview"><span>🏁 ${esc((car.records[0] && car.records[0].type) || "Archive Certifiée")}</span></div>
          ${adminActions}
        </div>
      </div>`;
  }


  // ------------------------------------------------- compte-tours du hero
  const GAUGE = { max: 2000, start: 135, sweep: 270, cx: 150, cy: 150, red: 0.8, major: 200, mid: 100, minor: 20 };
  let gaugeShown = 0, gaugeRaf = 0, gaugeReady = false;

  function polar(r, deg) {
    const a = (deg * Math.PI) / 180;
    return [GAUGE.cx + r * Math.cos(a), GAUGE.cy + r * Math.sin(a)];
  }
  function arcPath(r, fromDeg, toDeg) {
    const [x1, y1] = polar(r, fromDeg), [x2, y2] = polar(r, toDeg);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }
  const gaugeDeg = (ch) => GAUGE.start + GAUGE.sweep * Math.min(1, Math.max(0, ch / GAUGE.max));
  function initGauge() {
    const ticks = $("gauge-ticks");
    if (!ticks) return;
    const end = GAUGE.start + GAUGE.sweep;
    $("gauge-track").setAttribute("d", arcPath(112, GAUGE.start, end));
    $("gauge-redline").setAttribute("d", arcPath(112, gaugeDeg(GAUGE.max * GAUGE.red), end));
    const fill = $("gauge-fill");
    fill.setAttribute("d", arcPath(112, GAUGE.start, end));
    const len = fill.getTotalLength();
    fill.style.strokeDasharray = len;
    fill.style.strokeDashoffset = len;
    fill.dataset.len = len;
    let html = "";
    for (let v = 0; v <= GAUGE.max; v += GAUGE.minor) {
      const major = v % GAUGE.major === 0, mid = !major && v % GAUGE.mid === 0;
      if (!major && !mid && v % GAUGE.minor !== 0) continue;
      const deg = gaugeDeg(v), hot = v >= GAUGE.max * GAUGE.red;
      const [x1, y1] = polar(major ? 88 : mid ? 94 : 98, deg), [x2, y2] = polar(104, deg);
      html += `<line class="${major ? "major" : mid ? "mid" : "minor"}${hot ? " hot" : ""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      if (major) {
        const [tx, ty] = polar(72, deg);
        html += `<text class="${hot ? "hot" : ""}" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}">${v}</text>`;
      }
    }
    ticks.innerHTML = html;
    $("gauge-needle").style.transform = `rotate(${GAUGE.start}deg)`;
    gaugeReady = true;
  }
  function updateGauge(results) {
    if (!gaugeReady) return;
    const top = results.reduce((m, c) => Math.max(m, c.stats.power), 0);
    const ratio = Math.min(1, top / GAUGE.max);
    const root = $("hero-gauge");
    if (root) root.classList.toggle("in-red", ratio >= GAUGE.red);
    // laisse le navigateur peindre la position de départ avant de lancer le balayage
    requestAnimationFrame(() => {
      $("gauge-needle").style.transform = `rotate(${gaugeDeg(top)}deg)`;
      const fill = $("gauge-fill");
      fill.style.strokeDashoffset = fill.dataset.len * (1 - ratio);
    });
    const vmax = results.reduce((m, c) => Math.max(m, c.stats.speed), 0);
    const zeros = results.map((c) => c.stats.zero).filter((z) => z > 0);
    $("gauge-vmax").textContent = vmax ? vmax + " km/h" : "—";
    $("gauge-zero").textContent = zeros.length ? Math.min(...zeros) + " s" : "—";
    $("gauge-count").textContent = results.length === 0
      ? "Aucun véhicule : affinez la recherche"
      : `puissance maximale parmi ${results.length} véhicule${results.length > 1 ? "s" : ""}`;
    if (root) root.setAttribute("aria-label", `Compte-tours : ${top} ch maximum sur une échelle de ${GAUGE.max} ch`);
    cancelAnimationFrame(gaugeRaf);
    const from = gaugeShown, t0 = performance.now(), dur = 1300;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      gaugeShown = Math.round(from + (top - from) * e);
      $("gauge-power").textContent = gaugeShown;
      if (k < 1) gaugeRaf = requestAnimationFrame(tick);
    };
    gaugeRaf = requestAnimationFrame(tick);
  }

  function renderCatalog(opts) {
    const grid = $("vehicles-grid");
    if (!grid) return;
    const result = getFilteredCars();
    $("results-count").textContent = `${result.length} véhicule(s) répertorié(s) dans l'archive mondiale`;

    const totalPages = Math.max(1, Math.ceil(result.length / ITEMS_PER_PAGE));
    if (filters.page > totalPages) filters.page = totalPages;
    const pageItems = result.slice((filters.page - 1) * ITEMS_PER_PAGE, filters.page * ITEMS_PER_PAGE);

    updateGauge(heroMatches());
    grid.innerHTML = pageItems.length === 0
      ? `<div class="empty-grid">Aucun véhicule trouvé.</div>`
      : pageItems.map(carCard).join("");
    renderPagination(totalPages);
    if (opts && opts.animate === false) grid.querySelectorAll(".car-box").forEach((c) => c.classList.add("in"));
    else observeReveals();
  }

  let revealObserver = null;
  function observeReveals() {
    if (!("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("js-reveal");
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const t = en.target;
          t.style.transitionDelay = (Number(t.dataset.i || 0) % 6) * 70 + "ms";
          t.classList.add("in");
          revealObserver.unobserve(t);
          setTimeout(() => { t.style.transitionDelay = ""; }, 1000);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    }
    document.querySelectorAll("#vehicles-grid .car-box:not(.in)").forEach((c, i) => { c.dataset.i = i; revealObserver.observe(c); });
  }

  function renderPagination(totalPages) {
    const box = $("pagination-container");
    if (totalPages <= 1) { box.innerHTML = ""; return; }
    const p = filters.page;
    let html = `<button type="button" class="page-btn" data-action="change-page" data-page="${p - 1}" ${p === 1 ? "disabled" : ""}>Précédent</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - p) <= 1) {
        html += `<button type="button" class="page-btn ${i === p ? "active" : ""}" data-action="change-page" data-page="${i}">${i}</button>`;
      } else if (Math.abs(i - p) === 2) {
        html += `<span class="page-ellipsis">…</span>`;
      }
    }
    html += `<button type="button" class="page-btn" data-action="change-page" data-page="${p + 1}" ${p === totalPages ? "disabled" : ""}>Suivant</button>`;
    box.innerHTML = html;
  }

  // ----------------------------------------------------------------- recherche
  function renderSuggestions(text) {
    const box = $("search-suggestions");
    const q = String(text == null ? ($("global-search-input").value || "") : text).trim();
    if (q.length < 2) { box.classList.remove("open"); box.innerHTML = ""; return; }
    const matches = CATALOGUE.filter((c) => matchesQuery(c, q)).slice(0, 6);
    if (matches.length === 0) {
      box.innerHTML = `<div class="suggestion-empty">Aucun résultat pour « ${esc(q)} »</div>`;
    } else {
      box.innerHTML = matches.map((c) => `
        <button type="button" class="suggestion-item" data-action="open-suggestion" data-id="${esc(c.id)}">
          <span class="suggestion-model">${esc(c.brand)} ${esc(c.model)}</span>
          <span class="suggestion-years">${esc(c.years)}</span>
        </button>`).join("");
    }
    box.classList.add("open");
    box.setAttribute("aria-hidden", "false");
  }

  function hideSuggestions() {
    for (const id of ["search-suggestions", "catalog-suggestions"]) {
      const box = $(id); if (!box) continue;
      box.classList.remove("open");
      box.setAttribute("aria-hidden", "true");
    }
    const ci = $("catalog-search-input"); if (ci) ci.setAttribute("aria-expanded", "false");
  }
  // suggestions du champ de recherche du catalogue (même moteur tolérant que l'accueil)
  function renderCatalogSuggestions() {
    const box = $("catalog-suggestions"), input = $("catalog-search-input"); if (!box || !input) return;
    const q = input.value.trim();
    if (q.length < 2) { hideSuggestions(); return; }
    const matches = CATALOGUE.filter((c) => matchesQuery(c, q)).slice(0, 6);
    box.innerHTML = matches.length ? matches.map((c) => `
      <button type="button" class="suggestion-item" role="option" data-action="open-suggestion" data-id="${esc(c.id)}">
        <span class="suggestion-model">${esc(c.brand)} ${esc(c.model)}</span>
        <span class="suggestion-years">${esc(c.years)}</span>
      </button>`).join("") : `<div class="suggestion-empty">Aucun résultat pour « ${esc(q)} » — vérifie l'orthographe ou <a href="#/contact">propose ce véhicule</a></div>`;
    box.classList.add("open"); box.setAttribute("aria-hidden", "false"); input.setAttribute("aria-expanded", "true");
  }

  // ------------------------------------------------------------ fiche véhicule
  const pct = (v, max) => Math.max(4, Math.min(100, Math.round((v / max) * 100)));
  function bar(label, value, unit, ratio) {
    return `<div class="eng-bar"><span>${label}</span><strong>${esc(value)}${unit}</strong><i style="--w:${ratio}%"></i></div>`;
  }

  function renderPhaseDetails(phase) {
    const editions = phase.notableEditions && phase.notableEditions.length
      ? `<p class="phase-editions">Éditions notables : ${phase.notableEditions.map(esc).join(" • ")}</p>` : "";
    return `
      ${phase.details ? `<p class="phase-details">${esc(phase.details)}</p>` : ""}
      ${editions}
      <div class="engines-matrix">
        ${phase.engines.length ? phase.engines.map((e) => `
          <div class="engine-blueprint-card">
            <a class="eng-name eng-link" href="#/moteur/${encodeURIComponent(MA.engineKey(e))}" title="Voir toutes les voitures qui partagent ce moteur">${esc(e.name)}<span aria-hidden="true"> ↗</span></a>
            ${bar("Puissance", e.power, " ch", pct(e.power, SCALE.power))}
            ${bar("Couple", e.torque, " Nm", pct(e.torque, SCALE.torque))}
            ${bar("V-Max", e.speed, " km/h", pct(e.speed, SCALE.speed))}
            ${bar("0-100 km/h", e.zeroToHundred || "—", e.zeroToHundred ? " s" : "", e.zeroToHundred ? pct(Math.max(0.5, 16 - e.zeroToHundred), 14) : 4)}
            <div class="eng-trans">Transmission : <b>${esc(e.transmission)}</b></div>
          </div>`).join("") : `<div class="empty-note">Aucune motorisation renseignée pour cette phase.</div>`}
      </div>`;
  }

  function sheetFavLabel(carId) {
    return garage.favorites.includes(carId) ? "★ Dans mon écurie" : "☆ Ajouter à mon écurie";
  }

  // Lien de partage : la page statique voiture/<id>.html (aperçu riche) si elle existe, sinon ?car=<id>
  const STATIC_IDS = new Set(MOTORAUTO_DATABASE.map((c) => c.id));
  function shareUrlFor(id) {
    const web = /^https?:$/.test(location.protocol);
    const base = web ? location.origin + location.pathname.replace(/[^/]*$/, "") : location.href.split(/[?#]/)[0].replace(/[^/]*$/, "");
    if (web && STATIC_IDS.has(id)) return base + "voiture/" + encodeURIComponent(id) + ".html";
    return base + "index.html?car=" + encodeURIComponent(id);
  }

  // Titre / description de la page pendant l'ouverture d'une fiche (utile aux onglets, favoris et robots qui exécutent le JS)
  const seoDefault = { title: document.title, desc: (document.querySelector('meta[name="description"]') || {}).content || "" };
  function setSeo(car) {
    const setMeta = (sel, v) => { const m = document.querySelector(sel); if (m) m.setAttribute("content", v); };
    const title = car ? `${car.brand} ${car.model} — fiche technique | MOTORAUTO` : seoDefault.title;
    const desc = car ? `${car.brand} ${car.model} (${car.years}) : ${car.stats.power} ch, ${car.stats.speed} km/h. ${car.description || ""}`.slice(0, 300) : seoDefault.desc;
    document.title = title;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
  }

  function openVehicleSheet(carId) { Router.go("/voiture/" + encodeURIComponent(carId)); }
  function renderVehicle(carId) {
    const car = carsById.get(carId);
    if (!car) { MA.toast("Cette fiche n'existe pas (ou plus).", "err"); Router.go("/catalogue", { replace: true }); return; }
    setSeo(car);
    const s = car.stats;
    $("vehicle-detail-content").innerHTML = `
      <div class="sheet-hero-banner">
        ${slidesHtml(car, false)}
      </div>
      <div class="sheet-heading-box">
        <div class="sheet-brandline">${esc(car.brand)} <span>${esc(car.years)}</span></div>
        <h2 class="sheet-big-title">${esc(car.model)}</h2>
        <p class="sheet-blurb">${esc(car.description)}</p>
        <div class="sheet-actions">
          <button type="button" class="cta-btn fill-btn compact-btn" id="sheet-fav-btn" data-action="sheet-fav" data-id="${esc(car.id)}">${sheetFavLabel(car.id)}</button>
          <button type="button" class="cta-btn btn-ghost compact-btn" id="sheet-compare-btn" data-action="toggle-compare" data-id="${esc(car.id)}">${compareIds.includes(car.id) ? "✓ Dans le comparateur" : "⇄ Comparer"}</button>
          <button type="button" class="cta-btn btn-ghost compact-btn" data-action="share-car" data-id="${esc(car.id)}">Copier le lien</button>
          <button type="button" class="cta-btn btn-ghost compact-btn" data-action="share-car-chat" data-id="${esc(car.id)}">Envoyer dans le chat</button>
          ${car.archives.length || isAdmin ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-action="open-archives" data-id="${esc(car.id)}">Archives${car.archives.length ? " (" + car.archives.length + ")" : ""}</button>` : ""}
          <button type="button" class="cta-btn btn-ghost compact-btn" data-action="suggest-car" data-id="${esc(car.id)}">✎ Proposer une modification</button>
        </div>
      </div>
      <div class="sheet-core-body">
        <div class="sheet-kpis">
          <div><b>${s.power || "—"}</b><small>ch (maximum)</small></div>
          <div><b>${s.speed || "—"}</b><small>km/h en pointe</small></div>
          <div><b>${s.zero || "—"}</b><small>secondes de 0 à 100</small></div>
        </div>

        ${car.approx ? `<p class="sheet-approx">Chiffres de référence arrondis (indicatifs) : ils varient selon l'année, le marché et le règlement.</p>` : ""}
        ${car.history ? `<div class="sheet-section-head">Histoire</div><div class="history-prose">${car.history.split(/\n{2,}|\n/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("")}</div>` : ""}
        <div class="sheet-section-head">Motorisations</div>
        <div class="phases-strip" role="tablist">
          ${car.phases.map((p, idx) => `<button type="button" role="tab" class="phase-pill-btn ${idx === 0 ? "active" : ""}" data-action="switch-phase" data-car="${esc(car.id)}" data-idx="${idx}">${esc(p.phaseName)}</button>`).join("")}
        </div>
        <div id="active-phase-container">${renderPhaseDetails(car.phases[0])}</div>

        <div class="sheet-section-head">Palmarès &amp; records</div>
        <div class="records-box">
          ${car.records.length ? car.records.map((r) => `<div class="record-line"><strong>${esc(r.type)} :</strong> ${esc(r.description)}</div>`).join("") : `<div class="record-line">Aucun record renseigné.</div>`}
        </div>

        ${car.anecdotes.length ? `<div class="sheet-section-head">Anecdotes</div><div class="anecdote-list">${car.anecdotes.map((a) => `<div class="anecdote-card">${a.title ? `<b>${esc(a.title)}</b>` : ""}<p>${esc(a.text)}</p></div>`).join("")}</div>` : ""}
        <div class="sheet-section-head">Photos de la communauté</div>
        <div class="community-gallery" id="community-gallery"><div class="empty-note">Chargement…</div></div>

        <div class="sheet-section-head">Enregistrer un chrono</div>
        <div class="telemetry-input-matrix">
          <div class="input-stack"><label for="telemetry-track">Circuit</label><input type="text" id="telemetry-track" maxlength="60" placeholder="Ex : Nürburgring Nordschleife"></div>
          <div class="input-stack"><label for="telemetry-time">Chrono (M:SS.cc)</label><input type="text" id="telemetry-time" maxlength="10" inputmode="decimal" placeholder="Ex : 7:44.88"></div>
          <div class="input-stack"><label for="telemetry-note">Configuration</label><input type="text" id="telemetry-note" maxlength="80" placeholder="Ex : semi-slicks, stage 1"></div>
        </div>
        <div class="form-feedback error-txt" id="telemetry-error" role="alert"></div>
        <button type="button" class="cta-btn fill-btn w-100" data-action="submit-telemetry" data-id="${esc(car.id)}">Envoyer le chrono</button>
      </div>`;
    loadCommunityPhotos(car.id);
    document.dispatchEvent(new CustomEvent("ma:car-rendered", { detail: { car } }));
  }

  // --------------------------------------------------------------- archives d'une fiche (anciens catalogues, publicités)
  function openArchives(carId) {
    const car = carsById.get(carId); if (!car) return;
    const isImg = (u) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u) || /firebasestorage\.googleapis\.com/.test(u);
    $("archives-title").textContent = "Archives — " + car.brand + " " + car.model;
    $("archives-body").innerHTML = car.archives.length ? `<div class="archives-grid">${car.archives.map((a) => `
      <a class="archive-card" href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener noreferrer">
        <span class="archive-thumb">${isImg(a.url) ? `<img src="${esc(safeUrl(a.url))}" alt="" loading="lazy" data-fallback="car">` : `<i class="archive-doc" aria-hidden="true">PDF</i>`}</span>
        <b>${esc(a.title)}</b><small>${esc([a.kind, a.year].filter((x) => x && x !== "autre").join(" · "))}</small>
      </a>`).join("")}</div>` : `<div class="empty-note">Aucune archive pour l'instant.${isAdmin ? " Ajoute-en depuis l'éditeur de véhicule (champ « Archives »)." : ""}</div>`;
    if (isAdmin) $("archives-body").insertAdjacentHTML("beforeend", `<div class="archives-admin"><button type="button" class="cta-btn btn-ghost compact-btn" data-action="admin-edit-archives" data-id="${esc(car.id)}">Gérer les archives</button></div>`);
    openModal($("archives-modal"));
  }

  // ------------------------------------------------------------------ favoris
  function syncSheetFav(carId) {
    const b = $("sheet-fav-btn");
    if (b && b.dataset.id === carId) b.textContent = sheetFavLabel(carId);
  }

  async function toggleFavorite(carId) {
    if (!requireLogin()) return;
    const idx = garage.favorites.indexOf(carId);
    if (idx > -1) garage.favorites.splice(idx, 1); else garage.favorites.push(carId);
    renderCatalog({ animate: false });
    syncSheetFav(carId);
    if (Router.is("garage")) renderGarage();
    try {
      await saveGarage();
    } catch (err) {
      // on annule le changement local si la sauvegarde échoue
      const i = garage.favorites.indexOf(carId);
      if (i > -1) garage.favorites.splice(i, 1); else garage.favorites.push(carId);
      renderCatalog({ animate: false });
      if (Router.is("garage")) renderGarage();
      MA.toast("Impossible d'enregistrer le favori : " + err.message, "err");
    }
  }

  // -------------------------------------------------------------- profil & garage
  async function loadUserData() {
    if (!currentUser) return;
    const uref = db.collection("users").doc(currentUser.uid);
    const gref = uref.collection("garage").doc("data");
    try {
      const [uSnap, gSnap] = await Promise.all([uref.get(), gref.get()]);

      if (uSnap.exists) {
        const d = uSnap.data();
        profile = {
          username: d.username || currentUser.email.split("@")[0],
          currentCar: d.currentCar || "Projet Principal",
          avatar: d.avatar || "",
          bio: d.bio || "",
          isPublicGarage: d.isPublicGarage !== false,
          carPhoto: d.carPhoto || "",
          mods: d.mods || "",
          emailNotifs: d.emailNotifs !== false,
          instagram: d.instagram || "", snapchat: d.snapchat || "", tiktok: d.tiktok || ""
        };

        // Migration des anciens profils : favoris/chronos étaient dans le document public.
        const extras = Object.keys(d).filter((k) => !ADMIN_FIELDS_ALLOWED.includes(k));
        if (gSnap.exists) {
          garage = { favorites: gSnap.data().favorites || [], telemetry: gSnap.data().telemetry || [] };
        } else {
          garage = { favorites: d.favorites || [], telemetry: sanitizeLegacyTelemetry(d.telemetry || []) };
          if (garage.favorites.length || garage.telemetry.length) await gref.set(garage);
        }
        if (extras.length) {
          const cleanup = {};
          extras.forEach((k) => { cleanup[k] = FieldValue.delete(); });
          await uref.update(cleanup);
        }
      } else {
        const reg = pendingRegistration;
        profile = {
          username: (reg && reg.username) || currentUser.displayName || currentUser.email.split("@")[0],
          currentCar: (reg && reg.car) || "Projet Principal",
          avatar: currentUser.photoURL || "",
          bio: "",
          isPublicGarage: true,
          carPhoto: "",
          mods: "",
          emailNotifs: true,
          instagram: "", snapchat: "", tiktok: ""
        };
        garage = { favorites: [], telemetry: [] };
        await uref.set(profile);
        await gref.set(garage);
        document.dispatchEvent(new CustomEvent("ma:feed", { detail: { type: "member", text: "a rejoint l'écurie MOTORAUTO", link: "#/pilote/" + currentUser.uid } }));
      }
      pendingRegistration = null;
    } catch (err) {
      console.error("Erreur chargement profil :", err);
    }
    $("settings-username").value = profile.username;
    $("settings-avatar").value = profile.avatar;
    $("settings-avatar-preview").src = AVATAR_SRC(profile.avatar);
    $("settings-bio").value = profile.bio;
    $("settings-public-garage").checked = profile.isPublicGarage;
    $("settings-email-notifs").checked = profile.emailNotifs !== false;
    $("settings-car").value = profile.currentCar === "Projet Principal" || profile.currentCar === "Non renseignée" ? "" : profile.currentCar;
    $("settings-car-photo").value = profile.carPhoto;
    $("settings-car-preview").src = safeUrl(profile.carPhoto) || FALLBACK_CAR;
    $("settings-mods").value = profile.mods;
    ["instagram", "snapchat", "tiktok"].forEach((k) => { const el = $("settings-" + k); if (el) el.value = profile[k] ? "@" + profile[k] : ""; });
  }

  // Les anciens chronos portaient un serverTimestamp (jamais sauvegardé) : on garde le strict nécessaire.
  function sanitizeLegacyTelemetry(list) {
    return list.filter((t) => t && t.chrono).map((t) => ({
      id: t.id || "",
      carName: String(t.carName || ""),
      track: String(t.track || ""),
      chrono: String(t.chrono),
      chronoMs: typeof t.chronoMs === "number" ? t.chronoMs : parseLapTime(t.chrono),
      note: String(t.note || ""),
      createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now()
    }));
  }

  async function saveProfile() {
    const data = {
      username: profile.username, currentCar: profile.currentCar,
      avatar: profile.avatar, bio: profile.bio, isPublicGarage: profile.isPublicGarage,
      carPhoto: profile.carPhoto || "", mods: profile.mods || "", emailNotifs: profile.emailNotifs !== false,
      instagram: profile.instagram || "", snapchat: profile.snapchat || "", tiktok: profile.tiktok || ""
    };
    await db.collection("users").doc(currentUser.uid).set(data);
  }

  async function saveGarage() {
    await db.collection("users").doc(currentUser.uid).collection("garage").doc("data")
      .set({ favorites: garage.favorites, telemetry: garage.telemetry });
  }

  async function isUsernameTaken(name, exceptUid) {
    const q = await db.collection("users").where("username", "==", name).limit(5).get();
    let taken = false;
    q.forEach((d) => { if (d.id !== exceptUid) taken = true; });
    return taken;
  }

  function validateUsername(name) {
    if (name.length < 2 || name.length > 24) return "Le pseudo doit faire entre 2 et 24 caractères.";
    if (!/^[\p{L}\p{N}_. -]+$/u.test(name)) return "Le pseudo ne peut contenir que des lettres, chiffres, espaces, « _ », « . » et « - ».";
    return "";
  }

  const AVATAR_SRC = (u) => safeUrl(u) || FALLBACK_AVATAR;
  async function uploadAvatar(file) {
    const status = $("avatar-upload-status");
    if (!currentUser) return;
    if (!/^image\//.test(file.type)) { MA.toast("Choisis un fichier image.", "err"); return; }
    if (file.size > 25 * 1024 * 1024) { MA.toast("Image trop volumineuse (25 Mo maximum).", "err"); return; }
    if (!storage) { MA.toast("Le stockage de photos n'est pas disponible.", "err"); return; }
    const btn = $("avatar-upload-btn");
    btn.disabled = true; status.textContent = "Envoi de la photo…";
    try {
      const blob = await MA.resizeImage(file, 768, 0.88); // carré d'affichage : 768 px suffisent largement
      const ref = storage.ref(`avatars/${currentUser.uid}/${Date.now()}.jpg`);
      await ref.put(blob, { contentType: "image/jpeg" });
      const url = await ref.getDownloadURL();
      $("settings-avatar").value = url;
      $("settings-avatar-preview").src = url;
      profile.avatar = url;
      await saveProfile(); // enregistré tout de suite : pas besoin de revenir cliquer sur « Enregistrer »
      status.textContent = "Photo enregistrée ✔";
      MA.toast("Photo de profil mise à jour.", "ok");
    } catch (err) {
      status.textContent = "Échec de l'envoi.";
      MA.toast("Envoi impossible : " + (err.code === "storage/unauthorized" ? "action refusée par les règles Storage (déploie storage.rules)." : err.message), "err");
    } finally {
      btn.disabled = false; $("avatar-file-input").value = "";
    }
  }

  async function uploadCarPhoto(file) {
    const status = $("car-upload-status"), btn = $("car-upload-btn");
    if (!currentUser) return;
    if (!/^image\//.test(file.type)) { MA.toast("Choisis un fichier image.", "err"); return; }
    if (file.size > 25 * 1024 * 1024) { MA.toast("Image trop volumineuse (25 Mo maximum).", "err"); return; }
    if (!storage) { MA.toast("Le stockage de photos n'est pas disponible.", "err"); return; }
    btn.disabled = true; status.textContent = "Envoi de la photo…";
    try {
      const blob = await MA.resizeImage(file, 1600, 0.88);
      const ref = storage.ref(`car_photos/${currentUser.uid}/${Date.now()}.jpg`);
      await ref.put(blob, { contentType: "image/jpeg" });
      const url = await ref.getDownloadURL();
      $("settings-car-photo").value = url;
      $("settings-car-preview").src = url;
      profile.carPhoto = url;
      await saveProfile();
      status.textContent = "Photo enregistrée ✔";
      MA.toast("Photo de ta voiture mise à jour.", "ok");
    } catch (err) {
      status.textContent = "Échec de l'envoi.";
      MA.toast("Envoi impossible : " + (err.code === "storage/unauthorized" ? "action refusée par les règles Storage (republie storage.rules)." : err.message), "err");
    } finally {
      btn.disabled = false; $("car-file-input").value = "";
    }
  }

  async function saveProfileSettings() {
    if (!currentUser) return;
    const newUsername = $("settings-username").value.trim();
    const newAvatar = $("settings-avatar").value.trim();
    const err = validateUsername(newUsername);
    if (err) { MA.toast(err, "err"); return; }
    if (newAvatar && !safeUrl(newAvatar)) { MA.toast("L'avatar doit être une adresse web commençant par https://", "err"); return; }
    try {
      if (await isUsernameTaken(newUsername, currentUser.uid)) {
        MA.toast("Ce nom d'utilisateur est déjà utilisé par un autre pilote.", "err");
        return;
      }
      profile.username = newUsername;
      profile.avatar = newAvatar;
      profile.bio = $("settings-bio").value.trim().slice(0, 300);
      profile.currentCar = $("settings-car").value.trim().slice(0, 80) || "Projet Principal";
      const carPhoto = $("settings-car-photo").value.trim();
      if (carPhoto && !safeUrl(carPhoto)) { MA.toast("La photo de la voiture doit être une adresse web commençant par https://", "err"); return; }
      profile.carPhoto = carPhoto;
      profile.mods = $("settings-mods").value.trim().slice(0, 500);
      profile.isPublicGarage = $("settings-public-garage").checked;
      profile.emailNotifs = $("settings-email-notifs").checked;
      for (const k of ["instagram", "snapchat", "tiktok"]) {
        const raw = $("settings-" + k) ? $("settings-" + k).value : "";
        const h = window.MANets.parse(k, raw);
        if (raw.trim() && !h) { MA.toast("Réseau « " + window.MANets.label(k) + " » : colle ton lien ou ton pseudo (lettres, chiffres, point, tiret bas).", "err"); return; }
        profile[k] = h;
      }
      await saveProfile();
      $("user-display-name").textContent = newUsername;
      renderGarageHeader();
      MA.toast("Profil mis à jour.", "ok");
    } catch (e) {
      MA.toast("Erreur lors de la mise à jour : " + e.message, "err");
    }
  }

  function renderGarageHeader() {
    $("garage-pilot-name").textContent = profile.username;
    { const av = $("garage-pilot-avatar"); if (av) { av.dataset.fallback = "avatar"; av.src = AVATAR_SRC(profile.avatar); } }
    $("garage-pilot-meta").textContent = `Projet actuel : ${profile.currentCar}`;
    $("garage-badges").innerHTML = "";
    if (currentUser) {
      renderSocial("garage", currentUser.uid);
      fetchAllLaps().then(() => {
        if (currentUser) $("garage-badges").innerHTML = badgesHtml(computeBadges(currentUser.uid, profile, garage.favorites.length));
      }).catch(() => {});
    }
  }

  function lapRow(t, { removable = false, idx = 0 } = {}) {
    return `
      <div class="telemetry-row">
        <div>
          <div class="lap-title">${esc(t.carName)} — <span class="lap-time">${esc(t.chrono)}</span></div>
          <div class="lap-meta">${esc(t.track)} (${esc(t.note || "Stock")})</div>
        </div>
        ${removable ? `<button type="button" class="telemetry-trash-btn" data-action="remove-telemetry" data-idx="${idx}" title="Supprimer" aria-label="Supprimer ce chrono">🗑️</button>` : ""}
      </div>`;
  }

  function renderGarage() {
    if (!currentUser) return;
    renderGarageHeader();
    $("stat-chronos-count").textContent = garage.telemetry.length;
    $("stat-favs-count").textContent = garage.favorites.length;
    $("user-telemetry-journal").innerHTML = garage.telemetry.length === 0
      ? `<div class="empty-note">Aucun chrono enregistré.</div>`
      : garage.telemetry.map((t, idx) => lapRow(t, { removable: true, idx })).join("");
    const favCars = garage.favorites.map((id) => carsById.get(id)).filter(Boolean);
    $("user-favorites-grid").innerHTML = favCars.length === 0
      ? `<div class="empty-note" style="grid-column: 1/-1;">Aucun favori.</div>`
      : favCars.map(carCard).join("");
  }

  function openGarageModal(tab) { Router.go("/garage" + (tab ? "/" + tab : "")); }

  async function removeTelemetry(idx) {
    const lap = garage.telemetry[idx];
    if (!lap) return;
    if (!confirm("Supprimer ce chrono de votre journal (et du classement mondial) ?")) return;
    garage.telemetry.splice(idx, 1);
    renderGarage();
    try {
      await saveGarage();
      if (lap.id) await db.collection("global_laps").doc(lap.id).delete().catch(() => {});
    } catch (err) {
      MA.toast("Erreur : " + err.message, "err");
    }
  }

  async function submitTelemetry(carId) {
    if (!requireLogin()) return;
    const errBox = $("telemetry-error");
    errBox.textContent = "";
    const car = carsById.get(carId);
    const track = $("telemetry-track").value.trim();
    const chronoRaw = $("telemetry-time").value.trim();
    const note = $("telemetry-note").value.trim().slice(0, 80);

    if (track.length < 2) { errBox.textContent = "Renseignez le circuit (2 caractères minimum)."; return; }
    const ms = parseLapTime(chronoRaw);
    if (ms == null) {
      errBox.textContent = "Chrono invalide. Format attendu : M:SS.cc (ex : 1:34.10), entre 10 s et 1 h.";
      return;
    }

    try { await fetchAllLaps(); } catch (_) { /* hors-ligne : pas de détection de record */ }
    const tk = trackKey(track);
    const isRecord = !allLaps.some((l) => (l.trackKey || trackKey(l.track || "")) === tk && l.chronoMs <= ms);
    const lapId = db.collection("global_laps").doc().id;
    const chrono = formatLapTime(ms);
    const carName = `${car.brand} ${car.model}`.slice(0, 100);

    try {
      await db.collection("global_laps").doc(lapId).set({
        pilot: pilotName(), pilotUid: currentUser.uid, carName, carId,
        track: track.slice(0, 60), trackKey: trackKey(track), chrono, chronoMs: ms,
        note: note || "Stock", createdAt: FieldValue.serverTimestamp()
      });
    } catch (err) {
      errBox.textContent = "Impossible d'enregistrer le chrono : " + err.message;
      return;
    }

    garage.telemetry.unshift({ id: lapId, carId, carName, track: track.slice(0, 60), chrono, chronoMs: ms, note: note || "Stock", createdAt: Date.now() });
    try {
      await saveGarage();
    } catch (err) {
      console.error("Chrono publié mais journal perso non sauvegardé :", err);
    }
    lapsFetchedAt = 0;
    document.dispatchEvent(new CustomEvent("ma:feed", { detail: { type: "record", text: `a signé le meilleur temps de ${track.slice(0, 60)} : ${chrono} en ${carName}`, link: "#/circuit/" + encodeURIComponent(tk) } }));
    MA.toast("Chrono enregistré : il est dans ton journal et au classement.", "ok");
  }

  // ---------------------------------------------------------------- badges
  // Calculés à partir du classement mondial (public) et du profil : rien n'est stocké.
  function computeBadges(uid, data, favCount) {
    const mine = allLaps.filter((l) => l.pilotUid === uid);
    const byTrack = new Map();
    allLaps.forEach((l) => {
      const k = l.trackKey || trackKey(l.track || "");
      if (!k) return;
      if (!byTrack.has(k)) byTrack.set(k, { name: l.track, laps: [] });
      byTrack.get(k).laps.push(l);
    });
    const firsts = [], podiums = [];
    byTrack.forEach((t) => {
      const best = new Map(); // meilleur tour par pilote
      t.laps.forEach((l) => {
        const id = l.pilotUid || "n:" + l.pilot;
        const ms = l.chronoMs != null ? l.chronoMs : parseLapTime(l.chrono || "") || Infinity;
        if (!best.has(id) || ms < best.get(id)) best.set(id, ms);
      });
      if (best.size < 2) return; // pas de « premier » tout seul sur un circuit
      const ranking = Array.from(best.entries()).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
      const pos = ranking.indexOf(uid);
      if (pos === 0) firsts.push(t.name);
      else if (pos > 0 && pos < 3) podiums.push(t.name);
    });
    const tracks = new Set(mine.map((l) => l.trackKey || trackKey(l.track || "")));
    const out = [];
    const add = (icon, label, hint, tier) => out.push({ icon, label, hint, tier: tier || "" });
    if (mine.length >= 1) add("🏁", "Premier chrono", "A enregistré son premier chrono");
    if (mine.length >= 10) add("⏱️", "10 chronos", `${mine.length} chronos au classement`, "silver");
    if (mine.length >= 50) add("🔥", "50 chronos", "Pilote infatigable", "gold");
    if (firsts.length) add("🥇", "Premier du circuit", "Meilleur temps sur : " + firsts.slice(0, 3).join(", "), "gold");
    if (podiums.length) add("🥉", "Sur le podium", "Top 3 sur : " + podiums.slice(0, 3).join(", "), "silver");
    if (tracks.size >= 5) add("🗺️", "Globe-trotter", `${tracks.size} circuits différents`, "silver");
    if (favCount >= 10) add("⭐", "Collectionneur", `${favCount} voitures dans l'écurie`);
    if (data && data.carPhoto && data.mods) add("🔧", "Projet documenté", "Voiture, photo et modifications renseignées");
    return out;
  }
  function badgesHtml(list) {
    return list.map((b) => `<span class="badge-pill ${esc(b.tier)}" title="${esc(b.hint)}"><i>${b.icon}</i>${esc(b.label)}</span>`).join("");
  }

  // ------------------------------------------------------------- classement
  let lapsFetchedAt = 0;
  async function fetchAllLaps(force) {
    if (!force && allLaps.length && Date.now() - lapsFetchedAt < 120000) return allLaps;
    const snapshot = await db.collection("global_laps").limit(1000).get();
    const out = [];
    snapshot.forEach((doc) => out.push(Object.assign({ docId: doc.id }, doc.data())));
    allLaps = out; lapsFetchedAt = Date.now();
    return allLaps;
  }

  function openLeaderboard() { Router.go("/classement/chronos"); }
  async function loadLeaderboardPage() {
    const list = $("global-leaderboard-list");
    list.innerHTML = `<div class="empty-note">Chargement des chronos mondiaux...</div>`;
    try {
      await fetchAllLaps(true);
      refreshLeaderboard();
    } catch (err) {
      console.error("Erreur classement :", err);
      list.innerHTML = `<div class="empty-note error">Impossible de charger le classement mondial.</div>`;
    }
  }

  // véhicule d'un chrono : carId (récent) ou, pour les anciens chronos, correspondance sur le nom
  let carByName = null;
  function lapCar(l) {
    if (l.carId && carsById.has(l.carId)) return carsById.get(l.carId);
    if (!carByName || carByName.size !== carsById.size) {
      carByName = new Map();
      carsById.forEach((c) => carByName.set(`${c.brand} ${c.model}`.slice(0, 100).toLowerCase(), c));
    }
    return carByName.get(String(l.carName || "").toLowerCase()) || null;
  }
  function lapTimeMs(l) { return l.createdAt && l.createdAt.toMillis ? l.createdAt.toMillis() : (typeof l.createdAt === "number" ? l.createdAt : 0); }

  function filteredLaps() {
    const cat = $("leaderboard-cat-select").value;
    const days = $("leaderboard-period-select").value;
    const since = days === "all" ? 0 : Date.now() - Number(days) * 86400000;
    return allLaps.filter((l) => {
      if (since && lapTimeMs(l) < since) return false;
      if (cat !== "all" && !MA.inCategory(lapCar(l), cat)) return false;
      return true;
    });
  }

  function refreshLeaderboard() {
    populateTrackSelect();
    renderLeaderboard();
  }

  function populateTrackSelect() {
    const select = $("leaderboard-track-select");
    const counts = new Map();
    filteredLaps().forEach((l) => {
      const key = l.trackKey || trackKey(l.track || "");
      if (!key) return;
      const entry = counts.get(key) || { name: l.track, n: 0 };
      entry.n++;
      counts.set(key, entry);
    });
    const tracks = Array.from(counts.entries()).sort((a, b) => b[1].n - a[1].n);
    const previous = select.value;
    select.innerHTML = tracks.length
      ? tracks.map(([key, v]) => `<option value="${esc(key)}">${esc(v.name)} (${v.n})</option>`).join("")
      : `<option value="">Aucun circuit</option>`;
    if (tracks.some(([k]) => k === previous)) select.value = previous;
  }

  function lapChips(lap) {
    const c = lapCar(lap);
    if (!c) return "";
    return ` <span class="lap-chip">${esc(MA.driveOf(c))}</span>${MA.isTurbo(c) ? ` <span class="lap-chip turbo">Turbo</span>` : ""}`;
  }

  function renderLeaderboard() {
    const list = $("global-leaderboard-list");
    const key = $("leaderboard-track-select").value;
    if (allLaps.length === 0) {
      list.innerHTML = `<div class="empty-note">Aucun chrono enregistré pour le moment. Soyez le premier sur la piste !</div>`;
      return;
    }
    if (!key) {
      list.innerHTML = `<div class="empty-note">Aucun chrono ne correspond à ces filtres. Essaie une autre catégorie ou une période plus large.</div>`;
      return;
    }
    const laps = sortLaps(filteredLaps().filter((l) => (l.trackKey || trackKey(l.track || "")) === key)).slice(0, 50);
    list.innerHTML = laps.map((lap, idx) => {
      const pilotLink = lap.pilotUid
        ? `<span class="pilot-link" data-action="open-profile" data-uid="${esc(lap.pilotUid)}">${esc(lap.pilot || "Pilote Anonyme")}</span>`
        : `<span class="pilot-link" data-action="open-profile-by-name" data-name="${esc(lap.pilot || "")}">${esc(lap.pilot || "Pilote Anonyme")}</span>`;
      const canDelete = isAdmin;
      return `
        <div class="telemetry-row">
          <div class="lap-left">
            <span class="leaderboard-rank ${idx < 3 ? "podium p" + (idx + 1) : ""}">${idx < 3 ? ["🥇", "🥈", "🥉"][idx] : "#" + (idx + 1)}</span>
            <div class="lap-info">
              <div class="lap-title">${pilotLink} <span class="lap-on">sur ${esc(lap.carName)}</span></div>
              <div class="lap-meta">${esc(lap.track)} (${esc(lap.note || "Stock")})${lapChips(lap)}</div>
            </div>
          </div>
          <div class="lap-right">
            <span class="lap-time big">${esc(lap.chronoMs != null ? formatLapTime(lap.chronoMs) : lap.chrono)}</span>
            ${canDelete ? `<button type="button" class="telemetry-trash-btn" data-action="delete-lap" data-id="${esc(lap.docId)}" title="Supprimer (admin)" aria-label="Supprimer ce chrono">🗑️</button>` : ""}
          </div>
        </div>`;
    }).join("");
  }

  const logAdmin = (action, o) => { if (window.MALog) window.MALog.log(action, o || {}); };
  async function deleteGlobalLap(docId) {
    if (!isAdmin || !confirm("Supprimer ce chrono du classement mondial pour tout le monde ?")) return;
    try {
      const gone = allLaps.find((l) => l.docId === docId);
      await db.collection("global_laps").doc(docId).delete();
      logAdmin("lap-delete", { target: docId, targetName: gone ? gone.pilot : "", detail: gone ? `chrono ${gone.chrono} sur ${gone.track}` : "chrono supprimé" });
      allLaps = allLaps.filter((l) => l.docId !== docId);
      populateTrackSelect();
      renderLeaderboard();
    } catch (err) {
      MA.toast("Erreur lors de la suppression : " + err.message, "err");
    }
  }

  // ------------------------------------------------------ registre & profils publics
  function openPilotsRegistry() { Router.go("/communaute/pilotes"); }
  let pilotsCache = [];
  async function loadPilotsRegistry() {
    const list = $("pilots-registry-list");
    list.innerHTML = `<div class="empty-note">Chargement du registre...</div>`;
    try {
      await MA.admins.load(db);
      const snapshot = await db.collection("users").limit(200).get();
      const pilots = [];
      snapshot.forEach((doc) => pilots.push(Object.assign({ id: doc.id }, doc.data())));
      if (pilots.length === 0) { list.innerHTML = `<div class="empty-note">Aucun pilote enregistré.</div>`; return; }
      pilots.sort((a, b) => String(a.username || "").localeCompare(String(b.username || ""), "fr"));
      pilotsCache = pilots;
      renderPilotsList();
    } catch (err) {
      console.error(err);
      list.innerHTML = `<div class="empty-note error">Impossible de charger le registre.</div>`;
    }
  }
  function renderPilotsList() {
    const list = $("pilots-registry-list");
    const q = normalize(($("pilots-search") && $("pilots-search").value) || "");
    const pilots = pilotsCache.filter((p) => !q || normalize([p.username, p.currentCar].join(" ")).includes(q));
    $("pilots-count").textContent = `${pilots.length} pilote${pilots.length > 1 ? "s" : ""}`;
    if (!pilots.length) { list.innerHTML = `<div class="empty-note">Aucun pilote${q ? " pour cette recherche" : " enregistré"}.</div>`; return; }
    {
      list.innerHTML = pilots.map((p) => {
        const canDelete = isAdmin && currentUser && p.id !== currentUser.uid && !MA.admins.has(p.id);
        const canGrade = isSuper && currentUser && p.id !== currentUser.uid;
        return `
          <div class="telemetry-row clickable" data-action="open-profile" data-uid="${esc(p.id)}" role="button" tabindex="0">
            <div class="pilot-row-left">
              ${avatarImg(p.avatar, "pilot-row-avatar")}
              <div class="pilot-row-text">
                <div class="pilot-row-name">${esc(p.username || "Pilote")}${MA.admins.tag(p.id)}</div>
                <div class="lap-meta">${p.currentCar ? "Projet : " + esc(p.currentCar) : "Aucun projet"}</div>
              </div>
            </div>
            <div class="pilot-row-right">
              <span class="see-profile">Voir profil ➔</span>
              ${canGrade ? `<button type="button" class="grade-btn ${MA.admins.has(p.id) ? "on" : ""}" data-action="toggle-admin" data-uid="${esc(p.id)}" data-name="${esc(p.username || "Pilote")}">${MA.admins.has(p.id) ? "Retirer admin" : "Nommer admin"}</button>` : ""}
              ${isAdmin && currentUser && p.id !== currentUser.uid && !MA.admins.has(p.id) ? `<button type="button" class="mute-btn" data-mod="mute" data-uid="${esc(p.id)}" data-name="${esc(p.username || "Pilote")}">Sourdine</button>` : ""}
              ${canDelete ? `<button type="button" class="telemetry-trash-btn" data-action="delete-user" data-uid="${esc(p.id)}" title="Supprimer ce profil (admin)" aria-label="Supprimer ce profil">🗑️</button>` : ""}
            </div>
          </div>`;
      }).join("");
    }
  }

  async function toggleAdminGrade(uid, name) {
    if (!isSuper || !uid || (currentUser && uid === currentUser.uid)) return;
    const has = MA.admins.has(uid);
    if (!confirm(has ? `Retirer le grade d'administrateur à ${name} ?` : `Donner le grade d'administrateur à ${name} ?\nIl pourra modifier le catalogue, traiter les messages signalés et les propositions.`)) return;
    try {
      const ref = db.collection("admins").doc(uid);
      logAdmin(has ? "admin-revoke" : "admin-grant", { target: uid, targetName: name, detail: has ? "grade retiré" : "grade accordé" });
      if (has) { await ref.delete(); MA.admins.remove(uid); }
      else { await ref.set({ username: name, grantedBy: currentUser.uid, grantedAt: FieldValue.serverTimestamp() }); MA.admins.add(uid); }
      MA.notif.send(uid, { type: "role", from: "MOTORAUTO", text: has ? "Ton grade d'administrateur a été retiré." : "Tu es maintenant administrateur du site !", link: "index.html" });
      MA.toast(has ? `${name} n'est plus admin.` : `${name} est maintenant admin.`, "ok");
      if (Router.is("community", { tab: "pilotes" })) loadPilotsRegistry();
      if (pubUid === uid) refreshPubAdminBtn(uid);
      const nameEl = $("pub-profile-name");
      if (pubUid === uid && nameEl) nameEl.innerHTML = esc(pubName) + MA.admins.tag(uid);
    } catch (err) {
      MA.toast("Action refusée : " + err.message + " (as-tu publié les dernières règles Firestore ?)", "err");
    }
  }
  function refreshPubAdminBtn(uid) {
    const b = $("pub-admin-btn");
    if (!b) return;
    const show = isSuper && currentUser && uid !== currentUser.uid;
    b.hidden = !show;
    if (!show) return;
    const has = MA.admins.has(uid);
    b.dataset.uid = uid; b.dataset.name = pubName;
    b.textContent = has ? "Retirer le grade admin" : "Nommer admin";
    b.classList.toggle("on", has);
  }

  async function deleteUserProfile(uid) {
    if (!isAdmin || !confirm("Supprimer ce profil pilote de la communauté pour tout le monde ?\n(Le compte de connexion reste actif : suppression complète depuis la console Firebase > Authentication.)")) return;
    try {
      await db.collection("users").doc(uid).collection("garage").doc("data").delete().catch(() => {});
      const gone = pilotsCache.find((p) => p.id === uid);
      await db.collection("users").doc(uid).delete();
      logAdmin("user-delete", { target: uid, targetName: gone ? gone.username : "", detail: "profil supprimé" });
      loadPilotsRegistry();
    } catch (err) {
      MA.toast("Erreur lors de la suppression : " + err.message, "err");
    }
  }

  function renderCarShowcase(data) {
    const box = $("pub-profile-carcard");
    const photo = safeUrl(data.carPhoto);
    const mods = String(data.mods || "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 12);
    const name = data.currentCar && data.currentCar !== "Projet Principal" && data.currentCar !== "Non renseignée" ? data.currentCar : "";
    if (!photo && !mods.length && !name) { box.hidden = true; return; }
    box.innerHTML = `
      ${photo ? `<img src="${esc(photo)}" alt="${esc(name || "Voiture du pilote")}" data-fallback="car" loading="lazy">` : ""}
      <div class="car-showcase-body">
        <span class="car-showcase-kicker">Sa voiture</span>
        <h3>${esc(name || "Projet en cours")}</h3>
        ${mods.length ? `<ul class="mods-list">${mods.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : `<p class="lap-meta">Aucune modification renseignée.</p>`}
      </div>`;
    box.hidden = false;
  }


  // ------------------------------------------------- voitures de la communauté
  // community_cars/{id} : une voiture = un document (uid du propriétaire, photos[], motorisation, description…).
  // Un pilote peut en publier autant qu'il veut ; la page « Voitures de la communauté » les rassemble toutes.
  let myCars = [];
  let mcEditing = null, mcImages = [];
  const communityCache = { list: [], at: 0 };

  const adminCars = new Map();
  function commCarHtml(c, opts) {
    opts = opts || {};
    const adminEdit = isAdmin && currentUser && c.uid !== currentUser.uid && !opts.manage; if (adminEdit) adminCars.set(c.id, c);
    const photos = (c.photos || []).filter((u) => safeUrl(u));
    const fake = { images: photos, image: photos[0] || "", model: c.name || "Voiture" };
    const meta = [c.year, c.engine, c.power ? c.power + " ch" : "", c.zero ? "0-100 : " + c.zero + " s" : ""].filter(Boolean).map(esc).join(" · ");
    const mods = String(c.mods || "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 8);
    return `
      <article class="comm-car">
        <div class="car-thumb-wrap comm-thumb">${slidesHtml(fake, true)}</div>
        <div class="comm-body">
          <h3><a class="comm-title-link" href="#/voiture-pilote/${encodeURIComponent(c.id)}">${esc(c.name || "Voiture")}</a></h3>
          ${meta ? `<div class="comm-meta">${meta}</div>` : ""}
          ${c.description ? `<p class="comm-desc">${esc(c.description)}</p>` : ""}${adminEdit ? `<div class="comm-actions"><button type="button" class="cta-btn btn-ghost compact-btn" data-action="mycar-edit" data-id="${esc(c.id)}">🛠 Modifier (admin)</button></div>` : ""}
          ${mods.length ? `<ul class="mods-list">${mods.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
          ${window.MASocial && c.id ? window.MASocial.badge("com", c.id) : ""}
          ${opts.owner ? `<button type="button" class="comm-owner" data-action="open-profile" data-uid="${esc(c.uid)}">${avatarImg(c.avatar, "pilot-row-avatar")}<span>${esc(c.pilot || "Pilote")}${MA.admins.tag(c.uid)}</span></button>` : ""}
          ${opts.manage ? `<div class="comm-actions"><button type="button" class="cta-btn btn-ghost compact-btn" data-action="mycar-edit" data-id="${esc(c.id)}">Modifier</button><button type="button" class="secondary-destructive-btn" data-action="mycar-delete" data-id="${esc(c.id)}">Supprimer</button></div>` : ""}
        </div>
      </article>`;
  }

  async function loadMyCars() {
    if (!currentUser) { myCars = []; return; }
    try {
      const s = await db.collection("community_cars").where("uid", "==", currentUser.uid).get();
      myCars = s.docs.map((d) => Object.assign({ id: d.id }, d.data()))
        .sort((x, y) => (x.createdAt && y.createdAt ? x.createdAt.toMillis() - y.createdAt.toMillis() : 0));
    } catch (e) { console.warn("Mes voitures :", e.message); myCars = []; }
    renderMyCars();
  }
  function renderMyCars() {
    const box = $("my-cars-list");
    if (!box) return;
    box.innerHTML = myCars.length
      ? myCars.map((c) => commCarHtml(c, { manage: true })).join("")
      : `<p class="lap-meta">Aucune voiture pour l'instant. Ajoute-en autant que tu en as : elles apparaîtront sur ton profil et dans « Voitures de la communauté ».</p>`;
  }

  async function renderUserCars(uid) {
    const box = $("pub-profile-cars");
    try {
      await MA.admins.load(db);
      const s = await db.collection("community_cars").where("uid", "==", uid).get();
      if (pubUid !== uid) return;
      const list = s.docs.map((d) => Object.assign({ id: d.id }, d.data()))
        .sort((x, y) => (x.createdAt && y.createdAt ? x.createdAt.toMillis() - y.createdAt.toMillis() : 0));
      if (!list.length) { box.hidden = true; return; }
      box.innerHTML = `<div class="settings-sep">Ses voitures (${list.length})</div><div class="comm-grid">${list.map((c) => commCarHtml(c)).join("")}</div>`;
      box.hidden = false;
      document.dispatchEvent(new CustomEvent("ma:profile-cars", { detail: { uid, list } }));
    } catch (_) { box.hidden = true; }
  }

  function renderMcImages() {
    const box = $("mc-gallery");
    box.innerHTML = mcImages.length ? mcImages.map((u, i) => `
      <div class="adm-thumb ${i === 0 ? "main" : ""}" data-url="${esc(u)}">
        <img src="${esc(safeUrl(u) || FALLBACK_CAR)}" alt="" data-fallback="car">
        ${i === 0 ? '<span class="adm-thumb-tag">Principale</span>' : `<button type="button" class="adm-thumb-first" data-action="mycar-img-first" data-i="${i}">Principale</button>`}
        <button type="button" class="adm-thumb-del" data-action="mycar-img-remove" data-i="${i}" aria-label="Retirer cette photo">&times;</button>
      </div>`).join("") : '<p class="adm-gallery-empty">Aucune photo pour l\'instant.</p>';
  }
  function mycarAddUrl() {
    const inp = $("mc-url"), v = inp.value.trim();
    if (!v) return;
    if (!safeUrl(v)) { $("mc-error").textContent = "L'URL de l'image doit commencer par https://"; return; }
    $("mc-error").textContent = "";
    if (mcImages.length >= 8) { $("mc-error").textContent = "8 photos maximum par voiture."; return; }
    if (!mcImages.includes(v)) mcImages.push(v);
    inp.value = ""; renderMcImages();
  }
  async function mcUploadFiles(files) {
    const st = $("mc-upload-status");
    const list = Array.from(files || []).filter((f) => /^image\//.test(f.type));
    if (!list.length || !currentUser) return;
    let done = 0;
    for (const f of list) {
      if (mcImages.length >= 8) { st.textContent = "8 photos maximum par voiture."; return; }
      st.textContent = `Envoi ${done + 1}/${list.length}…`;
      try {
        const blob = await MA.resizeImage(f, 1800, 0.88);
        const ref = storage.ref(`car_photos/${currentUser.uid}/${Date.now()}-${done}.jpg`);
        await ref.put(blob, { contentType: "image/jpeg" });
        mcImages.push(await ref.getDownloadURL());
        done++; renderMcImages();
      } catch (err) { st.textContent = "Échec : " + (err.code === "storage/unauthorized" ? "règles Storage à republier." : err.message); return; }
    }
    st.textContent = `${done} photo(s) ajoutée(s).`;
  }

  function openMyCarEditor(id) {
    if (!requireLogin()) return;
    mcEditing = id ? myCars.find((c) => c.id === id) || (isAdmin ? adminCars.get(id) : null) || null : null;
    const c = mcEditing || {};
    $("mc-title").textContent = mcEditing ? (mcEditing.uid !== currentUser.uid ? "Modifier la voiture de " + (mcEditing.pilot || "ce pilote") + " (admin)" : "Modifier ma voiture") : "Ajouter une voiture";
    $("mc-name").value = c.name || ""; $("mc-year").value = c.year || ""; $("mc-engine").value = c.engine || "";
    $("mc-power").value = c.power || ""; $("mc-zero").value = c.zero || ""; $("mc-desc").value = c.description || ""; $("mc-mods").value = c.mods || "";
    $("mc-url").value = ""; $("mc-error").textContent = ""; $("mc-upload-status").textContent = "";
    mcImages = (c.photos || []).slice();
    renderMcImages();
    openModal($("mycar-modal"));
  }

  async function saveMyCar() {
    if (!currentUser) return;
    const err = $("mc-error"); err.textContent = "";
    const pending = $("mc-url").value.trim();
    if (pending) { if (!safeUrl(pending)) { err.textContent = "L'URL de l'image doit commencer par https://"; return; } if (!mcImages.includes(pending)) mcImages.push(pending); $("mc-url").value = ""; }
    const name = $("mc-name").value.trim();
    if (name.length < 2) { err.textContent = "Donne un nom à ta voiture (ex. Peugeot 106 S16)."; return; }
    const power = Number($("mc-power").value);
    const data = {
      uid: mcEditing ? mcEditing.uid : currentUser.uid, pilot: mcEditing ? mcEditing.pilot : profile.username, avatar: mcEditing ? (mcEditing.avatar || "") : (profile.avatar || ""),
      name: name.slice(0, 80), year: $("mc-year").value.trim().slice(0, 20), engine: $("mc-engine").value.trim().slice(0, 100),
      power: power > 0 && power < 5000 ? Math.round(power) : 0,
      zero: (() => { const z = Number($("mc-zero").value.replace(",", ".")); return z > 0 && z < 60 ? Math.round(z * 10) / 10 : 0; })(),
      description: $("mc-desc").value.trim().slice(0, 600), mods: $("mc-mods").value.trim().slice(0, 500),
      photos: mcImages.filter((u) => safeUrl(u)).slice(0, 8)
    };
    const btn = $("mc-save"); btn.disabled = true;
    try {
      if (mcEditing) {
        data.createdAt = mcEditing.createdAt;
        data.updatedAt = FieldValue.serverTimestamp();
        await db.collection("community_cars").doc(mcEditing.id).set(data);
      } else {
        data.createdAt = FieldValue.serverTimestamp();
        data.updatedAt = FieldValue.serverTimestamp();
        const ref = await db.collection("community_cars").add(data);
        document.dispatchEvent(new CustomEvent("ma:feed", { detail: { type: "car", text: `a ajouté sa ${String(data.name || "voiture").slice(0, 60)}`, link: "#/voiture-pilote/" + ref.id } }));
      }
      closeModal($("mycar-modal"));
      MA.toast("Voiture enregistrée.", "ok");
      communityCache.at = 0;
      await loadMyCars();
      if (pubUid) renderUserCars(pubUid);
    } catch (e) {
      err.textContent = "Enregistrement impossible : " + e.message;
    } finally { btn.disabled = false; }
  }

  async function deleteMyCar(id) {
    if (!confirm("Supprimer cette voiture de ton profil ?")) return;
    try { await db.collection("community_cars").doc(id).delete(); communityCache.at = 0; await loadMyCars(); }
    catch (e) { MA.toast("Suppression impossible : " + e.message, "err"); }
  }

  function openCommunity() { Router.go("/communaute/voitures"); }
  async function loadCommunityOnce() {
    await MA.admins.load(db);
    if (Date.now() - communityCache.at > 30000) {
      const s = await db.collection("community_cars").orderBy("createdAt", "desc").limit(120).get();
      communityCache.list = s.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      communityCache.at = Date.now();
    }
    return communityCache.list;
  }
  async function loadCommunity() {
    const grid = $("community-grid");
    grid.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try {
      await loadCommunityOnce();
      renderCommunity();
    } catch (e) {
      console.error(e);
      grid.innerHTML = `<div class="empty-note error">Impossible de charger les voitures de la communauté.</div>`;
    }
  }
  function renderHomeCommunity() {
    const box = $("home-community");
    if (!box) return;
    const list = communityCache.list.slice(0, 4);
    box.innerHTML = list.length ? list.map((c) => commCarHtml(c, { owner: true })).join("") : `<div class="empty-note">Aucune voiture publiée pour l'instant. <a href="#/garage/voitures">Ajoute la tienne !</a></div>`;
  }
  function renderCommunity() {
    const q = normalize($("community-search").value || "");
    const list = communityCache.list.filter((c) => !q || normalize([c.name, c.engine, c.year, c.pilot, c.description, c.mods].join(" ")).includes(q));
    $("community-count").textContent = `${list.length} voiture${list.length > 1 ? "s" : ""}`;
    $("community-grid").innerHTML = list.length
      ? list.map((c) => commCarHtml(c, { owner: true })).join("")
      : `<div class="empty-note">Aucune voiture${q ? " pour cette recherche" : " pour l'instant. Ajoute la tienne depuis « Mon garage »"}.</div>`;
  }

  // -------------------------------------------------------------- abonnements
  // users/{uid}/following/{cible} (écrit par uid) + users/{cible}/followers/{uid} (écrit par uid) : posés ensemble en lot.
  let pubUid = null, pubName = "", pubAvatar = "";
  const socialCache = {};
  async function renderSocial(scope, uid) {
    const root = $(scope + "-social");
    if (!root) return;
    root.querySelectorAll("[data-sc]").forEach((b) => { b.textContent = "–"; });
    root.querySelectorAll(".social-count").forEach((b) => { b.dataset.uid = uid; });
    const btn = root.querySelector(".follow-btn") || (root.parentElement && root.parentElement.querySelector(".follow-btn"));
    if (btn) { btn.dataset.uid = uid; btn.hidden = !!(currentUser && currentUser.uid === uid); btn.disabled = false; btn.classList.remove("on"); btn.textContent = "Suivre"; }
    try {
      const col = (k) => db.collection("users").doc(uid).collection(k).limit(500).get();
      const [fr, fg] = await Promise.all([col("followers"), col("following")]);
      if (root.querySelector(".social-count").dataset.uid !== uid) return;
      const fmt = (s) => (s.size >= 500 ? "500+" : String(s.size));
      root.querySelector('[data-sc="followers"]').textContent = fmt(fr);
      root.querySelector('[data-sc="following"]').textContent = fmt(fg);
      socialCache[uid] = { followers: fr, following: fg };
      if (btn && currentUser && currentUser.uid !== uid) {
        const on = fr.docs.some((d) => d.id === currentUser.uid);
        btn.classList.toggle("on", on); btn.textContent = on ? "✓ Abonné" : "Suivre";
      }
    } catch (e) { console.warn("Abonnements :", e.code || e.message); }
  }

  async function toggleFollow(uid, btn) {
    if (!requireLogin()) return;
    if (!uid || uid === currentUser.uid) return;
    const me = currentUser.uid;
    const on = btn.classList.contains("on");
    btn.disabled = true;
    try {
      const mine = db.collection("users").doc(me).collection("following").doc(uid);
      const theirs = db.collection("users").doc(uid).collection("followers").doc(me);
      const batch = db.batch();
      if (on) { batch.delete(mine); batch.delete(theirs); }
      else {
        batch.set(mine, { username: (pubName || "Pilote").slice(0, 24), avatar: (pubAvatar || "").slice(0, 500), createdAt: FieldValue.serverTimestamp() });
        batch.set(theirs, { username: (profile.username || "Pilote").slice(0, 24), avatar: (profile.avatar || "").slice(0, 500), createdAt: FieldValue.serverTimestamp() });
      }
      await batch.commit();
      if (!on) MA.notif.send(uid, { type: "follow", from: profile.username || "Pilote", text: "s'est abonné à ton profil", link: "index.html?pilot=" + encodeURIComponent(me) }, "follow_" + me);
      await renderSocial("pub", uid);
    } catch (e) {
      MA.toast(e.code === "permission-denied" ? "Action refusée : règles Firestore à republier." : "Abonnement impossible.", "err");
      btn.disabled = false;
    }
  }

  async function showFollowList(uid, kind) {
    $("follow-title").textContent = kind === "followers" ? "Abonnés" : "Abonnements";
    $("follow-sub").textContent = kind === "followers" ? "Les pilotes qui suivent ce profil" : "Les pilotes que ce profil suit";
    const list = $("follow-list");
    list.innerHTML = `<div class="empty-note">Chargement…</div>`;
    openModal($("follow-modal"));
    try {
      const snap = await db.collection("users").doc(uid).collection(kind).limit(200).get();
      const rows = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => String(a.username).localeCompare(String(b.username), "fr"));
      list.innerHTML = rows.length ? rows.map((p) => `
        <div class="telemetry-row clickable" data-action="open-profile-from-list" data-uid="${esc(p.id)}" role="button" tabindex="0">
          <div class="pilot-row-left">${avatarImg(p.avatar, "pilot-row-avatar")}<div class="pilot-row-text"><div class="pilot-row-name">${esc(p.username || "Pilote")}</div></div></div>
          <div class="pilot-row-right"><span class="see-profile">Voir profil ➔</span></div>
        </div>`).join("") : `<div class="empty-note">${kind === "followers" ? "Personne ne suit ce profil pour l'instant." : "Ce profil ne suit encore personne."}</div>`;
    } catch (e) { list.innerHTML = `<div class="empty-note error">Liste indisponible.</div>`; }
  }

  function openPublicProfile(userId) { Router.go("/pilote/" + encodeURIComponent(userId)); }
  async function renderPublicProfile(userId) {
    $("pub-profile-name").textContent = "Chargement...";
    $("pub-profile-bio").textContent = "";
    $("pub-profile-telemetry").innerHTML = "";
    $("pub-profile-favorites").innerHTML = "";
    $("pub-profile-private-warning").style.display = "none";
    $("pub-profile-public-content").style.display = "block";
    $("pub-profile-badges").innerHTML = "";
    $("pub-profile-carcard").hidden = true;
    $("pub-profile-cars").hidden = true;
    $("pub-admin-btn").hidden = true;

    try {
      const doc = await db.collection("users").doc(userId).get();
      if (!doc.exists) { $("pub-profile-name").textContent = "Pilote introuvable"; $("pub-profile-public-content").style.display = "none"; return; }
      if (Router.current() && Router.current().params.uid !== userId) return;
      const data = doc.data();
      pubUid = userId; pubName = data.username || "Pilote"; pubAvatar = data.avatar || "";
      await MA.admins.load(db);
      $("pub-profile-name").innerHTML = esc(pubName) + MA.admins.tag(userId);
      refreshPubAdminBtn(userId);
      renderUserCars(userId);
      renderSocial("pub", userId);
      $("pub-profile-car").textContent = `Projet actuel : ${data.currentCar || "Non renseigné"}`;
      $("pub-profile-avatar").dataset.fallback = "avatar";
      $("pub-profile-avatar").src = safeUrl(data.avatar) || FALLBACK_AVATAR;
      $("pub-profile-bio").textContent = data.bio || "Ce pilote n'a pas rédigé de biographie.";
      renderCarShowcase(data);
      if (window.MAPilot) window.MAPilot.render(userId, data);
      $("pub-profile-badges").innerHTML = "";
      fetchAllLaps().then(() => {
        if (pubUid === userId) {
          $("pub-profile-badges").innerHTML = badgesHtml(computeBadges(userId, data, 0));
        }
      }).catch(() => {});

      const isMine = currentUser && currentUser.uid === userId;
      if (data.isPublicGarage === false && !isMine && !isAdmin) {
        $("pub-profile-private-warning").style.display = "block";
        $("pub-profile-public-content").style.display = "none";
        return;
      }

      let g;
      try {
        const gSnap = await db.collection("users").doc(userId).collection("garage").doc("data").get();
        g = gSnap.exists ? gSnap.data() : { favorites: data.favorites || [], telemetry: data.telemetry || [] };
      } catch (_) {
        g = { favorites: [], telemetry: [] };
      }
      const laps = (g.telemetry || []).filter((t) => t && t.chrono);
      $("pub-profile-telemetry").innerHTML = laps.length === 0
        ? `<div class="empty-note">Aucun chrono enregistré.</div>`
        : laps.map((t) => lapRow(t)).join("");

      const favCars = (g.favorites || []).map((id) => carsById.get(id)).filter(Boolean);
      $("pub-profile-favorites").innerHTML = favCars.length === 0
        ? `<div class="empty-note" style="grid-column: 1/-1;">Aucun favori dans l'écurie.</div>`
        : favCars.map(carCard).join("");
      document.dispatchEvent(new CustomEvent("ma:profile-garage", { detail: { uid: userId, favorites: g.favorites || [] } }));
    } catch (err) {
      console.error("Erreur profil public :", err);
      $("pub-profile-name").textContent = "Erreur de chargement";
    }
  }

  async function openPublicProfileByName(username) {
    if (!username) return;
    try {
      const q = await db.collection("users").where("username", "==", username).limit(1).get();
      if (q.empty) { MA.toast("Profil introuvable pour ce pilote.", "err"); return; }
      openPublicProfile(q.docs[0].id);
    } catch (err) {
      console.error(err);
    }
  }

  // ------------------------------------------------------------------- admin
  function addEngineBlock(v = {}) {
    const container = $("admin-engines-container");
    const val = (x) => esc(x == null ? "" : x);
    container.insertAdjacentHTML("beforeend", `
      <div class="admin-engine-block">
        <button type="button" class="admin-engine-remove" data-action="remove-engine" aria-label="Retirer ce moteur">&times;</button>
        <button type="button" class="admin-engine-dup" data-action="dup-engine" aria-label="Dupliquer ce moteur" title="Dupliquer ce moteur">Dupliquer</button>
        <div class="admin-engine-grid">
          <div class="input-stack"><label>Nom de la Phase</label><input type="text" class="adm-phase-name" list="adm-phase-list" value="${val(v.phaseName)}" placeholder="Ex: Phase 1"></div>
          <div class="input-stack"><label>Moteur</label><input type="text" class="adm-eng-name" value="${val(v.name)}" placeholder="Ex: 2.0L 16V"></div>
          <div class="input-stack"><label>Puissance (Ch)</label><input type="number" min="1" class="adm-eng-power" value="${val(v.power)}" placeholder="138"></div>
          <div class="input-stack"><label>Couple (Nm)</label><input type="number" min="0" class="adm-eng-torque" value="${val(v.torque)}" placeholder="190"></div>
          <div class="input-stack"><label>V-Max (km/h)</label><input type="number" min="1" class="adm-eng-speed" value="${val(v.speed)}" placeholder="210"></div>
          <div class="input-stack"><label>0-100 (s)</label><input type="text" inputmode="decimal" class="adm-eng-zero" value="${val(v.zeroToHundred)}" placeholder="8.2"></div>
        </div>
        <div class="admin-engine-grid">
          <div class="input-stack"><label>Transmission</label><input type="text" class="adm-eng-trans" value="${val(v.transmission)}" placeholder="Manuelle 5"></div>
          <div class="input-stack"><label>Code moteur <small>(partagé entre voitures)</small></label><input type="text" class="adm-eng-code" value="${val(v.code)}" maxlength="40" placeholder="Ex : TU5JP4"></div>
        </div>
        <div class="input-stack"><label>Note sur le moteur <small>(facultatif)</small></label><input type="text" class="adm-eng-info" value="${val(v.info)}" maxlength="300" placeholder="Architecture, particularités, fiabilité…"></div>
      </div>`);
  }

  // aide à la saisie : marques et phases déjà connues, identifiant automatique, doublons de moteurs
  function refreshAdminLists() {
    const uniq = (a) => Array.from(new Set(a.filter(Boolean))).sort((x, y) => x.localeCompare(y, "fr"));
    $("adm-brand-list").innerHTML = uniq(CATALOGUE.map((c) => c.brand)).map((b) => `<option value="${esc(b)}">`).join("");
    $("adm-phase-list").innerHTML = uniq(CATALOGUE.flatMap((c) => c.phases.map((p) => p.phaseName))).slice(0, 80).map((b) => `<option value="${esc(b)}">`).join("");
  }
  const slugId = (t) => MA.normalize(t).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  function autoAdminId() {
    if (editingCar) return;
    const idEl = $("adm-id"); if (idEl.dataset.touched === "1") return;
    idEl.value = slugId($("adm-brand").value + " " + $("adm-model").value);
  }
  function engineBlockValues(block) {
    const q = (c) => (block.querySelector(c) ? block.querySelector(c).value : "");
    return { phaseName: q(".adm-phase-name"), name: q(".adm-eng-name"), power: q(".adm-eng-power"), torque: q(".adm-eng-torque"), speed: q(".adm-eng-speed"), zeroToHundred: q(".adm-eng-zero"), transmission: q(".adm-eng-trans"), code: q(".adm-eng-code"), info: q(".adm-eng-info") };
  }
  async function admUploadArchives(files) {
    const st = $("adm-archive-status"), list = Array.from(files || []).filter((f) => /^image\//.test(f.type));
    let done = 0;
    for (const f of list) {
      st.textContent = `Envoi ${done + 1}/${list.length}…`;
      try {
        const blob = await MA.resizeImage(f, 2600, 0.9);
        const ref = storage.ref(`catalog_images/${auth.currentUser.uid}/arch-${Date.now()}-${done}.jpg`);
        await ref.put(blob, { contentType: "image/jpeg" });
        const url = await ref.getDownloadURL(), ta = $("adm-archives");
        ta.value = (ta.value.trim() ? ta.value.trim() + "\n" : "") + [f.name.replace(/\.[^.]+$/, "").slice(0, 60), url, "catalogue", ""].join(" | ");
        done++;
      } catch (err) { st.textContent = "Échec : " + err.message; return; }
    }
    st.textContent = done ? `${done} image(s) ajoutée(s) : renseigne le type et l'année si tu veux.` : "";
  }

  // Galerie d'images du formulaire véhicule (URL ou fichiers de la galerie, sans limite de poids)
  let admImages = [];
  function renderAdmImages() {
    const box = $("adm-gallery");
    if (!box) return;
    box.innerHTML = admImages.length ? admImages.map((u, i) => `
      <div class="adm-thumb ${i === 0 ? "main" : ""}" data-url="${esc(u)}">
        <img src="${esc(safeUrl(u) || FALLBACK_CAR)}" alt="" data-fallback="car">
        ${i === 0 ? '<span class="adm-thumb-tag">Principale</span>' : `<button type="button" class="adm-thumb-first" data-action="adm-img-first" data-i="${i}">Principale</button>`}
        <button type="button" class="adm-thumb-del" data-action="adm-img-remove" data-i="${i}" aria-label="Retirer cette photo">&times;</button>
      </div>`).join("") : '<p class="adm-gallery-empty">Aucune photo pour l\'instant.</p>';
  }
  function admAddImageUrl() {
    const inp = $("adm-image");
    const v = inp.value.trim();
    if (!v) return;
    if (!safeUrl(v)) { $("admin-form-error").textContent = "L'URL de l'image doit commencer par https://"; return; }
    $("admin-form-error").textContent = "";
    if (!admImages.includes(v)) admImages.push(v);
    inp.value = "";
    renderAdmImages();
  }
  async function admUploadFiles(files) {
    const st = $("adm-upload-status");
    const list = Array.from(files || []).filter((f) => /^image\//.test(f.type));
    if (!list.length) return;
    let done = 0;
    for (const f of list) {
      st.textContent = `Envoi ${done + 1}/${list.length}…`;
      try {
        const blob = await MA.resizeImage(f, 2600, 0.9); // aucune limite de poids : l'image est réduite côté navigateur
        const ref = storage.ref(`catalog_images/${auth.currentUser.uid}/${Date.now()}-${done}.jpg`);
        await ref.put(blob, { contentType: "image/jpeg" });
        admImages.push(await ref.getDownloadURL());
        done++;
        renderAdmImages();
      } catch (err) {
        st.textContent = "Échec : " + err.message;
        return;
      }
    }
    st.textContent = `${done} photo(s) ajoutée(s).`;
  }

  const CATEGORIES_OK = ["Berline", "Coupé", "Break", "Supercar", "Le Mans"];
  let editorSeed = null; // brouillon (import Wikipédia) : conserve détails de phases et éditions
  function openAdminEditor(car, draft) {
    if (!isAdmin) return;
    editingCar = car || null;
    editorSeed = draft || null;
    if (draft && !car) car = draft;
    $("admin-car-form").reset();
    $("admin-engines-container").innerHTML = "";
    $("adm-id").readOnly = !!editingCar; $("adm-id").dataset.touched = editingCar ? "1" : "";
    $("admin-form-error").textContent = ""; $("admin-form-error").style.color = "";
    if (car) {
      $("adm-id").value = car.id;
      $("adm-brand").value = car.brand;
      $("adm-model").value = car.model;
      $("adm-years").value = car.years;
      $("adm-category").value = CATEGORIES_OK.includes(car.category) ? car.category : "Berline";
      admImages = (car.images && car.images.length ? car.images : [car.image]).filter(Boolean).slice();
      $("adm-desc").value = car.description || "";
      $("adm-related").value = (car.related || []).join(", ");
      $("adm-records").value = car.records.map((r) => `${r.type} | ${r.description}`).join("\n");
      $("adm-history").value = car.history || "";
      $("adm-anecdotes").value = (car.anecdotes || []).map((a) => `${a.title} | ${a.text}`).join("\n");
      $("adm-archives").value = (car.archives || []).map((a) => [a.title, a.url, a.kind, a.year].join(" | ")).join("\n");
      car.phases.forEach((p) => p.engines.forEach((e) => addEngineBlock(Object.assign({ phaseName: p.phaseName }, e))));
    }
    if (!car) admImages = [];
    refreshAdminLists();
    $("adm-image").value = "";
    $("adm-upload-status").textContent = "";
    renderAdmImages();
    if (!$("admin-engines-container").children.length) addEngineBlock();
    openModal($("admin-modal"));
  }

  async function publishCar() {
    if (!isAdmin) { MA.toast("Action interdite.", "err"); return; }
    const errBox = $("admin-form-error");
    errBox.textContent = "";
    const id = $("adm-id").value.trim();
    if (!/^[a-z0-9][a-z0-9-]{2,60}$/.test(id)) { errBox.textContent = "ID invalide : minuscules, chiffres et tirets (3 à 61 caractères)."; return; }
    const pending = $("adm-image").value.trim();
    if (pending) { if (!safeUrl(pending)) { errBox.textContent = "L'URL de l'image doit commencer par https://"; return; } if (!admImages.includes(pending)) admImages.push(pending); }
    if (!admImages.length) { errBox.textContent = "Ajoute au moins une photo (URL ou galerie)."; return; }
    const image = admImages[0];

    const phasesMap = new Map();
    const blocks = document.querySelectorAll(".admin-engine-block");
    for (const [i, block] of Array.from(blocks).entries()) {
      const q = (cls) => block.querySelector(cls).value.trim();
      const phaseName = q(".adm-phase-name") || "Génération unique";
      const engine = {
        name: q(".adm-eng-name"),
        power: Number(q(".adm-eng-power")),
        torque: Number(q(".adm-eng-torque")) || 0,
        speed: Number(q(".adm-eng-speed")),
        zeroToHundred: Number(q(".adm-eng-zero").replace(",", ".")),
        transmission: q(".adm-eng-trans") || "Manuelle",
        code: block.querySelector(".adm-eng-code") ? q(".adm-eng-code") : "",
        info: block.querySelector(".adm-eng-info") ? q(".adm-eng-info") : ""
      };
      if (!engine.name || !(engine.power > 0) || !(engine.speed > 0) || !(engine.zeroToHundred > 0)) {
        errBox.textContent = `Moteur n°${i + 1} : nom, puissance, V-Max et 0-100 sont obligatoires (nombres > 0).`;
        return;
      }
      if (!phasesMap.has(phaseName)) {
        const old = (editingCar || editorSeed) && (editingCar || editorSeed).phases.find((p) => p.phaseName === phaseName);
        phasesMap.set(phaseName, {
          phaseName,
          details: old ? old.details : "",
          notableEditions: old ? old.notableEditions : [],
          engines: []
        });
      }
      phasesMap.get(phaseName).engines.push(engine);
    }
    if (phasesMap.size === 0) { errBox.textContent = "Ajoutez au moins un moteur."; return; }

    const records = $("adm-records").value.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const [type, ...rest] = line.split("|");
      return { type: type.trim(), description: rest.join("|").trim() };
    });

    const carData = {
      id,
      brand: $("adm-brand").value.trim(),
      model: $("adm-model").value.trim(),
      years: $("adm-years").value.trim(),
      category: $("adm-category").value,
      image,
      images: admImages.slice(0, 12),
      description: $("adm-desc").value.trim(),
      history: $("adm-history").value.trim().slice(0, 12000),
      anecdotes: $("adm-anecdotes").value.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => { const i = line.indexOf("|"); return i < 0 ? { title: "", text: line } : { title: line.slice(0, i).trim(), text: line.slice(i + 1).trim() }; }).filter((a) => a.text).slice(0, 40),
      archives: $("adm-archives").value.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => { const [title, url, kind, year] = line.split("|").map((x) => (x || "").trim()); return { title, url, kind: kind || "autre", year: year || "" }; }).filter((a) => a.title && safeUrl(a.url)).slice(0, 60),
      related: $("adm-related").value.split(/[,\n;]/).map((x) => x.trim()).filter((x) => /^[a-z0-9][a-z0-9._-]{1,80}$/i.test(x) && x !== id).slice(0, 12),
      phases: Array.from(phasesMap.values()),
      records: records.length ? records : [{ type: "Homologation", description: "Enregistré par l'administrateur." }],
      userRecords: (editingCar && editingCar.userRecords) || []
    };

    if (!editingCar && carsById.has(id) && !confirm(`Un véhicule « ${id} » existe déjà. Le remplacer ?`)) return;

    try {
      await db.collection("motorauto_catalog").doc(id).set(carData);
      if (!editingCar) document.dispatchEvent(new CustomEvent("ma:feed", { detail: { type: "catalog", text: `a ajouté la fiche ${carData.brand} ${carData.model}`, link: "#/voiture/" + encodeURIComponent(id) } }));
      closeModal($("admin-modal"));
      await loadPublicCatalog();
    } catch (err) {
      errBox.textContent = "Erreur : " + err.message;
    }
  }

  async function deleteCar(carId) {
    if (!isAdmin) return;
    const isLocal = MOTORAUTO_DATABASE.some((c) => c.id === carId);
    if (isLocal && !cloudIds.has(carId)) {
      MA.toast("Ce véhicule est défini dans js/data.js ou js/data2.js : il ne peut être retiré qu'en modifiant ce fichier.", "err");
      return;
    }
    const msg = isLocal
      ? "Supprimer la version modifiée de ce véhicule ? La version d'origine (data.js) sera réaffichée."
      : "Supprimer ce véhicule du catalogue public ?";
    if (!confirm(msg)) return;
    try {
      await db.collection("motorauto_catalog").doc(carId).delete();
      logAdmin("car-delete", { target: carId, detail: "fiche supprimée du catalogue en ligne" });
      await loadPublicCatalog();
    } catch (err) {
      MA.toast("Erreur : " + err.message, "err");
    }
  }

  // ----------------------------------------------------------- comparateur
  const MAX_COMPARE = 3;
  let compareIds = [];
  try { compareIds = JSON.parse(storageGet("motorauto_compare") || "[]").filter((id) => typeof id === "string"); } catch (_) { compareIds = []; }

  function saveCompare() { storageSet("motorauto_compare", JSON.stringify(compareIds)); }

  function toggleCompare(id) {
    if (!carsById.has(id)) return;
    const i = compareIds.indexOf(id);
    if (i >= 0) compareIds.splice(i, 1);
    else if (compareIds.length >= MAX_COMPARE) { MA.toast(`Tu peux comparer ${MAX_COMPARE} véhicules au maximum.`, "err"); return; }
    else compareIds.push(id);
    saveCompare(); renderCompareTray(); syncCompareButtons();
  }

  function syncCompareButtons() {
    document.querySelectorAll('[data-action="toggle-compare"]').forEach((b) => b.classList.toggle("on", compareIds.includes(b.dataset.id)));
    const sb = $("sheet-compare-btn");
    if (sb) sb.textContent = compareIds.includes(sb.dataset.id) ? "✓ Dans le comparateur" : "⇄ Comparer";
  }

  function renderCompareTray() {
    compareIds = compareIds.filter((id) => carsById.has(id));
    const tray = $("compare-tray");
    tray.hidden = compareIds.length === 0;
    $("compare-chips").innerHTML = compareIds.map((id) => {
      const c = carsById.get(id);
      return `<span class="compare-chip">${esc(c.brand)} ${esc(c.model)}<button type="button" data-action="toggle-compare" data-id="${esc(id)}" aria-label="Retirer">&times;</button></span>`;
    }).join("");
    $("compare-go").disabled = compareIds.length < 2;
    $("compare-go").textContent = compareIds.length < 2 ? "Ajoute un 2ᵉ véhicule" : `Comparer (${compareIds.length})`;
  }

  const CMP_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#14b8a6"];

  /** Graphiques du comparateur : radar (profil global) + nuage puissance / V-max par motorisation. */
  function compareCharts(cars) {
    const eng = (c) => c.phases.flatMap((p) => p.engines);
    const torque = (c) => Math.max(0, ...eng(c).map((e) => e.torque));
    const axes = [
      { label: "Puissance", get: (c) => c.stats.power },
      { label: "Couple", get: torque },
      { label: "V-max", get: (c) => c.stats.speed },
      { label: "0-100", get: (c) => (c.stats.zero > 0 ? 1 / c.stats.zero : 0) }
    ];
    const maxes = axes.map((ax) => Math.max(...cars.map(ax.get), 0.0001));
    const R = 92, cx = 180, cy = 150;
    const pt = (i, f) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / axes.length; return [cx + Math.cos(ang) * R * f, cy + Math.sin(ang) * R * f]; };
    const grid = [0.25, 0.5, 0.75, 1].map((f) => `<polygon class="cc-grid" points="${axes.map((_, i) => pt(i, f).join(",")).join(" ")}"/>`).join("");
    const spokes = axes.map((ax, i) => {
      const [x, y] = pt(i, 1), [lx, ly] = pt(i, 1.2);
      return `<line class="cc-grid" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/><text class="cc-label" x="${lx + (i === 1 ? 8 : i === 3 ? -8 : 0)}" y="${ly}" text-anchor="${i === 1 ? "start" : i === 3 ? "end" : "middle"}" dominant-baseline="middle">${ax.label}</text>`;
    }).join("");
    const shapes = cars.map((c, ci) => {
      const col = CMP_COLORS[ci % CMP_COLORS.length];
      const pts = axes.map((ax, i) => pt(i, Math.max(0.03, ax.get(c) / maxes[i])).join(",")).join(" ");
      return `<polygon points="${pts}" fill="${col}" fill-opacity="0.18" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"/>`
        + axes.map((ax, i) => { const [x, y] = pt(i, Math.max(0.03, ax.get(c) / maxes[i])); return `<circle cx="${x}" cy="${y}" r="3.4" fill="${col}"/>`; }).join("");
    }).join("");
    const radar = `<svg class="cc-svg" viewBox="0 0 360 300" role="img" aria-label="Profil comparé : puissance, couple, vitesse de pointe, 0-100 km/h">${grid}${spokes}${shapes}</svg>`;

    // nuage : chaque point = une motorisation (x = puissance, y = V-max)
    const dots = cars.flatMap((c, ci) => eng(c).filter((e) => e.power > 0 && e.speed > 0).map((e) => ({ ci, e, c })));
    let scatter = `<div class="empty-note">Pas assez de données de motorisation.</div>`;
    if (dots.length) {
      const W = 520, H = 300, L = 46, B = 36, T = 14, Rr = 16;
      const xs = dots.map((d) => d.e.power), ys = dots.map((d) => d.e.speed);
      const nice = (lo, hi, n) => {
        const raw = (hi - lo || 1) / n, pow = Math.pow(10, Math.floor(Math.log10(raw)));
        const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) || pow * 10;
        return { min: Math.max(0, Math.floor((lo - step * 0.5) / step) * step), max: Math.ceil((hi + step * 0.5) / step) * step, step };
      };
      const nx = nice(Math.min(...xs), Math.max(...xs), 5), ny = nice(Math.min(...ys), Math.max(...ys), 4);
      const xmin = nx.min, xmax = nx.max, ymin = ny.min, ymax = ny.max;
      const X = (v) => L + (v - xmin) / (xmax - xmin || 1) * (W - L - Rr), Y = (v) => H - B - (v - ymin) / (ymax - ymin || 1) * (H - B - T);
      const ticks = (a, b, step) => { const t = []; for (let v = a; v <= b + 1e-9; v += step) t.push(Math.round(v * 10) / 10); return t; };
      const gx = ticks(xmin, xmax, nx.step).map((v) => `<line class="cc-grid" x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${H - B}"/><text class="cc-tick" x="${X(v)}" y="${H - B + 16}" text-anchor="middle">${v}</text>`).join("");
      const gy = ticks(ymin, ymax, ny.step).map((v) => `<line class="cc-grid" x1="${L}" y1="${Y(v)}" x2="${W - Rr}" y2="${Y(v)}"/><text class="cc-tick" x="${L - 8}" y="${Y(v)}" text-anchor="end" dominant-baseline="middle">${v}</text>`).join("");
      const pts = dots.map((d) => `<circle cx="${X(d.e.power)}" cy="${Y(d.e.speed)}" r="6" fill="${CMP_COLORS[d.ci % CMP_COLORS.length]}" fill-opacity="0.8" stroke="var(--bg-surface)" stroke-width="1.5"><title>${esc(d.c.brand + " " + d.c.model + " — " + d.e.name + " : " + d.e.power + " ch, " + d.e.speed + " km/h")}</title></circle>`).join("");
      scatter = `<svg class="cc-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Chaque motorisation : puissance en abscisse, vitesse de pointe en ordonnée">${gx}${gy}${pts}<text class="cc-axis" x="${(L + W - Rr) / 2}" y="${H - 4}" text-anchor="middle">Puissance (ch)</text><text class="cc-axis" transform="translate(12 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle">V-max (km/h)</text></svg>`;
    }
    const legend = cars.map((c, ci) => `<span class="cc-key"><i style="background:${CMP_COLORS[ci % CMP_COLORS.length]}"></i>${esc(c.brand + " " + c.model)}</span>`).join("");
    return `<section class="cmp-charts" aria-label="Graphiques de comparaison">
      <div class="cc-legend">${legend}</div>
      <div class="cc-row">
        <figure class="cc-card"><figcaption>Profil global <small>(100 % = meilleur du lot)</small></figcaption>${radar}</figure>
        <figure class="cc-card cc-wide"><figcaption>Toutes les motorisations <small>(1 point = 1 moteur)</small></figcaption>${scatter}</figure>
      </div>
    </section>`;
  }

  function openCompare() {
    const cars = compareIds.map((id) => carsById.get(id)).filter(Boolean);
    if (cars.length < 2) { MA.toast("Choisis au moins deux véhicules.", "err"); return; }
    const eng = (c) => c.phases.flatMap((p) => p.engines);
    const rows = [
      { label: "Puissance max", unit: "ch", get: (c) => c.stats.power, better: "high" },
      { label: "Couple max", unit: "Nm", get: (c) => Math.max(0, ...eng(c).map((e) => e.torque)), better: "high" },
      { label: "Vitesse de pointe", unit: "km/h", get: (c) => c.stats.speed, better: "high" },
      { label: "0 → 100 km/h", unit: "s", get: (c) => c.stats.zero || 0, better: "low" },
      { label: "Motorisations", unit: "", get: (c) => eng(c).length, better: null },
      { label: "Générations / phases", unit: "", get: (c) => c.phases.length, better: null }
    ];
    if (window.MAExtra) {
      const X = window.MAExtra;
      rows.splice(4, 0,
        { label: "Poids (indicatif)", unit: "kg", get: (c) => X.carExtra(c).kg, better: "low" },
        { label: "Puissance / tonne", unit: "ch/t", get: (c) => Math.round((X.powerToWeight(c) || {}).hpPerTon || 0), better: "high" },
        { label: "Poids / puissance", unit: "kg/ch", get: (c) => Math.round(((X.powerToWeight(c) || {}).kgPerHp || 0) * 10) / 10, better: "low" });
    }
    const head = cars.map((c) => `
      <div class="cmp-col-head">
        <img src="${esc(safeUrl(c.image) || FALLBACK_CAR)}" alt="" data-fallback="car">
        <div class="cmp-brand">${esc(c.brand)}</div>
        <div class="cmp-name">${esc(c.model)}</div>
        <div class="cmp-years">${esc(c.years)} · ${esc(c.category)}</div>
        <button type="button" class="cta-btn btn-ghost compact-btn" data-action="open-car-from-compare" data-id="${esc(c.id)}">Voir la fiche</button>
      </div>`).join("");
    const body = rows.map((r) => {
      const vals = cars.map(r.get);
      const valid = vals.filter((v) => v > 0);
      const best = r.better && valid.length > 1 ? (r.better === "high" ? Math.max(...valid) : Math.min(...valid)) : null;
      const maxV = Math.max(...vals, 1);
      const cells = vals.map((v) => {
        const win = best !== null && v === best;
        const pct = r.better === "low" ? (v > 0 ? Math.round((best || v) / v * 100) : 0) : Math.round(v / maxV * 100);
        return `<div class="cmp-cell${win ? " win" : ""}"><b>${v > 0 ? v : "—"}${v > 0 && r.unit ? `<small> ${r.unit}</small>` : ""}</b><i style="--w:${pct}%"></i></div>`;
      }).join("");
      return `<div class="cmp-label">${r.label}</div>${cells}`;
    }).join("");
    $("compare-content").innerHTML = `<div class="cmp-grid" style="--cols:${cars.length}"><div></div>${head}${body}</div><div id="cmp-extra"></div>${compareCharts(cars)}`;
    openModal($("compare-modal"));
    document.dispatchEvent(new CustomEvent("ma:compare-opened", { detail: { cars } }));
  }

  // ------------------------------------------- propositions de la communauté
  let sgCarId = "", sgKind = "correction", sgPhotoBlob = null, sgBusy = false;

  async function loadCommunityPhotos(carId) {
    const box = $("community-gallery");
    if (!box) return;
    try {
      const snap = await db.collection("suggestions").where("carId", "==", carId).where("status", "==", "approved").limit(12).get();
      const photos = [];
      snap.forEach((d) => { const x = d.data(); if (x.kind === "photo" && safeUrl(x.photoUrl)) photos.push(x); });
      if (!$("community-gallery") || $("community-gallery") !== box) return;
      box.innerHTML = photos.length
        ? photos.map((p) => `<figure class="cg-item"><img src="${esc(safeUrl(p.photoUrl))}" alt="${esc(p.text || p.carName)}" loading="lazy" data-fallback="car"><figcaption>${p.text ? esc(p.text) + " · " : ""}<span>par ${esc(p.pilot || "un pilote")}</span></figcaption></figure>`).join("")
        : `<div class="empty-note">Pas encore de photo de la communauté. Ajoute la tienne avec « Proposer une modification ».</div>`;
    } catch (err) {
      box.innerHTML = `<div class="empty-note">Photos indisponibles pour le moment.</div>`;
    }
  }

  function openSuggest(carId) {
    if (!requireLogin()) return;
    const car = carsById.get(carId);
    if (!car) return;
    sgCarId = carId; sgPhotoBlob = null;
    $("sg-car").textContent = `${car.brand} ${car.model} (${car.years})`;
    ["sg-text", "sg-source", "sg-photo-url", "sg-caption"].forEach((id) => { $(id).value = ""; });
    $("sg-rights").checked = false;
    $("sg-photo-preview").src = FALLBACK_CAR;
    $("sg-photo-status").textContent = "Depuis ta galerie ou tes fichiers (jusqu'à 25 Mo), ou colle une URL ci-dessous.";
    $("sg-error").textContent = "";
    setSuggestKind("correction");
    openModal($("suggest-modal"));
  }
  function setSuggestKind(kind) {
    sgKind = kind;
    document.querySelectorAll("[data-sg-kind]").forEach((b) => { const on = b.dataset.sgKind === kind; b.classList.toggle("active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    $("sg-correction-fields").hidden = kind !== "correction";
    $("sg-photo-fields").hidden = kind !== "photo";
  }

  async function submitSuggestion() {
    if (sgBusy || !currentUser) return;
    const err = $("sg-error");
    err.textContent = "";
    const car = carsById.get(sgCarId);
    if (!car) return;
    const base = {
      carId: sgCarId, carName: `${car.brand} ${car.model}`.slice(0, 120), kind: sgKind,
      uid: currentUser.uid, pilot: pilotName().slice(0, 40), status: "pending", field: "", text: "", source: "", photoUrl: "",
      createdAt: FieldValue.serverTimestamp()
    };
    sgBusy = true; $("sg-submit").disabled = true;
    try {
      if (sgKind === "correction") {
        const text = $("sg-text").value.trim();
        if (text.length < 8) { err.textContent = "Décris ta correction en quelques mots (8 caractères minimum)."; return; }
        const src = $("sg-source").value.trim();
        if (src && !safeUrl(src) && src.length > 300) { err.textContent = "Source trop longue."; return; }
        Object.assign(base, { field: $("sg-field").value, text: text.slice(0, 1000), source: src.slice(0, 300) });
      } else {
        if (!$("sg-rights").checked) { err.textContent = "Confirme que tu as le droit de partager cette photo."; return; }
        let url = $("sg-photo-url").value.trim();
        if (sgPhotoBlob) {
          if (!storage) { err.textContent = "Le stockage de photos n'est pas disponible."; return; }
          $("sg-photo-status").textContent = "Envoi de la photo…";
          const ref = storage.ref(`suggestions/${currentUser.uid}/${Date.now()}.jpg`);
          await ref.put(sgPhotoBlob, { contentType: "image/jpeg" });
          url = await ref.getDownloadURL();
        }
        if (!safeUrl(url)) { err.textContent = "Choisis une photo ou colle une adresse d'image valide (https://…)."; return; }
        Object.assign(base, { photoUrl: url.slice(0, 600), text: $("sg-caption").value.trim().slice(0, 120) });
      }
      await db.collection("suggestions").add(base);
      closeModal($("suggest-modal"));
      MA.toast("Merci ! Ta proposition est envoyée. Tu seras notifié de la décision.", "ok");
    } catch (e) {
      err.textContent = "Envoi impossible : " + (e.code === "permission-denied" ? "règles Firestore/Storage à republier." : e.message);
    } finally {
      sgBusy = false; $("sg-submit").disabled = false;
    }
  }

  async function pickSuggestPhoto(file) {
    const st = $("sg-photo-status");
    if (!/^image\//.test(file.type)) { st.textContent = "Ce fichier n'est pas une image."; return; }
    if (file.size > 25 * 1024 * 1024) { st.textContent = "Image trop volumineuse (25 Mo maximum)."; return; }
    try {
      sgPhotoBlob = await MA.resizeImage(file, 1920, 0.88);
      $("sg-photo-preview").src = URL.createObjectURL(sgPhotoBlob);
      $("sg-photo-url").value = "";
      st.textContent = "Photo prête à l'envoi ✔";
    } catch (e) { st.textContent = "Image illisible."; }
  }

  // -- côté administration
  async function loadAdminSuggestions() {
    const box = $("admin-sg-list");
    box.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try {
      const snap = await db.collection("suggestions").where("status", "==", "pending").limit(60).get();
      const rows = [];
      snap.forEach((d) => rows.push(Object.assign({ id: d.id }, d.data())));
      rows.sort((a, b) => (a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0) - (b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0));
      $("adm-stat-sg").textContent = rows.length;
      if (!rows.length) { box.innerHTML = `<div class="empty-note">Aucune proposition en attente.</div>`; return; }
      box.innerHTML = rows.map((r) => `
        <div class="admin-msg">
          <div class="admin-msg-head"><span class="msg-type">${r.kind === "photo" ? "📷 Photo" : "✎ Correction"}</span><b>${esc(r.carName)}</b><span class="lap-meta">par ${esc(r.pilot)}${r.field ? " · " + esc(r.field) : ""}</span></div>
          ${r.kind === "photo" ? `<img class="sg-thumb" src="${esc(safeUrl(r.photoUrl))}" alt="" loading="lazy" data-fallback="car">` : ""}
          ${r.text ? `<p class="admin-msg-body">${esc(r.text)}</p>` : ""}
          ${safeUrl(r.source) ? `<a class="lap-meta" href="${esc(safeUrl(r.source))}" target="_blank" rel="noopener noreferrer">Source : ${esc(r.source)}</a>` : (r.source ? `<span class="lap-meta">Source : ${esc(r.source)}</span>` : "")}
          <div class="admin-row-actions">
            <button type="button" class="cta-btn fill-btn compact-btn" data-action="sg-approve" data-id="${esc(r.id)}" data-uid="${esc(r.uid)}" data-car="${esc(r.carName)}" data-kind="${esc(r.kind)}">Accepter</button>
            ${r.kind === "correction" ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-action="admin-edit-car" data-id="${esc(r.carId)}">Ouvrir la fiche</button>` : ""}
            <button type="button" class="secondary-destructive-btn" data-action="sg-reject" data-id="${esc(r.id)}" data-uid="${esc(r.uid)}" data-car="${esc(r.carName)}">Refuser</button>
          </div>
        </div>`).join("");
    } catch (err) {
      $("adm-stat-sg").textContent = "—";
      box.innerHTML = `<div class="empty-note">Lecture impossible (règles Firestore à republier ?) : ${esc(err.message)}</div>`;
    }
  }

  async function reviewSuggestion(id, uid, carName, kind, approve) {
    if (!isAdmin) return;
    let note = "";
    if (!approve) { note = (prompt("Motif du refus (optionnel, visible par le pilote) :", "") || "").trim().slice(0, 80); }
    try {
      await db.collection("suggestions").doc(id).update({ status: approve ? "approved" : "rejected" });
      logAdmin(approve ? "suggestion-approve" : "suggestion-reject", { target: id, targetName: carName, detail: (kind === "photo" ? "photo" : "correction") + (note ? " — " + note : "") });
      MA.notif.send(uid, {
        type: "suggestion", from: "MOTORAUTO", link: "index.html",
        text: approve
          ? (kind === "photo" ? `Ta photo pour « ${carName} » est publiée. Merci !` : `Ta correction pour « ${carName} » a été acceptée. Merci !`)
          : `Ta proposition pour « ${carName} » n'a pas été retenue${note ? " : " + note : "."}`
      });
      loadAdminSuggestions();
    } catch (e) { MA.toast("Erreur : " + e.message, "err"); }
  }

  // ------------------------------------------------------ panneau d'administration
  const TYPE_LABEL = { vehicle: "Ajout véhicule", bug: "Bug", data: "Erreur fiche", idea: "Suggestion", other: "Autre" };
  async function loadAdminMessages() {
    const box = $("admin-msg-list");
    box.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try {
      const snap = await db.collection("contact_messages").orderBy("createdAt", "desc").limit(100).get();
      $("adm-stat-msgs").textContent = snap.size;
      if (snap.empty) { box.innerHTML = `<div class="empty-note">Aucun message pour l'instant.</div>`; return; }
      box.innerHTML = snap.docs.map((d) => {
        const m = d.data();
        const when = m.createdAt && m.createdAt.toDate ? m.createdAt.toDate().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "";
        const veh = m.type === "vehicle" ? `<div class="lap-meta">🚗 ${esc([m.brand, m.model, m.years, m.engine].filter(Boolean).join(" · ") || "—")}</div>` : "";
        const reply = `mailto:${encodeURIComponent(m.email || "")}?subject=${encodeURIComponent("Re: [MOTORAUTO] " + (TYPE_LABEL[m.type] || "Demande"))}`;
        return `
          <div class="admin-msg">
            <div class="admin-msg-head"><span class="msg-type">${esc(TYPE_LABEL[m.type] || m.type)}</span><b>${esc(m.pilot)}</b>${m.mailed === true ? `<span class="mail-ok" title="${esc(m.mailInfo || "")}">✉ e-mail parti</span>` : m.mailed === false ? `<span class="mail-ko" title="${esc(m.mailInfo || "")}">⚠ e-mail non parti : ${esc(m.mailInfo || "inconnu")}</span>` : ""}<span class="lap-meta">${esc(m.email)} · ${esc(when)}</span></div>
            ${veh}
            <p class="admin-msg-body">${esc(m.message)}</p>
            <div class="admin-row-actions">
              <a class="cta-btn fill-btn compact-btn" href="${esc(reply)}">Répondre</a>
              <button type="button" class="secondary-destructive-btn" data-action="admin-delete-msg" data-id="${esc(d.id)}">Supprimer</button>
            </div>
          </div>`;
      }).join("");
    } catch (err) {
      $("adm-stat-msgs").textContent = "—";
      box.innerHTML = `<div class="empty-note">Lecture impossible (règles Firestore à republier ?) : ${esc(err.message)}</div>`;
    }
  }

  const REPORT_REASONS = { insulte: "Insultes / harcèlement", spam: "Spam / publicité", illegal: "Contenu choquant ou illégal", perso: "Informations personnelles", autre: "Autre" };
  async function loadAdminReports() {
    const box = $("admin-rp-list");
    box.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try {
      const snap = await db.collection("reports").where("status", "==", "open").limit(100).get();
      $("adm-stat-rp").textContent = snap.size;
      if (snap.empty) { box.innerHTML = `<div class="empty-note">Aucun message signalé. 👌</div>`; return; }
      const rows = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => ((a.createdAt && a.createdAt.seconds) || 0) - ((b.createdAt && b.createdAt.seconds) || 0));
      box.innerHTML = rows.map((r) => {
        const where = r.msgPath.startsWith("global_chat") ? "Salon général" : r.msgPath.startsWith("custom_channels") ? "Canal #" + (r.msgPath.split("/")[1] || "") : "Message privé";
        return `
          <div class="admin-msg">
            <div class="admin-msg-head"><span class="msg-type">${esc(REPORT_REASONS[r.reason] || r.reason)}</span><b>${esc(r.msgPilot)}</b><span class="lap-meta">${esc(where)} · signalé par ${esc(r.reporter)}</span></div>
            <p class="admin-msg-body">${esc(r.msgText)}</p>
            ${r.details ? `<p class="lap-meta">« ${esc(r.details)} »</p>` : ""}
            <div class="admin-row-actions">
              <button type="button" class="secondary-destructive-btn" data-action="rp-delete" data-id="${esc(r.id)}" data-path="${esc(r.msgPath)}">Supprimer le message</button>
              <button type="button" class="cta-btn btn-ghost compact-btn" data-action="rp-dismiss" data-id="${esc(r.id)}">Ignorer</button>
              ${r.msgUid ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-action="open-profile" data-uid="${esc(r.msgUid)}">Voir le pilote</button>` : ""}
            </div>
          </div>`;
      }).join("");
    } catch (err) {
      $("adm-stat-rp").textContent = "—";
      box.innerHTML = `<div class="empty-note">Lecture impossible (règles Firestore à republier ?) : ${esc(err.message)}</div>`;
    }
  }
  async function resolveReport(id, path) {
    try {
      if (path) { try { await db.doc(path).delete(); } catch (e) { if (e.code === "permission-denied") throw e; } }
      await db.collection("reports").doc(id).update({ status: path ? "deleted" : "dismissed" });
      logAdmin(path ? "report-delete" : "report-dismiss", { target: id, detail: path ? "message du salon supprimé" : "signalement ignoré" });
      MA.toast(path ? "Message supprimé." : "Signalement ignoré.", "ok");
    } catch (e) { MA.toast("Action impossible : " + e.message, "err"); }
    loadAdminReports();
  }

  function openAdminPanel(tab) { Router.go("/admin" + (typeof tab === "string" ? "/" + tab : "")); }
  async function loadAdminPage() {
    if (!isAdmin) return;
    const list = $("admin-car-list");
    list.innerHTML = `<div class="empty-note">Chargement…</div>`;
    ["adm-stat-cars", "adm-stat-users", "adm-stat-laps", "adm-stat-msgs", "adm-stat-sg", "adm-stat-rp"].forEach((id) => { $(id).textContent = "…"; });
    $("adm-stat-cars").textContent = carsById.size;
    try {
      const [users, laps, cat] = await Promise.all([
        db.collection("users").limit(500).get(),
        db.collection("global_laps").limit(500).get(),
        db.collection("motorauto_catalog").limit(500).get()
      ]);
      $("adm-stat-users").textContent = users.size;
      $("adm-stat-laps").textContent = laps.size;
      document.dispatchEvent(new CustomEvent("ma:admin-loaded", { detail: { users: users.size, laps: laps.size, cars: carsById.size } }));
      loadAdminMessages();
      loadAdminSuggestions();
      loadAdminReports();
      if (cat.empty) { list.innerHTML = `<div class="empty-note">Aucun véhicule en ligne pour l'instant. Utilise « Ajouter un véhicule ».</div>`; return; }
      const rows = [];
      cat.forEach((d) => rows.push(Object.assign({ id: d.id }, d.data())));
      rows.sort((a, b) => String(a.brand || "").localeCompare(String(b.brand || ""), "fr"));
      list.innerHTML = rows.map((c) => `
        <div class="telemetry-row">
          <div class="pilot-row-left">
            <img src="${esc(safeUrl(c.image) || FALLBACK_CAR)}" alt="" class="pilot-row-avatar" data-fallback="car">
            <div><div class="lap-title">${esc(c.brand || "")} ${esc(c.model || c.id)}</div><div class="lap-meta">${esc(c.years || "")}</div></div>
          </div>
          <div class="admin-row-actions">
            <button type="button" class="cta-btn fill-btn compact-btn" data-action="admin-edit-car" data-id="${esc(c.id)}">Modifier</button>
            <button type="button" class="secondary-destructive-btn" data-action="admin-delete-car" data-id="${esc(c.id)}">Supprimer</button>
          </div>
        </div>`).join("");
    } catch (err) {
      list.innerHTML = `<div class="empty-note">Lecture impossible : ${esc(err.message)}</div>`;
    }
  }

  // ------------------------------------------------------------- contact
  const CONTACT_TO = "motorautofr@gmail.com";
  const CONTACT_TYPES = { vehicle: "Ajout d'un véhicule", bug: "Bug", data: "Erreur dans une fiche", idea: "Suggestion", other: "Autre demande" };
  let contactLastSent = 0;

  function prefillContact(opts) {
    const o = opts || {};
    if (currentUser) {
      if (!$("ct-pilot").value) $("ct-pilot").value = pilotName();
      if (!$("ct-email").value && currentUser.email) $("ct-email").value = currentUser.email;
    }
    if (o.type) $("ct-type").value = o.type;
    if (o.message && !$("ct-message").value) $("ct-message").value = o.message;
    toggleVehicleFields();
    updateContactCount();
  }
  function toggleVehicleFields() { $("ct-vehicle-fields").hidden = $("ct-type").value !== "vehicle"; }
  function updateContactCount() { $("ct-count").textContent = $("ct-message").value.length + " / 2000"; }

  function readContact() {
    const v = (id) => $(id).value.trim();
    return {
      type: $("ct-type").value, pilot: v("ct-pilot"), email: v("ct-email"), message: v("ct-message"),
      brand: v("ct-brand"), model: v("ct-model"), years: v("ct-years"), engine: v("ct-engine")
    };
  }

  // Mail pré-rédigé : même texte pour l'envoi direct et pour la messagerie.
  function buildContactMail(c) {
    const label = CONTACT_TYPES[c.type] || "Demande";
    const subject = `[MOTORAUTO] ${label} — ${c.pilot || "pilote anonyme"}`;
    const L = [];
    L.push("Bonjour l'équipe MOTORAUTO,", "", `Nouvelle demande reçue depuis le site : ${label.toUpperCase()}.`, "");
    L.push("── PILOTE ──────────────────────────");
    L.push(`Pseudo       : ${c.pilot || "(non renseigné)"}`);
    L.push(`E-mail       : ${c.email || "(non renseigné)"}`);
    L.push(`Compte       : ${currentUser ? "connecté (uid " + currentUser.uid + ")" : "visiteur non connecté"}`);
    if (c.type === "vehicle") {
      L.push("", "── VÉHICULE À AJOUTER ──────────────");
      L.push(`Marque       : ${c.brand || "—"}`, `Modèle       : ${c.model || "—"}`, `Années       : ${c.years || "—"}`, `Moteur       : ${c.engine || "—"}`);
    }
    L.push("", "── MESSAGE ─────────────────────────", c.message, "");
    L.push("── CONTEXTE TECHNIQUE ──────────────");
    L.push(`Page         : ${location.href.split("#")[0]}`);
    L.push(`Écran        : ${screen.width}×${screen.height} (fenêtre ${innerWidth}×${innerHeight})`);
    L.push(`Navigateur   : ${navigator.userAgent}`);
    L.push(`Envoyé le    : ${new Date().toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}`);
    return { subject, body: L.join("\n") };
  }

  function validateContact(c, needEmail) {
    if (!c.pilot) return "Indique ton pseudo.";
    if (needEmail && !/^[^\s@]+@[^\s@]{2,}\.[^\s@]{2,}$/.test(c.email)) return "Pour l'envoi par e-mail, indique une adresse valide.";
    if (c.type === "vehicle" && !c.brand && !c.model) return "Indique au moins la marque ou le modèle du véhicule.";
    if (c.message.length < 10) return "Ton message est trop court (10 caractères minimum).";
    return "";
  }

  function setContactStatus(text, kind) {
    const el = $("ct-status");
    el.textContent = text;
    el.className = "contact-status" + (kind ? " " + kind : "");
  }

  function openContactMailto() {
    const c = readContact();
    const err = validateContact(c, true);
    if (err) { setContactStatus(err, "err"); return; }
    const m = buildContactMail(c);
    const body = m.body.length > 1700 ? m.body.slice(0, 1700) + "\n[…]" : m.body; // limite des liens mailto
    location.href = `mailto:${CONTACT_TO}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(body)}`;
    setContactStatus("Ta messagerie s'ouvre avec le mail déjà rédigé : il ne reste qu'à l'envoyer.", "ok");
  }

  // Envoi = message privé à l'administrateur, dans le salon (chat.html#dm/<uid admin>)
  let adminUidCache = null;
  async function getAdminUid() {
    if (adminUidCache) return adminUidCache;
    const snap = await db.collection("config").doc("admin").get();
    adminUidCache = snap.exists ? snap.data().uid : null;
    return adminUidCache;
  }
  function buildContactChat(c) {
    const label = CONTACT_TYPES[c.type] || "Demande";
    const L = [`📩 ${label.toUpperCase()}`];
    if (c.type === "vehicle") {
      const v = [c.brand, c.model].filter(Boolean).join(" ");
      L.push(`🚗 ${v || "véhicule ?"}${c.years ? " (" + c.years + ")" : ""}${c.engine ? " — " + c.engine : ""}`);
    }
    if (c.email) L.push(`✉ ${c.email}`);
    L.push("", c.message);
    const text = L.join("\n");
    const parts = [];
    for (let i = 0; i < text.length; i += 950) parts.push(text.slice(i, i + 950));
    return parts;
  }

  async function submitContact() {
    if ($("ct-honey").value) return; // robot
    const c = readContact();
    const err = validateContact(c, false);
    if (err) { setContactStatus(err, "err"); return; }
    if (!currentUser) {
      setContactStatus("Connecte-toi pour envoyer ta demande : elle arrive dans la messagerie de l'administrateur. (Sans compte : « Ouvrir dans ma messagerie ».)", "err");
      openModal($("auth-modal"));
      return;
    }
    if (Date.now() - contactLastSent < 30000) { setContactStatus("Patiente quelques secondes avant d'envoyer une nouvelle demande.", "err"); return; }
    const btn = $("ct-submit");
    btn.disabled = true; setContactStatus("Envoi en cours…", "");
    try {
      const adminUid = await getAdminUid();
      if (!adminUid) throw new Error("no-admin");
      if (adminUid === currentUser.uid) throw new Error("self");
      const conv = [currentUser.uid, adminUid].sort().join("_");
      const col = db.collection("private_chats").doc(conv).collection("messages");
      const parts = buildContactChat(c);
      for (const text of parts) {
        await col.add({
          uid: currentUser.uid, pilot: (profile.username || c.pilot).slice(0, 40), avatar: profile.avatar || "",
          text, mediaUrl: "", replyTo: null, reactions: {}, timestamp: FieldValue.serverTimestamp()
        });
      }
      MA.notif.send(adminUid, { type: "dm", from: profile.username || c.pilot, text: "📩 " + (CONTACT_TYPES[c.type] || "Demande"), link: "chat.html#dm/" + encodeURIComponent(currentUser.uid) }, "dm_" + currentUser.uid);
      contactLastSent = Date.now();
      ["ct-message", "ct-brand", "ct-model", "ct-years", "ct-engine"].forEach((id) => { $(id).value = ""; });
      updateContactCount();
      setContactStatus("Merci ! Ta demande est dans la messagerie de l'administrateur. Il te répondra dans le salon (messages privés).", "ok");
      MA.toast("Demande envoyée à l'administrateur.", "ok");
    } catch (e) {
      console.warn("Contact :", e);
      const msg = e.message === "no-admin" ? "L'administrateur ne s'est pas encore connecté sur le site : réessaie plus tard ou utilise « Ouvrir dans ma messagerie »."
        : e.message === "self" ? "Tu es l'administrateur : écris-toi plutôt une note 😉."
        : e.code === "permission-denied" ? "Envoi refusé : les règles Firestore sont à republier."
        : "L'envoi a échoué. Utilise « Ouvrir dans ma messagerie » : le mail est déjà rédigé.";
      setContactStatus(msg, "err");
    } finally { btn.disabled = false; }
  }


  // ----------------------------------------------------------- import CSV / Wikipédia
  let importPending = [], importRes = { cars: [], errors: [], warnings: [] };
  function downloadFile(name, content, type) {
    const blob = new Blob(["\uFEFF" + content], { type: type || "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importTemplate() {
    const ex = [{
      id: "peugeot-106-s16", brand: "Peugeot", model: "106 S16", years: "1997 - 2003", category: "Coupé", image: "https://exemple.fr/photo.jpg",
      description: "Petite sportive à moteur 16 soupapes.", records: [{ type: "Anecdote", description: "Très prisée en rallye amateur." }],
      phases: [{ phaseName: "Phase 1", details: "", notableEditions: ["Rallye"], engines: [{ name: "1.6 16V TU5J4", power: 120, torque: 147, speed: 202, zeroToHundred: 8.3, transmission: "Manuelle 5" }] },
        { phaseName: "Phase 2", details: "", notableEditions: [], engines: [{ name: "1.6 16V TU5J4", power: 118, torque: 145, speed: 200, zeroToHundred: 8.6, transmission: "Manuelle 5" }] }]
    }];
    downloadFile("motorauto-modele-import.csv", MA.carsToCsv(ex));
  }
  function importExport() { downloadFile("motorauto-catalogue.csv", MA.carsToCsv(CATALOGUE)); }

  function renderImportPreview(res) {
    const box = $("import-preview");
    importPending = res.cars; importRes = res;
    const overwrite = $("import-overwrite") ? $("import-overwrite").checked : false;
    const rows = res.cars.map((c) => {
      const exists = carsById.has(c.id);
      const n = c.phases.reduce((t, p) => t + p.engines.length, 0);
      return `<tr class="${exists && !overwrite ? "skip" : ""}"><td><code>${esc(c.id)}</code></td><td>${esc(c.brand)} ${esc(c.model)}</td><td>${c.phases.length} / ${n}</td><td>${exists ? (overwrite ? "remplace" : "ignoré (existe)") : "nouveau"}</td></tr>`;
    }).join("");
    const todo = res.cars.filter((c) => overwrite || !carsById.has(c.id)).length;
    box.innerHTML = `
      ${res.errors.length ? `<div class="import-box err"><b>${res.errors.length} problème(s) bloquant(s) — ces lignes sont ignorées :</b><ul>${res.errors.slice(0, 25).map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>` : ""}
      ${res.warnings.length ? `<div class="import-box warn"><b>À vérifier :</b><ul>${res.warnings.slice(0, 15).map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>` : ""}
      ${res.cars.length ? `
        <label class="check-row"><input type="checkbox" id="import-overwrite" ${overwrite ? "checked" : ""}> Remplacer les véhicules qui existent déjà</label>
        <div class="import-table-wrap"><table class="import-table"><thead><tr><th>id</th><th>Véhicule</th><th>Phases / moteurs</th><th>État</th></tr></thead><tbody>${rows}</tbody></table></div>
        <button type="button" class="cta-btn fill-btn w-100" data-action="import-run" ${todo ? "" : "disabled"}>Importer ${todo} véhicule(s)</button>` : ""}`;
  }

  async function onImportFile(file) {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { MA.toast("Fichier trop gros (3 Mo max).", "err"); return; }
    const txt = await file.text();
    renderImportPreview(MA.csvToCars(txt));
  }

  async function runImport() {
    if (!isAdmin) return;
    const overwrite = $("import-overwrite") && $("import-overwrite").checked;
    const list = importPending.filter((c) => overwrite || !carsById.has(c.id));
    if (!list.length) return;
    const btn = document.querySelector('[data-action="import-run"]');
    btn.disabled = true; btn.textContent = "Import en cours…";
    try {
      for (let i = 0; i < list.length; i += 200) {
        const batch = db.batch();
        list.slice(i, i + 200).forEach((c) => batch.set(db.collection("motorauto_catalog").doc(c.id), {
          id: c.id, brand: c.brand, model: c.model, years: c.years, category: c.category, image: c.image,
          description: c.description, phases: c.phases, records: c.records, userRecords: []
        }));
        await batch.commit();
      }
      MA.toast(`${list.length} véhicule(s) importé(s).`, "ok");
      importPending = []; $("import-preview").innerHTML = `<div class="import-box ok">${list.length} véhicule(s) importé(s) dans le catalogue en ligne.</div>`;
      $("import-file").value = "";
      await loadPublicCatalog();
    } catch (err) {
      MA.toast("Import impossible : " + (err.code === "permission-denied" ? "action refusée par les règles." : err.message), "err");
      btn.disabled = false; btn.textContent = "Réessayer";
    }
  }

  async function runWikiImport(pasted) {
    const st = $("wiki-status"), btn = $("wiki-go");
    st.className = "contact-status"; st.textContent = "Démarrage…"; btn.disabled = true; $("wiki-paste-go").disabled = true;
    try {
      const known = Array.from(new Set(CATALOGUE.map((c) => c.brand))).filter(Boolean);
      const { car, notes } = await MAImport.importAny(pasted ? $("wiki-paste").value : $("wiki-url").value, {
        pasted: !!pasted, url: $("wiki-url").value.trim(), knownBrands: known, onStep: (t) => { st.textContent = t; }
      });
      closeModal($("import-modal"));
      openAdminEditor(null, car);
      const err = $("admin-form-error");
      err.style.color = "var(--accent)";
      err.innerHTML = "Brouillon importé — à relire :<br>• " + notes.concat(["Vérifie l'identifiant, la catégorie et les chiffres avant de publier."]).map(esc).join("<br>• ");
      st.textContent = ""; $("wiki-paste-wrap").hidden = true;
    } catch (e) {
      st.className = "contact-status err";
      st.textContent = /Failed to fetch|NetworkError/i.test(e.message) ? "Réseau injoignable depuis ce navigateur (connexion ou bloqueur de contenu)." : e.message;
      if (e.code === "unreachable") { $("wiki-paste-wrap").hidden = false; $("wiki-paste").focus(); }
    } finally { btn.disabled = false; $("wiki-paste-go").disabled = false; }
  }

  // ----------------------------------------------------- actions (délégation)
  function scrollToCatalog() {
    const t = $("catalog-results-top") || $("main-catalog-view");
    if (!t) return;
    const y = t.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  const actions = {
    "open-car": (d) => openVehicleSheet(d.id),
    "open-suggestion": (d) => { hideSuggestions(); openVehicleSheet(d.id); },
    "toggle-fav": (d) => toggleFavorite(d.id),
    "sheet-fav": (d) => toggleFavorite(d.id),
    "share-car": async (d) => {
      const car = carsById.get(d.id);
      const url = shareUrlFor(d.id);
      const title = car ? `${car.brand} ${car.model} — MOTORAUTO` : "MOTORAUTO";
      try {
        if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) { await navigator.share({ title, text: car ? `${car.brand} ${car.model} (${car.years}) sur MOTORAUTO` : "", url }); return; }
      } catch (e) { if (e && e.name === "AbortError") return; }
      try { await navigator.clipboard.writeText(url); MA.toast("Lien copié dans le presse-papiers.", "ok"); }
      catch (_) { MA.toast(url); }
    },
    "suggest-car": (d) => openSuggest(d.id),
    "open-archives": (d) => openArchives(d.id),
    "admin-edit-archives": (d) => { closeModal($("archives-modal")); const c = carsById.get(d.id); if (c) openAdminEditor(c); },
    "sg-approve": (d) => reviewSuggestion(d.id, d.uid, d.car, d.kind, true),
    "sg-reject": (d) => reviewSuggestion(d.id, d.uid, d.car, "", false),
    "edit-car": (d) => openAdminEditor(carsById.get(d.id)),
    "toggle-compare": (d) => toggleCompare(d.id),
    "toggle-admin": (d) => toggleAdminGrade(d.uid, d.name),
    "mycar-new": () => openMyCarEditor(null),
    "mycar-edit": (d) => openMyCarEditor(d.id),
    "mycar-delete": (d) => deleteMyCar(d.id),
    "mycar-save": () => saveMyCar(),
    "mycar-add-url": () => mycarAddUrl(),
    "mycar-img-remove": (d) => { mcImages.splice(Number(d.i), 1); renderMcImages(); },
    "mycar-img-first": (d) => { const [u] = mcImages.splice(Number(d.i), 1); mcImages.unshift(u); renderMcImages(); },
    "open-community": () => openCommunity(),
    "slide": (d, n) => slideBy(n, Number(d.dir)),
    "adm-img-add-url": () => admAddImageUrl(),
    "adm-img-remove": (d) => { admImages.splice(Number(d.i), 1); renderAdmImages(); },
    "adm-img-first": (d) => { const [u] = admImages.splice(Number(d.i), 1); admImages.unshift(u); renderAdmImages(); },
    "open-compare": () => openCompare(),
    "clear-compare": () => { compareIds = []; saveCompare(); renderCompareTray(); syncCompareButtons(); },
    "open-car-from-compare": (d) => { closeModal($("compare-modal")); openVehicleSheet(d.id); },
    "admin-new-car": () => openAdminEditor(null),
    "admin-open-import": () => { if (isAdmin) { $("import-preview").innerHTML = ""; openModal($("import-modal")); } },
    "import-template": () => importTemplate(),
    "import-export": () => importExport(),
    "import-run": () => runImport(),
    "rp-delete": (d) => { if (confirm("Supprimer définitivement ce message ?")) resolveReport(d.id, d.path); },
    "rp-dismiss": (d) => resolveReport(d.id, ""),
    "admin-delete-msg": async (d) => {
      if (!isAdmin || !confirm("Supprimer ce message ?")) return;
      try { await db.collection("contact_messages").doc(d.id).delete(); logAdmin("contact-delete", { target: d.id, detail: "message de contact supprimé" }); loadAdminMessages(); }
      catch (e) { MA.toast("Erreur : " + e.message, "err"); }
    },
    "admin-edit-car": (d) => { const c = carsById.get(d.id); if (c) openAdminEditor(c); },
    "admin-delete-car": async (d) => { await deleteCar(d.id); if (isAdmin) openAdminPanel(); },
    "admin-open-pilots": () => openPilotsRegistry(),
    "admin-open-leaderboard": () => openLeaderboard(),
    "delete-car": (d) => deleteCar(d.id),
    "change-page": (d) => { filters.page = Number(d.page); renderCatalog(); scrollToCatalog(); },
    "switch-phase": (d, node) => {
      const car = carsById.get(d.car);
      if (!car) return;
      node.parentElement.querySelectorAll(".phase-pill-btn").forEach((b) => b.classList.toggle("active", b === node));
      $("active-phase-container").innerHTML = renderPhaseDetails(car.phases[Number(d.idx)]);
    },
    "submit-telemetry": (d) => submitTelemetry(d.id),
    "remove-telemetry": (d) => removeTelemetry(Number(d.idx)),
    "open-profile": (d) => openPublicProfile(d.uid),
    "open-profile-from-list": (d) => { closeModal($("follow-modal")); openPublicProfile(d.uid); },
    "show-follow-list": (d) => showFollowList(d.uid, d.kind),
    "toggle-follow": (d, node) => toggleFollow(d.uid, node),
    "open-profile-by-name": (d) => openPublicProfileByName(d.name),
    "delete-user": (d) => deleteUserProfile(d.uid),
    "delete-lap": (d) => deleteGlobalLap(d.id),
    "remove-engine": (d, node) => node.closest(".admin-engine-block").remove(),
    "dup-engine": (d, node) => { const b = node.closest(".admin-engine-block"); if (b) addEngineBlock(engineBlockValues(b)); },
    "open-auth": () => { $("tab-register-btn").click(); openModal($("auth-modal")); },
    "quick-search": (d) => {
      filters.query = d.q; filters.page = 1;
      const hs = $("global-search-input"); if (hs) hs.value = d.q;
      const cs = $("catalog-search-input"); if (cs) cs.value = d.q;
      hideSuggestions(); renderCatalog();
      Router.go("/catalogue");
    },
    "filter-brand": (d) => {
      filters.brand = d.brand; filters.page = 1;
      $("brand-select").value = d.brand;
      renderCatalog();
      Router.go("/catalogue");
    }
  };

  function handleActionClick(e) {
    const target = e.target.closest("[data-action]");
    if (!e.target.closest("#search-container")) hideSuggestions();
    if (!target) return;
    const fn = actions[target.dataset.action];
    if (!fn) return;
    e.preventDefault();
    fn(target.dataset, target);
  }

  // ----------------------------------------------------------- effets visuels
  function initEffects() {
    initGauge();
    const fine = window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // en-tête + barre de progression au défilement
    const header = $("app-header"), bar = $("scroll-progress");
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.setProperty("--p", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
        header.classList.toggle("scrolled", window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!fine) return;
    // halo + inclinaison 3D des cartes
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest && e.target.closest(".car-box");
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      card.style.setProperty("--ry", ((x / r.width - 0.5) * 7).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-(y / r.height - 0.5) * 7).toFixed(2) + "deg");
    }, { passive: true });
    document.addEventListener("pointerout", (e) => {
      const card = e.target.closest && e.target.closest(".car-box");
      if (card && !card.contains(e.relatedTarget)) { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); }
    }, { passive: true });
    // inclinaison du compte-tours selon le pointeur
    const hero = document.querySelector(".hero-stage"), gauge = $("hero-gauge");
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      gauge.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 16).toFixed(2) + "deg");
      gauge.style.setProperty("--rx", (-((e.clientY - r.top) / r.height - 0.5) * 12).toFixed(2) + "deg");
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { gauge.style.setProperty("--rx", "0deg"); gauge.style.setProperty("--ry", "0deg"); });
  }

  // -------------------------------------------------------------------- init
  function updateChatBadges() {
    const on = MA.unread.count() > 0;
    const hb = $("header-chat-badge"); if (hb) hb.style.display = on ? "block" : "none";
    const td = $("touch-chat-dot"); if (td) td.hidden = !on;
  }

  function handleDeepLinks() {
    const q = new URLSearchParams(location.search);
    const car = q.get("car"), pilot = q.get("pilot"), login = q.get("login"), search = q.get("q");
    if (!car && !pilot && !login && !search) return;
    history.replaceState(null, "", location.pathname + location.hash);
    if (search) { filters.query = search.slice(0, 80); const ci = $("catalog-search-input"); if (ci) ci.value = filters.query; renderCatalog(); Router.go("/catalogue"); }
    if (car && carsById.has(car)) openVehicleSheet(car);
    else if (pilot) openPublicProfile(pilot);
    else if (login) setTimeout(() => { if (!currentUser) openModal($("auth-modal")); }, 600);
  }

  let catReadyResolve = () => {};
  const catReady = Promise.race([new Promise((r) => { catReadyResolve = r; }), new Promise((r) => setTimeout(r, 4000))]);
  let authResolve = () => {};
  const authReady = new Promise((r) => { authResolve = r; });
  const needLogin = async () => { await authReady; return currentUser ? undefined : "/"; };
  const needAdmin = async () => { await authReady; return isAdmin ? undefined : "/"; };

  function registerRoutes() {
    Router.register("car", { enter: async (p) => { if (!carsById.has(p.id)) await catReady; renderVehicle(p.id); } });
    Router.register("home", { enter: () => { loadCommunityOnce().then(renderHomeCommunity).catch(() => {}); } });
    Router.register("catalog", { enter: () => { const c = $("catalog-search-input"); if (c && c.value !== filters.query) c.value = filters.query; renderCatalog({ animate: false }); } });
    Router.register("garage", {
      guard: async () => { if (!(await authReady, currentUser)) { openModal($("auth-modal")); return "/"; } },
      enter: () => renderGarage()
    });
    Router.register("leaderboard", { enter: (p) => { if (p.tab === "chronos") loadLeaderboardPage(); } });
    Router.register("community", { enter: (p) => { if (p.tab === "voitures") loadCommunity(); else if (p.tab === "pilotes") loadPilotsRegistry(); } });
    Router.register("pilot", { enter: (p) => renderPublicProfile(p.uid) });
    Router.register("admin", { guard: needAdmin, enter: (p) => { loadAdminPage(p.tab); } });
    Router.register("contact", { enter: () => prefillContact() });
  }

  function init() {
    MA.applyTheme(storageGet("motorauto_theme") || "onyx-carbon");
    initEffects();

    // catalogue local d'abord (affichage immédiat), puis fusion avec le cloud
    rebuildCatalogue();
    renderCatalog();
    loadPublicCatalog().catch(() => {}).then(() => { catReadyResolve(); handleDeepLinks(); });

    registerRoutes();
    document.addEventListener("ma:social", () => {
      renderCatalog({ animate: false });
      if (Router.is("community", { tab: "voitures" })) renderCommunity();
      if (Router.is("home")) renderHomeCommunity();
    });
    document.addEventListener("click", handleActionClick);
    document.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches('[role="button"][data-action]')) {
        e.preventDefault();
        e.target.click();
      }
      if (e.key === "Escape") {
        if (modalStack.length) closeModal(modalStack[modalStack.length - 1]);
        else if ($("search-suggestions").classList.contains("open")) hideSuggestions();
        else if (["car", "pilot", "commcar", "circuit"].includes((Router.current() || {}).name) && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
          const c = Router.current();
          Router.back(c.name === "car" ? "/catalogue" : c.name === "circuit" ? "/classement/circuits" : c.name === "commcar" ? "/communaute/voitures" : "/communaute/pilotes");
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = Router.is("catalog") ? $("catalog-search-input") : $("global-search-input");
        if (!Router.is("catalog") && !Router.is("home")) { Router.go("/catalogue"); setTimeout(() => { const i = $("catalog-search-input"); i.focus(); i.select(); }, 60); return; }
        input.scrollIntoView({ block: "center", behavior: "smooth" });
        input.focus();
        input.select();
      }
      // « / » ouvre aussi la recherche quand on n'écrit pas ailleurs
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        if (Router.is("home")) $("global-search-input").focus();
        else { Router.go("/catalogue"); setTimeout(() => $("catalog-search-input").focus(), 60); }
      }
    });

    // fermeture des modales : bouton ✕ et clic sur le fond
    const closers = {
      "close-auth-modal": "auth-modal", "close-admin-modal": "admin-modal", "close-suggest-modal": "suggest-modal", "close-compare-modal": "compare-modal",
      "close-import-modal": "import-modal", "close-follow-modal": "follow-modal", "close-theme-modal": "theme-modal", "close-mycar-modal": "mycar-modal", "close-event-modal": "event-modal", "close-mute-modal": "mute-modal", "close-archives-modal": "archives-modal"
    };
    Object.entries(closers).forEach(([btn, modal]) => { const b = $(btn); if (b) b.addEventListener("click", () => closeModal($(modal))); });
    document.querySelectorAll(".modal-layer").forEach((layer) => {
      layer.addEventListener("mousedown", (e) => { layer._downOnBackdrop = e.target === layer; });
      layer.addEventListener("click", (e) => { if (e.target === layer && layer._downOnBackdrop) closeModal(layer); });
    });

    // recherche : le champ de l'accueil propose des suggestions puis ouvre le catalogue ; celui du catalogue filtre en direct
    let searchTimer = null;
    const searchInput = $("global-search-input"), catInput = $("catalog-search-input");
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { renderSuggestions(e.target.value); updateGauge(heroMatches()); }, 150);
    });
    searchInput.addEventListener("focus", () => { if (searchInput.value.trim().length >= 2) renderSuggestions(searchInput.value); });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); hideSuggestions();
        filters.query = searchInput.value; filters.page = 1; catInput.value = filters.query;
        renderCatalog(); Router.go("/catalogue"); searchInput.blur();
      }
      if (e.key === "ArrowDown") { const f = $("search-suggestions").querySelector(".suggestion-item"); if (f) { e.preventDefault(); f.focus(); } }
    });
    catInput.addEventListener("input", (e) => {
      filters.query = e.target.value; filters.page = 1;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { renderCatalog(); renderCatalogSuggestions(); }, 150);
    });
    catInput.addEventListener("focus", renderCatalogSuggestions);
    catInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideSuggestions();
      if (e.key === "Enter") hideSuggestions();
      if (e.key === "ArrowDown") { const f = $("catalog-suggestions").querySelector(".suggestion-item"); if (f) { e.preventDefault(); f.focus(); } }
    });
    $("catalog-suggestions").addEventListener("keydown", (e) => {
      const items = Array.from($("catalog-suggestions").querySelectorAll(".suggestion-item"));
      const i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); (i > 0 ? items[i - 1] : catInput).focus(); }
    });
    document.addEventListener("click", (e) => { if (!e.target.closest("#search-container") && !e.target.closest("#catalog-search-container")) hideSuggestions(); });
    $("search-suggestions").addEventListener("keydown", (e) => {
      const items = Array.from($("search-suggestions").querySelectorAll(".suggestion-item"));
      const i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); (i > 0 ? items[i - 1] : searchInput).focus(); }
    });

    // import
    $("import-file").addEventListener("change", (e) => onImportFile(e.target.files[0]));
    $("mc-files").addEventListener("change", (e) => { mcUploadFiles(e.target.files); e.target.value = ""; });
    $("community-search").addEventListener("input", renderCommunity);
    $("pilots-search").addEventListener("input", renderPilotsList);
    $("adm-files").addEventListener("change", (e) => { admUploadFiles(e.target.files); e.target.value = ""; });
    $("import-preview").addEventListener("change", (e) => { if (e.target.id === "import-overwrite") renderImportPreview(importRes); });
    $("wiki-go").addEventListener("click", () => runWikiImport(false));
    $("wiki-paste-go").addEventListener("click", () => runWikiImport(true));
    $("wiki-url").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); runWikiImport(false); } });
    document.querySelectorAll("[data-import-tab]").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll("[data-import-tab]").forEach((x) => x.classList.toggle("active", x === b));
      $("import-pane-csv").hidden = b.dataset.importTab !== "csv";
      $("import-pane-wiki").hidden = b.dataset.importTab !== "wiki";
    }));

    // filtres avancés
    const numOrNull = (v) => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) ? n : null; };
    const advMap = { "adv-pmin": "pmin", "adv-pmax": "pmax", "adv-zero": "zero", "adv-vmax": "vmax", "adv-yfrom": "yfrom", "adv-yto": "yto" };
    const advActive = () => ["drive", "turbo"].filter((k) => filters[k] !== "all").length + Object.values(advMap).filter((k) => filters[k] != null).length;
    const advRefresh = () => {
      const n = advActive();
      $("adv-count").hidden = !n; $("adv-count").textContent = n;
      $("adv-toggle").classList.toggle("on", n > 0);
      filters.page = 1; renderCatalog();
    };
    $("adv-toggle").addEventListener("click", () => {
      const p = $("adv-panel"); p.hidden = !p.hidden;
      $("adv-toggle").setAttribute("aria-expanded", String(!p.hidden));
    });
    Object.entries(advMap).forEach(([id, key]) => $(id).addEventListener("input", (e) => { filters[key] = numOrNull(e.target.value); advRefresh(); }));
    $("adv-drive").addEventListener("change", (e) => { filters.drive = e.target.value; advRefresh(); });
    $("adv-turbo").addEventListener("change", (e) => { filters.turbo = e.target.value; advRefresh(); });
    $("adv-reset").addEventListener("click", () => {
      Object.entries(advMap).forEach(([id, key]) => { $(id).value = ""; filters[key] = null; });
      $("adv-drive").value = "all"; $("adv-turbo").value = "all"; filters.drive = "all"; filters.turbo = "all";
      advRefresh();
    });

    $("brand-select").addEventListener("change", (e) => { filters.brand = e.target.value; filters.page = 1; renderCatalog(); });
    $("sort-select").addEventListener("change", (e) => { filters.sort = e.target.value; filters.page = 1; renderCatalog(); });
    $("body-filter-chips").querySelectorAll(".filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        $("body-filter-chips").querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        filters.category = btn.dataset.filterType;
        filters.page = 1;
        renderCatalog();
      });
    });

    // navigation : les liens sont de vrais liens (#/…) gérés par le routeur ; seule l'ambiance ouvre une fenêtre
    document.querySelectorAll("[data-nav-foot=theme]").forEach((l) => l.addEventListener("click", () => openModal($("theme-modal"))));
    document.querySelectorAll('a[href="#/contact"]').forEach((l) => l.addEventListener("click", () => prefillContact()));

    // classement
    $("leaderboard-track-select").addEventListener("change", renderLeaderboard);
    $("leaderboard-cat-select").addEventListener("change", refreshLeaderboard);
    $("leaderboard-period-select").addEventListener("change", refreshLeaderboard);

    // thèmes
    $("theme-btn").addEventListener("click", () => openModal($("theme-modal")));
    document.querySelectorAll("[data-set-theme]").forEach((tile) => {
      tile.addEventListener("click", () => {
        MA.applyTheme(tile.dataset.setTheme);
        storageSet("motorauto_theme", tile.dataset.setTheme);
        MA.toast("Ambiance « " + tile.querySelector(".tile-title").textContent + " » appliquée.", "ok");
      });
    });

    // authentification
    const tabLogin = $("tab-login-btn"), tabRegister = $("tab-register-btn");
    tabLogin.addEventListener("click", () => {
      tabLogin.classList.add("active"); tabRegister.classList.remove("active");
      $("login-form").classList.add("active"); $("register-form").classList.remove("active");
    });
    tabRegister.addEventListener("click", () => {
      tabRegister.classList.add("active"); tabLogin.classList.remove("active");
      $("register-form").classList.add("active"); $("login-form").classList.remove("active");
    });

    $("login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errBox = $("login-error"), btn = $("login-submit-btn");
      errBox.textContent = "";
      btn.disabled = true;
      btn.querySelector(".btn-text").textContent = "Connexion…";
      try {
        await auth.signInWithEmailAndPassword($("login-email").value.trim(), $("login-password").value);
        $("login-form").reset();
        closeModal($("auth-modal"));
        MA.toast("Bienvenue au cockpit.", "ok");
      } catch (err) {
        errBox.textContent = authErrorMessage(err);
      } finally {
        btn.disabled = false;
        btn.querySelector(".btn-text").textContent = "Se connecter";
      }
    });

    $("register-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errBox = $("register-error");
      errBox.textContent = "";
      const username = $("register-username").value.trim();
      const car = $("register-car").value.trim().slice(0, 80);
      const nameError = validateUsername(username);
      if (nameError) { errBox.textContent = nameError; return; }
      try {
        if (await isUsernameTaken(username, null)) { errBox.textContent = "Ce pseudo est déjà utilisé par un autre pilote."; return; }
        pendingRegistration = { username, car };
        await auth.createUserWithEmailAndPassword($("register-email").value.trim(), $("register-password").value);
        $("register-form").reset();
        closeModal($("auth-modal"));
        MA.toast("Compte créé. Bienvenue dans l'écurie !", "ok");
      } catch (err) {
        pendingRegistration = null;
        errBox.textContent = authErrorMessage(err);
      }
    });

    $("google-login-btn").addEventListener("click", async () => {
      try {
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        closeModal($("auth-modal"));
      } catch (err) {
        if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") MA.toast(authErrorMessage(err), "err");
      }
    });

    $("user-profile-btn").addEventListener("click", () => { if (requireLogin()) openGarageModal(); });
    $("logout-btn").addEventListener("click", async () => { await auth.signOut(); Router.go("/", { replace: true }); MA.toast("À bientôt sur la piste.", "ok"); });
    $("save-profile-settings-btn").addEventListener("click", saveProfileSettings);

    // onglets du garage
    const tabTele = $("tab-my-telemetry"), tabFavs = $("tab-my-favorites");
    tabTele.addEventListener("click", () => {
      tabTele.classList.add("active"); tabFavs.classList.remove("active");
      $("garage-telemetry-panel").classList.add("active"); $("garage-favorites-panel").classList.remove("active");
    });
    tabFavs.addEventListener("click", () => {
      tabFavs.classList.add("active"); tabTele.classList.remove("active");
      $("garage-favorites-panel").classList.add("active"); $("garage-telemetry-panel").classList.remove("active");
    });

    // admin
    $("add-engine-row-btn").addEventListener("click", () => addEngineBlock());
    $("pick-engine-row-btn").addEventListener("click", () => {
      if (!window.MAEngines) return;
      const phase = (Array.from(document.querySelectorAll(".adm-phase-name")).pop() || {}).value || "";
      window.MAEngines.pick((e) => addEngineBlock(Object.assign({ phaseName: phase }, e)));
    });
    ["adm-brand", "adm-model"].forEach((id) => $(id).addEventListener("input", autoAdminId));
    $("adm-id").addEventListener("input", () => { $("adm-id").dataset.touched = "1"; });
    $("adm-archive-files").addEventListener("change", (e) => { admUploadArchives(e.target.files); e.target.value = ""; });
    $("admin-car-form").addEventListener("submit", (e) => { e.preventDefault(); publishCar(); });

    document.querySelectorAll("[data-sg-kind]").forEach((b) => b.addEventListener("click", () => setSuggestKind(b.dataset.sgKind)));
    $("sg-photo-btn").addEventListener("click", () => $("sg-photo-file").click());
    $("sg-photo-file").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) pickSuggestPhoto(f); e.target.value = ""; });
    $("sg-photo-url").addEventListener("input", (e) => { sgPhotoBlob = null; $("sg-photo-preview").src = safeUrl(e.target.value.trim()) || FALLBACK_CAR; });
    $("suggest-form").addEventListener("submit", (e) => { e.preventDefault(); submitSuggestion(); });
    renderCompareTray();
    MA.notif.mount($("notif-btn"));

    // contact
    $("ct-type").addEventListener("change", toggleVehicleFields);
    $("ct-message").addEventListener("input", updateContactCount);
    $("contact-form").addEventListener("submit", (e) => { e.preventDefault(); submitContact(); });
    $("ct-mailto").addEventListener("click", openContactMailto);
    toggleVehicleFields();

    // navigation : pastille coulissante + retour en haut
    document.querySelectorAll(".desktop-navigation .nav-link").forEach((l) => {
      l.addEventListener("mouseenter", () => moveGlider(l));
      l.addEventListener("focus", () => moveGlider(l));
    });
    $("desktop-nav").addEventListener("mouseleave", () => moveGlider());
    window.addEventListener("resize", () => moveGlider(), { passive: true });
    setTimeout(moveGlider, 60);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveGlider());
    const toTop = $("to-top");
    window.addEventListener("scroll", () => { toTop.hidden = window.scrollY < 900; }, { passive: true });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // avatar : téléversement depuis la galerie / les fichiers
    $("avatar-upload-btn").addEventListener("click", () => $("avatar-file-input").click());
    $("avatar-file-input").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) uploadAvatar(f); });
    $("car-upload-btn").addEventListener("click", () => $("car-file-input").click());
    $("car-file-input").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) uploadCarPhoto(f); });
    $("settings-car-photo").addEventListener("input", (e) => { $("settings-car-preview").src = safeUrl(e.target.value.trim()) || FALLBACK_CAR; });
    $("settings-avatar").addEventListener("input", (e) => { $("settings-avatar-preview").src = AVATAR_SRC(e.target.value.trim()); });

    // messages non lus (pastille du salon)
    MA.unread.onChange(updateChatBadges);

    (window.MAModules || []).forEach((fn) => { try { fn(window.MAApp.ctx()); } catch (e) { console.error("Module :", e); } });
    Router.start();

    // session
    auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      isAdmin = false; isSuper = false;
      const dot = document.querySelector(".live-status-dot");
      const gearBox = $("admin-gear-container");
      gearBox.innerHTML = "";

      if (user) {
        dot.classList.remove("logged-out");
        isSuper = await MA.checkSuper(user);
        isAdmin = isSuper || await MA.checkAdmin(user);
        if (isSuper) MA.registerAdmin(db, user);
        MA.admins.load(db);
        MA.loginPing(db, user);
        await MA.mute.load(db, user);
        await loadUserData();
        loadMyCars();
        $("user-display-name").textContent = profile.username;
        MA.unread.start(user, db);
        MA.notif.start(user, db);
        prefillContact();
        if (isAdmin) {
          const gear = document.createElement("button");
          gear.type = "button";
          gear.className = "icon-btn admin-gear";
          gear.title = "Administration";
          gear.setAttribute("aria-label", "Ouvrir l'administration");
          gear.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.4 20.4 7.2v9.6L12 21.6 3.6 16.8V7.2z"/><path d="M7.9 14.6a4.4 4.4 0 1 1 8.2 0"/><path d="m12 13.2 2.7-3.6"/><circle cx="12" cy="13.4" r="1.1" fill="currentColor" stroke="none"/></svg>`;
          gear.addEventListener("click", () => openAdminPanel());
          gearBox.appendChild(gear);
        }
      } else {
        dot.classList.add("logged-out");
        $("user-display-name").textContent = "Connexion";
        profile = defaultProfile(); myCars = []; renderMyCars();
        garage = { favorites: [], telemetry: [] };
        MA.unread.stop();
        MA.notif.stop();
        MA.mute.clear();
        if (Router.is("garage") || Router.is("admin")) Router.go("/", { replace: true });
      }
      authResolve();
      document.dispatchEvent(new CustomEvent("ma:auth", { detail: { user, isAdmin, isSuper } }));
      renderCatalog({ animate: false });
      if (Router.current()) Router.refresh();
    });
  }

  // pont vers les modules (social, communauté, circuits, admin, garage)
  window.MAApp = {
    moveGlider: () => moveGlider(),
    ctx: () => ({
      db, auth, storage, FieldValue, MA, esc, safeUrl, Router,
      get user() { return currentUser; }, get profile() { return profile; }, get isAdmin() { return isAdmin; }, get isSuper() { return isSuper; },
      get cars() { return CATALOGUE; }, carsById, authReady, catReady,
      toast: (m, k) => MA.toast(m, k), openProfile: openPublicProfile, requireLogin, avatarImg, pilotName,
      openModal, closeModal, carCard, commCarHtml, normalize
    }),
    reloadCommunity: () => { communityCache.at = 0; if (Router.is("community", { tab: "voitures" })) loadCommunity(); },
    getCommunityCars: () => communityCache.list,
    loadCommunityOnce,
    getMyCars: () => myCars,
    getGarage: () => garage,
    getLaps: (force) => fetchAllLaps(force),
    renderCatalogNow: () => renderCatalog({ animate: false }),
    reloadCatalog: () => loadPublicCatalog(),
    openEditor: (car, draft) => openAdminEditor(car, draft),
    previewImport: (txt) => renderImportPreview(MA.csvToCars(txt))
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
