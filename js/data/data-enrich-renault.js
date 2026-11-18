/** MOTORAUTO — compléments Renault et Alpine (lot 3) : 0-100, histoire, anecdotes. Valeurs constructeur arrondies : fiches marquées « indicatif ». */
(function () {
  "use strict";
  if (typeof MAKIT === "undefined") return;
  const m = {};
  const add = (id, h, a, r, e) => {
    const x = { ap: true };
    if (h) x.h = h; if (a && a.length) x.a = a; if (r && r.length) x.r = r;
    if (e) { const arr = []; Object.keys(e).forEach((k) => { arr[Number(k)] = Array.isArray(e[k]) ? e[k] : [0, 0, e[k]]; }); x.e = arr; }
    m[id] = x;
  };

  /* ------------------------------------------------------------------ Alpine */
  add("alpine-a106", "L'A106 (1955) est la première Alpine de série. Jean Rédélé, concessionnaire Renault à Dieppe, la construit sur la base mécanique de la 4 CV. Le nom « Mille Miles » rappelle ses bons résultats à la Mille Miglia.",
    [["Une base de 4 CV", "Elle reprend le moteur et le train de la Renault 4 CV, habillés d'une carrosserie en fibre de verre."], ["Jean Rédélé", "Le fondateur d'Alpine était pilote de rallye avant de devenir constructeur."]]);
  add("alpine-a108", "L'A108 (1958) remplace l'A106 sur une base Dauphine, avec un châssis poutre et une carrosserie en polyester. Elle est proposée en coupé 2+2, Tour de France et cabriolet.",
    [["Châssis poutre", "Elle adopte un châssis poutre central, qui servira à l'A110."], ["Coupé 2+2", "Une version 2+2 est proposée."]], [], { 0: 28, 1: 24, 2: 22 });
  add("alpine-a110-classic", null, [["Titre mondial 1973", "L'Alpine-Renault A110 remporte le premier Championnat du monde des rallyes des constructeurs en 1973."], ["Monte-Carlo 1971", "Ove Andersson gagne le Rallye Monte-Carlo 1971 au volant d'une A110."]], [["Rallye", "Championne du monde des rallyes constructeurs en 1973."]], { 0: 11.5, 1: 8.5, 2: 7.5, 3: 8, 4: 6.5, 5: 6.5, 6: 6.8, 7: 7, 8: 5.5 });
  add("alpine-a310", "L'A310 (1971) succède à l'A110 avec une ligne en coin et un moteur arrière. En 1976, elle reçoit le V6 PRV 2.7 litres qui en fait une GT. Elle est produite jusqu'en 1985.",
    [["Le V6 PRV", "Le V6 2.7 litres de 150 ch arrive en 1976."], ["Du rallye à la GT", "Elle abandonne la vocation de compétition de l'A110."]], [], { 0: 8.8, 1: 8.4, 2: 7.8 });
  add("alpine-gta", "La GTA (1985) succède à l'A310. Elle arrive avec le V6 PRV atmosphérique puis turbo (200 ch), une ligne plus moderne et une carrosserie en polyester. Elle reste au catalogue jusqu'en 1991.",
    [["V6 Turbo", "Le V6 turbo de 200 ch en fait une sportive française rapide."], ["Le Mans", "Une version Le Mans (1990) marque la fin de la série."]], [], { 0: 7.6 });
  add("alpine-a610", "L'A610 (1991) est la dernière Alpine de l'ère de Dieppe avant la fermeture temporaire de la marque. Son V6 turbo de 250 ch lui donne de bonnes performances. Seuls 818 exemplaires sont construits.",
    [["818 exemplaires", "Une série très limitée."], ["Fin d'une époque", "Alpine disparaît du catalogue en 1995."]]);
  add("alpine-a110-2017", null, [["Le retour d'Alpine", "L'A110 (2017) relance la marque avec une berlinette tout en aluminium, d'environ 1 100 kg."], ["Dieppe", "Elle est fabriquée dans l'usine historique de Dieppe."]]);
  add("alpine-a290", "L'A290 (2024) est la première Alpine électrique, une compacte sportive dérivée de la Renault 5 E-Tech. Elle développe de 180 à 220 ch.",
    [["Cousine de la R5", "Elle partage sa plate-forme avec la Renault 5 E-Tech."], ["Alpine Torque Vectoring", "Un différentiel virtuel améliore la tenue de route."]]);
  add("alpine-a390", "L'A390 (2025) est le SUV coupé électrique d'Alpine, avec trois moteurs et jusqu'à 470 ch. Il est assemblé à Dieppe comme l'A110.",
    [["Trois moteurs", "Un moteur à l'avant et deux à l'arrière."], ["Alpine Launch Control", "Le mode de départ lancé est proposé."]], [], { 0: 4.8, 1: 3.9 });
  add("alpine-a220", "L'Alpine A220 (2013) est un prototype LMP2 d'endurance développé avec Signatech. Elle remporte la catégorie LMP2 en WEC, et devient A450, A460 puis A470.",
    [["Signatech-Alpine", "L'équipe est championne du monde WEC LMP2 en 2016."], ["Moteur Gibson", "Un V8 4.2 litres de 600 ch."]]);

  /* ------------------------------------------------------------------ Renault */
  add("renault-4cv", "La 4 CV (1947) est la première voiture française à dépasser le million d'exemplaires (plus de 1,1 million). Conçue en secret pendant l'Occupation, elle apporte la mobilité à toute une génération.",
    [["Conçue en cachette", "Ses plans ont été dessinés pendant la guerre, sous l'impulsion de Pierre Lefaucheux."], ["Le million", "Elle est la première Française à dépasser un million d'exemplaires."]]);
  add("renault-dauphine", "La Dauphine (1956) succède à la 4 CV. Produite à plus de 2 millions d'exemplaires, elle connaît un grand succès, notamment aux États-Unis. La version Gordini (1957) est plus sportive.",
    [["Succès américain", "Elle s'exporte massivement outre-Atlantique."], ["Gordini", "La Dauphine Gordini est préparée par Amédée Gordini."]], [], { 0: 32, 1: 27 });
  add("renault-r4", "La Renault 4 (1961) est la première Renault à traction avant et à hayon. Elle est produite à plus de 8 millions d'exemplaires jusqu'en 1992. Renault la présentait comme « le blue-jeans de l'automobile ».",
    [["Le blue-jeans", "Un slogan de lancement qui reste dans les mémoires."], ["8 millions", "Elle est l'une des voitures françaises les plus vendues."]], [], { 0: 47, 1: 38, 2: 33, 3: 29 });
  add("renault-r8", null, [["La Gordini", "La R8 Gordini (1964) est l'une des petites sportives françaises les plus emblématiques."], ["Coupe Gordini", "Une série monotype de R8 Gordini (1966) forme de nombreux pilotes français."]], [], { 0: 25, 1: 24, 2: 22, 3: 12.8, 4: 11.8, 5: 10.9 });
  add("renault-r12-gordini", "La 12 Gordini (1970) est la version sportive de la berline familiale. Elle développe 113 ch avec deux carburateurs et reprend la livrée bleue à bandes blanches des Gordini.",
    [["Bleu de France", "La livrée bleue à double bande blanche est un classique."], ["Berline sportive", "Elle devient une berline de rallye de caractère."]], [], { 0: 20, 1: 15, 2: 10 });
  add("renault-r16", "La Renault 16 (1965) est considérée comme la première berline à hayon de grande série. Elle est élue Voiture de l'année 1966.",
    [["Voiture de l'année 1966", "Elle reçoit le titre européen."], ["Hayon", "Elle invente le modèle de berline à hayon familial."]], [], { 0: 20, 1: 14, 2: 12.5 });
  add("renault-r5", null, [["Michel Boué", "La Renault 5 (1972) est dessinée par Michel Boué. Elle devient l'une des voitures les plus vendues de France (plus de 5 millions)."], ["Alpine et Gordini", "La 5 Alpine (1976) ouvre la voie aux petites sportives de la marque."]], [], { 0: 30, 1: 15, 2: 13.5, 5: 9.5 });
  add("renault-r5-gt-turbo", null, [["Supercinq", "La Super 5 (1984) renouvelle la R5 avec une ligne plus moderne."], ["GT Turbo", "La GT Turbo (1985, 115 ch) est une des GTI françaises emblématiques."]]);
  add("renault-r9-r11-turbo", "La Renault 9 (Voiture de l'année 1982) et la 11 sont les compactes des années 1980. Les versions Turbo, 105 puis 115 ch, sont des berlines sportives très appréciées.",
    [["Voiture de l'année 1982", "La Renault 9 gagne le titre."], ["Le turbo à la portée de tous", "Les versions Turbo démocratisent la suralimentation."]], [], { 0: [142, 0, 0], 1: [160, 0, 0] });
  add("renault-r18-r20", "Les Renault 18 (1978), 20 (1975) et 30 (1975) forment la gamme haut de gamme de Renault. La R18 Turbo (1980, 110 ch) est une des premières berlines turbo de série. La R30 TX utilise un V6 PRV.",
    [["R18 Turbo", "La R18 Turbo arrive en 1980."], ["V6 PRV", "La R30 TX utilise un V6 de 2.7 litres."]], [], { 0: 17, 1: 12.5, 2: 9.9, 3: 11.5, 4: 10.5, 5: 16 });
  add("renault-r25", "La Renault 25 (1984) est la grande berline de Renault, avec une ligne aérodynamique. Elle propose le V6 PRV et, en 1985, un V6 turbo de 182 ch. La Baccara est la version de luxe.",
    [["Baccara", "La finition la plus luxueuse de la gamme."], ["V6 Turbo", "Un V6 2.5 turbo de 182 ch."]], [], { 0: 12, 1: 11.5, 2: 9.5, 4: 15.5 });
  add("renault-fuego", "Le Fuego (1980) est un coupé dessiné par Robert Opron. Il succède à la R15/R17 et reçoit un 1.6 turbo de 132 ch en 1982.",
    [["Robert Opron", "Le dessinateur de la Citroën SM signe le Fuego."], ["Commande au volant", "Il propose des commandes sur le volant."]], [], { 0: 12.5, 1: 11, 2: 10, 3: 9.2, 4: 15 });
  add("renault-r19", "La Renault 19 (1988) est la compacte de la fin des années 1980. La 19 16S (1.8 16V, 137 ch) est la sportive de la gamme, et le cabriolet et la Chamade (tricorps) complètent la famille.",
    [["19 16S", "Le 1.8 litre 16 soupapes de 137 ch en fait une sportive."], ["Cabriolet", "Un cabriolet existe, conçu avec Karmann."]], [], { 0: 13.5, 1: 11.5, 3: 17.5, 4: 12.5 });
  add("renault-r21-turbo", "La Renault 21 Turbo (1986) est une berline sportive de 175 ch, une des plus rapides de son époque. La 2L Turbo Quadra (1989) est à quatre roues motrices.",
    [["175 chevaux", "Elle développe 175 ch pour 1.4 tonne."], ["Quadra", "La Quadra ajoute la transmission intégrale."]]);
  add("renault-safrane", "La Safrane (1992) est la grande routière de Renault. Elle propose des 4 et 6 cylindres, un diesel, et en 1993 une version Biturbo de 268 ch et 4x4.",
    [["Biturbo", "Un V6 3.0 biturbo de 268 ch."], ["Baccara", "La finition de luxe Baccara."]], [], { 0: 10.5, 1: 12, 2: 8.5 });
  add("renault-laguna", "La Laguna (1993) succède à la R21. En 2001, la Laguna II est la première voiture à obtenir cinq étoiles au crash-test Euro NCAP. Le Coupé III (2008) reprend une base sportive, avec une version GT.",
    [["Cinq étoiles", "Première voiture à obtenir cinq étoiles Euro NCAP, en 2001."], ["Laguna Coupé", "Un coupé à 4 roues directrices est proposé en 2008."]], [], { 0: 13, 1: 9.8, 2: 8, 3: 11.5, 4: 9.5, 5: 7.5, 6: 7.5 });
  add("renault-talisman", "La Talisman (2015) succède à la Laguna. Elle propose les quatre roues directrices 4Control et des moteurs diesel et essence.",
    [["4Control", "Direction sur les quatre roues."], ["Break Estate", "Une version Estate est proposée."]], [], { 2: 10.4, 3: 9.4, 4: 8.2 });
  add("renault-avantime", "L'Avantime (2001) est un coupé monospace construit par Matra à Romorantin. Ses ventes décevantes entraînent son arrêt en 2003. La Vel Satis (2002) est la grande routière de la marque.",
    [["Matra", "L'Avantime est construit par Matra."], ["Un échec commercial", "Moins de 10 000 exemplaires sont vendus."]], [], { 0: 9.5, 1: 8.5, 2: 11, 3: 7.6, 4: 8.5 });
  add("renault-espace-1", null, [["Le premier monospace européen", "L'Espace (1984) est conçu avec Matra : un monospace familial qui invente un segment."], ["Espace F1", "L'Espace F1 (1995) reçoit le V10 de la Formule 1 Williams-Renault : 800 ch, 0 à 100 km/h en 2,8 s."]], [], { 0: 12, 1: 12.5, 2: 9.5, 3: 16, 5: 7.7, 6: 11.5, 7: 10.2, 8: 8.2, 9: 8.9 });
  add("renault-scenic", "Le Scénic (1996) est le premier compact monospace. Il est élu Voiture de l'année 1997 et lance un nouveau segment.",
    [["Voiture de l'année 1997", "Il gagne le titre européen."], ["Un nouveau segment", "Le monospace compact devient un best-seller."]], [], { 0: 13, 1: 10.5, 2: 11.5, 3: 11.5 });
  add("renault-megane-1", "La Mégane I (1995) succède à la R19. Elle existe en berline, coupé, cabriolet, Classic et Scénic. La 2.0 16V de 150 ch en est la version sportive.",
    [["Coach et Cabriolet", "Le Coach (coupé, 1996) et le Cabriolet (1997) complètent la gamme."], ["Scénic", "Le Scénic en est dérivé."]], [], { 0: 14.5, 1: 12.5, 4: 15, 5: 11.5 });
  add("renault-megane-2", "La Mégane II (2002) obtient cinq étoiles Euro NCAP et le titre de Voiture de l'année 2003. Elle se distingue par sa ligne à hayon coupé.",
    [["Cinq étoiles", "Elle obtient la meilleure note Euro NCAP."], ["Voiture de l'année 2003", "Elle reçoit le titre européen."]], [], { 0: 12.5, 1: 11, 2: 9.5, 4: 12, 5: 9.7, 6: 9.5 });
  add("renault-megane-3", "La Mégane III (2008) existe en berline, coupé, coupé-cabriolet et Estate. Sa version RS 250 (2009) bat le record du Nürburgring pour une traction.",
    [["Record du Ring", "La Mégane RS bat le record des tractions sur la Nordschleife."], ["Coupé-cabriolet", "Un toit rigide escamotable est proposé."]], [], { 0: 11.5, 1: 10.9, 2: 9.8, 3: 11.1, 4: 10, 5: 8.6 });
  add("renault-megane-4", "La Mégane IV (2015) adopte une ligne plus affirmée. La version GT et l'E-Tech hybride rechargeable en sont les variantes.",
    [["Mégane RS", "La RS 280 (2018) développe 280 ch."], ["E-Tech Plug-in", "Une version hybride rechargeable est proposée."]], [], { 0: 11.9, 1: 9.6, 4: 11.4 });
  add("renault-megane-etech", "La Mégane E-Tech Electric (2022) est la première Renault bâtie sur la plate-forme CMF-EV. Elle développe 218 ch et offre jusqu'à 450 km d'autonomie.",
    [["CMF-EV", "Une plate-forme dédiée à l'électrique."], ["Batterie compacte", "Une batterie de 60 kWh très plate."]]);
  add("renault-clio-1", "La Clio (1990) remplace la R5 et est élue Voiture de l'année 1991. La Clio 16S (1991) et la Williams (1993, 150 ch) sont ses versions sportives.",
    [["Voiture de l'année 1991", "Elle reçoit le titre européen."], ["Clio Williams", "Une série limitée de 150 ch."]], [], { 0: 17, 1: 15.5, 2: 12, 3: 10, 4: 17.5 });
  add("renault-clio-2", "La Clio II (1998) est un best-seller. La Clio Sport 172 (2000) puis 182 sont des GTI très appréciées. La Clio V6 (2001) a un V6 central de 230 ch.",
    [["Clio V6", "Un V6 central-arrière de 230 ch."], ["Clio Sport", "Une version Sport 172 et 182."]], [], { 0: 15, 1: 12.5, 2: 10.5, 3: 9.5, 4: 17, 5: 11 });
  add("renault-clio-3", "La Clio III (2005) est élue Voiture de l'année 2006. La Clio RS (197 puis 200 ch) en est la version sportive.",
    [["Voiture de l'année 2006", "Elle reçoit le titre européen."], ["Clio RS", "La RS 200 est une référence des GTI."]], [], { 0: 13.5, 1: 11, 2: 10.5, 3: 12, 4: 11 });
  add("renault-clio-4-5", null, [["Clio IV", "La Clio IV (2012) adopte le nouveau langage de style de Laurens van den Acker."], ["E-Tech hybride", "La Clio V E-Tech 140 (2020) est un hybride complet."]], [], { 0: 11.4, 1: 9.9, 2: 11.6, 3: 12, 4: 11.5, 5: 9, 7: 11.4 });
  add("renault-twingo", null, [["Une silhouette unique", "La Twingo I (1992) est dessinée par Patrick Le Quément avec un habitacle monovolume."], ["Moteur arrière", "La Twingo III (2014) passe à un moteur arrière, partagé avec la Smart."]], [], { 0: 15.5, 1: 12, 3: 12.5, 4: 11.7, 6: 10.9, 8: 12.9 });
  add("renault-kangoo", "Le Kangoo (1997) est un ludospace devenu un best-seller. Le Kangoo Z.E. (2011) est l'un des premiers utilitaires électriques de série.",
    [["Ludospace", "Il invente le segment du ludospace."], ["Kangoo Z.E.", "Version électrique depuis 2011."]], [], { 0: 17, 1: 13, 2: 15, 3: 12.5, 4: 11.5 });
  add("renault-trafic", "Le Trafic et le Master (1980) sont les utilitaires de la marque. Ils sont produits aussi sous les noms d'Opel Vivaro et Nissan Primastar.",
    [["Cousins", "Ils partagent leur base avec Opel et Nissan."], ["Master E-Tech", "Une version électrique existe."]], [], { 0: 14.5, 1: 12, 2: 15, 4: 14 });
  add("renault-captur-kadjar", "Le Captur (2013) est un SUV urbain devenu un best-seller en Europe. Le Kadjar (2015), l'Arkana (2021), l'Austral (2022) et le Symbioz (2024) complètent la gamme SUV.",
    [["Captur", "Il est le SUV le plus vendu d'Europe pendant plusieurs années."], ["Austral", "L'Austral remplace le Kadjar."]], [], { 0: 12.9, 1: 9.5, 3: 9.9, 4: 11.4, 7: 9.6, 8: 9.5 });
  add("renault-zoe-twizy", "La Zoé (2012) est l'une des voitures électriques les plus vendues d'Europe. Le Twizy (2012) est un quadricycle électrique à deux places en tandem.",
    [["Zoé", "Elle est lancée en 2012 et devient la citadine électrique de référence."], ["Twizy", "Un quadricycle à portes papillon."]]);
  add("renault-r5-etech", "La Renault 5 E-Tech (2024) est une citadine électrique néo-rétro, élue Voiture européenne de l'année 2025. La 4 E-Tech suit.",
    [["Voiture de l'année 2025", "Elle gagne le titre européen."], ["Réinterprétation", "Elle rend hommage à la R5 de 1972."]]);
  add("renault-rafale", "Le Rafale (2023) est un SUV coupé hybride de Renault avec une version Esprit Alpine. Il propose un hybride complet de 200 ou 300 ch.",
    [["Esprit Alpine", "Une finition sportive inspirée d'Alpine."], ["Quatre roues directrices", "Le 4Control est proposé."]]);
  add("renault-rs01", null, [["La théière jaune", "La RS01 (1977) est la première F1 à moteur turbo, surnommée « la théière jaune » à cause de sa fumée."], ["Jean-Pierre Jabouille", "Le pilote français la mène au Grand Prix de Grande-Bretagne 1977 pour ses débuts."]]);
  add("renault-r25-f1", null, [["Fernando Alonso", "Alonso est champion du monde 2005 et 2006 sur R25 et R26."], ["Titres constructeurs", "Renault est aussi champion des constructeurs 2005 et 2006."]]);
  add("renault-megane-trophy-v6", "La famille Trophy regroupe la Sport Spider Trophy (1996), la Clio V6 Trophy (2000) et la Mégane Trophy V6 (2005, V6 Nissan de 3.5 litres), des monotypes de course.",
    [["Sport Spider", "La Sport Spider (1996) est une barquette légère."], ["Trophy V6", "Le V6 Nissan VQ35 développe 400 ch."]]);
  add("renault-clio-cup", null, [["La R5 Turbo Cup", "La Coupe R5 Turbo (1985) est l'ancêtre des monotypes Renault."], ["La Clio Cup", "La Clio Cup (1991) est l'un des plus grands championnats monotypes d'Europe."]]);

  MAKIT.enrich(m);
})();
