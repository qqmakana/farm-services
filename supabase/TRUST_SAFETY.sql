-- Trust & Safety (Village Ride)
-- Run in Supabase SQL editor after MULTI_COUNTRY.sql / existing schema.
-- Photos live in storage bucket rr-driver-docs (created in PERFECT_UPGRADE.sql).

-- Manual verification gate (do NOT treat id_verified as true without this)
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

-- Required trust photos (storage paths in rr-driver-docs)
alter table public.rr_drivers
  add column if not exists selfie_url text;

alter table public.rr_drivers
  add column if not exists vehicle_front_url text;

alter table public.rr_drivers
  add column if not exists vehicle_side_url text;

-- Code of conduct
alter table public.rr_drivers
  add column if not exists code_of_conduct_accepted_at timestamptz;

-- Suspension (rating < 3.5)
alter table public.rr_drivers
  add column if not exists suspended_at timestamptz;

alter table public.rr_drivers
  add column if not exists suspend_reason text;

-- Backfill: previously id_verified drivers stay verified
update public.rr_drivers
set verification_status = 'verified',
    verified_at = coalesce(verified_at, now())
where id_verified = true
  and verification_status = 'pending';

-- Driver rates customer (per trip)
alter table public.rr_jobs
  add column if not exists customer_rating_stars int;

alter table public.rr_jobs
  add column if not exists customer_rating_comment text;

alter table public.rr_jobs
  add column if not exists customer_rated_at timestamptz;

alter table public.rr_jobs
  drop constraint if exists rr_jobs_customer_rating_stars_check;

alter table public.rr_jobs
  add constraint rr_jobs_customer_rating_stars_check
  check (
    customer_rating_stars is null
    or (customer_rating_stars >= 1 and customer_rating_stars <= 5)
  );

create index if not exists rr_drivers_verification_status_idx
  on public.rr_drivers (verification_status)
  where is_active = true;

comment on column public.rr_drivers.verification_status is
  'pending = cannot go online; verified = ops approved ID+photos; rejected = blocked';
comment on column public.rr_drivers.selfie_url is 'Face photo path in rr-driver-docs';
comment on column public.rr_drivers.vehicle_front_url is 'Vehicle front (plate visible) path';
comment on column public.rr_drivers.vehicle_side_url is 'Vehicle side path';
