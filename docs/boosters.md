# Paquets, boutique et stocks

Deux paquets sont configurés : **Memory Frame** (126 cartes, gratuit ou 70 fragments) et **Anima Isekai** (55 cartes, exclusivement en boutique à 50 fragments). Ils contiennent cinq cartes par ouverture. Les autres paquets des tests restent des fixtures.

## Contenus

- `src/data/boosters.ts` contient les définitions des paquets.
- `src/data/pools/memory-frame.json` contient les 126 cartes de Memory Frame, anciennement Phantom Blood. Son ID technique `phantom-blood` est conservé pour les stocks achetés, préférences et ouvertures en cours. Les 110 anciens modèles gardent leurs numéros ; les 16 nouveaux sont ajoutés à la fin de l’ordre global.
- `src/data/pools/anima-isekai.json` contient les 55 cartes d’Anima Isekai : 19 illustrations fournies et 36 illustrations provisoires. Ses cartes sont exclusives à ce pool. Les 55 identifiants sont ajoutés après les cartes de Memory Frame dans l’ordre global.
- Les listes ne dépendent ni des groupes éditoriaux ni du catalogue global. Ajouter une carte à un groupe ne change pas automatiquement un paquet.
- Les nouveaux paquets peuvent référencer les mêmes identifiants et des identifiants exclusifs dans leur propre liste. Une carte partagée garde une seule définition et la même identité dans la collection, les échanges et les doublons.
- Préférer des listes explicites par paquet. Les sources dynamiques `collection` restent possibles dans le moteur, mais incluent les futures cartes de ce groupe.
- Les taux de rareté, finition et Full Art restent communs, dans `src/game/config.ts`. Aucun taux propre à un paquet. Chaque pool doit fournir au moins une carte de chaque rareté.
- Les poids relatifs déjà pris en charge s’appliquent au choix d’un modèle dans sa rareté. Ils ne garantissent pas un nombre de cartes exclusives par ouverture.

## Accès

`access: { type: 'free' }` : le paquet est toujours sélectionnable s’il est activé. Tous les paquets gratuits utilisent le même stock global, plafonné à cinq, avec une unité rechargée toutes les dix minutes. Changer de paquet ne réinitialise pas le minuteur.

`access: { type: 'free', shop: { price: 70 } }` : ajoute une offre d’achat au même paquet gratuit. Memory Frame utilise cette configuration. Les unités achetées restent dans une réserve distincte, sans plafond de cinq ni recharge. L’ouverture utilise d’abord un crédit gratuit disponible (recharge échue comprise), puis la réserve si le gratuit est vide. Le minuteur continue sans être réinitialisé. Masquer l’offre avec `shop.listed: false` conserve les deux modes d’ouverture.

`access: { type: 'shop', price: 50 }` : configuration d’Anima Isekai. Le paquet s’achète en fragments dans la boutique. L’achat ajoute une unité au stock propre à ce paquet. Il ne crée aucune carte et ne lance aucune ouverture. Le paquet apparaît dans Vos boosters uniquement lorsque sa quantité détenue est positive. L’ouverture consomme une unité achetée, sans débiter à nouveau les fragments ni le stock gratuit.

`access: { type: 'shop', price: 60, listed: false }` : retire l’offre de la boutique, tout en permettant d’ouvrir les exemplaires déjà achetés. Conserver `enabled: true` dans ce cas. `enabled: false` désactive entièrement le paquet ; ne pas l’utiliser pour terminer simplement une offre.

Les prix sont des entiers strictement positifs. Les identifiants sont stables, de 1 à 80 caractères, en minuscules, chiffres et tirets. Ne pas réutiliser un identifiant pour une autre édition. `order` détermine la position dans la sélection et la boutique.

## Interface

La page Vos boosters affiche un carrousel horizontal quand plusieurs paquets sont disponibles : défilement tactile natif, flèches et navigation clavier. Avec un seul paquet, les commandes du carrousel sont masquées. Le choix est mémorisé dans les préférences locales et revient sur un paquet disponible si nécessaire.

Le lien Boutique se trouve sous Vos boosters. La boutique reprend le même carrousel tactile et clavier, avec les mêmes tailles de sachets : seul le paquet défile. Un bouton d’achat unique reste fixe sous le carrousel et suit le paquet sélectionné (prix, disponibilité et confirmation d’achat). Memory Frame coûte 70 fragments et Anima Isekai 50 fragments. L’achat alimente le stock correspondant. Les titres et liens Boutique / Vos boosters partagent la même disposition.

Pendant un changement de paquet, le bouton d’achat est désactivé et affiche une flèche tournante. Il se réactive après l’arrêt du défilement, l’alignement du sachet et la mise à jour de l’offre. Le verrou couvre les flèches, le clavier et les déplacements horizontaux à la molette ou au toucher ; le défilement vertical de la page et un simple contact sur le sachet ne le déclenchent pas. L’action d’achat vérifie également ce verrou avant tout débit. La rotation respecte le réglage système de réduction des animations.

Les titres de révélation et les quantités du récapitulatif viennent de l’ouverture réelle. Une copie du titre est enregistrée à l’ouverture pour assurer la reprise après renommage ou retrait d’une offre. Le paquet qui se déchire reste affiché jusqu’à la fin de son animation même si c’était le dernier exemplaire acheté.

## Sauvegarde

Le schéma courant est Dexie 6 dans `bizave-tcg-v2`. `boosterStock` (quantité par paquet) et `boosterPurchases` (historique des prix payés) ont été introduits avec le schéma 3 ; le schéma 6 ajoute `usedGiftCodes` sans changer les stocks existants. Les migrations historiques de ces tables restent testées. Le changement de base et de protocole avant publication est décrit dans [le guide de sauvegarde](sauvegarde.md).

Les codes cadeaux de boosters alimentent la même réserve `boosterStock`, sans débiter les fragments ni créer d’achat fictif dans `boosterPurchases`. Leur registre est inclus dans les transferts de sauvegarde. Voir [les codes cadeaux](codes-cadeaux.md).

Les transactions rendent atomiques l’achat (fragments, stock et historique) et l’ouverture (consommation, cartes, découvertes et résultats). Deux onglets ne peuvent pas dépenser le dernier solde ou ouvrir deux fois le dernier exemplaire. Une ouverture en cours est reprise sans nouvelle consommation. L’ancien marqueur d’historique `payment: 'fragments'` reste lisible ; les nouveaux achats sont enregistrés séparément des ouvertures `payment: 'shop'`.

## Ajouter une édition

1. Ajouter seulement les nouvelles cartes au catalogue, avec des identifiants stables et leurs illustrations. Réutiliser les identifiants existants pour les cartes communes à plusieurs paquets.
2. Ajouter les nouveaux identifiants à la fin de `src/data/card-order.json`, sans modifier les numéros existants.
3. Créer la liste explicite des cartes éligibles du nouveau paquet, puis sa définition dans `boosters.ts`. Déduire son sous-titre du nombre de modèles distincts de sa liste.
4. Choisir son mode d’accès, son ordre et son habillage. Aucun écran React ni schéma de sauvegarde à dupliquer.
5. Vérifier les exclusivités et lancer `npm run check`. Adapter les totaux et les offres attendus du test de catalogue lors de l’ajout volontaire d’une édition.

Les tests couvrent les pools mixtes, les listes explicites de chaque édition, l’exclusivité d’Anima Isekai à 50 fragments, le stock gratuit commun, les achats séparés, la concurrence, les retours arrière après erreur et les migrations de schéma des stocks.
