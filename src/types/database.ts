import type {
  DoseStatus,
  MedicationForm,
  MedicationPeriod,
  MedicationSchedule,
} from '@/lib/db/types'

export type MedMedicationRow = {
  id: string
  user_id: string
  name: string
  dosage: string | null
  form: MedicationForm | null
  instructions: string | null
  notes: string | null
  schedule: MedicationSchedule
  period: MedicationPeriod
  active: boolean
  stock_quantity: number | null
  quantity_per_dose: number
  refill_threshold: number
  created_at: string
  updated_at: string
}

export type MedDoseEventRow = {
  id: string
  user_id: string
  medication_id: string
  scheduled_at: string
  status: DoseStatus
  taken_at: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export type MedMedicationInsert = {
  id?: string
  user_id: string
  name: string
  dosage?: string | null
  form?: MedicationForm | null
  instructions?: string | null
  notes?: string | null
  schedule: MedicationSchedule
  period: MedicationPeriod
  active?: boolean
  stock_quantity?: number | null
  quantity_per_dose?: number
  refill_threshold?: number
}

export type MedMedicationUpdate = {
  name: string
  dosage?: string | null
  form?: MedicationForm | null
  instructions?: string | null
  notes?: string | null
  schedule: MedicationSchedule
  period: MedicationPeriod
  active: boolean
  stock_quantity?: number | null
  quantity_per_dose?: number
  refill_threshold?: number
}

export type MedDoseEventInsert = {
  id?: string
  user_id: string
  medication_id: string
  scheduled_at: string
  status?: DoseStatus
  taken_at?: string | null
  note?: string | null
}
