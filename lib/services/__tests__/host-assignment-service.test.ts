import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { GuestRequest } from '@/types/notification-system'

const { mockFrom, mockSupabaseServer } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockSupabaseServer = { from: mockFrom }
  return { mockFrom, mockSupabaseServer }
})

vi.mock('@/lib/supabase/supabase-server', () => ({
  supabaseServer: mockSupabaseServer,
}))

import { getHostAssignmentService } from '../host-assignment-service'

const sampleRequest: GuestRequest = {
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
  assigned_host_id: null,
  acknowledged_by: null,
  acknowledged_at: null,
  seen_at: null,
  started_at: null,
  resolved_at: null,
  escalated_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('HostAssignmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function buildQueryChain(overrides: Record<string, unknown> = {}) {
    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides,
    }
    mockFrom.mockReturnValue(chain)
    return chain
  }

  describe('PropertyBasedAssignmentService', () => {
    describe('findRecipients', () => {
      it('returns host assigned to the request property_id', async () => {
        const property = { id: 'prop-1', owner_id: 'host-1' }
        const chain = buildQueryChain()
        ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: property,
          error: null,
        })

        const service = getHostAssignmentService()
        const recipients = await service.findRecipients(sampleRequest)

        expect(recipients).toHaveLength(1)
        expect(recipients[0]).toEqual({ hostId: 'host-1', propertyId: 'prop-1' })
        expect(mockFrom).toHaveBeenCalledWith('properties')
        expect(chain.select).toHaveBeenCalledWith('id, owner_id')
        expect(chain.eq).toHaveBeenCalledWith('id', 'prop-1')
      })

      it('returns empty array when property not found (PGRST116)', async () => {
        const chain = buildQueryChain()
        ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Row not found' },
        })

        const service = getHostAssignmentService()
        const recipients = await service.findRecipients(sampleRequest)

        expect(recipients).toEqual([])
      })

      it('returns empty array when property has null owner_id', async () => {
        const chain = buildQueryChain()
        ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { id: 'prop-1', owner_id: null },
          error: null,
        })

        const service = getHostAssignmentService()
        const recipients = await service.findRecipients(sampleRequest)

        expect(recipients).toEqual([])
      })

      it('returns empty array when data is null with no error', async () => {
        const chain = buildQueryChain()
        ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: null,
          error: null,
        })

        const service = getHostAssignmentService()
        const recipients = await service.findRecipients(sampleRequest)

        expect(recipients).toEqual([])
      })

      it('throws when database returns a non-PGRST116 error', async () => {
        const chain = buildQueryChain()
        ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: null,
          error: { code: '42P01', message: 'relation does not exist' },
        })

        const service = getHostAssignmentService()

        await expect(service.findRecipients(sampleRequest)).rejects.toThrow(
          'relation does not exist',
        )
      })
    })
  })

  describe('getHostAssignmentService factory', () => {
    it('returns an object implementing the HostAssignmentService interface', () => {
      const service = getHostAssignmentService()

      expect(typeof service.findRecipients).toBe('function')
    })

    it('returns a new instance on each call', () => {
      const s1 = getHostAssignmentService()
      const s2 = getHostAssignmentService()

      expect(s1).not.toBe(s2)
    })
  })
})
