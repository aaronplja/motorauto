"use strict";
/**
 * MOTORAUTO — Cloud Functions.
 *  • Jeu (toujours actif) : tirage des cartes, fabrication, défis, échanges, cartes spéciales, concours photo, série de visites.
 *    Les packs sont tirés ICI, sur le serveur : le navigateur ne peut plus écrire dans les collections de cartes.
 *  • E-mails (facultatifs) : activés seulement si functions/.env contient MAIL_ENABLED=true (voir mail-functions.js et README).
 */
const crypto = require("crypto");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const { createGame } = require("./game");
const STATIC_CATALOG = require("./catalog-static.json");
const { eraseUser } = require("./delete-account");

// Doit correspondre à la région de ta base Firestore (ex. "europe-west1", "us-central1"…) — et à js/firebase-init.js.
const REGION = "europe-west1";
const ADMIN_MAIL = "admin@motorauto.fr";

/** voitures tirables : catalogue local (catalog-static.json) + voitures ajoutées dans l'administration (Firestore) */
async function loadPool() {
  const map = new Map(STATIC_CATALOG.map((c) => [c.id, { id: c.id, power: c.power, name: c.name }]));
  try {
    const snap = await db.collection("motorauto_catalog").limit(1000).get();
    snap.forEach((d) => {
      const x = d.data(), engines = (x.phases || []).flatMap((p) => p.engines || []);
      map.set(d.id, { id: d.id, power: engines.length ? Math.max(...engines.map((e) => Number(e.power) || 0)) : 0, name: ((x.brand || "") + " " + (x.model || "")).trim() });
    });
  } catch (e) { logger.warn("Catalogue Firestore illisible, catalogue local utilisé", e); }
  return Array.from(map.values());
}
async function isAdmin(caller) {
  if (caller.token && (caller.token.admin === true || caller.token.email === ADMIN_MAIL)) return true;
  return (await db.collection("admins").doc(caller.uid).get()).exists;
}
const game = createGame({
  db, now: Date.now, isAdmin, cardPool: loadPool,
  accountCreatedMs: async (uid) => { try { return Date.parse((await admin.auth().getUser(uid)).metadata.creationTime) || 0; } catch (_) { return 0; } },
  ts: () => admin.firestore.FieldValue.serverTimestamp(),
  rng: () => crypto.randomInt(0, 4294967296) / 4294967296
});

/** transforme un gestionnaire du jeu en fonction appelable depuis le site (connexion obligatoire) */
function callable(name) {
  return onCall({ region: REGION, maxInstances: 20 }, async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Connecte-toi pour jouer.");
    const caller = { uid: req.auth.uid, name: req.auth.token.name || "", token: req.auth.token };
    try { return await game[name](caller, req.data || {}); }
    catch (e) {
      if (e && e.isGame) throw new HttpsError(e.code, e.message);
      logger.error("Erreur dans " + name, e);
      throw new HttpsError("internal", "Erreur du serveur, réessaie dans un instant.");
    }
  });
}
["syncCollection", "openPack", "craftCard", "touchStreak", "logAction", "weeklyStatus", "claimChallenge",
  "proposeTrade", "respondTrade", "cancelTrade", "claimSpecial", "claimReferral", "adminGameTool", "adminBroadcast", "adminGrantCard", "adminContest"].forEach((n) => { exports[n] = callable(n); });

// suppression de compte demandée par le pilote (Mon garage → Réglages) : efface ses données puis son compte de connexion
exports.deleteAccount = onCall({ region: REGION, maxInstances: 5, timeoutSeconds: 300 }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Connecte-toi pour supprimer ton compte.");
  if (!req.data || req.data.confirm !== "SUPPRIMER") throw new HttpsError("failed-precondition", "Confirmation manquante.");
  if (req.auth.token.email === ADMIN_MAIL) throw new HttpsError("permission-denied", "Le compte administrateur principal ne peut pas être supprimé ici.");
  try {
    const bucket = (() => { try { return admin.storage().bucket(); } catch (_) { return null; } })();
    await eraseUser({ db, auth: admin.auth(), bucket, uid: req.auth.uid, log: (what, e) => logger.warn("Suppression : " + what, e) });
    return { ok: true };
  } catch (e) {
    logger.error("deleteAccount", e);
    throw new HttpsError("internal", "La suppression n'a pas pu aboutir, réessaie ou contacte l'administrateur.");
  }
});

// notifications push (appareils enregistrés dans push_tokens) à chaque nouvelle notification
exports.pushOnNotification = require("./push").createPush({ db, messaging: admin.messaging(), region: REGION });

// le 1er de chaque mois : clôture du concours photo précédent (gagnant, carte spéciale) et ouverture du suivant
exports.closeDueContests = onSchedule({ schedule: "20 0 * * *", timeZone: "Europe/Paris", region: REGION }, async () => { await game.closeDueContests(); });
exports.monthlyContest = onSchedule({ schedule: "10 0 1 * *", timeZone: "Europe/Paris", region: REGION }, async () => { await game.monthlyContest(); });

if (process.env.MAIL_ENABLED === "true") Object.assign(exports, require("./mail-functions"));
