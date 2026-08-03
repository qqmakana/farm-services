import type { Driver, Job } from "./types";
import { getCountry } from "./countries";

/**
 * Normalize a phone for wa.me — country-aware (not SA-only).
 * Example ZA 082… → 2782… ; NG 0803… → 234803…
 */
export function toWhatsAppNumber(
  phone: string,
  countryCode?: string | null,
): string {
  const c = getCountry(countryCode);
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith(c.phonePrefix)) return digits;
  if (digits.startsWith("0") && c.phonePrefix) {
    return `${c.phonePrefix}${digits.slice(1)}`;
  }
  // Already looks international (longer than local)
  if (digits.length > c.phoneLocalDigits + 1) return digits;
  return `${c.phonePrefix}${digits}`;
}

function serviceLabel(job: Job): string {
  switch (job.service_type) {
    case "ride":
      return "Village Lift-Club";
    case "delivery":
      return "Bulky Delivery";
    case "farm":
      return "Farm Connect";
    case "courier":
      return "Courier";
    default:
      return "Job";
  }
}

function detailsLine(job: Job): string {
  const d = job.details as Record<string, unknown>;
  if (job.service_type === "ride") {
    return `Route: ${d.route_name ?? "—"} · Seats: ${d.seats ?? "—"} · ${d.direction ?? ""}`;
  }
  if (job.service_type === "delivery") {
    return `Item: ${d.item_description ?? "—"} · Size: ${d.size ?? "—"} · Helpers: ${d.needs_helpers ? "Yes" : "No"}`;
  }
  if (job.service_type === "courier") {
    const weight =
      d.item_weight === "under_5"
        ? "<5kg"
        : d.item_weight === "5_10"
          ? "5–10kg"
          : d.item_weight === "10_20"
            ? "10–20kg"
            : String(d.item_weight ?? "—");
    const recipient = d.recipient_name
      ? ` · To: ${d.recipient_name}`
      : "";
    return `Package: ${d.item_description ?? "—"} · ${weight}${recipient}`;
  }
  if (job.service_type === "farm" && Array.isArray(d.items)) {
    const items = (d.items as Array<{ name: string; qty: number }>)
      .map((i) => `${i.qty}× ${i.name}`)
      .join(", ");
    return `Order: ${items || "—"}`;
  }
  return "";
}

export function buildDriverWhatsAppMessage(job: Job, driver: Driver): string {
  const country = getCountry(job.country_code);
  const when = job.scheduled_for
    ? new Date(job.scheduled_for).toLocaleString(country.locale || "en-ZA", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "ASAP";

  const mapsPickup =
    job.pickup_lat != null && job.pickup_lng != null
      ? `https://maps.google.com/?q=${job.pickup_lat},${job.pickup_lng}`
      : null;
  const mapsDrop =
    job.dropoff_lat != null && job.dropoff_lng != null
      ? `https://maps.google.com/?q=${job.dropoff_lat},${job.dropoff_lng}`
      : null;

  const cur = job.fee_currency || job.currency || country.currency;
  const fee = Number(job.fee_amount).toFixed(2);

  return [
    `Hi ${driver.full_name.split(" ")[0]},`,
    ``,
    `New Village Ride job assigned to you.`,
    ``,
    `Ref: ${job.reference_code}`,
    `Service: ${serviceLabel(job)}`,
    `Country: ${country.name} (${country.code})`,
    `When: ${when}`,
    `Fee: ${cur} ${fee}`,
    `Vehicle needed: ${job.required_vehicle}`,
    ``,
    `Customer: ${job.customer_name}`,
    `Phone: ${job.customer_phone}`,
    ``,
    `PICKUP landmark: ${job.pickup_landmark}`,
    mapsPickup ? `Pickup pin: ${mapsPickup}` : null,
    ``,
    `DROPOFF landmark: ${job.dropoff_landmark}`,
    mapsDrop ? `Dropoff pin: ${mapsDrop}` : null,
    ``,
    detailsLine(job) || null,
    job.dispatcher_notes ? `Notes: ${job.dispatcher_notes}` : null,
    ``,
    `Please confirm when you are on the way.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function buildWhatsAppLink(job: Job, driver: Driver): string {
  const phone = toWhatsAppNumber(driver.phone, job.country_code || driver.country_code);
  const text = encodeURIComponent(buildDriverWhatsAppMessage(job, driver));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Simple credit-limit top-up prefill (post-paid model).
 * "Hi, I need to top up my Village Ride wallet. My Driver ID is [ID]."
 */
export function buildSimpleWalletTopUpMessage(driverId: string): string {
  return `Hi, I need to top up my Village Ride wallet. My Driver ID is ${driverId}.`;
}

/**
 * Strict ops template — scan WhatsApp in seconds across currencies.
 * Format: TopUp: [Name] | [Driver ID] | [Amount] [Currency] | [Country]
 */
export function buildWalletTopUpMessage(params: {
  driverName: string;
  driverId: string;
  phone: string;
  amount: number;
  currency: string;
  countryName: string;
  countryCode: string;
}): string {
  const amount = Math.max(0, Math.round(Number(params.amount) || 0));
  const simple = buildSimpleWalletTopUpMessage(params.driverId);
  return [
    simple,
    ``,
    `TopUp: ${params.driverName} | ${params.driverId} | ${amount} ${params.currency} | ${params.countryName}`,
    `Phone: ${params.phone}`,
    `Code: ${params.countryCode}`,
    ``,
    `Proof of payment attached / following.`,
  ].join("\n");
}

export function walletTopUpWhatsAppHref(
  opsWaNumberDigits: string,
  message: string,
): string {
  const n = opsWaNumberDigits.replace(/\D/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
