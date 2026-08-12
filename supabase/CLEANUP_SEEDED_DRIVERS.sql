-- Remove seeded demo drivers from production.
-- Safe: only deletes known fake phones from PASTE_ME / local seed.
-- Run in Supabase → SQL Editor. Your real applications are NOT touched.

-- Optional: clear any jobs still pointing at these drivers first
update public.rr_jobs
set driver_id = null
where driver_id in (
  select id from public.rr_drivers
  where phone in ('27821234567', '27829876543', '27825551234')
);

delete from public.rr_drivers
where phone in ('27821234567', '27829876543', '27825551234')
   or full_name in ('Thabo Bakkie', 'Nomsa Go', 'Sipho Truck', 'Thabo Mbeki Bakkie', 'Nomsa Lift Club');

-- Confirm what's left
select full_name, phone, verification_status, approval_status, created_at
from public.rr_drivers
order by created_at desc;
