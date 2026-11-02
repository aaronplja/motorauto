/** MOTORAUTO — compléments : informations manquantes des motorisations (valeurs indicatives).
 *  • code moteur repris du nom de la motorisation quand il y figure (ex. « 1.6 16V (120 ch - TU5J4) » → TU5J4) ;
 *  • codes moteurs de référence pour quelques moteurs très répandus ;
 *  • 0 à 100 km/h estimé pour les très petites cylindrées (la fiche est marquée « chiffres indicatifs »). */
(function () {
  "use strict";
  if (typeof MOTORAUTO_DATABASE === "undefined") return;
  const byId = new Map(MOTORAUTO_DATABASE.map((c) => [c.id, c]));
  const CODE = /^[A-Z]{1,4}\d{1,2}[A-Z0-9]{0,6}$/;
  // codes de référence (moteurs identifiés sans ambiguïté par leur nom et leur fiche)
  const KNOWN = {
    "peugeot-206-sw|1.1i 8V": "TU1JP", "peugeot-206-sw|1.4i 8V": "TU3JP", "peugeot-206-sw|1.6 16V": "TU5JP4", "peugeot-206-sw|2.0 16V S16 SW": "EW10J4",
    "peugeot-206-plus|1.1i 8V": "TU1JP", "peugeot-206-plus|1.4i 8V": "TU3JP", "peugeot-206-sedan|1.4i 8V": "TU3JP", "peugeot-206-sedan|1.6 16V": "TU5JP4",
    "peugeot-306-berline|1.4i": "TU3", "peugeot-306-berline|1.6i": "TU5", "peugeot-306-berline|1.8 16V": "LFY", "peugeot-306-berline|2.0 16V XSI": "XU10J4",
    "peugeot-306-break|1.4i": "TU3", "peugeot-306-break|1.6i": "TU5", "peugeot-306-cabriolet|1.8 16V": "LFY", "peugeot-306-cabriolet|2.0 16V": "XU10J4",
    "peugeot-306-maxi|2.0 16V XU10J4RS Maxi Atmos": "XU10J4RS",
    "saxo-vts|1.6 8V (90 ch)": "TU5JP", "saxo-vts|1.6 8V VTS (100 ch)": "TU5JP", "saxo-s1600|1.6 16V S1600 Atmos": "TU5J4",
    "peugeot-106-xsi|1.4 XSI (95 ch)": "TU3J2", "peugeot-106-xsi|1.6 XSI (105 ch)": "TU5J2",
    "mazda-mx5-na|1.6 16V (115 ch)": "B6-ZE", "mazda-mx5-na|1.8 16V (130 ch)": "BP-ZE", "mazda-mx5-nb|1.6 16V (110 ch)": "B6-ZE", "mazda-mx5-nb|1.8 16V VVT (146 ch)": "BP-VE",
    "mazda-mx5-nc|1.8 MZR 16V (126 ch)": "L8-DE", "mazda-mx5-nc|2.0 MZR 16V (160 ch)": "LF-VE", "mazda-mx5-nd|1.5 SkyActiv-G Atmos (132 ch)": "P5-VPR", "mazda-mx5-nd|2.0 SkyActiv-G Atmos (160 ch)": "PE-VPR"
  };
  // 0-100 km/h estimés (voitures dont la fiche n'en donnait pas) : [id, nom du moteur, secondes]
  const ZERO = [["alpine-a106", "747 cm³ L4", 40], ["renault-4cv", "747 cm³ L4", 50]];
  MOTORAUTO_DATABASE.forEach((c) => (c.phases || []).forEach((p) => (p.engines || []).forEach((e) => {
    if (!e.code) {
      const k = KNOWN[c.id + "|" + e.name];
      if (k) e.code = k;
      else {
        const m = String(e.name).match(/\(([^()]*)\)\s*$/);
        if (m) { const t = m[1].split(/\s+-\s+/).map((x) => x.trim()).find((x) => CODE.test(x)); if (t) e.code = t; }
      }
    }
  })));
  ZERO.forEach(([id, name, z]) => {
    const c = byId.get(id); if (!c) return;
    (c.phases || []).forEach((p) => (p.engines || []).forEach((e) => { if (e.name === name && !e.zeroToHundred) { e.zeroToHundred = z; c.approx = true; } }));
  });
})();
