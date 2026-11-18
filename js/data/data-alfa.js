/**
 * MOTORAUTO — ALFA ROMEO : de la Giulietta Sprint de 1954 à la 33 Stradale de 2023.
 * Une fiche par génération ou par version marquante (GTA, Quadrifoglio Verde, Q4…). Voir data-kit.js pour le format.
 */
(function () {
  "use strict";
  const { E, P, C, push } = MAKIT;
  const AR = "Alfa Romeo";
  const TS = "Twin Spark 2.0 16V", BUSSO30 = "Busso V6 3.0 24V", BUSSO32 = "Busso V6 3.2 24V", BUSSO25 = "Busso V6 2.5 24V";

  push([
    /* ======================================================= LES COMPACTES DES ANNÉES 90-2000 */
    C("alfa-romeo-145", AR, "145", "Berline", "1994 - 2001",
      "Compacte à hayon au dessin anguleux, dernière Alfa à moteur Boxer à plat sous le capot, puis première à recevoir le moteur Twin Spark et le diesel JTD.",
      [P("Phase 1 (1994 - 1999)", "Dessinée au Centro Stile Alfa Romeo, elle remplace l'Alfa 33 sur la plate-forme Fiat Tipo. Quatre cylindres Boxer, puis Twin Spark à double allumage par cylindre.",
        [E("1.4 Boxer 8V", 90, 118, 172, 12.2, "Manuelle 5", "Boxer 1.4", "Chiffres de catalogue arrondis"), E("1.7 16V Boxer", 129, 158, 205, 9.0, "Manuelle 5", "Boxer 1.7 16V"), E("2.0 Twin Spark 16V", 150, 187, 210, 8.3, "Manuelle 5", TS), E("1.9 TD", 90, 190, 175, 13.5, "Manuelle 5", "", "Diesel à turbo")], ["Alfa 145 Quadrifoglio Verde"]),
       P("Phase 2 (1999 - 2001)", "Intérieur et finitions revus, ABS et airbags généralisés. Le 1.9 JTD à rampe commune arrive au catalogue.",
        [E("1.6 Twin Spark 16V", 120, 144, 193, 10.0, "Manuelle 5", "Twin Spark 1.6 16V"), E("1.9 JTD", 105, 255, 190, 10.9, "Manuelle 5", "JTD 1.9")], [])],
      { h: "La 145 est présentée en 1994. Son dessin à la fois sculpté et très agressif tranche avec le conformisme des compactes de l'époque et en fait immédiatement une voiture à part. Sous la peau, elle reprend la plate-forme de la Fiat Tipo et le principe de moteurs Boxer à plat hérités de l'Alfasud et de l'Alfa 33.\n\nEn 1996 la 145 reçoit les moteurs Twin Spark, puis en 1997 une version Quadrifoglio Verde de 150 ch. En 1999 arrive le 1.9 JTD, l'un des premiers diesels à injection directe à rampe commune sur une voiture de grande série. Elle laisse la place à la 147 en 2000-2001.",
        a: [["Un dessin qui divise", "Beaucoup de journalistes de l'époque l'ont trouvée « bizarre » ou « moche » ; elle est pourtant devenue culte et très recherchée chez les collectionneurs de youngtimers italiennes."], ["Le Twin Spark, une idée ancienne", "Le double allumage (deux bougies par cylindre) reprend une idée que la marque a utilisée sur ses moteurs de course, notamment sur la Giulia Sprint GTA de 1965."]],
        r: [["Rapport poids/puissance", "La 145 Quadrifoglio Verde pesait environ 1 100 kg pour 150 ch : l'une des compactes les plus vives de sa génération."]], rel: ["alfa-romeo-145-quadrifoglio-verde", "alfa-romeo-147"], approx: true }),

    C("alfa-romeo-145-quadrifoglio-verde", AR, "145 Quadrifoglio Verde", "Berline", "1997 - 2001",
      "La version sportive de la 145 : le 2.0 Twin Spark de 150 ch, des jantes spécifiques, des baquets et le trèfle à quatre feuilles sur l'aile.",
      [P("Quadrifoglio Verde", "Châssis légèrement abaissé, direction plus directe, sièges sport et jantes de 16 pouces.", [E("2.0 Twin Spark 16V", 150, 187, 210, 8.3, "Manuelle 5", TS)], ["Série Cloverleaf (marché britannique)"])],
      { h: "Le « Quadrifoglio Verde » (trèfle vert) désigne chez Alfa Romeo les versions sportives depuis 1923, date à laquelle le pilote Ugo Sivocci a peint un trèfle à quatre feuilles sur sa voiture avant de remporter la Targa Florio. Sur la 145, il distingue la version à moteur 2.0 Twin Spark de 150 ch, un quatre cylindres à double allumage qui rend la petite compacte très rapide pour l'époque.",
        a: [["Un porte-bonheur historique", "Le trèfle à quatre feuilles a été peint en 1923 par Ugo Sivocci sur sa voiture avant sa victoire à la Targa Florio ; Alfa Romeo l'a ensuite adopté comme porte-bonheur sur ses voitures de course."]],
        approx: true, rel: ["alfa-romeo-145"] }),

    C("alfa-romeo-147", AR, "147", "Berline", "2000 - 2010",
      "Compacte élue Voiture européenne de l'année 2001, vive, très bien dessinée et vendue à plus de 600 000 exemplaires : la sportive populaire de son époque.",
      [P("Phase 1 (2000 - 2004)", "Dessinée par Walter de Silva. Direction ultra directe, suspensions à double triangulation à l'avant. Boîte Selespeed robotisée en option.",
        [E("1.6 Twin Spark 16V", 120, 146, 193, 10.5, "Manuelle 5", "Twin Spark 1.6 16V"), E("2.0 Twin Spark 16V", 150, 187, 208, 8.6, "Manuelle 5 / Selespeed", TS), E("1.9 JTD 16V", 140, 305, 205, 9.0, "Manuelle 6", "JTD 1.9 16V")], ["147 Selespeed", "147 Distinctive"]),
       P("Phase 2 (2004 - 2010)", "Face avant redessinée (calandre en « V » plus large), 2.0 JTS à injection directe essence. Le 1.9 JTDm passe à 150 ch.",
        [E("1.6 Twin Spark 16V", 120, 146, 193, 10.5, "Manuelle 5", "Twin Spark 1.6 16V"), E("2.0 JTS", 165, 206, 213, 8.4, "Manuelle 6", "JTS 2.0", "Injection directe essence"), E("1.9 JTDm 16V", 150, 305, 210, 9.0, "Manuelle 6", "JTD 1.9 16V")], ["147 Q2", "147 Ducati Corse (2007)"])],
      { h: "Lancée au Salon de Francfort 2000 en remplacement de la 145/146, la 147 est un énorme succès commercial pour Alfa Romeo, au point de devenir la meilleure vente de la marque pendant les années 2000. Son style, sa conduite incisive et son V6 Busso en version GTA en font une compacte à part. Elle reçoit en 2004 un restylage et le moteur JTS à injection directe.",
        a: [["Voiture de l'année", "La 147 est élue Voiture européenne de l'année 2001, trois ans après la 156 (titre 1998)."], ["Cadeau pour Ducati", "En 2007, Alfa Romeo a produit une série limitée « Ducati Corse » en rouge et noir pour marquer le partenariat avec la marque de motos italienne."]],
        rel: ["alfa-romeo-147-gta"], approx: true }),

    C("alfa-romeo-147-gta", AR, "147 GTA", "Berline", "2002 - 2005",
      "Une petite compacte dans laquelle Alfa a fait entrer un V6 3,2 litres de 250 ch : la plus extrême des tractions de sa génération, et, avec la 156, l'un des deux retours du sigle GTA avant la Giulia de 2020.",
      [P("GTA", "Le V6 Busso 3.2 24V remplace le quatre cylindres. Freins Brembo, suspension raffermie et abaissée, élargisseurs d'ailes, jantes de 17 pouces.", [E("3.2 V6 24V GTA", 250, 300, 246, 6.3, "Manuelle 6 / Selespeed", BUSSO32, "Moteur V6 Busso, version 3,2 litres")], ["147 GTA Selespeed"])],
      { h: "GTA signifie « Gran Turismo Alleggerita » (allégée) : le sigle est apparu en 1965 sur la Giulia Sprint GT. Avec la 147 GTA, Alfa Romeo l'a fait revenir en 2002. Pour installer le V6 Busso de la 156 GTA dans la petite 147, il a fallu élargir la voie, adapter la suspension et ajouter de gros freins ; l'ensemble donne une compacte qui accélère comme une sportive de grande classe, mais qui impose de lutter contre le couple dans le volant.\n\nLa 147 GTA est restée au catalogue jusqu'en 2005, en volumes limités.",
        a: [["Le couple dans le volant", "Les premiers essais de presse l'ont qualifiée de « fusée de poche » ; toute l'accélération passant par les roues avant, il fallait doser l'accélérateur en sortie de virage."], ["Un son de légende", "Le V6 Busso est célèbre pour sa sonorité, un chant rauque et métallique que beaucoup considèrent comme la plus belle musique mécanique de la marque."]],
        r: [["0 à 100 km/h", "Environ 6,3 secondes, un chiffre de sportive pour une compacte familiale de 2002."]], rel: ["alfa-romeo-147", "alfa-romeo-156-gta"], approx: true }),

    /* ======================================================= LES BERLINES */
    C("alfa-romeo-155", AR, "155", "Berline", "1992 - 1997",
      "Successeur de l'Alfa 75, la 155 abandonne la propulsion pour la traction, sur base Fiat Tempra. Sa version DTM est restée dans l'histoire.",
      [P("155 (1992 - 1997)", "Dessinée par Ercole Spada (Zagato). Plate-forme de la Fiat Tempra, moteurs Twin Spark 16V et V6 Busso 2.5.",
        [E("1.8 Twin Spark 16V", 140, 165, 205, 9.3, "Manuelle 5", "Twin Spark 1.8 16V"), E("2.0 Twin Spark 16V", 150, 187, 210, 8.8, "Manuelle 5", TS), E("2.5 V6 12V", 163, 215, 215, 8.9, "Manuelle 5", "Busso V6 2.5 12V"), E("2.5 TD", 125, 275, 195, 11.0, "Manuelle 5")], ["155 Super", "155 Silverstone"])],
      { h: "La 155 arrive en 1992 pour remplacer l'Alfa 75, la dernière vraie propulsion de la marque. Elle est conçue sur la plate-forme de la Fiat Tempra, le groupe Fiat ayant racheté Alfa Romeo en 1986. Son style est dû à Ercole Spada. Mal accueillie par les puristes, elle se rachète en compétition avec sa version DTM.",
        a: [["Une remplaçante controversée", "En passant à la traction, la 155 a déçu les fidèles de l'Alfa 75 ; la marque s'est défendue en la lançant en DTM dès 1993."]],
        rel: ["alfa-romeo-155-q4", "alfa-romeo-155-v6-ti-dtm"], approx: true }),

    C("alfa-romeo-155-q4", AR, "155 Q4", "Berline", "1992 - 1995",
      "La 155 transformée en berline de rallye : le quatre cylindres 2.0 turbo de la Lancia Delta Integrale et la transmission intégrale Q4.",
      [P("155 Q4", "Moteur turbo de 190 ch emprunté à la Delta HF Integrale 16V, transmission intégrale avec différentiel central Torsen, suspension abaissée.", [E("2.0 Turbo 16V Q4", 190, 298, 225, 6.7, "Manuelle 5", "Lancia 2.0 Turbo 16V", "Moteur de la Lancia Delta Integrale 16V")], [])],
      { h: "Pour lutter contre les Audi et BMW de l'époque, Alfa Romeo a repris la mécanique de la Lancia Delta Integrale : un quatre cylindres 2.0 turbo et la transmission intégrale Q4. La 155 Q4 est restée un moteur de passion à production confidentielle, aujourd'hui recherchée par les collectionneurs.",
        a: [["Le groupe Fiat, grand mélangeur", "Alfa Romeo et Lancia appartenaient toutes deux au groupe Fiat : on retrouve donc le même moteur turbo sous le capot de la Delta Integrale et de la 155 Q4."]],
        r: [["Vitesse maxi", "Environ 225 km/h pour une berline de série de 1992."]], rel: ["alfa-romeo-155"], approx: true }),

    C("alfa-romeo-155-v6-ti-dtm", AR, "155 V6 TI DTM", "Supercar", "1993 - 1996",
      "La 155 de course qui a remporté le championnat DTM 1993 avec Nicola Larini, contre les Mercedes et Audi : une berline de série transformée en monstre à 4 roues motrices de 400 ch et plus.",
      [P("1993 (Classe 1)", "V6 2.5 litres compétition et transmission intégrale. Réglementation DTM (Deutsche Tourenwagen Meisterschaft).", [E("2.5 V6 24V compétition", 420, 290, 280, 0, "Séquentielle 6", "Busso V6 2.5 24V", "Valeur de référence : plus de 400 ch selon les saisons")], [])],
      { h: "En 1993 Alfa Romeo s'engage en DTM avec la 155 V6 TI, une version de course 4x4 à moteur V6 2.5 litres dérivée de la 155 de série. Le pilote Nicola Larini remporte le titre dès la première saison, après une confrontation spectaculaire avec les Mercedes 190 Evo et les Audi V8 quattro. En 1994 et 1995 le championnat devient le « Class 1 » international, et la 155 perd peu à peu du terrain face aux Mercedes.",
        a: [["Champion dès la première saison", "Nicola Larini a remporté le titre DTM 1993 au volant de la 155, face aux Mercedes et aux Audi."]],
        r: [["Champion DTM 1993", "Titre pilotes pour Nicola Larini avec la 155 V6 TI."]], rel: ["alfa-romeo-155"], approx: true }),

    C("alfa-romeo-156", AR, "156", "Berline", "1997 - 2005",
      "L'une des plus belles berlines des années 90 : poignées de portes arrière dissimulées, calandre iconique, Voiture européenne de l'année 1998 et premier diesel à rampe commune.",
      [P("Phase 1 (1997 - 2003)", "Dessinée par Walter de Silva au Centro Stile Alfa Romeo. Suspension à double triangulation, direction très directe.", [E("1.6 Twin Spark 16V", 120, 146, 195, 10.5, "Manuelle 5", "Twin Spark 1.6 16V"), E("2.0 Twin Spark 16V", 155, 187, 215, 8.2, "Manuelle 5", TS), E("2.5 V6 24V", 190, 222, 230, 7.6, "Manuelle 5 / Selespeed", BUSSO25), E("1.9 JTD", 105, 255, 188, 12.0, "Manuelle 5", "JTD 1.9"), E("2.4 JTD", 140, 304, 205, 9.9, "Manuelle 5", "JTD 2.4")], ["156 Selespeed"]),
       P("Phase 2 (2003 - 2005)", "Calandre redessinée ; le 2.0 JTS à injection directe essence (165 ch) arrive ; 2.4 JTD à 175 ch.", [E("2.0 JTS", 165, 206, 220, 8.2, "Manuelle 6", "JTS 2.0"), E("1.9 JTD 16V", 140, 305, 210, 9.0, "Manuelle 6", "JTD 1.9 16V"), E("2.4 JTD 20V", 175, 385, 225, 8.3, "Manuelle 6", "JTD 2.4 20V")], [])],
      { h: "La 156 est lancée en 1997 pour remplacer l'Alfa 155. Son dessin, signé Walter de Silva, joue sur des lignes tendues et sur de petits détails comme les poignées arrière cachées dans le montant de porte (la voiture ressemble à un coupé). Elle est élue Voiture européenne de l'année 1998.\n\nLa 156 est aussi la première voiture de série au monde à recevoir un diesel à rampe commune (le JTD, dès 1997) et le premier moteur à injection directe essence à haute pression de la marque (le JTS, 2002).",
        a: [["Le premier diesel à rampe commune", "Le 1.9 JTD, développé avec Fiat et Magneti Marelli, a lancé la rampe commune dans le grand public ; Bosch a ensuite racheté la technologie."], ["Poignées cachées", "Les poignées arrière sont intégrées au montant de porte, ce qui donne l'illusion d'un coupé à deux portes alors que c'est une berline."]],
        r: [["Voiture européenne de l'année", "Titre obtenu en 1998."]], rel: ["alfa-romeo-156-sportwagon", "alfa-romeo-156-gta"], approx: true }),

    C("alfa-romeo-156-sportwagon", AR, "156 Sportwagon", "Break", "2000 - 2006",
      "Le break qui a prouvé qu'on pouvait aimer un break : lignes basses, hayon élégant et mêmes moteurs sportifs que la berline.",
      [P("Sportwagon", "Même plate-forme que la berline, capacité de coffre de 360 à 1 180 litres, Q-System et suspension sport en option.", [E("2.0 Twin Spark 16V", 155, 187, 212, 8.5, "Manuelle 5", TS), E("2.5 V6 24V", 190, 222, 227, 7.8, "Manuelle 5 / Selespeed", BUSSO25), E("2.4 JTD", 140, 304, 205, 10.0, "Manuelle 5", "JTD 2.4"), E("3.2 V6 24V GTA", 250, 300, 250, 6.3, "Manuelle 6 / Selespeed", BUSSO32)], ["156 GTA Sportwagon"])],
      { h: "Dévoilé au Salon de Genève 2000, le Sportwagon est l'un des rares breaks qui conservent la personnalité de la berline. Il partage ses moteurs, et notamment le V6 3.2 de la GTA, dont la version Sportwagon est devenue un collector.",
        a: [["Un break de gentleman-driver", "Il a longtemps servi de voiture de service à des polices et gendarmeries d'Italie, ce qui est rare pour une Alfa Romeo."]], rel: ["alfa-romeo-156", "alfa-romeo-156-gta"], approx: true }),

    C("alfa-romeo-156-gta", AR, "156 GTA", "Berline", "2002 - 2005",
      "Une berline familiale de 250 ch propulsée par le fabuleux V6 Busso 3.2 : le dernier acte du moteur le plus mélodieux d'Alfa Romeo.",
      [P("GTA (2002 - 2005)", "V6 3,2 litres Busso, voie élargie, freins Brembo ventilés, suspensions abaissées. Disponible en berline et en Sportwagon.", [E("3.2 V6 24V GTA", 250, 300, 250, 6.3, "Manuelle 6 / Selespeed", BUSSO32, "Dernière évolution du V6 Busso")], ["156 GTA Sportwagon", "156 GTA Autodelta (2003)"])],
      { h: "La 156 GTA est présentée en 2002. Le V6 Busso de 3,2 litres était déjà monté sur la 147 GTA, la 166 et la GTV. Le moteur est un exemple rare de mécanique atmosphérique de grosse cylindrée, très appréciée pour son feulement. La 156 de compétition a dominé le championnat d'Europe des voitures de tourisme au début des années 2000.",
        a: [["Un V6 signé Busso", "Giuseppe Busso est l'ingénieur qui a conçu ce V6, dont la première version date de 1979 (Alfetta GTV6)."]],
        r: [["Championnat d'Europe de tourisme", "La 156 a remporté plusieurs titres dans le championnat d'Europe des voitures de tourisme (années 2000)."]], rel: ["alfa-romeo-147-gta", "alfa-romeo-156"], approx: true }),

    C("alfa-romeo-159", AR, "159", "Berline", "2005 - 2011",
      "Grande berline dessinée par Giorgetto Giugiaro, plus lourde et plus massive que la 156 mais très élégante, avec son V6 3.2 JTS et sa transmission intégrale Q4.",
      [P("159 (2005 - 2011)", "Plate-forme Premium issue d'un projet commun avec General Motors (Fiat/GM), longueur 4,66 m. Dessin Italdesign Giugiaro.", [E("1.8 MPI", 140, 175, 210, 9.9, "Manuelle 5", "1.8 MPI"), E("2.2 JTS", 185, 230, 225, 8.5, "Manuelle 6", "JTS 2.2", "Injection directe essence"), E("3.2 JTS V6 Q4", 260, 322, 240, 7.0, "Manuelle 6 / Q-Tronic", "JTS 3.2 V6", "V6 Holden/GM d'origine australienne"), E("1.9 JTDm", 150, 320, 210, 9.5, "Manuelle 6", "JTDm 1.9 16V"), E("2.4 JTDm", 200, 400, 225, 8.1, "Manuelle 6", "JTDm 2.4 20V")], ["159 Sportwagon", "159 Ti"])],
      { h: "Présentée en 2005 au Salon de Genève, la 159 remplace la 156 et marque le début de la plate-forme « Premium » développée avec General Motors. Elle accueille un V6 3.2 JTS d'origine Holden (Australie) en remplacement du Busso. Plus grande, plus lourde et plus confortable, elle a un caractère plus routier que la 156 mais conserve une ligne très reconnaissable.",
        a: [["Un V6 venu d'Australie", "Le V6 3.2 JTS de la 159 et de la Brera dérive du V6 Holden, une mécanique développée par GM, puis réglée par Alfa Romeo."], ["Elle a connu le cinéma", "Elle apparaît dans plusieurs films d'action européens des années 2000."]],
        rel: ["alfa-romeo-brera", "alfa-romeo-spider-939"], approx: true }),

    C("alfa-romeo-164", AR, "164", "Berline", "1987 - 1992",
      "La dernière Alfa Romeo dessinée par Pininfarina et la première à base de plate-forme commune Type Four avec Fiat, Lancia et Saab : une grande berline traction au dessin élégant.",
      [P("164 (1987 - 1992)", "Plate-forme Type Four (Fiat Croma, Lancia Thema, Saab 9000). Design Pininfarina. Le V6 Busso 3.0 12V de 192 ch est la star.", [E("2.0 Twin Spark 8V", 148, 186, 205, 9.5, "Manuelle 5", "Twin Spark 2.0 8V"), E("2.0 V6 Turbo", 205, 273, 235, 7.9, "Manuelle 5", "V6 2.0 Turbo", "Version italienne pour échapper à la taxe"), E("3.0 V6 12V", 192, 255, 225, 8.7, "Manuelle 5 / Auto", "Busso V6 3.0 12V"), E("2.5 TD", 125, 275, 195, 10.0, "Manuelle 5")], ["164 Q4"])],
      { h: "En 1987 apparaît la 164, remplaçante de l'Alfa 90 (puis de l'Alfa 6), élégante berline dessinée par le studio Pininfarina. C'est la dernière Alfa conçue sous le contrôle de l'ancien Alfa Romeo d'avant le rachat par Fiat (1986).",
        rel: ["alfa-romeo-164-super", "alfa-romeo-166"], approx: true }),

    C("alfa-romeo-164-super", AR, "164 Super", "Berline", "1992 - 1998",
      "La 164 restylée : V6 3.0 24V de 210 ch, intégrale Q4 de 232 ch en 1994, finitions soignées et sécurité accrue.",
      [P("164 Super (1992 - 1998)", "Refonte du tableau de bord, nouvelle calandre, le V6 3.0 gagne 24 soupapes et passe à 210 ch. En 1994 la Q4 apparaît avec 232 ch.", [E("3.0 V6 24V", 210, 275, 235, 8.0, "Manuelle 5", BUSSO30), E("3.0 V6 24V Q4", 232, 285, 240, 7.0, "Manuelle 6", BUSSO30, "Transmission intégrale Q4"), E("2.0 Twin Spark 16V", 148, 186, 210, 9.5, "Manuelle 5", TS), E("2.5 TD", 125, 275, 195, 10.0, "Manuelle 5")], ["164 Q4", "164 QV"])],
      { h: "Le restylage de 1992 donne à la 164 une face avant plus fine et un V6 3.0 à 24 soupapes de 210 ch (le Busso 24V), devenu une référence de sonorité. En 1994 la 164 Q4 reçoit une transmission intégrale, et le V6 est poussé à 232 ch. La production s'arrête en 1998, remplacée par la 166.",
        a: [["Un V6 chantant", "Le Busso 24V atteint un régime d'environ 6 500 tr/min : son échappement a été réglé pour le chant plus que pour la puissance pure."]], rel: ["alfa-romeo-164"], approx: true }),

    C("alfa-romeo-166", AR, "166", "Berline", "1998 - 2007",
      "Grande berline de prestige dessinée par Walter de Silva, au caractère très italien, avec le V6 Busso jusqu'à 3,2 litres et 240 ch.",
      [P("Phase 1 (1998 - 2003)", "Plate-forme Fiat/Lancia, V6 2.5 24V de 190 ch et 3.0 24V de 226 ch, diesel 2.4 JTD à rampe commune.", [E("2.0 Twin Spark 16V", 155, 187, 215, 9.4, "Manuelle 5", TS), E("2.5 V6 24V", 190, 222, 232, 8.9, "Manuelle 5 / Auto", BUSSO25), E("3.0 V6 24V", 226, 275, 240, 8.1, "Manuelle 5 / Auto", BUSSO30), E("2.4 JTD", 140, 304, 215, 9.9, "Manuelle 5", "JTD 2.4")], []),
       P("Phase 2 (2003 - 2007)", "Front et poupe remaniés, calandre à grande ouverture, intérieur redessiné. Le 3.2 V6 de 240 ch remplace le 3.0.", [E("3.2 V6 24V", 240, 289, 245, 7.9, "Manuelle 6 / Auto", BUSSO32), E("2.4 JTD 20V", 175, 385, 225, 8.9, "Manuelle 6", "JTD 2.4 20V")], ["166 Sportronic"])],
      { h: "La 166 remplace en 1998 la 164 comme berline de grand standing. Son dessin signé Walter de Silva est plus sage que celui de la 156 mais très reconnaissable. Elle est restée assez rare, mais ses qualités routières et sa sonorité ont créé une communauté d'amateurs.",
        a: [["Une grande rare", "Malgré ses qualités, la 166 a peu séduit la clientèle de berlines de prestige, dominée par les marques allemandes ; elle est devenue une rareté intéressante sur le marché de l'occasion."]], rel: ["alfa-romeo-164-super"], approx: true }),

    /* ======================================================= COUPÉS ET SPIDERS DES ANNÉES 90-2000 */
    C("alfa-romeo-gtv-916", AR, "GTV (916)", "Coupé", "1994 - 2005",
      "Coupé 2+2 au dessin tendu signé Enrico Fumia (Pininfarina), avec son museau pointu et ses feux arrière « à lame », qui reste l'un des plus beaux coupés des années 90.",
      [P("1994 - 1998", "Plate-forme du Fiat Tipo, suspension arrière multibras, 2.0 Twin Spark de 150 ch ou V6 2.0 Turbo de 202 ch.", [E("2.0 Twin Spark 16V", 150, 187, 210, 8.3, "Manuelle 5", TS), E("2.0 V6 Turbo", 202, 275, 235, 7.0, "Manuelle 6", "V6 2.0 Turbo")], []),
       P("1998 - 2003", "Mise à jour : V6 3.0 24V Busso de 218 ch, qui reste l'une des plus belles mécaniques d'Alfa Romeo.", [E("3.0 V6 24V", 218, 267, 240, 6.9, "Manuelle 6", BUSSO30), E("2.0 Twin Spark 16V", 155, 187, 215, 8.2, "Manuelle 5", TS)], []),
       P("2003 - 2005", "Restylage avec nouvelle face avant (« 3.2 V6 » de 240 ch).", [E("3.2 V6 24V", 240, 300, 242, 6.7, "Manuelle 6", BUSSO32), E("2.0 JTS", 165, 206, 220, 8.1, "Manuelle 6", "JTS 2.0")], ["GTV Cup (2003)"])],
      { h: "La GTV (type 916) est dessinée par Enrico Fumia chez Pininfarina. Présentée en 1994 avec son pendant découvrable, le Spider, la GTV et son pendant découvrable, le Spider, redéfinissent le coupé sportif à l'italienne : face avant en pointe, feux arrière horizontaux. La fabrication est confiée à Pininfarina.",
        a: [["Un coupé typé 90's", "Les feux arrière en barre horizontale, qui forment un trait continu, sont devenus la signature des années 1990 d'Alfa."]], rel: ["alfa-romeo-spider-916", "alfa-romeo-gt"], approx: true }),

    C("alfa-romeo-spider-916", AR, "Spider (916)", "Coupé", "1995 - 2005",
      "Le cabriolet de la GTV : la silhouette de la 916 en découvrable, au ronronnement de V6 Busso et à la capote électrique.",
      [P("Spider 916", "Cabriolet à capote électrique. Mêmes moteurs que la GTV (Twin Spark 150 ch, V6 3.0 24V, 3.2 V6 en 2003).", [E("2.0 Twin Spark 16V", 150, 187, 210, 8.6, "Manuelle 5", TS), E("3.0 V6 24V", 218, 267, 240, 7.2, "Manuelle 6", BUSSO30), E("3.2 V6 24V", 240, 300, 240, 6.8, "Manuelle 6", BUSSO32)], ["Spider Pininfarina"])],
      { h: "Le Spider (type 916) reprend la plate-forme et la face avant de la GTV mais est caractérisé par sa capote électrique et ses feux arrière à lame. Il est présenté en 1995.",
        approx: true, rel: ["alfa-romeo-gtv-916", "alfa-romeo-spider-duetto"] }),

    C("alfa-romeo-gt", AR, "GT", "Coupé", "2003 - 2010",
      "Coupé 2+2 dessiné par Bertone sur la base de la 147 : lignes harmonieuses, 3,2 V6 Busso de 240 ch et diesel 1.9 JTD.",
      [P("GT", "Plate-forme 147 / 156 allongée, trois moteurs essence et deux diesel.", [E("1.8 Twin Spark 16V", 140, 169, 210, 9.6, "Manuelle 5", "Twin Spark 1.8 16V"), E("2.0 JTS", 165, 206, 223, 8.3, "Manuelle 6", "JTS 2.0"), E("3.2 V6 24V", 240, 289, 242, 7.0, "Manuelle 6 / Q-System", BUSSO32), E("1.9 JTD", 150, 305, 210, 9.4, "Manuelle 6", "JTD 1.9 16V")], ["GT Q2", "GT Quadrifoglio Verde"])],
      { h: "L'Alfa GT est dévoilée en 2003 pour remplacer la GTV. Elle est dessinée par Bertone et séduit par ses proportions de coupé 2+2. Elle compte parmi les dernières Alfa Romeo à recevoir le V6 Busso de 3.2 litres.",
        a: [["Le chant du Busso", "Le V6 Busso 3.2 de la GT 3.2 est l'une des dernières occasions d'entendre ce moteur sur une Alfa de série."]], rel: ["alfa-romeo-gtv-916", "alfa-romeo-brera"], approx: true }),

    C("alfa-romeo-brera", AR, "Brera", "Coupé", "2005 - 2010",
      "Coupé dessiné par Giorgetto Giugiaro (Italdesign) : une ligne spectaculaire, un toit en verre panoramique, mais plus lourde que prévu.",
      [P("Brera", "Plate-forme de la 159. 2.2 JTS de 185 ch, V6 3.2 JTS de 260 ch avec transmission Q4, diesels JTDm.", [E("2.2 JTS", 185, 230, 227, 8.6, "Manuelle 6", "JTS 2.2"), E("3.2 JTS V6 Q4", 260, 322, 245, 7.0, "Manuelle 6 / Q-Tronic", "JTS 3.2 V6"), E("2.4 JTDm", 200, 400, 225, 8.1, "Manuelle 6", "JTDm 2.4 20V")], ["Brera Italia Independent (2008)", "Brera S"])],
      { h: "La Brera est présentée en 2002 comme prototype Italdesign avant d'entrer en production en 2005. Son dessin a fait sensation, avec un toit en verre qui lui valait une luminosité exceptionnelle. L'excès de poids et la direction sont à l'origine de critiques, mais sa ligne reste l'une des plus belles de son époque.",
        a: [["Un nom de quartier de Milan", "« Brera » est le nom d'un quartier de Milan, riche en galeries d'art et en cafés : la voiture a été conçue comme une œuvre d'art roulante."]], rel: ["alfa-romeo-spider-939", "alfa-romeo-159"], approx: true }),

    C("alfa-romeo-spider-939", AR, "Spider (939)", "Coupé", "2006 - 2010",
      "Le découvrable de la Brera, dessiné par Pininfarina. Il combine ligne élégante et V6 3.2 de 260 ch.",
      [P("Spider 939", "Capote en toile, 2.2 JTS, V6 3.2 JTS Q4, 2.4 JTDm.", [E("2.2 JTS", 185, 230, 225, 8.8, "Manuelle 6", "JTS 2.2"), E("3.2 JTS V6 Q4", 260, 322, 240, 7.2, "Manuelle 6", "JTS 3.2 V6")], [])],
      { h: "Présenté au Salon de Genève 2006, le Spider 939 est dessiné et produit par Pininfarina, qui s'occupe de l'assemblage de la Brera et du Spider à San Giorgio Canavese.", approx: true, rel: ["alfa-romeo-brera"] }),

    /* ======================================================= LES PETITES SPORTIVES MODERNES */
    C("alfa-romeo-mito", AR, "MiTo", "Berline", "2008 - 2018",
      "Petite sportive urbaine dont le nom associe Milan (où elle est dessinée) et Turin (où elle est produite) ; face avant rappelant la 8C Competizione.",
      [P("MiTo (2008 - 2018)", "Plate-forme Fiat Punto Evo. Système « DNA » à trois modes (Dynamic, Normal, All weather) et boîte TCT à double embrayage.", [E("1.4 Turbo", 120, 206, 199, 9.8, "Manuelle 6", "Fire 1.4 Turbo"), E("1.4 TB MultiAir", 135, 206, 208, 8.4, "Manuelle 6", "MultiAir 1.4 TB"), E("1.3 JTDm", 95, 200, 180, 11.6, "Manuelle 5", "JTDm 1.3"), E("0.9 TwinAir", 105, 145, 190, 10.9, "Manuelle 6", "TwinAir 0.9")], ["MiTo Distinctive", "MiTo Veloce (2014)"])],
      { h: "La MiTo est dévoilée en 2008 à Milan. Son nom vient de la double origine de la voiture : conçue à Milan, produite à Turin. La face avant avec la calandre en « trilobo » rappelle celle de la 8C Competizione. Elle est la première Alfa Romeo à proposer le système DNA (pour Dynamic, Normal, All weather).",
        a: [["MiTo, comme Milano-Torino", "C'est aussi le nom d'une course ancienne et d'un tronçon de voie ferrée entre ces deux villes."]], rel: ["alfa-romeo-mito-quadrifoglio-verde"], approx: true }),

    C("alfa-romeo-mito-quadrifoglio-verde", AR, "MiTo Quadrifoglio Verde", "Berline", "2009 - 2018",
      "La MiTo la plus vive : 170 ch, un différentiel à glissement limité électronique (Q2) et des jantes de 17 à 18 pouces.",
      [P("Quadrifoglio Verde", "1.4 turbo MultiAir de 170 ch et différentiel Q2 simulant un autobloquant ; trois modes DNA.", [E("1.4 TB MultiAir QV", 170, 250, 219, 7.3, "Manuelle 6", "MultiAir 1.4 TB 170", "Système MultiAir Fiat")], ["MiTo Veloce 170 ch"])],
      { h: "La MiTo Quadrifoglio Verde est présentée en 2009. Son moteur 1.4 MultiAir turbo de 170 ch est le plus puissant de la gamme MiTo. Le différentiel Q2 de la QV améliore la motricité sur une traction à fort couple.", rel: ["alfa-romeo-mito"], approx: true }),

    C("alfa-romeo-giulietta-940", AR, "Giulietta (940)", "Berline", "2010 - 2020",
      "La compacte Alfa du XXIe siècle : plate-forme Compact, ligne sensuelle et moteurs turbo et diesel 4 cylindres.",
      [P("Giulietta (2010 - 2020)", "Plate-forme Compact. Trois modes DNA, suspension Alfa Link à l'arrière. Phase 2 en 2016 avec nouvelle face avant.", [E("1.4 TB MultiAir", 170, 250, 218, 7.8, "Manuelle 6 / TCT", "MultiAir 1.4 TB 170"), E("1.75 TBi", 235, 340, 242, 6.8, "Manuelle 6 / TCT", "1.75 TBi 235"), E("1.6 JTDm", 120, 320, 195, 10.3, "Manuelle 6", "JTDm 1.6"), E("2.0 JTDm", 150, 350, 210, 8.8, "Manuelle 6", "JTDm 2.0")], ["Giulietta Quadrifoglio Verde", "Giulietta Veloce"])],
      { h: "Présentée en 2010 pour le centenaire d'Alfa Romeo (1910), la Giulietta rend hommage à l'Alfa Romeo Giulietta d'origine (1954). Elle repose sur la plate-forme Compact. Elle devient la plus vendue de la marque en Europe. La production s'arrête en 2020, sans successeur.",
        a: [["Une Alfa pour les 100 ans", "La Giulietta est apparue en 2010, l'année du centenaire de la marque (fondée en 1910 sous le nom A.L.F.A.)."]], rel: ["alfa-romeo-giulietta-quadrifoglio-verde", "alfa-romeo-giulietta-sprint-750"], approx: true }),

    C("alfa-romeo-giulietta-quadrifoglio-verde", AR, "Giulietta Quadrifoglio Verde", "Berline", "2010 - 2020",
      "La Giulietta la plus puissante : le quatre cylindres 1.75 TBi de 235 puis 240 ch, avec un différentiel électronique Q2.",
      [P("1.75 TBi 235 ch (2010)", "Quatre cylindres turbo à injection directe, boîte manuelle 6 rapports puis TCT.", [E("1.75 TBi 235", 235, 340, 242, 6.8, "Manuelle 6 / TCT", "1.75 TBi 235")], []),
       P("1.75 TBi 240 ch (2014)", "Revue de réglage, nouveau différentiel, plus de couple.", [E("1.75 TBi 240", 240, 340, 244, 6.0, "TCT 6", "1.75 TBi 240")], ["Giulietta QV Launch Edition"])],
      { h: "La Giulietta QV a hérité du 1.75 TBi de la 4C. Ses évolutions de 2014 lui donnent un temps de 6,0 secondes de 0 à 100 km/h.", approx: true, rel: ["alfa-romeo-giulietta-940", "alfa-romeo-4c"] }),

    /* ======================================================= SUPERCARS MODERNES */
    C("alfa-romeo-8c-competizione", AR, "8C Competizione", "Supercar", "2007 - 2009",
      "Un coupé 4,7 litres V8 à transmission transaxle et caisse en carbone, produit à 500 exemplaires, qui renoue avec la grande tradition des Alfa Romeo des années 30.",
      [P("8C Competizione", "V8 4.7 litres Ferrari/Maserati F136 de 450 ch, boîte robotisée à 6 rapports montée à l'arrière, carrosserie en fibre de carbone.", [E("4.7 V8 F136", 450, 480, 292, 4.2, "Robotisée 6", "F136 4.7 V8", "Moteur d'origine Ferrari/Maserati")], ["Série limitée à 500 coupés"])],
      { h: "Dessinée par le Centro Stile Alfa Romeo, la 8C Competizione est présentée en 2003 comme concept à Francfort, puis en série en 2007. Elle est produite à 500 exemplaires chez Maserati à Modène. Son nom fait référence à la 8C 2300 des années 30, huit cylindres championne du Mans.",
        rel: ["alfa-romeo-8c-spider", "alfa-romeo-8c-2300-le-mans"], approx: true }),

    C("alfa-romeo-8c-spider", AR, "8C Spider", "Supercar", "2008 - 2010",
      "Version découvrable de la 8C Competizione, produite à 500 exemplaires avec la même mécanique V8 4,7 litres.",
      [P("8C Spider", "Même V8 que le coupé, capote en toile, châssis renforcé.", [E("4.7 V8 F136", 450, 480, 290, 4.5, "Robotisée 6", "F136 4.7 V8", "Moteur d'origine Ferrari/Maserati")], ["Série limitée à 500 exemplaires"])],
      { h: "La 8C Spider est présentée en 2008 à Genève. Elle repose sur le même châssis que la Competizione mais abandonne le toit rigide pour une capote en toile. Les deux voitures appartiennent aux dernières Alfa Romeo de l'ère « Maserati V8 ».", rel: ["alfa-romeo-8c-competizione"], approx: true }),

    C("alfa-romeo-4c", AR, "4C", "Supercar", "2013 - 2020",
      "Coupé à moteur central en carbone de moins de 1 000 kg, propulsé par un quatre cylindres 1.75 turbo de 240 ch : une supercar minimaliste et radicale.",
      [P("4C Coupé", "Monocoque en fibre de carbone de 65 kg, 1.75 TBi turbo de 240 ch, boîte TCT à double embrayage, direction non assistée.", [E("1.75 TBi", 240, 350, 258, 4.5, "TCT 6", "1.75 TBi 240", "Environ 895 kg à sec")], ["4C Launch Edition", "4C Competizione (2018)", "4C Spider Italia"])],
      { h: "La 4C est le premier modèle vendu aux États-Unis depuis le retour d'Alfa Romeo en 2014. Avec sa coque carbone et son faible poids (moins de 1 000 kg), c'est une sportive pure : pas de direction assistée, une conduite sans filtre.\n\nSa production a commencé en 2013 à Modène (Maserati) pour s'arrêter en 2020.",
        a: [["Pas de direction assistée", "Alfa Romeo a choisi de ne pas en mettre pour préserver le toucher de route ; l'effort au volant à basse vitesse est élevé."]],
        r: [["Poids/puissance", "Environ 3,7 kg par cheval : un rapport de supercar avec seulement 240 ch."]], rel: ["alfa-romeo-4c-spider"], approx: true }),

    C("alfa-romeo-4c-spider", AR, "4C Spider", "Supercar", "2015 - 2020",
      "La 4C en version découvrable : même monocoque en carbone, capote déposable et peu de surpoids.",
      [P("4C Spider", "Toit en toile déposable. Mêmes 240 ch que le coupé.", [E("1.75 TBi", 240, 350, 257, 4.5, "TCT 6", "1.75 TBi 240")], ["4C Spider Italia", "4C Spider 33 Stradale Tributo"])],
      { h: "La 4C Spider est présentée en 2015 à Détroit. Elle conserve le comportement radical du coupé en y ajoutant la liberté du plein air.", rel: ["alfa-romeo-4c"], approx: true }),

    /* ======================================================= LA GIULIA MODERNE */
    C("alfa-romeo-giulia-952", AR, "Giulia (952)", "Berline", "2015 - ...",
      "La berline sportive qui marque le retour d'Alfa Romeo au sommet : propulsion, répartition 50/50 et direction ultra directe sur la plate-forme Giorgio.",
      [P("Giulia (depuis 2016)", "Plate-forme Giorgio, propulsion ou transmission intégrale Q4, boîte automatique ZF à 8 rapports.", [E("2.0 Turbo", 200, 330, 230, 6.6, "Auto 8", "GME 2.0 Turbo", "Moteur Giorgio 4 cylindres"), E("2.0 Turbo Veloce", 280, 400, 240, 5.2, "Auto 8", "GME 2.0 Turbo 280"), E("2.2 JTDm", 190, 450, 230, 7.1, "Auto 8", "JTDm 2.2")], ["Giulia Super", "Giulia Veloce", "Giulia Competizione (2020)"])],
      { h: "Présentée en 2015 pour les 105 ans de la marque, la Giulia est la première berline de la nouvelle ère Alfa Romeo, sur la plate-forme Giorgio développée pour reprendre la propulsion. Elle est dessinée au Centro Stile Alfa Romeo ; sa direction est parmi les plus directes de sa catégorie.",
        a: [["Sans toit en acier", "Certaines versions de la Giulia reçoivent un toit en fibre de carbone et un arbre de transmission en carbone, rarissime en grande série."]], rel: ["alfa-romeo-giulia-quadrifoglio", "alfa-romeo-giulia-gta"], approx: true }),

    C("alfa-romeo-giulia-quadrifoglio", AR, "Giulia Quadrifoglio", "Berline", "2015 - ...",
      "Une berline de 510 ch, un V6 biturbo de 2,9 litres dérivé de la technologie Ferrari et un record sur le Nürburgring Nordschleife établi en 2016.",
      [P("Giulia Quadrifoglio", "V6 2.9 biturbo de 510 ch, transmission à propulsion, arbre de transmission en carbone, boîte ZF 8 rapports, capot en carbone.", [E("2.9 V6 biturbo", 510, 600, 307, 3.9, "Auto 8", "690T 2.9 V6 BiTurbo", "Moteur V6 Alfa à 90°, d'inspiration Ferrari")], ["Giulia QV Competizione", "Giulia QV Superior"])],
      { h: "La Giulia QV a été développée par une équipe passée par Ferrari. Son V6 2.9 biturbo (code 690T) dérive de la technologie V8 Ferrari « F154 » : même alésage et course d'un cylindre de Ferrari California T, soit les deux tiers. Elle établit en 2016 un temps de 7 minutes 32 secondes sur la boucle nord du Nürburgring, record des berlines de série à l'époque.",
        a: [["7:32 au Nürburgring", "Le temps officiel de 7 min 32 s a été établi par la Giulia QV, premier record pour une berline de série à l'époque, avant d'être battu par d'autres modèles."]],
        r: [["Record du Nürburgring (2016)", "7 minutes 32 secondes pour une berline de série."]], rel: ["alfa-romeo-giulia-952", "alfa-romeo-giulia-gta"], approx: true }),

    C("alfa-romeo-giulia-gta", AR, "Giulia GTA / GTAm", "Berline", "2020 - 2021",
      "Limitée à 500 exemplaires, c'est la Giulia la plus extrême : 540 ch, 100 kg d'allègement, ailerons en carbone et, pour la GTAm, deux places seulement.",
      [P("GTA / GTAm", "V6 2.9 de 540 ch, 1 520 kg environ, nouvelle aérodynamique avec splitter et aileron arrière. GTAm : sans banquette arrière, avec arceau et harnais.", [E("2.9 V6 biturbo GTA", 540, 600, 300, 3.6, "Auto 8", "690T 2.9 V6 BiTurbo", "Version 540 ch")], ["GTA", "GTAm"])],
      { h: "Pour fêter les 110 ans de la marque, Alfa Romeo ressuscite en 2020 le sigle GTA (« Gran Turismo Alleggerita ») avec la Giulia GTA, qui profite d'un allègement de 100 kg (par rapport à la QV), d'une aérodynamique spécifique et de 540 ch. La GTAm, plus radicale, supprime la banquette arrière. Il en a été produit 500 exemplaires, tous vendus.",
        a: [["Un nom qui vient de 1965", "GTA vient de la Giulia Sprint GTA de 1965, une version allégée de la Giulia Sprint GT conçue par Autodelta pour la course."]], rel: ["alfa-romeo-giulia-quadrifoglio", "alfa-romeo-giulia-sprint-gt-105"], approx: true }),

    /* ======================================================= LES MYTHES D'AVANT */
    C("alfa-romeo-33-stradale", AR, "33 Stradale (1967)", "Supercar", "1967 - 1971",
      "L'une des plus belles voitures de tous les temps : une Tipo 33 de course habillée de lignes sculptées par Franco Scaglione, produite à environ 18 exemplaires.",
      [P("33 Stradale", "Châssis en tubes d'aluminium, V8 2.0 litres de 230 ch à 8 800 tr/min, carrosserie en alliage léger, portes en élytre papillon.", [E("2.0 V8 Tipo 33", 230, 206, 260, 5.5, "Manuelle 6", "Tipo 33 V8 2.0", "Chiffres de référence d'époque")], ["33 Stradale Carrozzeria Marazzi"])],
      { h: "La 33 Stradale est dérivée de l'Alfa Romeo Tipo 33, prototype de course lancé en 1967. Les carrosseries sont réalisées par Scaglione avec des courbes, des portes papillon et une nervure arrière prononcée. Il en a été construit un très petit nombre (une quinzaine à une vingtaine d'exemplaires), vendu à des clients fortunés. Elle est généralement considérée comme la première supercar à moteur central de série signée Alfa Romeo.",
        a: [["Une réputation d'élégance", "Elle est régulièrement citée parmi les plus belles voitures jamais dessinées ; les rares exemplaires qui changent de mains se négocient à plusieurs millions d'euros."]],
        r: [["Rareté", "Une vingtaine d'exemplaires au plus, vendus en 1967-1971."]], rel: ["alfa-romeo-33-stradale-2023"], approx: true }),

    C("alfa-romeo-33-stradale-2023", AR, "33 Stradale (2023)", "Supercar", "2023 - ...",
      "Une supercar produite à 33 exemplaires qui reprend le nom et l'esprit de la Tipo 33 Stradale de 1967 : V6 3.0 biturbo de 620 ch ou version 100 % électrique.",
      [P("33 Stradale (2023)", "Châssis en carbone, V6 3.0 biturbo de 620 ch (Maserati Nettuno) ou groupe motopropulseur électrique de 750 ch.", [E("3.0 V6 biturbo Nettuno", 620, 620, 333, 3.0, "Robotisée 8", "Nettuno V6 3.0 BiTurbo", "Moteur à préchambre de combustion"), E("Électrique 750 ch", 750, 0, 322, 2.5, "Réducteur", "", "Version électrique, valeurs annoncées")], ["33 Stradale Elettrica"])],
      { h: "Présentée en 2023, la 33 Stradale est un hommage à l'Alfa Romeo 33 Stradale de 1967. Elle est dessinée par le centre de style Alfa Romeo et construite à 33 exemplaires seulement.", rel: ["alfa-romeo-33-stradale"], approx: true }),

    C("alfa-romeo-giulia-sprint-gt-105", AR, "Giulia Sprint GT (105)", "Coupé", "1963 - 1977",
      "Le coupé dessiné par Giorgetto Giugiaro chez Bertone : une ligne pure, un double arbre à cames et une voiture de course devenue icône, la Sprint GTA.",
      [P("Giulia Sprint GT (1963 - 1966)", "Moteur 1.6 litre quatre cylindres à double arbre à cames en tête de 106 ch, boîte 5 vitesses.", [E("1.6 DOHC", 106, 142, 180, 11.0, "Manuelle 5", "Alfa Twin Cam 1.6")], []),
       P("1750 / 2000 GTV (1967 - 1977)", "Cylindrée portée à 1,75 puis 2 litres, calandre redessinée « GTV ».", [E("1.75 DOHC", 118, 186, 190, 10.0, "Manuelle 5", "Alfa Twin Cam 1.75"), E("2.0 DOHC", 131, 178, 195, 9.5, "Manuelle 5", "Alfa Twin Cam 2.0")], ["Giulia Sprint GTA (1965)", "1750 GTV", "2000 GTV"])],
      { h: "La Giulia Sprint GT, dévoilée en 1963 au salon de Francfort, est dessinée par Giorgetto Giugiaro, alors jeune styliste chez Bertone. Elle repose sur la Giulia berline. La version GTA, avec carrosserie en aluminium et moteur double allumage, domine les championnats de tourisme des années 60.",
        a: [["Le jeune Giugiaro", "Giorgetto Giugiaro avait à peine 24 ans lorsqu'il a dessiné cette voiture, qui l'a rendu célèbre."]], r: [["Longévité", "Produite de 1963 à 1977, soit 14 ans de carrière."]], rel: ["alfa-romeo-giulia-gta", "alfa-romeo-giulia-tz"], approx: true }),

    C("alfa-romeo-giulia-tz", AR, "Giulia TZ (Tubolare Zagato)", "Supercar", "1963 - 1967",
      "Coupé de compétition à châssis tubulaire et carrosserie Zagato en aluminium, qui pesait environ 660 kg : une icône des années 60.",
      [P("TZ1", "Châssis tubulaire (d'où « Tubolare »), carrosserie en alliage par Zagato, 1.6 litres de 112 ch.", [E("1.6 DOHC", 112, 142, 215, 0, "Manuelle 5", "Alfa Twin Cam 1.6", "Poids environ 660 kg")], ["TZ1", "TZ2 (1965)"])],
      { h: "La Giulia TZ est conçue par Autodelta, le service course d'Alfa Romeo dirigé par Carlo Chiti. La carrosserie, dessinée chez Zagato, est tronquée à l'arrière (« Kamm tail »), très aérodynamique. Elle est produite à environ 112 exemplaires pour la première version et 12 pour la TZ2.",
        approx: true, rel: ["alfa-romeo-giulia-sprint-gt-105"] }),

    C("alfa-romeo-giulietta-sprint-750", AR, "Giulietta Sprint (750 / 101)", "Coupé", "1954 - 1965",
      "Le coupé élégant dessiné par Franco Scaglione chez Bertone : la voiture qui a fait passer Alfa Romeo de la confidentialité à la grande série.",
      [P("Giulietta Sprint (1954 - 1962)", "Quatre cylindres 1.3 litre en alliage léger à double arbre à cames en tête, 65 ch puis 90 ch (Veloce).", [E("1.3 DOHC", 65, 96, 155, 14.0, "Manuelle 4 puis 5", "Alfa Twin Cam 1.3"), E("1.3 DOHC Veloce", 90, 104, 175, 11.5, "Manuelle 5", "Alfa Twin Cam 1.3 Veloce")], ["Sprint Veloce", "Sprint Speciale (SS)"])],
      { h: "La Giulietta Sprint est présentée en 1954 au Salon de Turin, avant la berline Giulietta (1955). Dessinée par Franco Scaglione chez Bertone, elle devient immédiatement une star. Elle fait entrer Alfa Romeo dans la grande série populaire après l'Alfa 1900 de 1950, avec son quatre cylindres en alliage léger à double arbre à cames en tête.",
        a: [["Un nom de théâtre", "Le nom « Giulietta » (Juliette) est un clin d'œil à Roméo : Alfa Romeo."]], rel: ["alfa-romeo-giulietta-940"], approx: true }),

    C("alfa-romeo-spider-duetto", AR, "Spider Duetto (105 / 115)", "Coupé", "1966 - 1993",
      "Le spider de « Le Lauréat » : 27 ans de carrière pour une ligne éternelle, de la queue en « os de seiche » à la version « Aerodinamica ».",
      [P("Duetto 1600 (1966 - 1969)", "Quatre cylindres 1.6 litre DOHC, 109 ch ; queue ronde « osso di seppia ».", [E("1.6 DOHC", 109, 142, 185, 11.5, "Manuelle 5", "Alfa Twin Cam 1.6")], ["Duetto"]),
       P("Spider 1750 / 2000 Veloce (1968 - 1982)", "Cylindrée portée à 1.75 puis 2.0 litres ; queue coupée type « Kamm » dès 1970.", [E("1.75 DOHC", 118, 186, 190, 10.0, "Manuelle 5", "Alfa Twin Cam 1.75"), E("2.0 DOHC", 128, 178, 195, 9.5, "Manuelle 5", "Alfa Twin Cam 2.0")], ["Spider 2000 Veloce"]),
       P("Série 3 et 4 (1983 - 1993)", "Pare-chocs en plastique et spoiler arrière, puis le restylage de la série 4 (1990).", [E("2.0 DOHC", 126, 170, 190, 10.0, "Manuelle 5", "Alfa Twin Cam 2.0")], ["Spider Quadrifoglio Verde", "Spider S4"])],
      { h: "Le Spider est dessiné par Pininfarina à la demande d'Alfa Romeo. Il est produit de 1966 à 1993 en quatre séries, ce qui en fait l'une des voitures les plus durables de l'histoire. Sa première version porte le nom de « Duetto », choisi à l'issue d'un concours organisé par la marque.",
        a: [["Le Lauréat", "Une Alfa Romeo Duetto rouge apparaît dans le film « Le Lauréat » (1967), avec Dustin Hoffman, et fait de ce spider un symbole d'une génération."], ["Un nom choisi par le public", "« Duetto » a été retenu lors d'un concours de noms proposé aux lecteurs d'un magazine."]],
        r: [["27 ans de production", "De 1966 à 1993, quatre séries successives."]], rel: ["alfa-romeo-spider-916"], approx: true }),

    C("alfa-romeo-gtv6", AR, "Alfetta GTV6", "Coupé", "1980 - 1986",
      "Le coupé qui a mis le V6 Busso dans l'Alfetta : tracteur en boîte-pont arrière (transaxle), poids bien réparti et son à nul autre pareil.",
      [P("GTV6 2.5", "V6 2.5 litres de 160 ch (puis 2.5 de 160), architecture transaxle, dessin Giugiaro (Italdesign).", [E("2.5 V6 Busso", 160, 216, 210, 8.5, "Manuelle 5", "Busso V6 2.5 12V")], ["GTV6 Callaway Twin Turbo"])],
      { h: "L'Alfetta GTV6 est la première Alfa à recevoir le V6 Busso, un moteur de 2.5 litres dessiné par l'ingénieur Giuseppe Busso, qui a conçu aussi les moteurs des Giulia. Sa version de compétition s'est illustrée dans le championnat d'Europe des voitures de tourisme au début des années 1980.",
        a: [["Le V6 d'un ingénieur", "Giuseppe Busso est passé par Ferrari avant de travailler chez Alfa Romeo ; son V6 a équipé des Alfa pendant plus de vingt ans."]], rel: ["alfa-romeo-gt"], approx: true }),

    C("alfa-romeo-8c-2300-le-mans", AR, "8C 2300 Le Mans", "Le Mans", "1931 - 1934",
      "Quatre victoires consécutives aux 24 Heures du Mans de 1931 à 1934 : la huit cylindres Alfa Romeo qui a fait la gloire d'Alfa dans l'Entre-deux-guerres.",
      [P("8C 2300 (1931 - 1934)", "Huit cylindres en ligne de 2,3 litres à compresseur, dessiné par Vittorio Jano. Carrosseries Touring et Zagato.", [E("2.3 8 cyl. compresseur", 142, 0, 180, 0, "Manuelle 4", "Alfa 8C 2300", "Puissance de la version Le Mans, valeur de référence")], ["8C 2300 Le Mans", "8C 2300 Monza"])],
      { h: "La 8C 2300 est conçue par Vittorio Jano, l'ingénieur qui a créé la 6C 1500, la P2 et la P3. Son moteur huit cylindres en ligne de 2,3 litres comporte un compresseur et un double arbre à cames en tête, deux principes qui font la fortune d'Alfa. Elle remporte les 24 Heures du Mans quatre années de suite : 1931 (Earl Howe et Tim Birkin), 1932 (Raymond Sommer et Luigi Chinetti), 1933 (Raymond Sommer et Tazio Nuvolari) et 1934 (Luigi Chinetti et Philippe Étancelin).",
        a: [["Nuvolari au Mans", "Tazio Nuvolari, le pilote le plus célèbre de son temps, a remporté la course de 1933 en duo avec Raymond Sommer."], ["Chinetti, deux fois vainqueur", "Luigi Chinetti a gagné deux fois (1932, 1934) avec l'Alfa, avant d'apporter à Ferrari son premier Mans en 1949."]],
        r: [["Quatre victoires consécutives", "1931, 1932, 1933 et 1934 : la première série de victoires au Mans de l'histoire."]], rel: ["alfa-romeo-8c-competizione"], approx: true })
  ]);
})();
