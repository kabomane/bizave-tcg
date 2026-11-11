type ChangelogEntry = {
  id: string
  title: string
  detail?: string
  planned?: boolean
}

// Curated history, newest first. Entries are supplied by the owner, not generated from Git.
export const changelog: readonly ChangelogEntry[] = [
  { id: 'v150', title: 'Version 1.5.0', detail: 'Ouverture après la bêta, nouvelle partie au passage en 1.5.0, boosters en volume et boîte acrylique de Merry Xmas à 30 fragments. Nouvelle illustration de PR-001 et codes promos en Classique, finition Alternative.' },
  { id: 'v145', title: 'Version 1.4.5', detail: '22 nouvelles cartes Memory Frame, promo Bizave TCG bêta, stock de lucky boost renouvelé au reroll et codes cadeaux pour les bonus de la semaine.' },
  { id: 'v144', title: 'Version 1.4.4', detail: 'Bonus hebdomadaires avec reroll et carte fragments gratuite, taux de lucky boost visibles, deux nouvelles cartes Memory Frame et page de découverte actualisée.' },
  { id: 'v143', title: 'Version 1.4.3', detail: 'Refonte de la boutique, ajout de la boutique hebdomadaire plus souple sur les taux de drop.' },
  { id: 'v142', title: 'Version 1.4.2', detail: 'Nouvelle réception des fragments, fermeture des fenêtres à droite par défaut, option Droitier / Gaucher et alignement des chiffres du solde.' },
  { id: 'v141', title: 'Version 1.4.1', detail: 'Transfert de fragments entre amis, refonte du menu Amis, expiration des codes après 24 h, corrections de bugs et descriptions ajustées.' },
  { id: 'v140', title: 'Version 1.4.0', detail: 'Refonte des piles et des aperçus, partage des images de cartes et options de personnalisation. Deux nouvelles cartes dans Memory Frame.' },
  { id: 'v132', title: 'Version 1.3.2', detail: 'Nouvelles cartes dans Anima Isekai et Memory Frame, corrections d’affichage et modification du système de mise à jour.' },
  { id: 'v131', title: 'Version 1.3.1', detail: 'Nouveau visuel de Soirée film #3, options compactes, choix de couverture des piles, correction des favoris et nouveau rendu Full Art.' },
  { id: 'v130', title: 'Version 1.3.0', detail: 'epico stellari, 59 cartes Anima Isekai illustrées, favoris et filtres dans l’Atelier.' },
  { id: 'latest-fixes', title: 'Corrections de bugs et optimisations' },
  { id: 'anima-isekai', title: 'Ajout du booster Anima Isekai' },
  { id: 'account-management', title: 'Transfert de sauvegarde et suppression de compte' },
  { id: 'exchange-fixes', title: 'Optimisations et corrections de bugs' },
  { id: 'friends', title: 'Liste d’amis et envois de cartes' },
  { id: 'first-fixes', title: 'Optimisation et corrections de bugs' },
  { id: 'first-booster', title: 'Premier booster', detail: '110 cartes.' },
]
