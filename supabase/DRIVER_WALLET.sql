-- Driver wallet & platform commission (customer pays driver; driver owes Village Ride)
-- Run once in Supabase SQL Editor after AUTO_DISPATCH.sql

alter table public.rr_drivers
  add column if not exists wallet_balance numeric(12, 2) not null default 0;

alter table public.rr_drivers
  add column if not exists commission_owed numeric(12, 2) not null default 0;

comment on column public.rr_drivers.wallet_balance is
  'Prepaid commission wallet. Deducted on trip complete. < 0 blocks auto-dispatch.';
comment on column public.rr_drivers.commission_owed is
  'Absolute debt when wallet_balance is negative (same as abs(min(0, wallet_balance))).';
