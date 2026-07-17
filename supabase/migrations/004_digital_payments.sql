-- Uber-style digital payments (card / wallet). No cash as product path.

create type public.payment_method as enum ('card', 'wallet');

alter table public.jobs
  add column if not exists payment_method public.payment_method,
  add column if not exists card_last4 text,
  add column if not exists paid_at timestamptz;

-- Prefer online-paid jobs going forward
comment on column public.jobs.payment_status is
  'Use paid_online for card/wallet. cash_collected is legacy — not offered in-app.';
