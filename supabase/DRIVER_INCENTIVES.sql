-- =============================================================================
-- Weekly trip bonus claims (e.g. 10 trips → R100 wallet credit)
-- Run in Supabase → SQL Editor
-- =============================================================================

create table if not exists public.rr_driver_incentive_claims (
  driver_id uuid not null references public.rr_drivers (id) on delete cascade,
  period_key text not null,
  bonus_amount integer not null,
  trips_required integer not null,
  trips_completed integer not null,
  claimed_at timestamptz not null default now(),
  primary key (driver_id, period_key)
);

alter table public.rr_driver_incentive_claims enable row level security;

grant select, insert, update, delete on public.rr_driver_incentive_claims to service_role;

comment on table public.rr_driver_incentive_claims is
  'Idempotent weekly driver trip bonuses credited to commission wallet.';
