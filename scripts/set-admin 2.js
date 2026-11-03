/**
 * Donne (ou retire) le droit admin à un compte Firebase via un custom claim.
 *
 * Usage (depuis ton PC, JAMAIS depuis le site) :
 *   npm install firebase-admin
 *   # Console Firebase > Paramètres du projet > Comptes de service > "Générer une nouvelle clé privée"
 *   # Enregistre le fichier sous scripts/serviceAccountKey.json (NE PAS le commiter, NE PAS le publier)
 *   node scripts/set-admin.js admin@motorauto.fr          # donne le droit
 *   node scripts/set-admin.js admin@motorauto.fr remove   # retire le droit
 *
 * Après l'opération, l'utilisateur doit se déconnecter puis se reconnecter
 * pour que son jeton contienne le claim.
 */
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const email = process.argv[2];
const remove = process.argv[3] === "remove";

if (!email) {
  console.error("Usage : node scripts/set-admin.js <email> [remove]");
  process.exit(1);
}

(async () => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, remove ? { admin: false } : { admin: true });
    console.log(`${remove ? "Droit admin retiré à" : "Droit admin accordé à"} ${email} (uid ${user.uid})`);
    console.log("L'utilisateur doit se reconnecter pour que le changement soit pris en compte.");
  } catch (err) {
    console.error("Erreur :", err.message);
    process.exit(1);
  }
})();
