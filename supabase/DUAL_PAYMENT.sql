-- Dual payment: cash confirmation fields + ensure paypal/card/cash methods
-- Run once in Supabase SQL Editor after DRIVER_WALLET.sql / ADD_CASH_PAYMENT.sql

-- Cash collection confirmation on complete
alter table public.rr_jobs
  add column if not exists cash_collected_confirmed boolean;

alter table public.rr_jobs
  add column if not exists cash_confirmed_at timestamptz;

comment on column public.rr_jobs.cash_collected_confirmed is
  'Driver confirmed rider paid cash at complete. false = flagged for ops; null = not a cash settle or pending.';
comment on column public.rr_jobs.cash_confirmed_at is
  'When the driver answered the cash-collected prompt.';

-- Payment method enum values (safe if already present)
do $$ begin
  alter type public.rr_payment_method add value if not exists 'cash';
exception when others then null;
end $$;

do $$ begin
  alter type public.rr_payment_method add value if not exists 'paypal';
exception when others then null;
end $$;

do $$ begin
  alter type public.rr_payment_method add value if not exists 'card';
exception when others then null;
end $$;

alter table public.rr_jobs
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text;

-- Driver wallet columns (idempotent)
alter table public.rr_drivers
  add column if not exists wallet_balance numeric(12, 2) not null default 0;

alter table public.rr_drivers
  add column if not exists commission_owed numeric(12, 2) not null default 0;

comment on column public.rr_drivers.wallet_balance is
  'Cash trips: deduct ~15% on complete. Card trips: credit ~85% payout on complete. Below -50 blocks going online / dispatch.';
