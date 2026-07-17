-- =============================================================================
-- Rural Ride — run this AFTER PASTE_ME.sql (shared project)
-- Gives anon/authenticated access to rr_* tables (RLS still applies)
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select on public.rr_fare_rules to anon, authenticated, service_role;
grant select on public.rr_shops to anon, authenticated, service_role;
grant select on public.rr_products to anon, authenticated, service_role;
grant select on public.rr_drivers to anon, authenticated, service_role;
grant select on public.rr_jobs to anon, authenticated, service_role;
grant select on public.rr_job_applications to anon, authenticated, service_role;
grant select on public.rr_ratings to anon, authenticated, service_role;
grant select on public.rr_profiles to authenticated, service_role;
grant select on public.rr_sos_events to authenticated, service_role;
grant select, insert, update on public.rr_payment_events to service_role;

grant insert, update, delete on public.rr_shops to authenticated, service_role;
grant insert, update, delete on public.rr_products to authenticated, service_role;
grant insert, update, delete on public.rr_drivers to authenticated, service_role;
grant insert, update, delete on public.rr_jobs to authenticated, service_role;
grant insert, update, delete on public.rr_job_applications to authenticated, service_role;
grant insert, update, delete on public.rr_ratings to authenticated, service_role;
grant insert, update, delete on public.rr_sos_events to authenticated, service_role;
grant insert, update on public.rr_profiles to authenticated, service_role;

-- service_role needs full access for matching / webhooks (bypasses RLS anyway, but grants help)
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
