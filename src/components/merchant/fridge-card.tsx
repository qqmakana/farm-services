"use client";

import { BRAND } from "@/lib/brand";

export function FridgeCard() {
  return (
    <main className="mx-auto max-w-md bg-white px-6 py-10 text-[#111111] print:py-4">
      <p className="text-[13px] font-semibold text-[#666666]">
        Stick this on the fridge
      </p>
      <h1 className="mt-1 text-[28px] font-bold">Village Ride kitchen</h1>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-[18px] leading-snug">
        <li>Phone beeps → open kitchen.</li>
        <li>Pack the items on the order.</li>
        <li>Tap Start preparing, then Ready for pickup.</li>
        <li>Wait for the motorcycle. Hand over the bag.</li>
        <li>Out of stock? Tap Out of stock and WhatsApp Village Ride.</li>
      </ol>
      <p className="mt-8 text-[16px] font-semibold">
        WhatsApp: {BRAND.phone}
      </p>
      <p className="mt-2 text-[14px] text-[#666666]">
        First month: 0% commission on goods. After that, shop keeps 85%.
      </p>
      <button
        type="button"
        onClick={() => window.print()}
        className="uber-press uber-btn-black mt-8 print:hidden"
      >
        Print
      </button>
    </main>
  );
}
