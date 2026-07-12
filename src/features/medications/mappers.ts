import type { DoseEvent, Medication } from '@/lib/db/types'
import type {
  MedDoseEventInsert,
  MedDoseEventRow,
  MedMedicationInsert,
  MedMedicationRow,
  MedMedicationUpdate,
} from '@/types/database'

export function medicationFromRow(row: MedMedicationRow): Medication {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage ?? undefined,
    form: row.form ?? undefined,
    instructions: row.instructions ?? undefined,
    notes: row.notes ?? undefined,
    schedule: row.schedule,
    period: row.period,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function doseEventFromRow(row: MedDoseEventRow): DoseEvent {
  return {
    id: row.id,
    medicationId: row.medication_id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    takenAt: row.taken_at ?? undefined,
    note: row.note ?? undefined,
  }
}

export function medicationToInsert(
  medication: Medication,
  userId: string,
): MedMedicationInsert {
  return {
    id: medication.id,
    user_id: userId,
    name: medication.name,
    dosage: medication.dosage ?? null,
    form: medication.form ?? null,
    instructions: medication.instructions ?? null,
    notes: medication.notes ?? null,
    schedule: medication.schedule,
    period: medication.period,
    active: medication.active,
  }
}

export function medicationToUpdate(medication: Medication): MedMedicationUpdate {
  return {
    name: medication.name,
    dosage: medication.dosage ?? null,
    form: medication.form ?? null,
    instructions: medication.instructions ?? null,
    notes: medication.notes ?? null,
    schedule: medication.schedule,
    period: medication.period,
    active: medication.active,
  }
}

export function doseEventToInsert(
  event: DoseEvent,
  userId: string,
): MedDoseEventInsert {
  return {
    id: event.id,
    user_id: userId,
    medication_id: event.medicationId,
    scheduled_at: event.scheduledAt,
    status: event.status,
    taken_at: event.takenAt ?? null,
    note: event.note ?? null,
  }
}
