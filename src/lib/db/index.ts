/** IndexedDB legado — usado apenas para importação única via LocalDataMigrator. */
import { get, set } from 'idb-keyval'
import type { DoseEvent, Medication } from '@/lib/db/types'
import { DB_KEYS } from '@/lib/db/types'

export async function getMedications(): Promise<Medication[]> {
  return (await get<Medication[]>(DB_KEYS.medications)) ?? []
}

export async function saveMedications(medications: Medication[]): Promise<void> {
  await set(DB_KEYS.medications, medications)
}

export async function getDoseEvents(): Promise<DoseEvent[]> {
  return (await get<DoseEvent[]>(DB_KEYS.doseEvents)) ?? []
}

export async function saveDoseEvents(events: DoseEvent[]): Promise<void> {
  await set(DB_KEYS.doseEvents, events)
}
