-- Village Ride global expansion (22 countries)
-- Extends rr_countries + motorcycle vehicle type.
-- Run once in Supabase SQL Editor (production).

-- Motorcycle / boda / okada / auto / tuk-tuk class
do $$ begin
  alter type public.rr_vehicle_type add value 'motorcycle';
exception
  when duplicate_object then null;
end $$;

-- Enrich countries reference table
alter table public.rr_countries
  add column if not exists min_fare integer,
  add column if not exists per_km_rate integer,
  add column if not exists currency_symbol text,
  add column if not exists payment_methods text[] default array['Cash']::text[],
  add column if not exists languages text[] default array['en']::text[],
  add column if not exists service_types text[] default array['ride','delivery','farm','courier']::text[];

-- currency_symbol may already exist from MULTI_COUNTRY.sql
alter table public.rr_countries
  add column if not exists flag text;

insert into public.rr_countries (
  code, name, currency, currency_symbol, phone_prefix, language, enabled,
  min_fare, per_km_rate, payment_methods, languages, service_types, flag
)
values
  ('ZA', 'South Africa', 'ZAR', 'R', '27', 'xh', true, 30, 10,
    array['Cash','PayPal','EFT'], array['en','af','xh','zu'],
    array['ride','delivery','farm','courier'], '🇿🇦'),
  ('KE', 'Kenya', 'KES', 'KSh', '254', 'sw', true, 300, 100,
    array['Cash','M-Pesa'], array['en','sw'],
    array['ride','delivery','farm','courier','boda'], '🇰🇪'),
  ('NG', 'Nigeria', 'NGN', '₦', '234', 'yo', true, 1500, 500,
    array['Cash','Bank Transfer'], array['en','ha','yo','ig'],
    array['ride','delivery','farm','courier','okada'], '🇳🇬'),
  ('GH', 'Ghana', 'GHS', 'GH₵', '233', 'ak', true, 20, 7,
    array['Cash','MTN MoMo'], array['en','tw'],
    array['ride','delivery','farm','courier'], '🇬🇭'),
  ('TZ', 'Tanzania', 'TZS', 'TSh', '255', 'sw', true, 5000, 1500,
    array['Cash','M-Pesa'], array['en','sw'],
    array['ride','delivery','farm','courier','boda'], '🇹🇿'),
  ('KZ', 'Kazakhstan', 'KZT', '₸', '7', 'kk', true, 800, 200,
    array['Cash','Kaspi.kz'], array['kk','ru','en'],
    array['ride','delivery','courier'], '🇰🇿'),
  ('NA', 'Namibia', 'NAD', 'N$', '264', 'en', true, 30, 10,
    array['Cash'], array['en'],
    array['ride','delivery','farm','courier'], '🇳🇦'),
  ('BW', 'Botswana', 'BWP', 'P', '267', 'en', true, 25, 8,
    array['Cash'], array['en'],
    array['ride','delivery','farm','courier'], '🇧🇼'),
  ('EG', 'Egypt', 'EGP', 'E£', '20', 'ar', true, 100, 30,
    array['Cash'], array['ar','en'],
    array['ride','delivery','courier'], '🇪🇬'),
  ('PK', 'Pakistan', 'PKR', '₨', '92', 'ur', true, 500, 150,
    array['Cash','Bank Transfer'], array['ur','en'],
    array['ride','delivery','courier'], '🇵🇰'),
  ('BR', 'Brazil', 'BRL', 'R$', '55', 'pt', true, 15, 5,
    array['Cash','Pix'], array['pt','en'],
    array['ride','delivery','courier'], '🇧🇷'),
  ('IN', 'India', 'INR', '₹', '91', 'hi', true, 100, 30,
    array['Cash','UPI'], array['en','hi','ta','te'],
    array['ride','delivery','courier','auto'], '🇮🇳'),
  ('PH', 'Philippines', 'PHP', '₱', '63', 'tl', true, 100, 30,
    array['Cash','GCash'], array['en','tl'],
    array['ride','delivery','courier','tricycle'], '🇵🇭'),
  ('MX', 'Mexico', 'MXN', '$', '52', 'es', true, 80, 25,
    array['Cash'], array['es','en'],
    array['ride','delivery','courier'], '🇲🇽'),
  ('ID', 'Indonesia', 'IDR', 'Rp', '62', 'id', true, 15000, 5000,
    array['Cash','GoPay','OVO'], array['id','en'],
    array['ride','delivery','courier'], '🇮🇩'),
  ('VN', 'Vietnam', 'VND', '₫', '84', 'vi', true, 50000, 15000,
    array['Cash','MoMo'], array['vi','en'],
    array['ride','delivery','courier'], '🇻🇳'),
  ('TH', 'Thailand', 'THB', '฿', '66', 'th', true, 60, 20,
    array['Cash','PromptPay'], array['th','en'],
    array['ride','delivery','courier','tuktuk'], '🇹🇭'),
  ('CO', 'Colombia', 'COP', '$', '57', 'es', true, 8000, 2500,
    array['Cash'], array['es','en'],
    array['ride','delivery','courier'], '🇨🇴'),
  ('PE', 'Peru', 'PEN', 'S/', '51', 'es', true, 15, 5,
    array['Cash'], array['es','en'],
    array['ride','delivery','courier'], '🇵🇪'),
  ('UZ', 'Uzbekistan', 'UZS', 'so''m', '998', 'uz', true, 8000, 2500,
    array['Cash'], array['uz','ru','en'],
    array['ride','delivery','courier'], '🇺🇿'),
  ('KG', 'Kyrgyzstan', 'KGS', 'som', '996', 'ky', true, 150, 50,
    array['Cash'], array['ky','ru','en'],
    array['ride','delivery','courier'], '🇰🇬'),
  ('MN', 'Mongolia', 'MNT', '₮', '976', 'mn', true, 3000, 1000,
    array['Cash'], array['mn','en'],
    array['ride','delivery','courier'], '🇲🇳')
on conflict (code) do update set
  name = excluded.name,
  currency = excluded.currency,
  currency_symbol = excluded.currency_symbol,
  phone_prefix = excluded.phone_prefix,
  language = excluded.language,
  enabled = excluded.enabled,
  min_fare = excluded.min_fare,
  per_km_rate = excluded.per_km_rate,
  payment_methods = excluded.payment_methods,
  languages = excluded.languages,
  service_types = excluded.service_types,
  flag = excluded.flag;

-- Optional fare rule row for motorcycle (ZA default; app uses country pricing)
insert into public.rr_fare_rules (vehicle_type, base_fare, per_km, platform_commission_pct)
values ('motorcycle'::public.rr_vehicle_type, 25, 8, 15)
on conflict (vehicle_type) do nothing;

-- Allow motorcycle on any check constraints that list vehicle types (safe no-op if absent)
do $$ begin
  alter table public.rr_drivers drop constraint if exists rr_drivers_vehicle_type_check;
exception when undefined_table then null;
end $$;

comment on table public.rr_countries is
  'Village Ride markets — app config in src/lib/countries.ts is source of truth for UI';
