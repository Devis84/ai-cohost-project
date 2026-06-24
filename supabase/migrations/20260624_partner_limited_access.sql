begin;

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null default 'partner',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_role_check check (
    role in ('admin', 'partner', 'viewer')
  )
);

create table if not exists public.user_property_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  access_role text not null default 'partner',
  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_create_property boolean not null default false,
  can_delete_property boolean not null default false,
  is_active boolean not null default true,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, property_id),
  constraint user_property_access_role_check check (
    access_role in ('owner', 'admin', 'partner', 'viewer')
  )
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete set null,
  user_email text,
  property_id uuid references public.properties(id) on delete set null,
  property_slug text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_email
on public.user_profiles (lower(email));

create index if not exists idx_user_profiles_role
on public.user_profiles (role);

create index if not exists idx_user_property_access_user_id
on public.user_property_access (user_id);

create index if not exists idx_user_property_access_property_id
on public.user_property_access (property_id);

create index if not exists idx_user_property_access_active
on public.user_property_access (is_active);

create index if not exists idx_audit_logs_user_id
on public.audit_logs (user_id);

create index if not exists idx_audit_logs_property_id
on public.audit_logs (property_id);

create index if not exists idx_audit_logs_property_slug
on public.audit_logs (property_slug);

create index if not exists idx_audit_logs_action
on public.audit_logs (action);

create index if not exists idx_audit_logs_created_at
on public.audit_logs (created_at desc);

insert into public.user_profiles (
  email,
  full_name,
  role,
  is_active,
  notes
)
values (
  lower('CHANGE_ME_ADMIN_EMAIL'),
  'AI Co-Host Admin',
  'admin',
  true,
  'Primary admin account with full platform visibility.'
)
on conflict (email)
do update set
  role = 'admin',
  is_active = true,
  updated_at = now(),
  notes = 'Primary admin account with full platform visibility.';

insert into public.user_profiles (
  email,
  full_name,
  role,
  is_active,
  notes
)
values (
  lower('CHANGE_ME_PARTNER_EMAIL'),
  'Tropikal Villas Partner',
  'partner',
  true,
  'Limited partner account for Indonesia Tropikal Villas test. Access must remain limited to Tropikal Villa 1-4.'
)
on conflict (email)
do update set
  role = 'partner',
  is_active = true,
  updated_at = now(),
  notes = 'Limited partner account for Indonesia Tropikal Villas test. Access must remain limited to Tropikal Villa 1-4.';

insert into public.properties (
  property_name,
  name,
  slug,
  city,
  country,
  knowledge_base
)
select
  'Tropikal Villa 1',
  'Tropikal Villa 1',
  'tropikal-villa-1',
  'Bali',
  'Indonesia',
  jsonb_build_object(
    'guest_page', jsonb_build_object(
      'hero_title', 'Welcome to Tropikal Villa 1',
      'hero_intro', 'A private villa stay in Indonesia. This guest hub will be completed by the partner during the test.',
      'about_title', 'About this stay',
      'about_intro', 'Tropikal Villa 1 is part of the Indonesia partner test property group.',
      'about_description', 'This property has been pre-created for the partner test. The partner will complete the guest information, welcome book, AI training, local guide and extra services.',
      'about_highlights', 'Partner test property
Guest Hub enabled
AI Concierge ready
Welcome Book to be completed'
    ),
    'welcome_book', jsonb_build_object(
      'description', 'To be completed by the partner.',
      'amenities', 'To be completed by the partner.',
      'house_rules', 'To be completed by the partner.',
      'apartment_instructions', 'To be completed by the partner.',
      'kitchen', 'To be completed by the partner.',
      'washing_machine', 'To be completed by the partner.',
      'towels_linen', 'To be completed by the partner.',
      'beach_towels', 'To be completed by the partner.',
      'parking', 'To be completed by the partner.',
      'trash', 'To be completed by the partner.',
      'ac', 'To be completed by the partner.',
      'boiler', 'To be completed by the partner.',
      'restaurants', 'To be completed by the partner.',
      'transport', 'To be completed by the partner.',
      'local_guide', 'To be completed by the partner.',
      'emergency', 'To be completed by the partner.',
      'checkout_notes', 'To be completed by the partner.',
      'extra_notes', 'To be completed by the partner.'
    ),
    'extra_services', jsonb_build_object(
      'enabled', true,
      'title', 'Extra Services',
      'intro', 'To be completed by the partner.',
      'services', 'To be completed by the partner.',
      'host_note', 'To be completed by the partner.'
    ),
    'ai_training', jsonb_build_object(
      'faq', 'To be completed by the partner.',
      'troubleshooting', 'To be completed by the partner.',
      'guest_style', 'Friendly, helpful, concise and hospitality-focused.',
      'hidden_notes', 'Partner test property. Do not reveal private access codes unless explicitly allowed by admin configuration.',
      'additional_notes', 'To be completed by the partner.'
    )
  )
