/** MOTORAUTO — compléments rallye et autres marques (lot 4) : V-Max, 0-100, couple, histoire, anecdotes. Valeurs arrondies et indicatives (voitures de course : performances selon rapport de pont / terrain). */
(function () {
  "use strict";
  if (typeof MAKIT === "undefined") return;
  const m = {};
  const add = (id, h, a, r, e) => {
    const x = { ap: true };
    if (h) x.h = h; if (a && a.length) x.a = a; if (r && r.length) x.r = r;
    if (e) { const arr = []; Object.keys(e).forEach((k) => { arr[Number(k)] = e[k]; }); x.e = arr; }
    m[id] = x;
  };
  // [couple Nm, V-Max km/h, 0-100 s] ; 0 = ne pas toucher
  const W2 = [550, 200, 4.0], W16 = [450, 200, 3.9], R1 = [500, 200, 3.1], R5 = [420, 190, 4.3], R2 = [0, 175, 0];

  add("nissan-silvia-classic", "La Silvia (S110 puis S12) est la coupé sportive de Nissan à propulsion des années 1970-1980. La S12 (1983) propose le turbo FJ20ET et prépare la lignée S13-S15 devenue une icône du drift.");
  add("nissan-silvia-ps13", "La Silvia S13 (PS13, 1991) reçoit le moteur SR20DET turbo de 205 ch. Châssis équilibré, propulsion et moteur facile à préparer : elle est devenue l'une des voitures les plus populaires du drift.");
  add("vw-golf-gti-mk6", "La Golf GTI Mk6 (2008) reprend le 2.0 TSI de 210 ch. Plus aboutie que sa devancière, elle perfectionne la formule de la GTI sans en changer l'esprit, avec la boîte DSG en option.");
  add("rally-mini-cooper-s", null, [["Monte-Carlo 1964", "Paddy Hopkirk remporte le Rallye Monte-Carlo 1964 sur Mini Cooper S, suivi de Timo Mäkinen (1965) et Rauno Aaltonen (1967)."], ["Disqualification 1966", "En 1966, les Mini arrivées aux trois premières places sont disqualifiées pour irrégularité d'éclairage."]], [["Rallye Monte-Carlo", "Vainqueur en 1964, 1965 et 1967."]], { 0: [0, 0, 0] });
  add("rally-lancia-fulvia", "La Fulvia Coupé HF 1.6 « Fanalone » (1969) gagne le Rallye Monte-Carlo 1972 avec Sandro Munari et remporte le Championnat International des constructeurs 1972. Ses gros phares additionnels lui valent le surnom de « Fanalone ».",
    [["L'Elefantino", "Munari et Mannucci gagnent à Monte-Carlo 1972 sur une Fulvia HF 1.6."], ["Moteur V4 étroit", "Son V4 à angle très fermé tient en peu de place."]], [["Monte-Carlo", "Victoire en 1972."]], { 0: [0, 0, 11], 1: [0, 0, 10], 2: [0, 0, 9.5], 3: [0, 0, 8] });
  add("rally-lancia-stratos", null, [["Une voiture conçue pour le rallye", "La Stratos HF (1973) est la première voiture conçue dès l'origine pour gagner en rallye, dessinée par Marcello Gandini chez Bertone."], ["Moteur Ferrari", "Elle utilise le V6 Dino 2.4 litres de Ferrari."]], [["Championnat du monde", "Titres mondiaux des rallyes constructeurs 1974, 1975 et 1976."]], { 1: [0, 0, 5], 2: [0, 0, 3.8] });
  add("rally-fiat-124-abarth", "La 124 Abarth Rally (1972) est une 124 Spider transformée par Abarth. Giorgio Pianta est champion d'Europe des rallyes en 1975 avec cette propulsion de 170 ch.",
    [["Champion d'Europe 1975", "Giorgio Pianta remporte le titre européen au volant de la 124 Abarth."], ["Carrosserie allégée", "Capot et coffre en fibre de verre pour gagner du poids."]], [], { 0: [0, 0, 6.5] });
  add("rally-fiat-131-abarth", "La 131 Abarth Rally (1976) donne à Fiat trois titres mondiaux constructeurs (1977, 1978 et 1980). Walter Röhrl est champion du monde des pilotes 1980 sur cette voiture.",
    [["Trois titres mondiaux", "Fiat est champion du monde constructeurs en 1977, 1978 et 1980."], ["Walter Röhrl", "Il est champion du monde 1980 sur une 131 Abarth."]], [["Rallye", "Titres constructeurs 1977, 1978 et 1980."]], { 0: [0, 0, 6.5], 1: [0, 0, 6.5] });
  add("rally-ford-escort-rs1800", null, [["London-Mexico 1970", "Hannu Mikkola remporte la Coupe du Monde London-Mexico 1970 sur Escort Mk1."], ["Waldegård champion 1979", "Björn Waldegård est champion du monde 1979 sur Escort RS1800 Mk2."]], [], { 0: [0, 0, 8.7], 1: [0, 0, 8.7], 2: [0, 0, 5.5], 3: [0, 0, 9.5] });
  add("rally-opel-ascona-400", "L'Ascona 400 (1979) est l'Opel de rallye développée avec Irmscher et Cosworth. Walter Röhrl est champion du monde des rallyes en 1982 sur cette propulsion de 2.4 litres 16 soupapes.",
    [["Champion du monde 1982", "Walter Röhrl décroche son 2e titre mondial en 1982."], ["Moteur Cosworth", "Culasse 16 soupapes Cosworth."]], [], { 0: [0, 0, 7.8], 1: [0, 0, 4.5] });
  add("rally-opel-manta-400", "La Manta 400 (1981) est la jumelle de l'Ascona 400 en coupé. Le Groupe B donne ensuite plus de puissance, mais la propulsion ne résiste pas aux 4x4.",
    [["Série de 400 exemplaires", "Le chiffre 400 évoque le nombre d'exemplaires d'homologation."], ["Coupé", "La Manta est un coupé fastback."]], [], { 0: [0, 0, 7.8], 1: [0, 0, 4.5] });
  add("rally-lancia-037", null, [["Dernier titre en propulsion", "La Rally 037 (1982) offre à Lancia le titre mondial constructeurs 1983, dernier titre pour une deux roues motrices."], ["Compresseur Volumex", "Le 2.0 compresseur de 265 à 325 ch équipe la Groupe B."]], [], { 0: [0, 0, 4.5], 1: [0, 0, 3.9] });
  add("rally-lancia-delta-s4", "La Delta S4 (1985) est la Groupe B ultime de Lancia, avec son moteur 1.8 à compresseur et turbo (twincharger) de 480 ch environ. Henri Toivonen gagne le RAC 1985 pour ses débuts et trouve la mort en 1986 au Tour de Corse, ce qui marque la fin du Groupe B.",
    [["Fin du Groupe B", "L'accident de Toivonen et Cresto en Corse en 1986 pousse la FIA à supprimer le Groupe B."], ["Twincharger", "Compresseur à bas régime, turbo à haut régime."]], [], { 0: [0, 0, 2.5], 1: [0, 0, 5] });
  add("rally-peugeot-205-t16-e2", "La 205 Turbo 16 (1984) est une Groupe B à moteur central et quatre roues motrices. Elle donne à Peugeot les titres mondiaux constructeurs 1985 et 1986, avec Timo Salonen et Juha Kankkunen.",
    [["Titres 1985 et 1986", "Salonen (1985) et Kankkunen (1986) sont champions du monde avec la 205 T16."], ["Moteur central", "Son quatre-cylindres turbo est placé derrière les sièges."]], [["Rallye", "Titres pilotes 1985 et 1986, constructeurs 1985 et 1986."]], { 0: [0, 200, 4], 1: [0, 210, 3.6] });
  add("rally-peugeot-405-t16", "La 405 T16 Grand Raid (1989) est une machine de Paris-Dakar à quatre roues motrices et moteur central. Ari Vatanen gagne le Dakar 1989 et 1990 avec elle.",
    [["Moteur 2.0 turbo", "Un 4-cylindres turbo de 400 ch."], ["Climb Dance", "Vatanen la conduit dans le court-métrage de 1988 à Pikes Peak."]], [["Dakar", "Victoires 1989 et 1990."]], { 0: [0, 0, 4] });
  add("rally-peugeot-205-t16-gr", "La 205 T16 Grand Raid (1987) est la 205 transformée pour le Paris-Dakar. Ari Vatanen gagne le Dakar 1987 et Juha Kankkunen celui de 1988.",
    [["Dakar 1987", "Vatanen gagne la première course avec la 205 T16 GR."], ["Dakar 1988", "Kankkunen la mène à la victoire."]], [["Dakar", "Victoires 1987 et 1988."]], { 0: [0, 0, 4] });
  add("rally-metro-6r4", "La MG Metro 6R4 (1985) est la Groupe B britannique d'Austin Rover, avec un V6 3.0 atmosphérique de 410 ch et la transmission intégrale. Elle a été développée avec Williams Grand Prix Engineering.",
    [["V6 atmosphérique", "Moteur V64V conçu spécialement pour cette voiture."], ["Fin prématurée", "Elle disparaît avec la fin du Groupe B."]], [], { 0: [0, 0, 5], 1: [0, 0, 3.2] });
  add("rally-citroen-bx-4tc", "La BX 4TC (1985) est la Groupe B de Citroën : 2.1 litres turbo, 4 roues motrices et 380 ch. Ses résultats sont décevants et elle est retirée en 1986.",
    [["Un moteur Peugeot", "Le 2.1 turbo vient de la gamme Peugeot-Citroën."], ["200 exemplaires", "Une série de 200 pour l'homologation."]], [], { 0: [0, 0, 4.5] });
  add("rally-renault-5-maxi-turbo", "La Renault 5 Turbo (1980) est une citadine à moteur central. Jean Ragnotti gagne le Rallye Monte-Carlo 1981 sur R5 Turbo. La Maxi Turbo (1984) pousse à 350 ch en Groupe B.",
    [["Monte-Carlo 1981", "Jean Ragnotti gagne le Monte-Carlo 1981 sur R5 Turbo."], ["Moteur central", "Le moteur est placé derrière les sièges."]], [], { 0: [0, 0, 4.5], 1: [0, 0, 3.9] });
  add("rally-mazda-rx7-gpb", "La Mazda RX-7 Groupe B (1983) est une version de rallye à moteur rotatif 13B de 300 ch, une propulsion originale dans un monde de quatre roues motrices.",
    [["Rotatif en rallye", "Le rotatif est rare en rallye."], ["Propulsion", "Une propulsion face aux 4x4."]], [], { 0: [0, 0, 4.8] });
  add("rally-toyota-celica-tct", "La Celica Twin-Cam Turbo (1983) est la Groupe B de Toyota Team Europe, un 2.1 turbo de 380 ch. Elle domine le Safari Rally 1984 avec Björn Waldegård et remporte aussi l'édition 1985.",
    [["Safari 1984", "Waldegård gagne le Safari avec la Celica TCT."], ["Un moteur robuste", "Le 4T-GTE est connu pour sa fiabilité."]], [], { 0: [0, 0, 4.5] });
  add("rally-porsche-959-dakar", "La 959 Paris-Dakar (1986) est une version du coupé 959 pour le rallye-raid : six cylindres à plat 2.85 litres biturbo, 4 roues motrices. René Metge gagne le Dakar 1986.",
    [["Dakar 1986", "René Metge remporte l'épreuve."], ["Jacky Ickx", "L'ancien pilote de F1 termine sixième."]], [["Dakar", "Victoire de René Metge en 1986."]], { 0: [0, 0, 5] });
  add("rally-porsche-953-dakar", "La 953 (1984) est un prototype de 911 à quatre roues motrices dont la mécanique mène René Metge à la victoire au Paris-Dakar 1984. Elle prépare la 959.",
    [["Dakar 1984", "René Metge et Dominique Lemoyne gagnent le Dakar 1984."], ["Banc d'essai de la 959", "Elle sert de laboratoire de transmission intégrale."]], [["Dakar", "Victoire en 1984."]], { 0: [0, 0, 5] });
  add("rally-celica-st165", "La Celica GT-Four ST165 (1986) est la première Celica à quatre roues motrices et turbo. Carlos Sainz est champion du monde des rallyes 1990 sur Celica GT-Four ST165.",
    [["Sainz champion 1990", "Premier titre mondial de Carlos Sainz."], ["Le Safari", "Elle dispute le Safari avec Toyota Team Europe."]], [], { 1: [0, 0, 5.5] });
  add("rally-nissan-pulsar-gtir", null, [["Un aileron gigantesque", "L'immense aileron arrière est la signature de la GTI-R."], ["Moteur de Silvia", "Le SR20DET est partagé avec la Silvia."]]);
  add("rally-subaru-legacy-rs", "La Legacy RS (1990) est la première Subaru engagée en championnat du monde des rallyes. Colin McRae remporte la Nouvelle-Zélande 1993 avec elle, la première victoire mondiale de Subaru.",
    [["Première victoire", "Nouvelle-Zélande 1993 avec Colin McRae."], ["Prodrive", "Elle est préparée par Prodrive."]], [], { 1: [0, 0, 4.5] });
  add("rally-subaru-impreza-gc8", null, [["Colin McRae champion 1995", "Colin McRae devient champion du monde 1995 sur Subaru Impreza 555."], ["Trois titres constructeurs", "Subaru est champion constructeurs 1995, 1996 et 1997."]], [], { 3: [0, 0, 4.5], 4: [0, 0, 4] });
  add("rally-subaru-impreza-gd", null, [["Petter Solberg champion 2003", "Il décroche le titre pilote sur l'Impreza WRC2003."], ["S12 WRC", "La S12 WRC (2006) est l'ultime évolution de l'Impreza WRC."]], [], { 3: [0, 0, 4] });
  add("rally-subaru-impreza-gr", "L'Impreza WRX STI GR/GV/VA (2007-2021) est le modèle sportif de la gamme. La S209 de 2019 est la dernière STI à moteur EJ.",
    [["Dernière STI à EJ", "La S209 (2019) est la dernière WRX STI."], ["Fin de la STI", "La production s'arrête en 2021."]], [], { 3: [0, 0, 4.9], 4: [0, 0, 6.3] });
  add("rally-evo", null, [], [], { 9: [490, 280, 0], 13: [559, 280, 0] });
  add("rally-galant-vr4", "La Galant VR-4 (1988) est la voiture de rallye de Mitsubishi avant l'Evo : 4G63 turbo, quatre roues motrices et quatre roues directrices. Kenneth Eriksson gagne le Rallye d'Australie 1989.",
    [["Quatre roues directrices", "Elle utilise des roues arrière directrices."], ["Australie 1989", "Victoire de Kenneth Eriksson."]], [], { 1: [0, 0, 4.5] });
  add("rally-mitsubishi-lancer-wrc", "La Lancer Evolution WRC (2001-2005) est l'ultime voiture mondiale de Mitsubishi avant son retrait du championnat en 2005.",
    [["Dernier exercice", "Mitsubishi se retire du WRC en 2005."], ["2.0 turbo", "4G63 turbo de 300 ch."]], [], { 0: W2 });
  add("rally-mitsubishi-pajero-dakar", "Le Pajero est le détenteur du record de victoires au Paris-Dakar, avec douze succès entre 1985 et 2007.",
    [["Record", "Douze victoires au Dakar."], ["Peterhansel", "Stéphane Peterhansel y gagne plusieurs fois."]], [["Dakar", "12 victoires, record absolu."]], { 0: [0, 180, 6], 1: [0, 190, 5] });
  add("rally-corolla-wrc", "La Corolla WRC (1997) est la première voiture mondiale de Toyota, qui remporte le titre constructeurs 1999. Carlos Sainz perd le titre 1998 au dernier rallye, victime d'une panne moteur à 300 m de l'arrivée en Grande-Bretagne.",
    [["Sainz 1998", "Il perd le titre en Grande-Bretagne en panne à 300 m de l'arrivée."], ["Titre constructeurs 1999", "Toyota décroche le titre constructeurs."]], [], { 0: W2 });
  add("rally-yaris-wrc", "La Yaris WRC (2017) marque le retour de Toyota au WRC. Elle donne le titre constructeurs 2018 et le titre pilote 2019 à Ott Tänak.",
    [["Titre 2019", "Ott Tänak champion du monde."], ["Titre constructeurs 2018", "Toyota Gazoo Racing champion."]], [], { 0: W16 });
  add("rally-gr-yaris-rally1", "La GR Yaris Rally1 (2022) est une hybride de rallye. Kalle Rovanperä est champion du monde 2022 et 2023 avec elle.",
    [["Rovanperä champion", "Il devient le plus jeune champion du monde en 2022."], ["Hybride", "100 kW électriques."]], [], { 0: R1 });
  add("rally-gr-yaris", "La GR Yaris (2020) est une homologation spéciale pour le WRC. Elle reçoit un 1.6 trois-cylindres turbo de 261 puis 280 ch et la transmission intégrale GR-Four.",
    [["Un trois-cylindres de 261 ch", "Le 1.6 turbo trois cylindres est un moteur très compact."], ["Série d'homologation", "Elle est fabriquée à la main pour l'homologation."]]);
  add("rally-gr-yaris-rally2", "La GR Yaris Rally2 (2021) est la voiture de clientèle de Toyota Gazoo Racing, à moteur trois-cylindres turbo de 290 ch.",
    [["Rally2", "Elle vise le WRC2 et les championnats nationaux."], ["Trois cylindres", "Un 1.6 turbo trois-cylindres."]], [], { 0: R5 });
  add("rally-gr-corolla", "La GR Corolla (2022) est la compacte sportive de Toyota pour le marché américain, avec le trois-cylindres 1.6 turbo de 300 ch et la transmission GR-Four.",
    [["Marché américain", "Surtout commercialisée aux États-Unis."], ["Trois cylindres", "300 ch avec trois cylindres."]], [], { 0: [0, 0, 5.2] });
  add("rally-focus-wrc", "La Focus WRC (1999) est la voiture mondiale de Ford. Colin McRae gagne le Safari 1999 à ses débuts. Ford M-Sport est champion constructeurs 2006 et 2007 avec la Focus RS WRC.",
    [["Safari 1999", "Victoire de Colin McRae pour ses débuts."], ["Titres 2006 et 2007", "Ford champion constructeurs."]], [], { 0: W2 });
  add("rally-fiesta-wrc", "La Fiesta RS WRC (2011) est la voiture mondiale de M-Sport, sur base Fiesta. Elle permet à Ford de gagner de nombreux rallyes.",
    [["Moteur 1.6", "Elle adopte un 1.6 turbo de 300 ch."], ["M-Sport", "Développée à Cockermouth, Royaume-Uni."]], [], { 0: [0, 200, 3.9] });
  add("rally-fiesta-wrc-2017", "La Fiesta WRC (2017) est la voiture mondiale nouvelle génération de M-Sport : plus large et plus puissante (380 ch). Sébastien Ogier est champion du monde 2017 avec elle.",
    [["Ogier champion 2017", "Sébastien Ogier gagne son 5e titre sur Fiesta WRC."], ["Plus large", "Voies élargies, aérodynamique de ligue."]], [["Rallye", "Titres pilotes et constructeurs 2017."]], { 0: W16 });
  add("rally-puma-rally1", "La Puma Rally1 (2022) est la Ford hybride de M-Sport. Elle gagne à ses débuts le Rallye de Monte-Carlo 2022 avec Sébastien Loeb.",
    [["Loeb à Monte-Carlo", "Victoire dès la première course."], ["Hybride", "Un moteur électrique de 100 kW."]], [], { 0: R1 });
  add("rally-accent-wrc", "L'Accent WRC (2000) est la première voiture de Hyundai au championnat du monde des rallyes. Hyundai se retire fin 2003 avant de revenir en 2014.",
    [["Premier engagement", "Hyundai fait ses débuts en 2000."], ["Retrait en 2003", "La marque quitte le championnat."]], [], { 0: W2 });
  add("rally-i20-wrc", "L'i20 WRC (2014) marque le retour de Hyundai. Thierry Neuville est vice-champion en 2016, 2017, 2018 et 2019, et Hyundai est champion constructeurs 2019.",
    [["Thierry Neuville", "Quatre fois vice-champion du monde sur i20 WRC."], ["Titre constructeurs 2019", "Hyundai remporte le titre."]], [], { 0: W16 });
  add("rally-i20-n-rally1", "L'i20 N Rally1 (2022) est la Hyundai hybride. Thierry Neuville est champion du monde 2024 avec elle.",
    [["Neuville champion 2024", "Premier titre mondial du Belge."], ["Hybride", "Moteur électrique de 100 kW."]], [], { 0: R1 });
  add("rally-fabia-wrc", "L'Octavia WRC (1999) est la première voiture mondiale de Škoda, suivie de la Fabia WRC (2003-2005) avant le retrait de l'équipe usine.",
    [["Škoda Motorsport", "L'équipe est basée à Mladá Boleslav."], ["Retrait en 2005", "L'usine quitte le WRC."]], [], { 0: W2 });
  add("rally-fabia-r5", "La Fabia R5 (2015), puis Rally2 evo (2019), est la voiture de rallye la plus vendue de la catégorie. Elle domine le WRC2.",
    [["Un best-seller", "Elle est produite à plusieurs centaines d'exemplaires."], ["WRC2", "Elle gagne de nombreux titres WRC2."]], [], { 0: R5, 1: R5 });
  add("rally-c4-wrc", "La C4 WRC (2007) est la voiture de Sébastien Loeb pour ses titres mondiaux 2007, 2008 et 2009 (et 2010 avec la même voiture en début de saison).",
    [["Loeb, 3 titres", "Sébastien Loeb est champion 2007, 2008 et 2009 sur C4 WRC."], ["Citroën Total", "L'équipe est dominante."]], [], { 0: W2 });
  add("rally-ds3-wrc", "La DS3 WRC (2011) donne à Sébastien Loeb ses derniers titres 2011 et 2012, avec Citroën champion constructeurs.",
    [["Loeb 2011-2012", "Deux titres supplémentaires."], ["Plus compacte", "Basée sur la DS3."]], [], { 0: [450, 200, 3.9] });
  add("rally-c3-wrc", "La C3 WRC (2017) est la Citroën de la nouvelle réglementation. Kris Meeke gagne le Rallye du Mexique 2017.",
    [["Meeke au Mexique", "Victoire en 2017."], ["Plus large", "Ailerons plus grands."]], [], { 0: W16 });
  add("rally-307-wrc", "La 307 WRC (2004) est la voiture de Peugeot en 2004-2005. Peugeot se retire du championnat du monde fin 2005.",
    [["Dernière Peugeot WRC", "Elle succède à la 206 WRC."], ["Retrait", "Peugeot quitte le WRC fin 2005."]], [], { 0: W2 });
  add("rally-208-r2", "La 208 R2 (2012) est la voiture de rallye d'entrée de gamme de Peugeot Sport, avec un 1.6 atmosphérique de 185 ch.",
    [["Peugeot Rally Cup", "Elle équipe le Trophée Peugeot Rally."], ["Entrée de gamme", "Voiture de formation."]], [], { 0: R2 });
  add("rally-208-rally4", "La 208 Rally4 (2019) est une traction à trois cylindres de 208 ch. Elle est utilisée dans de nombreuses coupes nationales et au Junior WRC.",
    [["3 cylindres", "1.2 PureTech turbo."], ["Junior WRC", "Voiture du championnat Junior."]], [], { 0: [0, 180, 0] });
  add("rally-208-r5", "La 208 T16 R5 (2013) est la R5 de Peugeot Sport, à moteur 1.6 THP de 280 ch, avec une transmission intégrale.",
    [["Plusieurs titres", "Elle gagne des titres nationaux et en ERC."], ["THP 1.6", "Moteur du groupe PSA."]], [], { 0: R5 });
  add("rally-208-t16-pikes-peak", "La 208 T16 Pikes Peak (2013) est un prototype de 875 ch avec lequel Sébastien Loeb bat le record de Pikes Peak en 8 min 13 s 878 le 30 juin 2013.",
    [["Record de Pikes Peak", "Loeb bat le record en 8:13.878."], ["875 chevaux", "Un V6 biturbo pour 875 ch."]], [["Pikes Peak", "Record battu en 2013 par Sébastien Loeb."]], { 0: [0, 0, 0] });
  add("rally-208-rally2", "La 208 Rally2 (2021) est la voiture de Rally2 de Peugeot Sport, à moteur 1.6 turbo de 290 ch.",
    [["Rally2", "La catégorie sous les Rally1."], ["Clientèle", "Produite pour les équipes privées."]], [], { 0: R5 });
  add("rally-ibiza-kit-car", "L'Ibiza Kit Car (1996) est la SEAT de rallye de la catégorie 2 litres. SEAT remporte plusieurs titres de la Coupe du monde des 2 litres.",
    [["Coupe du monde 2 litres", "SEAT domine la catégorie."], ["Kit Car", "Version préparée à moteur 2.0 atmosphérique."]], [], { 0: [0, 0, 0] });
  add("rally-cordoba-wrc", "La Córdoba WRC (1998) est la voiture mondiale de SEAT. Elle est engagée en 1998 et 1999 avant le retrait de la marque.",
    [["Éphémère", "Engagée seulement deux saisons."], ["Moteur 2.0 turbo", "300 ch."]], [], { 0: W2 });
  add("rally-polo-wrc", "La Polo R WRC (2013) permet à Sébastien Ogier et Volkswagen de remporter quatre titres consécutifs (2013, 2014, 2015, 2016). Volkswagen se retire fin 2016.",
    [["Quatre titres consécutifs", "Ogier est champion de 2013 à 2016 avec la Polo R WRC."], ["Retrait", "Volkswagen se retire du WRC fin 2016."]], [["Rallye", "Titres pilotes et constructeurs 2013 à 2016."]], { 0: W16 });
  add("rally-polo-gti-r5", "La Polo GTI R5 (2018) est la VW de rallye de catégorie R5, avec 1.6 turbo de 290 ch.",
    [["Rally2", "Voiture clientèle."], ["Polo GTI", "Basée sur la Polo GTI."]], [], { 0: R5 });
  add("rally-mini-wrc", "La Mini John Cooper Works WRC (2011) est la Mini de Prodrive pour les saisons 2011-2012. Dani Sordo monte sur le podium.",
    [["Prodrive", "Préparée par Prodrive."], ["Courte carrière", "Engagée en 2011-2012."]], [], { 0: [450, 200, 3.9] });
  add("rally-mini-all4-racing", "La Mini All4 Racing (2011) gagne le Dakar quatre fois de suite : 2012 et 2013 avec Stéphane Peterhansel, 2014 avec Nani Roma, 2015 avec Nasser Al-Attiyah.",
    [["Quatre victoires", "Quatre Dakar consécutifs (2012-2015)."], ["Diesel 3.0", "Un six-cylindres turbodiesel."]], [["Dakar", "Victoires 2012, 2013, 2014 et 2015."]], { 0: [0, 0, 5] });
  add("rally-hilux", "La Toyota Hilux Dakar (V8 5.0 litres) a gagné le Dakar 2019 avec Nasser Al-Attiyah.",
    [["Al-Attiyah en 2019", "Victoire de Nasser Al-Attiyah."]], [["Dakar", "Victoire en 2019."]], { 0: [0, 0, 5.5] });
  add("rally-gr-dkr-hilux", "La GR DKR Hilux T1+ (2022) est la version à moteur V6 3.5 biturbo. Nasser Al-Attiyah gagne le Dakar 2022 et 2023.",
    [["2022 et 2023", "Victoires d'Al-Attiyah."], ["Roues plus grandes", "T1+ : suspensions plus longues."]], [["Dakar", "Victoires 2022 et 2023."]], { 0: [0, 0, 5] });
  add("rally-c2-s1600", "La Citroën C2 Super 1600 (2005) est la voiture de la catégorie S1600. Daniel Elena et Sébastien Loeb l'ont utilisée à ses débuts.",
    [["S1600", "1.6 atmosphérique de 218 ch."], ["Traction", "Seulement deux roues motrices."]], [], { 0: [0, 0, 0] });
  add("rally-c2-r2", "La C2 R2 (2005) est la voiture de formation de Citroën Racing. Elle équipe le Trophée C2.",
    [["Formation", "Pour jeunes pilotes."], ["R2", "1.6 atmosphérique."]], [], { 0: R2 });
  add("rally-ds3-r5", "La DS3 R5 (2012) est la première R5 de Citroën Racing. Elle gagne le championnat WRC2 2013.",
    [["WRC2", "Titre en 2013."], ["Base DS3", "Conçue pour la catégorie."]], [], { 0: R5 });
  add("rally-c3-rally2", "La C3 Rally2 (2018) est la voiture de Citroën Racing pour la catégorie Rally2, à moteur 1.6 turbo de 290 ch.",
    [["Rally2", "Remplace la DS3 R5."], ["Production", "Fabriquée à Versailles."]], [], { 0: R5 });
  add("rally-fiesta-r2t", "La Fiesta R2T (2013) est la Ford de formation, à moteur 1.0 EcoBoost turbo de 180 ch, utilisée dans la Coupe Fiesta.",
    [["EcoBoost", "Moteur 1.0 turbo."], ["Formation", "Voiture de coupe."]], [], { 0: R2 });
  add("rally-fiesta-rally4", "La Fiesta Rally4 (2019) est la Ford de rallye de catégorie Rally4, à moteur 1.0 EcoBoost turbo de 212 ch.",
    [["Rally4", "Quatre-cylindres compact."], ["EcoBoost", "Moteur 1.0 turbo."]], [], { 0: [0, 180, 0] });
  add("rally-fiesta-rally3", "La Fiesta Rally3 (2020) est la Ford 4x4 de catégorie Rally3, à moteur 1.0 turbo de 215 ch.",
    [["Rally3", "Transmission intégrale."], ["EcoBoost", "Moteur 1.0 turbo."]], [], { 0: [0, 170, 0] });
  add("rally-fiesta-r5", "La Fiesta R5 (2013) est la Ford de rallye R5 de M-Sport, à moteur 1.6 turbo de 280 ch.",
    [["M-Sport", "Développée à Cockermouth."], ["R5", "Catégorie de clientèle."]], [], { 0: R5 });
  add("rally-fiesta-rally2", "La Fiesta Rally2 (2019) est la version Rally2 de la Fiesta, 1.6 turbo de 290 ch.",
    [["Rally2", "Évolution de la R5."], ["M-Sport", "Développée par M-Sport."]], [], { 0: R5 });
  add("rally-i20-r5", "L'i20 R5 (2016) est la Hyundai de catégorie R5 de Hyundai Motorsport, à moteur 1.6 turbo de 280 ch.",
    [["R5", "Clientèle."], ["Hyundai Motorsport", "Développée à Alzenau."]], [], { 0: R5 });
  add("rally-i20-n-rally2", "L'i20 N Rally2 (2019) est la Hyundai de catégorie Rally2, 1.6 turbo de 290 ch.",
    [["Rally2", "Évolution de l'i20 R5."], ["Alzenau", "Développée en Allemagne."]], [], { 0: R5 });
  add("rally-opel-adam-r2", "L'Adam R2 (2013) est l'Opel de formation à moteur 1.6 atmosphérique de 185 ch, utilisée dans l'ADAC Opel Rallye Cup.",
    [["ADAC Rallye Cup", "Coupe de formation."], ["R2", "Entrée de gamme."]], [], { 0: R2 });
  add("rally-opel-corsa-rally4", "La Corsa Rally4 (2020) est l'Opel Rally4 à moteur 1.2 turbo de 140 ch.",
    [["Rally4", "Traction."], ["Rallye Cup", "Utilisée dans les coupes."]], [], { 0: [0, 180, 0] });
  add("rally-opel-corsa-rally-e", "La Corsa Rally Electric (2022) est la première voiture de rallye électrique de série, 136 ch, utilisée dans une coupe électrique ADAC.",
    [["100 % électrique", "Moteur électrique 50 kWh."], ["Coupe électrique", "Monotype électrique."]], [], { 0: [0, 150, 0] });
  add("rally-clio-r3", "La Clio R3 (2008) est la voiture de rallye de la catégorie R3 de Renault Sport. Les versions suivantes (Clio Rally3, Rally5) continuent la tradition.",
    [["Renault Sport", "Dérivée de la Clio."], ["Rally5", "Entrée de gamme."]], [], { 0: R2, 1: [0, 190, 0], 2: [0, 170, 0], 3: [0, 160, 0] });
  add("rally-kit-car-106-maxi", "La Peugeot 106 Maxi (1994) est la Kit Car française de la catégorie 2 litres. Elle remporte plusieurs titres nationaux.",
    [["Kit Car", "Version préparée atmosphérique de 205 ch."], ["Traction", "Seulement deux roues motrices."]], [], { 0: [0, 190, 5.5] });
  add("rally-citroen-ax-sport", "L'AX Sport (1986) est la Citroën de Groupe A et N, à moteur 1.3 de 93 ch, utilisée dans les rallyes et les courses de côte.",
    [["Groupe N", "Voiture de formation."], ["1.3 L", "Petit moteur très vif."]], [], { 0: [0, 0, 9.5] });
  add("rally-citroen-visa-mille-pistes", "La Visa Mille Pistes (1982) est la version de rallye de la Visa, avec un 1.4 de 120 ch. Elle est engagée en Groupe B.",
    [["Groupe B", "Engagée en 1982."], ["Mille Pistes", "Nom de la version de rallye."]], [], { 0: [0, 0, 8.5], 1: [0, 0, 9.5] });
  add("rally-puma-s1600", "La Ford Puma S1600 (2001) est la Ford de la catégorie Super 1600 à moteur Zetec de 215 ch, utilisée dans le JWRC.",
    [["JWRC", "Championnat du monde junior."], ["Super 1600", "Moteur 1.6 atmosphérique."]], [], { 0: [0, 190, 6] });
  add("rally-punto-s1600", "La Fiat Punto S1600 (2001) est la Fiat de la catégorie Super 1600, à moteur de 218 ch.",
    [["JWRC", "Championnat junior."], ["Super 1600", "1.6 atmosphérique."]], [], { 0: [0, 190, 6] });
  add("rally-corsa-s1600", "L'Opel Corsa S1600 (2001) est l'Opel de la catégorie Super 1600, à moteur de 215 ch.",
    [["JWRC", "Championnat junior."], ["Super 1600", "1.6 atmosphérique."]], [], { 0: [0, 190, 6] });
  add("rally-swift-s1600", "La Suzuki Swift S1600 (2005) est la Suzuki de la catégorie Super 1600. Per-Gunnar Andersson gagne le JWRC 2007.",
    [["JWRC 2007", "Titre junior de Per-Gunnar Andersson."], ["Super 1600", "1.6 atmosphérique."]], [], { 0: [0, 190, 6] });
  add("rally-s2000-punto", "La Grande Punto S2000 (2007) est la Fiat de la catégorie S2000, à moteur 2.0 atmosphérique de 280 ch. Giandomenico Basso est champion d'Europe 2008.",
    [["Basso champion 2008", "Titre européen."], ["S2000", "Moteur 2.0 atmosphérique."]], [], { 0: [0, 0, 4.5] });
  add("rally-abarth-124-rally", "L'Abarth 124 Rally (2016) est une 124 Spider de rallye, 1.8 turbo de 300 ch, propulsion.",
    [["Propulsion", "Une propulsion en R-GT."], ["R-GT", "Catégorie des GT de série."]], [], { 0: [0, 0, 5] });
  add("rally-lancer-evo-r4", "La Lancer Evolution IX R4 (2009) est la version R4 de l'Evo IX pour la catégorie 4x4 de série.",
    [["R4", "Catégorie de série."], ["4G63", "Moteur 2.0 turbo."]], [], { 0: [0, 0, 4.8] });
  add("rally-lancer-evo-x-r4", "La Lancer Evolution X R4 (2010) est la version R4 de l'Evo X.",
    [["R4", "Catégorie de série."], ["4B11", "Moteur 2.0 turbo."]], [], { 0: [0, 0, 4.8] });
  add("rally-2008-dkr", "La Peugeot 2008 DKR (2015) est le premier buggy à quatre roues motrices de Peugeot au Dakar, 3.0 V6 biturbodiesel de 340 ch. Elle gagne le Dakar 2016 avec Stéphane Peterhansel.",
    [["Dakar 2016", "Peterhansel gagne."], ["Deux roues motrices", "Elle roule à deux roues motrices."]], [["Dakar", "Victoire en 2016."]], { 0: [0, 0, 5.5] });
  add("rally-3008-dkr", "La 3008 DKR Maxi (2017) est le buggy à moteur V6 biturbodiesel de Peugeot au Dakar. Elle gagne le Dakar 2017 avec Peterhansel et 2018 avec Carlos Sainz.",
    [["2017 et 2018", "Peterhansel puis Sainz gagnent."], ["Maxi", "Version plus large."]], [["Dakar", "Victoires 2017 et 2018."]], { 0: [0, 0, 5.5] });
  add("rally-audi-rs-q-etron", "L'Audi RS Q e-tron (2022) est un prototype électrique à prolongateur d'autonomie. Carlos Sainz gagne le Dakar 2024, première victoire d'un véhicule électrifié.",
    [["Dakar 2024", "Victoire de Carlos Sainz."], ["Prolongateur d'autonomie", "Moteur thermique pour recharger la batterie."]], [["Dakar", "Victoire en 2024."]], { 0: [0, 0, 4.5] });
  add("rally-dacia-sandrider", "Le Dacia Sandrider (2024) est le prototype Dakar de Dacia, un T1+ à V6 biturbo.",
    [["Premier Dakar", "Engagé au Dakar 2025."], ["Moteur V6", "V6 3.0 biturbo."]], [], { 0: [0, 0, 5.5] });
  add("rally-xraid-hunter", "Le Prodrive Hunter (2021) est le T1+ britannique à moteur V6 biturbo Ford. Sébastien Loeb termine deuxième du Dakar 2022 avec lui.",
    [["Loeb 2e en 2022", "Deuxième du Dakar 2022."], ["Prodrive", "Construit par Prodrive."]], [], { 0: [0, 0, 5.5] });
  add("rally-ford-raptor-t1", "Le Ford Ranger Raptor T1+ (2022) est un prototype de rallye-raid à moteur V6 3.5 biturbo, version course du Ranger Raptor.",
    [["T1+", "Pick-up de rallye-raid."], ["V6 3.5", "Moteur biturbo."]], [], { 0: [0, 0, 5.5] });
  add("rally-race-touareg", "Le Race Touareg 2 (2009) donne à Volkswagen trois Dakar consécutifs : 2009 (Giniel de Villiers), 2010 (Carlos Sainz) et 2011 (Nasser Al-Attiyah).",
    [["Trois victoires", "Dakar 2009, 2010 et 2011."], ["Diesel 2.5 TDI", "Cinq cylindres turbodiesel."]], [["Dakar", "Victoires 2009, 2010 et 2011."]], { 0: [0, 0, 6.5] });
  add("rally-citroen-id-19", "L'ID 19 (1957) est la version simplifiée de la DS. Paul Coltelloni remporte le Rallye Monte-Carlo 1959 sur ID 19.",
    [["Monte-Carlo 1959", "Paul Coltelloni gagne."], ["Hydropneumatique", "Suspension oléopneumatique."]], [["Monte-Carlo", "Victoire en 1959."]], { 0: [0, 0, 22] });
  add("rally-citroen-ds-monte", "La DS 21 remporte le Rallye Monte-Carlo 1966 avec Pauli Toivonen, après la disqualification des Mini et Ford pour irrégularité d'éclairage.",
    [["Monte-Carlo 1966", "Toivonen gagne."], ["Disqualifications", "Les Mini et Ford sont disqualifiées."]], [["Monte-Carlo", "Victoire en 1966."]], { 0: [0, 0, 14] });
  add("rally-citroen-ds-23", "La DS 23 Injection (1972) est la DS à injection Bosch de 141 ch, version la plus puissante de la DS.",
    [["Injection", "Alimentation Bosch D-Jetronic."], ["141 ch", "Plus puissante des DS."]], [], { 0: [0, 0, 10.5] });
  add("rally-citroen-sm", "La SM Maserati (1970) remporte le Rallye du Maroc 1971 avec Bob Neyret. Son V6 Maserati développe 170 ch.",
    [["Rallye du Maroc 1971", "Bob Neyret gagne."], ["Moteur Maserati", "V6 2.7 litres."]], [["Rallye du Maroc", "Victoire en 1971."]], { 0: [0, 0, 8.5] });
  add("rally-datsun-240z-safari", "La Datsun 240Z remporte le Safari Rally 1971 avec Edgar Herrmann et 1973 avec Shekhar Mehta.",
    [["Safari 1971", "Edgar Herrmann gagne."], ["Safari 1973", "Shekhar Mehta gagne."]], [["Safari Rally", "Victoires 1971 et 1973."]], { 0: [0, 0, 8] });
  add("rally-datsun-violet-160j", "La Datsun Violet 160J (1977) remporte le Safari Rally 1979 avec Shekhar Mehta et reste une référence en Afrique.",
    [["Safari 1979", "Victoire de Mehta."], ["Fiabilité", "Solide sur les pistes."]], [], { 0: [0, 0, 9] });
  add("rally-porsche-911-s-rallye", "La 911 S 2.0 Rallye (1968) gagne le Rallye Monte-Carlo 1968 avec Vic Elford. Björn Waldegård la remporte en 1969 et 1970 sur 911.",
    [["Monte-Carlo 1968", "Vic Elford gagne."], ["Waldegård 1969-1970", "Deux victoires de plus."]], [["Monte-Carlo", "Victoires 1968, 1969 et 1970."]], { 0: [0, 215, 7.5] });
  add("rally-porsche-911-rs", "La 911 SC RS (1984) est l'engagée Groupe B de Porsche, dérivée de la 911 SC, à moteur 3.0 de 255 ch.",
    [["Groupe B", "Produite en petite série pour l'homologation."], ["Quatre roues motrices", "Elle reçoit la transmission intégrale."]], [], { 0: [0, 0, 5] });
  add("rally-porsche-911-sc-safari", "La 911 SC Safari (1978) est une 911 préparée pour le Safari Rally, avec une garde au sol relevée et un moteur 3.0 de 250 ch.",
    [["Safari", "Pistes africaines."], ["Garde au sol", "Suspensions relevées."]], [], { 0: [0, 0, 5.5] });
  add("rally-saab-96", "La Saab 96 (1960) donne à Erik Carlsson deux victoires au Rallye Monte-Carlo (1962 et 1963) et trois au RAC (1960-1962).",
    [["Erik Carlsson", "Deux victoires à Monte-Carlo."], ["Deux temps", "Moteur trois-cylindres à deux temps."]], [["Monte-Carlo", "Victoires 1962 et 1963."]], { 0: [0, 0, 27], 1: [0, 0, 19], 2: [0, 0, 17] });
  add("rally-volvo-544", "La Volvo PV544 (1958) a gagné le championnat d'Europe des rallyes 1964 avec Tom Trana et le Safari 1965 avec Joginder Singh.",
    [["Tom Trana", "Champion d'Europe 1964."], ["Safari 1965", "Joginder Singh gagne."]], [["Safari Rally", "Victoire en 1965."]], { 0: [0, 0, 13] });
  add("rally-volvo-amazon", "La Volvo Amazon 122S (1961) est une berline sportive. Elle a été engagée en rallye au début des années 1960.",
    [["122S", "Version sportive."], ["Sécurité", "Première ceinture trois points de série."]], [], { 0: [0, 0, 14], 1: [0, 0, 12.5] });
  add("rally-lancia-beta-monte-carlo", "La Beta Montecarlo Turbo (Groupe 5) domine les 2 litres du championnat du monde des voitures de sport (1979-1981) avec un 1.4 turbo de 480 ch.",
    [["Championnat du monde", "Lancia domine les 2 litres."], ["Groupe 5", "Silhouette extrême."]], [], { 0: [0, 0, 8.5], 1: [0, 0, 4] });

  MAKIT.enrich(m);
})();
