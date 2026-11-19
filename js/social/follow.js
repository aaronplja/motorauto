/**
 * MOTORAUTO — suivre une voiture ou une marque.
 *   follows/{uid} { cars: [id…], brands: [famille…] }  — les Cloud Functions envoient une notification quand une fiche suivie change,
 *   qu'une voiture de la marque arrive au catalogue ou chez les pilotes, ou qu'une annonce « Nouveautés » la concerne.
 *   Boutons « Suivre » sur chaque fiche voiture ; la liste se gère sur la page Nouveautés.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, doc = { cars: [], brands: [] }, loadedFor = "", pending = null;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const key = (kind) => (kind === "brand" ? "brands" : "cars");

  async function load(force) {
    const uid = C.user ? C.user.uid : "";
    if (!uid) { doc = { cars: [], brands: [] }; loadedFor = ""; return doc; }
    if (!force && loadedFor === uid) return doc;
    if (pending) return pending;
    pending = (async () => {
      try { const s = await C.db.collection("follows").doc(uid).get(); const d = s.exists ? s.data() : {}; doc = { cars: d.cars || [], brands: d.brands || [] }; loadedFor = uid; }
      catch (_) { doc = { cars: [], brands: [] }; }
      pending = null; return doc;
    })();
    return pending;
  }
  const has = (kind, val) => doc[key(kind)].indexOf(val) >= 0;
  async function toggle(kind, val) {
    if (!C.user) { if (C.requireLogin) C.requireLogin(); return false; }
    await load();
    const k = key(kind), list = doc[k].slice(), i = list.indexOf(val);
    if (i >= 0) list.splice(i, 1); else list.push(val);
    if (list.length > (k === "cars" ? 60 : 40)) { C.toast(T("Tu suis déjà beaucoup d'éléments : retire-en avant d'en ajouter."), "err"); return has(kind, val); }
    const prev = doc[k]; doc[k] = list;
    try {
      await C.db.collection("follows").doc(C.user.uid).set({ cars: doc.cars, brands: doc.brands, updatedAt: C.FieldValue.serverTimestamp() });
      if (window.MAGame) window.MAGame.invalidate();
      return i < 0;
    } catch (e) { doc[k] = prev; C.toast(T("Abonnement impossible pour l'instant."), "err"); return has(kind, val); }
  }

  // ---- boutons sur la fiche voiture
  function paint() {
    const box = document.querySelector("#vehicle-detail-content .sheet-actions"); if (!box) return;
    const route = C.Router.current(); if (!route || route.name !== "car") return;
    const car = C.carsById.get(route.params.id); if (!car) return;
    const fam = G.familyOf(car.brand);
    let wrap = box.querySelector(".follow-btns");
    if (!wrap) { wrap = document.createElement("span"); wrap.className = "follow-btns"; box.appendChild(wrap); }
    const on1 = has("car", car.id), on2 = has("brand", fam);
    wrap.innerHTML = `<button type="button" class="cta-btn btn-ghost compact-btn follow-btn${on1 ? " on" : ""}" data-follow="car" data-val="${C.esc(car.id)}" aria-pressed="${on1}">${on1 ? T("Voiture suivie") : T("Suivre cette voiture")}</button>
      <button type="button" class="cta-btn btn-ghost compact-btn follow-btn${on2 ? " on" : ""}" data-follow="brand" data-val="${C.esc(fam)}" aria-pressed="${on2}">${on2 ? T("Marque suivie") : T("Suivre") + " " + C.esc(fam)}</button>`;
  }
  function watch() {
    const host = document.getElementById("vehicle-detail-content"); if (!host) return;
    let t = null;
    new MutationObserver(() => { if (host.querySelector(".follow-btns")) return; clearTimeout(t); t = setTimeout(() => load().then(paint), 30); }).observe(host, { childList: true });
  }

  window.MAFollow = { load, has, toggle, get: () => doc, remove: async (kind, val) => { await load(); if (has(kind, val)) return toggle(kind, val); return false; } };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    watch();
    ctx.Router.register("car", { enter: () => { load().then(paint); } });
    document.addEventListener("ma:auth", () => { loadedFor = ""; load(true).then(paint); });
    document.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-follow]"); if (!b) return;
      e.preventDefault(); b.disabled = true;
      const kind = b.dataset.follow, val = b.dataset.val, on = await toggle(kind, val);
      b.disabled = false; paint();
      C.toast(on ? (kind === "brand" ? T("Tu suis la marque") + " " + val : T("Tu suis cette voiture")) : T("Abonnement retiré"), "ok");
    });
  });
})();
