/**
 * MOTORAUTO — moteurs : page d'un moteur (toutes les voitures qui le partagent), sélecteur « moteur existant »
 * pour l'éditeur de véhicule, et « Ajouter ce moteur à une voiture » (admin).
 */
(function () {
  "use strict";
  const MAU = window.MA;
  let C = null, index = null, indexFor = null;

  function engines() {
    if (!index || indexFor !== C.cars) { index = MAU.buildEngineIndex(C.cars); indexFor = C.cars; }
    return index;
  }
  const $ = (id) => document.getElementById(id);
  const best = (it) => it.variants.slice().sort((a, b) => b.power - a.power)[0];
  const fmtSpecs = (e) => [e.power ? e.power + " ch" : "", e.torque ? e.torque + " Nm" : "", e.speed ? e.speed + " km/h" : "", e.zeroToHundred ? "0-100 : " + e.zeroToHundred + " s" : ""].filter(Boolean).join(" · ");

  // ---------------------------------------------------------------- page d'un moteur
  function render(params) {
    const root = $("engine-root"); if (!root) return;
    const it = engines().get(params.key);
    if (!it) { root.innerHTML = `<div class="empty-note">Ce moteur n'existe pas dans le catalogue. <a href="#/catalogue">Retour au catalogue</a></div>`; return; }
    const esc = C.esc, ids = new Set(), cars = [];
    it.cars.forEach((x) => { if (!ids.has(x.car.id)) { ids.add(x.car.id); cars.push(x.car); } });
    const b = best(it);
    document.title = (it.code || it.label) + " | MOTORAUTO";
    root.innerHTML = `
      <header class="page-head"><div class="page-head-text">
        <span class="status-tag-verified">Moteur${it.code ? " · " + esc(it.code) : ""}</span>
        <h1 class="page-title">${esc(it.label)}</h1>
        <p class="page-sub">${cars.length} voiture${cars.length > 1 ? "s" : ""} du catalogue ${cars.length > 1 ? "partagent" : "utilise"} ce moteur${b ? " · jusqu'à " + b.power + " ch" : ""}.</p>
      </div>
      ${C.isAdmin ? `<div class="page-head-actions"><button type="button" class="cta-btn fill-btn compact-btn" id="engine-add-open">Ajouter ce moteur à une voiture</button></div>` : ""}</header>
      ${it.variants.length > 1 ? `<div class="sheet-section-head">Déclinaisons de puissance</div><div class="engine-variants">${it.variants.map((v) => `<div class="engine-variant"><b>${esc(v.name)}</b><span>${esc(fmtSpecs(v))}</span></div>`).join("")}</div>` : ""}
      ${b && b.info ? `<p class="phase-details">${esc(b.info)}</p>` : ""}
      <div class="sheet-section-head">Voitures équipées de ce moteur</div>
      <div class="engine-cars">${it.cars.map((x) => `
        <a class="engine-car" href="#/voiture/${encodeURIComponent(x.car.id)}">
          <img src="${esc(C.safeUrl(x.car.image) || "")}" alt="" loading="lazy" data-fallback="car">
          <span><small>${esc(x.car.brand)} · ${esc(x.phase.phaseName)}</small><b>${esc(x.car.model)}</b><em>${esc(fmtSpecs(x.engine))}</em></span>
        </a>`).join("")}</div>`;
    const add = $("engine-add-open"); if (add) add.onclick = () => openAdd(it);
    if (window.MAIcons) window.MAIcons.apply(root);
  }

  // ---------------------------------------------------------------- sélecteur de moteur (éditeur de véhicule)
  let pickCb = null;
  function pick(cb) {
    pickCb = cb; $("engine-picker-q").value = ""; drawPicker(); C.openModal($("engine-picker-modal"));
    setTimeout(() => $("engine-picker-q").focus(), 80);
  }
  function drawPicker() {
    const q = $("engine-picker-q").value, list = $("engine-picker-list"), esc = C.esc;
    const all = Array.from(engines().values()).filter((it) => !q.trim() || C.normalize([it.label, it.code, it.variants.map((v) => v.name).join(" ")].join(" ")).includes(C.normalize(q)));
    list.innerHTML = all.slice(0, 40).map((it) => `
      <button type="button" class="engine-pick" data-key="${esc(it.key)}">
        <b>${esc(it.label)}</b><small>${esc(fmtSpecs(best(it)))} · ${new Set(it.cars.map((x) => x.car.id)).size} voiture(s)</small>
      </button>`).join("") || `<div class="empty-note">Aucun moteur ne correspond.</div>`;
  }
  document.addEventListener("input", (e) => { if (e.target.id === "engine-picker-q") drawPicker(); if (e.target.id === "engine-add-q") drawAddCars(); });
  document.addEventListener("click", (e) => {
    const p = e.target.closest && e.target.closest(".engine-pick");
    if (p && pickCb) {
      const it = engines().get(p.dataset.key), v = it && best(it);
      if (v) pickCb(v); C.closeModal($("engine-picker-modal")); pickCb = null;
    }
    const c = e.target.closest && e.target.closest(".engine-add-car");
    if (c) chooseCar(c.dataset.id);
  });

  // ---------------------------------------------------------------- admin : ajouter ce moteur à une voiture
  let addIt = null, addCarId = null;
  function openAdd(it) {
    addIt = it; addCarId = null;
    $("engine-add-sub").textContent = it.label; $("engine-add-q").value = ""; $("engine-add-error").textContent = "";
    $("engine-add-phase-box").hidden = true; $("engine-add-confirm").disabled = true;
    drawAddCars(); C.openModal($("engine-add-modal"));
  }
  function drawAddCars() {
    const q = $("engine-add-q").value, list = $("engine-add-list"), esc = C.esc;
    const cars = C.cars.filter((c) => !q.trim() || C.normalize(c.brand + " " + c.model).includes(C.normalize(q))).slice(0, 30);
    list.innerHTML = cars.map((c) => `<button type="button" class="engine-pick engine-add-car${c.id === addCarId ? " on" : ""}" data-id="${esc(c.id)}"><b>${esc(c.brand)} ${esc(c.model)}</b><small>${esc(c.years)}</small></button>`).join("");
  }
  function chooseCar(id) {
    const car = C.carsById.get(id); if (!car) return;
    addCarId = id;
    $("engine-add-phase").innerHTML = car.phases.map((p, i) => `<option value="${i}">${C.esc(p.phaseName)}</option>`).join("");
    $("engine-add-phase-box").hidden = false; $("engine-add-confirm").disabled = false; drawAddCars();
  }
  function rawOf(car) {
    return { id: car.id, brand: car.brand, model: car.model, years: car.years, category: car.category, image: car.image, images: car.images, description: car.description,
      history: car.history || "", anecdotes: car.anecdotes || [], archives: car.archives || [], related: car.related || [], phases: car.phases, records: car.records, userRecords: car.userRecords || [] };
  }
  async function confirmAdd() {
    const err = $("engine-add-error"); err.textContent = "";
    const car = C.carsById.get(addCarId); if (!car || !addIt) return;
    const idx = Number($("engine-add-phase").value) || 0, v = best(addIt);
    if (car.phases[idx].engines.some((e) => MAU.engineKey(e) === addIt.key && e.name === v.name)) { err.textContent = "Cette voiture a déjà ce moteur dans cette phase."; return; }
    const raw = JSON.parse(JSON.stringify(rawOf(car)));
    raw.phases[idx].engines.push({ name: v.name, power: v.power, torque: v.torque, speed: v.speed, zeroToHundred: v.zeroToHundred, transmission: v.transmission, code: v.code || "", info: v.info || "" });
    try {
      await C.db.collection("motorauto_catalog").doc(car.id).set(raw);
      C.closeModal($("engine-add-modal")); C.toast("Moteur ajouté à " + car.brand + " " + car.model + ".", "ok");
      await window.MAApp.reloadCatalog(); index = null; render({ key: addIt.key });
    } catch (e) { err.textContent = "Erreur : " + e.message; }
  }
  document.addEventListener("click", (e) => { if (e.target.id === "engine-add-confirm") confirmAdd(); });
  document.addEventListener("click", (e) => {
    const m = { "close-engine-picker-modal": "engine-picker-modal", "close-engine-add-modal": "engine-add-modal" }[e.target.id];
    if (m) C.closeModal($(m));
  });

  window.MAEngines = { pick, render };
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.Router.register("engine", { enter: (p) => { ctx.catReady.then(() => render(p)).catch(() => render(p)); } });
  });
})();
