-- =============================================================================
-- Describe Your Place — Farm saved places (+ optional photo column on jobs)
-- Run in Supabase SQL Editor after USER_LOCATIONS.sql
-- =============================================================================

alter table public.rr_saved_locations
  add column if not exists is_farm boolean not null default false;

comment on column public.rr_saved_locations.is_farm is
  'Personal Farm quick-pick (alongside Home / Work)';

alter table public.rr_jobs
  add column if not exists pickup_photo_url text;

comment on column public.rr_jobs.pickup_photo_url is
  'Optional photo of pickup spot (storage path or public URL)';
