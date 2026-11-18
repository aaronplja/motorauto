# Règles de navigation

Ce document décrit comment on se déplace dans MOTORAUTO et comment ajouter une page sans casser le reste.
La source de vérité est `js/router.js` (tableaux `DEFS`, `PAGE_ID`, `NAV_OF`, `TITLES`, `REDIRECTS`).

## Principes
- **Une adresse = une page.** Les adresses sont de la forme `/#/catalogue`, `/#/jouer/boutique`. Elles sont partageables ; le bouton « retour » du navigateur fonctionne.
- **Une seule page visible à la fois.** Chaque page est un bloc `.page` (ou une fenêtre `*-modal` ouverte par le routeur). Le routeur affiche celle de la route et masque les autres.
- **Onglets = sous-adresses.** Les onglets d'une page sont des `.tab-panel[data-tab]` ; le dernier onglet vu est mémorisé (`ma.tab.<route>`) et le titre de l'onglet du navigateur le mentionne.
- **Barre du bas (dock) et barre du haut : intouchables.** Une nouvelle page ne modifie ni leur contenu ni leur design. Elle se rattache à une entrée existante via `NAV_OF`.
- **Anciennes adresses** : on ne supprime jamais une adresse publiée ; on ajoute une entrée à `REDIRECTS`.
- **Retour au même endroit** : la position de défilement est rétablie au retour (nouvelles tentatives pendant 2 s si la page se charge lentement).

## Ajouter une page — marche à suivre
1. Créer le fragment HTML `pages/<nom>.html` (une `<section class="page" id="page-<nom>">`) et l'inclure dans `index.src.html` avec `<!--@include pages/<nom>.html-->`.
2. Dans `js/router.js` : ajouter la route à `DEFS`, l'identifiant à `PAGE_ID`, l'entrée du menu à mettre en avant dans `NAV_OF`, le titre dans `TITLES`, et le cas dans `pathOf()`.
3. Si la page a une logique : `Router.register("<route>", { enter })` dans un module `js/`.
4. Traduire les textes (`js/i18n/en|es|de|it.js`, clé = texte français).
5. `node scripts/build.js`, puis `npm test`.
6. Ajouter l'adresse au `sitemap.xml` si la page est publique.

## Routes actuelles
| Route | Adresse | Élément affiché | Onglets |
|---|---|---|---|
| `home` | `/` | `page-home` | — |
| `catalog` | `/catalogue` | `page-catalog` | — |
| `car` | `/voiture/<id>` | `vehicle-modal` | — |
| `commcar` | `/voiture-pilote/<id>` | `page-commcar` | — |
| `community` | `/communaute[/onglet]` | `page-community` | fil, voitures, pilotes, evenements, carte |
| `play` | `/jouer[/onglet]` | `page-play` | cartes, collection, boutique, echanges, troc, minijeux, communaute, defis, concours |
| `pilotes` | `/pilotes` | `page-pilotes` | — |
| `chat` | `/chat[/…]` | `page-chat` | — |
| `leaderboard` | `/classement[/onglet]` | `leaderboard-modal` | chronos, circuits, voitures, pilotes, collection |
| `circuit` | `/circuit/<key>` | `page-circuit` | — |
| `pilot` | `/pilote/<uid>` | `public-profile-modal` | — |
| `garage` | `/garage[/onglet]` | `garage-modal` | apercu, voitures, suivi |
| `settings` | `/reglages[/onglet]` | `page-settings` | profil, ambiance, notifications, carte |
| `admin` | `/admin[/onglet]` | `admin-panel-modal` | tableau, moderation, catalogue, jeu, pro, journal, erreurs |
| `pro` | `/pro` | `page-pro` | — |
| `compare` | `/comparer/<ids>` | `page-catalog` | — |
| `duel` | `/duel(:/<a, b>/<a, b>)` | `page-duel` | — |
| `club` | `/club/<id>` | `page-club` | — |
| `clubs` | `/clubs` | `page-clubs` | — |
| `market` | `/annonces` | `page-market` | — |
| `fusion` | `/fusion` | `page-fusion` | — |
| `cardmarket` | `/marche` | `page-cardmarket` | — |
| `wishfeed` | `/souhaits` | `page-wishfeed` | — |
| `plusmoins` | `/plusmoins` | `page-plusmoins` | — |
| `quizgame` | `/quiz` | `page-quizgame` | — |
| `achievements` | `/succes` | `page-achievements` | — |
| `pass` | `/pass` | `page-pass` | — |
| `timeline` | `/frise` | `page-timeline` | — |
| `news` | `/nouveautes` | `page-news` | — |
| `contact` | `/contact` | `page-contact` | — |
| `engine` | `/moteur/<key>` | `page-engine` | — |
| `brand` | `/marque/<key>` | `page-brand` | — |
| `about` | `/a-propos` | `page-about` | — |
| `legal` | `/legal[/onglet]` | `page-legal` | — |

## Le Chat : une seule implémentation
- Le Chat est **une seule application** : `chat.html` + `js/chat.js` (+ `chat-plus.js`, `chatglass.js`, `css/chat.css`, `css/chat3.css`).
- Dans le site, la route `#/chat` charge `chat.html` dans un cadre (`js/chat-embed.js`) : les barres du haut et du bas restent celles du site. Ouvert seul, `chat.html` renvoie vers `#/chat`.
- `index.src.html` ne charge **jamais** `chat.js` : le site n'a pas de seconde copie du Chat. Seuls l'indicateur de messages non lus (`js/common.js`) et l'envoi d'un message à l'administrateur (`js/app.js`) lisent les mêmes collections Firestore.
- `chat.html` est exclu de `robots.txt` et du `sitemap.xml`.
