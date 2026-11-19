/**
 * MOTORAUTO — fiche voiture en menus déroulants : les chiffres clés et les boutons restent en haut, chaque section
 * (Histoire, Motorisations, Palmarès, Anecdotes, Photos, Avis, Chrono…) devient un menu qui se déplie à la demande.
 * Fonctionne après le rendu de la fiche, sans toucher au contenu : les sections sont seulement regroupées.
 * Seule la première section est ouverte au départ ; l'état de chaque menu est retenu (MAAcc).
 */
(function () {
  "use strict";
  const slug = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const T = (s) => (window.MAI18n && window.MAI18n.t ? window.MAI18n.t(s) : s);
  function titleOf(el) {
    if (el.classList.contains("sheet-section-head")) return el.textContent.trim();
    const h = el.firstElementChild;
    if (h && h.classList.contains("sheet-section-head")) return h.textContent.trim();
    if (el.classList.contains("fp-zone")) return T("Générations et rivales");
    return "";
  }
  function build() {
    const body = document.querySelector("#vehicle-detail-content .sheet-core-body"); if (!body || body.dataset.acc || !window.MAAcc) return;
    body.dataset.acc = "1";
    const groups = []; let cur = null;
    Array.from(body.children).forEach((el) => {
      const t = titleOf(el);
      if (t) { cur = { t, els: [] }; groups.push(cur); }
      if (cur) cur.els.push(el);
    });
    groups.forEach((g, i) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = window.MAAcc.o("fiche-" + slug(g.t), esc(g.t), "", i === 0, "fiche-acc") + window.MAAcc.c;
      const det = wrap.firstElementChild, inner = det.querySelector(".acc-body");
      g.els[0].before(det);
      g.els.forEach((e) => inner.appendChild(e));
    });
  }
  document.addEventListener("ma:car-rendered", () => setTimeout(build, 0));
})();
