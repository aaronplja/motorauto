/**
 * MOTORAUTO — Campagne (#/campagne) : un globe interactif (ou une carte plate sur les appareils lents) où chaque pays est un chapitre.
 * Les épreuves d'un chapitre (quiz, batailles de cartes contre l'IA…) se jouent dans l'ordre ; chaque épreuve rapporte 1 à 3 étoiles.
 * Dessin : canvas 2D, projection orthographique faite à la main (aucune bibliothèque) ; fond de carte : js/game/world-geo.js (chargé à la demande).
 * Progression : localStorage + document Firestore campaign/{uid} (propre au pilote).
 */
(function () {
  "use strict";
  const D = window.MACampaignData;
  const RAD = Math.PI / 180, KEY = "ma.campaign.v1", MODE_KEY = "ma.campaign.mode";
  const FLAT_LAT = [84, -58];
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  let C = null, lastDraw = 0, done = {}, sel = "fr", mode = "globe", geo = null, geoLoading = null, pins = [], col = null;
  let view = { lon: 8, lat: 30, k: 1, fk: 1, fx: 0, fy: 13 }, vel = { x: 0, y: 0 }, tween = null, raf = 0, drag = null, active = false, idleAt = 0;

  // ------------------------------------------------------------------ progression
  function loadLocal() { try { const o = JSON.parse(localStorage.getItem(KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (_) { return {}; } }
  function merge(a, b) { const o = Object.assign({}, a); Object.keys(b || {}).forEach((k) => { const v = Number(b[k]) || 0; if (v > (o[k] || 0)) o[k] = Math.min(3, v); }); return o; }
  async function loadRemote() {
    if (!C || !C.user || !C.db) return;
    try { const s = await C.db.collection("campaign").doc(C.user.uid).get(); if (s.exists && s.data().done) { done = merge(done, s.data().done); saveLocal(); } } catch (_) { /* règles non publiées ou hors ligne : la progression reste sur l'appareil */ }
  }
  function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (_) { /* stockage refusé */ } }
  let saveTimer = 0;
  function save() {
    saveLocal(); clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { if (C && C.user && C.db) C.db.collection("campaign").doc(C.user.uid).set({ done, updatedAt: C.FieldValue.serverTimestamp() }).catch(() => {}); }, 800);
  }
  function award(trial, stars) {
    if (stars <= 0) return false;
    const was = done[trial.id] || 0;
    if (stars > was) { done[trial.id] = stars; save(); }
    return stars > was;
  }

  // ------------------------------------------------------------------ fond de carte
  function loadGeo() {
    if (geo) return Promise.resolve(geo);
    if (window.MAWorldGeo) { geo = window.MAWorldGeo; return Promise.resolve(geo); }
    if (!geoLoading) geoLoading = new Promise((ok, ko) => { const s = document.createElement("script"); s.src = "js/game/world-geo.js"; s.onload = () => { geo = window.MAWorldGeo || []; ok(geo); }; s.onerror = () => { geoLoading = null; ko(new Error("carte")); }; document.head.appendChild(s); });
    return geoLoading;
  }
  function colors() {
    const cs = getComputedStyle(document.documentElement), g = (n, f) => (cs.getPropertyValue(n) || "").trim() || f;
    col = { sea: g("--bg-elevated", "#1b2230"), ink: g("--color-ink", "#e5e7eb"), accent: g("--accent", "#2f9e6a"), line: g("--stroke-line", "rgba(255,255,255,.15)") };
  }

  // ------------------------------------------------------------------ projection et dessin
  const cv = () => document.getElementById("cp-canvas");
  function size() { const c = cv(); if (!c) return null; const r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2); const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr)); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return { c, w, h, dpr }; }
  /** globe : renvoie [x, y, visible] en pixels ; plat : [x, y, true] */
  function proj(lon, lat, S) {
    if (mode === "flat") { const ppd = (S.w / 360) * view.fk; return [S.w / 2 + (lon - view.fx) * ppd, S.h / 2 - (lat - view.fy) * ppd, true]; }
    const R = (Math.min(S.w, S.h) / 2) * 0.92 * view.k, l = (lon - view.lon) * RAD, p = lat * RAD, p0 = view.lat * RAD;
    const cp = Math.cos(p), x = cp * Math.sin(l), y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * cp * Math.cos(l), z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * cp * Math.cos(l);
    if (z >= 0) return [S.w / 2 + x * R, S.h / 2 - y * R, true];
    const n = Math.hypot(x, y) || 1;   // point caché : ramené sur le bord du globe
    return [S.w / 2 + (x / n) * R, S.h / 2 - (y / n) * R, false];
  }
  function ringPath(ctx, ring, S) {
    let any = false, first = true, px = 0;
    for (let i = 0; i < ring.length; i += 2) {
      const q = proj(ring[i], ring[i + 1], S); if (q[2]) any = true;
      if (mode === "flat" && !first && Math.abs(q[0] - px) > S.w * 0.5 * view.fk) { first = true; }   // anneau qui traverse l'antiméridien
      if (first) { ctx.moveTo(q[0], q[1]); first = false; } else ctx.lineTo(q[0], q[1]);
      px = q[0];
    }
    return any;
  }
  function draw() {
    const S = size(); if (!S) return;
    if (!col) colors();
    const ctx = S.c.getContext("2d"), { w, h, dpr } = S, globe = mode === "globe", R = (Math.min(w, h) / 2) * 0.92 * view.k;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (globe) {
      const g = ctx.createRadialGradient(w / 2 - R * 0.3, h / 2 - R * 0.35, R * 0.1, w / 2, h / 2, R);
      g.addColorStop(0, "rgba(255,255,255,.10)"); g.addColorStop(1, "rgba(0,0,0,.28)");
      ctx.beginPath(); ctx.arc(w / 2, h / 2, R, 0, 7); ctx.fillStyle = col.sea; ctx.fill(); ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(w / 2, h / 2, R, 0, 7); ctx.clip();
    } else { ctx.fillStyle = col.sea; ctx.fillRect(0, 0, w, h); }
    // quadrillage
    ctx.lineWidth = Math.max(1, dpr * 0.6); ctx.strokeStyle = col.ink; ctx.globalAlpha = 0.07;
    ctx.beginPath();
    for (let lo = -180; lo <= 180; lo += 30) { let f = true; for (let la = -80; la <= 84; la += 4) { const q = proj(lo, la, S); if (!q[2] && globe) { f = true; continue; } if (f) { ctx.moveTo(q[0], q[1]); f = false; } else ctx.lineTo(q[0], q[1]); } }
    for (let la = -60; la <= 80; la += 20) { let f = true; for (let lo = -180; lo <= 180; lo += 4) { const q = proj(lo, la, S); if (!q[2] && globe) { f = true; continue; } if (f) { ctx.moveTo(q[0], q[1]); f = false; } else ctx.lineTo(q[0], q[1]); } }
    ctx.stroke();
    // terres
    if (geo) {
      const by = {}; D.CHAPTERS.forEach((c) => { by[c.iso] = c; });
      for (const [iso, rings] of geo) {
        if (iso === "ATA") continue;
        const ch = by[iso], playable = ch && ch.trials.length > 0, isSel = ch && ch.id === sel;
        ctx.beginPath(); let any = false; for (const r of rings) any = ringPath(ctx, r, S) || any; if (!any) continue;
        ctx.globalAlpha = 1;
        if (ch) { ctx.fillStyle = ch.color; ctx.globalAlpha = isSel ? 0.85 : playable ? 0.55 : 0.3; }
        else { ctx.fillStyle = col.ink; ctx.globalAlpha = 0.17; }
        ctx.fill();
        ctx.globalAlpha = ch ? 0.9 : 0.3; ctx.strokeStyle = isSel ? col.accent : col.ink; ctx.lineWidth = Math.max(1, dpr * (isSel ? 1.6 : 0.6)); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (globe) ctx.restore();
    if (globe) { ctx.beginPath(); ctx.arc(w / 2, h / 2, R, 0, 7); ctx.strokeStyle = col.accent; ctx.globalAlpha = 0.5; ctx.lineWidth = dpr * 1.5; ctx.stroke(); ctx.globalAlpha = 1; }
    // épingles
    pins = [];
    D.CHAPTERS.forEach((ch) => {
      const q = proj(ch.lon, ch.lat, S); if (!q[2]) return;
      const isSel = ch.id === sel, playable = ch.trials.length > 0, fin = D.chapterDone(ch, done), r = dpr * (isSel ? 9 : 6.5);
      pins.push({ id: ch.id, x: q[0] / dpr, y: q[1] / dpr, r: Math.max(16, r / dpr + 8) });
      if (isSel) { const t = (performance.now() % 1600) / 1600; ctx.beginPath(); ctx.arc(q[0], q[1], r + t * dpr * 14, 0, 7); ctx.strokeStyle = ch.color; ctx.globalAlpha = 1 - t; ctx.lineWidth = dpr * 2; ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 7); ctx.fillStyle = fin ? "#f5c04a" : playable ? "#fff" : "rgba(255,255,255,.55)"; ctx.fill();
      ctx.lineWidth = dpr * 2.2; ctx.strokeStyle = ch.color; ctx.stroke();
      if (isSel) { ctx.font = `700 ${Math.round(dpr * 12)}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.fillStyle = col.ink; ctx.globalAlpha = 0.95; ctx.fillText(ch.name, q[0], q[1] - r - dpr * 7); ctx.globalAlpha = 1; }
    });
    ctx.restore();
  }

  /** carte plate : garde la zone visible à l'intérieur du planisphère */
  function clampFlat() {
    view.fk = Math.max(1, Math.min(10, view.fk));
    const hl = 180 / view.fk, ha = 71 / view.fk;
    view.fx = Math.max(-180 + hl, Math.min(180 - hl, view.fx));
    view.fy = Math.max(FLAT_LAT[1] + ha, Math.min(FLAT_LAT[0] - ha, view.fy));
  }
  /** zoom (facteur f) autour d'un point de l'écran (px CSS), pour la molette et le pincement */
  function zoomAt(f, cx, cy) {
    const c = cv(); if (!c) return;
    if (mode === "globe") { view.k = Math.max(0.8, Math.min(2.4, view.k * f)); return; }
    const w = c.clientWidth, h = c.clientHeight, ppd = (w / 360) * view.fk;
    const lon = view.fx + (cx - w / 2) / ppd, lat = view.fy - (cy - h / 2) / ppd;
    view.fk *= f; clampFlat();
    const n = (w / 360) * view.fk;
    view.fx = lon - (cx - w / 2) / n; view.fy = lat + (cy - h / 2) / n; clampFlat();
  }

  // ------------------------------------------------------------------ animation et gestes
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function frame(now) {
    raf = 0; if (!active || !cv()) return;
    let busy = false;
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.d), e = 1 - Math.pow(1 - k, 3);
      if (tween.flat) { view.fx = tween.l0 + tween.dl * e; view.fy = tween.a0 + tween.da * e; view.fk = tween.k0 + tween.dk * e; clampFlat(); }
      else { view.lon = tween.l0 + tween.dl * e; view.lat = tween.a0 + tween.da * e; view.k = tween.k0 + tween.dk * e; }
      if (k >= 1) tween = null; busy = true;
    } else if (mode === "flat") { busy = !!drag; }
    if (mode === "globe" && !tween) {
      if (!drag && (Math.abs(vel.x) > 0.01 || Math.abs(vel.y) > 0.01)) {
        view.lon -= vel.x; view.lat = Math.max(-70, Math.min(70, view.lat + vel.y)); vel.x *= 0.94; vel.y *= 0.94; busy = true;
      } else if (!drag && !reduce() && now - idleAt > 4000) { view.lon += 0.06; busy = true; }
      else busy = !!drag;
    }
    if (busy || now - lastDraw >= 66) { lastDraw = now; draw(); }   // au repos (seule l'épingle pulse) : environ 15 images par seconde
    // l'épingle choisie pulse : on garde la boucle active tant que la page est ouverte et visible
    if (!document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() { idleAt = performance.now(); if (!raf && active) raf = requestAnimationFrame(frame); }
  function flyTo(ch) {
    if (mode === "flat") { tween = { flat: true, t0: performance.now(), d: 700, l0: view.fx, dl: ch.lon - view.fx, a0: view.fy, da: ch.lat - view.fy, k0: view.fk, dk: Math.max(view.fk, 3) - view.fk }; kick(); return; }
    let dl = ((ch.lon - view.lon + 540) % 360) - 180;
    tween = { t0: performance.now(), d: 900, l0: view.lon, dl, a0: view.lat, da: Math.max(-60, Math.min(60, ch.lat * 0.8)) - view.lat, k0: view.k, dk: 1.7 - view.k }; kick();
  }
  function bindCanvas(c) {
    let moved = 0, last = null, pinch = 0; const ptrs = new Map();
    c.addEventListener("pointerdown", (e) => { c.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } drag = { x: e.clientX, y: e.clientY }; last = { x: e.clientX, y: e.clientY, t: e.timeStamp }; moved = 0; vel.x = vel.y = 0; tween = null; colors(); kick(); });
    c.addEventListener("pointermove", (e) => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) {   // pincement : zoom
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = c.getBoundingClientRect();
        if (pinch > 0 && d > 0) zoomAt(d / pinch, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
        pinch = d; moved += 20; last = { x: e.clientX, y: e.clientY, t: e.timeStamp }; kick(); return;
      }
      if (!drag) return;
      if (mode === "flat") {   // carte plate : on fait glisser la carte
        const dx = e.clientX - last.x, dy = e.clientY - last.y; moved += Math.abs(dx) + Math.abs(dy);
        const ppd = (c.clientWidth / 360) * view.fk; view.fx -= dx / ppd; view.fy += dy / ppd; clampFlat();
        last = { x: e.clientX, y: e.clientY, t: e.timeStamp }; kick(); return;
      }
      const dx = e.clientX - last.x, dy = e.clientY - last.y; moved += Math.abs(dx) + Math.abs(dy);
      const R = (Math.min(c.clientWidth, c.clientHeight) / 2) * 0.92 * view.k, f = 1 / (R * RAD) * 1.0;
      view.lon -= dx * f; view.lat = Math.max(-70, Math.min(70, view.lat + dy * f));
      vel.x = dx * f * 0.9; vel.y = dy * f * 0.9; last = { x: e.clientX, y: e.clientY, t: e.timeStamp }; kick();
    });
    const up = (e) => {
      ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0;
      if (!drag) return; drag = null; idleAt = performance.now();
      if (moved < 6) { const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; const hit = pins.map((p) => ({ p, d: Math.hypot(p.x - x, p.y - y) })).filter((o) => o.d <= o.p.r).sort((a, b) => a.d - b.d)[0]; if (hit) select(hit.p.id); }
      kick();
    };
    c.addEventListener("pointerup", up); c.addEventListener("pointercancel", (e) => { ptrs.delete(e.pointerId); drag = null; });
    c.addEventListener("wheel", (e) => { e.preventDefault(); const r = c.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); kick(); }, { passive: false });
    c.addEventListener("dblclick", (e) => { if (mode !== "flat") return; const r = c.getBoundingClientRect(); zoomAt(1.8, e.clientX - r.left, e.clientY - r.top); kick(); });
    c.addEventListener("keydown", (e) => { const i = D.CHAPTERS.findIndex((x) => x.id === sel), n = D.CHAPTERS.length; if (e.key === "ArrowRight" || e.key === "ArrowDown") { select(D.CHAPTERS[(i + 1) % n].id); e.preventDefault(); } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { select(D.CHAPTERS[(i - 1 + n) % n].id); e.preventDefault(); } });
  }

  // ------------------------------------------------------------------ panneau du chapitre
  const star = (on) => `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z" fill="${on ? "#f5c04a" : "none"}" stroke="${on ? "#f5c04a" : "currentColor"}" stroke-width="1.6" stroke-linejoin="round" opacity="${on ? 1 : 0.4}"/></svg>`;
  const ICO = {
    vf: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
    guess: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    pm: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/></svg>',
    old: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.7"/><path d="M12 17h.01"/></svg>',
    battle: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="10" height="14" rx="2" transform="rotate(-12 8 12)"/><rect x="11" y="5" width="10" height="14" rx="2" transform="rotate(12 16 12)"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
  };
  function panel() {
    const el = document.getElementById("cp-panel"); if (!el) return;
    const ch = D.byId(sel); if (!ch) { el.innerHTML = ""; return; }
    const e = C.esc, total = ch.trials.length * 3, got = D.chapterStars(ch, done);
    const head = `<header class="cp-head"><span class="cp-dot" style="--c:${ch.color}"></span><div><h2>${e(T(ch.name))}</h2><small>${e(ch.era)}</small></div>${ch.trials.length ? `<span class="cp-total" title="${T("Étoiles obtenues")}">${star(true)}<b>${got}</b> / ${total}</span>` : ""}</header><p class="cp-blurb">${e(ch.blurb)}</p>`;
    if (!ch.trials.length) { el.innerHTML = head + `<div class="cp-soon">${ICO.lock}<div><b>${T("Chapitre bientôt disponible")}</b><small>${T("Les épreuves arrivent dans une prochaine mise à jour.")}</small></div></div>`; return; }
    const nx = D.canPlay(ch, done) ? D.nextTrial(ch, done) : -1, cur = D.current(done), lockedBy = cur && cur.id !== ch.id ? cur : null;
    el.innerHTML = head + `${lockedBy ? `<p class="cp-lockmsg">${T("Termine d'abord ton histoire en cours")} : <b>${e(T(lockedBy.name))}</b>.</p>` : ""}<ol class="cp-trials">${ch.trials.map((t, i) => {
      const s = done[t.id] || 0, open = D.unlocked(ch, i, done) && D.canPlay(ch, done);
      return `<li><button type="button" class="cp-trial${s ? " done" : ""}${i === nx ? " next" : ""}${open ? "" : " locked"}${t.boss ? " boss" : ""}" data-trial="${e(t.id)}" ${open ? "" : "disabled"}>
        <i class="cp-ti" aria-hidden="true">${open ? ICO[t.type] : ICO.lock}</i>
        <span class="cp-tt"><b>${e(t.title)}</b><small>${e(t.sub)}</small></span>
        <span class="cp-stars" role="img" aria-label="${s} / 3">${[1, 2, 3].map((n) => star(n <= s)).join("")}</span></button></li>`;
    }).join("")}</ol>${D.chapterDone(ch, done) ? `<p class="cp-win">${T("Chapitre terminé : bravo !")}</p>` : ""}`;
    const nb = el.querySelector(".cp-trial.next"), ls = el.querySelector(".cp-trials");
    if (nb && ls && ls.scrollHeight > ls.clientHeight) ls.scrollTop = Math.max(0, nb.offsetTop - ls.offsetTop - 8);
  }
  function select(id) {
    const ch = D.byId(id); if (!ch) return;
    sel = id; panel(); flyTo(ch); kick();
    const t = document.getElementById("cp-panel"); if (t && window.matchMedia && matchMedia("(max-width: 800px)").matches) t.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "nearest" });
  }

  // ------------------------------------------------------------------ épreuves
  const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const pick = (a, n) => shuffle(a).slice(0, n);
  function play(trial) {
    const pc = D.CHAPTERS.find((c) => c.trials.includes(trial)); if (pc && !D.canPlay(pc, done)) { C.toast("Termine d'abord l'histoire en cours.", "err"); return; }
    if (trial.type === "battle") {
      if (!window.MABattle) { C.toast("La bataille n'est pas disponible pour l'instant.", "err"); return; }
      const ch = pc || D.byId(sel), G = window.MAGameCore, cfg = D.battleSetup(ch, trial);
      Promise.resolve(C.catReady).catch(() => 0).then(() => {
        const pool = (C.cars || []).filter((c) => G && G.countryOf(c.brand) === ch.id);
        const lvl = cfg.skill < 0.2 ? T("facile") : cfg.skill < 0.4 ? T("moyenne") : cfg.skill < 0.55 ? T("forte") : T("redoutable");
        window.MABattle.open({
          camp: () => ({ pool, skill: cfg.skill, bias: cfg.bias, note: `${T(ch.name)} · ${T("IA")} ${lvl} · ${T("3 manches, cartes du chapitre")}` }),
          onEnd: (r) => {
            const s = D.battleStars(r.me, r.ai), fresh = award(trial, s); panel();
            return s ? `${"★".repeat(s)}${"☆".repeat(3 - s)} · ${fresh ? T("Épreuve validée") : T("Victoire")}` : T("Pas cette fois : retente ta chance !");
          }
        });
      });
      return;
    }
    runItems(trial, () => makeItems(trial));
  }
  /** questions d'une épreuve ; renvoie null si le catalogue ne permet pas de la tirer */
  function makeItems(trial) {
    if (trial.type === "quiz") return trial.qs.map((q) => ({ q: q.q, opts: shuffle(q.a.map((t, i) => ({ t, good: i === 0 }))) }));
    if (trial.type === "vf") return shuffle(trial.items).map((it) => ({ q: it.q, opts: [{ t: T("Vrai"), good: it.ok }, { t: T("Faux"), good: !it.ok }] }));
    const G = window.MAGameCore; if (!G || !Array.isArray(C.cars)) return null;
    const url = (c) => C.safeUrl ? C.safeUrl(c.image) : "";
    const pool = C.cars.filter((c) => c && c.image && url(c) && G.countryOf(c.brand) === trial.country);
    const label = (c) => (c.brand + " " + c.model).trim();
    if (trial.type === "guess") {
      const names = Array.from(new Set(pool.map(label))); if (pool.length < 8 || names.length < 8) return null;
      return pick(pool, 5).map((c) => {
        const wrong = pick(names.filter((n) => n !== label(c)), 3);
        return { q: T("Quelle est cette voiture ?"), img: url(c), opts: shuffle([{ t: label(c), good: true }].concat(wrong.map((t) => ({ t, good: false })))) };
      });
    }
    const key = trial.type === "pm" ? (c) => Number(c.stats && c.stats.power) || 0 : (c) => G.yearOf(c) || 0;
    const ok = pool.filter((c) => key(c) > 0); if (ok.length < 10) return null;
    const better = trial.type === "pm" ? (x, y) => x > y : (x, y) => x < y;
    const near = trial.type === "pm" ? (x, y) => Math.max(x, y) / Math.min(x, y) < 1.25 : (x, y) => Math.abs(x - y) < 10;
    const out = [], used = new Set();
    for (let tries = 0; tries < 400 && out.length < 5; tries++) {
      const [x, y] = pick(ok, 2); if (!x || !y || used.has(x.id) || used.has(y.id) || near(key(x), key(y))) continue;
      used.add(x.id); used.add(y.id);
      const w = better(key(x), key(y)) ? x : y, show = (c) => trial.type === "pm" ? key(c) + " ch" : String(key(c));
      out.push({ q: trial.type === "pm" ? T("Laquelle est la plus puissante ?") : T("Laquelle est la plus ancienne ?"), pic: true,
        opts: shuffle([x, y].map((c) => ({ t: label(c), img: url(c), good: c === w, reveal: show(c) }))) });
    }
    return out.length === 5 ? out : null;
  }
  async function runItems(trial, make) {
    if (trial.type !== "quiz" && trial.type !== "vf") { try { await C.catReady; } catch (_) { /* catalogue partiel */ } }
    const qs = make();
    if (!qs || !qs.length) { C.toast("Le catalogue n'est pas prêt : réessaie dans un instant.", "err"); return; }
    const e = C.esc;
    let items = qs, i = 0, ok = 0, locked = false;
    const ov = document.createElement("div");
    ov.className = "cp-run"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", trial.title);
    document.body.appendChild(ov); document.body.classList.add("tcg-open");
    const close = () => { document.removeEventListener("keydown", onKey); ov.remove(); document.body.classList.remove("tcg-open"); panel(); };
    const onKey = (ev) => { if (ev.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const view = () => {
      if (i >= items.length) {
        const s = D.quizStars(ok, items.length), fresh = award(trial, s);
        ov.innerHTML = `<div class="cp-card cp-end"><h3>${s ? T("Épreuve validée !") : T("Pas tout à fait…")}</h3><div class="cp-bigstars">${[1, 2, 3].map((n) => star(n <= s)).join("")}</div>
          <p>${ok} / ${items.length} ${T("bonnes réponses")}${s ? "" : " · " + T("il en faut au moins") + " " + Math.ceil(items.length * 0.6)}${fresh && s ? " · " + T("nouveau record") : ""}</p>
          <div class="cp-actions"><button type="button" class="cta-btn fill-btn" data-cp="close">${T("Continuer")}</button><button type="button" class="cta-btn btn-ghost" data-cp="again">${T("Rejouer")}</button></div></div>`;
        return;
      }
      const q = items[i], pic = !!q.pic;
      ov.innerHTML = `<div class="cp-card"><div class="cp-qhead"><span>${C.esc(trial.title)}</span><span>${i + 1} / ${items.length}</span></div><div class="xp-bar small"><i style="width:${Math.round((i / items.length) * 100)}%"></i></div>
        <h3 class="cp-q">${e(q.q)}</h3>${q.img ? `<img class="cp-qimg" src="${e(q.img)}" alt="" draggable="false">` : ""}
        <div class="cp-opts${pic ? " pics" : ""}">${q.opts.map((o, k) => `<button type="button" class="cp-opt${pic ? " pic" : ""}" data-k="${k}">${o.img ? `<img src="${e(o.img)}" alt="" draggable="false">` : ""}<span>${e(o.t)}</span>${o.reveal ? `<em hidden>${e(o.reveal)}</em>` : ""}</button>`).join("")}</div>
        <div class="cp-actions"><button type="button" class="cta-btn btn-ghost" data-cp="close">${T("Quitter")}</button></div></div>`;
      locked = false;
    };
    ov.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-cp],[data-k]"); if (!b) return;
      if (b.dataset.cp === "close") { close(); return; }
      if (b.dataset.cp === "again") { const n = make(); if (n) items = n; i = 0; ok = 0; view(); return; }
      if (locked || i >= items.length) return;
      locked = true; const q = items[i], k = Number(b.dataset.k);
      ov.querySelectorAll(".cp-opt").forEach((n, j) => { n.disabled = true; const r = n.querySelector("em"); if (r) r.hidden = false; if (q.opts[j].good) n.classList.add("good"); else if (j === k) n.classList.add("bad"); });
      if (q.opts[k].good) ok++;
      setTimeout(() => { if (!ov.isConnected) return; i++; view(); }, q.pic ? 1500 : 900);
    });
    view();
    const f = ov.querySelector(".cp-opt"); if (f) f.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------ page
  function setMode(m) {
    mode = m; tween = null; try { localStorage.setItem(MODE_KEY, m); } catch (_) { /* ignoré */ }
    const wrap = document.getElementById("cp-stage"); if (wrap) wrap.dataset.mode = m;
    const hint = document.getElementById("cp-hint"); if (hint) hint.textContent = m === "globe" ? T("Fais tourner le globe, touche une épingle pour choisir un chapitre.") : T("Pince ou molette pour zoomer, glisse pour te déplacer, touche une épingle pour choisir un chapitre.");
    document.querySelectorAll("[data-cpmode]").forEach((b) => { const on = b.dataset.cpmode === m; b.classList.toggle("active", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    kick();
  }
  function shell() {
    const root = document.getElementById("campaign-root"); if (!root) return;
    const total = D.CHAPTERS.reduce((s, c) => s + c.trials.length * 3, 0), got = D.CHAPTERS.reduce((s, c) => s + D.chapterStars(c, done), 0);
    root.innerHTML = `<div class="cp-layout">
      <section class="cp-stage-wrap" aria-label="${T("Carte du monde")}">
        <div class="cp-bar"><div class="seg-switch" role="group" aria-label="${T("Affichage")}"><button type="button" class="seg-btn" data-cpmode="globe" aria-pressed="false">${T("Globe")}</button><button type="button" class="seg-btn" data-cpmode="flat" aria-pressed="false">${T("Carte plate")}</button></div>
        <span class="cp-global">${star(true)} <b>${got}</b> / ${total}</span></div>
        <div class="cp-stage" id="cp-stage" data-mode="${mode}"><canvas id="cp-canvas" tabindex="0" role="img" aria-label="${T("Globe interactif : touche une épingle pour ouvrir un chapitre")}"></canvas><div class="cp-zoom" role="group" aria-label="${T("Zoom")}"><button type="button" data-cpz="in" aria-label="${T("Zoom avant")}">+</button><button type="button" data-cpz="out" aria-label="${T("Zoom arrière")}">&minus;</button><button type="button" data-cpz="reset" aria-label="${T("Réinitialiser le zoom")}">&#8634;</button></div><p class="cp-load" id="cp-load">${T("Chargement de la carte…")}</p></div>
        <p class="cp-hint" id="cp-hint"></p>
      </section>
      <section class="cp-side" id="cp-panel" aria-live="polite"></section></div>`;
    bindCanvas(cv());
    root.addEventListener("click", (ev) => {
      const m = ev.target.closest("[data-cpmode]"); if (m) { setMode(m.dataset.cpmode); return; }
      const z = ev.target.closest("[data-cpz]");
      if (z) { const c = cv(), w = c.clientWidth / 2, h = c.clientHeight / 2; if (z.dataset.cpz === "reset") { view.k = 1; view.fk = 1; view.fx = 0; view.fy = 13; tween = null; } else zoomAt(z.dataset.cpz === "in" ? 1.5 : 1 / 1.5, w, h); kick(); return; }
      const t = ev.target.closest("[data-trial]"); if (!t) return;
      const ch = D.byId(sel), trial = ch && ch.trials.find((x) => x.id === t.dataset.trial); if (trial) play(trial);
    });
    setMode(mode); panel();
    loadGeo().then(() => { const l = document.getElementById("cp-load"); if (l) l.remove(); kick(); }).catch(() => { const l = document.getElementById("cp-load"); if (l) l.textContent = T("Carte indisponible : les chapitres restent accessibles ci-dessous."); });
  }
  function enter() {
    active = true; done = merge(loadLocal(), done);
    let m = null; try { m = localStorage.getItem(MODE_KEY); } catch (_) { /* ignoré */ }
    const slow = (navigator.connection && navigator.connection.saveData) || (navigator.hardwareConcurrency || 4) <= 2;
    mode = m === "flat" || m === "globe" ? m : slow || reduce() ? "flat" : "globe";
    colors(); shell(); kick();
    if (mode === "globe") { const ch = D.byId(sel); if (ch) { view.lon = ch.lon - 40; view.lat = 20; view.k = 1; flyTo(ch); } }
    loadRemote().then(() => { if (active) { panel(); const g = document.querySelector(".cp-global"); if (g) { const total = D.CHAPTERS.reduce((s, c) => s + c.trials.length * 3, 0); g.innerHTML = `${star(true)} <b>${D.CHAPTERS.reduce((s, c) => s + D.chapterStars(c, done), 0)}</b> / ${total}`; } } });
  }
  function leave() { active = false; if (raf) cancelAnimationFrame(raf); raf = 0; const r = document.getElementById("campaign-root"); if (r) r.innerHTML = ""; }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  window.addEventListener("resize", () => { if (active) kick(); });
  window.addEventListener("ma:theme", () => { col = null; kick(); });

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("campaign", { enter, leave });
  });
})();
