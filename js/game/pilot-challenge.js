/**
 * MOTORAUTO — défis entre pilotes : sur le profil d'un pilote, « Défier en duel » (ta voiture contre la sienne)
 * et « Proposer un échange » (ouvre les échanges avec lui).
 */
(function () {
  "use strict";
  let C = null, token = 0;
  const first = async (uid) => { try { const s = await C.db.collection("community_cars").where("uid", "==", uid).limit(1).get(); return s.empty ? null : s.docs[0].id; } catch (_) { return null; } };
  async function render() {
    const m = /^#\/pilote\/([^/?#]+)/.exec(location.hash); const old = document.getElementById("pub-challenge");
    if (!m) { if (old) old.remove(); return; }
    const uid = decodeURIComponent(m[1]), my = ++token;
    if (!C.user || C.user.uid === uid) { if (old) old.remove(); return; }
    const anchor = document.getElementById("pub-social"); if (!anchor) return;
    const [theirs, mine] = await Promise.all([first(uid), first(C.user.uid)]);
    if (my !== token) return;
    const a = mine ? "com-" + mine : (C.cars[0] && C.cars[0].id), b = theirs ? "com-" + theirs : (C.cars[1] && C.cars[1].id);
    let box = document.getElementById("pub-challenge");
    if (!box) { box = document.createElement("div"); box.id = "pub-challenge"; box.className = "pub-challenge"; anchor.insertAdjacentElement("afterend", box); }
    box.innerHTML = `<a class="cta-btn fill-btn compact-btn" href="#/duel/${encodeURIComponent(a)}/${encodeURIComponent(b)}">⚔ Défier en duel</a><a class="cta-btn btn-ghost compact-btn" href="#/jouer/echanges" data-trade-with="${C.esc(uid)}">🔄 Proposer un échange</a>${theirs ? "" : `<small class="lap-meta">Il n'a pas encore ajouté de voiture : duel contre une fiche du catalogue.</small>`}`;
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx; window.addEventListener("hashchange", () => setTimeout(render, 450)); document.addEventListener("ma:auth", () => setTimeout(render, 450)); setTimeout(render, 900);
  });
})();
