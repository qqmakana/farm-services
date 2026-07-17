-- =============================================================================
-- RURAL RIDE (Sandton Streets) — SAFE FOR SHARED SUPABASE PROJECTS
--
-- All tables/enums use rr_ prefix so they will NOT clash with your other app.
--
-- HOW TO RUN:
-- 1) Supabase → SQL Editor → New query
-- 2) Copy EVERYTHING in this file (Ctrl+A, Ctrl+C)
-- 3) Paste here → Run
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS (rr_ = Rural Ride only) ----------
do $$ begin create type public.rr_service_type as enum ('ride', 'delivery', 'farm'); exception when duplicate_object then null; end $$;
do $$ begin create type public.rr_vehicle_type as enum ('sedan', 'bakkie', 'truck'); exception when duplicate_object then null; end $$;
do $$ begin create type public.rr_job_status as enum ('new', 'assigned', 'in_progress', 'completed', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.rr_payment_status as enum ('unpaid', 'pending', 'paid_online', 'failed', 'refunded', 'cash_collected'); exception when duplicate_object then null; end $$;
do $$ begin create type public.rr_payment_method as enum ('paypal', 'card', 'wallet'); exception when duplicate_object then null; end $$;
do $$ begin create type public.rr_application_status as enum ('pending', 'accepted', 'rejected', 'withdrawn'); exception when duplicate_object then null; end $$;
do $$ begin create type public.rr_user_role as enum ('customer', 'driver', 'merchant', 'dispatcher', 'admin'); exception when duplicate_object then null; end $$;

-- ---------- PROFILES (Rural Ride only — does not touch other apps' profiles) ----------
create table if not exists public.rr_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.rr_user_role not null default 'customer',
  full_name text,
  phone text,
  driver_id uuid,
  shop_id uuid,
  created_at timestamptz not null default now()
);

-- ---------- DRIVERS ----------
create table if not exists public.rr_drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  vehicle_type public.rr_vehicle_type not null default 'bakkie',
  is_active boolean not null default false,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  is_online boolean not null default false,
  last_lat double precision,
  last_lng double precision,
  last_location_at timestamptz,
  rating_avg numeric(3, 2) not null default 5.00,
  rating_count integer not null default 0,
  id_verified boolean not null default false,
  id_number_hash text,
  notes text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- SHOPS ----------
create table if not exists public.rr_shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  category text not null default 'general',
  landmark text not null,
  lat double precision,
  lng double precision,
  delivers boolean not null default true,
  is_active boolean not null default true,
  notes text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.rr_products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.rr_shops (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  size text not null default 'medium' check (size in ('small', 'medium', 'large', 'xl')),
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- JOBS ----------
create table if not exists public.rr_jobs (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  service_type public.rr_service_type not null,
  status public.rr_job_status not null default 'new',
  required_vehicle public.rr_vehicle_type not null default 'sedan',

  customer_name text not null,
  customer_phone text not null,
  customer_user_id uuid references auth.users (id) on delete set null,

  pickup_lat double precision,
  pickup_lng double precision,
  pickup_landmark text not null,
  dropoff_lat double precision,
  dropoff_lng double precision,
  dropoff_landmark text not null,

  scheduled_for timestamptz,
  details jsonb not null default '{}'::jsonb,

  fee_amount numeric(10, 2) not null default 0,
  platform_commission numeric(10, 2) not null default 0,
  driver_payout numeric(10, 2) not null default 0,
  fee_currency text not null default 'ZAR',

  payment_status public.rr_payment_status not null default 'unpaid',
  payment_method public.rr_payment_method,
  card_last4 text,
  paypal_order_id text,
  paypal_capture_id text unique,
  paid_at timestamptz,

  driver_id uuid references public.rr_drivers (id) on delete set null,
  assigned_at timestamptz,
  dispatcher_notes text,
  shop_id uuid references public.rr_shops (id) on delete set null,
  product_summary text,

  driver_lat double precision,
  driver_lng double precision,
  driver_location_at timestamptz,
  offered_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  share_token text unique default encode(gen_random_bytes(16), 'hex'),
  sos_triggered_at timestamptz,
  sos_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rr_job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.rr_jobs (id) on delete cascade,
  driver_id uuid not null references public.rr_drivers (id) on delete cascade,
  status public.rr_application_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  unique (job_id, driver_id)
);

create table if not exists public.rr_ratings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.rr_jobs (id) on delete cascade unique,
  driver_id uuid not null references public.rr_drivers (id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.rr_payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paypal',
  event_id text unique,
  event_type text not null,
  paypal_order_id text,
  paypal_capture_id text,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.rr_sos_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.rr_jobs (id) on delete cascade,
  triggered_by text not null default 'customer',
  note text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create table if not exists public.rr_fare_rules (
  id uuid primary key default gen_random_uuid(),
  vehicle_type public.rr_vehicle_type not null unique,
  base_fare numeric(10, 2) not null,
  per_km numeric(10, 2) not null default 0,
  platform_commission_pct numeric(5, 2) not null default 15.00,
  updated_at timestamptz not null default now()
);

insert into public.rr_fare_rules (vehicle_type, base_fare, per_km, platform_commission_pct) values
  ('sedan', 50, 8, 15),
  ('bakkie', 180, 12, 15),
  ('truck', 450, 18, 15)
on conflict (vehicle_type) do nothing;

-- ---------- INDEXES ----------
create index if not exists rr_jobs_status_idx on public.rr_jobs (status);
create index if not exists rr_jobs_service_type_idx on public.rr_jobs (service_type);
create index if not exists rr_jobs_driver_id_idx on public.rr_jobs (driver_id);
create index if not exists rr_jobs_created_at_idx on public.rr_jobs (created_at desc);
create index if not exists rr_jobs_status_vehicle_idx on public.rr_jobs (status, required_vehicle);
create index if not exists rr_jobs_share_token_idx on public.rr_jobs (share_token);
create index if not exists rr_drivers_online_idx on public.rr_drivers (is_online) where is_online = true;
create index if not exists rr_products_shop_id_idx on public.rr_products (shop_id);
create index if not exists rr_job_applications_job_id_idx on public.rr_job_applications (job_id);
create index if not exists rr_job_applications_driver_id_idx on public.rr_job_applications (driver_id);

-- ---------- UPDATED_AT ----------
create or replace function public.rr_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rr_jobs_set_updated_at on public.rr_jobs;
create trigger rr_jobs_set_updated_at
  before update on public.rr_jobs
  for each row execute function public.rr_set_updated_at();

-- Auto-create Rural Ride profile on signup (does not touch other apps' tables)
create or replace function public.rr_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.rr_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::public.rr_user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists rr_on_auth_user_created on auth.users;
create trigger rr_on_auth_user_created
  after insert on auth.users
  for each row execute function public.rr_handle_new_user();

-- ---------- RLS ----------
alter table public.rr_profiles enable row level security;
alter table public.rr_drivers enable row level security;
alter table public.rr_shops enable row level security;
alter table public.rr_products enable row level security;
alter table public.rr_jobs enable row level security;
alter table public.rr_job_applications enable row level security;
alter table public.rr_ratings enable row level security;
alter table public.rr_payment_events enable row level security;
alter table public.rr_sos_events enable row level security;
alter table public.rr_fare_rules enable row level security;

drop policy if exists "rr_profiles_select_own" on public.rr_profiles;
create policy "rr_profiles_select_own" on public.rr_profiles for select using (auth.uid() = id or exists (
  select 1 from public.rr_profiles p where p.id = auth.uid() and p.role in ('dispatcher', 'admin')
));
drop policy if exists "rr_profiles_update_own" on public.rr_profiles;
create policy "rr_profiles_update_own" on public.rr_profiles for update using (auth.uid() = id);

drop policy if exists "rr_shops_public_read" on public.rr_shops;
create policy "rr_shops_public_read" on public.rr_shops for select using (is_active = true);
drop policy if exists "rr_products_public_read" on public.rr_products;
create policy "rr_products_public_read" on public.rr_products for select using (in_stock = true);
drop policy if exists "rr_fares_public_read" on public.rr_fare_rules;
create policy "rr_fares_public_read" on public.rr_fare_rules for select using (true);

drop policy if exists "rr_drivers_authenticated_read" on public.rr_drivers;
create policy "rr_drivers_authenticated_read" on public.rr_drivers for select to authenticated using (true);
drop policy if exists "rr_drivers_public_online_read" on public.rr_drivers;
create policy "rr_drivers_public_online_read" on public.rr_drivers for select to anon using (is_active = true);
drop policy if exists "rr_drivers_update_own" on public.rr_drivers;
create policy "rr_drivers_update_own" on public.rr_drivers for update using (user_id = auth.uid());

drop policy if exists "rr_jobs_dispatcher_all" on public.rr_jobs;
create policy "rr_jobs_dispatcher_all" on public.rr_jobs for all using (
  exists (select 1 from public.rr_profiles p where p.id = auth.uid() and p.role in ('dispatcher', 'admin'))
) with check (
  exists (select 1 from public.rr_profiles p where p.id = auth.uid() and p.role in ('dispatcher', 'admin'))
);
drop policy if exists "rr_jobs_driver_read" on public.rr_jobs;
create policy "rr_jobs_driver_read" on public.rr_jobs for select using (
  exists (
    select 1 from public.rr_drivers d
    where d.user_id = auth.uid() and (d.id = rr_jobs.driver_id or rr_jobs.status = 'new')
  )
);
drop policy if exists "rr_jobs_share_token_read" on public.rr_jobs;
create policy "rr_jobs_share_token_read" on public.rr_jobs for select using (share_token is not null);

drop policy if exists "rr_apps_driver_rw" on public.rr_job_applications;
create policy "rr_apps_driver_rw" on public.rr_job_applications for all using (
  exists (select 1 from public.rr_drivers d where d.user_id = auth.uid() and d.id = driver_id)
  or exists (select 1 from public.rr_profiles p where p.id = auth.uid() and p.role in ('dispatcher', 'admin'))
) with check (
  exists (select 1 from public.rr_drivers d where d.user_id = auth.uid() and d.id = driver_id)
  or exists (select 1 from public.rr_profiles p where p.id = auth.uid() and p.role in ('dispatcher', 'admin'))
);

drop policy if exists "rr_ratings_insert_auth" on public.rr_ratings;
create policy "rr_ratings_insert_auth" on public.rr_ratings for insert with check (true);
drop policy if exists "rr_ratings_read" on public.rr_ratings;
create policy "rr_ratings_read" on public.rr_ratings for select using (true);

drop policy if exists "rr_sos_insert" on public.rr_sos_events;
create policy "rr_sos_insert" on public.rr_sos_events for insert with check (true);
drop policy if exists "rr_sos_dispatch_read" on public.rr_sos_events;
create policy "rr_sos_dispatch_read" on public.rr_sos_events for select using (
  exists (select 1 from public.rr_profiles p where p.id = auth.uid() and p.role in ('dispatcher', 'admin'))
);

drop policy if exists "rr_shops_owner_write" on public.rr_shops;
create policy "rr_shops_owner_write" on public.rr_shops for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "rr_products_owner_write" on public.rr_products;
create policy "rr_products_owner_write" on public.rr_products for all using (
  exists (select 1 from public.rr_shops s where s.id = shop_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.rr_shops s where s.id = shop_id and s.user_id = auth.uid())
);

-- Server uses SERVICE_ROLE key (bypasses RLS). Never put service_role in the browser.

-- ---------- REALTIME (safe add — ignore error if already added) ----------
do $$ begin
  alter publication supabase_realtime add table public.rr_jobs;
exception when duplicate_object then null; when others then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.rr_drivers;
exception when duplicate_object then null; when others then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.rr_job_applications;
exception when duplicate_object then null; when others then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.rr_sos_events;
exception when duplicate_object then null; when others then null;
end $$;

-- ---------- SEED SAMPLE DRIVERS (optional demo fleet) ----------
insert into public.rr_drivers (full_name, phone, vehicle_type, is_active, approval_status, id_verified, is_online, last_lat, last_lng, last_location_at, notes)
select * from (values
  ('Thabo Bakkie', '27821234567', 'bakkie'::public.rr_vehicle_type, true, 'approved', true, true, -31.587::float8, 28.783::float8, now(), 'Furniture + farm'),
  ('Nomsa Go', '27829876543', 'sedan'::public.rr_vehicle_type, true, 'approved', true, true, -31.589::float8, 28.785::float8, now(), 'Village rides'),
  ('Sipho Truck', '27825551234', 'truck'::public.rr_vehicle_type, true, 'approved', true, true, -31.586::float8, 28.786::float8, now(), 'Heavy loads')
) as v(full_name, phone, vehicle_type, is_active, approval_status, id_verified, is_online, last_lat, last_lng, last_location_at, notes)
where not exists (select 1 from public.rr_drivers limit 1);

-- ---------- DONE ----------
-- Next:
-- 1) Settings → API → copy URL, anon, service_role into .env.local
-- 2) Auth → Add user → then run:
--    update public.rr_profiles set role = 'dispatcher' where id = '<uuid>';
-- 3) Table Editor should show tables starting with rr_
