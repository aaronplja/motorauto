/**
 * MOTORAUTO — titres de succès affichés à côté du pseudo (salon, profil public).
 *   titles/{uid}  { title: "country:jp" | "decade:1980" | "legends" | "master" | "", updatedAt }   (lecture publique, écriture : le pilote)
 * Les titres se débloquent avec les albums terminés (collections/{uid}.claimed) ; les règles Firestore revérifient.
 */
(function () {
  "use strict";
  const MA = window.MA, FB = window.MAFB;
  if (!MA || !FB) return;
  const G = window.MAGameCore || {}, esc = MA.esc;
  const cache = new Map(), TTL = 300000;
  const LEG = Object.keys(G.LEGENDS || {});
  const KIND = { country: "Collectionneur", decade: "Collectionneur", brand: "Fan", cat: "Spécialiste" };

  function label(key) {
    if (key === "legends") return "Maître des Légendes";
    if (key === "master") return "Grand Collectionneur";
    const m = /^(country|decade|brand|cat):(.+)$/.exec(String(key || "")); if (!m) return "";
    let name = m[2];
    if (m[1] === "country") name = ((G.COUNTRIES || []).find((c) => c.id === name) || {}).label || name;
    else if (m[1] === "decade") name = G.decadeLabel ? G.decadeLabel(Number(name)) : name;
    else if (m[1] === "cat") name = name.charAt(0).toUpperCase() + name.slice(1);
    return KIND[m[1]] + " " + name;
  }
  function tier(key) { return key === "legends" ? "legend" : key === "master" ? "master" : /^(country|decade)/.test(key) ? "gold" : "silver"; }
  function earned(claimed) {
    const c = Array.isArray(claimed) ? claimed : [], out = [];
    if (c.filter((k) => LEG.indexOf(k) >= 0).length >= 5) out.push("legends");
    if (c.length >= 10) out.push("master");
    c.forEach((k) => { if (label(k)) out.push(k); });
    return out;
  }
  const html = (key) => (label(key) ? `<span class="ttl ttl-${tier(key)}" title="Titre de succès">${esc(label(key))}</span>` : "");
  const slot = (uid) => `<span class="ttl-slot" data-ttl-uid="${esc(uid)}"></span>`;

  async function get(uid) {
    const hit = cache.get(uid); if (hit && Date.now() - hit.t < TTL) return hit.v;
    let v = "";
    try { const s = await FB.db.collection("titles").doc(uid).get(); v = s.exists ? String(s.data().title || "") : ""; } catch (_) { /* règles non publiées */ }
    cache.set(uid, { t: Date.now(), v }); return v;
  }
  let queued = false;
  function paint(root) {
    (root || document).querySelectorAll(".ttl-slot[data-ttl-uid]:not([data-ttl-done])").forEach(async (el) => {
      el.dataset.ttlDone = "1";
      const k = await get(el.dataset.ttlUid); if (k) el.innerHTML = html(k);
    });
  }
  function schedule() { if (queued) return; queued = true; setTimeout(() => { queued = false; paint(); }, 80); }
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", schedule);

  async function equip(key) {
    const u = FB.auth.currentUser; if (!u) return false;
    await FB.db.collection("titles").doc(u.uid).set({ title: key || "", updatedAt: FB.FieldValue.serverTimestamp() });
    cache.set(u.uid, { t: Date.now(), v: key || "" });
    document.querySelectorAll('.ttl-slot[data-ttl-uid="' + u.uid + '"]').forEach((el) => { el.innerHTML = html(key); });
    return true;
  }
  async function pickerHtml(claimed) {
    const u = FB.auth.currentUser, list = earned(claimed); if (!u) return "";
    const cur = await get(u.uid);
    if (!list.length) return `<div class="ttl-pick"><b>Titres</b><span class="lap-meta">Termine un album pour débloquer ton premier titre, affiché à côté de ton pseudo.</span></div>`;
    return `<div class="ttl-pick"><b>Mon titre</b><div class="ttl-opts" role="group" aria-label="Choisir mon titre"><button type="button" class="ttl-opt" data-title-set="" aria-pressed="${!cur}">Aucun</button>${list.map((k) => `<button type="button" class="ttl-opt ttl-${tier(k)}" data-title-set="${esc(k)}" aria-pressed="${k === cur}">${esc(label(k))}</button>`).join("")}</div></div>`;
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-title-set]"); if (!b) return;
    try { await equip(b.dataset.titleSet); b.parentNode.querySelectorAll(".ttl-opt").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); MA.toast && MA.toast(b.dataset.titleSet ? "Titre équipé." : "Titre retiré.", "ok"); }
    catch (err) { MA.toast && MA.toast("Impossible : " + err.message + " (règles Firestore à publier ?)", "err"); }
  });
  window.MATitles = { label, earned, html, slot, get, paint, equip, pickerHtml };
})();
