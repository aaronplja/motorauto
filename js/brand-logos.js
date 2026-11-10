/**
 * MOTORAUTO — logos de marques : remplace les initiales (pastilles des cartes et du bandeau des marques) par le logo
 * quand assets/brands/<marque>.svg existe (voir scripts/brand-logos.js). Le logo est un masque : il prend la couleur du thème.
 * Chaque fichier est testé directement (sans liste) ; sans logo, les initiales restent.
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
  async function nameFor(brand) {
    const words = String(brand || "").split(/\s*[\/&]\s*/)[0].trim().split(/\s+/).filter(Boolean);
    for (let n = words.length; n >= 1; n--) { const k = norm(words.slice(0, n).join(" ")); if (k && await exists(k)) return k; }
    return "";
  }
  async function one(el) {
    const host = el.closest(".car-brand-name, .bs-chip, .bs-item, button, a") || el.parentElement; if (!host) return;
    const own = el.textContent;
    const brand = host.dataset.brand || host.dataset.b || host.textContent.replace(own, "");
    const k = await nameFor(brand);
    if (!k) return;
    el.classList.add("has-logo"); el.style.setProperty("--logo", 'url("' + url(k) + '")'); el.textContent = "";
  }
  function apply() {
    document.querySelectorAll(".brand-dot:not([data-bl]), .bs-ini:not([data-bl])").forEach((el) => { el.dataset.bl = "1"; one(el); });
  }
  function start() {
    apply();
    let t = 0; new MutationObserver(() => { if (t) return; t = setTimeout(() => { t = 0; apply(); }, 120); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
