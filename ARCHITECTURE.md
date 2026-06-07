 # AI CO-HOST — Architecture Overview

## Project Vision

AI Co-Host is an AI-powered hospitality platform designed for:

- Airbnb hosts
- property managers
- short-term rental operators
- small hospitality businesses managing one or multiple properties

The platform centralizes:

- property management
- guest communication
- AI concierge support
- digital welcome books
- check-in information
- QR/NFC guest access
- Wi-Fi Porter integration
- host inbox
- issue/escalation tracking
- cleaning operations
- billing/subscriptions
- operational management

The long-term vision is to build a lightweight, modular SaaS platform for small hosts and property managers, starting from a working MVP for real properties.

---

# Core Stack

## Frontend

- Next.js App Router
- TypeScript
- TailwindCSS
- React client components for dashboard and interactive guest flows

## Backend

- Next.js API routes
- Supabase server/client integrations
- OpenAI API integration
- Local fallback logic for AI replies when OpenAI is unavailable

## Database

- Supabase PostgreSQL

## External Services

- Supabase
- OpenAI
- Vercel deployment planned
- Telegram integration partially present / planned
- WhatsApp integration planned
- Stripe billing planned

---

# Current Project Status

The project is currently a local MVP with several working modules.

Estimated current status:

```txt
Local MVP testable: 75–80%
Private beta readiness: 55–60%
Commercial SaaS readiness: 30%
```

The project is not yet production-ready or commercially sellable, but it is now a concrete working MVP suitable for developer review and technical stabilization.

Current working local flow:

```txt
Host configures property
→ Guest opens public guest page
→ Guest reads Wi-Fi / Welcome Book / Rules
→ Guest asks AI Concierge
→ Messages are stored
→ Host sees conversation in Inbox
→ Guest issues create Issues/Escalations
→ Host resolves issues
→ QR/NFC page generates guest access links for Wi-Fi Porter
```

---

# Main Modules

## 1. Property Dashboard

Path:

```txt
/dashboard
```

Purpose:

The main host dashboard where the host can manage property data, guest-facing content, AI training notes, module toggles, and operational links.

Current functionality:

- load properties from Supabase
- select property
- create/add property
- delete property
- edit property name and slug
- edit location information
- edit Wi-Fi name and password
- edit check-in/check-out information
- edit lockbox code
- edit emergency numbers
- edit Welcome Book content
- edit AI training content
- enable/disable module flags
- quick link to Guest Page
- quick link to API property data
- quick link to Guest Access QR/NFC
- sidebar navigation to Inbox, Issues, Notifications, Cleaning, Billing
- Logout link

Key dashboard sections:

```txt
General
Welcome Book
AI Training
Guest Access QR/NFC
Inbox
Issues
Notifications
Cleaning
Billing
Logout
```

Important route:

```txt
/dashboard
```

---

## 2. Guest Page / Digital Welcome Book

Path:

```txt
/guest/[slug]
```

Example:

```txt
/guest/maltese-maisonette
```

Purpose:

Guest-facing page opened by the guest during the stay. This is the main digital guest experience page.

Current functionality:

- property hero section
- location information
- Wi-Fi information
- copy Wi-Fi button
- check-in/check-out details
- lockbox code
- emergency information
- arrival instructions
- AI Concierge chat
- Welcome Book content
- amenities
- house rules
- parking information
- restaurants and bars
- transport information
- local guide
- checkout notes
- extra services / extra notes

This page is the target page for the QR/NFC Wi-Fi Porter flow.

---

## 3. Guest Access QR/NFC

Path:

```txt
/dashboard/qr
```

Purpose:

Generate and manage the smart guest access links used for QR codes, NFC tags, and the physical Wi-Fi Porter support.

Current functionality:

- select property
- generate Guest Page URL
- generate NFC-ready URL
- generate main QR code pointing to the Guest Page
- copy guest link
- open guest page
- download QR code
- optional Wi-Fi QR section

Main intended target:

```txt
/guest/[slug]
```

Example local URL:

```txt
http://localhost:3000/guest/maltese-maisonette
```

Production target after deploy:

```txt
https://your-production-domain.com/guest/maltese-maisonette
```

Physical concept:

