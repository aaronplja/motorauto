/** MOTORAUTO — compléments : Peugeot, Citroën, Renault (histoire, anecdotes, palmarès). */
(function () {
  "use strict";
  const m = {};
  const add = (id, h, a, r, rel) => { m[id] = { h, a: a || [], r: r || [], rel: rel || [], ap: true }; };

  /* ---------------- PEUGEOT 206 */
  add("peugeot-206-berline",
    "La Peugeot 206 est présentée en 1998 pour succéder à la 205. Dessinée sous la direction de Gérard Welter, avec des phares en amande et une calandre intégrée au pare-chocs, elle devient la Peugeot la plus vendue de l'histoire de la marque, avec plus de 8 millions d'exemplaires toutes versions confondues. Elle est produite à Poissy, Mulhouse, Ryton (Royaume-Uni) et dans plusieurs usines hors d'Europe.\n\nLa gamme s'étend de la 1.1 de 60 ch au 2.0 HDi, en passant par les versions sportives S16, RC et la WRC de compétition. La phase 2 (2003) reçoit de nouveaux feux et un tableau de bord retouché.",
    [["La plus vendue de la marque", "Avec plus de 8 millions de voitures, la 206 dépasse la 205 dans les statistiques de ventes."], ["Un phare en amande", "Le profil des optiques avant a marqué le style Peugeot du début des années 2000."]],
    [["Ventes", "Plus de 8 millions d'exemplaires produits dans le monde."]], ["peugeot-206-s16-gt", "peugeot-206-rc", "peugeot-206-wrc"]);
  add("peugeot-206-s16-gt",
    "La 206 S16 (1999) est la version sportive de la 206, équipée du 2.0 16V de 136 ch (puis 138 ch). Son équipement comprend des jantes de 16 pouces et un bouclier spécifique. La GT, plus discrète, partage son moteur.\n\nElle sert de base à l'homologation de la 206 WRC, engagée en rallye à partir de 1999.",
    [], [], ["peugeot-206-wrc", "peugeot-206-rc"]);
  add("peugeot-206-rc",
    "La 206 RC (2003), parfois appelée GTI 180, est la 206 la plus performante de la série de route, avec le 2.0 16V de 177 ch. Son châssis est durci et son habitacle reçoit des sièges baquets. Elle est reconnaissable à ses jantes de 17 pouces et à son bouclier avant spécifique.\n\nElle est proposée jusqu'en 2006 et sera remplacée par la 207 RC.",
    [["La GTI de Peugeot", "La 206 RC porte en France le nom de 206 GTI 180 dans le langage courant."]], [], ["peugeot-206-s16-gt", "peugeot-207-rc"]);
  add("peugeot-206-cc",
    "La 206 CC (2000) est le premier coupé-cabriolet à toit rigide rétractable en acier dans le segment des petites voitures. Conçu et construit en partenariat avec Heuliez, son toit en deux parties se range dans le coffre. Elle reçoit les moteurs 1.6 de 110 ch et 2.0 de 138 ch.\n\nLe concept a connu un grand succès commercial et a été copié par plusieurs concurrents.",
    [["Le toit en acier", "Le pliage du toit rigide, rare à cette époque sur une citadine, a été le grand argument de vente."]], [], ["peugeot-206-berline"]);
  add("peugeot-206-sw",
    "La 206 SW (2002) est le break de la 206. Sa ligne rallongée et son volume de coffre de 313 litres (jusqu'à 1 130 litres) en font une compacte familiale. Elle partage les moteurs de la berline, de 1.1 à 2.0 HDi, et reçoit un toit panoramique en option.\n\nElle a été produite jusqu'en 2007.",
    [], [], ["peugeot-206-berline"]);
  add("peugeot-206-plus",
    "La 206+ (2009) est un restylage de la 206 vendue en parallèle de la 207. Elle reçoit une face avant retouchée, inspirée de la 207, et des moteurs répondant à la norme Euro 5. C'est une offre de base destinée aux petits budgets.\n\nElle est restée en production jusqu'en 2013 en Europe, après plus de dix ans de carrière pour la 206.",
    [], [], ["peugeot-206-berline"]);
  add("peugeot-206-wrc",
    "La Peugeot 206 WRC débute en 1999 et remporte le championnat du monde des rallyes constructeurs en 2000, 2001 et 2002. Marcus Grönholm est sacré champion du monde pilotes en 2000 et 2002 au volant de cette voiture. Le règlement WRC permet des évolutions très poussées d'un modèle de série : transmission intégrale, moteur 2.0 turbo de 300 ch, suspensions longues.\n\nLa 206 WRC a été remplacée par la 307 WRC en 2004. Elle est restée dans les mémoires pour son efficacité sur terre et sur asphalte.",
    [["Grönholm, double champion", "Le Finlandais a gagné le titre en 2000 et 2002 avec la 206 WRC."]],
    [["Titres constructeurs", "2000, 2001 et 2002."], ["Titres pilotes", "Marcus Grönholm en 2000 et 2002."]], ["peugeot-206-s16-gt"]);
  add("peugeot-206-sedan",
    "La 206 Sedan (2006) est une version tricorps de la 206, destinée aux marchés émergents (Iran, Chine, Amérique du Sud). Elle partage la plate-forme et les moteurs de la 206 mais reçoit un coffre séparé. Elle est produite sous différents noms selon les pays, et reste en production en Iran bien après son arrêt en Europe.\n\nLa Peugeot 206 SD est un des modèles les plus vendus dans certains pays.",
    [], [], ["peugeot-206-berline"]);
  add("peugeot-206-quiksilver",
    "La 206 Quiksilver (2002) est une série spéciale née d'un partenariat avec la marque de vêtements de surf. Elle reçoit une peinture et des finitions spécifiques, des jantes alliage et un intérieur coloré. Elle est vendue en phases 1 (2002-2003) et 2 (2003-2005).\n\nElle illustre la stratégie de Peugeot de décliner la 206 pour séduire une clientèle jeune.",
    [], [], ["peugeot-206-berline"]);

  /* ---------------- PEUGEOT 205 */
  add("peugeot-205-berline",
    "La Peugeot 205 (1983) est dessinée en interne sous la direction de Gérard Welter. Cette citadine redonne un souffle à Peugeot après les difficultés de la fin des années 1970. Plus de 5 millions d'exemplaires ont été produits, dont la célèbre GTI. Elle reçoit les moteurs TU et XU à partir de 1983 puis les diesels XUD.\n\nProduite jusqu'en 1998, elle a été remplacée par la 206. Elle est l'une des voitures qui ont sauvé Peugeot.",
    [["La voiture qui a sauvé Peugeot", "Le succès de la 205 a redressé les finances du constructeur au milieu des années 1980."]],
    [["Ventes", "Plus de 5 millions d'exemplaires."]], ["peugeot-205-gti", "peugeot-205-t16"]);
  add("peugeot-205-gti",
    "La 205 GTI est lancée en 1984 avec le 1.6 de 105 ch, puis reçoit en 1986 le 1.9 de 130 ch. Légère (environ 900 kg), elle est célèbre pour son comportement vif et son train arrière à barres de torsion qui peut survirer.\n\nElle est devenue une icône des GTI des années 1980, rivale de la Golf GTI.",
    [["Survirage célèbre", "Le train arrière de la 205 GTI réagit vivement aux lever de pied, une caractéristique à la fois crainte et aimée."]], [], ["peugeot-205-berline", "peugeot-205-cti"]);
  add("peugeot-205-rallye",
    "La 205 Rallye (1988) est une version allégée et dépouillée, avec le 1.3 de 103 ch. Sans direction assistée, sans lève-vitres électriques, elle est conçue pour la course amateur. Elle pèse environ 790 kg et est célèbre pour sa vivacité.\n\nElle est devenue une référence des petites sportives abordables.",
    [], [], ["peugeot-205-gti"]);
  add("peugeot-205-cti",
    "La 205 CTI (1986) est le cabriolet de la gamme, dessiné et construit par Pininfarina. Il reprend les moteurs de la GTI (1.6 et 1.9). Sa capote manuelle est facile à manœuvrer et sa caisse a été renforcée.\n\nLa CTI a été produite jusqu'en 1994.",
    [], [], ["peugeot-205-gti"]);
  add("peugeot-205-t16",
    "La 205 Turbo 16 est la voiture de Peugeot Talbot Sport pour le Groupe B. Elle a un moteur 1.8 turbo à 16 soupapes placé au centre, la transmission intégrale et une carrosserie très élargie, bien que sa silhouette rappelle celle de la 205. Elle remporte le championnat du monde des rallyes constructeurs en 1985 et 1986, et les titres pilotes avec Timo Salonen (1985) et Juha Kankkunen (1986). Environ 200 exemplaires de route ont été produits pour l'homologation.\n\nLa version Grand Raid gagne le Paris-Dakar en 1987 et 1988. Elle est devenue une icône du rallye.",
    [["Salonen et Kankkunen", "Deux pilotes finlandais ont été champions du monde dans deux saisons consécutives avec la 205 T16."], ["Une 205 qui n'en est pas une", "La carrosserie suit les lignes d'une 205, mais le châssis est celui d'une voiture de course à moteur central."]],
    [["Titres constructeurs", "1985 et 1986."], ["Titres pilotes", "Timo Salonen (1985), Juha Kankkunen (1986)."], ["Paris-Dakar", "Victoires en 1987 et 1988."]], ["peugeot-205-berline"]);

  /* ---------------- PEUGEOT 306 */
  add("peugeot-306-berline",
    "La Peugeot 306 (1993) est le successeur de la 309. Son dessin est signé Pininfarina. Elle est proposée avec les moteurs TU, XU et XUD, et avec les diesels HDi à partir de 1999. Elle est produite à Poissy et Ryton jusqu'en 2002, et remplacée par la 307.\n\nLa 306 est restée populaire pour son comportement sain, sa suspension à train arrière à bras tirés et son bon rapport qualité/prix.",
    [["Pininfarina", "Le carrossier turinois a signé les 405, 406 et 306 de Peugeot."]], [], ["peugeot-306-s16", "peugeot-306-maxi"]);
  add("peugeot-306-s16",
    "La 306 S16 (1993) reçoit le 2.0 16V de 150 ch, puis 167 ch après l'adoption de la boîte BV6 à 6 rapports (1996). Son comportement équilibré lui vaut d'être considérée comme l'une des meilleures compactes sportives de sa génération.\n\nLa GTI-6 (BV6) est restée comme la plus sportive des 306 de route.",
    [["La BV6", "La boîte à 6 rapports fut une première pour une compacte de cette catégorie."]], [], ["peugeot-306-berline", "peugeot-306-maxi"]);
  add("peugeot-306-cabriolet",
    "La 306 Cabriolet (1994) est dessinée et construite par Pininfarina, dont le savoir-faire a donné à Peugeot ses plus beaux cabriolets. Elle reçoit le 1.8 de 112 ch et le 2.0 de 135 ch. Sa capote manuelle est ensuite remplacée par une version électrique.\n\nElle a été produite jusqu'en 2002.",
    [], [], ["peugeot-306-berline"]);
  add("peugeot-306-break",
    "La 306 Break (1997) est la version familiale. Son coffre de 480 litres et sa banquette rabattable en font un véhicule polyvalent. Elle partage les moteurs de la berline, y compris les diesels HDi.\n\nElle a été arrêtée en 2002.",
    [], [], ["peugeot-306-berline"]);
  add("peugeot-306-maxi",
    "La 306 Maxi est une voiture de rallye kit-car à deux roues motrices, développée par Peugeot Sport à partir de 1995. Équipée d'un 2.0 16V de près de 300 ch, elle remporte de nombreuses courses sur asphalte. Gilles Panizzi la pilote avec succès sur asphalte, notamment dans le championnat de France.\n\nLe règlement kit-car permet une carrosserie élargie et un moteur très poussé, mais une transmission à deux roues motrices.",
    [], [], ["peugeot-306-s16"]);

  /* ---------------- PEUGEOT 106 / 309 / 406 / 207 */
  add("peugeot-106-berline",
    "La Peugeot 106 (1991) est la petite citadine de Peugeot, sœur de la Citroën Saxo. Elle est produite à Mulhouse jusqu'en 2003. Elle reçoit des moteurs TU de 1.0 à 1.6 litre et des diesels. Elle existe aussi en version électrique.\n\nElle devient une référence des petites sportives avec les versions XSI, Rallye et S16.",
    [], [], ["peugeot-106-xsi", "peugeot-106-rallye"]);
  add("peugeot-106-xsi",
    "La 106 XSI (1992) est la première 106 sportive, avec un moteur 1.4 de 100 ch puis 1.6 de 105 ch. Elle se reconnaît à ses jantes alliage et à ses boucliers spécifiques.\n\nElle est la voie d'accès à la gamme sportive de la 106.",
    [], [], ["peugeot-106-berline", "peugeot-106-s16"]);
  add("peugeot-106-rallye",
    "La 106 Rallye (1993) est une version allégée à moteur 1.3 de 100 ch puis 1.6 de 103 ch. Peu équipée, elle pèse environ 800 kg. Elle est très populaire dans les rallyes amateurs, où elle a lancé de nombreux pilotes.\n\nSa série 2 (1997) conserve ce caractère.",
    [["La voiture des débutants", "La 106 Rallye est l'une des petites sportives les plus utilisées en rallye amateur en France."]], [], ["peugeot-106-s16"]);
  add("peugeot-106-s16",
    "La 106 S16 (1996) reçoit un 1.6 16V de 118 ch. Son comportement est vif, avec un châssis équilibré et des freins renforcés.\n\nElle est la 106 la plus performante de la série de route.",
    [], [], ["peugeot-106-xsi", "peugeot-106-rallye"]);
  add("peugeot-309-berline",
    "La Peugeot 309 (1985) est la première Peugeot produite à Ryton (Royaume-Uni) en association avec la gamme Talbot. Elle remplace la Talbot Horizon. Son dessin est signé par Peugeot et elle reçoit des moteurs XY, XU et des diesels XUD.\n\nProduite jusqu'en 1993, elle est remplacée par la 306.",
    [], [], ["peugeot-309-gti"]);
  add("peugeot-309-gti",
    "La 309 GTI (1987) reçoit le 1.9 de 130 ch, puis la GTI 16 (1990) le 1.9 16V de 160 ch.  Son comportement est réputé pour sa vivacité.\n\nElle est la grande sœur sportive de la 205 GTI.",
    [], [], ["peugeot-309-berline", "peugeot-205-gti"]);
  add("peugeot-406-berline-break",
    "La Peugeot 406 (1995) est dessinée par Pininfarina. Elle remplace la 405 et reçoit des moteurs 1.8, 2.0, V6 3.0 et diesels HDi. Sa réputation de confort et de tenue de route est excellente. La 406 est aussi la voiture du film « Taxi » (1998).\n\nProduite jusqu'en 2004, elle est remplacée par la 407.",
    [["Taxi", "Le film de Luc Besson (1998) met en scène une 406 blanche."]], [], ["peugeot-406-coupe", "peugeot-406-silhouette"]);
  add("peugeot-406-coupe",
    "Le 406 Coupé (1997) est dessiné par Pininfarina, qui le construit à Grugliasco. Il est proposé avec le 2.0 16V de 135 ch, le 2.2 et le V6 3.0 de 190 ch. Sa ligne est reconnue comme l'une des plus belles de la production Peugeot.\n\nIl est resté en production jusqu'en 2004 et a été restylé en 2003.",
    [["Un dessin primé", "Le Coupé 406 est considéré comme l'un des plus beaux coupés des années 1990."]], [], ["peugeot-406-berline-break"]);
  add("peugeot-406-break",
    "La 406 Break (1996) est le break de la gamme. Elle propose un coffre de 560 litres, extensible, et partage ses moteurs avec la berline.\n\nElle a été produite jusqu'en 2004.",
    [], [], ["peugeot-406-berline-break"]);
  add("peugeot-406-silhouette",
    "La 406 Silhouette est une voiture de compétition tubulaire engagée en Supertourisme par Peugeot Sport. Elle ne ressemble que de loin à la 406 de série : un châssis tubulaire, un V6 de plus de 300 ch et une carrosserie fine en fibre.\n\nLa 406 a été engagée dans plusieurs championnats nationaux au tournant des années 2000.",
    [], [], ["peugeot-406-coupe"]);
  add("peugeot-207-rc",
    "La 207 RC (2007) est la sportive de la gamme 207. Elle reçoit le 1.6 THP de 175 ch, un moteur turbo développé avec BMW (famille Prince). La 207 RC reprend le flambeau des 205 GTI et 206 RC.\n\nElle est remplacée par la 208 GTI.",
    [["Moteur BMW", "Le 1.6 THP est issu de la collaboration entre PSA et BMW dans les moteurs de petite cylindrée."]], [], ["peugeot-206-rc"]);
  add("peugeot-207-s2000",
    "La 207 S2000 est la voiture de rallye de Peugeot Sport, répondant au règlement S2000 (2.0 atmosphérique, transmission intégrale). Elle remporte l'Intercontinental Rally Challenge 2009 avec Kris Meeke.\n\nLa 207 S2000 a été utilisée en Europe jusqu'en 2012.",
    [], [["IRC 2009", "Kris Meeke est sacré champion de l'Intercontinental Rally Challenge."]], ["peugeot-207-rc"]);

  /* ---------------- CITROËN */
  add("saxo-berline",
    "La Citroën Saxo (1996) remplace l'AX et partage sa plate-forme avec la Peugeot 106. Elle est assemblée à Vigo, en Espagne. Elle reçoit les moteurs TU de 1.0 à 1.6 litre et les diesels. Son style simple et ses coloris ont séduit un public jeune.\n\nElle est remplacée par la C2 en 2003.",
    [], [], ["saxo-vts", "saxo-s1600", "saxo-electrique"]);
  add("saxo-vts",
    "La Saxo VTS (1996) est la version sportive, avec le 1.6 de 90 ch (8V) puis 120 ch (16V). Elle devient une icône des jeunes passionnés et des rassemblements.\n\nLa VTS est aussi la voiture de nombreux pilotes de rallye amateurs.",
    [["La voiture des jeunes", "La Saxo VTS est devenue une figure culte de la scène tuning française."]], [], ["saxo-berline", "saxo-s1600"]);
  add("saxo-s1600",
    "La Saxo Super 1600 est la voiture de rallye de Citroën Racing, conforme au règlement Super 1600 (1.6 atmosphérique de 215 ch). Sébastien Loeb remporte le championnat du monde junior (JWRC) 2001 avec cette voiture, avant d'intégrer l'équipe WRC de Citroën.\n\nLa Saxo S1600 est une étape clé dans la carrière du pilote le plus titré du rallye.",
    [["Le début de Loeb", "Avant ses neuf titres mondiaux, Loeb s'est fait connaître sur la Saxo S1600."]], [["JWRC 2001", "Sébastien Loeb, champion du monde junior."]], ["saxo-vts", "citroen-xsara-wrc"]);
  add("saxo-electrique",
    "La Saxo électrique (1997) est une des premières voitures électriques de série. Elle est équipée d'un moteur de 20 kW (27 ch) et de batteries nickel-cadmium, avec une autonomie d'environ 80 km. Elle est vendue notamment à des flottes de collectivités.\n\nSa vitesse de pointe est de 91 km/h. Elle est arrêtée en 2003.",
    [], [], ["saxo-berline"]);
  add("citroen-xsara-vts",
    "La Xsara VTS (1997) est la version sportive de la Xsara, avec le 2.0 16V de 167 ch. Elle est produite en trois portes. Son comportement est vif.\n\nElle est proposée jusqu'en 2004.",
    [], [], ["citroen-xsara-kit-car"]);
  add("citroen-xsara-kit-car",
    "La Xsara Kit Car est la voiture de rallye à deux roues motrices de Citroën Sport (1998-2001). Équipée d'un 2.0 de 280 ch et très légère, elle domine le championnat de France. Elle sert de banc d'essai pour les pilotes de la marque.\n\nElle a remporté plusieurs titres nationaux avant l'engagement de la Xsara WRC.",
    [], [], ["citroen-xsara-wrc"]);
  add("citroen-xsara-wrc",
    "La Xsara WRC (2001) est la voiture qui a donné à Citroën ses premiers titres mondiaux des rallyes. Elle est équipée d'un 2.0 turbo de 315 ch avec transmission intégrale. Sébastien Loeb remporte le titre pilotes en 2004 et 2005 avec cette voiture. Citroën gagne le championnat constructeurs en 2003, 2004 et 2005.\n\nLa Xsara WRC est remplacée par la C4 WRC en 2007.",
    [["Loeb champion", "Sébastien Loeb a gagné ses deux premiers titres en 2004 et 2005 au volant de la Xsara WRC."]],
    [["Titres constructeurs", "2003, 2004 et 2005."], ["Titres pilotes", "Sébastien Loeb en 2004 et 2005."]], ["saxo-s1600"]);

  /* ---------------- RENAULT */
  add("renault-clio-williams-16s",
    "La Clio 16S (1991) est équipée d'un 1.8 16V de 137 ch. La Clio Williams (1993) reçoit le 2.0 16V de 150 ch, une suspension abaissée et des jantes dorées. La Williams est limitée à 3 800 exemplaires environ.\n\nElle porte le nom de l'écurie de Formule 1 partenaire de Renault.",
    [["Des jantes dorées", "Les jantes dorées et la peinture bleue sont devenues emblématiques de la Williams."]], [], ["renault-clio-2-rs"]);
  add("renault-clio-2-rs",
    "La Clio 2 R.S. (2000), connue sous le nom de 172 puis 182 (2002), est équipée d'un 2.0 16V de 172 puis 182 ch. Elle est un modèle de référence de la catégorie des GTI compactes. L'édition Ragnotti (2003) célèbre le pilote de rallye Jean Ragnotti.\n\nLa 182 Trophy reste un modèle recherché.",
    [["Ragnotti", "Jean Ragnotti est un pilote de rallye français lié à l'histoire de Renault."]], [], ["renault-clio-williams-16s", "renault-clio-3-rs"]);
  add("renault-clio-3-rs",
    "La Clio 3 R.S. (2006) est équipée d'un 2.0 atmosphérique de 197 puis 200 ch. Elle est très appréciée pour son comportement.\n\nElle accélère de 0 à 100 km/h en 6,9 secondes.",
    [], [], ["renault-clio-2-rs", "renault-clio-4-rs"]);
  add("renault-clio-4-rs",
    "La Clio 4 R.S. (2013) abandonne le moteur atmosphérique pour un 1.6 turbo de 200 ch, puis 220 ch dans la version Trophy, avec la boîte EDC à double embrayage. Un concept Clio R.S. 16, dévoilé en 2016, atteint 275 ch.\n\nElle est la dernière Clio R.S. à moteur thermique.",
    [], [], ["renault-clio-3-rs"]);
  add("renault-megane-2-rs",
    "La Mégane 2 R.S. (2004) reçoit un 2.0 turbo de 225 ch, puis 230 ch pour la R26.R (2008). La R26.R, allégée de 123 kg, établit en 2008 un record de temps au Nürburgring pour une voiture à traction.\n\nElle est considérée comme l'une des meilleures GTI traction de son époque.",
    [["Record au Nürburgring", "La R26.R a battu en 2008 le record du tour du Nürburgring pour une traction avant de série."]], [], ["renault-megane-3-rs"]);
  add("renault-megane-3-rs",
    "La Mégane 3 R.S. (2009) est équipée du 2.0 turbo de 250 ch, puis 265 ch (Trophy) et 275 ch (Trophy-R). La Trophy-R (2014) établit un record du Nürburgring pour une traction avant de série en 7 minutes 54 secondes.\n\nElle est proposée avec le châssis Cup, plus ferme.",
    [], [["Nürburgring 2014", "Record des tractions avant de série en 7 min 54 s avec la Trophy-R."]], ["renault-megane-2-rs", "renault-megane-4-rs"]);
  add("renault-megane-4-rs",
    "La Mégane 4 R.S. (2018) reçoit un 1.8 turbo de 280 ch, puis 300 ch pour la Trophy. La Trophy-R (2019) établit un nouveau record du Nürburgring pour une traction avant en 7 minutes 40 secondes. Elle bénéficie d'un système de quatre roues directrices (4Control).\n\nElle est la dernière Mégane R.S. thermique.",
    [], [["Nürburgring 2019", "Record des tractions avant en 7 min 40 s avec la Trophy-R."]], ["renault-megane-3-rs"]);
  add("renault-clio-v6",
    "La Clio V6 (2001) est une Clio à moteur V6 3.0 central, développée avec TWR et assemblée à Uddevalla (Suède). Elle délivre 230 ch (Phase 1) puis 255 ch (Phase 2, 2003). Sa carrosserie élargie et sa position de conduite basse en font une voiture radicale.\n\nSon comportement est réputé difficile à la limite.",
    [["Moteur central", "Le V6 est placé à la place de la banquette arrière de la Clio."]], [], ["renault-clio-2-rs", "renault-spider"]);
  add("renault-spider",
    "Le Renault Sport Spider (1996) est un roadster léger à châssis en aluminium collé et carrosserie en composite. Il pèse environ 930 kg et reçoit le 2.0 de 150 ch placé au centre. Une version sans pare-brise existe. Il est assemblé à Dieppe par Alpine.\n\nIl accélère de 0 à 100 km/h en 6,5 secondes.",
    [["Une version sans pare-brise", "Le Spider « saute-vent » n'a qu'un déflecteur à la place du pare-brise."]], [], ["renault-clio-v6"]);

  MAKIT.enrich(m);
})();
