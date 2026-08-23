"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { mockRepo } from "./mock-store";
import { calculateFare, type FareBreakdown } from "./fares";
import { getDrivingRoute } from "./mapbox-server";
import { assertBookingInServiceArea } from "./service-area";
import { isValidMobileForCountry } from "./phone";
import { DEFAULT_COUNTRY, getCountry } from "./countries";
import {
  driverCanGoOnline,
} from "./trust";
import {
  buildCustomerConfirmPush,
  buildCustomerDriverArrivedPush,
  buildCustomerTripCompletedPush,
  buildCustomerTripStartedPush,
  expireStaleOffers,
  offerNextDriver,
} from "./dispatch/offer-chain";
import { sendPushToToken } from "./firebase/admin";
import {
  driverHasArrived,
  isConfirmedStatus,
  isSearchingStatus,
  mergeDriverArrivedDetails,
} from "./job-status";
import {
  applyCommissionToWallet,
  cashPlatformRemittance,
  cardDriverPayout,
  creditLimitBlockMessage,
  creditPayoutToWallet,
  driverEligibleForDispatch,
  isCardPaymentMethod,
  isCashPaymentMethod,
} from "./wallet";
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
import { logRiderWear } from "./wear-stats";
import { createAdminClient, hasServiceRole } from "./supabase/admin";
import { paypalRefundCapture } from "./paypal-refund";
import { createClient, isSupabaseConfigured } from "./supabase/server";
import type {
  Driver,
  Job,
  JobApplication,
  JobStatus,
  JobWithDriver,
  MerchantRegisterInput,
  NewDriverApplicationInput,
  NewJobInput,
  NewProductInput,
  NewShopInput,
  Rating,
  ServiceType,
  Shop,
  ShopOrderInput,
  VehicleType,
} from "./types";
import {
  allowLocalTestPayments,
  getPayPalCurrency,
  isPayPalConfigured,
  paypalCaptureOrder,
  paypalCreateOrder,
} from "./paypal";
import { suggestVehicle, vehicleFitsJob } from "./vehicles";

function refCode() {
  return `RU-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Explicit FK — rr_jobs has driver_id + offered_driver_id → rr_drivers. */
const JOB_WITH_RELATIONS =
  "*, drivers:rr_drivers!driver_id(*), shops:rr_shops(*)";

function revalidateAll() {
  revalidatePath("/dispatch");
  revalidatePath("/book");
  revalidatePath("/driver");
  revalidatePath("/driver/home");
  revalidatePath("/driver/jobs");
  revalidatePath("/driver/earnings");
  revalidatePath("/driver/account");
  revalidatePath("/shop");
  revalidatePath("/shops");
  revalidatePath("/merchant/dashboard");
  revalidatePath("/trip", "layout");
  revalidatePath("/wear-stats");
}

/** Production writes that RLS would block for anon. Also gates live vs local mock. */
function useAdmin() {
  return isSupabaseConfigured() && hasServiceRole();
}

function weightFromDetails(
  details: unknown,
): string | null {
  if (!details || typeof details !== "object") return null;
  const d = details as Record<string, unknown>;
  if (typeof d.weight_category === "string") return d.weight_category;
  if (typeof d.size === "string") return d.size;
  if (typeof d.item_weight === "string") return d.item_weight;
  return null;
}

/** Strip base64 / oversized fields — prevents Server Action body explosions. */
function sanitizeJobDetails(details: unknown): Record<string, unknown> {
  if (!details || typeof details !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    if (typeof value === "string") {
      if (value.startsWith("data:")) continue;
      if (value.length > 4_000) continue;
      out[key] = value;
      continue;
    }
    if (
      value === null ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    }
  }
  return out;
}

function friendlyBookingError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (
    /Server Components|digest|Body exceeded|request entity too large|413|FETCH_ERROR|Failed to fetch/i.test(
      raw,
    )
  ) {
    return new Error(
      "Could not create your trip. Check your connection and try again — or use WhatsApp booking.",
    );
  }
  if (
    /landmark|pickup|dropoff|service area|driving route|Mapbox|pinned/i.test(
      raw,
    )
  ) {
    return new Error(raw);
  }
  if (raw.trim()) return err instanceof Error ? err : new Error(raw);
  return new Error("Could not create your trip. Please try again.");
}

async function resolveFare(params: {
  vehicle: VehicleType;
  service_type?: ServiceType | null;
  country_code?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  /** ISO datetime — night surcharge uses this (or now). */
  at?: string | null;
  customer_phone?: string | null;
  is_subscribed?: boolean | null;
  weight_category?: string | null;
  details?: unknown;
}): Promise<FareBreakdown> {
  const countryCode = params.country_code || DEFAULT_COUNTRY;

  let isSubscribed = Boolean(params.is_subscribed);
  if (!isSubscribed && params.customer_phone) {
    const { getSubscriptionStatus } = await import("./subscription");
    const status = await getSubscriptionStatus({
      phone: params.customer_phone,
      countryCode,
    });
    isSubscribed = status.isSubscribed;
  }

  const weight =
    params.weight_category ||
    weightFromDetails(params.details) ||
    null;

  const pickup =
    params.pickup_lat != null && params.pickup_lng != null
      ? { lat: params.pickup_lat, lng: params.pickup_lng }
      : null;
  const dropoff =
    params.dropoff_lat != null && params.dropoff_lng != null
      ? { lat: params.dropoff_lat, lng: params.dropoff_lng }
      : null;

  if (!pickup || !dropoff) {
    return calculateFare({
      vehicle: params.vehicle,
      serviceType: params.service_type,
      countryCode,
      pickup,
      dropoff,
      at: params.at ?? null,
      isSubscribed,
      weightCategory: weight,
      routeDistanceKm: 0,
      routeDurationSeconds: 0,
      quoteReady: false,
    });
  }

  assertBookingInServiceArea(pickup, dropoff, countryCode);
  const route = await getDrivingRoute(pickup, dropoff);

  // Unified pricing (src/lib/pricing.ts) — ignore legacy rr_fare_rules % model
  return calculateFare({
    vehicle: params.vehicle,
    serviceType: params.service_type,
    countryCode,
    pickup,
    dropoff,
    at: params.at ?? null,
    isSubscribed,
    weightCategory: weight,
    routeDistanceKm: route.distanceKm,
    routeDurationSeconds: route.durationSeconds,
    quoteReady: true,
  });
}

export async function quoteFareAction(params: {
  vehicle: VehicleType;
  service_type?: ServiceType | null;
  country_code?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  at?: string | null;
  customer_phone?: string | null;
  weight_category?: string | null;
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

  try {
    await expireStaleOffers(5);
  } catch {
    /* non-fatal */
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_jobs")
    .select(JOB_WITH_RELATIONS)
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
    .select(JOB_WITH_RELATIONS)
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
    .select(JOB_WITH_RELATIONS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as JobWithDriver[];
}

/** Customer Activity: trips matching a guest phone (0xx / 27xx variants). */
export async function listJobsByCustomerPhone(
  phone: string,
): Promise<JobWithDriver[]> {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return [];

  const local = digits.startsWith("27")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  const variants = [
    `0${local}`,
    `27${local}`,
    `+27${local}`,
    local,
    phone.trim(),
  ];

  if (!useAdmin()) {
    return mockRepo.listJobsByCustomerPhone(variants);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_jobs")
    .select(JOB_WITH_RELATIONS)
    .in("customer_phone", variants)
    .order("created_at", { ascending: false })
    .limit(50);

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

export async function getDriver(driverId: string): Promise<Driver | null> {
  if (!driverId) return null;
  if (!useAdmin()) {
    return mockRepo.listDrivers().find((d) => d.id === driverId) ?? null;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("id", driverId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Driver | null) ?? null;
}

/** Resolve driver row linked to the signed-in Supabase user (if any). */
export async function resolveAuthDriver(): Promise<Driver | null> {
  if (!useAdmin()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = createAdminClient();
    const { data: byUser } = await admin
      .from("rr_drivers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (byUser) return byUser as Driver;

    const { data: profile } = await admin
      .from("rr_profiles")
      .select("driver_id, role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.driver_id) {
      const { data: d } = await admin
        .from("rr_drivers")
        .select("*")
        .eq("id", profile.driver_id)
        .maybeSingle();
      if (d) return d as Driver;
    }
  } catch {
    return null;
  }
  return null;
}

export async function listDriverJobs(
  driverId: string,
): Promise<JobWithDriver[]> {
  if (!driverId) return [];
  if (!useAdmin()) {
    return mockRepo
      .listJobs()
      .filter((j) => j.driver_id === driverId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_jobs")
    .select(JOB_WITH_RELATIONS)
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw new Error(error.message);
  return (data ?? []) as JobWithDriver[];
}

export async function updateDriverVehicle(
  driverId: string,
  patch: {
    vehicle_type?: VehicleType;
    vehicle_registration?: string | null;
    vehicle_year?: number | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    vehicle_color?: string | null;
  },
) {
  if (!useAdmin()) {
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    if (patch.vehicle_type) driver.vehicle_type = patch.vehicle_type;
    if (patch.vehicle_registration !== undefined) {
      driver.vehicle_registration = patch.vehicle_registration;
    }
    if (patch.vehicle_year !== undefined) {
      driver.vehicle_year = patch.vehicle_year;
    }
    if (patch.vehicle_make !== undefined) driver.vehicle_make = patch.vehicle_make;
    if (patch.vehicle_model !== undefined) {
      driver.vehicle_model = patch.vehicle_model;
    }
    if (patch.vehicle_color !== undefined) {
      driver.vehicle_color = patch.vehicle_color;
    }
    revalidateAll();
    return driver;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .update({
      ...(patch.vehicle_type ? { vehicle_type: patch.vehicle_type } : {}),
      vehicle_registration: patch.vehicle_registration ?? null,
      vehicle_year: patch.vehicle_year ?? null,
      vehicle_make: patch.vehicle_make ?? null,
      vehicle_model: patch.vehicle_model ?? null,
      vehicle_color: patch.vehicle_color ?? null,
    })
    .eq("id", driverId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateAll();
  return data as Driver;
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
  const countryCode = input.country_code || DEFAULT_COUNTRY;
  if (!isValidMobileForCountry(input.phone, countryCode)) {
    const c = getCountry(countryCode);
    throw new Error(
      `Enter a valid ${c.name} mobile (e.g. +${c.phonePrefix}…).`,
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
    `${getCountry(countryCode).name} mobile — auto-approved`,
    input.notes?.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const { normalizeHomeCity } = await import("./founding-driver");
  const homeCity = normalizeHomeCity(input.area);

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
      country_code: countryCode,
      home_city: homeCity,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data as Driver;
}

export async function updateDriverCountry(
  driverId: string,
  countryCode: string,
) {
  const code = getCountry(countryCode).code;
  if (!useAdmin()) {
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    driver.country_code = code;
    revalidateAll();
    return driver;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .update({ country_code: code })
    .eq("id", driverId)
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
    driver.verification_status = verified ? "verified" : "pending";
    driver.verified_at = verified ? new Date().toISOString() : null;
    driver.kyc_status = verified ? "manual_approved" : "needs_review";
    driver.kyc_checked_at = new Date().toISOString();
    if (verified) {
      driver.kyc_issues = ["Manually approved by ops"];
    }
    if (!verified) driver.is_online = false;
    revalidateAll();
    return driver;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .update({
      id_verified: verified,
      verification_status: verified ? "verified" : "pending",
      verified_at: verified ? new Date().toISOString() : null,
      verified_by: verified ? "ops" : null,
      kyc_status: verified ? "manual_approved" : "needs_review",
      kyc_checked_at: new Date().toISOString(),
      ...(verified
        ? { kyc_issues: ["Manually approved by ops"] }
        : { is_online: false }),
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
  kind: "id" | "license" | "selfie" | "vehicle_front" | "vehicle_side",
  file: File,
) {
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const isPng = (file.type || "").includes("png");
  const ext = isPng ? "png" : "jpg";
  const contentType = isPng ? "image/png" : "image/jpeg";
  const path = `${driverId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await admin.storage
    .from("rr-driver-docs")
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });
  if (error) {
    const msg = error.message || "Upload failed";
    if (/bucket|not found|row-level|policy|jwt|apikey/i.test(msg)) {
      throw new Error(
        "Photo storage is not ready. Ask support to enable the rr-driver-docs bucket, then try again.",
      );
    }
    throw new Error(`Could not upload ${kind.replace("_", " ")} photo: ${msg}`);
  }
  return path;
}

