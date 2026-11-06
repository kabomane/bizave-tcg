# Boutique hebdomadaire

La route `/boutique` (également `/boutique/`) affiche la boutique hebdomadaire validée, incluse dans le build de production. Elle réunit lucky boost, la vitrine et les boosters permanents ; les achats dépensent les fragments de la partie locale. L’ancienne page indépendante et la route `/test` sont supprimées.

La page affiche le titre « Boutique » et deux rubriques espacées : « Cette semaine » et « Boosters permanents ». La sélection hebdomadaire réunit lucky boost et les 1 à 5 cartes de la vitrine dans un seul carrousel, le booster en première position. Les cartes ne sont pas cliquables et n’ouvrent plus d’aperçu. Le bouton d’achat fixe affiche le prix et la disponibilité de l’offre sélectionnée ; une carte achetée reste dans le carrousel avec ses couleurs normales et le bouton « Épuisée ».

Lucky boost est inscrit sur deux lignes sur le sachet. Une pilule près du titre affiche le renouvellement en jours/heures/minutes, puis en heures/minutes/secondes sous 24 heures. Le stock restant de lucky boost apparaît dans le titre « Cette semaine · X restants ». Les barres sont retirées ; le bouton d’achat suit directement les points avec le même écart que les boosters permanents. Les positions verticales restent fixes entre le booster et les cartes. Chaque séparateur aligne son titre à gauche et « ⓘ Taux de drop » à droite, reliés par un trait fin. Le bouton hebdomadaire est désactivé et atténué sur lucky boost ; sur une carte de la vitrine, il affiche les taux boostés de rareté, finition et illustration. Le bouton des boosters permanents conserve les taux du booster sélectionné. Les taux et la taille réelle du pool de lucky boost restent masqués. Dans l’onglet Boosters aussi, « ⓘ Taux de drop » reste visible, atténué et désactivé lorsque lucky boost est sélectionné ; les autres boosters conservent leur bouton actif. Lucky boost est toujours listé après les boosters classiques dans cet onglet. Aucun achat de cette boutique ne crée de toast de succès.

Chaque partie génère son propre tirage avec le générateur aléatoire sécurisé existant. Aucun serveur ni tâche distante n’est nécessaire. La première visite crée la boutique ; les suivantes conservent le tirage. Une seule ligne `weeklyShop/current` est conservée dans IndexedDB. Elle référence les identifiants du catalogue sans recopier les illustrations.

Le renouvellement a lieu le lundi à minuit en Europe/Paris, changements d’heure compris. Il remplace entièrement la ligne dans une transaction. La page ouverte suit l’échéance ; le retour au premier plan et l’entretien du jeu nettoient également les semaines expirées. Si l’application est fermée, le remplacement attend son prochain lancement. Les semaines manquées ne sont pas générées.

## Tirage et achats

- Présence de chaque palier de rareté, finition et illustration : 70 %. Au moins un palier par catégorie. Les pourcentages des paliers absents sont redistribués proportionnellement, avec le reste d’arrondi au premier palier présent.
- Pool souhaité de 40 à 80 modèles distincts, limité au nombre disponible dans les raretés retenues. Chaque rareté à taux positif est représentée ; les raretés à zéro sont exclues. Cinq cartes par ouverture ; les doublons à l’ouverture restent possibles.
- Stock de 1 à 4 boosters pour la semaine. Leur achat augmente uniquement `owned` dans la ligne hebdomadaire, sans utiliser `boosterStock` ni créer d’historique.
- Booster acheté non ouvert : expiration au renouvellement, sans remboursement. Les ventes ferment deux heures avant. Une ouverture déjà commencée conserve ses résultats jusqu’à sa révélation complète, même après renouvellement.
- Vitrine : 1 à 5 modèles distincts tirés à 30/25/20/13/12 % par rareté ; finitions Mate/Holographique/Alternative à 70/22/8 % et illustrations Classique/Full Art à 85/15 %. Ces taux propres à la vitrine s’appliquent aux prochains tirages sans modifier les offres déjà sauvegardées. Un exemplaire achetable par offre, puis état épuisé jusqu’au renouvellement. La carte achetée rejoint immédiatement la collection et les découvertes.
- Achats transactionnels : relecture du solde, du stock et de la semaine affichée. Une offre périmée ou épuisée est refusée, y compris entre plusieurs onglets. Aucun achat hebdomadaire ne crée de journal.

Les prix reprennent le simulateur fourni : valeur de base de rareté × 3 × multiplicateurs de finition et d’illustration ; booster calculé sur l’espérance des cinq cartes avec majoration 1,1 ou 2,75 si Commune, Mate ou Classique est absent ; vitrine majorée à 2,75. Variation triangulaire de 0,8 à 1,2 et arrondi à dix ; le prix du booster reste au moins égal à la valeur moyenne de son contenu.

Les rerolls payants sont abandonnés. Le prototype ne conserve aucun service, prix, compteur ni réserve de booster liés aux anciennes itérations. Aucune rétrocompatibilité avec les anciennes itérations du prototype n’est maintenue.

## Sauvegarde et nettoyage

Le schéma Dexie 11 ajoute `weeklyShop`. Les transferts conservent la boutique et les compteurs, avec validation des pools, taux, variantes et stocks. Une boutique expirée est remplacée à l’export ou à l’import. Les anciens fichiers sans boutique restent acceptés et la génèrent à la première visite.

Les cartes acquises, les boosters payés non ouverts et les ouvertures inachevées restent des données de jeu utiles. Aucune ancienne offre ni journal d’achat ou de reroll n’est archivé. La suppression de compte et le verrou d’export couvrent aussi la boutique.

Le nettoyage de l’historique d’achats des boosters habituels est isolé dans [le patch temporaire](patch-booster-purchase-history.md).
