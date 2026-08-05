import type {
  CommunityLocation,
  CreateGroupTripInput,
  CreateLocationInput,
  Driver,
  GroupTrip,
  GroupTripParticipant,
  Job,
  JobApplication,
  JobStatus,
  JobWithDriver,
  JoinGroupTripInput,
  NewDriverApplicationInput,
  NewJobInput,
  NewProductInput,
  NewShopInput,
  Product,
  Rating,
  SavedLocation,
  SavePersonalLocationInput,
  Shop,
  ShopCartOrderInput,
  ShopOrder,
  ShopOrderInput,
  ShopOrderItem,
  ShopOrderStatus,
  CreateFuelRequestInput,
  FuelRequest,
} from "./types";
import { distanceKm } from "./geo";
import { calculateFare } from "./fares";
import { isValidMobileForCountry } from "./phone";
import { DEFAULT_COUNTRY, getCountry } from "./countries";
import { rankDriversForJob } from "./dispatch-score";
import { jobNeedsFromJob } from "./job-needs";
import { SHOP_DELIVERY_FEE } from "./shop-constants";
import { suggestVehicle, vehicleFitsJob } from "./vehicles";
import {
  FOUNDING_CITIES,
  isWithinFoundingEra,
  normalizeHomeCity,
} from "./founding-driver";
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

type MonthlyCityRevenue = {
  id: string;
  city: string;
  month_year: string;
  total_gross_revenue: number;
  bonus_pool_amount: number;
  is_distributed: boolean;
};

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
    wallet_balance: 0,
    commission_owed: 0,
    verification_status: "verified",
    id_doc_url: "mock://id/thabo.jpg",
    selfie_url: "mock://selfie/thabo.jpg",
    vehicle_front_url: "mock://vfront/thabo.jpg",
    vehicle_side_url: "mock://vside/thabo.jpg",
    code_of_conduct_accepted_at: new Date().toISOString(),
    vehicle_make: "Toyota",
    vehicle_model: "Hilux",
    vehicle_color: "White",
    vehicle_registration: "EC 123-456",
    home_city: "Johannesburg",
    is_founding_driver: false,
    accumulated_bonus_balance: 0,
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
    wallet_balance: 0,
    commission_owed: 0,
    verification_status: "verified",
    id_doc_url: "mock://id/nomsa.jpg",
    selfie_url: "mock://selfie/nomsa.jpg",
    vehicle_front_url: "mock://vfront/nomsa.jpg",
    vehicle_side_url: "mock://vside/nomsa.jpg",
    code_of_conduct_accepted_at: new Date().toISOString(),
    vehicle_make: "VW",
    vehicle_model: "Polo",
    vehicle_color: "Silver",
    vehicle_registration: "EC 987-654",
    home_city: "Cape Town",
    is_founding_driver: false,
    accumulated_bonus_balance: 0,
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
    wallet_balance: 0,
    commission_owed: 0,
    verification_status: "verified",
    id_doc_url: "mock://id/sipho.jpg",
    selfie_url: "mock://selfie/sipho.jpg",
    vehicle_front_url: "mock://vfront/sipho.jpg",
    vehicle_side_url: "mock://vside/sipho.jpg",
    code_of_conduct_accepted_at: new Date().toISOString(),
    home_city: "Durban",
    is_founding_driver: false,
    accumulated_bonus_balance: 0,
    vehicle_make: "Isuzu",
    vehicle_model: "NPR",
    vehicle_color: "Blue",
    vehicle_registration: "EC 555-321",
    created_at: new Date().toISOString(),
  },
];

const seedGroupTrips: GroupTrip[] = [
  {
    id: "gt1",
    driver_id: "d2",
    kind: "ride",
    title: "Group Ride to Mthatha",
    route_pickup: "Engcobo taxi rank",
    route_dropoff: "Mthatha town",
    route_stops: ["Qunu"],
    capacity: 4,
    seats_taken: 1,
    status: "open",
    price_per_person: 100,
    total_price: 400,
    country_code: "ZA",
    departs_at: null,
    created_at: new Date().toISOString(),
  },
];

const seedGroupParticipants: GroupTripParticipant[] = [
  {
    id: "gp1",
    group_trip_id: "gt1",
    guest_name: "Anele",
    guest_phone: "27820001111",
    seats: 1,
    amount_due: 100,
    status: "confirmed",
    joined_at: new Date().toISOString(),
  },
];

