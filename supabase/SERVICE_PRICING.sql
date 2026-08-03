-- =============================================================================
-- Village Ride — unified service pricing (SHARED SUPABASE PROJECT SAFE)
-- =============================================================================
-- This project shares one Supabase DB with other apps.
-- RULES (do not violate):
--   1. Touch ONLY public.rr_* objects (prefix = Rural Ride / Village Ride).
--   2. NEVER alter public.users, auth.users, or any non-rr_* table.
--   3. NEVER create unprefixed enums/types/functions that other apps might collide with.
--   4. Policies/indexes/constraints must use the rr_ name prefix.
--
-- Subscriptions live on rr_rider_subscriptions (see VILLAGE_PASS.sql) — not users.
-- App also embeds ZA defaults in src/lib/pricing.ts (works even if seed is skipped).
-- Run after VILLAGE_PASS.sql / DUAL_PAYMENT.sql when those already applied.
-- =============================================================================

-- Guard: only proceed if Village Ride jobs table exists
do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'rr_jobs'
  ) then
    raise exception
      'SERVICE_PRICING.sql: public.rr_jobs not found. Wrong project or run PASTE_ME.sql first.';
  end if;
end $$;

-- Weight + fare audit columns on Village Ride jobs only
alter table public.rr_jobs
  add column if not exists weight_category text null;

alter table public.rr_jobs
  add column if not exists base_fare numeric(12, 2) null;

alter table public.rr_jobs
  add column if not exists distance_fare numeric(12, 2) null;

alter table public.rr_jobs
  add column if not exists distance_km numeric(12, 2) null;

alter table public.rr_jobs
  add column if not exists total_fare numeric(12, 2) null;

comment on column public.rr_jobs.weight_category is
  'Village Ride: light|medium|heavy|extra_heavy for delivery/farm; null for ride/courier';
comment on column public.rr_jobs.base_fare is
  'Village Ride: quoted base component (driver rate — sacred)';
comment on column public.rr_jobs.distance_fare is
  'Village Ride: quoted per-km component';
comment on column public.rr_jobs.total_fare is
  'Village Ride: rider total = driver fare + platform booking fee (fee_amount)';

-- Canonical pricing table (rr_ namespace only)
create table if not exists public.rr_service_pricing (
  id uuid primary key default gen_random_uuid(),
  country_code text not null default 'ZA',
  service_type text not null
    check (service_type in ('ride', 'courier', 'delivery', 'farm')),
  weight_category text null
    check (
      weight_category is null
      or weight_category in ('light', 'medium', 'heavy', 'extra_heavy')
    ),
  base_fare numeric(12, 2) not null,
  per_km_rate numeric(12, 2) not null,
  platform_fee numeric(12, 2) not null default 5,
  minimum_fare numeric(12, 2) not null,
  currency text not null default 'ZAR',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Unique index (rr_ prefixed). NULLS NOT DISTINCT so ride/courier (null weight) stay one row.
create unique index if not exists rr_service_pricing_country_service_weight_uidx
  on public.rr_service_pricing (country_code, service_type, weight_category)
  nulls not distinct;

comment on table public.rr_service_pricing is
  'Village Ride only — service/weight band rates. Do not use from other apps.';

alter table public.rr_service_pricing enable row level security;

-- Public read of published rates (Village Ride client quotes); writes via service_role only
drop policy if exists "rr_service_pricing_read" on public.rr_service_pricing;
create policy "rr_service_pricing_read"
  on public.rr_service_pricing for select
  using (true);

grant select on public.rr_service_pricing to anon, authenticated, service_role;
grant insert, update, delete on public.rr_service_pricing to service_role;

-- Seed ZA rows (idempotent; only touches rr_service_pricing)
insert into public.rr_service_pricing
  (country_code, service_type, weight_category, base_fare, per_km_rate, platform_fee, minimum_fare, currency)
values
  ('ZA', 'ride', null, 15, 10, 5, 25, 'ZAR'),
  ('ZA', 'courier', null, 15, 10, 5, 25, 'ZAR'),
  ('ZA', 'delivery', 'light', 20, 12, 5, 20, 'ZAR'),
  ('ZA', 'delivery', 'medium', 35, 15, 5, 35, 'ZAR'),
  ('ZA', 'delivery', 'heavy', 60, 20, 5, 60, 'ZAR'),
  ('ZA', 'delivery', 'extra_heavy', 100, 30, 5, 100, 'ZAR'),
  ('ZA', 'farm', 'light', 25, 15, 5, 25, 'ZAR'),
  ('ZA', 'farm', 'medium', 40, 18, 5, 40, 'ZAR'),
  ('ZA', 'farm', 'heavy', 70, 25, 5, 70, 'ZAR'),
  ('ZA', 'farm', 'extra_heavy', 120, 35, 5, 120, 'ZAR')
on conflict (country_code, service_type, weight_category) do update set
  base_fare = excluded.base_fare,
  per_km_rate = excluded.per_km_rate,
  platform_fee = excluded.platform_fee,
  minimum_fare = excluded.minimum_fare,
  currency = excluded.currency,
  is_active = true;

-- NOTE: Intentionally does NOT alter public.users / auth.users.
-- Village Pass status = rr_rider_subscriptions (VILLAGE_PASS.sql).
