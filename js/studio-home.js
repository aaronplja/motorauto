/**
 * MOTORAUTO — accueil visiteur « Studio » : preuves sociales, carrousel de voitures, « Comment ça marche », records du catalogue.
 * Ne s'affiche que pour les visiteurs non connectés ; le pilote connecté garde son accueil « Garage » (js/garage-home.js).
 * Aussi : petite pluie de confettis quand un pack s'ouvre (le pack lui-même ne change pas).
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, pilots = null;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const nf = (n) => Number(n || 0).toLocaleString("fr-FR");
  const nameOf = (c) => { const b = String(c.brand || ""), m = String(c.model || ""); return [b && m.toLowerCase().startsWith(b.toLowerCase() + " ") ? "" : b, m].filter(Boolean).join(" ").replace(/\s*\(.*$/, ""); };
  const yEnd = (c) => { const m = String(c.years || "").match(/\d{4}/g); return m ? Number(m[m.length - 1]) : 0; };
  const photo = (c) => C.safeUrl(c.image || (c.images && c.images[0])) || "";

  async function countPilots() {
    if (pilots !== null) return pilots;
    try { const s = await Promise.race([C.db.collection("users").limit(500).get(), new Promise((_, no) => setTimeout(no, 2500))]); pilots = s.size; } catch (_) { pilots = 0; }
    return pilots;
  }
  function slide(c, tag) {
    const img = photo(c), p = c.stats && c.stats.power;
    return `<a class="sh-slide" href="#/voiture/${encodeURIComponent(c.id)}">${img ? `<img src="${C.esc(img)}" alt="${C.esc(nameOf(c))}" loading="lazy" data-fallback="car">` : ""}
      <span class="sh-slide-t"><small>${C.esc(tag)}</small><b>${C.esc(nameOf(c))}</b><em>${C.esc(String(c.years || ""))}${p ? " · " + p + " ch" : ""}</em></span></a>`;
  }
  function records() {
    const cars = (C.cars || []).filter((c) => c.stats);
    const best = (key, dir, fmt, label, icon) => {
      const l = cars.filter((c) => c.stats[key] > 0).sort((a, b) => dir * (a.stats[key] - b.stats[key]))[0];
      return l ? `<a class="sh-rec" href="#/voiture/${encodeURIComponent(l.id)}"><span class="sh-rec-i" aria-hidden="true">${icon}</span><small>${T(label)}</small><b>${fmt(l.stats[key])}</b><em>${C.esc(nameOf(l))}</em></a>` : "";
    };
    return best("power", -1, (v) => nf(v) + " ch", "Plus puissante", "⚡") + best("speed", -1, (v) => nf(v) + " km/h", "Plus rapide", "🏁") + best("zero", 1, (v) => v + " s", "0 à 100 le plus court", "⏱");
  }
  async function paint() {
    const page = document.getElementById("page-home"); if (!page || !C || !C.cars || !C.cars.length) return;
    try { await C.authReady; } catch (_) { /* ignoré */ }
    let box = document.getElementById("sh-visitor");
    if (C.user) { if (box) box.remove(); return; }
    if (box) return;
    const anchor = document.getElementById("cod-home") || document.querySelector("#page-home .hero-stage"); if (!anchor) return;
    const cod = document.querySelector("#cod-home .cod-card"), codId = cod ? decodeURIComponent((cod.getAttribute("href") || "").split("/").pop()) : "";
    const today = C.carsById.get(codId);
    const recent = C.cars.filter((c) => photo(c)).sort((a, b) => yEnd(b) - yEnd(a));
    const seen = new Set(), picks = [];
    for (const c of recent) { if (c.id === codId || seen.has(c.brand)) continue; seen.add(c.brand); picks.push(c); if (picks.length === 3) break; }
    box = document.createElement("div"); box.id = "sh-visitor";
    box.innerHTML = `<section class="stage-shell sh-sec" aria-label="${T("Voitures à découvrir")}"><header class="sh-h"><h2 class="sh-t">${T("À découvrir")}</h2><a class="sh-more" href="#/catalogue">${T("Tout le catalogue")} →</a></header>
        <div class="sh-car">${today ? slide(today, T("Voiture du jour")) : ""}${picks.map((c) => slide(c, T("Récente"))).join("")}</div></section>
      <section class="stage-shell sh-sec" aria-label="${T("Comment ça marche")}"><header class="sh-h"><h2 class="sh-t">${T("Comment ça")} <em>${T("marche")}</em></h2></header>
        <ol class="sh-steps">
          <li><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></i><b>${T("Explore")}</b><p>${T("Fiches détaillées, motorisations, générations et records de centaines de sportives.")}</p></li>
          <li><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="12" height="16" rx="2"/><path d="M8 21h10a2 2 0 0 0 2-2V8"/></svg></i><b>${T("Collectionne")}</b><p>${T("Ouvre un pack chaque jour, complète tes albums et améliore tes cartes.")}</p></li>
          <li><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg></i><b>${T("Joue")}</b><p>${T("Quiz, duels, plus ou moins et batailles : grimpe au classement avec les autres pilotes.")}</p></li>
        </ol></section>
      <section class="stage-shell sh-sec" aria-label="${T("Records du catalogue")}"><header class="sh-h"><h2 class="sh-t">${T("Les records du")} <em>${T("catalogue")}</em></h2></header><div class="sh-recs">${records()}</div></section>`;
    anchor.insertAdjacentElement("afterend", box);
  }
  /** confettis : quelques secondes à l'ouverture d'un pack, sans effet si l'animation est réduite */
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const w = document.createElement("div"); w.className = "sh-confetti"; w.setAttribute("aria-hidden", "true");
    const cols = ["#1f6b45", "#7fd6a3", "#e0a82e", "#f6f3ec", "#d9534f"];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement("i");
      p.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % cols.length]};--dx:${(Math.random() - .5) * 240}px;--r:${Math.round(Math.random() * 720 - 360)}deg;animation-delay:${(Math.random() * .35).toFixed(2)}s;animation-duration:${(1.4 + Math.random() * 1.1).toFixed(2)}s`;
      w.appendChild(p);
    }
    document.body.appendChild(w); setTimeout(() => w.remove(), 3200);
  }
  function watchPack() {
    let was = false;
    new MutationObserver(() => {
      const pk = document.getElementById("pk3"), ready = !!pk && !pk.classList.contains("pk3-loading");
      if (ready && !was) confetti(); was = ready;
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx; watchPack();
    setTimeout(paint, 1800);
    setInterval(() => { if (document.getElementById("page-home") && !document.hidden) paint(); }, 5000);
  });
})();
