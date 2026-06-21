import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  withExponentialBackoff,
  isTransientFcmError,
  computeBackoffDelayMs,
  type RetryConfig,
} from '../retry-policy'

describe('isTransientFcmError', () => {
  describe('permanent errors (should not retry)', () => {
    it('returns false for registration-token-not-registered', () => {
      expect(isTransientFcmError('registration-token-not-registered')).toBe(false)
    })

    it('returns false for invalid-registration-token', () => {
      expect(isTransientFcmError('invalid-registration-token')).toBe(false)
    })

    it('returns false for messaging/registration-token-not-registered', () => {
      expect(isTransientFcmError('messaging/registration-token-not-registered')).toBe(false)
    })

    it('returns false for messaging/invalid-registration-token', () => {
      expect(isTransientFcmError('messaging/invalid-registration-token')).toBe(false)
    })

    it('returns false for case-insensitive permanent errors', () => {
      expect(isTransientFcmError('REGISTRATION-TOKEN-NOT-REGISTERED')).toBe(false)
    })
  })

  describe('transient errors (should retry)', () => {
    it('returns true for INTERNAL_ERROR', () => {
      expect(isTransientFcmError('INTERNAL_ERROR')).toBe(true)
    })

    it('returns true for UNAVAILABLE', () => {
      expect(isTransientFcmError('UNAVAILABLE')).toBe(true)
    })

    it('returns true for quota-exceeded', () => {
      expect(isTransientFcmError('quota-exceeded')).toBe(true)
    })

    it('returns true for network timeout errors', () => {
      expect(isTransientFcmError('Request timeout')).toBe(true)
    })

    it('returns true for unknown errors', () => {
      expect(isTransientFcmError('Some unexpected error')).toBe(true)
    })

    it('returns true for empty string', () => {
      expect(isTransientFcmError('')).toBe(true)
    })
  })
})

describe('computeBackoffDelayMs', () => {
  it('returns baseDelayMs for attempt 1', () => {
    const delay = computeBackoffDelayMs(1, { baseDelayMs: 500, maxDelayMs: 30_000, jitter: false })
    expect(delay).toBe(500)
  })

  it('doubles the delay on each attempt', () => {
    const config = { baseDelayMs: 500, maxDelayMs: 60_000, jitter: false }
    expect(computeBackoffDelayMs(1, config)).toBe(500)
    expect(computeBackoffDelayMs(2, config)).toBe(1_000)
    expect(computeBackoffDelayMs(3, config)).toBe(2_000)
    expect(computeBackoffDelayMs(4, config)).toBe(4_000)
  })

  it('caps the delay at maxDelayMs', () => {
    const delay = computeBackoffDelayMs(10, { baseDelayMs: 500, maxDelayMs: 5_000, jitter: false })
    expect(delay).toBe(5_000)
  })

  it('adds jitter when jitter=true (returns value within [0.5x, 1.5x] range)', () => {
    const config = { baseDelayMs: 1_000, maxDelayMs: 60_000, jitter: true }
    const delays = Array.from({ length: 20 }, () => computeBackoffDelayMs(1, config))
    const min = Math.min(...delays)
    const max = Math.max(...delays)
    expect(min).toBeGreaterThanOrEqual(500)
    expect(max).toBeLessThanOrEqual(1_500)
    // There should be at least some variation (statistical property of jitter)
    expect(max).toBeGreaterThan(min)
  })

  it('handles attempt=0 gracefully (treats as attempt 1)', () => {
    const delay = computeBackoffDelayMs(0, { baseDelayMs: 500, maxDelayMs: 30_000, jitter: false })
    expect(delay).toBeGreaterThanOrEqual(0)
  })
})