const seedCommunityLocations: CommunityLocation[] = [
  {
    id: "loc1",
    name: "Sipho's Farm",
    category: "farm",
    description: "Next to the blue water tank",
    village: "Qunu",
    latitude: -31.78,
    longitude: 28.62,
    country_code: "ZA",
    created_by_phone: "27820001111",
    created_by_name: "Anele",
    shop_id: null,
    is_verified: false,
    usage_count: 12,
    created_at: new Date().toISOString(),
  },
  {
    id: "loc2",
    name: "Engcobo Saturday Market",
    category: "landmark",
    description: "Opposite the taxi rank on market days",
    village: "Engcobo",
    latitude: -31.588,
    longitude: 28.784,
    country_code: "ZA",
    created_by_phone: null,
    created_by_name: null,
    shop_id: null,
    is_verified: true,
    usage_count: 40,
    created_at: new Date().toISOString(),
  },
];

const seedShops: Shop[] = [
  {
    id: "s3",
    name: "Mama's Kitchen",
    phone: "0472223344",
    category: "food",
    landmark: "Next to taxi rank, Engcobo",
    lat: ENGCOBO.lat,
    lng: ENGCOBO.lng,
    delivers: true,
    is_active: true,
    notes: "Home-cooked meals",
    description: "Home cooking · Pap, stews & vetkoek",
    image_url: null,
    created_at: new Date().toISOString(),
    referral_code: "MAMAk9p",
    referred_by_shop_id: null,
    rating_avg: 4.8,
    rating_count: 126,
  },
  {
    id: "s4",
    name: "Village Spaza Fresh",
    phone: "0473334455",
    category: "groceries",
    landmark: "Main street Engcobo",
    lat: -31.586,
    lng: 28.781,
    delivers: true,
    is_active: true,
    notes: "Everyday groceries",
    description: "Groceries · Cold drinks & essentials",
    image_url: null,
    created_at: new Date().toISOString(),
    referral_code: "SPAZf3n",
    referred_by_shop_id: "s3",
    rating_avg: 4.6,
    rating_count: 89,
  },
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
    description: "Appliances · Fridges, TVs & more",
    image_url: null,
    created_at: new Date().toISOString(),
    referral_code: "MTHAx7k",
    referred_by_shop_id: null,
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
    description: "Furniture · Beds, couches & wardrobes",
    image_url: null,
    created_at: new Date().toISOString(),
    referral_code: "ENGCf2m",
    referred_by_shop_id: "s1",
  },
];

