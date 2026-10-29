/**
 * Génère les pages statiques de partage / référencement :
 *   voiture/<id>.html   (aperçus Discord, WhatsApp, Facebook… + contenu lisible par Google)
 *   sitemap.xml, robots.txt
 *
 * Usage :
 *   node scripts/build-seo.js                                   # URL par défaut : https://motorauto.fr
 *   node scripts/build-seo.js --url https://www.mon-domaine.fr
 *   node scripts/build-seo.js --csv motorauto-catalogue.csv     # ajoute aussi les véhicules créés dans l'administration
 *                                                               # (Administration > Importer > « Exporter le catalogue actuel »)
 * À relancer avant chaque déploiement si le catalogue a changé.
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const MA = require(path.join(root, "js/utils.js"));

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf("--" + name); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const SITE = opt("url", "https://motorauto.fr").replace(/\/+$/, "");
const csvFile = opt("csv", "");

const src = fs.readFileSync(path.join(root, "js/data.js"), "utf8").replace(/^const MOTORAUTO_DATABASE/m, "var MOTORAUTO_DATABASE")
  + "\n" + fs.readFileSync(path.join(root, "js/data2.js"), "utf8")
  + "\n" + fs.readdirSync(path.join(root, "js")).filter((f) => /^data-(alfa|audi|lemans|enrich.*)\.js$/.test(f)).map((f) => f.replace(/\.js$/, "")).sort((a, b) => (/enrich/.test(a) - /enrich/.test(b)) || (a < b ? -1 : 1)).concat([]).reduce((a, f) => a.concat(f), ["data-kit"]).map((f) => fs.readFileSync(path.join(root, "js/" + f + ".js"), "utf8")).join("\n");
const byId = new Map();
new Function(src + ";return MOTORAUTO_DATABASE;")().forEach((c) => byId.set(c.id, c));
if (csvFile) {
  const r = MA.csvToCars(fs.readFileSync(csvFile, "utf8"));
  r.errors.forEach((e) => console.warn("CSV :", e));
  r.cars.forEach((c) => byId.set(c.id, c));
}
const cars = Array.from(byId.values()).map(MA.normalizeCar);

const esc = MA.esc;
const outDir = path.join(root, "voiture");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// poids / transmission / budget indicatifs (js/data-extra.js, chargé hors navigateur)
const EX = (() => { try { const w = {}; new Function("window", fs.readFileSync(path.join(root, "js/data-extra.js"), "utf8"))(w); return w.MAExtra; } catch (_) { return null; } })();
const slug = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const nfr = (n, d) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
const imgOf = (car) => (/^https?:\/\//.test(car.image) ? car.image : (car.image ? `${SITE}/${car.image}` : `${SITE}/assets/icon-512.png`));
const CSS = `body{margin:0;background:#09090b;color:#f4f4f5;font:16px/1.6 system-ui,sans-serif}main{max-width:820px;margin:0 auto;padding:2rem 1.2rem}img{max-width:100%;border-radius:14px}a{color:#fca5a5}a.cta{display:inline-block;margin:1rem 0;padding:.8rem 1.4rem;border-radius:12px;background:#ef4444;color:#fff;font-weight:700;text-decoration:none}h1{font-size:2rem;margin:.4rem 0}h2{margin:2rem 0 .6rem}h3{margin:1.2rem 0 .3rem;color:#a1a1aa}li{margin:.2rem 0}.k{color:#ef4444;font-weight:800;letter-spacing:.08em}nav.bc{font-size:.85rem;color:#a1a1aa}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #27272a;padding:.5rem .6rem;text-align:left}th{color:#a1a1aa;font-weight:600;width:45%}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.8rem;padding:0;list-style:none}.grid li{background:#18181b;border-radius:12px;padding:.8rem}.grid img{width:100%;aspect-ratio:16/9;object-fit:cover}`;
const head = ({ title, desc, url, img, type, ld }) => `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="MOTORAUTO">
<meta property="og:title" content="${esc(title.replace(/ \| MOTORAUTO$/, ""))}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(img)}"><meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title.replace(/ \| MOTORAUTO$/, ""))}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}">
<meta name="theme-color" content="#09090b">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>${CSS}</style>`;

const byBrand = new Map();
cars.forEach((c) => { if (!byBrand.has(c.brand)) byBrand.set(c.brand, []); byBrand.get(c.brand).push(c); });
const carUrl = (c) => `${SITE}/voiture/${c.id}.html`, brandUrl = (b) => `${SITE}/marque/${slug(b)}.html`;

cars.forEach((car) => {
  const name = `${car.brand} ${car.model}`.trim();
  const s = car.stats, engs = car.phases.flatMap((p) => p.engines);
  const tq = Math.max(0, ...engs.map((e) => e.torque || 0));
  const x = EX ? EX.carExtra(car) : null, ptw = EX ? EX.powerToWeight(car) : null;
  const title = `${name} (${car.years}) : ${s.power} ch${s.zero ? ", 0-100 en " + s.zero + " s" : ""} — fiche technique | MOTORAUTO`;
  const sentence = `${name} : jusqu'à ${s.power} ch${tq ? " et " + tq + " Nm" : ""}, ${s.speed} km/h en pointe${s.zero ? ", 0 à 100 km/h en " + s.zero + " s" : ""}. ${engs.length} motorisation${engs.length > 1 ? "s" : ""} sur ${car.phases.length} génération${car.phases.length > 1 ? "s" : ""}. `;
  const desc = (sentence + (car.description || "")).replace(/\s+/g, " ").trim().slice(0, 300);
  const url = carUrl(car), app = `${SITE}/index.html?car=${encodeURIComponent(car.id)}`, img = imgOf(car);
  const sameBrand = (byBrand.get(car.brand) || []).filter((c) => c.id !== car.id);
  const related = (car.related || []).map((id) => cars.find((c) => c.id === id)).filter(Boolean).concat(sameBrand).filter((c, i, a) => a.indexOf(c) === i).slice(0, 8);
  const faq = [
    [`Quelle est la puissance de la ${name} ?`, (() => { const lo = Math.min(...engs.map((e) => e.power).filter(Boolean)); return lo < s.power ? `Selon les versions, la ${name} développe de ${lo} à ${s.power} ch.` : `La ${name} développe ${s.power} ch.`; })()],
    s.zero ? [`Quel est le 0 à 100 km/h de la ${name} ?`, `La version la plus rapide annonce ${s.zero} s de 0 à 100 km/h, pour ${s.speed} km/h en vitesse de pointe.`] : null,
    [`Quelles motorisations pour la ${name} ?`, engs.slice(0, 6).map((e) => `${e.name} (${e.power} ch)`).join(", ") + "."]
  ].filter(Boolean);
  const ld = [{
    "@context": "https://schema.org", "@type": "Car", name, brand: { "@type": "Brand", name: car.brand }, model: car.model, bodyType: car.category,
    description: desc, image: img, url, vehicleModelDate: String(car.years).slice(0, 4),
    ...(x && x.kg ? { weight: { "@type": "QuantitativeValue", value: x.kg, unitCode: "KGM" } } : {}),
    vehicleEngine: engs.slice(0, 8).map((e) => ({ "@type": "EngineSpecification", name: e.name, enginePower: { "@type": "QuantitativeValue", value: e.power, unitText: "PS" } }))
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "MOTORAUTO", item: SITE + "/" }, { "@type": "ListItem", position: 2, name: car.brand, item: brandUrl(car.brand) }, { "@type": "ListItem", position: 3, name, item: url }]
  }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }];
  const specs = [["Années de production", car.years], ["Catégorie", car.category], ["Puissance maximale", s.power + " ch"], tq ? ["Couple maximal", tq + " Nm"] : null, ["Vitesse de pointe", s.speed + " km/h"], s.zero ? ["0 à 100 km/h", nfr(s.zero, 1) + " s"] : null,
    x && x.drive ? ["Transmission", EX.DRIVE_LABEL[x.drive]] : null, x ? ["Poids indicatif", nfr(x.kg) + " kg" + (x.est ? " (estimé)" : "")] : null, ptw ? ["Rapport poids / puissance", nfr(ptw.kgPerHp, 1) + " kg/ch · " + nfr(ptw.hpPerTon) + " ch/tonne"] : null].filter(Boolean);
  const engines = car.phases.map((p) => `<h3>${esc(p.phaseName)}</h3><ul>${p.engines.map((e) => `<li><b>${esc(e.name)}</b> — ${e.power} ch${e.torque ? ", " + e.torque + " Nm" : ""}${e.speed ? ", " + e.speed + " km/h" : ""}${e.zeroToHundred ? ", 0-100 en " + e.zeroToHundred + " s" : ""}</li>`).join("")}</ul>`).join("");
  const html = `<!DOCTYPE html>
<html lang="fr"><head>
${head({ title, desc, url, img, type: "article", ld })}
</head><body><main>
<nav class="bc" aria-label="Fil d'Ariane"><a href="../index.html">MOTORAUTO</a> › <a href="../marque/${slug(car.brand)}.html">${esc(car.brand)}</a> › ${esc(car.model)}</nav>
<div class="k">MOTORAUTO</div>
<h1>${esc(name)}</h1>
<p>${esc(car.years)} · ${esc(car.category)}</p>
<img src="${esc(img)}" alt="${esc(name)}" width="760" loading="eager">
<p>${esc(car.description)}</p>
<a class="cta" href="${esc(app)}">Ouvrir la fiche interactive (comparateur, duel, chronos)</a>
<h2>Fiche technique</h2><table><tbody>${specs.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table>
<h2>Motorisations</h2>${engines}
${car.records.length ? `<h2>Records &amp; anecdotes</h2><ul>${car.records.map((r) => `<li><b>${esc(r.type)}</b> — ${esc(r.description)}</li>`).join("")}</ul>` : ""}
<h2>Questions fréquentes</h2>${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}
${related.length ? `<h2>Voir aussi</h2><ul>${related.map((c) => `<li><a href="${esc(c.id)}.html">${esc(c.brand + " " + c.model)}</a> — ${c.stats.power} ch</li>`).join("")}</ul>` : ""}
<p><a href="../marque/${slug(car.brand)}.html">Toutes les ${esc(car.brand)}</a> · <a href="../index.html">← Tout le catalogue MOTORAUTO</a></p>
</main>
<script>if(!/bot|crawl|spider|facebookexternalhit|whatsapp|discord|telegram|slack|twitter|linkedin|preview/i.test(navigator.userAgent))location.replace(${JSON.stringify("../index.html?car=" + encodeURIComponent(car.id))});</script>
</body></html>`;
  fs.writeFileSync(path.join(outDir, car.id + ".html"), html);
});

// une page d'atterrissage par marque : « Peugeot sportives : toutes les fiches »
const brandDir = path.join(root, "marque");
fs.rmSync(brandDir, { recursive: true, force: true });
fs.mkdirSync(brandDir, { recursive: true });
byBrand.forEach((list, brand) => {
  const url = brandUrl(brand), img = imgOf(list[0]), top = list.slice().sort((a, b) => b.stats.power - a.stats.power);
  const title = `${brand} : ${list.length} fiche${list.length > 1 ? "s" : ""} techniques, moteurs et performances | MOTORAUTO`;
  const desc = `Toutes les ${brand} du catalogue MOTORAUTO : ${top.slice(0, 4).map((c) => c.model.replace(/\s*\(.*$/, "") + " (" + c.stats.power + " ch)").join(", ")}… Puissance, couple, 0-100 et phases.`.slice(0, 300);
  const ld = [{ "@context": "https://schema.org", "@type": "ItemList", name: `${brand} — MOTORAUTO`, itemListElement: top.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: carUrl(c), name: `${c.brand} ${c.model}` })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "MOTORAUTO", item: SITE + "/" }, { "@type": "ListItem", position: 2, name: brand, item: url }] }];
  fs.writeFileSync(path.join(brandDir, slug(brand) + ".html"), `<!DOCTYPE html>
<html lang="fr"><head>
${head({ title, desc, url, img, type: "website", ld })}
</head><body><main>
<nav class="bc"><a href="../index.html">MOTORAUTO</a> › ${esc(brand)}</nav><div class="k">MOTORAUTO</div>
<h1>${esc(brand)} : fiches techniques</h1><p>${list.length} modèle${list.length > 1 ? "s" : ""} au catalogue, classés par puissance.</p>
<ul class="grid">${top.map((c) => `<li><a href="../voiture/${esc(c.id)}.html"><img src="${esc(imgOf(c))}" alt="${esc(c.brand + " " + c.model)}" loading="lazy"><b>${esc(c.model)}</b></a><br><small>${esc(c.years)} · ${c.stats.power} ch · ${c.stats.speed} km/h${c.stats.zero ? " · 0-100 en " + c.stats.zero + " s" : ""}</small></li>`).join("")}</ul>
<p><a href="../index.html">← Tout le catalogue MOTORAUTO</a></p></main>
<script>if(!/bot|crawl|spider|facebookexternalhit|whatsapp|discord|telegram|slack|twitter|linkedin|preview/i.test(navigator.userAgent))location.replace("../index.html#/catalogue");</script></body></html>`);
});

const today = new Date().toISOString().slice(0, 10);
const urls = [`${SITE}/`, `${SITE}/chat.html`].concat(Array.from(byBrand.keys()).map(brandUrl), cars.map((c) => `${SITE}/voiture/${c.id}.html`));
fs.writeFileSync(path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u, i) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><priority>${i === 0 ? "1.0" : u.endsWith("chat.html") ? "0.3" : "0.7"}</priority></url>`).join("\n") + `\n</urlset>\n`);
fs.writeFileSync(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /chat.html\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`${cars.length} pages voiture/ + ${byBrand.size} pages marque/, sitemap.xml et robots.txt pour ${SITE}`);
