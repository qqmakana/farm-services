-- Public bucket for shop product photos (digital menu).
-- Run in Supabase SQL editor if product photo upload fails with "bucket not found".

insert into storage.buckets (id, name, public)
values ('shop-products', 'shop-products', true)
on conflict (id) do update set public = true;

drop policy if exists "shop_products_public_read" on storage.objects;
create policy "shop_products_public_read"
on storage.objects for select
using (bucket_id = 'shop-products');

drop policy if exists "shop_products_owner_write" on storage.objects;
create policy "shop_products_owner_write"
on storage.objects for insert
with check (
  bucket_id = 'shop-products'
  and auth.role() = 'authenticated'
);
