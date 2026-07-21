export type ServiceType = "ride" | "delivery" | "farm";
export type VehicleType = "sedan" | "bakkie" | "truck";
export type JobStatus =
  | "new" // legacy — treat as searching_driver
  | "searching_driver"
  | "assigned" // legacy — treat as confirmed
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";
export type PaymentStatus = "unpaid" | "cash_collected" | "paid_online";
export type PaymentMethod = "paypal" | "card" | "wallet" | "cash";
export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

/** Hiring into the platform (not a single trip offer). */
export type DriverApprovalStatus = "pending" | "approved" | "rejected";

export type RideDetails = {
  seats: number;
  route_name: string;
  direction: "to_town" | "to_village";
};

export type DeliveryDetails = {
  item_description: string;
  size: "small" | "medium" | "large" | "xl";
  needs_helpers: boolean;
  /** Who is sending — individual vs local store (ops analytics). */
  sender_type?: "individual" | "business";
};

export type FarmDetails = {
  items: Array<{ name: string; qty: number; price: number }>;
  notes?: string;
  sender_type?: "individual" | "business";
};

export type JobDetails =
  | RideDetails
  | DeliveryDetails
  | FarmDetails
  | Record<string, unknown>;

export type Driver = {
  id: string;
  full_name: string;
  phone: string;
  vehicle_type: VehicleType;
  is_active: boolean;
  approval_status: DriverApprovalStatus;
  id_verified: boolean;
  is_online: boolean;
  last_lat: number | null;
  last_lng: number | null;
  last_location_at: string | null;
  rating_avg: number;
  rating_count: number;
  notes: string | null;
  created_at: string;
  /** Opt-in niches — default true when missing (older rows). */
  prefer_night?: boolean;
  prefer_heavy?: boolean;
  prefer_village_routes?: boolean;
  license_number?: string | null;
  id_doc_url?: string | null;
  license_doc_url?: string | null;
  docs_submitted_at?: string | null;
  /** Smart dispatch reliability metrics */
  offers_received?: number;
  offers_accepted?: number;
  offers_declined?: number;
  /** AI KYC (Phase 2) */
  kyc_status?:
    | "none"
    | "pending"
    | "auto_approved"
    | "needs_review"
    | "rejected"
    | "manual_approved";
  kyc_checked_at?: string | null;
  kyc_name_on_docs?: string | null;
  kyc_id_number?: string | null;
  kyc_license_expiry?: string | null;
  kyc_issues?: string[] | null;
  kyc_raw?: Record<string, unknown> | null;
  /** Firebase Cloud Messaging device token */
  fcm_token?: string | null;
  fcm_updated_at?: string | null;
  /** Prepaid commission wallet (customer pays driver; driver owes platform). */
  wallet_balance?: number;
  /** Debt when wallet is negative (= abs(min(0, wallet_balance))). */
  commission_owed?: number;
  /** Vehicle plate / reg (optional). */
  vehicle_registration?: string | null;
  vehicle_year?: number | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  /** Linked Supabase auth user (when set). */
  user_id?: string | null;
  /** Operating country (ZA default). */
  country_code?: string | null;
  /** Manual trust gate — pending drivers cannot go online. */
  verification_status?: "pending" | "verified" | "rejected" | null;
  verification_note?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  /** Face selfie (storage path). */
  selfie_url?: string | null;
  vehicle_front_url?: string | null;
  vehicle_side_url?: string | null;
  code_of_conduct_accepted_at?: string | null;
  suspended_at?: string | null;
  suspend_reason?: string | null;
};

export type GroupTripKind = "ride" | "goods";
export type GroupTripStatus =
  | "open"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled";

export type GroupTrip = {
  id: string;
  driver_id: string;
  kind: GroupTripKind;
  title: string | null;
  route_pickup: string;
  route_dropoff: string;
  route_stops: string[] | null;
  capacity: number;
  seats_taken: number;
  status: GroupTripStatus;
  price_per_person: number;
  total_price: number;
  country_code: string;
  departs_at: string | null;
  created_at: string;
  drivers?: Driver | null;
  participants?: GroupTripParticipant[];
};

export type GroupTripParticipant = {
  id: string;
  group_trip_id: string;
  guest_name: string;
  guest_phone: string;
  seats: number;
  amount_due: number;
  status: "confirmed" | "pending" | "cancelled";
  joined_at: string;
};

export type CreateGroupTripInput = {
  driver_id: string;
  kind: GroupTripKind;
  title?: string;
  route_pickup: string;
  route_dropoff: string;
  route_stops?: string[];
  capacity: number;
  price_per_person: number;
  country_code?: string;
  departs_at?: string | null;
};

export type JoinGroupTripInput = {
  group_trip_id: string;
  guest_name: string;
  guest_phone: string;
  seats?: number;
};

export type NewDriverApplicationInput = {
  full_name: string;
  phone: string;
  vehicle_type: VehicleType;
  /** Town / village they cover */
  area: string;
  /** Licence / bakkie details for ops review */
  notes?: string;
  country_code?: string;
};

export type Shop = {
  id: string;
  name: string;
  phone: string;
  category: string;
  landmark: string;
  lat: number | null;
  lng: number | null;
  delivers: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  /** Linked Supabase auth user (merchant owner). */
  user_id?: string | null;
  /** businessName.slice(0,4).toUpperCase() + random 3 chars */
  referral_code?: string | null;
  /** Shop that referred this partner */
  referred_by_shop_id?: string | null;
  rating_avg?: number;
  rating_count?: number;
};

