'use client'

import { useCallback, useEffect, useRef } from 'react'

export const DRUM_ITEM_HEIGHT = 44
export const DRUM_VISIBLE_COUNT = 3
const PADDING = Math.floor(DRUM_VISIBLE_COUNT / 2)

type DrumColumnProps = {
  values: number[]
  selected: number
  onSelect: (value: number) => void
  label: string
  formatValue?: (value: number) => string
  widthClass?: string
}

export function DrumColumn({
  values,
  selected,
  onSelect,
  label,
  formatValue = (v) => String(v).padStart(2, '0'),
  widthClass = 'w-[72px]',
}: DrumColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isUserScrollRef = useRef(false)
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'auto') => {
      const el = scrollRef.current
      if (!el) return
      const clamped = Math.max(0, Math.min(values.length - 1, index))
      el.scrollTo({ top: clamped * DRUM_ITEM_HEIGHT, behavior })
    },
    [values.length],
  )

  useEffect(() => {
    if (isUserScrollRef.current) return
    const index = values.indexOf(selected)
    if (index >= 0) scrollToIndex(index)
  }, [selected, values, scrollToIndex])

  function finalizeScroll() {
    const el = scrollRef.current
    if (!el) return

    const index = Math.round(el.scrollTop / DRUM_ITEM_HEIGHT)
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
      <div className={`relative ${widthClass}`}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-lg border-y border-brand-200/80 bg-brand-50/70 dark:border-brand-800/80 dark:bg-brand-950/50"
          style={{ height: DRUM_ITEM_HEIGHT }}
        />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            height: DRUM_ITEM_HEIGHT * DRUM_VISIBLE_COUNT,
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {Array.from({ length: PADDING }).map((_, i) => (
            <div key={`pad-top-${i}`} style={{ height: DRUM_ITEM_HEIGHT }} aria-hidden />
          ))}

          {values.map((v) => {
            const isSelected = v === selected
            return (
              <div
                key={v}
                style={{ height: DRUM_ITEM_HEIGHT, scrollSnapAlign: 'center' }}
                className={`flex items-center justify-center text-xl font-semibold tabular-nums transition-all duration-150 sm:text-2xl ${
                  isSelected
                    ? 'scale-100 text-slate-900 dark:text-white'
                    : 'scale-90 text-slate-400 dark:text-slate-500'
                }`}
              >
                {formatValue(v)}
              </div>
            )
          })}

          {Array.from({ length: PADDING }).map((_, i) => (
            <div key={`pad-bottom-${i}`} style={{ height: DRUM_ITEM_HEIGHT }} aria-hidden />
          ))}
        </div>
      </div>

      <span className="mt-1 text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
    </div>
  )
}
