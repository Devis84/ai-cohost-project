# Manual QA Checklist — Phase 8 Production Hardening

**Last Updated:** 2026-06-19

**Scope:** Verify rate limiting, device cleanup, retry policy, logging redaction, and health check endpoint

**Estimated Time:** 30-45 minutes

---

## Preparation

Before starting QA, ensure:

- [ ] Development server running (`npm run dev`)
- [ ] Supabase/database available locally
- [ ] Firebase Admin SDK configured
- [ ] `.env.local` contains required variables
- [ ] All 752 tests pass (`npm test`)
- [ ] Test tool ready: `curl`, Postman, or similar

---

## 1. Rate Limiting: Guest Requests

**Endpoint:** `POST /api/guest/requests`  
**Rate limit:** 10 per minute per IP (configurable)

### Test 1.1: Normal Request Succeeds

1. Open terminal and prepare curl command:
```bash
curl -X POST http://localhost:3000/api/guest/requests \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Test request 1",
    "category": "maintenance",
    "priority": "normal"
  }'
```

2. Execute the command

**Expected result:**
- [ ] Response is 201 or 200 (request created)
- [ ] Response includes `"success": true`
- [ ] Response includes `data` with request ID
- [ ] No Retry-After header

---

### Test 1.2: Rapid Requests Hit Rate Limit

1. Execute the same curl command 10 times rapidly
2. On the 11th request, expect a 429

**Expected results:**
- [ ] Requests 1-10: HTTP 200/201 with `"success": true`
- [ ] Request 11: HTTP 429
- [ ] Response body: `"Too many requests. Please try again later."`
- [ ] Headers include: `Retry-After: <seconds>` (typically 30-60)

```bash
# Script to test (save as test-rate-limit.sh)
#!/bin/bash
for i in {1..11}; do
  echo "Request $i:"
  curl -s -X POST http://localhost:3000/api/guest/requests \
    -H "Content-Type: application/json" \
    -d "{\"property_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"title\":\"Request $i\"}" \
    | jq '.success, .error'
done
```

---

### Test 1.3: Rate Limit Resets After Window

1. Execute 10 requests (all should succeed)
2. Wait 61 seconds
3. Execute 1 more request

**Expected result:**
- [ ] After window reset, 11th request succeeds
- [ ] No 429 error after waiting

---

### Test 1.4: Different IP Addresses Have Separate Limits

1. Request from localhost (127.0.0.1) — 10 requests should work, 11th fails
2. Request with different X-Forwarded-For header:

```bash
curl -X POST http://localhost:3000/api/guest/requests \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.168.1.100" \
  -d '{...}'
```

**Expected result:**
- [ ] Different IPs have independent rate limit counters
- [ ] Each IP can make 10 requests before getting 429

---

## 2. Rate Limiting: Test Notifications

**Endpoint:** `POST /api/host/notifications/test`  
**Rate limit:** 5 per minute per IP (configurable)

### Test 2.1: Successful Test Notification

1. Authenticate as a host
2. Ensure host has at least one registered device
3. Execute:

```bash
curl -X POST http://localhost:3000/api/host/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}'
```

**Expected result:**
- [ ] Response is HTTP 200
- [ ] Response includes `"success": true`

---

### Test 2.2: Test Notification Rate Limit

1. Send 5 test notifications rapidly
2. Send 6th request

**Expected results:**
- [ ] Requests 1-5: HTTP 200, `"success": true`
- [ ] Request 6: HTTP 429
- [ ] Response includes `Retry-After` header

---

## 3. Worker Health Check Endpoint

**Endpoint:** `GET /api/health/worker`  
**Purpose:** Monitor notification worker status

### Test 3.1: Health Endpoint Responds

```bash
curl http://localhost:3000/api/health/worker | jq .
```

