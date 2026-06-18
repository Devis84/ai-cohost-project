 cat > README.md <<'EOF'
# AI Co-Host

AI Co-Host is an AI-powered hospitality operations platform for Airbnb hosts, short-term rental operators, small property managers, and boutique hospitality businesses.

The platform combines a host dashboard, AI Concierge, guest welcome pages, digital welcome books, QR/NFC guest access, WiFi Porter integration, host inbox, issue tracking, notifications, cleaning operations, and billing foundations in one centralized system.

The current project is a working MVP intended for local development, technical review, real guest-flow testing, and future private beta preparation.

---

## Product Vision

AI Co-Host is designed to become a lightweight AI operating system for small hospitality operators.

The goal is simple:

Host configures the property once
-> Guest scans a QR code or taps an NFC tag
-> Guest opens a premium mobile guest page
-> Guest sees WiFi, welcome book, house rules, local guide and stay essentials
-> Guest can ask the AI Concierge
-> Host sees conversations, issues, notifications and cleaning tasks

The MVP focuses on proving this end-to-end experience before expanding into full SaaS features.

---

## Current MVP Status

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

Estimated readiness:

- Local MVP testable: 85-90%
- Private demo readiness: 70-75%
- Private beta readiness: 60-65%
- Commercial SaaS readiness: 30-35%

The product is not ready for commercial SaaS release yet, but it is strong enough for realistic MVP demos and controlled guest-flow testing.

---

## Core Demo Flow

Recommended demo flow:

1. Open /dashboard
2. Select or edit a property
3. Review the Property Control Panel
4. Review Guest Page, Welcome Book and AI Training sections
5. Open /dashboard/qr
6. Copy or open the guest page URL
7. Open the guest page on mobile
8. View WiFi, arrival info, house rules, local guide and stay essentials
9. Ask the AI Concierge a stay-related question
10. Trigger an issue with a guest problem message
11. Review /dashboard/inbox
12. Review /dashboard/issues
13. Review /dashboard/notifications
14. Review /dashboard/cleaning
15. Review /dashboard/cleaning/mobile

Main local routes:

- http://localhost:3000/dashboard
- http://localhost:3000/dashboard/property/[id]
- http://localhost:3000/dashboard/qr
- http://localhost:3000/dashboard/inbox
- http://localhost:3000/dashboard/issues
- http://localhost:3000/dashboard/notifications
- http://localhost:3000/dashboard/cleaning
- http://localhost:3000/dashboard/cleaning/mobile
- http://localhost:3000/dashboard/billing
- http://localhost:3000/guest/maltese-maisonette
- http://localhost:3000/login
- http://localhost:3000/logout

Production demo route example:

- https://ai-cohost-project.vercel.app/guest/maltese-maisonette

---

## Guest Page

Each property can have a public guest page based on its slug.

Example:

- /guest/maltese-maisonette

The guest page is designed to be mobile-first, premium, simple and useful for real guests.

Current guest page includes:

- Hero section with property image
- Property intro
- Highlights
- WiFi card
- Copy WiFi button
- Check-in information
- Checkout information
- Arrival section
- Map link
- Emergency section
- Arrival instructions
- About this stay
- Stay Essentials
- Kitchen section
- Washing Machine section
- Towels & Linen section
- Beach Towels section
- Trash & Recycling section
- AC section
- Hot Water / Boiler section
- House Rules
- Amenities
- Parking
- Restaurants & Bars
- Transport
- Local Guide
- Checkout Notes
- Extra Services / Notes
- Embedded AI Concierge
- Mobile bottom navigation

Important security rule:

The public guest page must never display private lockbox codes, door codes or access codes.

---

## AI Concierge

The AI Concierge is property-aware and guest-scope restricted.

It can answer questions about:

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
- guest support
- stay-related issues

It should not answer unrelated general-purpose requests.

Blocked or restricted topics include:

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
- general homework or unrelated tasks

Sensitive access behavior:

Guest asks: What is the lockbox code?

Expected result:
The AI refuses to show the private access code on the public guest page.
It tells the guest to check the private host message or contact the host directly.
It can also flag the request for host attention.

Allowed behavior:

Guest asks: What is the WiFi password?

Expected result:
The AI answers using the property WiFi details.

Issue behavior:

Guest says: The hot water is not working.

Expected result:
The AI acknowledges the issue, asks for useful details if needed, and the system can flag the conversation or issue for host attention.

---

## Host Dashboard

Main route:

- /dashboard

Current dashboard includes:

- Command Center
- Property selector
- Property overview
- Property setup status
- Guest page quick actions
- QR/NFC quick actions
- Inbox link
- Issues link
- Notifications link
- Cleaning link
- Billing link
- Logout
- Property creation
- Property deletion
- Module toggles

The dashboard is the host operational control center.

---

## Property Control Panel

Route pattern:

