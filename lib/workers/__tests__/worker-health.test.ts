import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getWorkerHealth,
  recordWorkerRun,
  resetWorkerHealth,
} from '../worker-health'

describe('worker-health', () => {
  beforeEach(() => {
    // Reset state between tests so they are independent
    resetWorkerHealth()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('returns idle status before any run', () => {
      // Arrange / Act
      const health = getWorkerHealth()

      // Assert
      expect(health.status).toBe('idle')
    })

    it('returns null lastRunAt before any run', () => {
      const health = getWorkerHealth()
      expect(health.lastRunAt).toBeNull()
    })

    it('returns zero jobsProcessed before any run', () => {
      const health = getWorkerHealth()
      expect(health.jobsProcessed).toBe(0)
    })

    it('returns zero jobsFailed before any run', () => {
      const health = getWorkerHealth()
      expect(health.jobsFailed).toBe(0)
    })

    it('returns uptimeMs >= 0', () => {
      const health = getWorkerHealth()
      expect(health.uptimeMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('recordWorkerRun', () => {
    it('updates lastRunAt to current ISO string after a run', () => {
      const now = new Date('2026-06-19T12:00:00.000Z')
      vi.setSystemTime(now)

      recordWorkerRun({ processed: 5, failed: 0 })

      const health = getWorkerHealth()
      expect(health.lastRunAt).toBe(now.toISOString())
    })

    it('accumulates jobsProcessed across multiple runs', () => {
      recordWorkerRun({ processed: 5, failed: 0 })
      recordWorkerRun({ processed: 3, failed: 0 })

      const health = getWorkerHealth()
      expect(health.jobsProcessed).toBe(8)
    })

    it('accumulates jobsFailed across multiple runs', () => {
      recordWorkerRun({ processed: 5, failed: 2 })
      recordWorkerRun({ processed: 3, failed: 1 })

      const health = getWorkerHealth()
      expect(health.jobsFailed).toBe(3)
    })

    it('sets status to healthy after a successful run', () => {
      recordWorkerRun({ processed: 1, failed: 0 })

      const health = getWorkerHealth()
      expect(health.status).toBe('healthy')
    })

    it('sets status to degraded when failure rate exceeds 50%', () => {
      recordWorkerRun({ processed: 1, failed: 5 })

      const health = getWorkerHealth()
      expect(health.status).toBe('degraded')
    })

    it('maintains healthy status when failure rate is under 50%', () => {
      recordWorkerRun({ processed: 10, failed: 4 })

      const health = getWorkerHealth()
      expect(health.status).toBe('healthy')
    })

    it('handles a run with all failures gracefully', () => {
      recordWorkerRun({ processed: 0, failed: 3 })

      const health = getWorkerHealth()
      expect(health.status).toBe('degraded')
      expect(health.jobsFailed).toBe(3)
    })

    it('handles a run with zero jobs (empty tick)', () => {
      recordWorkerRun({ processed: 0, failed: 0 })

      const health = getWorkerHealth()
      expect(health.status).toBe('healthy')
      expect(health.jobsProcessed).toBe(0)
    })
  })

  describe('uptimeMs', () => {
    it('returns increasing uptimeMs over time', () => {
      const start = getWorkerHealth().uptimeMs

      vi.advanceTimersByTime(5_000)

      const later = getWorkerHealth().uptimeMs
      expect(later).toBeGreaterThanOrEqual(start)
    })
  })

  describe('resetWorkerHealth', () => {
    it('resets all accumulated stats to zero', () => {
      recordWorkerRun({ processed: 10, failed: 2 })

      resetWorkerHealth()

      const health = getWorkerHealth()
      expect(health.jobsProcessed).toBe(0)
      expect(health.jobsFailed).toBe(0)
      expect(health.lastRunAt).toBeNull()
      expect(health.status).toBe('idle')
    })
  })

  describe('immutability', () => {
    it('returns a new object each time (not mutable state)', () => {
      const h1 = getWorkerHealth()
      const h2 = getWorkerHealth()
      expect(h1).not.toBe(h2)
    })

    it('returned object is frozen — mutations throw in strict mode', () => {
      const h1 = getWorkerHealth()
      expect(() => {
        // TypeScript readonly + Object.freeze both prevent mutation
        ;(h1 as unknown as Record<string, unknown>)['jobsProcessed'] = 999
      }).toThrow()

      const h2 = getWorkerHealth()
      expect(h2.jobsProcessed).toBe(0)
    })
  })
})
