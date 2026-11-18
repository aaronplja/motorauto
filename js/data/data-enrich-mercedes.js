/** MOTORAUTO — compléments Mercedes-Benz (lot 2) : 0-100, couple, histoire, anecdotes. Valeurs constructeur arrondies : fiches marquées « indicatif ». */
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
  const z = (list) => { const o = {}; Object.keys(list).forEach((k) => { o[k] = [0, 0, list[k]]; }); return o; };

  add("mb-300-sl-gullwing", "La 300 SL (W198, 1954) dérive de la voiture de course W194. Son six-cylindres 3.0 litres est le premier moteur de série à injection directe d'essence, et ses portes papillon, imposées par le châssis tubulaire, l'ont rendue célèbre.",
    [["Portes papillon", "Le châssis tubulaire très haut dans les seuils impose des portes qui s'ouvrent vers le haut."], ["La plus rapide de son temps", "Avec jusqu'à 260 km/h selon le rapport de pont, c'était la voiture de série la plus rapide de son époque."]], [["Production", "Environ 1 400 coupés ont été construits de 1954 à 1957."]], z({ 0: 8.8 }));
  add("mb-190-sl", "La 190 SL (W121, 1955) reprend le style de la 300 SL avec un quatre-cylindres 1.9 litre. Plus abordable, elle devient un best-seller du roadster Mercedes (environ 25 000 exemplaires).",
    [["Le look de la 300 SL", "Elle reprend les lignes de la 300 SL mais avec un moteur plus modeste."], ["Hard-top amovible", "Un hard-top amovible était proposé en option."]], [], z({ 0: 14 }));
  add("mb-sl-w113", "La W113 (1963) est surnommée « Pagode » à cause de son toit concave dessiné par Paul Bracq, qui améliore la visibilité. Elle est proposée en 230 SL, 250 SL et 280 SL.",
    [["Le toit pagode", "Son hard-top creusé en son centre évoque le toit d'une pagode."], ["Un grand succès", "Environ 48 900 exemplaires sont produits."]], [], z({ 0: 11.5, 1: 10.5, 2: 9.5 }));
  add("mb-sl-r107", "La SL R107 reste au catalogue 18 ans (1971-1989), un record pour Mercedes. Du six-cylindres 280 SL au V8 560 SL, elle est produite à environ 237 000 exemplaires.",
    [["18 ans de production", "Elle reste en production de 1971 à 1989, presque sans changement de ligne."], ["560 SL", "La 560 SL est la plus puissante, avec un V8 de 5.6 litres."]], [], z({ 0: 9.6, 1: 9.5, 2: 9, 3: 9.2, 4: 7.7, 5: 7.2 }));
  add("mb-sl-r129", "La SL R129 (1989) est un roadster à arceau de sécurité escamotable qui se déploie automatiquement. Elle reçoit des six-cylindres, des V8 et en 1992 un V12 (600 SL).",
    [["Arceau automatique", "Un arceau de sécurité jaillit en une fraction de seconde en cas de risque de tonneau."], ["600 SL", "La 600 SL V12 apparaît en 1992."]], [], z({ 0: 8.9, 1: 7.3, 2: 7.9 }));
  add("mb-sl-r230", "La R230 (2001) adopte un toit rigide escamotable (Vario-Roof) et la suspension ABC. Les versions AMG montent jusqu'à la SL 65 AMG, un V12 biturbo de 612 ch (2004).",
    [["Toit rigide escamotable", "Le toit se replie dans le coffre en quelques secondes."], ["SL 65 AMG", "Le V12 biturbo de la SL 65 AMG développe 612 ch."]]);
  add("mb-sl-r231", "La SL R231 (2012) passe à une structure tout en aluminium et gagne en légèreté. La R232 (2021) est développée par AMG et revient à une capote en toile.",
    [["Magic Sky Control", "Un toit panoramique à opacité variable est proposé en option."], ["Retour de la capote", "La R232 abandonne le toit rigide pour une capote en toile."]]);
  add("mb-slk", "Le SLK (R170, 1996) est le premier roadster compact à toit rigide escamotable (Vario-Roof). Il a connu trois générations (R170, R171, R172) avant de devenir SLC en 2016.",
    [["Le toit métallique", "Le toit en deux éléments se range dans le coffre en 25 secondes."], ["Du SLK au SLC", "Le SLK est renommé SLC en 2016, et s'arrête en 2020."]]);
  add("mb-s-w126", "La W126 (1979) est la grande Classe S des années 1980, produite à environ 890 000 exemplaires. Elle introduit l'ABS (1981) et l'airbag conducteur (1981) en option.",
    [["Les aides à la sécurité", "ABS et airbag sont proposés dès 1981."], ["Coupés SEC", "Les coupés SEC offrent une version plus luxueuse."]], [["Production", "Environ 892 000 exemplaires."]], { 0: [0, 0, 10.5], 1: [0, 0, 9.5], 2: [0, 0, 9], 3: [0, 0, 8], 5: [245, 0, 13] });
  add("mb-s-w140", "La W140 (1991) est une Classe S imposante, renommée pour sa qualité de fabrication. Le V12 apparaît en 1992 avec la 600 SEL. Le coupé CL 600 se rencontre en 1992 également.",
    [["Antennes de parking", "Des tiges rétractables aident à repérer les extrémités de la voiture."], ["Double vitrage", "Elle est la première Mercedes à double vitrage de série sur certaines versions."]], [], { 0: [0, 0, 9.5], 1: [0, 0, 9], 2: [0, 0, 7.5], 3: [0, 0, 6.9], 5: [305, 0, 12.5] });
  add("mb-s-w220", "La W220 (1998) introduit la suspension pneumatique Airmatic et le régulateur de vitesse radar Distronic (1999). Les S 55 AMG, S 63 AMG et S 65 AMG sont les plus sportives.",
    [["Distronic", "Le régulateur adaptatif apparaît sur la Classe S en 1999."], ["V12 biturbo", "La S 600 et la S 65 AMG utilisent un V12 biturbo."]], [], z({ 0: 8.8, 1: 7, 4: 6.3, 6: 7.4 }));
  add("mb-s-w221", "La W221 (2005) est plus technologique : Night View Assist, régulateur de vitesse Distronic Plus. La S 63 AMG utilise un V8 6.2 litres atmosphérique de 525 ch.",
    [["Night View", "La vision nocturne par caméra infrarouge est proposée."], ["Hybride", "La S 400 Hybrid (2009) est la première hybride de série de Mercedes."]]);
  add("mb-s-w222", "La W222 (2013) combine style et technologies de conduite semi-autonome. La Mercedes-Maybach S 600 (2014) la porte au sommet de la gamme, et la S 63 AMG utilise un V8 biturbo.",
    [["Magic Body Control", "La suspension lit la route avec une caméra et prépare l'amortissement."], ["Maybach", "La Mercedes-Maybach S 600 revient en 2014."]], [], { 5: [0, 0, 5.2] });
  add("mb-s-w223", "La W223 (2020) est la Classe S la plus récente. Elle propose la direction aux quatre roues, un écran 3D et le système Drive Pilot (conduite autonome de niveau 3, homologué en Allemagne en 2021).",
    [["Drive Pilot", "Il est homologué en Allemagne pour la conduite autonome de niveau 3 jusqu'à 60 km/h."], ["Hybride rechargeable", "La S 580 e est une hybride rechargeable."]]);
  add("mb-w114", "La /8 (« Strich-Acht », 1968) est la berline moyenne de Mercedes des années 1970. Produite à environ 1,9 million d'exemplaires, elle est proposée en berline et coupé.",
    [["Strich-Acht", "Le nom vient de l'année de lancement : 1968, soit « trait 8 »."], ["Coupé", "Un élégant coupé existe aussi."]], [], z({ 0: 14.5, 1: 13, 2: 11.5, 3: 10, 4: 25 }));
  add("mb-w123", "La W123 (1976) est l'une des Mercedes les plus durables : environ 2,7 millions d'exemplaires. Elle est proposée en berline, break (T) et coupé, et sert de taxi dans le monde entier.",
    [["Une légende de fiabilité", "Beaucoup de W123 dépassent le million de kilomètres."], ["Le diesel turbo", "La 300 TD Turbo était l'une des premières berlines diesel turbo en Amérique."]], [], z({ 0: 14.5, 1: 11.5, 2: 9.5, 3: 27, 4: 24, 5: 20, 6: 13.5 }));
  add("mb-190e", null, [["Le « petit Benz »", "La 190 (W201, 1982) est la première Mercedes compacte. Elle est l'une des voitures les plus testées pour la sécurité."], ["2.3-16 à Nardo", "En 1983, une 190 E 2.3-16 établit trois records du monde de vitesse sur le circuit de Nardo, avec une moyenne de 247 km/h sur 50 000 km."]], [], z({ 0: 11.5, 1: 10.5, 2: 9.5, 3: 8.5, 4: 19, 5: 11.5 }));
  add("mb-190e-dtm", "La 190 E 2.5-16 Evo II (1990) est la version d'homologation du DTM : 502 exemplaires de route. En course, la 190 E Evo II gagne le DTM 1992 avec Klaus Ludwig.",
    [["Klaus Ludwig", "Le pilote allemand remporte le championnat DTM 1992."], ["Aileron", "Son énorme aileron arrière est resté une icône."]]);
  add("mb-w124", "La W124 (1984) est la première Classe E (nom adopté en 1993). Elle est proposée en berline, break, coupé et cabriolet. Plusieurs versions sportives sont signées AMG, dont l'E 60 AMG.",
    [["Tenue de route", "Son train arrière multibras est une référence."], ["500 E", "La 500 E est assemblée en partie par Porsche."]], [], z({ 0: 11.5, 1: 10.5, 2: 9.5, 3: 8.5, 4: 7.5, 5: 16, 6: 13, 7: 10.5 }));
  add("mb-500e", "La 500 E (1990) est une W124 dotée du V8 5.0 litres de 326 ch, assemblée en partie par Porsche à Zuffenhausen. Elle est produite à environ 10 500 exemplaires.",
    [["Fabriquée chez Porsche", "Une partie de l'assemblage est confiée à Porsche, qui y trouve du travail."], ["Le grand sleeper", "Sa ligne discrète cache des performances de sportive."]]);
  add("mb-e60-w124", "La E 60 AMG est une W124 transformée par AMG avec un V8 5.6 litres (360 ch environ), ou 6.0 litres, qui lui vaut son surnom de « Hammer ». Elle est produite à très peu d'exemplaires.",
    [["The Hammer", "Le surnom vient de la 300 E 5.6 AMG de 1986."], ["Un préparateur devenu constructeur", "AMG devient filiale de Mercedes en 1999."]]);
  add("mb-c-w202", "La W202 (1993) est la première Classe C. Elle succède à la 190 E et est proposée en berline et break. Les versions C 36 AMG (1993) et C 43 AMG (1997) en sont les versions sportives.",
    [["C 36 AMG", "Un six-cylindres 3.6 litres de 280 ch pour la première AMG de la Classe C."], ["C 43 AMG", "Le V8 4.3 litres de 306 ch arrive en 1997."]], [], z({ 0: 12.5, 1: 11.5, 2: 10.5, 3: 9.5, 4: 8.5, 7: 14.5 }));
  add("mb-c-w203", "La W203 (2000) est la deuxième génération de Classe C, avec le Sportcoupé (2001). La C 32 AMG est équipée d'un V6 compressé de 354 ch, la C 55 AMG d'un V8 de 367 ch.",
    [["Sportcoupé", "Un coupé à hayon est lancé en 2001."], ["C 32 AMG", "Un V6 à compresseur de 354 ch."]], [], z({ 0: 10.5, 1: 9.5, 2: 8.5, 3: 9, 4: 7.2, 7: 9.5 }));
  add("mb-c-w204", "La W204 (2007) est la troisième Classe C. La C 63 AMG (2007) reçoit un V8 atmosphérique 6.2 litres de 457 ch, et la Black Series (2011) atteint 517 ch.",
    [["Le V8 6.2 atmosphérique", "Le moteur M156 est resté célèbre pour son son."], ["Black Series", "La Black Series est la plus radicale."]], [], { 0: [0, 0, 9.2], 1: [0, 0, 9.9], 3: [0, 0, 7.5], 4: [0, 0, 6.6] });
  add("mb-c-w205", "La W205 (2014) adopte de nombreux éléments de la Classe S. La C 43 AMG (367 ch) et la C 63 S (510 ch) en sont les versions sportives.",
    [["Plus légère", "Elle est plus légère grâce à l'aluminium."], ["C 63 S", "Le V8 biturbo de la C 63 S développe 510 ch."]], [], { 0: [0, 0, 10.2] });
  add("mb-c-w206", "La W206 (2021) est la génération actuelle. La C 63 S E Performance (2023) abandonne le V8 pour un quatre-cylindres turbo hybride de 680 ch.",
    [["Un quatre-cylindres de 680 ch", "La C 63 S E Performance combine un 2.0 turbo et un moteur électrique."], ["Hybride rechargeable", "Les C 300 e sont hybrides rechargeables."]]);
  add("mb-e-w210", "La W210 (1995) se reconnaît à ses doubles phares ovales. Elle est connue pour ses problèmes de rouille sur les premières séries. La E 55 AMG (1998) est équipée d'un V8 de 347 ch.",
    [["Les yeux de lunettes", "Ses doubles phares ronds ou ovales ont marqué la ligne."], ["E 55 AMG", "Un V8 5.4 litres de 347 ch."]], [], z({ 0: 11.8, 1: 9.5, 2: 7.5, 3: 6.7, 5: 11.5, 6: 7.9 }));
  add("mb-e-w211", "La W211 (2002) introduit la suspension Airmatic et le freinage électro-hydraulique SBC. Les E 55 AMG Kompressor (476 ch) et E 63 AMG (514 ch, 2006) en sont les versions sportives.",
    [["SBC", "Le freinage Sensotronic remplace la commande hydraulique classique."], ["E 63 AMG", "Un V8 6.2 litres de 514 ch."]], [], { 0: [0, 0, 9.6], 1: [0, 0, 8.7], 2: [0, 0, 7], 7: [0, 0, 8.6], 8: [0, 0, 6.8] });
  add("mb-e-w212", "La W212 (2009) redessine la Classe E. La E 63 AMG (2009) reçoit un V8 puis un V8 biturbo de 557 ch (2011).",
    [["Phares à LED", "Les phares avant sont des éléments de style."], ["E 63 AMG", "Le V8 biturbo remplace l'atmosphérique."]], [], { 0: [0, 0, 8.4], 2: [0, 0, 7.1], 7: [0, 0, 8.4], 8: [0, 0, 6.7] });
  add("mb-e-w213", "La W213 (2016) propose le pilotage semi-autonome. La E 63 S (612 ch) et la E 53 AMG (2018) sont les versions sportives.",
    [["Drive Pilot", "Elle permet de changer de voie automatiquement."], ["E 53", "La E 53 utilise un six-cylindres turbo électrifié."]]);
  add("mb-e-w214", "La W214 (2023) est la génération actuelle. La E 53 Hybrid (2023) associe un six-cylindres turbo et un moteur électrique.",
    [["Hybride rechargeable", "Elle propose l'hybride rechargeable."], ["Écrans", "Elle intègre le MBUX Superscreen."]]);
  add("mb-clk-c208", "Le CLK (C208, 1997) est le coupé qui prolonge la Classe C. Le CLK 55 AMG (1999) reçoit un V8 de 347 ch, et le CLK 63 AMG Black Series (2008) atteint 507 ch.",
    [["CLK GTR", "Le CLK donne son nom à la supercar CLK GTR de 1997."], ["Black Series", "Le CLK 63 AMG Black Series est un modèle rare."]], [], z({ 0: 9.6, 1: 7.9, 3: 6.8 }));
  add("mb-clk-gtr", "La CLK GTR (1997) est une supercar homologuée pour la route pour participer au championnat FIA GT. Son V12 6.9 litres développe 612 ch, et seulement 25 exemplaires de route ont été construits.",
    [["Champion FIA GT", "La CLK GTR gagne le championnat FIA GT 1997."], ["25 exemplaires", "Seuls 25 coupés de route ont été construits pour l'homologation."]]);
  add("mb-clk-dtm", "La CLK DTM AMG est la voiture de course du retour du DTM (2000). Bernd Schneider remporte le titre en 2000 et 2001.",
    [["Bernd Schneider", "Le pilote allemand est champion en 2000 et 2001."], ["V8 4.0", "Un V8 de 4.0 litres d'environ 470 ch."]]);
  add("mb-cls", "Le CLS (2004) est présenté comme le premier « coupé quatre portes ». Il a lancé un segment imité par de nombreux constructeurs. Le CLS 63 AMG en est la version la plus sportive.",
    [["Un nouveau segment", "Le CLS est le premier coupé à quatre portes."], ["Shooting Brake", "Une variante break de chasse existe à partir de 2012."]], [], { 0: [0, 0, 7.5], 7: [0, 0, 6.9] });
  add("mb-cl", "Le CL est le grand coupé de la gamme, de la C140 (1992) à la C216 (2006-2014). Les versions CL 63 AMG et CL 65 AMG en sont les plus puissantes.",
    [["CL 65 AMG", "Un V12 biturbo de 612 ch."], ["Coupé sans montant", "Les vitres latérales sont sans montant central."]], [], { 0: [0, 0, 6.9] });
  add("mb-ssk", "La SSK (1928) est une voiture de sport à compresseur dessinée par Ferdinand Porsche, un six-cylindres de 7.1 litres. Rudolf Caracciola gagne la Mille Miglia 1931 au volant d'une SSK, première victoire d'un étranger.",
    [["Super Sport Kurz", "Le nom signifie « Super Sport Court » (empattement raccourci)."], ["Mille Miglia 1931", "Caracciola remporte l'épreuve italienne."]], [["Mille Miglia", "Victoire en 1931 de Rudolf Caracciola."]]);
  add("mb-540k", "Les 380 K, 500 K et 540 K (1933-1939) sont de grandes routières de luxe à huit cylindres en ligne et compresseur. Leur 540 K est l'une des Mercedes d'avant-guerre les plus recherchées.",
    [["Le compresseur Roots", "Le compresseur s'enclenche en appuyant à fond sur l'accélérateur."], ["Spezial Roadster", "La 540 K Spezial Roadster est un des modèles les plus chers du monde."]]);
  add("mb-w125", "La W125 (1937) est la monoplace de Grand Prix de la Flèche d'argent : un huit-cylindres 5.7 litres à compresseur de plus de 600 ch. Rudolf Caracciola est champion d'Europe 1937.",
    [["Flèches d'argent", "Le surnom viendrait de la peinture retirée pour gagner du poids."], ["Plus de 600 ch", "Une puissance exceptionnelle pour l'époque."]]);
  add("mb-w196", "La W196 (1954-1955) marque le retour de Mercedes en Grand Prix. Juan Manuel Fangio est champion du monde 1954 et 1955. Elle utilise l'injection directe et la distribution desmodromique.",
    [["Fangio", "Le pilote argentin gagne deux titres avec la W196."], ["Carrosserie fermée", "Une version carénée est utilisée sur les circuits rapides."]]);
  add("mb-300-slr", null, [["Mille Miglia 1955", "Stirling Moss et Denis Jenkinson gagnent la Mille Miglia 1955 à 157 km/h de moyenne avec la 300 SLR."], ["Le Mans 1955", "Après l'accident du Mans 1955, Mercedes se retire de la compétition."]]);
  add("mb-170v", "La 170 V (1936) est la Mercedes populaire d'avant-guerre, produite jusqu'à la reprise en 1946 de la production d'après-guerre.",
    [["Reprise de production", "Elle est la première Mercedes produite après la guerre."], ["Un modèle économique", "Son quatre-cylindres est simple et fiable."]]);
  add("mb-220-ponton", "La 220 « Ponton » (W180, 1954) abandonne les ailes saillantes pour une carrosserie à flancs lisses. Elle introduit la carrosserie monocoque autoporteuse chez Mercedes.",
    [["Le nom Ponton", "Son style sans ailes évoque un ponton."], ["Monocoque", "Elle abandonne le châssis séparé."]]);
  add("mb-300-adenauer", "La 300 (W186, 1951) est surnommée « Adenauer », du nom du chancelier allemand qui en possédait une. Elle est le haut de gamme de Mercedes d'après-guerre.",
    [["Konrad Adenauer", "Le chancelier allemand en faisait son véhicule officiel."], ["300 d", "La 300 d (1957) reçoit l'injection d'essence."]]);
  add("mb-600", null, [["Le « Grosser Mercedes »", "La 600 (1963) est la voiture de prestige : V8 6.3 litres et suspension pneumatique. Environ 2 700 exemplaires sont produits."], ["Clients célèbres", "Elle a transporté des chefs d'État et des stars."]]);
  add("mb-300-sel-63", "La 300 SEL 6.3 (W109, 1968) glisse le V8 6.3 litres de la 600 dans une Classe S. Elle est considérée comme la première super-berline. AMG en tire la « Rote Sau » (300 SEL 6.8) deuxième aux 24 Heures de Spa 1971.",
    [["La Rote Sau", "La 300 SEL 6.8 AMG termine deuxième aux 24 Heures de Spa 1971."], ["Super-berline", "La référence de la berline surpuissante."]]);
  add("mb-450-sel-69", "La 450 SEL 6.9 (W116, 1975) reprend la formule de la 6.3 avec un V8 6.9 litres de 286 ch et une suspension hydropneumatique. Environ 7 400 exemplaires sont produits.",
    [["Suspension hydropneumatique", "Elle maintient l'assiette constante."], ["Fin d'une époque", "Dernière berline Mercedes à moteur V8 géant avant l'ère moderne."]]);
  add("mb-w111-coupe", "Les coupés et cabriolets W111 (1961) sont des Mercedes de luxe élégantes, construites à la main en petite série. La 280 SE 3.5 (1969) reçoit un V8.",
    [["Construction artisanale", "Ils sont assemblés à la main."], ["280 SE 3.5", "La 280 SE 3.5 est la version la plus recherchée."]], [], z({ 0: 13.5, 1: 11.5, 2: 11, 3: 9.5 }));
  add("mb-c111", "La C111 (1969) est une série de prototypes expérimentaux, d'abord à moteur Wankel à 3 et 4 rotors, puis diesel. Les C111-II D et C111-III battent des records de vitesse sur diesel (jusqu'à 403 km/h).",
    [["Rotatif", "La C111 a d'abord eu un moteur rotatif."], ["Records diesel", "La C111-III atteint 403 km/h en 1978."]]);
  add("mb-slr-mclaren", "La SLR McLaren (2003) est une supercar développée avec McLaren, avec un V8 5.4 litres à compresseur de 626 ch. Les éditions 722 (650 ch) et Stirling Moss (650 ch, sans pare-brise, 75 exemplaires) en sont les versions spéciales.",
    [["Fabriquée à Woking", "McLaren assemble la voiture au Royaume-Uni."], ["Stirling Moss", "Une version sans pare-brise en hommage au pilote."]]);
  add("mb-sls", null, [["Les portes papillon reviennent", "La SLS AMG (2010) reprend les portes papillon de la 300 SL."], ["Electric Drive", "La SLS AMG Electric Drive (2013) développe 751 ch avec quatre moteurs électriques."]]);
  add("mb-amg-gt-4", "L'AMG GT 4 portes (X290, 2018) est la version familiale de l'AMG GT. La GT 63 S 4MATIC+ développe 639 ch, et la GT 63 S E Performance (2022) atteint 843 ch.",
    [["Quatre portes", "Elle ajoute des portes arrière et un hayon."], ["E Performance", "Une version hybride rechargeable de 843 ch."]]);
  add("mb-amg-gt-c192", "L'AMG GT (C192, 2023) est la deuxième génération du coupé. Elle devient 2+2 et reçoit la transmission intégrale, avec un V8 biturbo.",
    [["2+2", "Pour la première fois, des places arrière sont disponibles."], ["GT 63 PRO", "Une version PRO est orientée performance."]]);
  add("mb-amg-gt3", "L'AMG GT3 (2015) succède à la SLS AMG GT3. Elle est proposée en GT3, GT4 et GT2, avec un V8 (6.2 puis 4.0 biturbo). Elle est l'une des GT3 les plus répandues chez les clients.",
    [["Courses de clientèle", "Elle est alignée par de nombreuses équipes."], ["AMG GT2", "Une version de 710 ch est destinée aux championnats GT2."]]);
  add("mb-amg-one", "La Mercedes-AMG ONE (2022) est une hypercar de route dont la chaîne cinématique est celle de la Formule 1 : un V6 1.6 turbo hybride avec quatre moteurs électriques, soit 1 063 ch. 275 exemplaires sont prévus.",
    [["Moteur de F1", "Elle utilise un moteur de F1 homologué pour la route."], ["Développement long", "Son développement a été retardé par des difficultés à faire homologuer le moteur."]]);
  add("mb-a-w168", "La Classe A W168 (1997) est la première Mercedes compacte à traction avant. Au « test de l'élan », la première voiture se retourne, ce qui oblige Mercedes à ajouter l'ESP de série.",
    [["Le test de l'élan", "Un retournement lors d'un essai de journalistes entraîne des modifications du châssis."], ["ESP de série", "Mercedes équipe toute la gamme d'ESP."]], [], z({ 0: 15.5, 1: 12.5, 2: 10.5, 3: 13.5, 4: 7.8, 5: 11.8 }));
  add("mb-a-w176", "La Classe A W176 (2012) adopte un style plus sportif. L'A 45 AMG (2013) reçoit un quatre-cylindres 2.0 turbo de 360 ch, alors le plus puissant moteur de série de sa catégorie.",
    [["A 45 AMG", "Un quatre-cylindres de 360 ch."], ["Compacte premium", "Elle vise le segment des compactes premium."]], [], z({ 0: 11.3, 3: 11 }));
  add("mb-b", "La Classe B (2005, W245) est un monospace compact à plancher en « sandwich ». La B 250 e (W242, 2014) est une version électrique, puis la W247 (2019) hybride rechargeable.",
    [["Plancher sandwich", "Il abrite les batteries ou le moteur."], ["B Electric Drive", "Une version électrique est proposée en 2014."]], [], z({ 0: 13.3, 1: 10.9, 2: 8.2, 3: 11.5, 4: 7.9 }));
  add("mb-cla", "Le CLA (C117, 2013) est un coupé quatre portes compact. Le CLA 45 AMG reçoit le quatre-cylindres 2.0 turbo de 360 ch.",
    [["Coupé quatre portes", "Le CLA reprend le concept du CLS en plus compact."], ["Shooting Brake", "Une version break de chasse existe."]], [], z({ 0: 9.3 }));
  add("mb-gla-glb", "Le GLA (2013) est le SUV compact de Mercedes basé sur la Classe A. Le GLA 45 S AMG développe 421 ch.",
    [["SUV compact", "Il reprend la base de la Classe A."], ["GLA 45 S", "Un quatre-cylindres 2.0 turbo de 421 ch."]], [], z({ 0: 9.9 }));
  add("mb-glb", "Le GLB (2019) est un SUV compact familial pouvant accueillir jusqu'à sept places. Il se distingue par un style très carré.",
    [["Sept places", "Une troisième rangée est disponible en option."], ["Style carré", "Son design rappelle la Classe G."]]);
  add("mb-eqa", "L'EQA (2021) est la version électrique du GLA. L'EQA 250 développe 190 ch et offre environ 430 km d'autonomie.",
    [["Électrique", "Base du GLA."], ["Autonomie", "Environ 430 km WLTP."]]);
  add("mb-eqb", "L'EQB (2021) est la version électrique du GLB, avec sept places en option.",
    [["Électrique à sept places", "Il propose jusqu'à sept places."], ["EQB 350 4MATIC", "Version à deux moteurs, 292 ch."]]);
  add("mb-g-w460", null, [["Né d'un projet de véhicule militaire", "La Classe G (1979) est développée avec Steyr-Daimler-Puch à Graz, en Autriche, où elle est encore produite."], ["G 63 AMG", "La G 63 AMG (2012) reçoit un V8 biturbo de 544 ch."]], [], { 0: [0, 0, 21], 1: [0, 0, 14.5], 2: [177, 0, 28], 3: [0, 0, 22], 4: [0, 0, 11.5], 5: [0, 0, 8.5], 10: [0, 0, 7.4] });
  add("mb-glk", "Le GLK (X204, 2008) est un SUV compact carré, vendu surtout en Europe et en Chine. Il est remplacé par le GLC en 2015.",
    [["Style anguleux", "Un look volontairement proche de la Classe G."], ["Pas de volant à droite", "Il n'a pas été proposé en conduite à droite."]], [], z({ 0: 9, 1: 6.9 }));
  add("mb-glk-glc", "Le GLC (X253, 2015) succède au GLK. Le GLC 63 S AMG développe 510 ch avec un V8 biturbo, et le GLC 300 e est hybride rechargeable.",
    [["GLC 63 S", "Un V8 biturbo de 510 ch."], ["Hybride rechargeable", "Le GLC 300 e propose l'hybride rechargeable."]]);
  add("mb-ml", "Le ML (W163, 1997) est le premier SUV Mercedes, fabriqué à Tuscaloosa, en Alabama. Le ML 55 AMG (1999) apporte un V8 de 347 ch.",
    [["Made in Alabama", "Il est le premier Mercedes fabriqué aux États-Unis."], ["Jurassic Park", "Il apparaît dans Le Monde perdu : Jurassic Park."]], [], { 0: [0, 0, 9.3], 2: [0, 0, 6.9], 5: [0, 0, 7.8] });
  add("mb-gle", "Le GLE (2015) est le nouveau nom du ML. La GLE 63 S AMG (4.0 V8 biturbo, 612 ch) en est la version la plus puissante, avec une déclinaison Coupé.",
    [["Nouveau nom", "Le ML devient GLE en 2015."], ["GLE Coupé", "Une version Coupé concurrence le BMW X6."]]);
  add("mb-gls", "Le GL (2006) est le grand SUV de Mercedes à sept places, rebaptisé GLS en 2015. La Mercedes-Maybach GLS 600 (2020) en est la version de luxe.",
    [["Sept places", "Il a trois rangées de sièges."], ["Maybach GLS", "Une version de luxe signée Maybach."]], [], z({ 0: 9.1, 1: 7.1, 2: 5.5 }));
  add("mb-v-vito", "La Classe V est le grand monospace de Mercedes, héritier du Vito (1996) et du Viano (2003). Les versions Marco Polo sont des camping-cars et l'EQV est électrique.",
    [["Marco Polo", "Une version camping-car très populaire."], ["EQV", "Une version 100 % électrique."]], [], z({ 0: 12.9, 1: 10.9, 2: 8, 3: 8.6, 4: 12.4 }));
  add("mb-sprinter", "Le Sprinter (1995) est le grand utilitaire de Mercedes, décliné en fourgon, châssis-cabine et minibus. L'eSprinter (2019) est électrique.",
    [["Un best-seller", "Il équipe de nombreuses flottes de livraison."], ["eSprinter", "Version électrique depuis 2019."]]);
  add("mb-x-class", "La Classe X (2017) est un pick-up de Mercedes basé sur le Nissan Navara. Sa production s'arrête en 2020 faute de ventes suffisantes.",
    [["Base Nissan", "Elle partage sa plate-forme avec le Navara."], ["Arrêt rapide", "Elle est retirée du catalogue en 2020."]], [], z({ 0: 13.2, 1: 11.8, 2: 7.9 }));
  add("mb-r-class", "La Classe R (W251, 2005) est un grand monospace de luxe à six places. Elle est restée peu vendue et sa production s'arrête en 2017 pour le marché chinois.",
    [["Sports Tourer", "Mercedes la présentait comme un croisement entre break, monospace et SUV."], ["Peu de succès", "Ses ventes sont restées confidentielles."]], [], z({ 0: 10.3, 1: 8.2, 2: 7.2, 3: 8.6 }));
  add("mb-maybach-57-62", "Maybach (2002) revient à la vie sous l'égide de Daimler avec les 57 et 62, de grandes limousines à V12 biturbo. La marque cesse en 2013.",
    [["Une marque ressuscitée", "Maybach revient après des décennies d'absence."], ["Exelero", "Un prototype Exelero de 700 ch a été construit pour Fulda."]]);
  add("mb-maybach", "La Mercedes-Maybach S 600 (2014) relance la marque Maybach comme variante haut de gamme de la Classe S. La S 680 (2021) utilise un V12 biturbo de 612 ch.",
    [["Siège relax", "Les sièges arrière offrent des fonctions de repos."], ["V12 biturbo", "Le V12 6.0 biturbo est le sommet de la gamme."]]);
  add("mb-eqc", "L'EQC (2019) est le premier SUV électrique de la gamme EQ. L'EQC 400 4MATIC développe 408 ch avec deux moteurs, pour environ 420 km d'autonomie.",
    [["Premier EQ", "Il inaugure la gamme électrique EQ."], ["Production", "Il est produit à Brême."]]);
  add("mb-eqe", "L'EQE (2021) est la berline électrique de segment E, avec une version SUV. L'AMG EQE 53 développe jusqu'à 687 ch.",
    [["Architecture EVA2", "Elle repose sur une plate-forme dédiée aux voitures électriques."], ["EQE SUV", "Une version SUV existe."]]);
  add("mb-eqs", "L'EQS (2021) est la Classe S électrique : jusqu'à 770 km d'autonomie annoncée, écran Hyperscreen de 56 pouces et Cx de 0,20, record pour une voiture de série.",
    [["Cx de 0,20", "Aérodynamique record pour une voiture de série."], ["Hyperscreen", "Un écran de 56 pouces couvre le tableau de bord."]]);
  add("mb-eqxx", "Le Vision EQXX (2022) est un concept d'efficience. En 2022, il parcourt environ 1 200 km de Sindelfingen à Cassis avec une seule charge.",
    [["1 200 km avec une charge", "Il rallie Sindelfingen à Cassis avec 1 202 km sans recharge."], ["Consommation", "Environ 8 kWh/100 km."]]);
  add("mb-f1-hybrid", "L'ère hybride de la F1 (2014-) est dominée par Mercedes : huit titres constructeurs consécutifs (2014-2021). Lewis Hamilton remporte six titres pilotes avec l'écurie (2014, 2015, 2017, 2018, 2019, 2020), Nico Rosberg gagne en 2016.",
    [["8 titres consécutifs", "Une domination sans précédent de 2014 à 2021."], ["Moteur à turbo hybride", "Le V6 1.6 turbo hybride est l'un des moteurs les plus efficients du monde."]]);
  add("mb-c-dtm-94", "La Classe C DTM/ITC (1994-1996) est la voiture de course du championnat DTM puis ITC. Klaus Ludwig est champion DTM 1994, Bernd Schneider champion ITC 1995.",
    [["Klaus Ludwig", "Champion DTM 1994."], ["Bernd Schneider", "Champion ITC 1995."]]);
  add("mb-450-slc-rallye", "La 450 SLC 5.0 de rallye (1977-1980) est un coupé de luxe engagé dans les rallyes d'endurance. Hannu Mikkola et Arne Hertz la mènent à la victoire au Rallye Bandama 1979.",
    [["Rallye Bandama", "Victoire en 1979 en Côte d'Ivoire."], ["Un coupé de luxe en rallye", "Un choix inattendu mais efficace sur les pistes d'endurance."]]);
  add("mb-g-dakar", "En 1983, Jacky Ickx et Claude Brasseur remportent le Paris-Dakar au volant d'une Mercedes 280 GE (Classe G).",
    [["Jacky Ickx", "L'ancien pilote de F1 gagne le Dakar 1983."], ["Claude Brasseur", "L'acteur est son coéquipier."]], [["Paris-Dakar", "Victoire en 1983 de Jacky Ickx et Claude Brasseur."]]);
  add("mb-amg-c63-dtm", "L'AMG C 63 DTM (2012-2018) est la voiture de course du DTM avec un V8 4.0 litres. Pascal Wehrlein est champion 2015, Gary Paffett champion 2018.",
    [["Pascal Wehrlein", "Champion DTM 2015 à 20 ans."], ["Gary Paffett", "Champion DTM 2018."]]);

  MAKIT.enrich(m);
})();
