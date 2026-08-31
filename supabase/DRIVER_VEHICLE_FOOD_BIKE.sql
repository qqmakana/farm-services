-- Run in a NEW SQL tab after DRIVER_VEHICLE.sql has finished.
-- Postgres enum: new value "motorcycle" must be committed before it can be used.

update public.rr_drivers
set vehicle_type = 'motorcycle'
where phone in ('27827770000', '0827770000')
   or lower(coalesce(notes, '')) like '%food delivery%';

-- If 0 rows, pick your food-test driver from this list and update by id:
-- select id, full_name, phone, vehicle_type, notes from public.rr_drivers;
