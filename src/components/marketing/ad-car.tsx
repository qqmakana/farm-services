import Image from "next/image";
import { DRIVER_AD_IMAGE } from "@/lib/marketing/driver-ad-copy";

/** Single official Village Ride driver recruitment creative. */
export function AdCar({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl ${className}`}>
      <Image
        src={DRIVER_AD_IMAGE}
        alt="Village Ride — Drivers wanted. Cash & Card accepted. Keep 85%."
        width={1080}
        height={1080}
        className="h-auto w-full"
        priority
      />
    </div>
  );
}
