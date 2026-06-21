import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockFrom, mockRpc, mockSupabaseServer } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()
  const mockSupabaseServer = { from: mockFrom, rpc: mockRpc }
  return { mockFrom, mockRpc, mockSupabaseServer }
})

vi.mock('@/lib/supabase/supabase-server', () => ({
  supabaseServer: mockSupabaseServer,
}))

import { createNotificationJob, getPendingJobs } from '../notification-job-service'

describe('NotificationJobService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function buildInsertChain(overrides: Record<string, unknown> = {}) {
    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      ...overrides,
    }
    mockFrom.mockReturnValue(chain)
    return chain
  }

  const sampleAttempt = {
    id: 'attempt-1',
    guest_request_id: 'req-1',
    host_id: 'host-1',
    host_device_id: null,
    channel: 'push',
    attempt_number: 1,
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('createNotificationJob', () => {
    it('creates pending notification attempts for each host', async () => {
      const chain = buildInsertChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [sampleAttempt, { ...sampleAttempt, id: 'attempt-2', host_id: 'host-2' }],
        error: null,
      })

      const result = await createNotificationJob('req-1', ['host-1', 'host-2'])

      expect(result).toHaveLength(2)
      expect(mockFrom).toHaveBeenCalledWith('notification_attempts')
      expect(chain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            guest_request_id: 'req-1',
            host_id: 'host-1',
            status: 'pending',
          }),
          expect.objectContaining({
            guest_request_id: 'req-1',
            host_id: 'host-2',
            status: 'pending',
          }),
        ]),
      )
    })

    it('returns empty array when no hosts provided', async () => {
      const result = await createNotificationJob('req-1', [])

      expect(result).toEqual([])
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('throws when supabase returns an error', async () => {
      const chain = buildInsertChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })

      await expect(createNotificationJob('req-1', ['host-1'])).rejects.toThrow('Insert failed')
    })

    it('sets channel to push and attempt_number to 1 by default', async () => {
      const chain = buildInsertChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [sampleAttempt],
        error: null,
      })

      await createNotificationJob('req-1', ['host-1'])

      expect(chain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            channel: 'push',
            attempt_number: 1,
          }),
        ]),
      )
    })
  })

  describe('getPendingJobs', () => {
    it('calls the claim_pending_notification_jobs RPC', async () => {
      mockRpc.mockResolvedValue({ data: [sampleAttempt], error: null })

      const result = await getPendingJobs()

      expect(result).toHaveLength(1)
      expect(mockRpc).toHaveBeenCalledWith('claim_pending_notification_jobs', {
        batch_size: 50,
      })
    })

    it('accepts a custom batch size', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      await getPendingJobs(10)

      expect(mockRpc).toHaveBeenCalledWith('claim_pending_notification_jobs', {
        batch_size: 10,
      })
    })

    it('returns empty array when no pending jobs', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      const result = await getPendingJobs()

      expect(result).toEqual([])
    })

    it('returns empty array when RPC returns null data', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const result = await getPendingJobs()

      expect(result).toEqual([])
    })

    it('throws when RPC returns an error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })

      await expect(getPendingJobs()).rejects.toThrow('RPC failed')
    })
  })
})