**Expected response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "status": "idle|healthy|degraded",
    "lastRunAt": null,
    "jobsProcessed": 0,
    "jobsFailed": 0,
    "uptimeMs": 1234567
  }
}
```

**Check:**
- [ ] HTTP 200 status
- [ ] `"success": true`
- [ ] All fields present in data
- [ ] `status` is one of: idle, healthy, degraded
- [ ] `uptimeMs` is a number > 0

---

### Test 3.2: Status Changes After Processing Jobs

1. Create a guest request (triggers notification job)
2. Wait 5 seconds for worker to process
3. Check health endpoint again

**Expected result:**
- [ ] `status` changed from `idle` to `healthy`
- [ ] `lastRunAt` is now set to a timestamp
- [ ] `jobsProcessed` >= 1
- [ ] `jobsFailed` >= 0

---

## 4. Structured Logging & Redaction

**Purpose:** Verify logs are JSON, correlation IDs work, and sensitive data is redacted

### Test 4.1: Verify JSON Log Format

1. Start server with logging enabled:
```bash
npm run dev 2>&1 | grep -E '"requestId"|"level"|"message"'
```

2. Send request to create a guest request

**Expected result:**
- [ ] Each log line is valid JSON
- [ ] Each entry contains: `requestId`, `level`, `message`, `timestamp`
- [ ] `timestamp` is ISO 8601 format
- [ ] `level` is one of: debug, info, warn, error

**Example log (expected):**
```json
{
  "requestId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-06-19T10:30:45.123Z",
  "level": "info",
  "message": "Device registered successfully"
}
```

---

### Test 4.2: Sensitive Fields Are Redacted

1. Register a device with a token:
```bash
curl -X POST http://localhost:3000/api/host/devices/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "notification_token": "my-secret-fcm-token-12345",
    "platform": "android"
  }'
```

2. Check server logs for the token

**Expected result:**
- [ ] Token does NOT appear in logs
- [ ] Instead, logs show `"notification_token": "[REDACTED]"`
- [ ] No bare JWT tokens in logs
- [ ] No API keys in logs

**Verify by:**
```bash
npm run dev 2>&1 | grep -i "secret-fcm-token"
# Should return nothing (token is redacted)

npm run dev 2>&1 | grep -i "redacted"
# Should show redacted entries
```

---

### Test 4.3: Correlation IDs Are Included

1. Send request to create guest request
2. Extract requestId from response or logs
3. Search logs for that requestId

**Expected result:**
- [ ] All related logs include the same `requestId`
- [ ] Can trace complete request flow by requestId
- [ ] Optional fields (hostId, propertyId, attemptId) appear when available

**Example trace:**
```json
// Log 1: Request received
{ "requestId": "abc-123", "level": "info", "message": "Request received" }

// Log 2: Validation
{ "requestId": "abc-123", "level": "debug", "message": "Validation passed" }

// Log 3: Database insert
{ "requestId": "abc-123", "level": "info", "message": "Database insert succeeded" }

// Log 4: Response sent
{ "requestId": "abc-123", "level": "info", "message": "Response sent" }
```

---

### Test 4.4: No console.log in Logs

1. Search codebase for `console.log`:
```bash
grep -r "console.log" app/ lib/ --include="*.ts" --include="*.tsx"
```

**Expected result:**
- [ ] No matches (zero console.log statements)
- [ ] All logging goes through logger.ts

---

## 5. Device Token Cleanup

**Purpose:** Verify inactive tokens can be cleaned up

### Test 5.1: Cleanup Endpoint Responds

```bash
curl http://localhost:3000/api/maintenance/cleanup-devices \
  -H "Authorization: Bearer INTERNAL_API_KEY"
```

**Expected response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "processedCount": 0,
    "revokedCount": 0
  }
}
```

**Check:**
- [ ] HTTP 200 status
- [ ] `"success": true`
- [ ] `processedCount` and `revokedCount` fields present
- [ ] Both are numbers >= 0

---

### Test 5.2: Cleanup Revokes Stale Devices

1. Register a device:
```bash
curl -X POST http://localhost:3000/api/host/devices/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "notification_token": "token-to-revoke",
    "platform": "android"
  }'
```

2. Update device's `last_seen_at` to 31+ days ago (directly in database for testing):
```sql
UPDATE host_devices
SET last_seen_at = NOW() - INTERVAL '31 days'
WHERE notification_token = 'token-to-revoke';
```

3. Run cleanup:
```bash
curl http://localhost:3000/api/maintenance/cleanup-devices \
  -H "Authorization: Bearer INTERNAL_API_KEY"
```

**Expected result:**
- [ ] `processedCount` includes the old device
- [ ] `revokedCount` includes the old device
- [ ] Checking database shows `revoked_at` is now set

---

### Test 5.3: Recent Devices Are NOT Cleaned Up

1. Register a device
2. Don't modify `last_seen_at` (keep it current)
3. Run cleanup

**Expected result:**
- [ ] Device is NOT revoked
- [ ] `revoked_at` remains NULL
- [ ] Device still appears in `GET /api/host/devices`

---

## 6. FCM Retry Policy

**Purpose:** Verify transient errors retry but permanent errors don't

### Test 6.1: Verify Retry Policy Configuration

