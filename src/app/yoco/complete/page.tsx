"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  capturePayPalAndCreateJob,
  capturePayPalAndCreateShopOrder,
} from "@/lib/actions";
import { captureYocoAndPlaceShopCart } from "@/lib/actions-shop-orders";
import {
  clearPaypalBooking,
  readCardCheckoutId,
  readPaypalStash,
} from "@/lib/paypal-draft";
import type { NewJobInput, ShopCartOrderInput, ShopOrderInput } from "@/lib/types";

function CompleteInner() {
  const params = useSearchParams();
  const [msg, setMsg] = useState("Finishing your payment…");

  useEffect(() => {
    const orderId =
      params.get("checkoutId") ||
      params.get("id") ||
      params.get("token") ||
      params.get("orderID") ||
      params.get("orderId") ||
      readCardCheckoutId();
    const stash = readPaypalStash();
    if (!orderId || !stash?.draft) {
      setMsg(
        "Payment did not finish. Go back and choose Cash, or try Card again.",
      );
      return;
    }
    let cancelled = false;
    const finish =
      stash.flow === "cart"
        ? captureYocoAndPlaceShopCart(
            orderId,
            stash.draft as Omit<ShopCartOrderInput, "payment_method">,
          )
        : stash.flow === "shop"
          ? capturePayPalAndCreateShopOrder(
              orderId,
              stash.draft as Omit<ShopOrderInput, "payment">,
            )
          : capturePayPalAndCreateJob(
              orderId,
              stash.draft as Omit<NewJobInput, "payment">,
            );
    void finish
      .then((job) => {
        if (cancelled) return;
        clearPaypalBooking();
        if (stash.flow === "cart") {
          window.location.assign("/activity");
          return;
        }
        const code =
          "reference_code" in job ? job.reference_code : null;
        window.location.assign(code ? `/trip/${code}` : "/activity");
      })
      .catch((err) => {
        if (cancelled) return;
        setMsg(
          err instanceof Error
            ? err.message
            : "Payment could not be confirmed. Choose Cash, or try Card again.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <main className="ru-force-light mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-white px-6 text-center text-black">
      <p className="text-[22px] font-bold">Village Ride</p>
      <p className="mt-3 text-[15px] text-[#6B6B6B]">{msg}</p>
      <a
        href="/"
        className="uber-press mt-8 flex min-h-12 w-full items-center justify-center rounded-full bg-black text-[15px] font-semibold text-white"
      >
        Back home
      </a>
    </main>
  );
}

export default function YocoCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-white text-black">
          Finishing payment…
        </main>
      }
    >
      <CompleteInner />
    </Suspense>
  );
}
