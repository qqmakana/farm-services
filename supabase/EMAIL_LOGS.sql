-- Additive: email audit trail (run if PRODUCTION_OPS.sql already applied without this)
create table if not exists public.rr_email_logs (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text,
  template text,
  via text not null default 'webhook',
  sent_at timestamptz not null default now()
);

create index if not exists rr_email_logs_sent_idx
  on public.rr_email_logs (sent_at desc);

alter table public.rr_email_logs enable row level security;

drop policy if exists "rr_email_logs_admin" on public.rr_email_logs;
create policy "rr_email_logs_admin" on public.rr_email_logs
  for select using (
    exists (
      select 1 from public.rr_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'dispatcher')
    )
  );
