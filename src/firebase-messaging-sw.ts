// @ts-nocheck
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

// Initialize Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

const APP_NOTIFICATION_ICON = '/pwa-192x192.png'
const APP_NOTIFICATION_BADGE = '/pwa-64x64.png'

async function setAppBadgeFromPayload(payload: any) {
  const registrationAny = self.registration as ServiceWorkerRegistration & {
    setAppBadge?: (value?: number) => Promise<void>
  }

  if (typeof registrationAny.setAppBadge !== 'function') {
    return
  }

  const rawCount = Number(payload?.data?.badgeCount)
  const count = Number.isFinite(rawCount) && rawCount > 0 ? rawCount : 1

  try {
    await registrationAny.setAppBadge(count)
  } catch {
    // Ignore unsupported or permission-related errors.
  }
}

async function clearAppBadge() {
  const registrationAny = self.registration as ServiceWorkerRegistration & {
    clearAppBadge?: () => Promise<void>
  }

  if (typeof registrationAny.clearAppBadge !== 'function') {
    return
  }

  try {
    await registrationAny.clearAppBadge()
  } catch {
    // Ignore unsupported or permission-related errors.
  }
}

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw] Received background message ', payload)

  const notificationTitle = payload?.notification?.title || payload?.data?.title || 'Campamento Andino Sayhueque'
  const notificationBody = payload?.notification?.body || payload?.data?.body || 'Nuevo aviso'
  const hasEventoId = Boolean(payload?.data?.eventoId)

  const notificationOptions = {
    body: notificationBody,
    icon: APP_NOTIFICATION_ICON,
    badge: APP_NOTIFICATION_BADGE,
    data: payload?.data,
    tag: hasEventoId ? `evento-${payload.data.eventoId}` : undefined,
    renotify: hasEventoId,
  }

  void self.registration.showNotification(notificationTitle, notificationOptions)
  void setAppBadgeFromPayload(payload)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil((async () => {
    await clearAppBadge()

    const allClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    })

    for (const client of allClients) {
      if ('focus' in client) {
        await client.focus()
        return
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow('/')
    }
  })())
})
