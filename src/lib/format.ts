import type { JobStatus, ServiceType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

export const SERVICE_LABELS: Record<ServiceType, string> = {
  ride: "Ride",
  delivery: "Delivery",
  farm: "Farm Connect",
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

export function formatMoney(amount: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatWhen(iso: string | null) {
  if (!iso) return "ASAP";
  return new Date(iso).toLocaleString("en-ZA", {
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