function requireImageFile(formData: FormData, key: string, label: string): File {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error(`${label} is required.`);
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error(`${label} must be under 5MB.`);
  }
  const type = (file.type || "").toLowerCase();
  const okType =
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "";
  const ext = file.name.split(".").pop()?.toLowerCase();
  const okExt = !ext || ["jpg", "jpeg", "png", "webp"].includes(ext);
  if (!okType || !okExt) {
    throw new Error(`${label} must be JPEG or PNG.`);
  }
  return file;
}

/**
 * Register as driver with required trust photos + code of conduct.
 * Starts as verification_status=pending — cannot go online until ops verifies.
 * Prefer POST /api/driver/apply from the client (clear JSON errors).
 */
export async function applyToDriveWithTrust(formData: FormData) {
  const { submitDriverApplication } = await import("./driver-apply");
  const result = await submitDriverApplication(formData);
  if (!result.ok) throw new Error(result.error);
  revalidateAll();
  return { id: result.driverId };
}

export async function setDriverVerification(
  driverId: string,
  decision: "verified" | "rejected",
  note?: string,
) {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    verification_status: decision,
    verification_note: note?.trim() || null,
    id_verified: decision === "verified",
    verified_at: decision === "verified" ? now : null,
    verified_by: decision === "verified" ? "ops" : null,
    is_online: decision === "verified" ? undefined : false,
  };
  if (decision === "rejected") {
    patch.is_online = false;
  }

  if (!useAdmin()) {
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    driver.verification_status = decision;
    driver.verification_note = note?.trim() || null;
    driver.id_verified = decision === "verified";
    driver.verified_at = decision === "verified" ? now : null;
    if (decision !== "verified") driver.is_online = false;
    revalidateAll();
    return driver;
  }

  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
    verification_status: decision,
    verification_note: note?.trim() || null,
    id_verified: decision === "verified",
    verified_at: decision === "verified" ? now : null,
    verified_by: decision === "verified" ? "ops" : null,
  };
  if (decision !== "verified") updatePayload.is_online = false;

  const { data, error } = await admin
    .from("rr_drivers")
    .update(updatePayload)
    .eq("id", driverId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateAll();
  return data as Driver;
}

