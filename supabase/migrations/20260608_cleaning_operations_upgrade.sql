-- AI CO-HOST — Cleaning Operations Upgrade
-- Adds operational fields required for manual cleaner assignment,
-- time tracking, pay calculation, and turnover overview.

alter table public.cleaning_tasks
add column if not exists checkout_date date;

alter table public.cleaning_tasks
add column if not exists next_checkin_date date;

alter table public.cleaning_tasks
add column if not exists next_checkin_time text;

alter table public.cleaning_tasks
add column if not exists planned_start_time text;

alter table public.cleaning_tasks
add column if not exists planned_end_time text;

alter table public.cleaning_tasks
add column if not exists actual_start_time text;

alter table public.cleaning_tasks
add column if not exists actual_end_time text;

alter table public.cleaning_tasks
add column if not exists hourly_rate numeric default 0;

alter table public.cleaning_tasks
add column if not exists extra_fee numeric default 0;

alter table public.cleaning_tasks
add column if not exists currency text default 'EUR';

alter table public.cleaning_tasks
add column if not exists updated_at timestamptz default now();

create index if not exists cleaning_tasks_checkout_date_idx
on public.cleaning_tasks (checkout_date);

create index if not exists cleaning_tasks_next_checkin_date_idx
on public.cleaning_tasks (next_checkin_date);

create index if not exists cleaning_tasks_cleaner_name_idx
on public.cleaning_tasks (cleaner_name);

-- Compatibility fields used by the cleaning dashboard and cleaner mobile workflow.
alter table public.cleaning_tasks
add column if not exists cleaner_contact text;

alter table public.cleaning_tasks
add column if not exists cleaner_name text;

alter table public.cleaning_tasks
add column if not exists priority text default 'normal';

alter table public.cleaning_tasks
add column if not exists assigned_at timestamptz;

alter table public.cleaning_tasks
add column if not exists started_at timestamptz;

alter table public.cleaning_tasks
add column if not exists completed_at timestamptz;
