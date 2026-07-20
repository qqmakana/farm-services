-- Multi-country Village Ride (backward compatible — ZA / ZAR defaults)
-- Run in Supabase SQL editor after existing schema.

-- Reference table
create table if not exists public.rr_countries (
  code text primary key,
  name text not null,
  currency text not null,
  currency_symbol text not null,
  phone_prefix text not null,
  language text not null default 'en',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.rr_countries (code, name, currency, currency_symbol, phone_prefix, language, enabled)
values
  ('ZA', 'South Africa', 'ZAR', 'R', '27', 'xh', true),
  ('KE', 'Kenya', 'KES', 'KSh', '254', 'sw', true),
  ('NG', 'Nigeria', 'NGN', '₦', '234', 'yo', true),
  ('GH', 'Ghana', 'GHS', 'GH₵', '233', 'ak', true),
  ('IN', 'India', 'INR', '₹', '91', 'hi', true),
  ('PH', 'Philippines', 'PHP', '₱', '63', 'tl', true)
on conflict (code) do update set
  name = excluded.name,
  currency = excluded.currency,
  currency_symbol = excluded.currency_symbol,
  phone_prefix = excluded.phone_prefix,
  language = excluded.language,
  enabled = excluded.enabled;

-- Profiles (auth users) — there is no rr_users table; country lives on rr_profiles
alter table public.rr_profiles
  add column if not exists country_code text not null default 'ZA';

-- Drivers
alter table public.rr_drivers
  add column if not exists country_code text not null default 'ZA';

-- Jobs
alter table public.rr_jobs
  add column if not exists country_code text not null default 'ZA';

alter table public.rr_jobs
  add column if not exists currency text;

-- Backfill currency from fee_currency when null
update public.rr_jobs
set currency = coalesce(nullif(currency, ''), fee_currency, 'ZAR')
where currency is null or currency = '';

alter table public.rr_jobs
  alter column currency set default 'ZAR';

-- Optional: fare rules per country (keep existing ZA rows as-is)
alter table public.rr_fare_rules
  add column if not exists country_code text not null default 'ZA';

-- Indexes for matching
create index if not exists rr_drivers_country_online_idx
  on public.rr_drivers (country_code, is_online)
  where is_active = true;

create index if not exists rr_jobs_country_status_idx
  on public.rr_jobs (country_code, status);

comment on column public.rr_profiles.country_code is 'ISO-like country code (ZA, KE, …)';
comment on column public.rr_drivers.country_code is 'Driver operating country — jobs filtered to match';
comment on column public.rr_jobs.country_code is 'Job country — must match driver for dispatch';
