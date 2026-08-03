-- Village Pass (R99/month) — waives R5 rider booking fee only.
-- Driver fare (base + km) stays sacred. Run in Supabase SQL Editor.

create table if not exists public.rr_rider_subscriptions (
  id uuid primary key default gen_random_uuid(),
  -- Guest riders are phone-keyed; auth users may also set user_id
  phone text not null,
  user_id uuid null references auth.users (id) on delete set null,
  country_code text not null default 'ZA',
  subscription_status text not null default 'none'
    check (subscription_status in ('none', 'active', 'cancelled', 'expired', 'approval_pending')),
  subscription_tier text not null default 'village_pass',
  subscription_expires_at timestamptz null,
  paypal_subscription_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists rr_rider_subscriptions_phone_uidx
  on public.rr_rider_subscriptions (phone);

create unique index if not exists rr_rider_subscriptions_paypal_uidx
  on public.rr_rider_subscriptions (paypal_subscription_id)
  where paypal_subscription_id is not null;

create index if not exists rr_rider_subscriptions_user_idx
  on public.rr_rider_subscriptions (user_id);

alter table public.rr_rider_subscriptions enable row level security;

-- Riders can read their own row by auth uid (phone matching is server-side via service role)
drop policy if exists "rr_rider_subscriptions_select_own" on public.rr_rider_subscriptions;
create policy "rr_rider_subscriptions_select_own"
  on public.rr_rider_subscriptions for select
  using (auth.uid() = user_id);

-- Service role / server actions handle inserts & updates

create or replace function public.is_user_subscribed(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rr_rider_subscriptions s
    where s.user_id = p_user_id
      and s.subscription_status = 'active'
      and (s.subscription_expires_at is null or s.subscription_expires_at > now())
  );
$$;

create or replace function public.is_phone_subscribed(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rr_rider_subscriptions s
    where s.phone = p_phone
      and s.subscription_status = 'active'
      and (s.subscription_expires_at is null or s.subscription_expires_at > now())
  );
$$;

grant execute on function public.is_user_subscribed(uuid) to authenticated, anon, service_role;
grant execute on function public.is_phone_subscribed(text) to authenticated, anon, service_role;

-- Job flags for priority matching + fee audit
alter table public.rr_jobs
  add column if not exists booking_fee numeric(12, 2) not null default 0;

alter table public.rr_jobs
  add column if not exists priority_score integer not null default 0;

alter table public.rr_jobs
  add column if not exists village_pass boolean not null default false;

comment on column public.rr_jobs.booking_fee is
  'Platform booking fee paid by rider (R5 ZA default). 0 when Village Pass active. Driver fare is separate.';
comment on column public.rr_jobs.priority_score is
  '1 = Village Pass subscriber job (dispatch first), 0 = standard.';
comment on column public.rr_jobs.village_pass is
  'True when booked under an active Village Pass (R0 booking fee + priority).';
