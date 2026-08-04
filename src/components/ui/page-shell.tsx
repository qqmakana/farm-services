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
    <main
      className={`mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-28 pt-6 ${className}`}
    >
      {title || actions ? (
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h1 className="text-3xl font-bold tracking-tight text-black">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </main>
  );
}