where not exists (
  select 1
  from public.properties
  where slug = 'tropikal-villa-1'
);

insert into public.properties (
  property_name,
  name,
  slug,
  city,
  country,
  knowledge_base
)
select
  'Tropikal Villa 2',
  'Tropikal Villa 2',
  'tropikal-villa-2',
  'Bali',
  'Indonesia',
  jsonb_build_object(
    'guest_page', jsonb_build_object(
      'hero_title', 'Welcome to Tropikal Villa 2',
      'hero_intro', 'A private villa stay in Indonesia. This guest hub will be completed by the partner during the test.',
      'about_title', 'About this stay',
      'about_intro', 'Tropikal Villa 2 is part of the Indonesia partner test property group.',
      'about_description', 'This property has been pre-created for the partner test. The partner will complete the guest information, welcome book, AI training, local guide and extra services.',
      'about_highlights', 'Partner test property
Guest Hub enabled
AI Concierge ready
Welcome Book to be completed'
    ),
    'welcome_book', jsonb_build_object(
      'description', 'To be completed by the partner.',
      'amenities', 'To be completed by the partner.',
      'house_rules', 'To be completed by the partner.',
      'apartment_instructions', 'To be completed by the partner.',
      'kitchen', 'To be completed by the partner.',
      'washing_machine', 'To be completed by the partner.',
      'towels_linen', 'To be completed by the partner.',
      'beach_towels', 'To be completed by the partner.',
      'parking', 'To be completed by the partner.',
      'trash', 'To be completed by the partner.',
      'ac', 'To be completed by the partner.',
      'boiler', 'To be completed by the partner.',
      'restaurants', 'To be completed by the partner.',
      'transport', 'To be completed by the partner.',
      'local_guide', 'To be completed by the partner.',
      'emergency', 'To be completed by the partner.',
      'checkout_notes', 'To be completed by the partner.',
      'extra_notes', 'To be completed by the partner.'
    ),
    'extra_services', jsonb_build_object(
      'enabled', true,
      'title', 'Extra Services',
      'intro', 'To be completed by the partner.',
      'services', 'To be completed by the partner.',
      'host_note', 'To be completed by the partner.'
    ),
    'ai_training', jsonb_build_object(
      'faq', 'To be completed by the partner.',
      'troubleshooting', 'To be completed by the partner.',
      'guest_style', 'Friendly, helpful, concise and hospitality-focused.',
      'hidden_notes', 'Partner test property. Do not reveal private access codes unless explicitly allowed by admin configuration.',
      'additional_notes', 'To be completed by the partner.'
    )
  )
where not exists (
  select 1
  from public.properties
  where slug = 'tropikal-villa-2'
);

insert into public.properties (
  property_name,
  name,
  slug,
  city,
  country,
  knowledge_base
)
select
  'Tropikal Villa 3',
  'Tropikal Villa 3',
  'tropikal-villa-3',
  'Bali',
  'Indonesia',
  jsonb_build_object(
    'guest_page', jsonb_build_object(
      'hero_title', 'Welcome to Tropikal Villa 3',
      'hero_intro', 'A private villa stay in Indonesia. This guest hub will be completed by the partner during the test.',
      'about_title', 'About this stay',
      'about_intro', 'Tropikal Villa 3 is part of the Indonesia partner test property group.',
      'about_description', 'This property has been pre-created for the partner test. The partner will complete the guest information, welcome book, AI training, local guide and extra services.',
      'about_highlights', 'Partner test property
Guest Hub enabled
AI Concierge ready
Welcome Book to be completed'
    ),
    'welcome_book', jsonb_build_object(
      'description', 'To be completed by the partner.',
      'amenities', 'To be completed by the partner.',
      'house_rules', 'To be completed by the partner.',
      'apartment_instructions', 'To be completed by the partner.',
      'kitchen', 'To be completed by the partner.',
      'washing_machine', 'To be completed by the partner.',
      'towels_linen', 'To be completed by the partner.',
      'beach_towels', 'To be completed by the partner.',
      'parking', 'To be completed by the partner.',
      'trash', 'To be completed by the partner.',
      'ac', 'To be completed by the partner.',
      'boiler', 'To be completed by the partner.',
      'restaurants', 'To be completed by the partner.',
      'transport', 'To be completed by the partner.',
      'local_guide', 'To be completed by the partner.',
      'emergency', 'To be completed by the partner.',
      'checkout_notes', 'To be completed by the partner.',
      'extra_notes', 'To be completed by the partner.'
    ),
    'extra_services', jsonb_build_object(
      'enabled', true,
      'title', 'Extra Services',
      'intro', 'To be completed by the partner.',
      'services', 'To be completed by the partner.',
      'host_note', 'To be completed by the partner.'
    ),
    'ai_training', jsonb_build_object(
      'faq', 'To be completed by the partner.',
      'troubleshooting', 'To be completed by the partner.',
      'guest_style', 'Friendly, helpful, concise and hospitality-focused.',
      'hidden_notes', 'Partner test property. Do not reveal private access codes unless explicitly allowed by admin configuration.',
      'additional_notes', 'To be completed by the partner.'
    )
  )