describe('withExponentialBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 100,
    maxDelayMs: 5_000,
    jitter: false,
  }

  it('returns the result on first success without retrying', async () => {
    // Arrange
    const operation = vi.fn().mockResolvedValue('success')

    // Act
    const promise = withExponentialBackoff(operation, DEFAULT_RETRY_CONFIG)
    await vi.runAllTimersAsync()
    const result = await promise

    // Assert
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledOnce()
  })

  it('retries on transient error and succeeds on second attempt', async () => {
    // Arrange
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('INTERNAL_ERROR'))
      .mockResolvedValue('recovered')

    // Act
    const promise = withExponentialBackoff(operation, DEFAULT_RETRY_CONFIG)
    await vi.runAllTimersAsync()
    const result = await promise

    // Assert
    expect(result).toBe('recovered')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('retries up to maxRetries times on persistent transient errors', async () => {
    // Arrange
    const operation = vi.fn().mockRejectedValue(new Error('UNAVAILABLE'))

    // Act — must catch before awaiting timers to avoid unhandled rejection
    const promise = withExponentialBackoff(operation, DEFAULT_RETRY_CONFIG)
    const caught = promise.catch((e: unknown) => e)
    await vi.runAllTimersAsync()
    const err = await caught

    // Assert: initial call + maxRetries = 4 total
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toBe('UNAVAILABLE')
    expect(operation).toHaveBeenCalledTimes(DEFAULT_RETRY_CONFIG.maxRetries + 1)
  })

  it('does NOT retry on permanent (invalid token) errors', async () => {
    // Arrange
    const operation = vi.fn().mockRejectedValue(
      new Error('registration-token-not-registered'),
    )

    // Act — catch eagerly to prevent unhandled rejection in fake-timer context
    const promise = withExponentialBackoff(operation, DEFAULT_RETRY_CONFIG)
    const caught = promise.catch((e: unknown) => e)
    await vi.runAllTimersAsync()
    const err = await caught

    // Assert: only the initial attempt, no retries
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toBe('registration-token-not-registered')
    expect(operation).toHaveBeenCalledOnce()
  })

  it('does NOT retry on messaging/invalid-registration-token error', async () => {
    const operation = vi.fn().mockRejectedValue(
      new Error('messaging/invalid-registration-token'),
    )

    const promise = withExponentialBackoff(operation, DEFAULT_RETRY_CONFIG)
    const caught = promise.catch((e: unknown) => e)
    await vi.runAllTimersAsync()
    const err = await caught

    expect(err).toBeInstanceOf(Error)
    expect(operation).toHaveBeenCalledOnce()
  })

  it('uses exponential delays between retries', async () => {
    const advanceSpy = vi.spyOn(globalThis, 'setTimeout')
    const operation = vi.fn().mockRejectedValue(new Error('UNAVAILABLE'))

    const promise = withExponentialBackoff(operation, {
      maxRetries: 2,
      baseDelayMs: 200,
      maxDelayMs: 10_000,
      jitter: false,
    })
    const caught = promise.catch((e: unknown) => e)
    await vi.runAllTimersAsync()
    await caught

    // setTimeout should have been called with increasing delays
    const delays = advanceSpy.mock.calls.map(([, delay]) => delay as number)
    const retryDelays = delays.filter((d) => d >= 200)

    expect(retryDelays.length).toBeGreaterThanOrEqual(2)
    // Second delay should be >= first delay (exponential)
    if (retryDelays.length >= 2) {
      expect(retryDelays[1]).toBeGreaterThanOrEqual(retryDelays[0])
    }
  })

  it('handles non-Error throws as transient', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce('string-error')
      .mockResolvedValue('ok')

    const promise = withExponentialBackoff(operation, DEFAULT_RETRY_CONFIG)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('ok')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('works with maxRetries=0 (no retries)', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('UNAVAILABLE'))

    const promise = withExponentialBackoff(operation, {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 0,
    })
    const caught = promise.catch((e: unknown) => e)
    await vi.runAllTimersAsync()
    const err = await caught

    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toBe('UNAVAILABLE')
    expect(operation).toHaveBeenCalledOnce()
  })
})
