"use strict";
// Teste les rôles (functions/roles.js) avec une base et une authentification simulées.
const assert = require("assert");
const { createRoles } = require("../functions/roles");

function fake() {
  const store = { admins: {}, moderators: {}, users: {}, audit_log: [] };
  const claims = {};
  const accounts = { sup: { uid: "sup", email: "admin@motorauto.fr", emailVerified: true }, bob: { uid: "bob", email: "bob@x.fr", emailVerified: true }, eve: { uid: "eve", email: "eve@x.fr", emailVerified: true } };
  store.users.bob = { username: "Bob" };
  const doc = (col, id) => ({
    get: async () => ({ exists: id in store[col], data: () => store[col][id] }),
    set: async (v) => { store[col][id] = v; },
    delete: async () => { delete store[col][id]; },
  });
  const db = { collection: (c) => ({ doc: (id) => doc(c, id), add: async (v) => { store[c].push(v); }, limit: () => ({ get: async () => ({ docs: Object.entries(store[c]).map(([id, v]) => ({ id, data: () => v })) }) }) }) };
  const admin = {
    firestore: { FieldValue: { serverTimestamp: () => "TS" } },
    auth: () => ({
      getUser: async (uid) => { if (!accounts[uid]) throw new Error("nf"); return Object.assign({}, accounts[uid], { customClaims: claims[uid] || {} }); },
      setCustomUserClaims: async (uid, c) => { claims[uid] = c; },
    }),
  };
  class HttpsError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
  const onCall = (_o, fn) => fn;
  const r = createRoles({ db, admin, onCall, HttpsError, region: "x", adminMail: "admin@motorauto.fr" });
  return { r, store, claims };
}
const as = (uid, token, data) => ({ auth: { uid, token }, data });
const rejects = async (p, code) => { try { await p; } catch (e) { assert.strictEqual(e.code, code); return; } assert.fail("devait refuser : " + code); };

(async () => {
  const { r, store, claims } = fake();
  // le compte principal reçoit le claim admin au premier passage
  let out = await r.syncMyClaims(as("sup", { email: "admin@motorauto.fr", email_verified: true }));
  assert.deepStrictEqual(out.roles, ["admin"]); assert.strictEqual(claims.sup.admin, true); assert.strictEqual(out.changed, true);
  out = await r.syncMyClaims(as("sup", { admin: true, email: "admin@motorauto.fr" }));
  assert.strictEqual(out.changed, false);                                 // rien à réécrire
  // un inconnu n'a aucun droit
  out = await r.syncMyClaims(as("eve", { email: "eve@x.fr" }));
  assert.deepStrictEqual(out.roles, []);
  // seul l'admin principal nomme l'équipe
  await rejects(r.setUserRole(as("eve", { email: "eve@x.fr" }, { uid: "bob", role: "moderator", on: true })), "permission-denied");
  await rejects(r.setUserRole(as("bob", { email: "bob@x.fr" }, { uid: "bob", role: "moderator", on: true })), "permission-denied");
  const sup = { admin: true, email: "admin@motorauto.fr" };
  await rejects(r.setUserRole(as("sup", sup, { uid: "sup", role: "moderator", on: true })), "failed-precondition");   // pas soi-même
  await rejects(r.setUserRole(as("sup", sup, { uid: "bob", role: "admin", on: true })), "invalid-argument");          // pas d'autre « admin »
  await rejects(r.setUserRole(as("sup", sup, { uid: "ghost", role: "moderator", on: true })), "not-found");
  // nomination d'un délégué : document miroir + claim
  out = await r.setUserRole(as("sup", sup, { uid: "bob", role: "delegatedAdmin", on: true }));
  assert.deepStrictEqual(out.roles, ["delegatedAdmin"]); assert.strictEqual(store.admins.bob.username, "Bob"); assert.strictEqual(claims.bob.delegatedAdmin, true);
  // cumul avec modérateur, et les autres claims sont conservés
  claims.bob.vip = true;
  out = await r.setUserRole(as("sup", sup, { uid: "bob", role: "moderator", on: true }));
  assert.deepStrictEqual(out.roles.sort(), ["delegatedAdmin", "moderator"]); assert.strictEqual(claims.bob.vip, true);
  // un délégué peut lister l'équipe, pas un simple pilote
  const staff = await r.listStaff(as("bob", { email: "bob@x.fr" }, {}));
  assert.strictEqual(staff.admins.length, 1); assert.strictEqual(staff.moderators.length, 1);
  await rejects(r.listStaff(as("eve", { email: "eve@x.fr" }, {})), "permission-denied");
  // retrait
  out = await r.setUserRole(as("sup", sup, { uid: "bob", role: "delegatedAdmin", on: false }));
  assert.deepStrictEqual(out.roles, ["moderator"]); assert.ok(!("bob" in store.admins)); assert.strictEqual(claims.bob.delegatedAdmin, undefined);
  assert.strictEqual(store.audit_log.length, 3);
  // non connecté
  await rejects(r.syncMyClaims({ data: {} }), "unauthenticated");
  console.log("roles.test.js : tous les contrôles passent");
})().catch((e) => { console.error(e); process.exit(1); });