export async function listDriversPendingVerification() {
  if (!useAdmin()) {
    return mockRepo
      .listDrivers()
      .filter(
        (d) =>
          d.verification_status === "pending" ||
          (!d.verification_status && !d.id_verified),
      );
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Driver[];
}

export async function rateCustomerByDriver(
  jobId: string,
  driverId: string,
  stars: number,
  comment?: string,
) {
  if (stars < 1 || stars > 5) throw new Error("Stars must be 1–5.");
  const now = new Date().toISOString();

  if (!useAdmin()) {
    const job = mockRepo.rateCustomer(jobId, driverId, stars, comment);
    revalidateAll();
    return job;
  }

  const admin = createAdminClient();
  const { data: job, error: jobErr } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (jobErr || !job) throw new Error(jobErr?.message ?? "Job not found");
  if (job.driver_id !== driverId) throw new Error("Not your trip.");
  if (job.status !== "completed") throw new Error("Trip must be completed first.");
  if (job.customer_rating_stars != null) {
    throw new Error("You already rated this customer.");
  }

  const { data, error } = await admin
    .from("rr_jobs")
    .update({
      customer_rating_stars: stars,
      customer_rating_comment: comment?.trim() || null,
      customer_rated_at: now,
    })
    .eq("id", jobId)
    .select(JOB_WITH_RELATIONS)
    .single();
  if (error) throw new Error(error.message);
  revalidateAll();
  return data as JobWithDriver;
}

/** Driver rates the merchant/shop after a shop-linked delivery. */
export async function rateShopByDriver(
  jobId: string,
  driverId: string,
  stars: number,
  comment?: string,
) {
  if (stars < 1 || stars > 5) throw new Error("Stars must be 1–5.");

  if (!useAdmin()) {
    revalidateAll();
    return { ok: true as const, stars };
  }

  const admin = createAdminClient();
  const { data: job, error: jobErr } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (jobErr || !job) throw new Error(jobErr?.message ?? "Job not found");
  if (job.driver_id !== driverId) throw new Error("Not your trip.");
  if (job.status !== "completed") throw new Error("Trip must be completed first.");
  if (!job.shop_id) throw new Error("This trip is not linked to a shop.");

  const { data: existing } = await admin
    .from("rr_shop_ratings")
    .select("id")
    .eq("job_id", jobId)
    .maybeSingle();
  if (existing) throw new Error("You already rated this merchant.");

  const { error: insErr } = await admin.from("rr_shop_ratings").insert({
    shop_id: job.shop_id,
    driver_id: driverId,
    job_id: jobId,
    stars,
    comment: comment?.trim() || null,
  });
  if (insErr) throw new Error(insErr.message);

  const { data: shop } = await admin
    .from("rr_shops")
    .select("rating_avg, rating_count")
    .eq("id", job.shop_id)
    .maybeSingle();

  const prevCount = Number(shop?.rating_count) || 0;
  const prevAvg = Number(shop?.rating_avg) || 5;
  const newCount = prevCount + 1;
  const newAvg =
    Math.round(((prevAvg * prevCount + stars) / newCount) * 10) / 10;

  await admin
    .from("rr_shops")
    .update({ rating_avg: newAvg, rating_count: newCount })
    .eq("id", job.shop_id);

  revalidateAll();
  return { ok: true as const, stars, rating_avg: newAvg };
}

export async function submitDriverDocuments(
  driverId: string,
  formData: FormData,
) {
  const licenseNumber = String(formData.get("license_number") ?? "").trim();
  const idFile = formData.get("id_doc");
  const licenseFile = formData.get("license_doc");

  if (!licenseNumber) {
    throw new Error("Driver's license number is required.");
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

/**
 * Customer-facing signed URLs for driver selfie + vehicle photo.
 * Returns nulls when missing / mock / unsigned — UI falls back to initials.
 */
export async function getDriverDisplayPhotos(paths: {
  selfie_url?: string | null;
  vehicle_front_url?: string | null;
}): Promise<{ selfie: string | null; vehicle: string | null }> {
  async function sign(path: string | null | undefined): Promise<string | null> {
    if (!path || path.startsWith("mock://")) return null;
    if (!useAdmin()) return null;
    try {
      return await getDriverDocSignedUrl(path);
    } catch {
      return null;
    }
  }
  const [selfie, vehicle] = await Promise.all([
    sign(paths.selfie_url),
    sign(paths.vehicle_front_url),
  ]);
  return { selfie, vehicle };
}

const RIDER_PHOTOS_BUCKET = "rider-photos";

function normalizeRiderPhoneKey(phone: string) {
  return phone.replace(/\D/g, "");
}

/**
 * Upload rider face photo to private rider-photos bucket.
 * Returns storage path (or mock:// path when offline). Client also keeps a
 * data URL in guest localStorage for booking without Storage.
 */
export async function uploadRiderPhoto(formData: FormData): Promise<{
  photo_url: string;
}> {
  const phone = String(formData.get("phone") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const country_code = String(formData.get("country_code") ?? DEFAULT_COUNTRY).trim();
  const file = requireImageFile(formData, "photo", "Rider photo");
  const phoneKey = normalizeRiderPhoneKey(phone);
  if (!phoneKey) throw new Error("Phone is required to save your photo.");

  if (!useAdmin()) {
    const mockPath = `mock://rider-photos/${phoneKey}/${Date.now()}.jpg`;
    return { photo_url: mockPath };
  }

  const admin = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${phoneKey}/profile-${Date.now()}.${ext === "png" ? "png" : "jpg"}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(RIDER_PHOTOS_BUCKET).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  await admin.from("rr_guest_profiles").upsert(
    {
      guest_phone: phoneKey,
      name: name || null,
      photo_url: path,
      country_code,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "guest_phone" },
  );

  return { photo_url: path };
}

/** Remove rider photo from Storage + guest profile row (service role). */
export async function deleteRiderPhoto(phone: string): Promise<void> {
  const phoneKey = normalizeRiderPhoneKey(phone);
  if (!phoneKey) return;
  if (!useAdmin()) return;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("rr_guest_profiles")
    .select("photo_url")
    .eq("guest_phone", phoneKey)
    .maybeSingle();

  const path = row?.photo_url as string | undefined;
  if (path && !path.startsWith("mock://")) {
    await admin.storage.from(RIDER_PHOTOS_BUCKET).remove([path]);
  }
  await admin
    .from("rr_guest_profiles")
    .update({ photo_url: null, updated_at: new Date().toISOString() })
    .eq("guest_phone", phoneKey);
}

/**
 * Signed URL for a rider photo path — only for drivers viewing a job they hold.
 * Pass jobId + driverId; fails closed if the driver is not assigned / offered.
 */
export async function getRiderPhotoSignedUrlForDriver(opts: {
  storagePath: string;
  jobId: string;
  driverId: string;
}): Promise<string | null> {
  const { storagePath, jobId, driverId } = opts;
  if (!storagePath) return null;
  if (storagePath.startsWith("data:image/")) return storagePath;
  if (storagePath.startsWith("mock://")) return null;

  if (!useAdmin()) return null;

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("rr_jobs")
    .select("id, driver_id, offered_driver_id")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) return null;
  const allowed =
    job.driver_id === driverId || job.offered_driver_id === driverId;
  if (!allowed) return null;

  const { data, error } = await admin.storage
    .from(RIDER_PHOTOS_BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error) return null;
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
      (j.status === "new" || j.status === "searching_driver") &&
      vehicleFitsJob(driver.vehicle_type, j.required_vehicle) &&
      (!driver.country_code ||
        !j.country_code ||
        driver.country_code === j.country_code),
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
  customer_phone?: string | null;
  country_code?: string | null;
  service_type?: ServiceType | null;
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
      service_type: params.service_type,
      country_code: params.country_code,
      pickup_lat: params.pickup_lat,
      pickup_lng: params.pickup_lng,
      dropoff_lat: params.dropoff_lat,
      dropoff_lng: params.dropoff_lng,
      at: params.at ?? null,
      customer_phone: params.customer_phone,
    });
    if (!fare.quote_ready) {
      throw new Error(
        "Pickup and dropoff must be pinned before paying. We cannot charge a fare without a driving route.",
      );
    }
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
  try {
    return await createJobInner({
      ...input,
      details: sanitizeJobDetails(input.details) as NewJobInput["details"],
    });
  } catch (err) {
    throw friendlyBookingError(err);
  }
}

async function createJobInner(input: NewJobInput) {
  if (!input.pickup_landmark?.trim() || !input.dropoff_landmark?.trim()) {
    throw new Error("Pickup and dropoff landmarks are required.");
  }

  if (
    input.pickup_lat == null ||
    input.pickup_lng == null ||
    input.dropoff_lat == null ||
    input.dropoff_lng == null
  ) {
    throw new Error(
      "Pickup and dropoff must be chosen from search or pinned on the map. We cannot quote a fare without both locations.",
    );
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
  // Driver rate is sacred. Village Pass only waives platform booking fee.
  const countryCode = input.country_code || DEFAULT_COUNTRY;
  const fare = await resolveFare({
    vehicle: input.required_vehicle,
    service_type: input.service_type,
    country_code: countryCode,
    pickup_lat: input.pickup_lat,
    pickup_lng: input.pickup_lng,
    dropoff_lat: input.dropoff_lat,
    dropoff_lng: input.dropoff_lng,
    at: input.scheduled_for ?? null,
    customer_phone: input.customer_phone,
    details: input.details,
  });
  if (!fare.quote_ready) {
    throw new Error(
      "Pickup and dropoff must be chosen from search or pinned on the map. We cannot quote a fare without both locations.",
    );
  }

  if (!useAdmin()) {
    const job = mockRepo.createJob({
      ...input,
      fee_amount: fare.fee_amount,
    });
    job.platform_commission = fare.platform_commission;
    job.driver_payout = fare.driver_payout;
    job.fee_currency = fare.currency;
    job.currency = fare.currency;
    job.booking_fee = fare.booking_fee;
    job.priority_score = fare.village_pass ? 1 : 0;
    job.village_pass = fare.village_pass;
    job.weight_category = fare.weight_category;
    job.base_fare = fare.base_fee_amount;
    job.distance_fare = fare.distance_fare;
    job.distance_km = fare.distance_km;
    job.total_fare = fare.fee_amount;
    const wearing =
      input.service_type === "ride" &&
      input.details &&
      typeof (input.details as { wearing?: unknown }).wearing === "string"
        ? String((input.details as { wearing?: string }).wearing).trim()
        : "";
    if (wearing) {
      await logRiderWear({
        description: wearing,
        jobId: job.id,
        country: countryCode,
      });
    }
    revalidateAll();
    return job;
  }

  if (onlinePayment) {
    const admin = createAdminClient();
    const { data: byCapture } = await admin
      .from("rr_jobs")
      .select(JOB_WITH_RELATIONS)
      .eq("paypal_capture_id", onlinePayment.paypalCaptureId)
      .maybeSingle();
    if (byCapture) return byCapture as JobWithDriver;
    const { data: byOrder } = await admin
      .from("rr_jobs")
      .select(JOB_WITH_RELATIONS)
      .eq("paypal_order_id", onlinePayment.paypalOrderId)
      .maybeSingle();
    if (byOrder) return byOrder as JobWithDriver;
  }

  const paidAt = isCash ? null : new Date().toISOString();
  const riderPhotoPath =
    input.details &&
    typeof input.details === "object" &&
    typeof (input.details as { rider_photo_url?: unknown }).rider_photo_url ===
      "string"
      ? String(
          (input.details as { rider_photo_url: string }).rider_photo_url,
        ).trim()
      : "";
  const row = {
    reference_code: refCode(),
    status: "searching_driver",
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
    ...(riderPhotoPath && !riderPhotoPath.startsWith("mock://")
      ? { customer_photo_url: riderPhotoPath }
      : {}),
    fee_amount: fare.fee_amount,
    platform_commission: fare.platform_commission,
    driver_payout: fare.driver_payout,
    booking_fee: fare.booking_fee,
    priority_score: fare.village_pass ? 1 : 0,
    village_pass: fare.village_pass,
    weight_category: fare.weight_category,
    base_fare: fare.base_fee_amount,
    distance_fare: fare.distance_fare,
    distance_km: fare.distance_km,
    total_fare: fare.fee_amount,
    fee_currency: fare.currency,
    country_code: countryCode,
    currency: fare.currency,
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
    const wearing =
      input.service_type === "ride" &&
      input.details &&
      typeof (input.details as { wearing?: unknown }).wearing === "string"
        ? String((input.details as { wearing?: string }).wearing).trim()
        : "";
    if (wearing) {
      await logRiderWear({
        description: wearing,
        jobId: data.id,
        country: countryCode,
      });
    }
    revalidateAll();
    return data as JobWithDriver;
  } catch (err) {
    // Older DBs may lack motorcycle enum — still create the booking as sedan.
    const msg = err instanceof Error ? err.message : String(err);
    if (
      row.required_vehicle === "motorcycle" &&
      /motorcycle|enum|invalid input|check constraint/i.test(msg)
    ) {
      try {
        const fallback = await insertPaidJob({
          ...row,
          required_vehicle: "sedan",
          dispatcher_notes: [
            row.dispatcher_notes,
            "Local bike/auto mode booked — assigned as car until motorcycle vehicle type is enabled",
          ]
            .filter(Boolean)
            .join(" · "),
        });
        revalidateAll();
        return fallback as JobWithDriver;
      } catch {
        /* fall through */
      }
    }
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
      .select(JOB_WITH_RELATIONS)
      .eq("paypal_order_id", orderId)
      .maybeSingle();
    if (existing) return existing as JobWithDriver;
  }

  // Quote before capture so a bad pin cannot take money then fail the job.
  const fare = await resolveFare({
    vehicle: draft.required_vehicle,
    service_type: draft.service_type,
    country_code: draft.country_code || DEFAULT_COUNTRY,
    pickup_lat: draft.pickup_lat,
    pickup_lng: draft.pickup_lng,
    dropoff_lat: draft.dropoff_lat,
    dropoff_lng: draft.dropoff_lng,
    at: draft.scheduled_for ?? null,
    customer_phone: draft.customer_phone,
  });
  if (!fare.quote_ready) {
    throw new Error(
      "Pickup and dropoff must be pinned before paying. We cannot charge a fare without a driving route.",
    );
  }

  const captured = await paypalCaptureOrder(orderId);

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
  try {
    const fare = await resolveFare({
      vehicle: draft.required_vehicle,
      service_type: draft.service_type,
      country_code: draft.country_code || DEFAULT_COUNTRY,
      pickup_lat: draft.pickup_lat,
      pickup_lng: draft.pickup_lng,
      dropoff_lat: draft.dropoff_lat,
      dropoff_lng: draft.dropoff_lng,
      at: draft.scheduled_for ?? null,
      customer_phone: draft.customer_phone,
      details: draft.details,
    });
    return await createJob({
      ...draft,
      details: sanitizeJobDetails(draft.details) as NewJobInput["details"],
      fee_amount: fare.fee_amount,
      payment: { method: "cash" },
    });
  } catch (err) {
    throw friendlyBookingError(err);
  }
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
      .select(JOB_WITH_RELATIONS)
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

/**
 * Sell door → create Supabase auth user, set role=merchant, link rr_shops.user_id
 * and rr_profiles.shop_id. Generates referral code; optional referred_by.
 */
export async function registerMerchantShop(input: MerchantRegisterInput): Promise<{
  shop: Shop;
  email: string;
}> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid business email.");
  }
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (!input.name.trim() || !input.phone.trim() || !input.landmark.trim()) {
    throw new Error("Business name, phone, and landmark are required.");
  }

  const { generateReferralCode, notifyPartner } = await import("./partner");
  const { mockPartnerStore } = await import("./partner-mock");

  let referredBy: string | null = null;
  const refIn = input.referral_code?.trim();
  if (refIn) {
    if (!useAdmin()) {
      referredBy = mockRepo.findShopByReferralCode(refIn)?.id ?? null;
    } else {
      const admin = createAdminClient();
      const { data } = await admin
        .from("rr_shops")
        .select("id")
        .ilike("referral_code", refIn)
        .maybeSingle();
      referredBy = data?.id ?? null;
    }
    if (!referredBy) {
      throw new Error("Referral code not found. Leave blank or check with your partner.");
    }
  }

  let referralCode = generateReferralCode(input.name.trim());

  if (!useAdmin()) {
    const shop = mockRepo.createShop({
      name: input.name.trim(),
      phone: input.phone.trim(),
      category: input.category,
      landmark: input.landmark.trim(),
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      notes: input.notes ?? null,
      referral_code: referralCode,
      referred_by_shop_id: referredBy,
    });
    shop.user_id = `mock-merchant-${shop.id}`;
    if (referredBy) {
      mockPartnerStore.trackReferral(referredBy);
      await notifyPartner({
        shopId: referredBy,
        type: "referral",
        title: "New partner joined with your code",
        body: `${shop.name} signed up using your referral code.`,
        emailBody: `${shop.name} registered on Village Ride with your code ${refIn}.`,
      });
    }
    try {
      const { publishShopAsLocation } = await import("./actions-locations");
      await publishShopAsLocation({
        shop_id: shop.id,
        name: shop.name,
        category: input.category,
        landmark: input.landmark.trim(),
        latitude: input.lat ?? null,
        longitude: input.lng ?? null,
        phone: input.phone.trim(),
      });
    } catch (err) {
      console.error("[locations] shop publish failed", err);
    }
    revalidateAll();
    return { shop, email };
  }

  const admin = createAdminClient();

  // Ensure unique referral code
  for (let i = 0; i < 8; i++) {
    const { data: clash } = await admin
      .from("rr_shops")
      .select("id")
      .ilike("referral_code", referralCode)
      .maybeSingle();
    if (!clash) break;
    referralCode = generateReferralCode(input.name.trim());
  }

  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "merchant",
      full_name: input.name.trim(),
    },
  });
  if (authErr || !created.user) {
    throw new Error(authErr?.message ?? "Could not create merchant account");
  }
  const userId = created.user.id;

  const { data: shop, error: shopErr } = await admin
    .from("rr_shops")
    .insert({
      name: input.name.trim(),
      phone: input.phone.trim(),
      category: input.category,
      landmark: input.landmark.trim(),
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      notes: input.notes ?? null,
      user_id: userId,
      delivers: true,
      is_active: true,
      referral_code: referralCode,
      referred_by_shop_id: referredBy,
    })
    .select("*")
    .single();

  if (shopErr || !shop) {
    await admin.auth.admin.deleteUser(userId).catch(() => null);
    throw new Error(shopErr?.message ?? "Could not create shop");
  }

  const { error: profileErr } = await admin.from("rr_profiles").upsert(
    {
      id: userId,
      role: "merchant",
      full_name: input.name.trim(),
      phone: input.phone.trim(),
      shop_id: shop.id,
    },
    { onConflict: "id" },
  );
  if (profileErr) {
    throw new Error(
      `Shop created but profile update failed: ${profileErr.message}. Set role=merchant manually.`,
    );
  }

  if (referredBy) {
    await notifyPartner({
      shopId: referredBy,
      type: "referral",
      title: "New partner joined with your code",
      body: `${shop.name} signed up using your referral code.`,
      emailBody: `${shop.name} registered on Village Ride with your code ${refIn}.`,
    });
    try {
      const {
        referralBonusEmail,
        sendViaPartnerWebhook,
      } = await import("./email-templates");
      const { createAdminClient } = await import("./supabase/admin");
      const admin = createAdminClient();
      const { data: referrer } = await admin
        .from("rr_shops")
        .select("name, user_id, referral_code")
        .eq("id", referredBy)
        .maybeSingle();
      let to: string | null = null;
      if (referrer?.user_id) {
        const { data: user } = await admin.auth.admin.getUserById(
          referrer.user_id,
        );
        to = user.user?.email ?? null;
      }
      if (to) {
        const site =
          process.env.NEXT_PUBLIC_SITE_URL ?? "https://village-ride.vercel.app";
        const { count } = await admin
          .from("rr_shops")
          .select("id", { count: "exact", head: true })
          .eq("referred_by_shop_id", referredBy);
        const bonusZar = 50;
        const tpl = referralBonusEmail({
          shopName: referrer?.name ?? "Partner",
          referredName: shop.name,
          bonusZar,
          totalBonusZar: (count ?? 1) * bonusZar,
          shareUrl: `${site}/shop?ref=${referrer?.referral_code ?? ""}`,
        });
        await sendViaPartnerWebhook({
          to,
          template: tpl,
          templateKey: "referral_bonus",
        });
      }
    } catch {
      /* optional */
    }
  }

  try {
    const { welcomeMerchantEmail, sendViaPartnerWebhook } = await import(
      "./email-templates"
    );
    const site =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://village-ride.vercel.app";
    const tpl = welcomeMerchantEmail({
      shopName: (shop as { name: string }).name,
      email,
      referralCode: (shop as { referral_code?: string }).referral_code,
      dashboardUrl: `${site}/merchant/dashboard`,
    });
    await sendViaPartnerWebhook({
      to: email,
      template: tpl,
      templateKey: "welcome_merchant",
    });
  } catch {
    /* optional */
  }

  try {
    const { publishShopAsLocation } = await import("./actions-locations");
    await publishShopAsLocation({
      shop_id: (shop as Shop).id,
      name: input.name.trim(),
      category: input.category,
      landmark: input.landmark.trim(),
      latitude: input.lat ?? null,
      longitude: input.lng ?? null,
      phone: input.phone.trim(),
    });
  } catch (err) {
    console.error("[locations] shop publish failed", err);
  }

  revalidateAll();
  return { shop: shop as Shop, email };
}

