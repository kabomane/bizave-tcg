export async function preloadImages(urls: readonly string[]) {
  await Promise.all([...new Set(urls)].map(async url => {
    try { const img = new Image(); img.decoding = 'async'; img.src = url; await img.decode() } catch { /* Preloading must never block opening a pack. */ }
  }))
}
