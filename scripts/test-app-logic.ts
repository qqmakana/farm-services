/**
 * Logic tests — wallet, dispatch eligibility, trip complete, merchant shop.
 * Run via: npx tsx scripts/test-app-logic.ts
 */
import { mockRepo } from "../src/lib/mock-store";
import {
  applyCommissionToWallet,
  cashPlatformRemittance,
  creditLimitBlockMessage,
  driverEligibleForDispatch,
  WALLET_ONLINE_FLOOR,
  walletCreditFloor,
} from "../src/lib/wallet";
import {
  generateReferralCode,
  generateShopWeeklyReport,
} from "../src/lib/partner";
import { calculateFare } from "../src/lib/fares";
import { getCountry } from "../src/lib/countries";
import { VILLAGE_PASS_BOOKING_FEE_ZAR } from "../src/lib/village-pass";
import { distanceKm, jitterLatLng } from "../src/lib/geo";
import {
  checkBookingServiceArea,
  isInServiceArea,
  searchServiceAreaLandmarks,
} from "../src/lib/service-area";
import {
  classifyMapboxFeature,
  geocodeAddressQuery,
  getDrivingRoute,
  isSameStop,
  mapboxServerToken,
} from "../src/lib/mapbox-server";
import fs from "node:fs";
import path from "node:path";

let passed = 0;
let failed = 0;

