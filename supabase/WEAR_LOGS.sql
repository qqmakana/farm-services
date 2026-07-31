-- =============================================================================
-- Village Ride — "What You're Wearing" logs (optional playful stats)
-- Run in Supabase → SQL Editor after PASTE_ME.sql
-- =============================================================================

create table if not exists public.rr_rider_wear_logs (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid references auth.users (id) on delete set null,
  job_id uuid references public.rr_jobs (id) on delete set null,
  description text not null,
  brand text,
  country text,
  created_at timestamptz not null default now()
);

create index if not exists rr_rider_wear_logs_created_at_idx
  on public.rr_rider_wear_logs (created_at desc);

create index if not exists rr_rider_wear_logs_brand_idx
  on public.rr_rider_wear_logs (brand);

create index if not exists rr_rider_wear_logs_country_idx
  on public.rr_rider_wear_logs (country);

alter table public.rr_rider_wear_logs enable row level security;

-- Public read of aggregate-friendly rows (no PII beyond description/brand/country).
drop policy if exists "rr_wear_logs_public_read" on public.rr_rider_wear_logs;
create policy "rr_wear_logs_public_read"
  on public.rr_rider_wear_logs
  for select
  to anon, authenticated
  using (true);

-- Inserts go through service role from the app (createJob).
drop policy if exists "rr_wear_logs_service_insert" on public.rr_rider_wear_logs;
create policy "rr_wear_logs_service_insert"
  on public.rr_rider_wear_logs
  for insert
  to authenticated
  with check (true);

grant select on public.rr_rider_wear_logs to anon, authenticated, service_role;
grant insert, update, delete on public.rr_rider_wear_logs to service_role;

comment on table public.rr_rider_wear_logs is
  'Optional rider outfit descriptions for pickup spotting + playful /wear-stats.';
