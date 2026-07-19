-- Optional vehicle details for driver account tab
-- Run once in Supabase SQL Editor

alter table public.rr_drivers
  add column if not exists vehicle_registration text;

alter table public.rr_drivers
  add column if not exists vehicle_year integer;
