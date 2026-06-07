 # AI Co-Host

AI Co-Host is an AI-powered hospitality operations platform designed for short-term rentals, Airbnb hosts, property managers, and boutique hospitality businesses.

The platform combines:

- AI concierge
- guest communication
- digital welcome books
- QR/NFC guest access
- Wi-Fi Porter integration
- host inbox
- issue and escalation tracking
- cleaning operations
- notifications
- billing/subscription foundations
- operational AI workflows

inside one centralized dashboard.

The current project is a working local MVP intended for technical review, stabilization, and future private beta testing.

---

# Core Features

## AI Concierge

- AI-powered guest chat
- property-aware responses
- knowledge-base driven replies
- dynamic prompt builder
- guest issue and escalation detection
- operational problem categorization
- host notification/issue creation for urgent messages
- local fallback replies when OpenAI is unavailable or misconfigured

## Host Dashboard

- multi-property management
- property configuration
- Wi-Fi details
- check-in/check-out information
- lockbox code
- emergency numbers
- Welcome Book editor
- AI training interface
- module management
- quick links to guest page, API data, and Guest Access QR/NFC
- sidebar navigation to Inbox, Issues, QR/NFC, Cleaning, Billing, Notifications, and Logout

## Guest Page / Welcome Book

- public guest page per property slug
- mobile-first guest experience
- Wi-Fi card
- check-in card
- emergency card
- arrival instructions
- house rules
- amenities
- parking information
- restaurants and bars
- transport information
- local guide
- checkout notes
- extra services / extra notes
- embedded AI Concierge

Example local route:

```txt
/guest/maltese-maisonette
```

## Guest Access QR/NFC

- Guest Access dashboard page
- property-specific guest page URL
- NFC-ready URL
- main QR code for guest welcome page
- optional Wi-Fi QR code
- QR download actions
- designed for physical Wi-Fi Porter / NFC stand usage

Example local route:

```txt
/dashboard/qr
```

Main intended flow:

```txt
Guest scans QR or taps NFC
→ Guest Page opens
→ Guest sees Wi-Fi, Welcome Book, House Rules, Local Guide, Extra Services
→ Guest can ask the AI Concierge
```

Real QR/NFC testing requires a public deployed URL. Localhost URLs should not be written to real NFC tags or printed as final QR codes.

## Host Inbox

- guest conversation inbox
- conversation preview
- unread tracking
- priority detection
- host attention state
- conversation history
- guest/AI message display
- Supabase realtime refresh

## Issues / Escalations

- AI escalation alerts
- issue creation from guest problem messages
- issue categorization
- priority/status display
- property name enrichment
- Resolve issue flow
- host-facing issue dashboard

## Cleaning Operations

- cleaning dashboard
- cleaner mobile interface
- checklist management
- cleaning task tracking
- turnover workflow foundation

## Notifications

- host notification center
- issue/escalation alerts
- priority-based notification foundation

## Authentication

- basic login route
- auth ON/OFF feature flag
- protected dashboard routes when auth is enabled
- logout route and logout page
- cookie-based MVP session control

Routes:

```txt
/login
/logout
/api/logout
```

Auth flag:

```env
NEXT_PUBLIC_AUTH_ENABLED="false"
```

## Billing Foundations

- subscription-ready architecture
- Stripe-ready foundation
- billing route placeholder

---

# Tech Stack

## Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS

## Backend

- Next.js API Routes
- Supabase
- OpenAI API

## Database

- Supabase PostgreSQL

## AI

- OpenAI model configurable through `OPENAI_MODEL`
- currently expected default: `gpt-4.1-mini`
- dynamic prompt builder
- property knowledge-base architecture
- local fallback logic for AI replies

---

# Environment Variables

Create:

```bash
.env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

NEXT_PUBLIC_AUTH_ENABLED="false"
NEXT_PUBLIC_ADMIN_EMAIL=
NEXT_PUBLIC_ADMIN_PASSWORD=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional future variables:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Important notes:

- Do not commit `.env.local`.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.
- Avoid sharing screenshots containing environment variables.
- The current OpenAI API key may need regeneration or verification if `invalid_api_key` appears.
- Vercel deployment will require production environment variables.

---

# Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open:

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
http://localhost:3000/dashboard/cleaning/mobile
http://localhost:3000/dashboard/billing
http://localhost:3000/login
http://localhost:3000/logout
```

---

# Current Project Structure

```txt
frontend/
├── app/
│   ├── api/
│   │   ├── all-conversations/
│   │   ├── chat/
│   │   ├── conversations/
│   │   ├── issues/
│   │   ├── logout/
│   │   └── properties/
│   │
│   ├── dashboard/
│   │   ├── billing/
│   │   ├── cleaning/
│   │   ├── inbox/
│   │   ├── issues/
│   │   ├── notifications/
│   │   ├── qr/
│   │   └── page.tsx
│   │
│   ├── guest/
│   │   └── [slug]/
│   │
│   ├── login/
│   ├── logout/
│   └── welcome/
│
├── components/
├── lib/
│   ├── ai/
│   ├── services/
│   └── supabase/
│
├── public/
├── middleware.ts
├── ROADMAP.md
└── ARCHITECTURE.md
```

---

# Current Status

The platform is currently a working local MVP with:

- host dashboard
- property management
- guest page
- welcome book
- AI Concierge
- fallback AI replies
- host inbox
- issues/escalations
- resolve issue flow
- QR/NFC guest access
- login/logout flow
- cleaning module foundation
- notification foundation
- billing route foundation

Current estimated progress:

```txt
Local MVP testable: 75–80%
Private beta readiness: 55–60%
Commercial SaaS readiness: 30%
```

