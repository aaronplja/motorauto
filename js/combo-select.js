/**
 * MOTORAUTO — liste déroulante avec recherche pour un <select> (le <select> reste la source de vérité).
 * window.MAComboSelect.enhance(select) / .refresh(select). Aussi : remplit <datalist id="circuit-names"> avec les circuits du monde.
 */
(function () {
  "use strict";
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MAX = 80;

  function enhance(select) {
    if (!select || select._combo) return select && select._combo;
    const wrap = document.createElement("div"); wrap.className = "combo";
    const input = document.createElement("input");
    input.type = "search"; input.className = "combo-input"; input.autocomplete = "off"; input.setAttribute("role", "combobox");
    input.setAttribute("aria-expanded", "false"); input.setAttribute("aria-label", select.getAttribute("aria-label") || "Rechercher");
    input.placeholder = "Rechercher un circuit…";
    const pop = document.createElement("div"); pop.className = "combo-pop"; pop.hidden = true; pop.setAttribute("role", "listbox");
    select.parentNode.insertBefore(wrap, select); wrap.append(input, pop, select); select.hidden = true; select.style.display = "none";
    let active = -1;

    const options = () => Array.from(select.options).filter((o) => o.value);
    const label = (o) => o.textContent;
    const sync = () => { const o = select.selectedOptions[0]; input.value = o && o.value ? label(o).replace(/ — aucun chrono$/, "") : ""; };
    function draw() {
      const q = norm(input.dataset.typing === "1" ? input.value : "").trim();
      const all = options().filter((o) => !q || norm(o.textContent).includes(q));
      const shown = all.slice(0, MAX); active = shown.length ? 0 : -1;
      pop.innerHTML = shown.length
        ? shown.map((o, i) => `<button type="button" role="option" class="combo-opt${o.dataset.none ? " none" : ""}${i === 0 ? " on" : ""}" data-v="${esc(o.value)}">${esc(label(o).replace(/ — aucun chrono$/, ""))}${o.dataset.none ? `<small>aucun chrono</small>` : ""}</button>`).join("") + (all.length > MAX ? `<div class="combo-more">${all.length - MAX} autres… précise ta recherche</div>` : "")
        : `<div class="combo-more">Aucun circuit ne correspond</div>`;
    }
    const open = () => { draw(); pop.hidden = false; input.setAttribute("aria-expanded", "true"); };
    const close = () => { pop.hidden = true; input.setAttribute("aria-expanded", "false"); input.dataset.typing = "0"; sync(); };
    function pick(v) { select.value = v; select.dispatchEvent(new Event("change", { bubbles: true })); close(); input.blur(); }
    function move(d) {
      const items = pop.querySelectorAll(".combo-opt"); if (!items.length) return;
      items[active] && items[active].classList.remove("on"); active = (active + d + items.length) % items.length;
      items[active].classList.add("on"); items[active].scrollIntoView({ block: "nearest" });
    }
    input.addEventListener("focus", () => { input.select(); open(); });
    input.addEventListener("input", () => { input.dataset.typing = "1"; open(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); if (pop.hidden) open(); else move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); const it = pop.querySelectorAll(".combo-opt")[active]; if (it) pick(it.dataset.v); }
      else if (e.key === "Escape") { close(); input.blur(); }
    });
    pop.addEventListener("mousedown", (e) => e.preventDefault());           // garde le focus pendant le clic
    pop.addEventListener("click", (e) => { const b = e.target.closest(".combo-opt"); if (b) pick(b.dataset.v); });
    input.addEventListener("blur", () => setTimeout(close, 120));
    select._combo = { sync };
    sync(); return select._combo;
  }
  function refresh(select) { const c = enhance(select); if (c) c.sync(); }

  function fillDatalist() {
    const m = window.MACircuits; if (!m || document.getElementById("circuit-names")) return;
    const dl = document.createElement("datalist"); dl.id = "circuit-names";
    dl.innerHTML = m.list.map((c) => `<option value="${esc(c.name)}">${esc(c.country)}</option>`).join("");
    document.body.appendChild(dl);
  }
  fillDatalist();
  window.MAComboSelect = { enhance, refresh };
  const start = () => { const s = document.getElementById("leaderboard-track-select"); if (s) enhance(s); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
