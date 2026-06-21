import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Capacitor mocks — hoisted so they are available inside vi.mock factories ──

const {
  mockIsNativePlatform,
  mockGetPlatform,
  mockRequestPermissions,
  mockRegister,
  mockCreateChannel,
  mockAddListenerImpl,
} = vi.hoisted(() => ({
  mockIsNativePlatform: vi.fn<() => boolean>(),
  mockGetPlatform: vi.fn<() => string>(),
  mockRequestPermissions: vi.fn(),
  mockRegister: vi.fn(),
  mockCreateChannel: vi.fn(),
  mockAddListenerImpl: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: mockIsNativePlatform,
    getPlatform: mockGetPlatform,
  },
}))

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions: mockRequestPermissions,
    register: mockRegister,
    createChannel: mockCreateChannel,
    addListener: mockAddListenerImpl,
  },
}))

// ── Backend fetch mock ────────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

// ── Module under test ─────────────────────────────────────────────────────────

import { CapacitorNotificationClient } from '@/lib/notifications/capacitor-notification-client'
import type { CapacitorNotificationClientConfig } from '@/lib/notifications/notification-client'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<CapacitorNotificationClientConfig> = {}): CapacitorNotificationClientConfig {
  return {
    onNavigate: vi.fn(),
    ...overrides,
  }
}

function makeSuccessfulRegistrationDevice() {
  return {
    id: 'device-native-1',
    platform: 'android',
    app_type: 'native',
  }
}

