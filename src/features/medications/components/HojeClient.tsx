'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Check, Plus, SkipForward } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { updateDoseEventStatus } from '@/features/medications/actions'
import type { DoseEvent, Medication } from '@/lib/db/types'
import { formatTime } from '@/lib/dates'

type TodayDose = DoseEvent & { medication: Medication }

type HojeClientProps = {
  doses: TodayDose[]
}

const STATUS_LABELS: Record<DoseEvent['status'], string> = {
  pending: 'Pendente',
  taken: 'Tomado',
  skipped: 'Pulado',
  missed: 'Perdido',
}

const STATUS_STYLES: Record<DoseEvent['status'], string> = {
  pending: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  taken: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  skipped: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  missed: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
}

export function HojeClient({ doses }: HojeClientProps) {
  const router = useRouter()
  const [items, setItems] = useState(doses)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setItems(doses)
  }, [doses])

  function handleStatusChange(eventId: string, status: DoseEvent['status']) {
    const previousItems = items

    setPendingId(eventId)
    setItems((current) =>
      current.map((dose) =>
        dose.id === eventId
          ? {
              ...dose,
              status,
              takenAt: status === 'taken' ? new Date().toISOString() : undefined,
            }
          : dose,
      ),
    )

    startTransition(async () => {
      const result = await updateDoseEventStatus(eventId, status)
      setPendingId(null)

      if (result.error) {
        setItems(previousItems)
        window.alert(result.error)
        return
      }

      router.refresh()
    })
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nada agendado para hoje"
        description="Cadastre um medicamento com horários para ver o que tomar ao longo do dia."
        action={
          <Link
            href="/medicamentos/novo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            Adicionar medicamento
          </Link>
        }
      />
    )
  }

  const pendingCount = items.filter((dose) => dose.status === 'pending').length

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {pendingCount === 0
          ? 'Todas as doses de hoje foram registradas.'
          : `${pendingCount} dose${pendingCount === 1 ? '' : 's'} pendente${pendingCount === 1 ? '' : 's'} hoje.`}
      </p>

      <ul className="space-y-3">
        {items.map((dose) => {
          const isUpdating = pendingId === dose.id

          return (
            <li
              key={dose.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatTime(new Date(dose.scheduledAt))}
                  </p>
                  <h3 className="mt-1 font-medium text-slate-900 dark:text-white">
                    {dose.medication.name}
                  </h3>
                  {dose.medication.dosage ? (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {dose.medication.dosage}
                    </p>
                  ) : null}
                  {dose.medication.instructions ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {dose.medication.instructions}
                    </p>
                  ) : null}
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[dose.status]}`}
                >
                  {STATUS_LABELS[dose.status]}
                </span>
              </div>

              {dose.status === 'pending' ? (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(dose.id, 'taken')}
                    disabled={isUpdating}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                  >
                    <Check className="h-4 w-4" />
                    {isUpdating ? 'Salvando…' : 'Tomado'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(dose.id, 'skipped')}
                    disabled={isUpdating}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <SkipForward className="h-4 w-4" />
                    Pular
                  </button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
