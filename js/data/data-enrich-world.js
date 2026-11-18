/** MOTORAUTO — compléments : Nissan, Toyota, Honda, Mazda, Ford, Volkswagen, SEAT, Fiat (histoire, anecdotes, palmarès). */
(function () {
  "use strict";
  const m = {};
  const add = (id, h, a, r, rel) => { m[id] = { h, a: a || [], r: r || [], rel: rel || [], ap: true }; };

  /* ---------------- MAZDA */
  add("mazda-mx5-na",
    "Le Mazda MX-5 (NA, 1989) est conçu pour retrouver l'esprit des petits roadsters britanniques, avec fiabilité japonaise : moteur avant, propulsion, poids plafonné à environ 950 kg. Il est présenté en 1989 à Chicago. Le 1.6 de 115 ch est rapidement complété par un 1.8 de 131 ch (1994). Ses phares escamotables sont devenus sa signature.\n\nLe MX-5 est entré au Guinness World Records comme le roadster biplace le plus vendu de l'histoire. Il a relancé le marché du petit roadster dans le monde entier.",
    [["Jinba ittai", "La philosophie de Mazda, « cavalier et cheval ne font qu'un », a guidé la conception du MX-5."], ["Un succès mondial", "Plus d'un million de MX-5 ont été produits, ce qui en fait le roadster le plus vendu de l'histoire."]],
    [["Guinness World Records", "Roadster biplace le plus vendu au monde."]], ["mazda-mx5-nb"]);
  add("mazda-mx5-nb",
    "Le MX-5 NB (1998) abandonne les phares escamotables pour des optiques fixes. Il reçoit les moteurs 1.6 de 110 ch puis 1.8 de 146 ch avec VVT. Son châssis est durci. La version NBFL (2001) reçoit un restylage et le 1.8 de 146 ch.\n\nLe NB est le MX-5 le plus accessible sur le marché de l'occasion.",
    [], [], ["mazda-mx5-na", "mazda-mx5-nc"]);
  add("mazda-mx5-nc",
    "Le MX-5 NC (2005) est plus grand et plus lourd que ses prédécesseurs, avec le 2.0 MZR de 160 ch. Il est proposé en 2006 en version Roadster Coupé (RC), avec un toit rigide rétractable en deux parties.\n\nIl partage sa plate-forme avec la Mazda RX-8.",
    [["Plate-forme RX-8", "Le MX-5 NC partage des éléments avec la RX-8 à moteur rotatif."]], [], ["mazda-mx5-nb", "mazda-mx5-nd"]);
  add("mazda-mx5-nd",
    "Le MX-5 ND (2015) revient à la légèreté, avec un poids d'environ 1 000 kg grâce à la technologie SkyActiv. Il reçoit les moteurs 1.5 de 131 ch et 2.0 de 160 à 184 ch. La version RF (Retractable Fastback, 2016) est un targa à toit rigide. Il a été élu Voiture mondiale de l'année 2016.\n\nLe ND est considéré comme l'un des roadsters les plus agiles du marché.",
    [], [["World Car of the Year", "Titre obtenu en 2016."]], ["mazda-mx5-nc"]);

  /* ---------------- NISSAN Z */
  add("nissan-s30-240z-280z",
    "La Datsun 240Z (1969), connue en Japon sous le nom de Fairlady Z, est dessinée par une équipe de Nissan menée par Yoshihiko Matsuo, avec l'influence d'Albrecht Goertz. Elle est équipée d'un 6 cylindres en ligne de 2,4 litres de 151 ch, d'une carrosserie fastback et d'un prix très compétitif. Elle devient un succès mondial, notamment aux États-Unis, et dépasse les 500 000 exemplaires pour la famille S30.\n\nLa 260Z (1973) et la 280Z (1975) remplacent la 240Z, avec un moteur de 2,6 puis 2,8 litres.",
    [["Un best-seller sportif", "La famille S30 s'est vendue à plus de 500 000 exemplaires, un score exceptionnel pour un coupé sportif."]],
    [["Production S30", "Plus de 500 000 exemplaires."]], ["nissan-s130-280zx"]);
  add("nissan-s130-280zx",
    "La 280ZX (S130, 1978) abandonne la pureté de la 240Z pour un confort accru. Son 2.8 L6 de 140 ch (180 ch en version turbo à partir de 1981) est accompagné d'une boîte automatique en option.\n\nLe T-top (toit amovible) est disponible.",
    [], [], ["nissan-s30-240z-280z", "nissan-z31-300zx"]);
  add("nissan-z31-300zx",
    "La 300ZX Z31 (1983) abandonne le six-cylindres en ligne pour un V6 3.0 VG30E de 160 ch, puis le VG30ET turbo de 205 ch. Sa carrosserie anguleuse est typique des années 1980. L'intérieur reçoit un tableau de bord numérique en option.\n\nLa Z31 marque le début de la gamme 300ZX.",
    [], [], ["nissan-s130-280zx", "nissan-z32-300zx"]);
  add("nissan-z32-300zx",
    "La 300ZX Z32 (1989) est équipée d'un V6 3.0 biturbo (VG30DETT) de 280 à 300 ch selon les marchés, et d'une direction quatre roues directrices en option. Elle est l'une des voitures de sport japonaises les plus avancées de son époque. La carrosserie, dessinée de manière plus fluide, a séduit le public. Elle reste en production jusqu'en 2000.\n\nSes prix ont beaucoup augmenté sur le marché de l'occasion.",
    [["Quatre roues directrices", "Le système Super HICAS faisait braquer légèrement les roues arrière."]], [], ["nissan-z31-300zx", "nissan-350z-z33"]);
  add("nissan-350z-z33",
    "La 350Z (2002) relance la lignée Z avec un V6 3.5 VQ35DE de 280 ch. Sa propulsion, sa boîte manuelle à 6 rapports et son prix attractif en font une sportive appréciée. La version VQ35HR de 2006 monte à 313 ch.\n\nElle est un symbole du renouveau de Nissan sous la direction de Carlos Ghosn.",
    [["Le renouveau de Nissan", "La 350Z fait partie des modèles qui ont symbolisé la renaissance de Nissan au début des années 2000."]], [], ["nissan-z32-300zx", "nissan-370z-z34"]);
  add("nissan-370z-z34",
    "La 370Z (2009) a un empattement raccourci de 10 cm par rapport à la 350Z et reçoit un V6 3.7 VQ37VHR de 328 ch. Elle est dotée de la fonction SynchroRev Match, qui effectue automatiquement les passages de rapports en rétrogradant. La Nismo (2009) est plus ferme et propose 344 ch.\n\nElle est restée en production jusqu'en 2020.",
    [["SynchroRev Match", "Cette aide fait monter les tours au rétrogradage pour imiter le talon-pointe."]], [], ["nissan-350z-z33", "nissan-z-rz34"]);
  add("nissan-z-rz34",
    "La Nissan Z (RZ34, 2023) reprend la base de la 370Z avec un nouveau V6 3.0 biturbo (VR30DDTT) de 405 ch, une boîte manuelle à 6 rapports ou une automatique à 9 rapports. La Nismo délivre 420 ch. Son style rend hommage à la 240Z et à la 300ZX.\n\nElle est l'une des rares sportives modernes à proposer une boîte manuelle.",
    [], [], ["nissan-370z-z34"]);

  /* ---------------- NISSAN SKYLINE / SILVIA */
  add("nissan-skyline-gtr-classic",
    "La Skyline GT-R « Hakosuka » (PGC10, 1969) est la première Skyline GT-R. Elle reçoit le 2.0 S20 de 160 ch, un six cylindres à double arbre dérivé de la voiture de course R380. Elle remporte 50 victoires en course entre 1969 et 1972. La « Kenmeri » (KPGC110, 1973) ne sera produite qu'à 197 exemplaires.\n\nLes GT-R de cette période sont parmi les Nissan les plus recherchées.",
    [["Hakosuka", "Le surnom associe « hako » (boîte, pour sa silhouette anguleuse) et « suka », abréviation de Skyline."], ["Une production confidentielle", "La Kenmeri n'a été produite qu'à 197 exemplaires, à cause de la crise pétrolière."]],
    [["Victoires", "50 victoires en course en trois ans pour la Hakosuka."]], ["nissan-skyline-gtr-r32"]);
  add("nissan-skyline-gtr-r32",
    "La Skyline GT-R R32 (1989) est la renaissance du nom GT-R, absent depuis 1973. Elle est équipée du 2.6 biturbo RB26DETT de 280 ch (le chiffre officiel, limité par un accord entre constructeurs japonais), de la transmission intégrale ATTESA E-TS et de quatre roues directrices (Super HICAS). Elle domine le championnat japonais des voitures de tourisme (Groupe A) de 1990 à 1993, ce qui lui vaut le surnom de « Godzilla » en Australie, où elle gagne aussi.\n\nElle est un symbole de la sportive japonaise des années 1990.",
    [["Godzilla", "Le surnom vient de la presse australienne, qui la comparait à un monstre."], ["Un accord entre constructeurs", "La puissance officielle de 280 ch était un chiffre convenu entre les constructeurs japonais."]],
    [["Groupe A", "Quatre titres japonais consécutifs, de 1990 à 1993."]], ["nissan-skyline-gtr-classic", "nissan-skyline-gtr-r33"]);
  add("nissan-skyline-gtr-r33",
    "La GT-R R33 (1995) est plus grande et plus lourde que la R32, mais mieux équilibrée. Elle reprend le RB26DETT et l'ATTESA E-TS Pro. Nissan a revendiqué pour elle un tour du Nürburgring en moins de 8 minutes (7 min 59 s), une première pour une voiture de série japonaise. La 400R, préparée par Nismo, développe 400 ch.\n\nElle est la moins appréciée des GT-R de cette génération, mais gagne en notoriété.",
    [["Moins de 8 minutes", "Nissan a annoncé un tour de la Nordschleife en 7 min 59 s pour la R33."]], [], ["nissan-skyline-gtr-r32", "nissan-skyline-gtr-r34"]);
  add("nissan-skyline-gtr-r34",
    "La GT-R R34 (1999) est plus courte, plus rigide et dotée d'un écran multifonction qui affiche les paramètres du moteur. Elle est célèbre pour son apparition dans la franchise « Fast and Furious » et dans la série de jeux vidéo Gran Turismo. La Z-Tune (2005), préparée par Nismo, développe 500 ch et est limitée à 19 exemplaires.\n\nSes prix ont explosé sur le marché de l'occasion.",
    [["Paul Walker", "La R34 bleue de Paul Walker dans Fast and Furious 2 a beaucoup fait pour sa notoriété."]], [["Rareté", "19 exemplaires pour la Z-Tune."]], ["nissan-skyline-gtr-r33", "nissan-gt-r-r35"]);
  add("nissan-gt-r-r35",
    "La Nissan GT-R (R35, 2007) est équipée d'un V6 3.8 biturbo (VR38DETT) de 480 ch à l'origine, puis 570 ch et jusqu'à 600 ch pour la Nismo. Elle bénéficie d'une transmission intégrale et d'une boîte à double embrayage à 6 rapports montée sur l'essieu arrière. Elle fait le tour du Nürburgring en 7 min 29 s en 2008.\n\nLa GT-R est restée en production jusqu'en 2024, soit 17 ans, avec d'innombrables évolutions.",
    [["Le dernier tour de piste", "La production de la GT-R s'est arrêtée en 2024."], ["Godzilla", "La R35 a conservé le surnom des anciennes générations."]],
    [["Nürburgring", "7 min 29 s en 2008 pour la première version de série."]], ["nissan-skyline-gtr-r34"]);
  add("nissan-silvia-classic",
    "La Nissan Silvia S110 (1979) et la S12 (1983) sont des coupés de milieu de gamme. Les S12 reçoivent le moteur turbo CA18ET. Elles sont populaires en compétition amateur et en drift.",
    [], [], ["nissan-silvia-s13"]);
  add("nissan-silvia-s13",
    "La Silvia S13 (1988) est un coupé propulsion qui devient la voiture de prédilection des pilotes de drift. Elle reçoit le CA18DET puis le SR20DET de 205 ch (1991). Elle est aussi vendue sous les noms 180SX (hatchback au Japon) et 200SX (Europe).\n\nLa S13 a fait la fortune du drift japonais.",
    [["La reine du drift", "La S13 est la voiture la plus utilisée dans les compétitions de drift en raison de son prix, de sa légèreté et de son moteur."]], [], ["nissan-silvia-s14", "nissan-silvia-ps13"]);
  add("nissan-silvia-s14",
    "La Silvia S14 (1993) est plus grande et plus large que la S13. Elle conserve le SR20DET de 220 ch dans la version K's. Le Kouki (1996) reçoit un restylage.\n\nElle est plus lourde et plus large que la S13.",
    [], [], ["nissan-silvia-s13", "nissan-silvia-s15"]);
  add("nissan-silvia-s15",
    "La Silvia S15 (1999) est la dernière Silvia. Elle est plus compacte et plus raide que la S14. La Spec-R reçoit le SR20DET de 250 ch avec une boîte à 6 rapports. Elle est principalement vendue au Japon.\n\nSa production s'arrête en 2002. Elle est un symbole du drift.",
    [["La dernière Silvia", "La S15 marque la fin de la lignée Silvia, arrêtée en 2002."]], [], ["nissan-silvia-s14"]);
  add("nissan-silvia-ps13",
    "La Silvia PS13 (1991) est le code de la Silvia S13 à moteur turbo SR20DET de 205 ch (finitions J's et K's). Elle partage sa plate-forme avec la 180SX.\n\nElle est souvent confondue avec la S13.",
    [], [], ["nissan-silvia-s13", "nissan-onevia"]);
  add("nissan-onevia",
    "L'Onevia est une 180SX équipée de la face avant d'une Silvia, une conversion à la mode au Japon. Elle réunit la silhouette hatchback de la 180SX et le nez de la Silvia (Onevia = 180SX + Silvia).\n\nCe type de conversion est très répandu chez les passionnés de drift.",
    [], [], ["nissan-sileighty"]);
  add("nissan-sileighty",
    "La Sileighty est une Silvia équipée de la face avant de la 180SX (d'où son nom, mélange de Silvia et de 180SX). Ces voitures sont des conversions de passionnés, parfois réalisées avec des pièces d'origine Nissan.\n\nElles sont populaires dans la scène du drift.",
    [], [], ["nissan-onevia"]);

  /* ---------------- TOYOTA */
  add("toyota-celica-supra-a40-a60",
    "La Celica Supra (A40, 1978) est dérivée de la Celica, mais allongée pour recevoir un six cylindres en ligne. Elle est vendue au Japon sous le nom de Celica XX. L'A60 (1981) reçoit le 2.8 de 170 ch.\n\nElle est à l'origine de la lignée Supra.",
    [], [], ["toyota-supra-a70"]);
  add("toyota-supra-a70",
    "La Supra A70 (1986) devient un modèle à part entière, indépendant de la Celica. Elle reçoit le 3.0 7M-GTE turbo de 230 à 280 ch. Elle est proposée avec un toit targa à partir de 1987.\n\nElle prépare la grande Supra A80.",
    [], [], ["toyota-supra-a80-mk4"]);
  add("toyota-supra-a80-mk4",
    "La Supra A80 (MK4, 1993) est équipée du six cylindres en ligne 2JZ-GTE biturbo de 280 ch (JDM) ou 320 ch (États-Unis). Ce moteur, très robuste, supporte des puissances très supérieures à celles de série, ce qui en fait une base de préparation prisée.  Elle a connu une notoriété mondiale avec le film « Fast and Furious » (2001).\n\nLa production s'arrête en 2002.",
    [["Le 2JZ", "Ce six cylindres est réputé capable de supporter plus de 1 000 ch avec des préparations."], ["Fast and Furious", "La Supra orange de Paul Walker dans le film de 2001 a fait grimper sa cote."]], [], ["toyota-supra-a70", "toyota-supra-a90-mk5"]);
  add("toyota-supra-a90-mk5",
    "La Supra A90 (2019) est développée en partenariat avec BMW et assemblée par Magna Steyr à Graz, en Autriche, sur la base de la BMW Z4. Elle reçoit un six cylindres en ligne B58 de 3 litres de 340 ch (382 ch à partir de 2022) ou un 2.0 turbo. Elle ne propose qu'une boîte automatique à 8 rapports à l'origine, une boîte manuelle étant ajoutée en 2023.\n\nElle marque le retour de la Supra après 17 ans d'absence.",
    [["Un lien avec BMW", "La A90 est fabriquée dans la même usine que la BMW Z4."]], [], ["toyota-supra-a80-mk4"]);
  add("toyota-mr2-aw11",
    "La Toyota MR2 (AW11, 1984) est la première voiture de série japonaise à moteur central. Elle reçoit le 1.6 4A-GE de 125 ch ou le 4A-GZE compressé de 145 ch. Elle pèse environ 1 000 kg.\n\nSon nom signifie « Midship Runabout 2-seater ».",
    [["Premier moteur central japonais", "La MR2 est la première voiture de série japonaise à moteur central."]], [], ["toyota-mr2-sw20"]);
  add("toyota-mr2-sw20",
    "La MR2 SW20 (1989) est plus grande et plus puissante. Elle reçoit le 2.0 3S-GTE turbo de 245 ch au Japon. Sa ligne rappelle celle d'une Ferrari 348. Son comportement est vif, avec un risque de survirage en cas de lever de pied.\n\nElle est restée en production jusqu'en 1999.",
    [["Une mini-Ferrari", "La silhouette de la MR2 SW20 est souvent comparée à celle de la Ferrari 348."]], [], ["toyota-mr2-aw11", "toyota-mrs-zzw30"]);
  add("toyota-mrs-zzw30",
    "La MR-S (ZZW30, 1999), vendue en Europe comme MR2 Roadster, est une descendante légère des MR2. Elle reçoit le 1.8 VVT-i de 140 ch, pèse environ 1 000 kg et est vendue jusqu'en 2007.\n\nC'est un roadster biplace à moteur central abordable.",
    [], [], ["toyota-mr2-sw20"]);
  add("toyota-celica-classic",
    "La Toyota Celica, présentée en 1970, est un coupé sportif et abordable vendu en plusieurs générations. Elle reçoit le 2.0 et le 2.4 jusqu'à la génération ST165 (GT-Four), qui introduit la transmission intégrale.\n\nElle a été pendant près de 30 ans l'une des sportives de référence de Toyota.",
    [], [], ["toyota-celica-st185-st205"]);
  add("toyota-celica-st185-st205",
    "La Celica GT-Four ST185 (1989) et ST205 (1994) sont les voitures de rallye de Toyota Team Europe. Elles sont équipées du 2.0 3S-GTE turbo de 225 à 255 ch et de la transmission intégrale. Carlos Sainz est champion du monde des rallyes en 1990 (avec la ST165), puis en 1992 ; Juha Kankkunen en 1993, et Didier Auriol en 1994.\n\nToyota est exclu du championnat du monde 1996 pour avoir utilisé une bride de turbo non conforme.",
    [["L'affaire de la bride de turbo", "En 1995, Toyota a été sanctionné pour avoir utilisé un dispositif frauduleux sur la bride d'admission des turbos."]],
    [["Titres pilotes", "Carlos Sainz (1990, 1992), Juha Kankkunen (1993), Didier Auriol (1994)."]], ["toyota-celica-classic"]);
  add("toyota-celica-zzt231",
    "La Celica de septième génération (T230, 1999) est un coupé dessiné au Japon. La T-Sport est équipée du 1.8 VVTL-i de 192 ch, un moteur qui combine un calage variable et une levée variable des soupapes. Elle est vendue jusqu'en 2006.\n\nC'est la dernière Celica.",
    [["La dernière Celica", "Toyota met fin à la Celica en 2006 après sept générations."]], [], ["toyota-celica-classic"]);

  /* ---------------- HONDA */
  add("honda-civic-classic-generation",
    "La Honda Civic (1972) est la petite voiture qui a fait le succès mondial de Honda. Elle introduit le moteur CVCC (1975), qui respecte les normes antipollution américaines sans pot catalytique. Les générations suivantes passent à l'injection, au VTEC (1989) puis aux versions sportives SiR.\n\nLa Civic est l'une des voitures les plus vendues de l'histoire.",
    [["Le CVCC", "Le moteur à charge stratifiée de 1975 a permis à Honda de respecter les normes américaines avant ses concurrents."]], [], ["honda-civic-eg6-vti"]);
  add("honda-civic-eg6-vti",
    "La Civic EG6 (1991) est la version sportive de la cinquième génération, équipée du moteur VTEC B16A de 160 ch. Elle pèse environ 1 050 kg. Son comportement vif en fait une référence des tractions sportives.\n\nElle est devenue une base de préparation pour la course et le tuning.",
    [], [], ["honda-civic-ek9-type-r", "honda-civic-classic-generation"]);
  add("honda-civic-ek9-type-r",
    "La Civic Type R EK9 (1997) est la première Type R de la gamme Civic. Elle est équipée du B16B de 185 ch, un moteur atmosphérique qui monte à 8 200 tr/min. Son châssis est renforcé et son différentiel est à glissement limité. Elle n'est vendue qu'au Japon.\n\nLa Type R est devenue une légende des sportives à traction avant.",
    [["La Type R", "Le logo sur fond rouge désigne chez Honda les modèles de compétition adaptés à la route."], ["Réservée au Japon", "L'EK9 n'a pas été exportée officiellement en Europe."]], [], ["honda-civic-eg6-vti", "honda-civic-ep3-type-r"]);
  add("honda-civic-ep3-type-r",
    "La Civic Type R EP3 (2001) est la première Type R vendue en Europe, construite à Swindon (Royaume-Uni). Elle est équipée du 2.0 i-VTEC K20A de 200 ch (215 ch au Japon), qui monte à 8 000 tr/min. Elle est reconnaissable à son levier de vitesses placé sur la planche de bord.\n\nElle est devenue l'une des GTI les plus aimées des années 2000.",
    [["Fabriquée à Swindon", "L'EP3 est la première Type R construite en Europe."]], [], ["honda-civic-ek9-type-r", "honda-civic-fn2-type-r"]);
  add("honda-civic-fn2-type-r",
    "La Civic Type R FN2 (2006) est équipée du 2.0 i-VTEC K20Z4 de 201 ch, un moteur atmosphérique qui culmine à 8 400 tr/min. Elle reprend l'architecture à hayon de la Civic de huitième génération. Elle est produite à Swindon.\n\nElle est vendue jusqu'en 2011.",
    [], [], ["honda-civic-ep3-type-r", "honda-civic-fk2-type-r"]);
  add("honda-civic-fk2-type-r",
    "La Civic Type R FK2 (2015) est la première Type R à turbo, avec le 2.0 VTEC Turbo K20C1 de 310 ch. Elle établit en 2014 un record du Nürburgring pour une traction avant en 7 min 50 s. Elle est assemblée à Swindon.\n\nSes ailes élargies et son aileron arrière imposant en font l'une des GTI les plus extravagantes.",
    [["Record au Nürburgring", "La FK2 a établi un record pour une traction avant de série, en 7 min 50 s."]], [["Nürburgring", "7 min 50 s en 2014, record des tractions avant de l'époque."]], ["honda-civic-fn2-type-r", "honda-civic-fk8-type-r"]);
  add("honda-civic-fk8-type-r",
    "La Civic Type R FK8 (2017) reprend le 2.0 VTEC Turbo, poussé à 320 ch. Son aérodynamique est affinée, avec une calandre à grandes ouïes et un aileron arrière. Elle établit en 2017 un record du Nürburgring pour une traction avant en 7 min 43 s.\n\nElle est considérée comme l'une des meilleures tractions du marché.",
    [], [["Nürburgring", "7 min 43 s en 2017, record des tractions avant."]], ["honda-civic-fk2-type-r", "honda-civic-fl5-type-r"]);
  add("honda-civic-fl5-type-r",
    "La Civic Type R FL5 (2022) reprend le 2.0 VTEC Turbo, qui délivre 329 ch, avec une boîte manuelle à 6 rapports. Elle a un style plus sobre que la FK8, mais une aérodynamique perfectionnée.\n\nElle est fabriquée au Japon (Yorii).",
    [["Une boîte manuelle seulement", "Honda a gardé la boîte manuelle comme seule option, fidèle à son esprit Type R."]], [], ["honda-civic-fk8-type-r"]);

  /* ---------------- FORD */
  add("ford-escort-rs-cosworth-t35",
    "L'Escort RS Cosworth (1992) est conçue pour homologuer la voiture de rallye du Groupe A. Elle emprunte la plate-forme de la Sierra Cosworth 4x4 et son moteur 2.0 16V turbo de 227 ch, avec un énorme aileron arrière dit « queue de baleine ». Elle est construite par Karmann. La version T35, au gros turbo Garrett, est la plus puissante.\n\nAu moins 2 500 exemplaires devaient être produits pour l'homologation ; environ 7 000 l'ont finalement été.",
    [["L'aileron de baleine", "Son immense aileron arrière est resté l'une des signatures des Ford des années 1990."]], [], ["ford-escort-rs-cosworth-t25", "ford-sierra-rs-cosworth"]);
  add("ford-escort-rs-cosworth-t25",
    "La seconde série de l'Escort RS Cosworth (1994) utilise un turbo plus petit (T25) pour réduire le temps de réponse. Elle reçoit l'injection EEC-IV et une électronique plus récente. Sa puissance reste de 227 ch.\n\nElle est restée en production jusqu'en 1996.",
    [], [], ["ford-escort-rs-cosworth-t35"]);
  add("ford-sierra-rs-cosworth",
    "La Sierra RS Cosworth (1986) est produite à 5 000 exemplaires pour homologuer la Sierra en Groupe A. Elle reçoit le 2.0 YBB turbo, construit avec Cosworth, de 204 ch. La RS500 Cosworth (1987), limitée à 500 exemplaires, est portée à 224 ch. Elle domine les championnats de tourisme du milieu des années 1980.\n\nElle est restée célèbre pour son immense aileron arrière.",
    [["La RS500", "La RS500 a été construite à 500 exemplaires pour l'homologation de la course de tourisme."]], [["Production", "5 000 exemplaires pour la Sierra RS Cosworth."]], ["ford-escort-rs-cosworth-t35"]);
  add("ford-focus-rs-mk2",
    "La Focus RS Mk2 (2009) est équipée d'un cinq cylindres turbo de 2,5 litres emprunté au groupe Volvo, de 305 ch. Elle est dotée d'un différentiel à glissement limité Quaife et d'une suspension Revoknuckle qui limite le sous-virage. Elle est vendue en traction avant uniquement, ce qui lui a valu quelques critiques sur le transfert de couple.\n\nLa série limitée RS500 (2010) offre 345 ch.",
    [["La RS500", "Une série limitée de 500 exemplaires, peinte en noir mat, a été produite en 2010."]], [], ["ford-focus-rs-mk3"]);
  add("ford-focus-rs-mk3",
    "La Focus RS Mk3 (2015) est équipée du 2.3 EcoBoost de 350 ch et d'une transmission intégrale avec répartiteur de couple arrière (Ford Performance All-Wheel Drive). Elle propose un mode « Drift », une première pour une compacte. Elle accélère de 0 à 100 km/h en 4,7 secondes.\n\nElle est considérée comme l'une des meilleures Ford sportives de ces dernières années.",
    [["Un mode drift", "Le mode drift de la Focus RS permet de contrôler le survirage grâce à la répartition arrière."]], [], ["ford-focus-rs-mk2"]);
  add("ford-focus-st-170",
    "La Focus ST170 (2002) reçoit un 2.0 Duratec de 173 ch et un châssis durci. Elle est reconnaissable à ses jantes de 17 pouces et à son becquet. Elle est vendue en 3 portes et 5 portes.\n\nElle est la première Focus ST.",
    [], [], ["ford-fiesta-st-mk6"]);
  add("ford-fiesta-st-mk6",
    "La Fiesta ST (Mk6, 2005) est équipée du 2.0 Duratec de 150 ch. Son comportement vif et son prix ont fait son succès. Elle est considérée comme l'une des meilleures petites GTI de son époque.\n\nElle a été produite jusqu'en 2008.",
    [], [], ["ford-fiesta-st-mk7"]);
  add("ford-fiesta-st-mk7",
    "La Fiesta ST (Mk7, 2013) est équipée du 1.6 EcoBoost de 182 ch. Elle a été saluée par la presse pour son comportement. La ST200 (2016) délivre 200 ch.\n\nElle a été remplacée par la Mk8 (2017), à moteur 1.5 trois cylindres.",
    [], [], ["ford-fiesta-st-mk6"]);
  add("ford-puma-17",
    "Le Ford Puma (1997) est un petit coupé dessiné par Ghia, sur la base de la Fiesta. Il reçoit le 1.7 Zetec-SE de 125 ch, développé avec Yamaha, avec calage variable des soupapes (VCT). Il est réputé pour son comportement, loin de ce que l'on attendait d'un coupé de base Fiesta. Le Racing Puma (1999), limité à 1 000 exemplaires, offre 155 ch.\n\nIl est resté en production jusqu'en 2002.",
    [["Moteur Yamaha", "Le 1.7 a été mis au point avec Yamaha, connu pour ses moteurs de moto."]], [], ["ford-fiesta-st-mk6"]);
  add("ford-rs200",
    "La Ford RS200 (1984) est la voiture de Ford pour le Groupe B. Elle est mue par un 1.8 turbo Cosworth BDT placé au centre, avec la transmission intégrale. Environ 200 exemplaires ont été construits pour l'homologation. Sa carrosserie est dessinée par Ghia (Filippo Sapino) et elle est assemblée par Reliant. Elle ne remporte pas de victoire en championnat du monde et son programme s'arrête avec la fin du Groupe B en 1986.\n\nLes versions Evolution atteignent plus de 600 ch.",
    [["Une carrière brève", "La RS200 a disputé le championnat du monde en 1986, sa seule saison complète."]], [["Production", "Environ 200 exemplaires."]], []);

  /* ---------------- VOLKSWAGEN GOLF GTI */
  add("vw-golf-gti-mk1",
    "La Golf GTI est présentée en 1975 au Salon de Francfort et commercialisée en 1976. Dessinée par Giorgetto Giugiaro, la Golf reçoit un moteur 1.6 à injection mécanique de 110 ch, qui lui donne des performances bien supérieures à celles de la Golf de base. Elle accélère de 0 à 100 km/h en 9 secondes environ et atteint 180 km/h. Sa liseré rouge sur la calandre est devenu sa signature.\n\nLa Golf GTI est considérée comme la première « hot hatch » moderne, et a inspiré toute une catégorie.",
    [["Le liséré rouge", "Le fin filet rouge sur la calandre de la GTI est resté un détail de style jusqu'à aujourd'hui."], ["La première hot hatch", "La Golf GTI a lancé le segment des compactes sportives."]], [], ["vw-golf-gti-mk2"]);
  add("vw-golf-gti-mk2",
    "La Golf GTI Mk2 (1984) est plus grande et plus lourde. Elle reçoit le 1.8 de 112 ch puis le 16V de 139 ch (1986). Les versions G60 sont à compresseur. Elle est une référence de la fiabilité et du comportement.\n\nElle reste en production jusqu'en 1991.",
    [], [], ["vw-golf-gti-mk1", "vw-golf-gti-mk3"]);
  add("vw-golf-gti-mk3",
    "La Golf GTI Mk3 (1992) est jugée trop lourde et moins vive que ses devancières. Elle reçoit le 2.0 de 115 ch (8V) puis le 16V de 150 ch. La Golf VR6 offre un V6 compact de 174 ch.\n\nElle est la moins aimée des GTI.",
    [], [], ["vw-golf-gti-mk2", "vw-golf-gti-mk4"]);
  add("vw-golf-gti-mk4",
    "La Golf GTI Mk4 (1998) est équipée du 1.8 turbo 20V de 150 ch, puis de 180 ch pour la 25th Anniversary (2002). Son intérieur est de qualité. La GTI TDI de 150 ch accompagne la gamme.\n\nElle est un peu lourde mais très bien finie.",
    [], [], ["vw-golf-gti-mk3", "vw-golf-gti-mk5"]);
  add("vw-golf-gti-mk5",
    "La Golf GTI Mk5 (2004) revient aux sources de la GTI avec le 2.0 TFSI de 200 ch et la boîte DSG. Elle est considérée comme l'un des grands retours de la GTI. L'Edition 30 (2006) délivre 230 ch.\n\nElle est restée en production jusqu'en 2008.",
    [["Le retour de la GTI", "La Mk5 rétablit la réputation de la GTI après les années plus sages de la Mk3 et de la Mk4."]], [], ["vw-golf-gti-mk4", "vw-golf-gti-mk6"]);
  add("vw-golf-gti-mk6",
    "La Golf GTI Mk6 (2008) reprend le 2.0 TSI de 211 ch. La Edition 35 (2011) délivre 235 ch. Elle reçoit un nouveau design plus sobre.\n\nElle est vendue jusqu'en 2012.",
    [], [], ["vw-golf-gti-mk5", "vw-golf-gti-mk7"]);
  add("vw-golf-gti-mk7",
    "La Golf GTI Mk7 (2013), construite sur la plate-forme MQB, est équipée du 2.0 TSI de 220 ch, puis de 230 ch en Performance. La Clubsport (2016) atteint 265 ch, jusqu'à 290 ch en overboost. La Mk7.5 (2017) reçoit un restylage. Elle est une référence de la catégorie.\n\nLa Clubsport S (2016) a établi un record du Nürburgring pour les tractions avant.",
    [["Clubsport S", "La Clubsport S de 2016 a battu le record du Nürburgring pour une traction avant, avec 310 ch."]], [], ["vw-golf-gti-mk6", "vw-golf-gti-mk8"]);
  add("vw-golf-gti-mk8",
    "La Golf GTI Mk8 (2020) reprend le 2.0 TSI de 245 ch. La Clubsport (2021) atteint 300 ch, et l'Edition 50, série spéciale qui célèbre les 50 ans de la GTI,. L'intérieur est dominé par des écrans tactiles.\n\nLa GTI Mk8 a été critiquée pour son interface tactile.",
    [["50 ans de GTI", "La GTI Edition 50 fête le cinquantième anniversaire de la lignée."]], [], ["vw-golf-gti-mk7"]);

  /* ---------------- SEAT */
  add("seat-leon-fr-mk1",
    "La SEAT León Mk1 (1999) est la première León. La FR (Formula Racing, 2003) reçoit le 1.8T de 180 ch et le TDI 150. Elle est la compacte sportive de la gamme, avec la Cupra R (225 ch).\n\nLa León partage sa plate-forme avec la Golf IV.",
    [["Cupra R", "La Cupra R de 225 ch a été l'une des meilleures SEAT de série."]], [], ["seat-leon-fr-mk2"]);
  add("seat-leon-fr-mk2",
    "La SEAT León Mk2 (2005) est dessinée par Walter de Silva et Luc Donckerwolke. Elle reçoit le 2.0 TFSI de 211 ch dans la version FR. La Cupra (240 ch) et la Cupra R (265 ch) complètent la gamme. En compétition, la León TDI de SEAT Sport remporte le championnat du monde des voitures de tourisme (WTCC) en 2008 avec Yvan Muller et en 2009 avec Gabriele Tarquini.\n\nElle est vendue jusqu'en 2012.",
    [["WTCC", "La León TDI a gagné deux fois de suite le championnat du monde des voitures de tourisme."]], [["WTCC 2008 et 2009", "Yvan Muller (2008) et Gabriele Tarquini (2009) sur SEAT León TDI."]], ["seat-leon-fr-mk1", "seat-leon-fr-mk3"]);
  add("seat-leon-fr-mk3",
    "La SEAT León Mk3 (2013) repose sur la plate-forme MQB. La FR reçoit le 1.4 TSI, le 1.8 TSI ou le 2.0 TDI. La Cupra 280 offre un 2.0 TSI de 280 ch. Elle est la compacte la plus vendue de la marque.\n\nElle est vendue jusqu'en 2020.",
    [], [], ["seat-leon-fr-mk2", "seat-leon-fr-mk4"]);
  add("seat-leon-fr-mk4",
    "La SEAT León Mk4 (2020) reçoit des moteurs micro-hybrides (eTSI), diesel (TDI) et hybrides rechargeables (e-Hybrid de 204 ch). Elle adopte un tableau de bord numérique. La FR reste la finition sportive.\n\nLa marque Cupra, désormais indépendante, propose les versions les plus performantes.",
    [], [], ["seat-leon-fr-mk3"]);

  /* ---------------- FIAT */
  add("fiat-1000tipla",
    "La 1000Tipla est une création déjantée de Vilebrequin & W Auto Sport (2020-2023) : un monospace Fiat Multipla associé à un châssis et un V8 6.2 suralimenté d'origine Corvette, annoncé à 1 294 ch. Le kit large Rocket Bunny, dessiné par Kei Miura, et un arceau FIA complètent le projet. La voiture a été présentée au public lors du Mondial de l'Auto 2022.\n\nSon financement participatif a dépassé le million d'euros en France. Les performances annoncées (1 294 ch, 300 km/h, 2,8 secondes de 0 à 100) sont celles revendiquées par ses constructeurs.",
    [["Un monospace de 1 300 ch", "La Multipla, réputée pour son style singulier, est devenue la base d'une voiture de show extrême."], ["Financement participatif", "Le projet a levé plus de 1,09 million d'euros auprès du public."]],
    [], []);

  MAKIT.enrich(m);
})();
