/* Menus déroulants : <details class="acc" data-acc="clé"> dont l'état (ouvert / fermé) est retenu par appareil.
   - MAAcc.open(clé, défaut) : l'état retenu ; MAAcc.o(clé, titre, résumé, défaut, classes) + MAAcc.c : balises d'ouverture / de fermeture
     pour le contenu généré en JS ; MAAcc.apply(racine) : restaure l'état des menus déjà présents dans la page. */
(function () {
  "use strict";
  var K = "ma_acc_";
  function get(key, def) { try { var v = localStorage.getItem(K + key); return v === null ? !!def : v === "1"; } catch (_) { return !!def; } }
  function set(key, on) { try { localStorage.setItem(K + key, on ? "1" : "0"); } catch (_) { /* stockage indisponible */ } }
  var CHEV = '<svg class="acc-chev" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  /** balise d'ouverture : titre et résumé sont du HTML déjà échappé par l'appelant */
  function o(key, title, sum, def, cls, label, attrs) {
    return '<details class="acc ' + (cls || "") + '" data-acc="' + key + '"' + (attrs ? " " + attrs : "") + (label ? ' aria-label="' + label + '"' : "") + (get(key, def) ? " open" : "") + '><summary><span class="acc-t"><b>' + title + "</b>" + (sum ? "<small>" + sum + "</small>" : "") + "</span>" + CHEV + '</summary><div class="acc-body">';
  }
  function apply(root) {
    (root || document).querySelectorAll("details.acc[data-acc]").forEach(function (d) { d.open = get(d.getAttribute("data-acc"), d.hasAttribute("open")); });
  }
  document.addEventListener("toggle", function (e) {
    var d = e.target; if (d && d.matches && d.matches("details.acc[data-acc]")) { if (d.dataset.accQuiet) { delete d.dataset.accQuiet; return; } set(d.getAttribute("data-acc"), d.open); }
  }, true);
  /** animation d'ouverture / de fermeture : hauteur + fondu du contenu (désactivée si l'appareil réduit les animations) */
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function frame(h, pt, pb, op) { return { height: h + "px", paddingTop: pt + "px", paddingBottom: pb + "px", opacity: op }; }
  document.addEventListener("click", function (e) {
    var sm = e.target && e.target.closest ? e.target.closest("details.acc > summary") : null;
    if (!sm || e.defaultPrevented || !window.Element.prototype.animate || (reduce && reduce.matches)) return;
    var d = sm.parentNode, body = d.querySelector(":scope > .acc-body");
    if (!body || getComputedStyle(sm).pointerEvents === "none") return;
    e.preventDefault();
    if (d._accAnim) { d._accAnim.cancel(); d._accAnim = null; }
    var opening = !d.open;
    if (opening) d.open = true;
    var cs = getComputedStyle(body), h = body.getBoundingClientRect().height, pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
    var from = opening ? frame(0, 0, 0, 0) : frame(h, pt, pb, 1), to = opening ? frame(h, pt, pb, 1) : frame(0, 0, 0, 0);
    body.style.overflow = "hidden"; body.style.boxSizing = "border-box";
    if (!opening) d.classList.add("acc-closing");
    var a = body.animate([from, to], { duration: opening ? 260 : 220, easing: "cubic-bezier(.3,.7,.2,1)" });
    d._accAnim = a;
    var end = function () {
      if (d._accAnim !== a) return;
      d._accAnim = null; body.style.overflow = ""; body.style.boxSizing = ""; d.classList.remove("acc-closing");
      if (!opening) d.open = false;
    };
    a.onfinish = end; a.oncancel = function () { if (d._accAnim === a) { d._accAnim = null; body.style.overflow = ""; body.style.boxSizing = ""; d.classList.remove("acc-closing"); } };
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { apply(); }); else apply();
  /** ouvre / ferme sans retenir le choix (état par défaut posé par le site, pas par le pilote) */
  function quiet(d, on) { if (d.open === !!on) return; d.dataset.accQuiet = "1"; d.open = !!on; }
  var api = { open: get, o: o, c: "</div></details>", apply: apply, quiet: quiet };
  window.MA.register("Acc", api);
})();
