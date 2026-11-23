/**
 * MOTORAUTO — Campagne : les chapitres (un par pays ou par thème), posés sur le globe.
 * Un chapitre = une suite d'épreuves à passer dans l'ordre : quiz (questions écrites ici), bataille de cartes contre l'IA…
 * Pour ajouter un chapitre : une entrée dans CHAPTERS (lat/lon = position de l'épingle, iso = pays coloré sur la carte).
 * Un chapitre sans « trials » s'affiche « bientôt ». Étoiles : quiz 1 à 3 (selon les bonnes réponses), bataille 1 à 3 (selon l'écart).
 */
(function () {
  "use strict";
  const Q = (q, a, b, c, d, note) => ({ q, a: [a, b, c, d], note: note || "" });   // la bonne réponse est toujours la première (mélangée à l'affichage)
  const CHAPTERS = [
    {
      id: "fr", name: "France", iso: "FRA", lat: 47.2, lon: 2.4, color: "#2f5fd0", era: "1900 – aujourd'hui",
      blurb: "Du fiacre motorisé à l'Alpine : l'Hexagone a inventé l'automobile populaire, les 24 Heures du Mans et des légendes de rallye.",
      trials: [
        { id: "fr-1", type: "quiz", title: "Les pionnières", sub: "Citroën, Peugeot, Renault…", qs: [
          Q("Quelle marque française a produit la célèbre 2CV ?", "Citroën", "Renault", "Peugeot", "Simca"),
          Q("Quel animal figure sur le logo de Peugeot ?", "Un lion", "Un taureau", "Un cheval", "Un coq"),
          Q("Quelle voiture Renault, lancée en 1992, avait un look de « bonbon » aux phares ronds ?", "La Twingo", "La Clio", "La Mégane", "L'Espace"),
          Q("Dans quelle ville normande est installée l'usine Alpine ?", "Dieppe", "Rouen", "Caen", "Le Havre"),
          Q("Quelle marque a lancé la révolutionnaire DS en 1955 ?", "Citroën", "Peugeot", "Panhard", "Talbot")
        ] },
        { id: "fr-2", type: "battle", title: "Premier duel", sub: "Une bataille contre l'IA (facile)", level: "easy" },
        { id: "fr-3", type: "quiz", title: "Les 24 Heures du Mans", sub: "La plus grande course d'endurance", qs: [
          Q("Dans quel département se trouve le circuit des 24 Heures du Mans ?", "La Sarthe", "La Mayenne", "L'Orne", "Le Maine-et-Loire"),
          Q("Comment s'appelle la célèbre ligne droite d'environ 6 km du circuit ?", "Les Hunaudières", "Tertre Rouge", "Arnage", "Indianapolis"),
          Q("Quelle marque française a gagné Le Mans en 1992 et 1993 avec la 905 ?", "Peugeot", "Renault", "Matra", "Citroën"),
          Q("Quelle Alpine a remporté les 24 Heures du Mans 1978 ?", "L'A442B", "L'A110", "L'A310", "La GTA")
        ] },
        { id: "fr-4", type: "battle", title: "Sur le circuit", sub: "Une bataille contre l'IA (normal)", level: "normal" },
        { id: "fr-5", type: "quiz", title: "Rallye et Dakar", sub: "Les légendes de la terre et de la neige", qs: [
          Q("Quelle Alpine a dominé le rallye de Monte-Carlo 1971 ?", "L'A110", "L'A310", "La GTA", "L'A610"),
          Q("Quel pilote français a remporté neuf titres de champion du monde des rallyes ?", "Sébastien Loeb", "Sébastien Ogier", "Didier Auriol", "François Delecour"),
          Q("Avec quelle marque Loeb a-t-il gagné ses neuf titres mondiaux ?", "Citroën", "Peugeot", "Renault", "Subaru"),
          Q("Quelle Peugeot a gagné le Paris-Dakar en 1987 et 1988 ?", "La 205 Turbo 16", "La 504", "La 405 Turbo 16", "La 306 Maxi")
        ] },
        { id: "fr-6", type: "battle", title: "Le boss de l'Hexagone", sub: "Une bataille contre l'IA (difficile)", level: "hard", boss: true }
      ]
    },
    { id: "it", name: "Italie", iso: "ITA", lat: 44.5, lon: 10.9, color: "#1f9d55", era: "Bientôt", blurb: "Maranello, Sant'Agata, Turin : berceau des supercars rouges et des moteurs qui chantent.", trials: [] },
    { id: "de", name: "Allemagne", iso: "DEU", lat: 48.8, lon: 9.2, color: "#d4a017", era: "Bientôt", blurb: "Stuttgart, Munich, Nürburgring : l'ingénierie, la vitesse illimitée et l'Enfer vert.", trials: [] },
    { id: "jp", name: "Japon", iso: "JPN", lat: 35.7, lon: 139.7, color: "#d6204a", era: "Bientôt", blurb: "JDM, drift, kei cars et les légendes des années 90.", trials: [] },
    { id: "us", name: "États-Unis", iso: "USA", lat: 42.3, lon: -83.0, color: "#c0392b", era: "Bientôt", blurb: "Detroit, muscle cars, drag racing et Route 66.", trials: [] },
    { id: "gb", name: "Royaume-Uni", iso: "GBR", lat: 52.0, lon: -1.5, color: "#7a4fc2", era: "Bientôt", blurb: "Silverstone, l'élégance britannique et les roadsters légers.", trials: [] },
    { id: "se", name: "Suède", iso: "SWE", lat: 60.5, lon: 15.0, color: "#1a8fbd", era: "Bientôt", blurb: "Koenigsegg, Volvo et la sécurité avant tout.", trials: [] }
  ];
  /** étoiles d'un quiz selon le nombre de bonnes réponses (0 = raté) ; la moyenne des questions est requise pour valider */
  const quizStars = (ok, n) => (ok >= n ? 3 : ok >= Math.ceil(n * 0.75) ? 2 : ok >= Math.ceil(n * 0.6) ? 1 : 0);
  /** étoiles d'une bataille selon le score final (0 = défaite ou égalité) */
  const battleStars = (me, ai) => (me > ai ? (ai === 0 ? 3 : me - ai >= 2 ? 2 : 1) : 0);
  const byId = (id) => CHAPTERS.find((c) => c.id === id) || null;
  /** épreuve débloquée si la précédente du chapitre est validée (≥ 1 étoile) */
  const unlocked = (ch, i, done) => i === 0 || (done[ch.trials[i - 1].id] || 0) > 0;
  const chapterStars = (ch, done) => ch.trials.reduce((s, t) => s + (done[t.id] || 0), 0);
  const chapterDone = (ch, done) => ch.trials.length > 0 && ch.trials.every((t) => (done[t.id] || 0) > 0);
  const api = { CHAPTERS, quizStars, battleStars, byId, unlocked, chapterStars, chapterDone };
  if (typeof module === "object" && module.exports) module.exports = api; else window.MA.register("CampaignData", api);
})();
