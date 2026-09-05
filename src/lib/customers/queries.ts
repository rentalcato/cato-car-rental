import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCustomerDocuments } from "@/lib/customers/documents";
import { getCustomerPhotoUrl } from "@/lib/customers/photo";
import type {
  Customer,
  CustomerDocument,
  CustomerStatus,
  Payment,
  Rental,
  Vehicle,
  VehicleIssue,
} from "@/types/database.types";

export interface CustomerListFilters {
  search?: string;
  status?: CustomerStatus | "all";
  showInactive?: boolean;
}

export async function listCustomers(filters: CustomerListFilters): Promise<Customer[]> {
  const supabase = await createClient();
  let query = supabase.from("customers").select("*");

  if (!filters.showInactive) {
    query = query.neq("status", "inactive");
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, "");
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,primary_phone.ilike.%${term}%,secondary_phone.ilike.%${term}%,drivers_license_number.ilike.%${term}%,identification_number.ilike.%${term}%,customer_number.ilike.%${term}%`
    );
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data as Customer[];
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  return data as Customer | null;
}

export async function isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .ilike("email", email);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
}

export interface DuplicateCheckInput {
  email?: string;
  primary_phone?: string;
  drivers_license_number?: string;
  identification_number?: string;
}

/** Possible-match lookup for the "duplicate customer" warning on create. */
export async function findPossibleDuplicates(
  input: DuplicateCheckInput,
  excludeId?: string
): Promise<Customer[]> {
  // Strip PostgREST or-filter metacharacters — commas separate
  // conditions and parentheses group them, so an unescaped phone number
  // like "(876) 555-1234" would otherwise corrupt the filter string.
  const clean = (value: string) => value.trim().replace(/[%,()]/g, "");
  const conditions: string[] = [];

  if (input.email?.trim()) conditions.push(`email.ilike.${clean(input.email)}`);
  if (input.primary_phone?.trim()) conditions.push(`primary_phone.eq.${clean(input.primary_phone)}`);
  if (input.drivers_license_number?.trim()) {
    conditions.push(`drivers_license_number.ilike.${clean(input.drivers_license_number)}`);
  }
  if (input.identification_number?.trim()) {
    conditions.push(`identification_number.ilike.${clean(input.identification_number)}`);
  }

  if (conditions.length === 0) return [];

  const supabase = await createClient();
  let query = supabase.from("customers").select("*").or(conditions.join(","));
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query.limit(5);
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export interface CustomerRentalRow extends Rental {
  vehicle: Pick<Vehicle, "license_plate" | "make" | "model"> | null;
}

export interface CustomerIncidentRow extends VehicleIssue {
  vehicle: Pick<Vehicle, "license_plate" | "make" | "model"> | null;
  rental: Pick<Rental, "rental_number"> | null;
}

export interface VehicleRentedSummary {
  vehicleId: string;
  licensePlate: string;
  make: string | null;
  model: string | null;
}

export interface CustomerProfile {
  customer: Customer;
  photoUrl: string | null;
  documents: CustomerDocument[];
  currentRental: CustomerRentalRow | null;
  rentalHistory: CustomerRentalRow[];
  vehiclesRented: VehicleRentedSummary[];
  totalRentals: number;
  lifetimeSpend: number;
  balanceOutstanding: number;
  depositsHeld: number;
  paymentHistory: Payment[];
  incidentHistory: CustomerIncidentRow[];
}

/** Everything the customer profile screen needs, in parallel. */
export async function getCustomerProfile(id: string): Promise<CustomerProfile | null> {
  const supabase = await createClient();

  const customer = await getCustomer(id);
  if (!customer) return null;

  const [rentalsResult, paymentsResult, documents, photoUrl] = await Promise.all([
    supabase
      .from("rentals")
      .select("*, vehicle:vehicles(license_plate, make, model)")
      .eq("customer_id", id)
      .order("rental_start_datetime", { ascending: false }),
    supabase
      .from("payments")
      .select("*")
      .eq("customer_id", id)
      .order("payment_date", { ascending: false }),
    getCustomerDocuments(id),
    getCustomerPhotoUrl(customer.photo_storage_path),
  ]);

  if (rentalsResult.error) throw rentalsResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const rentalHistory = (rentalsResult.data ?? []) as unknown as CustomerRentalRow[];
  const rentalIds = rentalHistory.map((rental) => rental.id);

  let incidentHistory: unknown[] = [];
  if (rentalIds.length) {
    const issuesResult = await supabase
      .from("vehicle_issues")
      .select("*, vehicle:vehicles(license_plate, make, model), rental:rentals(rental_number)")
      .in("rental_id", rentalIds)
      .order("reported_date", { ascending: false });
    if (issuesResult.error) throw issuesResult.error;
    incidentHistory = issuesResult.data ?? [];
  }

  const currentRental =
    rentalHistory.find((rental) => rental.rental_status === "active" || rental.rental_status === "overdue") ??
    null;

  const lifetimeSpend = rentalHistory.reduce((sum, rental) => sum + (rental.amount_paid ?? 0), 0);

  const openRentals = rentalHistory.filter(
    (rental) => rental.rental_status === "active" || rental.rental_status === "overdue"
  );
  const balanceOutstanding = openRentals.reduce((sum, rental) => sum + (rental.balance_due ?? 0), 0);
  const depositsHeld = openRentals.reduce((sum, rental) => sum + (rental.deposit_amount ?? 0), 0);

  const vehiclesRented: VehicleRentedSummary[] = [];
  const seenVehicles = new Set<string>();
  for (const rental of rentalHistory) {
    if (seenVehicles.has(rental.vehicle_id)) continue;
    seenVehicles.add(rental.vehicle_id);
    vehiclesRented.push({
      vehicleId: rental.vehicle_id,
      licensePlate: rental.vehicle?.license_plate ?? "—",
      make: rental.vehicle?.make ?? null,
      model: rental.vehicle?.model ?? null,
    });
  }

  return {
    customer,
    photoUrl,
    documents,
    currentRental,
    rentalHistory,
    vehiclesRented,
    totalRentals: rentalHistory.length,
    lifetimeSpend,
    balanceOutstanding,
    depositsHeld,
    paymentHistory: (paymentsResult.data ?? []) as Payment[],
    incidentHistory: incidentHistory as unknown as CustomerIncidentRow[],
  };
}
