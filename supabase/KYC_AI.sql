-- Phase 2: Automated KYC (AI document scan results)
-- Run once in Supabase SQL Editor after PERFECT_UPGRADE.sql

alter table public.rr_drivers
  add column if not exists kyc_status text not null default 'none';

alter table public.rr_drivers
  add column if not exists kyc_checked_at timestamptz;

alter table public.rr_drivers
  add column if not exists kyc_name_on_docs text;

alter table public.rr_drivers
  add column if not exists kyc_id_number text;

alter table public.rr_drivers
  add column if not exists kyc_license_expiry date;

alter table public.rr_drivers
  add column if not exists kyc_issues jsonb not null default '[]'::jsonb;

alter table public.rr_drivers
  add column if not exists kyc_raw jsonb;

comment on column public.rr_drivers.kyc_status is
  'none | pending | auto_approved | needs_review | rejected | manual_approved';
comment on column public.rr_drivers.kyc_issues is
  'Array of human-readable AI KYC flags for ops.';
comment on column public.rr_drivers.kyc_raw is
  'Full OCR/extraction payload for audit.';

-- Optional: constrain known statuses (ignore if constraint already exists)
do $$
begin
  alter table public.rr_drivers
    add constraint rr_drivers_kyc_status_check
    check (
      kyc_status in (
        'none',
        'pending',
        'auto_approved',
        'needs_review',
        'rejected',
        'manual_approved'
      )
    );
exception
  when duplicate_object then null;
end $$;
