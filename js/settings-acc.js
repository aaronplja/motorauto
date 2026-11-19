/**
 * MOTORAUTO — Réglages : les blocs des onglets Ambiance et Notifications deviennent des menus déroulants
 * (thème perso, familles d'ambiances, ambiance de saison, confort et fluidité, catégories de notifications, ne pas déranger…).
 * Ces blocs sont créés par d'autres modules, parfois après coup : on les regroupe dès qu'ils apparaissent, sans toucher à leur contenu.
 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clean = (t) => String(t || "").replace(/[\p{Extended_Pictographic}️‍]/gu, "").replace(/\s+/g, " ").trim();
  const slug = (t) => clean(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "bloc";
  /** clé stable (indépendante de la langue) : le thème, la famille ou le bloc plutôt que son titre traduit */
  function keyOf(els, title) {
    const el = els[0], t = els.map((e) => e.querySelector && e.querySelector("[data-set-theme]")).find(Boolean);
    if (el.id === "ct-box") return "perso";
    if (t) return "fam-" + t.getAttribute("data-set-theme");
    return el.id || slug(title);
  }
  function wrap(els, prefix, title, sum, def, key) {
    const A = window.MAAcc; if (!A || !els.length || !title) return;
    const w = document.createElement("div"); w.innerHTML = A.o(prefix + (key || keyOf(els, title)), esc(title), esc(sum || ""), !!def, "set-acc") + A.c;
    const d = w.firstElementChild; els[0].before(d); const b = d.querySelector(".acc-body"); els.forEach((e) => b.appendChild(e));
  }
  const isHead = (e) => e.classList.contains("theme-family-title") || e.classList.contains("ct-box") || (e.firstElementChild && e.firstElementChild.classList.contains("theme-family-title")) || e.classList.contains("set-card");
  const titleOf = (e) => clean((e.classList.contains("theme-family-title") ? e : e.querySelector(".theme-family-title, h3") || {}).textContent);
  function theme() {
    const host = $("settings-theme"); if (!host) return;
    const body = host.querySelector(".settings-theme-body") || host;
    [body, host].filter((v, i, a) => a.indexOf(v) === i).forEach((root) => {
      const kids = Array.from(root.children).filter((e) => e.tagName !== "DETAILS" && e.tagName !== "DIALOG");
      for (let i = 0; i < kids.length; i++) {
        const el = kids[i]; if (!isHead(el)) continue;
        const els = [el]; let j = i + 1;
        if (el.classList.contains("theme-family-title")) while (j < kids.length && !isHead(kids[j])) els.push(kids[j++]);
        i = j - 1;
        const tiles = els.reduce((n, e) => n + e.querySelectorAll(".theme-tile").length, 0), act = els.map((e) => e.querySelector(".theme-tile.active .tile-title")).find(Boolean);
        const t = titleOf(el), sum = act ? "Actuelle : " + clean(act.textContent) : tiles ? tiles + " ambiances" : el.classList.contains("ct-box") && el.id === "ct-box" ? "Fond, accent, code à partager" : "";
        wrap(els, "set-amb-", t, sum, !!act);
      }
    });
  }
  function notifs() {
    const root = $("settings-notifs"); if (!root) return;
    const cards = Array.from(root.children).filter((e) => e.matches && e.matches("section.set-card.col"));
    cards.forEach((c, i) => wrap([c], "set-not-", titleOf(c), "", i === 0, "n" + i));
  }
  let q = 0;
  const run = () => { q = 0; try { theme(); notifs(); } catch (_) { /* ignoré */ } };
  const later = () => { if (!q) q = requestAnimationFrame(run); };
  document.addEventListener("DOMContentLoaded", () => {
    ["settings-theme", "settings-notifs"].forEach((id) => { const el = $(id); if (el) new MutationObserver(later).observe(el, { childList: true, subtree: true }); });
    later();
  });
  window.addEventListener("hashchange", () => setTimeout(later, 120));
})();
