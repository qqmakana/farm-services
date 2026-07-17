-- Multi-sided marketplace: shops, products, driver job applications.
-- Run after 001 + 002.

create type public.application_status as enum (
  'pending',
  'accepted',
  'rejected',
  'withdrawn'
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  category text not null default 'general', -- furniture, appliances, grocery, farm
  landmark text not null,
  lat double precision,
  lng double precision,
  delivers boolean not null default true,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  -- delivery vehicle hint for bulky items
  size text not null default 'medium' check (size in ('small', 'medium', 'large', 'xl')),
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

create index products_shop_id_idx on public.products (shop_id);

-- Link shop orders onto the unified jobs ledger
alter table public.jobs
  add column if not exists shop_id uuid references public.shops (id) on delete set null;

alter table public.jobs
  add column if not exists product_summary text;

-- Drivers apply for open jobs (Uber Driver–style accept/apply)
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  status public.application_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  unique (job_id, driver_id)
);

create index job_applications_job_id_idx on public.job_applications (job_id);
create index job_applications_driver_id_idx on public.job_applications (driver_id);

alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.job_applications enable row level security;

create policy "Allow all shops (MVP)" on public.shops for all using (true) with check (true);
create policy "Allow all products (MVP)" on public.products for all using (true) with check (true);
create policy "Allow all applications (MVP)" on public.job_applications for all using (true) with check (true);

insert into public.shops (name, phone, category, landmark, lat, lng, notes) values
  (
    'Mthatha Home & Appliances',
    '0471112233',
    'appliances',
    'Opposite Boxer Superstore, Mthatha',
    -31.589,
    28.786,
    'Fridges, TVs, washing machines'
  ),
  (
    'Engcobo Furniture Mart',
    '0475556677',
    'furniture',
    'Main road Engcobo, next to Engen',
    -31.588,
    28.784,
    'Couches, beds, wardrobes'
  );

insert into public.products (shop_id, name, description, price, size)
select s.id, p.name, p.description, p.price, p.size
from public.shops s
cross join lateral (
  values
    ('Double-door fridge', 'Delivery needs truck', 6999::numeric, 'xl'),
    ('55 inch TV', 'Bakkie OK', 4499::numeric, 'medium'),
    ('3-seater couch', 'Needs bakkie or truck', 5200::numeric, 'large')
) as p(name, description, price, size)
where s.name = 'Mthatha Home & Appliances';

insert into public.products (shop_id, name, description, price, size)
select s.id, p.name, p.description, p.price, p.size
from public.shops s
cross join lateral (
  values
    ('Queen bed + base', 'Truck preferred', 4500::numeric, 'xl'),
    ('Wardrobe 3-door', 'Truck required', 3800::numeric, 'xl')
) as p(name, description, price, size)
where s.name = 'Engcobo Furniture Mart';
