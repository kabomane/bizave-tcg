# bizave-tcg.v1.3.0

Version publiée le 29 octobre 2026 sur Firebase Hosting, avec les sources de la version sur la branche GitHub `main`. Les contrôles déjà réalisés et les réserves du banc de test restent consignés dans VALIDATION.md.

## Cartes et boosters

- Recharge du stock gratuit : un booster toutes les 15 minutes, plafond de cinq conservé.
- Cadrage des illustrations privilégiant le haut en Classique et Full Art, via le paramètre existant.
- Dix nouveaux codes cadeaux donnant chacun deux boosters epico stellari ; codes en clair conservés uniquement dans les fichiers privés locaux.
- **185 modèles illustrés**, avec 40 nouvelles illustrations WebP et quatre cartes Chainsaw Man. Les originaux restent conservés localement, hors Git et publication.
- **Anima Isekai** : 59 modèles, accessible au stock gratuit commun et en boutique à 50 fragments.
- **epico stellari** : 42 modèles partagés actuellement, exclusivement en boutique à 700 fragments pour cinq cartes. Chaque carte a 91 % de chance d’être épique et 9 % légendaire. Les futures épiques et légendaires du catalogue rejoignent automatiquement son pool.
- Taux de rareté, finition et illustration configurables séparément par booster. Les taux par défaut restent inchangés ; les panneaux de Boutique et Boosters suivent le paquet sélectionné. epico stellari est masqué dans les filtres grâce à `showInFilters: false`.

## Collection, Atelier et Amis

- Favoris par variante, étoile dans le détail et filtre étoile près de la recherche. Les favoris suivent le transfert de sauvegarde et disparaissent à la perte du dernier exemplaire.
- Atelier avec trois filtres combinables : Boosters, Rareté, Finitions et choix d’illustration Classique / Full Art. Le bouton Vos doublons / Toutes vos cartes change de mode ; la confirmation permet le recyclage en lot des dernières copies non favorites.
- Les variantes favorites sont exclues de l’Atelier, avec revalidation dans la transaction de recyclage.
- Une réception réussie affiche la carte en détail et « Vous avez reçu une carte », sans actions Envoyer ou Recycler.
- Finition Mate, compteurs de boosters sur une même ligne et ajustements des espacements et des couleurs.
- Codes cadeaux : saisie et collage limités aux lettres ASCII, chiffres et tiret du milieu.

## Sauvegarde et migration

- Base canonique unique **bizave-tcg**, schéma **9**, table `version` disponible aussi pour les nouveaux joueurs.
- Correctif de l’[issue #1](https://github.com/kabomane/bizave-tcg/issues/1) : copie de la partie active depuis bizave-tcg-v2, vérification des tables et des clés, puis suppression de la source après commit. Le patch est isolé et retirable ultérieurement. Une interruption conserve la source et permet la reprise.
- Ouvertures terminées supprimées ; seules les ouvertures inachevées restent conservées pour la reprise.
- Recyclage compact : suppression complète des tirages locaux jamais échangés. Pour les cartes ayant circulé ou de provenance inconnue, seul l’identifiant bloqué est conservé. L’ancien journal détaillé de recyclage est vidé et n’est plus alimenté.
- Imports des schémas 5, 6, 7 et 8 compatibles. Identités, fragments, favoris, stocks et registres antirejeu conservés.

## Page de mise à jour

Au chargement uniquement, une page autonome annonce les nouveautés aux joueurs existants. Continuer mémorise le compteur dans `localStorage.updated` et ouvre Boosters. Les nouveaux joueurs n’affichent pas cette page. Le compteur initial est 1 ; la note est écrite en dur dans `src/data/update.ts`. Les options de développement proposent un interrupteur de test, masqué en production avec le Mode dev.

La validation de publication est consignée dans [VALIDATION.md](../../VALIDATION.md).
