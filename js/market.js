/**
 * MOTORAUTO — annonces entre pilotes (pièces à vendre / échanger / recherchées), avec photos et signalement.
 *   listings/{auto}          { uid, name, avatar, kind: sell|swap|wanted, title, desc, price, photos[], status: open|sold, createdAt }
 *   listing_reports/{id_uid} { listingId, title, sellerUid, reporter, reporterUid, reason, status: open|done, createdAt }
 * Les photos réutilisent le dossier Storage car_photos/{uid}/ (aucune règle Storage supplémentaire).
 */
(function () {
  "use strict";
  let C = null, list = [], kind = "all", q = "", files = [], busy = false;
  const KINDS = { sell: "À vendre", swap: "À échanger", wanted: "Recherché" };
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);
  const REASONS = { scam: "Arnaque / faux", illegal: "Contenu illégal", spam: "Spam / publicité", other: "Autre" };

  async function load() {
    const s = await C.db.collection("listings").where("status", "==", "open").limit(150).get();
    list = s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
  }
  async function loadMine() {
    if (!C.user) return [];
    const s = await C.db.collection("listings").where("uid", "==", C.user.uid).limit(60).get();
    return s.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((l) => l.status === "sold");
  }
  function card(l) {
    const esc = C.esc, own = C.user && C.user.uid === l.uid, ph = (l.photos || []).map((u) => C.safeUrl(u)).filter(Boolean)[0];
    return `<article class="mk-card ${l.status === "sold" ? "sold" : ""}"><img src="${esc(ph || "")}" alt="" loading="lazy" data-fallback="car">
      <div class="mk-body"><span class="mk-meta">${esc(KINDS[l.kind] || "")}${l.status === "sold" ? " · terminé" : ""}</span><h3>${esc(l.title)}</h3>${l.price > 0 ? `<span class="mk-price">${Number(l.price).toLocaleString("fr-FR")} €</span>` : ""}
      <p class="mk-meta">${esc(String(l.desc || "").slice(0, 160))}</p><span class="mk-meta">par <a href="#/pilote/${encodeURIComponent(l.uid)}">${esc(l.name || "Pilote")}</a> · ${window.MACommunity ? window.MACommunity.ago(tsMs(l.createdAt)) : ""}</span>
      <div class="mk-actions">${own ? `${l.status === "open" ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-mk="sold" data-id="${esc(l.id)}">Marquer terminé</button>` : ""}<button type="button" class="secondary-destructive-btn" data-mk="del" data-id="${esc(l.id)}">Supprimer</button>`
        : `<a class="cta-btn fill-btn compact-btn" href="chat.html#dm/${encodeURIComponent(l.uid)}">✉ Contacter</a><button type="button" class="cta-btn btn-ghost compact-btn" data-mk="report" data-id="${esc(l.id)}">Signaler</button>${C.isAdmin ? `<button type="button" class="secondary-destructive-btn" data-mk="del" data-id="${esc(l.id)}">Retirer</button>` : ""}`}</div></div></article>`;
  }
  async function render() {
    const root = document.getElementById("market-root"); if (!root) return;
    root.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try { await load(); mineCache = await loadMine(); } catch (e) { root.innerHTML = `<div class="empty-note error">Annonces indisponibles (règles Firestore à publier ?).</div>`; return; }
    draw();
  }
  let mineCache = [];
  function draw() {
    const root = document.getElementById("market-root"), mine = mineCache; if (!root) return;
    const n = C.normalize(q);
    const rows = list.filter((l) => (kind === "all" || l.kind === kind) && (!n || C.normalize(l.title + " " + l.desc).includes(n)));
    root.innerHTML = `<p class="lap-meta">⚠ Les transactions se font entre pilotes, hors du site : méfie-toi des paiements à l'avance, privilégie la remise en main propre, et signale toute annonce douteuse.</p>
      <div class="tcg-tools"><input type="search" id="mk-search" placeholder="Rechercher une pièce…" aria-label="Rechercher une annonce" value="${C.esc(q)}"><div class="chip-row" role="group" aria-label="Type d'annonce">${[["all", "Toutes"], ["sell", "À vendre"], ["swap", "À échanger"], ["wanted", "Recherchées"]].map(([k, l]) => `<button type="button" class="chip ${kind === k ? "active" : ""}" data-mk-kind="${k}" aria-pressed="${kind === k}">${l}</button>`).join("")}</div></div>
      <details class="mk-form-wrap" ${C.user ? "" : ""}><summary class="cta-btn fill-btn compact-btn">+ Déposer une annonce</summary>
        <form class="mk-form" id="mk-form" novalidate><div class="form-grid">
          <div class="input-stack"><label for="mk-kind">Type</label><select id="mk-kind" class="custom-select"><option value="sell">À vendre</option><option value="swap">À échanger</option><option value="wanted">Recherché</option></select></div>
          <div class="input-stack"><label for="mk-price">Prix (€, facultatif)</label><input type="number" id="mk-price" min="0" max="999999" inputmode="numeric"></div>
          <div class="input-stack wide"><label for="mk-title">Titre</label><input type="text" id="mk-title" maxlength="80" required placeholder="Ex. Kit distribution 106 S16"></div>
          <div class="input-stack wide"><label for="mk-desc">Description</label><textarea id="mk-desc" maxlength="500" rows="3" placeholder="État, compatibilité, lieu de remise…"></textarea></div>
          <div class="input-stack wide"><label for="mk-photos">Photos (3 maximum)</label><input type="file" id="mk-photos" accept="image/*" multiple></div></div>
        <div class="form-feedback error-txt" id="mk-error" role="alert"></div><button type="submit" class="cta-btn fill-btn" id="mk-submit">Publier</button></form></details>
      <div class="mk-grid">${rows.length ? rows.map(card).join("") : `<div class="empty-note" style="grid-column:1/-1">Aucune annonce pour ce filtre.</div>`}</div>
      ${mine.length ? `<h3 class="panel-section-title">Mes annonces terminées</h3><div class="mk-grid">${mine.map(card).join("")}</div>` : ""}`;
    document.getElementById("mk-form").addEventListener("submit", publish);
  }
  async function publish(e) {
    e.preventDefault();
    const err = document.getElementById("mk-error"); err.textContent = "";
    if (!C.requireLogin() || busy) return;
    if (window.MAMute && window.MAMute.active()) { err.textContent = window.MAMute.message(); return; }
    const title = document.getElementById("mk-title").value.trim().slice(0, 80);
    if (title.length < 3) { err.textContent = "Donne un titre à ton annonce."; return; }
    const fl = Array.from(document.getElementById("mk-photos").files || []).slice(0, 3);
    if (fl.some((f) => !/^image\//.test(f.type))) { err.textContent = "Seules les images sont acceptées."; return; }
    busy = true; const btn = document.getElementById("mk-submit"); btn.disabled = true; btn.textContent = "Envoi…";
    try {
      const photos = [];
      for (const f of fl) {
        const blob = await C.MA.resizeImage(f, 1200, 0.85), ref = C.storage.ref(`car_photos/${C.user.uid}/listing_${Date.now()}_${photos.length}.jpg`);
        await ref.put(blob, { contentType: "image/jpeg" }); photos.push(await ref.getDownloadURL());
      }
      const price = Math.max(0, Math.min(999999, parseInt(document.getElementById("mk-price").value, 10) || 0));
      await C.db.collection("listings").add({ uid: C.user.uid, name: C.pilotName().slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400),
        kind: document.getElementById("mk-kind").value, title, desc: document.getElementById("mk-desc").value.trim().slice(0, 500), price, photos, status: "open", createdAt: C.FieldValue.serverTimestamp() });
      C.toast("Annonce publiée.", "ok"); render();
    } catch (ex) { err.textContent = "Publication impossible : " + (ex.code === "storage/unauthorized" ? "photo refusée par les règles Storage." : ex.message); }
    finally { busy = false; }
  }
  async function act(a, id) {
    const l = list.find((x) => x.id === id) || {};
    try {
      if (a === "sold") await C.db.collection("listings").doc(id).update({ status: "sold" });
      else if (a === "del") { if (!confirm("Supprimer cette annonce ?")) return; await C.db.collection("listings").doc(id).delete(); if (C.isAdmin && l.uid !== (C.user && C.user.uid) && window.MALog) window.MALog.log("listing-delete", { target: id, detail: "annonce retirée : " + String(l.title || "").slice(0, 60) }); }
      else if (a === "report") {
        if (!C.requireLogin()) return;
        const key = (window.prompt("Motif du signalement : arnaque, illegal, spam ou autre ?", "arnaque") || "").toLowerCase();
        if (!key) return;
        const reason = /arnaq|faux/.test(key) ? "scam" : /ill/.test(key) ? "illegal" : /spam|pub/.test(key) ? "spam" : "other";
        await C.db.collection("listing_reports").doc(id + "_" + C.user.uid).set({ listingId: id, title: String(l.title || "").slice(0, 80), sellerUid: l.uid || "", reporter: C.pilotName().slice(0, 40), reporterUid: C.user.uid, reason, status: "open", createdAt: C.FieldValue.serverTimestamp() });
        C.toast("Merci, l'annonce a été signalée à la modération.", "ok"); return;
      }
      render();
    } catch (e) { C.toast("Action impossible : " + e.message, "err"); }
  }
  window.MAMarket = { REASONS };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("market", { enter: () => render() });
    document.addEventListener("click", (e) => {
      const k = e.target.closest("[data-mk-kind]"); if (k) { kind = k.dataset.mkKind; draw(); return; }
      const b = e.target.closest("[data-mk]"); if (b) act(b.dataset.mk, b.dataset.id);
    });
    document.addEventListener("input", (e) => { if (e.target.id === "mk-search") { q = e.target.value; const p = e.target.selectionStart; draw(); setTimeout(() => { const i = document.getElementById("mk-search"); if (i) { i.focus(); try { i.setSelectionRange(p, p); } catch (_) { /* ignoré */ } } }, 0); } });
  });
})();
