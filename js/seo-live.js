/** MOTORAUTO — données structurées schema.org (Car + BreadcrumbList) injectées quand une fiche s'ouvre dans l'app (ADD-105).
 *  Les pages statiques voiture/<id>.html les ont déjà ; ceci couvre la navigation dans l'application. */
(function () {
  "use strict";
  const ID = "ma-ld-car";
  const clear = () => { const o = document.getElementById(ID); if (o) o.remove(); };
  function inject(car) {
    clear();
    const base = location.protocol.startsWith("http") ? location.origin : "https://motorauto.fr";
    const url = base + "/voiture/" + encodeURIComponent(car.id) + ".html", s = car.stats || {};
    const ld = [{
      "@context": "https://schema.org", "@type": "Car", name: car.brand + " " + car.model, brand: { "@type": "Brand", name: car.brand },
      model: String(car.model || ""), vehicleModelDate: String(car.years || ""), bodyType: car.category || undefined, url,
      image: /^https?:\/\//.test(car.image || "") ? car.image : undefined,
      vehicleEngine: s.power ? { "@type": "EngineSpecification", enginePower: { "@type": "QuantitativeValue", value: s.power, unitCode: "BHP" } } : undefined
    }, {
      "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: base + "/" },
        { "@type": "ListItem", position: 2, name: "Catalogue", item: base + "/catalogue" },
        { "@type": "ListItem", position: 3, name: car.brand + " " + car.model, item: url }]
    }];
    const sc = document.createElement("script"); sc.type = "application/ld+json"; sc.id = ID;
    sc.textContent = JSON.stringify(ld).replace(/</g, "\\u003c");
    document.head.appendChild(sc);
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    document.addEventListener("ma:car-rendered", (e) => { const c = e.detail && e.detail.car; if (c) inject(c); });
    document.addEventListener("ma:route", (e) => { if (!e.detail || e.detail.name !== "car") clear(); });
  });
})();
