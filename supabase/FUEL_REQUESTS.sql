-- =============================================================================
-- Village Ride — Out of Fuel / roadside fuel help (driver-to-driver)
-- Run in Supabase → SQL Editor after PASTE_ME.sql
-- =============================================================================

create table if not exists public.rr_fuel_requests (
  id uuid primary key default gen_random_uuid(),
  requester_driver_id uuid not null references public.rr_drivers (id) on delete cascade,
  helper_driver_id uuid references public.rr_drivers (id) on delete set null,
  location_lat double precision,
  location_lng double precision,
  location_landmark text,
  fuel_amount text not null
    check (fuel_amount in ('5L', '10L', '20L')),
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'delivered', 'cancelled')),
  payment_method text not null default 'cash'
    check (payment_method in ('cash', 'card')),
  payment_note text,
  country_code text not null default 'ZA',
  assigned_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rr_fuel_requests_status_idx
  on public.rr_fuel_requests (status, created_at desc);

create index if not exists rr_fuel_requests_requester_idx
  on public.rr_fuel_requests (requester_driver_id, created_at desc);

create index if not exists rr_fuel_requests_helper_idx
  on public.rr_fuel_requests (helper_driver_id)
  where helper_driver_id is not null;

alter table public.rr_fuel_requests enable row level security;

drop policy if exists "rr_fuel_requests_select" on public.rr_fuel_requests;
create policy "rr_fuel_requests_select"
  on public.rr_fuel_requests
  for select
  to anon, authenticated
  using (true);

grant select on public.rr_fuel_requests to anon, authenticated, service_role;
grant insert, update, delete on public.rr_fuel_requests to service_role;

comment on table public.rr_fuel_requests is
  'Driver-to-driver out-of-fuel help requests (cash to helper; not a customer trip).';
