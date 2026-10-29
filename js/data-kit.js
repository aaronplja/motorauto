/**
 * MOTORAUTO — outils de rédaction des fiches volumineuses (Alfa Romeo, Audi, Le Mans).
 * Chargé AVANT data-alfa.js, data-audi.js et data-lemans.js. Écrit des objets au même format que data.js / data2.js,
 * enrichis des champs : history (biographie), anecdotes [{title,text}], related (ids de fiches liées), approx (chiffres indicatifs).
 *   E(nom, puissance ch, couple Nm, vitesse km/h, 0-100 s, transmission, code moteur, note)
 *   P(nom de la phase, détails, [moteurs], [éditions notables])
 *   C(id, marque, modèle, catégorie, années, description, [phases], { h: histoire, a: [[titre, texte]], r: [[type, texte]], rel: [ids], approx: true })
 * Les chiffres des voitures de course et des modèles anciens sont des valeurs de référence arrondies (approx : true) :
 * elles sont signalées comme indicatives sur la fiche.
 */
const MAKIT = (function () {
  "use strict";
  const E = (name, power, torque, speed, zero, trans, code, info) => ({ name, power: power || 0, torque: torque || 0, speed: speed || 0, zeroToHundred: zero || 0, transmission: trans || "—", code: code || "", info: info || "" });
  const P = (phaseName, details, engines, notableEditions) => ({ phaseName, details: details || "", engines: engines || [], notableEditions: notableEditions || [] });
  function C(id, brand, model, category, years, description, phases, x) {
    x = x || {};
    return {
      id, brand, model, category, years, description, image: "img/" + id + ".jpg", phases,
      records: (x.r || []).map((r) => ({ type: r[0], description: r[1] })), userRecords: [],
      history: x.h || "", anecdotes: (x.a || []).map((a) => ({ title: a[0], text: a[1] })),
      related: x.rel || [], approx: !!x.approx
    };
  }
  function push(list) {
    if (typeof MOTORAUTO_DATABASE !== "undefined") MOTORAUTO_DATABASE.push(...list);
    return list;
  }
  /**
   * Complète des fiches existantes (déjà dans MOTORAUTO_DATABASE) sans les réécrire.
   *   enrich({ id: { h: "histoire", a: [[titre, texte]], r: [[type, texte]], e: [[couple, vmax, 0-100], …], ap: true } })
   * h remplace l'histoire ; a et r s'ajoutent (sans doublon) ; e est aligné sur les moteurs dans l'ordre des phases
   * et ne remplit que les valeurs absentes (null / 0 = on ne touche pas) ; ap marque les chiffres comme indicatifs.
   */
  function enrich(map) {
    if (typeof MOTORAUTO_DATABASE === "undefined") return;
    const byId = new Map(MOTORAUTO_DATABASE.map((c) => [c.id, c]));
    Object.keys(map).forEach((id) => {
      const c = byId.get(id), x = map[id];
      if (!c) { if (typeof console !== "undefined") console.warn("enrich : fiche inconnue", id); return; }
      if (x.h) c.history = x.h;
      if (x.a) { c.anecdotes = c.anecdotes || []; x.a.forEach((a) => { if (!c.anecdotes.some((o) => o.title === a[0])) c.anecdotes.push({ title: a[0], text: a[1] }); }); }
      if (x.r) { c.records = c.records || []; x.r.forEach((r) => { if (!c.records.some((o) => o.description === r[1])) c.records.push({ type: r[0], description: r[1] }); }); }
      if (x.rel) c.related = Array.from(new Set((c.related || []).concat(x.rel)));
      if (x.e) {
        const engs = (c.phases || []).reduce((a, p) => a.concat(p.engines || []), []);
        x.e.forEach((v, i) => {
          const en = engs[i]; if (!en || !v) return;
          if (v[0] && !en.torque) en.torque = v[0];
          if (v[1] && !en.speed) en.speed = v[1];
          if (v[2] && !en.zeroToHundred) en.zeroToHundred = v[2];
        });
      }
      if (x.ap) c.approx = true;
    });
  }
  return { E, P, C, push, enrich };
})();
