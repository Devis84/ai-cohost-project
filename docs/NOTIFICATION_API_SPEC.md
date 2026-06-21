# Notification System API Specification

**Last Updated:** 2026-06-19

**Related:** [ANDROID_SETUP.md](./ANDROID_SETUP.md) | [notification-system.md](./plan/notification-system.md)

This document specifies the backend API endpoints required for the Android notification system (and PWA/Web push).

## Overview

The notification system requires four categories of endpoints:

1. **Device Registration** — Register/unregister host devices for push notifications
2. **Notification Management** — Send and test notifications
3. **Request Management** — Acknowledgement and escalation status
4. **System Health** — Monitor worker and system health

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production configuration (rate limiting, logging, device cleanup, retry policy).

---

## 1. Device Registration Endpoints

### 1.1 POST /api/host/devices/register

**Purpose:** Register a host device to receive push notifications.

**Authentication:** Required (bearer token or session)

**Request Body:**

```json
{
  "notification_token": "string (required)",
  "platform": "ios" | "android" | "web" | "unknown",
  "app_type": "native" | "pwa" | "browser",
  "device_name": "string (optional, e.g., 'iPhone 13', 'Samsung Galaxy S21')",
  "app_version": "string (optional, e.g., '1.0.0')",
  "permission_status": "granted" | "denied" | "default" | "unsupported"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": "device-abc123",
    "host_id": "host-456",
    "platform": "android",
    "app_type": "native",
    "notification_token": "eOqFH-...truncated",
    "notifications_enabled": true,
    "permission_status": "granted",
    "device_name": "Samsung Galaxy S21",
    "app_version": "1.0.0",
    "last_seen_at": "2026-06-19T10:30:00Z",
    "token_updated_at": "2026-06-19T10:30:00Z",
    "created_at": "2026-06-19T10:30:00Z",
    "updated_at": "2026-06-19T10:30:00Z"
  }
}
```

**Response (Error - 400/401/500):**

```json
{
  "success": false,
  "error": "Device registration failed: invalid token format"
}
```

**Implementation Notes:**

