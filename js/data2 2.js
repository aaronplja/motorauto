/**
 * MOTORAUTO DATABASE — SECONDE PARTIE (MODÈLES SUPPLÉMENTAIRES & INTÉGRALITÉ DES GTI / FR)
 * Fichier autonome fusionné automatiquement dans la base principale.
 */

const MOTORAUTO_EXTRA_CARS = [
  /* ==========================================================================
     CITROËN XSARA
     ========================================================================== */
  {
    id: "citroen-xsara-vts",
    brand: "Citroën",
    model: "Xsara VTS 2.0 16v",
    category: "Coupé",
    years: "1997 - 2004",
    description: "Coupé sportif français redoutable, doté d'un train arrière à effet directif unique qui en fait l'une des tractions les plus incisives de sa génération.",
    image: "img/xsara-vts.jpg",
    phases: [
      {
        phaseName: "Phase 1 & 2 XU10J4RS",
        details: "Châssis sport, trains roulants affûtés, moteur atmosphérique à haut rendement.",
        engines: [
          { name: "2.0 16V XU10J4RS", power: 167, torque: 193, speed: 220, zeroToHundred: 8.0, transmission: "Manuelle 5" }
        ],
        notableEditions: ["VTS Pack Confort", "WRC Edition"]
      }
    ],
    records: [
      { type: "Train Arrière Autodirectionnel", description: "Intègre des cales déformables spécifiques permettant aux roues arrière de pivoter légèrement en appui." }
    ],
    userRecords: []
  },
  {
    id: "citroen-xsara-kit-car",
    brand: "Citroën Racing",
    model: "Xsara Kit Car",
    category: "Supercar",
    years: "1998 - 2001",
    description: "La reine absolue des Kit-Cars F2000. Une traction atmosphérique surpuissante capable de terrasser les WRC 4x4.",
    image: "img/xsara-kit-car.jpg",
    phases: [
      {
        phaseName: "Spécifications F2000 Asphalte",
        details: "Voies élargies, boîte séquentielle, moteur atmosphérique hurlant à 8750 tr/min.",
        engines: [
          { name: "2.0 16V XU10J4RS Kit Car", power: 280, torque: 250, speed: 210, zeroToHundred: 4.5, transmission: "Séquentielle 6 rapports + Propulsion/Traction" }
        ],
        notableEditions: ["Version Officielle Citroën Sport"]
      }
    ],
    records: [
      { type: "Exploit Historique", description: "Victoires au Rallye de Catalogne et au Tour de Corse en 1999, battant à la régularité les WRC à transmission intégrale." }
    ],
    userRecords: []
  },
  {
    id: "citroen-xsara-wrc",
    brand: "Citroën Racing",
    model: "Xsara WRC",
    category: "Supercar",
    years: "2001 - 2006",
    description: "L'arme absolue du WRC qui a lancé la dynastie victorieuse de Sébastien Loeb en championnat du monde.",
    image: "img/xsara-wrc.jpg",
    phases: [
      {
        phaseName: "Évolution Turbo Garrett",
        details: "Transmission intégrale, arceau cage FIA renforcé, aérodynamique agressive.",
        engines: [
          { name: "2.0 16V Turbo Garrett (XU10J4S)", power: 315, torque: 570, speed: 225, zeroToHundred: 3.6, transmission: "Séquentielle 6 rapports 4x4" }
        ],
        notableEditions: ["Livrée Rouge & Blanche Officielle"]
      }
    ],
    records: [
      { type: "Palmarès Légendaire", description: "32 victoires en WRC, 3 titres mondiaux Constructeurs (2003-2005) et 3 titres Pilotes pour Sébastien Loeb (2004-2006)." }
    ],
    userRecords: []
  },

  /* ==========================================================================
     FORD COSWORTH, RS & FIESTA / PUMA
     ========================================================================== */
  {
    id: "ford-escort-rs-cosworth-t35",
    brand: "Ford",
    model: "Escort RS Cosworth (T35 - 1992-1994)",
    category: "Coupé",
    years: "1992 - 1994",
    description: "Le monstre à aileron 'queue de baleine' de Groupe A, propulsé par le mythique gros turbo Garrett T35.",
    image: "img/escort-cosworth-92.jpg",
    phases: [
      {
        phaseName: "Gros Turbo T35 (Weber-Marelli)",
        details: "Transmission intégrale permanente, aileron biplan légendaire.",
        engines: [
          { name: "2.0L Turbo Cosworth YBT", power: 227, torque: 304, speed: 232, zeroToHundred: 6.1, transmission: "Manuelle 5 + 4x4" }
        ],
        notableEditions: ["Motorsport Edition", "Lux Pack"]
      }
    ],
    records: [{ type: "Aérodynamique Extrême", description: "L'aileron arrière générait tellement d'appui qu'il a dû être légèrement modifié." }],
    userRecords: []
  },
  {
    id: "ford-escort-rs-cosworth-t25",
    brand: "Ford",
    model: "Escort RS Cosworth (T25 - 1994-1996)",
    category: "Coupé",
    years: "1994 - 1996",
    description: "Évolution dotée d'un plus petit turbo (Garrett T25) pour offrir du couple plus bas et une souplesse d'utilisation accrue.",
    image: "img/escort-cosworth-94.jpg",
    phases: [
      {
        phaseName: "Petit Turbo T25 (EEC-IV)",
        details: "Réponse à l'accélération optimisée, jantes spécifiques.",
        engines: [
          { name: "2.0L Turbo Cosworth YBP", power: 227, torque: 310, speed: 232, zeroToHundred: 6.2, transmission: "Manuelle 5 + 4x4" }
        ],
        notableEditions: ["Sprint Edition"]
      }
    ],
    records: [{ type: "Polyvalence Routière", description: "Couple maxi disponible dès 2 500 tr/min." }],
    userRecords: []
  },
  {
    id: "ford-sierra-rs-cosworth",
    brand: "Ford",
    model: "Sierra RS Cosworth",
    category: "Coupé",
    years: "1986 - 1987",
    description: "La pionnière de la lignée Cosworth. Berline propulsée survoltée née pour dominer le Groupe A.",
    image: "img/sierra-cosworth.jpg",
    phases: [
      {
        phaseName: "YBB Turbo RWD",
        details: "Aileron 'queue de baleine', propulsion pure.",
        engines: [
          { name: "2.0L Turbo Cosworth YBB", power: 204, torque: 276, speed: 242, zeroToHundred: 6.5, transmission: "Manuelle 5 + Propulsion" }
        ],
        notableEditions: ["RS500 (500 exemplaires evo de course)"]
      }
    ],
    records: [{ type: "Pari Commercial", description: "Ford a dû en écouler 5 000 exemplaires pour l'homologation Groupe A." }],
    userRecords: []
  },
  {
    id: "ford-focus-rs-mk2",
    brand: "Ford",
    model: "Focus RS Mk2",
    category: "Supercar",
    years: "2009 - 2011",
    description: "La traction la plus brutale du monde. Moteur 5 cylindres Volvo de 305 ch.",
    image: "img/focus-rs-mk2.jpg",
    phases: [
      {
        phaseName: "Duratec RS 5-cylindres",
        details: "Différentiel RevoKnuckle, look ultra-élargi.",
        engines: [
          { name: "2.5L 5-cylindres Turbo Duratec", power: 305, torque: 440, speed: 263, zeroToHundred: 5.9, transmission: "Manuelle 6 + LSD" }
        ],
        notableEditions: ["RS500 (350 ch - 500 ex)"]
      }
    ],
    records: [{ type: "Maîtrise du Couple", description: "Passage de 305 ch sur les roues avant sans effet de couple parasite destructeur." }],
    userRecords: []
  },
  {
    id: "ford-focus-rs-mk3",
    brand: "Ford",
    model: "Focus RS Mk3",
    category: "Supercar",
    years: "2015 - 2018",
    description: "Première Focus RS à transmission intégrale dotée du fameux mode Drift.",
    image: "img/focus-rs-mk3.jpg",
    phases: [
      {
        phaseName: "EcoBoost 2.3L AWD",
        details: "Transmission intégrale intelligente à vecteur de couple.",
        engines: [
          { name: "2.3L EcoBoost Turbo", power: 350, torque: 470, speed: 266, zeroToHundred: 4.7, transmission: "Manuelle 6 + 4x4 vectoriel" }
        ],
        notableEditions: ["Edition Limitée Bleu Nitrous"]
      }
    ],
    records: [{ type: "Drift Mode", description: "Première voiture de série à intégrer un mode de conduite autorisant le contrôle des dérives." }],
    userRecords: []
  },
  {
    id: "ford-focus-st-170",
    brand: "Ford",
    model: "Focus ST 170 (Mk1)",
    category: "Coupé",
    years: "2002 - 2004",
    description: "Première compacte sportive badgée ST de l'ère moderne, mise au point avec Cosworth.",
    image: "img/focus-st170.jpg",
    phases: [
      {
        phaseName: "Duratec ST Cosworth",
        details: "Culasse Cosworth à calage variable, boîte Getrag.",
        engines: [
          { name: "2.0L Duratec ST Atmos", power: 173, torque: 195, speed: 216, zeroToHundred: 8.2, transmission: "Manuelle 6" }
        ],
        notableEditions: ["ST170 Break", "ST170 Berline"]
      }
    ],
    records: [{ type: "Châssis Multibras", description: "Tenue de route exceptionnelle pour une traction atmosphérique de son époque." }],
    userRecords: []
  },
  {
    id: "ford-fiesta-st-mk6",
    brand: "Ford",
    model: "Fiesta ST 150 (Mk6)",
    category: "Coupé",
    years: "2005 - 2008",
    description: "Petite bombinette attachante dotée d'un gros moteur 2.0L atmosphérique dérivé de la Mondeo.",
    image: "img/fiesta-st150.jpg",
    phases: [
      {
        phaseName: "Duratec 2.0L Atmos",
        details: "Châssis rigide, jantes 17 pouces.",
        engines: [
          { name: "2.0L Duratec HE", power: 150, torque: 190, speed: 208, zeroToHundred: 8.4, transmission: "Manuelle 5" }
        ],
        notableEditions: ["ST Cup Edition"]
      }
    ],
    records: [{ type: "Origine Mondeo", description: "Bloc moteur robuste 2.0L issu de la grande routière." }],
    userRecords: []
  },
  {
    id: "ford-fiesta-st-mk7",
    brand: "Ford",
    model: "Fiesta ST Mk7",
    category: "Coupé",
    years: "2013 - 2017",
    description: "Considérée par beaucoup comme la meilleure petite sportive de sa décennie.",
    image: "img/fiesta-st7.jpg",
    phases: [
      {
        phaseName: "EcoBoost 1.6L Turbo",
        details: "Châssis ultra-affûté, train arrière joueur.",
        engines: [
          { name: "1.6L EcoBoost Turbo", power: 182, torque: 290, speed: 223, zeroToHundred: 6.9, transmission: "Manuelle 6" }
        ],
        notableEditions: ["ST200 (200 ch)"]
      }
    ],
    records: [{ type: "Rapport Qualité/Prix", description: "Célèbre pour sa capacité à lever la roue arrière intérieure en appui." }],
    userRecords: []
  },
  {
    id: "ford-puma-17",
    brand: "Ford",
    model: "Ford Puma 1.7 16v",
    category: "Coupé",
    years: "1997 - 2002",
    description: "Coupé compact au design bio-design doté d'un moteur mis au point par Yamaha.",
    image: "img/ford-puma.jpg",
    phases: [
      {
        phaseName: "Zetec-SE 1.7 VCT Yamaha",
        details: "Moteur Yamaha à distribution variable, train avant réglé par Jackie Stewart.",
        engines: [
          { name: "1.7L Zetec-SE VCT Yamaha", power: 125, torque: 157, speed: 203, zeroToHundred: 9.2, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Millennium Edition"]
      }
    ],
    records: [{ type: "Patte de Légende", description: "Jackie Stewart a participé aux réglages du train avant." }],
    userRecords: []
  },
  {
    id: "peugeot-406-break",
    brand: "Peugeot",
    model: "406 Break",
    category: "Break",
    years: "1996 - 2004",
    description: "Le break familial par excellence, réputé pour son volume et son confort.",
    image: "img/406-break.jpg",
    phases: [
      {
        phaseName: "Phases 1 & 2 Break",
        details: "Grand coffre modulable, insonorisation poussée.",
        engines: [
          { name: "2.0 16V", power: 137, torque: 190, speed: 203, zeroToHundred: 10.2, transmission: "Manuelle 5" },
          { name: "3.0 V6 24V", power: 207, torque: 285, speed: 232, zeroToHundred: 8.2, transmission: "Manuelle 5 / Auto" },
          { name: "2.2 HDi FAP", power: 136, torque: 314, speed: 200, zeroToHundred: 10.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["SV Executive", "Navtech"]
      }
    ],
    records: [{ type: "Volume Utile", description: "Référence de chargement de sa génération." }],
    userRecords: []
  },
  {
    id: "ford-rs200",
    brand: "Ford",
    model: "Ford RS200 (Groupe B)",
    category: "Supercar",
    years: "1984 - 1986",
    description: "Monstre sacré du Groupe B à moteur central arrière et transmission intégrale.",
    image: "img/ford-rs200.jpg",
    phases: [
      {
        phaseName: "Route & Evolution",
        details: "Moteur central longitudinal, répartition des masses 50/50.",
        engines: [
          { name: "1.8L Turbo Cosworth BDT (Route)", power: 250, torque: 292, speed: 190, zeroToHundred: 6.0, transmission: "Manuelle 5 + 4x4" },
          { name: "2.1L Turbo BDT-E (Evolution)", power: 600, torque: 542, speed: 240, zeroToHundred: 2.1, transmission: "Intégrale course" }
        ],
        notableEditions: ["Série Limitée Route (200 ex)"]
      }
    ],
    records: [{ type: "Accélération F1", description: "0 à 100 abattu en 2,1 secondes pour la version Evolution." }],
    userRecords: []
  },
  {
    id: "peugeot-207-rc",
    brand: "Peugeot",
    model: "207 RC",
    category: "Coupé",
    years: "2007 - 2010",
    description: "Animée par le moteur 1.6L THP co-développé avec BMW.",
    image: "img/207-rc.jpg",
    phases: [
      {
        phaseName: "1.6 THP 175",
        details: "Sièges baquets spécifiques, jantes 17 pouces.",
        engines: [
          { name: "1.6L Turbo THP (EP6DT)", power: 175, torque: 240, speed: 220, zeroToHundred: 7.1, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Le Mans Series"]
      }
    ],
    records: [{ type: "BMW Turbo", description: "Premier partenariat réussi avec BMW pour l'injection directe." }],
    userRecords: []
  },
  {
    id: "peugeot-207-s2000",
    brand: "Peugeot Sport",
    model: "207 S2000",
    category: "Supercar",
    years: "2007 - 2012",
    description: "Bête de rallye Super 2000 à moteur atmosphérique et transmission intégrale.",
    image: "img/207-s2000.jpg",
    phases: [
      {
        phaseName: "Spécifications FIA S2000",
        details: "Moteur 2.0L atmosphérique hurlant, boîte séquentielle.",
        engines: [
          { name: "2.0L 16V Atmos S2000", power: 280, torque: 250, speed: 215, zeroToHundred: 4.2, transmission: "Séquentielle 6 + 4x4" }
        ],
        notableEditions: ["Version Officielle IRC"]
      }
    ],
    records: [{ type: "Palmarès IRC", description: "Multiple championne internationale aux mains de Kris Meeke et Thierry Neuville." }],
    userRecords: []
  },
  {
    id: "peugeot-406-silhouette",
    brand: "Peugeot Sport",
    model: "406 Silhouette",
    category: "Supercar",
    years: "1999 - 2003",
    description: "Monstre tubulaire à moteur central arrière V6 pour le Supertourisme et l'Andros.",
    image: "img/406-silhouette.jpg",
    phases: [
      {
        phaseName: "Châssis Tubulaire V6",
        details: "Silhouette en fibre, moteur central V6 ES9.",
        engines: [
          { name: "3.0L V6 24V ES9 Compétition", power: 310, torque: 350, speed: 260, zeroToHundred: 3.8, transmission: "Séquentielle 6 propulsion" }
        ],
        notableEditions: ["Trophée Andros & Supertourisme"]
      }
    ],
    records: [{ type: "Polyvalence Glisse & Piste", description: "Redoutable sur asphalte comme sur glace." }],
    userRecords: []
  },

  /* ==========================================================================
     VOLKSWAGEN GOLF GTI (TOUTES LES GÉNÉRATIONS DE 1 À 8)
     ========================================================================== */
  {
    id: "vw-golf-gti-mk1",
    brand: "Volkswagen",
    model: "Golf GTI Mk1",
    category: "Coupé",
    years: "1976 - 1983",
    description: "L'inventrice du segment. Poids plume, calandre cerclée de rouge et boules de golf sur le levier.",
    image: "img/golf-gti-mk1.jpg",
    phases: [
      {
        phaseName: "1.6 & 1.8 Injection",
        details: "Boîte 4 puis 5 vitesses, compte-tours, volant sport.",
        engines: [
          { name: "1.6 Injection (EG)", power: 110, torque: 137, speed: 182, zeroToHundred: 9.2, transmission: "Manuelle 4/5" },
          { name: "1.8 Injection (DX)", power: 112, torque: 153, speed: 190, zeroToHundred: 9.0, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Pirelli Edition", "Campaign (UK)"]
      }
    ],
    records: [{ type: "Création d'un Mythe", description: "A popularisé à elle seule le concept de la sportive compacte accessible." }],
    userRecords: []
  },
  {
    id: "vw-golf-gti-mk2",
    brand: "Volkswagen",
    model: "Golf GTI Mk2",
    category: "Coupé",
    years: "1984 - 1991",
    description: "Évolution plus grande et robuste. Versions 8S et le redoutable bloc 16 soupapes (KR / PL).",
    image: "img/golf-gti-mk2.jpg",
    phases: [
      {
        phaseName: "8S & 16V",
        details: "Châssis rigidifié, double sortie d'échappement, version G60 à compresseur.",
        engines: [
          { name: "1.8 8S (EV / PB)", power: 112, torque: 155, speed: 191, zeroToHundred: 9.7, transmission: "Manuelle 5" },
          { name: "1.8 16V (KR / PL)", power: 139, torque: 168, speed: 208, zeroToHundred: 8.5, transmission: "Manuelle 5" },
          { name: "1.8 G60 Compresseur (PG)", power: 160, torque: 225, speed: 216, zeroToHundred: 8.3, transmission: "Manuelle 5 + Synchro 4x4" }
        ],
        notableEditions: ["G60 Limited (71 ex)", "Edition One"]
      }
    ],
    records: [{ type: "Rallye & Compétition", description: "La version G60 Rallye a introduit la transmission intégrale Syncro." }],
    userRecords: []
  },
  {
    id: "vw-golf-gti-mk3",
    brand: "Volkswagen",
    model: "Golf GTI Mk3",
    category: "Coupé",
    years: "1992 - 1997",
    description: "Génération plus lourde mais dotée du premier bloc 2.0L 16S et du mélodieux VR6.",
    image: "img/golf-gti-mk3.jpg",
    phases: [
      {
        phaseName: "2.0 8S, 16S & VR6",
        details: "Sécurité renforcée, jantes 15 pouces BBS d'origine sur 16S.",
        engines: [
          { name: "2.0 8S (2E / AGG)", power: 115, torque: 166, speed: 196, zeroToHundred: 10.1, transmission: "Manuelle 5" },
          { name: "2.0 16V (ABF)", power: 150, torque: 180, speed: 215, zeroToHundred: 8.3, transmission: "Manuelle 5" },
          { name: "2.9 VR6 GTI (Abteiler / Synchro)", power: 190, torque: 245, speed: 224, zeroToHundred: 7.1, transmission: "Manuelle 5" }
        ],
        notableEditions: ["20th Anniversary Edition"]
      }
    ],
    records: [{ type: "Sonorité VR6", description: "Le bloc VR6 a marqué les esprits par sa mélodie atypique en V étroit." }],
    userRecords: []
  },
  {
    id: "vw-golf-gti-mk4",
    brand: "Volkswagen",
    model: "Golf GTI Mk4",
    category: "Coupé",
    years: "1998 - 2003",
    description: "Finitions intérieures somptueuses, châssis assagi et motorisations turbo 1.8T et V5/V6.",
    image: "img/golf-gti-mk4.jpg",
    phases: [
      {
        phaseName: "1.8T & TDI 150",
        details: "Intérieur haut de gamme, compteurs cerclés de chrome.",
        engines: [
          { name: "1.8T 20V (AGU / AUM)", power: 150, torque: 210, speed: 216, zeroToHundred: 8.5, transmission: "Manuelle 5" },
          { name: "1.8T 20V (AUQ - 180 ch)", power: 180, torque: 235, speed: 228, zeroToHundred: 7.9, transmission: "Manuelle 6" },
          { name: "1.9 TDI (ASZ - 150 ch Diesel)", power: 150, torque: 320, speed: 216, zeroToHundred: 8.6, transmission: "Manuelle 6" }
        ],
        notableEditions: ["25th Anniversary Edition"]
      }
    ],
    records: [{ type: "L'ère du 1.8T", description: "A popularisé la reprogrammation et le potentiel des moteurs turbocompressés essence." }],
    userRecords: []
  },
  {
    id: "vw-golf-gti-mk5",
    brand: "Volkswagen",
    model: "Golf GTI Mk5",
    category: "Coupé",
    years: "2004 - 2008",
    description: "Le grand retour aux sources de la sportivité pure. Châssis multi-bras exceptionnel et boîte DSG révolutionnaire.",
    image: "img/golf-gti-mk5.jpg",
    phases: [
      {
        phaseName: "2.0 TFSI EA113",
        details: "Calandre alvéolée bordée de rouge, sièges écossais 'Interlagos'.",
        engines: [
          { name: "2.0 TFSI (AXX / BWA - 200 ch)", power: 200, torque: 280, speed: 235, zeroToHundred: 6.9, transmission: "Manuelle 6 ou DSG6" },
          { name: "2.0 TFSI Edition 30 (BYD - 230 ch)", power: 230, torque: 300, speed: 245, zeroToHundred: 6.6, transmission: "Manuelle 6 ou DSG6" }
        ],
        notableEditions: ["Edition 30", "Pirelli Edition"]
      }
    ],
    records: [{ type: "Renaissance de la Race", description: "Considérée par les puristes comme l'une des meilleures GTI modernes." }],
    userRecords: []
  },
  {
    id: "vw-golf-gti-mk6",
    brand: "Volkswagen",
    model: "Golf GTI Mk6",
    category: "Coupé",
    years: "2008 - 2012",
    description: "Évolution raffinée de la Mk5, intégrant le différentiel électronique XDS et une ligne plus épurée.",
    image: "img/golf-gti-mk6.jpg",
    phases: [
      {
        phaseName: "2.0 TSI EA888",
        details: "Échappement sport doublé, système XDS anti-patinage.",
        engines: [
          { name: "2.0 TSI (CCZB - 210 ch)", power: 210, torque: 280, speed: 240, zeroToHundred: 6.9, transmission: "Manuelle 6 ou DSG6" },
          { name: "2.0 TSI Edition 35 (235 ch)", power: 235, torque: 300, speed: 247, zeroToHundred: 6.6, transmission: "Manuelle 6 ou DSG6" }
        ],
        notableEditions: ["Edition 35 (moteur de la Golf R dégonflé)"]
      }
    ],
    records: [{ type: "Anniversaire des 35 ans", description: "L'édition 35 embarquait le bloc forgé de la Golf R." }],
    userRecords: []
  },
  {
    id: "vw-golf-gti-mk7",
    brand: "Volkswagen",
    model: "Golf GTI Mk7 & 7.5",
    category: "Coupé",
    years: "2013 - 2020",
    description: "Basée sur la plateforme MQB, la Mk7 repousse les limites avec son Pack Performance et ses versions radicales.",
    image: "img/golf-gti-mk7.jpg",
    phases: [
      {
        phaseName: "GTI, Performance, Clubsport & TCR",
        details: "Pack Performance (différentiel mécanique VAQ + gros freins), versions Clubsport allégées.",
        engines: [
          { name: "2.0 TSI (220 ch - Standard / 230 ch - Performance)", power: 230, torque: 350, speed: 250, zeroToHundred: 6.4, transmission: "Manuelle 6 ou DSG6" },
          { name: "2.0 TSI Clubsport S (310 ch)", power: 310, torque: 380, speed: 265, zeroToHundred: 5.8, transmission: "Manuelle 6 (Biplace stricte)" },
          { name: "2.0 TSI TCR (290 ch)", power: 290, torque: 380, speed: 260, zeroToHundred: 5.6, transmission: "DSG7" }
        ],
        notableEditions: ["Clubsport S (Record Nürburgring)", "TCR"]
      }
    ],
    records: [{ type: "Record Traction Nürburgring", description: "La Clubsport S a battu le record des tractions sur la Nordschleife en 7:49.21." }],
    userRecords: []
  },
  {
    id: "vw-golf-gti-mk8",
    brand: "Volkswagen",
    model: "Golf GTI Mk8",
    category: "Coupé",
    years: "2020 - Présent",
    description: "Virage numérique radical, projecteurs antibrouillard en nid d'abeille intégrés et bloc EA888 evo4.",
    image: "img/golf-gti-mk8.jpg",
    phases: [
      {
        phaseName: "GTI, Clubsport & Edition 50",
        details: "Gestion dynamique centralisée VDM, feux diurnes reliés par une bande LED.",
        engines: [
          { name: "2.0 TSI EA888 evo4 (245 ch)", power: 245, torque: 370, speed: 250, zeroToHundred: 6.2, transmission: "Manuelle 6 ou DSG7" },
          { name: "2.0 TSI Clubsport Mk8 (300 ch)", power: 300, torque: 400, speed: 267, zeroToHundred: 5.6, transmission: "DSG7" }
        ],
        notableEditions: ["Clubsport 45", "Edition 50"]
      }
    ],
    records: [{ type: "Intelligence Dynamique", description: "Premier pilotage électronique centralisé couplant le blocage de différentiel et l'amortissement piloté." }],
    userRecords: []
  },

  /* ==========================================================================
     SEAT LEON FR (TOUTES LES GÉNÉRATIONS DE 1 À 4)
     ========================================================================== */
  {
    id: "seat-leon-fr-mk1",
    brand: "SEAT",
    model: "Seat León FR (Mk1 - 1P)",
    category: "Coupé",
    years: "2003 - 2005",
    description: "Première apparition de l'appellation FR (Formula Racing) sur la première génération de León, cousine ibérique de la Golf IV.",
    image: "img/seat-leon-fr-mk1.jpg",
    phases: [
      {
        phaseName: "1.8T 20V & TDI 150 FR",
        details: "Châssis sport, sièges baquets spécifiques, jantes alliage exclusives.",
        engines: [
          { name: "1.8L Turbo 20V (AUQ - 180 ch)", power: 180, torque: 235, speed: 229, zeroToHundred: 7.7, transmission: "Manuelle 6" },
          { name: "1.9L TDI (ARL - 150 ch Diesel)", power: 150, torque: 320, speed: 215, zeroToHundred: 8.9, transmission: "Manuelle 6" }
        ],
        notableEditions: ["FR Special Edition"]
      }
    ],
    records: [{ type: "Coup de Poing TDI", description: "Le bloc TDI 150 (code ARL) est devenu culte pour ses reprises explosives." }],
    userRecords: []
  },
  {
    id: "seat-leon-fr-mk2",
    brand: "SEAT",
    model: "Seat León FR (Mk2 - 1P)",
    category: "Coupé",
    years: "2006 - 2012",
    description: "Génération au design acéré signé Walter de Silva, avec des poignées arrière cachées et des motorisations rageuses.",
    image: "img/seat-leon-fr-mk2.jpg",
    phases: [
      {
        phaseName: "Essence TFSI & Diesel TDI",
        details: "Lignes de monospace sportif, compteurs à fond blanc, sorties d'échappement ovales.",
        engines: [
          { name: "2.0 TFSI (200 ch)", power: 200, torque: 280, speed: 229, zeroToHundred: 7.3, transmission: "Manuelle 6 ou DSG6" },
          { name: "2.0 TSI (211 ch - Restylage 2009)", power: 211, torque: 280, speed: 233, zeroToHundred: 6.9, transmission: "Manuelle 6 ou DSG6" },
          { name: "2.0 TDI (170 ch Common Rail / Injecteur-Pompe)", power: 170, torque: 350, speed: 214, zeroToHundred: 8.2, transmission: "Manuelle 6 ou DSG6" }
        ],
        notableEditions: ["FR Supercopa"]
      }
    ],
    records: [{ type: "Style Audi", description: "A marqué le renouveau stylistique agressif de la marque espagnole." }],
    userRecords: []
  },
  {
    id: "seat-leon-fr-mk3",
    brand: "SEAT",
    model: "Seat León FR (Mk3 - 5F)",
    category: "Coupé",
    years: "2013 - 2020",
    description: "Basée sur la plateforme moderne MQB du groupe VW. Éclairage full LED pionnier dans la catégorie.",
    image: "img/seat-leon-fr-mk3.jpg",
    phases: [
      {
        phaseName: "TSI & TDI Modular",
        details: "Sélecteur de modes de conduite (Seat Drive Profile), jantes spécifiques FR.",
        engines: [
          { name: "1.4 TSI / 1.5 TSI ACT (150 ch)", power: 150, torque: 250, speed: 215, zeroToHundred: 8.0, transmission: "Manuelle 6 ou DSG7" },
          { name: "1.8 TSI (180 ch)", power: 180, torque: 250, speed: 226, zeroToHundred: 7.5, transmission: "Manuelle 6 ou DSG7" },
          { name: "2.0 TSI (190 ch)", power: 190, torque: 320, speed: 233, zeroToHundred: 7.4, transmission: "DSG7" },
          { name: "2.0 TDI (150 / 184 ch)", power: 184, torque: 380, speed: 228, zeroToHundred: 7.4, transmission: "Manuelle 6 ou DSG6" }
        ],
        notableEditions: ["FR Edition Plus", "Black Line"]
      }
    ],
    records: [{ type: "Technologie Full LED", description: "Première compacte de grande diffusion à proposer des projecteurs avant 100% LED." }],
    userRecords: []
  },
  {
    id: "seat-leon-fr-mk4",
    brand: "SEAT",
    model: "Seat León FR (Mk4 - KL)",
    category: "Coupé",
    years: "2020 - Présent",
    description: "Quatrième génération high-tech, disponible en berline et break Sportstourer, avec motorisations eTSI et hybrides rechargeables.",
    image: "img/seat-leon-fr-mk4.jpg",
    phases: [
      {
        phaseName: "eTSI, TDI & Hybride e-Hybrid",
        details: "Bandeau lumineux arrière traversant, éclairage d'ambiance enveloppant intelligent.",
        engines: [
          { name: "1.5 eTSI Hybridation Légère (150 ch)", power: 150, torque: 250, speed: 221, zeroToHundred: 8.4, transmission: "DSG7" },
          { name: "2.0 TDI (150 ch)", power: 150, torque: 360, speed: 221, zeroToHundred: 8.5, transmission: "Manuelle 6 ou DSG7" },
          { name: "1.4 e-Hybrid Rechargeable (204 ch)", power: 204, torque: 350, speed: 220, zeroToHundred: 7.5, transmission: "DSG6 Hybride" }
        ],
        notableEditions: ["FR Go", "FR Launch Edition"]
      }
    ],
    records: [{ type: "Connectivité Totale", description: "Intégration d'un écosystème numérique complet et de l'hybridation légère." }],
    userRecords: []
  },
  /* ==========================================================================
     NISSAN SILVIA PS13 & HYBRIDES S13 / 180SX
     ========================================================================== */
  {
    id: "nissan-silvia-ps13",
    brand: "Nissan",
    model: "Nissan Silvia PS13 (K's / J's, SR20)",
    category: "Coupé",
    years: "1991 - 1993",
    description: "Le « P » de PS13 désigne la Silvia S13 restylée équipée du bloc SR20 : plus moderne que le CA18, il est disponible en atmosphérique (J's, Q's) ou turbo (K's, 205 ch). C'est la base préférée des drifteurs avant l'arrivée de la S14.",
    image: "img/silvia-s13.jpg",
    phases: [
      {
        phaseName: "Silvia PS13 (SR20DE / SR20DET)",
        details: "Face avant lissée, phares fixes, intérieur revu. Le K's reçoit le SR20DET et le différentiel à glissement limité.",
        engines: [
          { name: "2.0L SR20DE (140 ch)", power: 140, torque: 181, speed: 205, zeroToHundred: 8.6, transmission: "Manuelle 5 / Auto 4" },
          { name: "2.0L Turbo SR20DET (205 ch)", power: 205, torque: 275, speed: 230, zeroToHundred: 6.6, transmission: "Manuelle 5" }
        ],
        notableEditions: ["K's", "J's", "Q's"]
      }
    ],
    records: [{ type: "Base du drift", description: "Avec la 180SX, la plateforme S13 la plus transformée pour la compétition de drift." }],
    userRecords: []
  },
  {
    id: "nissan-onevia",
    brand: "Nissan",
    model: "Nissan Onevia (180SX à nez de Silvia)",
    category: "Coupé",
    years: "1990 - 1998",
    description: "Hybride née dans le tuning japonais : une 180SX (hayon) sur laquelle on a monté la face avant de la Silvia S13, d'où « One-via ». Un classique des voitures de drift et des mangas.",
    image: "img/silvia-s13.jpg",
    phases: [
      {
        phaseName: "Onevia (base RPS13)",
        details: "Transformation non officielle : carrosserie hayon de 180SX, phares et capot de Silvia. Mécanique d'origine de la 180SX.",
        engines: [
          { name: "1.8L Turbo CA18DET (175 ch)", power: 175, torque: 225, speed: 220, zeroToHundred: 7.0, transmission: "Manuelle 5" },
          { name: "2.0L Turbo SR20DET (205 ch)", power: 205, torque: 275, speed: 230, zeroToHundred: 6.4, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Conversion tuning (non officielle)"]
      }
    ],
    records: [{ type: "Culture drift", description: "Symbole des 180SX transformées du circuit de drift et des films / mangas de la scène japonaise." }],
    userRecords: []
  },
  {
    id: "nissan-sileighty",
    brand: "Nissan",
    model: "Nissan Sileighty (Silvia à nez de 180SX)",
    category: "Coupé",
    years: "1990 - 1998",
    description: "Le contraire de l'Onevia : une Silvia S13 coupé qui reçoit la face avant à phares escamotables de la 180SX (« Sil-eighty »). Mélange de deux noms, Silvia et 180SX, devenu un monument de la culture drift.",
    image: "img/silvia-s13.jpg",
    phases: [
      {
        phaseName: "Sileighty (base PS13 / S13)",
        details: "Transformation non officielle : coque coupé de Silvia, capot et phares escamotables de 180SX. Mécanique d'origine de la Silvia.",
        engines: [
          { name: "1.8L Turbo CA18DET (175 ch)", power: 175, torque: 225, speed: 220, zeroToHundred: 7.0, transmission: "Manuelle 5" },
          { name: "2.0L Turbo SR20DET (205 ch)", power: 205, torque: 275, speed: 230, zeroToHundred: 6.4, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Conversion tuning (non officielle)"]
      }
    ],
    records: [{ type: "Culture drift", description: "Hybride emblématique des voitures de drift japonaises, souvent construite autour du SR20DET." }],
    userRecords: []
  },
  /* ==========================================================================
     PEUGEOT 206 QUIKSILVER
     ========================================================================== */
  {
    id: "peugeot-206-quiksilver",
    brand: "Peugeot",
    model: "206 Quiksilver (Quicksilver)",
    category: "Berline",
    years: "2002 - 2005",
    description: "Série spéciale de la 206 réalisée avec la marque de surf et de skate Quiksilver : coloris, sellerie et détails dédiés, offerts sur les motorisations les plus populaires de la gamme.",
    image: "img/206-berline.jpg",
    phases: [
      {
        phaseName: "Quiksilver Phase 1 (2002 - 2003)",
        details: "Base de 206 Phase 1 avec décors et sellerie Quiksilver, jantes alliage et équipements de série enrichis.",
        engines: [
          { name: "1.4i 8V (TU3JP)", power: 75, torque: 120, speed: 170, zeroToHundred: 13.1, transmission: "Manuelle 5" },
          { name: "1.6 16V (TU5JP4)", power: 110, torque: 147, speed: 198, zeroToHundred: 9.9, transmission: "Manuelle 5" },
          { name: "2.0 HDi (DW10TD)", power: 90, torque: 205, speed: 180, zeroToHundred: 11.7, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Quiksilver Phase 1"]
      },
      {
        phaseName: "Quiksilver Phase 2 (2003 - 2005)",
        details: "Reprise de la série sur la 206 restylée (phares lisses), avec logos et sellerie Quiksilver.",
        engines: [
          { name: "1.4i 8V (TU3A)", power: 75, torque: 120, speed: 170, zeroToHundred: 13.2, transmission: "Manuelle 5" },
          { name: "1.6 16V (TU5JP4)", power: 110, torque: 147, speed: 198, zeroToHundred: 9.8, transmission: "Manuelle 5" },
          { name: "1.4 HDi (DV4TD)", power: 68, torque: 160, speed: 168, zeroToHundred: 14.7, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Quiksilver Phase 2"]
      }
    ],
    records: [{ type: "Série spéciale", description: "Une des séries partenariats de marque les plus visibles de la carrière de la 206, la voiture française la plus produite." }],
    userRecords: []
  }
];

// Fusion automatique dans la base principale MOTORAUTO_DATABASE
if (typeof MOTORAUTO_DATABASE !== 'undefined' && typeof MOTORAUTO_EXTRA_CARS !== 'undefined') {
  MOTORAUTO_DATABASE.push(...MOTORAUTO_EXTRA_CARS);
}