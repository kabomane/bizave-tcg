# Paquets, boutique et stocks

Trois paquets sont configurés : **Memory Frame** (126 cartes, gratuit ou 70 fragments), **Anima Isekai** (59 cartes, gratuit ou 50 fragments) et **epico stellari** (42 cartes actuellement, boutique uniquement à 700 fragments). Ils contiennent cinq cartes par ouverture. Les autres paquets des tests restent des fixtures.

## Contenus

- `src/data/boosters.ts` contient les définitions des paquets.
- `src/data/pools/memory-frame.json` contient les 126 cartes de Memory Frame, anciennement Phantom Blood. Son ID technique `phantom-blood` est conservé pour les stocks achetés, préférences et ouvertures en cours. Les 110 anciens modèles gardent leurs numéros ; les 16 nouveaux sont ajoutés à la fin de l’ordre global.
- `src/data/pools/anima-isekai.json` contient les 59 cartes d’Anima Isekai, toutes illustrées en WebP. Les pools Memory Frame et Anima Isekai sont distincts. Les 55 identifiants initiaux suivent les cartes de Memory Frame ; les quatre cartes Chainsaw Man sont ajoutées à la fin de l’ordre global pour conserver les numéros existants.
- **epico stellari** utilise `sources: [{ type: 'rarities', rarities: ['epic', 'legendary'] }]` : toutes les cartes épiques et légendaires du catalogue, y compris les futurs ajouts, sans nouvelle liste à entretenir. Le sous-titre est calculé depuis le catalogue. Les cartes partagées gardent leur identité et leur numéro ; ce booster de regroupement est masqué dans les filtres par `showInFilters: false`.
- Les listes ne dépendent ni des groupes éditoriaux ni du catalogue global. Ajouter une carte à un groupe ne change pas automatiquement un paquet.
- Les nouveaux paquets peuvent référencer les mêmes identifiants et des identifiants exclusifs dans leur propre liste. Une carte partagée garde une seule définition et la même identité dans la collection, les échanges et les doublons.
- Préférer des listes explicites par paquet. Les sources dynamiques `collection` restent possibles dans le moteur, mais incluent les futures cartes de ce groupe.
- Les taux de rareté, finition et illustration héritent des valeurs de `src/game/config.ts` ; chaque booster peut remplacer indépendamment un de ces trois profils. Chaque rareté ayant un taux strictement positif doit avoir au moins une carte dans le pool.
- Les poids relatifs déjà pris en charge s’appliquent au choix d’un modèle dans sa rareté. Ils ne garantissent pas un nombre de cartes exclusives par ouverture.

La propriété `showInFilters` contrôle la présence du booster dans les filtres partagés de Collection et Atelier. Elle vaut `true` par défaut si omise. Memory Frame et Anima Isekai la définissent à `true`, epico stellari à `false`. Elle ne change ni les cartes détenues, ni la boutique, ni les paquets ouvrables.

## Taux par booster

`rates: { rarity: 'default', finish: 'default', illustration: 'default' }` conserve les trois distributions historiques. Omettre `rates` ou l’un de ses champs équivaut à `default` et garde les fixtures compatibles. Une surcharge remplace un profil complet : toutes ses catégories sont requises, sans catégorie supplémentaire, avec des valeurs finies et positives ou nulles totalisant 100 %.

Pour **epico stellari**, `rarity` vaut `{ common: 0, uncommon: 0, rare: 0, epic: 91, legendary: 9 }`. Finitions et illustrations restent à `default` : Mate 81 %, Holographique 15 %, Alternative 4 % ; Classique 92 %, Full Art 8 %. Les trois tirages restent indépendants et les taux sont par carte, sans garantie de légendaire par paquet.

`resolveBoosterRates` dans `src/game/boosterRates.ts` est utilisé par le moteur de tirage et le panneau « Taux de drop » dans Boutique et Vos boosters. Le panneau reçoit le booster sélectionné sans ajouter son nom au titre. Les constantes par défaut et les clés de sauvegarde ne changent pas. Une ouverture déjà enregistrée garde ses résultats.

## Accès

`access: { type: 'free' }` : le paquet est toujours sélectionnable s’il est activé. Tous les paquets gratuits utilisent le même stock global, plafonné à cinq, avec une unité rechargée toutes les quinze minutes. Changer de paquet ne réinitialise pas le minuteur.

`access: { type: 'free', shop: { price: 70 } }` : ajoute une offre d’achat au même paquet gratuit. Memory Frame utilise cette configuration ; Anima Isekai utilise le même accès avec un prix de 50 fragments. Les unités achetées restent dans une réserve distincte, sans plafond de cinq ni recharge. L’ouverture utilise d’abord un crédit gratuit disponible (recharge échue comprise), puis la réserve si le gratuit est vide. Le minuteur continue sans être réinitialisé. Masquer l’offre avec `shop.listed: false` conserve les deux modes d’ouverture.

`access: { type: 'shop', price: 50 }` : réserve le paquet à la boutique. Le paquet s’achète en fragments dans la boutique. L’achat ajoute une unité au stock propre à ce paquet. Il ne crée aucune carte et ne lance aucune ouverture. Le paquet apparaît dans Vos boosters uniquement lorsque sa quantité détenue est positive. L’ouverture consomme une unité achetée, sans débiter à nouveau les fragments ni le stock gratuit.

