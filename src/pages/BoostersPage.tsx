import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Clock3, PackageOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { boosters } from '../data/boosters'
import { cardById } from '../data/cards'
import { FREE_PACK_CAPACITY } from '../game/config'
import { settleFreePackRecharge } from '../game/engine'
import type { BoosterDefinition, OpenRecord } from '../game/types'
import { availableBoosters, purchasedQuantity } from '../game/boosterAvailability'
import { advanceReveal, finishOpening, openBooster } from '../storage/services'
import { useGame } from '../components/useGame'
import { BoosterSectionHeading } from '../components/BoosterSectionHeading'
import { BoosterCarousel } from '../components/BoosterCarousel'
import { DropRates } from '../components/DropRates'
import { CollectibleCard } from '../components/CollectibleCard'
import { EmptyState, ErrorNotice, Modal } from '../components/ui'
import { errorText, formatDuration } from '../components/format'
import { updateSettings, useSettings } from '../settings/useSettings'
import { preloadImages } from '../components/preloadImages'
import { CardViewer } from '../components/CardViewer'
import { CardBackdrop } from '../components/CardBackdrop'
import { FinishDot } from '../components/FinishDot'
import { useNow } from '../components/useNow'

function RechargeClock({ at }: { at: number }) { const now = useNow(); return <span className="recharge-clock"><Clock3 size={12} />{formatDuration(at - now, { hours: false })}</span> }

