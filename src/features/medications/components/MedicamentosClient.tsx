'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Pill, Plus, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { deleteMedication } from '@/features/medications/actions'
import {
  describePeriod,
  describeSchedule,
} from '@/features/medications/dose-schedule'
import { formatStock, isLowStock } from '@/features/medications/stock'
import type { Medication } from '@/lib/db/types'

type MedicamentosClientProps = {
  medications: Medication[]
}

export function MedicamentosClient({ medications }: MedicamentosClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete(medication: Medication) {
    const confirmed = window.confirm(
      `Excluir "${medication.name}"? As doses associadas também serão removidas.`,
    )

    if (!confirmed) {
      return
    }

    startTransition(async () => {
      const result = await deleteMedication(medication.id)
      if (result.error) {
        window.alert(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {medications.length === 0
            ? 'Seus medicamentos sincronizados na conta.'
            : `${medications.length} medicamento${medications.length === 1 ? '' : 's'} na sua conta.`}
        </p>
        <Link
          href="/medicamentos/novo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
        >
          <Plus className="h-4 w-4" />
          Novo
        </Link>
      </div>

      {medications.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="Nenhum medicamento cadastrado"
          description="Adicione nome, dose, horários e período de uso. Os dados ficam salvos na sua conta."
          action={
            <Link
              href="/medicamentos/novo"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-900"
            >
              <Plus className="h-4 w-4" />
              Cadastrar primeiro medicamento
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {medications.map((medication) => (
            <li
              key={medication.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                      {medication.name}
                    </h3>
                    {!medication.active ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Inativo
                      </span>
                    ) : null}
                    {isLowStock(medication) ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        Estoque baixo
                      </span>
                    ) : null}
                  </div>
                  {medication.dosage ? (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {medication.dosage}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {describeSchedule(medication)} · {describePeriod(medication)}
                    {formatStock(medication) ? ` · ${formatStock(medication)}` : ''}
                  </p>
                  {medication.instructions ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {medication.instructions}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/medicamentos/${medication.id}`}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(medication)}
                    disabled={isPending}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
