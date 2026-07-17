-- Rural Utility — unified ledger for rides, bulky delivery, and farm orders.
-- Run this in the Supabase SQL Editor (or via supabase db push).

create extension if not exists "pgcrypto";

create type public.service_type as enum ('ride', 'delivery', 'farm');
create type public.vehicle_type as enum ('sedan', 'bakkie', 'truck');
create type public.job_status as enum (
  'new',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
);
create type public.payment_status as enum (
  'unpaid',
  'cash_collected',
  'paid_online'
);

-- Supporting table: needed so WhatsApp dispatch can resolve a driver's phone.
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  vehicle_type public.vehicle_type not null default 'bakkie',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

-- Unified jobs ledger (all three services live here).
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,

  service_type public.service_type not null,
  status public.job_status not null default 'new',
  -- SA Uber-style: sedan for people; bakkie/truck for goods
  required_vehicle public.vehicle_type not null default 'sedan',

  customer_name text not null,
  customer_phone text not null,

  -- Village navigation: GPS pin + mandatory landmark
  pickup_lat double precision,
  pickup_lng double precision,
  pickup_landmark text not null,
  dropoff_lat double precision,
  dropoff_lng double precision,
  dropoff_landmark text not null,

  -- Lift-club runs use a schedule; bulky/farm can be null (ASAP)
  scheduled_for timestamptz,

  -- Service-specific payload (keeps one ledger table)
  -- ride:     { "seats": 2, "route_name": "Village → Town", "direction": "to_town" }
  -- delivery: { "item_description": "Fridge", "size": "large", "needs_helpers": true }
  -- farm:     { "items": [{"name":"Eggs","qty":2,"price":50}], "notes": "Leave at spaza" }
  details jsonb not null default '{}'::jsonb,

  fee_amount numeric(10, 2) not null default 0,
  fee_currency text not null default 'ZAR',
  payment_status public.payment_status not null default 'unpaid',

  driver_id uuid references public.drivers (id) on delete set null,
  assigned_at timestamptz,
  dispatcher_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_status_idx on public.jobs (status);
create index jobs_service_type_idx on public.jobs (service_type);
create index jobs_scheduled_for_idx on public.jobs (scheduled_for);
create index jobs_driver_id_idx on public.jobs (driver_id);
create index jobs_created_at_idx on public.jobs (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row
  execute function public.set_updated_at();

-- MVP: open policies so the dispatcher works before auth is wired.
-- Tighten these once you add Supabase Auth for the dispatcher login.
alter table public.drivers enable row level security;
alter table public.jobs enable row level security;

create policy "Allow all drivers (MVP)"
  on public.drivers for all
  using (true) with check (true);

create policy "Allow all jobs (MVP)"
  on public.jobs for all
  using (true) with check (true);

-- Seed sample drivers (Eastern Cape style phones — replace with real numbers)
insert into public.drivers (full_name, phone, vehicle_type, notes) values
  ('Thabo Mbeki Bakkie', '27821234567', 'bakkie', 'Furniture + farm runs'),
  ('Nomsa Lift Club', '27829876543', 'sedan', 'Morning village ↔ town'),
  ('Sipho Truck', '27825551234', 'truck', 'Fridges / TVs / large loads');
