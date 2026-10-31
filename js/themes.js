/**
 * MOTORAUTO — thème personnalisé (fond + accent au choix) et thèmes saisonniers.
 * Quelle que soit la couleur choisie, la lisibilité est garantie : le texte, les bordures et l'accent sont recalculés
 * pour respecter des contrastes minimaux (texte 7:1, texte discret 4,6:1, accent 3,2:1 sur le fond).
 * Les ambiances de saison (Halloween, Noël, Nouvel an) se posent PAR-DESSUS l'ambiance du pilote : elles n'en changent
 * que des détails (ornement, filet d'en-tête, mot-clé du titre, particules) avec une couleur elle aussi recalculée pour rester lisible.
 */
(function () {
  "use strict";
  const KEY = "motorauto_custom_theme", root = typeof document !== "undefined" ? document.documentElement : { style: { setProperty() {}, removeProperty() {} }, setAttribute() {} };
  const VARS = ["--bg-core", "--bg-surface", "--bg-elevated", "--stroke-line", "--line", "--color-ink", "--color-secondary", "--color-muted", "--accent", "--on-accent", "--header-bg", "--glow", "--glow-soft", "--shadow-pop"];
  const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* ignoré */ } } };
  const doc = typeof document !== "undefined" ? document : null;

  // ------------------------------------------------------------------ couleurs
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const hex2rgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim()); if (!m) return null; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb2hex = (c) => "#" + c.map((x) => clamp(x).toString(16).padStart(2, "0")).join("");
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);          // t = part de b
  const rgba = (c, a) => `rgba(${clamp(c[0])},${clamp(c[1])},${clamp(c[2])},${a})`;
  const DARK = [11, 13, 18], WHITE = [255, 255, 255];
  /** rapproche fg du noir ou du blanc (selon le fond) jusqu'au contraste demandé */
  function ensure(fg, bg, min) {
    const toward = contrast(bg, [0, 0, 0]) >= contrast(bg, WHITE) ? [0, 0, 0] : WHITE;
    let c = fg.slice();
    for (let i = 0; i < 30 && contrast(c, bg) < min; i++) c = mix(c, toward, 0.1);
    return contrast(c, bg) >= min ? c : toward;
  }
  function derive(bgHex, accHex) {
    const bg = hex2rgb(bgHex) || [9, 9, 11], acc0 = hex2rgb(accHex) || [239, 68, 68];
    let ink = contrast(bg, DARK) >= contrast(bg, WHITE) ? DARK : WHITE;
    if (contrast(bg, ink) < 4.8) ink = contrast(bg, [0, 0, 0]) >= contrast(bg, [255, 255, 255]) ? [0, 0, 0] : [255, 255, 255];   // gris moyens : noir/blanc purs
    const light = ink === DARK;
    const surface = mix(bg, ink, 0.05), elevated = mix(bg, ink, 0.1);
    const secondary = ensure(mix(ink, bg, 0.26), bg, 7), muted = ensure(mix(ink, bg, 0.46), bg, 4.6);
    const accent = ensure(acc0, bg, 3.2), onAccent = contrast(accent, WHITE) >= contrast(accent, [0, 0, 0]) ? "#ffffff" : "#000000";
    return {
      scheme: light ? "light" : "dark", bg, accent,
      vars: {
        "--bg-core": rgb2hex(bg), "--bg-surface": rgb2hex(surface), "--bg-elevated": rgb2hex(elevated),
        "--stroke-line": rgba(ink, light ? 0.13 : 0.14), "--line": rgba(ink, light ? 0.13 : 0.14),
        "--color-ink": rgb2hex(ink), "--color-secondary": rgb2hex(secondary), "--color-muted": rgb2hex(muted),
        "--accent": rgb2hex(accent), "--on-accent": onAccent, "--header-bg": rgba(surface, 0.88),
        "--glow": rgba(accent, 0.38), "--glow-soft": rgba(accent, 0.14), "--shadow-pop": light ? "0 30px 60px -30px rgba(30,40,60,.35)" : "0 30px 70px -28px rgba(0,0,0,.85)"
      },
      ratio: { text: contrast(ink, bg), muted: contrast(muted, bg), accent: contrast(accent, bg), onAccent: contrast(onAccent === "#ffffff" ? [255, 255, 255] : [0, 0, 0], accent) }
    };
  }

  // ------------------------------------------------------------------ thème personnalisé
  const DEFAULT = { bg: "#0f172a", accent: "#38bdf8" };
  function getCustom() { try { const o = JSON.parse(store.get(KEY) || "null"); if (o && hex2rgb(o.bg) && hex2rgb(o.accent)) return o; } catch (_) { /* ignoré */ } return Object.assign({}, DEFAULT); }
  function clear() { VARS.forEach((v) => root.style.removeProperty(v)); root.style.removeProperty("color-scheme"); }
  function applyCustom(c) {
    c = c || getCustom(); const d = derive(c.bg, c.accent);
    VARS.forEach((v) => root.style.setProperty(v, d.vars[v])); root.style.setProperty("color-scheme", d.scheme);
    const meta = doc && doc.querySelector('meta[name="theme-color"]'); if (meta) meta.content = d.vars["--bg-core"];
    return d;
  }
  function setCustom(c) { store.set(KEY, JSON.stringify({ bg: c.bg, accent: c.accent })); store.set("motorauto_theme", "custom"); if (window.MA && MA.applyTheme) MA.applyTheme("custom"); else { root.setAttribute("data-theme", "custom"); applyCustom(c); } }
  const code = (c) => ("MA-" + String(c.bg).replace("#", "") + "-" + String(c.accent).replace("#", "")).toUpperCase();
  function parse(s) { const m = /^MA-([0-9A-F]{6})-([0-9A-F]{6})$/i.exec(String(s || "").trim()); return m ? { bg: "#" + m[1].toLowerCase(), accent: "#" + m[2].toLowerCase() } : null; }

  // ------------------------------------------------------------------ saisons
  const SEASONS = {
    halloween: { label: "Halloween", from: [10, 27], to: [11, 2], color: "#ff7a1a", color2: "#8b5cf6" },
    noel: { label: "Noël", from: [12, 2], to: [12, 28], color: "#e5392d", color2: "#2fa66a" },
    nouvelan: { label: "Nouvel an", from: [12, 29], to: [1, 3], color: "#f5c542", color2: "#7dd3fc" }
  };
  function parisParts() {
    try { const p = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", month: "numeric", day: "numeric" }).formatToParts(new Date()); return { m: +p.find((x) => x.type === "month").value, d: +p.find((x) => x.type === "day").value }; }
    catch (_) { const n = new Date(); return { m: n.getMonth() + 1, d: n.getDate() }; }
  }
  const md = (m, d) => m * 100 + d;
  function seasonNow(dateParts) {
    const t = dateParts || parisParts(), v = md(t.m, t.d);
    for (const k of ["nouvelan", "halloween", "noel"]) {            // nouvel an passe avant Noël le 29 décembre
      const s = SEASONS[k], a = md(s.from[0], s.from[1]), b = md(s.to[0], s.to[1]);
      if (a <= b ? v >= a && v <= b : v >= a || v <= b) return k;
    }
    return null;
  }

  const api = { derive, getCustom, setCustom, applyCustom, clear, code, parse, contrast, hex2rgb, rgb2hex, mix, ensure, lum, SEASONS, seasonNow, DEFAULT };
  if (typeof module === "object" && module.exports) module.exports = api; else window.MATheme = api;
})();
