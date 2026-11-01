// Contrôle des grandes marques (BMW, Mercedes, Renault, Alpine, rallye) : ids uniques, liens « voir aussi » valides, moteurs renseignés.
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");
const src = fs.readFileSync(root + "/js/data.js", "utf8").replace(/^const MOTORAUTO_DATABASE/m, "var MOTORAUTO_DATABASE") + "\n" + fs.readFileSync(root + "/js/data2.js", "utf8") + "\n" +
  ["data-kit"].concat(fs.readdirSync(root + "/js").filter((f) => /^data-(alfa|audi|lemans|bmw.*|mercedes.*|renault.*|alpine.*|rally.*|enrich.*)\.js$/.test(f)).map((f) => f.replace(/\.js$/, "")).sort((a, b) => (/enrich/.test(a) - /enrich/.test(b)) || (a < b ? -1 : 1))).map((f) => fs.readFileSync(root + "/js/" + f + ".js", "utf8")).join("\n");
const cars = new Function(src + ";return MOTORAUTO_DATABASE;")();
const ids = new Set(), bad = [];
cars.forEach((c) => { if (ids.has(c.id)) bad.push("doublon " + c.id); ids.add(c.id); });
const brandRe = /^(BMW|Mercedes|Renault|Alpine|Lancia|Subaru|Mitsubishi)/i;
let n = 0, engines = 0;
cars.forEach((c) => {
  (c.related || []).forEach((r) => { if (!ids.has(r)) bad.push(c.id + " -> lien inconnu " + r); });
  if (c.drives && c.drives.length) { n++; (c.phases || []).forEach((p) => { if (!p.engines.length) bad.push(c.id + " phase sans moteur " + p.phaseName); engines += p.engines.length; p.engines.forEach((e) => { if (!e.name || e.power < 0) bad.push(c.id + " moteur invalide"); }); }); if (!c.description || !c.history) bad.push(c.id + " texte manquant"); }
});
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`brands.test OK : ${cars.length} fiches, ${n} nouvelles grandes marques, ${engines} moteurs`);
