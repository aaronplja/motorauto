"use strict";
/** Régressions de l'audit « perfection PC + mobile » : marque en double, contrastes, bouton « ? », défis, traductions. */
const fs = require("fs"), path = require("path"), assert = require("assert");
const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
let n = 0; const ok = (label, fn) => { fn(); n++; console.log("  ok - " + label); };

// 1. marque jamais écrite deux fois (« Nissan Nissan Silvia S15 »)
const nameOfSrc = (f) => { const m = read(f).match(/const nameOf = (\(c\) => \{[^\n]*\});/); assert(m, f + " : nameOf introuvable"); return eval("(" + m[1] + ")"); };
["js/car-of-day.js", "js/fiche-plus.js", "js/studio-home.js"].forEach((f) => ok("nameOf sans doublon : " + f, () => {
  const nameOf = nameOfSrc(f);
  assert.strictEqual(nameOf({ brand: "Nissan", model: "Nissan Silvia S15" }), "Nissan Silvia S15");
  assert.strictEqual(nameOf({ brand: "Mazda", model: "Mazda MX-5 Miata (NA)" }), "Mazda MX-5 Miata");
  assert.strictEqual(nameOf({ brand: "Peugeot", model: "205 GTI (1.9)" }), "Peugeot 205 GTI");
  assert.strictEqual(nameOf({ brand: "Seat", model: "Seatrick" }), "Seat Seatrick");   // pas de faux positif : il faut brand + espace
}));
ok("cartes : la marque n'est pas répétée dans le nom", () => assert(/model\.toLowerCase\(\)\.startsWith\(bl \+ " "\)\) model = model\.slice/.test(read("js/cards.js"))));

