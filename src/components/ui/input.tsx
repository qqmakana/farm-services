import type { InputHTMLAttributes } from "react";

type Variant = "soft" | "underline";

export function Input({
  label,
  hint,
  variant = "soft",
  className = "",
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  variant?: Variant;
}) {
  const fieldId = id ?? props.name;
  return (
    <label className="block text-sm font-semibold text-[var(--ru-ink)]">
      {label ? <span className="mb-1 block">{label}</span> : null}
      <input
        id={fieldId}
        className={`${
          variant === "underline" ? "ru-input" : "ru-soft-field"
        } ${className}`}
        {...props}
      />
      {hint ? (
        <span className="mt-1 block text-xs font-normal text-[var(--ru-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
