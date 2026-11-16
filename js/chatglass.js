/* MOTORAUTO — chat : teinte clair/sombre (data-tone), couleur de la barre iPhone, onglets Tout / Canaux / Privés */
(function () {
  "use strict";
  function tone() {
    const c = (getComputedStyle(document.documentElement).getPropertyValue("--bg-core") || "").trim();
    const m = /^#?([0-9a-f]{6})$/i.exec(c); if (!m) return;
    const v = parseInt(m[1], 16), ch = [v >> 16, (v >> 8) & 255, v & 255].map((x) => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
    document.documentElement.setAttribute("data-tone", .2126 * ch[0] + .7152 * ch[1] + .0722 * ch[2] < .25 ? "dark" : "light");
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", "#" + m[1]);
  }
  tone();
  new MutationObserver(() => requestAnimationFrame(tone)).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });
  // en-tête et saisie flottants : on mesure leur hauteur pour que les messages passent dessous sans être cachés
  const head = document.querySelector(".conv-head"), comp = document.querySelector(".compose-wrap"), root = document.documentElement.style;
  if (window.ResizeObserver) {
    if (head) new ResizeObserver(() => root.setProperty("--head-h", head.offsetHeight + "px")).observe(head);
    if (comp) new ResizeObserver(() => root.setProperty("--comp-h", comp.offsetHeight + "px")).observe(comp);
  }
  // toucher le nom en haut d'une conversation privée ouvre le profil du pilote
  const pill = document.getElementById("conv-pill");
  if (pill) {
    const go = () => { const c = window.MAChatCtl && window.MAChatCtl.conv && window.MAChatCtl.conv(); if (!c || c.type !== "private") return; if (window.parent !== window) window.parent.postMessage({ ma: "chat-nav", hash: "#/pilote/" + encodeURIComponent(c.id) }, location.origin); else location.href = "index.html?pilot=" + encodeURIComponent(c.id); };
    pill.addEventListener("click", go);
    pill.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && pill.dataset.kind === "private") { e.preventDefault(); go(); } });
    new MutationObserver(() => { const p = pill.dataset.kind === "private"; pill.setAttribute("role", p ? "button" : "group"); if (p) { pill.tabIndex = 0; pill.setAttribute("aria-label", "Voir le profil"); } else { pill.removeAttribute("tabindex"); pill.removeAttribute("aria-label"); } }).observe(pill, { attributes: true, attributeFilter: ["data-kind"] });
  }
  // onglets de la liste : Tout / Canaux / Privés (+ pastille quand un onglet cache un message non lu)
  const side = document.getElementById("chat-side"), tabs = document.getElementById("side-tabs");
  if (side && tabs) {
    const set = (t) => {
      side.dataset.tab = t;
      tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === t)));
      try { sessionStorage.setItem("ma_chat_tab", t); } catch (e) {}
    };
    let saved = "all"; try { saved = sessionStorage.getItem("ma_chat_tab") || "all"; } catch (e) {}
    set(/^(all|channels|dms)$/.test(saved) ? saved : "all");
    tabs.addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) set(b.dataset.tab); });
    const dots = () => {
      const ch = !!document.querySelector("#chat-channels-list .has-unread"), dm = !!document.querySelector("#chat-convs-list .has-unread");
      tabs.querySelector('[data-tab="channels"]').classList.toggle("has-new", ch);
      tabs.querySelector('[data-tab="dms"]').classList.toggle("has-new", dm);
    };
    const mo = new MutationObserver(() => requestAnimationFrame(dots));
    ["chat-channels-list", "chat-convs-list"].forEach((id) => { const el = document.getElementById(id); if (el) mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] }); });
    // une recherche ou l'ouverture du sélecteur de pilote doit montrer le bon onglet
    const np = document.getElementById("new-dm-btn"); if (np) np.addEventListener("click", () => { if (side.dataset.tab === "channels") set("dms"); });
  }
})();
