"use strict";
/**
 * MOTORAUTO — notifications push : à chaque nouvelle notification d'un pilote (users/{uid}/notifications/{id}),
 * on envoie un message FCM à tous ses appareils enregistrés (push_tokens), sauf si le pilote a désactivé cette catégorie
 * (notif_prefs/{uid}). Les jetons invalides sont supprimés au passage.
 */
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

const SITE = "https://motorauto.fr";
const CATEGORY = { reply: "reply", mention: "mention", dm: "dm", follow: "follow", like: "like", comment: "comment", event: "event", maint: "maint", game: "game" };
/** Heure de Paris en minutes depuis minuit. */
function parisMinutes(date) {
  const p = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date || new Date());
  return (+p.find((x) => x.type === "hour").value) * 60 + (+p.find((x) => x.type === "minute").value);
}
/** La plage peut passer minuit (22:00 → 08:00). Plage vide (from = to) = jamais. */
function inQuietHours(from, to, date) {
  const re = /^(\d\d):(\d\d)$/, a = re.exec(from || ""), b = re.exec(to || "");
  if (!a || !b) return false;
  const f = +a[1] * 60 + +a[2], t = +b[1] * 60 + +b[2], now = parisMinutes(date);
  if (f === t) return false;
  return f < t ? now >= f && now < t : now >= f || now < t;
}
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
  // onDocumentWritten : les messages privés réécrivent la même notification (une ligne par expéditeur) — chaque réécriture doit aussi notifier
  return onDocumentWritten({ document: "users/{uid}/notifications/{nid}", region, maxInstances: 20 }, async (event) => {
    const after = event.data && event.data.after, before = event.data && event.data.before;
    if (!after || !after.exists) return;
    const n = after.data() || {}, uid = event.params.uid;
    if (n.read) return;
    if (before && before.exists) {
      const b = before.data() || {};
      const t = (x) => (x && x.toMillis ? x.toMillis() : 0);
      if (!b.read && t(b.createdAt) === t(n.createdAt) && b.text === n.text) return;   // simple mise à jour sans nouveau message
    }
    const cat = CATEGORY[n.type];
    if (ALWAYS.indexOf(n.type) < 0) {
      try {
        const p = await db.collection("notif_prefs").doc(uid).get();
        if (p.exists) {
          const x = p.data();
          if (cat && x[cat] === false) return;
          if (x.dnd === true && inQuietHours(x.dndFrom, x.dndTo)) return;     // « Ne pas déranger »
        }
      } catch (_) { /* pas de préférences : on envoie */ }
    }
    const toks = await db.collection("push_tokens").where("uid", "==", uid).limit(10).get();
    if (toks.empty) return;
    const tokens = toks.docs.map((d) => d.data().token).filter(Boolean);
    const data = { title: titleOf(n).slice(0, 80), body: String(n.text || "").slice(0, 140), link: absolute(n.link), tag: String(n.type || "n") + ":" + String(n.fromUid || "") };
    const res = await messaging.sendEachForMulticast({ tokens, data, webpush: { headers: { Urgency: "high", TTL: "86400" } }, android: { priority: "high" } });
    const bad = [];
    res.responses.forEach((r, i) => { if (!r.success && r.error && /registration-token-not-registered|invalid-registration-token/.test(r.error.code || "")) bad.push(toks.docs[i].ref); });
    await Promise.all(bad.map((ref) => ref.delete().catch(() => {})));
    if (res.failureCount) logger.info("Push : " + res.successCount + " envoyés, " + res.failureCount + " échecs (" + bad.length + " jetons supprimés)");
  });
}
module.exports = { createPush, titleOf, absolute, inQuietHours };
