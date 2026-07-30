export type PaymentBadgeMethod = "cash" | "card" | "mobile";

const LABELS: Record<PaymentBadgeMethod, string> = {
  cash: "💵 Cash",
  card: "💳 Card",
  mobile: "📱 Mobile money",
};

export function PaymentBadge({
  methods = ["cash", "card"],
  compact = false,
}: {
  methods?: PaymentBadgeMethod[];
  compact?: boolean;
}) {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[#000000]/25 bg-[#f5f5f5] font-bold text-[#000000] ${
        compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-sm"
      }`}
    >
      <span aria-hidden>✅</span>
      <span>{methods.map((m) => LABELS[m]).join(" · ")}</span>
      <span className="font-semibold">accepted</span>
    </div>
  );
}
