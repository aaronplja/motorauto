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
    { n: 1, name: "Débutant", xp: 0 }, { n: 2, name: "Apprenti", xp: 30 }, { n: 3, name: "Pilote", xp: 80 }, { n: 4, name: "Confirmé", xp: 170 },
    { n: 5, name: "Expert", xp: 300 }, { n: 6, name: "Élite", xp: 480 }, { n: 7, name: "Maître", xp: 750 }, { n: 8, name: "Champion", xp: 1100 },
    { n: 9, name: "Légende", xp: 1600 }, { n: 10, name: "Mythique", xp: 2400 }
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
  const BLANK_STATS = () => ({ laps: 0, tracks: 0, records: 0, podiums: 0, comments: 0, likes: 0, cars: 0, events: 0, rsvps: 0, days: 0, best: 0, last: "", cards: 0, specials: 0, trades: 0, chal: 0, entries: 0, wins: 0 });

  /** calcule xp, niveau et badges à partir des compteurs d'un pilote */
  function finish(s, total) {
    if (total) TOTAL = Math.max(1, total | 0);
    s.tracks = s.tracks instanceof Set ? s.tracks.size : s.tracks;
    const base = s.laps * 15 + s.records * 50 + s.podiums * 20 + s.comments * 4 + s.likes + s.cars * 25 + s.events * 20 + s.rsvps * 4 + s.best * 3 + s.cards * 2
      + s.trades * 8 + s.chal * 6 + s.entries * 10 + s.wins * 150 + s.specials * 30;
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
    special: { id: "special", label: "Édition limitée", dust: 150, craft: 0, odds: 0 }
  };
  const ORDER = ["shiny", "legendary", "epic", "rare", "common"];          // raretés tirables, de la plus haute à la plus basse
  const isSpecial = (id) => String(id).indexOf("sp-") === 0;
  /** puissance « de classement » : les voitures de course du Mans (identifiants lm-…) pèsent 60 % de leur puissance, pour ne pas écraser les voitures de route */
  const rankPower = (c) => (String(c.id).indexOf("lm-") === 0 ? c.power * 0.6 : c.power);
  /** cartes « Shiny » (arc-en-ciel, ≈ 0,5 % par carte tirée) : voitures mythiques choisies à la main */
  const SHINY = ["peugeot-205-t16", "peugeot-206-wrc", "nissan-skyline-gtr-r34", "nissan-gt-r-r35", "toyota-supra-a80-mk4", "ford-rs200", "ford-escort-rs-cosworth-t35", "audi-r8-v10", "honda-civic-ek9-type-r",
    "lm-ford-gt40", "lm-porsche-917k", "lm-porsche-956", "lm-porsche-962c", "lm-mazda-787b", "lm-mclaren-f1-gtr", "lm-porsche-919"];
  /** rareté de chaque voiture selon son rang de puissance (égalités départagées par l'identifiant : même résultat partout) */
  function computeRarities(list) {
    const sorted = list.slice().sort((a, b) => (rankPower(b) - rankPower(a)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const map = new Map();
    sorted.forEach((c, i) => {
      const p = i / Math.max(1, sorted.length - 1);
      map.set(c.id, SHINY.indexOf(c.id) >= 0 ? "shiny" : p < 0.06 || rankPower(c) >= 500 ? "legendary" : p < 0.2 ? "epic" : p < 0.5 ? "rare" : "common");
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
  /** tire un pack de 3 cartes ; tous les 10 packs, une carte au moins « rare » est garantie */
  function drawPack(rarities, ids, rng, pity) {
    const by = {}; ORDER.forEach((r) => { by[r] = []; });
    ids.forEach((id) => { const r = rarities.get(id); if (by[r]) by[r].push(id); });
    const pick = (r) => { const list = by[r].length ? by[r] : (r === "shiny" && by.legendary.length ? by.legendary : ids); return list[Math.floor(rng() * list.length)]; };
    const out = [];
    for (let i = 0; i < 3; i++) out.push(pick(pickRarity(rng, pity && i === 2 ? "rare" : null)));
    if (pity && !out.some((id) => rarities.get(id) !== "common")) out[2] = pick("rare");
    return out;
  }
  const blankCollection = () => ({ owned: {}, count: 0, specials: 0, dust: 0, lastPack: "", bonus: 1, claimed: [], opened: 0, trades: 0, chal: 0 });
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
  const PERFECT_WEEK_BONUS = 1;
  const THEMES = ["Ma voiture au lever du soleil", "Détail mécanique", "Mon garage", "Route de rêve", "Voiture en mouvement", "Noir & blanc", "Mon plus beau reflet", "Sortie entre pilotes", "Voiture sous la pluie", "Intérieur et cockpit", "Avant / après", "Ma voiture de collection"];

  return {
    TZ, dayKey, monthKey, weekKey, weekStart, weekEnd, parisMidnight, monthLabel,
    LEVELS, levelOf, BADGES, goalOf, BLANK_STATS, finish,
    RAR, ORDER, isSpecial, computeRarities, pickRarity, drawPack, blankCollection, recount,
    SHINY, CHALLENGES, DAILY, weekChallenges, dailyChallenge, PERFECT_WEEK_BONUS, THEMES
  };
});
