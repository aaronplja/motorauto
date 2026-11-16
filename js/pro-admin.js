/**
 * MOTORAUTO PRO — onglet Administration › PRO (administrateurs uniquement, chargé à la demande).
 * Cinq sections, de la plus utilisée à la moins utilisée :
 *   Fiches          choisir une voiture → une catégorie → « ＋ Ajouter » à côté de la sous-catégorie → remplir → enregistrer
 *   À relire        toutes les fiches pas encore publiées (toutes voitures confondues), à relire puis publier en un clic
 *   Accès offerts   offrir, prolonger ou retirer l'accès PRO d'un pilote, autant de fois que voulu (collection pro_grants)
 *   Catégories      ajouter / renommer / supprimer / réordonner les catégories et sous-catégories, sans toucher au code
 *   Réglages        inscriptions ouvertes, paiement réel, prix, durée de l'essai
 * Chaque fiche a un statut (brouillon → relu → publié) ; seules les « publiées » sont visibles des abonnés.
 * L'écriture est réservée aux administrateurs par les règles Firestore (pro_config, pro_mods, pro_grants) : cette interface n'est qu'une commodité.
 * Aucun contenu technique n'est fourni par le code : tout est saisi ici par l'équipe.
 */
(function () {
  "use strict";
  let C = null, view = "fiches", all = [], carId = "", catId = "", form = null, filter = "all", prev = new Set(), copyFor = "", catsDraft = null, busy = false;
  let users = null, grants = [], subs = [], pickUid = "", pickName = "", accessLoaded = false, accessErr = false;
  const FKEY = "ma_pro_form_v1", FOREVER = Date.UTC(2100, 0, 1);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => C.esc(String(s == null ? "" : s));
  const STATUS = window.MA_PRO_STATUS || [], LEVELS = window.MA_PRO_LEVELS || [];
  const cats = () => (window.MAPro ? window.MAPro.cats() : window.MA_PRO_DEFAULT_CATS || []);
  const carName = (c) => (c.brand + " " + c.model).trim();
  const who = () => (C.profile && C.profile.username) || ((C.user && C.user.email) || "admin").split("@")[0];
  const slug = (s) => C.normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "x";
  const uniq = (base, taken) => { let id = base, n = 2; while (taken.has(id)) id = base + "-" + n++; return id; };
  const statusLabel = (k) => (STATUS.find((x) => x[0] === k) || [k, k])[1];
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : t && t.seconds ? t.seconds * 1000 : Number(t) || 0);
  const fmt = (v) => { const t = tsMs(v); if (!t) return "—"; if (t >= FOREVER - 864e5) return "sans limite"; try { return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); } catch (_) { return new Date(t).toISOString().slice(0, 10); } };
  const plural = (n, a, b) => n + " " + (n > 1 ? b : a);
  const LS = { get() { try { return JSON.parse(localStorage.getItem(FKEY) || "null"); } catch (_) { return null; } }, set(v) { try { localStorage.setItem(FKEY, JSON.stringify(v)); } catch (_) { /* ignoré */ } }, del() { try { localStorage.removeItem(FKEY); } catch (_) { /* ignoré */ } } };
  const addMonths = (t, n) => { const d = new Date(t); d.setMonth(d.getMonth() + n); return d.getTime(); };
  const toTs = (ms) => { try { return window.MAFB.firebase.firestore.Timestamp.fromMillis(ms); } catch (_) { return new Date(ms); } };
  const FIELDS = ["description", "gain", "difficulty", "cost", "compat", "risks", "homolog"];
  const LABEL = { description: "description", gain: "gain / effet", difficulty: "difficulté", cost: "coût", compat: "compatibilité", risks: "risques", homolog: "homologation" };

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
  async function loadAll() {
    try { all = (await C.db.collection("pro_mods").limit(2000).get()).docs.map((d) => Object.assign({ id: d.id }, d.data())); }
    catch (e) { all = []; C.toast("Lecture impossible : publie le fichier firestore.rules complet.", "err"); }
  }
  async function refresh(id) { const s = await C.db.collection("pro_mods").doc(id).get(); const i = all.findIndex((x) => x.id === id); if (!s.exists) { if (i >= 0) all.splice(i, 1); return; } const m = Object.assign({ id }, s.data()); if (i >= 0) all[i] = m; else all.push(m); }
  const carMods = () => all.filter((m) => m.carId === carId);
  const done = (m) => FIELDS.filter((k) => String(m[k] || "").trim()).length;
  const nameOfCar = (id) => { const c = C.carsById.get(id); return c ? carName(c) : id; };
  async function loadAccess(force) {
    if (accessLoaded && !force) return;
    const usersQ = () => C.db.collection("users").limit(500).get();
    const [u, g, s] = await Promise.all([
      (window.MAAdminCache ? window.MAAdminCache.get("users", usersQ, 60000) : usersQ()).catch(() => null),
      C.db.collection("pro_grants").limit(500).get().catch(() => null),
      C.db.collection("pro_subs").limit(300).get().catch(() => null)
    ]);
    users = u ? u.docs.map((d) => ({ uid: d.id, name: String((d.data() || {}).username || "") })) : [];
    accessErr = !g;
    grants = g ? g.docs.map((d) => Object.assign({ uid: d.id }, d.data())) : [];
    subs = s ? s.docs.map((d) => Object.assign({ uid: d.id }, d.data())) : [];
    accessLoaded = true;
  }
  const nameOf = (uid) => { const u = (users || []).find((x) => x.uid === uid); if (u && u.name) return u.name; const g = grants.find((x) => x.uid === uid); return (g && g.userName) || "Pilote " + uid.slice(0, 5); };

  // ------------------------------------------------------------ rendu : barre des sections
  const VIEWS = [["fiches", "Fiches"], ["review", "À relire"], ["access", "Accès offerts"], ["cats", "Catégories"], ["cfg", "Réglages"]];
  function tabsHtml() {
    const n = all.filter((m) => m.status !== "published").length;
    return `<nav class="mpa-tabs" role="tablist" aria-label="Sections PRO">${VIEWS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${view === k}" class="mpa-tab${view === k ? " on" : ""}" data-pa-view="${k}">${l}${k === "review" && n ? ` <b class="mpa-n">${n}</b>` : ""}</button>`).join("")}</nav>`;
  }
  const pill = (st) => `<span class="mp-status mp-${esc(st)}">${esc(statusLabel(st))}</span>`;
  const steps = (st) => { const i = ["draft", "reviewed", "published"].indexOf(st); return `<ol class="mpa-steps" aria-label="Avancement"><li class="${i >= 0 ? "on" : ""}">Brouillon</li><li class="${i >= 1 ? "on" : ""}">Relu</li><li class="${i >= 2 ? "on" : ""}">Publié</li></ol>`; };

  // ------------------------------------------------------------ section Fiches
  function recentCars() {
    const seen = new Set(), out = [];
    all.slice().sort((a, b) => tsMs(b.updatedAt) - tsMs(a.updatedAt)).forEach((m) => { if (!seen.has(m.carId) && C.carsById.get(m.carId) && out.length < 8) { seen.add(m.carId); out.push(m.carId); } });
    return out;
  }
  function fichesHtml() {
    const pub = all.filter((m) => m.status === "published").length, rev = all.filter((m) => m.status === "reviewed").length, dr = all.filter((m) => m.status === "draft").length;
    const rc = recentCars(), car = carId && C.carsById.get(carId);
    return `<details class="adm-sec mpa-help" data-pa-sec="help" ${all.length ? "" : "open"}><summary><span class="adm-t">Comment ajouter une modification ?</span></summary><div class="adm-body"><ol class="mpa-how">
        <li><b>Choisis une voiture</b> en tapant son nom ci-dessous.</li>
        <li><b>Choisis une catégorie</b> (silhouette ou liste), puis touche <b>＋ Ajouter</b> à côté de la sous-catégorie voulue.</li>
        <li><b>Remplis la fiche</b> : seul le titre est obligatoire pour un brouillon (la description l'est pour publier). Le travail est sauvegardé automatiquement sur cet appareil.</li>
        <li><b>Relis, puis publie</b> : brouillon → relu → publié. Seules les fiches publiées sont vues des abonnés. L'onglet <b>À relire</b> liste tout ce qui attend.</li></ol></div></details>
      <div class="mpa-stats"><div><b>${all.length}</b><small>fiches</small></div><div><b>${dr}</b><small>brouillon${dr > 1 ? "s" : ""}</small></div><div><b>${rev}</b><small>relue${rev > 1 ? "s" : ""}</small></div><div><b>${pub}</b><small>publiée${pub > 1 ? "s" : ""}</small></div></div>
      <div class="input-stack"><label for="pa-q">1 · Choisis une voiture</label><input id="pa-q" type="search" autocomplete="off" placeholder="Marque ou modèle…" value="${car ? esc(carName(car)) : ""}"><div id="pa-res" class="mp-res" role="listbox"></div></div>
      ${rc.length ? `<div class="mpa-chips"><small>Récentes :</small>${rc.map((id) => `<button type="button" class="mpa-chip${id === carId ? " on" : ""}" data-pa-car="${esc(id)}">${esc(nameOfCar(id))}<em>${all.filter((m) => m.carId === id).length}</em></button>`).join("")}</div>` : ""}
      <div id="pa-car">${car ? carBody(car) : `<div class="empty-note">Choisis une voiture pour voir et ajouter ses modifications.</div>`}</div>`;
  }
  function carBody(car) {
    const list = cats(), mods = carMods(), by = {};
    mods.forEach((m) => { (by[m.cat] = by[m.cat] || []).push(m); });
    const grid = list.map((c, i) => { const arr = by[c.id] || [], pub = arr.filter((m) => m.status === "published").length; return `<button type="button" class="mpa-cat${c.id === catId ? " on" : ""}" data-pa-cat="${esc(c.id)}"><b>${c.pin ? `${i + 1}. ` : ""}${esc(c.icon || "")} ${esc(c.label)}</b><small>${arr.length ? `${plural(arr.length, "fiche", "fiches")} · ${pub} publiée${pub > 1 ? "s" : ""}` : "vide"}</small></button>`; }).join("");
    const cat = list.find((c) => c.id === catId), n = (st) => mods.filter((m) => m.status === st).length;
    const chips = [["all", "Toutes", mods.length], ["draft", "Brouillons", n("draft")], ["reviewed", "Relues", n("reviewed")], ["published", "Publiées", n("published")]];
    return `<p class="lap-meta"><b>${esc(carName(car))}</b> · ${plural(mods.length, "fiche", "fiches")} (${n("published")} publiée${n("published") > 1 ? "s" : ""})</p>
      <h3 class="mpa-h">2 · Choisis une catégorie</h3>
      <div class="mpa-stage"><div>${carSvg(list)}</div><div class="mpa-grid">${grid}</div></div>
      ${form ? formHtml() : cat ? `<div class="mpa-chips mpa-filter" role="group" aria-label="Filtrer">${chips.map((c) => `<button type="button" class="mpa-chip${filter === c[0] ? " on" : ""}" data-pa-filter="${c[0]}" aria-pressed="${filter === c[0]}">${c[1]}<em>${c[2]}</em></button>`).join("")}</div>${catBlock(cat, by[cat.id] || [])}` : `<div class="empty-note">Touche un repère de la silhouette ou une catégorie.</div>`}`;
  }
  function catBlock(cat, arr) {
    const subsList = (cat.subs || []).map((s) => ({ id: s.id, label: s.label })), known = new Set(subsList.map((s) => s.id));
    const groups = [{ id: "", label: "Général (sans sous-catégorie)" }].concat(subsList);
    arr.forEach((m) => { if (m.sub && !known.has(m.sub) && !groups.find((g) => g.id === m.sub)) groups.push({ id: m.sub, label: m.sub }); });
    const ok = (m) => filter === "all" || m.status === filter;
    const body = groups.map((g) => {
      const mine = arr.filter((m) => (m.sub || "") === g.id), shown = mine.filter(ok).sort((a, b) => (a.order || 0) - (b.order || 0) || tsMs(b.updatedAt) - tsMs(a.updatedAt));
      if (g.id === "" && !mine.length) return "";
      return `<section class="mpa-subgrp"><header><h4>${esc(g.label)} <small>${mine.length ? plural(mine.length, "fiche", "fiches") : "aucune"}</small></h4><button type="button" class="cta-btn btn-ghost compact-btn" data-pa="new" data-sub="${esc(g.id)}">＋ Ajouter</button></header>
        ${shown.map((m) => itemHtml(m, g.label)).join("")}${mine.length && !shown.length ? `<p class="lap-meta">Aucune fiche avec ce filtre.</p>` : ""}</section>`;
    }).join("");
    return `<section class="cg-block"><header class="cg-bh"><h3>${esc(cat.icon || "")} ${esc(cat.label)}</h3><button type="button" class="cta-btn fill-btn compact-btn" data-pa="new" data-sub="">＋ Ajouter une modification</button></header><div class="mpa-list">${body}</div></section>`;
  }
  function itemHtml(m, subLbl) {
    const c = done(m), next = m.status === "draft" ? ["reviewed", "Marquer relu", "btn-ghost"] : m.status === "reviewed" ? ["published", "Publier", "fill-btn"] : null;
    const back = m.status === "published" ? "Dépublier" : m.status === "reviewed" ? "Repasser en brouillon" : "";
    return `<article class="mpa-item" id="pa-it-${esc(m.id)}"><div class="mpa-row">${pill(m.status)}${steps(m.status)}</div>
      <h4>${esc(m.title)}</h4><small>${m.authorName ? "rédigé par " + esc(m.authorName) : ""}${m.reviewedByName ? " · relu par " + esc(m.reviewedByName) : ""} · complète à ${c}/${FIELDS.length}</small>
      <div class="mpa-row"><button type="button" class="cta-btn btn-ghost compact-btn" data-pa-edit="${esc(m.id)}">Modifier</button>${next ? `<button type="button" class="cta-btn ${next[2]} compact-btn" data-pa-set="${esc(m.id)}" data-st="${next[0]}">${next[1]}</button>` : ""}${back ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-pa-set="${esc(m.id)}" data-st="draft">${back}</button>` : ""}
        <button type="button" class="cta-btn btn-ghost compact-btn" data-pa-prev="${esc(m.id)}" aria-pressed="${prev.has(m.id)}">${prev.has(m.id) ? "Masquer l'aperçu" : "Aperçu"}</button>
        <button type="button" class="cta-btn btn-ghost compact-btn" data-pa-dup="${esc(m.id)}">Dupliquer</button>
        <button type="button" class="cta-btn btn-ghost compact-btn" data-pa-copy="${esc(m.id)}">Copier vers une autre voiture</button></div>
      ${copyFor === m.id ? `<div class="mpa-copy"><label for="pa-copyq">Copier vers quelle voiture ?</label><input id="pa-copyq" type="search" autocomplete="off" placeholder="Marque ou modèle…"><div id="pa-copyres" class="mp-res" role="listbox"></div><small class="lap-meta">La copie arrive en brouillon, à relire avant publication.</small></div>` : ""}
      ${prev.has(m.id) && window.MAPro ? `<div class="mpa-prev"><small class="lap-meta">Aperçu tel que le verra un abonné :</small>${window.MAPro.modHtml(m, subLbl)}</div>` : ""}</article>`;
  }
  function formHtml() {
    const f = form, cat = cats().find((c) => c.id === f.cat) || { subs: [] };
    const sel = (k, opts) => `<select id="pa-${k}" data-pa-f="${k}">${opts.map((o) => `<option value="${esc(o[0])}" ${String(f[k] || "") === String(o[0]) ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`;
    const txt = (k, l, rows, max, hint) => `<div class="input-stack"><label for="pa-${k}">${l}</label><textarea id="pa-${k}" data-pa-f="${k}" rows="${rows}" maxlength="${max}">${esc(f[k])}</textarea><small class="mpa-hint">${hint} <span class="mpa-count" data-count="${k}" data-max="${max}"></span></small></div>`;
    const swap = f.sub === "swap-moteur";
    return `<form class="mpa-form" id="pa-form" novalidate>
      <div class="mpa-row"><button type="button" class="cta-btn btn-ghost compact-btn" data-pa="cancel">← Retour à la liste</button>${f.id ? pill(f.status) : `<span class="mp-status mp-draft">Nouvelle fiche</span>`}</div>
      <h3 style="margin:0">${f.id ? "Modifier" : "Nouvelle modification"} · ${esc(nameOfCar(carId))} · ${esc(cat.label || "")}</h3>
      ${f._restored ? `<p class="mpa-restored" role="status">Brouillon non enregistré retrouvé (sauvegarde automatique sur cet appareil).</p>` : ""}
      <p class="mp-warn" role="note"><span aria-hidden="true">⚠</span> <span><b>Ne rien inventer.</b> N'écris que des informations vérifiées (source fiable, expérience de pro). Cet avertissement sera affiché avec la modification : « ${esc(window.MA_PRO_WARNING)} »</span></p>
      <div class="input-stack"><label for="pa-title">Titre <b class="mpa-req" title="obligatoire">*</b></label><input id="pa-title" data-pa-f="title" maxlength="120" required value="${esc(f.title)}" placeholder="Nom court de la modification"><small class="mpa-hint">Obligatoire. Court et clair, c'est ce que le pilote voit en premier. <span class="mpa-count" data-count="title" data-max="120"></span></small></div>
      <div class="input-stack"><label for="pa-sub">Sous-catégorie</label>${sel("sub", [["", "Général"]].concat((cat.subs || []).map((s) => [s.id, s.label])))}</div>
      ${txt("description", "Description <b class=\"mpa-req\" title=\"obligatoire pour publier\">*</b>", 5, 4000, "Explique ce qu'est la modification et pourquoi on la fait. Nécessaire pour publier.")}
      ${swap ? `<div class="input-stack"><label for="pa-engine">Moteur du swap (fiche moteur existante)</label><input id="pa-engine" data-pa-f="engineLabel" list="pa-engines" maxlength="120" value="${esc(f.engineLabel)}" placeholder="Commence à taper le nom du moteur…"><datalist id="pa-engines">${engineOptions()}</datalist><small class="mpa-hint">N'ajoute que des swaps réellement faisables (gabarit, poids, refroidissement, transmission). ${esc(window.MA_PRO_SWAP_NOTE)}</small></div>` : ""}
      <div class="two">${txt("gain", "Gain / effet", 3, 1000, "Ce que ça change concrètement. Reste prudent, n'invente aucun chiffre.")}<div class="input-stack"><label for="pa-difficulty">Difficulté</label>${sel("difficulty", LEVELS)}<small class="mpa-hint">Pour un mécanicien amateur.</small></div></div>
      <div class="two"><div class="input-stack"><label for="pa-cost">Coût indicatif</label><input id="pa-cost" data-pa-f="cost" maxlength="200" value="${esc(f.cost)}" placeholder="ex. fourchette en euros"><small class="mpa-hint">Pièces et main-d'œuvre.</small></div><div class="input-stack"><label for="pa-order">Ordre d'affichage</label><input id="pa-order" data-pa-f="order" type="number" min="0" max="999" step="1" value="${esc(f.order || 0)}"><small class="mpa-hint">0 = en premier.</small></div></div>
      ${txt("compat", "Compatibilité", 3, 1000, "Versions ou moteurs concernés, pièces à prévoir en plus.")}${txt("risks", "Risques", 3, 1500, "Fiabilité, confort, garantie, assurance…")}${txt("homolog", "Remarque d'homologation", 3, 1500, "Route, contrôle technique, usage circuit.")}
      <div class="mpa-row mpa-actions"><button type="submit" class="cta-btn fill-btn">${f.id ? "Enregistrer" : "Enregistrer en brouillon"}</button>
        ${f.status === "published" ? `<button type="button" class="cta-btn btn-ghost" data-pa-submit="draft">Enregistrer et dépublier</button>` : `<button type="button" class="cta-btn btn-ghost" data-pa-submit="publish">Enregistrer et publier</button>`}
        <button type="button" class="cta-btn btn-ghost" data-pa="cancel">Annuler</button>${f.id ? `<button type="button" class="cta-btn btn-ghost" style="color:#ef4444" data-pa="delete">Supprimer</button>` : ""}</div>
      <p class="admin-note" id="pa-msg" role="status"></p></form>`;
  }
  let engIdx = null;
  function engines() { if (!engIdx && window.MA && window.MA.buildEngineIndex) { try { engIdx = window.MA.buildEngineIndex(C.cars); } catch (_) { engIdx = new Map(); } } return engIdx || new Map(); }
  function engineOptions() { const out = []; engines().forEach((v) => { if (v && v.label) out.push(`<option value="${esc(v.label)}"></option>`); }); return out.slice(0, 1500).join(""); }
  function engineKeyOf(label) { let key = ""; engines().forEach((v, k) => { if (!key && v && v.label === label) key = k; }); return key; }

  // ------------------------------------------------------------ section À relire
  function reviewHtml() {
    const todo = all.filter((m) => m.status !== "published").sort((a, b) => (a.status === "reviewed" ? 0 : 1) - (b.status === "reviewed" ? 0 : 1) || tsMs(b.updatedAt) - tsMs(a.updatedAt));
    if (!todo.length) return `<div class="empty-note">Rien à relire : toutes les fiches sont publiées. 🎉</div>`;
    const catLabel = (m) => { const c = cats().find((x) => x.id === m.cat); const s = c && (c.subs || []).find((x) => x.id === m.sub); return (c ? c.label : m.cat) + (s ? " › " + s.label : ""); };
    const row = (m) => `<article class="mpa-item"><div class="mpa-row">${pill(m.status)}<small>${esc(nameOfCar(m.carId))} · ${esc(catLabel(m))}</small></div><h4>${esc(m.title)}</h4>
      <small>${m.authorName ? "rédigé par " + esc(m.authorName) : ""}${m.reviewedByName ? " · relu par " + esc(m.reviewedByName) : ""} · complète à ${done(m)}/${FIELDS.length}</small>
      <div class="mpa-row"><button type="button" class="cta-btn btn-ghost compact-btn" data-pa-open="${esc(m.id)}">Ouvrir et modifier</button>${m.status === "draft" ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-pa-set="${esc(m.id)}" data-st="reviewed">Marquer relu</button>` : `<button type="button" class="cta-btn fill-btn compact-btn" data-pa-set="${esc(m.id)}" data-st="published">Publier</button>`}</div></article>`;
    const ready = todo.filter((m) => m.status === "reviewed"), drafts = todo.filter((m) => m.status === "draft");
    return `<p class="admin-note">Idéalement, une fiche est relue par un autre administrateur que son auteur avant d'être publiée.</p>
      ${ready.length ? `<section class="cg-block"><header class="cg-bh"><h3>Prêtes à publier</h3><span class="cg-sub">${ready.length}</span></header><div class="mpa-list">${ready.map(row).join("")}</div></section>` : ""}
      ${drafts.length ? `<section class="cg-block"><header class="cg-bh"><h3>Brouillons à relire</h3><span class="cg-sub">${drafts.length}</span></header><div class="mpa-list">${drafts.map(row).join("")}</div></section>` : ""}`;
  }

  // ------------------------------------------------------------ section Accès offerts
  function grantCard() {
    const g = grants.find((x) => x.uid === pickUid), now = Date.now(), live = g && tsMs(g.until) > now;
    const state = g ? (live ? `Accès offert <b>jusqu'au ${fmt(g.until)}</b>` : `Accès offert <b>terminé le ${fmt(g.until)}</b>`) + ` · offert ${plural(g.count || 1, "fois", "fois")}` : "Aucun accès offert pour l'instant";
    const btn = (k, l) => `<button type="button" class="cta-btn btn-ghost compact-btn" data-pa-give="${k}">${l}</button>`;
    const sub = subs.find((x) => x.uid === pickUid), subLine = sub && tsMs(sub.accessUntil) > now && ["trialing", "active", "past_due"].includes(sub.status) ? `<p class="lap-meta">Ce pilote a aussi un abonnement (${esc(sub.status === "trialing" ? "essai gratuit" : "actif")}) jusqu'au ${fmt(sub.accessUntil)}.</p>` : "";
    return `<div class="mpa-grant"><h4>${esc(pickName || nameOf(pickUid))}</h4><p>${state}</p>${subLine}
      <div class="input-stack"><label for="pa-gnote">Note (facultatif, visible par les admins)</label><input id="pa-gnote" maxlength="200" value="${esc(g ? g.note || "" : "")}" placeholder="ex. testeur, partenaire, concours…"></div>
      <p class="mpa-h">${live ? "Prolonger l'accès" : "Offrir l'accès"}</p>
      <div class="mpa-row">${btn("1", "＋ 1 mois")}${btn("3", "＋ 3 mois")}${btn("6", "＋ 6 mois")}${btn("12", "＋ 1 an")}${btn("forever", "Sans limite")}</div>
      <div class="mpa-row"><label class="mpa-date" for="pa-gdate">Ou fixer la fin au</label><input id="pa-gdate" type="date" min="${new Date().toISOString().slice(0, 10)}">${btn("date", "Fixer la date")}</div>
      ${g ? `<div class="mpa-row">${btn("remove", "Retirer l'accès")}</div>` : ""}</div>`;
  }
  function accessHtml() {
    if (!accessLoaded) return `<div class="empty-note">Chargement…</div>`;
    const now = Date.now(), live = grants.filter((g) => tsMs(g.until) > now).sort((a, b) => tsMs(a.until) - tsMs(b.until)), old = grants.filter((g) => tsMs(g.until) <= now);
    const gRow = (g, on) => `<li class="mpa-urow"><div><b>${esc(nameOf(g.uid))}</b><small>${on ? "jusqu'au " + fmt(g.until) : "terminé le " + fmt(g.until)}${g.note ? " · " + esc(g.note) : ""}${g.count > 1 ? " · offert " + g.count + " fois" : ""}</small></div><div class="mpa-row"><button type="button" class="cta-btn btn-ghost compact-btn" data-pa-user="${esc(g.uid)}">Gérer</button><button type="button" class="cta-btn btn-ghost compact-btn" data-pa-giveto="${esc(g.uid)}">＋ 1 mois</button></div></li>`;
    const label = { trialing: "Essai gratuit", active: "Abonné", past_due: "Paiement en retard", canceled: "Résilié", expired: "Expiré" };
    return `${accessErr ? `<p class="mp-warn" role="alert"><span aria-hidden="true">⚠</span> <span>Lecture impossible : publie le fichier firestore.rules complet (il contient maintenant les accès offerts).</span></p>` : ""}
      <section class="cg-block"><header class="cg-bh"><h3>Offrir l'accès PRO à un pilote</h3></header>
        <p class="admin-note">Cherche un pilote, puis choisis une durée. Tu peux offrir, prolonger ou retirer l'accès autant de fois que tu veux, sans aucun paiement.</p>
        <div class="input-stack"><label for="pa-uq">Pilote</label><input id="pa-uq" type="search" autocomplete="off" placeholder="Pseudo du pilote…" value="${esc(pickName)}"><div id="pa-ures" class="mp-res" role="listbox"></div></div>
        ${pickUid ? grantCard() : `<div class="empty-note">Choisis un pilote dans la recherche ou dans la liste ci-dessous.</div>`}</section>
      <section class="cg-block"><header class="cg-bh"><h3>Accès offerts en cours</h3><span class="cg-sub">${live.length}</span></header>${live.length ? `<ul class="mpa-ulist">${live.map((g) => gRow(g, true)).join("")}</ul>` : `<div class="empty-note">Aucun accès offert en cours.</div>`}
        ${old.length ? `<details class="adm-sec" data-pa-sec="oldgrants"><summary><span class="adm-t">Accès offerts terminés (${old.length})</span></summary><div class="adm-body"><ul class="mpa-ulist">${old.map((g) => gRow(g, false)).join("")}</ul></div></details>` : ""}</section>
      <section class="cg-block"><header class="cg-bh"><h3>Abonnements payants et essais</h3><span class="cg-sub">${subs.length}</span></header>
        ${subs.length ? `<ul class="mpa-ulist">${subs.slice().sort((a, b) => tsMs(b.updatedAt) - tsMs(a.updatedAt)).map((s) => `<li class="mpa-urow"><div><b>${esc(nameOf(s.uid))}</b><small>${esc(label[s.status] || s.status || "")} · accès jusqu'au ${fmt(s.accessUntil)}${s.cancelAtPeriodEnd ? " · résiliation programmée" : ""}</small></div></li>`).join("")}</ul>` : `<div class="empty-note">Aucun abonné pour l'instant.</div>`}</section>`;
  }
  async function give(uid, until, remove) {
    if (busy) return; busy = true;
    const old = grants.find((x) => x.uid === uid), note = ($("pa-gnote") && $("pa-gnote").value.trim().slice(0, 200)) || (old && old.note) || "";
    try {
      if (remove) { await C.db.collection("pro_grants").doc(uid).delete(); C.toast("Accès retiré.", "ok"); }
      else {
        const hist = ((old && old.history) || []).slice(-29).concat([{ at: Date.now(), by: who(), until, note }]);
        await C.db.collection("pro_grants").doc(uid).set({ until: toTs(until), note, by: C.user.uid, byName: who().slice(0, 60), at: C.FieldValue.serverTimestamp(), count: ((old && old.count) || 0) + 1, history: hist, userName: nameOf(uid).slice(0, 60) });
        C.toast("Accès offert jusqu'au " + fmt(until) + ".", "ok");
      }
      await loadAccess(true);
    } catch (e) { C.toast(e && e.code === "permission-denied" ? "Refusé : publie le fichier firestore.rules complet." : "Action impossible.", "err"); }
    busy = false; render();
  }
  function giveFromButton(k) {
    const g = grants.find((x) => x.uid === pickUid), now = Date.now(), base = g && tsMs(g.until) > now ? tsMs(g.until) : now;
    if (k === "remove") { if (confirm("Retirer l'accès offert à " + (pickName || nameOf(pickUid)) + " ?")) give(pickUid, 0, true); return; }
    if (k === "forever") { if (confirm("Offrir un accès sans limite de date à " + (pickName || nameOf(pickUid)) + " ? (Tu pourras le retirer à tout moment.)")) give(pickUid, FOREVER); return; }
    if (k === "date") { const v = $("pa-gdate") && $("pa-gdate").value; if (!v) { C.toast("Choisis d'abord une date.", "err"); return; } const t = new Date(v + "T23:59:00").getTime(); if (!(t > now)) { C.toast("La date doit être dans le futur.", "err"); return; } give(pickUid, t); return; }
    give(pickUid, addMonths(base, Number(k)));
  }
  function suggestUsers(q) {
    const res = $("pa-ures"); if (!res) return;
    const n = C.normalize(q).trim(); if (n.length < 2) { res.innerHTML = ""; return; }
    const out = (users || []).filter((u) => u.name && C.normalize(u.name).includes(n)).slice(0, 12);
    res.innerHTML = out.map((u) => `<button type="button" role="option" class="mp-opt" data-pa-user="${esc(u.uid)}">${esc(u.name)}</button>`).join("") || `<div class="lap-meta">Aucun pilote trouvé (la recherche porte sur les 500 premiers profils).</div>`;
  }

  // ------------------------------------------------------------ sections Catégories et Réglages
  function settingsHtml() {
    const s = window.MAPro ? window.MAPro.cfg() : {};
    return `<section class="cg-block"><header class="cg-bh"><h3>Réglages de l'offre PRO</h3></header><div class="mpa">
      <label class="mpa-toggle"><input type="checkbox" data-pa-cfg="signups" ${s.signups ? "checked" : ""}> Inscriptions ouvertes (les pilotes peuvent démarrer l'essai)</label>
      <label class="mpa-toggle"><input type="checkbox" data-pa-cfg="live" ${s.live ? "checked" : ""}> Paiement réel activé <small>(laisse décoché tant que les points légaux ne sont pas réglés)</small></label>
      <div class="two mpa-row"><div class="input-stack"><label for="pa-price">Prix mensuel (€)</label><input id="pa-price" type="number" min="1" max="99" step="0.5" value="${esc(s.priceEur || 5)}" data-pa-cfg="priceEur"></div>
      <div class="input-stack"><label for="pa-trial">Essai gratuit (jours)</label><input id="pa-trial" type="number" min="0" max="365" step="1" value="${esc(s.trialDays == null ? 90 : s.trialDays)}" data-pa-cfg="trialDays"></div></div>
      <p class="admin-note">Les administrateurs ont toujours accès à PRO, gratuitement. Pour offrir l'accès à un pilote précis, utilise l'onglet « Accès offerts ».</p></div></section>`;
  }
  function catsEditorHtml() {
    const list = catsDraft || cats();
    const row = (kind, ci, si, o, n) => `<div class="mpa-edit-row"><input data-pa-name="${kind}" data-ci="${ci}" ${si != null ? `data-si="${si}"` : ""} maxlength="60" value="${esc(o.label)}" aria-label="Nom"><span class="mpa-mini"><button type="button" data-pa-mv="${kind}" data-ci="${ci}" ${si != null ? `data-si="${si}"` : ""} data-d="-1" aria-label="Monter" ${(kind === "cat" ? ci : si) === 0 ? "disabled" : ""}>↑</button><button type="button" data-pa-mv="${kind}" data-ci="${ci}" ${si != null ? `data-si="${si}"` : ""} data-d="1" aria-label="Descendre" ${(kind === "cat" ? ci : si) === n - 1 ? "disabled" : ""}>↓</button><button type="button" class="del" data-pa-del="${kind}" data-ci="${ci}" ${si != null ? `data-si="${si}"` : ""} aria-label="Supprimer">✕</button></span></div>`;
    return `<section class="cg-block"><header class="cg-bh"><h3>Catégories et sous-catégories</h3></header><div class="mpa">
      <p class="admin-note">Ajoute, renomme, supprime ou réordonne librement. Les modifications déjà saisies restent rattachées à leur catégorie (même renommée). Pense à enregistrer.</p>
      ${list.map((c, ci) => `<div class="mpa-edit"><div class="mpa-edit-row"><input data-pa-icon data-ci="${ci}" maxlength="4" value="${esc(c.icon || "")}" aria-label="Icône" style="max-width:64px;text-align:center"><span></span></div>${row("cat", ci, null, c, list.length)}
        <div class="mpa-subs">${(c.subs || []).map((s, si) => row("sub", ci, si, s, c.subs.length)).join("")}<button type="button" class="cta-btn btn-ghost compact-btn" data-pa-add="sub" data-ci="${ci}">＋ Sous-catégorie</button></div></div>`).join("")}
      <div class="mpa-row"><button type="button" class="cta-btn btn-ghost" data-pa-add="cat">＋ Catégorie</button><button type="button" class="cta-btn fill-btn" data-pa="save-cats">Enregistrer les catégories</button><button type="button" class="cta-btn btn-ghost" data-pa="reset-cats">Revenir à la liste de départ</button></div></div></section>`;
  }

  function render() {
    const root = $("admin-pro"); if (!root || !C.isAdmin) return;
    root.setAttribute("data-no-i18n", "");   // l'espace admin reste en français : ni les rubriques ni les fiches saisies ne sont traduites
    const open = Array.from(root.querySelectorAll("details[data-pa-sec][open]")).map((d) => d.dataset.paSec);
    const pane = view === "review" ? reviewHtml() : view === "access" ? accessHtml() : view === "cats" ? catsEditorHtml() : view === "cfg" ? settingsHtml() : fichesHtml();
    root.innerHTML = `<div class="mpa">${tabsHtml()}<div class="mpa-pane" role="tabpanel">${pane}</div></div>`;
    open.forEach((k) => { const d = root.querySelector(`details[data-pa-sec="${k}"]`); if (d) d.open = true; });
    counts();
  }
  function counts() { document.querySelectorAll("#pa-form [data-count]").forEach((s) => { const el = $("pa-" + s.dataset.count); if (el) s.textContent = el.value.length + " / " + s.dataset.max; }); }
  function go(v) { view = v; form = null; if (v === "access") { render(); loadAccess().then(render); return; } render(); }

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
  function readForm() { const f = form || {}; document.querySelectorAll("#pa-form [data-pa-f]").forEach((el) => { f[el.dataset.paF] = el.value; }); return f; }
  function openNew(sub) {
    form = blank(sub);
    const sv = LS.get();
    if (sv && sv.carId === carId && sv.f && !sv.f.id && sv.f.cat === catId && (sv.f.title || sv.f.description)) { form = Object.assign(form, sv.f, { sub: sub || sv.f.sub || "" }); form._restored = true; }
    render(); const f = $("pa-form"); if (f && f.scrollIntoView) f.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  async function saveMod(mode) {
    if (!form || !$("pa-form")) return;   // formulaire déjà fermé (double validation)
    const f = readForm(), msg = $("pa-msg");
    const title = String(f.title || "").trim();
    if (!title) { msg.textContent = "Le titre est obligatoire."; $("pa-title").focus(); return; }
    if (!carId || !f.cat) return;
    const status = mode === "publish" ? "published" : mode === "draft" ? "draft" : (f.id ? f.status : "draft") || "draft";
    if (status === "published") {
      if (!String(f.description || "").trim()) { msg.textContent = "Une description est nécessaire pour publier."; $("pa-description").focus(); return; }
      const miss = ["gain", "difficulty", "cost", "risks", "homolog"].filter((k) => !String(f[k] || "").trim()).map((k) => LABEL[k]);
      if (miss.length && !confirm("Il manque : " + miss.join(", ") + ". Publier quand même ?")) return;
    }
    const num = Math.max(0, Math.min(999, Math.round(Number(f.order) || 0)));
    const prevM = f.id ? all.find((m) => m.id === f.id) : null;
    const d = { carId, cat: f.cat, sub: f.sub || "", title: title.slice(0, 120), description: String(f.description || "").slice(0, 4000), gain: String(f.gain || "").slice(0, 1000), difficulty: f.difficulty || "", cost: String(f.cost || "").slice(0, 200), compat: String(f.compat || "").slice(0, 1000), risks: String(f.risks || "").slice(0, 1500), homolog: String(f.homolog || "").slice(0, 1500), engineKey: f.sub === "swap-moteur" ? engineKeyOf(String(f.engineLabel || "")) : "", status, order: num, author: (prevM && prevM.author) || C.user.uid, authorName: (prevM && prevM.authorName) || who(), updatedAt: C.FieldValue.serverTimestamp() };
    if (f.sub === "swap-moteur" && f.engineLabel && !d.engineKey) { msg.textContent = "Ce moteur n'existe pas dans les fiches moteurs : choisis-le dans la liste proposée."; return; }
    if (d.status !== "draft") { d.reviewedBy = (prevM && prevM.reviewedBy) || C.user.uid; d.reviewedByName = (prevM && prevM.reviewedByName) || who(); } else { d.reviewedBy = ""; d.reviewedByName = ""; }
    if (d.status !== "draft" && d.author === C.user.uid && !(prevM && prevM.reviewedBy && prevM.reviewedBy !== prevM.author) && !confirm("Tu es l'auteur de cette fiche : idéalement, un autre administrateur la relit avant publication. Continuer quand même ?")) return;
    busy = true;
    try {
      let ref;
      if (f.id) { ref = C.db.collection("pro_mods").doc(f.id); await ref.set(d, { merge: true }); }
      else { d.createdAt = C.FieldValue.serverTimestamp(); ref = C.db.collection("pro_mods").doc(); await ref.set(d); }
      window.MAPro.modsCache.delete(carId); form = null; LS.del(); await refresh(ref.id);
      C.toast(status === "published" ? "Fiche publiée." : status === "reviewed" ? "Fiche enregistrée (relue)." : "Brouillon enregistré.", "ok");
    } catch (e) { msg.textContent = "Enregistrement refusé : " + (e && e.code === "permission-denied" ? "règles Firestore à publier (fichier complet)." : (e && e.message) || "erreur"); busy = false; return; }
    busy = false; render();
  }
  async function setStatus(id, st) {
    const m = all.find((x) => x.id === id); if (!m) return;
    if (st === "published" && !String(m.description || "").trim()) { C.toast("Ajoute d'abord une description avant de publier.", "err"); return; }
    if (st !== "draft" && m.author === C.user.uid && !(m.reviewedBy && m.reviewedBy !== m.author) && !confirm("Tu es l'auteur de cette fiche : idéalement, un autre administrateur la relit. Continuer quand même ?")) return;
    const patch = { status: st, updatedAt: C.FieldValue.serverTimestamp() };
    if (st === "draft") { patch.reviewedBy = ""; patch.reviewedByName = ""; } else if (!m.reviewedBy) { patch.reviewedBy = C.user.uid; patch.reviewedByName = who(); }
    try { await C.db.collection("pro_mods").doc(id).update(patch); window.MAPro.modsCache.delete(m.carId); await refresh(id); C.toast(st === "published" ? "Fiche publiée." : st === "reviewed" ? "Fiche marquée relue." : "Repassée en brouillon.", "ok"); } catch (e) { C.toast("Action refusée (règles Firestore ?).", "err"); }
    render();
  }
  async function delMod() {
    if (!form || !form.id || !confirm("Supprimer définitivement cette modification ?")) return;
    try { await C.db.collection("pro_mods").doc(form.id).delete(); window.MAPro.modsCache.delete(carId); all = all.filter((m) => m.id !== form.id); form = null; LS.del(); C.toast("Supprimée.", "ok"); } catch (e) { C.toast("Suppression refusée.", "err"); }
    render();
  }
  async function copyMod(id, toCar) {
    const m = all.find((x) => x.id === id); if (!m || !toCar || busy) return;
    busy = true;
    const same = toCar === m.carId;
    const d = { carId: toCar, cat: m.cat, sub: m.sub || "", title: (same ? m.title + " (copie)" : m.title).slice(0, 120), description: m.description || "", gain: m.gain || "", difficulty: m.difficulty || "", cost: m.cost || "", compat: m.compat || "", risks: m.risks || "", homolog: m.homolog || "", engineKey: m.engineKey || "", status: "draft", order: Number(m.order) || 0, author: C.user.uid, authorName: who(), reviewedBy: "", reviewedByName: "", createdAt: C.FieldValue.serverTimestamp(), updatedAt: C.FieldValue.serverTimestamp() };
    try { const ref = C.db.collection("pro_mods").doc(); await ref.set(d); await refresh(ref.id); window.MAPro.modsCache.delete(toCar); copyFor = ""; C.toast(same ? "Copie créée en brouillon." : "Copiée vers " + nameOfCar(toCar) + " (brouillon).", "ok"); }
    catch (e) { C.toast("Copie refusée (règles Firestore ?).", "err"); }
    busy = false; render();
  }
  function suggest(q, resId, attr) {
    const res = $(resId); if (!res) return;
    const n = C.normalize(q).trim(); if (n.length < 2) { res.innerHTML = ""; return; }
    const w = n.split(/\s+/), out = [];
    for (const c of C.cars) { if (w.every((x) => C.normalize(carName(c)).includes(x))) { out.push(c); if (out.length >= 12) break; } }
    res.innerHTML = out.map((c) => `<button type="button" role="option" class="mp-opt" ${attr}="${esc(c.id)}">${esc(carName(c))}${c.years ? `<small>${esc(String(c.years))}</small>` : ""}</button>`).join("") || `<div class="lap-meta">Aucune voiture trouvée.</div>`;
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
    if ((b = q("[data-pa-view]"))) { go(b.dataset.paView); return; }
    if ((b = q("[data-pa-car]"))) { carId = b.dataset.paCar; catId = ""; form = null; copyFor = ""; filter = "all"; render(); return; }
    if ((b = q("[data-pa-cat]"))) { catId = b.dataset.paCat; form = null; copyFor = ""; render(); const el = $("pa-car"); if (el && window.innerWidth < 900) { const x = el.querySelector(".cg-block, .mpa-form"); if (x && x.scrollIntoView) x.scrollIntoView({ block: "nearest", behavior: "smooth" }); } return; }
    if ((b = q("[data-pa-filter]"))) { filter = b.dataset.paFilter; render(); return; }
    if ((b = q("[data-pa-edit]"))) { const m = all.find((x) => x.id === b.dataset.paEdit); if (m) { form = Object.assign(blank(), m); const v = engines().get(m.engineKey); form.engineLabel = v ? v.label : ""; render(); const f = $("pa-form"); if (f && f.scrollIntoView) f.scrollIntoView({ block: "start", behavior: "smooth" }); } return; }
    if ((b = q("[data-pa-open]"))) { const m = all.find((x) => x.id === b.dataset.paOpen); if (m) { view = "fiches"; carId = m.carId; catId = m.cat; form = Object.assign(blank(), m); const v = engines().get(m.engineKey); form.engineLabel = v ? v.label : ""; render(); const f = $("pa-form"); if (f && f.scrollIntoView) f.scrollIntoView({ block: "start", behavior: "smooth" }); } return; }
    if ((b = q("[data-pa-set]"))) { setStatus(b.dataset.paSet, b.dataset.st); return; }
    if ((b = q("[data-pa-prev]"))) { const id = b.dataset.paPrev; if (prev.has(id)) prev.delete(id); else prev.add(id); render(); return; }
    if ((b = q("[data-pa-dup]"))) { copyMod(b.dataset.paDup, carId); return; }
    if ((b = q("[data-pa-copy]"))) { copyFor = copyFor === b.dataset.paCopy ? "" : b.dataset.paCopy; render(); const i = $("pa-copyq"); if (i) i.focus(); return; }
    if ((b = q("[data-pa-copyto]"))) { copyMod(copyFor, b.dataset.paCopyto); return; }
    if ((b = q("[data-pa-submit]"))) { saveMod(b.dataset.paSubmit); return; }
    if ((b = q("[data-pa-user]"))) { pickUid = b.dataset.paUser; pickName = nameOf(pickUid); render(); const c = document.querySelector("#admin-pro .mpa-grant"); if (c && c.scrollIntoView) c.scrollIntoView({ block: "nearest", behavior: "smooth" }); return; }
    if ((b = q("[data-pa-give]"))) { if (pickUid) giveFromButton(b.dataset.paGive); return; }
    if ((b = q("[data-pa-giveto]"))) { const uid = b.dataset.paGiveto, g = grants.find((x) => x.uid === uid), now = Date.now(); pickUid = uid; pickName = nameOf(uid); give(uid, addMonths(g && tsMs(g.until) > now ? tsMs(g.until) : now, 1)); return; }
    if ((b = q("[data-pa]"))) {
      const k = b.dataset.pa;
      if (k === "new") openNew(b.dataset.sub || "");
      else if (k === "cancel") { form = null; LS.del(); render(); }
      else if (k === "delete") delMod();
      else if (k === "save-cats") saveCats();
      else if (k === "reset-cats") { if (confirm("Revenir à la liste de départ ? (Les modifications déjà saisies ne sont pas supprimées.)")) { catsDraft = JSON.parse(JSON.stringify(window.MA_PRO_DEFAULT_CATS)); render(); } }
      return;
    }
    if ((b = q("[data-pa-add]"))) { const l = draft(); if (b.dataset.paAdd === "cat") l.push({ id: "", label: "Nouvelle catégorie", icon: "🔧", subs: [] }); else l[+b.dataset.ci].subs.push({ id: "", label: "Nouvelle sous-catégorie" }); render(); return; }
    if ((b = q("[data-pa-mv]"))) { const l = draft(), ci = +b.dataset.ci, d = +b.dataset.d; if (b.dataset.paMv === "cat") move(l, ci, d); else move(l[ci].subs, +b.dataset.si, d); render(); return; }
    if ((b = q("[data-pa-del]"))) { const l = draft(), ci = +b.dataset.ci; if (b.dataset.paDel === "cat") { if (!confirm("Supprimer cette catégorie et ses sous-catégories de la liste ? (Les modifications déjà saisies ne sont pas effacées mais ne seront plus rangées.)")) return; l.splice(ci, 1); } else l[ci].subs.splice(+b.dataset.si, 1); render(); }
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === "pa-q") { suggest(t.value, "pa-res", "data-pa-car"); return; }
    if (t.id === "pa-copyq") { suggest(t.value, "pa-copyres", "data-pa-copyto"); return; }
    if (t.id === "pa-uq") { suggestUsers(t.value); return; }
    if (t.dataset.paName) { const l = draft(), ci = +t.dataset.ci; (t.dataset.paName === "cat" ? l[ci] : l[ci].subs[+t.dataset.si]).label = t.value; return; }
    if (t.dataset.paIcon !== undefined) { draft()[+t.dataset.ci].icon = t.value; return; }
    if (t.dataset.paF && form) { const f = readForm(); counts(); if (!f.id) LS.set({ carId, f: Object.assign({}, f, { _restored: false }) }); }
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.paCfg) { saveCfg(t.dataset.paCfg, t.type === "checkbox" ? t.checked : Number(t.value)); return; }
    if (t.id === "pa-sub" && form) { readForm(); render(); }
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.Router.register("admin", { enter: async (p) => { if (p.tab !== "pro" || !C.isAdmin) return; if (window.MAPro) await window.MAPro.reload(); await loadAll(); render(); if (view === "access") loadAccess(true).then(render); } });
    const root = () => $("admin-pro");
    document.addEventListener("click", (e) => { if (root() && root().contains(e.target)) onClick(e); });
    document.addEventListener("input", (e) => { if (root() && root().contains(e.target)) onInput(e); });
    document.addEventListener("change", (e) => { if (root() && root().contains(e.target)) onChange(e); });
    document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("mpa-pin")) { e.preventDefault(); onClick({ target: e.target }); } });
    document.addEventListener("submit", (e) => { if (e.target.id === "pa-form") { e.preventDefault(); if (!busy) saveMod("keep"); } });
  });
})();
