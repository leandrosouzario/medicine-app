'use client'

import { useState } from 'react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { resolvePageTitle } from '@/lib/navigation'
import { LogOut, Pill, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const AUTH_PROFILE_URL =
  process.env.NEXT_PUBLIC_AUTH_PROFILE_URL ?? 'https://auth.leandrosouza.info/perfil'

type AppHeaderProps = {
  userEmail?: string | null
}

export function AppHeader({ userEmail }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const title = resolvePageTitle(pathname)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:px-6">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
            {userEmail && (
              <p className="truncate max-w-[140px] text-xs text-slate-500 dark:text-slate-400">
                {userEmail}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <a
            href={AUTH_PROFILE_URL}
            title="Perfil"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <User className="h-5 w-5" />
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            title={signingOut ? 'Saindo...' : 'Sair'}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
