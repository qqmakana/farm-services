import type { JobStatus, ServiceType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";
import { getCountry } from "@/lib/countries";

export const SERVICE_LABELS: Record<ServiceType, string> = {
  ride: "Ride",
  delivery: "Delivery",
  farm: "Farm Connect",
  courier: "Courier",
};

export { VEHICLE_LABELS };

export const STATUS_LABELS: Record<JobStatus, string> = {
  new: "Finding your driver…",
  searching_driver: "Finding your driver…",
  assigned: "Confirmed — driver on the way",
  confirmed: "Confirmed — driver on the way",
  in_progress: "Trip in progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const CURRENCY_LOCALE: Record<string, string> = {
  ZAR: "en-ZA",
  KES: "en-KE",
  NGN: "en-NG",
  GHS: "en-GH",
  INR: "en-IN",
  PHP: "en-PH",
};

export function formatMoney(
  amount: number,
  currency = "ZAR",
  countryCode?: string | null,
) {
  const country = countryCode ? getCountry(countryCode) : null;
  const code = currency || country?.currency || "ZAR";
  const locale = country?.locale || CURRENCY_LOCALE[code] || "en-ZA";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    const sym = country?.currencySymbol ?? code;
    return `${sym}${Math.round(amount)}`;
  }
}

export function formatWhen(
  iso: string | null,
  countryCode?: string | null,
) {
  if (!iso) return "ASAP";
  const locale = getCountry(countryCode).locale;
  return new Date(iso).toLocaleString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function serviceBadgeClass(type: ServiceType) {
  switch (type) {
    case "ride":
      return "bg-sky-100 text-sky-900";
    case "delivery":
      return "bg-amber-100 text-amber-950";
    case "farm":
      return "bg-emerald-100 text-emerald-950";
    case "courier":
      return "bg-violet-100 text-violet-950";
  }
}

export function statusBadgeClass(status: JobStatus) {
  switch (status) {
    case "new":
    case "searching_driver":
      return "bg-rose-100 text-rose-900";
    case "assigned":
    case "confirmed":
      return "bg-indigo-100 text-indigo-900";
    case "in_progress":
      return "bg-orange-100 text-orange-950";
    case "completed":
      return "bg-emerald-100 text-emerald-950";
    case "cancelled":
      return "bg-slate-200 text-slate-700";
  }
}
