"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { mockRepo } from "./mock-store";
import { calculateFare, type FareBreakdown } from "./fares";
import { isSouthAfricanMobile } from "./brand";
import {
  decisionToDriverPatch,
  runDriverKyc,
  runMockDriverKyc,
} from "./kyc/run-kyc";
import {
  getFareRule,
  incrementDriverOfferStat,
  insertPaidJob,
  matchJobAfterCreate,
} from "./matching";
import { createAdminClient, hasServiceRole } from "./supabase/admin";
import { paypalRefundCapture } from "./paypal-refund";
import { createClient, isSupabaseConfigured } from "./supabase/server";
import type {
  Driver,
  JobApplication,
  JobStatus,
  JobWithDriver,
  NewDriverApplicationInput,
  NewJobInput,
  NewProductInput,
  NewShopInput,
  Rating,
  ShopOrderInput,
  VehicleType,
} from "./types";
import {
  getPayPalCurrency,
  isPayPalConfigured,
  paypalCaptureOrder,
  paypalCreateOrder,
} from "./paypal";
import { suggestVehicle, vehicleFitsJob } from "./vehicles";

function refCode() {
  return `RU-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function revalidateAll() {
  revalidatePath("/dispatch");
  revalidatePath("/book");
  revalidatePath("/driver");
  revalidatePath("/shop");
  revalidatePath("/shops");
  revalidatePath("/trip", "layout");
}

/** Production writes that RLS would block for anon. Also gates live vs local mock. */
function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

async function resolveFare(params: {
  vehicle: VehicleType;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  /** ISO datetime — night surcharge uses this (or now). */
  at?: string | null;
}): Promise<FareBreakdown> {
  let rules = null;
  if (useAdmin()) {
    rules = await getFareRule(params.vehicle);
  }
  return calculateFare({
    vehicle: params.vehicle,
    pickup:
      params.pickup_lat != null && params.pickup_lng != null
        ? { lat: params.pickup_lat, lng: params.pickup_lng }
        : null,
    dropoff:
      params.dropoff_lat != null && params.dropoff_lng != null
        ? { lat: params.dropoff_lat, lng: params.dropoff_lng }
        : null,
    at: params.at ?? null,
    rules,
  });
}

export async function quoteFareAction(params: {
  vehicle: VehicleType;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  at?: string | null;
}): Promise<FareBreakdown> {
  return resolveFare(params);
}

export async function getDataSource(): Promise<"supabase" | "local"> {
  return useAdmin() ? "supabase" : "local";
}

export async function getJobByReference(
  code: string,
): Promise<JobWithDriver | null> {
  if (!useAdmin()) {
    return mockRepo.getJobByReference(code);
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_jobs")
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .ilike("reference_code", code)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as JobWithDriver | null) ?? null;
}

export async function getJobByShareToken(
  token: string,
): Promise<JobWithDriver | null> {
  if (!token?.trim()) return null;
  if (!useAdmin()) return null;

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_jobs")
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .eq("share_token", token.trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as JobWithDriver | null) ?? null;
}

export async function listJobs(): Promise<JobWithDriver[]> {
  if (!useAdmin()) return mockRepo.listJobs();

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_jobs")
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as JobWithDriver[];
}

export async function listDrivers() {
  if (!useAdmin()) return mockRepo.listDrivers();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .order("full_name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Driver[];
}

export async function listPendingDriverHires() {
  if (!useAdmin()) return mockRepo.listPendingDriverHires();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Driver[];
}

/** Ops roster: every driver who applied ? pending, auto-approved, or rejected. */
export async function listAllDriversForOps() {
  if (!useAdmin()) return mockRepo.listAllDriversForOps();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Driver[];
}

export async function applyToDrive(input: NewDriverApplicationInput) {
  if (!input.full_name.trim() || !input.phone.trim()) {
    throw new Error("Name and phone are required.");
  }
  if (!input.area.trim()) throw new Error("Area / town is required.");
  if (!isSouthAfricanMobile(input.phone)) {
    throw new Error(
      "South African mobile numbers only (e.g. 06x / 07x / 08x).",
    );
  }

  if (!useAdmin()) {
    const driver = mockRepo.applyToDrive(input);
    revalidateAll();
    return driver;
  }

  const admin = createAdminClient();
  const phone = input.phone.trim();
  const { data: existing } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (existing?.approval_status === "approved") {
    throw new Error("This phone is already an approved driver. Go online.");
  }
  if (existing?.approval_status === "pending") {
    throw new Error("Application already submitted ? waiting for approval.");
  }

  const notes = [
    `Area: ${input.area.trim()}`,
    "SA mobile ?- auto-approved",
    input.notes?.trim() || null,
  ]
    .filter(Boolean)
    .join(" ?- ");

  // SA drivers are auto-approved so they can go online immediately
  const { data, error } = await admin
    .from("rr_drivers")
    .insert({
      full_name: input.full_name.trim(),
      phone,
      vehicle_type: input.vehicle_type,
      is_active: true,
      approval_status: "approved",
      id_verified: false,
      is_online: false,
      prefer_night: true,
      prefer_heavy: true,
      prefer_village_routes: true,
      notes,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data as Driver;
}

export async function updateDriverPreferences(
  driverId: string,
  prefs: {
    prefer_night: boolean;
    prefer_heavy: boolean;
    prefer_village_routes: boolean;
  },
) {
  if (!useAdmin()) {
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    driver.prefer_night = prefs.prefer_night;
    driver.prefer_heavy = prefs.prefer_heavy;
    driver.prefer_village_routes = prefs.prefer_village_routes;
    revalidateAll();
    return driver;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .update({
      prefer_night: prefs.prefer_night,
      prefer_heavy: prefs.prefer_heavy,
      prefer_village_routes: prefs.prefer_village_routes,
    })
    .eq("id", driverId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateAll();
  return data as Driver;
}

export async function setDriverIdVerified(
  driverId: string,
  verified: boolean,
) {
  if (!useAdmin()) {
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    driver.id_verified = verified;
    driver.kyc_status = verified ? "manual_approved" : "needs_review";
    driver.kyc_checked_at = new Date().toISOString();
    if (verified) {
      driver.kyc_issues = ["Manually approved by ops"];
    }
    revalidateAll();
    return driver;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .update({
      id_verified: verified,
      kyc_status: verified ? "manual_approved" : "needs_review",
      kyc_checked_at: new Date().toISOString(),
      ...(verified
        ? { kyc_issues: ["Manually approved by ops"] }
        : {}),
    })
    .eq("id", driverId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateAll();
  return data as Driver;
}

/** Ops: re-run AI document scan for a driver. */
export async function rerunDriverKyc(driverId: string) {
  if (!useAdmin()) {
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    const decision = runMockDriverKyc(driver);
    Object.assign(driver, decisionToDriverPatch(decision));
    revalidateAll();
    return driver;
  }

  const decision = await runDriverKyc(driverId);
  revalidateAll();
  const admin = createAdminClient();
  const { data } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("id", driverId)
    .single();
  return (data as Driver) ?? { id: driverId, kyc_status: decision.status };
}

async function uploadDriverDoc(
  driverId: string,
  kind: "id" | "license",
  file: File,
) {
  const admin = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${driverId}/${kind}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from("rr-driver-docs")
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
  if (error) throw new Error(error.message);
  return path;
}

export async function submitDriverDocuments(
  driverId: string,
  formData: FormData,
) {
  const licenseNumber = String(formData.get("license_number") ?? "").trim();
  const idFile = formData.get("id_doc");
  const licenseFile = formData.get("license_doc");

  if (!licenseNumber) {
    throw new Error("License / PDP number is required.");
  }

  if (!useAdmin()) {
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    driver.license_number = licenseNumber;
    driver.id_doc_url = idFile instanceof File ? `mock://id/${idFile.name}` : driver.id_doc_url;
    driver.license_doc_url =
      licenseFile instanceof File
        ? `mock://license/${licenseFile.name}`
        : driver.license_doc_url;
    driver.docs_submitted_at = new Date().toISOString();
    driver.id_verified = false;
    driver.kyc_status = "pending";
    const decision = runMockDriverKyc(driver);
    Object.assign(driver, decisionToDriverPatch(decision));
    revalidateAll();
    return driver;
  }

  const patch: Record<string, unknown> = {
    license_number: licenseNumber,
    docs_submitted_at: new Date().toISOString(),
    id_verified: false,
    kyc_status: "pending",
    kyc_issues: [],
  };

  if (idFile instanceof File && idFile.size > 0) {
    patch.id_doc_url = await uploadDriverDoc(driverId, "id", idFile);
  }
  if (licenseFile instanceof File && licenseFile.size > 0) {
    patch.license_doc_url = await uploadDriverDoc(
      driverId,
      "license",
      licenseFile,
    );
  }

  if (!patch.id_doc_url && !patch.license_doc_url) {
    // Allow license number only first time if files already on record
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("rr_drivers")
      .select("id_doc_url, license_doc_url")
      .eq("id", driverId)
      .maybeSingle();
    if (!existing?.id_doc_url && !existing?.license_doc_url) {
      throw new Error("Upload at least one photo: ID or driver’s license.");
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .update(patch)
    .eq("id", driverId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  // AI KYC in background — does not block upload response
  after(async () => {
    try {
      await runDriverKyc(driverId);
      revalidatePath("/dispatch");
      revalidatePath("/driver");
    } catch (err) {
      console.error("[kyc] background run failed", err);
    }
  });

  revalidateAll();
  return data as Driver;
}

/** Ops: open a private driver document (signed URL, 1 hour). */
export async function getDriverDocSignedUrl(storagePath: string) {
  if (!storagePath || storagePath.startsWith("mock://")) {
    return storagePath;
  }
  if (!useAdmin()) {
    throw new Error("Service role required to view documents.");
  }
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("rr-driver-docs")
    .createSignedUrl(storagePath, 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function approveDriverHire(driverId: string) {
  if (!useAdmin()) {
    const driver = mockRepo.approveDriver(driverId);
    revalidateAll();
    return driver;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .update({
      approval_status: "approved",
      is_active: true,
    })
    .eq("id", driverId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data as Driver;
}

export async function rejectDriverHire(driverId: string, reason?: string) {
  if (!useAdmin()) {
    const driver = mockRepo.rejectDriver(driverId, reason);
    revalidateAll();
    return driver;
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("rr_drivers")
    .select("notes")
    .eq("id", driverId)
    .maybeSingle();

  const notes = reason?.trim()
    ? [existing?.notes, `Rejected: ${reason.trim()}`].filter(Boolean).join(" - ")
    : existing?.notes;

  const { data, error } = await admin
    .from("rr_drivers")
    .update({
      approval_status: "rejected",
      is_active: false,
      is_online: false,
      notes,
    })
    .eq("id", driverId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data as Driver;
}

export async function listShops() {
  if (!useAdmin()) return mockRepo.listShops();

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_shops")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listProducts(shopId?: string) {
  if (!useAdmin()) return mockRepo.listProducts(shopId);

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  let query = supabase.from("rr_products").select("*").eq("in_stock", true);
  if (shopId) query = query.eq("shop_id", shopId);
  const { data, error } = await query.order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listOpenJobsForDriver(driverId: string) {
  if (!useAdmin()) return mockRepo.listOpenJobsForDriver(driverId);

  const drivers = await listDrivers();
  const driver = drivers.find((d) => d.id === driverId);
  if (!driver) return [];

  const jobs = await listJobs();
  return jobs.filter(
    (j) =>
      j.status === "new" &&
      vehicleFitsJob(driver.vehicle_type, j.required_vehicle),
  );
}

export async function listApplications(jobId?: string) {
  if (!useAdmin()) return mockRepo.listApplications(jobId);

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  let query = supabase
    .from("rr_job_applications")
    .select("*, drivers:rr_drivers(*), jobs:rr_jobs(*)")
    .order("created_at", { ascending: false });
  if (jobId) query = query.eq("job_id", jobId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Create a PayPal order. Prefer passing `vehicle` (+ optional lat/lng) so the
 * amount is computed server-side. Amount-only is kept for shop checkout after
 * the client has already called `quoteFareAction` (or product pricing).
 */
export async function createPayPalOrderAction(params: {
  amount?: number;
  description: string;
  vehicle?: VehicleType;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  at?: string | null;
}) {
  if (!isPayPalConfigured()) {
    throw new Error(
      "Add your PayPal Client ID and Secret to .env.local (same API you use on your other apps).",
    );
  }

  let amountZar = params.amount;
  if (params.vehicle) {
    const fare = await resolveFare({
      vehicle: params.vehicle,
      pickup_lat: params.pickup_lat,
      pickup_lng: params.pickup_lng,
      dropoff_lat: params.dropoff_lat,
      dropoff_lng: params.dropoff_lng,
      at: params.at ?? null,
    });
    amountZar = fare.fee_amount;
  }

  if (!amountZar || amountZar <= 0) {
    throw new Error("Invalid amount.");
  }

  const order = await paypalCreateOrder({
    amountZar,
    description: params.description,
  });
  return {
    orderId: order.id,
    currency: getPayPalCurrency(),
    amount: amountZar,
  };
}

export async function createJob(input: NewJobInput) {
  if (!input.pickup_landmark?.trim() || !input.dropoff_landmark?.trim()) {
    throw new Error("Pickup and dropoff landmarks are required.");
  }

  if (
    (input.service_type === "delivery" || input.service_type === "farm") &&
    input.required_vehicle === "sedan"
  ) {
    throw new Error("Goods need a bakkie or truck — not a car.");
  }

  const isCash = input.payment.method === "cash";
  const onlinePayment =
    input.payment.method === "paypal" || input.payment.method === "card"
      ? input.payment
      : null;
  const isOnline =
    onlinePayment != null &&
    Boolean(onlinePayment.paypalOrderId) &&
    Boolean(onlinePayment.paypalCaptureId);

  if (!isCash && !isOnline) {
    throw new Error("Valid payment required (Cash or PayPal / Card).");
  }

  // Never trust client fee_amount for charging (includes night surcharge).
  const fare = await resolveFare({
    vehicle: input.required_vehicle,
    pickup_lat: input.pickup_lat,
    pickup_lng: input.pickup_lng,
    dropoff_lat: input.dropoff_lat,
    dropoff_lng: input.dropoff_lng,
    at: input.scheduled_for ?? null,
  });

  if (!useAdmin()) {
    const job = mockRepo.createJob({
      ...input,
      fee_amount: fare.fee_amount,
    });
    revalidateAll();
    return job;
  }

  if (onlinePayment) {
    const admin = createAdminClient();
    const { data: byCapture } = await admin
      .from("rr_jobs")
      .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
      .eq("paypal_capture_id", onlinePayment.paypalCaptureId)
      .maybeSingle();
    if (byCapture) return byCapture as JobWithDriver;
    const { data: byOrder } = await admin
      .from("rr_jobs")
      .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
      .eq("paypal_order_id", onlinePayment.paypalOrderId)
      .maybeSingle();
    if (byOrder) return byOrder as JobWithDriver;
  }

  const paidAt = isCash ? null : new Date().toISOString();
  const row = {
    reference_code: refCode(),
    service_type: input.service_type,
    required_vehicle: input.required_vehicle,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    pickup_lat: input.pickup_lat,
    pickup_lng: input.pickup_lng,
    pickup_landmark: input.pickup_landmark.trim(),
    dropoff_lat: input.dropoff_lat,
    dropoff_lng: input.dropoff_lng,
    dropoff_landmark: input.dropoff_landmark.trim(),
    scheduled_for: input.scheduled_for || null,
    details: input.details,
    fee_amount: fare.fee_amount,
    platform_commission: fare.platform_commission,
    driver_payout: fare.driver_payout,
    fee_currency: fare.currency,
    payment_status: isCash ? "unpaid" : "paid_online",
    payment_method: isCash
      ? "cash"
      : onlinePayment?.method === "card"
        ? "card"
        : "paypal",
    paypal_order_id: onlinePayment?.paypalOrderId ?? null,
    paypal_capture_id: onlinePayment?.paypalCaptureId ?? null,
    paid_at: paidAt,
    dispatcher_notes: input.dispatcher_notes ?? null,
    shop_id: input.shop_id ?? null,
    product_summary: input.product_summary ?? null,
  };

  try {
    const data = await insertPaidJob(row);
    revalidateAll();
    return data as JobWithDriver;
  } catch (err) {
    if (onlinePayment) {
      try {
        await paypalRefundCapture(
          onlinePayment.paypalCaptureId,
          fare.fee_amount,
        );
      } catch {
        /* preserve insert error */
      }
    }
    throw err;
  }
}

/** Capture PayPal then create the trip/delivery job. */
export async function capturePayPalAndCreateJob(
  orderId: string,
  draft: Omit<NewJobInput, "payment">,
) {
  if (!isPayPalConfigured()) {
    throw new Error("PayPal is not configured in .env.local");
  }

  if (useAdmin()) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("rr_jobs")
      .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
      .eq("paypal_order_id", orderId)
      .maybeSingle();
    if (existing) return existing as JobWithDriver;
  }

  const captured = await paypalCaptureOrder(orderId);

  // Recalculate fare server-side — do not trust draft.fee_amount.
  const fare = await resolveFare({
    vehicle: draft.required_vehicle,
    pickup_lat: draft.pickup_lat,
    pickup_lng: draft.pickup_lng,
    dropoff_lat: draft.dropoff_lat,
    dropoff_lng: draft.dropoff_lng,
    at: draft.scheduled_for ?? null,
  });

  return createJob({
    ...draft,
    fee_amount: fare.fee_amount,
    payment: {
      method: "card",
      paypalOrderId: orderId,
      paypalCaptureId: captured.captureId,
    },
  });
}

/** Book with cash — pay the driver when the trip starts. */
export async function createCashJob(draft: Omit<NewJobInput, "payment">) {
  const fare = await resolveFare({
    vehicle: draft.required_vehicle,
    pickup_lat: draft.pickup_lat,
    pickup_lng: draft.pickup_lng,
    dropoff_lat: draft.dropoff_lat,
    dropoff_lng: draft.dropoff_lng,
    at: draft.scheduled_for ?? null,
  });
  return createJob({
    ...draft,
    fee_amount: fare.fee_amount,
    payment: { method: "cash" },
  });
}

export async function capturePayPalAndCreateShopOrder(
  orderId: string,
  input: Omit<ShopOrderInput, "payment">,
) {
  if (!isPayPalConfigured()) {
    throw new Error("PayPal is not configured in .env.local");
  }

  if (useAdmin()) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("rr_jobs")
      .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
      .eq("paypal_order_id", orderId)
      .maybeSingle();
    if (existing) return existing as JobWithDriver;
  }

  const captured = await paypalCaptureOrder(orderId);
  return createShopOrder({
    ...input,
    payment: {
      method: "paypal",
      paypalOrderId: orderId,
      paypalCaptureId: captured.captureId,
    },
  });
}

export async function createShop(input: NewShopInput) {
  if (!useAdmin()) {
    const shop = mockRepo.createShop(input);
    revalidateAll();
    return shop;
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_shops")
    .insert({
      name: input.name,
      phone: input.phone,
      category: input.category,
      landmark: input.landmark,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data;
}

export async function createProduct(input: NewProductInput) {
  if (!useAdmin()) {
    const product = mockRepo.createProduct(input);
    revalidateAll();
    return product;
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_products")
    .insert({
      shop_id: input.shop_id,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      size: input.size,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data;
}

export async function createShopOrder(input: ShopOrderInput) {
  if (!input.dropoff_landmark?.trim()) {
    throw new Error("Delivery landmark is required.");
  }

  if (
    input.payment?.method !== "paypal" ||
    !input.payment.paypalOrderId ||
    !input.payment.paypalCaptureId
  ) {
    throw new Error("PayPal payment required.");
  }

  const shops = await listShops();
  const products = await listProducts(input.shop_id);
  const shop = shops.find((s) => s.id === input.shop_id);
  const product = products.find((p) => p.id === input.product_id);
  if (!shop || !product) throw new Error("Shop or product not found");

  const required = suggestVehicle({
    service_type: "delivery",
    delivery_size: product.size as "small" | "medium" | "large" | "xl",
  });

  const fare = await resolveFare({
    vehicle: required,
    pickup_lat: shop.lat,
    pickup_lng: shop.lng,
    dropoff_lat: input.dropoff_lat,
    dropoff_lng: input.dropoff_lng,
  });

  return createJob({
    service_type: "delivery",
    required_vehicle: required,
    customer_name: input.buyer_name,
    customer_phone: input.buyer_phone,
    pickup_lat: shop.lat,
    pickup_lng: shop.lng,
    pickup_landmark: `${shop.name} ? ${shop.landmark}`,
    dropoff_lat: input.dropoff_lat,
    dropoff_lng: input.dropoff_lng,
    dropoff_landmark: input.dropoff_landmark.trim(),
    details: {
      item_description: product.name,
      size: product.size,
      needs_helpers: product.size === "large" || product.size === "xl",
    },
    fee_amount: fare.fee_amount,
    shop_id: shop.id,
    product_summary: `${product.name} (R${product.price})`,
    dispatcher_notes: `Shop order from ${shop.name} - paid with PayPal`,
    payment: input.payment,
  });
}

export async function applyForJob(
  jobId: string,
  driverId: string,
  note?: string,
) {
  if (!useAdmin()) {
    const app = mockRepo.applyForJob(jobId, driverId, note);
    revalidateAll();
    return app;
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_job_applications")
    .insert({
      job_id: jobId,
      driver_id: driverId,
      note: note ?? null,
    })
    .select("*, drivers:rr_drivers(*), jobs:rr_jobs(*)")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data;
}

export async function acceptApplication(applicationId: string) {
  if (!useAdmin()) {
    const job = mockRepo.acceptApplication(applicationId);
    revalidateAll();
    return job;
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data: app, error: appErr } = await supabase
    .from("rr_job_applications")
    .select("*")
    .eq("id", applicationId)
    .single();
  if (appErr || !app) throw new Error(appErr?.message ?? "Application not found");

  const job = await assignDriver(app.job_id, app.driver_id);

  await supabase
    .from("rr_job_applications")
    .update({ status: "accepted" })
    .eq("id", applicationId);

  await supabase
    .from("rr_job_applications")
    .update({ status: "rejected" })
    .eq("job_id", app.job_id)
    .eq("status", "pending")
    .neq("id", applicationId);

  revalidateAll();
  return job;
}

export async function assignDriver(jobId: string, driverId: string) {
  if (!useAdmin()) {
    const job = mockRepo.assignDriver(jobId, driverId);
    revalidateAll();
    return job;
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const [{ data: jobRow }, { data: driverRow }] = await Promise.all([
    supabase.from("rr_jobs").select("*").eq("id", jobId).single(),
    supabase.from("rr_drivers").select("*").eq("id", driverId).single(),
  ]);

  if (!jobRow || !driverRow) throw new Error("Job or driver not found");
  if (!vehicleFitsJob(driverRow.vehicle_type, jobRow.required_vehicle)) {
    throw new Error(
      `This job needs a ${jobRow.required_vehicle}. Driver has a ${driverRow.vehicle_type}.`,
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("rr_jobs")
    .update({
      driver_id: driverId,
      status: "assigned",
      assigned_at: now,
      driver_lat: driverRow.last_lat,
      driver_lng: driverRow.last_lng,
      driver_location_at: driverRow.last_location_at ?? now,
    })
    .eq("id", jobId)
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data as JobWithDriver;
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  if (!useAdmin()) {
    const job = mockRepo.updateStatus(jobId, status);
    revalidateAll();
    return job;
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_jobs")
    .update({ status })
    .eq("id", jobId)
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data as JobWithDriver;
}

/* Uber-style driver realtime ops */

export async function setDriverOnline(
  driverId: string,
  online: boolean,
  lat?: number,
  lng?: number,
) {
  if (!useAdmin()) {
    const drivers = mockRepo.listDrivers();
    const allowed = drivers.find((d) => d.id === driverId);
    if (!allowed) {
      throw new Error("Only approved drivers can go online.");
    }
    const driver = mockRepo.setDriverOnline(driverId, online, lat, lng);
    revalidateAll();
    return driver;
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("rr_drivers")
    .select("approval_status, is_active, last_lat, last_lng")
    .eq("id", driverId)
    .maybeSingle();

  if (
    !existing ||
    existing.approval_status !== "approved" ||
    !existing.is_active
  ) {
    throw new Error("Only approved drivers can go online.");
  }
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { is_online: online };

  if (lat != null && lng != null) {
    patch.last_lat = lat;
    patch.last_lng = lng;
    patch.last_location_at = now;
  } else if (online && existing.last_lat == null) {
    patch.last_lat = -31.588;
    patch.last_lng = 28.784;
    patch.last_location_at = now;
  }

  const { data, error } = await admin
    .from("rr_drivers")
    .update(patch)
    .eq("id", driverId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data as Driver;
}

export async function updateDriverLocation(
  driverId: string,
  lat: number,
  lng: number,
) {
  if (!useAdmin()) {
    const driver = mockRepo.updateDriverLocation(driverId, lat, lng);
    revalidatePath("/trip", "layout");
    revalidatePath("/driver");
    return driver;
  }

  if (!useAdmin()) {
    throw new Error("Service role required for driver location updates.");
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("rr_drivers")
    .update({
      last_lat: lat,
      last_lng: lng,
      last_location_at: now,
    })
    .eq("id", driverId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await admin
    .from("rr_jobs")
    .update({
      driver_lat: lat,
      driver_lng: lng,
      driver_location_at: now,
    })
    .eq("driver_id", driverId)
    .in("status", ["assigned", "in_progress"]);

  revalidatePath("/trip", "layout");
  revalidatePath("/driver");
  return data as Driver;
}

export async function acceptOffer(jobId: string, driverId: string) {
  if (!useAdmin()) {
    const job = mockRepo.acceptOffer(jobId, driverId);
    revalidateAll();
    return job;
  }

  if (!useAdmin()) {
    throw new Error("Service role required to accept offers.");
  }

  const admin = createAdminClient();
  const [{ data: jobRow }, { data: driverRow }] = await Promise.all([
    admin.from("rr_jobs").select("*").eq("id", jobId).single(),
    admin.from("rr_drivers").select("*").eq("id", driverId).single(),
  ]);

  if (!jobRow || !driverRow) throw new Error("Job or driver not found");
  if (jobRow.status !== "new") throw new Error("Offer already taken");
  if (!vehicleFitsJob(driverRow.vehicle_type, jobRow.required_vehicle)) {
    throw new Error(
      `This job needs a ${jobRow.required_vehicle}. You drive a ${driverRow.vehicle_type}.`,
    );
  }

  const now = new Date().toISOString();
  const { data: assigned, error } = await admin
    .from("rr_jobs")
    .update({
      driver_id: driverId,
      status: "assigned",
      assigned_at: now,
      driver_lat: driverRow.last_lat,
      driver_lng: driverRow.last_lng,
      driver_location_at: driverRow.last_location_at ?? now,
    })
    .eq("id", jobId)
    .eq("status", "new")
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!assigned) throw new Error("Offer already taken");

  await admin.from("rr_job_applications").upsert(
    {
      job_id: jobId,
      driver_id: driverId,
      status: "accepted",
    },
    { onConflict: "job_id,driver_id" },
  );

  await admin
    .from("rr_job_applications")
    .update({ status: "rejected" })
    .eq("job_id", jobId)
    .eq("status", "pending")
    .neq("driver_id", driverId);

  await incrementDriverOfferStat(driverId, "offers_accepted");

  revalidateAll();
  return assigned as JobWithDriver;
}

export async function declineOffer(jobId: string, driverId: string) {
  if (!useAdmin()) {
    const app = mockRepo.declineOffer(jobId, driverId);
    revalidateAll();
    return app;
  }

  if (!useAdmin()) {
    throw new Error("Service role required to decline offers.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_job_applications")
    .update({ status: "withdrawn" })
    .eq("job_id", jobId)
    .eq("driver_id", driverId)
    .eq("status", "pending")
    .select("*, drivers:rr_drivers(*), jobs:rr_jobs(*)")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Offer not found");

  await incrementDriverOfferStat(driverId, "offers_declined");

  revalidateAll();
  return data as JobApplication;
}

export async function startTrip(jobId: string, driverId: string) {
  if (!useAdmin()) {
    const job = mockRepo.startTrip(jobId, driverId);
    revalidateAll();
    return job;
  }

  if (!useAdmin()) {
    throw new Error("Service role required to start trips.");
  }

  const admin = createAdminClient();
  const { data: jobRow, error: fetchErr } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchErr || !jobRow) throw new Error(fetchErr?.message ?? "Job not found");
  if (jobRow.driver_id !== driverId) throw new Error("Not your job");
  if (jobRow.status !== "assigned") {
    throw new Error("Job must be assigned before starting");
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("rr_jobs")
    .update({
      status: "in_progress",
      started_at: now,
    })
    .eq("id", jobId)
    .eq("driver_id", driverId)
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data as JobWithDriver;
}

export async function completeTrip(jobId: string, driverId: string) {
  if (!useAdmin()) {
    const job = mockRepo.completeTrip(jobId, driverId);
    revalidateAll();
    return job;
  }

  if (!useAdmin()) {
    throw new Error("Service role required to complete trips.");
  }

  const admin = createAdminClient();
  const { data: jobRow, error: fetchErr } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchErr || !jobRow) throw new Error(fetchErr?.message ?? "Job not found");
  if (jobRow.driver_id !== driverId) throw new Error("Not your job");
  if (jobRow.status !== "in_progress" && jobRow.status !== "assigned") {
    throw new Error("Job cannot be completed from this status");
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("rr_jobs")
    .update({
      status: "completed",
      completed_at: now,
    })
    .eq("id", jobId)
    .eq("driver_id", driverId)
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .single();

  if (error) throw new Error(error.message);

  await admin
    .from("rr_drivers")
    .update({ is_online: true })
    .eq("id", driverId);

  revalidateAll();
  return data as JobWithDriver;
}

export async function rateTrip(jobId: string, stars: number, comment?: string) {
  if (!useAdmin()) {
    const rating = mockRepo.rateTrip(jobId, stars, comment);
    revalidateAll();
    return rating;
  }

  if (!useAdmin()) {
    throw new Error("Service role required to rate trips.");
  }

  if (stars < 1 || stars > 5) throw new Error("Stars must be 1?5");

  const admin = createAdminClient();
  const { data: job, error: jobErr } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) throw new Error(jobErr?.message ?? "Job not found");
  if (!job.driver_id) throw new Error("Job has no driver");
  if (job.status !== "completed") {
    throw new Error("Can only rate completed trips");
  }

  const { data: existing } = await admin
    .from("rr_ratings")
    .select("id")
    .eq("job_id", jobId)
    .maybeSingle();
  if (existing) throw new Error("Trip already rated");

  const { data: driver, error: driverErr } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("id", job.driver_id)
    .single();
  if (driverErr || !driver) {
    throw new Error(driverErr?.message ?? "Driver not found");
  }

  const { data: rating, error: ratingErr } = await admin
    .from("rr_ratings")
    .insert({
      job_id: jobId,
      driver_id: job.driver_id,
      stars,
      comment: comment ?? null,
    })
    .select("*")
    .single();

  if (ratingErr) throw new Error(ratingErr.message);

  const prevCount = Number(driver.rating_count) || 0;
  const prevAvg = Number(driver.rating_avg) || 5;
  const newCount = prevCount + 1;
  const newAvg = Math.round(((prevAvg * prevCount + stars) / newCount) * 10) / 10;

  await admin
    .from("rr_drivers")
    .update({
      rating_avg: newAvg,
      rating_count: newCount,
    })
    .eq("id", job.driver_id);

  revalidateAll();
  return rating as Rating;
}

export async function getRatingForJob(jobId: string) {
  if (!useAdmin()) {
    return mockRepo.getRatingForJob(jobId);
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_ratings")
    .select("*")
    .eq("job_id", jobId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Rating | null) ?? null;
}

export async function listIncomingOffers(driverId: string) {
  if (!useAdmin()) {
    return mockRepo.listIncomingOffers(driverId);
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_job_applications")
    .select("*, drivers:rr_drivers(*), jobs:rr_jobs(*)")
    .eq("driver_id", driverId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).filter(
    (a) => a.jobs && (a.jobs as { status?: string }).status === "new",
  ) as JobApplication[];
}

export async function listDriverActiveJob(driverId: string) {
  if (!useAdmin()) {
    return mockRepo.listDriverActiveJob(driverId);
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_jobs")
    .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
    .eq("driver_id", driverId)
    .in("status", ["assigned", "in_progress"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as JobWithDriver | null) ?? null;
}

export async function triggerSos(
  jobIdOrRef: string,
  note?: string,
  lat?: number,
  lng?: number,
) {
  if (!useAdmin()) {
    const job = mockRepo.triggerSos(jobIdOrRef, note, lat, lng);
    revalidateAll();
    return { event: null, job };
  }
  if (!useAdmin()) {
    throw new Error("Service role required for SOS.");
  }

  const admin = createAdminClient();
  const key = jobIdOrRef.trim();

  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      key,
    );

  const { data: job, error: jobErr } = looksLikeUuid
    ? await admin
        .from("rr_jobs")
        .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
        .eq("id", key)
        .maybeSingle()
    : await admin
        .from("rr_jobs")
        .select("*, drivers:rr_drivers(*), shops:rr_shops(*)")
        .ilike("reference_code", key)
        .maybeSingle();

  if (jobErr) throw new Error(jobErr.message);
  if (!job) throw new Error("Job not found");

  const now = new Date().toISOString();

  const { data: event, error: sosErr } = await admin
    .from("rr_sos_events")
    .insert({
      job_id: job.id,
      triggered_by: "customer",
      note: note ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
    })
    .select("*")
    .single();

  if (sosErr) throw new Error(sosErr.message);

  await admin
    .from("rr_jobs")
    .update({
      sos_triggered_at: now,
      sos_note: note ?? null,
    })
    .eq("id", job.id);

  revalidateAll();
  return { event, job: job as JobWithDriver };
}

/** Re-broadcast offers / nearest-driver assign for an open job. */
export async function rematchJob(jobId: string) {
  if (!useAdmin()) {
    const job = mockRepo.rematchJob(jobId);
    revalidateAll();
    return job;
  }
  const result = await matchJobAfterCreate(jobId);
  revalidateAll();
  return result;
}

/**
 * Local test payment ? creates a paid job without PayPal.
 * Only works when live PayPal credentials are not configured.
 */
export async function createLocalPaidJob(draft: Omit<NewJobInput, "payment">) {
  if (isPayPalConfigured()) {
    throw new Error("PayPal is configured — use the PayPal button.");
  }
  const stamp = Date.now().toString(36).toUpperCase();
  return createJob({
    ...draft,
    payment: {
      method: "card",
      paypalOrderId: `LOCAL-ORDER-${stamp}`,
      paypalCaptureId: `LOCAL-CAP-${stamp}`,
    },
  });
}

export async function createLocalPaidShopOrder(
  input: Omit<ShopOrderInput, "payment">,
) {
  if (isPayPalConfigured()) {
    throw new Error("PayPal is configured ? use the PayPal button.");
  }
  const stamp = Date.now().toString(36).toUpperCase();
  return createShopOrder({
    ...input,
    payment: {
      method: "paypal",
      paypalOrderId: `LOCAL-ORDER-${stamp}`,
      paypalCaptureId: `LOCAL-CAP-${stamp}`,
    },
  });
}
