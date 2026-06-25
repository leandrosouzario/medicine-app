import { EmptyState } from '@/components/ui/EmptyState'
import { CalendarDays, Plus } from 'lucide-react'
import Link from 'next/link'

export default function HojePage() {
  return (
    <EmptyState
      icon={CalendarDays}
      title="Nada agendado para hoje"
      description="Cadastre um medicamento com horários para ver o que tomar ao longo do dia."
      action={
        <Link
          href="/medicamentos"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
        >
          <Plus className="h-4 w-4" />
          Adicionar medicamento
        </Link>
      }
    />
  )
}
