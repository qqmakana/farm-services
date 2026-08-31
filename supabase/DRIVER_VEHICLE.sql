-- Optional vehicle details for driver account tab
-- Run once in Supabase SQL Editor

alter table public.rr_drivers
  add column if not exists vehicle_registration text;

alter table public.rr_drivers
  add column if not exists vehicle_year integer;

-- Matching class: sedan | motorcycle | bakkie | truck
-- ADD COLUMN is a no-op if vehicle_type already exists (enum or text).
alter table public.rr_drivers
  add column if not exists vehicle_type text default 'sedan';

alter table public.rr_drivers
  alter column vehicle_type set default 'sedan';

update public.rr_drivers
set vehicle_type = 'sedan'
where vehicle_type is null
   or btrim(vehicle_type::text) = '';

-- Motorcycle on enum-backed DBs (no-op if already present)
do $$ begin
  alter type public.rr_vehicle_type add value if not exists 'motorcycle';
exception when others then null;
end $$;

do $$ begin
  alter table public.rr_drivers drop constraint if exists rr_drivers_vehicle_type_check;
exception when others then null;
end $$;

-- Food-delivery test driver → motorcycle (phone from mock Lebo Shops Bike).
-- Also match notes that say food/shops bike.
update public.rr_drivers
set vehicle_type = 'motorcycle'
where phone in ('27827770000', '0827770000')
   or lower(coalesce(notes, '')) like '%food delivery%';

