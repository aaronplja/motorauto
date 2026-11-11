"use strict";
/**
 * MOTORAUTO — rôles portés par le jeton de connexion (« custom claims »).
 *   admin          administrateur principal (seul à nommer les autres)
 *   delegatedAdmin administrateur délégué (miroir du document admins/{uid} lu par les règles actuelles)
 *   moderator      modérateur (miroir du document moderators/{uid})
 * Le client ne décide de rien : il lit ses droits dans son jeton, et chaque règle / fonction les revérifie côté serveur.
 * Transition : l'ancien droit (compte admin@motorauto.fr, document admins/{uid}) reste reconnu ;
 * `syncMyClaims` le convertit en claim à la première visite de l'espace admin, puis le jeton suffit.
 */
const ROLES = ["admin", "delegatedAdmin", "moderator"];
const GRANTABLE = ["delegatedAdmin", "moderator"];

function createRoles({ db, admin, onCall, HttpsError, region, adminMail }) {
  const callable = (fn) => onCall({ region, maxInstances: 5 }, async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Connecte-toi d'abord.");
    return fn(req);
  });
  const isSuperToken = (t) => !!t && (t.admin === true || (t.email === adminMail && t.email_verified !== false));

  /** Les droits réels d'un compte, d'après les sources de vérité (jeton, documents admins / moderators). */
  async function computeRoles(uid, token) {
    const sup = isSuperToken(token);
    const [a, m] = await Promise.all([db.collection("admins").doc(uid).get(), db.collection("moderators").doc(uid).get()]);
    return { admin: sup, delegatedAdmin: !sup && a.exists, moderator: m.exists };
  }

  /** Écrit les claims en conservant ceux qui n'ont rien à voir avec les rôles. */
  async function applyClaims(uid, roles) {
    const user = await admin.auth().getUser(uid);
    const next = Object.assign({}, user.customClaims || {});
    ROLES.forEach((r) => { if (roles[r]) next[r] = true; else delete next[r]; });
    const same = ROLES.every((r) => (user.customClaims || {})[r] === (roles[r] ? true : undefined));
    if (!same) await admin.auth().setCustomUserClaims(uid, next);
    return !same;
  }

  const syncMyClaims = callable(async (req) => {
    const roles = await computeRoles(req.auth.uid, req.auth.token);
    const changed = await applyClaims(req.auth.uid, roles);
    return { roles: ROLES.filter((r) => roles[r]), changed };   // si changed : le client rafraîchit son jeton
  });

  const setUserRole = callable(async (req) => {
    if (!isSuperToken(req.auth.token)) throw new HttpsError("permission-denied", "Seul l'administrateur principal peut nommer l'équipe.");
    const d = req.data || {};
    const uid = String(d.uid || "").slice(0, 128), role = String(d.role || ""), on = d.on === true;
    if (!uid || GRANTABLE.indexOf(role) < 0) throw new HttpsError("invalid-argument", "Demande invalide.");
    if (uid === req.auth.uid) throw new HttpsError("failed-precondition", "Tu ne peux pas modifier tes propres droits.");
    let target;
    try { target = await admin.auth().getUser(uid); } catch (_) { throw new HttpsError("not-found", "Compte introuvable."); }
    if (isSuperToken({ admin: (target.customClaims || {}).admin, email: target.email, email_verified: target.emailVerified })) {
      throw new HttpsError("failed-precondition", "Le compte administrateur principal ne se modifie pas ici.");
    }
    const prof = await db.collection("users").doc(uid).get();
    const username = String((prof.exists && prof.data().username) || target.displayName || "Pilote").slice(0, 40);
    const ref = db.collection(role === "delegatedAdmin" ? "admins" : "moderators").doc(uid);
    if (on) await ref.set({ username, grantedBy: req.auth.uid, grantedAt: admin.firestore.FieldValue.serverTimestamp() });
    else await ref.delete();
    const roles = await computeRoles(uid, { admin: (target.customClaims || {}).admin, email: target.email, email_verified: target.emailVerified });
    await applyClaims(uid, roles);
    await db.collection("audit_log").add({ at: admin.firestore.FieldValue.serverTimestamp(), by: req.auth.uid, uid, role, on });
    return { uid, roles: ROLES.filter((r) => roles[r]) };
  });

  const listStaff = callable(async (req) => {
    const roles = await computeRoles(req.auth.uid, req.auth.token);
    if (!roles.admin && !roles.delegatedAdmin) throw new HttpsError("permission-denied", "Réservé à l'administration.");
    const read = async (name) => (await db.collection(name).limit(200).get()).docs.map((x) => ({ uid: x.id, username: String(x.data().username || "Pilote") }));
    const [admins, moderators] = await Promise.all([read("admins"), read("moderators")]);
    return { admins, moderators };
  });

  return { syncMyClaims, setUserRole, listStaff, _computeRoles: computeRoles };
}

module.exports = { createRoles, ROLES, GRANTABLE };
