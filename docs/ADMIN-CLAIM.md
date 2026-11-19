# Droit d'administrateur : e-mail ou claim (TECH-205)

Aujourd'hui, `firestore.rules` et `storage.rules` reconnaissent l'administrateur principal de deux façons :
1. le claim `admin: true` sur son compte (pose par la fonction `syncMyClaims`, à la première visite de l'espace admin) ;
2. le compte `admin@motorauto.fr` **avec adresse vérifiée** (repli de transition).

Le repli par e-mail garde l'accès si le claim n'a pas encore été posé. Pour le retirer sans risque :
1. connecte-toi avec le compte admin, ouvre l'espace Administration (cela pose le claim) ;
2. dans la console du navigateur : `firebase.auth().currentUser.getIdTokenResult().then(r => console.log(r.claims.admin))` doit afficher `true` ;
3. seulement alors, on supprime la condition e-mail des deux fichiers de règles (et `MA.checkSuper` côté site).

Ne retire jamais le repli avant l'étape 2 : tu perdrais l'accès à l'administration.
