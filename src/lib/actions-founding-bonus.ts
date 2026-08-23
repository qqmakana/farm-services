"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/admin-auth";
import {
  FOUNDING_CITIES,
  isWithinFoundingEra,
  monthYearKey,
  normalizeHomeCity,
  randsToCents,
} from "@/lib/founding-driver";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { mockRepo } from "@/lib/mock-store";
import type { Driver, Job } from "@/lib/types";

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

function revalidateFounding() {
  revalidatePath("/driver/home");
  revalidatePath("/driver/earnings");
  revalidatePath("/admin/bonus-payouts");
  revalidatePath("/admin/dashboard");
}

/**
 * After a trip completes: qualify founding driver (first trip in era) +
 * accrue the rider fare into that city's monthly revenue bucket.
 * Month-end pool = 2% of city trip revenue, split among founding drivers.
 * Safe to call from completeTrip (mock + live).
 */
export async function processFoundingBonusOnTripComplete(
  driverId: string,
  job: Job,
): Promise<void> {
  if (!driverId || !job) return;

  const grossRands = Math.max(
    0,
    Math.round(Number(job.fee_amount ?? job.total_fare) || 0),
  );
  const feeCents = randsToCents(grossRands);
  const month = monthYearKey(
    job.completed_at ? new Date(job.completed_at) : new Date(),
  );

  if (!useAdmin()) {
    mockRepo.processFoundingBonusOnComplete(driverId, feeCents, month);
    return;
  }

  const admin = createAdminClient();
  const { data: driver, error } = await admin
    .from("rr_drivers")
    .select(
      "id, is_founding_driver, founding_era_qualified_at, home_city, notes",
    )
    .eq("id", driverId)
    .maybeSingle();

  if (error || !driver) return;

  let homeCity =
    normalizeHomeCity(driver.home_city) ||
    normalizeHomeCity(
      typeof driver.notes === "string"
        ? driver.notes.match(/Area:\s*([^·]+)/i)?.[1]
        : null,
    );

  const patch: Record<string, unknown> = {};

  if (!driver.home_city && homeCity) {
    patch.home_city = homeCity;
  } else if (driver.home_city) {
    homeCity = normalizeHomeCity(driver.home_city) || driver.home_city;
  }

  if (!driver.is_founding_driver && isWithinFoundingEra()) {
    const { count, error: countErr } = await admin
      .from("rr_jobs")
      .select("id", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .eq("status", "completed");

    if (!countErr && (count ?? 0) <= 1) {
      patch.is_founding_driver = true;
      patch.founding_era_qualified_at = new Date().toISOString();
    }
  }

  if (Object.keys(patch).length) {
    await admin.from("rr_drivers").update(patch).eq("id", driverId);
  }

  if (homeCity && feeCents > 0) {
    await admin.rpc("rr_accrue_city_platform_fee", {
      p_city: homeCity,
      p_month_year: month,
      p_fee_cents: feeCents,
    });
  }
}

export async function updateDriverHomeCity(
  driverId: string,
  city: string,
): Promise<Driver> {
  const homeCity = normalizeHomeCity(city);
  if (!homeCity) throw new Error("Choose a valid home city.");

  if (!useAdmin()) {
    const d = mockRepo.setDriverHomeCity(driverId, homeCity);
    revalidateFounding();
    return d;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .update({ home_city: homeCity })
    .eq("id", driverId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateFounding();
  return data as Driver;
}

export type CityBonusRow = {
  city: string;
  month_year: string;
  total_gross_revenue_cents: number;
  bonus_pool_cents: number;
  is_distributed: boolean;
  founding_driver_count: number;
};

/** Admin: list current-month buckets + founding counts for all founding cities. */
export async function getAdminCityBonusBoard(monthYear?: string): Promise<{
  gate: Awaited<ReturnType<typeof requireAdminAccess>>;
  month_year: string;
  rows: CityBonusRow[];
}> {
  const gate = await requireAdminAccess();
  const month = monthYear || monthYearKey();
  if (!gate.ok) {
    return { gate, month_year: month, rows: [] };
  }

  if (!useAdmin()) {
    const rows = mockRepo.listCityBonusBoard(month);
    return { gate, month_year: month, rows };
  }

  const admin = createAdminClient();
  const { data: revenue } = await admin
    .from("rr_monthly_city_revenue")
    .select("*")
    .eq("month_year", month);

  const byCity = new Map(
    (revenue ?? []).map((r) => [String(r.city), r] as const),
  );

  const rows: CityBonusRow[] = [];
  for (const city of FOUNDING_CITIES) {
    const { count } = await admin
      .from("rr_drivers")
      .select("id", { count: "exact", head: true })
      .eq("is_founding_driver", true)
      .eq("is_active", true)
      .eq("home_city", city);

    const r = byCity.get(city);
    const gross = Number(r?.total_gross_revenue ?? 0);
    rows.push({
      city,
      month_year: month,
      total_gross_revenue_cents: gross,
      bonus_pool_cents: r?.is_distributed
        ? Number(r.bonus_pool_amount ?? 0)
        : Math.floor((gross * 2) / 100),
      is_distributed: Boolean(r?.is_distributed),
      founding_driver_count: count ?? 0,
    });
  }

  return { gate, month_year: month, rows };
}

/** Admin-only: calculate 2% pool and credit founding drivers (DB transaction via RPC). */
export async function calculateAndDistributeCityBonus(
  city: string,
  monthYear: string,
): Promise<{
  city: string;
  month_year: string;
  bonus_pool_cents: number;
  founding_driver_count: number;
  bonus_each_cents: number;
}> {
  const gate = await requireAdminAccess();
  if (!gate.ok) throw new Error("Admin access required");

  const homeCity = normalizeHomeCity(city);
  if (!homeCity) throw new Error("Invalid city");
  if (!/^\d{4}-\d{2}$/.test(monthYear)) {
    throw new Error("month_year must be YYYY-MM");
  }

  if (!useAdmin()) {
    const result = mockRepo.distributeCityBonus(homeCity, monthYear);
    revalidateFounding();
    return result;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("rr_distribute_city_bonus", {
    p_city: homeCity,
    p_month_year: monthYear,
  });

  if (error) throw new Error(error.message);

  const payload = (data ?? {}) as Record<string, unknown>;
  revalidateFounding();
  return {
    city: String(payload.city ?? homeCity),
    month_year: String(payload.month_year ?? monthYear),
    bonus_pool_cents: Number(payload.bonus_pool_cents ?? 0),
    founding_driver_count: Number(payload.founding_driver_count ?? 0),
    bonus_each_cents: Number(payload.bonus_each_cents ?? 0),
  };
}
