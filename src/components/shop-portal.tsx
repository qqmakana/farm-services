"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createProduct, registerMerchantShop } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Card } from "@/components/ui/card";
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
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

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
        setSuccess(true);

        try {
          const supabase = createClient();
          const { error: signErr } = await supabase.auth.signInWithPassword({
            email,
            password: newShop.password,
          });
          if (!signErr) {
            setMessage(`Welcome, ${shop.name}. Opening dashboard…`);
            setTimeout(() => window.location.assign("/merchant/dashboard"), 900);
            return;
          }
        } catch {
          /* fall through */
        }

        setMessage(
          `Account created. Sign in with ${email} to open your dashboard.`,
        );
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
    <div className="ru-page-enter space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--ru-line)] bg-white p-4 shadow-[var(--ru-shadow)]">
        <p className="text-sm text-[var(--ru-muted)]">
          Already a partner?{" "}
          <strong className="text-black">Open your dashboard</strong>
        </p>
        <Link href="/login?next=/merchant/dashboard" className="ru-btn ru-btn-primary !min-h-11 !px-5 !text-sm">
          Partner login
        </Link>
      </div>

      {message && (
        <p className="rounded-2xl bg-[#e8faf2] px-4 py-3 text-sm font-medium text-[#067a4c]">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-2xl bg-[#fdecea] px-4 py-3 text-sm font-medium text-[#b01000]">
          {error}
        </p>
      )}

      <Card className="mx-auto max-w-lg !p-6 sm:!p-8">
        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl text-white">
              ✓
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold">
              You&apos;re in
            </h2>
            <p className="mt-2 text-sm text-[var(--ru-muted)]">
              Create deliveries anytime — no meetings required.
            </p>
            <Link
              href="/merchant/dashboard"
              className="ru-btn ru-btn-primary ru-btn-block mt-6"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold tracking-wide text-[var(--ru-muted)] uppercase">
              Partner signup
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
              Start delivering
            </h2>
            <div className="mt-4 flex gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 flex-1 rounded-full ${
                    n <= step ? "bg-black" : "bg-[#e8e8e8]"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--ru-muted)]">
              Step {step} of 3
            </p>

            <form onSubmit={registerShop} className="mt-6 space-y-1">
              {step === 1 && (
                <>
                  <FloatingInput
                    required
                    label="Business name"
                    value={newShop.name}
                    onChange={(e) =>
                      setNewShop({ ...newShop, name: e.target.value })
                    }
                  />
                  <div className="ru-field has-value">
                    <label htmlFor="cat">Business type</label>
                    <select
                      id="cat"
                      className="ru-input"
                      value={newShop.category}
                      onChange={(e) =>
                        setNewShop({ ...newShop, category: e.target.value })
                      }
                    >
                      <option value="farm">Farm</option>
                      <option value="appliances">Appliances</option>
                      <option value="furniture">Furniture</option>
                      <option value="grocery">Grocery</option>
                      <option value="hardware">Hardware</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <FloatingInput
                    required
                    label="Landmark / address"
                    value={newShop.landmark}
                    onChange={(e) =>
                      setNewShop({ ...newShop, landmark: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    block
                    className="mt-6"
                    onClick={() => {
                      if (!newShop.name.trim() || !newShop.landmark.trim()) {
                        setError("Business name and landmark are required.");
                        return;
                      }
                      setError(null);
                      setStep(2);
                    }}
                  >
                    Continue
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <FloatingInput
                    required
                    type="email"
                    label="Business email"
                    autoComplete="username"
                    value={newShop.email}
                    onChange={(e) =>
                      setNewShop({ ...newShop, email: e.target.value })
                    }
                  />
                  <FloatingInput
                    required
                    label="WhatsApp / phone"
                    value={newShop.phone}
                    onChange={(e) =>
                      setNewShop({ ...newShop, phone: e.target.value })
                    }
                  />
                  <FloatingInput
                    required
                    type="password"
                    label="Password (min 8)"
                    minLength={8}
                    autoComplete="new-password"
                    value={newShop.password}
                    onChange={(e) =>
                      setNewShop({ ...newShop, password: e.target.value })
                    }
                  />
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (
                          !newShop.email.includes("@") ||
                          newShop.password.length < 8 ||
                          !newShop.phone.trim()
                        ) {
                          setError("Enter email, phone, and a strong password.");
                          return;
                        }
                        setError(null);
                        setStep(3);
                      }}
                    >
                      Continue
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <FloatingInput
                    label="Referral code (optional)"
                    value={newShop.referral_code}
                    onChange={(e) =>
                      setNewShop({ ...newShop, referral_code: e.target.value })
                    }
                  />
                  <p className="pt-3 text-xs text-[var(--ru-muted)]">
                    Free signup · ~15% is from the driver wallet, not your shop.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button type="submit" disabled={pending}>
                      {pending ? "Creating…" : "Create account"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </>
        )}
      </Card>

      <section className="ru-card p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          Catalog
        </h2>
        <select
          className="ru-input mt-3 max-w-md"
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
        >
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <form onSubmit={addProduct} className="mt-4 grid gap-2 sm:grid-cols-3">
          <input
            required
            placeholder="Product name"
            className="ru-input"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
          />
          <input
            required
            placeholder="Price"
            className="ru-input"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
          />
          <Button type="submit" disabled={pending || !shopId} variant="brand">
            Add product
          </Button>
        </form>

        <ul className="mt-4 space-y-2 text-sm">
          {shopProducts.map((p) => (
            <li
              key={p.id}
              className="flex justify-between border-b border-[var(--ru-line)] py-2"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-[var(--ru-muted)]">
                {formatMoney(p.price)}
              </span>
            </li>
          ))}
        </ul>

        {shopOrders.length > 0 ? (
          <p className="mt-4 text-xs text-[var(--ru-muted)]">
            {shopOrders.length} recent order(s) for this shop
          </p>
        ) : null}
      </section>
    </div>
  );
}
