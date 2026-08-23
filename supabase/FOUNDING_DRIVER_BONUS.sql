-- =============================================================================
-- Founding Driver Bonus Pool (performance incentive — NOT a financial security)
-- SHARED PROJECT: rr_* only. Run in Supabase → SQL Editor.
--
-- Legal: Do NOT describe this as equity, shares, ownership, or dividends.
-- Language: Bonus / Points / Reward / Incentive only.
-- Cutoff (app-enforced): 2026-08-30 — first completed trip on or before then qualifies.
-- =============================================================================

-- ---------- DRIVER COLUMNS ----------
alter table public.rr_drivers
  add column if not exists is_founding_driver boolean not null default false;

alter table public.rr_drivers
  add column if not exists founding_era_qualified_at timestamptz;

alter table public.rr_drivers
  add column if not exists accumulated_bonus_balance integer not null default 0;

alter table public.rr_drivers
  add column if not exists home_city text;

comment on column public.rr_drivers.is_founding_driver is
  'True when driver completed first trip during Founding Era (before cutoff). Performance bonus program only.';
comment on column public.rr_drivers.founding_era_qualified_at is
  'When the driver locked Founding Driver Bonus Pool status.';
comment on column public.rr_drivers.accumulated_bonus_balance is
  'Accumulated Founding Driver bonus balance in cents (ZAR).';
comment on column public.rr_drivers.home_city is
  'Home city/region for city bonus pool (e.g. Johannesburg, Cape Town).';

create index if not exists rr_drivers_founding_city_idx
  on public.rr_drivers (home_city)
  where is_founding_driver = true;

-- ---------- MONTHLY CITY REVENUE ----------
create table if not exists public.rr_monthly_city_revenue (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  month_year text not null,
  total_gross_revenue integer not null default 0,
  bonus_pool_amount integer not null default 0,
  is_distributed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rr_monthly_city_revenue_month_chk
    check (month_year ~ '^\d{4}-\d{2}$'),
  constraint rr_monthly_city_revenue_city_month_uq unique (city, month_year)
);

comment on table public.rr_monthly_city_revenue is
  'Per-city monthly platform fee totals (cents) and Founding Driver 2% bonus pool.';
comment on column public.rr_monthly_city_revenue.total_gross_revenue is
  'Sum of platform fees (cents) collected in this city/month.';
comment on column public.rr_monthly_city_revenue.bonus_pool_amount is
  '2% of total_gross_revenue (cents) reserved for founding-driver bonus incentives.';

alter table public.rr_monthly_city_revenue enable row level security;

grant select, insert, update, delete on public.rr_monthly_city_revenue to service_role;

-- Accrue platform fee (cents) into city/month bucket. No-op if already distributed.
create or replace function public.rr_accrue_city_platform_fee(
  p_city text,
  p_month_year text,
  p_fee_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_city is null or length(trim(p_city)) = 0 then
    return;
  end if;
  if p_fee_cents is null or p_fee_cents <= 0 then
    return;
  end if;

  insert into public.rr_monthly_city_revenue as r (
    city,
    month_year,
    total_gross_revenue,
    bonus_pool_amount,
    is_distributed
  )
  values (
    trim(p_city),
    p_month_year,
    p_fee_cents,
    0,
    false
  )
  on conflict (city, month_year) do update
  set
    total_gross_revenue = r.total_gross_revenue + excluded.total_gross_revenue,
    updated_at = now()
  where r.is_distributed = false;
end;
$$;

revoke all on function public.rr_accrue_city_platform_fee(text, text, integer) from public;
grant execute on function public.rr_accrue_city_platform_fee(text, text, integer) to service_role;

-- Distribute 2% bonus pool equally among founding drivers in the city (one transaction).
create or replace function public.rr_distribute_city_bonus(
  p_city text,
  p_month_year text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.rr_monthly_city_revenue%rowtype;
  v_pool integer;
  v_count integer;
  v_each integer;
begin
  select * into v_row
  from public.rr_monthly_city_revenue
  where city = trim(p_city)
    and month_year = p_month_year
  for update;

  if not found then
    raise exception 'No revenue row for % / %', p_city, p_month_year;
  end if;

  if v_row.is_distributed then
    raise exception 'Bonus already distributed for % / %', p_city, p_month_year;
  end if;

  v_pool := greatest(0, (v_row.total_gross_revenue * 2) / 100);

  select count(*)::integer into v_count
  from public.rr_drivers
  where is_founding_driver = true
    and is_active = true
    and home_city = trim(p_city);

  if v_count is null or v_count < 1 then
    raise exception 'No founding drivers for city %', p_city;
  end if;

  v_each := v_pool / v_count;

  update public.rr_drivers
  set accumulated_bonus_balance = accumulated_bonus_balance + v_each
  where is_founding_driver = true
    and is_active = true
    and home_city = trim(p_city);

  update public.rr_monthly_city_revenue
  set
    bonus_pool_amount = v_pool,
    is_distributed = true,
    updated_at = now()
  where id = v_row.id;

  return jsonb_build_object(
    'city', trim(p_city),
    'month_year', p_month_year,
    'total_gross_revenue_cents', v_row.total_gross_revenue,
    'bonus_pool_cents', v_pool,
    'founding_driver_count', v_count,
    'bonus_each_cents', v_each
  );
end;
$$;

revoke all on function public.rr_distribute_city_bonus(text, text) from public;
grant execute on function public.rr_distribute_city_bonus(text, text) to service_role;