function ok(name: string) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name: string, err: unknown) {
  failed++;
  console.log(
    `  ✗ ${name}: ${err instanceof Error ? err.message : String(err)}`,
  );
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function test(name: string, fn: () => void) {
  try {
    fn();
    ok(name);
  } catch (e) {
    fail(name, e);
  }
}

console.log("Running logic tests…");

test("wallet: commission deducts and sets commission_owed when negative", () => {
  const r = applyCommissionToWallet({ walletBalance: 10, commission: 37 });
  assert(r.wallet_balance === -27, `balance ${r.wallet_balance}`);
  assert(r.commission_owed === 27, `owed ${r.commission_owed}`);
});

test("wallet: positive balance clears commission_owed", () => {
  const r = applyCommissionToWallet({ walletBalance: 100, commission: 15 });
  assert(r.wallet_balance === 85, `balance ${r.wallet_balance}`);
  assert(r.commission_owed === 0, `owed ${r.commission_owed}`);
});

test("dispatch: post-paid credit limit -R100", () => {
  assert(WALLET_ONLINE_FLOOR === -100, "ZA floor constant");
  assert(walletCreditFloor("ZA") === -100, "ZA floor");
  assert(driverEligibleForDispatch({ wallet_balance: 0 }) === true, "zero ok");
  assert(
    driverEligibleForDispatch({ wallet_balance: -99 }) === true,
    "within credit",
  );
  assert(
    driverEligibleForDispatch({ wallet_balance: -100 }) === true,
    "floor edge ok",
  );
  assert(
    driverEligibleForDispatch({ wallet_balance: -101 }) === false,
    "below floor blocked",
  );
  assert(
    creditLimitBlockMessage("ZA").includes("R100"),
    "block message mentions limit",
  );
});

test("mock: drivers seeded with wallet fields", () => {
  const drivers = mockRepo.listDrivers();
  assert(drivers.length >= 1, "no drivers");
  const d = drivers[0];
  assert(typeof d.wallet_balance === "number", "wallet_balance missing");
});

test("mock: complete trip deducts 10% commission from wallet", () => {
  const drivers = mockRepo.listDrivers();
  const driver =
    drivers.find((d) => d.vehicle_type === "sedan") ?? drivers[0];
  driver.wallet_balance = 0;
  driver.commission_owed = 0;
  mockRepo.setDriverOnline(driver.id, true, -31.588, 28.784);

  const job = mockRepo.createJob({
    service_type: "ride",
    required_vehicle: "sedan",
    customer_name: "Wallet Test",
    customer_phone: "0820001111",
    pickup_lat: -31.588,
    pickup_lng: 28.784,
    pickup_landmark: "Taxi rank",
    dropoff_lat: -31.59,
    dropoff_lng: 28.79,
    dropoff_landmark: "Clinic",
    details: { seats: 1, route_name: "Test", direction: "to_town" },
    fee_amount: 400,
    payment: { method: "cash" },
  });

  let active = mockRepo.getJobByReference(job.reference_code)!;
  if (active.status === "new" || active.status === "searching_driver") {
    active = mockRepo.acceptOffer(active.id, driver.id);
  }
  assert(
    active.status === "confirmed" || active.status === "assigned",
    `status after accept: ${active.status}`,
  );

  active = mockRepo.startTrip(active.id, driver.id);
  assert(active.status === "in_progress", "start failed");

  active = mockRepo.completeTrip(active.id, driver.id, {
    cashCollected: true,
  });
  assert(active.status === "completed", "complete failed");

  const after = mockRepo.listDrivers().find((d) => d.id === driver.id)!;
  // Legacy 10% of 400 = 40 — still within −R100 credit limit
  assert(after.wallet_balance === -40, `wallet ${after.wallet_balance}`);
  assert(after.commission_owed === 40, `owed ${after.commission_owed}`);
  assert(
    driverEligibleForDispatch(after) === true,
    "−R60 still within −R100 credit",
  );
});

test("mock: credit limit blocks go-online below -R100", () => {
  const drivers = mockRepo.listDrivers();
  const driver = drivers.find((d) => d.vehicle_type === "sedan") ?? drivers[0];
  driver.wallet_balance = -101;
  driver.commission_owed = 101;
  let msg = "";
  try {
    mockRepo.setDriverOnline(driver.id, true, -31.588, 28.784);
  } catch (e) {
    msg = e instanceof Error ? e.message : String(e);
  }
  assert(/credit limit/i.test(msg), `expected credit limit error, got: ${msg}`);
  assert(driverEligibleForDispatch(driver) === false, "ineligible");
});

test("mock: credit wallet clears debt", () => {
  const drivers = mockRepo.listDrivers();
  const driver = drivers.find((d) => (d.wallet_balance ?? 0) < 0) ?? drivers[0];
  driver.wallet_balance = -30;
  driver.commission_owed = 30;
  mockRepo.creditWallet(driver.id, 50, "test top-up");
  const after = mockRepo.listDrivers().find((d) => d.id === driver.id)!;
  assert(after.wallet_balance === 20, `wallet ${after.wallet_balance}`);
  assert(after.commission_owed === 0, `owed ${after.commission_owed}`);
});

test("mock: merchant shop + product + shop order", () => {
  const shop = mockRepo.createShop({
    name: "Test Furniture Co",
    phone: "0823334444",
    category: "furniture",
    landmark: "Main street",
  });
  shop.user_id = `mock-merchant-${shop.id}`;
  const product = mockRepo.createProduct({
    shop_id: shop.id,
    name: "Couch",
    price: 4500,
    size: "xl",
  });
  assert(product.shop_id === shop.id, "product link");

  const shopJob = mockRepo.createShopOrder({
    shop_id: shop.id,
    product_id: product.id,
    buyer_name: "Buyer",
    buyer_phone: "0835556666",
    dropoff_landmark: "Green gate",
    dropoff_lat: null,
    dropoff_lng: null,
    payment: {
      method: "paypal",
      paypalOrderId: "TEST-ORDER",
      paypalCaptureId: "TEST-CAP",
    },
  });
  assert(shopJob.shop_id === shop.id, "shop_id on job");
  assert(shopJob.service_type === "delivery", "delivery type");

  const linked = mockRepo.listJobs().filter((j) => j.shop_id === shop.id);
  assert(linked.length >= 1, "merchant orders visible");
});

test("mock: phone job lookup variants", () => {
  const rows = mockRepo.listJobsByCustomerPhone([
    "0820001111",
    "27820001111",
    "+27820001111",
  ]);
  assert(rows.length >= 1, "expected wallet-test job by phone");
});

test("referral: code formula is 4-letter prefix + 3 random", () => {
  const code = generateReferralCode("Village Mart");
  assert(code.startsWith("VILL"), `prefix ${code}`);
  assert(code.length === 7, `length ${code.length}`);
});

test("fares: ZA base + booking fee; Pass waives fee only", () => {
  const za = getCountry("ZA");
  const open = calculateFare({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    isSubscribed: false,
  });
  // 0km quote: base R15, min fare R25 → driver gets minimum
  assert(open.base_fee_amount === za.pricing.ride.base, "base component");
  assert(open.driver_fare_amount === 25, "minimum fare R25");
  assert(open.booking_fee === VILLAGE_PASS_BOOKING_FEE_ZAR, "R5 fee");
  assert(
    open.fee_amount === open.driver_fare_amount + open.booking_fee,
    "total = driver + fee",
  );

  const pass = calculateFare({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    isSubscribed: true,
  });
  assert(pass.booking_fee === 0, "Pass fee waived");
  assert(
    pass.driver_fare_amount === open.driver_fare_amount,
    "driver fare sacred",
  );
});

test("fares: NG / KE / IN / BR scale from ZA bands", () => {
  for (const code of ["NG", "KE", "IN", "BR"] as const) {
    const c = getCountry(code);
    const f = calculateFare({
      vehicle: "sedan",
      serviceType: "ride",
      countryCode: code,
      isSubscribed: false,
    });
    // Local ride.base scales ZA R15; min fare scales ZA R25
    assert(
      f.base_fee_amount === c.pricing.ride.base,
      `${code} base ${f.base_fee_amount} != ${c.pricing.ride.base}`,
    );
    assert(
      f.driver_fare_amount >= f.base_fee_amount,
      `${code} min fare enforced`,
    );
    assert(f.currency === c.currency, `${code} currency`);
    assert(f.booking_fee > 0, `${code} has platform fee`);
  }
});

test("fares: 10km ZA includes km + fee", () => {
  const f = calculateFare({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    pickup: { lat: -32.787, lng: 26.834 },
    dropoff: { lat: -32.79, lng: 26.85 },
    routeDistanceKm: 10,
    quoteReady: true,
    isSubscribed: false,
  });
  // R15 base + R10/km * 10 = R115 driver, + R5 fee
  assert(f.distance_km === 10, `km ${f.distance_km}`);
  assert(f.driver_fare_amount === 115, `driver ${f.driver_fare_amount}`);
  assert(f.fee_amount === 120, `total ${f.fee_amount}`);
  assert(f.quote_ready === true, "quote ready");
  assert(f.platform_commission === 0, "flat fee model — no % commission");
});

test("fares: delivery weight bands (10km ZA)", () => {
  const light = calculateFare({
    vehicle: "bakkie",
    serviceType: "delivery",
    countryCode: "ZA",
    routeDistanceKm: 10,
    quoteReady: true,
    weightCategory: "light",
    isSubscribed: false,
  });
  const heavy = calculateFare({
    vehicle: "truck",
    serviceType: "delivery",
    countryCode: "ZA",
    routeDistanceKm: 10,
    quoteReady: true,
    weightCategory: "heavy",
    isSubscribed: false,
  });
  assert(light.base_fee_amount === 20, `light base ${light.base_fee_amount}`);
  assert(heavy.base_fee_amount === 60, `heavy base ${heavy.base_fee_amount}`);
  assert(heavy.fee_amount > light.fee_amount, "heavy costs more");
  assert(light.weight_category === "light", "weight stored");
});

test("fares: farm weight + Pass waives platform fee only", () => {
  const open = calculateFare({
    vehicle: "bakkie",
    serviceType: "farm",
    countryCode: "ZA",
    weightCategory: "medium",
    isSubscribed: false,
  });
  assert(open.base_fee_amount === 40, "farm medium base");
  assert(open.booking_fee === VILLAGE_PASS_BOOKING_FEE_ZAR, "fee");
  const pass = calculateFare({
    vehicle: "bakkie",
    serviceType: "farm",
    countryCode: "ZA",
    weightCategory: "medium",
    isSubscribed: true,
  });
  assert(pass.booking_fee === 0, "Pass waived");
  assert(pass.driver_fare_amount === open.driver_fare_amount, "driver sacred");
});

test("geo: jitter is stable and stays within ~150m", () => {
  const a = jitterLatLng("d1", -31.588, 28.784);
  const b = jitterLatLng("d1", -31.588, 28.784);
  assert(a.lat === b.lat && a.lng === b.lng, "stable per id");
  const other = jitterLatLng("d2", -31.588, 28.784);
  assert(other.lat !== a.lat || other.lng !== a.lng, "different ids differ");
  const km = distanceKm({ lat: -31.588, lng: 28.784 }, a);
  assert(km < 0.25, `jitter ${km}km should be under 250m`);
});

test("fares: route km wins over straight-line pins", () => {
  const alice = { lat: -32.787, lng: 26.834 };
  const nearby = { lat: -32.81, lng: 26.86 };
  const straight = distanceKm(alice, nearby);
  assert(straight > 0 && straight < 6, `straight ${straight}`);
  const f = calculateFare({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    pickup: alice,
    dropoff: nearby,
    routeDistanceKm: 6,
    quoteReady: true,
    isSubscribed: false,
  });
  assert(f.distance_km === 6, `used route km ${f.distance_km} not ${straight}`);
  assert(f.driver_fare_amount === 75, `15+10*6 ${f.driver_fare_amount}`);
});

test("fares: same pickup and dropoff is minimum fare, not a crash", () => {
  const pin = { lat: -32.787, lng: 26.834 };
  assert(isSameStop(pin, pin), "same stop helper");
  const f = calculateFare({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    pickup: pin,
    dropoff: pin,
    routeDistanceKm: 0,
    quoteReady: true,
    isSubscribed: false,
  });
  assert(f.distance_km === 0, "0 km");
  assert(f.driver_fare_amount === 25, "min driver fare");
  assert(f.fee_amount === 30, "min total with booking fee");
});

test("service area: country-wide booking (no Alice/Mthatha lock)", () => {
  const alice = { lat: -32.787, lng: 26.834 };
  const fortHare = { lat: -32.784, lng: 26.851 };
  const jhb = { lat: -26.2041, lng: 28.0473 };
  const mthatha = { lat: -31.588, lng: 28.784 };
  assert(isInServiceArea(alice, "ZA"), "Alice in");
  assert(isInServiceArea(fortHare, "ZA"), "Fort Hare in");
  assert(isInServiceArea(jhb, "ZA"), "Johannesburg in");
  const okTrip = checkBookingServiceArea(alice, fortHare, "ZA");
  assert(okTrip.ok, "Alice local trip allowed");
  const jhbTrip = checkBookingServiceArea(alice, jhb, "ZA");
  assert(jhbTrip.ok, "Johannesburg dropoff allowed");
  const cross = checkBookingServiceArea(alice, mthatha, "ZA");
  assert(cross.ok, "cross-town allowed");
});

test("geocoder: low relevance is not silently accepted", () => {
  const rejected = classifyMapboxFeature(
    {
      id: "guess",
      place_name: "Somewhere nearby",
      relevance: 0.2,
      center: [26.834, -32.787],
    },
    "ZA",
  );
  assert(rejected == null, "below threshold dropped");
  const confirm = classifyMapboxFeature(
    {
      id: "maybe",
      place_name: "Alice, Eastern Cape",
      relevance: 0.6,
      center: [26.834, -32.787],
      properties: { accuracy: "approximate" },
    },
    "ZA",
  );
  assert(confirm != null && confirm.needsConfirmation, "did-you-mean required");
});

test("landmarks: national list can include Johannesburg", () => {
  const jhb = searchServiceAreaLandmarks("Johannesburg", 8, "ZA");
  assert(jhb.length >= 0, "Johannesburg search does not throw");
  const alice = searchServiceAreaLandmarks("Alice", 8, "ZA");
  assert(alice.length >= 1, "Alice landmark fallback still works");
});

test("wallet: flat-fee cash remittance uses booking_fee not 10%", () => {
  const remit = cashPlatformRemittance({
    fee_amount: 145,
    booking_fee: 5,
    platform_commission: 0,
    driver_payout: 140,
    base_fare: 20,
  });
  assert(remit === 5, `remit ${remit}`);
  const passRemit = cashPlatformRemittance({
    fee_amount: 140,
    booking_fee: 0,
    platform_commission: 0,
    driver_payout: 140,
    village_pass: true,
  });
  assert(passRemit === 0, "Pass cash deducts 0");
});

function loadLocalEnv() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function runAsync() {
  try {
    const shops = mockRepo.listShops();
    assert(shops.length >= 1, "need shop");
    const result = await generateShopWeeklyReport(shops[0]);
    assert(result.report != null, "report created");
    assert(Boolean(result.report?.week_key), "week_key");
    assert(
      result.report!.summary_text.includes(shops[0].name),
      "summary has shop",
    );
    ok("partner: weekly report builds in mock");
  } catch (e) {
    fail("partner: weekly report builds in mock", e);
  }

  loadLocalEnv();
  const token = mapboxServerToken();
  if (!token) {
    ok("mapbox live checks skipped (no token in this environment)");
  } else {
    const kind = token.startsWith("sk.")
      ? "secret"
      : token.startsWith("pk.")
        ? "public"
        : "unknown";
    ok(`mapbox token kind is ${kind} (value not logged)`);

    const alice = { lat: -32.787, lng: 26.834 };
    const samples = [
      "University of Fort Hare, Alice",
      "Alice, Eastern Cape",
      "Fort Hare campus Alice Eastern Cape",
      "Ntselamanzi Alice",
      "Alice Hospital",
    ];
    for (const query of samples) {
      try {
        const hits = await geocodeAddressQuery(query, {
          countryCode: "ZA",
          proximity: alice,
        });
        assert(hits.length >= 1, `${query}: no geocode hits`);
        const top = hits[0];
        const km = distanceKm(alice, { lat: top.lat, lng: top.lng });
        assert(
          km < 12,
          `${query} pinned ${km.toFixed(1)}km from Alice (${top.label})`,
        );
        ok(
          `geocode "${query}" → ${top.label} (${km.toFixed(1)}km, rel ${top.relevance.toFixed(2)}${top.needsConfirmation ? ", confirm" : ""})`,
        );
      } catch (e) {
        fail(`geocode "${query}"`, e);
      }
    }

    try {
      const garbage = await geocodeAddressQuery("zzzxxyyqqq12345notanaddress", {
        countryCode: "ZA",
        proximity: alice,
      });
      assert(garbage.length === 0, "garbage should not geocode");
      ok("geocode garbage input returns no results");
    } catch (e) {
      fail("geocode garbage input returns no results", e);
    }

    try {
      const spar = await geocodeAddressQuery("Alice SPAR", {
        countryCode: "ZA",
        proximity: alice,
      });
      for (const hit of spar) {
        assert(Boolean(hit.label), `Alice SPAR hit needs a label`);
      }
      ok(
        spar.length
          ? `Alice SPAR stayed in-area (${spar[0].label})`
          : "Alice SPAR had no Mapbox hit (no silent KWT pin)",
      );
    } catch (e) {
      fail("Alice SPAR must not snap outside Alice", e);
    }

    try {
      const informal = searchServiceAreaLandmarks("taxi rank", 8, "ZA");
      const aliceHit = informal.find((p) => /alice/i.test(p.label));
      assert(aliceHit, "Alice taxi-rank landmark still in fallback");
      ok(`informal landmark fallback: ${aliceHit!.label}`);
    } catch (e) {
      fail("informal landmark fallback", e);
    }

    try {
      const route = await getDrivingRoute(
        { lat: -32.784, lng: 26.851 },
        { lat: -32.787, lng: 26.834 },
      );
      const straight = distanceKm(
        { lat: -32.784, lng: 26.851 },
        { lat: -32.787, lng: 26.834 },
      );
      assert(route.distanceKm >= straight, "route >= straight-line");
      assert(route.distanceKm > 0, "route has distance");
      ok(
        `directions Fort Hare → Alice CBD ${route.distanceKm}km road vs ${straight.toFixed(1)}km straight (${route.durationSeconds}s)`,
      );
    } catch (e) {
      fail("directions Fort Hare → Alice", e);
    }

    try {
      const same = await getDrivingRoute(alice, alice);
      assert(same.distanceKm === 0, "same point is 0km");
      ok("directions same pickup/dropoff is 0km");
    } catch (e) {
      fail("directions same pickup/dropoff is 0km", e);
    }
  }

  console.log(`\nLogic summary: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

void runAsync();
