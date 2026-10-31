/**
 * MOTORAUTO — Bataille de cartes (entraînement).
 * Règles équitables :
 *  - ton adversaire reçoit une main de la MÊME force que la tienne (cartes de niveau comparable, tirées dans tout le catalogue) ;
 *  - chaque manche a un « meneur » : il joue une carte et choisit la caractéristique, l'autre répond avec une de ses cartes
 *    en connaissant la carte et la caractéristique. Le meneur change à chaque manche (le premier meneur est tiré au sort) ;
 *  - chaque carte ne sert qu'une fois ; l'adversaire répond avec la carte la plus économe qui bat la tienne, sinon il sacrifie sa plus faible.
 * Tout se passe dans le navigateur : la bataille ne rapporte ni carte ni poussière (rien à tricher côté serveur).
 */
(function () {
  "use strict";
  let C = null, ov = null, st = null, meta = null;
  const AI_SKILL = 0.3;   // part des réponses de l'adversaire jouées au mieux
  const STATS = [["power", "Puissance", "ch", 1], ["speed", "Vitesse", "km/h", 1], ["zero", "0 à 100", "s", -1]];
  const val = (car, k) => Number(car.stats && car.stats[k]) || 0;
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const card = (car) => window.MACards.cardHtml(car, { owned: true });

  /** classement de chaque voiture du catalogue sur chaque caractéristique (0 = faible … 1 = meilleure) */
  function buildMeta() {
    if (meta && meta.n === C.cars.length) return meta;
    const sorted = {};
    STATS.forEach(([k, , , dir]) => { sorted[k] = C.cars.map((c) => val(c, k)).filter((v) => v > 0).sort((a, b) => a - b); });
    const lowerCount = (arr, v) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < v) lo = m + 1; else hi = m; } return lo; };
    const pct = (car, k) => { const v = val(car, k), arr = sorted[k]; if (!v || !arr.length) return 0; const p = lowerCount(arr, v) / arr.length; return STATS.find((s) => s[0] === k)[3] < 0 ? 1 - p : p; };
    meta = { n: C.cars.length, pct, rating: (car) => { const ps = STATS.map(([k]) => pct(car, k)).filter((p) => p > 0); return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0; } };
    return meta;
  }
  /** la caractéristique où cette carte est la plus forte (par rapport au catalogue) */
  function bestStat(car) { const m = buildMeta(); return STATS.map(([k]) => [k, m.pct(car, k)]).sort((a, b) => b[1] - a[1])[0][0]; }
  const beats = (a, b, k) => { const s = STATS.find((x) => x[0] === k); return a && b ? Math.sign((a - b) * s[3]) : 0; };

  function newGame() {
    const doc = window.MACards.mine();
    const mine = doc ? C.cars.filter((c) => (doc.owned[c.id] || 0) > 0) : [];
    if (mine.length < 3) return null;
    const m = buildMeta();
    const hand = shuffle(mine).slice(0, 5), ids = new Set(hand.map((c) => c.id));
    // main adverse de même force : pour chaque carte, une voiture de notation proche (±6 %, puis on élargit)
    let pool = shuffle(C.cars.filter((c) => !ids.has(c.id) && m.rating(c) > 0));
    const foes = [];
    hand.forEach((c) => {
      const r = m.rating(c);
      for (const tol of [0.06, 0.12, 0.25, 1]) { const i = pool.findIndex((x) => Math.abs(m.rating(x) - r) <= tol); if (i >= 0) { foes.push(pool[i]); pool.splice(i, 1); break; } }
    });
    const first = Math.random() < 0.5 ? "me" : "ai";
    const g = { hand, foes: shuffle(foes), used: new Set(), foeUsed: new Set(), round: 0, me: 0, ai: 0, pick: -1, foePick: -1, stat: "", shown: false, msg: "", cls: "", first, leader: first };
    startRound(g);
    return g;
  }
  /** début de manche : si c'est l'adversaire qui mène, il joue tout de suite sa carte et sa caractéristique */
  function startRound(g) {
    g.pick = -1; g.foePick = -1; g.stat = ""; g.shown = false; g.msg = ""; g.cls = "";
    g.leader = (g.round % 2 === 0) === (g.first === "me") ? "me" : "ai";
    if (g.leader === "ai") {
      const free = g.foes.map((c, i) => i).filter((i) => !g.foeUsed.has(i));
      g.foePick = free[Math.floor(Math.random() * free.length)];
      g.stat = Math.random() < AI_SKILL + 0.2 ? bestStat(g.foes[g.foePick]) : STATS[Math.floor(Math.random() * STATS.length)][0];   // il ne joue pas toujours sa meilleure carte ni sa meilleure caractéristique
    }
  }
  /** réponse de l'adversaire quand c'est toi qui mènes : la carte la plus économe qui te bat, sinon sa plus faible sur cette caractéristique */
  function aiRespond(k) {
    const mine = val(st.hand[st.pick], k), free = st.foes.map((c, i) => i).filter((i) => !st.foeUsed.has(i));
    if (Math.random() > AI_SKILL) return free[Math.floor(Math.random() * free.length)];
    const win = free.filter((i) => beats(val(st.foes[i], k), mine, k) > 0).sort((a, b) => beats(val(st.foes[a], k), val(st.foes[b], k), k));
    if (win.length) return win[0];
    const rank = (i) => meta.pct(st.foes[i], k);
    return free.sort((a, b) => rank(a) - rank(b))[0];
  }
  function resolve() {
    const k = st.stat, s = STATS.find((x) => x[0] === k), mine = st.hand[st.pick], foe = st.foes[st.foePick];
    const a = val(mine, k), b = val(foe, k), r = beats(a, b, k);
    st.shown = true; st.used.add(st.pick); st.foeUsed.add(st.foePick);
    if (r > 0) { st.me++; st.cls = "win"; st.msg = `Manche gagnée ! ${s[1]} : ${a} ${s[2]} contre ${b} ${s[2]}`; }
    else if (r < 0) { st.ai++; st.cls = "lose"; st.msg = `Manche perdue. ${s[1]} : ${a} ${s[2]} contre ${b} ${s[2]}`; }
    else { st.cls = "tie"; st.msg = `Égalité (${s[1]})`; }
  }
  function play(k) { st.stat = k; st.foePick = aiRespond(k); resolve(); }

  function view() {
    if (!ov || !st) return;
    const total = st.hand.length, over = st.shown && st.round >= total - 1;
    const my = st.pick >= 0 ? st.hand[st.pick] : null;
    const foe = st.foePick >= 0 && (st.shown || st.leader === "ai") ? st.foes[st.foePick] : null;
    const sName = st.stat ? STATS.find((x) => x[0] === st.stat) : null;
    let body = "";
    if (over) {
      const res = st.me > st.ai ? "Victoire !" : st.me < st.ai ? "Défaite" : "Match nul";
      body = `<div class="bt-res ${st.me > st.ai ? "win" : st.me < st.ai ? "lose" : "tie"}">${res} ${st.me} – ${st.ai}</div><div class="tcg-actions"><button type="button" class="cta-btn fill-btn" data-bt="again">Rejouer</button><button type="button" class="cta-btn btn-ghost" data-bt="close">Fermer</button></div>`;
    } else if (st.shown) {
      body = `<div class="tcg-actions"><button type="button" class="cta-btn fill-btn" data-bt="next">Manche suivante</button></div>`;
    } else if (st.leader === "ai") {
      body = `<p class="tcg-hint">L'adversaire joue cette carte et défie ta <b>${C.esc(sName[1])}</b> (${val(foe, st.stat) || "—"} ${C.esc(sName[2])}). Choisis la carte avec laquelle tu réponds.</p><div class="bt-hand">${handHtml()}</div>`;
    } else if (my) {
      body = `<p class="tcg-hint">Tu mènes : choisis la caractéristique. L'adversaire répondra avec l'une de ses cartes.</p><div class="bt-stats">${STATS.map((s) => `<button type="button" class="cta-btn fill-btn" data-stat="${s[0]}">${s[1]} · ${val(my, s[0]) || "—"} ${s[2]}</button>`).join("")}</div>`;
    } else {
      body = `<p class="tcg-hint">Tu mènes : choisis la carte que tu joues</p><div class="bt-hand">${handHtml()}</div>`;
    }
    ov.querySelector(".bt").innerHTML = `<h2>Bataille de cartes</h2>
      <div class="bt-score"><span>Toi <b>${st.me}</b></span><span>Manche ${Math.min(st.round + 1, total)} / ${total}${st.shown ? "" : st.leader === "me" ? " · tu mènes" : " · il mène"}</span><span>Adversaire <b>${st.ai}</b></span></div>
      <div class="bt-field"><div>${my ? card(my) : `<div class="bt-hidden">?</div>`}</div><span class="bt-vs">VS</span><div>${foe ? card(foe) : `<div class="bt-hidden">MOTOR<br>AUTO</div>`}</div></div>
      ${st.shown && !over ? `<div class="bt-res ${st.cls}" role="status">${C.esc(st.msg)}</div>` : over ? `<p class="bt-note">${C.esc(st.msg)}</p>` : ""}
      ${body}
      <p class="bt-note">Entraînement équitable : mains de force égale, un meneur à tour de rôle. Aucune récompense.</p>`;
    const f = ov.querySelector("[data-bt],[data-stat],[data-h]:not(.used)"); if (f) f.focus({ preventScroll: true });
  }
  const handHtml = () => st.hand.map((c, i) => `<button type="button" class="pick ${st.used.has(i) ? "used" : ""}" data-h="${i}" aria-label="${C.esc(c.brand + " " + c.model)}">${card(c)}</button>`).join("");
  function close() {
    if (!ov) return;
    document.removeEventListener("keydown", onKey);
    document.body.classList.remove("tcg-open");
    const o = ov; ov = null; st = null; o.classList.remove("on"); setTimeout(() => o.remove(), 180);
  }
  function onKey(e) { if (e.key === "Escape") close(); }
  function open() {
    if (ov) return;
    st = newGame();
    if (!st) { C.toast("Il te faut au moins 3 cartes pour lancer une bataille.", "err"); return; }
    ov = document.createElement("div");
    ov.className = "tcg-overlay"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Bataille de cartes");
    ov.innerHTML = `<div class="tcg-stage"><div class="bt"></div><button type="button" class="cta-btn btn-ghost" data-bt="close">Quitter</button></div>`;
    document.body.appendChild(ov); document.body.classList.add("tcg-open");
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => ov && ov.classList.add("on"));
    ov.addEventListener("click", (e) => {
      const b = e.target.closest("[data-bt]"), h = e.target.closest("[data-h]"), s = e.target.closest("[data-stat]");
      if (e.target === ov) { close(); return; }
      if (!st) return;
      if (b) {
        if (b.dataset.bt === "close") close();
        else if (b.dataset.bt === "again") { st = newGame() || st; view(); }
        else if (b.dataset.bt === "next") { st.round++; startRound(st); view(); }
      } else if (h && !st.shown && st.pick < 0 && !st.used.has(Number(h.dataset.h))) {
        st.pick = Number(h.dataset.h);
        if (st.leader === "ai") resolve();   // l'adversaire a déjà joué : ta réponse règle la manche
        view();
      } else if (s && st.pick >= 0 && !st.shown && st.leader === "me") { play(s.dataset.stat); view(); }
    });
    view();
  }
  /** simulation (tests) : joueur « hasard » ou « malin » contre l'adversaire, sur n parties */
  function sim(n, smart) {
    const saved = st, out = { w: 0, l: 0, t: 0, ratingGap: 0 };
    for (let g = 0; g < n; g++) {
      st = newGame(); if (!st) break;
      const m = buildMeta(); out.ratingGap += st.hand.reduce((a, c) => a + m.rating(c), 0) / st.hand.length - st.foes.reduce((a, c) => a + m.rating(c), 0) / st.foes.length;
      for (;;) {
        const free = st.hand.map((c, i) => i).filter((i) => !st.used.has(i));
        if (st.leader === "ai") {
          const k = st.stat, foeV = val(st.foes[st.foePick], k);
          const ok = free.filter((i) => beats(val(st.hand[i], k), foeV, k) > 0).sort((a, b) => beats(val(st.hand[a], k), val(st.hand[b], k), k));
          st.pick = smart ? (ok.length ? ok[0] : free.sort((a, b) => m.pct(st.hand[a], k) - m.pct(st.hand[b], k))[0]) : free[Math.floor(Math.random() * free.length)];
          resolve();
        } else {
          st.pick = smart ? free.sort((a, b) => m.rating(st.hand[b]) - m.rating(st.hand[a]))[Math.floor(Math.random() * Math.min(2, free.length))] : free[Math.floor(Math.random() * free.length)];
          play(smart ? bestStat(st.hand[st.pick]) : STATS[Math.floor(Math.random() * 3)][0]);
        }
        if (st.round >= st.hand.length - 1) break;
        st.round++; startRound(st);
      }
      if (st.me > st.ai) out.w++; else if (st.me < st.ai) out.l++; else out.t++;
    }
    st = saved; out.ratingGap /= Math.max(1, n); return out;
  }
  window.MABattle = { open, _test: { sim } };
  (window.MAModules = window.MAModules || []).push(function (ctx) { C = ctx; });
})();
