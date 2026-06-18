# Cross-Platform Host Notification System

You are a senior full-stack architect and implementation engineer. Extend my existing web application with a cross-platform host notification system for a guest-host hospitality platform.

Do not rewrite the existing application unless absolutely necessary. Reuse the current architecture, authentication, database, API patterns, coding conventions, UI components, and deployment setup.

The implementation must support:

* Web browsers
* Installable PWA on Windows, macOS, and Linux
* Native iOS application using Capacitor
* Native Android application using Capacitor
* Firebase Cloud Messaging
* Apple Push Notification service through Firebase for iOS
* Firebase Web Push for the PWA
* Multiple devices per host
* Deep links from notifications into a specific guest request
* Notification acknowledgement
* Automatic escalation when a request is not acknowledged

## Primary objective

Guests use the existing website to:

* Ask a question
* Report an issue
* Request assistance
* Submit another supported guest request

Hosts use a shared React and TypeScript interface that is delivered as:

1. A browser application
2. An installable PWA for desktop
3. A Capacitor iOS application
4. A Capacitor Android application

The host must receive a push notification when a guest submits a request, even when the host application or website is not currently open.

The host must be able to tap the notification and open the exact request.

## Required architecture

Use the following structure:

```text
Shared host frontend
React + TypeScript
        |
        +-- Web/PWA
        |   +-- Windows, macOS, Linux and browser use
        |
        +-- Capacitor iOS shell
        |   +-- Native notifications through FCM and APNs
        |
        +-- Capacitor Android shell
            +-- Native notifications through FCM
```

The event flow should be:

```text
Guest submits a request
        |
Backend validates and stores the request
        |
Backend determines the responsible host or hosts
        |
Backend creates a notification job
        |
Notification worker loads active host devices
        |
Push is sent through Firebase Cloud Messaging
        |
Host receives notification
        |
Host taps Accept or Open
        |
Application opens the exact guest request
        |
Host explicitly acknowledges the request
        |
Pending escalation is cancelled
```

Firebase must only be used as the delivery channel. Business logic, authorization, host selection, escalation, notification history, and acknowledgement must remain in the trusted backend.

## First step: inspect the existing repository

Before changing code:

1. Inspect the complete repository structure.
2. Identify:

   * Frontend framework and version
   * Backend language and framework
   * Database and ORM
   * Authentication system
   * Existing user, host, guest, property, room, and request models
   * Existing API conventions
   * Background job or queue infrastructure
   * Existing Docker and deployment configuration
   * Current environment-variable management
   * Existing test frameworks
   * Existing notification functionality
3. Determine whether the frontend already uses React and TypeScript.
4. Determine whether the application already has:

   * A web manifest
   * A service worker
   * PWA support
   * Capacitor
   * Firebase
5. Produce a brief repository assessment.
6. Create an incremental implementation plan.
7. Immediately begin implementing the first phase after presenting the assessment.

Do not stop after producing documentation or a high-level plan.

Adapt all implementation details to the existing stack. Do not introduce a second backend framework, database, ORM, state-management library, or component library without a strong technical reason.

## Core data model

Implement or adapt a device-registration model similar to:

```text
host_devices
- id
- host_id
- property_id
- platform
- app_type
- notification_token
- notifications_enabled
- permission_status
- device_name
- app_version
- last_seen_at
- token_updated_at
- created_at
- updated_at
- revoked_at
```

Recommended enum values:

```text
platform:
- ios
- android
- web
- unknown

app_type:
- native
- pwa
- browser
```

A host may have multiple registered devices, including:

* iPhone
* Android phone
* Android tablet
* Windows PWA
* macOS PWA
* Office browser

Do not enforce one token per host.

Enforce token uniqueness where appropriate and ensure that tokens can be rotated, replaced, disabled, and deleted safely.

Do not expose notification tokens through public APIs or logs.

## Guest request model

Adapt the existing request or issue model. It must support at least:

```text
guest_requests
- id
- property_id
- room_id or location
- guest_id when available
- category
- priority
- title
- description
- status
- assigned_host_id
- acknowledged_by
- acknowledged_at
- seen_at
- started_at
- resolved_at
- escalated_at
- created_at
- updated_at
```

Suggested request states:

```text
new
notified
seen
acknowledged
in_progress
resolved
cancelled
escalated
```

