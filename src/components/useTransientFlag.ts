import { useEffect, useState } from 'react'

export function useTransientFlag(ms = 3000) {
  const [active, setActive] = useState(false)
  useEffect(() => { if (!active) return; const timer = window.setTimeout(() => setActive(false), ms); return () => window.clearTimeout(timer) }, [active, ms])
  return [active, setActive] as const
}
