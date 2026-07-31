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
import { isSnoozeMinutes, type SnoozeMinutes } from '@/features/medications/snooze'
import {
  validateRetroactiveDate,
  validateTakenAtNotFuture,
} from '@/features/medications/retroactive'
import { doseEventKey } from '@/features/medications/event-key'
import { parseTimeOnDateWithOffset, parseLocalDate } from '@/lib/dates'
import { getTzOffsetMinutes } from '@/lib/tz'

type ActionResult = {
  error?: string
}

async function decrementStockForTakenDose(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  medicationId: string,
): Promise<ActionResult> {
  const { data: medication, error: fetchError } = await supabase
    .from('med_medications')
    .select('stock_quantity, quantity_per_dose')
    .eq('id', medicationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!medication || medication.stock_quantity == null) {
    return {}
  }

  const nextStock = Math.max(0, medication.stock_quantity - medication.quantity_per_dose)
  const { error: updateError } = await supabase
    .from('med_medications')
    .update({ stock_quantity: nextStock })
    .eq('id', medicationId)
    .eq('user_id', userId)

  if (updateError) {
    return { error: updateError.message }
  }

  return {}
}

async function restoreStockForDeletedTakenDose(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  medicationId: string,
): Promise<ActionResult> {
  const { data: medication, error: fetchError } = await supabase
    .from('med_medications')
    .select('stock_quantity, quantity_per_dose')
    .eq('id', medicationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!medication || medication.stock_quantity == null) {
    return {}
  }

  const nextStock = medication.stock_quantity + medication.quantity_per_dose
  const { error: updateError } = await supabase
    .from('med_medications')
    .update({ stock_quantity: nextStock })
    .eq('id', medicationId)
    .eq('user_id', userId)

  if (updateError) {
    return { error: updateError.message }
  }

  return {}
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
  takenAt?: string,
): Promise<ActionResult> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return { error: 'Não autenticado' }
  }

  const { data: existing, error: fetchError } = await auth.supabase
    .from('med_dose_events')
    .select('id, medication_id, status, scheduled_at')
    .eq('id', eventId)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!existing) {
    return { error: 'Dose não encontrada.' }
  }

  const now = new Date()
  let resolvedTakenAt: string | null = null

  if (status === 'taken') {
    resolvedTakenAt = takenAt ?? now.toISOString()
    if (new Date(resolvedTakenAt) > now) {
      return { error: 'O horário de tomada não pode ser no futuro.' }
    }
  }

  const update = {
    status,
    taken_at: resolvedTakenAt,
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

  if (status === 'taken' && existing.status !== 'taken') {
    const stockResult = await decrementStockForTakenDose(
      auth.supabase,
      auth.user.id,
      existing.medication_id,
    )
    if (stockResult.error) {
      return stockResult
    }
  }

  revalidatePath('/hoje')
  revalidatePath('/medicamentos')
  revalidatePath('/historico')
  revalidatePath('/registrar-passado')
  return {}
}

export async function deleteDoseEvent(eventId: string): Promise<ActionResult> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return { error: 'Não autenticado' }
  }

  const { data: existing, error: fetchError } = await auth.supabase
    .from('med_dose_events')
    .select('id, medication_id, status')
    .eq('id', eventId)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!existing) {
    return { error: 'Dose não encontrada.' }
  }

  const { error } = await auth.supabase
    .from('med_dose_events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', auth.user.id)

  if (error) {
    return { error: error.message }
  }

  if (existing.status === 'taken') {
    const stockResult = await restoreStockForDeletedTakenDose(
      auth.supabase,
      auth.user.id,
      existing.medication_id,
    )
    if (stockResult.error) {
      return stockResult
    }
  }

  revalidatePath('/hoje')
  revalidatePath('/medicamentos')
  revalidatePath('/historico')
  revalidatePath('/registrar-passado')
  return {}
}

export async function snoozeDoseEvent(
  eventId: string,
  minutes: SnoozeMinutes,
): Promise<ActionResult> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return { error: 'Não autenticado' }
  }

  if (!isSnoozeMinutes(minutes)) {
    return { error: 'Intervalo de adiamento inválido.' }
  }

  const { data: existing, error: fetchError } = await auth.supabase
    .from('med_dose_events')
    .select('id, status')
    .eq('id', eventId)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!existing) {
    return { error: 'Dose não encontrada.' }
  }

  if (existing.status !== 'pending') {
    return { error: 'Só é possível adiar doses pendentes.' }
  }

  const scheduledAt = new Date(Date.now() + minutes * 60 * 1000).toISOString()
  const { error } = await auth.supabase
    .from('med_dose_events')
    .update({ scheduled_at: scheduledAt })
    .eq('id', eventId)
    .eq('user_id', auth.user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/hoje')
  return {}
}

