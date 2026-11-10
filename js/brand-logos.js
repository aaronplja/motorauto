/**
 * MOTORAUTO — logos de marques : remplace les initiales (pastilles des cartes et du bandeau des marques) par le logo
 * quand assets/brands/<marque>.svg existe (liste dans assets/brands/index.json, produite par scripts/brand-logos.js).
 * Le logo est un masque : il prend la couleur du thème. Sans logo, les initiales restent.
 */
(function () {
  "use strict";
  let have = null, loading = null;
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  function load() {
    if (have) return Promise.resolve(have);
    if (!loading) loading = fetch("assets/brands/index.json", { cache: "default" }).then((r) => (r.ok ? r.json() : [])).catch(() => []).then((a) => { have = new Set(a); return have; });
    return loading;
  }
  /** « Peugeot Sport » -> peugeotsport, sinon peugeot ; « Nissan / Datsun » -> nissan ; « Mercedes-Benz » -> mercedesbenz */
  function nameFor(brand) {
    const words = String(brand || "").split(/\s*[\/&]\s*/)[0].trim().split(/\s+/);
    for (let n = words.length; n >= 1; n--) { const k = norm(words.slice(0, n).join(" ")); if (have.has(k)) return k; }
    return "";
  }
  function apply(root) {
    if (!have || !have.size) return;
    (root || document).querySelectorAll(".brand-dot:not([data-bl]), .bs-ini:not([data-bl])").forEach((el) => {
      el.dataset.bl = "1";
      const host = el.closest(".car-brand-name, .bs-item, .bs-chip, button, a") || el.parentElement;
      const brand = (host && (host.dataset.brand || host.dataset.b || host.textContent)) || "";
      const k = nameFor(el.classList.contains("bs-ini") ? (host.dataset.brand || host.dataset.b || host.textContent.replace(el.textContent, "")) : brand.replace(el.textContent, ""));
      if (!k) return;
      el.classList.add("has-logo"); el.style.setProperty("--logo", 'url("' + new URL("assets/brands/" + k + ".svg", document.baseURI).href + '")'); el.textContent = "";
    });
  }
  function start() {
    load().then(() => {
      apply(document);
      let t = 0; new MutationObserver(() => { if (t) return; t = setTimeout(() => { t = 0; apply(document); }, 120); }).observe(document.body, { childList: true, subtree: true });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
