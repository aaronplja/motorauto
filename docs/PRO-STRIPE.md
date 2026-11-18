# MOTORAUTO PRO — brancher Stripe en MODE TEST

Rien ici ne débite de l'argent réel : tout se fait avec les clés de test de Stripe (`sk_test_…`).
Les points légaux (statut, CGV, etc.) doivent être réglés AVANT le paiement réel (voir `docs/PRO-LEGAL.md` quand il sera livré).

## 1. Dans Stripe (https://dashboard.stripe.com) — bascule « Mode test » activée (interrupteur en haut à droite)

1. **Produit** : Catalogue de produits → *Ajouter un produit* → nom « MOTORAUTO PRO » → tarification **Récurrent**, **5,00 €**, **Mensuel** → Enregistrer.
   Copie l'identifiant du **prix** (commence par `price_…`, pas `prod_…`).
2. **Portail client** : Paramètres → Facturation → *Portail client* → active : « Les clients peuvent annuler leurs abonnements » (annulation **à la fin de la période**), « mettre à jour les moyens de paiement », « consulter les factures » → Enregistrer. (Le portail se règle séparément en mode test et en mode réel.)
3. **Clé secrète de test** : Développeurs → Clés API → *Clé secrète* `sk_test_…` (clique « Révéler »). Ne la colle jamais dans le code ni dans un message.

## 2. Dans Firebase (terminal, depuis le dossier du projet)

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY --project motorautoireyv        # colle sk_test_…
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project motorautoireyv    # colle provisoirement : whsec_provisoire
```

Crée (ou complète) le fichier `functions/.env` :

```
PRO_ENABLED=true
STRIPE_PRICE_ID=price_xxxxxxxxxxxx
```

Puis déploie :

```bash
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,functions --project motorautoireyv
```

À la fin du déploiement, Firebase affiche l'adresse de la fonction **proWebhook** (« Function URL (proWebhook(europe-west1)) : https://… »). Copie-la.

## 3. Webhook Stripe

Stripe → Développeurs → Webhooks → *Ajouter un endpoint* :
- URL : l'adresse de `proWebhook` copiée ci-dessus ;
- Événements : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`.

Stripe affiche alors le **secret de signature** (`whsec_…`). Remplace le secret provisoire et redéploie les fonctions :

```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project motorautoireyv    # colle le vrai whsec_…
firebase deploy --only functions --project motorautoireyv
```

## 4. Tester (sans dépenser un centime)

1. Connecte-toi avec un compte **non administrateur** (les administrateurs ont déjà l'accès gratuit). Dans Administration › PRO › Réglages, coche « Inscriptions ouvertes » (le paiement réel reste **décoché**).
   Un administrateur peut aussi lancer le parcours pour le tester, même inscriptions fermées.
2. Page PRO → « Essayer 3 mois gratuits » → page Stripe (bandeau « mode test ») → valider (aucune carte demandée pendant l'essai) → retour sur « Mon abonnement » : « Essai gratuit ».
3. « Gérer mon abonnement » ouvre le portail Stripe (ajouter une carte de test `4242 4242 4242 4242`, date future, CVC au choix ; résilier). « Résilier » sur le site résilie en un clic : l'accès reste ouvert jusqu'à la fin de la période.
4. Carte qui échoue : `4000 0000 0000 0341` (paiement refusé → « Paiement en retard », accès conservé 3 jours puis coupé).
5. Simuler la fin de l'essai : Stripe → Facturation → *Horloges de test* (Test clocks) → avance dans le temps ; sans carte enregistrée l'abonnement se termine et l'accès se coupe.
6. Vérifier le blocage : avec un compte sans abonnement (ou expiré), la page « Explorer » est verrouillée **et** Firestore refuse la lecture des fiches (même en essayant depuis la console du navigateur).

## 5. Passer au réel plus tard (NE PAS FAIRE avant le cadre légal)

Double verrou : le paiement réel ne s'active que si **les deux** conditions sont réunies, sinon les fonctions refusent de débiter.
1. Dans Stripe en mode réel : recréer le produit/prix, le portail, le webhook (nouveau `whsec_`).
2. `firebase functions:secrets:set STRIPE_SECRET_KEY` avec `sk_live_…`, idem `STRIPE_WEBHOOK_SECRET`, et `STRIPE_PRICE_ID` réel dans `functions/.env` ; redéployer.
3. Dans Administration › PRO › Réglages : cocher « Paiement réel activé » (confirmation demandée).
Retour en arrière immédiat : décocher « Paiement réel » (les fonctions refusent alors la clé `sk_live_…`).

## Ce que le code garantit
- Aucune clé dans le code du site ; l'abonnement (`pro_subs`) n'est écrit que par le serveur ; les règles Firestore coupent l'accès à `accessUntil`.
- Le webhook vérifie la signature Stripe puis relit l'abonnement chez Stripe (un événement rejoué ou en retard ne donne aucun accès).
- Paiement refusé : 3 jours de grâce, puis accès coupé. Essai : une seule fois par pilote.
- Compte supprimé : l'abonnement est résilié chez Stripe et le client effacé.
