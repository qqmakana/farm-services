"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  capturePayPalAndCreateJob,
  capturePayPalAndCreateShopOrder,
} from "@/lib/actions";
import { clearPaypalBooking, readPaypalStash } from "@/lib/paypal-draft";
import type { NewJobInput, ShopOrderInput } from "@/lib/types";

function CompleteInner() {
  const params = useSearchParams();
  const [msg, setMsg] = useState("Finishing your payment…");

  useEffect(() => {
    const orderId =
      params.get("token") || params.get("orderID") || params.get("orderId");
    const stash = readPaypalStash();
    if (!orderId || !stash?.draft) {
      setMsg(
        "Payment did not finish. Go back and choose Cash, or try Card again.",
      );
      return;
    }
    let cancelled = false;
    const finish =
      stash.flow === "shop"
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
        window.location.assign(`/trip/${job.reference_code}`);
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
        href="/ride"
        className="uber-press mt-8 flex min-h-12 w-full items-center justify-center rounded-full bg-black text-[15px] font-semibold text-white"
      >
        Back to booking
      </a>
    </main>
  );
}

export default function PaypalCompletePage() {
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
