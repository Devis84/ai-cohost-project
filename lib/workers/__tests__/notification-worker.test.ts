import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { NotificationResult } from '@/lib/notifications/notification-service'
import type { NotificationAttempt } from '@/types/notification-system'

const {
  mockListActiveDevices,
  mockUnregisterDevice,
  mockCreateAttempt,
  mockMarkSent,
  mockMarkFailed,
  mockMarkInvalidToken,
  mockGetPendingJobs,
  mockProviderSend,
  mockGetNotificationProvider,
  mockFrom,
  mockSupabaseServer,
} = vi.hoisted(() => {
  const mockListActiveDevices = vi.fn()
  const mockUnregisterDevice = vi.fn()
  const mockCreateAttempt = vi.fn()
  const mockMarkSent = vi.fn()
  const mockMarkFailed = vi.fn()
  const mockMarkInvalidToken = vi.fn()
  const mockGetPendingJobs = vi.fn()
  const mockProviderSend = vi.fn()
  const mockGetNotificationProvider = vi.fn()
  const mockFrom = vi.fn()
  const mockSupabaseServer = { from: mockFrom }
  return {
    mockListActiveDevices,
    mockUnregisterDevice,
    mockCreateAttempt,
    mockMarkSent,
    mockMarkFailed,
    mockMarkInvalidToken,
    mockGetPendingJobs,
    mockProviderSend,
    mockGetNotificationProvider,
    mockFrom,
    mockSupabaseServer,
  }
})

vi.mock('@/lib/services/device-service', () => ({
  listActiveDevices: mockListActiveDevices,
  unregisterDevice: mockUnregisterDevice,
}))

vi.mock('@/lib/services/notification-attempt-service', () => ({
  createAttempt: mockCreateAttempt,
  markSent: mockMarkSent,
  markFailed: mockMarkFailed,
  markInvalidToken: mockMarkInvalidToken,
}))

vi.mock('@/lib/services/notification-job-service', () => ({
  getPendingJobs: mockGetPendingJobs,
}))

vi.mock('@/lib/notifications/notification-service', () => ({
  getNotificationProvider: mockGetNotificationProvider,
}))

vi.mock('@/lib/supabase/supabase-server', () => ({
  supabaseServer: mockSupabaseServer,
}))

import { processNotificationJob, processPendingJobs } from '../notification-worker'

