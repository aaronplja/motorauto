/**
 * MOTORAUTO — parrainage : lien personnel https://…/?ref=<uid>, +1 pack bonus pour le parrain et le filleul.
 * Le lien est mémorisé à l'arrivée, puis utilisé une seule fois dès que le nouveau compte existe (fonction claimReferral).
 */
(function () {
  "use strict";
  const KEY = "ma_ref";
  const store = { get: () => { try { return localStorage.getItem(KEY) || ""; } catch (_) { return ""; } }, set: (v) => { try { localStorage.setItem(KEY, v); } catch (_) {} }, del: () => { try { localStorage.removeItem(KEY); } catch (_) {} } };
  try { const r = new URLSearchParams(location.search).get("ref"); if (r && /^[A-Za-z0-9_-]{6,128}$/.test(r)) store.set(r); } catch (_) {}
  let C = null, tries = 0;

  const linkFor = (uid) => (/^https?:$/.test(location.protocol) ? location.origin + "/" : "https://motorauto.fr/") + "?ref=" + encodeURIComponent(uid);

  async function tryClaim() {
    const ref = store.get(); if (!ref || !C.user || ref === C.user.uid || !window.MAGameAPI) return;
    try {
      const r = await window.MAGameAPI.call("claimReferral", { ref });
      store.del(); C.toast("Bienvenue ! Tu as reçu 1 pack bonus grâce à " + (r.referrerName || "ton parrain") + ".", "ok");
      if (window.MACards && window.MACards.load) window.MACards.load(true).catch(() => {});
    } catch (e) {
      const m = String(e && e.message || "");
      if (/profil/i.test(m) && tries++ < 3) setTimeout(tryClaim, 4000);
      else if (!/indisponible|serveur|connecte/i.test(m)) store.del();
    }
  }

  async function mount(root) {
    if (!C || !C.user || !root) return;
    let n = 0;
    try { n = (await C.db.collection("referrals").where("referrerUid", "==", C.user.uid).limit(60).get()).size; } catch (_) {}
    if (!root.isConnected) return;
    root.querySelectorAll(".referral-card").forEach((x) => x.remove());
    const link = linkFor(C.user.uid), box = document.createElement("div");
    box.className = "referral-card";
    box.innerHTML = `<div><small>Parrainage</small><b>Invite un ami, vous gagnez chacun 1 pack bonus</b><span>${n ? n + " ami" + (n > 1 ? "s" : "") + " inscrit" + (n > 1 ? "s" : "") + " grâce à toi" : "Partage ton lien personnel"} · 30 filleuls maximum</span></div>
      <div class="referral-actions"><input type="text" readonly value="${C.esc(link)}" aria-label="Ton lien de parrainage"><button type="button" class="cta-btn fill-btn compact-btn" data-ref-copy>Copier le lien</button></div>`;
    root.appendChild(box);
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest && e.target.closest("[data-ref-copy]"); if (!b) return;
    const input = b.parentElement.querySelector("input");
    try { await navigator.clipboard.writeText(input.value); C.toast("Lien copié.", "ok"); } catch (_) { input.select(); C.toast("Copie le lien sélectionné (Ctrl/Cmd + C).", "ok"); }
  });

  window.MAReferral = { mount, linkFor };
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    ctx.auth.onAuthStateChanged((u) => { if (u && store.get()) { tries = 0; setTimeout(tryClaim, 2500); } });
  });
})();
