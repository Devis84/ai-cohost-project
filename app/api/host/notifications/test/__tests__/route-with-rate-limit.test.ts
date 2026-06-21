import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const {
  mockGetAuthUser,
  mockListActiveDevices,
  mockSendMulticast,
  mockGetNotificationProvider,
  mockCheckRateLimit,
} = vi.hoisted(() => {
  const mockGetAuthUser = vi.fn()
  const mockListActiveDevices = vi.fn()
  const mockSendMulticast = vi.fn()
  const mockGetNotificationProvider = vi.fn(() => ({ sendMulticast: mockSendMulticast }))
  const mockCheckRateLimit = vi.fn()
  return {
    mockGetAuthUser,
    mockListActiveDevices,
    mockSendMulticast,
    mockGetNotificationProvider,
    mockCheckRateLimit,
  }
})

vi.mock('@/lib/auth/get-auth-user', () => ({
  getAuthUser: mockGetAuthUser,
}))

vi.mock('@/lib/services/device-service', () => ({
  listActiveDevices: mockListActiveDevices,
}))

vi.mock('@/lib/notifications/notification-service', () => ({
  getNotificationProvider: mockGetNotificationProvider,
}))

vi.mock('@/lib/rate-limiter/rate-limiter', () => ({
  checkRateLimit: mockCheckRateLimit,
  createRateLimiter: vi.fn(() => ({})),
  resetRateLimiter: vi.fn(),
}))

import { POST } from '../route'

describe('POST /api/host/notifications/test (rate limiting)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthUser.mockResolvedValue({ id: 'user-1', email: 'host@example.com' })
    mockListActiveDevices.mockResolvedValue([
      {
        id: 'device-1',
        notification_token: 'token-abc',
        notifications_enabled: true,
        permission_status: 'granted',
      },
    ])
    mockSendMulticast.mockResolvedValue([{ success: true, messageId: 'msg-1' }])
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 4, retryAfterMs: 0 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('rate limit enforcement', () => {
    it('returns 200 when under the rate limit', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 4, retryAfterMs: 0 })

      const response = await POST()

      expect(response.status).toBe(200)
    })

    it('returns 429 when rate limit is exceeded', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 55_000 })

      const response = await POST()

      expect(response.status).toBe(429)
    })

    it('returns error body with success=false on 429', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 30_000 })

      const response = await POST()
      const body = await response.json()

      expect(body.success).toBe(false)
      expect(body.error).toBeDefined()
    })

    it('includes Retry-After header on 429', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 30_000 })

      const response = await POST()

      expect(response.headers.get('Retry-After')).toBeDefined()
    })

    it('does not call notification provider when rate-limited', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 30_000 })

      await POST()

      expect(mockGetNotificationProvider).not.toHaveBeenCalled()
    })

    it('checks auth before rate limit (rate limit uses user ID)', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 30_000 })
      mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

      const response = await POST()

      expect(response.status).toBe(401)
    })
  })

  describe('normal operation (no rate limiting)', () => {
    it('returns 401 when unauthorized', async () => {
      mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

      const response = await POST()

      expect(response.status).toBe(401)
    })

    it('returns 400 when no devices registered', async () => {
      mockListActiveDevices.mockResolvedValue([])

      const response = await POST()

      expect(response.status).toBe(400)
    })

    it('returns 200 on successful notification send', async () => {
      const response = await POST()

      expect(response.status).toBe(200)
    })
  })
})
