import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockCreateGuestRequestWithNotification,
  mockProcessPendingJobs,
  mockCheckRateLimit,
} = vi.hoisted(() => {
  const mockCreateGuestRequestWithNotification = vi.fn()
  const mockProcessPendingJobs = vi.fn()
  const mockCheckRateLimit = vi.fn()
  return {
    mockCreateGuestRequestWithNotification,
    mockProcessPendingJobs,
    mockCheckRateLimit,
  }
})

vi.mock('@/lib/services/create-guest-request-with-notification', () => ({
  createGuestRequestWithNotification: mockCreateGuestRequestWithNotification,
}))

vi.mock('@/lib/workers/notification-worker', () => ({
  processNotificationJob: vi.fn(),
  processPendingJobs: mockProcessPendingJobs,
}))

vi.mock('@/lib/rate-limiter/rate-limiter', () => ({
  checkRateLimit: mockCheckRateLimit,
  createRateLimiter: vi.fn(() => ({})),
  resetRateLimiter: vi.fn(),
}))

import { POST } from '../route'

describe('POST /api/guest/requests (rate limiting)', () => {
  const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

  const sampleRequest = {
    id: 'req-1',
    property_id: VALID_UUID,
    title: 'Need extra towels',
    status: 'new',
    category: 'general',
    priority: 'normal',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateGuestRequestWithNotification.mockResolvedValue({
      request: sampleRequest,
      jobCount: 1,
    })
    mockProcessPendingJobs.mockResolvedValue({ processed: 1, failed: 0 })
    // Default: not rate-limited
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 9, retryAfterMs: 0 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function makeRequest(
    body: unknown = { property_id: VALID_UUID, title: 'Need help' },
    ip = '10.0.0.1',
  ) {
    return new NextRequest('http://localhost/api/guest/requests', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
    })
  }

  describe('rate limit enforcement', () => {
    it('returns 201 when under the rate limit', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 9, retryAfterMs: 0 })

      const response = await POST(makeRequest())

      expect(response.status).toBe(201)
    })

    it('returns 429 when rate limit is exceeded', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 45_000 })

      const response = await POST(makeRequest())

      expect(response.status).toBe(429)
    })

    it('returns success=false in body on 429', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 45_000 })

      const response = await POST(makeRequest())
      const body = await response.json()

      expect(body.success).toBe(false)
      expect(body.error).toBeDefined()
    })

    it('includes Retry-After header on 429 response', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 45_000 })

      const response = await POST(makeRequest())

      expect(response.headers.get('Retry-After')).toBeDefined()
    })

    it('does not call createGuestRequestWithNotification when rate-limited', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 45_000 })

      await POST(makeRequest())

      expect(mockCreateGuestRequestWithNotification).not.toHaveBeenCalled()
    })

    it('rate limits by IP address', async () => {
      // Two different IPs should be tracked independently
      mockCheckRateLimit
        .mockReturnValueOnce({ allowed: false, remaining: 0, retryAfterMs: 30_000 }) // ip-A blocked
        .mockReturnValueOnce({ allowed: true, remaining: 9, retryAfterMs: 0 }) // ip-B allowed

      const responseA = await POST(makeRequest({ property_id: VALID_UUID, title: 'Help' }, '10.0.0.1'))
      const responseB = await POST(makeRequest({ property_id: VALID_UUID, title: 'Help' }, '10.0.0.2'))

      expect(responseA.status).toBe(429)
      expect(responseB.status).toBe(201)
    })
  })

  describe('normal operation (no rate limiting)', () => {
    it('returns 201 on successful creation', async () => {
      const response = await POST(makeRequest())
      expect(response.status).toBe(201)
    })

    it('returns 400 on invalid input even when not rate-limited', async () => {
      const response = await POST(makeRequest({ title: 'Missing property_id' }))
      expect(response.status).toBe(400)
    })
  })
})
