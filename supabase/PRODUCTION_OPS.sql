-- Production ops (Village Ride) — admin monitoring, analytics, applications
-- Run in Supabase SQL editor after PARTNER_SYSTEM.sql

-- Error logs
create table if not exists public.rr_error_logs (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  stack text,
  context text,
  user_id uuid references auth.users (id) on delete set null,
  url text,
  severity text not null default 'error',
  fixed boolean not null default false,
  fixed_at timestamptz,
  fixed_by text,
  created_at timestamptz not null default now(),
  constraint rr_error_logs_severity_check check (
    severity in ('info', 'warning', 'error', 'critical')
  )
);

create index if not exists rr_error_logs_created_idx
  on public.rr_error_logs (created_at desc);
create index if not exists rr_error_logs_unfixed_idx
  on public.rr_error_logs (created_at desc)
  where fixed = false;

-- Analytics
create table if not exists public.rr_analytics_page_views (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  user_id uuid references auth.users (id) on delete set null,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists rr_analytics_page_views_created_idx
  on public.rr_analytics_page_views (created_at desc);
create index if not exists rr_analytics_page_views_page_idx
  on public.rr_analytics_page_views (page, created_at desc);

create table if not exists public.rr_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  data jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists rr_analytics_events_created_idx
  on public.rr_analytics_events (created_at desc);
create index if not exists rr_analytics_events_event_idx
  on public.rr_analytics_events (event, created_at desc);

-- Driver recruitment applications (public /driver/join)
create table if not exists public.rr_driver_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text not null,
  vehicle_type text not null default 'bakkie',
  area text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint rr_driver_applications_status_check check (
    status in ('pending', 'contacted', 'hired', 'rejected')
  ),
  constraint rr_driver_applications_vehicle_check check (
    vehicle_type in ('sedan', 'bakkie', 'truck')
  )
);

create index if not exists rr_driver_applications_status_idx
  on public.rr_driver_applications (status, created_at desc);

-- Driver order rejections (cascade tracking)
create table if not exists public.rr_driver_rejections (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.rr_jobs (id) on delete cascade,
  driver_id uuid not null references public.rr_drivers (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists rr_driver_rejections_job_idx
  on public.rr_driver_rejections (job_id, created_at desc);

-- Merchant cancel reason on jobs
alter table public.rr_jobs
  add column if not exists cancel_reason text;

alter table public.rr_jobs
  add column if not exists cancelled_by text;

alter table public.rr_jobs
  add column if not exists cancelled_at timestamptz;

-- RLS
alter table public.rr_error_logs enable row level security;
alter table public.rr_analytics_page_views enable row level security;
alter table public.rr_analytics_events enable row level security;
alter table public.rr_driver_applications enable row level security;
alter table public.rr_driver_rejections enable row level security;

-- Service role / admin clients bypass RLS; allow authenticated admins to read
drop policy if exists "rr_error_logs_admin" on public.rr_error_logs;
create policy "rr_error_logs_admin" on public.rr_error_logs
  for all using (
    exists (
      select 1 from public.rr_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'dispatcher')
    )
  );

drop policy if exists "rr_analytics_page_views_admin" on public.rr_analytics_page_views;
create policy "rr_analytics_page_views_admin" on public.rr_analytics_page_views
  for select using (
    exists (
      select 1 from public.rr_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'dispatcher')
    )
  );

drop policy if exists "rr_analytics_events_admin" on public.rr_analytics_events;
create policy "rr_analytics_events_admin" on public.rr_analytics_events
  for select using (
    exists (
      select 1 from public.rr_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'dispatcher')
    )
  );

-- Anyone can insert applications (signup); only admin reads
drop policy if exists "rr_driver_applications_insert" on public.rr_driver_applications;
create policy "rr_driver_applications_insert" on public.rr_driver_applications
  for insert with check (true);

drop policy if exists "rr_driver_applications_admin" on public.rr_driver_applications;
create policy "rr_driver_applications_admin" on public.rr_driver_applications
  for select using (
    exists (
      select 1 from public.rr_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'dispatcher')
    )
  );

drop policy if exists "rr_driver_rejections_admin" on public.rr_driver_rejections;
create policy "rr_driver_rejections_admin" on public.rr_driver_rejections
  for select using (
    exists (
      select 1 from public.rr_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'dispatcher')
    )
  );

-- Email audit trail (webhook / mailto attempts)
create table if not exists public.rr_email_logs (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text,
  template text,
  via text not null default 'webhook',
  sent_at timestamptz not null default now()
);

create index if not exists rr_email_logs_sent_idx
  on public.rr_email_logs (sent_at desc);

alter table public.rr_email_logs enable row level security;

drop policy if exists "rr_email_logs_admin" on public.rr_email_logs;
create policy "rr_email_logs_admin" on public.rr_email_logs
  for select using (
    exists (
      select 1 from public.rr_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'dispatcher')
    )
  );

comment on table public.rr_email_logs is 'Partner/ops email send attempts (webhook or log-only)';