Check environment variables:
```bash
echo "Max retries: ${FCM_MAX_RETRIES:-3}"
echo "Base delay: ${FCM_RETRY_BASE_DELAY_MS:-1000}"
echo "Max delay: ${FCM_RETRY_MAX_DELAY_MS:-30000}"
```

**Expected result:**
- [ ] All variables are set or using defaults
- [ ] Values are reasonable (e.g., maxRetries 1-5, delays 500-30000ms)

---

### Test 6.2: Transient Errors Trigger Retries

This test requires mocking or access to FCM error scenarios:

1. Configure test to simulate transient FCM error (network timeout)
2. Attempt to send notification
3. Observe: retries should occur with increasing delays

**Expected behavior:**
- [ ] Retry happens automatically
- [ ] Delays double on each retry (exponential backoff)
- [ ] If successful on retry, notification is sent

**Log entries to expect:**
```json
{ "level": "info", "message": "Notification send attempt 1", "attempt_number": 1 }
{ "level": "warn", "message": "Transient error, retrying", "attempt_number": 1 }
{ "level": "info", "message": "Notification send attempt 2", "attempt_number": 2 }
```

---

### Test 6.3: Permanent Errors Don't Retry

Configure test to simulate permanent FCM error (invalid-registration-token):

1. Attempt to send to invalid token
2. Observe: should fail immediately

**Expected behavior:**
- [ ] No retries occur
- [ ] Error is logged immediately
- [ ] Notification attempt marked as failed
- [ ] Device should be cleaned up on next cleanup run

**Log entries to expect:**
```json
{ "level": "error", "message": "Permanent error, not retrying", "error": "invalid-registration-token" }
```

---

## 7. Integration Test: End-to-End Flow

**Purpose:** Verify all Phase 8 features work together

### Test 7.1: Create Request → Notify Host → Verify Logs

1. Create guest request:
```bash
REQUEST=$(curl -X POST http://localhost:3000/api/guest/requests \
  -H "Content-Type: application/json" \
  -d '{...}')
REQUEST_ID=$(echo $REQUEST | jq -r '.data.id')
echo "Created request: $REQUEST_ID"
```

2. Wait 5 seconds for notification worker to run

3. Check logs contain correlation IDs:
```bash
npm run dev 2>&1 | grep "$REQUEST_ID" | head -5
```

4. Verify health check shows worker ran:
```bash
curl http://localhost:3000/api/health/worker | jq '.data | {status, jobsProcessed}'
```

**Expected results:**
- [ ] Request created successfully
- [ ] Request ID returned
- [ ] Logs contain request ID in correlation chain
- [ ] No sensitive data (tokens) in logs
- [ ] Worker status shows jobsProcessed > 0

---

### Test 7.2: Rate Limit + Logging

1. Trigger rate limit (10+ requests)
2. Verify 429 response
3. Check logs for rate limit event:
```bash
npm run dev 2>&1 | grep "Too many requests"
```

**Expected result:**
- [ ] Rate limit triggered correctly
- [ ] 429 response has Retry-After header
- [ ] Log entry shows rate limit hit
- [ ] Correlation ID in log

---

## 8. Configuration Verification

### Test 8.1: Environment Variables

```bash
npm run dev 2>&1 | head -20
```

Verify in logs or environment:
- [ ] `GUEST_REQUEST_RATE_LIMIT` is read (or default used)
- [ ] `TEST_NOTIFICATION_RATE_LIMIT` is read (or default used)
- [ ] `DEVICE_INACTIVE_DAYS_THRESHOLD` is readable
- [ ] `DEVICE_CLEANUP_BATCH_SIZE` is readable
- [ ] `FCM_MAX_RETRIES` is readable
- [ ] `FCM_RETRY_BASE_DELAY_MS` is readable
- [ ] `FCM_RETRY_MAX_DELAY_MS` is readable

---

### Test 8.2: Custom Configuration Works

1. Set custom rate limit in `.env.local`:
```env
GUEST_REQUEST_RATE_LIMIT=3
TEST_NOTIFICATION_RATE_LIMIT=2
```

2. Restart server
3. Test rate limit is now 3 (instead of default 10)

```bash
# Send 3 requests - should succeed
# Send 4th request - should get 429
```

**Expected result:**
- [ ] Custom value is respected
- [ ] Rate limit now at 3 instead of 10

---

## 9. Security Checks

### Test 9.1: No Hardcoded Secrets

```bash
grep -r "sk-" app/ lib/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v .example
grep -r "api_key.*=" app/ lib/ --include="*.ts" --include="*.tsx" | grep -v "process.env" | grep -v test
```

**Expected result:**
- [ ] No hardcoded API keys
- [ ] No hardcoded tokens
- [ ] All secrets come from environment variables

