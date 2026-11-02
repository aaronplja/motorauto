/**
 * MOTORAUTO — Admin › Jeu : modifier la rareté des cartes déjà présentes.
 * config/rarities { map: { idCarte: rareté } } : lu par le site (js/cards.js) et par le serveur du jeu (functions/game.js).
 * « Auto » = on retire la surcharge et la rareté calculée par le score reprend.
 */
(function () {
  "use strict";
  let C = null, map = null, q = "", busy = false, msg = "";
  const G = () => window.MAGameCore, M = () => window.MACards;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const label = (r) => (G().RAR[r] || {}).label || r;
  const name = (c) => (c.brand + " " + String(c.model).replace(/\s*\(.*$/, "")).trim();
  const root = () => document.getElementById("rar-admin");

  async function load() {
    try { const s = await C.db.collection("config").doc("rarities").get(); map = s.exists && s.data().map ? Object.assign({}, s.data().map) : {}; }
    catch (_) { map = {}; msg = "Lecture impossible (règles Firestore à publier ?)."; }
    M().setRarOv(map);
  }
  async function save(id, r) {
    if (busy) return; busy = true; msg = "";
    const next = Object.assign({}, map);
    if (r === "auto") delete next[id]; else next[id] = r;
    try {
      await C.db.collection("config").doc("rarities").set({ map: next });
      map = next; M().setRarOv(map); msg = "Rareté enregistrée. Le serveur la prend en compte dans les 5 minutes.";
    } catch (e) { msg = "Échec : " + e.message; }
    busy = false; draw();
  }
  function row(c) {
    const cur = M().rarityOf(c), auto = M().autoRarity(c), ov = map && map[c.id];
    const opts = G().ORDER.map((r) => `<option value="${r}" ${r === cur ? "selected" : ""}>${esc(label(r))}</option>`).join("");
    return `<div class="rar-row${ov ? " custom" : ""}"><span class="rar-name"><b>${esc(name(c))}</b><small>${ov ? "Modifiée (auto : " + esc(label(auto)) + ")" : "Auto : " + esc(label(auto))}</small></span>
      <select data-rar-set="${esc(c.id)}" aria-label="Rareté de ${esc(name(c))}">${opts}</select>
      ${ov ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-rar-auto="${esc(c.id)}">Auto</button>` : ""}</div>`;
  }
  function draw() {
    const el = root(); if (!el || !map) return;
    const pool = M().pool(), norm = (s) => C.normalize(s || "");
    const nq = norm(q), hits = nq ? pool.filter((c) => norm(name(c)).includes(nq)).slice(0, 12) : [];
    const mod = Object.keys(map).map((id) => pool.find((c) => c.id === id)).filter(Boolean);
    const focus = document.activeElement && document.activeElement.id === "rar-q";
    el.innerHTML = `<div class="admin-sec-head"><h3 class="admin-h3 nomargin">Raretés des cartes</h3></div>
      <p class="admin-note">Cherche une carte du catalogue et change sa rareté : elle s'applique à tous les pilotes (collections, packs, albums). « Auto » rend la rareté calculée par le score.</p>
      <input type="search" id="rar-q" placeholder="Rechercher une voiture…" aria-label="Rechercher une voiture" value="${esc(q)}" autocomplete="off">
      ${msg ? `<p class="admin-note">${esc(msg)}</p>` : ""}
      ${hits.length ? `<div class="rar-list">${hits.map(row).join("")}</div>` : nq ? `<div class="empty-note small">Aucune voiture trouvée.</div>` : ""}
      ${mod.length ? `<h4 class="rar-sub">Cartes modifiées (${mod.length})</h4><div class="rar-list">${mod.map(row).join("")}</div>` : ""}<hr class="admin-sep">`;
    if (focus) { const i = document.getElementById("rar-q"); i.focus(); i.setSelectionRange(q.length, q.length); }
  }
  async function mount(ctx) { C = ctx; if (!map) await load(); draw(); }
  window.MAAdminRarity = { mount };
  document.addEventListener("input", (e) => { if (e.target.id === "rar-q") { q = e.target.value; draw(); } });
  document.addEventListener("change", (e) => { const s = e.target.closest("[data-rar-set]"); if (s) save(s.dataset.rarSet, s.value); });
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-rar-auto]"); if (a) save(a.dataset.rarAuto, "auto"); });
})();
