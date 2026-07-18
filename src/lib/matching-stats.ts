import { createAdminClient } from "./supabase/admin";

export async function incrementDriverOfferStat(
  driverId: string,
  field: "offers_received" | "offers_accepted" | "offers_declined",
  by = 1,
) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rr_drivers")
    .select(field)
    .eq("id", driverId)
    .maybeSingle();
  const current = Number((data as Record<string, number> | null)?.[field]) || 0;
  await admin
    .from("rr_drivers")
    .update({ [field]: current + by })
    .eq("id", driverId);
}
