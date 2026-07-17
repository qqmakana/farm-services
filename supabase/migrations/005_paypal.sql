-- PayPal as primary payment method

do $$ begin
  alter type public.payment_method add value if not exists 'paypal';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- If payment_method enum was never created as enum with only card/wallet:
do $$ begin
  create type public.payment_method as enum ('paypal', 'card', 'wallet');
exception
  when duplicate_object then null;
end $$;

alter table public.jobs
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text;
