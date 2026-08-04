-- Village Ride — Uber Eats-style shop orders (shared-project safe: rr_* only)
-- Run in Supabase SQL editor after PASTE_ME / existing rr_shops + rr_products.

-- Optional catalog images
ALTER TABLE public.rr_shops
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.rr_products
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE TABLE IF NOT EXISTS public.rr_shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE,
  shop_id uuid NOT NULL REFERENCES public.rr_shops (id) ON DELETE CASCADE,
  job_id uuid NULL REFERENCES public.rr_jobs (id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  delivery_lat double precision,
  delivery_lng double precision,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal integer NOT NULL DEFAULT 0,
  delivery_fee integer NOT NULL DEFAULT 15,
  total_amount integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rr_shop_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.rr_shop_orders (id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.rr_products (id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_purchase integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rr_shop_orders_shop_created_idx
  ON public.rr_shop_orders (shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rr_shop_orders_status_idx
  ON public.rr_shop_orders (status);
CREATE INDEX IF NOT EXISTS rr_shop_order_items_order_idx
  ON public.rr_shop_order_items (order_id);

ALTER TABLE public.rr_shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rr_shop_order_items ENABLE ROW LEVEL SECURITY;

-- Public read of active shops/products already covered elsewhere.
-- Service role / admin client used for order writes from server actions.
DROP POLICY IF EXISTS "rr_shop_orders_select_public_phone" ON public.rr_shop_orders;
CREATE POLICY "rr_shop_orders_select_public_phone"
  ON public.rr_shop_orders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "rr_shop_order_items_select" ON public.rr_shop_order_items;
CREATE POLICY "rr_shop_order_items_select"
  ON public.rr_shop_order_items FOR SELECT
  USING (true);
