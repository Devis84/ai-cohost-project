
-- AI CO-HOST — Supabase Schema Stabilization Migration

-- Date: 2026-06-07

-- Purpose: stabilize the MVP Supabase schema.

-- Safe/idempotent: creates missing tables, adds missing columns, indexes, and normalizes defaults.

-- Does NOT drop or rename existing columns.

create extension if not exists pgcrypto;

create table if not exists public.properties (

  id uuid primary key default gen_random_uuid()

);

alter table public.properties

add column if not exists property_name text,

add column if not exists name text,

add column if not exists slug text,

add column if not exists city text,

add column if not exists country text,

add column if not exists address text,

add column if not exists wifi_name text,

add column if not exists wifi_password text,

add column if not exists checkin_time text,

add column if not exists checkout_time text,

add column if not exists checkin_instructions text,

add column if not exists loadd column if not exists loadd column if not exists loadd column if not exismn add column if not exists loadd column if not exists loads dadd column if not addadd column if not exists loadd column if not lumadd column if not exists loadd column if not exists loadd column if not exists loadd column if notxists emergency_info text,

add column if not exists ai_knowledge text,

add column if not exists knowledge_base jsonb default '{}'::jsonb,

add column if not exists ai_enabled boolean defaultadd column if not exists ai_istadd column if not exists ai_enabled bool,

add column if not exists telegram_enabled boolean default false,

add column add column add column add column abooadd column add column add column  not exadd column add column add column add  faadd column add column add column add coat add column add column add column add colu not add column add column add column add colum);

update public.properties

set

  property_name = coalesce(property_name, name, 'Untitled property'  property_name = coalesce(property_name, name, 'Untitled property'  property_name = coalesce(property_name, name, 'Untitled property'  property_name = coalesce(property_name, name, 'Untitled property'  property_name = coalesce(property_name, name, 'Untitled property'  property_name = coalesce(property_name, name, 'Untitled property'  property_name = coalenabled = coalesce(ai_enabled, true),

  whatsap  whatsap  whatsap  whatsap  whatsap  whatsap  whatsap  whatsap  d = coalesce(telegram_enabled, false),

  welcomebook_enabled = coalesce(welcomebook_enabled, true),

  cleaning_enabled = coale  cleaning_enabled = coale  cleaning_enabled = coale  cleaning_at,  cleaning_enabled = coale  cleaning_enabled = coale  cleaning_enabled = coale  cleaning_at,  cleaning_enabled = coale  cleaning_enabled = coale  cleaning_enabled = coas_property_name_idx on public.properties (property_name);

create table if not exists public.ccreate table (

  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid   ima  id uuid olean default false,

add column if not exists issue_detected text,

add column if not exists unread_count integer deadd column if not exists unread_count integer deadd column f not exists message text,

add column if not exists last_sender text,

add column if not exists last_message text,

add column if not exists last_message_at timestamptz,

add column if not exists created_at timestamptz default now(),

add column if not exists updated_at timestamptz default now();

update public.conversations

set

  conversation_id = coalesce(conversation_id, id::text),

  channel = coalesce(channel, 'web'),

  status = coalesce(status, 'open'),

  priority = coalesce(priority, 'normal'),

  requires_host = coalesce(requires_host, false),

  unread_count = coalesce(unread_count, 0),

  last_sender = coalesce(last_sender, role),

  last_message = coalesce(last_message, message),

  created_at = coalesce(created_at, now()),

  updated_at = coalesce(updated_at, now()),

  last_message_at = coalesce(last_message_at, created_at, updated_at, now());

create index if not exists conversations_ccreate index if not exists conversations_ccreate index if not exists conversations_ccreate index if not exists conversations_ccreatenvecreate index if not exists conversations_notcreate index if not exists conversations_con public.conversations (last_message_at desc);

create tacreate tacreate tacreate tacreate tacreate tacreate tacreatdefault gen_random_uuid()

);

alter table public.messages

add column if not exists message_id text,


dd column if not exists message_id text,
 tacreate tacumn if not exists property_id uuid,

add column if not exists role text default 'user',

add column if not exists content text,

add column if not exists message text,

add coadd coadd coadd coadd coadd coadd coadd coeb',

add column if not exists priority text default 'normal',

add column if not exists requires_host boolean default false,

add column if not exists issue_detected text,

add column if noadd column if noadd column if noadd column if noadd column if noadd column iateadd column if noadd column if noadd column if noadd column if noadd column if noadd column iateadd column if noadd column if noadd column if noadd column if noadd column if noadd column iateadd column if noadd column if noadd column if noadd column if noadd column if noadd column iateadd column if noadd columaladd column if noadd column if noadd column if noadd column if noadd column if noadd cod_at, now()),add column if noadd columnupdadd column if noadd column if noadd coexistsadd column if noadd column if noadd col.madd column if noadd column if noadd column if t exadd column if noadd column if noadd column if noa(pradd column if noadd column if noadd cts messages_created_at_idx on public.messagadd column if noadd column if noadd column if noadc.issues (

  id uuid primary key default gen_random_uuid()

))))))))))))))))))))))))))))))))))))))))))))))))))))))))))operty))))))))))))))))))))))))))))))))))))))))))))tion_id text,

