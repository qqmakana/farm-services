-- =============================================================================
-- Smart suggestions — recent destinations (guest phone, not auth.users)
-- Saved Home/Work already lives in rr_saved_locations (USER_LOCATIONS.sql).
-- Run in Supabase → SQL Editor.
-- =============================================================================

create table if not exists public.rr_recent_destinations (
  id uuid primary key default gen_random_uuid(),
  guest_phone text not null,
  name text not null,
  address text not null default '',
  lat double precision,
  lng double precision,
  ride_count integer not null default 1,
  last_ridden_at timestamptz not null default now(),
  country_code text not null default 'ZA',
  job_id uuid,
  created_at timestamptz not null default now()
);

create unique index if not exists rr_recent_destinations_phone_name_idx
  on public.rr_recent_destinations (guest_phone, lower(name));

create index if not exists rr_recent_destinations_phone_ridden_idx
  on public.rr_recent_destinations (guest_phone, last_ridden_at desc);

alter table public.rr_recent_destinations enable row level security;

drop policy if exists "rr_recent_destinations_no_anon" on public.rr_recent_destinations;

grant select, insert, update, delete on public.rr_recent_destinations to service_role;

comment on table public.rr_recent_destinations is
  'Guest rider drop-offs for home Smart Suggestions. Keyed by phone (anonymous riders).';
