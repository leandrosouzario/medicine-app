'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlarmClock, CalendarDays, Check, History, Plus, SkipForward } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  recordManualDose,
  snoozeDoseEvent,
  updateDoseEventStatus,
} from '@/features/medications/actions'
import {
  DOSE_STATUS_LABELS,
  DOSE_STATUS_STYLES,
} from '@/features/medications/dose-status'
import { formatStock, isLowStock } from '@/features/medications/stock'
import { SNOOZE_MINUTES, type SnoozeMinutes } from '@/features/medications/snooze'
import type { DoseEvent, Medication } from '@/lib/db/types'
import { formatTime } from '@/lib/dates'

type TodayDose = DoseEvent & { medication: Medication }

type HojeClientProps = {
  doses: TodayDose[]
  asNeededMedications: Medication[]
  extraDoseMedications: Medication[]
}

export function HojeClient({
  doses,
  asNeededMedications,
  extraDoseMedications,
}: HojeClientProps) {
  const router = useRouter()
  const [items, setItems] = useState(doses)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [manualNotes, setManualNotes] = useState<Record<string, string>>({})
  const [extraMedicationId, setExtraMedicationId] = useState('')
  const [extraNote, setExtraNote] = useState('')
  const [, startTransition] = useTransition()

  useEffect(() => {
    setItems(doses)
    setNotes((current) => {
      const next = { ...current }
      for (const dose of doses) {
        if (dose.note && next[dose.id] === undefined) {
          next[dose.id] = dose.note
        }
      }
      return next
    })
  }, [doses])

  useEffect(() => {
    if (!extraMedicationId && extraDoseMedications.length > 0) {
      setExtraMedicationId(extraDoseMedications[0].id)
    }
  }, [extraDoseMedications, extraMedicationId])

  function handleStatusChange(eventId: string, status: DoseEvent['status']) {
    const previousItems = items
    const note = notes[eventId]?.trim()

    setPendingId(eventId)
    setItems((current) =>
      current.map((dose) =>
        dose.id === eventId
          ? {
              ...dose,
              status,
              note: note || dose.note,
              takenAt: status === 'taken' ? new Date().toISOString() : undefined,
            }
          : dose,
      ),
    )

    startTransition(async () => {
      const result = await updateDoseEventStatus(eventId, status, note)
      setPendingId(null)

      if (result.error) {
        setItems(previousItems)
        window.alert(result.error)
        return
      }

      router.refresh()
    })
  }

  function handleSnooze(eventId: string, minutes: SnoozeMinutes) {
    const previousItems = items

    setPendingId(eventId)
    setItems((current) =>
      current.map((dose) =>
        dose.id === eventId
          ? {
              ...dose,
              scheduledAt: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
            }
          : dose,
      ),
    )

    startTransition(async () => {
      const result = await snoozeDoseEvent(eventId, minutes)
      setPendingId(null)

      if (result.error) {
        setItems(previousItems)
        window.alert(result.error)
        return
      }

      router.refresh()
    })
  }

  function handleManualDose(medicationId: string, note: string, onSuccess: () => void) {
    setPendingId(`manual-${medicationId}`)
    startTransition(async () => {
      const result = await recordManualDose(medicationId, note)
      setPendingId(null)

      if (result.error) {
        window.alert(result.error)
        return
      }

      onSuccess()
      router.refresh()
    })
  }

  const hasScheduledContent =
    items.length > 0 || asNeededMedications.length > 0 || extraDoseMedications.length > 0

  if (!hasScheduledContent) {
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
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href="/registrar-passado"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
        >
          <History className="h-4 w-4" />
          Registrar dose de outro dia
        </Link>
      </div>

      {items.length > 0 ? (
        <section className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pendingCount === 0
              ? 'Todas as doses de hoje foram registradas.'
              : `${pendingCount} dose${pendingCount === 1 ? '' : 's'} pendente${pendingCount === 1 ? '' : 's'} hoje.`}
          </p>

          <ul className="space-y-3">
            {items.map((dose) => (
              <DoseCard
                key={dose.id}
                dose={dose}
                note={notes[dose.id] ?? dose.note ?? ''}
                isUpdating={pendingId === dose.id}
                onNoteChange={(value) =>
                  setNotes((current) => ({ ...current, [dose.id]: value }))
                }
                onStatusChange={handleStatusChange}
                onSnooze={handleSnooze}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {asNeededMedications.length > 0 ? (
        <ManualDoseSection
          title="Quando necessário"
          description="Registre quando tomar medicamentos de uso sob demanda."
          medications={asNeededMedications}
          pendingId={pendingId}
          notes={manualNotes}
          onNoteChange={(medicationId, value) =>
            setManualNotes((current) => ({ ...current, [medicationId]: value }))
          }
          onRecord={(medicationId) =>
            handleManualDose(medicationId, manualNotes[medicationId] ?? '', () =>
              setManualNotes((current) => ({ ...current, [medicationId]: '' })),
            )
          }
        />
      ) : null}

      {extraDoseMedications.length > 0 ? (
        <section className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Dose extra</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Registre uma dose fora do horário agendado.
            </p>
          </div>

          <div>
            <label htmlFor="extra-medication" className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Medicamento
            </label>
            <select
              id="extra-medication"
              value={extraMedicationId}
              onChange={(event) => setExtraMedicationId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {extraDoseMedications.map((medication) => (
                <option key={medication.id} value={medication.id}>
                  {medication.name}
                  {medication.dosage ? ` · ${medication.dosage}` : ''}
                </option>
              ))}
            </select>
          </div>

          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Nota
            <input
              type="text"
              value={extraNote}
              onChange={(event) => setExtraNote(event.target.value)}
              placeholder="Opcional — ex.: dor de cabeça"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <button
            type="button"
            disabled={!extraMedicationId || pendingId === `manual-${extraMedicationId}`}
            onClick={() =>
              handleManualDose(extraMedicationId, extraNote, () => setExtraNote(''))
            }
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            <Check className="h-4 w-4" />
            {pendingId === `manual-${extraMedicationId}` ? 'Salvando…' : 'Registrar dose extra'}
          </button>
        </section>
      ) : null}
    </div>
  )
}

function DoseCard({
  dose,
  note,
  isUpdating,
  onNoteChange,
  onStatusChange,
  onSnooze,
}: {
  dose: TodayDose
  note: string
  isUpdating: boolean
  onNoteChange: (value: string) => void
  onStatusChange: (eventId: string, status: DoseEvent['status']) => void
  onSnooze: (eventId: string, minutes: SnoozeMinutes) => void
}) {
  const stockLabel = formatStock(dose.medication)
  const lowStock = isLowStock(dose.medication)

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
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
          {stockLabel ? (
            <p
              className={`mt-1 text-xs font-medium ${
                lowStock
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Estoque: {stockLabel}
              {lowStock ? ' · reposição' : ''}
            </p>
          ) : null}
          {dose.medication.instructions ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {dose.medication.instructions}
            </p>
          ) : null}
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${DOSE_STATUS_STYLES[dose.status]}`}
        >
          {DOSE_STATUS_LABELS[dose.status]}
        </span>
      </div>

      <label className="mt-3 block text-xs font-medium text-slate-600 dark:text-slate-300">
        Nota
        <input
          type="text"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Opcional — ex.: tomado após café"
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </label>

      {dose.status === 'pending' ? (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onStatusChange(dose.id, 'taken')}
              disabled={isUpdating}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              <Check className="h-4 w-4" />
              {isUpdating ? 'Salvando…' : 'Tomado'}
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(dose.id, 'skipped')}
              disabled={isUpdating}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <SkipForward className="h-4 w-4" />
              Pular
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {SNOOZE_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => onSnooze(dose.id, minutes)}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <AlarmClock className="h-3.5 w-3.5" />
                {minutes} min
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </li>
  )
}

function ManualDoseSection({
  title,
  description,
  medications,
  pendingId,
  notes,
  onNoteChange,
  onRecord,
}: {
  title: string
  description: string
  medications: Medication[]
  pendingId: string | null
  notes: Record<string, string>
  onNoteChange: (medicationId: string, value: string) => void
  onRecord: (medicationId: string) => void
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>

      <ul className="space-y-3">
        {medications.map((medication) => {
          const stockLabel = formatStock(medication)
          const lowStock = isLowStock(medication)
          const isUpdating = pendingId === `manual-${medication.id}`

          return (
            <li
              key={medication.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">{medication.name}</h3>
                {medication.dosage ? (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {medication.dosage}
                  </p>
                ) : null}
                {stockLabel ? (
                  <p
                    className={`mt-1 text-xs font-medium ${
                      lowStock
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Estoque: {stockLabel}
                    {lowStock ? ' · reposição' : ''}
                  </p>
                ) : null}
              </div>

              <label className="mt-3 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Nota
                <input
                  type="text"
                  value={notes[medication.id] ?? ''}
                  onChange={(event) => onNoteChange(medication.id, event.target.value)}
                  placeholder="Opcional"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>

              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onRecord(medication.id)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                <Check className="h-4 w-4" />
                {isUpdating ? 'Salvando…' : 'Registrar tomada'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