Implement valid state-transition rules. Prevent invalid transitions such as moving a resolved request back to `new` without an explicit reopen operation.

## Notification records

Create a notification-delivery history so that sending, delivery attempts, failures, acknowledgements, and escalation can be audited.

Suggested model:

```text
notification_attempts
- id
- guest_request_id
- host_id
- host_device_id
- channel
- attempt_number
- provider_message_id
- status
- failure_code
- failure_message
- sent_at
- acknowledged_at
- created_at
- updated_at
```

Suggested delivery states:

```text
pending
sent
failed
invalid_token
acknowledged
cancelled
```

Do not treat an FCM success response as confirmation that the host saw the notification. It only means Firebase accepted the send operation.

## Firebase integration

Use the Firebase Admin SDK only in the trusted backend.

Never place Firebase Admin credentials, service-account private keys, or privileged messaging logic in the frontend.

Implement:

* Firebase Admin initialization
* Environment-based configuration
* Individual-token sending
* Multicast sending where appropriate
* Platform-specific payloads
* Invalid-token cleanup
* Retry handling for transient failures
* Structured error handling
* Notification-attempt persistence
* Token rotation support

Use one Firebase project unless the existing environment structure requires separate projects for local, staging, and production.

Keep development, staging, and production credentials isolated.

## Notification payload

A guest-request notification should contain a safe and concise preview.

Example:

```text
Title: New guest request
Body: Room 204: Air conditioner problem

Actions:
- Accept
- Open
```

For privacy-sensitive deployments, use:

```text
Title: New guest request
Body: Room 204 needs assistance
```

The notification payload should contain identifiers, not the complete sensitive record.

Suggested data payload:

```json
{
  "type": "guest_request",
  "requestId": "REQUEST_ID",
  "propertyId": "PROPERTY_ID",
  "route": "/host/requests/REQUEST_ID"
}
```

Do not trust IDs received from a notification. The backend must reauthorize the currently authenticated host before returning request details.

## Deep linking

Implement deep linking consistently across:

* Web browser
* Installed PWA
* Capacitor iOS
* Capacitor Android

A notification for request `123` should open a route similar to:

```text
/host/requests/123
```

Requirements:

* If the host is authenticated, open the request.
* If the host is not authenticated, redirect to login and then return to the requested route.
* If the host does not have access to the property or request, show an authorized-access error without leaking request information.
* If the request no longer exists, show a suitable not-found state.
* Handle notification taps when the app is:

  * In the foreground
  * In the background
  * Terminated
  * Already open on another route

## PWA implementation

Add or update:

* Web app manifest
* Application name
* Short name
* Icons
* Theme and background settings
* `display: "standalone"`
* Service worker
* Firebase messaging service worker
* Offline shell where appropriate
* Installability requirements
* Notification permission onboarding
* Push-token registration
* Token refresh handling
* Notification click handling
* PWA update handling

Target:

* Chrome
* Edge
* Supported desktop browsers
* Android browsers with PWA support
* iOS Home Screen web apps where supported

Do not depend on desktop Electron unless an existing requirement specifically needs deeper desktop operating-system integration.

## Capacitor implementation

Integrate Capacitor into the existing frontend rather than creating a separate unrelated frontend.

Set up:

* Capacitor core
* iOS platform
* Android platform
* Push Notifications plugin
* App plugin for deep-link handling where needed
* Badge support where practical
* Native configuration files
* Firebase configuration for both native platforms
* Permission handling
* Registration listeners
* Notification-received listeners
* Notification-action listeners
* Token synchronization with the backend

Keep native code minimal. Shared business logic and UI should remain in React and TypeScript.

Use a small platform abstraction such as:

```ts
interface NotificationClient {
  isSupported(): boolean;
  requestPermission(): Promise<NotificationPermissionResult>;
  register(): Promise<void>;
  unregister(): Promise<void>;
  getPlatform(): NotificationPlatform;
}
```

Provide separate implementations for:

* Capacitor native
* Web/PWA
* Unsupported environments

Do not scatter platform checks throughout UI components.

## iOS requirements

Configure:

* Firebase iOS application
* APNs integration
* Push Notification capability
* Required background modes where appropriate
* Notification permission request
* Device-token registration
* FCM token handling
* Foreground-notification presentation
* Notification tap handling
* Deep links
* App badge behavior where supported