describe('NotificationWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetNotificationProvider.mockReturnValue({
      send: mockProviderSend,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const sampleDevice = {
    id: 'device-1',
    host_id: 'host-1',
    notification_token: 'fcm-token-abc',
    notifications_enabled: true,
    permission_status: 'granted',
    revoked_at: null,
  }

  const sampleDevice2 = {
    id: 'device-2',
    host_id: 'host-1',
    notification_token: 'fcm-token-xyz',
    notifications_enabled: true,
    permission_status: 'granted',
    revoked_at: null,
  }

  const samplePendingAttempt = {
    id: 'attempt-1',
    guest_request_id: 'req-1',
    host_id: 'host-1',
    host_device_id: null,
    channel: 'push',
    attempt_number: 1,
    status: 'processing',
    provider_message_id: null,
    failure_code: null,
    failure_message: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const sampleRequest = {
    id: 'req-1',
    property_id: 'prop-1',
    title: 'Need extra towels',
    description: null,
    status: 'new',
    category: 'general',
    priority: 'normal',
  }

  /**
   * Builds a chain for the loadRequest query (select -> eq -> single)
   * and separately handles the update calls made by markJobSent/markJobFailed.
   */
  function setupRequestFetch(request = sampleRequest) {
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: request, error: null }),
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'guest_requests') return selectChain
      return updateChain
    })

    return { selectChain, updateChain }
  }

  describe('processNotificationJob', () => {
    it('sends push notification to all active devices for the host', async () => {
      setupRequestFetch()
      mockListActiveDevices.mockResolvedValue([sampleDevice, sampleDevice2])
      mockCreateAttempt
        .mockResolvedValueOnce({ ...samplePendingAttempt, id: 'attempt-d1' })
        .mockResolvedValueOnce({ ...samplePendingAttempt, id: 'attempt-d2' })
      mockProviderSend.mockResolvedValue({ success: true, messageId: 'msg-1' } as NotificationResult)
      mockMarkSent.mockResolvedValue({ id: 'attempt-d1', status: 'sent' })

      await processNotificationJob(samplePendingAttempt as NotificationAttempt)

      expect(mockListActiveDevices).toHaveBeenCalledWith('host-1')
      expect(mockProviderSend).toHaveBeenCalledTimes(2)
      expect(mockMarkSent).toHaveBeenCalledTimes(2)
    })

    it('creates one attempt record per device', async () => {
      setupRequestFetch()
      mockListActiveDevices.mockResolvedValue([sampleDevice, sampleDevice2])
      mockCreateAttempt
        .mockResolvedValueOnce({ ...samplePendingAttempt, id: 'attempt-d1' })
        .mockResolvedValueOnce({ ...samplePendingAttempt, id: 'attempt-d2' })
      mockProviderSend.mockResolvedValue({ success: true, messageId: 'msg-1' })
      mockMarkSent.mockResolvedValue({ status: 'sent' })

      await processNotificationJob(samplePendingAttempt as NotificationAttempt)

      expect(mockCreateAttempt).toHaveBeenCalledTimes(2)
      expect(mockCreateAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          guest_request_id: 'req-1',
          host_id: 'host-1',
          host_device_id: 'device-1',
        }),
      )
    })

    it('marks outbox job as sent after successful fan-out', async () => {
      const { updateChain } = setupRequestFetch()
      mockListActiveDevices.mockResolvedValue([sampleDevice])
      mockCreateAttempt.mockResolvedValue({ ...samplePendingAttempt, id: 'attempt-d1' })
      mockProviderSend.mockResolvedValue({ success: true, messageId: 'msg-1' } as NotificationResult)
      mockMarkSent.mockResolvedValue({ status: 'sent' })

      await processNotificationJob(samplePendingAttempt as NotificationAttempt)

      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'sent' }),
      )
      expect(updateChain.eq).toHaveBeenCalledWith('id', 'attempt-1')
    })

    it('marks outbox job as sent when host has no eligible devices', async () => {
      const { updateChain } = setupRequestFetch()
      mockListActiveDevices.mockResolvedValue([])

      await processNotificationJob(samplePendingAttempt as NotificationAttempt)

      expect(mockProviderSend).not.toHaveBeenCalled()
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'sent' }),
      )
    })

    it('marks attempt as invalid_token and revokes device when FCM returns invalid token error', async () => {
      setupRequestFetch()
      mockListActiveDevices.mockResolvedValue([sampleDevice])
      mockCreateAttempt.mockResolvedValue({ ...samplePendingAttempt, id: 'attempt-d1' })
      mockProviderSend.mockResolvedValue({
        success: false,
        error: 'registration-token-not-registered',
      } as NotificationResult)
      mockMarkInvalidToken.mockResolvedValue({ status: 'invalid_token' })
      mockUnregisterDevice.mockResolvedValue({ id: 'device-1', revoked_at: '2024-01-01T00:00:00Z' })

      await processNotificationJob(samplePendingAttempt as NotificationAttempt)

      expect(mockMarkInvalidToken).toHaveBeenCalledWith('attempt-d1')
      expect(mockUnregisterDevice).toHaveBeenCalledWith('host-1', 'device-1')
    })

    it('marks attempt as failed for non-invalid-token errors', async () => {
      setupRequestFetch()
      mockListActiveDevices.mockResolvedValue([sampleDevice])
      mockCreateAttempt.mockResolvedValue({ ...samplePendingAttempt, id: 'attempt-d1' })
      mockProviderSend.mockResolvedValue({
        success: false,
        error: 'INTERNAL_ERROR',
      } as NotificationResult)
      mockMarkFailed.mockResolvedValue({ status: 'failed' })

      await processNotificationJob(samplePendingAttempt as NotificationAttempt)

      expect(mockMarkFailed).toHaveBeenCalledWith('attempt-d1', expect.any(String), 'INTERNAL_ERROR')
      expect(mockMarkInvalidToken).not.toHaveBeenCalled()
      expect(mockUnregisterDevice).not.toHaveBeenCalled()
    })

    it('skips devices with notifications disabled', async () => {
      setupRequestFetch()
      const disabledDevice = { ...sampleDevice, notifications_enabled: false }
      mockListActiveDevices.mockResolvedValue([disabledDevice])

      await processNotificationJob(samplePendingAttempt as NotificationAttempt)

      expect(mockProviderSend).not.toHaveBeenCalled()
      expect(mockCreateAttempt).not.toHaveBeenCalled()
    })

    it('skips devices with denied permission status', async () => {
      setupRequestFetch()
      const deniedDevice = { ...sampleDevice, permission_status: 'denied' }
      mockListActiveDevices.mockResolvedValue([deniedDevice])

      await processNotificationJob(samplePendingAttempt as NotificationAttempt)

      expect(mockProviderSend).not.toHaveBeenCalled()
    })

    it('throws when request cannot be loaded', async () => {
      const failChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      }
      mockFrom.mockReturnValue(failChain)

      await expect(processNotificationJob(samplePendingAttempt as NotificationAttempt)).rejects.toThrow()
    })

    it('continues processing other devices if one send throws an exception', async () => {
      setupRequestFetch()
      mockListActiveDevices.mockResolvedValue([sampleDevice, sampleDevice2])
      mockCreateAttempt
        .mockResolvedValueOnce({ ...samplePendingAttempt, id: 'attempt-d1' })
        .mockResolvedValueOnce({ ...samplePendingAttempt, id: 'attempt-d2' })
      mockProviderSend
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true, messageId: 'msg-2' })
      mockMarkFailed.mockResolvedValue({ status: 'failed' })
      mockMarkSent.mockResolvedValue({ status: 'sent' })

      await processNotificationJob(samplePendingAttempt as NotificationAttempt)

      expect(mockMarkFailed).toHaveBeenCalledTimes(1)
      expect(mockMarkSent).toHaveBeenCalledTimes(1)
    })
  })

  describe('processPendingJobs', () => {
    it('processes all pending jobs and returns summary', async () => {
      const jobs = [
        samplePendingAttempt,
        { ...samplePendingAttempt, id: 'attempt-2', host_id: 'host-2' },
      ]
      mockGetPendingJobs.mockResolvedValue(jobs)
      setupRequestFetch()
      mockListActiveDevices.mockResolvedValue([])

      const result = await processPendingJobs()

      expect(mockGetPendingJobs).toHaveBeenCalledOnce()
      expect(result).toMatchObject({ processed: 2, failed: 0 })
    })

    it('returns zero processed when no pending jobs exist', async () => {
      mockGetPendingJobs.mockResolvedValue([])

      const result = await processPendingJobs()

      expect(result.processed).toBe(0)
      expect(result.failed).toBe(0)
    })

    it('counts failed jobs when processNotificationJob throws', async () => {
      const jobs = [
        samplePendingAttempt,
        { ...samplePendingAttempt, id: 'attempt-2', host_id: 'host-2' },
      ]
      mockGetPendingJobs.mockResolvedValue(jobs)

      const failChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          })
          .mockResolvedValueOnce({ data: sampleRequest, error: null }),
        update: vi.fn().mockReturnThis(),
      }
      ;(failChain.update as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      mockFrom.mockReturnValue(failChain)
      mockListActiveDevices.mockResolvedValue([])

      const result = await processPendingJobs()

      expect(result.failed).toBe(1)
      expect(result.processed).toBe(1)
    })
  })
})
