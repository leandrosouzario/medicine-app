import type { DoseEvent } from '@/lib/db/types'

export const DOSE_STATUS_LABELS: Record<DoseEvent['status'], string> = {
  pending: 'Pendente',
  taken: 'Tomado',
  skipped: 'Pulado',
  missed: 'Perdido',
}

export const DOSE_STATUS_STYLES: Record<DoseEvent['status'], string> = {
  pending: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  taken: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  skipped: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  missed: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
}

export type AdherenceSummary = {
  taken: number
  skipped: number
  missed: number
  pending: number
  total: number
  takenPercent: number
}

export function computeAdherenceSummary(events: DoseEvent[]): AdherenceSummary {
  const taken = events.filter((e) => e.status === 'taken').length
  const skipped = events.filter((e) => e.status === 'skipped').length
  const missed = events.filter((e) => e.status === 'missed').length
  const pending = events.filter((e) => e.status === 'pending').length
  const total = events.length
  const resolved = taken + skipped + missed
  const takenPercent = resolved > 0 ? Math.round((taken / resolved) * 100) : 0

  return { taken, skipped, missed, pending, total, takenPercent }
}