Document the manual setup required in:

* Apple Developer account
* App identifier
* APNs authentication key or certificate
* Xcode signing
* Firebase Console
* Provisioning
* App Store configuration

Do not commit Apple signing certificates, provisioning profiles, APNs keys, or secret credentials.

## Android requirements

Configure:

* Firebase Android application
* `google-services.json`
* Required Gradle configuration
* Android notification permission
* Android notification channel
* Notification importance
* Notification sound
* Notification icon
* Notification tap behavior
* Deep links
* Battery-optimization considerations

Create a high-importance notification channel for urgent guest requests, but do not attempt to bypass user or operating-system notification preferences.

Document the manual setup required in:

* Firebase Console
* Android Studio
* Application ID
* App signing
* Play Store configuration

Do not commit signing keys or private credentials.

## Host notification onboarding

Create a host-facing notification setup screen.

It should display:

* Current platform
* Notification support status
* Permission status
* Registration status
* Last successful token synchronization
* A button to enable notifications
* A button to send a test notification
* Troubleshooting information
* Registered devices for the current host
* Ability to disable or remove a device

Example states:

```text
Notifications enabled
Permission denied
Permission not requested
Unsupported browser
Device registered
Registration failed
Test notification sent
```

Do not request notification permission immediately on page load. Explain the benefit first and request permission after an explicit host action.

## Backend API

Add or adapt authenticated endpoints similar to:

```text
POST   /api/host/devices/register
POST   /api/host/devices/unregister
GET    /api/host/devices
DELETE /api/host/devices/:id
POST   /api/host/notifications/test

POST   /api/guest/requests
GET    /api/host/requests
GET    /api/host/requests/:id
POST   /api/host/requests/:id/seen
POST   /api/host/requests/:id/acknowledge
POST   /api/host/requests/:id/start
POST   /api/host/requests/:id/resolve
```

Follow the existing project's API and route conventions rather than copying these paths blindly.

Requirements:

* Authenticate hosts.
* Authorize access by property and role.
* Validate all input.
* Rate-limit guest request submission where appropriate.
* Make acknowledgement idempotent.
* Make device registration idempotent.
* Prevent one host from removing another host's device.
* Prevent guests from selecting arbitrary hosts unless explicitly supported.
* Protect the test-notification endpoint from abuse.

## Host assignment

Implement host resolution using existing business rules.

If no assignment rules exist, create a clean service interface such as:

```ts
interface HostAssignmentService {
  findRecipients(request: GuestRequest): Promise<HostRecipient[]>;
}
```

The implementation should support future assignment strategies such as:

* Host assigned to the property
* Host assigned to a room
* Currently on-duty host
* Host role or department
* Maintenance team
* Backup host
* Manager escalation

Do not hard-code a single host ID.

## Notification worker and queue

Use the existing background-job system if one exists.

If the project has no queue, implement the smallest reliable solution appropriate to the existing backend. Keep queue infrastructure behind an interface so it can later be replaced.

The guest-request API should not wait for all Firebase calls before responding.

Preferred flow:

1. Store the request transactionally.
2. Create an outbox or notification job.
3. Return a successful response.
4. Process push delivery asynchronously.
5. Persist every delivery attempt.

Where practical, use a transactional outbox pattern so a saved request cannot be lost between the database transaction and notification scheduling.

## Acknowledgement and escalation

Push delivery alone is insufficient. Implement acknowledgement and escalation.

Default escalation policy:

```text
00 seconds:
Send push to every active device belonging to the assigned host.

30 seconds:
If not acknowledged, send another push or notify another active device.

60 seconds:
If still not acknowledged, notify the backup host.

120 seconds:
Send an SMS or WhatsApp fallback through a provider abstraction.

180 seconds:
Notify the manager.
```

Make escalation timing configurable by environment or property settings. Do not hard-code timing throughout the codebase.

Suggested configuration:

```text
initial_push_delay_seconds
repeat_push_delay_seconds
backup_host_delay_seconds
external_fallback_delay_seconds
manager_escalation_delay_seconds
```

Escalation must stop when:

* The request is acknowledged.
* The request is resolved.
* The request is cancelled.
* An authorized operator manually stops escalation.

Use database-backed state checks to prevent race conditions.

All escalation jobs must be idempotent.

