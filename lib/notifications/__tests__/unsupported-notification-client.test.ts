import { describe, it, expect, beforeEach } from 'vitest'
import { UnsupportedNotificationClient } from '@/lib/notifications/unsupported-notification-client'
import type { NotificationClient } from '@/lib/notifications/notification-client'

describe('UnsupportedNotificationClient', () => {
  let client: UnsupportedNotificationClient

  beforeEach(() => {
    client = new UnsupportedNotificationClient()
  })

  it('satisfies the NotificationClient interface', () => {
    // Compile-time check via type assertion
    const typed: NotificationClient = client
    expect(typed).toBeDefined()
  })

  describe('isSupported', () => {
    it('returns false', () => {
      expect(client.isSupported()).toBe(false)
    })
  })

  describe('getPlatform', () => {
    it('returns unsupported', () => {
      expect(client.getPlatform()).toBe('unsupported')
    })
  })

  describe('requestPermission', () => {
    it('resolves to denied without throwing', async () => {
      await expect(client.requestPermission()).resolves.toBe('denied')
    })
  })

  describe('register', () => {
    it('resolves without throwing', async () => {
      await expect(client.register()).resolves.toBeUndefined()
    })
  })

  describe('unregister', () => {
    it('resolves without throwing', async () => {
      await expect(client.unregister()).resolves.toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('can be called multiple times without side effects', async () => {
      await client.register()
      await client.register()
      await client.unregister()
      expect(client.isSupported()).toBe(false)
    })
  })
})
