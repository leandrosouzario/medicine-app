import Link from 'next/link'
import { MedicationForm } from '@/features/medications/components/MedicationForm'
import { medicationToInput } from '@/features/medications/input'
import { getMedicationById } from '@/features/medications/queries'

type MedicationEditPageProps = {
  params: Promise<{ id: string }>
}

export default async function MedicationEditPage({ params }: MedicationEditPageProps) {
  const { id } = await params
  const medication = await getMedicationById(id)

  if (!medication) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Medicamento não encontrado
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Este registro não existe ou não pertence à sua conta.
        </p>
        <Link
          href="/medicamentos"
          className="mt-6 inline-flex text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
        >
          ← Voltar para medicamentos
        </Link>
      </div>
    )
  }

  return (
    <MedicationForm
      mode="edit"
      medicationId={id}
      initialValues={medicationToInput(medication)}
    />
  )
}
