/**
 * MOTORAUTO — concours photo mensuel (Jouer › Concours).
 * Chaque mois : un thème, une photo par pilote (validée par la modération), un vote par pilote (jamais pour soi).
 * Le 1er du mois, le serveur clôture le concours : le gagnant reçoit le badge « Photographe du mois » et une carte spéciale unique.
 *   contests/{yyyy-mm}                { month, theme, status: open|closed, winnerUid, results, … }       (écrit par l'admin / le serveur)
 *   contest_entries/{yyyy-mm_uid}     { contest, uid, name, avatar, photo, carName, caption, status: pending|approved|rejected, createdAt }
 *   contest_votes/{yyyy-mm_uid}       { contest, uid, entry, createdAt }                                  (1 vote par pilote et par mois)
 * Les photos sont stockées dans car_photos/{uid}/ (règles Storage inchangées).
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, month = "", contest = null, entries = [], votes = [], mine = null, past = [], loadedAt = 0, busy = false, err = "", formOpen = false;
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);

  /** concours mis en avant : le dernier concours personnalisé ouvert, sinon celui du mois (même clôturé) */
  function featured(list) {
    const open = list.filter((c) => c.status === "open" && c.custom).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
    return open[0] || list.find((c) => c.id === G.monthKey()) || null;
  }
  const dateFr = (d) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  /** date de fin (réglable par l'admin ; sinon fin du mois pour le concours mensuel) : « jusqu'au 15 novembre 2026 · fin dans 3 jours » */
  function endDate(c) {
    if (c && c.endsAt && /^\d{4}-\d{2}-\d{2}$/.test(c.endsAt)) return new Date(c.endsAt + "T23:59:59");
    if (c && /^\d{4}-\d{2}$/.test(c.id || "")) { const [y, m] = c.id.split("-").map(Number); return new Date(y, m, 0, 23, 59, 59); }
    return null;
  }
  const endText = (c) => {
    if (!c || c.status !== "open") return "concours terminé";
    const e = endDate(c); if (!e) return "";
    const d = Math.ceil((e - Date.now()) / 86400000);
    return "jusqu'au " + dateFr(e) + (d >= 1 ? " · " + (d === 1 ? "dernier jour" : "fin dans " + d + " jours") : " · se termine aujourd'hui");
  };
  async function load(force) {
    if (!force && loadedAt && Date.now() - loadedAt < 15000) return;
    month = G.monthKey(); err = "";
    const all = await C.db.collection("contests").limit(60).get().catch((e) => { err = "Concours indisponible (règles Firestore à publier ?)."; return null; });
    const list = all ? all.docs.map((d) => Object.assign({ id: d.id }, d.data())) : [];
    contest = featured(list);
    if (contest) month = contest.id;
    past = list.filter((c) => c.status === "closed" && (!contest || c.id !== contest.id)).sort((a, b) => (tsMs(b.createdAt) - tsMs(a.createdAt)) || (a.id < b.id ? 1 : -1)).slice(0, 6);
    entries = []; votes = []; mine = null;
    if (contest) {
      const [er, vr, my] = await Promise.all([
        C.db.collection("contest_entries").where("contest", "==", month).where("status", "==", "approved").limit(300).get().catch(() => null),
        C.db.collection("contest_votes").where("contest", "==", month).limit(3000).get().catch(() => null),
        C.user ? C.db.collection("contest_entries").doc(month + "_" + C.user.uid).get().catch(() => null) : null
      ]);
      if (er) entries = er.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      if (vr) votes = vr.docs.map((d) => d.data());
      if (my && my.exists) mine = Object.assign({ id: my.id }, my.data());
    }
    loadedAt = Date.now();
  }

  const tally = () => { const m = new Map(); votes.forEach((v) => m.set(v.entry, (m.get(v.entry) || 0) + 1)); return m; };
  const myVote = () => (C.user ? (votes.find((v) => v.uid === C.user.uid) || {}).entry || "" : "");

  function heroHtml() {
    const esc = C.esc, open = contest && contest.status === "open";
    if (!contest) return `<div class="contest-hero off"><span class="contest-kicker">${esc(G.monthLabel(G.monthKey()))}</span><h3>Pas de concours en ce moment</h3><p class="lap-meta">Un thème, une photo par pilote, un vote de la communauté.</p>
      ${C.isAdmin ? `<button type="button" class="cta-btn fill-btn mt" data-contest-open>Lancer le concours du mois</button>` : ""}</div>`;
    const kick = contest.custom ? "Concours photo" : "Concours photo · " + G.monthLabel(contest.id);
    return `<div class="contest-hero"><span class="contest-kicker">${esc(kick)}</span><h3>« ${esc(contest.theme)} »</h3>
      ${contest.desc ? `<p class="contest-desc">${esc(contest.desc)}</p>` : ""}
      <p class="lap-meta">${entries.length} participant${entries.length > 1 ? "s" : ""} · ${votes.length} vote${votes.length > 1 ? "s" : ""} · ${esc(endText(contest))}</p>
      <p class="contest-prize">🏆 ${contest.prize ? esc(contest.prize) : "Le gagnant reçoit le badge <b>Photographe du mois</b> et une <b>carte spéciale</b> unique ; 2ᵉ et 3ᵉ gagnent des cristaux."}</p></div>`;
  }
  function participation() {
    const esc = C.esc;
    if (!contest || contest.status !== "open") return "";
    if (!C.user) return `<div class="contest-box"><b>Participe !</b> <button type="button" class="cta-btn fill-btn compact-btn" data-action="open-auth">Me connecter</button></div>`;
    if (mine) {
      const st = { pending: ["⏳ Ta photo est en attente de validation par la modération.", "pending"], approved: ["✅ Ta photo participe au concours. Bonne chance !", "approved"], rejected: ["❌ Ta photo n'a pas été retenue. Tu peux en envoyer une autre.", "rejected"] }[mine.status] || ["", ""];
      return `<div class="contest-box ${st[1]}"><span>${st[0]}</span>${mine.photo ? `<img class="contest-thumb" src="${esc(C.safeUrl(mine.photo) || "")}" alt="Ta photo">` : ""}<button type="button" class="cta-btn btn-ghost compact-btn" data-contest-del>Retirer ma photo</button></div>`;
    }
    if (!formOpen) return `<div class="contest-box"><span><b>Envoie ta plus belle photo</b> sur le thème du concours.</span><button type="button" class="cta-btn fill-btn compact-btn" data-contest-form>📸 Participer</button></div>`;
    return `<form class="contest-box contest-form" id="contest-form" novalidate><div class="input-stack"><label for="ct-photo">Photo (JPG, PNG…)</label><input type="file" id="ct-photo" accept="image/*" required></div>
      <div class="input-stack"><label for="ct-car">Voiture</label><input type="text" id="ct-car" maxlength="80" placeholder="Ex. Peugeot 106 S16" required></div>
      <div class="input-stack"><label for="ct-cap">Légende (facultatif)</label><input type="text" id="ct-cap" maxlength="100" placeholder="Une phrase sur ta photo"></div>
      <p class="form-error" id="ct-err" role="alert"></p><div class="contest-actions"><button type="submit" class="cta-btn fill-btn" id="ct-send">Envoyer ma photo</button><button type="button" class="cta-btn btn-ghost" data-contest-cancel>Annuler</button></div>
      <small class="lap-meta">Ta photo est publiée tout de suite. Une seule photo par concours.</small></form>`;
  }
  function gallery() {
    const esc = C.esc, t = tally(), mv = myVote(), open = contest && contest.status === "open";
    const list = entries.slice().sort((a, b) => (t.get(b.id) || 0) - (t.get(a.id) || 0) || tsMs(a.createdAt) - tsMs(b.createdAt));
    if (!list.length) return contest ? `<div class="empty-note">Aucune photo validée pour l'instant : sois le premier !</div>` : "";
    return `<h3 class="sec-title">Les photos en lice</h3><div class="contest-grid">${list.map((e) => {
      const n = t.get(e.id) || 0, own = C.user && e.uid === C.user.uid, voted = mv === e.id;
      return `<article class="photo-card ${voted ? "voted" : ""}"><button type="button" class="photo-open" data-photo="${esc(e.photo)}" data-cap="${esc(e.caption || e.carName || "")}" aria-label="Agrandir la photo de ${esc(e.name)}"><img src="${esc(C.safeUrl(e.photo) || "")}" alt="${esc(e.caption || "Photo de " + e.name)}" loading="lazy" data-fallback="car"></button>
        <div class="photo-meta"><div><a href="#/pilote/${encodeURIComponent(e.uid)}"><b>${esc(e.name)}</b></a><small>${esc(e.carName || "")}</small></div>
        ${open ? (own ? `<span class="vote-pill own">${n} ♥</span>` : `<button type="button" class="vote-btn ${voted ? "on" : ""}" data-vote="${esc(e.id)}" aria-pressed="${voted}" aria-label="${voted ? "Retirer mon vote" : "Voter pour cette photo"}">♥ <b>${n}</b></button>`) : `<span class="vote-pill">${n} ♥</span>`}</div>${e.caption ? `<p class="photo-cap">${esc(e.caption)}</p>` : ""}</article>`;
    }).join("")}</div>`;
  }
  function hall() {
    if (!past.length) return "";
    const esc = C.esc;
    return `<h3 class="sec-title">Palmarès</h3><div class="hall">${past.map((c) => { const w = (c.results || [])[0]; return `<article class="hall-card"><span class="contest-kicker">${esc(G.monthLabel(c.id))}</span>${w && w.photo ? `<button type="button" class="photo-open" data-photo="${esc(w.photo)}" data-cap="${esc(c.theme)}"><img src="${esc(C.safeUrl(w.photo) || "")}" alt="Photo gagnante de ${esc(G.monthLabel(c.id))}" loading="lazy" data-fallback="car"></button>` : ""}<b>${w ? "🏆 " + esc(w.name) : "Pas de participant"}</b><small>« ${esc(c.theme)} »${w ? " · " + w.votes + " ♥" : ""}</small></article>`; }).join("")}</div>`;
  }
  function render() {
    const root = document.getElementById("contest-root"); if (!root) return;
    if (!loadedAt) { root.innerHTML = `<div class="tcg-skeleton" aria-busy="true"><i></i><i></i><i></i></div>`; return; }
    root.innerHTML = (err ? `<p class="tcg-alert">⚠ ${C.esc(err)}</p>` : "") + heroHtml() + participation() + gallery() + hall();
  }

  async function submit(e) {
    e.preventDefault();
    if (busy || !C.requireLogin()) return;
    const f = document.getElementById("ct-photo").files[0], car = document.getElementById("ct-car").value.trim().slice(0, 80), cap = document.getElementById("ct-cap").value.trim().slice(0, 100), errEl = document.getElementById("ct-err");
    if (!f || !/^image\//.test(f.type)) { errEl.textContent = "Choisis une photo."; return; }
    if (!car) { errEl.textContent = "Indique la voiture."; return; }
    busy = true; const btn = document.getElementById("ct-send"); btn.disabled = true; btn.textContent = "Envoi…";
    try {
      const blob = await C.MA.resizeImage(f, 1600, 0.85), ref = C.storage.ref(`car_photos/${C.user.uid}/contest_${month}_${Date.now()}.jpg`);
      await ref.put(blob, { contentType: "image/jpeg" });
      const photo = await ref.getDownloadURL(), p = C.profile || {};
      await C.db.collection("contest_entries").doc(month + "_" + C.user.uid).set({ contest: month, uid: C.user.uid, name: C.pilotName ? C.pilotName() : p.username || "Pilote", avatar: p.avatar || "", photo, carName: car, caption: cap, status: "approved", createdAt: C.FieldValue.serverTimestamp() });
      formOpen = false; C.toast("Photo publiée dans le concours 📸", "ok");
      await load(true);
    } catch (ex) { errEl.textContent = "Envoi impossible : " + (ex.code === "storage/unauthorized" ? "photo refusée par les règles Storage." : ex.message); busy = false; btn.disabled = false; btn.textContent = "Envoyer ma photo"; return; }
    busy = false; render();
  }
  async function vote(entryId) {
    if (busy || !C.requireLogin()) return;
    busy = true; const ref = C.db.collection("contest_votes").doc(month + "_" + C.user.uid), cur = myVote();
    try {
      if (cur === entryId) { await ref.delete(); C.toast("Vote retiré."); }
      else { await ref.set({ contest: month, uid: C.user.uid, entry: entryId, createdAt: C.FieldValue.serverTimestamp() }); C.toast(cur ? "Vote déplacé ♥" : "Vote enregistré ♥ (un seul vote par mois, tu peux le changer)", "ok"); }
      await load(true);
    } catch (ex) { C.toast("Vote impossible : " + ex.message, "err"); }
    busy = false; render();
  }
  function lightbox(src, cap) {
    const o = document.createElement("div"); o.className = "lightbox"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Photo");
    o.innerHTML = `<button type="button" class="lightbox-x" aria-label="Fermer">×</button><img src="${C.esc(C.safeUrl(src) || "")}" alt="${C.esc(cap || "")}">${cap ? `<p>${C.esc(cap)}</p>` : ""}`;
    const close = () => { o.remove(); document.removeEventListener("keydown", key); };
    const key = (e) => { if (e.key === "Escape") close(); };
    o.addEventListener("click", close); document.addEventListener("keydown", key); document.body.appendChild(o); o.querySelector("button").focus();
  }

  /** bandeau de l'accueil : seulement quand un concours est ouvert */
  async function homeBanner() {
    const box = document.getElementById("home-contest"); if (!box) return;
    try {
      const all = await C.db.collection("contests").limit(60).get();
      const list = all.docs.map((d) => Object.assign({ id: d.id }, d.data())), c = featured(list);
      if (!c || c.status !== "open") { box.hidden = true; box.innerHTML = ""; return; }
      let n = 0; try { n = (await C.db.collection("contest_entries").where("contest", "==", c.id).where("status", "==", "approved").limit(300).get()).size; } catch (_) {}
      const esc = C.esc;
      box.innerHTML = `<a class="home-contest-card" href="#/jouer/concours"><span class="hc-ico" aria-hidden="true">📸</span><div><small>Concours photo · ${esc(endText(c))}</small><b>« ${esc(c.theme)} »</b>${c.desc ? `<span>${esc(String(c.desc).slice(0, 110))}</span>` : ""}<em>${n} photo${n > 1 ? "s" : ""} en lice</em></div><i class="hc-go">Participer ➔</i></a>`;
      box.hidden = false;
    } catch (_) { box.hidden = true; }
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("home", { enter: () => { homeBanner(); } });
    ctx.Router.register("play", { enter: async (p) => {
      if (p.tab !== "concours") return;
      render();
      try { await load(true); } catch (e) { err = "Concours indisponible : " + e.message; loadedAt = Date.now(); }
      render();
    } });
    document.addEventListener("ma:auth", () => { loadedAt = 0; mine = null; if (ctx.Router.is("play", { tab: "concours" })) { render(); load(true).then(render); } });
    document.addEventListener("submit", (e) => { if (e.target.id === "contest-form") submit(e); });
    document.addEventListener("click", async (e) => {
      const t = e.target;
      if (t.closest("[data-contest-form]")) { if (C.requireLogin()) { formOpen = true; render(); const el = document.getElementById("ct-photo"); if (el) el.focus(); } return; }
      if (t.closest("[data-contest-cancel]")) { formOpen = false; render(); return; }
      const v = t.closest("[data-vote]"); if (v) { vote(v.dataset.vote); return; }
      const ph = t.closest("[data-photo]"); if (ph && ph.closest("#contest-root")) { lightbox(ph.dataset.photo, ph.dataset.cap); return; }
      if (t.closest("[data-contest-del]") && mine && confirm("Retirer ta photo du concours ?")) { try { await C.db.collection("contest_entries").doc(mine.id).delete(); mine = null; await load(true); render(); } catch (ex) { C.toast("Suppression impossible : " + ex.message, "err"); } return; }
      if (t.closest("[data-contest-open]")) { try { await window.MAGameAPI.call("adminContest", { action: "open" }); C.toast("Concours lancé.", "ok"); await load(true); render(); } catch (ex) { C.toast(ex.message, "err"); } }
    });
  });
})();
