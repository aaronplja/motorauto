/**
 * MOTORAUTO — réseaux sociaux du profil (Instagram, TikTok, Snapchat).
 * Le pilote saisit un lien OU un pseudo ; on ne stocke que le pseudo (sans @), validé, puis on reconstruit le lien
 * vers le bon site : impossible de glisser une adresse quelconque dans un profil.
 */
(function () {
  "use strict";
  const NETS = {
    instagram: { label: "Instagram", hosts: /(^|\.)instagram\.com$/i, url: (h) => "https://www.instagram.com/" + h, handle: /^[A-Za-z0-9._]{1,30}$/ },
    tiktok: { label: "TikTok", hosts: /(^|\.)tiktok\.com$/i, url: (h) => "https://www.tiktok.com/@" + h, handle: /^[A-Za-z0-9._]{2,24}$/ },
    snapchat: { label: "Snapchat", hosts: /(^|\.)snapchat\.com$/i, url: (h) => "https://www.snapchat.com/add/" + h, handle: /^[A-Za-z][A-Za-z0-9._-]{2,14}$/ }
  };
  const label = (k) => (NETS[k] ? NETS[k].label : k);
  /** lien ou pseudo → pseudo propre, ou "" si invalide */
  function parse(kind, raw) {
    const n = NETS[kind]; if (!n) return "";
    let v = String(raw || "").trim();
    if (!v) return "";
    if (/^(https?:\/\/|www\.|[a-z0-9-]+\.(com|fr)\/)/i.test(v)) {
      try {
        const u = new URL(/^https?:\/\//i.test(v) ? v : "https://" + v);
        if (!n.hosts.test(u.hostname)) return "";
        const seg = u.pathname.split("/").filter(Boolean);
        v = (kind === "snapchat" ? (seg[0] === "add" ? seg[1] : seg[0]) : seg[0]) || "";
      } catch (_) { return ""; }
    }
    v = v.replace(/^@+/, "");
    return n.handle.test(v) ? v : "";
  }
  const url = (kind, handle) => (NETS[kind] && handle && NETS[kind].handle.test(handle) ? NETS[kind].url(handle) : "");
  /** boutons-icônes pour le profil public */
  function html(data, esc) {
    esc = esc || ((s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
    const out = Object.keys(NETS).map((k) => {
      const h = data && data[k], u = url(k, h); if (!u) return "";
      return `<a class="soc-btn soc-${k}" href="${esc(u)}" target="_blank" rel="noopener noreferrer nofollow" aria-label="${esc(NETS[k].label)} : ${esc(h)}">${window.MAIcons ? window.MAIcons.svg(k, 18) : ""}<span>${esc(k === "snapchat" ? h : "@" + h)}</span></a>`;
    }).join("");
    return out ? `<div class="soc-row">${out}</div>` : "";
  }
  window.MANets = { parse, url, html, label, nets: Object.keys(NETS) };
})();
