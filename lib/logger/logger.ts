/**
 * Structured JSON logger with correlation ID support.
 *
 * Design decisions:
 * - Writes to process.stdout (not console.log) so output is always JSON.
 * - Sensitive fields are redacted before serialization (tokens, passwords, etc.).
 * - Stack traces are only included in non-production environments.
 * - Returns a new object for every log call (immutable pattern).
 */

import { randomUUID } from 'crypto'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface CorrelationContext {
  requestId: string
  hostId?: string
  propertyId?: string
  attemptId?: string
}

export type LogContext = CorrelationContext

/** Field names whose values must never appear in log output. */
const SENSITIVE_FIELD_NAMES: ReadonlySet<string> = new Set([
  'notification_token',
  'token',
  'authorization',
  'password',
  'apikey',
  'api_key',
  'secret',
  'secretkey',
  'accesstoken',
  'access_token',
  'bearer',
  'refresh_token',
  'refreshtoken',
  'client_secret',
  'clientsecret',
  'private_key',
  'privatekey',
])

function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_NAMES.has(fieldName.toLowerCase())
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Error) &&
    !(value instanceof Date)
  )
}

/**
 * Recursively sanitizes an object by replacing sensitive field values with
 * '[REDACTED]'. Recurses into plain nested objects; leaves arrays, Errors,
 * and Dates untouched at their level (array elements that are plain objects
 * are also sanitized).
 */
export function sanitizeLogData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveField(key)) {
      result[key] = '[REDACTED]'
    } else if (isPlainObject(value)) {
      result[key] = sanitizeLogData(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        isPlainObject(item) ? sanitizeLogData(item) : item,
      )
    } else {
      result[key] = value
    }
  }

  return result
}

function serializeError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) {
    return { raw: String(err) }
  }

  const base: Record<string, unknown> = { message: err.message }

  if (process.env.NODE_ENV !== 'production') {
    base.stack = err.stack
  }

  return base
}

function serializeExtra(extra: Record<string, unknown>): Record<string, unknown> {
  const sanitized = sanitizeLogData(extra)
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(sanitized)) {
    if (value instanceof Error) {
      result[key] = serializeError(value)
    } else {
      result[key] = value
    }
  }

  return result
}

function buildEntry(
  level: LogLevel,
  message: string,
  context: CorrelationContext,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  const extraFields = extra ? serializeExtra(extra) : {}

  // Core fields come last so they cannot be overridden by extra data.
  return {
    ...extraFields,
    requestId: context.requestId,
    ...(context.hostId !== undefined && { hostId: context.hostId }),
    ...(context.propertyId !== undefined && { propertyId: context.propertyId }),
    ...(context.attemptId !== undefined && { attemptId: context.attemptId }),
    timestamp: new Date().toISOString(),
    level,
    message,
  }
}

export interface Logger {
  debug(message: string, extra?: Record<string, unknown>): void
  info(message: string, extra?: Record<string, unknown>): void
  warn(message: string, extra?: Record<string, unknown>): void
  error(message: string, extra?: Record<string, unknown>): void
}

export function createLogger(context: CorrelationContext): Logger {
  function log(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
    const entry = buildEntry(level, message, context, extra)
    process.stdout.write(JSON.stringify(entry) + '\n')
  }

  return {
    debug: (msg, extra) => log('debug', msg, extra),
    info: (msg, extra) => log('info', msg, extra),
    warn: (msg, extra) => log('warn', msg, extra),
    error: (msg, extra) => log('error', msg, extra),
  }
}

/**
 * Creates a new CorrelationContext with a generated requestId.
 * Accepts optional overrides for hostId, propertyId, and attemptId.
 */
export function createCorrelationContext(
  overrides: Partial<Omit<CorrelationContext, 'requestId'>> = {},
): CorrelationContext {
  return {
    requestId: randomUUID(),
    ...overrides,
  }
}
