type ChangelogEntry = {
  id: string
  title: string
  detail?: string
  planned?: boolean
}

// Curated history, newest first. Entries are supplied by the owner, not generated from Git.
export const changelog: readonly ChangelogEntry[] = [
  { id: 'more-cards', title: 'De nouvelles cartes', detail: 'Dans Memory Frame et Anima Isekai.', planned: true },
  { id: 'v130', title: 'Version 1.3.0', detail: 'epico stellari, 59 cartes Anima Isekai illustrées, favoris et filtres dans l’Atelier.' },
  { id: 'latest-fixes', title: 'Corrections de bugs et optimisations' },
  { id: 'anima-isekai', title: 'Ajout du booster Anima Isekai' },
  { id: 'account-management', title: 'Transfert de sauvegarde et suppression de compte' },
  { id: 'exchange-fixes', title: 'Optimisations et corrections de bugs' },
  { id: 'friends', title: 'Liste d’amis et envois de cartes' },
  { id: 'first-fixes', title: 'Optimisation et corrections de bugs' },
  { id: 'first-booster', title: 'Premier booster', detail: '110 cartes.' },
]
