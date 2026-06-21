/**
 * In-process worker health tracking.
 *
 * Design decisions:
 * - Module-level state tracks cumulative stats since process start.
 * - getWorkerHealth() returns a frozen copy — callers cannot mutate the state.
 * - resetWorkerHealth() is exported for test isolation only.
 * - Status is computed from the latest run's failure rate.
 */

export type WorkerStatus = 'idle' | 'healthy' | 'degraded'

export interface WorkerHealth {
  readonly status: WorkerStatus
  readonly lastRunAt: string | null
  readonly jobsProcessed: number
  readonly jobsFailed: number
  readonly uptimeMs: number
}

interface WorkerRunSummary {
  processed: number
  failed: number
}

interface MutableWorkerState {
  status: WorkerStatus
  lastRunAt: string | null
  jobsProcessed: number
  jobsFailed: number
  startedAt: number
}

let state: MutableWorkerState = {
  status: 'idle',
  lastRunAt: null,
  jobsProcessed: 0,
  jobsFailed: 0,
  startedAt: Date.now(),
}

function computeStatus(summary: WorkerRunSummary): WorkerStatus {
  const total = summary.processed + summary.failed
  if (total === 0) return 'healthy'
  const failureRate = summary.failed / total
  return failureRate >= 0.5 ? 'degraded' : 'healthy'
}

/** Records the outcome of a completed worker tick. */
export function recordWorkerRun(summary: WorkerRunSummary): void {
  state = {
    ...state,
    lastRunAt: new Date().toISOString(),
    jobsProcessed: state.jobsProcessed + summary.processed,
    jobsFailed: state.jobsFailed + summary.failed,
    status: computeStatus(summary),
  }
}

/** Returns an immutable snapshot of current worker health. */
export function getWorkerHealth(): WorkerHealth {
  return Object.freeze({
    status: state.status,
    lastRunAt: state.lastRunAt,
    jobsProcessed: state.jobsProcessed,
    jobsFailed: state.jobsFailed,
    uptimeMs: Date.now() - state.startedAt,
  })
}

/**
 * Resets all accumulated state.
 * Intended for use in tests only — do not call in production code.
 */
export function resetWorkerHealth(): void {
  state = {
    status: 'idle',
    lastRunAt: null,
    jobsProcessed: 0,
    jobsFailed: 0,
    startedAt: Date.now(),
  }
}
