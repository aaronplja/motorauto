/**
 * MOTORAUTO — « Personnaliser le profil » : panneau intégré au profil public (feuille qui monte du bas sur mobile).
 * Réutilise le formulaire de réglages existant (mêmes champs, même enregistrement) et ajoute l'apparence (cadre, titre) et la vitrine.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, layer = null, home = null, box = null;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (id) => document.getElementById(id);

  function showBtn(uid) {
    const b = $("pub-edit-btn"); if (!b) return;
    const mine = !!(C && C.user && C.user.uid === uid);
    b.hidden = !mine;
    const f = document.querySelector('#public-profile-modal [data-action="toggle-follow"]'); if (f && mine) f.hidden = true;
  }

  function preview() {
    const el = $("pe-prev"); if (!el || !C.user) return;
    const eq = (window.MACosm && window.MACosm.get(C.user.uid)) || {}, av = ($("settings-avatar-preview") && $("settings-avatar-preview").getAttribute("src")) || (C.profile && C.profile.avatar) || "";
    const fr = eq.frame && G.FRAMES[eq.frame], ti = eq.title && G.TITLES[eq.title];
    el.innerHTML = `<span class="pe-av${fr ? " cosm-f cf-" + eq.frame : ""}"${fr ? ` style="--cf:${fr.color}"` : ""}>${av ? `<img src="${esc(av)}" alt="" data-fallback="avatar">` : ""}</span>
      <div><b>${esc(($("settings-username") && $("settings-username").value) || (C.profile && C.profile.username) || "Pilote")}</b>${ti ? `<span class="cosm-title">${esc(T(G.TITLES[eq.title].name))}</span>` : `<small class="lap-meta">${T("Aucun titre équipé")}</small>`}</div>`;
  }

  function appearance() {
    const M = window.MACosm, uid = C.user.uid, eq = M.get(uid) || {}, doc = (window.MACards && window.MACards.mine()) || {};
    const fr = Object.keys(G.FRAMES).map((id) => [id, M.unlocked("f", id, uid, doc)]), ti = Object.keys(G.TITLES).map((id) => [id, M.unlocked("t", id, uid, doc)]);
    const av = ($("settings-avatar-preview") && $("settings-avatar-preview").getAttribute("src")) || "";
    return `<p class="pe-hint">${T("Choisis le cadre de ton avatar et le titre affiché sous ton nom. Les autres pilotes les voient partout sur le site.")}</p>
      <h4 class="ph-h">${T("Cadres d'avatar")}</h4>
      <div class="ph-grid">${fr.map(([id, on]) => `<button type="button" class="ph-tile pe-pick ${on ? "on" : "off"}${eq.frame === id ? " eq" : ""}" data-pe-f="${id}" ${on ? "" : "disabled"} title="${esc(on ? T(G.FRAMES[id].name) : T(M.req("f", id)))}"><span class="ph-av cosm-f cf-${id}" style="--cf:${G.FRAMES[id].color}">${av ? `<img src="${esc(av)}" alt="">` : "<i></i>"}</span><b>${esc(T(G.FRAMES[id].name))}</b><small>${eq.frame === id ? T("Équipé") : on ? T("Choisir") : esc(T(M.req("f", id)))}</small></button>`).join("")}</div>
      <h4 class="ph-h">${T("Titres")}</h4>
      <div class="ph-grid ph-grid-t">${ti.map(([id, on]) => `<button type="button" class="ph-tile ph-t pe-pick ${on ? "on" : "off"}${eq.title === id ? " eq" : ""}" data-pe-t="${id}" ${on ? "" : "disabled"}><span class="cosm-title ph-title">${esc(T(G.TITLES[id].name))}</span><small>${eq.title === id ? T("Équipé") : on ? T("Choisir") : esc(T(M.req("t", id)))}</small></button>`).join("")}</div>
      <button type="button" class="cta-btn btn-ghost compact-btn mt" data-pe-clear>${T("Retirer cadre et titre")}</button>`;
  }
  function vitrine() {
    return `<p class="pe-hint">${T("Ta vitrine montre tes 6 cartes préférées, dans l'ordre que tu veux, sur un fond au choix. Tu peux aussi y mettre jusqu'à 3 voitures.")}</p>
      <button type="button" class="cta-btn fill-btn w-100" data-pe-vit>🎴 ${T("Choisir mes cartes et le fond")}</button>
      <a class="cta-btn btn-ghost w-100 mt" href="#/jouer/collection" data-pe-close>${T("Ouvrir ma collection")}</a>`;
  }

  async function open() {
    if (layer || !C.user) return;
    const form = document.querySelector('#page-settings .tab-panel[data-tab="profil"] .settings-box'); if (!form) return;
    home = form.parentElement; box = form;
    if (window.MACosm) { try { await window.MACosm.load([C.user.uid]); } catch (_) { /* partiel */ } }
    if (window.MACards && !window.MACards.mine()) { try { await window.MACards.load(); } catch (_) { /* partiel */ } }
    layer = document.createElement("div"); layer.className = "pe-layer"; layer.setAttribute("role", "dialog"); layer.setAttribute("aria-modal", "true"); layer.setAttribute("aria-label", T("Personnaliser le profil"));
    layer.innerHTML = `<div class="pe-sheet"><div class="pe-head"><h2>${T("Personnaliser le profil")}</h2><button type="button" class="pe-x" data-pe-close aria-label="${T("Fermer")}">×</button></div>
      <div class="pe-prev" id="pe-prev"></div>
      <div class="pe-tabs" role="tablist"><button type="button" role="tab" class="on" data-pe-tab="profil">${T("Profil")}</button><button type="button" role="tab" data-pe-tab="look">${T("Apparence")}</button><button type="button" role="tab" data-pe-tab="vit">${T("Vitrine")}</button></div>
      <div class="pe-body"><div class="pe-pane" data-pe-pane="profil"></div><div class="pe-pane" data-pe-pane="look" hidden></div><div class="pe-pane" data-pe-pane="vit" hidden></div></div></div>`;
    document.body.appendChild(layer); document.body.style.overflow = "hidden";
    layer.querySelector('[data-pe-pane="profil"]').appendChild(box);
    layer.querySelector('[data-pe-pane="look"]').innerHTML = window.MACosm ? appearance() : "";
    layer.querySelector('[data-pe-pane="vit"]').innerHTML = vitrine();
    preview();
  }
  function close(refresh) {
    if (!layer) return;
    if (home && box) home.appendChild(box);
    layer.remove(); layer = null; document.body.style.overflow = "";
    if (refresh !== false && window.MAApp && window.MAApp.refreshPublic) window.MAApp.refreshPublic();
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("pilot", { enter: (p) => { showBtn(p.uid); setTimeout(() => showBtn(p.uid), 900); } });
    document.addEventListener("ma:auth", () => { const r = ctx.Router.current(); if (r && r.name === "pilot") showBtn(r.params.uid); });
    ctx.Router.register("pilot", { enter: () => { if (layer) close(false); } });
    document.addEventListener("click", async (e) => {
      const t = e.target;
      if (t.closest && t.closest("#pub-edit-btn")) { open(); return; }
      if (!layer) return;
      if (t === layer || (t.closest && t.closest("[data-pe-close]"))) { close(); return; }
      const tab = t.closest && t.closest("[data-pe-tab]");
      if (tab) {
        layer.querySelectorAll("[data-pe-tab]").forEach((b) => b.classList.toggle("on", b === tab));
        layer.querySelectorAll("[data-pe-pane]").forEach((p) => { p.hidden = p.dataset.pePane !== tab.dataset.peTab; });
        if (tab.dataset.peTab === "look" && window.MACosm) layer.querySelector('[data-pe-pane="look"]').innerHTML = appearance();
        return;
      }
      const f = t.closest && t.closest("[data-pe-f]"), ti = t.closest && t.closest("[data-pe-t]");
      if (f || ti || (t.closest && t.closest("[data-pe-clear]"))) {
        const patch = f ? { frame: f.dataset.peF } : ti ? { title: ti.dataset.peT } : { frame: "", title: "" };
        try { await window.MACosm.equip(C.user.uid, patch); layer.querySelector('[data-pe-pane="look"]').innerHTML = appearance(); preview(); C.toast(T("Apparence enregistrée."), "ok"); } catch (er) { C.toast(er.message, "err"); }
        return;
      }
      if (t.closest && t.closest("[data-pe-vit]")) { close(false); if (window.MACards) { await window.MACards.load(); window.MACards.editShowcase(); } }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && layer) close(); });
    document.addEventListener("input", (e) => { if (layer && e.target.id === "settings-username") preview(); });
  });
})();
