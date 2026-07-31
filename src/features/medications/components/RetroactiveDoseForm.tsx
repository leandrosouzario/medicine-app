'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, History } from 'lucide-react'
import { DatePicker } from '@/features/medications/components/DatePicker'
import { TimePicker } from '@/features/medications/components/TimePicker'
import { recordRetroactiveDose } from '@/features/medications/actions'
import { inputClassName, labelClassName, sectionClassName } from '@/features/medications/labels'
import type { Medication } from '@/lib/db/types'
import { addDays, formatLocalDate, todayLocalDate } from '@/lib/dates'
import { MAX_RETROACTIVE_DAYS } from '@/features/medications/retroactive'

type RetroactiveDoseFormProps = {
  medications: Medication[]
}

function defaultTimeForMedication(medication: Medication): string {
  return medication.schedule.times?.[0] ?? '12:00'
}

export function RetroactiveDoseForm({ medications }: RetroactiveDoseFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const initialMedication = medications[0]
  const [medicationId, setMedicationId] = useState(initialMedication?.id ?? '')
  const [date, setDate] = useState(todayLocalDate())
  const [time, setTime] = useState(
    initialMedication ? defaultTimeForMedication(initialMedication) : '12:00',
  )
  const [onSchedule, setOnSchedule] = useState(true)
  const [takenTime, setTakenTime] = useState(time)
  const [note, setNote] = useState('')

  const minDate = formatLocalDate(addDays(new Date(), -(MAX_RETROACTIVE_DAYS - 1)))
  const maxDate = todayLocalDate()

  function handleMedicationChange(nextId: string) {
    setMedicationId(nextId)
    const medication = medications.find((item) => item.id === nextId)
    if (medication) {
      const nextTime = defaultTimeForMedication(medication)
      setTime(nextTime)
      if (onSchedule) {
        setTakenTime(nextTime)
      }
    }
  }

  function handleScheduleTimeChange(nextTime: string) {
    setTime(nextTime)
    if (onSchedule) {
      setTakenTime(nextTime)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!medicationId) {
      setError('Selecione um medicamento.')
      return
    }

    startTransition(async () => {
      try {
        const result = await recordRetroactiveDose({
          medicationId,
          date,
          time,
          note,
          takenTime: onSchedule ? undefined : takenTime,
        })

        if (result?.error) {
          setError(result.error)
        }
      } catch {
        router.refresh()
      }
    })
  }

  if (medications.length === 0) {
    return (
      <div className="space-y-4">
        <Header />
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Cadastre um medicamento ativo antes de registrar doses passadas.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Header />

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Use para registrar uma dose de outro dia. O histórico e a aderência são recalculados
        com base no dia e horário informados.
      </p>

      <div className={sectionClassName}>
        <div>
          <label htmlFor="medication" className={labelClassName}>
            Medicamento *
          </label>
          <select
            id="medication"
            value={medicationId}
            onChange={(event) => handleMedicationChange(event.target.value)}
            className={inputClassName}
          >
            {medications.map((medication) => (
              <option key={medication.id} value={medication.id}>
                {medication.name}
                {medication.dosage ? ` · ${medication.dosage}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className={labelClassName}>Data *</p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 py-2 dark:border-slate-700 dark:bg-slate-800/50">
            <DatePicker
              value={date}
              onChange={setDate}
              minYear={new Date(minDate).getFullYear()}
              maxYear={new Date(maxDate).getFullYear()}
            />
          </div>
        </div>

        <div>
          <p className={labelClassName}>Horário agendado *</p>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            Em qual horário a dose estava prevista naquele dia.
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 py-2 dark:border-slate-700 dark:bg-slate-800/50">
            <TimePicker value={time} onChange={handleScheduleTimeChange} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={onSchedule}
            onChange={(event) => {
              setOnSchedule(event.target.checked)
              if (event.target.checked) {
                setTakenTime(time)
              }
            }}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Tomei no horário agendado
        </label>

        {!onSchedule ? (
          <div>
            <p className={labelClassName}>Quando tomou *</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-2 dark:border-slate-700 dark:bg-slate-800/50">
              <TimePicker value={takenTime} onChange={setTakenTime} />
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="note" className={labelClassName}>
            Nota
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Opcional"
            className={inputClassName}
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 dark:bg-brand-500 dark:hover:bg-brand-400"
      >
        <Check className="h-4 w-4" />
        {isPending ? 'Salvando…' : 'Registrar dose passada'}
      </button>
    </form>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/hoje"
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Registrar dose passada
        </h2>
      </div>
    </div>
  )
}
