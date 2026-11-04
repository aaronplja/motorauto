/**
 * MOTORAUTO — albums photo des sorties : chaque sortie a son album. Seuls les pilotes inscrits (« J'y vais ») et l'organisateur y ajoutent des photos ;
 * tout le monde peut les voir. event_photos/{auto} { event, uid, pilot, url, createdAt } — images dans car_photos/{uid}/ (règles Storage inchangées).
 */
(function () {
  "use strict";
  const MAX_PER_PILOT = 12;
  let layer = null, cur = null, busy = false;
  const ctx = () => window.MAApp && window.MAApp.ctx && window.MAApp.ctx();
  async function load(id) {
    const C = ctx(), s = await C.db.collection("event_photos").where("event", "==", id).limit(200).get();
    return s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => ((a.createdAt && a.createdAt.toMillis && a.createdAt.toMillis()) || 0) - ((b.createdAt && b.createdAt.toMillis && b.createdAt.toMillis()) || 0));
  }
  async function canPost(ev) {
    const C = ctx(); if (!C.user) return false;
    if (C.user.uid === ev.uid) return true;
    try { return (await C.db.collection("rsvps").doc(ev.id + "_" + C.user.uid).get()).exists; } catch (_) { return false; }
  }
  async function draw() {
    const C = ctx(), ev = cur, esc = C.esc; if (!layer) return;
    const [photos, can] = await Promise.all([load(ev.id), canPost(ev)]), mine = C.user ? photos.filter((p) => p.uid === C.user.uid).length : 0;
    layer.innerHTML = `<div class="evalb-box" role="dialog" aria-modal="true" aria-label="Album de la sortie"><header><h3>📷 ${esc(ev.title)}</h3><button type="button" class="cta-btn btn-ghost compact-btn" data-ea="close">Fermer</button></header>
      <p class="tcg-hint">${photos.length} photo${photos.length > 1 ? "s" : ""} · seuls les pilotes inscrits à la sortie peuvent en ajouter.</p>
      ${can ? `<div class="evalb-add"><input type="file" id="ea-file" accept="image/*" multiple><button type="button" class="cta-btn fill-btn compact-btn" data-ea="send" ${mine >= MAX_PER_PILOT ? "disabled" : ""}>Ajouter mes photos (${mine}/${MAX_PER_PILOT})</button></div>` : `<p class="empty-note small">${C.user ? "Inscris-toi à la sortie (« J'y vais ») pour ajouter tes photos." : "Connecte-toi pour participer."}</p>`}
      <p class="form-error" id="ea-err" role="alert"></p>
      <div class="evalb-grid">${photos.length ? photos.map((p) => `<figure><a href="${esc(C.safeUrl(p.url) || "")}" target="_blank" rel="noopener"><img src="${esc(C.safeUrl(p.url) || "")}" alt="Photo de ${esc(p.pilot || "pilote")}" loading="lazy" data-fallback="car"></a><figcaption>${esc(p.pilot || "Pilote")}${C.user && (C.user.uid === p.uid || C.user.uid === ev.uid || C.isAdmin) ? ` <button type="button" class="evalb-del" data-ea="del" data-id="${esc(p.id)}" aria-label="Supprimer cette photo">×</button>` : ""}</figcaption></figure>`).join("") : `<div class="empty-note">Aucune photo pour l'instant.</div>`}</div></div>`;
  }
  async function send() {
    const C = ctx(), err = document.getElementById("ea-err"); err.textContent = "";
    const mine = (await load(cur.id)).filter((p) => p.uid === C.user.uid).length;
    const fl = Array.from(document.getElementById("ea-file").files || []).filter((f) => /^image\//.test(f.type)).slice(0, MAX_PER_PILOT - mine);
    if (!fl.length) { err.textContent = "Choisis au moins une photo."; return; }
    if (busy) return; busy = true;
    try {
      for (let i = 0; i < fl.length; i++) {
        err.textContent = "Envoi " + (i + 1) + "/" + fl.length + "…";
        const blob = await C.MA.resizeImage(fl[i], 1600, 0.85), ref = C.storage.ref(`car_photos/${C.user.uid}/album_${cur.id}_${Date.now()}_${i}.jpg`);
        await ref.put(blob, { contentType: "image/jpeg" });
        await C.db.collection("event_photos").add({ event: cur.id, uid: C.user.uid, pilot: String((C.pilotName ? C.pilotName() : (C.profile || {}).username) || "Pilote").slice(0, 40), url: await ref.getDownloadURL(), createdAt: window.MAFB.FieldValue.serverTimestamp() });
      }
      C.toast("Photos ajoutées à l'album 📷", "ok");
    } catch (ex) { err.textContent = "Envoi impossible : " + ex.message; busy = false; return; }
    busy = false; draw();
  }
  async function open(id) {
    const C = ctx(); if (!C) return;
    let ev = null;
    try { const d = await C.db.collection("events").doc(id).get(); if (d.exists) ev = Object.assign({ id }, d.data()); } catch (_) { /* hors ligne */ }
    if (!ev) { C.toast("Sortie introuvable.", "err"); return; }
    cur = ev;
    if (!layer) { layer = document.createElement("div"); layer.className = "evalb-layer"; document.body.appendChild(layer); layer.addEventListener("click", onClick); }
    layer.hidden = false; layer.innerHTML = `<div class="evalb-box"><div class="empty-note">Chargement…</div></div>`; draw();
  }
  async function onClick(e) {
    const b = e.target.closest("[data-ea]"), C = ctx();
    if (e.target === layer || (b && b.dataset.ea === "close")) { layer.hidden = true; return; }
    if (!b) return;
    if (b.dataset.ea === "send") send();
    else if (b.dataset.ea === "del" && confirm("Supprimer cette photo de l'album ?")) { try { await C.db.collection("event_photos").doc(b.dataset.id).delete(); draw(); } catch (ex) { C.toast(ex.message, "err"); } }
  }
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-ev=album]"); if (b) { e.preventDefault(); open(b.dataset.id); } });
})();
