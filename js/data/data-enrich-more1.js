/** MOTORAUTO — seconde passe : citadines sportives françaises, japonaises, Ford, VW, SEAT (histoire, anecdotes, palmarès). */
(function () {
  "use strict";
  const m = {};
  const add = (id, h, a, r) => { m[id] = { h: h || "", a: a || [], r: r || [], ap: true }; };

  /* ---- PEUGEOT 206 / 205 / 306 / 106 / 309 / 406 / 207 */
  add("peugeot-206-s16-gt",
    "La 206 S16 arrive en 1999 avec le 2.0 16V de 136 ch (puis 138 ch), un bloc issu de la famille EW10 que l'on retrouve sur les 306 et 406. Elle reprend les jantes 16 pouces, les boucliers spécifiques et un échappement plus libre. Le châssis, déjà excellent sur la 206 de base, bénéficie d'un train arrière à barre de torsion raffiné qui lui donne une agilité remarquable. Elle sert de base commerciale à la 206 WRC, dont la production de série sert à justifier l'homologation.\n\nSur route, la S16 offre un moteur avide de régimes et une boîte à 5 rapports précise. Elle est restée longtemps un « bon plan » d'occasion, avant que les exemplaires non modifiés ne se raréfient.",
    [["Une base pour la WRC", "La 206 WRC de Peugeot Sport, championne du monde des constructeurs en 2000, 2001 et 2002, a été homologuée à partir de la 206 de série."], ["Le coup de rein du train arrière", "Le comportement très mobile de l'arrière a forgé la réputation sportive de la 206 sans moteur surpuissant."]],
    [["Palmarès", "Peugeot remporte le titre constructeurs WRC en 2000, 2001 et 2002 avec la 206 WRC."]]);
  add("peugeot-206-rc",
    null,
    [["La GTI 180 des années 2000", "La RC reprend le 2.0 16V poussé à 177 ch du groupe PSA, accouplé à une boîte à 6 rapports, une nouveauté pour une 206."], ["Un coupé de rue dans les années 2000", "Elle cible les amateurs de GTI compactes face à la Clio 172 et à la Saxo VTS."]],
    [["Performance", "Environ 225 km/h en vitesse maximale et 7,4 s de 0 à 100 km/h (valeurs constructeur indicatives)."]]);
  add("peugeot-206-cc",
    null,
    [["Le coupé-cabriolet pour tous", "Après la 206 CC, d'autres citadines coupé-cabriolet à toit rigide rétractable ont suivi, mais Peugeot a ouvert la voie."], ["Une réussite commerciale", "Plus de 300 000 exemplaires de la 206 CC ont été produits."]],
    [["Ventes", "Plus de 300 000 206 CC ont été produites."]]);
  add("peugeot-206-sw",
    "La 206 SW est présentée en 2002 : un break avec un coffre de 313 litres et une banquette rabattable. Elle partage ses moteurs essence et diesel HDi avec la berline, du 1.4 de 75 ch jusqu'au 2.0 HDi de 90 ch. Dessinée pour attirer une clientèle jeune et familiale à la recherche d'une voiture polyvalente sans l'encombrement d'un monospace.\n\nElle se distingue par un hayon vertical, des feux arrière redessinés et un toit prolongé. Peugeot la vend jusqu'en 2007 avant l'arrivée de la 207 SW.",
    [["Un break pour les jeunes", "Peugeot a destiné la 206 SW à une cible moins familiale que les breaks traditionnels, avec un style dynamique."]]);
  add("peugeot-206-plus",
    "La 206+ apparaît en 2009 pour prolonger la carrière de la 206 aux côtés de la 207. Face avant retouchée, feux, boucliers et motorisations Euro 5 : elle devient une citadine d'accès à bas prix, notamment pour les marchés émergents. Produite à Mulhouse jusqu'en 2013 en Europe et plus longtemps hors d'Europe (Iran, Chine, Amérique du Sud), elle a connu une seconde vie commerciale remarquable.\n\nSa gamme est limitée : 1.1 de 60 ch, 1.4 de 75 ch, 1.4 HDi de 68 ch. La 206+ reste un bon exemple de la stratégie PSA de décliner une plate-forme amortie.",
    [["Une seconde vie", "La 206 a été produite jusqu'au milieu des années 2010 dans plusieurs pays, bien après sa disparition en Europe."]]);
  add("peugeot-206-sedan",
    "La 206 Sedan (aussi 206 SD) est une version tricorps de la 206 destinée aux marchés où la berline à coffre séparé est préférée, comme la Chine, l'Amérique latine ou le Moyen-Orient. Elle reprend la face avant de la 206 et ajoute un coffre classique, ce qui allonge la voiture de plusieurs centimètres.\n\nSa gamme moteurs est locale et dépend du marché. Elle est produite notamment par Dongfeng Peugeot-Citroën en Chine et par Peugeot Iran Khodro (Iran).",
    [["Une 206 à coffre", "Cette version à trois volumes n'a jamais été commercialisée en France."]]);
  add("peugeot-205-gti",
    "La 205 GTI est lancée à l'automne 1984. Elle reprend la 205 lancée en 1983 et reçoit d'abord le 1.6 de 105 ch, puis en 1986 le 1.9 de 130 ch. Au poids d'environ 900 kg, elle offre des performances très vives et un comportement très mobile, quitte à être piégeuse sur sol glissant : le train arrière peut réagir brutalement au lever de pied. La 205 GTI s'est imposée dans la presse comme la meilleure compacte sportive de sa génération.\n\nProduite jusqu'en 1994, elle est devenue une voiture de collection très recherchée dans toute l'Europe. Les prix des exemplaires d'origine ont fortement augmenté.",
    [["Le lever de pied", "Son train arrière pouvait décrocher au lever de pied en courbe, ce qui a fait sa réputation de voiture « pour pilotes »."], ["Un symbole des années 80", "La 205 GTI, avec la 205 T16 en rallye, a bâti l'image sportive de Peugeot."]],
    [["Presse", "Longtemps citée comme référence des GTI compactes des années 1980."], ["Collection", "L'une des Peugeot les plus cotées sur le marché des youngtimers."]]);
  add("peugeot-205-rallye",
    "La 205 Rallye est apparue en 1988 comme version « accessible » de la gamme sportive : un moteur 1.3 de 103 ch (1.3 Rallye) puis 1.9 sur la dernière série, un poids d'environ 800 kg et un équipement réduit à l'essentiel. Sans lève-vitres électriques, sans direction assistée, avec des jantes de 14 pouces d'un blanc caractéristique, elle fait de la légèreté sa principale arme.\n\nElle est restée une voiture de choix pour la compétition amateur et la course de côte, tout en étant une excellente base de départ pour les jeunes pilotes.",
    [["Moins de 800 kg", "Son poids réduit (environ 800 kg) lui permettait de rivaliser avec des voitures plus puissantes."], ["Des jantes blanches", "Les jantes blanches font partie de son identité visuelle."]],
    [["Compétition", "Très utilisée en rallye régional et en course de côte en France."]]);
  add("peugeot-205-cti",
    "La 205 CTI (1986) est le cabriolet de la 205, dessiné et construit par Pininfarina. Elle reçoit les moteurs de la GTI (1.6 de 105 ch puis 1.9 de 130 ch), pour un poids légèrement supérieur. Sa capote manuelle se replie facilement et son style en fait une voiture de plage célèbre.\n\nElle reste l'un des cabriolets les plus populaires de son époque et un choix apprécié des collectionneurs.",
    [["Dessinée par Pininfarina", "Le dessin du cabriolet est l'œuvre de Pininfarina, partenaire de longue date de Peugeot."]],
    );
  add("peugeot-306-s16",
    null,
    [["La compacte la plus équilibrée", "La 306 S16 est souvent citée parmi les meilleures sportives pour la qualité de son châssis, bien meilleur que celui de la 205 pour les performances."], ["La BV6", "La boîte à 6 rapports de 1996 était une rareté sur une berline compacte de ce prix."]],
    [["Presse", "Elle a remporté de nombreux essais comparatifs face à des rivales plus chères."]]);
  add("peugeot-306-cabriolet",
    "La 306 Cabriolet est présentée en 1994. Dessinée et fabriquée par Pininfarina, elle reçoit le 1.8 de 112 ch puis le 2.0 de 135 ch. Plus raffinée que la 205 CTI, elle bénéficie d'une carrosserie rigide et d'une capote à commande manuelle ou électrique selon les séries. Elle se distingue par un dessin tout en courbes et une bonne habitabilité arrière.\n\nProduite jusqu'en 2002 à Grugliasco, elle est restée l'un des cabriolets les plus accessibles de sa génération.",
    [["Un cabriolet « à la française »", "La 306 Cabriolet prolongeait la tradition des cabriolets Peugeot dessinés par Pininfarina, comme la 504 Cabriolet."]]);
  add("peugeot-306-break",
    "La 306 Break est lancée en 1997. Elle propose un coffre de 480 litres, jusqu'à 1 600 litres banquette rabattue, et reprend les motorisations de la berline : essence 1.4, 1.6, 1.8, 2.0 et diesel 1.9 D, 1.9 TD, 2.0 HDi. Son confort et sa tenue de route, supérieurs à la moyenne, en font un break très apprécié.\n\nElle a été produite jusqu'en 2002 à Poissy, avant d'être remplacée par la 307 SW.",
    [["Un break confortable", "La suspension de la 306 est souvent donnée en référence pour le confort et le comportement."]]);
  add("peugeot-306-maxi",
    "La 306 Maxi est une voiture de rallye à deux roues motrices de la catégorie F2000 « Kit Car », développée par Peugeot Sport à partir de 1996. Elle est équipée d'un 2.0 atmosphérique d'environ 300 ch, d'une boîte séquentielle et d'une carrosserie élargie. Pilotée par Gilles Panizzi, Jean Ragnotti ou Harri Rovanperä, elle domine les rallyes asphalte du championnat de France et s'illustre aussi en championnat du monde sur asphalte.\n\nLa Maxi est une référence de la catégorie des deux roues motrices.",
    [["Une reine du bitume", "Sur asphalte, la 306 Maxi pouvait inquiéter les WRC à quatre roues motrices."], ["La Kit Car", "Le règlement Kit Car limitait la puissance mais permettait des carrosseries larges et une aérodynamique poussée."]],
    [["Rallye", "Domine les rallyes asphalte français dans la catégorie F2000 à la fin des années 1990."]]);
  add("saxo-berline",
    "La Saxo est présentée en 1996 pour remplacer l'AX. Elle partage sa plate-forme avec la Peugeot 106, mais se distingue par sa face avant et son habitacle. Produite à Vigo, en Espagne, elle est proposée avec des moteurs 1.0, 1.1, 1.4, 1.5 diesel et 1.6. Elle reste dans les mémoires comme une citadine robuste et sans histoire. La phase 2 (1999) reçoit de nouveaux phares.\n\nElle est restée au catalogue jusqu'en 2003 avant l'arrivée de la C2.",
    [["Une sœur de 106", "Saxo et 106 partageaient plate-forme et moteurs, mais pas la carrosserie."]],
    []);
  add("saxo-vts",
    null,
    [["Une icône des années 2000", "La Saxo VTS est devenue l'une des petites sportives les plus populaires en France, notamment auprès des jeunes conducteurs, ce qui a inspiré de nombreux rassemblements et préparations."], ["Un problème d'assurance", "Sa popularité chez les jeunes conducteurs et les vols fréquents ont rendu ces voitures chères à assurer."]],
    [["Performance", "Environ 200 km/h en vitesse de pointe et environ 8 s de 0 à 100 km/h pour la 16V de 120 ch (valeurs constructeur indicatives)."]]);
  add("saxo-s1600",
    null,
    [["Le tremplin de Loeb", "Sébastien Loeb a décroché le titre de champion du monde Junior WRC avec la Saxo Super 1600 en 2001."], ["Un moteur atmosphérique à haut régime", "Le 1.6 de 215 ch tournait très haut, comme les voitures de course d'avant-guerre."]],
    [["Titre", "Sébastien Loeb, champion du monde Junior WRC 2001 sur Citroën Saxo S1600."]]);
  add("saxo-electrique",
    "La Saxo Électrique est commercialisée à partir de 1997. Elle est équipée d'un moteur de 20 kW (27 ch) et de batteries nickel-cadmium, pour une autonomie annoncée de 80 km. Citroën la propose comme les autres véhicules électriques de PSA (Peugeot 106 Électrique, Peugeot Partner) à des collectivités et des flottes. La charge complète prend plusieurs heures.\n\nElle fait partie des premières voitures électriques commercialisées en série en Europe. Quelques milliers d'exemplaires seulement ont été produits.",
    [["Une pionnière", "La Saxo Électrique et la 106 Électrique ont figuré parmi les premières voitures électriques de série en Europe."]]);
  add("peugeot-106-berline",
    "La Peugeot 106 est lancée en 1991 pour remplacer la 104 et la 205 d'entrée de gamme. Sa carrosserie compacte, son poids contenu et ses moteurs TU de 1.0 à 1.6 en ont fait une citadine appréciée. Elle est fabriquée à Mulhouse et vendue à près de 3 millions d'exemplaires. La phase 2 (1996) reçoit un tableau de bord plus moderne.\n\nElle a donné naissance à des versions sportives très célèbres : XSI, Rallye, S16, mais aussi à la 106 Électrique.",
    [["Un classique de la citadine", "Avec près de 3 millions d'exemplaires, la 106 est l'une des citadines les plus vendues de sa génération."]],
    [["Ventes", "Près de 3 millions d'exemplaires produits entre 1991 et 2003."]]);
  add("peugeot-106-xsi",
    "La 106 XSI est la première sportive de la gamme 106, lancée en 1992. Elle reçoit le 1.4 de 100 ch, remplacé en 1994 par le 1.6 de 105 ch. Elle se reconnaît à ses jantes en alliage et à ses boucliers spécifiques. Son poids d'environ 850 kg lui assure des performances vives, avec un 0 à 100 km/h en un peu plus de 9 secondes.\n\nLa XSI est restée un choix accessible pour les jeunes conducteurs. Elle a précédé la S16 et la Rallye.",
    [["La première 106 sportive", "La XSI a ouvert la voie aux 106 Rallye et S16."]]);
  add("peugeot-106-rallye",
    null,
    [["Presque une voiture de course", "La 106 Rallye partage avec la 205 Rallye le goût de la légèreté : environ 800 kg et très peu d'équipement."], ["Un trophée de marque", "Le Trophée 106 a formé de nombreux pilotes français."]],
    [["Compétition", "Très répandue en rallye amateur, en Trophée 106 et en rallye régional."]]);
  add("peugeot-106-s16",
    "La 106 S16 (1996) est équipée d'un 1.6 16V de 118 ch. Elle reçoit des freins renforcés, une suspension raffermie et des jantes de 15 pouces. Son poids d'environ 900 kg et son comportement équilibré en font l'une des meilleures petites sportives de la fin des années 1990. La phase 2 restylée, vendue en France jusqu'en 2003, est la plus recherchée.\n\nElle a été parfois confondue avec la Saxo VTS, sa rivale directe.",
    [["Rivale de la Saxo VTS", "Les essais comparatifs entre la S16 et la Saxo VTS ont longtemps animé la presse."]]);
  add("peugeot-309-berline",
    "La Peugeot 309 est présentée en 1985. Elle est la première Peugeot fabriquée à Ryton (Royaume-Uni), sur la chaîne héritée de Talbot. Elle remplace la Talbot Horizon et comble le vide entre la 205 et la 305. Sa ligne, due à Pininfarina, est sobre. Elle est proposée avec des moteurs 1.1, 1.3, 1.6, 1.9 et diesel.\n\nLa 309 est restée au catalogue jusqu'en 1993, remplacée par la 306.",
    [["Une Peugeot construite en Angleterre", "La 309 a été fabriquée à Ryton, l'usine héritée de Talbot, après la reprise de Chrysler Europe par PSA."]]);
  add("peugeot-309-gti",
    "La 309 GTI (1987) reçoit le 1.9 de 130 ch, puis la GTI 16 (1990) le 1.9 16V de 160 ch. Plus lourde que la 205 GTI mais plus stable, elle offre un comportement plus sain. La version 16 soupapes, rare en France, est très recherchée.\n\nLa 309 GTI a été un sérieux concurrent des Golf GTI et Opel Kadett GSi.",
    [["La grande sœur de la 205 GTI", "Plus stable que la 205 GTI mais moins vive, la 309 GTI a séduit les amateurs d'un comportement plus sûr."]]);
  add("peugeot-406-berline-break",
    "La Peugeot 406 est lancée en 1995. Dessinée avec Pininfarina, elle succède à la 405 et s'impose comme une berline familiale de référence pour le confort et le comportement. Moteurs 1.6, 1.8, 2.0, 2.2, V6 3.0 et diesels 1.9 TD, 2.0 HDi. Elle est produite à Sochaux, Mulhouse et Vigo.\n\nElle est célèbre dans la culture populaire pour son rôle dans la série de films Taxi.",
    [["Le taxi de Daniel", "La Peugeot 406 blanche, avec ses évolutions, est la star de la série de films Taxi (1998)."]],
    [["Cinéma", "Voiture emblématique des films Taxi à partir de 1998."]]);
  add("peugeot-406-coupe",
    "Le 406 Coupé est présenté en 1997. Il est dessiné par Pininfarina et construit dans l'usine du carrossier à Grugliasco. Il est proposé avec le 2.0 16V de 135 ch, le 2.2 de 158 ch et le V6 3.0 de 190 ch. Sa ligne élégante lui vaut d'être cité comme l'une des plus belles Peugeot de son époque.\n\nIl est resté au catalogue jusqu'en 2004.",
    [["Un coupé de rêve à prix doux", "Le coupé 406 offrait le design d'un coupé italien à un prix de berline."]],
    [["Design", "Souvent cité parmi les plus beaux coupés de son époque."]]);
  add("peugeot-406-break",
    "La 406 Break est présentée en 1996. Elle offre un coffre de 560 litres, extensible, et reprend les moteurs de la berline. Elle est produite à Sochaux et Mulhouse jusqu'en 2004. Sa conduite confortable et sa solidité en ont fait un break très populaire auprès des familles et des professionnels.",
    [["Un break très présent sur les routes", "La 406 Break a été l'un des breaks les plus vendus en France à la fin des années 1990."]]);
  add("peugeot-406-silhouette",
    null,
    [["Une 406 qui n'en est pas une", "La carrosserie reprend l'allure de la 406, mais le châssis tubulaire est spécifique, selon le règlement Supertourisme."]],
    [["Compétition", "Engagée en Supertourisme (Championnat de France et d'Europe) à la fin des années 1990."]]);
  add("peugeot-207-rc",
    null,
    [["Le 1.6 THP de BMW", "Le 1.6 THP est issu de la collaboration PSA-BMW (famille Prince) et équipe aussi la Mini Cooper S."], ["La dernière GTI à l'ancienne", "La 207 RC fut l'une des dernières petites sportives de Peugeot avant le retour de la GTi 208."]],
    [["Performance", "Environ 230 km/h en pointe et 7,1 s de 0 à 100 km/h (valeurs constructeur indicatives)."]]);
  add("peugeot-207-s2000",
    "La 207 S2000 est la voiture de rallye de Peugeot Sport, conforme au règlement S2000 (2.0 atmosphérique de 280 ch, transmission intégrale, boîte séquentielle). Elle débute en 2007 et remporte l'Intercontinental Rally Challenge en 2008 avec Nicolas Vouilloz puis en 2009 avec Kris Meeke. Elle est très utilisée par les équipes privées.\n\nLa 207 S2000 a servi d'étape avant la 208 R5 de Peugeot Sport.",
    [["Le règne de l'IRC", "La 207 S2000 a remporté l'Intercontinental Rally Challenge en 2008 et 2009."]],
    [["Titre", "Champion de l'IRC 2008 avec Nicolas Vouilloz, puis 2009 avec Kris Meeke."]]);

  /* ---- CITROËN */
  add("citroen-xsara-vts",
    "La Xsara VTS (1997) est la version sportive de la Xsara, équipée du 2.0 16V de 167 ch (ou plus tard du 2.0 16V XU10J4RS). Elle est produite en trois portes (coupé) et cinq portes. Son comportement est vif et agile.\n\nElle a été vendue jusqu'en 2004. La Xsara VTS est devenue un bon plan sportif d'occasion, notamment pour sa fiabilité.",
    [["La sœur de la Xsara Kit Car", "La VTS profite de l'image des succès de la Xsara en rallye avec Sébastien Loeb et Philippe Bugalski."]]);
  add("citroen-xsara-kit-car",
    "La Xsara Kit Car est la voiture de rallye à deux roues motrices de Citroën Sport, engagée entre 1998 et 2001. Équipée d'un 2.0 atmosphérique de 280 ch et très légère (environ 1 000 kg), elle domine le championnat du monde des rallyes dans la catégorie Kit Car et remporte le Tour de Corse 1998 puis le Rallye de Catalogne 1999 avec Philippe Bugalski devant les voitures WRC, un fait marquant. Elle a été le terrain d'apprentissage de Sébastien Loeb.\n\nSa carrière préfigure l'arrivée de la Xsara WRC et le règne de Loeb.",
    [["Une Kit Car plus rapide que les WRC", "Bugalski gagne le Tour de Corse 1998 et le Rallye de Catalogne 1999 contre les WRC à quatre roues motrices."], ["La rampe de lancement de Loeb", "Loeb s'est fait remarquer avec Citroën au volant d'une Xsara Kit Car."]],
    [["Rallye", "Victoires de Philippe Bugalski en WRC (Tour de Corse 1998, Rallye de Catalogne 1999) avec la Xsara Kit Car."]]);
  add("citroen-xsara-wrc",
    null,
    [["Le règne de Loeb", "Sébastien Loeb devient champion du monde avec la Xsara WRC en 2004."], ["Un double héritage", "La Xsara WRC a permis à Citroën d'enchaîner les titres constructeurs de 2003 à 2005."]],
    [["Titres", "Champion du monde des constructeurs 2003, 2004 et 2005 avec la Xsara WRC; Loeb champion du monde pilotes 2004 et 2005 sur Xsara."]]);

  /* ---- RENAULT */
  add("renault-clio-williams-16s",
    "La Clio 16S est présentée en 1991 avec un moteur 1.8 16V de 137 ch (F7P). Le succès commercial de la Clio, élue Voiture de l'année 1991, donne naissance à la Clio Williams en 1993, série limitée à 5 000 exemplaires puis relancée. Le 2.0 16V de 150 ch, la suspension abaissée, les jantes dorées et la caisse bleue Sport font d'elle une icône. Le nom Williams rappelle la collaboration de Renault avec l'écurie de F1.\n\nLa Clio Williams est aujourd'hui l'une des Renault les plus recherchées par les collectionneurs.",
    [["Williams, champion du monde", "Le nom de la série limitée célèbre le titre de Williams-Renault en F1, remporté en 1992 avec Nigel Mansell."], ["Jantes dorées et bleu Sport", "La peinture bleue Sport et les jantes dorées sont devenues la signature de la Williams."]],
    [["Série limitée", "3 800 exemplaires de la Williams 1, puis des séries complémentaires jusqu'à environ 12 000 au total."]]);
  add("renault-clio-2-rs",
    null,
    [["Le meilleur châssis de la catégorie", "La Clio 172 puis 182 a reçu des éloges de la presse pour son comportement. Les versions Trophy et Cup sont recherchées."], ["La Clio V6 à l'ombre", "Elle fait partie, avec la Clio V6, de l'histoire de la division Renault Sport."]],
    [["Presse", "Longtemps citée comme la meilleure sportive compacte à moteur atmosphérique."]]);
  add("renault-clio-3-rs",
    "La Clio 3 R.S. est lancée en 2006 avec un 2.0 atmosphérique de 197 ch, puis 200 ch. Plus lourde que la Clio 2, elle conserve un châssis très efficace, avec une suspension à train avant et arrière réglés par Renault Sport. Elle est proposée en versions Cup (châssis raffermi) et Luxe.\n\nSa production prend fin en 2012. Elle a été la dernière Clio R.S. à moteur atmosphérique.",
    [["Le dernier atmosphérique", "La Clio 3 R.S. a été la dernière Clio R.S. à utiliser un moteur sans turbo."], ["La Clio R27", "Une version Clio R27 (ou F1 Team R27) a commémoré en 2007 le partenariat avec l'écurie de F1."]]);
  add("renault-clio-4-rs",
    "La Clio 4 R.S. (2013) abandonne le moteur atmosphérique pour un 1.6 turbo de 200 ch, puis de 220 ch pour la Trophy (2015). Elle est associée à une boîte EDC à double embrayage, un choix critiqué par les puristes en l'absence de boîte manuelle. Le châssis reste excellent et la voiture est très efficace sur circuit.\n\nLa Clio R.S. 16 (2016) est une série limitée de 275 ch. Elle est considérée comme un exercice de style de Renault Sport.",
    [["Plus de manuelle", "La Clio 4 R.S. n'a pas été proposée avec une boîte manuelle, ce qui a divisé les amateurs."], ["La R.S. 16", "Cette série spéciale a reçu le 1.6 de la Mégane R.S. poussé à 275 ch."]]);
  add("renault-megane-2-rs",
    null,
    [["Le record du Nürburgring", "La Mégane R26.R a signé en 2008 un temps de 8 min 16 s environ, record pour une traction de série à l'époque."], ["Une silhouette particulière", "Le dessin du hayon, très controversé, a rendu la Mégane 2 immédiatement reconnaissable."]],
    [["Nürburgring", "Record de tour du Nürburgring pour une traction de série en 2008 avec la R26.R."]]);
  add("renault-megane-3-rs",
    "La Mégane 3 R.S. (2009) reçoit le 2.0 turbo de 250 ch (265 ch pour la Trophy en 2011). La Trophy-R (2014) pèse environ 100 kg de moins et porte le record de la traction la plus rapide du Nürburgring à 7 min 54 s en 2014. Ses trains sont réglés avec un différentiel à glissement limité Torsen sur certaines versions.\n\nElle reste une référence pour les amateurs de circuit.",
    [["Record de la traction la plus rapide", "La Trophy-R a établi en 2014 un temps de 7 min 54 s au Nürburgring, record pour une traction à l'époque."]],
    [["Nürburgring", "Record du Nürburgring pour une traction (7 min 54 s) en 2014 avec la Trophy-R."]]);
  add("renault-megane-4-rs",
    "La Mégane 4 R.S. (2018) reçoit un 1.8 turbo de 280 ch (300 ch pour la Trophy). Elle est dotée du système 4Control, avec quatre roues directrices, et propose la boîte EDC ou manuelle selon les années. La Trophy-R (2019) reprend le record du Nürburgring pour une traction avec 7 min 40 s.\n\nElle est la dernière Mégane thermique de Renault Sport avant la Mégane E-Tech électrique.",
    [["4Control", "Les roues arrière directrices (4Control) améliorent l'agilité à basse vitesse et la stabilité à haute vitesse."]],
    [["Nürburgring", "Record de la traction la plus rapide du Nürburgring (7 min 40 s) en 2019 avec la Trophy-R."]]);
  add("renault-clio-v6",
    null,
    [["Un moteur central dans une citadine", "Le V6 3.0 est placé en position centrale arrière, à la place de la banquette. Un choix qui rappelle la R5 Turbo."], ["Une fabrication en Suède", "La Clio V6 était assemblée par TWR à Uddevalla, qui produisait aussi des Volvo."]],
    [["Série", "Environ 3 000 exemplaires de la Clio V6 produits au total."]]);
  add("renault-spider",
    null,
    [["Sans pare-brise", "Une version sans pare-brise existait, avec une déflecteur, rappelant les voitures de course des années 1950."], ["Un châssis en aluminium collé", "Le Spider utilise un châssis en aluminium collé, une technique rare à l'époque pour une voiture de série."]],
    [["Trophée", "Le Trophée Renault Spider a servi de championnat monotype dans les années 1990."]]);

  /* ---- MAZDA / NISSAN / TOYOTA / HONDA */
  add("mazda-mx5-nb",
    "Le MX-5 NB (1998) conserve l'esprit du premier modèle (NA), mais abandonne les phares escamotables. Il reçoit les moteurs 1.6 de 110 ch et 1.8 de 146 ch avec VVT (2000). Le châssis a été rigidifié, la carrosserie est plus aérodynamique et la capote est équipée d'une lunette en verre. Une série Mazdaspeed offre 178 ch avec turbo, dans une série limitée.\n\nIl est considéré comme une des meilleures bases pour le roadster à propulsion abordable.",
    [["Le roadster le plus vendu du monde", "Toutes générations confondues, le MX-5 est le roadster deux places le plus vendu de l'histoire (Guinness, 2000)."], ["Sur circuit, par centaines", "Le MX-5 NB est l'une des voitures les plus utilisées en Spec Miata et en compétition amateur."]],
    [["Record", "Le MX-5 est le roadster deux places le plus vendu de l'histoire selon le Guinness Book des records."]]);
  add("mazda-mx5-nc",
    null,
    [["Un MX-5 plus gros", "Le NC est plus long et plus lourd que le NB, mais reste proche de 1 100 kg."], ["Le toit rigide rétractable", "Le Roadster Coupé (RC) offre un toit rigide escamotable en 12 secondes."]]);
  add("mazda-mx5-nd",
    "Le MX-5 ND (2015) revient à la légèreté de l'original : environ 1 000 kg grâce à la technologie SkyActiv. Il reçoit les moteurs 1.5 de 131 ch et 2.0 de 160 à 184 ch. La version RF (Retractable Fastback) offre un toit rigide à ouverture électrique. Il a remporté le titre de Voiture mondiale de l'année 2016 et de Voiture mondiale du design.\n\nLe MX-5 ND est considéré comme l'un des meilleurs rapports entre le plaisir et le prix du marché.",
    [["Voiture mondiale de l'année 2016", "Le MX-5 ND a reçu le prix de Voiture mondiale de l'année (World Car of the Year) en 2016."], ["Jinba Ittai", "La philosophie « cheval et cavalier ne font qu'un » guide la conception depuis la première génération."]],
    [["Prix", "World Car of the Year 2016 et World Car Design of the Year 2016."]]);
  add("nissan-s130-280zx",
    "La 280ZX (S130, 1978) abandonne la pureté de la 240Z pour un confort accru. Son 2.8 L6 de 140 ch (180 ch en version turbo à partir de 1981) est accompagné d'une suspension plus souple et d'un habitacle plus luxueux. Elle devient un énorme succès aux États-Unis, avec plus de 400 000 exemplaires vendus sur la durée du modèle. Une version Turbo à 180 ch est proposée en 1981.\n\nLa 280ZX est considérée comme moins pure que la 240Z, mais elle a fait de Datsun un acteur majeur du sport.",
    [["Un succès américain", "Plus de 400 000 280ZX ont été vendues, un record pour un coupé sportif japonais."], ["Le luxe d'abord", "Nissan a préféré le confort à la pureté de la 240Z pour séduire la clientèle américaine."]],
    [["Ventes", "Plus de 400 000 exemplaires de 1978 à 1983."]]);
  add("nissan-z31-300zx",
    "La 300ZX Z31 (1983) abandonne le six-cylindres en ligne pour un V6 3.0 VG30E de 160 ch, puis le VG30ET turbo de 205 ch. Sa carrosserie anguleuse, typique des années 1980, est équipée de phares escamotables et d'un tableau de bord numérique. Elle propose les premiers T-tops électriques de la gamme Z.\n\nSa production prend fin en 1989, remplacée par la 300ZX Z32, bien plus moderne.",
    [["Des phares escamotables", "Les phares escamotables de la Z31 en font l'une des Z les plus typées des années 1980."]]);
  add("nissan-z-rz34",
    "La Nissan Z (RZ34, 2023) reprend la plate-forme de la 370Z avec un nouveau V6 3.0 biturbo VR30DDTT de 405 ch, partagé avec la Skyline 400R. Elle propose une boîte manuelle à 6 rapports ou une automatique à 9 rapports, et ne reçoit pas de transmission intégrale. Son dessin rend hommage à la 240Z d'origine et à la 300ZX Z32.\n\nElle est vendue sous le nom Fairlady Z au Japon. Une version Nismo de 420 ch complète la gamme.",
    [["Un hommage à la 240Z", "La face avant évoque la 240Z de 1969, la poupe rappelle la 300ZX Z32."], ["Un V6 partagé avec la Skyline", "Le VR30DDTT équipe aussi la Skyline 400R."]]);
  add("nissan-silvia-classic",
    "La Silvia est un coupé sportif lancé par Nissan en 1965. Les générations S110 (1979) et S12 (1983) sont des coupés de milieu de gamme, vendus sous les noms Gazelle, 200SX et 240SX selon le marché. La S12 reçoit le moteur turbo CA18ET de 135 ch. Populaires en compétition, ces voitures sont à la base des Silvia S13 qui feront la réputation du drift.\n\nLe nom Silvia vient de la déesse romaine des forêts.",
    [["Un nom de déesse", "Le nom Silvia vient de Sylvia, nymphe de la mythologie romaine."]]);
  add("nissan-silvia-s13",
    null,
    [["La voiture du drift", "La S13 (et ses cousines 180SX et 200SX) est devenue la voiture de prédilection des premiers pilotes de drift japonais, comme Keiichi Tsuchiya."], ["Un moteur interchangeable", "Le swap du moteur SR20DET sur la S13 est un classique des préparateurs."]],
    [["Culture", "Voiture centrale de la culture drift au Japon à partir des années 1990."]]);
  add("nissan-silvia-s14",
    "La Silvia S14 (1993) est plus grande et plus large que la S13. Elle conserve le SR20DET de 220 ch dans la version K's. Le Kouki (1996) reçoit un restylage de la face avant, plus agressive. Sur circuit, elle est moins appréciée que la S13 à cause de son poids supérieur.\n\nElle est devenue une base courante de voitures de drift.",
    [["Un bouclier controversé", "La face avant du Zenki, moins bien reçue que celle de la S13, a été corrigée avec le Kouki."]]);
  add("nissan-silvia-s15",
    null,
    [["La dernière Silvia", "La S15 a mis fin à la lignée en 2002. La production s'est arrêtée faute de ventes suffisantes."], ["Le drift et Tokyo Drift", "La S15 fait partie des voitures légendaires du drift."]],
    [["Fin de série", "Dernière Silvia produite, jusqu'en 2002."]]);
  add("nissan-silvia-ps13",
    "La Silvia PS13 est la désignation de la Silvia S13 équipée du moteur turbo SR20DET de 205 ch, dans les finitions J's et K's. Elle partage sa plate-forme avec la 180SX. Les versions à moteur atmosphérique sont désignées S13. La PS13 est très appréciée pour sa légèreté (environ 1 150 kg) et sa propulsion.\n\nElle est devenue une des voitures de drift les plus populaires.",
    [["Le code PS13", "PS13 désigne la S13 turbo à finitions J's/K's sur certains marchés."]]);
  add("nissan-onevia",
    "L'Onevia est une 180SX équipée de la face avant d'une Silvia : on la reconnaît à ses phares fixes. C'est un montage d'amateurs, très répandu au Japon dans la scène drift et tuning. Elle réunit la silhouette hatchback de la 180SX et le nez de la Silvia, ce qui lui donne un look hybride.\n\nLe nom de ces conversions n'a jamais été utilisé officiellement par Nissan.",
    [["Un mélange de noms", "Onevia vient de « 180SX » (one-eighty) et « Silvia »."]]);
  add("nissan-sileighty",
    "La Sileighty est une Silvia S13 équipée de la face avant d'une 180SX (phares escamotables). Le nom est un mélange de Silvia et de 180SX (eighty). C'est une conversion d'amateurs née au Japon, et reprise par des passionnés de drift.\n\nCes voitures n'ont jamais été commercialisées en usine.",
    [["Le look des phares escamotables", "La Sileighty reprend les phares escamotables de la 180SX sur une Silvia."]]);
  add("toyota-celica-supra-a40-a60",
    "La Celica Supra (A40, 1978) est dérivée de la Celica, mais allongée de 20 cm pour recevoir le six cylindres en ligne 2.6 de 110 ch, puis 2.8 de 170 ch. Elle est vendue au Japon sous le nom de Celica XX. La génération A60 (1981) reçoit le 2.8 de 170 ch, des phares escamotables et une suspension plus évoluée.\n\nLe modèle porte pour la première fois le nom Supra, qui deviendra une icône.",
    [["Le début de la légende", "La première Supra n'était qu'une Celica allongée, mais elle a donné son nom à une lignée mythique."], ["Un nom devenu culte", "Le mot Supra signifie « au-dessus » en latin."]]);
  add("toyota-supra-a70",
    "La Supra A70 (1986) devient un modèle à part entière, indépendant de la Celica. Elle reçoit le 3.0 7M-GTE turbo de 230 à 280 ch. Elle est proposée avec un toit targa amovible, une suspension à pilotage électronique (TEMS) et une boîte manuelle ou automatique. Elle pèse plus de 1 500 kg, ce qui limite son agilité.\n\nElle est le dernier modèle de la Supra avant le mythique A80.",
    [["Le premier turbo", "Le 7M-GTE de l'A70 est le premier six-cylindres turbo de la Supra."]]);
  add("toyota-mr2-aw11",
    "La Toyota MR2 (AW11, 1984) est la première voiture de série japonaise à moteur central. Elle reçoit le 1.6 4A-GE de 125 ch ou le 4A-GZE compressé de 145 ch. Légère (environ 1 000 kg), elle offre un comportement vif, mais piégeux. Son design anguleux, dans le goût des années 1980, séduit aussi les amateurs de sport.\n\nElle a gagné une réputation de petite Ferrari abordable.",
    [["Moteur central, prix doux", "La MR2 a fait entrer le moteur central dans la production abordable."]]);
  add("toyota-mr2-sw20",
    null,
    [["Surnommée « mini Ferrari »", "Sa ligne évoque la Ferrari 348, ce qui lui a valu ce surnom."], ["Un comportement piégeux", "Les premières séries ont été critiquées pour leur survirage au lever de pied, corrigé par des modifications de la suspension."]]);
  add("toyota-mrs-zzw30",
    "La MR-S (ZZW30, 1999), vendue en Europe comme MR2 Roadster, est une descendante légère des MR2. Elle reçoit le 1.8 VVT-i de 140 ch, pèse environ 1 000 kg et est équipée d'une boîte manuelle à 5 ou 6 rapports ou d'une SMT. Son moteur central et son châssis très léger la rendent amusante à conduire. Elle est proposée en toit souple uniquement.\n\nLa MR-S a été produite jusqu'en 2007.",
    [["Un roadster à moteur central", "La MR-S reste l'un des rares roadsters abordables à moteur central."]]);
  add("toyota-celica-classic",
    "La Toyota Celica, présentée en 1970, est un coupé sportif et abordable, la réponse de Toyota à la Ford Mustang. Elle est vendue en plusieurs générations jusqu'à la ST165 (1985), puis évolue vers la traction intégrale GT-Four, qui permet à Toyota de briller en rallye (Carlos Sainz, Juha Kankkunen). Les moteurs vont du 1.6 au 2.4 et au 2.0 turbo.\n\nLa Celica est un des modèles japonais les plus aimés des collectionneurs.",
    [["La « Mustang japonaise »", "La Celica a été conçue pour concurrencer la Mustang sur le marché américain."], ["La GT-Four, championne du monde", "Carlos Sainz et Juha Kankkunen ont été champions du monde des rallyes sur Celica GT-Four."]],
    [["Rallye", "Titres pilotes WRC avec la Celica GT-Four : Carlos Sainz (1990, 1992), Juha Kankkunen (1993) et Didier Auriol (1994)."]]);
  add("toyota-celica-zzt231",
    null,
    [["Le VVTL-i", "Le 1.8 VVTL-i de 192 ch utilise deux profils de came à haut régime et a été développé avec Yamaha."], ["La dernière Celica", "Cette génération a mis fin à la lignée en 2006."]]);
  add("honda-civic-eg6-vti",
    "La Civic EG6 (1991) est la version sportive de la cinquième génération, équipée du moteur VTEC B16A de 160 ch. Elle pèse environ 1 050 kg et se montre vive. L'EG6 SiR japonaise a été une des voitures préférées des amateurs de course de côte.\n\nElle est aujourd'hui recherchée par les collectionneurs et les préparateurs.",
    [["Le VTEC pour tous", "Le B16A a fait connaître le VTEC au grand public avec un son très caractéristique à haut régime."]]);
  add("honda-civic-ek9-type-r",
    null,
    [["Le B16B de 185 ch", "Un moteur atmosphérique de 1,6 litre qui développe plus de 115 ch/litre, parmi les plus hautes puissances spécifiques d'un moteur atmosphérique de série."], ["Le rouge Championship White", "Le blanc Championship White et le logo rouge sont devenus la signature de la Type R."]]);
  add("honda-civic-ep3-type-r",
    null,
    [["Fabriquée à Swindon", "L'EP3 était assemblée au Royaume-Uni, un fait rare pour une Type R."], ["Le K20A", "Le 2.0 i-VTEC K20A de 200 ch (215 ch en phase 2) est l'un des moteurs atmosphériques les plus appréciés."]]);
  add("honda-civic-fn2-type-r",
    "La Civic Type R FN2 (2006) est équipée du 2.0 i-VTEC K20Z4 de 201 ch, un moteur atmosphérique qui culmine à 8 400 tr/min. Elle reprend l'architecture à hayon de la Civic de huitième génération, avec une ligne futuriste. La FN2 n'est produite que jusqu'en 2011, avec la disparition du modèle sur les marchés de l'Union européenne.\n\nElle est connue pour son comportement vif et son moteur avide de tours.",
    [["Un hayon futuriste", "Le design de la Civic de huitième génération a divisé, mais il a marqué."]]);
  add("honda-civic-fk8-type-r",
    "La Civic Type R FK8 (2017) reprend le 2.0 VTEC Turbo, poussé à 320 ch. Son aérodynamique est affinée, avec une calandre à grandes ouïes et un aileron arrière. Elle établit en 2017 un record de la traction la plus rapide du Nürburgring (7 min 43 s) avant d'être battue par la Mégane R.S. Trophy-R.\n\nElle est restée au catalogue jusqu'en 2021.",
    [["Un record battu en deux ans", "La FK8 a pris le record de la traction la plus rapide du Nürburgring en 2017, avant la Mégane."]],
    [["Nürburgring", "Record de la traction la plus rapide du Nürburgring (7 min 43 s) en 2017."]]);
  add("honda-civic-fl5-type-r",
    null,
    [["Plus sobre", "La FL5 a abandonné l'aileron spectaculaire de la FK8 pour un style plus discret."], ["Retour de la boîte manuelle", "Honda a conservé la boîte manuelle à 6 rapports, rare dans cette catégorie."]],
    );

  /* ---- FORD / VW / SEAT */
  add("ford-escort-rs-cosworth-t25",
    "La seconde série de l'Escort RS Cosworth (1994) reçoit un turbo Garrett T25 plus petit que le T35 de la série 1, pour réduire le temps de réponse. L'EEC-IV de nouvelle génération gère l'injection et l'allumage. Elle est toujours dotée de l'énorme aileron arrière, un élément d'homologation pour le rallye. Elle est alors produite à Karmann, en Allemagne, avec des moteurs fournis par Cosworth.\n\nElle est aujourd'hui l'une des Ford les plus recherchées.",
    [["Le grand aileron", "L'aileron arrière était indispensable à l'homologation de la version rallye."]]);
  add("ford-sierra-rs-cosworth",
    "La Sierra RS Cosworth (1986) est produite à 5 000 exemplaires pour homologuer la Sierra en Groupe A. Elle reçoit le 2.0 YBB turbo, construit avec Cosworth, de 204 ch, et un aileron arrière qui est devenu sa signature. Elle domine ensuite les courses de voitures de tourisme (Groupe A) du milieu des années 1980. La variante RS500 (1987) a été produite à 500 exemplaires, avec 224 ch.\n\nLa Sierra Cosworth est devenue une icône du sport automobile britannique.",
    [["La RS500", "Seulement 500 exemplaires de la RS500 ont été produits pour l'homologation, et chacun a été préparé à la main par Tickford."]],
    [["Compétition", "Championne d'Europe des voitures de tourisme (ETCC) en 1987 avec Klaus Ludwig."]]);
  add("ford-focus-rs-mk3",
    null,
    [["Le mode Drift", "La Focus RS Mk3 est dotée d'un mode « Drift » qui répartit jusqu'à 100 % du couple moteur sur l'arrière."], ["Le Mustang EcoBoost", "Son 2.3 EcoBoost est le même bloc que celui de la Mustang EcoBoost."]]);
  add("ford-focus-st-170",
    "La Focus ST170 (2002) reçoit un 2.0 Duratec de 173 ch et un châssis durci. Elle est reconnaissable à ses jantes de 17 pouces et à son becquet. Elle est vendue en trois et cinq portes. Son comportement est vif et précis. La ST170 a été l'une des premières sportives de la gamme ST, créée par la division Ford Special Vehicle Engineering.\n\nElle était produite à Saarlouis (Allemagne) jusqu'en 2004.",
    [["La première ST", "La Focus ST170 a ouvert la lignée des Ford ST (Sport Technologies)."]]);
  add("ford-fiesta-st-mk6",
    "La Fiesta ST (Mk6, 2005) est équipée du 2.0 Duratec de 150 ch. Son comportement vif et son prix ont fait son succès. Elle est considérée comme l'une des meilleures petites sportives de sa décennie. Elle pèse environ 1 100 kg et offre un châssis neutre, un train avant incisif et un moteur plein.\n\nElle a été produite jusqu'en 2008.",
    [["La Fiesta de référence", "La Fiesta ST Mk6 est souvent citée parmi les plus agréables de la gamme."]]);
  add("ford-fiesta-st-mk7",
    "La Fiesta ST (Mk7, 2013) est équipée du 1.6 EcoBoost de 182 ch. Elle a été saluée par la presse pour son comportement et la précision de sa direction. La ST200 (2016) délivre 200 ch grâce à une fonction overboost. Elle offre un différentiel à gestion électronique de la répartition du couple, et un comportement très joueur.\n\nElle a été produite jusqu'en 2017.",
    [["Le 1.6 EcoBoost", "Ford a choisi un 1.6 turbo de 182 ch, en réduisant la cylindrée par rapport aux moteurs atmosphériques précédents."]]);
  add("vw-golf-gti-mk2",
    "La Golf GTI Mk2 (1984) est plus grande et plus lourde. Elle reçoit le 1.8 de 112 ch puis le 16V de 139 ch (1986). Les versions G60 sont à compresseur. Elle est produite jusqu'en 1992.\n\nSa silhouette carrée est devenue un classique des années 1980. La GTI Mk2 est aussi une base fréquente de préparation, appréciée pour sa simplicité mécanique.",
    [["La G60", "La Golf G60 (1990) avait un compresseur à spirale dont le nom G-Lader est resté célèbre, mais qui est réputé fragile."]]);
  add("vw-golf-gti-mk3",
    "La Golf GTI Mk3 (1992) est jugée trop lourde et moins vive que ses devancières. Elle reçoit le 2.0 de 115 ch (8V) puis le 16V de 150 ch. La Golf VR6 offre un V6 2.8 compact de 174 ch. Elle est moins appréciée que les Mk1 et Mk2.\n\nLa Mk3 a rencontré un succès commercial malgré les critiques.",
    [["La VR6", "Le VR6 est un V6 à angle très étroit (15°), conçu pour tenir dans le compartiment moteur d'une Golf."]]);
  add("vw-golf-gti-mk4",
    "La Golf GTI Mk4 (1998) est équipée du 1.8 turbo 20V de 150 ch, puis de 180 ch pour la 25th Anniversary (2002). Son intérieur est de qualité, très supérieur à la concurrence. La GTI TDI de 150 ch est une curiosité. La R32 (2002) offre le V6 3.2 de 241 ch et la transmission intégrale 4Motion avec la première boîte DSG de série.\n\nLa Mk4 est restée en production jusqu'en 2003.",
    [["La R32 et la DSG", "La Golf R32 a introduit la première boîte DSG de série, à double embrayage."]]);
  add("vw-golf-gti-mk5",
    "La Golf GTI Mk5 (2004) revient aux sources de la GTI avec le 2.0 TFSI de 200 ch et la boîte DSG en option. Elle est considérée comme l'un des grands retours de la GTI. L'Edition 30 (2006) offre 230 ch. Elle introduit aussi le fameux tissu à carreaux (Clark) sur les sièges.\n\nElle a été produite jusqu'en 2008.",
    [["Les sièges Clark", "Le tissu à carreaux « Clark » est un clin d'œil à la première GTI de 1976."]]);
  add("vw-golf-gti-mk6",
    "La Golf GTI Mk6 (2008) reprend le 2.0 TSI de 211 ch. La Edition 35 (2011) délivre 235 ch. Elle reçoit un nouveau design plus sobre et un intérieur plus moderne. Elle introduit aussi le différentiel autobloquant XDS+. Elle est vendue jusqu'en 2012.\n\nLa Mk6 a été critiquée comme un simple restylage de la Mk5.",
    [["Un restylage ?", "Plusieurs essais ont reproché à la Mk6 de n'être qu'une retouche de la Mk5."]]);
  add("vw-golf-gti-mk8",
    "La Golf GTI Mk8 (2020) reprend le 2.0 TSI de 245 ch. La Clubsport (2021) atteint 300 ch, et l'Edition 50, série spéciale qui célèbre les 50 ans de la GTI, 265 ch. L'intérieur est très numérique, avec des commandes tactiles qui ont été critiquées. Elle reste sur la plate-forme MQB.",
    [["50 ans de GTI", "L'Edition 50 célèbre en 2026 les 50 ans de la GTI, née en 1976."]]);
  add("seat-leon-fr-mk1",
    "La SEAT León Mk1 (1999) est la première León. La FR (Formula Racing, 2003) reçoit le 1.8T de 180 ch et le TDI 150. Elle est la compacte sportive de la gamme, avec la Cupra R de 225 ch. La León partage sa plate-forme avec la Golf Mk4 et l'Audi A3 8L.\n\nLa Cupra R (2003) est un modèle recherché.",
    [["Cousine de la Golf", "La León Mk1 partage sa base avec la Golf IV et l'Audi A3 8L."]]);
  add("seat-leon-fr-mk3",
    "La SEAT León Mk3 (2013) repose sur la plate-forme MQB. La FR reçoit le 1.4 TSI, le 1.8 TSI ou le 2.0 TDI. La Cupra 280 offre un 2.0 TSI de 280 ch. Elle est la cousine des Golf VII et Audi A3 8V.",
    [["Record du Nürburgring", "La León Cupra 280 (version Performance) a pris le record de la traction la plus rapide du Nürburgring en 2014."]],
    [["Nürburgring", "Record de la traction la plus rapide du Nürburgring en 2014 avec la León Cupra 280 (version à pack Performance)."]]);
  add("seat-leon-fr-mk4",
    "La SEAT León Mk4 (2020) reçoit des moteurs micro-hybrides (eTSI), diesel (TDI) et hybrides rechargeables (e-Hybrid de 204 ch). Elle adopte un tableau de bord numérique et des commandes tactiles. La Cupra León, devenue modèle de la marque Cupra, offre jusqu'à 310 ch.",
    [["Cupra, une marque à part", "La marque Cupra, issue de SEAT, est devenue indépendante en 2018."]]);
  /* Seules les clés connues sont conservées */
  MAKIT.enrich(m);
})();
