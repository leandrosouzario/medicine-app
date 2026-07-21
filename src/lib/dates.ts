export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Formato interno / ISO parcial: yyyy-mm-dd */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Formato de exibição pt-BR: dd/mm/yyyy */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Midnight local time expressed as a UTC timestamp.
 * tzOffsetMinutes = new Date().getTimezoneOffset() on the client.
 * Ex.: UTC-3 → 180; UTC+9 → -540.
 */
export function startOfDayWithOffset(date: Date, tzOffsetMinutes: number): Date {
  // Shift by offset to get "local epoch" so we can extract the local date.
  const localEpoch = date.getTime() - tzOffsetMinutes * 60_000
  const d = new Date(localEpoch)

  // Midnight in local time as a UTC timestamp:
  //   Date.UTC(..., 0,0,0,0) = midnight UTC on that calendar date
  //   + tzOffsetMinutes * 60_000 = convert local midnight → UTC
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0) +
      tzOffsetMinutes * 60_000,
  )
}

export function endOfDayWithOffset(date: Date, tzOffsetMinutes: number): Date {
  const start = startOfDayWithOffset(date, tzOffsetMinutes)
  return new Date(start.getTime() + 86_400_000 - 1) // +24h - 1ms
}

/**
 * Applies a "HH:MM" local-time string to a date, returning the correct UTC instant.
 * Uses tzOffsetMinutes so the result represents the local hour in UTC.
 */
export function parseTimeOnDateWithOffset(
  date: Date,
  time: string,
  tzOffsetMinutes: number,
): Date {
  const [hours, minutes] = time.split(':').map(Number)

  // Determine local calendar date at this moment
  const localEpoch = date.getTime() - tzOffsetMinutes * 60_000
  const d = new Date(localEpoch)

  // Build the local datetime as UTC, then shift by offset
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours, minutes, 0, 0) +
      tzOffsetMinutes * 60_000,
  )
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Only used client-side where new Date() already reflects local tz. */
export function parseTimeOnDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

export function todayLocalDate(): string {
  return formatLocalDate(new Date())
}

/** Chave yyyy-mm-dd no fuso local do usuário (via offset do browser). */
export function localDateKeyFromInstant(date: Date, tzOffsetMinutes: number): string {
  const localEpoch = date.getTime() - tzOffsetMinutes * 60_000
  const d = new Date(localEpoch)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