- **Idempotent:** If same token already registered for this host, update last_seen_at and return existing device
- **Token uniqueness:** Tokens must be unique across all hosts (different hosts can't have same token)
- **Token validation:** Validate token format (should be 100-200+ alphanumeric characters)
- **Authorization:** Only authenticated hosts can register devices; cannot register another host's device
- **Rate limiting:** Implement reasonable rate limit (e.g., 10 registrations per minute per host)

**Backend Logic:**

```pseudocode
POST /api/host/devices/register
  1. Verify user is authenticated
  2. Validate notification_token format
  3. Check if token already registered:
     a. If yes, to same host: update last_seen_at, return device
     b. If yes, to different host: error "Token already registered"
  4. Create new host_device record
  5. Store fields: notification_token, platform, app_type, permission_status, device_name, app_version
  6. Log: "Device registered for host [host_id] on [platform]"
  7. Return device record (without exposing token in API response)
  8. Do NOT log full notification token
```

---

### 1.2 POST /api/host/devices/unregister

**Purpose:** Unregister a host device (e.g., on logout or uninstall).

**Authentication:** Required

**Request Body:**

```json
{
  "device_id": "string (required)"
}
```

Or alternative for token-based:

```json
{
  "notification_token": "string (required)"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Device unregistered successfully"
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Device not found or already unregistered"
}
```

**Implementation Notes:**

- **Authorization:** Only the host who registered the device can unregister it
- **Idempotent:** Second unregister of same device returns success (no error)
- **Soft delete:** Mark device as revoked or deleted, don't permanently delete (for audit trail)

**Backend Logic:**

```pseudocode
POST /api/host/devices/unregister
  1. Verify user is authenticated
  2. Lookup device by device_id or notification_token
  3. Verify device belongs to authenticated host
  4. Mark device as revoked/deleted (soft delete)
  5. Log: "Device unregistered for host [host_id]"
  6. Return success
  7. Do NOT expose device details in response
```

---

### 1.3 GET /api/host/devices

**Purpose:** List all registered devices for the authenticated host.

**Authentication:** Required

**Query Parameters:**

```
?platform=android&status=active
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "device-abc123",
      "platform": "android",
      "app_type": "native",
      "device_name": "Samsung Galaxy S21",
      "app_version": "1.0.0",
      "notifications_enabled": true,
      "permission_status": "granted",
      "last_seen_at": "2026-06-19T10:30:00Z",
      "created_at": "2026-06-19T10:00:00Z"
    },
    {
      "id": "device-def456",
      "platform": "web",
      "app_type": "browser",
      "device_name": "Chrome on Windows",
      "notifications_enabled": true,
      "permission_status": "granted",
      "last_seen_at": "2026-06-19T09:30:00Z",
      "created_at": "2026-06-19T08:00:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "active": 2,
    "disabled": 0
  }
}
```

**Implementation Notes:**

- **Privacy:** Never return full notification_token in list responses
- **Filtering:** Support filtering by platform, status (active/disabled), app_type
- **Sorting:** Sort by last_seen_at descending (most recent first)

---

### 1.4 DELETE /api/host/devices/:id

**Purpose:** Delete a registered device.

**Authentication:** Required

**Parameters:**

- `:id` — Device ID from `/api/host/devices`

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Device deleted successfully"
}
```

**Response (Error - 404/403):**

```json
{
  "success": false,
  "error": "Device not found or you don't have permission to delete it"
}
```

**Implementation Notes:**

- **Authorization:** Only the host who owns the device can delete it
- **Idempotent:** Deleting already-deleted device returns success

---

## 2. Notification Management Endpoints

### 2.1 POST /api/host/notifications/test

**Purpose:** Send a test notification to verify push notification setup.

**Authentication:** Required

**Request Body:**

```json
{
  "device_id": "string (optional, if omitted sends to all registered devices)",
  "title": "string (optional, default: 'Test Notification')",
  "body": "string (optional, default: 'This is a test notification')"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Test notification queued for sending",
  "data": {
    "notification_attempt_id": "attempt-xyz789",
    "device_count": 1,
    "queued_at": "2026-06-19T10:30:00Z"
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "No devices registered for this host"
}
```

**Implementation Notes:**

- **Rate limiting:** Strict rate limit (e.g., 1 per 30 seconds per host) to prevent abuse
- **Async:** Queue for background sending; don't block on FCM API response
- **Audit:** Log all test notifications with timestamp and host
- **Response timing:** Return immediately; Firebase delivery is asynchronous

**Backend Logic:**

```pseudocode
POST /api/host/notifications/test
  1. Verify user is authenticated
  2. Rate limit: max 1 test notification per 30 seconds per host
  3. If device_id specified:
     a. Lookup device
     b. Verify device belongs to host
     c. Create notification_attempt record for that device
  4. Else:
     a. Find all active devices for host
     b. Create notification_attempt record for each device
  5. Queue async job: send to FCM for each device
  6. Log: "Test notification queued for host [host_id]"
  7. Return immediately with success status
```

---

### 2.2 POST /api/guest/requests (existing endpoint — modified)

**Purpose:** Submit a guest request (existing functionality, modified to trigger notifications).

**Authentication:** Guest (no auth) or API key

**Request Body:**

```json
{
  "property_id": "string (required)",
  "category": "maintenance|concierge|safety|billing|other",
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "low|medium|high|urgent",
  "guest_id": "string (optional, if guest is authenticated)"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "data": {
    "id": "req-123456",
    "property_id": "prop-789",
    "category": "maintenance",
    "title": "Air conditioner not working",
    "description": "Room 204 AC is blowing warm air",
    "priority": "high",
    "status": "new",
    "created_at": "2026-06-19T10:30:00Z"
  }
}
```

**Side Effects (Async):**

1. Create `guest_request` record in database
2. Determine responsible host(s) via `HostAssignmentService`
3. Create `notification_job` record (transactional outbox pattern)
4. Queue async worker to:
   - Create `notification_attempt` records
   - Send FCM messages to each host device
   - Handle failures and retries

---

## 3. Request Management Endpoints

### 3.1 GET /api/host/requests

**Purpose:** List guest requests assigned to the authenticated host.

**Authentication:** Required (host only)

**Query Parameters:**

```
?status=new,notified,seen&priority=high,urgent&limit=20&offset=0&sort=created_at:desc
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "req-123456",
      "property_id": "prop-789",
      "room": "204",
      "category": "maintenance",
      "priority": "high",
      "title": "Air conditioner not working",
      "status": "notified",
      "seen_at": null,
      "acknowledged_at": null,
      "acknowledged_by": null,
      "escalated_at": null,
      "created_at": "2026-06-19T10:30:00Z",
      "updated_at": "2026-06-19T10:30:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 0,
    "limit": 20,
    "total_pages": 1
  }
}
```

---

### 3.2 GET /api/host/requests/:id

**Purpose:** Get details of a specific guest request.

**Authentication:** Required (host must have access to property)

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": "req-123456",
    "property_id": "prop-789",
    "room": "204",
    "category": "maintenance",
    "priority": "high",
    "title": "Air conditioner not working",
    "description": "Room 204 AC is blowing warm air, been like this since 2pm",
    "status": "notified",
    "guest_id": "guest-abc",
    "guest_name": "John Doe",
    "guest_email": "john@example.com",
    "assigned_host_id": "host-456",
    "seen_at": null,
    "acknowledged_at": null,
    "acknowledged_by": null,
    "started_at": null,
    "resolved_at": null,
    "escalated_at": null,
    "created_at": "2026-06-19T10:30:00Z",
    "updated_at": "2026-06-19T10:30:00Z"
  }
}
```

