/**
 * In-memory sliding-window rate limiter.
 *
 * Design decisions:
 * - Pure in-process state (no Redis dependency).
 * - Uses a fixed window per key, reset when the window expires.
 * - Returns an immutable result object — callers must not mutate it.
 * - Exported factory pattern so tests can create independent instances.
 * - Lazily evicts expired entries on each call to bound memory growth.
 * - Enforces a hard ceiling on the number of tracked keys (maxStoreSize)
 *   so that IP rotation attacks cannot exhaust process heap.
 */

export interface RateLimiterConfig {
  /** Maximum number of allowed requests within the window. */
  maxRequests: number
  /** Length of the rate-limit window in milliseconds. */
  windowMs: number
  /**
   * Hard ceiling on the number of keys tracked simultaneously.
   * Requests that arrive when the store is full and the key is not already
   * tracked are denied. Defaults to 10 000.
   */
  maxStoreSize?: number
}

export interface RateLimitResult {
  readonly allowed: boolean
  /** Requests remaining in the current window. */
  readonly remaining: number
  /** Milliseconds until the window resets (0 when allowed). */
  readonly retryAfterMs: number
}

interface WindowEntry {
  count: number
  windowStart: number
}

export interface RateLimiter {
  readonly config: Required<RateLimiterConfig>
  /** @internal Exposed for resetRateLimiter only — do not mutate directly. */
  readonly store: Map<string, WindowEntry>
}

const DEFAULT_MAX_STORE_SIZE = 10_000

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return {
    config: {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      maxStoreSize: config.maxStoreSize ?? DEFAULT_MAX_STORE_SIZE,
    },
    store: new Map(),
  }
}

/**
 * Removes all entries whose window has expired.
 * Called lazily before each store mutation to keep memory bounded.
 */
function evictExpiredEntries(limiter: RateLimiter, now: number): void {
  for (const [key, entry] of limiter.store) {
    if (now - entry.windowStart >= limiter.config.windowMs) {
      limiter.store.delete(key)
    }
  }
}

export function checkRateLimit(limiter: RateLimiter, key: string): RateLimitResult {
  const { maxRequests, windowMs, maxStoreSize } = limiter.config
  const now = Date.now()

  // Deny immediately when limit is 0.
  if (maxRequests <= 0) {
    return { allowed: false, remaining: 0, retryAfterMs: windowMs }
  }

  const existing = limiter.store.get(key)

  // Window has expired or first request — start a fresh window.
  if (!existing || now - existing.windowStart >= windowMs) {
    // Evict stale entries before potentially adding a new key.
    evictExpiredEntries(limiter, now)

    // After eviction, check if the store has room for a new key.
    const isNewKey = !existing || now - existing.windowStart >= windowMs
    if (isNewKey && !limiter.store.has(key) && limiter.store.size >= maxStoreSize) {
      // Store is at capacity: deny rather than grow unboundedly.
      return { allowed: false, remaining: 0, retryAfterMs: windowMs }
    }

    limiter.store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 }
  }

  // Within an existing window.
  if (existing.count >= maxRequests) {
    const retryAfterMs = windowMs - (now - existing.windowStart)
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  // Increment within the window.
  const updated: WindowEntry = {
    count: existing.count + 1,
    windowStart: existing.windowStart,
  }
  limiter.store.set(key, updated)

  return {
    allowed: true,
    remaining: maxRequests - updated.count,
    retryAfterMs: 0,
  }
}

/** Clears all tracking state for the given limiter instance. Useful in tests. */
export function resetRateLimiter(limiter: RateLimiter): void {
  limiter.store.clear()
}
