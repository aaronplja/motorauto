/**
 * MOTORAUTO — envoyer une fiche véhicule dans le chat : salon général, canal ou message privé.
 * Le message contient carId / carName / carImage ; le chat l'affiche comme une carte cliquable.
 */
(function () {
  "use strict";
  let C = null, car = null, dest = null, pilots = null, channels = null;
  const $ = (id) => document.getElementById(id);

  async function loadDest() {
    if (!pilots) {
      try { pilots = (await C.db.collection("users").limit(500).get()).docs.map((d) => ({ id: d.id, name: d.data().username || "Pilote", avatar: d.data().avatar || "" })).filter((p) => p.id !== C.user.uid).sort((a, b) => a.name.localeCompare(b.name, "fr")); } catch (_) { pilots = []; }
    }
    if (!channels) {
      try { channels = (await C.db.collection("custom_channels").limit(50).get()).docs.map((d) => ({ id: d.id, name: d.data().name || d.id })); } catch (_) { channels = []; }
    }
  }
  function draw() {
    const q = C.normalize($("sharecar-q").value || ""), esc = C.esc;
    const items = [{ type: "global", id: "global", name: "Salon général", sub: "Visible par tous les pilotes" }]
      .concat(channels.map((c) => ({ type: "channel", id: c.id, name: "# " + c.name, sub: "Canal" })))
      .concat(pilots.map((p) => ({ type: "private", id: p.id, name: p.name, sub: "Message privé" })))
      .filter((x) => !q || C.normalize(x.name).includes(q));
    $("sharecar-list").innerHTML = items.slice(0, 40).map((x) => `<button type="button" class="engine-pick sharecar-dest${dest && dest.type === x.type && dest.id === x.id ? " on" : ""}" data-type="${esc(x.type)}" data-id="${esc(x.id)}" data-name="${esc(x.name)}"><b>${esc(x.name)}</b><small>${esc(x.sub)}</small></button>`).join("") || `<div class="empty-note">Aucun résultat.</div>`;
    $("sharecar-send").disabled = !dest;
  }
  async function open(carId) {
    if (!C.requireLogin()) return;
    car = C.carsById.get(carId); if (!car) return;
    dest = null; $("sharecar-q").value = ""; $("sharecar-err").textContent = "";
    $("sharecar-sub").textContent = car.brand + " " + car.model; $("sharecar-note").value = "";
    $("sharecar-list").innerHTML = `<div class="empty-note">Chargement…</div>`;
    C.openModal($("sharecar-modal"));
    await loadDest(); draw();
  }
  function collectionFor(d) {
    if (d.type === "global") return C.db.collection("global_chat");
    if (d.type === "channel") return C.db.collection("custom_channels").doc(d.id).collection("messages");
    return C.db.collection("private_chats").doc([C.user.uid, d.id].sort().join("_")).collection("messages");
  }
  async function send() {
    const err = $("sharecar-err"); err.textContent = "";
    if (!dest || !car) return;
    if (window.MAMute && window.MAMute.active && window.MAMute.active()) { err.textContent = window.MAMute.message(); return; }
    $("sharecar-send").disabled = true;
    try {
      const me = (C.profile && C.profile.username) || C.user.displayName || "Pilote";
      await collectionFor(dest).add({
        uid: C.user.uid, pilot: String(me).slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400),
        text: $("sharecar-note").value.trim().slice(0, 300), mediaUrl: "", replyTo: null, reactions: {},
        carId: car.id, carName: (car.brand + " " + car.model).slice(0, 120), carImage: String(car.image || "").slice(0, 500),
        timestamp: C.FieldValue.serverTimestamp()
      });
      if (dest.type === "private") C.MA.notif.send(dest.id, { type: "dm", from: me, text: "Fiche : " + car.brand + " " + car.model, link: "chat.html#dm/" + encodeURIComponent(C.user.uid) }, "dm_" + C.user.uid);
      C.closeModal($("sharecar-modal")); C.toast("Fiche envoyée dans le chat.", "ok");
    } catch (e) { err.textContent = "Envoi impossible : " + (e.code === "permission-denied" ? "republie firestore.rules." : e.message); $("sharecar-send").disabled = false; }
  }
  document.addEventListener("click", (e) => {
    const t = e.target;
    const b = t.closest && t.closest("[data-action=share-car-chat]"); if (b) { open(b.dataset.id); return; }
    const d = t.closest && t.closest(".sharecar-dest"); if (d) { dest = { type: d.dataset.type, id: d.dataset.id }; draw(); return; }
    if (t.id === "sharecar-send") send();
    if (t.id === "close-sharecar-modal") C.closeModal($("sharecar-modal"));
  });
  document.addEventListener("input", (e) => { if (e.target.id === "sharecar-q") draw(); });
  (window.MAModules = window.MAModules || []).push(function (ctx) { C = ctx; });
})();