**Authorization Notes:**

- Only the assigned host can view this request
- Or property manager/owner
- Or host with access to property
- Guest information should be visible to authorized hosts only

---

### 3.3 POST /api/host/requests/:id/acknowledge

**Purpose:** Host acknowledges receipt of request and cancels escalation.

**Authentication:** Required (host)

**Request Body:**

```json
{
  "acknowledged_at": "2026-06-19T10:31:00Z" (optional, defaults to now)
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": "req-123456",
    "status": "acknowledged",
    "acknowledged_at": "2026-06-19T10:31:00Z",
    "acknowledged_by": "host-456",
    "escalation_cancelled": true
  }
}
```

**Implementation Notes:**

- **Idempotent:** Re-acknowledging same request returns success
- **State transition:** Moves request from `new` → `acknowledged` (or `notified` → `acknowledged`)
- **Escalation cancellation:** Cancels any pending escalation job
- **Audit:** Log acknowledgement with timestamp and host ID

**Backend Logic:**

```pseudocode
POST /api/host/requests/:id/acknowledge
  1. Verify user is authenticated host
  2. Lookup request
  3. Verify host has access to property
  4. If already acknowledged: return success (idempotent)
  5. Update request:
     a. status = "acknowledged"
     b. acknowledged_at = now
     c. acknowledged_by = host_id
  6. Cancel pending escalation job for this request
  7. Log: "Request [req_id] acknowledged by host [host_id]"
  8. Return updated request
```

---

### 3.4 POST /api/host/requests/:id/seen

**Purpose:** Mark request as seen by host (read in app).

**Authentication:** Required (host)

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": "req-123456",
    "status": "seen",
    "seen_at": "2026-06-19T10:31:00Z"
  }
}
```

---

### 3.5 POST /api/host/requests/:id/start

**Purpose:** Host starts working on request.

**Authentication:** Required (host)

**Request Body:**

```json
{
  "notes": "string (optional)"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": "req-123456",
    "status": "in_progress",
    "started_at": "2026-06-19T10:32:00Z"
  }
}
```

---

### 3.6 POST /api/host/requests/:id/resolve

**Purpose:** Host resolves the request.

**Authentication:** Required (host)

**Request Body:**

```json
{
  "resolution_notes": "string (optional)",
  "resolution_category": "fixed|pending_guest|cancelled|other"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": "req-123456",
    "status": "resolved",
    "resolved_at": "2026-06-19T10:35:00Z"
  }
}
```

**Side Effects:**

- Cancels pending escalation
- Notifies guest that request was resolved (optional)
- Updates notification_attempt records

---

## 4. System Health Endpoints

### 4.1 GET /api/health/worker

**Purpose:** Check notification worker health and statistics.

**Authentication:** None (internal/monitoring only)

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "status": "idle|healthy|degraded",
    "lastRunAt": "2026-06-19T10:30:00Z",
    "jobsProcessed": 156,
    "jobsFailed": 2,
    "uptimeMs": 3600000
  }
}
```

