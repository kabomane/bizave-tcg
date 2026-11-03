type ChangelogEntry = {
  id: string
  title: string
  detail?: string
  planned?: boolean
}

// Curated history, newest first. Entries are supplied by the owner, not generated from Git.
export const changelog: readonly ChangelogEntry[] = [
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
