'use client'

import { useEffect } from 'react'

// Grava o offset UTC do browser (ex.: 180 para UTC-3) em um cookie
// para que server actions e queries possam gerar horários corretos.
export function TzSetter() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const offset = new Date().getTimezoneOffset()
    document.cookie = `tz_offset_min=${offset}; path=/; max-age=86400; SameSite=Strict`
  }, [])

  return null
}
