import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We capture what gets written to stdout without importing the module yet.
const { mockStdoutWrite } = vi.hoisted(() => {
  const mockStdoutWrite = vi.fn()
  return { mockStdoutWrite }
})

vi.stubGlobal('process', {
  ...process,
  stdout: { write: mockStdoutWrite },
})

import {
  createLogger,
  createCorrelationContext,
  sanitizeLogData,
} from '../logger'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function capturedLine(): Record<string, unknown> {
  const calls = mockStdoutWrite.mock.calls
  if (calls.length === 0) throw new Error('No log output captured')
  const lastCall = calls[calls.length - 1]
  return JSON.parse(lastCall[0] as string)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('output format', () => {
    it('writes a JSON object to stdout', () => {
      // Arrange
      const logger = createLogger({ requestId: 'req-123' })

      // Act
      logger.info('hello world')

      // Assert
      expect(mockStdoutWrite).toHaveBeenCalledOnce()
      const line = capturedLine()
      expect(line).toMatchObject({ message: 'hello world', level: 'info' })
    })

    it('includes timestamp in ISO-8601 format', () => {
      const logger = createLogger({ requestId: 'req-1' })
      logger.info('timestamp test')

      const line = capturedLine()
      expect(typeof line.timestamp).toBe('string')
      expect(new Date(line.timestamp as string).toISOString()).toBe(line.timestamp)
    })

    it('appends a newline to each log entry', () => {
      const logger = createLogger({ requestId: 'req-1' })
      logger.info('newline test')

      const raw = mockStdoutWrite.mock.calls[0][0] as string
      expect(raw.endsWith('\n')).toBe(true)
    })
  })

  describe('log levels', () => {
    it('sets level=info for logger.info()', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.info('info msg')
      expect(capturedLine().level).toBe('info')
    })

    it('sets level=warn for logger.warn()', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.warn('warn msg')
      expect(capturedLine().level).toBe('warn')
    })

    it('sets level=error for logger.error()', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.error('error msg')
      expect(capturedLine().level).toBe('error')
    })

    it('sets level=debug for logger.debug()', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.debug('debug msg')
      expect(capturedLine().level).toBe('debug')
    })
  })

  describe('correlation context', () => {
    it('includes requestId in every log entry', () => {
      const logger = createLogger({ requestId: 'req-abc-123' })
      logger.info('test')
      expect(capturedLine().requestId).toBe('req-abc-123')
    })

    it('includes hostId when provided', () => {
      const logger = createLogger({ requestId: 'r1', hostId: 'host-xyz' })
      logger.info('test')
      expect(capturedLine().hostId).toBe('host-xyz')
    })

    it('includes propertyId when provided', () => {
      const logger = createLogger({ requestId: 'r1', propertyId: 'prop-999' })
      logger.info('test')
      expect(capturedLine().propertyId).toBe('prop-999')
    })

    it('includes attemptId when provided', () => {
      const logger = createLogger({ requestId: 'r1', attemptId: 'att-007' })
      logger.info('test')
      expect(capturedLine().attemptId).toBe('att-007')
    })

    it('omits optional correlation fields when not provided', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.info('test')
      const line = capturedLine()
      expect(line).not.toHaveProperty('hostId')
      expect(line).not.toHaveProperty('propertyId')
      expect(line).not.toHaveProperty('attemptId')
    })
  })

  describe('extra data fields', () => {
    it('merges extra fields into the log entry', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.info('with extra', { jobCount: 5, status: 'ok' })
      const line = capturedLine()
      expect(line.jobCount).toBe(5)
      expect(line.status).toBe('ok')
    })

    it('does not override level, message, or timestamp via extra data', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.info('original', { level: 'hacked', message: 'hacked', timestamp: 'hacked' })
      const line = capturedLine()
      expect(line.level).toBe('info')
      expect(line.message).toBe('original')
      expect(typeof new Date(line.timestamp as string).getTime()).toBe('number')
    })

    it('handles undefined extra data gracefully', () => {
      const logger = createLogger({ requestId: 'r1' })
      expect(() => logger.info('no extra')).not.toThrow()
    })
  })

  describe('token / secret sanitization', () => {
    it('does not log notification_token values', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.info('device registered', { notification_token: 'secret-fcm-token-xyz' })
      const raw = mockStdoutWrite.mock.calls[0][0] as string
      expect(raw).not.toContain('secret-fcm-token-xyz')
    })

    it('does not log fields named token', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.info('auth', { token: 'bearer-abc-123' })
      const raw = mockStdoutWrite.mock.calls[0][0] as string
      expect(raw).not.toContain('bearer-abc-123')
    })

    it('does not log fields named authorization', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.info('request headers', { authorization: 'Bearer super-secret' })
      const raw = mockStdoutWrite.mock.calls[0][0] as string
      expect(raw).not.toContain('super-secret')
    })

    it('does not log fields named password', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.info('creds', { password: 'p@ssword123' })
      const raw = mockStdoutWrite.mock.calls[0][0] as string
      expect(raw).not.toContain('p@ssword123')
    })

    it('replaces sensitive fields with [REDACTED] rather than omitting them', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.info('device info', { notification_token: 'fcm-abc', deviceId: 'dev-1' })
      const line = capturedLine()
      expect(line.notification_token).toBe('[REDACTED]')
      expect(line.deviceId).toBe('dev-1')
    })

    it('does not log fields named apiKey', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.info('api call', { apiKey: 'sk-proj-abc' })
      const raw = mockStdoutWrite.mock.calls[0][0] as string
      expect(raw).not.toContain('sk-proj-abc')
    })
  })

  describe('error serialization', () => {
    it('serializes Error objects to a safe representation', () => {
      const logger = createLogger({ requestId: 'r1' })
      logger.error('something failed', { err: new Error('boom') })
      const line = capturedLine()
      expect(typeof line.err).toBe('object')
      expect((line.err as Record<string, unknown>).message).toBe('boom')
    })

    it('does not expose Error stack frames in production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      const logger = createLogger({ requestId: 'r1' })
      logger.error('prod error', { err: new Error('prod-boom') })
      const line = capturedLine()
      expect((line.err as Record<string, unknown>).stack).toBeUndefined()
      vi.unstubAllEnvs()
    })
  })
})

