import { getToken, onMessage, isSupported } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase/firebase-client'
import type { DevicePlatform, HostDevice } from '@/types/notification-system'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? ''

/**
 * Returns true when the current browser environment supports push notifications
 * via the Notification API, service workers, and Firebase messaging.
 */
export async function isNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  if (typeof Notification === 'undefined') {
    return false
  }

  if (!navigator.serviceWorker) {
    return false
  }

  try {
    return await isSupported()
  } catch {
    return false
  }
}

/**
 * Requests browser notification permission from the user.
 * Throws when the Notification API is not available.
 * This must only be called in response to an explicit user action.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') {
    throw new Error('Notification API not available')
  }

  return Notification.requestPermission()
}

/**
 * Gets an FCM token and registers the device with the backend.
 * Returns the registered HostDevice record on success.
 * Throws on FCM failure or backend error.
 */
export async function registerForPushNotifications(): Promise<HostDevice> {
  const messaging = getFirebaseMessaging()

  if (!messaging) {
    throw new Error('Firebase messaging not initialized')
  }

  const token = await getToken(messaging, { vapidKey: VAPID_KEY })

  if (!token) {
    throw new Error('Failed to get FCM token')
  }

  const payload: {
    notification_token: string
    platform: DevicePlatform
    app_type: 'pwa'
    permission_status: 'granted'
  } = {
    notification_token: token,
    platform: 'web',
    app_type: 'pwa',
    permission_status: 'granted',
  }

  const response = await fetch('/api/host/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const json = (await response.json()) as { success: boolean; data?: HostDevice; error?: string }

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? 'Device registration failed')
  }

  if (!json.data) {
    throw new Error('Device registration succeeded but returned no device record')
  }

  return json.data
}

/**
 * Unregisters a device from push notifications by device ID.
 * Throws when deviceId is empty or the backend returns an error.
 */
export async function unregisterFromPushNotifications(deviceId: string): Promise<void> {
  if (!deviceId) {
    throw new Error('deviceId is required')
  }

  const response = await fetch('/api/host/devices/unregister', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId }),
  })

  const json = (await response.json()) as { success: boolean; error?: string }

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? 'Device unregistration failed')
  }
}

/**
 * Subscribes to FCM foreground messages to detect token refresh signals.
 * Returns an unsubscribe function to clean up the listener.
 */
export function onTokenRefresh(callback: (newToken: string) => void): () => void {
  const messaging = getFirebaseMessaging()

  if (!messaging) {
    return () => undefined
  }

  // Firebase does not provide a direct token refresh event on web.
  // We hook into foreground messages and re-fetch the token when a
  // refresh signal arrives (a message with no notification payload
  // and a data.type === 'token_refresh' convention).
  const unsubscribe = onMessage(messaging, async (payload) => {
    if (payload.data?.['type'] === 'token_refresh') {
      try {
        const newToken = await getToken(messaging, { vapidKey: VAPID_KEY })
        if (newToken) {
          callback(newToken)
        }
      } catch {
        // Token refresh silently fails — the next registration will fix it
      }
    }
  })

  return unsubscribe
}

/**
 * Returns the platform identifier for web push registrations.
 */
export function getWebPlatform(): DevicePlatform {
  return 'web'
}