---

### Test 9.2: Rate Limiting Prevents Abuse

1. Attempt DDoS with rapid requests:
```bash
for i in {1..50}; do
  curl -s http://localhost:3000/api/guest/requests -X POST -d '{}' &
done
wait
```

**Expected result:**
- [ ] Most requests rejected with 429
- [ ] Server remains responsive
- [ ] No crash or hang

---

## 10. Performance Checks

### Test 10.1: Rate Limiter Overhead

Send 100 normal requests and measure response time:

```bash
time for i in {1..100}; do
  curl -s http://localhost:3000/api/guest/requests \
    -H "Content-Type: application/json" \
    -d '{...}' > /dev/null
done
```

**Expected result:**
- [ ] Average response time < 100ms per request
- [ ] Rate limiting adds < 1ms latency

---

### Test 10.2: Logging Overhead

Send request and verify logging doesn't cause noticeable delay:

```bash
time curl -X POST http://localhost:3000/api/guest/requests \
  -H "Content-Type: application/json" \
  -d '{...}' -w "\nTotal time: %{time_total}s\n"
```

**Expected result:**
- [ ] Response time < 500ms
- [ ] Logging adds < 10ms overhead

---

## 11. Database Schema Checks

### Test 11.1: Required Tables Exist

```sql
-- Connect to database and verify:
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('host_devices', 'notification_attempts', 'notification_jobs');
```

**Expected result:**
- [ ] `host_devices` table exists with columns:
  - id, host_id, notification_token, platform, app_type, device_name, app_version, permissions_status, last_seen_at, token_updated_at, revoked_at, created_at, updated_at
- [ ] `notification_attempts` table exists
- [ ] `notification_jobs` table exists

---

### Test 11.2: Indexes Are Created

```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('host_devices', 'notification_attempts');
```

**Expected result:**
- [ ] Index on host_devices(host_id)
- [ ] Index on host_devices(notification_token)
- [ ] Unique index on active tokens
- [ ] Indexes on notification_attempts status/request

---

## Completion Checklist

When all tests pass, check off:

- [ ] Test 1.1: Normal request succeeds
- [ ] Test 1.2: Rapid requests hit rate limit
- [ ] Test 1.3: Rate limit resets after window
- [ ] Test 1.4: Different IPs have separate limits
- [ ] Test 2.1: Successful test notification
- [ ] Test 2.2: Test notification rate limit
- [ ] Test 3.1: Health endpoint responds
- [ ] Test 3.2: Status changes after processing
- [ ] Test 4.1: JSON log format
- [ ] Test 4.2: Sensitive fields redacted
- [ ] Test 4.3: Correlation IDs included
- [ ] Test 4.4: No console.log in code
- [ ] Test 5.1: Cleanup endpoint responds
- [ ] Test 5.2: Cleanup revokes stale devices
- [ ] Test 5.3: Recent devices not cleaned up
- [ ] Test 6.1: Retry policy configured
- [ ] Test 6.2: Transient errors retry
- [ ] Test 6.3: Permanent errors don't retry
- [ ] Test 7.1: End-to-end flow works
- [ ] Test 7.2: Rate limit + logging works
- [ ] Test 8.1: Environment variables read
- [ ] Test 8.2: Custom configuration works
- [ ] Test 9.1: No hardcoded secrets
- [ ] Test 9.2: Rate limiting prevents abuse
- [ ] Test 10.1: Rate limiter overhead acceptable
- [ ] Test 10.2: Logging overhead acceptable
- [ ] Test 11.1: Required tables exist
- [ ] Test 11.2: Indexes are created

**Total: 29 test cases**

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Rate limit not working | Limiter not initialized | Check route.ts imports rate-limiter |
| Logs not JSON | Console.log being used | Search codebase for console.log, remove |
| Tokens not redacted | Sanitizer not applied | Check logger.ts redaction logic |
| Health check 500 | Worker state not initialized | Check worker-health.ts module init |
| Cleanup not deleting | Wrong threshold or batch size | Adjust DEVICE_INACTIVE_DAYS_THRESHOLD |
| Retries happening too many times | FCM_MAX_RETRIES too high | Reduce to 2-3 |
| Server slow with logs | Volume too high | Check log aggregation config |

---

**Sign-off:**

- QA Date: ________________
- Tester Name: ________________
- All tests passed: [ ] Yes [ ] No
- Issues found: ________________
- Sign-off: ________________

---

**Questions?** Refer to [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) or [NOTIFICATION_API_SPEC.md](./NOTIFICATION_API_SPEC.md).
