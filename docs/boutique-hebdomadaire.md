# Boutique hebdomadaire

La route `/boutique` (également `/boutique/`) affiche la boutique hebdomadaire validée, incluse dans le build de production. Elle réunit lucky boost, la vitrine, les boosters permanents et les bonus de la semaine ; les achats dépensent les fragments de la partie locale. L’ancienne page indépendante et la route `/test` sont supprimées.

Depuis la refonte du 12 novembre 2026, la page comporte Aujourd’hui, Cette semaine et Permanents. Lucky Boost et la vitrine occupent deux panneaux voisins ; les bonus s’affichent dans un carrousel à bouton fixe et les permanents en grille. Le dialogue « Taux de drop » près du titre regroupe toutes les éditions et vitrines. Les règles de tirage hebdomadaire restent inchangées ; le reroll renouvelle également le lot et les cartes du jour. Voir [la boutique journalière](boutique-journaliere.md).

Chaque partie génère son propre tirage avec le générateur aléatoire sécurisé existant. Aucun serveur ni tâche distante n’est nécessaire. La première visite crée la boutique ; les suivantes conservent le tirage. Une seule ligne `weeklyShop/current` est conservée dans IndexedDB. Elle référence les identifiants du catalogue sans recopier les illustrations.

Le renouvellement a lieu le lundi à minuit en Europe/Paris, changements d’heure compris. Il remplace entièrement la ligne dans une transaction. La page ouverte suit l’échéance ; le retour au premier plan et l’entretien du jeu nettoient également les semaines expirées. Si l’application est fermée, le remplacement attend son prochain lancement. Les semaines manquées ne sont pas générées.

## Tirage et achats

- Présence de chaque palier de rareté, finition et illustration : 70 %. Au moins un palier par catégorie. Les pourcentages des paliers absents sont redistribués proportionnellement, avec le reste d’arrondi au premier palier présent.
- Pool souhaité de 40 à 80 modèles distincts, limité au nombre disponible dans les raretés retenues. Chaque rareté à taux positif est représentée ; les raretés à zéro sont exclues. Cinq cartes par ouverture ; les doublons à l’ouverture restent possibles.
- Stock initial de 1 à 4 boosters par tirage. Chaque achat diminue `remaining` et augmente `owned` dans la ligne hebdomadaire.
- Booster acheté non ouvert : expiration au renouvellement, sans remboursement. Les ventes ferment deux heures avant. Une ouverture déjà commencée conserve ses résultats jusqu’à sa révélation complète, même après renouvellement.
- Vitrine : 1 à 5 modèles distincts tirés à 30/25/20/13/12 % par rareté ; finitions Mate/Holographique/Alternative à 70/22/8 % et illustrations Classique/Full Art à 85/15 %. Ces taux propres à la vitrine s’appliquent aux prochains tirages sans modifier les offres déjà sauvegardées. Un exemplaire achetable par offre, puis état épuisé jusqu’au renouvellement. La carte achetée rejoint immédiatement la collection et les découvertes.
- Achats transactionnels : relecture du solde, du stock et de la semaine affichée. Une offre périmée ou épuisée est refusée, y compris entre plusieurs onglets. Aucun achat hebdomadaire ne crée de journal.

Les prix reprennent le simulateur fourni : valeur de base de rareté × 3 × multiplicateurs de finition et d’illustration ; booster calculé sur l’espérance des cinq cartes avec majoration 1,1 ou 2,75 si Commune, Mate ou Classique est absent ; vitrine majorée à 2,75. Variation triangulaire de 0,8 à 1,2 et arrondi à dix ; le prix du booster reste au moins égal à la valeur moyenne de son contenu.

## Bonus de la semaine

Le carrousel de bonus propose deux articles, chacun disponible une fois par semaine avant crédits cadeaux. Le titre affiche le stock du bonus sélectionné, crédits cadeaux inclus :

- **Reroll** à 150 fragments. Chaque reroll renouvelle aussi la boutique journalière, remplace toute la vitrine et tire un nouveau pool, de nouveaux taux, un nouveau prix et un stock de 1 à 4 Lucky Boost. Les boosters achetés et encore fermés conservent leur pool dans `priorBoosters` et s’ouvrent dans l’ordre des lots. Leur nombre est indépendant du nouveau stock en vente. Une offre affichée avant un reroll est refusée à l’achat.
- **Carte fragments** gratuite. Au clic, deux entiers indépendants sont tirés uniformément entre 10 et 300. La moyenne arrondie à la dizaine la plus proche est créditée immédiatement. Le montant apparaît deux secondes sur le bouton, puis « Réclamée » lorsque le stock est épuisé.

Le reroll ne modifie pas la carte fragments. Les deux disponibilités sont enregistrées dans la ligne de la semaine courante et se réinitialisent le lundi. Le montant réclamé n’est pas archivé.

Les codes cadeaux ajoutent des utilisations au compteur du bonus sélectionné. Un crédit de reroll donne un reroll gratuit et est utilisé avant l’option payante. La carte fragments hebdomadaire est réclamée en premier, puis les cartes offertes se réclament une par une avec le même tirage. Les crédits non utilisés suivent la sauvegarde et restent disponibles après le renouvellement du lundi.

## Sauvegarde et nettoyage

Le schéma Dexie 11 ajoute `weeklyShop`. Les transferts conservent la boutique et les compteurs, avec validation des pools, taux, variantes et stocks. Une boutique expirée est remplacée à l’export ou à l’import. Les anciens fichiers sans boutique restent acceptés et la génèrent à la première visite.

Les cartes acquises, les boosters payés non ouverts et les ouvertures inachevées restent des données de jeu utiles. Aucune ancienne offre ni journal d’achat ou de reroll n’est archivé. La suppression de compte et le verrou d’export couvrent aussi la boutique.

## Événement de Noël

Le booster **merry xmas** est préparé mais masqué en production. Son activation sera publiée séparément. En développement, **Options → Développement** propose **Événement toujours actif** et **Fragments illimités** pour le tester localement.

Quand l’événement est actif, le booster apparaît dans un groupe Événement de Noël, sous la grille permanente. Il coûte 30 fragments, sans limite d’achat. Chaque ouverture révèle une seule carte événementielle, mate et classique. Elle disparaît à la fermeture du récapitulatif et ne rejoint pas la collection.

Les cartes proposées à l’unité indiquent leur possession par le point de carrousel : blanc si la variante exacte (finition et illustration comprises) est détenue, doré avec reflet discret sinon. Seuls les exemplaires actuellement `owned` sont comptés. Une offre seule affiche un point, sans flèches ni défilement.
