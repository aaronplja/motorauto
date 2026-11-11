/**
 * MOTORAUTO — « Ma carte pilote » : ta propre carte à collectionner (pseudo, photo, niveau, titre, chiffres clés, meilleures cartes),
 * générée dans le navigateur, avec le logo MOTORAUTO, à enregistrer ou partager comme image.
 * Bouton « 🪪 Ma carte pilote » à côté de « Progression » dans l'onglet Collection.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  if (!G) return;
  let C = null, busy = false;
  const M = () => window.MACards;
  const css = (n, d) => (getComputedStyle(document.documentElement).getPropertyValue(n) || "").trim() || d;
  const loadImg = (src) => new Promise((res) => { if (!src) return res(null); const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const cover = (ctx, img, x, y, w, h) => { const s = Math.max(w / img.width, h / img.height), sw = w / s, sh = h / s; ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h); };
  const fit = (ctx, text, max) => { let t = String(text); while (t.length > 3 && ctx.measureText(t).width > max) t = t.slice(0, -2); return t === String(text) ? t : t + "…"; };
  const RC = { common: "#94a3b8", rare: "#3b82f6", epic: "#a855f7", legendary: "#f59e0b", shiny: "#ff7ad9", mythic: "#fde047", special: "#fbbf24" };

  function facts() {
    const doc = M().mine(), uid = C.user.uid, owned = (doc && doc.owned) || {}, cars = M().pool();
    const have = cars.filter((c) => (owned[c.id] || 0) > 0), best = have.slice().sort((a, b) => G.ORDER.indexOf(M().rarityOf(a)) - G.ORDER.indexOf(M().rarityOf(b)) || (b.stats.power - a.stats.power)).slice(0, 3);
    let lvl = null; try { lvl = window.MAGame.levelOf(window.MAGame.statsOf(uid).xp).level; } catch (_) { /* facultatif */ }
    const cosm = window.MACosm ? window.MACosm.get(uid) : {}, bt = (doc && doc.bt) || {};
    const high = have.filter((c) => ["legendary", "shiny", "mythic"].indexOf(M().rarityOf(c)) >= 0).length;
    return { name: (C.profile && C.profile.username) || (C.user.displayName) || "Pilote", avatar: (C.profile && C.profile.avatar) || "", total: have.length, of: cars.length, high, wins: Number(bt.w) || 0, streak: Number(bt.best) || 0, best, lvl, frame: cosm.frame && G.FRAMES[cosm.frame] ? G.FRAMES[cosm.frame] : null, title: cosm.title && G.TITLES[cosm.title] ? G.TITLES[cosm.title].name : "", dream: (window.MAProfileExtra && window.MAProfileExtra.mine().dreamCar) || "", city: (window.MAProfileExtra && window.MAProfileExtra.mine().city) || "" };
  }
  async function draw() {
    const f = facts(), W = 1080, H = 1500, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"), accent = css("--accent", "#ef4444"), ring = f.frame ? f.frame.color : accent;
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b0f19"); g.addColorStop(1, "#1f2937"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 14; ctx.strokeStyle = ring; rr(ctx, 60, 60, W - 120, H - 120, 40); ctx.stroke();
    ctx.fillStyle = ring; ctx.globalAlpha = .14; ctx.beginPath(); ctx.arc(W / 2, 470, 330, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    // photo
    const img = await loadImg(f.avatar), cx = W / 2, cy = 470, R = 250;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    if (img) cover(ctx, img, cx - R, cy - R, R * 2, R * 2); else { ctx.fillStyle = "#111827"; ctx.fillRect(cx - R, cy - R, R * 2, R * 2); ctx.fillStyle = "#4b5563"; ctx.font = "800 260px system-ui"; ctx.textAlign = "center"; ctx.fillText(f.name.charAt(0).toUpperCase(), cx, cy + 90); }
    ctx.restore(); ctx.lineWidth = 16; ctx.strokeStyle = ring; ctx.beginPath(); ctx.arc(cx, cy, R + 4, 0, 7); ctx.stroke();
    // badge niveau
    if (f.lvl) { ctx.fillStyle = accent; rr(ctx, cx - 130, cy + R - 40, 260, 70, 35); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "800 34px system-ui"; ctx.textAlign = "center"; ctx.fillText("NIVEAU " + f.lvl.n, cx, cy + R + 8); }
    // pseudo + titre
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "800 84px system-ui"; ctx.fillText(fit(ctx, f.name, W - 200), cx, 850);
    if (f.title) { ctx.fillStyle = ring; ctx.font = "700 38px system-ui"; ctx.fillText(fit(ctx, f.title, W - 200), cx, 905); }
    const sub = [f.dream ? "Voiture de rêve : " + f.dream : "", f.city ? "📍 " + f.city : ""].filter(Boolean).join("  ·  ");
    if (sub) { ctx.fillStyle = "#9ca3af"; ctx.font = "500 30px system-ui"; ctx.fillText(fit(ctx, sub, W - 220), cx, 950); }
    // chiffres
    const stats = [[f.total + " / " + f.of, "CARTES"], [String(f.high), "LÉGENDAIRES +"], [String(f.wins), "VICTOIRES"]];
    stats.forEach((s, i) => { const x = 180 + i * 360; ctx.fillStyle = "#fff"; ctx.font = "800 64px system-ui"; ctx.fillText(s[0], x, 1060); ctx.fillStyle = "#9ca3af"; ctx.font = "600 26px system-ui"; ctx.fillText(s[1], x, 1105); });
    // meilleures cartes
    ctx.textAlign = "left"; ctx.fillStyle = "#9ca3af"; ctx.font = "700 26px system-ui"; ctx.fillText("MES MEILLEURES CARTES", 120, 1180);
    f.best.forEach((c, i) => { const y = 1228 + i * 56; ctx.fillStyle = RC[M().rarityOf(c)] || "#94a3b8"; ctx.beginPath(); ctx.arc(136, y - 10, 11, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "600 34px system-ui"; ctx.fillText(fit(ctx, (c.brand + " " + String(c.model).replace(/\s*\(.*$/, "")), 820), 166, y); });
    // logo MOTORAUTO
    ctx.font = "800 34px system-ui"; const w1 = ctx.measureText("MOTOR").width, w2 = ctx.measureText("AUTO").width, x0 = W / 2 - (w1 + w2) / 2;
    ctx.fillStyle = "#fff"; ctx.fillText("MOTOR", x0, H - 90); ctx.fillStyle = accent; ctx.fillText("AUTO", x0 + w1, H - 90);
    ctx.textAlign = "center"; ctx.fillStyle = "#9ca3af"; ctx.font = "500 22px system-ui"; ctx.fillText("motorauto.fr", W / 2, H - 62);
    return { cv, name: f.name };
  }
  const T = (s) => (window.MAI18n && window.MAI18n.t ? window.MAI18n.t(s) : s);
  async function open() {
    if (busy || !C || !C.user || !M() || !M().mine()) return; busy = true;
    try {
      const { cv, name } = await draw(), url = cv.toDataURL("image/png");
      const o = document.createElement("div"); o.className = "tcg-overlay on"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", T("Ma carte pilote"));
      o.innerHTML = `<div class="tcg-stage"><div class="pk3" style="text-align:center"><h2>🪪 ${T("Ma carte pilote")}</h2><img alt="${T("Ma carte pilote")}" src="${url}" style="max-width:min(86vw,380px);max-height:62vh;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.5)">
        <div class="tcg-actions"><button type="button" class="cta-btn fill-btn" data-share>${T("Partager / enregistrer")}</button><button type="button" class="cta-btn btn-ghost" data-x>${T("Fermer")}</button></div></div></div>`;
      document.body.appendChild(o); document.body.classList.add("tcg-open");
      const close = () => { o.remove(); document.body.classList.remove("tcg-open"); document.removeEventListener("keydown", k); }, k = (e) => { if (e.key === "Escape") close(); };
      document.addEventListener("keydown", k);
      o.addEventListener("click", async (e) => {
        if (e.target === o || e.target.closest("[data-x]")) return close();
        if (e.target.closest("[data-share]")) { const blob = await new Promise((r) => cv.toBlob(r, "image/png")); if (window.MAShare) window.MAShare.shareBlob(blob, "carte-pilote-" + name.replace(/[^\w-]+/g, "_") + ".png", T("Ma carte pilote MOTORAUTO")); }
      });
    } catch (e) { C.toast("Impossible de créer l'image (photo non autorisée ?). Réessaie.", "err"); }
    finally { busy = false; }
  }
  function inject() {
    const root = document.getElementById("cards-root"); if (!root || root.querySelector("[data-pcard]")) return;
    const anchor = root.querySelector("[data-cplus]") || root.querySelector(".cg-recycle");
    if (anchor) { const b = document.createElement("button"); b.type = "button"; b.className = "cg-recycle"; b.dataset.pcard = "1"; b.textContent = "🪪 Ma carte pilote"; b.addEventListener("click", open); anchor.insertAdjacentElement("beforebegin", b); }
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx; let q = 0;
    new MutationObserver(() => { if (q) return; q = requestAnimationFrame(() => { q = 0; inject(); }); }).observe(document.body, { childList: true, subtree: true }); inject();
  });
  window.MAPilotCard = { open, draw };
})();
