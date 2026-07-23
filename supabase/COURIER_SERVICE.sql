-- Add courier to Village Ride service types
-- Run once in Supabase SQL Editor (production).

do $$ begin
  alter type public.rr_service_type add value 'courier';
exception
  when duplicate_object then null;
end $$;

comment on type public.rr_service_type is
  'ride | delivery | farm | courier — courier = person-to-person packages';
