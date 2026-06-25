'use client'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { APP_NAME, pageTitles } from '@/lib/navigation'
import { Pill } from 'lucide-react'
import { usePathname } from 'next/navigation'

type AppHeaderProps = {
  subtitle?: string
}

export function AppHeader({ subtitle }: AppHeaderProps) {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? APP_NAME

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:px-6">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle ?? APP_NAME}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
