/**
 * Logic tests — wallet, dispatch eligibility, trip complete, merchant shop.
 * Run via: npx tsx scripts/test-app-logic.ts
 */
import {
  MATCH_RADIUS_STEPS_KM,
  rankDriversWithExpandingRadius,
} from "../src/lib/dispatch-score";
import {
  driverHasArrived,
  mergeDriverArrivedDetails,
} from "../src/lib/job-status";
import { mockRepo } from "../src/lib/mock-store";
import type { Driver, Job } from "../src/lib/types";
import {
  applyCommissionToWallet,
  amountOwedToPlatform,
  cashPlatformRemittance,
  creditLimitBlockMessage,
  driverEligibleForDispatch,
  WALLET_ONLINE_FLOOR,
  walletCreditFloor,
} from "../src/lib/wallet";
import { matchListedShop } from "../src/lib/shop-match";
import { packageOfferCopy } from "../src/lib/package-job";
import {
  productPhotoSrc,
  shopBannerSrc,
} from "../src/lib/shop-photos";
import {
  generateReferralCode,
  generateShopWeeklyReport,
} from "../src/lib/partner";
import { calculateFare } from "../src/lib/fares";
import {
  clampGroupRideCapacity,
  groupSeatFare,
} from "../src/lib/pricing";
import { reserveWindowError } from "../src/lib/reserve-window";
import {
  isValidSaIdNumber,
  saIdRequiredForCountry,
} from "../src/lib/sa-id";
import { decideKyc } from "../src/lib/kyc/verify";
import { courierTooHeavyError } from "../src/lib/courier-limits";
import { getCountry } from "../src/lib/countries";
import { distanceKm, jitterLatLng } from "../src/lib/geo";
import {
  filterSuggestionsForTab,
  formatSuggestionDistance,
  isRecognizableName,
  mergeSuggestionLists,
  scoreNearbyPlace,
  samePlace,
  suggestionMatchesTab,
} from "../src/lib/suggestions";
import { getBoostConfig } from "../src/lib/boost";
import { placesNear } from "../src/lib/landmarks";
import {
  riderPhotoFromDetails,
  riderPhotoStoragePathFromDetails,
  wearingFromDetails,
} from "../src/lib/rider-photo";
import { pickupPhotoFromDetails } from "../src/lib/pickup-photo";
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

/** Pin fare tests to daytime so the 40% night window doesn't flake after 18:00. */
const DAY_AT = "2026-08-23T10:00:00+02:00";
function dayQuote(
  params: Parameters<typeof calculateFare>[0],
): ReturnType<typeof calculateFare> {
  return calculateFare({ at: DAY_AT, ...params });
}

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

test("suggestions: For you keeps the mix; Trip hides grocery nearby", () => {
  const grocery = {
    type: "nearby" as const,
    id: "g",
    name: "Shoprite",
    address: "Main Rd",
    lat: -26.2,
    lng: 28.0,
    category: "grocery",
  };
  const campus = {
    type: "nearby" as const,
    id: "u",
    name: "UJ APK",
    address: "Auckland Park",
    lat: -26.18,
    lng: 28.0,
    category: "university",
  };
  const fridge = {
    type: "recent" as const,
    id: "d",
    name: "Hardware store",
    address: "Town",
    lat: -26.2,
    lng: 28.0,
    service_hint: "delivery" as const,
  };
  assert(suggestionMatchesTab(grocery, "for-you"), "grocery in mix");
  assert(!suggestionMatchesTab(grocery, "trip"), "grocery not a trip dest");
  assert(suggestionMatchesTab(campus, "trip"), "campus is a trip dest");
  const filtered = filterSuggestionsForTab(
    { saved: [], recent: [fridge], nearby: [grocery, campus] },
    "trip",
  );
  assert(filtered.nearby.length === 1 && filtered.nearby[0].id === "u", "trip nearby");
  assert(filtered.recent.length === 0, "delivery recent hidden on trip");
  const shops = filterSuggestionsForTab(
    { saved: [], recent: [fridge], nearby: [grocery, campus] },
    "shops",
  );
  assert(shops.nearby.some((p) => p.id === "g"), "grocery on shops");
  assert(shops.recent.some((p) => p.id === "d"), "delivery recent on shops");
});

