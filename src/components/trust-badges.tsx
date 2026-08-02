import Link from "next/link";
import { ShieldCheck, IdCard, Siren } from "lucide-react";

/** Qualitative trust strip — no inflated stats. */
export async function TrustBadges() {
  const items = [
    {
      label: "ID-checked drivers",
      Icon: IdCard,
    },
    {
      label: "Photos & plate shown",
      Icon: ShieldCheck,
    },
    {
      label: "In-trip SOS",
      Icon: Siren,
    },
  ] as const;

  return (
    <section className="ru-card p-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        {items.map(({ label, Icon }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 px-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-[11px] font-medium leading-snug text-[var(--ru-muted)]">
              {label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-[var(--ru-muted)]">
        Pay driver in cash ·{" "}
        <Link href="/pricing" className="font-semibold text-black underline">
          See pricing
        </Link>
        {" · "}
        <Link href="/help" className="font-semibold text-black underline">
          Safety tips
        </Link>
      </p>
    </section>
  );
}
