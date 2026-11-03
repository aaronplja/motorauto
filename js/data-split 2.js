/**
 * MOTORAUTO — Une fiche par voiture.
 * Chargé APRÈS tous les fichiers de données de marques. Les fiches regroupant plusieurs modèles différents (ex. « 106 Maxi / AX Sport / Visa »)
 * sont scindées en autant de fiches que de voitures. Les Renault restent volontairement regroupées. La première fiche garde l'id d'origine
 * (les cartes déjà obtenues par les joueurs restent valides) ; les liens « voir aussi » existants continuent de fonctionner.
 *   id d'origine : [ { id (null = on garde l'id d'origine), model, y (années), brand?, cat?, tok (mot-clé pour répartir texte/anecdotes),
 *                      ph : [ n° de phase | [n° de phase, [indices ou /regex/ des moteurs gardés]] ], d? description, h? histoire } ]
 */
(function () {
  "use strict";
  if (typeof MOTORAUTO_DATABASE === "undefined") return;
  const S = {
    "rally-fiat-124-abarth": [
      { id: null, model: "124 Abarth Rally", y: "1972 - 1975", tok: "124", ph: [0] },
      { id: "rally-fiat-131-abarth", model: "131 Abarth Rally", y: "1976 - 1981", tok: "131", ph: [1] }],
    "rally-opel-ascona-400": [
      { id: null, model: "Ascona 400 (Groupe B)", tok: "Ascona", ph: [0] },
      { id: "rally-opel-manta-400", model: "Manta 400 (Groupe B)", tok: "Manta", ph: [0] }],
    "rally-peugeot-405-t16": [
      { id: null, model: "405 T16 Grand Raid", y: "1989 - 1990", tok: "405", ph: [[0, [1]]] },
      { id: "rally-peugeot-205-t16-gr", model: "205 T16 Grand Raid", y: "1987 - 1988", tok: "205", ph: [[0, [0]]] }],
    "rally-porsche-959-dakar": [
      { id: null, model: "959 Paris-Dakar", y: "1986", tok: "959", ph: [0] },
      { id: "rally-porsche-953-dakar", model: "953 Paris-Dakar", y: "1984", tok: "953", ph: [0] }],
    "rally-galant-vr4": [
      { id: null, model: "Galant VR-4", tok: "Galant", ph: [0] },
      { id: "rally-mitsubishi-lancer-wrc", model: "Lancer WRC", tok: "Lancer", ph: [1] },
      { id: "rally-mitsubishi-pajero-dakar", model: "Pajero Dakar", cat: "Break", tok: "Pajero", ph: [2] }],
    "rally-corolla-wrc": [
      { id: null, model: "Corolla WRC", tok: "Corolla", ph: [0] },
      { id: "rally-yaris-wrc", model: "Yaris WRC", tok: "Yaris", ph: [1] },
      { id: "rally-gr-yaris-rally1", model: "GR Yaris Rally1", tok: "Rally1", ph: [2] }],
    "rally-gr-yaris": [
      { id: null, model: "GR Yaris (route)", tok: "GR Yaris", ph: [[0, [0, 1]]] },
      { id: "rally-gr-yaris-rally2", model: "GR Yaris Rally2", tok: "Rally2", ph: [[0, [2]]] },
      { id: "rally-gr-corolla", model: "GR Corolla", tok: "Corolla", ph: [[0, [3]]] }],
    "rally-fiesta-wrc": [
      { id: null, model: "Fiesta RS WRC", y: "2011 - 2016", tok: "Fiesta", ph: [0] },
      { id: "rally-fiesta-wrc-2017", model: "Fiesta WRC", y: "2017 - 2021", tok: "Fiesta", ph: [1] },
      { id: "rally-puma-rally1", model: "Puma Rally1", tok: "Puma", ph: [2] }],
    "rally-accent-wrc": [
      { id: null, model: "Accent WRC", tok: "Accent", ph: [0] },
      { id: "rally-i20-wrc", model: "i20 WRC", tok: "i20 WRC", ph: [1] },
      { id: "rally-i20-n-rally1", model: "i20 N Rally1", tok: "Rally1", ph: [2] }],
    "rally-fabia-wrc": [
      { id: null, model: "Octavia WRC", y: "1999 - 2003", tok: "Octavia", ph: [[0, [0]]] },
      { id: "rally-fabia-r5", model: "Fabia R5 / Rally2 evo", tok: "R5", ph: [1] }],
    "rally-c4-wrc": [
      { id: null, model: "C4 WRC", tok: "C4", ph: [0] },
      { id: "rally-ds3-wrc", model: "DS3 WRC", tok: "DS3", ph: [1] },
      { id: "rally-c3-wrc", model: "C3 WRC", tok: "C3", ph: [2] }],
    "rally-307-wrc": [{ id: null, model: "307 WRC", tok: "307", ph: [0] }],
    "rally-208-rally4": [
      { id: "rally-208-r2", model: "208 R2", tok: "R2", ph: [[0, [0]]] },
      { id: null, model: "208 Rally4", tok: "Rally4", ph: [[0, [1]]] },
      { id: "rally-208-r5", model: "208 R5", tok: "R5", ph: [[0, [2]]] },
      { id: "rally-208-t16-pikes-peak", model: "208 T16 Pikes Peak", cat: "Supercar", tok: "Pikes", ph: [[0, [3]]] },
      { id: "rally-208-rally2", model: "208 Rally2", tok: "Rally2", ph: [[0, [4]]] }],
    "rally-cordoba-wrc": [
      { id: "rally-ibiza-kit-car", model: "Ibiza Kit Car", tok: "Ibiza", ph: [[0, [0]]] },
      { id: null, model: "Córdoba WRC", tok: "Córdoba", ph: [[0, [1]]] }],
    "rally-polo-wrc": [
      { id: null, model: "Polo R WRC", tok: "Polo R", ph: [0] },
      { id: "rally-polo-gti-r5", model: "Polo GTI R5", tok: "R5", ph: [1] }],
    "rally-mini-wrc": [
      { id: null, model: "John Cooper Works WRC", tok: "WRC", ph: [0] },
      { id: "rally-mini-all4-racing", model: "Mini All4 Racing (Dakar)", cat: "Break", tok: "All4", ph: [1] }],
    "rally-hilux": [
      { id: null, model: "Hilux Dakar", tok: "Hilux", ph: [[0, [0]]] },
      { id: "rally-gr-dkr-hilux", model: "GR DKR Hilux T1+", tok: "GR DKR", ph: [[0, [1]]] }],
    "rally-c3-rally2": [
      { id: "rally-c2-s1600", model: "C2 S1600", y: "2005 - 2010", tok: "S1600", ph: [[0, [0]]] },
      { id: "rally-c2-r2", model: "C2 R2", y: "2005 - 2010", tok: "R2", ph: [[0, [1]]] },
      { id: "rally-ds3-r5", model: "DS3 R5", y: "2011 - 2016", tok: "DS3", ph: [[1, [0]]] },
      { id: null, model: "C3 Rally2", y: "2017 - 2024", tok: "C3", ph: [[1, [1]]] }],
    "rally-fiesta-r5": [
      { id: "rally-fiesta-r2t", model: "Fiesta R2T", tok: "R2", ph: [[0, [0]]] },
      { id: "rally-fiesta-rally4", model: "Fiesta Rally4", tok: "Rally4", ph: [[0, [1]]] },
      { id: "rally-fiesta-rally3", model: "Fiesta Rally3", tok: "Rally3", ph: [[0, [2]]] },
      { id: null, model: "Fiesta R5", tok: "R5", ph: [[0, [3]]] },
      { id: "rally-fiesta-rally2", model: "Fiesta Rally2", tok: "Rally2", ph: [[0, [4]]] }],
    "rally-i20-r5": [
      { id: null, model: "i20 R5", tok: "R5", ph: [[0, [0]]] },
      { id: "rally-i20-n-rally2", model: "i20 N Rally2", tok: "Rally2", ph: [[0, [1]]] }],
    "rally-opel-corsa-rally4": [
      { id: "rally-opel-adam-r2", model: "Adam R2", tok: "Adam", ph: [[0, [0]]] },
      { id: null, model: "Corsa Rally4", tok: "Rally4", ph: [[0, [1]]] },
      { id: "rally-opel-corsa-rally-e", model: "Corsa Rally Electric", tok: "Electric", ph: [[0, [2]]] }],
    "rally-kit-car-106-maxi": [
      { id: null, model: "106 Maxi (Kit Car)", y: "1994 - 1999", tok: "106", ph: [0] },
      { id: "rally-citroen-ax-sport", brand: "Citroën", model: "AX Sport", y: "1986 - 1990", tok: "AX", ph: [[1, [0]]] },
      { id: "rally-citroen-visa-mille-pistes", brand: "Citroën", model: "Visa Mille Pistes", y: "1982 - 1988", tok: "Visa", ph: [[1, [1, 2]]] }],
    "rally-puma-s1600": [
      { id: null, model: "Puma S1600", tok: "Puma", ph: [[0, [0]]] },
      { id: "rally-punto-s1600", brand: "Fiat", model: "Punto S1600", tok: "Punto", ph: [[0, [1]]] },
      { id: "rally-corsa-s1600", brand: "Opel", model: "Corsa S1600", tok: "Corsa", ph: [[0, [2]]] },
      { id: "rally-swift-s1600", brand: "Suzuki", model: "Swift S1600", tok: "Swift", ph: [[0, [3]]] }],
    "rally-s2000-punto": [
      { id: null, model: "Grande Punto S2000", tok: "Punto", ph: [0] },
      { id: "rally-abarth-124-rally", brand: "Abarth", model: "124 Rally", tok: "124", ph: [1] }],
    "rally-lancer-evo-r4": [
      { id: null, model: "Lancer Evolution IX R4", tok: "IX", ph: [[0, [0]]] },
      { id: "rally-lancer-evo-x-r4", model: "Lancer Evolution X R4", tok: "X R4", ph: [[0, [1]]] }],
    "rally-3008-dkr": [
      { id: "rally-2008-dkr", model: "2008 DKR", y: "2015 - 2016", cat: "Break", tok: "2008", ph: [[0, [0]]] },
      { id: null, model: "3008 DKR Maxi", y: "2017 - 2018", cat: "Break", tok: "3008", ph: [[0, [1]]] }],
    "rally-dacia-sandrider": [{ id: null, model: "Sandrider", tok: "Sandrider", ph: [0] }],
    "rally-xraid-hunter": [{ id: null, model: "Hunter T1+", tok: "Hunter", ph: [0] }],
    "rally-ford-raptor-t1": [{ id: null, model: "Ranger Raptor T1+", tok: "Raptor", ph: [0] }],
    "rally-race-touareg": [{ id: null, model: "Race Touareg 2", tok: "Touareg", ph: [0] }],
    "rally-citroen-ds-monte": [
      { id: "rally-citroen-id-19", model: "ID 19", y: "1957 - 1969", tok: "ID 19", ph: [[0, [0]]] },
      { id: null, model: "DS 21 (Monte-Carlo 1966)", y: "1965 - 1973", tok: "DS 21", ph: [[0, [1]]] },
      { id: "rally-citroen-ds-23", model: "DS 23 Injection", y: "1972 - 1975", tok: "DS 23", ph: [[0, [2]]] },
      { id: "rally-citroen-sm", model: "SM Maserati (rallye du Maroc)", cat: "Coupé", y: "1970 - 1974", tok: "SM", ph: [[0, [3]]] }],
    "rally-datsun-240z-safari": [
      { id: null, model: "240Z (Safari)", y: "1970 - 1973", tok: "240Z", ph: [[0, [0]]] },
      { id: "rally-datsun-violet-160j", cat: "Berline", model: "160J Violet", y: "1977 - 1982", tok: "Violet", ph: [[0, [1]]] }],
    "rally-porsche-911-rs": [
      { id: "rally-porsche-911-s-rallye", model: "911 S 2.0 Rallye", y: "1968 - 1971", tok: "911 S", ph: [[0, [0]]] },
      { id: null, model: "911 SC RS", y: "1984", tok: "SC RS", ph: [[0, [1]]] },
      { id: "rally-porsche-911-sc-safari", model: "911 SC Safari", tok: "Safari", ph: [[0, [2]]] }],
    "rally-saab-96": [{ id: null, model: "96 (2 temps, Monte-Carlo 850, V4)", tok: "96", ph: [0] }],
    "rally-volvo-544": [
      { id: null, model: "PV544", y: "1958 - 1965", tok: "544", ph: [[0, [0]]] },
      { id: "rally-volvo-amazon", model: "Amazon (122S)", y: "1961 - 1970", tok: "Amazon", ph: [[0, [1, 2]]] }],
    "rally-lancia-beta-monte-carlo": [{ id: null, model: "Beta Montecarlo (Groupe 5 Turbo)", tok: "Montecarlo", ph: [0] }],
    "alpine-a290": [
      { id: null, model: "A290", tok: "A290", ph: [0] },
      { id: "alpine-a390", model: "A390", tok: "A390", ph: [1] }],
    "mb-clk-gtr": [
      { id: null, model: "CLK GTR", tok: "GTR", ph: [0] },
      { id: "mb-clk-dtm", model: "CLK DTM AMG", tok: "DTM", ph: [1] }],
    "mb-ssk": [
      { id: null, model: "SSK", tok: "SSK", ph: [0] },
      { id: "mb-540k", model: "380 K / 500 K / 540 K", tok: "540", ph: [1] }],
    "mb-w125": [
      { id: null, model: "Flèche d'argent W125", y: "1937", tok: "W125", ph: [0] },
      { id: "mb-w196", model: "Flèche d'argent W196", tok: "W196", ph: [1] }],
    "mb-220-ponton": [
      { id: "mb-170v", model: "170 V", tok: "170", ph: [[0, [0]]] },
      { id: null, model: "220 « Ponton »", tok: "Ponton", ph: [[0, [1]]] },
      { id: "mb-300-adenauer", model: "300 « Adenauer »", tok: "Adenauer", ph: [[0, [2, 3]]] }],
    "mb-gla-glb": [
      { id: null, model: "GLA", tok: "GLA", ph: [[0, [0, 1, 2, 3, 5]]] },
      { id: "mb-glb", model: "GLB", tok: "GLB", ph: [[0, [4]]] },
      { id: "mb-eqa", model: "EQA", tok: "EQA", ph: [[0, [6]]] },
      { id: "mb-eqb", model: "EQB", tok: "EQB", ph: [[0, [7]]] }],
    "mb-glk-glc": [
      { id: "mb-glk", model: "GLK X204", y: "2008 - 2015", tok: "GLK", ph: [[0, [0, 1]]] },
      { id: null, model: "GLC X253 / GLC 63 AMG", y: "2015 - ...", tok: "GLC", ph: [[0, [2, 3, 4, 5, 6]]] }],
    "mb-gle": [
      { id: "mb-ml", model: "ML W163 / W164 / W166", tok: "ML", ph: [0] },
      { id: null, model: "GLE W166 / V167", tok: "GLE", ph: [1] }],
    "mb-maybach": [
      { id: "mb-maybach-57-62", model: "Maybach 57 / 62", tok: "Maybach", ph: [0] },
      { id: null, model: "Mercedes-Maybach S 600 / S 680", tok: "S 600", ph: [1] }],
    "bmw-x1-x2": [
      { id: null, model: "X1", tok: "X1", ph: [[0, [0, 1, 2, 3, 4]]] },
      { id: "bmw-ix1", model: "iX1", tok: "iX1", ph: [[0, [5]]] },
      { id: "bmw-ix2", model: "iX2", tok: "iX2", ph: [[0, [6]]] }],
    "bmw-ix": [
      { id: "bmw-ix3", model: "iX3", tok: "iX3", ph: [[0, [0]]] },
      { id: null, model: "iX / iX M60", tok: "iX", ph: [[0, [1, 2, 3]]] }],
    "bmw-3-csl-2023": [
      { id: null, model: "M4 CSL", tok: "CSL", ph: [[0, [0]]] },
      { id: "bmw-3-csl-hommage", model: "3.0 CSL Hommage", tok: "Hommage", ph: [[0, [1]]] }],
    "bmw-m6-gt3": [
      { id: null, model: "M6 GT3", tok: "M6", ph: [0] },
      { id: "bmw-m4-gt3", model: "M4 GT3", tok: "M4", ph: [1] }],
    "bmw-m3-f80": [
      { id: null, model: "M3 F80", y: "2014 - 2018", tok: "M3", ph: [[0, [0, 1, 2]]] },
      { id: "bmw-m4-f82", model: "M4 F82 / F83 (GTS, CS)", tok: "M4", ph: [0, 1] }],
    "bmw-m3-g80": [
      { id: null, model: "M3 G80 / M3 Touring G81", tok: "M3", ph: [[0, [0, 1, 2]]] },
      { id: "bmw-m4-g82", model: "M4 G82", tok: "M4", ph: [[0, [0, 1, 2]]] }]
  };
  const sentences = (t) => String(t || "").split(/(?<=[.!?])\s+/).filter(Boolean);
  const rx = (tok) => new RegExp("(^|[^A-Za-z0-9])" + String(tok).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![A-Za-z0-9])", "i");
  const byId = new Map(MOTORAUTO_DATABASE.map((c) => [c.id, c]));
  const out = [];
  MOTORAUTO_DATABASE.forEach((c) => {
    const spec = S[c.id];
    if (!spec) { out.push(c); return; }
    const ids = spec.map((s) => s.id || c.id);
    spec.forEach((s, i) => {
      const id = ids[i], re = rx(s.tok || s.model.split(" ")[0]);
      const phases = [];
      s.ph.forEach((p) => {
        const idx = Array.isArray(p) ? p[0] : p, src = c.phases[idx];
        if (!src) return;
        let engines = src.engines, name = src.phaseName;
        if (Array.isArray(p) && p[1]) { engines = p[1].map((k) => src.engines[k]).filter(Boolean); name = s.model + (s.y ? " (" + s.y + ")" : ""); }
        if (engines.length) phases.push(Object.assign({}, src, { phaseName: name, engines: engines.map((e) => Object.assign({}, e)), notableEditions: (src.notableEditions || []).filter((n) => re.test(n) || src.notableEditions.length === 1).slice() }));
      });
      const hs = sentences(c.history).filter((x) => re.test(x)), ds = sentences(c.description).filter((x) => re.test(x));
      const all = [].concat.apply([], phases.map((p) => p.engines)), pw = all.map((e) => e.power).filter((v) => v > 0);
      const sub = s.ph.some((p) => Array.isArray(p) && p[1]);
      const range = pw.length ? " Puissance de " + Math.min.apply(null, pw) + (Math.max.apply(null, pw) !== Math.min.apply(null, pw) ? " à " + Math.max.apply(null, pw) : "") + " ch." : "";
      const nm = (e) => { const n = e.name.indexOf(s.model) === 0 ? e.name.slice(s.model.length).trim() : e.name; return (n || e.name) + (e.power ? " (" + e.power + " ch" + (e.code ? ", " + e.code : "") + ")" : ""); };
      const base = sub ? "moteur " + all.map(nm).join(", ") + "." : phases.map((p) => p.details).filter(Boolean).join(" ");
      const d = s.d || (s.model + " : " + base + (sub ? "" : range));
      const car = Object.assign({}, c, {
        id, brand: s.brand || c.brand, model: s.model, category: s.cat || c.category, years: s.y || c.years, description: d,
        image: id === c.id ? c.image : "img/" + id + ".jpg", phases,
        history: s.h || (hs.length ? hs.join(" ") : d + (spec.length > 1 ? " Fiches voisines : " + spec.filter((o, k) => k !== i).map((o) => o.model).join(", ") + "." : "")),
        anecdotes: (c.anecdotes || []).filter((a) => re.test(a.title + " " + a.text)),
        records: (c.records || []).filter((r) => re.test(r.description)),
        userRecords: [],
        related: (c.related || []).concat(ids.filter((x) => x !== id)).filter((x, k, a) => x !== id && a.indexOf(x) === k)
      });
      if (c.drives) car.drives = c.drives.slice();
      if (c.track) car.track = Object.assign({}, c.track);
      out.push(car);
    });
  });
  MOTORAUTO_DATABASE.length = 0;
  MOTORAUTO_DATABASE.push(...out);
})();
