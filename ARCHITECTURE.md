 # AI Co-Host Architecture Overview

AI Co-Host is an AI-powered hospitality operations platform for Airbnb hosts, short-term rental operators, small property managers and boutique hospitality businesses.

The platform combines host dashboard, property management, public guest pages, digital welcome books, QR/NFC guest access, WiFi Porter integration, AI Concierge, guest inbox, issue tracking, notifications, cleaning operations, billing foundations and future messaging integrations.

The current project is a working MVP focused on proving a real guest-to-host operational flow.

---

## Architecture Goal

The architecture is designed around one main flow:

Host configures property data
-> Guest opens public guest page through QR/NFC
-> Guest sees WiFi, house rules, local guide and stay essentials
-> Guest asks AI Concierge stay-related questions
-> Messages are stored
-> Host sees conversation in Inbox
-> Urgent issues create Issues and Notifications
-> Cleaning tasks are managed from dashboard/mobile view

The product should remain modular, practical, AI-friendly and easy to stabilize before becoming a full SaaS platform.

---

## Current MVP Status

Current status:

- Local MVP testable: 85-90%
- Private demo readiness: 70-75%
- Private beta readiness: 60-65%
- Commercial SaaS readiness: 30-35%

Current completed areas:

- Host Dashboard
- Dashboard Command Center
- Property Control Panel
- Property Management
- Public Guest Page
- Premium Guest Welcome Experience
- Digital Welcome Book
- Guest Page Content Completeness
- AI Concierge
- AI Guardrails
- Sensitive Access Code Protection
- Local AI Fallback Replies
- Guest Inbox
- Issues / Escalations
- Notifications
- QR/NFC Guest Access
- WiFi QR Generation
- Cleaning Dashboard
- Cleaner Mobile View
- Basic Login / Logout
- Billing Route Foundation
- README MVP handoff

The project is not yet commercial SaaS ready, but it is now concrete enough for structured end-to-end testing, private demo preparation and schema stabilization.

---

## Core Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Client components for dashboard and guest interactions

### Backend

- Next.js API routes
- Supabase server integration
- Supabase client integration where needed
- OpenAI API integration
- Local fallback logic for AI replies

### Database

- Supabase PostgreSQL

### External Services

- Supabase
- OpenAI
- Vercel deployment planned / partially used
- Telegram planned / partially present
- WhatsApp planned
- Stripe planned

---

## High-Level Runtime Flow

### Guest Flow

1. Guest opens /guest/[slug]
2. Page loads property data from /api/properties/[identifier]
3. Guest reads WiFi, welcome book, arrival notes and local guide
4. Guest sends message to AI Concierge
5. /api/chat receives message
6. API finds property
7. API creates/finds conversation
8. API saves guest message
9. API checks scope and sensitive access rules
10. API detects escalation
11. API calls OpenAI or fallback reply logic
12. API saves assistant message
13. API updates conversation preview
14. API creates issue/notification if needed
15. Host sees result in Inbox / Issues / Notifications

### Host Flow

1. Host opens /dashboard
2. Dashboard loads properties
3. Host edits property or opens property control panel
4. Host updates Guest Page, Welcome Book, Local Guide and AI Training
5. Host opens QR/NFC page
6. Host generates guest URL, QR code or NFC-ready URL
7. Host reviews Inbox, Issues, Notifications and Cleaning modules

---

## Main Modules

### 1. Host Dashboard

Route:

- /dashboard

Purpose:

The main host operating center.

Current functionality:

- Dashboard Command Center
- property list
- property selector
- property setup overview
- add property
- delete property
- module toggles
- guest page quick actions
- QR/NFC quick actions
- links to Inbox, Issues, Notifications, Cleaning and Billing
- logout access

The dashboard should stay focused on operational visibility and quick navigation.

---

### 2. Property Control Panel

Route:

- /dashboard/property/[id]

Purpose:

Single-property management cockpit.

