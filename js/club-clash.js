/**
 * MOTORAUTO — défi de clubs de la semaine : deux clubs de taille proche s'affrontent, les points de saison gagnés
 * par leurs membres s'additionnent ; le club gagnant donne un titre et des cristaux à ses membres actifs (calcul serveur).
 */
(function () {
  "use strict";
  let C = null, busy = false;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  async function paint() {
    const root = document.getElementById("club-root"), id = window.MAClubs && window.MAClubs.current(); if (!root || !id || !C.user || busy) return;
    if (document.getElementById("club-clash")) return;
    busy = true;
    try {
      const r = await window.MAGameAPI.call("clubClash"), esc = C.esc;
      if (!document.getElementById("club-root") || document.getElementById("club-clash")) return;
      const mine = (r.pairs || []).find((p) => p.a === id || p.b === id), opp = mine ? (mine.a === id ? mine.bn : mine.an) : "";
      const last = (r.prev.results || []).find((p) => p.a === id || p.b === id);
      let lastTxt = "";
      if (last) { const my = last.a === id ? last.as : last.bs, th = last.a === id ? last.bs : last.as, o = last.a === id ? last.bn : last.an;
        lastTxt = `<p class="clash-last ${last.win === id ? "won" : last.win ? "lost" : ""}">${T("Semaine dernière")} : ${my} pts ${T("contre")} ${th} pts (${esc(o)}) — ${last.win === id ? T("victoire") : last.win ? T("défaite") : T("égalité")}</p>`; }
      const box = document.createElement("section"); box.id = "club-clash"; box.className = "club-clash";
      box.innerHTML = `<h3>${T("Défi de clubs")}</h3>${mine ? `<p>${T("Cette semaine, ton club affronte")} <b>${esc(opp)}</b>. ${T("Chaque point de saison gagné par un membre compte. Le gagnant offre le titre « Champion de club » et")} ${r.prize} ${T("cristaux aux membres actifs.")}</p>` : `<p class="lap-meta">${T("Pas d'adversaire cette semaine : il faut au moins 2 membres et un autre club de taille proche.")}</p>`}${lastTxt}`;
      const head = root.querySelector(".club-head"); (head ? head.insertAdjacentElement("afterend", box) : root.prepend(box));
    } catch (_) { /* défi facultatif */ }
    busy = false;
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.Router.register("club", { enter: () => { setTimeout(paint, 900); setTimeout(paint, 2500); } });
  });
})();