add column if not exists guest_name text,

add column if not exists issue_type text,

add column if not exists priority text default 'normal',

add column if not exists severity text,

add column if not exists status text default 'open',

add column if not exists message text,

add column if not exists description text,

add column if not exists created_at timestamptz default now(),

add column if not exists updated_at timestamptz default now();

update public.issues

set

  priority = coalesce(priority, severity, 'normal'),

  severity = coalesce(severity, priority, 'normal'),

  status = coalesce(status, 'open'),

  description = coalesce(description, message, 'No description provided.'),

  message = coalesce(message, description, 'No description provided.'),

  created_at = coalesce(created_at, now()),

  updated_at = coalesce(updated_at, now());

create index if not exists issues_property_id_idx on public.issues (property_id);

create index if not exists issues_conversation_id_idx on public.issues (conversation_id);

create index if not exists issues_status_idx on public.issues (status);

create index if not exists issues_created_at_idx on public.issues (created_at desc);

create table if not exists public.notifications (

  id uuid prima  id uuid prima  id uuid prima  id uu
alter table public.notifications

add column if not exists property_id uuid,

add column if not exists conversadd column if not exists conversadd column if not exists convmn add column if not e text,

add column if not exists message text,

add column if not exists priority text default 'normal',

add column if not exists read boolean default faadd column if not exists read boolean default faadd column if not(),

add column if not exists updated_at timestamptz default now();

update public.noupdate public.noupdate public.noupdate pub'noupdate public.noupdate public.noupdate pubNotupdate public.noupdate public.noupdate public.noupdate pub'noupdate public.noupd, 'normal'),

  read = coalesce(read, false),

  created_at = coalesce(created_at, now()),

  updated_at = coalesce(updated_at, now());

create index if not exists notcreate index if not exists notcreate index if not exists notcreate index if not if not exists notifications_conversation_id_idx on public.notifications (conversation_id);

create index if not exists notifications_read_idx oncreate index if not exists notificati index create index if not exists notifications_read_idx oncreate index if not exists notificati index create index if not blic.clcreate index if not exists notificati decreate index if not exists notifications_read_idx eaning_tcreate index if not exists notifications_read_idx oncreate index if not exists notificati index create index if n exiscreate index if not exists notifications_read_idx oncreate ime text,

add column if not exists cleaner_name text,

add column if not exists status text default 'pending',

add column if not exists notes text,

add column if not exists checklist jsonb default '{}':add column if not existsot existsadd column if not exists checklist jsonb dd cadd column if not exists checklist jsonb d default now();

update public.cleaning_tasks

set

  status = coalesce(status, 'pending'),

  checklist = coalesce(checklist, '{}'::jsonb),

  created_at = coalesce(created_at, now()),

  updated_at = coalesce(updated_at, now());

create index if not exists cleaning_tasks_property_id_idx on public.cleaning_tasks (property_id);

create index if not exists cleaning_tasks_cleaning_date_idx on public.cleaning_tasks (cleaning_date);

create index if not exists cleaning_tasks_status_idx on public.cleaning_tasks (status);

