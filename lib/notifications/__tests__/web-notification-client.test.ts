import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock firebase/messaging before importing the module under test
vi.mock('firebase/messaging', () => ({
  getToken: vi.fn(),
  onMessage: vi.fn(),
  isSupported: vi.fn(),
}))

vi.mock('@/lib/firebase/firebase-client', () => ({
  getFirebaseMessaging: vi.fn(),
}))

import * as firebaseMessaging from 'firebase/messaging'
import * as firebaseClient from '@/lib/firebase/firebase-client'
import {
  isNotificationSupported,
  requestNotificationPermission,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  onTokenRefresh,
  getWebPlatform,
} from '@/lib/notifications/web-notification-client'

const mockGetToken = vi.mocked(firebaseMessaging.getToken)
const mockOnMessage = vi.mocked(firebaseMessaging.onMessage)
const mockIsSupported = vi.mocked(firebaseMessaging.isSupported)
const mockGetFirebaseMessaging = vi.mocked(firebaseClient.getFirebaseMessaging)

function setupNavigatorPermissions(state: NotificationPermission) {
  Object.defineProperty(global, 'Notification', {
    writable: true,
    value: {
      permission: state,
      requestPermission: vi.fn().mockResolvedValue(state),
    },
  })
}

function setupServiceWorker(supported: boolean) {
  if (supported) {
    Object.defineProperty(global.navigator, 'serviceWorker', {
      writable: true,
      value: {
        register: vi.fn().mockResolvedValue({ scope: '/' }),
        ready: Promise.resolve({ pushManager: {} }),
      },
    })
  } else {
    Object.defineProperty(global.navigator, 'serviceWorker', {
      writable: true,
      value: undefined,
    })
  }
}