**Fields:**
- `status` — Worker health status:
  - `idle` — Worker hasn't run yet
  - `healthy` — Failure rate < 50%
  - `degraded` — Failure rate >= 50%
- `lastRunAt` — ISO timestamp of last worker run (null if not run yet)
- `jobsProcessed` — Cumulative successful jobs processed
- `jobsFailed` — Cumulative failed jobs
- `uptimeMs` — Milliseconds since process started

**Response (Error - 500):**

```json
{
  "success": false,
  "error": "Health check unavailable"
}
```

**Use Case:** Monitor notification worker from external monitoring systems (Prometheus, CloudWatch, Datadog).

**Monitoring Strategy:**
- Scrape every 30-60 seconds
- Alert if status == "degraded"
- Alert if lastRunAt is stale (>5 minutes old)
- Track jobsProcessed and jobsFailed metrics

---

## Data Models

### HostDevice

Stores push notification registration tokens.

```sql
CREATE TABLE host_devices (
  id SERIAL PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES hosts(id),
  platform VARCHAR(50) NOT NULL, -- 'ios', 'android', 'web', 'unknown'
  app_type VARCHAR(50) NOT NULL, -- 'native', 'pwa', 'browser'
  notification_token TEXT NOT NULL UNIQUE,
  device_name VARCHAR(255),
  app_version VARCHAR(50),
  notifications_enabled BOOLEAN DEFAULT true,
  permission_status VARCHAR(50), -- 'granted', 'denied', 'default', 'unsupported'
  last_seen_at TIMESTAMP,
  token_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP NULL
);

CREATE INDEX idx_host_devices_host_id ON host_devices(host_id);
CREATE INDEX idx_host_devices_notification_token ON host_devices(notification_token);
CREATE UNIQUE INDEX idx_host_devices_active 
  ON host_devices(notification_token) 
  WHERE revoked_at IS NULL;
```

### GuestRequest

Stores guest requests (may already exist, modified for notification support).

```sql
ALTER TABLE guest_requests ADD COLUMN (
  assigned_host_id UUID REFERENCES hosts(id),
  acknowledged_by UUID REFERENCES hosts(id),
  acknowledged_at TIMESTAMP,
  seen_at TIMESTAMP,
  started_at TIMESTAMP,
  resolved_at TIMESTAMP,
  escalated_at TIMESTAMP
);
```

### NotificationAttempt

Tracks every push notification attempt.

```sql
CREATE TABLE notification_attempts (
  id SERIAL PRIMARY KEY,
  guest_request_id BIGINT NOT NULL REFERENCES guest_requests(id),
  host_id UUID NOT NULL REFERENCES hosts(id),
  host_device_id BIGINT NOT NULL REFERENCES host_devices(id),
  channel VARCHAR(50) NOT NULL, -- 'fcm', 'apns', 'web_push', 'sms', 'whatsapp'
  attempt_number INTEGER DEFAULT 1,
  provider_message_id VARCHAR(255), -- Firebase message ID
  status VARCHAR(50) NOT NULL, -- 'pending', 'sent', 'failed', 'invalid_token', 'acknowledged', 'cancelled'
  failure_code VARCHAR(50),
  failure_message TEXT,
  sent_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_attempts_request ON notification_attempts(guest_request_id);
CREATE INDEX idx_notification_attempts_device ON notification_attempts(host_device_id);
CREATE INDEX idx_notification_attempts_status ON notification_attempts(status);
```

### NotificationJob (Optional)

Tracks background notification jobs.

