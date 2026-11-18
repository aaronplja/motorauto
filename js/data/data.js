/**
 * MOTORAUTO DATABASE — ARCHIVE MONDIALE OFFICIELLE INTÉGRALE
 */

const MOTORAUTO_DATABASE = [
  /* ==========================================================================
     PEUGEOT 206
     ========================================================================== */
  {
    id: "peugeot-206-berline",
    brand: "Peugeot",
    model: "206 Berline (3 & 5 Portes)",
    category: "Berline",
    years: "1998 - 2009",
    description: "Le fer de lance du Lion, conçue sous la direction de Gérard Welter et Murat Günak. Révolution stylistique avec ses phares en amande et son capot à deux entrées d'air.",
    image: "img/206-berline.jpg",
    phases: [
      {
        phaseName: "Phase 1 (1998 - 2003)",
        details: "Optiques avant en verre strié, feux arrière nid d'abeille, baguette de coffre noire brute.",
        engines: [
          { name: "1.1i 8V (TU1JP)", power: 60, torque: 94, speed: 158, zeroToHundred: 15.2, transmission: "Manuelle 5" },
          { name: "1.4i 8V (TU3JP)", power: 75, torque: 120, speed: 170, zeroToHundred: 13.1, transmission: "Manuelle 5" },
          { name: "1.6i 8V (TU5JP)", power: 90, torque: 135, speed: 185, zeroToHundred: 11.7, transmission: "Manuelle 5" },
          { name: "1.6 16V (TU5JP4)", power: 110, torque: 147, speed: 198, zeroToHundred: 9.9, transmission: "Manuelle 5" },
          { name: "1.9 D (DW8)", power: 70, torque: 125, speed: 161, zeroToHundred: 16.1, transmission: "Manuelle 5" },
          { name: "2.0 HDi (DW10TD)", power: 90, torque: 205, speed: 180, zeroToHundred: 11.7, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Quiksilver Phase 1", "Roland Garros", "XS"]
      },
      {
        phaseName: "Phase 2 (2003 - 2009)",
        details: "Phares lisses en polycarbonate, feux arrière à cercles translucides, bandeaux peints couleur caisse.",
        engines: [
          { name: "1.1i 8V (TU1JP)", power: 60, torque: 94, speed: 158, zeroToHundred: 15.4, transmission: "Manuelle 5" },
          { name: "1.4i 8V (TU3A)", power: 75, torque: 120, speed: 170, zeroToHundred: 13.2, transmission: "Manuelle 5" },
          { name: "1.4 16V (ET3J4)", power: 90, torque: 133, speed: 180, zeroToHundred: 11.2, transmission: "Manuelle 5" },
          { name: "1.6 16V (TU5JP4)", power: 110, torque: 147, speed: 198, zeroToHundred: 9.8, transmission: "Manuelle 5 / Tiptronic" },
          { name: "1.4 HDi (DV4TD)", power: 68, torque: 160, speed: 168, zeroToHundred: 14.7, transmission: "Manuelle 5" },
          { name: "1.6 HDi 16V FAP (DV6TED4)", power: 110, torque: 240, speed: 190, zeroToHundred: 9.9, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Quiksilver Phase 2", "Griffe", "Xbox 360 Edition"]
      }
    ],
    records: [{ type: "Record Industriel Mondial", description: "Voiture française la plus produite de tous les temps avec plus de 8,3 millions d'exemplaires." }],
    userRecords: []
  },
  {
    id: "peugeot-206-s16-gt",
    brand: "Peugeot",
    model: "206 S16 & GT (WRC Homologation)",
    category: "Coupé",
    years: "1999 - 2005",
    description: "L'héritière de la 205 GTI. Moteur 2.0L 16V EW10J4. Version GT produite à 4 000 exemplaires pour homologation WRC.",
    image: "img/206-s16.jpg",
    phases: [
      {
        phaseName: "S16 & GT Spécifications",
        details: "Châssis sport, train arrière renforcé, jantes Ouragan 16 pouces.",
        engines: [
          { name: "2.0 16V EW10J4 (RFR - Euro 2)", power: 137, torque: 190, speed: 210, zeroToHundred: 8.3, transmission: "Manuelle 5" },
          { name: "2.0 16V EW10J4 (RFN - Euro 3 Mux)", power: 138, torque: 190, speed: 210, zeroToHundred: 8.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["206 GT Numérotée (4000 ex)", "S16 Pack Cuir"]
      }
    ],
    records: [{ type: "Record d'Homologation FIA", description: "Ajout de pare-chocs proéminents pour atteindre 4 mètres réglementaires." }],
    userRecords: []
  },
  {
    id: "peugeot-206-rc",
    brand: "Peugeot",
    model: "206 RC (GTI 180)",
    category: "Coupé",
    years: "2003 - 2006",
    description: "Le sommet athlétique de la gamme 206. Moteur 2.0 16V EW10J4S préparé avec Mecachrome, 177 chevaux et sièges baquets.",
    image: "img/206-rc.jpg",
    phases: [
      {
        phaseName: "Édition RC Exclusive",
        details: "Jantes 17 pouces Atlantis, double sortie d'échappement ronde juxtaposée, baquets Alcantara.",
        engines: [
          { name: "2.0 16V VVT Mecachrome (EW10J4S / RFK)", power: 177, torque: 202, speed: 220, zeroToHundred: 7.4, transmission: "Manuelle 5 courte" }
        ],
        notableEditions: ["Bleu Récife", "Rouge Aden", "GTI 180 (UK)"]
      }
    ],
    records: [{ type: "Puissance Spécifique Atmo", description: "88,5 ch par litre en atmosphérique pur, record chez PSA." }],
    userRecords: []
  },
  {
    id: "peugeot-206-cc",
    brand: "Peugeot",
    model: "206 CC (Coupé-Cabriolet)",
    category: "Coupé",
    years: "2000 - 2007",
    description: "Pionnière du marché avec son toit rigide escamotable automatique développé par Heuliez.",
    image: "img/206-cc.jpg",
    phases: [
      {
        phaseName: "Phases 1 & 2 Heuliez",
        details: "Ouverture du toit en 20 secondes, malle arrière spécifique avec poignées chromées.",
        engines: [
          { name: "1.6 16V (TU5JP4)", power: 110, torque: 147, speed: 193, zeroToHundred: 10.5, transmission: "Manuelle 5 / Auto" },
          { name: "2.0 16V S16 (EW10J4)", power: 138, torque: 190, speed: 204, zeroToHundred: 8.9, transmission: "Manuelle 5" },
          { name: "1.6 HDi 16V FAP (DV6TED4)", power: 110, torque: 240, speed: 190, zeroToHundred: 10.3, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Roland Garros", "Quiksilver", "Roxy"]
      }
    ],
    records: [{ type: "Record Mondial des Ventes Coupé-Cabriolet", description: "Plus de 369 000 exemplaires produits." }],
    userRecords: []
  },
  {
    id: "peugeot-206-sw",
    brand: "Peugeot",
    model: "206 SW (Break)",
    category: "Break",
    years: "2002 - 2007",
    description: "La version break compacte et pratique avec lunette arrière ouvrante.",
    image: "img/206-sw.jpg",
    phases: [
      {
        phaseName: "Gamme SW",
        details: "Coffre modulaire de 313 à 1136 litres, barres de toit aluminium.",
        engines: [
          { name: "1.1i 8V", power: 60, torque: 94, speed: 155, zeroToHundred: 16.1, transmission: "Manuelle 5" },
          { name: "1.4i 8V", power: 75, torque: 120, speed: 170, zeroToHundred: 13.5, transmission: "Manuelle 5" },
          { name: "1.6 16V", power: 110, torque: 147, speed: 195, zeroToHundred: 10.1, transmission: "Manuelle 5" },
          { name: "2.0 16V S16 SW", power: 138, torque: 190, speed: 205, zeroToHundred: 8.8, transmission: "Manuelle 5" },
          { name: "1.4 HDi", power: 68, torque: 160, speed: 165, zeroToHundred: 15.2, transmission: "Manuelle 5" },
          { name: "2.0 HDi", power: 90, torque: 205, speed: 180, zeroToHundred: 12.0, transmission: "Manuelle 5" },
          { name: "1.6 HDi 110", power: 110, torque: 240, speed: 190, zeroToHundred: 10.2, transmission: "Manuelle 5" }
        ],
        notableEditions: ["SW S16", "Outdoor", "Roland Garros"]
      }
    ],
    records: [{ type: "Sleeper Familial", description: "L'un des rares breaks citadins à proposer le bloc 2.0L 138ch." }],
    userRecords: []
  },
  {
    id: "peugeot-206-plus",
    brand: "Peugeot",
    model: "206+ (Restylage Final)",
    category: "Berline",
    years: "2009 - 2013",
    description: "Restylage de fin de carrière adoptant la face avant de la Peugeot 207 et une planche de bord modernisée.",
    image: "img/206-plus.jpg",
    phases: [
      {
        phaseName: "Série Finale Euro 5",
        details: "Proue de 207, feux arrière texturés en vagues, fabrication à Poissy.",
        engines: [
          { name: "1.1i 8V", power: 60, torque: 94, speed: 159, zeroToHundred: 15.3, transmission: "Manuelle 5" },
          { name: "1.4i 8V", power: 75, torque: 120, speed: 172, zeroToHundred: 13.1, transmission: "Manuelle 5" },
          { name: "1.4 HDi", power: 68, torque: 160, speed: 169, zeroToHundred: 14.6, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Urban", "Trendy", "Génération"]
      }
    ],
    records: [{ type: "Clôture de Ligne à Poissy", description: "Dernière 206 produite en France en décembre 2013." }],
    userRecords: []
  },
  {
    id: "peugeot-206-wrc",
    brand: "Peugeot Sport",
    model: "206 WRC",
    category: "Supercar",
    years: "1999 - 2003",
    description: "Le monstre sacré du Championnat du Monde des Rallyes piloté par Marcus Grönholm.",
    image: "img/206-wrc.jpg",
    phases: [
      {
        phaseName: "Spécifications WRC",
        details: "Moteur 2.0L Turbo transversal, transmission intégrale Xtrac.",
        engines: [
          { name: "2.0 Turbo 16V (Bride FIA)", power: 300, torque: 535, speed: 225, zeroToHundred: 3.9, transmission: "Séquentielle 6 rapports 4x4" }
        ],
        notableEditions: ["Esso Ultron", "Marlboro Red"]
      }
    ],
    records: [{ type: "Triple Championne du Monde WRC", description: "Titres constructeurs en 2000, 2001 et 2002." }],
    userRecords: []
  },
  {
    id: "peugeot-206-sedan",
    brand: "Peugeot",
    model: "206 Sedan (Tricorps)",
    category: "Berline",
    years: "2006 - 2015",
    description: "Version à malle séparée de 402 litres pour les marchés internationaux.",
    image: "img/206-sedan.jpg",
    phases: [
      {
        phaseName: "Série Internationale SD",
        details: "Longueur portée à 4,18 m, trains renforcés.",
        engines: [
          { name: "1.4i 8V", power: 75, torque: 120, speed: 170, zeroToHundred: 13.6, transmission: "Manuelle 5" },
          { name: "1.6 16V", power: 110, torque: 147, speed: 195, zeroToHundred: 10.4, transmission: "Manuelle 5" }
        ],
        notableEditions: ["SD V8", "Pack Cuir Export"]
      }
    ],
    records: [{ type: "Rayonnement Mondial", description: "Exportée dans plus de 30 pays." }],
    userRecords: []
  },

  /* ==========================================================================
     PEUGEOT 205
     ========================================================================== */
  {
    id: "peugeot-205-berline",
    brand: "Peugeot",
    model: "205 Berline",
    category: "Berline",
    years: "1983 - 1998",
    description: "La 'sacrée numéro' qui a sauvé Peugeot au milieu des années 1980.",
    image: "img/205-berline.jpg",
    phases: [
      {
        phaseName: "Phases 1 & 2",
        details: "Simplicité mécanique absolue et tenue de route légendaire.",
        engines: [
          { name: "1.0 (TU9)", power: 45, torque: 73, speed: 138, zeroToHundred: 18.0, transmission: "Manuelle 4" },
          { name: "1.1 (TU1)", power: 55, torque: 88, speed: 150, zeroToHundred: 15.0, transmission: "Manuelle 4/5" },
          { name: "1.4 (TU3)", power: 75, torque: 111, speed: 170, zeroToHundred: 12.0, transmission: "Manuelle 5" },
          { name: "1.8 Diesel", power: 60, torque: 118, speed: 155, zeroToHundred: 15.0, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Junior", "Sacré Numéro", "Génération", "Roland Garros"]
      }
    ],
    records: [{ type: "Sauveur du Groupe PSA", description: "Plus de 5,3 millions d'exemplaires produits." }],
    userRecords: []
  },
  {
    id: "peugeot-205-gti",
    brand: "Peugeot",
    model: "205 GTI (1.6 & 1.9)",
    category: "Coupé",
    years: "1984 - 1994",
    description: "La référence absolue des sportives compactes. Châssis ultra-vif.",
    image: "img/205-gti.jpg",
    phases: [
      {
        phaseName: "Gamme GTI",
        details: "Extensions d'ailes noires mates, jantes Speedline 15 pouces sur 1.9.",
        engines: [
          { name: "1.6 GTI 105 ch (XU5J)", power: 105, torque: 131, speed: 190, zeroToHundred: 9.5, transmission: "Manuelle 5" },
          { name: "1.6 GTI 115 ch (XU5JA)", power: 115, torque: 134, speed: 196, zeroToHundred: 9.1, transmission: "Manuelle 5" },
          { name: "1.9 GTI 130 ch (XU9JA)", power: 130, torque: 161, speed: 206, zeroToHundred: 7.8, transmission: "Manuelle 5" },
          { name: "1.9 GTI 122 ch Catalysée (XU9JAZ)", power: 122, torque: 142, speed: 202, zeroToHundred: 8.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Griffe", "Gentry"]
      }
    ],
    records: [{ type: "Mythe Automobile", description: "Considérée comme la meilleure sportive compacte de tous les temps." }],
    userRecords: []
  },
  {
    id: "peugeot-205-rallye",
    brand: "Peugeot Sport",
    model: "205 Rallye",
    category: "Coupé",
    years: "1988 - 1992",
    description: "Épurée pour la compétition. Moteur TU24 1.3L à double corps Weber, 790 kg.",
    image: "img/205-rallye.jpg",
    phases: [
      {
        phaseName: "1.3L Weber",
        details: "Peinture blanche Meije, jantes tôlées blanches, dépouillée de tout superflu.",
        engines: [
          { name: "1.3 Rallye (TU24 - 103 ch)", power: 103, torque: 118, speed: 190, zeroToHundred: 9.6, transmission: "Manuelle 5 courte" },
          { name: "1.4 Rallye (TU3M - 75 ch - export/fin)", power: 75, torque: 111, speed: 170, zeroToHundred: 12.0, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Version France & Export"]
      }
    ],
    records: [{ type: "Rapport Plaisir / Prix", description: "Le pur-sang le plus accessible de l'histoire." }],
    userRecords: []
  },
  {
    id: "peugeot-205-cti",
    brand: "Peugeot",
    model: "205 CTI (Cabriolet)",
    category: "Coupé",
    years: "1986 - 1994",
    description: "La version découvrable de la GTI assemblée par Pininfarina.",
    image: "img/205-cti.jpg",
    phases: [
      {
        phaseName: "Cabriolet Pininfarina",
        details: "Renforts de caisse, capote souple, extensions d'ailes GTI.",
        engines: [
          { name: "1.6 CTI (115 ch)", power: 115, torque: 134, speed: 185, zeroToHundred: 9.7, transmission: "Manuelle 5" },
          { name: "1.6 CTI Catalysée (105 ch)", power: 105, torque: 131, speed: 180, zeroToHundred: 10.2, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Standard", "Roland Garros"]
      }
    ],
    records: [{ type: "Élégance & Sport", description: "Cabriolet 4 places emblématique des années 80." }],
    userRecords: []
  },
  {
    id: "peugeot-205-t16",
    brand: "Peugeot Talbot Sport",
    model: "205 Turbo 16 (Groupe B)",
    category: "Supercar",
    years: "1984 - 1986",
    description: "Monstre sacré du Groupe B à moteur central arrière et transmission intégrale.",
    image: "img/205-t16.jpg",
    phases: [
      {
        phaseName: "Série 200 & Evo 2",
        details: "Châssis tubulaire, moteur turbo de plus de 450 ch en course.",
        engines: [
          { name: "1.8 Turbo 16V XU8T (Route - 200 ch)", power: 200, torque: 255, speed: 210, zeroToHundred: 6.0, transmission: "Manuelle 5 + 4x4" },
          { name: "1.8 Turbo Evo 2 (Rallye - 500+ ch)", power: 500, torque: 490, speed: 240, zeroToHundred: 2.5, transmission: "Course intégrale" }
        ],
        notableEditions: ["Série 200 Client", "Evo 2 WRC"]
      }
    ],
    records: [{ type: "Championne du Monde WRC", description: "Titres mondiaux en 1985 et 1986." }],
    userRecords: []
  },

  /* ==========================================================================
     PEUGEOT 306
     ========================================================================== */
  {
    id: "peugeot-306-berline",
    brand: "Peugeot",
    model: "306 Berline",
    category: "Berline",
    years: "1993 - 2002",
    description: "Compacte légendaire signée Pininfarina dotée du train arrière autodirectionnel.",
    image: "img/306-berline.jpg",
    phases: [
      {
        phaseName: "Phases 1, 2 & 3",
        details: "Phase 3 : phares lisses, antibrouillards ronds.",
        engines: [
          { name: "1.4i", power: 75, torque: 111, speed: 170, zeroToHundred: 13.9, transmission: "Manuelle 5" },
          { name: "1.6i", power: 90, torque: 135, speed: 180, zeroToHundred: 11.8, transmission: "Manuelle 5" },
          { name: "1.8 16V", power: 112, torque: 155, speed: 187, zeroToHundred: 10.5, transmission: "Manuelle 5" },
          { name: "2.0 16V XSI", power: 123, torque: 176, speed: 197, zeroToHundred: 9.8, transmission: "Manuelle 5" },
          { name: "2.0 HDi", power: 90, torque: 205, speed: 180, zeroToHundred: 12.0, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Roland Garros", "Eden Park", "XSI"]
      }
    ],
    records: [{ type: "Tenue de Route", description: "Référence absolue de sa catégorie." }],
    userRecords: []
  },
  {
    id: "peugeot-306-s16",
    brand: "Peugeot",
    model: "306 S16 (ACAV & BV6)",
    category: "Coupé",
    years: "1993 - 2001",
    description: "Phase 1 ACAV (155 ch) puis l'apothéose BV6 (167 ch) avec boîte 6 vitesses.",
    image: "img/306-s16.jpg",
    phases: [
      {
        phaseName: "ACAV & BV6",
        details: "Moteur XU10J4 (ACAV) et XU10J4RS (BV6).",
        engines: [
          { name: "2.0 16V ACAV (150 ch - XU10J4D)", power: 150, torque: 183, speed: 212, zeroToHundred: 8.8, transmission: "Manuelle 5" },
          { name: "2.0 16V ACAV (155 ch - XU10J4)", power: 155, torque: 183, speed: 215, zeroToHundred: 8.5, transmission: "Manuelle 5" },
          { name: "2.0 16V BV6 (167 ch - XU10J4RS)", power: 167, torque: 193, speed: 220, zeroToHundred: 8.2, transmission: "Manuelle 6" }
        ],
        notableEditions: ["BV6 Confort", "Premium"]
      }
    ],
    records: [{ type: "Boîte BV6", description: "Pionnière des boîtes 6 sportives en France." }],
    userRecords: []
  },
  {
    id: "peugeot-306-cabriolet",
    brand: "Peugeot",
    model: "306 Cabriolet",
    category: "Coupé",
    years: "1994 - 2002",
    description: "Assemblé à la main par Pininfarina à Turin. Lignes intemporelles.",
    image: "img/306-cabriolet.jpg",
    phases: [
      {
        phaseName: "Cabriolet Pininfarina",
        details: "Capote entièrement automatique, 4 vraies places.",
        engines: [
          { name: "1.8 16V", power: 112, torque: 155, speed: 188, zeroToHundred: 11.0, transmission: "Manuelle 5" },
          { name: "2.0 16V", power: 135, torque: 180, speed: 200, zeroToHundred: 9.8, transmission: "Manuelle 5 / Auto" }
        ],
        notableEditions: ["Roland Garros", "Pack Cuir"]
      }
    ],
    records: [{ type: "Design Élu", description: "Plus beau cabriolet de l'année à sa sortie." }],
    userRecords: []
  },
  {
    id: "peugeot-306-break",
    brand: "Peugeot",
    model: "306 Break",
    category: "Break",
    years: "1997 - 2002",
    description: "Version break élégante et spacieuse de la compacte auvergnate.",
    image: "img/306-break.jpg",
    phases: [
      {
        phaseName: "Gamme Break",
        details: "Grand volume de chargement, confort préservé.",
        engines: [
          { name: "1.4i", power: 75, torque: 111, speed: 168, zeroToHundred: 14.5, transmission: "Manuelle 5" },
          { name: "1.6i", power: 90, torque: 135, speed: 175, zeroToHundred: 12.5, transmission: "Manuelle 5" },
          { name: "2.0 HDi", power: 90, torque: 205, speed: 178, zeroToHundred: 12.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["XT", "Saphir"]
      }
    ],
    records: [{ type: "Polyvalence", description: "Idéal pour les longs trajets." }],
    userRecords: []
  },
  {
    id: "peugeot-306-maxi",
    brand: "Peugeot Sport",
    model: "306 Maxi (Kit-Car)",
    category: "Supercar",
    years: "1995 - 1998",
    description: "Monstre sacré du rallye asphalte F2000, 280 ch atmosphériques à 8700 tr/min.",
    image: "img/306-maxi.jpg",
    phases: [
      {
        phaseName: "Kit-Car Officiel",
        details: "Voies larges, boîte séquentielle 6 vitesses.",
        engines: [
          { name: "2.0 16V XU10J4RS Maxi Atmos", power: 280, torque: 250, speed: 235, zeroToHundred: 3.8, transmission: "Séquentielle 6" }
        ],
        notableEditions: ["Tour de Corse"]
      }
    ],
    records: [{ type: "Roi de l'Asphalte", description: "Vainqueur face aux 4 roues motrices WRC." }],
    userRecords: []
  },

  /* ==========================================================================
     CITROËN SAXO
     ========================================================================== */
  {
    id: "saxo-berline",
    brand: "Citroën",
    model: "Citroën Saxo Berline",
    category: "Berline",
    years: "1996 - 2003",
    description: "Citadine agile et légère, cousine de la Peugeot 106.",
    image: "img/saxo-berline.jpg",
    phases: [
      {
        phaseName: "Phases 1, 2 & 3",
        details: "Phase 2 : calandre aux chevrons intégrés au capot.",
        engines: [
          { name: "1.0i", power: 45, torque: 74, speed: 150, zeroToHundred: 18.0, transmission: "Manuelle 4/5" },
          { name: "1.1i", power: 60, torque: 87, speed: 162, zeroToHundred: 15.3, transmission: "Manuelle 5" },
          { name: "1.4i", power: 75, torque: 111, speed: 175, zeroToHundred: 12.5, transmission: "Manuelle 5" },
          { name: "1.5 D", power: 58, torque: 95, speed: 158, zeroToHundred: 16.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Bic", "K-Way", "Exclusive"]
      }
    ],
    records: [{ type: "Légèreté", description: "Moins de 850 kg." }],
    userRecords: []
  },
  {
    id: "saxo-vts",
    brand: "Citroën",
    model: "Citroën Saxo VTS (8V & 16V)",
    category: "Coupé",
    years: "1996 - 2003",
    description: "Terreur des GTI, 935 kg et 120 ch pour la bouillante version 16V.",
    image: "img/saxo-vts.jpg",
    phases: [
      {
        phaseName: "Gamme VTS",
        details: "Châssis affûté, jantes 15 pouces Toulouse sur 16V.",
        engines: [
          { name: "1.6 8V (90 ch)", power: 90, torque: 135, speed: 185, zeroToHundred: 10.5, transmission: "Manuelle 5" },
          { name: "1.6 8V VTS (100 ch)", power: 100, torque: 135, speed: 195, zeroToHundred: 9.9, transmission: "Manuelle 5" },
          { name: "1.6 16V VTS (120 ch - TU5J4)", power: 120, torque: 145, speed: 205, zeroToHundred: 7.7, transmission: "Manuelle 5 courte" }
        ],
        notableEditions: ["New Morning", "Kit Cup"]
      }
    ],
    records: [{ type: "Roi des Petites Sportives", description: "Incontournable en slalom et côte." }],
    userRecords: [{ pilot: "VTS_Driver", track: "Lohéac Circuit", chrono: "1:04.20", note: "Saxo 16V stock" }]
  },
  {
    id: "saxo-s1600",
    brand: "Citroën Racing",
    model: "Saxo Super 1600",
    category: "Supercar",
    years: "2001 - 2004",
    description: "Bolide de développement Junior WRC de Sébastien Loeb.",
    image: "img/saxo-s1600.jpg",
    phases: [
      {
        phaseName: "S1600 FIA",
        details: "215 ch à 8500 tr/min, séquentielle 6 vitesses.",
        engines: [
          { name: "1.6 16V S1600 Atmos", power: 215, torque: 180, speed: 215, zeroToHundred: 4.5, transmission: "Séquentielle 6" }
        ],
        notableEditions: ["Junior Team"]
      }
    ],
    records: [{ type: "Tremplin de Loeb", description: "Premières victoires internationales de Sébastien Loeb." }],
    userRecords: []
  },
  {
    id: "saxo-electrique",
    brand: "Citroën",
    model: "Saxo Électrique",
    category: "Berline",
    years: "1997 - 2003",
    description: "Pionnière de l'électromobilité de série en Europe.",
    image: "img/saxo-ev.jpg",
    phases: [
      {
        phaseName: "EV First-Gen",
        details: "Batteries Ni-Cd Saft, autonomie 90 km.",
        engines: [
          { name: "Électrique DC Leroy-Somer", power: 27, torque: 127, speed: 91, zeroToHundred: 23.0, transmission: "Monovitesse" }
        ],
        notableEditions: ["Administrations"]
      }
    ],
    records: [{ type: "Pionnière ZEV", description: "Flottes postales des années 90." }],
    userRecords: []
  },

  /* ==========================================================================
     PEUGEOT 106
     ========================================================================== */
  {
    id: "peugeot-106-berline",
    brand: "Peugeot",
    model: "106 Berline",
    category: "Berline",
    years: "1991 - 2003",
    description: "Citadine compacte agile et nerveuse.",
    image: "img/106-berline.jpg",
    phases: [
      {
        phaseName: "Phases 1 & 2",
        details: "Phase 2 en 1996 avec rondeurs et sécurité renforcée.",
        engines: [
          { name: "1.0i", power: 45, torque: 74, speed: 145, zeroToHundred: 18.5, transmission: "Manuelle 4/5" },
          { name: "1.1i", power: 60, torque: 88, speed: 165, zeroToHundred: 15.0, transmission: "Manuelle 5" },
          { name: "1.4i", power: 75, torque: 116, speed: 175, zeroToHundred: 12.2, transmission: "Manuelle 5" },
          { name: "1.5 D", power: 58, torque: 95, speed: 158, zeroToHundred: 16.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Enfant Terrible", "Color Line"]
      }
    ],
    records: [{ type: "Poids Plume", description: "Moins de 800 kg." }],
    userRecords: []
  },
  {
    id: "peugeot-106-xsi",
    brand: "Peugeot",
    model: "106 XSI",
    category: "Coupé",
    years: "1992 - 1996",
    description: "Ancêtre des bombinettes sportives de poche 106.",
    image: "img/106-xsi.jpg",
    phases: [
      {
        phaseName: "1.4 & 1.6 XSI",
        details: "Liserés rouges, suspensions sport.",
        engines: [
          { name: "1.4 XSI (95 ch)", power: 95, torque: 118, speed: 190, zeroToHundred: 10.0, transmission: "Manuelle 5" },
          { name: "1.6 XSI (105 ch)", power: 105, torque: 132, speed: 195, zeroToHundred: 9.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["XSI Phase 1 & 2"]
      }
    ],
    records: [{ type: "Agilité", description: "Train avant redoutable." }],
    userRecords: []
  },
  {
    id: "peugeot-106-rallye",
    brand: "Peugeot Sport",
    model: "106 Rallye",
    category: "Coupé",
    years: "1993 - 2000",
    description: "Graal des pistards : 1.3L 100ch (Phase 1) ou 1.6L 103ch (Phase 2).",
    image: "img/106-rallye.jpg",
    phases: [
      {
        phaseName: "1.3L & 1.6L Rallye",
        details: "Jantes tôlées blanches, dépouillée de tout confort.",
        engines: [
          { name: "1.3 Rallye (100 ch - TU2J2)", power: 100, torque: 108, speed: 190, zeroToHundred: 9.8, transmission: "Manuelle 5 courte" },
          { name: "1.6 Rallye (103 ch - TU5J2)", power: 103, torque: 132, speed: 195, zeroToHundred: 9.3, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Blanche Meije", "Jaune Sarius"]
      }
    ],
    records: [{ type: "Cote Culte", description: "Jeune fille terrible très recherchée." }],
    userRecords: [{ pilot: "RallyeBoy", track: "Turini", chrono: "Spéciale", note: "106 Rallye 1.3" }]
  },
  {
    id: "peugeot-106-s16",
    brand: "Peugeot",
    model: "106 S16 & GTI",
    category: "Coupé",
    years: "1996 - 2003",
    description: "Moteur 1.6 16V TU5J4 de 118 chevaux pour 950 kg.",
    image: "img/106-s16.jpg",
    phases: [
      {
        phaseName: "1.6 16V",
        details: "Disques ventilés, voies élargies.",
        engines: [
          { name: "1.6 16V (118 ch - TU5J4)", power: 118, torque: 142, speed: 205, zeroToHundred: 8.7, transmission: "Manuelle 5" }
        ],
        notableEditions: ["S16 Confort", "GTI (UK)"]
      }
    ],
    records: [{ type: "Bombinette", description: "Rapport poids/puissance redoutable." }],
    userRecords: []
  },

  /* ==========================================================================
     MAZDA MX-5 (MIATA)
     ========================================================================== */
  {
    id: "mazda-mx5-na",
    brand: "Mazda",
    model: "Mazda MX-5 Miata (NA)",
    category: "Coupé",
    years: "1989 - 1997",
    description: "Roadster léger propulsion avec phares escamotables iconiques.",
    image: "img/mx5-na.jpg",
    phases: [
      {
        phaseName: "1.6 & 1.8 NA",
        details: "Répartition des masses 50/50, double triangle.",
        engines: [
          { name: "1.6 16V (115 ch)", power: 115, torque: 135, speed: 195, zeroToHundred: 8.8, transmission: "Manuelle 5" },
          { name: "1.8 16V (130 ch)", power: 130, torque: 155, speed: 200, zeroToHundred: 8.3, transmission: "Manuelle 5" }
        ],
        notableEditions: ["V-Special", "BRG"]
      }
    ],
    records: [{ type: "Record Guinness", description: "Roadster le plus vendu au monde." }],
    userRecords: []
  },
  {
    id: "mazda-mx5-nb",
    brand: "Mazda",
    model: "Mazda MX-5 (NB & NBFL)",
    category: "Coupé",
    years: "1998 - 2005",
    description: "Évolution avec phares fixes et châssis rigidifié.",
    image: "img/mx5-nb.jpg",
    phases: [
      {
        phaseName: "NB & NBFL 1.6 & 1.8 VVT",
        details: "Moteur 1.8 VVT à distribution variable.",
        engines: [
          { name: "1.6 16V (110 ch)", power: 110, torque: 134, speed: 191, zeroToHundred: 9.7, transmission: "Manuelle 5" },
          { name: "1.8 16V VVT (146 ch)", power: 146, torque: 168, speed: 208, zeroToHundred: 7.8, transmission: "Manuelle 6" }
        ],
        notableEditions: ["10th Anniversary", "Mazdaspeed Turbo"]
      }
    ],
    records: [{ type: "Reine du Trackday", description: "Très populaire sur circuit." }],
    userRecords: []
  },
  {
    id: "mazda-mx5-nc",
    brand: "Mazda",
    model: "Mazda MX-5 (NC & RC Toit Dur)",
    category: "Coupé",
    years: "2005 - 2015",
    description: "Nouvelle plateforme et version Roadster Coupé (RC) à toit rigide.",
    image: "img/mx5-nc.jpg",
    phases: [
      {
        phaseName: "NC 1.8 & 2.0 MZR",
        details: "Blocs MZR performants, toit rigide électrique léger.",
        engines: [
          { name: "1.8 MZR 16V (126 ch)", power: 126, torque: 167, speed: 196, zeroToHundred: 9.9, transmission: "Manuelle 5" },
          { name: "2.0 MZR 16V (160 ch)", power: 160, torque: 188, speed: 213, zeroToHundred: 7.9, transmission: "Manuelle 6" }
        ],
        notableEditions: ["Niseko", "25th Anniversary"]
      }
    ],
    records: [{ type: "Toit Dur Léger", description: "Poids minimal pour un coupé-cabriolet." }],
    userRecords: []
  },
  {
    id: "mazda-mx5-nd",
    brand: "Mazda",
    model: "Mazda MX-5 (ND & RF Targa)",
    category: "Coupé",
    years: "2015 - Présent",
    description: "Style Kodo acéré, moins de 1000 kg, version souple et Targa RF.",
    image: "img/mx5-nd.jpg",
    phases: [
      {
        phaseName: "ND1 & ND2 SkyActiv-G",
        details: "Motorisations 1.5L et 2.0L SkyActiv-G atmosphériques.",
        engines: [
          { name: "1.5 SkyActiv-G Atmos (132 ch)", power: 132, torque: 152, speed: 204, zeroToHundred: 8.3, transmission: "Manuelle 6" },
          { name: "2.0 SkyActiv-G Atmos (160 ch - ND1)", power: 160, torque: 200, speed: 214, zeroToHundred: 7.3, transmission: "Manuelle 6" },
          { name: "2.0 SkyActiv-G Atmos (184 ch - ND2)", power: 184, torque: 205, speed: 220, zeroToHundred: 6.5, transmission: "Manuelle 6 courte" }
        ],
        notableEditions: ["30th Anniversary", "Homura Recaro"]
      }
    ],
    records: [{ type: "World Car of the Year", description: "Voiture mondiale et design de l'année 2016." }],
    userRecords: []
  },

  /* ==========================================================================
     FIAT 1000TIPLA (VILEBREQUIN)
     ========================================================================== */
  {
    id: "fiat-1000tipla",
    brand: "Vilebrequin & W Auto Sport",
    model: "Fiat 1000Tipla (Corvette V8 1300ch)",
    category: "Supercar",
    years: "2020 - 2023",
    description: "Mariage fou entre un monospace Fiat Multipla et un châssis Corvette V8 bi-turbo de 1300 chevaux.",
    image: "img/1000tipla.jpg",
    phases: [
      {
        phaseName: "Spécifications Officielles",
        details: "Kit Rocket Bunny par Kei Miura, arceau cage FIA.",
        engines: [
          { name: "V8 6.2L Bi-Turbo Suralimenté", power: 1294, torque: 1500, speed: 300, zeroToHundred: 2.8, transmission: "Séquentielle + Propulsion" }
        ],
        notableEditions: ["Mondial de l'Auto 2022", "Merguez Show 2023"]
      }
    ],
    records: [{ type: "Crowdfunding Record", description: "Plus de 1,09 million d'euros levés en France." }],
    userRecords: [{ pilot: "Sylvain & Pierre", track: "Magny-Cours", chrono: "Show Absolu", note: "1294 ch" }]
  },

  /* ==========================================================================
     NISSAN Z
     ========================================================================== */
  {
    id: "nissan-s30-240z-280z",
    brand: "Nissan / Datsun",
    model: "Datsun / Nissan Fairlady Z (S30 / 240Z)",
    category: "Coupé",
    years: "1969 - 1978",
    description: "La pionnière de la lignée Z, inspirée des Jaguar E-Type avec son 6 cylindres en ligne.",
    image: "img/nissan-s30.jpg",
    phases: [
      {
        phaseName: "S30 (240Z & 280Z)",
        details: "Moteur L24/L28 6 cylindres en ligne, profil fastback intemporel.",
        engines: [
          { name: "2.4L L24 (240Z)", power: 151, torque: 198, speed: 201, zeroToHundred: 8.0, transmission: "Manuelle 5" },
          { name: "2.8L L28 Injection (280Z)", power: 170, torque: 221, speed: 205, zeroToHundred: 7.8, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Fairlady Z432 (Moteur S20 Skyline GT-R)"]
      }
    ],
    records: [{ type: "Safari Rally Winner", description: "Vainqueur du redoutable East African Safari Rally en 1971 et 1973." }],
    userRecords: []
  },
  {
    id: "nissan-s130-280zx",
    brand: "Nissan",
    model: "Nissan Fairlady Z / 280ZX (S130)",
    category: "Coupé",
    years: "1978 - 1983",
    description: "Évolution Grand Tourisme (GT) de la S30, introduisant la suralimentation turbo.",
    image: "img/nissan-s130.jpg",
    phases: [
      {
        phaseName: "280ZX Atmos & Turbo",
        details: "Toits T-Top en verre, confort accru, premier bloc turbo de la gamme Z.",
        engines: [
          { name: "2.8L L28E Atmos", power: 145, torque: 203, speed: 198, zeroToHundred: 9.1, transmission: "Manuelle 5" },
          { name: "2.8L L28ET Turbo", power: 180, torque: 275, speed: 210, zeroToHundred: 7.4, transmission: "Manuelle 5" }
        ],
        notableEditions: ["10th Anniversary Edition"]
      }
    ],
    records: [{ type: "Succès US", description: "Plus de 80 000 ventes en 1979 aux États-Unis." }],
    userRecords: []
  },
  {
    id: "nissan-z31-300zx",
    brand: "Nissan",
    model: "Nissan 300ZX (Z31)",
    category: "Coupé",
    years: "1983 - 1989",
    description: "Style anguleux des années 80, phares escamotables et passage au V6 (VG30).",
    image: "img/nissan-z31.jpg",
    phases: [
      {
        phaseName: "VG30ET Turbo",
        details: "Compteurs numériques 'Digi-Dash', V6 turbo performant.",
        engines: [
          { name: "3.0L V6 VG30E Atmos", power: 160, torque: 225, speed: 210, zeroToHundred: 8.0, transmission: "Manuelle 5" },
          { name: "3.0L V6 VG30ET Turbo", power: 205, torque: 308, speed: 232, zeroToHundred: 6.7, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Shiro Special", "50th Anniversary"]
      }
    ],
    records: [{ type: "Bonneville Salt Flats", description: "Plus de 300 km/h atteints en compétition." }],
    userRecords: []
  },
  {
    id: "nissan-z32-300zx",
    brand: "Nissan",
    model: "Nissan 300ZX (Z32 Biturbo)",
    category: "Coupé",
    years: "1989 - 2000",
    description: "Chef-d'œuvre technologique des années 90 : V6 3.0L Biturbo VG30DETT et 4 roues directrices HICAS.",
    image: "img/nissan-z32.jpg",
    phases: [
      {
        phaseName: "Twin-Turbo JDM",
        details: "Châssis CAAD, doubles turbos Garrett, freins Brembo/Nissan 4 pistons.",
        engines: [
          { name: "3.0L V6 VG30DE Atmos", power: 222, torque: 268, speed: 235, zeroToHundred: 7.2, transmission: "Manuelle 5" },
          { name: "3.0L V6 VG30DETT Twin-Turbo", power: 300, torque: 384, speed: 250, zeroToHundred: 5.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["2-Seater", "Convertible"]
      }
    ],
    records: [{ type: "Top 10 Car and Driver", description: "Classé 7 années consécutives dans le top 10 US." }],
    userRecords: []
  },
  {
    id: "nissan-350z-z33",
    brand: "Nissan",
    model: "Nissan 350Z (Z33)",
    category: "Coupé",
    years: "2002 - 2009",
    description: "Retour en force de la griffe Z. Propulsion pure mue par le V6 atmosphérique VQ35.",
    image: "img/nissan-350z.jpg",
    phases: [
      {
        phaseName: "VQ35DE & VQ35HR",
        details: "Évolution de 280 à 313 chevaux.",
        engines: [
          { name: "3.5L V6 VQ35DE (280 ch)", power: 280, torque: 363, speed: 250, zeroToHundred: 5.9, transmission: "Manuelle 6" },
          { name: "3.5L V6 VQ35DE (300 ch - Revup)", power: 300, torque: 353, speed: 250, zeroToHundred: 5.8, transmission: "Manuelle 6" },
          { name: "3.5L V6 VQ35HR (313 ch)", power: 313, torque: 358, speed: 250, zeroToHundred: 5.7, transmission: "Manuelle 6" }
        ],
        notableEditions: ["Track Edition", "Roadster"]
      }
    ],
    records: [{ type: "Reine du Drift", description: "Plateforme majeure en compétition Formula Drift." }],
    userRecords: []
  },
  {
    id: "nissan-370z-z34",
    brand: "Nissan",
    model: "Nissan 370Z (Z34) & Nismo",
    category: "Coupé",
    years: "2009 - 2020",
    description: "Voies élargies, empattement court et boîte manuelle SynchroRev Match.",
    image: "img/nissan-370z.jpg",
    phases: [
      {
        phaseName: "VQ37VHR & Nismo",
        details: "Moteur 3.7L V6 à levée de soupapes variable VVEL, hayon en aluminium.",
        engines: [
          { name: "3.7L V6 VQ37VHR Atmos (328 ch)", power: 328, torque: 363, speed: 250, zeroToHundred: 5.3, transmission: "Manuelle 6" },
          { name: "3.7L V6 VQ37VHR Nismo (344 ch)", power: 344, torque: 371, speed: 250, zeroToHundred: 5.2, transmission: "Manuelle 6" }
        ],
        notableEditions: ["Nismo Edition", "Heritage Edition"]
      }
    ],
    records: [{ type: "SynchroRev Match", description: "Première boîte manuelle à simuler le talon-pointe automatique d'usine." }],
    userRecords: []
  },
  {
    id: "nissan-z-rz34",
    brand: "Nissan",
    model: "Nissan Z (RZ34 - 2023+)",
    category: "Coupé",
    years: "2023 - Présent",
    description: "Septième génération néo-rétro hommage à la 240Z et la 300ZX, mue par un V6 3.0L Biturbo de 405 ch.",
    image: "img/nissan-z-rz34.jpg",
    phases: [
      {
        phaseName: "VR30DDTT Performance & Nismo",
        details: "Dalle numérique 12.3 pouces, manomètres analogiques centraux rappelant la S30.",
        engines: [
          { name: "3.0L V6 VR30DDTT Biturbo (405 ch)", power: 405, torque: 475, speed: 250, zeroToHundred: 4.3, transmission: "Manuelle 6 / Auto 9" },
          { name: "3.0L V6 VR30DDTT Biturbo Nismo (420 ch)", power: 420, torque: 520, speed: 250, zeroToHundred: 4.0, transmission: "Automatique 9 rapports" }
        ],
        notableEditions: ["Proto Spec", "Z Nismo"]
      }
    ],
    records: [{ type: "Puissance de Série Record", description: "Le modèle Z de série le plus puissant de l'histoire (420 ch en Nismo)." }],
    userRecords: []
  },

  /* ==========================================================================
     NISSAN GT-R
     ========================================================================== */
  {
    id: "nissan-skyline-gtr-classic",
    brand: "Nissan",
    model: "Nissan Skyline GT-R (Hakosuka C10, Kenmeri C110, R30, R31)",
    category: "Supercar",
    years: "1969 - 1989",
    description: "Les origines légendaires du blason GT-R. De la redoutable Hakosuka et ses 50 victoires en compétition sur piste au Japon.",
    image: "img/gtr-classic.jpg",
    phases: [
      {
        phaseName: "Hakosuka (PGC10) & R31",
        details: "Moteur 6 cylindres en ligne S20 à 4 soupapes par cylindre sur les premières générations.",
        engines: [
          { name: "2.0L S20 6-en-ligne (KPGC10 Hakosuka)", power: 160, torque: 177, speed: 200, zeroToHundred: 8.2, transmission: "Manuelle 5" },
          { name: "2.0L Turbo RB20DET (Skyline R31 GTS-R)", power: 210, torque: 245, speed: 230, zeroToHundred: 6.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["KPGC10 Hardtop", "R31 GTS-R"]
      }
    ],
    records: [{ type: "Invincibilité sur Piste au Japon", description: "Plus de 50 victoires consécutives en championnat de tourisme." }],
    userRecords: []
  },
  {
    id: "nissan-skyline-gtr-r32",
    brand: "Nissan",
    model: "Nissan Skyline GT-R (R32)",
    category: "Supercar",
    years: "1989 - 1994",
    description: "Le retour de la GT-R qui a terrassé le monde de la compétition (RB26DETT biturbo, ATTESA E-TS).",
    image: "img/gtr-r32.jpg",
    phases: [
      {
        phaseName: "RB26DETT & V-Spec",
        details: "Bloc RB26DETT 2.6L 6 cylindres en ligne forgé d'usine.",
        engines: [
          { name: "2.6L 6-en-ligne Biturbo RB26DETT (280 ch)", power: 280, torque: 353, speed: 250, zeroToHundred: 5.6, transmission: "Manuelle 5 + 4x4" },
          { name: "2.6L Biturbo RB26DETT Nismo / V-Spec II", power: 315, torque: 360, speed: 255, zeroToHundred: 5.3, transmission: "Manuelle 5 + 4x4" }
        ],
        notableEditions: ["GT-R V-Spec", "GT-R N1"]
      }
    ],
    records: [{ type: "Godzilla is Born", description: "Surnommée 'Godzilla' par la presse australienne." }],
    userRecords: [{ pilot: "Kuro", track: "Tsukuba", chrono: "1:00.32", note: "R32 V-Spec II" }]
  },
  {
    id: "nissan-skyline-gtr-r33",
    brand: "Nissan",
    model: "Nissan Skyline GT-R (R33)",
    category: "Supercar",
    years: "1995 - 1998",
    description: "Évolution de la R33, empattement allongé pour une stabilité accrue à haute vitesse.",
    image: "img/gtr-r33.jpg",
    phases: [
      {
        phaseName: "RB26DETT & 400R",
        details: "Châssis rigidifié, transmission ATTESA E-TS Pro optimisée.",
        engines: [
          { name: "2.6L Biturbo RB26DETT (280 ch)", power: 280, torque: 368, speed: 250, zeroToHundred: 5.4, transmission: "Manuelle 5 + 4x4" },
          { name: "2.8L Biturbo Nismo 400R (400 ch)", power: 400, torque: 470, speed: 300, zeroToHundred: 4.0, transmission: "Manuelle 5" }
        ],
        notableEditions: ["GT-R V-Spec", "Nismo 400R"]
      }
    ],
    records: [{ type: "Sous les 8 Min au Ring", description: "Première voiture de série à passer sous les 8 minutes (7:59)." }],
    userRecords: []
  },
  {
    id: "nissan-skyline-gtr-r34",
    brand: "Nissan",
    model: "Nissan Skyline GT-R (R34)",
    category: "Supercar",
    years: "1999 - 2002",
    description: "Sommet absolu de la dynastie Skyline GT-R. Écran multifonction télémétrique.",
    image: "img/gtr-r34.jpg",
    phases: [
      {
        phaseName: "V-Spec, M-Spec & Z-Tune",
        details: "Carrosserie hyper-affûtée, appendices carbone, ultime RB26.",
        engines: [
          { name: "2.6L Biturbo RB26DETT (V-Spec / Nur - 280 ch)", power: 280, torque: 392, speed: 250, zeroToHundred: 4.9, transmission: "Getrag Manuelle 6" },
          { name: "2.8L Biturbo Z-Tune Nismo (500 ch)", power: 500, torque: 540, speed: 314, zeroToHundred: 3.8, transmission: "Getrag Manuelle 6" }
        ],
        notableEditions: ["V-Spec II Nur", "M-Spec Nür", "Nismo Z-Tune"]
      }
    ],
    records: [{ type: "Icône Culturelle", description: "Modèle fétiche de la franchise Fast & Furious." }],
    userRecords: []
  },
  {
    id: "nissan-gt-r-r35",
    brand: "Nissan",
    model: "Nissan GT-R (R35) & Nismo",
    category: "Supercar",
    years: "2007 - 2024",
    description: "Supercar tueuse de géantes. V6 3.8L Biturbo VR38DETT assemblé à la main.",
    image: "img/gtr-r35.jpg",
    phases: [
      {
        phaseName: "VR38DETT Évolutions",
        details: "De 485 chevaux sur les premiers millésimes jusqu'à 600 ch sur la version Nismo.",
        engines: [
          { name: "3.8L V6 Biturbo (2007 - 485 ch)", power: 485, torque: 588, speed: 310, zeroToHundred: 3.5, transmission: "Double embrayage 6" },
          { name: "3.8L V6 Biturbo (2012 - 550 ch)", power: 550, torque: 632, speed: 315, zeroToHundred: 2.8, transmission: "Double embrayage 6" },
          { name: "3.8L V6 Biturbo Nismo (600 ch)", power: 600, torque: 652, speed: 315, zeroToHundred: 2.7, transmission: "Double embrayage 6" }
        ],
        notableEditions: ["Black Edition", "Nismo", "Italdesign GT-R50"]
      }
    ],
    records: [{ type: "Performances Hypercar", description: "A humilié des supercars valant trois fois son prix." }],
    userRecords: [{ pilot: "Suzuki", track: "Nürburgring", chrono: "7:08.679", note: "GT-R Nismo" }]
  },

  /* ==========================================================================
     NISSAN SILVIA
     ========================================================================== */
  {
    id: "nissan-silvia-classic",
    brand: "Nissan",
    model: "Nissan Silvia (S110, S12)",
    category: "Coupé",
    years: "1975 - 1988",
    description: "Ancêtres de la lignée Silvia. Coupés sportifs et fastbacks des années 80.",
    image: "img/silvia-classic.jpg",
    phases: [
      {
        phaseName: "S110 & S12 Turbo",
        details: "Lignes anguleuses, pont arrière rigide puis multibras.",
        engines: [
          { name: "2.0L Turbo FJ20ET (190 ch)", power: 190, torque: 235, speed: 215, zeroToHundred: 7.2, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Grand Prix Edition", "RS-X"]
      }
    ],
    records: [{ type: "Pionnière Propulsion", description: "Formule compacte, moteur avant et roues arrière motrices." }],
    userRecords: []
  },
  {
    id: "nissan-silvia-s13",
    brand: "Nissan",
    model: "Nissan Silvia S13 (180SX / 200SX / 240SX)",
    category: "Coupé",
    years: "1988 - 1994",
    description: "Reine absolue du drift et du tuning japonais. Moteur CA18DET puis SR20DET. Vendue 180SX au Japon, 200SX en Europe et 240SX en Amérique du Nord (moteur KA24).",
    image: "img/silvia-s13.jpg",
    phases: [
      {
        phaseName: "CA18DET & SR20DET",
        details: "Phares fixes profilés (Silvia), version hayon 180SX à phares escamotables, commercialisée 200SX en Europe et 240SX en Amérique du Nord.",
        engines: [
          { name: "1.8L Turbo CA18DET (175 ch)", power: 175, torque: 225, speed: 220, zeroToHundred: 7.0, transmission: "Manuelle 5" },
          { name: "2.0L Turbo SR20DET (205 ch)", power: 205, torque: 275, speed: 230, zeroToHundred: 6.4, transmission: "Manuelle 5" }
        ],
        notableEditions: ["180SX (Japon)", "200SX (Europe)", "240SX (Amérique du Nord)", "Sileighty", "Onevia"]
      }
    ],
    records: [{ type: "Pilier du Drift", description: "Châssis le plus piloté en championnat D1 Grand Prix." }],
    userRecords: [{ pilot: "Keiichi", track: "Nikko", chrono: "Drift", note: "S13 SR20DET" }]
  },
  {
    id: "nissan-silvia-s14",
    brand: "Nissan",
    model: "Nissan Silvia S14 (Zenki & Kouki)",
    category: "Coupé",
    years: "1994 - 1998",
    description: "Plus large et plus ronde que la S13. Zenki et Kouki.",
    image: "img/silvia-s14.jpg",
    phases: [
      {
        phaseName: "Zenki & Kouki K's",
        details: "Moteur SR20DET optimisé avec turbo T28 sur roulements.",
        engines: [
          { name: "2.0L Turbo SR20DET (220 ch)", power: 220, torque: 275, speed: 235, zeroToHundred: 6.2, transmission: "Manuelle 5" }
        ],
        notableEditions: ["K's Aero", "Autech MF-T"]
      }
    ],
    records: [{ type: "Reine des Touges", description: "Compagne fétiche des coureurs de rue nocturnes." }],
    userRecords: []
  },
  {
    id: "nissan-silvia-s15",
    brand: "Nissan",
    model: "Nissan Silvia S15 (Spec-R & Spec-S)",
    category: "Coupé",
    years: "1999 - 2002",
    description: "Apogée absolue de la lignée Silvia. Spec-R survoltée avec boîte 6.",
    image: "img/silvia-s15.jpg",
    phases: [
      {
        phaseName: "Spec-S & Spec-R",
        details: "Version atmosphérique Spec-S et turbo Spec-R de 250 ch.",
        engines: [
          { name: "2.0L Atmos SR20DE (Spec-S - 165 ch)", power: 165, torque: 192, speed: 210, zeroToHundred: 8.0, transmission: "Manuelle 5" },
          { name: "2.0L Turbo SR20DET (Spec-R - 250 ch)", power: 250, torque: 275, speed: 250, zeroToHundred: 5.6, transmission: "Manuelle 6" }
        ],
        notableEditions: ["Spec-R Aero", "Autech Version"]
      }
    ],
    records: [{ type: "Saint Graal JDM", description: "L'un des coupés sportifs propulsion les plus prisés au monde." }],
    userRecords: []
  },

  /* ==========================================================================
     RENAULT SPORT
     ========================================================================== */
  {
    id: "renault-clio-williams-16s",
    brand: "Renault Sport",
    model: "Renault Clio 16S & Williams",
    category: "Coupé",
    years: "1991 - 1996",
    description: "Livrée Bleu Sport, jantes Speedline dorées et bloc 2.0L de 150 ch.",
    image: "img/clio-williams.jpg",
    phases: [
      {
        phaseName: "Clio 16S & Williams",
        details: "Voies élargies, trains spécifiques, moteur F7P et F7R.",
        engines: [
          { name: "1.8L 16V (F7P - Clio 16S - 140 ch)", power: 140, torque: 165, speed: 209, zeroToHundred: 8.2, transmission: "Manuelle 5" },
          { name: "2.0L 16V (F7R - Clio Williams - 150 ch)", power: 150, torque: 175, speed: 215, zeroToHundred: 7.8, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Clio Williams Numérotée", "Clio Williams Maxi"]
      }
    ],
    records: [{ type: "Safety Car F1", description: "Voiture officielle de sécurité en F1." }],
    userRecords: []
  },
  {
    id: "renault-clio-2-rs",
    brand: "Renault Sport",
    model: "Renault Clio 2 R.S. (172 / 182 / Ragnotti)",
    category: "Coupé",
    years: "2000 - 2005",
    description: "Propulsée par le moteur 2.0L F4R de 172 à 182 chevaux.",
    image: "img/clio2-rs.jpg",
    phases: [
      {
        phaseName: "RS 172 & RS 182 / Ragnotti",
        details: "Version 'Ragnotti' allégée de 85 kg sans ABS.",
        engines: [
          { name: "2.0 16V F4R (Phase 1 - 172 ch)", power: 172, torque: 200, speed: 220, zeroToHundred: 7.2, transmission: "Manuelle 5" },
          { name: "2.0 16V F4R (Phase 2/3 - 182 ch / Ragnotti)", power: 182, torque: 200, speed: 222, zeroToHundred: 7.1, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Clio Ragnotti", "Clio 182 Cup"]
      }
    ],
    records: [{ type: "Référence des GTI", description: "Élue meilleure sportive compacte de sa décennie." }],
    userRecords: [{ pilot: "Ragnotti_Fan", track: "Charade", chrono: "2:04.50", note: "Clio 2 RS Ragnotti" }]
  },
  {
    id: "renault-clio-3-rs",
    brand: "Renault Sport",
    model: "Renault Clio 3 R.S. (Cup, R26 & R26.R)",
    category: "Coupé",
    years: "2006 - 2012",
    description: "Apogée atmosphérique, diffuseur aéro fonctionnel, et l'ultime R26.R en polycarbonate.",
    image: "img/clio3-rs.jpg",
    phases: [
      {
        phaseName: "Atmos 200ch & R26.R",
        details: "Train avant à pivot indépendant, R26.R allégée de 123 kg.",
        engines: [
          { name: "2.0 16V F4R Atmos (200 ch - Cup / Luxe / R26.R)", power: 200, torque: 215, speed: 215, zeroToHundred: 6.9, transmission: "Manuelle 6" }
        ],
        notableEditions: ["F1 Team R26", "Clio R.S. R26.R"]
      }
    ],
    records: [{ type: "Record Nürburgring", description: "Record de la catégorie traction en 2008 (8:16.90)." }],
    userRecords: [{ pilot: "Pistard_33", track: "Pau-Arnos", chrono: "1:34.10", note: "Clio 3 RS Cup" }]
  },
  {
    id: "renault-clio-4-rs",
    brand: "Renault Sport",
    model: "Renault Clio 4 R.S. (200 & Trophy)",
    category: "Coupé",
    years: "2013 - 2018",
    description: "Passage au 1.6L Turbo et boîte double embrayage EDC à palettes au volant.",
    image: "img/clio4-rs.jpg",
    phases: [
      {
        phaseName: "1.6 Turbo EDC",
        details: "R.S. Monitor télémétrique, version Trophy portée à 220 ch.",
        engines: [
          { name: "1.6L Turbo M5M (200 ch - R.S. Standard)", power: 200, torque: 240, speed: 230, zeroToHundred: 6.7, transmission: "Double embrayage EDC 6" },
          { name: "1.6L Turbo M5M (220 ch - Trophy)", power: 220, torque: 280, speed: 235, zeroToHundred: 6.6, transmission: "Double embrayage EDC 6" }
        ],
        notableEditions: ["Clio R.S. Trophy"]
      }
    ],
    records: [{ type: "Ère Turbo & EDC", description: "Transition moderne vers la suralimentation." }],
    userRecords: []
  },
  {
    id: "renault-megane-2-rs",
    brand: "Renault Sport",
    model: "Renault Megane 2 R.S. (R26 & R26.R)",
    category: "Coupé",
    years: "2004 - 2008",
    description: "Moteur 2.0L Turbo de 230 ch, différentiel à glissement limité et radicale R26.R.",
    image: "img/megane2-rs.jpg",
    phases: [
      {
        phaseName: "2.0 Turbo F4RT",
        details: "Châssis Cup, différentiel à glissement limité (LSD), vitre en plexiglas Lexan sur R26.R.",
        engines: [
          { name: "2.0 16V Turbo F4RT (225 ch - Standard)", power: 225, torque: 300, speed: 236, zeroToHundred: 6.5, transmission: "Manuelle 6" },
          { name: "2.0 16V Turbo F4RT (230 ch - R26 / R26.R)", power: 230, torque: 310, speed: 236, zeroToHundred: 6.5, transmission: "Manuelle 6" }
        ],
        notableEditions: ["F1 Team R26", "Mégane R.S. R26.R"]
      }
    ],
    records: [{ type: "Record Nürburgring", description: "Chrono de référence en 2008 (8:17.00)." }],
    userRecords: [{ pilot: "Nurb_Stig_M2", track: "Nürburgring", chrono: "8:22.00", note: "Mégane 2 RS R26" }]
  },
  {
    id: "renault-megane-3-rs",
    brand: "Renault Sport",
    model: "Renault Megane 3 R.S. (Trophy & Trophy-R)",
    category: "Supercar",
    years: "2008 - 2016",
    description: "Référence mondiale des tractions sportives. Amortisseurs Öhlins et Cup.",
    image: "img/megane3-rs.jpg",
    phases: [
      {
        phaseName: "Gamme Mégane 3 R.S.",
        details: "Moteur 2.0L Turbo F4RT décliné en 250, 265 et 275 chevaux.",
        engines: [
          { name: "2.0 16V Turbo (250 ch)", power: 250, torque: 340, speed: 245, zeroToHundred: 6.1, transmission: "Manuelle 6" },
          { name: "2.0 16V Turbo Trophy (265 ch)", power: 265, torque: 360, speed: 254, zeroToHundred: 6.0, transmission: "Manuelle 6" },
          { name: "2.0 16V Turbo Trophy-R (275 ch)", power: 275, torque: 360, speed: 255, zeroToHundred: 5.8, transmission: "Manuelle 6 + LSD" }
        ],
        notableEditions: ["Cup", "Red Bull Racing RB8", "275 Trophy-R"]
      }
    ],
    records: [{ type: "Record Nürburgring Traction", description: "7:54.36 en 2014." }],
    userRecords: [{ pilot: "Laurent_Hurgon", track: "Nürburgring", chrono: "7:54.36", note: "Trophy-R officielle" }]
  },
  {
    id: "renault-megane-4-rs",
    brand: "Renault Sport",
    model: "Renault Megane 4 R.S. (Trophy & Trophy-R)",
    category: "Supercar",
    years: "2018 - 2023",
    description: "Quatre roues directrices 4Control, moteur 1.8L Turbo de 300 ch.",
    image: "img/megane4-rs.jpg",
    phases: [
      {
        phaseName: "1.8 Turbo 280ch & 300ch",
        details: "Châssis Sport et Cup, versions Trophy et Trophy-R allégée.",
        engines: [
          { name: "1.8L Turbo M5P (280 ch - R.S. Standard)", power: 280, torque: 390, speed: 255, zeroToHundred: 5.8, transmission: "Manuelle 6 ou EDC 6" },
          { name: "1.8L Turbo M5P (300 ch - Trophy & Trophy-R)", power: 300, torque: 420, speed: 260, zeroToHundred: 5.7, transmission: "Manuelle 6 ou EDC 6" }
        ],
        notableEditions: ["Trophy", "Trophy-R (Jantes carbone Fuji Light)"]
      }
    ],
    records: [{ type: "Dernier Record Nürburgring", description: "7:40.10 en 2019." }],
    userRecords: [{ pilot: "RS_Master", track: "Spa-Francorchamps", chrono: "2:38.50", note: "Mégane 4 R.S. Trophy" }]
  },
  {
    id: "renault-clio-v6",
    brand: "Renault Sport",
    model: "Renault Clio V6 (Phase 1 & Phase 2)",
    category: "Supercar",
    years: "2001 - 2005",
    description: "Citadine à moteur central arrière V6 3.0L, propulsion et voies arrière bodybuildées.",
    image: "img/clio-v6.jpg",
    phases: [
      {
        phaseName: "Phase 1 & Phase 2",
        details: "Phase 1 (230 ch) assemblée en Suède par TWR, Phase 2 (255 ch) mise au point par Porsche.",
        engines: [
          { name: "3.0L V6 L7X Atmos (Phase 1 - 230 ch)", power: 230, torque: 300, speed: 235, zeroToHundred: 6.4, transmission: "Manuelle 6" },
          { name: "3.0L V6 L7X Atmos (Phase 2 - 255 ch)", power: 255, torque: 300, speed: 250, zeroToHundred: 5.8, transmission: "Manuelle 6" }
        ],
        notableEditions: ["Clio V6 Phase 1 (TWR)", "Clio V6 Phase 2 (Porsche)"]
      }
    ],
    records: [{ type: "Exception Automobile", description: "Seule citadine au monde à moteur central arrière de série." }],
    userRecords: [{ pilot: "V6_Collector", track: "Paul Ricard", chrono: "2:31.00", note: "Clio V6 Phase 2 d'origine" }]
  },
  {
    id: "renault-spider",
    brand: "Renault Sport",
    model: "Renault Sport Spider",
    category: "Supercar",
    years: "1995 - 1999",
    description: "Premier véhicule de série de Renault Sport. Châssis poutre en aluminium et portes en élytre.",
    image: "img/renault-spider.jpg",
    phases: [
      {
        phaseName: "Saute-Vent & Pare-Brise",
        details: "Moteur central F7R de 150 ch pour 930 kg.",
        engines: [
          { name: "2.0L 16V Atmos (F7R - 150 ch)", power: 150, torque: 185, speed: 215, zeroToHundred: 6.9, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Version Saute-vent", "Version Pare-brise"]
      }
    ],
    records: [{ type: "Genèse de RS", description: "A inauguré la lignée des sportives de Dieppe." }],
    userRecords: []
  },

  /* ==========================================================================
     HONDA CIVIC
     ========================================================================== */
  {
    id: "honda-civic-classic-generation",
    brand: "Honda",
    model: "Honda Civic (Générations 1 à 4)",
    category: "Berline",
    years: "1972 - 1991",
    description: "Pionnières de la dynastie Civic, légères, économiques et dotées des blocs CVCC.",
    image: "img/civic-classic.jpg",
    phases: [
      {
        phaseName: "Gen 1 à 4",
        details: "Architecture traction avant, caisses compactes et légères.",
        engines: [
          { name: "1.2L CVCC (Gen 1 - 60 ch)", power: 60, torque: 93, speed: 145, zeroToHundred: 13.5, transmission: "Manuelle 4/5" },
          { name: "1.6L 16V D16A9 (ED7 / Si - 130 ch)", power: 130, torque: 144, speed: 195, zeroToHundred: 8.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Civic First Gen", "Si Hatchback"]
      }
    ],
    records: [{ type: "Succès Planétaire", description: "A imposé le concept de la compacte moderne." }],
    userRecords: []
  },
  {
    id: "honda-civic-eg6-vti",
    brand: "Honda",
    model: "Honda Civic (EG6 VTi)",
    category: "Coupé",
    years: "1991 - 1995",
    description: "Génération iconique EG. Introduction du moteur B16A2 VTEC hurlant à 8200 tr/min.",
    image: "img/civic-eg6.jpg",
    phases: [
      {
        phaseName: "EG6 VTi",
        details: "Hayon en deux parties, trains multibras, bloc B16A2 VTEC.",
        engines: [
          { name: "1.6L VTEC B16A2 (160 ch)", power: 160, torque: 150, speed: 215, zeroToHundred: 7.3, transmission: "Manuelle 5 courte" }
        ],
        notableEditions: ["Civic VTi EG6", "Civic ESi (125 ch)"]
      }
    ],
    records: [{ type: "L'Ère du VTEC", description: "A popularisé le son magique du VTEC." }],
    userRecords: [{ pilot: "VTEC_Kuro", track: "Tsukuba", chrono: "1:05.10", note: "EG6 stock" }]
  },
  {
    id: "honda-civic-ek9-type-r",
    brand: "Honda",
    model: "Honda Civic Type R (EK9)",
    category: "Coupé",
    years: "1997 - 2000",
    description: "Première Civic Type R. Blanc Championship White, caisse soudée et bloc B16B de 185 ch.",
    image: "img/civic-ek9.jpg",
    phases: [
      {
        phaseName: "EK9 Type R (JDM)",
        details: "Moteur B16B 1.6L atmosphérique (116 ch/L), baquets Recaro rouges.",
        engines: [
          { name: "1.6L VTEC B16B (185 ch)", power: 185, torque: 160, speed: 220, zeroToHundred: 6.7, transmission: "Manuelle 5 + LSD" }
        ],
        notableEditions: ["Championship White", "Rx Edition"]
      }
    ],
    records: [{ type: "Légende Type R", description: "L'une des tractions avant les plus pures et radicales." }],
    userRecords: []
  },
  {
    id: "honda-civic-ep3-type-r",
    brand: "Honda",
    model: "Honda Civic Type R (EP3)",
    category: "Coupé",
    years: "2001 - 2005",
    description: "Génération 'Monospace' fabriquée au Royaume-Uni. Levier au tableau de bord, bloc 2.0L K20A2.",
    image: "img/civic-ep3.jpg",
    phases: [
      {
        phaseName: "EP3 Phase 1 & 2",
        details: "Phase 2 avec direction et embrayage améliorés.",
        engines: [
          { name: "2.0L i-VTEC K20A2 (200 ch - EDM)", power: 200, torque: 196, speed: 235, zeroToHundred: 6.6, transmission: "Manuelle 6" },
          { name: "2.0L i-VTEC K20A (215 ch - JDM)", power: 215, torque: 202, speed: 240, zeroToHundred: 6.2, transmission: "Manuelle 6 + LSD" }
        ],
        notableEditions: ["Premier Edition"]
      }
    ],
    records: [{ type: "Hauts Régimes", description: "Zone rouge fixée à 8000 tr/min." }],
    userRecords: [{ pilot: "EP3_Track", track: "Silverstone", chrono: "1:08.40", note: "K20A stock" }]
  },
  {
    id: "honda-civic-fn2-type-r",
    brand: "Honda",
    model: "Honda Civic Type R (FN2)",
    category: "Coupé",
    years: "2006 - 2011",
    description: "Design futuriste en soucoupe volante, bande arrière en verre, bloc K20Z4.",
    image: "img/civic-fn2.jpg",
    phases: [
      {
        phaseName: "FN2 Type R",
        details: "Réservoir central sous les sièges avant (Magic Seats).",
        engines: [
          { name: "2.0L i-VTEC K20Z4 (201 ch)", power: 201, torque: 193, speed: 235, zeroToHundred: 6.6, transmission: "Manuelle 6" }
        ],
        notableEditions: ["Championship White Edition"]
      }
    ],
    records: [{ type: "Design UFO", description: "Lignes parmi les plus audacieuses des années 2000." }],
    userRecords: []
  },
  {
    id: "honda-civic-fk2-type-r",
    brand: "Honda",
    model: "Honda Civic Type R (FK2)",
    category: "Supercar",
    years: "2015 - 2017",
    description: "Premier passage au turbo pour la Civic Type R. Bloc 2.0L VTEC Turbo de 310 ch.",
    image: "img/civic-fk2.jpg",
    phases: [
      {
        phaseName: "FK2 VTEC Turbo",
        details: "Kit aéro agressif, quadruple échappement, mode +R.",
        engines: [
          { name: "2.0L VTEC Turbo K20C1 (310 ch)", power: 310, torque: 400, speed: 270, zeroToHundred: 5.7, transmission: "Manuelle 6 + LSD" }
        ],
        notableEditions: ["GT Pack"]
      }
    ],
    records: [{ type: "Record Nürburgring", description: "7:50.63 sur la Nordschleife." }],
    userRecords: []
  },
  {
    id: "honda-civic-fk8-type-r",
    brand: "Honda",
    model: "Honda Civic Type R (FK8)",
    category: "Supercar",
    years: "2017 - 2021",
    description: "Châssis ultra-perfectionné, appuis massifs, double pivot sur le train avant.",
    image: "img/civic-fk8.jpg",
    phases: [
      {
        phaseName: "FK8 Phase 1 & Phase 2",
        details: "Phase 2 avec meilleur refroidissement et freins en 2 pièces.",
        engines: [
          { name: "2.0L VTEC Turbo K20C1 (320 ch)", power: 320, torque: 400, speed: 272, zeroToHundred: 5.8, transmission: "Manuelle 6 + Rev-Match" }
        ],
        notableEditions: ["Limited Edition (Jaune Phoenix)"]
      }
    ],
    records: [{ type: "Roi des Chronos Traction", description: "Records de tour sur de nombreux circuits mondiaux." }],
    userRecords: [{ pilot: "Track_FK8", track: "Nürburgring", chrono: "7:43.80", note: "FK8 Trophy" }]
  },
  {
    id: "honda-civic-fl5-type-r",
    brand: "Honda",
    model: "Honda Civic Type R (FL5)",
    category: "Supercar",
    years: "2022 - Présent",
    description: "Apogée moderne Type R. Empattement élargi, performances stratosphériques.",
    image: "img/civic-fl5.jpg",
    phases: [
      {
        phaseName: "FL5 Type R",
        details: "Voies élargies, capot aluminium, application Honda LogR.",
        engines: [
          { name: "2.0L VTEC Turbo K20C1 (329 ch)", power: 329, torque: 420, speed: 275, zeroToHundred: 5.4, transmission: "Manuelle 6 courte + Rev-Match" }
        ],
        notableEditions: ["FL5 Standard", "Limited Edition"]
      }
    ],
    records: [{ type: "Record Actuel Nürburgring", description: "7:44.881 (record des tractions de série)." }],
    userRecords: [{ pilot: "HotVersion", track: "Suzuka", chrono: "2:19.99", note: "FL5 stock" }]
  },

  /* ==========================================================================
     PEUGEOT 309
     ========================================================================== */
  {
    id: "peugeot-309-berline",
    brand: "Peugeot",
    model: "309 Berline",
    category: "Berline",
    years: "1985 - 1993",
    description: "Compacte spacieuse et redoutable d'efficacité.",
    image: "img/309-berline.jpg",
    phases: [
      {
        phaseName: "Phases 1 & 2",
        details: "Phase 2 (1989) : hayon avec feux d'un seul tenant de la 405.",
        engines: [
          { name: "1.1 / 1.3", power: 55, torque: 85, speed: 150, zeroToHundred: 15.0, transmission: "Manuelle 4/5" },
          { name: "1.6i (XU5)", power: 92, torque: 132, speed: 180, zeroToHundred: 11.0, transmission: "Manuelle 5" },
          { name: "1.9 Diesel", power: 65, torque: 120, speed: 160, zeroToHundred: 14.5, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Profil", "Green", "Vital"]
      }
    ],
    records: [{ type: "Aérodynamique", description: "Version Profil au Cx record de 0.30." }],
    userRecords: []
  },
  {
    id: "peugeot-309-gti",
    brand: "Peugeot",
    model: "309 GTI & GTI 16",
    category: "Coupé",
    years: "1987 - 1992",
    description: "Grande sœur de la 205 GTI, version GTI 16 ultra-redoutable avec 160 ch.",
    image: "img/309-gti.jpg",
    phases: [
      {
        phaseName: "GTI & GTI 16",
        details: "Châssis rigide, train arrière spécifique, bloc XU9J4 16 soupapes.",
        engines: [
          { name: "1.9 GTI (130 ch - XU9JA)", power: 130, torque: 161, speed: 205, zeroToHundred: 8.0, transmission: "Manuelle 5" },
          { name: "1.9 GTI 16 (160 ch - XU9J4)", power: 160, torque: 181, speed: 220, zeroToHundred: 7.8, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Goodwood", "GTI Phase 1 & 2"]
      }
    ],
    records: [{ type: "Efficacité Piste", description: "Jugée plus stable et efficace sur circuit que la 205 GTI." }],
    userRecords: [{ pilot: "Oldschool", track: "Lohéac", chrono: "1:12.40", note: "309 GTI 16" }]
  },

  /* ==========================================================================
     PEUGEOT 406
     ========================================================================== */
  {
    id: "peugeot-406-berline-break",
    brand: "Peugeot",
    model: "406 Berline & Break",
    category: "Berline",
    years: "1995 - 2004",
    description: "Grande routière au confort légendaire, insonorisation de premier ordre.",
    image: "img/406-berline.jpg",
    phases: [
      {
        phaseName: "Phases 1 & 2",
        details: "Phase 2 (1999) : calandre redessinée, optiques transparentes, blocs HDi.",
        engines: [
          { name: "1.8 16V", power: 112, torque: 160, speed: 197, zeroToHundred: 11.0, transmission: "Manuelle 5" },
          { name: "2.0 16V (EW10J4)", power: 137, torque: 190, speed: 210, zeroToHundred: 9.9, transmission: "Manuelle 5" },
          { name: "3.0 V6 24V (207 ch - ES9J4)", power: 207, torque: 285, speed: 240, zeroToHundred: 7.9, transmission: "Manuelle 5 / Auto" },
          { name: "2.0 HDi", power: 110, torque: 250, speed: 191, zeroToHundred: 11.2, transmission: "Manuelle 5" }
        ],
        notableEditions: ["ST Pack", "SV Executive", "Navtech"]
      }
    ],
    records: [{ type: "Roi des Rouleurs", description: "Robustesse mécanique légendaire." }],
    userRecords: []
  },
  {
    id: "peugeot-406-coupe",
    brand: "Peugeot / Pininfarina",
    model: "406 Coupé (Pininfarina)",
    category: "Coupé",
    years: "1997 - 2004",
    description: "Chef-d'œuvre de design signé Pininfarina à Turin. Ligne pure.",
    image: "img/406-coupe.jpg",
    phases: [
      {
        phaseName: "Coupé Pininfarina",
        details: "Freins Brembo 4 pistons sur V6, finitions intérieures luxueuses.",
        engines: [
          { name: "2.0 16V", power: 137, torque: 190, speed: 208, zeroToHundred: 9.8, transmission: "Manuelle 5" },
          { name: "3.0 V6 24V (207 ch - ES9J4)", power: 207, torque: 285, speed: 240, zeroToHundred: 7.8, transmission: "Manuelle 5 / Auto" },
          { name: "2.2 HDi FAP", power: 136, torque: 314, speed: 205, zeroToHundred: 10.6, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Série Finale", "Ultima Repubblica"]
      }
    ],
    records: [
      { type: "Design International", description: "Plus de 20 prix de design remportés." },
      { type: "Star du Cinéma", description: "Immortalisée dans la saga 'Taxi'." }
    ],
    userRecords: [{ pilot: "Daniel", track: "Marseille", chrono: "4 min", note: "406 V6 Taxi" }]
  },

  /* ==========================================================================
     TOYOTA SUPRA
     ========================================================================== */
  {
    id: "toyota-celica-supra-a40-a60",
    brand: "Toyota",
    model: "Toyota Celica Supra (A40 & A60)",
    category: "Coupé",
    years: "1978 - 1986",
    description: "Les origines de la lignée Supra. Des coupés GT propulsés par des moteurs 6 cylindres en ligne.",
    image: "img/supra-classic.jpg",
    phases: [
      {
        phaseName: "A40 & A60",
        details: "Lignes anguleuses, phares escamotables sur A60, propulsion arrière.",
        engines: [
          { name: "2.6L 6-en-ligne 4M-E (A40 - 110 ch)", power: 110, torque: 184, speed: 175, zeroToHundred: 10.2, transmission: "Manuelle 5 / Auto" },
          { name: "2.8L 6-en-ligne 5M-GE (A60 - 175 ch)", power: 175, torque: 228, speed: 210, zeroToHundred: 8.4, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Supra Performance Type", "A60 L-Type"]
      }
    ],
    records: [{ type: "Naissance d'un Mythe GT", description: "A établi la réputation de robustesse des 6 cylindres Toyota." }],
    userRecords: []
  },
  {
    id: "toyota-supra-a70",
    brand: "Toyota",
    model: "Toyota Supra (A70)",
    category: "Coupé",
    years: "1986 - 1993",
    description: "La Supra devient un modèle à part entière (3.0L Turbo 7M-GTE puis 1JZ-GTE biturbo).",
    image: "img/supra-a70.jpg",
    phases: [
      {
        phaseName: "A70 Atmos & Turbo",
        details: "Suspensions TEMS, phares escamotables, version Turbo intercooler.",
        engines: [
          { name: "3.0L 7M-GE Atmos (200 ch)", power: 200, torque: 265, speed: 220, zeroToHundred: 7.5, transmission: "Manuelle 5 / Auto" },
          { name: "3.0L 7M-GTE Turbo (235 ch)", power: 235, torque: 344, speed: 240, zeroToHundred: 6.4, transmission: "Manuelle 5 / Auto" },
          { name: "2.5L Biturbo 1JZ-GTE JDM (280 ch)", power: 280, torque: 363, speed: 250, zeroToHundred: 5.8, transmission: "Manuelle 5 / Auto" }
        ],
        notableEditions: ["Supra 3.0 Turbo A"]
      }
    ],
    records: [{ type: "Puissance JDM", description: "L'un des premiers coupés japonais à flirter avec 280 chevaux." }],
    userRecords: []
  },
  {
    id: "toyota-supra-a80-mk4",
    brand: "Toyota",
    model: "Toyota Supra (A80 / MK4)",
    category: "Supercar",
    years: "1993 - 2002",
    description: "Le Saint Graal de l'automobile japonaise : bloc 2JZ-GTE biturbo séquentiel et aileron XXL.",
    image: "img/supra-mk4.jpg",
    phases: [
      {
        phaseName: "MK4 Atmos & Biturbo",
        details: "Boîte Getrag à 6 rapports, double turbo séquentiel, freinage redoutable.",
        engines: [
          { name: "3.0L 2JZ-GE Atmos (225 ch)", power: 225, torque: 284, speed: 240, zeroToHundred: 6.8, transmission: "Manuelle 5 / Auto" },
          { name: "3.0L Biturbo 2JZ-GTE (320 ch US / 280 ch JDM)", power: 320, torque: 427, speed: 250, zeroToHundred: 4.6, transmission: "Getrag Manuelle 6 / Auto" }
        ],
        notableEditions: ["Supra RZ", "Targa Top", "TRD 3000GT"]
      }
    ],
    records: [
      { type: "Légende du Tuning", description: "Le 2JZ-GTE encaisse plus de 1000 ch sans ouvrir le bas moteur." },
      { type: "Star du Cinéma", description: "Icône de la franchise Fast & Furious (Paul Walker)." }
    ],
    userRecords: [{ pilot: "Smokey", track: "A1 UK", chrono: "317 km/h", note: "Supra V12 Top Secret" }]
  },
  {
    id: "toyota-supra-a90-mk5",
    brand: "Toyota",
    model: "Toyota Supra (A90 / MK5 - 2019+)",
    category: "Coupé",
    years: "2019 - Présent",
    description: "Retour de la Supra co-développée avec BMW, mue par le bouillonnant bloc 6 cylindres B58.",
    image: "img/supra-mk5.jpg",
    phases: [
      {
        phaseName: "2.0L Turbo & 3.0L B58",
        details: "Lignes inspirées du concept FT-1, boîte manuelle 6 rapports introduite en 2023.",
        engines: [
          { name: "2.0L Turbo 4-cylindres (258 ch)", power: 258, torque: 400, speed: 250, zeroToHundred: 5.2, transmission: "Automatique 8 rapports" },
          { name: "3.0L 6-en-ligne Turbo B58 (382 ch)", power: 382, torque: 500, speed: 250, zeroToHundred: 4.1, transmission: "Manuelle 6 / Auto 8" }
        ],
        notableEditions: ["A90 Edition", "Manual Lightweight Edition"]
      }
    ],
    records: [{ type: "Retour Triomphal", description: "A relancé avec brio la lignée sportive de la marque." }],
    userRecords: []
  },

  /* ==========================================================================
     TOYOTA MR (MR2 & MR-S)
     ========================================================================== */
  {
    id: "toyota-mr2-aw11",
    brand: "Toyota",
    model: "Toyota MR2 (W10 / AW11)",
    category: "Coupé",
    years: "1984 - 1989",
    description: "Première voiture japonaise de série à moteur central arrière. Poids plume (<1000 kg).",
    image: "img/mr2-aw11.jpg",
    phases: [
      {
        phaseName: "AW11 Atmos & Supercharged",
        details: "Moteur 4A-GE atmosphérique hurlant puis version à compresseur suralimentée.",
        engines: [
          { name: "1.6L 16V 4A-GE Atmos (124 ch)", power: 124, torque: 142, speed: 200, zeroToHundred: 8.2, transmission: "Manuelle 5" },
          { name: "1.6L Compresseur 4A-GZE (145 ch)", power: 145, torque: 186, speed: 209, zeroToHundred: 6.8, transmission: "Manuelle 5" }
        ],
        notableEditions: ["Supercharged T-Bar"]
      }
    ],
    records: [{ type: "Pionnière Moteur Central", description: "A démocratisé l'architecture des supercars sur un format compact." }],
    userRecords: []
  },
  {
    id: "toyota-mr2-sw20",
    brand: "Toyota",
    model: "Toyota MR2 (W20 / SW20)",
    category: "Coupé",
    years: "1989 - 1999",
    description: "La 'Mini-Ferrari' aux lignes sensuelles. Versions atmosphériques et redoutables turbo 3S-GTE.",
    image: "img/mr2-sw20.jpg",
    phases: [
      {
        phaseName: "SW20 Atmos & Turbo",
        details: "Châssis retravaillé en Revision 3 (1994), freinage majoré.",
        engines: [
          { name: "2.0L 3S-GE Atmos (175 ch JDM)", power: 175, torque: 186, speed: 220, zeroToHundred: 7.5, transmission: "Manuelle 5" },
          { name: "2.0L Turbo 3S-GTE (245 ch JDM Rev 3)", power: 245, torque: 304, speed: 245, zeroToHundred: 5.9, transmission: "Manuelle 5" }
        ],
        notableEditions: ["GT-S Turbo", "T-Bar Roof"]
      }
    ],
    records: [{ type: "Comportement de Pur-Sang", description: "Équilibre pointu nécessitant du doigté." }],
    userRecords: [{ pilot: "Midship", track: "Ebisu", chrono: "Drift", note: "SW20 Turbo" }]
  },
  {
    id: "toyota-mrs-zzw30",
    brand: "Toyota",
    model: "Toyota MR-S / MR2 Spyder (ZZW30)",
    category: "Coupé",
    years: "1999 - 2007",
    description: "Troisième génération axée sur la légèreté pure et le plaisir du roadster.",
    image: "img/mrs-zzw30.jpg",
    phases: [
      {
        phaseName: "ZZW30 1.8L VVTi",
        details: "Moteur 1ZZ-FED de 140 ch implanté au centre, capote souple.",
        engines: [
          { name: "1.8L 16V VVTi (1ZZ-FED - 140 ch)", power: 140, torque: 170, speed: 210, zeroToHundred: 7.9, transmission: "Manuelle 5/6 ou SMT" }
        ],
        notableEditions: ["Roadster Edition", "VM18 Zagato"]
      }
    ],
    records: [{ type: "Agilité Ultime", description: "L'un des châssis les plus réactifs pour l'autocross." }],
    userRecords: []
  },

  /* ==========================================================================
     TOYOTA CELICA
     ========================================================================== */
  {
    id: "toyota-celica-classic",
    brand: "Toyota",
    model: "Toyota Celica (Générations 1 à 4)",
    category: "Coupé",
    years: "1970 - 1989",
    description: "Coupés sportifs populaires, de la TA22 'Mustang japonaise' aux premières GT-Four turbo.",
    image: "img/celica-classic.jpg",
    phases: [
      {
        phaseName: "TA22, TA60 & ST165",
        details: "Introduction du bloc 3S-GTE et de la transmission intégrale pour homologation WRC.",
        engines: [
          { name: "1.6L 2T-G Twin Cam (TA22 - 115 ch)", power: 115, torque: 142, speed: 185, zeroToHundred: 9.8, transmission: "Manuelle 5" },
          { name: "2.0L Turbo 3S-GTE GT-Four (ST165 - 185 ch)", power: 185, torque: 250, speed: 220, zeroToHundred: 7.7, transmission: "Manuelle 5 + 4x4" }
        ],
        notableEditions: ["GT-Four ST165 WRC"]
      }
    ],
    records: [{ type: "Rallye Mondial", description: "A posé les bases des victoires de Toyota en WRC." }],
    userRecords: []
  },
  {
    id: "toyota-celica-st185-st205",
    brand: "Toyota",
    model: "Toyota Celica GT-Four (ST185 & ST205)",
    category: "Coupé",
    years: "1989 - 1999",
    description: "Bêtes de rallye de Toyota. Moteur 2.0L Turbo 3S-GTE et transmission intégrale.",
    image: "img/celica-gtfour.jpg",
    phases: [
      {
        phaseName: "ST185 & ST205",
        details: "ST205 avec phares ronds quadruples iconiques et suspensions Super Strut.",
        engines: [
          { name: "2.0L Turbo 3S-GTE (ST185 - 208 ch)", power: 208, torque: 304, speed: 225, zeroToHundred: 7.3, transmission: "Manuelle 5 + 4x4" },
          { name: "2.0L Turbo 3S-GTE (ST205 GT-Four - 255 ch)", power: 255, torque: 304, speed: 240, zeroToHundred: 6.1, transmission: "Manuelle 5 + 4x4" }
        ],
        notableEditions: ["Carlos Sainz Edition", "GT-Four WRC Edition"]
      }
    ],
    records: [{ type: "Titres Mondiaux WRC", description: "Championne du Monde des Rallyes Constructeurs et Pilotes." }],
    userRecords: []
  },
  {
    id: "toyota-celica-zzt231",
    brand: "Toyota",
    model: "Toyota Celica (Gen 7 / ZZT231 - T-Sport)",
    category: "Coupé",
    years: "1999 - 2006",
    description: "Dernière génération de la Celica. Lignes acérées et moteur 1.8L VVTL-i hurlant à 8200 tr/min.",
    image: "img/celica-zzt231.jpg",
    phases: [
      {
        phaseName: "VVTi & VVTL-i T-Sport",
        details: "Technologie VVTL-i (levée variable des soupapes, équivalent du VTEC).",
        engines: [
          { name: "1.8L VVTi (1ZZ-FE - 143 ch)", power: 143, torque: 170, speed: 205, zeroToHundred: 8.7, transmission: "Manuelle 5/6" },
          { name: "1.8L VVTL-i T-Sport (2ZZ-GE - 192 ch)", power: 192, torque: 180, speed: 225, zeroToHundred: 7.2, transmission: "Manuelle 6 courte" }
        ],
        notableEditions: ["Celica T-Sport", "MJ Edition"]
      }
    ],
    records: [{ type: "Dernière Danse", description: "Conclusion de la saga des coupés sportifs légers de Toyota." }],
    userRecords: []
  }
];