-- Uber-style auto-dispatch + free Firebase Cloud Messaging (FCM)
-- Run once in Supabase SQL Editor after SMART_DISPATCH.sql
-- FCM itself is free on Firebase Spark tier — only needs env keys.

-- Driver push token
alter table public.rr_drivers
  add column if not exists fcm_token text;
alter table public.rr_drivers
  add column if not exists fcm_updated_at timestamptz;

-- Sequential exclusive offers
alter table public.rr_jobs
  add column if not exists offered_driver_id uuid references public.rr_drivers (id);
alter table public.rr_jobs
  add column if not exists offer_expires_at timestamptz;
alter table public.rr_jobs
  add column if not exists dispatch_rank jsonb not null default '[]'::jsonb;
alter table public.rr_jobs
  add column if not exists dispatch_index integer not null default 0;
alter table public.rr_jobs
  add column if not exists customer_fcm_token text;
alter table public.rr_jobs
  add column if not exists dispatch_attempts integer not null default 0;
alter table public.rr_jobs
  add column if not exists dispatch_exhausted boolean not null default false;

-- New Uber-style statuses (keep legacy new/assigned for old rows)
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'rr_job_status' and e.enumlabel = 'searching_driver'
  ) then
    alter type public.rr_job_status add value 'searching_driver';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'rr_job_status' and e.enumlabel = 'confirmed'
  ) then
    alter type public.rr_job_status add value 'confirmed';
  end if;
end $$;

comment on column public.rr_drivers.fcm_token is
  'Firebase Cloud Messaging device token (free Spark tier).';
comment on column public.rr_jobs.offered_driver_id is
  'Driver currently holding the exclusive timed offer.';
comment on column public.rr_jobs.offer_expires_at is
  'When the current exclusive offer expires (then try next driver).';
comment on column public.rr_jobs.dispatch_attempts is
  'How many exclusive offers have been sent (max 3).';
comment on column public.rr_jobs.dispatch_exhausted is
  'True when 3 drivers declined/timed out — show No drivers available.';
