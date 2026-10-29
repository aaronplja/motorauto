/** MOTORAUTO — compléments Le Mans (1923-1969) : couple, vitesse de pointe, 0 à 100 (valeurs de référence), histoire, anecdotes, palmarès. */
(function () {
  "use strict";
  const m = {};
  const add = (id, e, h, a, r, rel) => { m["lm-" + id] = { e: [e], h, a: a || [], r: r || [], rel: (rel || []).map((x) => "lm-" + x), ap: true }; };

  add("chenard-sport", [150, 125, 14],
    "Les 24 Heures du Mans naissent d'un pari lancé en 1922 par Georges Durand, secrétaire général de l'Automobile Club de l'Ouest, avec le journaliste Charles Faroux et l'industriel Emile Coquille : prouver la fiabilité des voitures de tourisme en les faisant rouler jour et nuit. La première édition a lieu les 26 et 27 mai 1923 sur un circuit de près de 17 km, en grande partie sur des routes ouvertes. Les 33 voitures au départ sont proches de celles du commerce.\n\nLa Chenard & Walcker Sport de 3 litres, un quatre-cylindres à arbre à cames en tête, l'emporte avec André Lagache et René Léonard. Ils parcourent environ 2 209 km à la moyenne d'un peu plus de 92 km/h.Chenard & Walcker, constructeur de Gennevilliers, renouvelle l'exploit de peu en 1924 avec un second podium.",
    [["Pas de limite de vitesse, mais un règlement strict", "La capote devait pouvoir être relevée et abaissée à chaque ravitaillement, et un nombre fixe de tours séparait les remplissages de carburant : l'épreuve s'inspirait des voitures de tous les jours."], ["Un circuit qui n'existe plus", "Le premier tracé empruntait des routes nationales ; la ligne droite des Hunaudières, devenue légendaire, en faisait déjà partie."]],
    [["Distance", "Environ 2 209 km parcourus en 24 heures, à plus de 92 km/h de moyenne."]], ["bentley-3-litre"]);

  add("bentley-3-litre", [230, 130, 13],
    "Bentley Motors est fondée en 1919 par Walter Owen Bentley. W.O. a lui-même fait ses armes comme ingénieur de moteurs d'avion pendant la Première Guerre mondiale, ce qui explique le soin apporté à la mécanique : quatre cylindres de 3 litres, quatre soupapes par cylindre, arbre à cames en tête. La 3 Litre débute au Mans en 1923, où une voiture finit 4e, et gagne en 1924 avec John Duff, un Canadien, et Frank Clement.\n\nLa victoire de 1927 est entrée dans la légende : au virage de White House, une multiple collision détruit la plupart des voitures. La Bentley n°3 de Dr Benjafield et Sammy Davis, tordue mais encore roulante, repart et remporte l'épreuve. Ces succès bâtissent la réputation des « Bentley Boys », fortunés et audacieux, qui préféraient la fiabilité à la vitesse pure.",
    [["Les Bentley Boys", "Ce groupe de gentlemen-drivers, dont Woolf Barnato, Tim Birkin et Glen Kidston, a fait la renommée de la marque dans les années 1920."], ["Un constructeur sans argent", "Malgré ses victoires, Bentley Motors est en difficulté financière dès la fin des années 1920 et est rachetée par Rolls-Royce en 1931."]],
    [["Palmarès", "Deux victoires pour la 3 Litre : 1924 et 1927."]], ["bentley-4-5"]);

  add("lorraine-dietrich", [200, 135, 15],
    "Lorraine-Dietrich est un constructeur alsacien-lorrain dont les origines remontent au XIXe siècle. En 1925, il engage au Mans la B3-6, une grande voiture de tourisme à six cylindres. Gérard de Courcelles et André Rossignol gagnent la 3e édition, devant d'autres Lorraine. En 1926, la marque réalise un triplé : Robert Bloch et André Rossignol gagnent, et les deux autres Lorraine suivent. Lorraine-Dietrich est ainsi la première marque à gagner deux années de suite, et la première à placer trois voitures aux trois premières places.\n\nLa marque quitte pourtant la compétition après 1926 et disparaît peu après, absorbée par d'autres constructeurs.",
    [["Un triplé historique", "En 1926, la Lorraine-Dietrich a pris les trois premières places, un résultat que peu de marques ont répété."], ["Rossignol, deux fois vainqueur", "André Rossignol est un des rares pilotes à avoir gagné deux années de suite avec la même marque dans les années 1920."]],
    [["Triplé", "1926 : les trois premières places pour Lorraine-Dietrich."]], ["bentley-3-litre"]);

  add("bentley-4-5", [290, 140, 12],
    "Pour la Bentley 4½ Litre, W.O. Bentley agrandit le quatre-cylindres à 4,4 litres. Le modèle gagne en 1928 avec Woolf Barnato et Bernard Rubin, après une lutte avec une Stutz américaine, la seule voiture à avoir sérieusement menacé les Bentley cette année-là. \n\nLes « Blower Bentley », compressées et voulues par Tim Birkin, n'ont jamais gagné Le Mans malgré leur réputation. W.O. Bentley les jugeait trop fragiles.",
    [["La Blower Bentley", "Tim Birkin a fait construire cinq voitures à compresseur en 1929, contre l'avis de W.O. Bentley, qui les trouvait peu fiables."], ["Barnato, invincible", "Woolf Barnato a gagné les trois fois où il a participé : 1928, 1929 et 1930."]],
    [["Palmarès", "Victoire en 1928 devant la Stutz de Bloch et Brisson."]], ["bentley-speed-six", "bentley-3-litre"]);

  add("bentley-speed-six", [400, 170, 10],
    "La Speed Six, six cylindres de 6,6 litres, est la plus puissante des Bentley d'avant-guerre. Barnato la finance en partie lui-même. En 1929, les Bentley prennent les quatre premières places. En 1930, la Speed Six de Barnato et Kidston l'emporte à nouveau. Cette victoire de 1930 est la dernière de Bentley au Mans avant 2003.\n\nLa marque est mise en difficulté par la crise de 1929 et par le coût de ses programmes de course, et est reprise par Rolls-Royce en 1931.",
    [["Le « Old Number One »", "La Bentley Speed Six « Old Number One » est l'une des voitures de course anglaises les plus célèbres de l'époque."], ["73 ans d'attente", "Après 1930, Bentley a dû attendre 2003 pour gagner à nouveau Le Mans."]],
    [["Palmarès", "Deux victoires : 1929 et 1930."]], ["bentley-4-5", "bentley-speed-8"]);

  add("alfa-8c-2300", [190, 175, 9],
    "Vittorio Jano a conçu la 8C 2300 en 1931, avec un huit-cylindres en ligne à compresseur, une architecture très élaborée pour l'époque. L'Alfa Romeo gagne Le Mans quatre fois de suite : 1931 (Earl Howe et Tim Birkin), 1932 (Raymond Sommer et Luigi Chinetti), 1933 (Sommer et Tazio Nuvolari, dans une course très serrée), et 1934 (Chinetti et Philippe Étancelin). La 8C est restée dans l'histoire comme l'une des plus belles voitures de course et de route de son temps.\n\nAprès 1934, l'Alfa Romeo se concentre sur les Grand Prix, mais elle reste parmi les voitures de référence de la compétition d'avant-guerre.",
    [["Nuvolari au Mans", "En 1933, Tazio Nuvolari, surnommé le « Mantouan volant », partage la voiture de Raymond Sommer pour une victoire très disputée."], ["La première victoire de Chinetti", "Luigi Chinetti, qui gagnera plus tard avec Ferrari, a débuté sa série de victoires au Mans avec cette Alfa."]],
    [["Quatre victoires d'affilée", "1931, 1932, 1933 et 1934."]], ["bentley-speed-six"]);

  add("lagonda-m45r", [310, 160, 11],
    "La Lagonda M45R Rapide est une voiture de route de 4,5 litres, à six cylindres Meadows, préparée par l'équipe d'Arthur Fox. Elle était très proche du modèle de série. En 1935, John Hindmarsh et Luis Fontés gagnent l'épreuve, la seule victoire de Lagonda au Mans à ce jour.\n\nLa marque sera reprise par Aston Martin en 1947 : les deux noms se retrouvent aujourd'hui sous la même bannière.",
    [["Luis Fontés", "Luis Fontés, pilote et aviateur anglais, était l'un des rares à partager son temps entre course et pilotage d'avion."]],
    [["Seule victoire", "La seule victoire de Lagonda au classement général."]]);

  add("bugatti-57g", [330, 190, 9],
    "La Type 57G, surnommée « Tank » à cause de sa carrosserie fermée, aérodynamique, dessinée par Jean Bugatti, est dérivée de la Type 57 de route et reprend son huit-cylindres à compresseur. Jean-Pierre Wimille et Robert Benoist gagnent en 1937, après avoir couvert la distance record de l'époque, près de 3 300 km.\n\nLa voiture est restée dans les mémoires pour sa ligne. Jean Bugatti, fils d'Ettore, est mort en août 1939 lors d'un essai sur route, quelques semaines après la victoire de 1939.",
    [["La mort de Jean Bugatti", "Jean Bugatti est mort à 30 ans en août 1939 lors d'un essai d'une Type 57C sur route, quelques semaines après la victoire de la marque au Mans."]],
    [["Distance", "Près de 3 300 km parcourus en 1937, record de l'époque."]], ["bugatti-57c"]);

  add("delahaye-135", [260, 170, 10],
    "La Delahaye 135 est une voiture de grand tourisme à six cylindres, présentée en 1935. Dans sa version de compétition « CS », elle domine les épreuves de sport en France. Eugène Chaboud et Jean Trémoulet gagnent en 1938 devant une autre Delahaye.\n\nLa 135 a été fabriquée jusqu'en 1954, et ses carrosseries signées Figoni et Falaschi, Chapron ou Letourneur & Marchand font partie des plus belles françaises.",
    [["Un doublé en 1938", "Les Delahaye prennent les deux premières places en 1938."]],
    [["Palmarès", "Victoire en 1938."]]);

  add("bugatti-57c", [330, 190, 9],
    "La Type 57C de 1939, avec le huit-cylindres compressé, est une évolution de la 57G. Jean-Pierre Wimille et Pierre Veyron l'emportent en 1939, la dernière édition avant le conflit mondial. Wimille, pilote français, avait déjà gagné en 1937. Il sera tué en 1949 à Buenos Aires lors d'un essai.\n\nPierre Veyron a lui-même donné son nom, 66 ans plus tard, à la Bugatti Veyron, la voiture de série qui a franchi les 400 km/h.",
    [["Un nom resté célèbre", "La Bugatti Veyron de 2005 honore le vainqueur de 1939."]],
    [["Palmarès", "Deuxième victoire de Bugatti, en 1939."]], ["bugatti-57g"]);

  add("ferrari-166mm", [180, 200, 8],
    "La 166 MM (Mille Miglia) est une barquette de 2 litres à V12, dessinée par Carrozzeria Touring (le style « Barchetta »). En 1949, Luigi Chinetti et Lord Selsdon amènent Ferrari à sa première victoire au Mans, dans l'année du retour de l'épreuve après la guerre. Chinetti conduit presque toute la course ; Selsdon n'a conduit que brièvement.\n\nEnzo Ferrari, qui n'assistait pas à la course, découvre ainsi que ses voitures peuvent gagner sur la scène internationale. La 166 MM lance également le principe des voitures « pour clients » de Ferrari.",
    [["Chinetti au volant presque tout seul", "Le pilote franco-italien aurait conduit plus de 23 heures sur 24."], ["La première Ferrari à gagner", "Le Mans 1949 est la première victoire d'une Ferrari dans une grande classique."]],
    [["Première victoire de Ferrari au Mans", "1949, dans l'histoire d'une série qui compte 11 victoires."]], ["ferrari-375-plus"]);

  add("talbot-lago-t26", [370, 210, 8],
    "La Talbot-Lago T26 GS est une monoplace de Grand Prix à deux places, avec un six-cylindres de 4,5 litres, engagée par les frères Rosier. Louis Rosier gagne en 1950 avec son fils Jean-Louis, mais conduit presque seul toute l'épreuve. Il disait faire confiance à la fiabilité de la voiture : les consommations modérées de la Talbot-Lago lui permettent de s'arrêter moins que les rivales.\n\nLouis Rosier se tue en 1956 sur le circuit de Montlhéry.",
    [["23 heures au volant", "Louis Rosier aurait conduit presque 23 heures des 24, son fils ne prenant le volant que quelques tours."]],
    [["Palmarès", "Victoire en 1950, la dernière d'une Talbot au Mans."]]);

  add("jaguar-c-type", [330, 230, 6.8],
    "La C-Type (C pour Competition) est née de l'idée de William Lyons, patron de Jaguar, de prouver les mérites du six-cylindres XK en compétition. Dessinée par Malcolm Sayer, ingénieur issu de l'aviation, elle reçoit un châssis tubulaire léger. La voiture gagne dès 1951 avec Peter Walker et Peter Whitehead. En 1953, la C-Type est équipée de freins à disque Dunlop, et prend l'avantage sur les Ferrari, Alfa Romeo et Cunningham : Tony Rolt et Duncan Hamilton gagnent, et une autre C-Type finit deuxième.\n\nLes freins à disque donnent aux Jaguar un avantage au freinage dans la ligne droite des Hunaudières, et ils deviennent peu à peu la norme sur toutes les voitures de route.",
    [["Les freins à disque", "L'avantage de Jaguar en 1953 a convaincu le monde automobile de l'intérêt des disques."], ["Malcolm Sayer", "L'ingénieur aérodynamicien a dessiné la C-Type, la D-Type et la E-Type."]],
    [["Palmarès", "Deux victoires : 1951 et 1953, la seconde avec les freins à disque."]], ["jaguar-d-type"]);

  add("mercedes-300sl", [265, 230, 8],
    "La Mercedes 300 SL W194, six-cylindres de 3 litres incliné de 50 degrés, est la voiture qui a donné naissance à la célèbre 300 SL « Gullwing » de série. Elle reçoit une structure tubulaire, qui interdit de grandes portes classiques, d'où les portes papillon. En 1952, Hermann Lang et Fritz Riess gagnent au Mans, devant une autre 300 SL. Mercedes revient ainsi en course après la guerre.\n\nLa marque gagne également la Carrera Panamericana et finit deuxième à la Mille Miglia en 1952.",
    [["Portes papillon", "Les portes papillon sont nées d'une contrainte de châssis : le tube latéral était trop haut pour des portes classiques."], ["Retour de Mercedes", "La 300 SL marque le retour de Mercedes en compétition après la Seconde Guerre mondiale."]],
    [["Palmarès", "Victoire en 1952 et doublé Mercedes."]], ["ferrari-375-plus"]);

  add("ferrari-375-plus", [450, 270, 6],
    "La 375 Plus est un des gros V12 de Ferrari conçus par Aurelio Lampredi, avec 4,9 litres. En 1954, José Froilán González et Maurice Trintignant gagnent après un duel contre la Jaguar D-Type d'Hawthorn. La victoire de 1954 est l'une des plus disputées de l'époque.\n\nFroilán González, le « Cabezón », est aussi le premier pilote à avoir donné à Ferrari sa première victoire en Formule 1, à Silverstone en 1951.",
    [["Un finish serré", "La Ferrari a devancé la Jaguar de Rolt et Hamilton au terme d'une course très serrée."]],
    [["Palmarès", "Victoire en 1954."]], ["jaguar-d-type"]);

  add("jaguar-d-type", [340, 270, 5.8],
    "La D-Type, dessinée par Malcolm Sayer, est la première voiture de course à monocoque en aluminium inspirée de l'aviation, avec son aileron de dérive caractéristique. Elle gagne trois fois au Mans : 1955 (Hawthorn/Bueb), 1956 (Flockhart/Sanderson sur la voiture de l'Ecurie Ecosse) et 1957 (Flockhart/Bueb). En 1957, les D-Type prennent les quatre premières places.\n\nL'édition de 1955 reste la plus tragique de l'histoire du sport automobile : un accident impliquant la Mercedes de Pierre Levegh a tué plus de 80 spectateurs. Mercedes se retire alors de la compétition, et la course continue dans un climat de deuil.",
    [["Le drame de 1955", "Après l'accident, les organisateurs ont décidé de poursuivre la course pour éviter une panique des spectateurs quittant le circuit."], ["Le poisson de Sayer", "La forme de poisson de la D-Type vient de l'expérience aéronautique de Malcolm Sayer."]],
    [["Palmarès", "Trois victoires consécutives : 1955, 1956, 1957. Les quatre premières places en 1957."]], ["jaguar-c-type", "ferrari-250-tr"]);

  add("ferrari-250-tr", [320, 280, 5.8],
    "La 250 Testa Rossa tient son nom des cache-culbuteurs peints en rouge. Elle utilise le V12 Colombo de 3 litres, de 300 ch environ, et ses lignes pontoon, avec des ailes avant détachées, sont inspirées de la Scaglietti. Elle gagne en 1958 (Gendebien/Hill), 1960 (Gendebien/Frère) et 1961 (Gendebien/Hill, 250 TRI/61).La 250 TR est aujourd'hui l'une des voitures de collection les plus recherchées.\n\nLa 250 TR pose les bases de la domination de Ferrari au Mans, avec six victoires consécutives de 1960 à 1965.",
    [["Six d'affilée", "Entre 1960 et 1965, Ferrari a gagné Le Mans six fois de suite."], ["Un nom de cache-culbuteurs", "Les cache-culbuteurs du V12 sont peints en rouge, d'où le nom « tête rouge » (Testa Rossa)."]],
    [["Palmarès", "Trois victoires : 1958, 1960, 1961."]], ["ferrari-250p", "ferrari-330-trilm"]);

  add("aston-dbr1", [300, 260, 5.5],
    "David Brown, propriétaire d'Aston Martin, voulait prouver que son entreprise pouvait gagner Le Mans. La DBR1 (conçue par Ted Cutting) combine un six-cylindres en ligne de 3 litres et un châssis tubulaire léger. Après des années de tentatives, Roy Salvadori et Carroll Shelby gagnent en 1959, deuxième d'un doublé pour Aston Martin, devant la DBR1 de Trintignant et Frère. Cette victoire a permis à Aston Martin de remporter aussi le championnat du monde des voitures de sport de 1959.\n\nShelby, qui conduisait avec un traitement médical pour son cœur, termina sa carrière de pilote en 1960 et se consacra à la préparation de voitures.",
    [["Shelby et ses pilules", "Carroll Shelby aurait gardé des pastilles de nitroglycérine dans sa poche pendant l'épreuve en raison d'une maladie cardiaque."]],
    [["Palmarès", "Seule victoire d'Aston Martin au classement général au Mans. Championnat du monde des voitures de sport 1959."]], ["ford-gt40"]);

  add("ferrari-330-trilm", [400, 285, 5.5],
    "La 330 TRI/LM de 1962, à V12 de 4 litres, est la dernière Ferrari à moteur avant à avoir gagné Le Mans. Elle est engagée par l'usine Ferrari. Olivier Gendebien et Phil Hill gagnent, à l'issue d'une course où les Ferrari ont tout dominé. C'est la quatrième victoire du Belge Gendebien, qui prend sa retraite quelques années plus tard.\n\nL'arrivée des moteurs centraux chez Ferrari (la 250 P de 1963) rend les modèles à moteur avant obsolètes.",
    [["Phil Hill, champion du monde", "L'Américain Phil Hill a gagné Le Mans trois fois (1958, 1961, 1962) et le titre mondial de F1 en 1961."]],
    [["Palmarès", "Victoire en 1962, quatrième du Belge Olivier Gendebien."]], ["ferrari-250-tr", "ferrari-250p"]);

  add("ferrari-250p", [310, 285, 5.4],
    "La 250 P de 1963 est la première Ferrari de sport à moteur central arrière, inspirée de la voiture de F1 de 1961. Elle gagne dès son premier Mans avec Ludovico Scarfiotti et Lorenzo Bandini. En 1964, la 275 P, au V12 de 3,3 litres, gagne à son tour avec Jean Guichet et Nino Vaccarella. Les Ferrari de cette période sont les plus belles des années 1960 selon de nombreux amateurs.\n\nLe pilote Lorenzo Bandini est mort en 1967 à Monaco, après un accident en Formule 1.",
    [["Le moteur central", "Ferrari a longtemps hésité à placer son moteur derrière le pilote, par attachement à la tradition."]],
    [["Palmarès", "Victoires en 1963 (250 P) et 1964 (275 P)."]], ["ferrari-250lm"]);

  add("ferrari-250lm", [330, 290, 5.2],
    "La 250 LM, au V12 de 3,3 litres placé derrière le pilote, est l'évolution de la 250 P, conçue pour être homologuée en GT, ce que la FIA refusera. Ferrari lui préfère les Prototypes. La 250 LM gagne malgré tout le Mans 1965, engagée par la North American Racing Team de Luigi Chinetti, avec Masten Gregory et Jochen Rindt.\n\nC'est la dernière victoire de Ferrari au classement général au Mans avant 2023, soit un intervalle de 58 ans.",
    [["Rindt, futur champion du monde", "Jochen Rindt, 23 ans, est devenu champion du monde de Formule 1 à titre posthume en 1970."], ["58 ans d'attente", "Ferrari a dû attendre l'édition du centenaire en 2023 pour regagner Le Mans au classement général."]],
    [["Palmarès", "Dernière victoire d'une Ferrari de 1965 à 2023, signée par une équipe privée."]], ["ferrari-499p"]);

  add("ford-gt40", [650, 320, 4.9],
    "Henry Ford II voulait racheter Ferrari en 1963. Enzo Ferrari rompt les négociations au dernier moment : Ford décide alors de battre Ferrari sur son terrain. Le programme GT40 (40 pouces de hauteur) est lancé avec l'aide de Lola et de Carroll Shelby. Après des débuts difficiles en 1964 et 1965, Ford gagne en 1966 avec la Mk II à V8 de 7 litres : Bruce McLaren et Chris Amon l'emportent devant deux autres Ford. En 1967, la Mk IV (Dan Gurney, A.J. Foyt) gagne avec quatre tours d'avance sur la Ferrari 330 P4. En 1968 et 1969, ce sont deux Mk I (J.W. Automotive, Gulf) qui s'imposent, la seconde de justesse devant la Porsche 908 : Jacky Ickx et Jackie Oliver gagnent d'un peu plus de 100 mètres.\n\nLa GT40 est la seule voiture américaine à avoir gagné Le Mans au classement général quatre années de suite.",
    [["Le duel Ford-Ferrari", "L'histoire a été portée à l'écran par le film « Le Mans 66 » (2019)."], ["Ickx contre le règlement", "En 1969, Ickx a marché au départ pour protester contre le départ en courant, jugé dangereux ; un pilote, John Woolfe, est mort dans l'accident du premier tour, et le départ en courant a été supprimé en 1970."]],
    [["Palmarès", "Quatre victoires d'affilée (1966-1969)."], ["Plus petite marge", "1969 : environ 120 mètres d'écart à l'arrivée entre la GT40 et la Porsche 908 de Hans Herrmann."]], ["ferrari-330-p4", "porsche-917k"]);

  add("ferrari-330-p4", [450, 320, 5],
    "La 330 P4 (1967), au V12 de 4 litres à quatre soupapes par cylindre, est la meilleure Ferrari de course de l'époque. Elle avait été conçue pour tenir tête aux Ford Mk IV. Le Mans 1967 est une défaite : Gurney et Foyt gagnent avec la Ford, mais les Ferrari P4 prennent les deuxième et troisième places. La P4 a gagné les 24 Heures de Daytona 1967 avec un triplé Ferrari, imité par la photo des trois voitures franchissant la ligne en formation.\n\nLes P4 sont devenues des icônes .",
    [["Daytona 1967", "La photo de l'arrivée de Daytona est l'une des plus célèbres de l'histoire de Ferrari."]],
    [["Classement", "2e et 3e au Mans 1967."]], ["ford-gt40"]);
  MAKIT.enrich(m);
})();
