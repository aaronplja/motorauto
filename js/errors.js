/**
 * MOTORAUTO — suivi des erreurs du navigateur.
 *   client_errors/{empreinte}  { msg, src, page, ua, kind, n, last, done?, doneN? }
 * Chaque visiteur envoie au plus quelques erreurs distinctes par session (une écriture +1 par erreur). L'administrateur les lit dans
 * Administration › Erreurs, les marque « résolues » (elles reviennent si elles se reproduisent) ou les supprime.
 */
(function () {
  "use strict";
  const MAX = 10, sentIds = new Set(), pending = [];
  let C = null, count = 0;
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
  const IGNORE = /ResizeObserver loop|Script error\.?$|chrome-extension:|moz-extension:|safari-extension:|Non-Error promise rejection|Load failed$|NetworkError when attempting|The operation is insecure/i;
  const clip = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").slice(0, n);
  function shape(kind, err, extra) {
    const msg = clip(err && err.message ? err.message : err, 200), stack = String((err && err.stack) || ""), m = (extra && extra.src) || ((stack.match(/(?:\/|\()([\w.\-]+\.js)(?:\?[^:\s)]*)?:(\d+)(?::\d+)?\)?/) || []).slice(1, 3).join(":") || "");
    if (!msg || IGNORE.test(msg) || IGNORE.test(stack.slice(0, 300))) return null;
    return { kind: clip(kind, 24), msg, src: clip(m, 80), page: clip((location.hash || "#/").slice(0, 60), 60), ua: clip((navigator.userAgent.match(/(Firefox|Edg|Chrome|Safari)\/[\d.]+/) || [""])[0] + " " + ((/Mobile|Android|iPhone/.test(navigator.userAgent)) ? "mobile" : "bureau"), 60) };
  }
  function send(e) {
    const id = hash(e.kind + "|" + e.msg + "|" + e.src);
    if (sentIds.has(id) || sentIds.size >= MAX) return;
    sentIds.add(id);
    if (!C || !C.db) { pending.push(e); sentIds.delete(id); return; }
    C.db.collection("client_errors").doc(id).set(Object.assign({}, e, { n: C.FieldValue.increment(1), last: C.FieldValue.serverTimestamp() }), { merge: true }).catch(() => {});
  }
  function report(kind, err, extra) { try { const e = shape(kind, err, extra); if (e) send(e); } catch (_) { /* ne jamais casser le site à cause du suivi */ } }
  window.addEventListener("error", (ev) => { if (ev.error || ev.message) report("js", ev.error || ev.message, { src: ev.filename ? String(ev.filename).split("/").pop().split("?")[0] + ":" + (ev.lineno || 0) : "" }); });
  // UX-203 : une action de l'utilisateur qui échoue sans message dédié affiche un message unique « Action impossible, réessaie. »
  let lastGesture = 0, lastToast = 0;
  ["click", "submit", "keydown"].forEach((t) => document.addEventListener(t, () => { lastGesture = Date.now(); }, { capture: true, passive: true }));
  function userFacing(err) {
    try {
      const now = Date.now(); if (now - lastGesture > 3000 || now - lastToast < 10000) return;
      const msg = String((err && err.message) || err || ""); if (!msg || IGNORE.test(msg) || /aborted|cancel/i.test(msg)) return;
      lastToast = now; if (window.MA && window.MA.toast) window.MA.toast(navigator.onLine === false ? "Hors connexion : réessaie au retour du réseau." : "Action impossible, réessaie.", "err");
    } catch (_) { /* ne jamais casser le site à cause du suivi */ }
  }
  window.addEventListener("unhandledrejection", (ev) => { report("promesse", ev.reason); userFacing(ev.reason); });
  window.MAErrors = { report, openCount: () => count };

  // ----- côté administrateur
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : 0);
  let showDone = false;
  async function load() { const s = await C.db.collection("client_errors").orderBy("last", "desc").limit(150).get(); return s.docs.map((d) => Object.assign({ id: d.id }, d.data())); }
  const isOpen = (e) => !e.done || (e.n || 0) > (e.doneN || 0);
  async function render() {
    const root = document.getElementById("errors-root"); if (!root || !C.isAdmin) return;
    root.innerHTML = `<div class="skel-wrap" aria-busy="true"><i class="skel" style="height:64px"></i><i class="skel" style="height:64px"></i><i class="skel" style="height:64px;width:70%"></i></div>`;
    let list = [];
    try { list = await load(); } catch (e) { root.innerHTML = `<div class="empty-note error">Journal illisible : ${C.esc(e.message)}. Publie le fichier firestore.rules complet.</div>`; return; }
    count = list.filter(isOpen).length;
    const open = list.filter(isOpen), shown = showDone ? list.filter((x) => !isOpen(x)) : open, esc = C.esc;
    const fmt = (t) => new Date(t).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    root.innerHTML = `<div class="err-head"><div class="err-count ${open.length ? "bad" : "ok"}"><b>${open.length}</b><span>erreur${open.length > 1 ? "s" : ""} à corriger</span></div>
      <div class="seg" role="group" aria-label="Filtre"><button type="button" data-err-f="open" aria-pressed="${!showDone}">À corriger</button><button type="button" data-err-f="done" aria-pressed="${showDone}">Résolues (${list.length - open.length})</button></div></div>
      <div class="err-list">${shown.length ? shown.map((e) => `<article class="err-row"><div class="err-n"><b>${e.n || 1}×</b><small>${e.kind === "promesse" ? "promesse" : e.kind === "mycar-save" ? "enreg." : "script"}</small></div>
        <div class="err-main"><b>${esc(e.msg || "")}</b><small>${esc(e.src || "?")} · page ${esc(e.page || "")} · ${esc(e.ua || "")} · dernière fois ${e.last ? fmt(tsMs(e.last)) : "?"}</small></div>
        <div class="err-act">${isOpen(e) ? `<button type="button" class="cta-btn btn-ghost compact-btn" data-err-done="${esc(e.id)}" data-n="${e.n || 1}">Résolu</button>` : ""}<button type="button" class="secondary-destructive-btn" data-err-del="${esc(e.id)}">Supprimer</button></div></article>`).join("") : `<div class="empty-note">${showDone ? "Aucune erreur résolue." : "Aucune erreur enregistrée. Tout va bien."}</div>`}</div>`;
    updateBadge();
  }
  function updateBadge() { document.dispatchEvent(new CustomEvent("ma:errors", { detail: { open: count } })); }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    pending.splice(0).forEach(send);
    ctx.Router.register("admin", { enter: (p) => { if (p.tab === "erreurs") render(); } });
    document.addEventListener("click", async (e) => {
      const f = e.target.closest("[data-err-f]"); if (f) { showDone = f.dataset.errF === "done"; render(); return; }
      const d = e.target.closest("[data-err-done]"), x = e.target.closest("[data-err-del]");
      try {
        if (d) { await C.db.collection("client_errors").doc(d.dataset.errDone).update({ done: true, doneN: Number(d.dataset.n) || 0 }); render(); }
        else if (x) { await C.db.collection("client_errors").doc(x.dataset.errDel).delete(); render(); }
      } catch (err) { C.toast("Action impossible : " + err.message, "err"); }
    });
  });
})();
