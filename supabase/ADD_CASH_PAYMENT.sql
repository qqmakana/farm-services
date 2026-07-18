-- Run once in Supabase SQL Editor (shared project uses rr_ prefix).
-- Adds cash as a payment method for Village Ride jobs.

do $$ begin
  alter type public.rr_payment_method add value if not exists 'cash';
exception
  when duplicate_object then null;
end $$;
