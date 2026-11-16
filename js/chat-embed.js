/**
 * MOTORAUTO — le Chat est une page du site comme les autres (#/chat) : la barre du haut et la barre du bas restent en place,
 * seul le contenu (chat.html, intégré) se charge — une fois, puis il reste en mémoire : revenir sur le Chat est instantané.
 *  - sur la liste des discussions : en-tête du site visible ; dans une conversation (mobile) : en-tête et dock masqués, plein écran ;
 *  - #/chat/dm/<uid>, #/chat/club/<id>, #/chat/channel/<id>, #/chat/global ouvrent directement la conversation ;
 *  - le thème et les marges de l'iPhone sont transmis à la page intégrée.
 */
(function () {
  "use strict";
  const de = document.documentElement, $ = (id) => document.getElementById(id);
  let frame = null, ready = false, onChat = false, view = "list", pending = "";

  function make(sub) {
    if (frame) return;
    const host = $("chat-embed"); if (!host) return;
    frame = document.createElement("iframe");
    frame.id = "chat-frame"; frame.title = "Chat"; frame.setAttribute("allow", "microphone; clipboard-write");
    frame.src = "chat.html" + (sub ? "#" + sub : "");
    host.appendChild(frame);
  }
  const win = () => { try { return frame && frame.contentWindow; } catch (_) { return null; } };

  // ---- thème + zones de sécurité (encoche / barre iPhone) transmis à la page intégrée
  let probe = null;
  const px = (v) => parseFloat(v) || 0;
  function sync() {
    const w = win(); if (!w || !w.document || !w.document.documentElement) return;
    const r = w.document.documentElement;
    ["data-theme", "data-tone", "data-anim", "data-contrast", "lang"].forEach((a) => { const v = de.getAttribute(a); if (v == null) r.removeAttribute(a); else if (r.getAttribute(a) !== v) r.setAttribute(a, v); });
    const st = de.getAttribute("style") || ""; if (r.getAttribute("style") !== st && !/--vvh/.test(r.getAttribute("style") || "")) r.setAttribute("style", st);
    if (!probe) { probe = document.createElement("div"); probe.setAttribute("aria-hidden", "true"); probe.style.cssText = "position:fixed;left:-9px;top:0;width:1px;height:1px;visibility:hidden;padding-top:var(--safe-top,0px);padding-bottom:var(--safe-bottom,0px);box-sizing:content-box"; document.body.appendChild(probe); }
    const cs = getComputedStyle(probe), conv = de.classList.contains("chat-conv") && matchMedia("(max-width: 860px)").matches;
    r.style.setProperty("--safe-top", conv ? px(cs.paddingTop) + "px" : "0px");
    r.style.setProperty("--safe-bottom", px(cs.paddingBottom) + "px");
  }
  new MutationObserver(() => requestAnimationFrame(sync)).observe(de, { attributes: true, attributeFilter: ["data-theme", "data-tone", "data-anim", "data-contrast", "style", "lang", "class"] });

  function flag() {
    de.classList.toggle("on-chat", onChat);
    de.classList.toggle("chat-conv", onChat && view === "conv");
    sync();
  }

  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || !frame || e.source !== win()) return;
    const d = e.data || {};
    if (d.ma === "chat-ready") { ready = true; const l = $("chat-embed-load"); if (l) l.hidden = true; sync(); if (pending) { go(pending); pending = ""; } }
    else if (d.ma === "chat-view") { view = d.view; flag(); }
    else if (d.ma === "chat-blur") { [0, 120, 350, 800].forEach((t) => setTimeout(settle, t)); }
    else if (d.ma === "chat-nav" && typeof d.hash === "string" && d.hash.indexOf("#/") === 0) location.hash = d.hash;
  });
  // iOS fait défiler la page du site pour montrer le champ de saisie : une fois le clavier fermé, on la remet à sa place (barre de navigation et saisie tout en bas)
  const vv = window.visualViewport; let st = 0;
  function settle() {
    if (!onChat) return;
    if (vv && (window.innerHeight - vv.height) > 80) return;   // clavier encore ouvert
    if (window.scrollY || window.scrollX || (vv && (vv.offsetTop || vv.offsetLeft))) window.scrollTo(0, 0);
  }
  const later = () => { clearTimeout(st); st = setTimeout(settle, 60); };
  if (vv) { vv.addEventListener("resize", later); vv.addEventListener("scroll", later); }
  window.addEventListener("scroll", later, { passive: true });
  function go(sub) { const w = win(); if (w && sub && w.location.hash !== "#" + sub) w.location.hash = "#" + sub; }

  // préchargement : dès que le doigt / la souris s'approche de l'onglet Chat
  const warm = () => make("");
  ["pointerdown", "pointerenter", "touchstart"].forEach((t) => document.addEventListener(t, (e) => { if (e.target.closest && e.target.closest('[data-nav="chat"], [data-touch="chat"]')) warm(); }, { passive: true, capture: true }));

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    ctx.Router.register("chat", {
      enter: (p) => {
        onChat = true; make(p && p.sub ? p.sub : "");
        if (p && p.sub) { if (ready) go(p.sub); else pending = p.sub; }
        flag();
      }
    });
    document.addEventListener("ma:route", (e) => { const n = e.detail && e.detail.name; if (n !== "chat" && onChat) { onChat = false; flag(); } });
  });
})();
