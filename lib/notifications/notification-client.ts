export type NotificationPermissionResult = 'granted' | 'denied' | 'default'

export type NotificationPlatform = 'web' | 'ios' | 'android' | 'unsupported'

/**
 * Unified interface for push notification clients across platforms.
 * Concrete implementations exist for web (Firebase), Android (Capacitor), and
 * unsupported environments. Consumers depend only on this interface.
 */
export interface NotificationClient {
  /** Returns true when push notifications are supported in the current environment. */
  isSupported(): boolean | Promise<boolean>

  /** Prompts the user for notification permission. */
  requestPermission(): Promise<NotificationPermissionResult>

  /** Obtains a push token and registers the device with the backend. */
  register(): Promise<void>

  /** Revokes registration and removes the device from the backend. */
  unregister(): Promise<void>

  /** Returns the platform identifier for this client. */
  getPlatform(): NotificationPlatform
}

/**
 * Configuration passed to CapacitorNotificationClient via its constructor.
 * Using a config object keeps the client framework-agnostic — the caller
 * supplies the navigation callback rather than the client importing a router.
 */
export interface CapacitorNotificationClientConfig {
  /**
   * Called when the user taps a notification while the app is backgrounded.
   * Receives the resolved deep-link route (e.g. '/host/requests/abc-123').
   */
  onNavigate: (route: string) => void

  /**
   * Optional device identifier used during unregistration.
   * Set after a successful register() call.
   */
  deviceId?: string
}
