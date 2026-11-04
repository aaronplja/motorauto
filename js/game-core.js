/**
 * MOTORAUTO — règles du jeu PARTAGÉES entre le navigateur et les Cloud Functions.
 * Ce fichier est chargé tel quel par le site (window.MAGameCore) et copié dans functions/ par
 * `node scripts/sync-functions.js` : une seule définition des niveaux, badges, raretés et défis,
 * pour que le serveur et l'écran ne puissent jamais se contredire.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api; else root.MAGameCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const TZ = "Europe/Paris";
  const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

  // ------------------------------------------------------------------ calendrier (toujours heure de Paris)
  const dayKey = (ms) => dayFmt.format(new Date(ms === undefined ? Date.now() : ms));
  const monthKey = (ms) => dayKey(ms).slice(0, 7);
  function parisMidnight(day) {
    const p = day.split("-").map(Number);
    for (const h of [1, 2]) { const ms = Date.UTC(p[0], p[1] - 1, p[2]) - h * 3600000; if (dayKey(ms) === day && dayKey(ms - 1) !== day) return ms; }
    return Date.UTC(p[0], p[1] - 1, p[2]);
  }
  function mondayOf(ms) {
    const p = dayKey(ms).split("-").map(Number), dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
    return dt;
  }
  function weekKey(ms) {
    const dt = mondayOf(ms); dt.setUTCDate(dt.getUTCDate() + 3);            // le jeudi de la semaine ISO
    const jan4 = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
    const wk = 1 + Math.round(((dt - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
    return dt.getUTCFullYear() + "-W" + String(wk).padStart(2, "0");
  }
  const weekStart = (ms) => parisMidnight(mondayOf(ms).toISOString().slice(0, 10));
  const weekEnd = (ms) => weekStart(ms) + 7 * 86400000;
  const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const monthLabel = (key) => { const p = String(key).split("-"); return (MONTHS[Number(p[1]) - 1] || "") + " " + p[0]; };

  // ------------------------------------------------------------------ niveaux et badges
  const LEVELS = [
    { n: 1, name: "Débutant", xp: 0 }, { n: 2, name: "Apprenti", xp: 150 }, { n: 3, name: "Pilote", xp: 450 }, { n: 4, name: "Confirmé", xp: 1000 },
    { n: 5, name: "Expert", xp: 1800 }, { n: 6, name: "Élite", xp: 3000 }, { n: 7, name: "Maître", xp: 4800 }, { n: 8, name: "Champion", xp: 7200 },
    { n: 9, name: "Légende", xp: 10500 }, { n: 10, name: "Mythique", xp: 15000 }, { n: 11, name: "Prodige", xp: 20500 }, { n: 12, name: "Virtuose", xp: 27500 },
    { n: 13, name: "Colosse", xp: 36000 }, { n: 14, name: "Titan", xp: 46500 }, { n: 15, name: "Phénomène", xp: 59000 }, { n: 16, name: "Icône", xp: 74000 },
    { n: 17, name: "Immortel", xp: 92000 }, { n: 18, name: "Demi-dieu", xp: 113000 }, { n: 19, name: "Divinité", xp: 138000 }, { n: 20, name: "Ultime", xp: 168000 }
  ];
  function levelOf(xp) {
    let cur = LEVELS[0];
    LEVELS.forEach((l) => { if (xp >= l.xp) cur = l; });
    const next = LEVELS[cur.n] || null;
    return { level: cur, next, pct: next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100, toNext: next ? next.xp - xp : 0 };
  }
  let TOTAL = 111;                                          // nombre de cartes du catalogue (réglé par finish)
  /** id, icône, titre, description, valeur actuelle, objectif, palier visuel */
  const BADGES = [
    ["lap1", "🏁", "Premier chrono", "Enregistrer un premier chrono", (s) => s.laps, 1, ""],
    ["lap10", "⏱️", "10 chronos", "Enregistrer 10 chronos", (s) => s.laps, 10, "silver"],
    ["lap50", "🔥", "50 chronos", "Enregistrer 50 chronos", (s) => s.laps, 50, "gold"],
    ["record", "🥇", "Record battu", "Détenir le record d'un circuit (au moins 2 pilotes)", (s) => s.records, 1, "gold"],
    ["podium", "🥉", "Sur le podium", "Finir dans le top 3 d'un circuit", (s) => s.podiums, 1, "silver"],
    ["globe", "🗺️", "Globe-trotter", "Rouler sur 5 circuits différents", (s) => s.tracks, 5, "silver"],
    ["cmt1", "💬", "Première prise de parole", "Poster un premier commentaire", (s) => s.comments, 1, ""],
    ["cmt10", "🗣️", "Bavard", "Poster 10 commentaires", (s) => s.comments, 10, "silver"],
    ["cmt50", "📣", "Porte-voix", "Poster 50 commentaires", (s) => s.comments, 50, "gold"],
    ["like10", "❤️", "Passionné", "Aimer 10 voitures", (s) => s.likes, 10, ""],
    ["like50", "💘", "Cœur d'or", "Aimer 50 voitures", (s) => s.likes, 50, "silver"],
    ["car1", "🚗", "Projet publié", "Publier sa première voiture", (s) => s.cars, 1, ""],
    ["car3", "🏠", "Garage rempli", "Publier 3 voitures", (s) => s.cars, 3, "silver"],
    ["event1", "📅", "Organisateur", "Proposer une sortie", (s) => s.events, 1, "silver"],
    ["rsvp3", "🤝", "Toujours partant", "Participer à 3 sorties", (s) => s.rsvps, 3, ""],
    ["streak3", "🔥", "3 jours d'affilée", "Visiter le site 3 jours de suite", (s) => s.best, 3, ""],
    ["streak7", "⚡", "Semaine parfaite", "Visiter le site 7 jours de suite", (s) => s.best, 7, "silver"],
    ["streak30", "👑", "Mois sans faute", "Visiter le site 30 jours de suite", (s) => s.best, 30, "gold"],
    ["card10", "🃏", "Collectionneur", "Posséder 10 cartes différentes", (s) => s.cards, 10, ""],
    ["card50", "🎴", "Grand collectionneur", "Posséder 50 cartes différentes", (s) => s.cards, 50, "silver"],
    ["cardall", "🏆", "Collection complète", "Posséder toutes les cartes du catalogue", (s) => s.cards, () => TOTAL, "gold"],
    ["swap1", "🔄", "Premier échange", "Réaliser un échange de cartes avec un pilote", (s) => s.trades, 1, ""],
    ["swap10", "🤝", "Négociateur", "Réaliser 10 échanges de cartes", (s) => s.trades, 10, "silver"],
    ["chal4", "🎯", "Relève le défi", "Valider 4 défis hebdomadaires", (s) => s.chal, 4, ""],
    ["chal20", "🏅", "Infatigable", "Valider 20 défis hebdomadaires", (s) => s.chal, 20, "gold"],
    ["photo1", "📸", "Photographe", "Participer au concours photo du mois", (s) => s.entries, 1, ""],
    ["photoWin", "🌟", "Photographe du mois", "Gagner le concours photo mensuel", (s) => s.wins, 1, "gold"],
    ["special1", "✨", "Édition limitée", "Posséder une carte spéciale", (s) => s.specials, 1, "gold"],
    ["lvl5", "🎖️", "Expert", "Atteindre le niveau 5", (s) => s.level, 5, "silver"]
  ].map((b) => ({ id: b[0], icon: b[1], label: b[2], desc: b[3], get: b[4], goal: b[5], tier: b[6] }));
  const goalOf = (b) => (typeof b.goal === "function" ? b.goal() : b.goal);
  const BLANK_STATS = () => ({ byBrand: {}, rar: {}, brandsOwned: 0, opened: 0, sets: 0, upgraded: 0, maxlv: 0, wish: 0, follows: 0, fuse: 0, sold: 0, bought: 0, pm: 0, quizDone: 0, quizPerfect: 0, quizL3: 0, laps: 0, tracks: 0, records: 0, podiums: 0, comments: 0, likes: 0, cars: 0, events: 0, rsvps: 0, days: 0, best: 0, last: "", cards: 0, specials: 0, trades: 0, chal: 0, entries: 0, wins: 0, mentored: 0 });

  /** calcule xp, niveau et badges à partir des compteurs d'un pilote */
  function finish(s, total) {
    if (total) TOTAL = Math.max(1, total | 0);
    s.tracks = s.tracks instanceof Set ? s.tracks.size : s.tracks;
    const base = s.laps * 15 + s.records * 50 + s.podiums * 20 + s.comments * 4 + s.likes + s.cars * 25 + s.events * 20 + s.rsvps * 4 + s.best * 3 + s.cards * 2
      + s.trades * 8 + s.chal * 6 + s.entries * 10 + s.wins * 150 + s.specials * 30 + (Number(s.mentored) || 0) * 40;
    s.level = 1;
    let earned = BADGES.filter((b) => b.id !== "lvl5" && b.get(s) >= goalOf(b));   // le badge « niveau 5 » dépend de l'XP : deux passes
    s.xp = base + earned.length * 10; s.level = levelOf(s.xp).level.n;
    earned = BADGES.filter((b) => b.get(s) >= goalOf(b));
    s.xp = base + earned.length * 10; s.level = levelOf(s.xp).level.n;
    s.badges = earned.map((b) => b.id);
    return s;
  }

  // ------------------------------------------------------------------ cartes
  const RAR = {
    common: { id: "common", label: "Commune", dust: 5, craft: 30, odds: 0.615 },
    rare: { id: "rare", label: "Rare", dust: 15, craft: 90, odds: 0.26 },
    epic: { id: "epic", label: "Épique", dust: 40, craft: 240, odds: 0.09 },
    legendary: { id: "legendary", label: "Légendaire", dust: 100, craft: 600, odds: 0.03 },
    shiny: { id: "shiny", label: "Shiny", dust: 400, craft: 2400, odds: 0.005 },
    mythic: { id: "mythic", label: "Légende", dust: 600, craft: 0, odds: 0 },
    special: { id: "special", label: "Édition limitée", dust: 150, craft: 0, odds: 0 }
  };
  const ORDER = ["mythic", "shiny", "legendary", "epic", "rare", "common"];          // raretés tirables, de la plus haute à la plus basse
  const isSpecial = (id) => String(id).indexOf("sp-") === 0;
  /** puissance « de classement » : les voitures de course du Mans (identifiants lm-…) pèsent 60 % de leur puissance, pour ne pas écraser les voitures de route */
  const rankPower = (c) => (String(c.id).indexOf("lm-") === 0 ? c.power * 0.6 : c.power);
  /** cartes « Shiny » (arc-en-ciel, ≈ 0,5 % par carte tirée) : voitures mythiques choisies à la main */
  const SHINY = ["peugeot-205-t16", "peugeot-206-wrc", "nissan-skyline-gtr-r34", "nissan-gt-r-r35", "toyota-supra-a80-mk4", "ford-rs200", "ford-escort-rs-cosworth-t35", "audi-r8-v10", "honda-civic-ek9-type-r",
    "lm-ford-gt40", "lm-porsche-917k", "lm-porsche-956", "lm-porsche-962c", "lm-mazda-787b", "lm-mclaren-f1-gtr", "lm-porsche-919"];
  /** cartes « Légende » : une par album pays / décennie, gagnée en complétant l'album (jamais tirée en pack, jamais fabriquée) */
  const LEGENDS = {
    "country:fr": "alpine-a110-classic", "country:de": "mb-300-slr", "country:it": "rally-lancia-037", "country:gb": "lm-mirage-gr8",
    "country:jp": "rally-subaru-impreza-gc8", "country:us": "lm-chevrolet-corvette-c5r", "country:se": "rally-saab-96", "country:xx": "rally-i20-n-rally1",
    "decade:1940": "mb-w125", "decade:1950": "mb-300-sl-gullwing", "decade:1960": "rally-citroen-ds-monte", "decade:1970": "rally-lancia-stratos", "decade:1980": "rally-lancia-delta-s4",
    "decade:1990": "mb-clk-gtr", "decade:2000": "lm-audi-r8-lmp", "decade:2010": "mb-f1-hybrid", "decade:2020": "fiat-1000tipla"
  };
  const LEGEND_IDS = Object.keys(LEGENDS).map((k) => LEGENDS[k]);
  const PRESTIGE = /ferrari|lamborghini|porsche|mclaren|bugatti|aston martin|maserati|pagani|koenigsegg|lotus|bentley|rolls|de tomaso|shelby|jaguar|alpine|lancia|abarth/i;
  const SPORTY = /\b(gt|gti|gtr|gt-r|gto|gts|gt3|gt2|gt4|rs ?\d{0,2}|type[ -]?r|m[1-8]\d{0,2}i?|amg|cosworth|turbo|quadrifoglio|integrale|nismo|sti|evo|evolution|cup|trophy|stratos|csl|black series|competition|lightweight|clubsport|speedster|roadster|v12|v10|wrc|r5|group b|groupe b|supra|nsx|rx-7|skyline|mustang|corvette|viper|cayman|boxster|elise|exige|evora|z4|mx-5|gr ?\w*|r32|vr6|16s|s[2-8])\b/i;
  const pct = (sortedAsc, v) => { let lo = 0, hi = sortedAsc.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sortedAsc[m] < v) lo = m + 1; else hi = m; } return sortedAsc.length > 1 ? lo / (sortedAsc.length - 1) : 0; };
  /**
   * Score de prestige d'une voiture (0 à ~100) : performances relatives (puissance, vitesse, 0 à 100) + catégorie + marque + version sportive + âge de collection.
   * Une Ferrari 250 GTO ou une Delta Integrale ne finit donc plus « commune » parce que sa puissance est modeste.
   */
  function computeRarities(list) {
    const pw = list.map(rankPower).sort((a, b) => a - b), sp = list.map((c) => Number(c.speed) || 0).filter((v) => v > 0).sort((a, b) => a - b), zr = list.map((c) => Number(c.zero) || 0).filter((v) => v > 0).sort((a, b) => b - a);
    const score = (c) => {
      const pp = pct(pw, rankPower(c)), ps = c.speed > 0 ? pct(sp, c.speed) : pp, pz = c.zero > 0 ? pct(zr, c.zero) : pp, id = String(c.id), name = String(c.name || ""), y = Number(c.year) || 0, cat = String(c.category || "");
      let s = (pp * 0.5 + ps * 0.25 + pz * 0.25) * 70;
      s += cat === "Supercar" ? 14 : cat === "Le Mans" || id.indexOf("lm-") === 0 ? 12 : id.indexOf("rally-") === 0 ? 12 : cat === "Coupé" ? 3 : cat === "Break" ? -4 : cat === "Berline" && !SPORTY.test(name) ? -6 : 0;
      if (PRESTIGE.test(c.brand || name)) s += 10;
      if (SPORTY.test(name)) s += 10;
      if (y && y <= 1960) s += 16; else if (y && y <= 1975) s += 12; else if (y && y <= 1990) s += 8;
      return s;
    };
    const sorted = list.map((c) => ({ id: c.id, s: score(c), p: rankPower(c) })).sort((a, b) => (b.s - a.s) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const map = new Map();
    sorted.forEach((c, i) => {
      const p = i / Math.max(1, sorted.length - 1);
      map.set(c.id, LEGEND_IDS.indexOf(c.id) >= 0 ? "mythic" : SHINY.indexOf(c.id) >= 0 ? "shiny" : p < 0.06 ? "legendary" : p < 0.23 ? "epic" : p < 0.55 ? "rare" : "common");
    });
    return map;
  }
  function pickRarity(rng, min) {
    const x = rng(); let acc = 0;
    for (const id of ["common", "rare", "epic", "legendary", "shiny"]) {
      acc += RAR[id].odds;
      if (x < acc) return min && ORDER.indexOf(id) > ORDER.indexOf(min) ? min : id;
    }
    return "common";
  }
  /** tire un pack de 3 cartes ; tous les 10 packs une carte au moins « rare » est garantie, tous les 15 une « épique », et une « légendaire » après 30 packs sans légendaire */
  const PITY = { rare: 10, epic: 15, legend: 30 };
  function drawPack(rarities, ids, rng, pity, epicPity, legendPity) {
    ids = ids.filter((id) => rarities.get(id) !== "mythic");
    const by = {}; ORDER.forEach((r) => { by[r] = []; });
    ids.forEach((id) => { const r = rarities.get(id); if (by[r]) by[r].push(id); });
    const pick = (r) => { const list = by[r].length ? by[r] : (r === "shiny" && by.legendary.length ? by.legendary : ids); return list[Math.floor(rng() * list.length)]; };
    const out = [];
    for (let i = 0; i < 3; i++) out.push(pick(pickRarity(rng, i === 2 ? (legendPity ? "legendary" : epicPity ? "epic" : pity ? "rare" : null) : null)));
    if (pity && !out.some((id) => rarities.get(id) !== "common")) out[2] = pick("rare");
    return out;
  }

  // ------------------------------------------------------------------ boutique : packs par pays
  /** pays des constructeurs (le drapeau sert de décor au pack) ; c = couleurs, f = motif du drapeau */
  const COUNTRIES = [
    { id: "fr", label: "France", cost: 250, f: "v", c: ["#0055a4", "#ffffff", "#ef4135"] },
    { id: "de", label: "Allemagne", cost: 200, f: "h", c: ["#111111", "#dd0000", "#ffce00"] },
    { id: "it", label: "Italie", cost: 250, f: "v", c: ["#009246", "#ffffff", "#ce2b37"] },
    { id: "gb", label: "Royaume-Uni", cost: 350, f: "gb", c: ["#012169", "#ffffff", "#c8102e"] },
    { id: "jp", label: "Japon", cost: 250, f: "jp", c: ["#ffffff", "#bc002d", "#ffffff"] },
    { id: "us", label: "États-Unis", cost: 300, f: "us", c: ["#b22234", "#ffffff", "#3c3b6e"] },
    { id: "se", label: "Suède", cost: 350, f: "se", c: ["#006aa7", "#fecc00", "#fecc00"] },
    { id: "xx", label: "Autres pays", cost: 350, f: "world", c: ["#0f766e", "#6366f1", "#f59e0b"] }
  ];
  const BRAND_COUNTRY = [
    [/^(renault|alpine|peugeot|citro|ds\b|matra|bugatti|delahaye|talbot|lorraine|chenard|rondeau|vilebrequin|simca|venturi)/i, "fr"],
    [/^(mercedes|sauber|bmw|audi|auto union|volkswagen|vw\b|opel|porsche|dauer|ruf|smart|maybach)/i, "de"],
    [/^(alfa|ferrari|lancia|fiat|abarth|lamborghini|maserati|pagani)/i, "it"],
    [/^(bentley|jaguar|aston|mini\b|lagonda|mclaren|mg\b|prodrive|mirage|lotus|rover|land rover|tvr|caterham|morgan)/i, "gb"],
    [/^(toyota|nissan|datsun|honda|mazda|mitsubishi|subaru|suzuki|lexus|acura|infiniti|daihatsu)/i, "jp"],
    [/^(ford|chevrolet|cadillac|dodge|chrysler|tesla|jeep|buick|pontiac|shelby|gmc)/i, "us"],
    [/^(volvo|saab|koenigsegg|polestar)/i, "se"]
  ];
  function countryOf(brand) {
    const b = String(brand || "").trim();
    for (const [rx, id] of BRAND_COUNTRY) if (rx.test(b)) return id;
    return "xx";
  }
  /** packs de la boutique : « world » (toutes les voitures) et un pack par pays ; 2 cartes dont 1 « rare » ou mieux */

  // ------------------------------------------------------------------ cartes Circuit (famille à part : tracé, longueur, pays ; l'administrateur peut ajouter une photo par URL)
  const CIRCUIT_COUNTRY = {"ae": "Émirats arabes unis", "ar": "Argentine", "at": "Autriche", "au": "Australie", "az": "Azerbaïdjan", "be": "Belgique", "bh": "Bahreïn", "br": "Brésil", "ca": "Canada", "cn": "Chine", "cz": "Tchéquie", "de": "Allemagne", "es": "Espagne", "fr": "France", "gb": "Royaume-Uni", "hu": "Hongrie", "in": "Inde", "it": "Italie", "jp": "Japon", "kr": "Corée du Sud", "mc": "Monaco", "mx": "Mexique", "my": "Malaisie", "nl": "Pays-Bas", "pt": "Portugal", "qa": "Qatar", "ru": "Russie", "sa": "Arabie saoudite", "se": "Suède", "sg": "Singapour", "tr": "Turquie", "us": "États-Unis", "za": "Afrique du Sud", "ch": "Suisse"};
  /** [id, nom, pays, longueur km, ouverture, rareté, 1 = tracé réel disponible] */
  const CIRCUIT_CARDS = [
    ["ci-yas-marina", "Yas Marina", "ae", 5.281, 2009, "epic", 1],
    ["ci-buenos-aires", "Buenos Aires – Gálvez", "ar", 4.322, 1952, "common", 1],
    ["ci-red-bull-ring", "Red Bull Ring", "at", 4.318, 1969, "rare", 1],
    ["ci-albert-park", "Albert Park", "au", 5.278, 1953, "rare", 1],
    ["ci-bakou", "Bakou", "az", 6.003, 2016, "rare", 1],
    ["ci-spa", "Spa-Francorchamps", "be", 7.004, 1921, "legendary", 1],
    ["ci-sakhir", "Sakhir (Bahreïn)", "bh", 5.412, 2002, "rare", 1],
    ["ci-interlagos", "Interlagos", "br", 4.309, 1940, "epic", 1],
    ["ci-jacarepagua", "Jacarepaguá", "br", 5.031, 1977, "common", 1],
    ["ci-gilles-villeneuve", "Circuit Gilles-Villeneuve", "ca", 4.361, 1978, "rare", 1],
    ["ci-shanghai", "Shanghai", "cn", 5.451, 2004, "rare", 1],
    ["ci-nurburgring-gp", "Nürburgring (Grand Prix)", "de", 5.148, 1927, "rare", 1],
    ["ci-hockenheim", "Hockenheimring", "de", 4.574, 1932, "rare", 1],
    ["ci-barcelona", "Barcelona-Catalunya", "es", 4.655, 1991, "epic", 1],
    ["ci-madring", "Madring (Madrid)", "es", 5.474, 2026, "common", 1],
    ["ci-magny-cours", "Magny-Cours", "fr", 4.412, 1960, "rare", 1],
    ["ci-paul-ricard", "Paul Ricard", "fr", 5.842, 1969, "rare", 1],
    ["ci-silverstone", "Silverstone", "gb", 5.891, 1948, "epic", 1],
    ["ci-hungaroring", "Hungaroring", "hu", 4.381, 1986, "rare", 1],
    ["ci-mugello", "Mugello", "it", 5.245, 1974, "epic", 1],
    ["ci-monza", "Monza", "it", 5.793, 1922, "legendary", 1],
    ["ci-imola", "Imola", "it", 4.909, 1953, "epic", 1],
    ["ci-suzuka", "Suzuka", "jp", 5.807, 1962, "legendary", 1],
    ["ci-monaco", "Monaco", "mc", 3.337, 1929, "legendary", 1],
    ["ci-mexico", "Mexico – Hermanos Rodríguez", "mx", 4.304, 1962, "rare", 1],
    ["ci-sepang", "Sepang", "my", 5.543, 1999, "rare", 1],
    ["ci-zandvoort", "Zandvoort", "nl", 4.259, 1948, "rare", 1],
    ["ci-estoril", "Estoril", "pt", 4.349, 1972, "common", 1],
    ["ci-portimao", "Portimão (Algarve)", "pt", 4.653, 2008, "common", 1],
    ["ci-losail", "Losail (Qatar)", "qa", 5.38, 2004, "common", 1],
    ["ci-sotchi", "Sotchi", "ru", 5.848, 2014, "common", 1],
    ["ci-jeddah", "Jeddah", "sa", 6.175, 2021, "rare", 1],
    ["ci-marina-bay", "Marina Bay (Singapour)", "sg", 4.928, 2008, "rare", 1],
    ["ci-istanbul-park", "Istanbul Park", "tr", 5.338, 2005, "common", 1],
    ["ci-indianapolis", "Indianapolis (circuit routier)", "us", 4.192, 1909, "epic", 1],
    ["ci-watkins-glen", "Watkins Glen", "us", 5.43, 1956, "rare", 1],
    ["ci-cota", "Circuit des Amériques (Austin)", "us", 5.514, 2012, "rare", 1],
    ["ci-miami", "Miami", "us", 5.412, 2022, "common", 1],
    ["ci-las-vegas", "Las Vegas", "us", 6.201, 2023, "common", 1],
    ["ci-kyalami", "Kyalami", "za", 4.529, 1961, "common", 1],
    ["ci-le-mans", "Le Mans – 24 Heures (circuit de la Sarthe)", "fr", 13.626, 1923, "legendary", 0],
    ["ci-le-mans-bugatti", "Le Mans – Circuit Bugatti", "fr", 4.185, 1965, "common", 0],
    ["ci-charade", "Charade (Clermont-Ferrand)", "fr", 8.055, 1958, "rare", 0],
    ["ci-dijon", "Dijon-Prenois", "fr", 3.801, 1972, "common", 0],
    ["ci-pau", "Pau – circuit urbain", "fr", 2.76, 1901, "common", 0],
    ["ci-nordschleife", "Nürburgring – Nordschleife", "de", 20.832, 1927, "legendary", 0],
    ["ci-sachsenring", "Sachsenring", "de", 3.671, 1927, "common", 0],
    ["ci-norisring", "Norisring", "de", 2.3, 1947, "common", 0],
    ["ci-hockenheim-old", "Hockenheim – ancien tracé", "de", 6.823, 1966, "epic", 0],
    ["ci-brands-hatch", "Brands Hatch (Grand Prix)", "gb", 3.908, 1926, "rare", 0],
    ["ci-donington", "Donington Park", "gb", 4.02, 1931, "rare", 0],
    ["ci-goodwood", "Goodwood Motor Circuit", "gb", 3.8, 1948, "rare", 0],
    ["ci-brooklands", "Brooklands", "gb", 4.43, 1907, "epic", 0],
    ["ci-goodwood-hill", "Goodwood – Festival of Speed (côte)", "gb", 1.86, 1936, "rare", 0],
    ["ci-oulton", "Oulton Park", "gb", 4.333, 1953, "common", 0],
    ["ci-cadwell", "Cadwell Park", "gb", 3.5, 1934, "common", 0],
    ["ci-snetterton", "Snetterton 300", "gb", 4.778, 1951, "common", 0],
    ["ci-pikes-peak", "Pikes Peak (course de côte)", "us", 19.99, 1916, "epic", 0],
    ["ci-daytona", "Daytona – circuit routier", "us", 5.729, 1959, "epic", 0],
    ["ci-sebring", "Sebring", "us", 6.019, 1950, "epic", 0],
    ["ci-road-atlanta", "Road Atlanta", "us", 4.088, 1970, "rare", 0],
    ["ci-laguna-seca", "Laguna Seca", "us", 3.602, 1957, "epic", 0],
    ["ci-road-america", "Road America", "us", 6.515, 1955, "rare", 0],
    ["ci-talladega", "Talladega Superspeedway", "us", 4.281, 1969, "rare", 0],
    ["ci-mid-ohio", "Mid-Ohio", "us", 3.634, 1962, "common", 0],
    ["ci-long-beach", "Long Beach – circuit urbain", "us", 3.167, 1975, "common", 0],
    ["ci-bathurst", "Bathurst – Mount Panorama", "au", 6.213, 1938, "epic", 0],
    ["ci-phillip-island", "Phillip Island", "au", 4.445, 1956, "common", 0],
    ["ci-misano", "Misano", "it", 4.226, 1972, "common", 0],
    ["ci-vallelunga", "Vallelunga", "it", 4.085, 1951, "common", 0],
    ["ci-targa-florio", "Targa Florio", "it", 72, 1906, "epic", 0],
    ["ci-mille-miglia", "Mille Miglia (route)", "it", 1600, 1927, "epic", 0],
    ["ci-pescara", "Pescara", "it", 25.579, 1924, "common", 0],
    ["ci-jerez", "Jerez", "es", 4.428, 1985, "common", 0],
    ["ci-valencia", "Valence – Ricardo Tormo", "es", 4.005, 1999, "common", 0],
    ["ci-zolder", "Zolder", "be", 4.011, 1963, "common", 0],
    ["ci-spa-old", "Spa-Francorchamps – ancien tracé", "be", 14.12, 1921, "epic", 0],
    ["ci-salzburgring", "Salzburgring", "at", 4.241, 1969, "common", 0],
    ["ci-osterreichring", "Österreichring – ancien tracé", "at", 5.911, 1969, "rare", 0],
    ["ci-brno", "Brno", "cz", 5.403, 1987, "common", 0],
    ["ci-anderstorp", "Anderstorp", "se", 4.018, 1968, "common", 0],
    ["ci-bremgarten", "Bremgarten (Berne)", "ch", 7.28, 1931, "rare", 0],
    ["ci-fuji", "Fuji Speedway", "jp", 4.563, 1965, "rare", 0],
    ["ci-motegi", "Motegi", "jp", 4.801, 1997, "common", 0],
    ["ci-tsukuba", "Tsukuba", "jp", 2.045, 1970, "common", 0],
    ["ci-okayama", "Okayama", "jp", 3.703, 1990, "common", 0],
    ["ci-autopolis", "Autopolis", "jp", 4.674, 1990, "common", 0],
    ["ci-zhuhai", "Zhuhai", "cn", 4.319, 1996, "common", 0],
    ["ci-korea", "Korea International Circuit", "kr", 5.615, 2010, "common", 0],
    ["ci-buddh", "Buddh (Inde)", "in", 5.125, 2011, "common", 0],
    ["ci-mosport", "Mosport", "ca", 3.957, 1961, "common", 0],
    ["ci-mont-tremblant", "Mont-Tremblant", "ca", 4.265, 1964, "common", 0]
  ];
  // ---- livrées célèbres : variantes de voitures du catalogue [id, voiture, livrée, rareté]
  const LIVERIES = [
    ["lv-917k-gulf", "lm-porsche-917k", "Gulf", "legendary"], ["lv-917k-martini", "lm-porsche-917k", "Martini Racing", "legendary"],
    ["lv-917lh-salzburg", "lm-porsche-917lh", "Porsche Salzburg", "legendary"], ["lv-gt40-gulf", "lm-ford-gt40", "Gulf", "legendary"],
    ["lv-956-rothmans", "lm-porsche-956", "Rothmans", "epic"], ["lv-962c-rothmans", "lm-porsche-962c", "Rothmans", "epic"],
    ["lv-935-martini", "lm-porsche-935", "Martini Racing", "epic"], ["lv-integrale-martini", "rally-lancia-integrale", "Martini Racing", "epic"],
    ["lv-037-martini", "rally-lancia-037", "Martini Racing", "epic"], ["lv-stratos-alitalia", "rally-lancia-stratos", "Alitalia", "legendary"],
    ["lv-s4-martini", "rally-lancia-delta-s4", "Martini Racing", "legendary"], ["lv-205t16-ptS", "peugeot-205-t16", "Peugeot Talbot Sport", "epic"],
    ["lv-s1-audisport", "audi-sport-quattro-s1-e2", "Audi Sport", "epic"], ["lv-celica-castrol", "toyota-celica-st185-st205", "Castrol", "epic"],
    ["lv-impreza-555", "rally-subaru-impreza-gc8", "555", "epic"], ["lv-787b-renown", "lm-mazda-787b", "Renown", "legendary"],
    ["lv-xjr9-silkcut", "lm-jaguar-xjr9", "Silk Cut", "epic"], ["lv-f1gtr-gulf", "lm-mclaren-f1-gtr", "Gulf", "legendary"],
    ["lv-m3dtm-jager", "bmw-m3-e30-dtm", "Jägermeister", "epic"], ["lv-190e-amg", "mb-190e-dtm", "AMG", "epic"]
  ];
  const isLivery = (id) => String(id).indexOf("lv-") === 0;
  const isExtra = (id) => isLivery(id) || String(id).indexOf("ci-") === 0;
  const LIVERY_ROW = new Map(LIVERIES.map((r) => [r[0], r]));
  /** carte livrée à partir de sa voiture de base (stats identiques) */
  function liveryCard(id, base) {
    const r = LIVERY_ROW.get(id); if (!r || !base) return null;
    return Object.assign({}, base, { id, livery: true, baseId: r[1], liveryName: r[2], rar: r[3], model: String(base.model || base.name || "").replace(/\s*\(.*$/, "") + " · livrée " + r[2], name: undefined });
  }
  const isCircuit = (id) => String(id).indexOf("ci-") === 0;
  const CIRCUIT_BY_ID = new Map(CIRCUIT_CARDS.map((r) => [r[0], { id: r[0], circuit: true, name: r[1], brand: "Circuit", model: r[1], country: r[2], countryLabel: CIRCUIT_COUNTRY[r[2]] || "", km: r[3], since: r[4], rar: r[5], trace: !!r[6] }]));
  const circuitRarities = () => new Map(CIRCUIT_CARDS.map((r) => [r[0], r[5]]));
  const PACKS = { world: { id: "world", label: "Pack mondial", cost: 200, cards: 2, min: "rare", country: "" } };
  COUNTRIES.forEach((k) => { PACKS[k.id] = { id: k.id, label: "Pack " + k.label, cost: k.cost, cards: 2, min: "rare", country: k.id }; });
  PACKS.circuit = { id: "circuit", label: "Pack Circuit", cost: 400, cards: 3, min: "rare", country: "", circuit: true };
  const SHOP_PACK = { cost: PACKS.world.cost, cards: 2 };
  function drawShopPack(rarities, ids, rng, min, n) {
    ids = ids.filter((id) => rarities.get(id) !== "mythic");
    const by = {}; ORDER.forEach((r) => { by[r] = []; });
    ids.forEach((id) => { const r = rarities.get(id); if (by[r]) by[r].push(id); });
    const pick = (r) => { const list = by[r] && by[r].length ? by[r] : ids; return list[Math.floor(rng() * list.length)]; };
    // rareté minimale : si le pays n'a aucune carte assez rare, on prend la meilleure rareté disponible
    let first = pick(pickRarity(rng, min || "rare"));
    if ((rarities.get(first) === "common") && ids.some((id) => rarities.get(id) !== "common")) {
      const better = ids.filter((id) => rarities.get(id) !== "common"); first = better[Math.floor(rng() * better.length)];
    }
    const out = [first];
    while (out.length < (n || 2)) {
      let nx = pick(pickRarity(rng, null));
      for (let k = 0; k < 6 && out.indexOf(nx) >= 0 && ids.length > out.length; k++) nx = pick(pickRarity(rng, null));   // évite le doublon dans le même pack quand c'est possible
      out.push(nx);
    }
    return out;
  }

  // ------------------------------------------------------------------ historique des cartes et verrou

  // ------------------------------------------------------------------ roue quotidienne et calendrier de l'Avent
  /** roue : 55 % cristaux, 20 % pack bonus, 10 % gel, 12 % points de saison, 3 % carte rare ou épique */
  const WHEEL = [{ k: "dust", p: 55 }, { k: "pack", p: 20 }, { k: "freeze", p: 10 }, { k: "pts", p: 12 }, { k: "card", p: 3 }];
  const WHEEL_DUST = [[10, 40], [20, 30], [30, 18], [50, 9], [100, 3]];
  function wheelDraw(rng) {
    let x = rng() * 100, k = "dust";
    for (const w of WHEEL) { if (x < w.p) { k = w.k; break; } x -= w.p; }
    if (k === "dust") { let y = rng() * 100, n = 10; for (const [v, p] of WHEEL_DUST) { if (y < p) { n = v; break; } y -= p; } return { k, n }; }
    if (k === "pack") return { k, n: 1 };
    if (k === "freeze") return { k, n: 1 };
    if (k === "pts") return { k, n: rng() < 0.7 ? 20 : 40 };
    return { k, rarity: rng() < 0.7 ? "rare" : "epic" };
  }
  const wheelLabel = (r) => (r.k === "dust" ? r.n + " cristaux" : r.k === "pack" ? "1 pack bonus" : r.k === "freeze" ? "1 gel de série" : r.k === "pts" ? r.n + " points de saison" : "une carte " + (r.rarity === "epic" ? "épique" : "rare"));
  /** Avent : cases 1 à 24 ouvrables du 1er au 24 décembre (heure de Paris), puis rattrapables jusqu'au 31 */
  function adventToday(ms) {
    const k = dayKey(ms), y = Number(k.slice(0, 4)), m = Number(k.slice(5, 7)), d = Number(k.slice(8, 10));
    return m === 12 ? { y, d: Math.min(d, 24), over: d > 24 } : null;
  }
  function adventReward(n) {
    if (n === 24) return { dust: 250, bonus: 2, card: true };
    const r = { dust: 15 + n * 3 };
    if (n % 6 === 0) r.bonus = 1;
    if (n === 9 || n === 15 || n === 21) r.freeze = 1;
    if (n % 6 === 3) r.pts = 20;
    return r;
  }
  const adventLabel = (r) => [r.dust && r.dust + " cristaux", r.bonus && r.bonus + " pack" + (r.bonus > 1 ? "s" : "") + " bonus", r.freeze && "1 gel de série", r.pts && r.pts + " points de saison", r.card && "la carte de Noël"].filter(Boolean).join(" + ");
  const HIST_MAX = 6;
  const HIST_LABEL = { daily: "Pack du jour", bonus: "Pack bonus", shop: "Pack acheté", craft: "Fabriquée", offer: "Carte du jour", fuse: "Fusion", trade: "Échange", market: "Marché", pass: "Pass de saison", album: "Album", gift: "Cadeau", wheel: "Roue", advent: "Avent" };
  /** note l'arrivée d'un exemplaire : n = total d'exemplaires passés entre tes mains, e = 6 dernières origines [date, code] */
  function histAdd(d, id, code, ms) {
    if (!d || !id) return;
    d.hist = d.hist || {};
    const h = d.hist[id] || (d.hist[id] = { n: 0, e: [] });
    h.n = (h.n || 0) + 1; h.e = (h.e || []).concat([[ms || Date.now(), String(code || "pack").slice(0, 8)]]).slice(-HIST_MAX);
  }
  const isLocked = (d, id) => !!(d && d.locked && d.locked[id]);
  const RECYCLE_MAX = 60;
  const blankCollection = () => ({ owned: {}, count: 0, specials: 0, dust: 0, lastPack: "", bonus: 1, claimed: [], opened: 0, trades: 0, chal: 0, dustLog: [], pics: {}, picClaims: {}, lv: {}, mis: { day: "", p: {}, done: [] }, offers: { day: "", pack: 0, card: 0 }, log: [], best: "", welcome: false, season: null, cosm: [], locked: {}, hist: {}, pity: 0 });

  // ------------------------------------------------------------------ cartes à plusieurs images
  /** clé courte et stable d'une image (ne change pas si l'administrateur réordonne la galerie) */
  const picKey = (u) => { let h = 5381; const t = String(u); for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36); };
  /** images réelles d'une voiture (adresses https, sans doublon, 12 maximum) ; les images génériques locales ne comptent pas */
  const picUrls = (car) => {
    const out = []; [car && car.image].concat((car && car.images) || []).forEach((u) => { if (typeof u === "string" && /^https:\/\//i.test(u) && out.indexOf(u) < 0) out.push(u); });
    return out.slice(0, 12);
  };
  const picKeys = (car) => picUrls(car).map(picKey);
  /** clés des images débloquées pour une carte possédée (la première image est acquise dès la 1re carte) */
  function picsHave(d, id, keys) {
    const set = (d.pics && d.pics[id]) || [], out = keys.filter((k) => set.indexOf(k) >= 0);
    if (!out.length && keys.length && (d.owned && d.owned[id] > 0)) out.push(keys[0]);
    return out;
  }
  /** récompenses de la courbe de progression : palier 50 % (si 4 images ou plus) puis 100 %. mask : paliers déjà encaissés (1 = 50 %, 2 = 100 %) */
  function picReward(rar, n, total, mask) {
    let gain = 0, m = mask || 0, R = RAR[rar] || RAR.common;
    if (total >= 4 && n >= Math.ceil(total / 2) && !(m & 1)) { gain += R.dust * 4; m |= 1; }
    if (total >= 2 && n >= total && !(m & 2)) { gain += R.craft; m |= 2; }
    return { gain, mask: m };
  }
  /** recompte cartes distinctes (hors éditions spéciales) et éditions spéciales */
  function recount(doc) {
    let c = 0, s = 0, ci = 0, lv = 0;
    Object.keys(doc.owned || {}).forEach((k) => { if (doc.owned[k] > 0) { if (isSpecial(k)) s++; else if (isCircuit(k)) ci++; else if (isLivery(k)) lv++; else c++; } });
    doc.count = c; doc.specials = s; doc.circuits = ci; doc.liveries = lv; return doc;
  }

  // ------------------------------------------------------------------ défis de la semaine
  /** src : counter:* (compté par le serveur), log:* (action signalée, 3 par jour maximum), q:* (compté dans les données du site) */
  const CHALLENGES = [
    { id: "packs3", icon: "🎴", label: "Ouvre 3 packs", goal: 3, src: "counter:packs", reward: { dust: 40 } },
    { id: "packs5", icon: "📦", label: "Ouvre 5 packs", goal: 5, src: "counter:packs", reward: { dust: 70 } },
    { id: "daily3", icon: "📆", label: "Ouvre ton pack du jour 3 jours", goal: 3, src: "counter:daily", reward: { dust: 60 } },
    { id: "comment2", icon: "💬", label: "Commente 2 fiches", goal: 2, src: "q:comments", reward: { dust: 30 } },
    { id: "comment5", icon: "🗨️", label: "Commente 5 fiches", goal: 5, src: "q:comments", reward: { dust: 60 } },
    { id: "duel1", icon: "🏁", label: "Fais un duel", goal: 1, src: "log:duel", reward: { dust: 25 } },
    { id: "duel3", icon: "⚔️", label: "Fais 3 duels", goal: 3, src: "log:duel", reward: { dust: 50 } },
    { id: "share1", icon: "↗️", label: "Partage une fiche", goal: 1, src: "log:share", reward: { dust: 20 } },
    { id: "share3", icon: "📣", label: "Partage 3 fiches", goal: 3, src: "log:share", reward: { dust: 45 } },
    { id: "lap1", icon: "⏱️", label: "Enregistre un chrono", goal: 1, src: "q:laps", reward: { bonus: 1 } },
    { id: "like5", icon: "❤️", label: "Aime 5 voitures", goal: 5, src: "q:likes", reward: { dust: 30 } },
    { id: "like15", icon: "💖", label: "Aime 15 voitures", goal: 15, src: "q:likes", reward: { dust: 60 } },
    { id: "react3", icon: "🔥", label: "Réagis à 3 fiches (🔥 🏁 😍)", goal: 3, src: "q:reacts", reward: { dust: 25 } },
    { id: "rsvp1", icon: "📅", label: "Rejoins une sortie", goal: 1, src: "q:rsvps", reward: { dust: 40 } },
    { id: "vote1", icon: "📸", label: "Vote au concours photo", goal: 1, src: "q:votes", reward: { dust: 30 } },
    { id: "chat5", icon: "💭", label: "Écris 5 messages dans le salon", goal: 5, src: "q:chat", reward: { dust: 30 } },
    { id: "trade1", icon: "🔄", label: "Réalise un échange de cartes", goal: 1, src: "counter:trades", reward: { bonus: 1 } },
    { id: "wish3", icon: "⭐", label: "Mets 3 cartes dans ta wishlist", goal: 3, src: "state:wish", reward: { dust: 20 } }
  ];
  /** défi du jour (1 par jour, identique pour tous) : actions simples comptées depuis minuit (heure de Paris) */
  const DAILY = [
    { id: "d-pack", icon: "🎁", label: "Ouvre ton pack du jour", goal: 1, src: "counter:daily", reward: { dust: 15 } },
    { id: "d-like3", icon: "❤️", label: "Aime 3 voitures", goal: 3, src: "q:likes", reward: { dust: 15 } },
    { id: "d-comment1", icon: "💬", label: "Commente une fiche", goal: 1, src: "q:comments", reward: { dust: 15 } },
    { id: "d-duel1", icon: "🏁", label: "Fais un duel", goal: 1, src: "log:duel", reward: { dust: 15 } },
    { id: "d-share1", icon: "↗️", label: "Partage une fiche", goal: 1, src: "log:share", reward: { dust: 15 } },
    { id: "d-react2", icon: "🔥", label: "Réagis à 2 fiches", goal: 2, src: "q:reacts", reward: { dust: 15 } },
    { id: "d-chat3", icon: "💭", label: "Écris 3 messages dans le salon", goal: 3, src: "q:chat", reward: { dust: 15 } }
  ];
  const hashStr = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
  function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  /** les 10 défis d'une semaine : identiques pour tous les pilotes, tirés au sort à partir du numéro de semaine */
  function weekChallenges(wk) {
    const rnd = mulberry(hashStr("motorauto-" + wk)), pool = CHALLENGES.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    return pool.slice(0, 10);
  }
  function dailyChallenge(day) { return DAILY[hashStr("motorauto-day-" + day) % DAILY.length]; }
  /** défis « voiture de la semaine » : mêmes 3 défis chaque semaine, sur la voiture mise en avant (auto ou choisie par l'admin) */
  const FEATURED = [
    { id: "f-react", icon: "🔥", label: (n) => "Réagis à « " + n + " » (j'aime ou 🔥 🏁 😍)", goal: 1, src: "feat:react", reward: { dust: 35 } },
    { id: "f-comment", icon: "✍️", label: (n) => "Donne ton avis sur « " + n + " » (commentaire)", goal: 1, src: "feat:comment", reward: { dust: 45 } },
    { id: "f-view", icon: "🔎", label: (n) => "Découvre la fiche de « " + n + " »", goal: 1, src: "feat:view", reward: { dust: 25 } }
  ];
  const featuredItems = (name) => FEATURED.map((f) => Object.assign({}, f, { label: f.label(name) }));
  /** voiture mise en avant par défaut : tirage déterministe sur la liste triée du catalogue */
  const autoFeatured = (wk, ids) => { const l = ids.slice().sort(); return l.length ? l[hashStr("motorauto-feat-" + wk) % l.length] : ""; };
  const PERFECT_WEEK_BONUS = 1;
  const THEMES = ["Ma voiture au lever du soleil", "Détail mécanique", "Mon garage", "Route de rêve", "Voiture en mouvement", "Noir & blanc", "Mon plus beau reflet", "Sortie entre pilotes", "Voiture sous la pluie", "Intérieur et cockpit", "Avant / après", "Ma voiture de collection"];

  /** année de début d'une voiture (champ « year » du serveur, ou « 1984 - 1994 » côté site) */
  const yearOf = (c) => { if (c && Number(c.year) > 1800) return Number(c.year); const m = String((c && c.years) || "").match(/\d{4}/); return m ? Number(m[0]) : 0; };
  const decadeOf = (c) => { const y = yearOf(c); return !y ? 0 : y < 1950 ? 1940 : Math.floor(y / 10) * 10; };
  const decadeLabel = (d) => d === 1940 ? "Avant 1950" : "Années " + d;
  /** albums : un par pays, par décennie (avec une carte « Légende » à la clé), par marque et par carrosserie ; récompense en cristaux selon la taille */
  function setReward(n) { return Math.min(600, 20 + n * 10); }
  function setsOf(list) {
    const out = [], skip = new Set(LEGEND_IDS);
    const add = (id, name, kind, ids, legend) => {
      ids = ids.filter((x) => !skip.has(x));
      if (ids.length >= (kind === "category" ? 3 : kind === "brand" ? 3 : 2)) out.push({ id, name: kind === "category" ? "Famille " + name : name, kind, ids, reward: setReward(ids.length) + (legend ? 100 : 0), legend: legend || "" });
    };
    const group = (keyFn, prefix, kind, min, max, nameFn) => {
      const m = new Map();
      (list || []).forEach((c) => { const v = keyFn(c); if (!v && v !== 0) return; if (!m.has(v)) m.set(v, []); m.get(v).push(c.id); });
      m.forEach((ids, v) => { if (ids.length >= min && ids.length <= max) add(prefix + ":" + v, nameFn ? nameFn(v) : v, kind, ids, LEGENDS[prefix + ":" + v]); });
    };
    group((c) => countryOf(c.brand), "country", "country", 2, 400, (v) => (COUNTRIES.find((k) => k.id === v) || {}).label || v);
    group((c) => decadeOf(c) || "", "decade", "decade", 2, 400, (v) => decadeLabel(Number(v)));
    group((c) => String(c.brand || "").trim(), "brand", "brand", 3, 30);
    group((c) => String(c.category || "").trim(), "cat", "category", 3, 80);
    const rank = { country: 0, decade: 1, brand: 2, category: 3 };
    return out.sort((a, b) => rank[a.kind] - rank[b.kind] || a.ids.length - b.ids.length || (a.name < b.name ? -1 : 1));
  }

  // ------------------------------------------------------------------ niveaux de carte (cadre et effets, purement visuels)
  const LV_MAX = 5, LV_NAMES = ["", "Série", "Bronze", "Argent", "Or", "Platine"];
  const LV_BASE = [0, 0, 60, 150, 320, 650], LV_MUL = { common: 1, rare: 1.5, epic: 2, legendary: 3, shiny: 4, mythic: 4, special: 3 };
  /** coût en cristaux pour passer au niveau « to » (2 à 5) */
  const upgradeCost = (rar, to) => to >= 2 && to <= LV_MAX ? Math.round((LV_BASE[to] * (LV_MUL[rar] || 1)) / 5) * 5 : 0;

  // ------------------------------------------------------------------ boutique du jour et missions (identiques pour tous, tirées de la date)
  const OFFER_PCT = 30;
  /** offres du jour : un pack par pays à -30 % et une carte à prix réduit ; listes triées pour que site et serveur obtiennent le même résultat */
  function dailyOffers(day, list, rarities) {
    const h = hashStr("motorauto-offer-" + day), cs = COUNTRIES.map((k) => k.id);
    const ids = (list || []).map((c) => c.id).filter((id) => { const r = rarities.get(id); return r === "rare" || r === "epic" || r === "legendary"; }).sort();
    const cid = ids.length ? ids[hashStr("motorauto-offer-card-" + day) % ids.length] : "";
    const cost = cid ? Math.max(5, Math.round(RAR[rarities.get(cid)].craft * 0.7 / 5) * 5) : 0;
    return { pack: cs[h % cs.length], pct: OFFER_PCT, card: cid, cardCost: cost, cardFull: cid ? RAR[rarities.get(cid)].craft : 0 };
  }
  const offerPackCost = (id, pct) => Math.round((PACKS[id].cost * (100 - (pct || OFFER_PCT))) / 100 / 5) * 5;
  /** 3 missions courtes par jour : un pack de pays + deux autres */
  function dailyMissions(day) {
    const h = hashStr("motorauto-mission-" + day), k = COUNTRIES[h % COUNTRIES.length];
    const others = [
      { id: "m-open", type: "open", goal: 2, label: "Ouvre 2 packs (jour, bonus ou boutique)", reward: 30 },
      { id: "m-upgrade", type: "upgrade", goal: 1, label: "Améliore une carte", reward: 30 },
      { id: "m-offer", type: "offer", goal: 1, label: "Profite d'une offre du jour", reward: 25 },
      { id: "m-trade", type: "trade", goal: 1, label: "Réalise un échange de cartes", reward: 40 }
    ];
    const a = others.splice(Math.floor(h / 8) % others.length, 1)[0], b = others[Math.floor(h / 64) % others.length];
    return [{ id: "m-shop-" + k.id, type: "shop", country: k.id, goal: 1, label: "Ouvre un pack " + k.label, reward: 40 }, a, b];
  }

  // ------------------------------------------------------------------ fusion de cartes (5 doublons d'une rareté → 1 carte de la rareté au-dessus)
  const FUSE_COUNT = 5;
  const FUSE_NEXT = { common: "rare", rare: "epic", epic: "legendary" };

  // ------------------------------------------------------------------ marché de cartes entre pilotes (prix fixe, commission détruite)
  const MARKET_FEE = 0.10, MARKET_MAX_LISTINGS = 8;
  /** fourchette de prix autorisée par rareté (cristaux) : empêche les ventes à 1 cristal et les prix absurdes */
  const marketBounds = (rar) => { const r = RAR[rar] || RAR.common; return { min: Math.max(2, Math.round(r.dust * 0.8)), max: Math.max(50, (r.craft || r.dust * 6) * 3) }; };
  const marketNet = (price) => Math.floor(price * (1 - MARKET_FEE));

  // ------------------------------------------------------------------ familles de marques (badges) : « Peugeot Sport » compte pour Peugeot, etc.
  function familyOf(brand) {
    const b = String(brand || "").trim();
    if (/^(mercedes|sauber)/i.test(b)) return "Mercedes";
    if (/^peugeot/i.test(b)) return "Peugeot";
    if (/^renault/i.test(b)) return "Renault";
    if (/^citro/i.test(b)) return "Citroën";
    if (/^(nissan|datsun)/i.test(b)) return "Nissan";
    if (/^seat/i.test(b)) return "SEAT";
    return b;
  }

  // ------------------------------------------------------------------ aléa déterministe (le serveur rejoue le quiz pour vérifier les réponses)
  function seeded(seed) {
    let a = hashStr(String(seed)) >>> 0;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const fmt = (s, a) => String(s).replace(/\{(\d)\}/g, (m, i) => (a && a[i] !== undefined ? a[i] : m));

  // ------------------------------------------------------------------ Plus ou moins : deux voitures, laquelle a la plus grande valeur ?
  const PM_STATS = {
    power: { q: "Qui a le plus de chevaux ?", get: (c) => Number(c.power) || 0, unit: "ch", better: 1 },
    speed: { q: "Qui va le plus vite ? (vitesse maximale)", get: (c) => Number(c.speed) || 0, unit: "km/h", better: 1 },
    zero: { q: "Qui accélère le plus fort ? (0 à 100 km/h)", get: (c) => Number(c.zero) || 0, unit: "s", better: -1 },
    year: { q: "Laquelle est la plus récente ?", get: (c) => Number(c.year) || 0, unit: "", better: 1 }
  };
  const PM_KEYS = Object.keys(PM_STATS);
  /** tire une paire de voitures ; plus la série est longue, plus les deux valeurs sont proches (et de même catégorie).
   *  Renvoie { a, b, stat } (identifiants). */
  const PM_REL = [[0.08, 0.3], [0.07, 0.25], [0.035, 0.12], [0.015, 0.06], [0.006, 0.03]];   // écart relatif min/max par palier
  const PM_YEAR = [[8, 40], [5, 20], [3, 10], [2, 6], [1, 3]];                                  // écart d'années min/max par palier
  function pmLevel(streak) { const s = Number(streak) || 0; return s < 3 ? 0 : s < 6 ? 1 : s < 10 ? 2 : s < 15 ? 3 : 4; }
  function pmPair(list, rng, prev, streak) {
    const lv = pmLevel(streak), stat = PM_KEYS[Math.floor(rng() * PM_KEYS.length)], S = PM_STATS[stat], yr = stat === "year";
    const ok = list.filter((c) => S.get(c) > 0 && (!prev || (c.id !== prev.a && c.id !== prev.b)));
    if (ok.length < 2) return null;
    const lim = yr ? PM_YEAR[lv] : PM_REL[lv];
    const gap = (va, vb) => (yr ? Math.abs(va - vb) : Math.abs(va - vb) / Math.max(va, vb));
    for (let i = 0; i < 160; i++) {
      const a = ok[Math.floor(rng() * ok.length)], va = S.get(a);
      // à partir du palier 1, on cherche un adversaire de même catégorie (moins de repères évidents) ; on relâche si la liste est vide
      const sameCat = lv >= 1 && i < 100;
      const cand = ok.filter((c) => { if (c.id === a.id) return false; const vb = S.get(c); if (vb === va) return false; const g = gap(va, vb); return g >= lim[0] && g <= lim[1] && (!sameCat || (c.category && c.category === a.category)); });
      if (!cand.length) continue;
      const b = cand[Math.floor(rng() * cand.length)];
      return { a: a.id, b: b.id, stat };
    }
    return null;
  }
  /** 'a' ou 'b' : la voiture gagnante de la paire */
  function pmWinner(pair, byId) {
    const S = PM_STATS[pair.stat], a = byId.get(pair.a), b = byId.get(pair.b);
    if (!a || !b) return null;
    return (S.get(a) - S.get(b)) * S.better > 0 ? "a" : "b";
  }
  const PM_REWARDS = [[5, 8], [10, 20], [20, 45], [30, 80]];     // série atteinte → cristaux (une fois par série)
  const PM_DAILY_CAP = 100;

  // ------------------------------------------------------------------ quiz par niveau : questions automatiques (catalogue) + questions écrites
  const QCATS = { brands: "Marques", history: "Histoire", engines: "Moteurs", motorsport: "Sport auto", countries: "Pays et constructeurs", circuits: "Circuits et courses", numbers: "Chiffres", trivia: "Anecdotes et records", japan: "Japon", rally: "Rallye", ev: "Électrique et hybride" };
  const QLEVELS = { 1: "Facile", 2: "Moyen", 3: "Difficile", 4: "Expert" };
  // ---------------------------------------------------------------- saison : pass gratuit de 30 paliers, quêtes enchaînées, cosmétiques
  const SEASON_LEN = 31, DAY_MS = 86400000;   // une saison = un mois civil (heure de Paris) ; la saison 1 est novembre 2026
  const monthStartMs = (y, m) => { const key = y + "-" + String(m + 1).padStart(2, "0"); let t = Date.UTC(y, m, 1) - 3 * 3600000; while (dayKey(t).slice(0, 7) !== key) t += 1800000; return t; };
  const seasonInfo = (ms) => {
    const t = ms === undefined ? Date.now() : ms, k = dayKey(t), y = Number(k.slice(0, 4)), m = Number(k.slice(5, 7)) - 1;
    const n = Math.max(1, (y - 2026) * 12 + m - 9), start = monthStartMs(y, m), end = monthStartMs(m === 11 ? y + 1 : y, (m + 1) % 12);
    return { n, start, end, daysLeft: Math.max(1, Math.ceil((end - t) / DAY_MS)) };
  };
  const PASS_TIERS = 30, PASS_STEP = 50;                       // 50 points de saison par palier : 1 500 points pour tout débloquer
  /** points de saison : chaque action de jeu rapporte un peu, avec un plafond quotidien pour que rien ne se « farme » ;
   la visite du jour, les défis de la semaine, les albums et les succès ne comptent pas dans le plafond (ils sont rares) */
  const SEASON_PTS = { pack: 8, quizOk: 1, quizPerfect: 6, pmOk: 1, visit: 5, upgrade: 6, fuse: 10, craft: 4, trade: 8, duel: 3, challenge: 15, album: 40, badge: 10, contest: 20 };
  const SEASON_DAY_CAP = 60, SEASON_FREE = { visit: 1, challenge: 1, album: 1, badge: 1, contest: 1 };
  /** cosmétiques : cadres d'avatar et titres. src = niveau d'XP, succès, saison (paliers), top (classement mensuel) */
  const FRAMES = {
    bronze:   { name: "Bronze",       src: "level", v: 3,  color: "#c58a4a" },
    silver:   { name: "Argent",       src: "level", v: 6,  color: "#cfd6df" },
    gold:     { name: "Or",           src: "level", v: 10, color: "#f4c542" },
    neon:     { name: "Néon",         src: "level", v: 14, color: "#37e6ff" },
    flame:    { name: "Flamme",       src: "level", v: 18, color: "#ff5a1f" },
    platinum: { name: "Platine",      src: "level", v: 20, color: "#b9f2ff" },
    collector:{ name: "Collectionneur", src: "badge", v: "card100", color: "#b86bff" },
    s_gold:   { name: "Saison",       src: "tier", v: 15, color: "#ffb300" },
    s_royal:  { name: "Royal de saison", src: "tier", v: 30, color: "#ff3d81" },
    quest:    { name: "Quête de saison", src: "quest", v: 4, color: "#38ef7d" },
    podium:   { name: "Podium du mois", src: "top", v: 3, color: "#ffd700" }
  };
  const TITLES = {
    rookie:   { name: "Novice des circuits", src: "level", v: 2 },
    pilot:    { name: "Pilote confirmé",     src: "level", v: 5 },
    ace:      { name: "As du volant",        src: "level", v: 8 },
    legend:   { name: "Légende vivante",     src: "level", v: 12 },
    titan:    { name: "Titan de la route",   src: "level", v: 16 },
    ultimate: { name: "Ultime",              src: "level", v: 20 },
    curator:  { name: "Conservateur",        src: "badge", v: "card100" },
    quizzer:  { name: "Maître du quiz",      src: "badge", v: "quizP10" },
    t10:      { name: "Habitué de la saison", src: "tier", v: 10 },
    t20:      { name: "Vétéran de la saison", src: "tier", v: 20 },
    t30:      { name: "Champion du pass",     src: "tier", v: 30 },
    quest:    { name: "Briseur de quêtes",    src: "quest", v: 4 },
    top1:     { name: "Numéro 1 du mois",     src: "top", v: 1 },
    top3:     { name: "Sur le podium",        src: "top", v: 3 },
    clubwin:  { name: "Champion de club",     src: "clash", v: 1 }
  };
  /** récompense d'un palier : cristaux, pack bonus, gel de série, carte épique, cosmétique ; palier 30 = une Légendaire au choix */
  const PASS_SPECIAL = {
    5: { bonus: 1 }, 7: { freeze: 1 }, 10: { dust: 60, title: "t10" }, 12: { epic: 1 }, 17: { circuit: 1 }, 15: { bonus: 1, frame: "s_gold" }, 20: { epic: 1, title: "t20" },
    22: { freeze: 1 }, 25: { bonus: 2 }, 27: { circuit: 1 }, 30: { dust: 200, choice: "legendary", frame: "s_royal", title: "t30" }
  };
  function passReward(t) {
    const sp = PASS_SPECIAL[t] || null;
    return Object.assign({ dust: sp ? 0 : 20 + Math.floor((t - 1) / 4) * 10, bonus: 0, frame: "", title: "", freeze: 0, epic: 0, circuit: 0, choice: "" }, sp || {});
  }
  const passLabel = (r) => [r.dust ? r.dust + " cristaux" : "", r.bonus ? (r.bonus > 1 ? r.bonus + " packs bonus" : "1 pack bonus") : "", r.freeze ? "1 gel de série" : "", r.epic ? "1 carte Épique" : "", r.circuit ? "1 carte Circuit" : "", r.choice ? "1 Légendaire au choix" : "", r.frame ? "cadre " + FRAMES[r.frame].name : "", r.title ? "titre « " + TITLES[r.title].name + " »" : ""].filter(Boolean).join(" + ");
  /** trois Légendaires proposées (de préférence que le joueur n'a pas), identiques pour un joueur donné pendant toute la saison */
  function legendOffer(ids, rar, owned, uid, n) {
    const leg = ids.filter((id) => rar.get(id) === "legendary").sort(), fresh = leg.filter((id) => !(owned[id] > 0)), pool = (fresh.length >= 3 ? fresh : fresh.concat(leg.filter((id) => owned[id] > 0))).slice();
    const rnd = mulberry(hashStr("legend-" + uid + "-" + n));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const x = pool[i]; pool[i] = pool[j]; pool[j] = x; }
    return pool.slice(0, 3);
  }
  /** carte Épique du palier, tirée de façon stable (de préférence une carte que le joueur n'a pas) */
  function epicPick(ids, rar, owned, uid, n, t) {
    const all = ids.filter((id) => rar.get(id) === "epic").sort(), fresh = all.filter((id) => !(owned[id] > 0)), pool = fresh.length ? fresh : all;
    return pool.length ? pool[hashStr("epic-" + uid + "-" + n + "-" + t) % pool.length] : "";
  }
  /** carte Circuit (rare ou mieux) du palier, tirée de façon stable (de préférence une carte que le joueur n'a pas) */
  function circuitPick(rar, owned, uid, n, t) {
    const all = CIRCUIT_CARDS.map((r) => r[0]).filter((id) => ["rare", "epic", "legendary"].indexOf(rar.get(id) || "") >= 0).sort(), fresh = all.filter((id) => !(owned[id] > 0)), pool = fresh.length ? fresh : all;
    return pool.length ? pool[hashStr("circuit-" + uid + "-" + n + "-" + t) % pool.length] : "";
  }
  /** quêtes de saison enchaînées : on ne passe à l'étape suivante qu'après avoir terminé la précédente */
  const SEASON_QUESTS = [
    { id: "q1", label: "Ouvrir 10 packs", act: "packs", goal: 10, dust: 60 },
    { id: "q2", label: "Réussir 8 quiz", act: "quiz", goal: 8, dust: 80 },
    { id: "q3", label: "Réussir 25 bonnes réponses au Plus ou moins", act: "pm", goal: 25, dust: 100 },
    { id: "q4", label: "Te connecter 14 jours", act: "days", goal: 14, dust: 120 }
  ];
  const SEASON_QUEST_FINAL = { dust: 300, frame: "quest", title: "quest" };
  const blankSeason = (n) => ({ n, pts: 0, claimed: [], act: { packs: 0, quiz: 0, pm: 0, days: 0 }, q: 0, qDone: false, dayLog: "", dp: { d: "", p: 0 } });
  /** met à jour (et remet à zéro si nouvelle saison) l'état de saison du joueur ; retourne l'état */
  function seasonOf(d, ms) {
    const cur = seasonInfo(ms).n;
    if (!d.season || d.season.n !== cur) d.season = blankSeason(cur);
    if (!d.cosm) d.cosm = [];
    return d.season;
  }
  /** ajoute des points de saison ; « free » = hors plafond quotidien. Retourne les points réellement ajoutés. */
  function seasonAdd(d, pts, act, ms, free) {
    const s = seasonOf(d, ms); let add = Math.max(0, pts | 0);
    if (!free) {
      const day = dayKey(ms === undefined ? Date.now() : ms);
      if (!s.dp || s.dp.d !== day) s.dp = { d: day, p: 0 };
      add = Math.min(add, Math.max(0, SEASON_DAY_CAP - s.dp.p)); s.dp.p += add;
    }
    const before = s.pts; s.pts = Math.min(PASS_TIERS * PASS_STEP, s.pts + add); add = s.pts - before;
    const wk = weekKey(ms === undefined ? Date.now() : ms); if (!d.wpts || d.wpts.w !== wk) d.wpts = { w: wk, p: 0 }; d.wpts.p += add;   // points de la semaine (défi de clubs)
    if (act) Object.keys(act).forEach((k) => { s.act[k] = (s.act[k] || 0) + act[k]; });
    return add;
  }
  /** points de saison déjà gagnés aujourd'hui dans le plafond quotidien */
  const seasonToday = (d, ms) => { const s = seasonOf(d, ms), day = dayKey(ms === undefined ? Date.now() : ms); return s.dp && s.dp.d === day ? s.dp.p : 0; };
  const passTier = (s) => Math.min(PASS_TIERS, Math.floor((s.pts || 0) / PASS_STEP));
  /** étape de quête en cours : la progression est plafonnée à l'objectif, et ne compte qu'à partir de l'étape ouverte */
  function questState(s) {
    const q = SEASON_QUESTS[s.q];
    if (!q) return { done: true, step: SEASON_QUESTS.length };
    const base = (s.base && s.base[q.act]) || 0, prog = Math.min(q.goal, Math.max(0, (s.act[q.act] || 0) - base));
    return { done: false, step: s.q, quest: q, prog, ready: prog >= q.goal };
  }
  // gel de série : un gel offert par mois, jamais plus de 2 en stock
  const FREEZE_MAX = 2, FREEZE_COST = 150;
  const dayDiff = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / DAY_MS);
  const WELCOME = { dust: 100, bonus: 1 };
  /** éléments de cosmétique que le serveur seul peut accorder (saison) */
  function seasonCosm(d, ms) {
    const s = seasonOf(d, ms), have = d.cosm.slice(), t = passTier(s);
    for (let i = 1; i <= t; i++) { const r = passReward(i); if (s.claimed.indexOf(i) >= 0) { if (r.frame && have.indexOf("f:" + r.frame) < 0) have.push("f:" + r.frame); if (r.title && have.indexOf("t:" + r.title) < 0) have.push("t:" + r.title); } }
    return have;
  }

  const QUIZ_N = 10, QUIZ_REWARD = 3, QUIZ_DAILY_CAP = 60;       // 3 cristaux par bonne réponse, 60 par jour au maximum
  // [catégorie, niveau, question FR, [bonne, faux, faux, faux], question EN, [good, wrong, wrong, wrong]]
  const QBANK = [
    ["brands", 1, "Quelle marque utilise un logo à quatre anneaux ?", ["Audi", "BMW", "Peugeot", "Toyota"], "Which brand uses a four-ring logo?", ["Audi", "BMW", "Peugeot", "Toyota"]],
    ["brands", 1, "Quel animal figure sur le logo de Peugeot ?", ["Un lion", "Un taureau", "Un cheval", "Un jaguar"], "Which animal appears on the Peugeot logo?", ["A lion", "A bull", "A horse", "A jaguar"]],
    ["brands", 1, "Quelle marque française a pour emblème un losange ?", ["Renault", "Citroën", "Peugeot", "Alpine"], "Which French brand has a diamond as its emblem?", ["Renault", "Citroën", "Peugeot", "Alpine"]],
    ["brands", 1, "De quel pays vient la marque Toyota ?", ["Japon", "Corée du Sud", "Chine", "Taïwan"], "Which country does Toyota come from?", ["Japan", "South Korea", "China", "Taiwan"]],
    ["brands", 2, "Quelle marque produit les modèles « M » (M3, M5…) ?", ["BMW", "Mercedes-Benz", "Audi", "Alfa Romeo"], "Which brand makes the “M” models (M3, M5…)?", ["BMW", "Mercedes-Benz", "Audi", "Alfa Romeo"]],
    ["brands", 2, "Que signifie l'acronyme BMW ?", ["Bayerische Motoren Werke", "Bayerische Mobil Werke", "Berliner Motoren Werke", "Baden Motoren Werke"], "What does BMW stand for?", ["Bayerische Motoren Werke", "Bayerische Mobil Werke", "Berliner Motoren Werke", "Baden Motoren Werke"]],
    ["brands", 2, "Quelle marque porte sur son logo le Biscione, un serpent couronné ?", ["Alfa Romeo", "Lancia", "Fiat", "Maserati"], "Which brand shows the Biscione, a crowned serpent, on its badge?", ["Alfa Romeo", "Lancia", "Fiat", "Maserati"]],
    ["brands", 2, "Quelle marque a lancé la 205 GTI ?", ["Peugeot", "Renault", "Citroën", "Opel"], "Which brand launched the 205 GTI?", ["Peugeot", "Renault", "Citroën", "Opel"]],
    ["brands", 3, "Quelle marque est née en 1932 de la fusion de Horch, DKW, Wanderer et Audi ?", ["Auto Union", "Mercedes-Benz", "Opel", "Škoda"], "Which company was created in 1932 by merging Horch, DKW, Wanderer and Audi?", ["Auto Union", "Mercedes-Benz", "Opel", "Škoda"]],
    ["brands", 3, "Sous quel nom Nissan vendait-il ses voitures avant 1986 en Europe et au Japon ?", ["Datsun", "Subaru", "Isuzu", "Daihatsu"], "Under which name did Nissan sell many of its cars before 1986?", ["Datsun", "Subaru", "Isuzu", "Daihatsu"]],
    ["brands", 3, "Dans quelle ville est installée la marque Porsche ?", ["Stuttgart", "Munich", "Wolfsburg", "Ingolstadt"], "In which city is Porsche based?", ["Stuttgart", "Munich", "Wolfsburg", "Ingolstadt"]],
    ["brands", 3, "Quel constructeur a produit la Dauphine ?", ["Renault", "Simca", "Citroën", "Peugeot"], "Which carmaker built the Dauphine?", ["Renault", "Simca", "Citroën", "Peugeot"]],
    ["history", 1, "Quelle voiture française de 1948 à 1990 était surnommée « deux-chevaux » ?", ["Citroën 2CV", "Renault 4L", "Peugeot 203", "Simca 1000"], "Which French car built from 1948 to 1990 was nicknamed the “deux-chevaux”?", ["Citroën 2CV", "Renault 4L", "Peugeot 203", "Simca 1000"]],
    ["history", 1, "En quelle année est sortie la première Renault Twingo ?", ["1992", "1985", "1998", "2001"], "In which year did the first Renault Twingo appear?", ["1992", "1985", "1998", "2001"]],
    ["history", 1, "Sur quelle base est construite la première BMW M3 de 1986 ?", ["Série 3 E30", "Série 5 E28", "2002", "Z1"], "Which car is the original 1986 BMW M3 based on?", ["3 Series E30", "5 Series E28", "2002", "Z1"]],
    ["history", 1, "Quelle voiture a lancé la mode des compactes sportives « GTI » en 1976 ?", ["Volkswagen Golf", "Peugeot 205", "Renault 5", "Ford Fiesta"], "Which car started the “GTI” hot hatch craze in 1976?", ["Volkswagen Golf", "Peugeot 205", "Renault 5", "Ford Fiesta"]],
    ["history", 2, "Quelle voiture a gagné les 24 Heures du Mans 1991 avec un moteur rotatif ?", ["Mazda 787B", "Porsche 962", "Jaguar XJR-12", "Sauber C11"], "Which car won the 1991 24 Hours of Le Mans with a rotary engine?", ["Mazda 787B", "Porsche 962", "Jaguar XJR-12", "Sauber C11"]],
    ["history", 2, "Quelle marque a remporté le premier championnat du monde des rallyes constructeurs en 1973 ?", ["Alpine-Renault", "Lancia", "Ford", "Fiat"], "Which brand won the first World Rally Championship for manufacturers in 1973?", ["Alpine-Renault", "Lancia", "Ford", "Fiat"]],
    ["history", 2, "Quel modèle Mercedes de 1954 est célèbre pour ses portes papillon ?", ["300 SL", "190 SL", "220", "600"], "Which 1954 Mercedes model is famous for its gullwing doors?", ["300 SL", "190 SL", "220", "600"]],
    ["history", 2, "Qui a conçu la Mini originale de 1959 ?", ["Alec Issigonis", "Colin Chapman", "Gordon Murray", "Adrian Newey"], "Who designed the original 1959 Mini?", ["Alec Issigonis", "Colin Chapman", "Gordon Murray", "Adrian Newey"]],
    ["history", 3, "Quel pilote a été champion du monde des rallyes 1985 sur Peugeot 205 T16 ?", ["Timo Salonen", "Ari Vatanen", "Juha Kankkunen", "Walter Röhrl"], "Which driver won the 1985 World Rally Championship in a Peugeot 205 T16?", ["Timo Salonen", "Ari Vatanen", "Juha Kankkunen", "Walter Röhrl"]],
    ["history", 3, "Quelle voiture Renault a remplacé la Super 5 en 1990 ?", ["Clio", "Twingo", "Mégane", "Safrane"], "Which Renault replaced the Supercinq in 1990?", ["Clio", "Twingo", "Mégane", "Safrane"]],
    ["history", 3, "Qui a fondé la marque Alpine en 1955 ?", ["Jean Rédélé", "Amédée Gordini", "Louis Renault", "Ettore Bugatti"], "Who founded Alpine in 1955?", ["Jean Rédélé", "Amédée Gordini", "Louis Renault", "Ettore Bugatti"]],
    ["history", 3, "Quelle catégorie de rallye, la plus puissante de son temps, a été arrêtée après 1986 ?", ["Groupe B", "Groupe A", "Groupe N", "Groupe C"], "Which rally category, the most powerful of its time, was stopped after 1986?", ["Group B", "Group A", "Group N", "Group C"]],
    ["engines", 1, "Combien de cylindres a un moteur V8 ?", ["8", "6", "10", "12"], "How many cylinders does a V8 engine have?", ["8", "6", "10", "12"]],
    ["engines", 1, "Qu'utilise un turbocompresseur pour fonctionner ?", ["Les gaz d'échappement", "La batterie", "L'huile moteur", "L'eau de refroidissement"], "What does a turbocharger use to work?", ["Exhaust gases", "The battery", "Engine oil", "Coolant"]],
    ["engines", 1, "Que mesure-t-on dans « 0 à 100 km/h » ?", ["Le temps d'accélération", "La consommation", "La vitesse maximale", "La distance de freinage"], "What does “0 to 100 km/h” measure?", ["Acceleration time", "Fuel consumption", "Top speed", "Braking distance"]],
    ["engines", 1, "Quelle unité mesure le couple d'un moteur ?", ["Le newton-mètre", "Le kilowatt", "Le litre", "Le décibel"], "Which unit measures an engine's torque?", ["Newton-metre", "Kilowatt", "Litre", "Decibel"]],
    ["engines", 2, "Combien de cylindres a le moteur « flat-six » d'une Porsche 911 ?", ["6", "4", "8", "12"], "How many cylinders does the flat-six of a Porsche 911 have?", ["6", "4", "8", "12"]],
    ["engines", 2, "Quelle marque est célèbre pour son moteur rotatif Wankel ?", ["Mazda", "Honda", "Subaru", "Toyota"], "Which brand is famous for its Wankel rotary engine?", ["Mazda", "Honda", "Subaru", "Toyota"]],
    ["engines", 2, "Que fait le système VTEC de Honda ?", ["Il fait varier le calage et la levée des soupapes", "Il varie la géométrie du turbo", "Il injecte directement l'essence", "Il répartit la transmission intégrale"], "What does Honda's VTEC system do?", ["It varies valve timing and lift", "It varies the turbo geometry", "It injects fuel directly", "It splits the four-wheel drive"]],
    ["engines", 2, "Quelle disposition de moteur Subaru utilise-t-il sur la plupart de ses modèles ?", ["Boxer (à plat)", "V6", "En ligne", "Rotatif"], "Which engine layout does Subaru use on most of its models?", ["Boxer (flat)", "V6", "Inline", "Rotary"]],
    ["engines", 3, "Comment sont disposés les cylindres d'un moteur W12 ?", ["En W (deux V étroits accolés)", "En V à 60°", "À plat", "En ligne"], "How are the cylinders of a W12 engine arranged?", ["In a W (two narrow Vs side by side)", "In a 60° V", "Flat", "Inline"]],
    ["engines", 3, "Quel moteur équipait la Nissan Skyline GT-R R34 ?", ["RB26DETT", "2JZ-GTE", "4G63", "EJ207"], "Which engine powered the Nissan Skyline GT-R R34?", ["RB26DETT", "2JZ-GTE", "4G63", "EJ207"]],
    ["engines", 3, "Quel moteur équipait la Toyota Supra A80 Turbo ?", ["2JZ-GTE", "RB26DETT", "1JZ-GTE", "4A-GE"], "Which engine powered the Toyota Supra A80 Turbo?", ["2JZ-GTE", "RB26DETT", "1JZ-GTE", "4A-GE"]],
    ["engines", 3, "Que signifie « DOHC » ?", ["Double arbre à cames en tête", "Injection directe haute compression", "Hybride à double sortie", "Distribution hydraulique centralisée"], "What does “DOHC” stand for?", ["Double overhead camshaft", "Direct high-compression injection", "Dual-output hybrid", "Central hydraulic timing"]],
    ["motorsport", 1, "Quelle course d'endurance a lieu chaque année dans la Sarthe ?", ["Les 24 Heures du Mans", "Les Mille Miglia", "Le Dakar", "La Targa Florio"], "Which endurance race takes place every year in the Sarthe?", ["24 Hours of Le Mans", "Mille Miglia", "Dakar", "Targa Florio"]],
    ["motorsport", 1, "Quel drapeau annonce la fin d'une course ?", ["À damier", "Jaune", "Vert", "Bleu"], "Which flag signals the end of a race?", ["Chequered", "Yellow", "Green", "Blue"]],
    ["motorsport", 1, "Que signifie WRC ?", ["Championnat du monde des rallyes", "Coupe des routes de campagne", "Course mondiale des records", "Rallye des circuits"], "What does WRC stand for?", ["World Rally Championship", "Country Roads Cup", "World Records Contest", "Circuit Rally"]],
    ["motorsport", 1, "Combien de roues motrices a une voiture « intégrale » ?", ["4", "2", "3", "6"], "How many driven wheels does an all-wheel-drive car have?", ["4", "2", "3", "6"]],
    ["motorsport", 2, "Quel constructeur a le plus de victoires au classement général des 24 Heures du Mans ?", ["Porsche", "Audi", "Ferrari", "Jaguar"], "Which manufacturer has the most overall wins at the 24 Hours of Le Mans?", ["Porsche", "Audi", "Ferrari", "Jaguar"]],
    ["motorsport", 2, "Quel pilote français a été neuf fois champion du monde des rallyes ?", ["Sébastien Loeb", "Sébastien Ogier", "Didier Auriol", "Bruno Saby"], "Which French driver won nine World Rally Championships?", ["Sébastien Loeb", "Sébastien Ogier", "Didier Auriol", "Bruno Saby"]],
    ["motorsport", 2, "Quel circuit est surnommé « l'Enfer vert » ?", ["Nürburgring Nordschleife", "Spa-Francorchamps", "Monza", "Suzuka"], "Which circuit is nicknamed the “Green Hell”?", ["Nürburgring Nordschleife", "Spa-Francorchamps", "Monza", "Suzuka"]],
    ["motorsport", 2, "Qu'est-ce que le Groupe B en rallye ?", ["Les voitures très puissantes des années 1980", "Les voitures de série", "Les prototypes d'endurance", "Les monoplaces"], "What was Group B in rallying?", ["Very powerful cars of the 1980s", "Standard road cars", "Endurance prototypes", "Single-seaters"]],
    ["motorsport", 3, "Quelle voiture a gagné les 24 Heures du Mans 1995 ?", ["McLaren F1 GTR", "Porsche 911 GT1", "Ferrari F40", "Nissan R390"], "Which car won the 1995 24 Hours of Le Mans?", ["McLaren F1 GTR", "Porsche 911 GT1", "Ferrari F40", "Nissan R390"]],
    ["motorsport", 3, "Sur quelle voiture Sébastien Loeb a-t-il décroché ses premiers titres mondiaux ?", ["Citroën Xsara WRC", "Peugeot 206 WRC", "Subaru Impreza", "Ford Focus WRC"], "Which car did Sébastien Loeb use for his first world titles?", ["Citroën Xsara WRC", "Peugeot 206 WRC", "Subaru Impreza", "Ford Focus WRC"]],
    ["motorsport", 3, "Quelle voiture a gagné de justesse les 24 Heures du Mans 1969 ?", ["Ford GT40", "Ferrari 330 P4", "Matra MS670", "Jaguar D-Type"], "Which car narrowly won the 1969 24 Hours of Le Mans?", ["Ford GT40", "Ferrari 330 P4", "Matra MS670", "Jaguar D-Type"]],
    ["motorsport", 3, "Comment s'appelait la célèbre ligne droite de 6 km du circuit du Mans ?", ["Les Hunaudières", "Le Mulsanne Arrow", "La Sarthe Express", "Tertre Rouge"], "What was the famous 6 km straight of the Le Mans circuit called?", ["The Hunaudières", "The Mulsanne Arrow", "The Sarthe Express", "Tertre Rouge"]]
  ];

  const Q = (c, l, f, fo, e, eo) => [c, l, f, fo, e, eo || fo];
  QBANK.push(
Q("japan", 1, "Quelle marque japonaise utilise un logo à trois ellipses entrelacées ?", ["Toyota", "Mazda", "Nissan", "Honda"], "Which Japanese brand uses a logo made of three interlocking ovals?"),
Q("japan", 1, "Quelle marque japonaise a pour emblème un ensemble d'étoiles inspiré des Pléiades ?", ["Subaru", "Suzuki", "Mitsubishi", "Daihatsu"], "Which Japanese brand has a star cluster inspired by the Pleiades as its emblem?"),
Q("japan", 1, "Quel constructeur a créé le roadster MX-5 ?", ["Mazda", "Honda", "Toyota", "Nissan"], "Which carmaker created the MX-5 roadster?"),
Q("japan", 1, "Quelle marque japonaise a lancé la Prius, la première hybride de grande série ?", ["Toyota", "Honda", "Nissan", "Mazda"], "Which Japanese brand launched the Prius, the first mass-produced hybrid?"),
Q("japan", 1, "Quelle voiture japonaise est surnommée « Godzilla » ?", ["Nissan Skyline GT-R", "Toyota Supra", "Honda NSX", "Mazda RX-7"], "Which Japanese car is nicknamed “Godzilla”?"),
Q("japan", 1, "Combien de losanges comporte le logo Mitsubishi ?", ["3", "2", "4", "5"], "How many diamonds are on the Mitsubishi logo?"),
Q("japan", 1, "Quelle Toyota, surnommée AE86, est devenue célèbre grâce au manga Initial D ?", ["La Sprinter Trueno", "La Celica", "La Starlet", "La MR2"], "Which Toyota, known as the AE86, became famous through the manga Initial D?", ["The Sprinter Trueno", "The Celica", "The Starlet", "The MR2"]),
Q("japan", 1, "Quel circuit japonais accueille le Grand Prix de Formule 1 ?", ["Suzuka", "Fuji", "Motegi", "Okayama"], "Which Japanese circuit hosts the Formula 1 Grand Prix?"),
Q("japan", 1, "Lexus est la marque de luxe de quel constructeur ?", ["Toyota", "Honda", "Nissan", "Mazda"], "Lexus is the luxury brand of which carmaker?"),
Q("japan", 1, "Quelle marque produit le petit 4x4 Jimny ?", ["Suzuki", "Daihatsu", "Subaru", "Isuzu"], "Which brand makes the small Jimny 4x4?"),
Q("japan", 1, "Quelle marque japonaise produit la Civic Type R ?", ["Honda", "Toyota", "Subaru", "Mitsubishi"], "Which Japanese brand makes the Civic Type R?"),
Q("japan", 1, "Quelle marque japonaise fabrique l'Impreza WRX ?", ["Subaru", "Mitsubishi", "Mazda", "Suzuki"], "Which Japanese brand makes the Impreza WRX?"),
Q("japan", 1, "Quelle voiture est la plus vendue de l'histoire, avec plus de 50 millions d'exemplaires ?", ["Toyota Corolla", "Volkswagen Golf", "Ford Fiesta", "Honda Civic"], "Which car is the best-selling of all time, with over 50 million built?"),
Q("japan", 1, "Quelle marque japonaise propose la Leaf, une des premières électriques populaires ?", ["Nissan", "Toyota", "Honda", "Mazda"], "Which Japanese brand makes the Leaf, one of the first popular electric cars?"),
Q("japan", 1, "Quelle marque japonaise porte le nom de son fondateur Soichiro ?", ["Honda", "Toyota", "Suzuki", "Mazda"], "Which Japanese brand carries the name of its founder Soichiro?"),
Q("japan", 1, "Dans quel pays est née la discipline du drift ?", ["Japon", "États-Unis", "Royaume-Uni", "Australie"], "In which country did drifting begin?"),
Q("japan", 1, "Quelle voiture japonaise sportive est une Nissan Z ?", ["La Fairlady Z", "La Silvia", "La Cube", "La Micra"], "Which Japanese sports car is a Nissan Z?", ["The Fairlady Z", "The Silvia", "The Cube", "The Micra"]),
Q("japan", 1, "Quelle marque japonaise produit la Swift Sport et la Vitara ?", ["Suzuki", "Subaru", "Isuzu", "Daihatsu"], "Which Japanese brand makes the Swift Sport and the Vitara?"),
Q("japan", 1, "Quel jeu vidéo de course, créé au Japon sur PlayStation, est célèbre pour son réalisme ?", ["Gran Turismo", "Need for Speed", "Forza", "Ridge Racer"], "Which racing video game, created in Japan for PlayStation, is famous for its realism?"),
Q("japan", 1, "Que signifie « kei car » au Japon ?", ["Une toute petite voiture à cylindrée limitée", "Une voiture de course", "Une voiture de luxe", "Un utilitaire lourd"], "What is a “kei car” in Japan?", ["A very small car with a limited engine size", "A race car", "A luxury car", "A heavy utility vehicle"]),
Q("japan", 2, "Quelle cylindrée maximale pour une kei car japonaise ?", ["660 cm³", "1 000 cm³", "1 500 cm³", "400 cm³"], "What is the maximum engine size of a Japanese kei car?"),
Q("japan", 2, "Quel circuit japonais est célèbre pour son tracé en forme de huit ?", ["Suzuka", "Fuji", "Tsukuba", "Autopolis"], "Which Japanese circuit is famous for its figure-eight layout?"),
Q("japan", 2, "Quelle voiture japonaise a remporté les 24 Heures du Mans 1991 ?", ["Mazda 787B", "Nissan R90CK", "Toyota 91C-V", "Honda NSX GT2"], "Which Japanese car won the 1991 24 Hours of Le Mans?"),
Q("japan", 2, "En quelle année Toyota a-t-il gagné pour la première fois les 24 Heures du Mans ?", ["2018", "1999", "2012", "2021"], "In which year did Toyota win the 24 Hours of Le Mans for the first time?"),
Q("japan", 2, "Que signifie VTEC chez Honda ?", ["Distribution variable des soupapes à commande électronique", "Turbo à géométrie variable", "Transmission à quatre roues", "Traction électronique contrôlée"], "What does VTEC mean at Honda?", ["Variable valve timing and lift electronic control", "Variable-geometry turbo", "Four-wheel transmission", "Electronically controlled traction"]),
Q("japan", 2, "Quelle voiture a donné à Datsun son image sportive en 1969 ?", ["La 240Z", "La Sunny", "La Bluebird", "La Cherry"], "Which car gave Datsun its sporty image in 1969?", ["The 240Z", "The Sunny", "The Bluebird", "The Cherry"]),
Q("japan", 2, "Quel pilote britannique a été le premier à devenir champion du monde des rallyes sur Subaru, en 1995 ?", ["Colin McRae", "Richard Burns", "Petter Solberg", "Tommi Mäkinen"], "Which British driver became world rally champion with Subaru in 1995?"),
Q("japan", 2, "Dans quelle préfecture se trouve Toyota City, berceau du constructeur ?", ["Aichi", "Hiroshima", "Osaka", "Kanagawa"], "In which prefecture is Toyota City, the carmaker's home, located?"),
Q("japan", 2, "Quelle marque est installée à Hiroshima ?", ["Mazda", "Honda", "Subaru", "Suzuki"], "Which brand is based in Hiroshima?"),
Q("japan", 2, "Quelle voiture a lancé la marque de luxe Infiniti, de Nissan, en 1989 ?", ["La Q45", "La GT-R", "La Skyline", "La Maxima"], "Which car launched Nissan's luxury brand Infiniti in 1989?", ["The Q45", "The GT-R", "The Skyline", "The Maxima"]),
Q("japan", 2, "Quelle marque japonaise a lancé la Honda e, petite électrique au style rétro ?", ["Honda", "Mazda", "Nissan", "Toyota"], "Which Japanese brand launched the Honda e, a small electric car with retro styling?"),
Q("japan", 2, "Quelle série de courses japonaise de voitures GT est la plus populaire du pays ?", ["Super GT", "Super Formula", "D1 Grand Prix", "Super Taikyu"], "Which Japanese GT racing series is the most popular in the country?"),
Q("japan", 2, "Quelle marque japonaise fabrique les camions et pick-up D-Max ?", ["Isuzu", "Hino", "Mitsubishi Fuso", "UD"], "Which Japanese brand makes the D-Max pick-up?"),
Q("japan", 2, "Quelle Toyota sportive a deux places et un moteur central ?", ["La MR2", "La Celica", "La Supra", "La GT86"], "Which sporty Toyota is a two-seater with a mid-mounted engine?"),
Q("japan", 2, "Quel est le nom de la compacte hybride de Honda lancée en 1999 aux États-Unis ?", ["Insight", "Prius", "Fit", "Accord"], "What was Honda's hybrid launched in the US in 1999 called?"),
Q("japan", 2, "Quelle Mazda a un moteur rotatif et des portes arrière à ouverture inversée ?", ["La RX-8", "La MX-5", "La CX-5", "La 323"], "Which Mazda has a rotary engine and rear-hinged back doors?", ["The RX-8", "The MX-5", "The CX-5", "The 323"]),
Q("japan", 3, "Quelle marque japonaise a produit la 2000GT, vue dans un film de James Bond en 1967 ?", ["Toyota", "Nissan", "Mazda", "Honda"], "Which Japanese brand built the 2000GT, seen in a 1967 James Bond film?"),
Q("japan", 3, "Quel pilote de F1 a été conseiller sur le développement de la Honda NSX d'origine ?", ["Ayrton Senna", "Alain Prost", "Nelson Piquet", "Nigel Mansell"], "Which F1 driver advised on the development of the original Honda NSX?"),
Q("japan", 3, "Quel moteur équipait la Nissan Skyline GT-R R34 ?", ["RB26DETT", "2JZ-GTE", "SR20DET", "13B-REW"], "Which engine powered the Nissan Skyline GT-R R34?"),
Q("japan", 3, "Quelle puissance officielle les constructeurs japonais s'imposaient-ils par « accord de gentlemen » à partir de 1989 ?", ["280 ch", "200 ch", "350 ch", "400 ch"], "What official power figure did Japanese carmakers hold to under a “gentlemen's agreement” from 1989?"),
Q("japan", 3, "Que signifie STI dans Subaru STI ?", ["Subaru Tecnica International", "Sport Turbo Injection", "Super Touring Impreza", "Subaru Traction Intégrale"], "What does STI stand for in Subaru STI?"),
Q("japan", 3, "Que signifie Nismo ?", ["Nissan Motorsport International", "Nissan Moteur Sport", "Nouvelle Idée Sportive Moderne", "Nissan Modèle Spécial"], "What does Nismo stand for?"),
Q("japan", 3, "Quelle marque a créé le premier moteur rotatif de série à deux rotors dans la Cosmo Sport de 1967 ?", ["Mazda", "Nissan", "Toyota", "Suzuki"], "Which brand built the first two-rotor production rotary engine in the 1967 Cosmo Sport?"),
Q("japan", 3, "Quel pilote finlandais a été quatre fois champion du monde des rallyes sur Mitsubishi Lancer Evo, de 1996 à 1999 ?", ["Tommi Mäkinen", "Juha Kankkunen", "Marcus Grönholm", "Timo Salonen"], "Which Finnish driver won four world rally titles in a Mitsubishi Lancer Evo from 1996 to 1999?"),
Q("japan", 3, "Quel pilote espagnol a été champion du monde des rallyes en 1990 et 1992 sur Toyota Celica GT-Four ?", ["Carlos Sainz", "Jesús Puras", "Luis Moya", "Daniel Sordo"], "Which Spanish driver won the 1990 and 1992 world rally titles in a Toyota Celica GT-Four?"),
Q("japan", 3, "Quel moteur 3,0 L six cylindres en ligne équipait la Toyota Supra A80 ?", ["2JZ-GTE", "1JZ-GTE", "RB26DETT", "4A-GE"], "Which 3.0-litre inline-six powered the Toyota Supra A80?"),
Q("japan", 3, "Quelle est la méthode d'amélioration continue célèbre chez Toyota ?", ["Kaizen", "Ikigai", "Bushido", "Origami"], "What is Toyota's famous continuous-improvement method called?"),
Q("japan", 3, "Quelle marque japonaise est issue d'un fabricant d'avions, Nakajima ?", ["Subaru", "Mazda", "Suzuki", "Isuzu"], "Which Japanese brand grew out of the aircraft maker Nakajima?"),
Q("japan", 3, "Quelle marque appartient au groupe Toyota et construit de petites voitures et des kei cars ?", ["Daihatsu", "Suzuki", "Mazda", "Subaru"], "Which brand belongs to Toyota and builds small cars and kei cars?"),
Q("japan", 3, "Quelle alliance a été scellée en 1999 entre Nissan et un constructeur français ?", ["Renault-Nissan", "Peugeot-Nissan", "Citroën-Nissan", "Alpine-Nissan"], "Which alliance was sealed in 1999 between Nissan and a French carmaker?"),
Q("japan", 3, "Quel modèle de Mazda s'est vendu à plus de 1 million d'exemplaires et détient le record du roadster deux places le plus vendu ?", ["MX-5 Miata", "RX-7", "Cosmo", "Eunos"], "Which Mazda sold over a million units and holds the record as the best-selling two-seat roadster?"),
Q("japan", 3, "Quelle course Mitsubishi a-t-elle gagnée douze fois avec le Pajero (Montero) ?", ["Le Dakar", "Le Monte-Carlo", "Le Safari", "Le Tour de Corse"], "Which event did Mitsubishi win twelve times with the Pajero (Montero)?", ["The Dakar", "Monte Carlo", "The Safari", "Tour de Corse"]),
Q("japan", 3, "Quelle voiture Honda de 1992 est la première à porter le badge Type R ?", ["La NSX-R", "La Civic Type R", "L'Integra Type R", "La S2000"], "Which 1992 Honda was the first to wear the Type R badge?", ["The NSX-R", "The Civic Type R", "The Integra Type R", "The S2000"]),
Q("japan", 3, "Quel moteur de 2,0 L, 4 cylindres, de la Honda S2000 tourne jusqu'à 9 000 tr/min ?", ["F20C", "K20A", "B18C", "H22A"], "Which 2.0-litre four-cylinder in the Honda S2000 revs up to 9,000 rpm?"),
Q("japan", 3, "Quelle marque a conçu la technologie Skyactiv ?", ["Mazda", "Subaru", "Nissan", "Honda"], "Which brand developed Skyactiv technology?"),
Q("japan", 4, "Quelle marque a d'abord fabriqué la Skyline avant sa fusion avec Nissan en 1966 ?", ["Prince Motor Company", "Hino", "Isuzu", "Datsun"], "Which company first built the Skyline before merging with Nissan in 1966?"),
Q("japan", 4, "Quelle voiture japonaise de Le Mans 1997 était la Nissan R390 GT1 ?", ["Une GT1 de route homologuée", "Un proto LMP1", "Une GT2", "Une voiture de série"], "What kind of car was the Nissan R390 GT1 of Le Mans 1997?", ["A road-homologated GT1", "An LMP1 prototype", "A GT2", "A production car"]),
Q("japan", 4, "Quelle voiture Toyota a terminé deuxième aux 24 Heures du Mans 1999 ?", ["TS020 GT-One", "TS050", "Supra GT500", "Celica GT-Four"], "Which Toyota finished second at the 1999 24 Hours of Le Mans?"),
Q("japan", 4, "Quel moteur à 4 rotors équipait la Mazda 787B ?", ["R26B", "13B", "20B", "12A"], "Which four-rotor engine powered the Mazda 787B?"),
Q("japan", 4, "Combien de Lexus LFA ont été produites, avec son V10 de 4,8 L ?", ["500", "1 000", "250", "2 000"], "How many Lexus LFAs, with their 4.8-litre V10, were built?"),
Q("japan", 4, "Quelle voiture, surnommée « Devil Z », est la star du manga Wangan Midnight ?", ["Nissan Fairlady Z S30", "Toyota Supra A80", "Mazda RX-7 FD", "Honda NSX"], "Which car, nicknamed the “Devil Z”, is the star of the manga Wangan Midnight?"),
Q("japan", 4, "Quelle entreprise, fondée sous le nom de Toyo Cork Kogyo, est devenue un constructeur automobile ?", ["Mazda", "Suzuki", "Subaru", "Isuzu"], "Which company, founded as Toyo Cork Kogyo, became a carmaker?"),
Q("japan", 4, "Quelle petite Toyota sportive de 1965 avait un bicylindre à plat d'environ 800 cm³ ?", ["Sports 800", "Publica", "2000GT", "Corona"], "Which small 1965 Toyota sports car had a flat-twin of about 800 cc?"),
Q("japan", 4, "Quelle voiture a été fabriquée par Mitsubishi avec une traction intégrale et quatre roues directrices en 1990 ?", ["La 3000GT (GTO)", "La Eclipse", "La Colt", "La Galant VR-4"], "Which Mitsubishi had all-wheel drive and four-wheel steering in 1990?", ["The 3000GT (GTO)", "The Eclipse", "The Colt", "The Galant VR-4"]),
Q("japan", 4, "Quelle voiture Honda de 1963 est le tout premier modèle automobile de la marque ?", ["La T360 (mini-camion)", "La S500", "La N360", "La Civic"], "Which 1963 Honda was the brand's very first automobile?", ["The T360 (mini-truck)", "The S500", "The N360", "The Civic"]),
Q("japan", 4, "Quelle voiture Suzuki a lancé en 1955 le segment des kei cars modernes ?", ["La Suzulight", "La Alto", "La Cappuccino", "La Jimny"], "Which 1955 Suzuki launched the modern kei car segment?", ["The Suzulight", "The Alto", "The Cappuccino", "The Jimny"]),
Q("japan", 4, "Quel circuit japonais, au pied du Mont Fuji, a accueilli le GP de F1 en 1976 et 1977 ?", ["Fuji Speedway", "Suzuka", "Tsukuba", "Sugo"], "Which Japanese circuit at the foot of Mount Fuji hosted the F1 Grand Prix in 1976 and 1977?"),
Q("japan", 4, "Quel moteur équipe l'AE86 de Takumi Fujiwara dans Initial D ?", ["Le 4A-GE", "Le 2JZ", "Le SR20", "Le 13B"], "Which engine powers Takumi Fujiwara's AE86 in Initial D?", ["The 4A-GE", "The 2JZ", "The SR20", "The 13B"]),
Q("ev", 1, "Quelle marque produit la Model 3 et la Model Y ?", ["Tesla", "Rivian", "Polestar", "Lucid"], "Which brand makes the Model 3 and the Model Y?"),
Q("ev", 1, "Quelle unité mesure l'énergie stockée dans une batterie de voiture électrique ?", ["Le kilowattheure (kWh)", "Le newton-mètre", "Le litre", "Le décibel"], "Which unit measures the energy stored in an electric car battery?", ["The kilowatt-hour (kWh)", "The newton-metre", "The litre", "The decibel"]),
Q("ev", 1, "Que signifie « hybride rechargeable » ?", ["On peut brancher la voiture pour recharger sa batterie", "La voiture roule uniquement à l'essence", "La voiture se recharge au soleil", "La voiture roule à l'hydrogène"], "What does “plug-in hybrid” mean?", ["You can plug the car in to recharge its battery", "The car only runs on petrol", "The car recharges with sunlight", "The car runs on hydrogen"]),
Q("ev", 1, "Quelle citadine électrique de Renault est sortie en 2012 ?", ["La Zoe", "La Twingo", "La Clio", "La Mégane"], "Which electric city car did Renault launch in 2012?", ["The Zoe", "The Twingo", "The Clio", "The Mégane"]),
Q("ev", 1, "Quelle citadine électrique Renault reprend le nom d'un modèle des années 1970 ?", ["La Renault 5", "La Renault 4", "La Renault 12", "La Renault 16"], "Which electric Renault city car revives the name of a 1970s model?", ["The Renault 5", "The Renault 4", "The Renault 12", "The Renault 16"]),
Q("ev", 1, "Qu'est-ce que le freinage régénératif ?", ["Il récupère de l'énergie au freinage pour la batterie", "Il refroidit les freins", "Il bloque les roues", "Il double la puissance"], "What is regenerative braking?", ["It recovers energy when braking to charge the battery", "It cools the brakes", "It locks the wheels", "It doubles the power"]),
Q("ev", 1, "Quel est le principal métal des batteries lithium-ion ?", ["Le lithium", "Le plomb", "Le cuivre", "Le sodium"], "Which metal gives lithium-ion batteries their name?", ["Lithium", "Lead", "Copper", "Sodium"]),
Q("ev", 1, "Combien d'émissions de CO₂ à l'échappement une voiture 100 % électrique produit-elle ?", ["Aucune", "La moitié d'une essence", "Autant qu'une diesel", "Un peu moins"], "How much CO₂ does a fully electric car emit from the tailpipe?", ["None", "Half of a petrol car", "As much as a diesel", "A bit less"]),
Q("ev", 1, "De quel inventeur Tesla porte-t-il le nom ?", ["Nikola Tesla", "Thomas Edison", "Alexander Bell", "Henry Ford"], "After which inventor is Tesla named?"),
Q("ev", 1, "Comment exprime-t-on la consommation d'une voiture électrique ?", ["En kWh pour 100 km", "En litres pour 100 km", "En tours par minute", "En mètres par seconde"], "How is the consumption of an electric car expressed?", ["In kWh per 100 km", "In litres per 100 km", "In revolutions per minute", "In metres per second"]),
Q("ev", 1, "Comment s'appelle le réseau de bornes de recharge rapide de Tesla ?", ["Superchargeur", "Ionity", "Fastned", "Allego"], "What is Tesla's fast-charging network called?", ["Supercharger", "Ionity", "Fastned", "Allego"]),
Q("ev", 1, "Quelle voiture électrique de Nissan est l'une des plus vendues au monde depuis 2010 ?", ["La Leaf", "La Juke", "La Micra", "La Qashqai"], "Which Nissan electric car has been one of the world's best sellers since 2010?", ["The Leaf", "The Juke", "The Micra", "The Qashqai"]),
Q("ev", 1, "Quel constructeur a lancé la Prius, la première hybride populaire ?", ["Toyota", "Ford", "Volkswagen", "Peugeot"], "Which carmaker launched the Prius, the first popular hybrid?"),
Q("ev", 1, "Quelle unité exprime la puissance d'une borne de recharge ?", ["Le kilowatt (kW)", "Le volt-ampère-heure", "Le décibel", "Le litre"], "Which unit gives the power of a charging point?", ["The kilowatt (kW)", "The volt-ampere hour", "The decibel", "The litre"]),
Q("ev", 1, "Quelle voiture électrique est la plus petite et sans permis, vendue par Citroën ?", ["L'Ami", "La C3", "La C1", "La ë-C4"], "Which tiny licence-free electric car does Citroën sell?", ["The Ami", "The C3", "The C1", "The ë-C4"]),
Q("ev", 1, "Quelle voiture électrique abordable de Dacia est sortie en 2021 ?", ["La Spring", "La Sandero", "La Duster", "La Jogger"], "Which affordable electric Dacia came out in 2021?", ["The Spring", "The Sandero", "The Duster", "The Jogger"]),
Q("ev", 1, "Pourquoi une voiture électrique est-elle silencieuse ?", ["Il n'y a pas de moteur thermique", "Elle est plus légère", "Elle roule moins vite", "Elle a des pneus spéciaux"], "Why is an electric car quiet?", ["It has no combustion engine", "It is lighter", "It is slower", "It has special tyres"]),
Q("ev", 1, "Quelle marque suédoise de voitures électriques est liée à Volvo ?", ["Polestar", "Koenigsegg", "Saab", "Scania"], "Which Swedish electric brand is linked to Volvo?"),
Q("ev", 1, "Quel acronyme désigne une voiture 100 % électrique à batterie ?", ["BEV", "PHEV", "MHEV", "ICE"], "Which acronym denotes a fully battery-electric vehicle?"),
Q("ev", 2, "Que signifie PHEV ?", ["Plug-in Hybrid Electric Vehicle", "Petrol Hybrid Engine Vehicle", "Power Hybrid Energy Version", "Pure Hydrogen Electric Vehicle"], "What does PHEV stand for?"),
Q("ev", 2, "Quel constructeur chinois, dont le nom signifie « Build Your Dreams », est un géant des batteries et des voitures électriques ?", ["BYD", "NIO", "Geely", "Chery"], "Which Chinese maker, whose name means “Build Your Dreams”, is a giant of batteries and electric cars?"),
Q("ev", 2, "Quel est le nom de la première Porsche 100 % électrique ?", ["Taycan", "Macan", "Cayenne", "Panamera"], "What is the first fully electric Porsche called?"),
Q("ev", 2, "Quel cycle d'homologation mesure l'autonomie officielle en Europe ?", ["WLTP", "NEDC", "EPA", "CAFE"], "Which test cycle measures official range in Europe?", ["WLTP", "NEDC", "EPA", "CAFE"]),
Q("ev", 2, "Quel championnat de monoplaces électriques a débuté en 2014 ?", ["La Formule E", "La Formule 2", "L'IndyCar", "La W Series"], "Which electric single-seater championship began in 2014?", ["Formula E", "Formula 2", "IndyCar", "W Series"]),
Q("ev", 2, "Quelle voiture à pile à combustible, fonctionnant à l'hydrogène, est produite par Toyota ?", ["La Mirai", "La Prius", "La Yaris", "La Supra"], "Which hydrogen fuel-cell car does Toyota make?", ["The Mirai", "The Prius", "The Yaris", "The Supra"]),
Q("ev", 2, "Que rejette une voiture à hydrogène à l'échappement ?", ["De la vapeur d'eau", "Du CO₂", "Du méthane", "De l'ozone"], "What does a hydrogen car emit from the tailpipe?", ["Water vapour", "CO₂", "Methane", "Ozone"]),
Q("ev", 2, "Pourquoi une voiture électrique accélère-t-elle fort dès le départ ?", ["Le couple maximal est disponible dès l'arrêt", "Elle est très légère", "Elle a beaucoup de vitesses", "Elle a un turbo"], "Why does an electric car accelerate hard from a standstill?", ["Maximum torque is available from zero rpm", "It is very light", "It has many gears", "It has a turbo"]),
Q("ev", 2, "Quelle boîte de vitesses équipe la plupart des voitures électriques ?", ["Un seul rapport de réduction", "Une boîte à 6 vitesses manuelle", "Une boîte robotisée à 8 rapports", "Une boîte à variation continue"], "Which gearbox do most electric cars use?", ["A single-speed reduction", "A 6-speed manual", "An 8-speed automated", "A continuously variable one"]),
Q("ev", 2, "Quelle marque croate a conçu l'hypercar électrique Nevera ?", ["Rimac", "Pininfarina", "Lucid", "Koenigsegg"], "Which Croatian brand built the Nevera electric hypercar?"),
Q("ev", 2, "Quel constructeur américain propose la Mustang Mach-E ?", ["Ford", "Chevrolet", "Dodge", "Tesla"], "Which American maker offers the Mustang Mach-E?"),
Q("ev", 2, "Quelle recharge est la plus rapide ?", ["En courant continu (DC), à une borne rapide", "Sur une prise domestique", "En courant alternatif lent à 3 kW", "Par induction domestique"], "Which charging is the fastest?", ["Direct current (DC) at a fast charger", "From a household socket", "Slow 3 kW alternating current", "Home induction"]),
Q("ev", 2, "Quelle citadine électrique Peugeot est basée sur la 208 ?", ["La e-208", "La e-2008", "La e-Rifter", "La e-Traveller"], "Which electric Peugeot supermini is based on the 208?", ["The e-208", "The e-2008", "The e-Rifter", "The e-Traveller"]),
Q("ev", 2, "Quel est le nom de la petite électrique Fiat au look rétro ?", ["La 500e", "La Panda EV", "La Tipo e", "La Punto e"], "What is the small retro-styled electric Fiat called?", ["The 500e", "The Panda EV", "The Tipo e", "The Punto e"]),
Q("ev", 2, "Quel constructeur américain a lancé le pick-up électrique Cybertruck ?", ["Tesla", "Ford", "Rivian", "GMC"], "Which American maker launched the Cybertruck electric pick-up?"),
Q("ev", 2, "En quelle année la Formule E a-t-elle disputé sa première course, à Pékin ?", ["2014", "2008", "2011", "2018"], "In which year did Formula E hold its first race, in Beijing?"),
Q("ev", 2, "Quel est le nom de la Chevrolet hybride rechargeable à prolongateur d'autonomie, cousine de l'Opel Ampera ?", ["Volt", "Bolt", "Spark", "Malibu"], "What is the Chevrolet range-extender plug-in hybrid, cousin of the Opel Ampera, called?"),
Q("ev", 3, "Quelle électrique a gagné la course de côte de Pikes Peak en 2018 avec Romain Dumas ?", ["Volkswagen I.D. R", "Tesla Model S", "Porsche Taycan", "Audi e-tron"], "Which electric car won the 2018 Pikes Peak hill climb with Romain Dumas?"),
Q("ev", 3, "Quelle voiture, la « Jamais Contente », a été la première à dépasser 100 km/h en 1899 ?", ["Une électrique", "Une à vapeur", "Une à essence", "Une à pédales"], "What kind of car was “La Jamais Contente”, the first to pass 100 km/h in 1899?", ["An electric car", "A steam car", "A petrol car", "A pedal car"]),
Q("ev", 3, "Quel est le premier prototype hybride gagnant des 24 Heures du Mans, en 2012 ?", ["Audi R18 e-tron quattro", "Toyota TS030", "Peugeot 908", "Porsche 919"], "Which hybrid won the 24 Hours of Le Mans for the first time, in 2012?"),
Q("ev", 3, "Quelle plateforme électrique modulaire équipe la Volkswagen ID.3 ?", ["MEB", "MQB", "MLB", "PPE"], "Which modular electric platform underpins the Volkswagen ID.3?"),
Q("ev", 3, "Que signifie CCS pour la recharge ?", ["Combined Charging System", "Central Charge Station", "Constant Current Supply", "Car Charging Standard"], "What does CCS mean for charging?"),
Q("ev", 3, "Quelle tension de 800 volts équipe l'Hyundai Ioniq 5 et la Porsche Taycan pour la recharge rapide ?", ["Une architecture 800 V", "Une architecture 12 V", "Une architecture 48 V", "Une architecture 100 V"], "Which voltage architecture lets the Hyundai Ioniq 5 and Porsche Taycan charge fast?", ["An 800 V architecture", "A 12 V architecture", "A 48 V architecture", "A 100 V architecture"]),
Q("ev", 3, "Quelle boîte équipe l'essieu arrière de la Porsche Taycan ?", ["Une boîte à deux rapports", "Une boîte à dix rapports", "Une boîte manuelle", "Aucune boîte"], "What kind of gearbox does the rear axle of the Porsche Taycan have?", ["A two-speed gearbox", "A ten-speed gearbox", "A manual gearbox", "No gearbox"]),
Q("ev", 3, "Qui a été le premier double champion de Formule E, en 2018 et 2019 ?", ["Jean-Éric Vergne", "Lucas di Grassi", "Sébastien Buemi", "Sam Bird"], "Who was Formula E's first double champion, in 2018 and 2019?"),
Q("ev", 3, "Qu'est-ce qu'un « range extender » ?", ["Un petit moteur thermique qui produit l'électricité", "Un grand pack de batteries", "Un chargeur solaire", "Un pneu à faible résistance"], "What is a “range extender”?", ["A small combustion engine that generates electricity", "A larger battery pack", "A solar charger", "A low-rolling-resistance tyre"]),
Q("ev", 3, "Quel composant convertit le courant continu de la batterie en courant alternatif pour le moteur ?", ["L'onduleur", "Le redresseur", "L'alternateur", "Le démarreur"], "Which part converts the battery's direct current to alternating current for the motor?", ["The inverter", "The rectifier", "The alternator", "The starter"]),
Q("ev", 3, "Qu'est-ce que le V2L ?", ["Alimenter des appareils depuis la batterie de la voiture", "Charger plus vite", "Rouler en V", "Un type de pneu"], "What is V2L?", ["Powering devices from the car's battery", "Charging faster", "Driving in V", "A tyre type"]),
Q("ev", 3, "Quel est le nom du système de récupération d'énergie au freinage en Formule 1 ?", ["MGU-K", "ERS-X", "KERS-T", "DRS"], "What is the Formula 1 braking energy recovery unit called?"),
Q("ev", 3, "Quelle voiture a été la première hybride de série lancée au Japon, en 1997 ?", ["Toyota Prius", "Honda Insight", "Nissan Leaf", "Lexus RX 400h"], "Which was the first mass-production hybrid launched in Japan, in 1997?"),
Q("ev", 3, "Combien de moteurs électriques a la Tesla Model S Plaid ?", ["3", "1", "2", "4"], "How many electric motors does the Tesla Model S Plaid have?"),
Q("ev", 3, "Qu'est-ce qu'un hybride « micro » ou 48 V ?", ["Un moteur thermique assisté par un petit système électrique", "Une voiture à batterie de 48 kWh", "Une voiture à hydrogène", "Une voiture à deux moteurs thermiques"], "What is a “mild” or 48 V hybrid?", ["A combustion engine assisted by a small electric system", "A 48 kWh battery car", "A hydrogen car", "A car with two combustion engines"]),
Q("ev", 3, "Quel système hybride, de Nissan, fait que le moteur thermique ne sert qu'à produire l'électricité ?", ["e-Power", "Hybrid Synergy Drive", "i-MMD", "E-Tense"], "Which Nissan hybrid system uses the combustion engine only to generate electricity?"),
Q("ev", 3, "Quelle puissance annonce la Rimac Nevera ?", ["Environ 1 900 ch", "Environ 700 ch", "Environ 1 200 ch", "Environ 3 000 ch"], "How much power does the Rimac Nevera claim?", ["About 1,900 hp", "About 700 hp", "About 1,200 hp", "About 3,000 hp"]),
Q("ev", 3, "Quelle start-up américaine a lancé le SUV électrique R1S et le pick-up R1T ?", ["Rivian", "Lucid", "Fisker", "Canoo"], "Which American start-up launched the R1S SUV and R1T pick-up?"),
Q("ev", 3, "Quelle marque chinoise propose l'échange de batterie en quelques minutes ?", ["NIO", "BYD", "Xpeng", "Li Auto"], "Which Chinese brand offers battery swapping in minutes?"),
Q("ev", 4, "Quel système de la Formule 1 récupère l'énergie à partir des gaz d'échappement ?", ["MGU-H", "MGU-K", "KERS", "ERS-B"], "Which Formula 1 system recovers energy from exhaust gases?"),
Q("ev", 4, "Quelle était la cylindrée des moteurs de F1 hybrides à partir de 2014 ?", ["1,6 L, V6 turbo", "2,4 L, V8", "3,0 L, V10", "1,0 L, 3 cylindres"], "What were the hybrid Formula 1 engines like from 2014?", ["1.6 L V6 turbo", "2.4 L V8", "3.0 L V10", "1.0 L three-cylinder"]),
Q("ev", 4, "Quel ingénieur a présenté en 1900 la Lohner-Porsche, considérée comme la première hybride ?", ["Ferdinand Porsche", "Gottlieb Daimler", "Rudolf Diesel", "Louis Renault"], "Which engineer presented the Lohner-Porsche in 1900, considered the first hybrid?"),
Q("ev", 4, "Quelle voiture électrique GM de 1996 a été louée puis retirée de la route ?", ["EV1", "Bolt", "Volt", "Spark EV"], "Which 1996 GM electric car was leased and then withdrawn?"),
Q("ev", 4, "Quelle Tesla de 2008 a été la première de série à utiliser des cellules lithium-ion ?", ["Le Roadster", "La Model S", "La Model X", "La Model 3"], "Which 2008 Tesla was the first production car to use lithium-ion cells?", ["The Roadster", "The Model S", "The Model X", "The Model 3"]),
Q("ev", 4, "Quelle plateforme de Hyundai-Kia équipe l'Ioniq 5 ?", ["E-GMP", "MEB", "TNGA", "CMF-EV"], "Which Hyundai-Kia platform underpins the Ioniq 5?"),
Q("ev", 4, "Quel type de moteur équipait la Tesla Model S d'origine ?", ["Asynchrone à induction", "À courant continu à balais", "Pas à pas", "À réluctance"], "What type of motor did the original Tesla Model S use?", ["AC induction", "Brushed DC", "Stepper", "Switched reluctance"]),
Q("ev", 4, "Quel est le principe de l'e-POWER de Nissan par rapport à un hybride parallèle ?", ["Les roues sont toujours entraînées par le moteur électrique", "Le moteur thermique entraîne toujours les roues", "Il n'y a pas de batterie", "Il y a deux boîtes de vitesses"], "How does Nissan's e-POWER differ from a parallel hybrid?", ["The wheels are always driven by the electric motor", "The combustion engine always drives the wheels", "There is no battery", "There are two gearboxes"]),
Q("ev", 4, "Qui a été le premier champion de Formule E, en 2014-2015 ?", ["Nelson Piquet Jr.", "Sébastien Buemi", "Lucas di Grassi", "Sam Bird"], "Who was the first Formula E champion, in 2014-2015?"),
Q("ev", 4, "Quel est le nom du système hybride de Toyota qui utilise un train épicycloïdal ?", ["Hybrid Synergy Drive", "e-Power", "i-DCD", "E-Tense"], "Which Toyota hybrid system uses a planetary gear set?"),
Q("ev", 4, "Qui conduisait La Jamais Contente, première voiture à dépasser 100 km/h en 1899 ?", ["Camille Jenatzy", "Louis Renault", "Émile Levassor", "Gaston de Chasseloup-Laubat"], "Who drove La Jamais Contente, the first car to pass 100 km/h in 1899?"),
Q("ev", 4, "Quelle discipline à hydrogène l'ACO prévoit-il d'accueillir aux 24 Heures du Mans ?", ["Une catégorie hydrogène", "Un Grand Prix F1", "Une course de camions", "Un rallye-raid"], "What does the ACO plan to add at the 24 Hours of Le Mans?", ["A hydrogen class", "A F1 Grand Prix", "A truck race", "A rally raid"]),
Q("ev", 4, "Quelle voiture électrique américaine de 2012 a marqué la renaissance de Tesla avec une batterie de 60 à 85 kWh ?", ["La Model S", "Le Roadster", "La Model Y", "Le Cybertruck"], "Which 2012 American electric car marked Tesla's breakthrough, with a 60 to 85 kWh battery?", ["The Model S", "The Roadster", "The Model Y", "The Cybertruck"]),
Q("rally", 1, "Quel est le rôle du copilote en rallye ?", ["Lire les notes de route au pilote", "Changer les roues", "Chronométrer la course", "Conduire en alternance"], "What is the co-driver's job in rallying?", ["Read the pace notes to the driver", "Change the wheels", "Time the stage", "Drive in turns"]),
Q("rally", 1, "Comment appelle-t-on une portion chronométrée d'un rallye ?", ["Une spéciale", "Une manche", "Un relais", "Une étape libre"], "What is a timed section of a rally called?", ["A special stage", "A heat", "A relay", "A free leg"]),
Q("rally", 1, "Quel rallye ouvre traditionnellement la saison WRC, en hiver ?", ["Le Rallye Monte-Carlo", "Le Rallye du Kenya", "Le Rallye de Finlande", "Le Tour de Corse"], "Which rally traditionally opens the WRC season, in winter?", ["Monte Carlo Rally", "Safari Rally", "Rally Finland", "Tour de Corse"]),
Q("rally", 1, "Quel pilote a été neuf fois champion du monde des rallyes de 2004 à 2012 ?", ["Sébastien Loeb", "Sébastien Ogier", "Colin McRae", "Carlos Sainz"], "Which driver won nine world rally titles from 2004 to 2012?"),
Q("rally", 1, "Qui était le copilote de Sébastien Loeb ?", ["Daniel Elena", "Julien Ingrassia", "Luis Moya", "Timo Rautiainen"], "Who was Sébastien Loeb's co-driver?"),
Q("rally", 1, "Quelle voiture Lancia, avec sa transmission intégrale, a dominé les rallyes à la fin des années 1980 ?", ["La Delta Integrale", "La Stratos", "La 037", "La Fulvia"], "Which Lancia, with all-wheel drive, dominated rallying in the late 1980s?", ["The Delta Integrale", "The Stratos", "The 037", "The Fulvia"]),
Q("rally", 1, "Quel rallye-raid est parti de Paris pour Dakar lors de sa première édition ?", ["Le Paris-Dakar", "Le Paris-Pékin", "Le Rallye des Gazelles", "Le Rallye des Pharaons"], "Which rally raid left Paris for Dakar on its first edition?", ["The Paris-Dakar", "Peking to Paris", "The Gazelles Rally", "The Pharaohs Rally"]),
Q("rally", 1, "Sur quel terrain se court le Rallye de Suède ?", ["Sur neige et glace", "Sur sable", "Sur asphalte sec", "Sur terre rouge"], "What surface is the Swedish rally run on?", ["Snow and ice", "Sand", "Dry tarmac", "Red dirt"]),
Q("rally", 1, "Que contiennent les notes d'un copilote ?", ["La description des virages et des dangers", "La météo", "Les temps des rivaux", "Le niveau d'essence"], "What do a co-driver's notes contain?", ["A description of bends and hazards", "The weather", "Rivals' times", "The fuel level"]),
Q("rally", 1, "Comment surnomme-t-on les pilotes de rallye finlandais ?", ["Les « Flying Finns »", "Les « Iron Swedes »", "Les « Mad Italians »", "Les « Red Devils »"], "What are Finnish rally drivers nicknamed?", ["The “Flying Finns”", "The “Iron Swedes”", "The “Mad Italians”", "The “Red Devils”"]),
Q("rally", 1, "Quel équipement protège l'habitacle d'une voiture de rallye en cas de retournement ?", ["L'arceau de sécurité", "Le toit ouvrant", "Le pare-buffle", "L'antibrouillard"], "What protects a rally car's cabin in a roll-over?", ["The roll cage", "The sunroof", "The bull bar", "The fog light"]),
Q("rally", 1, "Quelle marque a offert à Sébastien Loeb ses neuf titres mondiaux ?", ["Citroën", "Peugeot", "Ford", "Subaru"], "Which brand gave Sébastien Loeb his nine world titles?"),
Q("rally", 1, "Combien de roues motrices ont les voitures du WRC actuel ?", ["4", "2", "3", "6"], "How many driven wheels do current WRC cars have?"),
Q("rally", 1, "Quelle île française accueille le « rallye des 10 000 virages » ?", ["La Corse", "La Réunion", "La Martinique", "Belle-Île"], "Which French island hosts the “rally of 10,000 corners”?", ["Corsica", "Réunion", "Martinique", "Belle-Île"]),
Q("rally", 1, "Que signifie « SS » dans les résultats d'un rallye ?", ["Special Stage", "Super Sport", "Safety Service", "Start Sector"], "What does “SS” mean in rally results?"),
Q("rally", 1, "Quelle marque japonaise a ramené la victoire en WRC avec la Yaris à partir de 2017 ?", ["Toyota", "Mazda", "Honda", "Suzuki"], "Which Japanese brand returned to winning in the WRC with the Yaris from 2017?"),
Q("rally", 1, "Quel rallye est célèbre pour ses sauts et sa vitesse sur piste de terre en Finlande ?", ["Le Rallye de Finlande", "Le Rallye de Suède", "Le Rallye du Portugal", "Le Rallye du Japon"], "Which rally is famous for its jumps and speed on Finnish gravel?", ["Rally Finland", "Rally Sweden", "Rally Portugal", "Rally Japan"]),
Q("rally", 1, "Quel col des Alpes-Maritimes est célèbre au Rallye Monte-Carlo ?", ["Le col de Turini", "Le col du Galibier", "Le col de la Bonette", "Le Stelvio"], "Which Alps pass is famous on the Monte Carlo Rally?", ["Col de Turini", "Col du Galibier", "Col de la Bonette", "Stelvio"]),
Q("rally", 2, "Quelle voiture a imposé la transmission intégrale en rallye dès 1981 ?", ["L'Audi Quattro", "La Ford Escort", "La Renault 5 Turbo", "La Fiat 131"], "Which car brought all-wheel drive to rallying from 1981?"),
Q("rally", 2, "Quelle pilote est devenue en 1981 la première femme à gagner une manche du championnat du monde des rallyes ?", ["Michèle Mouton", "Pat Moss", "Jutta Kleinschmidt", "Louise Aitken-Walker"], "Which driver became the first woman to win a World Rally Championship round, in 1981?"),
Q("rally", 2, "Qui a été champion du monde des rallyes en 1995 sur Subaru Impreza ?", ["Colin McRae", "Tommi Mäkinen", "Carlos Sainz", "Juha Kankkunen"], "Who won the 1995 world rally title in a Subaru Impreza?"),
Q("rally", 2, "Quel pilote finlandais a été quatre fois champion du monde sur Mitsubishi de 1996 à 1999 ?", ["Tommi Mäkinen", "Marcus Grönholm", "Ari Vatanen", "Hannu Mikkola"], "Which Finnish driver won four world titles with Mitsubishi from 1996 to 1999?"),
Q("rally", 2, "Quel pilote est devenu en 2022 le plus jeune champion du monde des rallyes, à 22 ans ?", ["Kalle Rovanperä", "Elfyn Evans", "Esapekka Lappi", "Ott Tänak"], "Which driver became the youngest world rally champion in 2022, aged 22?"),
Q("rally", 2, "Quel autre pilote français compte huit titres de champion du monde des rallyes ?", ["Sébastien Ogier", "Didier Auriol", "Bruno Saby", "François Delecour"], "Which other French driver has eight world rally titles?"),
Q("rally", 2, "Quelle voiture a gagné le Rallye Monte-Carlo 1973 avec Jean-Claude Andruet ?", ["L'Alpine A110", "La Lancia Stratos", "La Porsche 911", "La Ford Escort"], "Which car won the 1973 Monte Carlo Rally with Jean-Claude Andruet?", ["The Alpine A110", "The Lancia Stratos", "The Porsche 911", "The Ford Escort"]),
Q("rally", 2, "Quelle course est surnommée la « Course to the Clouds » ?", ["Pikes Peak", "Le Mont Ventoux", "Le Dakar", "Le Rallye du Kenya"], "Which race is nicknamed “The Race to the Clouds”?", ["Pikes Peak", "Mont Ventoux", "The Dakar", "Safari Rally"]),
Q("rally", 2, "Qui est le créateur du Paris-Dakar ?", ["Thierry Sabine", "Jean-Claude Killy", "Gilles Panizzi", "René Metge"], "Who created the Paris-Dakar rally?"),
Q("rally", 2, "Quelle équipe a dominé le Groupe B en 1985 avec la 205 T16 ?", ["Peugeot Talbot Sport", "Lancia", "Audi Sport", "Ford"], "Which team dominated Group B in 1985 with the 205 T16?"),
Q("rally", 2, "En quelle année le Dakar s'est-il installé en Arabie saoudite ?", ["2020", "2009", "2015", "2023"], "In which year did the Dakar move to Saudi Arabia?"),
Q("rally", 2, "Quel pays accueille le Safari Rally, revenu au WRC en 2021 ?", ["Le Kenya", "L'Afrique du Sud", "Le Maroc", "La Tunisie"], "Which country hosts the Safari Rally, back in the WRC in 2021?", ["Kenya", "South Africa", "Morocco", "Tunisia"]),
Q("rally", 2, "Qu'est-ce que la « reconnaissance » en rallye ?", ["Un passage préalable lent pour établir les notes", "Un tour de chauffe en course", "Un contrôle technique", "La remise des prix"], "What is the “recce” in rallying?", ["A slow preliminary pass to make the pace notes", "A warm-up lap in the race", "A technical inspection", "The prize-giving"]),
Q("rally", 2, "Qu'est-ce que le « parc d'assistance » ?", ["La zone où les mécaniciens réparent les voitures", "Le parc des spectateurs", "La zone de départ", "Le garage du pilote"], "What is the “service park”?", ["The area where mechanics repair the cars", "The spectators' park", "The start area", "The driver's garage"]),
Q("rally", 2, "Quel pilote belge a été champion du monde des rallyes en 2024 sur Hyundai ?", ["Thierry Neuville", "Kris Meeke", "Sébastien Ogier", "Ott Tänak"], "Which Belgian driver won the 2024 world rally title in a Hyundai?"),
Q("rally", 2, "Quelle Renault a remporté le Rallye Monte-Carlo 1981 avec Jean Ragnotti ?", ["La 5 Turbo", "La Clio Williams", "L'Alpine A310", "La R12 Gordini"], "Which Renault won the 1981 Monte Carlo Rally with Jean Ragnotti?", ["The 5 Turbo", "The Clio Williams", "The Alpine A310", "The R12 Gordini"]),
Q("rally", 2, "Quel pilote a remporté le Dakar à moto puis en auto, surnommé « Monsieur Dakar » ?", ["Stéphane Peterhansel", "Cyril Despres", "Hubert Auriol", "Nani Roma"], "Which Dakar winner on motorbikes and cars is nicknamed “Mr Dakar”?"),
Q("rally", 2, "Quelle marque a fourni la voiture de Sébastien Ogier pour ses premiers titres, de 2013 à 2016 ?", ["Volkswagen", "Citroën", "Ford", "Hyundai"], "Which brand supplied Sébastien Ogier's car for his titles from 2013 to 2016?"),
Q("rally", 3, "Quelle voiture a gagné le Monte-Carlo 1964 avec Paddy Hopkirk ?", ["La Mini Cooper S", "La Ford Cortina", "La Citroën DS", "La Porsche 904"], "Which car won the 1964 Monte Carlo Rally with Paddy Hopkirk?", ["The Mini Cooper S", "The Ford Cortina", "The Citroën DS", "The Porsche 904"]),
Q("rally", 3, "Quel pilote a été champion du monde des rallyes en 1980 et 1982, notamment sur Fiat et Opel ?", ["Walter Röhrl", "Hannu Mikkola", "Ari Vatanen", "Markku Alén"], "Which driver was world rally champion in 1980 and 1982, notably in a Fiat and an Opel?"),
Q("rally", 3, "Quel accident de 1986 a mis fin au Groupe B ?", ["Celui de Toivonen et Cresto au Tour de Corse", "Celui de Loeb au Dakar", "Celui de Mäkinen en Finlande", "Celui de Vatanen au Kenya"], "Which 1986 accident ended Group B?", ["Toivonen and Cresto at the Tour de Corse", "Loeb at the Dakar", "Mäkinen in Finland", "Vatanen in Kenya"]),
Q("rally", 3, "Combien de titres constructeurs la Lancia Delta a-t-elle gagnés de 1987 à 1992 ?", ["6", "3", "4", "8"], "How many consecutive manufacturers' titles did the Lancia Delta win from 1987 to 1992?"),
Q("rally", 3, "Quel pilote français a été le premier à devenir champion du monde des rallyes, en 1994 ?", ["Didier Auriol", "Bruno Saby", "François Delecour", "Jean Ragnotti"], "Which French driver was the first to become world rally champion, in 1994?"),
Q("rally", 3, "Quel pilote finlandais a gagné le titre mondial en 1981 sur Ford Escort RS ?", ["Ari Vatanen", "Timo Salonen", "Hannu Mikkola", "Markku Alén"], "Which Finnish driver won the 1981 world title in a Ford Escort RS?"),
Q("rally", 3, "Quelle spéciale bonus, en fin de rallye, donne des points supplémentaires aux meilleurs temps ?", ["La Power Stage", "La Super Spéciale", "La Joker Stage", "La Final Run"], "Which bonus stage at the end of a rally awards extra points for the fastest times?"),
Q("rally", 3, "Combien de victoires au Dakar Stéphane Peterhansel a-t-il en tout (motos et autos) ?", ["14", "8", "10", "17"], "How many Dakar wins does Stéphane Peterhansel have in total (bikes and cars)?"),
Q("rally", 3, "Quelle était la catégorie reine du WRC depuis 2022, aux voitures hybrides ?", ["Rally1", "Rally2", "Groupe A", "Super 2000"], "What is the WRC's top category, with hybrid cars, since 2022?"),
Q("rally", 3, "Quelle propulsion Lancia a gagné le titre constructeurs 1983 face à l'Audi Quattro ?", ["La Lancia 037", "La Lancia Delta S4", "La Fiat 131", "La Fulvia HF"], "Which rear-wheel-drive Lancia won the 1983 manufacturers' title against the Audi Quattro?", ["The Lancia 037", "The Lancia Delta S4", "The Fiat 131", "The Fulvia HF"]),
Q("rally", 3, "Combien de titres constructeurs Citroën a-t-il gagnés en WRC ?", ["8", "5", "3", "11"], "How many manufacturers' titles did Citroën win in the WRC?"),
Q("rally", 3, "Quel pilote a gagné le Monte-Carlo 1986 sur Lancia Delta S4 ?", ["Henri Toivonen", "Timo Salonen", "Bruno Saby", "Juha Kankkunen"], "Which driver won the 1986 Monte Carlo Rally in a Lancia Delta S4?"),
Q("rally", 3, "Quelle Audi a remporté Pikes Peak 1987 avec Walter Röhrl ?", ["La Sport Quattro S1", "La 80 Quattro", "La RS 4", "La TT"], "Which Audi won Pikes Peak in 1987 with Walter Röhrl?", ["The Sport Quattro S1", "The 80 Quattro", "The RS 4", "The TT"]),
Q("rally", 3, "Quel pilote espagnol a gagné le Dakar 2024 sur Audi RS Q e-tron ?", ["Carlos Sainz", "Nani Roma", "Fernando Alonso", "Isidre Esteve"], "Which Spanish driver won the 2024 Dakar in an Audi RS Q e-tron?"),
Q("rally", 3, "Quelle voiture Citroën a gagné le Monte-Carlo 1959 et 1966 ?", ["La DS", "La 2CV", "La Traction", "La CX"], "Which Citroën won the Monte Carlo Rally in 1959 and 1966?", ["The DS", "The 2CV", "The Traction", "The CX"]),
Q("rally", 3, "Quelle voiture japonaise a gagné trois titres constructeurs de suite de 1995 à 1997 ?", ["Subaru Impreza", "Toyota Celica", "Mitsubishi Lancer", "Mazda 323"], "Which Japanese car won three consecutive manufacturers' titles from 1995 to 1997?"),
Q("rally", 3, "Quel pilote finlandais a gagné quatre titres mondiaux avec Peugeot, Lancia et Toyota ?", ["Juha Kankkunen", "Marcus Grönholm", "Timo Salonen", "Hannu Mikkola"], "Which Finn won four world titles with Peugeot, Lancia and Toyota?"),
Q("rally", 3, "Quelle Peugeot a remporté le championnat du monde constructeurs en 2000, 2001 et 2002 ?", ["La 206 WRC", "La 205 T16", "La 307 WRC", "La 405 T16"], "Which Peugeot won the manufacturers' title in 2000, 2001 and 2002?", ["The 206 WRC", "The 205 T16", "The 307 WRC", "The 405 T16"]),
Q("rally", 3, "Quel pilote a donné à Ford le titre mondial 1979 ?", ["Björn Waldegård", "Ari Vatanen", "Hannu Mikkola", "Roger Clark"], "Which driver gave Ford the 1979 world title?"),
Q("rally", 3, "Quelle série de vidéos de Ken Block mêle drift et cascades ?", ["Gymkhana", "Rallycross", "Hoonigan Race", "Top Gear"], "Which Ken Block video series mixes drifting and stunts?"),
Q("rally", 3, "Quelle Hyundai, avec Thierry Neuville, participe au WRC depuis 2022 en catégorie reine ?", ["La i20 N Rally1", "La Kona", "La Tucson", "La Ioniq"], "Which Hyundai, driven by Thierry Neuville, competes in the WRC's top class since 2022?", ["The i20 N Rally1", "The Kona", "The Tucson", "The Ioniq"]),
Q("rally", 4, "Quel Suédois a gagné le Monte-Carlo 1971 sur Alpine A110 ?", ["Ove Andersson", "Björn Waldegård", "Stig Blomqvist", "Per Eklund"], "Which Swede won the 1971 Monte Carlo Rally in an Alpine A110?"),
Q("rally", 4, "En quelle année a eu lieu le premier Rallye Monte-Carlo ?", ["1911", "1925", "1950", "1973"], "In which year was the first Monte Carlo Rally held?"),
Q("rally", 4, "Quel est le nom de la dernière voiture à propulsion championne du monde des rallyes en 1983 ?", ["Lancia 037", "Audi Quattro", "Peugeot 205 T16", "Toyota Celica GT-Four"], "Which rear-wheel-drive car was the last to win a world rally title, in 1983?"),
Q("rally", 4, "Combien de kilowatts le bloc hybride des Rally1 apporte-t-il ?", ["100 kW", "30 kW", "250 kW", "10 kW"], "How much power does the Rally1 hybrid unit add?"),
Q("rally", 4, "Combien de virages compte la route de Pikes Peak ?", ["156", "60", "300", "42"], "How many corners does the Pikes Peak road have?"),
Q("rally", 4, "Quel copilote a accompagné Carlos Sainz pour ses titres mondiaux ?", ["Luis Moya", "Timo Rautiainen", "Nicky Grist", "Derek Ringer"], "Which co-driver partnered Carlos Sainz for his world titles?"),
Q("rally", 4, "Quelle voiture, dessinée par Bertone et conçue pour le rallye, a gagné trois titres constructeurs de 1974 à 1976 ?", ["La Lancia Stratos HF", "La Fiat 124 Abarth", "L'Alpine A110", "La Ford Escort RS1800"], "Which Bertone-designed rally special won three manufacturers' titles from 1974 to 1976?", ["The Lancia Stratos HF", "The Fiat 124 Abarth", "The Alpine A110", "The Ford Escort RS1800"]),
Q("rally", 4, "Quel Suédois a été champion du monde des rallyes 1984 sur Audi Quattro ?", ["Stig Blomqvist", "Björn Waldegård", "Per Eklund", "Kenneth Eriksson"], "Which Swede won the 1984 world rally title in an Audi Quattro?"),
Q("rally", 4, "Quelle tête d'affiche du Groupe B était la Lancia Delta S4, avec un moteur à compresseur et turbo ?", ["Une double suralimentation", "Un moteur électrique", "Un moteur rotatif", "Un diesel"], "What was special about the Lancia Delta S4's engine?", ["Both a supercharger and a turbo", "An electric motor", "A rotary engine", "A diesel"]),
Q("rally", 4, "Qui est le premier pilote à avoir gagné le Dakar à moto puis en voiture ?", ["Hubert Auriol", "Stéphane Peterhansel", "Cyril Despres", "Nani Roma"], "Who was the first driver to win the Dakar on a motorbike and then in a car?"),
Q("rally", 4, "Quelle voiture Toyota a donné à Didier Auriol le titre 1994 ?", ["La Celica Turbo 4WD (ST185)", "La Corolla WRC", "La Yaris WRC", "La MR2"], "Which Toyota gave Didier Auriol the 1994 title?", ["The Celica Turbo 4WD (ST185)", "The Corolla WRC", "The Yaris WRC", "The MR2"]),
Q("rally", 4, "Quel pays a organisé le premier Rallye du Japon intégré au WRC en 2004 ?", ["Le Japon (Hokkaido)", "La Chine", "La Corée", "L'Australie"], "Where was the Rally Japan that joined the WRC calendar in 2004 held?", ["Japan (Hokkaido)", "China", "Korea", "Australia"]),
Q("brands", 4, "Quelle marque britannique a racheté Lagonda en 1947 ?", ["Aston Martin", "Bentley", "Jaguar", "Rover"], "Which British brand bought Lagonda in 1947?"),
Q("brands", 4, "Sous quel nom les Simca ont-elles été vendues après le rachat de Chrysler Europe par PSA en 1978 ?", ["Talbot", "Matra", "Panhard", "Chrysler"], "Under which name were Simcas sold after PSA bought Chrysler Europe in 1978?"),
Q("brands", 4, "Dans quelle ville Maserati a-t-elle été fondée en 1914 ?", ["Bologne", "Modène", "Turin", "Milan"], "In which city was Maserati founded in 1914?", ["Bologna", "Modena", "Turin", "Milan"]),
Q("brands", 4, "Quel homme d'affaires italien a relancé Bugatti en 1987 ?", ["Romano Artioli", "Ferdinand Piëch", "Gianni Agnelli", "Ferruccio Lamborghini"], "Which Italian businessman relaunched Bugatti in 1987?"),
Q("brands", 4, "Quelle fusion de 1952 a créé la British Motor Corporation ?", ["Austin et Morris", "Rover et Land Rover", "Jaguar et Daimler", "Triumph et MG"], "Which 1952 merger created the British Motor Corporation?", ["Austin and Morris", "Rover and Land Rover", "Jaguar and Daimler", "Triumph and MG"]),
Q("brands", 4, "Quelle marque de luxe a pour mascotte une cigogne ?", ["Hispano-Suiza", "Delahaye", "Talbot-Lago", "Voisin"], "Which luxury brand uses a stork as its mascot?"),
Q("brands", 4, "Quelle société a fabriqué la Trabant en Allemagne de l'Est ?", ["VEB Sachsenring", "Wartburg", "IFA Barkas", "Škoda"], "Which company built the Trabant in East Germany?"),
Q("brands", 4, "Avec quelle entreprise Benz & Cie a-t-elle fusionné en 1926 pour former Daimler-Benz ?", ["Daimler-Motoren-Gesellschaft", "Maybach", "Horch", "NSU"], "Which company did Benz & Cie merge with in 1926 to form Daimler-Benz?"),
Q("history", 4, "En quelle année Ford a-t-il lancé la chaîne de montage mobile ?", ["1913", "1908", "1922", "1930"], "In which year did Ford introduce the moving assembly line?"),
Q("history", 4, "En quelle année Citroën a-t-il lancé la Traction Avant ?", ["1934", "1925", "1948", "1955"], "In which year did Citroën launch the Traction Avant?"),
Q("history", 4, "Quelle classe Mercedes a introduit l'ABS de série en 1978 ?", ["La Classe S (W116)", "La Classe E", "La 190", "La 300 SL"], "Which Mercedes introduced ABS as standard in 1978?", ["The S-Class (W116)", "The E-Class", "The 190", "The 300 SL"]),
Q("history", 4, "Sous quel numéro la future Porsche 911 a-t-elle été présentée en 1963 ?", ["901", "911", "356", "904"], "Under which number was the future Porsche 911 presented in 1963?"),
Q("history", 4, "Quelle voiture a battu le record de vitesse sur terre avec 1 227 km/h en 1997 ?", ["ThrustSSC", "Bloodhound", "Spirit of America", "Thrust2"], "Which car set the land speed record of 1,227 km/h in 1997?"),
Q("history", 4, "Qui a dessiné la carrosserie de la Citroën DS ?", ["Flaminio Bertoni", "Giorgetto Giugiaro", "Sergio Pininfarina", "Marcello Gandini"], "Who designed the bodywork of the Citroën DS?"),
Q("history", 4, "Quel groupe a introduit le premier turbo de série, en 1962, sur l'Oldsmobile Jetfire ?", ["General Motors", "Ford", "Saab", "Chrysler"], "Which group introduced the first production turbo in 1962, on the Oldsmobile Jetfire?"),
Q("history", 4, "En quelle année a été créé le championnat du monde de Formule 1 ?", ["1950", "1946", "1958", "1962"], "In which year was the Formula 1 World Championship created?"),
Q("engines", 4, "Quel V8 de 7,0 L équipait la Ford GT40 Mk II victorieuse au Mans en 1966 ?", ["Le Ford 427", "Le Coyote", "Le Hemi", "Le Chevrolet Small Block"], "Which 7.0-litre V8 powered the Ford GT40 Mk II that won Le Mans in 1966?", ["The Ford 427", "The Coyote", "The Hemi", "The Chevrolet Small Block"]),
Q("engines", 4, "Quel cycle moteur, utilisé par les hybrides Toyota, ferme tardivement l'admission pour réduire la consommation ?", ["Le cycle Atkinson", "Le cycle Diesel", "Le cycle Otto", "Le cycle Stirling"], "Which engine cycle, used by Toyota hybrids, closes the intake late to cut consumption?", ["The Atkinson cycle", "The Diesel cycle", "The Otto cycle", "The Stirling cycle"]),
Q("engines", 4, "Quelle cylindrée a le W16 de la Bugatti Veyron ?", ["8,0 L", "6,0 L", "7,0 L", "9,0 L"], "What is the displacement of the Bugatti Veyron's W16?"),
Q("engines", 4, "Quelle marque allemande a lancé en 1967 la Ro 80 à moteur rotatif ?", ["NSU", "Mercedes-Benz", "Opel", "Borgward"], "Which German brand launched the rotary-engined Ro 80 in 1967?"),
Q("engines", 4, "Quel vilebrequin donne au V8 de la Ferrari 458 son hurlement aigu ?", ["Un vilebrequin à plan plat", "Un vilebrequin à plan croisé", "Un vilebrequin à plat double", "Un vilebrequin à 120°"], "Which crankshaft layout gives the Ferrari 458's V8 its high-pitched scream?", ["A flat-plane crankshaft", "A cross-plane crankshaft", "A double flat crankshaft", "A 120° crankshaft"]),
Q("engines", 4, "Combien de rotors avait le moteur de la Mazda 787B ?", ["4", "2", "3", "6"], "How many rotors did the Mazda 787B's engine have?"),
Q("engines", 4, "À quoi sert la sonde lambda ?", ["À mesurer l'oxygène dans l'échappement pour régler le mélange", "À mesurer la température de l'huile", "À mesurer la pression du turbo", "À mesurer la vitesse des roues"], "What does a lambda sensor do?", ["Measures oxygen in the exhaust to adjust the mixture", "Measures oil temperature", "Measures turbo pressure", "Measures wheel speed"]),
Q("motorsport", 4, "Quel duo a gagné les 24 Heures du Mans 1966 sur la Ford GT40 n°2 ?", ["Bruce McLaren et Chris Amon", "Dan Gurney et A.J. Foyt", "Ken Miles et Denny Hulme", "Jacky Ickx et Jackie Oliver"], "Which pair won the 1966 24 Hours of Le Mans in Ford GT40 no. 2?"),
Q("motorsport", 4, "Quelle écurie a gagné le premier championnat du monde des constructeurs de F1, en 1958 ?", ["Vanwall", "Ferrari", "Cooper", "Lotus"], "Which team won the first Formula 1 Constructors' Championship in 1958?"),
Q("motorsport", 4, "Quel pilote-constructeur a gagné les 24 Heures du Mans 1980 avec sa propre voiture ?", ["Jean Rondeau", "Gérard Larrousse", "Henri Pescarolo", "Jean-Pierre Beltoise"], "Which driver-constructor won the 1980 24 Hours of Le Mans in his own car?"),
Q("motorsport", 4, "Quel pilote britannique faisait partie de l'équipage de la Mazda 787B victorieuse en 1991 ?", ["Johnny Herbert", "Derek Bell", "Martin Brundle", "Damon Hill"], "Which British driver was in the Mazda 787B crew that won in 1991?"),
Q("motorsport", 4, "Quelle marque française a gagné le Mans en 1972, 1973 et 1974 ?", ["Matra", "Alpine", "Peugeot", "Rondeau"], "Which French marque won Le Mans in 1972, 1973 and 1974?"),
Q("motorsport", 4, "Quelle Peugeot a remporté Le Mans en 1992 et 1993 ?", ["La 905", "La 908", "La 905 Evo", "La 9X8"], "Which Peugeot won Le Mans in 1992 and 1993?"),
Q("countries", 4, "De quel pays vient la marque Pagani ?", ["Italie", "Allemagne", "France", "Espagne"], "Which country does the Pagani brand come from?", ["Italy", "Germany", "France", "Spain"]),
Q("countries", 4, "De quel pays vient la marque Koenigsegg ?", ["Suède", "Norvège", "Danemark", "Finlande"], "Which country does Koenigsegg come from?", ["Sweden", "Norway", "Denmark", "Finland"]),
Q("countries", 4, "De quel pays vient la marque Tatra ?", ["République tchèque", "Pologne", "Hongrie", "Autriche"], "Which country does Tatra come from?", ["Czech Republic", "Poland", "Hungary", "Austria"]),
Q("countries", 4, "De quel pays vient la marque Proton ?", ["Malaisie", "Indonésie", "Thaïlande", "Philippines"], "Which country does Proton come from?", ["Malaysia", "Indonesia", "Thailand", "Philippines"]),
Q("countries", 4, "De quel pays vient la marque Holden ?", ["Australie", "Nouvelle-Zélande", "Afrique du Sud", "Canada"], "Which country does Holden come from?", ["Australia", "New Zealand", "South Africa", "Canada"]),
Q("countries", 4, "De quel pays vient la marque Spyker ?", ["Pays-Bas", "Belgique", "Suisse", "Autriche"], "Which country does Spyker come from?", ["Netherlands", "Belgium", "Switzerland", "Austria"]),
Q("circuits", 4, "Quelle longueur fait le circuit des 24 Heures du Mans actuel ?", ["13,6 km", "8,5 km", "5,8 km", "16 km"], "How long is the current 24 Hours of Le Mans circuit?", ["13.6 km", "8.5 km", "5.8 km", "16 km"]),
Q("circuits", 4, "Quel est le premier circuit automobile permanent construit au monde, ouvert en 1907 ?", ["Brooklands", "Monza", "Indianapolis", "Silverstone"], "Which was the world's first purpose-built motor racing circuit, opened in 1907?"),
Q("circuits", 4, "Quel circuit italien est surnommé le « Temple de la Vitesse » ?", ["Monza", "Imola", "Mugello", "Misano"], "Which Italian circuit is nicknamed the “Temple of Speed”?"),
Q("circuits", 4, "Quel virage célèbre se trouve à Spa-Francorchamps ?", ["Eau Rouge-Raidillon", "Tamburello", "Parabolica", "Stowe"], "Which famous corner is at Spa-Francorchamps?", ["Eau Rouge-Raidillon", "Tamburello", "Parabolica", "Stowe"]),
Q("circuits", 4, "Quelle est la longueur de la Nordschleife du Nürburgring ?", ["20,8 km", "12,5 km", "25,4 km", "15,1 km"], "How long is the Nürburgring Nordschleife?", ["20.8 km", "12.5 km", "25.4 km", "15.1 km"]),
Q("circuits", 4, "Dans quel état américain se trouve le circuit de Laguna Seca et son célèbre « Corkscrew » ?", ["La Californie", "La Floride", "Le Texas", "L'Ohio"], "In which US state is Laguna Seca, with its famous “Corkscrew”?", ["California", "Florida", "Texas", "Ohio"]),
Q("numbers", 4, "Quelle puissance a la McLaren F1 de 1992 ?", ["Environ 630 ch", "Environ 450 ch", "Environ 800 ch", "Environ 1 000 ch"], "How much power does the 1992 McLaren F1 have?", ["About 630 hp", "About 450 hp", "About 800 hp", "About 1,000 hp"]),
Q("numbers", 4, "Quelle vitesse maximale a atteint la McLaren F1 en 1998 ?", ["391 km/h", "330 km/h", "420 km/h", "450 km/h"], "What top speed did the McLaren F1 reach in 1998?"),
Q("numbers", 4, "Quelle vitesse a atteint la Bugatti Chiron prototype en 2019 ?", ["Environ 490 km/h", "Environ 440 km/h", "Environ 520 km/h", "Environ 560 km/h"], "What speed did the prototype Bugatti Chiron reach in 2019?", ["About 490 km/h", "About 440 km/h", "About 520 km/h", "About 560 km/h"]),
Q("numbers", 4, "Quelle cylindrée ont les moteurs de F1 depuis 2014 ?", ["1,6 L", "2,4 L", "3,0 L", "1,0 L"], "What is the displacement of Formula 1 engines since 2014?", ["1.6 L", "2.4 L", "3.0 L", "1.0 L"]),
Q("numbers", 4, "Quelle distance a parcouru l'Audi R15 TDI aux 24 Heures du Mans 2010 ?", ["Plus de 5 400 km", "Environ 4 000 km", "Environ 6 000 km", "Moins de 3 500 km"], "What distance did the Audi R15 TDI cover at the 2010 24 Hours of Le Mans?", ["More than 5,400 km", "About 4,000 km", "About 6,000 km", "Less than 3,500 km"]),
Q("numbers", 4, "Combien de chevaux vaut environ 1 kW ?", ["1,36", "0,74", "2,5", "10"], "Roughly how many horsepower is 1 kW?"),
Q("trivia", 4, "Dans quel pays était fabriquée la DeLorean DMC-12 ?", ["Irlande du Nord", "États-Unis", "Canada", "Angleterre"], "In which country was the DeLorean DMC-12 built?", ["Northern Ireland", "United States", "Canada", "England"]),
Q("trivia", 4, "Environ combien de Coccinelle ont été produites ?", ["21,5 millions", "5 millions", "12 millions", "40 millions"], "Roughly how many Beetles were built?", ["21.5 million", "5 million", "12 million", "40 million"]),
Q("trivia", 4, "À qui doit-on l'emblème du cheval cabré de Ferrari ?", ["À l'aviateur Francesco Baracca", "À Enzo Ferrari seul", "À Ferruccio Lamborghini", "À Benito Mussolini"], "Whose emblem inspired Ferrari's prancing horse?", ["The pilot Francesco Baracca", "Enzo Ferrari alone", "Ferruccio Lamborghini", "Benito Mussolini"]),
Q("trivia", 4, "D'où vient le trident du logo Maserati ?", ["De la fontaine de Neptune à Bologne", "Des armoiries de Modène", "D'un emblème naval", "D'une pièce de monnaie"], "Where does the Maserati trident come from?", ["The Neptune fountain in Bologna", "The arms of Modena", "A naval emblem", "A coin"]),
Q("trivia", 4, "Quel signe astrologique a inspiré le taureau de Lamborghini ?", ["Le Taureau", "Le Bélier", "Le Lion", "Le Scorpion"], "Which zodiac sign inspired the Lamborghini bull?", ["Taurus", "Aries", "Leo", "Scorpio"]),
Q("trivia", 4, "Qui était le fondateur de Cadillac, dont la marque porte le nom ?", ["Antoine de la Mothe Cadillac, fondateur de Détroit", "Henry Leland", "Louis Chevrolet", "William Durant"], "After whom is Cadillac named?", ["Antoine de la Mothe Cadillac, founder of Detroit", "Henry Leland", "Louis Chevrolet", "William Durant"])
  );

  // questions à PLUSIEURS bonnes réponses : [catégorie, niveau, question fr, options fr, indices corrects, question en, options en]
  const QMULTI = [
    ["brands", 1, "Lesquelles de ces marques sont françaises ?", ["Peugeot", "Fiat", "Citroën", "Seat"], [0, 2], "Which of these brands are French?", ["Peugeot", "Fiat", "Citroën", "Seat"]],
    ["brands", 1, "Lesquelles de ces marques sont allemandes ?", ["Audi", "Volvo", "Opel", "Skoda"], [0, 2], "Which of these brands are German?", ["Audi", "Volvo", "Opel", "Skoda"]],
    ["brands", 2, "Lesquelles de ces marques appartiennent au groupe Volkswagen ?", ["Audi", "Porsche", "Mazda", "Skoda"], [0, 1, 3], "Which of these brands belong to the Volkswagen Group?", ["Audi", "Porsche", "Mazda", "Skoda"]],
    ["brands", 3, "Lesquelles de ces marques sont britanniques ?", ["Aston Martin", "Lotus", "Alpine", "Maserati"], [0, 1], "Which of these brands are British?", ["Aston Martin", "Lotus", "Alpine", "Maserati"]],
    ["countries", 1, "Lesquelles de ces marques sont japonaises ?", ["Honda", "Hyundai", "Subaru", "Kia"], [0, 2], "Which of these brands are Japanese?", ["Honda", "Hyundai", "Subaru", "Kia"]],
    ["countries", 2, "Lesquelles de ces marques sont italiennes ?", ["Ferrari", "Seat", "Lancia", "Bentley"], [0, 2], "Which of these brands are Italian?", ["Ferrari", "Seat", "Lancia", "Bentley"]],
    ["engines", 1, "Lesquels de ces moteurs sont à pistons ?", ["Le V8", "Le Wankel", "Le flat-six", "La turbine"], [0, 2], "Which of these engines are piston engines?", ["The V8", "The Wankel", "The flat-six", "The turbine"]],
    ["engines", 2, "Lesquelles de ces voitures ont un moteur à l'arrière ?", ["Porsche 911 classique", "Renault Alpine A110 (1963)", "Mazda MX-5", "Volkswagen Golf"], [0, 1], "Which of these cars are rear-engined?", ["Classic Porsche 911", "Renault Alpine A110 (1963)", "Mazda MX-5", "Volkswagen Golf"]],
    ["engines", 3, "Lesquels de ces codes moteur sont japonais ?", ["2JZ-GTE", "RB26DETT", "XU9JA", "EJ207"], [0, 1, 3], "Which of these engine codes are Japanese?", ["2JZ-GTE", "RB26DETT", "XU9JA", "EJ207"]],
    ["history", 1, "Lesquelles de ces voitures sont des compactes sportives « GTI » ?", ["Volkswagen Golf GTI", "Peugeot 205 GTI", "Citroën 2CV", "Fiat Panda"], [0, 1], "Which of these cars are “GTI” hot hatches?", ["Volkswagen Golf GTI", "Peugeot 205 GTI", "Citroën 2CV", "Fiat Panda"]],
    ["history", 2, "Lesquelles de ces voitures ont gagné les 24 Heures du Mans ?", ["Ford GT40", "Porsche 917", "Fiat 500", "Mini Cooper"], [0, 1], "Which of these cars won the Le Mans 24 Hours?", ["Ford GT40", "Porsche 917", "Fiat 500", "Mini Cooper"]],
    ["motorsport", 1, "Lesquels de ces drapeaux existent en course ?", ["Jaune", "À damier", "Violet", "Rose"], [0, 1], "Which of these flags are used in racing?", ["Yellow", "Chequered", "Purple", "Pink"]],
    ["motorsport", 2, "Lesquels de ces pilotes ont été champions du monde des rallyes ?", ["Sébastien Loeb", "Sébastien Ogier", "Lewis Hamilton", "Fernando Alonso"], [0, 1], "Which of these drivers were World Rally champions?", ["Sébastien Loeb", "Sébastien Ogier", "Lewis Hamilton", "Fernando Alonso"]],
    ["circuits", 1, "Lesquels de ces circuits sont en Europe ?", ["Monza", "Spa-Francorchamps", "Suzuka", "Daytona"], [0, 1], "Which of these circuits are in Europe?", ["Monza", "Spa-Francorchamps", "Suzuka", "Daytona"]],
    ["circuits", 2, "Lesquelles de ces courses sont des courses d'endurance ?", ["Les 24 Heures du Mans", "Les 24 Heures de Daytona", "Le Grand Prix de Monaco", "Le Tour de France auto"], [0, 1], "Which of these races are endurance races?", ["Le Mans 24 Hours", "Daytona 24 Hours", "Monaco Grand Prix", "Tour de France Automobile"]],
    ["trivia", 1, "Lesquelles de ces voitures ont un moteur rotatif ?", ["Mazda RX-7", "Mazda RX-8", "Mazda MX-5", "Honda S2000"], [0, 1], "Which of these cars have a rotary engine?", ["Mazda RX-7", "Mazda RX-8", "Mazda MX-5", "Honda S2000"]],
    ["trivia", 2, "Lesquelles de ces voitures sont des roadsters ?", ["Mazda MX-5", "Porsche Boxster", "Renault Espace", "Peugeot 3008"], [0, 1], "Which of these cars are roadsters?", ["Mazda MX-5", "Porsche Boxster", "Renault Espace", "Peugeot 3008"]],
    ["trivia", 3, "Lesquelles de ces voitures ont été construites en Groupe B ?", ["Peugeot 205 T16", "Lancia Delta S4", "Renault Clio Williams", "Citroën Saxo"], [0, 1], "Which of these cars were built for Group B?", ["Peugeot 205 T16", "Lancia Delta S4", "Renault Clio Williams", "Citroën Saxo"]],
["japan", 1, "Lesquelles de ces marques sont japonaises ?", ["Toyota", "Kia", "Mazda", "Hyundai"], [0, 2], "Which of these brands are Japanese?", ["Toyota", "Kia", "Mazda", "Hyundai"]],
["japan", 1, "Lesquelles de ces voitures sont japonaises ?", ["Nissan GT-R", "Honda NSX", "Mazda RX-7", "Lancia Delta"], [0, 1, 2], "Which of these cars are Japanese?", ["Nissan GT-R", "Honda NSX", "Mazda RX-7", "Lancia Delta"]],
["japan", 2, "Lesquelles de ces voitures ont été produites par Toyota ?", ["Supra", "Celica", "Skyline", "Civic"], [0, 1], "Which of these cars were built by Toyota?", ["Supra", "Celica", "Skyline", "Civic"]],
["japan", 2, "Lesquelles de ces marques sont des marques de luxe japonaises ?", ["Lexus", "Infiniti", "Mazda", "Suzuki"], [0, 1], "Which of these are Japanese luxury brands?", ["Lexus", "Infiniti", "Mazda", "Suzuki"]],
["japan", 3, "Lesquels de ces moteurs sont japonais ?", ["2JZ-GTE", "RB26DETT", "XU10J4", "EJ207"], [0, 1, 3], "Which of these engines are Japanese?", ["2JZ-GTE", "RB26DETT", "XU10J4", "EJ207"]],
["japan", 4, "Lesquelles de ces voitures ont un moteur rotatif Wankel de série ?", ["Mazda Cosmo", "Mazda RX-8", "Mazda MX-5", "NSU Ro 80"], [0, 1, 3], "Which of these production cars have a Wankel rotary engine?", ["Mazda Cosmo", "Mazda RX-8", "Mazda MX-5", "NSU Ro 80"]],
["rally", 1, "Lesquels de ces rallyes comptent ou ont compté pour le WRC ?", ["Monte-Carlo", "Finlande", "Dakar", "Pikes Peak"], [0, 1], "Which of these rallies count or have counted for the WRC?", ["Monte Carlo", "Finland", "Dakar", "Pikes Peak"]],
["rally", 2, "Lesquels de ces pilotes ont été champions du monde des rallyes ?", ["Colin McRae", "Tommi Mäkinen", "Michael Schumacher", "Sébastien Vettel"], [0, 1], "Which of these drivers were world rally champions?", ["Colin McRae", "Tommi Mäkinen", "Michael Schumacher", "Sebastian Vettel"]],
["rally", 2, "Lesquelles de ces voitures ont couru en rallye ?", ["Lancia Stratos", "Ford Escort RS", "Smart ForTwo", "Fiat Multipla"], [0, 1], "Which of these cars raced in rallies?", ["Lancia Stratos", "Ford Escort RS", "Smart ForTwo", "Fiat Multipla"]],
["rally", 3, "Lesquelles de ces voitures étaient du Groupe B ?", ["Audi Sport Quattro S1", "Lancia Delta S4", "Subaru Impreza WRC", "Citroën C4 WRC"], [0, 1], "Which of these cars were Group B?", ["Audi Sport Quattro S1", "Lancia Delta S4", "Subaru Impreza WRC", "Citroën C4 WRC"]],
["rally", 3, "Lesquels de ces pilotes ont gagné le Dakar en voiture ?", ["Stéphane Peterhansel", "Carlos Sainz", "Sébastien Loeb", "Colin McRae"], [0, 1], "Which of these drivers won the Dakar in a car?", ["Stéphane Peterhansel", "Carlos Sainz", "Sébastien Loeb", "Colin McRae"]],
["ev", 1, "Lesquelles de ces voitures sont 100 % électriques ?", ["Tesla Model 3", "Nissan Leaf", "Toyota Corolla essence", "Renault Clio essence"], [0, 1], "Which of these cars are fully electric?", ["Tesla Model 3", "Nissan Leaf", "Petrol Toyota Corolla", "Petrol Renault Clio"]],
["ev", 2, "Lesquels de ces éléments se trouvent dans une voiture électrique ?", ["Une batterie", "Un moteur électrique", "Un pot d'échappement", "Une boîte à 6 rapports"], [0, 1], "Which of these are found in an electric car?", ["A battery", "An electric motor", "An exhaust pipe", "A 6-speed gearbox"]],
["ev", 2, "Lesquelles de ces marques proposent des voitures électriques ?", ["Polestar", "Rivian", "Ferrari V12", "Lada"], [0, 1], "Which of these brands offer electric cars?", ["Polestar", "Rivian", "Ferrari V12", "Lada"]],
["ev", 3, "Lesquels de ces systèmes sont des hybrides ?", ["Toyota Hybrid Synergy Drive", "Nissan e-Power", "Diesel common rail", "Turbo à géométrie variable"], [0, 1], "Which of these are hybrid systems?", ["Toyota Hybrid Synergy Drive", "Nissan e-Power", "Common-rail diesel", "Variable-geometry turbo"]],
["ev", 4, "Lesquels de ces vainqueurs des 24 Heures du Mans étaient hybrides ?", ["Audi R18 e-tron quattro", "Toyota TS050 Hybrid", "Porsche 917", "Ford GT40"], [0, 1], "Which of these Le Mans winners were hybrids?", ["Audi R18 e-tron quattro", "Toyota TS050 Hybrid", "Porsche 917", "Ford GT40"]],
["brands", 4, "Lesquelles de ces marques ont fait partie du groupe BMC ou de British Leyland ?", ["Austin", "Morris", "Citroën", "Fiat"], [0, 1], "Which of these brands were part of BMC or British Leyland?", ["Austin", "Morris", "Citroën", "Fiat"]],
["history", 3, "Lesquelles de ces voitures ont gagné les 24 Heures du Mans ?", ["Bentley Speed Six", "Jaguar C-Type", "Citroën DS", "Renault 5"], [0, 1], "Which of these cars won the 24 Hours of Le Mans?", ["Bentley Speed Six", "Jaguar C-Type", "Citroën DS", "Renault 5"]],
["history", 4, "Lesquelles de ces voitures ont une traction avant d'origine ?", ["Citroën Traction Avant", "Mini 1959", "Porsche 911 classique", "Ford Mustang 1965"], [0, 1], "Which of these cars were front-wheel drive from the start?", ["Citroën Traction Avant", "Mini 1959", "Classic Porsche 911", "1965 Ford Mustang"]],
["engines", 3, "Lesquels de ces moteurs sont des turbodiesel ou des diesel ?", ["TDI", "HDi", "VTEC", "2JZ-GTE"], [0, 1], "Which of these are diesel engines?", ["TDI", "HDi", "VTEC", "2JZ-GTE"]],
["engines", 4, "Lesquelles de ces voitures ont eu un moteur central arrière ?", ["Lamborghini Miura", "Ferrari 308", "Porsche Cayman", "Alfa Romeo Giulia"], [0, 1, 2], "Which of these cars have a mid-engine layout?", ["Lamborghini Miura", "Ferrari 308", "Porsche Cayman", "Alfa Romeo Giulia"]],
["motorsport", 3, "Lesquels de ces circuits accueillent une course d'endurance de 24 heures ?", ["Le Mans", "Spa-Francorchamps", "Monaco", "Suzuka 8 Heures"], [0, 1], "Which of these circuits host a 24-hour endurance race?", ["Le Mans", "Spa-Francorchamps", "Monaco", "Suzuka 8 Hours"]],
["motorsport", 4, "Lesquels de ces pilotes ont gagné les 24 Heures du Mans ?", ["Tom Kristensen", "Jacky Ickx", "Ayrton Senna", "Michael Schumacher"], [0, 1], "Which of these drivers won the 24 Hours of Le Mans?", ["Tom Kristensen", "Jacky Ickx", "Ayrton Senna", "Michael Schumacher"]],
["circuits", 3, "Lesquels de ces circuits sont en Italie ?", ["Monza", "Imola", "Spa-Francorchamps", "Silverstone"], [0, 1], "Which of these circuits are in Italy?", ["Monza", "Imola", "Spa-Francorchamps", "Silverstone"]],
["circuits", 4, "Lesquels de ces circuits ont accueilli un Grand Prix de F1 au Japon ?", ["Suzuka", "Fuji", "Monza", "Interlagos"], [0, 1], "Which of these circuits hosted a Formula 1 Grand Prix in Japan?", ["Suzuka", "Fuji", "Monza", "Interlagos"]],
["countries", 3, "Lesquelles de ces marques sont suédoises ?", ["Volvo", "Koenigsegg", "Lotus", "Skoda"], [0, 1], "Which of these brands are Swedish?", ["Volvo", "Koenigsegg", "Lotus", "Skoda"]],
["countries", 4, "Lesquelles de ces marques sont britanniques ?", ["Morgan", "Caterham", "Pagani", "Spyker"], [0, 1], "Which of these brands are British?", ["Morgan", "Caterham", "Pagani", "Spyker"]],
["numbers", 3, "Lesquelles de ces voitures dépassent 1 000 ch ?", ["Bugatti Veyron", "Rimac Nevera", "Porsche 911 Carrera", "Mazda MX-5"], [0, 1], "Which of these cars exceed 1,000 hp?", ["Bugatti Veyron", "Rimac Nevera", "Porsche 911 Carrera", "Mazda MX-5"]],
["trivia", 3, "Lesquelles de ces voitures sont apparues dans des films de James Bond ?", ["Aston Martin DB5", "Lotus Esprit", "Fiat Panda", "Peugeot 205"], [0, 1], "Which of these cars appeared in James Bond films?", ["Aston Martin DB5", "Lotus Esprit", "Fiat Panda", "Peugeot 205"]],
["trivia", 4, "Lesquelles de ces marques ont un animal sur leur emblème ?", ["Ferrari", "Peugeot", "Mercedes-Benz", "Toyota"], [0, 1], "Which of these brands have an animal on their badge?", ["Ferrari", "Peugeot", "Mercedes-Benz", "Toyota"]]
  ];
  // questions écrites ajoutées : pays, circuits et rallye, anecdotes (codes moteurs, records)
  QBANK.push(
    ["trivia", 1, "Que signifie le sigle « GTI » ?", ["Gran Turismo Injection", "Grand Tourer International", "Gran Touring Italia", "Gas Turbine Injection"], "What does “GTI” stand for?", ["Gran Turismo Injection", "Grand Tourer International", "Gran Touring Italia", "Gas Turbine Injection"]],
    ["trivia", 1, "Combien d'heures dure la course des 24 Heures du Mans ?", ["24 heures", "12 heures", "48 heures", "6 heures"], "How long does the Le Mans 24 Hours race last?", ["24 hours", "12 hours", "48 hours", "6 hours"]],
    ["trivia", 1, "Où est placé le moteur d'une Porsche 911 classique ?", ["À l'arrière", "À l'avant", "Au centre", "Sous le plancher"], "Where is the engine of a classic Porsche 911?", ["At the rear", "At the front", "In the middle", "Under the floor"]],
    ["trivia", 1, "Combien de cylindres compte le moteur de la Bugatti Veyron ?", ["16", "12", "10", "8"], "How many cylinders does the Bugatti Veyron engine have?", ["16", "12", "10", "8"]],
    ["trivia", 1, "Quel type de moteur équipe la Mazda RX-7 ?", ["Un moteur rotatif", "Un V8", "Un diesel", "Un moteur électrique"], "What kind of engine powers the Mazda RX-7?", ["A rotary engine", "A V8", "A diesel", "An electric motor"]],
    ["trivia", 2, "Quel moteur équipe la Peugeot 205 GTI 1.9 ?", ["XU9JA", "TU5", "DW8", "EP6"], "Which engine powers the Peugeot 205 GTI 1.9?", ["XU9JA", "TU5", "DW8", "EP6"]],
    ["trivia", 2, "Quel moteur six cylindres en ligne équipe la Toyota Supra A80 turbo ?", ["2JZ-GTE", "1JZ-GE", "4A-GE", "3S-GTE"], "Which inline-six powers the turbocharged Toyota Supra A80?", ["2JZ-GTE", "1JZ-GE", "4A-GE", "3S-GTE"]],
    ["trivia", 2, "Quel code moteur équipe la Nissan Skyline GT-R R34 ?", ["RB26DETT", "SR20DET", "VQ35", "2JZ-GTE"], "Which engine code powers the Nissan Skyline GT-R R34?", ["RB26DETT", "SR20DET", "VQ35", "2JZ-GTE"]],
    ["trivia", 2, "En quelle année la première Volkswagen Golf GTI est-elle commercialisée ?", ["1976", "1968", "1983", "1990"], "In which year did the first Volkswagen Golf GTI go on sale?", ["1976", "1968", "1983", "1990"]],
    ["trivia", 2, "En quelle année la Citroën 2CV est-elle présentée au public ?", ["1948", "1939", "1955", "1960"], "In which year was the Citroën 2CV unveiled?", ["1948", "1939", "1955", "1960"]],
    ["trivia", 2, "Quel roadster est le deux places le plus vendu au monde ?", ["Mazda MX-5", "Porsche Boxster", "BMW Z3", "Fiat Barchetta"], "Which roadster is the world's best-selling two-seater?", ["Mazda MX-5", "Porsche Boxster", "BMW Z3", "Fiat Barchetta"]],
    ["trivia", 2, "Dans quelle ville est assemblée l'Alpine A110 moderne ?", ["Dieppe", "Flins", "Sandouville", "Maubeuge"], "In which town is the modern Alpine A110 built?", ["Dieppe", "Flins", "Sandouville", "Maubeuge"]],
    ["trivia", 2, "Qui a dessiné la Mini originale de 1959 ?", ["Alec Issigonis", "Colin Chapman", "Ferdinand Porsche", "Marcello Gandini"], "Who designed the original 1959 Mini?", ["Alec Issigonis", "Colin Chapman", "Ferdinand Porsche", "Marcello Gandini"]],
    ["trivia", 3, "Environ combien de Ford RS200 ont été construites ?", ["Environ 200", "Environ 2 000", "Environ 20 000", "Environ 20"], "Roughly how many Ford RS200s were built?", ["About 200", "About 2,000", "About 20,000", "About 20"]],
    ["trivia", 3, "Quel régime moteur maximal la Honda S2000 atteint-elle environ ?", ["9 000 tr/min", "7 000 tr/min", "6 000 tr/min", "12 000 tr/min"], "Roughly what maximum engine speed does the Honda S2000 reach?", ["9,000 rpm", "7,000 rpm", "6,000 rpm", "12,000 rpm"]],
    ["circuits", 1, "Quelle voiture a gagné les 24 Heures du Mans 1991 avec un moteur rotatif ?", ["Mazda 787B", "Peugeot 905", "Porsche 962", "Jaguar XJR-9"], "Which car won the 1991 Le Mans 24 Hours with a rotary engine?", ["Mazda 787B", "Peugeot 905", "Porsche 962", "Jaguar XJR-9"]],
    ["circuits", 1, "Dans quel pays se trouve le circuit de Monza ?", ["Italie", "Espagne", "France", "Allemagne"], "In which country is the Monza circuit?", ["Italy", "Spain", "France", "Germany"]],
    ["circuits", 1, "Dans quel pays se trouve le circuit de Spa-Francorchamps ?", ["Belgique", "Pays-Bas", "Luxembourg", "Suisse"], "In which country is the Spa-Francorchamps circuit?", ["Belgium", "Netherlands", "Luxembourg", "Switzerland"]],
    ["circuits", 1, "Quel est le nom du circuit des 24 Heures du Mans ?", ["Circuit de la Sarthe", "Circuit Paul Ricard", "Circuit de Magny-Cours", "Circuit de Nevers"], "What is the circuit of the Le Mans 24 Hours called?", ["Circuit de la Sarthe", "Circuit Paul Ricard", "Magny-Cours circuit", "Nevers circuit"]],
    ["circuits", 2, "Quel pilote a remporté neuf titres mondiaux de rallye consécutifs ?", ["Sébastien Loeb", "Sébastien Ogier", "Tommi Mäkinen", "Carlos Sainz"], "Which driver won nine consecutive world rally titles?", ["Sébastien Loeb", "Sébastien Ogier", "Tommi Mäkinen", "Carlos Sainz"]],
    ["circuits", 2, "Quel groupe de rallye a été supprimé après la saison 1986 ?", ["Le Groupe B", "Le Groupe A", "Le Groupe N", "Le Groupe C"], "Which rally group was banned after the 1986 season?", ["Group B", "Group A", "Group N", "Group C"]],
    ["circuits", 2, "Quelle Peugeot a dominé le championnat du monde des rallyes en 1985 et 1986 ?", ["205 Turbo 16", "306 Maxi", "106 Rallye", "405 Break"], "Which Peugeot dominated the World Rally Championship in 1985 and 1986?", ["205 Turbo 16", "306 Maxi", "106 Rallye", "405 Estate"]],
    ["circuits", 2, "Quel constructeur a gagné les 24 Heures du Mans en 1992 et 1993 ?", ["Peugeot", "Toyota", "Jaguar", "Mercedes"], "Which manufacturer won the Le Mans 24 Hours in 1992 and 1993?", ["Peugeot", "Toyota", "Jaguar", "Mercedes"]],
    ["circuits", 2, "Quelle marque française remporte le premier championnat du monde des rallyes en 1973 ?", ["Alpine-Renault", "Peugeot", "Citroën", "Simca"], "Which French brand won the first World Rally Championship in 1973?", ["Alpine-Renault", "Peugeot", "Citroën", "Simca"]],
    ["circuits", 3, "Quelle est la longueur approximative de la Nordschleife du Nürburgring ?", ["20,8 km", "13 km", "5,8 km", "25 km"], "Roughly how long is the Nürburgring Nordschleife?", ["20.8 km", "13 km", "5.8 km", "25 km"]],
    ["countries", 1, "De quel pays vient la marque Lamborghini ?", ["Italie", "Allemagne", "Espagne", "France"], "Which country does the Lamborghini brand come from?", ["Italy", "Germany", "Spain", "France"]],
    ["countries", 2, "De quel pays vient la marque Škoda ?", ["République tchèque", "Pologne", "Autriche", "Suède"], "Which country does the Škoda brand come from?", ["Czech Republic", "Poland", "Austria", "Sweden"]],
    ["countries", 2, "De quel pays vient la marque Volvo ?", ["Suède", "Norvège", "Finlande", "Danemark"], "Which country does the Volvo brand come from?", ["Sweden", "Norway", "Finland", "Denmark"]],
    ["countries", 2, "De quel pays vient la marque Hyundai ?", ["Corée du Sud", "Japon", "Chine", "Taïwan"], "Which country does the Hyundai brand come from?", ["South Korea", "Japan", "China", "Taiwan"]],
    ["countries", 1, "De quel pays vient la marque Mazda ?", ["Japon", "Corée du Sud", "Chine", "Thaïlande"], "Which country does the Mazda brand come from?", ["Japan", "South Korea", "China", "Thailand"]],
    ["countries", 2, "De quel pays vient la marque SEAT ?", ["Espagne", "Italie", "Portugal", "France"], "Which country does the SEAT brand come from?", ["Spain", "Italy", "Portugal", "France"]],
    ["countries", 1, "De quel pays vient la marque Ford ?", ["États-Unis", "Royaume-Uni", "Canada", "Allemagne"], "Which country does the Ford brand come from?", ["United States", "United Kingdom", "Canada", "Germany"]],
    ["countries", 2, "De quel pays vient la marque Bentley ?", ["Royaume-Uni", "États-Unis", "Allemagne", "France"], "Which country does the Bentley brand come from?", ["United Kingdom", "United States", "Germany", "France"]],
    ["countries", 2, "De quel pays vient la marque Dacia ?", ["Roumanie", "Bulgarie", "Hongrie", "Turquie"], "Which country does the Dacia brand come from?", ["Romania", "Bulgaria", "Hungary", "Turkey"]],
    ["countries", 1, "De quel pays vient la marque Alfa Romeo ?", ["Italie", "France", "Espagne", "Allemagne"], "Which country does the Alfa Romeo brand come from?", ["Italy", "France", "Spain", "Germany"]],
    ["countries", 1, "De quel pays vient la marque Porsche ?", ["Allemagne", "Autriche", "Suisse", "Italie"], "Which country does the Porsche brand come from?", ["Germany", "Austria", "Switzerland", "Italy"]],
    ["countries", 2, "De quel pays vient la marque Subaru ?", ["Japon", "Corée du Sud", "États-Unis", "Chine"], "Which country does the Subaru brand come from?", ["Japan", "South Korea", "United States", "China"]]
  );

  /** nom propre d'une voiture : le catalogue répète parfois la marque (« Nissan Nissan GT-R ») */
  const cleanName = (c) => { const b = String(c.brand || "").trim(); let n = String(c.name || "").trim(); if (b) { const rx = new RegExp("^(" + b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+){2,}", "i"); n = n.replace(rx, b + " "); } return n; };
  const modelOf = (c) => { const n = cleanName(c), b = String(c.brand || ""); return n.indexOf(b) === 0 ? n.slice(b.length).trim() || n : n; };
  const ctryLabel = (id) => (COUNTRIES.find((k) => k.id === id) || {}).label || "";
  /** construit les 10 questions d'un quiz (mêmes questions, même ordre de réponses pour une même graine : le serveur peut donc corriger) */
  function quizBuild(seed, cat, level, list, opt) {
    opt = opt || {};
    cat = QCATS[cat] ? cat : "brands"; level = Math.max(1, Math.min(4, level | 0 || 1));
    const rng = seeded("quiz|" + seed + "|" + cat + "|" + level), T = opt.t || ((s) => s), lang = opt.lang || "fr";
    const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; };
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];
    const cars = (list || []).filter((c) => c && c.name && c.brand).map((c) => Object.assign({}, c, { name: cleanName(c) })).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const info = (c) => [c.power > 0 && c.power + " ch", c.speed > 0 && c.speed + " km/h", c.zero > 0 && "0-100 : " + c.zero + " s", c.year > 0 && String(c.year)].filter(Boolean).join(" · ");
    const xt = (list) => ({ ids: list.map((c) => c.id), ex: list.map(info) });
    const mk = (q, opts, ans, k, x) => {
      const order = shuffle(opts.map((_, i) => i)), r = { q, o: order.map((i) => opts[i]), a: order.indexOf(ans), k };
      if (x && x.ex && x.ex.length === opts.length) { r.ex = order.map((i) => x.ex[i]); r.ids = order.map((i) => x.ids[i]); } else if (x && x.note) { r.note = x.note; r.ids = x.ids || []; }
      return r;
    };
    const mkm = (q, opts, goods, k) => { const order = shuffle(opts.map((_, i) => i)); const m = goods.map((g) => order.indexOf(g)).sort((x, y) => x - y); return { q, o: order.map((i) => opts[i]), a: m[0], m, k }; };
    const distinct = (arr) => new Set(arr).size === arr.length;
    const gapOk = (vals, ratio) => { const s = vals.slice().sort((x, y) => y - x); return s[1] > 0 ? s[0] / s[1] >= ratio : s[0] > 0; };
    const RATIO = [0, 1.35, 1.12, 1.03, 1.015][level];
    const four = (get, pred) => { for (let i = 0; i < 60; i++) { const c = []; for (let j = 0; j < 4; j++) c.push(pick(cars.filter(pred || (() => true)))); if (!distinct(c.map((x) => x.id)) || c.some((x) => !(get(x) > 0))) continue; if (!distinct(c.map(get))) continue; return c; } return null; };
    const fams = Array.from(new Set(cars.map((c) => familyOf(c.brand)))).filter((f) => cars.filter((c) => familyOf(c.brand) === f).length >= 2);
    const gens = {
      brands: [
        () => { const c = pick(cars), fam = familyOf(c.brand), pool = level >= 2 ? fams.filter((f) => f !== fam && countryOf(f) === countryOf(fam)) : fams.filter((f) => f !== fam); const w = shuffle(pool.length >= 3 ? pool : fams.filter((f) => f !== fam)).slice(0, 3); if (w.length < 3) return null; return mk(fmt(T("Quelle marque fabrique la {0} ?"), [modelOf(c)]), [fam].concat(w), 0, "brand-of"); },
        () => { const f = pick(fams.filter((x) => countryOf(x) !== "xx")); const ids = shuffle(COUNTRIES.filter((k) => k.id !== "xx").map((k) => k.id).filter((i) => i !== countryOf(f))).slice(0, 3); return mk(fmt(T("De quel pays vient la marque {0} ?"), [f]), [ctryLabel(countryOf(f))].concat(ids.map(ctryLabel)), 0, "brand-country"); },
        () => { const f = pick(fams), good = pick(cars.filter((c) => familyOf(c.brand) === f)); const others = shuffle(cars.filter((c) => familyOf(c.brand) !== f && (level < 3 || countryOf(c.brand) === countryOf(f)))).slice(0, 3); if (others.length < 3) return null; const L = [good].concat(others); return mk(fmt(T("Laquelle de ces voitures est signée {0} ?"), [f]), L.map((c) => c.name), 0, "which-brand", xt(L)); }
      ],
      engines: [
        () => { const c = four((x) => x.power, (x) => x.power > 0); if (!c || !gapOk(c.map((x) => x.power), RATIO)) return null; const b = c.reduce((m, x) => (x.power > m.power ? x : m)); return mk(T("Laquelle est la plus puissante ?"), c.map((x) => x.name), c.indexOf(b), "most-power", xt(c)); },
        () => { const c = four((x) => x.speed, (x) => x.speed > 0); if (!c || !gapOk(c.map((x) => x.speed), RATIO)) return null; const b = c.reduce((m, x) => (x.speed > m.speed ? x : m)); return mk(T("Laquelle atteint la vitesse maximale la plus élevée ?"), c.map((x) => x.name), c.indexOf(b), "top-speed", xt(c)); },
        () => { const c = four((x) => x.zero, (x) => x.zero > 0); if (!c) return null; const z = c.map((x) => x.zero).sort((p, q) => p - q); if (!(z[1] / z[0] >= [0, 1.3, 1.1, 1.03, 1.015][level])) return null; const b = c.reduce((m, x) => (x.zero < m.zero ? x : m)); return mk(T("Laquelle est la plus rapide de 0 à 100 km/h ?"), c.map((x) => x.name), c.indexOf(b), "fastest-zero", xt(c)); },
        () => { const c = pick(cars.filter((x) => x.power > 0)), w = [0, 100, 50, 25, 20][level], base = Math.floor(c.power / w) * w; const labs = [base]; [-1, 1, -2, 2, 3].forEach((d) => { if (labs.length < 4 && base + d * w >= 0) labs.push(base + d * w); }); if (labs.length < 4) return null; return mk(fmt(T("Environ combien de chevaux pour la {0} ?"), [c.name]), labs.map((l) => l + " – " + (l + w) + " ch"), 0, "power-range", { ids: [c.id], note: c.name + " : " + c.power + " ch" }); }
      ],
      history: [
        () => { const c = four((x) => x.year, (x) => x.year > 0); if (!c) return null; const ys = c.map((x) => x.year).sort((p, q) => p - q); if (ys[1] - ys[0] < [0, 25, 10, 3, 2][level]) return null; const b = c.reduce((m, x) => (x.year < m.year ? x : m)); return mk(T("Laquelle est la plus ancienne ?"), c.map((x) => x.name), c.indexOf(b), "oldest", xt(c)); },
        () => { const c = four((x) => x.year, (x) => x.year > 0); if (!c) return null; const ys = c.map((x) => x.year).sort((p, q) => q - p); if (ys[0] - ys[1] < [0, 25, 10, 3, 2][level]) return null; const b = c.reduce((m, x) => (x.year > m.year ? x : m)); return mk(T("Laquelle est la plus récente ?"), c.map((x) => x.name), c.indexOf(b), "newest", xt(c)); },
        () => { const c = pick(cars.filter((x) => x.year > 1900)), d = Math.floor(c.year / 10) * 10, ds = [d]; [-10, 10, -20, 20, 30, -30].forEach((k) => { if (ds.length < 4 && d + k >= 1900 && d + k <= 2020) ds.push(d + k); }); return mk(fmt(T("Dans quelle décennie est sortie la {0} ?"), [c.name]), ds.map((x) => fmt(T("années {0}"), [x])), 0, "decade", { ids: [c.id], note: c.name + " : " + c.year }); }
      ],
      motorsport: [
        () => { const lm = cars.filter((c) => c.category === "Le Mans"), rest = cars.filter((c) => c.category !== "Le Mans" && String(c.id).indexOf("rally-") !== 0); if (!lm.length) return null; const L = [pick(lm)].concat(shuffle(rest).slice(0, 3)); return mk(T("Laquelle de ces voitures a couru aux 24 Heures du Mans ?"), L.map((c) => c.name), 0, "lemans", xt(L)); },
        () => { const ra = cars.filter((c) => String(c.id).indexOf("rally-") === 0), rest = cars.filter((c) => String(c.id).indexOf("rally-") !== 0 && c.category !== "Le Mans"); if (!ra.length) return null; const L = [pick(ra)].concat(shuffle(rest).slice(0, 3)); return mk(T("Laquelle de ces voitures est une voiture de rallye ?"), L.map((c) => c.name), 0, "rally", xt(L)); },
        () => { const sc = cars.filter((c) => c.category === "Supercar"), rest = cars.filter((c) => c.category === "Break" || c.category === "Berline"); if (!sc.length) return null; const L = [pick(sc)].concat(shuffle(rest).slice(0, 3)); return mk(T("Laquelle de ces voitures est une supercar ?"), L.map((c) => c.name), 0, "supercar", xt(L)); }
      ]
    };
    const out = [], seen = new Set();
    const add = (q) => { if (q && !seen.has(q.q) && distinct(q.o)) { seen.add(q.q); out.push(q); return true; } return false; };
    // questions écrites : niveau demandé d'abord, puis niveaux voisins
    const bank = QBANK.filter((b) => b[0] === cat);
    const wanted = shuffle(bank.filter((b) => b[1] === level)).concat(shuffle(bank.filter((b) => Math.abs(b[1] - level) === 1))).concat(shuffle(bank.filter((b) => Math.abs(b[1] - level) >= 2)));
    // 2 questions à réponses multiples par partie (niveau demandé d'abord)
    const multi = shuffle(QMULTI.filter((b) => b[0] === cat && b[1] === level)).concat(shuffle(QMULTI.filter((b) => b[0] === cat && b[1] !== level))).slice(0, 2);
    multi.forEach((b) => { const fr = lang === "fr"; add(mkm(fr ? b[2] : b[5], fr ? b[3] : b[6], b[4], "multi")); });
    if (cat === "brands" || cat === "countries") {
      const byC = {}; fams.forEach((f) => { const c = countryOf(f); if (c !== "xx") (byC[c] = byC[c] || []).push(f); });
      const cs = Object.keys(byC).filter((c) => byC[c].length >= 2 && fams.length - byC[c].length >= 2);
      if (cs.length && out.length < 3) { const c = pick(cs), good = shuffle(byC[c]).slice(0, 2), bad = shuffle(fams.filter((f) => countryOf(f) !== c)).slice(0, 2); add(mkm(fmt(T("Lesquelles de ces marques viennent de : {0} ?"), [ctryLabel(c)]), good.concat(bad), [0, 1], "multi-country")); }
    }
    const nWritten = Math.min(wanted.length, QUIZ_N / 2 - multi.length);
    for (let i = 0; i < nWritten; i++) {
      const b = wanted[i], fr = lang === "fr", opts = fr ? b[3] : b[5];
      add(mk(fr ? b[2] : b[4], opts, 0, "written"));
    }
    // questions automatiques
    gens.japan = [
      () => { const jp = cars.filter((c) => countryOf(c.brand) === "jp"), c = four((x) => x.power, (x) => x.power > 0 && countryOf(x.brand) === "jp"); if (!c || !gapOk(c.map((x) => x.power), RATIO) || !jp.length) return null; const b = c.reduce((m, x) => (x.power > m.power ? x : m)); return mk(T("Laquelle de ces voitures japonaises est la plus puissante ?"), c.map((x) => x.name), c.indexOf(b), "jp-power", xt(c)); },
      () => { const c = four((x) => x.year, (x) => x.year > 0 && countryOf(x.brand) === "jp"); if (!c) return null; const ys = c.map((x) => x.year).sort((p, q) => p - q); if (ys[1] - ys[0] < [0, 25, 10, 3, 2][level]) return null; const b = c.reduce((m, x) => (x.year < m.year ? x : m)); return mk(T("Laquelle de ces voitures japonaises est la plus ancienne ?"), c.map((x) => x.name), c.indexOf(b), "jp-oldest", xt(c)); },
      () => { const jp = cars.filter((c) => countryOf(c.brand) === "jp"), rest = cars.filter((c) => countryOf(c.brand) !== "jp" && countryOf(c.brand) !== "xx"); if (!jp.length || rest.length < 3) return null; const L = [pick(jp)].concat(shuffle(rest).slice(0, 3)); return mk(T("Laquelle de ces voitures est japonaise ?"), L.map((c) => c.name), 0, "is-jp", xt(L)); }
    ];
    gens.rally = [gens.motorsport[1]]; gens.ev = [];
    gens.countries = [gens.brands[1], gens.brands[0]]; gens.circuits = gens.motorsport; gens.numbers = gens.engines.concat(gens.history); gens.trivia = [];
    const g = gens[cat] || [];
    for (let tries = 0; tries < 400 && g.length && out.length < QUIZ_N && cars.length > 8; tries++) { let q = null; try { q = pick(g)(); } catch (e) { q = null; } add(q); }
    // complète avec des questions écrites restantes si le catalogue ne suffit pas
    for (let i = nWritten; i < wanted.length && out.length < QUIZ_N; i++) { const b = wanted[i], fr = lang === "fr"; add(mk(fr ? b[2] : b[4], fr ? b[3] : b[5], 0, "written")); }
    return shuffle(out).slice(0, QUIZ_N);
  }

  /** mode chrono : 60 s, +1 par bonne réponse, −5 s par erreur ; questions de toutes les catégories, à réponse unique */
  const CHRONO = { secs: 60, penalty: 5, reward: 2, cap: 40, max: 80 };
  function chronoQuestions(seed, level, list, opt) {
    const cats = Object.keys(QCATS), out = [];
    for (let b = 0; out.length < CHRONO.max && b < 40; b++) quizBuild(seed + "-" + b, cats[b % cats.length], level, list, opt).forEach((q) => { if (!q.m) out.push(q); });
    return out.slice(0, CHRONO.max);
  }
  const chronoField = (ms, level) => "cw" + weekKey(ms).replace("-", "") + "L" + level;
  /** corrige un quiz : renvoie le nombre de bonnes réponses (answers = indices choisis) */
  function quizScore(questions, answers) {
    let n = 0;
    (answers || []).forEach((a, i) => {
      const q = questions[i]; if (!q) return;
      if (q.m) { const got = (Array.isArray(a) ? a : [a]).map(Number).filter((x, j, r) => Number.isInteger(x) && r.indexOf(x) === j).sort((x, y) => x - y); if (got.length === q.m.length && got.every((x, j) => x === q.m[j])) n++; }
      else if (Number(a) === q.a) n++;
    });
    return n;
  }

  // ------------------------------------------------------------------ succès supplémentaires (comptent dans l'XP comme les autres badges)
  const _n = (v) => Number(v) || 0;
  const rarAtLeast = (s, r) => ORDER.slice(0, ORDER.indexOf(r) + 1).reduce((t, k) => t + _n(s.rar && s.rar[k]), 0);
  const brandN = (s, f) => _n(s.byBrand && s.byBrand[f]);
  let BRANDS_TOTAL = 40;
  const BRAND_BADGES = [["Peugeot", "🦁", "Fan du Lion"], ["Renault", "◆", "Ça roule en Losange"], ["BMW", "🌀", "Hélice bavaroise"], ["Mercedes", "⭐", "Étoile à trois branches"], ["Audi", "⭕", "Quatre anneaux"], ["Alfa Romeo", "🐍", "Biscione"], ["Toyota", "🌅", "Soleil levant"], ["Nissan", "🗾", "Samouraï"], ["Ford", "🔵", "Ovale bleu"], ["Porsche", "🏁", "Cap sur Stuttgart"], ["Citroën", "⚙️", "Double chevron"]];
  const EXTRA = [
    ["epic1", "💜", "Première Épique", "Posséder une carte Épique ou mieux", (s) => rarAtLeast(s, "epic"), 1, ""],
    ["epic10", "💎", "Pile d'Épiques", "Posséder 10 cartes Épique ou mieux", (s) => rarAtLeast(s, "epic"), 10, "silver"],
    ["leg1", "🟡", "Première Légendaire", "Posséder une carte Légendaire ou mieux", (s) => rarAtLeast(s, "legendary"), 1, "silver"],
    ["leg5", "👑", "Cinq Légendaires", "Posséder 5 cartes Légendaire ou mieux", (s) => rarAtLeast(s, "legendary"), 5, "gold"],
    ["shiny1", "🌈", "Premier Shiny", "Posséder une carte Shiny", (s) => rarAtLeast(s, "shiny"), 1, "gold"],
    ["shiny5", "✨", "Chasseur de Shiny", "Posséder 5 cartes Shiny ou mieux", (s) => rarAtLeast(s, "shiny"), 5, "gold"],
    ["mythic1", "🔱", "Légende vivante", "Posséder une carte Légende (album complété)", (s) => _n(s.rar && s.rar.mythic), 1, "gold"],
    ["card100", "💯", "Centenaire", "Posséder 100 cartes différentes", (s) => s.cards, 100, "silver"],
    ["card250", "📚", "Bibliothécaire", "Posséder 250 cartes différentes", (s) => s.cards, 250, "gold"],
    ["card400", "🏛️", "Conservateur", "Posséder 400 cartes différentes", (s) => s.cards, 400, "gold"],
    ["brands10", "🧭", "Tour du monde", "Posséder des cartes de 10 marques différentes", (s) => _n(s.brandsOwned), 10, "silver"],
    ["brandsAll", "🌍", "Une de chaque marque", "Posséder au moins une carte de chaque marque du catalogue", (s) => _n(s.brandsOwned), () => BRANDS_TOTAL, "gold"],
    ["opened10", "📦", "Déballeur", "Ouvrir 10 packs", (s) => _n(s.opened), 10, ""],
    ["opened100", "🎁", "Passionné de packs", "Ouvrir 100 packs", (s) => _n(s.opened), 100, "silver"],
    ["opened500", "🧨", "Boulimique de packs", "Ouvrir 500 packs", (s) => _n(s.opened), 500, "gold"],
    ["sets1", "🗂️", "Premier album", "Compléter un album", (s) => _n(s.sets), 1, ""],
    ["sets5", "📒", "Cinq albums", "Compléter 5 albums", (s) => _n(s.sets), 5, "silver"],
    ["sets10", "📗", "Dix albums", "Compléter 10 albums", (s) => _n(s.sets), 10, "silver"],
    ["sets25", "📘", "Archiviste", "Compléter 25 albums", (s) => _n(s.sets), 25, "gold"],
    ["up1", "⬆️", "Carte améliorée", "Améliorer une carte", (s) => _n(s.upgraded), 1, ""],
    ["up10", "🔧", "Préparateur", "Améliorer 10 cartes", (s) => _n(s.upgraded), 10, "silver"],
    ["lvmax", "🏔️", "Au sommet", "Monter une carte au niveau maximum", (s) => _n(s.maxlv), LV_MAX, "gold"],
    ["fuse1", "⚗️", "Alchimiste", "Réaliser une fusion de cartes", (s) => _n(s.fuse), 1, ""],
    ["fuse10", "🧪", "Maître fondeur", "Réaliser 10 fusions", (s) => _n(s.fuse), 10, "silver"],
    ["fuse50", "🔥", "Haut fourneau", "Réaliser 50 fusions", (s) => _n(s.fuse), 50, "gold"],
    ["sell1", "🏷️", "Premier vendeur", "Vendre une carte sur le marché", (s) => _n(s.sold), 1, ""],
    ["sell10", "💼", "Marchand", "Vendre 10 cartes sur le marché", (s) => _n(s.sold), 10, "silver"],
    ["buy1", "🛒", "Premier achat", "Acheter une carte sur le marché", (s) => _n(s.bought), 1, ""],
    ["buy10", "🧾", "Client fidèle", "Acheter 10 cartes sur le marché", (s) => _n(s.bought), 10, "silver"],
    ["pm5", "👁️", "Œil de lynx", "Faire 5 bonnes réponses d'affilée à Plus ou moins", (s) => _n(s.pm), 5, ""],
    ["pm10", "🎯", "Tireur d'élite", "Faire 10 bonnes réponses d'affilée à Plus ou moins", (s) => _n(s.pm), 10, "silver"],
    ["pm20", "🧠", "Encyclopédie", "Faire 20 bonnes réponses d'affilée à Plus ou moins", (s) => _n(s.pm), 20, "silver"],
    ["pm30", "🔮", "Voyant", "Faire 30 bonnes réponses d'affilée à Plus ou moins", (s) => _n(s.pm), 30, "gold"],
    ["quiz1", "❓", "Premier quiz", "Terminer un quiz", (s) => _n(s.quizDone), 1, ""],
    ["quiz10", "📝", "Habitué des quiz", "Terminer 10 quiz", (s) => _n(s.quizDone), 10, "silver"],
    ["quizP1", "💫", "Sans faute", "Réussir un quiz 10 sur 10", (s) => _n(s.quizPerfect), 1, "silver"],
    ["quizP10", "🎓", "Professeur", "Réussir 10 quiz 10 sur 10", (s) => _n(s.quizPerfect), 10, "gold"],
    ["quizE", "🏆", "Expert incollable", "Réussir un quiz Expert 10 sur 10", (s) => _n(s.quizL3), 1, "gold"],
    ["wish5", "💭", "Rêveur", "Mettre 5 cartes dans sa liste de souhaits", (s) => _n(s.wish), 5, ""],
    ["wish20", "🌠", "Grande liste", "Mettre 20 cartes dans sa liste de souhaits", (s) => _n(s.wish), 20, "silver"],
    ["follow1", "🔔", "Sur écoute", "Suivre une voiture ou une marque", (s) => _n(s.follows), 1, ""],
    ["mentor1", "🎓", "Mentor", "Accompagner 1 pilote en tant que mentor", (s) => _n(s.mentored), 1, "silver"],
    ["mentor5", "🧑‍🏫", "Grand frère de la route", "Accompagner 5 pilotes en tant que mentor", (s) => _n(s.mentored), 5, "gold"],
    ["follow10", "📡", "Radar", "Suivre 10 voitures ou marques", (s) => _n(s.follows), 10, "silver"],
    ["swap50", "🕴️", "Courtier", "Réaliser 50 échanges de cartes", (s) => s.trades, 50, "gold"],
    ["streak100", "🌋", "Cent jours", "Visiter le site 100 jours de suite", (s) => s.best, 100, "gold"],
    ["cmt200", "📢", "Orateur", "Poster 200 commentaires", (s) => s.comments, 200, "gold"],
    ["like200", "💖", "Cœur de pierre précieuse", "Aimer 200 voitures", (s) => s.likes, 200, "gold"],
    ["lap100", "🏎️", "Centurion du chrono", "Enregistrer 100 chronos", (s) => s.laps, 100, "gold"],
    ["car10", "🏘️", "Parc automobile", "Publier 10 voitures", (s) => s.cars, 10, "gold"],
    ["lvl10", "🔝", "Mythique", "Atteindre le niveau 10", (s) => s.level, 10, "gold"]
  ].concat(BRAND_BADGES.map((b) => ["b-" + b[0], b[1], b[2], "Posséder 10 cartes " + b[0] + " différentes", (s) => brandN(s, b[0]), 10, "silver"]));
  EXTRA.forEach((b) => BADGES.push({ id: b[0], icon: b[1], label: b[2], desc: b[3], get: b[4], goal: b[5], tier: b[6] }));
  // niveaux relevés (paliers beaucoup plus élevés) : id → [objectif, titre, description]
  const REV = {"lap10": [50, "50 chronos", "Enregistrer 50 chronos"], "lap50": [250, "250 chronos", "Enregistrer 250 chronos"], "globe": [15, "Globe-trotter", "Rouler sur 15 circuits différents"], "cmt10": [100, "Bavard", "Poster 100 commentaires"], "cmt50": [500, "Porte-voix", "Poster 500 commentaires"], "like10": [100, "Passionné", "Aimer 100 voitures"], "like50": [500, "Cœur d'or", "Aimer 500 voitures"], "car3": [10, "Garage rempli", "Publier 10 voitures"], "rsvp3": [15, "Toujours partant", "Participer à 15 sorties"], "streak3": [7, "7 jours d'affilée", "Visiter le site 7 jours de suite"], "streak7": [30, "Mois sans faute", "Visiter le site 30 jours de suite"], "streak30": [90, "Trimestre sans faute", "Visiter le site 90 jours de suite"], "card10": [25, "Collectionneur", "Posséder 25 cartes différentes"], "card50": [100, "Grand collectionneur", "Posséder 100 cartes différentes"], "swap10": [50, "Négociateur", "Réaliser 50 échanges de cartes"], "chal4": [12, "Relève le défi", "Valider 12 défis hebdomadaires"], "chal20": [52, "Infatigable", "Valider 52 défis hebdomadaires"], "lvl5": [7, "Expert", "Atteindre le niveau 7"], "epic10": [30, "Pile d'Épiques", "Posséder 30 cartes Épique ou mieux"], "leg5": [15, "15 Légendaires", "Posséder 15 cartes Légendaire ou mieux"], "shiny5": [10, "Chasseur de Shiny", "Posséder 10 cartes Shiny ou mieux"], "card100": [200, "200 cartes", "Posséder 200 cartes différentes"], "card250": [350, "Bibliothécaire", "Posséder 350 cartes différentes"], "card400": [500, "Conservateur", "Posséder 500 cartes différentes"], "brands10": [25, "Tour du monde", "Posséder des cartes de 25 marques différentes"], "opened10": [50, "Déballeur", "Ouvrir 50 packs"], "opened100": [500, "Passionné de packs", "Ouvrir 500 packs"], "opened500": [2000, "Boulimique de packs", "Ouvrir 2000 packs"], "sets5": [15, "15 albums", "Compléter 15 albums"], "sets10": [30, "30 albums", "Compléter 30 albums"], "sets25": [40, "Archiviste", "Compléter 40 albums"], "up10": [50, "Préparateur", "Améliorer 50 cartes"], "fuse10": [50, "Maître fondeur", "Réaliser 50 fusions"], "fuse50": [250, "Haut fourneau", "Réaliser 250 fusions"], "sell10": [50, "Marchand", "Vendre 50 cartes sur le marché"], "buy10": [50, "Client fidèle", "Acheter 50 cartes sur le marché"], "pm5": [10, "Œil de lynx", "Faire 10 bonnes réponses d'affilée à Plus ou moins"], "pm10": [20, "Tireur d'élite", "Faire 20 bonnes réponses d'affilée à Plus ou moins"], "pm20": [35, "Encyclopédie", "Faire 35 bonnes réponses d'affilée à Plus ou moins"], "pm30": [50, "Voyant", "Faire 50 bonnes réponses d'affilée à Plus ou moins"], "quiz10": [50, "Habitué des quiz", "Terminer 50 quiz"], "quizP10": [30, "Professeur", "Réussir 30 quiz 30 sur 30"], "wish5": [20, "Rêveur", "Mettre 20 cartes dans sa liste de souhaits"], "wish20": [75, "Grande liste", "Mettre 75 cartes dans sa liste de souhaits"], "follow10": [30, "Radar", "Suivre 30 voitures ou marques"], "swap50": [250, "Courtier", "Réaliser 250 échanges de cartes"], "streak100": [365, "Une année entière", "Visiter le site 365 jours de suite"], "cmt200": [2000, "Orateur", "Poster 2000 commentaires"], "like200": [2000, "Cœur de pierre précieuse", "Aimer 2000 voitures"], "lap100": [1000, "Millénaire du chrono", "Enregistrer 1000 chronos"], "car10": [30, "Parc automobile", "Publier 30 voitures"]};
  const BRAND_GOAL = { Peugeot: 20, Renault: 20, BMW: 20, Mercedes: 20, Audi: 20, "Alfa Romeo": 20, Toyota: 18, Nissan: 18, Ford: 18, Porsche: 12, "Citroën": 15 };
  BADGES.forEach((b) => { const r = REV[b.id]; if (r) { b.goal = r[0]; b.label = r[1]; b.desc = r[2]; } else if (b.id.indexOf("b-") === 0) { const k = b.id.slice(2), n = BRAND_GOAL[k] || 10; b.goal = n; b.desc = "Posséder " + n + " cartes " + k + " différentes"; } });
  const setBrandsTotal = (n) => { if (n > 0) BRANDS_TOTAL = n | 0; };

  return {
    TZ, dayKey, monthKey, weekKey, weekStart, weekEnd, parisMidnight, monthLabel,
    setsOf, setReward, yearOf, decadeOf, decadeLabel, LEGENDS, LEGEND_IDS, LV_MAX, LV_NAMES, upgradeCost, OFFER_PCT, dailyOffers, offerPackCost, dailyMissions,
    LEVELS, levelOf, BADGES, goalOf, BLANK_STATS, finish,
    LIVERIES, isLivery, isExtra, liveryCard, circuitPick, CIRCUIT_CARDS, CIRCUIT_BY_ID, CIRCUIT_COUNTRY, isCircuit, circuitRarities, CHRONO, chronoQuestions, chronoField, WHEEL, wheelDraw, wheelLabel, adventToday, adventReward, adventLabel, PITY, HIST_MAX, HIST_LABEL, histAdd, isLocked, RECYCLE_MAX, RAR, ORDER, SHOP_PACK, PACKS, COUNTRIES, countryOf, drawShopPack, isSpecial, computeRarities, pickRarity, drawPack, blankCollection, recount, picKey, picUrls, picKeys, picsHave, picReward,
    FUSE_COUNT, FUSE_NEXT, MARKET_FEE, MARKET_MAX_LISTINGS, marketBounds, marketNet, familyOf, seeded, PM_STATS, pmPair, pmWinner, PM_REWARDS, PM_DAILY_CAP, QCATS, QLEVELS, QUIZ_N, SEASON_LEN, SEASON_DAY_CAP, SEASON_FREE, seasonToday, legendOffer, epicPick, seasonInfo, PASS_TIERS, PASS_STEP, SEASON_PTS, FRAMES, TITLES, passReward, passLabel, SEASON_QUESTS, SEASON_QUEST_FINAL, blankSeason, seasonOf, seasonAdd, passTier, questState, FREEZE_MAX, FREEZE_COST, dayDiff, WELCOME, seasonCosm, QUIZ_REWARD, QUIZ_DAILY_CAP, QBANK, quizBuild, quizScore, setBrandsTotal,
    SHINY, CHALLENGES, DAILY, FEATURED, featuredItems, autoFeatured, weekChallenges, dailyChallenge, PERFECT_WEEK_BONUS, THEMES
  };
});
