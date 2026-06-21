import { Capacitor } from '@capacitor/core'

import { CapacitorNotificationClient } from '@/lib/notifications/capacitor-notification-client'
import { UnsupportedNotificationClient } from '@/lib/notifications/unsupported-notification-client'
import type {
  NotificationClient,
  CapacitorNotificationClientConfig,
} from '@/lib/notifications/notification-client'

/**
 * Returns the appropriate `NotificationClient` implementation based on the
 * current runtime platform.
 *
 * - Native (Android/iOS) → `CapacitorNotificationClient`
 * - Everything else → `UnsupportedNotificationClient`
 *
 * Web push (via Firebase Messaging) is handled by the existing
 * `web-notification-client.ts` functions and is out of scope for this factory.
 */
export function createNotificationClient(
  config: CapacitorNotificationClientConfig,
): NotificationClient {
  if (Capacitor.isNativePlatform()) {
    return new CapacitorNotificationClient(config)
  }

  return new UnsupportedNotificationClient()
}
