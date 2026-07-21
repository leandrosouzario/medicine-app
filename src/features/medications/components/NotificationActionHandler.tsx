'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateDoseEventStatus } from '@/features/medications/actions'

const processedIds = new Set<string>()

async function markDoseTaken(doseId: string, refresh: () => void): Promise<void> {
  if (!doseId || processedIds.has(doseId)) return

  processedIds.add(doseId)

  const result = await updateDoseEventStatus(doseId, 'taken')
  if (result.error) {
    processedIds.delete(doseId)
    return
  }

  refresh()
}

/**
 * Escuta ações vindas do service worker (notificação “Tomado”) e query ?taken=
 * quando o app estava fechado.
 */
export function NotificationActionHandler() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router

  useEffect(() => {
    if (typeof window === 'undefined') return

    function refresh() {
      routerRef.current.refresh()
    }

    function onMessage(event: MessageEvent) {
      const data = event.data
      if (!data || data.type !== 'MARK_DOSE_TAKEN') return
      void markDoseTaken(data.doseId as string, refresh)
    }

    navigator.serviceWorker?.addEventListener('message', onMessage)

    const params = new URLSearchParams(window.location.search)
    const takenId = params.get('taken')
    if (takenId) {
      void markDoseTaken(takenId, refresh).then(() => {
        params.delete('taken')
        const query = params.toString()
        const nextUrl = query
          ? `${window.location.pathname}?${query}`
          : window.location.pathname
        window.history.replaceState({}, '', nextUrl)
      })
    }

    return () => {
      navigator.serviceWorker?.removeEventListener('message', onMessage)
    }
  }, [])

  return null
}
