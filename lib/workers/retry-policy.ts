/**
 * Exponential backoff retry policy for transient FCM delivery failures.
 *
 * Design decisions:
 * - Distinguishes permanent (invalid token) errors from transient ones.
 * - Permanent errors propagate immediately with no retries.
 * - Jitter is configurable to spread load when many workers retry concurrently.
 * - Uses a sleep-based approach with setTimeout so fake timers work in tests.
 */

/** Error patterns that indicate a permanent FCM failure (no retry). */
const PERMANENT_ERROR_PATTERNS: readonly string[] = [
  'registration-token-not-registered',
  'invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]

/**
 * Returns true when the error message indicates a transient failure that
 * warrants a retry. Returns false for permanent failures (e.g. invalid token).
 */
export function isTransientFcmError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase()
  return !PERMANENT_ERROR_PATTERNS.some((pattern) => lower.includes(pattern))
}

export interface BackoffConfig {
  /** Initial delay for attempt 1. */
  baseDelayMs: number
  /** Upper ceiling — delay is capped at this value. */
  maxDelayMs: number
  /** When true, adds a random factor in the [0.5, 1.5] range. */
  jitter: boolean
}

export interface RetryConfig extends BackoffConfig {
  /** Total number of retry attempts (not counting the initial call). */
  maxRetries: number
}

/**
 * Computes the backoff delay for a given attempt number (1-based).
 * Doubles the base delay on each attempt and applies an optional jitter.
 */
export function computeBackoffDelayMs(
  attempt: number,
  config: BackoffConfig,
): number {
  const safeAttempt = Math.max(1, attempt)
  const rawDelay = config.baseDelayMs * Math.pow(2, safeAttempt - 1)
  const capped = Math.min(rawDelay, config.maxDelayMs)

  if (!config.jitter) {
    return capped
  }

  // Jitter in [0.5, 1.5] range
  const jitterFactor = 0.5 + Math.random()
  return Math.min(Math.round(capped * jitterFactor), config.maxDelayMs)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/**
 * Wraps an async operation with exponential backoff retries.
 *
 * - Permanent errors (invalid token) are re-thrown immediately.
 * - Transient errors trigger up to `maxRetries` additional attempts.
 * - The last error is re-thrown if all retries are exhausted.
 */
export async function withExponentialBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (err: unknown) {
      lastError = err
      const message = extractErrorMessage(err)

      // Never retry permanent errors.
      if (!isTransientFcmError(message)) {
        throw err
      }

      // No more retries left.
      if (attempt >= config.maxRetries) {
        break
      }

      const delayMs = computeBackoffDelayMs(attempt + 1, config)
      await sleep(delayMs)
    }
  }

  throw lastError
}
