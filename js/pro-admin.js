/**
 * MOTORAUTO PRO — onglet Administration › PRO (administrateurs uniquement, chargé à la demande).
 *   1. Réglages : inscriptions ouvertes, paiement réel (interrupteurs), prix ;
 *   2. Voiture : on choisit une voiture, puis on édite ses modifications par catégorie (silhouette cliquable ou grille) ;
 *   3. Catégories : ajout, renommage, suppression et réorganisation des catégories / sous-catégories, sans toucher au code.
 * Chaque modification a un statut (brouillon → relu → publié) ; seules les « publiées » sont visibles des abonnés.
 * L'écriture est réservée aux administrateurs par les règles Firestore (pro_config, pro_mods) : cette interface n'est qu'une commodité.
 * Aucun contenu technique n'est fourni par le code : tout est saisi ici par l'équipe.
 */
(function () {
  "use strict";
  let C = null, carId = "", catId = "", mods = [], form = null, catsDraft = null, busy = false, cfgBox = null;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => C.esc(String(s == null ? "" : s));
  const STATUS = window.MA_PRO_STATUS || [], LEVELS = window.MA_PRO_LEVELS || [];
  const cats = () => (window.MAPro ? window.MAPro.cats() : window.MA_PRO_DEFAULT_CATS || []);
  const carName = (c) => (c.brand + " " + c.model).trim();
  const who = () => (C.profile && C.profile.username) || ((C.user && C.user.email) || "admin").split("@")[0];
  const slug = (s) => C.normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "x";
  const uniq = (base, taken) => { let id = base, n = 2; while (taken.has(id)) id = base + "-" + n++; return id; };
  const statusLabel = (k) => (STATUS.find((x) => x[0] === k) || [k, k])[1];
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : 0);

  // ------------------------------------------------------------ silhouette générique (côté, 400 × 200) avec repères cliquables
  function carSvg(list) {
    const pins = list.map((c, i) => !c.pin ? "" : `<g class="mpa-pin${c.id === catId ? " on" : ""}" role="button" tabindex="0" data-pa-cat="${esc(c.id)}" aria-label="${esc(c.label)}"><circle cx="${c.pin[0]}" cy="${c.pin[1]}" r="15"/><text x="${c.pin[0]}" y="${c.pin[1]}">${i + 1}</text><title>${esc(c.label)}</title></g>`).join("");
    return `<svg class="mpa-svg" viewBox="0 0 400 200" role="img" aria-label="Silhouette d'automobile : touche un repère pour choisir une catégorie">
      <path class="car-body" d="M14 150 L14 124 Q14 112 30 108 L78 98 Q112 62 150 58 L236 58 Q276 60 304 94 L360 104 Q386 110 386 128 L386 150 Z"/>
      <path class="car-win" d="M104 96 Q130 70 156 68 L196 68 L196 96 Z M206 68 L236 68 Q262 70 282 96 L206 96 Z"/>
      <circle class="car-wheel" cx="104" cy="150" r="30"/><circle class="car-wheel" cx="296" cy="150" r="30"/>
      <line x1="0" y1="181" x2="400" y2="181" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/>${pins}</svg>`;
  }

  // ------------------------------------------------------------ données
  async function loadMods() {
    if (!carId) { mods = []; return; }
    try { mods = (await C.db.collection("pro_mods").where("carId", "==", carId).limit(500).get()).docs.map((d) => Object.assign({ id: d.id }, d.data())); }
    catch (e) { mods = []; C.toast("Lecture impossible : publie le fichier firestore.rules complet.", "err"); }
  }
  async function loadAll() { if (window.MAPro) await window.MAPro.reload(); }

  // ------------------------------------------------------------ rendu
  function settingsHtml() {
    const s = window.MAPro ? window.MAPro.cfg() : {};
    return `<details class="adm-sec" ${cfgBox ? "open" : ""} data-pa-sec="cfg"><summary><span class="adm-t">Réglages de l'offre PRO</span></summary><div class="adm-body mpa">
      <label class="mpa-toggle"><input type="checkbox" data-pa-cfg="signups" ${s.signups ? "checked" : ""}> Inscriptions ouvertes (les pilotes peuvent démarrer l'essai)</label>
      <label class="mpa-toggle"><input type="checkbox" data-pa-cfg="live" ${s.live ? "checked" : ""}> Paiement réel activé <small>(laisse décoché tant que les points légaux ne sont pas réglés : Stripe reste en mode test)</small></label>
      <div class="two mpa-row"><div class="input-stack"><label for="pa-price">Prix mensuel (€)</label><input id="pa-price" type="number" min="1" max="99" step="0.5" value="${esc(s.priceEur || 5)}" data-pa-cfg="priceEur"></div>
      <div class="input-stack"><label for="pa-trial">Essai gratuit (jours)</label><input id="pa-trial" type="number" min="0" max="365" step="1" value="${esc(s.trialDays == null ? 90 : s.trialDays)}" data-pa-cfg="trialDays"></div></div>
      <p class="admin-note">Les administrateurs ont toujours accès à PRO, gratuitement, sans abonnement.</p></div></details>`;
  }
  function carHtml() {
    const car = carId && C.carsById.get(carId);
    return `<details class="adm-sec" open><summary><span class="adm-t">Modifications d'une voiture</span></summary><div class="adm-body mpa">
      <div class="input-stack"><label for="pa-q">Voiture</label><input id="pa-q" type="search" autocomplete="off" placeholder="Marque ou modèle…" value="${car ? esc(carName(car)) : ""}"><div id="pa-res" class="mp-res" role="listbox"></div></div>
      <div id="pa-car">${car ? carBody(car) : `<div class="empty-note">Choisis une voiture pour éditer ses modifications.</div>`}</div></div></details>`;
  }
  function carBody(car) {
    const list = cats(), by = {};
    mods.forEach((m) => { (by[m.cat] = by[m.cat] || []).push(m); });
    const grid = list.map((c, i) => { const arr = by[c.id] || [], pub = arr.filter((m) => m.status === "published").length; return `<button type="button" class="mpa-cat${c.id === catId ? " on" : ""}" data-pa-cat="${esc(c.id)}"><b>${c.pin ? `${i + 1}. ` : ""}${esc(c.icon || "")} ${esc(c.label)}</b><small>${arr.length ? `${arr.length} fiche${arr.length > 1 ? "s" : ""} · ${pub} publiée${pub > 1 ? "s" : ""}` : "vide"}</small></button>`; }).join("");
    const cat = list.find((c) => c.id === catId);
    return `<p class="lap-meta"><b>${esc(carName(car))}</b> · ${mods.length} fiche${mods.length > 1 ? "s" : ""} (${mods.filter((m) => m.status === "published").length} publiée${mods.filter((m) => m.status === "published").length > 1 ? "s" : ""})</p>
      <div class="mpa-stage"><div>${carSvg(list)}</div><div class="mpa-grid">${grid}</div></div>
      ${form ? formHtml() : cat ? catBlock(cat, by[cat.id] || []) : `<div class="empty-note">Touche un repère de la silhouette ou une catégorie.</div>`}`;
  }
  function catBlock(cat, arr) {
    const subLabel = (id) => { const s = (cat.subs || []).find((x) => x.id === id); return s ? s.label : id ? id : "Général"; };
    const sorted = arr.slice().sort((a, b) => String(a.sub).localeCompare(String(b.sub)) || (a.order || 0) - (b.order || 0) || tsMs(b.updatedAt) - tsMs(a.updatedAt));
    return `<section class="cg-block"><header class="cg-bh"><h3>${esc(cat.icon || "")} ${esc(cat.label)}</h3><button type="button" class="cta-btn fill-btn compact-btn" data-pa="new">＋ Ajouter une modification</button></header>
      <div class="mpa-list">${sorted.map((m) => `<article class="mpa-item"><div class="mpa-row"><span class="mp-status mp-${esc(m.status)}">${esc(statusLabel(m.status))}</span><small>${esc(subLabel(m.sub))}</small></div>
        <h4>${esc(m.title)}</h4><small>${m.authorName ? "rédigé par " + esc(m.authorName) : ""}${m.reviewedByName ? " · relu par " + esc(m.reviewedByName) : ""}</small>
        <div class="mpa-row"><button type="button" class="cta-btn btn-ghost compact-btn" data-pa-edit="${esc(m.id)}">Modifier</button>${m.status === "draft" ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-pa-set="${esc(m.id)}" data-st="reviewed">Marquer relu</button>` : ""}${m.status === "reviewed" ? `<button type="button" class="cta-btn fill-btn compact-btn" data-pa-set="${esc(m.id)}" data-st="published">Publier</button>` : ""}${m.status !== "draft" ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-pa-set="${esc(m.id)}" data-st="draft">Repasser en brouillon</button>` : ""}</div></article>`).join("") || `<div class="empty-note">Aucune modification pour cette catégorie.</div>`}</div></section>`;
  }
  function formHtml() {
    const f = form, cat = cats().find((c) => c.id === f.cat) || { subs: [] };
    const sel = (k, opts) => `<select id="pa-${k}" data-pa-f="${k}">${opts.map((o) => `<option value="${esc(o[0])}" ${String(f[k] || "") === String(o[0]) ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`;
    const txt = (k, l, rows, max) => `<div class="input-stack"><label for="pa-${k}">${l}</label><textarea id="pa-${k}" data-pa-f="${k}" rows="${rows}" maxlength="${max}">${esc(f[k])}</textarea></div>`;
    const swap = f.sub === "swap-moteur";
    return `<form class="mpa-form" id="pa-form" novalidate>
      <h3 style="margin:0">${f.id ? "Modifier" : "Nouvelle modification"} — ${esc(cat.label || "")}</h3>
      <p class="mp-warn" role="note"><span aria-hidden="true">⚠</span> <span><b>Ne rien inventer.</b> N'écris que des informations que tu as vérifiées (source fiable, expérience de pro). Cet avertissement sera affiché avec la modification : « ${esc(window.MA_PRO_WARNING)} »</span></p>
      <div class="two"><div class="input-stack"><label for="pa-sub">Sous-catégorie</label>${sel("sub", [["", "Général"]].concat((cat.subs || []).map((s) => [s.id, s.label])))}</div><div class="input-stack"><label for="pa-status">Statut</label>${sel("status", STATUS)}</div></div>
      <div class="input-stack"><label for="pa-title">Titre (obligatoire)</label><input id="pa-title" data-pa-f="title" maxlength="120" required value="${esc(f.title)}"></div>
      ${txt("description", "Description", 5, 4000)}
      ${swap ? `<div class="input-stack"><label for="pa-engine">Moteur du swap (fiche moteur existante)</label><input id="pa-engine" data-pa-f="engineLabel" list="pa-engines" maxlength="120" value="${esc(f.engineLabel)}" placeholder="Commence à taper le nom du moteur…"><datalist id="pa-engines">${engineOptions()}</datalist><small class="lap-meta">N'ajoute que des swaps réellement faisables (gabarit, poids, refroidissement, transmission). ${esc(window.MA_PRO_SWAP_NOTE)}</small></div>` : ""}
      <div class="two">${txt("gain", "Gain / effet", 3, 1000)}<div class="input-stack"><label for="pa-difficulty">Difficulté</label>${sel("difficulty", LEVELS)}</div></div>
      <div class="two"><div class="input-stack"><label for="pa-cost">Coût indicatif</label><input id="pa-cost" data-pa-f="cost" maxlength="200" value="${esc(f.cost)}" placeholder="ex. fourchette en euros"></div><div class="input-stack"><label for="pa-order">Ordre d'affichage</label><input id="pa-order" data-pa-f="order" type="number" min="0" max="999" step="1" value="${esc(f.order || 0)}"></div></div>
      ${txt("compat", "Compatibilité", 3, 1000)}${txt("risks", "Risques", 3, 1500)}${txt("homolog", "Remarque d'homologation", 3, 1500)}
      <div class="mpa-row"><button type="submit" class="cta-btn fill-btn">Enregistrer</button><button type="button" class="cta-btn btn-ghost" data-pa="cancel">Annuler</button>${f.id ? `<button type="button" class="cta-btn btn-ghost" style="color:#ef4444" data-pa="delete">Supprimer</button>` : ""}</div>
      <p class="admin-note" id="pa-msg" role="status"></p></form>`;
  }
  let engIdx = null;
  function engines() { if (!engIdx && window.MA && window.MA.buildEngineIndex) { try { engIdx = window.MA.buildEngineIndex(C.cars); } catch (_) { engIdx = new Map(); } } return engIdx || new Map(); }
  function engineOptions() { const out = []; engines().forEach((v) => { if (v && v.label) out.push(`<option value="${esc(v.label)}"></option>`); }); return out.slice(0, 1500).join(""); }
  function engineKeyOf(label) { let key = ""; engines().forEach((v, k) => { if (!key && v && v.label === label) key = k; }); return key; }

  function catsEditorHtml() {
    const list = catsDraft || cats();
    const row = (kind, ci, si, o, n) => `<div class="mpa-edit-row"><input data-pa-name="${kind}" data-ci="${ci}" ${si != null ? `data-si="${si}"` : ""} maxlength="60" value="${esc(o.label)}" aria-label="Nom"><span class="mpa-mini"><button type="button" data-pa-mv="${kind}" data-ci="${ci}" ${si != null ? `data-si="${si}"` : ""} data-d="-1" aria-label="Monter" ${(kind === "cat" ? ci : si) === 0 ? "disabled" : ""}>↑</button><button type="button" data-pa-mv="${kind}" data-ci="${ci}" ${si != null ? `data-si="${si}"` : ""} data-d="1" aria-label="Descendre" ${(kind === "cat" ? ci : si) === n - 1 ? "disabled" : ""}>↓</button><button type="button" class="del" data-pa-del="${kind}" data-ci="${ci}" ${si != null ? `data-si="${si}"` : ""} aria-label="Supprimer">✕</button></span></div>`;
    return `<details class="adm-sec" data-pa-sec="cats"><summary><span class="adm-t">Catégories et sous-catégories</span></summary><div class="adm-body mpa">
      <p class="admin-note">Ajoute, renomme, supprime ou réordonne librement. Les modifications déjà saisies restent rattachées à leur catégorie (même renommée). Pense à enregistrer.</p>
      ${list.map((c, ci) => `<div class="mpa-edit"><div class="mpa-edit-row"><input data-pa-icon data-ci="${ci}" maxlength="4" value="${esc(c.icon || "")}" aria-label="Icône" style="max-width:64px;text-align:center"><span></span></div>${row("cat", ci, null, c, list.length)}
        <div class="mpa-subs">${(c.subs || []).map((s, si) => row("sub", ci, si, s, c.subs.length)).join("")}<button type="button" class="cta-btn btn-ghost compact-btn" data-pa-add="sub" data-ci="${ci}">＋ Sous-catégorie</button></div></div>`).join("")}
      <div class="mpa-row"><button type="button" class="cta-btn btn-ghost" data-pa-add="cat">＋ Catégorie</button><button type="button" class="cta-btn fill-btn" data-pa="save-cats">Enregistrer les catégories</button><button type="button" class="cta-btn btn-ghost" data-pa="reset-cats">Revenir à la liste de départ</button></div></div></details>`;
  }
  function render() {
    const root = $("admin-pro"); if (!root || !C.isAdmin) return;
    const open = Array.from(root.querySelectorAll("details[data-pa-sec][open]")).map((d) => d.dataset.paSec);
    root.innerHTML = `<div class="mpa">${settingsHtml()}${carHtml()}${catsEditorHtml()}</div>`;
    open.forEach((k) => { const d = root.querySelector(`details[data-pa-sec="${k}"]`); if (d) d.open = true; });
  }

  // ------------------------------------------------------------ actions
  async function saveCfg(key, val) {
    const cur = window.MAPro.cfg();
    if (key === "live" && val && !confirm("Activer le paiement RÉEL ? Les abonnés seront vraiment débités. N'active que si le cadre légal est en place (statut, CGV, mentions…).")) { render(); return; }
    if (key === "signups" && val && !confirm("Ouvrir les inscriptions PRO au public ?")) { render(); return; }
    const next = Object.assign({}, { signups: !!cur.signups, live: !!cur.live, priceEur: Number(cur.priceEur) || 5, trialDays: cur.trialDays == null ? 90 : Number(cur.trialDays) }, { [key]: val });
    try { await C.db.collection("pro_config").doc("settings").set(Object.assign(next, { updatedAt: C.FieldValue.serverTimestamp(), updatedBy: C.user.uid })); await window.MAPro.reload(); C.toast("Réglage enregistré.", "ok"); }
    catch (e) { C.toast("Enregistrement impossible : publie le fichier firestore.rules complet.", "err"); }
    render();
  }
  function blank(sub) { return { id: "", cat: catId, sub: sub || "", title: "", description: "", gain: "", difficulty: "", cost: "", compat: "", risks: "", homolog: "", engineLabel: "", engineKey: "", status: "draft", order: 0 }; }
  function readForm() { const f = form; document.querySelectorAll("#pa-form [data-pa-f]").forEach((el) => { f[el.dataset.paF] = el.value; }); return f; }
  async function saveMod() {
    const f = readForm(), msg = $("pa-msg");
    const title = String(f.title || "").trim();
    if (!title) { msg.textContent = "Le titre est obligatoire."; $("pa-title").focus(); return; }
    if (!carId || !f.cat) return;
    const num = Math.max(0, Math.min(999, Math.round(Number(f.order) || 0)));
    const prev = f.id ? mods.find((m) => m.id === f.id) : null;
    const d = { carId, cat: f.cat, sub: f.sub || "", title: title.slice(0, 120), description: String(f.description || "").slice(0, 4000), gain: String(f.gain || "").slice(0, 1000), difficulty: f.difficulty || "", cost: String(f.cost || "").slice(0, 200), compat: String(f.compat || "").slice(0, 1000), risks: String(f.risks || "").slice(0, 1500), homolog: String(f.homolog || "").slice(0, 1500), engineKey: f.sub === "swap-moteur" ? engineKeyOf(String(f.engineLabel || "")) : "", status: f.status, order: num, author: (prev && prev.author) || C.user.uid, authorName: (prev && prev.authorName) || who(), updatedAt: C.FieldValue.serverTimestamp() };
    if (f.sub === "swap-moteur" && f.engineLabel && !d.engineKey) { msg.textContent = "Ce moteur n'existe pas dans les fiches moteurs : choisis-le dans la liste proposée."; return; }
    if (d.status !== "draft") { d.reviewedBy = (prev && prev.reviewedBy) || C.user.uid; d.reviewedByName = (prev && prev.reviewedByName) || who(); }
    else { d.reviewedBy = ""; d.reviewedByName = ""; }
    if (d.status !== "draft" && d.author === C.user.uid && !(prev && prev.reviewedBy && prev.reviewedBy !== prev.author) && !confirm("Tu es l'auteur de cette fiche : idéalement, un autre administrateur la relit avant publication. Continuer quand même ?")) return;
    busy = true;
    try {
      if (f.id) await C.db.collection("pro_mods").doc(f.id).set(d); else { d.createdAt = C.FieldValue.serverTimestamp(); await C.db.collection("pro_mods").add(d); }
      window.MAPro.modsCache.delete(carId); form = null; await loadMods(); C.toast("Modification enregistrée.", "ok");
    } catch (e) { msg.textContent = "Enregistrement refusé : " + (e && e.code === "permission-denied" ? "règles Firestore à publier (fichier complet)." : (e && e.message) || "erreur"); busy = false; return; }
    busy = false; render();
  }
  async function setStatus(id, st) {
    const m = mods.find((x) => x.id === id); if (!m) return;
    if (st !== "draft" && m.author === C.user.uid && !confirm("Tu es l'auteur de cette fiche : idéalement, un autre administrateur la relit. Continuer quand même ?")) return;
    const patch = { status: st, updatedAt: C.FieldValue.serverTimestamp() };
    if (st === "draft") { patch.reviewedBy = ""; patch.reviewedByName = ""; } else if (!m.reviewedBy) { patch.reviewedBy = C.user.uid; patch.reviewedByName = who(); }
    try { await C.db.collection("pro_mods").doc(id).update(patch); window.MAPro.modsCache.delete(carId); await loadMods(); C.toast("Statut : " + statusLabel(st) + ".", "ok"); } catch (e) { C.toast("Action refusée (règles Firestore ?).", "err"); }
    render();
  }
  async function delMod() {
    if (!form || !form.id || !confirm("Supprimer définitivement cette modification ?")) return;
    try { await C.db.collection("pro_mods").doc(form.id).delete(); window.MAPro.modsCache.delete(carId); form = null; await loadMods(); C.toast("Supprimée.", "ok"); } catch (e) { C.toast("Suppression refusée.", "err"); }
    render();
  }
  function suggest(q) {
    const res = $("pa-res"); if (!res) return;
    const n = C.normalize(q).trim(); if (n.length < 2) { res.innerHTML = ""; return; }
    const w = n.split(/\s+/), out = [];
    for (const c of C.cars) { if (w.every((x) => C.normalize(carName(c)).includes(x))) { out.push(c); if (out.length >= 12) break; } }
    res.innerHTML = out.map((c) => `<button type="button" role="option" class="mp-opt" data-pa-car="${esc(c.id)}">${esc(carName(c))}${c.years ? `<small>${esc(String(c.years))}</small>` : ""}</button>`).join("");
  }
  // ---- éditeur de catégories
  const draft = () => (catsDraft = catsDraft || JSON.parse(JSON.stringify(cats())));
  function move(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  async function saveCats() {
    const list = draft(), taken = new Set();
    for (const c of list) {
      c.label = String(c.label || "").trim().slice(0, 60); if (!c.label) { C.toast("Une catégorie n'a pas de nom.", "err"); return; }
      if (!c.id || taken.has(c.id)) c.id = uniq(slug(c.label), taken); taken.add(c.id);
      const st = new Set(); c.subs = (c.subs || []).filter((s) => String(s.label || "").trim()).map((s) => { s.label = String(s.label).trim().slice(0, 60); if (!s.id || st.has(s.id)) s.id = uniq(slug(s.label), st); st.add(s.id); return s; });
      if (c.subs.length > 60) { C.toast("Trop de sous-catégories (60 max).", "err"); return; }
    }
    if (list.length > 40) { C.toast("Trop de catégories (40 max).", "err"); return; }
    const clean = list.map((c) => { const o = { id: c.id, label: c.label, icon: String(c.icon || "").slice(0, 4), subs: c.subs.map((s) => ({ id: s.id, label: s.label })) }; if (c.pin) o.pin = c.pin; return o; });
    try { await C.db.collection("pro_config").doc("cats").set({ cats: clean, updatedAt: C.FieldValue.serverTimestamp(), updatedBy: C.user.uid }); catsDraft = null; await window.MAPro.reload(); C.toast("Catégories enregistrées.", "ok"); }
    catch (e) { C.toast("Enregistrement refusé : publie le fichier firestore.rules complet.", "err"); }
    render();
  }

  function onClick(e) {
    const t = e.target, q = (s) => t.closest(s);
    let b;
    if ((b = q("[data-pa-car]"))) { carId = b.dataset.paCar; catId = ""; form = null; const car = C.carsById.get(carId); loadMods().then(() => { render(); const i = $("pa-q"); if (i && car) i.value = carName(car); }); return; }
    if ((b = q("[data-pa-cat]"))) { catId = b.dataset.paCat; form = null; render(); const el = $("pa-car"); if (el && el.scrollIntoView && window.innerWidth < 900) el.querySelector(".cg-block, .mpa-form") && el.querySelector(".cg-block, .mpa-form").scrollIntoView({ block: "nearest", behavior: "smooth" }); return; }
    if ((b = q("[data-pa-edit]"))) { const m = mods.find((x) => x.id === b.dataset.paEdit); if (m) { form = Object.assign(blank(), m); const v = engines().get(m.engineKey); form.engineLabel = v ? v.label : ""; render(); const f = $("pa-form"); if (f) f.scrollIntoView({ block: "start", behavior: "smooth" }); } return; }
    if ((b = q("[data-pa-set]"))) { setStatus(b.dataset.paSet, b.dataset.st); return; }
    if ((b = q("[data-pa]"))) {
      const k = b.dataset.pa;
      if (k === "new") { form = blank(); render(); const f = $("pa-form"); if (f) f.scrollIntoView({ block: "start", behavior: "smooth" }); }
      else if (k === "cancel") { form = null; render(); }
      else if (k === "delete") delMod();
      else if (k === "save-cats") saveCats();
      else if (k === "reset-cats") { if (confirm("Revenir à la liste de départ ? (Les modifications déjà saisies ne sont pas supprimées.)")) { catsDraft = JSON.parse(JSON.stringify(window.MA_PRO_DEFAULT_CATS)); render(); const d = document.querySelector('#admin-pro details[data-pa-sec="cats"]'); if (d) d.open = true; } }
      return;
    }
    if ((b = q("[data-pa-add]"))) { const l = draft(); if (b.dataset.paAdd === "cat") l.push({ id: "", label: "Nouvelle catégorie", icon: "🔧", subs: [] }); else l[+b.dataset.ci].subs.push({ id: "", label: "Nouvelle sous-catégorie" }); render(); const d = document.querySelector('#admin-pro details[data-pa-sec="cats"]'); if (d) d.open = true; return; }
    if ((b = q("[data-pa-mv]"))) { const l = draft(), ci = +b.dataset.ci, d = +b.dataset.d; if (b.dataset.paMv === "cat") move(l, ci, d); else move(l[ci].subs, +b.dataset.si, d); render(); const s = document.querySelector('#admin-pro details[data-pa-sec="cats"]'); if (s) s.open = true; return; }
    if ((b = q("[data-pa-del]"))) { const l = draft(), ci = +b.dataset.ci; if (b.dataset.paDel === "cat") { if (!confirm("Supprimer cette catégorie et ses sous-catégories de la liste ? (Les modifications déjà saisies ne sont pas effacées mais ne seront plus rangées.)")) return; l.splice(ci, 1); } else l[ci].subs.splice(+b.dataset.si, 1); render(); const s = document.querySelector('#admin-pro details[data-pa-sec="cats"]'); if (s) s.open = true; }
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === "pa-q") { suggest(t.value); return; }
    if (t.dataset.paName) { const l = draft(), ci = +t.dataset.ci; (t.dataset.paName === "cat" ? l[ci] : l[ci].subs[+t.dataset.si]).label = t.value; return; }
    if (t.dataset.paIcon !== undefined) draft()[+t.dataset.ci].icon = t.value;
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.paCfg) { saveCfg(t.dataset.paCfg, t.type === "checkbox" ? t.checked : Number(t.value)); return; }
    if (t.id === "pa-sub" && form) { readForm(); render(); }
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.Router.register("admin", { enter: async (p) => { if (p.tab !== "pro" || !C.isAdmin) return; if (window.MAPro) await window.MAPro.reload(); await loadMods(); render(); } });
    const root = () => $("admin-pro");
    document.addEventListener("click", (e) => { if (root() && root().contains(e.target)) onClick(e); });
    document.addEventListener("input", (e) => { if (root() && root().contains(e.target)) onInput(e); });
    document.addEventListener("change", (e) => { if (root() && root().contains(e.target)) onChange(e); });
    document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("mpa-pin")) { e.preventDefault(); onClick({ target: e.target }); } });
    document.addEventListener("submit", (e) => { if (e.target.id === "pa-form") { e.preventDefault(); if (!busy) saveMod(); } });
  });
})();
