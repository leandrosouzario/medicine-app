export type MedicationForm = 'pill' | 'liquid' | 'injection' | 'other'

export type ScheduleType = 'fixed_times' | 'interval' | 'as_needed'

export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'missed'

export type MedicationSchedule = {
  type: ScheduleType
  times?: string[]
  intervalHours?: number
  daysOfWeek?: number[]
}

export type MedicationPeriod = {
  startDate: string
  endDate?: string
}

export type Medication = {
  id: string
  name: string
  dosage?: string
  form?: MedicationForm
  instructions?: string
  notes?: string
  schedule: MedicationSchedule
  period: MedicationPeriod
  active: boolean
  /** null = não controlar estoque */
  stockQuantity?: number | null
  quantityPerDose: number
  refillThreshold: number
  createdAt: string
  updatedAt: string
}

export type DoseEvent = {
  id: string
  medicationId: string
  scheduledAt: string
  status: DoseStatus
  takenAt?: string
  note?: string
}

export const DB_KEYS = {
  medications: 'medications',
  doseEvents: 'dose-events',
} as const
