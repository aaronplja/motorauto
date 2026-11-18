/** MOTORAUTO — Mercedes-Benz (5/5) : gamme électrique EQ, F1 hybride, DTM, rallye et records. */
(function () {
  "use strict";
  const { X, push } = MAKIT, M = "Mercedes-Benz";
  push([
    X("mb-eqc", M, "EQC 400 4MATIC", "Break", "2019 - 2023", "A:D", "Le premier SUV 100 % électrique de Mercedes : 408 ch, batterie de 80 kWh, environ 400 km d'autonomie.",
      [["EQC (2019 - 2023)", "Deux moteurs électriques (un par essieu).", ["EQC 400 4MATIC|408|760|180|5.1|Auto 1|2 moteurs électriques, 80 kWh"], ["EQC 400 Edition 1886"]]],
      { h: "L'EQC est lancé en 2019 sur la base du GLC. Il porte la gamme EQ de Mercedes. Il est fabriqué à Brême.", rel: ["mb-eqe"] }),
    X("mb-eqe", M, "EQE / EQE SUV / AMG EQE 53", "Berline", "2021 - ...", "P:I", "La berline et le SUV électrique de segment E : EQE 350 de 292 ch à AMG EQE 53 de 687 ch.",
      [["EQE (2021 - ...)", "Berline et SUV électriques sur plateforme EVA2.", ["EQE 300|245|550|210|7.3|Auto 1|Moteur électrique 89 kWh", "EQE 350+|292|565|210|6.4|Auto 1|Moteur électrique 90 kWh", "EQE 350 4MATIC|292|765|210|6.2|Auto 1|2 moteurs électriques", "EQE 500 4MATIC|408|858|210|4.7|Auto 1|2 moteurs électriques", "AMG EQE 43 4MATIC|476|858|210|4.5|Auto 1|2 moteurs électriques", "AMG EQE 53 4MATIC+|687|950|240|3.5|Auto 1|2 moteurs électriques"], ["AMG EQE 53 4MATIC+"]]],
      { h: "L'EQE reprend les lignes en forme d'arche de l'EQS à l'échelle de la Classe E. Sa version AMG 53 atteint 687 ch en mode Boost.", rel: ["mb-eqs", "mb-e-w214"] }),
    X("mb-eqs", M, "EQS / EQS SUV / AMG EQS 53 / Maybach EQS 680", "Berline", "2021 - ...", "P:I", "La Classe S électrique : jusqu'à 770 km d'autonomie annoncée, Hyperscreen de 56 pouces, AMG EQS 53 de 761 ch.",
      [["EQS (2021 - ...)", "Berline à hayon et SUV 7 places.", ["EQS 350|292|565|210|6.4|Auto 1|Moteur électrique 90 kWh", "EQS 450+|333|568|210|6.2|Auto 1|Moteur électrique 108 kWh", "EQS 580 4MATIC|523|855|210|4.3|Auto 1|2 moteurs électriques", "AMG EQS 53 4MATIC+|761|950|250|3.4|Auto 1|2 moteurs électriques", "EQS 680 SUV Maybach|649|950|210|4.4|Auto 1|2 moteurs électriques"], ["Mercedes-Maybach EQS 680 SUV", "AMG EQS 53 4MATIC+"]]],
      { h: "L'EQS (2021) est la première Mercedes à plateforme 100 % électrique. Son coefficient de traînée (Cx) de 0,20 en fait la voiture de série la plus aérodynamique du monde.", rel: ["mb-s-w223"] }),
    X("mb-eqxx", M, "VISION EQXX", "Supercar", "2022", "P:R", "Le concept d'efficacité extrême : 1 202 km parcourus sur une charge entre Sindelfingen et Silverstone.",
      [["Vision EQXX (2022)", "Un moteur électrique de 150 kW pour une batterie de 100 kWh.", ["Moteur électrique EQXX|204|0|140|0|Auto 1|Moteur électrique (prototype)"]]],
      { h: "La Vision EQXX a parcouru 1 202 km en 2022 de Sindelfingen à Silverstone sur une seule charge. Son Cx de 0,17 est un record. Elle reste un prototype d'étude.", rel: ["mb-eqs"] }),
    X("mb-f1-hybrid", M, "Mercedes-AMG F1 W05 à W14 (ère hybride)", "Supercar", "2014 - 2023", "R:R", "Les F1 V6 turbo hybrides 1.6 litre qui ont dominé la F1 de 2014 à 2021 : huit titres constructeurs consécutifs.",
      [["W05 – W14 (2014 - 2023)", "V6 1.6 turbo hybride PU106 à PU106D.", ["1.6 V6 turbo hybride PU106A|760|0|350|2.6|Séquentielle 8|PU106A (W05)", "1.6 V6 turbo hybride PU106C|1000|0|360|2.6|Séquentielle 8|PU106C (W08 - W10)", "1.6 V6 turbo hybride M11|1050|0|370|2.6|Séquentielle 8|PU106D (W11 - W12)"], ["W11 (2020, 13 victoires)", "W07 (2016)", "W08 (2017)"]]],
      { h: "Entre 2014 et 2021, Mercedes remporte huit titres constructeurs de suite, et sept titres pilotes dont six pour Lewis Hamilton. La W11 de 2020 est l'une des F1 les plus dominantes de l'histoire.", rel: ["mb-w125"] }),
    X("mb-c-dtm-94", M, "Classe C DTM / ITC AMG (1994 - 1996)", "Supercar", "1994 - 1996", "P:R", "La Classe C de course : V6 2.5 de 490 ch et 4 titres DTM/ITC.",
      [["C-Class DTM / ITC (1994 - 1996)", "V6 2.5 litres de 490 ch.", ["2.5 V6 DTM|490|0|0|0|Manuelle 6|AMG V6"]]],
      { h: "La Classe C (W202) a succédé à la 190 en DTM. Klaus Ludwig a gagné le titre DTM 1994 et Bernd Schneider celui de l'ITC 1995.", rel: ["mb-190e-dtm", "mb-clk-gtr"] }),
    X("mb-450-slc-rallye", M, "450 SLC 5.0 Rallye / 500 SLC", "Coupé", "1977 - 1980", "P:R", "La Mercedes de rallye qui a gagné le Rallye du Bandama 1979 et le Marathon de la Route.",
      [["450 SLC 5.0 Rallye (1977 - 1980)", "V8 5.0 litres M117 de 260 à 280 ch.", ["5.0 V8 M117|280|0|0|0|Auto 4|M117 compétition"]]],
      { h: "La 450 SLC 5.0 Rallye a gagné le Rallye du Bandama (Côte d'Ivoire) 1979 avec Bjorn Waldegard et Hannu Mikkola (5e, 4e). Mercedes met fin à son programme en 1980.", rel: ["mb-sl-r107"] }),
    X("mb-g-dakar", M, "G-Class Dakar / G 63 AMG Dakar", "Break", "1983 - 1984", "E:R", "Le Geländewagen vainqueur du Paris-Dakar 1983 avec Jacky Ickx.",
      [["280 GE Dakar (1983)", "Six cylindres M110 2.8 litres de 160 ch.", ["2.8 L6 M110|160|0|150|0|Manuelle 5|M110 compétition"]]],
      { h: "Jacky Ickx et Claude Brasseur remportent le Paris-Dakar 1983 en Mercedes 280 GE. C'est la seule victoire de la marque à Dakar.", rel: ["mb-g-w460"] }),
    X("mb-amg-c63-dtm", M, "AMG C 63 DTM (2012 - 2018)", "Supercar", "2012 - 2018", "P:R", "La C 63 de DTM : V8 4.0 de 500 ch.",
      [["C 63 DTM (2012 - 2018)", "V8 4.0 atmosphérique de 500 ch.", ["4.0 V8 DTM|500|0|0|0|Séquentielle 6|AMG V8 DTM"]]],
      { h: "La C 63 DTM est engagée de 2012 à 2018. Gary Paffett (2005, 2018), Paul Di Resta (2010) et Pascal Wehrlein (2015) ont décroché des titres.", rel: ["mb-c-w204"] })
  ]);
})();
