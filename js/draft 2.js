/**
 * MOTORAUTO — brouillons locaux et file d'envoi de l'administration.
 *  - MADraft.watch(...) : ce qui est tapé dans un formulaire est gardé dans le navigateur à chaque frappe ;
 *    après une coupure de courant ou un rechargement, un bandeau propose de reprendre ou de supprimer le brouillon.
 *  - MAOutbox.set(...) : une écriture admin est d'abord mise en file locale, puis envoyée ; si l'envoi échoue (réseau coupé,
 *    onglet fermé), elle repart toute seule au retour du réseau ou à la prochaine ouverture du site.
 */
(function () {
  "use strict";
  const DP = "motorauto_draft_", OB = "motorauto_outbox";
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (_) { /* ignoré */ } }
  };
  const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fieldsOf = (root) => Array.from(root.querySelectorAll("input, select, textarea")).filter((f) => !/^(file|password|submit|button|hidden)$/.test(f.type) && !f.closest(".draft-banner"));
  const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "à l'instant" : m < 60 ? "il y a " + m + " min" : m < 1440 ? "il y a " + Math.round(m / 60) + " h" : "il y a " + Math.round(m / 1440) + " j"; };
  const hasContent = (vals) => vals.some((v) => (typeof v === "string" ? v.trim() !== "" : v === true));

  const D = {
    get(key) { try { return JSON.parse(ls.get(DP + key) || "null"); } catch (_) { return null; } },
    clear(key) { ls.del(DP + key); const b = document.querySelector('.draft-banner[data-key="' + key + '"]'); if (b) b.remove(); },
    /** surveille un formulaire. opts : { key, root, count?(), rebuild?(n), extra?:{get(),set(x)}, base? (valeurs d'origine à ignorer) } */
    watch(opts) {
      const root = opts.root; if (!root) return;
      if (root._draftOff) root._draftOff();
      let applying = false, timer = 0;
      const snap = () => ({ t: Date.now(), n: opts.count ? opts.count() : 0, vals: fieldsOf(root).map((f) => (f.type === "checkbox" || f.type === "radio" ? f.checked : f.value)), extra: opts.extra ? opts.extra.get() : null });
      const save = () => { if (applying) return; const s = snap(); if (!hasContent(s.vals)) { ls.del(DP + opts.key); return; } ls.set(DP + opts.key, JSON.stringify(s)); };
      const onInput = () => { clearTimeout(timer); timer = setTimeout(save, 250); };
      root.addEventListener("input", onInput); root.addEventListener("change", onInput);
      const flush = () => { clearTimeout(timer); save(); };
      window.addEventListener("pagehide", flush);
      root._draftOff = () => { root.removeEventListener("input", onInput); root.removeEventListener("change", onInput); window.removeEventListener("pagehide", flush); root._draftOff = null; };

      const old = D.get(opts.key);
      const baseline = JSON.stringify(fieldsOf(root).map((f) => (f.type === "checkbox" || f.type === "radio" ? f.checked : f.value)));
      if (old && Array.isArray(old.vals) && hasContent(old.vals) && JSON.stringify(old.vals) !== baseline) {
        const bar = document.createElement("div"); bar.className = "draft-banner"; bar.dataset.key = opts.key; bar.setAttribute("role", "status");
        bar.innerHTML = `<span>📝 Brouillon retrouvé <small>(${esc(ago(old.t))})</small></span><span><button type="button" class="cta-btn fill-btn compact-btn" data-draft="restore">Reprendre</button><button type="button" class="cta-btn btn-ghost compact-btn" data-draft="drop">Supprimer</button></span>`;
        root.insertBefore(bar, root.firstChild);
        bar.addEventListener("click", (e) => {
          const a = e.target.closest("[data-draft]"); if (!a) return;
          if (a.dataset.draft === "drop") { D.clear(opts.key); return; }
          applying = true;
          try {
            if (opts.rebuild && old.n) opts.rebuild(old.n);
            if (opts.extra && old.extra) opts.extra.set(old.extra);
            const fs = fieldsOf(root);
            old.vals.forEach((v, i) => { const f = fs[i]; if (!f) return; if (f.type === "checkbox" || f.type === "radio") f.checked = !!v; else f.value = v; f.dispatchEvent(new Event("input", { bubbles: true })); });
          } finally { applying = false; }
          bar.remove(); save();
        });
      }
    }
  };

  // ------------------------------------------------------------------ file d'envoi
  const readQ = () => { try { return JSON.parse(ls.get(OB) || "[]"); } catch (_) { return []; } };
  const writeQ = (q) => { if (q.length) ls.set(OB, JSON.stringify(q)); else ls.del(OB); };
  let flushing = false;
  async function run(db, e) {
    const ref = db.doc(e.path);
    if (e.op === "delete") await ref.delete(); else await ref.set(e.data, e.merge ? { merge: true } : undefined);
  }
  const O = {
    pending: () => readQ().length,
    /** écrit data à path en passant par la file locale ; renvoie une promesse comme db.doc(path).set */
    async set(db, path, data, opts) {
      const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), path, data, merge: !!(opts && opts.merge), op: "set", t: Date.now() };
      let cleanData; try { cleanData = JSON.parse(JSON.stringify(data)); } catch (_) { return db.doc(path).set(data, opts && opts.merge ? { merge: true } : undefined); }   // données non sérialisables (horodatage serveur) : écriture directe
      entry.data = cleanData;
      writeQ(readQ().concat([entry]));
      try { await run(db, entry); writeQ(readQ().filter((x) => x.id !== entry.id)); }
      catch (err) { if (/unavailable|network|offline|deadline/i.test(String(err.code || err.message))) { err.queued = true; } else writeQ(readQ().filter((x) => x.id !== entry.id)); throw err; }
    },
    async flush(db) {
      if (flushing || !db || !navigator.onLine) return 0;
      flushing = true; let done = 0;
      try {
        for (const e of readQ()) { try { await run(db, e); writeQ(readQ().filter((x) => x.id !== e.id)); done++; } catch (err) { if (!/unavailable|network|offline/i.test(String(err.code || err.message))) writeQ(readQ().filter((x) => x.id !== e.id)); else break; } }
      } finally { flushing = false; }
      if (done && window.MA && MA.toast) MA.toast(done + " modification" + (done > 1 ? "s" : "") + " en attente envoyée" + (done > 1 ? "s" : "") + " ✅", "ok");
      return done;
    }
  };

  window.MADraft = D; window.MAOutbox = O;
  const tryFlush = () => { try { if (window.MAFB && MAFB.auth.currentUser && O.pending()) O.flush(MAFB.db); } catch (_) { /* ignoré */ } };
  window.addEventListener("online", tryFlush);
  document.addEventListener("ma:auth", () => setTimeout(tryFlush, 1500));
})();
