# Paquets, boutique et stocks

Un seul paquet est publié : Phantom Blood. Les autres paquets utilisés dans les tests sont des fixtures et ne doivent pas être ajoutés à la configuration publiée sans demande explicite.

## Contenus

- `src/data/boosters.ts` contient les définitions des paquets.
- `src/data/pools/phantom-blood.json` est la liste fixe des 110 cartes de Phantom Blood. Elle ne dépend ni des groupes éditoriaux ni du catalogue global. Ajouter une carte à Thomas, Matthieu ou Spéciaux ne change plus ce paquet.
- Révision avant publication du 26 octobre 2026 : le pool et l’ordre de l’édition suivent le nouveau carnet (six retraits, six ajouts ; 40 communes, 23 peu communes, 21 rares, 16 épiques et 10 légendaires). Aucune migration des anciennes sauvegardes de test n’est prévue pour cette révision.
- Les nouveaux paquets peuvent référencer les mêmes identifiants et des identifiants exclusifs dans leur propre liste. Une carte partagée garde une seule définition et la même identité dans la collection, les échanges et les doublons.
- Préférer des listes explicites par paquet. Les sources dynamiques `collection` restent possibles dans le moteur, mais incluent les futures cartes de ce groupe.
- Les taux de rareté, finition et Full Art restent communs, dans `src/game/config.ts`. Aucun taux propre à un paquet. Chaque pool doit fournir au moins une carte de chaque rareté.
- Les poids relatifs déjà pris en charge s’appliquent au choix d’un modèle dans sa rareté. Ils ne garantissent pas un nombre de cartes exclusives par ouverture.

## Accès

`access: { type: 'free' }` : le paquet est toujours sélectionnable s’il est activé. Tous les paquets gratuits utilisent le même stock global, plafonné à cinq, avec une unité rechargée toutes les dix minutes. Changer de paquet ne réinitialise pas le minuteur.

`access: { type: 'free', shop: { price: 70 } }` : ajoute une offre d’achat au même paquet gratuit. Phantom Blood utilise cette configuration. Les unités achetées restent dans une réserve distincte, sans plafond de cinq ni recharge. L’ouverture utilise d’abord un crédit gratuit disponible (recharge échue comprise), puis la réserve si le gratuit est vide. Le minuteur continue sans être réinitialisé. Masquer l’offre avec `shop.listed: false` conserve les deux modes d’ouverture.

`access: { type: 'shop', price: 60 }` : le paquet s’achète en fragments dans la boutique. L’achat ajoute une unité au stock propre à ce paquet. Il ne crée aucune carte et ne lance aucune ouverture. Le paquet apparaît dans Vos boosters uniquement lorsque sa quantité détenue est positive. L’ouverture consomme une unité achetée, sans débiter à nouveau les fragments ni le stock gratuit.

`access: { type: 'shop', price: 60, listed: false }` : retire l’offre de la boutique, tout en permettant d’ouvrir les exemplaires déjà achetés. Conserver `enabled: true` dans ce cas. `enabled: false` désactive entièrement le paquet ; ne pas l’utiliser pour terminer simplement une offre.

Les prix sont des entiers strictement positifs. Les identifiants sont stables, de 1 à 80 caractères, en minuscules, chiffres et tirets. Ne pas réutiliser un identifiant pour une autre édition. `order` détermine la position dans la sélection et la boutique.

## Interface

La page Vos boosters affiche un carrousel horizontal quand plusieurs paquets sont disponibles : défilement tactile natif, flèches et navigation clavier. Avec un seul paquet, les commandes du carrousel sont masquées. Le choix est mémorisé dans les préférences locales et revient sur un paquet disponible si nécessaire.

Le lien Boutique se trouve sous Vos boosters. La boutique reste dans cette section du menu et n’affiche que les offres publiées. Phantom Blood est proposé à 70 fragments l’unité, avec achat direct, confirmation animée sur le bouton et affichage du stock acheté. Les titres et liens Boutique / Vos boosters partagent la même disposition.

Les titres de révélation et les quantités du récapitulatif viennent de l’ouverture réelle. Une copie du titre est enregistrée à l’ouverture pour assurer la reprise après renommage ou retrait d’une offre. Le paquet qui se déchire reste affiché jusqu’à la fin de son animation même si c’était le dernier exemplaire acheté.

## Sauvegarde

Dexie V3 ajoute `boosterStock` (quantité par identifiant de paquet) et `boosterPurchases` (historique du prix effectivement payé). La migration conserve cartes, identités, transferts, fragments, ouvertures et échéance gratuite.

Les transactions rendent atomiques l’achat (fragments, stock et historique) et l’ouverture (consommation, cartes, découvertes et résultats). Deux onglets ne peuvent pas dépenser le dernier solde ou ouvrir deux fois le dernier exemplaire. Une ouverture en cours est reprise sans nouvelle consommation. L’ancien marqueur d’historique `payment: 'fragments'` reste lisible ; les nouveaux achats sont enregistrés séparément des ouvertures `payment: 'shop'`.

## Ajouter une édition

1. Ajouter seulement les nouvelles cartes au catalogue, avec des identifiants stables et leurs illustrations. Réutiliser les identifiants existants pour les cartes communes à plusieurs paquets.
2. Ajouter les nouveaux identifiants à la fin de `src/data/card-order.json`, sans modifier les numéros existants.
3. Créer la liste explicite des cartes éligibles du nouveau paquet, puis sa définition dans `boosters.ts`. Déduire son sous-titre du nombre de modèles distincts de sa liste.
4. Choisir son mode d’accès, son ordre et son habillage. Aucun écran React ni schéma de sauvegarde à dupliquer.
5. Vérifier les exclusivités et lancer `npm run check`. Adapter le test qui vérifie volontairement que Phantom Blood est actuellement le seul paquet publié au moment de publier réellement la seconde édition.

Les tests couvrent les pools mixtes, le gel de Phantom Blood, le stock gratuit commun, les achats séparés, la concurrence, les retours arrière après erreur et la migration V2 vers V3.
