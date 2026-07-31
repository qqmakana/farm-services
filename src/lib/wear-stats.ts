"use server";

import { getCountry } from "./countries";
import { mockRepo } from "./mock-store";
import { createAdminClient, hasServiceRole } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/server";
import {
  aggregateWearStats,
  extractWearBrand,
  type WearLogRow,
  type WearStats,
} from "./wear";

function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

export async function logRiderWear(input: {
  description: string;
  jobId?: string | null;
  riderId?: string | null;
  country?: string | null;
}) {
  const description = input.description.trim();
  if (!description) return;

  const brand = extractWearBrand(description);
  const country = (input.country || "ZA").toUpperCase();
  const created_at = new Date().toISOString();

  if (!useAdmin()) {
    mockRepo.logWear({
      description,
      brand,
      country,
      job_id: input.jobId ?? null,
      created_at,
    });
    return;
  }

  try {
    const admin = createAdminClient();
    await admin.from("rr_rider_wear_logs").insert({
      description,
      brand,
      country,
      job_id: input.jobId ?? null,
      rider_id: input.riderId ?? null,
    });
  } catch {
    /* table may not be applied yet — booking still succeeds */
  }
}

async function loadWearRows(): Promise<WearLogRow[]> {
  if (!useAdmin()) {
    return mockRepo.listWearLogs();
  }

  try {
    const admin = createAdminClient();
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 30);
    const { data, error } = await admin
      .from("rr_rider_wear_logs")
      .select("description, brand, country, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(2000);

    if (!error && data?.length) {
      return data as WearLogRow[];
    }

    // Fallback: pull from recent ride jobs.details.wearing
    const { data: jobs } = await admin
      .from("rr_jobs")
      .select("details, country_code, created_at")
      .eq("service_type", "ride")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    const fromJobs: WearLogRow[] = [];
    for (const job of jobs ?? []) {
      const d = (job.details ?? {}) as Record<string, unknown>;
      const wearing =
        typeof d.wearing === "string" ? d.wearing.trim() : "";
      if (!wearing) continue;
      fromJobs.push({
        description: wearing,
        brand: extractWearBrand(wearing),
        country: (job.country_code as string) || "ZA",
        created_at: String(job.created_at),
      });
    }
    return fromJobs;
  } catch {
    return mockRepo.listWearLogs();
  }
}

export async function getWearStats(): Promise<WearStats> {
  const rows = await loadWearRows();
  return aggregateWearStats(rows, (code) => {
    const c = getCountry(code);
    return { name: c.name, flag: c.flag };
  });
}
