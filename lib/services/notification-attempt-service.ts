import { supabaseServer } from '@/lib/supabase/supabase-server'
import type {
  NotificationAttempt,
  NotificationAttemptInsert,
  NotificationAttemptUpdate,
} from '@/types/notification-system'

export async function createAttempt(
  data: NotificationAttemptInsert,
): Promise<NotificationAttempt> {
  const insertPayload: NotificationAttemptInsert = {
    ...data,
    status: data.status ?? 'pending',
    attempt_number: data.attempt_number ?? 1,
    channel: data.channel ?? 'push',
  }

  const { data: attempt, error } = await supabaseServer
    .from('notification_attempts')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create notification attempt: ${error.message}`)
  }

  return attempt as NotificationAttempt
}

export async function markSent(
  attemptId: string,
  providerMessageId: string,
): Promise<NotificationAttempt> {
  const updatePayload: NotificationAttemptUpdate = {
    status: 'sent',
    provider_message_id: providerMessageId,
    sent_at: new Date().toISOString(),
  }

  const { data: attempt, error } = await supabaseServer
    .from('notification_attempts')
    .update(updatePayload)
    .eq('id', attemptId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to mark attempt as sent: ${error.message}`)
  }

  return attempt as NotificationAttempt
}

export async function markFailed(
  attemptId: string,
  failureCode: string,
  failureMessage: string,
): Promise<NotificationAttempt> {
  const updatePayload: NotificationAttemptUpdate = {
    status: 'failed',
    failure_code: failureCode,
    failure_message: failureMessage,
  }

  const { data: attempt, error } = await supabaseServer
    .from('notification_attempts')
    .update(updatePayload)
    .eq('id', attemptId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to mark attempt as failed: ${error.message}`)
  }

  return attempt as NotificationAttempt
}

export async function markInvalidToken(attemptId: string): Promise<NotificationAttempt> {
  const updatePayload: NotificationAttemptUpdate = {
    status: 'invalid_token',
  }

  const { data: attempt, error } = await supabaseServer
    .from('notification_attempts')
    .update(updatePayload)
    .eq('id', attemptId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to mark attempt as invalid_token: ${error.message}`)
  }

  return attempt as NotificationAttempt
}
