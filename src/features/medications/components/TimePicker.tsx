'use client'

import { DrumColumn } from '@/components/ui/DrumColumn'

type TimePickerProps = {
  value: string // "HH:MM"
  onChange: (value: string) => void
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function parseTime(value: string): [number, number] {
  const [h = 0, m = 0] = value.split(':').map(Number)
  return [Math.max(0, Math.min(23, h)), Math.max(0, Math.min(59, m))]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [hours, minutes] = parseTime(value)

  function setHours(h: number) {
    onChange(`${pad(h)}:${pad(minutes)}`)
  }

  function setMinutes(m: number) {
    onChange(`${pad(hours)}:${pad(m)}`)
  }

  return (
    <div
      className="flex items-center justify-center gap-1"
      role="group"
      aria-label={`Horário ${pad(hours)}:${pad(minutes)}`}
    >
      <DrumColumn label="hora" values={HOURS} selected={hours} onSelect={setHours} />

      <span
        className="mb-5 text-2xl font-bold text-slate-400 dark:text-slate-500"
        aria-hidden
      >
        :
      </span>

      <DrumColumn label="min" values={MINUTES} selected={minutes} onSelect={setMinutes} />
    </div>
  )
}
