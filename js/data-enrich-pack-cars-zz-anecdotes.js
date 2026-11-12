/** MOTORAUTO — anecdotes et palmarès pour les marques les moins complètes (Pagani, Koenigsegg, Lotus, Maserati, Lamborghini, Aston Martin, Ferrari). Faits vérifiables uniquement. */
(function () {
  "use strict";
  const m = {};
  const add = (id, a, r, rel) => { m[id] = { a: a || [], r: r || [], rel: rel || [] }; };

  // ---- Pagani
  add("pagani-zonda-c12", [["Un nom de vent", "Zonda est le nom d'un vent chaud des Andes, en Argentine, pays d'origine d'Horacio Pagani."], ["Hommage à Fangio", "Le projet était d'abord appelé « Fangio F1 », en l'honneur du quintuple champion du monde, mort en 1995."], ["Un cœur Mercedes-AMG", "Son V12 6,0 litres est fourni par AMG."]], [["Présentation", "Salon de Genève 1999."]], ["pagani-zonda-f", "pagani-huayra"]);
  add("pagani-zonda-f", [["F comme Fangio", "Le « F » rend hommage à Juan Manuel Fangio."]], [], ["pagani-zonda-c12", "pagani-zonda-cinque"]);
  add("pagani-zonda-cinque", [["Cinq exemplaires", "Cinque signifie « cinq » en italien : la série coupé est limitée à cinq voitures."]], [], ["pagani-zonda-f", "pagani-zonda-r"]);
  add("pagani-zonda-r", [["Pas faite pour la route", "La Zonda R est une voiture de piste, non homologuée pour la route."]], [["Nürburgring", "6 min 47 s 50 sur la Nordschleife en 2010, avec Marc Basseng."]], ["pagani-zonda-cinque", "pagani-huayra"]);
  add("pagani-huayra", [["Le dieu du vent", "Huayra-tata est le dieu du vent dans la mythologie quechua."], ["Biturbo AMG", "Son V12 6,0 litres biturbo vient d'AMG, comme celui de la Zonda mais suralimenté."]], [["Présentation", "Salon de Genève 2011."]], ["pagani-zonda-f", "pagani-huayra-bc"]);
  add("pagani-huayra-bc", [["BC comme Benny Caiola", "Le nom rend hommage à Benny Caiola, premier client et ami de Pagani."]], [["Série limitée", "20 exemplaires."]], ["pagani-huayra", "pagani-huayra-imola"]);
  add("pagani-utopia", [["Boîte manuelle", "Pagani propose une boîte manuelle à sept rapports en option sur l'Utopia."], ["Toujours un V12 AMG", "Elle reprend un V12 biturbo de 6,0 litres d'origine AMG."]], [["Série limitée", "99 exemplaires prévus pour le coupé."]], ["pagani-huayra", "pagani-huayra-bc"]);

  // ---- Koenigsegg
  add("koenigsegg-cc8s", [["Première série", "La CC8S est la première Koenigsegg de série, construite à Ängelholm, en Suède."], ["Le fantôme", "Le logo reprend le blason de la famille et un fantôme, emblème de l'escadron de chasse de la base aérienne d'Ängelholm, où se trouve l'usine."]], [], ["koenigsegg-ccr", "koenigsegg-ccx"]);
  add("koenigsegg-ccr", [["Un record de vitesse", "En 2005, la CCR atteint 387,87 km/h à Nardò, battant la McLaren F1 de 1998."]], [["Vitesse maximale", "387,87 km/h à Nardò (Italie), en 2005."]], ["koenigsegg-cc8s", "koenigsegg-ccx"]);
  add("koenigsegg-ccx", [["CCX = dix ans", "Le X renvoie aux dix ans de la marque, fondée en 1994."], ["Pensée pour les États-Unis", "La CCX a été conçue pour respecter les normes américaines et européennes."]], [], ["koenigsegg-ccr", "koenigsegg-agera"]);
  add("koenigsegg-agera-rs", [["Record du monde de vitesse", "En novembre 2017, une Agera RS atteint 447,19 km/h de moyenne sur une route fermée du Nevada."]], [["Vitesse maximale", "447,19 km/h de moyenne sur deux sens, Nevada, 2017."]], ["koenigsegg-agera-r", "koenigsegg-one-1"]);
  add("koenigsegg-one-1", [["Un cheval par kilo", "Le nom One:1 vient du rapport 1 ch pour 1 kg : environ 1 360 ch pour 1 360 kg."], ["Un mégawatt", "Sa puissance dépasse un mégawatt, une première pour une voiture de série."]], [["Série limitée", "6 exemplaires (dont un prototype)."]], ["koenigsegg-agera-rs", "koenigsegg-regera"]);
  add("koenigsegg-regera", [["Sans boîte de vitesses", "La Regera n'a pas de boîte classique : le système Koenigsegg Direct Drive relie directement le moteur aux roues à haute vitesse."], ["Hybride de 1 500 ch", "Un V8 biturbo de 5,0 litres est associé à trois moteurs électriques."]], [["Série limitée", "80 exemplaires."]], ["koenigsegg-one-1", "koenigsegg-jesko"]);
  add("koenigsegg-jesko", [["Un prénom de famille", "Jesko est le prénom du père de Christian von Koenigsegg, le fondateur."], ["Des ailerons géants", "La version Attack annonce jusqu'à 1 000 kg d'appui aérodynamique."]], [["Présentation", "Salon de Genève 2019."]], ["koenigsegg-regera", "koenigsegg-gemera"]);
  add("koenigsegg-gemera", [["Une GT à quatre places", "La Gemera est la première Koenigsegg à quatre places."], ["Le « Tiny Friendly Giant »", "Son moteur central est un trois-cylindres de 2,0 litres biturbo qui développe 600 ch."]], [], ["koenigsegg-jesko"]);

  // ---- Lotus
  add("lotus-seven-series-1", [["La Lotus Seven de la série Le Prisonnier", "La Seven série 2 immatriculée KAR 120C est la voiture du héros de la série télévisée « Le Prisonnier » (1967)."], ["Une légende des circuits", "Colin Chapman voulait « simplifier, puis ajouter de la légèreté »."]], [], ["lotus-elan", "lotus-elise-s1"]);
  add("lotus-elan", [["Source d'inspiration de la MX-5", "Mazda cite l'Elan comme l'une des références de la MX-5."], ["Emma Peel", "Dans la série « Chapeau melon et bottes de cuir », Emma Peel conduit une Elan."]], [], ["lotus-seven-series-1", "lotus-esprit-s1"]);
  add("lotus-europa-series-1", [["Moteur Renault", "La première Europa utilise le moteur de la Renault 16."]], [], ["lotus-elan", "lotus-esprit-s1"]);
  add("lotus-esprit-s1", [["Dessin de Giugiaro", "La ligne en coin de l'Esprit est signée Giorgetto Giugiaro."], ["James Bond", "Dans « L'Espion qui m'aimait » (1977), une Esprit se transforme en sous-marin."]], [], ["lotus-esprit-turbo", "lotus-elan"]);
  add("lotus-esprit-turbo", [["Série Essex", "Une série spéciale de l'Esprit Turbo reprend les couleurs d'Essex, sponsor de l'écurie de Formule 1 Lotus."]], [], ["lotus-esprit-s1", "lotus-esprit-v8"]);
  add("lotus-elise-s1", [["Un châssis en aluminium collé", "Le châssis de l'Elise est constitué de profilés d'aluminium extrudés et collés."], ["Moins de 750 kg", "La première Elise pèse moins de 750 kg."]], [], ["lotus-exige-s1", "lotus-evora"]);
  add("lotus-exige-s1", [["Un Elise radicalisée", "L'Exige reprend la base de l'Elise avec un toit fixe, un aileron et un équipement allégé."]], [], ["lotus-elise-s1", "lotus-evora"]);
  add("lotus-evora", [["Quatre places", "L'Evora est la première Lotus 2+2 à moteur central."]], [], ["lotus-elise-s1", "lotus-emira"]);
  add("lotus-carlton", [["La berline la plus rapide de son époque", "La Lotus Carlton, avec son six-cylindres biturbo de 3,6 litres et 377 ch, dépasse 280 km/h en 1990."], ["Une polémique au Parlement", "Sa vitesse a fait l'objet d'une question à la Chambre des communes, au Royaume-Uni."]], [["Vitesse maximale", "Environ 283 km/h (177 mph)."]], ["lotus-omega"]);
  add("lotus-type-49", [["L'arrivée du Cosworth DFV", "La Type 49 est la première voiture équipée du V8 Cosworth DFV, qui a dominé la F1 pendant des années."]], [["Victoire dès la première course", "Jim Clark gagne le Grand Prix des Pays-Bas 1967."]], ["lotus-type-72"]);
  add("lotus-type-72", [["Une Lotus pendant six saisons", "La Type 72 a couru de 1970 à 1975."]], [["Titre pilotes 1970", "Jochen Rindt, champion à titre posthume."]], ["lotus-type-49", "lotus-type-79"]);
  add("lotus-type-79", [["Effet de sol", "La Type 79 popularise l'effet de sol en Formule 1."]], [["Titre pilotes 1978", "Mario Andretti champion du monde."], ["Titre constructeurs 1978", "Lotus remporte le championnat constructeurs."]], ["lotus-type-72"]);
  add("lotus-evija", [["Hypercar électrique", "L'Evija est la première hypercar électrique de Lotus, avec environ 2 000 ch."]], [["Série limitée", "130 exemplaires."]], ["lotus-emira"]);
  add("lotus-emira", [["La dernière Lotus thermique", "Lotus présente l'Emira comme sa dernière sportive à moteur thermique."]], [], ["lotus-evora", "lotus-evija"]);

  // ---- Maserati
  add("maserati-3500-gt", [["La première série de Maserati", "Avec la 3500 GT (1957), Maserati passe de la compétition à la production en série."]], [], ["maserati-quattroporte-i", "maserati-mistral"]);
  add("maserati-quattroporte-i", [["Quatre portes, 230 km/h", "La Quattroporte de 1963 est l'une des premières berlines de luxe à vocation sportive."]], [], ["maserati-3500-gt", "maserati-ghibli-1966"]);
  add("maserati-ghibli-1966", [["Signée Giugiaro", "Le coupé Ghibli est dessiné par Giorgetto Giugiaro, chez Ghia."], ["Le vent du Sahara", "Maserati nomme plusieurs modèles d'après des vents : Mistral, Ghibli, Bora, Khamsin, Shamal."]], [], ["maserati-bora", "maserati-khamsin"]);
  add("maserati-bora", [["Première Maserati à moteur central", "La Bora (1971) est la première Maserati de route à moteur central arrière."], ["Technologie Citroën", "Maserati, alors propriété de Citroën, utilise le système hydraulique de la marque aux chevrons."]], [], ["maserati-merak", "maserati-ghibli-1966"]);
  add("maserati-merak", [["Un V6 venu de Citroën", "Le Merak utilise le V6 de la Citroën SM, dérivé du V8 Maserati."]], [], ["maserati-bora", "maserati-khamsin"]);
  add("maserati-biturbo", [["Pionnière du biturbo", "La Biturbo (1981) est présentée comme la première voiture de série à moteur biturbo."], ["Alejandro de Tomaso", "Le projet est lancé sous la direction d'Alejandro de Tomaso, propriétaire de Maserati à l'époque."]], [], ["maserati-222-e", "maserati-shamal"]);
  add("maserati-mc12", [["12 pour douze cylindres", "MC12 vient de « Maserati Corse » et de son V12."], ["Un cousin de l'Enzo", "Elle reprend la base de la Ferrari Enzo."]], [], ["maserati-mc12-gt1", "maserati-granturismo"]);
  add("maserati-tipo-61-birdcage", [["La « cage à oiseaux »", "Le châssis tubulaire de la Tipo 61 compte environ 200 petits tubes, d'où son surnom."]], [["Nürburgring 1000 km 1960", "Victoire de Stirling Moss et Dan Gurney."]], ["maserati-300-s", "maserati-450-s"]);
  add("maserati-mc20", [["Le moteur Nettuno", "Le V6 3,0 litres de la MC20 utilise une préchambre de combustion, une technologie issue de la Formule 1."], ["Un retour en grand", "La MC20 marque en 2020 le retour de Maserati dans le monde des supercars."]], [], ["maserati-mc12", "maserati-granturismo-ii"]);

  // ---- Lamborghini
  add("lamborghini-350-gt", [["La première Lamborghini", "La 350 GT (1964) est la première voiture de série de la marque, fondée en 1963."], ["Une légende de tracteurs", "Ferruccio Lamborghini fabriquait des tracteurs. La légende raconte qu'un différend avec Enzo Ferrari l'a poussé à construire ses propres voitures."]], [], ["lamborghini-miura-p400"]);
  add("lamborghini-miura-p400", [["Un nom de taureau", "La Miura rend hommage à l'éleveur de taureaux de combat Don Eduardo Miura."], ["Le premier moteur central de route", "Son V12 transversal est installé à l'arrière du conducteur, une première sur une voiture de route."], ["L'Italian Job", "Une Miura orange ouvre le film « L'Or se barre » (1969)."]], [["Présentation", "Salon de Genève 1966."]], ["lamborghini-countach-lp400", "lamborghini-350-gt"]);
  add("lamborghini-countach-lp400", [["Un cri d'étonnement", "En piémontais, « countach » exprime la surprise ou l'admiration."], ["Portes à ouverture en élytre", "La Countach popularise les portes à ouverture verticale sur les supercars."]], [], ["lamborghini-miura-p400", "lamborghini-diablo"]);
  add("lamborghini-lm002", [["« Rambo Lambo »", "Le LM002 est un tout-terrain à moteur V12 de Countach, surnommé Rambo Lambo."]], [], ["lamborghini-urus", "lamborghini-countach-lp400"]);
  add("lamborghini-diablo", [["Un taureau célèbre", "Le nom vient d'un taureau de combat du XIXe siècle, connu pour sa bravoure."]], [], ["lamborghini-countach-lp400", "lamborghini-murcielago"]);
  add("lamborghini-murcielago", [["Un taureau épargné", "Murciélago est un taureau qui, selon la légende, a survécu à 24 coups d'épée et a été gracié en 1879."]], [], ["lamborghini-diablo", "lamborghini-gallardo"]);
  add("lamborghini-gallardo", [["Une race de taureaux", "Gallardo est le nom d'une des cinq lignées historiques de taureaux de combat espagnols."], ["La Lamborghini la plus vendue", "Avec environ 14 000 exemplaires, la Gallardo a été la Lamborghini la plus produite de son époque."]], [], ["lamborghini-murcielago", "lamborghini-huracan-lp610-4"]);
  add("lamborghini-aventador-lp700-4", [["Un taureau de Saragosse", "Aventador est le nom d'un taureau récompensé pour son courage dans l'arène de Saragosse, en 1993."], ["Un monocoque en carbone", "Sa cellule centrale est entièrement en fibre de carbone."]], [], ["lamborghini-murcielago", "lamborghini-veneno"]);
  add("lamborghini-veneno", [["Neuf roadsters", "Le Veneno est produit pour fêter les 50 ans de la marque : 3 coupés et 9 roadsters."]], [["Série limitée", "3 coupés et 9 roadsters."]], ["lamborghini-aventador-lp700-4", "lamborghini-centenario"]);
  add("lamborghini-urus", [["Le premier super-SUV", "L'Urus est présenté comme le premier « Super Sport Utility Vehicle » de Lamborghini."], ["L'aurochs", "Urus est le nom latin de l'aurochs, ancêtre sauvage des bovins."]], [], ["lamborghini-lm002", "lamborghini-huracan-lp610-4"]);
  add("lamborghini-huracan-lp610-4", [["Un taureau célèbre", "Huracán est un taureau de combat espagnol du XIXe siècle."]], [], ["lamborghini-gallardo", "lamborghini-revuelto"]);
  add("lamborghini-revuelto", [["V12 hybride", "La Revuelto est la première Lamborghini de série à moteur V12 hybride rechargeable."]], [], ["lamborghini-aventador-lp700-4", "lamborghini-huracan-lp610-4"]);

  // ---- Aston Martin
  add("aston-martin-db5", [["La voiture de James Bond", "La DB5 apparaît dans « Goldfinger » (1964) avec ses gadgets, dont le siège éjectable."]], [], ["aston-martin-db4", "aston-martin-db6"]);
  add("aston-martin-db4", [["La carrosserie Superleggera", "La DB4 reprend la technique des tubes fins recouverts d'aluminium de la carrozzeria Touring."]], [], ["aston-martin-db5"]);
  add("aston-martin-db3s", [["Une voiture de course d'usine", "La DB3S a couru aux 24 Heures du Mans et en championnat du monde des voitures de sport dans les années 1950."]], [], ["lm-aston-dbr1"]);
  add("lm-aston-dbr1", [["Le Mans 1959", "L'Aston Martin DBR1 de Roy Salvadori et Carroll Shelby gagne les 24 Heures du Mans 1959."]], [["24 Heures du Mans", "Victoire en 1959."]], ["aston-martin-db3s"]);
  add("aston-martin-vulcan", [["Pour la piste uniquement", "La Vulcan est une série limitée à 24 exemplaires, non homologuée pour la route."]], [], ["aston-martin-one-77", "aston-martin-valkyrie"]);
  add("aston-martin-one-77", [["Série limitée", "77 exemplaires, avec un V12 atmosphérique de 7,3 litres."]], [], ["aston-martin-vulcan", "aston-martin-valkyrie"]);
  add("aston-martin-valkyrie", [["Signée Adrian Newey", "La Valkyrie est conçue en collaboration avec Red Bull Racing et Adrian Newey."], ["Un V12 Cosworth", "Son V12 atmosphérique de 6,5 litres, développé avec Cosworth, atteint des régimes très élevés."]], [], ["aston-martin-one-77", "aston-martin-valhalla"]);
  add("aston-martin-db11", [["Premier moteur biturbo", "La DB11 est la première Aston Martin de série équipée d'un V12 biturbo."]], [], ["aston-martin-db9", "aston-martin-db12"]);

  // ---- Ferrari
  add("ferrari-250-gto", [["Un trophée de collectionneur", "La 250 GTO est l'une des voitures les plus chères du monde : un exemplaire a dépassé les 48 millions de dollars aux enchères en 2018."], ["GTO", "GTO signifie Gran Turismo Omologato : la voiture était homologuée en catégorie GT."]], [["Production", "Environ 36 exemplaires (1962-1964)."]], ["ferrari-f40", "ferrari-288-gto"]);
  add("ferrari-f40", [["La dernière voulue par Enzo", "La F40 est la dernière Ferrari que le Commendatore ait pu voir présentée de son vivant, en 1987."], ["Plus de 200 mph", "Elle est la première Ferrari de série à franchir les 320 km/h."]], [["Présentation", "1987, pour les 40 ans de la marque."]], ["ferrari-288-gto", "ferrari-f50"]);
  add("ferrari-enzo", [["Un nom de fondateur", "La Enzo porte le prénom d'Enzo Ferrari, fondateur de la marque."], ["Série limitée", "399 exemplaires, puis une 400e voiture construite pour le pape Jean-Paul II et vendue aux enchères au profit d'œuvres caritatives."]], [], ["ferrari-f50", "ferrari-laferrari"]);
  add("ferrari-testarossa", [["Les « têtes rouges »", "Testarossa signifie « tête rouge », en référence aux culasses peintes en rouge."], ["Miami Vice", "Une Testarossa blanche apparaît dans la série « Deux flics à Miami »."]], [], ["ferrari-512-bb", "ferrari-f40"]);
  add("ferrari-laferrari", [["Hybride de plus de 900 ch", "La LaFerrari est la première Ferrari de série à système hybride HY-KERS."], ["Série limitée", "499 exemplaires."]], [], ["ferrari-enzo", "ferrari-sf90-stradale"]);

  MAKIT.enrich(m);
})();
