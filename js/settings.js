/**
 * MOTORAUTO — page Réglages (#/reglages) : profil, ambiance, notifications (push + catégories), carte & vie privée.
 * Le formulaire de profil et le choix d'ambiance sont les mêmes éléments qu'avant, simplement regroupés ici.
 */
(function () {
  "use strict";
  let C = null, myLoc = null, busy = false;
  const $ = (id) => document.getElementById(id);

  function moveTheme() {
    const body = document.querySelector("#theme-modal .dialog-body"), dst = $("settings-theme");
    if (body && dst && !dst.contains(body)) { dst.appendChild(body); body.classList.add("settings-theme-body"); }
  }

  // ------------------------------------------------------------------ notifications
  function stateInfo(st) {
    return ({
      noconfig: ["⚙️", "Notifications push pas encore configurées", "L'administrateur doit coller la clé VAPID dans js/push-config.js (voir le guide). En attendant, tu reçois les notifications dans la cloche du site."],
      "ios-install": ["📲", "Installe d'abord le site sur ton iPhone", "Safari → bouton Partager → « Sur l'écran d'accueil », puis ouvre MOTORAUTO depuis l'icône : iOS n'autorise les notifications que pour les sites installés."],
      unsupported: ["🚫", "Navigateur non compatible", "Ce navigateur ne gère pas les notifications push. Essaie Chrome (Android / ordinateur) ou Safari 16.4+ avec le site installé."],
      denied: ["🔕", "Notifications bloquées", "Tu as refusé l'autorisation : réactive-la dans les réglages de ton navigateur pour ce site, puis reviens ici."],
      off: ["🔔", "Notifications désactivées sur cet appareil", "Active-les pour être prévenu d'un message même quand le site est fermé."],
      on: ["✅", "Notifications activées sur cet appareil", "Tu seras prévenu des catégories cochées ci-dessous."]
    })[st];
  }
  function renderNotifs() {
    const root = $("settings-notifs"); if (!root || !window.MAPush) return;
    if (!C.user) { root.innerHTML = `<div class="empty-note">Connecte-toi pour régler tes notifications.</div>`; return; }
    const P = window.MAPush, st = P.state(), [ico, title, text] = stateInfo(st), prefs = P.prefs() || {}, esc = C.esc;
    const action = st === "off" ? `<button type="button" class="cta-btn fill-btn compact-btn" data-push="on">Activer sur cet appareil</button>` : st === "on" ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-push="off">Désactiver sur cet appareil</button><button type="button" class="cta-btn btn-ghost compact-btn" data-push="test">Envoyer un test</button>` : "";
    const install = !P.standalone() && P.canInstall() ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-push="install">📲 Installer MOTORAUTO</button>` : "";
    root.innerHTML = `<section class="set-card"><div class="set-ico" aria-hidden="true">${ico}</div><div class="set-main"><h3>${esc(title)}</h3><p class="lap-meta">${esc(text)}</p><div class="set-actions">${action}${install}</div><p class="form-error" id="push-err" role="alert"></p></div></section>
      <section class="set-card col"><h3>Quelles notifications veux-tu recevoir ?</h3><p class="lap-meta">Ça s'applique à la cloche du site <b>et</b> aux notifications sur ton appareil.</p>
        <div class="set-toggles">${P.KINDS.map(([k, l, d]) => `<label class="set-toggle"><span><b>${esc(l)}</b><small>${esc(d)}</small></span><input type="checkbox" data-pref="${k}" ${prefs[k] === false ? "" : "checked"}><i class="set-sw" aria-hidden="true"></i></label>`).join("")}</div>
        <p class="lap-meta">Les messages de modération (grade, sourdine) sont toujours envoyés.</p></section>
      <section class="set-card col"><h3>🌙 Ne pas déranger</h3><p class="lap-meta">Pendant cette plage (heure de Paris), ton appareil reste silencieux. Tu retrouves tout dans la cloche du site.</p>
        <label class="set-toggle"><span><b>Activer</b><small>Aucune notification sur l'appareil pendant la plage</small></span><input type="checkbox" id="dnd-on" ${P.dnd().on ? "checked" : ""}><i class="set-sw" aria-hidden="true"></i></label>
        <div class="dnd-times"><label>De <input type="time" id="dnd-from" value="${P.dnd().from}"></label><label>à <input type="time" id="dnd-to" value="${P.dnd().to}"></label></div></section>`;
  }
  async function pushAction(a) {
    const err = $("push-err"); if (err) err.textContent = "";
    try {
      if (a === "on") { await window.MAPush.enable(C.user); C.toast("Notifications activées sur cet appareil 🔔", "ok"); }
      else if (a === "off") { await window.MAPush.disable(); C.toast("Notifications désactivées sur cet appareil.", "ok"); }
      else if (a === "install") { await window.MAPush.install(); }
      else if (a === "test") { await C.db.collection("users").doc(C.user.uid).collection("notifications").add({ type: "game", fromUid: C.user.uid, from: "MOTORAUTO", text: "Ceci est une notification de test ✅", link: "#/reglages/notifications", read: false, createdAt: C.FieldValue.serverTimestamp() }); C.toast("Test envoyé : il arrive dans quelques secondes.", "ok"); }
    } catch (e) { if (err) err.textContent = e.message; else C.toast(e.message, "err"); }
    renderNotifs();
  }

  // ------------------------------------------------------------------ carte & vie privée
  async function renderMap() {
    const root = $("settings-map"); if (!root) return;
    if (!C.user) { root.innerHTML = `<div class="empty-note">Connecte-toi pour régler ta présence sur la carte.</div>`; return; }
    myLoc = window.MAMap ? await window.MAMap.myLocation() : null;
    const esc = C.esc;
    root.innerHTML = `<section class="set-card col"><h3>📍 Me montrer sur la carte des sorties</h3>
      <p class="lap-meta">Par défaut, <b>personne ne voit où tu es</b>. Si tu actives cette option, ta <b>ville</b> apparaît sur la carte avec une position <b>approximative</b> (arrondie et décalée de quelques kilomètres) : jamais ton adresse. Tu peux la retirer à tout moment.</p>
      ${myLoc ? `<p class="set-state ok">✅ Visible depuis : <b>${esc(myLoc.city)}</b></p>` : `<p class="set-state">🔒 Tu n'apparais pas sur la carte.</p>`}
      <form id="set-loc-form" class="set-loc" novalidate><div class="input-stack"><label for="set-city">Ma ville</label><input type="text" id="set-city" maxlength="80" placeholder="Ex. Le Mans" value="${esc(myLoc ? myLoc.city : "")}"></div>
        <div class="set-actions"><button type="submit" class="cta-btn fill-btn compact-btn">${myLoc ? "Mettre à jour" : "Apparaître sur la carte"}</button>${myLoc ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-loc-remove>Me retirer de la carte</button>` : ""}</div>
        <p class="form-error" id="set-loc-err" role="alert"></p></form></section>
      <section class="set-card col"><h3>🔐 Vie privée</h3><p class="lap-meta">Ton garage public, tes réseaux et la réception d'e-mails se règlent dans l'onglet <a href="#/reglages/profil">Profil</a>. Tu peux aussi y supprimer ton compte.</p></section>`;
  }
  async function saveLoc(e) {
    e.preventDefault(); if (busy) return; busy = true;
    const err = $("set-loc-err"), btn = e.target.querySelector("button[type=submit]"); err.textContent = ""; btn.disabled = true;
    try { await window.MAMap.saveMyLocation($("set-city").value); C.toast("Tu apparais maintenant sur la carte (zone approximative).", "ok"); busy = false; await renderMap(); return; }
    catch (ex) { err.textContent = ex.message; }
    busy = false; btn.disabled = false;
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    moveTheme();
    ctx.Router.register("settings", {
      guard: async () => { await ctx.authReady; return ctx.user ? undefined : "/"; },
      enter: async (p) => {
        if (p.tab === "notifications") { if (window.MAPush && ctx.user) await window.MAPush.loadPrefs(ctx.user.uid); renderNotifs(); }
        else if (p.tab === "carte") renderMap();
      }
    });
    document.addEventListener("click", async (e) => {
      const t = e.target;
      const th = t.closest && t.closest("#theme-btn"); if (th) { e.preventDefault(); e.stopImmediatePropagation(); ctx.Router.go("/reglages/ambiance"); return; }
      const pa = t.closest && t.closest("[data-push]"); if (pa) { pushAction(pa.dataset.push); return; }
      if (t.closest && t.closest("[data-loc-remove]")) { try { await window.MAMap.removeMyLocation(); C.toast("Tu n'apparais plus sur la carte.", "ok"); } catch (ex) { C.toast(ex.message, "err"); } renderMap(); }
    }, true);
    document.addEventListener("change", async (e) => {
      const id = e.target.id;
      if (id === "dnd-on" || id === "dnd-from" || id === "dnd-to") {
        const patch = id === "dnd-on" ? { on: e.target.checked } : id === "dnd-from" ? { from: e.target.value || "22:00" } : { to: e.target.value || "08:00" };
        try { await window.MAPush.setDnd(ctx.user.uid, patch); C.toast("Enregistré.", "ok"); } catch (ex) { C.toast("Enregistrement impossible : " + ex.message, "err"); }
        return;
      }
      const k = e.target.dataset && e.target.dataset.pref; if (!k) return;
      try { await window.MAPush.setPref(ctx.user.uid, k, e.target.checked); C.toast(e.target.checked ? "Notification activée." : "Notification désactivée.", "ok"); }
      catch (ex) { e.target.checked = !e.target.checked; C.toast("Enregistrement impossible : " + ex.message, "err"); }
    });
    document.addEventListener("submit", (e) => { if (e.target.id === "set-loc-form") saveLoc(e); });
    document.addEventListener("ma:install-ready", () => { if (ctx.Router.is("settings", { tab: "notifications" })) renderNotifs(); });
  });
})();
