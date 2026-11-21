"use strict";
/** Régressions de l'audit « perfection PC + mobile » : marque, contrastes, défis, traductions */
const { fs, path, assert, jsFiles, read, ok } = require("./_helpers");
let n = 0;


// 1. marque jamais écrite deux fois (« Nissan Nissan Silvia S15 »)
const nameOfSrc = (f) => { const m = read(f).match(/const nameOf = (\(c\) => \{[^\n]*\});/); assert(m, f + " : nameOf introuvable"); return eval("(" + m[1] + ")"); };
["js/catalogue/car-of-day.js", "js/catalogue/fiche-plus.js", "js/studio-home.js"].forEach((f) => ok("nameOf sans doublon : " + f, () => {
  const nameOf = nameOfSrc(f);
  assert.strictEqual(nameOf({ brand: "Nissan", model: "Nissan Silvia S15" }), "Nissan Silvia S15");
  assert.strictEqual(nameOf({ brand: "Mazda", model: "Mazda MX-5 Miata (NA)" }), "Mazda MX-5 Miata");
  assert.strictEqual(nameOf({ brand: "Peugeot", model: "205 GTI (1.9)" }), "Peugeot 205 GTI");
  assert.strictEqual(nameOf({ brand: "Seat", model: "Seatrick" }), "Seat Seatrick");   // pas de faux positif : il faut brand + espace
}));
ok("cartes : la marque n'est pas répétée dans le nom", () => assert(/model\.toLowerCase\(\)\.startsWith\(bl \+ " "\)\) model = model\.slice/.test(read("js/game/cards.js"))));