```txt
Guest taps NFC or scans QR on the Wi-Fi Porter
→ Guest Page opens
→ Guest sees Wi-Fi, Welcome Book, House Rules, Local Guide, Extra Services
→ Guest can ask the AI Concierge instead of messaging via Airbnb
```

Important note:

QR/NFC real-world testing requires a public deployed URL. Localhost URLs are only useful for development and cannot be used for real NFC tags or printed QR codes.

---

## 4. AI Concierge

Main API route:

```txt
/api/chat
```

Guest UI location:

```txt
/guest/[slug]
```

Purpose:

Allow guests to ask questions about the property, Wi-Fi, check-in, parking, rules, restaurants, transport, local guide, checkout, and other stay-related information.

Current behavior:

- receives guest message
- finds property by slug or ID
- builds AI prompt from property data and knowledge base
- detects escalation/issue intent
- stores guest message
- generates AI reply using OpenAI when available
- uses local fallback when OpenAI is unavailable or API key fails
- stores assistant reply
- updates conversation preview
- creates host alert/issue if escalation is detected

Current OpenAI status:

```txt
OpenAI integration exists.
Current key may be invalid/revoked and needs regeneration or verification.
Fallback logic keeps the chat flow usable when OpenAI fails.
```

Expected successful response should include:

```txt
success: true
reply: ...
usedFallback: false
```

If OpenAI key fails, the app may still respond using fallback, and logs may show:

```txt
invalid_api_key
```

---

## 5. Host Inbox

Path:

```txt
/dashboard/inbox
```

API routes involved:

```txt
/api/all-conversations
/api/conversations
/api/conversations/read
```

Purpose:

Allow the host to review guest conversations and AI interactions.

Current functionality:

- list property conversations
- show property name and city
- show last message
- show unread count
- show priority badge
- show issue/attention state
- open conversation
- show guest and AI messages
- mark conversation as read
- realtime refresh via Supabase subscription

Status:

```txt
Working locally.
Needs future polish and schema stabilization before production.
```

---

## 6. Issues / Escalations

Path:

```txt
/dashboard/issues
```

API routes involved:

```txt
/api/issues
/api/issues/resolve
```

Purpose:

Track guest problems or escalations that may require host intervention.

Current functionality:

- list open issues
- show property name correctly
- show city
- show priority/status/type
- show issue description
- resolve issue
- show empty state when no open issues exist

Examples of issue-generating guest messages:

```txt
The lockbox is broken and I cannot enter the apartment.
The heater is broken.
I cannot open the door.
There is an emergency.
```

Status:

```txt
Working locally.
Property name display has been fixed.
Resolve flow works.
```

---

## 7. Authentication

Routes:

```txt
/login
/logout
/api/logout
```

Middleware:

```txt
middleware.ts
```

Protected routes:

```txt
/dashboard/:path*
/host/:path*
/admin/:path*
```

Auth flag:

```txt
NEXT_PUBLIC_AUTH_ENABLED
```

Behavior:

```txt
NEXT_PUBLIC_AUTH_ENABLED="false"
→ dashboard opens directly

NEXT_PUBLIC_AUTH_ENABLED="true"
→ /dashboard redirects to /login?redirect=/dashboard
→ login checks admin email/password from environment variables
→ successful login sets ai_cohost_auth cookie
→ user is redirected to dashboard
→ /logout clears ai_cohost_auth cookie
```

Cookie:

```txt
ai_cohost_auth=true
```

Environment variables:

```txt
NEXT_PUBLIC_ADMIN_EMAIL=...
NEXT_PUBLIC_ADMIN_PASSWORD=...
```

Status:

```txt
Auth ON/OFF verified locally.
Login verified.
Logout route and logout page added.
Dashboard includes Logout link.
```

---

## 8. Cleaning Module

Path:

```txt
/dashboard/cleaning
/dashboard/cleaning/mobile
```

Purpose:

Operational cleaning module for turnovers and cleaner workflow.

Current functionality:

- cleaning dashboard route exists
- mobile cleaning route exists
- cleaner task/checklist concept implemented or partially implemented
- checklist items include bathroom, kitchen, bedroom, trash, towels, final check

Status:

```txt
Partially implemented.
Needs further stabilization and integration with real booking/checkout data.
```

