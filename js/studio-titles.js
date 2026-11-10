/**
 * MOTORAUTO — Studio : le dernier mot des titres de page passe en italique vert (style de la maquette).
 * Seulement en français (les traductions travaillent sur le texte brut) et jamais sur les titres qui contiennent
 * un nom saisi par un pilote ou un nom de circuit (id listés dans SKIP).
 */
(function () {
  "use strict";
  const SKIP = new Set(["pub-profile-name", "garage-pilot-name", "circuit-title", "legal-title"]);
  const isFr = () => (document.documentElement.lang || "fr").slice(0, 2) === "fr";
  function decorate(h) {
    if (!isFr() || SKIP.has(h.id) || h.querySelector("em, i, b, span") || h.dataset.stu === "1") return;
    const words = (h.textContent || "").trim().split(/\s+/);
    if (words.length < 2 || words.length > 5) return;
    const last = words.pop();
    if (/[&0-9]/.test(last)) return;
    h.dataset.stu = "1"; h.dataset.words = String(words.length + 1);
    h.textContent = "";
    h.appendChild(document.createTextNode(words.join(" ") + " "));
    const em = document.createElement("em"); em.textContent = last; h.appendChild(em);
  }
  const run = () => document.querySelectorAll(".page-title").forEach(decorate);
  run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true });
})();
