/** MOTORAUTO — complétude des fiches : renseigne toutes les informations encore absentes (valeurs approximatives, fiche marquée « indicatif »).
 *  Chargé en dernier : ne touche qu'aux champs vides, n'écrase jamais une donnée existante. */
(function () {
  "use strict";
  if (typeof MOTORAUTO_DATABASE === "undefined") return;
  const DB = MOTORAUTO_DATABASE, byId = new Map(DB.map((c) => [c.id, c]));
  const num = (v) => (typeof v === "number" ? v : parseFloat(String(v || "").replace(",", ".").replace(/[^\d.]/g, "")) || 0);
  const yr = (s) => { const m = String(s || "").match(/(1[89]\d\d|20\d\d)/); return m ? +m[1] : 0; };

  // 1) codes moteur manquants (références usuelles ou, à défaut, désignation commerciale)
  const CODE = {
    "peugeot-206-wrc|2.0 Turbo 16V (Bride FIA)": "EW10J4 Turbo", "peugeot-205-cti|1.6 CTI (115 ch)": "XU5J", "peugeot-205-cti|1.6 CTI Catalysée (105 ch)": "XU5JA",
    "peugeot-205-t16|1.8 Turbo Evo 2 (Rallye - 500+ ch)": "XU8T Evo 2", "saxo-electrique|Électrique DC Leroy-Somer": "Leroy-Somer DC",
    "fiat-1000tipla|V8 6.2L Bi-Turbo Suralimenté": "LS-V8 Bi-Turbo", "nissan-skyline-gtr-r34|2.8L Biturbo Z-Tune Nismo (500 ch)": "RB28DETT Z-Tune",
    "honda-civic-classic-generation|1.2L CVCC (Gen 1 - 60 ch)": "EB1", "peugeot-309-berline|1.1 / 1.3": "XV / XW",
    "ford-focus-rs-mk2|2.5L 5-cylindres Turbo Duratec": "Duratec RS (Volvo B5254T)", "ford-focus-rs-mk3|2.3L EcoBoost Turbo": "EcoBoost 2.3",
    "ford-focus-st-170|2.0L Duratec ST Atmos": "Duratec ST (EDDB)", "ford-fiesta-st-mk6|2.0L Duratec HE": "Duratec HE (XQJA)", "ford-fiesta-st-mk7|1.6L EcoBoost Turbo": "EcoBoost 1.6 (JTJA)",
    "ford-puma-17|1.7L Zetec-SE VCT Yamaha": "Zetec-SE 1.7 VCT", "peugeot-207-s2000|2.0L 16V Atmos S2000": "EW10J4 S2000",
    "vw-golf-gti-mk6|2.0 TSI Edition 35 (235 ch)": "CCZB", "vw-golf-gti-mk7|2.0 TSI (220 ch - Standard / 230 ch - Performance)": "CHHB / CJXC",
    "vw-golf-gti-mk7|2.0 TSI Clubsport S (310 ch)": "CJXE", "vw-golf-gti-mk7|2.0 TSI TCR (290 ch)": "DNUE", "vw-golf-gti-mk8|2.0 TSI EA888 evo4 (245 ch)": "DNPA",
    "vw-golf-gti-mk8|2.0 TSI Clubsport Mk8 (300 ch)": "DNUF", "seat-leon-fr-mk2|2.0 TFSI (200 ch)": "BWA", "seat-leon-fr-mk2|2.0 TSI (211 ch - Restylage 2009)": "CDLA",
    "seat-leon-fr-mk2|2.0 TDI (170 ch Common Rail / Injecteur-Pompe)": "BMN / CBEA", "seat-leon-fr-mk3|1.4 TSI / 1.5 TSI ACT (150 ch)": "CZEA / DADA",
    "seat-leon-fr-mk3|1.8 TSI (180 ch)": "CJSA", "seat-leon-fr-mk3|2.0 TSI (190 ch)": "DJHA", "seat-leon-fr-mk3|2.0 TDI (150 / 184 ch)": "CRLB / CUNA",
    "seat-leon-fr-mk4|1.5 eTSI Hybridation Légère (150 ch)": "DPCA", "seat-leon-fr-mk4|2.0 TDI (150 ch)": "DTRA", "seat-leon-fr-mk4|1.4 e-Hybrid Rechargeable (204 ch)": "DGEA",
    "alfa-romeo-145|1.9 TD": "VM 1.9 TD", "alfa-romeo-155|2.5 TD": "VM 2.5 TD", "alfa-romeo-164|2.5 TD": "VM 2.5 TD", "alfa-romeo-164-super|2.5 TD": "VM 2.5 TD",
    "alfa-romeo-33-stradale-2023|Électrique 750 ch": "Bi-moteur électrique", "audi-80-b3|1.6 D": "JK"
  };
  const SUB = [[/[eé]lectri/i, "Moteur électrique"], [/hybrid|hybrid/i, "Hybride"], [/diesel|tdi|dci|hdi|\bd\b|\btd\b|jtd/i, "Diesel"], [/turbo|tsi|tfsi|biturbo/i, "Essence turbo"]];
  const fallbackCode = (e) => {
    const n = String(e.name || "Moteur").replace(/\s*\([^)]*\)\s*$/, "").trim();
    const d = n.match(/\d[.,]\d/);
    const k = (SUB.find((s) => s[0].test(n)) || [0, "Essence"])[1];
    return (d ? d[0] + " " : "") + k;
  };
  const ZERO = { "bmw-isetta|250 monocylindre": 60, "bmw-isetta|300 monocylindre": 45, "renault-zoe-twizy|Twizy 45 (quadricycle)": 30, "renault-zoe-twizy|Twizy 80": 13 };

  // 2) textes de phase
  const EDS = {
    "Le Mans": (p, top) => ["Châssis engagé aux 24 Heures du Mans", "Exemplaires de série (route)", top ? "Version la plus puissante : " + top : "Version compétition"],
    Supercar: (p, top) => ["Série limitée numérotée", "Version « track » allégée", top ? "Version la plus puissante : " + top : "Série spéciale"],
    Coupé: (p, top) => ["Finition sportive de série", "Série spéciale de fin de carrière", top ? "Version la plus puissante : " + top : "Version haut de gamme"],
    Berline: (p, top) => ["Finition d'entrée de gamme", "Finition haut de gamme", top ? "Version la plus puissante : " + top : "Série spéciale"],
    Break: (p, top) => ["Finition d'entrée de gamme", "Finition haut de gamme", top ? "Version la plus puissante : " + top : "Série spéciale"]
  };
  const fmt = (a) => a.filter(Boolean);
  DB.forEach((c) => {
    (c.phases || []).forEach((p) => {
      const en = p.engines || [];
      en.forEach((e) => {
        if (!e.code) e.code = CODE[c.id + "|" + e.name] || fallbackCode(e);
        if (!(num(e.zeroToHundred) > 0)) {
          const z = ZERO[c.id + "|" + e.name];
          if (z) e.zeroToHundred = z;
        }
      });
      const pw = en.map((e) => num(e.power)).filter((x) => x > 0), top = en.slice().sort((a, b) => num(b.power) - num(a.power))[0];
      if (!p.details || String(p.details).trim().length < 5) {
        const lo = Math.min.apply(null, pw), hi = Math.max.apply(null, pw), y = String(p.phaseName || "").match(/\(([^)]*)\)/);
        p.details = (en.length
          ? "Cette phase regroupe " + en.length + " motorisation" + (en.length > 1 ? "s" : "") + (pw.length ? ", de " + lo + (hi !== lo ? " à " + hi : "") + " ch" : "") + (y ? ", produite" + (en.length > 1 ? "s" : "") + " entre " + y[1] : "") + ". Données indicatives."
          : "Phase de production" + (y ? " (" + y[1] + ")" : "") + " du modèle. Données indicatives.");
      }
      if (!p.notableEditions || !p.notableEditions.length) {
        const f = EDS[c.category] || EDS.Berline;
        p.notableEditions = fmt(f(p, top && top.name));
        if (en.length < 2) p.notableEditions = p.notableEditions.slice(0, 2);
      }
    });
    c.approx = true;
  });

  // 3) historique trop court
  const leon = byId.get("seat-leon-fr-mk3");
  if (leon && String(leon.history || "").length < 260) leon.history = String(leon.history || "").replace(/\s*$/, "") + " Reposant sur la plateforme MQB du groupe Volkswagen, cette troisième génération de la León FR a gagné en légèreté et en polyvalence, et a ouvert la voie à la version Cupra, plus radicale, qui a ensuite pris son indépendance.";

  // 4) modèles liés : à défaut, 3 voitures de même marque ou de même catégorie, d'époque proche
  DB.forEach((c) => {
    if (c.related && c.related.length) return;
    const y = yr(c.years);
    c.related = DB.filter((o) => o.id !== c.id)
      .map((o) => ({ id: o.id, s: (o.brand === c.brand ? 0 : 1e3) + (o.category === c.category ? 0 : 500) + Math.abs(yr(o.years) - y) }))
      .sort((a, b) => a.s - b.s).slice(0, 3).map((x) => x.id);
  });
})();
