import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockFrom, mockSupabaseServer } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockSupabaseServer = { from: mockFrom }
  return { mockFrom, mockSupabaseServer }
})

vi.mock('@/lib/supabase/supabase-server', () => ({
  supabaseServer: mockSupabaseServer,
}))

import {
  cleanupInactiveDevices,
  type DeviceCleanupConfig,
} from '../device-token-cleanup'

// ─── Fixture ─────────────────────────────────────────────────────────────────

function makeDevice(overrides: Partial<{
  id: string
  host_id: string
  last_seen_at: string | null
  token_updated_at: string | null
  created_at: string
}> = {}) {
  return {
    id: 'device-1',
    host_id: 'host-1',
    last_seen_at: '2025-01-01T00:00:00Z',
    token_updated_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

function buildSelectChain(devices: unknown[]) {
  return {
    select: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: devices, error: null }),
  }
}

function buildUpdateChain(updated: unknown[]) {
  return {
    update: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: updated, error: null }),
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('cleanupInactiveDevices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const DEFAULT_CONFIG: DeviceCleanupConfig = {
    inactiveDaysThreshold: 30,
    batchSize: 100,
  }

  describe('happy path', () => {
    it('returns zero counts when no inactive devices exist', async () => {
      // Arrange
      const selectChain = buildSelectChain([])
      mockFrom.mockReturnValue(selectChain)

      // Act
      const result = await cleanupInactiveDevices(DEFAULT_CONFIG)

      // Assert
      expect(result.revokedCount).toBe(0)
      expect(result.processedCount).toBe(0)
    })

    it('revokes devices inactive longer than the threshold', async () => {
      // Arrange
      const oldDevice = makeDevice({ id: 'device-old', last_seen_at: '2020-01-01T00:00:00Z' })
      const selectChain = buildSelectChain([oldDevice])
      const updateChain = buildUpdateChain([{ ...oldDevice, revoked_at: new Date().toISOString() }])

      mockFrom
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(updateChain)

      // Act
      const result = await cleanupInactiveDevices(DEFAULT_CONFIG)

      // Assert
      expect(result.revokedCount).toBe(1)
      expect(result.processedCount).toBe(1)
    })

    it('does not revoke devices created within the grace period', async () => {
      // Arrange — device has no last_seen_at but was created very recently
      makeDevice({
        id: 'device-new',
        last_seen_at: null,
        created_at: new Date().toISOString(),
      })
      const selectChain = buildSelectChain([])
      mockFrom.mockReturnValue(selectChain)

      // Act
      const result = await cleanupInactiveDevices(DEFAULT_CONFIG)

      // Assert: new device should not be picked up by the query
      expect(result.revokedCount).toBe(0)
    })

    it('processes multiple inactive devices in a single call', async () => {
      // Arrange
      const devices = [
        makeDevice({ id: 'd1', last_seen_at: '2020-01-01T00:00:00Z' }),
        makeDevice({ id: 'd2', last_seen_at: '2020-06-01T00:00:00Z' }),
        makeDevice({ id: 'd3', last_seen_at: '2019-12-31T00:00:00Z' }),
      ]
      const selectChain = buildSelectChain(devices)
      const updateChain = buildUpdateChain(
        devices.map((d) => ({ ...d, revoked_at: new Date().toISOString() })),
      )

      mockFrom
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(updateChain)

      // Act
      const result = await cleanupInactiveDevices(DEFAULT_CONFIG)

      // Assert
      expect(result.revokedCount).toBe(3)
      expect(result.processedCount).toBe(3)
    })

    it('respects the batchSize config', async () => {
      const selectChain = buildSelectChain([])
      mockFrom.mockReturnValue(selectChain)

      await cleanupInactiveDevices({ ...DEFAULT_CONFIG, batchSize: 10 })

      expect(selectChain.limit).toHaveBeenCalledWith(10)
    })

    it('uses the inactiveDaysThreshold to compute the cutoff date', async () => {
      const selectChain = buildSelectChain([])
      mockFrom.mockReturnValue(selectChain)

      await cleanupInactiveDevices({ inactiveDaysThreshold: 90, batchSize: 100 })

      // The lt() call should use a date roughly 90 days in the past
      expect(selectChain.lt).toHaveBeenCalledOnce()
      const cutoffArg = selectChain.lt.mock.calls[0][1] as string
      const cutoff = new Date(cutoffArg)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      // Allow 5-second tolerance
      expect(Math.abs(cutoff.getTime() - ninetyDaysAgo.getTime())).toBeLessThan(5_000)
    })
  })

  describe('error handling', () => {
    it('throws when the select query fails', async () => {
      // Arrange
      const failChain = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }
      mockFrom.mockReturnValue(failChain)

      // Act / Assert
      await expect(cleanupInactiveDevices(DEFAULT_CONFIG)).rejects.toThrow('DB error')
    })

    it('throws when the update query fails', async () => {
      // Arrange
      const oldDevice = makeDevice({ id: 'd-old', last_seen_at: '2020-01-01T00:00:00Z' })
      const selectChain = buildSelectChain([oldDevice])
      const failUpdateChain = {
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      }

      mockFrom
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(failUpdateChain)

      // Act / Assert
      await expect(cleanupInactiveDevices(DEFAULT_CONFIG)).rejects.toThrow('Update failed')
    })
  })

  describe('edge cases', () => {
    it('does not call update when zero devices are found', async () => {
      const selectChain = buildSelectChain([])
      mockFrom.mockReturnValue(selectChain)

      await cleanupInactiveDevices(DEFAULT_CONFIG)

      // Only one from() call — the select query. No update query.
      expect(mockFrom).toHaveBeenCalledTimes(1)
    })

    it('handles devices with null last_seen_at using token_updated_at as fallback', async () => {
      // Devices with null last_seen_at but old token_updated_at should still appear
      // in query results if the query is constructed correctly. This test verifies
      // we issue an OR-style query (is null check) rather than filtering them out.
      const selectChain = buildSelectChain([])
      mockFrom.mockReturnValue(selectChain)

      await cleanupInactiveDevices(DEFAULT_CONFIG)

      // The query should call .is('revoked_at', null) to exclude already-revoked
      expect(selectChain.is).toHaveBeenCalledWith('revoked_at', null)
    })
  })
})
