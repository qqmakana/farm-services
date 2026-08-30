-- Village Ride — Yoco holds all card money. Weekly EFT payouts to drivers + shops.
-- Run in Supabase SQL editor. Does not change trip 90/10.

alter table public.rr_shops
  add column if not exists is_approved boolean not null default false,
  add column if not exists bank_name text,
  add column if not exists account_number text,
  add column if not exists account_holder text;

create table if not exists public.rr_driver_payouts (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.rr_drivers (id) on delete cascade,
  week_starting date not null,
  week_ending date not null,
  job_count integer not null default 0,
  amount integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'paid')),
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now(),
  unique (driver_id, week_starting)
);

create table if not exists public.rr_shop_settlements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.rr_shops (id) on delete cascade,
  week_starting date not null,
  week_ending date not null,
  total_sales integer not null default 0,
  commission_amount integer not null default 0,
  net_payable integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'paid')),
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now(),
  unique (shop_id, week_starting)
);

create index if not exists rr_driver_payouts_status_idx
  on public.rr_driver_payouts (status, week_ending desc);
create index if not exists rr_shop_settlements_status_idx
  on public.rr_shop_settlements (status, week_ending desc);

alter table public.rr_driver_payouts enable row level security;
alter table public.rr_shop_settlements enable row level security;
