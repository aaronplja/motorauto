/**
 * MOTORAUTO — import « tout-en-un » d'un véhicule : lien de n'importe quel site, article Wikipédia, ou simple nom.
 * 1. page web  -> extraction générique (métadonnées OpenGraph / JSON-LD, tableaux et fiches techniques, chiffres du texte)
 * 2. complément automatique avec l'article Wikipédia correspondant (recherche par nom) pour combler les trous
 * Les sites n'autorisant pas la lecture depuis un navigateur sont lus via des relais publics (voir PROXIES) ;
 * si tout échoue, l'administrateur peut coller le texte de la page. Le résultat reste un BROUILLON à relire.
 */
(function (root) {
  "use strict";
  const MA = root.MA, W = root.MAWiki;
  const enc = encodeURIComponent;
  const PROXIES = [
    (u) => `https://api.allorigins.win/raw?url=${enc(u)}`,
    (u) => `https://corsproxy.io/?${enc(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${enc(u)}`
  ];

  async function timedFetch(url, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || 12000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } finally { clearTimeout(t); }
  }
  const looksHtml = (s) => typeof s === "string" && s.length > 400 && /<\s*(html|body|p|div|table|h1)\b/i.test(s);

  async function fetchHtml(url, onStep) {
    const tries = [(u) => u].concat(PROXIES);
    for (let i = 0; i < tries.length; i++) {
      try {
        if (onStep) onStep(i === 0 ? "Lecture de la page…" : `Lecture via un relais (${i}/${PROXIES.length})…`);
        const html = await timedFetch(tries[i](url), 12000);
        if (looksHtml(html)) return html;
      } catch (_) { /* on essaie le suivant */ }
    }
    const e = new Error("Impossible de lire cette page depuis le navigateur (le site refuse l'accès). Colle son texte ci-dessous.");
    e.code = "unreachable";
    throw e;
  }

  const meta = (doc, ...names) => {
    for (const n of names) {
      const el = doc.querySelector(`meta[property="${n}"], meta[name="${n}"]`);
      if (el && el.content && el.content.trim()) return el.content.trim();
    }
    return "";
  };

  function jsonLd(doc) {
    const out = [];
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      try {
        const walk = (n) => { if (!n) return; if (Array.isArray(n)) return n.forEach(walk); if (typeof n === "object") { out.push(n); if (n["@graph"]) walk(n["@graph"]); } };
        walk(JSON.parse(s.textContent));
      } catch (_) { /* JSON invalide : ignoré */ }
    });
    return out.find((n) => /Car|Vehicle|Product/i.test([].concat(n["@type"] || []).join(" "))) || null;
  }

  const cleanTitle = (t) => W.clean(String(t || "").split(/\s[|–—•·]\s|\s-\s(?=[A-ZÉ])/)[0]).replace(/\b(fiche technique|essai|test|avis|caract[ée]ristiques|prix|photos?)\b.*$/i, "").trim();

  function parseGenericPage(html, url, known) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const ld = jsonLd(doc);
    const h1 = doc.querySelector("h1");
    const title = cleanTitle(meta(doc, "og:title", "twitter:title") || (h1 && h1.textContent) || doc.title);
    const abs = (u) => { try { return new URL(u, url).href; } catch (_) { return ""; } };
    let image = meta(doc, "og:image", "twitter:image");
    if (!image && ld && ld.image) image = [].concat(ld.image)[0].url || [].concat(ld.image)[0];
    image = image ? abs(image) : "";
    const r = W.parseArticle(html, { title, url, image, generic: true, knownBrands: known });
    const car = r.car;
    const ogDesc = meta(doc, "og:description", "description") || (ld && ld.description) || "";
    if (ogDesc && ogDesc.length > car.description.length * 0.6 && ogDesc.length >= 60) car.description = W.clean(ogDesc).slice(0, 650);
    if (ld) {
      const b = ld.brand && (ld.brand.name || ld.brand);
      if (b && typeof b === "string" && !known.some((k) => k.toLowerCase() === car.brand.toLowerCase())) { car.brand = b; if (ld.model) car.model = String(ld.model.name || ld.model); }
    }
    if (!car.records.some((x) => x.type === "Source")) car.records.push({ type: "Source", description: url });
    else car.records = car.records.map((x) => x.type === "Source" ? { type: "Source", description: url } : x);
    return r;
  }

  // ---------------------------------------------------------------- Wikipédia
  async function searchWiki(q, lang) {
    const u = `https://${lang}.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*&action=query&list=search&srlimit=3&srsearch=${enc(q)}`;
    const j = await fetch(u).then((r) => r.json());
    const hits = (j.query && j.query.search) || [];
    return hits.length ? hits[0].title : "";
  }

  const complete = (e) => e.power > 0 && e.speed > 0 && e.zeroToHundred > 0;
  const score = (car) => car.phases.reduce((t, p) => t + p.engines.filter(complete).length * 3 + p.engines.length, 0);

  function merge(base, wiki, wikiTitle) {
    const car = Object.assign({}, base);
    ["brand", "model", "years", "image"].forEach((k) => { if (!car[k] && wiki[k]) car[k] = wiki[k]; });
    if (car.category === "Berline" && wiki.category !== "Berline") car.category = wiki.category;
    if ((wiki.description || "").length > (car.description || "").length) car.description = wiki.description;
    if (score(wiki) > score(car)) { car.phases = wiki.phases; }
    else if (!car.phases.every((p) => p.engines.every(complete))) { // compléter les trous avec le moteur wiki de puissance équivalente
      const pool = wiki.phases.flatMap((p) => p.engines);
      car.phases.forEach((p) => p.engines.forEach((e) => {
        const m = pool.find((w) => Math.abs(w.power - e.power) <= 3 && complete(w));
        if (m) { if (!(e.speed > 0)) e.speed = m.speed; if (!(e.zeroToHundred > 0)) e.zeroToHundred = m.zeroToHundred; if (!(e.torque > 0)) e.torque = m.torque; }
      }));
    }
    const seen = new Set(car.records.map((r) => r.type + "|" + r.description));
    wiki.records.forEach((r) => { if (!seen.has(r.type + "|" + r.description)) car.records.push(r); });
    return car;
  }

  const looksLikeUrl = (s) => /^https?:\/\//i.test(s.trim()) || /^[\w-]+(\.[\w-]+)+\/\S*$/.test(s.trim());

  /**
   * @param input  lien, nom de véhicule, ou (avec opts.pasted) texte / HTML collé
   * @returns {car, notes}
   */
  async function importAny(input, opts) {
    opts = opts || {};
    const step = opts.onStep || (() => {});
    const known = opts.knownBrands || [];
    input = String(input || "").trim();
    if (!input) throw new Error("Colle un lien, ou tape le nom d'un véhicule.");
    let result;

    if (opts.pasted) {
      step("Analyse du texte collé…");
      let html = input;
      if (!/<\s*(p|div|table|h1|html)\b/i.test(input)) {
        const lines = input.split(/\n+/).map((l) => l.trim()).filter(Boolean);
        const first = lines.length > 1 && lines[0].length <= 70 ? lines.shift() : "";
        html = "<main>" + (first ? `<h1>${MA.esc(first)}</h1>` : "") + lines.map((l) => `<p>${MA.esc(l)}</p>`).join("") + "</main>";
      }
      result = parseGenericPage(html, opts.url || "texte collé", known);
    } else if (looksLikeUrl(input)) {
      const url = /^https?:\/\//i.test(input) ? input : "https://" + input;
      if (/^https?:\/\/[a-z-]{2,12}\.(m\.)?wikipedia\.org\/wiki\//i.test(url)) { step("Lecture de l'article Wikipédia…"); return await W.fetchArticle(url); }
      const html = await fetchHtml(url, step);
      step("Analyse de la page…");
      result = parseGenericPage(html, url, known);
    } else {
      step("Recherche sur Wikipédia…");
      let lang = "fr", t = await searchWiki(input + " automobile", "fr").catch(() => "");
      if (!t) { lang = "en"; t = await searchWiki(input + " car", "en").catch(() => ""); }
      if (!t) throw new Error("Aucun article trouvé pour « " + input + " ». Essaie avec le lien d'une page.");
      const r = await W.fetchArticle("https://" + lang + ".wikipedia.org/wiki/" + enc(t.replace(/ /g, "_")));
      r.notes.unshift(`Article Wikipédia trouvé par recherche : « ${t} » — vérifie que c'est bien le bon véhicule.`);
      return r;
    }

    // complément Wikipédia (sauf si la page est déjà complète)
    const car = result.car;
    const needs = !car.image || car.description.length < 150 || !car.phases.some((p) => p.engines.some(complete)) || car.phases.some((p) => p.engines.some((e) => !complete(e)));
    if (needs && !opts.noWiki && (car.brand || car.model)) {
      try {
        step("Recherche de compléments sur Wikipédia…");
        const q = `${car.brand} ${car.model}`.trim() || car.id;
        const t = await searchWiki(q, "fr");
        if (t) {
          const w = await W.fetchArticle("https://fr.wikipedia.org/wiki/" + enc(t.replace(/ /g, "_")));
          result.car = merge(car, w.car, t);
          result.notes.unshift(`Complété avec l'article Wikipédia « ${t} » : vérifie que c'est bien le même véhicule.`);
          w.notes.filter((n) => /licence/.test(n)).forEach((n) => result.notes.push(n));
        }
      } catch (_) { result.notes.push("Complément Wikipédia indisponible."); }
    }
    return result;
  }

  root.MAImport = { importAny, parseGenericPage, fetchHtml, merge };
})(window);
