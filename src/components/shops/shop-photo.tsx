"use client";

import { useState } from "react";

/** Fast shop photo — grey placeholder, fade-in, name fallback if broken. */
export function ShopPhoto({
  src,
  alt,
  className,
  fallback = "/shops/shop-groceries.jpg",
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[#E0E0E0] px-2 text-center text-[12px] font-medium text-[#666666] ${className ?? ""}`}
        role="img"
        aria-label={alt || "Photo unavailable"}
      >
        {alt || "Photo"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`vr-img-fade ${loaded ? "is-loaded" : ""} ${className ?? ""}`}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.dataset.fallback === "1") {
          setFailed(true);
          return;
        }
        img.dataset.fallback = "1";
        if (fallback) {
          img.src = fallback;
          return;
        }
        setFailed(true);
      }}
    />
  );
}
