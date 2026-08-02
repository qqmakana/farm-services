import type { ReactNode } from "react";

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
    <main className={`ru-page ru-page-enter ru-force-light ${className}`}>
      {title || actions ? (
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h1 className="ru-page-title">{title}</h1> : null}
            {subtitle ? <p className="ru-page-sub">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </main>
  );
}
