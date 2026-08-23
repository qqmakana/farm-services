import type { ReactNode } from "react";
import {
  DRIVER_H1,
  DRIVER_PAGE,
  DRIVER_SUB,
  UBER_H1,
  UBER_PAGE,
  UBER_SUB,
} from "@/components/customer/uber-chrome";

/** Consistent customer/driver page chrome. */
export function PageShell({
  title,
  subtitle,
  children,
  className = "",
  actions,
  tone = "light",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  tone?: "light" | "driver";
}) {
  const dark = tone === "driver";
  return (
    <main className={`${dark ? DRIVER_PAGE : UBER_PAGE} ${className}`}>
      {title || actions ? (
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h1 className={dark ? DRIVER_H1 : UBER_H1}>{title}</h1>
            ) : null}
            {subtitle ? (
              <p className={dark ? DRIVER_SUB : UBER_SUB}>{subtitle}</p>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </main>
  );
}
