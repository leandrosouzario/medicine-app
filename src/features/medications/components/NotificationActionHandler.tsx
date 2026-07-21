'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { snoozeDoseEvent, updateDoseEventStatus } from '@/features/medications/actions'
import { isSnoozeMinutes } from '@/features/medications/snooze'

const processedTakenIds = new Set<string>()
const processedSnoozeKeys = new Set<string>()

async function markDoseTaken(doseId: string, refresh: () => void): Promise<void> {
  if (!doseId || processedTakenIds.has(doseId)) return

  processedTakenIds.add(doseId)

  const result = await updateDoseEventStatus(doseId, 'taken')
  if (result.error) {
    processedTakenIds.delete(doseId)
    return
  }

  refresh()
}

async function snoozeDose(
  doseId: string,
  minutes: number,
  refresh: () => void,
): Promise<void> {
  if (!doseId || !isSnoozeMinutes(minutes)) return

  const key = `${doseId}:${minutes}`
  if (processedSnoozeKeys.has(key)) return

  processedSnoozeKeys.add(key)

  const result = await snoozeDoseEvent(doseId, minutes)
  if (result.error) {
    processedSnoozeKeys.delete(key)
    return
  }

  refresh()
}

/**
 * Escuta ações vindas do service worker (notificação “Tomado” / adiar) e query
 * ?taken= / ?snooze=&min= quando o app estava fechado.
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
      if (!data) return

      if (data.type === 'MARK_DOSE_TAKEN') {
        void markDoseTaken(data.doseId as string, refresh)
        return
      }

      if (data.type === 'SNOOZE_DOSE') {
        void snoozeDose(data.doseId as string, Number(data.minutes), refresh)
      }
    }

    navigator.serviceWorker?.addEventListener('message', onMessage)

    const params = new URLSearchParams(window.location.search)
    const takenId = params.get('taken')
    const snoozeId = params.get('snooze')
    const snoozeMin = Number(params.get('min') ?? '10')

    const tasks: Promise<void>[] = []

    if (takenId) {
      tasks.push(
        markDoseTaken(takenId, refresh).then(() => {
          params.delete('taken')
        }),
      )
    }

    if (snoozeId) {
      tasks.push(
        snoozeDose(snoozeId, snoozeMin, refresh).then(() => {
          params.delete('snooze')
          params.delete('min')
        }),
      )
    }

    if (tasks.length > 0) {
      void Promise.all(tasks).then(() => {
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
