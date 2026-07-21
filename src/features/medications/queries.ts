import { createClient } from '@/lib/supabase/server'
import type { DoseEvent, Medication } from '@/lib/db/types'
import {
  doseEventFromRow,
  medicationFromRow,
} from '@/features/medications/mappers'
import { buildHistoryData, type HistoryPeriod } from '@/features/medications/history'
import { getTodayDoseEvents } from '@/features/medications/dose-schedule'
import { syncDoseEventsWithSupabase } from '@/features/medications/sync-doses'
import { markMissedPendingDoses } from '@/features/medications/mark-missed-doses'
import { getTzOffsetMinutes } from '@/lib/tz'

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

async function fetchMedicationRows(userId: string) {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return []
  }

  const { data, error } = await auth.supabase
    .from('med_medications')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

async function fetchDoseEventRows(userId: string) {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return []
  }

  const { data, error } = await auth.supabase
    .from('med_dose_events')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getMedications(): Promise<Medication[]> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return []
  }

  const rows = await fetchMedicationRows(auth.user.id)
  return rows.map(medicationFromRow)
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return null
  }

  const { data, error } = await auth.supabase
    .from('med_medications')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? medicationFromRow(data) : null
}

export async function ensureDoseSchedule(): Promise<void> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return
  }

  const [medicationRows, doseEventRows, tzOffsetMinutes] = await Promise.all([
    fetchMedicationRows(auth.user.id),
    fetchDoseEventRows(auth.user.id),
    getTzOffsetMinutes(),
  ])

  const medications = medicationRows.map(medicationFromRow)

  await syncDoseEventsWithSupabase(
    auth.supabase,
    auth.user.id,
    medications,
    doseEventRows,
    { tzOffsetMinutes },
  )

  await markMissedPendingDoses(auth.supabase, auth.user.id)
}

export async function getDoseEvents(): Promise<DoseEvent[]> {
  const auth = await getAuthenticatedClient()
  if (!auth) {
    return []
  }

  const rows = await fetchDoseEventRows(auth.user.id)
  return rows.map(doseEventFromRow)
}

export async function getTodayDoses(): Promise<
  Array<DoseEvent & { medication: Medication }>
> {
  await ensureDoseSchedule()

  const [medications, doseEvents, tzOffsetMinutes] = await Promise.all([
    getMedications(),
    getDoseEvents(),
    getTzOffsetMinutes(),
  ])

  return getTodayDoseEvents(doseEvents, medications, { tzOffsetMinutes })
}

export async function getHojePageData(): Promise<{
  doses: Array<DoseEvent & { medication: Medication }>
  asNeededMedications: Medication[]
  extraDoseMedications: Medication[]
}> {
  const [doses, medications] = await Promise.all([getTodayDoses(), getMedications()])

  const activeMedications = medications.filter((medication) => medication.active)
  const asNeededMedications = activeMedications.filter(
    (medication) => medication.schedule.type === 'as_needed',
  )
  const extraDoseMedications = activeMedications.filter(
    (medication) => medication.schedule.type !== 'as_needed',
  )

  return {
    doses,
    asNeededMedications,
    extraDoseMedications,
  }
}

export async function getHistory(period: HistoryPeriod = 7) {
  await ensureDoseSchedule()

  const [medications, doseEvents, tzOffsetMinutes] = await Promise.all([
    getMedications(),
    getDoseEvents(),
    getTzOffsetMinutes(),
  ])

  return buildHistoryData(doseEvents, medications, period, tzOffsetMinutes)
}
