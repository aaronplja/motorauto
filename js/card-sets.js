/**
 * MOTORAUTO — sets de cartes (Jouer › Cartes) : une famille par marque ou carrosserie ; la compléter donne des cristaux + un badge.
 *   set_claims/{uid}  { done: { "brand:Peugeot": ms, … } }  (écrit par le serveur : fonction claimSets)
 */
(function () {
  "use strict";
  let C = null, claims = null, claimsUid = "", busy = false, open = false, tick = 0;
  const G = () => window.MAGameCore;

  async function loadClaims() {
    if (!C.user) { claims = {}; return; }
    if (claims && claimsUid === C.user.uid) return;
    try { const s = await C.db.collection("set_claims").doc(C.user.uid).get(); claims = s.exists ? (s.data().done || {}) : {}; } catch (_) { claims = {}; }
    claimsUid = C.user.uid;
  }
  function render() {
    const hero = document.getElementById("tcg-hero"); if (!hero || !window.MACards || !G()) return;
    const doc = window.MACards.mine(); if (!doc) return;
    let box = document.getElementById("tcg-sets");
    if (!box) { box = document.createElement("section"); box.id = "tcg-sets"; box.className = "tcg-sets"; hero.insertAdjacentElement("afterend", box); }
    const sets = G().setsOf(C.cars).map((s) => { const have = s.ids.filter((id) => (doc.owned[id] || 0) > 0).length; return Object.assign({ have, done: !!(claims && claims[s.id]), full: have === s.ids.length }, s); });
    const ready = sets.filter((s) => s.full && !s.done), mine = sets.filter((s) => !s.done).sort((a, b) => b.have / b.ids.length - a.have / a.ids.length).slice(0, open ? 40 : 3);
    const finished = sets.filter((s) => s.done).length, esc = C.esc;
    box.innerHTML = `<div class="sets-head"><b>🧩 Sets de cartes</b><span class="lap-meta">${finished} / ${sets.length} complétés</span>${ready.length ? `<button type="button" class="cta-btn fill-btn compact-btn" data-set-claim ${busy ? "disabled" : ""}>Récupérer ${ready.reduce((t, s) => t + s.reward, 0)} 💎</button>` : ""}</div>
      <div class="sets-list">${mine.map((s) => { const pct = Math.round(s.have / s.ids.length * 100); return `<div class="set-row${s.full ? " full" : ""}"><span><b>${esc(s.name)}</b><small>${s.have} / ${s.ids.length} · +${s.reward} 💎</small></span><div class="xp-bar"><i style="width:${pct}%"></i></div></div>`; }).join("") || `<p class="lap-meta">Tous les sets sont complétés, bravo !</p>`}</div>
      <button type="button" class="cta-btn btn-ghost compact-btn" data-set-more>${open ? "Réduire" : "Voir tous les sets"}</button>`;
  }
  async function claim() {
    if (busy) return; busy = true; render();
    try {
      const r = await window.MAGameAPI.call("claimSets", {});
      claims = r.done || claims;
      if (r.claimed && r.claimed.length) C.toast("🧩 " + r.claimed.map((x) => x.name).join(", ") + " : +" + r.total + " cristaux !", "ok"); else C.toast("Aucun set à récupérer.", "ok");
      if (window.MACards.load) await window.MACards.load(true);
    } catch (e) { C.toast(e.message || "Impossible pour l'instant.", "err"); }
    busy = false; render();
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    const obs = new MutationObserver(() => { clearTimeout(tick); tick = setTimeout(async () => { await loadClaims(); render(); }, 120); });
    const watch = () => { const h = document.getElementById("tcg-hero"); if (h && !h._setsObs) { h._setsObs = true; obs.observe(h, { childList: true }); } };
    watch(); window.addEventListener("hashchange", () => setTimeout(watch, 200)); setInterval(watch, 2000);
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-set-claim]")) claim();
      else if (e.target.closest("[data-set-more]")) { open = !open; render(); }
    });
  });
})();
