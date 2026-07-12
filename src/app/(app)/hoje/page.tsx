import { HojeClient } from '@/features/medications/components/HojeClient'
import {
  NotificationScheduler,
  NotificationStatusBadge,
} from '@/features/medications/components/NotificationScheduler'
import { getTodayDoses } from '@/features/medications/queries'

export default async function HojePage() {
  const doses = await getTodayDoses()

  return (
    <>
      <NotificationScheduler doses={doses} />
      <NotificationStatusBadge />
      <HojeClient doses={doses} />
    </>
  )
}
