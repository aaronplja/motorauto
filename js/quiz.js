/**
 * MOTORAUTO — quiz « Quelle voiture est faite pour toi ? » + voiture du jour.
 * Le quiz note CHAQUE fiche du catalogue (budget, usage, transmission, puissance) : les nouvelles fiches y entrent toutes seules.
 */
(function () {
  "use strict";
  let C = null, step = 0, ans = {};
  const Q = [
    { id: "budget", q: "Ton budget d'achat ?", o: [[1, "Moins de 5 000 €"], [2, "5 à 12 000 €"], [3, "12 à 25 000 €"], [4, "25 à 60 000 €"], [5, "Pas de limite"]] },
    { id: "usage", q: "Tu l'utiliserais surtout pour…", o: [["daily", "Tous les jours (trajets, ville)"], ["fun", "Les petites routes et le plaisir"], ["track", "Le circuit et les chronos"], ["family", "La famille et les longs trajets"], ["show", "Le look et l'exclusivité"]] },
    { id: "drive", q: "Ta transmission préférée ?", o: [["R", "Propulsion (glisse, sensations)"], ["F", "Traction (efficace, facile)"], ["A", "4 roues motrices (adhérence)"], ["any", "Peu importe"]] },
    { id: "power", q: "Côté puissance, tu vises…", o: [["low", "Sage : moins de 150 ch"], ["mid", "Sportif : 150 à 250 ch"], ["high", "Costaud : 250 à 400 ch"], ["max", "Démesuré : plus de 400 ch"]] },
    { id: "body", q: "La carrosserie qui te parle ?", o: [["Berline", "Berline compacte"], ["Coupé", "Coupé / sportive"], ["Break", "Break"], ["Supercar", "Supercar"], ["any", "Aucune préférence"]] }
  ];
  const PW = { low: [0, 150], mid: [150, 250], high: [250, 400], max: [400, 2000] };

  function score(car) {
    const X = window.MAExtra ? window.MAExtra.carExtra(car) : { band: 3, drive: "" }, p = car.stats.power || 0;
    let s = 0, why = [];
    // budget : la fiche doit rentrer dans la tranche (un cran au-dessus = pénalité, deux = exclu)
    const over = X.band - ans.budget;
    if (over <= 0) { s += 25 - Math.min(10, (ans.budget - X.band) * 3); why.push("dans ton budget"); } else if (over === 1) s += 6; else s -= 40;
    // puissance
    const [lo, hi] = PW[ans.power]; if (p >= lo && p < hi) { s += 25; why.push(p + " ch"); } else s += Math.max(0, 25 - Math.min(lo - p > 0 ? lo - p : p - hi, 250) / 10);
    // transmission
    if (ans.drive === "any" || !X.drive) s += 10; else if (X.drive === ans.drive) { s += 20; why.push(window.MAExtra.DRIVE_LABEL[X.drive].toLowerCase()); } else if (ans.drive === "A" && X.drive === "A") s += 20;
    // usage
    const kg = X.kg || 1300, ptw = p / kg * 1000, cat = car.category;
    const useFit = { daily: () => (p < 220 ? 20 : 8) + (cat === "Berline" ? 6 : 0), fun: () => (X.drive === "R" ? 14 : 8) + (ptw > 120 ? 8 : 0) + (kg < 1200 ? 6 : 0), track: () => Math.min(26, ptw / 8) + (X.drive === "R" || X.drive === "M" ? 4 : 0),
      family: () => (cat === "Break" ? 26 : cat === "Berline" ? 16 : 4), show: () => (cat === "Supercar" ? 26 : cat === "Coupé" ? 16 : 6) }[ans.usage];
    const u = useFit(); s += u; if (u >= 18) why.push({ daily: "polyvalente", fun: "pour le plaisir", track: "rapport poids/puissance " + Math.round(ptw) + " ch/t", family: "pratique", show: "du caractère" }[ans.usage]);
    if (ans.body !== "any" && cat === ans.body) { s += 14; why.push(cat.toLowerCase()); }
    return { car, s, why: Array.from(new Set(why)).slice(0, 4) };
  }
  function results() {
    const r = C.cars.map(score).sort((a, b) => b.s - a.s).slice(0, 3), top = Math.max(1, r[0].s);
    return r.map((x, i) => Object.assign(x, { pct: Math.max(35, Math.min(98, Math.round((x.s / 118) * 100))), rank: i + 1 }));
  }
  function render() {
    const root = document.getElementById("quiz-root"); if (!root) return;
    if (step >= Q.length) {
      if (!render._done) { render._done = true; document.dispatchEvent(new CustomEvent("ma:quiz-done")); }
      const res = results();
      root.innerHTML = `<div class="quiz-res">${res.map((x) => `<article class="quiz-card ${x.rank === 1 ? "first" : ""}"><span class="quiz-rank">${x.rank === 1 ? "🏆 Ta voiture idéale" : "#" + x.rank}</span><img src="${C.esc(C.safeUrl(x.car.image) || "")}" alt="" data-fallback="car" loading="lazy">
        <div class="quiz-body"><small>${C.esc(x.car.brand)}</small><h3>${C.esc(x.car.model)}</h3><div class="xp-bar" aria-label="Compatibilité ${x.pct} %"><i style="width:${x.pct}%"></i></div><b>${x.pct} % de compatibilité</b><p>${C.esc(x.why.join(" · "))}</p>
        <div class="quiz-actions"><a class="cta-btn fill-btn compact-btn" href="#/voiture/${encodeURIComponent(x.car.id)}">Voir la fiche</a><a class="cta-btn btn-ghost compact-btn" href="#/duel/${encodeURIComponent(res[0].car.id)}/${encodeURIComponent(x.car.id === res[0].car.id ? res[1].car.id : x.car.id)}">🏁 Duel</a></div></div></article>`).join("")}</div>
        <div class="duel-actions"><button type="button" class="cta-btn btn-ghost" data-quiz-reset>↻ Refaire le quiz</button>${window.MAShare ? `<button type="button" class="cta-btn btn-ghost" data-quiz-share>↗ Partager mon résultat</button>` : ""}</div>`;
      return;
    }
    const q = Q[step];
    root.innerHTML = `<div class="quiz-q"><div class="xp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${Q.length}" aria-valuenow="${step}"><i style="width:${(step / Q.length) * 100}%"></i></div><small class="lap-meta">Question ${step + 1} / ${Q.length}</small><h2>${C.esc(q.q)}</h2>
      <div class="quiz-opts">${q.o.map(([v, l]) => `<button type="button" class="quiz-opt ${ans[q.id] === v ? "on" : ""}" data-quiz="${C.esc(String(v))}">${C.esc(l)}</button>`).join("")}</div>${step ? `<button type="button" class="link-more" data-quiz-back>← Précédent</button>` : ""}</div>`;
  }

  // ------------------------------------------------------------------ voiture du jour
  const dayKey = () => (window.MAGame ? window.MAGame.day() : new Date().toISOString().slice(0, 10));
  function carOfDay(date) {
    const cars = C.cars.slice().sort((a, b) => a.id.localeCompare(b.id));
    let h = 7; for (const ch of date) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return cars[h % cars.length];
  }
  function renderDaily() {
    const box = document.getElementById("home-daily"); if (!box) return;
    const car = carOfDay(dayKey()), on = notifOn();
    const rar = window.MACards ? window.MACards.RAR[window.MACards.rarityOf(car)].label : "";
    box.innerHTML = `<a class="daily-card" href="#/voiture/${encodeURIComponent(car.id)}"><img src="${C.esc(C.safeUrl(car.image) || "")}" alt="" data-fallback="car" loading="lazy"><div class="daily-body"><span class="daily-kicker">⭐ Voiture du jour</span><h3>${C.esc(car.brand)} ${C.esc(String(car.model).replace(/\s*\(.*$/, ""))}</h3>
      <p>${car.stats.power} ch · ${car.stats.speed} km/h${car.stats.zero ? " · 0-100 en " + car.stats.zero + " s" : ""}${rar ? " · carte " + rar.toLowerCase() : ""}</p></div></a>
      <button type="button" class="chip ${on ? "active" : ""}" data-daily-notif aria-pressed="${on}">${on ? "🔔 Rappel quotidien activé" : "🔕 Me rappeler chaque jour"}</button>`;
  }
  const notifOn = () => { try { return localStorage.getItem("ma_daily_notif") === "1"; } catch (_) { return false; } };
  async function toggleNotif() {
    if (notifOn()) { try { localStorage.removeItem("ma_daily_notif"); } catch (_) { /* ignoré */ } renderDaily(); C.toast("Rappel quotidien désactivé."); return; }
    if (!("Notification" in window)) { C.toast("Ton navigateur ne gère pas les notifications.", "err"); return; }
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") { C.toast("Notification refusée dans le navigateur.", "err"); return; }
    try { localStorage.setItem("ma_daily_notif", "1"); } catch (_) { /* ignoré */ }
    renderDaily(); C.toast("Rappel activé : tu le recevras quand tu ouvres MOTORAUTO.", "ok"); remind(true);
  }
  function remind(force) {
    if (!notifOn() || !("Notification" in window) || Notification.permission !== "granted") return;
    let seen = ""; try { seen = localStorage.getItem("ma_daily_seen") || ""; } catch (_) { /* ignoré */ }
    if (!force && seen === dayKey()) return;
    try { localStorage.setItem("ma_daily_seen", dayKey()); } catch (_) { /* ignoré */ }
    const car = carOfDay(dayKey());
    try { new Notification("⭐ Voiture du jour", { body: `${car.brand} ${car.model} — ${car.stats.power} ch`, icon: "favicon.svg", tag: "ma-daily" }); } catch (_) { /* mobile : non supporté sans service worker */ }
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("quiz", { enter: () => { step = 0; ans = {}; render._done = false; render(); } });
    ctx.Router.register("home", { enter: () => { renderDaily(); remind(); } });
    document.addEventListener("click", (e) => {
      const o = e.target.closest("[data-quiz]");
      if (o && document.getElementById("quiz-root").contains(o)) { const q = Q[step], raw = o.dataset.quiz; ans[q.id] = isNaN(raw) ? raw : Number(raw); step++; render(); return; }
      if (e.target.closest("[data-quiz-back]")) { step = Math.max(0, step - 1); render(); return; }
      if (e.target.closest("[data-quiz-reset]")) { step = 0; ans = {}; render._done = false; render(); return; }
      if (e.target.closest("[data-quiz-share]")) { const r = results()[0]; window.MAShare.shareLink("Ma voiture idéale", `Mon quiz MOTORAUTO m'a trouvé : ${r.car.brand} ${r.car.model} (${r.pct} %). Et toi ?`, window.MAShare.origin() + "/#/quiz"); return; }
      if (e.target.closest("[data-daily-notif]")) toggleNotif();
    });
  });
})();
