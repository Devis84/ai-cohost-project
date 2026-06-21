import { supabaseServer } from '@/lib/supabase/supabase-server'
import { listActiveDevices, unregisterDevice } from '@/lib/services/device-service'
import {
  createAttempt,
  markSent,
  markFailed,
  markInvalidToken,
} from '@/lib/services/notification-attempt-service'
import { getPendingJobs } from '@/lib/services/notification-job-service'
import { getNotificationProvider } from '@/lib/notifications/notification-service'
import type {
  GuestRequest,
  HostDevice,
  NotificationAttempt,
  NotificationAttemptUpdate,
} from '@/types/notification-system'

const INVALID_TOKEN_ERRORS = [
  'registration-token-not-registered',
  'invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]

function isInvalidTokenError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase()
  return INVALID_TOKEN_ERRORS.some((pattern) => lower.includes(pattern))
}

async function loadRequest(requestId: string): Promise<GuestRequest> {
  const { data, error } = await supabaseServer
    .from('guest_requests')
    .select(
      'id, property_id, room_id, guest_id, conversation_id, category, priority, title, description, status, assigned_host_id, acknowledged_by, acknowledged_at, seen_at, started_at, resolved_at, escalated_at, created_at, updated_at',
    )
    .eq('id', requestId)
    .single()

  if (error) {
    throw new Error(`Failed to load guest request ${requestId}: ${error.message}`)
  }

  return data as GuestRequest
}

async function markJobSent(jobId: string): Promise<void> {
  const updatePayload: NotificationAttemptUpdate = {
    status: 'sent',
    sent_at: new Date().toISOString(),
  }
  const { error } = await supabaseServer
    .from('notification_attempts')
    .update(updatePayload)
    .eq('id', jobId)

  if (error) {
    throw new Error(`Failed to mark job ${jobId} as sent: ${error.message}`)
  }
}

async function markJobFailed(jobId: string, failureMessage: string): Promise<void> {
  const updatePayload: NotificationAttemptUpdate = {
    status: 'failed',
    failure_code: 'FAN_OUT_FAILED',
    failure_message: failureMessage,
  }
  const { error } = await supabaseServer
    .from('notification_attempts')
    .update(updatePayload)
    .eq('id', jobId)

  if (error) {
    throw new Error(`Failed to mark job ${jobId} as failed: ${error.message}`)
  }
}

function buildNotificationPayload(request: GuestRequest) {
  return {
    title: `Guest Request: ${request.title}`,
    body: request.description ?? request.title,
    data: {
      requestId: request.id,
      propertyId: request.property_id,
      category: request.category,
      priority: request.priority,
    },
  }
}

function isDeviceEligible(device: HostDevice): boolean {
  return device.notifications_enabled && device.permission_status !== 'denied'
}

async function sendToDevice(
  job: NotificationAttempt,
  device: HostDevice,
  request: GuestRequest,
): Promise<void> {
  const provider = getNotificationProvider()
  const payload = buildNotificationPayload(request)

  const attempt = await createAttempt({
    guest_request_id: job.guest_request_id,
    host_id: job.host_id,
    host_device_id: device.id,
    channel: 'push',
    attempt_number: job.attempt_number,
    status: 'pending',
  })

  try {
    const result = await provider.send(device.notification_token, payload)

    if (result.success && result.messageId) {
      await markSent(attempt.id, result.messageId)
      return
    }

    const errorMessage = result.error ?? 'Unknown delivery failure'

    if (isInvalidTokenError(errorMessage)) {
      await markInvalidToken(attempt.id)
      await unregisterDevice(device.host_id, device.id)
      return
    }

    await markFailed(attempt.id, 'DELIVERY_FAILED', errorMessage)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await markFailed(attempt.id, 'SEND_EXCEPTION', message)
  }
}

export async function processNotificationJob(job: NotificationAttempt): Promise<void> {
  // loadRequest and listActiveDevices may throw — caller (processPendingJobs) catches them.
  const request = await loadRequest(job.guest_request_id)
  const devices = await listActiveDevices(job.host_id)

  const eligibleDevices = devices.filter(isDeviceEligible)

  // sendToDevice has an internal try/catch and never re-throws.
  // All per-device delivery outcomes are recorded as individual attempt rows.
  for (const device of eligibleDevices) {
    await sendToDevice(job, device, request)
  }

  // Transition the outbox job to a terminal state so it is not reprocessed.
  // Per-device failures are visible in their own attempt rows.
  await markJobSent(job.id)
}

export interface WorkerSummary {
  processed: number
  failed: number
}

export async function processPendingJobs(): Promise<WorkerSummary> {
  const jobs = await getPendingJobs()

  let processed = 0
  let failed = 0

  for (const job of jobs) {
    try {
      await processNotificationJob(job)
      processed++
    } catch (err: unknown) {
      failed++
      const message = err instanceof Error ? err.message : 'Unknown worker error'
      // Best-effort: transition the outbox job to failed so it is not reprocessed.
      await markJobFailed(job.id, message).catch(() => {
        // Ignore secondary failure — the primary error is already counted.
      })
    }
  }

  return { processed, failed }
}
