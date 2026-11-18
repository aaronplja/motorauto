/**
 * MOTORAUTO — écouteur de clic central (DEL-107).
 * Plus de 130 modules posent chacun leur propre écouteur « click » sur le document. Ce petit module, chargé en premier,
 * les regroupe derrière UN SEUL écouteur natif : même ordre d'exécution, mêmes arguments, mêmes erreurs isolées
 * (une erreur dans un module n'empêche pas les suivants). Les écouteurs avec options (capture, once, passive) restent natifs.
 */
(function () {
  "use strict";
  const doc = document;
  if (doc.__maClickHub) return;
  const nativeAdd = doc.addEventListener, nativeRemove = doc.removeEventListener;
  const list = []; let installed = false;

  function dispatch(e) {
    const snap = list.slice();                       // un écouteur ajouté pendant le clic ne tourne qu'au clic suivant, comme en natif
    let stopped = false;
    const orig = e.stopImmediatePropagation;
    e.stopImmediatePropagation = function () { stopped = true; return orig.apply(this, arguments); };
    try {
      for (let i = 0; i < snap.length && !stopped; i++) {
        const fn = snap[i]; if (list.indexOf(fn) < 0) continue;   // retiré entre-temps
        try { typeof fn === "function" ? fn.call(doc, e) : fn.handleEvent(e); }
        catch (err) { setTimeout(() => { throw err; }); }          // rapporté sans bloquer les autres
      }
    } finally { delete e.stopImmediatePropagation; }
  }
  const plain = (o) => o === undefined || o === false;
  doc.addEventListener = function (type, fn, opts) {
    if (type === "click" && plain(opts) && fn && (typeof fn === "function" || typeof fn.handleEvent === "function")) {
      if (list.indexOf(fn) < 0) list.push(fn);
      if (!installed) { installed = true; nativeAdd.call(doc, "click", dispatch); }
      return;
    }
    return nativeAdd.apply(doc, arguments);
  };
  doc.removeEventListener = function (type, fn, opts) {
    if (type === "click" && plain(opts)) { const i = list.indexOf(fn); if (i >= 0) { list.splice(i, 1); return; } }
    return nativeRemove.apply(doc, arguments);
  };
  Object.defineProperty(doc, "__maClickHub", { value: { size: () => list.length } });
})();
