"use strict";
/**
 * MOTORAUTO PRO — abonnement (Stripe Checkout + portail client + webhook). Logique pure et testable : les dépendances sont passées en paramètres
 * (voir pro-functions.js pour le câblage Firebase et tests/pro.test.js pour les tests avec un faux Stripe).
 *
 *   pro_subs/{uid}  { status, accessUntil, trialEnd, cancelAtPeriodEnd, trialUsed, stripeCustomerId, stripeSubscriptionId, mode, updatedAt }
 *                   ÉCRIT UNIQUEMENT ICI (les règles Firestore interdisent toute écriture depuis le navigateur).
 *
 * Principes de sécurité :
 *  • aucune clé dans le code : clé secrète, secret du webhook et identifiant du prix viennent de Firebase (secrets / variables) ;
 *  • le mode test / réel est un double verrou : l'interrupteur « Paiement réel » (pro_config/settings.live) ET le type de clé Stripe
 *    (sk_test_… / sk_live_…) doivent concorder, sinon rien n'est débité ;
 *  • le webhook vérifie la signature Stripe, puis RELIT l'abonnement chez Stripe (source de vérité) : un événement rejoué ou arrivé
 *    dans le désordre ne peut pas donner un accès qu'on n'a pas ;
 *  • l'accès se coupe tout seul : accessUntil est comparé à l'heure par les règles Firestore (aucune tâche planifiée nécessaire) ;
 *  • les administrateurs n'ont pas besoin d'abonnement (accès gratuit, vérifié par les règles) ; ils peuvent quand même tester le parcours.
 */
const DAY = 86400000;
const GRACE_DAYS = 3;                    // paiement refusé : l'accès reste ouvert quelques jours le temps que Stripe réessaie
const DEFAULT_ORIGINS = ["motorauto.fr", "www.motorauto.fr", "motorautoireyv.web.app", "motorautoireyv.firebaseapp.com", "localhost", "127.0.0.1"];

/** date de fin de période, quelle que soit la version de l'API Stripe (champ de l'abonnement ou de son premier élément) */
const periodEnd = (s) => (s.current_period_end != null ? s.current_period_end : s.items && s.items.data && s.items.data[0] && s.items.data[0].current_period_end) || 0;
const periodStart = (s) => (s.current_period_start != null ? s.current_period_start : s.items && s.items.data && s.items.data[0] && s.items.data[0].current_period_start) || 0;

/** Abonnement Stripe → état MOTORAUTO. Fonction pure. */
function mapSubscription(sub, now) {
  now = now || Date.now();
  const end = periodEnd(sub) * 1000, start = periodStart(sub) * 1000, trialEnd = (sub.trial_end || 0) * 1000;
  let status, until;
  switch (sub.status) {
    case "trialing": status = "trialing"; until = trialEnd || end; break;
    case "active": status = "active"; until = end; break;
    case "past_due": status = "past_due"; until = Math.min(end || Infinity, (start || now) + GRACE_DAYS * DAY); break;
    case "canceled": status = "expired"; until = Math.min(end || now, (sub.ended_at || 0) * 1000 || now, now); break;
    default: status = "expired"; until = 0;   // unpaid, incomplete, incomplete_expired, paused : pas d'accès
  }
  if (!Number.isFinite(until)) until = 0;
  return { status, accessUntil: until, trialEnd: trialEnd || 0, cancelAtPeriodEnd: !!sub.cancel_at_period_end || !!sub.cancel_at, hadTrial: !!sub.trial_end };
}

/** « sk_test_… » → test, « sk_live_… » / « rk_live_… » → live */
const keyMode = (key) => (/^(sk|rk)_live_/.test(String(key || "")) ? "live" : /^(sk|rk)_test_/.test(String(key || "")) ? "test" : "");

