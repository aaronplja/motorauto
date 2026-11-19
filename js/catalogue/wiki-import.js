/**
 * MOTORAUTO — import d'un véhicule depuis une page Wikipédia.
 * parseArticle() est pur (HTML -> brouillon de fiche) ; fetchArticle() interroge l'API publique de Wikipédia (CORS ouvert).
 * Le résultat est toujours un BROUILLON relu par l'administrateur avant publication.
 */
(function (root) {
  "use strict";
  const MA = root.MA;

  const clean = (s) => String(s || "").replace(/\[[^\]]{0,12}\]/g, "").replace(/[   ]/g, " ").replace(/\s+/g, " ").trim();
  const text = (el) => clean(el ? el.textContent : "");
  const norm = (s) => MA.normalize(s);
  const cut = (s, n) => { s = clean(s); if (s.length <= n) return s; const c = s.slice(0, n); const i = Math.max(c.lastIndexOf(". "), c.lastIndexOf("; ")); return (i > n * 0.5 ? c.slice(0, i + 1) : c.replace(/\s+\S*$/, "") + "…"); };
  const num = (s) => parseFloat(String(s).replace(/\s/g, "").replace(",", "."));

  // ----------------------------------------------------------- lecture de valeurs
  function readPower(s) {
    s = clean(s);
    let m = s.match(/(\d[\d ]*)\s*(?:ch|cv|hp|bhp|ps)\b/i);
    if (m) return Math.round(num(m[1]));
    m = s.match(/(\d[\d ]*)\s*kW/i);
    if (m) return Math.round(num(m[1]) * 1.36);
    return NaN;
  }
  function readTorque(s) { const m = clean(s).match(/(\d[\d ]*(?:[.,]\d+)?)\s*N\.?\s?m\b/i); return m ? Math.round(num(m[1])) : NaN; }
  function readSpeed(s) { const m = clean(s).match(/(\d{3})\s*km\s?\/\s?h/i) || clean(s).match(/^(\d{3})$/); return m ? num(m[1]) : NaN; }
  function readZero(s) { const m = clean(s).match(/(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:s\b|sec)/i) || clean(s).match(/^(\d{1,2}[.,]\d{1,2})$/); return m ? num(m[1]) : NaN; }

  function readYears(s) {
    s = clean(s);
    const ys = (s.match(/\b(?:19|20)\d{2}\b/g) || []).map(Number);
    if (!ys.length) return "";
    const open = /pr[ée]sent|aujourd|en cours|depuis|toujours|present|current/i.test(s);
    const lo = Math.min(...ys), hi = Math.max(...ys);
    if (ys.length === 1) return open ? `${lo} - présent` : String(lo);
    return `${lo} - ${open && hi === lo ? "présent" : hi}`;
  }

  function readCategory(s) {
    const n = norm(s);
    if (/supercar|supersport|hypercar/.test(n)) return "Supercar";
    if (/coupe|sport|gt\b|roadster|cabriolet|berlinette|rallye|rally/.test(n)) return "Coupé";
    if (/break|\bsw\b|touring|estate|wagon|familiale/.test(n)) return "Break";
    return "Berline";
  }

  // ----------------------------------------------------------------- infobox
  const L = {
    brand: /^(marque|constructeur|manufacturer|make)/,
    years: /(production|ann[ée]es?|p[ée]riode|assembly)/,
    category: /^(classe|carrosserie|type|segment|body|class)/,
    engine: /^(moteur|motorisation|engine)/,
    power: /(puissance|power)/,
    torque: /(couple|torque)/,
    speed: /(vitesse|top speed)/,
    zero: /(acc[ée]l|0 ?(?:a|à|-) ?100|0.100)/,
    trans: /(transmission|boite|bo[iî]te|gearbox)/
  };
  function readInfobox(doc, generic) {
    const out = {};
    const box = doc.querySelector("table.infobox_v3, table.infobox, .infobox");
    const take = (labelRaw, valRaw) => {
      const label = norm(labelRaw), val = valRaw;
      if (!val || label.length > 40 || val.length > 220) return;
      Object.keys(L).forEach((k) => { if (!(k in out) && L[k].test(label)) out[k] = val; });
    };
    if (box) box.querySelectorAll("tr").forEach((tr) => {
      const th = tr.querySelector("th"), td = tr.querySelector("td");
      if (th && td) take(text(th), text(td));
    });
    if (generic) { // fiches « caractéristiques » de sites quelconques : tableaux à 2 colonnes et listes de définitions
      doc.querySelectorAll("tr").forEach((tr) => { const c = tr.children; if (c.length === 2) take(text(c[0]), text(c[1])); });
      doc.querySelectorAll("dt").forEach((dt) => { const dd = dt.nextElementSibling; if (dd && dd.tagName === "DD") take(text(dt), text(dd)); });
      doc.querySelectorAll("li").forEach((li) => { const m = text(li).match(/^([^:]{3,32}):\s*(.{1,200})$/); if (m) take(m[1], m[2]); });
    }
    return { out, box };
  }

  // ------------------------------------------------------------ tables moteurs
  function readEngineTable(table) {
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length < 2) return [];
    const headRow = rows.find((r) => r.querySelector("th"));
    if (!headRow) return [];
    const heads = Array.from(headRow.children).map((c) => norm(text(c)));
    const find = (re) => heads.findIndex((h) => re.test(h));
    const col = {
      name: find(/moteur|motorisation|version|modele|type|engine|nom/),
      power: find(/puissance|\bch\b|\bcv\b|\bkw\b|power|\bhp\b/),
      torque: find(/couple|torque/),
      speed: find(/vitesse|v\.? ?max|top speed/),
      zero: find(/0 ?(?:a|à|-|→)? ?100|accel|1000 ?m/),
      trans: find(/transmission|boite|gearbox/),
      years: find(/annee|periode|production/)
    };
    if (col.power < 0) return [];
    const engines = [];
    rows.slice(rows.indexOf(headRow) + 1).forEach((r) => {
      const cells = Array.from(r.children).map(text);
      if (cells.length < 2) return;
      const power = readPower(cells[col.power] || "") || NaN;
      const p = Number.isFinite(power) ? power : (/^\d{2,4}$/.test(cells[col.power] || "") ? num(cells[col.power]) : NaN);
      if (!(p > 0)) return;
      engines.push({
        name: (col.name >= 0 ? cells[col.name] : cells[0]) || "Moteur",
        power: p,
        torque: col.torque >= 0 ? (readTorque(cells[col.torque]) || num(cells[col.torque]) || 0) : 0,
        speed: col.speed >= 0 ? (readSpeed(cells[col.speed]) || 0) : 0,
        zeroToHundred: col.zero >= 0 ? (readZero(cells[col.zero]) || 0) : 0,
        transmission: (col.trans >= 0 && cells[col.trans]) || ""
      });
    });
    return engines;
  }

  // ----------------------------------------------------------------- article
  const SKIP = /(notes?|r[ée]f[ée]rences?|voir aussi|liens? externes?|bibliographie|sources?|articles? connexes?|galerie|annexes?)/;
  const GENERIC = /^(motorisations?|moteurs?|caract[ée]ristiques?( techniques?)?|fiche technique|techniques?|gamme|versions?|mod[èe]les?)$/;
  const REC_RE = /(comp[ée]tition|sport automobile|rallye|rally|records?|palmar[èe]s|anecdotes?|culture populaire|cin[ée]ma|jeux? vid[ée]o|chrono|n[uü]rburgring|circuit|course)/;
  const EDITION_RE = /(s[ée]ries? (sp[ée]ciales?|limit[ée]es?)|[ée]ditions?|versions? sp[ée]ciales?|finitions?)/;

  /**
   * @param html     HTML renvoyé par action=parse (contenu de l'article)
   * @param meta     { title, url, image, lang }
   * @returns { car, notes[] }
   */
  function parseArticle(html, meta) {
    meta = meta || {};
    const doc = new DOMParser().parseFromString(html, "text/html");
    const notes = [];
    if (meta.generic) doc.querySelectorAll("script, style, nav, footer, aside, noscript, form, iframe, svg, button, select").forEach((n) => n.remove());
    const { out: info, box } = readInfobox(doc, !!meta.generic);
    const title = clean((meta.title || "").replace(/\s*\([^)]*\)\s*$/, ""));
    const root0 = doc.querySelector(".mw-parser-output") || (meta.generic && doc.querySelector("main, article")) || doc.body;

    // sections : on parcourt l'article dans l'ordre du document
    const sections = [{ level: 1, title: "", paras: [], items: [], tables: [] }];
    let cur = sections[0];
    root0.querySelectorAll(meta.generic ? "h2, h3, h4, p, ul, table" : "h2, h3, h4, p, ul, table.wikitable").forEach((el) => {
      if (box && box.contains(el)) return;
      if (el.tagName === "TABLE" && el.querySelector("table")) return;
      if (el.tagName !== "TABLE" && el.closest("table")) return; // texte d'un tableau / bandeau
      const t = el.tagName;
      if (/^H[234]$/.test(t)) {
        cur = { level: +t[1], title: text(el).replace(/\s*\[modifier.*$/i, ""), paras: [], items: [], tables: [] };
        sections.push(cur);
      } else if (t === "P") { const x = text(el); if (x.length > (meta.generic ? 70 : 40)) cur.paras.push(x); }
      else if (t === "UL") { if (!el.closest("li") && !el.closest("#toc, .toc, .navbox, .reflist")) Array.from(el.children).forEach((li) => { const x = text(li); if (x.length > 8 && x.length < 400) cur.items.push(x); }); }
      else if (t === "TABLE") cur.tables.push(el);
    });
    const live = sections.filter((s) => !SKIP.test(norm(s.title)));

    // identité
    let brand = clean((info.brand || "").split(/[,/(]/)[0]);
    let model = title;
    if (brand && norm(title).startsWith(norm(brand))) model = clean(title.slice(brand.length));
    else if (!brand && meta.knownBrands) {
      const kb = meta.knownBrands.filter((k) => norm(title).startsWith(norm(k))).sort((x, y) => y.length - x.length)[0];
      if (kb) { brand = kb; model = clean(title.slice(kb.length)); }
    }
    if (!brand) { const w = title.split(" "); brand = w[0] || ""; model = w.slice(1).join(" ") || title; }
    if (!model) model = title;
    let years = readYears(info.years || "");
    const lead = sections[0].paras;
    if (!years && lead[0]) years = readYears((lead[0].match(/\(([^)]*(?:19|20)\d{2}[^)]*)\)/) || [])[1] || "");
    if (!years) notes.push("Années de production non trouvées : à compléter.");
    const category = readCategory((info.category || "") + " " + (lead[0] || "").slice(0, 200));

    // description : intro de l'article
    let description = cut(lead.slice(0, 2).join(" "), 650);
    if (!description) notes.push("Pas de texte d'introduction trouvé.");

    // phases + moteurs depuis les tableaux
    const phases = [];
    const addPhase = (name, details) => { let p = phases.find((x) => x.phaseName === name); if (!p) { p = { phaseName: name, details: "", notableEditions: [], engines: [] }; phases.push(p); } if (details && !p.details) p.details = details; return p; };
    let lastNamed = "";
    live.forEach((s) => {
      const nm = norm(s.title);
      if (s.title && !GENERIC.test(nm)) lastNamed = s.title;
      s.tables.forEach((tb) => {
        const engs = readEngineTable(tb);
        if (!engs.length) return;
        const phaseName = (s.title && !GENERIC.test(nm)) ? s.title : (lastNamed && !GENERIC.test(norm(lastNamed)) && s.level > 2 ? lastNamed : "Génération unique");
        const ph = addPhase(phaseName.slice(0, 60), s.paras[0] ? cut(s.paras[0], 320) : "");
        engs.forEach((e) => ph.engines.push(e));
      });
    });
    // versions décrites par une section « phase / génération » sans tableau
    live.forEach((s) => {
      if (/(phase|g[ée]n[ée]ration|restyl|mk ?\d|s[ée]rie ?\d)/.test(norm(s.title)) && s.paras[0]) {
        const p = phases.find((x) => x.phaseName === s.title);
        if (p && !p.details) p.details = cut(s.paras[0], 320);
      }
    });
    // éditions spéciales
    const editions = [];
    live.forEach((s) => { if (EDITION_RE.test(norm(s.title))) s.items.slice(0, 8).forEach((x) => editions.push(cut(x.split(/\s[:–—-]\s/)[0], 80))); });
    if (editions.length && phases.length) phases[0].notableEditions = editions.slice(0, 8);

    // repli : une motorisation depuis l'infobox
    if (!phases.some((p) => p.engines.length)) {
      const e = {
        name: clean((info.engine || title).slice(0, 80)),
        power: readPower(info.power || "") || 0, torque: readTorque(info.torque || "") || 0,
        speed: readSpeed(info.speed || "") || 0, zeroToHundred: readZero(info.zero || "") || 0,
        transmission: clean((info.trans || "").slice(0, 40))
      };
      if (meta.generic && !e.power) { // dernier recours : chiffres repérés dans le texte de la page
        const body = clean(root0.textContent).slice(0, 40000);
        const pw = Array.from(body.matchAll(/(\d{2,4})\s*(?:ch|cv|hp|bhp|ps)\b/gi)).map((m) => +m[1]).filter((v) => v >= 40 && v <= 1800);
        const tq = Array.from(body.matchAll(/(\d{2,4})\s*N\.?\s?m\b/gi)).map((m) => +m[1]).filter((v) => v >= 50 && v <= 1500);
        const sp = Array.from(body.matchAll(/(\d{3})\s*km\s?\/\s?h/gi)).map((m) => +m[1]).filter((v) => v >= 120 && v <= 450);
        const z = Array.from(body.matchAll(/(?:0\s*(?:à|a|-|to|–)\s*100[^0-9]{0,25})(\d{1,2}[.,]\d{1,2})/gi)).map((m) => num(m[1]));
        if (pw.length) e.power = Math.max(...pw.slice(0, 6));
        if (tq.length) e.torque = Math.max(...tq.slice(0, 6));
        if (sp.length) e.speed = Math.max(...sp.slice(0, 6));
        if (z.length) e.zeroToHundred = Math.min(...z.slice(0, 6));
        if (e.power) notes.push("Chiffres repérés dans le texte de la page : à vérifier un par un.");
      }
      phases.length = 0;
      addPhase("Génération unique", "").engines.push(e);
      notes.push(e.power ? "Aucun tableau de motorisations : une seule motorisation lue dans l'encadré." : "Aucune motorisation détectée : à saisir à la main.");
    }
    let missing = 0;
    phases.forEach((p) => p.engines.forEach((e) => { if (!(e.speed > 0) || !(e.zeroToHundred > 0) || !(e.power > 0)) missing++; if (!e.transmission) e.transmission = clean(info.trans || "Manuelle").slice(0, 40) || "Manuelle"; }));
    if (missing) notes.push(`${missing} motorisation(s) sans V-max ou 0-100 : à compléter avant de publier.`);

    // records & anecdotes
    const records = [];
    live.forEach((s) => {
      if (records.length >= 6) return;
      if (REC_RE.test(norm(s.title)) && s.paras[0]) records.push({ type: s.title.slice(0, 40), description: cut(s.paras[0], 300) });
    });
    const url = meta.url || (meta.lang && meta.title ? `https://${meta.lang}.wikipedia.org/wiki/${encodeURIComponent(meta.title.replace(/ /g, "_"))}` : "");
    records.push({ type: "Source", description: `Texte adapté de Wikipédia (CC BY-SA)${url ? " — " + url : ""}` });

    let image = meta.image || "";
    if (!image && box) { const im = box.querySelector("img"); if (im) { image = im.getAttribute("src") || ""; if (image.startsWith("//")) image = "https:" + image; } }
    if (!/^https?:\/\//i.test(image)) { image = ""; notes.push("Image non trouvée : ajoute une URL."); }
    else notes.push(/wikimedia|wikipedia/i.test(image) ? "Image issue de Wikimédia Commons : vérifie sa licence avant publication." : "Image reprise de la page source : vérifie que tu as le droit de l'utiliser (sinon remplace-la).");

    return {
      car: { id: MA.slugify(title), brand, model, years, category, image, description, records, phases },
      notes
    };
  }

  // --------------------------------------------------------------- réseau
  function parseInput(v) {
    v = String(v || "").trim();
    const m = v.match(/^https?:\/\/([a-z-]{2,12})\.(?:m\.)?wikipedia\.org\/wiki\/([^#?]+)/i);
    if (m) return { lang: m[1].toLowerCase(), title: decodeURIComponent(m[2]).replace(/_/g, " ") };
    if (/^https?:\/\//i.test(v)) return null;
    return v ? { lang: "fr", title: v } : null;
  }

  async function fetchArticle(input) {
    const ref = parseInput(input);
    if (!ref) throw new Error("Colle une adresse de page Wikipédia (https://fr.wikipedia.org/wiki/…) ou un titre d'article.");
    const base = `https://${ref.lang}.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*&redirects=1`;
    const [p, q] = await Promise.all([
      fetch(`${base}&action=parse&prop=text&disableeditsection=1&page=${encodeURIComponent(ref.title)}`).then((r) => r.json()),
      fetch(`${base}&action=query&prop=pageimages&piprop=thumbnail&pithumbsize=1200&titles=${encodeURIComponent(ref.title)}`).then((r) => r.json()).catch(() => ({}))
    ]);
    if (p.error) throw new Error(p.error.code === "missingtitle" ? "Page introuvable sur Wikipédia." : "Wikipédia : " + (p.error.info || p.error.code));
    const page = q.query && q.query.pages && q.query.pages[0];
    const title = (p.parse && p.parse.title) || ref.title;
    return parseArticle(p.parse.text, {
      title, lang: ref.lang,
      url: `https://${ref.lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      image: page && page.thumbnail ? page.thumbnail.source : ""
    });
  }

  root.MAWiki = { parseArticle, fetchArticle, parseInput, clean };
})(window);
