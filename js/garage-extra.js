/**
 * MOTORAUTO — extensions du garage : jauge de ma voiture (partageable en image), garage virtuel (rangée de cartes + total de chevaux),
 * budget & consommation (total par voiture et par an), journal de projet avant / après.
 *   users/{uid}/costs/{auto}   { carName, kind, label, amount, dateMs, liters, km, createdAt }
 *   users/{uid}/journal/{auto} { carName, stage: before|during|after, title, note, photo, dateMs, createdAt }
 * Les photos du journal sont stockées dans car_photos/{uid}/ (règles Storage inchangées).
 */
(function () {
  "use strict";
  let C = null, costs = [], journal = [], loadedFor = { costs: null, journal: null };
  const nf = (n, d) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const fmt = (ms) => (ms ? new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");
  const inputDate = (ms) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const sub = (n) => C.db.collection("users").doc(C.user.uid).collection(n);
  const KINDS = { fuel: "Carburant", insurance: "Assurance", repair: "Réparation", parts: "Pièces / modifs", tax: "Taxes / contrôle", other: "Autre" };
  const STAGES = { before: "Avant", during: "En cours", after: "Après" };

  // ------------------------------------------------------------------ jauge
  function gaugeSvg(power, zero) {
    const maxP = 700, a0 = 135, a1 = 405, f = Math.min(1, (power || 0) / maxP), ang = a0 + (a1 - a0) * f;
    const pt = (a, r) => { const t = (a * Math.PI) / 180; return [150 + Math.cos(t) * r, 150 + Math.sin(t) * r]; };
    const arc = (from, to, r) => { const [x0, y0] = pt(from, r), [x1, y1] = pt(to, r); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
    const [nx, ny] = pt(ang, 100), ticks = Array.from({ length: 8 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / 7, [x0, y0] = pt(a, 112), [x1, y1] = pt(a, 124); return `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="currentColor" opacity=".35" stroke-width="2"/>`; }).join("");
    return `<svg viewBox="0 0 300 260" class="my-gauge-svg" role="img" aria-label="Puissance ${power} chevaux${zero ? ", 0 à 100 en " + zero + " secondes" : ""}"><path d="${arc(a0, a1, 118)}" fill="none" stroke="var(--bg-elevated)" stroke-width="16" stroke-linecap="round"/>
      <path d="${arc(a0, Math.max(a0 + 1, ang), 118)}" fill="none" stroke="var(--accent)" stroke-width="16" stroke-linecap="round"/>${ticks}
      <line x1="150" y1="150" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="150" cy="150" r="9" fill="var(--accent)"/>
      <text x="150" y="196" text-anchor="middle" class="mg-val">${power || "—"}</text><text x="150" y="218" text-anchor="middle" class="mg-unit">chevaux</text>${zero ? `<text x="150" y="246" text-anchor="middle" class="mg-zero">0-100 en ${String(zero).replace(".", ",")} s</text>` : ""}</svg>`;
  }
  function gaugeBlock(cars, owner, mine) {
    const list = cars.filter((c) => c.power > 0);
    if (!list.length) return mine ? `<div class="empty-note">Ajoute une voiture avec sa puissance (et son 0-100) pour afficher ta jauge.</div>` : "";
    const best = list.slice().sort((a, b) => b.power - a.power)[0];
    return `<div class="panel-section-title">${mine ? "La jauge de ma voiture" : "Sa jauge"}</div><div class="my-gauge"><div class="my-gauge-box">${gaugeSvg(best.power, best.zero)}</div>
      <div class="my-gauge-side"><b>${C.esc(best.name)}</b><small>${[best.year, best.engine].filter(Boolean).map(C.esc).join(" · ")}</small>${window.MAShare ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-gauge-share="${C.esc(best.id)}">↗ Partager en image</button>` : ""}</div></div>`;
  }
  let gaugeCars = [];

  // ------------------------------------------------------------------ garage virtuel
  function virtualGarage(ids, title) {
    const cars = ids.map((id) => C.carsById.get(id)).filter(Boolean);
    if (!cars.length) return "";
    const hp = cars.reduce((s, c) => s + (c.stats.power || 0), 0);
    return `<div class="panel-section-title">${C.esc(title)} <span class="lap-meta">${cars.length} voiture${cars.length > 1 ? "s" : ""} · ${nf(hp)} ch au total</span></div>
      <div class="vgarage" role="list">${cars.map((c) => `<a href="#/voiture/${encodeURIComponent(c.id)}" role="listitem" class="vg-slot">${window.MACards ? window.MACards.cardHtml(c, { cls: "tcg-mini" }) : C.esc(c.model)}</a>`).join("")}</div><div class="vg-floor" aria-hidden="true"></div>`;
  }

  // ------------------------------------------------------------------ budget
  async function loadCosts(force) {
    if (!C.user) { costs = []; return; }
    if (loadedFor.costs === C.user.uid && !force) return;
    const s = await sub("costs").limit(500).get();
    costs = s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => (b.dateMs || 0) - (a.dateMs || 0));
    loadedFor.costs = C.user.uid;
  }
  function consumption(list) {
    // plein à plein : on trie par km croissant, la conso entre deux pleins = litres du plein / km parcourus depuis le précédent
    const rows = list.filter((c) => c.kind === "fuel" && c.liters > 0 && c.km > 0).sort((a, b) => a.km - b.km), out = [];
    for (let i = 1; i < rows.length; i++) { const d = rows[i].km - rows[i - 1].km; if (d > 20 && d < 2000) out.push({ date: rows[i].dateMs, l100: (rows[i].liters / d) * 100 }); }
    return out;
  }
  function renderCosts() {
    const root = document.getElementById("costs-root"); if (!root) return;
    if (!C.user) { root.innerHTML = `<div class="empty-note">Connecte-toi pour suivre le budget de tes voitures.</div>`; return; }
    const cars = (C.app.getMyCars() || []).map((c) => c.name).filter(Boolean), esc = C.esc;
    const names = Array.from(new Set(costs.map((c) => c.carName).concat(cars)));
    const years = Array.from(new Set(costs.map((c) => new Date(c.dateMs).getFullYear()))).sort((a, b) => b - a);
    const byCar = names.map((n) => { const l = costs.filter((c) => c.carName === n), t = l.reduce((s, c) => s + c.amount, 0), cs = consumption(l); const km = l.filter((c) => c.km).map((c) => c.km);
      return { n, t, cs, perKm: km.length > 1 && Math.max(...km) > Math.min(...km) ? t / (Math.max(...km) - Math.min(...km)) : 0, avg: cs.length ? cs.reduce((s, x) => s + x.l100, 0) / cs.length : 0, byYear: years.map((y) => [y, l.filter((c) => new Date(c.dateMs).getFullYear() === y).reduce((s, c) => s + c.amount, 0)]) }; }).filter((x) => x.t > 0);
    const maxY = Math.max(1, ...byCar.flatMap((x) => x.byYear.map((y) => y[1])));
    root.innerHTML = `<form class="maint-form" id="cost-form" novalidate><datalist id="cost-cars">${cars.map((n) => `<option value="${esc(n)}">`).join("")}</datalist>
      <div class="input-stack"><label for="ct-car">Voiture</label><input type="text" id="ct-car" list="cost-cars" maxlength="80" required value="${esc(cars[0] || "")}"></div>
      <div class="input-stack"><label for="ct-kind">Catégorie</label><select id="ct-kind" class="custom-select">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
      <div class="input-stack"><label for="ct-amount">Montant (€)</label><input type="number" id="ct-amount" min="0" max="1000000" step="0.01" inputmode="decimal" required></div>
      <div class="input-stack"><label for="ct-date">Date</label><input type="date" id="ct-date" value="${inputDate(Date.now())}" required></div>
      <div class="input-stack"><label for="ct-liters">Litres <small>(plein)</small></label><input type="number" id="ct-liters" min="0" max="300" step="0.01" inputmode="decimal"></div>
      <div class="input-stack"><label for="ct-km">Kilométrage <small>(compteur)</small></label><input type="number" id="ct-km" min="0" max="2000000" inputmode="numeric"></div>
      <div class="input-stack wide"><label for="ct-label">Détail (facultatif)</label><input type="text" id="ct-label" maxlength="100" placeholder="Ex. Plein SP98, plaquettes avant…"></div>
      <div class="wide"><div class="form-feedback error-txt" id="ct-error" role="alert"></div><button type="submit" class="cta-btn fill-btn">Ajouter la dépense</button></div></form>
      ${byCar.length ? `<div class="cost-cards">${byCar.map((x) => `<div class="cost-card"><h3>${esc(x.n)}</h3><div class="cost-total">${nf(x.t)} €<small>au total</small></div>
        <div class="cost-years">${x.byYear.filter((y) => y[1] > 0).map(([y, v]) => `<div class="cy"><span>${y}</span><i style="--w:${Math.round((v / maxY) * 100)}%"></i><b>${nf(v)} €</b></div>`).join("")}</div>
        <small class="lap-meta">${x.avg ? `Conso moyenne : <b>${nf(x.avg, 1)} L/100</b> (${x.cs.length} pleins mesurés)` : "Ajoute des pleins avec litres + kilométrage pour calculer la consommation."}${x.perKm ? ` · ${nf(x.perKm, 2)} €/km` : ""}</small></div>`).join("")}</div>` : ""}
      <div class="maint-list">${costs.length ? costs.map((c) => `<div class="maint-row"><div class="m-main"><b>${nf(c.amount, 2)} €</b> · ${esc(KINDS[c.kind] || "")} · ${esc(c.carName)}<small>${fmt(c.dateMs)}${c.liters ? " · " + nf(c.liters, 1) + " L" : ""}${c.km ? " · " + nf(c.km) + " km" : ""}${c.label ? " · " + esc(c.label) : ""}</small></div><button type="button" class="secondary-destructive-btn" data-cost-del="${esc(c.id)}">Supprimer</button></div>`).join("") : `<div class="empty-note">Aucune dépense notée. Ajoute ton dernier plein ou ta dernière facture.</div>`}</div>`;
    document.getElementById("cost-form").addEventListener("submit", addCost);
  }
  async function addCost(e) {
    e.preventDefault();
    const err = document.getElementById("ct-error"); err.textContent = "";
    const num = (id) => { const n = parseFloat(String(document.getElementById(id).value).replace(",", ".")); return Number.isFinite(n) && n >= 0 ? n : 0; };
    const carName = document.getElementById("ct-car").value.trim().slice(0, 80), amount = Math.round(num("ct-amount") * 100) / 100, dateMs = new Date(document.getElementById("ct-date").value).getTime();
    if (!carName) { err.textContent = "Indique la voiture."; return; }
    if (!(amount > 0)) { err.textContent = "Indique le montant."; return; }
    if (!Number.isFinite(dateMs)) { err.textContent = "Indique la date."; return; }
    try {
      await sub("costs").add({ carName, kind: document.getElementById("ct-kind").value, label: document.getElementById("ct-label").value.trim().slice(0, 100), amount, dateMs, liters: Math.round(num("ct-liters") * 100) / 100, km: Math.round(num("ct-km")), createdAt: C.FieldValue.serverTimestamp() });
      await loadCosts(true); renderCosts(); C.toast("Dépense ajoutée.", "ok");
    } catch (ex) { err.textContent = "Enregistrement impossible : " + ex.message; }
  }

  // ------------------------------------------------------------------ journal avant / après
  async function loadJournal(force) {
    if (!C.user) { journal = []; return; }
    if (loadedFor.journal === C.user.uid && !force) return;
    const s = await sub("journal").limit(300).get();
    journal = s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => (a.dateMs || 0) - (b.dateMs || 0));
    loadedFor.journal = C.user.uid;
  }
  function renderJournal() {
    const root = document.getElementById("journal-root"); if (!root) return;
    if (!C.user) { root.innerHTML = `<div class="empty-note">Connecte-toi pour tenir le journal photo de ton projet.</div>`; return; }
    const esc = C.esc, cars = (C.app.getMyCars() || []).map((c) => c.name).filter(Boolean), names = Array.from(new Set(journal.map((j) => j.carName).concat(cars)));
    const groups = Array.from(new Set(journal.map((j) => j.carName))).map((n) => {
      const l = journal.filter((j) => j.carName === n), b = l.filter((j) => j.stage === "before").slice(-1)[0], a = l.filter((j) => j.stage === "after").slice(-1)[0];
      return `<section class="jr-group"><h3>${esc(n)}</h3>${b && a ? `<div class="ba" data-ba><img src="${esc(C.safeUrl(a.photo) || "")}" alt="Après" draggable="false"><div class="ba-top"><img src="${esc(C.safeUrl(b.photo) || "")}" alt="Avant" draggable="false"></div><input type="range" min="0" max="100" value="50" aria-label="Comparer avant et après" data-ba-range><span class="ba-tag l">Avant</span><span class="ba-tag r">Après</span></div>` : ""}
        <div class="jr-line">${l.map((j) => `<figure class="jr-item"><img src="${esc(C.safeUrl(j.photo) || "")}" alt="" loading="lazy" data-fallback="car"><figcaption><span class="jr-stage ${j.stage}">${STAGES[j.stage] || ""}</span><b>${esc(j.title || "")}</b><small>${fmt(j.dateMs)}${j.note ? " · " + esc(j.note) : ""}</small><button type="button" class="cmt-del" data-jr-del="${esc(j.id)}" aria-label="Supprimer">🗑</button></figcaption></figure>`).join("")}</div></section>`;
    }).join("");
    root.innerHTML = `<form class="maint-form" id="jr-form" novalidate><datalist id="jr-cars">${names.map((n) => `<option value="${esc(n)}">`).join("")}</datalist>
      <div class="input-stack"><label for="jr-car">Voiture / projet</label><input type="text" id="jr-car" list="jr-cars" maxlength="80" required value="${esc(names[0] || "")}"></div>
      <div class="input-stack"><label for="jr-stage">Étape</label><select id="jr-stage" class="custom-select">${Object.entries(STAGES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
      <div class="input-stack"><label for="jr-title">Titre</label><input type="text" id="jr-title" maxlength="80" placeholder="Ex. Peinture, moteur sorti…"></div>
      <div class="input-stack"><label for="jr-date">Date</label><input type="date" id="jr-date" value="${inputDate(Date.now())}"></div>
      <div class="input-stack wide"><label for="jr-note">Note (facultatif)</label><input type="text" id="jr-note" maxlength="160"></div>
      <div class="input-stack wide"><label for="jr-photo">Photo</label><input type="file" id="jr-photo" accept="image/*" required></div>
      <div class="wide"><div class="form-feedback error-txt" id="jr-error" role="alert"></div><button type="submit" class="cta-btn fill-btn" id="jr-submit">Ajouter au journal</button></div></form>
      ${groups || `<div class="empty-note">Ton journal est vide. Poste une photo « Avant », puis une photo « Après » : un curseur de comparaison apparaîtra.</div>`}`;
    document.getElementById("jr-form").addEventListener("submit", addJournal);
  }
  async function addJournal(e) {
    e.preventDefault();
    const err = document.getElementById("jr-error"); err.textContent = "";
    const carName = document.getElementById("jr-car").value.trim().slice(0, 80), file = document.getElementById("jr-photo").files[0];
    if (!carName) { err.textContent = "Indique la voiture ou le projet."; return; }
    if (!file || !/^image\//.test(file.type)) { err.textContent = "Choisis une photo."; return; }
    if (window.MAMute && window.MAMute.active()) { /* le journal est privé : permis */ }
    const btn = document.getElementById("jr-submit"); btn.disabled = true; btn.textContent = "Envoi…";
    try {
      const blob = await C.MA.resizeImage(file, 1400, 0.85), ref = C.storage.ref(`car_photos/${C.user.uid}/journal_${Date.now()}.jpg`);
      await ref.put(blob, { contentType: "image/jpeg" });
      const photo = await ref.getDownloadURL(), dateMs = new Date(document.getElementById("jr-date").value).getTime() || Date.now();
      await sub("journal").add({ carName, stage: document.getElementById("jr-stage").value, title: document.getElementById("jr-title").value.trim().slice(0, 80), note: document.getElementById("jr-note").value.trim().slice(0, 160), photo, dateMs, createdAt: C.FieldValue.serverTimestamp() });
      await loadJournal(true); renderJournal(); C.toast("Photo ajoutée au journal.", "ok");
    } catch (ex) { err.textContent = "Envoi impossible : " + (ex.code === "storage/unauthorized" ? "règles Storage (photo refusée)." : ex.message); const b2 = document.getElementById("jr-submit"); if (b2) { b2.disabled = false; b2.textContent = "Ajouter au journal"; } }
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx); C.app = window.MAApp;
    ctx.Router.register("garage", { enter: async (p) => {
      if (p.tab === "apercu") { const el = document.getElementById("garage-virtual"); if (el) el.innerHTML = virtualGarage((C.app.getGarage() || {}).favorites || [], "Mon garage virtuel"); }
      if (p.tab === "voitures") { const el = document.getElementById("my-gauge"); if (el) { gaugeCars = C.app.getMyCars() || []; el.innerHTML = gaugeBlock(gaugeCars, "", true); } }
      if (p.tab === "suivi") {
        renderCosts(); renderJournal();
        await Promise.all([
          loadCosts().then(renderCosts).catch(() => { const r = document.getElementById("costs-root"); if (r) r.innerHTML = `<div class="empty-note error">Budget indisponible (règles Firestore à publier ?).</div>`; }),
          loadJournal().then(renderJournal).catch(() => { const r = document.getElementById("journal-root"); if (r) r.innerHTML = `<div class="empty-note error">Journal indisponible (règles Firestore à publier ?).</div>`; })
        ]);
      }
    } });
    // mes voitures chargées après coup
    document.addEventListener("ma:auth", () => { loadedFor = { costs: null, journal: null }; setTimeout(() => { if (ctx.Router.is("garage", { tab: "voitures" })) { const el = document.getElementById("my-gauge"); if (el) { gaugeCars = C.app.getMyCars() || []; el.innerHTML = gaugeBlock(gaugeCars, "", true); } } }, 900); });
    // profil public
    document.addEventListener("ma:profile-cars", (e) => {
      gaugeCars = e.detail.list; let el = document.getElementById("pub-gauge");
      if (!el) { const a = document.getElementById("pub-profile-cars"); if (!a) return; el = document.createElement("div"); el.id = "pub-gauge"; el.className = "game-zone"; a.insertAdjacentElement("afterend", el); }
      el.innerHTML = gaugeBlock(e.detail.list, "", false);
    });
    document.addEventListener("ma:profile-garage", (e) => {
      let el = document.getElementById("pub-vgarage");
      if (!el) { const a = document.getElementById("pub-profile-favorites"); if (!a) return; el = document.createElement("div"); el.id = "pub-vgarage"; el.className = "game-zone"; a.parentElement.insertBefore(el, a); }
      el.innerHTML = virtualGarage(e.detail.favorites, "Garage virtuel");
    });
    document.addEventListener("click", (e) => {
      const g = e.target.closest("[data-gauge-share]");
      if (g) { const c = gaugeCars.find((x) => x.id === g.dataset.gaugeShare); if (c && window.MAShare) window.MAShare.gaugeImage(c, c.name, c.pilot); return; }
      const cd = e.target.closest("[data-cost-del]");
      if (cd && confirm("Supprimer cette dépense ?")) { sub("costs").doc(cd.dataset.costDel).delete().then(() => { costs = costs.filter((c) => c.id !== cd.dataset.costDel); renderCosts(); }).catch((x) => C.toast("Suppression impossible : " + x.message, "err")); return; }
      const jd = e.target.closest("[data-jr-del]");
      if (jd && confirm("Supprimer cette photo du journal ?")) sub("journal").doc(jd.dataset.jrDel).delete().then(() => { journal = journal.filter((j) => j.id !== jd.dataset.jrDel); renderJournal(); }).catch((x) => C.toast("Suppression impossible : " + x.message, "err"));
    });
    document.addEventListener("input", (e) => { const r = e.target.closest("[data-ba-range]"); if (r) r.closest("[data-ba]").style.setProperty("--ba", r.value + "%"); });
  });
})();