// Captures the callback registered via addListener for a given event name.
function captureListener(eventName: string): (...args: unknown[]) => unknown {
  const call = mockAddListenerImpl.mock.calls.find(
    (args) => args[0] === eventName,
  )
  if (!call) {
    throw new Error(`No listener registered for event: ${eventName}`)
  }
  return call[1] as (...args: unknown[]) => unknown
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('CapacitorNotificationClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: running on Android native
    mockIsNativePlatform.mockReturnValue(true)
    mockGetPlatform.mockReturnValue('android')

    // Default permission: granted
    mockRequestPermissions.mockResolvedValue({ receive: 'granted' })

    // Default register: resolves immediately
    mockRegister.mockResolvedValue(undefined)

    // Default channel creation: resolves immediately
    mockCreateChannel.mockResolvedValue(undefined)

    // Default addListener: no-op (returns a fake handle)
    mockAddListenerImpl.mockResolvedValue({ remove: vi.fn() })

    // Default backend: registration succeeds
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: makeSuccessfulRegistrationDevice(),
      }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── isSupported ────────────────────────────────────────────────────────────

  describe('isSupported', () => {
    it('returns true when running on a native platform', () => {
      mockIsNativePlatform.mockReturnValue(true)
      const client = new CapacitorNotificationClient(makeConfig())
      expect(client.isSupported()).toBe(true)
    })

    it('returns false when not running on a native platform', () => {
      mockIsNativePlatform.mockReturnValue(false)
      const client = new CapacitorNotificationClient(makeConfig())
      expect(client.isSupported()).toBe(false)
    })
  })

  // ── getPlatform ────────────────────────────────────────────────────────────

  describe('getPlatform', () => {
    it('returns android when Capacitor platform is android', () => {
      mockGetPlatform.mockReturnValue('android')
      const client = new CapacitorNotificationClient(makeConfig())
      expect(client.getPlatform()).toBe('android')
    })

    it('returns ios when Capacitor platform is ios', () => {
      mockGetPlatform.mockReturnValue('ios')
      const client = new CapacitorNotificationClient(makeConfig())
      expect(client.getPlatform()).toBe('ios')
    })

    it('returns unsupported for unknown platform string', () => {
      mockGetPlatform.mockReturnValue('electron')
      const client = new CapacitorNotificationClient(makeConfig())
      expect(client.getPlatform()).toBe('unsupported')
    })

    it('returns web when Capacitor returns web', () => {
      mockGetPlatform.mockReturnValue('web')
      const client = new CapacitorNotificationClient(makeConfig())
      expect(client.getPlatform()).toBe('web')
    })
  })

  // ── requestPermission ──────────────────────────────────────────────────────

  describe('requestPermission', () => {
    it('returns granted when Capacitor permission is granted', async () => {
      mockRequestPermissions.mockResolvedValue({ receive: 'granted' })
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.requestPermission()).resolves.toBe('granted')
    })

    it('returns denied when Capacitor permission is denied', async () => {
      mockRequestPermissions.mockResolvedValue({ receive: 'denied' })
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.requestPermission()).resolves.toBe('denied')
    })

    it('returns default when Capacitor permission is prompt', async () => {
      mockRequestPermissions.mockResolvedValue({ receive: 'prompt' })
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.requestPermission()).resolves.toBe('default')
    })

    it('returns denied when Capacitor permission result is unrecognised', async () => {
      mockRequestPermissions.mockResolvedValue({ receive: 'unknown-state' })
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.requestPermission()).resolves.toBe('denied')
    })

    it('throws when requestPermissions rejects', async () => {
      mockRequestPermissions.mockRejectedValue(new Error('Permission API error'))
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.requestPermission()).rejects.toThrow('Permission API error')
    })
  })

  // ── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('calls PushNotifications.register after creating the channel', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()
      expect(mockCreateChannel).toHaveBeenCalledOnce()
      expect(mockRegister).toHaveBeenCalledOnce()
    })

    it('creates the guest-requests channel with high importance', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      expect(mockCreateChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'guest-requests',
          importance: 5,
        }),
      )
    })

    it('attaches a registration listener before calling register', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const listenerNames = mockAddListenerImpl.mock.calls.map(
        (args) => args[0] as string,
      )
      expect(listenerNames).toContain('registration')
    })

    it('posts FCM token to /api/host/devices/register on registration event', async () => {
      const client = new CapacitorNotificationClient(makeConfig())

      // Simulate registration — call register() which sets up listeners
      await client.register()

      // Find and invoke the 'registration' listener with a fake token
      const registrationListener = captureListener('registration')
      await (registrationListener as (token: { value: string }) => Promise<void>)({ value: 'fcm-token-android' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/host/devices/register',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('fcm-token-android'),
        }),
      )
    })

    it('sends platform android and app_type native in registration payload', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const registrationListener = captureListener('registration')
      await (registrationListener as (token: { value: string }) => Promise<void>)({ value: 'fcm-token-android' })

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body as string)
      expect(body.platform).toBe('android')
      expect(body.app_type).toBe('native')
    })

    it('adds pushNotificationReceived listener for foreground notifications', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const listenerNames = mockAddListenerImpl.mock.calls.map(
        (args) => args[0] as string,
      )
      expect(listenerNames).toContain('pushNotificationReceived')
    })

    it('adds pushNotificationActionPerformed listener for taps', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const listenerNames = mockAddListenerImpl.mock.calls.map(
        (args) => args[0] as string,
      )
      expect(listenerNames).toContain('pushNotificationActionPerformed')
    })

    it('throws when PushNotifications.register rejects', async () => {
      mockRegister.mockRejectedValue(new Error('Registration failed'))
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.register()).rejects.toThrow('Registration failed')
    })

    it('throws when channel creation fails', async () => {
      mockCreateChannel.mockRejectedValue(new Error('Channel creation failed'))
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.register()).rejects.toThrow('Channel creation failed')
    })

    it('throws when backend device registration fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Unauthorized' }),
      })
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const registrationListener = captureListener('registration')
      await expect(
        (registrationListener as (token: { value: string }) => Promise<void>)({ value: 'token' }),
      ).rejects.toThrow('Unauthorized')
    })

    it('throws when backend returns success without device data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: null }),
      })
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const registrationListener = captureListener('registration')
      await expect(
        (registrationListener as (token: { value: string }) => Promise<void>)({ value: 'token' }),
      ).rejects.toThrow()
    })
  })

  // ── unregister ─────────────────────────────────────────────────────────────

  describe('unregister', () => {
    it('posts device_id to /api/host/devices/unregister', async () => {
      const config = makeConfig({ deviceId: 'device-native-1' })
      const client = new CapacitorNotificationClient(config)

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      await client.unregister()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/host/devices/unregister',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"device_id":"device-native-1"'),
        }),
      )
    })

    it('throws when deviceId is not set', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.unregister()).rejects.toThrow('deviceId is required')
    })

    it('throws when unregister endpoint returns error', async () => {
      const config = makeConfig({ deviceId: 'device-native-1' })
      const client = new CapacitorNotificationClient(config)

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Device not found' }),
      })

      await expect(client.unregister()).rejects.toThrow('Device not found')
    })

    it('throws when fetch rejects during unregister', async () => {
      const config = makeConfig({ deviceId: 'device-native-1' })
      const client = new CapacitorNotificationClient(config)

      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(client.unregister()).rejects.toThrow('Network error')
    })
  })

  // ── notification tap deep linking ──────────────────────────────────────────

  describe('pushNotificationActionPerformed (tap deep linking)', () => {
    it('calls onNavigate with route from notification data', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const actionListener = captureListener('pushNotificationActionPerformed')
      ;(actionListener as (action: unknown) => void)({
        notification: {
          data: { route: '/host/requests/req-abc-123' },
        },
      })

      expect(onNavigate).toHaveBeenCalledWith('/host/requests/req-abc-123')
    })

    it('calls onNavigate with /dashboard fallback when route is missing', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const actionListener = captureListener('pushNotificationActionPerformed')
      ;(actionListener as (action: unknown) => void)({
        notification: { data: {} },
      })

      expect(onNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('calls onNavigate with /dashboard fallback when data is null', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const actionListener = captureListener('pushNotificationActionPerformed')
      ;(actionListener as (action: unknown) => void)({
        notification: { data: null },
      })

      expect(onNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('calls onNavigate with /dashboard fallback for protocol-relative URL in route', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const actionListener = captureListener('pushNotificationActionPerformed')
      ;(actionListener as (action: unknown) => void)({
        notification: { data: { route: '//evil.com/steal' } },
      })

      expect(onNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('calls onNavigate with /dashboard when action has no notification', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const actionListener = captureListener('pushNotificationActionPerformed')
      ;(actionListener as (action: unknown) => void)({})

      expect(onNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('navigates to /host/requests/:id when id is a UUID', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const actionListener = captureListener('pushNotificationActionPerformed')
      ;(actionListener as (action: unknown) => void)({
        notification: {
          data: { route: '/host/requests/550e8400-e29b-41d4-a716-446655440000' },
        },
      })

      expect(onNavigate).toHaveBeenCalledWith(
        '/host/requests/550e8400-e29b-41d4-a716-446655440000',
      )
    })
  })

  // ── foreground notification received ──────────────────────────────────────

  describe('pushNotificationReceived (foreground)', () => {
    it('does not call onNavigate when a foreground notification arrives', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const receivedListener = captureListener('pushNotificationReceived')
      ;(receivedListener as (notification: unknown) => void)({
        title: 'Guest Request',
        body: 'A guest needs help',
        data: { route: '/host/requests/abc' },
      })

      expect(onNavigate).not.toHaveBeenCalled()
    })

    it('does not call onNavigate on iOS when a foreground notification arrives (OS handles display via presentationOptions)', async () => {
      // On iOS the capacitor.config.ts presentationOptions config instructs the
      // OS to display the notification in the foreground automatically. The
      // pushNotificationReceived listener therefore remains a deliberate no-op.
      mockGetPlatform.mockReturnValue('ios')
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const receivedListener = captureListener('pushNotificationReceived')
      ;(receivedListener as (notification: unknown) => void)({
        title: 'New Guest Request',
        body: 'Someone needs help',
        data: { route: '/host/requests/ios-test' },
      })

      expect(onNavigate).not.toHaveBeenCalled()
    })
  })

  // ── iOS-specific registration ──────────────────────────────────────────────

  describe('iOS registration', () => {
    beforeEach(() => {
      mockIsNativePlatform.mockReturnValue(true)
      mockGetPlatform.mockReturnValue('ios')
    })

    it('sends platform ios in registration payload when running on iOS', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const registrationListener = captureListener('registration')
      await (registrationListener as (token: { value: string }) => Promise<void>)({ value: 'apns-fcm-token-ios' })

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body as string)
      expect(body.platform).toBe('ios')
    })

    it('sends app_type native for iOS registration', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const registrationListener = captureListener('registration')
      await (registrationListener as (token: { value: string }) => Promise<void>)({ value: 'apns-fcm-token-ios' })

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body as string)
      expect(body.app_type).toBe('native')
    })

    it('posts FCM token (from APNs bridge) to /api/host/devices/register on iOS', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const registrationListener = captureListener('registration')
      await (registrationListener as (token: { value: string }) => Promise<void>)({ value: 'apns-fcm-token-ios' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/host/devices/register',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('apns-fcm-token-ios'),
        }),
      )
    })

    it('sends permission_status granted in iOS registration payload', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const registrationListener = captureListener('registration')
      await (registrationListener as (token: { value: string }) => Promise<void>)({ value: 'apns-fcm-token-ios' })

      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body as string)
      expect(body.permission_status).toBe('granted')
    })

    it('attaches all three listeners (registration, foreground, tap) on iOS', async () => {
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const listenerNames = mockAddListenerImpl.mock.calls.map((args) => args[0] as string)
      expect(listenerNames).toContain('registration')
      expect(listenerNames).toContain('pushNotificationReceived')
      expect(listenerNames).toContain('pushNotificationActionPerformed')
    })

    it('throws when backend device registration fails on iOS', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'iOS token rejected' }),
      })
      const client = new CapacitorNotificationClient(makeConfig())
      await client.register()

      const registrationListener = captureListener('registration')
      await expect(
        (registrationListener as (token: { value: string }) => Promise<void>)({ value: 'apns-fcm-token-ios' }),
      ).rejects.toThrow('iOS token rejected')
    })
  })

  // ── iOS permission flow ────────────────────────────────────────────────────

  describe('requestPermission on iOS', () => {
    beforeEach(() => {
      mockGetPlatform.mockReturnValue('ios')
      mockIsNativePlatform.mockReturnValue(true)
    })

    it('returns granted when iOS user allows notifications', async () => {
      mockRequestPermissions.mockResolvedValue({ receive: 'granted' })
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.requestPermission()).resolves.toBe('granted')
    })

    it('returns denied when iOS user denies notifications (one-shot dialog)', async () => {
      mockRequestPermissions.mockResolvedValue({ receive: 'denied' })
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.requestPermission()).resolves.toBe('denied')
    })

    it('returns default when iOS shows the initial permission prompt', async () => {
      // iOS shows a native alert once; Capacitor surfaces this as "prompt"
      mockRequestPermissions.mockResolvedValue({ receive: 'prompt' })
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.requestPermission()).resolves.toBe('default')
    })

    it('throws when requestPermissions rejects on iOS', async () => {
      mockRequestPermissions.mockRejectedValue(new Error('iOS permission API error'))
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.requestPermission()).rejects.toThrow('iOS permission API error')
    })
  })

  // ── iOS deep-link tap ──────────────────────────────────────────────────────

  describe('pushNotificationActionPerformed on iOS (deep linking)', () => {
    beforeEach(() => {
      mockGetPlatform.mockReturnValue('ios')
      mockIsNativePlatform.mockReturnValue(true)
    })

    it('calls onNavigate with the route from a tapped iOS push notification', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const actionListener = captureListener('pushNotificationActionPerformed')
      ;(actionListener as (action: unknown) => void)({
        notification: { data: { route: '/host/requests/ios-req-456' } },
      })

      expect(onNavigate).toHaveBeenCalledWith('/host/requests/ios-req-456')
    })

    it('falls back to /dashboard when iOS notification tap has no route', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const actionListener = captureListener('pushNotificationActionPerformed')
      ;(actionListener as (action: unknown) => void)({
        notification: { data: {} },
      })

      expect(onNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('falls back to /dashboard when iOS notification tap data contains a protocol-relative URL', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const actionListener = captureListener('pushNotificationActionPerformed')
      ;(actionListener as (action: unknown) => void)({
        notification: { data: { route: '//attacker.example/steal' } },
      })

      expect(onNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  // ── extractNotificationFromAction branch: null action ─────────────────────

  describe('pushNotificationActionPerformed with null action (branch coverage)', () => {
    it('calls onNavigate with /dashboard when action is null', async () => {
      const onNavigate = vi.fn()
      const client = new CapacitorNotificationClient(makeConfig({ onNavigate }))
      await client.register()

      const actionListener = captureListener('pushNotificationActionPerformed')
      ;(actionListener as (action: unknown) => void)(null)

      expect(onNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('returns default for prompt-with-rationale permission', async () => {
      mockRequestPermissions.mockResolvedValue({ receive: 'prompt-with-rationale' })
      const client = new CapacitorNotificationClient(makeConfig())
      await expect(client.requestPermission()).resolves.toBe('default')
    })
  })
})
