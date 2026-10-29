/**
 * MOTORAUTO — AUDI : de l'Auto Union de 1936 aux RS d'aujourd'hui.
 * Une fiche par génération (A1, A3, A5, A6, A7, A8, TT, R8) et par version S / RS, plus les mythes quattro et les ancêtres
 * Auto Union. Les voitures du Mans (R8R, R8, R10, R15, R18…) sont dans data-lemans.js. Voir data-kit.js pour le format.
 */
(function () {
  "use strict";
  const { E, P, C, push } = MAKIT;
  const AU = "Audi";
  // familles de moteurs partagées : un même code = la même mécanique, ce qui alimente la page « Moteurs »
  const T5 = "5 cyl. turbo 2.1 / 2.2", EA113 = "EA113 2.0 TFSI", EA888 = "EA888 2.0 TFSI", T25A = "CEPA 2.5 TFSI", T25Z = "CZGB 2.5 TFSI", T25D = "DAZA 2.5 TFSI", T25N = "DNWA 2.5 TFSI",
    V42 = "CFSA 4.2 FSI V8", V52 = "5.2 FSI V10", E824 = "EA824 4.0 TFSI V8 biturbo", E825 = "EA825 4.0 TFSI V8 biturbo", E839_29 = "EA839 2.9 TFSI V6 biturbo", E839_30 = "EA839 3.0 TFSI V6", E837 = "EA837 3.0 TFSI V6 compresseur";

  /* ======================================================= LES ANCÊTRES : AUTO UNION */
  push([
    C("auto-union-type-c", "Auto Union", "Type C", "Supercar", "1936 - 1937",
      "Flèche d'argent à moteur V16 central dessinée par Ferdinand Porsche : 520 puis 545 ch pour une monoplace de Grand Prix qui a fait trembler les Mercedes en 1936.",
      [P("Type C (1936 - 1937)", "Moteur V16 6.0 litres à compresseur placé derrière le pilote, châssis tubulaire, suspension arrière à essieu oscillant. Version carénée « Stromlinie » pour les circuits rapides.", [E("6.0 V16 compresseur", 520, 0, 340, 0, "Manuelle 5", "Auto Union V16 6.0", "520 ch en 1936, 545 ch en 1937 ; vitesse de pointe avec carrosserie Stromlinie")], ["Type C Stromlinie (Avus 1937)", "Type C « Bergrennwagen »"])],
      { h: "En 1934, Auto Union s'engage dans la formule des 750 kg avec une monoplace à moteur central arrière, dessinée par le bureau d'études de Ferdinand Porsche : une idée qui ne s'imposera en Formule 1 que vingt ans plus tard. La Type C (1936) pousse le principe avec un V16 de 6.0 litres. Elle est surtout associée au pilote Bernd Rosemeyer, champion d'Europe en 1936.\n\nLa Type C est restée célèbre pour sa conduite très difficile : le moteur derrière le pilote donne une voiture nerveuse que seuls quelques as savaient dompter, comme Rosemeyer et Hans Stuck.",
        a: [["Rosemeyer, le champion", "Bernd Rosemeyer est devenu champion d'Europe des pilotes en 1936 avec l'Auto Union Type C, et reste associé à la marque des quatre anneaux."], ["Le mythe de l'Avus", "Sur le circuit de l'Avus à Berlin, les Type C carénées ont atteint des vitesses supérieures à 300 km/h lors des courses de 1937."], ["Un moteur à l'arrière avant l'heure", "La disposition moteur central arrière, pionnière, a été reprise par Cooper en Formule 1 à la fin des années 1950."]],
        r: [["Champion d'Europe 1936", "Bernd Rosemeyer, sur Auto Union Type C."]], rel: ["auto-union-type-d"], approx: true }),

    C("auto-union-type-d", "Auto Union", "Type D", "Supercar", "1938 - 1939",
      "Dernière évolution des monoplaces Auto Union avant la guerre : un V12 3.0 litres à compresseur de 485 ch, adapté à la nouvelle formule de 3 litres.",
      [P("Type D (1938 - 1939)", "Moteur V12 de 3 litres à compresseur (la formule 1938-1940 limitait les compresseurs à 3 litres), suspension arrière à essieu De Dion, boîte à 5 rapports.", [E("3.0 V12 compresseur", 485, 0, 330, 0, "Manuelle 5", "Auto Union V12 3.0", "420 ch en 1938, environ 485 ch en 1939")], ["Type D « Stromlinie »", "Type D Avus"])],
      { h: "En 1938 la réglementation internationale change : la cylindrée des moteurs suralimentés est limitée à 3 litres. Auto Union abandonne alors le V16 pour un V12 compact. Le pilote italien Tazio Nuvolari rejoint l'équipe et remporte le Grand Prix de Donington en 1938 puis le Grand Prix de Belgrade en 1939. La guerre interrompt cette période en 1939.",
        a: [["Nuvolari, victoire à Donington", "Le « Mantouan volant » a gagné en 1938 à Donington, en Angleterre, avec la Type D, au nez et à la barbe des Mercedes."], ["Après la guerre", "Les usines Auto Union de Saxe se sont retrouvées en zone soviétique ; la marque a été refondée à Ingolstadt, en Bavière, en 1949 avant d'entrer dans le groupe Volkswagen puis de fusionner avec NSU pour devenir Audi."]],
        r: [["Grand Prix de Donington 1938", "Victoire de Tazio Nuvolari."]], rel: ["auto-union-type-c"], approx: true }),

    /* ======================================================= LES MYTHES QUATTRO DES ANNÉES 80 */
    C("audi-quattro", AU, "quattro (Ur-quattro)", "Coupé", "1980 - 1991",
      "La voiture qui a inventé la sportive à quatre roues motrices permanentes : cinq cylindres turbo, transmission intégrale et un palmarès en rallye qui a changé l'histoire.",
      [P("quattro 10V (1980 - 1987)", "Cinq cylindres 2.1 litres turbo à injection, transmission intégrale permanente avec différentiel central blocable, carrosserie coupé inspirée de l'Audi 80.", [E("2.1 5 cyl. turbo", 200, 285, 220, 7.1, "Manuelle 5", T5, "Cinq cylindres en ligne à turbo, 10 soupapes")], ["quattro « Turbo »", "quattro Typ 85"]),
       P("quattro 20V (1989 - 1991)", "Moteur 2.2 litres à 20 soupapes, ABS, différentiel arrière autobloquant.", [E("2.2 5 cyl. turbo 20V", 220, 309, 230, 6.3, "Manuelle 5", T5, "Cinq cylindres en ligne à turbo, 20 soupapes")], ["quattro 20V"])],
      { h: "L'idée de la transmission intégrale d'une voiture de route naît en 1976-1977, lors d'essais hivernaux d'un Iltis militaire par l'ingénieur Jörg Bensinger. Le résultat est la quattro, présentée en 1980 au Salon de Genève : un coupé à cinq cylindres turbo et quatre roues motrices permanentes. En rallye, elle surclasse la concurrence dès 1981 : Michèle Mouton gagne le rallye de San Remo, première victoire d'une femme dans une épreuve du championnat du monde. Audi remporte le titre constructeurs en 1982 et 1984, et les pilotes Hannu Mikkola (1983) et Stig Blomqvist (1984) décrochent le titre.\n\nLa production a duré onze ans, de 1980 à 1991, avec environ 11 450 exemplaires.",
        a: [["De l'Iltis à la quattro", "L'idée est venue d'essais hivernaux avec l'Iltis, véhicule militaire à quatre roues motrices de Volkswagen ; Jörg Bensinger a constaté qu'il faisait mieux que les voitures de sport sur la neige."], ["Michèle Mouton", "La Française a gagné San Remo (1981), Portugal et Brésil (1981-82) et a fini deuxième du championnat du monde 1982."], ["« Vorsprung durch Technik »", "Le slogan d'Audi, « l'avance par la technologie », est devenu associé à la quattro."]],
        r: [["Titres constructeurs WRC", "1982 et 1984."], ["Titres pilotes WRC", "Hannu Mikkola (1983), Stig Blomqvist (1984)."]], rel: ["audi-sport-quattro", "audi-sport-quattro-s1-e2"], approx: true }),

    C("audi-sport-quattro", AU, "Sport quattro", "Coupé", "1984 - 1985",
      "L'homologation de la quattro de rallye : empattement raccourci de 32 cm, carrosserie en kevlar et plus de 300 ch pour environ 200 exemplaires.",
      [P("Sport quattro (1984 - 1985)", "Empattement ramené à 2,23 m, moteur 2.1 litres de 20 soupapes en alliage léger (tête et bloc), capot et ailes en kevlar.", [E("2.1 5 cyl. turbo 20V", 306, 350, 250, 4.8, "Manuelle 5", T5, "Cinq cylindres en ligne à turbo, 20 soupapes")], ["Sport quattro (214 exemplaires)"])],
      { h: "Pour répondre aux nouvelles règles du Groupe B (200 exemplaires minimum), Audi construit la Sport quattro : plus courte, plus légère, plus puissante. Vendue très cher (plus de 200 000 DM à l'époque), elle est rapidement surnommée la « bombe » de la route. Elle sert de base à la Sport quattro S1 de rallye.",
        a: [["Un empattement coupé", "La carrosserie est raccourcie de 32 cm entre les montants : la voiture est plus agile en spéciale que la quattro d'origine."]], r: [["Rareté", "Environ 200 exemplaires produits (214 selon certaines sources)."]], rel: ["audi-quattro", "audi-sport-quattro-s1-e2"], approx: true }),

    C("audi-sport-quattro-s1-e2", AU, "Sport quattro S1 E2 (Groupe B)", "Supercar", "1985 - 1987",
      "La bête du Groupe B : un cinq cylindres turbo de 500 ch et plus, un énorme aileron et le record de la course de côte de Pikes Peak établi en 1987.",
      [P("S1 E2 (1985 - 1986)", "Cinq cylindres 2.1 litres turbo à 20 soupapes, plus de 500 ch, aileron avant et arrière, transmission intégrale à différentiels réglables.", [E("2.1 5 cyl. turbo 20V compétition", 500, 0, 250, 3.1, "Manuelle 5", T5, "Environ 500 ch (550 ch selon les évolutions)")], ["S1 E1", "S1 E2"]),
       P("Pikes Peak (1987)", "Version préparée pour la course de côte américaine avec près de 600 ch et une aérodynamique très poussée.", [E("2.1 5 cyl. turbo 20V Pikes Peak", 598, 0, 0, 0, "Manuelle 5", T5, "Environ 600 ch")], ["Pikes Peak (Walter Röhrl)"])],
      { h: "Dans le Groupe B, les voitures étaient presque libres de règles : la Sport quattro S1 est l'une des plus extrêmes, avec un moteur dépassant 500 ch et une accélération de 0 à 100 km/h en environ 3 secondes. Elle remporte le rallye de Sanremo 1985 (Walter Röhrl). Après la mort de plusieurs pilotes et spectateurs en 1986, la fédération internationale interdit le Groupe B.\n\nAudi a ensuite engagé la S1 à Pikes Peak : Walter Röhrl y établit en 1987 le record de la course (10 min 47 s 85).",
        a: [["Pikes Peak 1987", "Walter Röhrl a gravi la montagne en 10 minutes 47 secondes 85, un record absolu pour l'époque, au volant de la Sport quattro S1."], ["Michèle Mouton à Pikes Peak", "La pilote française avait déjà remporté l'épreuve en 1985 avec une Sport quattro S1."], ["La fin du Groupe B", "Après les accidents de 1986, la Fédération interdit cette catégorie à la fin de la saison et Audi se retire du rallye mondial."]],
        r: [["Pikes Peak (1987)", "Record de la course : 10 min 47 s 85 (Walter Röhrl)."]], rel: ["audi-sport-quattro", "audi-quattro"], approx: true }),

    /* ======================================================= LES AUDI 80 ET 90 */
    C("audi-80-b3", AU, "80 (B3)", "Berline", "1986 - 1991",
      "L'Audi 80 de troisième génération : une des premières berlines à carrosserie entièrement galvanisée, au dessin aérodynamique, avec une version quattro et un cinq cylindres.",
      [P("Audi 80 (1986 - 1991)", "Caisse entièrement galvanisée (garantie anticorrosion de 10 ans), version quattro à transmission intégrale Torsen.", [E("1.8", 90, 145, 180, 12.0, "Manuelle 5", "Audi 1.8"), E("2.0 16V", 137, 175, 213, 9.2, "Manuelle 5", "Audi 2.0 16V"), E("2.3 5 cyl.", 136, 190, 205, 9.5, "Manuelle 5", "Audi 2.3 5 cyl."), E("1.6 D", 54, 100, 150, 20.0, "Manuelle 5")], ["80 quattro", "80 Sport", "80 Competition"])],
      { h: "La B3 (1986) est dessinée à la soufflerie : son Cx est l'un des meilleurs de sa classe. Audi y généralise la galvanisation complète de la caisse, avec une garantie de dix ans contre la perforation par la rouille. Elle donne naissance à la gamme S2 puis à l'Audi 90.",
        a: [["Galvanisée pour toute sa vie", "La galvanisation à chaud de toute la caisse, adoptée en 1986, a fait des Audi 80 et 100 des voitures qui rouillent peu, un argument commercial majeur."]], rel: ["audi-80-b4", "audi-90-quattro-20v"], approx: true }),

    C("audi-80-b4", AU, "80 (B4)", "Berline", "1991 - 1996",
      "Dernière Audi 80 : plus allongée, première Audi 80 à recevoir un V6 (2.8) et une transmission quattro généralisée, avant d'être remplacée par l'A4.",
      [P("Audi 80 (1991 - 1996)", "Plate-forme B4, quatre ou cinq cylindres, V6 2.6 et 2.8 et version Avant (break) et cabriolet.", [E("1.6", 101, 135, 190, 11.5, "Manuelle 5", "Audi 1.6"), E("2.0 16V", 140, 180, 205, 9.9, "Manuelle 5", "Audi 2.0 16V"), E("2.8 V6", 174, 235, 224, 8.5, "Manuelle 5 / Auto", "Audi 2.8 V6"), E("1.9 TDI", 90, 202, 180, 13.0, "Manuelle 5")], ["80 Avant", "80 Cabriolet", "80 Avant RS2 (voir fiche)"])],
      { h: "La B4 prolonge la carrière de l'Audi 80, avec un moteur V6 de 2.8 litres. L'Audi 80 s'efface au profit de l'A4 en 1994-1996. C'est sur la base d'une 80 Avant (en fait la 80 B4 Avant) qu'est née l'Audi RS2.", rel: ["audi-rs2-avant", "audi-s2"], approx: true }),

    C("audi-90-quattro-20v", AU, "90 quattro 20V", "Berline", "1989 - 1991",
      "L'Audi 90 haut de gamme : cinq cylindres 2.3 de 20 soupapes et 170 ch, transmission quattro, une des premières berlines sportives de la marque.",
      [P("90 quattro 20V", "Moteur cinq cylindres 2.3 litres à 20 soupapes, différentiel Torsen, jantes de 15 pouces.", [E("2.3 5 cyl. 20V", 170, 220, 226, 8.1, "Manuelle 5", "5 cyl. 2.3 20V", "Cinq cylindres en ligne, 20 soupapes")], ["90 quattro 20V Sport"])],
      { h: "La version 20 soupapes du cinq cylindres 2.3 est montée sur l'Audi 90 en 1989 : 170 ch pour 1 200 kg environ, une proposition sportive à l'allemande. Elle sert de base à la version de course 90 IMSA GTO.", rel: ["audi-90-quattro-imsa-gto", "audi-80-b3"], approx: true }),

    C("audi-90-quattro-imsa-gto", AU, "90 quattro IMSA GTO", "Supercar", "1989",
      "Une berline 90 transformée en bête de 700 ch et plus pour le championnat américain IMSA : Hans-Joachim Stuck et Walter Röhrl y ont roulé.",
      [P("IMSA GTO (1989)", "Moteur 2.2 litres cinq cylindres turbo de compétition, transmission quattro, carrosserie élargie en fibre.", [E("2.2 5 cyl. turbo compétition", 720, 0, 300, 0, "Manuelle 5", T5, "Environ 700 ch selon les sources")], [])],
      { h: "En 1989 Audi s'engage en IMSA GTO avec la 90 quattro de course. La voiture gagne plusieurs courses avec Hans-Joachim Stuck et Walter Röhrl, mais l'organisation du championnat américain change les règles et Audi se retire. Cette Audi 90 est l'une des voitures de course les plus puissantes de l'histoire de la marque.",
        approx: true, rel: ["audi-90-quattro-20v"] }),

    C("audi-s2", AU, "S2 Coupé / Avant", "Coupé", "1990 - 1995",
      "Le cinq cylindres turbo de 220 puis 230 ch sur une base d'Audi 80 : l'ancêtre des S et RS modernes.",
      [P("S2 (1990 - 1995)", "Moteur 2.2 litres 20 soupapes turbo de 220 ch (230 ch pour l'Avant), quattro à différentiel Torsen, freins Brembo.", [E("2.2 5 cyl. turbo 20V", 220, 309, 233, 5.9, "Manuelle 6", T5, "Cinq cylindres en ligne turbo, 20 soupapes"), E("2.2 5 cyl. turbo 20V (Avant)", 230, 350, 235, 5.8, "Manuelle 6", T5)], ["S2 Coupé", "S2 Avant", "S2 Limousine"])],
      { h: "La S2 est la première Audi à porter la lettre S pour sportive dans l'ère moderne. Elle reprend le cinq cylindres turbo de la quattro, sous la carrosserie sobre du coupé Audi 80. Elle prépare le terrain de la RS2 Avant.",
        approx: true, rel: ["audi-rs2-avant", "audi-80-b4"] }),

    C("audi-rs2-avant", AU, "RS2 Avant", "Break", "1994 - 1995",
      "Le break de légende, développé avec Porsche : 315 ch, 262 km/h et 4,8 secondes de 0 à 100. Il a créé le segment des breaks sportifs et inventé la lettre RS.",
      [P("RS2 Avant", "Cinq cylindres 2.2 turbo retravaillé par Porsche (turbo plus gros, injection spécifique), freins Brembo, jantes Porsche, rétroviseurs Porsche, assemblage chez Porsche à Zuffenhausen.", [E("2.2 5 cyl. turbo 20V Porsche", 315, 410, 262, 4.8, "Manuelle 6", T5, "Cinq cylindres 20 soupapes retravaillé par Porsche")], ["RS2 Avant (2 891 exemplaires)"])],
      { h: "L'Audi RS2 est née d'un partenariat avec Porsche. Porsche assure la mise au point du moteur, les freins et les jantes et assemble la voiture dans ses ateliers de Zuffenhausen, à Stuttgart. Elle n'est proposée qu'en Avant, à partir de 1994. Elle est restée célèbre pour son accélération (0-100 en 4,8 s) et sa vitesse de pointe (262 km/h), meilleures que celles de nombreuses supercars de l'époque.",
        a: [["Le premier RS", "La RS2 est la première Audi à porter la dénomination RS (« RennSport »), qui désigne depuis les versions les plus sportives de la gamme."], ["Un break plus rapide qu'une Ferrari ?", "À sa sortie, la RS2 abattait le 0 à 100 km/h plus vite que la Ferrari 348 de l'époque."], ["Porsche dans la voiture", "Les rétroviseurs, les jantes et les étriers de freins portent la marque Porsche."]],
        r: [["Production", "2 891 exemplaires entre 1994 et 1995."], ["0 à 100 km/h", "Environ 4,8 secondes."]], rel: ["audi-s2", "audi-rs6-c5"], approx: true }),

    /* ======================================================= LES AUDI V8 */
    C("audi-v8", AU, "V8 (D11)", "Berline", "1988 - 1994",
      "Le premier V8 d'Audi : une grande berline à transmission quattro, 3.6 puis 4.2 litres, qui ouvre la voie à l'Audi A8.",
      [P("V8 3.6 (1988 - 1991)", "Moteur V8 3,6 litres de 250 ch, transmission quattro permanente avec différentiel Torsen, boîte automatique ZF à 4 rapports.", [E("3.6 V8", 250, 340, 235, 8.3, "Auto 4 / Manuelle 5", "Audi V8 3.6", "Bloc aluminium, 32 soupapes")], []),
       P("V8 4.2 (1991 - 1994)", "Cylindrée portée à 4.2 litres, 280 ch, version longue disponible.", [E("4.2 V8", 280, 400, 245, 7.8, "Auto 4", "Audi V8 4.2")], ["V8 Lang"])],
      { h: "En 1988 Audi présente la V8, sa première voiture avec un moteur à huit cylindres. C'est une grande berline sur la base de l'Audi 100/200, équipée en série de la transmission quattro. Elle servira de base à la V8 quattro DTM, qui remporte le championnat allemand en 1990 et 1991, puis à l'A8.",
        r: [["DTM", "L'Audi V8 quattro DTM a gagné le championnat 1990 (Hans-Joachim Stuck) et 1991 (Frank Biela)."]], rel: ["audi-v8-quattro-dtm"], approx: true }),

    C("audi-v8-quattro-dtm", AU, "V8 quattro DTM", "Supercar", "1990 - 1991",
      "La V8 de course qui a gagné le championnat allemand de voitures de tourisme (DTM) deux années de suite : Hans-Joachim Stuck en 1990, Frank Biela en 1991.",
      [P("V8 quattro DTM (1990 - 1991)", "V8 3.6 litres préparé (460 ch environ), transmission intégrale quattro, carrosserie élargie.", [E("3.6 V8 DTM", 460, 0, 280, 0, "Manuelle 6", "Audi V8 3.6", "Valeur de référence")], [])],
      { h: "Après avoir remporté de nombreuses courses avec des voitures de rallye et de course sur circuit, Audi attaque le DTM avec sa grande berline V8 quattro de course. La puissance de la transmission intégrale lui donne un avantage au départ. Hans-Joachim Stuck est champion en 1990, Frank Biela en 1991. Le DTM change ensuite de réglementation, et Audi s'en retire fin 1991.",
        r: [["Champion DTM 1990 et 1991", "Hans-Joachim Stuck (1990), Frank Biela (1991)."]], rel: ["audi-v8"], approx: true }),

    /* ======================================================= A1 */
    C("audi-a1-8x", AU, "A1 (8X)", "Berline", "2010 - 2018",
      "La petite Audi premium : citadine de 3,95 m, personnalisable à l'extrême et déclinée en Sportback à 5 portes.",
      [P("A1 (2010 - 2018)", "Plate-forme du Volkswagen Polo, intérieur soigné, nombreuses personnalisations (toit, couleurs).", [E("1.2 TFSI", 86, 160, 180, 11.9, "Manuelle 5", "1.2 TFSI"), E("1.4 TFSI", 122, 200, 203, 9.0, "Manuelle 6", "1.4 TFSI"), E("1.4 TFSI 185 (twincharger)", 185, 250, 227, 6.9, "S tronic 7", "1.4 TFSI twincharger", "Turbo et compresseur"), E("1.6 TDI", 105, 250, 190, 10.5, "Manuelle 5", "1.6 TDI")], ["A1 Sportback", "A1 Sport", "A1 S line"])],
      { h: "Dévoilée en 2010 au Salon de Genève, l'A1 est la première citadine de la marque aux quatre anneaux. Elle partage sa plate-forme avec la Polo et est très personnalisable, ce qui a séduit une clientèle jeune. Elle est déclinée en trois puis cinq portes (Sportback, 2012).",
        rel: ["audi-s1-8x", "audi-a1-quattro", "audi-a1-gb"], approx: true }),

    C("audi-s1-8x", AU, "S1 (8X)", "Berline", "2014 - 2018",
      "Une citadine à 231 ch et quatre roues motrices : une mini-RS qui enterre la plupart des GTI.",
      [P("S1 et S1 Sportback (2014 - 2018)", "Moteur 2.0 TFSI de 231 ch, transmission intégrale quattro, suspension abaissée, jantes de 17 pouces.", [E("2.0 TFSI", 231, 370, 250, 5.9, "Manuelle 6", EA888, "Quatre cylindres 2.0 turbo à injection directe")], ["S1 Competition (2016)"])],
      { h: "Annoncée en 2014, la S1 est la première Audi sportive de la gamme A1. Sa transmission quattro la rend facile à conduire en toutes conditions, et son moteur de 231 ch en fait une citadine très performante.", rel: ["audi-a1-8x", "audi-a1-quattro"], approx: true }),

    C("audi-a1-quattro", AU, "A1 quattro (2012)", "Berline", "2012",
      "Une petite série limitée à 333 exemplaires : 256 ch, quatre roues motrices et une silhouette de mini-bombe.",
      [P("A1 quattro", "Moteur 2.0 TFSI de 256 ch, transmission quattro, boîte manuelle 6 rapports, disponible en rouge ou blanc.", [E("2.0 TFSI", 256, 350, 245, 5.7, "Manuelle 6", EA888, "Quatre cylindres 2.0 turbo")], ["A1 quattro (333 exemplaires)"])],
      { h: "Pour fêter les 30 ans de la quattro, Audi produit en 2012 une série très limitée de 333 A1 quattro, vendue à un prix élevé. Elle préfigure la S1.", rel: ["audi-s1-8x"], approx: true }),

    C("audi-a1-gb", AU, "A1 Sportback (GB)", "Berline", "2018 - 2024",
      "La seconde génération de l'A1, uniquement en Sportback à cinq portes, plus technique et plus longue de 5 cm.",
      [P("A1 Sportback (2018 - 2024)", "Plate-forme MQB A0, cockpit numérique virtuel en option, essences de 95 à 200 ch.", [E("25 TFSI", 95, 175, 188, 10.8, "Manuelle 5", "1.0 TFSI"), E("30 TFSI", 116, 200, 203, 9.5, "Manuelle 6 / S tronic", "1.0 TFSI"), E("35 TFSI", 150, 250, 218, 8.0, "S tronic 7", "1.5 TFSI"), E("40 TFSI", 200, 320, 235, 6.5, "S tronic 7", "2.0 TFSI")], ["A1 Citycarver"])],
      { h: "Dévoilée en 2018, la seconde A1 est uniquement vendue en Sportback à 5 portes. Elle est plus spacieuse et plus numérique, et reçoit le 2.0 TFSI de 200 ch dans la version 40 TFSI.", rel: ["audi-a1-8x"], approx: true }),

    /* ======================================================= A3 / S3 / RS3 */
    C("audi-a3-8l", AU, "A3 (8L)", "Berline", "1996 - 2003",
      "La compacte premium d'Audi : première A3, sur la base de la Golf IV, avec un intérieur soigné et le 1.8 turbo.",
      [P("A3 (1996 - 2003)", "Plate-forme PQ34 de la Golf IV. Version quattro disponible. Cinq portes à partir de 1999.", [E("1.6", 102, 145, 190, 11.5, "Manuelle 5", "AEH 1.6"), E("1.8 T", 150, 210, 210, 8.6, "Manuelle 5", "1.8 T 20V", "1.8 turbo 20 soupapes"), E("1.8 T 180", 180, 235, 225, 7.7, "Manuelle 5", "1.8 T 20V"), E("1.9 TDI", 110, 235, 190, 10.7, "Manuelle 5", "1.9 TDI")], ["A3 Sport", "A3 quattro"])],
      { h: "La première A3 est présentée en 1996 : l'idée d'une compacte haut de gamme est révolutionnaire. Elle repose sur la plate-forme de la Golf IV mais bénéficie d'un traitement premium.",
        rel: ["audi-s3-8l"], approx: true }),

    C("audi-s3-8l", AU, "S3 (8L)", "Berline", "1999 - 2003",
      "La première S3 : un 1.8 turbo de 210 puis 225 ch, transmission quattro, bas de caisse spécifique. Une compacte sportive devenue classique.",
      [P("S3 (1999 - 2003)", "Moteur 1.8 T 20V de 210 ch (225 ch dès 2001), quattro à embrayage Haldex, freins agrandis, suspension abaissée.", [E("1.8 T 210", 210, 270, 233, 6.9, "Manuelle 6", "1.8 T 20V", "1.8 turbo, 210 ch"), E("1.8 T 225", 225, 280, 236, 6.6, "Manuelle 6", "1.8 T 20V", "1.8 turbo, 225 ch")], ["S3 225 ch (2001)"])],
      { h: "La S3 de 1999 est la première S du segment des compactes. Équipée de la transmission quattro à embrayage Haldex, elle donne une motricité exceptionnelle en toutes conditions. Elle a lancé le principe de la compacte sportive premium.", rel: ["audi-a3-8l", "audi-s3-8p"], approx: true }),

    C("audi-a3-8p", AU, "A3 (8P)", "Berline", "2003 - 2012",
      "L'A3 de deuxième génération : plate-forme de la Golf V, boîte DSG, V6 3.2 quattro en haut de gamme et version Cabriolet.",
      [P("A3 (2003 - 2012)", "Trois et cinq portes (Sportback 2004), Cabriolet (2008). Boîte DSG à double embrayage, injection directe FSI et TFSI.", [E("1.6 FSI", 115, 155, 195, 10.9, "Manuelle 6", "1.6 FSI"), E("2.0 TFSI", 200, 280, 235, 7.2, "Manuelle 6 / S tronic", EA113, "Quatre cylindres 2.0 turbo"), E("3.2 V6 quattro", 250, 320, 250, 6.4, "DSG 6", "3.2 VR6", "V6 à angle étroit 3.2, quattro"), E("2.0 TDI", 140, 320, 207, 9.5, "Manuelle 6", "2.0 TDI")], ["A3 Sportback", "A3 Cabriolet", "A3 Sportback e-tron (2012)"])],
      { h: "La deuxième génération de l'A3 s'appuie sur la plate-forme de la Golf V. Elle est la première compacte à proposer la boîte DSG à double embrayage et, dans sa version 3.2 quattro, un V6 de 250 ch. Elle sera produite jusqu'en 2012.",
        rel: ["audi-s3-8p", "audi-rs3-8p"], approx: true }),

    C("audi-s3-8p", AU, "S3 (8P)", "Berline", "2006 - 2012",
      "La S3 de la deuxième génération : le fameux 2.0 TFSI de 265 ch, boîte S tronic et quattro Haldex.",
      [P("S3 (2006 - 2012)", "Moteur 2.0 TFSI de 265 ch, boîte manuelle 6 ou S tronic 6, quattro Haldex, jantes de 18 pouces. Existe en trois portes, Sportback et Cabriolet (2009).", [E("2.0 TFSI", 265, 350, 250, 5.7, "Manuelle 6 / S tronic 6", EA113, "Quatre cylindres 2.0 turbo à injection directe")], ["S3 Sportback", "S3 Cabriolet"])],
      { h: "Dévoilée en 2006, la S3 8P est la première S3 à recevoir un 2.0 TFSI : 265 ch à 5 700 tr/min, le même moteur que la Golf R32 de l'époque ne pouvait pas égaler en rapport poids/puissance. C'est une référence de la compacte sportive.", rel: ["audi-s3-8l", "audi-rs3-8p"], approx: true }),

    C("audi-rs3-8p", AU, "RS3 Sportback (8P)", "Berline", "2011 - 2012",
      "La première RS3 : cinq cylindres 2.5 TFSI de 340 ch, quattro à embrayage Haldex et 4,6 secondes de 0 à 100 km/h.",
      [P("RS3 Sportback", "Moteur cinq cylindres 2.5 TFSI de 340 ch, boîte S tronic 7, quattro, suspension sport, échappement spécifique. Uniquement en Sportback.", [E("2.5 TFSI 340", 340, 450, 250, 4.6, "S tronic 7", T25A, "Cinq cylindres en ligne turbo, 2.5 litres")], ["RS3 Sportback"])],
      { h: "En 2011 Audi présente la RS3 Sportback, la plus rapide des compactes du moment. Le cinq cylindres 2.5 TFSI hérite du moteur de la TT RS : 340 ch à 5 400 tr/min et un couple de 450 Nm. Le chant de ce cinq cylindres turbo est devenu la signature d'Audi Sport, en hommage à la quattro de rallye.", a: [["Le « cinq pattes »", "Le cinq cylindres en ligne turbo est une marque de fabrique d'Audi depuis la quattro de 1980."], ["Meilleur moteur de l'année", "Ce moteur 2.5 TFSI a été élu « International Engine of the Year » plusieurs années de suite dans sa catégorie."]],
        r: [["Moteur de l'année", "Le 2.5 TFSI a reçu le titre « International Engine of the Year » cinq années de suite (2010 à 2014)."]], rel: ["audi-tt-rs-8j", "audi-rs3-8v"], approx: true }),

    C("audi-a3-8v", AU, "A3 (8V)", "Berline", "2012 - 2020",
      "La troisième A3 sur la plate-forme modulaire MQB : plus légère, plus spacieuse, plus connectée.",
      [P("A3 (2012 - 2020)", "Plate-forme MQB, trois portes, Sportback, Berline (2013) et Cabriolet. Cockpit virtuel en option.", [E("1.0 TFSI", 115, 200, 203, 9.9, "Manuelle 6", "1.0 TFSI"), E("1.4 TFSI COD", 150, 250, 216, 8.2, "Manuelle 6 / S tronic", "1.4 TFSI COD", "Désactivation de cylindres"), E("2.0 TDI", 150, 340, 216, 8.6, "Manuelle 6 / S tronic", "2.0 TDI"), E("e-tron (hybride rechargeable)", 204, 350, 222, 7.6, "S tronic 6", "1.4 TFSI + électrique")], ["A3 Sportback e-tron", "A3 Berline", "A3 Cabriolet"])],
      { h: "L'A3 8V est présentée en 2012. Elle repose sur la plate-forme MQB du groupe Volkswagen, qui permet de réduire le poids d'environ 80 kg. Elle a reçu le titre de « World Car of the Year » en 2014.", rel: ["audi-s3-8v", "audi-rs3-8v"], approx: true }),

    C("audi-s3-8v", AU, "S3 (8V)", "Berline", "2013 - 2020",
      "La S3 de troisième génération : 2.0 TFSI de 300 puis 310 ch, quattro à embrayage Haldex et boîte S tronic.",
      [P("S3 300 ch (2013 - 2016)", "Moteur 2.0 TFSI de 300 ch (EA888), quattro Haldex, boîte S tronic 6.", [E("2.0 TFSI 300", 300, 380, 250, 5.2, "Manuelle 6 / S tronic 6", EA888, "Quatre cylindres 2.0 turbo à injection directe")], []),
       P("S3 310 ch (2016 - 2020)", "Mise à jour : 310 ch, boîte S tronic 7.", [E("2.0 TFSI 310", 310, 400, 250, 4.8, "S tronic 7", EA888)], ["S3 Cabriolet", "S3 Berline"])],
      { h: "La S3 8V profite de la plate-forme légère MQB et du moteur EA888 de dernière génération. Elle est disponible en trois portes, Sportback, Berline et Cabriolet.", rel: ["audi-a3-8v", "audi-rs3-8v"], approx: true }),

    C("audi-rs3-8v", AU, "RS3 (8V)", "Berline", "2015 - 2020",
      "La RS3 de troisième génération : cinq cylindres de 367 puis 400 ch et un 0 à 100 km/h en 4,1 secondes.",
      [P("RS3 367 ch (2015 - 2017)", "Cinq cylindres 2.5 TFSI de 367 ch, S tronic à 7 rapports, quattro avec embrayage multidisque, Sportback.", [E("2.5 TFSI 367", 367, 465, 250, 4.3, "S tronic 7", T25Z, "Cinq cylindres en ligne turbo, 2.5 litres")], []),
       P("RS3 400 ch (2017 - 2020)", "Bloc entièrement en aluminium (gain de 26 kg), 400 ch, Berline et Sportback.", [E("2.5 TFSI 400", 400, 480, 250, 4.1, "S tronic 7", T25D, "Cinq cylindres en ligne turbo, 2.5 litres")], ["RS3 Berline", "RS3 Sportback"])],
      { h: "La RS3 de 2015 revient en Sportback, puis en berline (2017). Son bloc en aluminium, introduit en 2017, supprime 26 kg à l'avant. À 400 ch, elle franchit les 4,1 secondes de 0 à 100 km/h, un chiffre de supercar des années 2000.",
        r: [["0 à 100 km/h", "4,1 secondes (versions 2017)."]], rel: ["audi-rs3-8p", "audi-rs3-8y"], approx: true }),

    C("audi-a3-8y", AU, "A3 (8Y)", "Berline", "2020 - ...",
      "La quatrième A3 : plus connectée, plus technologique et disponible en hybride rechargeable.",
      [P("A3 (depuis 2020)", "Plate-forme MQB Evo, Sportback et Berline, hybride rechargeable 40 TFSI e.", [E("30 TFSI", 110, 200, 205, 10.2, "Manuelle 6 / S tronic", "1.0 TFSI"), E("35 TFSI", 150, 250, 224, 8.4, "Manuelle 6 / S tronic", "1.5 TFSI"), E("40 TFSI e", 204, 350, 227, 7.6, "S tronic 6", "1.4 TFSI + électrique"), E("2.0 TDI", 150, 360, 224, 8.5, "Manuelle 6 / S tronic", "2.0 TDI")], ["A3 Sportback", "A3 Berline", "A3 allstreet"])],
      { h: "La A3 8Y est présentée en 2020. Elle abandonne les éléments physiques au profit d'écrans plus nombreux et propose des motorisations électrifiées (mild hybrid 48 V, hybride rechargeable). Elle est assemblée en Hongrie et en Belgique (Bruxelles).", rel: ["audi-s3-8y", "audi-rs3-8y"], approx: true }),

    C("audi-s3-8y", AU, "S3 (8Y)", "Berline", "2020 - ...",
      "La S3 de quatrième génération : 2.0 TFSI de 310 ch, quattro et mode « drift » grâce au différentiel arrière piloté.",
      [P("S3 (depuis 2020)", "Moteur 2.0 TFSI de 310 ch (EA888), S tronic à 7 rapports, quattro à embrayage multidisque, suspension à amortissement piloté.", [E("2.0 TFSI 310", 310, 400, 250, 4.8, "S tronic 7", EA888)], ["S3 Berline", "S3 Sportback"])],
      { h: "La S3 8Y reprend la mécanique de la 8V mais perfectionne la transmission : un répartiteur de couple arrière permet de transférer la puissance vers la roue extérieure en virage.", rel: ["audi-a3-8y", "audi-rs3-8y"], approx: true }),

    C("audi-rs3-8y", AU, "RS3 (8Y)", "Berline", "2021 - ...",
      "La RS3 la plus extrême : cinq cylindres 2.5 TFSI de 400 ch, répartiteur de couple arrière « RS Torque Splitter » et mode drift.",
      [P("RS3 (depuis 2021)", "Moteur 2.5 TFSI de 400 ch, S tronic 7, quattro avec « RS Torque Splitter » qui distribue le couple entre les roues arrière, mode Drift.", [E("2.5 TFSI 400", 400, 500, 250, 3.8, "S tronic 7", T25N, "Cinq cylindres en ligne turbo, 2.5 litres")], ["RS3 Sportback", "RS3 Berline", "RS3 Performance Edition"])],
      { h: "Dévoilée en 2021, la RS3 8Y est la plus rapide des compactes RS. Le répartiteur de couple arrière « RS Torque Splitter » lui permet de faire des dérapages contrôlés (mode RS Torque Rear). La vitesse de pointe peut être relevée de 250 à 280 km/h avec un pack optionnel.",
        a: [["Mode « drift »", "C'est la première Audi de série avec un mode destiné au drift, qui répartit presque tout le couple sur la roue arrière extérieure."]], rel: ["audi-rs3-8v"], approx: true })
  ]);

  /* ======================================================= A4 / S4 / RS4 */
  push([
    C("audi-a4-b5", AU, "A4 (B5)", "Berline", "1994 - 2001",
      "Le successeur de l'Audi 80 : plate-forme longitudinale, quattro disponible, premier TDI et le V6 en haut de gamme.",
      [P("A4 (1994 - 2001)", "Berline puis Avant (1996). Moteurs 4 cylindres et V6, TDI, version quattro.", [E("1.8", 125, 173, 205, 10.5, "Manuelle 5", "Audi 1.8 20V"), E("1.8 T", 150, 210, 215, 9.0, "Manuelle 5", "1.8 T 20V"), E("2.8 V6", 193, 280, 235, 7.9, "Manuelle 5 / Auto", "Audi 2.8 V6"), E("1.9 TDI", 110, 235, 190, 11.0, "Manuelle 5", "1.9 TDI")], ["A4 Avant", "A4 quattro"])],
      { h: "L'A4 apparaît en 1994 et reprend le rôle de l'Audi 80 sous un nom nouveau. Elle introduit la nomenclature A (pour les modèles) et la série S/RS pour les versions sportives. La gamme sera déclinée en trois ou quatre générations jusqu'à aujourd'hui.", rel: ["audi-s4-b5", "audi-rs4-b5"], approx: true }),

    C("audi-s4-b5", AU, "S4 (B5)", "Berline", "1997 - 2001",
      "Le V6 2.7 biturbo de 265 ch avec quattro : la première S4 moderne, en berline et en Avant.",
      [P("S4 (1997 - 2001)", "Moteur V6 2.7 litres biturbo (Cosworth pour la culasse sur la RS4 ; ici un biturbo d'origine Audi), quattro Torsen, boîte manuelle 6 rapports.", [E("2.7 V6 biturbo", 265, 400, 250, 5.8, "Manuelle 6", "2.7 V6 biturbo (B5)", "V6 à 30 soupapes, deux turbos")], ["S4 Avant"])],
      { h: "Deuxième à porter le nom S4, la B5 reçoit le V6 2.7 biturbo qui servira de base à la RS4 de 2000. C'est l'une des berlines sportives de référence de la fin des années 1990.", rel: ["audi-rs4-b5", "audi-a4-b5"], approx: true }),

    C("audi-rs4-b5", AU, "RS4 Avant (B5)", "Break", "1999 - 2001",
      "Le break de 380 ch : V6 2.7 biturbo retravaillé par Cosworth, quattro et moins de 5 secondes au 0 à 100.",
      [P("RS4 Avant (2000 - 2001)", "V6 2.7 biturbo à 380 ch, développé avec Cosworth, boîte manuelle 6 rapports, quattro avec différentiel Torsen, élargissement de carrosserie.", [E("2.7 V6 biturbo Cosworth", 380, 440, 250, 4.9, "Manuelle 6", "2.7 V6 biturbo (B5)", "V6 2.7 biturbo retravaillé par Cosworth")], ["RS4 Avant (6 000 exemplaires environ)"])],
      { h: "Après la RS2, la RS4 est la deuxième RS d'Audi, produite par quattro GmbH (aujourd'hui Audi Sport GmbH). Uniquement vendue en break, elle fait de l'Avant sportif un classique.", rel: ["audi-rs2-avant", "audi-rs4-b7"], approx: true }),

    C("audi-a4-b6-b7", AU, "A4 (B6 / B7)", "Berline", "2000 - 2008",
      "Les deux A4 suivantes : multitronic, TDI, V6 3.0 et V8 4.2 (S4), plus cabriolet et Avant.",
      [P("A4 B6 (2000 - 2004)", "Berline, Avant et Cabriolet ; boîte multitronic à variation continue.", [E("2.0", 130, 180, 205, 10.5, "Manuelle 5", "2.0 ALT"), E("3.0 V6", 220, 300, 245, 7.0, "Manuelle 6 / Auto", "3.0 V6 30V"), E("1.9 TDI", 130, 310, 205, 10.4, "Manuelle 6", "1.9 TDI")], ["A4 Cabriolet"]),
       P("A4 B7 (2004 - 2008)", "Calandre « single frame », 2.0 TFSI, 3.2 FSI, 2.0 TDI.", [E("2.0 TFSI", 200, 280, 237, 7.3, "Manuelle 6", EA113), E("3.2 FSI V6", 255, 330, 250, 6.1, "Auto 6", "3.2 FSI V6")], ["A4 Avant"])],
      { h: "L'A4 B6 est lancée en 2000 et la B7 en 2004, avec la nouvelle calandre « single frame » sur laquelle repose le design actuel de toutes les Audi. La B7 est aussi la première A4 à recevoir le 2.0 TFSI.", rel: ["audi-s4-b6-b7", "audi-rs4-b7"], approx: true }),

    C("audi-s4-b6-b7", AU, "S4 (B6 / B7)", "Berline", "2003 - 2008",
      "La S4 au V8 4.2 : 344 ch, un chant très particulier et quattro, en berline, Avant et cabriolet.",
      [P("S4 (2003 - 2008)", "Moteur V8 4.2 litres atmosphérique de 344 ch, quattro, boîte manuelle 6 rapports ou automatique 6.", [E("4.2 V8", 344, 410, 250, 5.6, "Manuelle 6 / Auto 6", "4.2 V8 (S4 B6/B7)", "V8 à 40 soupapes")], ["S4 Avant", "S4 Cabriolet"])],
      { h: "Après le V6 biturbo, la S4 reçoit un V8 atmosphérique inspiré de celui de la RS6. C'est la dernière S4 à moteur V8 atmosphérique ; la suivante utilise un V6 à compresseur.", rel: ["audi-rs4-b7", "audi-s4-b8"], approx: true }),

    C("audi-rs4-b7", AU, "RS4 (B7)", "Berline", "2005 - 2008",
      "Le V8 4.2 FSI de 420 ch qui monte à 8 250 tr/min : l'un des moteurs atmosphériques les plus aimés d'Audi.",
      [P("RS4 (2005 - 2008)", "V8 4.2 FSI à injection directe de 420 ch, régime maximal de 8 250 tr/min, quattro avec répartition 40/60, berline, Avant et Cabriolet.", [E("4.2 FSI V8", 420, 430, 250, 4.8, "Manuelle 6", V42, "V8 atmosphérique à injection directe")], ["RS4 Avant", "RS4 Cabriolet"])],
      { h: "La RS4 B7 est célèbre pour son V8 atmosphérique à haut régime, qui sera repris sur l'Audi R8 V8. Elle a introduit la « stratégie quattro » avec 60 % du couple vers l'arrière.", a: [["Le même V8 que la R8", "Le moteur 4.2 FSI de la RS4 est aussi celui de la première R8."]], rel: ["audi-r8-v8", "audi-rs5-8t"], approx: true }),

    C("audi-a4-b8", AU, "A4 (B8)", "Berline", "2007 - 2015",
      "La A4 allongée, avec des feux à LED en signature : plus de dynamisme, 2.0 TFSI et 2.0 TDI très diffusés.",
      [P("A4 (2007 - 2015)", "Plate-forme MLB, berline et Avant, 2.0 TFSI, 3.0 TDI, A4 allroad quattro.", [E("1.8 TFSI", 160, 250, 225, 8.2, "Manuelle 6 / multitronic", "EA888 1.8 TFSI"), E("2.0 TFSI", 211, 350, 240, 6.8, "Manuelle 6 / S tronic", EA888), E("2.0 TDI", 143, 320, 215, 9.0, "Manuelle 6", "2.0 TDI"), E("3.0 TDI", 245, 500, 250, 6.1, "S tronic 7", "3.0 TDI")], ["A4 Avant", "A4 allroad quattro"])],
      { h: "La B8 passe à la plate-forme modulaire longitudinale (MLB), qui rallonge l'empattement. L'A4 B8 est l'une des Audi les plus vendues.", rel: ["audi-s4-b8", "audi-rs4-b9"], approx: true }),

    C("audi-s4-b8", AU, "S4 (B8)", "Berline", "2008 - 2015",
      "La S4 au V6 3.0 TFSI à compresseur : 333 ch, S tronic et quattro avec différentiel sport.",
      [P("S4 (2008 - 2015)", "V6 3.0 TFSI à compresseur de 333 ch, boîte S tronic 7 ou manuelle 6, quattro, différentiel sport arrière en option.", [E("3.0 TFSI V6", 333, 440, 250, 5.1, "S tronic 7 / Manuelle 6", E837, "V6 à compresseur, injection directe")], ["S4 Avant"])],
      { h: "La S4 B8 abandonne le V8 pour un V6 compressé. Plus légère à l'avant, elle gagne en agilité grâce au différentiel sport.", rel: ["audi-s4-b6-b7", "audi-s4-b9", "audi-s5-8t"], approx: true }),

    C("audi-a4-b9", AU, "A4 (B9)", "Berline", "2015 - ...",
      "La cinquième A4, sur MLB Evo : plus légère de 120 kg, tableau de bord numérique et motorisations 2.0 TFSI/TDI.",
      [P("A4 (depuis 2015)", "Berline, Avant et allroad quattro ; restylée en 2019 et 2023.", [E("35 TFSI", 150, 270, 225, 8.6, "Manuelle 6 / S tronic", "1.5 TFSI"), E("40 TFSI", 190, 320, 240, 7.3, "S tronic 7", EA888), E("45 TFSI", 265, 370, 250, 5.8, "S tronic 7", EA888), E("40 TDI", 204, 400, 244, 6.9, "S tronic 7", "2.0 TDI")], ["A4 Avant", "A4 allroad quattro"])],
      { h: "Lancée en 2015, la B9 est plus légère que la précédente de jusqu'à 120 kg selon les versions et reçoit le cockpit virtuel.", rel: ["audi-s4-b9", "audi-rs4-b9"], approx: true }),

    C("audi-s4-b9", AU, "S4 (B9)", "Berline", "2016 - ...",
      "La S4 3.0 TFSI turbo : 354 ch, boîte automatique à 8 rapports, puis un V6 3.0 TDI sur certains marchés.",
      [P("S4 (depuis 2016)", "V6 3.0 TFSI turbo de 354 ch, boîte Tiptronic à 8 rapports, quattro avec différentiel sport en option.", [E("3.0 TFSI V6", 354, 500, 250, 4.7, "Tiptronic 8", E839_30, "V6 à turbo unique")], ["S4 Avant", "S4 TDI (2019)"])],
      { h: "La S4 B9 passe du compresseur au turbo : le couple est disponible plus tôt, et la consommation baisse. Elle a la même architecture que la S5.", rel: ["audi-s4-b8", "audi-rs4-b9"], approx: true }),

    C("audi-rs4-b9", AU, "RS4 Avant (B9)", "Break", "2018 - 2023",
      "Un V6 2.9 TFSI biturbo de 450 ch partagé avec Porsche : le seul break RS d'Audi à ne pas avoir de V8 après 2018.",
      [P("RS4 Avant (2018 - 2023)", "V6 2.9 TFSI biturbo de 450 ch, Tiptronic 8, quattro avec répartiteur arrière en option, élargissement de 30 mm.", [E("2.9 TFSI V6 biturbo", 450, 600, 250, 4.1, "Tiptronic 8", E839_29, "V6 biturbo à 90° partagé avec la RS5")], ["RS4 Avant", "RS4 Avant Edition 25 Years (2019)"])],
      { h: "La RS4 B9 abandonne le V8 atmosphérique de ses devancières pour un V6 biturbo plus petit mais plus puissant en couple. La carrosserie est élargie de 30 mm.", rel: ["audi-rs4-b7", "audi-rs5-b9"], approx: true })
  ]);

  /* ======================================================= A5 / S5 / RS5 */
  push([
    C("audi-a5-8t", AU, "A5 (8T)", "Coupé", "2007 - 2016",
      "Le coupé élégant de Walter de Silva : lignes tendues, feux à LED, version Sportback à 5 portes et Cabriolet.",
      [P("A5 (2007 - 2016)", "Coupé, Cabriolet et Sportback (2009). Plate-forme MLB.", [E("2.0 TFSI", 211, 350, 242, 7.1, "Manuelle 6 / multitronic", EA888), E("3.0 TFSI", 272, 400, 250, 5.9, "S tronic 7", E837), E("2.7 TDI", 190, 400, 235, 7.6, "Manuelle 6", "2.7 TDI")], ["A5 Sportback", "A5 Cabriolet"])],
      { h: "Dessinée par le Walter de Silva et son équipe, l'A5 est l'un des coupés les plus réussis du début des années 2000. Elle est présentée en 2007 au Salon de Genève.", a: [["Walter de Silva", "Le designer italien a aussi signé l'Alfa Romeo 156 et 147, d'où certaines similitudes dans la silhouette de l'A5."]], rel: ["audi-s5-8t", "audi-rs5-8t"], approx: true }),

    C("audi-s5-8t", AU, "S5 (8T)", "Coupé", "2007 - 2016",
      "La S5 : d'abord un V8 4.2 de 354 ch (les premières années), puis un V6 3.0 TFSI à compresseur de 333 ch.",
      [P("S5 V8 (2007 - 2011)", "V8 4.2 FSI de 354 ch, quattro, Tiptronic ou manuelle 6.", [E("4.2 FSI V8", 354, 440, 250, 5.1, "Manuelle 6 / Tiptronic 6", V42)], []),
       P("S5 V6 (2011 - 2016)", "V6 3.0 TFSI à compresseur de 333 ch.", [E("3.0 TFSI V6", 333, 440, 250, 5.1, "S tronic 7", E837)], ["S5 Cabriolet", "S5 Sportback"])],
      { h: "Au lancement la S5 utilise le V8 4.2 de la RS4, puis passe au V6 compressé. Elle sert de pont entre l'A5 et la RS5.", rel: ["audi-rs5-8t", "audi-s4-b8"], approx: true }),

    C("audi-rs5-8t", AU, "RS5 (8T)", "Coupé", "2010 - 2015",
      "La RS5 reprend le V8 4.2 FSI de la RS4 : 450 ch, boîte S tronic et quattro avec répartition 40/60.",
      [P("RS5 (2010 - 2015)", "V8 4.2 FSI de 450 ch à 8 250 tr/min, boîte S tronic 7, différentiel sport optionnel. Coupé puis Cabriolet (2012).", [E("4.2 FSI V8", 450, 430, 250, 4.5, "S tronic 7", V42, "V8 atmosphérique à injection directe")], ["RS5 Coupé", "RS5 Cabriolet"])],
      { h: "La RS5 est la première RS du coupé A5. Son V8 atmosphérique à haut régime est un des derniers de cette catégorie chez Audi, avant le passage aux moteurs turbo.", rel: ["audi-rs4-b7", "audi-rs5-b9"], approx: true }),

    C("audi-a5-b9", AU, "A5 (F5)", "Coupé", "2016 - ...",
      "La deuxième A5 sur la base de la A4 B9 : plus légère et plus numérique, Coupé, Cabriolet et Sportback.",
      [P("A5 (depuis 2016)", "Plate-forme MLB Evo.", [E("35 TFSI", 150, 270, 230, 8.5, "S tronic 7", "1.5 TFSI"), E("40 TFSI", 190, 320, 240, 7.3, "S tronic 7", EA888), E("45 TFSI", 245, 370, 250, 5.9, "S tronic 7", EA888), E("40 TDI", 190, 400, 243, 7.3, "S tronic 7", "2.0 TDI")], ["A5 Coupé", "A5 Sportback", "A5 Cabriolet"])],
      { h: "L'A5 F5 reprend la plate-forme A4 B9 et ses motorisations.", rel: ["audi-s5-b9", "audi-rs5-b9"], approx: true }),

    C("audi-s5-b9", AU, "S5 (F5)", "Coupé", "2016 - ...",
      "La S5 passe au V6 3.0 TFSI à turbo unique : 354 ch et un couple de 500 Nm.",
      [P("S5 (depuis 2016)", "V6 3.0 TFSI turbo, Tiptronic 8, quattro.", [E("3.0 TFSI V6", 354, 500, 250, 4.7, "Tiptronic 8", E839_30)], ["S5 Coupé", "S5 Sportback", "S5 Cabriolet"])],
      { h: "La S5 de seconde génération adopte un turbo en lieu et place du compresseur.", rel: ["audi-rs5-b9"], approx: true }),

    C("audi-rs5-b9", AU, "RS5 (F5)", "Coupé", "2017 - ...",
      "La RS5 au V6 2.9 TFSI biturbo de 450 ch : plus léger de 60 kg que la précédente, moins de 4 secondes au 0 à 100.",
      [P("RS5 (depuis 2017)", "V6 2.9 TFSI biturbo, Tiptronic 8, quattro avec différentiel sport, Coupé et Sportback.", [E("2.9 TFSI V6 biturbo", 450, 600, 250, 3.9, "Tiptronic 8", E839_29, "V6 biturbo à 90°")], ["RS5 Coupé", "RS5 Sportback"])],
      { h: "La RS5 F5 abandonne le V8 atmosphérique au profit d'un V6 biturbo plus léger et plus coupleux.", rel: ["audi-rs5-8t", "audi-rs4-b9"], approx: true })
  ]);

  /* ======================================================= A6 / S6 / RS6 */
  push([
    C("audi-a6-c5", AU, "A6 (C5)", "Berline", "1997 - 2004",
      "L'Audi A6 de 1997 : Cx de 0,28, quattro, V6 2.8 et allroad quattro pour la première fois.",
      [P("A6 (1997 - 2004)", "Berline et Avant, allroad quattro (2000).", [E("1.8 T", 150, 210, 220, 9.5, "Manuelle 5", "1.8 T 20V"), E("2.8 V6", 193, 280, 235, 8.0, "Manuelle 5 / Auto", "2.8 V6"), E("2.5 TDI", 150, 310, 215, 9.5, "Manuelle 5", "2.5 V6 TDI")], ["A6 Avant", "A6 allroad quattro"])],
      { h: "L'A6 remplace l'Audi 100 en 1994 avec la C4, puis la C5 en 1997. Elle est la première Audi dont le Cx descend à 0,28. L'allroad quattro (2000) lance la mode des breaks surélevés.", rel: ["audi-rs6-c5"], approx: true }),

    C("audi-rs6-c5", AU, "RS6 Avant (C5)", "Break", "2002 - 2004",
      "La première RS6 : V8 4.2 biturbo de 450 ch (480 ch Plus) et un 0 à 100 km/h en 4,7 secondes.",
      [P("RS6 (2002 - 2004)", "V8 4.2 litres biturbo à 40 soupapes, développé avec Cosworth, boîte Tiptronic 5, suspension DRC, quattro. Avant et berline.", [E("4.2 V8 biturbo", 450, 560, 250, 4.7, "Tiptronic 5", "4.2 V8 biturbo (RS6)", "V8 biturbo développé avec Cosworth"), E("4.2 V8 biturbo Plus", 480, 560, 250, 4.5, "Tiptronic 5", "4.2 V8 biturbo (RS6)")], ["RS6 Avant", "RS6 Plus (2004)", "RS6 berline"])],
      { h: "Après la RS4, la RS6 pousse la formule du break de hautes performances. La suspension DRC (Dynamic Ride Control) relie les amortisseurs en diagonale pour limiter le roulis.", rel: ["audi-rs6-c6", "audi-rs2-avant"], approx: true }),

    C("audi-rs6-c6", AU, "RS6 Avant (C6)", "Break", "2008 - 2010",
      "Un V10 biturbo de 580 ch dérivé de la Lamborghini Gallardo : la plus puissante RS de l'époque.",
      [P("RS6 (2008 - 2010)", "V10 5.0 TFSI biturbo, Tiptronic 6, quattro, 0-100 en 4,5 s ; berline et Avant.", [E("5.0 TFSI V10 biturbo", 580, 650, 250, 4.5, "Tiptronic 6", "5.0 TFSI V10 biturbo", "V10 biturbo dérivé de celui de la Gallardo")], ["RS6 Avant", "RS6 berline"])],
      { h: "La RS6 C6 est mue par un V10 de 5 litres biturbo (base du moteur Gallardo). Peu de breaks étaient aussi puissants à l'époque.", rel: ["audi-rs6-c5", "audi-rs6-c7"], approx: true }),

    C("audi-a6-c7", AU, "A6 (C7)", "Berline", "2011 - 2018",
      "L'A6 de série la plus vendue d'Audi : plus légère, cockpit connecté, TDI ultra et hybride.",
      [P("A6 (2011 - 2018)", "Berline, Avant, allroad ; 2.0 TDI ultra et V6 3.0 TDI.", [E("2.0 TFSI", 252, 370, 250, 6.1, "S tronic 7", EA888), E("3.0 TFSI", 333, 440, 250, 5.5, "S tronic 7", E837), E("2.0 TDI", 190, 400, 235, 7.9, "S tronic 7", "2.0 TDI"), E("3.0 TDI", 272, 580, 250, 5.9, "S tronic 7", "3.0 TDI")], ["A6 Avant", "A6 allroad quattro", "A6 hybrid"])],
      { h: "La C7 gagne 80 kg sur la C6 et présente de nombreux systèmes d'aide à la conduite. Elle reste une référence des routières.", rel: ["audi-rs6-c7", "audi-s6-c7"], approx: true }),

    C("audi-s6-c7", AU, "S6 (C7)", "Berline", "2012 - 2018",
      "Le V8 4.0 TFSI biturbo de 420 ch avec désactivation de cylindres, annonce de la RS6.",
      [P("S6 (2012 - 2018)", "V8 4.0 TFSI biturbo de 420 ch, S tronic 7, quattro.", [E("4.0 TFSI V8 biturbo", 420, 550, 250, 4.6, "S tronic 7", E824, "V8 biturbo avec désactivation de 4 cylindres")], ["S6 Avant"])],
      { h: "Le V8 4.0 TFSI inaugure la désactivation de quatre cylindres chez Audi, qui permet de baisser la consommation.", rel: ["audi-rs6-c7", "audi-s7-4g"], approx: true }),

    C("audi-rs6-c7", AU, "RS6 Avant (C7)", "Break", "2013 - 2018",
      "Le V8 4.0 TFSI biturbo de 560 ch (605 ch en Performance) avec désactivation de cylindres : 0 à 100 km/h en 3,7 secondes.",
      [P("RS6 (2013 - 2018)", "V8 4.0 TFSI biturbo, Tiptronic 8, quattro 40/60, suspension pneumatique.", [E("4.0 TFSI V8 biturbo", 560, 700, 250, 3.9, "Tiptronic 8", E824), E("4.0 TFSI V8 biturbo Performance", 605, 700, 305, 3.7, "Tiptronic 8", E824)], ["RS6 Avant", "RS6 Avant Performance (2015)"])],
      { h: "La RS6 C7 abandonne le V10 pour un V8 plus compact et plus économe. La version Performance atteint 305 km/h avec le pack Dynamic Plus.", rel: ["audi-rs6-c6", "audi-rs6-c8"], approx: true }),

    C("audi-a6-c8", AU, "A6 (C8)", "Berline", "2018 - ...",
      "L'A6 hybride léger 48 V : trois écrans, conduite assistée et plate-forme MLB Evo.",
      [P("A6 (depuis 2018)", "Berline et Avant, allroad quattro, hybride rechargeable.", [E("40 TDI", 204, 400, 240, 7.4, "S tronic 7", "2.0 TDI"), E("45 TFSI", 245, 370, 250, 6.3, "S tronic 7", EA888), E("55 TFSI", 340, 500, 250, 5.1, "S tronic 7", E839_30)], ["A6 Avant", "A6 allroad quattro"])],
      { h: "L'A6 C8 abandonne les boutons pour de larges écrans tactiles à retour haptique.", rel: ["audi-rs6-c8"], approx: true }),

    C("audi-rs6-c8", AU, "RS6 Avant (C8)", "Break", "2019 - ...",
      "La RS6 la plus extrême : V8 biturbo de 600 ch (630 ch en Performance), 0 à 100 en 3,6 secondes, hybride léger.",
      [P("RS6 Avant (depuis 2019)", "V8 4.0 TFSI biturbo, hybride léger 48 V, Tiptronic 8, quattro, suspension pneumatique.", [E("4.0 TFSI V8 biturbo", 600, 800, 250, 3.6, "Tiptronic 8", E825), E("4.0 TFSI V8 biturbo Performance", 630, 850, 305, 3.4, "Tiptronic 8", E825)], ["RS6 Avant", "RS6 Avant Performance (2023)", "RS6 GT (2024)"])],
      { h: "La RS6 C8 est devenue une icône : elle est proposée uniquement en Avant et ses passages de roues élargis sont emblématiques. En 2024, Audi a lancé une série limitée RS6 Avant GT inspirée des RS2 et RS6 d'origine.", rel: ["audi-rs6-c7", "audi-rs7-c8"], approx: true })
  ]);

  /* ======================================================= A7 / A8 */
  push([
    C("audi-s7-4g", AU, "S7 Sportback (4G)", "Berline", "2012 - 2018",
      "Le coupé quatre portes : V8 4.0 TFSI biturbo de 420 ch.",
      [P("S7 (2012 - 2018)", "V8 4.0 TFSI biturbo avec désactivation de 4 cylindres.", [E("4.0 TFSI V8 biturbo", 420, 550, 250, 4.7, "S tronic 7", E824)], ["S7 Sportback"])],
      { h: "L'A7 Sportback lancée en 2010 invente un genre : le coupé à quatre portes et hayon.", rel: ["audi-rs7-4g", "audi-s6-c7"], approx: true }),

    C("audi-rs7-4g", AU, "RS7 Sportback (4G)", "Berline", "2013 - 2018",
      "560 ch (605 en Performance) dans un coupé quatre portes à hayon : il rivalise avec les berlines sport les plus rapides.",
      [P("RS7 (2013 - 2018)", "V8 4.0 TFSI biturbo, Tiptronic 8, quattro.", [E("4.0 TFSI V8 biturbo", 560, 700, 250, 3.9, "Tiptronic 8", E824), E("4.0 TFSI V8 biturbo Performance", 605, 700, 305, 3.7, "Tiptronic 8", E824)], ["RS7 Sportback", "RS7 Performance (2015)"])],
      { h: "La RS7 partage son moteur avec la RS6 Avant C7. La version Performance est limitée à 305 km/h avec le pack Dynamic Plus.", rel: ["audi-rs6-c7", "audi-rs7-c8"], approx: true }),

    C("audi-rs7-c8", AU, "RS7 Sportback (C8)", "Berline", "2019 - ...",
      "La RS7 de deuxième génération : 600 ch, 0 à 100 en 3,6 s, hybride léger 48 V.",
      [P("RS7 (depuis 2019)", "V8 4.0 TFSI biturbo, Tiptronic 8, quattro.", [E("4.0 TFSI V8 biturbo", 600, 800, 250, 3.6, "Tiptronic 8", E825), E("4.0 TFSI V8 biturbo Performance", 630, 850, 305, 3.4, "Tiptronic 8", E825)], ["RS7 Sportback", "RS7 Performance (2023)"])],
      { h: "La RS7 C8 partage sa mécanique avec la RS6 Avant de la même génération.", rel: ["audi-rs6-c8"], approx: true }),

    C("audi-a8-d2", AU, "A8 (D2)", "Berline", "1994 - 2002",
      "La première A8, avec une structure entièrement en aluminium (Audi Space Frame) : légère, solide et quattro.",
      [P("A8 (1994 - 2002)", "Structure ASF (Audi Space Frame), V6, V8 et W12 sur la version finale.", [E("2.8 V6", 193, 280, 225, 9.0, "Auto 5", "2.8 V6"), E("3.7 V8", 230, 340, 240, 8.0, "Auto 5", "3.7 V8"), E("4.2 V8", 300, 400, 250, 7.0, "Tiptronic 5", "4.2 V8 (A8 D2)")], ["A8 quattro", "S8 (D2)"])],
      { h: "Présentée en 1994, l'A8 est la première berline de luxe de série construite en aluminium. Elle est dessinée comme une concurrente de la Mercedes Classe S et de la BMW Série 7.", a: [["Audi Space Frame", "La structure en aluminium (ASF) a été développée avec l'américain Alcoa."]], rel: ["audi-s8-d2", "audi-a8-d3"], approx: true }),

    C("audi-s8-d2", AU, "S8 (D2)", "Berline", "1996 - 2003",
      "La grande berline de 360 ch avec V8 4.2 : discrète et rapide.",
      [P("S8 (1996 - 2003)", "V8 4.2 de 340 ch puis 360 ch, boîte Tiptronic 5, quattro.", [E("4.2 V8 340", 340, 420, 250, 5.6, "Manuelle 6 / Tiptronic 5", "4.2 V8 (A8 D2)"), E("4.2 V8 360", 360, 430, 250, 5.6, "Tiptronic 5", "4.2 V8 (A8 D2)")], [])],
      { h: "La première S8 reprend un V8 4.2 à 40 soupapes. Elle est livrée sans signe distinctif marqué.", rel: ["audi-a8-d2", "audi-s8-d3"], approx: true }),

    C("audi-a8-d3", AU, "A8 (D3)", "Berline", "2002 - 2010",
      "L'A8 de deuxième génération : calandre « single frame » et version W12 de 450 ch.",
      [P("A8 (2002 - 2010)", "Structure ASF améliorée, V8 4.2 et W12 6.0.", [E("3.0 V6 TDI", 233, 450, 245, 7.5, "Tiptronic 6", "3.0 TDI"), E("4.2 V8 FSI", 350, 440, 250, 6.2, "Tiptronic 6", V42), E("6.0 W12", 450, 580, 250, 5.7, "Tiptronic 6", "6.0 W12")], ["A8 L", "A8 W12"])],
      { h: "Cette A8 est aussi disponible en version L, à empattement allongé.", rel: ["audi-s8-d3", "audi-a8-d4"], approx: true }),

    C("audi-s8-d3", AU, "S8 (D3)", "Berline", "2006 - 2010",
      "Le V10 5.2 FSI de 450 ch partagé avec la Lamborghini Gallardo.",
      [P("S8 (2006 - 2010)", "V10 5.2 FSI, Tiptronic 6, quattro.", [E("5.2 FSI V10", 450, 540, 250, 5.1, "Tiptronic 6", V52, "V10 5.2 litres atmosphérique à injection directe")], [])],
      { h: "La S8 D3 reprend le V10 5.2 litres de la Lamborghini Gallardo et de la R8 V10.", rel: ["audi-r8-v10", "audi-s8-d4"], approx: true }),

    C("audi-a8-d4", AU, "A8 (D4)", "Berline", "2010 - 2017",
      "Phares à LED, structure ASF, boîte Tiptronic à 8 rapports et hybride.",
      [P("A8 (2010 - 2017)", "Berline, version L, A8 hybride.", [E("3.0 TDI", 258, 580, 250, 5.9, "Tiptronic 8", "3.0 TDI"), E("4.0 TFSI V8", 435, 600, 250, 4.9, "Tiptronic 8", E824), E("6.3 W12", 500, 625, 250, 4.7, "Tiptronic 8", "6.3 W12")], ["A8 L", "A8 hybrid"])],
      { h: "L'A8 D4 est la première Audi à recevoir des phares entièrement à LED en série.", rel: ["audi-s8-d4"], approx: true }),

    C("audi-s8-d4", AU, "S8 plus (D4)", "Berline", "2013 - 2017",
      "Le V8 4.0 TFSI biturbo de 520 ch (605 ch pour la version Plus) : 0 à 100 en 3,8 s.",
      [P("S8 (2013 - 2017)", "V8 4.0 TFSI biturbo, Tiptronic 8, quattro.", [E("4.0 TFSI V8 biturbo", 520, 650, 250, 4.2, "Tiptronic 8", E824), E("4.0 TFSI V8 biturbo plus", 605, 700, 305, 3.8, "Tiptronic 8", E824)], ["S8 plus"])],
      { h: "La S8 plus est une des berlines de luxe les plus rapides de son époque.", rel: ["audi-s8-d3", "audi-rs6-c7"], approx: true })
  ]);

  /* ======================================================= TT */
  push([
    C("audi-tt-8n", AU, "TT (8N)", "Coupé", "1998 - 2006",
      "Le design Bauhaus signé Peter Schreyer et Freeman Thomas : la TT de 1998 a marqué le style des années 2000.",
      [P("TT (1998 - 2006)", "Coupé et Roadster, plate-forme PQ34 (Golf IV), quattro Haldex.", [E("1.8 T", 180, 235, 228, 7.4, "Manuelle 5", "1.8 T 20V"), E("1.8 T 225", 225, 280, 243, 6.6, "Manuelle 6", "1.8 T 20V"), E("3.2 V6 quattro", 250, 320, 250, 6.4, "DSG 6", "3.2 VR6")], ["TT Roadster", "TT quattro Sport (2005)"])],
      { h: "La TT a été conçue par Freeman Thomas et Peter Schreyer. Son style arrondi, tiré du concept de 1995, a été presque inchangé pour la production. La TT quattro Sport (2005) offre 240 ch dans un coupé de 1 390 kg.", a: [["Rappel de 1999", "Après quelques accidents à haute vitesse, Audi a ajouté un petit aileron et ajusté le châssis pour améliorer la stabilité à grande vitesse."]], rel: ["audi-tt-8j"], approx: true }),

    C("audi-tt-8j", AU, "TT (8J)", "Coupé", "2006 - 2014",
      "La deuxième TT, plus aluminium que la première (carrosserie mixte) : TTS à 272 ch et TT RS cinq cylindres.",
      [P("TT (2006 - 2014)", "Coupé et Roadster, plate-forme PQ35, structure mixte aluminium/acier.", [E("2.0 TFSI", 200, 280, 240, 6.4, "Manuelle 6 / S tronic", EA113), E("3.2 V6", 250, 320, 250, 5.7, "S tronic 6", "3.2 VR6")], ["TT Coupé", "TT Roadster"]),
       P("TTS (2008 - 2014)", "2.0 TFSI de 272 ch, quattro, suspension magnétique en option.", [E("2.0 TFSI", 272, 350, 250, 5.2, "S tronic 6", EA113)], ["TTS"])],
      { h: "La seconde TT adopte un châssis plus léger. Elle est la première Audi à utiliser la suspension magnétique Audi Magnetic Ride.", rel: ["audi-tt-rs-8j", "audi-tt-8s"], approx: true }),

    C("audi-tt-rs-8j", AU, "TT RS (8J)", "Coupé", "2009 - 2014",
      "Le cinq cylindres 2.5 TFSI de 340 ch (360 ch en Plus) : un petit coupé à la sonorité de rallye.",
      [P("TT RS (2009 - 2014)", "Moteur cinq cylindres 2.5 TFSI, S tronic 6, quattro. Coupé et Roadster.", [E("2.5 TFSI 340", 340, 450, 250, 4.6, "Manuelle 6 / S tronic 7", T25A, "Cinq cylindres en ligne turbo, 2.5 litres"), E("2.5 TFSI 360 plus", 360, 465, 280, 4.3, "Manuelle 6 / S tronic 7", T25A)], ["TT RS Coupé", "TT RS Roadster", "TT RS plus"])],
      { h: "Dévoilée en 2009, la TT RS inaugure le 2.5 TFSI, un cinq cylindres en ligne turbo qui rend hommage à la quattro de 1980 et sera élu « moteur international de l'année » plusieurs fois.", rel: ["audi-rs3-8p", "audi-tt-rs-8s"], approx: true }),

    C("audi-tt-8s", AU, "TT (8S)", "Coupé", "2014 - 2023",
      "La TT de troisième génération et son Audi virtual cockpit : un tableau de bord entièrement numérique inédit.",
      [P("TT (2014 - 2023)", "Plate-forme MQB, Coupé et Roadster.", [E("1.8 TFSI", 180, 250, 233, 7.2, "Manuelle 6 / S tronic", "EA888 1.8 TFSI"), E("2.0 TFSI", 230, 370, 250, 5.3, "S tronic 6", EA888)], ["TT Coupé", "TT Roadster"]),
       P("TTS (2014 - 2023)", "2.0 TFSI de 310 ch, quattro.", [E("2.0 TFSI", 310, 380, 250, 4.9, "S tronic 6", EA888)], ["TTS"])],
      { h: "La TT 8S introduit l'Audi virtual cockpit, qui remplace les compteurs par un écran de 12,3 pouces.", a: [["Fin de la TT", "Audi a mis un terme à la production de la TT en novembre 2023 avec une série finale (TT Final Edition) avant de passer à l'électrique."]], rel: ["audi-tt-rs-8s"], approx: true }),

    C("audi-tt-rs-8s", AU, "TT RS (8S)", "Coupé", "2016 - 2023",
      "Le cinq cylindres 2.5 TFSI de 400 ch : le plus puissant de la gamme TT, 0 à 100 km/h en 3,7 secondes.",
      [P("TT RS (2016 - 2023)", "Cinq cylindres 2.5 TFSI de 400 ch, S tronic 7, quattro. Coupé et Roadster.", [E("2.5 TFSI 400", 400, 480, 250, 3.7, "S tronic 7", T25N, "Cinq cylindres en ligne turbo")], ["TT RS Coupé", "TT RS Roadster", "TT RS Heritage Edition (2022)"])],
      { h: "La TT RS 8S franchit la barre des 400 ch avec une mécanique de 2.5 litres à bloc aluminium.", rel: ["audi-tt-rs-8j", "audi-rs3-8y"], approx: true })
  ]);

  /* ======================================================= R8 & E-TRON GT */
  push([
    C("audi-r8-v8", AU, "R8 V8 (type 42)", "Supercar", "2006 - 2015",
      "La première supercar d'Audi de série : V8 4.2 FSI de 420 ch placé au centre, quattro et la silhouette dérivée du concept Le Mans quattro.",
      [P("R8 V8 (2006 - 2015)", "V8 4.2 FSI de 420 ch (430 ch dès 2012), moteur central arrière, boîte manuelle ou R tronic, structure ASF en aluminium.", [E("4.2 FSI V8", 420, 430, 301, 4.6, "Manuelle 6 / R tronic", V42, "V8 atmosphérique à injection directe")], ["R8 Spyder (2010)", "R8 GT"])],
      { h: "Présentée en 2006, la R8 doit son nom à la R8 de course qui a gagné Le Mans cinq fois entre 2000 et 2005. Son châssis est partagé avec la Lamborghini Gallardo.", a: [["Tony Stark au volant", "La R8 a été choisie pour figurer dans le film Iron Man (2008)."]], rel: ["audi-r8-v10", "audi-rs4-b7"], approx: true }),

    C("audi-r8-v10", AU, "R8 V10 (type 42)", "Supercar", "2009 - 2015",
      "La R8 reçoit le V10 5.2 FSI de la Gallardo : 525 puis 550 ch en Plus.",
      [P("R8 V10 (2009 - 2015)", "V10 5.2 FSI, R tronic ou manuelle, quattro.", [E("5.2 FSI V10", 525, 530, 316, 3.9, "R tronic 7 / Manuelle 6", V52, "V10 atmosphérique à injection directe"), E("5.2 FSI V10 plus", 550, 540, 317, 3.5, "R tronic 7", V52)], ["R8 V10 Spyder", "R8 GT"])],
      { h: "La R8 V10 hisse la voiture au niveau des supercars italiennes.", rel: ["audi-r8-v8", "audi-r8-type-4s"], approx: true }),

    C("audi-r8-type-4s", AU, "R8 (type 4S)", "Supercar", "2015 - 2023",
      "La seconde génération de la R8 : V10 de 540 ou 610 ch, plus légère de 50 kg, et un Virtual cockpit.",
      [P("R8 (2015 - 2023)", "V10 5.2 FSI, S tronic 7, quattro. Coupé et Spyder.", [E("5.2 FSI V10 540", 540, 540, 323, 3.5, "S tronic 7", V52), E("5.2 FSI V10 plus 610", 610, 560, 330, 3.2, "S tronic 7", V52)], ["R8 V10", "R8 V10 plus", "R8 V10 performance (620 ch)", "R8 V10 RWS (2018)", "R8 GT (2023, 333 exemplaires)"])],
      { h: "Dernière Audi avec un moteur V10 atmosphérique, la R8 4S a connu une série finale « GT » à 333 exemplaires en 2023. Elle disparaît en 2024.", rel: ["audi-r8-v10"], approx: true }),

    C("audi-r8-lms-gt3", AU, "R8 LMS GT3", "Supercar", "2009 - 2023",
      "La GT3 d'Audi Sport Customer Racing : plusieurs victoires aux 24 Heures de Spa, du Nürburgring et de Daytona.",
      [P("R8 LMS (2009 - 2023)", "V10 atmosphérique de 585 ch environ, boîte séquentielle, aérodynamique spécifique.", [E("5.2 V10 GT3", 585, 0, 290, 0, "Séquentielle 6", V52, "Valeur de référence")], [])],
      { h: "La R8 LMS est l'une des GT3 les plus victorieuses : elle a été livrée à de nombreuses équipes clientes dans le monde. Elle a gagné les 24 Heures du Nürburgring, de Spa-Francorchamps et de Daytona.", rel: ["audi-r8-type-4s"], approx: true }),

    C("audi-rs-e-tron-gt", AU, "RS e-tron GT", "Berline", "2021 - ...",
      "La GT électrique d'Audi, sœur de la Porsche Taycan : 598 ch (925 en version performance), deux moteurs et recharge à 800 V.",
      [P("RS e-tron GT (depuis 2021)", "Deux moteurs électriques, batterie de 93 kWh, transmission intégrale, plate-forme J1 partagée avec la Porsche Taycan.", [E("RS e-tron GT", 598, 830, 250, 3.3, "Électrique 2 rapports", "Moteurs électriques e-tron GT", "Valeur de référence en mode overboost"), E("RS e-tron GT performance", 925, 1027, 250, 2.5, "Électrique 2 rapports", "Moteurs électriques e-tron GT")], ["e-tron GT", "RS e-tron GT performance (2024)"])],
      { h: "Présentée en 2021, la RS e-tron GT est la première Audi à être construite en Allemagne aux côtés de la Taycan, à Neckarsulm.", rel: ["audi-r8-type-4s"], approx: true })
  ]);
})();
