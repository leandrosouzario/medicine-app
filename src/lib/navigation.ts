import type { LucideIcon } from 'lucide-react'
import { CalendarDays, Pill } from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const mainNavigation: NavItem[] = [
  {
    label: 'Hoje',
    href: '/hoje',
    icon: CalendarDays,
  },
  {
    label: 'Medicamentos',
    href: '/medicamentos',
    icon: Pill,
  },
]

export const pageTitles: Record<string, string> = {
  '/hoje': 'Hoje',
  '/medicamentos': 'Medicamentos',
  '/medicamentos/novo': 'Novo medicamento',
}

export function resolvePageTitle(pathname: string): string {
  if (pageTitles[pathname]) {
    return pageTitles[pathname]
  }

  if (/^\/medicamentos\/[^/]+$/.test(pathname)) {
    return 'Editar medicamento'
  }

  return APP_NAME
}

export const APP_NAME = 'Remédios'

export const MEDICAL_DISCLAIMER =
  'Este app não substitui orientação médica ou farmacêutica.'
