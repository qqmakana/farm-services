-- User-created locations + personal saved places
-- Run once in Supabase SQL Editor.
-- Customers are guest profiles (phone), not auth users — use created_by_phone.

create table if not exists public.rr_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'landmark'
    check (category in ('shop', 'farm', 'landmark', 'home', 'other')),
  description text,
  village text not null,
  latitude double precision,
  longitude double precision,
  country_code text not null default 'ZA',
  created_by_phone text,
  created_by_name text,
  shop_id uuid references public.rr_shops (id) on delete set null,
  is_verified boolean not null default false,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.rr_saved_locations (
  id uuid primary key default gen_random_uuid(),
  guest_phone text not null,
  name text not null,
  label text,
  latitude double precision,
  longitude double precision,
  location_id uuid references public.rr_locations (id) on delete set null,
  is_home boolean not null default false,
  is_work boolean not null default false,
  country_code text not null default 'ZA',
  created_at timestamptz not null default now()
);

create index if not exists rr_locations_name_idx
  on public.rr_locations (lower(name));

create index if not exists rr_locations_village_idx
  on public.rr_locations (lower(village));

create index if not exists rr_locations_country_idx
  on public.rr_locations (country_code, usage_count desc);

create index if not exists rr_locations_shop_idx
  on public.rr_locations (shop_id)
  where shop_id is not null;

create index if not exists rr_saved_locations_phone_idx
  on public.rr_saved_locations (guest_phone, created_at desc);

alter table public.rr_locations enable row level security;
alter table public.rr_saved_locations enable row level security;

drop policy if exists "rr_locations_select" on public.rr_locations;
create policy "rr_locations_select" on public.rr_locations
  for select using (true);

drop policy if exists "rr_saved_locations_select" on public.rr_saved_locations;
create policy "rr_saved_locations_select" on public.rr_saved_locations
  for select using (true);

grant select on public.rr_locations to anon, authenticated, service_role;
grant select on public.rr_saved_locations to anon, authenticated, service_role;
grant insert, update, delete on public.rr_locations to service_role;
grant insert, update, delete on public.rr_saved_locations to service_role;

comment on table public.rr_locations is
  'Community places added by users (farms, shops, landmarks) — searchable by everyone';
comment on table public.rr_saved_locations is
  'Personal quick-picks keyed by guest phone (Home, Work, custom)';
