import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Driver signup entry — Home (above the fold) & Account.
 * compact = one glance under “Where to?”; full = fuller pitch.
 */
export function DriveSignupCard({
  className = "",
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "compact";
}) {
  if (variant === "compact") {
    return (
      <section
        data-testid="drive-signup-card"
        data-variant="compact"
        className={`rounded-2xl bg-black px-4 py-3.5 text-white ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-white/55 uppercase">
              Drivers wanted
            </p>
            <p className="mt-0.5 truncate text-sm font-bold tracking-tight text-white">
              Earn with Village Ride — keep 90%
            </p>
          </div>
          <Link
            href="/driver/join"
            className="uber-press inline-flex h-11 shrink-0 items-center gap-0.5 rounded-full bg-white px-4 text-sm font-bold text-black hover:bg-gray-100 active:bg-gray-200"
          >
            Sign up
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="drive-signup-card"
      data-variant="full"
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
        <Link
          href="/driver"
          className="font-semibold text-white underline underline-offset-2"
        >
          Open driver app
        </Link>
      </p>
    </section>
  );
}
