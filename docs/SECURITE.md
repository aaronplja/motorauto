# MOTORAUTO : réglages de sécurité à faire dans les consoles

Ces trois réglages ne peuvent pas se faire depuis le code. Ils prennent chacun quelques minutes.

## 1. Restreindre la clé API Firebase (Google Cloud)

La clé qui apparaît dans `js/firebase-init.js` est publique par conception, mais elle ne doit fonctionner que depuis ton site.

1. Console Google Cloud, projet `motorautoireyv` : « API et services » puis « Identifiants ».
2. Ouvre la clé « Browser key » (celle qui commence par `AIzaSyA_0Y40`).
3. « Restrictions relatives aux applications » : « Sites web ».
4. Ajoute ces référents :
   - `https://motorauto.fr/*`
   - `https://www.motorauto.fr/*`
   - `https://motorautoireyv.web.app/*`
   - `https://motorautoireyv.firebaseapp.com/*`
5. Enregistre. Les applications iOS et Android chargent motorauto.fr : elles continuent de fonctionner.

## 2. Content-Security-Policy

`vercel.json` applique la politique (`Content-Security-Policy`, TECH-206) : le navigateur refuse tout ce qui sort de la liste (scripts Google/Firebase, polices, cartes, YouTube, Stripe). Si une ressource légitime est bloquée, la console (onglet Console) affiche « Content Security Policy » avec le domaine : ajoute-le dans `vercel.json`, au bon champ (`script-src`, `connect-src`, `img-src`…).

## 3. App Check (facultatif, recommandé)

App Check empêche d'autres sites ou des scripts d'utiliser ton projet Firebase.

1. Console Firebase, « App Check », enregistre l'application web avec reCAPTCHA v3 (clé du site fournie par Google).
2. Donne-moi la clé du site : j'ajoute l'initialisation dans `js/firebase-init.js`.
3. Laisse d'abord le mode « non appliqué » une semaine, puis applique-le à Firestore, Storage et Functions.

## 4. App Check (anti-abus) — à faire une fois

1. Console Firebase → **App Check** → app web → fournisseur **reCAPTCHA v3** → copie la **clé de site**.
2. Colle-la dans `js/firebase-init.js` : `const APPCHECK_SITE_KEY = "…";`, build, déploie le site.
3. Console → App Check → regarde les métriques quelques jours (les requêtes « vérifiées » doivent dominer).
4. Active ensuite l'application sur **Firestore** et **Storage** (console), puis pour les fonctions : variable `ENFORCE_APPCHECK=true` (fichier `functions/.env`) et `firebase deploy --only functions`.

## 5. Compte administrateur principal

Depuis cette version, `admin@motorauto.fr` n'est reconnu comme administrateur **que si son adresse est vérifiée** (console Firebase → Authentication → utilisateur → « E-mail vérifié »). Vérifie-le avant de déployer les règles ; sinon passe par `node scripts/set-admin.js` (claim `admin`).

## 5 bis. Réglages privés

`emailNotifs` n'est plus dans le profil public : il est dans `users/{uid}/private/prefs` (lisible seulement par son propriétaire). Les anciens profils sont lus avec repli sur l'ancien champ, rien à migrer à la main.
