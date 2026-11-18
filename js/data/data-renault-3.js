/** MOTORAUTO — Renault (3/3) : compétition (F1, Mégane Trophy, Clio Cup, Sport Spider Trophy, R5 Cup). Les rallye sont dans data-rally-*.js. */
(function () {
  "use strict";
  const { X, push } = MAKIT, R = "Renault";
  push([
    X("renault-rs01", R, "RS01 (F1 turbo 1977)", "Supercar", "1977 - 1979", "R:R", "La première Formule 1 à moteur turbo : « la théière jaune » de Renault, V6 1.5 turbo de 500 ch.",
      [["RS01 (1977 - 1978)", "V6 turbo 1.5 litre EF1 à 90°, 500 ch.", ["1.5 V6 turbo EF1|500|0|300|0|Manuelle 5|EF1"]]],
      { h: "La RS01 est la première F1 turbo de l'histoire. Elle est surnommée « la théière jaune » à cause de ses fumées et pannes. Jean-Pierre Jabouille offre à Renault sa première victoire en F1 au GP de France 1979 sur la RS10.", rel: ["renault-r25-f1"] }),
    X("renault-r25-f1", R, "R25 / R26 (F1 titres 2005 - 2006)", "Supercar", "2005 - 2006", "R:R", "Les F1 championnes du monde avec Fernando Alonso : V10 3.0 de 2005 (RS25) et V8 2.4 de 2006 (RS26).",
      [["R25 (2005)", "V10 3.0 de 2005, 900 ch.", ["3.0 V10 RS25|900|0|340|2.5|Séquentielle 7|RS25"]], ["R26 (2006)", "V8 2.4 de 2006, 750 ch.", ["2.4 V8 RS26|750|0|340|2.6|Séquentielle 7|RS26"]]],
      { h: "Fernando Alonso est champion du monde 2005 et 2006 avec Renault F1, qui remporte aussi les deux titres constructeurs. Le moteur V8 de 2006 est le dernier à être sacré en F1 avant les années du moteur gelé.", rel: ["renault-rs01"] }),
    X("renault-megane-trophy-v6", R, "Mégane Trophy V6 / Clio V6 Trophy / Sport Spider Trophy", "Supercar", "1996 - 2007", "M:R", "Les monotypes Renault Sport : Spider Trophy (1996), Clio V6 Trophy (2000), Mégane Trophy V6 (2005).",
      [["Spider Trophy (1996 - 1999)", "2.0 16V de 150 ch.", ["2.0 L4 16V|150|0|200|0|Manuelle 5|F7R"]], ["Clio V6 Trophy (2000 - 2002)", "V6 3.0 de 230 ch.", ["3.0 V6 24V|230|300|220|0|Manuelle 6|ES9J4S"]], ["Mégane Trophy V6 (2005 - 2007)", "V6 3.5 de 400 ch.", ["3.5 V6 Nissan VQ35|400|0|260|0|Manuelle 6|VQ35"]]],
      { h: "Renault Sport organise le Spider Trophy (1996), le Clio V6 Trophy (2000) et la World Series by Renault. La Mégane Trophy V6 est équipée du V6 Nissan de 3.5 litres.", rel: ["renault-spider", "renault-clio-v6"] }),
    X("renault-clio-cup", R, "Clio Cup / R5 Cup / Clio Cup Rally", "Supercar", "1991 - ...", "T:R", "Les monotypes Clio Cup et leur ancêtre R5 Cup, où sont nés de nombreux pilotes.",
      [["Clio Cup (1991 - ...)", "2.0 16V de 170 ch (Clio II Cup) à 1.6 TCe de 220 ch.", ["R5 Turbo Cup 1.4 turbo|160|0|0|0|Manuelle 5|C1J", "Clio Cup 2.0 16V|170|0|0|0|Séquentielle 6|F4R", "Clio Cup 1.6 turbo|220|0|0|0|Séquentielle 6|M5M", "Clio Cup 1.6 turbo (Rally)|220|0|0|0|Séquentielle 6|M5M"]]],
      { h: "La Coupe Renault est une formule de promotion devenue mondiale. Des pilotes comme Kimi Räikkönen, Sebastian Loeb ou Jean-Éric Vergne ont été formés dans ces monotypes. La Clio Cup rallye est aussi un tremplin.", rel: ["renault-clio-williams-16s"] })
  ]);
})();
