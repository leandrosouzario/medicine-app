import Link from 'next/link'

export default function NovoMedicamentoPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Novo medicamento
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Formulário em construção (Sprint 1). Campos previstos: nome, dose,
        horários, período e observações.
      </p>
      <Link
        href="/medicamentos"
        className="mt-6 inline-flex text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
      >
        ← Voltar
      </Link>
    </div>
  )
}