Current functionality:

- property overview
- location display
- setup health
- guest page readiness
- access information readiness
- welcome book readiness
- AI Concierge status
- quick actions
- open guest page
- copy WiFi
- QR/NFC link
- Inbox link
- Issues link
- Cleaning link
- property editing sections
- Guest Page editor
- Welcome Book editor
- Local Guide editor
- AI Training editor

This page should remain the main place for property-specific setup.

---

### 3. Guest Page / Digital Welcome Book

Route:

- /guest/[slug]

Example:

- /guest/maltese-maisonette

Purpose:

Public mobile-first guest experience page.

Current functionality:

- premium hero section
- property image
- property intro
- highlights
- WiFi card
- copy WiFi button
- check-in information
- checkout information
- arrival information
- map link
- emergency section
- arrival instructions
- about this stay
- stay essentials
- kitchen section
- washing machine section
- towels and linen section
- beach towels section
- trash and recycling section
- AC section
- hot water / boiler section
- house rules
- amenities
- parking
- restaurants and bars
- transport
- local guide
- checkout notes
- extra services / extra notes
- embedded AI Concierge
- mobile bottom navigation

Security rule:

The guest page must never display private access codes, lockbox codes, door codes or private security instructions.

Important implementation point:

The page may use property direct fields and knowledge_base JSON fields. It should gracefully hide sections when content is empty and show useful fallback content where appropriate.

---

### 4. Guest Access QR/NFC

Route:

- /dashboard/qr

Purpose:

Physical guest access layer.

Current functionality:

- select property
- generate Guest Page URL
- generate NFC-ready URL
- copy guest URL
- copy NFC URL
- open guest page
- generate main guest page QR code
- generate optional direct WiFi QR code
- download guest QR
- download WiFi QR
- preview WiFi Porter / welcome card
- explain physical use cases for printed cards, stickers, NFC tags and guest messages

Main intended target:

- /guest/[slug]

Physical concept:

Guest taps NFC or scans QR
-> Guest Page opens
-> Guest sees WiFi, Welcome Book, House Rules, Local Guide and Extra Services
-> Guest can ask AI Concierge
-> Host sees issues if the guest reports a problem

Important note:

Real QR/NFC testing requires a public deployed URL. Localhost URLs must not be written to real NFC tags or printed as final QR codes.

---

### 5. AI Concierge

Main API route:

- POST /api/chat

Guest UI location:

- /guest/[slug]

Purpose:

Property-aware guest support.

Current behavior:

- receives guest message
- finds property by slug or ID
- creates/finds conversation
- saves guest message
- detects escalation/issue intent
- applies guest portal scope rules
- blocks sensitive access requests
- builds AI prompt from property data and knowledge base
- calls OpenAI when available
- uses local fallback when OpenAI is unavailable
- sanitizes guest portal reply for sensitive access leakage
- saves assistant reply
- updates conversation preview
- creates host alert/issue if escalation is detected

Guest portal scope:

The AI Concierge may answer only stay-related questions.

Allowed topics include:

- WiFi
- check-in
- checkout
- arrival instructions
- general access guidance
- house rules
- appliances
- AC
- boiler / hot water
- washing machine
- towels and linen
- trash and recycling
- parking
- restaurants
- transport
- local guide
- emergency information
- stay-related guest support

Blocked topics include:

- private access codes
- lockbox codes
- door codes
- coding requests
- CV/job application requests
- legal advice
- medical advice
- financial advice
- political requests
- adult content
- illegal or harmful requests
- unrelated general requests

OpenAI status:

OpenAI integration exists. The API key must be valid for real AI replies. If OpenAI fails, fallback logic keeps the guest chat usable.

Expected successful real AI response:

- success: true
- usedFallback: false

Fallback response:

- success: true
- usedFallback: true

---

### 6. Host Inbox

Route:

- /dashboard/inbox

API routes involved:

