import type { SupabaseClient } from '@supabase/supabase-js'
import type { DoseEvent, Medication } from '@/lib/db/types'
import { doseEventKey } from '@/features/medications/event-key'
import { generateMedicationDoseEvents } from '@/features/medications/dose-schedule'
import { doseEventToInsert } from '@/features/medications/mappers'
import type { HistoryPeriod } from '@/features/medications/history'
import type { MedDoseEventRow } from '@/types/database'
import {
  addDays,
  startOfDayWithOffset,
} from '@/lib/dates'

export function computeMissingPastEvents(
  medications: Medication[],
  existingEvents: DoseEvent[],
  periodDays: HistoryPeriod,
  tzOffsetMinutes: number,
  now = new Date(),
): DoseEvent[] {
  const todayStart = startOfDayWithOffset(now, tzOffsetMinutes)
  const rangeStart = addDays(todayStart, -(periodDays - 1))
  const existingKeys = new Set(
    existingEvents.map((event) => doseEventKey(event.medicationId, event.scheduledAt)),
  )

  const missing: DoseEvent[] = []

  for (const medication of medications) {
    const generated = generateMedicationDoseEvents(
      medication,
      rangeStart,
      now,
      tzOffsetMinutes,
    )

    for (const event of generated) {
      if (new Date(event.scheduledAt) >= now) continue

      const key = doseEventKey(event.medicationId, event.scheduledAt)
      if (existingKeys.has(key)) continue

      existingKeys.add(key)
      missing.push({
        ...event,
        status: 'missed',
      })
    }
  }

  return missing
}

export async function backfillPastDoseEvents(
  supabase: SupabaseClient,
  userId: string,
  medications: Medication[],
  existingRows: MedDoseEventRow[],
  periodDays: HistoryPeriod,
  tzOffsetMinutes: number,
): Promise<number> {
  const existingEvents = existingRows.map((row) => ({
    id: row.id,
    medicationId: row.medication_id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    takenAt: row.taken_at ?? undefined,
    note: row.note ?? undefined,
  }))

  const toInsert = computeMissingPastEvents(
    medications,
    existingEvents,
    periodDays,
    tzOffsetMinutes,
  )

  if (toInsert.length === 0) {
    return 0
  }

  const { error } = await supabase
    .from('med_dose_events')
    .insert(toInsert.map((event) => doseEventToInsert(event, userId)))

  if (error) {
    throw error
  }

  return toInsert.length
}
