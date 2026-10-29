# MOTORAUTO

Site statique (HTML/CSS/JS) + Firebase (Auth, Firestore, Storage). Aucune étape de build.

## Structure
- `index.html` : application à pages (routeur `#/…`) : accueil, catalogue, fiche, communauté, classements, circuit, profil pilote, garage, administration, contact
- `chat.html` : **page de chat indépendante** (salon général, canaux, messages privés) ; liens `chat.html#global`, `#channel/<id>`, `#dm/<uid>`
- `css/base.css` (thèmes, boutons, formulaires, toasts) · `css/style.css` (accueil) · `css/chat.css` (chat)
- `js/firebase-init.js` · `js/utils.js` · `js/common.js` (partagés) · `js/app.js` (cœur) · `js/router.js` (pages) · `js/social.js` · `js/community.js` · `js/circuits.js` · `js/admin-tools.js` · `js/garage-tools.js` · `js/chat.js` (chat) ; `css/pages.css` (pages)
- `js/data.js`, `js/data2.js` : catalogue de base
- `firestore.rules`, `storage.rules`, `firebase.json`
- `scripts/set-admin.js` : attribue le droit admin (custom claim)
- `tests/utils.test.js` : `node tests/utils.test.js`

## Déploiement
1. **Change le mot de passe du compte admin** (l'ancien était exposé dans le code).
2. `firebase deploy --only firestore:rules,storage` (Storage doit être activé, plan Blaze).
3. Administration : le compte `admin@motorauto.fr` est reconnu automatiquement (règles + interface). Pour un autre admin : `node scripts/set-admin.js <email>` (clé de service requise).
4. Restreins la clé API Firebase à ton domaine dans Google Cloud Console.

## Limites connues
- Unicité des pseudos non garantie en cas de course.
- Supprimer un utilisateur depuis l'admin ne supprime pas son compte Auth.
- Les véhicules intégrés (`js/data*.js`) ne sont pas supprimables depuis l'admin.
- L'import « depuis un lien » dépend de la mise en page du site lu : toujours relire le brouillon.

## Contact
« Envoyer ma demande » écrit un message privé à l'administrateur (voir plus bas) ; « Ouvrir dans ma messagerie » ouvre un mail pré-rédigé vers motorautofr@gmail.com.

## Photos
- Profils : téléversement depuis la galerie/fichiers (jusqu'à 25 Mo, redimensionné à 768 px) → `avatars/<uid>/`.
- Chat : photos d'origine jusqu'à 20 Mo → `chat_media/<uid>/`.
- Pense à redéployer `storage.rules`.

## Comparateur & application installable
- Bouton ⇄ sur chaque carte/fiche : jusqu'à 3 véhicules comparés (puissance, couple, vitesse, 0-100).
- `manifest.webmanifest` + `assets/` : le site peut s'installer sur l'écran d'accueil (mobile/PC).

## Notifications & mentions
Cloche en haut à droite (accueil et chat) : réponses, mentions `@pseudo`, messages privés, décisions sur vos suggestions. Stockage : `users/{uid}/notifications`. Dans le chat, taper `@` ouvre l'autocomplétion.

## Profil enrichi & badges
Voiture actuelle (photo, modifications) dans Paramètres. Badges calculés côté client depuis `global_laps` : Premier chrono, 10 / 50 chronos, Premier du circuit (≥ 2 pilotes sur le circuit), Sur le podium, Globe-trotter, Collectionneur, Projet documenté.

## Classement filtré
Par circuit, catégorie (traction, propulsion, 4x4, turbo, atmo…) et période. La transmission est déduite d'une table d'identifiants (`driveOf` dans `js/utils.js`) et le turbo des noms de moteurs ; ajoutez `drive: "propulsion"` à une fiche pour forcer. Les anciens chronos sont rattachés à la voiture par son nom.

## Fiches communautaires
Bouton « Proposer une modification » sur chaque fiche : correction ou photo (collection `suggestions`, stockage `suggestions/{uid}`). L'administrateur valide ou refuse depuis le panneau Administration ; le pilote est notifié ; les photos approuvées s'affichent sur la fiche.

## Règles à republier
`firestore.rules` et `storage.rules` (nouveaux chemins : `notifications`, `suggestions`, `car_photos`, champs `carPhoto`/`mods`/`carId`).

## Nouveautés (tour 3)
- **Contact → messagerie de l'admin** : « Envoyer ma demande » écrit un message privé à l'administrateur dans le salon (`private_chats`) et le prévient par notification. L'admin doit s'être connecté une fois au site (il publie son uid dans `config/admin`). « Ouvrir dans ma messagerie » reste disponible (mailto).
- **Filtres avancés** du catalogue : transmission, turbo/atmo, puissance min/max, 0-100 max, V-max min, période de production + tris supplémentaires.
- **Comparateur** : radar (profil global) et nuage puissance / V-max par motorisation.
- **Import en masse (Administration → Importer)** : CSV (modèle + export du catalogue + aperçu des erreurs) et import « depuis un lien » : lien de n'importe quelle page ou simple nom de véhicule ; la page est lue (via des relais publics si le site bloque la lecture), complétée avec Wikipédia, puis ouverte comme brouillon dans l'éditeur.
  Format CSV : une ligne = un moteur ; colonnes `id;brand;model;years;category;image;description;records;phase;phase_details;editions;engine;power;torque;speed;zero;transmission` ; plusieurs records/éditions dans une cellule séparés par `||`, un record s'écrit `Type|Description`.
- **Référencement & partage** : `node scripts/build-seo.js [--url https://ton-domaine] [--csv catalogue.csv]` génère `voiture/<id>.html` (aperçus Discord/WhatsApp + contenu indexable), `sitemap.xml` et `robots.txt`. À relancer avant un déploiement si le catalogue a changé. Les balises de `index.html` pointent vers `https://motorautoireyv.web.app` : remplace-les si tu as un autre domaine.
- **Abonnements** : bouton « Suivre », compteurs et listes d'abonnés / abonnements (`users/{uid}/following` et `followers`).
- **Signalement de messages** (⚑ dans le salon) : collection `reports`, file de modération dans l'administration (supprimer le message ou ignorer).
- Règles à republier : `firestore.rules` (nouveaux : `config`, `reports`, `following`, `followers`, notification `follow`).

## Nouveautés (tour 4)
- **Grade d'admin délégué** : l'admin principal (claim `admin` ou `admin@motorauto.fr`) voit « Nommer admin / Retirer admin » dans le registre des pilotes et sur chaque profil. Le pilote promu reçoit une notification, un tag **admin** s'affiche à côté de son nom (salon, profil, registre, communauté) et il peut gérer le catalogue, les signalements et les propositions. Seul l'admin principal peut nommer ou retirer. Données : collection `admins/{uid}`.
- **Photos multiples** : une voiture a un champ `images: [...]` (la première = `image`). Sur les cartes et la fiche, les photos défilent en glissant (ou avec les flèches au survol). L'éditeur admin accepte des URL **et** des fichiers de la galerie (sans limite de poids : l'image est réduite à 2600 px dans le navigateur, stockage `catalog_images/{uid}/…`).
- **20 voitures par page** (au lieu de 48) ; dégradé des cartes plus bas et plus léger.
- **Plusieurs voitures par profil** : Mon garage → « Mes voitures » (nom, année, motorisation, puissance, description, modifications, jusqu'à 8 photos). Collection `community_cars`. Affichées sur le profil public et sur la page **Voitures de la communauté** (onglet « Communauté »).
- **Nouvelles fiches** : Nissan Silvia PS13, Onevia, Sileighty, Peugeot 206 Quiksilver ; la S13 mentionne 180SX / **200SX** / 240SX. Les chiffres sont issus de sources générales : à vérifier, et les photos réutilisent `img/silvia-s13.jpg` / `img/206-berline.jpg` en attendant les tiennes (bouton « Modifier » sur la carte).
- **E-mails automatiques** (dossier `functions/`, Cloud Functions, plan Blaze) :
  - bienvenue à la première connexion, « bon retour » après 12 h d'absence (le client écrit `login_events/{uid}` à la connexion) ;
  - un e-mail à chaque notification du site (réponse, mention, message privé, abonné, décision admin, changement de grade), plafonné à 6 par heure et par pilote ;
  - désactivables par chaque pilote (Mon garage → Paramètres → « Recevoir un e-mail… »).
  Mise en route :
  ```
  cd functions && npm install && cd ..
  firebase functions:secrets:set SMTP_PASS
  # crée functions/.env avec : SMTP_HOST=… SMTP_PORT=465 SMTP_USER=… MAIL_FROM="MOTORAUTO <no-reply@ton-domaine>" SITE_URL=https://ton-site
  firebase deploy --only functions
  ```
  Change `REGION` dans `functions/index.js` pour correspondre à la région de ta base Firestore. Il te faut un compte SMTP (Brevo, Mailjet, Gmail avec mot de passe d'application…). Gabarits testés : `node tests/mail.test.js`.
- Menu : 6 entrées (texte seul sur écrans ≥ 1280 px, icônes seules en dessous) ; plus aucun chevauchement relevé de 320 à 1920 px.
- **Règles à republier** : `firestore.rules` (nouveaux : `admins`, `community_cars`, `login_events`, notification `role`, champ `emailNotifs`) et `storage.rules` (nouveau : `catalog_images`, admin délégué via `firestore.exists`). Lors de la publication de `storage.rules`, la console peut demander d'autoriser Storage à lire Firestore : accepte.
- **Mobile** : le bouton central de la barre du bas est maintenant « Communauté » ; il ouvre un menu à tuiles (Salon, Voitures de la communauté, Pilotes, Classement, Mon profil, Contact) avec pastille « Nouveau » quand il y a des messages non lus.

## Nouveautés (tour 5) — site réorganisé en vraies pages
Adresses : `#/` accueil · `#/catalogue` · `#/voiture/<id>` · `#/communaute/{fil,voitures,pilotes,evenements}` · `#/voiture-pilote/<id>` · `#/classement/{chronos,circuits,voitures}` · `#/circuit/<clé>` · `#/pilote/<uid>` · `#/garage/{apercu,voitures,entretien,parametres}` · `#/admin/{tableau,moderation,catalogue,journal}` · `#/contact`. Les anciens liens `?car=` / `?pilot=` / `?q=` et les pages `voiture/<id>.html` fonctionnent toujours.
- **Compte-tours** de l'accueil : échelle 0–2000 ch, graduations fines, zone rouge, aiguille effilée.
- **Réactions** : j'aime, commentaires et notes (plaisir / fiabilité / entretien) sur les fiches du catalogue et les voitures des pilotes, avec notification. Classement « les plus aimées » / « les mieux notées ».
- **« Voir aussi »** (champ « déclinaisons » de l'éditeur admin + familles Silvia, Skyline, Z, Peugeot prédéfinies), galerie de vignettes et historique sur la fiche.
- **Fil d'actualité**, **sorties** avec « j'y vais », **pages circuit** (record, courbe, comparaison de deux pilotes).
- **Chat** : « Vu à HH:MM » dans les messages privés.
- **Admin** : tableau de bord (visites, inscriptions, voitures les plus vues, signalements), sourdine des pilotes (1 h → définitive), journal des actions.
- **Garage** : carnet d'entretien avec rappels par date ou kilométrage.
- Nouvelles collections Firestore : `likes`, `votes`, `comments`, `feed`, `events`, `rsvps`, `stats`, `car_views`, `mutes`, `admin_log`, `private_chats/*/seen`, `users/*/maintenance` → **republier `firestore.rules`**. `storage.rules` ne change pas.
- Limite connue : les compteurs (j'aime, notes, commentaires) sont agrégés côté navigateur (jusqu'à 5000 j'aime / 5000 notes / 3000 commentaires lus). Largement suffisant pour une communauté de quelques centaines de pilotes ; au-delà il faudra des compteurs côté serveur.

## Nouveautés (tour 6) — jeu, communauté et outils

**Pilotes**
- Niveaux, XP, 20 badges (`js/gamify.js`) et classement des pilotes les plus actifs (Classement › Pilotes, et accueil). Série de visites (`streaks/{uid}`) avec flamme sur le profil.
- Cartes à collectionner (`js/cards.js`, Garage › Cartes) : chaque fiche du catalogue est une carte (rareté calculée sur la puissance, la collection grandit avec le catalogue). 1 pack gratuit par jour, 1 pack bonus par badge, doublons → poussière → fabrication de la carte voulue. Collection publique sur les profils.
- Réactions rapides 🔥 🏁 😍 (`reactions`), fil « Mes abonnements », clubs par marque / région avec fil et classement (`js/clubs.js`), annonces entre pilotes avec signalement (`js/market.js`).
- Garage : jauge de ma voiture partageable en image (champ « 0-100 » ajouté aux voitures de pilote), garage virtuel (rangée de cartes + total de chevaux), budget & consommation (`users/{uid}/costs`), journal avant / après (`users/{uid}/journal`), export du carnet d'entretien en PDF (fenêtre d'impression : « Enregistrer au format PDF »).

**Catalogue**
- Comparateur : poids, ch/tonne, kg/ch, courbes de couple et de puissance (estimées) — `js/data-extra.js` contient poids / transmission / budget indicatifs de chaque fiche (à compléter pour les nouvelles fiches, sinon estimation automatique).
- Mode duel `#/duel/a/b` : course animée 0-100 km/h ou 400 m D.A. (400 m estimé), résultat partageable en image. Quiz `#/quiz`. Voiture du jour sur l'accueil (rappel quotidien facultatif : notification du navigateur quand le site est ouvert).
- Carte des sorties (`js/map.js`, tuiles OpenStreetMap, géocodage Nominatim à la création d'une sortie) ; fiches circuits éditoriales (`circuit_info`, éditées par l'admin sur la page du circuit).

**Admin**
- Onglet « À traiter » (propositions, signalements du salon, annonces signalées, demandes de fiches) et réponses toutes prêtes (menu « Réponse rapide » dans la messagerie), import par tableur collé.
- `node scripts/build-seo.js` génère maintenant des pages `voiture/` enrichies (tableau technique, FAQ, liens) et une page `marque/` par marque, avec données structurées. À relancer avant chaque déploiement.

**Règles** : `firestore.rules` contient les nouvelles collections (streaks, collections, reactions, clubs, club_members, club_posts, listings, listing_reports, circuit_info, canned_replies, users/{uid}/costs|journal). Les règles Storage sont inchangées (les photos d'annonces et du journal vont dans `car_photos/{uid}/`).

**Limites** : le tirage des cartes et la série de visites sont calculés dans le navigateur (les règles n'en contrôlent que la forme et le rythme) ; les chronos du duel, les courbes et les poids sont des estimations ; les aperçus de partage riches existent pour les fiches voiture (pages statiques), pas pour les chronos ou profils.

## Nouveautés (tour 7) — jeu vérifié par le serveur, échanges, défis, concours

**Navigation** : un seul menu « Jouer » (`#/jouer/…` : Aperçu · Cartes · Échanges · Défis · Concours) regroupe le jeu ; le garage a 4 onglets (Aperçu · Mes voitures · Suivi · Réglages, le suivi regroupe entretien, budget et journal) ; l'admin a 5 onglets (Tableau · Modération · Catalogue · Jeu · Journal). Les anciennes adresses redirigent automatiquement.

**Le tirage des cartes est fait par le serveur** (Cloud Functions `functions/game.js`) : le navigateur ne peut plus écrire dans `collections`, `streaks`, `trades` ni `weekly` (règles Firestore). Même règles de jeu des deux côtés grâce à `js/game-core.js` (copié dans `functions/` par `node scripts/sync-functions.js`).

- **Échanges** : on propose un doublon contre un doublon qui manque ; chaque proposition envoie aussi un message privé + une notification ; l'acceptation déplace les cartes en transaction.
- **Défis de la semaine** : 4 défis tirés chaque lundi, vérifiés par le serveur (poussière ou pack bonus ; les 4 réussis = pack bonus en plus).
- **Wishlist** : visible sur le profil, signale les échanges possibles.
- **Caractéristiques** : bouton « 📊 Caractéristiques » sur les profils et dans le garage.
- **Concours photo mensuel** : un thème, une photo par pilote (validée par l'admin avant d'être visible), un vote par pilote, clôture automatique le 1er du mois (gagnant : badge + carte spéciale unique ; 2ᵉ et 3ᵉ : poussière).
- **Cartes spéciales** : Admin › Jeu : création/modification complète, tirage limité, attribution et retrait à un pilote (exemplaires numérotés).

### Déploiement de ce tour (obligatoire, sinon les cartes ne s'ouvrent plus)
```
node scripts/sync-functions.js        # à refaire quand js/data*.js ou js/game-core.js changent
cd functions && npm install && cd ..
firebase deploy --only functions,firestore:rules
```
Le plan Blaze est requis (fonctions + planificateur Cloud Scheduler pour la clôture mensuelle). Les e-mails restent désactivés : mets `MAIL_ENABLED=true` dans `functions/.env` pour les réactiver (voir tour 4). Les voitures ajoutées depuis l'admin sont prises en compte automatiquement par le tirage.

### Mode sans Cloud Functions (par défaut tant qu'elles ne sont pas déployées)
Si les fonctions ne répondent pas, `js/game-api.js` bascule automatiquement sur le même moteur exécuté dans le navigateur (`js/game-engine.js`, copie de `functions/game.js` générée par `node scripts/sync-functions.js`). Tout marche (packs, craft, défis, série, concours, cartes spéciales) sauf les **échanges**, qui exigent le serveur. Les règles Firestore bornent alors ce que chaque pilote peut écrire, mais la triche reste possible pour un pilote averti : déployer les fonctions la supprime.

## Nouveautés (tour 8)
- **Pages légales** (`#/legal/mentions`, `#/legal/confidentialite`, `#/legal/cgu`) : renseigne `editorName`, `editorAddress`, `publicationDirector` en tête de `js/legal.js`. Case de consentement à l'inscription.
- **Suppression de compte** (Paramètres → Zone sensible) : Cloud Function `deleteAccount` (`functions/delete-account.js`) efface profil, collection, publications, chronos, photos et le compte de connexion. Test : `node tests/delete.test.js`.
- **Règles Firestore** : `tests/rules.test.js` (émulateur, Java requis) — commande en tête du fichier.
- **Aperçus de partage** : balises Open Graph / Twitter dans `index.html`, image `assets/og-image.png` (1200×630).
- **Profil public** refondu (onglets, vitrine des 6 plus belles cartes, réseaux Instagram/Snap/TikTok par lien ou pseudo) et **classement des collectionneurs** (Classements → Collection).
- **Événements saisonniers** : Administration → Cartes spéciales → case « Événement » + dates ; les pilotes récupèrent la carte (1 chacun) via la bannière de l'onglet Jouer (Cloud Function `claimSpecial`).
- **Recherche tolérante** (fautes de frappe, noms alternatifs), **corbeille des notifications**, **icônes vectorielles** à la place des émojis, **effet verre dépoli** sur tout le site.
- Après mise à jour : `node scripts/sync-functions.js`, `cd functions && npm install`, `firebase deploy --only functions --project motorautoireyv`, republier `firestore.rules`.

## Nouveautés (tour 9)
- **Moteurs** : chaque moteur d'une fiche est cliquable (`#/moteur/<code>`) et liste toutes les voitures qui le partagent. Le code moteur vient du champ « Code moteur » ou de la parenthèse finale du nom (ex. `1.6 16V (TU5JP4)`). Admin : « Ajouter ce moteur à une voiture ».
- **Éditeur de véhicule (admin)** : ID automatique, suggestions de marques et de phases, « Choisir un moteur existant », « Dupliquer » un moteur, champs Histoire / Anecdotes / Archives (anciens catalogues, publicités, envoi d'images).
- **Fiche véhicule** : sections Histoire et Anecdotes, bouton Archives.
- **Admin → Jeu** : outils de test (pack de test illimité, packs bonus, poussière, réarmer, tout débloquer, remise à zéro) et annonce à tous les pilotes. Nouvelles Cloud Functions : `adminGameTool`, `adminBroadcast` (à déployer).

## Nouveautés (tour 10)
- **Chat** : messages vocaux (micro, 2 min max, `chat_voice/` dans Storage) et fiches véhicule envoyées depuis la fiche (« Envoyer dans le chat » → salon, canal ou message privé). Règles Firestore **et** Storage à republier.
- **Commentaires** : tag `@pseudo` avec suggestions, notification « mention ».
- **Parrainage** : lien `?ref=<uid>` affiché dans Jouer ; +1 pack bonus pour le parrain et le filleul (fonction `claimReferral`, collection `referrals`, 30 filleuls max par parrain).
- Fonctions à (re)déployer : `claimReferral` (nouvelle) et les précédentes (`adminGameTool`, `adminBroadcast`).

## Nouveautés (tours 11 et 12)
- **Cartes** : nouvelle mise en page (barres de caractéristiques, effet holo, pastille NEW), ouverture de paquet en plusieurs étapes, vues grille / compacte / albums, tri, fiche 3D avec verso et navigation, **Bataille** d'entraînement (`js/card-battle.js`). Animations uniquement en transform/opacity, grille rendue par paquets de 36.
- **181 nouvelles fiches** : 38 Alfa Romeo (`js/data-alfa.js`), 72 Audi (`js/data-audi.js`) et 71 voitures des 24 Heures du Mans (`js/data-lemans.js`, catégorie **Le Mans**, identifiants `lm-…`). Elles sont écrites avec `js/data-kit.js` et contiennent une biographie, des anecdotes, des records, des phases et des moteurs. Les chiffres marqués `approx` sont indicatifs (une note s'affiche sur la fiche).
- Après toute modification des données : `node scripts/sync-functions.js` puis `node scripts/build-seo.js`.
- Les images à déposer dans `img/` sont listées dans `IMAGES-A-AJOUTER.txt`.
- Classement des raretés : les voitures du Mans comptent à 60 % de leur puissance pour ne pas écraser les voitures de route.

### Fiches complétées (tour 13)
- Les 292 fiches ont désormais une histoire, au moins une anecdote et un palmarès ; les couples, vitesses max et 0-100 manquants ont été ajoutés (fichiers `js/data-enrich-*.js`, `data-enrich-more1/2.js`).
- `js/data-enrich-auto.js` génère un palmarès à partir des chiffres de la fiche pour les voitures sans record.
- Les chiffres anciens ou de course sont signalés « indicatifs » sur la fiche.

### Interface : passe de finition (tour 14)
- `css/polish.css` (chargé en dernier) : champs de saisie homogènes (16 px pour éviter le zoom iOS), boutons qui passent à la ligne au lieu d'être coupés, fenêtres sans débordement, titres jamais coupés, en-tête adapté aux écrans de 320 px, onglets défilants, cibles tactiles de 44 px, boutons d'action de la fiche en grille.
- `js/polish.js` : le verrouillage du défilement ne peut plus « fuir », les fenêtres plein écran des cartes ont une croix et se ferment à la navigation, la barre du bas s'efface quand le clavier est ouvert, l'onglet actif reste visible.
- Fiche voiture : « Palmarès & records » (plus de doublon avec « Historique »), section « Versions & générations » masquée quand elle n'apporte rien.
- Salon : texte d'invite raccourci sur petit écran.

## Tour 15 — Chat « messagerie » et échanges dans la conversation
- Liste des messages privés : conversations triées par dernière activité, aperçu du dernier message, « il y a… », « Vu/Envoyé il y a… », pastille non lu ; bouton « ✉ Nouveau » pour écrire à un nouveau pilote.
- Chaque conversation a un résumé `private_chats/{conv}` (règles Firestore à republier).
- Une proposition d'échange arrive comme carte dans le chat avec Accepter / Refuser (Annuler côté auteur) ; la carte et un message de statut se mettent à jour automatiquement (fonctions à redéployer : `firebase deploy --only functions`).
- Correctifs mobile : échanges (débordement, glissement), ouverture des boosters, retournement des cartes.

## Tour 16 — Navigation et refonte visuelle v2
- Navigation : 4 pages (Accueil, Catalogue, Jouer, Communauté) + « Moi ». Sur mobile : barre d'onglets ancrée en bas (5 entrées) ; sur ordinateur : le bouton du compte ouvre le même menu « Moi » (garage, cartes, profil, messages, admin, classement, ambiance, contact, légal, déconnexion). Code : `js/nav.js`.
- Refonte visuelle : `css/refonte.css` (dernière feuille) — en-tête ancré, surfaces plates, rayons unifiés, boutons à aplat d'accent, feuille « Moi », modales en feuille basse sur mobile. Compatible avec les 16 ambiances.
- Plus de doublons : thème retiré de l'en-tête (dans « Moi »), pied de page réduit aux liens essentiels.

## Tour 17 — Fluidité Android et en-tête opaque
- Suppression du « verre » (backdrop-filter, surfaces translucides), du halo plein écran fixe (`body::before`), des flous animés, des perspectives 3D par carte et des animations de fond sur mobile/tactile : cause du clignotement sous Android. En-tête et barre du bas opaques. Tout est dans la fin de `css/refonte.css`.
