import type { ReactNode } from "react";
import {
  UBER_H1,
  UBER_PAGE,
  UBER_SUB,
} from "@/components/customer/uber-chrome";

/** Consistent Uber-style customer/driver page chrome. */
export function PageShell({
  title,
  subtitle,
  children,
  className = "",
  actions,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <main className={`${UBER_PAGE} ${className}`}>
      {title || actions ? (
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h1 className={UBER_H1}>{title}</h1> : null}
            {subtitle ? <p className={UBER_SUB}>{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </main>
  );
}
