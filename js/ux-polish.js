/**
 * MOTORAUTO — finitions d'usage (UX-109) :
 *  - changement de page annoncé aux lecteurs d'écran (zone « polie » invisible) ;
 *  (« Réessayer » sur les erreurs de chargement : js/retry.js ; forme unique des états vides : css/system.css.)
 */
(function () {
  "use strict";
  // ---- annonce de changement de page (lecteurs d'écran)
  let live = null, last = "";
  function announce(msg) {
    if (!msg || msg === last) return;
    last = msg;
    if (!live) { live = document.createElement("div"); live.id = "ma-live"; live.className = "sr-only"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite"); live.setAttribute("aria-atomic", "true"); document.body.appendChild(live); }
    live.textContent = ""; setTimeout(() => { live.textContent = msg; }, 60);
  }
  document.addEventListener("ma:route", () => setTimeout(() => announce(document.title.replace(/\s*\|\s*MOTORAUTO\s*$/, "")), 400));


  // ---- UX-202 : après un changement de page, le focus va au titre (lecteurs d'écran, clavier) — jamais au premier chargement
  let routed = false;
  document.addEventListener("ma:route", () => {
    if (!routed) { routed = true; return; }
    setTimeout(() => {
      const a = document.activeElement;
      if (a && a !== document.body && !a.closest("[class*=dock], .app-header, #more-menu") && a.tagName !== "A" && a.tagName !== "BUTTON") return;
      if (document.querySelector(".modal-layer.open, dialog[open]")) return;
      const h = document.querySelector(".page.page-on h1, #page-main .page-on h1");
      if (!h || !h.offsetParent) return;
      if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
      try { h.focus({ preventScroll: true }); } catch (_) { /* ignoré */ }
    }, 450);
  });

  // ---- UX-205 : bandeau « hors connexion »
  function offlineBar() {
    let b = document.getElementById("ma-offline");
    if (!b) { b = document.createElement("div"); b.id = "ma-offline"; b.setAttribute("role", "status"); b.textContent = "Hors connexion : tes actions seront renvoyées au retour du réseau."; b.hidden = true; document.body.appendChild(b); }
    return b;
  }
  function netState() { const b = offlineBar(); const off = navigator.onLine === false; if (off === !b.hidden) return; b.hidden = !off; document.body.classList.toggle("offline-on", off); if (!off) { try { window.MA && window.MA.toast("Connexion rétablie.", "ok"); } catch (_) { /* ignoré */ } } }
  window.addEventListener("offline", netState); window.addEventListener("online", netState);
  if (document.readyState !== "loading") netState(); else document.addEventListener("DOMContentLoaded", netState);

  document.addEventListener("change", (e) => { if (e.target && e.target.id === "settings-email-notifs") { const t = document.getElementById("settings-email-types"); if (t) t.hidden = !e.target.checked; } });

  // ---- UX-206 : brouillons automatiques des formulaires utilisateur (contact, réglages) — MADraft (js/draft.js)
  function drafts() {
    if (!window.MADraft) return;
    const c = document.getElementById("contact-form"); if (c && !c._dr) { c._dr = 1; MADraft.watch({ key: "contact", root: c }); }
    const st = document.getElementById("settings-bio"); const sb = st && st.closest(".input-stack") && st.closest(".input-stack").parentElement;
    if (sb && !sb._dr) { sb._dr = 1; MADraft.watch({ key: "settings-profile", root: sb }); }
    const ev = document.getElementById("event-form"); if (ev && !ev._dr) { ev._dr = 1; MADraft.watch({ key: "event:new", root: ev }); }
  }
  document.addEventListener("ma:route", () => setTimeout(drafts, 600));
  setTimeout(drafts, 1500);

  // ---- UX-207 : claviers mobiles adaptés (inputmode / enterkeyhint / autocapitalize)
  function hints(root) {
    (root || document).querySelectorAll("input").forEach((i) => {
      const t = i.type;
      if (t === "email") { if (!i.inputMode) i.setAttribute("inputmode", "email"); i.setAttribute("autocapitalize", "off"); i.setAttribute("spellcheck", "false"); }
      else if (t === "number" && !i.hasAttribute("inputmode")) i.setAttribute("inputmode", i.step && /\./.test(i.step) ? "decimal" : "numeric");
      else if (t === "tel") i.setAttribute("inputmode", "tel");
      else if (t === "url") { i.setAttribute("inputmode", "url"); i.setAttribute("autocapitalize", "off"); }
      else if (t === "search") i.setAttribute("enterkeyhint", "search");
      else if (t === "text" && /user|pseudo|handle/i.test(i.id + " " + i.name)) { i.setAttribute("autocapitalize", "off"); i.setAttribute("autocorrect", "off"); i.setAttribute("spellcheck", "false"); }
      if (!i.hasAttribute("enterkeyhint") && i.form) { const f = Array.from(i.form.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=submit]), textarea")); if (f.length && i.tagName === "INPUT") i.setAttribute("enterkeyhint", f[f.length - 1] === i ? "send" : "next"); }
    });
  }
  setTimeout(hints, 800); document.addEventListener("ma:route", () => setTimeout(hints, 700));
})();
