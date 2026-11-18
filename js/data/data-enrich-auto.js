/** MOTORAUTO — palmarès dérivés des fiches : pour toute voiture sans record, résume ses meilleures performances. */
(function () {
  "use strict";
  if (typeof MOTORAUTO_DATABASE === "undefined") return;
  MOTORAUTO_DATABASE.forEach((c) => {
    if (!c || (c.records && c.records.length)) return;
    const engs = (c.phases || []).reduce((a, p) => a.concat(p.engines || []), []);
    if (!engs.length) return;
    const best = engs.reduce((b, e) => ((e.power || 0) > (b.power || 0) ? e : b), engs[0]);
    const fastest = engs.filter((e) => e.zeroToHundred > 0).reduce((b, e) => (!b || e.zeroToHundred < b.zeroToHundred ? e : b), null);
    const top = engs.filter((e) => e.speed > 0).reduce((b, e) => (!b || e.speed > b.speed ? e : b), null);
    c.records = c.records || [];
    if (best && best.power) c.records.push({ type: "Puissance maximale", description: `${best.power} ch (${best.name})${best.torque ? ", " + best.torque + " Nm" : ""}.` });
    if (fastest) c.records.push({ type: "Accélération", description: `0 à 100 km/h en ${String(fastest.zeroToHundred).replace(".", ",")} s (${fastest.name}).` });
    if (top) c.records.push({ type: "Vitesse maximale", description: `${top.speed} km/h (${top.name}).` });
    if (c.years) {
      const y = String(c.years).trim(), mm = y.match(/^(\d{4})\s*[-–]\s*(\d{4})$/), one = /^\d{4}$/.test(y), open = y.match(/^(\d{4})\s*[-–]\s*\D/);
      const txt = one ? "en " + y : mm ? "de " + mm[1] + " à " + mm[2] : open ? "depuis " + open[1] : null;
      if (txt) c.records.push({ type: "Production", description: "Commercialisée " + txt + "." });
    }
  });
})();
