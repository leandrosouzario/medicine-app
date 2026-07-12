'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { importFromIndexedDb } from '@/features/medications/actions'
import { getDoseEvents, getMedications } from '@/lib/db'

const MIGRATION_FLAG = 'med-idb-migrated-v1'

export function LocalDataMigrator() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (localStorage.getItem(MIGRATION_FLAG)) {
      return
    }

    let active = true

    async function migrate() {
      try {
        const [medications, doseEvents] = await Promise.all([
          getMedications(),
          getDoseEvents(),
        ])

        if (!active) {
          return
        }

        if (medications.length === 0) {
          localStorage.setItem(MIGRATION_FLAG, '1')
          return
        }

        const result = await importFromIndexedDb(medications, doseEvents)

        if (!active) {
          return
        }

        if (result.error) {
          return
        }

        localStorage.setItem(MIGRATION_FLAG, '1')

        if (result.imported) {
          router.refresh()
        }
      } catch {
        // IndexedDB indisponível ou import falhou — tenta de novo na próxima visita.
      }
    }

    void migrate()

    return () => {
      active = false
    }
  }, [router])

  return null
}
