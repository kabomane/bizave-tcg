# Paquets, boutique et stocks

Quatre paquets permanents sont configurés : **Memory Frame** (220 cartes, gratuit ou 70 fragments), **Anima Isekai** (220 cartes, gratuit ou 50 fragments), **epico stellari** (72 cartes actuellement, boutique uniquement à 700 fragments) et **rarity only** (74 rares actuellement, boutique uniquement à 400 fragments). Ils contiennent cinq cartes par ouverture. Legenda completa est exclusif aux lots journaliers (1 600 fragments avant remise, cinq légendaires garanties). Lucky Boost est défini par la semaine. Merry Xmas, Hunger Games et Nouvel An sont réservés à leurs événements, tous désactivés par défaut. Les autres paquets des tests restent des fixtures.

## Rendu des paquets

Le sachet relief est le modèle par défaut. `artwork.design: 'bloc'` sélectionne la boîte acrylique pour Merry Xmas. La même face avant s’affiche en volume dans **Vos boosters** et à plat en **Boutique**. Les reflets restent animés en boutique. Le réglage « Réduire les animations » les désactive.

[Maquette JSX originale avec notes de développement](../references/boosters-sachet-relief-et-bloc-acrylique.jsx)

## Contenus

- `src/data/boosters.ts` contient les définitions des paquets.
- `src/data/pools/memory-frame.json` contient les 220 cartes de Memory Frame, anciennement Phantom Blood. Son ID technique `phantom-blood` conserve les stocks, préférences et ouvertures en cours. Claude BIZAVE, ChatGPT BIZAVE, Salvatore et le buisson, La crotte du buisson et Matthieu correspondant rejoignent le pool le 5 novembre 2026. Ciel bleu et Le bus suivent le 7 novembre, puis les 22 ajouts de la vague 2 le 8 novembre et 30 nouveaux modèles le 12 novembre.
- `src/data/pools/anima-isekai.json` contient les 220 cartes d’Anima Isekai, toutes illustrées en WebP. Les pools Memory Frame et Anima Isekai sont distincts. Les 77 ajouts du 14 novembre sont placés en fin d’ordre global (numéros 364 à 440) ; les anciens numéros sont conservés.
- **epico stellari** utilise `sources: [{ type: 'rarities', rarities: ['epic', 'legendary'] }]` : toutes les cartes épiques et légendaires éligibles aux tirages, y compris les futurs ajouts, sans nouvelle liste à entretenir. Le sous-titre est calculé depuis le catalogue. Les cartes partagées gardent leur identité et leur numéro ; ce booster de regroupement est masqué dans les filtres par `showInFilters: false`.
- Les listes ne dépendent ni des groupes éditoriaux ni du catalogue global. Ajouter une carte à un groupe ne change pas automatiquement un paquet.
- Les nouveaux paquets peuvent référencer les mêmes identifiants et des identifiants exclusifs dans leur propre liste. Une carte partagée garde une seule définition et la même identité dans la collection, les échanges et les doublons.
- Préférer des listes explicites par paquet. Les sources dynamiques `collection` restent possibles dans le moteur, mais incluent les futures cartes de ce groupe.
- Les taux de rareté, finition et illustration héritent des valeurs de `src/game/config.ts` ; chaque booster peut remplacer indépendamment un de ces trois profils. Chaque rareté ayant un taux strictement positif doit avoir au moins une carte dans le pool.
- Les poids relatifs déjà pris en charge s’appliquent au choix d’un modèle dans sa rareté. Ils ne garantissent pas un nombre de cartes exclusives par ouverture.

Les cartes portant un `promoNumber` sont réservées aux récompenses dédiées. Les tirages et la boutique hebdomadaire les excluent.

La propriété `showInFilters` contrôle la présence du booster dans les filtres partagés de Collection et Atelier. Elle vaut `true` par défaut si omise. Memory Frame et Anima Isekai la définissent à `true`, epico stellari à `false`. Elle ne change ni les cartes détenues, ni la boutique, ni les paquets ouvrables. Les filtres proposent aussi Événement (cartes permanentes avec `eventId`, hors promos) et Promotionnel (`promoNumber`), indépendamment de l’activation des événements.

## Taux par booster

`rates: { rarity: 'default', finish: 'default', illustration: 'default' }` conserve les trois distributions historiques. Omettre `rates` ou l’un de ses champs équivaut à `default` et garde les fixtures compatibles. Une surcharge remplace un profil complet : toutes ses catégories sont requises, sans catégorie supplémentaire, avec des valeurs finies et positives ou nulles totalisant 100 %.

