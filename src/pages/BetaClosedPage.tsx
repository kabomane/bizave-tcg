import { useState } from 'react'
import { CardSvgDefinitions, CollectibleCard } from '../components/CollectibleCard'
import { copyText, errorText } from '../components/format'
import { ErrorNotice } from '../components/ui'
import { BETA_PROMO_CODE } from '../data/betaRelease'
import { cardById } from '../data/cards'
import './beta-closed.css'

const promo = cardById.get('bizave-tcg-beta')!
const fan = [
  { position: 'left', finish: 'normal', artVariant: 'standard' },
  { position: 'center', finish: 'alternative', artVariant: 'fullArt' },
  { position: 'right', finish: 'glossy', artVariant: 'standard' },
] as const

export function BetaClosedPage({ onEnter }: { onEnter: () => Promise<void> }) {
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function copyCode() {
    setError('')
    try { await copyText(BETA_PROMO_CODE); setCopied(true) }
    catch (error) { setError(errorText(error)) }
  }

  async function enter() {
    setError('')
    setBusy(true)
    try { await onEnter() }
    catch (error) { setError(errorText(error)); setBusy(false) }
  }

  return <main className="update-page beta-closed">
    <span className="brand update-brand">bizave<span>TCG</span><i /></span>
    <header className="beta-closed-heading">
      <h1>La bêta est terminée.</h1>
      <p>Bienvenue dans <strong>Bizave TCG 1.6.0</strong>.</p>
    </header>
    <CardSvgDefinitions />
    <figure className="beta-fan" aria-label="Trois variantes de PR-001 : mate, holographique et alternative Full Art">
      {fan.map(({ position, finish, artVariant }) => <div key={position} className={`beta-fan-card beta-fan-card--${position}`} aria-hidden="true">
        <CollectibleCard definition={promo} card={{ cardId: promo.id, dropId: '', finish, artVariant }} presentation="thumbnail" interactive={false} />
      </div>)}
    </figure>
    <div className="beta-closed-copy">
      <p>Merci d’avoir joué à la bêta. Ce code offre la carte <strong>PR-001</strong> en Classique, finition Alternative.</p>
      <div className="beta-promo-code">
        <code>{BETA_PROMO_CODE}</code>
        <button className="secondary-button" type="button" onClick={() => void copyCode()} disabled={busy}>{copied ? 'Copié' : 'Copier le code'}</button>
      </div>
      <p>Gardez le code avant de continuer. Utilisez-le dans <strong>Options → Code cadeau</strong>.</p>
    </div>
    <div className="update-actions">
      <p id="beta-reset-warning" className="muted">En entrant, vous effacez définitivement la partie bêta de cet appareil et démarrez une nouvelle sauvegarde.</p>
      <button className="primary-button beta-reopen-button" type="button" onClick={() => void enter()} disabled={busy} aria-describedby="beta-reset-warning" aria-busy={busy}>
        {busy ? 'Réinitialisation…' : 'Réinitialiser et entrer en 1.6.0'}
      </button>
      <ErrorNotice error={error} />
    </div>
  </main>
}
