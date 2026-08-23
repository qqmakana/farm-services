import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "brand" | "secondary" | "ghost" | "danger" | "small";

export function Button({
  children,
  variant = "primary",
  block,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  block?: boolean;
}) {
  const variants: Record<Variant, string> = {
    primary: "ru-btn-primary",
    brand: "ru-btn-brand",
    secondary: "ru-btn-secondary",
    ghost: "ru-btn-ghost",
    danger: "ru-btn-danger",
    small: "ru-btn-small",
  };
  return (
    <button
      className={`ru-btn ${variants[variant]} ${block ? "ru-btn-block" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
