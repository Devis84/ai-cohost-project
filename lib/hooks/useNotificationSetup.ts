'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  isNotificationSupported,
  requestNotificationPermission,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  onTokenRefresh,
} from '@/lib/notifications/web-notification-client'
import { createNotificationClient } from '@/lib/notifications/notification-client-factory'
import type { NotificationClient } from '@/lib/notifications/notification-client'
import type { PermissionStatus } from '@/types/notification-system'

export interface NotificationSetupState {
  readonly isSupported: boolean
  readonly isLoading: boolean
  readonly isRegistered: boolean
  readonly permissionStatus: PermissionStatus
  readonly error: string | null
  readonly deviceId: string | null
  requestAndRegister: () => Promise<void>
  unregister: () => Promise<void>
  sendTestNotification: () => Promise<void>
}

function readCurrentPermission(): PermissionStatus {
  if (typeof Notification === 'undefined') {
    return 'default'
  }

  const perm = Notification.permission
  if (perm === 'granted' || perm === 'denied') {
    return perm
  }

  return 'default'
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

export function useNotificationSetup(): NotificationSetupState {
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(
    readCurrentPermission,
  )
  const [error, setError] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)

  const deviceIdRef = useRef<string | null>(null)
  const nativeClientRef = useRef<NotificationClient | null>(null)

  const isNative = Capacitor.isNativePlatform()

  useLayoutEffect(() => {
    deviceIdRef.current = deviceId
  }, [deviceId])

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (isNative) {
        const client = createNotificationClient({
          onNavigate: (route) => {
            window.location.href = route
          },
        })
        nativeClientRef.current = client
        const supported = await client.isSupported()

        if (!cancelled) {
          setIsSupported(supported)
          setIsLoading(false)
        }
      } else {
        const supported = await isNotificationSupported()

        if (!cancelled) {
          setIsSupported(supported)
          setPermissionStatus(readCurrentPermission())
          setIsLoading(false)
        }
      }
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [isNative])

  useEffect(() => {
    if (isNative) return

    const unsubscribe = onTokenRefresh(async (newToken) => {
      const currentDeviceId = deviceIdRef.current

      if (!currentDeviceId) {
        return
      }

      try {
        await fetch('/api/host/devices/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification_token: newToken,
            platform: 'web',
            app_type: 'pwa',
            permission_status: 'granted',
          }),
        })
      } catch {
        // Token refresh sync failure is non-fatal
      }
    })

    return unsubscribe
  }, [isNative])

  const requestAndRegister = useCallback(async () => {
    if (!isSupported) {
      return
    }

    setError(null)

    try {
      if (isNative && nativeClientRef.current) {
        const permission = await nativeClientRef.current.requestPermission()
        setPermissionStatus(permission)

        if (permission !== 'granted') {
          return
        }

        await nativeClientRef.current.register()
        setIsRegistered(true)
      } else {
        const permission = await requestNotificationPermission()
        setPermissionStatus(permission)

        if (permission !== 'granted') {
          return
        }

        const device = await registerForPushNotifications()
        setDeviceId(device.id)
        setIsRegistered(true)
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    }
  }, [isSupported, isNative])

  const unregister = useCallback(async () => {
    setError(null)

    try {
      if (isNative && nativeClientRef.current) {
        await nativeClientRef.current.unregister()
        setIsRegistered(false)
      } else {
        if (!deviceId) {
          return
        }

        await unregisterFromPushNotifications(deviceId)
        setDeviceId(null)
        setIsRegistered(false)
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    }
  }, [deviceId, isNative])

  const sendTestNotification = useCallback(async () => {
    setError(null)

    try {
      const response = await fetch('/api/host/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const json = (await response.json()) as { success: boolean; error?: string }

      if (!response.ok || !json.success) {
        setError(json.error ?? 'Failed to send test notification')
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    }
  }, [])

  return {
    isSupported,
    isLoading,
    isRegistered,
    permissionStatus,
    error,
    deviceId,
    requestAndRegister,
    unregister,
    sendTestNotification,
  }
}
