import { supabaseServer } from '@/lib/supabase/supabase-server'

export interface EscalationTimings {
  notificationRepeatDelay: number
  backupHostDelay: number
  fallbackDelay: number
  managerEscalationDelay: number
}

export interface EscalationJob {
  readonly id: string
  readonly request_id: string
  readonly escalation_step: number
  readonly scheduled_for: string
  readonly status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed'
  readonly job_key: string
  readonly created_at: string
  readonly updated_at: string
}

interface EscalationJobInsert {
  request_id: string
  escalation_step: number
  scheduled_for: string
  status: 'pending'
  job_key: string
}

const DEFAULT_TIMINGS: Readonly<EscalationTimings> = {
  notificationRepeatDelay: 30,
  backupHostDelay: 60,
  fallbackDelay: 120,
  managerEscalationDelay: 180,
}

function parseEnvSeconds(envValue: string | undefined, defaultValue: number): number {
  if (!envValue) {
    return defaultValue
  }
  const parsed = parseInt(envValue, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue
  }
  return parsed
}

export function getEscalationTimings(): EscalationTimings {
  return {
    notificationRepeatDelay: parseEnvSeconds(
      process.env.NOTIFICATION_REPEAT_DELAY_SECONDS,
      DEFAULT_TIMINGS.notificationRepeatDelay,
    ),
    backupHostDelay: parseEnvSeconds(
      process.env.BACKUP_HOST_DELAY_SECONDS,
      DEFAULT_TIMINGS.backupHostDelay,
    ),
    fallbackDelay: parseEnvSeconds(
      process.env.FALLBACK_DELAY_SECONDS,
      DEFAULT_TIMINGS.fallbackDelay,
    ),
    managerEscalationDelay: parseEnvSeconds(
      process.env.MANAGER_ESCALATION_DELAY_SECONDS,
      DEFAULT_TIMINGS.managerEscalationDelay,
    ),
  }
}

/**
 * Schedules 4 escalation steps for the given request.
 * Uses a unique job_key per (request_id, step) to prevent duplicate rows
 * (DB unique constraint on job_key guards against race conditions).
 */
export async function scheduleEscalation(requestId: string): Promise<EscalationJob[]> {
  const timings = getEscalationTimings()
  const now = Date.now()

  const stepDelays = [
    timings.notificationRepeatDelay,
    timings.backupHostDelay,
    timings.fallbackDelay,
    timings.managerEscalationDelay,
  ]

  const insertPayloads: EscalationJobInsert[] = stepDelays.map((delaySeconds, index) => {
    const step = index + 1
    return {
      request_id: requestId,
      escalation_step: step,
      scheduled_for: new Date(now + delaySeconds * 1000).toISOString(),
      status: 'pending' as const,
      job_key: `${requestId}:step:${step}`,
    }
  })

  const { data, error } = await supabaseServer
    .from('escalation_jobs')
    .insert(insertPayloads)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as EscalationJob[]
}

/**
 * Cancels all pending escalation jobs for the given request.
 * Safe to call multiple times (idempotent — returns 0 when nothing to cancel).
 */
export async function cancelEscalation(requestId: string): Promise<number> {
  const { data, error } = await supabaseServer
    .from('escalation_jobs')
    .update({ status: 'cancelled' })
    .eq('request_id', requestId)
    .eq('status', 'pending')
    .select()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).length
}

/**
 * Fetches pending escalation jobs that are due to be processed (scheduled_for <= now).
 */
export async function getPendingEscalationJobs(): Promise<EscalationJob[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabaseServer
    .from('escalation_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as EscalationJob[]
}
