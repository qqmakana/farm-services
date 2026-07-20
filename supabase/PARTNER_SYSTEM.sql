-- Partner system (Village Ride) — self-serve businesses
-- Run in Supabase SQL editor after existing schema.
-- Data stays on Supabase (free). Push stays on FCM. No WhatsApp API.

-- Referral tracking on shops
alter table public.rr_shops
  add column if not exists referral_code text;

alter table public.rr_shops
  add column if not exists referred_by_shop_id uuid references public.rr_shops (id) on delete set null;

create unique index if not exists rr_shops_referral_code_uidx
  on public.rr_shops (upper(referral_code))
  where referral_code is not null;

create index if not exists rr_shops_referred_by_idx
  on public.rr_shops (referred_by_shop_id)
  where referred_by_shop_id is not null;

-- Merchant / user FCM for in-app + push (free FCM)
alter table public.rr_profiles
  add column if not exists fcm_token text;

alter table public.rr_profiles
  add column if not exists fcm_updated_at timestamptz;

-- In-app notification inbox for partners
create table if not exists public.rr_partner_notifications (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.rr_shops (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  email_body text,
  job_id uuid references public.rr_jobs (id) on delete set null,
  report_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint rr_partner_notifications_type_check check (
    type in (
      'order_created',
      'driver_assigned',
      'order_completed',
      'weekly_report',
      'referral',
      'system'
    )
  )
);

create index if not exists rr_partner_notifications_shop_created_idx
  on public.rr_partner_notifications (shop_id, created_at desc);

create index if not exists rr_partner_notifications_unread_idx
  on public.rr_partner_notifications (shop_id)
  where read_at is null;

-- Auto-generated weekly partner reports
create table if not exists public.rr_partner_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.rr_shops (id) on delete cascade,
  week_start date not null,
  week_end date not null,
  week_key text not null,
  orders_total int not null default 0,
  orders_completed int not null default 0,
  orders_cancelled int not null default 0,
  revenue_total numeric(12, 2) not null default 0,
  platform_commission_total numeric(12, 2) not null default 0,
  referral_signups int not null default 0,
  summary_text text not null,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint rr_partner_weekly_reports_shop_week unique (shop_id, week_key)
);

create index if not exists rr_partner_weekly_reports_shop_idx
  on public.rr_partner_weekly_reports (shop_id, week_key desc);

-- Link notifications → reports (optional FK after both tables exist)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'rr_partner_notifications_report_id_fkey'
  ) then
    alter table public.rr_partner_notifications
      add constraint rr_partner_notifications_report_id_fkey
      foreign key (report_id) references public.rr_partner_weekly_reports (id)
      on delete set null;
  end if;
end $$;

-- Backfill referral codes for existing shops
update public.rr_shops
set referral_code =
  upper(left(regexp_replace(coalesce(name, 'SHOP'), '[^A-Za-z0-9]', '', 'g') || 'SHOP', 4))
  || substr(md5(id::text || random()::text), 1, 3)
where referral_code is null;

alter table public.rr_partner_notifications enable row level security;
alter table public.rr_partner_weekly_reports enable row level security;

-- Owner read/write own shop notifications
drop policy if exists "rr_partner_notifications_owner" on public.rr_partner_notifications;
create policy "rr_partner_notifications_owner"
  on public.rr_partner_notifications
  for all
  using (
    exists (
      select 1 from public.rr_shops s
      where s.id = shop_id and s.user_id = auth.uid()
    )
    or exists (
      select 1 from public.rr_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'dispatcher')
    )
  )
  with check (
    exists (
      select 1 from public.rr_shops s
      where s.id = shop_id and s.user_id = auth.uid()
    )
    or exists (
      select 1 from public.rr_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'dispatcher')
    )
  );

drop policy if exists "rr_partner_weekly_reports_owner" on public.rr_partner_weekly_reports;
create policy "rr_partner_weekly_reports_owner"
  on public.rr_partner_weekly_reports
  for select
  using (
    exists (
      select 1 from public.rr_shops s
      where s.id = shop_id and s.user_id = auth.uid()
    )
    or exists (
      select 1 from public.rr_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'dispatcher')
    )
  );

comment on column public.rr_shops.referral_code is
  'Partner invite code: first 4 of business name + 3 random chars';
comment on table public.rr_partner_notifications is
  'In-app partner inbox (email body stored; push via FCM)';
comment on table public.rr_partner_weekly_reports is
  'Auto weekly partner summaries — free tier, no paid email required';
