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
  /** tire un pack de 3 cartes ; tous les 10 packs, une carte au moins « rare » est garantie, tous les 30 une « épique » */
  function drawPack(rarities, ids, rng, pity, epicPity) {
    ids = ids.filter((id) => rarities.get(id) !== "mythic");
    const by = {}; ORDER.forEach((r) => { by[r] = []; });
    ids.forEach((id) => { const r = rarities.get(id); if (by[r]) by[r].push(id); });
    const pick = (r) => { const list = by[r].length ? by[r] : (r === "shiny" && by.legendary.length ? by.legendary : ids); return list[Math.floor(rng() * list.length)]; };
    const out = [];
    for (let i = 0; i < 3; i++) out.push(pick(pickRarity(rng, epicPity && i === 2 ? "epic" : pity && i === 2 ? "rare" : null)));
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
  const PACKS = { world: { id: "world", label: "Pack mondial", cost: 200, cards: 2, min: "rare", country: "" } };
  COUNTRIES.forEach((k) => { PACKS[k.id] = { id: k.id, label: "Pack " + k.label, cost: k.cost, cards: 2, min: "rare", country: k.id }; });
  const SHOP_PACK = { cost: PACKS.world.cost, cards: 2 };
  function drawShopPack(rarities, ids, rng, min) {
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
    let second = pick(pickRarity(rng, null));
    for (let k = 0; k < 6 && second === out[0] && ids.length > 2; k++) second = pick(pickRarity(rng, null));   // évite le doublon dans le même pack quand c'est possible
    out.push(second);
    return out;
  }
  const blankCollection = () => ({ owned: {}, count: 0, specials: 0, dust: 0, lastPack: "", bonus: 1, claimed: [], opened: 0, trades: 0, chal: 0, dustLog: [], pics: {}, picClaims: {}, lv: {}, mis: { day: "", p: {}, done: [] }, offers: { day: "", pack: 0, card: 0 }, log: [], best: "", welcome: false, season: null, cosm: [] });

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
    let c = 0, s = 0;
    Object.keys(doc.owned || {}).forEach((k) => { if (doc.owned[k] > 0) { if (isSpecial(k)) s++; else c++; } });
    doc.count = c; doc.specials = s; return doc;
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
  const QCATS = { brands: "Marques", history: "Histoire", engines: "Moteurs", motorsport: "Sport auto", countries: "Pays et constructeurs", circuits: "Rallye et circuits", numbers: "Chiffres", trivia: "Anecdotes et records" };
  const QLEVELS = { 1: "Facile", 2: "Moyen", 3: "Expert" };
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
    5: { bonus: 1 }, 7: { freeze: 1 }, 10: { dust: 60, title: "t10" }, 12: { epic: 1 }, 15: { bonus: 1, frame: "s_gold" }, 20: { epic: 1, title: "t20" },
    22: { freeze: 1 }, 25: { bonus: 2 }, 30: { dust: 200, choice: "legendary", frame: "s_royal", title: "t30" }
  };
  function passReward(t) {
    const sp = PASS_SPECIAL[t] || null;
    return Object.assign({ dust: sp ? 0 : 20 + Math.floor((t - 1) / 4) * 10, bonus: 0, frame: "", title: "", freeze: 0, epic: 0, choice: "" }, sp || {});
  }
  const passLabel = (r) => [r.dust ? r.dust + " cristaux" : "", r.bonus ? (r.bonus > 1 ? r.bonus + " packs bonus" : "1 pack bonus") : "", r.freeze ? "1 gel de série" : "", r.epic ? "1 carte Épique" : "", r.choice ? "1 Légendaire au choix" : "", r.frame ? "cadre " + FRAMES[r.frame].name : "", r.title ? "titre « " + TITLES[r.title].name + " »" : ""].filter(Boolean).join(" + ");
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
    ["trivia", 3, "Lesquelles de ces voitures ont été construites en Groupe B ?", ["Peugeot 205 T16", "Lancia Delta S4", "Renault Clio Williams", "Citroën Saxo"], [0, 1], "Which of these cars were built for Group B?", ["Peugeot 205 T16", "Lancia Delta S4", "Renault Clio Williams", "Citroën Saxo"]]
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
    cat = QCATS[cat] ? cat : "brands"; level = Math.max(1, Math.min(3, level | 0 || 1));
    const rng = seeded("quiz|" + seed + "|" + cat + "|" + level), T = opt.t || ((s) => s), lang = opt.lang || "fr";
    const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; };
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];
    const cars = (list || []).filter((c) => c && c.name && c.brand).map((c) => Object.assign({}, c, { name: cleanName(c) })).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const mk = (q, opts, ans, k) => { const order = shuffle(opts.map((_, i) => i)); return { q, o: order.map((i) => opts[i]), a: order.indexOf(ans), k }; };
    const mkm = (q, opts, goods, k) => { const order = shuffle(opts.map((_, i) => i)); const m = goods.map((g) => order.indexOf(g)).sort((x, y) => x - y); return { q, o: order.map((i) => opts[i]), a: m[0], m, k }; };
    const distinct = (arr) => new Set(arr).size === arr.length;
    const gapOk = (vals, ratio) => { const s = vals.slice().sort((x, y) => y - x); return s[1] > 0 ? s[0] / s[1] >= ratio : s[0] > 0; };
    const RATIO = [0, 1.35, 1.12, 1.03][level];
    const four = (get, pred) => { for (let i = 0; i < 60; i++) { const c = []; for (let j = 0; j < 4; j++) c.push(pick(cars.filter(pred || (() => true)))); if (!distinct(c.map((x) => x.id)) || c.some((x) => !(get(x) > 0))) continue; if (!distinct(c.map(get))) continue; return c; } return null; };
    const fams = Array.from(new Set(cars.map((c) => familyOf(c.brand)))).filter((f) => cars.filter((c) => familyOf(c.brand) === f).length >= 2);
    const gens = {
      brands: [
        () => { const c = pick(cars), fam = familyOf(c.brand), pool = level >= 2 ? fams.filter((f) => f !== fam && countryOf(f) === countryOf(fam)) : fams.filter((f) => f !== fam); const w = shuffle(pool.length >= 3 ? pool : fams.filter((f) => f !== fam)).slice(0, 3); if (w.length < 3) return null; return mk(fmt(T("Quelle marque fabrique la {0} ?"), [modelOf(c)]), [fam].concat(w), 0, "brand-of"); },
        () => { const f = pick(fams.filter((x) => countryOf(x) !== "xx")); const ids = shuffle(COUNTRIES.filter((k) => k.id !== "xx").map((k) => k.id).filter((i) => i !== countryOf(f))).slice(0, 3); return mk(fmt(T("De quel pays vient la marque {0} ?"), [f]), [ctryLabel(countryOf(f))].concat(ids.map(ctryLabel)), 0, "brand-country"); },
        () => { const f = pick(fams), good = pick(cars.filter((c) => familyOf(c.brand) === f)); const others = shuffle(cars.filter((c) => familyOf(c.brand) !== f && (level < 3 || countryOf(c.brand) === countryOf(f)))).slice(0, 3); if (others.length < 3) return null; return mk(fmt(T("Laquelle de ces voitures est signée {0} ?"), [f]), [good.name].concat(others.map((c) => c.name)), 0, "which-brand"); }
      ],
      engines: [
        () => { const c = four((x) => x.power, (x) => x.power > 0); if (!c || !gapOk(c.map((x) => x.power), RATIO)) return null; const b = c.reduce((m, x) => (x.power > m.power ? x : m)); return mk(T("Laquelle est la plus puissante ?"), c.map((x) => x.name), c.indexOf(b), "most-power"); },
        () => { const c = four((x) => x.speed, (x) => x.speed > 0); if (!c || !gapOk(c.map((x) => x.speed), RATIO)) return null; const b = c.reduce((m, x) => (x.speed > m.speed ? x : m)); return mk(T("Laquelle atteint la vitesse maximale la plus élevée ?"), c.map((x) => x.name), c.indexOf(b), "top-speed"); },
        () => { const c = four((x) => x.zero, (x) => x.zero > 0); if (!c) return null; const z = c.map((x) => x.zero).sort((p, q) => p - q); if (!(z[1] / z[0] >= [0, 1.3, 1.1, 1.03][level])) return null; const b = c.reduce((m, x) => (x.zero < m.zero ? x : m)); return mk(T("Laquelle est la plus rapide de 0 à 100 km/h ?"), c.map((x) => x.name), c.indexOf(b), "fastest-zero"); },
        () => { const c = pick(cars.filter((x) => x.power > 0)), w = [0, 100, 50, 25][level], base = Math.floor(c.power / w) * w; const labs = [base]; [-1, 1, -2, 2, 3].forEach((d) => { if (labs.length < 4 && base + d * w >= 0) labs.push(base + d * w); }); if (labs.length < 4) return null; return mk(fmt(T("Environ combien de chevaux pour la {0} ?"), [c.name]), labs.map((l) => l + " – " + (l + w) + " ch"), 0, "power-range"); }
      ],
      history: [
        () => { const c = four((x) => x.year, (x) => x.year > 0); if (!c) return null; const ys = c.map((x) => x.year).sort((p, q) => p - q); if (ys[1] - ys[0] < [0, 25, 10, 3][level]) return null; const b = c.reduce((m, x) => (x.year < m.year ? x : m)); return mk(T("Laquelle est la plus ancienne ?"), c.map((x) => x.name), c.indexOf(b), "oldest"); },
        () => { const c = four((x) => x.year, (x) => x.year > 0); if (!c) return null; const ys = c.map((x) => x.year).sort((p, q) => q - p); if (ys[0] - ys[1] < [0, 25, 10, 3][level]) return null; const b = c.reduce((m, x) => (x.year > m.year ? x : m)); return mk(T("Laquelle est la plus récente ?"), c.map((x) => x.name), c.indexOf(b), "newest"); },
        () => { const c = pick(cars.filter((x) => x.year > 1900)), d = Math.floor(c.year / 10) * 10, ds = [d]; [-10, 10, -20, 20, 30, -30].forEach((k) => { if (ds.length < 4 && d + k >= 1900 && d + k <= 2020) ds.push(d + k); }); return mk(fmt(T("Dans quelle décennie est sortie la {0} ?"), [c.name]), ds.map((x) => fmt(T("années {0}"), [x])), 0, "decade"); }
      ],
      motorsport: [
        () => { const lm = cars.filter((c) => c.category === "Le Mans"), rest = cars.filter((c) => c.category !== "Le Mans" && String(c.id).indexOf("rally-") !== 0); if (!lm.length) return null; return mk(T("Laquelle de ces voitures a couru aux 24 Heures du Mans ?"), [pick(lm).name].concat(shuffle(rest).slice(0, 3).map((c) => c.name)), 0, "lemans"); },
        () => { const ra = cars.filter((c) => String(c.id).indexOf("rally-") === 0), rest = cars.filter((c) => String(c.id).indexOf("rally-") !== 0 && c.category !== "Le Mans"); if (!ra.length) return null; return mk(T("Laquelle de ces voitures est une voiture de rallye ?"), [pick(ra).name].concat(shuffle(rest).slice(0, 3).map((c) => c.name)), 0, "rally"); },
        () => { const sc = cars.filter((c) => c.category === "Supercar"), rest = cars.filter((c) => c.category === "Break" || c.category === "Berline"); if (!sc.length) return null; return mk(T("Laquelle de ces voitures est une supercar ?"), [pick(sc).name].concat(shuffle(rest).slice(0, 3).map((c) => c.name)), 0, "supercar"); }
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
    gens.countries = [gens.brands[1], gens.brands[0]]; gens.circuits = gens.motorsport; gens.numbers = gens.engines.concat(gens.history); gens.trivia = [];
    const g = gens[cat] || [];
    for (let tries = 0; tries < 400 && g.length && out.length < QUIZ_N && cars.length > 8; tries++) { let q = null; try { q = pick(g)(); } catch (e) { q = null; } add(q); }
    // complète avec des questions écrites restantes si le catalogue ne suffit pas
    for (let i = nWritten; i < wanted.length && out.length < QUIZ_N; i++) { const b = wanted[i], fr = lang === "fr"; add(mk(fr ? b[2] : b[4], fr ? b[3] : b[5], 0, "written")); }
    return shuffle(out).slice(0, QUIZ_N);
  }
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
    RAR, ORDER, SHOP_PACK, PACKS, COUNTRIES, countryOf, drawShopPack, isSpecial, computeRarities, pickRarity, drawPack, blankCollection, recount, picKey, picUrls, picKeys, picsHave, picReward,
    FUSE_COUNT, FUSE_NEXT, MARKET_FEE, MARKET_MAX_LISTINGS, marketBounds, marketNet, familyOf, seeded, PM_STATS, pmPair, pmWinner, PM_REWARDS, PM_DAILY_CAP, QCATS, QLEVELS, QUIZ_N, SEASON_LEN, SEASON_DAY_CAP, SEASON_FREE, seasonToday, legendOffer, epicPick, seasonInfo, PASS_TIERS, PASS_STEP, SEASON_PTS, FRAMES, TITLES, passReward, passLabel, SEASON_QUESTS, SEASON_QUEST_FINAL, blankSeason, seasonOf, seasonAdd, passTier, questState, FREEZE_MAX, FREEZE_COST, dayDiff, WELCOME, seasonCosm, QUIZ_REWARD, QUIZ_DAILY_CAP, QBANK, quizBuild, quizScore, setBrandsTotal,
    SHINY, CHALLENGES, DAILY, FEATURED, featuredItems, autoFeatured, weekChallenges, dailyChallenge, PERFECT_WEEK_BONUS, THEMES
  };
});
