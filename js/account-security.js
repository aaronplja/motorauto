/**
 * MOTORAUTO — sécurité du compte (Réglages) : changer le mot de passe / l'e-mail (avec ré-authentification)
 * et export RGPD « Télécharger mes données ».
 */
(function () {
  "use strict";
  let C = null;
  const $ = (id) => document.getElementById(id);
  const MSG = {
    "auth/wrong-password": "Mot de passe actuel incorrect.",
    "auth/invalid-credential": "Mot de passe actuel incorrect.",
    "auth/invalid-login-credentials": "Mot de passe actuel incorrect.",
    "auth/weak-password": "Nouveau mot de passe trop faible (8 caractères minimum).",
    "auth/too-many-requests": "Trop de tentatives. Réessaie dans quelques minutes.",
    "auth/email-already-in-use": "Cette adresse est déjà utilisée par un autre compte.",
    "auth/invalid-email": "Adresse e-mail invalide.",
    "auth/requires-recent-login": "Reconnecte-toi puis réessaie.",
    "auth/network-request-failed": "Connexion impossible. Vérifie ton réseau."
  };
  const errText = (e) => MSG[e && e.code] || "Opération impossible pour le moment.";
  const hasPassword = (u) => !!(u && (u.providerData || []).some((p) => p.providerId === "password"));

  function paint() {
    const u = C && C.auth.currentUser, pw = hasPassword(u);
    if (!$("security-box")) return;
    $("security-google").hidden = pw || !u;
    $("security-pw").hidden = !pw; $("security-mail").hidden = !pw;
    if ($("sec-mail") && pw && !$("sec-mail").value) $("sec-mail").placeholder = u.email || "";
  }
  async function reauth(u, pwd) {
    const fb = window.MAFB.firebase;
    await u.reauthenticateWithCredential(fb.auth.EmailAuthProvider.credential(u.email, pwd));
  }
  async function changePassword(e) {
    e.preventDefault();
    const u = C.auth.currentUser, msg = $("sec-pw-msg"), btn = $("sec-pw-btn");
    msg.textContent = ""; msg.classList.add("error-txt"); msg.classList.remove("ok-txt");
    const cur = $("sec-cur").value, n1 = $("sec-new").value, n2 = $("sec-new2").value;
    if (!u || !hasPassword(u)) return;
    if (!cur) { msg.textContent = "Saisis ton mot de passe actuel."; return; }
    if (n1.length < 8) { msg.textContent = "Le nouveau mot de passe doit faire au moins 8 caractères."; return; }
    if (n1 !== n2) { msg.textContent = "Les deux nouveaux mots de passe ne correspondent pas."; return; }
    if (n1 === cur) { msg.textContent = "Le nouveau mot de passe doit être différent de l'actuel."; return; }
    C.MA.busy(btn, true);
    try {
      await reauth(u, cur); await u.updatePassword(n1);
      $("security-pw").reset();
      msg.classList.remove("error-txt"); msg.classList.add("ok-txt"); msg.textContent = "Mot de passe modifié.";
      C.toast("Mot de passe modifié.", "ok");
    } catch (err) { msg.textContent = errText(err); }
    finally { C.MA.busy(btn, false); }
  }
  async function changeEmail(e) {
    e.preventDefault();
    const u = C.auth.currentUser, msg = $("sec-mail-msg"), btn = $("sec-mail-btn");
    msg.textContent = ""; msg.classList.add("error-txt"); msg.classList.remove("ok-txt");
    const mail = $("sec-mail").value.trim(), pwd = $("sec-mail-pw").value;
    if (!u || !hasPassword(u)) return;
    if (!/^\S+@\S+\.\S+$/.test(mail)) { msg.textContent = "Saisis une adresse e-mail valide."; return; }
    if (mail.toLowerCase() === String(u.email || "").toLowerCase()) { msg.textContent = "C'est déjà ton adresse actuelle."; return; }
    if (!pwd) { msg.textContent = "Saisis ton mot de passe actuel."; return; }
    C.MA.busy(btn, true);
    try {
      await reauth(u, pwd); await u.verifyBeforeUpdateEmail(mail);
      $("security-mail").reset();
      msg.classList.remove("error-txt"); msg.classList.add("ok-txt");
      msg.textContent = "Un lien de confirmation vient d'être envoyé à " + mail + ". L'adresse change après clic sur ce lien.";
    } catch (err) { msg.textContent = errText(err); }
    finally { C.MA.busy(btn, false); }
  }

  // ---- export RGPD : lit uniquement ce que les règles autorisent au propriétaire
  const SUBS = ["private", "garage", "maintenance", "costs", "journal", "following", "followers", "notifications"];
  async function exportData() {
    const u = C.auth.currentUser; if (!u) return C.requireLogin();
    const btn = $("export-data-btn"); C.MA.busy(btn, true);
    try {
      const ref = C.db.collection("users").doc(u.uid), out = { exporte_le: new Date().toISOString(), uid: u.uid, email: u.email || null, profil: null };
      const snap = await ref.get(); out.profil = snap.exists ? snap.data() : null;
      for (const name of SUBS) {
        try { const q = await ref.collection(name).get(); out[name] = q.docs.map((d) => Object.assign({ _id: d.id }, d.data())); }
        catch (_) { out[name] = null; }
      }
      const blob = new Blob([JSON.stringify(out, (k, v) => (v && typeof v.toDate === "function" ? v.toDate().toISOString() : v), 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "motorauto-mes-donnees.json";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      C.toast("Ton export est prêt.", "ok");
    } catch (_) { C.toast("Export impossible pour le moment.", "err"); }
    finally { C.MA.busy(btn, false); }
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    document.addEventListener("submit", (e) => {
      if (e.target && e.target.id === "security-pw") changePassword(e);
      else if (e.target && e.target.id === "security-mail") changeEmail(e);
    });
    document.addEventListener("click", (e) => { if (e.target.closest("#export-data-btn")) exportData(); });
    document.addEventListener("ma:auth", paint);
    document.addEventListener("ma:route", (e) => { if (e.detail && e.detail.name === "settings") paint(); });
  });
})();
