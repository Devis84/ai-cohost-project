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

import {
  scheduleEscalation,
  cancelEscalation,
  getEscalationTimings,
  getPendingEscalationJobs,
} from '../escalation-service'

describe('EscalationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables to defaults
    delete process.env.NOTIFICATION_REPEAT_DELAY_SECONDS
    delete process.env.BACKUP_HOST_DELAY_SECONDS
    delete process.env.FALLBACK_DELAY_SECONDS
    delete process.env.MANAGER_ESCALATION_DELAY_SECONDS
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete process.env.NOTIFICATION_REPEAT_DELAY_SECONDS
    delete process.env.BACKUP_HOST_DELAY_SECONDS
    delete process.env.FALLBACK_DELAY_SECONDS
    delete process.env.MANAGER_ESCALATION_DELAY_SECONDS
  })

  function buildQueryChain(overrides: Record<string, unknown> = {}) {
    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides,
    }
    mockFrom.mockReturnValue(chain)
    return chain
  }

  const sampleEscalationJob = {
    id: 'esc-1',
    request_id: 'req-1',
    escalation_step: 1,
    scheduled_for: new Date(Date.now() + 30000).toISOString(),
    status: 'pending',
    job_key: 'req-1:step:1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('getEscalationTimings', () => {
    it('returns default timings when env vars are not set', () => {
      const timings = getEscalationTimings()

      expect(timings.notificationRepeatDelay).toBe(30)
      expect(timings.backupHostDelay).toBe(60)
      expect(timings.fallbackDelay).toBe(120)
      expect(timings.managerEscalationDelay).toBe(180)
    })

    it('reads NOTIFICATION_REPEAT_DELAY_SECONDS from environment', () => {
      process.env.NOTIFICATION_REPEAT_DELAY_SECONDS = '45'

      const timings = getEscalationTimings()

      expect(timings.notificationRepeatDelay).toBe(45)
    })

    it('reads BACKUP_HOST_DELAY_SECONDS from environment', () => {
      process.env.BACKUP_HOST_DELAY_SECONDS = '90'

      const timings = getEscalationTimings()

      expect(timings.backupHostDelay).toBe(90)
    })

    it('reads FALLBACK_DELAY_SECONDS from environment', () => {
      process.env.FALLBACK_DELAY_SECONDS = '150'

      const timings = getEscalationTimings()

      expect(timings.fallbackDelay).toBe(150)
    })

    it('reads MANAGER_ESCALATION_DELAY_SECONDS from environment', () => {
      process.env.MANAGER_ESCALATION_DELAY_SECONDS = '240'

      const timings = getEscalationTimings()

      expect(timings.managerEscalationDelay).toBe(240)
    })

    it('falls back to default when env var is not a valid number', () => {
      process.env.NOTIFICATION_REPEAT_DELAY_SECONDS = 'not-a-number'

      const timings = getEscalationTimings()

      expect(timings.notificationRepeatDelay).toBe(30)
    })

    it('falls back to default when env var is zero', () => {
      process.env.NOTIFICATION_REPEAT_DELAY_SECONDS = '0'

      const timings = getEscalationTimings()

      // 0 is falsy-like but valid; implementation should accept 0
      // OR fall back. We document the expected behavior here:
      // Positive integers only — 0 is treated as unset and falls back to default.
      expect(timings.notificationRepeatDelay).toBe(30)
    })

    it('accepts all env vars simultaneously', () => {
      process.env.NOTIFICATION_REPEAT_DELAY_SECONDS = '10'
      process.env.BACKUP_HOST_DELAY_SECONDS = '20'
      process.env.FALLBACK_DELAY_SECONDS = '30'
      process.env.MANAGER_ESCALATION_DELAY_SECONDS = '40'

      const timings = getEscalationTimings()

      expect(timings.notificationRepeatDelay).toBe(10)
      expect(timings.backupHostDelay).toBe(20)
      expect(timings.fallbackDelay).toBe(30)
      expect(timings.managerEscalationDelay).toBe(40)
    })
  })

  describe('scheduleEscalation', () => {
    it('inserts escalation jobs for all steps', async () => {
      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          { ...sampleEscalationJob, escalation_step: 1 },
          { ...sampleEscalationJob, id: 'esc-2', escalation_step: 2 },
          { ...sampleEscalationJob, id: 'esc-3', escalation_step: 3 },
          { ...sampleEscalationJob, id: 'esc-4', escalation_step: 4 },
        ],
        error: null,
      })

      const result = await scheduleEscalation('req-1')

      expect(mockFrom).toHaveBeenCalledWith('escalation_jobs')
      expect(chain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            request_id: 'req-1',
            escalation_step: 1,
            status: 'pending',
          }),
        ]),
      )
      expect(result).toHaveLength(4)
    })

    it('schedules step 1 after notificationRepeatDelay seconds', async () => {
      process.env.NOTIFICATION_REPEAT_DELAY_SECONDS = '30'

      const now = Date.now()
      vi.setSystemTime(now)

      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [sampleEscalationJob],
        error: null,
      })

      await scheduleEscalation('req-1')

      const insertedPayloads = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0] as Array<{
        escalation_step: number
        scheduled_for: string
      }>
      const step1 = insertedPayloads.find((p) => p.escalation_step === 1)

      expect(step1).toBeDefined()
      const scheduledTime = new Date(step1!.scheduled_for).getTime()
      const expectedTime = now + 30 * 1000
      expect(Math.abs(scheduledTime - expectedTime)).toBeLessThan(1000)

      vi.useRealTimers()
    })

    it('schedules step 2 after backupHostDelay seconds', async () => {
      process.env.BACKUP_HOST_DELAY_SECONDS = '60'

      const now = Date.now()
      vi.setSystemTime(now)

      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [sampleEscalationJob],
        error: null,
      })

      await scheduleEscalation('req-1')

      const insertedPayloads = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0] as Array<{
        escalation_step: number
        scheduled_for: string
      }>
      const step2 = insertedPayloads.find((p) => p.escalation_step === 2)

      expect(step2).toBeDefined()
      const scheduledTime = new Date(step2!.scheduled_for).getTime()
      const expectedTime = now + 60 * 1000
      expect(Math.abs(scheduledTime - expectedTime)).toBeLessThan(1000)

      vi.useRealTimers()
    })

    it('sets unique job_key per request and step to prevent duplicates', async () => {
      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [sampleEscalationJob],
        error: null,
      })

      await scheduleEscalation('req-abc')

      const insertedPayloads = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0] as Array<{
        job_key: string
        escalation_step: number
      }>

      // Each step has a unique job_key containing the request id
      for (const payload of insertedPayloads) {
        expect(payload.job_key).toContain('req-abc')
        expect(payload.job_key).toContain(String(payload.escalation_step))
      }
    })

    it('returns empty array when insert returns no data', async () => {
      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await scheduleEscalation('req-1')

      expect(result).toEqual([])
    })

    it('throws when supabase returns an error', async () => {
      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Unique constraint violation' },
      })

      await expect(scheduleEscalation('req-1')).rejects.toThrow('Unique constraint violation')
    })
  })

  describe('cancelEscalation', () => {
    it('updates all pending escalation jobs for the request to cancelled', async () => {
      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          { ...sampleEscalationJob, status: 'cancelled' },
          { ...sampleEscalationJob, id: 'esc-2', status: 'cancelled' },
        ],
        error: null,
      })

      await cancelEscalation('req-1')

      expect(mockFrom).toHaveBeenCalledWith('escalation_jobs')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' }),
      )
      expect(chain.eq).toHaveBeenCalledWith('request_id', 'req-1')
      expect(chain.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('returns the count of cancelled jobs', async () => {
      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          { ...sampleEscalationJob, status: 'cancelled' },
          { ...sampleEscalationJob, id: 'esc-2', status: 'cancelled' },
        ],
        error: null,
      })

      const count = await cancelEscalation('req-1')

      expect(count).toBe(2)
    })

    it('returns 0 when no pending escalation jobs exist', async () => {
      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      })

      const count = await cancelEscalation('req-1')

      expect(count).toBe(0)
    })

    it('returns 0 when data is null', async () => {
      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      })

      const count = await cancelEscalation('req-1')

      expect(count).toBe(0)
    })

    it('throws when supabase returns an error', async () => {
      const chain = buildQueryChain()
      ;(chain.select as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      await expect(cancelEscalation('req-1')).rejects.toThrow('Update failed')
    })
  })

  describe('getPendingEscalationJobs', () => {
    it('fetches pending jobs scheduled at or before now', async () => {
      const chain = buildQueryChain()
      // getPendingEscalationJobs chains: .select('*').eq('status','pending').lte(...)
      // lte is the terminal awaitable
      ;(chain.lte as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [sampleEscalationJob],
        error: null,
      })

      const now = Date.now()
      vi.setSystemTime(now)

      const result = await getPendingEscalationJobs()

      expect(mockFrom).toHaveBeenCalledWith('escalation_jobs')
      expect(chain.eq).toHaveBeenCalledWith('status', 'pending')
      expect(chain.lte).toHaveBeenCalledWith('scheduled_for', expect.any(String))
      expect(result).toHaveLength(1)

      vi.useRealTimers()
    })

    it('returns empty array when no pending jobs are due', async () => {
      const chain = buildQueryChain()
      ;(chain.lte as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getPendingEscalationJobs()

      expect(result).toEqual([])
    })

    it('returns empty array when data is null', async () => {
      const chain = buildQueryChain()
      ;(chain.lte as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await getPendingEscalationJobs()

      expect(result).toEqual([])
    })

    it('throws when supabase returns an error', async () => {
      const chain = buildQueryChain()
      ;(chain.lte as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      })

      await expect(getPendingEscalationJobs()).rejects.toThrow('Query failed')
    })
  })
})
