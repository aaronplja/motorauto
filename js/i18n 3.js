/**
 * MOTORAUTO — traduction de l'interface (français, anglais, espagnol, allemand, italien).
 *   Le français est la langue d'origine : le texte du site reste écrit en français dans le code et les pages, et un dictionnaire
 *   (js/i18n/xx.js, chargé par i18n-boot.js) donne la traduction de chaque phrase. Un observateur traduit tout ce qui s'affiche,
 *   y compris les écrans construits plus tard par le code. Ce qui n'a pas de traduction reste en français.
 *   Ne sont JAMAIS traduits : les messages des pilotes, les commentaires, les biographies et le contenu des fiches (data-no-i18n).
 *   Modèles : une clé peut contenir {0}, {1}… (ex. « {0} commentaires ») pour les phrases avec des nombres ou des noms.
 */
(function () {
  "use strict";
  const BOOT = window.__MA_LANG || { lang: "fr", pref: "auto", detected: "fr" };
  const NAMES = { fr: "Français", en: "English", es: "Español", de: "Deutsch", it: "Italiano" };
  const LOCALE = { fr: "fr-FR", en: "en-GB", es: "es-ES", de: "de-DE", it: "it-IT" };
  const dict = Object.create(null), tpls = [];
  let lang = BOOT.lang;

  function add(l, map) {
    if (l !== lang) return;
    Object.keys(map).forEach((k) => {
      if (/\{n?\d\}/.test(k)) {
        const rx = new RegExp("^" + k.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{n\d\}/g, "(\\d[\\d\\s.,]*)").replace(/\{\d\}/g, "(.+?)") + "$");
        tpls.push([rx, map[k]]);
      } else dict[k] = map[k];
    });
  }
  function lookup(s) {
    if (lang === "fr") return null;
    const d = dict[s]; if (d !== undefined) return d;
    for (let i = 0; i < tpls.length; i++) { const m = tpls[i][0].exec(s); if (m) return tpls[i][1].replace(/\{n?(\d)\}/g, (x, n) => (m[+n + 1] !== undefined ? translate(m[+n + 1]) : x)); }
    return null;
  }
  function translate(s) { const k = String(s); const r = lookup(k.trim()); if (r === null) return k; const lead = /^\s*/.exec(k)[0], trail = /\s*$/.exec(k)[0]; return lead + r + trail; }
  const t = (s) => (lang === "fr" ? s : translate(s));

  // ------------------------------------------------------------------ DOM
  const SKIP = "script,style,textarea,input,[data-no-i18n],[contenteditable=true],.bubble,.cmt-body,.profile-bio,#pub-profile-bio,.feed-text b,.msg-author,.nw-body,.nw-item h3,.car-mention,.mg-board a,.pm-car b,.pm-car small";
  const ATTRS = ["placeholder", "title", "aria-label", "alt"];
  const origText = new WeakMap(), origAttr = new WeakMap();
  function doText(n) {
    const v = n.nodeValue; if (!v || !v.trim()) return;
    const o = origText.get(n);
    if (o && o.out === v) return;
    const par = n.parentElement; if (!par || par.closest(SKIP)) return;
    const r = lookup(v.trim()); if (r === null) return;
    const lead = /^\s*/.exec(v)[0], trail = /\s*$/.exec(v)[0], out = lead + r + trail;
    origText.set(n, { src: v, out }); n.nodeValue = out;
  }
  function doAttrs(el) {
    if (el.nodeType !== 1 || el.closest(SKIP.replace(",input", "").replace(",textarea", ""))) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a); if (!v) continue;
      const m = origAttr.get(el) || {}, rec = m[a];
      if (rec && rec.out === v) continue;
      const r = lookup(v.trim()); if (r === null) continue;
      m[a] = { src: v, out: r }; origAttr.set(el, m); el.setAttribute(a, r);
    }
    if ((el.tagName === "INPUT") && /^(button|submit)$/.test(el.type)) { const v = el.value, r = lookup((v || "").trim()); if (r !== null) el.value = r; }
  }
  function walk(root) {
    if (lang === "fr" || !root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while (w.nextNode()) { const n = w.currentNode; if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  let pending = new Set(), raf = 0;
  function flush() { raf = 0; const p = pending; pending = new Set(); p.forEach((n) => { if (n.isConnected !== false) walk(n); }); }
  function queue(n) { pending.add(n); if (!raf) raf = requestAnimationFrame(flush); }
  function start() {
    if (lang === "fr") return;
    walk(document.body); translateTitle();
    new MutationObserver((muts) => {
      muts.forEach((m) => {
        if (m.type === "childList") m.addedNodes.forEach(queue);
        else if (m.type === "characterData") queue(m.target);
        else if (m.type === "attributes") queue(m.target);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    const tt = document.querySelector("title"); if (tt) new MutationObserver(translateTitle).observe(tt, { childList: true });
  }
  function translateTitle() {
    const base = document.title, parts = base.split(" | "); if (parts.length < 2 && lookup(base) === null) return;
    const out = parts.map((p) => translate(p)).join(" | "); if (out !== base) document.title = out;
  }

  // ------------------------------------------------------------------ sélecteur de langue (Réglages › Ambiance)
  function pick(v) { try { localStorage.setItem("ma_lang", v); } catch (_) { /* ignoré */ } location.reload(); }
  function mountSelector() {
    const host = document.querySelector('.tab-panel[data-tab="ambiance"]'); if (!host || host.querySelector(".lang-box")) return;
    const box = document.createElement("div"); box.className = "lang-box input-stack";
    const country = BOOT.detected;
    box.innerHTML = `<label for="settings-lang">${t("Langue")}</label>
      <select id="settings-lang"><option value="auto" ${BOOT.pref === "auto" ? "selected" : ""}>${t("Automatique")} (${NAMES[country]})</option>${Object.keys(NAMES).map((k) => `<option value="${k}" ${BOOT.pref === k ? "selected" : ""}>${NAMES[k]}</option>`).join("")}</select>
      <small class="lap-meta">${t("La langue est détectée d'après ton navigateur et ton pays. Les messages des pilotes et les textes longs des fiches voitures restent dans leur langue d'origine.")}</small>`;
    host.insertBefore(box, host.firstChild);
    box.querySelector("select").addEventListener("change", (e) => pick(e.target.value));
  }

  window.MAI18n = { t, lang: () => lang, locale: () => LOCALE[lang], names: NAMES, add, translate, detected: () => BOOT.detected, mount: mountSelector };
  // les dictionnaires chargés avant ce fichier se sont déposés dans la file
  (window.__MA_DICT || []).forEach((e) => add(e[0], e[1])); window.__MA_DICT = { push: (e) => add(e[0], e[1]) };

  function boot() {
    start(); mountSelector();
    document.addEventListener("ma:route", () => setTimeout(mountSelector, 60));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