Pour **epico stellari**, `rarity` vaut `{ common: 0, uncommon: 0, rare: 0, epic: 91, legendary: 9 }`. Finitions et illustrations restent à `default` : Mate 81 %, Holographique 15 %, Alternative 4 % ; Classique 92 %, Full Art 8 %. Les trois tirages restent indépendants et les taux sont par carte, sans garantie de légendaire par paquet.

`resolveBoosterRates` dans `src/game/boosterRates.ts` est utilisé par le moteur de tirage et le panneau « Taux de drop » dans Boutique et Vos boosters. La vue plein écran présente des tags d’édition et un carrousel Rareté / Finition / Illustration. Les constantes par défaut et les clés de sauvegarde ne changent pas. Une ouverture déjà enregistrée garde ses résultats.

**rarity only** utilise une source dynamique `rarities: ['rare']` et un profil de rareté à 100 % rare. Ses finitions et illustrations restent à leurs taux par défaut. Les nouvelles rares entrent automatiquement dans son pool ; ses modèles restent partagés et ce paquet est masqué dans les filtres. Il utilise uniquement sa réserve achetée, sans crédit gratuit.

## Accès

`access: { type: 'free' }` : le paquet est toujours sélectionnable s’il est activé. Tous les paquets gratuits utilisent le même stock global, plafonné à cinq, avec une unité rechargée toutes les quinze minutes. Changer de paquet ne réinitialise pas le minuteur.

`access: { type: 'free', shop: { price: 70 } }` : ajoute une offre d’achat au même paquet gratuit. Memory Frame utilise cette configuration ; Anima Isekai utilise le même accès avec un prix de 50 fragments. Les unités achetées restent dans une réserve distincte, sans plafond de cinq ni recharge. L’ouverture utilise d’abord un crédit gratuit disponible (recharge échue comprise), puis la réserve si le gratuit est vide. Le minuteur continue sans être réinitialisé. Masquer l’offre avec `shop.listed: false` conserve les deux modes d’ouverture.

`access: { type: 'shop', price: 50 }` : réserve le paquet à la boutique. Le paquet s’achète en fragments dans la boutique. L’achat ajoute une unité au stock propre à ce paquet. Il ne crée aucune carte et ne lance aucune ouverture. Le paquet apparaît dans Vos boosters uniquement lorsque sa quantité détenue est positive. L’ouverture consomme une unité achetée, sans débiter à nouveau les fragments ni le stock gratuit.

`access: { type: 'shop', price: 60, listed: false }` : retire l’offre de la boutique, tout en permettant d’ouvrir les exemplaires déjà achetés. Conserver `enabled: true` dans ce cas. `enabled: false` désactive entièrement le paquet ; ne pas l’utiliser pour terminer simplement une offre.

Les prix sont des entiers strictement positifs. Les identifiants sont stables, de 1 à 80 caractères, en minuscules, chiffres et tirets. Ne pas réutiliser un identifiant pour une autre édition. `order` détermine la position dans la sélection et la boutique.

## Interface

La page Vos boosters affiche un carrousel horizontal quand plusieurs paquets sont disponibles : défilement tactile natif, flèches et navigation clavier. Avec un seul paquet, les commandes du carrousel sont masquées. Le choix est mémorisé dans les préférences locales et revient sur un paquet disponible si nécessaire.

Le lien Boutique se trouve sous Vos boosters. La boutique réunit Aujourd’hui, Cette semaine et Permanents. Chaque offre de lot et Lucky Boost occupe un panneau voisin de sa vitrine de cartes en carrousel ; les permanents sont en grille et les bonus ont leur propre carrousel à bouton fixe. Memory Frame coûte 70 fragments et Anima Isekai 50 fragments. L’achat alimente le stock correspondant. Les titres et liens Boutique / Vos boosters partagent la même disposition.

Pendant un changement de paquet, le bouton d’achat est désactivé et affiche une flèche tournante. Il se réactive après l’arrêt du défilement, l’alignement du sachet et la mise à jour de l’offre. Le verrou couvre les flèches, le clavier et les déplacements horizontaux à la molette ou au toucher ; le défilement vertical de la page et un simple contact sur le sachet ne le déclenchent pas. L’action d’achat vérifie également ce verrou avant tout débit. La rotation respecte le réglage système de réduction des animations.

Les titres de révélation et les quantités du récapitulatif viennent de l’ouverture réelle. Une copie du titre est enregistrée à l’ouverture pour assurer la reprise après renommage ou retrait d’une offre. Le paquet qui se déchire reste affiché jusqu’à la fin de son animation même si c’était le dernier exemplaire acheté.

## Sauvegarde

