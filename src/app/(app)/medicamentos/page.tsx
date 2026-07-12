import { MedicamentosClient } from '@/features/medications/components/MedicamentosClient'
import { ensureDoseSchedule, getMedications } from '@/features/medications/queries'

export default async function MedicamentosPage() {
  await ensureDoseSchedule()
  const medications = await getMedications()

  return <MedicamentosClient medications={medications} />
}
