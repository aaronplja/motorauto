/**
 * MOTORAUTO — administration : tableau « à traiter » (tout ce qui attend une décision, au même endroit),
 * réponses toutes prêtes pour la messagerie, import de tableur collé.
 *   canned_replies/{auto}  { title, text, createdAt }   (lecture / écriture : admins)
 */
(function () {
  "use strict";
  let C = null, canned = [];
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);
  const TYPE_LABEL = { vehicle: "Demande de fiche", bug: "Bug", idea: "Idée", other: "Message", partner: "Partenariat" };

  async function inbox() {
    const box = document.getElementById("admin-inbox"); if (!box || !C.isAdmin) return;
    box.innerHTML = `<div class="empty-note">Chargement…</div>`;
    const get = (q) => q.get().then((s) => s.docs.map((d) => Object.assign({ id: d.id }, d.data()))).catch(() => []);
    const [sg, rp, lr, ct, cr, er] = await Promise.all([
      get(C.db.collection("suggestions").where("status", "==", "pending").limit(100)),
      get(C.db.collection("reports").where("status", "==", "open").limit(100)),
      get(C.db.collection("listing_reports").where("status", "==", "open").limit(100)),
      get(C.db.collection("contact_messages").limit(60)),
      get(C.db.collection("contest_reports").where("status", "==", "open").limit(100)),
      get(C.db.collection("client_errors").orderBy("last", "desc").limit(150))
    ]);
    const errOpen = er.filter((x) => !x.done || (x.n || 0) > (x.doneN || 0)).length;
    const esc = C.esc, items = [];
    sg.forEach((x) => items.push({ at: tsMs(x.createdAt), icon: x.kind === "photo" ? "📷" : "✎", label: x.kind === "photo" ? "Photo proposée" : "Correction proposée", text: `${x.carName || ""} — ${x.kind === "photo" ? (x.text || "photo") : (x.field || "") + " : " + String(x.text || "").slice(0, 100)}`, who: x.pilot, href: "#/admin/moderation" }));
    rp.forEach((x) => items.push({ at: tsMs(x.createdAt), icon: "🚩", label: "Message signalé", text: `« ${String(x.msgText || "").slice(0, 100)} » (${x.msgPilot || ""})`, who: x.reporter, href: "#/admin/moderation" }));
    lr.forEach((x) => items.push({ at: tsMs(x.createdAt), icon: "🏷", label: "Annonce signalée", text: `${x.title || ""} — ${(window.MAMarket && window.MAMarket.REASONS[x.reason]) || x.reason}`, who: x.reporter, listing: x }));
    cr.forEach((x) => items.push({ at: tsMs(x.createdAt), icon: "📸", label: "Photo de concours signalée", text: `${x.title || ""} — ${(window.MAMarket && window.MAMarket.REASONS[x.reason]) || x.reason}`, who: x.reporter, contestRep: x, listing: null }));
    ct.filter((x) => x.type === "vehicle").forEach((x) => items.push({ at: tsMs(x.createdAt), icon: "🚗", label: TYPE_LABEL.vehicle, text: [x.brand, x.model, x.years, x.engine].filter(Boolean).join(" · ") || "véhicule demandé", who: x.pilot, href: "#/admin/moderation" }));
    items.sort((a, b) => b.at - a.at);
    const reps = rp.length + lr.length + cr.length, fiches = ct.filter((x) => x.type === "vehicle").length, msgs = ct.filter((x) => x.type !== "vehicle").length;
    const tile = (n, label, href, hot) => `<a class="todo-tile ${n && hot ? "hot" : n ? "warm" : "zero"}" href="${href}"><b>${n}</b><span>${label}</span></a>`;
    box.innerHTML = `<div class="todo-grid">${tile(sg.length, "Propositions", "#/admin/moderation", true)}${tile(reps, "Signalements", "#/admin/moderation", true)}${tile(fiches, "Demandes de fiches", "#/admin/moderation", false)}${tile(msgs, "Messages reçus", "#/admin/moderation", false)}${tile(errOpen, "Erreurs du site", "#/admin/erreurs", true)}</div>
      <div class="admin-list todo-list">${items.length ? items.slice(0, 8).map((it, i) => `<div class="admin-msg"><div class="admin-msg-head"><span class="msg-type">${it.icon} ${esc(it.label)}</span><b>${esc(it.who || "")}</b><span class="lap-meta">${it.at && window.MACommunity ? window.MACommunity.ago(it.at) : ""}</span></div><p class="admin-msg-body">${esc(it.text)}</p>
        <div class="admin-quick">${it.href ? `<a class="cta-btn btn-ghost compact-btn" href="${it.href}">Traiter</a>` : it.contestRep ? `<button type="button" class="secondary-destructive-btn" data-inbox="c-remove" data-i="${i}">Retirer la photo</button><button type="button" class="cta-btn btn-ghost compact-btn" data-inbox="c-dismiss" data-i="${i}">Ignorer</button>` : `<button type="button" class="secondary-destructive-btn" data-inbox="remove" data-i="${i}">Retirer l'annonce</button><button type="button" class="cta-btn btn-ghost compact-btn" data-inbox="dismiss" data-i="${i}">Ignorer le signalement</button>`}</div></div>`).join("") : `<div class="empty-note todo-clear">Rien à traiter pour le moment.</div>`}</div>${items.length > 8 ? `<p class="todo-more"><a href="#/admin/moderation">Voir les ${items.length - 8} autres</a></p>` : ""}`;
    box._items = items;
  }
  async function inboxAction(a, i) {
    const box = document.getElementById("admin-inbox"), it = box && box._items && box._items[i];
    if (it && it.contestRep) {
      const r = it.contestRep;
      try {
        if (a === "c-remove") { await C.db.collection("contest_entries").doc(r.entryId).update({ status: "rejected" }); if (window.MALog) window.MALog.log("contest-reject", { target: r.entryId, detail: "participation retirée après signalement" }); }
        await C.db.collection("contest_reports").doc(r.id).update({ status: "done" });
        C.toast(a === "c-remove" ? "Photo retirée du concours." : "Signalement ignoré.", "ok"); inbox();
      } catch (e) { C.toast("Action impossible : " + e.message, "err"); }
      return;
    }
    if (!it || !it.listing) return;
    const l = it.listing;
    try {
      if (a === "remove") { await C.db.collection("listings").doc(l.listingId).delete().catch(() => {}); if (window.MALog) window.MALog.log("listing-delete", { target: l.listingId, detail: "annonce retirée après signalement : " + String(l.title || "").slice(0, 60) }); }
      await C.db.collection("listing_reports").doc(l.id).update({ status: "done" });
      C.toast(a === "remove" ? "Annonce retirée." : "Signalement ignoré.", "ok"); inbox();
    } catch (e) { C.toast("Action impossible : " + e.message, "err"); }
  }

  // ------------------------------------------------------------------ réponses toutes prêtes
  async function loadCanned() {
    const s = await C.db.collection("canned_replies").limit(50).get();
    canned = s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => tsMs(a.createdAt) - tsMs(b.createdAt));
  }
  function defaults() {
    return [["Merci pour ta suggestion", "Merci pour ta suggestion ! Je l'ajoute à ma liste et je reviens vers toi dès que la fiche est en ligne."],
      ["Bug : peux-tu préciser ?", "Merci d'avoir signalé ce bug. Peux-tu me dire sur quel appareil et navigateur, et ce que tu faisais juste avant ? Une capture d'écran m'aiderait beaucoup."],
      ["Fiche ajoutée", "Bonne nouvelle : la fiche que tu demandais est maintenant dans le catalogue. Dis-moi si tu repères une erreur !"],
      ["Correction prise en compte", "Merci, ta correction a été vérifiée et appliquée sur la fiche."]];
  }
  function renderCanned() {
    const root = document.getElementById("canned-root"); if (!root) return;
    const esc = C.esc;
    root.innerHTML = `<div class="maint-list">${canned.length ? canned.map((c) => `<div class="maint-row"><div class="m-main"><b>${esc(c.title)}</b><small>${esc(c.text)}</small></div><button type="button" class="secondary-destructive-btn" data-canned-del="${esc(c.id)}">Supprimer</button></div>`).join("") : `<div class="empty-note">Aucune réponse enregistrée. <button type="button" class="link-more" data-canned-seed>Ajouter 4 exemples</button></div>`}</div>
      <form class="maint-form" id="canned-form" novalidate><div class="input-stack"><label for="cn-t">Titre</label><input type="text" id="cn-t" maxlength="60" required placeholder="Ex. Merci pour ta suggestion"></div>
      <div class="input-stack wide"><label for="cn-x">Message</label><textarea id="cn-x" rows="3" maxlength="600" required></textarea></div>
      <div class="wide"><button type="submit" class="cta-btn fill-btn compact-btn">Ajouter la réponse</button></div></form>`;
    document.getElementById("canned-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("cn-t").value.trim().slice(0, 60), text = document.getElementById("cn-x").value.trim().slice(0, 600);
      if (!title || !text) return;
      try { await C.db.collection("canned_replies").add({ title, text, createdAt: C.FieldValue.serverTimestamp() }); await loadCanned(); renderCanned(); } catch (ex) { C.toast("Ajout impossible : " + ex.message, "err"); }
    });
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("admin", { enter: async (p) => {
      if (!ctx.isAdmin) return;
      if (p.tab === "tableau") inbox();
      if (p.tab === "moderation") { try { await loadCanned(); } catch (_) { canned = []; } renderCanned(); }
    } });
    document.addEventListener("click", async (e) => {
      const a = e.target.closest("[data-inbox]"); if (a) { inboxAction(a.dataset.inbox, Number(a.dataset.i)); return; }
      const d = e.target.closest("[data-canned-del]");
      if (d && confirm("Supprimer cette réponse ?")) { try { await C.db.collection("canned_replies").doc(d.dataset.cannedDel).delete(); await loadCanned(); renderCanned(); } catch (x) { C.toast("Suppression impossible : " + x.message, "err"); } return; }
      if (e.target.closest("[data-canned-seed]")) { try { for (const [title, text] of defaults()) await C.db.collection("canned_replies").add({ title, text, createdAt: C.FieldValue.serverTimestamp() }); await loadCanned(); renderCanned(); } catch (x) { C.toast("Ajout impossible : " + x.message, "err"); } return; }
      if (e.target.closest("#import-paste-go")) { const t = document.getElementById("import-paste").value; if (t.trim()) window.MAApp.previewImport(t); else C.toast("Colle d'abord le tableau.", "err"); }
    });
    document.addEventListener("ma:admin-loaded", () => { const s = document.getElementById("admin-inbox"); if (s && ctx.Router.is("admin", { tab: "tableau" })) inbox(); });
  });
})();
