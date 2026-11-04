# Audit de conformité App Store — MOTORAUTO (état du code livré)

Légende : ✅ conforme · 🔧 ajouté dans cette livraison · ⚠ à faire par toi

## Règles de l'App Store (App Review Guidelines)

| Règle | Exigence | État |
|---|---|---|
| 1.2 Contenus utilisateurs | Filtrage, signalement, **blocage**, contact publié, réponse rapide | ✅ signalement des messages (motifs) · ✅ sourdine/suspension admin · 🔧 **blocage d'un pilote** (profil + message de salon, masque messages, MP et commentaires) · ✅ page Contact · ⚠ engage-toi à traiter les signalements sous 24 h (Apple le vérifie) |
| 1.2 CGU | Conditions interdisant le contenu choquant | ✅ CGU § 3 et 4 (mise à jour : mention du blocage) · ✅ case d'acceptation à l'inscription |
| 2.1 Complétude | App stable, sans pages vides, compte de test fourni | ⚠ crée un **compte de démonstration** et donne ses identifiants dans « Notes pour l'App Review » |
| 2.3 Métadonnées | Captures réelles, description exacte | ⚠ captures à faire (simulateur Xcode) — textes prêts dans `FICHE-APP-STORE.md` |
| 3.1 Achats intégrés | Pas de paiement hors StoreKit pour du contenu numérique | ✅ aucun achat : cartes/cristaux sont **virtuels, gratuits, sans valeur monétaire** (CGU § 5) — ne jamais ajouter de vente de packs sans StoreKit |
| 4.0 Design | Interface adaptée iPhone, zones sûres | ✅ `env(safe-area-inset-*)` déjà utilisé · ⚠ vérifie sur un vrai iPhone (encoche, clavier du chat) |
| 4.2 Fonctionnalités minimales | Pas un simple site web empaqueté | 🔧 natif : **Sign in with Apple**, **connexion Google native**, **notifications push natives** ; ✅ jeu de cartes, garage, chat, hors-ligne partiel — mets en avant ces fonctions dans les notes de review |
| 4.8 Sign in with Apple | Obligatoire si Google/réseaux sociaux proposés | 🔧 bouton « Continuer avec Apple » (dans l'app) |
| 5.1.1 Données | Politique de confidentialité accessible (app + fiche) | ✅ `#/legal/confidentialite` · ⚠ renseigne l'URL : `https://motorauto.fr/#/legal/confidentialite` dans App Store Connect |
| 5.1.1(v) Suppression de compte | Suppression depuis l'app | ✅ Mon garage › Réglages › Supprimer mon compte (fonction `deleteAccount` : efface profil, contenus, cartes) |
| 5.1.2 Suivi | Pas de pistage sans consentement (ATT) | ✅ pas de publicité ni de SDK de pistage · ⚠ Google Analytics (`measurementId`) : si tu l'utilises dans l'app, déclare « Données d'utilisation » ; sinon retire-le |
| 5.6 Conduite des développeurs | Contact fonctionnel | ✅ motorautofr@gmail.com |

## Étiquettes de confidentialité (App Store Connect › Confidentialité de l'app)
Réponds « Oui, nous collectons des données » puis déclare, **liées à l'identité de l'utilisateur**, **non utilisées pour le pistage** :

| Catégorie | Détail | Finalité |
|---|---|---|
| Coordonnées | adresse e-mail | Fonctionnement de l'app (compte) |
| Contenu utilisateur | photos, messages, commentaires, voitures | Fonctionnement de l'app |
| Identifiants | ID utilisateur, ID d'appareil (jeton de notification) | Fonctionnement de l'app |
| Informations de compte (nom) | pseudo / nom affiché | Fonctionnement de l'app |
| Données d'utilisation | uniquement si Analytics actif | Analyses |

Pas de localisation, pas de données de santé/financières, pas de contacts.

## Classification d'âge
Questionnaire : contenus générés par les utilisateurs = **oui** ; messagerie = **oui** ; pas de violence, pas de jeux d'argent (les packs sont gratuits et virtuels).
L'inscription est réservée aux **15 ans et plus** (CGU) : choisis la tranche correspondante et indique-le dans les notes.

## Points techniques à vérifier avant d'envoyer
- ⚠ **Sign in with Apple** activé dans Firebase + capacité ajoutée dans Xcode (guide § 4).
- ⚠ **GoogleService-Info.plist** ajouté + `REVERSED_CLIENT_ID` en URL Scheme (guide § 3).
- ⚠ Clé **APNs (.p8)** importée dans Firebase Cloud Messaging.
- ⚠ Textes d'autorisation (caméra, photos, micro) présents dans `Info.plist` (guide § 4) : leur absence provoque un refus automatique ou un plantage.
- ⚠ Règles Firestore et fonctions Cloud **redéployées** (blocs, `platform` des jetons push).
- ⚠ Teste le **chat vocal** (micro) et l'**ajout de photo** (CORS Storage, `cors.json`).
- ⚠ Retire les liens/boutons qui renverraient vers « Installer le site sur l'écran d'accueil » : inutiles dans l'app (le bouton d'installation PWA ne s'affiche pas dans Capacitor).

## Causes de refus les plus courantes (et réponse)
1. **4.2 « app = site web »** : réponds en listant les fonctions natives (Apple/Google natif, push, caméra/photothèque, micro, jeu de cartes) et envoie une vidéo d'écran.
2. **1.2 contenus utilisateurs** : montre où signaler et bloquer (captures) et explique la modération (admin, sourdine, suspension).
3. **2.1 compte de test invalide** : vérifie que le compte de démonstration fonctionne et n'est pas banni.
4. **5.1.1 suppression de compte** : indique le chemin Mon garage › Réglages › Supprimer mon compte.
5. **Métadonnées** : pas de mention « bêta », « Android », « site web » dans le texte ni les captures.
