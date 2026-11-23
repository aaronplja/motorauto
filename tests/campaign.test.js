/** Campagne : données des chapitres cohérentes, étoiles, déblocage : node tests/campaign.test.js */
"use strict";
const D = require("../js/game/campaign-data.js");
let n = 0, fails = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const ids = new Set(), isos = new Set();
D.CHAPTERS.forEach((ch) => {
  ok(!ids.has(ch.id), ch.id + " : identifiant de chapitre unique"); ids.add(ch.id);
  ok(!isos.has(ch.iso), ch.iso + " : un seul chapitre par pays"); isos.add(ch.iso);
  ok(/^[A-Z]{3}$/.test(ch.iso) && Math.abs(ch.lat) <= 90 && Math.abs(ch.lon) <= 180 && /^#[0-9a-f]{6}$/i.test(ch.color), ch.id + " : coordonnées, pays et couleur valides");
  ok(ch.name && ch.blurb, ch.id + " : nom et texte");
  const tid = new Set();
  ch.trials.forEach((t) => {
    ok(!tid.has(t.id) && t.id.indexOf(ch.id + "-") === 0, t.id + " : identifiant d'épreuve unique et préfixé");
    tid.add(t.id);
    ok(t.title && t.sub, t.id + " : titre et sous-titre");
    if (t.type === "quiz") {
      ok(t.qs.length >= 3, t.id + " : au moins 3 questions");
      t.qs.forEach((q, i) => ok(q.q.length > 10 && q.a.length === 4 && new Set(q.a).size === 4 && q.a.every((x) => x && x.length < 60), t.id + " q" + (i + 1) + " : 4 réponses distinctes"));
    } else if (t.type === "vf") {
      ok(t.items.length >= 3 && t.items.every((x) => x.q.length > 10 && typeof x.ok === "boolean"), t.id + " : affirmations vrai ou faux valides");
    } else if (["guess", "pm", "old"].includes(t.type)) ok(t.country === ch.id, t.id + " : jeu tiré du catalogue du pays");
    else if (t.type === "battle") ok(["easy", "normal", "hard"].includes(t.level), t.id + " : niveau de bataille connu");
    else ok(false, t.id + " : type d'épreuve inconnu (" + t.type + ")");
  });
});
D.CHAPTERS.forEach((c) => ok(c.trials.length >= 20, c.id + " : au moins 20 épreuves (" + c.trials.length + ")"));
D.CHAPTERS.forEach((c) => ok(c.trials.filter((t) => t.type === "battle").length >= 4 && new Set(c.trials.map((t) => t.type)).size >= 5, c.id + " : variété des jeux"));
// étoiles
ok(D.quizStars(5, 5) === 3 && D.quizStars(4, 5) === 2 && D.quizStars(3, 5) === 1 && D.quizStars(2, 5) === 0, "étoiles de quiz (5 questions)");
ok(D.quizStars(4, 4) === 3 && D.quizStars(3, 4) === 2 && D.quizStars(2, 4) === 0, "étoiles de quiz (4 questions)");
ok(D.battleStars(3, 0) === 3 && D.battleStars(4, 1) === 2 && D.battleStars(3, 2) === 1 && D.battleStars(2, 2) === 0 && D.battleStars(1, 3) === 0, "étoiles de bataille");
// déblocage dans l'ordre
const fr = D.byId("fr");
ok(D.unlocked(fr, 0, {}) && !D.unlocked(fr, 1, {}) && D.unlocked(fr, 1, { "fr-1": 1 }) && !D.unlocked(fr, 2, { "fr-1": 3 }), "épreuves débloquées dans l'ordre");
ok(!D.chapterDone(fr, { "fr-1": 3 }) && D.chapterDone(fr, Object.fromEntries(fr.trials.map((t) => [t.id, 1]))), "chapitre terminé quand toutes les épreuves sont validées");
ok(D.chapterStars(fr, { "fr-1": 3, "fr-2": 2, "zz": 3 }) === 5, "étoiles d'un chapitre");
console.log(fails ? fails + " ÉCHEC(S) sur " + n : "OK " + n + " vérifications (campagne)");
process.exit(fails ? 1 : 0);
