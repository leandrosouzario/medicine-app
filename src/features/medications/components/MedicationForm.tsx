'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { DatePicker } from '@/features/medications/components/DatePicker'
import { DaysOfWeekPicker } from '@/features/medications/components/DaysOfWeekPicker'
import { TimePicker } from '@/features/medications/components/TimePicker'
import {
  defaultMedicationInput,
  normalizeScheduleForType,
  type MedicationInput,
  validateMedicationInput,
} from '@/features/medications/input'
import {
  createMedication,
  updateMedication,
} from '@/features/medications/actions'
import {
  FORM_LABELS,
  inputClassName,
  labelClassName,
  SCHEDULE_TYPE_LABELS,
  sectionClassName,
} from '@/features/medications/labels'
import type { MedicationForm, ScheduleType } from '@/lib/db/types'

type MedicationFormProps = {
  mode: 'create' | 'edit'
  medicationId?: string
  initialValues?: MedicationInput
}

export function MedicationForm({
  mode,
  medicationId,
  initialValues = defaultMedicationInput(),
}: MedicationFormProps) {
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<MedicationInput>(initialValues)
  const [error, setError] = useState<string | null>(null)

  const scheduleType = values.schedule.type
  const times = values.schedule.times ?? ['08:00']

  function updateField<K extends keyof MedicationInput>(key: K, value: MedicationInput[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function updateSchedule(patch: Partial<MedicationInput['schedule']>) {
    updateField('schedule', { ...values.schedule, ...patch })
  }

  function setScheduleType(type: ScheduleType) {
    updateField('schedule', normalizeScheduleForType(type, values.schedule))
  }

  function updateTime(index: number, time: string) {
    const nextTimes = [...times]
    nextTimes[index] = time
    updateSchedule({ times: nextTimes })
  }

  function addTime() {
    updateSchedule({ times: [...times, '12:00'] })
  }

  function removeTime(index: number) {
    if (times.length <= 1) return
    updateSchedule({ times: times.filter((_, i) => i !== index) })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const validationError = validateMedicationInput(values)
    if (validationError) {
      setError(validationError)
      return
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          const result = await createMedication(values)
          if (result?.error) setError(result.error)
          return
        }

        if (!medicationId) {
          setError('Medicamento não encontrado.')
          return
        }

        const result = await updateMedication(medicationId, values)
        if (result?.error) setError(result.error)
      } catch {
        setError('Não foi possível salvar. Tente novamente.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/medicamentos"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {mode === 'create' ? 'Novo medicamento' : 'Editar medicamento'}
        </h2>
      </div>

      <div className={sectionClassName}>
        <div>
          <label htmlFor="name" className={labelClassName}>
            Nome *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            className={inputClassName}
            placeholder="Ex.: Paracetamol"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dosage" className={labelClassName}>
              Dose
            </label>
            <input
              id="dosage"
              name="dosage"
              type="text"
              value={values.dosage ?? ''}
              onChange={(event) => updateField('dosage', event.target.value)}
              className={inputClassName}
              placeholder="Ex.: 500 mg"
            />
          </div>

          <div>
            <label htmlFor="form" className={labelClassName}>
              Forma
            </label>
            <select
              id="form"
              name="form"
              value={values.form ?? 'pill'}
              onChange={(event) =>
                updateField('form', event.target.value as MedicationForm)
              }
              className={inputClassName}
            >
              {Object.entries(FORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="instructions" className={labelClassName}>
            Como tomar
          </label>
          <textarea
            id="instructions"
            name="instructions"
            rows={2}
            value={values.instructions ?? ''}
            onChange={(event) => updateField('instructions', event.target.value)}
            className={inputClassName}
            placeholder="Ex.: Tomar após as refeições"
          />
        </div>
      </div>

      <div className={sectionClassName}>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Tipo de agenda
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Como as doses serão geradas automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(Object.keys(SCHEDULE_TYPE_LABELS) as ScheduleType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setScheduleType(type)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                scheduleType === type
                  ? 'bg-brand-600 text-white dark:bg-brand-500'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {SCHEDULE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {scheduleType !== 'as_needed' ? (
          <DaysOfWeekPicker
            value={values.schedule.daysOfWeek}
            onChange={(days) => updateSchedule({ daysOfWeek: days })}
          />
        ) : null}

        {scheduleType === 'fixed_times' ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Horários fixos por dia durante o período de uso.
              </p>
              <button
                type="button"
                onClick={addTime}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950"
              >
                <Plus className="h-4 w-4" />
                Horário
              </button>
            </div>

            <div className="space-y-4">
              {times.map((time, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                    <TimePicker value={time} onChange={(v) => updateTime(index, v)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTime(index)}
                    disabled={times.length <= 1}
                    className="mt-3 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/30"
                    title="Remover horário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {scheduleType === 'interval' ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="intervalHours" className={labelClassName}>
                Intervalo (horas) *
              </label>
              <input
                id="intervalHours"
                type="number"
                min={1}
                max={48}
                value={values.schedule.intervalHours ?? 8}
                onChange={(event) =>
                  updateSchedule({ intervalHours: Number(event.target.value) })
                }
                className={inputClassName}
              />
            </div>

            <div>
              <p className={labelClassName}>Primeira dose do ciclo *</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                <TimePicker
                  value={times[0] ?? '08:00'}
                  onChange={(time) => updateSchedule({ times: [time] })}
                />
              </div>
            </div>
          </div>
        ) : null}

        {scheduleType === 'as_needed' ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
            Sem doses automáticas. O medicamento fica registrado para consulta; registre manualmente
            quando tomar (em breve).
          </p>
        ) : null}
      </div>

      <div className={sectionClassName}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className={labelClassName}>Início *</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-2 dark:border-slate-700 dark:bg-slate-800/50">
              <DatePicker
                value={values.startDate}
                onChange={(startDate) => updateField('startDate', startDate)}
              />
            </div>
          </div>

          <div>
            <p className={labelClassName}>Fim</p>
            {values.endDate ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                  <DatePicker
                    value={values.endDate}
                    onChange={(endDate) => updateField('endDate', endDate)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => updateField('endDate', '')}
                  className="mt-2 text-xs font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400"
                >
                  Remover data de fim
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => updateField('endDate', values.startDate)}
                className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Adicionar data de fim
              </button>
            )}
            {!values.endDate ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Uso contínuo sem data de término.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClassName}>
            Observações
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            value={values.notes ?? ''}
            onChange={(event) => updateField('notes', event.target.value)}
            className={inputClassName}
            placeholder="Anotações adicionais"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(event) => updateField('active', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Medicamento ativo
        </label>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 dark:bg-brand-500 dark:hover:bg-brand-400"
      >
        {isPending ? 'Salvando…' : mode === 'create' ? 'Cadastrar medicamento' : 'Salvar alterações'}
      </button>
    </form>
  )
}
