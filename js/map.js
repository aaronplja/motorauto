/**
 * MOTORAUTO — carte des sorties : mini-carte « tuiles » OpenStreetMap faite maison (aucune bibliothèque), glisser pour déplacer,
 * molette / boutons pour zoomer, marqueurs cliquables. Les lieux sont géocodés (Nominatim) à la création de la sortie et mis en cache.
 */
(function () {
  "use strict";
  let C = null, view = "list", lastList = [], map = null, geoBusy = false;
  const TILE = "https://tile.openstreetmap.org/";
  const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const KIND = { circuit: "🏁", rassemblement: "🚗", balade: "🛣", autre: "📍" };

  // ------------------------------------------------------------------ géocodage (avec cache navigateur)
  const cacheGet = () => { try { return JSON.parse(localStorage.getItem("ma_geo") || "{}"); } catch (_) { return {}; } };
  const cacheSet = (c) => { try { localStorage.setItem("ma_geo", JSON.stringify(c)); } catch (_) { /* ignoré */ } };
  const key = (p) => String(p).trim().toLowerCase().slice(0, 120);
  async function geocode(place) {
    const k = key(place), c = cacheGet();
    if (k in c) return c[k];
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
      const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=fr&q=" + encodeURIComponent(place), { signal: ctl.signal, headers: { Accept: "application/json" } });
      clearTimeout(t);
      const j = await r.json(), hit = j && j[0] ? { lat: Math.round(Number(j[0].lat) * 1e5) / 1e5, lng: Math.round(Number(j[0].lon) * 1e5) / 1e5 } : null;
      c[k] = hit; cacheSet(c); return hit;
    } catch (_) { return null; }       // pas de réseau / bloqué : la sortie reste simplement sans pastille
  }

  // ------------------------------------------------------------------ mini-carte
  const SIZE = 256;
  const proj = (lat, lng, z) => { const s = SIZE * Math.pow(2, z), x = ((lng + 180) / 360) * s, sin = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180); return [x, (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s]; };
  const unproj = (x, y, z) => { const s = SIZE * Math.pow(2, z), n = Math.PI - (2 * Math.PI * y) / s; return [(180 / Math.PI) * Math.atan(Math.sinh(n)), (x / s) * 360 - 180]; };

  function createMap(el) {
    const m = { el, z: 5, cx: 0, cy: 0, markers: [], tiles: new Map(), popup: null };
    el.innerHTML = `<div class="mm-tiles"></div><div class="mm-markers"></div><div class="mm-ctl"><button type="button" data-mm="in" aria-label="Zoom avant">+</button><button type="button" data-mm="out" aria-label="Zoom arrière">−</button><button type="button" data-mm="loc" aria-label="Ma position" title="Centrer sur ma position">◎</button><button type="button" data-mm="full" aria-label="Plein écran" title="Plein écran">⤢</button></div><div class="mm-attr">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></div>`;
    m.tilesEl = el.querySelector(".mm-tiles"); m.markersEl = el.querySelector(".mm-markers");
    const setCenter = (lat, lng) => { const [x, y] = proj(lat, lng, m.z); m.cx = x; m.cy = y; };
    m.center = () => unproj(m.cx, m.cy, m.z);
    m.setView = (lat, lng, z) => { m.z = Math.max(2, Math.min(17, z)); setCenter(lat, lng); m.draw(); };
    m.zoom = (d) => { const [lat, lng] = m.center(); m.setView(lat, lng, m.z + d); };
    m.fit = (pts) => {
      if (!pts.length) { m.setView(46.6, 2.4, 5); return; }
      if (pts.length === 1) { m.setView(pts[0].lat, pts[0].lng, 11); return; }
      const w = el.clientWidth || 600, h = el.clientHeight || 400;
      for (let z = 12; z >= 2; z--) { const xs = pts.map((p) => proj(p.lat, p.lng, z)); const dx = Math.max(...xs.map((a) => a[0])) - Math.min(...xs.map((a) => a[0])), dy = Math.max(...xs.map((a) => a[1])) - Math.min(...xs.map((a) => a[1])); if (dx < w - 90 && dy < h - 90) { m.z = z; break; } m.z = z; }
      const la = pts.map((p) => p.lat), lo = pts.map((p) => p.lng); m.setView((Math.min(...la) + Math.max(...la)) / 2, (Math.min(...lo) + Math.max(...lo)) / 2, m.z);
    };
    m.draw = () => {
      const w = el.clientWidth || 600, h = el.clientHeight || 400, z = m.z, n = Math.pow(2, z);
      const x0 = Math.floor((m.cx - w / 2) / SIZE), x1 = Math.floor((m.cx + w / 2) / SIZE), y0 = Math.max(0, Math.floor((m.cy - h / 2) / SIZE)), y1 = Math.min(n - 1, Math.floor((m.cy + h / 2) / SIZE));
      const keep = new Set();
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        const k = z + "/" + x + "/" + y; keep.add(k);
        let t = m.tiles.get(k);
        if (!t) { t = document.createElement("img"); t.alt = ""; t.draggable = false; t.loading = "lazy"; t.className = "mm-tile"; t.src = TILE + z + "/" + (((x % n) + n) % n) + "/" + y + ".png"; t.onerror = () => { t.style.visibility = "hidden"; }; m.tilesEl.appendChild(t); m.tiles.set(k, t); }
        t.style.transform = `translate(${Math.round(x * SIZE - m.cx + w / 2)}px,${Math.round(y * SIZE - m.cy + h / 2)}px)`;
      }
      m.tiles.forEach((t, k) => { if (!keep.has(k)) { t.remove(); m.tiles.delete(k); } });
      m.markers.forEach((mk) => { const [px, py] = proj(mk.lat, mk.lng, z); mk.el.style.transform = `translate(${Math.round(px - m.cx + w / 2)}px,${Math.round(py - m.cy + h / 2)}px)`; });
      if (m.popup) m.placePopup();
    };
    m.setMarkers = (list) => {
      m.markers.forEach((mk) => mk.el.remove()); m.markers = []; m.closePopup();
      list.forEach((p) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "mm-pin" + (p.cls ? " " + p.cls : ""); if (p.img) { const im = document.createElement("img"); im.src = p.img; im.alt = ""; im.referrerPolicy = "no-referrer"; im.onerror = () => { im.remove(); b.textContent = "🧑"; }; b.appendChild(im); } else b.textContent = p.icon || "📍"; b.setAttribute("aria-label", p.label || "Sortie");
        b.addEventListener("click", (e) => { e.stopPropagation(); m.openPopup(p); });
        m.markersEl.appendChild(b); m.markers.push({ lat: p.lat, lng: p.lng, el: b });
      });
      m.draw();
    };
    m.openPopup = (p) => {
      m.closePopup();
      const d = document.createElement("div"); d.className = "mm-popup"; d.innerHTML = p.html; m.markersEl.appendChild(d);
      m.popup = { el: d, lat: p.lat, lng: p.lng }; m.placePopup();
    };
    m.placePopup = () => { const [px, py] = proj(m.popup.lat, m.popup.lng, m.z), w = el.clientWidth, h = el.clientHeight; m.popup.el.style.transform = `translate(${Math.round(px - m.cx + w / 2)}px,${Math.round(py - m.cy + h / 2)}px)`; };
    m.closePopup = () => { if (m.popup) { m.popup.el.remove(); m.popup = null; } };
    // interactions : glisser (souris / doigt), pincer pour zoomer (2 doigts), double-clic / double-tap pour zoomer
    const ptrs = new Map(); let drag = null, pinch = null, lastTap = 0;
    const dist = () => { const [a, b] = Array.from(ptrs.values()); return Math.hypot(a.x - b.x, a.y - b.y); };
    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".mm-pin, .mm-ctl, .mm-popup, a, .mm-bar")) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { el.setPointerCapture(e.pointerId); } catch (_) {}
      if (ptrs.size === 2) { pinch = { d: dist(), z: m.z }; drag = null; return; }
      drag = { x: e.clientX, y: e.clientY, cx: m.cx, cy: m.cy, moved: false }; el.classList.add("grab");
    });
    el.addEventListener("pointermove", (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && ptrs.size === 2) { const r = dist() / pinch.d; const dz = r > 1.35 ? 1 : r < 0.72 ? -1 : 0; if (dz) { m.zoom(dz); pinch = { d: dist(), z: m.z }; } return; }
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; m.cx = drag.cx - dx; m.cy = drag.cy - dy; m.draw();
    });
    const end = (e) => {
      ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (drag && !drag.moved && ptrs.size === 0) { const t = Date.now(); if (t - lastTap < 320) { const r = el.getBoundingClientRect(), w = el.clientWidth, h = el.clientHeight; const [lat, lng] = unproj(m.cx + (e.clientX - r.left - w / 2), m.cy + (e.clientY - r.top - h / 2), m.z); m.setView(lat, lng, m.z + 1); lastTap = 0; } else { lastTap = t; m.closePopup(); } }
      if (ptrs.size === 0) { drag = null; el.classList.remove("grab"); }
    };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    el.addEventListener("wheel", (e) => { e.preventDefault(); m.zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-mm]"); if (!b) return;
      const k = b.dataset.mm;
      if (k === "in" || k === "out") m.zoom(k === "in" ? 1 : -1);
      else if (k === "full") { el.classList.toggle("mm-full"); document.body.classList.toggle("mm-lock", el.classList.contains("mm-full")); b.textContent = el.classList.contains("mm-full") ? "✕" : "⤢"; setTimeout(() => m.draw(), 60); }
      else if (k === "loc") { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition((pos) => m.setView(pos.coords.latitude, pos.coords.longitude, Math.max(m.z, 10)), () => { if (C) C.toast("Position indisponible (autorisation refusée ?).", "err"); }, { timeout: 8000 }); }
    });
    el.addEventListener("keydown", (e) => { const s = 60; if (e.key === "+" || e.key === "=") m.zoom(1); else if (e.key === "-") m.zoom(-1); else if (e.key === "ArrowLeft") { m.cx -= s; m.draw(); } else if (e.key === "ArrowRight") { m.cx += s; m.draw(); } else if (e.key === "ArrowUp") { m.cy -= s; m.draw(); } else if (e.key === "ArrowDown") { m.cy += s; m.draw(); } });
    window.addEventListener("resize", () => m.draw(), { passive: true });
    return m;
  }

  // ------------------------------------------------------------------ position approximative des pilotes (opt-in)
  // pilot_locations/{uid} = { uid, name, avatar, city, lat, lng, updatedAt } : ville seulement, coordonnées arrondies + décalées (~5 km)
  let layers = { events: true, pilots: true }, kindOn = null, pilotsCache = { at: 0, list: [] };
  const fuzz = (v) => Math.round(v * 20) / 20 + (Math.random() - 0.5) * 0.03;
  async function myLocation() { if (!C || !C.user) return null; try { const d = await C.db.collection("pilot_locations").doc(C.user.uid).get(); return d.exists ? d.data() : null; } catch (_) { return null; } }
  async function saveMyLocation(city) {
    if (!C.user) throw new Error("Connecte-toi d'abord.");
    city = String(city || "").trim().slice(0, 80);
    if (city.length < 2) throw new Error("Indique ta ville.");
    const g = await geocode(city);
    if (!g) throw new Error("Ville introuvable (réseau bloqué ou nom incorrect).");
    const p = C.profile || {};
    await C.db.collection("pilot_locations").doc(C.user.uid).set({ uid: C.user.uid, name: String(C.pilotName ? C.pilotName() : p.username || "Pilote").slice(0, 40), avatar: String(p.avatar || "").slice(0, 400), city, lat: Math.round(fuzz(g.lat) * 1e4) / 1e4, lng: Math.round(fuzz(g.lng) * 1e4) / 1e4, updatedAt: C.FieldValue.serverTimestamp() });
    pilotsCache.at = 0; return city;
  }
  async function removeMyLocation() { if (!C.user) return; await C.db.collection("pilot_locations").doc(C.user.uid).delete(); pilotsCache.at = 0; }
  async function loadPilots() {
    if (Date.now() - pilotsCache.at < 30000) return pilotsCache.list;
    try { const s = await C.db.collection("pilot_locations").limit(500).get(); pilotsCache = { at: Date.now(), list: s.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng)) }; } catch (_) { pilotsCache = { at: Date.now(), list: [] }; }
    return pilotsCache.list;
  }
  const evQuery = (ev) => [ev.address, ev.city].filter(Boolean).join(", ") || ev.place;

  // ------------------------------------------------------------------ carte des sorties
  function barHtml() {
    const kinds = [["circuit", "🏁 Circuit"], ["rassemblement", "🚗 Rassemblement"], ["balade", "🛣 Balade"], ["autre", "📍 Autre"]];
    return `<div class="mm-bar" role="group" aria-label="Filtres de la carte"><button type="button" class="chip ${layers.events ? "on" : ""}" data-mm-layer="events">📅 Sorties</button><button type="button" class="chip ${layers.pilots ? "on" : ""}" data-mm-layer="pilots">🧑 Pilotes</button>${layers.events ? kinds.map(([k, l]) => `<button type="button" class="chip small ${!kindOn || kindOn === k ? "on" : ""}" data-mm-kind="${k}">${l}</button>`).join("") : ""}</div>`;
  }
  async function drawEvents() {
    const box = document.getElementById("events-map"); if (!box || view !== "map") return;
    const status = document.getElementById("events-map-status");
    const wrap = document.getElementById("events-map-wrap");
    let bar = document.getElementById("events-map-bar"); if (!bar) { bar = document.createElement("div"); bar.id = "events-map-bar"; wrap.insertBefore(bar, box); }
    bar.innerHTML = barHtml();
    const now = Date.now() - 6 * 3600 * 1000, list = layers.events ? lastList.filter((e) => e.dateMs >= now && (!kindOn || e.kind === kindOn)) : [];
    if (!map || !box.contains(map.el)) { box.innerHTML = `<div class="mm" tabindex="0" role="application" aria-label="Carte des sorties et des pilotes"></div>`; map = createMap(box.firstChild); }
    const pts = [], missing = [];
    list.forEach((ev) => { if (Number.isFinite(ev.lat) && Number.isFinite(ev.lng) && (ev.lat || ev.lng)) pts.push(ev); else { const c = cacheGet()[key(evQuery(ev))]; if (c) pts.push(Object.assign({}, ev, c)); else missing.push(ev); } });
    const pilots = layers.pilots ? await loadPilots() : [];
    if (view !== "map") return;
    const render = () => map.setMarkers(pts.map((ev) => { const d = new Date(ev.dateMs); return { lat: ev.lat, lng: ev.lng, icon: KIND[ev.kind] || "📍", label: ev.title,
      html: `<b>${C.esc(ev.title)}</b><small>${d.getDate()} ${MONTHS[d.getMonth()]} · ${C.esc([ev.place, ev.city].filter(Boolean).join(", "))}</small>${ev.address ? `<small>${C.esc(ev.address)}</small>` : ""}<a href="#/communaute/evenements" data-ev-list>Voir la sortie</a>` }; })
      .concat(pilots.map((p) => ({ lat: p.lat, lng: p.lng, cls: "pilot", img: C.safeUrl(p.avatar) || "", icon: "🧑", label: p.name || "Pilote", html: `<b>${C.esc(p.name || "Pilote")}</b><small>📍 ${C.esc(p.city || "")} (zone approximative)</small><a href="#/pilote/${encodeURIComponent(p.uid || p.id)}">Voir le profil</a>` }))));
    const all = pts.concat(pilots);
    if (!map.fitted) { map.fit(all); map.fitted = true; } render();
    const info = [list.length || layers.events ? `${pts.length} sortie${pts.length > 1 ? "s" : ""}` : "", layers.pilots ? `${pilots.length} pilote${pilots.length > 1 ? "s" : ""} (opt-in, position approximative)` : ""].filter(Boolean).join(" · ");
    status.textContent = (info || "Aucune couche affichée") + (missing.length ? " · localisation de " + missing.length + " autre" + (missing.length > 1 ? "s" : "") + "…" : "");
    if (missing.length && !geoBusy) {
      geoBusy = true;
      for (const ev of missing.slice(0, 8)) {
        const g = await geocode(evQuery(ev)) || (ev.city ? await geocode(ev.city) : null) || await geocode(ev.place);
        if (view !== "map") break;
        if (g) { pts.push(Object.assign({}, ev, g)); render(); }
        await new Promise((r) => setTimeout(r, 1100));          // Nominatim : 1 requête par seconde
      }
      geoBusy = false;
      status.textContent = `${pts.length} sortie${pts.length > 1 ? "s" : ""}${layers.pilots ? " · " + pilots.length + " pilote" + (pilots.length > 1 ? "s" : "") : ""}${pts.length < list.length ? " (certains lieux n'ont pas pu être localisés)" : ""}`;
    }
  }
  function setView(v) {
    view = v;
    document.querySelectorAll("[data-ev-view]").forEach((b) => { b.classList.toggle("active", b.dataset.evView === v); b.setAttribute("aria-selected", String(b.dataset.evView === v)); });
    const list = document.getElementById("events-list"), past = document.getElementById("events-past"), box = document.getElementById("events-map-wrap"), sw = document.querySelector(".ev-when");
    const showPast = past && past.dataset.show === "1";
    if (list) list.hidden = v === "map" || showPast; if (past) past.hidden = v === "map" || !showPast; if (sw) sw.hidden = v === "map"; if (box) box.hidden = v !== "map";
    if (v === "map") drawEvents();
  }

  window.MAMap = { geocode, createMap, myLocation, saveMyLocation, removeMyLocation, evQuery };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    document.addEventListener("ma:events-rendered", (e) => { lastList = e.detail.list; if (view === "map") drawEvents(); });
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ev-view]"); if (b) { setView(b.dataset.evView); return; }
      const ly = e.target.closest("[data-mm-layer]"); if (ly) { layers[ly.dataset.mmLayer] = !layers[ly.dataset.mmLayer]; drawEvents(); return; }
      const kd = e.target.closest("[data-mm-kind]"); if (kd) { kindOn = kindOn === kd.dataset.mmKind ? null : kd.dataset.mmKind; drawEvents(); return; }
      if (e.target.closest("[data-ev-list]")) { e.preventDefault(); setView("list"); }
    });
    ctx.Router.register("community", { enter: (p) => { if (p.tab === "evenements") setView(view); } });
  });
})();
