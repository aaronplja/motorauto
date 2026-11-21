"use strict";
/** Série z8 à z11 : démarrage, connexion, tutoriels, avatars, chat iPhone */
const { fs, path, assert, jsFiles, read, ok } = require("./_helpers");
const dict = (l) => { const m = []; new Function("window", read("js/i18n/" + l + ".js"))({ __MA_DICT: m }); const o = {}; m.forEach((e) => Object.assign(o, e[1])); return o; };
const en = dict("en");

// ---- démarrage D2 + chargement C8 + icône noire
ok("démarrage D2 (tracé), chargement C8 (respiration) et icône noire", () => {
  const src = read("index.src.html");
  assert.ok(/<style id="splash-css">[\s\S]*spDraw[\s\S]*Big Shoulders Display/.test(src), "splash : tracé + police du logo");
  assert.ok(!/sp-line/.test(src), "plus de barre de progression dans le splash");
  assert.ok(/href="css\/components\/brand-loader\.css"/.test(src) && /brand-loader\.css/.test(read("chat.html")), "feuille du chargement liée (site + chat)");
  const bl = read("css/components/brand-loader.css");
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
  assert.ok(/#auth-modal \.modal-dialog\.auth-box/.test(read("css/components/float.css")));
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
  const c = read("css/pages/chat3.css");
  assert.ok(/\.conv-badge \.avatar \{ position: absolute; inset: 0;[^}]*object-fit: cover/.test(c), "avatar du badge en absolu 100 %");
  assert.ok(/aspect-ratio: 1 \/ 1/.test(read("css/components/float.css")), "avatars ronds : ratio 1/1");
});
ok("accueil : un seul bandeau garage (pas de dessins concurrents)", () => {
  const g = read("js/garage-home.js");
  assert.ok(/let painting = false/.test(g) && /async function paint1\(/.test(g), "verrou anti-chevauchement");
  assert.ok(/querySelectorAll\("#home-garage"\)\.forEach\(\(x, i\) => \{ if \(i\) x\.remove\(\); \}\)/.test(g), "doublons retirés");
});
ok("filtre : glissement sans rebond", () => {
  const t = read("css/themes/themefix.css");
  assert.ok(/animation:adv-up \.26s cubic-bezier\(\.22,\.9,\.3,1\)/.test(t) && !/adv-up \.28s var\(--m-spring/.test(t));
});
ok("chat iPhone : page redimensionnée seulement clavier ouvert, saisie au niveau du dock, plus de date flottante", () => {
  const j = read("js/chat/chat.js"), e = read("js/chat/chat-embed.js"), c = read("css/pages/chat3.css");
  assert.ok(!/--vvh/.test(j) && /window\.addEventListener\("resize", fit\)/.test(j), "le chat ne mesure plus le clavier lui-même");
  assert.ok(/chat-blur/.test(j) && /chat-blur/.test(e) && /function settle\(\)/.test(e), "page du site remise en place après le clavier");
  assert.ok(/max\(6px, calc\(var\(--safe-bottom, 0px\) - 12px\)\)/.test(c), "saisie au niveau du dock");
  assert.ok(/\.day-sep \{ position: static;/.test(c) && !/\.day-sep \{[^}]*position: sticky/.test(c), "date non collante");
});

// ---- série z10 : chat iPhone (hauteur réduite après le clavier, recouvrement en haut)
ok("chat iPhone : recalcul de la hauteur après le clavier, salon sous la barre du haut, voile en haut de conversation", () => {
  const e = read("js/chat/chat-embed.js"), g = read("js/glassbar.js"), c = read("css/pages/chat3.css");
  assert.ok(/let peak = window\.innerHeight/.test(e) && /function remeasure\(\)/.test(e) && /sentinel\.style\.display = "none"/.test(e), "contournement du bug de hauteur iOS");
  assert.ok(/function fitTop\(\)/.test(e) && /getBoundingClientRect\(\)\.bottom/.test(e), "le salon commence sous la barre réelle");
  assert.ok(/box: "border-box"/.test(g) && /addEventListener\("resize", setH\)/.test(g), "hauteur de la barre du haut recalculée (encoche comprise)");
  assert.ok(/\.conv-head::before \{ display: block !important;[^}]*linear-gradient/.test(c), "voile sous l'heure en conversation");
});

// ---- série z11 : chat iPhone (décalage persistant, saisie sous le clavier, cadres débloqués)
ok("chat iPhone : seule la saisie suit le clavier (--kb), cadre et liste immobiles, page du site défilable pour revenir à sa place", () => {
  const e = read("js/chat/chat-embed.js"), r = read("css/themes/refonte.css"), c = read("css/pages/chat.css"), c3 = read("css/pages/chat3.css");
  assert.ok(/function layout\(now\)/.test(e) && /window\.innerHeight - vv\.height/.test(e) && /"--kb"/.test(e), "hauteur du clavier transmise au chat");
  assert.ok(!/host\.style\.bottom = bottom/.test(e) && /host\.style\.top = topBase; host\.style\.bottom = "";/.test(e), "le cadre ne bouge pas");
  assert.ok(/translate3d\(0, calc\(-1 \* max\(var\(--kb, 0px\), var\(--kbp, 0px\)\)\), 0\)/.test(c3), "la saisie monte avec le clavier");
  assert.ok(/classList\.toggle\("chat-kb", open\)/.test(e) && /kbOpen \? 0 : px\(cs\.paddingBottom\)/.test(e), "marge basse nulle clavier ouvert, dock masqué");
  assert.ok(/html\.on-chat \{ overflow-x: hidden; overflow-y: auto;/.test(r) && /min-height: calc\(100dvh \+ 2px\)/.test(r) && !/html\.on-chat, html\.on-chat body \{ overflow: hidden; \}/.test(r), "plus d'overflow:hidden sur la page du site");
  assert.ok(/html\.chat-kb #mobile-touch-bar \{ display: none/.test(r), "dock masqué clavier ouvert");
  assert.ok(!/--vvh|--vvt/.test(c) && /body\.chat-page \{[^}]*height: 100%/.test(c), "la page du chat remplit son cadre");
});
ok("chat : cadres débloqués visibles autour des pdp (anneau propre, pas de filtre sur la photo)", () => {
  const c = read("css/pages/chat3.css");
  assert.ok(/\.chat-app img\.avatar\.cosm-f \{[^}]*filter: none;[^}]*box-shadow:[^}]*var\(--cf/.test(c), "anneau prioritaire sur l'ombre d'avatar du chat");
  assert.ok(/@keyframes chatFrameGlow/.test(c) && /cf-prism[^{]*\{ animation: chatFrameGlow/.test(c.replace(/\n/g, " ")), "animation sans hue-rotate");
  assert.ok(!/\.chat-app img\.avatar\.cosm-f \{[^}]*overflow: visible/.test(c), "la photo reste ronde");
});
ok("chat iPhone : saisie en cours signalée au site, la disposition au-dessus du clavier n'est pas annulée pendant l'animation", () => {
  const j = read("js/chat/chat.js"), e = read("js/chat/chat-embed.js");
  assert.ok(/tell\(\{ ma: "chat-focus" \}\)/.test(j) && /tell\(\{ ma: "chat-blur" \}\)/.test(j), "le chat signale focus et blur");
  assert.ok(/d\.ma === "chat-focus"\) \{ hold = true/.test(e) && /hold && Date\.now\(\) - lastOpenAt < 1200/.test(e), "pas de remise en place pendant la saisie");
});
ok("chat iPhone : hauteur de clavier stable (90 ms), valeurs absurdes ignorées, marge pour la barre d'accessoires iOS", () => {
  const e = read("js/chat/chat-embed.js");
  assert.ok(/stabT = setTimeout\(\(\) => layout\(true\), 90\)/.test(e) && /window\.innerHeight \* 0\.7/.test(e), "stabilisation");
  assert.ok(/\(kbPx \+ 8\) \+ "px"/.test(e), "marge au-dessus de la barre d'accessoires");
});
ok("chat iPhone : saisie remontée dès le toucher (avant le clavier), zone visible suivie sans bouger l'en-tête, conteneurs non défilables", () => {
  const e = read("js/chat/chat-embed.js"), j = read("js/chat/chat.js"), c = read("css/pages/chat3.css");
  assert.ok(/d\.ma === "chat-pre"\) pre\(\)/.test(e) && /function pre\(\)/.test(e) && /ma_kbh/.test(e), "pré-remontée avec la dernière hauteur connue");
  assert.ok(/function pan\(\)/.test(e) && /translate3d\(0,/.test(e) && /vv\.offsetTop/.test(e), "cadre ramené sur la zone visible");
  assert.ok(/tell\(\{ ma: "chat-pre" \}\)/.test(j) && /const still = \(\) =>/.test(j), "le chat annonce le toucher et remet les conteneurs à zéro");
  assert.ok(/@supports \(overflow: clip\) \{ html, body\.chat-page, \.chat-app \{ overflow: clip; \} \}/.test(c), "overflow:clip");
});
ok("chat iPhone : le clavier s'ouvre (barre remontée au relâchement du doigt, focus donné par le chat, repli natif si échec)", () => {
  const j = read("js/chat/chat.js"), c = read("css/pages/chat3.css");
  assert.ok(/input\.addEventListener\("touchend"/.test(j) && /e\.preventDefault\(\);\s*wrap\.style\.setProperty\("--kbp"/.test(j) && /input\.focus\(\{ preventScroll: true \}\)/.test(j), "remontée au relâchement puis focus");
  assert.ok(!/input\.addEventListener\("(touchstart|pointerdown)", \(\) => tell/.test(j), "rien ne bouge pendant le toucher");
  assert.ok(/native = true/.test(j) && /max\(var\(--kb, 0px\), var\(--kbp, 0px\)\)/.test(c), "repli natif et remontée provisoire");
});
ok("démarrage rapide : comparateurs réutilisés, recherche calculée à la demande, logos testés par index, images du catalogue différées", () => {
  const a = read("js/app.js"), u = read("js/utils.js"), b = read("js/catalogue/brand-logos.js"), cd = read("js/game/cards.js");
  assert.ok(/const COLL = new Intl\.Collator\("fr"\), COLL_NUM = new Intl\.Collator\("fr", \{ numeric: true \}\)/.test(a), "comparateurs créés une fois");
  assert.ok(!/localeCompare\([^)]*"fr"/.test(a), "plus de localeCompare(…, \"fr\") dans app.js (recréé à chaque comparaison)");
  assert.ok(/COLL_FR\.compare\(a\.brand, b\.brand\)/.test(cd), "tri des cartes par marque");
  assert.ok(/lazy\("searchBlob"/.test(u) && /lazy\("searchTokens"/.test(u), "texte de recherche calculé à la première recherche");
  assert.ok(/loadFileKeys\(\)\.then\(\(list\) => \(list\.length \? list\.indexOf\(k\) >= 0 : probe\(k\)\)\)/.test(b), "logos : une requête (index.json) au lieu d'un test par marque");
  assert.ok(/\$\{lazy \? 'loading="lazy" decoding="async"' : ""\}/.test(a), "images des cartes du catalogue différées");
  assert.ok(/requestAnimationFrame\(\(\) => \{ gliderRaf = 0; placeGlider\(gliderTarget\); \}\)/.test(a), "mesures de la navigation regroupées");
});
ok("pack ouvert sur mobile : les boutons de fin prennent la case libre de la grille (plus de chevauchement avec le récapitulatif)", () => {
  const j = read("js/game/cards.js"), c = read("css/base/polish.css");
  assert.ok(/endBox\.classList\.add\("in-grid"\); grid\.appendChild\(endBox\)/.test(j) && /results\.length % cols !== 0/.test(j), "déplacement dans la grille quand la dernière ligne n'est pas pleine");
  assert.ok(/\.pk3 \.tcg-flips > #tcg-end\.in-grid \{ position: static;/.test(c), "boutons empilés, hors position collante");
});
ok("quiz : le serveur rejoue les mêmes questions que le site (même catalogue de jeu pour les voitures de Firestore, ordre et contenu)", () => {
  const vm = require("vm"), fs2 = require("fs"), G = require("../js/game-core.js"), MA = require("../js/utils.js");
  const idx = read("functions/index.js"), m = /function poolEntry\(id, x\) \{[\s\S]*?\n\}\n/.exec(idx);
  assert.ok(m, "poolEntry présent dans functions/index.js");
  const poolEntry = vm.runInNewContext("(" + m[0].replace(/^function poolEntry/, "function") + ")", { gameCore: G, Object, Array, Number, String, Math, parseFloat });
  const docs = [
    { id: "t-1", brand: "Test", model: "Un", years: "1998 - 2004", category: "", phases: [{ engines: [{ name: "a", power: "150", speed: 210, zeroToHundred: "7,9" }, { name: "b", power: 200, speed: "230", zeroToHundred: 6.5 }] }] },
    { id: "t-2", brand: "Test", model: "Deux", years: "2010", phases: [] },
    { id: "t-3", brand: "Test", model: "Trois" }
  ];
  const clientEntry = (raw) => { const c = MA.normalizeCar(raw); return { id: c.id, power: Number(c.stats && c.stats.power) || 0, speed: Number(c.stats && c.stats.speed) || 0, zero: Number(c.stats && c.stats.zero) || 0, name: ((c.brand || "") + " " + (c.model || "")).trim(), brand: c.brand || "", category: c.category || "", year: G.yearOf(c) }; };
  docs.forEach((d) => { const a = clientEntry(d), b = poolEntry(d.id, d); ["id", "power", "speed", "zero", "name", "brand", "category", "year"].forEach((k) => assert.strictEqual(b[k], a[k], d.id + " : " + k)); });
  // parties identiques de part et d'autre avec ces voitures en plus du catalogue
  const stat = JSON.parse(fs2.readFileSync(require("path").join(__dirname, "..", "functions/catalog-static.json"), "utf8"));
  const client = stat.map((c) => Object.assign({}, c)).concat(docs.map(clientEntry)), server = stat.map((c) => Object.assign({}, c)).concat(docs.map((d) => poolEntry(d.id, d)));
  Object.keys(G.QCATS).forEach((cat) => [1, 3].forEach((lv) => { const seed = "t" + cat + lv, A = G.quizBuild(seed, cat, lv, client), B = G.quizBuild(seed, cat, lv, server); assert.deepStrictEqual(A.map((q) => [q.q, q.a, q.m]), B.map((q) => [q.q, q.a, q.m]), cat + lv); }));
});
ok("bandeau Comparer / bouton flottant / passe de saison : plus de chevauchement ni de mot coupé", () => {
  const t = read("css/themes/themefix.css"), s = read("css/pages/season.css");
  assert.ok(/#compare-go\{flex:none;white-space:nowrap\}/.test(t), "bouton Comparer sur une ligne");
  assert.ok(/#compare-tray:not\(\[hidden\]\)~\.fab-pack\{bottom:calc\(10\.1rem/.test(t), "bouton flottant au-dessus du bandeau");
  assert.ok(/\.ssn-left small\{display:block;overflow-wrap:normal;word-break:keep-all/.test(s), "libellé du niveau de saison non coupé");
});
ok("traductions : les libellés de jeu, de marque et d'accueil ajoutés existent dans les 4 langues", () => {
  const keys = ["Retour au catalogue", "Objectif d'équipe", "pour le niveau", "cartes pour compléter la collection", "Tous les modèles", "secondes de 0 à 100", "{0} à faire · nouvelles à minuit", "Ouvre un pack {0}", "Ouvre 3 packs", "Flamme", "Platine", "Tueur de géants", "2026 MOTORAUTOFR - by aaronplja / Tous droits réservés", "contient une carte rare ou mieux, garantie"];
  ["en", "es", "de", "it"].forEach((l) => { const d = dict(l); keys.forEach((k) => assert.ok(d[k] && d[k].trim(), l + " : manque « " + k + " »")); });
  assert.ok(Object.keys(dict("en")).length === Object.keys(dict("es")).length && Object.keys(dict("de")).length === Object.keys(dict("it")).length && Object.keys(dict("en")).length === Object.keys(dict("de")).length, "mêmes clés dans les 4 langues");
});
ok("frise : pastilles hors écran non dessinées (content-visibility), pastilles-points exclues", () => assert.ok(/\.fr-chip:not\(\.fr-mini\)\{content-visibility:auto;contain-intrinsic-size:128px 52px\}/.test(read("css/components/plus.css"))));
ok("quiz, chrono, survie : le site joue les questions envoyées par le serveur (plus de reconstruction côté site), repli prévu si le serveur n'est pas à jour", () => {
  const m = read("js/game/minigames.js"), q = read("js/game/quiz-plus.js"), g = read("functions/game.js"), i = read("functions/index.js");
  assert.ok(/MAGameAPI\.call\("quizSubmit", \{ op: "start", cat, level, lang: lang\(\) \}\)/.test(m), "partie notée lancée par le serveur");
  assert.ok(/qz\.seed = r\.seed; qz\.qs = fromServer\(r\.qs\)/.test(m), "questions du serveur affichées telles quelles");
  assert.ok(/e\.code === "invalid-argument"\) old = true/.test(m) && /G\.quizBuild\(qz\.seed, cat, level, quizPool\(\)/.test(m), "repli sur l'ancienne méthode si le serveur n'a pas encore la mise à jour");
  assert.ok(/Array\.isArray\(r\.qs\) && r\.qs\.length \? fromServer\(r\.qs\) : G\.chronoQuestions/.test(m), "chrono : questions du serveur");
  assert.ok(/Array\.isArray\(r\.qs\) && r\.qs\.length \? \(lang\(\) === "fr" \? r\.qs/.test(q), "survie : questions du serveur");
  assert.ok(/g\.quizCur = \{ seed, cat, level, key: keyOf\(qs\), t0: now\(\) \}/.test(g) && /questions = keyQs\(cur\.key\)/.test(g) && /delete g\.quizCur/.test(g), "clé de correction gardée par le serveur puis effacée");
  assert.ok(/qs = c\.key \? keyQs\(c\.key\) : core\.chronoQuestions/.test(g) && /qs = c\.key \? keyQs\(c\.key\) : core\.survivalQuestions/.test(g), "chrono et survie corrigés avec la clé enregistrée");
  assert.strictEqual(read("js/game-engine.js"), g, "js/game-engine.js identique à functions/game.js");
  assert.ok(/collection\("motorauto_catalog"\)\.limit\(5000\)/.test(i), "le serveur lit tout le catalogue en ligne, comme le site");
});
ok("clignotements et sauts : pied de page hors écran pendant les chargements, badges de « Mon espace » gardés en place", () => {
  const p = read("css/pages/pages.css"), t = read("css/themes/themefix.css"), a = read("js/app.js");
  assert.ok(/\.app-pages \{ min-height: 100vh; min-height: 100dvh; outline: none; \}/.test(p), "zone de page haute d'un écran au minimum");
  assert.ok(/#garage-badges:empty\{display:block;min-height:39px\}/.test(t), "place réservée pour la ligne des badges");
  assert.ok(/if \(gb\.dataset\.uid !== who\) \{ gb\.innerHTML = ""; gb\.dataset\.uid = who; \}/.test(a) && !/\$\("garage-badges"\)\.innerHTML = "";\n    if \(currentUser\)/.test(a), "badges non vidés à chaque rendu");
});
ok("voiture du jour (téléphone), niveaux du quiz (ordinateur), bandeau Comparer dans le salon", () => {
  const t = read("css/themes/themefix.css");
  assert.ok(/@media \(max-width:480px\)\{#page-main \.cod-card img,#page-main \.cod-ph\{width:104px;height:72px\}/.test(t), "photo de la voiture du jour réduite sur téléphone");
  assert.ok(/\.qz-cat\{container-type:inline-size\}/.test(t) && /@container \(max-width:318px\)\{\.qz-cat \.qz-levels\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important\}\}/.test(t), "niveaux en 2 × 2 quand 4 ne tiennent pas");
  assert.ok(/html\.on-chat #compare-tray\{display:none!important\}/.test(t), "bandeau Comparer masqué dans le salon");
  assert.ok(!require("fs").existsSync(require("path").join(__dirname, "..", "css/chat2.css")) && !require("fs").existsSync(require("path").join(__dirname, "..", "css/chatglass.css")), "anciennes feuilles du salon supprimées");
  assert.ok(/Touche « Nouveau » pour écrire à un pilote\./.test(read("js/chat/chat.js")), "texte d'aide du salon sans pictogramme décalé");
});
ok("site ouvert depuis longtemps : il se recharge seul quand une nouvelle version est en ligne (hors saisie, partie ou salon), une seule fois par version", () => {
  const u = read("js/update-check.js"), s = read("index.src.html");
  assert.ok(/<script defer src="js\/update-check\.js"><\/script>/.test(s), "script chargé par la page");
  assert.ok(/cache: "no-store"/.test(u) && /next !== mine/.test(u), "comparaison avec la page réellement servie");
  assert.ok(/tried\(\) === target/.test(u) && /sessionStorage\.setItem\("ma_upd", target\)/.test(u), "un seul rechargement par version");
  assert.ok(/!typing\(\) && !playing\(\)/.test(u) && /on-chat/.test(u) && /\.qz-card/.test(u), "jamais pendant une saisie, une partie ou dans le salon");
});
ok("traductions : salon entièrement traduit et questions de quiz écrites disponibles en anglais", () => {
  const keys = ["Salon général", "Chercher un canal ou un pilote", "Écris un message…", "Aucun message pour l'instant", "Sois le premier à écrire dans ce canal.", "Enregistrer un message vocal", "Supprimer ce message pour tout le monde ?", "Envoi impossible : {0}", "Laquelle de ces voitures est japonaise ?"];
  ["en", "es", "de", "it"].forEach((l) => { const d = dict(l); keys.forEach((k) => assert.ok(d[k] && d[k].trim(), l + " : manque « " + k + " »")); });
  const B = require("../js/game-core.js").QBANK;
  assert.strictEqual(B.filter((b) => b[4] === b[2]).length, 0, "plus aucune question écrite restée en français dans la version anglaise");
  assert.ok(B.every((b) => b[5].length === b[3].length && new Set(b[5]).size === b[5].length), "mêmes réponses, dans le même ordre, sans doublon");
});
ok("points de quiz comptés dans l'XP (site et serveur), barre du profil public calée sur la vraie barre du haut, case de rappel stylée, animation d'apparition des pages", () => {
  const core = require("../js/game-core.js"), fcore = require("../functions/game-core.js");
  [core, fcore].forEach((c) => {
    const a = c.finish(Object.assign(c.BLANK_STATS(), { quizPts: 0 }), 100), b = c.finish(Object.assign(c.BLANK_STATS(), { quizPts: 40 }), 100);
    assert.ok(b.xp >= a.xp + 120, "chaque point de quiz rapporte 3 XP");
  });
  assert.ok(/s\.quizPts = Number\(x\.quizPts\) \|\| 0/.test(read("js/game/gamify.js")), "le site lit les points de quiz");
  const g = read("functions/game.js");
  assert.ok(/col\("gstats"\)\.doc\(uid\)\.get\(\)/.test(g) && /s\.quizPts = Number\(x\.quizPts\) \|\| 0/.test(g), "le serveur lit aussi les compteurs de jeu pour l'XP");
  const v = read("css/components/profile-v2.css");
  assert.ok(/#public-profile-modal \.pro-tabs \{ position: sticky; top: calc\(var\(--hdr-h, 64px\) \+ 6px\)/.test(v) && /html\.hdr-hidden #public-profile-modal \.pro-tabs \{ top: calc\(var\(--safe-top, 0px\) \+ 8px\); \}/.test(v), "onglets du profil sous la barre du haut, remontent quand elle se cache");
  const t = read("css/themes/themefix.css");
  assert.ok(/\.cod-notif input\[type="checkbox"\] \{ appearance: none;/.test(t) && /\.cod-notif input\[type="checkbox"\]:checked::after/.test(t), "case de rappel quotidien stylée");
  const r = read("css/base/reveal.css"), s = read("index.src.html");
  assert.ok(/<link rel="stylesheet" href="css\/base\/reveal\.css">/.test(s) && s.indexOf("css/base/reveal.css") > s.indexOf("css/pages/pro.css"), "feuille chargée en dernier");
  assert.ok(/@keyframes rvUp/.test(r) && /\.rv1/.test(r) && /\.rv2/.test(r) && /prefers-reduced-motion: no-preference/.test(r) && /data-anim="reduced"/.test(r), "apparition échelonnée, coupée en mouvement réduit");
  assert.ok(!/(^|[^-])(width|height|top|left|margin)\s*:/.test(r.replace(/@keyframes[\s\S]*?\}\s*\}/g, "")), "opacité et translation uniquement : aucun décalage de mise en page");
});
ok("apparition des pages sans clignotement, espace Pilotes harmonisé, croix uniformes, catalogue dessiné à l'ouverture", () => {
  const rv = read("js/page-reveal.js"), idx = read("index.src.html");
  assert.ok(/<script defer src="js\/page-reveal\.js"><\/script>/.test(idx), "script chargé par la page");
  assert.ok(/classList\.add\(cls\)/.test(rv) && /page-chat/.test(rv) && /"ma:route"/.test(rv), "seuls les blocs présents au changement de page sont étiquetés, jamais le salon");
  const rt = read("js/router.js");
  assert.ok(!/\["Carte", "#\/communaute\/carte"/.test(rt) && /tab === "evenements" \|\| r\.params\.tab === "carte"/.test(rt), "Sorties et Carte réunies dans la barre de la communauté");
  assert.ok(/wrap\.insertBefore\(nav, wrap\.firstElementChild\)/.test(rt), "barre de l'espace Pilotes toujours en tête de page");
  const ps = read("css/components/pilotspace.css");
  assert.ok(/nav\[data-section="pilotes"\]\.play-bar:not\(\.inner\)/.test(ps) && /html \.play-bar\.inner \.play-back \{ align-self: stretch/.test(ps), "carte de navigation unique et bouton retour aligné");
  assert.ok(/css\/components\/pilotspace\.css/.test(idx) && /css\/base\/closebtn\.css/.test(idx), "feuilles chargées");
  const cb = read("css/base/closebtn.css");
  ["dialog-close-btn", "ov-x", "ac-x", "guide-x", "me-close", "pe-x", "vt-x", "lightbox-x", "lightbox-close"].forEach((c) => assert.ok(cb.indexOf("." + c) >= 0, "croix : " + c));
  assert.ok(/display: inline-flex !important; align-items: center; justify-content: center/.test(cb) && /mask: var\(--x-mask\)/.test(cb), "croix dessinée au centre exact");
  assert.ok(/const catalogShown = /.test(read("js/app.js")) && /if \(!catalogShown\(\) && !\(opts && opts\.force\)\) \{ updateGauge\(heroMatches\(\)\); return; \}/.test(read("js/app.js")), "catalogue dessiné seulement quand on l'ouvre");
});
ok("sécurité : règles anti-triche, en-têtes Vercel, échappement des listes d'options", () => {
  const rules = read("firestore.rules");
  const blk = (n) => { const i = rules.indexOf("match /" + n + "/{"); return rules.slice(i, rules.indexOf("\n    }\n", i)); };
  ["streaks", "gstats", "weekly"].forEach((n) => assert.ok(/allow create, update: if isAdmin\(\);/.test(blk(n)) && !/isOwner/.test(blk(n).replace(/allow read: if isOwner\(wid\) \|\| isAdmin\(\);/, "")), n + " : écriture réservée au serveur"));
  assert.ok(/allow read: if signedIn\(\);/.test(blk("pilot_locations")), "carte des pilotes réservée aux connectés");
  assert.ok(!/validGStats/.test(rules), "ancienne règle de compteurs supprimée");
  assert.ok(!/'email'/.test(blk("users")), "aucun champ e-mail dans les profils publics");
  const v = JSON.parse(read("vercel.json")), h = {}; v.headers.forEach((x) => x.headers.forEach((y) => { h[y.key] = y.value; }));
  ["X-Frame-Options", "Strict-Transport-Security", "Permissions-Policy", "Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy"].forEach((k) => assert.ok(h[k], "en-tête " + k));
  assert.ok(/frame-ancestors 'self'/.test(h["Content-Security-Policy"]) && /object-src 'none'/.test(h["Content-Security-Policy"]) && /gstatic\.com/.test(h["Content-Security-Policy"]), "politique couvrant Firebase");
  assert.ok(/<option value="\$\{esc\(c\.text\)\}">\$\{esc\(c\.title\)\}<\/option>/.test(read("js/chat/chat.js")), "réponses rapides échappées");
  // aucune donnée de pilote injectée sans échappement dans un innerHTML (contrôle strict, sur une même ligne)
  const fs = require("fs"), path = require("path"), bad = [];
  jsFiles().filter((f) => /\.js$/.test(f) && !/bundle|lazy|^data-|^game-|car-index|car-variants/.test(f)).forEach((f) => {
    fs.readFileSync(path.join(__dirname, "../js", f), "utf8").split("\n").forEach((l, i) => { if (/innerHTML|insertAdjacentHTML/.test(l) && /\$\{[^}]*\.(username|bio|pilot|message|currentCar|city)\b[^}]*\}/.test(l) && !/esc\(|T\(|\.length/.test(l)) bad.push(f + ":" + (i + 1)); });
  });
  assert.deepStrictEqual(bad, [], "données de pilote sans échappement : " + bad.join(", "));
  assert.ok(fs.existsSync(path.join(__dirname, "../docs/SECURITE.md")), "guide des réglages de console");
});
ok("fiabilité : minuteries en pause en arrière-plan, observateurs limités, confirmation unique, bouton Réessayer, raison de la connexion", () => {
  const idx = read("index.src.html"), t = read("js/timers.js");
  assert.ok(/js\/timers\.js/.test(idx) && idx.indexOf("js/timers.js") < idx.indexOf("js/firebase-init.js"), "minuteries chargées en premier");
  assert.ok(/ms <= 5000/.test(t) && /document\.hidden/.test(t), "pause des répétitions rapides en arrière-plan");
  assert.ok(/document\.body\.dataset\.page === "chat" \|\| curKey \|\| searchBar/.test(read("js/chat/chat-plus.js")) && /requestAnimationFrame/.test(read("js/chat/chat-plus.js")), "salon : un seul passage par image, seulement dans le salon");
  assert.ok(/\(catalog\|compare\)/.test(read("js/catalogue/catalog-ui.js")) && /\^clubs\?\$/.test(read("js/social/clubs-plus.js")), "interrogations limitées à leur page");
  assert.ok(/watching/.test(read("js/game/seasonal.js")), "un seul écouteur des saisons");
  const c = read("js/common.js");
  assert.ok(/MA\.confirm = function/.test(c) && /role", "alertdialog"/.test(c) && /e\.key === "Escape"/.test(c), "confirmation accessible (Échap, focus)");
  const fs = require("fs"), path = require("path"); let native = [];
  ["app", "game/cards", "chat/chat", "social/clubs", "social/clubs-plus", "social/community", "game/contest", "social/event-albums", "garage-extra", "garage-tools", "game/market", "news", "pro", "social/social"].forEach((f) => {
    fs.readFileSync(path.join(__dirname, "../js", f + ".js"), "utf8").split("\n").forEach((l, i) => { if (/(^|[^.\w])confirm\(/.test(l.replace(/MA\.confirm\(/g, ""))) native.push(f + ":" + (i + 1)); });
  });
  assert.deepStrictEqual(native, [], "plus aucune fenêtre native confirm() côté pilote : " + native.join(", "));
  assert.ok(/reload\(\) \{ return dispatch\(\); \}/.test(read("js/router.js")) && /empty-note\.error/.test(read("js/retry.js")) && /js\/retry\.js/.test(idx), "bouton Réessayer");
  const a = read("js/app.js");
  assert.ok(/function askLogin\(reason, path\)/.test(a) && /id="auth-reason"/.test(idx) && /Connecte-toi pour retrouver ton garage/.test(a), "fenêtre de connexion avec la raison et retour à la page voulue");
  ["en", "es", "de", "it"].forEach((l) => { const d = dict(l); ["Réessayer", "Annuler", "Confirmer", "Connecte-toi pour retrouver ton garage, tes voitures et ton suivi."].forEach((k) => assert.ok(d[k], l + " : manque " + k)); });
});
ok("compte : mot de passe oublié, vérification d'e-mail, suppression, page 404, confidentialité groupée, notifications groupées", () => {
  const idx = read("index.src.html"), acc = read("js/account.js"), rt = read("js/router.js"), cm = read("js/common.js"), app = read("js/app.js");
  assert.ok(/id="forgot-password-btn"/.test(idx) && /sendPasswordResetEmail/.test(acc) && /Si un compte existe avec cette adresse/.test(acc), "mot de passe oublié, réponse neutre");
  assert.ok(/sendEmailVerification/.test(app) && /sendEmailVerification/.test(acc) && /id="verify-banner"/.test(idx) && /providerId === "password"/.test(acc), "vérification d'e-mail non bloquante, comptes Google exclus");
  assert.ok(/deleteAccount/.test(acc) && /exports\.deleteAccount/.test(read("functions/index.js")), "suppression de compte côté serveur");
  assert.ok(/name: "notfound"/.test(rt) && /id="page-notfound"/.test(idx) && /\^#\\\/\./.test(rt), "page 404 pour les adresses inconnues, ancres simples épargnées");
  assert.ok(/class="priv-sub"/.test(idx) && !/🔐/.test(idx.slice(idx.indexOf("priv-group"), idx.indexOf("priv-group") + 400)), "confidentialité en groupes, sans emoji");
  ["settings-public-garage", "settings-hide-following", "settings-hide-followers", "settings-show-presence", "settings-email-notifs"].forEach((id) => assert.ok(idx.includes('id="' + id + '"'), "réglage conservé : " + id));
  assert.ok(/function grouped\(\)/.test(cm) && /function removeMany/.test(cm) && /GROUPABLE/.test(cm), "notifications groupées (like, abonnement, sortie)");
  assert.ok(/css\/components\/account\.css/.test(idx), "feuille de style du compte");
  ["en", "es", "de", "it"].forEach((l) => { const d = dict(l); ["Mot de passe oublié ?", "Renvoyer l'e-mail", "Cette page n'existe pas", "Présence"].forEach((k) => assert.ok(d[k], l + " : manque " + k)); });
});
ok("design system : en-tête unique, échelle de texte ≥ 12 px, cartes et boutons homogènes, émojis → icônes, onglet mémorisé, bouton flottant discret", () => {
  const fs = require("fs"), path = require("path"), idx = read("index.src.html"), sys = read("css/system.css");
  assert.ok(/css\/system\.css/.test(idx) && idx.indexOf("css/system.css") > idx.indexOf("css/themes/themefix.css"), "feuille du système chargée en dernier");
  assert.ok(!/content: "\d\d — "/.test(read("css/themes/studio-b.css")), "plus de numéros de section décoratifs");
  const small = [];
  fs.readdirSync(path.join(__dirname, "../css")).filter((f) => /\.css$/.test(f) && !/bundle/.test(f)).forEach((f) => {
    fs.readFileSync(path.join(__dirname, "../css", f), "utf8").replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, body) => {
      if (/dock|app-header|\.hdr|glassbar|topbar|top-bar|nav-pill|bottom-nav|notif-badge|badge-dot|\.dot\b|\.cnt\b|-count\b/.test(sel)) return m;
      (body.match(/font-size:\s*[\d.]+(rem|px)/g) || []).forEach((d) => { const v = parseFloat(d.split(":")[1]), px = /rem/.test(d) ? v * 16 : v; if (px < 12) small.push(f + " " + sel.trim().slice(0, 40) + " " + d); });
      return m;
    });
  });
  assert.deepStrictEqual(small, [], "texte plus petit que 12 px : " + small.slice(0, 5).join(" | "));
  assert.ok(/--btn-h: 44px/.test(sys) && /--btn-h-sm: 36px/.test(sys) && /--r-card/.test(sys) && /--r-tile/.test(sys) && /--r-row/.test(sys), "échelle de boutons et trois rayons de carte");
  assert.ok(/status-tag-verified">Jouer<\/span><h1 class="page-title">Mode duel/.test(idx), "étiquette de section sur chaque page");
  assert.ok(/ma\.tab\./.test(read("js/router.js")), "dernier onglet de chaque section mémorisé");
  assert.ok(/typing/.test(read("js/game/fab-pack.js")) && /reglages\|contact\|admin/.test(read("js/game/fab-pack.js")), "bouton flottant masqué sur les formulaires");
  assert.ok(/nEng/.test(read("js/app.js")) && /catégorie<\/small>/.test(read("js/app.js")), "fiche voiture : deuxième rangée d'essentiels");
  assert.ok(/"🚧":"warn"/.test(read("js/emoji-icons.js")), "émojis restants reliés aux icônes");
});
ok("structure : Pilotes = Mon espace / Communauté / Classement, libellés uniques, accueil réordonné, tuiles de Jouer, squelettes, profil hiérarchisé", () => {
  const rt = read("js/router.js"), idx = read("index.src.html");
  assert.ok(/PILOT_GROUPS = \[\["espace", "Mon espace"\], \["communaute", "Communauté"\], \["classement", "Classement"\]\]/.test(rt), "trois univers dans Pilotes");
  const sub = rt.slice(rt.indexOf("espace: [[\"Profil\""), rt.indexOf("communaute: [[\"Fil\""));
  ["Profil", "Suivi"].forEach((l) => assert.ok(!sub.includes('["' + l + '"'), "Mon espace n'a plus de barre : " + l)); ["Aperçu", "Mes voitures", "Réglages"].forEach((l) => assert.ok(!sub.includes('["' + l + '"'), "Mon espace ne contient plus " + l));
  assert.ok(/\["Garages", "#\/communaute\/voitures"/.test(rt) && /\["Modèles", "#\/classement\/voitures"/.test(rt) && /\["profil", "Compte"\]/.test(rt), "libellés en double renommés");
  assert.ok(idx.indexOf('id="home-contest"') < idx.indexOf('id="home-feed-sec"') && idx.indexOf('id="home-feed-sec"') < idx.indexOf('id="home-community"'), "accueil : défi et sorties avant le fil, puis les garages");
  assert.ok(/hub-grid \{ grid-template-columns: repeat\(2/.test(read("css/system.css")), "tuiles de Jouer en deux colonnes");
  assert.ok(!/<div class="empty-note">Chargement/.test(read("js/app.js")) && /skel-wrap/.test(read("js/app.js")), "squelettes à la place des « Chargement… »");
  assert.ok(idx.indexOf('id="pub-social"') < idx.indexOf('class="pv3-actions"'), "profil : chiffres clés avant les actions");
});
ok("allègement : feuilles réunies, registre de modules figé, parcours navigateur, documentation", () => {
  const fs = require("fs"), path = require("path"), idx = read("index.src.html");
  ["cards3.css", "cards4.css", "cards5.css", "center.css", "albums3.css"].forEach((f) => assert.ok(!fs.existsSync(path.join(__dirname, "../css", f)) && !idx.includes("css/" + f), f + " fusionné"));
  assert.ok(fs.existsSync(path.join(__dirname, "../css/components/cards.css")) && fs.existsSync(path.join(__dirname, "../css/components/albums.css")), "feuilles réunies présentes");
  assert.ok(/MA\.register = function/.test(read("js/common.js")) && /defineProperty\(MA, "mods"/.test(read("js/common.js")), "registre MA.mods");
  const names = new Set();
  jsFiles().filter((f) => /\.js$/.test(f) && !/bundle|lazy-/.test(f)).forEach((f) => { (fs.readFileSync(path.join(__dirname, "../js", f), "utf8").match(/window\.(MA[A-Za-z0-9_]*)\s*=[^=]/g) || []).forEach((m) => names.add(m.replace(/window\.|\s*=.*/g, ""))); });
  assert.ok(names.size <= 85, "pas de nouveau global window.MA… (" + names.size + " > 85) : utiliser MA.register");
  assert.ok(fs.existsSync(path.join(__dirname, "journeys.test.js")) && /test:journeys/.test(read("package.json")), "parcours de bout en bout disponibles");
  assert.ok(/Documentation : où trouver quoi/.test(read("README.md")), "README : index de la documentation");
  assert.ok(/document\.write\('<script src="js\/i18n\/' \+ lang/.test(read("js/i18n-boot.js")), "traductions : seule la langue active est chargée");
});
ok("Vercel : dossier de sortie « . » et aucun framework (le site est servi depuis la racine)", () => { const v = JSON.parse(read("vercel.json")); assert.strictEqual(v.outputDirectory, "."); assert.strictEqual(v.framework, null); });
ok("accueil : le compteur (puissance max, V-Max, 0-100) se met à jour même quand le catalogue n'est pas affiché", () => { const a = read("js/app.js"); assert.ok(/if \(!catalogShown\(\) && !\(opts && opts\.force\)\) \{ updateGauge\(heroMatches\(\)\); return; \}/.test(a)); });
