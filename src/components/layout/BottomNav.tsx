'use client'

import { mainNavigation } from '@/lib/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-lg">
        {mainNavigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition ${
                active
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
