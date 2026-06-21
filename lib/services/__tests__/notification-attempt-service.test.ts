import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFrom = vi.fn()
const mockSupabaseServer = {
  from: mockFrom,
}

vi.mock('@/lib/supabase/supabase-server', () => ({
  supabaseServer: mockSupabaseServer,
}))

describe('NotificationAttemptService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function buildQueryChain(overrides: Record<string, unknown> = {}) {
    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides,
    }
    mockFrom.mockReturnValue(chain)
    return chain
  }

  describe('createAttempt', () => {
    it('inserts a new notification attempt and returns it', async () => {
      const attemptRecord = {
        id: 'attempt-1',
        guest_request_id: 'req-1',
        host_id: 'host-1',
        host_device_id: 'device-1',
        channel: 'push',
        attempt_number: 1,
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: attemptRecord,
        error: null,
      })

      const { createAttempt } = await import('../notification-attempt-service')
      const result = await createAttempt({
        guest_request_id: 'req-1',
        host_id: 'host-1',
        host_device_id: 'device-1',
        channel: 'push',
        attempt_number: 1,
      })

      expect(result).toEqual(attemptRecord)
      expect(mockFrom).toHaveBeenCalledWith('notification_attempts')
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          guest_request_id: 'req-1',
          host_id: 'host-1',
          status: 'pending',
        })
      )
    })

    it('throws when supabase returns an error', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })

      const { createAttempt } = await import('../notification-attempt-service')

      await expect(
        createAttempt({
          guest_request_id: 'req-1',
          host_id: 'host-1',
        })
      ).rejects.toThrow()
    })

    it('defaults status to pending when not provided', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: 'attempt-1', status: 'pending' },
        error: null,
      })

      const { createAttempt } = await import('../notification-attempt-service')
      await createAttempt({ guest_request_id: 'req-1', host_id: 'host-1' })

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      )
    })
  })

  describe('markSent', () => {
    it('updates status to sent and sets provider_message_id', async () => {
      const updatedAttempt = {
        id: 'attempt-1',
        status: 'sent',
        provider_message_id: 'msg-abc',
        sent_at: '2024-01-01T00:00:00Z',
      }

      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: updatedAttempt,
        error: null,
      })

      const { markSent } = await import('../notification-attempt-service')
      const result = await markSent('attempt-1', 'msg-abc')

      expect(result.status).toBe('sent')
      expect(result.provider_message_id).toBe('msg-abc')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'sent',
          provider_message_id: 'msg-abc',
          sent_at: expect.any(String),
        })
      )
    })

    it('throws when attempt not found', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      })

      const { markSent } = await import('../notification-attempt-service')

      await expect(markSent('nonexistent', 'msg-id')).rejects.toThrow()
    })
  })

  describe('markFailed', () => {
    it('updates status to failed with failure_code and failure_message', async () => {
      const updatedAttempt = {
        id: 'attempt-1',
        status: 'failed',
        failure_code: 'INVALID_ARGUMENT',
        failure_message: 'Token not registered',
      }

      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: updatedAttempt,
        error: null,
      })

      const { markFailed } = await import('../notification-attempt-service')
      const result = await markFailed('attempt-1', 'INVALID_ARGUMENT', 'Token not registered')

      expect(result.status).toBe('failed')
      expect(result.failure_code).toBe('INVALID_ARGUMENT')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          failure_code: 'INVALID_ARGUMENT',
          failure_message: 'Token not registered',
        })
      )
    })

    it('throws when supabase returns an error', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      const { markFailed } = await import('../notification-attempt-service')

      await expect(markFailed('attempt-1', 'ERR', 'error')).rejects.toThrow()
    })
  })

  describe('markInvalidToken', () => {
    it('updates status to invalid_token', async () => {
      const updatedAttempt = {
        id: 'attempt-1',
        status: 'invalid_token',
      }

      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: updatedAttempt,
        error: null,
      })

      const { markInvalidToken } = await import('../notification-attempt-service')
      const result = await markInvalidToken('attempt-1')

      expect(result.status).toBe('invalid_token')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'invalid_token' })
      )
    })

    it('throws when attempt not found', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      })

      const { markInvalidToken } = await import('../notification-attempt-service')

      await expect(markInvalidToken('nonexistent')).rejects.toThrow()
    })
  })
})
