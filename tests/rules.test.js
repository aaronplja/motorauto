"use strict";
/**
 * Test des règles Firestore avec l'émulateur (aucun pilote ne doit lire/modifier les données d'un autre).
 * Lancement (depuis le dossier du projet, Java nécessaire) :
 *   cd functions && npm i --no-save @firebase/rules-unit-testing firebase && cd ..
 *   firebase emulators:exec --only firestore --project demo-motorauto "node tests/rules.test.js"
 */
const fs = require("fs");
const path = require("path");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require(path.join(__dirname, "../functions/node_modules/@firebase/rules-unit-testing"));
const { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } = require(path.join(__dirname, "../functions/node_modules/firebase/firestore"));
let fails = 0, n = 0;
const check = async (label, p, expectOk) => { n++; try { await (expectOk ? assertSucceeds(p) : assertFails(p)); console.log("  ok - " + label); } catch (e) { fails++; console.log("  ÉCHEC - " + label + " : " + String(e.message).slice(0, 120)); } };
(async () => {
  const env = await initializeTestEnvironment({ projectId: "demo-motorauto", firestore: { rules: fs.readFileSync(path.join(__dirname, "../firestore.rules"), "utf8") } });
  await env.withSecurityRulesDisabled(async (c) => {
    const d = c.firestore();
    await setDoc(doc(d, "users/alice"), { username: "Alice" }); await setDoc(doc(d, "users/bob"), { username: "Bob" });
    await setDoc(doc(d, "users/alice/notifications/n1"), { read: false, text: "x" });
    await setDoc(doc(d, "collections/alice"), { owned: {}, opened: 0, count: 0, dust: 0, bonus: 0 });
    await setDoc(doc(d, "special_cards/sp-x"), { name: "Spéciale", granted: 0, supply: 0 });
  });
  const alice = env.authenticatedContext("alice").firestore(), bob = env.authenticatedContext("bob").firestore(), anon = env.unauthenticatedContext().firestore();
  await check("profil : lecture publique", getDoc(doc(anon, "users/alice")), true);
  await check("profil : bob ne modifie pas alice", updateDoc(doc(bob, "users/alice"), { username: "Hack" }), false);
  await check("profil : alice modifie le sien", updateDoc(doc(alice, "users/alice"), { username: "Alice2", instagram: "alice_cars" }), true);
  await check("profil : champ inconnu refusé", updateDoc(doc(alice, "users/alice"), { isAdmin: true }), false);
  await check("profil : pseudo trop long refusé", updateDoc(doc(alice, "users/alice"), { instagram: "x".repeat(40) }), false);
  await check("notifications : bob ne lit pas celles d'alice", getDoc(doc(bob, "users/alice/notifications/n1")), false);
  await check("notifications : alice lit les siennes", getDoc(doc(alice, "users/alice/notifications/n1")), true);
  await check("notifications : bob ne supprime pas celles d'alice", deleteDoc(doc(bob, "users/alice/notifications/n1")), false);
  await check("notifications : alice supprime les siennes", deleteDoc(doc(alice, "users/alice/notifications/n1")), true);
  await check("collection : bob ne modifie pas celle d'alice", updateDoc(doc(bob, "collections/alice"), { dust: 2000 }), false);
  await check("collection : personne ne supprime", deleteDoc(doc(alice, "collections/alice")), false);
  await check("cartes spéciales : un pilote ne crée pas", setDoc(doc(alice, "special_cards/sp-hack"), { name: "Hack", granted: 0 }), false);
  await check("cartes spéciales : un pilote ne modifie pas", updateDoc(doc(alice, "special_cards/sp-x"), { claimable: true }), false);
  await check("wishlist : bob n'écrit pas chez alice", setDoc(doc(bob, "wishlists/alice"), { ids: [], updatedAt: serverTimestamp() }), false);
  await check("wishlist : alice écrit la sienne", setDoc(doc(alice, "wishlists/alice"), { ids: ["a"], updatedAt: serverTimestamp() }), true);
  await env.cleanup();
  console.log(fails ? "\n" + fails + " ÉCHEC(S) sur " + n : "\nTOUT OK (" + n + " vérifications)");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
