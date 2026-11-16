/**
 * MOTORAUTO — navigation v3 : Accueil · Catalogue · Jouer · Chat · Pilotes. Ce fichier gère le menu « Mon compte » (bouton du compte, en haut à droite) : raccourcis, administration, réglages, contact, légal, déconnexion.
 * Sur mobile : feuille qui monte du bas ; sur ordinateur : panneau sous l'en-tête.
 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let layer = null, lastFocus = null;

  const ICON = {
    garage: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    cards: '<rect x="3" y="5" width="12" height="16" rx="2" transform="rotate(-8 9 13)"/><path d="M9 3.5h8a2 2 0 0 1 2 2V17"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    bar: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1.5 12h3M19.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6z"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    news: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 16h7M9 8.5h3"/>',
    doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>'
  };
  const ico = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  function ctx() { try { return window.MAApp && window.MAApp.ctx ? window.MAApp.ctx() : {}; } catch (_) { return {}; } }
  const row = (href, icon, label, extra, attrs) => `<a class="me-row" href="${href}" ${attrs || ""}><span class="me-ico">${ico(icon)}</span><span class="me-label">${label}</span>${extra || ""}<i class="me-chev" aria-hidden="true">›</i></a>`;
  const btnRow = (act, icon, label, cls) => `<button type="button" class="me-row ${cls || ""}" data-me="${act}"><span class="me-ico">${ico(icon)}</span><span class="me-label">${label}</span><i class="me-chev" aria-hidden="true">›</i></button>`;

  function build() {
    const c = ctx(), user = c.user, p = c.profile || {};
    const unread = window.MA && MA.unread ? MA.unread.count() : 0;
    const av = window.MA && MA.safeUrl ? MA.safeUrl(p.avatar) : "";
    const head = user
      ? `<div class="me-card"><span class="me-avatar">${av ? `<img src="${esc(av)}" alt="" data-fallback="avatar">` : ico("user")}</span><div class="me-who"><b>${esc(p.username || user.displayName || "Pilote")}</b><small>${c.isAdmin ? "Administrateur" : "Pilote connecté"}</small></div></div>`
      : `<div class="me-card guest"><div class="me-who"><b>Bienvenue sur MOTORAUTO</b><small>Connecte-toi pour ton garage, tes cartes et le salon.</small></div><button type="button" class="cta-btn me-login" data-me="login">Connexion</button></div>`;
    const rows = [
      c.isAdmin ? row("#/admin", "shield", "Administration", (window.MAAdminTodo && MAAdminTodo.count() ? `<span class="me-badge">${MAAdminTodo.count()}</span>` : "")) : "",
      row("#/reglages/profil", "cog", "Réglages", "", 'data-me-link'),
      row("#/nouveautes", "news", "Nouveautés"),
      row("#/contact", "mail", "Contact")
    ].join("");
    return `
      <div class="me-sheet" role="dialog" aria-modal="true" aria-label="Réglages et compte">
        <span class="me-grip" aria-hidden="true"></span>
        <button type="button" class="me-close" data-me="close" aria-label="Fermer">&times;</button>
        ${head}
        <div class="me-group">${rows}</div>
      </div>`;
  }

  function isOpen() { return !!layer && layer.classList.contains("on"); }
  function setExpanded(v) { const b = $("user-profile-btn"); if (b) b.setAttribute("aria-expanded", String(v)); }

  function open() {
    if (isOpen()) return close();
    lastFocus = document.activeElement;
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "me-layer";
      layer.addEventListener("click", onClick);
      document.body.appendChild(layer);
    }
    layer.innerHTML = '<div class="me-backdrop" data-me="close"></div>' + build();
    requestAnimationFrame(() => layer.classList.add("on"));
    document.body.classList.add("me-open");
    setExpanded(true);
    const first = layer.querySelector(".me-row, .me-login");
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
  }
  function close() {
    if (!layer) return;
    layer.classList.remove("on");
    document.body.classList.remove("me-open");
    setExpanded(false);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (_) { /* rien */ }
  }
  function onClick(e) {
    const t = e.target.closest("[data-me], a.me-row, .me-legal a");
    if (!t) return;
    const act = t.dataset.me;
    if (act === "close") return close();
    if (act === "theme") { close(); const b = $("theme-btn"); if (b) b.click(); return; }
    if (act === "login") { close(); const c = ctx(); if (c.requireLogin) c.requireLogin(); return; }
    if (act === "logout") { close(); const b = $("logout-btn"); if (b) b.click(); return; }
    if (t.matches("a.me-row, .me-legal a")) close();
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#user-profile-btn");
    if (!trigger) return;
    if (trigger.id === "user-profile-btn" && !ctx().user) return; // déconnecté : le bouton ouvre directement la connexion
    e.preventDefault(); e.stopImmediatePropagation();
    open();
  }, true);
  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") { e.stopPropagation(); close(); return; }
    if (e.key === "Tab") {
      const f = Array.from(layer.querySelectorAll("a[href], button:not([disabled])")).filter((n) => n.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);
  window.addEventListener("hashchange", () => { if (isOpen()) close(); });
  window.addEventListener("resize", () => { if (isOpen()) close(); });
  // connecté : le bouton du compte devient une simple roue crantée ; visiteur : « Connexion »
  function syncChip() {
    const chip = $("user-profile-btn"); if (!chip) return;
    const u = !!ctx().user;
    chip.classList.toggle("is-gear", u);
    chip.setAttribute("aria-label", u ? "Réglages et compte" : "Espace compte pilote");
    chip.setAttribute("title", u ? "Réglages et compte" : "Connexion");
  }
  document.addEventListener("ma:auth", () => setTimeout(syncChip, 0));
  setTimeout(syncChip, 300); setTimeout(syncChip, 1500);
  window.MANav = { open, close };
})();
