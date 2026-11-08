import { CardSvgDefinitions, CollectibleCard } from '../components/CollectibleCard'
import { formatDuration } from '../components/format'
import { useNow } from '../components/useNow'
import { cardById } from '../data/cards'
import './beta-closed.css'

const opensAt = Date.parse('2026-11-14T00:00:00+01:00')
const fan = [
  { id: 'chatgpt-bizave', position: 'left', finish: 'normal' },
  { id: 't-bizave', position: 'center', finish: 'alternative' },
  { id: 'claude-bizave', position: 'right', finish: 'normal' },
] as const

export function BetaClosedPage() {
  const remaining = Math.max(0, opensAt - useNow())
  const countdownOver = remaining === 0

  const seconds = Math.ceil(remaining / 1000)
  const days = Math.floor(seconds / 86_400)
  const time = formatDuration((seconds % 86_400) * 1000, { hours: true })

  return <main className="update-page beta-closed">
    <span className="brand update-brand">bizave<span>TCG</span><i /></span>
    <header className="beta-closed-heading">
      <h1>La bêta est fermée.</h1>
      <p>Bizave TCG prépare sa sortie en version <strong>1.5.0</strong>.</p>
    </header>
    <CardSvgDefinitions />
    <figure className="beta-fan" aria-label="ChatGPT BIZAVE, Thomas BIZAVE et Claude BIZAVE">
      {fan.map(({ id, position, finish }) => <div key={id} className={`beta-fan-card beta-fan-card--${position}`} aria-hidden="true">
        <CollectibleCard definition={cardById.get(id)!} card={{ cardId: id, dropId: '', finish, artVariant: 'standard' }} presentation="thumbnail" interactive={false} />
      </div>)}
    </figure>
    <div className="beta-closed-copy">
      <p>À la réouverture, les sauvegardes de la bêta seront réinitialisées.</p>
      <p>Si vous avez une sauvegarde sur cet appareil, vous recevrez un <strong>code de compensation exclusif</strong> lors du passage en version 1.5.0.</p>
    </div>
    <div className="update-actions">
      <button className="primary-button beta-reopen-button" type="button" disabled>
        {countdownOver ? 'incessamment sous peu' : <>
          <span>Réouverture dans</span>
          <span className="beta-countdown">{days > 0 && `${days} j · `}{time}</span>
        </>}
      </button>
    </div>
  </main>
}
