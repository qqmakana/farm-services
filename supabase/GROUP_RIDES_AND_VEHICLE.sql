-- Vehicle display fields + Group Rides / Shared Loads
-- Run once in Supabase SQL Editor after TRUST_SAFETY.sql / DRIVER_VEHICLE.sql.
-- Photos already use rr-driver-docs (selfie_url, vehicle_front_url).

-- ─── Vehicle details (shown to customers on trip cards) ─────────────────────
alter table public.rr_drivers
  add column if not exists vehicle_make text;

alter table public.rr_drivers
  add column if not exists vehicle_model text;

alter table public.rr_drivers
  add column if not exists vehicle_color text;

comment on column public.rr_drivers.vehicle_make is 'e.g. Toyota';
comment on column public.rr_drivers.vehicle_model is 'e.g. Hilux';
comment on column public.rr_drivers.vehicle_color is 'e.g. White';
comment on column public.rr_drivers.vehicle_registration is 'License plate — shown to customers';

-- ─── Group trips (shared rides / shared loads) ──────────────────────────────
create table if not exists public.rr_group_trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.rr_drivers (id) on delete cascade,
  kind text not null default 'ride'
    check (kind in ('ride', 'goods')),
  title text,
  route_pickup text not null,
  route_dropoff text not null,
  route_stops text[] default '{}',
  capacity integer not null check (capacity >= 1 and capacity <= 40),
  seats_taken integer not null default 0 check (seats_taken >= 0),
  status text not null default 'open'
    check (status in ('open', 'full', 'in_progress', 'completed', 'cancelled')),
  price_per_person numeric(12, 2) not null check (price_per_person >= 0),
  total_price numeric(12, 2) not null check (total_price >= 0),
  country_code text not null default 'ZA',
  departs_at timestamptz,
  created_at timestamptz not null default now(),
  constraint rr_group_trips_capacity_ok check (seats_taken <= capacity)
);

create table if not exists public.rr_group_trip_participants (
  id uuid primary key default gen_random_uuid(),
  group_trip_id uuid not null references public.rr_group_trips (id) on delete cascade,
  guest_name text not null,
  guest_phone text not null,
  seats integer not null default 1 check (seats >= 1 and seats <= 10),
  amount_due numeric(12, 2) not null default 0,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'pending', 'cancelled')),
  joined_at timestamptz not null default now()
);

create index if not exists rr_group_trips_status_idx
  on public.rr_group_trips (status, created_at desc);

create index if not exists rr_group_trips_driver_idx
  on public.rr_group_trips (driver_id, created_at desc);

create index if not exists rr_group_trip_participants_trip_idx
  on public.rr_group_trip_participants (group_trip_id);

alter table public.rr_group_trips enable row level security;
alter table public.rr_group_trip_participants enable row level security;

-- Public can browse open groups (anon/authenticated); writes via service role
drop policy if exists "rr_group_trips_select_open" on public.rr_group_trips;
create policy "rr_group_trips_select_open" on public.rr_group_trips
  for select using (true);

drop policy if exists "rr_group_trip_participants_select" on public.rr_group_trip_participants;
create policy "rr_group_trip_participants_select" on public.rr_group_trip_participants
  for select using (true);

grant select on public.rr_group_trips to anon, authenticated, service_role;
grant select on public.rr_group_trip_participants to anon, authenticated, service_role;
grant insert, update, delete on public.rr_group_trips to service_role;
grant insert, update, delete on public.rr_group_trip_participants to service_role;
