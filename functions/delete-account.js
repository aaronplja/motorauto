"use strict";
/**
 * MOTORAUTO — suppression de compte (RGPD, droit à l'effacement).
 * eraseUser efface tout ce qui est rattaché à un pilote : profil et sous-collections, collection de cartes, publications,
 * likes, commentaires, voitures, événements, annonces, chronos, photos stockées… puis le compte de connexion lui-même.
 * Les fonctions prennent leurs dépendances en paramètres pour rester testables (tests/delete.test.js).
 */
const BY_UID = ["likes", "votes", "comments", "feed", "events", "rsvps", "reactions", "community_cars", "club_members", "club_posts",
  "listings", "contest_entries", "contest_votes", "suggestions", "contact_messages", "global_chat", "push_tokens", "pilot_locations"];
const BY_OTHER = [["global_laps", "pilotUid"], ["reports", "reporterUid"], ["listing_reports", "reporterUid"], ["trades", "fromUid"], ["trades", "toUid"], ["referrals", "referrerUid"]];
const BY_ID = ["collections", "streaks", "wishlists", "weekly", "referrals", "mail_state", "login_events", "mutes", "notif_prefs", "global_seen"];
const STORAGE_PREFIXES = ["avatars/", "car_photos/", "chat_media/", "suggestions/"];

async function deleteQuery(db, q) {
  let n = 0;
  for (;;) {
    const snap = await q.limit(300).get();
    if (snap.empty) return n;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    n += snap.size;
    if (snap.size < 300) return n;
  }
}

async function eraseUser({ db, auth, bucket, uid, log }) {
  const report = { collections: 0, files: 0 };
  const warn = (what, e) => { if (log) log(what, e); };
  for (const c of BY_UID) { try { report.collections += await deleteQuery(db, db.collection(c).where("uid", "==", uid)); } catch (e) { warn(c, e); } }
  for (const [c, f] of BY_OTHER) { try { report.collections += await deleteQuery(db, db.collection(c).where(f, "==", uid)); } catch (e) { warn(c, e); } }
  for (const c of BY_ID) { try { await db.collection(c).doc(uid).delete(); } catch (e) { warn(c, e); } }
  // messages privés envoyés (nécessite l'index de groupe de collections « messages.uid » ; ignoré s'il n'existe pas)
  try { report.collections += await deleteQuery(db, db.collectionGroup("messages").where("uid", "==", uid)); } catch (e) { warn("messages", e); }
  // profil + garage, suivis, entretien, notifications… (sous-collections comprises)
  try {
    if (typeof db.recursiveDelete === "function") await db.recursiveDelete(db.collection("users").doc(uid));
    else await db.collection("users").doc(uid).delete();
  } catch (e) { warn("users", e); }
  if (bucket) for (const p of STORAGE_PREFIXES) { try { await bucket.deleteFiles({ prefix: p + uid + "/" }); report.files++; } catch (e) { warn(p, e); } }
  await auth.deleteUser(uid);
  return report;
}

module.exports = { eraseUser, BY_UID, BY_OTHER, BY_ID };
