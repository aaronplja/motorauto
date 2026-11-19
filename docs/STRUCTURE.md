# Organisation du dépôt (ORG-203, ORG-204, ORG-205)

```
index.src.html        source de la page (assemblée avec pages/*.html) ; `node scripts/build.js` produit index.html et les bundles
pages/ pages/modals/  fragments HTML de chaque page et fenêtre
js/                   cœur : app, common, router, utils, game-core (partagé avec le serveur), game-engine, quiz-bank, i18n…
js/game/              cartes, duels, batailles, quiz, minijeux, saisons, boutique, échanges, marché
js/social/            profils, pilotes, clubs, communauté, suivis, présence, parrainage, signalements
js/catalogue/         catalogue, fiches, marques, comparateur, partage de voitures, import de données
js/chat/              chat, mentions
js/admin/             administration (chargée à la demande)
js/data/              données du catalogue
css/                  fonts, style, system (dernière feuille chargée)
css/base/ components/ pages/ themes/   feuilles rangées par rôle (l'ordre de chargement reste celui de index.src.html)
fonts/                polices hébergées
functions/            Cloud Functions (game-core.js et quiz-bank.js y sont des copies : `node scripts/sync-functions.js`)
docs/                 documentation (CHANGELOG.md est généré)
types/ tsconfig.check.json   vérification de types : `npm run check:types` (utils, game-core, quiz-bank)
```

Règle : un nouveau fichier JS ou CSS se range dans le dossier de son rôle, puis se déclare dans `index.src.html` (l'ordre compte pour le CSS).
