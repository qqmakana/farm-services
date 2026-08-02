import type { ReactNode } from "react";

type Tone = "default" | "accent" | "muted" | "danger" | "inverse";

const TONE: Record<Tone, string> = {
  default: "bg-[var(--ru-elevated)] text-[var(--ru-ink)]",
  accent: "bg-[var(--ru-accent)] text-white",
  muted: "bg-[#f0f0f0] text-[#5a5a5a]",
  danger: "bg-[#fdecea] text-[#b01000]",
  inverse: "bg-[var(--ru-black)] text-white",
};

export function Badge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
