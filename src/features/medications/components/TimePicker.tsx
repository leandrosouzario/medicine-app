'use client'

import { useCallback, useEffect, useRef } from 'react'

type TimePickerProps = {
  value: string // "HH:MM"
  onChange: (value: string) => void
}

const ITEM_HEIGHT = 44
const VISIBLE_COUNT = 3
const PADDING = Math.floor(VISIBLE_COUNT / 2) // 1 slot acima/abaixo para centralizar

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function parseTime(value: string): [number, number] {
  const [h = 0, m = 0] = value.split(':').map(Number)
  return [Math.max(0, Math.min(23, h)), Math.max(0, Math.min(59, m))]
}

type DrumColumnProps = {
  values: number[]
  selected: number
  onSelect: (value: number) => void
  label: string
}

function DrumColumn({ values, selected, onSelect, label }: DrumColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isUserScrollRef = useRef(false)
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'auto') => {
      const el = scrollRef.current
      if (!el) return
      const clamped = Math.max(0, Math.min(values.length - 1, index))
      el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior })
    },
    [values.length],
  )

  // Posiciona no valor inicial e quando muda externamente (ex.: outro horário)
  useEffect(() => {
    if (isUserScrollRef.current) return
    const index = values.indexOf(selected)
    if (index >= 0) scrollToIndex(index)
  }, [selected, values, scrollToIndex])

  function finalizeScroll() {
    const el = scrollRef.current
    if (!el) return

    const index = Math.round(el.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(values.length - 1, index))
    scrollToIndex(clamped, 'smooth')

    const newValue = values[clamped]
    if (newValue !== selected) {
      onSelect(newValue)
    }

    isUserScrollRef.current = false
  }

  function handleScroll() {
    isUserScrollRef.current = true
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current)
    scrollEndTimer.current = setTimeout(finalizeScroll, 120)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[72px]">
        {/* Faixa de seleção */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-lg border-y border-brand-200/80 bg-brand-50/70 dark:border-brand-800/80 dark:bg-brand-950/50"
          style={{ height: ITEM_HEIGHT }}
        />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            height: ITEM_HEIGHT * VISIBLE_COUNT,
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {Array.from({ length: PADDING }).map((_, i) => (
            <div key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT }} aria-hidden />
          ))}

          {values.map((v) => {
            const isSelected = v === selected
            return (
              <div
                key={v}
                style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'center' }}
                className={`flex items-center justify-center text-2xl font-semibold tabular-nums transition-all duration-150 ${
                  isSelected
                    ? 'scale-100 text-slate-900 dark:text-white'
                    : 'scale-90 text-slate-400 dark:text-slate-500'
                }`}
              >
                {pad(v)}
              </div>
            )
          })}

          {Array.from({ length: PADDING }).map((_, i) => (
            <div key={`pad-bottom-${i}`} style={{ height: ITEM_HEIGHT }} aria-hidden />
          ))}
        </div>
      </div>

      <span className="mt-1 text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
    </div>
  )
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
      <DrumColumn
        label="hora"
        values={HOURS}
        selected={hours}
        onSelect={setHours}
      />

      <span
        className="mb-5 text-2xl font-bold text-slate-400 dark:text-slate-500"
        aria-hidden
      >
        :
      </span>

      <DrumColumn
        label="min"
        values={MINUTES}
        selected={minutes}
        onSelect={setMinutes}
      />
    </div>
  )
}
