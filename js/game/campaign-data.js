/**
 * MOTORAUTO — Campagne : les chapitres (un par pays), posés sur le globe.
 * Un chapitre = 20 épreuves à passer dans l'ordre : quiz, vrai ou faux, « devine la voiture », « plus puissante », « plus ancienne »
 * (ces trois derniers tirent leurs voitures au hasard dans le catalogue du pays) et batailles de cartes contre l'IA.
 * Pour ajouter un pays : une entrée dans CHAPTERS (lat/lon = épingle, iso = pays coloré) et ses 6 quiz + 3 vrai ou faux dans CONTENT.
 * Étoiles : 1 à 3 selon les bonnes réponses (quiz et assimilés) ou l'écart de score (bataille).
 */
(function () {
  "use strict";
  // quiz : [question, bonne réponse, faux, faux, faux] ; vrai ou faux : [affirmation, vrai ?]
  const QZ = (title, sub, list) => ({ title, sub, qs: list.map((r) => ({ q: r[0], a: [r[1], r[2], r[3], r[4]] })) });
  const VF = (list) => list.map((r) => ({ q: r[0], ok: !!r[1] }));

  const CONTENT = {
    fr: {
      quiz: [
        QZ("Les pionnières", "Citroën, Peugeot, Renault…", [
          ["Quelle marque française a produit la célèbre 2CV ?", "Citroën", "Renault", "Peugeot", "Simca"],
          ["Quel animal figure sur le logo de Peugeot ?", "Un lion", "Un taureau", "Un cheval", "Un coq"],
          ["Quelle voiture Renault, lancée en 1992, avait un look de « bonbon » aux phares ronds ?", "La Twingo", "La Clio", "La Mégane", "L'Espace"],
          ["Dans quelle ville normande est installée l'usine Alpine ?", "Dieppe", "Rouen", "Caen", "Le Havre"],
          ["Quelle marque a lancé la révolutionnaire DS en 1955 ?", "Citroën", "Peugeot", "Panhard", "Talbot"]]),
        QZ("Les 24 Heures du Mans", "La plus grande course d'endurance", [
          ["Dans quel département se trouve le circuit des 24 Heures du Mans ?", "La Sarthe", "La Mayenne", "L'Orne", "Le Maine-et-Loire"],
          ["Comment s'appelle la célèbre ligne droite d'environ 6 km du circuit ?", "Les Hunaudières", "Tertre Rouge", "Arnage", "Indianapolis"],
          ["Quelle marque française a gagné Le Mans en 1992 et 1993 avec la 905 ?", "Peugeot", "Renault", "Matra", "Citroën"],
          ["Quelle Alpine a remporté les 24 Heures du Mans 1978 ?", "L'A442B", "L'A110", "L'A310", "La GTA"]]),
        QZ("Rallye et Dakar", "Les légendes de la terre et de la neige", [
          ["Quelle Alpine a dominé le rallye de Monte-Carlo 1971 ?", "L'A110", "L'A310", "La GTA", "L'A610"],
          ["Quel pilote français a remporté neuf titres de champion du monde des rallyes ?", "Sébastien Loeb", "Sébastien Ogier", "Didier Auriol", "François Delecour"],
          ["Avec quelle marque Loeb a-t-il gagné ses neuf titres mondiaux ?", "Citroën", "Peugeot", "Renault", "Subaru"],
          ["Quelle Peugeot a gagné le Paris-Dakar en 1987 et 1988 ?", "La 205 Turbo 16", "La 504", "La 405 Turbo 16", "La 306 Maxi"]]),
        QZ("Sportives françaises", "Alpine, Bugatti, Renault Sport", [
          ["Dans quelle région est installée l'usine Bugatti, à Molsheim ?", "L'Alsace", "La Normandie", "La Bretagne", "La Provence"],
          ["Quelle Bugatti de 2005 dépassait 400 km/h avec 1 001 chevaux ?", "La Veyron", "La Chiron", "L'EB110", "La Divo"],
          ["Quelle Renault de 1980 avait un moteur turbo placé au centre, derrière les sièges ?", "La R5 Turbo", "La R8 Gordini", "La Fuego", "La R12"],
          ["Quelle Matra de 1973 offrait trois places côte à côte à l'avant ?", "La Bagheera", "La Murena", "La Djet", "La Rancho"]]),
        QZ("Citroën, l'audace", "Hydropneumatique et traction avant", [
          ["Quelle Citroën de 1955 avait une suspension hydropneumatique ?", "La DS", "La 2CV", "La Traction", "La Visa"],
          ["Quelle Citroën de 1970 était équipée d'un moteur Maserati ?", "La SM", "La GS", "La CX", "L'Ami 6"],
          ["Comment surnomme-t-on le fourgon Citroën Type H à tôle ondulée ?", "Le Tube", "Le Cube", "La Boîte", "Le Pavé"],
          ["Quelle Citroën de 1934 fut la première traction avant de grande série ?", "La Traction Avant", "La 2CV", "L'Ami 6", "La Dyane"]]),
        QZ("Peugeot et Renault", "Les deux géants", [
          ["Quelle Renault a lancé le monospace en Europe en 1984 ?", "L'Espace", "Le Scénic", "Le Kangoo", "Le Trafic"],
          ["Quelle Peugeot lancée en 1983 a sauvé la marque grâce à son succès ?", "La 205", "La 104", "La 305", "La 405"],
          ["Quelle Renault, produite à plus de 8 millions d'exemplaires, est surnommée « Quatrelle » ?", "La 4L", "La R5", "La R16", "La 4CV"],
          ["Quelle Peugeot a donné à Timo Salonen le titre mondial des rallyes 1985 ?", "La 205 Turbo 16", "La 306 Maxi", "La 504 Coupé", "La 405 T16"]])
      ],
      vf: [
        VF([["La Citroën 2CV a été produite jusqu'en 1990.", 1], ["Alpine a été fondée à Dieppe par Jean Rédélé.", 1], ["Le circuit des 24 Heures du Mans est à Monaco.", 0], ["Peugeot fabrique des véhicules depuis le XIXe siècle.", 1]]),
        VF([["Ettore Bugatti, le fondateur de la marque, est né à Milan.", 1], ["La Citroën DS a été présentée au Salon de Paris en 1955.", 1], ["Renault appartient à Peugeot.", 0], ["La Renault Twingo a été lancée en 1992.", 1]]),
        VF([["Sébastien Loeb est né en Alsace.", 1], ["Le rallye Monte-Carlo se déroule uniquement en Italie.", 0], ["La Peugeot 205 GTI date des années 1980.", 1], ["Le Paris-Dakar a toujours fini à Dakar.", 0]])
      ]
    },
    it: {
      quiz: [
        QZ("Les mythes rouges", "Ferrari, la légende de Maranello", [
          ["Dans quelle ville se trouve le siège de Ferrari ?", "Maranello", "Turin", "Sant'Agata Bolognese", "Naples"],
          ["Quel animal figure sur le blason de Ferrari ?", "Un cheval cabré", "Un taureau", "Un lion", "Un serpent"],
          ["Qui a fondé la marque Ferrari ?", "Enzo Ferrari", "Ferruccio Lamborghini", "Vittorio Jano", "Ettore Bugatti"],
          ["Quelle Ferrari de 1962 est l'une des voitures les plus chères du monde ?", "La 250 GTO", "La F40", "La Dino", "L'Enzo"]]),
        QZ("Lamborghini, Maserati, Alfa", "Taureau, trident et biscione", [
          ["Quel animal est l'emblème de Lamborghini ?", "Un taureau", "Un cheval", "Un lion", "Un aigle"],
          ["Quelle Lamborghini de 1966 est considérée comme la première supercar à moteur central ?", "La Miura", "La Countach", "La Diablo", "L'Urraco"],
          ["Quel symbole figure sur le logo de Maserati ?", "Un trident", "Une épée", "Un aigle", "Une étoile"],
          ["Quelle marque italienne a pour emblème un serpent couronné, le Biscione ?", "Alfa Romeo", "Lancia", "Fiat", "Maserati"]]),
        QZ("Fiat et les populaires", "Turin, la cité de l'auto", [
          ["Quelle petite Fiat de 1957 est devenue un symbole de l'Italie ?", "La Nuova 500", "La Panda", "La Uno", "La Punto"],
          ["Dans quelle ville est née Fiat en 1899 ?", "Turin", "Milan", "Rome", "Naples"],
          ["Quelle Lancia a remporté six titres constructeurs de 1987 à 1992 ?", "La Delta", "La Stratos", "La 037", "La Fulvia"],
          ["Qui a dessiné la Fiat Panda de 1980 ?", "Giorgetto Giugiaro", "Pininfarina", "Bertone", "Zagato"]]),
        QZ("Design à l'italienne", "Carrossiers et portes en ciseaux", [
          ["Quel carrossier turinois a dessiné de nombreuses Ferrari ?", "Pininfarina", "Italdesign", "Ghia", "Touring"],
          ["Quelle Lamborghini présentée en 1971 a popularisé les portes en ciseaux ?", "La Countach", "La Miura", "La Jarama", "L'Espada"],
          ["Dans quelle région se trouve le circuit de Monza ?", "La Lombardie", "La Toscane", "L'Émilie-Romagne", "Le Piémont"],
          ["Quelle course de 1 000 miles reliait Brescia à Rome et retour ?", "La Mille Miglia", "La Targa Florio", "Le Giro", "La Coppa d'Oro"]]),
        QZ("Courses italiennes", "Sicile, Monza, écurie", [
          ["Quelle course se disputait sur les routes de Sicile ?", "La Targa Florio", "La Mille Miglia", "Le Tour d'Italie", "La Carrera"],
          ["Que veut dire « Scuderia » en français ?", "Écurie", "Atelier", "Usine", "Garage"],
          ["Quelle Alfa Romeo de 1966, vue dans Le Lauréat, est un spider célèbre ?", "La Duetto", "La Giulia", "La 33 Stradale", "La Montreal"],
          ["Quelle marque est la plus titrée chez les constructeurs en Formule 1 ?", "Ferrari", "Maserati", "Alfa Romeo", "Lancia"]]),
        QZ("Supercars", "Pagani, F40, Aventador", [
          ["Quelle marque fondée par Horacio Pagani est installée près de Modène ?", "Pagani", "De Tomaso", "Abarth", "Bizzarrini"],
          ["Quelle Ferrari de 1987 est la dernière supervisée par Enzo Ferrari ?", "La F40", "La Testarossa", "La F50", "La 308"],
          ["Quelle Lamborghini présentée en 2011 porte le nom d'un taureau de combat ?", "L'Aventador", "La Gallardo", "La Murciélago", "La Diablo"],
          ["Quel groupe réunit Fiat, Peugeot et Citroën depuis 2021 ?", "Stellantis", "Volkswagen", "Renault", "Ferrari"]])
      ],
      vf: [
        VF([["Ferrari a son siège à Maranello.", 1], ["La Fiat 500 de 1957 avait son moteur à l'arrière.", 1], ["Lamborghini a d'abord fabriqué des tracteurs.", 1], ["Enzo Ferrari a aussi fondé Lamborghini.", 0]]),
        VF([["Pagani est une marque italienne.", 1], ["La Mille Miglia est une course de 1 000 miles.", 1], ["La Lancia Stratos a été dessinée par Bertone.", 1], ["Maserati est une marque française.", 0]]),
        VF([["Ferrari a remporté les 24 Heures du Mans.", 1], ["Le circuit de Monza est situé en Sicile.", 0], ["Abarth est la filiale sportive de Fiat.", 1], ["La Fiat Panda de 1980 a été dessinée par Giugiaro.", 1]])
      ]
    },
    de: {
      quiz: [
        QZ("Les grandes marques", "Volkswagen, Porsche, Audi, Mercedes", [
          ["Quelle marque allemande produit la Golf ?", "Volkswagen", "Opel", "Audi", "BMW"],
          ["Dans quelle ville est installé le siège de Porsche ?", "Stuttgart", "Munich", "Wolfsburg", "Ingolstadt"],
          ["Quel logo se compose de quatre anneaux ?", "Audi", "BMW", "Opel", "Škoda"],
          ["Quelle marque a pour emblème une étoile à trois branches ?", "Mercedes-Benz", "Opel", "Maybach", "Smart"]]),
        QZ("Porsche", "La 911 et Le Mans", [
          ["Quelle Porsche de 1964 à moteur arrière est un coupé iconique ?", "La 911", "La 356", "La 944", "La Cayman"],
          ["Qui a fondé la marque Porsche ?", "Ferdinand Porsche", "Ferry Porsche", "Wendelin Wiedeking", "Ferdinand Piëch"],
          ["Quelle marque détient le plus de victoires au général aux 24 Heures du Mans ?", "Porsche", "Audi", "Ferrari", "Bentley"],
          ["Quel type de moteur équipe traditionnellement la 911 ?", "Six cylindres à plat", "V8", "Quatre cylindres en ligne", "V12"]]),
        QZ("BMW et la division M", "Munich et Motorsport", [
          ["Que signifie le M de BMW M ?", "Motorsport", "Meister", "Mobile", "Maximum"],
          ["Quelle BMW de 1986 a lancé la lignée M3 ?", "L'E30 M3", "La 2002 turbo", "La M1", "La Z1"],
          ["Quelle BMW de 1973 fut la première voiture européenne de série à moteur turbo ?", "La 2002 turbo", "La 3.0 CSL", "La M635", "La 635 CSi"],
          ["Dans quelle ville est installée BMW ?", "Munich", "Stuttgart", "Francfort", "Cologne"]]),
        QZ("Mercedes et Audi", "Papillons et quattro", [
          ["Quelle Mercedes de 1954 est célèbre pour ses portes papillon ?", "La 300 SL", "La 190 SL", "La 280 SE", "La 500 K"],
          ["Quelle Audi de 1980 a popularisé la transmission intégrale permanente sur route ?", "L'Audi Quattro", "L'Audi TT", "L'Audi 100", "L'Audi R8"],
          ["Quelle Audi a gagné cinq fois Le Mans entre 2000 et 2005 ?", "La R8", "La R18", "La R10", "La Quattro S1"],
          ["Quel nom porte la division sportive de Mercedes-Benz ?", "AMG", "RS", "M", "GTI"]]),
        QZ("Nürburgring et vitesse", "L'Enfer vert", [
          ["Quel circuit allemand est surnommé l'Enfer vert ?", "Le Nürburgring", "Hockenheim", "Le Sachsenring", "Zolder"],
          ["Quelle est la longueur approximative de la Nordschleife ?", "20,8 km", "5,8 km", "12 km", "42 km"],
          ["Quel surnom porte la Volkswagen Type 1 ?", "La Coccinelle", "Le Scarabée d'or", "La Fourmi", "Le Hanneton"],
          ["Dans quelle ville se trouve la maison mère de Volkswagen ?", "Wolfsburg", "Berlin", "Hambourg", "Brême"]]),
        QZ("Volkswagen et populaires", "La Golf et le Combi", [
          ["Quelle compacte sportive Volkswagen est apparue en 1976 ?", "La Golf GTI", "La Polo G40", "La Scirocco", "La Passat"],
          ["Quel groupe possède Audi, Porsche et Lamborghini ?", "Volkswagen", "BMW", "Daimler", "Stellantis"],
          ["Quel van Volkswagen de 1950 est devenu un symbole hippie ?", "Le Combi", "Le Caddy", "Le Touran", "Le Sharan"],
          ["Quelle marque allemande est basée à Rüsselsheim ?", "Opel", "Ford", "Audi", "Smart"]])
      ],
      vf: [
        VF([["Porsche a son siège à Stuttgart.", 1], ["La BMW M3 est apparue en 1986.", 1], ["Audi n'appartient pas au groupe Volkswagen.", 0], ["Le Nürburgring se trouve en Bavière.", 0]]),
        VF([["Mercedes-Benz est née de la fusion de Daimler et de Benz en 1926.", 1], ["La Volkswagen Golf GTI est apparue en 1976.", 1], ["Opel est une marque française.", 0], ["La Porsche 911 a son moteur à l'arrière.", 1]]),
        VF([["La Trabant était fabriquée en Allemagne de l'Ouest.", 0], ["AMG est la division sportive de Mercedes.", 1], ["La Coccinelle a été produite pendant plus de 60 ans.", 1], ["BMW est basée à Munich.", 1]])
      ]
    },
    jp: {
      quiz: [
        QZ("Les constructeurs", "Toyota, Honda, Nissan, Mazda", [
          ["Quel constructeur japonais est le plus grand du monde par le volume ?", "Toyota", "Honda", "Nissan", "Suzuki"],
          ["Quel moteur est le symbole des Mazda RX-7 ?", "Le rotatif Wankel", "Le V8", "Le diesel", "Le boxer"],
          ["Quel surnom porte la Nissan GT-R ?", "Godzilla", "Dragon", "Samouraï", "Tsunami"],
          ["Que représente le logo de Subaru ?", "Les Pléiades", "La Grande Ourse", "Orion", "La Croix du Sud"]]),
        QZ("Légendes JDM des années 90", "Supra, NSX, Skyline, MX-5", [
          ["Quel moteur six cylindres en ligne équipe la Toyota Supra MK4 ?", "Le 2JZ", "Le RB26", "Le 13B", "Le VTEC"],
          ["Quelle Honda de 1990 a été développée avec l'aide d'Ayrton Senna ?", "La NSX", "La S2000", "L'Integra", "La Civic"],
          ["Quel roadster Mazda de 1989 est le roadster le plus vendu au monde ?", "La MX-5", "La RX-8", "La 323", "La Eunos Cosmo"],
          ["Quelle Nissan porte le code R34 ?", "La Skyline GT-R", "La 350Z", "La Silvia", "La Fairlady"]]),
        QZ("Drift et culture", "Touge, kei cars, Suzuka", [
          ["Quelle Toyota est la star du manga Initial D ?", "L'AE86", "La Supra", "La Celica", "La MR2"],
          ["Quel pilote est surnommé le « Drift King » ?", "Keiichi Tsuchiya", "Tommi Mäkinen", "Takuma Sato", "Kazuki Nakajima"],
          ["Comment appelle-t-on les mini voitures japonaises limitées à 660 cm³ ?", "Les kei cars", "Les micro cars", "Les city cars", "Les shin cars"],
          ["Quel circuit accueille le Grand Prix de Formule 1 du Japon ?", "Suzuka", "Fuji", "Motegi", "Okayama"]]),
        QZ("Rallye et endurance", "Impreza, Evo, 787B", [
          ["Quelle voiture japonaise a gagné Le Mans en 1991 avec un moteur rotatif ?", "La Mazda 787B", "La Nissan R390", "La Toyota TS010", "La Honda NSX GT"],
          ["Quel pilote a été champion du monde des rallyes 1995 sur Subaru Impreza ?", "Colin McRae", "Tommi Mäkinen", "Carlos Sainz", "Juha Kankkunen"],
          ["Quelle marque japonaise a gagné les 24 Heures du Mans en 2018 ?", "Toyota", "Nissan", "Honda", "Mazda"],
          ["Quelle Mitsubishi a offert quatre titres à Tommi Mäkinen ?", "La Lancer Evolution", "La Galant VR-4", "La Eclipse", "La 3000GT"]]),
        QZ("Innovations japonaises", "Hybride, luxe et 4x4", [
          ["Quelle marque a lancé la première hybride de série, la Prius, en 1997 ?", "Toyota", "Honda", "Nissan", "Mitsubishi"],
          ["Quelle marque de luxe a été lancée par Toyota en 1989 ?", "Lexus", "Acura", "Infiniti", "Genesis"],
          ["Quel petit 4x4 Suzuki existe depuis 1970 ?", "Le Jimny", "Le Vitara", "Le Swift", "L'Ignis"],
          ["Quelle Datsun sortie en 1969 a lancé la lignée des Z ?", "La 240Z", "La 510", "La Cherry", "La Sunny"]]),
        QZ("Sportives modernes", "LFA, GT86, GT-R", [
          ["Quelle supercar Lexus de 2010 est célèbre pour son V10 ?", "La LFA", "La RC F", "La LC", "L'IS F"],
          ["Quelle sportive à propulsion Toyota est née en 2012 d'un partenariat avec Subaru ?", "La GT86", "La Supra", "La Celica", "La MR2"],
          ["Quel code désigne la Nissan GT-R lancée en 2007 ?", "R35", "R34", "R33", "R32"],
          ["Quel type de moteur utilise traditionnellement Subaru ?", "Le boxer", "Le V6", "Le rotatif", "Le W12"]])
      ],
      vf: [
        VF([["La Mazda MX-5 est un roadster.", 1], ["Les kei cars sont limitées à 660 cm³.", 1], ["Le Grand Prix du Japon se court à Suzuka.", 1], ["La Toyota AE86 est une traction avant.", 0]]),
        VF([["Subaru utilise un moteur boxer.", 1], ["La Mitsubishi Lancer Evolution est à transmission intégrale.", 1], ["Lexus appartient à Honda.", 0], ["La Honda NSX est équipée d'un moteur placé au centre.", 1]]),
        VF([["La Mazda 787B a gagné les 24 Heures de Spa.", 0], ["La Toyota Prius est une voiture hybride.", 1], ["La Nissan GT-R est surnommée Godzilla.", 1], ["Datsun est devenu Nissan.", 1]])
      ]
    },
    us: {
      quiz: [
        QZ("Detroit et les géants", "Ford, General Motors, Chrysler", [
          ["Quelle ville américaine est surnommée Motor City ?", "Detroit", "Chicago", "Cleveland", "Dallas"],
          ["Qui a fondé la marque Ford ?", "Henry Ford", "Walter Chrysler", "Louis Chevrolet", "Ransom Olds"],
          ["Quelle Ford de 1908 a motorisé l'Amérique ?", "La Model T", "La Mustang", "La Thunderbird", "La Fairlane"],
          ["Quelle marque a pour emblème un « nœud papillon » doré ?", "Chevrolet", "Dodge", "Buick", "Pontiac"]]),
        QZ("Muscle cars", "V8 et asphalte", [
          ["Quelle Ford de 1964 a lancé la catégorie des pony cars ?", "La Mustang", "La Camaro", "La Challenger", "La Barracuda"],
          ["Quelle Chevrolet est la rivale directe de la Mustang depuis 1966 ?", "La Camaro", "La Corvette", "La Chevelle", "L'Impala"],
          ["Quelle voiture orange est le « General Lee » de la série Shérif, fais-moi peur ?", "Une Dodge Charger", "Une Ford Mustang", "Une Pontiac GTO", "Une Chevrolet Camaro"],
          ["Quelle Pontiac de 1964 est souvent citée comme première muscle car ?", "La GTO", "La Firebird", "La Bonneville", "La Grand Prix"]]),
        QZ("Sportives américaines", "Corvette, Viper, Cobra, GT40", [
          ["Quelle sportive Chevrolet existe depuis 1953 ?", "La Corvette", "La Camaro", "La Monza", "La Vega"],
          ["Quel moteur équipe la Dodge Viper d'origine ?", "Un V10", "Un V6", "Un V8 turbo", "Un quatre cylindres"],
          ["Qui a créé la Cobra ?", "Carroll Shelby", "Lee Iacocca", "Zora Arkus-Duntov", "Preston Tucker"],
          ["Quelle Ford a gagné Le Mans de 1966 à 1969 ?", "La GT40", "La Mustang GT", "La Thunderbird", "La Cobra Daytona"]]),
        QZ("Pick-up, SUV et 4x4", "Jeep, Hummer, F-150", [
          ["Quelle marque est née de la Willys MB pendant la Seconde Guerre mondiale ?", "Jeep", "Hummer", "Dodge", "Chevrolet"],
          ["Quel constructeur américain a lancé la Model S en 2012 ?", "Tesla", "Lucid", "Rivian", "Fisker"],
          ["Quelle marque est née du véhicule militaire Humvee ?", "Hummer", "Jeep", "Ram", "GMC"],
          ["Quel pick-up Ford est un des véhicules les plus vendus aux États-Unis ?", "Le F-150", "Le Ranger", "Le Bronco", "L'Explorer"]]),
        QZ("Courses américaines", "Indy, NASCAR, drag", [
          ["Quelle course de 500 miles se dispute à Indianapolis ?", "Les 500 Miles d'Indianapolis", "Le Daytona 500", "Le Brickyard Classic", "Le Sebring 500"],
          ["Quelle course ouvre traditionnellement la saison NASCAR à Daytona ?", "Le Daytona 500", "Le Southern 500", "Le Coca-Cola 600", "L'Indy 500"],
          ["Quelle distance parcourent la plupart des dragsters en course ?", "Un quart de mile", "Un mile", "Un demi-mile", "Dix miles"],
          ["Où se tiennent des records de vitesse terrestre américains, sur le sel ?", "Bonneville", "Daytona", "Mojave", "Sebring"]]),
        QZ("Culture américaine", "Route 66, DeLorean, Cadillac", [
          ["Quelle voiture est la machine à voyager dans le temps de Retour vers le futur ?", "La DeLorean DMC-12", "La Ford Mustang", "La Chevrolet Corvette", "La Tucker 48"],
          ["Quelle route mythique relie Chicago à Los Angeles ?", "La Route 66", "La Route 1", "L'Interstate 95", "La Route 101"],
          ["Quelle marque de luxe de General Motors a pour emblème un blason ?", "Cadillac", "Lincoln", "Chrysler", "Buick"],
          ["À quel groupe appartient Chevrolet ?", "General Motors", "Ford", "Stellantis", "Tesla"]])
      ],
      vf: [
        VF([["La Ford Model T a été produite à plus de 15 millions d'exemplaires.", 1], ["La Corvette est une Ford.", 0], ["Detroit est surnommée Motor City.", 1], ["La DeLorean DMC-12 était fabriquée en Irlande du Nord.", 1]]),
        VF([["La Ford Mustang a été lancée en 1964.", 1], ["Les courses NASCAR se disputent uniquement sur circuits routiers.", 0], ["Jeep est née pendant la Seconde Guerre mondiale.", 1], ["Tesla a été fondée en 2003.", 1]]),
        VF([["La Dodge Viper a un moteur V10.", 1], ["Le Ford GT40 a gagné Le Mans en 1966.", 1], ["Chevrolet appartient à Ford.", 0], ["La Route 66 relie New York à Miami.", 0]])
      ]
    },
    gb: {
      quiz: [
        QZ("Marques britanniques", "Rolls-Royce, Aston Martin, Mini", [
          ["Quelle marque est célèbre pour sa Spirit of Ecstasy ?", "Rolls-Royce", "Bentley", "Jaguar", "Rover"],
          ["Quelle voiture conduit James Bond dans Goldfinger ?", "Une Aston Martin DB5", "Une Jaguar E-Type", "Une Bentley Mark VI", "Une Lotus Esprit"],
          ["Quelle petite voiture dessinée par Alec Issigonis est apparue en 1959 ?", "La Mini", "La Morris Minor", "La Austin Seven", "La Triumph Herald"],
          ["Quel félin figure sur le logo de Jaguar ?", "Un jaguar bondissant", "Un lion", "Un guépard", "Une panthère"]]),
        QZ("Roadsters et sportives", "E-Type, Lotus, Morgan", [
          ["Quelle Jaguar de 1961 aurait été jugée la plus belle voiture du monde par Enzo Ferrari ?", "La E-Type", "La XK120", "La XJ220", "La F-Type"],
          ["Quelle marque fondée par Colin Chapman est connue pour sa légèreté ?", "Lotus", "TVR", "Caterham", "Ginetta"],
          ["Quel constructeur de Malvern fabrique encore des voitures sur châssis en bois ?", "Morgan", "Westfield", "Noble", "Ariel"],
          ["Quelle marque est connue pour son logo octogonal ?", "MG", "Triumph", "Austin", "Riley"]]),
        QZ("Formule 1 et course", "Silverstone, McLaren, Cosworth", [
          ["Quel circuit a accueilli le premier Grand Prix de F1 en 1950 ?", "Silverstone", "Brands Hatch", "Donington", "Goodwood"],
          ["Quelle écurie britannique est basée à Woking ?", "McLaren", "Williams", "Lotus", "Brabham"],
          ["Quel moteur Cosworth a dominé la F1 des années 60 à 80 ?", "Le DFV", "Le DFX", "Le HB", "Le Zetec"],
          ["Quel événement de Goodwood réunit voitures anciennes et modernes dans une montée ?", "Le Festival of Speed", "Le Revival", "Le Brooklands Day", "Le Silverstone Classic"]]),
        QZ("Luxe à l'anglaise", "Bentley, Rolls-Royce, Land Rover", [
          ["Dans quelle ville est installée l'usine Bentley ?", "Crewe", "Coventry", "Oxford", "Derby"],
          ["Quelle marque produit le Defender ?", "Land Rover", "Jeep", "Toyota", "Rover"],
          ["Dans quel village est installée l'usine Aston Martin de Gaydon ?", "Gaydon", "Silverstone", "Woking", "Hethel"],
          ["Quel groupe allemand possède Rolls-Royce Motor Cars ?", "BMW", "Volkswagen", "Daimler", "Audi"]]),
        QZ("Voitures populaires", "Mini, Austin, Reliant", [
          ["Quelle voiture à trois roues est celle de Del Boy dans Only Fools and Horses ?", "La Reliant Regal", "La Bond Bug", "La Messerschmitt", "La Isetta"],
          ["Quelle Austin de 1922 a démocratisé l'automobile en Grande-Bretagne ?", "L'Austin Seven", "L'Austin Healey", "L'Austin Allegro", "L'Austin Maxi"],
          ["Quelle Morris de 1948 est la première voiture britannique à dépasser le million d'exemplaires ?", "La Minor", "La Oxford", "La Cowley", "La Marina"],
          ["Quel tout-terrain Rover a été lancé en 1948 ?", "La Land Rover", "La Range Rover", "La Jeep Willys", "La Discovery"]]),
        QZ("Hypercars britanniques", "McLaren F1, Valkyrie, Evija", [
          ["Quelle McLaren de 1992 a un V12 BMW et le conducteur placé au centre ?", "La McLaren F1", "La MP4-12C", "La P1", "La Senna"],
          ["Quelle hypercar électrique de Lotus s'appelle ainsi ?", "L'Evija", "L'Elise", "L'Emira", "L'Eletre"],
          ["Quelle hypercar Aston Martin a été conçue avec Red Bull ?", "La Valkyrie", "La Vanquish", "La Vantage", "La DB11"],
          ["Quel designer a signé la McLaren F1 ?", "Gordon Murray", "Adrian Newey", "Colin Chapman", "Ian Callum"]])
      ],
      vf: [
        VF([["Jaguar est basée à Coventry.", 1], ["La Mini est apparue en 1959.", 1], ["Rolls-Royce Motor Cars appartient à BMW.", 1], ["Silverstone est en Écosse.", 0]]),
        VF([["La Lotus Elise est une voiture très lourde.", 0], ["Bentley est basée à Crewe.", 1], ["Aston Martin est une marque italienne.", 0], ["McLaren est basée à Woking.", 1]]),
        VF([["Le premier Grand Prix de F1 a eu lieu à Monaco en 1950.", 0], ["Le Land Rover est apparu en 1948.", 1], ["Morgan fabrique encore des voitures à châssis en bois.", 1], ["La McLaren F1 a son conducteur placé au centre.", 1]])
      ]
    },
    se: {
      quiz: [
        QZ("Volvo, la sécurité", "Göteborg et la ceinture trois points", [
          ["Dans quelle ville suédoise est installé le siège de Volvo Cars ?", "Göteborg", "Stockholm", "Malmö", "Uppsala"],
          ["Quelle innovation de Volvo en 1959 a sauvé des millions de vies ?", "La ceinture trois points", "L'airbag", "L'ABS", "Le pare-brise feuilleté"],
          ["Quelle Volvo coupé est la star de la série Le Saint ?", "La P1800", "La 240", "La 850", "La C70"],
          ["Quel groupe chinois possède Volvo Cars depuis 2010 ?", "Geely", "SAIC", "BYD", "Dongfeng"]]),
        QZ("Saab", "Des avions aux voitures", [
          ["Que fabriquait Saab avant de produire des voitures ?", "Des avions", "Des tracteurs", "Des bateaux", "Des trains"],
          ["Dans quelle ville suédoise se trouvait l'usine Saab ?", "Trollhättan", "Göteborg", "Linköping", "Västerås"],
          ["Quelle technologie Saab a popularisé sur ses voitures dès la 99 Turbo ?", "Le turbo", "Le diesel", "Le rotatif", "L'hybride"],
          ["Quel animal mythique figure sur le logo Saab ?", "Un griffon", "Un dragon", "Un lion ailé", "Un phénix"]]),
        QZ("Koenigsegg", "Les hypercars d'Ängelholm", [
          ["Dans quelle ville est installé Koenigsegg ?", "Ängelholm", "Göteborg", "Stockholm", "Lund"],
          ["Qui a fondé Koenigsegg en 1994 ?", "Christian von Koenigsegg", "Håkan Samuelsson", "Gunnar Engellau", "Erik Carlsson"],
          ["Quelle Koenigsegg a battu le record de vitesse en 2017 ?", "L'Agera RS", "La CCX", "La Jesko", "La Gemera"],
          ["Quelle Koenigsegg utilise une transmission directe, sans boîte de vitesses classique ?", "La Regera", "L'Agera R", "La CC8S", "La One:1"]]),
        QZ("Électrique et SUV", "Polestar, XC90, EX30", [
          ["Quelle marque est la division performance électrique liée à Volvo ?", "Polestar", "Lynk & Co", "Zeekr", "Smart"],
          ["Quel SUV Volvo lancé en 2002 est un best-seller ?", "Le XC90", "Le V40", "Le S60", "Le C30"],
          ["Quelle Volvo électrique compacte est apparue en 2023 ?", "L'EX30", "La V90", "La S40", "La 740"],
          ["Quel symbole historique de Volvo est un cercle avec une flèche ?", "Le symbole du fer", "Le symbole de Mars", "La rose des vents", "Le trident"]]),
        QZ("Neige et rallye", "Le rallye de Suède", [
          ["Quel rallye du championnat du monde se court sur la neige en Suède ?", "Le Rallye de Suède", "Le Rallye de Finlande", "Le Rallye Monte-Carlo", "Le Rallye d'Argentine"],
          ["Quel pilote suédois a été champion du monde des rallyes 1984 sur Audi Quattro ?", "Stig Blomqvist", "Björn Waldegård", "Per Eklund", "Kenneth Eriksson"],
          ["Quelle Saab des années 60 a gagné de nombreux rallyes avec Erik Carlsson ?", "La Saab 96", "La Saab 900", "La Saab 99", "La Saab Sonett"],
          ["Quelle marque suédoise de camions a un griffon pour emblème ?", "Scania", "Volvo Trucks", "Mack", "Iveco"]]),
        QZ("Histoire suédoise", "Premières Volvo, Saab, Scania", [
          ["En quelle année est sortie la première Volvo, l'ÖV4 ?", "1927", "1949", "1955", "1938"],
          ["Quel constructeur américain a possédé Saab Automobile ?", "General Motors", "Ford", "Chrysler", "Tesla"],
          ["Quelle Volvo break a couru en BTCC en 1994 ?", "La 850 Estate", "La 240 Estate", "La V70", "La 940"],
          ["Quelle marque suédoise d'hypercars a pour fondateur un ancien fabricant de voitures miniatures ?", "Koenigsegg", "Saab", "Polestar", "Volvo"]])
      ],
      vf: [
        VF([["Volvo est basée à Göteborg.", 1], ["Saab a fabriqué des avions.", 1], ["Koenigsegg est une marque danoise.", 0], ["La ceinture trois points a été inventée par un ingénieur de Volvo.", 1]]),
        VF([["Polestar est liée à Volvo.", 1], ["Le Rallye de Suède se court sur terre sèche.", 0], ["Scania fabrique des camions.", 1], ["La Volvo P1800 apparaît dans la série Le Saint.", 1]]),
        VF([["Saab appartient aujourd'hui à Volvo.", 0], ["Volvo Cars est détenue par Geely.", 1], ["Le logo Saab est un griffon.", 1], ["Koenigsegg fabrique ses voitures à Ängelholm.", 1]])
      ]
    }
  };

  const CHAPTERS = [
    { id: "fr", name: "France", iso: "FRA", lat: 47.2, lon: 2.4, color: "#2f5fd0", era: "1900 – aujourd'hui", blurb: "Du fiacre motorisé à l'Alpine : l'Hexagone a inventé l'automobile populaire, les 24 Heures du Mans et des légendes de rallye." },
    { id: "it", name: "Italie", iso: "ITA", lat: 44.5, lon: 10.9, color: "#1f9d55", era: "Supercars et design", blurb: "Maranello, Sant'Agata, Turin : berceau des supercars rouges, du beau design et des moteurs qui chantent." },
    { id: "de", name: "Allemagne", iso: "DEU", lat: 48.8, lon: 9.2, color: "#d4a017", era: "Ingénierie et vitesse", blurb: "Stuttgart, Munich, Wolfsburg et l'Enfer vert du Nürburgring : l'ingénierie qui a fait de l'auto un art de précision." },
    { id: "jp", name: "Japon", iso: "JPN", lat: 35.7, lon: 139.7, color: "#d6204a", era: "JDM et légendes des années 90", blurb: "JDM, drift, kei cars, hybrides pionnières et les légendes des années 90 qui font encore rêver." },
    { id: "us", name: "États-Unis", iso: "USA", lat: 42.3, lon: -83.0, color: "#c0392b", era: "Muscle cars et grands espaces", blurb: "Detroit, muscle cars, drag racing et Route 66 : l'automobile à l'américaine, en grand." },
    { id: "gb", name: "Royaume-Uni", iso: "GBR", lat: 52.0, lon: -1.5, color: "#7a4fc2", era: "Élégance et course", blurb: "Silverstone, l'élégance britannique, les roadsters légers et les hypercars de Woking." },
    { id: "se", name: "Suède", iso: "SWE", lat: 60.5, lon: 15.0, color: "#1a8fbd", era: "Sécurité et hypercars", blurb: "Volvo, Saab et Koenigsegg : la sécurité d'abord, puis la vitesse extrême." }
  ];

  // ---- construction des 20 épreuves de chaque chapitre
  const BATTLE_TITLES = { easy: ["Premier duel", "Une bataille contre l'IA (facile)"], n1: ["Sur la route", "Une bataille contre l'IA (normal)"], n2: ["Duel d'adresse", "Une bataille contre l'IA (normal)"], hard: ["Adversaire coriace", "Une bataille contre l'IA (difficile)"], boss: ["Le boss final", "Une bataille contre l'IA (difficile)"] };
  const FULL = ["q0", "b:easy", "v0", "g", "q1", "p", "b:n1", "q2", "o", "v1", "b:n2", "q3", "g", "q4", "p", "b:hard", "v2", "q5", "o", "b:boss"];
  /** la France garde ses six premières épreuves (identifiants fr-1 à fr-6 : la progression existante reste valable) */
  const FR_HEAD = ["q0", "b:easy", "q1", "b:n1", "q2", "b:hard"], FR_TAIL = ["v0", "g", "q3", "p", "v1", "q4", "o", "b:n2", "q5", "g", "v2", "p", "o", "b:boss"];
  function build(ch) {
    const C = CONTENT[ch.id], seq = ch.id === "fr" ? FR_HEAD.concat(FR_TAIL) : FULL, out = [];
    seq.forEach((tok, i) => {
      const id = ch.id + "-" + (i + 1), k = tok.slice(1);
      if (tok[0] === "q") { const z = C.quiz[+k]; out.push({ id, type: "quiz", title: z.title, sub: z.sub, qs: z.qs }); }
      else if (tok[0] === "v") out.push({ id, type: "vf", title: "Vrai ou faux", sub: "Quatre affirmations à trancher", items: C.vf[+k] });
      else if (tok === "g") out.push({ id, type: "guess", country: ch.id, title: "Devine la voiture", sub: "Une photo, quatre propositions" });
      else if (tok === "p") out.push({ id, type: "pm", country: ch.id, title: "La plus puissante", sub: "Laquelle a le plus de chevaux ?" });
      else if (tok === "o") out.push({ id, type: "old", country: ch.id, title: "La plus ancienne", sub: "Laquelle est sortie en premier ?" });
      else { const b = BATTLE_TITLES[tok.slice(2)], lv = tok.slice(2); out.push({ id, type: "battle", title: b[0], sub: b[1], level: lv === "easy" ? "easy" : lv === "hard" || lv === "boss" ? "hard" : "normal", boss: lv === "boss" }); }
    });
    return out;
  }
  CHAPTERS.forEach((ch) => { ch.trials = build(ch); });

  /** étoiles d'un quiz selon le nombre de bonnes réponses (0 = raté) ; il faut au moins 60 % de bonnes réponses */
  const quizStars = (ok, n) => (ok >= n ? 3 : ok >= Math.ceil(n * 0.75) ? 2 : ok >= Math.ceil(n * 0.6) ? 1 : 0);
  /** étoiles d'une bataille en 3 manches : 1 = victoire, 2 = victoire sans manche perdue, 3 = 3-0 ; 0 = défaite ou égalité */
  const battleStars = (me, ai) => (me > ai ? (ai === 0 ? (me >= 3 ? 3 : 2) : 1) : 0);
  const byId = (id) => CHAPTERS.find((c) => c.id === id) || null;
  /** épreuve débloquée si la précédente du chapitre est validée (≥ 1 étoile) */
  const unlocked = (ch, i, done) => i === 0 || (done[ch.trials[i - 1].id] || 0) > 0;
  const chapterStars = (ch, done) => ch.trials.reduce((s, t) => s + (done[t.id] || 0), 0);
  const chapterDone = (ch, done) => ch.trials.length > 0 && ch.trials.every((t) => (done[t.id] || 0) > 0);
  /** première épreuve jouable pas encore validée (pour la mettre en avant) */
  const nextTrial = (ch, done) => ch.trials.findIndex((t, i) => !(done[t.id] > 0) && unlocked(ch, i, done));
  /** chapitre commencé (au moins une étoile) mais pas terminé : il faut le finir avant d'en ouvrir un autre */
  const current = (done) => CHAPTERS.find((c) => chapterStars(c, done) > 0 && !chapterDone(c, done)) || null;
  /** un chapitre peut être joué s'il est en cours, ou si aucun autre chapitre n'est en cours */
  const canPlay = (ch, done) => { const cur = current(done); return !cur || cur.id === ch.id; };
  /** réglage de l'IA d'une bataille : de plus en plus adroite et avec des cartes plus fortes au fil de l'histoire (et d'un pays à l'autre) */
  const battleSetup = (ch, trial) => {
    const bs = ch.trials.filter((t) => t.type === "battle"), k = Math.max(0, bs.findIndex((t) => t.id === trial.id)), p = bs.length > 1 ? k / (bs.length - 1) : 0, ci = Math.max(0, CHAPTERS.indexOf(ch));
    return { skill: Math.min(0.75, 0.05 + 0.45 * p + 0.025 * ci + (trial.boss ? 0.08 : 0)), bias: -0.1 + 0.18 * p + 0.01 * ci + (trial.boss ? 0.04 : 0) };
  };
  const api = { battleSetup, current, canPlay, CHAPTERS, quizStars, battleStars, byId, unlocked, chapterStars, chapterDone, nextTrial };
  if (typeof module === "object" && module.exports) module.exports = api; else window.MA.register("CampaignData", api);
})();
