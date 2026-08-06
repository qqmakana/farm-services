import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Professional driver signup entry — used on Home & Account.
 * Calm, clear, easy to find (not buried in a long list).
 */
export function DriveSignupCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <section
      data-testid="drive-signup-card"
      className={`rounded-2xl bg-black px-4 py-5 text-white ${className}`}
    >
      <p className="text-[11px] font-semibold tracking-[0.14em] text-white/55 uppercase">
        Drivers
      </p>
      <h2 className="mt-1.5 text-xl font-bold tracking-tight text-white">
        Drive with Village Ride
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-white/75">
        Earn with your car, bakkie or truck — in villages, small towns, towns
        and cities. Keep most of every fare. Pay is cash or card to you.
      </p>
      <Link
        href="/driver/join"
        className="uber-press mt-4 flex min-h-12 w-full items-center justify-center gap-1 rounded-full bg-white text-sm font-bold text-black hover:bg-gray-100 active:bg-gray-200"
      >
        Sign up to drive
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
      <p className="mt-3 text-center text-xs text-white/50">
        Already a driver?{" "}
        <Link href="/driver" className="font-semibold text-white underline underline-offset-2">
          Open driver app
        </Link>
      </p>
    </section>
  );
}
