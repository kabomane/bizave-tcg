import { Search, Star, X } from 'lucide-react'

export function CardSearchRow({ search, onSearchChange, favoritesOnly, onToggleFavorites }: {
  search: string
  onSearchChange: (value: string) => void
  favoritesOnly: boolean
  onToggleFavorites: () => void
}) {
  return <div className="collection-search-row">
    <label className="collection-search">
      <Search size={17} />
      <input type="search" aria-label="Rechercher une carte" placeholder="Rechercher une carte…" value={search} onChange={event => onSearchChange(event.target.value)} />
      {search && <button type="button" className="icon-button" aria-label="Effacer la recherche" onClick={() => onSearchChange('')}><X size={15} /></button>}
    </label>
    <button type="button" className="icon-button favorites-filter" aria-label="Afficher uniquement les favoris" aria-pressed={favoritesOnly} onClick={onToggleFavorites}>
      <Star size={18} fill={favoritesOnly ? 'currentColor' : 'none'} />
    </button>
  </div>
}
