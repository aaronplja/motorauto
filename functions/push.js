"use strict";
/**
 * MOTORAUTO — notifications push : à chaque nouvelle notification d'un pilote (users/{uid}/notifications/{id}),
 * on envoie un message FCM à tous ses appareils enregistrés (push_tokens), sauf si le pilote a désactivé cette catégorie
 * (notif_prefs/{uid}). Les jetons invalides sont supprimés au passage.
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

const SITE = "https://motorauto.fr";
const CATEGORY = { reply: "reply", mention: "mention", dm: "dm", follow: "follow", like: "like", comment: "comment", event: "event", maint: "maint", game: "game" };
const ALWAYS = ["role", "mute"];          // modération : toujours envoyée

function titleOf(n) {
  const who = n.from || "Un pilote";
  switch (n.type) {
    case "reply": return who + " t'a répondu";
    case "mention": return who + " t'a mentionné";
    case "dm": return "Message de " + who;
    case "follow": return who + " s'est abonné à toi";
    case "like": return who + " aime ta voiture";
    case "comment": return who + " a commenté";
    case "event": return who + " participe à ta sortie";
    case "maint": return "Rappel d'entretien";
    case "role": return "Grade d'administrateur";
    case "mute": return "Modération";
    case "game": return "Jeu MOTORAUTO";
    default: return n.from || "MOTORAUTO";
  }
}
const absolute = (link) => { link = String(link || ""); if (/^https?:/.test(link)) return link; if (link.startsWith("#")) return SITE + "/" + link; return SITE + "/" + link.replace(/^\//, ""); };

function createPush({ db, messaging, region }) {
  return onDocumentCreated({ document: "users/{uid}/notifications/{nid}", region, maxInstances: 20 }, async (event) => {
    const snap = event.data; if (!snap) return;
    const n = snap.data() || {}, uid = event.params.uid;
    if (n.read) return;
    const cat = CATEGORY[n.type];
    if (cat && ALWAYS.indexOf(n.type) < 0) {
      try { const p = await db.collection("notif_prefs").doc(uid).get(); if (p.exists && p.data()[cat] === false) return; } catch (_) { /* pas de préférences : on envoie */ }
    }
    const toks = await db.collection("push_tokens").where("uid", "==", uid).limit(10).get();
    if (toks.empty) return;
    const tokens = toks.docs.map((d) => d.data().token).filter(Boolean);
    const data = { title: titleOf(n).slice(0, 80), body: String(n.text || "").slice(0, 140), link: absolute(n.link), tag: String(n.type || "n") + ":" + String(n.fromUid || "") };
    const res = await messaging.sendEachForMulticast({ tokens, data, webpush: { headers: { Urgency: "high", TTL: "86400" } } });
    const bad = [];
    res.responses.forEach((r, i) => { if (!r.success && r.error && /registration-token-not-registered|invalid-argument|invalid-registration-token/.test(r.error.code || "")) bad.push(toks.docs[i].ref); });
    await Promise.all(bad.map((ref) => ref.delete().catch(() => {})));
    if (res.failureCount) logger.info("Push : " + res.successCount + " envoyés, " + res.failureCount + " échecs (" + bad.length + " jetons supprimés)");
  });
}
module.exports = { createPush, titleOf, absolute };
