import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockFindRecipients, mockGetHostAssignmentService, mockRpc, mockSupabaseServer } = vi.hoisted(() => {
  const mockFindRecipients = vi.fn()
  const mockGetHostAssignmentService = vi.fn()
  const mockRpc = vi.fn()
  const mockSupabaseServer = { rpc: mockRpc }
  return { mockFindRecipients, mockGetHostAssignmentService, mockRpc, mockSupabaseServer }
})

vi.mock('@/lib/services/host-assignment-service', () => ({
  getHostAssignmentService: mockGetHostAssignmentService,
}))

vi.mock('@/lib/supabase/supabase-server', () => ({
  supabaseServer: mockSupabaseServer,
}))

import { createGuestRequestWithNotification } from '../create-guest-request-with-notification'

describe('createGuestRequestWithNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetHostAssignmentService.mockReturnValue({
      findRecipients: mockFindRecipients,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const sampleRequest = {
    id: 'req-1',
    property_id: 'prop-1',
    title: 'Need extra towels',
    status: 'new',
    category: 'general',
    priority: 'normal',
    room_id: null,
    guest_id: null,
    description: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  it('calls the create_guest_request_with_jobs RPC with resolved host IDs', async () => {
    mockFindRecipients.mockResolvedValue([
      { hostId: 'host-1', propertyId: 'prop-1' },
      { hostId: 'host-2', propertyId: 'prop-1' },
    ])
    mockRpc.mockResolvedValue({ data: sampleRequest, error: null })

    const result = await createGuestRequestWithNotification({
      property_id: 'prop-1',
      title: 'Need extra towels',
    })

    expect(result.request).toEqual(sampleRequest)
    expect(result.jobCount).toBe(2)
    expect(mockRpc).toHaveBeenCalledWith('create_guest_request_with_jobs', {
      p_property_id: 'prop-1',
      p_title: 'Need extra towels',
      p_category: 'general',
      p_priority: 'normal',
      p_description: null,
      p_room_id: null,
      p_guest_id: null,
      p_host_ids: ['host-1', 'host-2'],
    })
  })

  it('passes jobCount of 0 and empty host_ids when no recipients found', async () => {
    mockFindRecipients.mockResolvedValue([])
    mockRpc.mockResolvedValue({ data: sampleRequest, error: null })

    const result = await createGuestRequestWithNotification({
      property_id: 'prop-1',
      title: 'No hosts',
    })

    expect(result.jobCount).toBe(0)
    expect(mockRpc).toHaveBeenCalledWith(
      'create_guest_request_with_jobs',
      expect.objectContaining({ p_host_ids: [] }),
    )
  })

  it('throws when recipient lookup fails before calling RPC', async () => {
    mockFindRecipients.mockRejectedValue(new Error('Cannot find hosts'))

    await expect(
      createGuestRequestWithNotification({ property_id: 'prop-1', title: 'Help' }),
    ).rejects.toThrow('Cannot find hosts')

    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('throws when the RPC returns an error', async () => {
    mockFindRecipients.mockResolvedValue([{ hostId: 'host-1', propertyId: 'prop-1' }])
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })

    await expect(
      createGuestRequestWithNotification({ property_id: 'prop-1', title: 'Help' }),
    ).rejects.toThrow('Failed to create guest request: RPC failed')
  })

  it('passes optional fields through to the RPC', async () => {
    mockFindRecipients.mockResolvedValue([])
    mockRpc.mockResolvedValue({ data: sampleRequest, error: null })

    await createGuestRequestWithNotification({
      property_id: 'prop-1',
      title: 'Broken AC',
      room_id: 'room-1',
      guest_id: 'guest-1',
      category: 'maintenance',
      priority: 'urgent',
      description: 'AC not working',
    })

    expect(mockRpc).toHaveBeenCalledWith(
      'create_guest_request_with_jobs',
      expect.objectContaining({
        p_room_id: 'room-1',
        p_guest_id: 'guest-1',
        p_category: 'maintenance',
        p_priority: 'urgent',
        p_description: 'AC not working',
      }),
    )
  })
})
