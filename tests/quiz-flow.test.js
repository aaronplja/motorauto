/** Quiz, chrono et survie de bout en bout : le score rendu par le serveur correspond toujours aux questions envoyées au site,
 *  même si le site a un autre catalogue, une autre langue ou une autre version que le serveur.   node tests/quiz-flow.test.js */
"use strict";
const fs = require("fs"), path = require("path");
const core = require("../js/game-core");
const { createGame } = require("../functions/game");
const { FakeDb } = require("./fake-admin-db");

let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } else console.log("  ok - " + m); };
let NOW = Date.parse("2026-11-16T10:00:00+01:00");
const db = new FakeDb(() => NOW);
let seed = 4242; const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const stat = JSON.parse(fs.readFileSync(path.join(__dirname, "../functions/catalog-static.json"), "utf8"));
// catalogue du serveur : catalogue local + 3 voitures ajoutées en ligne et une fiche modifiée
let serverPool = stat.map((c) => Object.assign({}, c)).concat([
  { id: "zz-en-ligne-1", power: 512, speed: 301, zero: 3.9, name: "Essai Un", brand: "Essai", category: "Supercar", year: 2021, pics: [] },
  { id: "aa-en-ligne-2", power: 95, speed: 172, zero: 11.8, name: "Essai Deux", brand: "Essai", category: "Berline", year: 1987, pics: [] },
  { id: "mm-en-ligne-3", power: 240, speed: 250, zero: 6.1, name: "Autre Trois", brand: "Autre", category: "Coupé", year: 2004, pics: [] }
]);
serverPool[10] = Object.assign({}, serverPool[10], { power: serverPool[10].power + 37 });
// catalogue vu par le site : volontairement différent (voitures en ligne absentes, 5 fiches en moins)
const sitePool = stat.slice(5);
const G = createGame({ db, ts: () => db.ts(), rng, now: () => NOW, cardPool: async () => serverPool, isAdmin: async () => false });
const U = (id) => { db.seed("users", id, { username: "Pilote_" + id }); return { uid: id }; };
const right = (q) => (q.m ? q.m.slice() : q.a), wrongOf = (q) => (q.m ? [q.o.findIndex((_, i) => !q.m.includes(i))] : (q.a + 1) % q.o.length);
const stats = async (uid) => (await db.collection("gstats").doc(uid).get()).data() || {};

