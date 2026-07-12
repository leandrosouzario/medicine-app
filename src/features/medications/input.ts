import type { Medication, MedicationForm, MedicationSchedule } from '@/lib/db/types'
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
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}
