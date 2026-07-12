import type { MedicationForm } from '@/lib/db/types'

export const FORM_LABELS: Record<MedicationForm, string> = {
  pill: 'Comprimido / cápsula',
  liquid: 'Líquido',
  injection: 'Injeção',
  other: 'Outro',
}

export const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'

export const labelClassName = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300'

export const sectionClassName =
  'rounded-xl border border-slate-200 bg-white p-5 space-y-4 dark:border-slate-800 dark:bg-slate-900'
