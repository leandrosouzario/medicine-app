import type { Medication, MedicationForm, MedicationSchedule, ScheduleType } from '@/lib/db/types'
import { todayLocalDate } from '@/lib/dates'

export type MedicationInput = {
  name: string
  dosage?: string
  form?: MedicationForm
  instructions?: string
  notes?: string
  schedule: MedicationSchedule
  startDate: string
  endDate?: string
  active: boolean
  trackStock: boolean
  stockQuantity?: number
  quantityPerDose: number
  refillThreshold: number
}

export function defaultMedicationInput(): MedicationInput {
  return {
    name: '',
    dosage: '',
    form: 'pill',
    instructions: '',
    notes: '',
    schedule: {
      type: 'fixed_times',
      times: ['08:00'],
    },
    startDate: todayLocalDate(),
    endDate: '',
    active: true,
    trackStock: false,
    stockQuantity: 30,
    quantityPerDose: 1,
    refillThreshold: 7,
  }
}

export function medicationToInput(medication: Medication): MedicationInput {
  return {
    name: medication.name,
    dosage: medication.dosage ?? '',
    form: medication.form ?? 'pill',
    instructions: medication.instructions ?? '',
    notes: medication.notes ?? '',
    schedule: medication.schedule,
    startDate: medication.period.startDate,
    endDate: medication.period.endDate ?? '',
    active: medication.active,
    trackStock: medication.stockQuantity != null,
    stockQuantity: medication.stockQuantity ?? 30,
    quantityPerDose: medication.quantityPerDose,
    refillThreshold: medication.refillThreshold,
  }
}

export function validateMedicationInput(input: MedicationInput): string | null {
  if (!input.name.trim()) {
    return 'Informe o nome do medicamento.'
  }

  if (!input.startDate) {
    return 'Informe a data de início.'
  }

  if (input.endDate && input.endDate < input.startDate) {
    return 'A data de fim deve ser igual ou posterior ao início.'
  }

  const { schedule } = input

  if (schedule.type === 'fixed_times') {
    const times = schedule.times ?? []
    if (times.length === 0 || times.some((time) => !time)) {
      return 'Informe ao menos um horário.'
    }
  }

  if (schedule.type === 'interval') {
    const hours = schedule.intervalHours ?? 0
    if (hours < 1 || hours > 48) {
      return 'Informe um intervalo entre 1 e 48 horas.'
    }
    const startTime = schedule.times?.[0]
    if (!startTime) {
      return 'Informe o horário da primeira dose.'
    }
  }

  if (input.trackStock) {
    const stock = input.stockQuantity ?? 0
    if (stock < 0) {
      return 'A quantidade em estoque não pode ser negativa.'
    }
    if (input.quantityPerDose < 1) {
      return 'Informe ao menos 1 unidade por dose.'
    }
    if (input.refillThreshold < 0) {
      return 'O limite de reposição não pode ser negativo.'
    }
  }

  return null
}

export function normalizeScheduleForType(
  type: ScheduleType,
  current: MedicationSchedule,
): MedicationSchedule {
  const daysOfWeek = current.daysOfWeek

  if (type === 'as_needed') {
    return { type: 'as_needed', daysOfWeek }
  }

  if (type === 'interval') {
    return {
      type: 'interval',
      daysOfWeek,
      intervalHours: current.intervalHours ?? 8,
      times: [current.times?.[0] ?? '08:00'],
    }
  }

  return {
    type: 'fixed_times',
    daysOfWeek,
    times: current.times?.length ? current.times : ['08:00'],
  }
}

export function buildMedicationFromInput(
  input: MedicationInput,
  existing?: Medication,
): Medication {
  const now = new Date().toISOString()

  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name.trim(),
    dosage: input.dosage?.trim() || undefined,
    form: input.form,
    instructions: input.instructions?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    schedule: input.schedule,
    period: {
      startDate: input.startDate,
      endDate: input.endDate || undefined,
    },
    active: input.active,
    stockQuantity: input.trackStock ? (input.stockQuantity ?? 0) : null,
    quantityPerDose: input.quantityPerDose,
    refillThreshold: input.refillThreshold,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}
