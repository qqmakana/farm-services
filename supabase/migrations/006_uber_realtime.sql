-- World-class Uber-style ops: online drivers, live GPS, ratings

alter table public.drivers
  add column if not exists is_online boolean not null default false,
  add column if not exists last_lat double precision,
  add column if not exists last_lng double precision,
  add column if not exists last_location_at timestamptz,
  add column if not exists rating_avg numeric(3, 2) not null default 5.00,
  add column if not exists rating_count integer not null default 0;

alter table public.jobs
  add column if not exists driver_lat double precision,
  add column if not exists driver_lng double precision,
  add column if not exists driver_location_at timestamptz,
  add column if not exists offered_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade unique,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.ratings enable row level security;
create policy "Allow all ratings (MVP)" on public.ratings for all using (true) with check (true);

create index if not exists drivers_online_idx on public.drivers (is_online) where is_online = true;
