-- Vehicle classes for SA Uber-style matching (cars vs bakkie/truck).
-- Safe to run after 001_rural_utility.sql

do $$ begin
  create type public.vehicle_type as enum ('sedan', 'bakkie', 'truck');
exception
  when duplicate_object then null;
end $$;

alter table public.drivers
  alter column vehicle_type type public.vehicle_type
  using vehicle_type::public.vehicle_type;

alter table public.jobs
  add column if not exists required_vehicle public.vehicle_type not null default 'sedan';

-- Backfill sensible defaults for any existing rows
update public.jobs
set required_vehicle = case service_type
  when 'ride' then 'sedan'::public.vehicle_type
  when 'farm' then 'bakkie'::public.vehicle_type
  when 'delivery' then 'truck'::public.vehicle_type
  else 'sedan'::public.vehicle_type
end
where required_vehicle = 'sedan' and service_type <> 'ride';
