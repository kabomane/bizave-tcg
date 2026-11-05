const toggle = document.querySelector('#show-cards')
const status = document.querySelector('#spoiler-status')
const slots = [...document.querySelectorAll('.cs')]
const previews = new Map(slots.map(slot => [slot, slot.querySelector(':scope > .card-scale').cloneNode(true)]))

function updateCards() {
  for (const slot of slots) {
    const template = slot.querySelector('template')
    const face = toggle.checked ? template.content.firstElementChild : previews.get(slot)
    slot.querySelector(':scope > .card-scale').replaceWith(face.cloneNode(true))
    slot.setAttribute('aria-label', toggle.checked ? template.dataset.label : 'Nom de la carte — aperçu sans spoil')
  }
  status.textContent = toggle.checked
    ? 'Cartes dévoilées. Décochez pour les masquer.'
    : 'Anti-spoil activé : illustrations, noms et descriptions masqués.'
}

toggle.disabled = false
toggle.addEventListener('change', updateCards)
// Browsers can restore form state, including through the back/forward cache.
window.addEventListener('pageshow', () => { toggle.checked = false; updateCards() })
toggle.checked = false
updateCards()

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('in')
      observer.unobserve(entry.target)
    }
  }, { rootMargin: '0px 0px -8% 0px' })
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element))
} else {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('in'))
}
