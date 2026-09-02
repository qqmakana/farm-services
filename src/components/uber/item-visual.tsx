"use client";

import {
  FileText,
  Package,
  Refrigerator,
  ShoppingBag,
  Sofa,
  Truck,
  Weight,
  type LucideIcon,
} from "lucide-react";
import type { CourierPackageType, Job } from "@/lib/types";
import { courierPackageSize, type ItemSize } from "@/lib/vehicles";

export const FETCH_SIZE_ICON: Record<ItemSize, LucideIcon> = {
  small: FileText,
  medium: ShoppingBag,
  large: Refrigerator,
};

export const COURIER_PACKAGES: {
  id: CourierPackageType;
  label: string;
  hint: string;
  Icon: LucideIcon;
}[] = [
  {
    id: "documents",
    label: "Documents",
    hint: "Letters, IDs, contracts",
    Icon: FileText,
  },
  {
    id: "small_package",
    label: "Small package",
    hint: "Sealed bag or box",
    Icon: Package,
  },
  {
    id: "medium_package",
    label: "Groceries",
    hint: "Shopping bag size",
    Icon: ShoppingBag,
  },
  {
    id: "appliance",
    label: "Fridge / appliance",
    hint: "Needs a bakkie",
    Icon: Refrigerator,
  },
  {
    id: "furniture",
    label: "Furniture",
    hint: "Sofa, wardrobe, table",
    Icon: Sofa,
  },
];

export function packageVisual(pkg?: CourierPackageType | null) {
  return (
    COURIER_PACKAGES.find((p) => p.id === pkg) ?? COURIER_PACKAGES[0]
  );
}

export function JobItemBadge({ job }: { job: Job }) {
  const details = (job.details ?? {}) as {
    package_type?: CourierPackageType;
    size?: ItemSize | "xl";
    item_description?: string;
  };
  const pkg = details.package_type;
  const visual = pkg
    ? packageVisual(pkg)
    : details.size === "xl" || details.size === "large"
      ? { Icon: Refrigerator, label: "Large / bulky" }
      : job.service_type === "courier"
        ? { Icon: Package, label: "Package" }
        : job.service_type === "delivery"
          ? { Icon: ShoppingBag, label: "Fetch" }
          : null;
  if (!visual) return null;
  const Icon = visual.Icon;
  const bulky = pkg
    ? courierPackageSize(pkg) === "large"
    : details.size === "xl" || details.size === "large";
  return (
    <span className="mt-1 inline-flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F3F3] px-2 py-0.5 text-[11px] font-semibold text-[#111111]">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        {visual.label}
      </span>
      {bulky ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3E0] px-2 py-0.5 text-[11px] font-semibold text-[#8A4B08]">
          <Truck className="h-3.5 w-3.5" aria-hidden />
          Bakkie
        </span>
      ) : null}
      {bulky ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFEBEE] px-2 py-0.5 text-[11px] font-semibold text-[#B71C1C]">
          <Weight className="h-3.5 w-3.5" aria-hidden />
          Heavy
        </span>
      ) : null}
    </span>
  );
}

export function PackageTypePicker({
  value,
  onChange,
}: {
  value: CourierPackageType;
  onChange: (id: CourierPackageType) => void;
}) {
  return (
    <div role="group" aria-label="What are you sending?">
      <p className="text-[13px] font-semibold">What are you sending?</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {COURIER_PACKAGES.map((o) => {
          const on = value === o.id;
          const Icon = o.Icon;
          return (
            <button
              key={o.id}
              type="button"
              data-testid={`package-${o.id}`}
              onClick={() => onChange(o.id)}
              className={`uber-press rounded-2xl px-3 py-3 text-left ${
                on ? "bg-black text-white" : "bg-[#F3F3F3] text-black"
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              <span className="mt-1 block text-[13px] font-bold">{o.label}</span>
              <span
                className={`mt-0.5 block text-[11px] leading-tight ${
                  on ? "text-white/80" : "text-[#6B6B6B]"
                }`}
              >
                {o.hint}
              </span>
              {courierPackageSize(o.id) === "large" ? (
                <span
                  className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    on ? "bg-white/20 text-white" : "bg-[#FFF3E0] text-[#8A4B08]"
                  }`}
                >
                  <Truck className="h-3 w-3" aria-hidden />
                  Bakkie
                </span>
              ) : (
                <span
                  className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    on ? "bg-white/20 text-white" : "bg-[#EEEEEE] text-[#111111]"
                  }`}
                >
                  Car
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
