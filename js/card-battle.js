/**
 * MOTORAUTO — Bataille de cartes (entraînement). Tu tires une main parmi tes cartes, tu joues une carte par manche,
 * tu choisis la caractéristique (puissance, vitesse, 0 à 100) et tu affrontes une carte tirée au hasard dans le catalogue.
 * Tout se passe dans le navigateur : la bataille ne rapporte ni carte ni poussière (rien à tricher côté serveur).
 */
(function () {
  "use strict";
  let C = null, ov = null, st = null;
  const STATS = [["power", "Puissance", "ch", 1], ["speed", "Vitesse", "km/h", 1], ["zero", "0 à 100", "s", -1]];
  const val = (car, k) => Number(car.stats && car.stats[k]) || 0;
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const card = (car) => window.MACards.cardHtml(car, { owned: true });

  function newGame() {
    const doc = window.MACards.mine();
    const mine = doc ? C.cars.filter((c) => (doc.owned[c.id] || 0) > 0) : [];
    if (mine.length < 3) return null;
    const hand = shuffle(mine).slice(0, 5), ids = new Set(hand.map((c) => c.id));
    const pool = shuffle(C.cars.filter((c) => !ids.has(c.id))).slice(0, hand.length);
    return { hand, foes: pool, used: new Set(), round: 0, me: 0, ai: 0, pick: -1, shown: false, msg: "", cls: "" };
  }
  function play(k) {
    const s = STATS.find((x) => x[0] === k), mine = st.hand[st.pick], foe = st.foes[st.round];
    const a = val(mine, k), b = val(foe, k);
    let r = 0;
    if (a && b) r = Math.sign((a - b) * s[3]);
    st.shown = true;
    if (r > 0) { st.me++; st.cls = "win"; st.msg = `Manche gagnée ! ${a} ${s[2]} contre ${b} ${s[2]}`; }
    else if (r < 0) { st.ai++; st.cls = "lose"; st.msg = `Manche perdue : ${a} ${s[2]} contre ${b} ${s[2]}`; }
    else { st.cls = "tie"; st.msg = "Égalité"; }
    st.used.add(st.pick);
  }
  function view() {
    if (!ov || !st) return;
    const total = st.hand.length, over = st.shown && st.round >= total - 1;
    const my = st.pick >= 0 ? st.hand[st.pick] : null, foe = st.shown ? st.foes[st.round] : null;
    let body = "";
    if (over) {
      const res = st.me > st.ai ? "Victoire !" : st.me < st.ai ? "Défaite" : "Match nul";
      body = `<div class="bt-res ${st.me > st.ai ? "win" : st.me < st.ai ? "lose" : "tie"}">${res} ${st.me} – ${st.ai}</div><div class="tcg-actions"><button type="button" class="cta-btn fill-btn" data-bt="again">Rejouer</button><button type="button" class="cta-btn btn-ghost" data-bt="close">Fermer</button></div>`;
    } else if (st.shown) {
      body = `<div class="tcg-actions"><button type="button" class="cta-btn fill-btn" data-bt="next">Manche suivante</button></div>`;
    } else if (my) {
      body = `<div class="bt-stats">${STATS.map((s) => `<button type="button" class="cta-btn fill-btn" data-stat="${s[0]}">${s[1]} · ${val(my, s[0]) || "—"} ${s[2]}</button>`).join("")}</div>`;
    } else {
      body = `<p class="tcg-hint">Choisis la carte que tu joues</p><div class="bt-hand">${st.hand.map((c, i) => `<button type="button" class="pick ${st.used.has(i) ? "used" : ""}" data-h="${i}" aria-label="${C.esc(c.brand + " " + c.model)}">${card(c)}</button>`).join("")}</div>`;
    }
    ov.querySelector(".bt").innerHTML = `<h2>Bataille de cartes</h2>
      <div class="bt-score"><span>Toi <b>${st.me}</b></span><span>Manche ${Math.min(st.round + 1, total)} / ${total}</span><span>Adversaire <b>${st.ai}</b></span></div>
      <div class="bt-field"><div>${my ? card(my) : `<div class="bt-hidden">?</div>`}</div><span class="bt-vs">VS</span><div>${foe ? card(foe) : `<div class="bt-hidden">MOTOR<br>AUTO</div>`}</div></div>
      ${st.shown && !over ? `<div class="bt-res ${st.cls}" role="status">${C.esc(st.msg)}</div>` : over ? `<p class="bt-note">${C.esc(st.msg)}</p>` : ""}
      ${body}
      <p class="bt-note">Entraînement : la bataille ne rapporte aucune récompense.</p>`;
    const f = ov.querySelector("[data-bt],[data-stat],[data-h]:not(.used)"); if (f) f.focus({ preventScroll: true });
  }
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
        else if (b.dataset.bt === "next") { st.round++; st.pick = -1; st.shown = false; st.msg = ""; view(); }
      } else if (h && !st.shown && st.pick < 0) { st.pick = Number(h.dataset.h); view(); }
      else if (s && st.pick >= 0 && !st.shown) { play(s.dataset.stat); view(); }
    });
    view();
  }
  window.MABattle = { open };
  (window.MAModules = window.MAModules || []).push(function (ctx) { C = ctx; });
})();
