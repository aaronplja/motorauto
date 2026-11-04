/**
 * MOTORAUTO — mentions de pilotes : @pseudo dans un message, un commentaire ou une bio devient un lien vers le profil du pilote.
 * Le pseudo est unique (changement possible une fois tous les 30 jours). Le lien est résolu au clic (recherche du pseudo exact).
 */
(function () {
  "use strict";
  const TOKEN = /(^|[\s(\[>.,;:!?])@([A-Za-z0-9À-ÿ][A-Za-z0-9À-ÿ._-]{1,23})/g;
  const SELECTORS = ".bubble .txt, .cmt-body > div:last-child, #pub-profile-bio, .feed-text, .ev-desc, .event-desc, .cc-desc, .listing-desc, .thread-text";
  const onChat = /chat\.html/i.test(location.pathname);
  function processText(node) {
    const text = node.nodeValue; TOKEN.lastIndex = 0;
    let m, last = 0, frag = null;
    while ((m = TOKEN.exec(text))) {
      const name = m[2].replace(/[.,;:!?_-]+$/, ""); if (name.length < 2) continue;
      const start = m.index + m[1].length;
      frag = frag || document.createDocumentFragment();
      frag.appendChild(document.createTextNode(text.slice(last, start)));
      const a = document.createElement("a"); a.className = "pilot-mention"; a.href = "#"; a.dataset.pilotMention = name; a.textContent = "@" + name; frag.appendChild(a);
      last = start + 1 + name.length; TOKEN.lastIndex = last;
    }
    if (!frag) return;
    frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  function processElement(el) {
    if (el.dataset && el.dataset.pmnt === "1") return;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.indexOf("@") >= 0 && !n.parentNode.closest("a,button,code,script,style,textarea") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    const list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(processText);
    if (el.dataset) el.dataset.pmnt = "1";
  }
  let queue = new Set(), raf = 0;
  function flush() { raf = 0; const q = queue; queue = new Set(); q.forEach((el) => { if (el.isConnected) processElement(el); }); }
  function enqueue(el) { queue.add(el); if (!raf) raf = requestAnimationFrame(flush); }
  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches(SELECTORS)) enqueue(root);
    root.querySelectorAll && root.querySelectorAll(SELECTORS).forEach(enqueue);
    const p = root.closest && root.closest(SELECTORS); if (p) { delete p.dataset.pmnt; enqueue(p); }
  }
  new MutationObserver((muts) => { muts.forEach((m) => { m.addedNodes.forEach(scan); if (m.type === "characterData" && m.target.parentElement) scan(m.target.parentElement); }); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener("DOMContentLoaded", () => scan(document.body));
  if (document.body) scan(document.body);

  const cache = new Map();
  async function uidOf(name) {
    const k = name.toLowerCase(); if (cache.has(k)) return cache.get(k);
    const db = window.MAFB && window.MAFB.db; if (!db) return "";
    let uid = "";
    try { const s = await db.collection("users").where("username", "==", name).limit(1).get(); if (!s.empty) uid = s.docs[0].id; } catch (_) { /* hors ligne */ }
    if (uid) cache.set(k, uid);
    return uid;
  }
  document.addEventListener("click", async (e) => {
    const a = e.target.closest && e.target.closest("a.pilot-mention"); if (!a) return;
    e.preventDefault();
    const uid = await uidOf(a.dataset.pilotMention);
    if (!uid) { if (window.MA && window.MA.toast) window.MA.toast("Aucun pilote nommé @" + a.dataset.pilotMention + ".", "err"); return; }
    if (onChat) location.href = "index.html#/pilote/" + encodeURIComponent(uid); else location.hash = "#/pilote/" + encodeURIComponent(uid);
  });
})();