test("suggestions: distance labels", () => {
  assert(formatSuggestionDistance(0.02) === "Nearby", "very close");
  assert(formatSuggestionDistance(0.8) === "800m", "metres");
  assert(formatSuggestionDistance(1.24) === "1.2km", "km");
});

test("suggestions: drop obscure POI names", () => {
  assert(isRecognizableName("Shoprite Brixton"), "shoprite");
  assert(!isRecognizableName("unnamed"), "unnamed");
  assert(!isRecognizableName("12"), "digits");
});

test("suggestions: SA mall ranks above a random shop at the same distance", () => {
  const mall = scoreNearbyPlace({
    name: "Sandton City",
    category: "mall",
    distanceKm: 0.8,
    countryCode: "ZA",
  });
  const shop = scoreNearbyPlace({
    name: "Corner spaza",
    category: "shop",
    distanceKm: 0.8,
    countryCode: "ZA",
  });
  assert(mall > shop, `mall ${mall} vs shop ${shop}`);
  assert(getBoostConfig("ZA").names["sandton city"] === 10, "ZA boost loaded");
  assert(Object.keys(getBoostConfig("XX").names).length === 0, "unknown country empty");
});

test("suggestions: merge saved first, recents win over matching nearby", () => {
  const merged = mergeSuggestionLists({
    saved: [
      {
        type: "saved",
        id: "h",
        label: "home",
        name: "Home",
        address: "Alice",
        lat: -32.787,
        lng: 26.834,
      },
    ],
    recent: [
      {
        type: "recent",
        id: "r",
        name: "UJ APK Gate",
        address: "Auckland Park",
        lat: -26.182,
        lng: 27.997,
        ride_count: 3,
      },
    ],
    nearby: [
      {
        type: "nearby",
        id: "n1",
        name: "UJ APK Gate",
        address: "Auckland Park",
        lat: -26.182,
        lng: 27.997,
        category: "university",
      },
      {
        type: "nearby",
        id: "n2",
        name: "Shoprite Brixton",
        address: "Brixton",
        lat: -26.191,
        lng: 27.971,
        category: "grocery",
      },
    ],
  });
  assert(merged.saved[0]?.label === "home", "saved kept");
  assert(merged.recent[0]?.name === "UJ APK Gate", "recent kept");
  assert(
    !merged.nearby.some((p) => p.name === "UJ APK Gate"),
    "nearby dup dropped",
  );
  assert(
    merged.nearby.some((p) => p.name === "Shoprite Brixton"),
    "other nearby kept",
  );
});

test("suggestions: same village pin with different names is not a duplicate", () => {
  assert(
    !samePlace(
      { name: "Alice · Main taxi rank", lat: -32.787, lng: 26.834 },
      { name: "Alice · Clinic", lat: -32.787, lng: 26.834 },
    ),
    "different landmarks",
  );
  assert(
    samePlace(
      { name: "Shoprite Brixton", lat: -26.191, lng: 27.971 },
      { name: "Shoprite Brixton", lat: -26.191, lng: 27.971 },
    ),
    "same name",
  );
});

test("suggestions: Joburg CBD has offline nearby landmarks", () => {
  const near = placesNear({ lat: -26.2041, lng: 28.0473 }, 3, "ZA", 12);
  assert(near.length >= 3, `got ${near.length}`);
  assert(
    near.some((p) => /johannesburg|park station/i.test(p.label)),
    near.map((p) => p.label).join(", "),
  );
});

