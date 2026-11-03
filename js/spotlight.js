/**
 * MOTORAUTO — recherche globale (Ctrl/Cmd + K ou loupe de la barre du haut) :
 * voitures du catalogue, pilotes, cartes du jeu et annonces dans une seule fenêtre, résultats groupés par type.
 */
(function () {
  "use strict";
  let C = null, layer = null, input = null, list = null, pilots = null, listings = null, sel = 0, flat = [], loading = null;
  const LIMIT = 6;
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  async function loadRemote() {
    if (loading) return loading;
    loading = (async () => {
      try { pilots = (await C.db.collection("users").limit(500).get()).docs.map((d) => ({ id: d.id, name: d.data().username || "Pilote", avatar: d.data().avatar || "" })); } catch (_) { pilots = []; }
      try { listings = (await C.db.collection("listings").where("status", "==", "open").limit(150).get()).docs.map((d) => Object.assign({ id: d.id }, d.data())); } catch (_) { listings = []; }
      if (layer && !layer.hidden) draw();
    })();
    return loading;
  }
  function results(q) {
    const n = norm(q), esc = C.esc, out = [];
    if (!n) return out;
    const has = (...a) => a.some((x) => norm(x).includes(n));
    const cars = (C.cars || []).filter((c) => has(c.brand + " " + c.model, c.years, c.category, c.searchBlob)).slice(0, LIMIT)
      .map((c) => ({ href: "#/voiture/" + encodeURIComponent(c.id), t: c.brand + " " + c.model, s: [c.years, c.category].filter(Boolean).join(" · "), img: c.image }));
    const pl = (pilots || []).filter((p) => has(p.name)).slice(0, LIMIT).map((p) => ({ href: "#/pilote/" + encodeURIComponent(p.id), t: p.name, s: "Pilote", img: p.avatar, round: true }));
    const sp = window.MACards && window.MACards.specials ? Array.from(window.MACards.specials().values()) : [];
    const mine = window.MACards && window.MACards.mine && window.MACards.mine() ? window.MACards.mine().owned || {} : {};
    const cards = sp.filter((s) => has(s.name, s.edition)).slice(0, 3).map((s) => ({ href: "#/jouer/collection", t: "✦ " + s.name, s: s.edition || "Édition limitée", img: s.image }))
      .concat((C.cars || []).filter((c) => mine[c.id] > 0 && has(c.brand + " " + c.model)).slice(0, 4).map((c) => ({ href: "#/jouer/collection", t: "🃏 " + c.brand + " " + c.model, s: "Dans ta collection", img: c.image })));
    const ads = (listings || []).filter((l) => has(l.title, l.desc, l.name)).slice(0, LIMIT).map((l) => ({ href: "#/annonces", t: l.title || "Annonce", s: (l.price ? l.price + " € · " : "") + (l.name || ""), img: Array.isArray(l.photos) ? l.photos[0] : l.photo }));
    [["Voitures", cars], ["Pilotes", pl], ["Cartes", cards], ["Annonces", ads]].forEach(([g, a]) => { if (a.length) out.push({ g, a }); });
    return out;
  }
  function draw() {
    const esc = C.esc, q = input.value.trim();
    flat = [];
    if (!q) { list.innerHTML = `<p class="spot-hint">Tape le nom d'une voiture, d'un pilote, d'une carte ou d'une annonce.<br><small>Astuce : Ctrl/Cmd + K ouvre la recherche partout.</small></p>`; return; }
    const groups = results(q);
    if (!groups.length) { list.innerHTML = `<p class="spot-hint">Rien trouvé pour « ${esc(q)} ».</p>`; return; }
    list.innerHTML = groups.map((g) => `<div class="spot-grp">${g.g}</div>` + g.a.map((r) => {
      const i = flat.push(r) - 1, im = C.safeUrl(r.img);
      return `<a class="spot-item${i === sel ? " on" : ""}" href="${esc(r.href)}" data-i="${i}">${im ? `<img src="${esc(im)}" alt="" loading="lazy" class="${r.round ? "round" : ""}" data-fallback="car">` : `<span class="spot-noimg"></span>`}<span><b>${esc(r.t)}</b><small>${esc(r.s)}</small></span></a>`;
    }).join("")).join("");
  }
  function open() {
    if (!layer) build();
    layer.hidden = false; document.documentElement.classList.add("spot-open"); sel = 0; input.value = ""; draw(); loadRemote();
    requestAnimationFrame(() => { layer.classList.add("on"); input.focus(); });
  }
  function close() { if (!layer) return; layer.classList.remove("on"); document.documentElement.classList.remove("spot-open"); setTimeout(() => { layer.hidden = true; }, 220); }
  function build() {
    layer = document.createElement("div"); layer.id = "spotlight"; layer.hidden = true; layer.setAttribute("role", "dialog"); layer.setAttribute("aria-modal", "true"); layer.setAttribute("aria-label", "Recherche");
    layer.innerHTML = `<div class="spot-box"><div class="spot-field"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" id="spot-q" placeholder="Rechercher voitures, pilotes, cartes, annonces…" autocomplete="off" enterkeyhint="search" aria-label="Recherche"><button type="button" class="spot-x" aria-label="Fermer">×</button></div><div class="spot-list" id="spot-list"></div></div>`;
    document.body.appendChild(layer);
    input = layer.querySelector("#spot-q"); list = layer.querySelector("#spot-list");
    input.addEventListener("input", () => { sel = 0; draw(); });
    layer.addEventListener("click", (e) => { if (e.target === layer || e.target.closest(".spot-x")) close(); else if (e.target.closest(".spot-item")) close(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, Math.min(flat.length - 1, sel + (e.key === "ArrowDown" ? 1 : -1))); draw(); const on = list.querySelector(".on"); if (on) on.scrollIntoView({ block: "nearest" }); }
      else if (e.key === "Enter" && flat[sel]) { location.hash = flat[sel].href; close(); }
    });
  }
  function addButton() {
    const host = document.querySelector(".header-actions"); if (!host || document.getElementById("spot-btn")) return;
    const b = document.createElement("button"); b.type = "button"; b.id = "spot-btn"; b.className = "icon-btn"; b.setAttribute("aria-label", "Rechercher"); b.title = "Rechercher (Ctrl/Cmd + K)";
    b.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;
    host.insertBefore(b, host.firstChild); b.addEventListener("click", open);
  }
  document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); layer && !layer.hidden ? close() : open(); } });
  (window.MAModules = window.MAModules || []).push(function (ctx) { C = ctx; addButton(); });
})();
