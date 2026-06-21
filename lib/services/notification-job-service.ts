import { supabaseServer } from '@/lib/supabase/supabase-server'
import type { NotificationAttempt, NotificationAttemptInsert } from '@/types/notification-system'

/** Maximum number of pending jobs claimed per worker tick. */
const PENDING_JOBS_BATCH_SIZE = 50

export async function createNotificationJob(
  requestId: string,
  hostIds: string[],
): Promise<NotificationAttempt[]> {
  if (hostIds.length === 0) {
    return []
  }

  const insertPayloads: NotificationAttemptInsert[] = hostIds.map((hostId) => ({
    guest_request_id: requestId,
    host_id: hostId,
    status: 'pending' as const,
    channel: 'push' as const,
    attempt_number: 1,
  }))

  const { data, error } = await supabaseServer
    .from('notification_attempts')
    .insert(insertPayloads)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as NotificationAttempt[]
}

/**
 * Atomically claims a batch of pending notification jobs using
 * `FOR UPDATE SKIP LOCKED` so that concurrent workers never process
 * the same row. Claimed rows are immediately transitioned to
 * `processing` to prevent double-delivery.
 *
 * Requires the `claim_pending_notification_jobs(batch_size int)`
 * Postgres function defined in the notification system migration.
 */
export async function getPendingJobs(
  batchSize: number = PENDING_JOBS_BATCH_SIZE,
): Promise<NotificationAttempt[]> {
  const { data, error } = await supabaseServer.rpc('claim_pending_notification_jobs', {
    batch_size: batchSize,
  })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as NotificationAttempt[]
}