---

## 9. Notifications

Path:

```txt
/dashboard/notifications
```

Purpose:

Centralized host notifications for guest issues, escalations, and operational events.

Current status:

```txt
Route exists.
Basic notification creation is connected to issue/escalation logic.
Needs UI/UX and operational refinement.
```

---

## 10. Billing

Path:

```txt
/dashboard/billing
```

Purpose:

Future Stripe subscription and billing management.

Current status:

```txt
Route exists.
Commercial billing is not yet implemented.
Stripe integration planned.
```

---

# API Routes

## Property API

```txt
GET /api/properties
POST /api/properties
GET /api/properties/[identifier]
DELETE /api/properties/[identifier]
```

Used by:

```txt
/dashboard
/guest/[slug]
/dashboard/qr
```

---

## Chat API

```txt
POST /api/chat
```

Used by:

```txt
/guest/[slug]
```

Responsibilities:

```txt
- receive guest message
- find property
- create/find conversation
- save guest message
- detect escalation
- generate AI/fallback reply
- save assistant message
- update conversation preview
- create issue/notification if needed
```

---

## Conversation API

```txt
GET /api/conversations
PATCH /api/conversations
PATCH /api/conversations/read
GET /api/all-conversations
```

Used by:

```txt
/dashboard/inbox
```

Responsibilities:

```txt
- list conversations
- retrieve messages
- mark conversations as read
- aggregate inbox data by property
```

---

## Issues API

```txt
GET /api/issues
POST /api/issues/resolve
```

Used by:

```txt
/dashboard/issues
```

Responsibilities:

```txt
- list issues
- enrich issues with property name/city
- resolve issue
```

---

## Logout API

```txt
GET /api/logout
POST /api/logout
```

Used by:

```txt
/logout
```

Responsibilities:

```txt
- clear ai_cohost_auth cookie
- return logout success response
```

---

# Database Overview

Database:

```txt
Supabase PostgreSQL
```

Main tables currently used:

```txt
properties
conversations
messages
issues
notifications
cleaning_tasks
```

---

## properties

Used for:

```txt
- dashboard property management
- guest page
- QR/NFC generation
- AI prompt context
```

Key fields include:

```txt
id
property_name
slug
city
country
address
wifi_name
wifi_password
checkin_time
checkout_time
checkin_instructions
lockbox_code
emergency_numbers
house_rules
description
amenities
parking_info
local_info
emergency_info
ai_knowledge
knowledge_base
ai_enabled
whatsapp_enabled
telegram_enabled
welcomebook_enabled
```

---

## conversations

Used for:

```txt
- host inbox
- conversation previews
- unread counts
- guest issue tracking
```

Required fields include:

```txt
id
conversation_id
property_id
guest_name
guest_contact
channel
status
priority
requires_host
issue_detected
unread_count
last_sender
last_message
last_message_at
created_at
updated_at
```

Important note:

Some columns were manually added during local stabilization. A proper migration should be created before production deployment.

---

## messages

Used for:

```txt
- guest and assistant messages
- conversation history
- AI context/history
```

Required fields include:

```txt
id
conversation_id
property_id
role
content
message
channel
priority
requires_host
issue_detected
created_at
updated_at
```

Important note:

The code currently supports both `content` and `message` for compatibility. This should be standardized in a future database cleanup.

---

## issues

Used for:

```txt
- guest escalations
- host issue dashboard
- operational problem tracking
```

Fields include:

```txt
id
property_id
conversation_id
issue_type
priority
severity
status
message
description
guest_name
created_at
updated_at
```

---

## notifications

Used for:

```txt
- host alerts
- guest issue notifications
```

Fields include:

```txt
id
property_id
conversation_id
type
title
message
priority
read
created_at
```

---

# Environment Variables

Local environment file:

```txt
.env.local
```

Important variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini

NEXT_PUBLIC_AUTH_ENABLED="false"
NEXT_PUBLIC_ADMIN_EMAIL=...
NEXT_PUBLIC_ADMIN_PASSWORD=...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Important notes:

- Do not expose service role keys in client components.
- Do not share screenshots of `.env.local`.
- OpenAI key may need regeneration/verification.
- Vercel will require production environment variables.

