// Service Worker — Remédios
// Responsabilidades:
//   1. Cache de assets para suporte offline básico
//   2. Exibir notificações agendadas pelo cliente via postMessage
//   3. Abrir /hoje ao tocar na notificação

const CACHE_NAME = 'remedios-v1'

const PRECACHE_URLS = [
  '/hoje',
  '/medicamentos',
  '/manifest.webmanifest',
]

// ──────────────────────────────────────────────
// Instalação: pré-cache dos assets estáticos
// ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {}),
  )
})

// ──────────────────────────────────────────────
// Ativação: limpa caches antigos
// ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

// ──────────────────────────────────────────────
// Fetch: network-first, fallback para cache
// ──────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET e cross-origin
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Atualiza cache com resposta fresca
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request)),
  )
})

// ──────────────────────────────────────────────
// Notificações agendadas pelo cliente
//
// O cliente envia:
// { type: 'SCHEDULE_NOTIFICATIONS', doses: [{ id, title, body, scheduledAt }] }
// ──────────────────────────────────────────────

/** Map<doseId, timeoutId> para poder cancelar re-agendamentos */
const scheduledTimers = new Map()

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'SCHEDULE_NOTIFICATIONS') return

  const doses = event.data.doses ?? []

  // Cancela agendamentos anteriores
  for (const timerId of scheduledTimers.values()) {
    clearTimeout(timerId)
  }
  scheduledTimers.clear()

  const now = Date.now()

  for (const dose of doses) {
    const delay = new Date(dose.scheduledAt).getTime() - now

    // Ignora horários já passados ou mais de 24h no futuro
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue

    const timerId = setTimeout(() => {
      self.registration.showNotification(dose.title, {
        body: dose.body,
        icon: '/icons/icon.svg',
        badge: '/icons/icon.svg',
        tag: `dose-${dose.id}`,
        renotify: false,
        data: { url: '/hoje' },
        actions: [
          { action: 'taken', title: 'Tomado ✓' },
          { action: 'snooze', title: 'Lembrar em 10 min' },
        ],
        requireInteraction: false,
      })
      scheduledTimers.delete(dose.id)
    }, delay)

    scheduledTimers.set(dose.id, timerId)
  }
})

// ──────────────────────────────────────────────
// Click na notificação
// ──────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url ?? '/hoje'

  if (event.action === 'snooze') {
    // Reagenda para daqui a 10 minutos
    const dose = {
      id: `snooze-${event.notification.tag}`,
      title: event.notification.title,
      body: event.notification.body,
      scheduledAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }

    setTimeout(() => {
      self.registration.showNotification(dose.title, {
        body: dose.body,
        icon: '/icons/icon.svg',
        badge: '/icons/icon.svg',
        tag: dose.id,
        data: { url: targetUrl },
      })
    }, 10 * 60 * 1000)

    return
  }

  // action === 'taken' ou clique direto → abre /hoje
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Foca aba existente se houver
        const existing = clients.find((c) => c.url.includes('/hoje') || c.url.includes(self.location.origin))
        if (existing) {
          return existing.focus()
        }
        return self.clients.openWindow(targetUrl)
      }),
  )
})
