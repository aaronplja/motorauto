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
const gameCore = require("./game-core");
const STATIC_CATALOG = require("./catalog-static.json");
const { eraseUser } = require("./delete-account");

// Doit correspondre à la région de ta base Firestore (ex. "europe-west1", "us-central1"…) — et à js/firebase-init.js.
const REGION = "europe-west1";
const ADMIN_MAIL = "admin@motorauto.fr";

/** voitures tirables : catalogue local (catalog-static.json) + voitures ajoutées dans l'administration (Firestore) */
async function loadPool() {
  const map = new Map(STATIC_CATALOG.map((c) => [c.id, { id: c.id, power: c.power, speed: c.speed || 0, zero: c.zero || 0, name: c.name, brand: c.brand || "", category: c.category || "", year: c.year || 0, pics: c.pics || [] }]));
  try {
    const snap = await db.collection("motorauto_catalog").limit(1000).get();
    snap.forEach((d) => {
      const x = d.data(), engines = (x.phases || []).flatMap((p) => p.engines || []);
      map.set(d.id, { id: d.id, power: engines.length ? Math.max(...engines.map((e) => Number(e.power) || 0)) : 0, speed: engines.length ? Math.max(...engines.map((e) => Number(e.speed) || 0)) : 0, zero: Math.min(...engines.map((e) => Number(e.zero) || 0).filter((v) => v > 0), 0) || 0, name: ((x.brand || "") + " " + (x.model || "")).trim(), brand: x.brand || "", category: x.category || "", year: gameCore.yearOf(x), pics: gameCore.picKeys(x) });
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
["syncCollection", "openPack", "craftCard", "upgradeCard", "touchStreak", "buyFreeze", "seasonClaim", "claimWelcome", "clubClash", "logAction", "weeklyStatus", "claimChallenge", "cardChallenges", "claimCardChallenge",
  "proposeTrade", "respondTrade", "cancelTrade", "claimSpecial", "claimReferral", "claimSets", "adminGameTool", "adminBroadcast", "adminGrantCard", "adminContest",
  "fuseCards", "pmPlay", "quizSubmit", "lockCard", "recycleCards", "spinWheel", "openAdvent", "chronoStart", "chronoSubmit", "marketList", "marketBuy", "marketCancel"].forEach((n) => { exports[n] = callable(n); });


// ---- abonnements « voiture / marque » : notifications quand une fiche change, qu'une voiture arrive ou qu'une annonce « Nouveautés » est publiée
const { onDocumentWritten, onDocumentCreated } = require("firebase-functions/v2/firestore");
const quiet = async (key, ms) => { const ref = db.collection("follow_notify").doc(key), s = await ref.get(); if (s.exists && Date.now() - Number(s.data().at || 0) < ms) return true; await ref.set({ at: Date.now() }); return false; };
exports.followCatalog = onDocumentWritten({ document: "motorauto_catalog/{id}", region: REGION }, async (ev) => {
  const after = ev.data && ev.data.after.exists ? ev.data.after.data() : null, before = ev.data && ev.data.before.exists ? ev.data.before.data() : null;
  if (!after) return;
  const id = ev.params.id, label = ((after.brand || "") + " " + (after.model || "")).trim(), fam = gameCore.familyOf(after.brand);
  try {
    if (!before) { if (!(await quiet("new_" + fam, 3600000))) await game.notifyFollowers({ brands: [fam], cars: [id], text: "🆕 Nouvelle voiture au catalogue : " + label, link: "#/voiture/" + encodeURIComponent(id) }); }
    else if (!(await quiet("car_" + id, 6 * 3600000))) await game.notifyFollowers({ cars: [id], text: "🔧 Fiche mise à jour : " + label, link: "#/voiture/" + encodeURIComponent(id) });
  } catch (e) { logger.warn("followCatalog", e); }
});
async function brandsIn(text) {
  const pool = await game._getPool(), fams = Array.from(new Set(pool.list.map((x) => gameCore.familyOf(x.brand)))).filter(Boolean), t = String(text || "").toLowerCase();
  return fams.filter((f) => t.indexOf(f.toLowerCase()) >= 0).slice(0, 2);
}
exports.followPilotCar = onDocumentCreated({ document: "community_cars/{id}", region: REGION }, async (ev) => {
  const c = ev.data && ev.data.data(); if (!c) return;
  try {
    const hit = await brandsIn(c.name); if (!hit.length) return;
    await game.notifyFollowers({ brands: hit, text: "🚗 " + (c.pilot || "Un pilote") + " publie : " + String(c.name || "").slice(0, 60), link: "#/voiture-pilote/" + encodeURIComponent(ev.params.id), exceptUid: c.uid, from: { uid: c.uid, name: c.pilot } });
  } catch (e) { logger.warn("followPilotCar", e); }
});
exports.followSpecialCard = onDocumentCreated({ document: "special_cards/{id}", region: REGION }, async (ev) => {
  const c = ev.data && ev.data.data(); if (!c || c.active === false) return;
  try {
    const hit = await brandsIn((c.name || "") + " " + (c.edition || "")); if (!hit.length) return;
    await game.notifyFollowers({ brands: hit, text: "✨ Nouvelle carte spéciale : " + String(c.name || "").slice(0, 60), link: "#/jouer/collection" });
  } catch (e) { logger.warn("followSpecialCard", e); }
});
exports.newsPublished = onDocumentWritten({ document: "news/{id}", region: REGION }, async (ev) => {
  const after = ev.data && ev.data.after.exists ? ev.data.after.data() : null, before = ev.data && ev.data.before.exists ? ev.data.before.data() : null;
  if (!after || after.published !== true || after.notified === true || (before && before.published === true && before.notified === true)) return;
  try {
    await ev.data.after.ref.update({ notified: true });
    const n = await game.notifyFollowers({ brands: after.brands || [], cars: after.cars || [], text: "🆕 " + String(after.title || "").slice(0, 100), link: "#/nouveautes" });
    logger.info("news notifiées", n);
  } catch (e) { logger.warn("newsPublished", e); }
});

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
exports.wishDigest = onSchedule({ schedule: "40 9 * * *", timeZone: "Europe/Paris", region: REGION }, async () => { await game.wishDigest(); });
exports.cardStatsNightly = onSchedule({ schedule: "50 3 * * *", timeZone: "Europe/Paris", region: REGION }, async () => { await game.computeCardStats(); });
exports.dailyReminder = onSchedule({ schedule: "0 18 * * *", timeZone: "Europe/Paris", region: REGION }, async () => { await game.dailyReminder(); });
exports.monthlyContest = onSchedule({ schedule: "10 0 1 * *", timeZone: "Europe/Paris", region: REGION }, async () => { await game.monthlyContest(); });

// sauvegarde Firestore hebdomadaire (voir functions/backup.js : bucket + droits à configurer une fois)
exports.weeklyBackup = require("./backup").createBackup({ region: REGION });

if (process.env.MAIL_ENABLED === "true") Object.assign(exports, require("./mail-functions"));
