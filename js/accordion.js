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
    var d = e.target; if (d && d.matches && d.matches("details.acc[data-acc]")) set(d.getAttribute("data-acc"), d.open);
  }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { apply(); }); else apply();
  var api = { open: get, o: o, c: "</div></details>", apply: apply };
  window.MA.register("Acc", api);
})();
