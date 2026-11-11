/**
 * MOTORAUTO — Administration : « Voitures sans image ».
 * Liste les voitures qui n'ont encore que l'image générique, avec un champ d'adresse à côté de chacune pour ajouter les photos très vite
 * (coller le lien https puis Entrée : la ligne se valide et le curseur passe à la voiture suivante). Aperçu de l'image avant d'envoyer,
 * lien de recherche d'images prêt à l'emploi. Les photos sont enregistrées comme avec « + Lien » (Firestore motorauto_catalog).
 */
(function () {
  "use strict";
  let C = null, added = 0, shown = 40;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fixed = new Set();     // voitures traitées pendant cette ouverture
  // « générique » = pas d'image, image par défaut, ou chemin local (img/…) dont le fichier n'existe pas encore.
  // Une fiche qui a déjà une photo (lien https, ou fichier img/ bien présent) n'est PAS listée.
  const remoteGeneric = (u) => !u || u === (window.MA && window.MA.FALLBACK_CAR) || /images\.unsplash\.com\/photo-1503376780353/.test(u);
  const probe = new Map();     // chemin local → true (fichier présent) / false (absent)
  const imgsOf = (car) => (car.images && car.images.length ? car.images : [car.image]).filter(Boolean);
  const isLocal = (u) => /^(img|assets)\//.test(u);
  const hasReal = (u) => !remoteGeneric(u) && (!isLocal(u) || probe.get(u) !== false);
  const needs = (car) => !imgsOf(car).some(hasReal);
  async function probeLocal() {
    const todo = [];
    C.cars.forEach((c) => { if (c.special) return; const im = imgsOf(c); if (im.some((u) => !remoteGeneric(u) && !isLocal(u))) return; im.filter(isLocal).forEach((u) => { if (!probe.has(u) && !todo.includes(u)) todo.push(u); }); });
    const note = document.getElementById("ani-count");
    for (let i = 0; i < todo.length; i += 8) {
      if (!document.getElementById("ani")) return;
      if (note) note.textContent = `Vérification des photos déjà en place… ${Math.round((i / todo.length) * 100)} %`;
      await Promise.all(todo.slice(i, i + 8).map(async (u) => {
        try { const r = await fetch(u, { method: "HEAD", cache: "no-cache" }); probe.set(u, r.ok && /^image\//i.test(r.headers.get("content-type") || "")); }
        catch (_) { probe.set(u, false); }
      }));
    }
  }
  const list = () => C.cars.filter((c) => !c.special && needs(c)).sort((a, b) => (a.brand + " " + a.model).localeCompare(b.brand + " " + b.model, "fr"));

  function css() {
    if (document.getElementById("ani-css")) return;
    const s = document.createElement("style"); s.id = "ani-css";
    s.textContent = `#ani{position:fixed;inset:0;z-index:9300;background:var(--bg-core);color:var(--color-ink);display:flex;flex-direction:column}
      #ani header{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:14px 16px;border-bottom:1px solid var(--stroke-line);background:var(--bg-surface)}
      #ani header h2{margin:0;font-size:1.1rem;flex:1 1 200px}#ani .ani-tools{display:flex;gap:8px;flex-wrap:wrap;width:100%}
      #ani input,#ani select{font:inherit;padding:9px 12px;border-radius:10px;border:1px solid var(--stroke-line);background:var(--bg-elevated);color:var(--color-ink);min-width:0}
      #ani input::placeholder{color:var(--color-muted)}#ani .ani-q{flex:1 1 180px}
      #ani .ani-body{flex:1;overflow:auto;padding:10px 16px 40px;display:flex;flex-direction:column;gap:8px}
      #ani .ani-row{display:grid;grid-template-columns:minmax(140px,1.1fr) minmax(180px,2fr) auto;gap:10px;align-items:center;background:var(--bg-surface);border:1px solid var(--stroke-line);border-radius:12px;padding:10px}
      #ani .ani-row.done{opacity:.5}#ani .ani-row.done .ani-add{display:none}
      #ani .ani-name b{display:block}#ani .ani-name small{color:var(--color-secondary)}
      #ani .ani-in{display:flex;gap:8px;align-items:center;min-width:0}#ani .ani-in input{flex:1}
      #ani .ani-prev{width:54px;height:38px;border-radius:8px;object-fit:cover;background:var(--bg-elevated);flex:none}
      #ani .ani-act{display:flex;gap:6px;align-items:center}#ani a.ani-s{font-size:.8rem;color:var(--accent);text-decoration:none;white-space:nowrap}
      #ani .ani-err{color:#ef4444;font-size:.78rem;grid-column:1/-1}
      @media(max-width:700px){#ani .ani-row{grid-template-columns:1fr}}`;
    document.head.appendChild(s);
  }

  function rows() {
    const q = (document.getElementById("ani-q") || {}).value || "", br = (document.getElementById("ani-br") || {}).value || "";
    const hideDone = !!(document.getElementById("ani-hide") || {}).checked;
    const all = list().concat(C.cars.filter((c) => fixed.has(c.id) && !needs(c))).filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);
    const want = all.filter((c) => (!br || c.brand === br) && (!q || (c.brand + " " + c.model).toLowerCase().includes(q.toLowerCase())) && !(hideDone && fixed.has(c.id)));
    return { all, want };
  }
  function paint() {
    const body = document.querySelector("#ani .ani-body"); if (!body) return;
    const { all, want } = rows(), todo = all.filter((c) => !fixed.has(c.id)).length;
    document.getElementById("ani-count").textContent = `${todo} voiture${todo > 1 ? "s" : ""} sans image · ${added} ajoutée${added > 1 ? "s" : ""} pendant cette session`;
    const sel = document.getElementById("ani-br");
    if (sel && sel.options.length <= 1) { Array.from(new Set(all.map((c) => c.brand))).sort((a, b) => a.localeCompare(b, "fr")).forEach((b) => sel.add(new Option(b, b))); }
    body.innerHTML = want.slice(0, shown).map((c) => `<div class="ani-row ${fixed.has(c.id) ? "done" : ""}" data-id="${esc(c.id)}">
      <div class="ani-name"><b>${esc(c.brand)} ${esc(c.model)}</b><small>${esc(c.years || c.year || "")}${c.category ? " · " + esc(c.category) : ""}</small></div>
      <div class="ani-in"><img class="ani-prev" alt="" hidden><input type="url" inputmode="url" placeholder="Colle le lien https de la photo puis Entrée" aria-label="Adresse de la photo pour ${esc(c.brand + " " + c.model)}" ${fixed.has(c.id) ? "disabled" : ""}></div>
      <div class="ani-act"><a class="ani-s" target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(c.brand + " " + c.model + " " + (c.years || ""))}">Chercher ↗</a><button type="button" class="cta-btn fill-btn compact-btn ani-add">Ajouter</button></div>
      <div class="ani-err" hidden></div></div>`).join("") + (want.length > shown ? `<button type="button" class="cta-btn btn-ghost" id="ani-more">Afficher ${Math.min(40, want.length - shown)} de plus (${want.length - shown} restantes)</button>` : "") + (!want.length ? '<p style="color:var(--color-secondary)">Rien à afficher : toutes les voitures de cette sélection ont une image.</p>' : "");
  }

  async function add(row) {
    const id = row.dataset.id, inp = row.querySelector("input"), err = row.querySelector(".ani-err"), url = inp.value.trim();
    err.hidden = true;
    if (!/^https:\/\//i.test(url)) { err.textContent = "L'adresse doit commencer par https://"; err.hidden = false; inp.focus(); return; }
    const b = row.querySelector(".ani-add"); b.disabled = true;
    const ok = await C.quickAddPhoto(id, url, { noReload: true });
    b.disabled = false;
    if (!ok) { err.textContent = "Enregistrement refusé ou lien invalide : réessaie."; err.hidden = false; return; }
    fixed.add(id); added++; row.classList.add("done"); inp.disabled = true; err.hidden = true; const pv = row.querySelector(".ani-prev"); if (pv) pv.onerror = null;
    document.getElementById("ani-count").textContent = document.getElementById("ani-count").textContent.replace(/^\d+/, (n) => Math.max(0, Number(n) - 1));
    const next = row.nextElementSibling && row.nextElementSibling.querySelector && row.nextElementSibling.querySelector("input:not(:disabled)");
    if (next) { next.focus(); next.scrollIntoView({ block: "center", behavior: "smooth" }); }
  }

  function open() {
    if (!C || !C.isAdmin || document.getElementById("ani")) return;
    css(); added = 0; shown = 40; fixed.clear();
    const d = document.createElement("div"); d.id = "ani"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Voitures sans image");
    d.innerHTML = `<header><h2>🖼️ Voitures sans image</h2><button type="button" class="cta-btn btn-ghost compact-btn" data-ani-x>Fermer</button>
      <div class="ani-tools"><input type="search" class="ani-q" id="ani-q" placeholder="Rechercher une marque ou un modèle…" aria-label="Rechercher"><select id="ani-br" aria-label="Marque"><option value="">Toutes les marques</option></select>
      <label style="display:flex;gap:6px;align-items:center;font-size:.85rem"><input type="checkbox" id="ani-hide"> Masquer les terminées</label></div>
      <small id="ani-count" style="width:100%;color:var(--color-secondary)"></small></header><div class="ani-body"></div>`;
    document.body.appendChild(d); document.body.classList.add("tcg-open");
    const close = async () => { d.remove(); document.body.classList.remove("tcg-open"); document.removeEventListener("keydown", esc2); if (added) { try { await C.reloadCatalog(); } catch (_) {} C.toast(added + " photo" + (added > 1 ? "s ajoutées" : " ajoutée") + " au catalogue.", "ok"); } };
    const esc2 = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", esc2);
    d.addEventListener("click", (e) => {
      if (e.target.closest("[data-ani-x]")) { close(); return; }
      if (e.target.closest("#ani-more")) { shown += 40; paint(); return; }
      const b = e.target.closest(".ani-add"); if (b) add(b.closest(".ani-row"));
    });
    d.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches(".ani-row input")) { e.preventDefault(); add(e.target.closest(".ani-row")); } });
    d.addEventListener("input", (e) => {
      if (e.target.matches("#ani-q")) { shown = 40; paint(); return; }
      if (e.target.matches(".ani-row input")) {
        const row = e.target.closest(".ani-row"), im = row.querySelector(".ani-prev"), u = e.target.value.trim();
        row.querySelector(".ani-err").hidden = true;
        if (/^https:\/\//i.test(u)) { im.hidden = false; im.src = u; im.onerror = () => { im.hidden = true; const er = row.querySelector(".ani-err"); er.textContent = "Cette adresse ne donne pas une image lisible (vérifie que le lien mène bien au fichier image)."; er.hidden = false; }; } else im.hidden = true;
      }
    });
    d.addEventListener("change", (e) => { if (e.target.matches("#ani-br,#ani-hide")) { shown = 40; paint(); } });
    probeLocal().then(() => { if (document.getElementById("ani")) { paint(); const f = d.querySelector(".ani-row input"); if (f) f.focus(); } });
  }

  function sync() {
    const host = document.getElementById("open-site-editor"); if (!host) return;
    let b = document.getElementById("ani-btn");
    if (!(C && C.isAdmin)) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("button"); b.type = "button"; b.id = "ani-btn"; b.className = "cta-btn btn-ghost"; b.textContent = "🖼️ Voitures sans image"; b.onclick = open; host.insertAdjacentElement("afterend", b); }
    const m = document.getElementById("ma-maint-btn"); if (m && b.previousElementSibling !== m && b.previousElementSibling === host) m.insertAdjacentElement("afterend", b);
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    Promise.resolve(C.authReady).then(() => { sync(); setTimeout(sync, 800); });
    document.addEventListener("ma:auth", () => setTimeout(sync, 80));
    document.addEventListener("ma:route", () => setTimeout(sync, 200));
  });
  window.MAAdminNoImg = { open };
})();
