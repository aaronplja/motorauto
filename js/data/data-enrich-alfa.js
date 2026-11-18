/** MOTORAUTO — compléments Alfa Romeo : histoire détaillée, anecdotes, palmarès. */
(function () {
  "use strict";
  const m = {};
  const add = (id, h, a, r, rel) => { m["alfa-romeo-" + id] = { h, a: a || [], r: r || [], rel: (rel || []).map((x) => "alfa-romeo-" + x), ap: true }; };

  add("145",
    "L'Alfa Romeo 145, présentée en 1994, remplace l'Alfa 33. Elle est construite à Pomigliano d'Arco, près de Naples, sur la base de la Fiat Tipo. C'est la dernière Alfa à moteur boxer (quatre cylindres à plat, 1.3 à 1.7 litres), avant l'arrivée en 1995 du Twin Spark, un moteur à double allumage par cylindre, en 1.8 et 2.0 litres. Sa silhouette à hayon, plongeante et bossue, divise : on l'aime ou on la déteste.\n\nLa 145 Quadrifoglio Verde (1997), avec le 2.0 Twin Spark de 150 ch, en est la version sportive. La 145 est remplacée en 2001 par la 147.",
    [["La fin du boxer", "La 145 est la dernière Alfa à recevoir le moteur boxer de l'Alfasud, créé en 1971."], ["Le Twin Spark", "Le moteur à double allumage a été développé pour améliorer la combustion et réduire les émissions."]],
    [["Production", "De 1994 à 2001."]], ["145-quadrifoglio-verde", "147"]);
  add("145-quadrifoglio-verde",
    "La 145 Quadrifoglio Verde apparaît en 1997 avec le moteur 2.0 Twin Spark de 150 ch. Le trèfle à quatre feuilles vert est le symbole de l'Alfa Romeo sportive depuis 1923, quand Ugo Sivocci le dessina sur sa voiture de course avant de gagner la Targa Florio. La QV reçoit des suspensions durcies, des jantes de 16 pouces et des sièges sport.\n\nElle est restée en production jusqu'en 2001.",
    [["Le quadrifoglio", "Le trèfle à quatre feuilles est devenu en 1923 le porte-bonheur des Alfa de course."]], [], ["145", "147-gta"]);
  add("147",
    "L'Alfa Romeo 147 (2000) est dessinée par Walter de Silva et remporte le titre de Voiture européenne de l'année 2001. Elle remplace la 145 et la 146 et reçoit les moteurs Twin Spark (1.6, 2.0), le V6 3.2 de la GTA et les diesels JTD. Son style, avec le bouclier en V qui descend jusqu'au pare-chocs et les poignées arrière dissimulées, est un classique de l'Alfa moderne.\n\nElle est restylée en 2004 puis arrêtée en 2010, remplacée par la Giulietta.",
    [["Voiture de l'année 2001", "La 147 a remporté le titre européen en 2001."]],
    [["Voiture européenne de l'année", "Titre obtenu en 2001."]], ["147-gta", "145"]);
  add("147-gta",
    "La 147 GTA (2002) loge le V6 Busso 3.2 litres de 250 ch sous le capot de la compacte à traction avant, une opération qui a demandé de renforcer le châssis et la boîte (Selespeed). Elle accélère de 0 à 100 km/h en 6,3 secondes et atteint 246 km/h. Son nom rappelle la Giulia Sprint GTA des années 1960 (GTA pour Gran Turismo Alleggerita).\n\nElle est reconnaissable à ses jantes de 18 pouces, à ses bas de caisse spécifiques et à son bouclier avant plus agressif.",
    [["GTA, un sigle d'histoire", "GTA signifie Gran Turismo Alleggerita : version allégée de la Giulia Sprint GT de 1965."]], [["0 à 100 km/h", "6,3 secondes."]], ["147", "156-gta"]);
  add("155",
    "L'Alfa Romeo 155 (1992) succède à la 75 et abandonne la propulsion pour la traction avant, sur la plate-forme de la Fiat Tipo. Ce choix, jugé trahison par les puristes, est compensé par des moteurs Twin Spark et un V6 2.5. La 155 Q4 emprunte la transmission intégrale à la Lancia Delta Integrale.\n\nLa 155 a connu un grand succès en compétition avec la 155 V6 TI, qui a gagné le DTM en 1993. Elle est remplacée par la 156 en 1997.",
    [["La première Alfa à traction", "Passer à la traction avant a été un choc pour les alfistes, attachés à la propulsion de la 75."]], [], ["155-q4", "155-v6-ti-dtm"]);
  add("155-q4",
    "La 155 Q4 est une berline à transmission intégrale, avec le 2.0 turbo 16 soupapes de 190 ch emprunté à la Lancia Delta Integrale, ainsi que ses trois différentiels. Elle accélère de 0 à 100 km/h en 6,7 secondes.\n\nLa 155 Q4 a été conçue pour concurrencer les BMW M3 et Audi sur le terrain de la berline sportive à quatre roues motrices.",
    [["La Delta dans la 155", "La Q4 partage son moteur et sa transmission avec la Lancia Delta Integrale Evoluzione."]], [], ["155", "155-v6-ti-dtm"]);
  add("155-v6-ti-dtm",
    "En 1993, Alfa Romeo engage la 155 V6 TI dans le championnat allemand de voitures de tourisme (DTM). Développée avec Fiat et Abarth, elle est animée par un V6 2,5 litres de 400 ch et transmet sa puissance aux quatre roues. Nicola Larini est champion en 1993, devant les Mercedes et les BMW.\n\nLe DTM devient l'ITC en 1996, mais Alfa se retire à la fin de la saison. Les 155 DTM font partie des voitures de course de tourisme les plus mémorables.",
    [["Larini champion", "Nicola Larini a gagné le DTM 1993 au volant de la 155 V6 TI."]], [["Champion DTM 1993", "Nicola Larini."]], ["155", "155-q4"]);
  add("156",
    "L'Alfa Romeo 156 (1997) est dessinée par Walter de Silva et Alfa Romeo Centro Stile. Elle remporte le titre de Voiture européenne de l'année 1998. Ses poignées de portes arrière sont dissimulées dans le montant pour donner l'illusion d'un coupé. Elle reçoit les moteurs Twin Spark, le V6 Busso 2.5 de 190 ch et des diesels JTD à rampe commune, dont l'Alfa a été pionnière avec l'Alfa 156 JTD en 1997.\n\nLa 156 est restylée en 2003 et remplacée par la 159 en 2005. Elle est considérée comme la voiture qui a relancé Alfa Romeo.",
    [["Le JTD", "Le diesel JTD à rampe commune a été lancé sur la 156 : l'Alfa a été la première voiture à rampe commune en série."]],
    [["Voiture européenne de l'année", "Titre obtenu en 1998."]], ["156-sportwagon", "156-gta"]);
  add("156-sportwagon",
    "La 156 Sportwagon (2000) est le break de la gamme. Elle conserve les lignes de la berline avec un grand coffre. Sa ligne était jugée plus élégante que celle de la concurrence. Elle est proposée avec les mêmes moteurs que la berline, dont le Twin Spark et le JTD.\n\nElle a été produite jusqu'en 2006.",
    [], [], ["156", "156-gta"]);
  add("156-gta",
    "La 156 GTA (2002) reçoit le V6 Busso 3.2 de 250 ch, avec une boîte manuelle à 6 rapports ou la Selespeed. Elle accélère de 0 à 100 km/h en 6,3 secondes et atteint 250 km/h. Elle se reconnaît à son capot à prise d'air, à ses bas de caisse et à ses jantes de 17 pouces. Elle est proposée en berline et en Sportwagon.\n\nLa 156 GTA est considérée comme l'une des meilleures berlines sportives de son époque pour le son de son V6.",
    [["Le V6 Busso", "Ce moteur a été conçu par Giuseppe Busso dans les années 1970 et a équipé les Alfa pendant plus de 30 ans."]], [["0 à 100 km/h", "6,3 secondes."]], ["147-gta", "156"]);
  add("159",
    "L'Alfa Romeo 159 (2005) est dessinée par Giorgetto Giugiaro (Italdesign) et remplace la 156. Elle repose sur la plate-forme GM Premium, partagée avec la Saab 9-3. Ses moteurs vont du 1.9 JTS au V6 3.2 JTS de 260 ch, avec la transmission Q4, et aux diesels JTDm.\n\nPlus lourde que la 156, elle est critiquée pour son poids mais admirée pour son style. Elle est produite jusqu'en 2011 et remplacée par la Giulia en 2015, après un long intervalle.",
    [["Giugiaro à l'Alfa", "Le designer a également signé l'Alfasud et l'Alfetta GT."], ["Une plate-forme GM", "L'architecture est issue de la collaboration entre Fiat et General Motors du début des années 2000."]],
    [], ["156", "brera"]);
  add("164",
    "L'Alfa Romeo 164 (1987) est la dernière Alfa à avoir été conçue en grande partie sur une plate-forme partagée : celle de la Fiat Croma, de la Lancia Thema et de la Saab 9000 (Type Four). Elle est dessinée par Pininfarina et propose le V6 Busso 3.0 de 192 ch ou le V6 2.0 turbo. La 164 Q4 (1994), à transmission intégrale, est la dernière évolution.",
    [["Une Alfa fabriquée avec Saab", "La plate-forme Type Four associait Fiat, Alfa, Lancia et Saab."]], [], ["164-super", "166"]);
  add("164-super",
    "La 164 Super (1992) est une évolution de la 164, avec des finitions améliorées et un V6 3.0 24 soupapes (210 ch). Les finitions et les phares sont revus. Elle est proposée en V6 24V et en Q4.\n\nElle sera remplacée par la 166 en 1998.",
    [], [], ["164", "166"]);
  add("166",
    "L'Alfa Romeo 166 (1998) est la berline de haut de gamme de la marque, remplaçante de la 164. Elle reçoit le V6 Busso 3.0 24V de 226 ch, un V6 2.5 de 190 ch et des diesels JTD. Sa ligne est caractéristique par son bouclier en trèfle et ses phares enveloppants.\n\nLa 166 est restylée en 2003 avec le V6 3.2 JTS de 240 ch à injection directe. Elle est arrêtée en 2007 sans successeur direct.",
    [], [], ["164-super", "159"]);
  add("gtv-916",
    "Le coupé GTV (1994), dessiné par Pininfarina (Enrico Fumia), est présenté avec le Spider 916. La plate-forme dérive de la Fiat Tipo, avec des suspensions arrière multibras. Il est proposé avec les Twin Spark (2.0) et le V6 3.0 24V de 220 ch. Son profil en coin, avec les deux feux de jour à l'avant, est resté célèbre.\n\nLe GTV a été restylé en 1998 puis en 2003. Il a été produit jusqu'en 2005.",
    [["La silhouette 916", "Le dessin d'Enrico Fumia a fait entrer l'Alfa dans les années 1990 avec une ligne tendue et originale."]], [], ["spider-916", "gt"]);
  add("spider-916",
    "Le Spider 916 (1995) est le cabriolet dessiné par Pininfarina, jumeau du GTV. Il reçoit les Twin Spark et le V6 3.0 de 220 ch. Sa capote électrique se range sans coffre de capote apparent. Il hérite de la silhouette en coin et des feux avant de la GTV.\n\nIl reste en production jusqu'en 2005.",
    [], [], ["gtv-916", "spider-939"]);
  add("gt",
    "L'Alfa Romeo GT (2003) est un coupé construit chez Bertone, à Grugliasco, sur la base de la 156. Il est proposé avec les moteurs Twin Spark, le V6 3.2 de 240 ch et les diesels JTD. Son profil de coupé 2+2 reprend les codes de la gamme.\n\nLa GT est restée en production jusqu'en 2010, mais n'a pas connu de succès commercial durable, éclipsée par la Brera.",
    [], [], ["gtv-916", "brera"]);
  add("brera",
    "La Brera est un coupé dessiné par Giugiaro (Italdesign), d'abord présenté en concept à Genève en 2002, puis en version de série en 2005. Elle est assemblée chez Pininfarina à Turin (San Giorgio Canavese). Elle reprend la base de l'Alfa 159, avec les moteurs 2.2 JTS, V6 3.2 JTS Q4 et JTDm.\n\nLa Brera séduit pour sa silhouette mais est jugée lourde. Un Spider Brera (939) arrive en 2006.",
    [["Un concept de Giugiaro", "La Brera concept a rencontré un tel succès que sa production a été décidée."]], [], ["spider-939", "159"]);
  add("spider-939",
    "Le Spider 939 (2006), construit chez Pininfarina, est la version décapotable de la Brera. Il reprend la plate-forme de l'Alfa 159 et propose le 2.2 JTS de 185 ch ou le V6 3.2 de 260 ch. Il est lourd mais conserve la ligne en coin de la Brera.\n\nIl a été arrêté en 2010.",
    [], [], ["brera"]);
  add("mito",
    "L'Alfa Romeo MiTo (2008) tient son nom de Milan (où elle a été conçue) et de Turin (où elle est assemblée, à Mirafiori). Elle repose sur la plate-forme de la Fiat Grande Punto, mais son style (feux ronds, bouclier en V) est inspiré de l'Alfa 8C Competizione. Elle propose le 1.4 TB MultiAir de 135 à 170 ch, le diesel 1.3 JTDm et le 1.4 TB.\n\nLa MiTo a été vendue jusqu'en 2018, sans successeur direct.",
    [["Une 8C en miniature", "La face avant de la MiTo reprend les phares de l'Alfa 8C Competizione."], ["DNA", "Le sélecteur DNA (Dynamic, Normal, All weather) permet de modifier la réponse de la voiture."]], [], ["mito-quadrifoglio-verde", "8c-competizione"]);
  add("mito-quadrifoglio-verde",
    "La MiTo Quadrifoglio Verde (2009) reçoit le 1.4 turbo MultiAir de 170 ch, un moteur novateur qui régule l'ouverture des soupapes d'admission par voie électro-hydraulique. Elle accélère de 0 à 100 km/h en 7,3 secondes. Ses suspensions sont durcies et sa boîte est manuelle à 6 rapports.\n\nElle a été produite jusqu'en 2018.",
    [["Le MultiAir", "Cette technologie, conçue par Fiat, supprime l'arbre à cames d'admission."]], [], ["mito"]);
  add("giulietta-940",
    "L'Alfa Romeo Giulietta (2010) succède à la 147. Elle repose sur la plate-forme Compact. Elle reçoit le système DNA, le 1.4 TB MultiAir de 170 ch, le 1750 TBi de 235 ch (QV) et les diesels JTDm. Elle obtient cinq étoiles aux crash-tests Euro NCAP.\n\nElle a été restylée en 2016 et arrêtée en 2020.",
    [["Cinq étoiles Euro NCAP", "La Giulietta a été l'une des compactes les mieux notées lors de ses essais."]], [], ["giulietta-quadrifoglio-verde", "mito"]);
  add("giulietta-quadrifoglio-verde",
    "La Giulietta Quadrifoglio Verde (2010) reçoit le 1750 TBi de 235 ch, un moteur en aluminium partagé avec la 4C (à une puissance différente). Elle accélère de 0 à 100 km/h en 6,8 secondes et atteint 244 km/h. Ses suspensions sont plus fermes.",
    [], [], ["giulietta-940", "4c"]);
  add("8c-competizione",
    "L'Alfa Romeo 8C Competizione est un coupé dévoilé en 2003 à Francfort, puis produit entre 2007 et 2009 à 500 exemplaires par Maserati à Modène. Elle est animée par un V8 4.7 d'origine Ferrari/Maserati de 450 ch. Sa carrosserie est en fibre de carbone, et sa ligne rappelle l'Alfa 8C 2900 des années 1930.\n\nElle a été vendue sur le marché américain à environ 250 000 dollars. La version Spider est présentée en 2008.",
    [["Un V8 Ferrari", "Le moteur est issu de la famille de V8 de Maserati."], ["500 exemplaires", "La production limitée a été vendue dès l'annonce."]], [["Rareté", "500 exemplaires."]], ["8c-spider", "mito"]);
  add("8c-spider",
    "L'Alfa Romeo 8C Spider (2008) est le roadster dérivé de la Competizione. Il utilise le même V8 4.7 de 450 ch, avec une capote en toile et une boîte robotisée à 6 rapports. Il a également été produit à 500 exemplaires, à Modène chez Maserati.\n\nSon style est un hommage aux Alfa des années 1930.",
    [], [["Rareté", "500 exemplaires."]], ["8c-competizione"]);
  add("4c",
    "L'Alfa Romeo 4C (2013) est la sportive légère de la marque, avec un monocoque en fibre de carbone qui ne pèse que 65 kg. Le moteur 1750 TBi de 240 ch est placé en position centrale arrière et l'ensemble pèse environ 895 kg à vide. Elle accélère de 0 à 100 km/h en 4,5 secondes. Elle est assemblée à Modène chez Maserati.\n\nLa 4C est critiquée pour sa direction non assistée et son confort sommaire, mais saluée pour son comportement et sa sonorité.",
    [["Un monocoque de 65 kg", "Le châssis en carbone est un luxe rare pour une voiture de ce prix."]], [["Poids", "Environ 895 kg à vide."]], ["4c-spider", "giulietta-quadrifoglio-verde"]);
  add("4c-spider",
    "La 4C Spider (2015) reçoit un toit en toile amovible. Elle utilise la même mécanique, le 1750 TBi de 240 ch, avec une boîte TCT à double embrayage. Elle accélère de 0 à 100 km/h en 4,5 secondes.\n\nElle est restée en production jusqu'en 2020.",
    [], [], ["4c"]);
  add("giulia-952",
    "L'Alfa Romeo Giulia (2015) est la berline propulsion qui marque le retour de l'Alfa au haut de gamme. Elle repose sur la nouvelle plate-forme Giorgio, développée à Modène. Elle est proposée avec les moteurs 2.0 turbo essence de 200 à 280 ch et diesel 2.2 JTDm. Le nom Giulia rappelle la berline des années 1960.\n\nLa Giulia a été saluée pour son comportement, sa direction directe et sa légèreté.",
    [["Le retour de la propulsion", "La Giulia est la première Alfa de ce segment à propulsion depuis la 75."]], [], ["giulia-quadrifoglio", "giulia-gta"]);
  add("giulia-quadrifoglio",
    "La Giulia Quadrifoglio (2015) est animée par un V6 2.9 biturbo de 510 ch, un moteur dérivé de celui de Ferrari et développé avec celle-ci. Elle accélère de 0 à 100 km/h en 3,9 secondes. En 2016, elle établit un record du Nürburgring pour une berline de série, en 7 minutes 32 secondes.\n\nElle est proposée avec une boîte automatique à 8 rapports.",
    [["Un record au Nürburgring", "En 2016, la Giulia QV a battu le record des berlines de série sur la Nordschleife."]], [["Nürburgring", "7 min 32 s en 2016, record des berlines de série à l'époque."]], ["giulia-952", "giulia-gta"]);
  add("giulia-gta",
    "La Giulia GTA (2020) célèbre les 110 ans d'Alfa Romeo. Elle reprend le V6 2.9 biturbo, poussé à 540 ch, et est allégée de 100 kg grâce à la fibre de carbone. La GTAm, à deux places, enlève la banquette arrière. Elle est produite à 500 exemplaires.\n\nLe nom GTA fait référence à la Giulia Sprint GTA de 1965, la version allégée de course.",
    [["500 exemplaires", "La série est répartie entre GTA et GTAm."]], [["Rareté", "500 exemplaires."]], ["giulia-quadrifoglio", "giulia-sprint-gt-105"]);
  add("33-stradale",
    "L'Alfa Romeo 33 Stradale (1967) est une voiture de route dérivée de la Tipo 33 de course. Elle est dessinée par Franco Scaglione, qui a signé les courbes de la Giulietta Sprint Bertone. Son V8 2.0 de 230 ch tourne à 8 800 tr/min. Seulement 18 exemplaires ont été construits ce qui fait d'elle l'une des Alfa les plus rares et les plus chères.\n\nLes portes papillon et les lignes sensuelles de la 33 Stradale en font un chef-d'œuvre du design italien.",
    [["Un dessin de Scaglione", "Franco Scaglione, qui a dessiné la Giulietta Sprint Bertone, est l'auteur de la 33 Stradale."], ["Seulement 18 exemplaires", "La production s'est arrêtée à 18 voitures, certaines étant des prototypes."]], [["Rareté", "18 exemplaires."]], ["33-stradale-2023", "giulia-tz"]);
  add("33-stradale-2023",
    "L'Alfa Romeo 33 Stradale (2023) est une réédition limitée à 33 exemplaires, présentée en 2023. Elle est basée sur un châssis en carbone et propose un V6 3.0 biturbo de 620 ch ou une version 100 % électrique. Elle est conçue par le centre de style Alfa Romeo, avec des lignes qui rappellent celle de 1967.\n\nLes 33 exemplaires ont été vendus à un prix de l'ordre de 1,7 million d'euros, selon les sources.",
    [["33 exemplaires", "Le nombre fait référence à la 33 Stradale et à la Tipo 33."]], [["Rareté", "33 exemplaires."]], ["33-stradale"]);
  add("giulia-sprint-gt-105",
    "La Giulia Sprint GT (1963) est le coupé dessiné par Giorgetto Giugiaro chez Bertone. Son moteur 1.6 quatre cylindres à double arbre à cames en tête et ses lignes équilibrées en font une voiture de collection recherchée. Elle est suivie des 1300 Junior, 1750 GTV et 2000 GTV, qui prolongent le modèle jusqu'en 1977.\n\nLa version GTA allégée est devenue une voiture de course victorieuse.",
    [["La première œuvre de Giugiaro chez Bertone", "Le coupé est l'un des premiers grands dessins du jeune Giugiaro."]], [["Production", "De 1963 à 1977."]], ["giulia-tz", "giulia-gta"]);
  add("giulia-tz",
    "La Giulia TZ (Tubolare Zagato, 1963) est une voiture de compétition à châssis tubulaire et carrosserie aluminium dessinée par Zagato. Elle est animée par le 1.6 de la Giulia, poussé à 112 ch. Environ 112 exemplaires ont été construits (TZ1), puis la TZ2 (1965) à carrosserie en fibre.\n\nSes lignes aérodynamiques lui valent des victoires de classe en course.",
    [["La queue coupée", "La Kamm tail de Zagato est une inspiration de la TZ."]], [], ["giulia-sprint-gt-105", "33-stradale"]);
  add("giulietta-sprint-750",
    "La Giulietta Sprint (1954) est dessinée par Franco Scaglione chez Bertone. Elle est animée par un quatre cylindres 1.3 à double arbre à cames en tête. La Giulietta est la première Alfa produite à grande échelle à avoir connu un vrai succès commercial après la guerre.\n\nLe coupé était le premier modèle de la gamme Giulietta, suivi de la berline et du spider.",
    [["Le coupé de Scaglione", "Franco Scaglione a donné à la Giulietta Sprint sa silhouette élégante, mêlant courbes et simplicité."]], [], ["spider-duetto", "giulia-sprint-gt-105"]);
  add("spider-duetto",
    "L'Alfa Romeo Spider « Duetto » (1966) est un roadster dessiné par Pininfarina. Sa queue arrondie lui a valu le surnom de « osso di seppia » (os de seiche). Il est animé par le 1.6 double arbre de la Giulia. En 1967, il a joué dans le film « Le Lauréat » avec Dustin Hoffman, ce qui lui a donné une renommée mondiale.\n\nLe Spider a été produit pendant 27 ans, de 1966 à 1993, en quatre séries.",
    [["Le Lauréat", "Dustin Hoffman conduit un Spider rouge dans le film de 1967."], ["Osso di seppia", "Le surnom italien décrit la forme arrondie de la première série."]],
    [["Longévité", "27 ans de production en quatre séries."]], ["gtv6", "giulietta-sprint-750"]);
  add("gtv6",
    "L'Alfetta GTV6 (1980) est un coupé à moteur V6 2.5 litres de 160 ch, conçu par Giuseppe Busso. Il est monté sur la base de l'Alfetta, avec une boîte-pont à l'arrière pour répartir les masses. Sa carrosserie a été dessinée par Giugiaro.\n\nSa sonorité est considérée comme l'une des plus belles de la marque.",
    [["Le V6 Busso", "Ce V6 a été produit pendant près de 30 ans."]], [], ["spider-duetto", "155"]);
  add("8c-2300-le-mans",
    "L'Alfa Romeo 8C 2300 a été conçue par Vittorio Jano en 1931, avec un huit-cylindres en ligne à compresseur de 2,3 litres. Elle est la voiture des victoires de l'Alfa Romeo aux 24 Heures du Mans de 1931 à 1934, et aux Mille Miglia. Elle a donné son nom aux 8C ultérieures. Ses carrosseries ont été signées par Zagato, Touring et Brianza.\n\nElle est considérée comme l'une des plus belles voitures de sport de l'avant-guerre.",
    [["Jano, le génie", "Vittorio Jano a aussi dessiné la P2 et la P3 de Grand Prix."]], [["Le Mans", "Quatre victoires consécutives, de 1931 à 1934."]], ["8c-competizione"]);

  MAKIT.enrich(m);
})();
