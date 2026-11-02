/**
 * MOTORAUTO — accueil personnalisé (pilote connecté) : voiture du jour, prochain événement, progression de l'album, nouveautés des clubs.
 * Aucune collection nouvelle : tout vient de ce que le pilote a déjà (rsvps, club_members, collections).
 */
(function () {
  "use strict";
  let C = null, token = 0;
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);
  const day = () => new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
  const hash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const when = (ms) => new Date(ms).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  function carOfDay() {
    const list = (C.cars || []).filter((c) => c && c.image && c.stats && c.stats.power > 0); if (!list.length) return "";
    const c = list[hash("cotd-" + day()) % list.length], esc = C.esc;
    return `<a class="hm-card hm-car" href="#/voiture/${encodeURIComponent(c.id)}"><span class="hm-k">Voiture du jour</span><img src="${esc(c.image)}" alt="" loading="lazy" decoding="async"><b>${esc(c.brand)} ${esc(String(c.model).replace(/\s*\(.*$/, ""))}</b><small>${c.stats.power} ch${c.years ? " · " + esc(c.years) : ""}</small></a>`;
  }
  async function nextEvent(uid) {
    try {
      const rs = await C.db.collection("rsvps").where("uid", "==", uid).limit(60).get();
      const ids = rs.docs.map((d) => d.data().event).filter(Boolean);
      const docs = await Promise.all(ids.slice(0, 30).map((id) => C.db.collection("events").doc(id).get().catch(() => null)));
      const evs = docs.filter((d) => d && d.exists).map((d) => Object.assign({ id: d.id }, d.data())).filter((e) => e.dateMs > Date.now()).sort((a, b) => a.dateMs - b.dateMs);
      const e = evs[0], esc = C.esc;
      if (!e) return `<a class="hm-card" href="#/communaute/evenements"><span class="hm-k">Ton prochain événement</span><b>Aucun pour le moment</b><small>Découvre les sorties près de chez toi</small></a>`;
      return `<a class="hm-card" href="#/communaute/evenements"><span class="hm-k">Ton prochain événement</span><b>${esc(e.title)}</b><small>${esc(when(e.dateMs))}${e.city ? " · " + esc(e.city) : ""}</small></a>`;
    } catch (_) { return ""; }
  }
  async function album() {
    try {
      const M = window.MACards, G = window.MAGameCore; if (!M || !G) return "";
      await M.load().catch(() => {});
      const d = M.mine(); if (!d) return "";
      const sets = G.setsOf(M.pool()).map((s) => ({ s, have: s.ids.filter((id) => (d.owned || {})[id] > 0).length })).filter((x) => x.have < x.s.ids.length && !(d.claimed || []).includes(x.s.id));
      sets.sort((a, b) => b.have / b.s.ids.length - a.have / a.s.ids.length);
      const x = sets[0], esc = C.esc;
      if (!x) return `<a class="hm-card" href="#/jouer/cartes"><span class="hm-k">Ton album</span><b>Collection à jour</b><small>Ouvre un pack pour continuer</small></a>`;
      const p = Math.round((x.have / x.s.ids.length) * 100);
      return `<a class="hm-card" href="#/jouer/cartes"><span class="hm-k">Ton album le plus avancé</span><b>${esc(x.s.name)}</b><small>${x.have} / ${x.s.ids.length} cartes</small><span class="hm-bar"><i style="width:${p}%"></i></span></a>`;
    } catch (_) { return ""; }
  }
  async function clubs(uid) {
    try {
      const ms = await C.db.collection("club_members").where("uid", "==", uid).limit(10).get();
      const mine = ms.docs.map((d) => d.data().clubId); if (!mine.length) return `<a class="hm-card" href="#/communaute/clubs"><span class="hm-k">Tes clubs</span><b>Rejoins un club</b><small>Marque ou région, fil et sorties</small></a>`;
      const ps = await C.db.collection("club_posts").where("clubId", "in", mine).limit(30).get();
      const posts = ps.docs.map((d) => d.data()).filter((p) => p.uid !== uid).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
      const p = posts[0], esc = C.esc;
      if (!p) return `<a class="hm-card" href="#/communaute/clubs"><span class="hm-k">Tes clubs</span><b>Rien de nouveau</b><small>${mine.length} club${mine.length > 1 ? "s" : ""}</small></a>`;
      return `<a class="hm-card" href="#/club/${encodeURIComponent(p.clubId)}"><span class="hm-k">Nouveautés de tes clubs</span><b>${esc(p.name || "Pilote")}</b><small>${esc(String(p.text).slice(0, 90))}</small></a>`;
    } catch (_) { return ""; }
  }
  async function render() {
    const page = document.getElementById("page-home"), hero = page && page.querySelector(".hero-stage"); if (!hero) return;
    let box = document.getElementById("home-me");
    if (!C.user) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement("section"); box.id = "home-me"; box.className = "home-me stage-shell"; box.setAttribute("aria-label", "Pour toi"); hero.insertAdjacentElement("afterend", box); }
    const t = ++token, name = (C.pilotName && C.pilotName()) || "pilote";
    box.innerHTML = `<h2 class="hm-title">Salut ${C.esc(name)}</h2><div class="hm-grid">${carOfDay()}</div>`;
    const parts = await Promise.all([nextEvent(C.user.uid), album(), clubs(C.user.uid)]);
    if (t !== token) return;
    box.querySelector(".hm-grid").insertAdjacentHTML("beforeend", parts.join(""));
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.Router.register("home", { enter: render });
    document.addEventListener("ma:auth", () => { if (ctx.Router.is("home")) render(); });
  });
})();
