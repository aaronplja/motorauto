/**
 * MOTORAUTO — navigation v2 : 4 pages principales + « Moi » (menu unique : espace pilote, classement, messages, ambiance, contact, légal).
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
    const mine = user ? `
      <div class="me-group"><h3>Mon espace</h3>
        ${row("#/garage", "garage", "Mon garage")}
        ${row("#/jouer/cartes", "cards", "Mes cartes")}
        ${row("#/pilote/" + encodeURIComponent(user.uid), "user", "Mon profil public")}
        ${row("chat.html", "chat", "Messages", unread ? `<span class="me-badge">${unread}</span>` : "")}
        ${c.isAdmin ? row("#/admin", "shield", "Administration", (window.MAAdminTodo && MAAdminTodo.count() ? `<span class="me-badge">${MAAdminTodo.count()}</span>` : "")) : ""}
      </div>` : "";
    return `
      <div class="me-sheet" role="dialog" aria-modal="true" aria-label="Mon espace">
        <span class="me-grip" aria-hidden="true"></span>
        <button type="button" class="me-close" data-me="close" aria-label="Fermer">&times;</button>
        ${head}
        ${mine}
        <div class="me-group"><h3>Découvrir</h3>
          ${row("#/classement", "bar", "Classement")}
          ${user ? "" : row("chat.html", "chat", "Salon des pilotes")}
        </div>
        <div class="me-group"><h3>Préférences &amp; aide</h3>
          ${user ? row("#/reglages/profil", "cog", "Réglages", "", 'data-me-link') : ""}
          ${btnRow("theme", "sun", "Ambiance visuelle")}
          ${row("#/contact", "mail", "Contact")}
        </div>
        <nav class="me-legal" aria-label="Informations légales"><a href="#/legal/mentions">Mentions légales</a><a href="#/legal/confidentialite">Confidentialité</a><a href="#/legal/cgu">Conditions</a></nav>
        ${user ? `<div class="me-group"><button type="button" class="me-row danger" data-me="logout"><span class="me-ico">${ico("out")}</span><span class="me-label">Se déconnecter</span></button></div>` : ""}
      </div>`;
  }

  function isOpen() { return !!layer && layer.classList.contains("on"); }
  function setExpanded(v) { document.querySelectorAll("#nav-me-btn, #touch-me-btn").forEach((b) => b.setAttribute("aria-expanded", String(v))); }

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
    const trigger = e.target.closest("#nav-me-btn, #touch-me-btn, #user-profile-btn");
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
  // le bouton de compte (ordinateur) s'allume quand on est dans l'espace « Moi »
  const meBtn = $("touch-me-btn"), chip = $("user-profile-btn");
  if (meBtn && chip && window.MutationObserver) {
    const sync = () => chip.classList.toggle("is-here", meBtn.classList.contains("active"));
    new MutationObserver(sync).observe(meBtn, { attributes: true, attributeFilter: ["class"] }); sync();
  }
  window.MANav = { open, close };
})();
