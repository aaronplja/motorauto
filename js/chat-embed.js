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
  let frame = null, ready = false, onChat = false, view = "list", pending = "", kbOpen = false, topBase = "", hold = false, lastOpenAt = 0;

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
    const st = de.getAttribute("style") || ""; if (r.getAttribute("style") !== st) r.setAttribute("style", st);
    if (!probe) { probe = document.createElement("div"); probe.setAttribute("aria-hidden", "true"); probe.style.cssText = "position:fixed;left:-9px;top:0;width:1px;height:1px;visibility:hidden;padding-top:var(--safe-top,0px);padding-bottom:var(--safe-bottom,0px);box-sizing:content-box"; document.body.appendChild(probe); }
    const cs = getComputedStyle(probe), conv = de.classList.contains("chat-conv") && matchMedia("(max-width: 860px)").matches;
    r.style.setProperty("--safe-top", conv ? px(cs.paddingTop) + "px" : "0px");
    r.style.setProperty("--safe-bottom", (kbOpen ? 0 : px(cs.paddingBottom)) + "px");
    // clavier : la saisie remonte de sa hauteur + 40 px pour la barre d'accessoires d'iOS (flèches / ✓) qui flotte au-dessus du clavier
    r.style.setProperty("--kb", kbOpen && kbPx ? (kbPx + 40) + "px" : "0px");
  }
  new MutationObserver(() => requestAnimationFrame(sync)).observe(de, { attributes: true, attributeFilter: ["data-theme", "data-tone", "data-anim", "data-contrast", "style", "lang", "class"] });

  // le salon commence exactement sous la barre du haut (hauteur réelle, encoche comprise) : plus de recouvrement de la recherche
  function fitTop() {
    const host = $("chat-embed"); if (!host) return;
    const head = document.querySelector(".app-header");
    if (!onChat || de.classList.contains("chat-conv") || !head || getComputedStyle(head).display === "none") topBase = "";
    else topBase = Math.max(0, Math.round(head.getBoundingClientRect().bottom)) + "px";
    layout();
  }
  // clavier : le cadre du chat épouse exactement la zone visible (au-dessus du clavier). C'est le site qui le mesure : à l'intérieur
  // d'un cadre, iOS ne donne pas la hauteur du clavier, d'où la saisie qui restait cachée dessous.
  const vv = window.visualViewport;
  // Seule la barre de saisie suit le clavier : le cadre du chat, l'en-tête et la liste ne bougent jamais.
  // Le site mesure la hauteur du clavier et la donne à la page du chat (--kb) ; une valeur n'est retenue que si elle reste identique 90 ms.
  let stabT = 0, kbPx = 0;
  function layout(now) {
    const host = $("chat-embed"); if (!host) return;
    host.style.top = topBase; host.style.bottom = "";
    const raw = onChat && vv ? Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height)) : 0;
    if (raw >= window.innerHeight * 0.7) return;           // valeur absurde annoncée par iOS pendant l'animation : ignorée
    const open = raw > 80;
    if (open) lastOpenAt = Date.now();
    // pendant l'animation du clavier, iOS annonce brièvement une hauteur intermédiaire : on garde la dernière position plutôt que de redescendre la saisie
    if (hold && !open && kbOpen && Date.now() - lastOpenAt < 1200) { setTimeout(fitKb, 1250); return; }
    const k = open ? raw : 0;
    if (!now && k !== kbPx && (open || kbOpen)) { clearTimeout(stabT); stabT = setTimeout(() => layout(true), 90); return; }
    const changed = k !== kbPx || open !== kbOpen;
    kbPx = k;
    if (open !== kbOpen) { kbOpen = open; de.classList.toggle("chat-kb", open); }
    if (changed) { sync(); note("kb " + k); }
  }
  // mesure de mise au point (désactivée ; localStorage.ma_kbdbg = "1" pour l'afficher)
  let hud = null, hlog = [], ht0 = 0, hhide = 0;
  const dbgOn = () => { try { return localStorage.getItem("ma_kbdbg") === "1"; } catch (_) { return false; } };
  function note(tag) {
    if (!vv || !onChat || !dbgOn()) return;
    const now = Date.now(); if (!ht0 || now - ht0 > 10000) { ht0 = now; hlog = []; }
    hlog.push((now - ht0) + " " + tag + " ih" + Math.round(window.innerHeight) + " vh" + Math.round(vv.height) + " ot" + Math.round(vv.offsetTop) + " sy" + Math.round(window.scrollY) + (hold ? " H" : "") + (kbOpen ? " K" : ""));
    if (hlog.length > 12) hlog.shift();
    if (!hud) { hud = document.createElement("pre"); hud.setAttribute("aria-hidden", "true"); hud.style.cssText = "position:fixed;left:0;right:0;top:env(safe-area-inset-top,0);margin:0;padding:3px 6px;z-index:2147483647;pointer-events:none;font:10px/1.25 ui-monospace,monospace;color:#7CFC9A;background:rgba(0,0,0,.78);white-space:pre-wrap"; document.body.appendChild(hud); }
    hud.hidden = false; hud.textContent = hlog.join("\n");
    clearTimeout(hhide); hhide = setTimeout(() => { if (hud) hud.hidden = true; }, 7000);
  }
  let lraf = 0; const fitKb = () => { if (!lraf) lraf = requestAnimationFrame(() => { lraf = 0; layout(); }); };
  if (vv) { vv.addEventListener("resize", () => { note("vv.resize"); fitKb(); }); vv.addEventListener("scroll", () => { note("vv.scroll"); fitKb(); }); }
  window.addEventListener("resize", () => { fitTop(); fitKb(); }); window.addEventListener("orientationchange", () => setTimeout(fitTop, 300));
  function flag() {
    de.classList.toggle("on-chat", onChat);
    de.classList.toggle("chat-conv", onChat && view === "conv");
    sync(); fitTop(); setTimeout(fitTop, 250); setTimeout(fitTop, 900);
  }

  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || !frame || e.source !== win()) return;
    const d = e.data || {};
    if (d.ma === "chat-ready") { ready = true; const l = $("chat-embed-load"); if (l) l.hidden = true; sync(); if (pending) { go(pending); pending = ""; } }
    else if (d.ma === "chat-view") { view = d.view; flag(); }
    else if (d.ma === "chat-focus") { hold = true; note("FOCUS"); fitKb(); }
    else if (d.ma === "chat-blur") { hold = false; note("BLUR"); fitKb(); afterKeyboard(); }
    else if (d.ma === "chat-nav" && typeof d.hash === "string" && d.hash.indexOf("#/") === 0) location.hash = d.hash;
  });
  // iOS fait défiler la page du site pour montrer le champ de saisie : une fois le clavier fermé, on la remet à sa place (barre de navigation et saisie tout en bas)
  let st = 0;
  function settle() {
    if (!onChat) return;
    if (vv && (window.innerHeight - vv.height) > 80) return;   // clavier encore ouvert
    if (hold && Date.now() - lastOpenAt < 1200) return;          // saisie en cours : ne pas annuler le décalage que fait iOS pour la montrer
    if (window.scrollY || window.scrollX || (vv && (vv.offsetTop || vv.offsetLeft))) {
      note("settle→0"); window.scrollTo(0, 0); de.scrollTop = 0; document.body.scrollTop = 0;
    }
    layout();
  }
  // bug iOS (PWA installée) : après la première ouverture du clavier, la hauteur de la fenêtre reste réduite d'environ 60 px
  // (barre de navigation et saisie remontées, bande noire en bas). On mémorise la plus grande hauteur vue et, quand le clavier
  // est fermé et que la hauteur reste trop courte, on force un nouveau calcul en masquant puis réaffichant un élément pleine hauteur.
  let peak = window.innerHeight, sentinel = null;
  const typing = () => { const a = document.activeElement; return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable); };
  window.addEventListener("resize", () => { peak = Math.max(peak, window.innerHeight); });
  window.addEventListener("orientationchange", () => setTimeout(() => { peak = window.innerHeight; }, 600));
  function remeasure() {
    if (hold || typing() || peak - window.innerHeight <= 4) return;
    if (!sentinel) { sentinel = document.createElement("div"); sentinel.setAttribute("aria-hidden", "true"); sentinel.style.cssText = "position:fixed;left:0;top:0;width:1px;height:100%;pointer-events:none;visibility:hidden;z-index:-1"; document.body.appendChild(sentinel); }
    sentinel.style.display = "none"; void sentinel.offsetHeight; sentinel.style.display = "";
    void document.documentElement.offsetHeight;
  }
  const afterKeyboard = () => [0, 150, 400, 900].forEach((t) => setTimeout(() => { settle(); remeasure(); }, t));
  document.addEventListener("focusout", () => { setTimeout(() => { if (!typing()) afterKeyboard(); }, 60); });
  const later = () => { clearTimeout(st); st = setTimeout(() => { settle(); remeasure(); }, 60); };
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
