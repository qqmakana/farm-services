import Image from "next/image";
import { PaymentBadge, type PaymentBadgeMethod } from "./payment-badge";

const VARIANT_SRC = {
  village: "/marketing/ads/ad-car-village-square.png",
  white: "/marketing/ads/ad-car-white-square.png",
  gradient: "/marketing/ads/ad-car-gradient-square.png",
} as const;

export function AdCar({
  variant = "village",
  paymentMethods = ["cash", "card"],
  showBadge = true,
  className = "",
}: {
  variant?: keyof typeof VARIANT_SRC;
  size?: "square" | "vertical" | "landscape";
  paymentMethods?: PaymentBadgeMethod[];
  showBadge?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <Image
        src={VARIANT_SRC[variant]}
        alt={`Village Ride driver ad — ${variant} — cash and card accepted`}
        width={1080}
        height={1080}
        className="h-auto w-full"
        priority={variant === "village"}
      />
      {showBadge ? (
        <div className="absolute bottom-3 left-3 right-3 flex justify-center sm:bottom-4">
          <PaymentBadge methods={paymentMethods} />
        </div>
      ) : null}
    </div>
  );
}
