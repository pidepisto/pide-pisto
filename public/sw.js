// Pide Pisto — Service Worker
const CACHE = 'pp-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// Push: muestra notificación
self.addEventListener('push', (e) => {
  if (!e.data) return
  const { title = 'Pide Pisto', body = '', url = '/' } = e.data.json()
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      data: { url },
      vibrate: [200, 100, 200],
    })
  )
})

// Clic en notificación — abre la URL
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const match = clients.find((c) => c.url.includes(self.location.origin))
      if (match) { match.focus(); match.navigate(url) }
      else self.clients.openWindow(url)
    })
  )
})
