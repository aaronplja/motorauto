/** MOTORAUTO — garde-fous d'interface : aucun écran bloqué, aucune zone qui ne défile plus. */
(function () {
  "use strict";
  const body = document.body;
  if (!body) return;

  // 1) le verrouillage du défilement ne peut pas « fuir » : il n'existe que si une fenêtre est réellement ouverte
  function syncLocks() {
    const modal = !!document.querySelector(".modal-layer.active");
    const tcg = !!document.querySelector(".tcg-overlay.on, .tcg-overlay[data-kind]");
    const light = !!document.querySelector(".lightbox");
    body.classList.toggle("modal-open", modal);
    if (!tcg) body.classList.remove("tcg-open");
    if (!modal && !tcg && !light) { body.style.overflow = ""; body.style.position = body.style.position === "fixed" ? "" : body.style.position; }
  }
  let pending = false;
  new MutationObserver(() => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; syncLocks(); addOverlayClose(); }); })
    .observe(body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  window.addEventListener("hashchange", () => { closeStrayOverlays(); setTimeout(syncLocks, 50); });
  window.addEventListener("pageshow", syncLocks);

  // 2) les surcouches plein écran (cartes, packs) ont toujours une croix de fermeture et se ferment au retour arrière
  function addOverlayClose() {
    document.querySelectorAll(".tcg-overlay").forEach((o) => {
      if (o.querySelector(".ov-x")) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "ov-x"; b.setAttribute("aria-label", "Fermer"); b.innerHTML = "&times;";
      b.addEventListener("click", (e) => { e.stopPropagation(); document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
      o.appendChild(b);
    });
  }
  function closeStrayOverlays() {
    if (document.querySelector(".tcg-overlay")) document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }

  // 3) les champs de saisie restent visibles quand le clavier mobile s'ouvre
  document.addEventListener("focusin", (e) => {
    const t = e.target;
    if (!t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest(".chat-composer, #chat-form")) return;
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    setTimeout(() => { try { t.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_) { /* ignoré */ } }, 320);
  });

  // 3b) clavier ouvert : la barre de navigation du bas s'efface pour ne rien recouvrir
  const isField = (t) => t && /^(INPUT|TEXTAREA)$/.test(t.tagName) && !/^(checkbox|radio|button|submit|range|file|color)$/.test(t.type || "");
  document.addEventListener("focusin", (e) => { if (isField(e.target) && window.matchMedia("(max-width: 900px)").matches) body.classList.add("kb-open"); });
  document.addEventListener("focusout", () => setTimeout(() => { if (!isField(document.activeElement)) body.classList.remove("kb-open"); }, 80));

  // 4) les onglets défilants montrent toujours l'onglet actif
  function centerActiveTabs() {
    document.querySelectorAll(".page-tabs, .categories-scroll, .phases-strip").forEach((bar) => {
      const a = bar.querySelector(".active, [aria-selected='true']");
      if (a && bar.scrollWidth > bar.clientWidth + 2) bar.scrollTo({ left: Math.max(0, a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2), behavior: "auto" });
    });
  }
  window.addEventListener("hashchange", () => setTimeout(centerActiveTabs, 120));
  document.addEventListener("click", (e) => { if (e.target.closest(".page-tab, .filter-pill, .phase-pill-btn")) setTimeout(centerActiveTabs, 60); });
  setTimeout(centerActiveTabs, 600);
  syncLocks();
})();
