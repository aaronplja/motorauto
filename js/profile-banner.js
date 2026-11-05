/**
 * MOTORAUTO — bannière du profil : choisir l'une de ses voitures (celles ajoutées dans « Mes voitures »).
 * La photo choisie remplit simplement le champ « Photo de la voiture » ; elle est enregistrée avec le bouton habituel,
 * et s'affiche en bannière sur le profil public. Aucune règle Firestore à changer.
 */
(function () {
  "use strict";
  let C = null, loadedFor = "", list = [];
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  async function load() {
    if (!C || !C.user) return [];
    if (loadedFor === C.user.uid) return list;
    try {
      const s = await C.db.collection("community_cars").where("uid", "==", C.user.uid).get();
      list = s.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      loadedFor = C.user.uid;
    } catch (_) { list = []; }
    return list;
  }
  function paint() {
    const input = $("settings-car-photo"); if (!input || !input.offsetParent) return;
    const anchor = input.closest(".form-grid"); if (!anchor) return;
    let box = $("banner-picker");
    if (!box) { box = document.createElement("div"); box.id = "banner-picker"; box.className = "bp"; anchor.parentNode.insertBefore(box, anchor.nextSibling);
      box.addEventListener("click", (e) => { const b = e.target.closest("[data-bp]"); if (!b) return; pick(b.dataset.bp); }); }
    const cur = input.value.trim();
    const items = [];
    list.forEach((c) => (c.photos || []).filter((u) => C.safeUrl(u)).forEach((u) => items.push({ u, name: c.name || T("Voiture") })));
    const sig = items.map((i) => i.u).join("|") + "#" + cur; if (box.dataset.s === sig) return; box.dataset.s = sig;
    box.innerHTML = `<div class="bp-h"><b>${T("Bannière du profil")}</b><small>${T("Choisis une photo parmi mes voitures")}</small></div>` +
      (items.length ? `<div class="bp-row">${items.map((i) => `<button type="button" class="bp-it${i.u === cur ? " on" : ""}" data-bp="${esc(i.u)}" aria-pressed="${i.u === cur}" title="${esc(i.name)}"><img src="${esc(C.safeUrl(i.u))}" alt="" loading="lazy" decoding="async"><span>${esc(i.name)}</span></button>`).join("")}</div>`
        : `<p class="bp-empty">${T("Ajoute d'abord une voiture avec photo dans « Mes voitures » pour la choisir ici.")}</p>`);
  }
  function pick(u) {
    const input = $("settings-car-photo"); if (!input) return;
    input.value = u; input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true }));
    const pv = $("settings-car-preview"); if (pv) pv.src = C.safeUrl(u) || pv.src;
    const b = $("banner-picker"); if (b) b.dataset.s = ""; paint();
    C.toast(T("Bannière choisie : pense à enregistrer ton profil."), "ok");
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    setInterval(async () => { const i = $("settings-car-photo"); if (!i || !i.offsetParent || !C.user) return; await load(); paint(); }, 1200);
    document.addEventListener("ma:cars-changed", () => { loadedFor = ""; });
  });
})();