```sql
CREATE TABLE notification_jobs (
  id SERIAL PRIMARY KEY,
  guest_request_id BIGINT NOT NULL REFERENCES guest_requests(id),
  job_type VARCHAR(50) NOT NULL, -- 'initial_push', 'escalation', 'fallback'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  scheduled_for TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_jobs_request ON notification_jobs(guest_request_id);
CREATE INDEX idx_notification_jobs_status ON notification_jobs(status);
CREATE INDEX idx_notification_jobs_scheduled ON notification_jobs(scheduled_for);
```

---

## Error Handling

All endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid request: device_id is required"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "You don't have permission to access this device"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Device not found"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 30 seconds."
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error: [error details for logs only]"
}
```

---

## Security Considerations

### Authentication

- All endpoints require authenticated user (host)
- Use JWT, session, or existing auth mechanism
- Validate authentication on every request

### Authorization

- Only hosts can access their own devices and requests
- Implement property-level access control
- Prevent cross-host device access

### Token Security

- Never log full notification tokens
- Truncate tokens in logs/responses: show only first 8 and last 8 chars
- Rotate tokens periodically
- Validate token format before storing

### Rate Limiting

- Device registration: 10 per minute per host
- Test notifications: 1 per 30 seconds per host
- Request operations: 100 per minute per host

### Input Validation

- Validate all request bodies against schema
- Sanitize text fields (title, description, notes)
- Validate platform/app_type enums
- Check notification_token format

### Audit Logging

- Log all device registrations/unregistrations
- Log all request state transitions
- Log all notification attempts (status, not full payload)
- Include host_id, device_id, request_id in logs
- Never log sensitive data (tokens, passwords, guest details)

---

## Implementation Roadmap

**Phase 5a (Backend):**
1. Implement `/api/host/devices/register` endpoint
2. Implement `/api/host/devices/unregister` endpoint
3. Create host_devices table

**Phase 5b (Backend):**
4. Implement `/api/host/devices` endpoint
5. Implement `/api/host/devices/:id` endpoint
6. Add permission_status column to host_devices

**Phase 5c (Android Integration):**
7. Test device registration from Android app
8. Implement `/api/host/notifications/test` endpoint
9. Test notifications from Firebase Console

**Phase 6 (Notification Delivery):**
10. Implement Firebase Admin initialization in backend
11. Create notification_attempts table
12. Implement request state transition endpoints

**Phase 7 (Escalation):**
13. Implement escalation logic
14. Create notification_jobs table
15. Implement background worker

---

## References

- [ANDROID_SETUP.md](./ANDROID_SETUP.md) — Android push notification setup
- [notification-system.md](./plan/notification-system.md) — System architecture and design
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Production configuration and hardening (Phase 8)
- [QA_CHECKLIST_PHASE8.md](./QA_CHECKLIST_PHASE8.md) — Manual QA for Phase 8 features
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/plugins/push-notifications)

---

## Phase 8 Production Hardening

Phase 8 adds the following production-grade features (all 752 tests passing):

1. **Structured JSON Logging** — Logs include correlation IDs (requestId, hostId, propertyId, attemptId). Sensitive fields (tokens, keys, passwords) are automatically redacted. See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#structured-logging).

2. **Rate Limiting** — Two endpoints are rate-limited by IP:
   - POST /api/guest/requests: 10/minute (configurable via GUEST_REQUEST_RATE_LIMIT)
   - POST /api/host/notifications/test: 5/minute (configurable via TEST_NOTIFICATION_RATE_LIMIT)
   - Returns HTTP 429 with Retry-After header when exceeded
   - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#rate-limiting).

3. **Device Token Cleanup** — Scheduled job revokes inactive device tokens (default: 30+ days inactive). Prevents sending to stale devices. See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#device-token-cleanup).

4. **FCM Retry Policy** — Transient delivery failures retry with exponential backoff. Permanent errors (invalid token) fail immediately. See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#fcm-retry-policy).

5. **Worker Health Monitoring** — GET /api/health/worker provides status (idle/healthy/degraded) and metrics. See section 4.1 above.

---

**Status:** Specification complete with Phase 8 production hardening features.

**Last Updated:** 2026-06-19