Implement locking, unique job keys, compare-and-update operations, or another mechanism suitable for the existing stack so duplicate workers do not send duplicate escalations.

## SMS and WhatsApp fallback

Do not tightly couple the application to one provider.

Create an abstraction similar to:

```ts
interface FallbackNotificationProvider {
  sendSms(message: FallbackMessage): Promise<DeliveryResult>;
  sendWhatsApp(message: FallbackMessage): Promise<DeliveryResult>;
}
```

Initially, it is acceptable to implement:

* A development logging provider
* A disabled production placeholder
* An adapter for an existing provider if the repository already uses one

Keep provider credentials in environment variables or a secret manager.

## Security requirements

Implement the following:

* Firebase Admin credentials only on the backend
* Strict host authorization by property
* Server-side validation of all request transitions
* No sensitive guest information in push payloads
* No notification tokens in ordinary logs
* No secrets committed to Git
* CSRF protection where relevant
* Rate limiting
* Input validation
* Audit records for acknowledgement and resolution
* Safe handling of expired and invalid tokens
* Revocation of tokens on logout where appropriate
* Token cleanup for inactive devices
* Prevention of insecure direct-object references
* Idempotency for registration, acknowledgement, and escalation
* Safe return-to-route handling after authentication

## Reliability and observability

Add structured logs and metrics for:

* Guest requests created
* Notification jobs created
* Push attempts
* Successful FCM submissions
* Failed FCM submissions
* Invalid tokens
* Acknowledgement latency
* Escalations
* SMS or WhatsApp fallbacks
* Requests resolved
* Unacknowledged requests

Include correlation identifiers such as:

* Request ID
* Notification job ID
* Host ID
* Property ID
* Notification attempt ID

Do not log full notification tokens, guest messages, authentication tokens, or secrets.

Add health checks for any new worker process.

## User interface

Create a mobile-first host dashboard containing:

* New requests
* Unacknowledged requests
* Requests in progress
* Resolved requests
* Priority indicator
* Property and room/location
* Time since submission
* Accept button
* Open button
* Start-work button
* Resolve button
* Escalation indicator
* Notification setup status

The request-detail screen should allow the host to:

* See request details
* Acknowledge the request
* Start handling it
* Resolve it
* Add an internal note if the current application supports notes
* See request history
* See escalation status

Use accessible components and provide suitable loading, empty, offline, failure, and permission-denied states.

## Testing requirements

Add automated tests appropriate to the existing test stack.

Include tests for:

### Backend

* Device registration
* Duplicate token registration
* Token rotation
* Device removal
* Host authorization
* Guest request creation
* Host assignment
* Notification job creation
* Push fan-out to multiple devices
* Invalid-token cleanup
* Acknowledgement
* Idempotent acknowledgement
* Escalation cancellation
* Escalation timing
* Duplicate-job protection
* Request state transitions
* Unauthorized request access

### Frontend

* Notification onboarding
* Permission states
* Device registration
* Deep-link routing
* Login return routing
* Acknowledge button
* Request-state updates
* Platform abstraction
* Unsupported browser behavior

### End-to-end

Where the project supports end-to-end tests, cover:

1. Guest submits request.
2. Backend creates notification job.
3. Mock notification provider receives the expected payload.
4. Host opens the deep link.
5. Host acknowledges the request.
6. Escalation is cancelled.

Use provider interfaces and mocks. Automated tests must not send real production notifications.

## Local development

Provide a safe local-development mode.

It should support:

* Mock notification provider
* Logging notification payloads locally
* Test device registration
* Manual notification trigger
* Configurable short escalation intervals
* Firebase-disabled mode
* Seed data for a guest, property, host, device, and request

Do not require production Firebase credentials to run ordinary unit tests.

## Documentation

Create or update documentation covering:

* Architecture overview
* Local development
* Required environment variables
* Firebase project setup
* Web Push and VAPID setup
* PWA setup
* Capacitor installation
* iOS setup
* APNs setup
* Android setup
* Notification-channel setup
* App signing
* Token registration lifecycle
* Deep-link behavior
* Escalation configuration
* Testing
* Deployment
* Troubleshooting

Include a checklist for manual setup that cannot be automated.

## Environment variables

Adapt names to the existing project conventions, but account for values such as:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIREBASE_WEB_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_WEB_APP_ID
FIREBASE_VAPID_KEY

