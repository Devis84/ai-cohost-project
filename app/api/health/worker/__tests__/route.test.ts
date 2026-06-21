import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockGetWorkerHealth } = vi.hoisted(() => {
  const mockGetWorkerHealth = vi.fn()
  return { mockGetWorkerHealth }
})

vi.mock('@/lib/workers/worker-health', () => ({
  getWorkerHealth: mockGetWorkerHealth,
}))

import { GET } from '../route'

describe('GET /api/health/worker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('healthy worker', () => {
    it('returns 200 with worker health data', async () => {
      // Arrange
      const healthData = {
        status: 'healthy' as const,
        lastRunAt: '2026-06-19T10:00:00.000Z',
        jobsProcessed: 42,
        jobsFailed: 1,
        uptimeMs: 300_000,
      }
      mockGetWorkerHealth.mockReturnValue(healthData)

      // Act
      const response = await GET()
      const body = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data).toEqual(healthData)
    })

    it('includes status=healthy in data', async () => {
      mockGetWorkerHealth.mockReturnValue({
        status: 'healthy',
        lastRunAt: null,
        jobsProcessed: 0,
        jobsFailed: 0,
        uptimeMs: 0,
      })

      const response = await GET()
      const body = await response.json()

      expect(body.data.status).toBe('healthy')
    })
  })

  describe('unhealthy / degraded worker', () => {
    it('returns 200 with status=degraded when worker has errors', async () => {
      mockGetWorkerHealth.mockReturnValue({
        status: 'degraded',
        lastRunAt: '2026-06-19T09:00:00.000Z',
        jobsProcessed: 10,
        jobsFailed: 8,
        uptimeMs: 600_000,
      })

      const response = await GET()
      const body = await response.json()

      // Health check endpoint always returns 200 (to prevent alerting on health checks)
      expect(response.status).toBe(200)
      expect(body.data.status).toBe('degraded')
    })

    it('returns status=idle when worker has never run', async () => {
      mockGetWorkerHealth.mockReturnValue({
        status: 'idle',
        lastRunAt: null,
        jobsProcessed: 0,
        jobsFailed: 0,
        uptimeMs: 0,
      })

      const response = await GET()
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data.status).toBe('idle')
      expect(body.data.lastRunAt).toBeNull()
    })
  })

  describe('error handling', () => {
    it('returns 500 when getWorkerHealth throws', async () => {
      mockGetWorkerHealth.mockImplementation(() => {
        throw new Error('Health check internal error')
      })

      const response = await GET()
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.success).toBe(false)
      expect(body.error).toBeDefined()
    })

    it('does not expose internal error details in response', async () => {
      mockGetWorkerHealth.mockImplementation(() => {
        throw new Error('Sensitive internal detail about DB')
      })

      const response = await GET()
      const body = await response.json()

      // Should return a generic error message, not internal details
      expect(body.error).not.toContain('Sensitive internal detail about DB')
    })
  })

  describe('response format', () => {
    it('follows the standard API envelope { success, data }', async () => {
      mockGetWorkerHealth.mockReturnValue({
        status: 'healthy',
        lastRunAt: null,
        jobsProcessed: 0,
        jobsFailed: 0,
        uptimeMs: 0,
      })

      const response = await GET()
      const body = await response.json()

      expect(body).toHaveProperty('success')
      expect(body).toHaveProperty('data')
    })
  })
})
