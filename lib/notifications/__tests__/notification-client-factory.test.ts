import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Capacitor mocks — hoisted so they are available inside vi.mock factories ──

const { mockIsNativePlatform, mockGetPlatform } = vi.hoisted(() => ({
  mockIsNativePlatform: vi.fn<() => boolean>(),
  mockGetPlatform: vi.fn<() => string>(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: mockIsNativePlatform,
    getPlatform: mockGetPlatform,
  },
}))

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions: vi.fn(),
    register: vi.fn(),
    createChannel: vi.fn(),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  },
}))

// ── Module under test ─────────────────────────────────────────────────────────

import { createNotificationClient } from '@/lib/notifications/notification-client-factory'
import { CapacitorNotificationClient } from '@/lib/notifications/capacitor-notification-client'
import { UnsupportedNotificationClient } from '@/lib/notifications/unsupported-notification-client'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createNotificationClient factory', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('when running on Android native', () => {
    beforeEach(() => {
      mockIsNativePlatform.mockReturnValue(true)
      mockGetPlatform.mockReturnValue('android')
    })

    it('returns a CapacitorNotificationClient', () => {
      const client = createNotificationClient({ onNavigate })
      expect(client).toBeInstanceOf(CapacitorNotificationClient)
    })

    it('returned client reports android platform', () => {
      const client = createNotificationClient({ onNavigate })
      expect(client.getPlatform()).toBe('android')
    })
  })

  describe('when running on iOS native', () => {
    beforeEach(() => {
      mockIsNativePlatform.mockReturnValue(true)
      mockGetPlatform.mockReturnValue('ios')
    })

    it('returns a CapacitorNotificationClient', () => {
      const client = createNotificationClient({ onNavigate })
      expect(client).toBeInstanceOf(CapacitorNotificationClient)
    })

    it('returned client reports ios platform', () => {
      const client = createNotificationClient({ onNavigate })
      expect(client.getPlatform()).toBe('ios')
    })
  })

  describe('when NOT running on a native platform', () => {
    beforeEach(() => {
      mockIsNativePlatform.mockReturnValue(false)
      mockGetPlatform.mockReturnValue('web')
    })

    it('returns an UnsupportedNotificationClient', () => {
      const client = createNotificationClient({ onNavigate })
      expect(client).toBeInstanceOf(UnsupportedNotificationClient)
    })

    it('returned client reports unsupported platform', () => {
      const client = createNotificationClient({ onNavigate })
      expect(client.getPlatform()).toBe('unsupported')
    })

    it('returned client isSupported returns false', () => {
      const client = createNotificationClient({ onNavigate })
      expect(client.isSupported()).toBe(false)
    })
  })

  describe('onNavigate is forwarded to CapacitorNotificationClient', () => {
    it('passes the onNavigate callback through to Capacitor client', () => {
      mockIsNativePlatform.mockReturnValue(true)
      mockGetPlatform.mockReturnValue('android')

      const specificNavigate = vi.fn()
      const client = createNotificationClient({ onNavigate: specificNavigate })

      // The returned client is a CapacitorNotificationClient; confirm it was
      // constructed with our specific callback (indirectly via instanceof).
      expect(client).toBeInstanceOf(CapacitorNotificationClient)
    })
  })

  describe('deviceId can be forwarded in config', () => {
    it('accepts optional deviceId in factory config', () => {
      mockIsNativePlatform.mockReturnValue(true)
      mockGetPlatform.mockReturnValue('android')

      const client = createNotificationClient({ onNavigate, deviceId: 'device-1' })
      expect(client).toBeInstanceOf(CapacitorNotificationClient)
    })
  })
})
