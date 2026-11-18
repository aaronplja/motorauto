/** MOTORAUTO — seconde passe : Audi, Alfa Romeo, Le Mans (anecdotes et palmarès complémentaires). */
(function () {
  "use strict";
  const m = {};
  const add = (id, h, a, r) => { m[id] = { h: h || "", a: a || [], r: r || [], ap: true }; };

  /* ---- AUDI */
  add("audi-s3-8v", null,
    [["300 chevaux pour une compacte", "La S3 8V (2013) a porté la puissance à 300 ch avec le 2.0 TFSI, un niveau qui était celui des GTI du segment supérieur."], ["La plate-forme MQB", "Elle partage sa base avec la Golf VII, la SEAT León et la Škoda Octavia."]]);
  add("audi-a3-8y", null,
    [["Une compacte très numérique", "L'A3 8Y (2020) adopte un virtual cockpit et des phares matriciels LED, des équipements venus des modèles supérieurs."], ["Cousine de la Golf VIII", "Elle repose sur la plate-forme MQB Evo."]]);
  add("audi-s3-8y", null,
    [["310 ch et du couple rationné", "La S3 8Y (2020) reçoit le 2.0 TFSI de 310 ch et un différentiel arrière actif, hérité de la RS3, pour limiter le sous-virage."], ["Un mode drift", "Certaines versions disposent d'un mode « Torque Rear » qui renvoie le couple vers la roue arrière extérieure."]]);
  add("audi-s4-b5", null,
    [["Le biturbo 2.7", "La S4 B5 (1997) reçoit un V6 2.7 biturbo de 265 ch, qui donne un couple généreux dès les bas régimes."], ["Une quattro sans prétention", "Sobre en apparence, elle était considérée comme une \"sleeper\" capable de surprendre des sportives plus voyantes."]]);
  add("audi-s4-b6-b7", null,
    [["Le retour du V8", "La S4 B6/B7 abandonne le V6 biturbo pour un V8 4.2 atmosphérique de 344 ch."], ["Un son célèbre", "Le V8 atmosphérique de la B6/B7, repris sur la RS4 B7, est cité parmi les plus beaux de la marque."]]);
  add("audi-s4-b8", null,
    [["Le compresseur", "La S4 B8 (2009) troque le V8 pour un V6 3.0 TFSI à compresseur de 333 ch."], ["Un différentiel arrière actif", "Le différentiel sport arrière répartit le couple entre les roues arrière pour améliorer la stabilité en courbe."]]);
  add("audi-a4-b9", null,
    [["120 kg en moins", "Grâce à la plate-forme MLB Evo, la B9 est jusqu'à 120 kg plus légère que la B8 selon la version."], ["Une aérodynamique remarquable", "La berline affiche un Cx de 0,23, parmi les meilleurs de sa catégorie."]]);
  add("audi-s4-b9", null,
    [["Un turbo unique", "Le V6 3.0 TFSI turbo remplace le compresseur de la B8, avec un couple de 500 Nm."], ["Un 0 à 100 en 4,7 s", "La S4 B9 accélère de 0 à 100 km/h en environ 4,7 secondes selon Audi."]]);
  add("audi-s5-8t", null,
    [["Le V8 de la RS4", "La S5 8T reçoit d'abord le V8 4.2 de 354 ch, issu de la RS4 B7, avant le passage au V6 compressé."], ["Un coupé à l'italienne", "Le design de l'A5 8T est signé Walter de Silva, ancien directeur du style du groupe, qui le considérait comme sa plus belle réussite."]]);
  add("audi-rs5-8t", null,
    [["8 250 tr/min", "Le V8 4.2 FSI de la RS5 (450 ch) tourne jusqu'à environ 8 250 tr/min, une rareté dans les années 2010."], ["Le dernier V8 atmosphérique RS", "La RS5 8T est l'une des dernières Audi RS à V8 atmosphérique, avant le passage au V6 biturbo."]]);
  add("audi-a5-b9", null,
    [["Walter de Silva", "L'A5 originale (2007) a été dessinée sous la direction de Walter de Silva, qui la qualifiait de sa plus belle réalisation."], ["Plus légère", "La deuxième génération perd jusqu'à 60 kg grâce à la plate-forme MLB Evo."]]);
  add("audi-s5-b9", null,
    [["Même bloc que la S4", "La S5 B9 reprend le V6 3.0 TFSI de 354 ch de la S4 B9."], ["Coupé, Sportback, Cabriolet", "Trois carrosseries sont proposées sur une même base."]]);
  add("audi-rs5-b9", null,
    [["Le V6 biturbo développé avec Porsche", "Le V6 2.9 TFSI biturbo de la RS5 B9 (450 ch) est un bloc développé avec Porsche."], ["Une RS plus légère", "La RS5 B9 perd 60 kg par rapport à la 8T, malgré une transmission quattro plus performante."]]);
  add("audi-a6-c7", null,
    [["Moins de poids", "La C7 est jusqu'à 80 kg plus légère que la C6 grâce à la plate-forme MLB."], ["Berline, Avant, allroad et hybride", "La gamme A6 C7 se décline en de nombreuses carrosseries et motorisations, dont une version hybride."]]);
  add("audi-s6-c7", null,
    [["Le V8 qui s'endort", "Le V8 4.0 TFSI biturbo de la S6 coupe quatre cylindres à faible charge (Cylinder on Demand) pour réduire la consommation."], ["Un downsizing de V8", "La S6 passe du V10 5.2 FSI de la C6 au V8 4.0 TFSI de la C7."]]);
  add("audi-rs6-c7", null,
    [["Le V8 biturbo de 560 ch", "La RS6 Avant C7 (2013) reçoit le 4.0 TFSI biturbo de 560 ch, puis 605 ch en version Performance (2015)."], ["Un break plus rapide que bien des sportives", "La Performance accélère de 0 à 100 km/h en 3,7 s environ."]],
    [["Performance", "RS6 Avant Performance : 605 ch, 750 Nm, 0 à 100 km/h en environ 3,7 s (valeurs constructeur)."]]);
  add("audi-a6-c8", null,
    [["Une berline hybride légère", "Les A6 C8 (2018) sont équipées d'un système micro-hybride 48 V sur la plupart des versions."], ["Deux écrans tactiles", "L'habitacle abandonne les commandes physiques de climatisation au profit d'un double écran."]]);
  add("audi-s7-4g", null,
    [["Un coupé à quatre portes", "L'A7 Sportback est présentée en 2010 comme un coupé quatre portes à hayon, dont la silhouette a inspiré d'autres marques."], ["V8 biturbo de 420 ch", "La S7 4G reçoit le 4.0 TFSI biturbo de 420 ch avec désactivation de cylindres."]]);
  add("audi-rs7-4g", null,
    [["La RS6 en fastback", "La RS7 4G partage sa mécanique avec la RS6 Avant C7 : V8 4.0 TFSI biturbo de 560 ch, puis 605 ch en Performance."], ["Une longue GT rapide", "Sa vitesse de pointe peut être relevée jusqu'à 305 km/h avec l'option Dynamic."]]);
  add("audi-rs7-c8", null,
    [["600 ch et hybridation légère", "La RS7 C8 reprend le V8 4.0 TFSI de 600 ch avec une hybridation légère 48 V."], ["La même mécanique que la RS6", "Elle partage sa base avec la RS6 Avant C8."]]);
  add("audi-s8-d2", null,
    [["Une berline en aluminium", "La S8 D2 est construite avec la structure en aluminium ASF, une première pour une berline de série de grande diffusion."], ["Une S8 à boîte manuelle", "La S8 D2 est rarement proposée avec une boîte manuelle à 6 rapports, un choix peu courant pour une limousine sportive."]]);
  add("audi-a8-d3", null,
    [["Singleframe", "La grande calandre Singleframe s'impose sur l'A8 à l'occasion de son restylage de 2005."], ["Le W12", "L'A8 W12 propose un moteur W12 6.0 de 450 ch."]]);
  add("audi-s8-d3", null,
    [["Le V10 de la Gallardo", "La S8 D3 partage son V10 5.2 FSI avec la Lamborghini Gallardo et l'Audi R8 V10."], ["Une berline de 450 ch", "Elle combine confort de limousine et performances de GT, avec un 0 à 100 km/h en environ 5 s."]]);
  add("audi-a8-d4", null,
    [["Les phares à LED", "L'A8 D4 (2010) est proposée avec des phares entièrement à LED, une technologie introduite sur la R8 en 2008."], ["Des aides à la conduite pionnières", "Elle propose la vision nocturne et l'assistance de conduite en embouteillage."]]);
  add("audi-s8-d4", null,
    [["Un V8 de 605 ch", "La S8 plus (2015) délivre 605 ch avec le V8 4.0 TFSI biturbo, un record de puissance pour une S8."], ["Un 0 à 100 en 3,8 s", "Elle accélère de 0 à 100 km/h en environ 3,8 secondes."]]);
  add("audi-tt-8j", null,
    [["Aluminium et acier", "La TT 8J utilise une structure mixte aluminium/acier pour limiter le poids."], ["Magnetic Ride", "Elle introduit la suspension pilotée Audi Magnetic Ride, à fluide magnéto-rhéologique."]]);
  add("audi-tt-rs-8s", null,
    [["Le cinq cylindres en vedette", "Le 2.5 TFSI de la TT RS 8S (400 ch) a été élu Moteur international de l'année à plusieurs reprises."], ["Un moteur en aluminium", "Son bloc en aluminium le rend plus léger de 26 kg que la version précédente."]],
    [["Prix", "Le 2.5 TFSI cinq cylindres a remporté de nombreuses fois le titre de Moteur international de l'année."]]);
  add("audi-r8-v10", null,
    [["Le V10 de la Gallardo", "La R8 V10 partage son moteur avec la Lamborghini Gallardo, un cas rare de mécanique partagée entre deux marques du groupe."], ["Une star de cinéma", "La R8 est la voiture de Tony Stark dans le film Iron Man (2008)."]],
    [["Cinéma", "Voiture de Tony Stark dans Iron Man (2008)."]]);
  add("audi-r8-lms-gt3", null,
    [["Un succès en clients-racing", "Audi Sport Customer Racing a livré des centaines de R8 LMS à des équipes du monde entier depuis 2009."], ["Les 24 Heures du Nürburgring", "La R8 LMS a gagné les 24 Heures du Nürburgring en 2012."]],
    [["24 Heures du Nürburgring", "Victoire des 24 Heures du Nürburgring 2012 avec la R8 LMS ultra."]]);

  add("peugeot-206-quiksilver", null, [["Une série pour les surfeurs", "La 206 Quiksilver reprenait les couleurs de la marque de surfwear, avec une sellerie et des détails spécifiques."], ["Des séries de marque", "La 206 a multiplié les séries spéciales de ce type (Roland-Garros, Quiksilver, Rip Curl…)."]]);

  /* ---- ALFA ROMEO */
  add("alfa-romeo-145-quadrifoglio-verde", null,
    [["Le trèfle à quatre feuilles", "Le Quadrifoglio Verde est apparu sur les Alfa de course en 1923, quand Ugo Sivocci le peignit sur sa voiture à la Targa Florio."], ["Une compacte à moteur Boxer", "La 145 emploie le 2.0 Twin Spark de la famille Boxer, à cylindres opposés, hérité de l'Alfasud,."]]);
  add("alfa-romeo-155", null,
    [["Championne du DTM", "La 155 V6 TI a gagné le championnat allemand du DTM en 1993 avec Nicola Larini, face à Mercedes et BMW."], ["La dernière traction de sa génération", "La 155 repose sur la plate-forme de la Fiat Tipo."]],
    [["DTM", "Champion DTM 1993 avec Nicola Larini sur Alfa Romeo 155 V6 TI."]]);
  add("alfa-romeo-156-sportwagon", null,
    [["Le break élu au design", "Le design de la 156 a valu à l'Alfa Romeo le titre de Voiture de l'année européenne en 1998."], ["Poignées cachées", "Les poignées de portes arrière sont dissimulées dans les montants pour donner l'illusion d'un coupé."]],
    [["Prix", "La 156 (berline) est élue Voiture européenne de l'année 1998."]]);
  add("alfa-romeo-159", null,
    [["Un dessin de Giugiaro", "La 159 (2005) a été dessinée par Giorgetto Giugiaro (Italdesign)."], ["Un poids élevé", "La 159 a été critiquée pour son poids élevé, au détriment de l'agilité."]]);
  add("alfa-romeo-164", null,
    [["La plate-forme \"Type 4\"", "La 164 partage sa base avec la Fiat Croma, la Lancia Thema et la Saab 9000, issue du projet Type 4."], ["Le V6 Busso", "La 164 reçoit le V6 3.0 conçu par Giuseppe Busso, l'un des moteurs de série les plus appréciés."]]);
  add("alfa-romeo-164-super", null,
    [["Le V6 24 soupapes", "La 164 Super reçoit le V6 3.0 24 soupapes de 210 ch."], ["Une berline à l'italienne", "Sa ligne signée Pininfarina est restée un classique."]]);
  add("alfa-romeo-166", null,
    [["Le dernier V6 Busso", "La 166 est équipée du V6 3.0 24V de 226 ch dernier avatar du V6 Busso."], ["Dessinée sous Walter de Silva", "Le style de la 166 est issu du Centro Stile Alfa Romeo dirigé par Walter de Silva."]]);
  add("alfa-romeo-gtv-916", null,
    [["Un coupé signé Pininfarina", "Le GTV 916 (1995) a été dessiné par Pininfarina. Sa ligne en coin et ses feux arrière en bandeau ont fait école."], ["Un son de Busso", "La version V6 3.0 de 220 ch a un son de moteur devenu célèbre."]]);
  add("alfa-romeo-spider-916", null,
    [["Le cabriolet d'Enrico Fumia", "Le Spider 916 reprend le dessin du GTV, signé Pininfarina, sous la direction d'Enrico Fumia."], ["Un Spider très italien", "Il reste l'un des Spider les plus abordables de la marque."]]);
  add("alfa-romeo-gt", null,
    [["La 156 en coupé", "L'Alfa GT repose sur la plate-forme de la 156 et a été dessinée par Giugiaro (Bertone)."], ["Le V6 Busso", "Le V6 3.2 de 240 ch est la version la plus performante."]]);
  add("alfa-romeo-brera", null,
    [["Du concept à la série", "Le concept Brera (2002) de Giugiaro a été produit presque tel quel en 2005, chose rare."], ["Le V6 3.2 JTS", "Le V6 3.2 JTS de 260 ch équipe la version la plus puissante."]]);
  add("alfa-romeo-spider-939", null,
    [["Le cabriolet de la Brera", "Le Spider 939 est dérivé de la Brera, avec une capote en toile électrique."], ["Construit par Pininfarina", "Pininfarina a produit la Brera et le Spider à San Giorgio Canavese."]]);
  add("alfa-romeo-mito", null,
    [["Une MiTo en hommage à la 8C", "La MiTo (2008) reprend les phares de la 8C Competizione dans une citadine sportive."], ["Le système DNA", "Elle inaugure le sélecteur DNA (Dynamic, Normal, All-weather) qui modifie la réponse du moteur et de la direction."]]);
  add("alfa-romeo-mito-quadrifoglio-verde", null,
    [["Le MultiAir", "Le 1.4 MultiAir (2009) gère l'admission par une commande électro-hydraulique, une première mondiale sur une voiture de série."], ["Le premier QV moderne", "La MiTo QV a relancé la dénomination Quadrifoglio Verde pour les petites Alfa."]]);
  add("alfa-romeo-giulietta-940", null,
    [["Sur la plate-forme Compact", "La Giulietta 940 remplace la 147 sur la plate-forme Compact."], ["Le TCT", "Elle est proposée avec la boîte TCT à double embrayage d'Alfa Romeo."]]);
  add("alfa-romeo-giulietta-quadrifoglio-verde", null,
    [["Le moteur de la 4C", "Le 1750 TBi de la Giulietta QV est une version à puissance moindre de celui de la 4C."], ["Un différentiel Q2", "Le différentiel Q2 transfère le couple vers la roue qui adhère le mieux."]]);
  add("alfa-romeo-8c-spider", null,
    [["500 exemplaires", "Alfa Romeo a produit 500 8C Spider, comme la 8C Competizione coupé."], ["Un V8 Ferrari/Maserati", "Le V8 4.7 de 450 ch est dérivé de la famille Ferrari-Maserati, construit par Ferrari."]],
    [["Série limitée", "500 exemplaires du 8C Spider produits."]]);
  add("alfa-romeo-4c-spider", null,
    [["Une monocoque en carbone", "La 4C repose sur une monocoque en fibre de carbone, une rareté dans cette gamme de prix."], ["Un poids de 1 050 kg", "Le 4C pèse environ 1 050 kg, un poids plume pour sa catégorie."]]);
  add("alfa-romeo-giulia-tz", null,
    [["112 exemplaires", "Environ 112 Giulia TZ ont été produites, dont une petite série de TZ2 en carrosserie plastique."], ["Les succès en GT", "La TZ a remporté de nombreuses victoires de classe en endurance dans les années 1960."]],
    [["Sport", "A remporté de nombreuses victoires de classe en endurance et en rallye dans les années 1960."]]);
  add("alfa-romeo-giulietta-sprint-750", null,
    [["Dessinée par Bertone", "La Sprint est signée Franco Scaglione, au studio Bertone."], ["Le premier succès de masse", "La Giulietta est la première Alfa produite en grande série après-guerre."]]);
  add("alfa-romeo-gtv6", null,
    [["Le V6 Busso", "Le V6 2.5 de la GTV6 est l'œuvre de Giuseppe Busso, qui a signé l'un des plus beaux moteurs de série."], ["Une boîte-pont arrière", "L'architecture transaxle de l'Alfetta (boîte accolée au différentiel arrière) donne une bonne répartition des masses."]],
    );

  /* ---- LE MANS */
  add("lm-mazda-767b", null,
    [["Quatre rotors", "Le moteur 13J de la 767B compte quatre rotors, avec le son très aigu des moteurs rotatifs."], ["L'échauffement avant la victoire", "La 767B précède la Mazda 787B, victorieuse en 1991."]]);
  add("lm-porsche-963", null,
    [["Le retour de Porsche en prototypes", "La Porsche 963 marque le retour de la marque en endurance au plus haut niveau, après la 919 Hybrid."], ["Un V8 biturbo de 4,6 litres", "Son V8 biturbo de 4,6 litres est associé au système hybride standard de la catégorie LMDh."]],
    [["IMSA", "Vainqueur des 24 Heures de Daytona 2024 (Porsche Penske Motorsport)."]]);
  add("lm-cadillac-vseries-r", null,
    [["Un V8 atmosphérique", "Cadillac est l'un des rares constructeurs à utiliser un moteur atmosphérique, un V8 5.5, sur un LMDh."], ["Les débuts au Mans", "La V-Series.R fait ses débuts aux 24 Heures du Mans en 2023."]],
    );
  add("lm-bmw-m-hybrid-v8", null,
    [["Un V8 de 4 litres", "Son V8 biturbo de 4,0 litres équipe la BMW M Team WRT en WEC et l'équipe RLL en IMSA."], ["Le retour de BMW", "BMW revient au plus haut niveau de l'endurance en 2024, après la V12 LMR de 1999."]]);
  add("lm-alpine-a424", null,
    [["Le V6 de la Renault", "Son V6 biturbo de 3,4 litres est développé par Renault à Viry-Châtillon."], ["La relève de l'A480", "L'A424 succède à l'A480, qui concourait en LMP1 puis Hypercar."]]);
  add("lm-lamborghini-sc63", null,
    [["Le retour en endurance", "La SC63 marque le retour de Lamborghini en Prototypes."], ["Un châssis Ligier", "Son châssis est fourni par Ligier, comme d'autres LMDh."]]);
  add("lm-aston-valkyrie-amr-lmh", null,
    [["Une idée d'Adrian Newey", "La Valkyrie de route a été conçue avec Adrian Newey, ancien directeur technique de Red Bull."], ["Un V12 de 6,5 L", "Le V12 atmosphérique de 6,5 litres de Cosworth est une rareté à l'heure des moteurs suralimentés."]]);
  MAKIT.enrich(m);
})();
