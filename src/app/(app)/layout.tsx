import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { LocalDataMigrator } from '@/features/medications/components/LocalDataMigrator'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { TzSetter } from '@/components/TzSetter'

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <AppShell userEmail={user?.email}>
      <TzSetter />
      <ServiceWorkerRegistration />
      <LocalDataMigrator />
      {children}
    </AppShell>
  )
}