describe('web-notification-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: supported environment
    setupNavigatorPermissions('default')
    setupServiceWorker(true)
    mockIsSupported.mockResolvedValue(true)
    mockGetFirebaseMessaging.mockReturnValue({} as ReturnType<typeof firebaseClient.getFirebaseMessaging>)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── isNotificationSupported ───────────────────────────────────

  describe('isNotificationSupported', () => {
    it('returns true when Notification API and serviceWorker are available', async () => {
      mockIsSupported.mockResolvedValue(true)
      const result = await isNotificationSupported()
      expect(result).toBe(true)
    })

    it('returns false when Notification API is not available', async () => {
      const originalNotification = global.Notification
      // @ts-expect-error - intentionally removing for test
      global.Notification = undefined
      mockIsSupported.mockResolvedValue(false)
      const result = await isNotificationSupported()
      expect(result).toBe(false)
      global.Notification = originalNotification
    })

    it('returns false when serviceWorker is not available', async () => {
      setupServiceWorker(false)
      const result = await isNotificationSupported()
      expect(result).toBe(false)
    })

    it('returns false when firebase isSupported returns false', async () => {
      mockIsSupported.mockResolvedValue(false)
      const result = await isNotificationSupported()
      expect(result).toBe(false)
    })

    it('returns false when firebase isSupported throws', async () => {
      mockIsSupported.mockRejectedValue(new Error('Not supported'))
      const result = await isNotificationSupported()
      expect(result).toBe(false)
    })
  })

  // ── requestNotificationPermission ────────────────────────────

  describe('requestNotificationPermission', () => {
    it('returns granted when user approves', async () => {
      Object.defineProperty(global, 'Notification', {
        writable: true,
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('granted'),
        },
      })
      const result = await requestNotificationPermission()
      expect(result).toBe('granted')
    })

    it('returns denied when user denies', async () => {
      Object.defineProperty(global, 'Notification', {
        writable: true,
        value: {
          permission: 'denied',
          requestPermission: vi.fn().mockResolvedValue('denied'),
        },
      })
      const result = await requestNotificationPermission()
      expect(result).toBe('denied')
    })

    it('returns default when permission is still default', async () => {
      Object.defineProperty(global, 'Notification', {
        writable: true,
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('default'),
        },
      })
      const result = await requestNotificationPermission()
      expect(result).toBe('default')
    })

    it('throws when Notification API is not available', async () => {
      const originalNotification = global.Notification
      // @ts-expect-error - intentionally removing for test
      global.Notification = undefined
      await expect(requestNotificationPermission()).rejects.toThrow(
        'Notification API not available'
      )
      global.Notification = originalNotification
    })
  })

  // ── registerForPushNotifications ─────────────────────────────

  describe('registerForPushNotifications', () => {
    beforeEach(() => {
      setupNavigatorPermissions('granted')
      mockGetToken.mockResolvedValue('fake-fcm-token-123')

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 'device-1' } }),
      })
    })

    it('returns device data when registration succeeds', async () => {
      const result = await registerForPushNotifications()
      expect(result).toEqual({ id: 'device-1' })
    })

    it('calls getToken with messaging instance and VAPID key', async () => {
      const fakeMessaging = { app: {} }
      mockGetFirebaseMessaging.mockReturnValue(fakeMessaging as ReturnType<typeof firebaseClient.getFirebaseMessaging>)

      await registerForPushNotifications()

      expect(mockGetToken).toHaveBeenCalledWith(
        fakeMessaging,
        expect.objectContaining({ vapidKey: expect.any(String) })
      )
    })

    it('posts token to /api/host/devices/register endpoint', async () => {
      await registerForPushNotifications()

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/host/devices/register',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: expect.stringContaining('fake-fcm-token-123'),
        })
      )
    })

    it('includes platform web in the registration payload', async () => {
      await registerForPushNotifications()

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const body = JSON.parse(fetchCall[1]?.body as string)
      expect(body.platform).toBe('web')
    })

    it('throws when messaging is not initialized', async () => {
      mockGetFirebaseMessaging.mockReturnValue(null)
      await expect(registerForPushNotifications()).rejects.toThrow(
        'Firebase messaging not initialized'
      )
    })

    it('throws when getToken returns empty string', async () => {
      mockGetToken.mockResolvedValue('')
      await expect(registerForPushNotifications()).rejects.toThrow(
        'Failed to get FCM token'
      )
    })

    it('throws when backend registration fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Unauthorized' }),
      })
      await expect(registerForPushNotifications()).rejects.toThrow(
        'Unauthorized'
      )
    })

    it('throws when fetch itself rejects (network error)', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'))
      await expect(registerForPushNotifications()).rejects.toThrow(
        'Network failure'
      )
    })
  })

  // ── unregisterFromPushNotifications ──────────────────────────

  describe('unregisterFromPushNotifications', () => {
    it('posts device_id to unregister endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 'device-1' } }),
      })

      await unregisterFromPushNotifications('device-1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/host/devices/unregister',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"device_id":"device-1"'),
        })
      )
    })

    it('throws when unregister endpoint returns error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Device not found' }),
      })

      await expect(unregisterFromPushNotifications('missing-device')).rejects.toThrow(
        'Device not found'
      )
    })

    it('throws when deviceId is empty', async () => {
      await expect(unregisterFromPushNotifications('')).rejects.toThrow(
        'deviceId is required'
      )
    })
  })

  // ── onTokenRefresh ────────────────────────────────────────────

  describe('onTokenRefresh', () => {
    it('subscribes to onMessage for token refresh simulation', () => {
      const unsubscribeMock = vi.fn()
      mockOnMessage.mockReturnValue(unsubscribeMock)
      const fakeMessaging = { app: {} }
      mockGetFirebaseMessaging.mockReturnValue(fakeMessaging as ReturnType<typeof firebaseClient.getFirebaseMessaging>)

      const callback = vi.fn()
      const unsubscribe = onTokenRefresh(callback)

      expect(mockOnMessage).toHaveBeenCalledWith(fakeMessaging, expect.any(Function))
      expect(typeof unsubscribe).toBe('function')
    })

    it('returns noop when messaging is not initialized', () => {
      mockGetFirebaseMessaging.mockReturnValue(null)
      const callback = vi.fn()
      const unsubscribe = onTokenRefresh(callback)

      expect(typeof unsubscribe).toBe('function')
      expect(() => unsubscribe()).not.toThrow()
    })
  })

  // ── getWebPlatform ────────────────────────────────────────────

  describe('getWebPlatform', () => {
    it('returns web', () => {
      expect(getWebPlatform()).toBe('web')
    })
  })
})
