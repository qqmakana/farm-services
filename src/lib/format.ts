import type { JobStatus, ServiceType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";
import { getCountry } from "@/lib/countries";

export const SERVICE_LABELS: Record<ServiceType, string> = {
  ride: "Trip",
  delivery: "Fetch",
  farm: "Farm Connect",
  courier: "Send",
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
  const n = Math.round(Number(amount) || 0);
  if (code === "ZAR") {
    return `R ${n}`;
  }
  const locale = country?.locale || CURRENCY_LOCALE[code] || "en-ZA";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    const sym = country?.currencySymbol ?? code;
    return `${sym} ${n}`;
  }
}

/** Display helper: `082 123 4567`. Strip non-digits before saving. */
export function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function formatWhen(
  iso: string | null,
  countryCode?: string | null,
) {
  if (!iso) return "ASAP";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "ASAP";
  const locale = getCountry(countryCode).locale;
  try {
    return d.toLocaleString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toISOString().slice(0, 16).replace("T", " ");
  }
}

export function serviceBadgeClass(_type: ServiceType) {
  return "bg-[#eeeeee] text-black";
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
