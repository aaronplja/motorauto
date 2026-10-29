/**
 * MOTORAUTO — envoyer une fiche véhicule dans le chat : salon général, canal ou message privé.
 * Le message contient carId / carName / carImage ; le chat l'affiche comme une carte cliquable.
 */
(function () {
  "use strict";
  let C = null, car = null, dests = new Map(), pilots = null, channels = null;
  const $ = (id) => document.getElementById(id);

  async function loadDest() {
    if (!pilots) {
      try { pilots = (await C.db.collection("users").limit(500).get()).docs.map((d) => ({ id: d.id, name: d.data().username || "Pilote", avatar: d.data().avatar || "" })).filter((p) => p.id !== C.user.uid).sort((a, b) => a.name.localeCompare(b.name, "fr")); } catch (_) { pilots = []; }
    }
    if (!channels) {
      try { channels = (await C.db.collection("custom_channels").limit(50).get()).docs.map((d) => ({ id: d.id, name: d.data().name || d.id })); } catch (_) { channels = []; }
    }
  }
  const RK = "motorauto_share_recent";
  const recent = () => { try { return JSON.parse(localStorage.getItem(RK) || "[]"); } catch (_) { return []; } };
  const keyOf = (x) => x.type + ":" + x.id;
  function draw() {
    const q = C.normalize($("sharecar-q").value || ""), esc = C.esc, rec = recent();
    let items = [{ type: "global", id: "global", name: "Salon général", sub: "Visible par tous les pilotes" }]
      .concat(channels.map((c) => ({ type: "channel", id: c.id, name: "# " + c.name, sub: "Canal" })))
      .concat(pilots.map((p) => ({ type: "private", id: p.id, name: p.name, sub: "Message privé", avatar: p.avatar })));
    items = items.filter((x) => !q || C.normalize(x.name).includes(q));
    if (!q) items.sort((x, y) => { const ix = rec.indexOf(keyOf(x)), iy = rec.indexOf(keyOf(y)); return (ix < 0 ? 99 : ix) - (iy < 0 ? 99 : iy); });
    $("sharecar-list").innerHTML = items.slice(0, 40).map((x) => { const on = dests.has(keyOf(x)), r = rec.includes(keyOf(x)) && !q;
      return `<button type="button" class="engine-pick sharecar-dest${on ? " on" : ""}" aria-pressed="${on}" data-type="${esc(x.type)}" data-id="${esc(x.id)}" data-name="${esc(x.name)}"><b>${on ? "✓ " : ""}${esc(x.name)}</b><small>${r ? "Récent · " : ""}${esc(x.sub)}</small></button>`; }).join("") || `<div class="empty-note">Aucun résultat.</div>`;
    $("sharecar-send").disabled = !dests.size;
    $("sharecar-send").textContent = dests.size > 1 ? "Envoyer à " + dests.size + " destinations" : "Envoyer dans le chat";
  }
  async function open(carId) {
    if (!C.requireLogin()) return;
    car = C.carsById.get(carId); if (!car) return;
    dests = new Map(); $("sharecar-q").value = ""; $("sharecar-err").textContent = "";
    $("sharecar-sub").innerHTML = `<span class="sharecar-prev"><img src="${C.esc(C.safeUrl(car.image) || "")}" alt="" data-fallback="car"><b>${C.esc(car.brand + " " + car.model)}</b><small>${car.stats && car.stats.power ? car.stats.power + " ch" : ""}${car.years ? " · " + C.esc(car.years) : ""}</small></span>`; $("sharecar-note").value = "";
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
    if (!dests.size || !car) return;
    if (window.MAMute && window.MAMute.active && window.MAMute.active()) { err.textContent = window.MAMute.message(); return; }
    $("sharecar-send").disabled = true;
    const me = (C.profile && C.profile.username) || C.user.displayName || "Pilote", note = $("sharecar-note").value.trim().slice(0, 300);
    let ok = 0, last = null;
    for (const dest of dests.values()) {
      try {
        await collectionFor(dest).add({
          uid: C.user.uid, pilot: String(me).slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400),
          text: note, mediaUrl: "", replyTo: null, reactions: {},
          carId: car.id, carName: (car.brand + " " + car.model).slice(0, 120), carImage: String(car.image || "").slice(0, 500),
          timestamp: C.FieldValue.serverTimestamp()
        });
        ok++;
        if (dest.type === "private") {
          const ids = [C.user.uid, dest.id].sort();
          C.db.collection("private_chats").doc(ids.join("_")).set({ uids: ids, lastUid: C.user.uid, lastName: String(me).slice(0, 40), lastText: ("🚗 " + car.brand + " " + car.model + (note ? " · " + note : "")).slice(0, 120), lastAt: C.FieldValue.serverTimestamp() }, { merge: true }).catch(() => {});
          C.MA.notif.send(dest.id, { type: "dm", from: me, text: "Fiche : " + car.brand + " " + car.model, link: "chat.html#dm/" + encodeURIComponent(C.user.uid) }, "dm_" + C.user.uid);
        }
      } catch (e) { last = e; }
    }
    try { const r = [...dests.keys(), ...recent()].filter((k, i, a) => a.indexOf(k) === i).slice(0, 8); localStorage.setItem(RK, JSON.stringify(r)); } catch (_) {}
    if (ok) { C.closeModal($("sharecar-modal")); C.toast(ok > 1 ? "Fiche envoyée à " + ok + " destinations." : "Fiche envoyée dans le chat.", "ok"); }
    if (last && ok < dests.size) { err.textContent = "Envoi impossible pour " + (dests.size - ok) + " destination(s) : " + (last.code === "permission-denied" ? "republie firestore.rules." : last.message); $("sharecar-send").disabled = false; }
  }
  document.addEventListener("click", (e) => {
    const t = e.target;
    const b = t.closest && t.closest("[data-action=share-car-chat]"); if (b) { open(b.dataset.id); return; }
    const d = t.closest && t.closest(".sharecar-dest"); if (d) { const o = { type: d.dataset.type, id: d.dataset.id }, k = keyOf(o); if (dests.has(k)) dests.delete(k); else dests.set(k, o); draw(); return; }
    if (t.id === "sharecar-send") send();
    if (t.id === "close-sharecar-modal") C.closeModal($("sharecar-modal"));
  });
  document.addEventListener("input", (e) => { if (e.target.id === "sharecar-q") draw(); });
  (window.MAModules = window.MAModules || []).push(function (ctx) { C = ctx; });
})();
