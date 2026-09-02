"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { registerMerchantShop } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Card } from "@/components/ui/card";
import {
  PlacesAutocomplete,
  type PlaceValue,
} from "@/components/uber/places-autocomplete";

export function ShopPortal() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  const [newShop, setNewShop] = useState({
    name: "",
    phone: "",
    category: "food",
    landmark: "",
    lat: null as number | null,
    lng: null as number | null,
    email: "",
    password: "",
    referral_code: "",
  });

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setNewShop((s) => (s.referral_code ? s : { ...s, referral_code: ref }));
    }
  }, []);

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
          lat: newShop.lat,
          lng: newShop.lng,
          email: newShop.email,
          password: newShop.password,
          referral_code: newShop.referral_code.trim() || null,
        });
        setSuccess(true);

        try {
          const supabase = createClient();
          const { error: signErr } = await supabase.auth.signInWithPassword({
            email,
            password: newShop.password,
          });
          if (!signErr) {
            setMessage(`Welcome, ${shop.name}. Opening kitchen…`);
            setTimeout(() => window.location.assign("/merchant/dashboard"), 900);
            return;
          }
        } catch {
          /* fall through */
        }

        setMessage(
          `Account created. Sign in with ${email} to add menu photos.`,
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="ru-page-enter space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--ru-line)] bg-white p-4 shadow-[var(--ru-shadow)]">
        <p className="text-sm text-[var(--ru-muted)]">
          Already a shop owner?{" "}
          <strong className="text-black">Open your kitchen</strong>
        </p>
        <Link
          href="/login?next=/merchant/dashboard"
          className="ru-btn ru-btn-primary !min-h-11 !px-5 !text-sm"
        >
          Kitchen login
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
              Add plate photos and prices in the kitchen. Riders see them on
              Shops.
            </p>
            <Link
              href="/merchant/dashboard"
              className="ru-btn ru-btn-primary ru-btn-block mt-6"
            >
              Open kitchen
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold tracking-wide text-[var(--ru-muted)] uppercase">
              Shop signup
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
              Start selling
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
                      <option value="food">Food / kitchen</option>
                      <option value="spaza">Local shop</option>
                      <option value="grocery">Grocery</option>
                      <option value="bakery">Bakery</option>
                      <option value="butchery">Butchery</option>
                      <option value="farm">Farm</option>
                      <option value="hardware">Hardware</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div>
                    <PlacesAutocomplete
                      label="Shop / farm location"
                      placeholder="Search or add your business location"
                      value={{
                        label: newShop.landmark,
                        lat: newShop.lat,
                        lng: newShop.lng,
                      }}
                      onChange={(v: PlaceValue) =>
                        setNewShop({
                          ...newShop,
                          landmark: v.label,
                          lat: v.lat,
                          lng: v.lng,
                        })
                      }
                      required
                      showGps
                    />
                    <p className="mt-1 text-xs text-[var(--ru-muted)]">
                      Pin your location so riders can find you.
                    </p>
                  </div>
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
                    Next: kitchen — upload photos. Riders only see an active shop
                    with a menu.
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
    </div>
  );
}
