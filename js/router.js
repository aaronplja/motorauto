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
    { name: "community", re: /^\/communaute(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["fil", "voitures", "pilotes", "evenements"] },
    { name: "play", re: /^\/jouer(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["apercu", "cartes", "echanges", "defis", "concours"] },
    { name: "leaderboard", re: /^\/classement(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["chronos", "circuits", "voitures", "pilotes", "collection"] },
    { name: "circuit", re: /^\/circuit\/([^/]+)\/?$/, keys: ["key"] },
    { name: "pilot", re: /^\/pilote\/([^/]+)\/?$/, keys: ["uid"] },
    { name: "garage", re: /^\/garage(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["apercu", "voitures", "suivi"] },
    { name: "settings", re: /^\/reglages(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["profil", "ambiance", "notifications", "carte"] },
    { name: "admin", re: /^\/admin(?:\/([^/]+))?\/?$/, keys: ["tab"], tabs: ["tableau", "moderation", "catalogue", "jeu", "journal"] },
    { name: "duel", re: /^\/duel(?:\/([^/]+)\/([^/]+))?\/?$/, keys: ["a", "b"] },
    { name: "club", re: /^\/club\/([^/]+)\/?$/, keys: ["id"] },
    { name: "clubs", re: /^\/clubs\/?$/, keys: [] },
    { name: "market", re: /^\/annonces\/?$/, keys: [] },
    { name: "contact", re: /^\/contact\/?$/, keys: [] },
    { name: "engine", re: /^\/moteur\/([^/]+)\/?$/, keys: ["key"] },
    { name: "legal", re: /^\/legal(?:\/([^/]+))?\/?$/, keys: ["doc"] }
  ];
  const PAGE_ID = {
    home: "page-home", catalog: "page-catalog", car: "vehicle-modal", commcar: "page-commcar", community: "page-community",
    leaderboard: "leaderboard-modal", circuit: "page-circuit", pilot: "public-profile-modal",
    garage: "garage-modal", settings: "page-settings", engine: "page-engine", admin: "admin-panel-modal", contact: "page-contact", legal: "page-legal",
    duel: "page-duel", club: "page-club", clubs: "page-clubs", market: "page-market", play: "page-play"
  };
  // entrée de menu mise en avant pour chaque page
  const NAV_OF = { home: "home", catalog: "catalog", car: "catalog", engine: "catalog", commcar: "community", community: "community", pilot: "community", leaderboard: "me", circuit: "me", garage: "me", settings: "me", admin: "me", contact: "me", legal: "me", duel: "play", quiz: "play", play: "play", club: "community", clubs: "community", market: "community" };
  const TITLES = {
    home: "MOTORAUTO | Archive automobile & communauté de pilotes", catalog: "Catalogue | MOTORAUTO", community: "Communauté | MOTORAUTO",
    play: "Jouer | MOTORAUTO", leaderboard: "Classements | MOTORAUTO", circuit: "Circuit | MOTORAUTO", pilot: "Pilote | MOTORAUTO", garage: "Mon garage | MOTORAUTO", settings: "Réglages | MOTORAUTO",
    admin: "Administration | MOTORAUTO", legal: "Informations légales | MOTORAUTO", engine: "Moteur | MOTORAUTO", contact: "Contact | MOTORAUTO", commcar: "Voiture de pilote | MOTORAUTO", duel: "Duel | MOTORAUTO", quiz: "Quiz | MOTORAUTO", club: "Club | MOTORAUTO", clubs: "Clubs | MOTORAUTO", market: "Annonces | MOTORAUTO", car: "Fiche véhicule | MOTORAUTO"
  };
  const DEFAULT_TAB = { settings: "profil", community: "fil", leaderboard: "chronos", garage: "apercu", admin: "tableau", play: "apercu" };
  // anciennes adresses (liens partagés, favoris) → adresse actuelle
  const REDIRECTS = { "/garage/parametres": "/reglages/profil", "/garage/cartes": "/jouer/cartes", "/garage/entretien": "/garage/suivi", "/garage/budget": "/garage/suivi", "/garage/projets": "/garage/suivi", "/admin/traiter": "/admin/tableau" };
  // barres d'onglets : une seule définition, dessinée dans chaque page de la section (nav[data-section])
  const SECTIONS = {
    play: { page: "play", items: [["apercu", "Jouer"], ["cartes", "Cartes"], ["echanges", "Échanges"], ["defis", "Défis"], ["concours", "Concours"]] },
    community: { page: "community", items: [["fil", "Fil"], ["pilotes", "Pilotes"], ["voitures", "Voitures"], ["evenements", "Sorties"], ["clubs", "Clubs", "/clubs", ["clubs", "club"]], ["annonces", "Annonces", "/annonces", ["market"]]] },
    leaderboard: { page: "leaderboard", items: [["chronos", "Chronos"], ["circuits", "Circuits"], ["voitures", "Voitures"], ["pilotes", "Pilotes"], ["collection", "Cartes"]] },
    garage: { page: "garage", items: [["apercu", "Aperçu"], ["voitures", "Mes voitures"], ["suivi", "Suivi"]] },
    settings: { page: "settings", items: [["profil", "Profil"], ["ambiance", "Ambiance"], ["notifications", "Notifications"], ["carte", "Carte & vie privée"]] },
    admin: { page: "admin", items: [["tableau", "Tableau de bord"], ["moderation", "Modération"], ["catalogue", "Catalogue"], ["jeu", "Jeu"], ["journal", "Journal"]] }
  };
  const PREFIX = { settings: "/reglages", play: "/jouer", community: "/communaute", leaderboard: "/classement", garage: "/garage", admin: "/admin" };

  const handlers = {};
  let current = null, previous = null, internalMoves = 0, started = false;

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

  function renderSectionTabs(pageEl, route) {
    if (!pageEl) return;
    pageEl.querySelectorAll("nav[data-section]").forEach((nav) => {
      const sec = SECTIONS[nav.dataset.section]; if (!sec) return;
      nav.setAttribute("role", "tablist"); nav.classList.add("page-tabs"); nav.setAttribute("aria-label", "Sections");
      nav.innerHTML = sec.items.map((it) => {
        const custom = !!it[2], href = "#" + (custom ? it[2] : PREFIX[nav.dataset.section] + "/" + it[0]);
        const on = custom ? it[3].indexOf(route.name) >= 0 : route.name === sec.page && route.params.tab === it[0];
        return `<a role="tab" class="page-tab${on ? " active" : ""}" href="${href}"${custom ? "" : ` data-tab="${it[0]}"`}${on ? ' aria-selected="true" aria-current="page"' : ' aria-selected="false"'}>${it[1]}</a>`;
      }).join("");
    });
    const act = pageEl.querySelector(".page-tab.active");
    if (act && act.scrollIntoView) { const bar = act.parentElement; if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: Math.max(0, act.offsetLeft - 24), behavior: "auto" }); }
  }

  function showTab(pageEl, tab) {
    if (!pageEl) return;
    pageEl.querySelectorAll(":scope .page-tab").forEach((a) => {
      const on = a.dataset.tab === tab;
      a.classList.toggle("active", on);
      a.setAttribute("aria-selected", on ? "true" : "false");
    });
    pageEl.querySelectorAll(":scope .tab-panel").forEach((p) => { p.hidden = p.dataset.tab !== tab; });
  }

  async function dispatch() {
    const route = parse(location.hash);
    const pageChanged = !current || current.name !== route.name || ((route.name === "car" || route.name === "commcar") && current.params.id !== route.params.id) ||
      (route.name === "pilot" && current.params.uid !== route.params.uid) || (route.name === "circuit" && current.params.key !== route.params.key);
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
    if (pageChanged) window.scrollTo(0, 0);
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
      window.addEventListener("hashchange", dispatch);
      dispatch();
    }
  };
  window.Router = api;
})();
