/**
 * MOTORAUTO — page Nouveautés (#/nouveautes) : le journal des mises à jour.
 *   Entrées fixes : js/news-seed.js (ajoutées à chaque mise à jour). Annonces publiées depuis cette page par l'administrateur : news/{id}.
 *   Une annonce publiée avec des marques / voitures prévient aussitôt les pilotes qui les suivent (Cloud Function newsPublished).
 *   La pastille « nouveau » du hub Jouer compte les entrées plus récentes que la dernière visite.
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  let C = null, remote = [], at = 0;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const lang = () => (window.MAI18n ? window.MAI18n.lang() : "fr");
  const KINDS = { site: ["Nouveauté", "🆕"], car: ["Voiture", "🚗"], card: ["Carte", "🃏"], event: ["Événement", "📅"], fix: ["Correctif", "🔧"] };
  const SEEN = "ma_news_seen";
  const seenGet = () => { try { return localStorage.getItem(SEEN) || ""; } catch (_) { return ""; } };
  const seenSet = (v) => { try { localStorage.setItem(SEEN, v); } catch (_) { /* ignoré */ } };

  function pick(n) {
    const l = lang(), fr = n.fr || { title: n.title, body: n.body }, en = n.en || { title: n.title_en, body: n.body_en };
    const t = l === "fr" ? fr : (en && en.title ? en : fr);
    return { title: t.title || fr.title || "", body: t.body || fr.body || "" };
  }
  async function loadRemote(force) {
    if (!force && Date.now() - at < 300000) return remote;
    try {
      const q = C && C.isAdmin ? C.db.collection("news").limit(100) : C.db.collection("news").where("published", "==", true).limit(100);
      remote = (await q.get()).docs.map((d) => Object.assign({ id: d.id }, d.data()));
      at = Date.now();
    } catch (_) { remote = []; }
    return remote;
  }
  const all = () => (window.MA_NEWS_SEED || []).map((n) => Object.assign({ seed: true, published: true }, n)).concat(remote).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  async function unread() {
    if (!C) return 0;
    await loadRemote();
    const seen = seenGet();
    return all().filter((n) => n.published !== false && String(n.date || "") > seen).length;
  }
  function body(text) {
    return C.esc(text).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>").replace(/(^|\s)(#\/[\w\-/%]+)/g, (m, a, h) => `${a}<a href="${h}">${h}</a>`)}</p>`).join("");
  }
  function item(n) {
    const k = KINDS[n.kind] || KINDS.site, t = pick(n), fresh = String(n.date || "") > (window.__maNewsSeen || "");
    const tags = (n.brands || []).map((b) => `<a class="wish-chip" href="#/catalogue">${C.esc(b)}</a>`).concat((n.cars || []).map((id) => { const c = C.carsById.get(id); return `<a class="wish-chip" href="#/voiture/${encodeURIComponent(id)}">${C.esc(c ? c.brand + " " + c.model : id)}</a>`; })).join("");
    let date = n.date || ""; try { date = new Date(n.date + "T12:00:00").toLocaleDateString(lang(), { day: "numeric", month: "long", year: "numeric" }); } catch (_) { /* brut */ }
    return `<article class="nw-item${fresh ? " fresh" : ""}${n.published === false ? " draft" : ""}"><header><span class="nw-kind">${T(k[0])}</span><time>${C.esc(date)}</time>${fresh ? `<em class="nw-new">${T("Nouveau")}</em>` : ""}${n.published === false ? `<em class="nw-draft">${T("Brouillon")}</em>` : ""}</header>
      <h3>${C.esc(t.title)}</h3><div class="nw-body">${body(t.body)}</div>${tags ? `<div class="wish-list nw-tags">${tags}</div>` : ""}
      ${C.isAdmin && !n.seed ? `<div class="nw-adm"><button type="button" class="cta-btn btn-ghost compact-btn" data-nw-toggle="${C.esc(n.id)}">${n.published === false ? T("Publier") : T("Dépublier")}</button><button type="button" class="cta-btn btn-ghost compact-btn" data-nw-del="${C.esc(n.id)}">${T("Supprimer")}</button></div>` : ""}</article>`;
  }
  function adminForm() {
    if (!C.isAdmin) return "";
    const brands = Array.from(new Set(C.cars.map((c) => G.familyOf(c.brand)))).sort();
    return `<details class="nw-admin"><summary>＋ ${T("Publier une annonce")} (${T("administrateur")})</summary>
      <form data-nw-form class="nw-form">
        <div class="input-stack"><label for="nw-title">${T("Titre")} (FR)</label><input id="nw-title" maxlength="120" required></div>
        <div class="input-stack"><label for="nw-body">${T("Texte")} (FR)</label><textarea id="nw-body" rows="4" maxlength="2000" required></textarea></div>
        <div class="input-stack"><label for="nw-title-en">Title (EN)</label><input id="nw-title-en" maxlength="120"></div>
        <div class="input-stack"><label for="nw-body-en">Text (EN)</label><textarea id="nw-body-en" rows="3" maxlength="2000"></textarea></div>
        <div class="nw-row"><div class="input-stack"><label for="nw-kind">${T("Type")}</label><select id="nw-kind">${Object.keys(KINDS).map((k) => `<option value="${k}">${T(KINDS[k][0])}</option>`).join("")}</select></div>
          <div class="input-stack"><label for="nw-date">${T("Date")}</label><input id="nw-date" type="date" value="${new Date().toISOString().slice(0, 10)}" required></div></div>
        <div class="input-stack"><label for="nw-brands">${T("Marques concernées")} <small>(${T("séparées par des virgules")} ; ${T("les abonnés seront prévenus")})</small></label><input id="nw-brands" list="nw-brand-list" placeholder="Peugeot, BMW"><datalist id="nw-brand-list">${brands.map((b) => `<option value="${C.esc(b)}">`).join("")}</datalist></div>
        <div class="input-stack"><label for="nw-cars">${T("Voitures concernées")} <small>(${T("identifiants séparés par des virgules")})</small></label><input id="nw-cars" placeholder="peugeot-205-gti, bmw-m3-e46"></div>
        <label class="wf-toggle"><input type="checkbox" id="nw-pub" checked> ${T("Publier tout de suite")}</label>
        <button type="submit" class="cta-btn fill-btn">${T("Enregistrer")}</button></form></details>`;
  }
  async function subsHtml() {
    if (!C.user || !window.MAFollow) return "";
    const d = await window.MAFollow.load();
    const brands = Array.from(new Set(C.cars.map((c) => G.familyOf(c.brand)))).sort((a, b) => a.localeCompare(b, "fr"));
    const chips = d.brands.map((b) => `<button type="button" class="wish-chip rm" data-nw-unfollow="brand" data-val="${C.esc(b)}" title="${T("Ne plus suivre")}">${C.esc(b)} ✕</button>`).concat(d.cars.map((id) => { const c = C.carsById.get(id); return `<button type="button" class="wish-chip rm" data-nw-unfollow="car" data-val="${C.esc(id)}" title="${T("Ne plus suivre")}">${C.esc(c ? c.brand + " " + c.model : id)} ✕</button>`; })).join("");
    return `<section class="cg-block nw-subs"><header class="cg-bh"><h3>${T("Mes abonnements")}</h3><span class="cg-sub">${T("Prévenu quand une fiche change, qu'une voiture de la marque arrive ou qu'une annonce la concerne.")}</span></header>
      <div class="wish-list">${chips || `<span class="lap-meta">${T("Tu ne suis rien pour l'instant. Utilise le bouton « Suivre » sur une fiche voiture, ou choisis une marque :")}</span>`}</div>
      <div class="nw-follow-add"><select id="nw-add-brand" aria-label="${T("Suivre une marque")}"><option value="">${T("Suivre une marque…")}</option>${brands.filter((b) => d.brands.indexOf(b) < 0).map((b) => `<option value="${C.esc(b)}">${C.esc(b)}</option>`).join("")}</select></div></section>`;
  }
  async function render() {
    const root = document.getElementById("news-root"); if (!root) return;
    window.__maNewsSeen = seenGet();
    root.innerHTML = `<div class="tcg-skeleton" aria-busy="true"><i></i><i></i></div>`;
    await loadRemote(true);
    const list = all().filter((n) => n.published !== false || C.isAdmin);
    root.innerHTML = adminForm() + `<div class="nw-list">${list.map(item).join("") || `<div class="empty-note">${T("Rien à signaler pour l'instant.")}</div>`}</div>` + (await subsHtml());
    const latest = all().filter((n) => n.published !== false).map((n) => String(n.date || "")).sort().pop();
    if (latest) seenSet(latest);
    document.dispatchEvent(new CustomEvent("ma:news-seen"));
  }
  async function paintDot() {
    const dot = document.getElementById("news-dot"), btn = document.getElementById("news-btn"); if (!dot || !btn) return;
    let n = 0; try { n = await unread(); } catch (_) { /* pastille facultative */ }
    dot.hidden = !n; dot.textContent = n > 9 ? "9+" : String(n);
    btn.setAttribute("aria-label", n ? `${T("Nouveautés")} (${n})` : T("Nouveautés"));
    if (/^#\/nouveautes/.test(location.hash)) btn.setAttribute("aria-current", "page"); else btn.removeAttribute("aria-current");
  }
  window.MANews = { unread, paint: paintDot };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("news", { enter: () => render() });
    setTimeout(paintDot, 1200);
    document.addEventListener("ma:news-seen", paintDot);
    document.addEventListener("ma:route", () => setTimeout(paintDot, 50));
    document.addEventListener("submit", async (e) => {
      const f = e.target.closest("[data-nw-form]"); if (!f) return;
      e.preventDefault();
      const v = (id) => f.querySelector("#" + id).value.trim(), list = (s) => s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
      const doc = { kind: v("nw-kind"), date: v("nw-date"), title: v("nw-title"), body: v("nw-body"), title_en: v("nw-title-en"), body_en: v("nw-body-en"), brands: list(v("nw-brands")).slice(0, 5), cars: list(v("nw-cars")).filter((x) => /^[a-z0-9][a-z0-9._-]{1,80}$/i.test(x)).slice(0, 10), published: f.querySelector("#nw-pub").checked, notified: false, createdAt: C.FieldValue.serverTimestamp() };
      try { await C.db.collection("news").add(doc); C.toast(T("Annonce enregistrée."), "ok"); await render(); }
      catch (err) { C.toast(T("Enregistrement impossible (règles Firestore à publier ?)"), "err"); }
    });
    document.addEventListener("click", async (e) => {
      let b = e.target.closest("[data-nw-del]");
      if (b) { if (!confirm(T("Supprimer cette annonce ?"))) return; try { await C.db.collection("news").doc(b.dataset.nwDel).delete(); render(); } catch (_) { C.toast(T("Suppression impossible."), "err"); } return; }
      b = e.target.closest("[data-nw-toggle]");
      if (b) { const n = remote.find((x) => x.id === b.dataset.nwToggle); if (!n) return; try { await C.db.collection("news").doc(n.id).update({ published: n.published === false, notified: false }); render(); } catch (_) { C.toast(T("Action impossible."), "err"); } return; }
      b = e.target.closest("[data-nw-unfollow]");
      if (b) { await window.MAFollow.remove(b.dataset.nwUnfollow, b.dataset.val); render(); }
    });
    document.addEventListener("change", async (e) => {
      if (e.target.id !== "nw-add-brand" || !e.target.value) return;
      await window.MAFollow.toggle("brand", e.target.value); render();
    });
  });
})();