/** Current signed-in merchant's shop + orders (for /merchant/dashboard). */
export async function getMerchantDashboardData(): Promise<{
  shop: Shop | null;
  jobs: JobWithDriver[];
  role: string | null;
  email: string | null;
  notifications: import("./types").PartnerNotification[];
  reports: import("./types").PartnerWeeklyReport[];
  referralCount: number;
  shopOrders: import("./types").ShopOrder[];
} | null> {
  if (!useAdmin()) {
    const { mockPartnerStore } = await import("./partner-mock");
    const shops = mockRepo.listShops();
    const shop = shops[0] ?? null;
    const jobs = shop
      ? mockRepo.listJobs().filter((j) => j.shop_id === shop.id)
      : [];
    return {
      shop,
      jobs,
      role: "merchant",
      email: "demo@merchant.local",
      notifications: shop ? mockPartnerStore.listNotifications(shop.id) : [],
      reports: shop ? mockPartnerStore.listReports(shop.id) : [],
      referralCount: shop
        ? shops.filter((s) => s.referred_by_shop_id === shop.id).length
        : 0,
      shopOrders: shop ? mockRepo.listShopOrders(shop.id) : [],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("rr_profiles")
    .select("role, shop_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? null;
  if (
    role &&
    role !== "merchant" &&
    role !== "admin" &&
    role !== "dispatcher"
  ) {
    return {
      shop: null,
      jobs: [],
      role,
      email: user.email ?? null,
      notifications: [],
      reports: [],
      referralCount: 0,
      shopOrders: [],
    };
  }

  let shop: Shop | null = null;
  if (profile?.shop_id) {
    const { data } = await admin
      .from("rr_shops")
      .select("*")
      .eq("id", profile.shop_id)
      .maybeSingle();
    shop = (data as Shop | null) ?? null;
  }
  if (!shop) {
    const { data } = await admin
      .from("rr_shops")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    shop = (data as Shop | null) ?? null;
    if (shop && profile && !profile.shop_id) {
      await admin
        .from("rr_profiles")
        .update({ shop_id: shop.id, role: "merchant" })
        .eq("id", user.id);
    }
  }

  if (!shop) {
    return {
      shop: null,
      jobs: [],
      role: role ?? "merchant",
      email: user.email ?? null,
      notifications: [],
      reports: [],
      referralCount: 0,
      shopOrders: [],
    };
  }

  // Ensure referral code exists (backfill for older shops)
  if (!shop.referral_code) {
    try {
      const { generateReferralCode } = await import("./partner");
      let code = generateReferralCode(shop.name);
      for (let i = 0; i < 5; i++) {
        const { data: clash } = await admin
          .from("rr_shops")
          .select("id")
          .ilike("referral_code", code)
          .maybeSingle();
        if (!clash) break;
        code = generateReferralCode(shop.name);
      }
      const { error: codeErr } = await admin
        .from("rr_shops")
        .update({ referral_code: code })
        .eq("id", shop.id);
      if (!codeErr) shop = { ...shop, referral_code: code };
    } catch {
      /* column missing until PARTNER_SYSTEM.sql */
    }
  }

  const { data: jobs, error } = await admin
    .from("rr_jobs")
    .select(JOB_WITH_RELATIONS)
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  let notifications: import("./types").PartnerNotification[] = [];
  let reports: import("./types").PartnerWeeklyReport[] = [];
  let referralCount = 0;

  try {
    const [nRes, rRes, refRes] = await Promise.all([
      admin
        .from("rr_partner_notifications")
        .select("*")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false })
        .limit(30),
      admin
        .from("rr_partner_weekly_reports")
        .select("*")
        .eq("shop_id", shop.id)
        .order("week_key", { ascending: false })
        .limit(8),
      admin
        .from("rr_shops")
        .select("id", { count: "exact", head: true })
        .eq("referred_by_shop_id", shop.id),
    ]);
    if (!nRes.error) {
      notifications = (nRes.data ?? []) as import("./types").PartnerNotification[];
    }
    if (!rRes.error) {
      reports = (rRes.data ?? []) as import("./types").PartnerWeeklyReport[];
    }
    if (!refRes.error) {
      referralCount = refRes.count ?? 0;
    }
  } catch {
    /* PARTNER_SYSTEM.sql not applied yet */
  }

  let shopOrders: import("./types").ShopOrder[] = [];
  try {
    const { listShopOrdersForShop } = await import("./actions-shop-orders");
    shopOrders = await listShopOrdersForShop(shop.id);
  } catch {
    shopOrders = [];
  }

  return {
    shop,
    jobs: (jobs ?? []) as JobWithDriver[],
    role: role ?? "merchant",
    email: user.email ?? null,
    notifications,
    reports,
    referralCount,
    shopOrders,
  };
}

/**
 * Authenticated merchant creates a delivery linked to their shop.
 * Reuses createJob → insertPaidJob → FCM auto-dispatch.
 */
export async function createMerchantDelivery(
  input: import("./types").MerchantDeliveryInput,
) {
  if (!input.customer_name?.trim() || !input.customer_phone?.trim()) {
    throw new Error("Customer name and phone are required.");
  }
  if (!input.dropoff_landmark?.trim()) {
    throw new Error("Drop-off landmark is required.");
  }
  if (!input.item_description?.trim()) {
    throw new Error("Describe what to deliver.");
  }

  const dash = await getMerchantDashboardData();
  if (!dash?.shop) {
    throw new Error("Sign in as a merchant with a linked shop first.");
  }
  const shop = dash.shop;

  const size = input.size || "medium";
  const required = suggestVehicle({
    service_type: "delivery",
    delivery_size: size,
  });

  const job = await createCashJob({
    service_type: "delivery",
    required_vehicle: required,
    customer_name: input.customer_name.trim(),
    customer_phone: input.customer_phone.trim(),
    pickup_lat: shop.lat,
    pickup_lng: shop.lng,
    pickup_landmark: `${shop.name} — ${shop.landmark}`,
    dropoff_lat: input.dropoff_lat ?? null,
    dropoff_lng: input.dropoff_lng ?? null,
    dropoff_landmark: input.dropoff_landmark.trim(),
    scheduled_for: input.scheduled_for ?? null,
    details: {
      item_description: input.item_description.trim(),
      size,
      needs_helpers: Boolean(input.needs_helpers) || size === "large" || size === "xl",
      sender_type: "business",
    },
    fee_amount: 0,
    shop_id: shop.id,
    product_summary: input.item_description.trim(),
    dispatcher_notes: `Partner delivery from ${shop.name}`,
    country_code: input.country_code || DEFAULT_COUNTRY,
  });

  const { notifyPartnerForJob } = await import("./partner");
  await notifyPartnerForJob(job, "order_created");

  revalidateAll();
  return job;
}

export async function markPartnerNotificationsRead(ids: string[]) {
  if (!ids.length) return;
  if (!useAdmin()) {
    const { mockPartnerStore } = await import("./partner-mock");
    mockPartnerStore.markRead(ids);
    revalidatePath("/merchant/dashboard");
    return;
  }

  const dash = await getMerchantDashboardData();
  if (!dash?.shop) throw new Error("Not signed in as merchant");

  const admin = createAdminClient();
  await admin
    .from("rr_partner_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("shop_id", dash.shop.id)
    .in("id", ids)
    .is("read_at", null);

  revalidatePath("/merchant/dashboard");
}

export async function generateMyWeeklyReport() {
  const dash = await getMerchantDashboardData();
  if (!dash?.shop) throw new Error("Not signed in as merchant");
  const { generateShopWeeklyReport } = await import("./partner");
  const result = await generateShopWeeklyReport(dash.shop);
  revalidatePath("/merchant/dashboard");
  return result;
}

export async function saveMerchantFcmToken(token: string) {
  if (!token?.trim()) return;
  if (!useAdmin()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin
    .from("rr_profiles")
    .update({
      fcm_token: token.trim(),
      fcm_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
}

export async function createProduct(input: NewProductInput) {
  if (!useAdmin()) {
    const product = mockRepo.createProduct(input);
    revalidateAll();
    return product;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to add products.");

  const admin = createAdminClient();
  const { data: shop } = await admin
    .from("rr_shops")
    .select("id, user_id")
    .eq("id", input.shop_id)
    .maybeSingle();
  if (!shop || shop.user_id !== user.id) {
    const { data: profile } = await admin
      .from("rr_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin" && profile?.role !== "dispatcher") {
      throw new Error("You can only add products to your own shop.");
    }
  }

  const { data, error } = await admin
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

  const isCash = input.payment?.method === "cash";
  const isPayPal =
    input.payment?.method === "paypal" &&
    Boolean(input.payment.paypalOrderId) &&
    Boolean(input.payment.paypalCaptureId);
  if (!isCash && !isPayPal) {
    throw new Error("Cash or PayPal payment required.");
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
    service_type: "delivery",
    pickup_lat: shop.lat,
    pickup_lng: shop.lng,
    dropoff_lat: input.dropoff_lat,
    dropoff_lng: input.dropoff_lng,
    customer_phone: input.buyer_phone,
  });

  return createJob({
    service_type: "delivery",
    required_vehicle: required,
    customer_name: input.buyer_name,
    customer_phone: input.buyer_phone,
    pickup_lat: shop.lat,
    pickup_lng: shop.lng,
    pickup_landmark: `${shop.name} — ${shop.landmark}`,
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
    product_summary: `${product.name} (${product.price})`,
    dispatcher_notes: `Shop order from ${shop.name} — paid with ${
      isCash ? "cash" : "PayPal"
    }`,
    payment: input.payment,
  }).then(async (job) => {
    const { notifyPartnerForJob } = await import("./partner");
    await notifyPartnerForJob(job, "order_created");
    return job;
  });
}

/** Cash shop delivery — pay the driver; platform fee from driver wallet. */
export async function createCashShopOrder(
  input: Omit<ShopOrderInput, "payment">,
) {
  return createShopOrder({
    ...input,
    payment: { method: "cash" },
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
      status: "confirmed",
      assigned_at: now,
      driver_lat: driverRow.last_lat,
      driver_lng: driverRow.last_lng,
      driver_location_at: driverRow.last_location_at ?? now,
      offered_driver_id: null,
      offer_expires_at: null,
      dispatch_exhausted: false,
    })
    .eq("id", jobId)
    .select(JOB_WITH_RELATIONS)
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
    .select(JOB_WITH_RELATIONS)
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return data as JobWithDriver;
}

/**
 * Rider cancel — free for Village Pass (no cancellation fee charged).
 * Allowed while still searching / not yet in progress.
 */
export async function cancelRiderJobAction(params: {
  jobId: string;
  customerPhone: string;
}) {
  const phoneDigits = params.customerPhone.replace(/\D/g, "");
  if (phoneDigits.length < 9) throw new Error("Phone required to cancel.");

  if (!useAdmin()) {
    const job = mockRepo.listJobs().find((j) => j.id === params.jobId);
    if (!job) throw new Error("Trip not found.");
    const jobPhone = String(job.customer_phone || "").replace(/\D/g, "");
    if (!jobPhone.endsWith(phoneDigits.slice(-9))) {
      throw new Error("Phone does not match this trip.");
    }
    if (
      job.status !== "new" &&
      job.status !== "searching_driver" &&
      job.status !== "assigned" &&
      job.status !== "confirmed"
    ) {
      throw new Error("This trip can no longer be cancelled in-app.");
    }
    // Village Pass perk: free cancellations (no fee applied either way today)
    const updated = mockRepo.updateStatus(params.jobId, "cancelled");
    revalidateAll();
    return { job: updated, freeCancel: Boolean(job.village_pass) };
  }

  const admin = createAdminClient();
  const { data: job, error: fetchErr } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", params.jobId)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!job) throw new Error("Trip not found.");

  const jobPhone = String(job.customer_phone || "").replace(/\D/g, "");
  if (!jobPhone.endsWith(phoneDigits.slice(-9))) {
    throw new Error("Phone does not match this trip.");
  }
  if (
    !["new", "searching_driver", "assigned", "confirmed"].includes(job.status)
  ) {
    throw new Error("This trip can no longer be cancelled in-app.");
  }

  const { data, error } = await admin
    .from("rr_jobs")
    .update({
      status: "cancelled",
      offered_driver_id: null,
      offer_expires_at: null,
      dispatcher_notes: [
        job.dispatcher_notes,
        job.village_pass
          ? "Cancelled by rider (Village Pass — free cancel)"
          : "Cancelled by rider",
      ]
        .filter(Boolean)
        .join(" · "),
    })
    .eq("id", params.jobId)
    .select(JOB_WITH_RELATIONS)
    .single();

  if (error) throw new Error(error.message);
  revalidateAll();
  return { job: data as JobWithDriver, freeCancel: Boolean(job.village_pass) };
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
    if (online) {
      const gate = driverCanGoOnline(allowed);
      if (!gate.ok) throw new Error(gate.reason || "Cannot go online.");
      if (!driverEligibleForDispatch(allowed)) {
        throw new Error(creditLimitBlockMessage(allowed.country_code));
      }
    }
    const driver = mockRepo.setDriverOnline(driverId, online, lat, lng);
    revalidateAll();
    return driver;
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("id", driverId)
    .maybeSingle();

  if (
    !existing ||
    existing.approval_status !== "approved" ||
    !existing.is_active
  ) {
    throw new Error("Only approved drivers can go online.");
  }

  if (online) {
    const gate = driverCanGoOnline(existing as Driver);
    if (!gate.ok) throw new Error(gate.reason || "Cannot go online.");
    if (!driverEligibleForDispatch(existing as Driver)) {
      throw new Error(
        creditLimitBlockMessage((existing as Driver).country_code),
      );
    }
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

export async function saveDriverFcmToken(driverId: string, token: string) {
  if (!token.trim()) throw new Error("Missing FCM token");
  if (!useAdmin()) {
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    driver.fcm_token = token.trim();
    driver.fcm_updated_at = new Date().toISOString();
    revalidatePath("/driver");
    return driver;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_drivers")
    .update({
      fcm_token: token.trim(),
      fcm_updated_at: new Date().toISOString(),
    })
    .eq("id", driverId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/driver");
  return data as Driver;
}

export async function saveCustomerFcmToken(jobId: string, token: string) {
  if (!token.trim()) return null;
  if (!useAdmin()) {
    const job = mockRepo.listJobs().find((j) => j.id === jobId);
    if (job) job.customer_fcm_token = token.trim();
    return job ?? null;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rr_jobs")
    .update({ customer_fcm_token: token.trim() })
    .eq("id", jobId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function acceptOffer(jobId: string, driverId: string) {
  if (!useAdmin()) {
    const job = mockRepo.acceptOffer(jobId, driverId);
    if (job.shop_id) {
      const { notifyPartnerForJob } = await import("./partner");
      await notifyPartnerForJob(job, "driver_assigned");
    }
    revalidateAll();
    return job;
  }

  const admin = createAdminClient();
  const [{ data: jobRow }, { data: driverRow }] = await Promise.all([
    admin.from("rr_jobs").select("*").eq("id", jobId).single(),
    admin.from("rr_drivers").select("*").eq("id", driverId).single(),
  ]);

  if (!jobRow || !driverRow) throw new Error("Job or driver not found");
  if (!isSearchingStatus(jobRow.status)) throw new Error("Offer already taken");
  if (!driverEligibleForDispatch(driverRow as Driver)) {
    throw new Error(creditLimitBlockMessage((driverRow as Driver).country_code));
  }
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
      status: "confirmed",
      assigned_at: now,
      driver_lat: driverRow.last_lat,
      driver_lng: driverRow.last_lng,
      driver_location_at: driverRow.last_location_at ?? now,
      offered_driver_id: null,
      offer_expires_at: null,
      dispatch_exhausted: false,
    })
    .eq("id", jobId)
    .in("status", ["searching_driver", "new"])
    .select(JOB_WITH_RELATIONS)
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

  await sendPushToToken(
    (jobRow as Job).customer_fcm_token,
    buildCustomerConfirmPush(assigned as Job, driverRow as Driver),
  );

  if ((assigned as Job).shop_id) {
    const { notifyPartnerForJob } = await import("./partner");
    await notifyPartnerForJob(assigned as Job, "driver_assigned");
  }

  revalidateAll();
  return assigned as JobWithDriver;
}

export async function declineOffer(jobId: string, driverId: string) {
  if (!useAdmin()) {
    const app = mockRepo.declineOffer(jobId, driverId);
    revalidateAll();
    return app;
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

  try {
    await admin.from("rr_driver_rejections").insert({
      job_id: jobId,
      driver_id: driverId,
      reason: "declined_offer",
    });
    const { count } = await admin
      .from("rr_driver_rejections")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId);
    if ((count ?? 0) >= 3) {
      const { logAppError } = await import("./error-log");
      await logAppError({
        message: `Urgent: job ${jobId} rejected ${count} times`,
        context: "driver_rejection_cascade",
        severity: "critical",
        url: `/trip/${(data as { jobs?: { reference_code?: string } }).jobs?.reference_code ?? ""}`,
      });
      await admin
        .from("rr_jobs")
        .update({
          dispatcher_notes: [
            (data as { jobs?: { dispatcher_notes?: string } }).jobs
              ?.dispatcher_notes,
            "URGENT: 3+ driver rejections",
          ]
            .filter(Boolean)
            .join(" · "),
        })
        .eq("id", jobId);
    }
  } catch {
    /* table may be missing until PRODUCTION_OPS.sql */
  }

  const { data: job } = await admin
    .from("rr_jobs")
    .select("dispatch_index, status")
    .eq("id", jobId)
    .single();

  if (job && isSearchingStatus(job.status)) {
    await admin
      .from("rr_jobs")
      .update({
        offered_driver_id: null,
        offer_expires_at: null,
        dispatch_index: (Number(job.dispatch_index) || 0) + 1,
      })
      .eq("id", jobId)
      .in("status", ["searching_driver", "new"]);
    await offerNextDriver(jobId);
  }

  revalidateAll();
  return data as JobApplication;
}

export async function markDriverArrived(jobId: string, driverId: string) {
  if (!useAdmin()) {
    const already = driverHasArrived(mockRepo.getJob(jobId));
    const job = mockRepo.markDriverArrived(jobId, driverId);
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (!already && driver && job.customer_fcm_token) {
      await sendPushToToken(
        job.customer_fcm_token,
        buildCustomerDriverArrivedPush(job, driver),
      );
    }
    revalidateAll();
    return job;
  }

  const admin = createAdminClient();
  const { data: jobRow, error: fetchErr } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchErr || !jobRow) throw new Error(fetchErr?.message ?? "Job not found");
  if (jobRow.driver_id !== driverId) throw new Error("Not your job");
  if (!isConfirmedStatus(jobRow.status)) {
    throw new Error("Confirm the job before marking arrival");
  }

  if (driverHasArrived(jobRow as Job)) {
    const { data: existing } = await admin
      .from("rr_jobs")
      .select(JOB_WITH_RELATIONS)
      .eq("id", jobId)
      .single();
    return (existing ?? jobRow) as JobWithDriver;
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("rr_jobs")
    .update({
      details: mergeDriverArrivedDetails((jobRow as Job).details, now),
    })
    .eq("id", jobId)
    .eq("driver_id", driverId)
    .select(JOB_WITH_RELATIONS)
    .single();

  if (error) throw new Error(error.message);

  const typed = data as JobWithDriver;
  const driverRow = typed.drivers;
  if (driverRow && (jobRow as Job).customer_fcm_token) {
    await sendPushToToken(
      (jobRow as Job).customer_fcm_token,
      buildCustomerDriverArrivedPush(typed, driverRow),
    );
  }

  revalidateAll();
  return typed;
}

export async function startTrip(jobId: string, driverId: string) {
  if (!useAdmin()) {
    const job = mockRepo.startTrip(jobId, driverId);
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (driver && job.customer_fcm_token) {
      await sendPushToToken(
        job.customer_fcm_token,
        buildCustomerTripStartedPush(job, driver),
      );
    }
    revalidateAll();
    return job;
  }

  const admin = createAdminClient();
  const { data: jobRow, error: fetchErr } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchErr || !jobRow) throw new Error(fetchErr?.message ?? "Job not found");
  if (jobRow.driver_id !== driverId) throw new Error("Not your job");
  if (!isConfirmedStatus(jobRow.status)) {
    throw new Error("Job must be confirmed before starting");
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
    .select(JOB_WITH_RELATIONS)
    .single();

  if (error) throw new Error(error.message);

  const typed = data as JobWithDriver;
  const driverRow = typed.drivers;
  if (driverRow && (jobRow as Job).customer_fcm_token) {
    await sendPushToToken(
      (jobRow as Job).customer_fcm_token,
      buildCustomerTripStartedPush(typed, driverRow),
    );
  }

  revalidateAll();
  return typed;
}

export type CompleteTripOptions = {
  /** Required for cash trips: true = rider paid; false = flag ops, skip fee. */
  cashCollected?: boolean;
};

/**
 * Complete a trip and settle the wallet:
 * A) Cash + confirmed: deduct platform_fee (booking_fee) from driver prepaid wallet
 * A') Cash + not collected: complete + flag ops, no wallet change
 * B) Card/PayPal: credit driver's (total − platform_fee) — stored driver_payout
 * C) Village Pass: platform_fee was 0 at booking — cash deducts 0; card credits full driver fare
 */
export async function completeTrip(
  jobId: string,
  driverId: string,
  options?: CompleteTripOptions,
) {
  if (!useAdmin()) {
    const job = mockRepo.completeTrip(jobId, driverId, options);
    if (job.customer_fcm_token) {
      await sendPushToToken(
        job.customer_fcm_token,
        buildCustomerTripCompletedPush(job),
      );
    }
    if (job.shop_id) {
      const { notifyPartnerForJob } = await import("./partner");
      const remit = cashPlatformRemittance(job);
      const payout = cardDriverPayout(job);
      const note = isCardPaymentMethod(job.payment_method)
        ? `Card trip — driver payout R${payout} credited; platform kept R${remit}.`
        : job.cash_collected_confirmed === false
          ? "Cash not confirmed — flagged for ops (no fee deducted)."
          : `Platform fee R${remit} deducted from driver wallet.`;
      await notifyPartnerForJob(job, "order_completed", note);
    }
    try {
      await claimWeeklyTripBonus(driverId);
    } catch {
      /* ignore — not eligible yet */
    }
    try {
      const { processFoundingBonusOnTripComplete } = await import(
        "./actions-founding-bonus"
      );
      await processFoundingBonusOnTripComplete(driverId, job);
    } catch {
      /* founding bonus is best-effort */
    }
    revalidateAll();
    return job;
  }

  const admin = createAdminClient();
  const { data: jobRow, error: fetchErr } = await admin
    .from("rr_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchErr || !jobRow) throw new Error(fetchErr?.message ?? "Job not found");
  if (jobRow.driver_id !== driverId) throw new Error("Not your job");
  if (
    jobRow.status !== "in_progress" &&
    jobRow.status !== "assigned" &&
    jobRow.status !== "confirmed"
  ) {
    throw new Error("Job cannot be completed from this status");
  }

  const method = String(jobRow.payment_method ?? "cash");
  const cashTrip = isCashPaymentMethod(method);
  if (cashTrip && options?.cashCollected === undefined) {
    throw new Error("Confirm whether the rider paid cash before completing.");
  }

  const remit = cashPlatformRemittance(jobRow);
  const payout = cardDriverPayout(jobRow);

  const now = new Date().toISOString();
  const cashCollected = cashTrip ? Boolean(options?.cashCollected) : null;
  const cashDenied = cashTrip && options?.cashCollected === false;

  const jobPatch: Record<string, unknown> = {
    status: "completed",
    completed_at: now,
  };

  if (cashTrip) {
    jobPatch.cash_collected_confirmed = cashCollected;
    jobPatch.cash_confirmed_at = now;
    if (cashCollected) {
      jobPatch.payment_status = "cash_collected";
      jobPatch.paid_at = now;
    } else {
      jobPatch.payment_status = "unpaid";
      jobPatch.dispatcher_notes = [
        jobRow.dispatcher_notes,
        "CASH NOT COLLECTED — driver flagged for ops review",
      ]
        .filter(Boolean)
        .join(" · ");
    }
  }

  const { data, error } = await admin
    .from("rr_jobs")
    .update(jobPatch)
    .eq("id", jobId)
    .eq("driver_id", driverId)
    .select(JOB_WITH_RELATIONS)
    .single();

  if (error) throw new Error(error.message);

  const { data: driverRow } = await admin
    .from("rr_drivers")
    .select("wallet_balance")
    .eq("id", driverId)
    .maybeSingle();

  const bal = Number(driverRow?.wallet_balance ?? 0);
  let walletUpdate = {
    wallet_balance: bal,
    commission_owed: bal < 0 ? Math.abs(bal) : 0,
  };

  if (cashTrip && cashCollected) {
    // Scenario A (CASH): rider paid total to driver; deduct platform_fee from wallet
    walletUpdate = applyCommissionToWallet({
      walletBalance: bal,
      commission: remit,
    });
  } else if (isCardPaymentMethod(method) && !cashDenied) {
    // Scenario B (CARD): PayPal already captured at checkout; credit driver fare.
    walletUpdate = creditPayoutToWallet({
      walletBalance: bal,
      payout,
    });
  }
  // Scenario C (Village Pass): remit is 0 / payout is full driver fare — handled above

  await admin
    .from("rr_drivers")
    .update({
      is_online: true,
      wallet_balance: walletUpdate.wallet_balance,
      commission_owed: walletUpdate.commission_owed,
    })
    .eq("id", driverId);

  if ((data as Job).shop_id) {
    const { notifyPartnerForJob } = await import("./partner");
    const note = isCardPaymentMethod(method)
      ? `Card trip — driver payout R${payout} credited; platform kept R${remit}.`
      : cashDenied
        ? "Cash not confirmed — flagged for ops (no fee deducted)."
        : `Platform fee R${remit} deducted from driver wallet.`;
    await notifyPartnerForJob(data as Job, "order_completed", note);
  }

  if ((jobRow as Job).customer_fcm_token) {
    await sendPushToToken(
      (jobRow as Job).customer_fcm_token,
      buildCustomerTripCompletedPush(data as Job),
    );
  }

  try {
    await claimWeeklyTripBonus(driverId);
  } catch {
    /* not eligible yet */
  }

  try {
    const { processFoundingBonusOnTripComplete } = await import(
      "./actions-founding-bonus"
    );
    await processFoundingBonusOnTripComplete(driverId, data as Job);
  } catch {
    /* founding bonus is best-effort */
  }

  revalidateAll();
  return data as JobWithDriver;
}

function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function startOfWeekLocal(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
}

const WEEKLY_TRIP_BONUS = 100;
const WEEKLY_TRIP_TARGET = 10;

/**
 * Complete 10 trips this week → R100 wallet bonus (once per ISO week).
 */
export async function claimWeeklyTripBonus(driverId: string): Promise<{
  claimed: boolean;
  trips: number;
  target: number;
  bonus: number;
  periodKey: string;
  message: string;
}> {
  const periodKey = isoWeekKey();
  const from = startOfWeekLocal().toISOString();

  if (!useAdmin()) {
    const fromMs = startOfWeekLocal().getTime();
    const trips = mockRepo
      .listJobs()
      .filter(
        (j) =>
          j.driver_id === driverId &&
          j.status === "completed" &&
          new Date(j.completed_at || j.created_at).getTime() >= fromMs,
      ).length;
    if (trips < WEEKLY_TRIP_TARGET) {
      return {
        claimed: false,
        trips,
        target: WEEKLY_TRIP_TARGET,
        bonus: WEEKLY_TRIP_BONUS,
        periodKey,
        message: `${trips}/${WEEKLY_TRIP_TARGET} trips this week`,
      };
    }
    const claimKey = `incentive:${periodKey}`;
    const driver = mockRepo.listDrivers().find((d) => d.id === driverId);
    if (driver?.notes?.includes(claimKey)) {
      return {
        claimed: false,
        trips,
        target: WEEKLY_TRIP_TARGET,
        bonus: WEEKLY_TRIP_BONUS,
        periodKey,
        message: "Bonus already claimed this week",
      };
    }
    mockRepo.creditWallet(
      driverId,
      WEEKLY_TRIP_BONUS,
      `${claimKey} Weekly trip bonus`,
    );
    revalidateAll();
    return {
      claimed: true,
      trips,
      target: WEEKLY_TRIP_TARGET,
      bonus: WEEKLY_TRIP_BONUS,
      periodKey,
      message: `R${WEEKLY_TRIP_BONUS} bonus credited`,
    };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("rr_driver_incentive_claims")
    .select("driver_id")
    .eq("driver_id", driverId)
    .eq("period_key", periodKey)
    .maybeSingle();
  if (existing) {
    return {
      claimed: false,
      trips: WEEKLY_TRIP_TARGET,
      target: WEEKLY_TRIP_TARGET,
      bonus: WEEKLY_TRIP_BONUS,
      periodKey,
      message: "Bonus already claimed this week",
    };
  }

  const { count } = await admin
    .from("rr_jobs")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", driverId)
    .eq("status", "completed")
    .gte("completed_at", from);

  const trips = count ?? 0;
  if (trips < WEEKLY_TRIP_TARGET) {
    return {
      claimed: false,
      trips,
      target: WEEKLY_TRIP_TARGET,
      bonus: WEEKLY_TRIP_BONUS,
      periodKey,
      message: `${trips}/${WEEKLY_TRIP_TARGET} trips this week`,
    };
  }

  await creditDriverWallet(
    driverId,
    WEEKLY_TRIP_BONUS,
    `Weekly trip bonus ${periodKey}`,
  );
  await admin.from("rr_driver_incentive_claims").insert({
    driver_id: driverId,
    period_key: periodKey,
    bonus_amount: WEEKLY_TRIP_BONUS,
    trips_required: WEEKLY_TRIP_TARGET,
    trips_completed: trips,
  });

  revalidateAll();
  return {
    claimed: true,
    trips,
    target: WEEKLY_TRIP_TARGET,
    bonus: WEEKLY_TRIP_BONUS,
    periodKey,
    message: `R${WEEKLY_TRIP_BONUS} bonus credited`,
  };
}

/** Ops: credit a driver's wallet after EFT / eWallet top-up. */
export async function creditDriverWallet(
  driverId: string,
  amountZar: number,
  note?: string,
) {
  const amount = Math.round(Number(amountZar));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a positive top-up amount (ZAR).");
  }

  if (!useAdmin()) {
    const driver = mockRepo.creditWallet(driverId, amount, note);
    revalidateAll();
    return driver;
  }

  const admin = createAdminClient();
  const { data: driverRow, error } = await admin
    .from("rr_drivers")
    .select("*")
    .eq("id", driverId)
    .single();
  if (error || !driverRow) throw new Error(error?.message ?? "Driver not found");

  const next = Number(driverRow.wallet_balance ?? 0) + amount;
  const { data, error: upErr } = await admin
    .from("rr_drivers")
    .update({
      wallet_balance: next,
      commission_owed: next < 0 ? Math.abs(next) : 0,
      notes: [
        driverRow.notes,
        note?.trim() || `Wallet top-up +R${amount}`,
      ]
        .filter(Boolean)
        .join(" · "),
    })
    .eq("id", driverId)
    .select("*")
    .single();
  if (upErr) throw new Error(upErr.message);
  revalidateAll();
  return data as Driver;
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

  const driverPatch: Record<string, unknown> = {
    rating_avg: newAvg,
    rating_count: newCount,
  };
  // Auto-suspend after enough low ratings
  if (newCount >= 3 && newAvg < 3.5) {
    driverPatch.is_active = false;
    driverPatch.is_online = false;
    driverPatch.suspended_at = new Date().toISOString();
    driverPatch.suspend_reason = `Auto-suspended: rating ${newAvg} after ${newCount} trips (below 3.5)`;
  }

  await admin
    .from("rr_drivers")
    .update(driverPatch)
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

  try {
    await expireStaleOffers(10);
  } catch {
    /* non-fatal */
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_job_applications")
    .select("*, drivers:rr_drivers(*), jobs:rr_jobs(*)")
    .eq("driver_id", driverId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).filter((a) => {
    const j = a.jobs as {
      status?: string;
      offered_driver_id?: string | null;
    } | null;
    if (!j || !isSearchingStatus(j.status)) return false;
    // Exclusive offer: only the currently offered driver sees it
    if (j.offered_driver_id && j.offered_driver_id !== driverId) return false;
    return true;
  }) as JobApplication[];
}

export async function listDriverActiveJob(driverId: string) {
  if (!useAdmin()) {
    return mockRepo.listDriverActiveJob(driverId);
  }

  const supabase = useAdmin() ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("rr_jobs")
    .select(JOB_WITH_RELATIONS)
    .eq("driver_id", driverId)
    .in("status", ["confirmed", "assigned", "in_progress"])
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
        .select(JOB_WITH_RELATIONS)
        .eq("id", key)
        .maybeSingle()
    : await admin
        .from("rr_jobs")
        .select(JOB_WITH_RELATIONS)
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
 * Local test payment — creates a paid job without PayPal.
 * Only works in `next dev` when live PayPal credentials are not configured.
 * Blocked in production even if keys are missing.
 */
export async function createLocalPaidJob(draft: Omit<NewJobInput, "payment">) {
  if (!allowLocalTestPayments()) {
    throw new Error(
      "Card payments are temporarily unavailable, please choose cash",
    );
  }
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
  if (!allowLocalTestPayments()) {
    throw new Error(
      "Card payments are temporarily unavailable, please choose cash",
    );
  }
  if (isPayPalConfigured()) {
    throw new Error("PayPal is configured — use the PayPal button.");
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
