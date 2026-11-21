/**
 * MOTORAUTO — règles du jeu PARTAGÉES entre le navigateur et les Cloud Functions.
 * Ce fichier est chargé tel quel par le site (window.MAGameCore) et copié dans functions/ par
 * `node scripts/sync-functions.js` : une seule définition des niveaux, badges, raretés et défis,
 * pour que le serveur et l'écran ne puissent jamais se contredire.
 */
(function (root, factory) {
  const api = factory();
  // @ts-ignore (global du navigateur)
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
    const wk = 1 + Math.round(((+dt - +jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
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
    { n: 17, name: "Immortel", xp: 92000 }, { n: 18, name: "Demi-dieu", xp: 113000 }, { n: 19, name: "Divinité", xp: 138000 }, { n: 20, name: "Ultime", xp: 168000 },
    { n: 21, name: "Astral", xp: 205000 }, { n: 22, name: "Cosmique", xp: 245000 }, { n: 23, name: "Stellaire", xp: 290000 }, { n: 24, name: "Galactique", xp: 340000 }, { n: 25, name: "Infini", xp: 395000 },
    { n: 26, name: "Éternel", xp: 455000 }, { n: 27, name: "Transcendant", xp: 520000 }, { n: 28, name: "Absolu", xp: 590000 }, { n: 29, name: "Souverain", xp: 665000 }, { n: 30, name: "Panthéon", xp: 750000 }
  ];
  function levelOf(xp) {
    let cur = LEVELS[0];
    LEVELS.forEach((l) => { if (xp >= l.xp) cur = l; });
    const next = LEVELS[cur.n] || null;
    return { level: cur, next, pct: next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100, toNext: next ? next.xp - xp : 0 };
  }
  let TOTAL = 111;                                          // nombre de cartes du catalogue (réglé par finish)
  /** id, icône, titre, description, valeur actuelle, objectif, palier visuel */
  /** @type {any[]} badges : { id, icon, label, desc, get(stats), goal, tier, kind, rare? } */
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
  const BLANK_STATS = () => ({ byBrand: {}, rar: {}, brandsOwned: 0, opened: 0, sets: 0, upgraded: 0, maxlv: 0, wish: 0, follows: 0, fuse: 0, sold: 0, bought: 0, pm: 0, quizDone: 0, quizPerfect: 0, quizL3: 0, quizPts: 0, laps: 0, tracks: 0, records: 0, podiums: 0, comments: 0, likes: 0, cars: 0, events: 0, rsvps: 0, days: 0, best: 0, last: "", cards: 0, specials: 0, trades: 0, chal: 0, entries: 0, wins: 0, mentored: 0 });

  /** calcule xp, niveau et badges à partir des compteurs d'un pilote */
  function finish(s, total) {
    if (total) TOTAL = Math.max(1, total | 0);
    s.tracks = s.tracks instanceof Set ? s.tracks.size : s.tracks;
    const base = s.laps * 15 + s.records * 50 + s.podiums * 20 + s.comments * 4 + s.likes + s.cars * 25 + s.events * 20 + s.rsvps * 4 + s.best * 3 + s.cards * 2
      + s.trades * 8 + s.chal * 6 + s.entries * 10 + s.wins * 150 + s.specials * 30 + (Number(s.mentored) || 0) * 40 + (Number(s.quizPts) || 0) * 3;
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
    common: { id: "common", label: "Commune", dust: 10, craft: 30, odds: 0.615 },
    rare: { id: "rare", label: "Rare", dust: 30, craft: 90, odds: 0.26 },
    epic: { id: "epic", label: "Épique", dust: 80, craft: 240, odds: 0.09 },
    legendary: { id: "legendary", label: "Légendaire", dust: 200, craft: 600, odds: 0.03 },
    shiny: { id: "shiny", label: "Shiny", dust: 800, craft: 2400, odds: 0.005 },
    mythic: { id: "mythic", label: "Légende", dust: 600, craft: 0, odds: 0 },
    special: { id: "special", label: "Édition limitée", dust: 150, craft: 0, odds: 0 }
  };
  const ORDER = ["mythic", "shiny", "legendary", "epic", "rare", "common"];          // raretés tirables, de la plus haute à la plus basse
  const isSpecial = (id) => String(id).indexOf("sp-") === 0;
  /** puissance « de classement » : les voitures de course du Mans (identifiants lm-…) pèsent 60 % de leur puissance, pour ne pas écraser les voitures de route */
  const rankPower = (c) => (String(c.id).indexOf("lm-") === 0 ? c.power * 0.6 : c.power);
  /** cartes « Shiny » (arc-en-ciel, ≈ 0,5 % par carte tirée) : voitures mythiques choisies à la main */
  const SHINY = ["peugeot-205-t16", "peugeot-206-wrc", "nissan-skyline-gtr-r34", "nissan-gt-r-r35", "toyota-supra-a80-mk4", "ford-rs200", "ford-escort-rs-cosworth-t35", "audi-r8-v10", "honda-civic-ek9-type-r",
    "lm-ford-gt40", "lm-porsche-917k", "lm-porsche-956", "lm-porsche-962c", "lm-mazda-787b", "lm-mclaren-f1-gtr", "lm-porsche-919",
    // saison 2 : icônes japonaises, anglaises, italiennes et américaines + prototypes d'endurance mythiques
    "toyota-2000gt", "honda-nsx-na1", "mazda-rx-7-type-r-fd3s", "mazda-cosmo-sport-110s", "nissan-skyline-gtr-r32", "lexus-lfa", "jaguar-xj220", "dodge-viper-gts-r", "dodge-challenger-srt-demon",
    "alfa-romeo-33-stradale", "ferrari-dino-246-gt", "lm-ferrari-330-p4", "lm-jaguar-d-type", "lm-ferrari-250lm", "lm-peugeot-905", "lm-porsche-911-gt1-98", "lm-ferrari-499p"];
  /** cartes « Légende » : une par album pays / décennie, gagnée en complétant l'album (jamais tirée en pack, jamais fabriquée) */
  const LEGENDS = {
    "country:fr": "alpine-a110-classic", "country:de": "mb-300-slr", "country:it": "rally-lancia-037", "country:gb": "lm-mirage-gr8",
    "country:jp": "rally-subaru-impreza-gc8", "country:us": "lm-chevrolet-corvette-c5r", "country:se": "rally-saab-96", "country:xx": "rally-i20-n-rally1",
    "decade:1940": "mb-w125", "decade:1950": "mb-300-sl-gullwing", "decade:1960": "rally-citroen-ds-monte", "decade:1970": "rally-lancia-stratos", "decade:1980": "rally-lancia-delta-s4",
    "decade:1990": "mb-clk-gtr", "decade:2000": "lm-audi-r8-lmp", "decade:2010": "mb-f1-hybrid", "decade:2020": "fiat-1000tipla",
    // albums de marque (marques de 3 à 30 modèles)
    "brand:Bugatti": "bugatti-type-57sc-atlantic", "brand:Pagani": "pagani-huayra-codalunga", "brand:Koenigsegg": "koenigsegg-ccxr-trevita", "brand:Mazda": "lm-mazda-767b",
    "brand:Lexus": "lexus-lfa-nurburgring-package", "brand:Datsun": "datsun-240z", "brand:Hennessey": "hennessey-venom-f5-roadster", "brand:Citroën": "rally-citroen-sm",
    // collections thématiques
    "theme:groupe-b": "audi-sport-quattro-s1-e2", "theme:gtr": "nissan-skyline-gt-r-nismo-r32", "theme:type-r": "honda-nsx-r-na1", "theme:evo": "mitsubishi-lancer-evolution-vi-tommi-makinen-edition",
    "theme:subaru-wrx": "subaru-impreza-s204", "theme:toyota-gr": "toyota-sprinter-trueno-ae86", "theme:porsche-911": "porsche-911-gt3-rs-991", "theme:ferrari-v12": "ferrari-365-gtb-4-daytona",
    "theme:bmw-m": "bmw-m1", "theme:amg": "mb-amg-one", "theme:audi-sport": "audi-quattro", "theme:mustang": "ford-mustang-boss-429", "theme:muscle-us": "dodge-charger-daytona",
    "theme:hypercars": "koenigsegg-jesko-absolut", "theme:mclaren": "mclaren-f1", "theme:jaguar": "jaguar-e-type-lightweight", "theme:lotus": "lotus-evija",
    "theme:citroen-rallye": "rally-citroen-bx-4tc", "theme:peugeot-sport": "rally-peugeot-205-t16-e2", "theme:renault-sport": "renault-rs01", "theme:alpine": "alpine-a220",
    "theme:aston-martin": "aston-martin-db5", "theme:lamborghini": "lamborghini-miura-p400", "theme:ferrari-v8": "ferrari-f40", "theme:maserati": "maserati-mc12", "theme:viper": "dodge-viper-acr-vx",
    "theme:lemans-classic": "lm-ferrari-250p", "theme:lemans-modern": "lm-audi-r18-e-tron", "theme:rallye-monde": "rally-mini-cooper-s"
  };
  /** icônes « Légendaires » fixées à la main (leur rareté ne dépend pas du rang calculé) */
  const PIN_LEGENDARY = ["ferrari-250-gto", "ferrari-f40", "ferrari-f50", "ferrari-enzo", "ferrari-laferrari", "ferrari-288-gto", "mclaren-f1", "bugatti-type-57sc-atlantic", "bugatti-type-41-royale", "bugatti-eb110-super-sport",
    "bugatti-veyron-16-4", "porsche-959", "porsche-carrera-gt", "porsche-911-carrera-rs-2-7", "lamborghini-miura-p400", "lamborghini-countach-lp400", "pagani-zonda-f", "pagani-huayra-bc", "maserati-mc12", "mclaren-p1", "alfa-romeo-8c-competizione", "alfa-romeo-33-stradale-2023", "alfa-romeo-8c-2300-le-mans", "audi-sport-quattro", "bmw-507", "bmw-3-0-csl", "lm-mercedes-300sl", "lm-ferrari-250-tr", "nissan-gt-r-nismo-r35", "honda-nsx-r-gt", "lamborghini-miura-s", "lamborghini-miura-sv", "ferrari-250-mm", "ferrari-250-gt-berlinetta-tour-de-france", "ferrari-250-gt-california-spyder", "ferrari-250-gt-swb", "ferrari-275-gtb-4", "ferrari-testarossa", "ferrari-dino-246-gts", "porsche-356-speedster", "porsche-550-spyder", "porsche-904-carrera-gts", "porsche-911-carrera-rs-993", "porsche-911-carrera-rsr-2-8", "porsche-911-carrera-rsr-3-0", "mclaren-f1-lm", "dodge-viper-acr-1999", "ford-mustang-shelby-gt350-1965", "ford-mustang-shelby-gt500-1967", "lotus-esprit-turbo", "aston-martin-db4-gt-zagato", "aston-martin-vulcan", "aston-martin-one-77", "jaguar-xkss", "jaguar-e-type-series-1", "ford-gt-2005", "ford-gt-mk-ii", "ford-gt40-mk-ii", "ford-gt40-mk-iv"];
  /** icônes « Épiques » au minimum : modèles cultes que leur puissance seule laissait « communs » (jamais en dessous, mais jamais au-dessus du rang calculé) */
  const PIN_EPIC = ["mitsubishi-lancer-evolution-vi", "mitsubishi-lancer-evolution-ix", "mitsubishi-lancer-evolution-x-final-edition", "mitsubishi-3000gt-vr-4", "subaru-impreza-wrx-sti-type-ra", "subaru-impreza-s204",
    "renault-clio-williams-16s", "renault-clio-v6", "renault-r5-turbo", "peugeot-205-gti", "peugeot-205-rallye", "peugeot-106-rallye", "peugeot-306-maxi", "alpine-a110-2017", "alpine-a610", "alpine-gta",
    "honda-nsx-r-na1", "honda-nsx-type-s-nc1", "toyota-sprinter-trueno-ae86", "toyota-corolla-levin-ae86-gt-apex", "toyota-gr-supra-a90", "toyota-celica-gt-four-st205", "mazda-rx-7-spirit-r", "datsun-240z",
    "lm-ferrari-250-tr", "lm-aston-dbr1", "lm-bentley-speed-six", "lm-alpine-a442b", "lm-peugeot-908", "lm-audi-r18-tdi", "ford-mustang-boss-302", "ford-mustang-shelby-gt500-1967", "dodge-charger-r-t-1968", "dodge-viper-rt-10", "peugeot-206-s16-gt", "peugeot-206-rc", "peugeot-306-s16", "saxo-vts", "peugeot-106-s16", "nissan-skyline-gtr-classic", "nissan-skyline-gtr-r33", "nissan-silvia-s13", "nissan-silvia-s14", "nissan-silvia-s15", "honda-civic-ep3-type-r", "honda-civic-fn2-type-r", "honda-civic-fk2-type-r", "honda-civic-fk8-type-r", "honda-civic-fl5-type-r", "toyota-celica-supra-a40-a60", "toyota-supra-a70", "toyota-supra-a90-mk5", "toyota-mr2-aw11", "toyota-mr2-sw20", "citroen-xsara-vts", "citroen-xsara-wrc", "ford-escort-rs-cosworth-t25", "ford-sierra-rs-cosworth", "ford-focus-rs-mk2", "peugeot-207-s2000", "vw-golf-gti-mk1", "vw-golf-gti-mk2", "vw-golf-gti-mk3", "vw-golf-gti-mk4", "vw-golf-gti-mk5", "vw-golf-gti-mk6", "vw-golf-gti-mk7", "vw-golf-gti-mk8", "nissan-silvia-ps13", "alfa-romeo-147-gta", "alfa-romeo-156-gta", "alfa-romeo-8c-spider", "alfa-romeo-giulia-gta", "alpine-a310", "audi-rs2-avant", "audi-rs3-8p", "audi-rs3-8v", "audi-rs3-8y", "audi-rs4-b5", "audi-rs4-b7", "audi-rs4-b9", "audi-rs5-8t", "audi-rs5-b9", "audi-rs6-c5", "audi-rs6-c6", "audi-rs6-c7", "audi-rs6-c8", "audi-r8-v8", "bmw-2002", "bmw-2002-turbo", "bmw-m3-e30", "bmw-m3-e36", "bmw-m3-e46", "bmw-z8", "bmw-1m-e82", "bmw-m2-f87", "bmw-m2-g87", "bmw-m3-e92", "bmw-m3-f80", "bmw-m4-f82", "bmw-m3-g80", "bmw-m4-g82", "bmw-m5-e28", "bmw-m5-e39", "bmw-m3-gtr-e46", "lm-ferrari-330-trilm", "rally-ford-escort-rs1800", "rally-peugeot-205-t16-gr", "rally-lancia-integrale", "rally-gr-yaris-rally1", "rally-gr-yaris", "rally-gr-yaris-rally2", "rally-gr-corolla", "rally-focus-wrc", "rally-fiesta-wrc", "rally-fiesta-wrc-2017", "rally-c4-wrc", "rally-ds3-wrc", "rally-polo-wrc", "rally-polo-gti-r5", "rally-clio-r3", "rally-s2000-punto", "rally-lancer-evo-x-r4", "renault-r5-gt-turbo", "toyota-corolla-gt-s-ae86-amerique", "toyota-celica-gt-four-st165", "toyota-celica-gt-four-st185", "toyota-gr-yaris", "toyota-gr-yaris-morizo-rz", "toyota-gr-supra-3-0-premium", "toyota-gt86", "toyota-mr2-sw20-turbo", "toyota-altezza-rs200", "nissan-skyline-2000gt-r-hakosuka-pgc10", "toyota-corolla-levin-ae111-bz-r", "nissan-skyline-2000gt-r-kenmeri-kpgc110", "nissan-skyline-rs-turbo-r30", "nissan-skyline-gts-r-r31", "nissan-skyline-gts-t-type-m-r32", "nissan-skyline-gt-r-v-spec-ii-r34", "nissan-skyline-gt-r-m-spec-nur", "nissan-skyline-gt-r-v-spec-r33", "nissan-skyline-gt-r-v-spec-r32", "nissan-silvia-180sx", "nissan-silvia-200sx-s14a", "nissan-cefiro-a31-skyline-a-turbo", "nissan-gt-r-track-edition-r35", "honda-integra-type-r-dc2", "honda-integra-type-r-dc5", "honda-nsx-na2", "honda-nsx-type-s-na2", "honda-s2000-ap1", "honda-s2000-ap2", "honda-s2000-cr", "honda-beat", "honda-civic-type-r-fd2", "honda-civic-type-r-ek9-mugen", "honda-civic-type-r-mugen-rr-fd2", "mazda-rx-7-sa22c", "mazda-rx-7-fb", "mazda-rx-7-turbo-fc3s", "mazda-rx-8", "mazda-rx-8-r3", "mazda-familia-gt-r-bg8z", "mazda-autozam-az-1", "mazda-mx-5-miata-rf", "mazda-savanna-rx-7-infini", "mitsubishi-lancer-evolution-i", "mitsubishi-lancer-evolution-ii", "mitsubishi-lancer-evolution-iii", "mitsubishi-lancer-evolution-iv", "mitsubishi-lancer-evolution-v", "mitsubishi-lancer-evolution-vii", "mitsubishi-lancer-evolution-viii", "mitsubishi-lancer-evolution-viii-mr-fq-400", "mitsubishi-lancer-evolution-ix-mr", "mitsubishi-lancer-evolution-x", "mitsubishi-lancer-evolution-x-fq-440-mr", "acura-nsx-na1", "suzuki-cappuccino", "isuzu-bellett-gt-r", "ferrari-250-europa", "ferrari-250-gt-boano", "ferrari-250-gt-lusso", "ferrari-330-gt-2-2", "ferrari-275-gtb", "ferrari-275-gts", "ferrari-dino-206-gt", "porsche-356-a", "porsche-356-b", "porsche-356-c", "porsche-356-carrera-2", "porsche-911-speedster-1989", "porsche-911-carrera-rs-964", "porsche-911-speedster-997", "subaru-brz", "subaru-brz-zd8", "subaru-brz-ts", "dodge-challenger-t-a", "dodge-charger-daytona-r-t-2024", "dodge-challenger-srt8", "dodge-challenger-srt-hellcat", "dodge-challenger-srt-super-stock", "dodge-challenger-srt-demon-170", "ford-mustang-boss-302-2012", "ford-mustang-shelby-gt350r", "lotus-esprit-turbo-hc", "lotus-esprit-s4", "lotus-esprit-s4s", "lotus-esprit-v8", "lotus-esprit-v8-se", "lotus-esprit-v8-final-edition", "lotus-elise-s1", "lotus-exige-s1", "lotus-exige-s2", "lotus-exige-s", "lotus-exige-s3", "lotus-exige-sport-350", "aston-martin-db4-gt", "aston-martin-db6", "jaguar-e-type-series-2", "jaguar-e-type-series-3", "jaguar-e-type-reborn", "jaguar-xkss-continuation", "ford-escort-rs-turbo-s2", "ford-escort-rs2000-4x4", "ford-sierra-rs500-cosworth", "ford-focus-rs-mk1", "ford-focus-rs500"];
  const LEGEND_IDS = Object.keys(LEGENDS).map((k) => LEGENDS[k]);
  const PRESTIGE = /ferrari|lamborghini|porsche|mclaren|bugatti|aston martin|maserati|pagani|koenigsegg|lotus|bentley|rolls|de tomaso|shelby|jaguar|alpine|lancia|abarth/i;
  const SPORTY = /\b(gt|gti|gtr|gt-r|gto|gts|gt3|gt2|gt4|rs ?\d{0,2}|type[ -]?r|m[1-8]\d{0,2}i?|amg|cosworth|turbo|quadrifoglio|integrale|nismo|sti|evo|evolution|cup|trophy|stratos|csl|black series|competition|lightweight|clubsport|speedster|roadster|v12|v10|wrc|r5|group b|groupe b|supra|nsx|rx-7|skyline|mustang|corvette|viper|cayman|boxster|elise|exige|evora|z4|mx-5|gr ?\w*|r32|vr6|16s|s[2-8])\b/i;
  const pct = (sortedAsc, v) => { let lo = 0, hi = sortedAsc.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sortedAsc[m] < v) lo = m + 1; else hi = m; } return sortedAsc.length > 1 ? lo / (sortedAsc.length - 1) : 0; };
  /**
   * Score de prestige d'une voiture (0 à ~100) : performances relatives (puissance, vitesse, 0 à 100) + catégorie + marque + version sportive + âge de collection.
   * Une Ferrari 250 GTO ou une Delta Integrale ne finit donc plus « commune » parce que sa puissance est modeste.
   */
  const EPIC_P = 0.10;   // part (par score) des cartes épiques « calculées » ; les cartes épinglées (PIN_EPIC) s'ajoutent
  function computeRarities(list) {
    const pw = list.map(rankPower).sort((a, b) => a - b), sp = list.map((c) => Number(c.speed) || 0).filter((v) => v > 0).sort((a, b) => a - b), zr = list.map((c) => Number(c.zero) || 0).filter((v) => v > 0).sort((a, b) => a - b);
    const score = (c) => {
      const pp = pct(pw, rankPower(c)), ps = c.speed > 0 ? pct(sp, c.speed) : pp, pz = c.zero > 0 ? 1 - pct(zr, c.zero) : pp, id = String(c.id), name = String(c.name || ""), y = Number(c.year) || 0, cat = String(c.category || "");
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
      map.set(c.id, LEGEND_IDS.indexOf(c.id) >= 0 ? "mythic" : SHINY.indexOf(c.id) >= 0 ? "shiny" : PIN_LEGENDARY.indexOf(c.id) >= 0 ? "legendary" : p < 0.06 ? "legendary" : (p < EPIC_P || PIN_EPIC.indexOf(c.id) >= 0) ? "epic" : p < 0.55 ? "rare" : "common");
    });
    return map;
  }
  /** poids d'UNE carte de chaque rareté : plus la rareté est haute, moins chaque carte sort. Les probabilités par rareté sont calculées d'après le NOMBRE de cartes de chaque rareté (voir oddsOf), donc elles suivent le catalogue */
  const CARD_WEIGHT = { common: 1, rare: 0.6, epic: 0.34, legendary: 0.2, shiny: 0.1 };
  const oddsCache = new WeakMap();
  function oddsOf(rarities) {
    if (!rarities || typeof rarities.forEach !== "function") return null;
    if (oddsCache.has(rarities)) return oddsCache.get(rarities);
    const n = {}; rarities.forEach((r, id) => { if (CARD_WEIGHT[r] && !isSpecial(id) && !isExtra(id)) n[r] = (n[r] || 0) + 1; });
    let tot = 0; Object.keys(CARD_WEIGHT).forEach((r) => { tot += (n[r] || 0) * CARD_WEIGHT[r]; });
    const o = {}; Object.keys(CARD_WEIGHT).forEach((r) => { o[r] = tot ? (n[r] || 0) * CARD_WEIGHT[r] / tot : RAR[r].odds; });
    oddsCache.set(rarities, o); return o;
  }
  /** chance qu'une carte précise sorte d'un pack, pour chaque rareté (utile pour l'affichage) */
  function dropRates(rarities) {
    const o = oddsOf(rarities) || {}, n = {}; rarities.forEach((r, id) => { if (CARD_WEIGHT[r] && !isSpecial(id) && !isExtra(id)) n[r] = (n[r] || 0) + 1; });
    return Object.keys(CARD_WEIGHT).map((r) => ({ rarity: r, count: n[r] || 0, odds: o[r] || 0, perCard: n[r] ? o[r] / n[r] : 0 }));
  }
  function pickRarity(rng, min, odds) {
    const x = rng(); let acc = 0; odds = odds || {};
    for (const id of ["common", "rare", "epic", "legendary", "shiny"]) {
      acc += odds[id] != null ? odds[id] : RAR[id].odds;
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
    const od = oddsOf(rarities);
    for (let i = 0; i < 3; i++) out.push(pick(pickRarity(rng, i === 2 ? (legendPity ? "legendary" : epicPity ? "epic" : pity ? "rare" : null) : null, od)));
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
  /** @type {Array<[RegExp, string]>} expression sur la marque → code pays */
  const BRAND_COUNTRY = [
    [/^(renault|alpine|peugeot|citro|ds\b|matra|bugatti|delahaye|talbot|lorraine|chenard|rondeau|vilebrequin|simca|venturi)/i, "fr"],
    [/^(mercedes|sauber|bmw|audi|auto union|volkswagen|vw\b|opel|porsche|dauer|ruf|smart|maybach)/i, "de"],
    [/^(alfa|ferrari|lancia|fiat|abarth|lamborghini|maserati|pagani)/i, "it"],
    [/^(bentley|jaguar|aston|mini\b|lagonda|mclaren|mg\b|prodrive|mirage|lotus|rover|land rover|tvr|caterham|morgan)/i, "gb"],
    [/^(toyota|nissan|datsun|honda|mazda|mitsubishi|subaru|suzuki|lexus|acura|infiniti|daihatsu|isuzu)/i, "jp"],
    [/^(ford|chevrolet|cadillac|dodge|chrysler|tesla|jeep|buick|pontiac|shelby|gmc|hennessey|ssc\b|saleen|vector|panoz|fisker|delorean|plymouth|oldsmobile|lincoln|mercury|hummer|rivian|lucid)/i, "us"],
    [/^(volvo|saab|koenigsegg|polestar)/i, "se"]
  ];
  function countryOf(brand) {
    const b = String(brand || "").trim();
    for (const [rx, id] of BRAND_COUNTRY) if (rx.test(b)) return id;
    return "xx";
  }
  /** packs de la boutique : « world » (toutes les voitures) et un pack par pays ; 3 cartes dont 1 « rare » ou mieux */

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
  const PACKS = { world: { id: "world", label: "Pack mondial", cost: 200, cards: 3, min: "rare", country: "" } };
  COUNTRIES.forEach((k) => { PACKS[k.id] = { id: k.id, label: "Pack " + k.label, cost: k.cost, cards: 3, min: "rare", country: k.id }; });
  PACKS.circuit = { id: "circuit", label: "Pack Circuit", cost: 400, cards: 3, min: "rare", country: "", circuit: true };
  /** Pack Prestige (permanent) : seulement les grandes marques de rêve, première carte au moins « épique » */
  const PRESTIGE_PACK_RX = /^(ferrari|lamborghini|porsche|mclaren|bugatti|aston|maserati|pagani|koenigsegg|bentley|rolls|rimac|hennessey|lotus|ssc)/i;
  const isPrestige = (c) => !!c && PRESTIGE_PACK_RX.test(String(c.brand || ""));
  PACKS.prestige = { id: "prestige", label: "Pack Prestige", cost: 450, cards: 3, min: "epic", country: "", prestige: true };
  // ------------------------------------------------------------------ packs thématiques temporaires (calendrier, heure de Paris)
  /** from / to : [mois, jour] inclus, chaque année. Le pack n'est achetable que pendant sa fenêtre. */
  const THEME_PACKS = {
    th_rallye: { id: "th_rallye", name: "Rallye", icon: "🏔️", cost: 250, from: [1, 15], to: [2, 2], about: "Monte-Carlo, groupe B, WRC : les reines des spéciales", style: "--p1:#1e293b;--p2:#f97316;--p3:#f8fafc" },
    th_lemans: { id: "th_lemans", name: "24 Heures du Mans", icon: "🏁", cost: 280, from: [6, 8], to: [6, 22], about: "Prototypes et GT d'endurance de la Sarthe", style: "--p1:#0b1d51;--p2:#facc15;--p3:#f8fafc" },
    th_muscle: { id: "th_muscle", name: "Muscle cars", icon: "🇺🇸", cost: 250, from: [7, 1], to: [7, 14], about: "V8 américains : Mustang, Camaro, Charger, Corvette…", style: "--p1:#7f1d1d;--p2:#f8fafc;--p3:#1d4ed8" },
    th_supercar: { id: "th_supercar", name: "Supercars", icon: "💎", cost: 320, from: [8, 15], to: [8, 29], about: "Les voitures de rêve : semaine de Monterey", style: "--p1:#111827;--p2:#e5e7eb;--p3:#a78bfa" },
    th_youngtimer: { id: "th_youngtimer", name: "Youngtimers", icon: "📼", cost: 220, from: [9, 1], to: [9, 14], about: "Les années 80 et 90 : les futures collectors", style: "--p1:#4c1d95;--p2:#22d3ee;--p3:#f472b6" },
    th_jdm: { id: "th_jdm", name: "JDM", icon: "🗾", cost: 250, from: [10, 25], to: [11, 15], about: "Le Japon sur route et sur circuit", style: "--p1:#ffffff;--p2:#bc002d;--p3:#1f2937" },
    th_hypercar: { id: "th_hypercar", name: "Hypercars", icon: "🚀", cost: 380, from: [3, 5], to: [3, 19], about: "Bugatti, Koenigsegg, Pagani, Rimac : le salon de Genève", min: "epic", style: "--p1:#0f172a;--p2:#38bdf8;--p3:#f1f5f9" },
    th_classic: { id: "th_classic", name: "Classiques", icon: "🎩", cost: 260, from: [4, 10], to: [4, 24], about: "Avant 1976 : les anciennes qui ont fait la légende", style: "--p1:#3f2d1d;--p2:#d4a373;--p3:#fefae0" },
    th_sport_de: { id: "th_sport_de", name: "Sportives allemandes", icon: "🍺", cost: 260, from: [10, 1], to: [10, 14], about: "AMG, M, RS, GT3 : la précision allemande", style: "--p1:#111111;--p2:#dd0000;--p3:#ffce00" },
    th_prestige: { id: "th_prestige", name: "Prestige de fin d'année", icon: "🎄", cost: 350, from: [12, 15], to: [12, 31], about: "Ferrari, Lamborghini, Porsche, Aston Martin… une carte épique ou mieux garantie", min: "epic", style: "--p1:#14532d;--p2:#fbbf24;--p3:#fef3c7" }
  };
  Object.keys(THEME_PACKS).forEach((id) => { const t = THEME_PACKS[id]; PACKS[id] = { id, label: "Pack " + t.name, cost: t.cost, cards: 3, min: t.min || "rare", country: "", theme: id }; });
  /** économie : tous les packs coûtent 40 % de moins (arrondi à la dizaine) — la collection dépasse 1500 cartes, il fallait rendre les cristaux plus utiles */
  const PACK_PRICE_MUL = 0.6;
  Object.keys(PACKS).forEach((k) => { PACKS[k].cost = Math.max(10, Math.round((PACKS[k].cost * PACK_PRICE_MUL) / 10) * 10); });
  const RALLY_RX = /rall(y|ye)\b|wrc|groupe? b\b|group b\b|integrale|stratos|037|205 t16|escort.*cosworth|sierra.*cosworth|impreza|lancer.*evo|celica.*gt-?four|quattro s1|delta s4|metro 6r4|corolla.*wrc|yaris.*wrc|i20.*wrc|puma.*rally|c3.*wrc|focus.*wrc|clio.*(williams|maxi)|a110.*(1600|1800)|r5 turbo|stratos/i;
  const _md = (ms) => { const k = dayKey(ms === undefined ? Date.now() : ms); return Number(k.slice(5, 7)) * 100 + Number(k.slice(8, 10)); };
  /** la voiture appartient-elle au thème ? (c : { brand, model|name, category, year|years }) */
  function themeMatch(id, c) {
    if (!c) return false;
    const name = String(c.brand || "") + " " + String(c.model || c.name || ""), y = yearOf(c);
    switch (id) {
      case "th_lemans": return c.category === "Le Mans";
      case "th_rallye": return RALLY_RX.test(name);
      case "th_muscle": return countryOf(c.brand) === "us" && ((y > 0 && y <= 1978) || /mustang|camaro|charger|challenger|corvette|firebird|trans.?am|barracuda|cuda|cobra|gto|road runner|viper|hellcat|demon|gt500|boss 302|shelby/i.test(name));
      case "th_supercar": return c.category === "Supercar";
      case "th_youngtimer": return y >= 1980 && y <= 1999;
      case "th_jdm": return countryOf(c.brand) === "jp";
      case "th_hypercar": return /^(bugatti|koenigsegg|pagani|rimac|hennessey|ssc|lotus evija|mclaren)/i.test(String(c.brand || "")) && (y >= 2000 || /one|p1|f1|speedtail|senna|w1/i.test(name));
      case "th_classic": return y > 0 && y <= 1975 && !isCircuit(c.id);
      case "th_sport_de": return countryOf(c.brand) === "de" && /amg|\bm[1-8]\b|\bm\d{3}|\brs ?\d|gt3|gt2|gts|turbo|black series|r8|sls|csl|\bgt\b|cosworth|clk gtr|911|carrera|ruf|quattro|gti|\bs\d{1,2}\b|sport/i.test(name);
      case "th_prestige": return isPrestige(c);
      default: return false;
    }
  }
  /** pack actif à cette date ? (ov : exceptions { id: true | false } décidées par l'administration) */
  function themePackActive(id, ms, ov) {
    const t = THEME_PACKS[id]; if (!t) return false;
    if (ov && ov[id] === true) return true;
    if (ov && ov[id] === false) return false;
    const v = _md(ms), a = t.from[0] * 100 + t.from[1], b = t.to[0] * 100 + t.to[1];
    return a <= b ? v >= a && v <= b : v >= a || v <= b;
  }
  const themePacksNow = (ms, ov) => Object.keys(THEME_PACKS).filter((id) => themePackActive(id, ms, ov)).map((id) => THEME_PACKS[id]);
  /** prochaine ouverture d'un pack (jours restants, 0 = actif) pour l'annonce « bientôt » */
  function themePackNext(id, ms) {
    const t = THEME_PACKS[id]; if (!t) return -1;
    if (themePackActive(id, ms)) return 0;
    const base = ms === undefined ? Date.now() : ms;
    for (let i = 1; i <= 366; i++) if (themePackActive(id, base + i * DAY_MS)) return i;
    return -1;
  }
  const SHOP_PACK = { cost: PACKS.world.cost, cards: 3 };
  function drawShopPack(rarities, ids, rng, min, n) {
    ids = ids.filter((id) => rarities.get(id) !== "mythic");
    const by = {}; ORDER.forEach((r) => { by[r] = []; });
    ids.forEach((id) => { const r = rarities.get(id); if (by[r]) by[r].push(id); });
    const pick = (r) => { const list = by[r] && by[r].length ? by[r] : ids; return list[Math.floor(rng() * list.length)]; };
    // rareté minimale : si le pays n'a aucune carte assez rare, on prend la meilleure rareté disponible
    const od = oddsOf(rarities);
    let first = pick(pickRarity(rng, min || "rare", od));
    if ((rarities.get(first) === "common") && ids.some((id) => rarities.get(id) !== "common")) {
      const better = ids.filter((id) => rarities.get(id) !== "common"); first = better[Math.floor(rng() * better.length)];
    }
    const out = [first];
    while (out.length < (n || 2)) {
      let nx = pick(pickRarity(rng, null, od));
      for (let k = 0; k < 6 && out.indexOf(nx) >= 0 && ids.length > out.length; k++) nx = pick(pickRarity(rng, null, od));   // évite le doublon dans le même pack quand c'est possible
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
    if (n === 24) return { dust: 250, bonus: 2, card: true, prestige: 1 };
    const r = { dust: 15 + n * 3 };
    if (n === 12) r.prestige = 1;                              // pack Prestige offert à mi-parcours et à Noël
    if (n % 6 === 0) r.bonus = 1;
    if (n === 9 || n === 15 || n === 21) r.freeze = 1;
    if (n % 6 === 3) r.pts = 20;
    return r;
  }
  const adventLabel = (r) => [r.dust && r.dust + " cristaux", r.bonus && r.bonus + " pack" + (r.bonus > 1 ? "s" : "") + " bonus", r.prestige && "1 pack Prestige", r.freeze && "1 gel de série", r.pts && r.pts + " points de saison", r.card && "la carte de Noël"].filter(Boolean).join(" + ");
  /** objectif d'équipe d'un club : 30 cartes ouvertes par membre dans la semaine, au moins 60, arrondi à la dizaine */
  const clubGoalTarget = (members) => Math.max(60, Math.round((Number(members) || 0) * 30 / 10) * 10);
  const HIST_MAX = 6;
  const HIST_LABEL = { daily: "Pack du jour", bonus: "Pack bonus", shop: "Pack acheté", craft: "Fabriquée", offer: "Carte du jour", fuse: "Fusion", trade: "Échange", market: "Marché", pass: "Pass de saison", album: "Album", gift: "Cadeau", wheel: "Roue", advent: "Avent", affiche: "Défi à cartes" };
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
    Object.keys(doc.owned || {}).forEach((k) => { if (doc.owned[k] > 0) { if (isSpecial(k)) s++; else { c++; if (isCircuit(k)) ci++; else if (isLivery(k)) lv++; } } });
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
    { id: "wish3", icon: "⭐", label: "Mets 3 cartes dans ta wishlist", goal: 3, src: "state:wish", reward: { dust: 20 } },
    // saison 2 : défis liés aux nouveaux packs, aux raretés et aux albums (comptés par le serveur)
    { id: "theme1", icon: "🎯", label: "Ouvre un pack thématique ou Prestige", goal: 1, src: "log:theme", reward: { dust: 60 } },
    { id: "epic2", icon: "💜", label: "Pioche 2 cartes épiques ou mieux dans des packs", goal: 2, src: "log:epic", reward: { dust: 50 } },
    { id: "album1", icon: "📚", label: "Termine un album de collection (et gagne sa Légende)", goal: 1, src: "log:album", reward: { dust: 80 } }
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
  /** défis à cartes : une « affiche » de voiture = plusieurs défis ; tous validés = la carte de la voiture est gagnée (5 affiches par mois) */
  const CARD_CHALS = [
    { id: "c-album", icon: "📚", label: (n, b, g) => "Termine " + g + " album" + (g > 1 ? "s" : "") + " de collection ce mois-ci" },
    { id: "c-react", icon: "🔥", label: (n) => "Réagis à la fiche de « " + n + " »" },
    { id: "c-comment", icon: "✍️", label: (n) => "Donne ton avis sur « " + n + " » (commentaire)" },
    { id: "c-brand", icon: "🏁", label: (n, b, g) => "Possède " + g + " cartes " + b },
    { id: "c-quiz", icon: "🧠", label: (n, b, g) => "Réussis " + g + " quiz parfaits ce mois-ci" },
    { id: "c-packs", icon: "📦", label: (n, b, g) => "Ouvre " + g + " packs ce mois-ci" },
    { id: "c-trade", icon: "🔁", label: (n, b, g) => "Réalise " + g + " échange" + (g > 1 ? "s" : "") + " de cartes ce mois-ci" }
  ];
  /** objectifs chiffrés selon la rareté de la carte à gagner */
  const CARD_GOALS = { rare: { brand: 5, quiz: 2, packs: 8, trade: 0, album: 0 }, epic: { brand: 7, quiz: 4, packs: 14, trade: 1, album: 0 }, legendary: { brand: 9, quiz: 6, packs: 20, trade: 2, album: 1 }, shiny: { brand: 10, quiz: 8, packs: 25, trade: 3, album: 2 } };
  /** les affiches du mois : 1 shiny, 1 légendaire, 1 épique, 2 rares tirées au sort (mêmes pour tous) */
  function cardChalCars(month, ids, rar) {
    const rnd = mulberry(hashStr("motorauto-cc-" + month)), out = [];
    [["shiny", 1], ["legendary", 1], ["epic", 1], ["rare", 2]].forEach(/** @param {any[]} b */ (b) => {
      const pool = ids.filter((id) => rar.get(id) === b[0] && out.indexOf(id) < 0).sort();
      for (let k = 0; k < b[1] && pool.length; k++) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    });
    return out;
  }
  const PERFECT_WEEK_BONUS = 1;
  const THEMES = ["Ma voiture au lever du soleil", "Détail mécanique", "Mon garage", "Route de rêve", "Voiture en mouvement", "Noir & blanc", "Mon plus beau reflet", "Sortie entre pilotes", "Voiture sous la pluie", "Intérieur et cockpit", "Avant / après", "Ma voiture de collection"];

  /** année de début d'une voiture (champ « year » du serveur, ou « 1984 - 1994 » côté site) */
  const yearOf = (c) => { if (c && Number(c.year) > 1800) return Number(c.year); const m = String((c && c.years) || "").match(/\d{4}/); return m ? Number(m[0]) : 0; };
  const decadeOf = (c) => { const y = yearOf(c); return !y ? 0 : y < 1950 ? 1940 : Math.floor(y / 10) * 10; };
  const decadeLabel = (d) => d === 1940 ? "Avant 1950" : "Années " + d;
  /** albums : un par pays, par décennie (avec une carte « Légende » à la clé), par marque et par carrosserie ; récompense en cristaux selon la taille */
  function setReward(n) { return Math.min(600, 20 + n * 10); }
  /** collections thématiques : [identifiant, nom, marque (regex) ou "", modèle (regex), bonus de cristaux]. Au moins 3 voitures du catalogue sont nécessaires. */
  const THEMED_SETS = [
    ["peugeot-sport", "Peugeot Sport", /^peugeot/i, /sport|gti|rcz|905|908|t16|wrc|s16|rally|\bpse\b|9x8|\brc\b|1007 rally/i, 80],
    ["renault-sport", "Renault Sport", /^renault/i, /sport|\brs\b|r\.?s\.?\b|r5 turbo|v6|williams|trophy|maxi|f1|alpine/i, 80],
    ["alpine", "Alpine, la bleue", /^alpine/i, null, 60],
    ["lancia-rallye", "Lancia rallye", /^lancia/i, /delta|stratos|037|s4|integrale|rally|fulvia/i, 80],
    ["citroen-rallye", "Citroën rallye", /^citro/i, /wrc|rally|xsara|saxo|c4|c3|ds3|bx 4tc|visa|zx|dakar|c5 air/i, 70],
    ["subaru-wrx", "Subaru WRX et STI", /^subaru/i, /impreza|wrx|sti|brz|22b|legacy/i, 70],
    ["evo", "Mitsubishi Lancer Evo", /^mitsubishi/i, /evo|lancer/i, 70],
    ["gtr", "Nissan GT-R", /^nissan/i, /gt-?r|skyline|r3\d|r-?3\d/i, 80],
    ["type-r", "Honda Type R et NSX", /^honda/i, /type.?r|nsx|s2000|integra/i, 70],
    ["toyota-gr", "Toyota sportives", /^toyota/i, /supra|celica|gr\b|gazoo|ae86|gt-?four|mr2|trueno|levin|2000gt|yaris gr|gt86/i, 70],
    ["porsche-911", "Porsche 911", /^porsche/i, /911|carrera|gt3|gt2|turbo s/i, 120],
    ["ferrari-v12", "Ferrari V12", /^ferrari/i, /f12|812|599|550|575|612|365|400|456|enzo|laferrari|daytona|testarossa|512|superfast|purosangue|gtc4|lusso|340|250|275|f50/i, 120],
    ["bmw-m", "BMW M", /^bmw/i, /\bm[1-8]\b|\bm\d{3}|\bm[1-8] |csl|z4 m|1m\b|m coupé|m coupe|m roadster|\bx[3-6] m|\bm.?power/i, 100],
    ["amg", "Mercedes-AMG", /^mercedes/i, /amg|sls|gt r|black series|c63|e63|cls 63|g63|one\b|\bsl 63/i, 100],
    ["audi-sport", "Audi Sport et quattro", /^audi/i, /\brs|quattro|r8|r18|r10|tt rs|sport|s[1-8]\b/i, 100],
    ["mustang", "Ford Mustang", /^ford|^shelby/i, /mustang|cobra|gt500|gt350|boss/i, 100],
    ["muscle-us", "Muscle cars américaines", /^(chevrolet|dodge|pontiac|plymouth|chrysler|buick)/i, /camaro|charger|challenger|corvette|firebird|trans.?am|barracuda|gto|road runner|viper|hellcat|demon|chevelle|nova|cuda|super bee/i, 100],
    ["hypercars", "Hypercars", /^(bugatti|koenigsegg|pagani|rimac|hennessey|ssc)/i, null, 150],
    ["mini", "Mini", /^mini\b|^austin/i, /mini|cooper|john cooper/i, 60],
    ["jaguar", "Jaguar, félin de légende", /^jaguar/i, null, 70],
    ["mclaren", "McLaren", /^mclaren/i, null, 80],
    ["lotus", "Lotus", /^lotus/i, null, 70],
    ["groupe-b", "Les monstres du groupe B", null, /group(e)? b\b|delta s4|\b037\b|205 t16|405 t16|quattro s1|metro 6r4|rs200|ascona 400|manta 400|bx 4tc|5 maxi turbo|rx-?7 gpb/i, 150],
    ["aston-martin", "Aston Martin, de Bond au Mans", /^aston/i, null, 100],
    ["lamborghini", "Lamborghini, les taureaux", /^lamborghini/i, null, 100],
    ["ferrari-v8", "Ferrari V8 et Dino", /^ferrari/i, /308|328|348|355|360|430|458|488|f8|296|dino|mondial|f40|288|gtb\b|speciale|pista|challenge|tributo/i, 100],
    ["maserati", "Maserati, le trident", /^maserati/i, null, 80],
    ["viper", "Dodge Viper, le serpent", /^dodge/i, /viper/i, 60],
    // albums « catégorie » : les familles trop grandes (Le Mans, rallye) sont découpées en collections atteignables
    ["lemans-classic", "Le Mans : l'âge d'or (avant 1980)", null, null, 100, (c) => c.category === "Le Mans" && yearOf(c) > 0 && yearOf(c) < 1980],
    ["lemans-modern", "Le Mans : l'ère moderne (1980 et après)", null, null, 100, (c) => c.category === "Le Mans" && yearOf(c) >= 1980],
    ["rallye-monde", "Rallye : les reines des spéciales", null, null, 120, (c) => String(c.id).indexOf("rally-") === 0],
    ["genre-suv", "SUV et crossovers", null, null, 120, (c) => genresOf(c).indexOf("suv") >= 0],
    ["genre-ev", "Électriques : la nouvelle ère", null, null, 100, (c) => genresOf(c).indexOf("ev") >= 0],
    ["genre-cabrio", "Cabriolets et roadsters", null, null, 140, (c) => genresOf(c).indexOf("cabrio") >= 0],
    ["genre-pickup", "Pick-up et tout-terrain de travail", null, null, 80, (c) => genresOf(c).indexOf("pickup") >= 0]
  ];
  const themedOf = (list, t) => (list || []).filter((c) => { const b = String(c.brand || ""); if (t[2] && !t[2].test(b)) return false; if (t[5] && !t[5](c)) return false; return !t[3] || t[3].test(b + " " + String(c.model || c.name || "")); }).map((c) => c.id);
  function setsOf(list) {
    const out = [], skip = new Set(LEGEND_IDS);
    const add = (id, name, kind, ids, legend) => {
      ids = ids.filter((x) => !skip.has(x));
      if (ids.length >= (kind === "category" ? 3 : kind === "brand" ? 3 : 2)) out.push({ id, name: kind === "category" ? "Famille " + name : name, kind, ids, reward: Math.min(700, setReward(ids.length) + (legend ? 100 : 0)), legend: legend || "" });
    };
    const group = (keyFn, prefix, kind, min, max, nameFn) => {
      const m = new Map();
      (list || []).forEach((c) => { const v = keyFn(c); if (!v && v !== 0) return; if (!m.has(v)) m.set(v, []); m.get(v).push(c.id); });
      m.forEach((ids, v) => { if (ids.length >= min && ids.length <= max) add(prefix + ":" + v, nameFn ? nameFn(v) : v, kind, ids, LEGENDS[prefix + ":" + v]); });
    };
    group((c) => countryOf(c.brand), "country", "country", 2, 800, (v) => (COUNTRIES.find((k) => k.id === v) || {}).label || v);
    group((c) => decadeOf(c) || "", "decade", "decade", 2, 800, (v) => decadeLabel(Number(v)));
    group((c) => String(c.brand || "").trim(), "brand", "brand", 3, 30);
    group((c) => String(c.category || "").trim(), "cat", "category", 3, 80);
    THEMED_SETS.forEach((t) => { const ids = themedOf(list, t); if (ids.length >= 3 && ids.length <= 120) { const before = out.length; add("theme:" + t[0], t[1], "theme", ids, LEGENDS["theme:" + t[0]]); if (out.length > before) { if (out[out.length - 1].ids.length < 3) out.pop(); else out[out.length - 1].reward = Math.min(700, out[out.length - 1].reward + t[4]); } } });
    const rank = { country: 0, decade: 1, brand: 2, category: 3, theme: 4 };
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
      { id: "m-trade", type: "trade", goal: 1, label: "Réalise un échange de cartes", reward: 40 },
      { id: "m-prestige", type: "prestige", goal: 1, label: "Ouvre un Pack Prestige ou thématique", reward: 50 }
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
      const cand = ok.filter((c) => { if (c.id === a.id || (c.base || c.id) === (a.base || a.id)) return false; const vb = S.get(c); if (vb === va) return false; const g = gap(va, vb); return g >= lim[0] && g <= lim[1] && (!sameCat || (c.category && c.category === a.category)); });
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
  const QCATS = { brands: "Marques", history: "Histoire", engines: "Moteurs", motorsport: "Sport auto", countries: "Pays et constructeurs", circuits: "Circuits et courses", numbers: "Chiffres", trivia: "Anecdotes et records", japan: "Japon", rally: "Rallye", ev: "Électrique et hybride",
    f1: "Formule 1", lemans: "24 Heures du Mans", sigles: "Sigles et noms", pop: "Culture pop", tech: "Mécanique", france: "Voitures françaises", italie: "Italie", allemagne: "Allemagne", usa: "États-Unis", young: "Youngtimers", pilotes: "Pilotes légendaires", design: "Design et carrosserie",
    vf: "Vrai ou faux", intrus: "L'intrus" };
  /** sections spéciales du quiz : elles ont leur propre onglet et ne sont pas tirées dans le chrono ni la survie */
  const QSPECIAL = { vf: 1, intrus: 1 };
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
    podium:   { name: "Podium du mois", src: "top", v: 3, color: "#ffd700" },
    aurora:   { name: "Aurore",       src: "level", v: 20, color: "#5eead4", anim: true },
    prism:    { name: "Prisme",       src: "level", v: 30, color: "#c084fc", anim: true },
    s_eclipse:{ name: "Éclipse (rare)", src: "quest", v: 4, color: "#fb7185", anim: true, rare: true },
    b_arena:  { name: "Arène",        src: "bwin", v: 10,  color: "#38bdf8" },
    b_victor: { name: "Vainqueur",    src: "bwin", v: 50,  color: "#f97316" },
    b_champ:  { name: "Champion d'arène", src: "bwin", v: 200, color: "#facc15", anim: true }
  };
  const TITLES = {
    rookie:   { name: "Novice des circuits", src: "level", v: 2 },
    pilot:    { name: "Pilote confirmé",     src: "level", v: 5 },
    ace:      { name: "As du volant",        src: "level", v: 8 },
    legend:   { name: "Légende vivante",     src: "level", v: 12 },
    titan:    { name: "Titan de la route",   src: "level", v: 16 },
    ultimate: { name: "Ultime",              src: "level", v: 20 },
    panthe:   { name: "Panthéon",            src: "level", v: 30 },
    curator:  { name: "Conservateur",        src: "badge", v: "card100" },
    quizzer:  { name: "Maître du quiz",      src: "badge", v: "quizP10" },
    t10:      { name: "Habitué de la saison", src: "tier", v: 10 },
    t20:      { name: "Vétéran de la saison", src: "tier", v: 20 },
    t30:      { name: "Champion du pass",     src: "tier", v: 30 },
    quest:    { name: "Briseur de quêtes",    src: "quest", v: 4 },
    top1:     { name: "Numéro 1 du mois",     src: "top", v: 1 },
    top3:     { name: "Sur le podium",        src: "top", v: 3 },
    clubwin:  { name: "Champion de club",     src: "clash", v: 1 },
    b_rookie: { name: "Gladiateur",           src: "bwin", v: 10 },
    b_master: { name: "Maître de l'arène",    src: "bwin", v: 50 },
    b_flaw:   { name: "Sans faute (5-0)",     src: "bflaw", v: 1 },
    b_streak: { name: "Invaincu (10 d'affilée)", src: "bbest", v: 10 },
    b_giant:  { name: "Tueur de géants",      src: "bgiant", v: 1 }
  };
  /** fonds d'arène des batailles contre l'IA (décoratifs) : débloqués par le nombre de victoires */
  const ARENAS = {
    classic: { name: "Piste classique", v: 0,   bg: "radial-gradient(ellipse at 50% 20%, rgba(40,44,70,.9), rgba(4,5,12,.96))" },
    sunset:  { name: "Coucher de soleil", v: 5,  bg: "linear-gradient(180deg, rgba(255,120,60,.30), rgba(60,20,90,.55) 55%, rgba(6,4,14,.96))" },
    neon:    { name: "Tokyo néon", v: 15,   bg: "linear-gradient(160deg, rgba(0,230,255,.22), rgba(190,40,255,.28) 55%, rgba(4,3,12,.96))" },
    alpine:  { name: "Col alpin", v: 30,   bg: "linear-gradient(180deg, rgba(150,200,255,.28), rgba(30,60,100,.45) 60%, rgba(5,8,16,.96))" },
    lemans:  { name: "Nuit du Mans", v: 60,  bg: "linear-gradient(180deg, rgba(255,205,70,.20), rgba(15,25,60,.5) 50%, rgba(2,3,8,.97))" },
    gold:    { name: "Arène d'or", v: 120, bg: "radial-gradient(ellipse at 50% 0%, rgba(255,215,90,.42), rgba(70,45,10,.55) 55%, rgba(8,5,2,.97))" }
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
  /** version à afficher pour une récompense : la prochaine à gagner, ou (got) la dernière obtenue ; sans inventaire, la version de base */
  function shownVariant(cosm, kind, base, got) {
    if (!cosm) return base;
    if (!got) return nextVariant(cosm, kind, base);
    let id = base; for (let k = 1; k <= TIER_MAX; k++) if (cosm.indexOf(kind + ":" + variantId(base, k)) >= 0) id = variantId(base, k);
    return id;
  }
  const passLabel = (r, cosm, got) => [r.dust ? r.dust + " cristaux" : "", r.bonus ? (r.bonus > 1 ? r.bonus + " packs bonus" : "1 pack bonus") : "", r.freeze ? "1 gel de série" : "", r.epic ? "1 carte Épique" : "", r.circuit ? "1 carte Circuit" : "", r.choice ? "1 Légendaire au choix" : "", r.frame ? "cadre " + FRAMES[shownVariant(cosm, "f", r.frame, got)].name : "", r.title ? "titre « " + TITLES[shownVariant(cosm, "t", r.title, got)].name + " »" : ""].filter(Boolean).join(" + ");
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
  // ------------------------------------------------------------------ évolution de saison : « II », « III », « IV »…
  // Les cadres, titres et quêtes de saison évoluent : une fois la version précédente débloquée, la saison suivante donne la suivante.
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"], TIER_MAX = 10;
  const romanOf = (k) => ROMAN[Math.max(1, Math.min(TIER_MAX, k | 0))];
  /** identifiant de la version k d'un cosmétique de saison (k = 1 : l'identifiant de base) */
  const variantId = (base, k) => (k <= 1 ? base : base + "_" + k);
  [[FRAMES, "src"], [TITLES, "src"]].forEach(([tbl]) => Object.keys(tbl).slice().forEach((id) => {
    const def = tbl[id]; if (def.src !== "tier" && def.src !== "quest") return;
    for (let k = 2; k <= TIER_MAX; k++) tbl[variantId(id, k)] = Object.assign({}, def, { name: def.name.replace(/( \(rare\))?$/, " " + romanOf(k) + "$1"), base: id, rank: k });
  }));
  /** version à accorder maintenant : la première que le joueur n'a pas encore (la dernière s'il les a toutes) */
  function nextVariant(cosm, kind, base) {
    const have = cosm || [];
    for (let k = 1; k <= TIER_MAX; k++) if (have.indexOf(kind + ":" + variantId(base, k)) < 0) return variantId(base, k);
    return variantId(base, TIER_MAX);
  }
  /** accorde (sans doublon) la version suivante ; retourne son identifiant, ou "" si le joueur a déjà tout */
  function grantVariant(cosm, kind, base) {
    const id = nextVariant(cosm, kind, base);
    if (cosm.indexOf(kind + ":" + id) >= 0) return "";
    cosm.push(kind + ":" + id); return id;
  }
  /** rang de saison du joueur : 1 + nombre de versions du cadre « Quête de saison » déjà obtenues (plafonné) */
  const seasonRank = (cosm) => { let n = 0; for (let k = 1; k <= TIER_MAX; k++) if ((cosm || []).indexOf("f:" + variantId("quest", k)) >= 0) n++; return Math.min(TIER_MAX, n + 1); };
  const SEASON_QUESTS = [
    { id: "q1", label: "Ouvrir 10 packs", act: "packs", goal: 10, dust: 60 },
    { id: "q2", label: "Réussir 8 quiz", act: "quiz", goal: 8, dust: 80 },
    { id: "q3", label: "Réussir 25 bonnes réponses au Plus ou moins", act: "pm", goal: 25, dust: 100 },
    { id: "q4", label: "Te connecter 14 jours", act: "days", goal: 14, dust: 120 }
  ];
  const SEASON_QUEST_FINAL = { dust: 300, frame: "quest", title: "quest" };
  /** quêtes de la saison à un rang donné : objectifs et récompenses montent de 25 % par rang */
  const questList = (rk) => { const r = Math.max(1, Math.min(TIER_MAX, rk | 0 || 1)), m = 1 + (r - 1) * 0.25; return SEASON_QUESTS.map((q) => Object.assign({}, q, { goal: Math.round(q.goal * m), dust: Math.round(q.dust * m / 5) * 5, label: r > 1 ? q.label + " (" + romanOf(r) + ")" : q.label })); };
  const blankSeason = (n, rk) => ({ n, rk: Math.max(1, rk | 0 || 1), pts: 0, claimed: [], act: { packs: 0, quiz: 0, pm: 0, days: 0 }, q: 0, qDone: false, dayLog: "", dp: { d: "", p: 0 } });
  /** met à jour (et remet à zéro si nouvelle saison) l'état de saison du joueur ; retourne l'état */
  function seasonOf(d, ms) {
    const cur = seasonInfo(ms).n;
    if (!d.season || d.season.n !== cur) d.season = blankSeason(cur, seasonRank(d.cosm));
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
    const list = questList(s.rk), q = list[s.q];
    if (!q) return { done: true, step: list.length };
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

  const QUIZ_N = 10, QUIZ_REWARD = 3, QUIZ_DAILY_CAP = Infinity;   // 3 cristaux par bonne réponse, sans plafond : rejouer rapporte toujours
  // banque de questions écrites : js/quiz-bank.js (chargée à la demande dans le navigateur, par require côté serveur)
  const QBANK = [], QMULTI = [], root = typeof self !== "undefined" ? self : globalThis;
  let bankLoaded = false, bankP = null;
  function fillBank(factory) { if (bankLoaded) return true; factory(QBANK, QMULTI); bankLoaded = true; return true; }
  if (typeof module === "object" && module.exports) { try { fillBank(require("./quiz-bank")); } catch (_) { /* banque absente : questions générées seulement */ } }
  else if (typeof root.MAQuizBankFactory === "function") fillBank(root.MAQuizBankFactory);
  /** navigateur : charge la banque (une seule fois) puis la remplit ; résout true si elle est prête */
  function ensureBank() {
    if (bankLoaded) return Promise.resolve(true);
    if (bankP) return bankP;
    bankP = new Promise((res) => {
      const done = () => { try { if (typeof root.MAQuizBankFactory === "function") { res(fillBank(root.MAQuizBankFactory)); return; } } catch (_) { /* ignoré */ } bankP = null; res(false); };
      if (typeof root.MAQuizBankFactory === "function") { done(); return; }
      if (typeof document === "undefined") { res(false); return; }
      const s = document.createElement("script"); s.src = (root.MA_LAZY && root.MA_LAZY.quizbank) || "js/quiz-bank.js"; s.async = true; s.onload = done; s.onerror = () => { bankP = null; res(false); };
      document.head.appendChild(s);
    });
    return bankP;
  }


  // ---------------------------------------------------------------- banque de faits : tables vérifiées → des milliers de questions générées
  /** « 1954-1957:Nom ; 1958:Nom » → [[année, nom], …] */
  const runs = (s) => s.trim().split(/\s*;\s*/).reduce((o, p) => { const m = /^(\d{4})(?:-(\d{4}))?:(.+)$/.exec(p.trim()); if (m) for (let y = +m[1]; y <= +(m[2] || m[1]); y++) o.push([y, m[3].trim()]); return o; }, []);
  const tab = (s) => s.trim().split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.split("|").map((x) => x.trim()));
  const QT = {
    f1: runs("1950:Nino Farina;1951:Juan Manuel Fangio;1952-1953:Alberto Ascari;1954-1957:Juan Manuel Fangio;1958:Mike Hawthorn;1959-1960:Jack Brabham;1961:Phil Hill;1962:Graham Hill;1963:Jim Clark;1964:John Surtees;1965:Jim Clark;1966:Jack Brabham;1967:Denny Hulme;1968:Graham Hill;1969:Jackie Stewart;1970:Jochen Rindt;1971:Jackie Stewart;1972:Emerson Fittipaldi;1973:Jackie Stewart;1974:Emerson Fittipaldi;1975:Niki Lauda;1976:James Hunt;1977:Niki Lauda;1978:Mario Andretti;1979:Jody Scheckter;1980:Alan Jones;1981:Nelson Piquet;1982:Keke Rosberg;1983:Nelson Piquet;1984:Niki Lauda;1985-1986:Alain Prost;1987:Nelson Piquet;1988:Ayrton Senna;1989:Alain Prost;1990-1991:Ayrton Senna;1992:Nigel Mansell;1993:Alain Prost;1994-1995:Michael Schumacher;1996:Damon Hill;1997:Jacques Villeneuve;1998-1999:Mika Häkkinen;2000-2004:Michael Schumacher;2005-2006:Fernando Alonso;2007:Kimi Räikkönen;2008:Lewis Hamilton;2009:Jenson Button;2010-2013:Sebastian Vettel;2014-2015:Lewis Hamilton;2016:Nico Rosberg;2017-2020:Lewis Hamilton;2021-2024:Max Verstappen"),
    wrc: runs("1979:Björn Waldegård;1980:Walter Röhrl;1981:Ari Vatanen;1982:Walter Röhrl;1983:Hannu Mikkola;1984:Stig Blomqvist;1985:Timo Salonen;1986-1987:Juha Kankkunen;1988-1989:Miki Biasion;1990:Carlos Sainz;1991:Juha Kankkunen;1992:Carlos Sainz;1993:Juha Kankkunen;1994:Didier Auriol;1995:Colin McRae;1996-1999:Tommi Mäkinen;2000:Marcus Grönholm;2001:Richard Burns;2002:Marcus Grönholm;2003:Petter Solberg;2004-2012:Sébastien Loeb;2013-2018:Sébastien Ogier;2019:Ott Tänak;2020-2021:Sébastien Ogier;2022-2023:Kalle Rovanperä;2024:Thierry Neuville"),
    lemans: runs("1949:Ferrari;1951:Jaguar;1953:Jaguar;1955-1957:Jaguar;1959:Aston Martin;1960-1965:Ferrari;1966-1969:Ford;1970-1971:Porsche;1972-1974:Matra;1976-1977:Porsche;1978:Renault-Alpine;1979:Porsche;1981-1987:Porsche;1988:Jaguar;1990:Jaguar;1991:Mazda;1992-1993:Peugeot;1995:McLaren;1996-1998:Porsche;1999:BMW;2000-2002:Audi;2003:Bentley;2004-2008:Audi;2009:Peugeot;2010-2014:Audi;2015-2017:Porsche;2018-2022:Toyota;2023-2025:Ferrari"),
    // marque | fondateur | année | ville | pays | emblème | niveau
    brands: tab(`
Ferrari|Enzo Ferrari|1947|Maranello|Italie|un cheval cabré noir sur fond jaune|1
Lamborghini|Ferruccio Lamborghini|1963|Sant'Agata Bolognese|Italie|un taureau|1
Porsche|Ferdinand Porsche|1931|Stuttgart|Allemagne|un cheval noir sur un blason aux armes de Stuttgart|1
Peugeot||| Sochaux|France|un lion|1
Renault|Louis Renault|1899|Boulogne-Billancourt|France|un losange|1
Citroën|André Citroën|1919|Paris|France|deux chevrons|1
Bugatti|Ettore Bugatti|1909|Molsheim|France|un macaron ovale rouge|2
Alpine|Jean Rédélé|1955|Dieppe|France||2
Mazda|Jujiro Matsuda|1920|Hiroshima|Japon||2
Honda|Soichiro Honda|1948|Hamamatsu|Japon|un « H » stylisé|1
Toyota|Kiichiro Toyoda|1937||Japon|trois ellipses entrelacées|1
Nissan|Yoshisuke Aikawa|1933|Yokohama|Japon||3
Subaru||1953||Japon|six étoiles (les Pléiades)|2
Mitsubishi|Yataro Iwasaki|1870||Japon|trois diamants rouges|2
Suzuki|Michio Suzuki|1909|Hamamatsu|Japon|un « S » stylisé|3
BMW||1916|Munich|Allemagne|un cercle bleu et blanc, comme une hélice|1
Mercedes-Benz|||Stuttgart|Allemagne|une étoile à trois branches|1
Audi|August Horch|1909|Ingolstadt|Allemagne|quatre anneaux entrelacés|1
Opel|Adam Opel|1862|Rüsselsheim|Allemagne|un éclair|2
Volkswagen||1937|Wolfsburg|Allemagne|un V au-dessus d'un W dans un cercle|1
Škoda|Václav Laurin et Václav Klement|1895|Mladá Boleslav|République tchèque|une flèche ailée|2
Fiat|Giovanni Agnelli|1899|Turin|Italie||2
Alfa Romeo||1910|Milan|Italie|un serpent (le biscione) et une croix rouge|1
Maserati|Alfieri Maserati|1914|Bologne|Italie|un trident|1
Lancia|Vincenzo Lancia|1906|Turin|Italie||2
Abarth|Carlo Abarth|1949|Turin|Italie|un scorpion|2
Ford|Henry Ford|1903|Dearborn|États-Unis|un ovale bleu|1
Chevrolet|Louis Chevrolet|1911|Détroit|États-Unis|un nœud papillon doré|2
Cadillac|Henry Leland|1902|Détroit|États-Unis||3
Tesla|Martin Eberhard et Marc Tarpenning|2003||États-Unis||2
Aston Martin|Lionel Martin et Robert Bamford|1913|Gaydon|Royaume-Uni|des ailes|1
Bentley|W. O. Bentley|1919|Crewe|Royaume-Uni|un « B » ailé|2
Rolls-Royce|Charles Rolls et Henry Royce|1906|Goodwood|Royaume-Uni|la Spirit of Ecstasy|2
Jaguar|William Lyons|1922|Coventry|Royaume-Uni|un félin bondissant|1
McLaren|Bruce McLaren|1963|Woking|Royaume-Uni||2
Lotus|Colin Chapman|1952|Hethel|Royaume-Uni||2
Morgan|H. F. S. Morgan|1909|Malvern|Royaume-Uni||3
Volvo|Assar Gabrielsson et Gustaf Larson|1927|Göteborg|Suède|une flèche en diagonale dans un cercle|2
Saab||1937|Trollhättan|Suède|un griffon|2
Koenigsegg|Christian von Koenigsegg|1994|Ängelholm|Suède||2
Pagani|Horacio Pagani|1992|San Cesario sul Panaro|Italie||3
Hyundai|Chung Ju-yung|1967|Séoul|Corée du Sud||2
Kia||1944|Séoul|Corée du Sud||3
SEAT||1950|Martorell|Espagne||2
Dacia||1966|Mioveni|Roumanie||2
`),
    // marque | modèle | année de lancement | niveau | drapeaux (j = Japon, e = électrique / hybride)
    models: tab(`
Ford|Model T|1908|1
Citroën|2CV|1948|1
Citroën|DS|1955|1
Citroën|Traction Avant|1934|2
Citroën|SM|1970|3
Citroën|Xsara|1997|3
Peugeot|205|1983|1
Peugeot|205 GTI|1984|2
Peugeot|404|1960|2
Peugeot|504|1968|2
Peugeot|106|1991|2
Peugeot|306|1993|2
Renault|4L|1961|1
Renault|5|1972|1
Renault|5 Turbo|1980|3
Renault|Espace|1984|2
Renault|Clio|1990|1
Renault|Twingo|1992|1
Alpine|A110 d'origine|1961|2
Volkswagen|Combi (Type 2)|1950|2
Volkswagen|Passat|1973|2
Volkswagen|Golf|1974|1
Volkswagen|Polo|1975|2
Volkswagen|Golf GTI|1976|1
BMW|2002|1966|3
BMW|M1|1978|3
BMW|M3 (E30)|1986|2
Mercedes-Benz|300 SL « Papillon »|1954|2
Mercedes-Benz|190 E 2.3-16|1983|3
Audi|Quattro|1980|1
Audi|TT|1998|2
Audi|R8|2006|2
Porsche|356|1948|2
Porsche|911|1963|1
Porsche|928|1977|3
Porsche|944|1982|3
Porsche|959|1986|3
Porsche|Boxster|1996|2
Porsche|Cayenne|2002|2
Porsche|Carrera GT|2003|3
Porsche|918 Spyder|2013|3
Porsche|Taycan|2019|2|e
Ferrari|250 GTO|1962|2
Ferrari|308 GTB|1975|3
Ferrari|Testarossa|1984|1
Ferrari|288 GTO|1984|3
Ferrari|F40|1987|1
Ferrari|F50|1995|2
Ferrari|Enzo|2002|1
Ferrari|458 Italia|2009|2
Ferrari|LaFerrari|2013|2
Lamborghini|Miura|1966|1
Lamborghini|Countach|1974|1
Lamborghini|Diablo|1990|2
Lamborghini|Murciélago|2001|2
Lamborghini|Gallardo|2003|2
Lamborghini|Aventador|2011|2
Lamborghini|Huracán|2014|2
Lamborghini|Urus|2017|2
Fiat|500 (Nuova)|1957|1
Fiat|Panda|1980|2
Fiat|Uno|1983|2
Lancia|Stratos|1973|2
Lancia|Delta Integrale|1987|2
Alfa Romeo|Spider « Duetto »|1966|2
Alfa Romeo|33 Stradale|1967|3
Alfa Romeo|156|1997|3
Alfa Romeo|8C Competizione|2007|3
Pagani|Zonda|1999|3
Pagani|Huayra|2011|3
Bugatti|Type 57 Atlantic|1936|3
Bugatti|Veyron|2005|1
Bugatti|Chiron|2016|2
McLaren|F1|1992|1
McLaren|P1|2013|2
Jaguar|E-Type|1961|1
Aston Martin|DB5|1963|1
Aston Martin|Vanquish|2001|3
Lotus|Seven|1957|2
Lotus|Elan|1962|3
Lotus|Esprit|1976|3
Lotus|Elise|1996|2
Mini|Mini d'origine|1959|1
Land Rover|Series I|1948|3
Land Rover|Range Rover|1970|2
Ford|Mustang|1964|1
Ford|GT40|1964|2
Ford|Fiesta|1976|2
Ford|Sierra Cosworth|1986|3
Ford|Escort Cosworth|1992|3
Ford|Focus|1998|2
Chevrolet|Corvette|1953|1
Chevrolet|Camaro|1966|2
Dodge|Charger|1966|3
Dodge|Viper|1992|3
Pontiac|GTO|1964|3
Tesla|Roadster|2008|2|e
Tesla|Model S|2012|1|e
Tesla|Model X|2015|3|e
Tesla|Model 3|2017|1|e
Nissan|Leaf|2010|1|e
Renault|Zoe|2012|2|e
BMW|i3|2013|2|e
Toyota|Prius|1997|1|e
Honda|Insight|1999|3|e
Hyundai|Ioniq 5|2021|2|e
Rimac|Nevera|2021|2|e
Citroën|Ami|2020|3|e
Toyota|Corolla|1966|2|j
Toyota|2000GT|1967|2|j
Toyota|AE86 (Sprinter Trueno)|1983|2|j
Toyota|MR2|1984|2|j
Toyota|Celica GT-Four (ST165)|1986|3|j
Toyota|Supra (A80)|1993|1|j
Toyota|GR Yaris|2020|2|j
Nissan|Fairlady Z (S30)|1969|2|j
Nissan|Micra|1982|2|j
Nissan|GT-R (R32)|1989|1|j
Nissan|Skyline GT-R (R34)|1999|2|j
Nissan|Silvia (S15)|1999|3|j
Nissan|350Z|2002|2|j
Nissan|GT-R (R35)|2007|1|j
Mazda|Cosmo Sport|1967|3|j
Mazda|RX-7 (première génération)|1978|2|j
Mazda|MX-5 (NA)|1989|1|j
Mazda|RX-7 (FD)|1992|2|j
Mazda|RX-8|2003|2|j
Honda|Civic|1972|2|j
Honda|CR-X|1983|3|j
Honda|NSX|1990|1|j
Honda|Integra Type R (DC2)|1995|3|j
Honda|Civic Type R (EK9)|1997|3|j
Honda|S2000|1999|2|j
Subaru|360|1958|3|j
Subaru|Impreza WRX|1992|2|j
Subaru|BRZ|2012|3|j
Mitsubishi|3000GT|1990|3|j
Mitsubishi|Lancer Evolution I|1992|2|j
Mitsubishi|Pajero|1982|3|j
Suzuki|Jimny|1970|2|j
Lexus|LS 400|1989|3|j
Lexus|LFA|2010|2|j
`),
    // code moteur | voiture | niveau
    engines: tab(`
2JZ-GTE|Toyota Supra (A80)|1
RB26DETT|Nissan Skyline GT-R (R32 à R34)|1
SR20DET|Nissan Silvia (S13 à S15)|2
4A-GE|Toyota AE86 (Sprinter Trueno)|2
3S-GTE|Toyota Celica GT-Four|3
13B-REW|Mazda RX-7 (FD)|2
R26B|Mazda 787B (Le Mans 1991)|3
F20C|Honda S2000|2
C30A|Honda NSX|3
B16B|Honda Civic Type R (EK9)|3
4G63|Mitsubishi Lancer Evolution|2
VR38DETT|Nissan GT-R (R35)|2
VQ35DE|Nissan 350Z|3
1LR-GUE|Lexus LFA|4
6G72|Mitsubishi 3000GT|4
XU9JA|Peugeot 205 GTI 1.9|3
Cléon-Fonte|Renault 5 et Renault 4L|3
YB Cosworth|Ford Sierra RS Cosworth|3
S14|BMW M3 (E30)|3
S54|BMW M3 (E46)|3
S65|BMW M3 (E92)|3
M88|BMW M1|4
M156|Mercedes-AMG C 63 (W204)|3
M159|Mercedes-Benz SLS AMG|4
F136|Ferrari 458 Italia|4
F140|Ferrari Enzo|4
EA888|Volkswagen Golf GTI (2.0 TSI)|3
VR6|Volkswagen Golf VR6|3
DFV|Lotus 49 (F1, 1967)|3
LS3|Chevrolet Corvette (C6)|4
Hemi 426|Dodge Charger R/T (1968)|3
`),
    // pilote(s) | surnom / fait
    glossary: tab(`
ABS|Système qui empêche le blocage des roues au freinage|1|engines
ESP|Correcteur électronique de trajectoire|1|engines
Turbo|Compresseur entraîné par les gaz d'échappement|1|engines
Compresseur volumétrique|Compresseur entraîné mécaniquement par le moteur|2|engines
Intercooler|Radiateur qui refroidit l'air comprimé avant l'admission|2|engines
Common rail|Rampe d'injection commune à haute pression, sur les diesels modernes|3|engines
Injection directe|Carburant injecté directement dans la chambre de combustion|2|engines
Cylindrée|Volume total balayé par les pistons|1|engines
Couple|Force de rotation du moteur, exprimée en newton-mètres|1|engines
Moteur boxer|Moteur dont les cylindres sont à plat, opposés deux à deux|2|engines
Moteur rotatif (Wankel)|Moteur à rotor triangulaire qui tourne dans une chambre|2|engines
VTEC|Distribution variable de Honda à deux profils de came|2|engines
DOHC|Double arbre à cames en tête|3|engines
Culasse|Pièce qui ferme le haut des cylindres|2|engines
Vilebrequin|Arbre qui transforme le mouvement des pistons en rotation|2|engines
Bielle|Pièce qui relie le piston au vilebrequin|3|engines
Soupape|Pièce qui ouvre et ferme l'admission et l'échappement|2|engines
Arbre à cames|Arbre qui commande l'ouverture des soupapes|2|engines
Carburateur|Organe qui mélange l'air et l'essence avant l'admission|2|engines
Catalyseur|Organe qui réduit les polluants des gaz d'échappement|1|engines
FAP|Filtre à particules des diesels|2|engines
AdBlue|Solution d'urée qui réduit les oxydes d'azote des diesels|3|engines
Différentiel autobloquant|Dispositif qui limite le patinage d'une roue en répartissant le couple|3|engines
Embrayage|Organe qui sépare le moteur de la boîte de vitesses|1|engines
Boîte DSG|Boîte à double embrayage|2|engines
Traction|Transmission aux roues avant|1|engines
Propulsion|Transmission aux roues arrière|1|engines
Transmission intégrale|Les quatre roues sont motrices|1|engines
Moteur central arrière|Moteur placé derrière les sièges, devant l'essieu arrière|2|engines
Empattement|Distance entre l'essieu avant et l'essieu arrière|2|engines
Voie|Distance entre les deux roues d'un même essieu|3|engines
Carrossage|Inclinaison de la roue vue de face|3|engines
Parallélisme|Réglage de l'alignement des roues|3|engines
Sous-virage|Tendance de l'avant à glisser et à aller tout droit en virage|3|engines
Survirage|Tendance de l'arrière à décrocher en virage|3|engines
Appui aérodynamique|Force qui plaque la voiture au sol à haute vitesse|2|motorsport
Aileron|Appendice aérodynamique qui crée de l'appui|1|motorsport
Diffuseur|Partie arrière du dessous de caisse qui accélère l'air et crée de l'appui|3|motorsport
Effet de sol|Dépression sous la voiture qui la plaque sur la piste|3|motorsport
DRS|Aileron arrière mobile qui facilite les dépassements en F1|2|motorsport
Pole position|Première place sur la grille de départ|1|motorsport
Safety car|Voiture de sécurité qui neutralise la course|1|motorsport
Pit stop|Arrêt au stand pour changer les pneus ou réparer|1|motorsport
Drapeau jaune|Danger sur la piste : dépassement interdit|2|motorsport
Drapeau bleu|Ordre de laisser passer un concurrent plus rapide|2|motorsport
Drapeau rouge|Course interrompue|2|motorsport
Drapeau à damier|Signal d'arrivée de la course|1|motorsport
Drapeau noir|Disqualification du pilote|2|motorsport
Parc fermé|Régime où les voitures ne peuvent plus être modifiées|3|motorsport
Pneu slick|Pneu lisse, sans sculptures, pour piste sèche|2|motorsport
Undercut|Stratégie : s'arrêter plus tôt que son rival pour le devancer|4|motorsport
Spéciale|Portion chronométrée d'un rallye, fermée à la circulation|2|rally
Notes (pacenotes)|Descriptif de la route que lit le copilote|2|rally
Parc d'assistance|Zone où les mécaniciens réparent la voiture entre les spéciales|2|rally
Groupe B|Catégorie de rallye de 1982 à 1986, aux voitures très puissantes|2|rally
Power Stage|Dernière spéciale d'un rallye WRC, qui rapporte des points bonus|3|rally
Rallye-raid|Course d'endurance en pleine nature, comme le Dakar|2|rally
Kilowattheure (kWh)|Unité d'énergie qui mesure la capacité d'une batterie|1|ev
Autonomie|Distance qu'une voiture électrique parcourt avec une charge|1|ev
Freinage régénératif|Freinage qui récupère de l'énergie pour recharger la batterie|2|ev
Hybride rechargeable|Hybride dont la batterie se recharge sur une prise|2|ev
Wallbox|Borne de recharge installée à domicile|2|ev
CCS|Prise de charge rapide en courant continu en Europe|3|ev
WLTP|Cycle d'homologation qui mesure consommation et autonomie|2|ev
Moteur synchrone|Moteur électrique dont le rotor tourne à la vitesse du champ tournant|4|ev
Couple instantané|Particularité des moteurs électriques : le couple est disponible dès l'arrêt|2|ev
`),
    // circuit | pays | ville | longueur (km) | niveau
    circuits: tab(`
Monza|Italie|Monza|5,8|1
Imola|Italie|Imola|4,9|2
Mugello|Italie|Scarperia|5,2|3
Spa-Francorchamps|Belgique|Stavelot|7,0|1
Silverstone|Royaume-Uni|Silverstone|5,9|1
Suzuka|Japon|Suzuka|5,8|1
Fuji|Japon|Oyama|4,6|3
Monaco|Monaco|Monte-Carlo|3,3|1
Interlagos|Brésil|São Paulo|4,3|2
Nürburgring (Nordschleife)|Allemagne|Nürburg|20,8|1
Hockenheim|Allemagne|Hockenheim|4,6|2
Circuit de la Sarthe (24 Heures du Mans)|France|Le Mans|13,6|1
Magny-Cours|France|Magny-Cours|4,4|2
Paul Ricard|France|Le Castellet|5,8|2
Barcelona-Catalunya|Espagne|Montmeló|4,7|2
Jerez|Espagne|Jerez de la Frontera|4,4|3
Estoril|Portugal|Estoril|4,2|3
Portimão|Portugal|Portimão|4,7|3
Zandvoort|Pays-Bas|Zandvoort|4,3|2
Red Bull Ring|Autriche|Spielberg|4,3|2
Hungaroring|Hongrie|Mogyoród|4,4|3
Albert Park|Australie|Melbourne|5,3|2
Marina Bay|Singapour|Singapour|4,9|2
Yas Marina|Émirats arabes unis|Abou Dabi|5,3|2
Sakhir|Bahreïn|Sakhir|5,4|2
Circuit Gilles-Villeneuve|Canada|Montréal|4,4|2
Circuit des Amériques (COTA)|États-Unis|Austin|5,5|2
Indianapolis Motor Speedway|États-Unis|Indianapolis|4,0|2
Daytona International Speedway|États-Unis|Daytona Beach|4,0|2
Laguna Seca|États-Unis|Monterey|3,6|3
Sebring|États-Unis|Sebring|6,0|3
Autódromo Hermanos Rodríguez|Mexique|Mexico|4,3|3
Circuit urbain de Bakou|Azerbaïdjan|Bakou|6,0|3
Circuit de Djeddah|Arabie saoudite|Djeddah|6,2|3
Shanghai|Chine|Shanghai|5,5|3
Sepang|Malaisie|Sepang|5,5|3
Kyalami|Afrique du Sud|Midrand|4,5|3
Mount Panorama|Australie|Bathurst|6,2|2
`),
    // virage | circuit | niveau
    corners: tab(`
Eau Rouge / Raidillon|Spa-Francorchamps|1
Pouhon|Spa-Francorchamps|3
Les Combes|Spa-Francorchamps|3
Blanchimont|Spa-Francorchamps|4
La Source|Spa-Francorchamps|3
Parabolica|Monza|2
Curva Grande|Monza|4
Lesmo|Monza|3
Variante Ascari|Monza|3
Tamburello|Imola|3
Tosa|Imola|3
Rivazza|Imola|4
Casino|Monaco|2
Sainte-Dévote|Monaco|3
Mirabeau|Monaco|4
Piscine|Monaco|3
130R|Suzuka|2
Spoon|Suzuka|3
Degner|Suzuka|4
Becketts|Silverstone|2
Copse|Silverstone|3
Maggotts|Silverstone|3
Stowe|Silverstone|3
Hunaudières (ligne droite des Hunaudières)|Circuit de la Sarthe (24 Heures du Mans)|1
Tertre Rouge|Circuit de la Sarthe (24 Heures du Mans)|3
Arnage|Circuit de la Sarthe (24 Heures du Mans)|2
Courbes Porsche|Circuit de la Sarthe (24 Heures du Mans)|3
Karussell|Nürburgring (Nordschleife)|2
Flugplatz|Nürburgring (Nordschleife)|3
Fuchsröhre|Nürburgring (Nordschleife)|4
Pflanzgarten|Nürburgring (Nordschleife)|4
Tire-bouchon (Corkscrew)|Laguna Seca|2
Senna S|Interlagos|3
Mur des Champions|Circuit Gilles-Villeneuve|3
`),
    // rallye | pays | niveau
    rallies: tab(`
Rallye Monte-Carlo|Monaco|1
Rallye de Finlande|Finlande|1
Rallye de Suède|Suède|2
Safari Rally|Kenya|2
Tour de Corse|France|2
Rallye d'Argentine|Argentine|3
Rallye d'Acropole|Grèce|3
Rallye Sanremo|Italie|3
Rallye de Nouvelle-Zélande|Nouvelle-Zélande|3
Rallye d'Australie|Australie|3
Rallye du Portugal|Portugal|3
Rallye de Sardaigne|Italie|3
Rallye du Japon|Japon|3
Rallye de Croatie|Croatie|3
Rallye d'Estonie|Estonie|3
Rallye du Chili|Chili|3
Rallye de Catalogne|Espagne|3
Rallye du Mexique|Mexique|3
RAC Rally|Royaume-Uni|3
Dakar (depuis 2020)|Arabie saoudite|2
`),
    // voiture de rallye | marque | niveau
    rallycars: tab(`
Stratos|Lancia|2
Delta Integrale|Lancia|1
037|Lancia|3
Quattro (Groupe B)|Audi|1
205 Turbo 16|Peugeot|1
RS200|Ford|3
Metro 6R4|MG|4
5 Turbo|Renault|2
A110 1600 S|Alpine|2
Celica GT-Four|Toyota|2
Impreza WRC|Subaru|1
Lancer Evolution WRC|Mitsubishi|1
Xsara WRC|Citroën|2
C4 WRC|Citroën|3
DS3 WRC|Citroën|2
Focus WRC|Ford|2
Fiesta WRC|Ford|2
Fabia R5|Škoda|3
i20 WRC|Hyundai|2
Polo R WRC|Volkswagen|2
Yaris WRC|Toyota|2
GR Yaris Rally1|Toyota|2
Ascona 400|Opel|3
131 Abarth|Fiat|3
206 WRC|Peugeot|2
Escort RS Cosworth|Ford|3
Fulvia HF|Lancia|4
240Z|Datsun|4
`),
    // surnom | voiture | niveau
    nicks: tab(`
Godzilla|Nissan GT-R|1
Hachi-Roku|Toyota AE86|2
Deuche|Citroën 2CV|1
Tin Lizzie|Ford Model T|3
Vette|Chevrolet Corvette|2
Stang|Ford Mustang|3
Papillon (gullwing)|Mercedes-Benz 300 SL|2
Pagode|Mercedes-Benz SL (W113)|3
Frogeye (œil de grenouille)|Austin-Healey Sprite|3
Cobra|Shelby Cobra|2
La Brique|Volvo 240|3
Le Taureau de Sant'Agata|Lamborghini|3
Le Cheval cabré|Ferrari|2
`)
  };
  // marques → pays (sert aux questions « pays » et aux modèles)
  const QT_BRAND_COUNTRY = { Mini: "Royaume-Uni", "Land Rover": "Royaume-Uni", Pontiac: "États-Unis", Dodge: "États-Unis", Lexus: "Japon", Rimac: "Croatie", Datsun: "Japon", MG: "Royaume-Uni", Toyota: "Japon", Alfa: "Italie" };

  /** générateurs de questions à partir des tables (déterministes : même graine = mêmes questions sur le site et sur le serveur) */
  function quizTables(x) {
    const { mk, pick, shuffle, T, fmt, level } = x;
    const near = (arr, lv) => { const a = arr.filter((r) => Math.abs(r[lv] - level) <= 1 && (level === 1 ? r[lv] <= 2 : level === 4 ? r[lv] >= 3 : true)); return a.length ? a : arr; };
    const pickN = (arr, lv) => pick(near(arr, lv));
    const others = (arr, get, good, n) => { const pool = Array.from(new Set(arr.map(get).filter((v) => v && v !== good))); return shuffle(pool).slice(0, n); };
    const four = (good, pool) => (pool.length >= 3 ? [good].concat(pool.slice(0, 3)) : null);
    const ctry = (b) => (QT.brands.find((r) => r[0] === b) || [])[4] || QT_BRAND_COUNTRY[b] || "";
    const yearOpts = (y) => { const st = [0, 12, 6, 3, 2][level], s = new Set([y]); for (const k of shuffle([-3, -2, -1, 1, 2, 3, 4, -4])) { if (s.size >= 4) break; const v = y + k * st; if (v <= 2027 && v > 1880) s.add(v); } return s.size === 4 ? Array.from(s).map(String) : null; };
    const F1 = QT.f1.map(([y, n]) => [y, n, /Schumacher|Hamilton|Verstappen|Vettel|Alonso|Senna|Prost|Fangio|Lauda/.test(n) ? (y >= 1985 ? 1 : 2) : y >= 1990 ? 2 : y >= 1970 ? 3 : 4]);
    const WRC = QT.wrc.map(([y, n]) => [y, n, /Loeb|Ogier|Mäkinen|McRae|Sainz|Auriol/.test(n) ? 2 : y >= 1995 ? 3 : 4]);
    const LM = QT.lemans.map(([y, n]) => [y, n, /Porsche|Ferrari|Audi|Ford|Peugeot|Toyota|Jaguar/.test(n) ? (y >= 1990 ? 2 : 3) : 3]);
    const B = QT.brands, M = QT.models.map((r) => [r[0], r[1], +r[2], +r[3], r[4] || ""]);
    const G = QT.glossary.map((r) => [r[0], r[1], +r[2], r[3]]);
    const C = QT.circuits.map((r) => [r[0], r[1], r[2], r[3], +r[4]]), K = QT.corners.map((r) => [r[0], r[1], +r[2]]);
    const out = { brands: [], history: [], engines: [], motorsport: [], countries: [], circuits: [], numbers: [], trivia: [], japan: [], rally: [], ev: [] };
    // levels : index du niveau dans chaque ligne (brands → 6, models → 3, glossary → 2, circuits → 4, corners → 2, engines → 2, nicks → 2…)
    const bf = (i) => B.filter((r) => r[i]).map((r) => r.slice(0, 6).concat([+r[6]]));
    out.brands.push(
      () => { const rows = bf(1), r = pickN(rows, 6), o = four(r[1], others(rows, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Qui a fondé la marque {0} ?"), [r[0]]), o, 0, "brand-founder", { note: r[0] + " : " + r[1] + (r[2] ? ", " + r[2] : "") + (r[3] ? ", " + r[3] : "") + "." }); },
      () => { const rows = bf(5), r = pickN(rows, 6), o = four(r[0], others(rows, (z) => z[0], r[0], 3)); return o && mk(fmt(T("Quelle marque a pour emblème {0} ?"), [r[5]]), o, 0, "brand-emblem", { note: r[0] + " : " + r[5] + "." }); },
      () => { const rows = bf(3), r = pickN(rows, 6), o = four(r[3], others(rows, (z) => z[3], r[3], 3)); return o && mk(fmt(T("Dans quelle ville se trouve le siège ou le berceau de la marque {0} ?"), [r[0]]), o, 0, "brand-city", { note: r[0] + " : " + r[3] + ", " + r[4] + "." }); },
      () => { const r = pickN(M, 3), brands = Array.from(new Set(M.map((z) => z[0]))), w = shuffle(brands.filter((b) => b !== r[0] && (level < 3 || ctry(b) === ctry(r[0])))).slice(0, 3), o = w.length === 3 ? [r[0]].concat(w) : four(r[0], shuffle(brands.filter((b) => b !== r[0])).slice(0, 3)); return o && mk(fmt(T("Quelle marque a lancé la {0} ?"), [r[1]]), o, 0, "brand-of", { note: r[0] + " " + r[1] + " (" + r[2] + ")." }); }
    );
    out.history.push(
      () => { const r = pickN(M, 3), o = yearOpts(r[2]); return o && mk(fmt(T("En quelle année a été lancée la {0} {1} ?"), [r[0], r[1]]), o, 0, "model-year", { note: r[0] + " " + r[1] + " : " + r[2] + "." }); },
      () => { const rows = bf(2), r = pickN(rows, 6), o = yearOpts(+r[2]); return o && mk(fmt(T("En quelle année la marque {0} a-t-elle été fondée ?"), [r[0]]), o, 0, "brand-year", { note: r[0] + " : " + r[2] + "." }); },
      () => { const s = shuffle(M).slice(0, 4), ys = s.map((r) => r[2]).sort((a, b) => a - b); if (new Set(ys).size < 4 || ys[1] - ys[0] < [0, 14, 7, 3, 2][level]) return null; const g = s.reduce((m, r) => (r[2] < m[2] ? r : m)); return mk(T("Laquelle de ces voitures est la plus ancienne ?"), s.map((r) => r[0] + " " + r[1]), s.indexOf(g), "oldest", { note: g[0] + " " + g[1] + " : " + g[2] + "." }); },
      () => { const s = shuffle(M).slice(0, 4), ys = s.map((r) => r[2]).sort((a, b) => b - a); if (new Set(ys).size < 4 || ys[0] - ys[1] < [0, 14, 7, 3, 2][level]) return null; const g = s.reduce((m, r) => (r[2] > m[2] ? r : m)); return mk(T("Laquelle de ces voitures est la plus récente ?"), s.map((r) => r[0] + " " + r[1]), s.indexOf(g), "newest", { note: g[0] + " " + g[1] + " : " + g[2] + "." }); },
      () => { const r = pickN(F1.filter((z) => /Schumacher|Hamilton|Prost|Verstappen|Vettel/.test(z[1])), 2), y = F1.find((z) => z[1] === r[1])[0], o = yearOpts(y); return o && mk(fmt(T("En quelle année {0} a-t-il remporté son premier titre mondial de F1 ?"), [r[1]]), o, 0, "first-title", { note: r[1] + " : premier titre en " + y + "." }); }
    );
    const EN = QT.engines.map((r) => [r[0], r[1], +r[2]]), GE = G.filter((r) => r[3] === "engines");
    const gl = (arr, T2) => [
      () => { const r = pickN(arr, 2), o = four(r[1], others(arr, (z) => z[1], r[1], 3)); return o && mk(fmt(T2("Que désigne le terme « {0} » ?"), [r[0]]), o, 0, "glossary", { note: r[0] + " : " + r[1] + "." }); },
      () => { const r = pickN(arr, 2), o = four(r[0], others(arr, (z) => z[0], r[0], 3)); return o && mk(fmt(T2("De quoi parle-t-on : « {0} » ?"), [r[1]]), o, 0, "glossary-rev", { note: r[0] + " : " + r[1] + "." }); }
    ];
    out.engines.push(
      () => { const r = pickN(EN, 2), o = four(r[1], others(EN, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Quelle voiture est équipée du moteur {0} ?"), [r[0]]), o, 0, "engine-car", { note: r[0] + " : " + r[1] + "." }); },
      () => { const r = pickN(EN, 2), o = four(r[0], others(EN, (z) => z[0], r[0], 3)); return o && mk(fmt(T("Quel moteur équipe : {0} ?"), [r[1]]), o, 0, "car-engine", { note: r[1] + " : " + r[0] + "." }); }
    ); gl(GE, T).forEach((f) => out.engines.push(f));
    const GM = G.filter((r) => r[3] === "motorsport");
    out.motorsport.push(
      () => { const r = pickN(F1, 2), o = four(r[1], others(F1, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Qui a été sacré champion du monde de F1 en {0} ?"), [r[0]]), o, 0, "f1-champion", { note: r[0] + " : " + r[1] + "." }); },
      () => { const r = pickN(LM, 2), o = four(r[1], others(LM, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Quel constructeur a remporté les 24 Heures du Mans en {0} ?"), [r[0]]), o, 0, "lemans-winner", { note: r[0] + " : " + r[1] + "." }); }
    ); gl(GM, T).forEach((f) => out.motorsport.push(f));
    out.circuits.push(
      () => { const r = pickN(C, 4), o = four(r[1], others(C, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Dans quel pays se trouve le circuit : {0} ?"), [r[0]]), o, 0, "circuit-country", { note: r[0] + " : " + r[2] + ", " + r[1] + "." }); },
      () => { const r = pickN(C, 4), o = four(r[0], others(C, (z) => z[0], r[0], 3)); return o && mk(fmt(T("Quel circuit se trouve à {0} ({1}) ?"), [r[2], r[1]]), o, 0, "circuit-city", { note: r[0] + " : " + r[2] + ", " + r[1] + "." }); },
      () => { const r = pickN(K, 2), o = four(r[1], others(K, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Sur quel circuit trouve-t-on le virage ou la section : {0} ?"), [r[0]]), o, 0, "corner", { note: r[0] + " : " + r[1] + "." }); },
      () => { const r = pickN(C, 4), km = parseFloat(String(r[3]).replace(",", ".")), st = [0, 4, 2, 1, 0.6][level], s = new Set([km]); for (const k of shuffle([-2, -1, 1, 2, 3, -3])) { if (s.size >= 4) break; const v = Math.round((km + k * st) * 10) / 10; if (v > 1.5) s.add(v); } if (s.size < 4) return null; return mk(fmt(T("Quelle est la longueur approximative du circuit : {0} ?"), [r[0]]), Array.from(s).map((v) => String(v).replace(".", ",") + " km"), 0, "circuit-len", { note: r[0] + " : environ " + r[3] + " km." }); }
    );
    const allCountries = Array.from(new Set(B.map((z) => z[4]).concat(Object.keys(QT_BRAND_COUNTRY).map((k) => QT_BRAND_COUNTRY[k])))).filter(Boolean);
    out.countries.push(
      () => { const r = pickN(M, 3), c = ctry(r[0]); if (!c) return null; const o = four(c, shuffle(allCountries.filter((p) => p !== c)).slice(0, 3)); return o && mk(fmt(T("De quel pays vient la {0} {1} ?"), [r[0], r[1]]), o, 0, "model-country", { note: r[0] + " : " + c + "." }); },
      () => { const rows = bf(4), r = pickN(rows, 6), o = four(r[4], others(rows, (z) => z[4], r[4], 3)); return o && mk(fmt(T("Dans quel pays est née la marque {0} ?"), [r[0]]), o, 0, "brand-country2", { note: r[0] + " : " + r[4] + "." }); },
      () => { const rows = bf(4), r = pickN(rows, 6), good = rows.filter((z) => z[4] === r[4]).map((z) => z[0]), w = shuffle(rows.filter((z) => z[4] !== r[4]).map((z) => z[0])).slice(0, 3); if (w.length < 3) return null; const g = pick(good); return mk(fmt(T("Laquelle de ces marques est née en {0} ?"), [r[4]]), [g].concat(w), 0, "brand-in", { note: g + " : " + r[4] + "." }); },
      () => { const r = pickN(C, 4), o = four(r[1], others(C, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Dans quel pays se trouve la ville de {0}, qui accueille le circuit : {1} ?"), [r[2], r[0]]), o, 0, "city-country", { note: r[2] + " : " + r[1] + "." }); }
    );
    out.numbers.push(out.circuits[3], out.history[0], out.history[1]);
    const JP = M.filter((r) => r[4] === "j");
    out.japan.push(
      () => { const r = pickN(JP, 3), o = yearOpts(r[2]); return o && mk(fmt(T("En quelle année a été lancée la {0} {1} ?"), [r[0], r[1]]), o, 0, "model-year", { note: r[0] + " " + r[1] + " : " + r[2] + "." }); },
      () => { const r = pickN(JP, 3), o = four(r[0], shuffle(Array.from(new Set(JP.map((z) => z[0]))).filter((b) => b !== r[0])).slice(0, 3)); return o && mk(fmt(T("Quelle marque japonaise a lancé la {0} ?"), [r[1]]), o, 0, "jp-brand", { note: r[0] + " " + r[1] + "." }); },
      () => { const jp = EN.filter((r) => /Toyota|Nissan|Mazda|Honda|Mitsubishi|Lexus|Subaru/.test(r[1])), r = pickN(jp, 2), o = four(r[1], others(jp, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Quelle voiture japonaise est équipée du moteur {0} ?"), [r[0]]), o, 0, "engine-car", { note: r[0] + " : " + r[1] + "." }); },
      () => { const s = shuffle(JP).slice(0, 4), ys = s.map((r) => r[2]).sort((a, b) => a - b); if (new Set(ys).size < 4 || ys[1] - ys[0] < [0, 14, 7, 3, 2][level]) return null; const g = s.reduce((m, r) => (r[2] < m[2] ? r : m)); return mk(T("Laquelle de ces voitures japonaises est la plus ancienne ?"), s.map((r) => r[0] + " " + r[1]), s.indexOf(g), "oldest", { note: g[0] + " " + g[1] + " : " + g[2] + "." }); }
    );
    const RC = QT.rallycars.map((r) => [r[0], r[1], +r[2]]), RA = QT.rallies.map((r) => [r[0], r[1], +r[2]]), GR = G.filter((r) => r[3] === "rally");
    out.rally.push(
      () => { const r = pickN(WRC, 2), o = four(r[1], others(WRC, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Qui a été sacré champion du monde des rallyes (WRC) en {0} ?"), [r[0]]), o, 0, "wrc-champion", { note: r[0] + " : " + r[1] + "." }); },
      () => { const r = pickN(RC, 2), o = four(r[1], shuffle(Array.from(new Set(RC.map((z) => z[1]))).filter((b) => b !== r[1])).slice(0, 3)); return o && mk(fmt(T("Quelle marque a engagé la {0} en rallye ?"), [r[0]]), o, 0, "rally-brand", { note: r[1] + " " + r[0] + "." }); },
      () => { const r = pickN(RA, 2), o = four(r[1], others(RA, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Dans quel pays se dispute : {0} ?"), [r[0]]), o, 0, "rally-country", { note: r[0] + " : " + r[1] + "." }); }
    ); gl(GR, T).forEach((f) => out.rally.push(f));
    const EV = M.filter((r) => r[4] === "e"), GV = G.filter((r) => r[3] === "ev");
    out.ev.push(
      () => { const r = pickN(EV, 3), o = four(r[0], shuffle(Array.from(new Set(EV.map((z) => z[0]))).filter((b) => b !== r[0])).slice(0, 3)); return o && mk(fmt(T("Quelle marque a lancé la {0} ?"), [r[1]]), o, 0, "ev-brand", { note: r[0] + " " + r[1] + " (" + r[2] + ")." }); },
      () => { const r = pickN(EV, 3), o = yearOpts(r[2]); return o && mk(fmt(T("En quelle année a été lancée la {0} {1} ?"), [r[0], r[1]]), o, 0, "model-year", { note: r[0] + " " + r[1] + " : " + r[2] + "." }); }
    ); gl(GV, T).forEach((f) => out.ev.push(f));
    const NK = QT.nicks.map((r) => [r[0], r[1], +r[2]]);
    out.trivia.push(
      () => { const r = pickN(NK, 2), o = four(r[1], others(NK, (z) => z[1], r[1], 3)); return o && mk(fmt(T("Quelle voiture est surnommée « {0} » ?"), [r[0]]), o, 0, "nickname", { note: "« " + r[0] + " » : " + r[1] + "." }); },
      out.brands[0], out.brands[1], out.history[0], out.countries[1]
    );
    return out;
  }


  /** nom propre d'une voiture : le catalogue répète parfois la marque (« Nissan Nissan GT-R ») */
  const cleanName = (c) => { const b = String(c.brand || "").trim(); let n = String(c.name || "").trim(); if (b) { const rx = new RegExp("^(" + b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+){2,}", "i"); n = n.replace(rx, b + " "); } return n; };
  const bareName = (c) => { let n = modelOf(c); [c.brand, familyOf(c.brand)].forEach((w) => { if (w) n = n.replace(new RegExp("(^|[\\s/(])" + String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=[-\\s/)]|$)-?", "ig"), "$1"); }); return n.replace(/^[\s/\-–]+/, "").replace(/\s{2,}/g, " ").trim() || modelOf(c); };
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
      if (x && x.note && r.ex) r.note = x.note;
      return r;
    };
    /** libellés Vrai / Faux dans la langue demandée (le français par défaut) */
    const vfo = () => (lang === "fr" ? ["Vrai", "Faux"] : [T("Vrai") === "Vrai" ? "True" : T("Vrai"), T("Faux") === "Faux" ? "False" : T("Faux")]);
    /** question écrite de la banque : [cat, niveau, FR, bonnes/fausses, EN, …] ; « vf » = affirmation, « intrus » = quatre voitures dont la première est l'intrus */
    const wq = (b, fr) => {
      if (b[0] === "vf") return { q: fr ? b[2] : b[4], o: vfo(), a: b[3][0] === "Vrai" ? 0 : 1, k: "vf" };
      const opts = fr ? b[3] : b[5];
      if (b[0] === "intrus") return mk(fr ? b[2] : b[4], opts, 0, "odd", b[6] ? { note: fr ? b[6] : (b[7] || b[6]), ids: [] } : null);
      return mk(fr ? b[2] : b[4], opts, 0, "written");
    };
    const mkm = (q, opts, goods, k) => { const order = shuffle(opts.map((_, i) => i)); const m = goods.map((g) => order.indexOf(g)).sort((x, y) => x - y); return { q, o: order.map((i) => opts[i]), a: m[0], m, k }; };
    const distinct = (arr) => new Set(arr).size === arr.length;
    const gapOk = (vals, ratio) => { const s = vals.slice().sort((x, y) => y - x); return s[1] > 0 ? s[0] / s[1] >= ratio : s[0] > 0; };
    const RATIO = [0, 1.35, 1.12, 1.03, 1.015][level];
    const four = (get, pred) => { for (let i = 0; i < 60; i++) { const c = []; for (let j = 0; j < 4; j++) c.push(pick(cars.filter(pred || (() => true)))); if (!distinct(c.map((x) => x.id)) || c.some((x) => !(get(x) > 0))) continue; if (!distinct(c.map(get))) continue; return c; } return null; };
    const fams = Array.from(new Set(cars.map((c) => familyOf(c.brand)))).filter((f) => cars.filter((c) => familyOf(c.brand) === f).length >= 2);
    const gens = {
      brands: [
        () => { const c = pick(cars), fam = familyOf(c.brand), pool = level >= 2 ? fams.filter((f) => f !== fam && countryOf(f) === countryOf(fam)) : fams.filter((f) => f !== fam); const w = shuffle(pool.length >= 3 ? pool : fams.filter((f) => f !== fam)).slice(0, 3); if (w.length < 3) return null; return mk(fmt(T("Quelle marque fabrique la {0} ?"), [bareName(c)]), [fam].concat(w), 0, "brand-of"); },
        () => { const f = pick(fams.filter((x) => countryOf(x) !== "xx")); const ids = shuffle(COUNTRIES.filter((k) => k.id !== "xx").map((k) => k.id).filter((i) => i !== countryOf(f))).slice(0, 3); return mk(fmt(T("De quel pays vient la marque {0} ?"), [f]), [ctryLabel(countryOf(f))].concat(ids.map(ctryLabel)), 0, "brand-country"); },
        () => { const f = pick(fams), good = pick(cars.filter((c) => familyOf(c.brand) === f)); const others = shuffle(cars.filter((c) => familyOf(c.brand) !== f && (level < 3 || countryOf(c.brand) === countryOf(f)))).slice(0, 3); if (others.length < 3) return null; const L = [good].concat(others); return mk(fmt(T("Laquelle de ces voitures est signée {0} ?"), [f]), L.map((c) => bareName(c)), 0, "which-brand", xt(L)); }
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
    const nrm = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    /** une réponse correcte écrite dans l'énoncé est une question ratée (ex. « Quelle marque fabrique l'Opel Corsa ? » → Opel) */
    const leaks = (q) => { const nq = nrm(q.q), goods = (q.m || [q.a]).map((i) => nrm(q.o[i])); return goods.some((g) => g.length >= 3 && !/^[\d\s.,]+$/.test(g) && nq.indexOf(g) >= 0); };
    const add = (q) => { const sk = q ? q.q + (q.k === "odd" ? "|" + q.o.slice().sort().join("|") : "") : ""; if (q && !seen.has(sk) && distinct(q.o) && !leaks(q)) { seen.add(sk); out.push(q); return true; } return false; };
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
      const b = wanted[i], fr = lang === "fr";
      add(wq(b, fr));
    }
    // questions automatiques
    gens.japan = [
      () => { const jp = cars.filter((c) => countryOf(c.brand) === "jp"), c = four((x) => x.power, (x) => x.power > 0 && countryOf(x.brand) === "jp"); if (!c || !gapOk(c.map((x) => x.power), RATIO) || !jp.length) return null; const b = c.reduce((m, x) => (x.power > m.power ? x : m)); return mk(T("Laquelle de ces voitures japonaises est la plus puissante ?"), c.map((x) => x.name), c.indexOf(b), "jp-power", xt(c)); },
      () => { const c = four((x) => x.year, (x) => x.year > 0 && countryOf(x.brand) === "jp"); if (!c) return null; const ys = c.map((x) => x.year).sort((p, q) => p - q); if (ys[1] - ys[0] < [0, 25, 10, 3, 2][level]) return null; const b = c.reduce((m, x) => (x.year < m.year ? x : m)); return mk(T("Laquelle de ces voitures japonaises est la plus ancienne ?"), c.map((x) => x.name), c.indexOf(b), "jp-oldest", xt(c)); },
      () => { const jp = cars.filter((c) => countryOf(c.brand) === "jp"), rest = cars.filter((c) => countryOf(c.brand) !== "jp" && countryOf(c.brand) !== "xx"); if (!jp.length || rest.length < 3) return null; const L = [pick(jp)].concat(shuffle(rest).slice(0, 3)); return mk(T("Laquelle de ces voitures est japonaise ?"), L.map((c) => c.name), 0, "is-jp", xt(L)); }
    ];
    gens.rally = [gens.motorsport[1]]; gens.ev = [];
    gens.countries = [gens.brands[1], gens.brands[0]]; gens.circuits = gens.motorsport; gens.numbers = gens.engines.concat(gens.history); gens.trivia = [];
    // vrai ou faux : affirmations sur la puissance, la vitesse, le 0 à 100, l'année et le pays, avec un écart d'autant plus faible que le niveau monte
    const vfq = (text, truth, c) => ({ q: text, o: vfo(), a: truth ? 0 : 1, k: "vf", note: info(c), ids: [c.id] });
    const FACT = [0, 0.55, 0.7, 0.82, 0.9][level], GAP = [0, 25, 12, 5, 2][level];
    gens.vf = [
      () => { const c = pick(cars.filter((x) => x.power > 0)), t = rng() < 0.5, r = c.power >= 500 ? 50 : 10, th = t ? Math.floor(c.power * FACT / r) * r : Math.ceil(c.power / FACT / r) * r; if (th <= 0 || (t && th >= c.power) || (!t && th <= c.power)) return null; return vfq(fmt(T("{0} développe plus de {1} ch."), [c.name, th]), t, c); },
      () => { const c = pick(cars.filter((x) => x.speed > 0)), t = rng() < 0.5, th = t ? Math.floor(c.speed * FACT / 10) * 10 : Math.ceil(c.speed / FACT / 10) * 10; if (th <= 0 || (t && th >= c.speed) || (!t && th <= c.speed)) return null; return vfq(fmt(T("{0} dépasse {1} km/h en vitesse maximale."), [c.name, th]), t, c); },
      () => { const c = pick(cars.filter((x) => x.zero > 0)), t = rng() < 0.5, th = t ? Math.ceil(c.zero / FACT) : Math.floor(c.zero * FACT); if (th <= 1 || (t && th <= c.zero) || (!t && th >= c.zero)) return null; return vfq(fmt(T("{0} passe de 0 à 100 km/h en moins de {1} s."), [c.name, th]), t, c); },
      () => { const c = pick(cars.filter((x) => x.year > 1900)), t = rng() < 0.5, y = t ? c.year + GAP : c.year - GAP; if (y > 2030 || y < 1895) return null; return vfq(fmt(T("{0} date d'avant {1}."), [c.name, y]), t, c); },
      () => { const c = pick(cars.filter((x) => countryOf(x.brand) !== "xx")), real = countryOf(c.brand), t = rng() < 0.5, other = pick(COUNTRIES.filter((k) => k.id !== "xx" && k.id !== real)); if (!other) return null; return vfq(fmt(T("Pays d'origine de la marque {0} : {1}."), [familyOf(c.brand), t ? ctryLabel(real) : other.label]), t, c); }
    ];
    // intrus : trois voitures qui ont un point commun (pays, catégorie, décennie) et une qui n'en a pas
    const oddQ = (odd, three, note) => { const L = [odd].concat(three); if (!distinct(L.map((x) => x.id)) || !distinct(L.map((x) => x.name))) return null; return mk(T("Quel est l'intrus ?"), L.map((x) => x.name), 0, "odd", Object.assign(xt(L), { note })); };
    gens.intrus = [
      () => { const ks = Array.from(new Set(cars.map((c) => countryOf(c.brand)))).filter((k) => k !== "xx" && cars.filter((c) => countryOf(c.brand) === k).length >= 3); if (ks.length < 2) return null; const k = pick(ks), three = shuffle(cars.filter((c) => countryOf(c.brand) === k)).slice(0, 3), odd = pick(cars.filter((c) => countryOf(c.brand) !== k && countryOf(c.brand) !== "xx")); return oddQ(odd, three, fmt(T("Les trois autres viennent de : {0}."), [ctryLabel(k)])); },
      () => { const cs = Array.from(new Set(cars.map((c) => c.category))).filter((k) => k && cars.filter((c) => c.category === k).length >= 3); if (cs.length < 2) return null; const k = pick(cs), three = shuffle(cars.filter((c) => c.category === k)).slice(0, 3), odd = pick(cars.filter((c) => c.category && c.category !== k)); return oddQ(odd, three, fmt(T("Catégorie des trois autres : {0}."), [k])); },
      () => { const ds = Array.from(new Set(cars.filter((c) => c.year > 1900).map((c) => Math.floor(c.year / 10) * 10))).filter((d) => cars.filter((c) => c.year >= d && c.year < d + 10).length >= 3); if (!ds.length) return null; const d = pick(ds), three = shuffle(cars.filter((c) => c.year >= d && c.year < d + 10)).slice(0, 3), far = [0, 40, 30, 20, 12][level], odd = pick(cars.filter((c) => c.year > 1900 && Math.abs(c.year - d) >= far)); if (!odd) return null; return oddQ(odd, three, fmt(T("Les trois autres datent des années {0}."), [d])); }
    ];
    const tg = quizTables({ mk, pick, shuffle, T, fmt, level }); Object.keys(tg).forEach((k) => { gens[k] = (gens[k] || []).concat(tg[k]); });
    const g = gens[cat] || [];
    for (let tries = 0; tries < 400 && g.length && out.length < QUIZ_N && cars.length > 8; tries++) { let q = null; try { q = pick(g)(); } catch (e) { q = null; } add(q); }
    // complète avec des questions écrites restantes si le catalogue ne suffit pas
    for (let i = nWritten; i < wanted.length && out.length < QUIZ_N; i++) { const b = wanted[i], fr = lang === "fr"; add(wq(b, fr)); }
    return shuffle(out).slice(0, QUIZ_N);
  }

  /** mode chrono : 60 s, +1 par bonne réponse, −5 s par erreur ; questions de toutes les catégories, à réponse unique */
  const CHRONO = { secs: 60, penalty: 5, reward: 2, cap: 40, max: 80 };
  function chronoQuestions(seed, level, list, opt) {
    const cats = Object.keys(QCATS).filter((k) => !QSPECIAL[k]), out = [];
    for (let b = 0; out.length < CHRONO.max && b < 40; b++) quizBuild(seed + "-" + b, cats[b % cats.length], level, list, opt).forEach((q) => { if (!q.m) out.push(q); });
    return out.slice(0, CHRONO.max);
  }
  /** quiz « survie » : 3 vies, une erreur ou un temps écoulé coûte une vie, la partie s'arrête à 0 ; le temps par question raccourcit avec la série */
  const SURVIVAL = { lives: 3, secs: 14, minSecs: 7, reward: 1, cap: 30, max: 80 };
  const survivalSecs = (okSoFar) => Math.max(SURVIVAL.minSecs, SURVIVAL.secs - Math.floor(okSoFar / 8));
  function survivalQuestions(seed, level, list, opt) {
    const cats = Object.keys(QCATS).filter((k) => !QSPECIAL[k]), out = [];
    for (let b = 0; out.length < SURVIVAL.max && b < 40; b++) quizBuild(seed + "-s" + b, cats[b % cats.length], level, list, opt).forEach((q) => { if (!q.m) out.push(q); });
    return out.slice(0, SURVIVAL.max);
  }
  /** rejoue une partie : answers[i] = indice choisi, -1 = temps écoulé. Retourne { ok, wrong, used } (la partie s'arrête à la dernière vie perdue) */
  function survivalPlay(questions, answers) {
    let ok = 0, wrong = 0, used = 0;
    for (let i = 0; i < answers.length && i < questions.length; i++) {
      used = i + 1;
      if (Number(answers[i]) === questions[i].a) ok++; else { wrong++; if (wrong >= SURVIVAL.lives) break; }
    }
    return { ok, wrong, used };
  }
  // ---------------------------------------------------------------- « Devine la voiture » : une voiture mystère par jour, la même pour tous
  /** 6 essais ; chaque erreur révèle un indice de plus ; moins il y a eu d'indices, plus la récompense est grande */
  const DEVINE = { max: 6, reward: [30, 22, 16, 11, 7, 4], season: [8, 7, 6, 5, 4, 3], streakStep: 2, streakMax: 5 };
  const devinePool = (list) => (list || []).filter((c) => c && c.id && c.name && c.brand && c.power > 0 && c.speed > 0 && c.zero > 0 && c.year > 1900 && String(c.id).indexOf("~") < 0 && !isLivery(c.id) && !isCircuit(c.id) && !/ \/ | & |\(/.test(c.name) && countryOf(c.brand) !== "xx").sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  /** la voiture du jour (day = « AAAA-MM-JJ », heure de Paris) */
  function devineCar(day, list) { const p = devinePool(list); return p.length ? p[Math.floor(seeded("devine|" + day)() * p.length)] : null; }
  /** indices visibles au stade 0 (aucune erreur) à 5 (cinq erreurs) : pays et catégorie, décennie, puissance, vitesse et 0 à 100, lettres, marque et photo */
  function devineHints(car, stage) {
    const s = Math.max(0, Math.min(5, stage | 0)), band = (v, w) => { const lo = Math.floor(v / w) * w; return lo + "–" + (lo + w); };
    const out = [{ k: "country", v: ctryLabel(countryOf(car.brand)) || "—" }, { k: "category", v: car.category || "—" }];
    if (s >= 1) out.push({ k: "decade", v: String(Math.floor(car.year / 10) * 10) });
    if (s >= 2) out.push({ k: "power", v: band(car.power, 100) });
    if (s >= 3) out.push({ k: "speed", v: band(car.speed, 40) }, { k: "zero", v: band(car.zero, 2) });
    if (s >= 4) out.push({ k: "letters", v: String(car.name.replace(/\s+/g, "").length) }, { k: "initial", v: car.brand.charAt(0).toUpperCase() });
    if (s >= 5) out.push({ k: "brand", v: car.brand }, { k: "photo", v: car.id });
    return out;
  }
  /** ce que la proposition a de commun avec la voiture mystère : marque, pays, catégorie, et si la voiture cherchée est plus récente (1), plus ancienne (-1) ou proche (0) ; idem pour la puissance */
  function devineFeedback(target, guess) {
    const dy = target.year - guess.year, rp = guess.power > 0 ? target.power / guess.power : 1;
    return { brand: familyOf(guess.brand) === familyOf(target.brand), country: countryOf(guess.brand) === countryOf(target.brand), category: guess.category === target.category, year: Math.abs(dy) <= 2 ? 0 : dy > 0 ? 1 : -1, power: Math.abs(rp - 1) <= 0.1 ? 0 : rp > 1 ? 1 : -1 };
  }
  /** points de quiz du mois : champ du document gstats, un par mois (la remise à zéro se fait toute seule au changement de mois) */
  const quizField = (ms) => "qp" + monthKey(ms).replace("-", "");
  // ---- genres : un « style » en plus de la catégorie (une voiture peut en avoir plusieurs). Calculé d'après l'identifiant de la fiche et l'année.
  const GENRES = { suv: "SUV", ev: "Électrique", cabrio: "Cabriolet", pickup: "Pick-up", young: "Youngtimer" };
  const GT_SUV = new Set("model-x grecale xm eletre range-rover g-63 lm002 x1 x2 x3 x4 x5 x6 x7 ix3 gla glb glk glc gle gls eqa eqb eqc eqe cayenne macan urus levante purosangue dbx stelvio formentor defender wrangler trackhawk durango bronco explorer kuga captur kadjar rafale arkana duster tiguan touareg cx5 cx60 rav4 xc40 xc60 xc90 ev6 ev9 ioniq5 cybertruck jimny pajero ariya enyaq q3 q5 q7 q8 cullinan bentayga".split(" "));
  const GT_PICK = new Set("f150 raptor silverado hilux ram tundra tacoma ranger amarok lightning mammoth maverick sierra-pickup el-camino ssr navara".split(" "));
  const GT_CABRIO = new Set("sl grancabrio boxster spider spyder cabriolet cabrio cc roadster targa barchetta speedster slk z1 z3 z4 mx5 mx-5 gts california cti stag drophead volante convertible".split(" "));
  const GT_EV = new Set("ev6 ev9 mach-e lucid tesla rimac polestar taycan nevera evija leaf zoe i3 i4 ix eqa eqb eqc eqe eqs ariya etech electrique electric ioniq id e-tron etron twizy battista roadster2008 enyaq".split(" "));
  const genresOf = (c) => {
    if (!c) return [];
    const id = String(c.id || ""), tk = id.split("-"), has = (S) => tk.some((x) => S.has(x)) || tk.some((_, i) => i < tk.length - 1 && S.has(tk[i] + "-" + tk[i + 1])), g = [];
    const ev = has(GT_EV) && !(tk.indexOf("ix") >= 0 && id.indexOf("bmw") !== 0) && !/evolution|evo-|hybrid/.test(id) || /^(tesla|rimac|polestar)-/.test(id) && !/polestar-polestar-1$/.test(id);
    if ((ev || id === "ford-f-150-lightning-2022" || /^mini-cooper-se/.test(id)) && !/(lm-audi-r18|citroen-id-19|polestar-polestar-1$|rally-audi-rs-q)/.test(id)) g.push("ev");
    if (has(GT_PICK) && !/(sierra-(rs|xr)|bronco)/.test(id)) g.push("pickup"); else if (has(GT_SUV) && id !== "ford-puma-17" && !/-(rs|xr)\d/.test(id) && !/^(alfa|rally-lancer|rally-evo)/.test(id) || /^(ford-(bronco|explorer|kuga|puma-st)|porsche-(cayenne|macan)|lamborghini-urus|toyota-land-cruiser|mb-g-|bmw-ix$)/.test(id)) g.push("suv");
    if (has(GT_CABRIO) && !/^(bmw-3|mb-.*coupe|renault-r\d)/.test(id) && !/(gullwing|porsche-928|turbo-gts|viper-gts|dart-gts|mclaren-gts|skyline-gts|-904-|koenigsegg-cc|550-gts)/.test(id)) g.push("cabrio");
    const y = yearOf(c);
    if (y >= 1980 && y <= 1999 && c.category !== "Le Mans" && !/^(rally|lm)-/.test(id)) g.push("young");
    return g;
  };

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
  /** repères d'une marque (fondateur, année, ville, pays, emblème) tirés des données du quiz ; null si on n'en a pas */
  const brandFacts = (name) => {
    const k = String(name || "").toLowerCase(), r = QT.brands.find((x) => String(x[0]).toLowerCase() === k);
    if (!r) return null;
    const f = { founder: r[1] || "", year: Number(r[2]) || 0, city: r[3] || "", country: r[4] || "", emblem: r[5] || "" };
    return f.founder || f.year || f.city || f.country || f.emblem ? f : null;
  };
  const BRAND_BADGES = [["Peugeot", "🦁", "Fan du Lion"], ["Renault", "◆", "Ça roule en Losange"], ["BMW", "🌀", "Hélice bavaroise"], ["Mercedes", "⭐", "Étoile à trois branches"], ["Audi", "⭕", "Quatre anneaux"], ["Alfa Romeo", "🐍", "Biscione"], ["Toyota", "🌅", "Soleil levant"], ["Nissan", "🗾", "Samouraï"], ["Ford", "🔵", "Ovale bleu"], ["Porsche", "🏁", "Cap sur Stuttgart"], ["Citroën", "⚙️", "Double chevron"]];
  const EXTRA = [
    ["epic1", "💜", "Première Épique", "Posséder une carte Épique ou mieux", (s) => rarAtLeast(s, "epic"), 1, ""],
    ["epic10", "💎", "Pile d'Épiques", "Posséder 10 cartes Épique ou mieux", (s) => rarAtLeast(s, "epic"), 10, "silver"],
    ["leg1", "🟡", "Première Légendaire", "Posséder une carte Légendaire ou mieux", (s) => rarAtLeast(s, "legendary"), 1, "silver"],
    ["leg5", "👑", "Cinq Légendaires", "Posséder 5 cartes Légendaire ou mieux", (s) => rarAtLeast(s, "legendary"), 5, "gold"],
    ["shiny1", "🌈", "Premier Shiny", "Posséder une carte Shiny", (s) => rarAtLeast(s, "shiny"), 1, "gold"],
    ["shiny5", "✨", "Chasseur de Shiny", "Posséder 5 cartes Shiny ou mieux", (s) => rarAtLeast(s, "shiny"), 5, "gold"],
    ["mythic1", "🔱", "Légende vivante", "Posséder une carte Légende (album complété)", (s) => _n(s.rar && s.rar.mythic), 1, "gold"],
    ["mythic5", "🏵️", "Cinq Légendes", "Posséder 5 cartes Légende (albums complétés)", (s) => _n(s.rar && s.rar.mythic), 5, "gold"],
    ["mythic10", "🏛️", "Dix Légendes", "Posséder 10 cartes Légende (albums complétés)", (s) => _n(s.rar && s.rar.mythic), 10, "gold"],
    ["sets50", "📚", "Grand archiviste", "Compléter 50 albums", (s) => _n(s.sets), 50, "gold"],
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
  // badges rares (palier « diamant ») : 4 familles — collection, performance, communauté, jeu
  [
    ["r-col1", "💎", "Collection quasi complète", "Posséder 580 cartes différentes", (s) => s.cards, 580, "collection"],
    ["r-col2", "🔱", "Triple Légende", "Posséder 3 cartes Légende (albums complétés)", (s) => _n(s.rar && s.rar.mythic), 3, "collection"],
    ["r-col5", "🌟", "Panthéon des Légendes", "Posséder 25 cartes Légende (albums complétés)", (s) => _n(s.rar && s.rar.mythic), 25, "collection"],
    ["r-col6", "👑", "Toutes les Légendes", "Posséder toutes les cartes Légende", (s) => _n(s.rar && s.rar.mythic), () => LEGEND_IDS.length, "collection"],
    ["r-col3", "✦", "Gardien des éditions limitées", "Posséder 5 cartes d'édition limitée", (s) => _n(s.specials), 5, "collection"],
    ["r-col4", "📦", "Pack infini", "Ouvrir 5000 packs", (s) => _n(s.opened), 5000, "collection"],
    ["r-perf1", "🏆", "Maître des records", "Détenir 10 records de circuits", (s) => s.records, 10, "perf"],
    ["r-perf2", "🥇", "Habitué du podium", "Finir 50 fois sur un podium", (s) => s.podiums, 50, "perf"],
    ["r-perf3", "🗺️", "Tour du monde des circuits", "Rouler sur 40 circuits différents", (s) => s.tracks, 40, "perf"],
    ["r-perf4", "⏱️", "Chrono sans fin", "Enregistrer 3000 chronos", (s) => s.laps, 3000, "perf"],
    ["r-soc1", "🗣️", "Voix de la communauté", "Poster 5000 commentaires", (s) => s.comments, 5000, "social"],
    ["r-soc2", "🧑‍🏫", "Mentor de légende", "Accompagner 25 pilotes en tant que mentor", (s) => _n(s.mentored), 25, "social"],
    ["r-soc3", "📸", "Triple lauréat photo", "Gagner 3 concours photo", (s) => _n(s.wins), 3, "social"],
    ["r-soc4", "🎪", "Organisateur de légende", "Proposer 15 sorties", (s) => s.events, 15, "social"],
    ["r-game1", "🎓", "Cent sans faute", "Réussir 100 quiz 10 sur 10", (s) => _n(s.quizPerfect), 100, "game"],
    ["r-game2", "🤝", "Roi de l'échange", "Réaliser 500 échanges de cartes", (s) => s.trades, 500, "game"],
    ["r-game3", "🔧", "Atelier légendaire", "Améliorer 200 cartes", (s) => _n(s.upgraded), 200, "game"],
    ["r-game4", "🌌", "Panthéon", "Atteindre le niveau 30", (s) => s.level, 30, "game"]
  ].forEach((b) => BADGES.push({ id: b[0], icon: b[1], label: b[2], desc: b[3], get: b[4], goal: b[5], tier: "diamond", rare: true, kind: b[6] }));
  // niveaux relevés (paliers beaucoup plus élevés) : id → [objectif, titre, description]
  const REV = {"lap10": [50, "50 chronos", "Enregistrer 50 chronos"], "lap50": [250, "250 chronos", "Enregistrer 250 chronos"], "globe": [15, "Globe-trotter", "Rouler sur 15 circuits différents"], "cmt10": [100, "Bavard", "Poster 100 commentaires"], "cmt50": [500, "Porte-voix", "Poster 500 commentaires"], "like10": [100, "Passionné", "Aimer 100 voitures"], "like50": [500, "Cœur d'or", "Aimer 500 voitures"], "car3": [10, "Garage rempli", "Publier 10 voitures"], "rsvp3": [15, "Toujours partant", "Participer à 15 sorties"], "streak3": [7, "7 jours d'affilée", "Visiter le site 7 jours de suite"], "streak7": [30, "Mois sans faute", "Visiter le site 30 jours de suite"], "streak30": [90, "Trimestre sans faute", "Visiter le site 90 jours de suite"], "card10": [25, "Collectionneur", "Posséder 25 cartes différentes"], "card50": [100, "Grand collectionneur", "Posséder 100 cartes différentes"], "swap10": [50, "Négociateur", "Réaliser 50 échanges de cartes"], "chal4": [12, "Relève le défi", "Valider 12 défis hebdomadaires"], "chal20": [52, "Infatigable", "Valider 52 défis hebdomadaires"], "lvl5": [7, "Expert", "Atteindre le niveau 7"], "epic10": [30, "Pile d'Épiques", "Posséder 30 cartes Épique ou mieux"], "leg5": [15, "15 Légendaires", "Posséder 15 cartes Légendaire ou mieux"], "shiny5": [10, "Chasseur de Shiny", "Posséder 10 cartes Shiny ou mieux"], "card100": [200, "200 cartes", "Posséder 200 cartes différentes"], "card250": [350, "Bibliothécaire", "Posséder 350 cartes différentes"], "card400": [500, "Conservateur", "Posséder 500 cartes différentes"], "brands10": [25, "Tour du monde", "Posséder des cartes de 25 marques différentes"], "opened10": [50, "Déballeur", "Ouvrir 50 packs"], "opened100": [500, "Passionné de packs", "Ouvrir 500 packs"], "opened500": [2000, "Boulimique de packs", "Ouvrir 2000 packs"], "sets5": [15, "15 albums", "Compléter 15 albums"], "sets10": [30, "30 albums", "Compléter 30 albums"], "sets25": [40, "Archiviste", "Compléter 40 albums"], "up10": [50, "Préparateur", "Améliorer 50 cartes"], "fuse10": [50, "Maître fondeur", "Réaliser 50 fusions"], "fuse50": [250, "Haut fourneau", "Réaliser 250 fusions"], "sell10": [50, "Marchand", "Vendre 50 cartes sur le marché"], "buy10": [50, "Client fidèle", "Acheter 50 cartes sur le marché"], "pm5": [10, "Œil de lynx", "Faire 10 bonnes réponses d'affilée à Plus ou moins"], "pm10": [20, "Tireur d'élite", "Faire 20 bonnes réponses d'affilée à Plus ou moins"], "pm20": [35, "Encyclopédie", "Faire 35 bonnes réponses d'affilée à Plus ou moins"], "pm30": [50, "Voyant", "Faire 50 bonnes réponses d'affilée à Plus ou moins"], "quiz10": [50, "Habitué des quiz", "Terminer 50 quiz"], "quizP10": [30, "Professeur", "Réussir 30 quiz 30 sur 30"], "wish5": [20, "Rêveur", "Mettre 20 cartes dans sa liste de souhaits"], "wish20": [75, "Grande liste", "Mettre 75 cartes dans sa liste de souhaits"], "follow10": [30, "Radar", "Suivre 30 voitures ou marques"], "swap50": [250, "Courtier", "Réaliser 250 échanges de cartes"], "streak100": [365, "Une année entière", "Visiter le site 365 jours de suite"], "cmt200": [2000, "Orateur", "Poster 2000 commentaires"], "like200": [2000, "Cœur de pierre précieuse", "Aimer 2000 voitures"], "lap100": [1000, "Millénaire du chrono", "Enregistrer 1000 chronos"], "car10": [30, "Parc automobile", "Publier 30 voitures"]};
  const BRAND_GOAL = { Peugeot: 20, Renault: 20, BMW: 20, Mercedes: 20, Audi: 20, "Alfa Romeo": 20, Toyota: 18, Nissan: 18, Ford: 18, Porsche: 12, "Citroën": 15 };
  BADGES.forEach((b) => { const r = REV[b.id]; if (r) { b.goal = r[0]; b.label = r[1]; b.desc = r[2]; } else if (b.id.indexOf("b-") === 0) { const k = b.id.slice(2), n = BRAND_GOAL[k] || 10; b.goal = n; b.desc = "Posséder " + n + " cartes " + k + " différentes"; } });
  const setBrandsTotal = (n) => { if (n > 0) BRANDS_TOTAL = n | 0; };

  return {
    TZ, dayKey, monthKey, weekKey, weekStart, weekEnd, parisMidnight, monthLabel,
    brandFacts, clubGoalTarget, setsOf, THEMED_SETS, setReward, yearOf, decadeOf, decadeLabel, LEGENDS, LEGEND_IDS, LV_MAX, LV_NAMES, upgradeCost, OFFER_PCT, dailyOffers, offerPackCost, dailyMissions,
    LEVELS, levelOf, BADGES, goalOf, BLANK_STATS, finish,
    ARENAS, LIVERIES, isLivery, isExtra, liveryCard, circuitPick, CIRCUIT_CARDS, CIRCUIT_BY_ID, CIRCUIT_COUNTRY, isCircuit, circuitRarities, CHRONO, SURVIVAL, survivalSecs, survivalQuestions, survivalPlay, chronoQuestions, chronoField, quizField, GENRES, genresOf, WHEEL, wheelDraw, wheelLabel, adventToday, adventReward, adventLabel, PITY, HIST_MAX, HIST_LABEL, histAdd, isLocked, RECYCLE_MAX, RAR, ORDER, SHOP_PACK, hashStr, PACKS, THEME_PACKS, themeMatch, themePackActive, themePacksNow, themePackNext, COUNTRIES, countryOf, drawShopPack, isSpecial, computeRarities, pickRarity, drawPack, blankCollection, recount, picKey, picUrls, picKeys, picsHave, picReward,
    ensureBank, FUSE_COUNT, FUSE_NEXT, MARKET_FEE, MARKET_MAX_LISTINGS, marketBounds, marketNet, familyOf, seeded, PM_STATS, pmPair, pmWinner, PM_REWARDS, PM_DAILY_CAP, QCATS, QSPECIAL, QLEVELS, QUIZ_N, DEVINE, devineCar, devineHints, devineFeedback, SEASON_LEN, SEASON_DAY_CAP, SEASON_FREE, seasonToday, legendOffer, epicPick, seasonInfo, PASS_TIERS, PASS_STEP, SEASON_PTS, FRAMES, TITLES, passReward, passLabel, SEASON_QUESTS, SEASON_QUEST_FINAL, ROMAN, TIER_MAX, romanOf, variantId, nextVariant, grantVariant, shownVariant, seasonRank, questList, blankSeason, seasonOf, seasonAdd, passTier, questState, FREEZE_MAX, FREEZE_COST, dayDiff, WELCOME, seasonCosm, QUIZ_REWARD, QUIZ_DAILY_CAP, QBANK, quizBuild, quizScore, setBrandsTotal,
    SHINY, CARD_WEIGHT, oddsOf, dropRates, PIN_EPIC, PIN_LEGENDARY, PRESTIGE_PACK_RX, isPrestige, CHALLENGES, DAILY, FEATURED, CARD_CHALS, CARD_GOALS, cardChalCars, featuredItems, autoFeatured, weekChallenges, dailyChallenge, PERFECT_WEEK_BONUS, THEMES
  };
});
