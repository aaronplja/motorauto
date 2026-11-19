"use strict";
// MOTORAUTO PRO — abonnement : logique de functions/pro.js testée avec un faux Stripe et une base en mémoire (aucun appel réseau).
const assert = require("assert");
const { FakeDb } = require("./fake-admin-db");
const { createPro, mapSubscription, keyMode, GRACE_DAYS } = require("../functions/pro");
let n = 0;
const ok = async (label, fn) => { try { await fn(); n++; console.log("  ok - " + label); } catch (e) { console.log("  ÉCHEC - " + label + "\n    " + (e && e.stack || e)); process.exitCode = 1; } };
class HttpsError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const DAY = 86400000, NOW = Date.UTC(2026, 10, 14, 12), sec = (ms) => Math.floor(ms / 1000);
const rejects = async (p, code, msg) => { try { await p; } catch (e) { assert.strictEqual(e.code, code, "code : " + e.code + " " + e.message); if (msg) assert(new RegExp(msg).test(e.message), e.message); return; } assert.fail("aurait dû échouer"); };

function setup(opts) {
  opts = opts || {};
  const db = new FakeDb(() => NOW), calls = { sessions: [], customers: [], updates: [], portals: [] };
  const subs = {};                       // abonnements « chez Stripe »
  const stripe = {
    customers: { create: async (p) => { calls.customers.push(p); return { id: "cus_" + calls.customers.length }; } },
    checkout: { sessions: { create: async (p) => { calls.sessions.push(p); return { url: "https://checkout.stripe.test/s1" }; } } },
    billingPortal: { sessions: { create: async (p) => { calls.portals.push(p); return { url: "https://portal.stripe.test/p1" }; } } },
    subscriptions: { retrieve: async (id) => subs[id], update: async (id, p) => { calls.updates.push([id, p]); Object.assign(subs[id], { cancel_at_period_end: !!p.cancel_at_period_end }); return subs[id]; } }
  };
  const key = { v: opts.key || "sk_test_123" };
  const pro = createPro({ db, HttpsError, getStripe: () => stripe, getKey: () => key.v, getPrice: () => (opts.noPrice ? "" : "price_test_1"), adminMail: "admin@motorauto.fr", ts: (ms) => ({ toMillis: () => ms, __ts: ms }), now: () => NOW, extraOrigins: () => ["mon-site.example"], requireTos: () => !!opts.tos });
  const open = (over) => db.seed("pro_config", "settings", Object.assign({ signups: true, live: false, priceEur: 5, trialDays: 90 }, over || {}));
  return { db, stripe, subs, calls, pro, key, open };
}
const user = (uid, extra) => ({ auth: { uid, token: Object.assign({ email: uid + "@x.fr" }, extra || {}) }, data: { origin: "https://motorauto.fr" } });
const sub = (over) => Object.assign({ id: "sub_1", status: "trialing", customer: "cus_1", metadata: { uid: "alice" }, current_period_start: sec(NOW), current_period_end: sec(NOW + 90 * DAY), trial_end: sec(NOW + 90 * DAY), cancel_at_period_end: false }, over || {});

