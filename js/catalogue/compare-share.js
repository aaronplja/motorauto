/**
 * MOTORAUTO — comparateur partageable : lien #/comparer/a,b,c qui rouvre la comparaison, et image de partage (PNG 1200×630) pour les réseaux.
 */
(function () {
  "use strict";
  let C = null;
  const ids = (cars) => cars.map((c) => c.id);
  const link = (cars) => location.origin + location.pathname + "#/comparer/" + ids(cars).map(encodeURIComponent).join(",");
  const eng = (c) => (c.phases || []).flatMap((p) => p.engines || []);
  const ROWS = [["Puissance", "ch", (c) => c.stats.power, 1], ["Couple", "Nm", (c) => Math.max(0, ...eng(c).map((e) => e.torque || 0)), 1], ["Vitesse max", "km/h", (c) => c.stats.speed, 1], ["0 à 100", "s", (c) => c.stats.zero || 0, -1]];

  function loadImg(src) { return new Promise((res) => { if (!src) return res(null); const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; setTimeout(() => res(null), 4000); }); }
  async function makeImage(cars) {
    const W = 1200, H = 630, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d"), css = getComputedStyle(document.documentElement), accent = (css.getPropertyValue("--accent") || "#ef4444").trim() || "#ef4444";
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#0b0b10"); bg.addColorStop(1, "#16161f"); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.fillStyle = accent; x.globalAlpha = .14; x.beginPath(); x.arc(W - 120, -40, 360, 0, 7); x.fill(); x.globalAlpha = 1;
    x.fillStyle = accent; x.fillRect(0, 0, 10, H);
    x.fillStyle = "#fff"; x.font = "800 26px system-ui, sans-serif"; x.fillText("MOTORAUTO", 56, 62);
    x.fillStyle = "#9ca3af"; x.font = "600 22px system-ui, sans-serif"; x.fillText("Comparateur", 220, 62);
    const imgs = await Promise.all(cars.map((c) => loadImg(c.image)));
    const n = cars.length, colW = (W - 112) / n, top = 100;
    cars.forEach((c, i) => {
      const cx = 56 + i * colW, w = colW - 24;
      x.fillStyle = "rgba(255,255,255,.05)"; x.beginPath(); x.roundRect(cx, top, w, 470, 20); x.fill();
      if (imgs[i]) { x.save(); x.beginPath(); x.roundRect(cx, top, w, 170, [20, 20, 0, 0]); x.clip(); const r = Math.max(w / imgs[i].width, 170 / imgs[i].height); x.drawImage(imgs[i], cx + (w - imgs[i].width * r) / 2, top + (170 - imgs[i].height * r) / 2, imgs[i].width * r, imgs[i].height * r); x.restore(); }
      x.fillStyle = accent; x.font = "700 18px system-ui, sans-serif"; x.fillText(String(c.brand).toUpperCase().slice(0, 22), cx + 20, top + 205);
      x.fillStyle = "#fff"; x.font = "800 " + (n === 3 ? 24 : 30) + "px system-ui, sans-serif"; x.fillText(String(c.model).replace(/\s*\(.*$/, "").slice(0, n === 3 ? 20 : 26), cx + 20, top + 240);
      ROWS.forEach(([l, u, get, dir], r) => {
        const vals = cars.map(get), valid = vals.filter((v) => v > 0), best = valid.length > 1 ? (dir > 0 ? Math.max(...valid) : Math.min(...valid)) : null, v = get(c), y = top + 290 + r * 46;
        x.fillStyle = "#9ca3af"; x.font = "600 17px system-ui, sans-serif"; x.fillText(l, cx + 20, y);
        x.fillStyle = best !== null && v === best ? accent : "#fff"; x.font = "800 26px system-ui, sans-serif"; x.textAlign = "right"; x.fillText(v > 0 ? v + " " + u : "—", cx + w - 20, y + 2); x.textAlign = "left";
      });
    });
    x.fillStyle = "#6b7280"; x.font = "600 18px system-ui, sans-serif"; x.fillText("motorauto.fr", 56, H - 22);
    return new Promise((res) => cv.toBlob(res, "image/png"));
  }
  async function shareImage(cars) {
    const blob = await makeImage(cars); if (!blob) throw new Error("image impossible");
    const file = new File([blob], "comparaison-motorauto.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "Comparaison MOTORAUTO", url: link(cars) }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function copy(cars) {
    const u = link(cars);
    try { if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) { await navigator.share({ title: "Comparaison MOTORAUTO", url: u }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(u); C.toast("Lien copié.", "ok"); } catch (_) { window.prompt("Copie ce lien :", u); }
  }
  let cur = [];
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    document.addEventListener("ma:compare-opened", (e) => {
      cur = e.detail.cars || []; const host = document.getElementById("compare-content"); if (!host || host.querySelector(".cmp-share")) return;
      host.insertAdjacentHTML("afterbegin", `<div class="cmp-share"><button type="button" class="cta-btn fill-btn compact-btn" data-cmp-link>Copier le lien</button><button type="button" class="cta-btn btn-ghost compact-btn" data-cmp-img>Image pour les réseaux</button></div>`);
    });
    document.addEventListener("click", async (e) => {
      if (e.target.closest("[data-cmp-link]")) copy(cur);
      else if (e.target.closest("[data-cmp-img]")) { try { C.toast("Création de l'image…", "ok"); await shareImage(cur); } catch (x) { C.toast("Image impossible : " + x.message, "err"); } }
      else if (e.target.closest("#close-compare-modal") && ctx.Router.is("compare")) ctx.Router.go("/catalogue");
    });
    ctx.Router.register("compare", { enter: async (p) => {
      await ctx.catReady; const list = String(p.ids || "").split(",").filter(Boolean).slice(0, 3);
      if (window.MAApp && window.MAApp.compareWith) window.MAApp.compareWith(list);
    } });
  });
})();