`access: { type: 'shop', price: 60, listed: false }` : retire l’offre de la boutique, tout en permettant d’ouvrir les exemplaires déjà achetés. Conserver `enabled: true` dans ce cas. `enabled: false` désactive entièrement le paquet ; ne pas l’utiliser pour terminer simplement une offre.

Les prix sont des entiers strictement positifs. Les identifiants sont stables, de 1 à 80 caractères, en minuscules, chiffres et tirets. Ne pas réutiliser un identifiant pour une autre édition. `order` détermine la position dans la sélection et la boutique.

## Interface

La page Vos boosters affiche un carrousel horizontal quand plusieurs paquets sont disponibles : défilement tactile natif, flèches et navigation clavier. Avec un seul paquet, les commandes du carrousel sont masquées. Le choix est mémorisé dans les préférences locales et revient sur un paquet disponible si nécessaire.

Le lien Boutique se trouve sous Vos boosters. La boutique reprend le même carrousel tactile et clavier, avec les mêmes tailles de sachets : seul le paquet défile. Un bouton d’achat unique reste fixe sous le carrousel et suit le paquet sélectionné (prix, disponibilité et confirmation d’achat). Memory Frame coûte 70 fragments et Anima Isekai 50 fragments. L’achat alimente le stock correspondant. Les titres et liens Boutique / Vos boosters partagent la même disposition.

Pendant un changement de paquet, le bouton d’achat est désactivé et affiche une flèche tournante. Il se réactive après l’arrêt du défilement, l’alignement du sachet et la mise à jour de l’offre. Le verrou couvre les flèches, le clavier et les déplacements horizontaux à la molette ou au toucher ; le défilement vertical de la page et un simple contact sur le sachet ne le déclenchent pas. L’action d’achat vérifie également ce verrou avant tout débit. La rotation respecte le réglage système de réduction des animations.

Les titres de révélation et les quantités du récapitulatif viennent de l’ouverture réelle. Une copie du titre est enregistrée à l’ouverture pour assurer la reprise après renommage ou retrait d’une offre. Le paquet qui se déchire reste affiché jusqu’à la fin de son animation même si c’était le dernier exemplaire acheté.

## Sauvegarde

Le schéma courant est Dexie 9 dans `bizave-tcg`. La table version décrit le schéma et la validation du stockage ; le patch isolé migre la partie active depuis bizave-tcg-v2 puis supprime cette ancienne base après vérification. `boosterStock` (quantité par paquet) et `boosterPurchases` (historique des prix payés) ont été introduits avec le schéma 3 ; le schéma 6 ajoute `usedGiftCodes` sans changer les stocks existants. Le schéma 7 ajoute les favoris par variante et supprime les anciennes ouvertures terminées, en conservant les ouvertures inachevées. Le schéma 8 ajoute les identifiants de cartes recyclées dans recycledCards et vide l’ancien journal détaillé de recyclage. Les nouveaux tirages locaux jamais échangés sont supprimés intégralement au recyclage ; les exemplaires échangés ou anciens de provenance inconnue ne conservent que leur identifiant bloqué. Les migrations historiques de ces tables restent testées. Le changement de base et de protocole avant publication est décrit dans [le guide de sauvegarde](sauvegarde.md).

Les codes cadeaux de boosters alimentent la même réserve `boosterStock`, sans débiter les fragments ni créer d’achat fictif dans `boosterPurchases`. Leur registre est inclus dans les transferts de sauvegarde. Voir [les codes cadeaux](codes-cadeaux.md).

Les transactions rendent atomiques l’achat (fragments, stock et historique) et l’ouverture (consommation, cartes, découvertes et résultats). Deux onglets ne peuvent pas dépenser le dernier solde ou ouvrir deux fois le dernier exemplaire. Une ouverture en cours est reprise sans nouvelle consommation. Son enregistrement est supprimé au passage au récapitulatif ; les cartes obtenues restent détenues et les résultats du récapitulatif restent en mémoire jusqu’à sa fermeture. L’ancien marqueur d’historique `payment: 'fragments'` reste lisible ; les nouveaux achats sont enregistrés séparément des ouvertures `payment: 'shop'`.

## Ajouter une édition

1. Ajouter seulement les nouvelles cartes au catalogue, avec des identifiants stables et leurs illustrations. Réutiliser les identifiants existants pour les cartes communes à plusieurs paquets.
2. Ajouter les nouveaux identifiants à la fin de `src/data/card-order.json`, sans modifier les numéros existants.
3. Créer la liste explicite des cartes éligibles du nouveau paquet, puis sa définition dans `boosters.ts`. Déduire son sous-titre du nombre de modèles distincts de sa liste.
4. Choisir son mode d’accès, son ordre et son habillage. Aucun écran React ni schéma de sauvegarde à dupliquer.
5. Vérifier les exclusivités et lancer `npm run check`. Adapter les totaux et les offres attendus du test de catalogue lors de l’ajout volontaire d’une édition.

Les tests couvrent les pools mixtes, les listes explicites de chaque édition, l’accès gratuit d’Anima Isekai et son achat à 50 fragments, le stock gratuit commun, les achats séparés, la concurrence, les retours arrière après erreur et les migrations de schéma des stocks.
