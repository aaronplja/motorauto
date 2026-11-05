/**
 * MOTORAUTO — catalogue : bandeau des marques, panneau de filtres qui monte du bas (mobile) avec compteur en direct,
 * pastille « carte possédée / rareté » sur chaque voiture. Ne change aucune logique de filtre : on pilote les contrôles existants.
 */
(function () {
  "use strict";
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const $ = (id) => document.getElementById(id);
  let strip = null, sheetBar = null, backdrop = null;

  function brands() {
    const sel = $("brand-select"); if (!sel) return [];
    return Array.from(sel.options).filter((o) => o.value !== "all").map((o) => o.value);
  }
  function brandStrip() {
    const sel = $("brand-select"), host = document.querySelector("#main-catalog-view .toolbar-cluster"); if (!sel || !host) return;
    const list = brands(); if (!list.length) return;
    if (!strip) { strip = document.createElement("div"); strip.id = "brand-strip"; strip.className = "bs"; strip.setAttribute("role", "group"); strip.setAttribute("aria-label", T("Marques")); host.insertAdjacentElement("beforebegin", strip);
      strip.addEventListener("click", (e) => { const b = e.target.closest("[data-b]"); if (!b) return; const v = b.dataset.b; sel.value = v; sel.dispatchEvent(new Event("change", { bubbles: true })); sync(); });
    }
    const key = list.join("|") + "#" + sel.value;
    if (strip.dataset.k === key) return; strip.dataset.k = key;
    const chip = (v, label, ini) => `<button type="button" class="bs-chip${sel.value === v ? " on" : ""}" data-b="${String(v).replace(/"/g, "&quot;")}" aria-pressed="${sel.value === v}"><span class="bs-ini" aria-hidden="true">${ini}</span><span>${label}</span></button>`;
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    strip.innerHTML = chip("all", T("Toutes"), "★") + list.map((b) => chip(b, esc(b), esc(b.replace(/[^A-Za-zÀ-ÿ0-9]/g, "").slice(0, 2).toUpperCase()))).join("");
    const on = strip.querySelector(".on"); if (on && on.scrollIntoView) { try { strip.scrollTo({ left: Math.max(0, on.offsetLeft - 16), behavior: "smooth" }); } catch (_) { /* ignoré */ } }
  }
  function sync() { if (strip) strip.dataset.k = ""; brandStrip(); }

  /** panneau de filtres avancés : sur mobile il monte du bas, avec un bouton « Voir N voitures » */
  function sheet() {
    const panel = $("adv-panel"), tog = $("adv-toggle"); if (!panel || !tog || sheetBar) return;
    backdrop = document.createElement("div"); backdrop.className = "adv-backdrop"; backdrop.hidden = true; document.body.appendChild(backdrop);
    sheetBar = document.createElement("div"); sheetBar.className = "adv-foot";
    sheetBar.innerHTML = `<button type="button" class="cta-btn btn-ghost" data-adv-reset>${T("Réinitialiser")}</button><button type="button" class="cta-btn fill-btn" data-adv-done><span id="adv-live">…</span></button>`;
    panel.appendChild(sheetBar);
    const mobile = () => window.matchMedia("(max-width: 760px)").matches;
    const live = () => { const t = ($("results-count") || {}).textContent || ""; const m = /(\d[\d\s .]*)/.exec(t); const n = m ? m[1].replace(/[\s .]/g, "") : ""; const el = $("adv-live"); if (el) el.textContent = n ? T("Voir") + " " + n + " " + T("voitures") : T("Voir les voitures"); };
    const rc = $("results-count"); if (rc) new MutationObserver(live).observe(rc, { childList: true, characterData: true, subtree: true });
    const mark = document.createComment("adv-home"); panel.parentNode.insertBefore(mark, panel);
    /* un parent animé crée un repère pour « position: fixed » : sur mobile le panneau passe sous <body> tant qu'il est ouvert */
    const place = () => { if (!panel.hidden && mobile()) { if (panel.parentNode !== document.body) document.body.appendChild(panel); } else if (panel.parentNode === document.body && mark.parentNode) mark.parentNode.insertBefore(panel, mark.nextSibling); };
    const open = () => { place(); backdrop.hidden = !(!panel.hidden && mobile()); document.body.classList.toggle("adv-open", !panel.hidden && mobile()); live(); };
    new MutationObserver(open).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
    const close = () => { if (!panel.hidden) tog.click(); };
    backdrop.addEventListener("click", close);
    sheetBar.addEventListener("click", (e) => { if (e.target.closest("[data-adv-done]")) close(); if (e.target.closest("[data-adv-reset]")) { const r = $("adv-reset"); if (r) r.click(); } });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("adv-open")) close(); });
  }

  /** pastille « possédée » + rareté sur chaque fiche de la liste */
  function badges() {
    const A = window.MACards; if (!A || !A.cardObj) return;
    document.querySelectorAll("#vehicles-grid .car-box[data-id]").forEach((box) => {
      const id = box.dataset.id, wrap = box.querySelector(".car-thumb-wrap"); if (!wrap) return;
      let el = wrap.querySelector(".cx-own"); const mine = A.mine && A.mine(), own = !!(mine && A.isOwned && A.isOwned(id));
      let r = ""; try { const c = A.cardObj(id); r = c ? A.rarityOf(c) : ""; } catch (_) { r = ""; }
      const sig = (own ? "1" : "0") + r; if (el && el.dataset.s === sig) return;
      if (!el) { el = document.createElement("span"); el.className = "cx-own"; wrap.appendChild(el); }
      el.dataset.s = sig; el.className = "cx-own" + (r ? " r-" + r : "") + (own ? " got" : ""); el.hidden = !r;
      el.title = own ? T("Carte possédée") : T("Carte à gagner");
      el.innerHTML = (own ? '<i class="cx-dot"></i>' : "") + (A.RAR && A.RAR[r] ? A.RAR[r].label || r : r);
    });
  }
  let q = 0; const later = () => { if (q) return; q = requestAnimationFrame(() => { q = 0; brandStrip(); badges(); }); };
  function start() {
    if (!$("page-catalog")) return;
    brandStrip(); sheet(); badges();
    const g = $("vehicles-grid"); if (g) new MutationObserver(later).observe(g, { childList: true });
    const sel = $("brand-select"); if (sel) { new MutationObserver(later).observe(sel, { childList: true }); sel.addEventListener("change", later); }
    setInterval(later, 3000);
  }
  (window.MAModules = window.MAModules || []).push(function () { setTimeout(start, 600); });
})();
