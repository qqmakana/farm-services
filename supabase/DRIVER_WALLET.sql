-- Driver wallet — Post-Paid / Earn First (SHARED PROJECT: rr_* only)
-- Run once in Supabase SQL Editor after AUTO_DISPATCH.sql
--
-- Business rules:
--   • New drivers start at wallet_balance = 0 (no deposit).
--   • Cash complete: deduct platform fee; balance may go negative.
--   • Card complete: credit payout only (does not create debt).
--   • Hard credit limit enforced in app: −R100 ZA (scaled per country).
--   • Below the floor → blocked from go-online, accept, and dispatch offers.

alter table public.rr_drivers
  add column if not exists wallet_balance numeric(12, 2) not null default 0;

alter table public.rr_drivers
  add column if not exists commission_owed numeric(12, 2) not null default 0;

comment on column public.rr_drivers.wallet_balance is
  'Village Ride post-paid wallet. Start 0. Cash fees deduct (may go negative to credit limit). App blocks below −R100 ZA (scaled).';
comment on column public.rr_drivers.commission_owed is
  'Absolute debt when wallet_balance is negative (same as abs(min(0, wallet_balance))).';
