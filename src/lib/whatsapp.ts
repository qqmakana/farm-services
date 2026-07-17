import type { Driver, Job } from "./types";

/** Normalize SA numbers for wa.me (e.g. 082… → 2782…) */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("27")) return digits;
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  return digits;
}

function serviceLabel(job: Job): string {
  switch (job.service_type) {
    case "ride":
      return "Village Lift-Club";
    case "delivery":
      return "Bulky Delivery";
    case "farm":
      return "Farm Connect";
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
  if (job.service_type === "farm" && Array.isArray(d.items)) {
    const items = (d.items as Array<{ name: string; qty: number }>)
      .map((i) => `${i.qty}× ${i.name}`)
      .join(", ");
    return `Order: ${items || "—"}`;
  }
  return "";
}

export function buildDriverWhatsAppMessage(job: Job, driver: Driver): string {
  const when = job.scheduled_for
    ? new Date(job.scheduled_for).toLocaleString("en-ZA", {
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

  return [
    `Hi ${driver.full_name.split(" ")[0]},`,
    ``,
    `New Village Ride job assigned to you.`,
    ``,
    `Ref: ${job.reference_code}`,
    `Service: ${serviceLabel(job)}`,
    `When: ${when}`,
    `Fee: R${Number(job.fee_amount).toFixed(2)} (PAID · PayPal)`,
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
  const phone = toWhatsAppNumber(driver.phone);
  const text = encodeURIComponent(buildDriverWhatsAppMessage(job, driver));
  return `https://wa.me/${phone}?text=${text}`;
}
