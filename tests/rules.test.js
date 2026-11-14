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
const { doc, setDoc, getDoc, getDocs, collection, query, where, updateDoc, deleteDoc, serverTimestamp, Timestamp } = require(path.join(__dirname, "../functions/node_modules/firebase/firestore"));
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
    // MOTORAUTO PRO : un abonné actif, un abonnement expiré, une fiche publiée et un brouillon
    await setDoc(doc(d, "pro_subs/carol"), { status: "active", accessUntil: Timestamp.fromMillis(Date.now() + 30 * 864e5) });
    await setDoc(doc(d, "pro_subs/dave"), { status: "active", accessUntil: Timestamp.fromMillis(Date.now() - 864e5) });
    await setDoc(doc(d, "pro_subs/erin"), { status: "canceled", accessUntil: Timestamp.fromMillis(Date.now() + 30 * 864e5) });
    await setDoc(doc(d, "pro_mods/m1"), { carId: "x", cat: "freinages", title: "Fiche publiée", status: "published" });
    await setDoc(doc(d, "pro_mods/m2"), { carId: "x", cat: "freinages", title: "Brouillon", status: "draft" });
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
  // questions de quiz proposées
  const adm = env.authenticatedContext("admin1", { admin: true }).firestore();
  const prop = (over) => Object.assign({ uid: "alice", username: "Alice", cat: "brands", q: "Quelle marque produit la 911 ?", o: ["Porsche", "Ferrari", "BMW", "Audi"], a: 0, note: "", status: "pending", createdAt: serverTimestamp() }, over || {});
  await check("proposition : alice propose une question", setDoc(doc(alice, "quiz_proposals/p1"), prop()), true);
  await check("proposition : pas au nom d'un autre", setDoc(doc(bob, "quiz_proposals/p2"), prop()), false);
  await check("proposition : pas déjà approuvée", setDoc(doc(alice, "quiz_proposals/p3"), prop({ status: "approved" })), false);
  await check("proposition : 4 réponses exactement", setDoc(doc(alice, "quiz_proposals/p4"), prop({ o: ["a", "b", "c"] })), false);
  await check("proposition : bob ne lit pas une question en attente d'alice", getDoc(doc(bob, "quiz_proposals/p1")), false);
  await check("proposition : alice lit la sienne", getDoc(doc(alice, "quiz_proposals/p1")), true);
  await check("proposition : alice ne l'approuve pas elle-même", updateDoc(doc(alice, "quiz_proposals/p1"), { status: "approved" }), false);
  await check("proposition : l'admin l'approuve avec traductions", updateDoc(doc(adm, "quiz_proposals/p1"), { status: "approved", tr: { en: { q: "Which brand makes the 911?", o: ["Porsche", "Ferrari", "BMW", "Audi"] } }, by: "admin1", reviewedAt: serverTimestamp() }), true);
  await check("proposition : une question approuvée est lisible par tous", getDoc(doc(anon, "quiz_proposals/p1")), true);
  // ---- MOTORAUTO PRO : lecture réservée aux abonnés actifs (fiches publiées) et aux administrateurs ; écriture réservée aux administrateurs
  const carol = env.authenticatedContext("carol").firestore(), dave = env.authenticatedContext("dave").firestore(), erin = env.authenticatedContext("erin").firestore();
  const pubQ = (db) => getDocs(query(collection(db, "pro_mods"), where("carId", "==", "x"), where("status", "==", "published")));
  const mod = (over) => Object.assign({ carId: "x", cat: "freinages", sub: "", title: "Disques", description: "", status: "draft", order: 0, author: "admin1", authorName: "Admin" }, over || {});
  await check("PRO : un abonné actif lit les fiches publiées", pubQ(carol), true);
  await check("PRO : un abonné actif ne lit pas un brouillon", getDoc(doc(carol, "pro_mods/m2")), false);
  await check("PRO : un abonné actif lit une fiche publiée", getDoc(doc(carol, "pro_mods/m1")), true);
  await check("PRO : un abonnement expiré ne lit rien", pubQ(dave), false);
  await check("PRO : un abonnement résilié ne lit rien", pubQ(erin), false);
  await check("PRO : un pilote sans abonnement ne lit rien", pubQ(alice), false);
  await check("PRO : un visiteur déconnecté ne lit rien", pubQ(anon), false);
  await check("PRO : un abonné ne demande pas les brouillons", getDocs(query(collection(carol, "pro_mods"), where("carId", "==", "x"))), false);
  await check("PRO : l'admin lit tout, brouillons compris", getDoc(doc(adm, "pro_mods/m2")), true);
  await check("PRO : un abonné n'écrit pas de fiche", setDoc(doc(carol, "pro_mods/hack"), mod({ status: "published" })), false);
  await check("PRO : un abonné ne modifie pas une fiche", updateDoc(doc(carol, "pro_mods/m1"), { title: "Hack" }), false);
  await check("PRO : l'admin crée une fiche valide", setDoc(doc(adm, "pro_mods/new1"), mod()), true);
  await check("PRO : l'admin ne met pas un statut inconnu", setDoc(doc(adm, "pro_mods/new2"), mod({ status: "secret" })), false);
  await check("PRO : l'admin ne met pas de champ inconnu", setDoc(doc(adm, "pro_mods/new3"), mod({ free: true })), false);
  await check("PRO : titre obligatoire", setDoc(doc(adm, "pro_mods/new4"), mod({ title: "" })), false);
  await check("PRO : l'admin publie une fiche", updateDoc(doc(adm, "pro_mods/new1"), { status: "published" }), true);
  await check("PRO : personne n'écrit son abonnement (pas même l'admin)", setDoc(doc(adm, "pro_subs/alice"), { status: "active", accessUntil: Timestamp.fromMillis(Date.now() + 864e5) }), false);
  await check("PRO : un pilote ne s'octroie pas un abonnement", setDoc(doc(alice, "pro_subs/alice"), { status: "active", accessUntil: Timestamp.fromMillis(Date.now() + 864e5) }), false);
  await check("PRO : un pilote lit son abonnement", getDoc(doc(carol, "pro_subs/carol")), true);
  await check("PRO : un pilote ne lit pas l'abonnement d'un autre", getDoc(doc(alice, "pro_subs/carol")), false);
  await check("PRO : la structure est lisible par tous", getDoc(doc(anon, "pro_config/cats")), true);
  await check("PRO : un pilote ne modifie pas la structure", setDoc(doc(alice, "pro_config/cats"), { cats: [{ id: "a", label: "A", subs: [] }] }), false);
  await check("PRO : l'admin modifie la structure", setDoc(doc(adm, "pro_config/cats"), { cats: [{ id: "a", label: "A", subs: [] }], updatedAt: serverTimestamp() }), true);
  await check("PRO : un pilote ne touche pas aux interrupteurs", setDoc(doc(alice, "pro_config/settings"), { signups: true }), false);
  await check("PRO : l'admin règle les interrupteurs", setDoc(doc(adm, "pro_config/settings"), { signups: false, live: false, priceEur: 5, trialDays: 90 }), true);
  await env.cleanup();
  console.log(fails ? "\n" + fails + " ÉCHEC(S) sur " + n : "\nTOUT OK (" + n + " vérifications)");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