test("rider spotting: data URL wins; storage path is not displayable", () => {
  const data = "data:image/jpeg;base64,/9j/4AAQ";
  assert(
    riderPhotoFromDetails({ rider_photo_data_url: data }) === data,
    "data URL",
  );
  assert(
    riderPhotoFromDetails({ rider_photo_url: "0825550199/profile-1.jpg" }) ===
      null,
    "storage path is not a display URL",
  );
  assert(
    riderPhotoStoragePathFromDetails(
      { rider_photo_url: "0825550199/profile-1.jpg" },
      null,
    ) === "0825550199/profile-1.jpg",
    "extract storage path",
  );
  assert(
    riderPhotoStoragePathFromDetails({}, "0825550199/from-job.jpg") ===
      "0825550199/from-job.jpg",
    "job column fallback",
  );
  assert(wearingFromDetails({ wearing: " red jacket " }) === "red jacket", "wear");
  assert(
    pickupPhotoFromDetails({ pickup_photo_data_url: data }) === data,
    "pickup data URL",
  );
});

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

test("wallet: cash-only driver owe number", () => {
  assert(amountOwedToPlatform(-42, 42) === 42, "negative wallet");
  assert(amountOwedToPlatform(0, 15) === 15, "owed field");
  assert(amountOwedToPlatform(80, 0) === 0, "card week owes nothing");
});

test("shops: food photos resolve when shop has no upload", () => {
  const banner = shopBannerSrc({
    image_url: null,
    category: "food",
    name: "Mama's Kitchen",
  });
  assert(banner.includes("shop-food"), banner);
  const bread = productPhotoSrc({
    image_url: null,
    name: "Brown bread loaf",
    description: "Fresh baked",
  });
  assert(bread.includes("prod-bread"), bread);
});

test("shops: uploaded product photo wins over stock photo", () => {
  const own = productPhotoSrc({
    image_url: "https://cdn.example/stew.jpg",
    name: "Brown bread loaf",
    description: null,
  });
  assert(own.includes("cdn.example"), own);
});

test("fetch: listed shop cross-sell from typed list", () => {
  const shops = [
    { id: "s1", name: "Mama's Spaza" },
    { id: "s2", name: "Shoprite Alice" },
  ] as import("../src/lib/types").Shop[];
  const hit = matchListedShop(shops, ["2 loaves from Mama's"]);
  assert(hit?.id === "s1", "Mama's from shopping list");
  const miss = matchListedShop(shops, ["milk bread"]);
  assert(miss === null, "generic list does not match");
});

