import type { DoseEvent, Medication } from '@/lib/db/types'
import { doseEventKey } from '@/features/medications/event-key'
import {
  computeAdherenceSummary,
  type AdherenceSummary,
} from '@/features/medications/dose-status'
import {
  addDays,
  endOfDayWithOffset,
  formatDisplayDate,
  formatLocalDate,
  localDateKeyFromInstant,
  startOfDayWithOffset,
} from '@/lib/dates'

export type HistoryPeriod = 7 | 30 | 60 | 90

export const HISTORY_PERIODS: HistoryPeriod[] = [7, 30, 60, 90]

export function parseHistoryPeriod(value: string | undefined): HistoryPeriod {
  if (value === '30') return 30
  if (value === '60') return 60
  if (value === '90') return 90
  return 7
}

export function historyRangeLabel(period: HistoryPeriod): string {
  return `Últimos ${period} dias`
}

export type MedicationAdherence = {
  medication: Medication
  summary: AdherenceSummary
}

export type HistoryDayGroup = {
  dateKey: string
  label: string
  doses: Array<DoseEvent & { medication: Medication }>
}

export type HistoryData = {
  period: HistoryPeriod
  rangeLabel: string
  overall: AdherenceSummary
  byMedication: MedicationAdherence[]
  days: HistoryDayGroup[]
}

function resolveDayLabel(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return 'Hoje'

  const today = new Date(`${todayKey}T12:00:00`)
  const yesterdayKey = formatLocalDate(addDays(today, -1))
  if (dateKey === yesterdayKey) return 'Ontem'

  return formatDisplayDate(dateKey)
}

function dedupeEventsBySlot(
  events: Array<DoseEvent & { medication: Medication }>,
): Array<DoseEvent & { medication: Medication }> {
  const statusPriority: Record<DoseEvent['status'], number> = {
    taken: 4,
    skipped: 3,
    missed: 2,
    pending: 1,
  }

  const bySlot = new Map<string, DoseEvent & { medication: Medication }>()

  for (const event of events) {
    const slotKey = doseEventKey(event.medicationId, event.scheduledAt)
    const current = bySlot.get(slotKey)
    if (!current || statusPriority[event.status] > statusPriority[current.status]) {
      bySlot.set(slotKey, event)
    }
  }

  return [...bySlot.values()]
}

export function buildHistoryData(
  events: DoseEvent[],
  medications: Medication[],
  period: HistoryPeriod,
  tzOffsetMinutes: number,
  referenceDate = new Date(),
): HistoryData {
  const medicationMap = new Map(medications.map((m) => [m.id, m]))
  const todayKey = localDateKeyFromInstant(referenceDate, tzOffsetMinutes)
  const rangeStart = new Date(
    startOfDayWithOffset(referenceDate, tzOffsetMinutes).getTime() -
      (period - 1) * 86_400_000,
  )
  const rangeEnd = endOfDayWithOffset(referenceDate, tzOffsetMinutes)

  const enriched = dedupeEventsBySlot(
    events
      .filter((event) => {
        const scheduledAt = new Date(event.scheduledAt)
        return scheduledAt >= rangeStart && scheduledAt <= rangeEnd
      })
      .flatMap((event) => {
        const medication = medicationMap.get(event.medicationId)
        if (!medication) return []
        return [{ ...event, medication }]
      }),
  )

  const overall = computeAdherenceSummary(enriched)

  const byMedEvents = new Map<string, Array<DoseEvent & { medication: Medication }>>()
  for (const dose of enriched) {
    const list = byMedEvents.get(dose.medicationId) ?? []
    list.push(dose)
    byMedEvents.set(dose.medicationId, list)
  }

  const byMedication = [...byMedEvents.values()]
    .map((doses) => ({
      medication: doses[0].medication,
      summary: computeAdherenceSummary(doses),
    }))
    .sort((a, b) => a.medication.name.localeCompare(b.medication.name, 'pt-BR'))

  const dayMap = new Map<string, HistoryDayGroup>()
  for (const dose of enriched) {
    const dateKey = localDateKeyFromInstant(new Date(dose.scheduledAt), tzOffsetMinutes)
    const existing = dayMap.get(dateKey)
    if (existing) {
      existing.doses.push(dose)
    } else {
      dayMap.set(dateKey, {
        dateKey,
        label: resolveDayLabel(dateKey, todayKey),
        doses: [dose],
      })
    }
  }

  const days = [...dayMap.values()]
    .map((day) => ({
      ...day,
      doses: day.doses.sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))

  const rangeLabel = historyRangeLabel(period)

  return { period, rangeLabel, overall, byMedication, days }
}
