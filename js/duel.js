/**
 * MOTORAUTO — mode duel : course animée 0-100 km/h ou 400 m départ arrêté entre deux fiches,
 * + courbes de couple/puissance estimées dans le comparateur.
 * Tout est calculé à partir des vraies données (puissance, poids, 0-100) : les temps au 400 m et les courbes sont des ESTIMATIONS.
 */
(function () {
  "use strict";
  let C = null, raf = 0, mode = "100", A = null, B = null;
  const nf = (n, d) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const bestEngine = (c) => c.phases.flatMap((p) => p.engines).reduce((m, e) => (!m || e.power > m.power ? e : m), null) || { power: c.stats.power, torque: 0, name: "", zeroToHundred: c.stats.zero };

  /** profil de performance d'une fiche : temps au 100 et au 400 m */
  function profile(car) {
    const e = bestEngine(car), x_ = window.MAExtra ? window.MAExtra.carExtra(car) : { kg: 1300, est: true };
    const hp = Math.max(30, car.stats.power || e.power || 80);
    const et = 6.29 * Math.pow((x_.kg * 2.2046) / (hp * 0.9863), 1 / 3);
    const t0 = car.stats.zero > 0 ? car.stats.zero : (e.zeroToHundred > 0 ? e.zeroToHundred : Math.max(3, et * 0.42));
    const T = Math.max(et, t0 * 1.25 + 1);
    // phase 1 : v = 27,78·(t/t0)^q (arrive à 100 km/h pile à t0) ; phase 2 : l'accélération s'atténue jusqu'à la ligne des 400 m
    const V0 = 100 / 3.6, q = 0.85, r = 0.8, x0 = (V0 * t0) / (q + 1);
    let Tm = T, vT = V0 + (r + 1) * ((400 - x0) / (Tm - t0) - V0);
    if (vT < V0) { vT = V0; Tm = t0 + (400 - x0) / V0; }
    const x = (t) => (t <= 0 ? 0 : t <= t0 ? (V0 * t0 / (q + 1)) * Math.pow(t / t0, q + 1)
      : t <= Tm ? x0 + V0 * (t - t0) + ((vT - V0) * (Tm - t0) / (r + 1)) * Math.pow((t - t0) / (Tm - t0), r + 1)
      : 400 + (t - Tm) * vT);
    const v = (t) => 3.6 * (t <= 0 ? 0 : t <= t0 ? V0 * Math.pow(t / t0, q) : t <= Tm ? V0 + (vT - V0) * Math.pow((t - t0) / (Tm - t0), r) : vT);
    return { car, t0, T: Tm, kg: x_.kg, est: x_.est, hp, x, v };
  }
  const d100 = (P) => P.x(P.t0);

  // ------------------------------------------------------------------ page duel
  function picker(id, sel) {
    return `<label class="duel-pick"><span>Voiture ${id === "da" ? "A" : "B"}</span><select id="${id}" class="custom-select" aria-label="Voiture ${id === "da" ? "A" : "B"}">${C.cars.slice().sort((a, b) => (a.brand + a.model).localeCompare(b.brand + b.model, "fr")).map((c) => `<option value="${C.esc(c.id)}" ${c.id === sel ? "selected" : ""}>${C.esc(c.brand + " " + c.model)}</option>`).join("")}</select></label>`;
  }
  function lane(P, idx) {
    const c = P.car;
    return `<div class="duel-lane" data-lane="${idx}"><div class="duel-car" id="dc${idx}"><img src="${C.esc(C.safeUrl(c.image) || "")}" alt="" data-fallback="car" draggable="false"><span class="duel-flag">${C.esc(c.brand)} ${C.esc(String(c.model).replace(/\s*\(.*$/, ""))}</span></div><span class="duel-line" aria-hidden="true"></span></div>`;
  }
  function renderDuel(a, b) {
    const root = document.getElementById("duel-root"); if (!root) return;
    cancelAnimationFrame(raf);
    const ca = C.carsById.get(a) || C.cars[0], cb = C.carsById.get(b) || C.cars[1];
    A = profile(ca); B = profile(cb);
    root.innerHTML = `<div class="duel-controls">${picker("da", ca.id)}<span class="duel-vs">VS</span>${picker("db", cb.id)}
        <div class="seg-switch" role="group" aria-label="Épreuve"><button type="button" class="seg-btn ${mode === "100" ? "active" : ""}" data-dmode="100">0 → 100 km/h</button><button type="button" class="seg-btn ${mode === "400" ? "active" : ""}" data-dmode="400">400 m D.A.</button></div></div>
      <div class="duel-track" id="duel-track" aria-label="Piste de course">${lane(A, 0)}${lane(B, 1)}</div>
      <div class="duel-hud"><div id="dh0"><b>0</b><small>km/h</small></div><div class="duel-clock" id="duel-clock">0,00 s</div><div id="dh1"><b>0</b><small>km/h</small></div></div>
      <div class="duel-actions"><button type="button" class="cta-btn fill-btn" id="duel-go">🏁 Lancer la course</button><button type="button" class="cta-btn btn-ghost" id="duel-share" hidden>Partager le résultat</button></div>
      <div id="duel-result" class="duel-result" aria-live="polite"></div>
      <div class="duel-table">${row("Puissance", ca.stats.power + " ch", cb.stats.power + " ch")}${row("Poids", nf(A.kg) + " kg" + (A.est ? " ≈" : ""), nf(B.kg) + " kg" + (B.est ? " ≈" : ""))}${row("Poids / puissance", nf(A.kg / A.hp, 1) + " kg/ch", nf(B.kg / B.hp, 1) + " kg/ch")}${row("0 → 100 km/h", nf(A.t0, 1) + " s", nf(B.t0, 1) + " s")}${row("400 m D.A. (estimé)", nf(A.T, 1) + " s", nf(B.T, 1) + " s")}</div>
      <p class="lap-meta">Le 0-100 vient des fiches ; le 400 m est estimé à partir du rapport poids/puissance, et les poids sont indicatifs. Résultat de simulation, pas de chrono officiel.</p>`;
    place(0);
  }
  const row = (l, x, y) => `<div class="duel-row"><span>${x}</span><b>${l}</b><span>${y}</span></div>`;
  function place(t) {
    const m = mode === "100" ? Math.max(d100(A), d100(B)) : 400;
    [A, B].forEach((P, i) => {
      const el = document.getElementById("dc" + i); if (!el) return;
      const frac = Math.min(1, P.x(t) / m);
      el.style.setProperty("--pos", frac);
      const h = document.querySelector("#dh" + i + " b"); if (h) h.textContent = Math.round(P.v(t));
    });
    const ck = document.getElementById("duel-clock"); if (ck) ck.textContent = nf(t, 2) + " s";
  }
  function run() {
    cancelAnimationFrame(raf);
    const goBtn = document.getElementById("duel-go"), res = document.getElementById("duel-result");
    res.textContent = ""; document.getElementById("duel-share").hidden = true;
    const tA = mode === "100" ? A.t0 : A.T, tB = mode === "100" ? B.t0 : B.T, end = Math.max(tA, tB);
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = reduced ? 8 : 1.6;           // un peu plus lent que le temps réel : on voit la course
    let t0 = null, countdown = 3;
    goBtn.disabled = true; place(0);
    const lights = document.getElementById("duel-clock");
    const tick = () => {
      if (countdown > 0) { lights.textContent = "🔴".repeat(4 - countdown) + "⚫".repeat(countdown - 1); countdown--; setTimeout(tick, reduced ? 50 : 650); return; }
      lights.textContent = "🟢 GO !";
      const step = (ts) => {
        if (t0 === null) t0 = ts;
        const t = Math.min(end, ((ts - t0) / 1000) * speed);
        place(t);
        if (t < end) raf = requestAnimationFrame(step); else finish(tA, tB);
      };
      raf = requestAnimationFrame(step);
    };
    tick();
  }
  let last = null;
  function finish(tA, tB) {
    document.dispatchEvent(new CustomEvent("ma:duel-done"));
    const res = document.getElementById("duel-result"), btn = document.getElementById("duel-go");
    btn.disabled = false; btn.textContent = "↻ Rejouer";
    const win = tA === tB ? -1 : tA < tB ? 0 : 1, gap = Math.abs(tA - tB);
    const nm = (P) => P.car.brand + " " + String(P.car.model).replace(/\s*\(.*$/, "");
    // distance qui sépare les voitures quand la gagnante franchit la ligne
    const tw = Math.min(tA, tB), gapM = Math.abs(A.x(tw) - B.x(tw)), end = mode === "100" ? "à 100 km/h" : "sur 400 m";
    last = { a: A.car, b: B.car, tA, tB, win, mode };
    res.innerHTML = win < 0 ? `<b>Égalité parfaite !</b> ${nf(tA, 2)} s` : `<b>🏆 ${C.esc(nm(win === 0 ? A : B))}</b> gagne ${end} avec <b>${nf(gap, 2)} s</b> d'avance (≈ ${nf(gapM, 0)} m)<br><small>${nf(tA, 2)} s contre ${nf(tB, 2)} s</small>`;
    document.getElementById("duel-share").hidden = false;
    document.getElementById("duel-clock").textContent = nf(Math.max(tA, tB), 2) + " s";
  }
  function shareResult() {
    if (!last || !window.MAShare) return;
    window.MAShare.duelImage(last);
  }

  // ------------------------------------------------------------------ comparateur : courbes estimées
  function curve(car) {
    const e = bestEngine(car), n = [];
    const turbo = /turbo|tdi|tfsi|tsi|\bt\b|gti? ?t|bi-?turbo|compress|kompressor|vtec turbo|ecoboost|sti|evo/i.test((e.name || "") + " " + (car.model || ""));
    const pk = turbo ? 0.78 : 0.88, tpk = turbo ? 0.38 : 0.66;
    const tq = e.torque > 0 ? e.torque : (e.power * 7120) / (pk * 6500);
    for (let i = 0; i <= 40; i++) {
      const r = 0.12 + (i / 40) * 0.88;
      let s = turbo ? (r < tpk ? 0.55 + 0.45 * Math.pow((r - 0.12) / (tpk - 0.12), 0.6) : 1 - 0.55 * Math.pow((r - tpk) / (1 - tpk), 1.7))
        : (r < tpk ? 0.62 + 0.38 * Math.pow((r - 0.12) / (tpk - 0.12), 1.2) : 1 - 0.32 * Math.pow((r - tpk) / (1 - tpk), 1.5));
      n.push({ r, t: tq * Math.max(0.2, s) });
    }
    const maxP = Math.max(...n.map((q) => q.t * q.r));
    n.forEach((q) => { q.p = e.power > 0 ? (q.t * q.r / maxP) * e.power : 0; });
    return n;
  }
  function curvesSvg(cars, key, unit) {
    const cs = cars.map(curve), max = Math.max(...cs.flatMap((c) => c.map((q) => q[key]))) * 1.08 || 1;
    const W = 520, H = 250, L = 44, B_ = 30, T = 12, R = 12, COL = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#14b8a6"];
    const X = (r) => L + ((r - 0.12) / 0.88) * (W - L - R), Y = (v) => H - B_ - (v / max) * (H - B_ - T);
    const step = max > 600 ? 200 : max > 300 ? 100 : max > 120 ? 50 : 20;
    const grid = []; for (let v = 0; v <= max; v += step) grid.push(`<line class="cc-grid" x1="${L}" y1="${Y(v)}" x2="${W - R}" y2="${Y(v)}"/><text class="cc-tick" x="${L - 6}" y="${Y(v)}" text-anchor="end" dominant-baseline="middle">${v}</text>`);
    const lines = cs.map((c, i) => `<polyline fill="none" stroke="${COL[i % COL.length]}" stroke-width="2.4" stroke-linejoin="round" points="${c.map((q) => X(q.r).toFixed(1) + "," + Y(q[key]).toFixed(1)).join(" ")}"/>`).join("");
    return `<svg class="cc-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de ${unit === "Nm" ? "couple" : "puissance"} estimée">${grid.join("")}${lines}<text class="cc-axis" x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">Régime (du ralenti à la zone rouge)</text><text class="cc-axis" transform="translate(11 ${(T + H - B_) / 2}) rotate(-90)" text-anchor="middle">${unit}</text></svg>`;
  }
  function compareExtras(cars) {
    const box = document.getElementById("cmp-extra"); if (!box) return;
    const ps = cars.map(profile);
    const legend = cars.map((c, i) => `<span class="cc-key"><i style="background:${["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#14b8a6"][i % 6]}"></i>${C.esc(c.brand + " " + c.model)}</span>`).join("");
    box.innerHTML = `<section class="cmp-charts"><div class="cc-legend">${legend}</div>
      <div class="cc-row"><figure class="cc-card cc-wide"><figcaption>Couple <small>(courbe estimée à partir du couple max)</small></figcaption>${curvesSvg(cars, "t", "Nm")}</figure>
      <figure class="cc-card cc-wide"><figcaption>Puissance <small>(courbe estimée)</small></figcaption>${curvesSvg(cars, "p", "ch")}</figure></div>
      <div class="cmp-race-bar">${cars.length === 2 ? `<a class="cta-btn fill-btn compact-btn" href="#/duel/${encodeURIComponent(cars[0].id)}/${encodeURIComponent(cars[1].id)}" data-close-compare>🏁 Lancer le duel</a>` : `<span class="lap-meta">Le duel se lance avec deux voitures.</span>`}
        <span class="lap-meta">0-100 le plus rapide : <b>${C.esc(ps.slice().sort((x, y) => x.t0 - y.t0)[0].car.model)}</b> · meilleur rapport poids/puissance : <b>${C.esc(ps.slice().sort((x, y) => x.kg / x.hp - y.kg / y.hp)[0].car.model)}</b></span></div></section>`;
  }

  window.MADuel = { profile };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("duel", { enter: (p) => {
      let a = p.a, b = p.b;
      if (!a || !b) { const ids = JSON.parse((function () { try { return localStorage.getItem("motorauto_compare") || "[]"; } catch (_) { return "[]"; } })()).filter((id) => ctx.carsById.has(id)); a = ids[0] || ctx.cars[0].id; b = ids[1] || ctx.cars[1].id; }
      renderDuel(a, b);
    } });
    document.addEventListener("ma:compare-opened", (e) => compareExtras(e.detail.cars));
    document.addEventListener("click", (e) => {
      const m = e.target.closest("[data-dmode]");
      if (m) { mode = m.dataset.dmode; renderDuel(document.getElementById("da").value, document.getElementById("db").value); return; }
      if (e.target.closest("#duel-go")) { run(); return; }
      if (e.target.closest("#duel-share")) { shareResult(); return; }
      if (e.target.closest("[data-close-compare]")) { const b = document.getElementById("close-compare-modal"); if (b) b.click(); }
    });
    document.addEventListener("change", (e) => {
      if (e.target.id === "da" || e.target.id === "db") ctx.Router.go({ name: "duel", params: { a: document.getElementById("da").value, b: document.getElementById("db").value } });
    });
    document.addEventListener("ma:route", (e) => { if (e.detail.name !== "duel") cancelAnimationFrame(raf); });
  });
})();
