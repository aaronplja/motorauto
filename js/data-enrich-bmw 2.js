/** MOTORAUTO — compléments BMW (lot 1) : 0-100, couple, histoire, anecdotes. Valeurs constructeur arrondies : fiches marquées « indicatif ». */
(function () {
  "use strict";
  if (typeof MAKIT === "undefined") return;
  const m = {};
  /** add(id, histoire|null, [[titre, texte]], [[type, texte]], { n° moteur: [couple, vmax, 0-100] }) */
  const add = (id, h, a, r, e) => {
    const x = { ap: true };
    if (h) x.h = h; if (a && a.length) x.a = a; if (r && r.length) x.r = r;
    if (e) { const arr = []; Object.keys(e).forEach((k) => { arr[Number(k)] = e[k]; }); x.e = arr; }
    m[id] = x;
  };

  add("bmw-isetta", null, [], [], {});
  add("bmw-328-roadster", null, [["Mille Miglia 1940", "Une 328 carrossée par Touring remporte la Mille Miglia 1940 (course disputée sur un circuit de Brescia) à plus de 160 km/h de moyenne, avec un six-cylindres 2.0 litres."], ["Aluminium et poids plume", "Sa légèreté (environ 780 kg) et son six-cylindres à culasse hémisphérique lui valent plus de 100 victoires de classe avant guerre."]]);
  add("bmw-neue-klasse", null, [["La voiture qui a sauvé BMW", "Présentée en 1961, la 1500 relance BMW après la crise de la fin des années 1950 : sa ligne signée Michelotti et son moteur à arbre à cames en tête fixent le style BMW pour des décennies."], ["Le « Hofmeister kink »", "Le petit décroché de la custode arrière reste encore aujourd'hui la signature des BMW."]], [], { 5: [0, 0, 11.5] });
  add("bmw-2002", "La 2002 (1968) naît d'un moteur 2.0 litres glissé dans la caisse de la 1600. Compacte, légère et vive, elle installe BMW comme constructeur de berlines sportives et prépare la Série 3.",
    [["La 2002 tii", "Avec l'injection mécanique Kugelfischer (130 ch), la tii de 1971 fait de la petite BMW l'une des berlines les plus rapides de son époque."]], [["Production", "Environ 860 000 exemplaires de la famille 02 ont été produits de 1966 à 1977."]],
    { 0: [0, 0, 12.5], 1: [0, 0, 11.7], 4: [160, 0, 9.5] });
  add("bmw-2002-turbo", "En 1973, la 2002 turbo (170 ch) est la première voiture de série européenne équipée d'un turbo. Son nom écrit à l'envers sur le spoiler avant et ses ailes élargies en font un modèle culte.",
    [["Lancée pendant la crise du pétrole", "Sortie en pleine crise pétrolière, elle est jugée peu opportune et retirée du catalogue dès 1974, ce qui la rend rare aujourd'hui (environ 1 700 exemplaires)."]]);
  add("bmw-3-e21", "L'E21 (1975) inaugure la Série 3, une berline sportive compacte à propulsion. Elle remplace la 02 et pose les bases du succès de BMW dans ce segment, avec des versions 4 et 6 cylindres.",
    [["La 323i", "Lancée en 1977, la 323i à injection (143 ch) est la plus puissante de la gamme."], ["Un million de ventes", "Produite jusqu'en 1983, l'E21 s'écoule à plus d'un million d'exemplaires."]], [],
    { 0: [0, 0, 15.5], 1: [0, 0, 13.5], 2: [0, 0, 12], 3: [0, 0, 12], 4: [0, 0, 10.5], 5: [0, 0, 11.5] });
  add("bmw-3-e30", null, [], [], { 0: [0, 0, 13], 1: [0, 0, 12], 2: [0, 0, 10.5], 3: [0, 0, 9.5], 4: [0, 0, 11.5], 6: [0, 0, 12.5], 7: [0, 0, 11], 9: [0, 0, 10.7], 12: [0, 0, 15.5], 13: [0, 0, 12], 14: [0, 0, 11.5] });
  add("bmw-m3-e30", null, [], [], { 1: [0, 0, 7.1] });
  add("bmw-3-e36", null, [], [], { 1: [0, 0, 12.5], 3: [0, 0, 11.5], 7: [0, 0, 13.5], 8: [0, 0, 11.5], 9: [0, 0, 9.3], 12: [0, 0, 9.5], 13: [0, 0, 8.3], 15: [0, 0, 14], 16: [0, 0, 10] });
  add("bmw-m3-e36", "La M3 E36 (1992) troque le 4-cylindres de l'E30 pour un six-cylindres en ligne : 286 ch en 3.0 litres, puis 321 ch en 3.2 litres (1995). Elle est proposée en coupé, cabriolet, berline et en éditions GT et Lightweight.",
    [["M3 GT", "La M3 GT de 1994 (356 exemplaires) est homologuée pour la course, en British Racing Green."], ["Une M3 à quatre portes", "La berline M3 apparaît en 1994 : une première pour la lignée."]]);
  add("bmw-3-e46", null, [["Une des Séries 3 les plus vendues", "Produite de 1998 à 2006, l'E46 est déclinée en berline, coupé, cabriolet, Touring et Compact, avec des moteurs 4 et 6 cylindres essence et diesel."], ["xi et xDrive", "La 330xi est l'une des premières Séries 3 à quatre roues motrices permanentes en Europe."]], [],
    { 5: [0, 0, 10.2], 6: [0, 0, 7.8], 7: [0, 0, 11.9], 8: [0, 0, 9.9], 9: [0, 0, 8.6], 12: [0, 0, 9.3], 13: [0, 0, 7.2], 14: [0, 0, 7] });
  add("bmw-3-0-csl", "La 3.0 CSL (1972) est une E9 allégée (aluminium, vitres fines) créée pour l'homologation du championnat d'Europe des voitures de tourisme. Équipée en 1973 d'appendices aérodynamiques, elle gagne le surnom de « Batmobile ».",
    [["Coupé Sport Leichtbau", "CSL signifie « Coupé Sport Légèreté » : le poids tombe à environ 1 200 kg."], ["La première BMW Art Car", "En 1975, Alexander Calder peint une 3.0 CSL qui participe aux 24 Heures du Mans."]], [["Compétition", "Championne d'Europe des voitures de tourisme dès 1973, elle domine la série pendant plusieurs saisons."]]);
  add("bmw-m1", null, [["Conçue avec Lamborghini puis Italdesign", "Le projet M1 est confié à Lamborghini, puis repris par BMW Motorsport quand le partenaire rencontre des difficultés financières. Giugiaro dessine la ligne."], ["Le Procar", "La BMW M1 Procar (1979) est une série de course monotype qui fait courir les pilotes de F1 avant les Grands Prix."]], [], { 1: [0, 0, 0] });
  add("bmw-z1", "Le Z1 (1989) est un roadster à portes qui descendent dans les seuils, avec une carrosserie en plastique démontable sur un châssis acier. Il utilise le 6-cylindres 2.5 litres de la 325i.",
    [["Des portes qui disparaissent", "Les portes coulissent verticalement dans les bas de caisse, ce qui permet de rouler portes ouvertes."], ["Production limitée", "Environ 8 000 exemplaires sont produits jusqu'en 1991."]]);
  add("bmw-z3", "Le Z3 (1995) est le premier roadster BMW produit à Spartanburg (États-Unis). Il est décliné de 1.8 à 3.0 litres, en roadster, coupé « chausson » et versions M.",
    [["James Bond", "Il apparaît dans GoldenEye (1995), ce qui assure son succès commercial."], ["Le M Coupé", "Le coupé « break de chasse » M Coupé est l'un des modèles les plus recherchés."]], [], { 0: [0, 0, 11.5], 1: [0, 0, 10] });
  add("bmw-z8", "Le Z8 (1999) rend hommage à la 507 des années 1950 avec une carrosserie en aluminium et le V8 5.0 litres de la M5 (400 ch). Dessiné sous la direction de Henrik Fisker, il est produit jusqu'en 2003.",
    [["The World Is Not Enough", "Il apparaît en 1999 dans un James Bond, où il est coupé en deux par une scie."], ["Exemplaires", "Environ 5 700 Z8 sont fabriqués, ce qui en fait un collector."]]);
  add("bmw-z4-e85", "Le Z4 E85 (2002) remplace le Z3. Dessiné sous la direction de Chris Bangle, il propose du 4 au 6 cylindres, et en 2006 le Z4 M Roadster avec le six-cylindres S54 de 343 ch.",
    [["La surface flammée", "Sa carrosserie est un exemple du langage « flame surfacing » de Bangle, qui divise à l'époque."], ["Z4 M Coupé", "Le Z4 M Coupé reprend le même moteur de 343 ch."]]);
  add("bmw-z4-e89", null, [["Le toit rigide rétractable", "L'E89 abandonne la capote : un toit rigide en deux parties se replie en quelques secondes."], ["sDrive35is", "Le six-cylindres biturbo N54 monte à 340 ch sur la version sDrive35is."]]);
  add("bmw-z4-g29", "Le Z4 G29 (2018) est développé avec la Toyota Supra et fabriqué par Magna Steyr à Graz. Il revient à une capote en toile et propose le 6-cylindres 3.0 litres turbo de 340 ch en M40i.",
    [["Cousin de la Supra", "Il partage sa plate-forme avec la Toyota GR Supra."], ["Capote en toile", "La capote en toile se replie en quelques secondes."]]);
  add("bmw-1-e87", null, [["Une compacte à propulsion", "La Série 1 E87 (2004) reste fidèle à la propulsion, un choix rare dans son segment."], ["La 123d", "Avec son diesel biturbo de 204 ch, la 123d est l'une des compactes diesel les plus rapides de son époque."]], [], { 0: [0, 0, 10.8], 4: [0, 0, 6.8] });
  add("bmw-1m-e82", null, [["La 1M, une petite M3", "La 1M Coupé (2011) reprend le six-cylindres N54 biturbo de 340 ch, des ailes élargies et une carrosserie compacte."], ["Exemplaires", "Environ 6 300 exemplaires sont produits."]]);
  add("bmw-1-f20", "La F20 (2011) continue de proposer une propulsion. La M135i (320 ch, 2012) puis la M140i (340 ch, 2015) sont les compactes sportives de référence, jusqu'à l'arrivée en 2019 de la F40 à traction.",
    [["La Série 1 passe à la traction", "La F40 (2019) abandonne la propulsion pour une plate-forme à traction."], ["M140i", "Le six-cylindres turbo de 340 ch de la M140i est l'un des derniers de sa catégorie."]], [], { 0: [0, 0, 8.5] });
  add("bmw-2-f22", "Le Coupé Série 2 (2013, F22) remplace la Série 1 Coupé. La M235i (326 ch), puis la M240i (340 ch) sont des coupés à propulsion, proposés avec boîte manuelle ou automatique. La G42 apparaît en 2021.",
    [["Une propulsion qui disparaît ailleurs", "La Série 2 Coupé reste l'une des dernières petites propulsions du marché."], ["M240i xDrive", "La G42 propose aussi une version à quatre roues motrices."]], [], { 0: [0, 0, 8.7] });
  add("bmw-m2-f87", "La M2 (2015) est la petite M de la gamme : N55 de 370 ch, puis S55 de 410 ch en Competition (2018) et 450 ch en CS (2020, environ 2 200 exemplaires).",
    [["La M2 au Nürburgring", "Elle fait partie des M les plus chaudes de sa génération, au châssis réactif."], ["Boîte manuelle", "Elle reste disponible avec une boîte manuelle à six rapports."]]);
  add("bmw-m2-g87", "La M2 G87 (2023) reprend le six-cylindres S58 de 460 ch, une carrosserie plus massive et une boîte manuelle 6 ou automatique 8 rapports. C'est la dernière M2 sans motorisation hybride.",
    [["Polémique de style", "Sa ligne anguleuse divise, mais elle propose un châssis très efficace."], ["Version Manuelle", "La boîte manuelle est conservée."]]);
  add("bmw-3-e90", null, [["La Série 3 E90", "Lancée en 2005, elle introduit notamment le V8 dans la lignée M3 E92 (2007)."], ["Xdrive", "Le système xDrive est proposé sur plusieurs versions."]], [], { 3: [0, 0, 7.4], 8: [0, 0, 9], 10: [0, 0, 7] });
  add("bmw-3-f30", null, [["Huit rapports", "La F30 (2011) généralise la boîte automatique ZF à huit rapports."], ["Lignes d'équipement", "Elle introduit les finitions Sport Line, Modern Line et Luxury Line."]], [], { 0: [0, 0, 9.1], 4: [0, 0, 10.9], 8: [0, 0, 8.9] });
  add("bmw-m3-f80", "La M3 F80 (2014) adopte le six-cylindres turbo S55 de 431 ch, une première pour la M3. La Competition passe à 450 ch, la CS à 460 ch (environ 1 200 exemplaires).",
    [["Le premier turbo", "La M3 abandonne le V8 atmosphérique de l'E92 pour un six-cylindres biturbo."], ["Berline uniquement", "Le coupé devient M4 (F82) : la M3 n'est plus qu'une berline."]]);
  add("bmw-m4-f82", "La M4 (F82, 2014) est le coupé de la lignée M3. La M4 GTS (2016, 500 ch, injection d'eau, environ 700 exemplaires) est la plus radicale.",
    [["Injection d'eau", "La GTS utilise une injection d'eau dans l'admission."], ["Cabriolet F83", "La M4 est aussi proposée en cabriolet à toit rigide."]]);
  add("bmw-3-g20", null, [["Série 3 G20", "Lancée en 2018, elle propose la 330e hybride rechargeable et la M340i (374 ch)."], ["Live Cockpit", "Elle introduit l'instrumentation numérique Live Cockpit Professional."]]);
  add("bmw-m3-g80", "La M3 G80 (2020) reçoit le six-cylindres S58 de 480 ch, ou 510 ch en Competition. Elle adopte un grand double haricot, et pour la première fois, un Touring (G81, 2022).",
    [["Un Touring enfin", "La M3 Touring est la première M3 break de série."], ["La M3 CS", "La version CS (2023) développe 550 ch."]]);
  add("bmw-m4-g82", "La M4 G82 (2020) est le coupé de la lignée. Elle partage son S58 avec la M3 G80 : 480 à 550 ch selon les versions.",
    [["Phares et calandre", "Sa calandre verticale XXL fait partie des changements de style de la génération."], ["xDrive", "La M4 Competition est proposée en M xDrive."]]);
  add("bmw-4-f32", "La Série 4 (2013) devient la déclinaison coupé de la Série 3. La Gran Coupé (F36) ajoute un hayon, la G22 (2020) adopte une grande calandre double haricot.",
    [["Gran Coupé", "La Gran Coupé offre cinq places et un hayon."], ["Le grand haricot", "La calandre verticale de la G22 est la plus commentée de la gamme."]]);
  add("bmw-5-e12", "L'E12 (1972) est la première Série 5. Elle succède à la Neue Klasse et reçoit des moteurs 4 et 6 cylindres. La M535i (1980, environ 1 400 exemplaires) en est la version sportive.",
    [["La première M535i", "La M535i est la première Série 5 « M »."], ["Une berline sportive", "L'E12 impose la formule BMW : propulsion, moteur avant et comportement sportif."]], [], { 0: [0, 0, 14.5], 1: [0, 0, 10.5], 2: [0, 0, 10], 3: [0, 0, 8.5], 4: [0, 0, 9], 5: [0, 0, 7.8] });
  add("bmw-5-e28", null, [["Un mariage de confort et de sport", "L'E28 (1981) conserve la propulsion et propose du 4-cylindres au turbodiesel."], ["La première M5", "La M5 E28 (1984) reprend le moteur de la M1 : 286 ch en version européenne."]], [], { 0: [0, 0, 14], 1: [0, 0, 11], 2: [0, 0, 9], 3: [0, 0, 8], 5: [0, 0, 12] });
  add("bmw-m5-e28", null, [["Montée à la main", "Chaque M5 E28 est assemblée à la main à Garching, par BMW M GmbH."], ["Exemplaires", "Environ 2 200 M5 E28 sont produites."]], [], { 1: [0, 0, 6.8] });
  add("bmw-5-e34", "L'E34 (1988) modernise la Série 5 avec des moteurs 6 cylindres 24 soupapes et le premier V8 BMW (1992). La M5 E34 (S38, 315 ch puis 340 ch) est proposée en berline et en Touring (environ 900 exemplaires).",
    [["M5 Touring", "Le break M5 Touring est un des familiaux les plus rapides de son époque."], ["Le retour du V8", "Le V8 M60 fait son apparition en 1992 sur les 530i et 540i."]], [], { 0: [0, 0, 12.5], 1: [0, 0, 10.5], 2: [0, 0, 7.7], 4: [0, 0, 7], 6: [0, 0, 9.5] });
  add("bmw-5-e39", "L'E39 (1995) est considérée comme l'une des meilleures Séries 5. Elle est disponible en berline et Touring avec des 4-cylindres, six-cylindres, V8 et diesels. Sa M5 (S62, 400 ch) reste une référence.",
    [["Châssis en aluminium", "L'essieu avant est en aluminium sur les versions les plus puissantes."], ["M5 E39", "La M5 E39 développe 400 ch avec un V8 atmosphérique."]], [], { 0: [0, 0, 9.9], 1: [0, 0, 8.2], 5: [0, 0, 7], 7: [0, 0, 10.2], 8: [0, 0, 8.9], 9: [0, 0, 7.8] });
  add("bmw-m5-e39", "La M5 E39 (1998-2003) reçoit le V8 atmosphérique S62 de 4.9 litres et 400 ch, avec une boîte manuelle six rapports. Elle est produite à environ 20 000 exemplaires.",
    [["Un V8 pour la M5", "C'est la première M5 à V8."], ["Limitée électroniquement", "Sa vitesse est limitée à 250 km/h."]]);
  add("bmw-5-e60", "L'E60 (2003) est dessinée sous la direction de Chris Bangle. Elle introduit le système iDrive et l'assistance à la conduite, avec des moteurs 4, 6, 8 et 10 cylindres.",
    [["Un style controversé", "Son coffre à décrochement divise à l'époque."], ["iDrive", "Le contrôleur rotatif centralise la plupart des fonctions."]], [], { 1: [0, 0, 7.8], 8: [0, 0, 8], 9: [0, 0, 6.5] });
  add("bmw-m5-e60", "La M5 E60 (2005) est la seule M5 à V10 : le S85 de 5.0 litres développe 507 ch à 7 750 tr/min et accepte un régime très élevé. Elle est associée à la boîte SMG robotisée.",
    [["Un moteur de F1", "Le V10 est inspiré des V10 de F1 de Williams-BMW."], ["Exemplaires", "Environ 20 000 M5 E60/E61 sont produites."]]);
  add("bmw-5-f10", "La F10 (2010) est plus grande et plus technologique. Elle est disponible en berline, Touring (F11) et Gran Turismo (F07) avec des 4-cylindres, six-cylindres, V8 et un hybride ActiveHybrid 5.",
    [["Boîte à 8 rapports", "Elle adopte la boîte ZF à huit rapports."], ["ActiveHybrid 5", "L'ActiveHybrid 5 associe un six-cylindres turbo à un moteur électrique."]]);
  add("bmw-m5-f10", "La M5 F10 (2011) abandonne le V10 pour un V8 4.4 biturbo (S63) de 560 ch. La Competition (2013) passe à 575 ch, la « 30 Jahre M5 » (2014) à 600 ch (300 exemplaires).",
    [["Retour au turbo", "C'est la première M5 turbocompressée."], ["30 Jahre M5", "L'édition anniversaire est limitée à 300 exemplaires."]]);
  add("bmw-5-g30", "La G30 (2016) est la 7e génération de la Série 5. Elle reçoit une plate-forme CLAR en partie aluminium et une gamme avec hybride rechargeable (530e).",
    [["Plus légère", "Elle gagne environ 100 kg par rapport à la F10."], ["Assistance à la conduite", "Elle propose la conduite semi-autonome sur autoroute."]]);
  add("bmw-m5-f90", "La M5 F90 (2017) est la première M5 à transmission intégrale (M xDrive, désactivable). Le V8 S63 développe 600 ch, 625 ch en Competition et 635 ch en CS (2021, 1 200 exemplaires).",
    [["xDrive désactivable", "Le mode 2WD supprime la traction avant pour la propulsion."], ["M5 CS", "Version la plus puissante, 635 ch."]]);
  add("bmw-5-g60", "La G60 (2023) est la 8e génération de la Série 5, avec une version 100 % électrique, l'i5. Elle est plus grande et plus technologique.",
    [["i5", "L'i5 eDrive40 est la première Série 5 électrique."], ["Boîte unique", "Elle abandonne la boîte manuelle."]]);
  add("bmw-m5-g90", "La M5 G90 (2024) est la première M5 hybride rechargeable : V8 4.4 biturbo et moteur électrique pour 727 ch. Elle pèse plus de 2,4 tonnes.",
    [["La plus puissante", "Elle est la M5 de série la plus puissante."], ["Touring", "Le Touring suit."]]);
  add("bmw-6-e24", "La Série 6 E24 (1976) est un grand coupé GT surnommé « nez de requin ». La M635CSi (1984) reçoit le moteur M88 de la M1 : 286 ch. Elle est produite jusqu'en 1989.",
    [["Nez de requin", "Son avant incliné lui vaut le nom de « Haifisch »."], ["M635CSi", "La première « M6 » partage son moteur avec la M5."]], [], { 0: [0, 0, 8.5] });
  add("bmw-8-e31", null, [["Un V12 de 300 chevaux", "L'850i (1989) est la première BMW à V12 depuis la guerre, avec 300 ch."], ["850 CSi", "En 1992, l'850 CSi reçoit un V12 5.6 litres de 380 ch."]], [], { 0: [0, 0, 7], 1: [0, 0, 6.7] });
  add("bmw-6-e63", "La Série 6 E63 (2003) est un coupé dessiné sous la direction de Chris Bangle. Elle accueille la M6 (2005), qui reprend le V10 de la M5 E60 : 507 ch.",
    [["M6 à V10", "La M6 E63 associe V10 et boîte SMG."], ["Toit carbone", "La M6 est équipée d'un toit en carbone."]]);
  add("bmw-6-f12", "La Série 6 F12 (2011) existe en coupé (F13), cabriolet (F12) et Gran Coupé (F06). La M6 est équipée du V8 S63 de 560 ch puis 600 ch en Competition.",
    [["Gran Coupé", "La Gran Coupé offre quatre portes."], ["M6", "La M6 F12 développe 560 à 600 ch."]]);
  add("bmw-8-g15", "La Série 8 G15 (2018) fait renaître le grand coupé BMW. La M8 (2019) reçoit un V8 biturbo de 600 ch, 625 ch en Competition. Elle est déclinée en coupé, cabriolet et Gran Coupé.",
    [["Une renaissance", "Elle revient vingt ans après l'E31."], ["M8 Competition", "Elle développe 625 ch."]]);
  add("bmw-7-e23", null, [["La première Série 7", "L'E23 (1977) lance la gamme haut de gamme de BMW, avec des 6 cylindres."], ["745i", "La 745i (1979) est équipée d'un 3.2 litres turbo de 252 ch."]], [], { 0: [0, 0, 9], 1: [0, 0, 8.5], 2: [0, 0, 8.2], 3: [0, 0, 7.4] });
  add("bmw-7-e32", "L'E32 (1986) est la première Série 7 à recevoir un V12 : la 750i (1987) développe 300 ch. Une version 740i/735i V8 apparaît en 1992.",
    [["Un V12 inédit", "La 750i est la première voiture allemande d'après-guerre à V12."], ["Tableau de bord", "Elle propose une instrumentation avec écran de contrôle."]], [], { 0: [0, 0, 9.4], 1: [0, 0, 8.8], 2: [0, 0, 8], 3: [0, 0, 7.1], 4: [0, 0, 7.4], 5: [0, 0, 7.5] });
  add("bmw-7-e38", "L'E38 (1994) est la Série 7 des années 1990. Elle est l'une des premières à proposer un système de navigation par écran. Dans Demain ne meurt jamais (1997), la 750iL est pilotée par James Bond à distance depuis un téléphone.",
    [["Bond à distance", "Dans Demain ne meurt jamais, Bond pilote sa 750iL depuis la banquette arrière avec son téléphone."], ["Navigation", "Elle propose un système de navigation dès 1996."]], [], { 0: [0, 0, 11], 1: [0, 0, 8.9], 2: [0, 0, 8.1], 3: [0, 0, 7.5] });
  add("bmw-7-e65", "L'E65 (2001) est dessinée sous la direction de Chris Bangle. Elle est la première BMW à adopter le système iDrive et propose un coffre à fermeture électrique « soft close ».",
    [["iDrive", "Le premier iDrive est très critiqué à son lancement."], ["Style", "Le coffre élevé et le style sont controversés."]], [], { 0: [0, 0, 7.9], 1: [0, 0, 7] });
  add("bmw-7-f01", "La F01 (2008) offre des moteurs V8, V12 et six-cylindres, ainsi que la version hybride ActiveHybrid 7. La G11 (2015) allège la structure avec de la fibre de carbone (Carbon Core).",
    [["Carbon Core", "La G11 intègre de la fibre de carbone dans sa structure."], ["ActiveHybrid 7", "Hybride avec V8 biturbo."]]);
  add("bmw-7-g70", "La G70 (2022) est une grande berline avec un écran de 31 pouces à l'arrière. L'i7 est la première Série 7 électrique, et l'i7 M70 atteint 659 ch.",
    [["i7", "L'i7 xDrive60 est la première Série 7 100 % électrique."], ["Écran de cinéma", "Un écran de 31 pouces se déploie au plafond."]]);
  add("bmw-x5-e53", "Le X5 E53 (1999) est le premier SUV de BMW, qualifié de « Sports Activity Vehicle ». Il est produit à Spartanburg et propose des 6 cylindres et des V8, dont le 4.8is de 360 ch.",
    [["Le premier SUV BMW", "Il lance le segment des SUV de luxe sportifs."], ["Spartanburg", "Il est fabriqué aux États-Unis."]], [], { 4: [0, 0, 9.3] });
  add("bmw-x5-e70", "Les X5 suivants (E70 en 2006, F15 en 2013, G05 en 2018) montent en gamme. Le X5 M (2009, 555 ch) est le premier SUV signé M.",
    [["X5 M", "Le X5 M est le premier SUV M."], ["Hybride rechargeable", "Les X5 xDrive40e/45e sont hybrides rechargeables."]]);
  add("bmw-x6", "Le X6 (2008) invente le SUV coupé, qualifié de Sports Activity Coupé. Le X6 M reprend le V8 biturbo du X5 M.",
    [["Un nouveau segment", "Il est imité par plusieurs concurrents."], ["X6 M", "Le X6 M affiche 555 ch à son lancement."]]);
  add("bmw-x3", "Le X3 (2003, E83) est le SUV compact de BMW, fabriqué à l'origine par Magna Steyr. Les générations suivantes (F25, G01) proposent le X3 M (F97, 480 ch).",
    [["Magna Steyr", "L'E83 est assemblé en Autriche."], ["X3 M", "Le X3 M est proposé depuis 2019."]], [], { 0: [0, 0, 9.9] });
  add("bmw-x4", "Le X4 (2014) est la version coupé du X3. Le X4 M (2019) reprend le six-cylindres S58.",
    [["Coupé", "Il est lancé en 2014."], ["X4 M", "Le X4 M Competition développe 510 ch."]]);
  add("bmw-x1-x2", "Le X1 (2009) est le plus petit SUV de BMW. Il est passé à la traction avant avec la deuxième génération (F48, 2015), et propose une version hybride rechargeable.",
    [["Du break au SUV", "Le X1 s'impose dès son lancement."], ["xDrive25e", "Version hybride rechargeable."]]);
  add("bmw-ix1", "L'iX1 (2022) est la version 100 % électrique du X1, avec deux moteurs et 313 ch.",
    [["Électrique", "L'iX1 xDrive30 offre une autonomie d'environ 440 km."], ["Même carrosserie", "Il partage sa carrosserie avec le X1 thermique."]]);
  add("bmw-ix2", "L'iX2 (2024) est la version électrique du X2, avec la même base que l'iX1.",
    [["Coupé", "Son profil coupé le distingue de l'iX1."], ["xDrive30", "313 ch, transmission intégrale."]]);
  add("bmw-x7", "Le X7 (2018) est le grand SUV de BMW avec sept places. L'XM (2022) est un SUV hybride rechargeable de 653 ch, seconde BMW M dédiée après la M1.",
    [["Sept places", "Le X7 existe en 6 ou 7 places."], ["XM", "Seconde voiture M autonome après la M1."]]);
  add("bmw-i3", "L'i3 (2013) est la première BMW électrique de série. Sa cellule passager est en carbone (CFRP) et sa production se fait à Leipzig. Une version à prolongateur d'autonomie (REx) est proposée.",
    [["Cellule en carbone", "Il utilise massivement la fibre de carbone."], ["i3s", "L'i3s (2017) développe 184 ch."]]);
  add("bmw-i8", "L'i8 (2014) est une sportive hybride rechargeable : 3 cylindres turbo de 231 ch et moteur électrique, soit 362 ch. Un roadster apparaît en 2018.",
    [["Portes papillon", "Ses portes s'ouvrent vers le haut."], ["Mission Impossible", "Elle apparaît dans Mission Impossible : Protocole fantôme."]]);
  add("bmw-i4", "L'i4 (2021) est le coupé électrique de la gamme. L'i4 M50 (544 ch) est la première BMW M électrique de série.",
    [["i4 M50", "La première M 100 % électrique."], ["Autonomie", "Environ 590 km WLTP en eDrive40."]]);
  add("bmw-ix3", "L'iX3 (2020) est la version 100 % électrique du X3, avec 286 ch et une autonomie d'environ 460 km.",
    [["Production en Chine", "L'iX3 est produit à Shenyang."], ["Nouvelle génération", "Un iX3 Neue Klasse est prévu."]]);
  add("bmw-ix", "L'iX (2021) est le grand SUV électrique de BMW. L'iX M60 développe 619 ch. Il inaugure un nouveau langage de style.",
    [["Grand haricot", "Sa calandre fermée remplace la grille classique."], ["Fibre de carbone", "Son châssis intègre de la fibre de carbone."]]);
  add("bmw-3-csl-2023", "La M4 CSL (2022) reprend le six-cylindres 3.0 litres turbo de la M4, porté à 550 ch. Produite à 1 000 exemplaires, elle est allégée d'environ 100 kg.",
    [["Éclairage laser", "Phares laser jaunes."], ["Nürburgring", "Elle bat le record de la Nordschleife de sa catégorie."]]);
  add("bmw-3-csl-hommage", "La 3.0 CSL Hommage (2022) est un hommage à la CSL des années 1970 : 560 ch, boîte manuelle, 50 exemplaires.",
    [["Boîte manuelle", "Elle propose une boîte manuelle à six rapports."], ["50 exemplaires", "Une série très limitée."]]);
  add("bmw-m3-e30-dtm", "La M3 E30 DTM/Groupe A (1987) est dérivée de la M3 de série. Elle est championne du monde des voitures de tourisme 1987 avec Roberto Ravaglia, puis championne DTM 1989.",
    [["Roberto Ravaglia", "Le pilote italien gagne le titre mondial en 1987."], ["Palmarès", "Plus de 1 500 victoires toutes catégories."]]);
  add("bmw-m3-gtr-e46", null, [["Need for Speed", "La M3 GTR E46 est la voiture phare de Need for Speed Most Wanted (2005)."], ["Strassenversion", "Une dizaine d'exemplaires de route ont été produits."]]);
  add("bmw-m3-gt2-e92", "La M3 E92 est déclinée en versions de course : GT2 (2009), GT3 (2010) puis GT4 (2011). Elle utilise le V8 4.0 litres S65.",
    [["GT2", "Engagée en American Le Mans Series."], ["V8 4.0", "Le V8 est dérivé de la M3 de série."]]);
  add("bmw-m6-gt3", "La M6 GT3 (2016) remplace la Z4 GT3. Son V8 4.4 biturbo développe environ 585 ch. Elle est utilisée dans de nombreux championnats GT3.",
    [["GT3", "Elle est alignée dans les 24 Heures du Nürburgring."], ["V8 biturbo", "Le S63 est le même moteur que celui de la M6 de route."]]);
  add("bmw-m4-gt3", "La M4 GT3 (2022) remplace la M6 GT3. Elle utilise le six-cylindres S58 de 590 ch environ.",
    [["Moteur de route", "Le S58 est dérivé du moteur de la M3."], ["Clients", "De nombreuses équipes clientes l'alignent."]]);
  add("bmw-m8-gte", "La M8 GTE (2018) est une GT d'endurance engagée en WEC et en IMSA. Elle remporte les 24 Heures de Daytona 2019 en GTLM.",
    [["Daytona 2019", "Victoire en GTLM aux 24 Heures de Daytona."], ["V8 biturbo", "Un V8 de 4.0 litres turbo."]]);
  add("bmw-320-e21-groupe5", "La 320 Groupe 5 (1977) est une E21 à moteur turbo 2.0 litres de 380 ch, engagée en championnat d'Allemagne DRM.",
    [["Flying Brick", "Ses ailes élargies lui donnent un aspect de « brique volante »."], ["Turbo", "Elle utilise le moteur M12/1."]]);

  MAKIT.enrich(m);
})();
