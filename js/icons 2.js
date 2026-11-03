/**
 * MOTORAUTO — icônes unifiées.
 * Remplace les émojis / symboles de l'interface (boutons, titres, onglets, badges, toasts) par des icônes SVG au trait,
 * qui prennent la couleur du texte. Les textes écrits par les pilotes (messages, commentaires, bios) ne sont jamais touchés :
 * seuls les éléments d'interface listés dans UI_SEL sont traités.
 *   MAIcons.svg("flag", 18)  →  chaîne SVG        MAIcons.apply(racine)  →  convertit les émojis d'une zone
 */
(function () {
  "use strict";
  const P = {
    flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4 2.5 4H5"/>',
    star: '<path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8z"/>',
    flame: '<path d="M12 3c.8 3.2 5 5.2 5 10a5 5 0 0 1-10 0c0-2 .9-3.3 2.2-4.4.1 1.8.9 2.7 1.9 3C10.2 8.5 10.6 5.6 12 3z"/>',
    camera: '<path d="M4 8h3l1.8-2.6h6.4L17 8h3v11H4z"/><circle cx="12" cy="13.4" r="3.4"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
    sparkle: '<path d="M11 3.5l1.9 5.6 5.6 1.9-5.6 1.9L11 18.5l-1.9-5.6L3.5 11l5.6-1.9z"/><path d="M19 16.5v4M17 18.5h4"/>',
    trophy: '<path d="M8 4h8v5.2a4 4 0 0 1-8 0z"/><path d="M8 6H4.5v1.8A3 3 0 0 0 8 10.8M16 6h3.5v1.8a3 3 0 0 1-3.5 3"/><path d="M12 13.2V17M8.5 20h7M10 17h4"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.9 12.5h9.2L17.5 7M10 11v5.5M14 11v5.5"/>',
    car: '<path d="M3.5 15.5v-3L5.6 7.8h12.8l2.1 4.7v3z"/><path d="M5 15.5V18h3v-2.5M16 15.5V18h3v-2.5M6 12.2h12"/>',
    chat: '<path d="M4 5.5h16v11H9.5L5 20.2v-3.7H4z"/>',
    arrow: '<path d="M5 12h14M13.5 6.5L19 12l-5.5 5.5"/>',
    gift: '<path d="M4.5 10.5h15V20h-15zM3.5 7.5h17v3h-17zM12 7.5V20"/><path d="M12 7.5C10 3.8 6.2 4.6 7.2 7.5M12 7.5c2-3.7 5.8-2.9 4.8 0"/>',
    check: '<path d="M5 12.5l4.6 4.6L19 7.4"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.7"/><circle cx="12" cy="12" r="1.1"/>',
    pin: '<path d="M12 21s-6.2-5.4-6.2-11a6.2 6.2 0 0 1 12.4 0c0 5.6-6.2 11-6.2 11z"/><circle cx="12" cy="10" r="2.3"/>',
    cards: '<rect x="6" y="4.5" width="11" height="15" rx="2"/><path d="M20 8l1 9.5M3.5 8L3 16"/>',
    swap: '<path d="M4 8.5h14.5L15 5M20 15.5H5.5L9 19"/>',
    edit: '<path d="M4 20h4L19.5 8.5l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    wrench: '<path d="M14.6 5.6a4.2 4.2 0 0 0-5 5.4L4.4 16.2 7.8 19.6 13 14.4a4.2 4.2 0 0 0 5.4-5l-2.7 2.7-2.4-.6-.6-2.4z"/>',
    warning: '<path d="M12 4l9.2 16H2.8z"/><path d="M12 10v4.4M12 17.3v.1"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7.5l8 6 8-6"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4"/>',
    medal: '<circle cx="12" cy="14.5" r="5"/><path d="M9 3.5l3 6 3-6"/>',
    map: '<path d="M4 6.5l5-2 6 2 5-2v13l-5 2-6-2-5 2zM9 4.5v13M15 6.5v13"/>',
    shield: '<path d="M12 3.5l7 2.8v5.2c0 4.6-3 7.7-7 9.5-4-1.8-7-4.9-7-9.5V6.3z"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 1.8H4.2zM10 21h4"/>',
    bolt: '<path d="M13.2 3L5.5 13.8h5.8L10.4 21l8.1-11h-5.9z"/>',
    tag: '<path d="M3.5 12.2l8.6-8.6h7.9V11.5l-8.6 8.6z"/><circle cx="15.7" cy="8.3" r="1.2"/>',
    globe: '<circle cx="12" cy="12" r="8.7"/><path d="M3.3 12h17.4M12 3.3c3.2 3.2 3.2 14.2 0 17.4M12 3.3c-3.2 3.2-3.2 14.2 0 17.4"/>',
    chart: '<path d="M4.5 20V11M10 20V4.5M15.5 20v-7.5M21 20H3"/>',
    compass: '<circle cx="12" cy="12" r="8.7"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    mute: '<path d="M4 9.5h3.8L13 5.2v13.6l-5.2-4.3H4zM16.5 9.5l4 5M20.5 9.5l-4 5"/>',
    road: '<path d="M8.5 3.5L4.5 20.5M15.5 3.5l4 17M12 5v3M12 11v3M12 17v3"/>',
    dot: '<circle cx="12" cy="12" r="5" fill="currentColor"/>',
    undo: '<path d="M9 7L4.5 11.5 9 16M5 11.5h9.5a4.5 4.5 0 0 1 0 9H12"/>',
    at: '<circle cx="12" cy="12" r="3.6"/><path d="M15.6 8.4v5a2.2 2.2 0 0 0 4.4 0V12a8 8 0 1 0-3.2 6.4"/>',
    user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.5-4 3.4-6 7.2-6s6.7 2 7.2 6"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="4.6"/><circle cx="12" cy="12" r="3.7"/><path d="M16.9 7.2v.1"/>',
    snapchat: '<path d="M12 4c-2.6 0-4.2 1.8-4.2 4.4v2.3c-.8.3-2 .5-2.8.5.4.9 1.4 1.3 2.3 1.5-.3 1.2-1.2 2-2.3 2.4 1 .9 2.4.9 3.4 1.3.3.7.9 1.1 1.6 1.1.7 0 1.3-.4 2-.4s1.3.4 2 .4c.7 0 1.3-.4 1.6-1.1 1-.4 2.4-.4 3.4-1.3-1.1-.4-2-1.2-2.3-2.4.9-.2 1.9-.6 2.3-1.5-.8 0-2-.2-2.8-.5V8.4C16.2 5.8 14.6 4 12 4z"/>',
    tiktok: '<path d="M14 4v10.2a3.7 3.7 0 1 1-3.7-3.7"/><path d="M14 4c.3 2.4 2 4 4.5 4.2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3A4 4 0 0 0 11 18.6l1-1"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    inbox: '<path d="M4 13.5l2.4-7.5h11.2l2.4 7.5V19H4z"/><path d="M4 13.5h4.5a3.5 3.5 0 0 0 7 0H20"/>'
  };
  const svg = (name, size, cls) => {
    const p = P[name]; if (!p) return "";
    const s = size || 18;
    return `<svg class="ic-svg ${cls || ""}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
  };
  // émoji / symbole → [icône, classe de couleur facultative]
  const MAP = {
    "🏁": ["flag"], "🚩": ["flag"], "★": ["star", "ic-fill"], "⭐": ["star", "ic-fill"], "☆": ["star"], "🔥": ["flame"], "📷": ["camera"], "📸": ["camera"],
    "♥": ["heart", "ic-fill"], "❤": ["heart", "ic-fill"], "♡": ["heart"], "✨": ["sparkle"], "✦": ["sparkle"], "🎉": ["sparkle"], "🏆": ["trophy"],
    "🗑": ["trash"], "🚗": ["car"], "🏎": ["car"], "💬": ["chat"], "➔": ["arrow"], "🎁": ["gift"], "✓": ["check"], "✔": ["check"],
    "✅": ["check", "ic-ok"], "❌": ["x", "ic-bad"], "✕": ["x"], "🎯": ["target"], "📍": ["pin"], "🎴": ["cards"], "🔄": ["swap"], "🤝": ["swap"],
    "✎": ["edit"], "🔧": ["wrench"], "⚠": ["warning"], "✉": ["mail"], "📩": ["mail"], "📨": ["mail"], "📅": ["calendar"],
    "🥇": ["medal", "ic-gold"], "🥈": ["medal", "ic-silver"], "🥉": ["medal", "ic-bronze"], "🏅": ["medal"], "🗺": ["map"], "🛡": ["shield"],
    "🔔": ["bell"], "⚡": ["bolt"], "🏷": ["tag"], "🌐": ["globe"], "📊": ["chart"], "🧭": ["compass"], "🔇": ["mute"], "🛣": ["road"],
    "↩": ["undo"], "🔴": ["dot", "ic-bad"], "🟢": ["dot", "ic-ok"], "⚫": ["dot"], "🔒": ["lock"]
  };
  const RE = new RegExp(Object.keys(MAP).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + "|\\uFE0F", "g");
  // éléments d'interface traités (les textes des pilotes ne sont jamais concernés)
  const UI_SEL = "button, a.page-tab, a.touch-bar-item, a.nav-link, a.cta-btn, h1, h2, h3, h4, h5, summary, label, th, legend, .sec-title, .panel-section-title, .status-tag-verified, .contest-kicker, .contest-prize, .lap-meta, .empty-note, .toast, .badge, .badge-row span, .feed-when, .vote-pill, .tcg-tag, .pk-logo, .chal-card b, .hub-card b, .stat-chip, .tag, .pill, .footer-links a, .notif-ico, .hub-ico, .event-banner b";
  const SKIP = "textarea, input, select, script, style, svg, [contenteditable], .msg, .msg-text, .reaction, [data-noicons]";

  function replaceIn(node) {
    const t = node.nodeValue; if (!t || !RE.test(t)) { RE.lastIndex = 0; return; }
    RE.lastIndex = 0;
    const frag = document.createDocumentFragment(); let last = 0, m;
    while ((m = RE.exec(t))) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const def = MAP[m[0]];
      if (def) { const sp = document.createElement("span"); sp.className = "ic " + (def[1] || ""); sp.innerHTML = svg(def[0], 18); frag.appendChild(sp); }
      last = m.index + m[0].length;
    }
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  function apply(root) {
    root = root || document.body; if (!root || root.nodeType !== 1) return;
    const targets = root.matches && root.matches(UI_SEL) ? [root] : [];
    root.querySelectorAll(UI_SEL).forEach((e) => targets.push(e));
    targets.forEach((el) => {
      if (el.closest(SKIP)) return;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), list = [];
      while (w.nextNode()) { const n = w.currentNode; if (n.parentNode && !n.parentNode.closest(SKIP) && RE.test(n.nodeValue)) list.push(n); RE.lastIndex = 0; }
      list.forEach(replaceIn);
    });
  }
  let queued = false; const pending = new Set();
  function schedule(n) { pending.add(n); if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; const items = [...pending]; pending.clear(); items.forEach((x) => { const el = x.nodeType === 1 ? x : x.parentElement; if (el && el.isConnected) apply(el.closest(UI_SEL) || el); }); }); }
  function start() {
    apply(document.body);
    new MutationObserver((muts) => { for (const m of muts) { if (m.type === "childList") m.addedNodes.forEach((n) => { if (n.nodeType === 1 || n.nodeType === 3) schedule(n); }); else if (m.type === "characterData") schedule(m.target); } })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  window.MAIcons = { svg, apply, names: Object.keys(P) };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
