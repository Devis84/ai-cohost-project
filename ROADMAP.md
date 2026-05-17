# AI Co-Host Roadmap

## Vision

AI Co-Host is evolving from a simple AI guest assistant into a full operational SaaS platform for short-term rentals, boutique hospitality and remote property management.

The long-term goal is to centralize:
- Guest communication
- AI concierge
- Cleaning operations
- Notifications
- Property knowledge
- Staff workflows
- Billing
- Multi-property management

inside one modern AI-first platform.

---

# Current Architecture

## Frontend
- Next.js App Router
- Tailwind UI
- Dashboard-based architecture
- Modular pages

## Backend
- Next.js API routes
- OpenAI integration
- Supabase database
- Supabase storage
- Supabase auth foundation

## AI System
- GPT-4o-mini
- Prompt builder architecture
- Knowledge-base driven AI
- Escalation detection layer
- AI operational memory

---

# Completed Features

## Core Platform
- Property Dashboard
- Property CRUD
- Multi-property structure
- Property slugs
- Dashboard navigation
- Module toggles

## Guest Experience
- AI Concierge
- Guest chat
- Welcome Book
- Check-in generator
- WiFi copy
- Local guide system
- AI training section

## AI System
- Dynamic prompt builder
- Knowledge-base injection
- Conversation memory
- AI escalation detection
- Issue categorization
- Priority classification
- Notifications generation

## Inbox System
- Host inbox
- Conversation history
- Unread system
- Last sender detection
- Priority badges
- Attention filtering
- Conversation grouping by property

## Cleaning System
- Cleaning dashboard
- Cleaner mobile page
- Cleaning checklist
- Cleaning status updates
- Cleaning notes

## Billing Foundations
- Billing dashboard UI
- Subscription architecture foundation

## Auth Foundations
- Auth ON/OFF environment system
- Dashboard protection foundation
- Login redirect structure

---

# Database Philosophy

## IMPORTANT

Avoid creating endless Supabase columns.

The platform architecture should remain:
- modular
- scalable
- AI-friendly
- schema-light

## Use Direct Columns ONLY For:
- ids
- slugs
- timestamps
- ownership
- statuses
- priorities
- feature toggles
- relational references

## Use JSONB For:
- welcome books
- AI training
- local guides
- troubleshooting
- property notes
- house instructions
- dynamic operational data
- future AI memory

---

# Current Main Tables

## properties
Core property data.

Contains:
- property info
- toggles
- knowledge base
- operational settings

## conversations
Fast inbox layer.

Used for:
- inbox preview
- unread system
- latest message
- filtering

## messages
Full conversation history.

Used for:
- AI memory
- chat history
- escalation storage

## notifications
Operational alerts.

Used for:
- escalations
- host attention
- future push systems

## cleaning_tasks
Cleaning workflow system.

## local_tips
Structured local recommendations.

---

# Current AI Escalation System

## High Priority Detection
Triggers on:
- fire
- gas
- leak
- flood
- unsafe situations
- emergency language
- lockout situations

## Medium Priority Detection
Triggers on:
- refund requests
- complaints
- dirtiness
- mold
- noise
- broken items
- guest dissatisfaction

## Outputs
AI automatically stores:
- priority
- requires_host
- issue_detected

inside:
- messages
- conversations
- notifications

---

# Current API Architecture

## Stable APIs

### Chat
- `/api/chat`

### Inbox
- `/api/all-conversations`
- `/api/conversations`

### Notifications
- `/api/notifications`

### Cleaning
- `/api/cleaning`
- `/api/update-cleaning-task`

### Local Tips
- `/api/local-tips`

---

# APIs To Review

## Merge / Refactor
- `/api/get-tips`
- `/api/generate-tips`
- `/api/update-issue`

## Possible Removal
- deprecated test routes
- duplicated endpoints

---

# Supabase Security Direction

## IMPORTANT

Every new table must include:
- explicit grants
- RLS
- policies

before production rollout.

Future production checklist:
- grants
- indexes
- RLS
- ownership validation
- authenticated role separation

---

# Immediate Stabilization Phase

## Priority
DO NOT add too many new modules before stabilization.

Current focus:
- architecture consistency
- auth testing
- database stability
- API cleanup
- production readiness

---

# Immediate Testing Checklist

## Auth
- auth OFF
- auth ON
- protected routes
- redirect logic

## Chat
- guest chat
- AI replies
- memory persistence
- escalation detection

## Inbox
- unread counters
- filtering
- latest message
- priority system

## Cleaning
- task creation
- mobile checklist
- status updates

## Notifications
- escalation insertion
- notification rendering

---

# Next Major Features

## Inbox Evolution
- mark as read
- close conversation
- reopen conversation
- assign to staff
- archived chats
- internal notes
- host replies

## AI Evolution
- sentiment analysis
- confidence scoring
- refund-risk prediction
- hallucination reduction
- operational memory
- multilingual optimization

## Cleaning Evolution
- cleaner accounts
- automatic assignment
- checkout automation
- photo uploads
- overdue alerts
- calendar integration

## Billing Evolution
- Stripe checkout
- subscriptions
- plans
- feature gating
- invoices
- trials

## User System
- real auth
- organizations
- multi-user teams
- admin roles
- cleaners
- permission system

## Integrations
- WhatsApp
- Telegram
- Airbnb sync
- PMS integrations
- calendars
- booking systems

---

# Long-Term Product Direction

AI Co-Host should become:
- an AI operational system
- not just a chatbot

The AI should eventually:
- coordinate operations
- detect problems
- assist staff
- automate workflows
- reduce host workload
- centralize property operations

---

# Immediate Next Session

## If Connection Is Stable
1. Test auth ON/OFF
2. Test chat flow
3. Test inbox flow
4. Test notifications
5. Test cleaning module
6. Check production build

## If Connection Is Unstable
1. Continue architecture cleanup
2. Improve backend consistency
3. Refactor APIs
4. Prepare Stripe architecture
5. Prepare role system
6. Improve documentation