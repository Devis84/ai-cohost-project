/**
 * Minimal type declaration for @capacitor/cli configuration.
 * The package is a build-time / CLI tool and is not installed as a runtime
 * dependency. This declaration satisfies TypeScript when capacitor.config.ts
 * imports CapacitorConfig for type-checking.
 */
declare module '@capacitor/cli' {
  export interface CapacitorConfig {
    appId: string
    appName: string
    webDir: string
    server?: {
      androidScheme?: string
      url?: string
      cleartext?: boolean
    }
    plugins?: {
      PushNotifications?: {
        /**
         * iOS foreground presentation options.
         * Instructs the native UNUserNotificationCenter delegate (configured by
         * the Capacitor runtime) to display foreground notifications with the
         * specified presentation styles.
         */
        presentationOptions?: Array<'badge' | 'sound' | 'alert'>
      }
      [pluginName: string]: Record<string, unknown> | undefined
    }
  }
}

declare module '@capacitor/core' {
  export const Capacitor: {
    isNativePlatform(): boolean
    getPlatform(): string
  }
}

declare module '@capacitor/push-notifications' {
  export interface PermissionStatus {
    receive: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
  }

  export interface Channel {
    id: string
    name: string
    description?: string
    importance?: number
    visibility?: number
    vibration?: boolean
    sound?: string
  }

  export interface PushNotificationToken {
    value: string
  }

  export interface ListenerHandle {
    remove(): void
  }

  export const PushNotifications: {
    requestPermissions(): Promise<PermissionStatus>
    register(): Promise<void>
    createChannel(channel: Channel): Promise<void>
    addListener(
      eventName: string,
      callback: (...args: unknown[]) => void,
    ): Promise<ListenerHandle>
  }
}
