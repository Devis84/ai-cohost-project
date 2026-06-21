import type {
  NotificationClient,
  NotificationPermissionResult,
  NotificationPlatform,
} from '@/lib/notifications/notification-client'

/**
 * No-op fallback notification client for environments where push notifications
 * are not supported (e.g. server-side rendering, unsupported browsers).
 *
 * All operations resolve without throwing so callers can safely use this
 * client without conditional guards.
 */
export class UnsupportedNotificationClient implements NotificationClient {
  isSupported(): boolean {
    return false
  }

  getPlatform(): NotificationPlatform {
    return 'unsupported'
  }

  async requestPermission(): Promise<NotificationPermissionResult> {
    return 'denied'
  }

  async register(): Promise<void> {
    // No-op in unsupported environment
  }

  async unregister(): Promise<void> {
    // No-op in unsupported environment
  }
}
