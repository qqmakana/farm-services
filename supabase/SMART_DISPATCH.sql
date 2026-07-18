-- Phase 1: Smart Dispatch scoring metrics
-- Run once in Supabase SQL Editor (after PERFECT_UPGRADE.sql)

-- Driver reliability counters (acceptance rate = accepted / received)
alter table public.rr_drivers
  add column if not exists offers_received integer not null default 0;
alter table public.rr_drivers
  add column if not exists offers_accepted integer not null default 0;
alter table public.rr_drivers
  add column if not exists offers_declined integer not null default 0;

-- Audit trail on the job: why this driver won
alter table public.rr_jobs
  add column if not exists match_score numeric(8, 2);
alter table public.rr_jobs
  add column if not exists match_breakdown jsonb;

comment on column public.rr_drivers.offers_received is
  'Times this driver was offered a job (pending upsert).';
comment on column public.rr_drivers.offers_accepted is
  'Times this driver accepted (or was auto-assigned).';
comment on column public.rr_drivers.offers_declined is
  'Times this driver declined / withdrew an offer.';
comment on column public.rr_jobs.match_score is
  'Smart-dispatch total score of the assigned driver at match time.';
comment on column public.rr_jobs.match_breakdown is
  'JSON breakdown: vehicle, opt_in, rating, acceptance, proximity, verified.';