NOTIFICATION_REPEAT_DELAY_SECONDS
BACKUP_HOST_DELAY_SECONDS
FALLBACK_DELAY_SECONDS
MANAGER_ESCALATION_DELAY_SECONDS

SMS_PROVIDER
SMS_PROVIDER_API_KEY
WHATSAPP_PROVIDER
WHATSAPP_PROVIDER_API_KEY
```

Avoid exposing backend-only variables to the frontend bundle.

Handle multiline private keys safely.

Provide an example environment file containing placeholders only.

## Implementation phases

Implement incrementally in this order unless the repository structure strongly requires another order.

### Phase 1: repository assessment and domain design

* Inspect the repository.
* Map existing models and services.
* Define the integration points.
* Add database migrations.
* Add domain enums and interfaces.

### Phase 2: backend notification foundation

* Firebase Admin initialization
* Device registration APIs
* Device-token persistence
* Notification service abstraction
* Mock provider
* Notification-attempt records
* Tests

### Phase 3: guest request event flow

* Create or adapt guest-request submission
* Host assignment
* Notification-job creation
* Asynchronous worker
* Multidevice push delivery
* Tests

### Phase 4: web and PWA

* Manifest
* Service worker
* FCM Web Push
* Notification onboarding
* Token synchronization
* Notification-click routing
* Test notification
* Tests

### Phase 5: Capacitor Android

* Capacitor setup
* Firebase Android configuration
* Permission handling
* Push registration
* Notification channel
* Deep links
* Tests and documentation

### Phase 6: Capacitor iOS

* Capacitor setup
* Firebase iOS configuration
* APNs configuration
* Permission handling
* Push registration
* Foreground presentation
* Deep links
* Tests and documentation

### Phase 7: acknowledgement and escalation

* Acknowledgement endpoint
* Seen state
* Escalation scheduler
* Backup host
* Fallback-provider abstraction
* Cancellation and race-condition protection
* Tests

### Phase 8: production hardening

* Token cleanup
* Retry policy
* Rate limiting
* Metrics
* Structured logging
* Security review
* Deployment documentation
* Manual QA checklist

## Coding standards

Follow the existing repository standards.

Additionally:

* Use TypeScript strict mode where the project supports it.
* Avoid `any`.
* Keep platform-specific logic behind interfaces.
* Use dependency injection where already supported.
* Keep functions focused and testable.
* Do not place business logic in React components.
* Do not place Firebase Admin logic directly in route handlers.
* Do not duplicate request-state logic across endpoints.
* Use transactions for related database changes.
* Make background jobs idempotent.
* Add meaningful comments only where the intent is not obvious.
* Avoid unnecessary dependencies.
* Use the latest stable dependency versions compatible with the existing project.
* Do not perform broad unrelated refactors.

## Definition of done

The implementation is complete when:

1. A guest can submit a request.
2. The request is stored successfully.
3. The responsible host is identified.
4. Every active registered host device receives a notification attempt.
5. Web/PWA notifications work through Firebase Web Push.
6. Android notifications work through the Capacitor application.
7. iOS notifications work through the Capacitor application and APNs.
8. Tapping a notification opens the exact request.
9. Authentication and property authorization are enforced.
10. The host can acknowledge the request.
11. Acknowledgement cancels pending escalation.
12. Unacknowledged requests escalate according to configuration.
13. Invalid notification tokens are disabled or removed.
14. Delivery attempts and request transitions are auditable.
15. Unit and integration tests pass.
16. Setup and deployment instructions are documented.
17. No credentials or private keys are committed.

## Required response format while implementing

Work in small, reviewable increments.

For each implementation phase:

1. Explain what you found in the existing repository.
2. State the changes you will make.
3. List the files being added or modified.
4. Implement the changes.
5. Show database migrations when applicable.
6. Show configuration changes.
7. Add or update tests.
8. Run available linting, type checking, tests, and builds.
9. Report the exact results.
10. Identify any manual Firebase, Apple, Android, or deployment steps.

Do not claim that a command, test, build, notification, or native configuration works unless it was actually executed or verified.

When an external account or credential is required, implement everything that can be completed without it and provide the exact remaining manual steps.

Begin by inspecting the repository and producing the Phase 1 repository assessment. Then immediately start the first safe implementation changes.
