/**
 * MOTORAUTO — carnet d'entretien du garage : vidanges, courroie, freins… avec rappels (date ou kilométrage).
 *   users/{uid}/maintenance/{auto} { carName, type, dateMs, km, note, nextDateMs, nextKm, createdAt }
 */
(function () {
  "use strict";
  let C = null, items = [], loaded = false;
  const TYPES = ["Vidange", "Courroie / chaîne de distribution", "Filtres (air, habitacle, carburant)", "Freins (plaquettes, disques)", "Pneus", "Embrayage", "Batterie", "Liquide de refroidissement", "Contrôle technique", "Assurance", "Autre"];
  const DAY = 86400000;
  const fmt = (ms) => (ms ? new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");
  const inputDate = (ms) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const col = () => C.db.collection("users").doc(C.user.uid).collection("maintenance");

  async function load(force) {
    if (!C.user) { items = []; loaded = false; return; }
    if (loaded && !force) return;
    const s = await col().limit(300).get();
    items = s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => (b.dateMs || 0) - (a.dateMs || 0));
    loaded = true;
  }

  // km le plus récent connu par voiture
  function latestKm(carName) { return Math.max(0, ...items.filter((i) => i.carName === carName && i.km).map((i) => i.km)); }
  function reminders() {
    const out = [], now = Date.now();
    // on ne rappelle que le dernier entretien de chaque type et voiture
    const seen = new Set();
    items.forEach((i) => {
      const k = i.carName + "|" + i.type;
      if (seen.has(k)) return; seen.add(k);
      if (i.nextDateMs) { const left = i.nextDateMs - now; if (left < 30 * DAY) out.push({ i, level: left < 0 ? "late" : "soon", text: left < 0 ? `en retard de ${Math.ceil(-left / DAY)} j` : `dans ${Math.ceil(left / DAY)} j (${fmt(i.nextDateMs)})` }); }
      if (i.nextKm) { const left = i.nextKm - latestKm(i.carName); if (left < 1500) out.push({ i, level: left <= 0 ? "late" : "soon", text: left <= 0 ? `dépassé de ${-left} km` : `dans ~${left} km (à ${i.nextKm} km)` }); }
    });
    return out.sort((a, b) => (a.level === "late" ? 0 : 1) - (b.level === "late" ? 0 : 1));
  }
  function reminderHtml() {
    const r = reminders(), esc = C.esc;
    if (!r.length) return "";
    return `<div class="reminder-box" role="status"><b>🔧 Rappels d'entretien</b><ul style="margin:.4rem 0 0;padding-left:1.1rem">${r.map((x) => `<li><b>${esc(x.i.type)}</b> — ${esc(x.i.carName || "ma voiture")} : <span class="due ${x.level}">${esc(x.text)}</span></li>`).join("")}</ul></div>`;
  }

  function render() {
    const root = document.getElementById("maint-root"), esc = C.esc;
    if (!root) return;
    if (!C.user) { root.innerHTML = `<div class="empty-note">Connecte-toi pour tenir ton carnet d'entretien.</div>`; return; }
    const cars = (C.app.getMyCars() || []).map((c) => c.name).filter(Boolean);
    const dl = `<datalist id="maint-cars">${cars.map((n) => `<option value="${esc(n)}">`).join("")}</datalist>`;
    root.innerHTML = `
      ${reminderHtml()}
      <form class="maint-form" id="maint-form" novalidate>${dl}
        <div class="input-stack"><label for="mt-car">Voiture</label><input type="text" id="mt-car" list="maint-cars" maxlength="80" required placeholder="Ex. 106 S16 bleue" value="${esc(cars[0] || "")}"></div>
        <div class="input-stack"><label for="mt-type">Entretien</label><select id="mt-type" class="custom-select">${TYPES.map((t) => `<option>${esc(t)}</option>`).join("")}</select></div>
        <div class="input-stack"><label for="mt-date">Date</label><input type="date" id="mt-date" value="${inputDate(Date.now())}" required></div>
        <div class="input-stack"><label for="mt-km">Kilométrage</label><input type="number" id="mt-km" min="0" max="2000000" inputmode="numeric" placeholder="Ex. 148000"></div>
        <div class="input-stack"><label for="mt-next-date">Prochain avant le <small>(rappel)</small></label><input type="date" id="mt-next-date"></div>
        <div class="input-stack"><label for="mt-next-km">Prochain à <small>(km, rappel)</small></label><input type="number" id="mt-next-km" min="0" max="2000000" inputmode="numeric" placeholder="Ex. 158000"></div>
        <div class="input-stack wide"><label for="mt-note">Note (prix, garage, référence d'huile…)</label><input type="text" id="mt-note" maxlength="160"></div>
        <div class="wide"><div class="form-feedback error-txt" id="mt-error" role="alert"></div><button type="submit" class="cta-btn fill-btn">Ajouter au carnet</button></div>
      </form>
      ${items.length ? `<div class="maint-export"><button type="button" class="cta-btn btn-ghost compact-btn" id="maint-pdf">📄 Exporter le carnet en PDF</button><small class="lap-meta">Utile pour prouver l'entretien à un acheteur.</small></div>` : ""}
      <div class="maint-list">${items.length ? items.map((i) => `
        <div class="maint-row"><div class="m-main"><b>${esc(i.type)}</b> · ${esc(i.carName || "")}<small>${fmt(i.dateMs)}${i.km ? " · " + i.km + " km" : ""}${i.note ? " · " + esc(i.note) : ""}</small>
          ${(i.nextDateMs || i.nextKm) ? `<small>Prochain : ${i.nextDateMs ? fmt(i.nextDateMs) : ""}${i.nextDateMs && i.nextKm ? " ou " : ""}${i.nextKm ? i.nextKm + " km" : ""}</small>` : ""}</div>
          <button type="button" class="secondary-destructive-btn" data-maint-del="${esc(i.id)}" aria-label="Supprimer cette ligne">Supprimer</button></div>`).join("") : `<div class="empty-note">Aucun entretien noté. Ajoute ta dernière vidange ou ta courroie : le rappel se fera tout seul.</div>`}</div>`;
    document.getElementById("maint-form").addEventListener("submit", add);
    const pdf = document.getElementById("maint-pdf"); if (pdf) pdf.addEventListener("click", exportPdf);
    root.querySelectorAll("[data-maint-del]").forEach((b) => b.addEventListener("click", () => del(b.dataset.maintDel)));
  }

  /** carnet imprimable : une page propre ouverte dans un nouvel onglet, « Enregistrer au format PDF » dans la boîte d'impression */
  function exportPdf() {
    const esc = C.esc, cars = Array.from(new Set(items.map((i) => i.carName || "Ma voiture")));
    const pilot = (C.profile && C.profile.username) || "";
    const body = cars.map((n) => {
      const rows = items.filter((i) => (i.carName || "Ma voiture") === n).sort((a, b) => (a.dateMs || 0) - (b.dateMs || 0));
      return `<h2>${esc(n)}</h2><table><thead><tr><th>Date</th><th>Entretien</th><th>Km</th><th>Détail</th><th>Prochain</th></tr></thead><tbody>${rows.map((i) => `<tr><td>${fmt(i.dateMs)}</td><td>${esc(i.type)}</td><td>${i.km ? i.km.toLocaleString("fr-FR") : ""}</td><td>${esc(i.note || "")}</td><td>${i.nextDateMs ? fmt(i.nextDateMs) : ""}${i.nextDateMs && i.nextKm ? " / " : ""}${i.nextKm ? i.nextKm.toLocaleString("fr-FR") + " km" : ""}</td></tr>`).join("")}</tbody></table>`;
    }).join("");
    const w = window.open("", "_blank");
    if (!w) { C.toast("Autorise les fenêtres pop-up pour exporter le PDF.", "err"); return; }
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Carnet d'entretien${pilot ? " — " + esc(pilot) : ""}</title><style>
      body{font:14px/1.45 system-ui,sans-serif;color:#111;margin:32px}h1{margin:0 0 4px;font-size:24px}h2{margin:28px 0 8px;font-size:18px;border-bottom:2px solid #dc2626;padding-bottom:4px}
      .meta{color:#555;margin-bottom:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3f4f6}tr{page-break-inside:avoid}
      footer{margin-top:28px;color:#777;font-size:12px}@media print{button{display:none}}</style></head><body>
      <h1>Carnet d'entretien</h1><div class="meta">${pilot ? esc(pilot) + " · " : ""}édité le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · MOTORAUTO</div>${body}
      <footer>Document déclaratif établi par le propriétaire depuis son carnet MOTORAUTO ; il ne remplace pas les factures.</footer>
      <button onclick="window.print()" style="margin-top:16px;padding:8px 14px">Imprimer / Enregistrer en PDF</button><script>setTimeout(function(){window.print()},400)<\/script></body></html>`);
    w.document.close();
  }

  async function add(e) {
    e.preventDefault();
    const err = document.getElementById("mt-error"); err.textContent = "";
    const carName = document.getElementById("mt-car").value.trim().slice(0, 80);
    const dateMs = new Date(document.getElementById("mt-date").value).getTime();
    const num = (id) => { const n = parseInt(document.getElementById(id).value, 10); return Number.isFinite(n) && n >= 0 ? n : 0; };
    const nd = document.getElementById("mt-next-date").value;
    if (!carName) { err.textContent = "Indique la voiture."; return; }
    if (!Number.isFinite(dateMs)) { err.textContent = "Indique la date de l'entretien."; return; }
    const doc = { carName, type: document.getElementById("mt-type").value, dateMs, km: num("mt-km"), note: document.getElementById("mt-note").value.trim().slice(0, 160), nextDateMs: nd ? new Date(nd).getTime() : 0, nextKm: num("mt-next-km"), createdAt: C.FieldValue.serverTimestamp() };
    try { await col().add(doc); loaded = false; await load(true); render(); renderOverview(); C.toast("Entretien ajouté au carnet.", "ok"); }
    catch (ex) { err.textContent = "Enregistrement impossible : " + ex.message; }
  }
  async function del(id) {
    if (!confirm("Supprimer cette ligne du carnet ?")) return;
    try { await col().doc(id).delete(); items = items.filter((i) => i.id !== id); render(); renderOverview(); } catch (e) { C.toast("Suppression impossible : " + e.message, "err"); }
  }
  function renderOverview() { const b = document.getElementById("garage-reminders"); if (b) b.innerHTML = reminderHtml(); }

  let toasted = false;
  async function afterAuth() {
    loaded = false; items = [];
    if (!C.user) return;
    try { await load(true); } catch (_) { return; }
    const n = reminders().length;
    if (n && !toasted) { toasted = true; C.toast(`🔧 ${n} rappel${n > 1 ? "s" : ""} d'entretien à voir dans ton garage.`); }
    if (C.Router.is("garage")) { renderOverview(); if (C.Router.is("garage", { tab: "suivi" })) render(); }
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx); C.app = window.MAApp;
    ctx.Router.register("garage", { enter: async (p) => {
      try { await load(); } catch (e) { /* règles non publiées */ }
      renderOverview();
      if (p.tab === "suivi") render();
    } });
    document.addEventListener("ma:auth", afterAuth);
  });
})();
