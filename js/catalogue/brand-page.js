/**
 * MOTORAUTO — page d'une marque (#/marque/<famille>) : logo, repères, chiffres du catalogue, classement des plus puissantes
 * et tous les modèles. Tout est calculé d'après le catalogue ; les repères historiques (fondateur, année, siège, emblème) viennent
 * des données du quiz et ne s'affichent que lorsqu'on les connaît.
 */
(function () {
  "use strict";
  let C = null;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const $ = (id) => document.getElementById(id);
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const slug = (group) => encodeURIComponent(norm(group));
  const nf = (n) => Number(n).toLocaleString("fr-FR");
  const fyear = (c) => (c.yearRange ? c.yearRange[0] : 0);
  const SHOW = 48;

  /** toutes les voitures d'une famille de marque + le nom le plus courant de cette famille */
  function brandOf(key) {
    const cars = (C.cars || []).filter((c) => norm(c.group || c.brand) === key);
    if (!cars.length) return null;
    const cnt = {}; cars.forEach((c) => { cnt[c.brand] = (cnt[c.brand] || 0) + 1; });
    const name = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || cars[0].group;
    return { key, name, group: cars[0].group, cars };
  }
  function facts(b) {
    const G = window.MAGameCore; if (!G || !G.brandFacts) return null;
    return G.brandFacts(b.name) || G.brandFacts(b.group);
  }
  function stat(label, value, sub) { return `<div class="bp-stat"><b>${C.esc(value)}</b><span>${C.esc(label)}</span>${sub ? `<small>${C.esc(sub)}</small>` : ""}</div>`; }
  function carLabel(c) { return String(c.model || "").replace(/\s*\(.*$/, ""); }

  function render(params) {
    const root = $("brand-root"); if (!root) return;
    const b = brandOf(norm(decodeURIComponent(params.key || "")));
    if (!b) { root.innerHTML = `<div class="empty-note">${T("Cette marque n'existe pas dans le catalogue.")} <a href="#/catalogue">${T("Retour au catalogue")}</a></div>`; return; }
    const esc = C.esc, cars = b.cars.slice().sort((x, y) => fyear(x) - fyear(y) || String(x.model).localeCompare(String(y.model)));
    const powered = cars.filter((c) => c.stats && c.stats.power > 0), top = powered.slice().sort((x, y) => y.stats.power - x.stats.power).slice(0, 10);
    const maxP = top.length ? top[0].stats.power : 0, avgP = powered.length ? Math.round(powered.reduce((s, c) => s + c.stats.power, 0) / powered.length) : 0;
    const fast = cars.filter((c) => c.stats && c.stats.speed > 0).sort((x, y) => y.stats.speed - x.stats.speed)[0];
    const zero = cars.filter((c) => c.stats && c.stats.zero > 0).sort((x, y) => x.stats.zero - y.stats.zero)[0];
    const dated = cars.filter((c) => fyear(c) > 0), first = dated[0], last = dated.slice().sort((x, y) => (y.yearRange ? y.yearRange[1] : 0) - (x.yearRange ? x.yearRange[1] : 0))[0];
    const f = facts(b), initials = String(b.name).replace(/[^A-Za-zÀ-ÿ0-9]/g, "").slice(0, 2).toUpperCase();
    document.title = b.name + " : modèles, moteurs et performances | MOTORAUTO";
    const rows = [];
    if (f) {
      if (f.founder) rows.push([T("Fondateur"), f.founder]);
      if (f.year) rows.push([T("Création"), String(f.year)]);
      if (f.city) rows.push([T("Siège"), f.city]);
      if (f.country) rows.push([T("Pays"), f.country]);
      if (f.emblem) rows.push([T("Emblème"), f.emblem]);
    }
    const hist = [];
    if (first) hist.push(`${T("Dans le catalogue, le plus ancien modèle est la")} <b>${esc(carLabel(first))}</b> (${esc(String(first.years || fyear(first)))}).`);
    if (last && last !== first) hist.push(`${T("Le plus récent est la")} <b>${esc(carLabel(last))}</b> (${esc(String(last.years || ""))}).`);
    root.innerHTML = `
      <header class="page-head bp-head"><div class="bp-hero" data-brand="${esc(b.name)}"><i class="brand-dot" aria-hidden="true">${esc(initials)}</i></div>
        <div class="page-head-text"><span class="status-tag-verified">${T("Marque")}</span><h1 class="page-title">${esc(b.name)}</h1>
        <p class="page-sub">${cars.length} ${cars.length > 1 ? T("modèles") : T("modèle")} ${T("au catalogue")}${maxP ? " · " + T("jusqu'à") + " " + nf(maxP) + " ch" : ""}${f && f.country ? " · " + esc(f.country) : ""}</p></div></header>
      <div class="bp-stats">${stat(T("Modèles"), nf(cars.length))}${maxP ? stat(T("Puissance max"), nf(maxP) + " ch", carLabel(top[0])) : ""}${avgP ? stat(T("Puissance moyenne"), nf(avgP) + " ch") : ""}${fast ? stat(T("Vitesse max"), nf(fast.stats.speed) + " km/h", carLabel(fast)) : ""}${zero ? stat(T("Meilleur 0-100"), String(zero.stats.zero).replace(".", ",") + " s", carLabel(zero)) : ""}</div>
      ${rows.length || hist.length ? `<div class="sheet-section-head">${T("Repères")}</div><div class="bp-facts">${rows.length ? `<dl>${rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl>` : ""}${hist.length ? `<p>${hist.join(" ")}</p>` : ""}</div>` : ""}
      ${top.length ? `<div class="sheet-section-head">${T("Les plus puissantes")}</div><ol class="bp-rank">${top.map((c, i) => `<li><a href="#/voiture/${encodeURIComponent(c.id)}"><span class="bp-n">${i + 1}</span><span class="bp-m"><b>${esc(carLabel(c))}</b><small>${esc(c.years || "")}</small></span><span class="bp-bar" aria-hidden="true"><i style="width:${Math.max(6, Math.round((c.stats.power / maxP) * 100))}%"></i></span><em>${nf(c.stats.power)} ch</em></a></li>`).join("")}</ol>` : ""}
      <div class="sheet-section-head">${T("Tous les modèles")}</div>
      <div class="engine-cars bp-cars" id="bp-cars">${cars.map((c, i) => carTile(c, i)).join("")}</div>
      ${cars.length > SHOW ? `<p class="bp-more"><button type="button" class="cta-btn btn-ghost" id="bp-more">${T("Afficher tous les modèles")} (${cars.length})</button></p>` : ""}`;
    const more = $("bp-more"); if (more) more.onclick = () => { root.querySelectorAll(".bp-cars [hidden]").forEach((el) => { el.hidden = false; }); more.parentElement.remove(); };
    if (window.MAIcons) window.MAIcons.apply(root);
  }
  function carTile(c, i) {
    const esc = C.esc, p = c.stats && c.stats.power;
    return `<a class="engine-car" href="#/voiture/${encodeURIComponent(c.id)}"${i >= SHOW ? " hidden" : ""}><img src="${esc(C.safeUrl(c.image) || "")}" alt="" loading="lazy" data-fallback="car"><span><small>${esc(c.years || "")}</small><b>${esc(carLabel(c))}</b><em>${p ? nf(p) + " ch" : ""}</em></span></a>`;
  }
  window.MABrandPage = { render, slug };
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.Router.register("brand", { enter: (p) => { ctx.catReady.then(() => render(p)).catch(() => render(p)); } });
  });
})();
