/**
 * Logic tests — wallet, dispatch eligibility, trip complete, merchant shop.
 * Run via: npx tsx scripts/test-app-logic.ts
 */
import { mockRepo } from "../src/lib/mock-store";
import {
  applyCommissionToWallet,
  driverEligibleForDispatch,
} from "../src/lib/wallet";
import {
  generateReferralCode,
  generateShopWeeklyReport,
} from "../src/lib/partner";

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

test("dispatch: negative wallet blocks eligibility", () => {
  assert(driverEligibleForDispatch({ wallet_balance: 0 }) === true, "zero ok");
  assert(driverEligibleForDispatch({ wallet_balance: 50 }) === true, "pos ok");
  assert(
    driverEligibleForDispatch({ wallet_balance: -1 }) === false,
    "neg blocked",
  );
});

test("mock: drivers seeded with wallet fields", () => {
  const drivers = mockRepo.listDrivers();
  assert(drivers.length >= 1, "no drivers");
  const d = drivers[0];
  assert(typeof d.wallet_balance === "number", "wallet_balance missing");
});

test("mock: complete trip deducts 15% commission from wallet", () => {
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
    fee_amount: 200,
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

  active = mockRepo.completeTrip(active.id, driver.id);
  assert(active.status === "completed", "complete failed");

  const after = mockRepo.listDrivers().find((d) => d.id === driver.id)!;
  // 15% of 200 = 30
  assert(after.wallet_balance === -30, `wallet ${after.wallet_balance}`);
  assert(after.commission_owed === 30, `owed ${after.commission_owed}`);
  assert(
    driverEligibleForDispatch(after) === false,
    "should block dispatch after debt",
  );
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

  console.log(`\nLogic summary: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

void runAsync();
