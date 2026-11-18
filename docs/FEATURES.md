# MOTORAUTO — Phase 1 : audit, inventaire des fonctionnalités et plan de migration

Document à valider avant d'écrire la moindre ligne de la refonte. Rédigé le 10/11/2026 à partir du code réel du dépôt
(`index.src.html`, 149 modules `js/`, 30 feuilles `css/`, `functions/`, `firestore.rules`, `storage.rules`, `scripts/`, `tests/`, `app-ios/`, `apk/`, `.github/`).

---

## 1. État des lieux en chiffres

| Élément | Constat |
|---|---|
| Application | Page unique à routeur par ancre (`#/…`), 23 pages + 22 fenêtres modales, 149 scripts, 30 feuilles de style |
| Catalogue | 621 fiches, 61 marques, 50 fichiers `js/data*.js` (≈ 1,3 Mo de JavaScript) ; une copie statique `functions/catalog-static.json` pour le serveur |
| Backend | Firebase (Auth, Firestore, Storage, Functions Node, FCM), région des fonctions `europe-west1`, 4 000 lignes de fonctions |
| Règles | `firestore.rules` 1 271 lignes (≈ 80 collections), `storage.rules` 88 lignes |
| Tests | 17 fichiers de tests Node (jeu : 281 vérifications, cartes, thèmes, e-mail, utilitaires…) ; un test de règles (`rules.test.js`) qui nécessite l'émulateur |
| Mobile | `app-ios/` (Capacitor, fiche App Store, audit Apple), `apk/` + workflow GitHub « Build APK » |
| Langues | Français, anglais, espagnol, allemand, italien (traduction à la volée via `i18n.js`) |
| Images | `img/` 148 Mo (287 JPG, jusqu'à 7 Mo pièce), `share/` 58 Mo (1 242 JPG) |
| Dépôt Git | 3 427 fichiers suivis dont **1 560 « copies Finder »** (cf. §8), 174 Mo de pack |

---

## 2. Inventaire fonctionnel

Légende : **[B]** = demandé dans ton brief · **[+]** = existe dans le site mais n'est pas dans ton brief (à conserver sauf avis contraire).

### 2.1 Navigation, pages et routes
Barre basse mobile « dock » + barre haute qui se masque ; menu « Moi ». Adresses actuelles :

| Route | Contenu |
|---|---|
| `/` | Accueil « Garage » pour les connectés (voiture du jour, pack du jour, séries, accès rapides), accueil visiteur sinon [B] |
| `/catalogue`, `/voiture/:id`, `/moteur/:clé`, `/comparer/:ids`, `/frise` | Encyclopédie : recherche, filtres, fiche, moteurs partagés, comparateur partageable, frise chronologique [B][+] |
| `/communaute/(fil, voitures, pilotes, evenements, carte, hub-…)`, `/voiture-pilote/:id`, `/pilote/:uid`, `/clubs`, `/club/:id`, `/annonces` | Communauté : fil, voitures proposées, pilotes, sorties + carte, clubs, annonces entre pilotes [B][+] |
| `/jouer/(cartes, collection, boutique, echanges, minijeux, defis, concours)`, `/duel`, `/fusion`, `/marche`, `/souhaits`, `/plusmoins`, `/quiz`, `/succes`, `/pass` | Jeu de cartes et mini-jeux [B][+] |
| `/classement/(chronos, circuits, voitures, pilotes, collection)`, `/circuit/:clé` | Classements et circuits [B] |
| `/garage/(apercu, voitures, suivi)` | Mon garage : mes voitures, carnet d'entretien, rappels [B][+] |
| `/reglages/(profil, ambiance, notifications, carte)` | Réglages, thèmes, accessibilité, langue, vie privée, suppression de compte [B] |
| `/admin/(tableau, moderation, catalogue, jeu, journal, erreurs)` | Espace admin [B] |
| `/contact`, `/legal/:doc`, `/nouveautes` | Contact, mentions légales / confidentialité / CGU, journal des mises à jour |
| `chat.html` | Salon des pilotes, **page indépendante** [B] |
| `voiture/*.html` (621), `marque/*.html` (60), `sitemap.xml` | Pages statiques générées pour Google et les aperçus de partage (`scripts/build-seo.js`) [B] |

### 2.2 Compte, profil, vie privée
- Connexion e-mail + mot de passe, Google ; réinitialisation ; suppression de compte (fonction `deleteAccount`, efface les données).
- Profil : photo, pseudo, bio, réseaux (Instagram, TikTok, Snapchat), **bannière = une de ses voitures** [B], cadres d'avatar et titres équipables, vitrine de cartes, distinctions, caractéristiques complètes, statut « en ligne / dernière connexion ».
- Mentions `@pilote` et `#voiture` dans messages, commentaires et bios.
- Blocage de pilotes, signalements (4 motifs), mise en sourdine, parrainage (`?ref=`, +1 pack pour les deux), mentorat (niveau ≥ 4).
- Vie privée : carte des pilotes (position approximative, optionnelle), présence, préférences de notifications par catégorie.

### 2.3 Catalogue / encyclopédie [B]
- Recherche globale (Ctrl/Cmd+K), bandeau des marques, filtres en feuille montante (marque, époque, pays, catégorie, motorisation…), tri, compteur.
- Fiche en onglets (Aperçu · Moteurs · Circuit · Photos) : 0-100, V-Max, puissance, palmarès, historique, anecdotes, modèles liés, généalogie, rivales d'époque, galerie multi-photos, glisser pour changer d'onglet.
- Règle conservée : une fiche par voiture, **les Renault restent groupées** (à confirmer au moment de la migration, cf. §9).
- Photos : likes, commentaires, notes (plaisir / fiabilité / entretien), suivre une voiture ou une marque, voiture du jour, vues, partage (lien + image générée), import « tout-en-un » (lien web, Wikipédia) côté admin.
- Voitures de la communauté : proposition par un pilote (photos multiples) → file de modération admin → publication.

### 2.4 Jeu de cartes [B]
Toute la logique est dans `js/game-core.js` (règles **partagées** navigateur/serveur) et `functions/game.js` (autorité serveur).
- Une fiche = une carte, raretés calculées (`computeRarities`), cartes à **plusieurs images débloquées une à une sans compter les doublons** [B], progression par barre/courbe, 25 cartes par page [B].
- Collection, packs (3 cartes), boutique, cristaux, craft/amélioration, fusion, recyclage, verrouillage, cartes spéciales et livrées, cartes sacrées, défis de la semaine et défis de cartes, série quotidienne + gels, roue, calendrier de l'Avent, pass de saison (30 paliers), parrainage, succès et titres.
- Échanges entre pilotes, marché de cartes, fil « je cherche / je propose », liste de souhaits + résumé quotidien.
- **Batailles** : contre l'IA, et en direct contre un joueur (invitation par chat, mains équilibrées par raretés, récompenses, émotes, revanche). Duel physique de voitures (ligne droite), défis entre pilotes, clash de clubs.
- Mini-jeux : plus ou moins, quiz, chrono. Concours photo mensuel (votes, signalements, clôture automatique).
- Fonctions appelables (toutes derrière connexion + validations serveur) : `syncCollection, openPack, craftCard, upgradeCard, touchStreak, buyFreeze, seasonClaim, claimWelcome, clubClash, logAction, weeklyStatus, claimChallenge, cardChallenges, claimCardChallenge, battleInvite/Respond/Cancel/Play/Claim/Emote, proposeTrade, respondTrade, cancelTrade, claimSpecial, claimReferral, claimSets, adminGameTool, adminBroadcast, adminGrantCard, adminContest, fuseCards, pmPlay, quizSubmit, lockCard, recycleCards, spinWheel, openAdvent, chronoStart, chronoSubmit, marketList, marketBuy, marketCancel`.

### 2.5 Chronos et classements [B]
Chronos par circuit (démarrage/validation côté serveur `chronoStart/chronoSubmit`, anti-triche), classements chronos / circuits / voitures / pilotes / collection, pages circuit (record, courbe de progression), niveaux et badges, série de visites, filtres.

### 2.6 Chat [B]
Salon général en temps réel, canaux personnalisés, messages privés, mentions, réactions et émojis, partage de fiche voiture dans le chat, invitations de bataille, présence. Photos téléversées vers Storage (compression canvas côté client), filtres de blocage / sourdine, modération (supprimer / masquer / signaler), réponses prédéfinies admin. Page indépendante `chat.html`.

### 2.7 Événements, notifications, e-mails [B]
- Sorties/événements : inscription « J'y vais », albums photo réservés aux inscrits, carte (tuiles OpenStreetMap maison), calendrier de clubs.
- Notifications : in-app (collection `notifications`), push FCM (`pushOnNotification`, `firebase-messaging-sw.js`), préférences par catégorie, rappel quotidien 18 h, point rouge admin.
- E-mails via SMTP (Brevo) : `onLoginMail` (connexion au compte) et `onNotificationMail` (événements), expéditeur `no-reply@motorauto.fr`. **Aucun e-mail pour les messages** (à vérifier lors de la phase 7, cf. §9).
- Suivi automatique : `followCatalog`, `followPilotCar`, `followSpecialCard`, `newsPublished`.

### 2.8 Thèmes, accessibilité, langues [B]
- **16 thèmes** (onyx-carbon par défaut, abyss-titanium, alpine-horizon, asphalt-smoke, **carrara-white**, cyber-matrix, ivory-dune, midnight-blue, mint-speedway, monza-night, nordic-frost, rose-gold-gt, silver-arrow, solar-flare, tokyo-neon, velvet-gothic) + **thème sur mesure** (fond + accent) + thèmes saisonniers.
- Animations (complet / fluide / réduit), taille du texte, contraste, 5 langues, popups d'aide à la première visite.

### 2.9 Espace admin [B]
Rôles actuels : e-mail `admin@motorauto.fr` codé en dur **ou** claim `admin` **ou** document `admins/{uid}` (3 mécanismes à unifier).
- Tableau « à traiter » (tout ce qui attend une décision), statistiques (visites anonymes, inscriptions, voitures les plus vues), recherches sans résultat.
- Catalogue : éditeur de véhicule en 3 étapes, import (lien, Wikipédia, en masse), doublons, raretés, voitures de pilotes.
- Modération (signalements, annonces, concours, chat), bannissement, gestion des événements, annonces/broadcasts et notifications.
- Jeu : outils admin, octroi de cartes, concours, cartes spéciales, diffusion.
- Journal des actions (`admin_log`, `journal`), erreurs navigateur (`client_errors`), sauvegarde Firestore hebdomadaire (`weeklyBackup`).
- [+] **Éditeur visuel de l'interface** (PC / mobile séparés, brouillon, publication, versions, scènes planifiées) : conserver ou remplacer par le futur système de composants (cf. §9).

### 2.10 Pied de page, mentions, contact
Formulaire de contact → `motorautofr@gmail.com` (`CONTACT_TO` dans `js/app.js`), pied de page actuel « © 2026 MOTORAUTOFR — by aaronplja » (**différent de ton brief** : « 2026 MOTORAUTOFR - by aaronplja / Tous droits réservés »), mentions légales sans adresse postale (éditeur particulier : PELLEJA Aaron).

### 2.11 Applications
- iOS : Capacitor (`app-ios/`), pont `native.js`, fiche App Store, audit Apple.
- Android : workflow GitHub « Build APK » (Capacitor, icônes générées, `apk/www`).
- PWA : manifeste, service worker FCM, installation.

---

## 3. Collections Firestore actuelles (à normaliser)
`users, garage, community_cars, motorauto_catalog, collections, special_cards, special_grants, hands (batailles), card_battles, trades, card_listings, listings, wishlists, cosmetics, titles, streaks, stats, gstats, weekly, contests, contest_entries/votes/reports, global_chat, global_laps, chat, private_chats, custom_channels, messages, reactions, comments, likes, feed, follows/followers/following, clubs, club_members, club_posts, club_events, club_event_rsvp, events, rsvps, event_photos, notifications, notif_prefs, push_tokens, presence, pilot_locations, mentors, mentor_requests, blocks, mutes, reports, car_reports, car_views, referrals, suggestions, guides, news, maintenance, circuit_info, search_misses, site_stats, login_events, client_errors, admin_log, journal, admins, set_claims, ui_layout, ui_layout_versions, config, costs, databases, canned_replies`.

## 4. Constats techniques (ce qui justifie la refonte)
1. **Sécurité des rôles** : 3 mécanismes d'admin (e-mail en dur, claim, document). Cible : custom claims uniquement (`admin`, `delegatedAdmin`, `moderator`), jamais de vérification côté client seule.
2. **Doublon de logique** : `game-core.js` existe en 3 exemplaires (navigateur, `functions/`, copie) et `game-engine.js` répète la logique serveur dans le navigateur. Cible : une seule source côté serveur + types partagés.
3. **569 usages d'`innerHTML`** (protégés par une fonction `esc()`, mais un oubli = faille XSS). Cible : React (échappement par défaut), interdiction par règle de lint.
4. **Poids** : 2,7 Mo de JS non minifié avant optimisation ; catalogue embarqué dans le JS. Cible : données en Firestore + index de recherche, code découpé par page.
5. **Routage par ancre** (`#/…`) : mauvais pour le SEO. Cible : vraies URL (`/voiture/alfa-romeo-147`) + redirections des anciennes.
6. **Images** : 148 Mo de JPG jusqu'à 7 Mo ; pas de WebP/AVIF. Cible : pipeline de conversion + tailles adaptées.
7. **Région** : fonctions en `europe-west1`. À vérifier : région réelle de Firestore (ton brief indique `eur3`) — impossible à lire depuis le code, à confirmer dans la console Firebase.
8. **Dépôt pollué** (cf. §8).
9. **Tests de règles** : `tests/rules.test.js` n'est pas exécutable sans l'émulateur Firebase installé ; cible : émulateur en CI.

---

## 5. Écarts entre ton brief et le site actuel (à trancher)
| Point du brief | Site actuel | Proposition |
|---|---|---|
| Aucun émoji dans la structure | `emoji-icons.js` remplace déjà les émojis par des icônes SVG, mais de nombreux libellés en contiennent | Jeu d'icônes SVG unique, émojis autorisés seulement dans le contenu (chat, commentaires, réactions) |
| Aucune vibration | Aucun appel `navigator.vibrate` | Rien à faire, vérifié |
| Chargement uniquement à l'ouverture | Écran de démarrage `#splash` à l'ouverture, transitions entre pages | Conserver le principe : splash unique au lancement, squelettes discrets ensuite |
| Boutons pilule/ronds | Boutons mixtes | Règle du design system |
| Pied de page « 2026 MOTORAUTOFR - by aaronplja / Tous droits réservés » | « © 2026 MOTORAUTOFR — by aaronplja » | Appliquer ton texte exact |
| Accueil sans « À essayer » | Section absente du code actuel | OK |
| Chat : photos > 1 Mo compressées | Compression canvas présente (app/share/common) ; à vérifier spécifiquement dans le chat | À valider/compléter en phase 5 |
| Admin délégué / modérateur | Admin seul + document `admins` | Trois rôles via claims |
| Importer Wikidata / Commons / NHTSA | Import Wikipédia + lien web, `fetch-images.js` | Pipeline complet en phase 4 |
| Capacitor + APK | iOS dans `app-ios/`, APK dans `apk/` + workflow | Conservés, branchés sur le nouveau build |

## 6. Fonctionnalités hors brief à CONSERVER (proposition : tout garder)
Batailles (IA et joueurs), duel, fusion, marché de cartes, souhaits, pass de saison, succès, roue, Avent, clubs et clashs, mentorat, parrainage, annonces entre pilotes, frise chronologique, comparateur, import tout-en-un, concours photo, albums de sorties, carte des pilotes, journal des nouveautés, éditeur visuel, i18n 5 langues, sauvegarde hebdomadaire.
→ Dis-moi celles que tu veux **abandonner** : chaque fonction retirée fait gagner du temps.

---

## 7. Architecture cible proposée

| Sujet | Décision proposée | Pourquoi |
|---|---|---|
| Front | **Vite + React + TypeScript**, routeur avec vraies URL, code découpé par page | Conforme au brief ; compatible Capacitor (build statique) |
| SEO | Pré-rendu des fiches (`/voiture/…`, `/marque/…`) généré à la mise en ligne depuis Firestore + sitemap ; déclenché par un hook Vercel quand une fiche change | Une base « illimitée » doit rester indexable ; évite Next.js, qui complique Capacitor |
| Données voitures | marques → modèles → générations/versions, slugs stables, champ `source` + `verifie` | Brief §4 |
| Recherche | Index Firestore pour les filtres + **Typesense/Meilisearch gratuit auto-hébergé ou Algolia (offre gratuite)** ; solution la plus simple pour démarrer : index de recherche léger (MiniSearch) généré à la mise en ligne, jusqu'à ≈ 20 000 fiches | Gratuit, rapide ; bascule vers un moteur dédié si le catalogue dépasse ce volume |
| Jeu | Un seul jeu de règles côté Cloud Functions ; le navigateur n'affiche que | Anti-triche, une seule source de vérité |
| Rôles | Custom claims, journal d'audit | Brief §3 |
| Design | Design system à 12–15 composants, jetons de thème (16 thèmes + sur mesure), icônes SVG | Brief §5 |
| Qualité | ESLint (règle contre `dangerouslySetInnerHTML`), Prettier, Vitest, émulateur Firebase pour les règles, Lighthouse en CI | Brief §1/§6/§7 |
| Hébergement | Vercel + GitHub, branche `refonte` = déploiement de prévisualisation, `main` inchangé | Règle de travail n°2 |

---

## 8. Nettoyage du dépôt (prérequis)
- **1 560 fichiers « copies »** suivis par git : `css/base 2.css`, `index 12.html`, `marque/ford 2.html`, `README 15.md`, `firestore 13.rules`, `share/alfa-romeo-145 2.jpg`… Ce sont des doublons créés par le Finder du Mac (1 487 sont identiques à l'original, **73 diffèrent** : à examiner avant suppression).
- Conséquences : poids du dépôt, confusion, déploiement de fichiers inutiles, risque d'éditer la mauvaise copie.
- Proposition : sur la branche `refonte`, je te donne la liste des 73 fichiers différents (comparaison fichier par fichier), puis la commande qui retire les 1 487 copies identiques de git. Rien n'est supprimé sans ton feu vert ; les données utilisateur (Firestore/Storage) ne sont pas concernées.
- À écarter aussi : `.github/workflows/build-apk 2.yml`.
- Prévoir un `.gitignore` qui bloque ce motif (`* [0-9].*`).

## 9. Plan de migration des données (aucune donnée supprimée)
1. **Sauvegarde préalable** : export Firestore complet (`gcloud firestore export` vers le bucket de sauvegarde) + copie de Storage ; vérification de restauration sur un projet de test.
2. **Projet de test** : tout le développement et les migrations se font d'abord sur un second projet Firebase (ou l'émulateur), jamais sur `motorautoireyv` tant que ce n'est pas validé.
3. **Compatibilité d'abord** : les collections utilisateurs (`users`, `collections`, `garage`, `chat`, chronos, cartes, `community_cars`, photos) restent **identiques** ; la refonte lit/écrit les mêmes documents. Les nouveaux champs sont ajoutés, jamais renommés sans script.
4. **Scripts de migration** (un par sujet, testés sur l'émulateur avec un export réel) :
   - catalogue : 621 fiches `js/data*.js` + `motorauto_catalog` → modèle marques/modèles/versions (slugs conservés = anciens `id`, redirections générées) ;
   - rôles : `admins` + e-mail codé en dur → custom claims ;
   - cartes : recalcul vérifié (aucune carte débloquée perdue, doublons d'images non comptés) ;
   - photos : conversion WebP/AVIF avec conservation des originaux.
5. **Bascule** : double écriture impossible ⇒ fenêtre de maintenance courte ; `main` reste en ligne jusqu'à validation complète ; retour arrière = redéployer `main`.
6. **Redirections** : toutes les adresses `#/…`, `voiture/*.html`, `marque/*.html` redirigent vers les nouvelles URL (le référencement Google est conservé).

---

## 10. Décisions à valider avant la phase 2
1. Pile technique : **Vite + React + TypeScript + pré-rendu SEO** (recommandé) — oui / autre.
2. Liste des fonctions hors brief à garder (§6) — tout garder / retirer : …
3. Éditeur visuel : garder (adapté aux composants) ou abandonner ?
4. Les Renault restent groupées : confirmer le périmètre exact (toutes les Renault, ou seulement certaines gammes ?).
5. Région Firestore réelle (console Firebase › Firestore › Paramètres) : `eur3` ? Et région des fonctions (aujourd'hui `europe-west1`) : on la garde ?
6. Pied de page : texte exact à utiliser.
7. Nettoyage des 1 560 copies Finder : feu vert pour que je prépare la liste et la commande.
8. Quota : le forfait Blaze est-il déjà actif ? (nécessaire pour les fonctions, les planifications et la sauvegarde).
