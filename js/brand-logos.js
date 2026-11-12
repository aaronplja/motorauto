/**
 * MOTORAUTO — logos de marques : remplace les initiales (pastilles des cartes et du bandeau des marques) par le logo
 * quand assets/brands/<marque>.svg existe (voir scripts/brand-logos.js). Le logo est un masque : il prend la couleur du thème.
 * Chaque fichier est testé directement (sans liste) ; sans logo, les initiales restent.
 * Les logos ajoutés par lien depuis l'admin (« Logos de marques », Firestore config/brand_logos) s'affichent en pastille claire avec l'image en couleurs ;
 * ils passent avant le fichier du site.
 */
(function () {
  "use strict";
  const known = new Map();   // nom -> Promise<boolean>
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const url = (k) => new URL("assets/brands/" + k + ".svg", document.baseURI).href;
  function exists(k) {
    if (!known.has(k)) known.set(k, new Promise((ok) => { const i = new Image(); i.onload = () => ok(true); i.onerror = () => ok(false); i.src = url(k); }));
    return known.get(k);
  }
  /** « Peugeot Sport » -> peugeotsport puis peugeot ; « Nissan / Datsun » -> nissan ; « Mercedes-Benz » -> mercedesbenz */
  let remote = {}, remoteReady = null;
  const keyOf = (brand) => norm(String(brand || "").split(/\s*[\/&]\s*/)[0]);
  function load(force) {
    if (!force && remoteReady) return remoteReady;
    remoteReady = (async () => {
      for (let i = 0; i < 40 && !(window.MAApp && window.MAApp.ctx && window.MAApp.ctx().db); i++) await new Promise((r) => setTimeout(r, 250));
      try { const s = await window.MAApp.ctx().db.collection("config").doc("brand_logos").get(); remote = s.exists && s.data().map ? Object.assign({}, s.data().map) : {}; } catch (_) { /* règle absente ou hors ligne : on garde les logos du site */ }
      return remote;
    })();
    return remoteReady;
  }
  function setRemote(m) { remote = Object.assign({}, m || {}); remoteReady = Promise.resolve(remote); reset(); }
  /** « Peugeot Sport » -> peugeotsport puis peugeot ; « Nissan / Datsun » -> nissan ; « Mercedes-Benz » -> mercedesbenz */
  /** noms de fichiers présents dans assets/brands (index.json), pour retrouver « astonmartin » à partir de la famille « Aston » */
  let fileKeys = null;
  function loadFileKeys() {
    if (!fileKeys) fileKeys = fetch(new URL("assets/brands/index.json", document.baseURI).href).then((r) => (r.ok ? r.json() : [])).then((l) => (Array.isArray(l) ? l : [])).catch(() => []);
    return fileKeys;
  }
  /** le catalogue regroupe les marques par premier mot (« Alfa », « Aston », « Auto ») : si rien ne correspond exactement, on prend l'unique logo dont le nom commence par ce mot */
  const onlyStart = (list, k) => { const m = list.filter((x) => x.indexOf(k) === 0); return m.length === 1 ? m[0] : ""; };
  async function nameFor(brand) {
    await load();
    const words = String(brand || "").split(/\s*[\/&]\s*/)[0].trim().split(/\s+/).filter(Boolean);
    for (let n = words.length; n >= 1; n--) { const k = norm(words.slice(0, n).join(" ")); if (k && remote[k]) return { k, remote: remote[k] }; }
    for (let n = words.length; n >= 1; n--) { const k = norm(words.slice(0, n).join(" ")); if (k && await exists(k)) return { k }; }
    const w = norm(words[0]);
    if (w.length >= 3) {
      const r = onlyStart(Object.keys(remote), w); if (r && remote[r]) return { k: r, remote: remote[r] };
      const f = onlyStart(await loadFileKeys(), w); if (f && await exists(f)) return { k: f };
    }
    return null;
  }
  async function one(el) {
    const host = el.closest(".car-brand-name, .bs-chip, .bs-item, button, a") || el.parentElement; if (!host) return;
    const own = el.textContent;
    const brand = host.dataset.brand || host.dataset.b || host.textContent.replace(own, "");
    const f = await nameFor(brand);
    if (!f) return;
    if (f.remote && /^https:\/\//i.test(f.remote)) { el.classList.add("has-logo-img"); el.style.setProperty("--logo-img", 'url("' + f.remote.replace(/["\\]/g, "") + '")'); el.textContent = ""; return; }
    el.classList.add("has-logo"); el.style.setProperty("--logo", 'url("' + url(f.k) + '")'); el.textContent = "";
  }
  /** après un changement de logos : on remet à zéro les pastilles pour les recalculer (les initiales d'origine sont dans data-ini) */
  function reset() {
    document.querySelectorAll(".brand-dot[data-bl], .bs-ini[data-bl]").forEach((el) => {
      if (el.dataset.ini != null) { el.classList.remove("has-logo", "has-logo-img"); el.style.removeProperty("--logo"); el.style.removeProperty("--logo-img"); el.textContent = el.dataset.ini; }
      delete el.dataset.bl;
    });
    apply();
  }
  function apply() {
    document.querySelectorAll(".brand-dot:not([data-bl]), .bs-ini:not([data-bl])").forEach((el) => { el.dataset.bl = "1"; if (el.dataset.ini == null) el.dataset.ini = el.textContent; one(el); });
  }
  window.MABrandLogos = { key: keyOf, load, setRemote };
  function start() {
    apply();
    let t = 0; new MutationObserver(() => { if (t) return; t = setTimeout(() => { t = 0; apply(); }, 120); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