The platform is currently in active architecture, schema stabilization, and deployment preparation phase.

---

# Important Architecture Principles

## Keep Database Lean

Avoid creating endless database columns.

Use:

- direct columns for operational fields
- JSONB for flexible AI knowledge
- clear schema for conversations, messages, issues, and properties

Current important note:

```txt
Some Supabase columns were manually aligned during local stabilization.
A proper migration should be created before production deployment.
```

## AI-First Architecture

The AI system should:

- understand property context
- answer guest questions using property data
- detect operational problems
- escalate urgent situations
- reduce manual host workload
- preserve a fallback mode when OpenAI is unavailable

## Modular Dashboard Architecture

Dashboard modules should remain independent where possible.

Main principle:

```txt
Dashboard → API routes → Supabase / service layer
```

Avoid placing complex module logic directly inside the dashboard UI.

---

# Main API Routes

## Property API

```txt
GET /api/properties
POST /api/properties
GET /api/properties/[identifier]
DELETE /api/properties/[identifier]
```

## Chat API

```txt
POST /api/chat
```

Responsibilities:

- receive guest message
- find property
- create/find conversation
- save guest message
- detect escalation
- generate OpenAI or fallback reply
- save assistant message
- update conversation preview
- create issue/notification if needed

## Conversation API

```txt
GET /api/all-conversations
GET /api/conversations
PATCH /api/conversations
PATCH /api/conversations/read
```

## Issues API

```txt
GET /api/issues
POST /api/issues/resolve
```

## Logout API

```txt
GET /api/logout
POST /api/logout
```

---

# Main Database Tables

Current main Supabase tables:

```txt
properties
conversations
messages
issues
notifications
cleaning_tasks
```

## properties

Used for:

- property dashboard
- guest page
- QR/NFC guest access
- AI prompt context

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

## conversations

Used for:

- conversation previews
- inbox
- unread counts
- priority/host attention status

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

## messages

Used for:

- guest messages
- AI messages
- conversation history

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

Compatibility note:

```txt
The code currently supports both content and message.
This should be standardized in a future schema cleanup.
```

## issues

Used for:

- guest issues
- escalations
- host operations dashboard

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

## notifications

Used for:

- host notifications
- issue alerts
- escalation alerts

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

Run dev server:

```bash
npm run dev
```

Git status:

```bash
git status
```

Clean auto-generated Next file if needed:

```bash
git restore next-env.d.ts
```

Expected clean Git state:

```txt
nothing to commit, working tree clean
```

---

# Useful Local Test Flow

Start the local dev server:

```bash
npm run dev
```

Open the dashboard:

```txt
http://localhost:3000/dashboard
```

Test guest flow:

```txt
http://localhost:3000/guest/maltese-maisonette
```

Ask the AI Concierge:

```txt
What is the WiFi password?
How do I check in?
Where can I park?
The lockbox is broken and I cannot enter the apartment.
```

Then verify:

```txt
/dashboard/inbox
/dashboard/issues
```

Expected result:

- guest and AI messages appear in Inbox
- urgent/problem messages create Issues
- Issues can be resolved from the dashboard

---

# Production Checklist

Before production or real beta usage:

- regenerate/verify OpenAI API key
- create proper Supabase migrations
- review Supabase schema
- enable and review RLS
- configure grants and policies
- verify service role key is server-side only
- review API route protection
- configure real auth
- configure Vercel environment variables
- deploy to Vercel
- test public guest page
- test QR/NFC from real phone
- test escalation pipeline
- review guest data exposure
- configure Stripe before commercial launch
- add monitoring/logging
- run security review

---

# Current Known Issues / Pending Items

## OpenAI API Key

The OpenAI integration exists, but the current API key may need regeneration or verification.

If the key is invalid, logs may show:

```txt
invalid_api_key
```

Fallback replies keep the app usable locally.

## Supabase Schema

Some schema changes were manually applied during local stabilization.

A proper migration should be created before production deployment.

Priority:

```txt
High before production deployment.
```

## Vercel Deployment

Deployment is still pending.

Public deployment is required for:

- real QR testing
- NFC testing
- phone-based guest flow
- Wi-Fi Porter validation

## Security

Auth is currently a basic MVP-level cookie flow.

Before beta/production:

- review auth
- review RLS
- review service role usage
- review public/private routes
- review guest data exposure

## SaaS Readiness

Not ready for commercial SaaS release.

Still needed:

- user accounts
- organizations/teams
- tenant isolation
- billing/subscriptions
- Stripe integration
- production-grade auth
- monitoring
- audit/security review

---

# Future Development

Planned:

- stable Supabase migrations
- real authentication
- organization/team accounts
- Stripe subscriptions
- WhatsApp integration
- Telegram alerts
- cleaner accounts
- PMS integrations
- Airbnb sync
- calendar/channel manager
- AI operational workflows
- advanced host notifications
- guest services marketplace
- production deployment
- QR/NFC Wi-Fi Porter rollout

---

# Strategic Next Blocks

## Block 6A — Supabase Schema Stabilization

Goal:

```txt
Create a stable database schema and migration plan.
```

## Block 6B — OpenAI Reliability

Goal:

```txt
Regenerate/verify OpenAI API key and confirm real AI responses.
```

## Block 6C — Vercel Deployment

Goal:

```txt
Deploy a private public demo.
```

## Block 6D — Real QR/NFC Wi-Fi Porter Test

Goal:

```txt
Test QR/NFC access with a public URL from a real phone.
```

## Block 6E — Security & Beta Readiness Review

Goal:

```txt
Prepare the MVP for safe private beta usage.
```

---

# License

Private internal project.
