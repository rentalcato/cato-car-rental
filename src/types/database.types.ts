/**
 * Hand-written types matching supabase/migrations/0001_schema.sql.
 *
 * Once the schema stabilises, replace this file by generating real types:
 *   npx supabase gen types typescript --project-id <your-project-ref> > src/types/database.types.ts
 *
 * These are declared as `type` (not `interface`) on purpose: interfaces
 * don't get TypeScript's implicit index signature, so they fail the
 * `Record<string, unknown>` check inside @supabase/postgrest-js's
 * `GenericTable` constraint and every table silently resolves to `never`.
 */
import type {
  CUSTOMER_STATUSES,
  DOCUMENT_TYPES,
  FUEL_TYPES,
  ISSUE_SEVERITIES,
  ISSUE_STATUSES,
  PAYMENT_METHODS,
  RENTAL_STATUSES,
  USER_ROLES,
  VEHICLE_STATUSES,
} from "@/lib/constants";

export type UserRole = (typeof USER_ROLES)[number];
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];
export type RentalStatus = (typeof RENTAL_STATUSES)[number];
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Vehicle = {
  id: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  colour: string | null;
  vin: string | null;
  daily_rental_rate: number | null;
  current_mileage: number | null;
  fuel_type: FuelType | null;
  vehicle_status: VehicleStatus;
  notes: string | null;
  date_added: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VehiclePhoto = {
  id: string;
  vehicle_id: string;
  storage_path: string;
  created_at: string;
};

export type Customer = {
  id: string;
  customer_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  email: string | null;
  primary_phone: string | null;
  secondary_phone: string | null;
  address: string | null;
  city_parish: string | null;
  country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  drivers_license_number: string | null;
  drivers_license_issuing_country: string | null;
  drivers_license_issue_date: string | null;
  drivers_license_expiry: string | null;
  identification_type: string | null;
  identification_number: string | null;
  passport_number: string | null;
  photo_storage_path: string | null;
  status: CustomerStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerDocument = {
  id: string;
  customer_id: string;
  document_type: DocumentType;
  file_name: string;
  storage_path: string;
  uploaded_by: string | null;
  uploaded_at: string;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type Rental = {
  id: string;
  rental_number: string;
  vehicle_id: string;
  customer_id: string;
  rental_start_datetime: string | null;
  rental_duration_days: number | null;
  expected_return_datetime: string | null;
  actual_return_datetime: string | null;
  daily_rate: number | null;
  subtotal: number | null;
  discount: number;
  late_fee: number;
  additional_charges: number;
  total_amount: number | null;
  amount_paid: number;
  balance_due: number | null;
  deposit_amount: number;
  rental_status: RentalStatus;
  checkout_mileage: number | null;
  return_mileage: number | null;
  checkout_fuel_level: string | null;
  return_fuel_level: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  rental_id: string;
  customer_id: string;
  payment_amount: number;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  payment_date: string;
  notes: string | null;
  received_by: string | null;
  created_at: string;
};

export type VehicleIssue = {
  id: string;
  vehicle_id: string;
  rental_id: string | null;
  issue_type: string | null;
  description: string | null;
  severity: IssueSeverity | null;
  reported_date: string;
  resolved_date: string | null;
  repair_cost: number | null;
  status: IssueStatus;
  reported_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Maintenance = {
  id: string;
  vehicle_id: string;
  maintenance_type: string | null;
  description: string | null;
  service_date: string | null;
  next_service_date: string | null;
  mileage_at_service: number | null;
  next_service_mileage: number | null;
  cost: number | null;
  service_provider: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AppSettings = {
  id: number;
  business_name: string | null;
  logo_storage_path: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  timezone: string;
  tax_rate: number;
  default_daily_rate: number | null;
  grace_period_hours: number;
  late_fee_per_day: number;
  default_security_deposit: number;
  mileage_limit_per_day: number | null;
  mileage_overage_fee: number | null;
  fuel_policy: string | null;
  updated_at: string;
};

/**
 * Minimal Database shape so `createClient<Database>()` type-checks.
 * `Relationships: []` + empty `Views`/`Functions` are required to satisfy
 * @supabase/postgrest-js's `GenericSchema` constraint — without them the
 * generic silently resolves table types to `never`. Embedded
 * relationship selects (e.g. `rentals.select("*, customer:customers(...)")`)
 * are typed by hand at the call site instead of modelled here.
 */
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
type Fn<Args, Returns> = { Args: Args; Returns: Returns };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      vehicles: Table<Vehicle>;
      vehicle_photos: Table<VehiclePhoto>;
      customers: Table<Customer>;
      customer_documents: Table<CustomerDocument>;
      audit_logs: Table<AuditLog>;
      rentals: Table<Rental>;
      payments: Table<Payment>;
      vehicle_issues: Table<VehicleIssue>;
      maintenance: Table<Maintenance>;
      app_settings: Table<AppSettings>;
    };
    Views: Record<string, never>;
    Functions: {
      /** SECURITY DEFINER — see supabase/migrations/0006_phase3_customer_rental_management.sql */
      checkout_rental: Fn<
        {
          p_customer_id: string;
          p_vehicle_id: string;
          p_rental_start: string;
          p_duration_days: number;
          p_deposit_amount?: number;
          p_payment_amount?: number;
          p_payment_method?: PaymentMethod | null;
          p_payment_reference?: string | null;
          p_notes?: string | null;
          p_override_blacklist?: boolean;
        },
        string
      >;
      /** SECURITY DEFINER — manager+ only, enforced inside the function. */
      set_customer_status: Fn<
        { p_customer_id: string; p_status: CustomerStatus; p_reason?: string | null },
        void
      >;
      /** SECURITY DEFINER — see supabase/migrations/0007_reservations.sql */
      create_reservation: Fn<
        {
          p_customer_id: string;
          p_vehicle_id: string;
          p_rental_start: string;
          p_duration_days: number;
          p_deposit_amount?: number;
          p_notes?: string | null;
          p_override_blacklist?: boolean;
        },
        string
      >;
      activate_reservation: Fn<
        {
          p_rental_id: string;
          p_payment_amount?: number;
          p_payment_method?: PaymentMethod | null;
          p_payment_reference?: string | null;
          p_override_blacklist?: boolean;
        },
        void
      >;
      cancel_reservation: Fn<{ p_rental_id: string; p_reason?: string | null }, void>;
      /** SECURITY DEFINER — see supabase/migrations/0008_rental_completion_and_fixes.sql */
      complete_rental: Fn<
        {
          p_rental_id: string;
          p_actual_return?: string;
          p_return_mileage?: number | null;
          p_return_fuel_level?: string | null;
          p_late_fee?: number | null;
          p_additional_charges?: number | null;
          p_payment_amount?: number;
          p_payment_method?: PaymentMethod | null;
          p_payment_reference?: string | null;
          p_notes?: string | null;
        },
        void
      >;
      /** SECURITY DEFINER — see supabase/migrations/0009_payments_module.sql */
      record_payment: Fn<
        {
          p_rental_id: string;
          p_amount: number;
          p_payment_method?: PaymentMethod | null;
          p_payment_reference?: string | null;
          p_notes?: string | null;
        },
        string
      >;
    };
  };
};
