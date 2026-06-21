import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFrom = vi.fn()
const mockSupabaseServer = {
  from: mockFrom,
}

vi.mock('@/lib/supabase/supabase-server', () => ({
  supabaseServer: mockSupabaseServer,
}))

describe('DeviceService', () => {
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
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides,
    }
    mockFrom.mockReturnValue(chain)
    return chain
  }

  describe('registerDevice', () => {
    it('upserts a device and returns the created record', async () => {
      const deviceRecord = {
        id: 'device-1',
        host_id: 'host-1',
        notification_token: 'fcm-token-abc',
        platform: 'android',
        app_type: 'native',
        notifications_enabled: true,
        permission_status: 'granted',
        revoked_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: deviceRecord,
        error: null,
      })

      const { registerDevice } = await import('../device-service')
      const result = await registerDevice('host-1', {
        host_id: 'host-1',
        notification_token: 'fcm-token-abc',
        platform: 'android',
        app_type: 'native',
      })

      expect(result).toEqual(deviceRecord)
      expect(mockFrom).toHaveBeenCalledWith('host_devices')
    })

    it('revokes stale token entries from other hosts before upserting', async () => {
      const deviceRecord = {
        id: 'device-1',
        host_id: 'host-1',
        notification_token: 'shared-token',
        revoked_at: null,
      }

      // First call: update stale tokens on other hosts
      const staleUpdateChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: deviceRecord, error: null }),
      }

      mockFrom
        .mockReturnValueOnce(staleUpdateChain)
        .mockReturnValueOnce(staleUpdateChain)

      const { registerDevice } = await import('../device-service')
      await registerDevice('host-1', {
        host_id: 'host-1',
        notification_token: 'shared-token',
      })

      expect(mockFrom).toHaveBeenCalledWith('host_devices')
    })

    it('throws when supabase returns an error', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      })

      const { registerDevice } = await import('../device-service')

      await expect(
        registerDevice('host-1', {
          host_id: 'host-1',
          notification_token: 'token',
        })
      ).rejects.toThrow()
    })
  })

  describe('unregisterDevice', () => {
    it('sets revoked_at for the device belonging to the host', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: 'device-1', revoked_at: '2024-01-01T00:00:00Z' },
        error: null,
      })

      const { unregisterDevice } = await import('../device-service')
      const result = await unregisterDevice('host-1', 'device-1')

      expect(result.revoked_at).toBeDefined()
      expect(mockFrom).toHaveBeenCalledWith('host_devices')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ revoked_at: expect.any(String) })
      )
    })

    it('throws when device does not belong to host', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Row not found', code: 'PGRST116' },
      })

      const { unregisterDevice } = await import('../device-service')

      await expect(unregisterDevice('host-1', 'device-999')).rejects.toThrow()
    })
  })

  describe('listActiveDevices', () => {
    it('returns devices with revoked_at = null for the given host', async () => {
      const devices = [
        { id: 'd1', host_id: 'host-1', revoked_at: null },
        { id: 'd2', host_id: 'host-1', revoked_at: null },
      ]

      const chain = buildQueryChain()
      ;(chain.is as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: devices,
        error: null,
      })

      const { listActiveDevices } = await import('../device-service')
      const result = await listActiveDevices('host-1')

      expect(result).toEqual(devices)
      expect(chain.eq).toHaveBeenCalledWith('host_id', 'host-1')
      expect(chain.is).toHaveBeenCalledWith('revoked_at', null)
    })

    it('returns empty array when host has no active devices', async () => {
      const chain = buildQueryChain()
      ;(chain.is as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      })

      const { listActiveDevices } = await import('../device-service')
      const result = await listActiveDevices('host-1')

      expect(result).toEqual([])
    })

    it('throws when supabase returns an error', async () => {
      const chain = buildQueryChain()
      ;(chain.is as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      })

      const { listActiveDevices } = await import('../device-service')

      await expect(listActiveDevices('host-1')).rejects.toThrow()
    })
  })

  describe('deleteDevice', () => {
    it('hard-deletes device belonging to host', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: 'device-1' },
        error: null,
      })

      const { deleteDevice } = await import('../device-service')
      await deleteDevice('host-1', 'device-1')

      expect(chain.delete).toHaveBeenCalled()
      expect(chain.eq).toHaveBeenCalledWith('id', 'device-1')
      expect(chain.eq).toHaveBeenCalledWith('host_id', 'host-1')
    })

    it('throws when device does not belong to host', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      })

      const { deleteDevice } = await import('../device-service')

      await expect(deleteDevice('host-1', 'device-999')).rejects.toThrow()
    })

    it('throws "Device not found or access denied" when delete succeeds but returns no data', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      })

      const { deleteDevice } = await import('../device-service')

      await expect(deleteDevice('host-1', 'device-1')).rejects.toThrow(
        'Device not found or access denied',
      )
    })
  })

  describe('rotateToken', () => {
    it('updates token and token_updated_at for the device', async () => {
      const updatedDevice = {
        id: 'device-1',
        notification_token: 'new-token',
        token_updated_at: '2024-01-02T00:00:00Z',
      }

      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: updatedDevice,
        error: null,
      })

      const { rotateToken } = await import('../device-service')
      const result = await rotateToken('host-1', 'device-1', 'new-token')

      expect(result.notification_token).toBe('new-token')
      expect(result.token_updated_at).toBeDefined()
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          notification_token: 'new-token',
          token_updated_at: expect.any(String),
        })
      )
    })

    it('throws when device does not belong to host', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      })

      const { rotateToken } = await import('../device-service')

      await expect(rotateToken('host-1', 'device-999', 'new-token')).rejects.toThrow()
    })

    it('throws when new token is empty string', async () => {
      const { rotateToken } = await import('../device-service')

      await expect(rotateToken('host-1', 'device-1', '')).rejects.toThrow()
    })
  })
})
