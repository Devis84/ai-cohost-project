# Deployment Guide — Production Hardening (Phase 8)

**Last Updated:** 2026-06-19

**Status:** Complete — All 752 tests passing

This guide covers the production hardening features added in Phase 8:
- Structured logging with correlation IDs
- Rate limiting on critical endpoints
- Device token cleanup for inactive devices
- Retry policy for transient FCM failures
- Worker health monitoring

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Structured Logging](#structured-logging)
4. [Rate Limiting](#rate-limiting)
5. [Device Token Cleanup](#device-token-cleanup)
6. [FCM Retry Policy](#fcm-retry-policy)
7. [Worker Health Monitoring](#worker-health-monitoring)
8. [Deployment Checklist](#deployment-checklist)

---

## Overview

Phase 8 hardening adds three critical production systems:

1. **Structured Logging** — JSON-formatted logs with correlation IDs (requestId, hostId, propertyId, attemptId) and sensitive field redaction
2. **Rate Limiting** — Fixed-window rate limiter on guest requests and test notifications
3. **Device Cleanup** — Scheduled job to revoke tokens from inactive devices
4. **Retry Policy** — Exponential backoff for transient FCM failures (not for permanent errors like invalid tokens)
5. **Health Check** — GET /api/health/worker endpoint for monitoring worker status

All systems are designed to work without external dependencies (no Redis, no distributed state) but can be integrated with distributed systems later if needed.

---

## Environment Variables

Add these to your production `.env` file. All have sensible defaults if omitted.

### Rate Limiting

```env
# Maximum guest requests per minute per IP address (default: 10)
GUEST_REQUEST_RATE_LIMIT=10

# Maximum test notifications per minute per host (default: 5)
TEST_NOTIFICATION_RATE_LIMIT=5
```

**Configuration notes:**
- GUEST_REQUEST_RATE_LIMIT is per-IP, enforced at `POST /api/guest/requests`
- TEST_NOTIFICATION_RATE_LIMIT is per-IP, enforced at `POST /api/host/notifications/test`
- Returns HTTP 429 with `Retry-After` header when limit exceeded
- Window is 60 seconds (1 minute)

### Device Token Cleanup

```env
# Days of inactivity before a device token is considered stale (default: 30)
DEVICE_INACTIVE_DAYS_THRESHOLD=30

# Maximum devices to revoke per cleanup invocation (default: 1000)
DEVICE_CLEANUP_BATCH_SIZE=1000
```

**Configuration notes:**
- Cleanup runs as a scheduled job (see [Device Token Cleanup](#device-token-cleanup) section for scheduling)
- Devices with `last_seen_at < now - DEVICE_INACTIVE_DAYS_THRESHOLD` are marked revoked
- Batch size prevents locking too many rows at once
- Recommended: Run cleanup daily or weekly

### FCM Retry Policy

```env
# Maximum retry attempts for transient FCM failures (default: 3)
FCM_MAX_RETRIES=3

# Base delay in milliseconds for first retry (default: 1000)
FCM_RETRY_BASE_DELAY_MS=1000

# Maximum delay cap in milliseconds for retries (default: 30000)
FCM_RETRY_MAX_DELAY_MS=30000
```

**Configuration notes:**
- Uses exponential backoff: delay doubles on each retry (capped at max)
- Jitter is enabled by default to spread load
- Permanent errors (invalid token) are never retried
- Values in milliseconds; defaults are conservative and production-safe

**Example backoff sequence (with base=1000, max=30000):**
- Attempt 1: immediate
- Attempt 2 (after retry 1): ~1000ms
- Attempt 3 (after retry 2): ~2000ms
- Attempt 4 (after retry 3): ~4000ms

### Example Production Configuration

```env
# Rate limiting
GUEST_REQUEST_RATE_LIMIT=10
TEST_NOTIFICATION_RATE_LIMIT=5

# Device cleanup
DEVICE_INACTIVE_DAYS_THRESHOLD=30
DEVICE_CLEANUP_BATCH_SIZE=1000

# FCM retry policy
FCM_MAX_RETRIES=3
FCM_RETRY_BASE_DELAY_MS=1000
FCM_RETRY_MAX_DELAY_MS=30000

# Node environment
NODE_ENV=production
```

---

## Structured Logging

All backend logging is now structured JSON with automatic correlation ID tracking and sensitive field redaction.

### Log Format

Every log entry includes:

```json
{
  "requestId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "hostId": "host-123",
  "propertyId": "prop-456",
  "attemptId": "attempt-789",
  "timestamp": "2026-06-19T10:30:45.123Z",
  "level": "info|warn|error|debug",
  "message": "Device registered successfully"
}
```

**Fields:**
- `requestId` (required) — UUID generated per request, traces complete flow
- `hostId`, `propertyId`, `attemptId` — Optional context-specific fields
- `timestamp` — ISO 8601 timestamp in UTC
- `level` — Log level (info, warn, error, debug)
- `message` — Human-readable message

### Sensitive Field Redaction

The logger automatically redacts these fields (case-insensitive):
- `notification_token`
- `token`
- `authorization`
- `password`
- `apikey` / `api_key`
- `secret`

**Example:** If you log `{ notification_token: "FCM_TOKEN_HERE" }`, it becomes:
```json
{
  "requestId": "...",
  "notification_token": "[REDACTED]",
  "timestamp": "...",
  "level": "info",
  "message": "..."
}
```

### Using the Logger in Routes

```typescript
import { createLogger, createCorrelationContext } from '@/lib/logger/logger'

export async function POST(request: NextRequest) {
  const context = createCorrelationContext({
    hostId: user.id,
    propertyId: body.property_id,
  })
  const logger = createLogger(context)

  logger.info('Request received', { title: body.title })
  
  try {
    const result = await operation()
    logger.info('Operation succeeded', { resultId: result.id })
    return NextResponse.json({ success: true, data: result })
  } catch (err: unknown) {
    logger.error('Operation failed', { error: err })
    return NextResponse.json({ success: false, error: '...' }, { status: 500 })
  }
}
```

### Parsing Logs in Production

Since logs are JSON, you can pipe them to log aggregation services:

```bash
# Parse with jq (local development)
node app.js | jq '.message'

# CloudWatch Insights (AWS)
fields @timestamp, level, message, requestId, hostId, error
| filter level = "error"
| stats count() by hostId

# Datadog
@timestamp @severity requestId message
```

### No console.log

The codebase contains **zero `console.log` statements**. All logging goes through the structured logger.

If you need temporary debugging, use the logger with `debug` level:
```typescript
logger.debug('temporary debug', { variable: myValue })
```

---

## Rate Limiting

Two critical endpoints are rate-limited:

### 1. Guest Requests: POST /api/guest/requests

**Rate limit:** Configurable via `GUEST_REQUEST_RATE_LIMIT` (default: 10 per minute per IP)

**Behavior:**
- Tracks requests by client IP address
- Uses fixed-window of 60 seconds
- Returns HTTP 429 when limit exceeded
- Includes `Retry-After` header with seconds to wait

**Response when rate-limited:**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later."
}
```

**Headers:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 42
```

**Use cases to monitor:**
- Automated guest request systems
- Load testing
- Bot activity detection

### 2. Test Notifications: POST /api/host/notifications/test

**Rate limit:** Configurable via `TEST_NOTIFICATION_RATE_LIMIT` (default: 5 per minute per IP)

**Behavior:**
- Tracks requests by client IP address (even though user is authenticated)
- Uses fixed-window of 60 seconds
- Returns HTTP 429 when limit exceeded
- Includes `Retry-After` header

**Response when rate-limited:**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later."
}
```

**Use cases to monitor:**
- Hosts rapidly testing notifications
- Automation testing notification delivery

### Rate Limiter Implementation

The rate limiter uses in-memory state:
- **Algorithm:** Fixed-window (not sliding-window)
- **Storage:** In-process Map (resets on server restart)
- **Cost:** O(1) per request
- **Scalability:** Single-server only (no distributed state)

**Future enhancement:** Replace with Redis for multi-server deployments.

---

## Device Token Cleanup

Inactive device tokens should be periodically revoked to:
- Prevent sending to devices that no longer exist
- Reduce database query time for active devices
- Improve notification delivery performance

### How It Works

1. Query for devices with `last_seen_at < now - DEVICE_INACTIVE_DAYS_THRESHOLD`
2. Exclude already-revoked devices (`revoked_at IS NOT NULL`)
3. Batch update to mark them revoked (soft delete)
4. Log the result

**Configuration:**
- `DEVICE_INACTIVE_DAYS_THRESHOLD` (default: 30 days)
- `DEVICE_CLEANUP_BATCH_SIZE` (default: 1000 per invocation)

### Scheduling the Cleanup Job

You need to schedule the cleanup to run periodically. Here are three options:

#### Option 1: Cron Job (Recommended)

Use a cron service to trigger the endpoint daily:

```bash
# Run daily at 2 AM UTC
0 2 * * * curl -s https://api.example.com/api/internal/maintenance/cleanup-devices \
  -H "Authorization: Bearer INTERNAL_API_KEY"
```

#### Option 2: Vercel Cron (for Vercel deployments)

Create `app/api/maintenance/cleanup-devices/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cleanupInactiveDevices } from '@/lib/services/device-token-cleanup'
import { createLogger, createCorrelationContext } from '@/lib/logger/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const context = createCorrelationContext({ propertyId: 'internal' })
  const logger = createLogger(context)

  try {
    const result = await cleanupInactiveDevices({
      inactiveDaysThreshold: Number(process.env.DEVICE_INACTIVE_DAYS_THRESHOLD ?? 30),
      batchSize: Number(process.env.DEVICE_CLEANUP_BATCH_SIZE ?? 1000),
    })

    logger.info('Device cleanup completed', {
      processedCount: result.processedCount,
      revokedCount: result.revokedCount,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (err: unknown) {
    logger.error('Device cleanup failed', { error: err })
    return NextResponse.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/maintenance/cleanup-devices",
    "schedule": "0 2 * * *"
  }]
}
```

#### Option 3: Background Worker Service

Use a dedicated worker (Bull, RabbitMQ, etc.) to trigger cleanup periodically.

### Monitoring Cleanup

Log output tells you how many devices were revoked:

```json
{
  "requestId": "...",
  "timestamp": "2026-06-19T02:00:45Z",
  "level": "info",
  "message": "Device cleanup completed",
  "processedCount": 127,
  "revokedCount": 127
}
```

**What to watch for:**
- Cleanup running regularly (check logs for the message)
- `revokedCount` increasing over time (indicates inactive devices are being cleaned up)
- Any errors in the logs (indicates database connection issues)

---

## FCM Retry Policy

Transient FCM delivery failures are automatically retried with exponential backoff.

### How It Works

When sending a notification fails:
1. Check if the error is transient (server error) or permanent (invalid token)
2. If permanent → fail immediately (never retry)
3. If transient → retry with exponential backoff

**Transient errors that trigger retry:**
- Network timeouts
- Server errors (5xx)
- Rate limits
- Temporary unavailability

**Permanent errors that do NOT retry:**
- `registration-token-not-registered`
- `invalid-registration-token`
- `messaging/registration-token-not-registered`
- `messaging/invalid-registration-token`

### Backoff Configuration

```env
FCM_MAX_RETRIES=3              # Up to 3 additional attempts
FCM_RETRY_BASE_DELAY_MS=1000   # Start with 1 second
FCM_RETRY_MAX_DELAY_MS=30000   # Cap at 30 seconds
```

**Backoff sequence:**
```
Attempt 1: immediate
  └─ transient error?
Attempt 2: ~1000ms later
  └─ transient error?
Attempt 3: ~2000ms later
  └─ transient error?
Attempt 4: ~4000ms later
  └─ transient error?
  └─ give up, log failure
```

Jitter (randomization) is enabled by default to prevent thundering herd.

### Monitoring Retry Policy

Check notification attempt logs:
```json
{
  "requestId": "...",
  "attemptId": "attempt-123",
  "message": "Sending notification to device",
  "attempt_number": 2,
  "status": "pending"
}
```

After retry succeeds:
```json
{
  "requestId": "...",
  "attemptId": "attempt-123",
  "message": "Notification sent successfully",
  "provider_message_id": "FCM_MSG_ID_123",
  "status": "sent"
}
```

---

## Worker Health Monitoring

A health check endpoint provides visibility into notification worker status.

### Health Check Endpoint

**GET /api/health/worker**

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "lastRunAt": "2026-06-19T10:30:45.123Z",
    "jobsProcessed": 156,
    "jobsFailed": 2,
    "uptimeMs": 3600000
  }
}
```

**Fields:**
- `status` — `idle` | `healthy` | `degraded`
  - `idle` — Worker hasn't run yet
  - `healthy` — Failure rate < 50%
  - `degraded` — Failure rate >= 50%
- `lastRunAt` — ISO timestamp of last worker execution
- `jobsProcessed` — Cumulative successful jobs
- `jobsFailed` — Cumulative failed jobs
- `uptimeMs` — Milliseconds since process started

### Monitoring Strategy

1. **HTTP client:** Periodic GET request from monitoring service
2. **Log aggregation:** Check logs for worker activity
3. **Alert on degraded:** Status == "degraded" indicates 50%+ failure rate

**Example Prometheus query:**
```
# Scrape health check every 30 seconds
http://localhost:3000/api/health/worker
```

**Example alert:**
```yaml
- alert: NotificationWorkerDegraded
  expr: worker_status == "degraded"
  for: 5m
  annotations:
    summary: "Notification worker degraded for 5 minutes"
```

### Interpreting Worker Status

| Status | Meaning | Action |
|--------|---------|--------|
| `idle` | Worker hasn't started | Wait for first job or investigate if notifications are stuck |
| `healthy` | <50% failure rate | Normal operation |
| `degraded` | ≥50% failure rate | Investigate: FCM quota, token validity, network |

---

## Deployment Checklist

Use this checklist when deploying Phase 8 to production.

### Pre-Deployment

- [ ] All 752 tests pass locally
- [ ] Code review approved
- [ ] Security review passed
- [ ] Database migrations applied (host_devices, notification_attempts tables exist)
- [ ] No console.log statements in code

### Environment Variables

- [ ] `GUEST_REQUEST_RATE_LIMIT` set (or use default 10)
- [ ] `TEST_NOTIFICATION_RATE_LIMIT` set (or use default 5)
- [ ] `DEVICE_INACTIVE_DAYS_THRESHOLD` set (or use default 30)
- [ ] `DEVICE_CLEANUP_BATCH_SIZE` set (or use default 1000)
- [ ] `FCM_MAX_RETRIES` set (or use default 3)
- [ ] `FCM_RETRY_BASE_DELAY_MS` set (or use default 1000)
- [ ] `FCM_RETRY_MAX_DELAY_MS` set (or use default 30000)
- [ ] `NODE_ENV=production`

### Logging Configuration

- [ ] JSON logs writing to stdout
- [ ] Log aggregation service configured (CloudWatch, Datadog, etc.)
- [ ] Logs searchable by requestId
- [ ] Monitor for errors with `level: "error"`

### Rate Limiting

- [ ] POST /api/guest/requests returns 429 when rate limited
- [ ] POST /api/host/notifications/test returns 429 when rate limited
- [ ] Retry-After header present in 429 responses
- [ ] Limits appropriate for your traffic patterns

### Device Cleanup

- [ ] Cleanup job scheduled (daily or weekly)
- [ ] Cleanup endpoint protected with API key or internal-only access
- [ ] Logs show successful cleanup runs
- [ ] Check database: inactive devices are getting revoked

### FCM Retry Policy

- [ ] Transient FCM errors are retried (monitor logs)
- [ ] Permanent errors (invalid token) are not retried
- [ ] Exponential backoff working (delays increase on each retry)
- [ ] No infinite retry loops

### Worker Health

- [ ] GET /api/health/worker responds with 200
- [ ] Health status accessible from monitoring dashboard
- [ ] Alerts configured for degraded status
- [ ] Monitor jobsProcessed and jobsFailed metrics

### Testing in Production

- [ ] Send test request to POST /api/guest/requests (should succeed)
- [ ] Rapid requests to same endpoint (should get 429 on 11th request)
- [ ] Verify logged error message includes request details
- [ ] Check logs for correlation IDs (requestId is present)
- [ ] Send test notification from host dashboard
- [ ] Verify structured logs appear in aggregation service
- [ ] Confirm sensitive tokens are redacted in logs

### Rollback Plan

If issues occur:
1. Disable rate limiting (set `GUEST_REQUEST_RATE_LIMIT=999999`)
2. Disable device cleanup (remove cron schedule)
3. Scale up retry delays if FCM is overwhelmed
4. Check logs for errors by filtering by `level: "error"`
5. Revert deployment if critical

---

## Troubleshooting

### Rate Limiting

**Problem:** Legitimate traffic is getting 429 errors

**Solution:**
1. Check `GUEST_REQUEST_RATE_LIMIT` and `TEST_NOTIFICATION_RATE_LIMIT` values
2. Increase if limits are too strict
3. Check client IP detection — ensure `X-Forwarded-For` header is correct

**Problem:** Bots are overwhelming the endpoint

**Solution:** Lower rate limits or implement IP blocking upstream

### Device Cleanup

**Problem:** Cleanup job not running

**Solution:**
1. Check cron schedule (for scheduled jobs)
2. Verify CRON_SECRET environment variable is set
3. Check logs for cleanup messages
4. Manually invoke endpoint to test

**Problem:** Too many devices being cleaned up

**Solution:** Increase `DEVICE_INACTIVE_DAYS_THRESHOLD` (default is 30 days, consider 60+ for conservative cleanup)

### FCM Retry Policy

**Problem:** Notifications failing with "invalid-registration-token"

**Solution:** Device cleanup should remove these tokens. If not running, schedule cleanup job.

**Problem:** Retries taking too long

**Solution:** Reduce `FCM_RETRY_MAX_DELAY_MS` or `FCM_MAX_RETRIES` if latency is critical

### Worker Health

**Problem:** Status stuck at "idle"

**Solution:** 
1. Check if worker is processing jobs (logs)
2. Verify POST /api/guest/requests is being called
3. Check notification_jobs table for pending jobs

**Problem:** Status shows "degraded"

**Solution:**
1. Check logs for error patterns
2. Verify FCM credentials are valid
3. Check for high volume of invalid tokens (run cleanup)
4. Monitor FCM quota and rate limits

---

## Summary

Phase 8 adds three production-grade systems without external dependencies:

| Feature | How to Configure | How to Monitor |
|---------|------------------|----------------|
| **Structured Logging** | Write all logs through logger.ts | Search by requestId in log aggregation |
| **Rate Limiting** | Set GUEST_REQUEST_RATE_LIMIT, TEST_NOTIFICATION_RATE_LIMIT | Count 429 responses |
| **Device Cleanup** | Schedule endpoint daily via cron | Check logs for "Device cleanup completed" |
| **FCM Retry** | Set FCM_MAX_RETRIES, FCM_RETRY_BASE_DELAY_MS, FCM_RETRY_MAX_DELAY_MS | Monitor notification_attempts table |
| **Worker Health** | GET /api/health/worker | Alert on status == "degraded" |

All features are optional but strongly recommended for production deployments.

---

**Questions?** See [NOTIFICATION_SETUP_INDEX.md](./NOTIFICATION_SETUP_INDEX.md) for overall notification architecture or [NOTIFICATION_API_SPEC.md](./NOTIFICATION_API_SPEC.md) for API details.