(async () => {
  await ok("états Stripe → états MOTORAUTO (essai, actif, retard avec délai de grâce, résilié, impayé)", () => {
    let m = mapSubscription(sub(), NOW); assert.strictEqual(m.status, "trialing"); assert.strictEqual(m.accessUntil, NOW + 90 * DAY); assert(m.hadTrial);
    m = mapSubscription(sub({ status: "active", trial_end: null, current_period_end: sec(NOW + 30 * DAY) }), NOW); assert.strictEqual(m.status, "active"); assert.strictEqual(m.accessUntil, NOW + 30 * DAY);
    m = mapSubscription(sub({ status: "past_due", trial_end: null, current_period_start: sec(NOW), current_period_end: sec(NOW + 30 * DAY) }), NOW);
    assert.strictEqual(m.status, "past_due"); assert.strictEqual(m.accessUntil, NOW + GRACE_DAYS * DAY, "un paiement refusé ne donne pas un mois gratuit : seulement quelques jours de grâce");
    m = mapSubscription(sub({ status: "canceled", ended_at: sec(NOW - DAY), current_period_end: sec(NOW + 10 * DAY) }), NOW); assert.strictEqual(m.status, "expired"); assert(m.accessUntil <= NOW);
    ["unpaid", "incomplete", "incomplete_expired", "paused"].forEach((s) => { m = mapSubscription(sub({ status: s }), NOW); assert.strictEqual(m.status, "expired"); assert.strictEqual(m.accessUntil, 0, s); });
    m = mapSubscription(sub({ status: "active", cancel_at_period_end: true }), NOW); assert.strictEqual(m.cancelAtPeriodEnd, true);
  });
  await ok("version récente de l'API Stripe (période portée par l'élément de l'abonnement)", () => {
    const s = { id: "s", status: "active", items: { data: [{ current_period_start: sec(NOW), current_period_end: sec(NOW + 30 * DAY) }] } };
    assert.strictEqual(mapSubscription(s, NOW).accessUntil, NOW + 30 * DAY);
  });
  await ok("type de clé : test / réel / inconnue", () => { assert.strictEqual(keyMode("sk_test_x"), "test"); assert.strictEqual(keyMode("rk_live_x"), "live"); assert.strictEqual(keyMode("whsec_x"), ""); assert.strictEqual(keyMode(""), ""); });

  await ok("démarrage : refusé tant que les inscriptions sont fermées, permis à un administrateur (test du parcours)", async () => {
    const t = setup(); t.open({ signups: false });
    await rejects(t.pro.checkout(user("alice")), "failed-precondition", "signups closed");
    const r = await t.pro.checkout(user("boss", { admin: true })); assert(r.url);
    await rejects(t.pro.checkout({ data: {} }), "unauthenticated");
  });
  await ok("démarrage : essai gratuit de 90 jours sans carte, client Stripe créé une seule fois", async () => {
    const t = setup(); t.open();
    const r = await t.pro.checkout(user("alice")); assert.strictEqual(r.trial, true); assert.strictEqual(r.mode, "test");
    const p = t.calls.sessions[0];
    assert.strictEqual(p.mode, "subscription"); assert.strictEqual(p.payment_method_collection, "if_required");
    assert.strictEqual(p.subscription_data.trial_period_days, 90); assert.strictEqual(p.subscription_data.trial_settings.end_behavior.missing_payment_method, "cancel");
    assert.strictEqual(p.client_reference_id, "alice"); assert.strictEqual(p.subscription_data.metadata.uid, "alice"); assert.deepStrictEqual(p.line_items, [{ price: "price_test_1", quantity: 1 }]);
    assert.strictEqual(p.success_url, "https://motorauto.fr/#/pro/abonnement"); assert.strictEqual(p.cancel_url, "https://motorauto.fr/#/pro/offre");
    assert(!p.consent_collection, "CGV non exigées par défaut");
    await t.pro.checkout(user("alice")); assert.strictEqual(t.calls.customers.length, 1);
  });
  await ok("démarrage : l'essai n'est offert qu'une fois par pilote", async () => {
    const t = setup(); t.open(); t.db.seed("pro_subs", "alice", { status: "expired", trialUsed: true, stripeCustomerId: "cus_9", accessUntil: { __ts: NOW - DAY } });
    const r = await t.pro.checkout(user("alice")); assert.strictEqual(r.trial, false); assert(!t.calls.sessions[0].subscription_data.trial_period_days); assert.strictEqual(t.calls.sessions[0].customer, "cus_9");
  });
  await ok("démarrage : déjà abonné → refusé ; CGV exigées si demandé ; adresse de retour limitée aux domaines connus", async () => {
    const t = setup({ tos: true }); t.open(); t.db.seed("pro_subs", "bob", { status: "active", accessUntil: { __ts: NOW + DAY } });
    await rejects(t.pro.checkout(user("bob")), "already-exists");
    const a = user("alice"); a.data.origin = "https://evil.example"; await t.pro.checkout(a);
    assert.strictEqual(t.calls.sessions[0].success_url, "https://motorauto.fr/#/pro/abonnement"); assert.deepStrictEqual(t.calls.sessions[0].consent_collection, { terms_of_service: "required" });
    const c = user("carl"); c.data.origin = "https://mon-site.example"; await t.pro.checkout(c); assert(t.calls.sessions[1].success_url.startsWith("https://mon-site.example/"));
  });
  await ok("double verrou : interrupteur et type de clé doivent concorder (jamais de débit réel par accident)", async () => {
    let t = setup({ key: "sk_live_abc" }); t.open({ live: false });
    await rejects(t.pro.checkout(user("alice")), "failed-precondition", "mismatch"); assert.strictEqual(t.calls.sessions.length, 0);
    t = setup({ key: "sk_test_abc" }); t.open({ live: true });
    await rejects(t.pro.checkout(user("alice")), "failed-precondition", "mismatch");
    t = setup({ key: "sk_live_abc" }); t.open({ live: true }); assert.strictEqual((await t.pro.checkout(user("alice"))).mode, "live");
    t = setup({ key: "pas-une-cle" }); t.open(); await rejects(t.pro.checkout(user("alice")), "failed-precondition", "key missing");
    t = setup({ noPrice: true }); t.open(); await rejects(t.pro.checkout(user("alice")), "failed-precondition", "price missing");
  });

  await ok("webhook : fin du paiement → essai actif ; accès jusqu'à la fin de l'essai", async () => {
    const t = setup(); t.subs.sub_1 = sub();
    const r = await t.pro.handleEvent({ type: "checkout.session.completed", livemode: false, data: { object: { subscription: "sub_1", client_reference_id: "alice" } } });
    assert.strictEqual(r.status, "trialing");
    const d = t.db.raw("pro_subs", "alice"); assert.strictEqual(d.status, "trialing"); assert.strictEqual(d.accessUntil.toMillis(), NOW + 90 * DAY); assert.strictEqual(d.trialUsed, true); assert.strictEqual(d.mode, "test"); assert.strictEqual(d.stripeSubscriptionId, "sub_1");
  });
  await ok("webhook : passage en abonnement actif, puis paiement refusé (délai de grâce), puis fin d'abonnement (accès coupé)", async () => {
    const t = setup(); t.subs.sub_1 = sub({ status: "active", trial_end: sec(NOW - DAY), current_period_end: sec(NOW + 30 * DAY) });
    await t.pro.handleEvent({ type: "customer.subscription.updated", data: { object: { id: "sub_1" } } });
    assert.strictEqual(t.db.raw("pro_subs", "alice").status, "active");
    t.subs.sub_1 = sub({ status: "past_due", trial_end: sec(NOW - DAY), current_period_start: sec(NOW), current_period_end: sec(NOW + 30 * DAY) });
    await t.pro.handleEvent({ type: "invoice.payment_failed", data: { object: { subscription: "sub_1" } } });
    let d = t.db.raw("pro_subs", "alice"); assert.strictEqual(d.status, "past_due"); assert.strictEqual(d.accessUntil.toMillis(), NOW + GRACE_DAYS * DAY);
    t.subs.sub_1 = sub({ status: "canceled", trial_end: sec(NOW - DAY), ended_at: sec(NOW), current_period_end: sec(NOW) });
    await t.pro.handleEvent({ type: "customer.subscription.deleted", data: { object: { id: "sub_1" } } });
    d = t.db.raw("pro_subs", "alice"); assert.strictEqual(d.status, "expired"); assert(d.accessUntil.toMillis() <= NOW); assert.strictEqual(d.trialUsed, true, "l'essai déjà consommé reste noté");
  });
  await ok("webhook : un événement ancien ou rejoué ne peut pas redonner un accès (l'abonnement est relu chez Stripe)", async () => {
    const t = setup(); t.subs.sub_1 = sub({ status: "canceled", ended_at: sec(NOW - DAY), trial_end: null });
    await t.pro.handleEvent({ type: "customer.subscription.updated", data: { object: { id: "sub_1", status: "active", current_period_end: sec(NOW + 99 * DAY) } } });
    const d = t.db.raw("pro_subs", "alice"); assert.strictEqual(d.status, "expired"); assert(d.accessUntil.toMillis() <= NOW);
  });
  await ok("webhook : retrouve le pilote par son client Stripe ; ignore l'inconnu et les événements sans intérêt", async () => {
    const t = setup(); t.db.seed("pro_subs", "dora", { stripeCustomerId: "cus_77" }); t.subs.sub_2 = sub({ id: "sub_2", customer: "cus_77", metadata: {} });
    const r = await t.pro.handleEvent({ type: "customer.subscription.updated", data: { object: { id: "sub_2" } } }); assert.strictEqual(r.uid, "dora");
    t.subs.sub_3 = sub({ id: "sub_3", customer: "cus_unknown", metadata: {} });
    assert.strictEqual((await t.pro.handleEvent({ type: "customer.subscription.updated", data: { object: { id: "sub_3" } } })).ok, false);
    assert.strictEqual((await t.pro.handleEvent({ type: "charge.refunded", data: { object: {} } })).ignored, true);
  });
  await ok("résiliation en un clic : demandée à Stripe, accès conservé jusqu'à la fin de la période", async () => {
    const t = setup(); t.open(); t.subs.sub_1 = sub({ status: "active", trial_end: null, current_period_end: sec(NOW + 20 * DAY) });
    t.db.seed("pro_subs", "alice", { status: "active", stripeSubscriptionId: "sub_1", accessUntil: { __ts: NOW + 20 * DAY } });
    await t.pro.cancel(user("alice")); assert.deepStrictEqual(t.calls.updates[0], ["sub_1", { cancel_at_period_end: true }]);
    const d = t.db.raw("pro_subs", "alice"); assert.strictEqual(d.cancelAtPeriodEnd, true); assert.strictEqual(d.status, "active"); assert.strictEqual(d.accessUntil.toMillis(), NOW + 20 * DAY);
    await rejects(t.pro.cancel(user("zoe")), "failed-precondition", "no subscription");
  });
  await ok("portail client : réservé à qui a déjà un client Stripe", async () => {
    const t = setup(); t.open(); await rejects(t.pro.portal(user("alice")), "failed-precondition", "no customer");
    t.db.seed("pro_subs", "alice", { stripeCustomerId: "cus_5" }); const r = await t.pro.portal(user("alice")); assert(r.url); assert.strictEqual(t.calls.portals[0].customer, "cus_5"); assert.strictEqual(t.calls.portals[0].return_url, "https://motorauto.fr/#/pro/abonnement");
  });
  await ok("compte supprimé : abonnement résilié et client effacé chez Stripe", async () => {
    const t = setup(); const gone = []; t.stripe.subscriptions.cancel = async (id) => { gone.push("sub:" + id); }; t.stripe.customers.del = async (id) => { gone.push("cus:" + id); };
    const r = await t.pro.onSubDeleted({ stripeSubscriptionId: "sub_1", stripeCustomerId: "cus_1" }); assert.strictEqual(r.stopped, true); assert.deepStrictEqual(gone, ["sub:sub_1", "cus:cus_1"]);
    t.stripe.subscriptions.cancel = async () => { const e = new Error("x"); e.code = "resource_missing"; throw e; }; assert.strictEqual((await t.pro.onSubDeleted({ stripeSubscriptionId: "sub_1" })).stopped, false);
    assert.deepStrictEqual(await t.pro.onSubDeleted(null), { stopped: false });
  });
  await ok("administrateurs : reconnus par jeton, compte principal ou document admins", async () => {
    const t = setup(); t.db.seed("admins", "vic", {});
    assert(await t.pro.isAdmin({ uid: "x", token: { admin: true } })); assert(!(await t.pro.isAdmin({ uid: "x", token: { email: "admin@motorauto.fr", email_verified: true } }))); assert(!(await t.pro.isAdmin({ uid: "x", token: { email: "admin@motorauto.fr", email_verified: false } }))); assert(await t.pro.isAdmin({ uid: "vic", token: {} }));
    assert(!(await t.pro.isAdmin({ uid: "x", token: { email: "x@x.fr" } })));
  });
  await ok("aucune clé ni secret dans le code des fonctions", () => {
    const fs = require("fs");
    ["functions/pro.js", "functions/pro-functions.js"].forEach((f) => assert(!/sk_(live|test)_[A-Za-z0-9]{6,}|whsec_[A-Za-z0-9]{6,}|price_[A-Za-z0-9]{10,}/.test(fs.readFileSync(require("path").join(__dirname, "..", f), "utf8")), f));
  });
  console.log(n + " vérifications PRO paiement OK");
})();
