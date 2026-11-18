/** MOTORAUTO — V-Max et 0-100 km/h manquants (voitures de course et anciennes : valeurs arrondies, indicatives). */
(function () {
  "use strict";
  if (typeof MAKIT === "undefined") return;
  const m = {};
  // id: { indexMoteur: [couple, vmax, 0-100] } (0 = ne pas toucher)
  const D = {
    "alfa-romeo-155-v6-ti-dtm": { 0: [0, 0, 3.3] }, "alfa-romeo-giulia-tz": { 0: [0, 0, 9] }, "alfa-romeo-8c-2300-le-mans": { 0: [0, 0, 11] },
    "alpine-a106": { 1: [0, 0, 30] }, "alpine-a220": { 0: [0, 0, 3.2] },
    "audi-sport-quattro-s1-e2": { 1: [0, 250, 2.8] }, "audi-v8-quattro-dtm": { 0: [0, 0, 3.6] },
    "bmw-328-roadster": { 0: [0, 0, 12], 1: [0, 0, 6.5] }, "bmw-m3-e36": { 3: [0, 0, 4.3] }, "bmw-m3-e46": { 3: [0, 300, 4] },
    "bmw-m1": { 1: [0, 0, 4.5] }, "bmw-m3-e30-dtm": { 0: [0, 250, 4.8], 1: [0, 270, 4.2] }, "bmw-m3-gtr-e46": { 0: [0, 0, 3.8] },
    "bmw-m3-gt2-e92": { 0: [0, 0, 3.3], 1: [0, 0, 3.5] }, "bmw-m6-gt3": { 0: [0, 0, 3.2] }, "bmw-m4-gt3": { 0: [0, 0, 3.1] }, "bmw-m8-gte": { 0: [0, 0, 3.2] },
    "bmw-320-e21-groupe5": { 0: [0, 0, 4.6] },
    "mb-190e-dtm": { 0: [0, 270, 4.8] }, "mb-clk-dtm": { 0: [0, 300, 3.4] }, "mb-ssk": { 0: [0, 0, 8] }, "mb-540k": { 0: [0, 0, 20], 1: [0, 0, 17], 2: [0, 0, 15] },
    "mb-w125": { 0: [0, 0, 4.5] }, "mb-w196": { 0: [0, 0, 5] }, "mb-300-slr": { 0: [0, 0, 6.5] }, "mb-170v": { 0: [0, 0, 35] }, "mb-220-ponton": { 0: [0, 0, 22] },
    "mb-300-adenauer": { 0: [0, 0, 16], 1: [0, 0, 12] }, "mb-c111": { 0: [0, 0, 6.5], 1: [0, 0, 4.9], 2: [0, 0, 8], 3: [0, 0, 7], 4: [0, 0, 7] },
    "mb-amg-gt3": { 0: [0, 0, 3.5], 1: [0, 0, 3.3], 2: [0, 0, 3.9], 3: [0, 0, 3.2] }, "mb-sprinter": { 0: [0, 0, 15], 1: [0, 0, 11.5], 2: [0, 0, 9.5], 3: [0, 0, 18] },
    "mb-eqxx": { 0: [0, 0, 8] }, "mb-c-dtm-94": { 0: [0, 300, 3.5] }, "mb-450-slc-rallye": { 0: [0, 220, 7] }, "mb-g-dakar": { 0: [0, 0, 17] }, "mb-amg-c63-dtm": { 0: [0, 300, 3.3] },
    "rally-mini-cooper-s": { 0: [0, 0, 11.5], 1: [0, 0, 11], 2: [0, 0, 10.5], 3: [0, 0, 8.5] },
    "rally-ford-escort-rs1800": { 2: [0, 190, 0] }, "rally-celica-st165": { 1: [0, 220, 0] }, "rally-subaru-legacy-rs": { 1: [0, 220, 0] },
    "rally-subaru-impreza-gc8": { 3: [0, 220, 0], 4: [0, 220, 0] }, "rally-subaru-impreza-gd": { 3: [0, 220, 0] }, "rally-galant-vr4": { 1: [0, 220, 0] },
    "rally-208-r2": { 0: [0, 0, 7] }, "rally-208-rally4": { 0: [0, 0, 7.2] }, "rally-ibiza-kit-car": { 0: [0, 220, 5.5] }, "rally-mini-all4-racing": { 0: [0, 180, 0] },
    "rally-c2-s1600": { 0: [0, 190, 5.2] }, "rally-c2-r2": { 0: [0, 0, 7.2] }, "rally-fiesta-r2t": { 0: [0, 0, 7.5] }, "rally-fiesta-rally4": { 0: [0, 0, 7.2] }, "rally-fiesta-rally3": { 0: [0, 0, 5] },
    "rally-opel-adam-r2": { 0: [0, 0, 7.5] }, "rally-opel-corsa-rally4": { 0: [0, 0, 8] }, "rally-opel-corsa-rally-e": { 0: [0, 0, 7.9] },
    "rally-clio-r3": { 0: [0, 0, 7.4], 1: [0, 0, 6], 2: [0, 0, 5.3], 3: [0, 0, 8.5] },
    "rally-s2000-punto": { 0: [0, 220, 0] }, "rally-abarth-124-rally": { 0: [0, 210, 0] }, "rally-lancer-evo-r4": { 0: [0, 230, 0] }, "rally-lancer-evo-x-r4": { 0: [0, 230, 0] },
    "rally-porsche-911-rs": { 0: [0, 230, 0] }, "rally-porsche-911-sc-safari": { 0: [0, 200, 0] }, "rally-lancia-beta-monte-carlo": { 1: [0, 300, 0] },
    "renault-4cv": { 2: [0, 0, 35] }, "renault-trafic": { 3: [0, 0, 15] }, "renault-rs01": { 0: [0, 0, 3.6] },
    "renault-megane-trophy-v6": { 0: [0, 0, 8], 1: [0, 0, 6.3], 2: [0, 0, 4.8] },
    "renault-clio-cup": { 0: [0, 200, 6.8], 1: [0, 210, 6.5], 2: [0, 215, 6], 3: [0, 215, 6] }
  };
  Object.keys(D).forEach((id) => { const arr = []; Object.keys(D[id]).forEach((k) => { arr[Number(k)] = D[id][k]; }); m[id] = { ap: true, e: arr }; });
  MAKIT.enrich(m);
})();
