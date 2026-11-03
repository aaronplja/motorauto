# MOTORAUTO sur l'App Store — guide pas à pas

Ce dossier `app-ios/` transforme ton site en vraie application iPhone avec **Capacitor**.
Le site web (motorauto.fr) ne change pas : l'application embarque une copie du site et ajoute du natif
(connexion Google/Apple, notifications push). Tout se fait sur ton Mac.

---------------------------------------------------------------------------------------------------

## 0. Ce qu'il te faut

| Quoi | Détail |
|---|---|
| Un Mac récent | macOS à jour (Xcode ne tourne que sur Mac) |
| **Xcode** | gratuit, dans le Mac App Store (≈ 10 Go) |
| **Node.js** (LTS) | https://nodejs.org |
| **CocoaPods** | dans Terminal : `sudo gem install cocoapods` (ou `brew install cocoapods`) |
| **Compte Apple Developer** | 99 €/an — https://developer.apple.com/programs/enroll (voir étape 1) |
| Un iPhone (conseillé) | pour tester avant d'envoyer |

## 1. Compte Apple Developer (particulier)

1. Va sur https://developer.apple.com/programs/enroll avec ton identifiant Apple (active la double authentification).
2. Choisis **« Individual / Sole Proprietor »** (particulier). Ton **nom légal** (PELLEJA Aaron) sera affiché comme éditeur.
3. Paie 99 €. La validation prend de quelques heures à quelques jours.
4. Dans App Store Connect › **Business**, renseigne le statut « trader » (Europe, DSA) : pour une app gratuite faite
   à titre non professionnel, déclare « je ne suis pas un trader ». Si Apple impose une adresse, elle n'est montrée
   publiquement que si tu te déclares trader.

Pour savoir si tu en as déjà un : connecte-toi sur https://developer.apple.com/account — si tu vois « Certificates, IDs & Profiles », c'est actif.

## 2. Préparer le projet (Terminal, dans ce dossier)

```bash
cd app-ios
npm install                 # installe Capacitor et les plugins
npm run web                 # copie le site dans www/
npm run add-ios             # crée le projet Xcode (dossier ios/), une seule fois
npm run assets              # génère l'icône et l'écran de démarrage depuis resources/
npm run sync                # copie le site dans l'app et installe les plugins natifs
npm run open                # ouvre Xcode
```
> Si `npm install` affiche une erreur de version, copie-la-moi : on ajuste `package.json`.
> À chaque modification du site : relance `npm run sync` puis relance l'app depuis Xcode.

## 3. Firebase (une seule fois)

1. Console Firebase › projet **motorautoireyv** › ⚙ Paramètres › « Vos applications » › **Ajouter une application iOS**.
   - ID de bundle Apple : `fr.motorauto.app` (identique à `capacitor.config.json`).
   - Télécharge **GoogleService-Info.plist** et glisse-le dans Xcode, dans `App/App` (coche « Copy items if needed »).
2. Authentication › Méthode de connexion : vérifie que **Google** est activé, puis active **Apple**
   (voir étape 4 pour les identifiants).
3. Ouvre `GoogleService-Info.plist`, copie la valeur `REVERSED_CLIENT_ID`.
   Dans Xcode : cible **App** › onglet **Info** › **URL Types** › **+** › colle-la dans « URL Schemes ».
4. Publie les **règles Firestore** (fichier `firestore.rules` livré avec ce projet) et redéploie les fonctions :
   `firebase deploy --only functions --project motorautoireyv`.
5. Photos dans l'app : dans Google Cloud Shell (ou Terminal avec gcloud) :
   `gsutil cors set app-ios/cors.json gs://motorautoireyv.firebasestorage.app`

## 4. Xcode : réglages de la cible « App »

Onglet **Signing & Capabilities** :
- **Team** : ton compte développeur (« Add account » la première fois). Coche « Automatically manage signing ».
- **Bundle Identifier** : `fr.motorauto.app`.
- **+ Capability** → **Sign in with Apple**.
- **+ Capability** → **Push Notifications**.
- **+ Capability** → **Background Modes** → coche **Remote notifications**.

