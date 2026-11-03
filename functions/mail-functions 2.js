"use strict";
/**
 * MOTORAUTO — e-mails automatiques (Cloud Functions 2nd gen), activés par MAIL_ENABLED=true dans functions/.env.
 *   1. Connexion       : e-mail de bienvenue (1re connexion) ou de bon retour (après 12 h d'absence).
 *   2. Notifications   : un e-mail à chaque notification du site, plafonné à 6 par heure et par pilote.
 * Le pilote peut tout couper depuis Mon garage → Paramètres (champ emailNotifs du profil).
 */
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const mail = require("./mail");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Doit correspondre à la région de ta base Firestore (ex. "europe-west1", "us-central1"…).
const REGION = "europe-west1";

const SMTP_PASS = defineSecret("SMTP_PASS");
const SMTP_HOST = defineString("SMTP_HOST");
const SMTP_PORT = defineString("SMTP_PORT", { default: "465" });
const SMTP_USER = defineString("SMTP_USER");
const MAIL_FROM = defineString("MAIL_FROM", { default: "MOTORAUTO <no-reply@motorauto.fr>" });
const SITE_URL = defineString("SITE_URL", { default: "https://motorautoireyv.web.app" });

const HOUR = 3600 * 1000;
const MAX_NOTIF_MAILS_PER_HOUR = 6;
const BACK_AFTER_MS = 12 * HOUR;

function transport() {
  const port = Number(SMTP_PORT.value()) || 465;
  return nodemailer.createTransport({
    host: SMTP_HOST.value(), port, secure: port === 465,
    auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() }
  });
}

async function send(to, content) {
  await transport().sendMail({ from: MAIL_FROM.value(), to, subject: content.subject, text: content.text, html: content.html });
}

async function recipient(uid) {
  const [authUser, profile] = await Promise.all([
    admin.auth().getUser(uid).catch(() => null),
    db.collection("users").doc(uid).get()
  ]);
  if (!authUser || !authUser.email) return null;
  const p = profile.exists ? profile.data() : {};
  return { email: authUser.email, name: p.username || authUser.displayName || "", optOut: p.emailNotifs === false };
}

// ---- 1. connexion : bienvenue / bon retour --------------------------------------------------
exports.onLoginMail = onDocumentWritten(
  { document: "login_events/{uid}", region: REGION, secrets: [SMTP_PASS] },
  async (event) => {
    if (!event.data || !event.data.after.exists) return;
    const uid = event.params.uid;
    const stateRef = db.collection("mail_state").doc(uid);
    const now = Date.now();
    const st = (await stateRef.get()).data() || {};
    const first = !st.welcomedAt;
    if (!first && now - (st.lastLoginMailAt || 0) < BACK_AFTER_MS) return;
    const who = await recipient(uid);
    if (!who) return;
    if (!first && who.optOut) return; // le premier message de bienvenue est toujours envoyé
    const siteUrl = SITE_URL.value();
    // on marque AVANT d'envoyer : un doublon d'événement ne renvoie pas le message
    await stateRef.set({ welcomedAt: st.welcomedAt || now, lastLoginMailAt: now }, { merge: true });
    try {
      await send(who.email, first ? mail.welcome({ name: who.name, siteUrl }) : mail.welcomeBack({ name: who.name, siteUrl }));
    } catch (e) { logger.error("Envoi e-mail de connexion impossible", e); }
  }
);

// ---- 2. notifications ---------------------------------------------------------------------
// Seuls les types listés ici envoient un e-mail (« event » : un pilote s'inscrit à ton événement). Messages privés, réponses, likes… : pas d'e-mail.
const MAIL_TYPES = new Set(["event"]);
exports.onNotificationMail = onDocumentCreated(
  { document: "users/{uid}/notifications/{nid}", region: REGION, secrets: [SMTP_PASS] },
  async (event) => {
    if (!event.data) return;
    const uid = event.params.uid;
    const notif = event.data.data();
    if (!MAIL_TYPES.has(notif.type)) return;
    const who = await recipient(uid);
    if (!who || who.optOut) return;
    const stateRef = db.collection("mail_state").doc(uid);
    const now = Date.now();
    const allowed = await db.runTransaction(async (tx) => {
      const st = (await tx.get(stateRef)).data() || {};
      const start = st.notifWindowStart && now - st.notifWindowStart < HOUR ? st.notifWindowStart : now;
      const count = start === st.notifWindowStart ? (st.notifCount || 0) : 0;
      if (count >= MAX_NOTIF_MAILS_PER_HOUR) return false;
      tx.set(stateRef, { notifWindowStart: start, notifCount: count + 1 }, { merge: true });
      return true;
    });
    if (!allowed) return;
    try {
      await send(who.email, mail.notification({ name: who.name, notif, siteUrl: SITE_URL.value() }));
    } catch (e) { logger.error("Envoi e-mail de notification impossible", e); }
  }
);