where not exists (
  select 1
  from public.properties
  where slug = 'tropikal-villa-3'
);

insert into public.properties (
  property_name,
  name,
  slug,
  city,
  country,
  knowledge_base
)
select
  'Tropikal Villa 4',
  'Tropikal Villa 4',
  'tropikal-villa-4',
  'Bali',
  'Indonesia',
  jsonb_build_object(
    'guest_page', jsonb_build_object(
      'hero_title', 'Welcome to Tropikal Villa 4',
      'hero_intro', 'A private villa stay in Indonesia. This guest hub will be completed by the partner during the test.',
      'about_title', 'About this stay',
      'about_intro', 'Tropikal Villa 4 is part of the Indonesia partner test property group.',
      'about_description', 'This property has been pre-created for the partner test. The partner will complete the guest information, welcome book, AI training, local guide and extra services.',
      'about_highlights', 'Partner test property
Guest Hub enabled
AI Concierge ready
Welcome Book to be completed'
    ),
    'welcome_book', jsonb_build_object(
      'description', 'To be completed by the partner.',
      'amenities', 'To be completed by the partner.',
      'house_rules', 'To be completed by the partner.',
      'apartment_instructions', 'To be completed by the partner.',
      'kitchen', 'To be completed by the partner.',
      'washing_machine', 'To be completed by the partner.',
      'towels_linen', 'To be completed by the partner.',
      'beach_towels', 'To be completed by the partner.',
      'parking', 'To be completed by the partner.',
      'trash', 'To be completed by the partner.',
      'ac', 'To be completed by the partner.',
      'boiler', 'To be completed by the partner.',
      'restaurants', 'To be completed by the partner.',
      'transport', 'To be completed by the partner.',
      'local_guide', 'To be completed by the partner.',
      'emergency', 'To be completed by the partner.',
      'checkout_notes', 'To be completed by the partner.',
      'extra_notes', 'To be completed by the partner.'
    ),
    'extra_services', jsonb_build_object(
      'enabled', true,
      'title', 'Extra Services',
      'intro', 'To be completed by the partner.',
      'services', 'To be completed by the partner.',
      'host_note', 'To be completed by the partner.'
    ),
    'ai_training', jsonb_build_object(
      'faq', 'To be completed by the partner.',
      'troubleshooting', 'To be completed by the partner.',
      'guest_style', 'Friendly, helpful, concise and hospitality-focused.',
      'hidden_notes', 'Partner test property. Do not reveal private access codes unless explicitly allowed by admin configuration.',
      'additional_notes', 'To be completed by the partner.'
    )
  )
where not exists (
  select 1
  from public.properties
  where slug = 'tropikal-villa-4'
);

insert into public.user_property_access (
  user_id,
  property_id,
  access_role,
  can_view,
  can_edit,
  can_create_property,
  can_delete_property,
  is_active,
  notes
)
select
  partner.id,
  properties.id,
  'partner',
  true,
  true,
  false,
  false,
  true,
  'Partner can view and edit this assigned Tropikal Villa only. Partner cannot create or delete properties.'
from public.user_profiles partner
cross join public.properties properties
where partner.email = lower('CHANGE_ME_PARTNER_EMAIL')
  and properties.slug in (
    'tropikal-villa-1',
    'tropikal-villa-2',
    'tropikal-villa-3',
    'tropikal-villa-4'
  )
on conflict (user_id, property_id)
do update set
  access_role = 'partner',
  can_view = true,
  can_edit = true,
  can_create_property = false,
  can_delete_property = false,
  is_active = true,
  updated_at = now(),
  notes = 'Partner can view and edit this assigned Tropikal Villa only. Partner cannot create or delete properties.';

insert into public.audit_logs (
  user_email,
  action,
  entity_type,
  metadata
)
values (
  lower('CHANGE_ME_ADMIN_EMAIL'),
  'partner_access_foundation_created',
  'system',
  jsonb_build_object(
    'module', 'Partner / Limited Host Access',
    'partner_email', lower('CHANGE_ME_PARTNER_EMAIL'),
    'properties', jsonb_build_array(
      'tropikal-villa-1',
      'tropikal-villa-2',
      'tropikal-villa-3',
      'tropikal-villa-4'
    ),
    'permissions', jsonb_build_object(
      'can_view', true,
      'can_edit', true,
      'can_create_property', false,
      'can_delete_property', false
    )
  )
);

commit;