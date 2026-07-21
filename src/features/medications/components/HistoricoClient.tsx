'use client'

import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  DOSE_STATUS_LABELS,
  DOSE_STATUS_STYLES,
} from '@/features/medications/dose-status'
import type { HistoryData, HistoryPeriod } from '@/features/medications/history'
import { formatTime } from '@/lib/dates'

type HistoricoClientProps = HistoryData

function AdherenceBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold ${accent ?? 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  )
}

export function HistoricoClient({
  period,
  rangeLabel,
  overall,
  byMedication,
  days,
}: HistoricoClientProps) {
  const periods: HistoryPeriod[] = [7, 30]

  if (overall.total === 0) {
    return (
      <div className="space-y-4">
        <PeriodToggle period={period} periods={periods} />
        <EmptyState
          icon={BarChart3}
          title="Sem histórico no período"
          description="Quando houver doses registradas ou agendadas, elas aparecerão aqui com o resumo de aderência."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <PeriodToggle period={period} periods={periods} />
        <p className="text-sm text-slate-500 dark:text-slate-400">{rangeLabel}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Resumo geral</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCard label="Tomadas" value={`${overall.takenPercent}%`} accent="text-emerald-700 dark:text-emerald-300" />
          <SummaryCard label="Total" value={overall.total} />
          <SummaryCard label="Puladas" value={overall.skipped} />
          <SummaryCard label="Perdidas" value={overall.missed} accent="text-red-700 dark:text-red-300" />
        </div>
        <AdherenceBar percent={overall.takenPercent} />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {overall.taken} tomadas de {overall.taken + overall.skipped + overall.missed} doses
          registradas (pendentes futuras não entram no percentual).
        </p>
      </section>

      {byMedication.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Por medicamento</h2>
          <ul className="space-y-3">
            {byMedication.map(({ medication, summary }) => (
              <li
                key={medication.id}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">{medication.name}</h3>
                    {medication.dosage ? (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {medication.dosage}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {summary.takenPercent}%
                  </span>
                </div>
                <div className="mt-3">
                  <AdherenceBar percent={summary.takenPercent} />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {summary.taken} tomadas · {summary.skipped} puladas · {summary.missed} perdidas
                  {summary.pending > 0 ? ` · ${summary.pending} pendentes` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Por dia</h2>
        <ul className="space-y-4">
          {days.map((day) => (
            <li key={day.dateKey}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {day.label}
              </h3>
              <ul className="space-y-2">
                {day.doses.map((dose) => (
                  <li
                    key={dose.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {dose.medication.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatTime(new Date(dose.scheduledAt))}
                        {dose.note ? ` · ${dose.note}` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${DOSE_STATUS_STYLES[dose.status]}`}
                    >
                      {DOSE_STATUS_LABELS[dose.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function PeriodToggle({
  period,
  periods,
}: {
  period: HistoryPeriod
  periods: HistoryPeriod[]
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
      {periods.map((value) => {
        const active = period === value
        return (
          <Link
            key={value}
            href={`/historico?period=${value}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active
                ? 'bg-brand-600 text-white dark:bg-brand-500'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {value} dias
          </Link>
        )
      })}
    </div>
  )
}
