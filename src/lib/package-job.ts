import type { Job } from "@/lib/types";

export function isShopPackageJob(
  job: Pick<Job, "shop_id" | "product_summary" | "dispatcher_notes">,
): boolean {
  if (job.shop_id) return true;
  const summary = (job.product_summary ?? "").toLowerCase();
  const notes = (job.dispatcher_notes ?? "").toLowerCase();
  return summary.includes("collect from") || notes.includes("shop ready");
}

export function shopNameFromJob(
  job: Pick<Job, "pickup_landmark" | "product_summary" | "shops" | "details">,
): string {
  if (job.shops?.name?.trim()) return job.shops.name.trim();
  const details = job.details as Record<string, unknown>;
  if (typeof details.shop_name === "string" && details.shop_name.trim()) {
    return details.shop_name.trim();
  }
  const collect = job.product_summary?.match(/collect from\s+(.+)$/i);
  if (collect?.[1]) return collect[1].replace(/^[·\s]+/, "").trim();
  const pickup = job.pickup_landmark ?? "";
  if (pickup.toLowerCase().startsWith("shop:")) {
    return pickup.replace(/^shop:\s*/i, "").split("·")[0].trim();
  }
  const dash = pickup.split(" — ")[0]?.trim();
  return dash || pickup.trim();
}

export function itemCountFromJob(
  job: Pick<Job, "product_summary" | "details">,
): number | null {
  const fromSummary = job.product_summary?.match(/(\d+)\s+items?/i);
  if (fromSummary) return Number(fromSummary[1]);
  const details = job.details as Record<string, unknown>;
  if (typeof details.item_count === "number" && details.item_count > 0) {
    return details.item_count;
  }
  return null;
}

/** Accept-screen copy so drivers do not treat a bag as a passenger. */
export function packageOfferCopy(job: Job): {
  eyebrow: string;
  headline: string;
  detail: string;
} | null {
  if (job.service_type === "ride" && !isShopPackageJob(job)) return null;

  if (isShopPackageJob(job)) {
    const shop = shopNameFromJob(job);
    const items = itemCountFromJob(job);
    return {
      eyebrow: "Package delivery — no passenger",
      headline: `DELIVERY: Collect package from ${shop}`,
      detail: items
        ? `${items} packed item${items === 1 ? "" : "s"} · bag only, no rider`
        : "Packed bag only — no rider in the car",
    };
  }

  if (job.service_type === "courier") {
    const desc = String(
      (job.details as Record<string, unknown>).item_description ?? "Package",
    );
    return {
      eyebrow: "Package delivery — no passenger",
      headline: "SEND: Collect package",
      detail: desc,
    };
  }

  if (job.service_type === "delivery") {
    const shop = shopNameFromJob(job);
    return {
      eyebrow: "Package delivery — no passenger",
      headline: shop ? `FETCH: Collect from ${shop}` : "FETCH: Collect goods",
      detail: "No passenger — shop the list or collect the bag",
    };
  }

  if (job.service_type === "farm") {
    return {
      eyebrow: "Load — no passenger",
      headline: "FARM: Collect load",
      detail: "Goods / livestock — no rider in the car",
    };
  }

  return null;
}