const seedProducts: Product[] = [
  {
    id: "p10",
    shop_id: "s3",
    name: "Beef stew + pap",
    description: "Hearty plate with chakalaka",
    price: 55,
    size: "small",
    in_stock: true,
    image_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "p11",
    shop_id: "s3",
    name: "Chicken curry + rice",
    description: "Mild spice, fresh veggies",
    price: 60,
    size: "small",
    in_stock: true,
    image_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "p12",
    shop_id: "s3",
    name: "Vetkoek with mince",
    description: "2 pieces, filling",
    price: 35,
    size: "small",
    in_stock: true,
    image_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "p13",
    shop_id: "s3",
    name: "1L Coke",
    description: "Ice-cold",
    price: 22,
    size: "small",
    in_stock: true,
    image_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "p20",
    shop_id: "s4",
    name: "Brown bread loaf",
    description: "Fresh baked",
    price: 18,
    size: "small",
    in_stock: true,
    image_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "p21",
    shop_id: "s4",
    name: "2L Milk",
    description: "Full cream",
    price: 32,
    size: "small",
    in_stock: true,
    image_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "p22",
    shop_id: "s4",
    name: "Eggs (dozen)",
    description: "Farm fresh",
    price: 45,
    size: "small",
    in_stock: true,
    image_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "p23",
    shop_id: "s4",
    name: "Sunlight soap bar",
    description: "Household staple",
    price: 16,
    size: "small",
    in_stock: true,
    image_url: null,
    created_at: new Date().toISOString(),
  },
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

type WearLog = {
  description: string;
  brand: string;
  country: string;
  job_id: string | null;
  created_at: string;
};

type Store = {
  drivers: Driver[];
  jobs: Job[];
  shops: Shop[];
  products: Product[];
  shopOrders: ShopOrder[];
  shopOrderItems: ShopOrderItem[];
  applications: JobApplication[];
  ratings: Rating[];
  groupTrips: GroupTrip[];
  groupParticipants: GroupTripParticipant[];
  communityLocations: CommunityLocation[];
  savedLocations: SavedLocation[];
  wearLogs: WearLog[];
  fuelRequests: FuelRequest[];
  monthlyCityRevenue: MonthlyCityRevenue[];
};

const seedWearLogs: WearLog[] = (() => {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  return [
    { description: "Nike tracksuit", brand: "Nike", country: "ZA", job_id: null, created_at: new Date(now - 1 * hour).toISOString() },
    { description: "red Adidas hoodie", brand: "Adidas", country: "ZA", job_id: null, created_at: new Date(now - 2 * hour).toISOString() },
    { description: "black Nike jacket", brand: "Nike", country: "ZA", job_id: null, created_at: new Date(now - 3 * hour).toISOString() },
    { description: "Puma t-shirt blue", brand: "Puma", country: "KE", job_id: null, created_at: new Date(now - 5 * hour).toISOString() },
    { description: "Nike tracksuit", brand: "Nike", country: "NG", job_id: null, created_at: new Date(now - 8 * hour).toISOString() },
    { description: "green school jersey", brand: "Other", country: "ZA", job_id: null, created_at: new Date(now - 26 * hour).toISOString() },
    { description: "Adidas shorts + white takkies", brand: "Adidas", country: "GH", job_id: null, created_at: new Date(now - 30 * hour).toISOString() },
    { description: "Nike tracksuit", brand: "Nike", country: "ZA", job_id: null, created_at: new Date(now - 40 * hour).toISOString() },
  ];
})();

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
      shopOrders: [],
      shopOrderItems: [],
      applications: [],
      ratings: [],
      groupTrips: structuredClone(seedGroupTrips),
      groupParticipants: structuredClone(seedGroupParticipants),
      communityLocations: structuredClone(seedCommunityLocations),
      savedLocations: [],
      wearLogs: structuredClone(seedWearLogs),
      fuelRequests: [],
      monthlyCityRevenue: [],
    };
  }
  const s = globalThis.__ruralMockStore;
  if (!s.shops) s.shops = structuredClone(seedShops);
  if (!s.products) s.products = structuredClone(seedProducts);
  if (!s.shopOrders) s.shopOrders = [];
  if (!s.shopOrderItems) s.shopOrderItems = [];
  if (!s.monthlyCityRevenue) s.monthlyCityRevenue = [];
  // Hot-reload: ensure food storefront seeds exist
  if (!s.shops.some((x) => x.id === "s3")) {
    s.shops = structuredClone(seedShops);
    s.products = structuredClone(seedProducts);
  }
  if (!s.applications) s.applications = [];
  if (!s.ratings) s.ratings = [];
  if (!s.wearLogs) s.wearLogs = structuredClone(seedWearLogs);
  if (!s.fuelRequests) s.fuelRequests = [];
  if (!s.groupTrips) s.groupTrips = structuredClone(seedGroupTrips);
  if (!s.groupParticipants) {
    s.groupParticipants = structuredClone(seedGroupParticipants);
  }
  if (!s.communityLocations) {
    s.communityLocations = structuredClone(seedCommunityLocations);
  }
  if (!s.savedLocations) s.savedLocations = [];
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

