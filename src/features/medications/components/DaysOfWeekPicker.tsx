'use client'

import { DAY_LABELS_SHORT } from '@/features/medications/labels'

const DAY_OPTIONS = DAY_LABELS_SHORT.map((short, value) => ({
  value,
  label: short.charAt(0).toUpperCase() + short.slice(1),
}))

type DaysOfWeekPickerProps = {
  value?: number[]
  onChange: (days: number[] | undefined) => void
}

export function DaysOfWeekPicker({ value, onChange }: DaysOfWeekPickerProps) {
  const selected = value ?? []

  function toggle(day: number) {
    const set = new Set(selected)
    if (set.has(day)) {
      set.delete(day)
    } else {
      set.add(day)
    }

    const next = [...set].sort((a, b) => a - b)
    if (next.length === 0 || next.length === 7) {
      onChange(undefined)
      return
    }

    onChange(next)
  }

  const isAllDays = selected.length === 0

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {isAllDays ? 'Todos os dias da semana' : 'Dias selecionados'}
      </p>
      <div className="flex flex-wrap gap-2">
        {DAY_OPTIONS.map(({ value: day, label }) => {
          const active = isAllDays || selected.includes(day)
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              className={`min-w-[2.75rem] rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-brand-600 text-white dark:bg-brand-500'
                  : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
