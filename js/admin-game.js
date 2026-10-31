/**
 * MOTORAUTO — administration du jeu (onglet Admin › Jeu) :
 *   • cartes spéciales à édition limitée : création / modification complète, aperçu en direct, attribution aux pilotes ;
 *   • concours photo mensuel : thème, lancement, validation des photos, clôture et couronnement.
 *   special_cards/{sp-…}  { name, edition, image, color, power, speed, zero, text, supply, granted, active, createdAt }
 * L'attribution des cartes et la clôture passent par le serveur (Cloud Functions adminGrantCard / adminContest).
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, cards = [], grants = [], users = [], entries = [], contest = null, contestId = "", ctForm = false, editing = null, draft = null, loadedAt = 0, busy = false, grantFor = "";
  const COLORS = [["silver", "Silver (noir & argent)"], ["carbon", "Carbone"], ["gold", "Or"], ["ice", "Glace"], ["rose", "Rose"], ["emerald", "Émeraude"], ["violet", "Violet"], ["crimson", "Rouge sang"], ["bronze", "Bronze"], ["neon", "Néon"], ["sunset", "Coucher de soleil"]];
  const slug = (s) => C.normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);
  const blankDraft = () => ({ id: "", name: "", edition: "Édition limitée", image: "", color: "silver", power: 0, speed: 0, zero: 0, text: "", supply: 0, granted: 0, active: true, claimable: false, startsAt: "", endsAt: "" });
  const dayStr = (ms) => ms ? new Date(Number(ms)).toISOString().slice(0, 10) : "";

  async function load() {
    const [cs, gr, us, ctAll] = await Promise.all([
      C.db.collection("special_cards").limit(200).get().catch(() => null), C.db.collection("special_grants").limit(500).get().catch(() => null),
      C.db.collection("users").limit(500).get().catch(() => null), C.db.collection("contests").limit(60).get().catch(() => null)
    ]);
    const clist = ctAll ? ctAll.docs.map((d) => Object.assign({ id: d.id }, d.data())) : [];
    const open = clist.filter((c) => c.status === "open" && c.custom).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
    const cur = open[0] || clist.find((c) => c.id === G.monthKey()) || null;
    const ct = cur ? { exists: true, data: () => cur } : null;
    const en = cur ? await C.db.collection("contest_entries").where("contest", "==", cur.id).limit(300).get().catch(() => null) : null;
    cards = cs ? cs.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)) : [];
    grants = gr ? gr.docs.map((d) => d.data()) : [];
    users = us ? us.docs.map((d) => ({ uid: d.id, name: d.data().username || "Pilote" })).sort((a, b) => a.name.localeCompare(b.name, "fr")) : [];
    contest = ct && ct.exists ? ct.data() : null; contestId = cur ? cur.id : "";
    entries = en ? en.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)) : [];
    loadedAt = Date.now();
  }
  const asCard = (c) => window.MACards.cardObj ? { id: c.id || "sp-apercu", brand: c.edition || "Édition limitée", model: c.name || "Nom de la carte", image: c.image || "", category: "", years: "", stats: { power: Number(c.power) || 0, speed: Number(c.speed) || 0, zero: Number(c.zero) || null }, special: c } : null;
  const preview = (c) => window.MACards.cardHtml(asCard(c), { cls: "tcg-big", count: 1 });

  function formHtml() {
    const d = draft, esc = C.esc, num = (k, l, max, step) => `<div class="input-stack"><label for="sp-${k}">${l}</label><input type="number" id="sp-${k}" data-sp="${k}" min="0" max="${max}" step="${step || 1}" value="${Number(d[k]) || 0}"></div>`;
    return `<form class="admin-card-form" id="sp-form" novalidate><div class="acf-fields">
      <div class="input-stack"><label for="sp-name">Nom de la carte</label><input type="text" id="sp-name" data-sp="name" maxlength="60" required value="${esc(d.name)}" placeholder="Ex. Rassemblement Le Mans 2026"></div>
      <div class="input-stack"><label for="sp-edition">Édition (sous-titre)</label><input type="text" id="sp-edition" data-sp="edition" maxlength="60" value="${esc(d.edition)}"></div>
      <div class="input-stack wide"><label for="sp-image">Image (URL)</label><div class="inline-field"><input type="text" id="sp-image" data-sp="image" maxlength="500" value="${esc(d.image)}" placeholder="https://…"><button type="button" class="cta-btn btn-ghost compact-btn" data-sp-upload>📷 Téléverser</button><input type="file" id="sp-file" accept="image/*" hidden></div></div>
      <div class="input-stack"><label for="sp-color">Couleur</label><select id="sp-color" data-sp="color">${COLORS.map(([v, l]) => `<option value="${v}" ${d.color === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      ${num("supply", "Tirage (0 = illimité)", 100000)}${num("power", "Puissance (ch)", 4000)}${num("speed", "Vitesse max (km/h)", 600)}${num("zero", "0-100 km/h (s)", 60, 0.1)}
      <div class="input-stack wide"><label for="sp-text">Texte (affiché si aucune puissance)</label><input type="text" id="sp-text" data-sp="text" maxlength="160" value="${esc(d.text)}"></div>
      <label class="check-row wide"><input type="checkbox" id="sp-claimable" data-sp="claimable" ${d.claimable ? "checked" : ""}><span>Événement : les pilotes la récupèrent eux-mêmes (1 par pilote) pendant la période</span></label>
      <div class="input-stack"><label for="sp-startsAt">Début (optionnel)</label><input type="date" id="sp-startsAt" data-sp="startsAt" value="${esc(d.startsAt || "")}"></div>
      <div class="input-stack"><label for="sp-endsAt">Fin (optionnel, incluse)</label><input type="date" id="sp-endsAt" data-sp="endsAt" value="${esc(d.endsAt || "")}"></div>
      <label class="check-row wide"><input type="checkbox" id="sp-active" data-sp="active" ${d.active ? "checked" : ""}><span>Carte active (visible dans les collections)</span></label></div>
      <div class="acf-preview"><small class="lap-meta">Aperçu</small><div id="sp-preview">${preview(d)}</div></div>
      <p class="form-error wide" id="sp-err" role="alert"></p>
      <div class="acf-actions"><button type="submit" class="cta-btn fill-btn" id="sp-save">${editing ? "Enregistrer les modifications" : "Créer la carte"}</button><button type="button" class="cta-btn btn-ghost" data-sp-cancel>Annuler</button></div></form>`;
  }
  function cardRow(c) {
    const esc = C.esc, mine = grants.filter((g) => g.cardId === c.id), supply = Number(c.supply) || 0, left = supply ? supply - (c.granted || 0) : null;
    return `<article class="admin-card-row ${c.active === false ? "off" : ""}"><div class="acr-card">${preview(c)}</div><div class="acr-main"><b>${esc(c.name)}</b><small>${esc(c.edition || "")} · ${supply ? (c.granted || 0) + " / " + supply + " attribuées" : (c.granted || 0) + " attribuée(s), tirage illimité"}${c.active === false ? " · désactivée" : ""}</small>
      ${mine.length ? `<small class="acr-holders">Détenue par : ${mine.slice(0, 8).map((g) => esc(g.name || "?") + " (n°" + (g.serials || []).join(",") + ")").join(", ")}${mine.length > 8 ? "…" : ""}</small>` : ""}
      <div class="acr-actions"><button type="button" class="cta-btn fill-btn compact-btn" data-sp-grant="${esc(c.id)}" ${left === 0 ? "disabled" : ""}>🎁 Attribuer</button><button type="button" class="cta-btn btn-ghost compact-btn" data-sp-edit="${esc(c.id)}">Modifier</button>${(c.granted || 0) === 0 ? `<button type="button" class="secondary-destructive-btn" data-sp-del="${esc(c.id)}">Supprimer</button>` : ""}</div>
      ${grantFor === c.id ? grantForm(c) : ""}</div></article>`;
  }
  function grantForm(c) {
    const esc = C.esc;
    return `<form class="grant-form" id="grant-form" data-card="${esc(c.id)}" novalidate><datalist id="grant-users">${users.map((u) => `<option value="${esc(u.name)} · ${esc(u.uid.slice(0, 5))}"></option>`).join("")}</datalist>
      <div class="input-stack"><label for="gr-user">Pilote</label><input type="text" id="gr-user" list="grant-users" placeholder="Commence à taper un pseudo…" autocomplete="off" required></div>
      <div class="input-stack"><label for="gr-qty">Quantité</label><input type="number" id="gr-qty" min="1" max="10" value="1"></div>
      <div class="grant-actions"><button type="submit" class="cta-btn fill-btn compact-btn" data-mode="grant">Attribuer</button><button type="submit" class="secondary-destructive-btn" data-mode="revoke">Retirer</button><button type="button" class="cta-btn btn-ghost compact-btn" data-sp-grant-cancel>Fermer</button></div><p class="form-error" id="gr-err" role="alert"></p></form>`;
  }
  function contestHtml() {
    const esc = C.esc, month = G.monthKey(), pending = entries.filter((e) => e.status === "pending"), ok = entries.filter((e) => e.status === "approved");
    const row = (e) => `<article class="admin-entry"><a href="${esc(C.safeUrl(e.photo) || "#")}" target="_blank" rel="noopener"><img src="${esc(C.safeUrl(e.photo) || "")}" alt="Photo de ${esc(e.name)}" loading="lazy"></a><div><b>${esc(e.name)}</b><small>${esc(e.carName || "")}${e.caption ? " — « " + esc(e.caption) + " »" : ""}</small>
      <div class="acr-actions">${e.status !== "approved" ? `<button type="button" class="cta-btn fill-btn compact-btn" data-entry="approved" data-id="${esc(e.id)}">Valider</button>` : ""}${e.status !== "rejected" ? `<button type="button" class="secondary-destructive-btn" data-entry="rejected" data-id="${esc(e.id)}">${e.status === "approved" ? "Retirer" : "Refuser"}</button>` : ""}</div></div></article>`;
    const fld = (id, l, v, ph, type) => `<div class="input-stack"><label for="${id}">${l}</label><input type="${type || "text"}" id="${id}" maxlength="200" value="${esc(v || "")}" placeholder="${esc(ph || "")}"></div>`;
    const isOpen = contest && contest.status === "open";
    const newForm = `<form class="contest-admin ct-form" id="ct-new-form" novalidate><h4 class="admin-h3">Nouveau concours personnalisé</h4>${fld("ctn-theme", "Thème (obligatoire)", "", "ex. Ma plus belle sortie")}${fld("ctn-desc", "Description", "", "Règles, ambiance…")}${fld("ctn-prize", "Récompense (texte affiché)", "", "ex. Le gagnant reçoit une carte Silver")}${fld("ctn-end", "Date de fin (facultatif)", "", "", "date")}
      <p class="admin-note">Le concours est publié sur l'accueil tout de suite. Les photos sont publiées sans validation ; tu peux en retirer. S'il y a déjà un concours du mois ouvert, celui-ci passe en avant.</p><div class="acr-actions"><button type="submit" class="cta-btn fill-btn compact-btn">Lancer le concours</button><button type="button" class="cta-btn btn-ghost compact-btn" data-ct-newcancel>Annuler</button></div></form>`;
    return `<div class="admin-sec-head"><h3 class="admin-h3 nomargin">Concours photo${contest ? " · " + esc(contest.custom ? contest.theme : G.monthLabel(contest.id)) : ""}</h3><button type="button" class="cta-btn btn-ghost compact-btn" data-ct-new>＋ Nouveau concours</button></div>
      ${ctForm ? newForm : ""}
      ${contest ? `<div class="contest-admin">${fld("ct-theme", "Thème", contest.theme)}${fld("ct-desc", "Description", contest.desc)}${fld("ct-prize", "Récompense (texte)", contest.prize)}${fld("ct-end", "Date de fin (clôture automatique la nuit suivante)", contest.endsAt, "", "date")}
        <div class="acr-actions"><button type="button" class="cta-btn fill-btn compact-btn" data-ct-save ${!isOpen ? "disabled" : ""}>Enregistrer les modifications</button></div>
        <p class="lap-meta">Statut : <b>${isOpen ? "ouvert" : "clôturé"}</b> · ${ok.length} photo(s) en ligne${contest.status === "closed" ? ` · gagnant : ${esc(contest.winnerName || "aucun")}` : ""}</p>
        ${isOpen ? `<button type="button" class="cta-btn fill-btn compact-btn" data-ct-close>🏁 Clôturer et couronner le gagnant</button><p class="admin-note">Le concours du mois se clôture tout seul le 1er du mois ; un concours personnalisé se clôture avec ce bouton (le gagnant reçoit une carte spéciale unique).</p>` : ""}</div>`
      : `<div class="empty-note">Aucun concours. <button type="button" class="cta-btn fill-btn compact-btn" data-ct-open>Lancer le concours du mois</button></div>`}
      ${pending.length ? `<h3 class="admin-h3">Anciennes photos en attente <span class="count-pill">${pending.length}</span></h3><div class="admin-entries">${pending.map(row).join("")}</div>` : ""}
      <h3 class="admin-h3">Photos en ligne (modération : tu peux en retirer)</h3>
      <div class="admin-entries">${ok.length ? ok.map(row).join("") : `<div class="empty-note small">Aucune photo pour l'instant.</div>`}</div>`;
  }
  // outils de test et gestes : packs de test illimités, packs bonus, poussière, remise à zéro…
  function toolsHtml() {
    const esc = C.esc;
    return `<div class="admin-sec-head"><h3 class="admin-h3 nomargin">Outils de test &amp; gestes</h3></div>
      <p class="admin-note">Agis sur ton propre compte (laisse « Pilote » vide) ou sur un pilote précis. Les packs de test sont illimités et ne comptent ni pour les défis ni pour les statistiques.</p>
      <div class="admin-tools-box"><datalist id="tool-users">${users.map((u) => `<option value="${esc(u.name)} · ${esc(u.uid.slice(0, 5))}"></option>`).join("")}</datalist>
        <div class="input-stack"><label for="tl-user">Pilote</label><input type="text" id="tl-user" list="tool-users" placeholder="Moi (vide) ou commence à taper un pseudo…" autocomplete="off"></div>
        <div class="input-stack"><label for="tl-qty">Quantité</label><input type="number" id="tl-qty" min="1" max="100000" value="5"></div>
        <div class="tool-btns">
          <button type="button" class="cta-btn fill-btn compact-btn" data-tool="test-pack">Ouvrir un pack de test (moi)</button>
          <button type="button" class="cta-btn btn-ghost compact-btn" data-tool="bonus">Donner des packs bonus</button>
          <button type="button" class="cta-btn btn-ghost compact-btn" data-tool="dust">Donner de la poussière</button>
          <button type="button" class="cta-btn btn-ghost compact-btn" data-tool="resetDaily">Réarmer le pack du jour</button>
          <button type="button" class="cta-btn btn-ghost compact-btn" data-tool="unlockAll">Tout débloquer</button>
          <button type="button" class="secondary-destructive-btn" data-tool="resetCollection">Remettre la collection à zéro</button>
        </div>
        <div class="input-stack wide"><label for="tl-msg">Annonce à tous les pilotes (notification, 120 caractères max)</label><div class="inline-field"><input type="text" id="tl-msg" maxlength="120" placeholder="Ex : Nouvelle carte spéciale pour le salon, récupère-la dans Jouer !"><button type="button" class="cta-btn fill-btn compact-btn" data-tool="broadcast">Envoyer à tous</button></div></div>
        <p class="form-error" id="tl-err" role="alert"></p></div><hr class="admin-sep">`;
  }
  async function runTool(kind) {
    if (busy) return; const err = document.getElementById("tl-err"); err.textContent = "";
    const val = document.getElementById("tl-user").value.trim(), qty = Number(document.getElementById("tl-qty").value) || 1;
    let target = C.user.uid, name = "moi";
    if (val) {
      const u = users.find((x) => val === x.name + " · " + x.uid.slice(0, 5)) || (users.filter((x) => x.name.toLowerCase() === val.toLowerCase()).length === 1 ? users.find((x) => x.name.toLowerCase() === val.toLowerCase()) : null);
      if (!u) { err.textContent = "Choisis un pilote dans la liste proposée."; return; }
      target = u.uid; name = u.name;
    }
    if (kind === "broadcast") {
      const text = document.getElementById("tl-msg").value.trim();
      if (text.length < 3) { err.textContent = "Écris le message à envoyer."; return; }
      if (!confirm("Envoyer cette annonce à tous les pilotes ?\n\n« " + text + " »")) return;
      busy = true;
      try { const r = await window.MAGameAPI.call("adminBroadcast", { text, link: "#/jouer" }); if (window.MALog) window.MALog.log("broadcast", { detail: text }); C.toast("Annonce envoyée à " + r.sent + " pilote(s).", "ok"); document.getElementById("tl-msg").value = ""; }
      catch (ex) { err.textContent = ex.message; }
      busy = false; return;
    }
    if (kind === "resetCollection" && !confirm("Remettre à zéro la collection de " + name + " ? Cette action est définitive.")) return;
    busy = true;
    try {
      if (kind === "test-pack") {
        const r = await window.MAGameAPI.call("openPack", { kind: "test" });
        C.toast("Pack de test : " + r.cards.map((c) => c.rarity).join(", "), "ok");
      } else {
        await window.MAGameAPI.call("adminGameTool", { action: kind, uid: target, qty });
        if (window.MALog) window.MALog.log("game-tool", { target, targetName: name, detail: kind + (["bonus", "dust"].includes(kind) ? " ×" + qty : "") });
        C.toast("Fait pour " + name + ".", "ok");
      }
      if (window.MACards && window.MACards.load) window.MACards.load(true).catch(() => {});
    } catch (ex) { err.textContent = ex.message; }
    busy = false;
  }

  function render() {
    const root = document.getElementById("admin-game"); if (!root) return;
    if (!C.isAdmin) { root.innerHTML = ""; return; }
    if (!loadedAt) { root.innerHTML = `<div class="tcg-skeleton" aria-busy="true"><i></i><i></i></div>`; return; }
    root.innerHTML = toolsHtml() + `<div class="admin-sec-head"><h3 class="admin-h3 nomargin">Cartes spéciales (éditions limitées)</h3>${draft ? "" : `<button type="button" class="cta-btn fill-btn compact-btn" data-sp-new>＋ Nouvelle carte</button>`}</div>
      <p class="admin-note">Ces cartes ne sortent jamais des packs : toi seul les attribues (événements, concours, récompenses). Elles apparaissent dans la collection du pilote, avec leur numéro d'exemplaire.</p>
      ${draft ? formHtml() : ""}
      <div class="admin-cards">${cards.length ? cards.map(cardRow).join("") : `<div class="empty-note">Aucune carte spéciale pour l'instant.</div>`}</div>
      <hr class="admin-sep">${contestHtml()}`;
  }

  async function saveCard(e) {
    e.preventDefault(); if (busy) return;
    const d = draft, err = document.getElementById("sp-err");
    const name = d.name.trim();
    if (name.length < 2) { err.textContent = "Donne un nom à la carte."; return; }
    if (d.image && !C.safeUrl(d.image)) { err.textContent = "Adresse d'image invalide (https://…)."; return; }
    const id = editing || "sp-" + slug(name);
    if (!editing && cards.some((c) => c.id === id)) { err.textContent = "Une carte porte déjà ce nom."; return; }
    const body = { name: name.slice(0, 60), edition: String(d.edition || "").trim().slice(0, 60), image: String(d.image || "").trim().slice(0, 500), color: d.color, power: Math.max(0, Math.min(4000, Number(d.power) || 0)), speed: Math.max(0, Math.min(600, Number(d.speed) || 0)), zero: Math.max(0, Math.min(60, Number(d.zero) || 0)), text: String(d.text || "").trim().slice(0, 160), supply: Math.max(0, Math.min(100000, Math.floor(Number(d.supply) || 0))), active: !!d.active, claimable: !!d.claimable, startsAtMs: d.startsAt ? Date.parse(d.startsAt + "T00:00:00Z") || 0 : 0, endsAtMs: d.endsAt ? (Date.parse(d.endsAt + "T00:00:00Z") || 0) + 86399999 : 0 };
    busy = true;
    try {
      const old = cards.find((c) => c.id === id);
      if (old && body.supply && body.supply < (old.granted || 0)) { err.textContent = `Le tirage ne peut pas être inférieur aux ${old.granted} exemplaires déjà attribués.`; busy = false; return; }
      await C.db.collection("special_cards").doc(id).set(Object.assign(body, { granted: old ? old.granted || 0 : 0, kind: old && old.kind ? old.kind : "event", createdAt: old ? old.createdAt : C.FieldValue.serverTimestamp() }));
      if (window.MALog) window.MALog.log("special-card", { target: id, detail: (old ? "carte modifiée : " : "carte créée : ") + body.name });
      draft = null; editing = null; C.toast(old ? "Carte modifiée." : "Carte créée : tu peux l'attribuer.", "ok");
      await load();
    } catch (ex) { err.textContent = "Enregistrement impossible : " + ex.message; busy = false; return; }
    busy = false; render();
  }
  async function grant(form, mode) {
    const err = document.getElementById("gr-err"), val = document.getElementById("gr-user").value.trim(), qty = Number(document.getElementById("gr-qty").value) || 1;
    const u = users.find((x) => val === x.name + " · " + x.uid.slice(0, 5)) || (users.filter((x) => x.name.toLowerCase() === val.toLowerCase()).length === 1 ? users.find((x) => x.name.toLowerCase() === val.toLowerCase()) : null);
    if (!u) { err.textContent = "Choisis un pilote dans la liste proposée."; return; }
    if (mode === "revoke" && !confirm(`Retirer ${qty} exemplaire(s) à ${u.name} ?`)) return;
    if (busy) return; busy = true;
    try {
      const r = await window.MAGameAPI.call("adminGrantCard", { uid: u.uid, cardId: form.dataset.card, qty, mode });
      if (window.MALog) window.MALog.log("special-grant", { target: u.uid, targetName: u.name, detail: (mode === "grant" ? "carte attribuée " : "carte retirée ") + form.dataset.card });
      C.toast(mode === "grant" ? `🎁 Carte attribuée à ${u.name}${r.serials && r.serials.length ? " (n° " + r.serials.join(", ") + ")" : ""}.` : "Carte retirée.", "ok");
      grantFor = ""; await load();
    } catch (ex) { err.textContent = ex.message; }
    busy = false; render();
  }
  async function setEntry(id, status) {
    try { await C.db.collection("contest_entries").doc(id).update({ status }); C.toast(status === "approved" ? "Photo validée." : "Photo retirée du concours.", "ok"); await load(); render(); window.dispatchEvent(new Event("ma:admin-refresh")); }
    catch (ex) { C.toast("Action impossible : " + ex.message, "err"); }
  }
  const val = (id) => (document.getElementById(id) ? document.getElementById(id).value.trim() : "");
  async function saveContest() {
    if (!contestId) return; const theme = val("ct-theme");
    if (theme.length < 2) { C.toast("Le thème est obligatoire.", "err"); return; }
    try { await C.db.collection("contests").doc(contestId).update({ theme: theme.slice(0, 80), desc: val("ct-desc").slice(0, 200), prize: val("ct-prize").slice(0, 200), endsAt: val("ct-end") }); C.toast("Concours mis à jour.", "ok"); await load(); render(); }
    catch (ex) { C.toast("Modification impossible : " + ex.message, "err"); }
  }
  async function createContest(e) {
    e.preventDefault(); const theme = val("ctn-theme");
    if (theme.length < 2) { C.toast("Donne un thème au concours.", "err"); return; }
    try {
      await C.db.collection("contests").doc("c-" + Date.now().toString(36)).set({ theme: theme.slice(0, 80), desc: val("ctn-desc").slice(0, 200), prize: val("ctn-prize").slice(0, 200), endsAt: val("ctn-end"), status: "open", custom: true, createdAt: C.FieldValue.serverTimestamp() });
      ctForm = false; C.toast("Concours lancé : il apparaît sur l'accueil.", "ok"); await load(); render();
    } catch (ex) { C.toast("Création impossible : " + ex.message, "err"); }
  }
  async function contestAction(action, extra) {
    if (busy) return; busy = true;
    try { const r = await window.MAGameAPI.call("adminContest", Object.assign({ action }, extra || {})); C.toast(action === "close" ? (r.winner ? "Concours clôturé : le gagnant a reçu sa carte spéciale 🏆" : "Concours clôturé (aucun participant).") : "Fait.", "ok"); await load(); }
    catch (ex) { C.toast(ex.message, "err"); }
    busy = false; render();
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    document.addEventListener("submit", (e) => { if (e.target.id === "ct-new-form") createContest(e); });
    ctx.Router.register("admin", { enter: async (p) => {
      if (p.tab !== "jeu" || !ctx.isAdmin) return;
      render();
      try { await load(); } catch (e) { loadedAt = Date.now(); }
      render();
    } });
    document.addEventListener("ma:admin-loaded", () => { if (ctx.Router.is("admin", { tab: "jeu" })) load().then(render); });
    document.addEventListener("submit", (e) => {
      if (e.target.id === "sp-form") saveCard(e);
      else if (e.target.id === "grant-form") { e.preventDefault(); grant(e.target, (e.submitter && e.submitter.dataset.mode) || "grant"); }
    });
    document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-tool]"); if (b) runTool(b.dataset.tool); });
    document.addEventListener("input", (e) => {
      const k = e.target.dataset && e.target.dataset.sp; if (!k || !draft) return;
      draft[k] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      const pv = document.getElementById("sp-preview"); if (pv) pv.innerHTML = preview(draft);
    });
    document.addEventListener("change", async (e) => {
      if (e.target.id === "sp-file" && e.target.files[0]) {
        const f = e.target.files[0], err = document.getElementById("sp-err"); err.textContent = "Envoi de l'image…";
        try {
          const blob = await C.MA.resizeImage(f, 1200, 0.88), ref = C.storage.ref(`car_photos/${C.user.uid}/special_${Date.now()}.jpg`);
          await ref.put(blob, { contentType: "image/jpeg" }); draft.image = await ref.getDownloadURL(); err.textContent = "";
          document.getElementById("sp-image").value = draft.image; document.getElementById("sp-preview").innerHTML = preview(draft);
        } catch (ex) { err.textContent = "Téléversement impossible : " + ex.message; }
      }
    });
    document.addEventListener("click", (e) => {
      const t = e.target; if (!t.closest("#admin-game")) return;
      if (t.closest("[data-sp-new]")) { draft = blankDraft(); editing = null; render(); const n = document.getElementById("sp-name"); if (n) n.focus(); return; }
      if (t.closest("[data-sp-cancel]")) { draft = null; editing = null; render(); return; }
      if (t.closest("[data-sp-upload]")) { document.getElementById("sp-file").click(); return; }
      const ed = t.closest("[data-sp-edit]"); if (ed) { const c = cards.find((x) => x.id === ed.dataset.spEdit); if (c) { draft = Object.assign(blankDraft(), c, { startsAt: dayStr(c.startsAtMs), endsAt: dayStr(c.endsAtMs) }); editing = c.id; render(); document.getElementById("sp-form").scrollIntoView({ block: "start", behavior: "smooth" }); } return; }
      const dl = t.closest("[data-sp-del]"); if (dl) { if (confirm("Supprimer définitivement cette carte (aucun exemplaire attribué) ?")) C.db.collection("special_cards").doc(dl.dataset.spDel).delete().then(() => load()).then(render).catch((ex) => C.toast("Suppression impossible : " + ex.message, "err")); return; }
      const g = t.closest("[data-sp-grant]"); if (g) { grantFor = grantFor === g.dataset.spGrant ? "" : g.dataset.spGrant; render(); const u = document.getElementById("gr-user"); if (u) u.focus(); return; }
      if (t.closest("[data-sp-grant-cancel]")) { grantFor = ""; render(); return; }
      const en = t.closest("[data-entry]"); if (en) { setEntry(en.dataset.id, en.dataset.entry); return; }
      if (t.closest("[data-ct-close]")) { if (confirm("Clôturer le concours maintenant ? Le gagnant sera couronné et recevra sa carte spéciale.")) contestAction("close", { month: contestId }); return; }
      if (t.closest("[data-ct-open]")) { contestAction("open"); return; }
      if (t.closest("[data-ct-new]")) { ctForm = true; render(); const el = document.getElementById("ctn-theme"); if (el) el.focus(); return; }
      if (t.closest("[data-ct-newcancel]")) { ctForm = false; render(); return; }
      if (t.closest("[data-ct-save]")) { saveContest(); return; }
    });
  });
})();
