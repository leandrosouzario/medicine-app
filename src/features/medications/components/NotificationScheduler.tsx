'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import type { DoseEvent, Medication } from '@/lib/db/types'

type Dose = DoseEvent & { medication: Medication }

type NotificationSchedulerProps = {
  doses: Dose[]
}

const PREF_KEY = 'med-notifications-pref'
type NotifPref = 'granted' | 'denied' | 'dismissed'

function buildNotificationPayload(doses: Dose[]) {
  const now = new Date()

  return doses
    .filter((dose) => dose.status === 'pending' && new Date(dose.scheduledAt) > now)
    .map((dose) => {
      const parts = [dose.medication.name]
      if (dose.medication.dosage) parts.push(dose.medication.dosage)

      return {
        id: dose.id,
        title: 'Hora do remédio 💊',
        body: parts.join(' — '),
        scheduledAt: dose.scheduledAt,
      }
    })
}

async function scheduleViaServiceWorker(doses: Dose[]) {
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.ready
  const payload = buildNotificationPayload(doses)

  if (payload.length === 0) return

  registration.active?.postMessage({
    type: 'SCHEDULE_NOTIFICATIONS',
    doses: payload,
  })
}

async function requestAndSchedule(doses: Dose[]): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'

  let permission = Notification.permission

  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }

  if (permission === 'granted') {
    await scheduleViaServiceWorker(doses)
  }

  return permission
}

export function NotificationScheduler({ doses }: NotificationSchedulerProps) {
  const [pref, setPref] = useState<NotifPref | null>(null)
  const [supported, setSupported] = useState(false)

  // Determina estado inicial
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    setSupported(true)

    const saved = localStorage.getItem(PREF_KEY) as NotifPref | null

    if (Notification.permission === 'granted') {
      setPref('granted')
      // Re-agenda doses a cada abertura da tela
      void scheduleViaServiceWorker(doses)
      return
    }

    if (Notification.permission === 'denied') {
      setPref('denied')
      return
    }

    // Permissão 'default': respeita o que o usuário escolheu na UI
    setPref(saved ?? null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-agenda quando doses mudam (ex: após marcar tomado)
  useEffect(() => {
    if (pref === 'granted') {
      void scheduleViaServiceWorker(doses)
    }
  }, [doses, pref])

  async function handleEnable() {
    const permission = await requestAndSchedule(doses)

    if (permission === 'granted') {
      localStorage.setItem(PREF_KEY, 'granted')
      setPref('granted')
    } else {
      localStorage.setItem(PREF_KEY, 'denied')
      setPref('denied')
    }
  }

  function handleDismiss() {
    localStorage.setItem(PREF_KEY, 'dismissed')
    setPref('dismissed')
  }

  // Nada a exibir se não suportado, já concedido, negado ou dispensado
  if (!supported || pref === 'granted' || pref === 'denied' || pref === 'dismissed') {
    return null
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-950/40">
      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brand-900 dark:text-brand-100">
          Ativar lembretes de dose?
        </p>
        <p className="mt-0.5 text-xs text-brand-700 dark:text-brand-300">
          Aviso na hora de cada medicamento. O botão &quot;Tomado&quot; na notificação grava no
          seu histórico. No iPhone, lembretes exigem o app instalado e podem falhar com o app
          fechado por muito tempo.
        </p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleEnable}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            <Bell className="h-3.5 w-3.5" />
            Ativar lembretes
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/40"
          >
            Agora não
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="rounded p-0.5 text-brand-500 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Componente de status exibível no header da tela Hoje (opcional, para informação)
export function NotificationStatusBadge() {
  const [pref, setPref] = useState<NotifPref | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
      setPref('granted')
    } else if (Notification.permission === 'denied') {
      setPref('denied')
    }
  }, [])

  if (pref !== 'denied') return null

  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      <BellOff className="h-4 w-4 shrink-0" />
      <span>
        Lembretes bloqueados. Para ativar, permita notificações nas configurações do seu navegador.
      </span>
    </div>
  )
}
