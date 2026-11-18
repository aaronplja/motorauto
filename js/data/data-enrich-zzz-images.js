/** MOTORAUTO — photos trouvées automatiquement (généré par scripts/fetch-images.js : ne pas modifier à la main).
 *  Sources et licences : img/auto/credits.json. Ne touche qu'aux voitures listées ci-dessous. */
(function () {
  "use strict";
  if (typeof MOTORAUTO_DATABASE === "undefined") return;
  const M = {};
  MOTORAUTO_DATABASE.forEach((c) => {
    const m = M[c.id]; if (!m) return;
    c.image = m[0]; c.images = [m[0]].concat((c.images || []).filter((x) => x !== m[0] && !/^img\/auto\//.test(x))); c.imageCredit = m[1];
  });
})();