- GET /api/all-conversations
- GET /api/conversations
- PATCH /api/conversations
- PATCH /api/conversations/read

Purpose:

Host-facing conversation center.

Current functionality:

- list guest conversations
- show property name
- show city/property context
- show last message
- show unread count
- show priority badge
- show issue/attention state
- open conversation
- show guest and AI messages
- mark conversation as read

Status:

Working MVP module. Needs final QA and schema stabilization before production.

---

### 7. Issues / Escalations

Route:

- /dashboard/issues

API routes involved:

- GET /api/issues
- POST /api/issues/resolve

Purpose:

Track guest problems and operational escalations.

Current functionality:

- list open issues
- show property name
- show city
- show priority
- show status
- show issue type
- show issue description
- resolve issue
- show empty state when no open issues exist

Examples of issue-generating guest messages:

- The lockbox is broken and I cannot enter.
- The hot water is not working.
- There is a leak.
- The power is not working.
- There are insects in the apartment.
- I cannot open the door.

Status:

Working MVP module. Needs final QA and schema stabilization.

---

### 8. Notifications

Route:

- /dashboard/notifications

Purpose:

Host alert center for guest issues and operational events.

Current functionality:

- notification center
- issue/escalation alerts
- priority-based display
- read/unread foundation

Status:

Working foundation. Needs final QA and possible future UI polish.

---

### 9. Cleaning Module

Routes:

- /dashboard/cleaning
- /dashboard/cleaning/mobile

Purpose:

Operational turnover workflow.

Current functionality:

- host cleaning dashboard
- cleaner mobile interface
- cleaning task cards
- checklist management
- task status updates
- bathroom / kitchen / bedroom / trash / towels / final check checklist
- warning before completing without final check
- mobile-first cleaner workflow

Status:

Working MVP foundation. Needs future cleaner accounts, assignments, photo uploads and calendar-based task creation.

---

### 10. Authentication

Routes:

- /login
- /logout
- /api/logout

Middleware:

- middleware.ts

Protected route patterns:

- /dashboard/:path*
- /host/:path*
- /admin/:path*

Auth flag:

- NEXT_PUBLIC_AUTH_ENABLED

Behavior:

NEXT_PUBLIC_AUTH_ENABLED="false"
-> dashboard opens directly

NEXT_PUBLIC_AUTH_ENABLED="true"
-> /dashboard redirects to /login?redirect=/dashboard
-> login checks admin email/password from environment variables
-> successful login sets ai_cohost_auth cookie
-> user is redirected to dashboard
-> /logout clears ai_cohost_auth cookie

Cookie:

- ai_cohost_auth=true

Environment variables:

- NEXT_PUBLIC_ADMIN_EMAIL
- NEXT_PUBLIC_ADMIN_PASSWORD

Status:

MVP-level auth only. Suitable for internal development and demo protection, not production SaaS auth.

---

### 11. Billing

Route:

- /dashboard/billing

Purpose:

Future Stripe subscription and billing management.

Current status:

- route exists
- billing page foundation exists
- Stripe is not implemented yet
- commercial billing is not active

---

## API Routes

### Property API

Routes:

- GET /api/properties
- POST /api/properties
- GET /api/properties/[identifier]
- DELETE /api/properties/[identifier]

Used by:

- /dashboard
- /dashboard/property/[id]
- /guest/[slug]
- /dashboard/qr

Responsibilities:

- load properties
- create/update property data
- load property by slug or identifier
- delete property

---

### Chat API

Route:

- POST /api/chat

Used by:

- /guest/[slug]

Responsibilities:

- receive guest message
- find property
- create/find conversation
- save guest message
- detect escalation
- check guest scope
- block sensitive access requests
- generate AI/fallback reply
- sanitize reply
- save assistant message
- update conversation preview
- create issue/notification if needed

---

### Conversation API

Routes:

- GET /api/all-conversations
- GET /api/conversations
- PATCH /api/conversations
- PATCH /api/conversations/read

