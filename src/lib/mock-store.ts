import type {
  Driver,
  Job,
  JobApplication,
  JobStatus,
  JobWithDriver,
  NewDriverApplicationInput,
  NewJobInput,
  NewProductInput,
  NewShopInput,
  Product,
  Rating,
  Shop,
  ShopOrderInput,
} from "./types";
import { isSouthAfricanMobile } from "./brand";
import { rankDriversForJob } from "./dispatch-score";
import { jobNeedsFromJob } from "./job-needs";
import { suggestVehicle, vehicleFitsJob } from "./vehicles";

function uid() {
  return crypto.randomUUID();
}

function refCode() {
  return `RU-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const ENGCOBO = { lat: -31.588, lng: 28.784 };

const seedDrivers: Driver[] = [
  {
    id: "d1",
    full_name: "Thabo Mbeki Bakkie",
    phone: "27821234567",
    vehicle_type: "bakkie",
    is_active: true,
    approval_status: "approved",
    id_verified: true,
    is_online: true,
    last_lat: -31.587,
    last_lng: 28.783,
    last_location_at: new Date().toISOString(),
    rating_avg: 4.9,
    rating_count: 20,
    notes: "Furniture + farm runs",
    prefer_night: true,
    prefer_heavy: true,
    prefer_village_routes: true,
    offers_received: 20,
    offers_accepted: 18,
    offers_declined: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "d2",
    full_name: "Nomsa Lift Club",
    phone: "27829876543",
    vehicle_type: "sedan",
    is_active: true,
    approval_status: "approved",
    id_verified: true,
    is_online: true,
    last_lat: -31.589,
    last_lng: 28.785,
    last_location_at: new Date().toISOString(),
    rating_avg: 4.9,
    rating_count: 20,
    notes: "Morning village ↔ town",
    prefer_night: true,
    prefer_heavy: false,
    prefer_village_routes: true,
    offers_received: 30,
    offers_accepted: 27,
    offers_declined: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "d3",
    full_name: "Sipho Truck",
    phone: "27825551234",
    vehicle_type: "truck",
    is_active: true,
    approval_status: "approved",
    id_verified: true,
    is_online: true,
    last_lat: -31.586,
    last_lng: 28.786,
    last_location_at: new Date().toISOString(),
    rating_avg: 4.9,
    rating_count: 20,
    notes: "Fridges / TVs / large loads",
    prefer_night: false,
    prefer_heavy: true,
    prefer_village_routes: true,
    offers_received: 15,
    offers_accepted: 12,
    offers_declined: 3,
    created_at: new Date().toISOString(),
  },
];

const seedShops: Shop[] = [
  {
    id: "s1",
    name: "Mthatha Home & Appliances",
    phone: "0471112233",
    category: "appliances",
    landmark: "Opposite Boxer Superstore, Mthatha",
    lat: -31.589,
    lng: 28.786,
    delivers: true,
    is_active: true,
    notes: "Fridges, TVs, washing machines",
    created_at: new Date().toISOString(),
  },
  {
    id: "s2",
    name: "Engcobo Furniture Mart",
    phone: "0475556677",
    category: "furniture",
    landmark: "Main road Engcobo, next to Engen",
    lat: ENGCOBO.lat,
    lng: ENGCOBO.lng,
    delivers: true,
    is_active: true,
    notes: "Couches, beds, wardrobes",
    created_at: new Date().toISOString(),
  },
];

const seedProducts: Product[] = [
  {
    id: "p1",
    shop_id: "s1",
    name: "Double-door fridge",
    description: "Delivery needs truck",
    price: 6999,
    size: "xl",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "p2",
    shop_id: "s1",
    name: "55 inch TV",
    description: "Bakkie OK",
    price: 4499,
    size: "medium",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "p3",
    shop_id: "s1",
    name: "3-seater couch",
    description: "Needs bakkie or truck",
    price: 5200,
    size: "large",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "p4",
    shop_id: "s2",
    name: "Queen bed + base",
    description: "Truck preferred",
    price: 4500,
    size: "xl",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "p5",
    shop_id: "s2",
    name: "Wardrobe 3-door",
    description: "Truck required",
    price: 3800,
    size: "xl",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
];

const now = Date.now();
const d1 = seedDrivers[0];

const seedJobs: Job[] = [
  {
    id: "j1",
    reference_code: "RU-LIFT",
    service_type: "ride",
    status: "new",
    required_vehicle: "sedan",
    customer_name: "Anele Dlamini",
    customer_phone: "0821112233",
    pickup_lat: -31.588,
    pickup_lng: 28.784,
    pickup_landmark: "Next to Engcobo taxi rank, blue container shop",
    dropoff_lat: -31.589,
    dropoff_lng: 28.786,
    dropoff_landmark: "Mthatha Boxer Superstore entrance",
    scheduled_for: new Date(now + 3 * 60 * 60 * 1000).toISOString(),
    details: {
      seats: 2,
      route_name: "Engcobo → Mthatha",
      direction: "to_town",
    },
    fee_amount: 50,
    fee_currency: "ZAR",
    payment_status: "paid_online",
    payment_method: "paypal",
    card_last4: null,
    paypal_order_id: "PAYPAL-DEMO-1",
    paypal_capture_id: "CAP-DEMO-1",
    paid_at: new Date(now - 19 * 60 * 1000).toISOString(),
    driver_id: null,
    assigned_at: null,
    dispatcher_notes: null,
    shop_id: null,
    product_summary: null,
    driver_lat: null,
    driver_lng: null,
    driver_location_at: null,
    offered_at: null,
    started_at: null,
    completed_at: null,
    created_at: new Date(now - 20 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 20 * 60 * 1000).toISOString(),
  },
  {
    id: "j2",
    reference_code: "RU-FRDG",
    service_type: "delivery",
    status: "new",
    required_vehicle: "truck",
    customer_name: "Lindiwe Nkosi",
    customer_phone: "0834445566",
    pickup_lat: -31.59,
    pickup_lng: 28.79,
    pickup_landmark: "Game Mthatha loading bay",
    dropoff_lat: -31.62,
    dropoff_lng: 28.75,
    dropoff_landmark: "Qumbu — white house opposite clinic, green gate",
    scheduled_for: null,
    details: {
      item_description: "Double-door fridge",
      size: "xl",
      needs_helpers: true,
    },
    fee_amount: 450,
    fee_currency: "ZAR",
    payment_status: "paid_online",
    payment_method: "paypal",
    card_last4: null,
    paypal_order_id: "PAYPAL-DEMO-2",
    paypal_capture_id: "CAP-DEMO-2",
    paid_at: new Date(now - 44 * 60 * 1000).toISOString(),
    driver_id: null,
    assigned_at: null,
    dispatcher_notes: "Paid with PayPal · deliver to landmark",
    shop_id: null,
    product_summary: "Double-door fridge",
    driver_lat: null,
    driver_lng: null,
    driver_location_at: null,
    offered_at: null,
    started_at: null,
    completed_at: null,
    created_at: new Date(now - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "j3",
    reference_code: "RU-FARM",
    service_type: "farm",
    status: "assigned",
    required_vehicle: "bakkie",
    customer_name: "Ondela Makana",
    customer_phone: "0605029496",
    pickup_lat: -31.55,
    pickup_lng: 28.72,
    pickup_landmark: "Ods Makana farm gate — ask for Ondela",
    dropoff_lat: -31.588,
    dropoff_lng: 28.784,
    dropoff_landmark: "Spaza near Engcobo high school",
    scheduled_for: new Date(now + 5 * 60 * 60 * 1000).toISOString(),
    details: {
      items: [
        { name: "Farm Fresh Eggs (dozen)", qty: 4, price: 50 },
        { name: "Whole Chicken", qty: 2, price: 120 },
      ],
      notes: "Keep eggs upright",
    },
    fee_amount: 80,
    fee_currency: "ZAR",
    payment_status: "paid_online",
    payment_method: "paypal",
    card_last4: null,
    paypal_order_id: "PAYPAL-DEMO-3",
    paypal_capture_id: "CAP-DEMO-3",
    paid_at: new Date(now - 89 * 60 * 1000).toISOString(),
    driver_id: "d1",
    assigned_at: new Date(now - 10 * 60 * 1000).toISOString(),
    dispatcher_notes: null,
    shop_id: null,
    product_summary: null,
    driver_lat: d1.last_lat,
    driver_lng: d1.last_lng,
    driver_location_at: d1.last_location_at,
    offered_at: new Date(now - 15 * 60 * 1000).toISOString(),
    started_at: null,
    completed_at: null,
    created_at: new Date(now - 90 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 10 * 60 * 1000).toISOString(),
  },
];

type Store = {
  drivers: Driver[];
  jobs: Job[];
  shops: Shop[];
  products: Product[];
  applications: JobApplication[];
  ratings: Rating[];
};

declare global {
  // eslint-disable-next-line no-var
  var __ruralMockStore: Store | undefined;
}

function store(): Store {
  if (!globalThis.__ruralMockStore) {
    globalThis.__ruralMockStore = {
      drivers: structuredClone(seedDrivers),
      jobs: structuredClone(seedJobs),
      shops: structuredClone(seedShops),
      products: structuredClone(seedProducts),
      applications: [],
      ratings: [],
    };
  }
  const s = globalThis.__ruralMockStore;
  if (!s.shops) s.shops = structuredClone(seedShops);
  if (!s.products) s.products = structuredClone(seedProducts);
  if (!s.applications) s.applications = [];
  if (!s.ratings) s.ratings = [];
  // Hot-reload: old seed missing Uber driver/job fields
  if (
    s.drivers.some(
      (d) => (d as { is_online?: boolean }).is_online === undefined,
    )
  ) {
    s.drivers = structuredClone(seedDrivers);
    s.jobs = structuredClone(seedJobs);
    s.applications = [];
    s.ratings = [];
  }
  if (s.jobs.some((j) => j.paypal_order_id === undefined)) {
    s.jobs = structuredClone(seedJobs);
  }
  if (s.jobs.some((j) => j.offered_at === undefined)) {
    s.jobs = structuredClone(seedJobs);
  }
  return s;
}

function withDriver(job: Job): JobWithDriver {
  const driver = store().drivers.find((d) => d.id === job.driver_id) ?? null;
  const shop = store().shops.find((x) => x.id === job.shop_id) ?? null;
  return { ...job, drivers: driver, shops: shop };
}

function assignJobToDriver(job: Job, driver: Driver, at: string) {
  job.driver_id = driver.id;
  job.status = "confirmed";
  job.assigned_at = at;
  job.driver_lat = driver.last_lat;
  job.driver_lng = driver.last_lng;
  job.driver_location_at = driver.last_location_at ?? at;
  job.updated_at = at;
}

function rejectOtherPendingApps(jobId: string, keepAppId?: string) {
  for (const other of store().applications) {
    if (
      other.job_id === jobId &&
      other.id !== keepAppId &&
      other.status === "pending"
    ) {
      other.status = "rejected";
    }
  }
}

export const mockRepo = {
  listJobs(): JobWithDriver[] {
    return store()
      .jobs.map(withDriver)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  },

  getJobByReference(code: string): JobWithDriver | null {
    const job = store().jobs.find(
      (j) => j.reference_code.toUpperCase() === code.toUpperCase(),
    );
    return job ? withDriver(job) : null;
  },

  listOpenJobsForDriver(driverId: string): JobWithDriver[] {
    return mockRepo.listIncomingOffers(driverId).map((a) => {
      const job = store().jobs.find((j) => j.id === a.job_id)!;
      return withDriver(job);
    });
  },

  listDrivers(): Driver[] {
    return store().drivers.filter(
      (d) => d.is_active && d.approval_status === "approved",
    );
  },

  listPendingDriverHires(): Driver[] {
    return store()
      .drivers.filter((d) => d.approval_status === "pending")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  },

  listAllDriversForOps(): Driver[] {
    return [...store().drivers].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  },

  applyToDrive(input: NewDriverApplicationInput): Driver {
    const name = input.full_name.trim();
    const phone = input.phone.trim();
    if (!name || !phone) throw new Error("Name and phone are required.");
    if (!input.area.trim()) throw new Error("Area / town is required.");
    if (!isSouthAfricanMobile(phone)) {
      throw new Error(
        "South African mobile numbers only (e.g. 06x / 07x / 08x).",
      );
    }

    const existing = store().drivers.find(
      (d) => d.phone.replace(/\D/g, "") === phone.replace(/\D/g, ""),
    );
    if (existing?.approval_status === "approved") {
      throw new Error("This phone is already an approved driver. Go online.");
    }
    if (existing?.approval_status === "pending") {
      throw new Error("Application already submitted — waiting for approval.");
    }

    const driver: Driver = {
      id: uid(),
      full_name: name,
      phone,
      vehicle_type: input.vehicle_type,
      is_active: true,
      approval_status: "approved",
      id_verified: false,
      is_online: false,
      last_lat: null,
      last_lng: null,
      last_location_at: null,
      rating_avg: 5,
      rating_count: 0,
      prefer_night: true,
      prefer_heavy: true,
      prefer_village_routes: true,
      notes: [
        `Area: ${input.area.trim()}`,
        "SA mobile · auto-approved",
        input.notes?.trim() || null,
      ]
        .filter(Boolean)
        .join(" · "),
      created_at: new Date().toISOString(),
    };
    store().drivers.unshift(driver);
    return driver;
  },

  approveDriver(driverId: string): Driver {
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver application not found");
    if (driver.approval_status === "approved") return driver;
    driver.approval_status = "approved";
    driver.is_active = true;
    return driver;
  },

  rejectDriver(driverId: string, reason?: string): Driver {
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver application not found");
    driver.approval_status = "rejected";
    driver.is_active = false;
    driver.is_online = false;
    if (reason?.trim()) {
      driver.notes = [driver.notes, `Rejected: ${reason.trim()}`]
        .filter(Boolean)
        .join(" · ");
    }
    return driver;
  },

  listShops(): Shop[] {
    return store().shops.filter((s) => s.is_active);
  },

  listProducts(shopId?: string): Product[] {
    return store().products.filter(
      (p) => p.in_stock && (!shopId || p.shop_id === shopId),
    );
  },

  listApplications(jobId?: string): JobApplication[] {
    return store()
      .applications.filter((a) => !jobId || a.job_id === jobId)
      .map((a) => ({
        ...a,
        drivers: store().drivers.find((d) => d.id === a.driver_id) ?? null,
        jobs: store().jobs.find((j) => j.id === a.job_id) ?? null,
      }))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  },

  broadcastOffers(job: Job): void {
    const nowIso = new Date().toISOString();
    const online = store().drivers.filter(
      (d) =>
        d.is_active &&
        d.approval_status === "approved" &&
        d.is_online &&
        vehicleFitsJob(d.vehicle_type, job.required_vehicle),
    );

    for (const driver of online) {
      const existing = store().applications.find(
        (a) => a.job_id === job.id && a.driver_id === driver.id,
      );
      if (existing) continue;
      store().applications.unshift({
        id: uid(),
        job_id: job.id,
        driver_id: driver.id,
        status: "pending",
        note: null,
        created_at: nowIso,
      });
    }

    job.offered_at = nowIso;
    job.updated_at = nowIso;
  },

  /** Rank drivers and offer exclusively to #1 (no auto-assign — driver must accept). */
  autoMatchIfPossible(job: Job): JobWithDriver {
    if (job.status !== "new" && job.status !== "searching_driver") {
      return withDriver(job);
    }
    job.status = "searching_driver";
    job.dispatch_attempts = 0;
    job.dispatch_exhausted = false;

    const needs = jobNeedsFromJob(job);
    const online = store().drivers.filter(
      (d) =>
        d.is_active &&
        d.approval_status === "approved" &&
        d.is_online,
    );
    const pickup =
      job.pickup_lat != null && job.pickup_lng != null
        ? { lat: job.pickup_lat, lng: job.pickup_lng }
        : null;
    const ranked = rankDriversForJob({
      drivers: online,
      requiredVehicle: job.required_vehicle,
      needs,
      pickup,
    });

    job.dispatch_rank = ranked.map((r) => r.driver.id);
    job.dispatch_index = 0;
    job.match_score = ranked[0]?.score ?? null;
    job.match_breakdown = (ranked[0]?.breakdown as unknown as Record<
      string,
      unknown
    >) ?? null;

    return mockRepo.offerNextMock(job);
  },

  offerNextMock(job: Job): JobWithDriver {
    if (job.status !== "new" && job.status !== "searching_driver") {
      return withDriver(job);
    }
    job.status = "searching_driver";
    if (job.dispatch_exhausted) return withDriver(job);
    if ((Number(job.dispatch_attempts) || 0) >= 3) {
      job.dispatch_exhausted = true;
      job.offered_driver_id = null;
      job.offer_expires_at = null;
      return withDriver(job);
    }

    const rank = job.dispatch_rank ?? [];
    const declined = new Set(
      store()
        .applications.filter(
          (a) =>
            a.job_id === job.id &&
            (a.status === "withdrawn" || a.status === "rejected"),
        )
        .map((a) => a.driver_id),
    );

    let i = Math.max(0, Number(job.dispatch_index) || 0);
    for (; i < rank.length; i++) {
      const driverId = rank[i];
      if (!driverId || declined.has(driverId)) continue;
      const driver = store().drivers.find(
        (d) => d.id === driverId && d.is_online && d.is_active,
      );
      if (!driver) continue;

      const nowIso = new Date().toISOString();
      job.offered_driver_id = driver.id;
      job.offer_expires_at = new Date(
        Date.now() + 30_000,
      ).toISOString();
      job.offered_at = nowIso;
      job.dispatch_index = i;
      job.dispatch_attempts = (Number(job.dispatch_attempts) || 0) + 1;
      job.updated_at = nowIso;
      driver.offers_received = (driver.offers_received ?? 0) + 1;

      const existing = store().applications.find(
        (a) => a.job_id === job.id && a.driver_id === driver.id,
      );
      if (existing) {
        existing.status = "pending";
      } else {
        store().applications.unshift({
          id: uid(),
          job_id: job.id,
          driver_id: driver.id,
          status: "pending",
          note: "Exclusive offer",
          created_at: nowIso,
        });
      }
      console.log("[fcm:mock] New job offer →", driver.full_name, job.reference_code);
      return withDriver(job);
    }

    job.offered_driver_id = null;
    job.offer_expires_at = null;
    job.dispatch_exhausted = true;
    return withDriver(job);
  },

  createJob(input: NewJobInput): JobWithDriver {
    const isCash = input.payment.method === "cash";
    const online =
      input.payment.method === "paypal" || input.payment.method === "card"
        ? input.payment
        : null;
    if (!isCash && (!online?.paypalOrderId || !online.paypalCaptureId)) {
      throw new Error("Valid payment required.");
    }

    const nowIso = new Date().toISOString();
    const job: Job = {
      id: uid(),
      reference_code: refCode(),
      service_type: input.service_type,
      status: "searching_driver",
      required_vehicle: input.required_vehicle,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      pickup_lat: input.pickup_lat,
      pickup_lng: input.pickup_lng,
      pickup_landmark: input.pickup_landmark,
      dropoff_lat: input.dropoff_lat,
      dropoff_lng: input.dropoff_lng,
      dropoff_landmark: input.dropoff_landmark,
      scheduled_for: input.scheduled_for ?? null,
      details: input.details,
      fee_amount: input.fee_amount,
      fee_currency: "ZAR",
      payment_status: isCash ? "unpaid" : "paid_online",
      payment_method: isCash
        ? "cash"
        : online?.method === "card"
          ? "card"
          : "paypal",
      card_last4: null,
      paypal_order_id: online?.paypalOrderId ?? null,
      paypal_capture_id: online?.paypalCaptureId ?? null,
      paid_at: isCash ? null : nowIso,
      driver_id: null,
      assigned_at: null,
      dispatcher_notes: input.dispatcher_notes ?? null,
      shop_id: input.shop_id ?? null,
      product_summary: input.product_summary ?? null,
      driver_lat: null,
      driver_lng: null,
      driver_location_at: null,
      offered_at: null,
      started_at: null,
      completed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };
    store().jobs.unshift(job);
    mockRepo.broadcastOffers(job);
    return mockRepo.autoMatchIfPossible(job);
  },

  setDriverOnline(
    driverId: string,
    online: boolean,
    lat?: number,
    lng?: number,
  ): Driver {
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    const nowIso = new Date().toISOString();
    driver.is_online = online;
    if (lat != null && lng != null) {
      driver.last_lat = lat;
      driver.last_lng = lng;
      driver.last_location_at = nowIso;
    } else if (online && driver.last_lat == null) {
      driver.last_lat = ENGCOBO.lat;
      driver.last_lng = ENGCOBO.lng;
      driver.last_location_at = nowIso;
    }
    return driver;
  },

  updateDriverLocation(driverId: string, lat: number, lng: number): Driver {
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    const nowIso = new Date().toISOString();
    driver.last_lat = lat;
    driver.last_lng = lng;
    driver.last_location_at = nowIso;

    for (const job of store().jobs) {
      if (
        job.driver_id === driverId &&
        (job.status === "assigned" || job.status === "in_progress")
      ) {
        job.driver_lat = lat;
        job.driver_lng = lng;
        job.driver_location_at = nowIso;
        job.updated_at = nowIso;
      }
    }
    return driver;
  },

  acceptOffer(jobId: string, driverId: string): JobWithDriver {
    const job = store().jobs.find((j) => j.id === jobId);
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!job || !driver) throw new Error("Job or driver not found");
    if (job.status !== "new" && job.status !== "searching_driver") {
      throw new Error("Offer already taken");
    }
    if (!vehicleFitsJob(driver.vehicle_type, job.required_vehicle)) {
      throw new Error(
        `This job needs a ${job.required_vehicle}. You drive a ${driver.vehicle_type}.`,
      );
    }

    const nowIso = new Date().toISOString();
    let app = store().applications.find(
      (a) =>
        a.job_id === jobId &&
        a.driver_id === driverId &&
        a.status === "pending",
    );
    if (!app) {
      app = {
        id: uid(),
        job_id: jobId,
        driver_id: driverId,
        status: "accepted",
        note: null,
        created_at: nowIso,
      };
      store().applications.unshift(app);
    } else {
      app.status = "accepted";
    }

    assignJobToDriver(job, driver, nowIso);
    job.offered_driver_id = null;
    job.offer_expires_at = null;
    job.dispatch_exhausted = false;
    driver.offers_accepted = (driver.offers_accepted ?? 0) + 1;
    rejectOtherPendingApps(jobId, app.id);
    return withDriver(job);
  },

  declineOffer(jobId: string, driverId: string): JobApplication {
    const driver = store().drivers.find((d) => d.id === driverId);
    if (driver) {
      driver.offers_declined = (driver.offers_declined ?? 0) + 1;
    }
    const app = store().applications.find(
      (a) =>
        a.job_id === jobId &&
        a.driver_id === driverId &&
        a.status === "pending",
    );
    if (!app) throw new Error("Offer not found");
    app.status = "withdrawn";
    const job = store().jobs.find((j) => j.id === jobId);
    if (job && (job.status === "new" || job.status === "searching_driver")) {
      job.offered_driver_id = null;
      job.offer_expires_at = null;
      job.dispatch_index = (Number(job.dispatch_index) || 0) + 1;
      mockRepo.offerNextMock(job);
    }
    return {
      ...app,
      drivers: store().drivers.find((d) => d.id === driverId) ?? null,
      jobs: store().jobs.find((j) => j.id === jobId) ?? null,
    };
  },

  startTrip(jobId: string, driverId: string): JobWithDriver {
    const job = store().jobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Job not found");
    if (job.driver_id !== driverId) throw new Error("Not your job");
    if (job.status !== "confirmed" && job.status !== "assigned") {
      throw new Error("Job must be confirmed before starting");
    }
    const nowIso = new Date().toISOString();
    job.status = "in_progress";
    job.started_at = nowIso;
    job.updated_at = nowIso;
    return withDriver(job);
  },

  completeTrip(jobId: string, driverId: string): JobWithDriver {
    const job = store().jobs.find((j) => j.id === jobId);
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!job || !driver) throw new Error("Job or driver not found");
    if (job.driver_id !== driverId) throw new Error("Not your job");
    if (job.status !== "in_progress" && job.status !== "assigned") {
      throw new Error("Job cannot be completed from this status");
    }
    const nowIso = new Date().toISOString();
    job.status = "completed";
    job.completed_at = nowIso;
    job.updated_at = nowIso;
    driver.is_online = true;
    return withDriver(job);
  },

  rateTrip(jobId: string, stars: number, comment?: string): Rating {
    const job = store().jobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Job not found");
    if (!job.driver_id) throw new Error("Job has no driver");
    if (job.status !== "completed") {
      throw new Error("Can only rate completed trips");
    }
    if (stars < 1 || stars > 5) throw new Error("Stars must be 1–5");

    const existing = store().ratings.find((r) => r.job_id === jobId);
    if (existing) throw new Error("Trip already rated");

    const driver = store().drivers.find((d) => d.id === job.driver_id);
    if (!driver) throw new Error("Driver not found");

    const rating: Rating = {
      id: uid(),
      job_id: jobId,
      driver_id: job.driver_id,
      stars,
      comment: comment ?? null,
      created_at: new Date().toISOString(),
    };
    store().ratings.unshift(rating);

    const total = driver.rating_avg * driver.rating_count + stars;
    driver.rating_count += 1;
    driver.rating_avg = Math.round((total / driver.rating_count) * 10) / 10;

    return rating;
  },

  getRatingForJob(jobId: string): Rating | null {
    return store().ratings.find((r) => r.job_id === jobId) ?? null;
  },

  listIncomingOffers(driverId: string): JobApplication[] {
    return store()
      .applications.filter((a) => {
        if (a.driver_id !== driverId || a.status !== "pending") return false;
        const job = store().jobs.find((j) => j.id === a.job_id);
        if (
          !job ||
          (job.status !== "new" && job.status !== "searching_driver")
        ) {
          return false;
        }
        if (job.offered_driver_id && job.offered_driver_id !== driverId) {
          return false;
        }
        return true;
      })
      .map((a) => ({
        ...a,
        drivers: store().drivers.find((d) => d.id === a.driver_id) ?? null,
        jobs: store().jobs.find((j) => j.id === a.job_id) ?? null,
      }))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  },

  listDriverActiveJob(driverId: string): JobWithDriver | null {
    const job = store().jobs.find(
      (j) =>
        j.driver_id === driverId &&
        (j.status === "confirmed" ||
          j.status === "assigned" ||
          j.status === "in_progress"),
    );
    return job ? withDriver(job) : null;
  },

  triggerSos(
    jobIdOrRef: string,
    note?: string,
    _lat?: number,
    _lng?: number,
  ): JobWithDriver {
    const key = jobIdOrRef.trim();
    const job =
      store().jobs.find((j) => j.id === key) ??
      store().jobs.find(
        (j) => j.reference_code.toLowerCase() === key.toLowerCase(),
      );
    if (!job) throw new Error("Job not found");
    const nowIso = new Date().toISOString();
    job.sos_triggered_at = nowIso;
    job.sos_note = note ?? null;
    job.updated_at = nowIso;
    return withDriver(job);
  },

  rematchJob(jobId: string): JobWithDriver {
    const job = store().jobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Job not found");
    if (job.status !== "new") {
      throw new Error("Only open jobs can be rematched");
    }
    mockRepo.broadcastOffers(job);
    return mockRepo.autoMatchIfPossible(job);
  },

  createShop(input: NewShopInput): Shop {
    const shop: Shop = {
      id: uid(),
      name: input.name,
      phone: input.phone,
      category: input.category,
      landmark: input.landmark,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      delivers: true,
      is_active: true,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
    };
    store().shops.unshift(shop);
    return shop;
  },

  createProduct(input: NewProductInput): Product {
    const product: Product = {
      id: uid(),
      shop_id: input.shop_id,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      size: input.size,
      in_stock: true,
      created_at: new Date().toISOString(),
    };
    store().products.unshift(product);
    return product;
  },

  createShopOrder(input: ShopOrderInput): JobWithDriver {
    const shop = store().shops.find((s) => s.id === input.shop_id);
    const product = store().products.find((p) => p.id === input.product_id);
    if (!shop || !product) throw new Error("Shop or product not found");

    const required = suggestVehicle({
      service_type: "delivery",
      delivery_size: product.size,
    });

    return mockRepo.createJob({
      service_type: "delivery",
      required_vehicle: required,
      customer_name: input.buyer_name,
      customer_phone: input.buyer_phone,
      pickup_lat: shop.lat,
      pickup_lng: shop.lng,
      pickup_landmark: `${shop.name} — ${shop.landmark}`,
      dropoff_lat: input.dropoff_lat,
      dropoff_lng: input.dropoff_lng,
      dropoff_landmark: input.dropoff_landmark,
      details: {
        item_description: product.name,
        size: product.size,
        needs_helpers: product.size === "large" || product.size === "xl",
      },
      fee_amount:
        required === "truck" ? 450 : required === "bakkie" ? 180 : 50,
      shop_id: shop.id,
      product_summary: `${product.name} (R${product.price})`,
      dispatcher_notes: `Shop order from ${shop.name} · paid with PayPal`,
      payment: input.payment,
    });
  },

  applyForJob(jobId: string, driverId: string, note?: string): JobApplication {
    // Alias: accept offer if pending, else create pending then accept (first-wins)
    const job = store().jobs.find((j) => j.id === jobId);
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!job || !driver) throw new Error("Job or driver not found");
    if (job.status !== "new") throw new Error("Job is no longer open");
    if (!vehicleFitsJob(driver.vehicle_type, job.required_vehicle)) {
      throw new Error(
        `This job needs a ${job.required_vehicle}. You drive a ${driver.vehicle_type}.`,
      );
    }

    const existing = store().applications.find(
      (a) => a.job_id === jobId && a.driver_id === driverId,
    );
    if (!existing) {
      store().applications.unshift({
        id: uid(),
        job_id: jobId,
        driver_id: driverId,
        status: "pending",
        note: note ?? null,
        created_at: new Date().toISOString(),
      });
    } else if (existing.status === "pending" && note) {
      existing.note = note;
    } else if (existing.status !== "pending") {
      throw new Error("You already applied for this job");
    }

    const assigned = mockRepo.acceptOffer(jobId, driverId);
    const app = store().applications.find(
      (a) =>
        a.job_id === jobId &&
        a.driver_id === driverId &&
        a.status === "accepted",
    )!;
    return {
      ...app,
      drivers: driver,
      jobs: assigned,
    };
  },

  acceptApplication(applicationId: string): JobWithDriver {
    const app = store().applications.find((a) => a.id === applicationId);
    if (!app) throw new Error("Application not found");
    if (app.status !== "pending") throw new Error("Application not pending");
    return mockRepo.acceptOffer(app.job_id, app.driver_id);
  },

  assignDriver(jobId: string, driverId: string): JobWithDriver {
    const job = store().jobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Job not found");
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    if (!vehicleFitsJob(driver.vehicle_type, job.required_vehicle)) {
      throw new Error(
        `This job needs a ${job.required_vehicle}. ${driver.full_name} drives a ${driver.vehicle_type}.`,
      );
    }
    const nowIso = new Date().toISOString();
    assignJobToDriver(job, driver, nowIso);

    let app = store().applications.find(
      (a) => a.job_id === jobId && a.driver_id === driverId,
    );
    if (!app) {
      app = {
        id: uid(),
        job_id: jobId,
        driver_id: driverId,
        status: "accepted",
        note: "Manual assign",
        created_at: nowIso,
      };
      store().applications.unshift(app);
    } else {
      app.status = "accepted";
    }
    rejectOtherPendingApps(jobId, app.id);
    return withDriver(job);
  },

  updateStatus(jobId: string, status: JobStatus): JobWithDriver | null {
    const job = store().jobs.find((j) => j.id === jobId);
    if (!job) return null;
    const nowIso = new Date().toISOString();
    job.status = status;
    job.updated_at = nowIso;
    if (status === "in_progress" && !job.started_at) {
      job.started_at = nowIso;
    }
    if (status === "completed" && !job.completed_at) {
      job.completed_at = nowIso;
      if (job.driver_id) {
        const driver = store().drivers.find((d) => d.id === job.driver_id);
        if (driver) driver.is_online = true;
      }
    }
    return withDriver(job);
  },
};