test("driver ping: shop job is package not passenger", () => {
  const copy = packageOfferCopy({
    service_type: "delivery",
    shop_id: "s1",
    pickup_landmark: "Mama's Spaza — Main Rd",
    product_summary: "SO-AB12 · 3 items · collect from Mama's Spaza",
    dispatcher_notes: "Shop ready: Mama's Spaza.",
    details: { shop_name: "Mama's Spaza", item_count: 3 },
  } as Job);
  assert(copy != null, "shop job has offer copy");
  assert(
    copy!.headline.includes("Mama's Spaza"),
    `headline ${copy!.headline}`,
  );
  assert(
    /no passenger/i.test(copy!.eyebrow),
    `eyebrow ${copy!.eyebrow}`,
  );
  assert(/3 packed item/i.test(copy!.detail), `detail ${copy!.detail}`);
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

function testDriver(
  id: string,
  lat: number,
  extras: Partial<Driver> = {},
): Driver {
  return {
    id,
    full_name: id,
    phone: "27820000000",
    vehicle_type: "sedan",
    is_active: true,
    approval_status: "approved",
    id_verified: true,
    is_online: true,
    last_lat: lat,
    last_lng: 0,
    last_location_at: new Date().toISOString(),
    rating_avg: 5,
    rating_count: 10,
    notes: null,
    created_at: new Date().toISOString(),
    ...extras,
  };
}

test("dispatch: expanding radius prefers 5km then 10km then 20km", () => {
  assert(MATCH_RADIUS_STEPS_KM[0] === 5, "first ring is 5km");
  const pickup = { lat: 0, lng: 0 };
  const needs = { night: false, heavy: false, village: false, scheduled: false };
  const near = testDriver("near", 0.036); // ~4km
  const mid = testDriver("mid", 0.072); // ~8km
  const far = testDriver("far", 0.135); // ~15km
  const rural = testDriver("rural", 0.27); // ~30km

  const close = rankDriversWithExpandingRadius({
    drivers: [rural, far, mid, near],
    requiredVehicle: "sedan",
    needs,
    pickup,
  });
  assert(close.matchRadiusKm === 5, `radius ${close.matchRadiusKm}`);
  assert(close.ranked.length === 1 && close.ranked[0].driver.id === "near", "5km only");

  const ring10 = rankDriversWithExpandingRadius({
    drivers: [rural, far, mid],
    requiredVehicle: "sedan",
    needs,
    pickup,
  });
  assert(ring10.matchRadiusKm === 10, `radius ${ring10.matchRadiusKm}`);
  assert(ring10.ranked[0].driver.id === "mid", "10km winner");

  const ring20 = rankDriversWithExpandingRadius({
    drivers: [rural, far],
    requiredVehicle: "sedan",
    needs,
    pickup,
  });
  assert(ring20.matchRadiusKm === 20, `radius ${ring20.matchRadiusKm}`);
  assert(ring20.ranked[0].driver.id === "far", "20km winner");

  const village = rankDriversWithExpandingRadius({
    drivers: [rural],
    requiredVehicle: "sedan",
    needs,
    pickup,
  });
  assert(village.matchRadiusKm === null, "rural fallback has no hard ring");
  assert(village.ranked[0].driver.id === "rural", "rural driver still offered");
});

test("trip: I've arrived is stored on job details, not a new status", () => {
  const details = mergeDriverArrivedDetails(
    { seats: 1, route_name: "test", direction: "to_town" },
    "2026-08-23T08:00:00.000Z",
  );
  assert(driverHasArrived({ details }), "arrived flag set");
  assert(
    !driverHasArrived({ details: { seats: 1, route_name: "x", direction: "to_town" } }),
    "plain ride details are not arrived",
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

test("mock: ready shop cart order pings an online sedan driver", () => {
  const shop = mockRepo.createShop({
    name: "Ping Kitchen",
    phone: "0821112222",
    category: "food",
    landmark: "Westdene",
    lat: -31.589,
    lng: 28.785,
  });
  shop.is_active = true;
  const product = mockRepo.createProduct({
    shop_id: shop.id,
    name: "Beef stew + pap",
    price: 65,
    size: "small",
  });
  const order = mockRepo.placeShopCartOrder({
    shop_id: shop.id,
    customer_name: "Rider",
    customer_phone: "0830001111",
    delivery_address: "97 Perth Road",
    items: [{ product_id: product.id, quantity: 2 }],
    payment_method: "cash",
  });
  const ready = mockRepo.updateShopOrderStatus(order.id, "ready");
  assert(Boolean(ready.job_id), "job created for driver ping");
  const offers = mockRepo.listIncomingOffers("d2");
  assert(
    offers.some((o) => o.jobs?.id === ready.job_id),
    "sedan driver sees shop delivery offer",
  );
  mockRepo.acceptOffer(ready.job_id!, "d2");
  const after = mockRepo.listShopOrders(shop.id).find((o) => o.id === order.id);
  assert(after?.driver_id === "d2", "shop order linked to driver");
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

test("fares: ZA R15 under 2km; 90/10 split", () => {
  const za = getCountry("ZA");
  const open = dayQuote({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    isSubscribed: false,
  });
  // 0km quote: R15 flat (first 2 km included)
  assert(open.base_fee_amount === za.pricing.ride.base, "base component");
  assert(open.fee_amount === 15, "rider pays R15");
  assert(open.platform_commission === 2, "10% of R15 rounded");
  assert(open.driver_fare_amount === 13, "driver 90%");
  assert(open.booking_fee === 0, "no extra booking fee");
  assert(
    open.fee_amount === open.driver_fare_amount + open.platform_commission,
    "total = driver + 10%",
  );

  const pass = dayQuote({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    isSubscribed: true,
  });
  assert(pass.fee_amount === open.fee_amount, "Pass does not change the fare");
  assert(
    pass.platform_commission === open.platform_commission,
    "Pass still 10%",
  );
});

test("fares: NG / KE / IN / BR scale from ZA bands", () => {
  for (const code of ["NG", "KE", "IN", "BR"] as const) {
    const c = getCountry(code);
    const f = dayQuote({
      vehicle: "sedan",
      serviceType: "ride",
      countryCode: code,
      isSubscribed: false,
    });
    // Local ride.base scales ZA R15; rider pays base on a 0 km quote
    assert(
      f.base_fee_amount === c.pricing.ride.base,
      `${code} base ${f.base_fee_amount} != ${c.pricing.ride.base}`,
    );
    assert(f.fee_amount === f.base_fee_amount, `${code} 0 km is flag drop`);
    assert(f.currency === c.currency, `${code} currency`);
    assert(f.platform_commission > 0, `${code} has 10% take`);
  }
});

test("fares: 10km ZA includes km + fee", () => {
  const f = dayQuote({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    pickup: { lat: -32.787, lng: 26.834 },
    dropoff: { lat: -32.79, lng: 26.85 },
    routeDistanceKm: 10,
    quoteReady: true,
    isSubscribed: false,
  });
  // R15 + R5 × (10 − 2) = R55 rider → R50 driver / R5? 10% of 55 = R6
  assert(f.distance_km === 10, `km ${f.distance_km}`);
  assert(f.fee_amount === 55, `rider ${f.fee_amount}`);
  assert(f.platform_commission === 6, `10% ${f.platform_commission}`);
  assert(f.driver_fare_amount === 49, `driver ${f.driver_fare_amount}`);
  assert(f.quote_ready === true, "quote ready");
  assert(f.booking_fee === 0, "no extra booking fee");
});

test("fares: Reserve adds R10 then 90/10 (PayPal charges the same quote)", () => {
  const now = dayQuote({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    pickup: { lat: -32.787, lng: 26.834 },
    dropoff: { lat: -32.79, lng: 26.85 },
    routeDistanceKm: 10,
    quoteReady: true,
    isSubscribed: false,
  });
  const reserved = dayQuote({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    pickup: { lat: -32.787, lng: 26.834 },
    dropoff: { lat: -32.79, lng: 26.85 },
    routeDistanceKm: 10,
    quoteReady: true,
    isSubscribed: false,
    applyReservationFee: true,
  });
  assert(now.fee_amount === 55, `now ${now.fee_amount}`);
  assert(now.reservation_fee === 0, "no reservation on Ride Now");
  assert(reserved.reservation_fee === 10, `fee ${reserved.reservation_fee}`);
  assert(reserved.fee_amount === 65, `rider ${reserved.fee_amount}`);
  assert(reserved.platform_commission === 7, "10% of 65");
  assert(reserved.driver_fare_amount === 58, "90% of 65");
});

test("fares: trip stop + extra people bundled before 90/10", () => {
  const withStop = dayQuote({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    routeDistanceKm: 10,
    quoteReady: true,
    applyExtraStop: true,
    seats: 2,
  });
  assert(withStop.extra_stop_fee === 15, `stop ${withStop.extra_stop_fee}`);
  assert(withStop.extra_passenger_fee === 10, `people ${withStop.extra_passenger_fee}`);
  assert(withStop.fee_amount === 80, `rider ${withStop.fee_amount}`);
  assert(withStop.platform_commission === 8, "10% of 80");
  assert(withStop.driver_fare_amount === 72, "90% of 80");
});

test("fares: courier express is 1.5× before 90/10", () => {
  const std = dayQuote({
    vehicle: "sedan",
    serviceType: "courier",
    countryCode: "ZA",
    routeDistanceKm: 10,
    quoteReady: true,
  });
  const exp = dayQuote({
    vehicle: "sedan",
    serviceType: "courier",
    countryCode: "ZA",
    routeDistanceKm: 10,
    quoteReady: true,
    isExpress: true,
  });
  assert(std.fee_amount === 55, `std ${std.fee_amount}`);
  assert(exp.fee_amount === 83, `express ${exp.fee_amount}`);
  assert(exp.express_extra === 28, `extra ${exp.express_extra}`);
  assert(exp.platform_commission === 8, "10% of 83");
  assert(exp.driver_fare_amount === 75, "90% of 83");
  const rideExpressIgnored = dayQuote({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    routeDistanceKm: 10,
    quoteReady: true,
    isExpress: true,
  });
  assert(rideExpressIgnored.fee_amount === 55, "express does not apply to trips");
});

test("fares: delivery insurance adds R15 then 90/10", () => {
  const plain = dayQuote({
    vehicle: "bakkie",
    serviceType: "delivery",
    countryCode: "ZA",
    routeDistanceKm: 10,
    quoteReady: true,
    weightCategory: "light",
  });
  const covered = dayQuote({
    vehicle: "bakkie",
    serviceType: "delivery",
    countryCode: "ZA",
    routeDistanceKm: 10,
    quoteReady: true,
    weightCategory: "light",
    applyInsurance: true,
  });
  assert(plain.insurance_fee === 0, "no cover");
  assert(covered.insurance_fee === 15, `cover ${covered.insurance_fee}`);
  assert(covered.fee_amount === plain.fee_amount + 15, "rider pays +15");
  assert(
    covered.fee_amount ===
      covered.driver_fare_amount + covered.platform_commission,
    "90/10 after insurance",
  );
  const farmCoverIgnored = dayQuote({
    vehicle: "bakkie",
    serviceType: "farm",
    countryCode: "ZA",
    routeDistanceKm: 10,
    quoteReady: true,
    weightCategory: "light",
    applyInsurance: true,
  });
  assert(farmCoverIgnored.insurance_fee === 0, "insurance is delivery only");
});

test("SA ID: 13-digit checksum; reject passport and junk", () => {
  assert(saIdRequiredForCountry("ZA"), "ZA requires SA ID");
  assert(!saIdRequiredForCountry("KE"), "Kenya does not use SA ID");
  assert(isValidSaIdNumber("8001015009087"), "known valid SA ID");
  assert(isValidSaIdNumber("800101 5009 087"), "spaces stripped");
  assert(!isValidSaIdNumber("8001015009088"), "bad checksum");
  assert(!isValidSaIdNumber("A01234567"), "passport rejected");
  assert(!isValidSaIdNumber("12345"), "too short");
  const reject = decideKyc({
    profileName: "Test Driver",
    statedIdNumber: "",
    requireSaId: true,
    extractions: [
      {
        doc_kind: "id",
        full_name: "Test Driver",
        id_number: null,
        license_number: null,
        expiry_date: null,
        document_type: "passport",
        raw_text_snippet: "PASSPORT",
        confidence: 0.9,
      },
    ],
    openaiAvailable: true,
  });
  assert(reject.id_verified === false, "passport not verified");
  assert(
    reject.issues.some((i) => /South African ID|passport/i.test(i)),
    "flags foreign ID",
  );
});

test("groups: seat is 60% of private Trip, max 4 passengers", () => {
  assert(groupSeatFare(100) === 60, "R100 private → R60 seat");
  assert(groupSeatFare(15) === 9, "R15 private → R9 seat");
  assert(clampGroupRideCapacity("ride", 8) === 4, "ride cap 4");
  assert(clampGroupRideCapacity("ride", 2) === 2, "ride under max");
  assert(clampGroupRideCapacity("goods", 12) === 12, "goods can exceed 4");
});

test("reserve window: 30 minutes to 30 days", () => {
  const now = Date.parse("2026-08-23T12:00:00.000Z");
  const soon = new Date(now + 5 * 60 * 1000).toISOString();
  const ok = new Date(now + 45 * 60 * 1000).toISOString();
  const far = new Date(now + 31 * 24 * 60 * 60 * 1000).toISOString();
  assert(reserveWindowError(soon, now) != null, "too soon");
  assert(reserveWindowError(ok, now) == null, "45 min ok");
  assert(reserveWindowError(far, now) != null, "over 30 days");
  assert(reserveWindowError(null, now) == null, "unset ok");
});

test("courier: reject over 15kg, bakkie, and 10–20kg band", () => {
  assert(
    courierTooHeavyError({
      service_type: "courier",
      required_vehicle: "sedan",
      details: { item_weight_kg: 16 },
    }) != null,
    "16kg rejected",
  );
  assert(
    courierTooHeavyError({
      service_type: "courier",
      required_vehicle: "sedan",
      details: { item_weight: "10_20" },
    }) != null,
    "10-20kg band rejected",
  );
  assert(
    courierTooHeavyError({
      service_type: "courier",
      required_vehicle: "bakkie",
      details: { package_type: "small_package" },
    }) != null,
    "bakkie courier rejected",
  );
  assert(
    courierTooHeavyError({
      service_type: "courier",
      required_vehicle: "sedan",
      details: { item_weight: "under_5", package_type: "documents" },
    }) == null,
    "documents ok",
  );
  assert(
    courierTooHeavyError({
      service_type: "courier",
      required_vehicle: "sedan",
      details: { item_description: "fridge" },
    }) != null,
    "fridge is delivery",
  );
  assert(
    courierTooHeavyError({
      service_type: "delivery",
      required_vehicle: "bakkie",
      details: { item_weight_kg: 80 },
    }) == null,
    "delivery not limited to 15kg",
  );
});

test("fares: delivery weight bands (10km ZA)", () => {
  const light = dayQuote({
    vehicle: "bakkie",
    serviceType: "delivery",
    countryCode: "ZA",
    routeDistanceKm: 10,
    quoteReady: true,
    weightCategory: "light",
    isSubscribed: false,
  });
  const heavy = dayQuote({
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

test("fares: farm weight still 90/10 of the quoted fare", () => {
  const open = dayQuote({
    vehicle: "bakkie",
    serviceType: "farm",
    countryCode: "ZA",
    weightCategory: "medium",
    isSubscribed: false,
  });
  assert(open.base_fee_amount === 40, "farm medium base");
  assert(open.fee_amount === 40, "0 km is band base");
  assert(open.platform_commission === 4, "10% of R40");
  assert(open.driver_fare_amount === 36, "90%");
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
  const f = dayQuote({
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
  assert(f.fee_amount === 35, `R15 + R5×4 ${f.fee_amount}`);
});

test("fares: same pickup and dropoff is minimum fare, not a crash", () => {
  const pin = { lat: -32.787, lng: 26.834 };
  assert(isSameStop(pin, pin), "same stop helper");
  const f = dayQuote({
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
  assert(f.fee_amount === 15, "R15 flat under 2 km");
  assert(f.driver_fare_amount === 13, "90% of R15");
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

test("fares: R50 trip is R45 driver / R5 platform", () => {
  const f = dayQuote({
    vehicle: "sedan",
    serviceType: "ride",
    countryCode: "ZA",
    routeDistanceKm: 9,
    quoteReady: true,
  });
  assert(f.fee_amount === 50, `rider ${f.fee_amount}`);
  assert(f.driver_fare_amount === 45, `driver ${f.driver_fare_amount}`);
  assert(f.platform_commission === 5, `platform ${f.platform_commission}`);
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
  assert(passRemit === 0, "legacy Pass cash deducts 0");
  const split = cashPlatformRemittance({
    fee_amount: 50,
    booking_fee: 0,
    platform_commission: 5,
    driver_payout: 45,
  });
  assert(split === 5, `90/10 remit ${split}`);
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
    const { getNearbySuggestions } = await import(
      "../src/lib/actions-suggestions"
    );
    const joburg = await getNearbySuggestions({
      lat: -26.2041,
      lng: 28.0473,
      countryCode: "ZA",
    });
    assert(
      joburg.nearby.length >= 1,
      `Joburg nearby empty (${joburg.nearby.length})`,
    );
    ok(
      `Joburg nearby ${joburg.nearby.length}: ${joburg.nearby
        .slice(0, 3)
        .map((p) => p.name)
        .join(", ")}`,
    );

    const noPin = await getNearbySuggestions({ countryCode: "ZA" });
    assert(noPin.nearby.length === 0, "no GPS must not invent nearby");
    ok("suggestions without GPS return no nearby list");
  } catch (e) {
    fail("Joburg nearby suggestions", e);
  }

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
