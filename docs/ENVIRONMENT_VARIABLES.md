# Environment Variables Reference

**Last Updated:** 2026-06-19

**Purpose:** Document all environment variables for the notification system and Phase 8 production hardening features.

---

## Overview

This document lists all environment variables required and recommended for the Airbnb AI Co-Host notification system. Most have sensible defaults if omitted.

---

## Phase 8: Production Hardening Variables

Added in Phase 8 for rate limiting, logging, device cleanup, and retry policy.

### Rate Limiting

#### GUEST_REQUEST_RATE_LIMIT

**Type:** Number  
**Default:** 10  
**Description:** Maximum guest requests allowed per minute per IP address  
**Example:** `GUEST_REQUEST_RATE_LIMIT=10`

**Notes:**
- Applied to POST /api/guest/requests
- Fixed-window of 60 seconds
- Returns HTTP 429 when exceeded
- IP detected from X-Forwarded-For header (important for reverse proxies)

#### TEST_NOTIFICATION_RATE_LIMIT

**Type:** Number  
**Default:** 5  
**Description:** Maximum test notifications allowed per minute per IP address  
**Example:** `TEST_NOTIFICATION_RATE_LIMIT=5`

**Notes:**
- Applied to POST /api/host/notifications/test
- Fixed-window of 60 seconds
- Returns HTTP 429 when exceeded
- Prevents abuse by spamming test notifications

### Device Token Cleanup

#### DEVICE_INACTIVE_DAYS_THRESHOLD

**Type:** Number  
**Default:** 30  
**Description:** Days of inactivity before a device token is considered stale and eligible for revocation  
**Example:** `DEVICE_INACTIVE_DAYS_THRESHOLD=30`

**Notes:**
- Devices with last_seen_at < now - DEVICE_INACTIVE_DAYS_THRESHOLD are marked revoked
- Prevents sending notifications to deleted/uninstalled apps
- Must be scheduled to run (see DEPLOYMENT_GUIDE.md)
- Recommended: 30-60 days

#### DEVICE_CLEANUP_BATCH_SIZE

**Type:** Number  
**Default:** 1000  
**Description:** Maximum number of devices to revoke per cleanup invocation  
**Example:** `DEVICE_CLEANUP_BATCH_SIZE=1000`

**Notes:**
- Prevents locking too many rows at once
- Larger values process faster but risk lock contention
- Recommended: 500-2000 depending on database performance

### FCM Retry Policy

#### FCM_MAX_RETRIES

**Type:** Number  
**Default:** 3  
**Description:** Maximum number of retry attempts for transient FCM failures  
**Example:** `FCM_MAX_RETRIES=3`

**Notes:**
- Only applies to transient errors (network timeouts, server errors)
- Permanent errors (invalid token) never retry
- Recommended: 2-5
- Higher values improve delivery but increase latency

#### FCM_RETRY_BASE_DELAY_MS

**Type:** Number (milliseconds)  
**Default:** 1000  
**Description:** Initial delay for first retry attempt  
**Example:** `FCM_RETRY_BASE_DELAY_MS=1000`

**Notes:**
- Delay doubles on each retry (exponential backoff)
- Jitter (randomization) applied automatically
- Recommended: 500-2000ms

#### FCM_RETRY_MAX_DELAY_MS

**Type:** Number (milliseconds)  
**Default:** 30000  
**Description:** Maximum delay cap for any retry attempt  
**Example:** `FCM_RETRY_MAX_DELAY_MS=30000`

**Notes:**
- Prevents excessively long delays
- Recommended: 5000-60000ms
- Should be > FCM_RETRY_BASE_DELAY_MS

### Logging

#### NODE_ENV

**Type:** String  
**Default:** development  
**Valid values:** development, production, test  
**Description:** Node.js environment  
**Example:** `NODE_ENV=production`

**Notes:**
- In non-production environments, error stack traces are included in logs
- In production, stack traces are omitted for security
- All logs are JSON-formatted regardless of NODE_ENV

---

## Required Notification System Variables

### Firebase Configuration

#### FIREBASE_PROJECT_ID

**Type:** String  
**Required:** Yes  
**Description:** Firebase project ID  
**Example:** `FIREBASE_PROJECT_ID=my-firebase-project`

#### FIREBASE_PRIVATE_KEY

**Type:** String  
**Required:** Yes  
**Description:** Firebase service account private key (from JSON key file)  
**Example:** `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----"`

**Security:** Never commit to git; use environment variables or secret manager

#### FIREBASE_CLIENT_EMAIL

**Type:** String  
**Required:** Yes  
**Description:** Firebase service account client email  
**Example:** `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com`

### Supabase/Database Configuration

#### SUPABASE_URL

**Type:** String  
**Required:** Yes  
**Description:** Supabase project URL  
**Example:** `SUPABASE_URL=https://xxxxx.supabase.co`

#### SUPABASE_ANON_KEY

**Type:** String  
**Required:** Yes  
**Description:** Supabase anonymous API key  
**Example:** `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...`

#### SUPABASE_SERVICE_ROLE_KEY

**Type:** String  
**Required:** Yes  
**Description:** Supabase service role key (for server-side access)  
**Example:** `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...`

**Security:** More privileged than anon_key; protect carefully

### Authentication

#### AUTH_SECRET

**Type:** String  
**Required:** Yes (if using NextAuth)  
**Description:** Secret for NextAuth session encryption  
**Example:** `AUTH_SECRET=your-secret-key-here`

