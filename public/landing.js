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
