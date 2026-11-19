/**
 * MOTORAUTO — « Mon année » (ADD-209) et bandeau « Vérifie ton e-mail » (ADD-205).
 *  - Réglages › Mon année : récapitulatif de l'année civile (chronos, records, voitures, cartes, circuit favori) + image à partager.
 *  - Bandeau discret quand l'adresse e-mail d'un compte avec mot de passe n'est pas vérifiée (hors Réglages, qui a déjà le sien).
 */
(function () {
  "use strict";
  let C = null;
  const $ = (id) => document.getElementById(id);
  const nf = (n) => new Intl.NumberFormat("fr-FR").format(n);

  // ---------------------------------------------------------------- Mon année
  async function stats() {
    const u = C.auth.currentUser; if (!u) return null;
    const year = new Date().getFullYear(), from = new Date(year, 0, 1).getTime();
    const snap = await C.db.collection("global_laps").where("pilotUid", "==", u.uid).limit(1000).get();
    const laps = snap.docs.map((d) => d.data()).filter((l) => { const t = l.createdAt && l.createdAt.toMillis ? l.createdAt.toMillis() : 0; return t >= from; });
    const byTrack = new Map(), cars = new Set();
    laps.forEach((l) => { const k = l.trackKey || l.track; byTrack.set(k, (byTrack.get(k) || 0) + 1); if (l.carId) cars.add(l.carId); });
    // record personnel = tour le plus rapide sur un circuit, battu au moins une fois dans l'année
    const best = new Map(); laps.forEach((l) => { const k = l.trackKey || l.track; const a = best.get(k) || []; a.push(l.chronoMs); best.set(k, a); });
    let records = 0; best.forEach((a) => { if (a.length) records++; });
    let fav = ""; let n = 0; byTrack.forEach((v, k) => { if (v > n) { n = v; fav = (laps.find((l) => (l.trackKey || l.track) === k) || {}).track || k; } });
    let cards = 0; try { const d = window.MACards && window.MACards.mine && window.MACards.mine(); if (d && d.owned) cards = Object.keys(d.owned).filter((k) => d.owned[k] > 0).length; } catch (_) { /* ignoré */ }
    return { year, name: C.pilotName ? C.pilotName() : "Pilote", laps: laps.length, records, cars: cars.size, cards, track: fav };
  }
  function overlay(html) {
    const o = document.createElement("div"); o.className = "ma-year-ov"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Mon année");
    o.innerHTML = '<div class="ma-year-card">' + html + "</div>"; document.body.appendChild(o);
    const close = () => { o.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    o.addEventListener("click", (e) => { if (e.target === o || e.target.closest("[data-year-close]")) close(); });
    return o;
  }
  async function openYear() {
    if (!C.requireLogin()) return;
    const o = overlay('<p class="lap-meta">Calcul de ton année…</p>');
    let s; try { s = await stats(); } catch (e) { o.remove(); C.toast("Récapitulatif indisponible pour le moment.", "err"); return; }
    if (!s) { o.remove(); return; }
    const esc = C.esc;
    o.firstChild.innerHTML = `<h2 class="ma-year-h">Mon année ${s.year}</h2>
      <div class="ma-year-grid"><div><b>${nf(s.laps)}</b><span>chronos</span></div><div><b>${nf(s.records)}</b><span>circuits roulés</span></div><div><b>${nf(s.cars)}</b><span>voitures différentes</span></div><div><b>${nf(s.cards)}</b><span>cartes collectionnées</span></div></div>
      ${s.track ? `<p class="lap-meta">Circuit favori : <b>${esc(s.track)}</b></p>` : '<p class="lap-meta">Enregistre des chronos dans ton garage pour remplir ton récapitulatif.</p>'}
      <div class="ma-year-act"><button type="button" class="cta-btn fill-btn" data-year-share>Partager en image</button><button type="button" class="cta-btn btn-ghost" data-year-close>Fermer</button></div>`;
    o.querySelector("[data-year-share]").addEventListener("click", () => { if (window.MAShare && window.MAShare.yearImage) window.MAShare.yearImage(s); });
  }

  // ---------------------------------------------------------------- bandeau e-mail
  function needsVerify() { const u = C && C.auth.currentUser; return !!(u && !u.emailVerified && (u.providerData || []).some((p) => p.providerId === "password")); }
  function bar() {
    let b = $("ma-verify-bar");
    if (!b) {
      b = document.createElement("div"); b.id = "ma-verify-bar"; b.setAttribute("role", "status"); b.hidden = true;
      b.innerHTML = '<span>Vérifie ton adresse e-mail pour sécuriser ton compte.</span><button type="button" data-verify-resend>Renvoyer le lien</button><button type="button" data-verify-hide aria-label="Masquer">×</button>';
      document.body.appendChild(b);
      b.addEventListener("click", async (e) => {
        if (e.target.closest("[data-verify-hide]")) { b.hidden = true; try { sessionStorage.setItem("ma_verify_hide", "1"); } catch (_) { /* ignoré */ } return; }
        if (e.target.closest("[data-verify-resend]")) {
          const u = C.auth.currentUser; if (!u) return;
          try { await u.sendEmailVerification(); C.toast("E-mail de vérification envoyé.", "ok"); b.hidden = true; }
          catch (x) { C.toast(x && x.code === "auth/too-many-requests" ? "Trop de demandes, réessaie dans quelques minutes." : "Envoi impossible pour le moment.", "err"); }
        }
      });
    }
    return b;
  }
  function paint() {
    let hidden = false; try { hidden = sessionStorage.getItem("ma_verify_hide") === "1"; } catch (_) { /* ignoré */ }
    bar().hidden = hidden || !needsVerify() || /^#\/reglages/.test(location.hash);
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    document.addEventListener("click", (e) => { if (e.target.closest("#my-year-btn")) openYear(); });
    document.addEventListener("ma:auth", () => setTimeout(paint, 600));
    document.addEventListener("ma:route", () => setTimeout(paint, 300));
    setTimeout(paint, 2500);
  });
})();
