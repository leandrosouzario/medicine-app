import { HojeClient } from '@/features/medications/components/HojeClient'
import {
  NotificationScheduler,
  NotificationStatusBadge,
} from '@/features/medications/components/NotificationScheduler'
import { getHojePageData } from '@/features/medications/queries'

export default async function HojePage() {
  const { doses, asNeededMedications, extraDoseMedications } = await getHojePageData()

  return (
    <>
      <NotificationScheduler doses={doses} />
      <NotificationStatusBadge />
      <HojeClient
        doses={doses}
        asNeededMedications={asNeededMedications}
        extraDoseMedications={extraDoseMedications}
      />
    </>
  )
}
