# bizave-tcg.v1.4.3

Version du 7 novembre 2026. Le compteur de notification passe de **6 à 7**.

Note affichée : « Refonte de la boutique, ajout de la boutique hebdomadaire plus souple sur les taux de drop. »

- La boutique validée remplace l’ancienne page sur `/boutique` ; `/test` est supprimé.
- Une sélection personnelle réunit lucky boost et 1 à 5 cartes de vitrine, renouvelés le lundi à minuit en Europe/Paris. Chaque semaine remplace la précédente sans historique des offres.
- Lucky boost utilise un pool, des taux et un prix aléatoires ; les catégories absentes redistribuent leurs probabilités entre celles retenues. Les taux et la taille du pool restent masqués.
- La vitrine utilise les raretés 30/25/20/13/12 %, les finitions Mate/Holographique/Alternative 70/22/8 % et Classique/Full Art 85/15 %. Une seule copie achetable par offre. Les cartes épuisées conservent leurs couleurs ; le bouton d’achat indique leur état.
- Carrousel, points et bouton d’achat partagent les espacements des boosters permanents. Le swipe reste possible sur les cartes. Les taux de la vitrine et des boosters permanents se consultent depuis leur séparateur.
- Dans Vos boosters, lucky boost vient après les boosters classiques et son bouton Taux de drop reste visible mais désactivé.
- Schéma Dexie 11 : boutique courante transférable et validation des offres à l’import. Les achats ne créent plus de journal ; le nettoyage de l’ancien historique est isolé dans un patch temporaire supprimable.

Détails : [boutique hebdomadaire](../boutique-hebdomadaire.md), [patch temporaire](../patch-booster-purchase-history.md), [validation](../../VALIDATION.md).
