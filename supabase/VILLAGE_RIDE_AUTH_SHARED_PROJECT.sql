-- Shared Auth with TenderMatch: solarcouple@gmail.com uses Google (+ email).
-- Village Ride login: prefer "Continue with Google".
--
-- Supabase → Authentication → URL Configuration → Redirect URLs, ADD:
--   https://village-ride.vercel.app/**
--   https://village-ride.vercel.app/auth/callback
-- (Keep TenderMatch URLs. Site URL can stay TenderMatch.)
--
-- After first Google login to Village Ride, grant admin:

insert into public.rr_profiles (id, full_name, role)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', 'Ops Admin'), 'admin'::public.rr_user_role
from auth.users u
where lower(u.email) = 'solarcouple@gmail.com'
on conflict (id) do update
set role = 'admin'::public.rr_user_role;

select u.email, p.role, u.raw_app_meta_data->>'provider' as provider
from auth.users u
left join public.rr_profiles p on p.id = u.id
where lower(u.email) = 'solarcouple@gmail.com';
