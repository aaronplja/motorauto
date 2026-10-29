/** MOTORAUTO — compléments Le Mans (1970-2026) : couple, vitesse de pointe, 0 à 100 (valeurs de référence), histoire, anecdotes, palmarès. */
(function () {
  "use strict";
  const m = {};
  const add = (id, e, h, a, r, rel) => { m["lm-" + id] = { e: [e], h, a: a || [], r: r || [], rel: (rel || []).map((x) => "lm-" + x), ap: true }; };

  add("porsche-917k", [530, 360, 3.5],
    "Porsche présente la 917 en 1969 avec un flat-12 de 4,5 litres refroidi par air, dessiné par Hans Mezger et Ferdinand Piëch. Les premières voitures sont instables à haute vitesse ; la version K (Kurzheck, « queue courte »), mise au point avec l'aide de John Wyer et de l'équipe Gulf, corrige ces défauts. Porsche Salzburg remporte la première victoire de Porsche au classement général en 1970 avec Richard Attwood et Hans Herrmann, dans une édition marquée par la pluie et les accidents.\n\nEn 1971, Helmut Marko et Gijs van Lennep gagnent avec la 917 K Martini : 5 335 km en 24 heures, soit une moyenne de plus de 222 km/h. Ce record de distance ne sera battu qu'en 2010. Les règles changent ensuite pour 1972 et la 917 quitte l'endurance, mais elle domine la Can-Am avec des versions turbocompressées de plus de 1 000 ch.",
    [["Steve McQueen et « Le Mans »", "Le film de 1971 a été tourné pendant l'édition 1970 ; la Porsche 917 bleu et orange de Gulf y est la vedette."]],
    [["Distance", "5 335,3 km en 1971, record resté invaincu jusqu'en 2010."], ["Première victoire Porsche", "1970 : début des 19 victoires de Porsche au Mans."]], ["porsche-936", "ford-gt40"]);

  add("porsche-917lh", [530, 390, 3.5],
    "La 917 LH (Langheck, « queue longue ») est une 917 K dont la carrosserie a été allongée pour réduire la traînée sur la ligne droite des Hunaudières, longue de plus de 6 km. En 1969 et 1970, les premières versions sont engagées par l'usine . Les pilotes parlent d'une voiture instable, à la tenue de route difficile en courbe mais fulgurante en ligne droite.\n\nLes 917 à queue longue atteignent près de 390 km/h dans les Hunaudières selon les sources. Une première chicane est ajoutée à la ligne droite en 1972 pour limiter ces vitesses.",
    [["Le mur des 400", "À l'époque, on parlait déjà d'une barre des 400 km/h pour les prototypes sur la ligne droite."]],
    [["Vitesse de pointe", "Environ 390 km/h selon les sources."]], ["porsche-917k"]);

  add("matra-ms670", [350, 330, 4],
    "Matra, entreprise d'armement et d'aéronautique, entre en compétition automobile avec le soutien d'Elf et de Simca. La MS670, mue par un V12 de 3 litres conçu par Georges Martin, est la voiture qui lui donne enfin la victoire en 1972, avec Henri Pescarolo et Graham Hill. Matra s'impose à nouveau en 1973 (MS670B) et en 1974 (MS670C) avec Pescarolo et Gérard Larrousse. Les trois années de victoire sont acquises face à des Ferrari 312 PB et des Alfa Romeo.\n\nGraham Hill avait déjà gagné Monaco (cinq fois) et les 500 Miles d'Indianapolis (1966) : le Mans 1972 lui offre la « Triple Couronne », qu'aucun autre pilote n'a depuis obtenue.",
    [["La Triple Couronne", "Graham Hill reste le seul pilote à avoir gagné Monaco, Indianapolis et Le Mans."], ["Pescarolo, quatre victoires", "Henri Pescarolo a gagné Le Mans quatre fois : 1972, 1973, 1974 et 1984."]],
    [["Palmarès", "Trois victoires consécutives (1972, 1973, 1974)."]], ["porsche-936"]);

  add("mirage-gr8", [350, 330, 3.9],
    "La Mirage GR8 est la voiture de l'équipe Gulf Research Racing (John Wyer), équipée du V8 Cosworth DFV de la Formule 1. Peu puissant pour l'endurance, mais très économe, il permet à la Mirage de s'arrêter moins souvent que ses concurrentes. Derek Bell et Jacky Ickx l'emportent en 1975,.\n\nPour Jacky Ickx, c'est la deuxième victoire au Mans après 1969. La GR8 est la seule voiture de ce type à avoir gagné avec un moteur de F1 de série.",
    [["Un moteur de F1 en endurance", "Le DFV, prévu pour des courses de 2 heures, a tenu 24 heures sur la Mirage."]],
    [["Palmarès", "Victoire en 1975, deuxième du Belge Jacky Ickx."]], ["rondeau-m379"]);

  add("porsche-936", [450, 330, 3.7],
    "Pour 1976, Porsche abandonne la 917 et construit la 936, une barquette légère, au flat-6 de 2,1 litres turbocompressé (coefficient 1,4 pour la cylindrée). Elle gagne dès 1976 avec Jacky Ickx et Gijs van Lennep. En 1977, la 936/77 d'Ickx, Barth et Haywood remonte spectaculairement après un problème moteur et l'emporte. En 1981, la 936/81 est ressuscitée avec Ickx et Derek Bell : les deux hommes l'emportent sans grande difficulté. Ickx en est alors à cinq victoires, un record à l'époque ; il en ajoutera une sixième en 1982 avec la 956.\n\nIckx est ainsi surnommé « Monsieur Le Mans ». Il sera dépassé plus tard par Tom Kristensen.",
    [["Six victoires pour Ickx", "Jacky Ickx a gagné Le Mans en 1969, 1975, 1976, 1977, 1981 et 1982."], ["Cinq cylindres seulement", "En 1977, la voiture d'Ickx a roulé un temps avec un cylindre en moins avant de remonter au classement et de gagner."]],
    [["Palmarès", "Trois victoires : 1976, 1977, 1981."]], ["porsche-956", "porsche-917k"]);

  add("alpine-a442b", [420, 340, 3.8],
    "Après des échecs dans les années 1970, Renault Sport mise sur un V6 turbo de 2 litres développé à Viry-Châtillon. L'Alpine A442B, à cockpit fermé, est engagée en 1978. Didier Pironi et Jean-Pierre Jaussaud gagnent devant la Porsche 936 de Wollek et Ickx. La victoire est la première d'un moteur turbocompressé français, et lance la carrière de Renault en Formule 1 avec le même moteur turbo.\n\nCette victoire de 1978 donne à Renault la reconnaissance de l'expertise du turbo.",
    [["Le turbo de Viry", "Le moteur turbo de l'A442B a servi de base au programme F1 de Renault, lancé en 1977."]],
    [["Palmarès", "Victoire en 1978, première d'un moteur turbo français."]], ["rondeau-m379"]);

  add("porsche-935", [630, 340, 3.3],
    "La Porsche 935 est la 911 Turbo transformée pour le règlement du Groupe 5 (voitures « silhouette »). La version K3 de l'écurie Kremer, dotée d'un flat-6 de 3 litres turbo de plus de 700 ch, gagne en 1979 avec Klaus Ludwig et les frères Don et Bill Whittington. Les deux Américains avaient financé l'engagement ; ils seront plus tard condamnés pour trafic de drogue.\n\nLa 935 a gagné plus de 100 courses au niveau international et reste la voiture de course dérivée d'une voiture de route la plus titrée de sa génération.",
    [["Une victoire inattendue", "En 1979, la Kremer K3 gagne devant la Porsche 936 officielle."]],
    [["Palmarès", "Victoire en 1979, avec Klaus Ludwig et les frères Whittington."]], ["porsche-956"]);

  add("rondeau-m379", [350, 320, 4],
    "Jean Rondeau, pilote et constructeur sarthois, crée sa propre équipe. La Rondeau M379B est équipée d'un Cosworth DFV de 3 litres. Rondeau et Jean-Pierre Jaussaud gagnent le Mans 1980, devant une Porsche. C'est la seule voiture de course portant le nom de son constructeur à avoir gagné Le Mans, ce qui reste unique.\n\nJean Rondeau est mort accidentellement en 1985 ; sa marque a disparu.",
    [["Un petit artisan", "Jean Rondeau a battu les grands constructeurs avec une équipe de quelques personnes basée près du circuit."]],
    [["Palmarès", "Victoire en 1980 : le constructeur gagne avec sa propre voiture."]], ["mirage-gr8"]);

  add("porsche-956", [650, 360, 3.2],
    "Pour 1982, la FIA introduit le Groupe C, qui limite la consommation de carburant. Porsche présente la 956, conçue sous la direction de Norbert Singer, dotée d'un monocoque en aluminium, d'un effet de sol et d'un flat-6 turbo de 2,65 litres. Elle gagne dès 1982 (Ickx/Bell) et domine ensuite : 1983 (Schuppan/Holbert/Haywood), 1984 (Pescarolo/Ludwig), 1985 (Ludwig/Barilla/Winter, ce dernier étant un pseudonyme).\n\nLa 956 a également été fournie à des équipes clientes, ce qui a permis un des plus grands plateaux de voitures identiques de l'histoire du Mans.",
    [["Un pseudonyme", "« John Winter » était le nom de course de Louis Krages, un pilote allemand."], ["Bell et Ickx", "Le duo Derek Bell / Jacky Ickx a conduit la première 956 victorieuse."]],
    [["Palmarès", "Quatre victoires consécutives (1982-1985)."]], ["porsche-962c"]);

  add("porsche-962c", [700, 360, 3.1],
    "La 962 est la 956 rallongée pour que les pieds du pilote se trouvent derrière l'axe des roues avant, afin de respecter les nouvelles règles de sécurité de l'IMSA. Elle est équipée d'un flat-6 turbo de 3 litres ; la version Le Mans, la 962 C, gagne en 1986 et 1987 avec Hans-Joachim Stuck, Derek Bell et Al Holbert. La voiture reste compétitive jusqu'au milieu des années 1990, au point de gagner en 1994 sous le nom de Dauer 962 Le Mans.\n\nLa 962 a gagné de nombreuses épreuves aux États-Unis, où elle a été la voiture à battre pendant plus de dix ans.",
    [["Une voiture, dix ans de carrière", "La 962 a couru de 1984 à 1994 environ, de l'IMSA aux championnats japonais."]],
    [["Palmarès", "Victoires en 1986 et 1987 (usine), puis 1994 (Dauer)."]], ["porsche-956", "dauer-962"]);

  add("jaguar-xjr9", [790, 370, 3.2],
    "Pour battre Porsche, Tom Walkinshaw (TWR) développe pour Jaguar une série de voitures de Groupe C dotées d'un V12 de 7 litres. La XJR-9LM gagne en 1988 avec Jan Lammers, Johnny Dumfries et Andy Wallace : c'est la première victoire de Jaguar depuis 1957. Elle devance les Porsche 962. En 1990, la XJR-12 s'impose à son tour.\n\nLa victoire de 1988 est restée comme l'un des grands moments du sport automobile britannique de l'époque.",
    [["Jaguar, le retour", "Après 31 ans d'absence, la victoire de 1988 a été célébrée comme un événement national au Royaume-Uni."], ["Dumfries, noble pilote", "Johnny Dumfries est le marquis de Bute, un aristocrate écossais."]],
    [["Palmarès", "Victoire en 1988, la première de Jaguar depuis 1957."]], ["jaguar-xjr12"]);

  add("sauber-c9", [770, 380, 3.1],
    "Sauber, petite équipe suisse, construit avec le soutien de Mercedes la C9 à V8 biturbo de 5 litres. La voiture en livrée argent, comme les anciennes « flèches d'argent », gagne le Mans 1989 avec Jochen Mass, Manuel Reuter et Stanley Dickens, devant les Jaguar et les Porsche.\n\nLe Mans 1989 marque le retour de Mercedes dans la course après 1955. À la fin des années 1980, les prototypes dépassent 380 km/h dans la ligne droite des Hunaudières, ce qui conduit les organisateurs à y installer deux chicanes en 1990.",
    [["Des chicanes pour ralentir", "Les vitesses atteintes à la fin des années 1980 ont conduit à couper la ligne droite par deux chicanes en 1990."]],
    [["Palmarès", "Victoire en 1989, la première de Mercedes depuis 1952."]], ["sauber-c11"]);

  add("sauber-c11", [780, 390, 3.1],
    "La C11 est l'évolution de la C9. Mercedes y fait rouler de jeunes pilotes de son programme junior (Michael Schumacher, Karl Wendlinger, Heinz-Harald Frentzen) dans le championnat des voitures de sport. Schumacher dispute Le Mans en 1991 avec Sauber-Mercedes et termine 5e. La C11 ne gagne pas au Mans.\n\nLes voitures de cette époque sont rapides : en 1988, la WM-Peugeot P88 a été chronométrée à 405 km/h dans la ligne droite.",
    [["405 km/h", "Le record de vitesse en ligne droite revient à la WM-Peugeot, mesurée à 405 km/h dans les Hunaudières en 1988."]],
    [], ["sauber-c9"]);

  add("jaguar-xjr12", [790, 370, 3.2],
    "La XJR-12 de 1990 est une évolution de la XJR-9, avec un V12 de 7 litres. Elle gagne le Mans 1990 avec Martin Brundle, John Nielsen et Price Cobb, devant une autre Jaguar. Deux chicanes viennent d'être ajoutées à la ligne droite des Hunaudières : les vitesses de pointe baissent.\n\nC'est la septième et dernière victoire de Jaguar au Mans.",
    [["Les chicanes des Hunaudières", "Les deux chicanes ajoutées en 1990 ont coupé la ligne droite de six kilomètres en trois tronçons."]],
    [["Palmarès", "Victoire en 1990 : septième et dernière de Jaguar."]], ["jaguar-xjr9"]);

  add("mazda-787b", [620, 340, 3.5],
    "Mazda s'engage au Mans depuis 1970 avec des moteurs rotatifs. La 787B, à moteur R26B à quatre rotors, est la dernière évolution, légère (830 kg) et très économe. Elle gagne en 1991 avec Volker Weidler, Johnny Herbert et Bertrand Gachot, devant les Jaguar et Mercedes. Mazda devient le premier constructeur japonais et asiatique à gagner Le Mans, et la seule marque à avoir gagné avec un moteur rotatif.\n\nLes moteurs rotatifs sont interdits dès 1992 par le nouveau règlement. Johnny Herbert, épuisé, a dû être porté sur le podium.",
    [["Herbert porté sur le podium", "À l'arrivée, Johnny Herbert était à bout de forces, à cause de la chaleur et du manque d'hydratation, et a dû être soutenu pour monter sur le podium."], ["Le son du R26B", "Le cri du moteur à quatre rotors, qui montait à 9 000 tr/min, est resté célèbre."]],
    [["Palmarès", "Victoire en 1991, seule d'un moteur rotatif et d'un constructeur japonais avant Toyota en 2018."]], ["peugeot-905"]);

  add("peugeot-905", [650, 350, 3.2],
    "Peugeot Talbot Sport, dirigé par Jean Todt, développe la 905 avec un V10 de 3,5 litres, comme en Formule 1. La voiture gagne le championnat du monde des voitures de sport en 1992 et remporte Le Mans en 1992 (Warwick, Dalmas, Blundell) et 1993 (Brabham, Bouchut, Hélary), avec un triplé en 1993. Le moteur de la 905 est d'abord une base pour la future entrée en F1 de Peugeot, qui se fera avec McLaren en 1994 puis Jordan.\n\nJean Todt, ensuite directeur de Ferrari et président de la FIA, a fait ses débuts de patron d'écurie chez Peugeot.",
    [["Todt avant Ferrari", "Jean Todt a quitté Peugeot Sport pour Ferrari en 1993 ; le triplé de 1993 est son dernier fait d'armes chez Peugeot."], ["Un triplé en 1993", "Les trois premières places en 1993 sont toutes pour la Peugeot 905."]],
    [["Palmarès", "Victoires en 1992 et 1993."]], ["peugeot-908"]);

  add("dauer-962", [700, 340, 3.3],
    "Jochen Jochen Dauer transforme des 962 en voitures de route : la Dauer 962 Le Mans est ainsi admise en catégorie GT en 1994, grâce à une faille du règlement. La voiture de Yannick Dalmas, Hurley Haywood et Mauro Baldi gagne devant une Toyota qui menait et a perdu du temps en fin de course.\n\nLe règlement a ensuite été modifié pour fermer cette faille.",
    [["Une faille réglementaire", "Le règlement GT 1994 permettait d'engager une voiture de course immatriculée, ce que Dauer a exploité."]],
    [["Palmarès", "Victoire en 1994, la dernière d'une Porsche 962."]], ["porsche-962c"]);

  add("mclaren-f1-gtr", [650, 320, 3.4],
    "La McLaren F1, dessinée par Gordon Murray, est la supercar la plus rapide du monde en 1993 avec 391 km/h, grâce à son V12 BMW de 6,1 litres. Elle n'est pas prévue pour la course, mais des équipes clientes demandent une version de compétition : la F1 GTR, engagée en 1995 par plusieurs écuries, dont Kokusai Kaihatsu Racing, au Mans. Dalmas, Lehto et Sekiya gagnent en 1995, devant d'autres F1 GTR, sous la pluie.\n\nLa F1 GTR monte ensuite en puissance dans le Championnat du monde GT.",
    [["Une voiture de route victorieuse", "Gordon Murray n'avait pas pensé la F1 pour la course : sa victoire dès la première participation est devenue un modèle du genre."]],
    [["Palmarès", "Victoire en 1995, dès sa première participation, avec quatre F1 GTR dans les cinq premières."]], ["porsche-911-gt1-98"]);

  add("tws-porsche-wsc95", [650, 340, 3.2],
    "En 1996, Joest Racing, avec le soutien de TWR, aligne un prototype ouvert, la TWR-Porsche WSC-95, dont le châssis dérive de celui d'une Jaguar XJR-14 et le moteur d'une 962 : flat-6 turbo de 3 litres. Manuel Reuter, Davy Jones et Alexander Wurz gagnent en 1996, Michele Alboreto, Stefan Johansson et Tom Kristensen en 1997. Cette voiture est un cas rare où une équipe privée l'emporte avec une voiture hybride de chassis et de moteur d'origines différentes.\n\nPour Tom Kristensen, c'est la première victoire d'une série de neuf.",
    [["Premier Mans de Kristensen", "Tom Kristensen, dont c'est le premier succès en 1997, gagnera au total neuf fois."]],
    [["Palmarès", "Victoires en 1996 et 1997."]], ["porsche-911-gt1-98"]);

  add("porsche-911-gt1-98", [650, 330, 3.3],
    "La 911 GT1-98 de 1998 est un prototype caché sous la silhouette d'une 911 ; elle emploie un monocoque en carbone et un flat-6 turbo de 3,2 litres, refroidi par eau. Allan McNish, Stéphane Ortelli et Laurent Aïello l'emportent, pour la 16e victoire de Porsche. C'est la dernière victoire d'une Porsche au classement général avant celle de 2015.\n\nLa voiture inspire une version de route, la 911 GT1 Strassenversion, à 25 exemplaires.",
    [["Une 911 qui n'en est pas une", "Seule la face avant ressemble à celle d'une 911 ; le moteur est derrière le pilote, comme sur une 911, mais la structure est un prototype."]],
    [["Palmarès", "16e victoire de Porsche, en 1998."]], ["porsche-956"]);

  add("bmw-v12-lmr", [700, 340, 3.3],
    "BMW, associé à Williams, construit en 1999 la V12 LMR, un prototype ouvert à V12 de 6 litres. L'équipage Yannick Dalmas, Joachim Winkelhock et Pierluigi Martini gagne le Mans 1999 devant la Toyota. C'est la première (et unique) victoire de BMW au classement général de l'épreuve.\n\nBMW se retire ensuite de l'endurance pour se concentrer sur la Formule 1 avec Williams.",
    [["Un V12 pour deux", "Le V12 LMR dérive d'un moteur conçu pour le projet BMW de la McLaren F1."]],
    [["Palmarès", "Victoire en 1999, la seule de BMW au classement général."]], ["mercedes-clr"]);

  add("mercedes-clr", [600, 340, 3.4],
    "La Mercedes-Benz CLR de 1999 est un prototype fermé conçu pour remplacer la CLK-LM. En 1999, trois voitures s'engagent. Mark Webber décolle en qualification puis lors du warm-up, et Peter Dumbreck décolle en course, l'avant de la voiture se soulevant en bout de ligne droite. Mercedes retire la dernière voiture et abandonne l'endurance.\n\nLes accidents ont conduit la FIA à revoir ses règles d'aérodynamique et à limiter les longueurs de ligne droite.",
    [["Webber dans les airs", "Mark Webber, futur pilote de F1, a connu deux envols avant la course en 1999."], ["Dumbreck, un envol dans la forêt", "Peter Dumbreck a été propulsé hors de la piste et a atterri dans les bois."]],
    [], ["bmw-v12-lmr"]);

  add("toyota-gt-one", [650, 340, 3.3],
    "Toyota Team Europe, à Cologne, construit la GT-One (TS020), un prototype à V8 turbo de 3,6 litres, dont le profil est dérivé de la GT1. En 1999, elle semble devoir gagner : une GT-One mène la course avant de perdre du temps à cause d'un pneu éclaté, et la GT-One n°3 de Brundle, Collard et Sospiri finit deuxième.\n\nToyota abandonne en 1999 et attendra 2018 pour sa première victoire au Mans.",
    [["19 ans d'attente", "Toyota a dû attendre 2018 pour gagner enfin Le Mans."]],
    [["Meilleur résultat", "2e place en 1999."]], ["toyota-ts050"]);

  add("audi-r8-lmp", [750, 340, 3.2],
    "Audi s'engage en 1999 avec la R8R, puis la R8 de 2000, un prototype ouvert développé par Audi Sport sous la direction de Wolfgang Ullrich avec l'équipe Joest, à moteur V8 biturbo de 3,6 litres à injection directe FSI. Ses résultats sont impressionnants : une victoire à chaque participation de l'usine. En 2000, 2001 et 2002, Frank Biela, Tom Kristensen et Emanuele Pirro l'emportent. En 2004 (Ara, Capello, Kristensen) et en 2005 (Kristensen, Capello, Lehto), la R8 gagne encore.\n\nLa R8 de 2000 ouvre l'ère Audi, qui comptera treize victoires entre 2000 et 2014.",
    [["13 victoires", "Audi a gagné treize fois Le Mans entre 2000 et 2014."], ["Tom Kristensen", "Neuf victoires entre 1997 et 2013, un record absolu."]],
    [["Palmarès", "Cinq victoires : 2000, 2001, 2002, 2004, 2005."]], ["audi-r10-tdi"]);

  add("bentley-speed-8", [750, 340, 3.2],
    "Bentley, dans le groupe Volkswagen, revient au Mans en 2001 avec l'Exp Speed 8 et gagne en 2003 avec la Speed 8, un prototype dérivé de l'Audi R8 avec un V8 biturbo de 4 litres. Tom Kristensen, Rinaldo Capello et Guy Smith l'emportent. C'est la première victoire de Bentley depuis 1930, après 73 ans.\n\nLa marque se retire ensuite pour laisser Audi courir seule.",
    [["73 ans après", "Une Bentley n'avait pas gagné depuis les Bentley Boys de 1930."]],
    [["Palmarès", "Victoire en 2003 : 6e de Bentley."]], ["bentley-speed-six"]);

  add("audi-r10-tdi", [1100, 330, 3.3],
    "L'Audi R10 TDI est le premier prototype à moteur diesel à gagner Le Mans. Son V12 TDI biturbo de 5,5 litres dégage plus de 1 000 Nm de couple. En 2006, Frank Biela, Emanuele Pirro et Marco Werner l'emportent. En 2007, ils gagnent à nouveau, devant la Peugeot 908 HDi. En 2008, Rinaldo Capello, Tom Kristensen et Allan McNish s'imposent, après un duel contre Peugeot.\n\nLe diesel permet de rouler plus longtemps entre deux arrêts, et la R10 impose le diesel en compétition.",
    [["Premier diesel", "Le Mans 2006 a vu la première victoire d'un moteur diesel."], ["Peugeot comme rival", "La rivalité Audi / Peugeot a donné lieu à des courses très disputées en 2007, 2008 et 2009."]],
    [["Palmarès", "Trois victoires consécutives : 2006, 2007, 2008."]], ["audi-r15-tdi", "peugeot-908"]);

  add("peugeot-908", [1200, 340, 3.3],
    "Peugeot s'engage dans l'endurance diesel en 2007 avec la 908 HDi FAP, à moteur V12 de 5,5 litres. En 2009, après deux défaites face à Audi, Marc Gené, David Brabham et Alexander Wurz l'emportent devant les deux autres Peugeot. C'est la troisième victoire de la marque, 16 ans après la dernière.\n\nPeugeot se retire de l'endurance en 2012 pour des raisons financières.",
    [["Revanche sur Audi", "Peugeot avait fini deuxième en 2007 et en 2008."], ["Brabham, père et fils", "David Brabham est le fils de Jack Brabham, triple champion du monde de F1."]],
    [["Palmarès", "Victoire en 2009."]], ["audi-r10-tdi", "peugeot-9x8"]);

  add("audi-r15-tdi", [1050, 330, 3.3],
    "L'Audi R15 TDI plus, à V10 TDI biturbo de 5,5 litres, s'engage en 2010 contre les Peugeot 908. Timo Bernhard, Romain Dumas et Mike Rockenfeller l'emportent et signent un record de distance : 5 410,7 km, soit 397 tours. Ce chiffre bat le record établi en 1971 par la Porsche 917 K de Marko et van Lennep.\n\nEn 2011, Audi passe à la R18 TDI, plus compacte.",
    [["Plus loin que la 917", "Le record de distance de 1971 est tombé en 2010 après 39 ans."]],
    [["Distance", "5 410,7 km, record absolu de l'épreuve (397 tours)."]], ["porsche-917k", "audi-r18-tdi"]);

  add("audi-r18-tdi", [850, 330, 3.3],
    "Pour 2011, Audi abandonne le V10 pour un V6 TDI de 3,7 litres, dans un coupé fermé : la R18 TDI. Marcel Fässler, André Lotterer et Benoît Tréluyer gagnent d'une courte tête contre la Peugeot 908 de Sébastien Bourdais, Pedro Lamy et Simon Pagenaud, avec un écart de 13,8 secondes, l'un des plus faibles de l'histoire. La course est marquée par l'accident de Allan McNish dès le début.\n\nLa R18 est la première Audi à adopter un V6.",
    [["McNish contre le mur", "Allan McNish a subi un violent accident en début de course, mais est sorti indemne."], ["13,8 secondes d'écart", "Le plus petit écart à l'arrivée de l'ère moderne."]],
    [["Palmarès", "Victoire en 2011."]], ["audi-r18-e-tron"]);

  add("audi-r18-e-tron", [850, 330, 3.0],
    "L'Audi R18 e-tron quattro, qui associe un V6 TDI de 4 litres à un moteur électrique sur les roues avant, est le premier hybride à gagner Le Mans, en 2012 (Fässler, Lotterer, Tréluyer). En 2013, Tom Kristensen, Loïc Duval et Allan McNish l'emportent pour la 12e victoire d'Audi ; c'est la neuvième et dernière victoire de Kristensen. En 2014, Fässler, Lotterer et Tréluyer gagnent à nouveau pour la 13e.\n\nLe système hybride récupère de l'énergie au freinage et la restitue en accélération à l'avant, créant une transmission intégrale temporaire.",
    [["Kristensen, le roi du Mans", "Neuf victoires en seize participations pour le Danois."], ["Une quattro d'un nouveau genre", "Le nom « e-tron quattro » vient de la transmission intégrale temporaire créée par l'hybride."]],
    [["Palmarès", "Trois victoires : 2012, 2013, 2014."]], ["audi-r18-tdi", "porsche-919"]);

  add("porsche-919", [700, 340, 2.5],
    "Porsche revient en catégorie reine en 2014 avec la 919 Hybrid, à moteur V4 de 2 litres turbo plus deux systèmes de récupération d'énergie. La voiture n°19 de Nico Hülkenberg, Earl Bamber et Nick Tandy gagne en 2015, 17 ans après la dernière victoire de Porsche. En 2016, la n°2 de Romain Dumas, Neel Jani et Marc Lieb s'impose dans les dernières minutes, quand la Toyota n°5, qui menait, tombe en panne à 3 minutes de l'arrivée. En 2017, la n°2 de Timo Bernhard, Earl Bamber et Brendon Hartley gagne.\n\nPorsche quitte la catégorie fin 2017 après trois victoires consécutives, pour se tourner vers la Formule E.",
    [["Hülkenberg, vainqueur surprise", "Nico Hülkenberg, pilote de F1, a gagné Le Mans à sa première participation."], ["Le drame de Toyota", "En 2016, la Toyota n°5 s'arrête sur la ligne droite à 3 minutes de la victoire."]],
    [["Palmarès", "Trois victoires : 2015, 2016, 2017 ; 17e, 18e et 19e de Porsche."]], ["toyota-ts050", "audi-r18-e-tron"]);

  add("toyota-ts050", [650, 340, 2.5],
    "La TS050 Hybrid de Toyota associe un V6 turbo de 2,4 litres à un système hybride de 8 MJ. En 2016, elle perd la victoire à 3 minutes de l'arrivée. En 2018, avec le départ de Porsche, la n°8 de Sébastien Buemi, Kazuki Nakajima et Fernando Alonso gagne enfin. Elle gagne encore en 2019, puis en 2020 avec Brendon Hartley à la place d'Alonso.\n\nAlonso, double champion du monde de F1, ajoute Le Mans à son palmarès.",
    [["Alonso à Le Mans", "Fernando Alonso a gagné en 2018 puis en 2019, avant de quitter Toyota."]],
    [["Palmarès", "Trois victoires consécutives : 2018, 2019, 2020."]], ["porsche-919", "toyota-gr010"]);

  add("toyota-gr010", [680, 340, 2.5],
    "La Toyota GR010 Hybrid est la première hypercar de la nouvelle catégorie introduite en 2021, avec un V6 biturbo de 3,5 litres plus un moteur électrique avant. Elle gagne en 2021 avec Mike Conway, Kamui Kobayashi et José María López, puis en 2022 avec Sébastien Buemi, Brendon Hartley et Ryō Hirakawa. Les victoires sont acquises face à des Alpine et des Glickenhaus ; un règlement d'équivalence (BoP) ajuste les performances des voitures.\n\nEn 2023, Toyota est battue par la Ferrari 499P.",
    [["Le règlement BoP", "Le Balance of Performance égalise les voitures grâce à un handicap de poids et de puissance, ajusté par les organisateurs."]],
    [["Palmarès", "Deux victoires : 2021 et 2022."]], ["toyota-ts050", "ferrari-499p"]);

  add("ferrari-499p", [680, 340, 2.6],
    "Pour le centenaire des 24 Heures, Ferrari revient en catégorie reine, avec la 499P. La voiture est mue par un V6 biturbo de 3 litres et un moteur électrique sur l'essieu avant. La n°51 de Pier Guidi, Calado et Giovinazzi gagne en 2023, 58 ans après la dernière victoire de Ferrari au classement général. En 2024, la n°50 d'Antonio Fuoco, Miguel Molina et Nicklas Nielsen gagne à son tour, au terme d'une course très serrée. En 2025, la n°83 de l'équipe AF Corse, partagée par Robert Kubica, Yifei Ye et Phil Hanson, l'emporte : Ye devient le premier Chinois vainqueur.\n\nLa 499P compte ainsi trois victoires consécutives au Mans.",
    [["Le nom 499P", "499 est la cylindrée unitaire d'un cylindre en cm³, et P signifie prototype."], ["Kubica, à 40 ans", "Robert Kubica, ancien pilote de F1 gravement blessé en 2011, gagne en 2025 à 40 ans."]],
    [["Palmarès", "Trois victoires consécutives : 2023, 2024, 2025."]], ["toyota-gr010", "ferrari-250lm"]);

  add("toyota-tr010", [680, 340, 2.6],
    "En 2026, la Toyota TR010 Hybrid n°7 de Kamui Kobayashi, Mike Conway et Nyck de Vries l'emporte avec 10,913 secondes d'avance sur la BMW M Hybrid V8 n°20. C'est la sixième victoire de Toyota au Mans et la première depuis 2022.\n\nLa Ferrari 499P, qui avait gagné les trois éditions précédentes, voit sa série s'arrêter.",
    [["Une avance de 10 secondes", "L'écart de 10,913 secondes sur la BMW est le plus faible de l'édition."]],
    [["Palmarès", "Victoire en 2026, sixième de Toyota."]], ["toyota-gr010", "ferrari-499p"]);

  add("nissan-r390", [650, 340, 3.4],
    "Nissan présente en 1997 la R390 GT1, à V8 biturbo de 3,5 litres, développée avec TWR. L'engagement en 1997 est un échec, mais en 1998 elle finit à la 3e, 5e, 6e et 10e place. Une seule R390 de route a été construite pour l'homologation.\n\nNissan se retire après 1998 pour économiser et prépare la R391 de 1999.",
    [["Une seule voiture de route", "La version de route a été construite en un seul exemplaire."]],
    [["Meilleur résultat", "3e place au Mans 1998."]], ["toyota-gt-one"]);

  add("lancia-lc2", [820, 380, 3.2],
    "Lancia, déjà célèbre pour ses voitures de rallye, s'engage en Groupe C avec la LC2, un châssis dessiné par Dallara et propulsé par un V8 biturbo Ferrari de 3 litres. Très rapide en qualification, avec Riccardo Patrese notamment, elle se révèle fragile en course. La LC2 ne gagne jamais Le Mans.\n\nLa marque quitte le Groupe C en 1986.",
    [["Reine de la qualification", "La LC2 a décroché plusieurs pole positions au Mans, sans jamais gagner."]],
    [], ["porsche-956"]);

  add("mazda-767b", [630, 330, 3.5],
    "La 767B de 1989, à moteur rotatif à quatre rotors de 2,6 litres, est le prédécesseur de la 787B victorieuse de 1991. Elle termine dans les dix premiers.\n\nLes ingénieurs de Mazda y ont expérimenté des solutions sur la fiabilité du moteur rotatif, qui ont servi à la 787B.",
    [], [], ["mazda-787b"]);

  add("chevrolet-corvette-c5r", [650, 300, 3.8],
    "Chevrolet Corvette Racing et Pratt & Miller engagent la C5-R à partir de 2000 au Mans, avec un V8 de 7 litres. Elle gagne sa classe GTS en 2001, 2002 et 2004 et devient une rivale constante de l'Aston Martin et de la Ferrari. Elle a gagné de nombreuses courses de l'American Le Mans Series.\n\nElle a ouvert la voie aux C6.R et C7.R, qui ont continué à gagner au Mans.",
    [["Un V8 de 7 litres", "Le gros V8 atmosphérique d'origine américaine a longtemps tenu tête aux V12 européens en GT."]],
    [["Palmarès de classe", "Victoires en catégorie GTS à plusieurs reprises (2001, 2002, 2004)."]], ["aston-dbr9"]);

  add("aston-dbr9", [650, 300, 3.8],
    "Aston Martin Racing, structure de Prodrive, développe la DBR9 pour la catégorie GT1, à partir de la DB9 de route. Elle est mue par un V12 de 6 litres de 600 ch environ. La voiture gagne sa classe au Mans à plusieurs reprises, notamment en 2007 et 2009, face à la Corvette. La DBR9 est un des symboles du retour d'Aston Martin à la compétition, après sa victoire de 1959 avec la DBR1.\n\nLa catégorie GT1 disparaît en 2011.",
    [["Un retour sur la scène", "Aston Martin n'était pas revenu au Mans de manière sérieuse depuis les années 1960."]],
    [["Palmarès de classe", "Victoires en GT1 à plusieurs reprises."]], ["chevrolet-corvette-c5r", "aston-dbr1"]);

  add("ford-gt-2016", [700, 300, 3.5],
    "Pour fêter les 50 ans de sa victoire de 1966, Ford revient au Mans en 2016 avec la nouvelle Ford GT, à V6 biturbo EcoBoost de 3,5 litres, engagée par Chip Ganassi Racing. Le jour de l'anniversaire, la Ford GT n°68 de Joey Hand, Dirk Müller et Sébastien Bourdais gagne la catégorie GTE Pro devant la Ferrari 488 GTE.  La victoire a suscité des débats sur le règlement d'équivalence de performances.\n\nLa Ford GT quitte la compétition fin 2019.",
    [["50 ans jour pour jour", "La victoire de 2016 est survenue exactement cinquante ans après le triplé de 1966."]],
    [["Palmarès de classe", "Victoire en GTE Pro en 2016."]], ["ford-gt40"]);

  add("porsche-963", [680, 340, 2.6],
    "La Porsche 963, un prototype LMDh dérivé du Hypercar, remplace la 919 de 2017 et est engagée au Mans à partir de 2023 par Porsche Penske Motorsport. Elle est propulsée par un V8 biturbo de 4,6 litres, avec un moteur électrique de 50 kW.\n\nElle a pris le départ de nombreuses courses du championnat du monde d'endurance et de l'IMSA. Elle a ainsi permis à Porsche de renouer avec les premières places.",
    [], [["Débuts", "Première participation en 2023 au Mans."]], ["porsche-919"]);

  add("cadillac-vseries-r", [680, 340, 2.6],
    "La Cadillac V-Series.R est un prototype LMDh sur châssis Dallara, doté d'un V8 atmosphérique de 5,5 litres. Elle a été engagée au Mans à partir de 2023. L'engagement de Cadillac a marqué le retour de la marque américaine en catégorie reine, avec les équipes Chip Ganassi et Action Express.\n\nEn 2023, Cadillac a mené la course avant de finir 3e.",
    [], [["Podium", "3e place en 2023, pour sa première participation."]], ["ferrari-499p"]);

  add("bmw-m-hybrid-v8", [680, 340, 2.6],
    "La BMW M Hybrid V8 est un prototype LMDh construit avec Dallara, équipée d'un V8 biturbo de 4 litres. Elle est engagée par BMW M Team WRT en Championnat du monde d'endurance et par BMW M Team RLL en IMSA. Elle a fini deuxième au Mans en 2026, à 10,913 secondes de la Toyota.\n\nBMW avait gagné l'épreuve en 1999 avec la V12 LMR.",
    [], [["Podium", "2e place en 2026, derrière la Toyota n°7."]], ["toyota-tr010", "bmw-v12-lmr"]);

  add("peugeot-9x8", [680, 340, 2.6],
    "La Peugeot 9X8, présentée en 2021, est une hypercar propulsée par un V6 biturbo de 2,6 litres, avec un moteur électrique sur le train avant. Elle s'est signalée par l'absence d'aileron arrière sur la version de 2022, une première pour une voiture de course de ce niveau. En 2023, un aileron classique a été ajouté.\n\nPeugeot revient ainsi dans la catégorie reine après sa retraite de 2012.",
    [["Une voiture sans aileron", "Peugeot a testé l'effet de sol sans aileron, un choix controversé."]],
    [], ["peugeot-908"]);

  add("alpine-a424", [680, 340, 2.6],
    "L'Alpine A424 est une hypercar à V6 biturbo de 3,4 litres, issue du groupe Renault et engagée au Mans à partir de 2024. Elle succède à l'A480 de 2021. Alpine, marque du groupe Renault, retrouve ainsi le sommet de l'endurance 46 ans après l'A442B victorieuse de 1978.",
    [], [], ["alpine-a442b"]);

  add("lamborghini-sc63", [680, 340, 2.6],
    "La Lamborghini SC63 est un prototype LMDh engagé depuis 2024 par Iron Lynx et Lamborghini. Elle utilise un V8 biturbo de 3,8 litres. Lamborghini revient en endurance après plusieurs années de présence en GT ; le programme LMDh a ensuite été suspendu.\n\nLe nom SC63 vient de la « Squadra Corse » et de l'année de fondation, 1963.",
    [], [], ["porsche-963"]);

  add("aston-valkyrie-amr-lmh", [800, 340, 2.6],
    "L'Aston Martin Valkyrie AMR-LMH est dérivée de l'hypercar de route Valkyrie, conçue avec Adrian Newey. Elle emploie un V12 atmosphérique Cosworth de 6,5 litres et a débuté en 2025.\n\nLa Valkyrie de route est considérée comme l'une des voitures de série les plus extrêmes.",
    [], [], ["aston-dbr1"]);

  MAKIT.enrich(m);
})();
