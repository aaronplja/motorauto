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

  // codes moteurs complémentaires : [id de la voiture, extrait du nom de la motorisation, code]
  const RULES = [
    ["peugeot-206-s16-gt", "EW10J4", "EW10J4"], ["peugeot-206-rc", "EW10J4S", "EW10J4S"],
    ["peugeot-206-sw", "1.4 HDi", "DV4TD"], ["peugeot-206-sw", "2.0 HDi", "DW10TD"], ["peugeot-206-sw", "1.6 HDi", "DV6TED4"], ["peugeot-206-plus", "1.4 HDi", "DV4TD"],
    ["peugeot-205-berline", "1.8 Diesel", "XUD7"], ["peugeot-205-t16", "XU8T (Route", "XU8T"],
    ["peugeot-306-berline", "2.0 HDi", "DW10TD"], ["peugeot-306-break", "2.0 HDi", "DW10TD"],
    ["saxo-berline", "1.0i", "TU9"], ["saxo-berline", "1.1i", "TU1M"], ["saxo-berline", "1.4i", "TU3JP"], ["saxo-berline", "1.5 D", "TUD5"],
    ["peugeot-106-berline", "1.0i", "TU9"], ["peugeot-106-berline", "1.1i", "TU1M"], ["peugeot-106-berline", "1.4i", "TU3JP"], ["peugeot-106-berline", "1.5 D", "TUD5"],
    ["peugeot-309-berline", "1.9 Diesel", "XUD9"], ["peugeot-406-berline-break", "1.8 16V", "XU7JP4"], ["peugeot-406-berline-break", "2.0 HDi", "DW10ATED"],
    ["peugeot-406-coupe", "2.0 16V", "EW10J4"], ["peugeot-406-coupe", "2.2 HDi", "DW12TED4"], ["peugeot-406-break", "2.0 16V", "EW10J4"], ["peugeot-406-break", "3.0 V6", "ES9J4"], ["peugeot-406-break", "2.2 HDi", "DW12TED4"], ["peugeot-406-silhouette", "V6", "ES9J4"],
    ["nissan-s30-240z-280z", "L24", "L24"], ["nissan-s30-240z-280z", "L28", "L28"], ["nissan-s130-280zx", "L28ET", "L28ET"], ["nissan-s130-280zx", "L28E", "L28E"],
    ["nissan-z31-300zx", "VG30ET", "VG30ET"], ["nissan-z31-300zx", "VG30E", "VG30E"], ["nissan-z32-300zx", "VG30DETT", "VG30DETT"], ["nissan-z32-300zx", "VG30DE", "VG30DE"],
    ["nissan-350z-z33", "VQ35DE", "VQ35DE"], ["nissan-350z-z33", "VQ35HR", "VQ35HR"], ["nissan-370z-z34", "VQ37VHR", "VQ37VHR"], ["nissan-z-rz34", "VR30DDTT", "VR30DDTT"],
    ["nissan-skyline-gtr-classic", "S20", "S20"], ["nissan-skyline-gtr-classic", "RB20DET", "RB20DET"],
    ["nissan-skyline-gtr-r32", "RB26DETT", "RB26DETT"], ["nissan-skyline-gtr-r33", "RB26DETT", "RB26DETT"], ["nissan-skyline-gtr-r33", "400R", "RB-X GT2"], ["nissan-skyline-gtr-r34", "RB26DETT", "RB26DETT"],
    ["nissan-gt-r-r35", "V6 Biturbo", "VR38DETT"], ["nissan-silvia-classic", "FJ20ET", "FJ20ET"],
    ["nissan-silvia-s13", "CA18DET", "CA18DET"], ["nissan-silvia-s13", "SR20DET", "SR20DET"], ["nissan-silvia-s14", "SR20DET", "SR20DET"], ["nissan-silvia-s15", "SR20DET", "SR20DET"], ["nissan-silvia-s15", "SR20DE ", "SR20DE"],
    ["nissan-silvia-ps13", "SR20DET", "SR20DET"], ["nissan-silvia-ps13", "SR20DE ", "SR20DE"], ["nissan-onevia", "CA18DET", "CA18DET"], ["nissan-onevia", "SR20DET", "SR20DET"], ["nissan-sileighty", "CA18DET", "CA18DET"], ["nissan-sileighty", "SR20DET", "SR20DET"],
    ["renault-clio-2-rs", "F4R", "F4R"], ["renault-clio-3-rs", "F4R", "F4R"], ["renault-clio-4-rs", "M5M", "M5M"], ["renault-megane-2-rs", "F4RT", "F4RT"], ["renault-megane-3-rs", "2.0 16V Turbo", "F4RT"], ["renault-megane-4-rs", "M5P", "M5P"], ["renault-clio-v6", "L7X", "L7X"],
    ["honda-civic-classic-generation", "D16A9", "D16A9"], ["honda-civic-eg6-vti", "B16A2", "B16A2"], ["honda-civic-ek9-type-r", "B16B", "B16B"], ["honda-civic-ep3-type-r", "K20A2", "K20A2"], ["honda-civic-ep3-type-r", "K20A ", "K20A"],
    ["honda-civic-fn2-type-r", "K20Z4", "K20Z4"], ["honda-civic-fk2-type-r", "K20C1", "K20C1"], ["honda-civic-fk8-type-r", "K20C1", "K20C1"], ["honda-civic-fl5-type-r", "K20C1", "K20C1"],
    ["toyota-supra-a70", "7M-GE ", "7M-GE"], ["toyota-supra-a70", "7M-GTE", "7M-GTE"], ["toyota-supra-a70", "1JZ-GTE", "1JZ-GTE"], ["toyota-supra-a80-mk4", "2JZ-GE ", "2JZ-GE"], ["toyota-supra-a80-mk4", "2JZ-GTE", "2JZ-GTE"],
    ["toyota-supra-a90-mk5", "2.0L", "B48"], ["toyota-supra-a90-mk5", "B58", "B58"],
    ["toyota-mr2-aw11", "4A-GE", "4A-GE"], ["toyota-mr2-aw11", "4A-GZE", "4A-GZE"], ["toyota-mr2-sw20", "3S-GE", "3S-GE"], ["toyota-mr2-sw20", "3S-GTE", "3S-GTE"],
    ["toyota-mrs-zzw30", "1ZZ-FED", "1ZZ-FED"], ["toyota-celica-st185-st205", "3S-GTE", "3S-GTE"], ["toyota-celica-zzt231", "1ZZ-FE", "1ZZ-FE"], ["toyota-celica-zzt231", "2ZZ-GE", "2ZZ-GE"],
    ["citroen-xsara-vts", "XU10J4RS", "XU10J4RS"], ["citroen-xsara-kit-car", "XU10J4RS", "XU10J4RS"],
    ["ford-escort-rs-cosworth-t35", "YBT", "YBT"], ["ford-escort-rs-cosworth-t25", "YBP", "YBP"], ["ford-sierra-rs-cosworth", "YBB", "YBB"], ["ford-rs200", "BDT-E", "BDT-E"], ["ford-rs200", "BDT ", "BDT"],
    ["vw-golf-gti-mk1", "(EG)", "EG"], ["vw-golf-gti-mk1", "(DX)", "DX"], ["vw-golf-gti-mk2", "(EV", "EV"], ["vw-golf-gti-mk2", "(KR", "KR"], ["vw-golf-gti-mk2", "(PG)", "PG"],
    ["vw-golf-gti-mk3", "(2E", "2E"], ["vw-golf-gti-mk3", "(ABF)", "ABF"], ["vw-golf-gti-mk3", "VR6", "AAA"],
    ["vw-golf-gti-mk4", "(AGU", "AGU"], ["vw-golf-gti-mk4", "(AUQ", "AUQ"], ["vw-golf-gti-mk4", "(ASZ", "ASZ"], ["vw-golf-gti-mk5", "(AXX", "AXX"], ["vw-golf-gti-mk5", "(BYD", "BYD"], ["vw-golf-gti-mk6", "(CCZB", "CCZB"],
    ["seat-leon-fr-mk1", "(AUQ", "AUQ"], ["seat-leon-fr-mk1", "(ARL", "ARL"], ["audi-80-b4", "1.9 TDI", "1Z"]
  ];
  // 0-100 km/h estimés (voitures dont la fiche n'en donnait pas) : [id, nom du moteur, secondes]
  const ZERO = [["alpine-a106", "747 cm³ L4", 40], ["renault-4cv", "747 cm³ L4", 50], ["renault-4cv", "760 cm³ L4", 55]];
  MOTORAUTO_DATABASE.forEach((c) => (c.phases || []).forEach((p) => (p.engines || []).forEach((e) => {
    if (!e.code) {
      const k = KNOWN[c.id + "|" + e.name];
      const rr = RULES.find((r) => r[0] === c.id && String(e.name).indexOf(r[1]) >= 0);
      if (k) e.code = k;
      else if (rr) e.code = rr[2];
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
