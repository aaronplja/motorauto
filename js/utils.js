/**
 * MOTORAUTO — fonctions utilitaires pures (sans DOM, sans Firebase).
 * Chargé avant app.js ; testable sous Node (voir tests/utils.test.js).
 */
(function (root) {
  "use strict";

  const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2096%2096%22%3E%3Crect%20width%3D%2296%22%20height%3D%2296%22%20fill%3D%22%232a2e38%22%2F%3E%3Ccircle%20cx%3D%2248%22%20cy%3D%2237%22%20r%3D%2217%22%20fill%3D%22%236b7384%22%2F%3E%3Cpath%20d%3D%22M14%2096c2-22%2016-34%2034-34s32%2012%2034%2034z%22%20fill%3D%22%236b7384%22%2F%3E%3C%2Fsvg%3E";
  const FALLBACK_CAR = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80";

  /** Échappe une valeur pour l'insérer dans du HTML (texte ET attributs). */
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** N'autorise que http(s) (et data:image pour les anciens messages), sinon renvoie "". */
  function safeUrl(url, { allowData = false } = {}) {
    const u = String(url || "").trim();
    if (/^https?:\/\//i.test(u)) return u;
    if (/^img\/[\w./-]+$/i.test(u)) return u; // images locales du catalogue
    if (allowData && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(u)) return u;
    return "";
  }

  /** Minuscules + sans accents, pour la recherche. */
  function normalize(str) {
    return String(str == null ? "" : str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  // ---------------------------------------------------------------- chronos
  /**
   * Convertit "7:44.88" (M:SS.cc / M:SS.mmm) en millisecondes.
   * Retourne null si le format est invalide ou hors plage (10 s – 1 h).
   */
  function parseLapTime(input) {
    const m = String(input || "").trim().match(/^(\d{1,2}):([0-5]\d)(?:[.,](\d{1,3}))?$/);
    if (!m) return null;
    const minutes = parseInt(m[1], 10);
    const seconds = parseInt(m[2], 10);
    const frac = m[3] ? parseInt((m[3] + "00").slice(0, 3), 10) : 0;
    const ms = (minutes * 60 + seconds) * 1000 + frac;
    if (ms < 10000 || ms > 3600000) return null;
    return ms;
  }

  /** Millisecondes -> "M:SS.cc" (centièmes, comme sur les chronos de piste). */
  function formatLapTime(ms) {
    const total = Math.round(ms);
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const millis = total % 1000;
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  }

  /** Clé de regroupement d'un circuit : insensible à la casse/accents/espaces. */
  function trackKey(name) {
    return normalize(name).replace(/[^a-z0-9]+/g, " ").trim();
  }

  /** Millisecondes d'un tour, y compris pour les anciens documents sans chronoMs. */
  function lapMs(lap) {
    if (lap && typeof lap.chronoMs === "number") return lap.chronoMs;
    return parseLapTime(lap && lap.chrono);
  }

  /** Trie du plus rapide au plus lent ; les chronos illisibles vont en fin de liste. */
  function sortLaps(laps) {
    return laps.slice().sort((a, b) => {
      const ma = lapMs(a), mb = lapMs(b);
      if (ma == null && mb == null) return 0;
      if (ma == null) return 1;
      if (mb == null) return -1;
      return ma - mb;
    });
  }

  // --------------------------------------------------------------- véhicules
  function num(v, fallback = 0) {
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }

  /** Famille de marque : "Renault Sport" -> "Renault", "Nissan / Datsun" -> "Nissan". */
  function brandGroup(brand) {
    const first = String(brand || "").split(/[\s/&]+/).filter(Boolean)[0];
    return first || "Autre";
  }

  /** "1996 - 2003" -> [1996, 2003] ; "depuis 2015" / "2015 - présent" -> [2015, année courante] ; sinon null. */
  function yearRange(text) {
    const ys = (String(text || "").match(/\b(19|20)\d{2}\b/g) || []).map(Number);
    if (!ys.length) return null;
    const lo = Math.min(...ys);
    let hi = Math.max(...ys);
    if (/pr[ée]sent|aujourd|depuis|\+|actuel/i.test(String(text)) && ys.length === 1) hi = new Date().getFullYear();
    return [lo, hi];
  }

  /** Normalise un véhicule (données locales ou Firestore) et précalcule ses stats. */
  /** Clé d'un moteur : son code (« TU5JP4 ») s'il est renseigné ou entre parenthèses, sinon son nom normalisé. */
  function engineCode(e) {
    if (e && e.code) return String(e.code).trim();
    const m = String((e && e.name) || "").match(/\(([^()]{2,24})\)\s*$/);
    return m && /[0-9]/.test(m[1]) && /^[A-Za-z0-9 .\/+-]+$/.test(m[1]) ? m[1].trim() : "";
  }
  function engineKey(e) {
    const base = engineCode(e) || String((e && e.name) || "").replace(/\s*\([^)]*\)\s*$/, "");
    return normalize(base).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "moteur";
  }
  /** Index de tous les moteurs du catalogue : clé → { key, label, code, variants, cars:[{car, phase, engine}] } */
  function buildEngineIndex(cars) {
    const idx = new Map();
    (cars || []).forEach((car) => car.phases.forEach((ph) => ph.engines.forEach((e) => {
      const key = engineKey(e);
      let it = idx.get(key);
      if (!it) { it = { key, label: e.name, code: engineCode(e), variants: [], cars: [] }; idx.set(key, it); }
      if (!it.variants.some((v) => v.name === e.name && v.power === e.power)) it.variants.push(e);
      it.cars.push({ car, phase: ph, engine: e });
    })));
    return idx;
  }

  function normalizeCar(raw) {
    const car = Object.assign({}, raw);
    car.id = String(car.id || "");
    car.brand = String(car.brand || "");
    car.model = String(car.model || "");
    car.years = String(car.years || "");
    car.description = String(car.description || "");
    car.category = car.category || "Berline";
    car.image = car.image || "";
    {
      const seen = new Set();
      car.images = [car.image].concat(Array.isArray(car.images) ? car.images : [])
        .map((x) => String(x || "").trim())
        .filter((x) => safeUrl(x) && !seen.has(x) && seen.add(x))
        .slice(0, 12);
      if (!car.image && car.images[0]) car.image = car.images[0];
    }
    car.phases = (Array.isArray(car.phases) ? car.phases : []).map((p) => ({
      phaseName: String(p.phaseName || "Génération unique"),
      details: String(p.details || ""),
      notableEditions: Array.isArray(p.notableEditions) ? p.notableEditions : [],
      engines: (Array.isArray(p.engines) ? p.engines : []).map((e) => ({
        name: String(e.name || "Standard"),
        power: num(e.power),
        torque: num(e.torque),
        speed: num(e.speed),
        zeroToHundred: num(e.zeroToHundred),
        transmission: String(e.transmission || "—"),
        code: String(e.code || "").trim().slice(0, 40),
        info: String(e.info || "").trim().slice(0, 300)
      }))
    }));
    if (car.phases.length === 0) {
      car.phases = [{ phaseName: "Génération unique", details: "", notableEditions: [], engines: [] }];
    }
    car.records = Array.isArray(car.records) ? car.records : [];
    car.history = String(car.history || "").slice(0, 12000);
    car.anecdotes = (Array.isArray(car.anecdotes) ? car.anecdotes : []).map((a) => (typeof a === "string" ? { title: "", text: a } : { title: String((a && a.title) || ""), text: String((a && a.text) || "") })).filter((a) => a.text).slice(0, 40);
    car.archives = (Array.isArray(car.archives) ? car.archives : []).map((a) => ({ title: String((a && a.title) || "").slice(0, 120), url: String((a && a.url) || "").trim(), kind: String((a && a.kind) || "autre").slice(0, 20), year: String((a && a.year) || "").slice(0, 12) })).filter((a) => a.title && safeUrl(a.url)).slice(0, 60);
    car.related = (Array.isArray(car.related) ? car.related : []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 12);
    car.group = brandGroup(car.brand);

    const engines = car.phases.flatMap((p) => p.engines);
    const zeros = engines.map((e) => e.zeroToHundred).filter((z) => z > 0);
    car.stats = {
      power: engines.length ? Math.max(...engines.map((e) => e.power)) : 0,
      speed: engines.length ? Math.max(...engines.map((e) => e.speed)) : 0,
      zero: zeros.length ? Math.min(...zeros) : null,
      torque: engines.length ? Math.max(...engines.map((e) => e.torque)) : 0
    };
    car.yearRange = yearRange(car.years);

    // Texte de recherche précalculé (marque, modèle, années, moteurs, éditions…)
    car.searchBlob = normalize([
      car.brand, car.model, car.years, car.description, car.category,
      ...car.phases.flatMap((p) => [p.phaseName, p.details, ...p.notableEditions, ...p.engines.map((e) => e.name)]),
      ...car.records.map((r) => (r.type || "") + " " + (r.description || ""))
    ].join(" "));
    car.searchCompact = car.searchBlob.replace(/[^a-z0-9]+/g, "");
    car.searchTokens = Array.from(new Set(car.searchBlob.split(/[^a-z0-9]+/).filter((t) => t.length >= 3)));
    return car;
  }

  // surnoms courants → mot présent dans le catalogue
  const ALIASES = { vw: "volkswagen", merco: "mercedes", mercedez: "mercedes", benz: "mercedes", bm: "bmw", peugot: "peugeot", pigeot: "peugeot", citroen: "citroen", citron: "citroen", renaud: "renault", rino: "renault", alpin: "alpine", porshe: "porsche", ferari: "ferrari", lambo: "lamborghini", skyline: "skyline", mini: "mini" };

  /** distance d'édition bornée (insertion, suppression, remplacement, échange de deux lettres) ; renvoie > max dès qu'on dépasse */
  function editDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v; if (v < rowMin) rowMin = v;
      }
      if (rowMin > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[b.length];
  }

  /** Recherche multi-mots, sans accents, tolérante : tous les mots doivent être trouvés, tels quels, collés (« golf7 »),
   *  avec un surnom (« vw ») ou avec une faute de frappe (« peugot », « renaut »). */
  function matchesQuery(car, query) {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return words.every((w0) => {
      const w = ALIASES[w0] || w0;
      if (car.searchBlob.includes(w)) return true;
      const compact = w.replace(/[^a-z0-9]+/g, "");
      if (compact && car.searchCompact && car.searchCompact.includes(compact)) return true;
      if (w.length < 4 || !car.searchTokens) return false;
      const max = w.length >= 9 ? 2 : 1;
      return car.searchTokens.some((t) => t.length >= 3 && (t.startsWith(w) || editDistance(t, w, max) <= max));
    });
  }

  /** Traduit les codes d'erreur Firebase Auth en français. */
  function authErrorMessage(err) {
    const map = {
      "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
      "auth/wrong-password": "E-mail ou mot de passe incorrect.",
      "auth/user-not-found": "E-mail ou mot de passe incorrect.",
      "auth/invalid-email": "Adresse e-mail invalide.",
      "auth/email-already-in-use": "Cette adresse e-mail est déjà utilisée.",
      "auth/weak-password": "Mot de passe trop faible (6 caractères minimum).",
      "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
      "auth/network-request-failed": "Problème de connexion réseau.",
      "auth/popup-closed-by-user": "Fenêtre de connexion fermée.",
      "auth/popup-blocked": "Le navigateur a bloqué la fenêtre de connexion Google."
    };
    return (err && map[err.code]) || "Une erreur est survenue. Réessayez.";
  }


  // ------------------------------------------------ catégories (classement)
  // Transmission : table d'exceptions par identifiant ; sinon traction (cas majoritaire du catalogue).
  const DRIVE_4X4 = /^(nissan-skyline-gtr-r(32|33|34)|nissan-gt-r-r35|toyota-celica-st185-st205|ford-escort-rs-cosworth|ford-rs200|ford-focus-rs-mk3|peugeot-206-wrc|peugeot-205-t16|citroen-xsara-wrc|peugeot-207-s2000)/;
  const DRIVE_RWD = /^(mazda-mx5|fiat-1000tipla|nissan-(s30|s130|z31|z32|350z|370z|z-rz34|skyline-gtr-classic|silvia|onevia|sileighty)|toyota-(celica-supra|supra|mr2|mrs|celica-classic)|ford-sierra-rs-cosworth|renault-clio-v6|renault-spider)/;
  const TURBO_RE = /turbo|compresseur|kompressor|ecoboost|tfsi|\btsi\b|\d\.\dt\b|\bthp\b|\bg60\b/i;

  /** "Traction" | "Propulsion" | "4x4" (champ car.drive prioritaire s'il est renseigné). */
  function driveOf(car) {
    const forced = car && String(car.drive || "").toLowerCase();
    if (forced === "traction") return "Traction";
    if (forced === "propulsion") return "Propulsion";
    if (forced === "4x4") return "4x4";
    const id = String((car && car.id) || "");
    if (DRIVE_4X4.test(id)) return "4x4";
    if (DRIVE_RWD.test(id)) return "Propulsion";
    return "Traction";
  }
  /** Vrai si au moins une motorisation est turbo / compressée. */
  function isTurbo(car) {
    if (!car || !Array.isArray(car.phases)) return false;
    return car.phases.some((p) => (p.engines || []).some((e) => TURBO_RE.test(String(e.name || ""))));
  }
  /** Le véhicule appartient-il à la catégorie de classement `cat` ? ("all" = oui) */
  function inCategory(car, cat) {
    if (!cat || cat === "all") return true;
    if (!car) return false;
    switch (cat) {
      case "traction": return driveOf(car) === "Traction";
      case "propulsion": return driveOf(car) === "Propulsion";
      case "4x4": return driveOf(car) === "4x4";
      case "turbo": return isTurbo(car);
      case "atmo": return !isTurbo(car);
      default: return String(car.category || "").toLowerCase() === cat; // berline, coupé, break, supercar
    }
  }

  // ------------------------------------------------------------ import / export CSV
  const CSV_COLUMNS = ["id", "brand", "model", "years", "category", "image", "description", "records", "phase", "phase_details", "editions", "engine", "power", "torque", "speed", "zero", "transmission"];
  const CATEGORIES = ["Berline", "Coupé", "Break", "Supercar", "Le Mans"];

  /** Analyse un CSV (séparateur , ou ; détecté, guillemets "" gérés, retours à la ligne dans les champs). */
  function parseCSV(text) {
    let s = String(text || "").replace(/^\uFEFF/, "");
    const first = s.split(/\r?\n/, 1)[0] || "";
    const cnt = (c) => (first.match(new RegExp(c === "\t" ? "\t" : "\\" + c, "g")) || []).length;
    const delim = cnt("\t") > Math.max(cnt(";"), cnt(",")) ? "\t" : cnt(";") >= cnt(",") ? ";" : ",";
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) {
        if (ch === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cur); cur = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && s[i + 1] === "\n") i++;
        row.push(cur); cur = "";
        if (row.some((c) => c.trim() !== "")) rows.push(row);
        row = [];
      } else cur += ch;
    }
    row.push(cur);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    return rows;
  }

  function slugify(str) {
    return normalize(str).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function parseCategory(v) {
    const n = normalize(v);
    if (/le ?mans|endurance/.test(n)) return "Le Mans";
    if (/coupe|sport|gt/.test(n)) return "Coupé";
    if (/break|sw|touring|estate|wagon/.test(n)) return "Break";
    if (/super/.test(n)) return "Supercar";
    return "Berline";
  }

  /**
   * CSV -> { cars, errors, warnings }. Une ligne = un moteur ; les lignes de même `id`
   * (ou même marque+modèle) sont regroupées en un seul véhicule, puis en phases.
   */
  function csvToCars(text) {
    const rows = parseCSV(text);
    const errors = [], warnings = [];
    if (rows.length < 2) return { cars: [], errors: ["Fichier vide ou sans ligne de données."], warnings };
    const head = rows[0].map((h) => normalize(h).trim().replace(/[^a-z0-9_]+/g, "_"));
    const alias = { marque: "brand", modele: "model", annees: "years", annee: "years", categorie: "category", carrosserie: "category", moteur: "engine", puissance: "power", couple: "torque", vitesse: "speed", vmax: "speed", v_max: "speed", zero_cent: "zero", zero_a_cent: "zero", "0_100": "zero", transmission: "transmission", phase_nom: "phase", generation: "phase", detail_phase: "phase_details", editions_notables: "editions", records: "records", anecdotes: "records", image: "image", photo: "image", description: "description" };
    const idx = {};
    head.forEach((h, i) => { const k = CSV_COLUMNS.includes(h) ? h : alias[h]; if (k && !(k in idx)) idx[k] = i; });
    ["brand", "model", "engine", "power", "speed", "zero"].forEach((k) => { if (!(k in idx)) errors.push(`Colonne obligatoire absente : « ${k} ».`); });
    if (errors.length) return { cars: [], errors, warnings };
    const get = (r, k) => (k in idx && r[idx[k]] != null ? String(r[idx[k]]).trim() : "");
    const nb = (v) => { const n = parseFloat(String(v).replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n : NaN; };
    const map = new Map();
    rows.slice(1).forEach((r, ri) => {
      const line = ri + 2;
      const brand = get(r, "brand"), model = get(r, "model");
      if (!brand && !model && !get(r, "id")) return;
      const id = (get(r, "id") || slugify(brand + " " + model)).toLowerCase();
      if (!/^[a-z0-9][a-z0-9-]{2,60}$/.test(id)) { errors.push(`Ligne ${line} : identifiant « ${id} » invalide (minuscules, chiffres, tirets ; 3 à 61 caractères).`); return; }
      let car = map.get(id);
      if (!car) {
        car = { id, brand, model, years: get(r, "years"), category: parseCategory(get(r, "category")), image: get(r, "image"), description: get(r, "description"), records: [], phases: [], _phases: new Map() };
        map.set(id, car);
      }
      // champs « véhicule » : la première valeur non vide l'emporte
      ["years", "image", "description"].forEach((k) => { if (!car[k]) car[k] = get(r, k); });
      if (!car.brand) car.brand = brand; if (!car.model) car.model = model;
      const rec = get(r, "records");
      if (rec) rec.split("||").map((x) => x.trim()).filter(Boolean).forEach((x) => {
        const [t, ...d] = x.split("|"); const item = { type: t.trim(), description: d.join("|").trim() };
        if (!car.records.some((o) => o.type === item.type && o.description === item.description)) car.records.push(item);
      });
      const e = { name: get(r, "engine"), power: nb(get(r, "power")), torque: nb(get(r, "torque")) || 0, speed: nb(get(r, "speed")), zeroToHundred: nb(get(r, "zero")), transmission: get(r, "transmission") || "Manuelle" };
      if (!e.name || !(e.power > 0) || !(e.speed > 0) || !(e.zeroToHundred > 0)) { errors.push(`Ligne ${line} (${id}) : moteur, puissance, V-max et 0-100 doivent être renseignés (nombres > 0).`); return; }
      const pn = get(r, "phase") || "Génération unique";
      if (!car._phases.has(pn)) car._phases.set(pn, { phaseName: pn, details: "", notableEditions: [], engines: [] });
      const ph = car._phases.get(pn);
      if (!ph.details) ph.details = get(r, "phase_details");
      get(r, "editions").split("||").map((x) => x.trim()).filter(Boolean).forEach((x) => { if (!ph.notableEditions.includes(x)) ph.notableEditions.push(x); });
      ph.engines.push(e);
    });
    const cars = [];
    map.forEach((car) => {
      car.phases = Array.from(car._phases.values()); delete car._phases;
      if (!car.phases.length) return;
      if (!car.years) warnings.push(`${car.id} : années manquantes.`);
      if (!/^https?:\/\//i.test(car.image)) { warnings.push(`${car.id} : image absente ou invalide (https:// requis).`); }
      if (!car.records.length) car.records = [{ type: "Homologation", description: "Enregistré par l'administrateur." }];
      cars.push(car);
    });
    return { cars, errors, warnings };
  }

  function csvCell(v, delim) {
    const s = String(v == null ? "" : v);
    return new RegExp('["\\n\\r' + delim + ']').test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  /** Véhicules -> CSV (une ligne par moteur), au format relisible par csvToCars. */
  function carsToCsv(cars, delim) {
    delim = delim || ";";
    const lines = [CSV_COLUMNS.join(delim)];
    cars.forEach((c) => {
      const recs = (c.records || []).map((r) => (r.type || "") + "|" + (r.description || "")).join("||");
      let first = true;
      (c.phases || []).forEach((p) => (p.engines || []).forEach((e) => {
        const row = [c.id, c.brand, c.model, c.years, c.category, c.image, first ? c.description : "", first ? recs : "", p.phaseName, p.details || "", (p.notableEditions || []).join("||"), e.name, e.power, e.torque, e.speed, e.zeroToHundred, e.transmission];
        lines.push(row.map((v) => csvCell(v, delim)).join(delim));
        first = false;
      }));
    });
    return lines.join("\r\n");
  }

  const api = {
    FALLBACK_AVATAR, FALLBACK_CAR,
    esc, safeUrl, normalize,
    parseLapTime, formatLapTime, trackKey, lapMs, sortLaps,
    num, brandGroup, normalizeCar, engineKey, engineCode, buildEngineIndex, matchesQuery, authErrorMessage,
    driveOf, isTurbo, inCategory, yearRange,
    parseCSV, csvToCars, carsToCsv, slugify, parseCategory, CSV_COLUMNS
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MA = api;
})(typeof window !== "undefined" ? window : globalThis);