Onglet **General** : Display Name `MOTORAUTO`, Version `1.0`, Build `1`, iPhone seulement (décoche iPad si tu ne veux pas fournir de captures iPad).

Fichier `Info.plist` (clic droit › Open As › Source Code) — ajoute :
```xml
<key>NSCameraUsageDescription</key><string>MOTORAUTO utilise l'appareil photo pour joindre des photos de ta voiture.</string>
<key>NSPhotoLibraryUsageDescription</key><string>MOTORAUTO accède à tes photos pour que tu puisses en ajouter à ta voiture, ton profil ou un message.</string>
<key>NSMicrophoneUsageDescription</key><string>MOTORAUTO utilise le micro pour enregistrer des messages vocaux dans le salon.</string>
<key>ITSAppUsesNonExemptEncryption</key><false/>
```

### Sign in with Apple côté Apple/Firebase
1. https://developer.apple.com/account › Identifiers › ton App ID `fr.motorauto.app` : coche **Sign in with Apple**.
2. Firebase › Authentication › Apple : pour une app iOS native, il suffit d'**activer** le fournisseur (aucun ID de service requis).

### Notifications push (APNs)
1. https://developer.apple.com/account › Keys › **+** › coche **Apple Push Notifications service (APNs)** › télécharge le fichier `.p8` (garde-le !).
2. Firebase › ⚙ Paramètres › **Cloud Messaging** › « Configuration de l'application Apple » › **Importer la clé APNs** : fichier `.p8`, ID de clé, ID d'équipe (Team ID).

## 5. Tester sur ton iPhone
1. Branche l'iPhone, choisis-le en haut de Xcode, ▶ Run. (Mode développeur : Réglages › Confidentialité › Mode développeur.)
2. Vérifie : ouverture, connexion e-mail, connexion Google, connexion Apple, ajout de voiture avec photo, chat, notifications, suppression de compte.
3. Pour tester à plusieurs : **TestFlight** (étape 6).

## 6. Envoyer sur App Store Connect (TestFlight puis App Store)
1. https://appstoreconnect.apple.com › **Apps** › **+** › Nouvelle app : Plateformes iOS, Nom `MOTORAUTO`, langue principale Français,
   ID de bundle `fr.motorauto.app`, SKU `motorauto-ios`, accès complet.
2. Xcode : choisis **Any iOS Device (arm64)** › menu **Product › Archive** › **Distribute App › App Store Connect › Upload**.
3. Dans App Store Connect › **TestFlight** : l'archive apparaît après quelques minutes (traitement). Ajoute-toi comme testeur interne.
4. Fiche de l'app : copie les textes de `FICHE-APP-STORE.md`, ajoute les **captures d'écran** (iPhone 6,9" : 1320×2868 px ; 3 à 10 images — simulateur
   Xcode : ⌘S pour capturer), l'icône est déjà dans l'app.
5. **Confidentialité de l'app** (App Privacy) : remplis le questionnaire avec `APPLE-AUDIT.md` (section « Étiquettes de confidentialité »).
6. **Notes pour le test (App Review)** : fournis un **compte de démonstration** (e-mail + mot de passe d'un compte test que tu crées dans l'app)
   et explique les fonctions. Ajoute ton e-mail de contact.
7. Choisis le build, **Ajouter pour vérification** › **Soumettre**. Délai habituel : 24 à 48 h.

## 7. Si Apple refuse
Les refus fréquents sont listés dans `APPLE-AUDIT.md`. Réponds dans la « Resolution Center » en expliquant la correction, ou envoie-moi le message de refus et je corrige.

## 8. Mises à jour
Modification du site → `npm run sync` → dans Xcode augmente **Build** (2, 3…) → Archive → Upload → soumets la nouvelle version.
Le site web (motorauto.fr) se met à jour tout seul avec ton `git push` habituel ; l'application, elle, embarque sa copie.
