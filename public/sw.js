// Service Worker — Remédios
// Responsabilidades:
//   1. Cache de assets para suporte offline básico
//   2. Exibir notificações agendadas pelo cliente via postMessage
//   3. Marcar dose como tomada (via client) ou abrir /hoje

const CACHE_NAME = 'remedios-v2'

const PRECACHE_URLS = [
  '/hoje',
  '/medicamentos',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {}),
  )
})

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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request)),
  )
})

const scheduledTimers = new Map()

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'SCHEDULE_NOTIFICATIONS') return

  const doses = event.data.doses ?? []

  for (const timerId of scheduledTimers.values()) {
    clearTimeout(timerId)
  }
  scheduledTimers.clear()

  const now = Date.now()

  for (const dose of doses) {
    const delay = new Date(dose.scheduledAt).getTime() - now

    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue

    const timerId = setTimeout(() => {
      self.registration.showNotification(dose.title, {
        body: dose.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `dose-${dose.id}`,
        renotify: false,
        data: { url: '/hoje', doseId: dose.id },
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

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const doseId = event.notification.data?.doseId
  const targetUrl = event.notification.data?.url ?? '/hoje'

  if (event.action === 'snooze') {
    setTimeout(() => {
      self.registration.showNotification(event.notification.title, {
        body: event.notification.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: event.notification.tag ?? `snooze-${Date.now()}`,
        data: { url: targetUrl, doseId },
        actions: [
          { action: 'taken', title: 'Tomado ✓' },
          { action: 'snooze', title: 'Lembrar em 10 min' },
        ],
      })
    }, 10 * 60 * 1000)

    return
  }

  if (event.action === 'taken' && doseId) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'MARK_DOSE_TAKEN', doseId })
        }

        if (clients.length > 0) {
          const existing = clients.find((c) => c.url.includes(self.location.origin))
          return existing?.focus()
        }

        return self.clients.openWindow(`/hoje?taken=${encodeURIComponent(doseId)}`)
      }),
    )
    return
  }

  // Clique no corpo da notificação → abre Hoje
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find(
        (c) => c.url.includes('/hoje') || c.url.includes(self.location.origin),
      )
      if (existing) {
        return existing.focus()
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
