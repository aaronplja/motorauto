/**
 * MOTORAUTO PRO — structure de départ des catégories et sous-catégories (AUCUN contenu technique ici).
 * Seule la liste des rubriques est fournie : les modifications elles-mêmes (description, gain, coût, risques…) sont saisies
 * par les administrateurs dans Administration › PRO, puis relues et publiées une à une.
 * Les administrateurs peuvent ajouter, renommer, supprimer et réordonner les catégories et sous-catégories sans toucher au code :
 * la liste modifiée est enregistrée dans pro_config/cats et remplace celle-ci. Ce fichier ne sert que de point de départ.
 *   pin : position [x, y] du repère sur la silhouette d'auto de l'onglet admin (viewBox 400 × 200) ; absent = grille seulement.
 */
(function () {
  "use strict";
  const s = (id, label) => ({ id, label });
  window.MA_PRO_DEFAULT_CATS = [
    { id: "freinages", label: "Freinages", icon: "🛑", pin: [104, 150], subs: [s("disques-tambours", "Disques ou tambours"), s("plaquettes", "Plaquettes"), s("durites", "Durites"), s("frein-a-main", "Frein à main")] },
    { id: "chassis", label: "Châssis", icon: "🧱", pin: [205, 138], subs: [s("barres-anti-rapprochement-avant", "Barres anti-rapprochement avant"), s("barres-anti-rapprochement-arriere", "Barres anti-rapprochement arrière"), s("renforts-de-berceau", "Renforts de berceau"), s("renforts-de-triangles", "Renforts de triangles"), s("arceau", "Arceau"), s("barres-antiroulis", "Barres antiroulis")] },
    { id: "suspensions", label: "Suspensions", icon: "🔩", pin: [114, 118], subs: [s("combines-filetes", "Combinés filetés"), s("ressorts", "Ressorts"), s("amortisseurs", "Amortisseurs"), s("coupelles-amortisseurs", "Coupelles d'amortisseurs"), s("silentblocs-triangles", "Silentblocs de triangles"), s("silentblocs-moteur", "Silentblocs moteur"), s("silentblocs-autres", "Autres silentblocs")] },
    { id: "liaison-au-sol", label: "Liaison au sol", icon: "🛞", pin: [296, 150], subs: [s("geometrie", "Géométrie"), s("pneus", "Pneus"), s("jantes", "Jantes"), s("largeur-de-voie", "Largeur de voie")] },
    { id: "aerodynamisme", label: "Aérodynamisme", icon: "🌬️", pin: [326, 74], subs: [s("lame-avant", "Lame d'air avant"), s("lame-arriere", "Lame d'air arrière"), s("aileron-becquet", "Aileron / becquet"), s("fond-plat", "Fond plat")] },
    { id: "refroidissement", label: "Refroidissement", icon: "❄️", pin: [44, 122], subs: [s("radiateurs", "Radiateurs"), s("liquide-refroidissement", "Liquide de refroidissement"), s("refroidissement-air", "Refroidissement par air")] },
    { id: "moteur", label: "Moteur", icon: "⚙️", pin: [76, 88], subs: [s("turbo", "Turbo (si présent)"), s("admission", "Admission d'air"), s("injection", "Injection"), s("arbre-a-cames", "Arbre à cames"), s("renforcement-pieces", "Renforcement des pièces (bielles, pistons, bloc…)"), s("reprogrammation", "Reprogrammation"), s("collecteur-echappement", "Collecteur d'échappement"), s("durites-moteur", "Durites"), s("allumage-bougies", "Allumage : bougies"), s("allumage-bobines", "Allumage : bobines"), s("alternateur", "Alternateur"), s("swap-moteur", "Swap moteur")] },
    { id: "echappement", label: "Échappement", icon: "💨", pin: [352, 138], subs: [s("ligne", "Ligne"), s("catalyseur", "Catalyseur"), s("silencieux", "Silencieux")] },
    { id: "boite-de-vitesses", label: "Boîte de vitesses", icon: "🕹️", pin: [166, 116], subs: [s("ratios", "Changement de ratios"), s("differentiel", "Différentiel"), s("swap-boite", "Swap de boîte (à crabots, séquentielle…)"), s("short-shifter", "Short shifter"), s("volant-moteur", "Volant moteur"), s("embrayage", "Embrayage"), s("huile-de-boite", "Huile de boîte"), s("renfort-tringlerie", "Renfort de tringlerie")] },
    { id: "allegement", label: "Allègement", icon: "🪶", pin: [214, 84], subs: [s("sieges", "Sièges"), s("carrosserie", "Carrosserie"), s("habitacle", "Habitacle"), s("batterie", "Batterie")] }
  ];

  /** avertissement affiché sur CHAQUE modification (côté abonnés et côté admin) */
  window.MA_PRO_WARNING = "Information générale, non contractuelle. À faire contrôler par un professionnel qualifié avant toute intervention. Certaines modifications sont réservées à un usage sur circuit et peuvent être interdites sur route ou exiger une homologation (réception à titre isolé, contrôle technique, assurance).";
  window.MA_PRO_STATUS = [["draft", "Brouillon"], ["reviewed", "Relu"], ["published", "Publié"]];
  window.MA_PRO_LEVELS = [["", "—"], ["facile", "Facile"], ["moyenne", "Moyenne"], ["difficile", "Difficile"], ["expert", "Expert"]];
  /** rappel affiché sur toute fiche de swap moteur */
  window.MA_PRO_SWAP_NOTE = "Un swap moteur n'est presque jamais « plug and play » : prévoir des supports moteur adaptés, la boîte de vitesses, l'arbre de transmission, le refroidissement, le faisceau / calculateur (ECU), l'échappement et les freins.";
})();
