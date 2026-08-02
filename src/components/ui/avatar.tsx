export function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: {
  name?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const sizeClass =
    size === "lg"
      ? "h-16 w-16 text-2xl"
      : size === "sm"
        ? "h-9 w-9 text-sm"
        : "h-12 w-12 text-lg";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--ru-black)] font-bold text-white ${sizeClass} ${className}`}
      aria-hidden
    >
      {initial}
    </span>
  );
}
