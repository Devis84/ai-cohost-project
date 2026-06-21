import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock the web notification client module
vi.mock('@/lib/notifications/web-notification-client', () => ({
  isNotificationSupported: vi.fn(),
  requestNotificationPermission: vi.fn(),
  registerForPushNotifications: vi.fn(),
  unregisterFromPushNotifications: vi.fn(),
  onTokenRefresh: vi.fn(() => vi.fn()),
  getWebPlatform: vi.fn(() => 'web'),
}))

import * as notificationClient from '@/lib/notifications/web-notification-client'
import { useNotificationSetup } from '@/lib/hooks/useNotificationSetup'

const mockIsSupported = vi.mocked(notificationClient.isNotificationSupported)
const mockRequestPermission = vi.mocked(notificationClient.requestNotificationPermission)
const mockRegister = vi.mocked(notificationClient.registerForPushNotifications)
const mockUnregister = vi.mocked(notificationClient.unregisterFromPushNotifications)
const mockOnTokenRefresh = vi.mocked(notificationClient.onTokenRefresh)

function setupNotification(permission: NotificationPermission) {
  Object.defineProperty(global, 'Notification', {
    writable: true,
    value: {
      permission,
      requestPermission: vi.fn().mockResolvedValue(permission),
    },
  })
}

describe('useNotificationSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupNotification('default')
    mockIsSupported.mockResolvedValue(true)
    mockOnTokenRefresh.mockReturnValue(vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Initial state ─────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with loading false after mount resolves', async () => {
      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('does NOT request permission on page load', async () => {
      renderHook(() => useNotificationSetup())

      await waitFor(() => {
        expect(mockRequestPermission).not.toHaveBeenCalled()
      })
    })

    it('does NOT register on page load', async () => {
      renderHook(() => useNotificationSetup())

      await waitFor(() => {
        expect(mockRegister).not.toHaveBeenCalled()
      })
    })

    it('checks isSupported on mount', async () => {
      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockIsSupported).toHaveBeenCalledOnce()
    })

    it('sets isSupported to true when API is available', async () => {
      mockIsSupported.mockResolvedValue(true)
      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true)
      })
    })

    it('sets isSupported to false when API is unavailable', async () => {
      mockIsSupported.mockResolvedValue(false)
      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => {
        expect(result.current.isSupported).toBe(false)
      })
    })

    it('reads existing permission status from Notification.permission', async () => {
      setupNotification('granted')
      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => {
        expect(result.current.permissionStatus).toBe('granted')
      })
    })

    it('starts as not registered', async () => {
      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(false)
      })
    })
  })

  // ── requestAndRegister ────────────────────────────────────────

  describe('requestAndRegister', () => {
    it('requests permission and registers when called explicitly', async () => {
      mockRequestPermission.mockResolvedValue('granted')
      mockRegister.mockResolvedValue({ id: 'device-1' } as unknown as Awaited<ReturnType<typeof notificationClient.registerForPushNotifications>>)

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.requestAndRegister()
      })

      expect(mockRequestPermission).toHaveBeenCalledOnce()
      expect(mockRegister).toHaveBeenCalledOnce()
    })

    it('sets permissionStatus to granted after user approves', async () => {
      mockRequestPermission.mockResolvedValue('granted')
      mockRegister.mockResolvedValue({ id: 'device-1' } as unknown as Awaited<ReturnType<typeof notificationClient.registerForPushNotifications>>)

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.requestAndRegister()
      })

      expect(result.current.permissionStatus).toBe('granted')
    })

    it('sets isRegistered to true after successful registration', async () => {
      mockRequestPermission.mockResolvedValue('granted')
      mockRegister.mockResolvedValue({ id: 'device-1' } as unknown as Awaited<ReturnType<typeof notificationClient.registerForPushNotifications>>)

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.requestAndRegister()
      })

      expect(result.current.isRegistered).toBe(true)
    })

    it('sets permissionStatus to denied when user denies', async () => {
      mockRequestPermission.mockResolvedValue('denied')

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.requestAndRegister()
      })

      expect(result.current.permissionStatus).toBe('denied')
      expect(result.current.isRegistered).toBe(false)
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('does NOT register when permission is denied', async () => {
      mockRequestPermission.mockResolvedValue('denied')

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.requestAndRegister()
      })

      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('sets error when registration throws', async () => {
      mockRequestPermission.mockResolvedValue('granted')
      mockRegister.mockRejectedValue(new Error('Registration failed'))

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.requestAndRegister()
      })

      expect(result.current.error).toBe('Registration failed')
      expect(result.current.isRegistered).toBe(false)
    })

    it('does nothing when notifications are unsupported', async () => {
      mockIsSupported.mockResolvedValue(false)

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.requestAndRegister()
      })

      expect(mockRequestPermission).not.toHaveBeenCalled()
      expect(mockRegister).not.toHaveBeenCalled()
    })
  })

  // ── unregister ────────────────────────────────────────────────

  describe('unregister', () => {
    it('calls unregisterFromPushNotifications with device id', async () => {
      mockRequestPermission.mockResolvedValue('granted')
      mockRegister.mockResolvedValue({ id: 'device-abc' } as unknown as Awaited<ReturnType<typeof notificationClient.registerForPushNotifications>>)
      mockUnregister.mockResolvedValue(undefined)

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // First register
      await act(async () => {
        await result.current.requestAndRegister()
      })

      // Then unregister
      await act(async () => {
        await result.current.unregister()
      })

      expect(mockUnregister).toHaveBeenCalledWith('device-abc')
    })

    it('sets isRegistered to false after unregistering', async () => {
      mockRequestPermission.mockResolvedValue('granted')
      mockRegister.mockResolvedValue({ id: 'device-abc' } as unknown as Awaited<ReturnType<typeof notificationClient.registerForPushNotifications>>)
      mockUnregister.mockResolvedValue(undefined)

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.requestAndRegister()
      })

      await act(async () => {
        await result.current.unregister()
      })

      expect(result.current.isRegistered).toBe(false)
    })

    it('does nothing when not registered', async () => {
      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.unregister()
      })

      expect(mockUnregister).not.toHaveBeenCalled()
    })

    it('sets error when unregister throws', async () => {
      mockRequestPermission.mockResolvedValue('granted')
      mockRegister.mockResolvedValue({ id: 'device-abc' } as unknown as Awaited<ReturnType<typeof notificationClient.registerForPushNotifications>>)
      mockUnregister.mockRejectedValue(new Error('Unregister failed'))

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.requestAndRegister()
      })

      await act(async () => {
        await result.current.unregister()
      })

      expect(result.current.error).toBe('Unregister failed')
    })
  })

  // ── sendTestNotification ──────────────────────────────────────

  describe('sendTestNotification', () => {
    it('posts to the test notification endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.sendTestNotification()
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/host/notifications/test',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('sets error when test notification fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Not authorized' }),
      })

      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.sendTestNotification()
      })

      expect(result.current.error).toBe('Not authorized')
    })
  })

  // ── token refresh ─────────────────────────────────────────────

  describe('token refresh', () => {
    it('subscribes to token refresh on mount', async () => {
      const { result } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(mockOnTokenRefresh).toHaveBeenCalledOnce()
    })

    it('calls unsubscribe on unmount', async () => {
      const unsubscribeMock = vi.fn()
      mockOnTokenRefresh.mockReturnValue(unsubscribeMock)

      const { result, unmount } = renderHook(() => useNotificationSetup())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      unmount()

      expect(unsubscribeMock).toHaveBeenCalledOnce()
    })
  })
})