---

# Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Local base URL:

```txt
http://localhost:3000
```

Main local URLs:

```txt
http://localhost:3000/dashboard
http://localhost:3000/dashboard/qr
http://localhost:3000/guest/maltese-maisonette
http://localhost:3000/dashboard/inbox
http://localhost:3000/dashboard/issues
http://localhost:3000/dashboard/notifications
http://localhost:3000/dashboard/cleaning
http://localhost:3000/dashboard/billing
http://localhost:3000/login
http://localhost:3000/logout
```

---

# Validation Commands

TypeScript check:

```bash
npx tsc --noEmit --pretty false
```

Build:

```bash
rm -rf .next
npm run build -- --webpack
```

Lint:

```bash
npm run lint
```

Git status:

```bash
git status
```

Clean auto-generated Next file if needed:

```bash
git restore next-env.d.ts
```

---

# Current Known Issues / Pending Items

## OpenAI key

Current issue:

```txt
OpenAI may return invalid_api_key.
The key should be regenerated or verified in the OpenAI project and billing settings.
```

## Supabase schema

Current issue:

```txt
Some Supabase columns were manually aligned during local testing.
A proper migration should be created.
```

Priority:

```txt
High before production deployment.
```

## Vercel deployment

Current issue:

```txt
Deployment is pending.
QR/NFC real-world testing requires a public URL.
```

## Security

Current issue:

```txt
Security/RLS review is still needed.
Auth is currently basic and suitable only for MVP/demo.
```

## SaaS readiness

Current issue:

```txt
Not ready for commercial SaaS release.
Billing, user accounts, roles, tenant isolation, monitoring, and production security still need work.
```

---

# Strategic Roadmap

## Block 6A — Supabase Schema Stabilization

Goal:

```txt
Create a stable database schema and migration plan.
```

Tasks:

```txt
- review properties, conversations, messages, issues, notifications
- define final columns
- remove ambiguity between content/message
- create SQL migration
- document database schema
```

---

## Block 6B — OpenAI Reliability

Goal:

```txt
Restore real OpenAI functionality and keep fallback stable.
```

Tasks:

```txt
- regenerate/check OpenAI API key
- verify billing/project access
- test OPENAI_MODEL
- verify /api/chat with usedFallback false
- improve error logs if needed
```

---

## Block 6C — Vercel Deployment

Goal:

```txt
Deploy a private public demo.
```

Tasks:

```txt
- connect GitHub repo to Vercel
- use branch ai-cohost-v2
- set root directory to frontend
- configure environment variables
- deploy
- test all main URLs
```

---

## Block 6D — Real QR/NFC Wi-Fi Porter Test

Goal:

```txt
Test the real physical guest access flow.
```

Tasks:

```txt
- generate QR using public production URL
- program NFC tag using public production URL
- test from iPhone/Android
- verify guest page mobile experience
- test AI Concierge from phone
- test issue creation from guest flow
```

---

## Block 6E — Security & Beta Readiness Review

Goal:

```txt
Prepare the MVP for safe private beta usage.
```

Tasks:

```txt
- review Supabase RLS
- verify API routes
- verify service role key usage
- review public/private routes
- review guest page data exposure
- review auth limitations
```

---

# Development Rules

To avoid regressions:

```txt
- avoid partial edits on long files
- prefer full-file replacement when editing large components
- test TypeScript after each block
- run build after meaningful changes
- commit after each stable block
- keep Git clean before moving to the next block
- do not mix multiple unrelated changes in one block
- do not commit next-env.d.ts if it changes automatically
```

---

# Current Branch

```txt
ai-cohost-v2
```

GitHub status should remain:

```txt
nothing to commit, working tree clean
```

before starting any new block.

---

# Summary

AI Co-Host is currently a working local MVP with:

```txt
- property dashboard
- guest page
- welcome book
- AI concierge
- fallback AI replies
- host inbox
- issues/escalations
- resolve issue flow
- QR/NFC guest access
- login/logout flow
```

The next major focus should be:

```txt
1. stabilize Supabase schema
2. fix/regenerate OpenAI API key
3. deploy to Vercel
4. test real QR/NFC Wi-Fi Porter flow
5. review security before beta
```
