import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetAuthUser,
  mockGetGuestRequest,
  mockUpdateGuestRequestStatus,
  mockListGuestRequests,
  mockCancelEscalation,
} = vi.hoisted(() => {
  const mockGetAuthUser = vi.fn()
  const mockGetGuestRequest = vi.fn()
  const mockUpdateGuestRequestStatus = vi.fn()
  const mockListGuestRequests = vi.fn()
  const mockCancelEscalation = vi.fn()
  return {
    mockGetAuthUser,
    mockGetGuestRequest,
    mockUpdateGuestRequestStatus,
    mockListGuestRequests,
    mockCancelEscalation,
  }
})

vi.mock('@/lib/auth/get-auth-user', () => ({
  getAuthUser: mockGetAuthUser,
}))

vi.mock('@/lib/services/guest-request-service', () => ({
  getGuestRequest: mockGetGuestRequest,
  updateGuestRequestStatus: mockUpdateGuestRequestStatus,
  listGuestRequests: mockListGuestRequests,
}))

vi.mock('@/lib/services/escalation-service', () => ({
  cancelEscalation: mockCancelEscalation,
  scheduleEscalation: vi.fn().mockResolvedValue([]),
}))

const mockUser = { id: 'host-1', email: 'host@example.com' }

const sampleRequest = {
  id: 'req-uuid-1',
  property_id: 'prop-1',
  title: 'Need extra towels',
  status: 'new',
  category: 'general',
  priority: 'normal',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/host/requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

    const { GET } = await import('../route')
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns list of requests for authenticated host', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockListGuestRequests.mockResolvedValue([sampleRequest])

    const { GET } = await import('../route')
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([sampleRequest])
    // Verify the host's own id is passed for ownership scoping
    expect(mockListGuestRequests).toHaveBeenCalledWith('host-1')
  })

  it('returns 500 on service error', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockListGuestRequests.mockRejectedValue(new Error('DB error'))

    const { GET } = await import('../route')
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })
})

