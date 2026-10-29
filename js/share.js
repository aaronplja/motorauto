/**
 * MOTORAUTO — partage : liens avec aperçu (pages statiques voiture/<id>.html et circuit/…), et images générées
 * (carte à collectionner, résultat de duel, jauge de ma voiture). Tout se fait dans le navigateur, sans serveur.
 */
(function () {
  "use strict";
  let C = null;
  const origin = () => (location.protocol.startsWith("http") ? location.origin : "https://motorauto.fr");

  async function shareLink(title, text, url) {
    document.dispatchEvent(new CustomEvent("ma:shared"));
    try {
      if (navigator.share) { await navigator.share({ title, text, url }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); C.toast("Lien copié : colle-le sur Instagram, WhatsApp ou Discord.", "ok"); }
    catch (_) { window.prompt("Copie ce lien :", url); }
  }
  const carUrl = (id) => origin() + "/voiture/" + encodeURIComponent(id) + ".html";

  async function shareBlob(blob, name, title) {
    const file = new File([blob], name, { type: "image/png" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    C.toast("Image enregistrée : partage-la où tu veux.", "ok");
  }
  function loadImg(src) {
    return new Promise((res) => {
      if (!src) return res(null);
      const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
    });
  }
  function toBlob(cv) { return new Promise((r) => cv.toBlob(r, "image/png")); }
  const css = (n, d) => (getComputedStyle(document.documentElement).getPropertyValue(n) || "").trim() || d;
  function cover(ctx, img, x, y, w, h) {
    const k = Math.max(w / img.width, h / img.height), sw = w / k, sh = h / k;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function brand(ctx, W, H, accent) {
    ctx.font = "800 34px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; const t1 = "MOTOR", t2 = "AUTO";
    const w1 = ctx.measureText(t1).width, w2 = ctx.measureText(t2).width, x = W / 2 - (w1 + w2) / 2;
    ctx.textAlign = "left"; ctx.fillText(t1, x, H - 46); ctx.fillStyle = accent; ctx.fillText(t2, x + w1, H - 46);
    ctx.textAlign = "center"; ctx.fillStyle = "#9ca3af"; ctx.font = "500 22px system-ui, sans-serif"; ctx.fillText("motorauto.fr", W / 2, H - 16);
  }

  // ------------------------------------------------------------------ carte à collectionner
  async function shareCard(car, rarityLabel, no) {
    const W = 1080, H = 1500, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"), accent = css("--accent", "#ef4444");
    const rc = { Commune: "#94a3b8", Rare: "#3b82f6", "Épique": "#a855f7", "Légendaire": "#f59e0b", "Édition limitée": "#fbbf24" }[rarityLabel] || accent;
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b0f19"); g.addColorStop(1, "#1f2937"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 14; ctx.strokeStyle = rc; rr(ctx, 70, 70, W - 140, H - 280, 36); ctx.stroke();
    ctx.save(); rr(ctx, 84, 84, W - 168, 700, 28); ctx.clip();
    const img = await loadImg(C.safeUrl(car.image));
    if (img) cover(ctx, img, 84, 84, W - 168, 700); else { ctx.fillStyle = "#111827"; ctx.fillRect(84, 84, W - 168, 700); }
    ctx.restore();
    ctx.fillStyle = rc; rr(ctx, 110, 110, 260, 60, 30); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "800 30px system-ui"; ctx.textAlign = "center"; ctx.fillText(rarityLabel.toUpperCase(), 240, 150);
    ctx.textAlign = "right"; ctx.fillText("#" + String(no).padStart(3, "0"), W - 110, 150);
    ctx.textAlign = "left"; ctx.fillStyle = "#9ca3af"; ctx.font = "700 34px system-ui"; ctx.fillText(String(car.brand).toUpperCase(), 120, 870);
    ctx.fillStyle = "#fff"; ctx.font = "800 64px system-ui"; ctx.fillText(String(car.model).replace(/\s*\(.*$/, "").slice(0, 26), 120, 950);
    const stats = [[car.stats.power, "ch"], [car.stats.speed, "km/h"], [car.stats.zero || "—", "0-100 s"]];
    stats.forEach((s, i) => { const x = 120 + i * 290; ctx.fillStyle = "#fff"; ctx.font = "800 84px system-ui"; ctx.fillText(String(s[0]), x, 1100); ctx.fillStyle = "#9ca3af"; ctx.font = "600 30px system-ui"; ctx.fillText(s[1], x, 1145); });
    ctx.fillStyle = "#9ca3af"; ctx.font = "500 28px system-ui"; ctx.fillText(`${car.years || ""} · ${car.category || ""}`, 120, 1230);
    brand(ctx, W, H, accent);
    shareBlob(await toBlob(cv), "carte-" + car.id + ".png", car.brand + " " + car.model);
  }

  // ------------------------------------------------------------------ résultat d'un duel
  async function duelImage(r) {
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"), accent = css("--accent", "#ef4444");
    ctx.fillStyle = "#0b0f19"; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "800 54px system-ui"; ctx.fillText("DUEL · " + ({ "100": "0 → 100 km/h", "200": "0 → 200 km/h", "400": "400 m D.A.", "1000": "1000 m D.A." }[r.mode] || "400 m D.A."), W / 2, 120);
    const imgs = await Promise.all([r.a, r.b].map((c) => loadImg(C.safeUrl(c.image))));
    [r.a, r.b].forEach((c, i) => {
      const x = 60 + i * 500, win = r.win === i;
      ctx.save(); rr(ctx, x, 190, 460, 330, 28); ctx.clip(); if (imgs[i]) cover(ctx, imgs[i], x, 190, 460, 330); else { ctx.fillStyle = "#1f2937"; ctx.fillRect(x, 190, 460, 330); } ctx.restore();
      ctx.lineWidth = 8; ctx.strokeStyle = win ? "#fbbf24" : "#374151"; rr(ctx, x, 190, 460, 330, 28); ctx.stroke();
      ctx.fillStyle = "#9ca3af"; ctx.font = "700 28px system-ui"; ctx.fillText(String(c.brand).toUpperCase(), x + 230, 580);
      ctx.fillStyle = "#fff"; ctx.font = "800 40px system-ui"; ctx.fillText(String(c.model).replace(/\s*\(.*$/, "").slice(0, 20), x + 230, 635);
      ctx.fillStyle = win ? "#fbbf24" : "#fff"; ctx.font = "900 120px system-ui"; ctx.fillText((i === 0 ? r.tA : r.tB).toFixed(2).replace(".", ","), x + 230, 800);
      ctx.fillStyle = "#9ca3af"; ctx.font = "600 34px system-ui"; ctx.fillText("secondes", x + 230, 850);
      if (win) { ctx.fillStyle = "#fbbf24"; ctx.font = "800 44px system-ui"; ctx.fillText("🏆 GAGNANT", x + 230, 930); }
    });
    ctx.fillStyle = accent; ctx.font = "900 70px system-ui"; ctx.fillText("VS", W / 2, 380);
    const gap = Math.abs(r.tA - r.tB);
    ctx.fillStyle = "#fff"; ctx.font = "700 44px system-ui"; ctx.fillText(r.win < 0 ? "Égalité parfaite" : `${gap.toFixed(2).replace(".", ",")} s d'écart`, W / 2, 1070);
    ctx.fillStyle = "#6b7280"; ctx.font = "500 24px system-ui"; ctx.fillText("Simulation : boîte, adhérence, aéro, poids (estimation)", W / 2, 1130);
    brand(ctx, W, H, accent);
    shareBlob(await toBlob(cv), "duel.png", "Duel MOTORAUTO");
  }

  // ------------------------------------------------------------------ jauge de ma voiture
  async function gaugeImage(car, name, owner) {
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"), accent = css("--accent", "#ef4444");
    ctx.fillStyle = "#0b0f19"; ctx.fillRect(0, 0, W, H);
    const pw = Number(car.power) || 0, z = Number(car.zero) || 0, maxP = 700;
    const cx = W / 2, cy = 560, R = 380, a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, ang = a0 + (a1 - a0) * Math.min(1, pw / maxP);
    ctx.lineCap = "round"; ctx.lineWidth = 34; ctx.strokeStyle = "#1f2937"; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
    ctx.strokeStyle = accent; ctx.beginPath(); ctx.arc(cx, cy, R, a0, ang); ctx.stroke();
    ctx.lineWidth = 8; ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * (R - 90), cy + Math.sin(ang) * (R - 90)); ctx.lineTo(cx + Math.cos(ang) * (R + 30), cy + Math.sin(ang) * (R + 30)); ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 190px system-ui"; ctx.fillText(String(pw || "—"), cx, cy + 40);
    ctx.fillStyle = "#9ca3af"; ctx.font = "700 44px system-ui"; ctx.fillText("chevaux", cx, cy + 105);
    ctx.fillStyle = "#fff"; ctx.font = "800 54px system-ui"; ctx.fillText(String(name || "Ma voiture").slice(0, 28), cx, 1010);
    ctx.fillStyle = "#9ca3af"; ctx.font = "600 38px system-ui"; ctx.fillText(owner ? "Garage de " + owner : "", cx, 1065);
    if (z) { ctx.fillStyle = accent; ctx.font = "800 56px system-ui"; ctx.fillText("0-100 en " + String(z).replace(".", ",") + " s", cx, 1160); }
    brand(ctx, W, H, accent);
    shareBlob(await toBlob(cv), "ma-voiture.png", name || "Ma voiture");
  }

  window.MAShare = { shareLink, carUrl, shareBlob, shareCard, duelImage, gaugeImage, origin };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    // bouton « Partager » sur la fiche voiture (lien vers la page statique avec aperçu)
    document.addEventListener("ma:car-rendered", (e) => {
      const car = e.detail.car, anchor = document.getElementById("sheet-compare-btn");
      if (!anchor || document.getElementById("sheet-share-btn")) return;
      const b = document.createElement("button"); b.type = "button"; b.id = "sheet-share-btn"; b.className = "cta-btn btn-ghost compact-btn"; b.textContent = "↗ Partager";
      b.addEventListener("click", () => shareLink(car.brand + " " + car.model, `${car.brand} ${car.model} : ${car.stats.power} ch, ${car.stats.speed} km/h — fiche MOTORAUTO`, carUrl(car.id)));
      anchor.insertAdjacentElement("afterend", b);
      const d = document.createElement("a"); d.className = "cta-btn btn-ghost compact-btn"; d.id = "sheet-duel-btn"; d.href = "#/duel/" + encodeURIComponent(car.id) + "/" + encodeURIComponent(C.cars.find((c) => c.id !== car.id && Math.abs(c.stats.power - car.stats.power) < 40 && c.category === car.category)?.id || C.cars[0].id); d.textContent = "🏁 Duel";
      b.insertAdjacentElement("afterend", d);
    });
  });
})();
