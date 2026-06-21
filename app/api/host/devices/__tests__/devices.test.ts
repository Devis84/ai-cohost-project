import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
const mockGetAuthUser = vi.fn()
vi.mock('@/lib/auth/get-auth-user', () => ({
  getAuthUser: mockGetAuthUser,
}))

const mockRegisterDevice = vi.fn()
const mockUnregisterDevice = vi.fn()
const mockListActiveDevices = vi.fn()
const mockDeleteDevice = vi.fn()
vi.mock('@/lib/services/device-service', () => ({
  registerDevice: mockRegisterDevice,
  unregisterDevice: mockUnregisterDevice,
  listActiveDevices: mockListActiveDevices,
  deleteDevice: mockDeleteDevice,
}))

const mockUser = { id: 'host-abc', email: 'host@example.com' }

describe('GET /api/host/devices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

    const { GET } = await import('../route')
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns list of active devices for authenticated host', async () => {
    const devices = [
      { id: 'd1', host_id: 'host-abc', notification_token: 'token-1' },
      { id: 'd2', host_id: 'host-abc', notification_token: 'token-2' },
    ]
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockListActiveDevices.mockResolvedValue(devices)

    const { GET } = await import('../route')
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(devices)
    expect(mockListActiveDevices).toHaveBeenCalledWith('host-abc')
  })

  it('returns 500 on service error', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockListActiveDevices.mockRejectedValue(new Error('DB error'))

    const { GET } = await import('../route')
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })
})

describe('POST /api/host/devices/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

    const { POST } = await import('../register/route')
    const request = new NextRequest('http://localhost/api/host/devices/register', {
      method: 'POST',
      body: JSON.stringify({ notification_token: 'token-123', platform: 'android' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 400 when notification_token is missing', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../register/route')
    const request = new NextRequest('http://localhost/api/host/devices/register', {
      method: 'POST',
      body: JSON.stringify({ platform: 'android' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
  })

  it('returns 400 when notification_token is empty string', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../register/route')
    const request = new NextRequest('http://localhost/api/host/devices/register', {
      method: 'POST',
      body: JSON.stringify({ notification_token: '' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('returns 400 when platform is invalid value', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../register/route')
    const request = new NextRequest('http://localhost/api/host/devices/register', {
      method: 'POST',
      body: JSON.stringify({ notification_token: 'token', platform: 'playstation' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('registers device and returns 201 with device data', async () => {
    const newDevice = {
      id: 'device-new',
      host_id: 'host-abc',
      notification_token: 'token-xyz',
      platform: 'ios',
    }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockRegisterDevice.mockResolvedValue(newDevice)

    const { POST } = await import('../register/route')
    const request = new NextRequest('http://localhost/api/host/devices/register', {
      method: 'POST',
      body: JSON.stringify({ notification_token: 'token-xyz', platform: 'ios' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(newDevice)
    expect(mockRegisterDevice).toHaveBeenCalledWith(
      'host-abc',
      expect.objectContaining({
        host_id: 'host-abc',
        notification_token: 'token-xyz',
        platform: 'ios',
      })
    )
  })

  it('returns 500 on service error', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockRegisterDevice.mockRejectedValue(new Error('DB error'))

    const { POST } = await import('../register/route')
    const request = new NextRequest('http://localhost/api/host/devices/register', {
      method: 'POST',
      body: JSON.stringify({ notification_token: 'token-xyz' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })

  it('returns 400 when body is invalid JSON', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../register/route')
    const request = new NextRequest('http://localhost/api/host/devices/register', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toContain('JSON')
  })
})

describe('POST /api/host/devices/unregister', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

    const { POST } = await import('../unregister/route')
    const request = new NextRequest('http://localhost/api/host/devices/unregister', {
      method: 'POST',
      body: JSON.stringify({ device_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 400 when device_id is missing', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../unregister/route')
    const request = new NextRequest('http://localhost/api/host/devices/unregister', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('returns 400 when device_id is not a valid UUID', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../unregister/route')
    const request = new NextRequest('http://localhost/api/host/devices/unregister', {
      method: 'POST',
      body: JSON.stringify({ device_id: 'not-a-uuid' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('unregisters device and returns 200', async () => {
    const deviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    const revokedDevice = { id: deviceId, revoked_at: '2024-01-01T00:00:00Z' }
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUnregisterDevice.mockResolvedValue(revokedDevice)

    const { POST } = await import('../unregister/route')
    const request = new NextRequest('http://localhost/api/host/devices/unregister', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockUnregisterDevice).toHaveBeenCalledWith('host-abc', deviceId)
  })

  it('returns 500 on service error', async () => {
    const deviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockUnregisterDevice.mockRejectedValue(new Error('DB error'))

    const { POST } = await import('../unregister/route')
    const request = new NextRequest('http://localhost/api/host/devices/unregister', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })

  it('returns 400 when body is invalid JSON', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { POST } = await import('../unregister/route')
    const request = new NextRequest('http://localhost/api/host/devices/unregister', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toContain('JSON')
  })
})

describe('DELETE /api/host/devices/[id]', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    const deviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    mockGetAuthUser.mockRejectedValue(new Error('Unauthorized'))

    const { DELETE } = await import('../[id]/route')
    const request = new NextRequest(`http://localhost/api/host/devices/${deviceId}`, {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: deviceId }) })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 400 when id param is missing', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { DELETE } = await import('../[id]/route')
    const request = new NextRequest('http://localhost/api/host/devices/', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: '' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('returns 400 when id param is not a valid UUID', async () => {
    mockGetAuthUser.mockResolvedValue(mockUser)

    const { DELETE } = await import('../[id]/route')
    const request = new NextRequest('http://localhost/api/host/devices/not-a-uuid', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: 'not-a-uuid' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('deletes device and returns 200', async () => {
    const deviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockDeleteDevice.mockResolvedValue(undefined)

    const { DELETE } = await import('../[id]/route')
    const request = new NextRequest(`http://localhost/api/host/devices/${deviceId}`, {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: deviceId }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockDeleteDevice).toHaveBeenCalledWith('host-abc', deviceId)
  })

  it('returns 500 on service error', async () => {
    const deviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockDeleteDevice.mockRejectedValue(new Error('DB error'))

    const { DELETE } = await import('../[id]/route')
    const request = new NextRequest(`http://localhost/api/host/devices/${deviceId}`, {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: deviceId }) })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
