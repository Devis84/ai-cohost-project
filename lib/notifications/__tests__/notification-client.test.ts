import { describe, it, expect } from 'vitest'
import type {
  NotificationClient,
  NotificationPermissionResult,
  NotificationPlatform,
  CapacitorNotificationClientConfig,
} from '@/lib/notifications/notification-client'

/**
 * Contract tests for the NotificationClient interface.
 * These tests verify that any object shaped to the interface satisfies
 * the expected structural contract — no implementation is tested here.
 */
describe('NotificationClient interface contract', () => {
  it('accepts an object that satisfies all interface members', () => {
    // Arrange
    const client: NotificationClient = {
      isSupported: () => true,
      requestPermission: async () => 'granted' as NotificationPermissionResult,
      register: async () => undefined,
      unregister: async () => undefined,
      getPlatform: () => 'web' as NotificationPlatform,
    }

    // Assert — structural compatibility at compile time; runtime check via function call
    expect(typeof client.isSupported).toBe('function')
    expect(typeof client.requestPermission).toBe('function')
    expect(typeof client.register).toBe('function')
    expect(typeof client.unregister).toBe('function')
    expect(typeof client.getPlatform).toBe('function')
  })

  it('isSupported can return a boolean synchronously', () => {
    const client: NotificationClient = {
      isSupported: () => false,
      requestPermission: async () => 'denied',
      register: async () => undefined,
      unregister: async () => undefined,
      getPlatform: () => 'unsupported',
    }

    expect(client.isSupported()).toBe(false)
  })

  it('isSupported can return a Promise<boolean>', async () => {
    const client: NotificationClient = {
      isSupported: () => Promise.resolve(true),
      requestPermission: async () => 'granted',
      register: async () => undefined,
      unregister: async () => undefined,
      getPlatform: () => 'android',
    }

    await expect(client.isSupported()).resolves.toBe(true)
  })

  it('getPlatform returns one of the allowed platform literals', () => {
    const platforms: NotificationPlatform[] = ['web', 'ios', 'android', 'unsupported']

    for (const platform of platforms) {
      const client: NotificationClient = {
        isSupported: () => true,
        requestPermission: async () => 'granted',
        register: async () => undefined,
        unregister: async () => undefined,
        getPlatform: () => platform,
      }

      expect(platforms).toContain(client.getPlatform())
    }
  })

  it('requestPermission resolves to a valid permission result', async () => {
    const validResults: NotificationPermissionResult[] = ['granted', 'denied', 'default']

    for (const result of validResults) {
      const client: NotificationClient = {
        isSupported: () => true,
        requestPermission: async () => result,
        register: async () => undefined,
        unregister: async () => undefined,
        getPlatform: () => 'web',
      }

      await expect(client.requestPermission()).resolves.toBe(result)
    }
  })
})

describe('CapacitorNotificationClientConfig interface contract', () => {
  it('accepts config with required onNavigate and optional deviceId', () => {
    // Arrange
    const config: CapacitorNotificationClientConfig = {
      onNavigate: (_route: string) => undefined,
    }

    // Assert
    expect(typeof config.onNavigate).toBe('function')
    expect(config.deviceId).toBeUndefined()
  })

  it('accepts config with deviceId set', () => {
    const config: CapacitorNotificationClientConfig = {
      onNavigate: (_route: string) => undefined,
      deviceId: 'device-abc-123',
    }

    expect(config.deviceId).toBe('device-abc-123')
  })

  it('onNavigate receives a route string', () => {
    const received: string[] = []
    const config: CapacitorNotificationClientConfig = {
      onNavigate: (route: string) => {
        received.push(route)
      },
    }

    config.onNavigate('/host/requests/abc-123')
    expect(received).toEqual(['/host/requests/abc-123'])
  })
})
