-- Run once in Supabase SQL Editor after ADD_CASH_PAYMENT.sql
-- Driver niche opt-ins + document fields + private storage for ID/license uploads

-- Niche preferences (default ON so existing drivers keep receiving jobs)
alter table public.rr_drivers
  add column if not exists prefer_night boolean not null default true;
alter table public.rr_drivers
  add column if not exists prefer_heavy boolean not null default true;
alter table public.rr_drivers
  add column if not exists prefer_village_routes boolean not null default true;

-- Trust documents
alter table public.rr_drivers
  add column if not exists license_number text;
alter table public.rr_drivers
  add column if not exists id_doc_url text;
alter table public.rr_drivers
  add column if not exists license_doc_url text;
alter table public.rr_drivers
  add column if not exists docs_submitted_at timestamptz;

-- Private bucket for driver ID / license photos (uploads via service role only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rr-driver-docs',
  'rr-driver-docs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;
