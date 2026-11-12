/**
 * MOTORAUTO — Collection : progression par marque, pays et catégorie + valeur estimée de la collection.
 * Un bouton « 📊 Progression » apparaît à côté de « Recycler » (onglet Collection). Tout est calculé dans le navigateur d'après tes cartes.
 *  - Valeur estimée : somme du coût de fabrication en cristaux de chaque carte possédée (une seule par modèle) ; score = points par rareté.
 *  - Cartes manquantes : pour chaque marque / pays / catégorie, combien tu en as, combien il t'en manque, avec un bouton pour les afficher.
 */
(function () {
  "use strict";
  let C = null, tab = "brand", sortBy = "pct";
  const G = () => window.MAGameCore, M = () => window.MACards;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const POINTS = { common: 1, rare: 3, epic: 10, legendary: 30, shiny: 60, mythic: 100 };
  const nf = (n) => Number(n).toLocaleString("fr-FR");

  function compute() {
    const doc = M().mine(), owned = (doc && doc.owned) || {}, cars = M().pool(), g = G();
    const by = { brand: new Map(), country: new Map(), category: new Map() };
    const bump = (map, key, have, car) => { if (!key) return; const e = map.get(key) || { key, n: 0, have: 0, missing: [] }; e.n++; if (have) e.have++; else e.missing.push(car); map.set(key, e); };
    let value = 0, score = 0, count = 0; const byRar = {};
    cars.forEach((c) => {
      const have = (owned[c.id] || 0) > 0, r = M().rarityOf(c);
      const co = g.countryOf ? g.countryOf(c.brand) : "";
      bump(by.brand, c.brand, have, c); bump(by.country, co, have, c); bump(by.category, c.category || "Autre", have, c);
      if (have) { count++; byRar[r] = (byRar[r] || 0) + 1; const R = g.RAR[r] || {}; value += R.craft || (R.dust || 0) * 4; score += POINTS[r] || 1; }
    });
    return { by, value, score, count, total: cars.length, byRar };
  }
  const countryLabel = (id) => { const k = (G().COUNTRIES || []).find((x) => x.id === id); return k ? k.label : id || "Autre"; };

  function css() {
    if (document.getElementById("cplus-css")) return;
    const s = document.createElement("style"); s.id = "cplus-css";
    s.textContent = `#cplus{position:fixed;inset:0;z-index:9300;background:var(--bg-core);color:var(--color-ink);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding-bottom:env(safe-area-inset-bottom)}
      #cplus header{padding:calc(10px + env(safe-area-inset-top)) 16px 12px;border-bottom:1px solid var(--stroke-line);background:var(--bg-surface);display:flex;flex-direction:column;gap:10px}
      #cplus h2{margin:0;font-size:1.05rem;display:flex;justify-content:space-between;align-items:center;gap:8px}
      #cplus .cp-kpi{display:flex;flex-direction:column;gap:6px}#cplus .cp-kpi .k3,#cplus .cp-kpi .k4{display:grid;gap:6px}#cplus .cp-kpi .k3{grid-template-columns:repeat(3,minmax(0,1fr))}#cplus .cp-kpi .k4{grid-template-columns:repeat(4,minmax(0,1fr))}#cplus .cp-kpi div div{background:var(--bg-elevated);border-radius:12px;padding:8px 4px;text-align:center;min-width:0}#cplus .cp-kpi b{display:block;font-size:1.1rem;line-height:1.2;overflow-wrap:anywhere}#cplus .cp-kpi small{display:block;line-height:1.2;overflow-wrap:anywhere}#cplus small,#cplus .mut{color:var(--color-secondary);font-size:.74rem}
      #cplus .cp-kpi .k4 b{font-size:.98rem}
      #cplus .seg{display:flex;gap:6px;flex-wrap:wrap}#cplus .seg button{border:1px solid var(--stroke-line);background:var(--bg-elevated);color:var(--color-ink);border-radius:999px;padding:7px 14px;font:inherit;font-size:.85rem;cursor:pointer}#cplus .seg button.on{background:var(--accent);color:var(--on-accent);border-color:transparent}
      #cplus .cp-body{padding:10px 16px 40px;display:flex;flex-direction:column;gap:8px;max-width:900px;margin:0 auto;box-sizing:border-box;width:100%}#cplus header>*{max-width:900px;width:100%;margin-inline:auto;box-sizing:border-box}#cplus .cp-top b{min-width:0;overflow-wrap:anywhere}#cplus .cp-top span{white-space:nowrap}#cplus .cp-miss a{max-width:100%;overflow-wrap:anywhere}
      #cplus .cp-row{background:var(--bg-surface);border:1px solid var(--stroke-line);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px}
      #cplus .cp-top{display:flex;justify-content:space-between;gap:8px;align-items:center}#cplus .cp-bar{height:8px;border-radius:99px;background:var(--bg-elevated);overflow:hidden}#cplus .cp-bar i{display:block;height:100%;background:var(--accent);border-radius:99px}
      #cplus .cp-bar i.full{background:#22c55e}#cplus select{font:inherit;padding:8px 10px;border-radius:10px;border:1px solid var(--stroke-line);background:var(--bg-elevated);color:var(--color-ink)}
      #cplus details summary{cursor:pointer;font-size:.8rem;color:var(--color-secondary)}#cplus .cp-miss{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}#cplus .cp-miss a{font-size:.78rem;border:1px solid var(--stroke-line);border-radius:999px;padding:3px 9px;color:var(--color-ink);text-decoration:none}`;
    document.head.appendChild(s);
  }
  function paint() {
    const d = document.getElementById("cplus"); if (!d) return;
    const r = compute(), list = Array.from(r.by[tab].values());
    list.sort((a, b) => sortBy === "name" ? String(a.key).localeCompare(String(b.key), "fr") : sortBy === "left" ? (b.n - b.have) - (a.n - a.have) : (b.have / b.n) - (a.have / a.n) || b.n - a.n);
    const RL = G().RAR;
    d.querySelector(".cp-kpi").innerHTML = `<div class="k3"><div><b>${nf(r.value)}</b><small>Valeur 💎</small></div><div><b>${nf(r.score)}</b><small>Score</small></div><div><b>${r.count} / ${r.total}</b><small>Cartes</small></div></div><div class="k4">` + ["common", "rare", "epic", "legendary"].map((k) => `<div><b>${r.byRar[k] || 0}</b><small>${esc(RL[k].label)}</small></div>`).join("") + "</div>";
    d.querySelector(".cp-body").innerHTML = list.map((e) => { const pct = Math.round(e.have * 100 / e.n), label = tab === "country" ? countryLabel(e.key) : e.key;
      return `<div class="cp-row"><div class="cp-top"><b>${esc(label)}</b><span>${e.have} / ${e.n} · ${pct} %</span></div><div class="cp-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(label)}"><i class="${pct === 100 ? "full" : ""}" style="width:${pct}%"></i></div>
        ${e.missing.length ? `<details><summary>${e.missing.length} manquante${e.missing.length > 1 ? "s" : ""}</summary><div class="cp-miss">${e.missing.slice(0, 80).map((c) => `<a href="#/voiture/${encodeURIComponent(c.id)}">${esc(c.brand + " " + c.model)}</a>`).join("")}${e.missing.length > 80 ? `<span class="mut">… et ${e.missing.length - 80} autres</span>` : ""}</div></details>` : '<span class="mut">Complet 🎉</span>'}</div>`; }).join("");
    d.querySelectorAll("[data-cp-tab]").forEach((b) => b.classList.toggle("on", b.dataset.cpTab === tab));
  }
  function open() {
    if (!C || !C.user || !M() || !M().mine() || document.getElementById("cplus")) return;
    css();
    const d = document.createElement("div"); d.id = "cplus"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Progression de la collection");
    d.innerHTML = `<header><h2>📊 Progression de ta collection <button type="button" class="cta-btn btn-ghost compact-btn" data-cp-x>Fermer</button></h2><div class="cp-kpi"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between"><div class="seg" role="tablist">${[["brand", "Marques"], ["country", "Pays"], ["category", "Catégories"]].map(([k, l]) => `<button type="button" role="tab" data-cp-tab="${k}">${l}</button>`).join("")}</div>
      <select id="cp-sort" aria-label="Trier"><option value="pct">Les plus avancées</option><option value="left">Les plus de manquantes</option><option value="name">Ordre alphabétique</option></select></div>
      <small>La valeur estimée additionne le coût de fabrication de chaque carte que tu possèdes (un exemplaire par modèle).</small></header><div class="cp-body"></div>`;
    document.body.appendChild(d); document.body.classList.add("tcg-open");
    const close = () => { d.remove(); document.body.classList.remove("tcg-open"); document.removeEventListener("keydown", k); };
    const k = (e) => { if (e.key === "Escape") close(); }; document.addEventListener("keydown", k);
    d.addEventListener("click", (e) => { if (e.target.closest("[data-cp-x]") || e.target.closest(".cp-miss a")) { close(); return; } const t = e.target.closest("[data-cp-tab]"); if (t) { tab = t.dataset.cpTab; paint(); } });
    d.querySelector("#cp-sort").addEventListener("change", (e) => { sortBy = e.target.value; paint(); });
    paint();
  }
  function inject() {
    const root = document.getElementById("cards-root"); if (!root) return;
    const rec = root.querySelector(".cg-recycle");
    if (rec && !root.querySelector("[data-cplus]")) { const b = document.createElement("button"); b.type = "button"; b.className = "cg-recycle"; b.dataset.cplus = "1"; b.textContent = "📊 Progression"; b.addEventListener("click", open); rec.insertAdjacentElement("beforebegin", b); }
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    let q = 0; new MutationObserver(() => { if (q) return; q = requestAnimationFrame(() => { q = 0; inject(); }); }).observe(document.body, { childList: true, subtree: true });
    inject();
  });
  window.MACollectionPlus = { open, compute };
})();
