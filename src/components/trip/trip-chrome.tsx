import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";

/** Uber-style trip header — back circle, no marketing. */
export function TripChrome({ referenceCode }: { referenceCode?: string }) {
  return (
    <header className="ru-force-light pointer-events-none absolute inset-x-0 top-0 z-40 mx-auto max-w-md px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex items-center justify-between">
        <Link
          href="/"
          className="uber-press flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0a0a0a] shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
        </Link>
        {referenceCode ? (
          <span className="rounded-full bg-white px-3 py-2 text-[12px] font-bold text-[#0a0a0a] shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
            {referenceCode}
          </span>
        ) : (
          <Link
            href="/help"
            className="uber-press flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0a0a0a] shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </Link>
        )}
      </div>
    </header>
  );
}