- /dashboard/property/[id]

Current property control panel includes:

- Property overview
- Setup health
- Guest page status
- Access information status
- Welcome book status
- AI Concierge status
- Quick actions
- Open Guest Page
- Copy WiFi
- QR/NFC link
- Inbox link
- Issues link
- Cleaning link
- Property editing sections
- Guest Page editor
- Welcome Book editor
- Local Guide editor
- AI Training editor

---

## Guest Access QR/NFC

Route:

- /dashboard/qr

The QR/NFC module creates the physical access layer for the guest experience.

Current capabilities:

- Property selection
- Guest page URL generation
- NFC-ready URL generation
- Copy guest link
- Copy NFC link
- Open guest page
- Main guest welcome page QR
- Optional direct WiFi QR
- Download guest QR
- Download WiFi QR
- WiFi Porter / welcome card preview
- Usage guidance for printed cards, stickers, NFC tags and guest messages

Main intended use:

Printed card / sticker / NFC tag
-> guest opens welcome page
-> guest gets WiFi + welcome book + AI Concierge

Important note:

Do not write localhost URLs to real NFC tags.
Do not print localhost QR codes as final QR codes.
Use the final deployed public URL.

---

## Host Inbox

Route:

- /dashboard/inbox

Current capabilities:

- Guest conversation list
- Conversation preview
- Unread tracking
- Priority display
- Host attention state
- Guest/AI message history
- Conversation status
- Property name enrichment

The inbox is connected to the AI Concierge and receives guest portal messages.

---

## Issues / Escalations

Route:

- /dashboard/issues

Current capabilities:

- Issue list
- Issue priority
- Issue status
- Property name enrichment
- Guest issue creation from AI escalation
- Resolve issue flow
- Host-facing issue dashboard

Examples of issue-triggering messages:

- The hot water is not working.
- I cannot enter the apartment.
- The lockbox is broken.
- There is a leak.
- The power is not working.
- There are insects in the apartment.

---

## Notifications

Route:

- /dashboard/notifications

Current capabilities:

- Host notification center
- Issue alerts
- Escalation alerts
- Priority-based notification foundation
- Read/unread foundation

---

## Cleaning Operations

Routes:

- /dashboard/cleaning
- /dashboard/cleaning/mobile

Current capabilities:

- Host cleaning dashboard
- Cleaner mobile interface
- Cleaning task list
- Cleaning task status
- Checklist management
- Bathroom / kitchen / bedroom / trash / towels / final check checklist
- Warning before completing without final check
- Cleaner-friendly mobile workflow

Future work:

- Cleaner accounts
- Cleaner permissions
- Cleaner notifications
- Photo uploads
- Task assignment
- Calendar-based turnover creation

---

## Authentication

Current authentication is MVP-level.

Routes:

- /login
- /logout
- /api/logout

Current capabilities:

- Basic login route
- Logout route
- Auth ON/OFF feature flag
- Protected dashboard routes when auth is enabled
- Cookie-based MVP session control

Auth flag:

NEXT_PUBLIC_AUTH_ENABLED="false"

Expected behavior:

NEXT_PUBLIC_AUTH_ENABLED="false"
-> dashboard opens without login

NEXT_PUBLIC_AUTH_ENABLED="true"
-> dashboard redirects to /login?redirect=/dashboard
-> login accepts credentials from .env.local

Important note:

This is not production-grade SaaS authentication.
Real auth must be implemented before commercial release.

---

## Billing Foundations

Route:

- /dashboard/billing

Current status:

- Billing route exists
- Subscription-ready architecture planned
- Stripe not implemented yet
- Commercial billing not active yet

---

## Tech Stack

Frontend:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS

Backend:

- Next.js API Routes
- Supabase
- OpenAI API

Database:

- Supabase PostgreSQL

AI:

- OpenAI model configurable through OPENAI_MODEL
- Expected default: gpt-4.1-mini
- Dynamic prompt builder
- Property knowledge-base architecture
- Local fallback logic
- Guest scope protection
- Sensitive access protection

---

## Environment Variables

Create .env.local.

Required variables:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

NEXT_PUBLIC_AUTH_ENABLED="false"
NEXT_PUBLIC_ADMIN_EMAIL=
NEXT_PUBLIC_ADMIN_PASSWORD=

NEXT_PUBLIC_APP_URL=http://localhost:3000

Optional future variables:

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

Important notes:

- Do not commit .env.local.
- Do not expose SUPABASE_SERVICE_ROLE_KEY in client-side code.
- Avoid sharing screenshots containing environment variables.
- The OpenAI API key must be valid for real AI replies.
- Fallback replies keep the app usable if OpenAI is unavailable.
- Vercel deployment requires production environment variables.

---

## Development

Install dependencies:

npm install

Run development server:

npm run dev

Open:

http://localhost:3000