export async function recordManualDose(
  medicationId: string,
  note?: string,
): Promise<ActionResult> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return { error: 'Não autenticado' }
  }

  const { data: medication, error: fetchError } = await auth.supabase
    .from('med_medications')
    .select('id, active')
    .eq('id', medicationId)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!medication) {
    return { error: 'Medicamento não encontrado.' }
  }

  if (!medication.active) {
    return { error: 'Medicamento inativo.' }
  }

  const now = new Date().toISOString()
  const { error } = await auth.supabase.from('med_dose_events').insert({
    user_id: auth.user.id,
    medication_id: medicationId,
    scheduled_at: now,
    status: 'taken',
    taken_at: now,
    note: note?.trim() || null,
  })

  if (error) {
    return { error: error.message }
  }

  const stockResult = await decrementStockForTakenDose(
    auth.supabase,
    auth.user.id,
    medicationId,
  )
  if (stockResult.error) {
    return stockResult
  }

  revalidatePath('/hoje')
  revalidatePath('/medicamentos')
  revalidatePath('/historico')
  return {}
}

export async function recordRetroactiveDose(input: {
  medicationId: string
  date: string
  time: string
  note?: string
  takenTime?: string
}): Promise<ActionResult> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return { error: 'Não autenticado' }
  }

  const tzOffsetMinutes = await getTzOffsetMinutes()
  const dateError = validateRetroactiveDate(input.date, tzOffsetMinutes)
  if (dateError) {
    return { error: dateError }
  }

  if (!input.time) {
    return { error: 'Informe o horário.' }
  }

  const { data: medication, error: fetchError } = await auth.supabase
    .from('med_medications')
    .select('id, active')
    .eq('id', input.medicationId)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!medication) {
    return { error: 'Medicamento não encontrado.' }
  }

  if (!medication.active) {
    return { error: 'Medicamento inativo.' }
  }

  const scheduledAt = parseTimeOnDateWithOffset(
    parseLocalDate(input.date),
    input.time,
    tzOffsetMinutes,
  ).toISOString()

  const takenAt = input.takenTime
    ? parseTimeOnDateWithOffset(parseLocalDate(input.date), input.takenTime, tzOffsetMinutes).toISOString()
    : scheduledAt
  const takenAtError = validateTakenAtNotFuture(takenAt)
  if (takenAtError) {
    return { error: takenAtError }
  }

  const slotKey = doseEventKey(input.medicationId, scheduledAt)
  const { data: existingRows, error: existingError } = await auth.supabase
    .from('med_dose_events')
    .select('id, status, scheduled_at, medication_id')
    .eq('user_id', auth.user.id)
    .eq('medication_id', input.medicationId)

  if (existingError) {
    return { error: existingError.message }
  }

  const existing = (existingRows ?? []).find(
    (row) => doseEventKey(row.medication_id, row.scheduled_at) === slotKey,
  )

  if (existing?.status === 'taken') {
    return { error: 'Esta dose já foi registrada como tomada.' }
  }

  const note = input.note?.trim() || null

  if (existing) {
    const { error } = await auth.supabase
      .from('med_dose_events')
      .update({
        status: 'taken',
        taken_at: takenAt,
        note,
      })
      .eq('id', existing.id)
      .eq('user_id', auth.user.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await auth.supabase.from('med_dose_events').insert({
      user_id: auth.user.id,
      medication_id: input.medicationId,
      scheduled_at: scheduledAt,
      status: 'taken',
      taken_at: takenAt,
      note,
    })

    if (error) {
      return { error: error.message }
    }
  }

  const stockResult = await decrementStockForTakenDose(
    auth.supabase,
    auth.user.id,
    input.medicationId,
  )
  if (stockResult.error) {
    return stockResult
  }

  revalidatePath('/hoje')
  revalidatePath('/medicamentos')
  revalidatePath('/historico')
  revalidatePath('/registrar-passado')
  redirect('/historico')
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
