/**
 * MOTORAUTO — éditeur de véhicule (admin) en 3 étapes : 1 Identité · 2 Moteurs · 3 Technique & circuit.
 * On ne déplace aucun champ : chaque bloc reçoit seulement un numéro d'étape, la barre du haut affiche l'étape active.
 */
(function () {
  "use strict";
  const STEPS = [["1", "Identité"], ["2", "Moteurs"], ["3", "Technique & circuit"]];
  let cur = 1, form = null, bar = null, prev = null, next = null, submit = null;
  const map = [
    [".form-grid, .adm-photos, div.input-stack:has(#adm-related)", 1],
    ["div.input-stack:has(#adm-desc)", 1],
    [".admin-engines-head, #admin-engines-container, #adm-phase-list", 2],
    [".adm-track, div.input-stack:has(#adm-history), div.input-stack:has(#adm-anecdotes), div.input-stack:has(#adm-archives), div.input-stack:has(#adm-records)", 3]
  ];
  function tag() {
    form.querySelectorAll("[data-step]").forEach((e) => e.removeAttribute("data-step"));
    map.forEach(([sel, n]) => { try { form.querySelectorAll(":scope > " + sel.split(",").map((x) => x.trim()).join(", :scope > ")).forEach((e) => e.setAttribute("data-step", n)); } catch (_) { /* sélecteur non supporté */ } });
    // description : un cran après la photo, dans l'identité
    form.querySelectorAll(":scope > .input-stack").forEach((e) => { if (!e.dataset.step && e.querySelector("#adm-desc")) e.setAttribute("data-step", 1); });
  }
  function show(n) {
    cur = Math.max(1, Math.min(3, n));
    form.querySelectorAll("[data-step]").forEach((e) => e.classList.toggle("step-on", Number(e.dataset.step) === cur));
    bar.querySelectorAll("button").forEach((b) => { const on = Number(b.dataset.go) === cur; b.setAttribute("aria-current", on ? "step" : "false"); b.classList.toggle("on", on); });
    prev.hidden = cur === 1; next.hidden = cur === 3; submit.hidden = cur !== 3;
    const body = form.closest(".dialog-body, .modal-dialog"); if (body && body.scrollTo) body.scrollTo({ top: 0 });
  }
  function build() {
    form = document.getElementById("admin-car-form"); if (!form || form.dataset.steps) return;
    form.dataset.steps = "1"; form.classList.add("adm-steps");
    bar = document.createElement("div"); bar.className = "adm-stepbar"; bar.setAttribute("role", "tablist");
    bar.innerHTML = STEPS.map(([n, l]) => `<button type="button" role="tab" data-go="${n}"><b>${n}</b><span>${l}</span></button>`).join("");
    form.insertBefore(bar, form.firstChild);
    submit = form.querySelector('button[type="submit"]');
    const nav = document.createElement("div"); nav.className = "adm-stepnav";
    prev = document.createElement("button"); prev.type = "button"; prev.className = "cta-btn btn-ghost"; prev.textContent = "← Précédent";
    next = document.createElement("button"); next.type = "button"; next.className = "cta-btn fill-btn"; next.textContent = "Suivant →";
    submit.parentNode.insertBefore(nav, submit); nav.append(prev, next, submit);
    bar.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) show(Number(b.dataset.go)); });
    prev.addEventListener("click", () => show(cur - 1)); next.addEventListener("click", () => show(cur + 1));
    form.addEventListener("invalid", () => show(1), true);
    tag(); show(1);
    const modal = document.getElementById("admin-modal");
    if (modal) new MutationObserver(() => { if (modal.classList.contains("open") || modal.getAttribute("aria-hidden") === "false") { tag(); show(1); } }).observe(modal, { attributes: true, attributeFilter: ["class", "aria-hidden"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
