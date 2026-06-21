import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetAuthUser,
  mockCreateGuestRequestWithNotification,
  mockProcessPendingJobs,
} = vi.hoisted(() => {
  const mockGetAuthUser = vi.fn()
  const mockCreateGuestRequestWithNotification = vi.fn()
  const mockProcessPendingJobs = vi.fn()
  return { mockGetAuthUser, mockCreateGuestRequestWithNotification, mockProcessPendingJobs }
})

vi.mock('@/lib/auth/get-auth-user', () => ({
  getAuthUser: mockGetAuthUser,
}))

vi.mock('@/lib/services/create-guest-request-with-notification', () => ({
  createGuestRequestWithNotification: mockCreateGuestRequestWithNotification,
}))

vi.mock('@/lib/workers/notification-worker', () => ({
  processNotificationJob: vi.fn(),
  processPendingJobs: mockProcessPendingJobs,
}))

import { POST } from '../route'

describe('POST /api/guest/requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthUser.mockResolvedValue({ id: 'user-1', email: 'guest@example.com' })
    mockProcessPendingJobs.mockResolvedValue({ processed: 1, failed: 0 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const VALID_PROPERTY_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

  const sampleRequest = {
    id: 'req-1',
    property_id: VALID_PROPERTY_UUID,
    title: 'Need extra towels',
    status: 'new',
    category: 'general',
    priority: 'normal',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  function makeRequest(body: unknown, headers: Record<string, string> = {}) {
    return new NextRequest('http://localhost/api/guest/requests', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    })
  }

  describe('happy path', () => {
    it('returns 201 with created request on valid input', async () => {
      mockCreateGuestRequestWithNotification.mockResolvedValue({
        request: sampleRequest,
        jobCount: 2,
      })

      const response = await POST(makeRequest({ property_id: VALID_PROPERTY_UUID, title: 'Need extra towels' }))
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.success).toBe(true)
      expect(body.data).toEqual(sampleRequest)
    })

    it('calls createGuestRequestWithNotification with validated fields', async () => {
      mockCreateGuestRequestWithNotification.mockResolvedValue({
        request: sampleRequest,
        jobCount: 1,
      })

      await POST(makeRequest({
        property_id: VALID_PROPERTY_UUID,
        title: 'Broken AC',
        room_id: 'room-1',
        guest_id: 'guest-1',
        category: 'maintenance',
        priority: 'high',
        description: 'AC not working',
      }))

      expect(mockCreateGuestRequestWithNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          property_id: VALID_PROPERTY_UUID,
          title: 'Broken AC',
          room_id: 'room-1',
          guest_id: 'guest-1',
          category: 'maintenance',
          priority: 'high',
          description: 'AC not working',
        }),
      )
    })

    it('does not await worker (fire-and-forget pattern)', async () => {
      mockCreateGuestRequestWithNotification.mockResolvedValue({
        request: sampleRequest,
        jobCount: 1,
      })
      mockProcessPendingJobs.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processed: 1, failed: 0 }), 1000)),
      )

      const start = Date.now()
      const response = await POST(makeRequest({ property_id: VALID_PROPERTY_UUID, title: 'Test' }))
      const elapsed = Date.now() - start

      expect(response.status).toBe(201)
      expect(elapsed).toBeLessThan(500)
    })
  })

  describe('input validation', () => {
    it('returns 400 when property_id is missing', async () => {
      const response = await POST(makeRequest({ title: 'No property' }))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.error).toBeDefined()
    })

    it('returns 400 when title is missing', async () => {
      const response = await POST(makeRequest({ property_id: 'prop-1' }))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.success).toBe(false)
    })

    it('returns 400 when property_id is not a valid UUID', async () => {
      const response = await POST(makeRequest({ property_id: 'not-a-uuid', title: 'Test' }))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.success).toBe(false)
    })

    it('returns 400 for invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/guest/requests', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.success).toBe(false)
    })

    it('returns 400 when priority is invalid enum value', async () => {
      const response = await POST(makeRequest({
        property_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Test',
        priority: 'super-urgent',
      }))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.success).toBe(false)
    })

    it('accepts optional fields as null', async () => {
      mockCreateGuestRequestWithNotification.mockResolvedValue({
        request: sampleRequest,
        jobCount: 0,
      })

      const response = await POST(makeRequest({
        property_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Test',
        room_id: null,
        guest_id: null,
        description: null,
      }))

      expect(response.status).toBe(201)
    })
  })

  describe('error handling', () => {
    it('returns 500 when request creation fails', async () => {
      mockCreateGuestRequestWithNotification.mockRejectedValue(new Error('DB error'))

      const response = await POST(makeRequest({ property_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', title: 'Test' }))
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.success).toBe(false)
    })
  })
})