**Security:** Generate with: openssl rand -base64 32

---

## Recommended Production Configuration

```env
# Phase 8: Production Hardening
GUEST_REQUEST_RATE_LIMIT=10
TEST_NOTIFICATION_RATE_LIMIT=5
DEVICE_INACTIVE_DAYS_THRESHOLD=30
DEVICE_CLEANUP_BATCH_SIZE=1000
FCM_MAX_RETRIES=3
FCM_RETRY_BASE_DELAY_MS=1000
FCM_RETRY_MAX_DELAY_MS=30000

# Core Environment
NODE_ENV=production

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Authentication
AUTH_SECRET=your-generated-secret
```

---

## Development Configuration (.env.local or .env.development)

```env
# Phase 8: Use defaults (more lenient for testing)
# GUEST_REQUEST_RATE_LIMIT=100  # More permissive in dev
# TEST_NOTIFICATION_RATE_LIMIT=50
# DEVICE_INACTIVE_DAYS_THRESHOLD=1  # More aggressive cleanup in dev
# DEVICE_CLEANUP_BATCH_SIZE=100

# Core Environment
NODE_ENV=development

# Firebase (use test project)
FIREBASE_PROJECT_ID=dev-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com

# Supabase (use local/staging)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Authentication
AUTH_SECRET=dev-secret-key-here
```

---

## Environment Variable Loading

### Next.js

Environment variables are loaded in this order:

1. `.env.local` (highest priority, not in git)
2. `.env.development` or `.env.production` (platform-specific)
3. `.env` (lowest priority)
4. Hardcoded defaults in code

**Example loading:**
```typescript
const guestRequestLimit = Number(process.env.GUEST_REQUEST_RATE_LIMIT ?? 10)
```

### Setting in Production

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add variables with scope: Preview, Production
3. Redeploy

**Other Platforms:**
1. Use platform secret manager
2. Set via deployment pipeline
3. Verify with: `echo $GUEST_REQUEST_RATE_LIMIT`

---

## Validating Configuration

### Startup Checks

The application validates configuration at startup and logs any issues:

```bash
npm run dev
# Look for logs confirming rates, thresholds, and timeouts are set
```

### Manual Verification

```bash
# Check rate limit is configured
curl http://localhost:3000/api/guest/requests?_check=true

# Check worker health (includes config validation)
curl http://localhost:3000/api/health/worker | jq .

# Check logs for startup messages
npm run dev 2>&1 | grep "Rate limit\|Cleanup\|Retry"
```

---

## Troubleshooting

### "Rate limit not working"

**Check:**
1. GUEST_REQUEST_RATE_LIMIT is set in .env or environment
2. Is not set to 0 or negative
3. Server was restarted after changing the value

**Verify:**
```bash
echo $GUEST_REQUEST_RATE_LIMIT
npm run dev 2>&1 | grep "rate"
```

### "Default value used instead of custom"

**Check:**
1. Variable name is exactly correct (case-sensitive)
2. No extra spaces in assignment: `LIMIT=10` not `LIMIT = 10`
3. Server restarted after changing .env
4. Using .env.local in development (not .env)

### "Too many retries happening"

**Check:**
1. FCM_MAX_RETRIES value (default 3 is usually correct)
2. FCM_RETRY_BASE_DELAY_MS is reasonable (1000ms = 1 second)
3. FCM_RETRY_MAX_DELAY_MS caps the max delay

**Adjust:**
```env
FCM_MAX_RETRIES=2           # Fewer retries
FCM_RETRY_BASE_DELAY_MS=500 # Faster backoff
FCM_RETRY_MAX_DELAY_MS=5000 # Lower cap
```

### "Devices not being cleaned up"

**Check:**
1. Cleanup job is scheduled (cron, lambda, etc.)
2. DEVICE_INACTIVE_DAYS_THRESHOLD is set appropriately
3. Database has devices with old last_seen_at values
4. Cleanup endpoint is accessible

**Test manually:**
```bash
curl http://localhost:3000/api/maintenance/cleanup-devices \
  -H "Authorization: Bearer INTERNAL_API_KEY"
```

---

## Security Best Practices

### Do NOT

```env
# DON'T commit these to git
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
AUTH_SECRET=my-secret
```

### DO

1. Store secrets in `.env.local` (git-ignored)
2. Use environment variable management in production:
   - Vercel: Project Settings → Environment Variables
   - AWS: Secrets Manager
   - GCP: Secret Manager
   - Generic: HashiCorp Vault, 1Password, LastPass

2. Rotate secrets periodically:
   - Firebase service account keys
   - Supabase API keys
   - JWT secrets

3. Log only non-sensitive config:
   - Rate limits (public)
   - Thresholds (public)
   - NOT Firebase keys
   - NOT database credentials

---

## Reference

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for:
- How to configure each variable for production
- Rate limiting behavior and configuration
- Device cleanup scheduling
- Retry policy details
- Worker health monitoring

See [NOTIFICATION_API_SPEC.md](./NOTIFICATION_API_SPEC.md) for:
- API endpoints that use these variables
- Default behavior when variables are unset

See [QA_CHECKLIST_PHASE8.md](./QA_CHECKLIST_PHASE8.md) for:
- Testing custom configuration values
- Verifying environment variables are read correctly

---

**Status:** Complete reference for all Phase 8 environment variables.

**Last Updated:** 2026-06-19