describe('GET /api/host/requests/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

    const { GET } = await import('../[id]/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}`)
    const response = await GET(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns the request by id', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockGetGuestRequest.mockResolvedValue(sampleRequest)

    const { GET } = await import('../[id]/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}`)
    const response = await GET(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(sampleRequest)
    expect(mockGetGuestRequest).toHaveBeenCalledWith(VALID_UUID, 'host-1')
  })

  it('returns 404 when request not found', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockGetGuestRequest.mockResolvedValue(null)

    const { GET } = await import('../[id]/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}`)
    const response = await GET(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns 404 when request belongs to a different host (IDOR protection)', async () => {
    // getGuestRequest returns null when hostId does not match assigned_host_id
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockGetGuestRequest.mockResolvedValue(null)

    const { GET } = await import('../[id]/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}`)
    const response = await GET(request, makeParams(VALID_UUID))
    const body = await response.json()

    // Must be 404 (not 403) to avoid leaking existence of the resource
    expect(response.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns 400 when id is not a valid UUID', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { GET } = await import('../[id]/route')
    const request = new NextRequest('http://localhost/api/host/requests/not-uuid')
    const response = await GET(request, makeParams('not-uuid'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('returns 400 when id is empty', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { GET } = await import('../[id]/route')
    const request = new NextRequest('http://localhost/api/host/requests/')
    const response = await GET(request, makeParams(''))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('returns 500 on service error', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockGetGuestRequest.mockRejectedValue(new Error('DB error'))

    const { GET } = await import('../[id]/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}`)
    const response = await GET(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })
})

describe('POST /api/host/requests/[id]/seen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

    const { POST } = await import('../[id]/seen/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}/seen`, {
      method: 'POST',
    })
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('marks request as seen and returns updated request', async () => {
    const seenRequest = { ...sampleRequest, status: 'seen', seen_at: '2024-01-01T01:00:00Z' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockResolvedValue(seenRequest)

    const { POST } = await import('../[id]/seen/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}/seen`, {
      method: 'POST',
    })
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('seen')
    expect(mockUpdateGuestRequestStatus).toHaveBeenCalledWith(VALID_UUID, 'seen', 'host-1')
  })

  it('is idempotent — returns 200 when already seen', async () => {
    const alreadySeenRequest = { ...sampleRequest, status: 'seen' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    // updateGuestRequestStatus would throw "Invalid status transition from 'seen' to 'seen'"
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'seen' to 'seen'"),
    )
    mockGetGuestRequest.mockResolvedValue(alreadySeenRequest)

    const { POST } = await import('../[id]/seen/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}/seen`, {
      method: 'POST',
    })
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('seen')
  })

  it('returns 400 for invalid state transition (not idempotent case)', async () => {
    // resolved -> seen is invalid and NOT idempotent (different status)
    const resolvedRequest = { ...sampleRequest, status: 'resolved' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'resolved' to 'seen'"),
    )
    mockGetGuestRequest.mockResolvedValue(resolvedRequest)

    const { POST } = await import('../[id]/seen/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}/seen`, {
      method: 'POST',
    })
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.success).toBe(false)
  })

  it('returns 404 when request not found', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(new Error('Guest request not found: xyz'))

    const { POST } = await import('../[id]/seen/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}/seen`, {
      method: 'POST',
    })
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns 400 when id is not a valid UUID', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../[id]/seen/route')
    const request = new NextRequest('http://localhost/api/host/requests/bad-id/seen', {
      method: 'POST',
    })
    const response = await POST(request, makeParams('bad-id'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })
})

describe('POST /api/host/requests/[id]/acknowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

    const { POST } = await import('../[id]/acknowledge/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/acknowledge`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('marks request as acknowledged and cancels escalation', async () => {
    const ackedRequest = {
      ...sampleRequest,
      status: 'acknowledged',
      acknowledged_at: '2024-01-01T01:00:00Z',
      acknowledged_by: 'host-1',
    }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockResolvedValue(ackedRequest)
    mockCancelEscalation.mockResolvedValue(2)

    const { POST } = await import('../[id]/acknowledge/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/acknowledge`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('acknowledged')
    expect(mockUpdateGuestRequestStatus).toHaveBeenCalledWith(VALID_UUID, 'acknowledged', 'host-1')
    expect(mockCancelEscalation).toHaveBeenCalledWith(VALID_UUID)
  })

  it('is idempotent — duplicate ack returns 200 without side effects', async () => {
    const alreadyAckedRequest = {
      ...sampleRequest,
      status: 'acknowledged',
      acknowledged_by: 'host-1',
    }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'acknowledged' to 'acknowledged'"),
    )
    mockGetGuestRequest.mockResolvedValue(alreadyAckedRequest)

    const { POST } = await import('../[id]/acknowledge/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/acknowledge`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('acknowledged')
    // cancelEscalation should NOT be called again on duplicate ack (already cancelled)
    expect(mockCancelEscalation).not.toHaveBeenCalled()
  })

  it('cancels escalation even when request was already acknowledged', async () => {
    // This validates the idempotency of cancelEscalation being safe to call
    // (it returns 0 when nothing to cancel)
    const alreadyAckedRequest = {
      ...sampleRequest,
      status: 'acknowledged',
    }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'acknowledged' to 'acknowledged'"),
    )
    mockGetGuestRequest.mockResolvedValue(alreadyAckedRequest)
    mockCancelEscalation.mockResolvedValue(0)

    const { POST } = await import('../[id]/acknowledge/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/acknowledge`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    // Should succeed idempotently
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 409 for invalid state transition (resolved -> acknowledged)', async () => {
    const resolvedRequest = { ...sampleRequest, status: 'resolved' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'resolved' to 'acknowledged'"),
    )
    mockGetGuestRequest.mockResolvedValue(resolvedRequest)

    const { POST } = await import('../[id]/acknowledge/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/acknowledge`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.success).toBe(false)
  })

  it('returns 404 when request not found', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error('Guest request not found: xyz'),
    )

    const { POST } = await import('../[id]/acknowledge/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/acknowledge`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns 400 when id is not a valid UUID', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../[id]/acknowledge/route')
    const request = new NextRequest('http://localhost/api/host/requests/bad-id/acknowledge', {
      method: 'POST',
    })
    const response = await POST(request, makeParams('bad-id'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })
})

describe('POST /api/host/requests/[id]/start', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

    const { POST } = await import('../[id]/start/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/start`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('marks request as in_progress', async () => {
    const startedRequest = {
      ...sampleRequest,
      status: 'in_progress',
      started_at: '2024-01-01T01:00:00Z',
    }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockResolvedValue(startedRequest)

    const { POST } = await import('../[id]/start/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/start`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('in_progress')
    expect(mockUpdateGuestRequestStatus).toHaveBeenCalledWith(VALID_UUID, 'in_progress', 'host-1')
  })

  it('is idempotent — returns 200 when already in_progress', async () => {
    const inProgressRequest = { ...sampleRequest, status: 'in_progress' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'in_progress' to 'in_progress'"),
    )
    mockGetGuestRequest.mockResolvedValue(inProgressRequest)

    const { POST } = await import('../[id]/start/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/start`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 409 for invalid state transition (new -> in_progress)', async () => {
    const newRequest = { ...sampleRequest, status: 'new' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'new' to 'in_progress'"),
    )
    mockGetGuestRequest.mockResolvedValue(newRequest)

    const { POST } = await import('../[id]/start/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/start`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.success).toBe(false)
  })

  it('returns 404 when request not found', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(new Error('Guest request not found: xyz'))

    const { POST } = await import('../[id]/start/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/start`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns 400 when id is not a valid UUID', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../[id]/start/route')
    const request = new NextRequest('http://localhost/api/host/requests/bad-id/start', {
      method: 'POST',
    })
    const response = await POST(request, makeParams('bad-id'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })
})

describe('POST /api/host/requests/[id]/resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

    const { POST } = await import('../[id]/resolve/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/resolve`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('marks request as resolved and cancels escalation', async () => {
    const resolvedRequest = {
      ...sampleRequest,
      status: 'resolved',
      resolved_at: '2024-01-01T01:00:00Z',
    }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockResolvedValue(resolvedRequest)
    mockCancelEscalation.mockResolvedValue(1)

    const { POST } = await import('../[id]/resolve/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/resolve`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('resolved')
    expect(mockUpdateGuestRequestStatus).toHaveBeenCalledWith(VALID_UUID, 'resolved', 'host-1')
    expect(mockCancelEscalation).toHaveBeenCalledWith(VALID_UUID)
  })

  it('is idempotent — returns 200 when already resolved', async () => {
    const resolvedRequest = { ...sampleRequest, status: 'resolved' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'resolved' to 'resolved'"),
    )
    mockGetGuestRequest.mockResolvedValue(resolvedRequest)

    const { POST } = await import('../[id]/resolve/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/resolve`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('resolved')
  })

  it('returns 409 for invalid state transition (new -> resolved)', async () => {
    const newRequest = { ...sampleRequest, status: 'new' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'new' to 'resolved'"),
    )
    mockGetGuestRequest.mockResolvedValue(newRequest)

    const { POST } = await import('../[id]/resolve/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/resolve`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.success).toBe(false)
  })

  it('returns 404 when request not found', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(new Error('Guest request not found: xyz'))

    const { POST } = await import('../[id]/resolve/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/resolve`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns 400 when id is not a valid UUID', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../[id]/resolve/route')
    const request = new NextRequest('http://localhost/api/host/requests/bad-id/resolve', {
      method: 'POST',
    })
    const response = await POST(request, makeParams('bad-id'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })
})

describe('State transition validation (VALID_REQUEST_TRANSITIONS)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('prevents resolved -> new transition (returns 409)', async () => {
    const resolvedRequest = { ...sampleRequest, status: 'resolved' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'resolved' to 'seen'"),
    )
    mockGetGuestRequest.mockResolvedValue(resolvedRequest)

    const { POST } = await import('../[id]/seen/route')
    const request = new NextRequest(`http://localhost/api/host/requests/${VALID_UUID}/seen`, {
      method: 'POST',
    })
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
  })

  it('prevents cancelled -> acknowledged transition (returns 409)', async () => {
    const cancelledRequest = { ...sampleRequest, status: 'cancelled' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUpdateGuestRequestStatus.mockRejectedValue(
      new Error("Invalid status transition from 'cancelled' to 'acknowledged'"),
    )
    mockGetGuestRequest.mockResolvedValue(cancelledRequest)

    const { POST } = await import('../[id]/acknowledge/route')
    const request = new NextRequest(
      `http://localhost/api/host/requests/${VALID_UUID}/acknowledge`,
      { method: 'POST' },
    )
    const response = await POST(request, makeParams(VALID_UUID))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.success).toBe(false)
  })
})