describe('createCorrelationContext', () => {
  it('generates a unique requestId each time', () => {
    const ctx1 = createCorrelationContext()
    const ctx2 = createCorrelationContext()
    expect(ctx1.requestId).not.toBe(ctx2.requestId)
  })

  it('returns an object with requestId string', () => {
    const ctx = createCorrelationContext()
    expect(typeof ctx.requestId).toBe('string')
    expect(ctx.requestId.length).toBeGreaterThan(0)
  })

  it('accepts optional override context', () => {
    const ctx = createCorrelationContext({ hostId: 'h-1', propertyId: 'p-1' })
    expect(ctx.hostId).toBe('h-1')
    expect(ctx.propertyId).toBe('p-1')
    expect(typeof ctx.requestId).toBe('string')
  })
})

describe('sanitizeLogData', () => {
  it('redacts notification_token', () => {
    const result = sanitizeLogData({ notification_token: 'tok-abc', name: 'device' })
    expect(result.notification_token).toBe('[REDACTED]')
    expect(result.name).toBe('device')
  })

  it('redacts token field', () => {
    const result = sanitizeLogData({ token: 'abc-secret' })
    expect(result.token).toBe('[REDACTED]')
  })

  it('redacts password field', () => {
    const result = sanitizeLogData({ password: 'secret' })
    expect(result.password).toBe('[REDACTED]')
  })

  it('redacts authorization field', () => {
    const result = sanitizeLogData({ authorization: 'Bearer xyz' })
    expect(result.authorization).toBe('[REDACTED]')
  })

  it('redacts apiKey field', () => {
    const result = sanitizeLogData({ apiKey: 'key-123' })
    expect(result.apiKey).toBe('[REDACTED]')
  })

  it('does not mutate the input object', () => {
    const input = { token: 'secret', name: 'test' }
    sanitizeLogData(input)
    expect(input.token).toBe('secret')
  })

  it('handles empty object', () => {
    expect(sanitizeLogData({})).toEqual({})
  })

  it('recurses into nested plain objects and redacts sensitive fields', () => {
    const result = sanitizeLogData({ meta: { token: 'nested-secret' }, name: 'top' })
    expect((result.meta as Record<string, unknown>).token).toBe('[REDACTED]')
    expect(result.name).toBe('top')
  })

  it('redacts deeply nested sensitive fields', () => {
    const result = sanitizeLogData({
      outer: { inner: { notification_token: 'deep-secret', safe: 'ok' } },
    })
    const inner = (result.outer as Record<string, unknown>).inner as Record<string, unknown>
    expect(inner.notification_token).toBe('[REDACTED]')
    expect(inner.safe).toBe('ok')
  })

  it('redacts sensitive fields inside array elements that are plain objects', () => {
    const result = sanitizeLogData({
      devices: [{ id: 'd1', token: 'tok-1' }, { id: 'd2', token: 'tok-2' }],
    })
    const devices = result.devices as Array<Record<string, unknown>>
    expect(devices[0].token).toBe('[REDACTED]')
    expect(devices[0].id).toBe('d1')
    expect(devices[1].token).toBe('[REDACTED]')
  })

  it('redacts accessToken field', () => {
    const result = sanitizeLogData({ accessToken: 'oauth-access-xyz' })
    expect(result.accessToken).toBe('[REDACTED]')
  })

  it('redacts access_token field', () => {
    const result = sanitizeLogData({ access_token: 'oauth-access-xyz' })
    expect(result.access_token).toBe('[REDACTED]')
  })

  it('redacts secretKey field', () => {
    const result = sanitizeLogData({ secretKey: 'sk-secret-xyz' })
    expect(result.secretKey).toBe('[REDACTED]')
  })

  it('redacts bearer field', () => {
    const result = sanitizeLogData({ bearer: 'Bearer eyJhbGci...' })
    expect(result.bearer).toBe('[REDACTED]')
  })

  it('redacts refresh_token field', () => {
    const result = sanitizeLogData({ refresh_token: 'rt-xyz' })
    expect(result.refresh_token).toBe('[REDACTED]')
  })

  it('preserves non-sensitive fields unchanged', () => {
    const result = sanitizeLogData({ jobCount: 5, status: 'ok', requestId: 'r-1' })
    expect(result).toEqual({ jobCount: 5, status: 'ok', requestId: 'r-1' })
  })

  it('does not recurse into Error instances', () => {
    const err = new Error('boom')
    const result = sanitizeLogData({ err, safe: 'yes' })
    expect(result.err).toBe(err)
    expect(result.safe).toBe('yes')
  })

  it('does not recurse into Date instances', () => {
    const d = new Date('2026-01-01')
    const result = sanitizeLogData({ createdAt: d })
    expect(result.createdAt).toBe(d)
  })
})
