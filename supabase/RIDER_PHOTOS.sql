-- =============================================================================
-- Village Ride — Rider face photos (spotting at pickup)
-- Run in Supabase → SQL Editor
-- Bucket id matches product request: rider-photos (private; service role only)
-- =============================================================================

-- Guest profile keyed by phone (anonymous riders — not auth.users)
create table if not exists public.rr_guest_profiles (
  guest_phone text primary key,
  name text,
  photo_url text,
  country_code text,
  updated_at timestamptz not null default now()
);

create index if not exists rr_guest_profiles_updated_at_idx
  on public.rr_guest_profiles (updated_at desc);

alter table public.rr_guest_profiles enable row level security;

-- No public/anon access — app uses service role only.
drop policy if exists "rr_guest_profiles_no_anon" on public.rr_guest_profiles;

grant select, insert, update, delete on public.rr_guest_profiles to service_role;

comment on table public.rr_guest_profiles is
  'Optional guest rider profile (phone-keyed). photo_url is a path in rider-photos.';

-- Optional denormalized path on the job (drivers see via assigned job only)
alter table public.rr_jobs
  add column if not exists customer_photo_url text;

comment on column public.rr_jobs.customer_photo_url is
  'Storage path in rider-photos for this booking (optional). Prefer details.rider_photo_data_url for mock/offline.';

-- Private bucket for rider face photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rider-photos',
  'rider-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
