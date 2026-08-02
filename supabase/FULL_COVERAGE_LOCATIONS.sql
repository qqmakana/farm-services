-- =============================================================================
-- Village Ride — full coverage: villages, towns, cities (landmarks + addresses)
-- Extends existing rr_locations — do NOT create a parallel locations table.
-- Run in Supabase → SQL Editor after USER_LOCATIONS.sql
-- =============================================================================

alter table public.rr_locations
  add column if not exists address text;

alter table public.rr_locations
  add column if not exists town text;

alter table public.rr_locations
  add column if not exists city text;

-- Allow "address" as a community category (street / building) alongside landmarks
alter table public.rr_locations drop constraint if exists rr_locations_category_check;
alter table public.rr_locations
  add constraint rr_locations_category_check
  check (category in ('shop', 'farm', 'landmark', 'home', 'other', 'address'));

comment on column public.rr_locations.village is
  'Area label — village, town, suburb, or city district (not villages-only).';
comment on column public.rr_locations.address is
  'Optional street / building address when known.';
comment on column public.rr_locations.town is
  'Optional town name.';
comment on column public.rr_locations.city is
  'Optional city name.';
comment on table public.rr_locations is
  'Community places — landmarks AND addresses for villages, towns, and cities.';
