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

`vercel.json` envoie la politique en mode « rapport seulement » (`Content-Security-Policy-Report-Only`). Elle ne bloque rien : le navigateur écrit dans la console les ressources qu'elle aurait refusées. Ouvre le site, la console (onglet Console), navigue dans tout le site. S'il n'y a aucune ligne « Content Security Policy », remplace `Content-Security-Policy-Report-Only` par `Content-Security-Policy` dans `vercel.json`.

## 3. App Check (facultatif, recommandé)

App Check empêche d'autres sites ou des scripts d'utiliser ton projet Firebase.

1. Console Firebase, « App Check », enregistre l'application web avec reCAPTCHA v3 (clé du site fournie par Google).
2. Donne-moi la clé du site : j'ajoute l'initialisation dans `js/firebase-init.js`.
3. Laisse d'abord le mode « non appliqué » une semaine, puis applique-le à Firestore, Storage et Functions.