export function BoostersPage() {
  const { player, pendingOpening, boosterStock, drops } = useGame()
  const { selectedBoosterId } = useSettings()
  const [busy, setBusy] = useState(false), [tearing, setTearing] = useState(false), [error, setError] = useState('')
  const [showRates, setShowRates] = useState(false)
  const [recapIndex, setRecapIndex] = useState<number | null>(null)
  const [recap, setRecap] = useState<OpenRecord | null>(null)
  const inFlight = useRef(false), revealRoot = useRef<HTMLElement>(null), preloadedOpening = useRef<string | null>(null)
  const choices = useMemo(() => availableBoosters(boosters, boosterStock), [boosterStock])
  const booster = choices.find(choice => choice.id === selectedBoosterId) || choices[0]
  const [openingView, setOpeningView] = useState<{ choices: BoosterDefinition[]; selectedId: string; quantity: number } | null>(null)
  const stageChoices = tearing && openingView ? openingView.choices : choices
  const stageId = tearing && openingView ? openingView.selectedId : booster?.id
  const stageBooster = stageChoices.find(choice => choice.id === stageId)
  const pending = pendingOpening
  // eslint-disable-next-line react-hooks/purity -- Read-only stock projection; the database deadline drives actual recharge updates.
  const stock = settleFreePackRecharge(player, Math.max(Date.now(), player.maxObservedClockAt))
  const canOpen = !!booster && ((booster.access.type === 'free' && stock.freePackStock > 0) || purchasedQuantity(booster.id, boosterStock) > 0)
  const reserve = stageBooster ? tearing && openingView ? openingView.quantity : purchasedQuantity(stageBooster.id, boosterStock) : 0
  useEffect(() => {
    if (booster && selectedBoosterId !== booster.id) {
      try { updateSettings({ selectedBoosterId: booster.id }) } catch { /* Selection falls back without affecting game storage. */ }
    }
  }, [booster, selectedBoosterId])
  function select(id: string) {
    try { updateSettings({ selectedBoosterId: id }); setError('') } catch (e) { setError(errorText(e)) }
  }
  useEffect(() => {
    if (pending && !tearing) revealRoot.current?.querySelector<HTMLElement>('.card, .card-back')?.focus({ preventScroll: true })
  }, [pending?.id, pending?.revealedCount, pending, tearing])
  useEffect(() => {
    if (!pending) { preloadedOpening.current = null; return }
    if (preloadedOpening.current === pending.id) return
    preloadedOpening.current = pending.id
    void preloadImages(pending.results.map(card => cardById.get(card.cardId)!.artwork[card.artVariant]))
  }, [pending])
  async function open() {
    if (inFlight.current || !canOpen || !booster) return
    inFlight.current = true; setBusy(true); setError(''); setTearing(true); setRecap(null)
    setOpeningView({ choices, selectedId: booster.id, quantity: purchasedQuantity(booster.id, boosterStock) })
    try { const record = await openBooster(booster.id); preloadedOpening.current = record.id; void preloadImages(record.results.map(card => cardById.get(card.cardId)!.artwork[card.artVariant])); await new Promise(resolve => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 620)) }
    catch (e) { setError(errorText(e)) }
    finally { setTearing(false); setOpeningView(null); setBusy(false); inFlight.current = false }
  }
  async function next() {
    if (!pending || inFlight.current) return
    inFlight.current = true; setBusy(true); setError('')
    try {
      if (pending.revealedCount < pending.results.length) await advanceReveal(pending.id)
      else { await finishOpening(pending.id); setRecap(pending) }
    } catch (e) { setError(errorText(e)) }
    finally { setBusy(false); inFlight.current = false }
  }
  if (pending && !tearing) {
    const count = pending.revealedCount, card = pending.results[Math.max(0, count - 1)]
    return <section ref={revealRoot} className="opening-view" aria-label="Ouverture du booster">
      <CardBackdrop className="opening-backdrop" rarity={count > 0 ? cardById.get(card.cardId)!.rarity : undefined} /><div className="opening-spacer" aria-hidden="true" />
      <div className="opening-card-area" key={count}>{count === 0 ? <button className="card-back" onClick={next} disabled={busy} aria-label="Révéler la première carte"><span className="back-ornament" /><span className="back-monogram">B</span><span className="back-wordmark">BIZAVE</span><span className="back-star">✦</span></button> : <CollectibleCard card={card} definition={cardById.get(card.cardId)!} onActivate={next} activationLabel={count < pending.results.length ? 'Carte suivante' : 'Voir les cartes obtenues'} />}</div>
      <div className="opening-bottom"><div className="reveal-progress" aria-label={`${count} cartes révélées sur ${pending.results.length}`}>{pending.results.map((result, i) => i < count ? <FinishDot key={i} card={result} revealed active={i === count - 1} /> : <span key={i} className="finish-dot" />)}</div><div className="opening-meta"><span>{pending.boosterTitle || boosters.find(choice => choice.id === pending.boosterId)?.title || 'Booster'}</span></div></div><ErrorNotice error={error} />
    </section>
  }
  if (recap) return <section className="opening-recap"><div className="page-heading"><h1 className="page-title">Dans votre collection.</h1><span className="recap-check"><Check size={15} /> {recap.results.length} carte{recap.results.length > 1 ? 's' : ''}</span></div><div className="recap-grid">{recap.results.map((card, index) => <div key={card.dropId}><CollectibleCard card={card} definition={cardById.get(card.cardId)!} presentation="thumbnail" onActivate={() => setRecapIndex(index)} /><span className="recap-caption"><FinishDot card={card} active /></span></div>)}</div><div className="recap-actions"><button className="primary-button recap-confirm" onClick={() => { setRecap(null); window.scrollTo({ top: 0, behavior: 'instant' }) }}>Valider</button></div>{recapIndex !== null && <CardViewer initialIndex={recapIndex} onClose={() => setRecapIndex(null)} entries={recap.results.map(card => ({ key: card.dropId, card, ids: drops.some(drop => drop.dropId === card.dropId && drop.status === 'owned') ? [card.dropId] : [], acquiredAt: recap.openedAt })).filter(entry => !drops.some(drop => drop.dropId === entry.card.dropId && drop.status === 'recycled'))} />}</section>
  return <section className="phantom-home">
    <BoosterSectionHeading title={<>Vos <em>boosters</em></>} linkTo="/boutique" linkLabel="Boutique" onShowRates={() => setShowRates(true)} />
    {stageBooster ? <div className="phantom-stage"><div className="phantom-shadow" /><BoosterCarousel choices={stageChoices} selectedId={stageBooster.id} onSelect={select} onOpen={open} disabled={busy} canOpen={canOpen} tearing={tearing} /><div className="pack-status"><div className="phantom-stock" aria-label={stageBooster.access.type === 'free' ? `${stock.freePackStock} boosters disponibles sur ${FREE_PACK_CAPACITY}` : `${reserve} boosters achetés`}>{stageBooster.access.type === 'free' && <div className="stock-meter">{Array.from({ length: FREE_PACK_CAPACITY }, (_, i) => <span key={i} className={i < stock.freePackStock ? 'charged' : ''} />)}</div>}<span className="booster-stock-count">{stageBooster.access.type === 'free' && <><strong>{stock.freePackStock}</strong> / {FREE_PACK_CAPACITY}</>}{reserve > 0 && <span className="purchased-pack-reserve" aria-label={`${reserve} boosters achetés`}>+ {reserve}</span>}</span>{stageBooster.access.type === 'free' && stock.nextFreePackAt !== null && <RechargeClock at={stock.nextFreePackAt} />}</div></div></div> : <EmptyState icon={<PackageOpen size={25} />} title="Aucun booster disponible." action={<Link to="/boutique" className="secondary-button">Boutique <ArrowRight size={14} /></Link>}>Vos prochains paquets apparaîtront ici.</EmptyState>}
    <ErrorNotice error={error} />
    {showRates && stageBooster && <Modal title="Taux de drop" onClose={() => setShowRates(false)}><DropRates booster={stageBooster} /></Modal>}
  </section>
}
