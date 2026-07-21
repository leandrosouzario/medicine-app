'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { DoseEvent, Medication } from '@/lib/db/types'
import {
  buildMedicationFromInput,
  type MedicationInput,
  validateMedicationInput,
} from '@/features/medications/input'
import {
  doseEventToInsert,
  doseEventFromRow,
  medicationFromRow,
  medicationToInsert,
  medicationToUpdate,
} from '@/features/medications/mappers'
import { syncDoseEventsWithSupabase } from '@/features/medications/sync-doses'
import { getTzOffsetMinutes } from '@/lib/tz'

type ActionResult = {
  error?: string
}

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return { supabase, user }
}

async function syncAfterMedicationChange(userId: string) {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return
  }

  const [{ data: medicationRows }, { data: doseEventRows }, tzOffsetMinutes] = await Promise.all([
    auth.supabase.from('med_medications').select('*').eq('user_id', userId),
    auth.supabase.from('med_dose_events').select('*').eq('user_id', userId),
    getTzOffsetMinutes(),
  ])

  await syncDoseEventsWithSupabase(
    auth.supabase,
    userId,
    (medicationRows ?? []).map(medicationFromRow),
    doseEventRows ?? [],
    { tzOffsetMinutes },
  )
}

export async function createMedication(input: MedicationInput): Promise<ActionResult> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return { error: 'Não autenticado' }
  }

  const validationError = validateMedicationInput(input)
  if (validationError) {
    return { error: validationError }
  }

  const medication = buildMedicationFromInput(input)
  const { error } = await auth.supabase
    .from('med_medications')
    .insert(medicationToInsert(medication, auth.user.id))

  if (error) {
    return { error: error.message }
  }

  await syncAfterMedicationChange(auth.user.id)
  revalidatePath('/medicamentos')
  revalidatePath('/hoje')
  redirect('/medicamentos')
}

export async function updateMedication(
  id: string,
  input: MedicationInput,
): Promise<ActionResult> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return { error: 'Não autenticado' }
  }

  const validationError = validateMedicationInput(input)
  if (validationError) {
    return { error: validationError }
  }

  const { data: existing, error: fetchError } = await auth.supabase
    .from('med_medications')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!existing) {
    return { error: 'Medicamento não encontrado.' }
  }

  const medication = buildMedicationFromInput(input, medicationFromRow(existing))
  const { error } = await auth.supabase
    .from('med_medications')
    .update(medicationToUpdate(medication))
    .eq('id', id)
    .eq('user_id', auth.user.id)

  if (error) {
    return { error: error.message }
  }

  await syncAfterMedicationChange(auth.user.id)
  revalidatePath('/medicamentos')
  revalidatePath('/hoje')
  redirect('/medicamentos')
}

export async function deleteMedication(id: string): Promise<ActionResult> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return { error: 'Não autenticado' }
  }

  const { error } = await auth.supabase
    .from('med_medications')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/medicamentos')
  revalidatePath('/hoje')
  return {}
}

export async function updateDoseEventStatus(
  eventId: string,
  status: DoseEvent['status'],
  note?: string,
): Promise<ActionResult> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return { error: 'Não autenticado' }
  }

  const update = {
    status,
    taken_at: status === 'taken' ? new Date().toISOString() : null,
    note: note?.trim() || null,
  }

  const { data, error } = await auth.supabase
    .from('med_dose_events')
    .update(update)
    .eq('id', eventId)
    .eq('user_id', auth.user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Dose não encontrada.' }
  }

  revalidatePath('/hoje')
  return {}
}

export async function importFromIndexedDb(
  medications: Medication[],
  doseEvents: DoseEvent[],
): Promise<ActionResult & { imported?: boolean }> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return { error: 'Não autenticado' }
  }

  const { count, error: countError } = await auth.supabase
    .from('med_medications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)

  if (countError) {
    return { error: countError.message }
  }

  if ((count ?? 0) > 0 || medications.length === 0) {
    return { imported: false }
  }

  const { error: medicationsError } = await auth.supabase
    .from('med_medications')
    .insert(medications.map((medication) => medicationToInsert(medication, auth.user.id)))

  if (medicationsError) {
    return { error: medicationsError.message }
  }

  if (doseEvents.length > 0) {
    const { error: dosesError } = await auth.supabase
      .from('med_dose_events')
      .insert(doseEvents.map((event) => doseEventToInsert(event, auth.user.id)))

    if (dosesError) {
      return { error: dosesError.message }
    }
  }

  await syncAfterMedicationChange(auth.user.id)
  revalidatePath('/medicamentos')
  revalidatePath('/hoje')
  return { imported: true }
}
