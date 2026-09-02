import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BRAND, BRAND_WHATSAPP_HREF } from "@/lib/brand";
import {
  CANCEL_FEE_ZAR,
  CANCEL_FREE_MINUTES,
  CANCEL_POLICY_DETAIL,
  CANCEL_POLICY_LINE,
} from "@/lib/ops-policy";
import { formatMoney } from "@/lib/format";

export const metadata = {
  title: `Cancellations & refunds — ${BRAND.appName}`,
  description: CANCEL_POLICY_LINE,
};

export default function CancellationsPage() {
  return (
    <>
      <SiteNav />
      <main className="ru-force-light mx-auto min-h-dvh max-w-2xl bg-white px-4 py-10 pb-20">
        <p className="text-[13px] font-semibold text-[#666666]">Legal</p>
        <h1 className="mt-1 text-[28px] font-bold text-[#111111]">
          Cancellations & refunds
        </h1>
        <p className="mt-2 text-[16px] font-semibold text-[#111111]">
          {CANCEL_POLICY_LINE}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-[#333333]">
          {CANCEL_POLICY_DETAIL}
        </p>
        <h2 className="mt-8 text-[18px] font-bold text-[#111111]">
          Card (Yoco) refunds
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[#333333]">
          Launch process is manual: ops logs into the Yoco dashboard, finds the
          checkout, clicks refund (full or minus {formatMoney(CANCEL_FEE_ZAR)}{" "}
          if a driver already moved). Banks can take 2–7 days. Tap Dispute on
          your trip so we have the order number.
        </p>
        <h2 className="mt-8 text-[18px] font-bold text-[#111111]">
          Shop out of stock
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[#333333]">
          The shop should mark the order cancelled and WhatsApp us. You get a
          refund. If a driver already went to the shop, they get{" "}
          {formatMoney(CANCEL_FEE_ZAR)} for wasted time.
        </p>
        <a
          href={`${BRAND_WHATSAPP_HREF}?text=${encodeURIComponent(
            `Hi ${BRAND.appName} — I need a refund. Cancel within ${CANCEL_FREE_MINUTES} min / dispute.`,
          )}`}
          className="uber-press uber-btn-black mt-8 inline-flex no-underline"
        >
          WhatsApp a dispute
        </a>
        <p className="mt-8 text-[14px] text-[#666666]">
          <Link href="/legal" className="font-semibold text-[#111111]">
            All policies →
          </Link>
        </p>
      </main>
    </>
  );
}
