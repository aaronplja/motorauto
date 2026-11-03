/**
 * MOTORAUTO — clubs : calendrier des sorties (inscription des membres) et classement interne (XP · cartes · chronos).
 *   club_events/{auto}          { clubId, title, place, dateMs, desc, uid, name, createdAt }   (créé par président / vice-président)
 *   club_event_rsvp/{event_uid} { eventId, clubId, uid, name, createdAt }
 */
(function () {
  "use strict";
  let C = null, busy = false, tab = "xp", timer = 0;
  const ms = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);
  const fmt = (t) => new Date(t).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const staff = (club) => !!C.user && (C.isAdmin || club.ownerUid === C.user.uid || club.viceUid === C.user.uid);

  async function rankRows(id) {
    const members = window.MAClubs.membersOf(id), uids = members.map((m) => m.uid), nameOf = new Map(members.map((m) => [m.uid, m.name]));
    if (tab === "xp") { const xp = await window.MAClubs.xpMap(); return members.map((m) => ({ n: m.name, uid: m.uid, v: xp(m.uid), u: "XP" })).sort((a, b) => b.v - a.v); }
    if (tab === "cards") {
      const out = [];
      await Promise.all(uids.slice(0, 60).map(async (u) => { try { const s = await C.db.collection("collections").doc(u).get(); out.push({ n: nameOf.get(u), uid: u, v: s.exists ? s.data().count || 0 : 0, u: "cartes" }); } catch (_) { out.push({ n: nameOf.get(u), uid: u, v: 0, u: "cartes" }); } }));
      return out.sort((a, b) => b.v - a.v);
    }
    // chronos : meilleur temps de chaque membre sur le circuit le plus roulé par le club
    let laps = []; try { laps = (await C.db.collection("global_laps").limit(1500).get()).docs.map((d) => d.data()); } catch (_) { /* règles */ }
    const set = new Set(uids), mine = laps.filter((l) => set.has(l.pilotUid)), cnt = new Map();
    mine.forEach((l) => cnt.set(l.trackKey || l.track, (cnt.get(l.trackKey || l.track) || 0) + 1));
    const top = Array.from(cnt.entries()).sort((a, b) => b[1] - a[1])[0]; if (!top) return [];
    const best = new Map();
    mine.filter((l) => (l.trackKey || l.track) === top[0]).forEach((l) => { const c = best.get(l.pilotUid); if (!c || l.chronoMs < c.chronoMs) best.set(l.pilotUid, l); });
    return Array.from(best.values()).sort((a, b) => a.chronoMs - b.chronoMs).map((l) => ({ n: nameOf.get(l.pilotUid) || l.pilot, uid: l.pilotUid, v: l.chrono, u: l.track, raw: true }));
  }
  async function render() {
    const root = document.getElementById("club-root"), id = window.MAClubs && window.MAClubs.current(); if (!root || !id || document.getElementById("club-plus")) return;
    const club = window.MAClubs.club(id); if (!club) return;
    const box = document.createElement("section"); box.id = "club-plus"; box.className = "club-plus"; box.innerHTML = `<div class="empty-note">Chargement…</div>`;
    const head = root.querySelector(".club-head"); head ? head.insertAdjacentElement("afterend", box) : root.prepend(box);
    const esc = C.esc, mem = window.MAClubs.isMemberOf(id);
    let events = [], rsvp = [];
    try {
      events = (await C.db.collection("club_events").where("clubId", "==", id).limit(40).get()).docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((e) => e.dateMs > Date.now() - 6 * 3600000).sort((a, b) => a.dateMs - b.dateMs);
      rsvp = (await C.db.collection("club_event_rsvp").where("clubId", "==", id).limit(500).get()).docs.map((d) => d.data());
    } catch (_) { /* règles non publiées */ }
    const rows = await rankRows(id).catch(() => []);
    const evHtml = events.length ? events.map((e) => { const going = rsvp.filter((r) => r.eventId === e.id), me = C.user && going.some((r) => r.uid === C.user.uid);
      return `<div class="cev"><div class="cev-date"><b>${new Date(e.dateMs).getDate()}</b><small>${new Date(e.dateMs).toLocaleString("fr-FR", { month: "short" })}</small></div><div class="cev-main"><b>${esc(e.title)}</b><small>${esc(fmt(e.dateMs))}${e.place ? " · " + esc(e.place) : ""}</small>${e.desc ? `<small>${esc(e.desc)}</small>` : ""}<small>${going.length} inscrit${going.length > 1 ? "s" : ""}</small></div>
        <div class="cev-act">${mem ? `<button type="button" class="cta-btn ${me ? "btn-ghost" : "fill-btn"} compact-btn" data-cev-go="${esc(e.id)}" data-on="${me ? 1 : 0}">${me ? "Je ne viens plus" : "Je participe"}</button>` : ""}${staff(club) ? `<button type="button" class="cmt-del" data-cev-del="${esc(e.id)}" aria-label="Supprimer la sortie">🗑</button>` : ""}</div></div>`; }).join("") : `<p class="lap-meta">Aucune sortie prévue pour l'instant.</p>`;
    const form = staff(club) ? `<form id="cev-form" class="cev-form" novalidate><input type="text" id="cev-t" maxlength="80" placeholder="Titre de la sortie" required><input type="datetime-local" id="cev-d" required><input type="text" id="cev-p" maxlength="100" placeholder="Lieu"><input type="text" id="cev-x" maxlength="300" placeholder="Détails (facultatif)"><button type="submit" class="cta-btn fill-btn compact-btn">Ajouter au calendrier</button></form>` : "";
    const unit = { xp: "XP", cards: "cartes", laps: "" };
    box.innerHTML = `<h3 class="panel-section-title">📅 Prochaines sorties</h3>${evHtml}${form}
      <h3 class="panel-section-title" style="margin-top:1.2rem">🏆 Classement du club</h3>
      <div class="a11y-row seg-mini" role="tablist"><button type="button" data-cr="xp" aria-pressed="${tab === "xp"}">XP</button><button type="button" data-cr="cards" aria-pressed="${tab === "cards"}">Cartes</button><button type="button" data-cr="laps" aria-pressed="${tab === "laps"}">Chronos</button></div>
      <ol class="club-rank">${rows.length ? rows.slice(0, 10).map((r, i) => `<li><span class="rk">${i + 1}</span><a href="#/pilote/${encodeURIComponent(r.uid)}">${esc(r.n || "Pilote")}</a><b>${esc(String(r.raw ? r.v : Number(r.v).toLocaleString("fr-FR")))}</b><small>${esc(r.raw ? r.u : unit[tab])}</small></li>`).join("") : `<li class="lap-meta">Pas encore de données.</li>`}</ol>`;
  }
  const refresh = () => { const b = document.getElementById("club-plus"); if (b) b.remove(); render(); };
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    const obs = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(render, 150); });
    const watch = () => { const r = document.getElementById("club-root"); if (r && !r._plusObs) { r._plusObs = true; obs.observe(r, { childList: true }); } };
    watch(); window.addEventListener("hashchange", () => setTimeout(watch, 200)); setInterval(watch, 2000);
    document.addEventListener("click", async (e) => {
      const cr = e.target.closest("[data-cr]"); if (cr) { tab = cr.dataset.cr; refresh(); return; }
      const go = e.target.closest("[data-cev-go]");
      if (go && !busy) {
        if (!C.requireLogin()) return; busy = true; const id = go.dataset.cevGo, club = window.MAClubs.current();
        try {
          const ref = C.db.collection("club_event_rsvp").doc(id + "_" + C.user.uid);
          if (go.dataset.on === "1") await ref.delete(); else await ref.set({ eventId: id, clubId: club, uid: C.user.uid, name: C.pilotName().slice(0, 40), createdAt: C.FieldValue.serverTimestamp() });
          refresh();
        } catch (x) { C.toast("Action impossible : " + x.message, "err"); }
        busy = false; return;
      }
      const del = e.target.closest("[data-cev-del]");
      if (del && confirm("Supprimer cette sortie ?")) { try { await C.db.collection("club_events").doc(del.dataset.cevDel).delete(); refresh(); } catch (x) { C.toast("Suppression impossible : " + x.message, "err"); } }
    });
    document.addEventListener("submit", async (e) => {
      if (e.target.id !== "cev-form") return; e.preventDefault();
      const t = document.getElementById("cev-t").value.trim(), d = Date.parse(document.getElementById("cev-d").value);
      if (t.length < 3 || !d) { C.toast("Indique un titre et une date.", "err"); return; }
      try {
        await C.db.collection("club_events").add({ clubId: window.MAClubs.current(), title: t.slice(0, 80), place: document.getElementById("cev-p").value.trim().slice(0, 100), dateMs: d, desc: document.getElementById("cev-x").value.trim().slice(0, 300), uid: C.user.uid, name: C.pilotName().slice(0, 40), createdAt: C.FieldValue.serverTimestamp() });
        refresh();
      } catch (x) { C.toast("Ajout impossible : " + x.message, "err"); }
    });
  });
})();
