/** Realistic test data for Village Ride E2E / API suites. */

export function stamp(): string {
  return Date.now().toString(36).slice(-6);
}

export function generateTestMerchant(overrides?: Partial<{
  businessName: string;
  email: string;
  phone: string;
  password: string;
  category: string;
  landmark: string;
  referralCode: string | null;
}>) {
  const s = stamp();
  return {
    businessName: overrides?.businessName ?? `E2E Shop ${s}`,
    email:
      overrides?.email ??
      `test+merchant${s}@village-ride.co.za`,
    phone: overrides?.phone ?? `082${String(Math.floor(1000000 + Math.random() * 8999999)).slice(0, 7)}`,
    password: overrides?.password ?? "TestPass123!",
    category: overrides?.category ?? "general",
    landmark: overrides?.landmark ?? "Opposite Boxer Superstore, Mthatha",
    referralCode: overrides?.referralCode ?? null,
  };
}

export function generateTestDriver(overrides?: Partial<{
  name: string;
  email: string;
  phone: string;
  vehicleType: "sedan" | "bakkie" | "truck";
  area: string;
}>) {
  const s = stamp();
  return {
    name: overrides?.name ?? `E2E Driver ${s}`,
    email: overrides?.email ?? `test+driver${s}@village-ride.co.za`,
    phone: overrides?.phone ?? `083${String(Math.floor(1000000 + Math.random() * 8999999)).slice(0, 7)}`,
    vehicleType: overrides?.vehicleType ?? ("bakkie" as const),
    area: overrides?.area ?? "Mthatha",
  };
}

export function generateTestOrder(overrides?: Partial<{
  customerName: string;
  customerPhone: string;
  pickup: string;
  dropoff: string;
  item: string;
  size: "small" | "medium" | "large" | "xl";
}>) {
  const s = stamp();
  return {
    customerName: overrides?.customerName ?? `E2E Customer ${s}`,
    customerPhone:
      overrides?.customerPhone ??
      `084${String(Math.floor(1000000 + Math.random() * 8999999)).slice(0, 7)}`,
    pickup: overrides?.pickup ?? "Mthatha Taxi Rank",
    dropoff: overrides?.dropoff ?? "Qunu Clinic",
    item: overrides?.item ?? "Fridge",
    size: overrides?.size ?? ("medium" as const),
  };
}

export function generateTestUser(role: "merchant" | "driver" | "customer" = "customer") {
  const s = stamp();
  return {
    email: `test+${role}${s}@village-ride.co.za`,
    password: "TestPass123!",
    role,
  };
}

/** Spec referral formula used by the app. */
export function generateReferralCode(businessName: string): string {
  return (
    businessName.slice(0, 4).toUpperCase() +
    Math.random().toString(36).slice(2, 5)
  );
}
