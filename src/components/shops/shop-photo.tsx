"use client";

/** Fast food photo — local fallback if the remote URL fails. */
export function ShopPhoto({
  src,
  alt,
  className,
  fallback = "/shops/shop-groceries.jpg",
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        const img = e.currentTarget;
        if (img.dataset.fallback === "1") return;
        img.dataset.fallback = "1";
        img.src = fallback;
      }}
    />
  );
}
