import type { DoseEvent, Medication } from '@/lib/db/types'
import { doseEventKey } from '@/features/medications/event-key'
import {
  addDays,
  endOfDay,
  endOfDayWithOffset,
  formatDisplayDate,
  parseLocalDate,
  parseTimeOnDate,
  parseTimeOnDateWithOffset,
  startOfDay,
  startOfDayWithOffset,
} from '@/lib/dates'

const DEFAULT_HORIZON_DAYS = 30

export type DoseScheduleOptions = {
  horizonDays?: number
  /** new Date().getTimezoneOffset() from the client; 180 for UTC-3. */
  tzOffsetMinutes?: number
}

function isDayAllowed(date: Date, daysOfWeek?: number[]): boolean {
  if (!daysOfWeek || daysOfWeek.length === 0) return true
  return daysOfWeek.includes(date.getDay())
}

function isWithinPeriod(date: Date, medication: Medication): boolean {
  const start = startOfDay(parseLocalDate(medication.period.startDate))
  const end = medication.period.endDate
    ? endOfDay(parseLocalDate(medication.period.endDate))
    : null

  return date >= start && (end === null || date <= end)
}

function generateFixedTimeEvents(
  medication: Medication,
  from: Date,
  to: Date,
  tzOffsetMinutes: number,
): DoseEvent[] {
  const times = medication.schedule.times ?? []
  if (times.length === 0) return []

  const events: DoseEvent[] = []
  let cursor = startOfDayWithOffset(from, tzOffsetMinutes)

  while (cursor <= to) {
    if (isWithinPeriod(cursor, medication) && isDayAllowed(cursor, medication.schedule.daysOfWeek)) {
      for (const time of times) {
        const scheduledAt = parseTimeOnDateWithOffset(cursor, time, tzOffsetMinutes)
        if (scheduledAt >= from && scheduledAt <= to) {
          events.push({
            id: crypto.randomUUID(),
            medicationId: medication.id,
            scheduledAt: scheduledAt.toISOString(),
            status: 'pending',
          })
        }
      }
    }
    cursor = addDays(cursor, 1)
  }

  return events
}

function generateIntervalEvents(
  medication: Medication,
  from: Date,
  to: Date,
): DoseEvent[] {
  const intervalHours = medication.schedule.intervalHours
  if (!intervalHours || intervalHours <= 0) return []

  const events: DoseEvent[] = []
  let cursor = new Date(from)

  while (cursor <= to) {
    if (isWithinPeriod(cursor, medication) && isDayAllowed(cursor, medication.schedule.daysOfWeek)) {
      events.push({
        id: crypto.randomUUID(),
        medicationId: medication.id,
        scheduledAt: cursor.toISOString(),
        status: 'pending',
      })
    }
    cursor = new Date(cursor.getTime() + intervalHours * 3_600_000)
  }

  return events
}

function eventKey(event: Pick<DoseEvent, 'medicationId' | 'scheduledAt'>): string {
  return doseEventKey(event.medicationId, event.scheduledAt)
}

export function regenerateDoseEvents(
  medication: Medication,
  existingEvents: DoseEvent[],
  options?: DoseScheduleOptions,
): DoseEvent[] {
  const horizonDays = options?.horizonDays ?? DEFAULT_HORIZON_DAYS
  const tzOffset = options?.tzOffsetMinutes ?? 0

  const now = new Date()
  const today = startOfDayWithOffset(now, tzOffset)
  const horizonEnd = endOfDayWithOffset(addDays(today, horizonDays), tzOffset)

  const otherMedicationEvents = existingEvents.filter(
    (event) => event.medicationId !== medication.id,
  )

  const keptEvents = existingEvents.filter((event) => {
    if (event.medicationId !== medication.id) return false
    const scheduledAt = new Date(event.scheduledAt)
    return scheduledAt < now || event.status !== 'pending'
  })

  if (!medication.active || medication.schedule.type === 'as_needed') {
    return [...otherMedicationEvents, ...keptEvents]
  }

  const periodStart = startOfDayWithOffset(parseLocalDate(medication.period.startDate), tzOffset)
  const generationStart = periodStart > today ? periodStart : today

  let generationEnd = horizonEnd
  if (medication.period.endDate) {
    const periodEnd = endOfDayWithOffset(parseLocalDate(medication.period.endDate), tzOffset)
    if (periodEnd < generationEnd) generationEnd = periodEnd
  }

  if (generationStart > generationEnd) {
    return [...otherMedicationEvents, ...keptEvents]
  }

  const generated =
    medication.schedule.type === 'interval'
      ? generateIntervalEvents(medication, generationStart, generationEnd)
      : generateFixedTimeEvents(medication, generationStart, generationEnd, tzOffset)

  const keptKeys = new Set(keptEvents.map(eventKey))
  const newEvents = generated.filter((event) => !keptKeys.has(eventKey(event)))

  return [...otherMedicationEvents, ...keptEvents, ...newEvents]
}

export function regenerateAllDoseEvents(
  medications: Medication[],
  existingEvents: DoseEvent[],
  options?: DoseScheduleOptions,
): DoseEvent[] {
  return medications.reduce(
    (events, medication) => regenerateDoseEvents(medication, events, options),
    existingEvents,
  )
}

export function getTodayDoseEvents(
  events: DoseEvent[],
  medications: Medication[],
  options?: { referenceDate?: Date; tzOffsetMinutes?: number },
): Array<DoseEvent & { medication: Medication }> {
  const ref = options?.referenceDate ?? new Date()
  const tzOffset = options?.tzOffsetMinutes ?? 0
  const medicationMap = new Map(medications.map((m) => [m.id, m]))
  const dayStart = startOfDayWithOffset(ref, tzOffset)
  const dayEnd = endOfDayWithOffset(ref, tzOffset)

  const statusPriority: Record<DoseEvent['status'], number> = {
    taken: 4, skipped: 3, missed: 2, pending: 1,
  }

  const bySlot = new Map<string, DoseEvent & { medication: Medication }>()

  for (const event of events) {
    const scheduledAt = new Date(event.scheduledAt)
    if (scheduledAt < dayStart || scheduledAt > dayEnd) continue

    const medication = medicationMap.get(event.medicationId)
    if (!medication || !medication.active) continue

    const slotKey = doseEventKey(event.medicationId, event.scheduledAt)
    const current = bySlot.get(slotKey)
    const enriched = { ...event, medication }

    if (!current || statusPriority[event.status] > statusPriority[current.status]) {
      bySlot.set(slotKey, enriched)
    }
  }

  return [...bySlot.values()].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )
}

export function describeSchedule(medication: Medication): string {
  const { schedule } = medication
  if (schedule.type === 'as_needed') return 'Quando necessário'
  if (schedule.type === 'interval') return `A cada ${schedule.intervalHours ?? '?'} h`

  const times = schedule.times ?? []
  if (times.length === 0) return 'Sem horários'
  return times.join(', ')
}

export function describePeriod(medication: Medication): string {
  const start = formatDisplayDate(medication.period.startDate)
  if (!medication.period.endDate) return `Desde ${start}`

  const end = formatDisplayDate(medication.period.endDate)
  return `${start} → ${end}`
}