(async () => {
  // ---- 1. quiz : toutes les catégories et tous les niveaux, avec un nombre d'erreurs choisi
  let total = 0, exact = 0, legacyDiff = 0;
  const A = U("qa");
  for (const cat of Object.keys(core.QCATS)) for (const level of [1, 2, 3, 4]) for (const lang of ["fr", "en"]) {
    const st = await G.quizSubmit(A, { op: "start", cat, level, lang });
    const bad = (total * 7) % (st.qs.length + 1), answers = st.qs.map((q, i) => (i < bad ? wrongOf(q) : right(q)));
    const r = await G.quizSubmit(A, { seed: st.seed, cat, level, answers });
    total++; if (r.score === st.qs.length - bad && r.total === st.qs.length) exact++;
    // ce qu'aurait donné l'ancienne méthode : le site reconstruit les questions avec son propre catalogue
    const old = core.quizBuild(st.seed, cat, level, sitePool), same = old.length === st.qs.length && old.every((q, i) => q.q === st.qs[i].q && q.a === st.qs[i].a);
    if (!same) legacyDiff++;
  }
  ok(exact === total, "quiz : score serveur = réponses données aux questions reçues, dans " + exact + " parties sur " + total + " (11 catégories × 4 niveaux × 2 langues)");
  ok(legacyDiff > 0, "le cas testé est bien celui qui posait problème : catalogue du site ≠ catalogue du serveur dans " + legacyDiff + " parties sur " + total);

  // ---- 2. forme des questions envoyées, clé de correction effacée après la partie, pas de double correction
  const B = U("qb");
  let st = await G.quizSubmit(B, { op: "start", cat: "brands", level: 2, lang: "fr" });
  ok(st.qs.length === core.QUIZ_N && st.qs.every((q) => typeof q.q === "string" && Array.isArray(q.o) && q.o.length >= 2 && Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length && q.ex === undefined && q.ids === undefined), "10 questions complètes envoyées au site (énoncé, choix, bonne réponse)");
  ok(/^[a-z0-9]{8,}$/.test(st.seed) && (await stats("qb")).quizCur.seed === st.seed, "partie en cours enregistrée côté serveur");
  let r = await G.quizSubmit(B, { seed: st.seed, cat: "brands", level: 2, answers: st.qs.map(right) });
  ok(r.score === 10 && r.total === 10 && r.reward === 10 * core.QUIZ_REWARD && r.best === 10, "sans faute : 10 / 10, récompense et meilleur score");
  ok((await stats("qb")).quizCur === undefined, "clé de correction effacée après la correction");
  // la catégorie et le niveau notés sont ceux de la partie lancée, pas ceux renvoyés au moment de corriger
  st = await G.quizSubmit(B, { op: "start", cat: "rally", level: 1, lang: "fr" });
  r = await G.quizSubmit(B, { seed: st.seed, cat: "ev", level: 4, answers: st.qs.map(right) });
  const gs = await stats("qb");
  ok(gs.quizBest.rally_1 === st.qs.length && gs.quizBest.ev_4 === undefined, "le meilleur score va dans la catégorie réellement jouée");
  // questions à plusieurs réponses : toutes les bonnes cases, dans n'importe quel ordre
  let multiSeen = 0, multiOk = 0;
  for (let i = 0; i < 12; i++) {
    st = await G.quizSubmit(B, { op: "start", cat: ["brands", "countries", "history", "engines"][i % 4], level: 1 + (i % 4), lang: "fr" });
    const m = st.qs.filter((q) => q.m); multiSeen += m.length;
    r = await G.quizSubmit(B, { seed: st.seed, answers: st.qs.map((q) => (q.m ? q.m.slice().reverse() : wrongOf(q))) });
    if (r.score === m.length) multiOk++;
  }
  ok(multiSeen > 0 && multiOk === 12, "réponses multiples : comptées justes quand toutes les bonnes cases sont cochées (" + multiSeen + " questions)");
  // réponses manquantes ou en trop
  st = await G.quizSubmit(B, { op: "start", cat: "trivia", level: 2, lang: "fr" });
  r = await G.quizSubmit(B, { seed: st.seed, answers: st.qs.slice(0, 4).map(right) });
  ok(r.score === 4 && r.total === st.qs.length, "partie incomplète : seules les réponses données comptent");
  let err = null; try { await G.quizSubmit(B, { op: "start", cat: "inconnue", level: 1 }); } catch (e) { err = e; }
  ok(err && err.isGame && err.code === "invalid-argument", "catégorie inconnue refusée");

  // ---- 3. site resté sur une ancienne version (pas de lancement côté serveur) : l'ancienne méthode marche toujours
  const C = U("qc"), sd = "anciensite1", qsOld = core.quizBuild(sd, "numbers", 2, serverPool);
  r = await G.quizSubmit(C, { seed: sd, cat: "numbers", level: 2, answers: qsOld.map(right) });
  ok(r.score === qsOld.length, "ancienne version du site : correction par rejeu de la graine conservée");

  // ---- 4. chrono
  const D = U("qd");
  for (const level of [1, 2, 3, 4]) {
    const cs = await G.chronoStart(D, { level, lang: level % 2 ? "fr" : "de" });
    ok(Array.isArray(cs.qs) && cs.qs.length >= 30 && cs.qs.every((q) => !q.m), "chrono niveau " + level + " : " + cs.qs.length + " questions envoyées, toutes à réponse unique");
    const answers = cs.qs.slice(0, 12).map((q, i) => (i % 4 === 3 ? wrongOf(q) : right(q)));
    NOW += 61000;
    const cr = await G.chronoSubmit(D, { answers });
    ok(cr.score === 9 && cr.wrong === 3, "chrono niveau " + level + " : 9 bonnes réponses et 3 erreurs retrouvées par le serveur");
    NOW += 3600000;
  }

  // ---- 5. survie
  const E = U("qe");
  for (const level of [1, 3]) {
    const ss = await G.survivalStart(E, { level, lang: "fr" });
    ok(Array.isArray(ss.qs) && ss.qs.length >= 30, "survie niveau " + level + " : " + ss.qs.length + " questions envoyées");
    const answers = ss.qs.slice(0, 10).map((q, i) => (i === 2 ? -1 : i === 5 ? wrongOf(q) : i === 9 ? wrongOf(q) : right(q)));
    NOW += 10 * 6000;
    const sr = await G.survivalSubmit(E, { answers });
    ok(sr.score === 7 && sr.wrong === 3, "survie niveau " + level + " : 7 bonnes réponses, 3 vies perdues (dont un temps écoulé)");
    NOW += 3600000;
  }

  console.log(fails ? "\n" + fails + " échec(s) sur " + n : "\nQuiz de bout en bout : " + n + " vérifications réussies");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