function createPro({ db, HttpsError, getStripe, getKey, getPrice, adminMail, ts, now, extraOrigins, requireTos, logger }) {
  const clock = now || (() => Date.now());
  const log = logger || { info() {}, warn() {}, error() {} };
  const settingsRef = () => db.collection("pro_config").doc("settings");
  const subRef = (uid) => db.collection("pro_subs").doc(uid);

  async function isAdmin(auth) {
    const t = auth.token || {};
    if (t.admin === true || t.delegatedAdmin === true || (adminMail && t.email === adminMail && t.email_verified !== false)) return true;
    try { return (await db.collection("admins").doc(auth.uid).get()).exists; } catch (_) { return false; }
  }
  async function settings() {
    const s = await settingsRef().get();
    const d = s.exists ? s.data() : {};
    return { signups: d.signups === true, live: d.live === true, priceEur: Number(d.priceEur) || 5, trialDays: d.trialDays == null ? 90 : Math.max(0, Math.min(365, Number(d.trialDays) || 0)) };
  }
  /** le mode de la clé Stripe doit être celui de l'interrupteur : sinon on refuse (jamais de débit réel par accident) */
  function checkMode(cfg) {
    const km = keyMode(getKey());
    if (!km) throw new HttpsError("failed-precondition", "stripe key missing");
    if (km !== (cfg.live ? "live" : "test")) throw new HttpsError("failed-precondition", "payment mode mismatch");
    return km;
  }
  function baseUrl(origin) {
    try {
      const u = new URL(String(origin || ""));
      const extra = typeof extraOrigins === "function" ? extraOrigins() : extraOrigins || [];
      const hosts = DEFAULT_ORIGINS.concat(extra);
      if (hosts.includes(u.hostname) && /^https?:$/.test(u.protocol)) return u.origin + "/";
    } catch (_) { /* origine invalide */ }
    return "https://motorauto.fr/";
  }

  /** Enregistre l'état d'un abonnement Stripe dans pro_subs/{uid} (le seul endroit qui y écrit). */
  async function applySubscription(sub, uidHint, mode) {
    let uid = (sub.metadata && sub.metadata.uid) || uidHint || "";
    if (!uid && sub.customer) {
      const q = await db.collection("pro_subs").where("stripeCustomerId", "==", typeof sub.customer === "string" ? sub.customer : sub.customer.id).limit(1).get();
      if (!q.empty) uid = q.docs[0].id;
    }
    if (!uid) { log.warn("pro: abonnement sans pilote", sub.id); return null; }
    const m = mapSubscription(sub, clock());
    const cur = await subRef(uid).get(), old = cur.exists ? cur.data() : {};
    const doc = Object.assign({}, old, {
      status: m.status, accessUntil: ts(m.accessUntil), cancelAtPeriodEnd: m.cancelAtPeriodEnd,
      trialUsed: !!(old.trialUsed || m.hadTrial), plan: "monthly", mode: mode || old.mode || "test",
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : (sub.customer && sub.customer.id) || old.stripeCustomerId || "",
      stripeSubscriptionId: sub.id, updatedAt: ts(clock())
    });
    if (m.trialEnd) doc.trialEnd = ts(m.trialEnd); else if (old.trialEnd) doc.trialEnd = old.trialEnd;
    await subRef(uid).set(doc);
    return { uid, status: m.status };
  }

  // ------------------------------------------------------------------ appels depuis le site
  async function checkout(req) {
    if (!req.auth) throw new HttpsError("unauthenticated", "Connecte-toi d'abord.");
    const uid = req.auth.uid, cfg = await settings(), admin = await isAdmin(req.auth);
    if (!cfg.signups && !admin) throw new HttpsError("failed-precondition", "signups closed");
    const mode = checkMode(cfg), stripe = getStripe(), price = getPrice();
    if (!price) throw new HttpsError("failed-precondition", "stripe price missing");
    const cur = await subRef(uid).get(), old = cur.exists ? cur.data() : {};
    const until = old.accessUntil && old.accessUntil.toMillis ? old.accessUntil.toMillis() : 0;
    if (["trialing", "active", "past_due"].includes(old.status) && until > clock()) throw new HttpsError("already-exists", "already subscribed");
    let customer = old.stripeCustomerId;
    if (!customer) {
      customer = (await stripe.customers.create({ email: req.auth.token.email || undefined, metadata: { uid } })).id;
      await subRef(uid).set(Object.assign({}, old, { stripeCustomerId: customer, mode, updatedAt: ts(clock()) }));
    }
    const base = baseUrl(req.data && req.data.origin), trial = cfg.trialDays > 0 && !old.trialUsed;
    const params = {
      mode: "subscription", customer, client_reference_id: uid, line_items: [{ price, quantity: 1 }],
      payment_method_collection: "if_required", locale: "fr", allow_promotion_codes: false,
      subscription_data: Object.assign({ metadata: { uid } }, trial ? { trial_period_days: cfg.trialDays, trial_settings: { end_behavior: { missing_payment_method: "cancel" } } } : {}),
      success_url: base + "#/pro/abonnement", cancel_url: base + "#/pro/offre"
    };
    if (requireTos && requireTos()) params.consent_collection = { terms_of_service: "required" };
    const session = await stripe.checkout.sessions.create(params);
    return { url: session.url, trial, mode };
  }
  async function portal(req) {
    if (!req.auth) throw new HttpsError("unauthenticated", "Connecte-toi d'abord.");
    const cfg = await settings(); checkMode(cfg);
    const cur = await subRef(req.auth.uid).get(), old = cur.exists ? cur.data() : {};
    if (!old.stripeCustomerId) throw new HttpsError("failed-precondition", "no customer");
    const s = await getStripe().billingPortal.sessions.create({ customer: old.stripeCustomerId, return_url: baseUrl(req.data && req.data.origin) + "#/pro/abonnement" });
    return { url: s.url };
  }
  /** résiliation en un clic : l'accès reste ouvert jusqu'à la fin de la période déjà payée (ou de l'essai) */
  async function cancel(req) {
    if (!req.auth) throw new HttpsError("unauthenticated", "Connecte-toi d'abord.");
    const cfg = await settings(), mode = checkMode(cfg);
    const cur = await subRef(req.auth.uid).get(), old = cur.exists ? cur.data() : {};
    if (!old.stripeSubscriptionId) throw new HttpsError("failed-precondition", "no subscription");
    const sub = await getStripe().subscriptions.update(old.stripeSubscriptionId, { cancel_at_period_end: true });
    await applySubscription(sub, req.auth.uid, mode);
    return { ok: true };
  }

  // ------------------------------------------------------------------ webhook Stripe
  /** Reçoit un événement DÉJÀ vérifié (signature contrôlée par pro-functions.js). Relit l'abonnement chez Stripe : on ne fait pas confiance au contenu de l'événement. */
  async function handleEvent(ev) {
    const stripe = getStripe(), o = ev.data && ev.data.object ? ev.data.object : {};
    let subId = "", uidHint = "";
    switch (ev.type) {
      case "checkout.session.completed": subId = typeof o.subscription === "string" ? o.subscription : (o.subscription && o.subscription.id) || ""; uidHint = o.client_reference_id || ""; break;
      case "customer.subscription.created": case "customer.subscription.updated": case "customer.subscription.deleted": case "customer.subscription.trial_will_end": subId = o.id; break;
      case "invoice.payment_failed": case "invoice.paid": case "invoice.payment_succeeded": subId = typeof o.subscription === "string" ? o.subscription : (o.subscription && o.subscription.id) || (o.parent && o.parent.subscription_details && o.parent.subscription_details.subscription) || ""; break;
      default: return { ignored: true };
    }
    if (!subId) return { ignored: true };
    const sub = await stripe.subscriptions.retrieve(subId);
    const mode = ev.livemode ? "live" : "test";
    const r = await applySubscription(sub, uidHint, mode);
    return { ok: !!r, uid: r && r.uid, status: r && r.status };
  }

  /** compte supprimé (pro_subs/{uid} effacé par eraseUser) : on arrête aussitôt la facturation et on efface le client chez Stripe */
  async function onSubDeleted(old) {
    const stripe = getStripe(); let stopped = false;
    if (old && old.stripeSubscriptionId) { try { await stripe.subscriptions.cancel(old.stripeSubscriptionId); stopped = true; } catch (e) { if (!e || e.code !== "resource_missing") throw e; } }
    if (old && old.stripeCustomerId) { try { await stripe.customers.del(old.stripeCustomerId); } catch (e) { if (!e || e.code !== "resource_missing") throw e; } }
    return { stopped };
  }

  return { checkout, portal, cancel, handleEvent, onSubDeleted, applySubscription, settings, isAdmin };
}

module.exports = { createPro, mapSubscription, keyMode, GRACE_DAYS, DEFAULT_ORIGINS };
