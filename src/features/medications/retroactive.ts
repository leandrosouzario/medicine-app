import {
  addDays,
  parseLocalDate,
  startOfDayWithOffset,
} from '@/lib/dates'

export const MAX_RETROACTIVE_DAYS = 30

export const LATE_REGISTRATION_THRESHOLD_MS = 2 * 60 * 60 * 1000

export function isLateRegistration(scheduledAt: string, takenAt?: string): boolean {
  if (!takenAt) {
    return false
  }

  return (
    new Date(takenAt).getTime() - new Date(scheduledAt).getTime() >
    LATE_REGISTRATION_THRESHOLD_MS
  )
}

export function validateRetroactiveDate(
  dateKey: string,
  tzOffsetMinutes: number,
  now = new Date(),
): string | null {
  if (!dateKey) {
    return 'Informe a data.'
  }

  const todayStart = startOfDayWithOffset(now, tzOffsetMinutes)
  const selectedStart = startOfDayWithOffset(parseLocalDate(dateKey), tzOffsetMinutes)

  if (selectedStart > todayStart) {
    return 'A data não pode ser no futuro.'
  }

  const minStart = addDays(todayStart, -(MAX_RETROACTIVE_DAYS - 1))
  if (selectedStart < minStart) {
    return `Só é possível registrar doses dos últimos ${MAX_RETROACTIVE_DAYS} dias.`
  }

  return null
}

export function validateTakenAtNotFuture(takenAt: string, now = new Date()): string | null {
  if (new Date(takenAt) > now) {
    return 'O horário de tomada não pode ser no futuro.'
  }

  return null
}
