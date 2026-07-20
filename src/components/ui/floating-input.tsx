"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

export function FloatingInput({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(props.value ?? props.defaultValue);

  return (
    <div
      className={`ru-field ${focused || hasValue ? "has-value" : ""} ${className}`}
    >
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="ru-input"
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </div>
  );
}