Validation commands:

npx tsc --noEmit --pretty false
rm -rf .next
npm run build -- --webpack
npm run lint
git status

Clean auto-generated Next file if needed:

git restore next-env.d.ts

Expected clean Git state:

nothing to commit, working tree clean

---

## Current Project Structure

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
│   │   ├── property/
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
│   └── guest-images/
│
├── middleware.ts
├── README.md
├── ROADMAP.md
└── ARCHITECTURE.md

---

## Main API Routes

Property API:

- GET /api/properties
- POST /api/properties
- GET /api/properties/[identifier]
- DELETE /api/properties/[identifier]

Chat API:

- POST /api/chat

Conversation API:

- GET /api/all-conversations
- GET /api/conversations
- PATCH /api/conversations
- PATCH /api/conversations/read

Issues API:

- GET /api/issues
- POST /api/issues/resolve

Logout API:

- GET /api/logout
- POST /api/logout

---

## Chat API Responsibilities

The chat API currently handles:

- receive guest message
- find property
- create/find conversation
- save guest message
- detect escalation
- check guest portal scope
- block sensitive access requests
- generate OpenAI or fallback reply
- sanitize guest portal replies
- save assistant message
- update conversation preview
- create issue/notification if needed

---

## Main Database Tables

Current main Supabase tables:

- properties
- conversations
- messages
- issues
- notifications
- cleaning_tasks

---

## properties

Used for:

- property dashboard
- property control panel
- guest page
- QR/NFC guest access
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

## conversations

Used for:

- conversation previews
- inbox
- unread counts
- priority/host attention status

Important fields:

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

## messages

Used for:

- guest messages
- AI messages
- conversation history

Important fields:

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

The code currently supports both content and message.
This should be standardized in a future schema cleanup.

---

## issues

Used for:

- guest issues
- escalations
- host operations dashboard

Important fields:

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

## notifications

Used for:

- host notifications
- issue alerts
- escalation alerts

Important fields:

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

## cleaning_tasks

Used for:

- cleaning dashboard
- cleaner mobile page
- turnover tasks
- checklist tracking

Important fields:

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

---

## Useful Local Test Flow

Start local dev server:

npm run dev

Open dashboard:

http://localhost:3000/dashboard

Open guest page:

http://localhost:3000/guest/maltese-maisonette

Test AI Concierge:

- What is the WiFi password?
- How do I check in?
- Where can I park?
- What is the lockbox code?
- The hot water is not working.
- Dove posso parcheggiare?
- Vorrei il codice della porta.

Expected results:

- WiFi answers correctly
- Check-in answers with general information
- Parking answers from property data
- Lockbox/access code is blocked
- Hot water issue is escalated/flagged
- Italian questions receive Italian answers
- Private access codes are never displayed

Then verify:

- /dashboard/inbox
- /dashboard/issues
- /dashboard/notifications

---

## Production Checklist

Before production or real beta usage:

- Regenerate/verify OpenAI API key
- Create proper Supabase migrations
- Review Supabase schema
- Enable and review RLS
- Configure grants and policies
- Verify service role key is server-side only
- Review API route protection
- Configure real auth
- Configure Vercel environment variables
- Deploy to Vercel
- Test public guest page
- Test QR/NFC from real phone
- Test escalation pipeline
- Review guest data exposure
- Configure Stripe before commercial launch
- Add monitoring/logging
- Run security review

---

## Current Known Issues / Pending Items

### OpenAI API Key

The OpenAI integration exists, but the API key must be valid for real AI replies.

If the key is invalid, logs may show:

invalid_api_key

Fallback replies keep the app usable locally.

### Supabase Schema

Some schema changes were manually aligned during local stabilization.

A proper migration should be created before production deployment.

Priority: high before production deployment.

### Vercel Deployment

Public deployment is required for:

- real QR testing
- NFC testing
- phone-based guest flow
- WiFi Porter validation
- private demo sharing

### Security

Auth is currently MVP-level.

Before beta/production:

- review auth
- review RLS
- review service role usage
- review public/private routes
- review guest data exposure
- review sensitive access handling

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

## Future Development

Planned future work:

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
- QR/NFC WiFi Porter rollout

---

## Strategic Next Blocks

### Block 8A - Final End-to-End QA

Goal:

Run a full guest-to-host test across dashboard, guest page, AI, inbox, issues, notifications, cleaning and QR/NFC.

### Block 8B - Supabase Schema Stabilization

Goal:

Create a stable database schema and migration plan.

### Block 8C - Vercel Deployment

Goal:

Deploy a private public demo.

### Block 8D - Real QR/NFC WiFi Porter Test

Goal:

Test QR/NFC access with a public URL from a real phone.

### Block 8E - Security & Beta Readiness Review

Goal:

Prepare the MVP for safe private beta usage.

---

## License

Private internal project.
EOF