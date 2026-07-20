-- Shop / merchant ratings (driver rates partner after shop delivery)
-- Run in Supabase SQL editor

alter table public.rr_shops
  add column if not exists rating_avg numeric(3, 1) not null default 5.0;

alter table public.rr_shops
  add column if not exists rating_count integer not null default 0;

create table if not exists public.rr_shop_ratings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.rr_shops (id) on delete cascade,
  driver_id uuid not null references public.rr_drivers (id) on delete cascade,
  job_id uuid not null references public.rr_jobs (id) on delete cascade,
  stars integer not null check (stars >= 1 and stars <= 5),
  comment text,
  created_at timestamptz not null default now(),
  constraint rr_shop_ratings_job_unique unique (job_id)
);

create index if not exists rr_shop_ratings_shop_idx
  on public.rr_shop_ratings (shop_id, created_at desc);

alter table public.rr_shop_ratings enable row level security;

drop policy if exists "rr_shop_ratings_read" on public.rr_shop_ratings;
create policy "rr_shop_ratings_read" on public.rr_shop_ratings
  for select using (true);

drop policy if exists "rr_shop_ratings_insert" on public.rr_shop_ratings;
create policy "rr_shop_ratings_insert" on public.rr_shop_ratings
  for insert with check (true);

comment on table public.rr_shop_ratings is 'Driver rates merchant/shop after completed delivery';