Le schéma courant est Dexie 13 dans `bizave-tcg`. La table `version` décrit le schéma et la validation du stockage. `boosterStock` (quantité par paquet) et `boosterPurchases` (historique des prix payés) ont été introduits avec le schéma 3 ; le schéma 6 ajoute `usedGiftCodes` sans changer les stocks existants. Le schéma 7 ajoute les favoris par variante et supprime les anciennes ouvertures terminées, en conservant les ouvertures inachevées. Le schéma 8 ajoute les identifiants de cartes recyclées dans recycledCards et vide l’ancien journal détaillé de recyclage. Les nouveaux tirages locaux jamais échangés sont supprimés intégralement au recyclage ; les exemplaires échangés ou anciens de provenance inconnue ne conservent que leur identifiant bloqué. Les migrations historiques de ces tables restent testées. Le changement de base et de protocole avant publication est décrit dans [le guide de sauvegarde](sauvegarde.md).

Les codes cadeaux de boosters alimentent la même réserve `boosterStock`, sans débiter les fragments ni créer d’achat fictif dans `boosterPurchases`. Leur registre est inclus dans les transferts de sauvegarde. Voir [les codes cadeaux](codes-cadeaux.md).

La table `boosterPurchases` est conservée pour la compatibilité des sauvegardes. Les achats n’y ajoutent plus de lignes. Le schéma 11 ajoute [la boutique hebdomadaire](boutique-hebdomadaire.md), et le schéma 13 ajoute [la boutique journalière](boutique-journaliere.md) dans `dailyShop/current`. Les canaux de stock restent séparés.

Les transactions rendent atomiques l’achat (fragments et stock) et l’ouverture (consommation, cartes, découvertes et résultats). Deux onglets ne peuvent pas dépenser le dernier solde ou ouvrir deux fois le dernier exemplaire. Une ouverture en cours est reprise sans nouvelle consommation. Son enregistrement est supprimé au passage au récapitulatif ; les cartes obtenues restent détenues et les résultats du récapitulatif restent en mémoire jusqu’à sa fermeture. L’ancien marqueur d’historique `payment: 'fragments'` reste lisible ; les ouvertures de boosters achetés utilisent `payment: 'shop'` sans conserver d’historique des achats.

## Ajouter une édition

### Événements à cartes permanentes

`src/data/events.ts` définit **Hunger Games 2026** (`hunger-games-2026`) et **Nouvel An 2027** (`new-year-2027`). Chaque booster coûte **30 fragments**, contient **une carte** parmi six, utilise le bloc acrylique et l'animation à une carte de Noël. Le récapitulatif et la collection suivent le circuit permanent : carte détenue, découverte, reprise d'ouverture et transfert de sauvegarde. Les vingt cadeaux de Noël gardent leur comportement temporaire.

Les deux entrées de `EVENT_ACTIVE` sont à `false`. Hors événement, la boutique et Vos boosters les masquent ; achat et nouvelle ouverture sont refusés sans débit ni perte de stock. Une révélation déjà commencée reste reprenable. L'option locale de développement « Événement toujours actif » permet de les tester, uniquement en build de développement.

Les douze modèles sont dans le catalogue avec `eventId`, numéros 441 à 452. Le moteur exige un booster portant le même `eventId` pour les tirer. Les pools actuels (y compris par rareté), Lucky Boost et les vitrines du jour et de la semaine les excluent. Ces deux boosters ne rejoignent pas la sélection des lots journaliers. Les taux événementiels sont 90 % commune et 10 % légendaire (chance légendaire conservée de Noël). Finitions et illustrations utilisent les taux habituels : mate 81 %, holographique 15 %, alternative 4 % ; classique 92 %, Full Art 8 %.

### Éditions courantes

1. Ajouter seulement les nouvelles cartes au catalogue, avec des identifiants stables et leurs illustrations. Réutiliser les identifiants existants pour les cartes communes à plusieurs paquets.
2. Ajouter les nouveaux identifiants à la fin de `src/data/card-order.json`, sans modifier les numéros existants.
3. Créer la liste explicite des cartes éligibles du nouveau paquet, puis sa définition dans `boosters.ts`. Déduire son sous-titre du nombre de modèles distincts de sa liste.
4. Choisir son mode d’accès, son ordre et son habillage. Aucun écran React ni schéma de sauvegarde à dupliquer.
5. Vérifier les exclusivités et lancer `npm run check`. Adapter les totaux et les offres attendus du test de catalogue lors de l’ajout volontaire d’une édition.

Les tests couvrent les pools mixtes, les listes explicites de chaque édition, l’accès gratuit d’Anima Isekai et son achat à 50 fragments, le stock gratuit commun, les achats séparés, la concurrence, les retours arrière après erreur et les migrations de schéma des stocks.
