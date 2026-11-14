/**
 * MOTORAUTO — compléments de la fiche voiture : généalogie du modèle, rivales d'époque, comparaison de deux versions,
 * signalement d'erreur (file de corrections validée par l'admin) ; recherche vocale ; recherches sans résultat ; tableau de bord admin.
 *   car_reports/{carId}__{uid}   { carId, carName, uid, pilot, field, text, status: "open", createdAt }
 *   search_misses/{requête}      { q, n, last }
 */
(function () {
  "use strict";
  let C = null;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const esc = (s) => (C ? C.esc(s) : String(s));

  // ------------------------------------------------------------------ rivales : corrections à la main des modèles les plus connus
  const CLUSTERS = [
    ["peugeot-205-gti", "vw-golf-gti-mk2", "renault-r5-gt-turbo", "peugeot-309-gti"],
    ["renault-clio-williams-16s", "peugeot-306-s16", "honda-civic-eg6-vti", "vw-golf-gti-mk3", "peugeot-106-s16", "saxo-vts"],
    ["renault-clio-2-rs", "honda-civic-ep3-type-r", "vw-golf-gti-mk5", "renault-megane-2-rs", "ford-focus-st-170"],
    ["renault-megane-3-rs", "ford-focus-rs-mk2", "honda-civic-fn2-type-r", "audi-rs3-8p", "vw-golf-gti-mk6"],
    ["renault-clio-4-rs", "ford-fiesta-st-mk7", "vw-golf-gti-mk7", "honda-civic-fk2-type-r", "renault-megane-4-rs", "ford-focus-rs-mk3", "audi-rs3-8v"],
    ["nissan-skyline-gtr-r32", "toyota-supra-a80-mk4", "nissan-skyline-gtr-r33", "nissan-skyline-gtr-r34"],
    ["nissan-silvia-s13", "nissan-silvia-s14", "nissan-silvia-s15", "nissan-350z-z33", "nissan-370z-z34"],
    ["bmw-m3-e46", "audi-rs4-b5", "audi-rs4-b7", "bmw-m3-e92"],
    ["bmw-m3-f80", "audi-rs4-b9", "audi-rs5-8t", "bmw-m4-f82", "bmw-m3-g80", "audi-rs5-b9", "bmw-m4-g82"],
    ["audi-r8-v8", "audi-r8-v10", "mb-amg-gt", "nissan-gt-r-r35"],
    ["rally-subaru-impreza-gc8", "rally-evo", "rally-focus-wrc", "rally-lancia-integrale"],
    ["rally-peugeot-205-t16-e2", "rally-lancia-delta-s4", "audi-sport-quattro-s1-e2", "ford-rs200"],
    ["ford-escort-rs-cosworth-t35", "ford-sierra-rs-cosworth", "audi-90-quattro-20v", "peugeot-205-t16"],
    ["alpine-a110-2017", "audi-tt-8s", "mazda-mx5-nd", "audi-tt-rs-8s"],
    ["lm-mclaren-f1-gtr", "lm-porsche-911-gt1-98", "mb-clk-gtr", "lm-audi-r8-lmp"],
    ["renault-megane-4-rs", "renault-clio-4-rs", "alpine-a110-2017"]
  ];
  const yearsOf = (c) => { const m = String(c.years || "").match(/(\d{4})(?:\D+(\d{4}|pr[ée]sent|aujourd))?/i); if (!m) return [0, 0]; const a = Number(m[1]), b = m[2] && /\d/.test(m[2]) ? Number(m[2]) : (m[2] ? 2030 : a + 6); return [a, b]; };
  const powerOf = (c) => Number(c.stats && c.stats.power) || Math.max(0, ...((c.phases || []).flatMap((p) => (p.engines || []).map((e) => Number(e.power) || 0))));
  const FAM_THREE = ["alfa", "aston", "land", "rolls", "de"], FAM_SKIP = ["rally", "lm", "mb", "kit"];
  function familyKey(c) {
    let t = String(c.id).split("-"); if (FAM_SKIP.indexOf(t[0]) >= 0) t = t.slice(1);
    return t.slice(0, FAM_THREE.indexOf(t[0]) >= 0 ? 3 : 2).join("-");
  }
  function lineage(car) {
    const k = familyKey(car), list = (C.cars || []).filter((x) => familyKey(x) === k).sort((a, b) => yearsOf(a)[0] - yearsOf(b)[0]);
    return list.length >= 2 && list.length <= 14 ? list : [];
  }
  function rivals(car) {
    const byId = C.carsById, out = [], seen = new Set([car.id]);
    CLUSTERS.forEach((cl) => { if (cl.indexOf(car.id) >= 0) cl.forEach((id) => { if (!seen.has(id) && byId.get(id)) { seen.add(id); out.push(byId.get(id)); } }); });
    const manual = out.length, [a0, a1] = yearsOf(car), p0 = powerOf(car), fam = familyKey(car);
    if (out.length < 4 && p0 > 0 && a0 > 0) {
      const cand = (C.cars || []).filter((x) => !seen.has(x.id) && x.category === car.category && familyKey(x) !== fam && !/^(lm|rally)-/.test(x.id) === !/^(lm|rally)-/.test(car.id)).map((x) => {
        const [b0, b1] = yearsOf(x), px = powerOf(x); if (!px || !b0) return null;
        const overlap = Math.min(a1, b1) - Math.max(a0, b0); if (overlap < 0) return null;
        const dp = Math.abs(px - p0) / Math.max(px, p0); if (dp > 0.25) return null;
        return { x, s: dp * 2 - Math.min(overlap, 8) * 0.05 + (x.brand === car.brand ? 0.35 : 0) };
      }).filter(Boolean).sort((a, b) => a.s - b.s).slice(0, 4 - out.length);
      cand.forEach((c) => out.push(c.x));
    }
    return { list: out.slice(0, 6), manual };
  }
  const nameOf = (c) => { const b = String(c.brand || ""), m = String(c.model || ""); return [b && m.toLowerCase().startsWith(b.toLowerCase() + " ") ? "" : b, m].filter(Boolean).join(" ").replace(/\s*\(.*$/, ""); };

  // ------------------------------------------------------------------ comparaison de deux versions
  function versions(car) {
    const v = [];
    (car.phases || []).forEach((p) => (p.engines || []).forEach((e) => v.push({ label: (p.phaseName ? p.phaseName + " · " : "") + (e.name || "Moteur"), e })));
    return v;
  }
  function versionsOverlay(car) {
    const v = versions(car); if (v.length < 2) return;
    document.querySelectorAll(".ac-sheet.ver-sheet").forEach((n) => n.remove());
    const ov = document.createElement("div"); ov.className = "ac-sheet ver-sheet"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    const opts = (sel) => v.map((x, i) => `<option value="${i}"${i === sel ? " selected" : ""}>${esc(x.label.slice(0, 70))}</option>`).join("");
    ov.innerHTML = `<div class="ac-card ver-card"><button type="button" class="ac-x" data-ac-x aria-label="${T("Fermer")}">×</button><h3>${T("Comparer deux versions")}</h3><p class="lap-meta">${esc(nameOf(car))}</p>
      <div class="ver-sel"><select id="ver-a" aria-label="Version A">${opts(0)}</select><select id="ver-b" aria-label="Version B">${opts(v.length - 1)}</select></div><div id="ver-out"></div></div>`;
    document.body.appendChild(ov);
    const rows = [["Puissance", "power", "ch", 1], ["Couple", "torque", "Nm", 1], ["Vitesse maxi", "speed", "km/h", 1], ["0 à 100 km/h", "zeroToHundred", "s", -1]];
    const draw = () => {
      const a = v[Number(ov.querySelector("#ver-a").value)].e, b = v[Number(ov.querySelector("#ver-b").value)].e;
      const cell = (x, y, dir) => { const n = Number(x) || 0, m = Number(y) || 0; return n > 0 && m > 0 && n !== m && (dir > 0 ? n > m : n < m) ? " win" : ""; };
      ov.querySelector("#ver-out").innerHTML = `<div class="ver-grid">${rows.map(([l, k, u, d]) => `<div class="ver-l">${T(l)}</div><div class="ver-c${cell(a[k], b[k], d)}">${a[k] ? a[k] + " " + u : "—"}</div><div class="ver-c${cell(b[k], a[k], d)}">${b[k] ? b[k] + " " + u : "—"}</div>`).join("")}
        <div class="ver-l">${T("Boîte")}</div><div class="ver-c">${esc(a.transmission || "—")}</div><div class="ver-c">${esc(b.transmission || "—")}</div>
        <div class="ver-l">${T("Code moteur")}</div><div class="ver-c">${esc(a.code || "—")}</div><div class="ver-c">${esc(b.code || "—")}</div></div>`;
    };
    ov.addEventListener("change", draw);
    ov.addEventListener("click", (e) => { if (e.target === ov || e.target.closest("[data-ac-x]")) ov.remove(); });
    draw();
  }

  // ------------------------------------------------------------------ signalement d'une erreur sur une fiche
  const FIELDS = ["Puissance", "Couple", "Vitesse maxi", "0 à 100 km/h", "Années de production", "Texte ou histoire", "Photo", "Autre"];
  function reportOverlay(car) {
    if (!C.requireLogin()) return;
    document.querySelectorAll(".ac-sheet.rep-sheet").forEach((n) => n.remove());
    const ov = document.createElement("div"); ov.className = "ac-sheet rep-sheet"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    ov.innerHTML = `<div class="ac-card rep-card"><button type="button" class="ac-x" data-ac-x aria-label="${T("Fermer")}">×</button><h3>${T("Signaler une erreur")}</h3><p class="lap-meta">${esc(nameOf(car))}</p>
      <label class="rep-l">${T("Que faut-il corriger ?")}<select id="rep-f">${FIELDS.map((f) => `<option>${T(f)}</option>`).join("")}</select></label>
      <label class="rep-l">${T("Précise la bonne information")}<textarea id="rep-t" maxlength="300" rows="4" placeholder="${T("Ex : 0 à 100 en 5,9 s d'après le constructeur")}"></textarea></label>
      <div class="rep-act"><button type="button" class="cta-btn fill-btn" data-rep-send>${T("Envoyer")}</button><button type="button" class="cta-btn btn-ghost" data-ac-x>${T("Annuler")}</button></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click", async (e) => {
      if (e.target === ov || e.target.closest("[data-ac-x]")) { ov.remove(); return; }
      if (!e.target.closest("[data-rep-send]")) return;
      const text = ov.querySelector("#rep-t").value.trim();
      if (text.length < 5) { C.toast("Explique en quelques mots ce qui est faux.", "err"); return; }
      try {
        await C.db.collection("car_reports").doc(car.id + "__" + C.user.uid).set({ carId: car.id, carName: nameOf(car).slice(0, 80), uid: C.user.uid, pilot: String(C.pilotName ? C.pilotName() : "Pilote").slice(0, 40), field: ov.querySelector("#rep-f").value.slice(0, 40), text: text.slice(0, 300), status: "open", createdAt: C.FieldValue.serverTimestamp() });
        C.toast("Merci ! Ton signalement sera relu par l'équipe.", "ok"); ov.remove();
      } catch (er) { C.toast("Envoi impossible : " + er.message, "err"); }
    });
  }

  // ------------------------------------------------------------------ injection dans la fiche
  function miniCar(c, cur) {
    const [a, b] = yearsOf(c);
    return `<a class="fp-car${cur ? " cur" : ""}" href="#/voiture/${encodeURIComponent(c.id)}"${cur ? ' aria-current="true"' : ""}><i>${a || "?"}</i><b>${esc(nameOf(c).replace(c.brand, "").trim() || nameOf(c))}</b><small>${esc(String(c.years || ""))}${powerOf(c) ? " · " + powerOf(c) + " ch" : ""}</small></a>`;
  }
  function inject(car) {
    const body = document.querySelector("#vehicle-detail-content .sheet-core-body"); if (!body || body.querySelector(".fp-zone") || !C) return;
    const fam = lineage(car), riv = rivals(car), vers = versions(car).length >= 2;
    const on = (document.querySelector(".sheet-tabs [aria-selected=true]") || {}).dataset;
    const wrap = document.createElement("div"); wrap.className = "fp-zone" + (!on || on.sheetTab === "apercu" ? " tab-on" : ""); wrap.setAttribute("data-tab", "apercu");
    wrap.innerHTML = `${fam.length ? `<h3 class="fp-h">${T("Les générations")}</h3><div class="fp-line" role="list">${fam.map((c) => miniCar(c, c.id === car.id)).join("")}</div>` : ""}
      ${riv.list.length ? `<h3 class="fp-h">${T("Rivales d'époque")}</h3><div class="fp-riv">${riv.list.map((c) => miniCar(c, false)).join("")}</div><a class="fp-cmp" href="#/comparer/${[car.id].concat(riv.list.slice(0, 2).map((c) => c.id)).map(encodeURIComponent).join(",")}">${T("Comparer avec ses rivales")}</a>` : ""}
      <div class="fp-actions">${vers ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-fp-ver>${T("Comparer deux versions")}</button>` : ""}${fam.length >= 2 ? (() => { const i = fam.findIndex((c) => c.id === car.id), o = fam[i + 1] || fam[i - 1]; return o && i >= 0 ? `<a class="cta-btn btn-ghost compact-btn" href="#/comparer/${encodeURIComponent(car.id)},${encodeURIComponent(o.id)}">${T("Comparer avec la génération voisine")}</a>` : ""; })() : ""}
        <button type="button" class="cta-btn btn-ghost compact-btn fp-flag" data-fp-report>${T("Signaler une erreur")}</button></div>`;
    body.appendChild(wrap);
  }

  // ------------------------------------------------------------------ recherche vocale et recherches sans résultat
  function voice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition, input = document.getElementById("global-search-input"), box = document.querySelector("#search-container .command-search-wrapper");
    if (!SR || !input || !box || box.querySelector(".fp-mic")) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "fp-mic"; b.setAttribute("aria-label", T("Recherche vocale"));
    b.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;
    box.appendChild(b);
    const kb = box.querySelector(".cmd-key-indicator"), kd = kb && getComputedStyle(kb).display !== "none";
    b.style.right = kd ? "64px" : "12px"; input.style.paddingRight = kd ? "104px" : "52px";
    let rec = null;
    b.addEventListener("click", () => {
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = (document.documentElement.lang || "fr") === "fr" ? "fr-FR" : document.documentElement.lang; rec.interimResults = false; rec.maxAlternatives = 1;
      b.classList.add("on");
      rec.onresult = (e) => { const t = (e.results[0] && e.results[0][0] && e.results[0][0].transcript) || ""; input.value = t.replace(/[.!?]+$/, ""); input.dispatchEvent(new Event("input", { bubbles: true })); input.focus(); };
      rec.onerror = () => { C.toast("Micro indisponible ou refusé.", "err"); };
      rec.onend = () => { b.classList.remove("on"); rec = null; };
      try { rec.start(); } catch (_) { rec = null; b.classList.remove("on"); }
    });
  }
  const seenMiss = new Set();
  function watchMisses() {
    const sug = document.getElementById("search-suggestions"), input = document.getElementById("global-search-input"); if (!sug || !input) return;
    let t = 0;
    new MutationObserver(() => {
      clearTimeout(t); t = setTimeout(() => {
        const q = input.value.trim().toLowerCase().replace(/\s+/g, " ");
        if (q.length < 3 || q.length > 40 || !sug.querySelector(".suggestion-empty") || seenMiss.has(q)) return;
        seenMiss.add(q);
        const id = q.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40); if (!id) return;
        C.db.collection("search_misses").doc(id).set({ q: q.slice(0, 40), n: C.FieldValue.increment(1), last: C.FieldValue.serverTimestamp() }, { merge: true }).catch(() => {});
      }, 1500);
    }).observe(sug, { childList: true, subtree: true });
  }

  // ------------------------------------------------------------------ tableau de bord admin : corrections, recherches sans résultat, pages en erreur
  async function adminPanel(host, ctx) {
    C = C || ctx; if (!host) return;
    let box = host.querySelector(".fp-admin"); if (!box) { box = document.createElement("div"); box.className = "fp-admin"; host.appendChild(box); }
    box.innerHTML = `<div class="empty-note">Chargement…</div>`;
    const snap = async (q) => { try { return (await q.get()).docs.map((d) => Object.assign({ id: d.id }, d.data())); } catch (_) { return null; } };
    const [reports, misses, errs] = await Promise.all([snap(C.db.collection("car_reports").where("status", "==", "open").limit(60)), snap(C.db.collection("search_misses").orderBy("n", "desc").limit(15)), snap(C.db.collection("client_errors").limit(200))]);
    const pages = {}; (errs || []).filter((e) => !e.done).forEach((e) => { const p = String(e.page || "?").slice(0, 40); pages[p] = (pages[p] || 0) + (e.n || 1); });
    const topPages = Object.entries(pages).sort((a, b) => b[1] - a[1]).slice(0, 6);
    box.innerHTML = `<h3 class="admin-h3">🛠 Corrections demandées ${reports ? "(" + reports.length + ")" : ""}</h3>
      ${reports === null ? `<p class="lap-meta">Règles Firestore à publier.</p>` : reports.length ? `<ul class="fp-rep-list">${reports.map((r) => `<li><div><b>${esc(r.carName || r.carId)}</b> · ${esc(r.field)}<small> par ${esc(r.pilot || "?")}</small><p>${esc(r.text)}</p></div><div class="fp-rep-btn"><a class="cta-btn btn-ghost compact-btn" href="#/voiture/${encodeURIComponent(r.carId)}">Fiche</a><button type="button" class="cta-btn fill-btn compact-btn" data-fp-done="${esc(r.id)}">Corrigé</button><button type="button" class="cta-btn btn-ghost compact-btn" data-fp-rej="${esc(r.id)}">Rejeter</button></div></li>`).join("")}</ul>` : `<p class="lap-meta">Aucune correction en attente.</p>`}
      <h3 class="admin-h3">🔍 Recherches sans résultat</h3>${misses === null ? `<p class="lap-meta">Règles Firestore à publier.</p>` : misses.length ? `<ol class="fp-miss">${misses.map((m) => `<li><span>${esc(m.q)}</span><b>${m.n}</b></li>`).join("")}</ol>` : `<p class="lap-meta">Aucune recherche sans résultat pour l'instant.</p>`}
      <h3 class="admin-h3">⚠ Pages qui plantent</h3>${topPages.length ? `<ol class="fp-miss">${topPages.map(([p, n]) => `<li><span>${esc(p)}</span><b>${n}</b></li>`).join("")}</ol><p class="lap-meta"><a href="#/admin/erreurs">Voir le détail des erreurs</a></p>` : `<p class="lap-meta">Aucune erreur non résolue.</p>`}`;
  }
  async function closeReport(id, status) {
    try { await C.db.collection("car_reports").doc(id).update({ status, doneAt: C.FieldValue.serverTimestamp() }); C.toast(status === "done" ? "Marqué comme corrigé." : "Signalement rejeté.", "ok"); const h = document.getElementById("admin-stats"); if (h) adminPanel(h, C); }
    catch (e) { C.toast(e.message, "err"); }
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    document.addEventListener("ma:car-rendered", (e) => setTimeout(() => inject(e.detail.car), 60));
    document.addEventListener("click", (e) => {
      const car = () => C.carsById.get(((location.hash.match(/#\/voiture\/([^/?#]+)/) || [])[1] && decodeURIComponent(location.hash.match(/#\/voiture\/([^/?#]+)/)[1])) || "");
      if (e.target.closest("[data-fp-ver]")) { const c = car(); if (c) versionsOverlay(c); }
      if (e.target.closest("[data-fp-report]")) { const c = car(); if (c) reportOverlay(c); }
      const d = e.target.closest("[data-fp-done]"); if (d) closeReport(d.dataset.fpDone, "done");
      const r = e.target.closest("[data-fp-rej]"); if (r) closeReport(r.dataset.fpRej, "rejected");
    });
    setTimeout(() => { voice(); watchMisses(); }, 1500);
  });
  window.MAFichePlus = { adminPanel, rivals: (c) => rivals(c), lineage: (c) => lineage(c) };
})();
