/**
 * MOTORAUTO — chat : recherche dans l'historique d'une conversation et messages épinglés dans les clubs.
 *  - 🔍 dans l'en-tête : cherche dans les messages affichés, puis (au clic) dans les 600 derniers messages de la conversation.
 *  - 📌 (président / modérateur du club) : épingle jusqu'à 3 messages, affichés en bandeau en haut du canal du club.
 * S'appuie sur window.MAChatCtl (exposé par chat.js) ; aucune donnée ne change pour les autres conversations.
 */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const T = (s) => (window.MAI18n && window.MAI18n.t ? window.MAI18n.t(s) : s);
  const ctl = () => window.MAChatCtl, fb = () => window.MAFB;
  let curKey = "", clubDoc = null, clubUnsub = null, searchBar = null, pinBar = null, deep = null;
  const keyOf = (c) => (c ? c.type + ":" + c.id : "");

  function css() {
    if (document.getElementById("cplus-chat-css")) return;
    const s = document.createElement("style"); s.id = "cplus-chat-css";
    s.textContent = `.cp-search{display:flex;flex-direction:column;gap:6px;padding:8px 12px;border-bottom:1px solid var(--stroke-line);background:var(--bg-surface)}
      .cp-search input{font:inherit;padding:9px 12px;border-radius:10px;border:1px solid var(--stroke-line);background:var(--bg-elevated);color:var(--color-ink);width:100%;box-sizing:border-box}
      .cp-res{max-height:38vh;overflow:auto;display:flex;flex-direction:column;gap:4px}.cp-res button{font:inherit;text-align:left;border:1px solid var(--stroke-line);background:var(--bg-elevated);color:var(--color-ink);border-radius:10px;padding:7px 10px;cursor:pointer}
      .cp-res small,.cp-search small{color:var(--color-secondary)}.cp-res mark{background:color-mix(in srgb,var(--accent) 35%,transparent);color:inherit;border-radius:3px}
      .cp-more{align-self:flex-start;font:inherit;font-size:.82rem;border:none;background:none;color:var(--accent);cursor:pointer;text-decoration:underline;padding:0}
      .cp-pins{display:flex;flex-direction:column;gap:4px;padding:6px 12px;border-bottom:1px solid var(--stroke-line);background:color-mix(in srgb,var(--accent) 9%,var(--bg-surface))}
      .cp-pin{display:flex;gap:8px;align-items:center;font-size:.85rem;cursor:pointer}.cp-pin span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cp-pin button{border:none;background:none;color:var(--color-secondary);cursor:pointer;font-size:1rem}
      .msg.cp-flash .bubble{outline:2px solid var(--accent);outline-offset:2px;transition:outline-color 1.6s}
      .cp-sbtn{border:none;background:none;color:var(--color-ink);cursor:pointer;font-size:1.15rem;padding:6px 8px;border-radius:8px;margin-left:auto}`;
    document.head.appendChild(s);
  }
  function scrollToMsg(id) {
    const el = document.querySelector('.msg[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]'); if (!el) return false;
    el.scrollIntoView({ block: "center", behavior: "smooth" }); el.classList.add("cp-flash"); setTimeout(() => el.classList.remove("cp-flash"), 2200); return true;
  }
  const hl = (text, q) => { const t = String(text), i = norm(t).indexOf(q); return i < 0 ? esc(t.slice(0, 140)) : esc(t.slice(Math.max(0, i - 30), i)) + "<mark>" + esc(t.slice(i, i + q.length)) + "</mark>" + esc(t.slice(i + q.length, i + q.length + 90)); };
  const dateOf = (m) => { const t = m.timestamp && m.timestamp.toMillis ? m.timestamp.toMillis() : Number(m.timestamp) || 0; return t ? new Date(t).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""; };

  // ------------------------------------------------------------------ recherche
  function toggleSearch() {
    const head = document.querySelector(".conv-head"); if (!head) return;
    if (searchBar) { searchBar.remove(); searchBar = null; deep = null; return; }
    searchBar = document.createElement("div"); searchBar.className = "cp-search";
    searchBar.innerHTML = `<input type="search" placeholder="${T("Rechercher dans cette conversation…")}" aria-label="${T("Rechercher dans cette conversation")}" autocomplete="off"><div class="cp-res" role="list"></div><small class="cp-info"></small>`;
    head.insertAdjacentElement("afterend", searchBar);
    const input = searchBar.querySelector("input"), res = searchBar.querySelector(".cp-res"), info = searchBar.querySelector(".cp-info");
    const run = () => {
      const q = norm(input.value.trim()); if (q.length < 2) { res.innerHTML = ""; info.textContent = T("Au moins 2 lettres."); return; }
      const src = deep || Array.from((ctl() && ctl().msgs && ctl().msgs() ? ctl().msgs() : new Map()).values());
      const hits = src.filter((m) => m.text && norm(m.text).indexOf(q) >= 0).sort((a, b) => (Number(b.timestamp && b.timestamp.toMillis ? b.timestamp.toMillis() : 0)) - (Number(a.timestamp && a.timestamp.toMillis ? a.timestamp.toMillis() : 0))).slice(0, 40);
      res.innerHTML = hits.map((m) => `<button type="button" role="listitem" data-id="${esc(m.id)}"><small>${esc(m.pilot || "Pilote")} · ${esc(dateOf(m))}</small><br>${hl(m.text, q)}</button>`).join("");
      info.innerHTML = hits.length ? `${hits.length} ${T("résultat(s)")}${deep ? ` ${T("dans les")} ${deep.length} ${T("derniers messages")}` : ""}` : T("Aucun résultat.");
      if (!deep) info.insertAdjacentHTML("beforeend", ` · <button type="button" class="cp-more">${T("Chercher plus loin dans l'historique")}</button>`);
    };
    let t = 0; input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 200); });
    searchBar.addEventListener("click", async (e) => {
      const more = e.target.closest(".cp-more");
      if (more) {
        info.textContent = T("Chargement de l'historique…");
        try { const c = ctl().conv(), snap = await ctl().col(c).orderBy("timestamp", "desc").limit(600).get(); deep = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())); run(); }
        catch (err) { info.textContent = T("Impossible de charger l'historique."); }
        return;
      }
      const b = e.target.closest("[data-id]"); if (!b) return;
      if (!scrollToMsg(b.dataset.id)) { const m = (deep || []).find((x) => x.id === b.dataset.id); if (m) info.textContent = T("Message plus ancien que ceux affichés") + " : « " + String(m.text).slice(0, 200) + " »"; }
    });
    input.focus();
  }
  function injectBtn() {
    const head = document.querySelector(".conv-head"); if (!head || head.querySelector(".cp-sbtn")) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "cp-sbtn"; b.textContent = "🔍"; b.setAttribute("aria-label", T("Rechercher dans la conversation")); b.title = T("Rechercher dans la conversation");
    b.addEventListener("click", toggleSearch); head.appendChild(b);
  }

  // ------------------------------------------------------------------ messages épinglés (clubs)
  const isStaff = () => { const u = ctl() && ctl().user && ctl().user(); return !!(u && clubDoc && (clubDoc.ownerUid === u.uid || clubDoc.viceUid === u.uid)); };
  function renderPins() {
    if (pinBar) { pinBar.remove(); pinBar = null; }
    const pins = (clubDoc && Array.isArray(clubDoc.pins) ? clubDoc.pins : []).slice(0, 3);
    if (!pins.length) return;
    const head = (searchBar || document.querySelector(".conv-head")); if (!head) return;
    pinBar = document.createElement("div"); pinBar.className = "cp-pins"; pinBar.setAttribute("aria-label", T("Messages épinglés"));
    pinBar.innerHTML = pins.map((p) => `<div class="cp-pin" data-id="${esc(p.id)}">📌 <span><b>${esc(p.name || "Pilote")}</b> : ${esc(p.text || "")}</span>${isStaff() ? `<button type="button" data-unpin="${esc(p.id)}" aria-label="${T("Désépingler")}" title="${T("Désépingler")}">✕</button>` : ""}</div>`).join("");
    head.insertAdjacentElement("afterend", pinBar);
  }
  async function savePins(list) {
    const c = ctl().conv(); try { await fb().db.collection("clubs").doc(c.id).update({ pins: list.slice(0, 3) }); } catch (e) { alert(T("Impossible d'épingler") + " : " + (e.message || "")); }
  }
  function injectPinButtons() {
    if (!isStaff()) return;
    document.querySelectorAll(".msg .msg-actions:not([data-cpin])").forEach((bar) => {
      bar.dataset.cpin = "1"; const art = bar.closest(".msg"); if (!art) return;
      const b = document.createElement("button"); b.type = "button"; b.dataset.pinmsg = art.dataset.id; b.setAttribute("aria-label", T("Épingler")); b.title = T("Épingler ce message"); b.textContent = "📌"; bar.insertBefore(b, bar.querySelector(".sep") ? bar.querySelector(".sep").nextSibling : bar.firstChild);
    });
  }
  document.addEventListener("click", (e) => {
    const pin = e.target.closest && e.target.closest("[data-pinmsg]");
    if (pin) {
      e.preventDefault(); e.stopPropagation();
      const m = ctl().msgs().get(pin.dataset.pinmsg); if (!m) return;
      const cur = (clubDoc && clubDoc.pins) || []; if (cur.some((p) => p.id === m.id)) return;
      const text = String(m.text || (m.photo || m.image ? "📷 photo" : "message")).slice(0, 140);
      savePins([{ id: m.id, text, name: String(m.pilot || "Pilote").slice(0, 40) }].concat(cur)); return;
    }
    const un = e.target.closest && e.target.closest("[data-unpin]");
    if (un) { e.stopPropagation(); savePins(((clubDoc && clubDoc.pins) || []).filter((p) => p.id !== un.dataset.unpin)); return; }
    const row = e.target.closest && e.target.closest(".cp-pin"); if (row) scrollToMsg(row.dataset.id);
  }, true);

  // ------------------------------------------------------------------ suivi de la conversation affichée
  function sync() {
    const c = ctl() && ctl().conv && ctl().conv(), k = keyOf(c);
    injectBtn(); css();
    if (k !== curKey) {
      curKey = k; deep = null; if (searchBar) { searchBar.remove(); searchBar = null; }
      if (clubUnsub) { clubUnsub(); clubUnsub = null; } clubDoc = null; renderPins();
      if (c && c.type === "club" && fb() && fb().db) {
        clubUnsub = fb().db.collection("clubs").doc(c.id).onSnapshot((d) => { clubDoc = d.exists ? d.data() : null; renderPins(); }, () => {});
      }
    }
    if (c && c.type === "club") injectPinButtons();
  }
  function boot() {
    css();
    new MutationObserver(() => sync()).observe(document.body, { childList: true, subtree: true });
    setInterval(sync, 1500); window.addEventListener("hashchange", () => setTimeout(sync, 100)); sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
