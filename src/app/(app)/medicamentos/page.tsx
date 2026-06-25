import { EmptyState } from '@/components/ui/EmptyState'
import { Pill, Plus } from 'lucide-react'
import Link from 'next/link'

export default function MedicamentosPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Seus medicamentos cadastrados neste dispositivo.
        </p>
        <Link
          href="/medicamentos/novo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
        >
          <Plus className="h-4 w-4" />
          Novo
        </Link>
      </div>

      <EmptyState
        icon={Pill}
        title="Nenhum medicamento cadastrado"
        description="Adicione nome, dose, horários e período de uso. Os dados ficam salvos apenas no seu dispositivo."
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
    </div>
  )
}
