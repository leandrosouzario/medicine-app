'use client'

import { DrumColumn } from '@/components/ui/DrumColumn'
import { formatDisplayDate, parseLocalDate } from '@/lib/dates'

type DatePickerProps = {
  value: string // yyyy-mm-dd
  onChange: (value: string) => void
  minYear?: number
  maxYear?: number
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function parseDate(value: string): { year: number; month: number; day: number } {
  if (!value) {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
  }
  const d = parseLocalDate(value)
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
}

function toIsoDate(year: number, month: number, day: number): string {
  const maxDay = daysInMonth(year, month)
  const clampedDay = Math.min(day, maxDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
}

export function DatePicker({ value, onChange, minYear, maxYear }: DatePickerProps) {
  const now = new Date()
  const fromYear = minYear ?? now.getFullYear() - 1
  const toYear = maxYear ?? now.getFullYear() + 5
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const { year, month, day } = parseDate(value)
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)

  function update(part: Partial<{ year: number; month: number; day: number }>) {
    const next = { year, month, day, ...part }
    onChange(toIsoDate(next.year, next.month, next.day))
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-center gap-1"
        role="group"
        aria-label={`Data ${formatDisplayDate(value || toIsoDate(year, month, day))}`}
      >
        <DrumColumn
          label="dia"
          values={days}
          selected={Math.min(day, days.length)}
          onSelect={(d) => update({ day: d })}
          widthClass="w-[56px]"
        />
        <DrumColumn
          label="mês"
          values={months}
          selected={month}
          onSelect={(m) => update({ month: m })}
          widthClass="w-[56px]"
        />
        <DrumColumn
          label="ano"
          values={years}
          selected={year}
          onSelect={(y) => update({ year: y })}
          formatValue={(v) => String(v)}
          widthClass="w-[72px]"
        />
      </div>
      {value ? (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          {formatDisplayDate(value)}
        </p>
      ) : null}
    </div>
  )
}