Used by:

- /dashboard/inbox

Responsibilities:

- list conversations
- retrieve messages
- mark conversations as read
- aggregate inbox data by property

---

### Issues API

Routes:

- GET /api/issues
- POST /api/issues/resolve

Used by:

- /dashboard/issues

Responsibilities:

- list issues
- enrich issues with property name/city
- resolve issue

---

### Logout API

Routes:

- GET /api/logout
- POST /api/logout

Used by:

- /logout

Responsibilities:

- clear ai_cohost_auth cookie
- return logout success response

---

## Database Overview

Database:

- Supabase PostgreSQL

Main tables currently used:

- properties
- conversations
- messages
- issues
- notifications
- cleaning_tasks

---

## Table: properties

Used for:

- dashboard property management
- property control panel
- guest page
- QR/NFC generation
- AI prompt context

Key fields include:

- id
- property_name
- slug
- city
- country
- address
- wifi_name
- wifi_password
- checkin_time
- checkout_time
- checkin_instructions
- lockbox_code
- emergency_numbers
- house_rules
- description
- amenities
- parking_info
- local_info
- emergency_info
- ai_knowledge
- knowledge_base
- ai_enabled
- whatsapp_enabled
- telegram_enabled
- welcomebook_enabled

Important knowledge_base.guest_page fields:

- hero_title
- hero_intro
- hero_image_url
- about_title
- about_intro
- about_description
- about_highlights

Important knowledge_base.welcome_book fields:

- description
- amenities
- house_rules
- apartment_instructions
- kitchen
- washing_machine
- towels_linen
- beach_towels
- parking
- trash
- ac
- boiler
- restaurants
- transport
- local_guide
- emergency
- checkout_notes
- extra_notes

Important knowledge_base.ai_training fields:

- faq
- troubleshooting
- guest_style
- complaint_handling
- escalation_rules
- hidden_notes
- additional_notes

---

## Table: conversations

Used for:

- host inbox
- conversation previews
- unread counts
- guest issue tracking
- priority and attention state

Required fields include:

- id
- conversation_id
- property_id
- guest_name
- guest_contact
- channel
- status
- priority
- requires_host
- issue_detected
- unread_count
- last_sender
- last_message
- last_message_at
- created_at
- updated_at

---

## Table: messages

Used for:

- guest and assistant messages
- conversation history
- AI context/history

Required fields include:

- id
- conversation_id
- property_id
- role
- content
- message
- channel
- priority
- requires_host
- issue_detected
- created_at
- updated_at

Compatibility note:

The code currently supports both content and message for compatibility. This should be standardized in a future database cleanup.

---

## Table: issues

Used for:

- guest escalations
- host issue dashboard
- operational problem tracking

Fields include:

- id
- property_id
- conversation_id
- issue_type
- priority
- severity
- status
- message
- description
- guest_name
- created_at
- updated_at

---

## Table: notifications

Used for:

- host alerts
- guest issue notifications
- escalation notifications

Fields include:

- id
- property_id
- conversation_id
- type
- title
- message
- priority
- read
- created_at

---

## Table: cleaning_tasks

Used for:

- host cleaning dashboard
- cleaner mobile route
- turnover workflow
- checklist tracking

Fields include:

- id
- property_id
- property_name
- cleaning_date
- checkout_time
- cleaner_name
- status
- notes
- checklist
- created_at
- updated_at

Checklist shape:

- bathroom
- kitchen
- bedroom
- trash
- towels
- final_check

---

## Knowledge Base Architecture

The platform should avoid endless database columns.

Use direct columns for operational fields:

- ids
- slugs
- timestamps
- ownership
- status
- priority
- feature toggles
- relational references
- fields needed for filtering or joins

Use JSONB for flexible content:

- guest page content
- welcome book
- local guide
- AI training
- troubleshooting
- house instructions
- property notes
- future AI memory

