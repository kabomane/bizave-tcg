# Boutique journalière — implémentation du 12 novembre 2026

La page `/boutique` suit la maquette fournie : Aujourd’hui (lot et carrousel de cartes), Cette semaine (Lucky Boost, vitrine et deux bonus), Permanents (quatre éditions en grille). Les taux de toutes les offres se consultent en plein écran : tags ordonnés par groupes, carrousel Rareté / Finition / Illustration, libellé, barre et pourcentage sur une ligne. Les séparateurs sont à 50 % d’opacité et les lignes gardent leur espacement naturel sans scroll vertical. Les mêmes contrôles clavier, gestes natifs et animations réduites sont conservés pour les cartes.

Chaque sauvegarde reçoit un lot personnel de 5 à 10 boosters identiques, remisé de 5 à 20 %. La catégorie puis l’édition utilisent le moteur pondéré existant. Les probabilités sans événement sont Memory Frame 44,8 %, Anima Isekai 44,8 %, rarity only 8 %, epico stellari 2 %, legenda completa 0,4 %. Le prix remisé est arrondi une seule fois au fragment entier.

Legenda completa coûte normalement 1 600 fragments et garantit cinq légendaires, avec les finitions et illustrations ordinaires. Son indicateur `dailyOnly` interdit les canaux gratuits, permanents et cadeaux. Il utilise le même moteur d’ouverture que les autres éditions.

La vitrine propose 0 à 3 modèles distincts, aux taux standards. Le prix utilise le même utilitaire `showcasePrice` que la semaine : référence ×2,75, variation triangulaire et arrondi à dix. Chaque offre s’achète une seule fois.

## Paramètres provisoires explicites

- `DAILY_EVENT_CATEGORY_WEIGHT = 0` : aucun poids événementiel n’a encore été approuvé. Les événements actifs sont éligibles techniquement ; augmenter cette constante prendra de la masse aux classiques en conservant les spéciaux à 10,4 %. Noël reste achetable séparément lorsque son événement est actif.
- `DAILY_CARD_COUNT_WEIGHTS = { 0: 1, 1: 1, 2: 1, 3: 1 }` : répartition uniforme provisoire.
- Le lot entier est acheté en une seule fois. Les ventes du lot ferment deux heures avant minuit. Le reroll hebdomadaire renouvelle aussi le lot et les cartes du jour ; les packs déjà achetés restent ouvrables jusqu’à minuit. Les anciennes offres sont refusées grâce au compteur de reroll.

Ces constantes sont dans `src/game/dailyShop.ts`.

## Persistance et ouverture

Le schéma Dexie **13** ajoute `dailyShop`, avec une seule ligne `current`. Les achats et le stock restant sont conservés dans cette ligne, sans journal ni archive des journées. Les transactions relisent la journée attendue, le solde et le stock ; les clics concurrents et les onglets obsolètes sont contrôlés.

Le renouvellement utilise les minuits civils Europe/Paris (23 ou 25 heures aux changements d’heure) et l’horloge maximale observée. Il remplace les offres et supprime les boosters quotidiens fermés. Les cartes acquises et les résultats d’une ouverture engagée restent conservés. Le retour au premier plan, l’entretien du jeu et la page ouverte vérifient les échéances.

Les exemplaires du lot apparaissent dans une entrée distincte de Vos boosters, sans lien supplémentaire sur l’offre. `openDailyBooster` consomme uniquement `dailyShop/current.bundle.owned`, sans modifier le stock gratuit ni `boosterStock`. Une édition événementielle conserve ses règles temporaires jusqu’à la fin de son offre du jour.

L’import/export valide cette table, accepte les anciens schémas sans quotidien et renouvelle les offres expirées. La migration d’une partie 1.5.0 n’impose aucune remise à zéro. Le garde de fin de bêta reste inchangé.

## Archive et vérification

L’état précédent est dans `archive/boutique-2026-11-12/boutique-avant-refonte.zip`, avec le prototype fourni et les anciens tests de boutique. Extraire dans un dossier séparé pour comparer ou restaurer.

Les tests couvrent les distributions, les changements d’heure, les achats concurrents, les stocks séparés, les cartes temporaires, les transactions annulées, la migration et les transferts. Les parcours Playwright couvrent achats, ouverture, minuit, absence de cartes, grille permanente, taux, clavier et swipe tactile.

## Ajustements après recette

Titres des offres réduits sur une ligne. Les cartes Reroll / Fragments sont réunies dans un carrousel à bouton fixe, sous les offres de la semaine. Le titre affiche le nombre d’utilisations du bonus sélectionné, quota de la semaine et crédits cadeaux compris. Le gain de fragments apparaît deux secondes sur le bouton, puis « Réclamée » lorsque le stock est épuisé. Les stocks des anciens lots achetés sont conservés dans `priorBundles`, au sein de la seule ligne du jour, puis supprimés au renouvellement quotidien. Les rerolls gratuits suivent la même règle que le reroll payant.
