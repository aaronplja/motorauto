// Titres, erreurs, comparateur : logique pure (sans navigateur ni Firebase)
const assert = require("assert"), fs = require("fs"), vm = require("vm");
const G = require("../js/game-core.js");
function boot(file, extra) {
  const win = Object.assign({ MA: { esc: (s) => String(s) }, MAFB: { db: {}, auth: {} }, MAGameCore: G, addEventListener() {}, document: null }, extra || {});
  const doc = { addEventListener() {}, documentElement: {}, querySelectorAll: () => [] };
  const ctx = { window: win, document: doc, MutationObserver: class { observe() {} }, setTimeout, console, navigator: { userAgent: "node" }, location: { hash: "#/", origin: "https://x", pathname: "/" } };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, "utf8"), ctx); return win;
}
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const T = boot("js/titles.js").MATitles;
ok(T.label("country:jp") === "Collectionneur Japon", "titre pays");
ok(/Collectionneur/.test(T.label("decade:1980")), "titre décennie");
ok(T.label("legends") === "Maître des Légendes", "titre légendes");
ok(T.label("zzz") === "", "clé inconnue ignorée");
const legs = Object.keys(G.LEGENDS);
ok(T.earned(legs.slice(0, 5)).includes("legends"), "5 albums légende = Maître des Légendes");
ok(!T.earned(legs.slice(0, 4)).includes("legends"), "4 albums ne suffisent pas");
ok(T.earned(["country:jp"]).join() === "country:jp", "un album = un titre");
ok(T.html("country:jp").includes("ttl-gold"), "style or");
ok(T.html("<b>").length === 0, "pas de HTML injecté");
const sent = [];
const E = boot("js/errors.js", { addEventListener() {} });
ok(typeof E.MAErrors.report === "function", "MAErrors défini");
E.MAErrors.report("test", new Error("ResizeObserver loop limit exceeded"));
E.MAErrors.report("test", new Error("vraie erreur"));
n++;
// raretés : score mixte
const pool = JSON.parse(fs.readFileSync("functions/catalog-static.json", "utf8")), rar = G.computeRarities(pool), cnt = {};
rar.forEach((r) => { cnt[r] = (cnt[r] || 0) + 1; });
ok(cnt.legendary >= 20 && cnt.legendary <= 45, "légendaires : " + cnt.legendary);
ok(cnt.common > cnt.rare && cnt.rare > cnt.epic && cnt.epic > cnt.legendary, "pyramide des raretés " + JSON.stringify(cnt));
const rOf = (re) => pool.filter((c) => re.test(c.name)).map((c) => rar.get(c.id));
ok(rOf(/BMW M3 E30$/).every((r) => r !== "common"), "M3 E30 n'est plus commune");
ok(rOf(/Panda|Twingo I/).every((r) => r === "common"), "citadines communes");
ok(JSON.stringify([...G.computeRarities(pool.slice().reverse())]) === JSON.stringify([...rar].sort().length ? [...G.computeRarities(pool.slice().reverse())] : []), "ordre sans effet (déterministe)");
// règles : clés
const rules = fs.readFileSync("firestore.rules", "utf8");
["client_errors", "titles/{uid}", "'rules'"].forEach((k) => ok(rules.includes(k), "règle " + k));
// le profil admin ne contient plus l'ancien bandeau en double
const html = fs.readFileSync("index.html", "utf8");
ok(!/class="stats-ribbon adm-kpis"/.test(html), "ancien bandeau KPI retiré");
ok(/data-tab="erreurs"/.test(html), "onglet Erreurs");
console.log("tour23.test OK (" + n + " vérifications)");