Primary JSONB field:

- properties.knowledge_base

Recommended structure:

- knowledge_base.guest_page
- knowledge_base.welcome_book
- knowledge_base.local_guide
- knowledge_base.ai_training

---

## Environment Variables

Local environment file:

- .env.local

Important variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- OPENAI_MODEL
- NEXT_PUBLIC_AUTH_ENABLED
- NEXT_PUBLIC_ADMIN_EMAIL
- NEXT_PUBLIC_ADMIN_PASSWORD
- NEXT_PUBLIC_APP_URL

Expected default model:

- gpt-4.1-mini

Important notes:

- Do not commit .env.local.
- Do not expose service role keys in client components.
- Do not share screenshots of .env.local.
- OpenAI key may need regeneration or verification.
- Vercel deployment requires production environment variables.

---

## Local Development

Install dependencies:

- npm install

Run development server:

- npm run dev

Local base URL:

- http://localhost:3000

Main local URLs:

- http://localhost:3000/dashboard
- http://localhost:3000/dashboard/property/[id]
- http://localhost:3000/dashboard/qr
- http://localhost:3000/guest/maltese-maisonette
- http://localhost:3000/dashboard/inbox
- http://localhost:3000/dashboard/issues
- http://localhost:3000/dashboard/notifications
- http://localhost:3000/dashboard/cleaning
- http://localhost:3000/dashboard/cleaning/mobile
- http://localhost:3000/dashboard/billing
- http://localhost:3000/login
- http://localhost:3000/logout

---

## Validation Commands

TypeScript check:

- npx tsc --noEmit --pretty false

Build:

- rm -rf .next
- npm run build -- --webpack

Lint:

- npm run lint

Git status:

- git status --short

Clean auto-generated Next file if needed:

- git restore next-env.d.ts

Expected clean Git state:

- nothing to commit, working tree clean

---

## Current Known Issues / Pending Items

### OpenAI Key

OpenAI integration exists, but the API key must be valid for real AI replies.

If the key is invalid, logs may show:

- invalid_api_key

Fallback replies keep the app usable locally.

---

### Supabase Schema

Some Supabase columns were manually aligned during local testing.

A proper migration should be created before production deployment.

Priority:

- high before production deployment

---

### Vercel Deployment

Deployment is required for:

- real QR testing
- NFC testing
- phone-based guest flow
- WiFi Porter validation
- private demo sharing

---

### Security

Auth is currently MVP-level.

Before beta/production:

- review auth
- review RLS
- review service role usage
- review public/private routes
- review guest page data exposure
- review sensitive access handling

---

### SaaS Readiness

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

## Development Rules

To avoid regressions:

- avoid partial edits on long files
- prefer full-file replacement for large components
- test TypeScript after each block
- run build after meaningful changes
- commit after each stable block
- keep Git clean before moving to the next block
- do not mix multiple unrelated changes in one block
- do not commit next-env.d.ts if it changes automatically
- keep README and ARCHITECTURE aligned

---

## Current Branch

Current branch:

- ai-cohost-v2

GitHub status should remain clean before starting new work:

- nothing to commit, working tree clean

---

## Recommended Next Steps

Next practical steps:

1. Final end-to-end QA
2. Supabase schema stabilization
3. OpenAI key verification
4. Vercel deployment
5. Real QR/NFC WiFi Porter test
6. Security and beta readiness review

Recommended next session:

Start with Final End-to-End QA, then move to Supabase schema stabilization.

---

## Summary

AI Co-Host is currently a working MVP with:

- property dashboard
- property control panel
- guest page
- welcome book
- stay essentials
- AI Concierge
- guest AI guardrails
- fallback AI replies
- host inbox
- issues/escalations
- notifications
- QR/NFC guest access
- cleaning dashboard
- cleaner mobile view
- login/logout flow

The next major focus should be stabilization, deployment and real-world QR/NFC testing.