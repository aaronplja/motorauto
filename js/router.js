/**
 * MOTORAUTO — routeur par adresse (#/…).
 * Chaque « page » est un bloc .page ; une seule est visible à la fois. Les onglets d'une page
 * (ex. #/communaute/pilotes) sont des .tab-panel[data-tab]. L'adresse est partageable et le bouton
 * « retour » du navigateur fonctionne.
 */
(function () {
  "use strict";

  const DEFS = [
    { name: "home", re: /^\/?$/, keys: [] },
    { name: "catalog", re: /^\/catalogue\/?$/, keys: [] },
    { name: "car", re: /^\/voiture\/([^/]+)\/?$/, keys: ["id"] },
    { name: "commcar", re: /^\/voiture-pilote\/([^/]+)\/?$/, keys: ["id"] },
    { name: "community", re: /^\/communaute(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["fil", "voitures", "pilotes", "evenements", "carte", "hub-pilotes", "hub-clubs", "hub-classements"] },
    { name: "play", re: /^\/jouer(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["cartes", "collection", "boutique", "echanges", "minijeux", "communaute", "defis", "concours"] },
    { name: "leaderboard", re: /^\/classement(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["chronos", "circuits", "voitures", "pilotes", "collection"] },
    { name: "circuit", re: /^\/circuit\/([^/]+)\/?$/, keys: ["key"] },
    { name: "pilot", re: /^\/pilote\/([^/]+)\/?$/, keys: ["uid"] },
    { name: "garage", re: /^\/garage(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["apercu", "voitures", "suivi"] },
    { name: "settings", re: /^\/reglages(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["profil", "ambiance", "notifications", "carte"] },
    { name: "admin", re: /^\/admin(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["tableau", "moderation", "catalogue", "jeu", "journal", "erreurs"] },
    { name: "compare", re: /^\/comparer\/([^/]+)\/?$/, keys: ["ids"] },
    { name: "duel", re: /^\/duel(?:\/([^/]+)\/([^/]+))?\/?$/, keys: ["a", "b"] },
    { name: "club", re: /^\/club\/([^/]+)\/?$/, keys: ["id"] },
    { name: "clubs", re: /^\/clubs\/?$/, keys: [] },
    { name: "market", re: /^\/annonces\/?$/, keys: [] },
    { name: "fusion", re: /^\/fusion\/?$/, keys: [] },
    { name: "cardmarket", re: /^\/marche\/?$/, keys: [] },
    { name: "wishfeed", re: /^\/souhaits\/?$/, keys: [] },
    { name: "plusmoins", re: /^\/plusmoins\/?$/, keys: [] },
    { name: "quizgame", re: /^\/quiz\/?$/, keys: [] },
    { name: "achievements", re: /^\/succes\/?$/, keys: [] },
    { name: "pass", re: /^\/pass\/?$/, keys: [] },
    { name: "timeline", re: /^\/frise\/?$/, keys: [] },
    { name: "news", re: /^\/nouveautes\/?$/, keys: [] },
    { name: "contact", re: /^\/contact\/?$/, keys: [] },
    { name: "engine", re: /^\/moteur\/([^/]+)\/?$/, keys: ["key"] },
    { name: "legal", re: /^\/legal(?:\/([^/]+))?\/?$/, keys: ["doc"] }
  ];
  const PAGE_ID = {
    home: "page-home", catalog: "page-catalog", car: "vehicle-modal", commcar: "page-commcar", community: "page-community",
    leaderboard: "leaderboard-modal", circuit: "page-circuit", pilot: "public-profile-modal",
    garage: "garage-modal", settings: "page-settings", engine: "page-engine", admin: "admin-panel-modal", contact: "page-contact", legal: "page-legal",
    duel: "page-duel", compare: "page-catalog", club: "page-club", clubs: "page-clubs", market: "page-market", play: "page-play",
    fusion: "page-fusion", cardmarket: "page-cardmarket", wishfeed: "page-wishfeed", plusmoins: "page-plusmoins", quizgame: "page-quizgame", achievements: "page-achievements", pass: "page-pass", timeline: "page-timeline", news: "page-news"
  };
  // entrée de menu mise en avant pour chaque page
  const NAV_OF = { compare: "catalog", home: "home", catalog: "catalog", car: "catalog", engine: "catalog", commcar: "community", community: "community", pilot: "community", leaderboard: "community", circuit: "community", garage: "me", settings: "me", admin: "me", contact: "me", legal: "me", duel: "play", quiz: "play", play: "play", club: "community", clubs: "community", market: "community", fusion: "play", cardmarket: "play", wishfeed: "play", plusmoins: "play", quizgame: "play", achievements: "play", pass: "play", timeline: "catalog", news: "home" };
  const TITLES = {
    home: "MOTORAUTO | Archive automobile & communauté de pilotes", catalog: "Catalogue | MOTORAUTO", community: "Communauté | MOTORAUTO",
    play: "Jouer | MOTORAUTO", leaderboard: "Classements | MOTORAUTO", circuit: "Circuit | MOTORAUTO", pilot: "Pilote | MOTORAUTO", garage: "Mon garage | MOTORAUTO", settings: "Réglages | MOTORAUTO",
    admin: "Administration | MOTORAUTO", legal: "Informations légales | MOTORAUTO", engine: "Moteur | MOTORAUTO", contact: "Contact | MOTORAUTO", commcar: "Voiture de pilote | MOTORAUTO", compare: "Comparateur | MOTORAUTO", duel: "Duel | MOTORAUTO", quiz: "Quiz | MOTORAUTO", club: "Club | MOTORAUTO", clubs: "Clubs | MOTORAUTO", market: "Annonces | MOTORAUTO", car: "Fiche véhicule | MOTORAUTO",
    pass: "Pass de saison | MOTORAUTO", fusion: "Fusion de cartes | MOTORAUTO", cardmarket: "Marché de cartes | MOTORAUTO", wishfeed: "Souhaits et échanges | MOTORAUTO", plusmoins: "Plus ou moins | MOTORAUTO", quizgame: "Quiz | MOTORAUTO", achievements: "Succès | MOTORAUTO", timeline: "Frise chronologique | MOTORAUTO", news: "Nouveautés | MOTORAUTO"
  };
  const DEFAULT_TAB = { settings: "profil", community: "hub-pilotes", leaderboard: "chronos", garage: "apercu", admin: "tableau", play: "cartes" };
  // anciennes adresses (liens partagés, favoris) → adresse actuelle
  const REDIRECTS = { "/annonces": "/communaute", "/jouer/apercu": "/jouer/cartes", "/garage/parametres": "/reglages/profil", "/garage/cartes": "/jouer/collection", "/garage/entretien": "/garage/suivi", "/garage/budget": "/garage/suivi", "/garage/projets": "/garage/suivi", "/admin/traiter": "/admin/tableau" };
  // barres d'onglets : une seule définition, dessinée dans chaque page de la section (nav[data-section])
  const SECTIONS = {
    play: { page: "play", items: [["apercu", "Jouer"], ["cartes", "Cartes"], ["echanges", "Échanges"], ["defis", "Défis"], ["concours", "Concours"]] },
    community: { page: "community", items: [["fil", "Fil"], ["pilotes", "Pilotes"], ["voitures", "Voitures"], ["evenements", "Sorties"], ["clubs", "Clubs", "/clubs", ["clubs", "club"]], ["classement", "Classement", "/classement", ["leaderboard", "circuit"]]] },
    leaderboard: { page: "leaderboard", items: [["chronos", "Chronos"], ["circuits", "Circuits"], ["voitures", "Voitures"], ["pilotes", "Pilotes"], ["collection", "Cartes"]] },
    garage: { page: "garage", items: [["apercu", "Aperçu"], ["voitures", "Mes voitures"], ["suivi", "Suivi"]] },
    settings: { page: "settings", items: [["profil", "Profil"], ["ambiance", "Ambiance"], ["notifications", "Notifications"], ["carte", "Carte & vie privée"]] },
    admin: { page: "admin", items: [["tableau", "Vue d'ensemble"], ["moderation", "Modération"], ["catalogue", "Catalogue"], ["jeu", "Jeu"], ["journal", "Journal"], ["erreurs", "Erreurs"]] }
  };
  // pictogrammes et libellés courts : toutes les barres tiennent sur l'écran d'un téléphone, sans défilement
  const TAB_SHORT = { classement: "Rang", evenements: "Sorties", "Mes voitures": "Voitures", "Tableau de bord": "Bord", "Carte & vie privée": "Privé", notifications: "Notifs", moderation: "Modér." };
  const PREFIX = { settings: "/reglages", play: "/jouer", community: "/communaute", leaderboard: "/classement", garage: "/garage", admin: "/admin" };

  const handlers = {};
  let current = null, previous = null, internalMoves = 0, started = false;
  let backNav = false; const scrollAt = {};   // retour arrière : on restaure le défilement et on évite l'animation d'entrée

  function parse(hash) {
    let path = String(hash || "").replace(/^#/, "");
    if (path && path[0] !== "/") path = "/" + path;
    const wanted = path, bare = path.replace(/\/+$/, "");
    if (REDIRECTS[bare]) path = REDIRECTS[bare];
    for (const d of DEFS) {
      const m = path.match(d.re);
      if (!m) continue;
      const params = {};
      d.keys.forEach((k, i) => { try { params[k] = decodeURIComponent(m[i + 1] || ""); } catch (_) { params[k] = m[i + 1] || ""; } });
      if (d.tabs) { if (!params.tab || !d.tabs.includes(params.tab)) params.tab = DEFAULT_TAB[d.name]; }
      return { name: d.name, params, path, redirected: path !== wanted };
    }
    return { name: "home", params: {}, path: "/" };
  }

  function pathOf(name, params) {
    params = params || {};
    const e = encodeURIComponent;
    switch (name) {
      case "home": return "/";
      case "catalog": return "/catalogue";
      case "car": return "/voiture/" + e(params.id);
      case "commcar": return "/voiture-pilote/" + e(params.id);
      case "community": return "/communaute" + (params.tab ? "/" + params.tab : "");
      case "leaderboard": return "/classement" + (params.tab ? "/" + params.tab : "");
      case "circuit": return "/circuit/" + e(params.key);
      case "pilot": return "/pilote/" + e(params.uid);
      case "play": return "/jouer" + (params.tab ? "/" + params.tab : "");
      case "garage": return "/garage" + (params.tab ? "/" + params.tab : "");
      case "settings": return "/reglages" + (params.tab ? "/" + params.tab : "");
      case "admin": return "/admin" + (params.tab ? "/" + params.tab : "");
      case "contact": return "/contact";
      case "engine": return "/moteur/" + e(params.key);
      case "legal": return "/legal" + (params.doc ? "/" + e(params.doc) : "");
      case "duel": return "/duel" + (params.a && params.b ? "/" + e(params.a) + "/" + e(params.b) : "");
      case "club": return "/club/" + e(params.id);
      case "clubs": return "/clubs";
      case "market": return "/annonces";
      case "fusion": return "/fusion";
      case "cardmarket": return "/marche";
      case "wishfeed": return "/souhaits";
      case "plusmoins": return "/plusmoins";
      case "quizgame": return "/quiz";
      case "achievements": return "/succes";
      case "pass": return "/pass";
      case "timeline": return "/frise";
      case "news": return "/nouveautes";
      default: return "/";
    }
  }

  function setActiveNav(name) {
    const key = NAV_OF[name] || "";
    document.querySelectorAll(".desktop-navigation .nav-link").forEach((l) => {
      const on = l.dataset.nav === key;
      l.classList.toggle("active", on);
      if (on) l.setAttribute("aria-current", "page"); else l.removeAttribute("aria-current");
    });
    document.querySelectorAll(".mobile-touch-bar .touch-bar-item").forEach((l) => l.classList.toggle("active", l.dataset.touch === key));
    if (window.MAApp && window.MAApp.moveGlider) window.MAApp.moveGlider();
  }

  function showPage(name) {
    const id = PAGE_ID[name];
    document.querySelectorAll(".page").forEach((p) => {
      const on = p.id === id;
      p.classList.toggle("page-on", on);
      if (on) p.removeAttribute("aria-hidden"); else p.setAttribute("aria-hidden", "true");
    });
    document.body.dataset.page = name;
  }

  // ----- Jouer : trois onglets (Cartes / Mini-jeux / Communauté) et, dessous, les sous-onglets du groupe ; la même barre est posée sur chaque sous-page
  const PLAY_GROUPS = [["cartes", "Cartes"], ["minijeux", "Mini-jeux"], ["communaute", "Défis"]];
  const PLAY_SUBS = {
    cartes: [["Collection", "#/jouer/collection", (r) => r.name === "play" && r.params.tab === "collection"], ["Échanges", "#/jouer/echanges", (r) => r.name === "play" && r.params.tab === "echanges"], ["Fusion", "#/fusion", (r) => r.name === "fusion"], ["Marché", "#/marche", (r) => r.name === "cardmarket"], ["Souhaits", "#/souhaits", (r) => r.name === "wishfeed"], ["Boutique", "#/jouer/boutique", (r) => r.name === "play" && r.params.tab === "boutique"]],
    minijeux: [["Quiz", "#/quiz", (r) => r.name === "quizgame"], ["Plus ou moins", "#/plusmoins", (r) => r.name === "plusmoins"], ["Duel", "#/duel", (r) => r.name === "duel"], ["Bataille", "#/jouer/minijeux", () => false, "data-battle-tile"]],
    communaute: [["Semaine", "#/jouer/defis", (r) => r.name === "play" && r.params.tab === "defis"], ["Concours photo", "#/jouer/concours", (r) => r.name === "play" && r.params.tab === "concours"], ["Succès", "#/succes", (r) => r.name === "achievements"], ["Classements", "#/classement", () => false]]
  };
  function playGroup(r) {
    if (r.name === "play") return { cartes: "cartes", collection: "cartes", boutique: "cartes", echanges: "cartes", minijeux: "minijeux", communaute: "communaute", defis: "communaute", concours: "communaute" }[r.params.tab] || "cartes";
    return { fusion: "cartes", cardmarket: "cartes", wishfeed: "cartes", plusmoins: "minijeux", quizgame: "minijeux", duel: "minijeux", achievements: "communaute" }[r.name] || "cartes";
  }
  // ---- Communauté : même présentation que « Jouer » (3 groupes + sous-onglets)
  const COMM_GROUPS = [["pilotes", "Pilotes"], ["clubs", "Clubs"], ["classements", "Classements"]];
  const COMM_SUBS = {
    pilotes: [["Liste", "#/communaute/pilotes", (r) => r.name === "community" && r.params.tab === "pilotes"], ["Voitures", "#/communaute/voitures", (r) => r.name === "community" && r.params.tab === "voitures" || r.name === "commcar"], ["Fil", "#/communaute/fil", (r) => r.name === "community" && r.params.tab === "fil"]],
    clubs: [["Clubs", "#/clubs", (r) => r.name === "clubs" || r.name === "club"], ["Sorties", "#/communaute/evenements", (r) => r.name === "community" && r.params.tab === "evenements"], ["Carte", "#/communaute/carte", (r) => r.name === "community" && r.params.tab === "carte"]],
    classements: [["Chronos", "#/classement/chronos", (r) => r.name === "leaderboard" && r.params.tab === "chronos"], ["Circuits", "#/classement/circuits", (r) => r.name === "leaderboard" && r.params.tab === "circuits" || r.name === "circuit"], ["Voitures", "#/classement/voitures", (r) => r.name === "leaderboard" && r.params.tab === "voitures"], ["Pilotes", "#/classement/pilotes", (r) => r.name === "leaderboard" && r.params.tab === "pilotes"], ["Cartes", "#/classement/collection", (r) => r.name === "leaderboard" && r.params.tab === "collection"]]
  };
  function commGroup(r) {
    if (r.name === "community") return { evenements: "clubs", carte: "clubs", "hub-clubs": "clubs", "hub-classements": "classements" }[r.params.tab] || "pilotes";
    return { clubs: "clubs", club: "clubs", leaderboard: "classements", circuit: "classements", commcar: "pilotes" }[r.name] || "pilotes";
  }
  function groupBar(nav, route, label, groups, subs, g, landing, hrefOf) {
    nav.removeAttribute("aria-label"); nav.removeAttribute("role"); nav.classList.add("play-bar"); nav.classList.remove("page-tabs", "fit");
    nav.innerHTML = `<div class="page-tabs fit" role="tablist" aria-label="${label}" style="--n:${groups.length}">${groups.map(([k, l]) => `<a role="tab" class="page-tab${k === g ? " active" : ""}" href="${hrefOf(k)}" aria-selected="${k === g}"${k === g ? ' aria-current="page"' : ""}><span class="tl" data-s="${l}">${l}</span></a>`).join("")}</div>
      ${landing ? "" : `<div class="page-tabs fit play-subtabs" role="tablist" aria-label="${groups.find((x) => x[0] === g)[1]}" style="--n:${subs[g].length}">${subs[g].map((s) => { const on = !!s[2](route); return `<a role="tab" class="page-tab${on ? " active" : ""}" href="${s[1]}" aria-selected="${on}"${on ? ' aria-current="page"' : ""}${s[3] ? " " + s[3] : ""}><span class="tl" data-s="${s[4] || s[0]}">${s[0]}</span></a>`; }).join("")}</div>`}`;
  }
  function renderPlayBar(nav, route) {
    groupBar(nav, route, "Jouer", PLAY_GROUPS, PLAY_SUBS, playGroup(route), route.name === "play" && ["cartes", "minijeux", "communaute"].indexOf(route.params.tab) >= 0, (k) => "#/jouer/" + k);
  }
  function renderCommBar(nav, route) {
    groupBar(nav, route, "Communauté", COMM_GROUPS, COMM_SUBS, commGroup(route), route.name === "community" && /^hub-/.test(route.params.tab || ""), (k) => "#/communaute/hub-" + k);
  }

  function renderSectionTabs(pageEl, route) {
    if (!pageEl) return;
    pageEl.querySelectorAll("nav[data-section]").forEach((nav) => {
      const sec = SECTIONS[nav.dataset.section]; if (!sec) return;
      if (nav.dataset.section === "play") { renderPlayBar(nav, route); return; }
      if (nav.dataset.section === "community" || nav.dataset.section === "leaderboard") { renderCommBar(nav, route); return; }
      nav.setAttribute("role", "tablist"); nav.classList.add("page-tabs", "fit"); nav.style.setProperty("--n", sec.items.length); nav.setAttribute("aria-label", "Sections");
      nav.innerHTML = sec.items.map((it) => {
        const custom = !!it[2], href = "#" + (custom ? it[2] : PREFIX[nav.dataset.section] + "/" + it[0]);
        const on = custom ? it[3].indexOf(route.name) >= 0 : route.name === sec.page && route.params.tab === it[0];
        return `<a role="tab" class="page-tab${on ? " active" : ""}" href="${href}"${custom ? "" : ` data-tab="${it[0]}"`}${on ? ' aria-selected="true" aria-current="page"' : ' aria-selected="false"'}><span class="tl" data-s="${TAB_SHORT[it[0]] || TAB_SHORT[it[1]] || it[1]}">${it[1]}</span></a>`;
      }).join("");
    });
    const act = pageEl.querySelector(".page-tab.active");
    if (act && act.scrollIntoView) { const bar = act.parentElement; if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: Math.max(0, act.offsetLeft - 24), behavior: "auto" }); }
  }

  function showTab(pageEl, tab) {
    if (!pageEl) return;
    pageEl.querySelectorAll(":scope .page-tab").forEach((a) => {
      if (a.closest(".play-bar")) return;
      const on = a.dataset.tab === tab;
      a.classList.toggle("active", on);
      a.setAttribute("aria-selected", on ? "true" : "false");
    });
    pageEl.querySelectorAll(":scope .tab-panel").forEach((p) => { p.hidden = (" " + p.dataset.tab + " ").indexOf(" " + tab + " ") < 0; });
  }

  async function dispatch() {
    const route = parse(location.hash);
    const pageChanged = !current || current.name !== route.name || ((route.name === "car" || route.name === "commcar") && current.params.id !== route.params.id) ||
      (route.name === "pilot" && current.params.uid !== route.params.uid) || (route.name === "circuit" && current.params.key !== route.params.key);
    if (current) scrollAt[current.path] = window.scrollY;
    const wasBack = backNav; backNav = false;
    document.documentElement.classList.toggle("nav-back", wasBack);
    previous = current;
    current = route;
    const pageEl = document.getElementById(PAGE_ID[route.name]);
    // garde d'accès éventuelle (connexion / admin) : la fonction peut renvoyer un chemin de repli
    const list = handlers[route.name] || [];
    for (const h of list) {
      if (!h.guard) continue;
      const redirect = await h.guard(route.params);
      if (redirect) { api.go(redirect, { replace: true }); return; }
    }
    if (route.redirected) history.replaceState(null, "", "#" + route.path);
    showPage(route.name);
    renderSectionTabs(pageEl, route);
    if (route.params.tab !== undefined) showTab(pageEl, route.params.tab);
    setActiveNav(route.name);
    document.title = TITLES[route.name] || TITLES.home;
    if (pageChanged) { const y = wasBack ? scrollAt[route.path] : 0; window.scrollTo(0, y || 0); if (wasBack && y) requestAnimationFrame(() => window.scrollTo(0, y)); }
    document.dispatchEvent(new CustomEvent("ma:route", { detail: route }));
    for (const h of list) {
      if (!h.enter) continue;
      try { await h.enter(route.params, { pageChanged, route }); } catch (e) { console.error("Route " + route.name + " :", e); }
    }
  }

  const api = {
    /** enregistre le comportement d'une page : { guard(params) -> chemin|undefined, enter(params, info) } */
    register(name, def) { (handlers[name] = handlers[name] || []).push(def); },
    parse, pathOf,
    current: () => current,
    previous: () => previous,
    is(name, params) {
      if (!current || current.name !== name) return false;
      return Object.keys(params || {}).every((k) => current.params[k] === params[k]);
    },
    href(name, params) { return "#" + pathOf(name, params); },
    go(target, opts) {
      const path = typeof target === "string" ? target : pathOf(target.name, target.params);
      const hash = "#" + (path[0] === "/" ? path : "/" + path);
      if (location.hash === hash || (hash === "#/" && (location.hash === "" || location.hash === "#"))) {
        if (opts && opts.force) dispatch();
        return;
      }
      internalMoves++;
      if (opts && opts.replace) history.replaceState(null, "", hash), dispatch();
      else location.hash = hash;
    },
    /** retour : historique du navigateur si on vient du site, sinon repli */
    back(fallback) {
      if (internalMoves > 0) { internalMoves--; history.back(); }
      else api.go(fallback || "/", { replace: true });
    },
    refresh() { if (started) dispatch(); },
    start() {
      started = true;
      window.addEventListener("popstate", () => { backNav = true; setTimeout(() => { backNav = false; }, 600); });
      window.addEventListener("hashchange", dispatch);
      dispatch();
    }
  };
  window.Router = api;
})();
