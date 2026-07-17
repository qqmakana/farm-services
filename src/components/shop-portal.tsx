"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createProduct, createShop } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
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

  const [newShop, setNewShop] = useState({
    name: "",
    phone: "",
    category: "appliances",
    landmark: "",
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    size: "medium" as "small" | "medium" | "large" | "xl",
  });

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
    startTransition(async () => {
      try {
        const shop = await createShop(newShop);
        setShopId(shop.id);
        setMessage(`Shop registered: ${shop.name}`);
        setNewShop({ name: "", phone: "", category: "appliances", landmark: "" });
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId) return;
    setMessage(null);
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
        setMessage(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-8">
      {message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Register shop or farm</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose <strong>Farm</strong> if you are a farmer, or a shop category if
          you sell in town. Buyers order → bakkie/truck delivers.
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
            <option value="general">General shop</option>
          </select>
          <input
            required
            placeholder="Landmark (required)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newShop.landmark}
            onChange={(e) =>
              setNewShop({ ...newShop, landmark: e.target.value })
            }
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:col-span-2"
          >
            Register shop
          </button>
        </form>
      </section>

      {shops.length > 0 && (
        <>
          <label className="block text-sm font-medium">
            Manage shop
            <select
              className="mt-1 w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Add product</h2>
            <form
              onSubmit={addProduct}
              className="mt-4 grid gap-3 sm:grid-cols-3"
            >
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
                type="number"
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
                <option value="medium">Medium → bakkie</option>
                <option value="large">Large → truck</option>
                <option value="xl">XL → truck</option>
              </select>
              <button
                type="submit"
                disabled={pending || !shopId}
                className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white sm:col-span-3"
              >
                Add product
              </button>
            </form>

            <ul className="mt-4 divide-y divide-slate-100">
              {shopProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between py-2 text-sm text-slate-800"
                >
                  <span>
                    {p.name}{" "}
                    <span className="text-slate-500">({p.size})</span>
                  </span>
                  <span className="font-medium">
                    {formatMoney(Number(p.price))}
                  </span>
                </li>
              ))}
              {shopProducts.length === 0 && (
                <li className="py-2 text-sm text-slate-500">No products yet.</li>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Outgoing deliveries</h2>
            <p className="mt-1 text-sm text-slate-600">
              Buyer orders become bakkie/truck jobs on the same ledger.
            </p>
            <ul className="mt-4 space-y-2">
              {shopOrders.map((j) => (
                <li
                  key={j.id}
                  className="rounded-md border border-slate-100 px-3 py-2 text-sm"
                >
                  <span className="font-mono font-semibold">
                    {j.reference_code}
                  </span>{" "}
                  · {j.product_summary ?? "Order"} → {j.dropoff_landmark} ·{" "}
                  {j.status}
                </li>
              ))}
              {shopOrders.length === 0 && (
                <li className="text-sm text-slate-500">No shop orders yet.</li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