// 2. lisibilité : puces de la carte et paliers de succès
ok("puces de la carte : texte foncé sur fond translucide", () => assert(/\.mm-bar \.chip\.on \{[^}]*color: var\(--color-ink\)/.test(read("css/themes/refonte.css"))));
ok("paliers argent/or lisibles en clair et en sombre", () => { const c = read("css/components/plus.css"); assert(/\.ac-t\.silver b \{ color: #55657a; \}/.test(c) && /data-tone="dark"\] \.ac-t\.gold b/.test(c)); });

// 3. bouton « ? » : place réservée en haut à droite de l'en-tête
ok("bouton ? : marge réservée dans l'en-tête de page", () => assert(/\.page-head:has\(> \.guide-help\) > :not\(\.page-head-actions\):not\(\.guide-help\) \{ padding-right: 50px; \}/.test(read("css/components/guides.css"))));

// 4. défis : une réponse serveur vide ne fait plus planter la route
ok("défis : réponse sans « items » → message d'erreur, pas d'exception", () => assert(/Array\.isArray\(weekly\.items\)\) throw new Error/.test(read("js/game/play.js"))));

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
  assert(/name: "pilotes", re:/.test(rt) && /PILOT_GROUPS = \[\["espace"[\s\S]*?\["communaute"[\s\S]*?\["classement"/.test(rt));
  ["community", "leaderboard", "pilot", "clubs"].forEach((r) => assert(new RegExp(r + ': "pilotes"').test(rt.match(/const NAV_OF = \{[^\n]*/)[0]), r + " → Pilotes"));
  ["hub-pilotes", "hub-clubs", "hub-classements"].forEach((x) => assert(rt.indexOf('"/communaute/' + x + '"') >= 0, "ancienne adresse " + x + " redirigée"));
  assert(/id="pub-settings-btn"[^>]*href="#\/reglages\/profil"/.test(h) && /pub-settings-btn/.test(read("js/social/profile-edit.js")), "engrenage Réglages dans le profil");
  assert(!/nav-me-btn|touch-me-btn/.test(nv));
  assert(/"data-s"/.test(read("js/i18n.js")), "libellés courts des onglets traduits");
});
ok("Jouer : écran d'entrée à 5 tuiles (Cartes · Boutique · Jeux · Échanges · Défis) ; Échanges est un seul onglet (lot 3)", () => {
  const rt = read("js/router.js"), h = read("index.src.html"), pl = read("js/game/play.js");
  assert(/id="play-hub-apercu"/.test(read("pages/play.html")) && ["cartes", "boutique", "minijeux", "echanges", "defis"].every((k) => pl.indexOf("#/jouer/" + k) >= 0), "écran d'entrée : 5 tuiles Cartes, Boutique, Jeux, Échanges, Défis");
  assert(/echanges: "troc"/.test(rt) && /cardmarket: "troc", wishfeed: "troc"/.test(rt) && /fusion: "cartes"/.test(rt));
  assert(/data-tab="minijeux"[^>]*><div id="play-hub-minijeux"/.test(read("pages/play.html")) && /group === "minijeux"/.test(pl));
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
  assert(!/#\/pilote\/|#\/garage|#\/classement/.test(nv.slice(nv.indexOf("function build"), nv.indexOf("function build") + 1800)), "le reste du menu est ailleurs");
  assert(nv.indexOf("#/pilotes") >= 0 && /chip-avatar/.test(nv), "Mon espace en tête du menu, photo de profil sur le bouton du compte");
  assert(/const inner = !!backTo && !landing/.test(rt), "pages internes de Jouer : retour au lieu de la barre des univers");
});
ok("chat : nouvelle interface (chat3.css) avec onglets Tout / Canaux / Privés, ids conservés", () => {
  const h = read("chat.html"), c = read("css/pages/chat3.css");
  assert(/css\/pages\/chat3\.css/.test(h) && !/chat2\.css|chatglass\.css/.test(h), "chat3 remplace chat2 + chatglass");
  assert(h.indexOf("chat3.css") > h.indexOf("themes-studio.css"), "chargé en dernier");
  ["chat-channels-list", "chat-convs-list", "chat-send-form", "chat-input-message", "chat-messages-container", "dm-picker", "emoji-panel", "side-tabs"].forEach((id) => assert(h.indexOf('id="' + id + '"') >= 0, "#" + id));
  assert(/data-tab="all"[\s\S]*data-tab="channels"[\s\S]*data-tab="dms"/.test(h) && /data-grp="dms"/.test(h));
  assert(/\[data-grp="dms"\]/.test(c) && /@media \(max-width: 860px\)/.test(c));
});
ok("chat v3.2 : page du site (#/chat) intégrée sans rechargement, en-tête flottant, nom cliquable, bulles avec heure", () => {
  const h = read("chat.html"), c = read("css/pages/chat3.css"), g = read("js/chat/chatglass.js"), cp = read("js/chat/chat-plus.js"), ch = read("js/chat/chat.js"), ce = read("js/chat/chat-embed.js"), rt = read("js/router.js"), ix = read("index.src.html");
  assert(/name: "chat", re:/.test(rt) && /chat: "page-chat"/.test(rt) && /chat: "chat"/.test(rt), "route #/chat");
  assert(/id="page-chat"/.test(ix) && /js\/chat\/chat-embed\.js/.test(ix) && /data-nav="chat"/.test(ix) && !/href="chat\.html"/.test(ix), "page + liens vers #/chat");
  assert(/location\.replace\("index\.html#\/chat"/.test(h) && !/id="mobile-touch-bar"/.test(h), "chat.html seul → redirigé ; plus de dock en double");
  assert(/chat-view/.test(ch) && /chat-ready/.test(ch) && /chat-conv/.test(ce) && /on-chat/.test(ce), "la page parente suit la vue (liste / conversation)");
  assert(/html\.chat-conv \.app-header/.test(read("css/themes/refonte.css")), "en-tête masqué dans une conversation (mobile)");
  assert(/id="conv-pill"/.test(h) && /class="back-list fl-btn"/.test(h) && /--fl-bg/.test(c) && /\.compose-wrap \{ position: absolute/.test(c), "pilule + boutons + saisie flottants");
  assert(/chat-nav/.test(g) && /conv-pill/.test(g), "toucher le nom ouvre le profil");
  assert(/LOUPE/.test(cp) && !/textContent = "🔍"/.test(cp), "loupe dessinée, plus d'emoji");
  assert(/class="b-time"/.test(ch) && /class="msg-meta"/.test(ch), "heure dans la bulle, pseudo + admin + titre dans la bulle");
});
ok("croix et boutons : croix dessinées automatiquement, barre du haut à hauteur unique, plus de double croix dans la recherche", () => {
  assert(/x-drawn/.test(read("js/a11y.js")) && /\.x-drawn::before/.test(read("css/base/base.css")));
  assert(/--hb: 40px/.test(read("css/themes/refonte.css")) && /spot-field input::-webkit-search-cancel-button/.test(read("css/themes/refonte.css")));
});
ok("style flottant : verre de la barre du bas sur tout le site (en-tête en pastilles, boutons, retours, onglets), serif moins étiré", () => {
  const f = read("css/components/float.css"), h = read("index.src.html");
  assert(/css\/components\/float\.css/.test(h) && h.indexOf("css/components/float.css") > h.indexOf("css/themes/themes-studio.css"), "float.css chargé en dernier");
  assert(/\.brand-link[^}]*backdrop-filter/.test(f) && /\.desktop-navigation[^}]*backdrop-filter/.test(f) && /\.back-link/.test(f) && /\.play-back/.test(f) && /\.page-tabs/.test(f) && /\.seg-btn/.test(f), "pastilles, retours et onglets en verre");
  assert(/prefers-reduced-transparency/.test(f) && /@supports not/.test(f), "repli sans transparence");
  assert(!/\.toolbar-cluster\s*\{[^}]*border-radius: 999px/.test(f), "le panneau de filtres n'est pas une bulle");
  assert(/letter-spacing: \.004em/.test(f) && /line-height: 1\.1/.test(f), "serif : crénage et interligne détendus");
});
ok("barre du haut : mêmes dimensions que le chat (50 px), pas de rectangle au repli, onglet actif = pilule qui épouse la barre", () => {
  const f = read("css/components/float.css");
  assert(/html \{ --hb: 50px; \}/.test(f), "pastilles de 50 px comme dans le chat");
  assert(/html\[data-anim\] \.app-header\.is-scrolling[^{]*\{[^}]*background: none !important/.test(f), "plus de fond plein pendant le défilement");
  assert(/\.app-header\.hide-up \.brand-link/.test(f) && /transform: none !important;/.test(f), "repli pastille par pastille, sans parent animé");
  assert(/\.page-tabs\.fit \.page-tab \{ border-radius: 999px !important/.test(f) && /align-self: stretch/.test(f), "onglet actif : pilule pleine hauteur de la barre");
  assert(/html\.on-chat, html\.on-chat body \{ background: var\(--bg-core\)/.test(f), "fond du chat sans bandeau");
});
ok("bouton PRO en verre, navigation compacte en dock, menu roue en verre, filtres du catalogue compacts sur mobile", () => {
  const f = read("css/components/float.css");
  assert(/\.mp-chip \{ color: var\(--color-ink\) !important/.test(f) && /\.mp-chip:active \{ transform: scale\(\.92\)/.test(f), "PRO = même verre et mêmes animations");
  assert(/max-width: 1279px\)/.test(f) && /\.nav-link \{ flex-direction: column/.test(f), "nav compacte : icône au-dessus du libellé");
  assert(/html \.me-sheet \{ background: color-mix\(in srgb, var\(--bg-surface\) 58%/.test(f), "menu de la roue crantée translucide");
  assert(/max-width: 700px\)[\s\S]*grid-template-columns: minmax\(0,1fr\) minmax\(0,1fr\) auto/.test(f) && /\.side-label \{ display: none/.test(f), "filtres du catalogue : 2 rangées défilantes + marque / tri / filtres");
});
console.log(n + " vérifications audit OK");
