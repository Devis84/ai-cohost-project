// Capacitor imports are resolved at runtime when the native app is built.
// In the test environment these are mocked via vi.mock.
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

import {
  buildDeepLinkUrl,
  extractRouteFromNotificationData,
} from '@/lib/notifications/notification-click-handler'
import type {
  NotificationClient,
  NotificationPermissionResult,
  NotificationPlatform,
  CapacitorNotificationClientConfig,
} from '@/lib/notifications/notification-client'
import type { DevicePlatform, HostDevice } from '@/types/notification-system'

/** Android notification channel importance — 5 = IMPORTANCE_HIGH */
const ANDROID_CHANNEL_IMPORTANCE = 5

const GUEST_REQUESTS_CHANNEL = {
  id: 'guest-requests',
  name: 'Guest Requests',
  description: 'High-priority alerts for incoming guest requests',
  importance: ANDROID_CHANNEL_IMPORTANCE,
  visibility: 1, // VISIBILITY_PUBLIC
  vibration: true,
  sound: 'default',
} as const

/**
 * Capacitor-based push notification client for Android (and iOS) native apps.
 *
 * Responsibilities:
 * - Requests OS-level notification permission via Capacitor
 * - Creates the "guest-requests" high-importance Android channel
 * - Registers the device with FCM and posts the token to the backend
 * - Handles foreground notifications (no-op — system handles display)
 * - On notification tap: extracts the deep-link route and delegates navigation
 *   to the caller-supplied `onNavigate` callback (framework-agnostic)
 */
export class CapacitorNotificationClient implements NotificationClient {
  private readonly config: CapacitorNotificationClientConfig

  constructor(config: CapacitorNotificationClientConfig) {
    this.config = { ...config }
  }

  isSupported(): boolean {
    return Capacitor.isNativePlatform()
  }

  getPlatform(): NotificationPlatform {
    const platform = Capacitor.getPlatform()

    if (platform === 'android') return 'android'
    if (platform === 'ios') return 'ios'
    if (platform === 'web') return 'web'
    return 'unsupported'
  }

  async requestPermission(): Promise<NotificationPermissionResult> {
    const result = await PushNotifications.requestPermissions()

    if (result.receive === 'granted') return 'granted'
    if (result.receive === 'denied') return 'denied'
    // Capacitor returns 'prompt' (or 'prompt-with-rationale') for the initial
    // state where the user has not yet made a choice — map to 'default'.
    if (result.receive === 'prompt' || result.receive === 'prompt-with-rationale') {
      return 'default'
    }

    return 'denied'
  }

  async register(): Promise<void> {
    await PushNotifications.createChannel(GUEST_REQUESTS_CHANNEL)

    this.attachListeners()

    await PushNotifications.register()
  }

  async unregister(): Promise<void> {
    const deviceId = this.config.deviceId

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

  // ── Private helpers ──────────────────────────────────────────────────────

  private attachListeners(): void {
    PushNotifications.addListener('registration', async (...args: unknown[]) => {
      const token = args[0] as { value: string }
      console.log("FCM registration token:", token.value);
      alert(`FCM token:\n${token.value}`);
      await this.handleRegistrationToken(token.value)
    })

    PushNotifications.addListener('pushNotificationReceived', () => {
      // Foreground notifications are displayed by the OS.
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (...args: unknown[]) => {
      this.handleNotificationTap(args[0])
    })
  }

  private async handleRegistrationToken(token: string): Promise<void> {
    const rawPlatform = Capacitor.getPlatform()
    const platform: DevicePlatform = rawPlatform === 'ios' ? 'ios' : 'android'

    const payload = {
      notification_token: token,
      platform,
      app_type: 'native' as const,
      permission_status: 'granted' as const,
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
  }

  private handleNotificationTap(action: unknown): void {
    const notification = this.extractNotificationFromAction(action)
    const data = this.extractDataFromNotification(notification)
    const rawRoute = extractRouteFromNotificationData(data)
    const route = buildDeepLinkUrl(rawRoute)

    this.config.onNavigate(route)
  }

  private extractNotificationFromAction(action: unknown): unknown {
    if (action === null || action === undefined || typeof action !== 'object') {
      return undefined
    }

    return (action as Record<string, unknown>)['notification']
  }

  private extractDataFromNotification(notification: unknown): unknown {
    if (
      notification === null ||
      notification === undefined ||
      typeof notification !== 'object'
    ) {
      return undefined
    }

    return (notification as Record<string, unknown>)['data']
  }
}
