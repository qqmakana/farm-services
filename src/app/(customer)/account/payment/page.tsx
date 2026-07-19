import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PaymentMethodsPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-white px-5 pb-24 pt-6">
      <Link
        href="/account"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A4D3A] transition active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" /> Account
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Payment Methods</h1>
      <p className="mt-2 text-sm text-slate-500">
        Cash is the default for Village Ride. Card and eWallet options are coming
        soon.
      </p>
      <div className="mt-6 rounded-xl border border-gray-100 bg-[#F9FAFB] p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Cash</p>
        <p className="mt-1 text-xs text-slate-500">
          Pay the driver when your trip starts.
        </p>
      </div>
    </main>
  );
}