function withGroupTrip(trip: GroupTrip): GroupTrip {
  const driver =
    store().drivers.find((d) => d.id === trip.driver_id) ?? null;
  const participants = store().groupParticipants.filter(
    (p) => p.group_trip_id === trip.id && p.status !== "cancelled",
  );
  return { ...trip, drivers: driver, participants };
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
  listJobsByCustomerPhone(variants: string[]): JobWithDriver[] {
    const set = new Set(
      variants.map((v) => v.replace(/\D/g, "")).filter(Boolean),
    );
    return store()
      .jobs.filter((j) => {
        const d = j.customer_phone.replace(/\D/g, "");
        if (set.has(d)) return true;
        const local = d.startsWith("27")
          ? d.slice(2)
          : d.startsWith("0")
            ? d.slice(1)
            : d;
        return set.has(local) || set.has(`0${local}`) || set.has(`27${local}`);
      })
      .map(withDriver)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  },

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
    if (!isValidMobileForCountry(phone, input.country_code || DEFAULT_COUNTRY)) {
      throw new Error("Enter a valid mobile number for your country.");
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

    const homeCity = normalizeHomeCity(input.area);
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
      country_code: input.country_code || DEFAULT_COUNTRY,
      prefer_heavy: true,
      prefer_village_routes: true,
      home_city: homeCity,
      is_founding_driver: false,
      accumulated_bonus_balance: 0,
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

  placeShopCartOrder(input: ShopCartOrderInput): ShopOrder {
    const shop = store().shops.find(
      (s) => s.id === input.shop_id && s.is_active,
    );
    if (!shop) throw new Error("Shop not found.");
    const lines: { product: Product; quantity: number }[] = [];
    for (const line of input.items) {
      const product = store().products.find(
        (p) =>
          p.id === line.product_id &&
          p.shop_id === input.shop_id &&
          p.in_stock,
      );
      if (!product) throw new Error("A product in your cart is unavailable.");
      lines.push({ product, quantity: Math.floor(line.quantity) });
    }
    if (!lines.length) throw new Error("Cart is empty.");

    const subtotal = lines.reduce(
      (s, l) => s + l.product.price * l.quantity,
      0,
    );
    const delivery_fee = SHOP_DELIVERY_FEE;
    const total_amount = subtotal + delivery_fee;
    const summary = lines
      .map((l) => `${l.quantity}x ${l.product.name}`)
      .join(", ");
    const maxSize = lines.reduce<"small" | "medium" | "large" | "xl">(
      (acc, l) => {
        const order = ["small", "medium", "large", "xl"] as const;
        return order.indexOf(l.product.size) > order.indexOf(acc)
          ? l.product.size
          : acc;
      },
      "small",
    );

    let jobId: string | null = null;
    try {
      const required = suggestVehicle({
        service_type: "delivery",
        delivery_size: maxSize,
      });
      const job = mockRepo.createJob({
        service_type: "delivery",
        required_vehicle: required,
        customer_name: input.customer_name.trim(),
        customer_phone: input.customer_phone.trim(),
        pickup_lat: shop.lat,
        pickup_lng: shop.lng,
        pickup_landmark: `${shop.name} — ${shop.landmark}`,
        dropoff_lat: input.delivery_lat ?? null,
        dropoff_lng: input.delivery_lng ?? null,
        dropoff_landmark: input.delivery_address.trim(),
        details: {
          item_description: summary,
          size: maxSize,
          needs_helpers: maxSize === "large" || maxSize === "xl",
        },
        fee_amount: delivery_fee,
        shop_id: shop.id,
        product_summary: `${summary} · goods ${subtotal}`,
        dispatcher_notes: `Eats order from ${shop.name}`,
        payment: { method: "cash" },
      });
      jobId = job.id;
    } catch {
      /* keep shop order even if job fails */
    }

    const now = new Date().toISOString();
    const order: ShopOrder = {
      id: uid(),
      reference_code: `SO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      shop_id: shop.id,
      job_id: jobId,
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone.trim(),
      delivery_address: input.delivery_address.trim(),
      delivery_lat: input.delivery_lat ?? null,
      delivery_lng: input.delivery_lng ?? null,
      status: "pending",
      subtotal,
      delivery_fee,
      total_amount,
      payment_method: input.payment_method ?? "cash",
      notes: input.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    };
    store().shopOrders.unshift(order);
    const items: ShopOrderItem[] = lines.map((l) => ({
      id: uid(),
      order_id: order.id,
      product_id: l.product.id,
      product_name: l.product.name,
      quantity: l.quantity,
      price_at_purchase: l.product.price,
      created_at: now,
    }));
    store().shopOrderItems.unshift(...items);
    return { ...order, items };
  },

  listShopOrders(shopId: string): ShopOrder[] {
    return store()
      .shopOrders.filter((o) => o.shop_id === shopId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .map((o) => ({
        ...o,
        items: store().shopOrderItems.filter((i) => i.order_id === o.id),
      }));
  },

  updateShopOrderStatus(
    orderId: string,
    status: ShopOrderStatus,
  ): ShopOrder {
    const order = store().shopOrders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found.");
    order.status = status;
    order.updated_at = new Date().toISOString();
    return {
      ...order,
      items: store().shopOrderItems.filter((i) => i.order_id === order.id),
    };
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
        d.is_online &&
        driverEligibleForDispatch(d),
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
      if (!driver || !driverEligibleForDispatch(driver)) continue;

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
      fee_currency: getCountry(input.country_code || DEFAULT_COUNTRY).currency,
      country_code: input.country_code || DEFAULT_COUNTRY,
      currency: getCountry(input.country_code || DEFAULT_COUNTRY).currency,
      booking_fee: 0,
      priority_score: 0,
      village_pass: false,
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

  logWear(input: {
    description: string;
    brand: string;
    country: string;
    job_id?: string | null;
    created_at?: string;
  }) {
    store().wearLogs.unshift({
      description: input.description,
      brand: input.brand,
      country: input.country,
      job_id: input.job_id ?? null,
      created_at: input.created_at ?? new Date().toISOString(),
    });
  },

  listWearLogs() {
    return store().wearLogs.map((w) => ({
      description: w.description,
      brand: w.brand,
      country: w.country,
      created_at: w.created_at,
    }));
  },

  setDriverOnline(
    driverId: string,
    online: boolean,
    lat?: number,
    lng?: number,
  ): Driver {
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    if (online && !driverEligibleForDispatch(driver)) {
      throw new Error(creditLimitBlockMessage(driver.country_code));
    }
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
    if (!driverEligibleForDispatch(driver)) {
      throw new Error(creditLimitBlockMessage(driver.country_code));
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

  completeTrip(
    jobId: string,
    driverId: string,
    options?: { cashCollected?: boolean },
  ): JobWithDriver {
    const job = store().jobs.find((j) => j.id === jobId);
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!job || !driver) throw new Error("Job or driver not found");
    if (job.driver_id !== driverId) throw new Error("Not your job");
    if (
      job.status !== "in_progress" &&
      job.status !== "assigned" &&
      job.status !== "confirmed"
    ) {
      throw new Error("Job cannot be completed from this status");
    }

    const method = job.payment_method ?? "cash";
    const cashTrip = isCashPaymentMethod(method);
    if (cashTrip && options?.cashCollected === undefined) {
      throw new Error("Confirm whether the rider paid cash before completing.");
    }

    const nowIso = new Date().toISOString();
    job.status = "completed";
    job.completed_at = nowIso;
    job.updated_at = nowIso;
    driver.is_online = true;

    const remit = cashPlatformRemittance(job);
    const payout = cardDriverPayout(job);

    if (cashTrip) {
      const collected = Boolean(options?.cashCollected);
      job.cash_collected_confirmed = collected;
      job.cash_confirmed_at = nowIso;
      if (collected) {
        job.payment_status = "cash_collected";
        job.paid_at = nowIso;
        // Scenario A: deduct platform_fee (flat) or legacy % remittance
        const walletUpdate = applyCommissionToWallet({
          walletBalance: Number(driver.wallet_balance ?? 0),
          commission: remit,
        });
        driver.wallet_balance = walletUpdate.wallet_balance;
        driver.commission_owed = walletUpdate.commission_owed;
      } else {
        job.payment_status = "unpaid";
        job.dispatcher_notes = [
          job.dispatcher_notes,
          "CASH NOT COLLECTED — driver flagged for ops review",
        ]
          .filter(Boolean)
          .join(" · ");
      }
    } else if (isCardPaymentMethod(method)) {
      // Scenario B: credit (total − platform_fee)
      const walletUpdate = creditPayoutToWallet({
        walletBalance: Number(driver.wallet_balance ?? 0),
        payout,
      });
      driver.wallet_balance = walletUpdate.wallet_balance;
      driver.commission_owed = walletUpdate.commission_owed;
    }

    return withDriver(job);
  },

  creditWallet(driverId: string, amount: number, note?: string): Driver {
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    const next = Number(driver.wallet_balance ?? 0) + Math.round(amount);
    driver.wallet_balance = next;
    driver.commission_owed = next < 0 ? Math.abs(next) : 0;
    if (note?.trim()) {
      driver.notes = [driver.notes, note.trim()].filter(Boolean).join(" · ");
    }
    return driver;
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
    if (driver.rating_count >= 3 && driver.rating_avg < 3.5) {
      driver.is_active = false;
      driver.is_online = false;
      driver.suspended_at = new Date().toISOString();
      driver.suspend_reason = `Auto-suspended: rating ${driver.rating_avg} after ${driver.rating_count} trips`;
    }

    return rating;
  },

  rateCustomer(
    jobId: string,
    driverId: string,
    stars: number,
    comment?: string,
  ): JobWithDriver {
    const job = store().jobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Job not found");
    if (job.driver_id !== driverId) throw new Error("Not your trip.");
    if (job.status !== "completed") throw new Error("Trip must be completed first.");
    if (job.customer_rating_stars != null) {
      throw new Error("You already rated this customer.");
    }
    if (stars < 1 || stars > 5) throw new Error("Stars must be 1–5");
    job.customer_rating_stars = stars;
    job.customer_rating_comment = comment?.trim() || null;
    job.customer_rated_at = new Date().toISOString();
    job.updated_at = job.customer_rated_at;
    return withDriver(job);
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

  createShop(input: NewShopInput & { referral_code?: string | null; referred_by_shop_id?: string | null }): Shop {
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
      referral_code:
        input.referral_code ??
        `${input.name.slice(0, 4).toUpperCase()}${Math.random().toString(36).slice(2, 5)}`,
      referred_by_shop_id: input.referred_by_shop_id ?? null,
    };
    store().shops.unshift(shop);
    return shop;
  },

  findShopByReferralCode(code: string): Shop | null {
    const needle = code.trim().toUpperCase();
    if (!needle) return null;
    return (
      store().shops.find(
        (s) => (s.referral_code ?? "").toUpperCase() === needle,
      ) ?? null
    );
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

    const fare = calculateFare({
      vehicle: required,
      serviceType: "delivery",
      pickup:
        shop.lat != null && shop.lng != null
          ? { lat: shop.lat, lng: shop.lng }
          : null,
      dropoff:
        input.dropoff_lat != null && input.dropoff_lng != null
          ? { lat: input.dropoff_lat, lng: input.dropoff_lng }
          : null,
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
      fee_amount: fare.fee_amount,
      shop_id: shop.id,
      product_summary: `${product.name} (${product.price})`,
      dispatcher_notes: `Shop order from ${shop.name} · paid with ${
        input.payment.method === "cash" ? "cash" : "PayPal"
      }`,
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

  listOpenGroupTrips(): GroupTrip[] {
    return store()
      .groupTrips.filter((t) => t.status === "open" || t.status === "full")
      .map((t) => withGroupTrip(t))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  getGroupTrip(id: string): GroupTrip | null {
    const t = store().groupTrips.find((x) => x.id === id);
    return t ? withGroupTrip(t) : null;
  },

  listDriverGroupTrips(driverId: string): GroupTrip[] {
    return store()
      .groupTrips.filter((t) => t.driver_id === driverId)
      .map((t) => withGroupTrip(t))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  createGroupTrip(input: CreateGroupTripInput): GroupTrip {
    const capacity = Math.max(1, Math.min(40, Math.floor(input.capacity)));
    const price = Math.max(0, Number(input.price_per_person) || 0);
    const trip: GroupTrip = {
      id: uid(),
      driver_id: input.driver_id,
      kind: input.kind,
      title: input.title?.trim() || null,
      route_pickup: input.route_pickup.trim(),
      route_dropoff: input.route_dropoff.trim(),
      route_stops: (input.route_stops ?? []).map((s) => s.trim()).filter(Boolean),
      capacity,
      seats_taken: 0,
      status: "open",
      price_per_person: price,
      total_price: price * capacity,
      country_code: input.country_code || DEFAULT_COUNTRY,
      departs_at: input.departs_at ?? null,
      created_at: new Date().toISOString(),
    };
    store().groupTrips.unshift(trip);
    return withGroupTrip(trip);
  },

  joinGroupTrip(input: JoinGroupTripInput): GroupTrip {
    const trip = store().groupTrips.find((t) => t.id === input.group_trip_id);
    if (!trip) throw new Error("Group trip not found");
    if (trip.status !== "open") throw new Error("This group is full or closed");
    const seats = Math.max(1, Math.min(10, Math.floor(input.seats ?? 1)));
    if (trip.seats_taken + seats > trip.capacity) {
      throw new Error("Not enough spots left");
    }
    const participant: GroupTripParticipant = {
      id: uid(),
      group_trip_id: trip.id,
      guest_name: input.guest_name.trim(),
      guest_phone: input.guest_phone.trim(),
      seats,
      amount_due: Number(trip.price_per_person) * seats,
      status: "confirmed",
      joined_at: new Date().toISOString(),
    };
    store().groupParticipants.push(participant);
    trip.seats_taken += seats;
    if (trip.seats_taken >= trip.capacity) trip.status = "full";
    return withGroupTrip(trip);
  },

  searchCommunityLocations(
    query: string,
    countryCode: string,
    limit: number,
  ): CommunityLocation[] {
    const q = query.trim().toLowerCase();
    let list = store().communityLocations.filter(
      (l) => l.country_code === countryCode,
    );
    if (q) {
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.village.toLowerCase().includes(q) ||
          (l.description ?? "").toLowerCase().includes(q),
      );
    }
    return list
      .slice()
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  },

  findSimilarLocations(
    name: string,
    village: string,
    countryCode: string,
  ): CommunityLocation[] {
    const n = name.trim().toLowerCase();
    const v = village.trim().toLowerCase();
    return store().communityLocations.filter(
      (l) =>
        l.country_code === countryCode &&
        l.name.toLowerCase().includes(n) &&
        l.village.toLowerCase().includes(v),
    );
  },

  createCommunityLocation(input: CreateLocationInput): CommunityLocation {
    const loc: CommunityLocation = {
      id: uid(),
      name: input.name.trim(),
      category: input.category,
      description: input.description?.trim() || null,
      village: input.village.trim(),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      country_code: input.country_code || DEFAULT_COUNTRY,
      created_by_phone: input.created_by_phone?.trim() || null,
      created_by_name: input.created_by_name?.trim() || null,
      shop_id: input.shop_id ?? null,
      is_verified: Boolean(input.shop_id),
      usage_count: 0,
      created_at: new Date().toISOString(),
    };
    store().communityLocations.unshift(loc);
    return loc;
  },

  bumpLocationUsage(locationId: string) {
    const loc = store().communityLocations.find((l) => l.id === locationId);
    if (loc) loc.usage_count += 1;
  },

  listSavedLocations(guestPhone: string): SavedLocation[] {
    return store()
      .savedLocations.filter((s) => s.guest_phone === guestPhone)
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  savePersonalLocation(input: SavePersonalLocationInput): SavedLocation {
    const row: SavedLocation = {
      id: uid(),
      guest_phone: input.guest_phone.trim(),
      name: input.name.trim(),
      label: input.label?.trim() || input.name.trim(),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      location_id: input.location_id ?? null,
      is_home: Boolean(input.is_home),
      is_work: Boolean(input.is_work),
      is_farm: Boolean(input.is_farm),
      country_code: input.country_code || DEFAULT_COUNTRY,
      created_at: new Date().toISOString(),
    };
    store().savedLocations.unshift(row);
    return row;
  },

  deleteSavedLocation(id: string, guestPhone: string) {
    store().savedLocations = store().savedLocations.filter(
      (s) => !(s.id === id && s.guest_phone === guestPhone),
    );
  },

  createFuelRequest(input: CreateFuelRequestInput): FuelRequest {
    const open = store().fuelRequests.find(
      (r) =>
        r.requester_driver_id === input.driver_id &&
        (r.status === "pending" || r.status === "assigned"),
    );
    if (open) throw new Error("You already have an open fuel request.");
    const now = new Date().toISOString();
    const row: FuelRequest = {
      id: uid(),
      requester_driver_id: input.driver_id,
      helper_driver_id: null,
      location_lat: input.location_lat ?? null,
      location_lng: input.location_lng ?? null,
      location_landmark: input.location_landmark?.trim() || null,
      fuel_amount: input.fuel_amount,
      status: "pending",
      payment_method: input.payment_method === "card" ? "card" : "cash",
      payment_note: "Pay the helper in cash for fuel + small tip if agreed.",
      country_code: input.country_code || DEFAULT_COUNTRY,
      assigned_at: null,
      delivered_at: null,
      created_at: now,
      updated_at: now,
    };
    store().fuelRequests.unshift(row);
    return row;
  },

  listMyFuelRequest(driverId: string): FuelRequest | null {
    return (
      store().fuelRequests.find(
        (r) =>
          r.requester_driver_id === driverId &&
          (r.status === "pending" || r.status === "assigned"),
      ) ?? null
    );
  },

  listNearbyFuelHelp(
    helperDriverId: string,
    lat?: number | null,
    lng?: number | null,
  ): FuelRequest[] {
    const rows = store().fuelRequests.filter(
      (r) =>
        r.status === "pending" && r.requester_driver_id !== helperDriverId,
    );
    if (lat == null || lng == null) return rows.slice(0, 10);
    const origin = { lat, lng };
    return rows
      .filter((r) => {
        if (r.location_lat == null || r.location_lng == null) return true;
        return (
          distanceKm(origin, {
            lat: r.location_lat,
            lng: r.location_lng,
          }) <= 25
        );
      })
      .slice(0, 10);
  },

  acceptFuelHelp(requestId: string, helperDriverId: string): FuelRequest {
    const row = store().fuelRequests.find((r) => r.id === requestId);
    if (!row || row.status !== "pending") {
      throw new Error("Request already taken or cancelled.");
    }
    const now = new Date().toISOString();
    row.helper_driver_id = helperDriverId;
    row.status = "assigned";
    row.assigned_at = now;
    row.updated_at = now;
    return row;
  },

  markFuelDelivered(requestId: string, driverId: string): FuelRequest {
    const row = store().fuelRequests.find((r) => r.id === requestId);
    if (!row) throw new Error("Request not found.");
    if (
      row.requester_driver_id !== driverId &&
      row.helper_driver_id !== driverId
    ) {
      throw new Error("Not your fuel request.");
    }
    if (row.status !== "assigned") throw new Error("Request is not in delivery.");
    const now = new Date().toISOString();
    row.status = "delivered";
    row.delivered_at = now;
    row.updated_at = now;
    return row;
  },

  cancelFuelRequest(requestId: string, driverId: string) {
    const row = store().fuelRequests.find((r) => r.id === requestId);
    if (!row) throw new Error("Request not found.");
    if (row.requester_driver_id !== driverId) {
      throw new Error("Only the stranded driver can cancel.");
    }
    if (row.status === "delivered") throw new Error("Already delivered.");
    row.status = "cancelled";
    row.updated_at = new Date().toISOString();
  },

  listOpenFuelRequests(): FuelRequest[] {
    return store().fuelRequests.filter(
      (r) => r.status === "pending" || r.status === "assigned",
    );
  },

  setDriverHomeCity(driverId: string, city: string): Driver {
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");
    const homeCity = normalizeHomeCity(city);
    if (!homeCity) throw new Error("Choose a valid home city.");
    driver.home_city = homeCity;
    return driver;
  },

  processFoundingBonusOnComplete(
    driverId: string,
    feeCents: number,
    monthYear: string,
  ) {
    const driver = store().drivers.find((d) => d.id === driverId);
    if (!driver) return;

    if (!driver.home_city) {
      const fromNotes = driver.notes?.match(/Area:\s*([^·]+)/i)?.[1];
      const mapped = normalizeHomeCity(fromNotes);
      if (mapped) driver.home_city = mapped;
    }

    const completedBefore = store().jobs.filter(
      (j) =>
        j.driver_id === driverId &&
        j.status === "completed" &&
        j.id /* already includes current */,
    ).length;

    if (
      !driver.is_founding_driver &&
      isWithinFoundingEra() &&
      completedBefore <= 1
    ) {
      driver.is_founding_driver = true;
      driver.founding_era_qualified_at = new Date().toISOString();
    }

    const city = driver.home_city;
    if (!city || feeCents <= 0) return;

    const rows = store().monthlyCityRevenue;
    let row = rows.find((r) => r.city === city && r.month_year === monthYear);
    if (!row) {
      row = {
        id: uid(),
        city,
        month_year: monthYear,
        total_gross_revenue: 0,
        bonus_pool_amount: 0,
        is_distributed: false,
      };
      rows.push(row);
    }
    if (row.is_distributed) return;
    row.total_gross_revenue += feeCents;
  },

  listCityBonusBoard(monthYear: string) {
    return FOUNDING_CITIES.map((city) => {
      const r = store().monthlyCityRevenue.find(
        (x) => x.city === city && x.month_year === monthYear,
      );
      const gross = r?.total_gross_revenue ?? 0;
      const founding_driver_count = store().drivers.filter(
        (d) =>
          d.is_founding_driver &&
          d.is_active &&
          d.home_city === city,
      ).length;
      return {
        city,
        month_year: monthYear,
        total_gross_revenue_cents: gross,
        bonus_pool_cents: r?.is_distributed
          ? r.bonus_pool_amount
          : Math.floor((gross * 2) / 100),
        is_distributed: Boolean(r?.is_distributed),
        founding_driver_count,
      };
    });
  },

  distributeCityBonus(city: string, monthYear: string) {
    const homeCity = normalizeHomeCity(city) || city;
    let row = store().monthlyCityRevenue.find(
      (r) => r.city === homeCity && r.month_year === monthYear,
    );
    if (!row) {
      throw new Error(`No revenue row for ${homeCity} / ${monthYear}`);
    }
    if (row.is_distributed) {
      throw new Error(`Bonus already distributed for ${homeCity} / ${monthYear}`);
    }
    const drivers = store().drivers.filter(
      (d) =>
        d.is_founding_driver &&
        d.is_active &&
        d.home_city === homeCity,
    );
    if (!drivers.length) {
      throw new Error(`No founding drivers for city ${homeCity}`);
    }
    const pool = Math.floor((row.total_gross_revenue * 2) / 100);
    const each = Math.floor(pool / drivers.length);
    for (const d of drivers) {
      d.accumulated_bonus_balance =
        Number(d.accumulated_bonus_balance ?? 0) + each;
    }
    row.bonus_pool_amount = pool;
    row.is_distributed = true;
    return {
      city: homeCity,
      month_year: monthYear,
      bonus_pool_cents: pool,
      founding_driver_count: drivers.length,
      bonus_each_cents: each,
    };
  },
};
