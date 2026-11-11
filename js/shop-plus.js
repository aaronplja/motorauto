/**
 * MOTORAUTO — boutique : carte du jour offerte (une COMMUNE gratuite par jour) et packs thématiques temporaires
 * (Le Mans, Rallye, JDM, Muscle cars, Supercars, Youngtimers). Les packs s'ouvrent avec le même écran d'ouverture que les autres.
 * Le serveur vérifie tout (date, coût, voitures du thème) ; ce fichier n'affiche que ce que le serveur acceptera.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  if (!G || !G.THEME_PACKS) return;
  let C = null, busy = false;
  const M = () => window.MACards, T = (s) => (window.MAI18n && window.MAI18n.t ? window.MAI18n.t(s) : s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function themeCars(id) { const cars = (M() && M().pool && M().pool()) || []; return cars.filter((c) => G.themeMatch(id, c) && M().rarityOf(c) !== "mythic"); }
  function giftHtml(doc) {
    const done = doc.dcDay === G.dayKey();
    return `<button type="button" class="cg-gift ${done ? "off" : "ready"}" data-daycard ${done || busy ? "disabled" : ""} aria-label="${T("Carte du jour offerte")}"><span class="cg-gi">🃏</span><b>${done ? T("Carte offerte récupérée") : T("Carte du jour offerte")}</b><small>${done ? T("reviens demain") : T("1 carte commune gratuite")}</small></button>`;
  }
  function packsHtml(doc) {
    const now = Date.now(), act = G.themePacksNow(now), soon = Object.keys(G.THEME_PACKS).filter((id) => !G.themePackActive(id, now)).map((id) => ({ t: G.THEME_PACKS[id], d: G.themePackNext(id, now) })).filter((x) => x.d > 0).sort((a, b) => a.d - b.d).slice(0, 3);
    const tile = (t) => {
      const list = themeCars(t.id), have = list.filter((c) => M().countOf(c.id) > 0).length, ok = doc.dust >= t.cost && list.length >= 6 && !busy, miss = Math.max(0, t.cost - doc.dust);
      return `<button type="button" class="cg-pack ${ok ? "ready" : "off"}" data-pack="shop" data-shop="${t.id}" ${ok ? "" : "disabled"} aria-label="${esc(T("Pack") + " " + T(t.name))} : ${t.cost} ${T("cristaux")}">
        <span class="cg-art" style="${t.style}"><span class="pkart-plate"><small>MOTORAUTO</small><b>${t.icon} ${esc(T(t.name))}</b><em>${T("3 cartes")}</em></span></span>
        <span class="cg-pm"><b>${esc(T("Pack") + " " + T(t.name))}</b><span class="cg-price${doc.dust < t.cost ? " lack" : ""}"><b>${t.cost}</b> ${window.MA.dustIcon(14)}</span></span>
        <span class="cg-have"><small>${have} / ${list.length} ${T("cartes du thème")}</small></span>${!ok && miss ? `<small class="cg-note">${T("il manque")} ${miss}</small>` : ""}</button>`;
    };
    return `<section class="cg-block" id="shop-themed" aria-label="${T("Packs thématiques")}"><header class="cg-bh"><h3>${T("Packs thématiques")}</h3><span class="cg-sub">${T("temporaires · 3 voitures du thème, dont 1 rare ou mieux")}</span></header>
      ${act.length ? `<div class="cg-packgrid">${act.map(tile).join("")}</div>` : `<p class="tcg-hint">${T("Aucun pack thématique en ce moment.")}</p>`}
      ${soon.length ? `<p class="tcg-hint">${soon.map((x) => `${x.t.icon} ${esc(T(x.t.name))} — ${T("dans")} ${x.d} ${T(x.d > 1 ? "jours" : "jour")}`).join(" · ")}</p>` : ""}</section>`;
  }
  function inject() {
    const root = document.getElementById("cards-root"), doc = M() && M().mine && M().mine();
    if (!root || !doc || !C || !C.user) return;
    const free = root.querySelector(".cg-free");
    if (free) {
      const cur = free.querySelector("[data-daycard]"), html = giftHtml(doc);
      if (!cur) free.insertAdjacentHTML("beforeend", html);
      else if (cur.disabled !== (doc.dcDay === G.dayKey() || busy)) cur.outerHTML = html;
      const anchor = root.querySelector('section[aria-label="Packs par pays"]');
      if (anchor && !root.querySelector("#shop-themed")) anchor.insertAdjacentHTML("beforebegin", packsHtml(doc));
    }
  }
  function reveal(r) {
    const car = M().cardObj(r.card.id); if (!car) return;
    const o = document.createElement("div"); o.className = "tcg-overlay on"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", T("Carte du jour offerte"));
    o.innerHTML = `<div class="tcg-stage"><div class="pk3" style="text-align:center"><h2>🃏 ${T("Ta carte du jour")}</h2><div style="display:flex;justify-content:center;margin:12px 0">${M().cardHtml(car, { owned: true, count: 1, lv: 1 })}</div>
      <p class="tcg-hint">${esc(car.brand + " " + String(car.model).replace(/\s*\(.*$/, ""))} · ${r.card.fresh ? T("nouvelle dans ta collection !") : T("déjà possédée : +") + r.card.dust + " " + T("cristaux")}</p>
      <div class="tcg-actions"><button type="button" class="cta-btn fill-btn" data-x>${T("Super")}</button></div></div></div>`;
    document.body.appendChild(o); document.body.classList.add("tcg-open");
    const close = () => { o.remove(); document.body.classList.remove("tcg-open"); document.removeEventListener("keydown", k); }, k = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", k); o.addEventListener("click", (e) => { if (e.target === o || e.target.closest("[data-x]")) close(); });
    const b = o.querySelector("[data-x]"); if (b) b.focus();
  }
  async function claim() {
    if (busy || !C.requireLogin()) return;
    busy = true;
    try { const r = await window.MAGameAPI.call("claimDayCard"); M().applyDoc(r.doc); reveal(r); }
    catch (e) { C.toast(e.message || "Impossible de récupérer la carte.", "err"); }
    finally { busy = false; inject(); }
  }
  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("[data-daycard]")) { e.preventDefault(); claim(); } });
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    let q = 0; new MutationObserver(() => { if (q) return; q = requestAnimationFrame(() => { q = 0; inject(); }); }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("ma:cards", () => { const t = document.getElementById("shop-themed"); if (t) t.remove(); inject(); });
    inject();
  });
})();
