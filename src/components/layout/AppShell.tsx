import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { MEDICAL_DISCLAIMER } from '@/lib/navigation'

type AppShellProps = {
  children: React.ReactNode
  userEmail?: string | null
}

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <AppHeader userEmail={userEmail} />
      <main className="mx-auto max-w-lg px-4 pb-28 pt-4 md:px-6">{children}</main>
      <footer className="mx-auto max-w-lg px-4 pb-24 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
        {MEDICAL_DISCLAIMER}
      </footer>
      <BottomNav />
    </div>
  )
}