export type PartnerNotification = {
  id: string;
  shop_id: string;
  user_id: string | null;
  type:
    | "order_created"
    | "driver_assigned"
    | "order_completed"
    | "weekly_report"
    | "referral"
    | "system";
  title: string;
  body: string;
  email_body: string | null;
  job_id: string | null;
  report_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type PartnerWeeklyReport = {
  id: string;
  shop_id: string;
  week_start: string;
  week_end: string;
  week_key: string;
  orders_total: number;
  orders_completed: number;
  orders_cancelled: number;
  revenue_total: number;
  platform_commission_total: number;
  referral_signups: number;
  summary_text: string;
  email_sent_at: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  size: "small" | "medium" | "large" | "xl";
  in_stock: boolean;
  created_at: string;
};

export type JobApplication = {
  id: string;
  job_id: string;
  driver_id: string;
  status: ApplicationStatus;
  note: string | null;
  created_at: string;
  drivers?: Driver | null;
  jobs?: Job | null;
};

export type Rating = {
  id: string;
  job_id: string;
  driver_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
};

export type Job = {
  id: string;
  reference_code: string;
  service_type: ServiceType;
  status: JobStatus;
  required_vehicle: VehicleType;
  customer_name: string;
  customer_phone: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_landmark: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  dropoff_landmark: string;
  scheduled_for: string | null;
  details: JobDetails;
  fee_amount: number;
  platform_commission?: number;
  driver_payout?: number;
  fee_currency: string;
  /** ISO-like country (ZA, KE, …) — drivers matched within country */
  country_code?: string | null;
  /** Display / settlement currency (usually same as fee_currency) */
  currency?: string | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  card_last4: string | null;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  paid_at: string | null;
  driver_id: string | null;
  assigned_at: string | null;
  dispatcher_notes: string | null;
  shop_id: string | null;
  product_summary: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  driver_location_at: string | null;
  offered_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  share_token?: string | null;
  sos_triggered_at?: string | null;
  sos_note?: string | null;
  /** Driver rated the customer after the trip */
  customer_rating_stars?: number | null;
  customer_rating_comment?: string | null;
  customer_rated_at?: string | null;
  /** Smart dispatch score of assigned driver */
  match_score?: number | null;
  match_breakdown?: Record<string, unknown> | null;
  /** Exclusive timed offer (Uber-style cascade) */
  offered_driver_id?: string | null;
  offer_expires_at?: string | null;
  dispatch_rank?: string[] | null;
  dispatch_index?: number | null;
  customer_fcm_token?: string | null;
  dispatch_attempts?: number | null;
  dispatch_exhausted?: boolean | null;
  created_at: string;
  updated_at: string;
  drivers?: Driver | null;
  shops?: Shop | null;
};

export type JobWithDriver = Job & {
  drivers: Driver | null;
};

export type NewJobInput = {
  service_type: ServiceType;
  required_vehicle: VehicleType;
  customer_name: string;
  customer_phone: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_landmark: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  dropoff_landmark: string;
  scheduled_for?: string | null;
  details: JobDetails;
  fee_amount: number;
  dispatcher_notes?: string | null;
  shop_id?: string | null;
  product_summary?: string | null;
  country_code?: string;
  payment:
    | {
        method: "paypal" | "card";
        paypalOrderId: string;
        paypalCaptureId: string;
      }
    | { method: "cash" };
};

export type NewShopInput = {
  name: string;
  phone: string;
  category: string;
  landmark: string;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
};

/** Shop door registration → creates auth user + merchant role + linked shop. */
export type MerchantRegisterInput = NewShopInput & {
  email: string;
  password: string;
  /** Optional partner referral code from another business */
  referral_code?: string | null;
};

/** Merchant books a delivery from their shop (links shop_id → FCM dispatch). */
export type MerchantDeliveryInput = {
  customer_name: string;
  customer_phone: string;
  dropoff_landmark: string;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  item_description: string;
  size: "small" | "medium" | "large" | "xl";
  needs_helpers?: boolean;
  country_code?: string;
  /** ISO datetime — schedule for later; omit/null = ASAP */
  scheduled_for?: string | null;
};

export type NewProductInput = {
  shop_id: string;
  name: string;
  description?: string | null;
  price: number;
  size: "small" | "medium" | "large" | "xl";
};

export type ShopOrderInput = {
  shop_id: string;
  product_id: string;
  buyer_name: string;
  buyer_phone: string;
  dropoff_landmark: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  payment: {
    method: "paypal";
    paypalOrderId: string;
    paypalCaptureId: string;
  };
};

export type LocationCategory =
  | "shop"
  | "farm"
  | "landmark"
  | "home"
  | "other";

export type CommunityLocation = {
  id: string;
  name: string;
  category: LocationCategory;
  description: string | null;
  village: string;
  latitude: number | null;
  longitude: number | null;
  country_code: string;
  created_by_phone: string | null;
  created_by_name: string | null;
  shop_id: string | null;
  is_verified: boolean;
  usage_count: number;
  created_at: string;
};

export type CreateLocationInput = {
  name: string;
  category: LocationCategory;
  description?: string;
  village: string;
  /** Optional — villages often use description only (no GPS). */
  latitude?: number | null;
  longitude?: number | null;
  country_code?: string;
  created_by_phone?: string;
  created_by_name?: string;
  shop_id?: string | null;
};

export type SavedLocation = {
  id: string;
  guest_phone: string;
  name: string;
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  location_id: string | null;
  is_home: boolean;
  is_work: boolean;
  country_code: string;
  created_at: string;
};

export type SavePersonalLocationInput = {
  guest_phone: string;
  name: string;
  label?: string;
  /** Optional pin — landmark text alone is enough for village trips. */
  latitude?: number | null;
  longitude?: number | null;
  location_id?: string | null;
  is_home?: boolean;
  is_work?: boolean;
  country_code?: string;
};
