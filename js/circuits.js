/**
 * MOTORAUTO — circuits : liste, page d'un circuit (record, courbe de progression,
 * comparaison de deux pilotes sur le même tour). Tout est calculé à partir de global_laps.
 */
(function () {
  "use strict";
  let C = null;
  const COLORS = ["var(--accent)", "#38bdf8"];
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : t && t.seconds ? t.seconds * 1000 : typeof t === "number" ? t : 0);
  const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");

  async function laps() { return (await C.app.getLaps()).slice(); }
  const keyOf = (l) => l.trackKey || C.MA.trackKey(l.track || "");

  function groupTracks(all) {
    const m = new Map();
    all.forEach((l) => {
      const k = keyOf(l); if (!k || !(l.chronoMs > 0)) return;
      if (!m.has(k)) m.set(k, { key: k, name: l.track || k, laps: [] });
      m.get(k).laps.push(l);
    });
    return Array.from(m.values()).map((t) => { t.laps.sort((a, b) => a.chronoMs - b.chronoMs); t.best = t.laps[0]; t.pilots = new Set(t.laps.map((l) => l.pilotUid)).size; return t; })
      .sort((a, b) => b.laps.length - a.laps.length || a.name.localeCompare(b.name, "fr"));
  }

  // ---------- liste
  let tracksCache = [];
  async function renderList() {
    const box = document.getElementById("circuits-list");
    if (!box) return;
    box.innerHTML = `<div class="empty-note">Chargement…</div>`;
    try { tracksCache = groupTracks(await laps()); } catch (e) { box.innerHTML = `<div class="empty-note error">Circuits indisponibles.</div>`; return; }
    drawList();
  }
  function drawList() {
    const box = document.getElementById("circuits-list"), esc = C.esc;
    const q = C.normalize((document.getElementById("circuits-search") || {}).value || "");
    const list = tracksCache.filter((t) => !q || C.normalize(t.name).includes(q));
    document.getElementById("circuits-count").textContent = `${list.length} circuit${list.length > 1 ? "s" : ""}`;
    box.innerHTML = list.length ? list.map((t) => `<a class="circuit-card" href="#/circuit/${encodeURIComponent(t.key)}"><b>${esc(t.name)}</b><span class="rec">${esc(t.best.chrono)}</span><small class="lap-meta">${esc(t.best.pilot || "Pilote")} · ${esc(t.best.carName || "")}</small><small class="lap-meta">${t.laps.length} chrono${t.laps.length > 1 ? "s" : ""} · ${t.pilots} pilote${t.pilots > 1 ? "s" : ""}</small></a>`).join("")
      : `<div class="empty-note">Aucun circuit pour l'instant : enregistre un chrono depuis une fiche voiture.</div>`;
  }

  // ---------- graphique
  function lineChart(series, label) {
    const W = 640, H = 240, L = 62, R = 14, T = 14, B = 34;
    const pts = series.flatMap((s) => s.pts);
    if (!pts.length) return `<div class="empty-note small">Pas assez de données.</div>`;
    let t0 = Math.min(...pts.map((p) => p.t)), t1 = Math.max(...pts.map((p) => p.t));
    if (t1 === t0) { t0 -= 86400000; t1 += 86400000; }
    let m0 = Math.min(...pts.map((p) => p.ms)), m1 = Math.max(...pts.map((p) => p.ms));
    if (m1 === m0) { m0 -= 1000; m1 += 1000; }
    const pad = (m1 - m0) * 0.08; m0 -= pad; m1 += pad;
    const x = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
    const y = (ms) => T + ((ms - m0) / (m1 - m0)) * (H - T - B); // plus rapide = en haut
    const f = C.MA.formatLapTime;
    let g = "";
    for (let i = 0; i <= 3; i++) { const ms = m0 + ((m1 - m0) * i) / 3, yy = y(ms); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--stroke-line)" stroke-dasharray="3 4"/><text x="${L - 8}" y="${yy + 4}" text-anchor="end" font-size="11" fill="var(--color-muted)">${f(Math.round(ms))}</text>`; }
    g += `<text x="${L}" y="${H - 8}" font-size="11" fill="var(--color-muted)">${fmtDate(t0)}</text><text x="${W - R}" y="${H - 8}" text-anchor="end" font-size="11" fill="var(--color-muted)">${fmtDate(t1)}</text>`;
    series.forEach((s, i) => {
      const color = COLORS[i % COLORS.length];
      if (s.pts.length > 1) g += `<polyline fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" points="${s.pts.map((p) => x(p.t).toFixed(1) + "," + y(p.ms).toFixed(1)).join(" ")}"/>`;
      s.pts.forEach((p) => { g += `<circle cx="${x(p.t).toFixed(1)}" cy="${y(p.ms).toFixed(1)}" r="4" fill="${color}"><title>${C.esc(s.name)} — ${f(p.ms)} le ${fmtDate(p.t)}</title></circle>`; });
    });
    const legend = series.map((s, i) => `<span><i style="background:${COLORS[i % COLORS.length]}"></i>${C.esc(s.name)}</span>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${C.esc(label)}">${g}</svg><div class="legend">${legend}<span>↑ plus rapide</span></div>`;
  }
  // meilleur temps « à la date t » : la courbe ne fait que s'améliorer
  function progression(ls) {
    const sorted = ls.filter((l) => tsMs(l.createdAt)).sort((a, b) => tsMs(a.createdAt) - tsMs(b.createdAt));
    let best = Infinity; const out = [];
    sorted.forEach((l) => { if (l.chronoMs < best) { best = l.chronoMs; out.push({ t: tsMs(l.createdAt), ms: l.chronoMs }); } });
    return out;
  }

  // ---------- fiche éditoriale du circuit : circuit_info/{key} { length, turns, record, recordBy, recordYear, photo, text, updatedAt }
  async function renderInfo(key, t) {
    const box = document.getElementById("circ-info"); if (!box) return;
    let info = {};
    try { const d = await C.db.collection("circuit_info").doc(key).get(); info = d.exists ? d.data() : {}; } catch (_) { /* règles non publiées : fiche vide */ }
    if (!document.getElementById("circ-info")) return;
    const esc = C.esc, cars = new Map();
    t.laps.forEach((l) => { const k = l.carId || l.carName; if (!k) return; const e = cars.get(k) || { name: l.carName || k, id: l.carId, n: 0 }; e.n++; cars.set(k, e); });
    const carList = Array.from(cars.values()).sort((a, b) => b.n - a.n).slice(0, 14);
    const has = info.length || info.turns || info.record || info.text || info.photo;
    const ph = C.safeUrl(info.photo);
    const edit = C.isAdmin ? `<details class="circ-edit"><summary class="cta-btn btn-ghost compact-btn">✎ Éditer la fiche du circuit</summary><form id="circ-info-form" class="maint-form" novalidate>
      <div class="input-stack"><label for="ci-length">Longueur (km)</label><input type="text" id="ci-length" inputmode="decimal" value="${esc(info.length || "")}"></div>
      <div class="input-stack"><label for="ci-turns">Virages</label><input type="number" id="ci-turns" min="0" max="99" value="${esc(info.turns || "")}"></div>
      <div class="input-stack"><label for="ci-record">Record absolu (temps)</label><input type="text" id="ci-record" maxlength="20" placeholder="1:32.4" value="${esc(info.record || "")}"></div>
      <div class="input-stack"><label for="ci-by">Détenteur / voiture</label><input type="text" id="ci-by" maxlength="80" value="${esc(info.recordBy || "")}"></div>
      <div class="input-stack"><label for="ci-year">Année du record</label><input type="number" id="ci-year" min="1900" max="2100" value="${esc(info.recordYear || "")}"></div>
      <div class="input-stack"><label for="ci-photo">Photo (https://…)</label><input type="url" id="ci-photo" maxlength="400" value="${esc(info.photo || "")}"></div>
      <div class="input-stack wide"><label for="ci-text">Présentation</label><textarea id="ci-text" rows="4" maxlength="1200">${esc(info.text || "")}</textarea></div>
      <div class="wide"><div class="form-feedback error-txt" id="ci-error" role="alert"></div><button type="submit" class="cta-btn fill-btn">Enregistrer</button></div></form></details>` : "";
    box.innerHTML = `${has ? `<section class="circ-card">${ph ? `<img src="${esc(ph)}" alt="" loading="lazy" data-fallback="car">` : ""}<div class="circ-card-body">
      <div class="circ-facts">${info.length ? `<span><b>${esc(String(info.length).replace(".", ","))} km</b>longueur</span>` : ""}${info.turns ? `<span><b>${esc(info.turns)}</b>virages</span>` : ""}${info.record ? `<span><b>${esc(info.record)}</b>record absolu${info.recordBy ? " · " + esc(info.recordBy) : ""}${info.recordYear ? " (" + esc(info.recordYear) + ")" : ""}</span>` : ""}</div>
      ${info.text ? `<p>${esc(info.text)}</p>` : ""}</div></section>` : (C.isAdmin ? "" : "")}
      ${carList.length ? `<div class="sheet-section-head">Voitures qui y ont roulé</div><div class="club-cars">${carList.map((c) => (c.id && C.carsById.has(c.id) ? `<a class="chip" href="#/voiture/${encodeURIComponent(c.id)}">${esc(c.name)} · ${c.n}</a>` : `<span class="chip">${esc(c.name)} · ${c.n}</span>`)).join("")}</div>` : ""}${edit}`;
    const f = document.getElementById("circ-info-form");
    if (f) f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = (id) => document.getElementById(id).value.trim(), n = (id) => { const x = parseFloat(v(id).replace(",", ".")); return Number.isFinite(x) && x >= 0 ? x : 0; };
      const photo = v("ci-photo"), err = document.getElementById("ci-error"); err.textContent = "";
      if (photo && !C.safeUrl(photo)) { err.textContent = "L'adresse de la photo doit commencer par https://"; return; }
      try {
        await C.db.collection("circuit_info").doc(key).set({ length: n("ci-length"), turns: Math.round(n("ci-turns")), record: v("ci-record").slice(0, 20), recordBy: v("ci-by").slice(0, 80), recordYear: Math.round(n("ci-year")), photo: photo.slice(0, 400), text: v("ci-text").slice(0, 1200), updatedAt: C.FieldValue.serverTimestamp() });
        if (window.MALog) window.MALog.log("circuit-edit", { target: key, detail: "fiche circuit modifiée" });
        C.toast("Fiche du circuit enregistrée.", "ok"); renderInfo(key, t);
      } catch (ex) { err.textContent = "Enregistrement impossible : " + ex.message; }
    });
  }

  // ---------- page circuit
  async function renderCircuit(key) {
    const body = document.getElementById("circuit-body"), esc = C.esc;
    body.innerHTML = `<div class="empty-note">Chargement…</div>`;
    let t;
    try { t = groupTracks(await laps()).find((x) => x.key === key); } catch (e) { body.innerHTML = `<div class="empty-note error">Circuit indisponible.</div>`; return; }
    if (!t) { document.getElementById("circuit-title").textContent = "Circuit introuvable"; document.getElementById("circuit-sub").textContent = ""; body.innerHTML = `<div class="empty-note">Aucun chrono pour ce circuit. <a href="#/classement/circuits">Voir tous les circuits</a></div>`; return; }
    document.getElementById("circuit-title").textContent = t.name;
    document.title = t.name + " | MOTORAUTO";
    document.getElementById("circuit-sub").textContent = `${t.laps.length} chrono${t.laps.length > 1 ? "s" : ""} · ${t.pilots} pilote${t.pilots > 1 ? "s" : ""}`;
    const pilots = new Map();
    t.laps.forEach((l) => { if (!pilots.has(l.pilotUid) || pilots.get(l.pilotUid).chronoMs > l.chronoMs) pilots.set(l.pilotUid, l); });
    const plist = Array.from(pilots.values()).sort((a, b) => a.chronoMs - b.chronoMs);
    const opts = plist.map((l) => `<option value="${esc(l.pilotUid)}">${esc(l.pilot || "Pilote")} — ${esc(l.chrono)}</option>`).join("");
    body.innerHTML = `
      <div id="circ-info"></div>
      <div class="dash-grid">
        <div class="dash-card"><b style="color:var(--accent)">${esc(t.best.chrono)}</b><span>Record · ${esc(t.best.pilot || "Pilote")}</span></div>
        <div class="dash-card"><b>${esc(t.best.carName || "—")}</b><span>Voiture du record</span></div>
        <div class="dash-card"><b>${fmtDate(tsMs(t.best.createdAt))}</b><span>Date du record</span></div>
      </div>
      <div class="sheet-section-head">Progression du record</div>
      <div class="chart-box" id="circ-prog"></div>
      <div class="sheet-section-head">Comparer deux pilotes</div>
      <div class="compare-pick">
        <label class="lb-field"><span>Pilote A</span><select id="cmp-a" class="custom-select">${opts}</select></label>
        <label class="lb-field"><span>Pilote B</span><select id="cmp-b" class="custom-select">${opts}</select></label>
      </div>
      <div id="cmp-out" aria-live="polite"></div>
      <div class="sheet-section-head">Classement du circuit</div>
      <ol class="rank-list" style="list-style:none;padding:0">${plist.slice(0, 30).map((l, i) => `<li><button type="button" class="rank-row" style="width:100%;text-align:left;cursor:pointer" data-circ-profile="${esc(l.pilotUid)}"><span class="rank-pos">${i + 1}</span><span class="rank-main"><b>${esc(l.pilot || "Pilote")}</b><small>${esc(l.carName || "")}${l.note ? " · " + esc(l.note) : ""}</small></span><span class="rank-score">${esc(l.chrono)}<small>${i ? "+" + C.MA.formatLapTime(l.chronoMs - plist[0].chronoMs).replace(/^0:/, "") : "record"}</small></span></button></li>`).join("")}</ol>`;
    renderInfo(key, t);
    const prog = progression(t.laps);
    document.getElementById("circ-prog").innerHTML = lineChart([{ name: "Record du circuit", pts: prog.length ? prog : [{ t: tsMs(t.best.createdAt) || Date.now(), ms: t.best.chronoMs }] }], "Évolution du record du circuit " + t.name);
    const a = document.getElementById("cmp-a"), b = document.getElementById("cmp-b");
    if (plist.length > 1) b.selectedIndex = 1;
    const compare = () => {
      const la = pilots.get(a.value), lb = pilots.get(b.value), out = document.getElementById("cmp-out");
      if (!la || !lb) { out.innerHTML = ""; return; }
      if (a.value === b.value) { out.innerHTML = `<div class="empty-note small">Choisis deux pilotes différents.</div>`; return; }
      const d = Math.abs(la.chronoMs - lb.chronoMs), fast = la.chronoMs <= lb.chronoMs ? la : lb;
      const col = (l) => `<div class="cmp-col ${l === fast ? "win" : ""}"><b>${esc(l.pilot || "Pilote")}</b><div class="cmp-time">${esc(l.chrono)}</div><small class="lap-meta">${esc(l.carName || "")}</small>${l === fast ? `<small class="due">Plus rapide</small>` : `<small class="due late">+${(d / 1000).toFixed(3).replace(".", ",")} s</small>`}</div>`;
      const sa = t.laps.filter((l) => l.pilotUid === a.value), sb = t.laps.filter((l) => l.pilotUid === b.value);
      out.innerHTML = `<div class="compare-out">${col(la)}${col(lb)}</div>
        <div class="chart-box">${lineChart([{ name: la.pilot || "Pilote A", pts: sa.filter((l) => tsMs(l.createdAt)).map((l) => ({ t: tsMs(l.createdAt), ms: l.chronoMs })) }, { name: lb.pilot || "Pilote B", pts: sb.filter((l) => tsMs(l.createdAt)).map((l) => ({ t: tsMs(l.createdAt), ms: l.chronoMs })) }], "Tous les tours de " + (la.pilot || "A") + " et " + (lb.pilot || "B"))}</div>
        <p class="lap-meta">Écart sur leurs meilleurs tours : ${(d / 1000).toFixed(3).replace(".", ",")} s (${(d / fast.chronoMs * 100).toFixed(2).replace(".", ",")} %).</p>`;
    };
    a.addEventListener("change", compare); b.addEventListener("change", compare); compare();
    body.querySelectorAll("[data-circ-profile]").forEach((x) => x.addEventListener("click", () => C.openProfile(x.dataset.circProfile)));
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx); C.app = window.MAApp;
    ctx.Router.register("leaderboard", { enter: (p) => { if (p.tab === "circuits") renderList(); } });
    ctx.Router.register("circuit", { enter: (p) => renderCircuit(p.key) });
    const s = document.getElementById("circuits-search");
    if (s) s.addEventListener("input", drawList);
  });
})();
