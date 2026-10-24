let locks = 0
let restore: (() => void) | undefined

/** Fixed-body lock also stops background scrolling on touch browsers. */
export function lockPageScroll() {
  if (locks++ === 0) {
    const body = document.body, root = document.documentElement
    const x = window.scrollX, y = window.scrollY
    const bodyStyles = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const rootStyles = { overflow: root.style.overflow, overscrollBehavior: root.style.overscrollBehavior }
    const scrollbar = window.innerWidth - root.clientWidth
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0
    Object.assign(body.style, { position: 'fixed', top: `${-y}px`, left: `${-x}px`, width: '100%', overflow: 'hidden' })
    if (scrollbar > 0) body.style.paddingRight = `${padding + scrollbar}px`
    Object.assign(root.style, { overflow: 'hidden', overscrollBehavior: 'none' })
    restore = () => {
      Object.assign(body.style, bodyStyles)
      Object.assign(root.style, rootStyles)
      const behavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'
      window.scrollTo(x, y)
      root.style.scrollBehavior = behavior
    }
  }
  let released = false
  return () => {
    if (released) return
    released = true
    if (--locks === 0) { restore?.(); restore = undefined }
  }
}