// 2. lisibilité : puces de la carte et paliers de succès
ok("puces de la carte : texte foncé sur fond translucide", () => assert(/\.mm-bar \.chip\.on \{[^}]*color: var\(--color-ink\)/.test(read("css/refonte.css"))));
ok("paliers argent/or lisibles en clair et en sombre", () => { const c = read("css/plus.css"); assert(/\.ac-t\.silver b \{ color: #55657a; \}/.test(c) && /data-tone="dark"\] \.ac-t\.gold b/.test(c)); });

// 3. bouton « ? » : place réservée en haut à droite de l'en-tête
ok("bouton ? : marge réservée dans l'en-tête de page", () => assert(/\.page-head:has\(> \.guide-help\) > :not\(\.page-head-actions\):not\(\.guide-help\) \{ padding-right: 50px; \}/.test(read("css/guides.css"))));

// 4. défis : une réponse serveur vide ne fait plus planter la route
ok("défis : réponse sans « items » → message d'erreur, pas d'exception", () => assert(/Array\.isArray\(weekly\.items\)\) throw new Error/.test(read("js/play.js"))));

// 5. traductions : mêmes {0}/{1} dans les 4 langues, aucune valeur vide
const dict = (l) => { const m = []; new Function("window", read("js/i18n/" + l + ".js"))({ __MA_DICT: m }); const o = {}; m.forEach((e) => Object.assign(o, e[1])); return o; };
const en = dict("en");
["es", "de", "it"].forEach((l) => ok("traductions " + l + " : gabarits {0} cohérents avec l'anglais", () => {
  const d = dict(l), ph = (s) => (String(s).match(/\{n?\d\}/g) || []).sort().join();
  Object.keys(en).forEach((k) => { if (d[k] === undefined) return; assert(String(d[k]).trim(), l + " : vide : " + k); assert.strictEqual(ph(d[k]), ph(en[k]), l + " : gabarit différent : " + k); });
}));

// 6. anti-spam du fil : règle Firestore présente
ok("règles : réponses du fil limitées par feed_rate", () => { const r = read("firestore.rules"); assert(/function feedRateOk\(\)/.test(r) && /kind != 'feed' \|\| feedRateOk\(\)/.test(r) && /match \/feed_rate\/\{uid\}/.test(r)); });

// 7. économie : packs -40 %, doublons x2 (option C)
const gc = require("../js/game-core.js");
ok("économie : packs -40 %, doublons x2, équilibre des raretés conservé", () => {
  assert.strictEqual(gc.PACKS.world.cost, 120);
  assert(Object.keys(gc.PACKS).every((k) => gc.PACKS[k].cost >= 10 && gc.PACKS[k].cost <= 300));
  assert.deepStrictEqual(["common", "rare", "epic", "legendary", "shiny"].map((r) => gc.RAR[r].dust), [10, 30, 80, 200, 800]);
  assert(gc.RAR.common.dust < gc.RAR.rare.dust && gc.RAR.rare.dust < gc.RAR.epic.dust && gc.RAR.epic.dust < gc.RAR.legendary.dust);
});

// 8. MOTORAUTO PRO : structure de départ, règles d'accès, aucun secret ni contenu technique dans le code
ok("PRO : catégories de départ complètes, ids uniques, aucun contenu technique", () => {
  const w = {}; new Function("window", read("js/pro-cats.js"))(w);
  const c = w.MA_PRO_DEFAULT_CATS, ids = c.map((x) => x.id);
  ["freinages", "chassis", "suspensions", "liaison-au-sol", "aerodynamisme", "refroidissement", "moteur", "echappement", "boite-de-vitesses", "allegement"].forEach((k) => assert(ids.includes(k), "catégorie absente : " + k));
  assert.strictEqual(new Set(ids).size, ids.length);
  c.forEach((x) => { const s = x.subs.map((y) => y.id); assert.strictEqual(new Set(s).size, s.length, "sous-catégories en double : " + x.id); assert(x.subs.length >= 3); });
  assert(c.find((x) => x.id === "moteur").subs.some((y) => y.id === "swap-moteur"));
  assert(/professionnel/.test(w.MA_PRO_WARNING) && /homologation/.test(w.MA_PRO_WARNING));
});
ok("PRO : règles Firestore — abonnement écrit par le serveur seul, fiches publiées pour les abonnés actifs, écriture admin", () => {
  const r = read("firestore.rules");
  assert(/match \/pro_subs\/\{uid\}[\s\S]*?allow write: if false;/.test(r));
  assert(/match \/pro_mods\/\{mid\}[\s\S]*?resource\.data\.status == 'published' && proActive\(\)/.test(r));
  assert(/allow create, update: if validProMod\(\);/.test(r) && /function validProMod\(\) \{[\s\S]*?isAdmin\(\)/.test(r));
  assert(/accessUntil > request\.time/.test(r));
});
ok("PRO : accès offert par un admin — règles, lecture client et écriture réservée aux admins", () => {
  const r = read("firestore.rules"), pro = read("js/pro.js"), adm = read("js/pro-admin.js");
  assert(/function proGiftOk\(uid\)[\s\S]*?pro_grants\/\$\(uid\)[\s\S]*?\.until > request\.time/.test(r));
  assert(/function proActive\(\) \{\s*return signedIn\(\) && \(proSubOk\(request\.auth\.uid\) \|\| proGiftOk\(request\.auth\.uid\)\);/.test(r));
  const g = r.match(/match \/pro_grants\/\{uid\} \{[\s\S]*?\n    \}/)[0];
  assert(/allow read: if isOwner\(uid\) \|\| isAdmin\(\);/.test(g) && /allow create, update: if isAdmin\(\)/.test(g) && /allow delete: if isAdmin\(\);/.test(g));
  assert(/pro_grants/.test(pro) && /kind: "gift"/.test(pro) && /pro_grants/.test(adm));
  assert(/pro_grants/.test(read("functions/delete-account.js")));
});
ok("accueil : déconnexion pendant le chargement du garage sans erreur (n.user.uid sur null)", () => {
  const g = read("js/garage-home.js");
  assert(!/C\.user\.uid/.test(g.replace(/const me = C\.user\.uid;/g, "")), "C.user.uid ne doit être lu qu'une fois, juste après un contrôle");
  assert(/if \(!C\.user\) return;\s*\/\/ déconnexion/.test(g));
});
ok("PRO : aucune clé secrète dans le code du site", () => {
  ["js/pro.js", "js/pro-admin.js", "js/pro-cats.js", "index.src.html"].forEach((f) => assert(!/sk_(live|test)_|whsec_|rk_(live|test)_/.test(read(f)), f));
});
ok("PRO : entrée unique dans la barre du haut + route + onglet admin", () => {
  const h = read("index.src.html"), rt = read("js/router.js");
  assert.strictEqual((h.match(/id="pro-btn"/g) || []).length, 1);
  assert(/name: "pro", re:/.test(rt) && /"jeu", "pro", "journal"/.test(rt) && /data-tab="pro"/.test(h));
});
ok("navigation : Chat remplace Communauté, « Moi » devient Pilotes (profil · garage · communauté · classement)", () => {
  const h = read("index.src.html"), rt = read("js/router.js"), nv = read("js/nav.js");
  assert(/data-touch="chat"/.test(h) && /data-touch="pilotes"/.test(h) && /data-nav="chat"/.test(h) && /data-nav="pilotes"/.test(h));
  assert(!/data-touch="community"|data-touch="me"|id="touch-me-btn"|id="nav-me-btn"|id="open-chat-btn"/.test(h), "anciens boutons supprimés");
  assert.strictEqual((h.match(/class="touch-bar-item/g) || []).length, 5, "5 entrées dans le dock");
  assert(/name: "pilotes", re:/.test(rt) && /PILOT_GROUPS = \[\["profil"[\s\S]*?\["garage"[\s\S]*?\["communaute"[\s\S]*?\["classement"/.test(rt));
  ["community", "leaderboard", "garage", "settings", "pilot", "clubs"].forEach((r) => assert(new RegExp(r + ': "pilotes"').test(rt.match(/const NAV_OF = \{[^\n]*/)[0]), r + " → Pilotes"));
  ["hub-pilotes", "hub-clubs", "hub-classements"].forEach((x) => assert(rt.indexOf('"/communaute/' + x + '"') >= 0, "ancienne adresse " + x + " redirigée"));
  assert(/id="pub-settings-btn"[^>]*href="#\/reglages\/profil"/.test(h) && /pub-settings-btn/.test(read("js/profile-edit.js")), "engrenage Réglages dans le profil");
  assert(!/nav-me-btn|touch-me-btn/.test(nv));
  assert(/"data-s"/.test(read("js/i18n.js")), "libellés courts des onglets traduits");
});
ok("Jouer : 4 univers (Cartes · Jeux · Échanges · Défis), chacun avec sa page d'accueil", () => {
  const rt = read("js/router.js"), h = read("index.src.html"), pl = read("js/play.js");
  assert(/PLAY_GROUPS = \[\["cartes", "Cartes"\], \["minijeux", "Jeux"\], \["troc", "Échanges"\], \["communaute", "Défis"\]\]/.test(rt));
  assert(/"troc", "minijeux"|"echanges", "troc"/.test(rt) && /data-tab="troc"[^>]*><div id="play-hub-troc"/.test(h));
  assert(/echanges: "troc"/.test(rt) && /cardmarket: "troc", wishfeed: "troc"/.test(rt) && /fusion: "cartes"/.test(rt));
  assert(/group === "troc"/.test(pl) && /p\.tab === "troc"/.test(pl));
});
ok("PRO : une seule page adaptative (offre sans accès, bandeau + explorateur avec accès), anciennes adresses redirigées", () => {
  const rt = read("js/router.js"), h = read("index.src.html"), pro = read("js/pro.js");
  assert(/name: "pro", re: \/\^\\\/pro\\\/\?\$\/, keys: \[\]/.test(rt), "plus d'onglets sur /pro");
  ["offre", "explorer", "abonnement"].forEach((x) => assert(rt.indexOf('"/pro/' + x + '": "/pro"') >= 0, "/pro/" + x + " redirigé"));
  assert(!/data-section="pro"/.test(h) && /id="pro-offer"/.test(h) && /id="pro-account"/.test(h) && /id="pro-explorer"/.test(h));
  assert(!/#\/pro\/(offre|explorer|abonnement)/.test(pro), "plus de lien vers les anciens onglets");
  assert(/function paintAll\(\)[\s\S]*?access\(\)\.ok/.test(pro));
});
ok("barre du haut : plus de bouton Nouveautés (elles sont dans les notifications), compte = roue crantée avec Administration · Réglages · Contact", () => {
  const h = read("index.src.html"), nw = read("js/news.js"), nv = read("js/nav.js"), cm = read("js/common.js"), rt = read("js/router.js");
  assert(!/id="news-btn"/.test(h), "bouton Nouveautés supprimé");
  assert(/MA\.notif\.setExtra/.test(nw) && /function setExtra/.test(cm) && /notif-news/.test(cm + nw), "nouveautés injectées dans le panneau");
  assert(/chip-gear/.test(h) && /is-gear/.test(nv), "roue crantée sur le bouton du compte");
  ["#/admin", "#/reglages/profil", "#/contact"].forEach((x) => assert(nv.indexOf(x) >= 0, "entrée " + x));
  assert(!/#\/pilote|#\/garage|#\/classement/.test(nv.slice(nv.indexOf("function build"), nv.indexOf("function build") + 1800)), "le reste du menu est ailleurs");
  assert(/const inner = !!backTo && !landing/.test(rt), "pages internes de Jouer : retour au lieu de la barre des univers");
});
ok("chat : nouvelle interface (chat3.css) avec onglets Tout / Canaux / Privés, ids conservés", () => {
  const h = read("chat.html"), c = read("css/chat3.css");
  assert(/css\/chat3\.css/.test(h) && !/chat2\.css|chatglass\.css/.test(h), "chat3 remplace chat2 + chatglass");
  assert(h.indexOf("chat3.css") > h.indexOf("themes-studio.css"), "chargé en dernier");
  ["chat-channels-list", "chat-convs-list", "chat-send-form", "chat-input-message", "chat-messages-container", "dm-picker", "emoji-panel", "side-tabs"].forEach((id) => assert(h.indexOf('id="' + id + '"') >= 0, "#" + id));
  assert(/data-tab="all"[\s\S]*data-tab="channels"[\s\S]*data-tab="dms"/.test(h) && /data-grp="dms"/.test(h));
  assert(/\[data-grp="dms"\]/.test(c) && /@media \(max-width: 860px\)/.test(c));
});
ok("chat v3.2 : page du site (#/chat) intégrée sans rechargement, en-tête flottant, nom cliquable, bulles avec heure", () => {
  const h = read("chat.html"), c = read("css/chat3.css"), g = read("js/chatglass.js"), cp = read("js/chat-plus.js"), ch = read("js/chat.js"), ce = read("js/chat-embed.js"), rt = read("js/router.js"), ix = read("index.src.html");
  assert(/name: "chat", re:/.test(rt) && /chat: "page-chat"/.test(rt) && /chat: "chat"/.test(rt), "route #/chat");
  assert(/id="page-chat"/.test(ix) && /js\/chat-embed\.js/.test(ix) && /data-nav="chat"/.test(ix) && !/href="chat\.html"/.test(ix), "page + liens vers #/chat");
  assert(/location\.replace\("index\.html#\/chat"/.test(h) && !/id="mobile-touch-bar"/.test(h), "chat.html seul → redirigé ; plus de dock en double");
  assert(/chat-view/.test(ch) && /chat-ready/.test(ch) && /chat-conv/.test(ce) && /on-chat/.test(ce), "la page parente suit la vue (liste / conversation)");
  assert(/html\.chat-conv \.app-header/.test(read("css/refonte.css")), "en-tête masqué dans une conversation (mobile)");
  assert(/id="conv-pill"/.test(h) && /class="back-list fl-btn"/.test(h) && /--fl-bg/.test(c) && /\.compose-wrap \{ position: absolute/.test(c), "pilule + boutons + saisie flottants");
  assert(/chat-nav/.test(g) && /conv-pill/.test(g), "toucher le nom ouvre le profil");
  assert(/LOUPE/.test(cp) && !/textContent = "🔍"/.test(cp), "loupe dessinée, plus d'emoji");
  assert(/class="b-time"/.test(ch) && /class="msg-meta"/.test(ch), "heure dans la bulle, pseudo + admin + titre dans la bulle");
});
ok("croix et boutons : croix dessinées automatiquement, barre du haut à hauteur unique, plus de double croix dans la recherche", () => {
  assert(/x-drawn/.test(read("js/a11y.js")) && /\.x-drawn::before/.test(read("css/base.css")));
  assert(/--hb: 40px/.test(read("css/refonte.css")) && /spot-field input::-webkit-search-cancel-button/.test(read("css/refonte.css")));
});
ok("style flottant : verre de la barre du bas sur tout le site (en-tête en pastilles, boutons, retours, onglets), serif moins étiré", () => {
  const f = read("css/float.css"), h = read("index.src.html");
  assert(/css\/float\.css/.test(h) && h.indexOf("css/float.css") > h.indexOf("css/themes-studio.css"), "float.css chargé en dernier");
  assert(/\.brand-link[^}]*backdrop-filter/.test(f) && /\.desktop-navigation[^}]*backdrop-filter/.test(f) && /\.back-link/.test(f) && /\.play-back/.test(f) && /\.page-tabs/.test(f) && /\.seg-btn/.test(f), "pastilles, retours et onglets en verre");
  assert(/prefers-reduced-transparency/.test(f) && /@supports not/.test(f), "repli sans transparence");
  assert(!/\.toolbar-cluster\s*\{[^}]*border-radius: 999px/.test(f), "le panneau de filtres n'est pas une bulle");
  assert(/letter-spacing: \.004em/.test(f) && /line-height: 1\.1/.test(f), "serif : crénage et interligne détendus");
});
ok("barre du haut : mêmes dimensions que le chat (50 px), pas de rectangle au repli, onglet actif = pilule qui épouse la barre", () => {
  const f = read("css/float.css");
  assert(/html \{ --hb: 50px; \}/.test(f), "pastilles de 50 px comme dans le chat");
  assert(/html\[data-anim\] \.app-header\.is-scrolling[^{]*\{[^}]*background: none !important/.test(f), "plus de fond plein pendant le défilement");
  assert(/\.app-header\.hide-up \.brand-link/.test(f) && /transform: none !important;/.test(f), "repli pastille par pastille, sans parent animé");
  assert(/\.page-tabs\.fit \.page-tab \{ border-radius: 999px !important/.test(f) && /align-self: stretch/.test(f), "onglet actif : pilule pleine hauteur de la barre");
  assert(/html\.on-chat, html\.on-chat body \{ background: var\(--bg-core\)/.test(f), "fond du chat sans bandeau");
});
ok("bouton PRO en verre, navigation compacte en dock, menu roue en verre, filtres du catalogue compacts sur mobile", () => {
  const f = read("css/float.css");
  assert(/\.mp-chip \{ color: var\(--color-ink\) !important/.test(f) && /\.mp-chip:active \{ transform: scale\(\.92\)/.test(f), "PRO = même verre et mêmes animations");
  assert(/max-width: 1279px\)/.test(f) && /\.nav-link \{ flex-direction: column/.test(f), "nav compacte : icône au-dessus du libellé");
  assert(/html \.me-sheet \{ background: color-mix\(in srgb, var\(--bg-surface\) 58%/.test(f), "menu de la roue crantée translucide");
  assert(/max-width: 700px\)[\s\S]*grid-template-columns: minmax\(0,1fr\) minmax\(0,1fr\) auto/.test(f) && /\.side-label \{ display: none/.test(f), "filtres du catalogue : 2 rangées défilantes + marque / tri / filtres");
});
console.log(n + " vérifications audit OK");

// ---- démarrage D2 + chargement C8 + icône noire
ok("démarrage D2 (tracé), chargement C8 (respiration) et icône noire", () => {
  const src = read("index.src.html");
  assert.ok(/<style id="splash-css">[\s\S]*spDraw[\s\S]*Big Shoulders Display/.test(src), "splash : tracé + police du logo");
  assert.ok(!/sp-line/.test(src), "plus de barre de progression dans le splash");
  assert.ok(/href="css\/brand-loader\.css"/.test(src) && /brand-loader\.css/.test(read("chat.html")), "feuille du chargement liée (site + chat)");
  const bl = read("css/brand-loader.css");
  ["\\.spinner", "\\.chat-embed-spin", "\\.ptr span", "\\.skel-wrap::before", "\\.tcg-skeleton::before", "\\.ma-busy::after", "#ltips \\.lt-sp"].forEach((r) => assert.ok(new RegExp(r).test(bl), "loader : " + r));
  assert.ok(/maBreathe/.test(bl) && /clip-path/.test(bl), "respiration en clip-path");
  const fav = src.split("\n").filter((l) => /rel="icon"/.test(l)).join("");
  assert.ok(/%230b0e0c/.test(fav) && /%233fbf82/.test(fav) && !/%23ef4444/.test(fav), "favicon noir/blanc/vert");
  assert.strictEqual(JSON.parse(read("manifest.webmanifest")).background_color, "#0b0e0c");
  const lt = read("js/loading-tips.js");
  assert.ok(/Big Shoulders Display/.test(lt) && !/ltSpin/.test(lt), "écran d'attente : police du logo + marque");
});

// ---- série z8 : thème du démarrage, connexion, tutoriels, nouveautés, en-tête
ok("écran de démarrage : couleurs du thème choisi (y compris Mon thème)", () => {
  const src = read("index.src.html");
  assert.ok(/--sp-bg:var\(--spx-bg,var\(--bg-core/.test(src) && /--sp-ink:var\(--spx-ink,var\(--color-ink/.test(src) && /--sp-ac:var\(--spx-ac,var\(--accent/.test(src), "variables du splash liées au thème");
  assert.ok(/motorauto_custom_theme/.test(src) && /--spx-bg/.test(src), "thème sur mesure lu avant le premier affichage");
  assert.ok(!/#splash,#boot-splash\{background:#0b0e0c/.test(src), "fond du splash plus figé en noir");
});
ok("connexion : carte pleine, marque et pilules", () => {
  assert.ok(/class="auth-mark"/.test(read("index.src.html")));
  assert.ok(/#auth-modal \.modal-dialog\.auth-box/.test(read("css/float.css")));
});
ok("tutoriels : une aide pour chaque page de Jouer", () => {
  const g = read("js/guides.js");
  ["play/collection", "play/boutique", "fusion", "quizgame", "plusmoins", "cardmarket", "wishfeed", "achievements", "pro", "chat", "news", "contact"].forEach((k) => assert.ok(new RegExp('"' + k + '":').test(g), "aide : " + k));
});
ok("nouveautés : entrées du 16 novembre publiées (fr + en)", () => {
  const w = {}; new Function("window", read("js/news-seed.js"))(w);
  const seed = w.MA_NEWS_SEED, ids = seed.map((e) => e.id);
  assert.strictEqual(new Set(ids).size, ids.length, "ids uniques");
  ["s-2026-11-16", "s-2026-11-15", "s-2026-11-14", "s-2026-11-12"].forEach((i) => { const e = seed.find((x) => x.id === i); assert.ok(e && e.fr.title && e.en.title && e.fr.body && e.en.body, i); });
});
ok("en-tête : revient au changement de page", () => {
  const g = read("js/glassbar.js");
  assert.ok(/ma:route/.test(g) && /showHead/.test(g), "réaffichage sur ma:route");
});

// ---- série z9 : avatars, accueil, filtre, chat iPhone, date
ok("avatars : jamais étirés (badge d'en-tête du chat)", () => {
  const c = read("css/chat3.css");
  assert.ok(/\.conv-badge \.avatar \{ position: absolute; inset: 0;[^}]*object-fit: cover/.test(c), "avatar du badge en absolu 100 %");
  assert.ok(/aspect-ratio: 1 \/ 1/.test(read("css/float.css")), "avatars ronds : ratio 1/1");
});
ok("accueil : un seul bandeau garage (pas de dessins concurrents)", () => {
  const g = read("js/garage-home.js");
  assert.ok(/let painting = false/.test(g) && /async function paint1\(/.test(g), "verrou anti-chevauchement");
  assert.ok(/querySelectorAll\("#home-garage"\)\.forEach\(\(x, i\) => \{ if \(i\) x\.remove\(\); \}\)/.test(g), "doublons retirés");
});
ok("filtre : glissement sans rebond", () => {
  const t = read("css/themefix.css");
  assert.ok(/animation:adv-up \.26s cubic-bezier\(\.22,\.9,\.3,1\)/.test(t) && !/adv-up \.28s var\(--m-spring/.test(t));
});
ok("chat iPhone : page redimensionnée seulement clavier ouvert, saisie au niveau du dock, plus de date flottante", () => {
  const j = read("js/chat.js"), e = read("js/chat-embed.js"), c = read("css/chat3.css");
  assert.ok(!/--vvh/.test(j) && /window\.addEventListener\("resize", fit\)/.test(j), "le chat ne mesure plus le clavier lui-même");
  assert.ok(/chat-blur/.test(j) && /chat-blur/.test(e) && /function settle\(\)/.test(e), "page du site remise en place après le clavier");
  assert.ok(/max\(6px, calc\(var\(--safe-bottom, 0px\) - 12px\)\)/.test(c), "saisie au niveau du dock");
  assert.ok(/\.day-sep \{ position: static;/.test(c) && !/\.day-sep \{[^}]*position: sticky/.test(c), "date non collante");
});

// ---- série z10 : chat iPhone (hauteur réduite après le clavier, recouvrement en haut)
ok("chat iPhone : recalcul de la hauteur après le clavier, salon sous la barre du haut, voile en haut de conversation", () => {
  const e = read("js/chat-embed.js"), g = read("js/glassbar.js"), c = read("css/chat3.css");
  assert.ok(/let peak = window\.innerHeight/.test(e) && /function remeasure\(\)/.test(e) && /sentinel\.style\.display = "none"/.test(e), "contournement du bug de hauteur iOS");
  assert.ok(/function fitTop\(\)/.test(e) && /getBoundingClientRect\(\)\.bottom/.test(e), "le salon commence sous la barre réelle");
  assert.ok(/box: "border-box"/.test(g) && /addEventListener\("resize", setH\)/.test(g), "hauteur de la barre du haut recalculée (encoche comprise)");
  assert.ok(/\.conv-head::before \{ display: block !important;[^}]*linear-gradient/.test(c), "voile sous l'heure en conversation");
});

// ---- série z11 : chat iPhone (décalage persistant, saisie sous le clavier, cadres débloqués)
ok("chat iPhone : seule la saisie suit le clavier (--kb), cadre et liste immobiles, page du site défilable pour revenir à sa place", () => {
  const e = read("js/chat-embed.js"), r = read("css/refonte.css"), c = read("css/chat.css"), c3 = read("css/chat3.css");
  assert.ok(/function layout\(now\)/.test(e) && /window\.innerHeight - vv\.height/.test(e) && /"--kb"/.test(e), "hauteur du clavier transmise au chat");
  assert.ok(!/host\.style\.bottom = bottom/.test(e) && /host\.style\.top = topBase; host\.style\.bottom = "";/.test(e), "le cadre ne bouge pas");
  assert.ok(/translate3d\(0, calc\(-1 \* max\(var\(--kb, 0px\), var\(--kbp, 0px\)\)\), 0\)/.test(c3), "la saisie monte avec le clavier");
  assert.ok(/classList\.toggle\("chat-kb", open\)/.test(e) && /kbOpen \? 0 : px\(cs\.paddingBottom\)/.test(e), "marge basse nulle clavier ouvert, dock masqué");
  assert.ok(/html\.on-chat \{ overflow-x: hidden; overflow-y: auto;/.test(r) && /min-height: calc\(100dvh \+ 2px\)/.test(r) && !/html\.on-chat, html\.on-chat body \{ overflow: hidden; \}/.test(r), "plus d'overflow:hidden sur la page du site");
  assert.ok(/html\.chat-kb #mobile-touch-bar \{ display: none/.test(r), "dock masqué clavier ouvert");
  assert.ok(!/--vvh|--vvt/.test(c) && /body\.chat-page \{[^}]*height: 100%/.test(c), "la page du chat remplit son cadre");
});
ok("chat : cadres débloqués visibles autour des pdp (anneau propre, pas de filtre sur la photo)", () => {
  const c = read("css/chat3.css");
  assert.ok(/\.chat-app img\.avatar\.cosm-f \{[^}]*filter: none;[^}]*box-shadow:[^}]*var\(--cf/.test(c), "anneau prioritaire sur l'ombre d'avatar du chat");
  assert.ok(/@keyframes chatFrameGlow/.test(c) && /cf-prism[^{]*\{ animation: chatFrameGlow/.test(c.replace(/\n/g, " ")), "animation sans hue-rotate");
  assert.ok(!/\.chat-app img\.avatar\.cosm-f \{[^}]*overflow: visible/.test(c), "la photo reste ronde");
});
ok("chat iPhone : saisie en cours signalée au site, la disposition au-dessus du clavier n'est pas annulée pendant l'animation", () => {
  const j = read("js/chat.js"), e = read("js/chat-embed.js");
  assert.ok(/tell\(\{ ma: "chat-focus" \}\)/.test(j) && /tell\(\{ ma: "chat-blur" \}\)/.test(j), "le chat signale focus et blur");
  assert.ok(/d\.ma === "chat-focus"\) \{ hold = true/.test(e) && /hold && Date\.now\(\) - lastOpenAt < 1200/.test(e), "pas de remise en place pendant la saisie");
});
ok("chat iPhone : hauteur de clavier stable (90 ms), valeurs absurdes ignorées, marge pour la barre d'accessoires iOS", () => {
  const e = read("js/chat-embed.js");
  assert.ok(/stabT = setTimeout\(\(\) => layout\(true\), 90\)/.test(e) && /window\.innerHeight \* 0\.7/.test(e), "stabilisation");
  assert.ok(/\(kbPx \+ 40\) \+ "px"/.test(e), "marge au-dessus de la barre d'accessoires");
});
ok("chat iPhone : saisie remontée dès le toucher (avant le clavier), zone visible suivie sans bouger l'en-tête, conteneurs non défilables", () => {
  const e = read("js/chat-embed.js"), j = read("js/chat.js"), c = read("css/chat3.css");
  assert.ok(/d\.ma === "chat-pre"\) pre\(\)/.test(e) && /function pre\(\)/.test(e) && /ma_kbh/.test(e), "pré-remontée avec la dernière hauteur connue");
  assert.ok(/function pan\(\)/.test(e) && /translate3d\(0,/.test(e) && /vv\.offsetTop/.test(e), "cadre ramené sur la zone visible");
  assert.ok(/tell\(\{ ma: "chat-pre" \}\)/.test(j) && /const still = \(\) =>/.test(j), "le chat annonce le toucher et remet les conteneurs à zéro");
  assert.ok(/@supports \(overflow: clip\) \{ html, body\.chat-page, \.chat-app \{ overflow: clip; \} \}/.test(c), "overflow:clip");
});
ok("chat iPhone : le clavier s'ouvre (barre remontée au relâchement du doigt, focus donné par le chat, repli natif si échec)", () => {
  const j = read("js/chat.js"), c = read("css/chat3.css");
  assert.ok(/input\.addEventListener\("touchend"/.test(j) && /e\.preventDefault\(\);\s*wrap\.style\.setProperty\("--kbp"/.test(j) && /input\.focus\(\{ preventScroll: true \}\)/.test(j), "remontée au relâchement puis focus");
  assert.ok(!/input\.addEventListener\("(touchstart|pointerdown)", \(\) => tell/.test(j), "rien ne bouge pendant le toucher");
  assert.ok(/native = true/.test(j) && /max\(var\(--kb, 0px\), var\(--kbp, 0px\)\)/.test(c), "repli natif et remontée provisoire");
});
