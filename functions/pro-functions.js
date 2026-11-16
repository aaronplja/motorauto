"use strict";
/**
 * MOTORAUTO PRO — câblage Firebase des fonctions de paiement (activées seulement si functions/.env contient PRO_ENABLED=true).
 *   proCheckout  démarre l'essai gratuit / l'abonnement (page Stripe Checkout)
 *   proPortal    ouvre le portail client Stripe (carte, factures, résiliation)
 *   proCancel    résilie en un clic (l'accès reste ouvert jusqu'à la fin de la période payée)
 *   proWebhook   reçoit les événements de Stripe (URL à déclarer dans le tableau de bord Stripe)
 * Secrets à créer dans Firebase (jamais dans le code) :
 *   firebase functions:secrets:set STRIPE_SECRET_KEY       (clé secrète sk_test_… en test, sk_live_… plus tard)
 *   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET   (« whsec_… » affiché à la création du webhook)
 * Variables dans functions/.env : PRO_ENABLED=true, STRIPE_PRICE_ID=price_…, (facultatif) PRO_ORIGINS=autre-domaine.fr, PRO_REQUIRE_TOS=true
 */
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { createPro } = require("./pro");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const REGION = "europe-west1";
const ADMIN_MAIL = "admin@motorauto.fr";

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const STRIPE_PRICE_ID = defineString("STRIPE_PRICE_ID", { default: "" });
const PRO_ORIGINS = defineString("PRO_ORIGINS", { default: "" });
const PRO_REQUIRE_TOS = defineString("PRO_REQUIRE_TOS", { default: "false" });

let stripeClient = null, stripeFor = "";
const getStripe = () => {
  const key = STRIPE_SECRET_KEY.value();
  if (!stripeClient || stripeFor !== key) { stripeClient = require("stripe")(key); stripeFor = key; }
  return stripeClient;
};
const pro = createPro({
  db, HttpsError, getStripe, getKey: () => STRIPE_SECRET_KEY.value(), getPrice: () => STRIPE_PRICE_ID.value(), adminMail: ADMIN_MAIL,
  ts: (ms) => admin.firestore.Timestamp.fromMillis(ms), extraOrigins: () => PRO_ORIGINS.value().split(",").map((s) => s.trim()).filter(Boolean),
  requireTos: () => PRO_REQUIRE_TOS.value() === "true", logger
});
const opts = { region: REGION, maxInstances: 5, secrets: [STRIPE_SECRET_KEY] };
const wrap = (fn) => async (req) => {
  try { return await fn(req); }
  catch (e) { if (e instanceof HttpsError) throw e; logger.error("PRO", e); throw new HttpsError("internal", "payment unavailable"); }
};

exports.proCheckout = onCall(opts, wrap((req) => pro.checkout(req)));
exports.proPortal = onCall(opts, wrap((req) => pro.portal(req)));
exports.proCancel = onCall(opts, wrap((req) => pro.cancel(req)));

exports.proWebhook = onRequest({ region: REGION, maxInstances: 5, secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).send("POST seulement"); return; }
  let event;
  try { event = getStripe().webhooks.constructEvent(req.rawBody, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET.value()); }
  catch (e) { logger.warn("PRO webhook : signature invalide", e.message); res.status(400).send("signature invalide"); return; }
  try { const r = await pro.handleEvent(event); logger.info("PRO webhook", event.type, r); res.status(200).json({ received: true }); }
  catch (e) { logger.error("PRO webhook", event.type, e); res.status(500).send("erreur"); }   // Stripe réessaiera
});

// compte supprimé → l'abonnement est résilié chez Stripe (pour ne jamais continuer à débiter quelqu'un qui n'a plus de compte)
exports.proAccountDeleted = onDocumentDeleted({ document: "pro_subs/{uid}", region: REGION, secrets: [STRIPE_SECRET_KEY] }, async (ev) => {
  try { const r = await pro.onSubDeleted(ev.data && ev.data.data()); logger.info("PRO compte supprimé", ev.params.uid, r); }
  catch (e) { logger.error("PRO compte supprimé", e); throw e; }
});
