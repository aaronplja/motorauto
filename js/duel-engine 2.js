/**
 * MOTORAUTO — moteur de duel (simulation physique en ligne droite).
 * Entrées (par voiture) : puissance, poids, transmission (F/R/A/M), vitesse maxi, 0-100 publié, année, catégorie.
 * Modèle : puissance moteur selon le régime, rapports de boîte (nombre et étagement estimés), temps de passage
 * (manuelle / double embrayage / séquentielle), limite d'adhérence (répartition du poids, transfert de charge, pneus,
 * sol sec ou mouillé), traînée aérodynamique calée sur la vitesse maxi publiée, résistance au roulement.
 * Le 0-100 publié sert de calage (la puissance « utile » est ajustée) ; tout le reste est une ESTIMATION.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MADuelEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const G = 9.81, RHO = 1.2, KMH = 3.6, HP = 735.5;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ------------------------------------------------------------ données déduites
  function firstYear(years) { const m = String(years || "").match(/(19|20)\d{2}/); return m ? Number(m[0]) : 2000; }
  const isTurbo = (name) => /turbo|tdi|tfsi|tsi|\bt\b|gti? ?t|bi-?turbo|compress|kompressor|ecoboost|sti|evo|gt-?r|\brs\b|cosworth|twin/i.test(name || "");

  /** spec = { hp, kg, drive, vmax, zero, year, category, turbo, name } → réglages physiques */
  function build(spec, opt) {
    opt = opt || {};
    const year = spec.year || 2000, cat = spec.category || "Coupé";
    const hp = Math.max(30, spec.hp || 100);
    const lemans = cat === "Le Mans";
    const super_ = cat === "Supercar" || hp > 380;
    const drive = spec.drive || (lemans ? "M" : cat === "Berline" || cat === "Break" ? "F" : "R");
    const kg = Math.max(450, spec.kg || 1250) + (opt.load != null ? opt.load : 80);        // pilote + plein
    const turbo = spec.turbo != null ? spec.turbo : isTurbo(spec.name);
    // boîte : nombre de rapports, temps de passage
    let gears = year < 1985 ? 4 : year < 2000 ? 5 : 6;
    if (hp < 90 && year < 1995) gears = Math.min(gears, 5);
    if (super_ || lemans) gears = Math.max(gears, 6);
    if (lemans && year >= 1990) gears = 6;
    let shift = 0.42, shiftKind = "manuelle";
    if (lemans && year >= 1985) { shift = 0.07; shiftKind = "séquentielle"; }
    else if (lemans) { shift = 0.3; shiftKind = "manuelle"; }
    else if (super_ && year >= 2008) { shift = 0.1; gears = Math.max(gears, 7); shiftKind = "double embrayage"; }
    else if (year >= 2012 && hp >= 250) { shift = 0.2; shiftKind = "rapide"; }
    else if (year < 1985) shift = 0.5;
    if (opt.driver === "amateur") shift *= 1.45; else if (opt.driver === "pro") shift *= 0.8;
    // adhérence
    let mu = lemans ? (year >= 1965 ? 1.55 : 0.95) : year < 1975 ? 0.82 : year < 1990 ? 0.95 : 1.05;
    if (/type[- ]?r|gta|rs\b|cup|gt3|gt-r|s16|s1600|sport|wrc|kit/i.test(spec.name || "")) mu += 0.06;
    const wet = opt.surface === "wet";
    const launchSkill = opt.driver === "amateur" ? 0.9 : opt.driver === "pro" ? 1.0 : 0.96;
    const f0 = { F: 0.62, R: 0.5, A: 0.5, M: 0.42 }[drive] != null ? ({ F: 0.62, R: 0.5, A: 0.5, M: 0.58 })[drive] : 0.55;
    const eta = drive === "A" ? 0.83 : lemans ? 0.92 : 0.88;
    const crr = year < 1990 ? 0.014 : 0.012;
    return { wetFactor: lemans ? 0.52 : 0.6, hp, kg, drive, vmaxPub: spec.vmax > 0 ? spec.vmax / KMH : 0, zeroPub: spec.zero > 0 ? spec.zero : 0, year, cat, lemans, super_, gears, shift, shiftKind, mu, wet, launchSkill, f0, eta, crr, turbo, kt: lemans ? 0.14 : 0.19, kappa: 1 };
  }

  // forme de la courbe de puissance (1 au maximum) selon r = régime / régime maxi
  function pShape(r, turbo) {
    // puissance relative (1 = maximum) selon r = régime / régime maxi ; pic à ~85 % (atmo) ou ~70 % (turbo)
    r = clamp(r, 0.1, 1.05);
    const pk = turbo ? 0.72 : 0.86, lo = turbo ? 0.5 : 0.28;
    let s;
    if (r <= pk) s = lo + (1 - lo) * Math.pow(r / pk, turbo ? 0.8 : 1.15);
    else s = 1 - (turbo ? 0.28 : 0.2) * Math.pow((r - pk) / (1.05 - pk), 1.4);
    return clamp(s * (turbo ? 1 : 1) * (r / Math.max(r, 0.1)) * Math.min(1, r / 0.1), 0, 1);
  }

  // ------------------------------------------------------------ aérodynamique calée sur la vitesse maxi
  function calibrateAero(P) {
    const m = P.kg;
    const wFull = P.hp * HP * P.eta;
    if (P.vmaxPub > 0) {
      const rv = clamp(P.vmaxPub / (P.vmaxPub * 1.05), 0.5, 1);
      const pv = pShape(rv, P.turbo) * wFull;
      let cda = (2 * (pv - P.crr * m * G * P.vmaxPub)) / (RHO * Math.pow(P.vmaxPub, 3));
      P.cda = clamp(cda, 0.42, 1.15);
      P.vmax = P.vmaxPub;
    } else {
      P.cda = P.lemans ? 0.62 : P.super_ ? 0.62 : P.cat === "Berline" || P.cat === "Break" ? 0.7 : 0.66;
      // vitesse maxi estimée : équilibre puissance / traînée
      let v = 30; for (let i = 0; i < 80; i++) { const r = clamp(v / (v * 1.05), 0.5, 1); const pw = pShape(r, P.turbo) * wFull; v = Math.cbrt(Math.max(1, (pw - P.crr * m * G * v) / (0.5 * RHO * P.cda))); }
      P.vmax = clamp(v, 25, 120);
    }
    return P;
  }

  // vitesses atteintes au régime maxi dans chaque rapport (progression géométrique)
  function gearSpeeds(P) {
    const n = P.gears, vTop = P.vmax * 1.06;
    const first = vTop * (n >= 7 ? 0.185 : n === 6 ? 0.22 : n === 5 ? 0.27 : 0.34);
    const out = [];
    for (let i = 0; i < n; i++) out.push(first * Math.pow(vTop / first, n === 1 ? 0 : i / (n - 1)));
    return out;
  }

  // ------------------------------------------------------------ simulation
  /** simule jusqu'à `stop(v,x,t)` ; renvoie les échantillons (temps, distance, vitesse, rapport, régime) et les jalons */
  function run(P, until) {
    until = until || { dist: 1000 };
    const vg = gearSpeeds(P), n = vg.length, m = P.kg, wFull = P.hp * HP * P.eta * P.kappa;
    const dt = 0.004, out = { t: [], x: [], v: [], g: [], r: [], marks: {}, shifts: [] };
    let t = 0, x = 0, v = 0, g = 0, shiftLeft = 0, nextG = 0, rev0 = P.turbo ? 0.5 : 0.58;
    const vLaunch = vg[0] * rev0;
    const marks = out.marks, tgt = [[100, "t100"], [200, "t200"]];
    let sample = 0, lastV = 0, lastX = 0;
    const drag = (vv) => 0.5 * RHO * P.cda * vv * vv + P.crr * m * G;
    for (let step = 0; step < 60 / dt; step++) {
      let F = 0, r;
      if (shiftLeft > 0) { shiftLeft -= dt; r = clamp(v / vg[g], 0.1, 1); if (shiftLeft <= 0) g = nextG; }
      else {
        r = v / vg[g];
        // passage au rapport supérieur quand il donne plus de force (ou au régime maxi)
        if (g < n - 1) {
          const rNext = v / vg[g + 1];
          const better = rNext >= 0.42 && (pShape(rNext, P.turbo) > pShape(Math.min(r, 1.0), P.turbo) * 1.0 || r >= 0.995);
          if (better || r >= 1) { nextG = g + 1; shiftLeft = P.shift; out.shifts.push(+t.toFixed(2)); }
        }
        if (shiftLeft <= 0) {
          let pw;
          if (v < vLaunch) pw = pShape(rev0, P.turbo) * wFull * (v / vLaunch) * 0 + pShape(rev0, P.turbo) * wFull; // glissement d'embrayage : couple au régime de départ
          else pw = pShape(Math.min(r, 1), P.turbo) * wFull;
          F = v < vLaunch ? pw / vLaunch : pw / Math.max(v, 1);
          if (v >= vg[g] * 1.0 && g === n - 1) F = Math.min(F, drag(v));                // régime maxi en dernière
          if (P.vmaxPub > 0 && v >= P.vmaxPub) F = Math.min(F, drag(v));
        }
      }
      // limite d'adhérence
      const D = drag(v), s = P.drive === "F" ? -1 : P.drive === "A" ? 0 : 1;
      const mu = P.mu * P.launchSkill * (P.muBoost || 1);
      let Fmax = P.drive === "A" ? mu * m * G * 0.97 : (mu * m * G * P.f0 - s * mu * P.kt * D) / (1 - s * mu * P.kt);
      Fmax = Math.max(0, Fmax);
      F = Math.min(F, Fmax);
      const a = (F - D) / m;
      v = Math.max(0, v + a * dt);
      x += v * dt; t += dt;
      // échantillonnage (50 Hz)
      sample += dt;
      if (sample >= 0.02) { sample = 0; out.t.push(+t.toFixed(3)); out.x.push(x); out.v.push(v); out.g.push(g + 1); out.r.push(shiftLeft > 0 ? Math.max(0.35, r * 0.7) : clamp(r, 0, 1)); }
      for (const [kmh, key] of tgt) if (marks[key] == null && v * KMH >= kmh) marks[key] = t - dt * (v * KMH - kmh) / Math.max(0.01, (v - lastV) * KMH);
      if (marks.t400 == null && x >= 400) { marks.t400 = t - dt * (x - 400) / Math.max(0.01, v * dt); marks.v400 = v * KMH; }
      if (marks.t1000 == null && x >= 1000) { marks.t1000 = t - dt * (x - 1000) / Math.max(0.01, v * dt); marks.v1000 = v * KMH; }
      lastV = v; lastX = x;
      if (until.kmh && v * KMH >= until.kmh) break;
      if (until.dist && x >= until.dist) break;
      if (t > 45 && v < 1) break;
    }
    marks.vEnd = v * KMH;
    return out;
  }

  function P_wet(opt) { return !!(opt && opt.surface === "wet"); }

  /** construit la voiture : aérodynamique, puis calage de la puissance utile sur le 0-100 publié */
  function make(spec, opt) {
    const P = calibrateAero(build(spec, opt)), wet = P_wet(opt);
    P.calibrated = false;
    if (P.zeroPub > 0) {
      const t100 = () => { const o = run(P, { kmh: 100 }); return o.marks.t100 != null ? o.marks.t100 : 99; };
      const bis = (key, lo, hi) => { for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; P[key] = mid; if (t100() > P.zeroPub) lo = mid; else hi = mid; } P[key] = (lo + hi) / 2; };
      P.kappa = 1; P.muBoost = 1;
      if (Math.abs(t100() - P.zeroPub) < 0.05) P.calibrated = true;
      else {
        // 1) puissance utile (±25 %), 2) à défaut adhérence (lancement optimisé, pneus), le 0-100 publié est un meilleur cas
        bis("kappa", 0.8, 1.25);
        if (t100() - P.zeroPub > 0.15) { P.kappa = 1.25; bis("muBoost", 1, 1.7); }
        P.calibrated = Math.abs(t100() - P.zeroPub) < 0.3;
      }
    }
    if (wet) { P.mu *= P.wetFactor; P.wet = true; }
    return P;
  }

  /** résultat complet d'une voiture : échantillons jusqu'à 1000 m + jalons */
  function simulate(spec, opt) {
    const P = make(spec, opt), o = run(P, { dist: 1000 });
    const mk = o.marks;
    return { P, samples: o, t100: mk.t100, t200: mk.t200 || null, t400: mk.t400, v400: mk.v400, t1000: mk.t1000, v1000: mk.v1000, vmax: P.vmax * KMH, gears: P.gears, shiftKind: P.shiftKind, shifts: o.shifts, kappa: P.kappa, calibrated: P.calibrated, tractionKind: P.drive };
  }

  /** valeur interpolée des échantillons */
  function at(S, t) {
    const T = S.samples.t, n = T.length;
    if (!n) return { x: 0, v: 0, g: 1, r: 0.3 };
    if (t <= 0) return { x: 0, v: 0, g: 1, r: 0.3 };
    if (t >= T[n - 1]) return { x: S.samples.x[n - 1], v: S.samples.v[n - 1] * KMH, g: S.samples.g[n - 1], r: S.samples.r[n - 1] };
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (T[mid] <= t) lo = mid; else hi = mid; }
    const f = (t - T[lo]) / (T[hi] - T[lo] || 1), L = (a, b) => a + (b - a) * f;
    return { x: L(S.samples.x[lo], S.samples.x[hi]), v: L(S.samples.v[lo], S.samples.v[hi]) * KMH, g: S.samples.g[lo], r: L(S.samples.r[lo], S.samples.r[hi]) };
  }
  /** temps pour parcourir la distance d (ou atteindre la vitesse kmh) */
  function timeFor(S, kind) { return kind === "100" ? S.t100 : kind === "200" ? S.t200 : kind === "400" ? S.t400 : S.t1000; }

  return { simulate, at, timeFor, firstYear, isTurbo, build, run, make, KMH };
});
