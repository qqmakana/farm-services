"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createProduct, registerMerchantShop } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { JobWithDriver, Product, Shop } from "@/lib/types";

export function ShopPortal({
  shops,
  products,
  jobs,
}: {
  shops: Shop[];
  products: Product[];
  jobs: JobWithDriver[];
}) {
  const router = useRouter();
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newShop, setNewShop] = useState({
    name: "",
    phone: "",
    category: "appliances",
    landmark: "",
    email: "",
    password: "",
    referral_code: "",
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    size: "medium" as "small" | "medium" | "large" | "xl",
  });

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setNewShop((s) => (s.referral_code ? s : { ...s, referral_code: ref }));
    }
  }, []);

  const shopProducts = useMemo(
    () => products.filter((p) => p.shop_id === shopId),
    [products, shopId],
  );
  const shopOrders = useMemo(
    () => jobs.filter((j) => j.shop_id === shopId),
    [jobs, shopId],
  );

  function registerShop(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const { shop, email } = await registerMerchantShop({
          name: newShop.name,
          phone: newShop.phone,
          category: newShop.category,
          landmark: newShop.landmark,
          email: newShop.email,
          password: newShop.password,
          referral_code: newShop.referral_code.trim() || null,
        });
        setShopId(shop.id);

        // Sign in so middleware lets them into /merchant/dashboard
        try {
          const supabase = createClient();
          const { error: signErr } = await supabase.auth.signInWithPassword({
            email,
            password: newShop.password,
          });
          if (!signErr) {
            setMessage(`Welcome, ${shop.name}. Opening merchant dashboard…`);
            window.location.assign("/merchant/dashboard");
            return;
          }
        } catch {
          /* fall through to login link */
        }

        setMessage(
          `Shop registered: ${shop.name}. Sign in with ${email} to open your dashboard.`,
        );
        setNewShop({
          name: "",
          phone: "",
          category: "appliances",
          landmark: "",
          email: "",
          password: "",
          referral_code: "",
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await createProduct({
          shop_id: shopId,
          name: newProduct.name,
          price: Number(newProduct.price) || 0,
          size: newProduct.size,
        });
        setMessage("Product added");
        setNewProduct({ name: "", price: "", size: "medium" });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
        <p className="text-sm text-slate-700">
          Already registered? Open your{" "}
          <strong>merchant dashboard</strong> to see shop orders.
        </p>
        <Link
          href="/login?next=/merchant/dashboard"
          className="rounded-lg bg-[#1A4D3A] px-4 py-2 text-sm font-bold text-white transition active:scale-95"
        >
          Merchant login
        </Link>
      </div>

      {message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Register as a merchant</h2>
        <p className="mt-1 text-sm text-slate-600">
          Creates a login with <strong>role=merchant</strong>, links your{" "}
          <code className="rounded bg-slate-100 px-1">rr_shops</code> record, and
          opens the business dashboard.
        </p>
        <form onSubmit={registerShop} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Business name"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newShop.name}
            onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
          />
          <input
            required
            placeholder="Phone"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newShop.phone}
            onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Business email (login)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newShop.email}
            onChange={(e) => setNewShop({ ...newShop, email: e.target.value })}
            autoComplete="username"
          />
          <input
            required
            type="password"
            placeholder="Password (min 8 chars)"
            minLength={8}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newShop.password}
            onChange={(e) =>
              setNewShop({ ...newShop, password: e.target.value })
            }
            autoComplete="new-password"
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newShop.category}
            onChange={(e) =>
              setNewShop({ ...newShop, category: e.target.value })
            }
          >
            <option value="farm">Farm (farmer)</option>
            <option value="appliances">Appliances shop</option>
            <option value="furniture">Furniture shop</option>
            <option value="grocery">Grocery shop</option>
            <option value="hardware">Hardware shop</option>
            <option value="general">General</option>
          </select>
          <input
            required
            placeholder="Landmark / address"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            value={newShop.landmark}
            onChange={(e) =>
              setNewShop({ ...newShop, landmark: e.target.value })
            }
          />
          <input
            placeholder="Referral code (optional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            value={newShop.referral_code}
            onChange={(e) =>
              setNewShop({ ...newShop, referral_code: e.target.value })
            }
          />
          <button
            type="submit"
            disabled={pending}
            className="ru-btn ru-btn-primary sm:col-span-2"
          >
            {pending ? "Creating account…" : "Create merchant account"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Your shops (catalog)</h2>
        <select
          className="ru-input mt-3 max-w-md"
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
        >
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.category}
            </option>
          ))}
        </select>

        <form onSubmit={addProduct} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            required
            placeholder="Product name"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
          />
          <input
            required
            placeholder="Price (R)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newProduct.size}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                size: e.target.value as typeof newProduct.size,
              })
            }
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xl">XL</option>
          </select>
          <button
            type="submit"
            disabled={pending || !shopId}
            className="ru-btn ru-btn-primary sm:col-span-3"
          >
            Add product
          </button>
        </form>

        <ul className="mt-4 divide-y divide-slate-100">
          {shopProducts.map((p) => (
            <li
              key={p.id}
              className="flex justify-between py-2 text-sm text-slate-700"
            >
              <span>
                {p.name} · {p.size}
              </span>
              <span className="font-semibold">{formatMoney(Number(p.price))}</span>
            </li>
          ))}
          {shopProducts.length === 0 ? (
            <li className="py-2 text-sm text-slate-500">No products yet.</li>
          ) : null}
        </ul>

        <h3 className="mt-6 text-sm font-semibold text-slate-800">
          Recent orders for this shop
        </h3>
        <ul className="mt-2 space-y-2">
          {shopOrders.slice(0, 5).map((j) => (
            <li key={j.id} className="text-sm text-slate-600">
              {j.reference_code} · {j.customer_name} ·{" "}
              {formatMoney(Number(j.fee_amount))}
            </li>
          ))}
          {shopOrders.length === 0 ? (
            <li className="text-sm text-slate-500">No orders yet.</li>
          ) : null}
        </ul>
        <Link
          href="/merchant/dashboard"
          className="mt-4 inline-block text-sm font-semibold text-[#1A4D3A] underline"
        >
          Open full merchant dashboard →
        </Link>
      </section>
    </div>
  );
}
