/**
 * MOTORAUTO — fiche voiture en onglets (Aperçu · Moteurs · Circuit · Photos) : un seul bloc visible à la fois.
 * Fonctionne après le rendu de la fiche : chaque section reçoit un onglet d'après son titre, sans toucher au contenu.
 */
(function () {
  "use strict";
  const TABS = [["apercu", "Aperçu"], ["moteurs", "Moteurs"], ["circuit", "Circuit"], ["photos", "Photos"]];
  const OF = [[/histoire|palmar|record|anecdote/i, "apercu"], [/motoris/i, "moteurs"], [/circuit|chrono/i, "circuit"], [/photo/i, "photos"]];
  const tabOf = (t) => { const r = OF.find(([re]) => re.test(t)); return r ? r[1] : "apercu"; };
  function build() {
    const body = document.querySelector("#vehicle-detail-content .sheet-core-body"); if (!body || body.dataset.tabbed) return;
    body.dataset.tabbed = "1"; body.classList.add("sheet-tabbed");
    let cur = null, count = {};
    Array.from(body.children).forEach((el) => {
      if (el.classList.contains("sheet-section-head")) cur = tabOf(el.textContent || "");
      if (cur) { el.setAttribute("data-tab", cur); count[cur] = (count[cur] || 0) + 1; }
    });
    const tabs = TABS.filter(([k]) => count[k]);
    const bar = document.createElement("div"); bar.className = "sheet-tabs"; bar.setAttribute("role", "tablist");
    bar.innerHTML = tabs.map(([k, l], i) => `<button type="button" role="tab" data-sheet-tab="${k}" aria-selected="${i === 0}">${l}</button>`).join("");
    const kp = body.querySelector(".sheet-kpis");
    (kp && kp.nextSibling ? body.insertBefore(bar, kp.nextSibling) : body.insertBefore(bar, body.firstChild));
    const show = (k) => {
      body.querySelectorAll("[data-tab]").forEach((e) => e.classList.toggle("tab-on", e.dataset.tab === k));
      bar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.sheetTab === k)));
    };
    bar.addEventListener("click", (e) => { const b = e.target.closest("[data-sheet-tab]"); if (b) show(b.dataset.sheetTab); });
    show(tabs.length ? tabs[0][0] : "apercu");
  }
  document.addEventListener("ma:car-rendered", () => setTimeout(build, 0));
})();
