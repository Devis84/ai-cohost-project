import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  createRateLimiter,
  checkRateLimit,
  resetRateLimiter,
} from '../rate-limiter'

describe('createRateLimiter', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic allow/deny', () => {
    it('allows requests under the limit', () => {
      // Arrange
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })

      // Act / Assert
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(limiter, 'ip-1')
        expect(result.allowed).toBe(true)
      }
    })

    it('denies the request that exceeds the limit', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 })

      checkRateLimit(limiter, 'ip-1')
      checkRateLimit(limiter, 'ip-1')
      checkRateLimit(limiter, 'ip-1')

      const result = checkRateLimit(limiter, 'ip-1')
      expect(result.allowed).toBe(false)
    })

    it('tracks keys independently', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })

      const r1 = checkRateLimit(limiter, 'ip-A')
      const r2 = checkRateLimit(limiter, 'ip-B')

      expect(r1.allowed).toBe(true)
      expect(r2.allowed).toBe(true)
    })

    it('denies second request from same key when limit is 1', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })

      checkRateLimit(limiter, 'user-1')
      const result = checkRateLimit(limiter, 'user-1')

      expect(result.allowed).toBe(false)
    })
  })

  describe('sliding window reset', () => {
    it('resets the count after the window expires', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 2, windowMs: 10_000 })

      checkRateLimit(limiter, 'ip-1')
      checkRateLimit(limiter, 'ip-1')
      // Window exhausted
      expect(checkRateLimit(limiter, 'ip-1').allowed).toBe(false)

      // Advance time past the window
      vi.advanceTimersByTime(11_000)

      // Should be allowed again
      expect(checkRateLimit(limiter, 'ip-1').allowed).toBe(true)
    })

    it('does not reset before the window expires', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 1, windowMs: 10_000 })

      checkRateLimit(limiter, 'ip-1')
      vi.advanceTimersByTime(9_999)

      expect(checkRateLimit(limiter, 'ip-1').allowed).toBe(false)
    })
  })

  describe('result metadata', () => {
    it('returns remaining count when allowed', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })

      const result = checkRateLimit(limiter, 'ip-1')
      expect(result.remaining).toBe(4)
    })

    it('returns zero remaining when at limit', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 })

      checkRateLimit(limiter, 'ip-1')
      const result = checkRateLimit(limiter, 'ip-1')

      expect(result.remaining).toBe(0)
    })

    it('returns retryAfterMs > 0 when denied', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })

      checkRateLimit(limiter, 'ip-1')
      const result = checkRateLimit(limiter, 'ip-1')

      expect(result.allowed).toBe(false)
      expect(result.retryAfterMs).toBeGreaterThan(0)
    })

    it('returns retryAfterMs of 0 when allowed', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })

      const result = checkRateLimit(limiter, 'ip-1')

      expect(result.retryAfterMs).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty key string', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
      expect(() => checkRateLimit(limiter, '')).not.toThrow()
    })

    it('handles maxRequests of 0 (always denies)', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 0, windowMs: 60_000 })
      const result = checkRateLimit(limiter, 'ip-1')
      expect(result.allowed).toBe(false)
    })

    it('handles very large number of keys without throwing', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 })
      for (let i = 0; i < 1000; i++) {
        checkRateLimit(limiter, `ip-${i}`)
      }
      // Should still work for a new key — well within the default 10 000 limit
      expect(checkRateLimit(limiter, 'new-ip').allowed).toBe(true)
    })

    it('handles special characters in key', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })
      expect(() => checkRateLimit(limiter, '::1')).not.toThrow()
      expect(() => checkRateLimit(limiter, '192.168.0.1')).not.toThrow()
    })
  })

  describe('store size cap (DoS protection)', () => {
    it('denies new keys once maxStoreSize is reached', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000, maxStoreSize: 3 })

      // Fill the store to capacity with 3 distinct IPs.
      checkRateLimit(limiter, 'ip-1')
      checkRateLimit(limiter, 'ip-2')
      checkRateLimit(limiter, 'ip-3')

      // A fourth unseen IP should be denied (store full, no stale entries to evict).
      const result = checkRateLimit(limiter, 'ip-4')
      expect(result.allowed).toBe(false)
    })

    it('allows a known key even when the store is at capacity', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000, maxStoreSize: 2 })

      checkRateLimit(limiter, 'ip-1')
      checkRateLimit(limiter, 'ip-2')

      // ip-1 already has an entry — must still be allowed.
      const result = checkRateLimit(limiter, 'ip-1')
      expect(result.allowed).toBe(true)
    })

    it('evicts expired entries and accepts new keys after eviction frees space', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 10, windowMs: 10_000, maxStoreSize: 2 })

      checkRateLimit(limiter, 'ip-1')
      checkRateLimit(limiter, 'ip-2')

      // Store is full; ip-3 is denied.
      expect(checkRateLimit(limiter, 'ip-3').allowed).toBe(false)

      // Advance past the window so both entries are stale.
      vi.advanceTimersByTime(11_000)

      // Now ip-3 triggers eviction and can claim a slot.
      expect(checkRateLimit(limiter, 'ip-3').allowed).toBe(true)
    })

    it('uses the default maxStoreSize of 10 000 when not configured', () => {
      vi.useFakeTimers()
      const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 })
      expect(limiter.config.maxStoreSize).toBe(10_000)
    })
  })
})

describe('resetRateLimiter', () => {
  it('clears all tracked keys', () => {
    vi.useFakeTimers()
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })

    checkRateLimit(limiter, 'ip-1')
    // Exhausted
    expect(checkRateLimit(limiter, 'ip-1').allowed).toBe(false)

    resetRateLimiter(limiter)

    // After reset, should be allowed again
    expect(checkRateLimit(limiter, 'ip-1').allowed).toBe(true)

    vi.useRealTimers()
  })

  it('clears only the specified limiter (not others)', () => {
    vi.useFakeTimers()
    const limiter1 = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    const limiter2 = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })

    checkRateLimit(limiter1, 'ip-1')
    checkRateLimit(limiter2, 'ip-1')

    resetRateLimiter(limiter1)

    expect(checkRateLimit(limiter1, 'ip-1').allowed).toBe(true)
    expect(checkRateLimit(limiter2, 'ip-1').allowed).toBe(false)

    vi.useRealTimers()
  })
})
