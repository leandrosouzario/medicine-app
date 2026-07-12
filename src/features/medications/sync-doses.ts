import type { SupabaseClient } from '@supabase/supabase-js'
import type { DoseEvent, Medication } from '@/lib/db/types'
import {
  doseEventFromRow,
  doseEventToInsert,
} from '@/features/medications/mappers'
import { regenerateAllDoseEvents } from '@/features/medications/dose-schedule'
import { doseEventKey } from '@/features/medications/event-key'
import type { MedDoseEventRow } from '@/types/database'

export async function syncDoseEventsWithSupabase(
  supabase: SupabaseClient,
  userId: string,
  medications: Medication[],
  existingRows: MedDoseEventRow[],
  options?: { tzOffsetMinutes?: number },
): Promise<DoseEvent[]> {
  const existingEvents = existingRows.map(doseEventFromRow)
  const nextEvents = regenerateAllDoseEvents(medications, existingEvents, options)
  const now = new Date().toISOString()

  const existingByKey = new Map(
    existingRows.map((row) => [doseEventKey(row.medication_id, row.scheduled_at), row]),
  )

  const nextPendingFutureKeys = new Set(
    nextEvents
      .filter((event) => event.status === 'pending' && event.scheduledAt >= now)
      .map((event) => doseEventKey(event.medicationId, event.scheduledAt)),
  )

  const idsToDelete = existingRows
    .filter((row) => row.status === 'pending' && row.scheduled_at >= now)
    .filter(
      (row) => !nextPendingFutureKeys.has(doseEventKey(row.medication_id, row.scheduled_at)),
    )
    .map((row) => row.id)

  const resolvedSlots = new Set(
    existingRows
      .filter((row) => row.status !== 'pending')
      .map((row) => doseEventKey(row.medication_id, row.scheduled_at)),
  )

  const duplicatePendingIds = existingRows
    .filter((row) => row.status === 'pending')
    .filter((row) => resolvedSlots.has(doseEventKey(row.medication_id, row.scheduled_at)))
    .map((row) => row.id)

  const allIdsToDelete = [...new Set([...idsToDelete, ...duplicatePendingIds])]

  if (allIdsToDelete.length > 0) {
    await supabase
      .from('med_dose_events')
      .delete()
      .in('id', allIdsToDelete)
      .eq('user_id', userId)
  }

  const toInsert = nextEvents
    .filter((event) => event.status === 'pending' && event.scheduledAt >= now)
    .filter((event) => !existingByKey.has(doseEventKey(event.medicationId, event.scheduledAt)))
    .map((event) => doseEventToInsert(event, userId))

  if (toInsert.length > 0) {
    const { error } = await supabase.from('med_dose_events').insert(toInsert)
    if (error) {
      throw error
    }
  }

  return nextEvents.map((event) => {
    const existing = existingByKey.get(doseEventKey(event.medicationId, event.scheduledAt))
    return existing ? doseEventFromRow(existing) : event
  })
}
