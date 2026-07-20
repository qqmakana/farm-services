import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`ru-card ${padded ? "p-4 sm:p-5" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="text-center sm:text-left">
      <p className="text-[11px] font-semibold tracking-wide text-[var(--ru-muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-black sm:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--ru-muted)]">{hint}</p>
      ) : null}
    </Card>
  );
}
