// Firebase Messaging Service Worker
// Handles background push notifications and notification-click deep-link routing.
//
// Environment variables are injected at runtime via the /api/host/firebase-config
// endpoint or via next.config.ts publicRuntimeConfig. For the service worker context
// (which cannot access Next.js env vars directly) we use self.__FIREBASE_CONFIG__
// injected by the main thread after the SW is registered.

importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js')

// Config is posted from the main thread after registration via postMessage.
// Default values are empty strings so the app initialises without throwing.
let firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config
    initFirebase()
  }
})

function initFirebase() {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig)
  }

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title ?? 'New Notification'
    const notificationOptions = {
      body: payload.notification?.body ?? '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: payload.data ?? {},
    }

    self.registration.showNotification(notificationTitle, notificationOptions)
  })
}

/**
 * Validates a deep-link route string to prevent open redirect.
 * Only accepts routes that start with a single '/' (relative paths).
 * Rejects protocol-relative URLs (//host) and absolute URLs (https://).
 */
function buildSafeRoute(rawRoute) {
  if (typeof rawRoute !== 'string' || !rawRoute) {
    return '/dashboard'
  }

  if (!rawRoute.startsWith('/') || rawRoute.startsWith('//')) {
    return '/dashboard'
  }

  return rawRoute
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data ?? {}
  const targetUrl = buildSafeRoute(data.route)

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus()
            if ('navigate' in client) {
              return client.navigate(targetUrl)
            }
            return
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      }),
  )
})
