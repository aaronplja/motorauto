/** MOTORAUTO — compléments Audi (1936-1996) : histoire détaillée, anecdotes, palmarès. */
(function () {
  "use strict";
  const m = {};
  const add = (id, h, a, r, rel, e) => { m[id] = { h, a: a || [], r: r || [], rel: rel || [], e: e || null, ap: true }; };

  add("auto-union-type-c",
    "Auto Union naît en 1932 de la fusion de quatre constructeurs saxons : Audi, DKW, Horch et Wanderer, d'où les quatre anneaux. Le gouvernement allemand aide financièrement les équipes de course, et Auto Union confie à Ferdinand Porsche et à son bureau d'études une monoplace révolutionnaire : un V16 de 4,4 puis 6 litres placé derrière le pilote. La Type C de 1936 pousse la formule avec un V16 à compresseur de 520 ch.\n\nEn 1936, Bernd Rosemeyer, un ancien pilote de moto, remporte trois Grands Prix et le championnat d'Europe des pilotes. En 1937, il est l'un des plus rapides sur l'Avus, avec une Type C carénée (Stromlinie), et bat des records de vitesse sur l'autoroute. Il se tue en janvier 1938 en tentant d'établir un record de vitesse, au volant d'une Type C Stromlinie.\n\nCes voitures sont réputées difficiles à conduire : le moteur arrière et les roues arrière étroites rendaient les glissades brutales.",
    [["Rosemeyer, l'idole", "Bernd Rosemeyer, marié à l'aviatrice Elly Beinhorn, était une figure populaire de l'Allemagne d'avant-guerre."], ["Un tour à 276 km/h", "En 1937, sur l'Avus berlinoise, les Type C carénées ont tourné à des moyennes de plus de 270 km/h, un record pour une course."]],
    [["Palmarès", "Championnat d'Europe des pilotes 1936 (Rosemeyer)."], ["Avus 1937", "Meilleur tour en course à plus de 270 km/h de moyenne."]], ["auto-union-type-d", "audi-quattro"], [[700, 0, 4.5]]);

  add("auto-union-type-d",
    "Pour 1938, la nouvelle formule limite la cylindrée des moteurs suralimentés à 3 litres. Auto Union remplace son V16 par un V12 compact et conçoit la Type D, plus légère et plus équilibrée que la Type C, avec une suspension arrière à essieu De Dion. La mort de Rosemeyer en janvier 1938 prive l'équipe de son leader : Tazio Nuvolari, le « Mantouan volant », rejoint alors la marque.\n\nNuvolari gagne le Grand Prix de Donington en 1938, au nez et à la barbe de Mercedes, puis celui de Belgrade en 1939, dans la dernière course de Grand Prix avant la guerre. Les usines Auto Union de Saxe sont occupées après 1945 par l'Armée rouge ; la société est refondée en Bavière, à Ingolstadt, en 1949.\n\nLes Type D ont couru jusqu'en 1939 et quelques exemplaires sont arrivés en URSS après la guerre.",
    [["Nuvolari à Donington", "La victoire de 1938, devant des spectateurs britanniques, a eu une portée symbolique forte à l'approche de la guerre."], ["Des voitures en Russie", "Plusieurs voitures d'Auto Union ont été emmenées en URSS à la fin de la guerre."]],
    [["Palmarès", "Victoires de Nuvolari à Donington (1938) et à Belgrade (1939)."]], ["auto-union-type-c"], [[500, 0, 4.5]]);

  add("audi-quattro",
    "L'idée de la quattro naît en 1976-1977 : l'ingénieur Jörg Bensinger, chargé des essais, constate sur la neige qu'une Volkswagen Iltis militaire à quatre roues motrices dépasse les voitures de sport à deux roues motrices. L'idée est portée par Ferdinand Piëch, alors responsable du développement chez Audi. La quattro est présentée en mars 1980 au Salon de Genève : un coupé à cinq cylindres turbo, quatre roues motrices permanentes et un différentiel central blocable.\n\nEn rallye, elle surclasse la concurrence dès 1981. Michèle Mouton, première femme à gagner une manche du championnat du monde (San Remo 1981), termine deuxième du championnat 1982. Audi gagne le titre constructeurs en 1982 et 1984 ; Hannu Mikkola (1983) et Stig Blomqvist (1984) sont champions du monde. La quattro lance ensuite la mode de la transmission intégrale sur les berlines sportives.\n\nElle est produite de 1980 à 1991, à environ 11 450 exemplaires, dont une dernière version 20 soupapes à partir de 1989.",
    [["De l'Iltis à la quattro", "Un véhicule militaire à quatre roues motrices a inspiré une sportive : c'est ainsi que la transmission intégrale s'est invitée sur les voitures de route performantes."], ["Vorsprung durch Technik", "Le slogan d'Audi (« l'avance par la technologie ») est étroitement associé à la quattro."], ["Michèle Mouton", "La pilote française a gagné quatre rallyes mondiaux avec Audi."]],
    [["Titres constructeurs WRC", "1982 et 1984."], ["Titres pilotes WRC", "Hannu Mikkola (1983), Stig Blomqvist (1984)."], ["Production", "Environ 11 450 exemplaires de 1980 à 1991."]], ["audi-sport-quattro", "audi-sport-quattro-s1-e2"]);

  add("audi-sport-quattro",
    "Le règlement du Groupe B, introduit en 1982, impose la production de 200 exemplaires de série pour homologuer une voiture. Audi construit en 1984 la Sport quattro, une quattro dont l'empattement est raccourci de 32 cm et dont la carrosserie utilise le kevlar et la fibre de verre. Le moteur reçoit une culasse à 20 soupapes en aluminium, pour un poids total d'environ 1 200 kg.\n\nVendue environ 200 000 marks à l'époque, soit plus de trois fois le prix d'une quattro, elle est produite à environ 200 exemplaires seulement. Sa silhouette trapue et son rapport poids/puissance sont uniques. Elle sert de base à la Sport quattro S1 de rallye, plus puissante et pourvue d'ailerons.",
    [["32 centimètres de moins", "L'empattement raccourci donne à la Sport quattro une silhouette ramassée qui la distingue de la quattro."]],
    [["Rareté", "Environ 200 exemplaires produits, soit le minimum d'homologation du Groupe B."]], ["audi-quattro", "audi-sport-quattro-s1-e2"]);

  add("audi-sport-quattro-s1-e2",
    "La Sport quattro S1 est la voiture d'Audi pour les années les plus extrêmes du rallye, de 1985 à 1986. Équipée d'un cinq cylindres 2,1 litres de 20 soupapes, d'un énorme aileron avant et arrière et d'une transmission à différentiels réglables, elle dépasse 500 ch en spécification de course. Walter Röhrl gagne San Remo en 1985 avec la S1. L'année 1986 est marquée par la mort d'Henri Toivonen et de son copilote sur une Lancia Delta S4 en Corse, puis par l'accident de Joaquim Santos au Portugal. La FIA interdit le Groupe B à la fin de la saison. Audi se retire du rallye mondial.\n\nAudi réutilise la S1 pour la course de côte de Pikes Peak. En 1987, Walter Röhrl établit le record de l'épreuve à 10 min 47 s 85 au volant d'une S1 d'environ 600 ch.",
    [["Pikes Peak 1987", "Röhrl a gravi la montagne en 10 minutes 47 secondes 85 avec une S1 équipée d'une aérodynamique spéciale."], ["Michèle Mouton à Pikes Peak", "La pilote française a remporté l'épreuve en 1985 avec la Sport quattro S1."], ["La fin du Groupe B", "Le Groupe B a été interdit à la fin de la saison 1986 après plusieurs accidents mortels."]],
    [["Pikes Peak (1987)", "Record de la course : 10 min 47 s 85 (Walter Röhrl)."], ["Pikes Peak (1985)", "Victoire de Michèle Mouton."]], ["audi-sport-quattro", "audi-quattro"]);

  add("audi-80-b3",
    "La troisième génération de l'Audi 80 (type B3), présentée en 1986, repose sur un dessin aérodynamique travaillé en soufflerie (Cx de 0,29). Audi y généralise la galvanisation complète de la caisse, avec une garantie anticorrosion de dix ans, un argument alors inédit dans le segment. Les moteurs vont du 1.6 au 2.3 cinq cylindres, avec le diesel TD et la transmission quattro à différentiel Torsen disponible.\n\nSur cette base, Audi lance l'Audi 90 (haut de gamme, cinq cylindres), la S2 et la 80 Cabriolet. La B3 est une voiture symbole du renouveau d'Audi dans les années 1980, après la crise liée à l'affaire de l'accélération involontaire aux États-Unis.",
    [["La galvanisation", "Audi a travaillé avec l'industrie sidérurgique pour offrir une garantie contre la corrosion perforante sur toute la caisse."], ["L'affaire américaine", "Aux États-Unis, la marque a souffert d'accusations d'accélération spontanée dans les années 1980."]],
    [["Aérodynamique", "Cx de 0,29, parmi les meilleurs de sa catégorie en 1986."]], ["audi-80-b4", "audi-90-quattro-20v"]);

  add("audi-80-b4",
    "La B4, lancée en 1991, prolonge la carrière de l'Audi 80 : plus longue, avec un habitacle plus spacieux. Elle est la première Audi 80 à recevoir un V6 (2,6 puis 2,8 litres) en plus des quatre et cinq cylindres. La transmission quattro est proposée sur plusieurs versions. La gamme comprend la berline, l'Avant et le Cabriolet.\n\nLa B4 a pour successeur l'A4 en 1994. La version Avant RS2, assemblée chez Porsche, marque en 1994 l'histoire des breaks sportifs.",
    [["Une carrière de vingt ans", "L'Audi 80 a été produite de 1972 à 1996 en quatre générations."]],
    [["Longévité", "L'Audi 80 a été produite de 1972 à 1996."]], ["audi-rs2-avant", "audi-s2"]);

  add("audi-90-quattro-20v",
    "L'Audi 90 est la version haut de gamme de l'Audi 80 B3, dotée de moteurs plus puissants. En 1989, Audi lui offre un cinq cylindres de 2,3 litres à 20 soupapes, dérivé de celui de la quattro, qui délivre 170 ch. Avec la transmission quattro et un différentiel Torsen, elle accélère de 0 à 100 km/h en environ 8 secondes.\n\nElle sert de base à la 90 quattro IMSA GTO, une voiture de course américaine de 700 ch. Sa production s'arrête en 1991, remplacée par la nouvelle gamme 80/100.",
    [["Un cinq cylindres de 20 soupapes", "L'architecture 20V du 5 cylindres sera ensuite popularisée sur la S2 et la RS2."]], [], ["audi-90-quattro-imsa-gto", "audi-s2"]);

  add("audi-90-quattro-imsa-gto",
    "Audi s'engage en 1989 en championnat IMSA GTO, aux États-Unis, avec la 90 quattro. La voiture, entièrement refaite sous une carrosserie élargie et sans lien technique avec la voiture de série, reçoit un cinq cylindres turbo de 2,2 litres d'environ 700 ch et la transmission quattro. Hans-Joachim Stuck et Walter Röhrl la pilotent. Elle s'impose à plusieurs reprises, mais les règles du championnat changent rapidement pour limiter l'avantage de la transmission intégrale, et Audi se retire après la saison 1989.\n\nElle reste une des voitures de course les plus puissantes jamais engagées par Audi.",
    [["Stuck et Röhrl aux États-Unis", "Le Bavarois et l'Allemand de l'Ouest ont piloté la 90 quattro IMSA GTO lors de plusieurs épreuves américaines."]], [], ["audi-90-quattro-20v"], [[700, 0, 3.3]]);

  add("audi-s2",
    "La S2 est présentée en 1990 comme successeur de l'Audi Coupé quattro. Elle reprend le cinq cylindres 2,2 litres turbo à 20 soupapes de 220 ch (230 ch à partir de 1993) et la transmission quattro à différentiel Torsen. Elle est proposée en coupé, en berline (Limousine) et en Avant.\n\nLa S2 est la première Audi à porter la lettre S pour « Sport ». Elle donne naissance à la RS2 Avant, développée avec Porsche, et lance une longue série de S et de RS.",
    [["La première S", "La lettre S est apparue sur les Audi à partir de 1990 pour désigner les versions sportives."]], [], ["audi-rs2-avant", "audi-80-b4"]);

  add("audi-rs2-avant",
    "En 1992, Audi demande à Porsche de transformer l'Audi 80 Avant en voiture sportive. Porsche remodèle le cinq cylindres 2,2 litres turbo (turbo plus gros, injection spécifique, échappement) pour atteindre 315 ch, ajoute des freins Brembo et des jantes à étoiles de Porsche, et assemble les voitures dans l'usine de Zuffenhausen, à Stuttgart. La RS2 Avant est présentée en 1994.\n\nElle atteint 262 km/h et accélère de 0 à 100 km/h en 4,8 secondes, plus vite que la Ferrari 348 de l'époque. Seulement 2 891 exemplaires sont produits. La RS2 est la première Audi à porter la lettre R pour RennSport, un marquage qui désigne aujourd'hui les modèles Audi Sport les plus performants.",
    [["Un break plus rapide qu'une Ferrari", "À sa sortie, la RS2 accélérait de 0 à 100 plus vite que la plupart des supercars."], ["Porsche partout", "Le logo Porsche apparaît sur les rétroviseurs, les jantes et les étriers de freins."]],
    [["Production", "2 891 exemplaires entre 1994 et 1995."], ["0 à 100 km/h", "4,8 secondes ; vitesse de pointe 262 km/h."]], ["audi-s2", "audi-rs6-c5"]);

  add("audi-v8",
    "L'Audi V8 (1988) est la réponse d'Audi aux berlines de luxe allemandes. Sa carrosserie dérive de l'Audi 100/200 et son V8 de 3,6 litres à 32 soupapes développe 250 ch. La transmission quattro est de série, avec un différentiel Torsen. Une boîte manuelle est proposée au début, rarement commandée.\n\nLa V8 est la première Audi de série à moteur à huit cylindres. Son moteur évolue vers 4,2 litres et 280 ch en 1991. Dérivée en course, elle remporte le championnat allemand des voitures de tourisme (DTM) en 1990 et 1991. Elle a pour successeur l'A8 en 1994.",
    [["La V8 en course", "La V8 quattro DTM a gagné le championnat en 1990 (Stuck) et 1991 (Biela)."]],
    [["Premier V8 Audi", "Première Audi de série à moteur huit cylindres."]], ["audi-v8-quattro-dtm"]);

  add("audi-v8-quattro-dtm",
    "En 1990, Audi s'engage dans le championnat allemand de voitures de tourisme (DTM) avec la V8 quattro. La voiture, pourtant lourde, bénéficie d'un V8 de 3,6 litres préparé et de la transmission intégrale, qui la rend très efficace au départ et sur le mouillé. Hans-Joachim Stuck remporte le titre en 1990, puis Frank Biela celui de 1991. La transmission intégrale suscite des protestations de la concurrence.\n\nAprès 1991, le règlement évolue et Audi se retire. La marque reviendra dans le DTM en 2004 avec l'A4 DTM.",
    [["La quattro en DTM", "La quattro a réussi à s'imposer là où les voitures à deux roues motrices dominaient depuis des années."]],
    [["Champion DTM", "Hans-Joachim Stuck (1990), Frank Biela (1991)."]], ["audi-v8"]);

  MAKIT.enrich(m);
})();
