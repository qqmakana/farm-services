-- Village Ride + another app share one Supabase Auth project.
-- Password emails default to Site URL (often the other app).
-- Fix redirects so Village Ride recovery stays on Village Ride.
--
-- In Supabase Dashboard (not SQL):
-- 1) Authentication → URL Configuration
-- 2) Keep Site URL as your main app if you want (e.g. TenderMatch)
-- 3) Under Redirect URLs, ADD (do not remove the other app):
--      https://village-ride.vercel.app/**
--      https://village-ride.vercel.app/auth/callback
--      http://localhost:3000/**
--      http://localhost:3000/auth/callback
-- 4) Save
--
-- To set a password WITHOUT email (avoids landing on the other app):
-- Authentication → Users → solarcouple@gmail.com → reset / set password
--
-- Then make that user Village Ride admin:

insert into public.rr_profiles (id, full_name, role)
select u.id, 'Ops Admin', 'admin'::public.rr_user_role
from auth.users u
where lower(u.email) = 'solarcouple@gmail.com'
on conflict (id) do update
set role = 'admin'::public.rr_user_role;

select u.email, p.role
from auth.users u
left join public.rr_profiles p on p.id = u.id
where lower(u.email) = 'solarcouple@gmail.com';
