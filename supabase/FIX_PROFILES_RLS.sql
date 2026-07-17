-- Fix infinite recursion on rr_profiles (run in SQL Editor → Run)
drop policy if exists "rr_profiles_select_own" on public.rr_profiles;
create policy "rr_profiles_select_own" on public.rr_profiles
  for select using (auth.uid() = id);

drop policy if exists "rr_profiles_update_own" on public.rr_profiles;
create policy "rr_profiles_update_own" on public.rr_profiles
  for update using (auth.uid() = id);

-- Helper so dispatcher policies don't recurse on rr_profiles
create or replace function public.rr_is_dispatcher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rr_profiles p
    where p.id = auth.uid() and p.role in ('dispatcher', 'admin')
  );
$$;

revoke all on function public.rr_is_dispatcher() from public;
grant execute on function public.rr_is_dispatcher() to authenticated, anon, service_role;

-- Rebuild job/dispatch policies to use the helper (no recursion)
drop policy if exists "rr_jobs_dispatcher_all" on public.rr_jobs;
create policy "rr_jobs_dispatcher_all" on public.rr_jobs for all
  using (public.rr_is_dispatcher())
  with check (public.rr_is_dispatcher());

drop policy if exists "rr_sos_dispatch_read" on public.rr_sos_events;
create policy "rr_sos_dispatch_read" on public.rr_sos_events for select
  using (public.rr_is_dispatcher());

drop policy if exists "rr_apps_driver_rw" on public.rr_job_applications;
create policy "rr_apps_driver_rw" on public.rr_job_applications for all using (
  exists (select 1 from public.rr_drivers d where d.user_id = auth.uid() and d.id = driver_id)
  or public.rr_is_dispatcher()
) with check (
  exists (select 1 from public.rr_drivers d where d.user_id = auth.uid() and d.id = driver_id)
  or public.rr_is_dispatcher()
);
