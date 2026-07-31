-- Run once — fixes permission denied on rr_rider_wear_logs
grant select on public.rr_rider_wear_logs to anon, authenticated, service_role;
grant insert, update, delete on public.rr_rider_wear_logs to service_role;
