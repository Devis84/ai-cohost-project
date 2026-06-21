import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('NotificationService', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe('MockNotificationProvider', () => {
    it('send() logs title to console without the token and returns success result', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      const { MockNotificationProvider } = await import('../notification-service')
      const provider = new MockNotificationProvider()
      const result = await provider.send('test-token-123', {
        title: 'New request',
        body: 'Guest needs help',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
      expect(consoleSpy).toHaveBeenCalled()

      const loggedArgs = consoleSpy.mock.calls[0]
      const loggedString = JSON.stringify(loggedArgs)
      // Token must NOT appear in logs (security requirement)
      expect(loggedString).not.toContain('test-token-123')
      // Title is safe to log
      expect(loggedString).toContain('New request')

      consoleSpy.mockRestore()
    })

    it('send() returns a unique messageId each call', async () => {
      vi.spyOn(console, 'info').mockImplementation(() => {})

      const { MockNotificationProvider } = await import('../notification-service')
      const provider = new MockNotificationProvider()
      const result1 = await provider.send('token-a', { title: 'A', body: '' })
      const result2 = await provider.send('token-b', { title: 'B', body: '' })

      expect(result1.messageId).not.toBe(result2.messageId)
    })

    it('sendMulticast() logs payload and returns per-token results', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      const { MockNotificationProvider } = await import('../notification-service')
      const provider = new MockNotificationProvider()
      const tokens = ['token-1', 'token-2', 'token-3']
      const results = await provider.sendMulticast(tokens, {
        title: 'Multicast test',
        body: 'Hello all',
      })

      expect(results).toHaveLength(3)
      for (const result of results) {
        expect(result.success).toBe(true)
        expect(result.messageId).toBeDefined()
      }
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('sendMulticast() with empty tokens array returns empty results', async () => {
      vi.spyOn(console, 'info').mockImplementation(() => {})

      const { MockNotificationProvider } = await import('../notification-service')
      const provider = new MockNotificationProvider()
      const results = await provider.sendMulticast([], { title: 'T', body: 'B' })

      expect(results).toHaveLength(0)
    })
  })

  describe('FirebaseNotificationProvider', () => {
    it('send() calls FCM messaging.send and returns messageId', async () => {
      const mockMessageId = 'projects/test/messages/abc123'
      const mockSend = vi.fn().mockResolvedValue(mockMessageId)
      const mockMessaging = { send: mockSend, sendEachForMulticast: vi.fn() }

      vi.doMock('../firebase-admin', () => ({
        getFirebaseMessaging: vi.fn().mockReturnValue(mockMessaging),
      }))

      const { FirebaseNotificationProvider } = await import('../notification-service')
      const provider = new FirebaseNotificationProvider()
      const result = await provider.send('device-token', {
        title: 'Test title',
        body: 'Test body',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe(mockMessageId)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'device-token',
          notification: expect.objectContaining({
            title: 'Test title',
            body: 'Test body',
          }),
        })
      )
    })

    it('send() returns failure result when FCM throws', async () => {
      const mockMessaging = {
        send: vi.fn().mockRejectedValue(new Error('FCM error')),
      }

      vi.doMock('../firebase-admin', () => ({
        getFirebaseMessaging: vi.fn().mockReturnValue(mockMessaging),
      }))

      const { FirebaseNotificationProvider } = await import('../notification-service')
      const provider = new FirebaseNotificationProvider()
      const result = await provider.send('bad-token', { title: 'T', body: 'B' })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('sendMulticast() sends to all tokens and aggregates results', async () => {
      const mockResponse = {
        responses: [
          { success: true, messageId: 'msg-1' },
          { success: true, messageId: 'msg-2' },
        ],
        successCount: 2,
        failureCount: 0,
      }
      const mockMessaging = {
        sendEachForMulticast: vi.fn().mockResolvedValue(mockResponse),
      }

      vi.doMock('../firebase-admin', () => ({
        getFirebaseMessaging: vi.fn().mockReturnValue(mockMessaging),
      }))

      const { FirebaseNotificationProvider } = await import('../notification-service')
      const provider = new FirebaseNotificationProvider()
      const results = await provider.sendMulticast(['token-1', 'token-2'], {
        title: 'MC',
        body: 'Multicast',
      })

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[0].messageId).toBe('msg-1')
    })

    it('sendMulticast() returns failure results when FCM throws', async () => {
      const mockMessaging = {
        sendEachForMulticast: vi.fn().mockRejectedValue(new Error('Network error')),
      }

      vi.doMock('../firebase-admin', () => ({
        getFirebaseMessaging: vi.fn().mockReturnValue(mockMessaging),
      }))

      const { FirebaseNotificationProvider } = await import('../notification-service')
      const provider = new FirebaseNotificationProvider()
      const results = await provider.sendMulticast(['token-1', 'token-2'], {
        title: 'T',
        body: 'B',
      })

      expect(results).toHaveLength(2)
      for (const result of results) {
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
      }
    })
  })

  describe('FirebaseNotificationProvider — null messaging paths', () => {
    it('send() returns failure when getFirebaseMessaging returns null', async () => {
      vi.doMock('../firebase-admin', () => ({
        getFirebaseMessaging: vi.fn().mockReturnValue(null),
      }))

      const { FirebaseNotificationProvider } = await import('../notification-service')
      const provider = new FirebaseNotificationProvider()
      const result = await provider.send('token', { title: 'T', body: 'B' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not initialized')
    })

    it('sendMulticast() returns failure per token when getFirebaseMessaging returns null', async () => {
      vi.doMock('../firebase-admin', () => ({
        getFirebaseMessaging: vi.fn().mockReturnValue(null),
      }))

      const { FirebaseNotificationProvider } = await import('../notification-service')
      const provider = new FirebaseNotificationProvider()
      const results = await provider.sendMulticast(['t1', 't2'], { title: 'T', body: 'B' })

      expect(results).toHaveLength(2)
      for (const r of results) {
        expect(r.success).toBe(false)
        expect(r.error).toContain('not initialized')
      }
    })

    it('sendMulticast() handles individual FCM response failures', async () => {
      const mockResponse = {
        responses: [
          { success: true, messageId: 'msg-ok' },
          { success: false, error: { message: 'Token not registered' } },
        ],
        successCount: 1,
        failureCount: 1,
      }
      const mockMessaging = {
        sendEachForMulticast: vi.fn().mockResolvedValue(mockResponse),
      }
      vi.doMock('../firebase-admin', () => ({
        getFirebaseMessaging: vi.fn().mockReturnValue(mockMessaging),
      }))

      const { FirebaseNotificationProvider } = await import('../notification-service')
      const provider = new FirebaseNotificationProvider()
      const results = await provider.sendMulticast(['token-ok', 'token-bad'], {
        title: 'T',
        body: 'B',
      })

      expect(results[0].success).toBe(true)
      expect(results[0].messageId).toBe('msg-ok')
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBe('Token not registered')
    })

    it('sendMulticast() uses fallback error message when FCM response has no error message', async () => {
      const mockResponse = {
        responses: [
          { success: false, error: {} },
        ],
        successCount: 0,
        failureCount: 1,
      }
      const mockMessaging = {
        sendEachForMulticast: vi.fn().mockResolvedValue(mockResponse),
      }
      vi.doMock('../firebase-admin', () => ({
        getFirebaseMessaging: vi.fn().mockReturnValue(mockMessaging),
      }))

      const { FirebaseNotificationProvider } = await import('../notification-service')
      const provider = new FirebaseNotificationProvider()
      const results = await provider.sendMulticast(['token'], { title: 'T', body: 'B' })

      expect(results[0].success).toBe(false)
      expect(results[0].error).toBe('FCM delivery failed')
    })

    it('send() returns Unknown FCM error when thrown error is not an Error instance', async () => {
      const mockMessaging = {
        send: vi.fn().mockRejectedValue('string error'),
      }
      vi.doMock('../firebase-admin', () => ({
        getFirebaseMessaging: vi.fn().mockReturnValue(mockMessaging),
      }))

      const { FirebaseNotificationProvider } = await import('../notification-service')
      const provider = new FirebaseNotificationProvider()
      const result = await provider.send('token', { title: 'T', body: 'B' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown FCM error')
    })

    it('sendMulticast() returns Unknown FCM error when thrown non-Error value', async () => {
      const mockMessaging = {
        sendEachForMulticast: vi.fn().mockRejectedValue('raw string error'),
      }
      vi.doMock('../firebase-admin', () => ({
        getFirebaseMessaging: vi.fn().mockReturnValue(mockMessaging),
      }))

      const { FirebaseNotificationProvider } = await import('../notification-service')
      const provider = new FirebaseNotificationProvider()
      const results = await provider.sendMulticast(['t1', 't2'], { title: 'T', body: 'B' })

      expect(results).toHaveLength(2)
      for (const r of results) {
        expect(r.success).toBe(false)
        expect(r.error).toBe('Unknown FCM error')
      }
    })
  })

  describe('getNotificationProvider', () => {
    it('returns MockNotificationProvider when FIREBASE_PROJECT_ID is not set', async () => {
      delete process.env.FIREBASE_PROJECT_ID

      const { getNotificationProvider, MockNotificationProvider } = await import(
        '../notification-service'
      )
      const provider = getNotificationProvider()

      expect(provider).toBeInstanceOf(MockNotificationProvider)
    })

    it('returns FirebaseNotificationProvider when FIREBASE_PROJECT_ID is set', async () => {
      process.env.FIREBASE_PROJECT_ID = 'my-project'

      const { getNotificationProvider, FirebaseNotificationProvider } = await import(
        '../notification-service'
      )
      const provider = getNotificationProvider()

      expect(provider).toBeInstanceOf(FirebaseNotificationProvider)
    })
  })
})
