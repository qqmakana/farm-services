-- One-shot setup so driver photo signup works in production.
-- Run in Supabase → SQL Editor (safe to re-run).

-- 1) Private storage bucket for ID / selfie / vehicle photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rr-driver-docs',
  'rr-driver-docs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- 2) Niche prefs + legacy doc fields
alter table public.rr_drivers
  add column if not exists prefer_night boolean not null default true;
alter table public.rr_drivers
  add column if not exists prefer_heavy boolean not null default true;
alter table public.rr_drivers
  add column if not exists prefer_village_routes boolean not null default true;
alter table public.rr_drivers
  add column if not exists license_number text;
alter table public.rr_drivers
  add column if not exists id_doc_url text;
alter table public.rr_drivers
  add column if not exists license_doc_url text;
alter table public.rr_drivers
  add column if not exists docs_submitted_at timestamptz;

-- 3) Trust / verification gate + required photo paths
alter table public.rr_drivers
  add column if not exists verification_status text not null default 'pending';
alter table public.rr_drivers
  drop constraint if exists rr_drivers_verification_status_check;
alter table public.rr_drivers
  add constraint rr_drivers_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected'));
alter table public.rr_drivers
  add column if not exists verification_note text;
alter table public.rr_drivers
  add column if not exists verified_at timestamptz;
alter table public.rr_drivers
  add column if not exists verified_by text;
alter table public.rr_drivers
  add column if not exists selfie_url text;
alter table public.rr_drivers
  add column if not exists vehicle_front_url text;
alter table public.rr_drivers
  add column if not exists vehicle_side_url text;
alter table public.rr_drivers
  add column if not exists code_of_conduct_accepted_at timestamptz;

-- 4) Vehicle details on apply form
alter table public.rr_drivers
  add column if not exists vehicle_make text;
alter table public.rr_drivers
  add column if not exists vehicle_model text;
alter table public.rr_drivers
  add column if not exists vehicle_color text;
alter table public.rr_drivers
  add column if not exists vehicle_registration text;
alter table public.rr_drivers
  add column if not exists vehicle_year int;

-- 5) Country + founding-city helpers
alter table public.rr_drivers
  add column if not exists country_code text not null default 'ZA';
alter table public.rr_drivers
  add column if not exists home_city text;

create index if not exists rr_drivers_verification_status_idx
  on public.rr_drivers (verification_status)
  where is_active = true;
