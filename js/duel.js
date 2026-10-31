/**
 * MOTORAUTO — mode duel : recherche de deux voitures (catalogue, communauté, tes voitures), épreuve au choix
 * (0-100, 0-200, 400 m, 1000 m), sol sec ou mouillé, pilote. Le calcul vient de js/duel-engine.js (rapports de boîte,
 * adhérence, aérodynamique, poids). Tout est une ESTIMATION calée sur le 0-100 et la vitesse maxi publiés.
 */
(function () {
  "use strict";
  let C = null, raf = 0, st = { mode: "100", surface: "dry", driver: "normal", a: null, b: null }, SA = null, SB = null, comm = [];
  const E = () => window.MADuelEngine;
  const nf = (n, d) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const bestEngine = (c) => c.phases.flatMap((p) => p.engines).reduce((m, e) => (!m || e.power > m.power ? e : m), null) || { power: c.stats.power, torque: 0, name: "", zeroToHundred: c.stats.zero };
  const MODES = { "100": ["0 → 100 km/h", "t100"], "200": ["0 → 200 km/h", "t200"], "400": ["400 m D.A.", "t400"], "1000": ["1000 m D.A.", "t1000"] };
  const shortModel = (c) => String(c.model || "").replace(/\s*\(.*$/, "");
  const label = (c) => (c.brand ? c.brand + " " : "") + shortModel(c);

  // ------------------------------------------------------------------ fiches -> caractéristiques
  function specOf(car) {
    if (car._spec) return car._spec;
    const e = bestEngine(car), x_ = window.MAExtra ? window.MAExtra.carExtra(car) : { kg: 1300, est: true, drive: "R" };
    const sp = { hp: Math.max(30, car.stats.power || e.power || 80), kg: x_.kg, drive: x_.drive, est: x_.est, vmax: e.speed || (car.stats && car.stats.speed) || 0,
      zero: car.stats.zero > 0 ? car.stats.zero : (e.zeroToHundred > 0 ? e.zeroToHundred : 0), year: E().firstYear(car.years), category: car.category, name: (car.model || "") + " " + (e.name || "") };
    return sp;
  }
  /** voiture de la communauté -> pseudo-fiche du catalogue */
  function commToCar(d) {
    const num = (v) => { const m = String(v == null ? "" : v).replace(",", ".").match(/[\d.]+/); return m ? Number(m[0]) : 0; };
    const hp = num(d.power), zero = num(d.zero), year = Number(String(d.year || "").match(/\d{4}/)) || 2005;
    const spec = { hp: hp || 100, kg: hp > 0 ? Math.round(900 + hp * 1.1) : 1200, drive: "R", est: true, vmax: 0, zero, year, category: "Coupé", name: (d.name || "") + " " + (d.engine || "") };
    const name = String(d.name || "Voiture");
    return { id: "com-" + d.id, brand: d.pilot ? "@" + d.pilot : "Communauté", model: name, category: "Communauté", years: String(d.year || ""), image: (d.photos && d.photos[0]) || "", stats: { power: spec.hp, zero }, phases: [], community: true, _spec: spec };
  }
  const findCar = (id) => (C.carsById.get(id)) || comm.find((c) => c.id === id) || null;
  async function ensureComm() {
    try { const list = await (window.MAApp.loadCommunityOnce ? window.MAApp.loadCommunityOnce() : []); const mine = window.MAApp.getMyCars ? window.MAApp.getMyCars() : []; const seen = new Set(); comm = [...mine, ...list].filter((d) => d && !seen.has(d.id) && seen.add(d.id)).map(commToCar); } catch (_) { comm = []; }
  }

  /** profil de performance (compatible comparateur) */
  function profile(car) {
    const sp = specOf(car), S = E().simulate(sp, { surface: "dry" });
    return { car, t0: S.t100 || 0, T: S.t400 || 0, kg: sp.kg + 0, est: sp.est, hp: sp.hp, S };
  }

  // ------------------------------------------------------------------ recherche de voiture
  function openSheet(slot) {
    closeSheet();
    const wrap = document.createElement("div"); wrap.className = "duel-sheet"; wrap.id = "duel-sheet";
    wrap.innerHTML = `<div class="duel-sheet-box" role="dialog" aria-label="Choisir une voiture"><div class="duel-sheet-head"><input type="search" id="duel-q" placeholder="Rechercher une marque, un modèle, un pilote…" autocomplete="off" aria-label="Rechercher une voiture"><button type="button" class="icon-btn" data-sheet-close aria-label="Fermer">✕</button></div><div class="duel-sheet-list" id="duel-list"></div></div>`;
    document.body.appendChild(wrap);
    const input = wrap.querySelector("#duel-q"), list = wrap.querySelector("#duel-list");
    const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const all = () => [...comm, ...C.cars];
    const paint = () => {
      const q = norm(input.value).split(/\s+/).filter(Boolean);
      const res = all().filter((c) => !q.length || q.every((w) => norm(c.brand + " " + c.model + " " + c.years + " " + c.category).includes(w))).slice(0, 60);
      list.innerHTML = res.length ? res.map((c) => `<button type="button" class="duel-opt" data-pick="${C.esc(c.id)}"><img src="${C.esc(C.safeUrl(c.image) || "")}" alt="" loading="lazy" data-fallback="car"><span><b>${C.esc(label(c))}</b><small>${C.esc(c.years || "")} · ${c.stats.power || "?"} ch${c.community ? " · communauté" : ""}</small></span></button>`).join("") : `<p class="empty-note">Aucune voiture trouvée.</p>`;
    };
    input.addEventListener("input", paint); paint();
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap || e.target.closest("[data-sheet-close]")) { closeSheet(); return; }
      const p = e.target.closest("[data-pick]"); if (!p) return;
      st[slot] = p.dataset.pick; closeSheet(); go();
    });
    setTimeout(() => input.focus(), 50);
  }
  function closeSheet() { const s = document.getElementById("duel-sheet"); if (s) s.remove(); }
  function go() { C.Router.go({ name: "duel", params: { a: st.a, b: st.b } }); }

  // ------------------------------------------------------------------ page duel
  function slot(car, which, S) {
    const sp = specOf(car);
    return `<button type="button" class="duel-slot" data-slot="${which}" aria-label="Changer la voiture ${which === "a" ? "A" : "B"}"><span class="duel-slot-tag">${which === "a" ? "A" : "B"}</span><img src="${C.esc(C.safeUrl(car.image) || "")}" alt="" data-fallback="car" draggable="false"><b>${C.esc(label(car))}</b><small>${nf(sp.hp)} ch · ${nf(sp.kg)} kg${sp.est ? " ≈" : ""} · ${({ F: "traction", R: "propulsion", A: "4×4", M: "moteur central" })[sp.drive] || ""}</small><em>Changer</em></button>`;
  }
  const chips = (key, items, cur) => items.map(([v, l]) => `<button type="button" class="seg-btn ${cur === v ? "active" : ""}" data-opt="${key}" data-val="${v}">${l}</button>`).join("");
  function lane(car, idx) {
    return `<div class="duel-lane" data-lane="${idx}"><div class="duel-car" id="dc${idx}"><img src="${C.esc(C.safeUrl(car.image) || "")}" alt="" data-fallback="car" draggable="false"><span class="duel-flag">${C.esc(label(car))}</span></div><span class="duel-line" aria-hidden="true"></span></div>`;
  }
  const tm = (S) => S[MODES[st.mode][1]];
  async function render() {
    const root = document.getElementById("duel-root"); if (!root) return;
    cancelAnimationFrame(raf);
    const ca = findCar(st.a) || C.cars[0], cb = findCar(st.b) || C.cars[1];
    st.a = ca.id; st.b = cb.id;
    const opt = { surface: st.surface, driver: st.driver };
    SA = E().simulate(specOf(ca), opt); SB = E().simulate(specOf(cb), opt);
    root.innerHTML = `<div class="duel-pickers">${slot(ca, "a")}<span class="duel-vs">VS</span>${slot(cb, "b")}</div>
      <div class="duel-tools"><button type="button" class="btn-ghost compact-btn" id="duel-swap">⇄ Inverser</button><button type="button" class="btn-ghost compact-btn" id="duel-rand">🎲 Au hasard</button></div>
      <div class="duel-opts"><div class="seg-switch" role="group" aria-label="Épreuve">${chips("mode", Object.entries(MODES).map(([k, v]) => [k, v[0]]), st.mode)}</div>
        <div class="seg-switch" role="group" aria-label="Sol">${chips("surface", [["dry", "☀️ Sec"], ["wet", "🌧️ Mouillé"]], st.surface)}</div>
        <div class="seg-switch" role="group" aria-label="Pilote">${chips("driver", [["amateur", "Amateur"], ["normal", "Normal"], ["pro", "Pro"]], st.driver)}</div></div>
      <div class="duel-track" id="duel-track" aria-label="Piste de course">${lane(ca, 0)}${lane(cb, 1)}</div>
      <div class="duel-hud"><div id="dh0"><b>0</b><small>km/h</small><span class="duel-gear" id="dg0">N</span><i class="duel-rpm"><u id="dr0"></u></i></div><div class="duel-clock" id="duel-clock">0,00 s</div><div id="dh1"><b>0</b><small>km/h</small><span class="duel-gear" id="dg1">N</span><i class="duel-rpm"><u id="dr1"></u></i></div></div>
      <div class="duel-actions"><button type="button" class="cta-btn fill-btn" id="duel-go">🏁 Lancer la course</button><button type="button" class="cta-btn btn-ghost" id="duel-share" hidden>Partager le résultat</button></div>
      <div id="duel-result" class="duel-result" aria-live="polite"></div>
      <div id="duel-detail"></div>`;
    place(0);
    detail();
  }
  const fmt = (v, d, u) => (v == null || !isFinite(v) ? "—" : nf(v, d) + (u ? " " + u : ""));
  function drow(l, x, y, better) { const bx = better === 0 ? " class=\"win\"" : "", by = better === 1 ? " class=\"win\"" : ""; return `<div class="duel-row"><span${bx}>${x}</span><b>${l}</b><span${by}>${y}</span></div>`; }
  function cmp(x, y, low) { if (x == null || y == null) return x == null && y == null ? -1 : x == null ? 1 : 0; if (Math.abs(x - y) < 1e-6) return -1; return (x < y) === !!low ? 0 : 1; }
  function detail() {
    const box = document.getElementById("duel-detail"); if (!box) return;
    const ca = findCar(st.a), cb = findCar(st.b), pa = specOf(ca), pb = specOf(cb);
    const R = (l, k, d, u, low) => drow(l, fmt(SA[k], d, u), fmt(SB[k], d, u), cmp(SA[k], SB[k], low));
    const kindTxt = (S) => `${S.gears} rapports · ${S.shiftKind}`;
    box.innerHTML = `<div class="duel-table">
      ${drow("Puissance", nf(pa.hp) + " ch", nf(pb.hp) + " ch", cmp(pa.hp, pb.hp, false))}
      ${drow("Poids" + (pa.est || pb.est ? " (≈)" : ""), nf(pa.kg) + " kg", nf(pb.kg) + " kg", cmp(pa.kg, pb.kg, true))}
      ${drow("Poids / puissance", nf(pa.kg / pa.hp, 1) + " kg/ch", nf(pb.kg / pb.hp, 1) + " kg/ch", cmp(pa.kg / pa.hp, pb.kg / pb.hp, true))}
      ${drow("Boîte (estimée)", kindTxt(SA), kindTxt(SB), -1)}
      ${R("0 → 100 km/h", "t100", 2, "s", true)}${R("0 → 200 km/h", "t200", 1, "s", true)}${R("400 m D.A.", "t400", 2, "s", true)}${R("Vitesse à la fin des 400 m", "v400", 0, "km/h", false)}${R("1000 m D.A.", "t1000", 1, "s", true)}${R("Vitesse maxi", "vmax", 0, "km/h", false)}
    </div>
    <div class="duel-why"><h3>Pourquoi ce résultat ?</h3><ul>${why(ca, cb).map((t) => `<li>${t}</li>`).join("")}</ul></div>
    <p class="lap-meta">Simulation : puissance sur la plage de régime, passages de rapports (${st.driver === "amateur" ? "pilote amateur : passages plus lents" : st.driver === "pro" ? "pilote pro : passages rapides" : "pilote normal"}), adhérence selon la transmission et le sol, traînée calée sur la vitesse maxi publiée et départ calé sur le 0-100 publié. Les poids et le nombre de rapports sont des estimations : ce n'est pas un chrono officiel.</p>`;
  }
  function why(ca, cb) {
    const out = [], nm = [label(ca), label(cb)], S = [SA, SB], sp = [specOf(ca), specOf(cb)];
    const t = tm(SA), u = tm(SB);
    if (t == null && u == null) out.push(`Aucune des deux voitures n'atteint cette épreuve (vitesse maxi trop faible).`);
    else if (t == null || u == null) out.push(`<b>${C.esc(nm[t == null ? 1 : 0])}</b> est la seule à aller au bout de l'épreuve : l'autre n'atteint pas ${MODES[st.mode][0].replace("0 → ", "")}.`);
    // qui mène au départ, qui passe devant ensuite
    const eng = E(), tEnd = Math.max(t || 0, u || 0, 1);
    let lead = null, change = null;
    for (let x = 0.2; x <= tEnd; x += 0.1) { const a = eng.at(SA, x), b = eng.at(SB, x), l = a.x > b.x + 0.2 ? 0 : b.x > a.x + 0.2 ? 1 : lead; if (lead === null) lead = l; else if (l !== null && l !== lead && !change) change = { t: x, to: l, v: (l === 0 ? a : b).v }; }
    if (change) out.push(`<b>${C.esc(nm[1 - change.to])}</b> part devant, mais <b>${C.esc(nm[change.to])}</b> repasse devant à ${nf(change.t, 1)} s (≈ ${nf(change.v, 0)} km/h) : sa puissance prend le dessus quand la vitesse monte.`);
    else if (lead !== null && lead >= 0) out.push(`<b>${C.esc(nm[lead])}</b> mène du début à la fin.`);
    [0, 1].forEach((i) => {
      const P = S[i].P, d = sp[i].drive;
      if (P.muBoost > 1.05 || (d === "F" && sp[i].hp / sp[i].kg > 0.18)) out.push(`<b>${C.esc(nm[i])}</b> ${d === "F" ? "(traction)" : d === "R" ? "(propulsion)" : ""} est limitée par l'adhérence au départ : une partie de la puissance se perd en patinage.`);
      if (st.surface === "wet" && d === "R" && sp[i].hp / sp[i].kg > 0.12) out.push(`Sol mouillé : la propulsion <b>${C.esc(nm[i])}</b> patine beaucoup et perd plusieurs secondes.`);
      else if (st.surface === "wet" && d === "A") out.push(`Sol mouillé : le 4×4 <b>${C.esc(nm[i])}</b> garde le meilleur appui.`);
    });
    if (SA.gears !== SB.gears || SA.shiftKind !== SB.shiftKind) { const f = SA.P.shift < SB.P.shift ? 0 : 1; if (Math.abs(SA.P.shift - SB.P.shift) > 0.08) out.push(`Boîte : <b>${C.esc(nm[f])}</b> passe ses rapports plus vite (${S[f].shiftKind}, ≈ ${nf(S[f].P.shift * 1000, 0)} ms) : moins de temps sans accélérer.`); }
    const pw = [sp[0].kg / sp[0].hp, sp[1].kg / sp[1].hp];
    if (Math.abs(pw[0] - pw[1]) / Math.max(pw[0], pw[1]) > 0.1) { const f = pw[0] < pw[1] ? 0 : 1; out.push(`Rapport poids / puissance : avantage <b>${C.esc(nm[f])}</b> (${nf(pw[f], 1)} contre ${nf(pw[1 - f], 1)} kg/ch).`); }
    return out;
  }

  // ------------------------------------------------------------------ animation
  function frameFor(S, t) { return E().at(S, t); }
  function endDist(S) { const T = tm(S); return T == null ? null : E().at(S, T).x; }
  function place(t) {
    const dA = endDist(SA), dB = endDist(SB), D = st.mode === "100" || st.mode === "200" ? Math.max(dA || 0, dB || 0) || 1 : (st.mode === "400" ? 400 : 1000);
    [SA, SB].forEach((S, i) => {
      const el = document.getElementById("dc" + i); if (!el) return;
      const T = tm(S), tt = T == null ? t : Math.min(t, T), f = frameFor(S, tt);
      // la voiture continue de rouler jusqu'à la ligne d'arrivée commune (en 0→100 / 0→200 km/h chacune atteint la vitesse à une distance différente)
      const fp = frameFor(S, t);
      el.style.setProperty("--pos", Math.min(1, Math.max(f.x, fp.x) / D));
      const h = document.querySelector("#dh" + i + " b"); if (h) h.textContent = Math.round(f.v);
      const g = document.getElementById("dg" + i); if (g) g.textContent = t <= 0 ? "N" : f.g;
      const r = document.getElementById("dr" + i); if (r) r.style.width = Math.round(f.r * 100) + "%";
    });
    const ck = document.getElementById("duel-clock"); if (ck) ck.textContent = nf(t, 2) + " s";
  }
  let last = null;
  function run() {
    cancelAnimationFrame(raf);
    const goBtn = document.getElementById("duel-go"), res = document.getElementById("duel-result");
    res.textContent = ""; document.getElementById("duel-share").hidden = true;
    const tA = tm(SA), tB = tm(SB), end = Math.max(tA || 0, tB || 0) || Math.max(...[SA, SB].map((S) => S.samples.t[S.samples.t.length - 1] || 8));
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = reduced ? 12 : Math.max(1.4, end / 8);
    let t0 = null, countdown = 3; goBtn.disabled = true; place(0);
    const lights = document.getElementById("duel-clock");
    const tick = () => {
      if (countdown > 0) { lights.textContent = "🔴".repeat(4 - countdown) + "⚫".repeat(countdown - 1); countdown--; setTimeout(tick, reduced ? 50 : 650); return; }
      lights.textContent = "🟢 GO !";
      const step = (ts) => { if (t0 === null) t0 = ts; const t = Math.min(end, ((ts - t0) / 1000) * speed); place(t); if (t < end) raf = requestAnimationFrame(step); else finish(tA, tB); };
      raf = requestAnimationFrame(step);
    };
    tick();
  }
  function finish(tA, tB) {
    document.dispatchEvent(new CustomEvent("ma:duel-done"));
    const res = document.getElementById("duel-result"), btn = document.getElementById("duel-go"), ca = findCar(st.a), cb = findCar(st.b);
    btn.disabled = false; btn.textContent = "↻ Rejouer";
    const aOK = tA != null, bOK = tB != null;
    [[0, aOK], [1, bOK]].forEach(([i, ok]) => { const el = document.getElementById("dc" + i); if (el && ok) el.style.setProperty("--pos", 1); });   // les deux voitures finissent pile sur la ligne
    const win = !aOK && !bOK ? -1 : !bOK ? 0 : !aOK ? 1 : tA === tB ? -1 : tA < tB ? 0 : 1;
    last = { a: ca, b: cb, tA: aOK ? tA : 99, tB: bOK ? tB : 99, win, mode: st.mode };
    if (win < 0) res.innerHTML = `<b>${aOK ? "Égalité parfaite !" : "Aucune ne va au bout de l'épreuve."}</b>`;
    else if (!aOK || !bOK) res.innerHTML = `<b>🏆 ${C.esc(label(win === 0 ? ca : cb))}</b> gagne : l'autre n'atteint pas l'objectif.`;
    else {
      const tw = Math.min(tA, tB), gapM = Math.abs(E().at(SA, tw).x - E().at(SB, tw).x);
      res.innerHTML = `<b>🏆 ${C.esc(label(win === 0 ? ca : cb))}</b> gagne (${MODES[st.mode][0]}) avec <b>${nf(Math.abs(tA - tB), 2)} s</b> d'avance (≈ ${nf(gapM, 0)} m)<br><small>${nf(tA, 2)} s contre ${nf(tB, 2)} s</small>`;
    }
    document.getElementById("duel-share").hidden = false;
    document.getElementById("duel-clock").textContent = nf(Math.max(tA || 0, tB || 0), 2) + " s";
  }
  function shareResult() { if (last && window.MAShare) window.MAShare.duelImage(last); }

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
    ctx.Router.register("duel", { enter: async (p) => {
      let a = p.a, b = p.b;
      if (!a || !b) { let ids = []; try { ids = JSON.parse(localStorage.getItem("motorauto_compare") || "[]"); } catch (_) {} ids = ids.filter((id) => ctx.carsById.has(id)); a = ids[0] || ctx.cars[0].id; b = ids[1] || ctx.cars[1].id; }
      st.a = a; st.b = b;
      if (/^com-/.test(a + b)) await ensureComm(); else ensureComm();
      render();
    } });
    document.addEventListener("ma:compare-opened", (e) => compareExtras(e.detail.cars));
    document.addEventListener("click", (e) => {
      const o = e.target.closest("[data-opt]");
      if (o && document.getElementById("duel-root").contains(o)) { st[o.dataset.opt] = o.dataset.val; render(); return; }
      const s = e.target.closest("[data-slot]"); if (s) { openSheet(s.dataset.slot); return; }
      if (e.target.closest("#duel-swap")) { const t = st.a; st.a = st.b; st.b = t; go(); return; }
      if (e.target.closest("#duel-rand")) { const pool = C.cars; st.a = pool[Math.floor(Math.random() * pool.length)].id; st.b = pool[Math.floor(Math.random() * pool.length)].id; go(); return; }
      if (e.target.closest("#duel-go")) { run(); return; }
      if (e.target.closest("#duel-share")) { shareResult(); return; }
      if (e.target.closest("[data-close-compare]")) { const b = document.getElementById("close-compare-modal"); if (b) b.click(); }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
    document.addEventListener("ma:route", (e) => { if (e.detail.name !== "duel") { cancelAnimationFrame(raf); closeSheet(); } });
  });
})();
