/**
 * MOTORAUTO — Bataille de cartes (entraînement).
 * Règles équitables (le joueur mène toujours : il choisit carte et caractéristique ; la réponse de l'adversaire est réglée par simulation) :
 *  - ton adversaire reçoit une main de la MÊME force que la tienne (cartes de niveau comparable, tirées dans tout le catalogue) ;
 *  - chaque manche a un « meneur » : il joue une carte et choisit la caractéristique, l'autre répond avec une de ses cartes
 *    en connaissant la carte et la caractéristique. Le meneur change à chaque manche (le premier meneur est tiré au sort) ;
 *  - chaque carte ne sert qu'une fois ; l'adversaire répond avec la carte la plus économe qui bat la tienne, sinon il sacrifie sa plus faible.
 * Avant la partie : niveau de l'IA (facile / normal / difficile), main aléatoire ou choisie (5 cartes), fond d'arène, défi du jour.
 * Le résultat est enregistré côté serveur (historique, séries, trophées 5-0 / 10 d'affilée / victoire d'une Commune) ; seul le défi
 * quotidien rapporte une récompense fixe (une fois par jour). Les parties d'entraînement ne rapportent ni carte ni cristaux.
 */
(function () {
  "use strict";
  let C = null, ov = null, st = null, meta = null, scr = "setup", cfg = null, picking = false, pickQ = "";
  const LEVELS = { easy: { label: "Facile", skill: 0.08, bias: -0.1 }, normal: { label: "Normal", skill: 0.25, bias: 0 }, hard: { label: "Difficile", skill: 0.55, bias: 0.08 } };
  const CFG_KEY = "ma_bt_cfg", DAILY_DUST = 40;
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const loadCfg = () => { try { const o = JSON.parse(localStorage.getItem(CFG_KEY) || "{}"); return { level: LEVELS[o.level] ? o.level : "normal", deck: Array.isArray(o.deck) ? o.deck.slice(0, 5) : [], useDeck: !!o.useDeck, arena: o.arena || "classic" }; } catch (_) { return { level: "normal", deck: [], useDeck: false, arena: "classic" }; } };
  const saveCfg = () => { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (_) {} };
  const dayKey = () => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const rarOf = (car) => (window.MACards && window.MACards.rarityOf ? window.MACards.rarityOf(car) : "common");
  const ALWAYS_LEAD = true;   // c'est toujours le joueur qui choisit carte ET caractéristique ; l'équilibre vient de la réponse de l'adversaire
  let AI_SKILL = 0.25;   // réglé par simulation : un joueur malin gagne ≈ 50 %, un joueur au hasard ≈ 30 %   // part des réponses de l'adversaire jouées au mieux
  const STATS = [["power", "Puissance", "ch", 1], ["speed", "Vitesse", "km/h", 1], ["zero", "0 à 100", "s", -1]];
  const val = (car, k) => Number(car.stats && car.stats[k]) || 0;
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  /** seules les cartes qui ont les trois caractéristiques (chevaux, vitesse max, 0 à 100) peuvent combattre */
  const complete = (car) => STATS.every(([k]) => val(car, k) > 0);
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

  const myPool = () => { const doc = window.MACards.mine(); return doc ? C.cars.filter((c) => (doc.owned[c.id] || 0) > 0 && complete(c)) : []; };
  function newGame(o) {
    o = o || {};
    const mine = myPool();
    if (mine.length < 3) return null;
    const m = buildMeta(), lv = LEVELS[o.level] || LEVELS.normal;
    if (o.level) AI_SKILL = lv.skill;
    let hand = null;
    if (o.deck && o.deck.length >= 3) { const by = new Map(mine.map((c) => [c.id, c])); hand = o.deck.map((id) => by.get(id)).filter(Boolean); if (hand.length < 3) hand = null; }
    if (!hand) hand = shuffle(mine).slice(0, 5);
    const ids = new Set(hand.map((c) => c.id)), R = o.daily ? rng(hash("btdaily-" + dayKey())) : Math.random;
    // main adverse de même force : pour chaque carte, une voiture de notation proche (±6 %, puis on élargit)
    const base = C.cars.filter((c) => !ids.has(c.id) && complete(c)).sort((a, b) => (a.id < b.id ? -1 : 1));
    let pool = o.daily ? base.map((c) => [R(), c]).sort((a, b) => a[0] - b[0]).map((x) => x[1]) : shuffle(base);
    const foes = [];
    hand.forEach((c) => {
      const r = m.rating(c) + (o.daily ? 0 : lv.bias);
      for (const tol of [0.06, 0.12, 0.25, 1]) { const i = pool.findIndex((x) => Math.abs(m.rating(x) - r) <= tol); if (i >= 0) { foes.push(pool[i]); pool.splice(i, 1); break; } }
    });
    const first = R() < 0.5 ? "me" : "ai";
    const g = { hand, foes: o.daily ? foes : shuffle(foes), used: new Set(), foeUsed: new Set(), res: [], round: 0, me: 0, ai: 0, pick: -1, foePick: -1, stat: "", shown: false, msg: "", cls: "", first, leader: first, level: o.daily ? "normal" : (o.level || "normal"), daily: !!o.daily, giant: false, reported: false, prize: "" };
    startRound(g);
    return g;
  }
  /** début de manche : si c'est l'adversaire qui mène, il joue tout de suite sa carte et sa caractéristique */
  function startRound(g) {
    g.pick = -1; g.foePick = -1; g.stat = ""; g.shown = false; g.msg = ""; g.cls = "";
    g.leader = ALWAYS_LEAD ? "me" : (g.round % 2 === 0) === (g.first === "me") ? "me" : "ai";
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
    st.shown = true; st.res.push(r > 0 ? "w" : r < 0 ? "l" : "t"); st.used.add(st.pick); st.foeUsed.add(st.foePick);
    if (r > 0 && rarOf(mine) === "common" && ["epic", "legendary"].indexOf(rarOf(foe)) >= 0) st.giant = true;
    if (r > 0) { st.me++; st.cls = "win"; st.msg = `Manche gagnée ! ${s[1]} : ${a} ${s[2]} contre ${b} ${s[2]}`; }
    else if (r < 0) { st.ai++; st.cls = "lose"; st.msg = `Manche perdue. ${s[1]} : ${a} ${s[2]} contre ${b} ${s[2]}`; }
    else { st.cls = "tie"; st.msg = `Égalité (${s[1]})`; }
  }
  function play(k) { st.stat = k; st.foePick = aiRespond(k); resolve(); }

  function view() {
    if (!ov || !st) return;
    const total = st.hand.length, over = st.shown && st.round >= total - 1, UI = window.MABattleUI;
    const my = st.pick >= 0 ? st.hand[st.pick] : null, foe = st.foePick >= 0 && st.shown ? st.foes[st.foePick] : null;   // sa carte reste cachée jusqu'au résultat
    const mark = { w: "l", l: "w", t: "t" }, pad = (a) => a.concat(Array(Math.max(0, total - a.length)).fill(""));
    const m = {
      ak: st.round + "-" + (st.shown ? 1 : 0) + "-" + (over ? 1 : 0) + "-" + st.pick,
      me: { name: "Toi", score: st.me, pips: pad(st.res) }, foe: { name: "Adversaire (IA)", score: st.ai, pips: pad(st.res.map((x) => mark[x])) },
      mid: "Manche " + Math.min(st.round + 1, total) + " / " + total, turn: st.shown ? "" : "me",
      myCard: my ? card(my) : "", foeCard: foe ? card(foe) : "", reveal: st.shown, note: st.daily ? `Défi du jour : gagne pour recevoir ${DAILY_DUST} cristaux (une fois par jour).` : `Niveau ${LEVELS[st.level].label} · entraînement équitable, sans récompense.`
    };
    if (st.shown) {
      m.cmp = STATS.map(([k, label, unit, dir]) => { const a = val(my, k), b = val(foe, k), r = beats(a, b, k); return { label, unit, my: a || "—", foe: b || "—", dir, hot: k === st.stat, win: r > 0 ? "me" : r < 0 ? "foe" : "tie" }; });
      if (!over) m.verdict = { cls: st.cls, text: st.msg };
    }
    if (over) {
      const res = st.me > st.ai ? "Victoire !" : st.me < st.ai ? "Défaite" : "Match nul";
      m.end = { cls: st.me > st.ai ? "win" : st.me < st.ai ? "lose" : "tie", title: res, sub: st.me + " – " + st.ai, prize: st.prize || "" };
      m.actions = [{ a: "again", label: "Rejouer", primary: true }, { a: "menu", label: "Réglages et historique" }, { a: "close", label: "Fermer" }];
      if (!st.reported) report();
    } else if (st.shown) m.actions = [{ a: "next", label: "Manche suivante", primary: true }];
    else if (!my) {
      m.banner = { main: "C'est à toi !", sub: "Choisis la carte que tu joues" };
      m.hint = "Ta carte reste cachée de l'adversaire jusqu'au résultat.";
      m.hand = st.hand.map((c, i) => ({ i, html: card(c), used: st.used.has(i), label: c.brand + " " + c.model }));
    } else {
      m.banner = { main: "C'est à toi !", sub: "Choisis la caractéristique" };
      m.stats = STATS.map(([k, label, unit]) => ({ k, label, unit, val: val(my, k) }));
      m.actions = [{ a: "unpick", label: "Changer de carte" }];
    }
    UI.render(ov.querySelector(".bt"), m);
    const f = ov.querySelector("[data-act],[data-stat],[data-h]:not(.used)"); if (f) f.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------ résultat → serveur (historique, trophées, défi du jour)
  async function report() {
    const g = st; if (!g || g.reported) return; g.reported = true;
    if (!window.MAGameAPI || !C.user) return;
    try {
      const r = await window.MAGameAPI.call("battleReport", { me: g.me, ai: g.ai, level: g.level, daily: g.daily, giant: g.giant });
      if (r && r.doc && window.MACards && window.MACards.applyDoc) window.MACards.applyDoc(r.doc);
      const bits = [];
      if (r && r.reward) bits.push(`+${r.reward} cristaux (défi du jour)`);
      const T = { flawless: "Trophée : victoire 5-0 !", streak10: "Trophée : 10 victoires d'affilée !", giant: "Trophée : une Commune a battu une carte Épique ou Légendaire !" };
      ((r && r.trophies) || []).forEach((t) => { if (T[t]) bits.push(T[t]); });
      g.prize = bits.join(" · "); if (g === st && ov) view();
    } catch (_) { /* hors ligne ou fonctions non déployées : la partie reste jouable, elle n'est simplement pas enregistrée */ }
  }

  // ------------------------------------------------------------------ écran de préparation
  function css() {
    if (document.getElementById("bt-setup-css")) return;
    const el = document.createElement("style"); el.id = "bt-setup-css";
    el.textContent = `.bts{display:flex;flex-direction:column;gap:14px;color:var(--color-ink);text-align:left;max-height:calc(100vh - 190px);overflow:auto;padding:2px}
      .bts h3{margin:0 0 6px;font-size:1.05rem}.bts .bts-sec{background:var(--bg-surface);border:1px solid var(--stroke-line);border-radius:14px;padding:12px}
      .bts .seg{display:flex;gap:6px;flex-wrap:wrap}.bts .seg button,.bts .chip{border:1px solid var(--stroke-line);background:var(--bg-elevated);color:var(--color-ink);border-radius:999px;padding:7px 14px;font:inherit;font-size:.85rem;cursor:pointer}
      .bts .seg button.on,.bts .chip.on{background:var(--accent);color:var(--on-accent);border-color:transparent}.bts .seg button:disabled{opacity:.45;cursor:not-allowed}
      .bts small,.bts .mut{color:var(--color-secondary);font-size:.8rem}.bts input[type=search]{width:100%;font:inherit;padding:9px 12px;border-radius:10px;border:1px solid var(--stroke-line);background:transparent;color:inherit;margin:6px 0}
      .bts .rows{display:flex;flex-direction:column;gap:4px;max-height:240px;overflow:auto}.bts .row{display:flex;justify-content:space-between;gap:8px;align-items:center;border:1px solid var(--stroke-line);background:var(--bg-elevated);color:var(--color-ink);border-radius:10px;padding:8px 10px;font:inherit;font-size:.85rem;cursor:pointer;text-align:left}
      .bts .row.on{outline:2px solid var(--accent)}.bts .tag{font-size:.7rem;padding:2px 8px;border-radius:999px;border:1px solid var(--stroke-line);color:var(--color-secondary)}
      .bts .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px}.bts .stat{background:var(--bg-elevated);border-radius:10px;padding:8px;text-align:center}.bts .stat b{display:block;font-size:1.2rem}
      .bts .hist{display:flex;flex-direction:column;gap:4px;margin-top:8px}.bts .hist div{display:flex;justify-content:space-between;font-size:.85rem;border-bottom:1px solid var(--stroke-line);padding:5px 0}.bts .w{color:#22c55e}.bts .l{color:#ef4444}
      .bts .go{display:flex;gap:8px;flex-wrap:wrap}.bts .arenas{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}.bts .ar{height:54px;border-radius:10px;border:2px solid var(--stroke-line);color:#fff;font-size:.75rem;display:flex;align-items:flex-end;padding:5px;cursor:pointer;text-shadow:0 1px 3px #000}.bts .ar.on{border-color:var(--accent)}.bts .ar.lock{filter:grayscale(1);opacity:.55;cursor:not-allowed}`;
    document.head.appendChild(el);
  }
  const btDoc = () => { const d = window.MACards && window.MACards.mine ? window.MACards.mine() : null; return (d && d.bt) || {}; };
  const dailyDone = () => { const d = window.MACards.mine(); return !!(d && d.bdDay === dayKey()); };
  function setupView() {
    if (!ov) return; css();
    const G = window.MAGameCore, bt = btDoc(), wins = Number(bt.w) || 0, mine = myPool();
    const arenas = G && G.ARENAS ? G.ARENAS : { classic: { name: "Piste classique", v: 0, bg: "" } };
    if (!arenas[cfg.arena] || (arenas[cfg.arena].v || 0) > wins) cfg.arena = "classic";
    const deckCars = cfg.deck.map((id) => mine.find((c) => c.id === id)).filter(Boolean);
    if (deckCars.length !== cfg.deck.length) cfg.deck = deckCars.map((c) => c.id);
    const q = pickQ.trim().toLowerCase();
    const list = picking ? mine.filter((c) => !q || (c.brand + " " + c.model).toLowerCase().includes(q)).sort((a, b) => (a.brand + a.model).localeCompare(b.brand + b.model)).slice(0, 60) : [];
    const RL = { common: "Commune", rare: "Rare", epic: "Épique", legendary: "Légendaire" };
    const last = (bt.last || []).slice(0, 15).map((x) => { const d = new Date(x.t); const dt = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); return `<div><span>${esc(dt)} · IA ${esc((LEVELS[x.lv] || LEVELS.normal).label.toLowerCase())}${x.dl ? " · défi du jour" : ""}</span><b class="${x.r === "w" ? "w" : x.r === "l" ? "l" : ""}">${x.me} – ${x.ai} ${x.r === "w" ? "Victoire" : x.r === "l" ? "Défaite" : "Nul"}</b></div>`; }).join("");
    ov.querySelector(".bt").innerHTML = `<div class="bts">
      <div class="bts-sec"><h3>Niveau de l'IA</h3><div class="seg" role="group" aria-label="Niveau de l'IA">${Object.keys(LEVELS).map((k) => `<button type="button" data-su-level="${k}" class="${cfg.level === k ? "on" : ""}">${LEVELS[k].label}</button>`).join("")}</div>
        <small>Facile : adversaire plus faible et moins malin. Difficile : cartes plus fortes et réponses plus justes.</small></div>
      <div class="bts-sec"><h3>Ta main</h3><div class="seg"><button type="button" data-su-deck="rand" class="${cfg.useDeck ? "" : "on"}">Aléatoire</button><button type="button" data-su-deck="custom" class="${cfg.useDeck ? "on" : ""}">Mes 5 cartes</button></div>
        ${cfg.useDeck ? `<p class="mut">${deckCars.length} / 5 choisies${deckCars.length ? " : " + deckCars.map((c) => esc(c.brand + " " + c.model)).join(", ") : ""}</p><button type="button" class="chip" data-su-pick>${picking ? "Fermer la liste" : "Choisir mes cartes"}</button>
        ${picking ? `<input type="search" data-su-q placeholder="Rechercher dans tes cartes…" value="${esc(pickQ)}" aria-label="Rechercher"><div class="rows">${list.map((c) => `<button type="button" class="row ${cfg.deck.includes(c.id) ? "on" : ""}" data-su-card="${esc(c.id)}"><span>${esc(c.brand + " " + c.model)}</span><span class="tag">${RL[rarOf(c)] || ""}</span></button>`).join("") || '<p class="mut">Aucune carte trouvée.</p>'}</div>${mine.length > 60 ? '<small>Seules les 60 premières sont affichées : utilise la recherche.</small>' : ""}` : ""}` : ""}</div>
      <div class="bts-sec"><h3>Fond d'arène</h3><div class="arenas">${Object.keys(arenas).map((k) => { const a = arenas[k], ok = (a.v || 0) <= wins; return `<button type="button" class="ar ${cfg.arena === k ? "on" : ""} ${ok ? "" : "lock"}" style="background:${a.bg}" data-su-arena="${k}" ${ok ? "" : "disabled"}>${esc(a.name)}${ok ? "" : " · " + a.v + " victoires"}</button>`; }).join("")}</div></div>
      <div class="go"><button type="button" class="cta-btn fill-btn" data-su-go="free">Lancer la bataille</button><button type="button" class="cta-btn btn-ghost" data-su-go="daily" ${dailyDone() ? "disabled" : ""}>${dailyDone() ? "Défi du jour relevé" : `Défi du jour · +${DAILY_DUST} cristaux`}</button></div>
      <div class="bts-sec"><h3>Ton historique</h3><div class="stats"><div class="stat"><b>${wins}</b><small>Victoires</small></div><div class="stat"><b>${Number(bt.l) || 0}</b><small>Défaites</small></div><div class="stat"><b>${Number(bt.best) || 0}</b><small>Meilleure série</small></div><div class="stat"><b>${Number(bt.flawless) || 0}</b><small>Victoires 5-0</small></div><div class="stat"><b>${Number(bt.giant) || 0}</b><small>Géants abattus</small></div></div>
        <div class="hist">${last || '<p class="mut">Aucune bataille enregistrée pour l\'instant.</p>'}</div></div>
    </div>`;
    saveCfg();
    const f = ov.querySelector("[data-su-go]"); if (f && !picking) f.focus({ preventScroll: true });
  }
  async function launch(daily) {
    if (daily && dailyDone()) { C.toast("Tu as déjà relevé le défi du jour.", "err"); return; }
    if (daily && window.MAGameAPI) { try { await window.MAGameAPI.call("battleDailyStart", {}); } catch (e) { C.toast(e.message || "Défi du jour indisponible.", "err"); return; } }
    const g = newGame({ level: cfg.level, deck: cfg.useDeck ? cfg.deck : null, daily });
    if (!g) { C.toast("Il te faut au moins 3 cartes complètes (chevaux, vitesse max et 0 à 100).", "err"); return; }
    if (cfg.useDeck && cfg.deck.length < 3) { C.toast("Choisis au moins 3 cartes, ou repasse en main aléatoire.", "err"); return; }
    st = g; scr = "game"; applyArena(); view();
  }
  function applyArena() { const G = window.MAGameCore, a = G && G.ARENAS && G.ARENAS[cfg.arena]; if (ov) ov.querySelector(".tcg-stage").style.background = a && a.bg ? a.bg : ""; }

  function close() {
    if (!ov) return;
    document.removeEventListener("keydown", onKey);
    document.body.classList.remove("tcg-open");
    const o = ov; ov = null; st = null; o.classList.remove("on"); setTimeout(() => o.remove(), 180);
  }
  function onKey(e) { if (e.key === "Escape") close(); }
  function open() {
    if (ov) return;
    if (myPool().length < 3) { C.toast("Il te faut au moins 3 cartes complètes (chevaux, vitesse max et 0 à 100) pour lancer une bataille.", "err"); return; }
    cfg = loadCfg(); scr = "setup"; st = null; picking = false; pickQ = "";
    ov = document.createElement("div");
    ov.className = "tcg-overlay"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Bataille de cartes");
    ov.innerHTML = `<div class="tcg-stage"><div class="bt"></div><button type="button" class="cta-btn btn-ghost" data-bt="close">Quitter</button></div>`;
    document.body.appendChild(ov); document.body.classList.add("tcg-open");
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => ov && ov.classList.add("on"));
    ov.addEventListener("click", (e) => {
      if (e.target === ov) { close(); return; }
      if (scr === "setup" || !st) {
        const t = e.target.closest("[data-su-level],[data-su-deck],[data-su-pick],[data-su-card],[data-su-arena],[data-su-go],[data-bt]"); if (!t) return;
        if (t.dataset.bt === "close") { close(); return; }
        if (t.dataset.suLevel) cfg.level = t.dataset.suLevel;
        else if (t.dataset.suDeck) { cfg.useDeck = t.dataset.suDeck === "custom"; if (!cfg.useDeck) picking = false; }
        else if ("suPick" in t.dataset) picking = !picking;
        else if (t.dataset.suCard) { const i = cfg.deck.indexOf(t.dataset.suCard); if (i >= 0) cfg.deck.splice(i, 1); else if (cfg.deck.length < 5) cfg.deck.push(t.dataset.suCard); else C.toast("5 cartes maximum : retire-en une d'abord.", "err"); }
        else if (t.dataset.suArena) cfg.arena = t.dataset.suArena;
        else if (t.dataset.suGo) { launch(t.dataset.suGo === "daily"); return; }
        setupView(); return;
      }
      const b = e.target.closest("[data-bt],[data-act]"), h = e.target.closest("[data-h]"), s = e.target.closest("[data-stat]");
      if (b) {
        const a = b.dataset.bt || b.dataset.act;
        if (a === "close") close();
        else if (a === "again") { const g = newGame({ level: cfg.level, deck: cfg.useDeck ? cfg.deck : null, daily: false }); if (g) { st = g; applyArena(); view(); } }
        else if (a === "menu") { st = null; scr = "setup"; picking = false; ov.querySelector(".tcg-stage").style.background = ""; setupView(); }
        else if (a === "next") { st.round++; startRound(st); view(); }
        else if (a === "unpick" && !st.shown) { st.pick = -1; view(); }
      } else if (h && !st.shown && st.pick < 0 && !st.used.has(Number(h.dataset.h))) {
        st.pick = Number(h.dataset.h);
        if (st.leader === "ai") resolve();   // l'adversaire a déjà joué : ta réponse règle la manche
        view();
      } else if (s && st.pick >= 0 && !st.shown && st.leader === "me") { play(s.dataset.stat); view(); }
    });
    ov.addEventListener("input", (e) => { const q = e.target.closest("[data-su-q]"); if (q && scr === "setup") { pickQ = q.value; const pos = q.selectionStart; setupView(); const n = ov && ov.querySelector("[data-su-q]"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) {} } } });
    setupView();
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
  window.MABattle = { open, _test: { sim, newGame, LEVELS, setSkill: (v) => { AI_SKILL = v; } } };
  (window.MAModules = window.MAModules || []).push(function (ctx) { C = ctx; });
})();
