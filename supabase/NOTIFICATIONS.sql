-- Unified in-app inbox (riders, drivers, admin) + reusable rider FCM tokens.
-- Run in the Supabase SQL editor. Partner shops keep rr_partner_notifications.
-- Service-role server actions write these rows (Hobby-safe — no extra cron).

create table if not exists public.rr_notifications (
  id uuid primary key default gen_random_uuid(),
  audience text not null,
  rider_phone text,
  driver_id uuid references public.rr_drivers (id) on delete cascade,
  shop_id uuid references public.rr_shops (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  job_id uuid references public.rr_jobs (id) on delete set null,
  shop_order_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint rr_notifications_audience_check check (
    audience in ('rider', 'driver', 'shop', 'admin')
  )
);

create index if not exists rr_notifications_rider_idx
  on public.rr_notifications (rider_phone, created_at desc)
  where audience = 'rider' and rider_phone is not null;

create index if not exists rr_notifications_driver_idx
  on public.rr_notifications (driver_id, created_at desc)
  where audience = 'driver' and driver_id is not null;

create index if not exists rr_notifications_admin_idx
  on public.rr_notifications (created_at desc)
  where audience = 'admin';

create index if not exists rr_notifications_unread_idx
  on public.rr_notifications (audience, created_at desc)
  where read_at is null;

create table if not exists public.rr_push_tokens (
  id uuid primary key default gen_random_uuid(),
  audience text not null,
  rider_phone text,
  driver_id uuid references public.rr_drivers (id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now(),
  constraint rr_push_tokens_audience_check check (
    audience in ('rider', 'driver', 'shop', 'admin')
  )
);

create unique index if not exists rr_push_tokens_rider_uidx
  on public.rr_push_tokens (audience, rider_phone)
  where audience = 'rider' and rider_phone is not null;

create unique index if not exists rr_push_tokens_driver_uidx
  on public.rr_push_tokens (audience, driver_id)
  where audience = 'driver' and driver_id is not null;

alter table public.rr_notifications enable row level security;
alter table public.rr_push_tokens enable row level security;

-- Shop partner inbox: extra event types (cancelled / payment)
alter table public.rr_partner_notifications
  drop constraint if exists rr_partner_notifications_type_check;

alter table public.rr_partner_notifications
  add constraint rr_partner_notifications_type_check check (
    type in (
      'order_created',
      'driver_assigned',
      'order_completed',
      'order_cancelled',
      'payment_received',
      'weekly_report',
      'referral',
      'system'
    )
  );

comment on table public.rr_notifications is
  'In-app inbox for riders, drivers, and admin. Push still uses free FCM.';
comment on table public.rr_push_tokens is
  'Reusable FCM tokens (rider by phone, driver by id). Job-level tokens remain on rr_jobs.';
