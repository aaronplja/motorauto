/**
 * MOTORAUTO — données complémentaires par fiche : transmission, poids à vide approximatif (kg) et fourchette de prix
 * d'occasion indicative (1 = moins de 5 000 €, 2 = 5–12 k€, 3 = 12–25 k€, 4 = 25–60 k€, 5 = plus de 60 k€ / introuvable).
 * Valeurs INDICATIVES : elles servent au rapport poids/puissance, au duel et au quiz. Pour une fiche absente de la
 * table, une estimation est déduite de la catégorie et de la puissance (marquée « estimé »).
 * Format : "id": [transmission, poids, budget]   (F = traction, R = propulsion, A = 4 roues motrices, M = moteur central)
 */
(function () {
  "use strict";
  const T = {
    "peugeot-206-berline": ["F", 1000, 1], "peugeot-206-s16-gt": ["F", 1100, 2], "peugeot-206-rc": ["F", 1130, 2], "peugeot-206-cc": ["F", 1200, 2],
    "peugeot-206-sw": ["F", 1130, 1], "peugeot-206-plus": ["F", 960, 1], "peugeot-206-wrc": ["A", 1230, 5], "peugeot-206-sedan": ["F", 1000, 1],
    "peugeot-205-berline": ["F", 850, 1], "peugeot-205-gti": ["F", 900, 3], "peugeot-205-rallye": ["F", 830, 2], "peugeot-205-cti": ["F", 950, 3],
    "peugeot-205-t16": ["A", 1150, 5], "peugeot-306-berline": ["F", 1050, 1], "peugeot-306-s16": ["F", 1100, 2], "peugeot-306-cabriolet": ["F", 1200, 2],
    "peugeot-306-break": ["F", 1150, 1], "peugeot-306-maxi": ["F", 960, 5], "saxo-berline": ["F", 850, 1], "saxo-vts": ["F", 900, 2],
    "saxo-s1600": ["F", 960, 5], "saxo-electrique": ["F", 1100, 1], "peugeot-106-berline": ["F", 800, 1], "peugeot-106-xsi": ["F", 830, 2],
    "peugeot-106-rallye": ["F", 825, 2], "peugeot-106-s16": ["F", 850, 2], "mazda-mx5-na": ["R", 960, 2], "mazda-mx5-nb": ["R", 1050, 2],
    "mazda-mx5-nc": ["R", 1100, 2], "mazda-mx5-nd": ["R", 1050, 3], "fiat-1000tipla": ["R", 800, 5], "nissan-s30-240z-280z": ["R", 1100, 4],
    "nissan-s130-280zx": ["R", 1250, 3], "nissan-z31-300zx": ["R", 1300, 2], "nissan-z32-300zx": ["R", 1500, 3], "nissan-350z-z33": ["R", 1450, 2],
    "nissan-370z-z34": ["R", 1520, 3], "nissan-z-rz34": ["R", 1550, 4], "nissan-skyline-gtr-classic": ["R", 1100, 5], "nissan-skyline-gtr-r32": ["A", 1430, 4],
    "nissan-skyline-gtr-r33": ["A", 1530, 4], "nissan-skyline-gtr-r34": ["A", 1560, 5], "nissan-gt-r-r35": ["A", 1740, 5], "nissan-silvia-classic": ["R", 1050, 3],
    "nissan-silvia-s13": ["R", 1150, 3], "nissan-silvia-s14": ["R", 1250, 3], "nissan-silvia-s15": ["R", 1240, 4], "nissan-silvia-ps13": ["R", 1150, 3],
    "nissan-onevia": ["R", 1150, 3], "nissan-sileighty": ["R", 1150, 3], "renault-clio-williams-16s": ["F", 980, 3], "renault-clio-2-rs": ["F", 1060, 2],
    "renault-clio-3-rs": ["F", 1200, 2], "renault-clio-4-rs": ["F", 1280, 3], "renault-megane-2-rs": ["F", 1230, 3], "renault-megane-3-rs": ["F", 1370, 3],
    "renault-megane-4-rs": ["F", 1430, 3], "renault-clio-v6": ["M", 1400, 4], "renault-spider": ["M", 930, 3], "honda-civic-classic-generation": ["F", 900, 2],
    "honda-civic-eg6-vti": ["F", 1050, 3], "honda-civic-ek9-type-r": ["F", 1050, 4], "honda-civic-ep3-type-r": ["F", 1210, 3], "honda-civic-fn2-type-r": ["F", 1260, 3],
    "honda-civic-fk2-type-r": ["F", 1380, 4], "honda-civic-fk8-type-r": ["F", 1430, 4], "honda-civic-fl5-type-r": ["F", 1430, 4], "peugeot-309-berline": ["F", 900, 1],
    "peugeot-309-gti": ["F", 950, 3], "peugeot-406-berline-break": ["F", 1400, 1], "peugeot-406-coupe": ["F", 1450, 2], "toyota-celica-supra-a40-a60": ["R", 1300, 3],
    "toyota-supra-a70": ["R", 1500, 3], "toyota-supra-a80-mk4": ["R", 1500, 5], "toyota-supra-a90-mk5": ["R", 1500, 4], "toyota-mr2-aw11": ["M", 1100, 3],
    "toyota-mr2-sw20": ["M", 1250, 3], "toyota-mrs-zzw30": ["M", 950, 2], "toyota-celica-classic": ["R", 1100, 3], "toyota-celica-st185-st205": ["A", 1350, 4],
    "toyota-celica-zzt231": ["F", 1200, 2], "citroen-xsara-vts": ["F", 1180, 1], "citroen-xsara-kit-car": ["F", 1000, 5], "citroen-xsara-wrc": ["A", 1230, 5],
    "ford-escort-rs-cosworth-t35": ["A", 1300, 5], "ford-escort-rs-cosworth-t25": ["A", 1300, 5], "ford-sierra-rs-cosworth": ["R", 1220, 4], "ford-focus-rs-mk2": ["F", 1450, 3],
    "ford-focus-rs-mk3": ["A", 1580, 4], "ford-focus-st-170": ["F", 1200, 2], "ford-fiesta-st-mk6": ["F", 1100, 2], "ford-fiesta-st-mk7": ["F", 1100, 3],
    "ford-puma-17": ["F", 1060, 2], "peugeot-406-break": ["F", 1400, 1], "ford-rs200": ["A", 1180, 5], "peugeot-207-rc": ["F", 1250, 2],
    "peugeot-207-s2000": ["A", 1200, 5], "peugeot-406-silhouette": ["F", 1050, 5], "vw-golf-gti-mk1": ["F", 800, 3], "vw-golf-gti-mk2": ["F", 960, 3],
    "vw-golf-gti-mk3": ["F", 1100, 2], "vw-golf-gti-mk4": ["F", 1150, 2], "vw-golf-gti-mk5": ["F", 1300, 2], "vw-golf-gti-mk6": ["F", 1310, 2],
    "vw-golf-gti-mk7": ["F", 1350, 3], "vw-golf-gti-mk8": ["F", 1450, 4], "seat-leon-fr-mk1": ["F", 1250, 2], "seat-leon-fr-mk2": ["F", 1350, 2],
    "seat-leon-fr-mk3": ["F", 1300, 3], "seat-leon-fr-mk4": ["F", 1400, 4], "peugeot-206-quiksilver": ["F", 1000, 1]
  };
  const DRIVE_LABEL = { F: "Traction", R: "Propulsion", A: "4 roues motrices", M: "Moteur central" };
  const BAND_LABEL = { 1: "< 5 000 €", 2: "5 – 12 k€", 3: "12 – 25 k€", 4: "25 – 60 k€", 5: "> 60 k€" };
  const BAND_MAX = { 1: 5000, 2: 12000, 3: 25000, 4: 60000, 5: 1e9 };

  /** { drive, kg, band, est } pour une fiche (valeurs estimées si la fiche n'est pas dans la table) */
  function carExtra(car) {
    const row = T[car.id];
    if (row) return { drive: row[0], kg: row[1], band: row[2], est: false };
    const power = (car.stats && car.stats.power) || 100;
    const base = { Berline: 1200, "Coupé": 1250, Break: 1350, Supercar: 1400, "Le Mans": 950 }[car.category] || 1250;
    const band = power < 120 ? 1 : power < 200 ? 2 : power < 300 ? 3 : power < 450 ? 4 : 5;
    return { drive: "", kg: base, band, est: true };
  }
  const powerToWeight = (car) => { const x = carExtra(car), p = (car.stats && car.stats.power) || 0; return p > 0 ? { kgPerHp: x.kg / p, hpPerTon: (p / x.kg) * 1000, kg: x.kg, est: x.est } : null; };

  window.MAExtra = { table: T, carExtra, powerToWeight, DRIVE_LABEL, BAND_LABEL, BAND_MAX };
})();
