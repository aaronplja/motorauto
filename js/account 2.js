/**
 * MOTORAUTO — suppression de compte (Mon garage → Réglages → Zone sensible).
 * Appelle la Cloud Function « deleteAccount » (efface les données puis le compte de connexion), puis déconnecte et renvoie à l'accueil.
 */
(function () {
  "use strict";
  let C = null, busy = false;
  const $ = (id) => document.getElementById(id);
  const word = "SUPPRIMER";

  function open() {
    if (!C || !C.user) return C && C.requireLogin();
    $("delete-confirm").value = ""; $("delete-go").disabled = true; $("delete-error").textContent = "";
    C.openModal($("delete-modal"));
    setTimeout(() => { try { $("delete-confirm").focus(); } catch (_) { /* ignoré */ } }, 50);
  }
  async function run() {
    if (busy) return; busy = true;
    const go = $("delete-go"), err = $("delete-error");
    go.disabled = true; go.textContent = "Suppression en cours…"; err.textContent = "";
    try {
      const fns = window.MAFB && window.MAFB.functions;
      if (!fns) throw new Error("Le serveur de suppression n'est pas disponible pour le moment. Écris-nous via la page Contact.");
      await fns.httpsCallable("deleteAccount")({ confirm: word });
      C.closeModal($("delete-modal"));
      try { await C.auth.signOut(); } catch (_) { /* le compte n'existe plus */ }
      C.Router.go("/", { replace: true });
      C.toast("Ton compte et tes données ont été supprimés. À bientôt sur la piste.", "ok");
    } catch (e) {
      const m = e && e.message ? e.message : "Erreur inconnue";
      err.textContent = /requires-recent-login|unauthenticated/.test(String(e && e.code)) ? "Reconnecte-toi puis réessaie." : m;
      go.textContent = "Supprimer définitivement"; go.disabled = $("delete-confirm").value.trim() !== word;
    } finally { busy = false; }
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    document.addEventListener("click", (e) => {
      if (e.target.closest("#open-delete-account")) { open(); return; }
      if (e.target.closest("#close-delete-modal") || e.target.closest("#delete-cancel")) { C.closeModal($("delete-modal")); return; }
      if (e.target.closest("#delete-go")) run();
    });
    document.addEventListener("input", (e) => { if (e.target && e.target.id === "delete-confirm") $("delete-go").disabled = busy || e.target.value.trim() !== word; });
  });
})();
