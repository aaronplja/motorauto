/**
 * MOTORAUTO — compte : mot de passe oublié, vérification d'e-mail, page 404.
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

  // ---- mot de passe oublié : réponse toujours neutre (on ne révèle pas si l'adresse existe)
  async function forgot() {
    const info = $("forgot-info"), err = $("login-error"), email = $("login-email").value.trim();
    info.textContent = ""; err.textContent = "";
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Saisis d'abord ton adresse e-mail ci-dessus."; try { $("login-email").focus(); } catch (_) { /* ignoré */ } return; }
    const btn = $("forgot-password-btn"); btn.disabled = true;
    try { await C.auth.sendPasswordResetEmail(email); } catch (e) { if (e && e.code === "auth/too-many-requests") { err.textContent = "Trop de tentatives. Réessaie dans quelques minutes."; btn.disabled = false; return; } }
    info.textContent = "Si un compte existe avec cette adresse, un e-mail pour choisir un nouveau mot de passe vient d'être envoyé. Pense à vérifier les courriers indésirables.";
    setTimeout(() => { btn.disabled = false; }, 30000);
  }
  // ---- vérification d'e-mail : bandeau doux dans Réglages (jamais bloquant ; les comptes Google sont déjà vérifiés)
  function needsVerify() {
    const u = C && C.auth.currentUser;
    return !!(u && !u.emailVerified && (u.providerData || []).some((p) => p.providerId === "password"));
  }
  function paintVerify() { const b = $("verify-banner"); if (b) b.hidden = !needsVerify(); }
  async function resend() {
    const u = C.auth.currentUser; if (!u) return;
    const btn = $("verify-resend"); btn.disabled = true;
    try { await u.sendEmailVerification(); C.toast("E-mail de vérification envoyé.", "ok"); }
    catch (e) { C.toast(e && e.code === "auth/too-many-requests" ? "Trop de demandes, réessaie dans quelques minutes." : "Envoi impossible pour le moment.", "err"); }
    setTimeout(() => { btn.disabled = false; }, 30000);
  }
  async function recheck() {
    const u = C.auth.currentUser; if (!u) return;
    try { await u.reload(); } catch (_) { /* ignoré */ }
    paintVerify();
    C.toast(needsVerify() ? "Adresse pas encore vérifiée." : "Adresse vérifiée, merci !", needsVerify() ? "err" : "ok");
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
      if (e.target.closest("#forgot-password-btn")) { forgot(); return; }
      if (e.target.closest("#verify-resend")) { resend(); return; }
      if (e.target.closest("#verify-check")) { recheck(); return; }
      if (e.target.closest("#open-delete-account")) { open(); return; }
      if (e.target.closest("#close-delete-modal") || e.target.closest("#delete-cancel")) { C.closeModal($("delete-modal")); return; }
      if (e.target.closest("#delete-go")) run();
    });
    document.addEventListener("ma:auth", paintVerify);
    document.addEventListener("ma:route", (e) => {
      const d = e.detail || {};
      if (d.name === "settings") paintVerify();
      if (d.name === "notfound" && $("nf-path")) $("nf-path").textContent = "Adresse demandée : " + String((d.params && d.params.path) || d.path || "").slice(0, 120);
    });
    document.addEventListener("input", (e) => { if (e.target && e.target.id === "delete-confirm") $("delete-go").disabled = busy || e.target.value.trim() !== word; });
  });
})();
