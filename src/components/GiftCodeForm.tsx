import { useRef, useState } from 'react'
import { boosters } from '../data/boosters'
import { redeemGiftCode } from '../gifts/services'
import { errorText } from './format'

export function GiftCodeForm() {
  const [code, setCode] = useState(''), [busy, setBusy] = useState(false)
  const [error, setError] = useState(''), [success, setSuccess] = useState('')
  const inFlight = useRef(false)
  function changeCode(value: string) {
    const clean = value.replace(/[^a-zA-Z0-9-]/g, ''), characters = clean.replaceAll('-', '')
    setCode((characters.length > 16 ? characters.slice(0, 16) : clean).slice(0, 19))
    setError(''); setSuccess('')
  }
  async function redeem() {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setError(''); setSuccess('')
    try {
      const reward = await redeemGiftCode(code)
      setCode('')
      setSuccess(reward.type === 'fragments' ? `${reward.amount} fragments ajoutés.` : `${reward.quantity} boosters ${boosters.find(booster => booster.id === reward.boosterId)!.title} ajoutés à vos boosters.`)
    } catch (e) { setError(errorText(e)) }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <section className="settings-section" aria-labelledby="gift-heading">
    <h2 id="gift-heading">Code cadeau</h2>
    <form onSubmit={event => { event.preventDefault(); void redeem() }} aria-busy={busy}>
      <label htmlFor="gift-code" className="visually-hidden">Code cadeau</label>
      <div className="gift-code-fields">
        <input id="gift-code" name="gift-code" type="text" value={code} placeholder="XXXX-XXXX-XXXX-XXXX" autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={19} disabled={busy} aria-invalid={!!error} aria-describedby="gift-note" onChange={event => changeCode(event.target.value)} onKeyDown={event => { if (event.key === ' ') event.preventDefault() }} onPaste={event => {
          // Filter pasted text before applying the displayed and useful character limits.
          event.preventDefault()
          const input = event.currentTarget, pasted = event.clipboardData.getData('text/plain').replace(/[^a-zA-Z0-9-]/g, '')
          changeCode(input.value.slice(0, input.selectionStart ?? input.value.length) + pasted + input.value.slice(input.selectionEnd ?? input.value.length))
        }} />
        <button className="secondary-button" type="submit" disabled={busy || !code.trim()}>{busy ? 'Vérification…' : 'Utiliser'}</button>
      </div>
      <p className="settings-note gift-code-note" id="gift-note" data-state={error ? 'error' : success ? 'success' : 'idle'} role={error ? 'alert' : 'status'} aria-atomic="true">{error || success || 'Saisissez votre code pour recevoir votre cadeau.'}</p>
    </form>
  </section>
}
