"use strict";
/**
 * MOTORAUTO — sauvegarde Firestore hebdomadaire (dimanche 03h30, heure de Paris).
 * Exporte toute la base vers gs://<BACKUP_BUCKET>/firestore/AAAA-MM-JJ (par défaut : <projet>-backups).
 * À faire une seule fois (voir README, « Sauvegarde ») :
 *   1. créer le bucket dans Firebase / Google Cloud › Cloud Storage (région europe-west1) ;
 *   2. donner au compte « App Engine default service account » les rôles « Cloud Datastore Import Export Admin » et « Storage Admin » (sur ce bucket).
 * Tant que ce n'est pas fait, la fonction écrit simplement l'erreur dans les journaux : le site n'est pas affecté.
 */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

function createBackup({ region }) {
  return onSchedule({ schedule: "30 3 * * 0", timeZone: "Europe/Paris", region, timeoutSeconds: 540 }, async () => {
    const project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || (admin.app().options || {}).projectId;
    const bucket = process.env.BACKUP_BUCKET || project + "-backups";
    try {
      const client = new admin.firestore.v1.FirestoreAdminClient();
      const stamp = new Date().toISOString().slice(0, 10);
      const [op] = await client.exportDocuments({ name: client.databasePath(project, "(default)"), outputUriPrefix: "gs://" + bucket + "/firestore/" + stamp, collectionIds: [] });
      logger.info("Sauvegarde Firestore lancée", { bucket, stamp, operation: op && op.name });
    } catch (e) {
      logger.error("Sauvegarde Firestore impossible (bucket ou droits manquants ?)", { message: String(e && e.message || e), bucket });
    }
  });
}
module.exports = { createBackup };
