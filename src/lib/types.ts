export type ServiceType = "ride" | "delivery" | "farm";
export type VehicleType = "sedan" | "bakkie" | "truck";
export type JobStatus =
  | "new"
  | "assigned"
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
};

export type NewDriverApplicationInput = {
  full_name: string;
  phone: string;
  vehicle_type: VehicleType;
  /** Town / village they cover */
  area: string;
  /** Licence / bakkie details for ops review */
  notes?: string;
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
