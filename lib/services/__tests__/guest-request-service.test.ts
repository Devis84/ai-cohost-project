import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockFrom, mockSupabaseServer } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()
  const mockSupabaseServer = { from: mockFrom, rpc: mockRpc }
  return { mockFrom, mockSupabaseServer }
})

vi.mock('@/lib/supabase/supabase-server', () => ({
  supabaseServer: mockSupabaseServer,
}))

import {
  createGuestRequest,
  getGuestRequest,
  listGuestRequests,
  updateGuestRequestStatus,
} from '../guest-request-service'

describe('GuestRequestService', () => {
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

  const sampleRequest = {
    id: 'req-1',
    property_id: 'prop-1',
    room_id: null,
    guest_id: null,
    conversation_id: null,
    category: 'general',
    priority: 'normal',
    title: 'Need extra towels',
    description: null,
    status: 'new',
    assigned_host_id: 'host-1',
    acknowledged_by: null,
    acknowledged_at: null,
    seen_at: null,
    started_at: null,
    resolved_at: null,
    escalated_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('createGuestRequest', () => {
    it('inserts a guest request and returns it', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: sampleRequest,
        error: null,
      })

      const result = await createGuestRequest({
        property_id: 'prop-1',
        title: 'Need extra towels',
      })

      expect(result).toEqual(sampleRequest)
      expect(mockFrom).toHaveBeenCalledWith('guest_requests')
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          property_id: 'prop-1',
          title: 'Need extra towels',
        }),
      )
    })

    it('defaults status to new and category to general when not provided', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: sampleRequest,
        error: null,
      })

      await createGuestRequest({ property_id: 'prop-1', title: 'Help' })

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'new',
          category: 'general',
          priority: 'normal',
        }),
      )
    })

    it('throws when supabase returns an error', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'DB insert failed' },
      })

      await expect(
        createGuestRequest({ property_id: 'prop-1', title: 'Help' }),
      ).rejects.toThrow('DB insert failed')
    })

    it('accepts optional fields when provided', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { ...sampleRequest, room_id: 'room-1', guest_id: 'guest-1' },
        error: null,
      })

      const result = await createGuestRequest({
        property_id: 'prop-1',
        title: 'Broken AC',
        room_id: 'room-1',
        guest_id: 'guest-1',
        category: 'maintenance',
        priority: 'high',
        description: 'AC not working',
      })

      expect(result.room_id).toBe('room-1')
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          room_id: 'room-1',
          category: 'maintenance',
          priority: 'high',
        }),
      )
    })
  })

  describe('listGuestRequests', () => {
    it('queries guest_requests filtered by assigned_host_id', async () => {
      const chain = buildQueryChain()
      ;(chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [sampleRequest],
        error: null,
      })

      const result = await listGuestRequests('host-1')

      expect(mockFrom).toHaveBeenCalledWith('guest_requests')
      expect(chain.eq).toHaveBeenCalledWith('assigned_host_id', 'host-1')
      expect(result).toEqual([sampleRequest])
    })

    it('returns empty array when no requests exist for host', async () => {
      const chain = buildQueryChain()
      ;(chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await listGuestRequests('host-no-requests')

      expect(result).toEqual([])
    })

    it('throws when supabase returns an error', async () => {
      const chain = buildQueryChain()
      ;(chain.eq as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'DB query failed' },
      })

      await expect(listGuestRequests('host-1')).rejects.toThrow('DB query failed')
    })
  })

  describe('getGuestRequest', () => {
    it('returns the request by id', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: sampleRequest,
        error: null,
      })

      const result = await getGuestRequest('req-1')

      expect(result).toEqual(sampleRequest)
      expect(chain.eq).toHaveBeenCalledWith('id', 'req-1')
    })

    it('returns null when request not found (PGRST116)', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const result = await getGuestRequest('nonexistent')

      expect(result).toBeNull()
    })

    it('throws on unexpected database error', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { code: '500', message: 'Connection timeout' },
      })

      await expect(getGuestRequest('req-1')).rejects.toThrow('Connection timeout')
    })

    it('returns null when hostId does not match assigned_host_id (IDOR protection)', async () => {
      const chain = buildQueryChain()
      // The request exists but belongs to a different host
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { ...sampleRequest, assigned_host_id: 'host-1' },
        error: null,
      })

      const result = await getGuestRequest('req-1', 'host-2')

      expect(result).toBeNull()
    })

    it('returns the request when hostId matches assigned_host_id', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { ...sampleRequest, assigned_host_id: 'host-1' },
        error: null,
      })

      const result = await getGuestRequest('req-1', 'host-1')

      expect(result).not.toBeNull()
      expect(result?.assigned_host_id).toBe('host-1')
    })

    it('returns request without ownership check when hostId is not provided', async () => {
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: sampleRequest,
        error: null,
      })

      const result = await getGuestRequest('req-1')

      expect(result).toEqual(sampleRequest)
    })
  })

  describe('updateGuestRequestStatus', () => {
    it('updates status when transition is valid', async () => {
      const updatedRequest = { ...sampleRequest, status: 'notified' }
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: updatedRequest,
        error: null,
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleRequest, error: null }),
      })
      mockFrom.mockReturnValueOnce(chain)

      const result = await updateGuestRequestStatus('req-1', 'notified')

      expect(result.status).toBe('notified')
    })

    it('throws when transition is invalid', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleRequest, error: null }),
      })

      await expect(updateGuestRequestStatus('req-1', 'resolved')).rejects.toThrow(
        /invalid.*transition|cannot transition/i,
      )
    })

    it('throws when request not found', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      })

      await expect(updateGuestRequestStatus('nonexistent', 'notified')).rejects.toThrow(
        /not found/i,
      )
    })

    it('includes updatedBy in the update payload when provided', async () => {
      const updatedRequest = { ...sampleRequest, status: 'acknowledged', acknowledged_by: 'host-1' }
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: updatedRequest,
        error: null,
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...sampleRequest, status: 'notified' },
          error: null,
        }),
      })
      mockFrom.mockReturnValueOnce(chain)

      const result = await updateGuestRequestStatus('req-1', 'acknowledged', 'host-1')

      expect(result.acknowledged_by).toBe('host-1')
    })

    it('sets started_at when transitioning to in_progress', async () => {
      const acknowledgedRequest = { ...sampleRequest, status: 'acknowledged' }
      const updatedRequest = { ...acknowledgedRequest, status: 'in_progress', started_at: '2024-01-01T01:00:00Z' }
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: updatedRequest, error: null })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: acknowledgedRequest, error: null }),
      })
      mockFrom.mockReturnValueOnce(chain)

      const result = await updateGuestRequestStatus('req-1', 'in_progress')

      expect(result.status).toBe('in_progress')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ started_at: expect.any(String) }),
      )
    })

    it('sets resolved_at when transitioning to resolved', async () => {
      const inProgressRequest = { ...sampleRequest, status: 'in_progress' }
      const updatedRequest = { ...inProgressRequest, status: 'resolved', resolved_at: '2024-01-01T02:00:00Z' }
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: updatedRequest, error: null })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: inProgressRequest, error: null }),
      })
      mockFrom.mockReturnValueOnce(chain)

      const result = await updateGuestRequestStatus('req-1', 'resolved')

      expect(result.status).toBe('resolved')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ resolved_at: expect.any(String) }),
      )
    })

    it('sets escalated_at when transitioning to escalated', async () => {
      const inProgressRequest = { ...sampleRequest, status: 'in_progress' }
      const updatedRequest = { ...inProgressRequest, status: 'escalated', escalated_at: '2024-01-01T03:00:00Z' }
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: updatedRequest, error: null })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: inProgressRequest, error: null }),
      })
      mockFrom.mockReturnValueOnce(chain)

      const result = await updateGuestRequestStatus('req-1', 'escalated')

      expect(result.status).toBe('escalated')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ escalated_at: expect.any(String) }),
      )
    })

    it('sets seen_at when transitioning to seen', async () => {
      const notifiedRequest = { ...sampleRequest, status: 'notified' }
      const updatedRequest = { ...notifiedRequest, status: 'seen', seen_at: '2024-01-01T04:00:00Z' }
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: updatedRequest, error: null })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: notifiedRequest, error: null }),
      })
      mockFrom.mockReturnValueOnce(chain)

      const result = await updateGuestRequestStatus('req-1', 'seen')

      expect(result.status).toBe('seen')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ seen_at: expect.any(String) }),
      )
    })

    it('throws when the update itself fails', async () => {
      const notifiedRequest = { ...sampleRequest, status: 'notified' }
      const chain = buildQueryChain()
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { code: '500', message: 'Update failed' },
      })

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: notifiedRequest, error: null }),
      })
      mockFrom.mockReturnValueOnce(chain)

      await expect(updateGuestRequestStatus('req-1', 'acknowledged')).rejects.toThrow('Update failed')
    })

    it('validates all terminal states cannot transition', async () => {
      const resolvedRequest = { ...sampleRequest, status: 'resolved' }
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: resolvedRequest, error: null }),
      })

      await expect(updateGuestRequestStatus('req-1', 'new')).rejects.toThrow(
        /invalid.*transition|cannot transition/i,
      )
    })
  })
})
