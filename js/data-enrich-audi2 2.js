/** MOTORAUTO — compléments Audi (1996 à aujourd'hui) : histoire détaillée, anecdotes, palmarès. */
(function () {
  "use strict";
  const m = {};
  const add = (id, h, a, r, rel, e) => { m[id] = { h, a: a || [], r: r || [], rel: rel || [], e: e || null, ap: true }; };

  /* ---- A1 */
  add("audi-a1-8x",
    "L'A1 est la première citadine d'Audi. Annoncée par un concept en 2007, elle est présentée à Genève en 2010 et assemblée à Bruxelles (Forest). Elle partage sa plate-forme avec la Volkswagen Polo et la SEAT Ibiza, mais s'en distingue par un intérieur plus soigné et des personnalisations nombreuses (toit contrasté, arches de couleur, planche de bord). La version Sportback à cinq portes arrive en 2012.\n\nLe 1.4 TFSI 185 ch, à turbo et compresseur, et le 1.4 TFSI COD (qui désactive deux cylindres) montrent la volonté d'Audi de proposer des moteurs de petite cylindrée mais performants. Le diesel 1.6 TDI est le plus vendu.",
    [["Une Mini à l'allemande", "L'A1 a été conçue pour concurrencer la Mini sur le créneau des citadines haut de gamme."]], [], ["audi-s1-8x", "audi-a1-quattro", "audi-a1-gb"]);
  add("audi-s1-8x",
    "La S1 de 2014 est une A1 à quatre roues motrices, animée par le 2.0 TFSI de 231 ch, le même moteur que l'on retrouvait dans la Volkswagen Golf GTI Performance de l'époque. Elle accélère de 0 à 100 km/h en 5,9 secondes. Sa transmission quattro à embrayage Haldex la rend très efficace sur route mouillée, ce qui la différencie de rivales à traction comme la Mini John Cooper Works.\n\nUne série S1 Competition (2016) reçoit un équipement spécifique. La S1 est le dernier modèle sportif de l'A1 de première génération.",
    [["Une quattro de poche", "La S1 est la plus petite Audi à quatre roues motrices de l'époque, après l'A1 quattro de 2012."]], [], ["audi-a1-8x", "audi-a1-quattro"]);
  add("audi-a1-quattro",
    "Pour fêter les 30 ans de la quattro, Audi produit en 2012 une A1 quattro à 333 exemplaires seulement. Elle reçoit le 2.0 TFSI de 256 ch, issu de la Golf R de l'époque, une boîte manuelle à 6 rapports, la transmission quattro et une suspension spécifique.\n\nVendue à un prix élevé, elle est vite épuisée et préfigure la S1 de série.",
    [["Seulement 333 exemplaires", "Un chiffre rond, choisi pour son caractère de série limitée."]], [["Rareté", "333 exemplaires produits."]], ["audi-s1-8x"]);
  add("audi-a1-gb",
    "La seconde A1 (2018) abandonne la version trois portes et n'est plus vendue qu'en Sportback à cinq portes. Elle est assemblée à Martorell, en Espagne, sur la plate-forme MQB A0 partagée avec la nouvelle Polo. Elle est plus longue de 5,6 cm, avec un coffre de 335 litres, et reçoit un Audi virtual cockpit en option. Les motorisations vont du 3 cylindres 1.0 TFSI de 95 ch au 2.0 TFSI de 200 ch, version qui a remplacé la S1.\n\nLa production de l'A1 s'est arrêtée en 2024, sans successeur direct annoncé.",
    [["Plus de S1", "La A1 40 TFSI de 200 ch a remplacé la S1 sans en reprendre l'appellation."]], [], ["audi-a1-8x"]);

  /* ---- A3 */
  add("audi-a3-8l",
    "Quand Audi présente l'A3 en 1996, l'idée d'une compacte haut de gamme est nouvelle en Europe, où le segment reste dominé par des modèles généralistes. L'A3 emprunte la plate-forme de la Golf IV mais reçoit des finitions plus soignées, une caisse galvanisée et un plus riche catalogue d'options. La version à cinq portes, la Sportback, apparaît en 1999.\n\nLe 1.8 turbo de 150 ch est très apprécié. La transmission quattro est disponible avec des moteurs plus puissants. L'A3 a ouvert la voie à une génération de compactes premium, que BMW (Série 1) et Mercedes (Classe A et CLA) viendront concurrencer.",
    [["Le pari de la compacte premium", "Au lancement, l'A3 a prouvé qu'un client était prêt à payer plus cher une compacte aux finitions soignées."]], [], ["audi-s3-8l"]);
  add("audi-s3-8l",
    "La S3 (1999) est la première compacte S d'Audi. Son 1.8 turbo 20 soupapes passe de 210 ch à 225 ch en 2001. La transmission quattro à embrayage Haldex envoie jusqu'à 100 % du couple vers l'arrière en cas de besoin. Elle reçoit des freins agrandis et une suspension abaissée.\n\nProposée uniquement en trois portes, elle accélère de 0 à 100 km/h en environ 6,6 secondes. Elle est l'ancêtre de la lignée S3 actuelle.",
    [["Un 1.8 T de référence", "Ce moteur, partagé avec les Golf, Seat Leon Cupra R et Audi TT, est devenu un classique de la préparation."]], [], ["audi-a3-8l", "audi-s3-8p"]);
  add("audi-a3-8p",
    "La deuxième A3 (2003) s'appuie sur la plate-forme PQ35 de la Golf V. Elle introduit la boîte DSG à double embrayage, d'abord sur le 3.2 V6 quattro de 250 ch, et l'injection directe FSI et TFSI. La carrosserie est déclinée en trois portes, en cinq portes Sportback (2004) et en cabriolet (2008).\n\nLa 2.0 TFSI, avec 200 ch, devient le moteur de référence. Elle a pour dérivées la S3, la RS3 Sportback et l'A3 Sportback e-tron.",
    [["La DSG", "Audi a été l'un des premiers constructeurs à proposer cette boîte à deux embrayages, qui réduit les temps de passage des rapports."]], [], ["audi-s3-8p", "audi-rs3-8p"]);
  add("audi-s3-8p",
    "La S3 de 2006 reçoit le 2.0 TFSI turbo de 265 ch, une boîte manuelle ou S tronic à 6 rapports et la transmission quattro Haldex de dernière génération. Elle est proposée en trois portes et en Sportback, puis en cabriolet (2009). La version Sportback accélère de 0 à 100 km/h en 5,7 secondes et atteint 250 km/h (limités).\n\nLes S3 8P sont appréciées pour leur sobriété d'allure : la grille du radiateur est noire, les rétroviseurs sont aluminium, et les doubles échappements sont les seuls signes extérieurs de leurs performances.",
    [["La discrétion à l'allemande", "À côté d'une A3 de base, seuls des détails (étriers, échappements) distinguent la S3."]], [], ["audi-s3-8l", "audi-rs3-8p"]);
  add("audi-rs3-8p",
    "La RS3 Sportback est présentée en 2011. Elle reprend le cinq cylindres 2.5 TFSI de la TT RS et délivre 340 ch pour 450 Nm de couple. La transmission quattro à embrayage Haldex et la S tronic à 7 rapports lui permettent d'accélérer de 0 à 100 km/h en 4,6 secondes. Elle n'existe que dans la version Sportback.\n\nLa sonorité de ce cinq cylindres, ordre d'allumage 1-2-4-5-3, est restée la signature de la RS3 et rappelle la quattro des années 1980.",
    [["Le cinq pattes", "Le cinq cylindres en ligne turbo est la signature des Audi sportives depuis la quattro de 1980."], ["Moteur de l'année", "Le 2.5 TFSI a été élu « International Engine of the Year » cinq années de suite."]],
    [["Moteur de l'année", "Le 2.5 TFSI a reçu le titre « International Engine of the Year » de 2010 à 2014."]], ["audi-tt-rs-8j", "audi-rs3-8v"]);
  add("audi-a3-8v",
    "L'A3 de troisième génération (2012) est la première Audi à utiliser la plate-forme modulaire MQB du groupe Volkswagen. Elle perd jusqu'à 80 kg par rapport à sa devancière et gagne en espace habitable. Elle est déclinée en trois portes, Sportback, berline (2013) et cabriolet. La version hybride rechargeable A3 Sportback e-tron arrive en 2014.\n\nL'A3 8V est élue World Car of the Year en 2014. Le cockpit numérique (virtual cockpit) devient disponible plus tard dans sa carrière.",
    [["Plate-forme MQB", "La MQB est une architecture transversale utilisée sur la Golf VII, la Seat Leon et la Škoda Octavia."]], [["World Car of the Year", "Titre obtenu par l'A3 en 2014."]], ["audi-s3-8v", "audi-rs3-8v"]);
  add("audi-s3-8v",
    "La S3 8V reçoit en 2013 le 2.0 TFSI EA888 de 300 ch, puis de 310 ch après le restylage de 2016. La transmission quattro à embrayage Haldex et la boîte S tronic à 6 puis 7 rapports permettent un 0 à 100 km/h en 4,8 secondes pour la version la plus rapide. Une berline S3 s'ajoute à la gamme. Elle partage son moteur avec les Golf R et SEAT Leon Cupra.\n\nElle est vendue en trois portes, Sportback, berline et cabriolet.",
    [], [], ["audi-a3-8v", "audi-rs3-8v"]);
  add("audi-rs3-8v",
    "La RS3 8V (2015) marque le retour de la RS3 avec le cinq cylindres 2.5 TFSI de 367 ch, puis de 400 ch (2017) avec un nouveau bloc entièrement en aluminium qui fait perdre 26 kg à l'avant. Elle reçoit la S tronic à 7 rapports et la transmission quattro à embrayage multidisque. À 400 ch, elle accélère de 0 à 100 km/h en 4,1 secondes, un chiffre digne d'une supercar des années 2000.\n\nLa RS3 est proposée en Sportback puis en berline. Elle partage son moteur avec la TT RS.",
    [["Un moteur léger", "Le nouveau bloc aluminium pèse 26 kg de moins que l'ancienne version en fonte."]], [["0 à 100 km/h", "4,1 secondes (version 400 ch)."]], ["audi-rs3-8p", "audi-rs3-8y"]);
  add("audi-a3-8y",
    "L'A3 8Y (2020) est la quatrième génération. Son intérieur est dominé par des écrans (compteurs numériques, écran tactile central) et elle adopte un nouveau système d'aide à la conduite. Elle est assemblée en Allemagne, à Ingolstadt, ainsi qu'à Győr, en Hongrie. Les moteurs vont du 3 cylindres 1.0 TFSI de 110 ch à l'hybride rechargeable 40 TFSI e de 204 ch.\n\nLa mild hybrid 48 V (35 TFSI) équipe la gamme. L'A3 allstreet, version surélevée, arrive en 2023.",
    [], [], ["audi-s3-8y", "audi-rs3-8y"]);
  add("audi-s3-8y",
    "La S3 de quatrième génération reprend le 2.0 TFSI de 310 ch, avec la boîte S tronic à 7 rapports. Le grand changement est un répartiteur de couple arrière à embrayages multidisques, qui envoie le couple vers la roue extérieure dans les virages, ce qui améliore l'agilité en conduite sportive. Elle est proposée en Sportback et en berline.\n\nLa S3 8Y accélère de 0 à 100 km/h en 4,8 secondes et est limitée à 250 km/h.",
    [], [], ["audi-a3-8y", "audi-rs3-8y"]);
  add("audi-rs3-8y",
    "Présentée en 2021, la RS3 de quatrième génération reprend le cinq cylindres 2.5 TFSI de 400 ch, avec un couple de 500 Nm. La grande nouveauté est le « RS Torque Splitter » : un différentiel arrière à deux embrayages, qui distribue le couple entre les roues arrière jusqu'à 100 %. Il permet un mode « RS Torque Rear », destiné au drift sur circuit fermé, une première dans la gamme de série d'Audi.\n\nLa RS3 accélère de 0 à 100 km/h en 3,8 secondes. Une édition Performance (2023) à 407 ch est limitée à 300 exemplaires.",
    [["Le mode drift", "La RS3 8Y est la première Audi de série dotée d'un mode destiné au drift."]], [["0 à 100 km/h", "3,8 secondes."]], ["audi-rs3-8v"]);

  /* ---- A4 / S4 / RS4 */
  add("audi-a4-b5",
    "L'A4 de 1994 remplace l'Audi 80 et inaugure la nomenclature actuelle, avec le A pour les modèles courants et S et RS pour les versions sportives. Elle utilise une plate-forme longitudinale, un moteur placé en porte-à-faux avant et la transmission quattro disponible. La gamme comprend la berline et le break Avant (1996). L'A4 B5 contribue à la diffusion du moteur TDI.\n\nSes lignes simples et sa qualité de fabrication lui ont fait gagner une réputation de fiabilité. Elle sera suivie des B6 et B7.",
    [["Un nom, plusieurs lettres", "Depuis l'A4, Audi nomme ses modèles par la lettre A, suivie d'un chiffre qui indique le segment."]], [], ["audi-s4-b5", "audi-rs4-b5"]);
  add("audi-s4-b5",
    "La S4 B5 (1997) est dotée d'un V6 2,7 litres à deux turbos placé en position longitudinale, d'une boîte manuelle à 6 rapports et de la transmission quattro. Elle délivre 265 ch et 400 Nm de couple. Elle se distingue des A4 ordinaires par ses jantes de 17 pouces, ses étriers de frein et sa calandre grise.\n\nElle est proposée en berline et en Avant. Elle sert de base à la RS4 Avant.",
    [], [], ["audi-rs4-b5", "audi-a4-b5"]);
  add("audi-rs4-b5",
    "La RS4 Avant B5 est conçue par quattro GmbH, l'entité d'Audi consacrée aux sportives. Le V6 2,7 litres biturbo est retravaillé avec l'aide de Cosworth, qui améliore la culasse et l'admission pour atteindre 380 ch et 440 Nm. Les ailes élargies et les jantes de 18 pouces la distinguent de l'A4 de série. Elle n'existe qu'en break Avant.\n\nElle est produite à environ 6 000 exemplaires entre 1999 et 2001. Elle poursuit la lignée de la RS2.",
    [["Cosworth", "Le préparateur britannique, connu pour ses moteurs de F1, a participé à la mise au point du V6."]], [["Production", "Environ 6 000 exemplaires."]], ["audi-rs2-avant", "audi-rs4-b7"]);
  add("audi-a4-b6-b7",
    "L'A4 B6 (2000-2004) et sa remplaçante B7 (2004-2008) prolongent la même plate-forme. La B6 introduit la boîte multitronic à variation continue sur les moteurs essence. La B7 reçoit la calandre « single frame » (introduite sur l'A6 en 2004), qui devient la signature d'Audi, ainsi que le 2.0 TFSI turbo et le V6 3.2 FSI. Le Cabriolet, dérivé de l'A4, remplace le Cabriolet 80. \n\nLa B7 est aussi la dernière A4 à proposer le V6 TDI de 2.7 litres en haut de gamme diesel.",
    [["Le single frame", "La calandre trapézoïdale d'Audi, apparue en 2004, est devenue un élément d'identité de la marque."]], [], ["audi-s4-b6-b7", "audi-rs4-b7"]);
  add("audi-s4-b6-b7",
    "La S4 B6 (2003) abandonne le V6 biturbo au profit d'un V8 4,2 litres atmosphérique de 344 ch, dérivé du moteur de l'Audi A8. Elle est proposée en berline, Avant et Cabriolet, avec une boîte manuelle à 6 rapports ou une automatique à 6 rapports, et la transmission quattro à différentiel Torsen. Le V8 est connu pour sa sonorité et sa souplesse.\n\nElle a été produite en B6 (2003-2004) puis en B7 (2005-2008). Elle accélère de 0 à 100 km/h en 5,6 secondes.",
    [], [], ["audi-rs4-b7", "audi-s4-b8"]);
  add("audi-rs4-b7",
    "La RS4 B7 (2005) est équipée du V8 4,2 litres FSI à injection directe, qui monte à 8 250 tr/min et développe 420 ch. C'est le même moteur que celui de la première R8. Sa boîte est une manuelle à 6 rapports, et la transmission quattro envoie 60 % du couple à l'arrière en situation normale. Elle est proposée en berline, Avant et Cabriolet.\n\nElle est restée dans la mémoire des passionnés pour son régime élevé et sa sonorité, avant l'arrivée de la RS5.",
    [["Le moteur de la R8", "Le 4.2 FSI de la RS4 est aussi celui de la R8 V8."], ["8 250 tr/min", "Un régime maximal digne d'une voiture de course, rare pour une berline."]], [], ["audi-r8-v8", "audi-rs5-8t"]);
  add("audi-a4-b8",
    "L'A4 B8 (2007) repose sur la nouvelle plate-forme MLB, qui repousse le moteur en arrière de l'essieu avant pour un meilleur équilibre. L'empattement est allongé de 16 cm, ce qui libère de l'espace pour les passagers. La B8 introduit les feux de jour à LED, signature visuelle d'Audi. L'A4 allroad quattro, un break surélevé, arrive en 2009.\n\nL'A4 est l'un des modèles les plus vendus d'Audi. Elle est assemblée à Ingolstadt et à Neckarsulm.",
    [["Les feux à LED", "Les feux de jour à LED en forme de collier de l'A4 B8 sont devenus un trait distinctif de la marque."]], [], ["audi-s4-b8", "audi-rs4-b9"]);
  add("audi-s4-b8",
    "La S4 B8 (2008) remplace le V8 atmosphérique par un V6 3.0 TFSI à compresseur de 333 ch, plus léger et moins gourmand. Elle bénéficie de la boîte S tronic à 7 rapports, de la transmission quattro avec différentiel sport en option et d'une suspension à amortissement piloté. Plus légère à l'avant, elle gagne en agilité.\n\nElle accélère de 0 à 100 km/h en 5,1 secondes. Elle est proposée en berline et en Avant.",
    [], [], ["audi-s4-b6-b7", "audi-s4-b9", "audi-s5-8t"]);
  add("audi-a4-b9",
    "L'A4 B9 (2015) utilise la plate-forme MLB Evo, qui permet un gain de poids pouvant atteindre 120 kg, et reçoit l'Audi virtual cockpit et des systèmes d'aide à la conduite. Elle est restylée en 2019 puis en 2023. La gamme comprend la berline, l'Avant et l'A4 allroad quattro. Un moteur mild hybrid 12 V équipe les versions essence et diesel.",
    [], [], ["audi-s4-b9", "audi-rs4-b9"]);
  add("audi-s4-b9",
    "La S4 B9 (2016) abandonne le compresseur et reçoit un V6 3.0 TFSI à turbo unique de 354 ch, accouplé à la boîte Tiptronic à 8 rapports. Elle partage son moteur avec la S5. Les S4 TDI, avec le V6 3.0 TDI de 347 ch et un système de suralimentation électrique, sont vendues en Europe à partir de 2019.\n\nLa S4 accélère de 0 à 100 km/h en 4,7 secondes.",
    [], [], ["audi-s4-b8", "audi-rs4-b9"]);
  add("audi-rs4-b9",
    "La RS4 Avant B9 (2018) est équipée du V6 2.9 TFSI biturbo de 450 ch, un moteur développé avec Porsche et partagé avec la RS5. Elle perd ainsi le V8 atmosphérique de ses devancières, mais gagne en couple (600 Nm). Elle accélère de 0 à 100 km/h en 4,1 secondes. Ses ailes sont élargies d'environ 30 mm par rapport à l'A4.\n\nElle n'existe qu'en break Avant en Europe. Elle est proposée avec la boîte Tiptronic à 8 rapports et le différentiel sport en option.",
    [["Moteur Porsche", "Le V6 2.9 biturbo est issu d'un développement commun avec Porsche, qui l'utilise aussi dans la Panamera."]], [], ["audi-rs4-b7", "audi-rs5-b9"]);

  /* ---- A5 */
  add("audi-a5-8t",
    "Présentée en 2007 à Genève, l'A5 est un coupé élégant dessiné par Walter de Silva et Wolfgang Egger. Sur la plate-forme MLB, elle partage ses éléments avec l'A4 B8. La Sportback à cinq portes (2009) et le Cabriolet (2009) complètent la gamme. L'A5 est la première Audi de ce segment depuis le Coupé des années 1980.\n\nLe coupé a reçu de nombreux prix de design. Il existe en traction, en quattro, et avec le V6 3.2 FSI.",
    [["Walter de Silva", "Le designer italien est aussi l'auteur des Alfa Romeo 156 et 147."]], [], ["audi-s5-8t", "audi-rs5-8t"]);
  add("audi-s5-8t",
    "La S5 de première génération a d'abord reçu un V8 4,2 litres de 354 ch, issu de la RS4, puis un V6 3.0 TFSI à compresseur de 333 ch en 2011. Elle est proposée en coupé, Sportback et Cabriolet, avec une boîte manuelle à 6 rapports ou S tronic. La transmission quattro à répartition asymétrique envoie 60 % du couple à l'arrière.\n\nLa S5 sert de lien entre l'A5 et la RS5.",
    [], [], ["audi-rs5-8t", "audi-s4-b8"]);
  add("audi-rs5-8t",
    "La RS5 de 2010 reprend le V8 4.2 FSI de la RS4 B7, qui tourne à 8 250 tr/min et développe 450 ch. Elle est dotée de la boîte S tronic à 7 rapports, de la transmission quattro avec répartition 40/60 et du différentiel sport en option. Elle accélère de 0 à 100 km/h en 4,5 secondes.\n\nElle est proposée en coupé puis en Cabriolet (2012). C'est l'une des dernières Audi à moteur V8 atmosphérique.",
    [], [["0 à 100 km/h", "4,5 secondes."]], ["audi-rs4-b7", "audi-rs5-b9"]);
  add("audi-a5-b9",
    "La deuxième A5 (2016) est basée sur la plate-forme MLB Evo de l'A4 B9. Elle est environ 60 kg plus légère que sa devancière. Elle est déclinée en coupé, Sportback et Cabriolet, avec des moteurs 2.0 TFSI (150 à 245 ch) et 2.0 TDI (190 ch).\n\nSon design est plus anguleux, avec des feux arrière à LED dynamiques (clignotants séquentiels).",
    [], [], ["audi-s5-b9", "audi-rs5-b9"]);
  add("audi-s5-b9",
    "La S5 de deuxième génération reçoit le V6 3.0 TFSI turbo de 354 ch, comme la S4. Elle est proposée en coupé, Sportback et Cabriolet, avec une boîte Tiptronic à 8 rapports et la transmission quattro. Elle accélère de 0 à 100 km/h en 4,7 secondes.\n\nÀ partir de 2019, Audi propose une S5 TDI sur certains marchés.",
    [], [], ["audi-rs5-b9"]);
  add("audi-rs5-b9",
    "La RS5 de 2017 abandonne le V8 pour un V6 2.9 TFSI biturbo de 450 ch, avec un couple de 600 Nm. Elle est plus légère de 60 kg que sa devancière et accélère de 0 à 100 km/h en 3,9 secondes. Elle est proposée en coupé et en Sportback, avec la transmission quattro et le différentiel sport en option.\n\nElle partage son moteur avec la RS4 Avant et la Porsche Panamera.",
    [], [["0 à 100 km/h", "3,9 secondes."]], ["audi-rs5-8t", "audi-rs4-b9"]);

  /* ---- A6 / S6 / RS6 */
  add("audi-a6-c5",
    "L'A6 C5 (1997) est la première Audi dont le coefficient de traînée descend à 0,28. Elle succède à l'A6 C4 (1994), elle-même successeur de l'Audi 100. Le break Avant reste très populaire, tandis que l'allroad quattro (2000), avec sa suspension pneumatique réglable en hauteur, fait figure de pionnier des breaks tout-terrain.\n\nLes moteurs vont de 1.8 T à V8 4.2, avec un diesel 2.5 TDI. La gamme est restylée en 2001.",
    [["L'allroad pionnier", "L'allroad quattro a lancé le segment des breaks surélevés, imité ensuite par Volvo (XC70) et Subaru."]], [], ["audi-rs6-c5"]);
  add("audi-rs6-c5",
    "La RS6 de 2002 est la première du nom : un V8 4,2 litres à deux turbos de 450 ch (480 ch pour la Plus de 2004) logé dans l'A6. Elle accélère de 0 à 100 km/h en 4,7 secondes et atteint 250 km/h (limités). Sa boîte automatique Tiptronic à 5 rapports et la transmission quattro lui offrent une grande motricité. Elle est proposée en Avant et en berline.\n\nLa suspension DRC (Dynamic Ride Control) relie les amortisseurs en diagonale pour réduire le roulis en virage sans durcir le confort.",
    [["Le DRC", "Cette suspension hydraulique sans barre antiroulis a été testée sur les RS4 et RS6."]], [], ["audi-rs6-c6", "audi-rs2-avant"]);
  add("audi-rs6-c6",
    "La RS6 C6 (2008) est équipée d'un V10 5.0 TFSI biturbo de 580 ch, dérivé du V10 5.2 FSI utilisé par la Lamborghini Gallardo et la R8. Il délivre 650 Nm de couple. La Tiptronic à 6 rapports et la transmission quattro permettent d'accélérer de 0 à 100 km/h en 4,5 secondes. Elle est proposée en Avant et en berline.\n\nElle est considérée comme l'une des RS les plus extrêmes avant le retour des V8.",
    [["V10 de Lamborghini", "Le moteur dérive du V10 que la Gallardo partage avec l'Audi R8."]], [], ["audi-rs6-c5", "audi-rs6-c7"]);
  add("audi-a6-c7",
    "L'A6 C7 (2011) reprend la plate-forme MLB de l'A4 et de l'A5, avec un poids réduit de 80 kg. Elle propose des moteurs essence et diesel (3.0 TDI), une version hybride, des aides à la conduite avancées et le système MMI Touch. L'allroad quattro et l'Avant complètent la berline.\n\nElle est restylée en 2014. Elle est assemblée à Neckarsulm.",
    [], [], ["audi-rs6-c7", "audi-s6-c7"]);
  add("audi-s6-c7",
    "La S6 C7 (2012) est équipée du V8 4.0 TFSI biturbo de 420 ch, qui désactive quatre cylindres à faible charge pour réduire la consommation. Elle est proposée en berline et en Avant avec la boîte S tronic à 7 rapports. Elle accélère de 0 à 100 km/h en 4,6 secondes.\n\nElle partage son moteur avec les S7, S8 et RS6.",
    [], [], ["audi-rs6-c7", "audi-s7-4g"]);
  add("audi-rs6-c7",
    "La RS6 Avant C7 (2013) reprend le V8 4.0 TFSI biturbo, ici poussé à 560 ch, puis à 605 ch dans la version Performance (2015). La désactivation de quatre cylindres, la suspension pneumatique et la transmission quattro la rendent à la fois rapide et confortable. Elle accélère de 0 à 100 km/h en 3,7 secondes (Performance) et peut atteindre 305 km/h avec le pack Dynamic Plus.\n\nElle est uniquement proposée en Avant en Europe.",
    [], [["0 à 100 km/h", "3,7 secondes (Performance)."]], ["audi-rs6-c6", "audi-rs6-c8"]);
  add("audi-a6-c8",
    "L'A6 C8 (2018) adopte une hybridation légère 48 V. L'habitacle reçoit trois écrans (compteurs numériques, écran central MMI Touch Response et écran de climatisation), qui remplacent les boutons. Elle est disponible en berline, Avant et allroad quattro, avec des moteurs 2.0 TFSI/TDI et V6 3.0.\n\nUne hybride rechargeable (55 TFSI e) arrive en 2020. Son successeur sera l'A6 e-tron (2024).",
    [], [], ["audi-rs6-c8"]);
  add("audi-rs6-c8",
    "La RS6 Avant C8 (2019) est équipée du V8 4.0 TFSI biturbo de 600 ch avec hybridation légère 48 V. Elle accélère de 0 à 100 km/h en 3,6 secondes. La version Performance (2023) délivre 630 ch et 850 Nm. Son style musclé, avec des ailes nettement élargies, la distingue de l'A6.\n\nEn 2024, Audi lance la RS6 Avant GT, série limitée de 660 exemplaires, qui rend hommage à la RS2 et à la RS6 de 2002.",
    [["La RS6 GT", "La série limitée de 2024 reprend des détails de la RS2 Avant et de la RS6 de 2002."]], [["0 à 100 km/h", "3,6 secondes (3,4 s en Performance)."]], ["audi-rs6-c7", "audi-rs7-c8"]);

  /* ---- A7 / A8 */
  add("audi-s7-4g",
    "L'A7 Sportback (2010) invente le coupé quatre portes à hayon de la marque, avec une ligne fluide qui évoque le Coupé des années 1980. La S7 (2012) reçoit le V8 4.0 TFSI biturbo de 420 ch, avec désactivation de quatre cylindres, et la boîte S tronic à 7 rapports. Elle accélère de 0 à 100 km/h en 4,7 secondes.\n\nElle partage ses éléments avec la S6.",
    [], [], ["audi-rs7-4g", "audi-s6-c7"]);
  add("audi-rs7-4g",
    "La RS7 Sportback (2013) reçoit le V8 4.0 TFSI biturbo de 560 ch, comme la RS6 Avant. Elle est proposée avec la Tiptronic à 8 rapports et la transmission quattro. La version Performance (2015), de 605 ch, accélère de 0 à 100 km/h en 3,7 secondes et atteint 305 km/h avec le pack Dynamic Plus.\n\nElle combine la ligne d'un coupé et l'espace d'une berline.",
    [], [], ["audi-rs6-c7", "audi-rs7-c8"]);
  add("audi-rs7-c8",
    "La RS7 de deuxième génération (2019) reprend la mécanique de la RS6 Avant : V8 4.0 TFSI biturbo de 600 ch, hybridation légère 48 V, Tiptronic 8 et quattro. Elle accélère de 0 à 100 km/h en 3,6 secondes. L'édition Performance (2023) délivre 630 ch.\n\nElle se distingue de l'A7 par ses ailes élargies et son aileron arrière.",
    [], [], ["audi-rs6-c8"]);
  add("audi-a8-d2",
    "L'A8 D2 (1994) est la première berline de luxe de série à structure entièrement en aluminium (Audi Space Frame, ASF), développée avec l'américain Alcoa. Elle est nettement plus légère qu'une voiture équivalente en acier. Elle est équipée de la transmission quattro, de moteurs V6 et V8, et plus tard du W12.\n\nElle reçoit un restylage en 1999. Sa carrosserie sobre masque sa technologie.",
    [["Space Frame", "La technologie de la caisse aluminium d'Audi a nécessité la création d'ateliers spécifiques à Neckarsulm."]], [], ["audi-s8-d2", "audi-a8-d3"]);
  add("audi-s8-d2",
    "La S8 D2 (1996) est équipée du V8 4,2 litres à 40 soupapes de 340 ch, puis 360 ch. Elle est disponible avec une boîte manuelle à 6 rapports, rare sur une grande berline, ou une Tiptronic à 5 rapports. La transmission quattro et le châssis aluminium en font une berline très performante pour l'époque, avec une apparence discrète.\n\nElle accélère de 0 à 100 km/h en 5,6 secondes.",
    [], [], ["audi-a8-d2", "audi-s8-d3"]);
  add("audi-a8-d3",
    "L'A8 D3 (2002) bénéficie de la structure ASF perfectionnée et d'une calandre « single frame » ample. Elle reçoit une suspension pneumatique adaptative, le système MMI et un V8 4.2 FSI. La version W12 6.0, de 450 ch, est disponible. Une version L à empattement long est proposée.\n\nElle est restylée en 2007.",
    [], [], ["audi-s8-d3", "audi-a8-d4"]);
  add("audi-s8-d3",
    "La S8 D3 (2006) est équipée du V10 5.2 FSI, un moteur également présent sur la Lamborghini Gallardo et la R8 V10. Il délivre 450 ch et 540 Nm de couple. Elle est accouplée à la boîte Tiptronic à 6 rapports et à la transmission quattro. Elle accélère de 0 à 100 km/h en 5,1 secondes.",
    [], [], ["audi-r8-v10", "audi-s8-d4"]);
  add("audi-a8-d4",
    "L'A8 D4 (2010) est proposée avec des phares entièrement à LED, une technologie présentée sur la R8 en 2008. Elle reçoit la Tiptronic à 8 rapports, des aides à la conduite et un système de vision nocturne. Elle est proposée en version hybride (A8 hybrid) et en W12 6.3 de 500 ch. L'A8 L est la version à empattement long.\n\nElle est restylée en 2013.",
    [], [], ["audi-s8-d4"]);
  add("audi-s8-d4",
    "La S8 D4 (2013) revient au V8, un 4.0 TFSI biturbo de 520 ch avec désactivation de quatre cylindres. La S8 plus (2015) délivre 605 ch et accélère de 0 à 100 km/h en 3,8 secondes. Son aspect est discret : calandre aluminium, jantes de 20 pouces et échappements doubles.\n\nElle est l'une des berlines de luxe les plus rapides de son époque.",
    [], [], ["audi-s8-d3", "audi-rs6-c7"]);

  /* ---- TT */
  add("audi-tt-8n",
    "Le concept TT de 1995 (Francfort) est dessiné par Freeman Thomas et Peter Schreyer, dans l'esprit Bauhaus, avec des lignes simples et arrondies. Le public réagit si bien qu'Audi le met en production en 1998. La TT repose sur la plate-forme de la Golf IV, avec le 1.8 T de 180 ou 225 ch, la transmission quattro Haldex et, plus tard, un V6 3.2 de 250 ch avec la boîte DSG.\n\nAprès quelques accidents à haute vitesse, Audi ajoute en 1999 un petit aileron arrière et le contrôle de stabilité ESP. Le Roadster arrive en 1999. La TT quattro Sport (2005) est une série limitée de 240 ch.",
    [["Rappel de 1999", "Après plusieurs accidents à haute vitesse, Audi a ajouté un petit becquet et le contrôle de stabilité."], ["Un design durable", "Le dessin de la TT est resté presque inchangé du concept de 1995 à la voiture de série."]], [], ["audi-tt-8j"]);
  add("audi-tt-8j",
    "La TT 8J (2006) est la deuxième génération, avec une carrosserie mixte aluminium/acier. Elle utilise la plate-forme PQ35 de la Golf V. Elle est proposée en coupé et en roadster, avec des moteurs 2.0 TFSI, 3.2 V6 et diesel 2.0 TDI. Elle est la première TT à proposer la suspension magnétique Audi Magnetic Ride.\n\nLa TTS (2008), avec 272 ch, et la TT RS (2009) complètent la gamme.",
    [], [], ["audi-tt-rs-8j", "audi-tt-8s"]);
  add("audi-tt-rs-8j",
    "La TT RS (2009) inaugure le 2.5 TFSI, un cinq cylindres en ligne turbo de 340 ch, qui rend hommage à la quattro de 1980. Elle est proposée en coupé et en roadster, avec une boîte manuelle à 6 rapports ou S tronic. La TT RS plus (2012) atteint 360 ch et 280 km/h. Elle accélère de 0 à 100 km/h en 4,3 secondes.\n\nLe 2.5 TFSI a été élu « International Engine of the Year » cinq fois de suite.",
    [["Un 5 cylindres mythique", "La sonorité du 2.5 TFSI est devenue emblématique de la gamme RS d'Audi."]], [], ["audi-rs3-8p", "audi-tt-rs-8s"]);
  add("audi-tt-8s",
    "La TT 8S (2014) reprend la plate-forme MQB et introduit l'Audi virtual cockpit : un écran de 12,3 pouces qui remplace les compteurs et affiche la navigation, une première dans l'automobile de série. La console centrale est dépourvue d'écran, car tout se trouve devant le conducteur. Les moteurs vont du 1.8 TFSI de 180 ch au 2.0 TFSI de 310 ch (TTS).\n\nAudi met fin à la production de la TT en novembre 2023, avec une série finale TT Final Edition, en raison de la réorientation vers l'électrique.",
    [["Un cockpit entièrement numérique", "L'Audi virtual cockpit a été présenté sur la TT avant d'être généralisé."]], [], ["audi-tt-rs-8s"]);
  add("audi-tt-rs-8s",
    "La TT RS 8S (2016) est équipée du 2.5 TFSI de 400 ch, avec un bloc en aluminium. Elle accélère de 0 à 100 km/h en 3,7 secondes et atteint 250 km/h (limités), ou 280 km/h avec un pack. Elle est proposée en coupé et en roadster, avec la S tronic à 7 rapports et la transmission quattro.\n\nLa TT RS Heritage Edition (2022) célèbre les 25 ans de la TT et la lignée des cinq cylindres.",
    [], [["0 à 100 km/h", "3,7 secondes."]], ["audi-tt-rs-8j", "audi-rs3-8y"]);

  /* ---- R8 / e-tron GT */
  add("audi-r8-v8",
    "La R8 est présentée en 2006 au Mondial de l'automobile de Paris. Elle porte le nom de la prototype de course qui a remporté cinq fois Le Mans entre 2000 et 2005. Sa structure en aluminium (ASF) est partagée avec la Lamborghini Gallardo, mais son moteur central arrière est un V8 4.2 FSI de 420 ch, issu de la RS4. La transmission quattro envoie par défaut 85 % du couple à l'arrière.\n\nElle est assemblée à la main à Neckarsulm, dans l'atelier Böllinger Höfe. La R8 Spyder (2010) ajoute une capote.",
    [["Iron Man", "La R8 est la voiture de Tony Stark dans le film Iron Man (2008)."], ["Un nom hérité de la course", "Audi a choisi le nom R8 pour rendre hommage à ses victoires au Mans."]], [], ["audi-r8-v10", "audi-rs4-b7"]);
  add("audi-r8-v10",
    "La R8 V10 (2009) reçoit le V10 5.2 FSI de la Lamborghini Gallardo, avec 525 ch, puis 550 ch en V10 plus. Elle est proposée en coupé et en Spyder, avec une boîte manuelle ou R tronic. Elle atteint 316 km/h et accélère de 0 à 100 km/h en 3,9 secondes.\n\nElle place la R8 au niveau des supercars italiennes pour un prix moindre.",
    [], [], ["audi-r8-v8", "audi-r8-type-4s"]);
  add("audi-r8-type-4s",
    "La seconde R8 (2015) est construite en aluminium et fibre de carbone, plus légère de 50 kg que la première. Elle reçoit le V10 5.2 FSI de 540 ch ou 610 ch (V10 plus), la S tronic à 7 rapports et la transmission quattro. L'Audi virtual cockpit y est installé. La version V10 performance (2019) atteint 620 ch.\n\nElle est vendue jusqu'en 2023, avec une dernière série limitée R8 V10 GT RWD à 333 exemplaires. La production cesse en 2024.",
    [["La R8 Spyder 4S", "La version Spyder arrive en 2016 avec la même mécanique."], ["333 exemplaires pour finir", "La R8 V10 GT RWD de 2023 est une série limitée de 333 voitures."]], [], ["audi-r8-v10"]);
  add("audi-r8-lms-gt3",
    "La R8 LMS est la version GT3 de la R8, développée à partir de 2009 par Audi Sport Customer Racing. Elle est vendue aux équipes clientes, avec le V10 atmosphérique de 5,2 litres de 585 ch environ. Elle remporte de nombreuses victoires, notamment aux 24 Heures de Spa et du Nürburgring.\n\nElle est remplacée par la R8 LMS GT3 Evo II. Audi arrêtera la production à la fin de la vie de la R8 de route.",
    [], [], ["audi-r8-type-4s"], [[560, 0, 3.3]]);
  add("audi-rs-e-tron-gt",
    "La RS e-tron GT (2021) est la berline sportive électrique d'Audi, construite sur la plate-forme J1 partagée avec la Porsche Taycan. Elle est assemblée à Neckarsulm (Böllinger Höfe). Sa batterie de 93 kWh de tension 800 V se recharge jusqu'à 270 kW. Deux moteurs électriques lui donnent 598 ch (646 ch en overboost) et une transmission intégrale.\n\nElle est restylée en 2024 avec la version « performance », qui développe 925 ch, et accélère de 0 à 100 km/h en 2,5 secondes.",
    [["Cousine de la Taycan", "La plate-forme J1 est partagée avec la Porsche Taycan, mais la carrosserie est propre à Audi."]], [], ["audi-r8-type-4s"]);

  MAKIT.enrich(m);
})();
