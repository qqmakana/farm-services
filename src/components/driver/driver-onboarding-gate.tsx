"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { shouldShowDriverOnboarding } from "@/lib/driver-onboarding";
import { useDriverApp } from "@/components/driver/driver-app-provider";

/** After sign-in, send new drivers to /driver/guide once. */
export function DriverOnboardingGate({ children }: { children: ReactNode }) {
  const { driver, loading } = useDriverApp();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!driver) {
      setReady(true);
      return;
    }
    if (pathname?.startsWith("/driver/guide")) {
      setReady(true);
      return;
    }
    if (shouldShowDriverOnboarding()) {
      router.replace("/driver/guide");
      return;
    }
    setReady(true);
  }, [driver, loading, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center pb-24">
        <span className="vr-spin vr-spin-dark" aria-hidden />
      </div>
    );
  }

  return <>{children}</>;
}
