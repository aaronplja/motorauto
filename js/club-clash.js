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
  /** objectif d'équipe : cartes ouvertes ensemble dans la semaine, récompense pour chaque membre actif */
  let gbusy = false;
  async function paintGoal() {
    const root = document.getElementById("club-root"), id = window.MAClubs && window.MAClubs.current(); if (!root || !id || !C.user || gbusy) return;
    if (document.getElementById("club-goal")) return;
    gbusy = true;
    try {
      const r = await window.MAGameAPI.call("clubGoal"), esc = C.esc;
      if (!document.getElementById("club-root") || document.getElementById("club-goal") || !r || r.none || r.clubId !== id) return;
      const pct = Math.min(100, Math.round((r.total / r.goal) * 100)), can = r.reached && r.mine >= r.minSelf && !r.claimed;
      const note = r.claimed ? T("Récompense déjà récupérée cette semaine.") : r.reached ? (r.mine >= r.minSelf ? T("Objectif atteint : récupère ta récompense !") : `${T("Objectif atteint ! Ouvre au moins")} ${r.minSelf} ${T("cartes toi-même pour toucher la récompense.")}`) : `${T("Ouvre des packs : chaque carte compte pour tout le club.")}`;
      const box = document.createElement("section"); box.id = "club-goal"; box.className = "club-clash club-goal";
      box.innerHTML = `<h3>🤝 ${T("Objectif d'équipe")}</h3><p>${T("Ouvrez ensemble")} <b>${r.goal}</b> ${T("cartes cette semaine : chaque membre actif gagne")} <b>${r.reward.dust}</b> ${T("cristaux et")} <b>${r.reward.bonus}</b> ${T("pack bonus.")}</p>
        <div class="cg-gauge" role="progressbar" aria-valuemin="0" aria-valuemax="${r.goal}" aria-valuenow="${Math.min(r.total, r.goal)}" style="height:10px;border-radius:99px;background:var(--stroke-line);overflow:hidden"><i style="display:block;height:100%;width:${pct}%;background:var(--accent);border-radius:99px"></i></div>
        <p class="lap-meta">${r.total} / ${r.goal} ${T("cartes")} · ${T("tes cartes")} : ${r.mine} · ${esc(note)}</p>${can ? `<button type="button" class="cta-btn fill-btn" id="club-goal-claim">${T("Récupérer la récompense")}</button>` : ""}`;
      const anchor = document.getElementById("club-clash") || root.querySelector(".club-head");
      if (anchor) anchor.insertAdjacentElement("afterend", box); else root.prepend(box);
      const btn = box.querySelector("#club-goal-claim");
      if (btn) btn.addEventListener("click", async () => {
        btn.disabled = true;
        try { const x = await window.MAGameAPI.call("clubGoalClaim"); C.toast("🤝 +" + x.reward.dust + " cristaux et " + x.reward.bonus + " pack bonus !", "ok"); box.remove(); paintGoal(); }
        catch (e) { C.toast(e.message, "err"); btn.disabled = false; }
      });
    } catch (_) { /* objectif facultatif */ }
    gbusy = false;
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.Router.register("club", { enter: () => { setTimeout(paint, 900); setTimeout(paint, 2500); setTimeout(paintGoal, 1300); setTimeout(paintGoal, 3000); } });
  });
})();
