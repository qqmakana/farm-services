/**
 * Local mock flow smoke test — run with: npx tsx scripts/smoke-local.ts
 * Verifies buttons' server logic without PayPal/Supabase.
 */
import { mockRepo } from "../src/lib/mock-store";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const drivers = mockRepo.listDrivers();
assert(drivers.length >= 1, "seed drivers missing");

const bakkie = drivers.find((d) => d.vehicle_type === "bakkie") ?? drivers[0];
mockRepo.setDriverOnline(bakkie.id, true, -31.588, 28.784);

const job = mockRepo.createJob({
  service_type: "ride",
  required_vehicle: "sedan",
  customer_name: "Smoke Test",
  customer_phone: "0820000000",
  pickup_lat: -31.588,
  pickup_lng: 28.784,
  pickup_landmark: "Taxi rank",
  dropoff_lat: -31.59,
  dropoff_lng: 28.79,
  dropoff_landmark: "Town clinic",
  details: { seats: 1, route_name: "Test", direction: "to_town" },
  fee_amount: 50,
  payment: {
    method: "paypal",
    paypalOrderId: "LOCAL-ORDER-SMOKE",
    paypalCaptureId: "LOCAL-CAP-SMOKE",
  },
});
assert(job.reference_code, "job missing reference");
assert(job.payment_status === "paid_online", "job not paid");

const sedan =
  drivers.find((d) => d.vehicle_type === "sedan") ?? drivers[0];
mockRepo.setDriverOnline(sedan.id, true, -31.588, 28.784);

let active = mockRepo.getJobByReference(job.reference_code);
assert(active, "job not found by ref");

if (active.status === "new") {
  active = mockRepo.acceptOffer(active.id, sedan.id);
}
assert(active.status === "assigned", `expected assigned, got ${active.status}`);

active = mockRepo.startTrip(active.id, sedan.id);
assert(active.status === "in_progress", "start trip failed");

active = mockRepo.completeTrip(active.id, sedan.id);
assert(active.status === "completed", "complete trip failed");

const rating = mockRepo.rateTrip(active.id, 5, "smoke ok");
assert(rating.stars === 5, "rating failed");

const shop = mockRepo.createShop({
  name: "Smoke Shop",
  phone: "0821111111",
  category: "general",
  landmark: "Main street",
});
const product = mockRepo.createProduct({
  shop_id: shop.id,
  name: "TV",
  price: 2000,
  size: "large",
});
assert(product.shop_id === shop.id, "product create failed");

const shopJob = mockRepo.createShopOrder({
  shop_id: shop.id,
  product_id: product.id,
  buyer_name: "Buyer",
  buyer_phone: "0832222222",
  dropoff_landmark: "Green gate",
  dropoff_lat: null,
  dropoff_lng: null,
  payment: {
    method: "paypal",
    paypalOrderId: "LOCAL-SHOP-ORDER",
    paypalCaptureId: "LOCAL-SHOP-CAP",
  },
});
assert(shopJob.service_type === "delivery", "shop order type");

mockRepo.triggerSos(job.reference_code, "test sos");
mockRepo.rematchJob(
  mockRepo.listJobs().find((j) => j.status === "new")?.id ?? shopJob.id,
);

console.log("SMOKE OK — book → match → trip → rate → shop → sos → rematch");
