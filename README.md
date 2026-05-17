 # AI Co-Host

AI Co-Host is an AI-powered hospitality operations platform designed for short-term rentals, Airbnb hosts and boutique hospitality businesses.

The platform combines:
- AI concierge
- Guest communication
- Welcome books
- Cleaning operations
- Notifications
- Inbox management
- Operational AI workflows

inside one centralized dashboard.

---

# Core Features

## AI Concierge
- AI guest chat
- Property-aware responses
- Knowledge-base driven AI
- Operational memory
- Escalation detection
- Guest issue categorization

## Host Dashboard
- Multi-property management
- Property configuration
- Welcome book editor
- AI training interface
- Module management

## Inbox System
- Guest conversation inbox
- Unread tracking
- Priority detection
- Host attention system
- Conversation history

## Cleaning Operations
- Cleaning dashboard
- Cleaner mobile interface
- Checklist management
- Cleaning task tracking

## Notifications
- AI escalation alerts
- Host notification center
- Priority-based issue detection

## Billing Foundations
- Subscription-ready architecture
- Stripe-ready foundation

---

# Tech Stack

## Frontend
- Next.js App Router
- React
- Tailwind CSS

## Backend
- Next.js API Routes
- OpenAI API
- Supabase

## AI
- GPT-4o-mini
- Dynamic prompt builder
- Knowledge-base architecture

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

NEXT_PUBLIC_AUTH_ENABLED=false

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
```

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

---

# Current Project Structure

```txt
frontend/
├── app/
│   ├── api/
│   ├── dashboard/
│   ├── guest/
│   ├── login/
│   └── welcome/
│
├── components/
├── lib/
├── public/
├── middleware.ts
├── ROADMAP.md
└── ARCHITECTURE.md
```

---

# Current Status

Current platform includes:
- AI concierge
- Inbox system
- Escalation engine
- Cleaning management
- Notifications center
- Knowledge-base AI
- Multi-property structure

Platform is currently in active architecture and stabilization phase.

---

# Important Architecture Principles

## Keep Database Lean

Avoid creating endless database columns.

Use:
- direct columns for operational fields
- JSONB for flexible AI knowledge

## AI-First Architecture

The AI system should:
- understand property context
- detect operational problems
- escalate urgent situations
- reduce manual host workload

---

# Production Checklist

Before production:
- enable auth
- configure RLS
- configure grants
- review Supabase policies
- configure Stripe
- test escalation pipeline
- verify protected routes

---

# Future Development

Planned:
- real authentication
- Stripe subscriptions
- WhatsApp integration
- Telegram alerts
- cleaner accounts
- organization teams
- PMS integrations
- Airbnb sync
- AI operational workflows

---

# License

Private internal project.