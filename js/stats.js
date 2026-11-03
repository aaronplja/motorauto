/**
 * MOTORAUTO — statistiques de fréquentation ANONYMES : un compteur par jour (site_stats/AAAA-MM-JJ), aucune donnée personnelle.
 *   { views, visitors, pages: {page: n}, cars: {id: n} }  — écrit par le site, lu uniquement par l'administrateur.
 * Panneau « Statistiques » dans Administration › Tableau de bord.
 */
(function () {
  "use strict";
  let C = null, lastKey = "";
  const day = (d) => { const x = d || new Date(); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
  const clean = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9_-]+/g, "").slice(0, 40);
  function pageOf(h) {
    const m = /^#?\/?([^/?#]*)(?:\/([^/?#]*))?/.exec(h || "") || [];
    return { page: clean(m[1]) || "accueil", id: m[1] === "voiture" ? clean(decodeURIComponent(m[2] || "")) : "" };
  }
  async function track() {
    if (!C || !C.db) return;
    const h = location.hash, { page, id } = pageOf(h), key = page + "/" + id;
    if (key === lastKey || /^admin$/.test(page)) return; lastKey = key;
    let first = false; try { const k = "motorauto_seen_" + day(); if (!localStorage.getItem(k)) { localStorage.setItem(k, "1"); first = true; } } catch (_) { /* ignoré */ }
    const inc = C.FieldValue.increment, data = { views: inc(1), pages: { [page]: inc(1) }, updatedAt: C.FieldValue.serverTimestamp() };
    if (first) data.visitors = inc(1);
    if (id) data.cars = { [id]: inc(1) };
    try { await C.db.collection("site_stats").doc(day()).set(data, { merge: true }); } catch (_) { /* compteur facultatif */ }
  }
  async function panel() {
    if (!C.isAdmin) return;
    const host = document.getElementById("admin-inbox"); if (!host) return;
    let box = document.getElementById("admin-stats");
    if (!box) { box = document.createElement("section"); box.id = "admin-stats"; box.className = "admin-stats"; host.insertAdjacentElement("afterend", box); }
    box.innerHTML = `<h3 class="admin-h3">📊 Statistiques (14 derniers jours)</h3><div class="empty-note">Chargement…</div>`;
    const days = []; for (let i = 13; i >= 0; i--) days.push(day(new Date(Date.now() - i * 86400000)));
    const docs = await Promise.all(days.map((d) => C.db.collection("site_stats").doc(d).get().then((s) => (s.exists ? s.data() : {})).catch(() => ({}))));
    const views = docs.map((d) => d.views || 0), vis = docs.map((d) => d.visitors || 0), max = Math.max(1, ...views);
    const sum = (a) => a.reduce((t, x) => t + x, 0), pages = {}, cars = {};
    docs.forEach((d) => { Object.entries(d.pages || {}).forEach(([k, v]) => { pages[k] = (pages[k] || 0) + v; }); Object.entries(d.cars || {}).forEach(([k, v]) => { cars[k] = (cars[k] || 0) + v; }); });
    const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
    let users = [], cols = [];
    try { users = (await C.db.collection("users").limit(1000).get()).docs.map((d) => d.data()); } catch (_) { /* règles */ }
    try { cols = (await C.db.collection("collections").limit(1000).get()).docs.map((d) => d.data()); } catch (_) { /* règles */ }
    const ms = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0), week = Date.now() - 7 * 86400000;
    const signups = users.filter((u) => ms(u.createdAt) > week).length, esc = C.esc;
    const carName = (id) => { const c = C.carsById.get(id); return c ? c.brand + " " + c.model : id; };
    box.innerHTML = `<h3 class="admin-h3">📊 Statistiques (14 derniers jours)</h3>
      <div class="dash-grid"><div class="dash-card"><b>${sum(views)}</b><span>Pages vues</span></div><div class="dash-card"><b>${sum(vis)}</b><span>Visiteurs</span></div><div class="dash-card"><b>${users.length}</b><span>Pilotes inscrits</span></div><div class="dash-card"><b>${signups}</b><span>Inscrits (7 j)</span></div><div class="dash-card"><b>${sum(cols.map((c) => c.opened || 0))}</b><span>Packs ouverts (total)</span></div><div class="dash-card"><b>${sum(cols.map((c) => c.count || 0))}</b><span>Cartes collectées</span></div></div>
      <div class="stat-bars" role="img" aria-label="Pages vues par jour">${views.map((v, i) => `<i style="--h:${Math.round(v / max * 100)}%" title="${days[i]} : ${v} vues"></i>`).join("")}</div>
      <div class="stat-cols"><div><h4>Pages les plus vues</h4><ol>${top(pages, 8).map(([k, v]) => `<li><span>${esc(k)}</span><b>${v}</b></li>`).join("") || "<li>—</li>"}</ol></div><div><h4>Fiches les plus consultées</h4><ol>${top(cars, 10).map(([k, v]) => `<li><span>${esc(carName(k))}</span><b>${v}</b></li>`).join("") || "<li>—</li>"}</ol></div></div>
      <p class="lap-meta">Compteurs anonymes : aucune donnée personnelle, aucun cookie.</p>`;
    if (window.MAFichePlus) window.MAFichePlus.adminPanel(box, C);
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx; setTimeout(track, 1200); window.addEventListener("hashchange", () => setTimeout(track, 400));
    ctx.Router.register("admin", { enter: (p) => { if (p.tab === "tableau") setTimeout(panel, 600); } });
  });
})();
