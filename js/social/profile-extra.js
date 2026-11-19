/**
 * MOTORAUTO — profil enrichi : voiture de rêve, première voiture, ville.
 *   profile_extra/{uid} { dreamCar, firstCar, city, updatedAt }  — lisible par tous, modifiable par son propriétaire.
 * - Édition : bloc « Mes passions » en bas de l'onglet Profil des réglages (et de « Personnaliser le profil »).
 * - Affichage : sous la bio du profil public de chaque pilote. La « voiture de rêve » apparaît aussi sur « Ma carte pilote ».
 */
(function () {
  "use strict";
  let C = null, mine = { dreamCar: "", firstCar: "", city: "" };
  const T = (s) => (window.MAI18n && window.MAI18n.t ? window.MAI18n.t(s) : s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clean = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const cache = new Map();
  async function get(uid) {
    if (cache.has(uid)) return cache.get(uid);
    let d = {}; try { const s = await C.db.collection("profile_extra").doc(uid).get(); d = s.exists ? s.data() : {}; } catch (_) { d = {}; }
    cache.set(uid, d); return d;
  }
  // ---- affichage sur le profil public
  async function paint(uid) {
    const bio = document.getElementById("pub-profile-bio"); if (!bio || !uid) return;
    const old = document.getElementById("pub-extra"); if (old) old.remove();
    const d = await get(uid);
    if (document.getElementById("pub-extra") || !(d.dreamCar || d.firstCar || d.city)) return;
    const rows = [["🌟", "Voiture de rêve", d.dreamCar], ["🔑", "Première voiture", d.firstCar], ["📍", "Ville", d.city]].filter((r) => r[2]);
    const el = document.createElement("dl"); el.id = "pub-extra"; el.className = "pub-extra";
    el.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:10px 0;padding:0";
    el.innerHTML = rows.map((r) => `<div style="background:var(--bg-elevated);border:1px solid var(--stroke-line);border-radius:12px;padding:8px 10px"><dt style="font-size:.75rem;color:var(--color-secondary)">${r[0]} ${T(r[1])}</dt><dd style="margin:2px 0 0;font-weight:600">${esc(d[r[1] === "Voiture de rêve" ? "dreamCar" : r[1] === "Première voiture" ? "firstCar" : "city"])}</dd></div>`).join("");
    bio.insertAdjacentElement("afterend", el);
  }
  // ---- édition
  function form() {
    const host = document.querySelector('#page-settings .tab-panel[data-tab="profil"] .settings-box, .pe-pane[data-pe-pane="profil"] .settings-box');
    if (!host || host.querySelector("#px-form") || !C || !C.user) return;
    const f = document.createElement("form"); f.id = "px-form"; f.className = "px-form"; f.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid var(--stroke-line)";
    f.innerHTML = `<h3 style="margin:0;font-size:1rem">🌟 ${T("Mes passions")}</h3><p style="margin:0;color:var(--color-secondary);font-size:.85rem">${T("Visibles sur ton profil public.")}</p>
      <label>${T("Voiture de rêve")}<input name="dreamCar" maxlength="60" value="${esc(mine.dreamCar)}" placeholder="Porsche 911 GT3 RS"></label>
      <label>${T("Première voiture")}<input name="firstCar" maxlength="60" value="${esc(mine.firstCar)}" placeholder="Renault Clio 2"></label>
      <label>${T("Ville")}<input name="city" maxlength="60" value="${esc(mine.city)}" placeholder="Lyon"></label>
      <button type="submit" class="cta-btn fill-btn compact-btn">${T("Enregistrer mes passions")}</button><small class="px-msg" role="status"></small>`;
    host.appendChild(f);
    f.onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(f), v = { dreamCar: clean(fd.get("dreamCar")), firstCar: clean(fd.get("firstCar")), city: clean(fd.get("city")) }, m = f.querySelector(".px-msg");
      try { await C.db.collection("profile_extra").doc(C.user.uid).set(Object.assign({}, v, { updatedAt: C.FieldValue.serverTimestamp() })); mine = v; cache.set(C.user.uid, v); m.textContent = "✓ " + T("Enregistré."); }
      catch (er) { m.textContent = T("Enregistrement impossible") + " : " + (er.message || ""); }
    };
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    const load = async () => { if (C.user) { mine = Object.assign({ dreamCar: "", firstCar: "", city: "" }, await get(C.user.uid)); } else { mine = { dreamCar: "", firstCar: "", city: "" }; } form(); };
    Promise.resolve(C.authReady).then(load); document.addEventListener("ma:auth", () => { cache.clear(); load(); });
    let q = 0; new MutationObserver(() => { if (q) return; q = requestAnimationFrame(() => { q = 0; form(); }); }).observe(document.body, { childList: true, subtree: true });
    C.Router.register("pilot", { enter: (p) => { setTimeout(() => paint(p.uid), 600); setTimeout(() => paint(p.uid), 1800); } });
  });
  window.MAProfileExtra = { get, mine: () => mine };
})();
