import "server-only";

import { getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getVehiclePhotos, type VehiclePhotoWithUrl } from "@/lib/vehicles/queries";
import type { Customer, Payment, Profile, Rental, Vehicle, VehicleIssue } from "@/types/database.types";

export interface MyAccount {
  profile: Profile;
  customer: Customer | null;
}

/**
 * The signed-in user's own profile, plus their linked customers record
 * (0014 migration) if staff have connected one — null otherwise. Reads
 * customers via customers_select_own (RLS), not the staff-only policy.
 */
export async function getMyAccount(): Promise<MyAccount | null> {
  const current = await getCurrentUser();
  if (!current) return null;

  const supabase = await createClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("profile_id", current.id)
    .maybeSingle();
  if (error) throw error;

  return { profile: current.profile, customer: (customer as Customer | null) ?? null };
}

export interface MyBookingRow extends Rental {
  vehicle: Pick<Vehicle, "license_plate" | "make" | "model"> | null;
}

/** Empty if the account isn't linked to a customers record yet. */
export async function getMyBookings(customerId: string | undefined): Promise<MyBookingRow[]> {
  if (!customerId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rentals")
    .select("*, vehicle:vehicles(license_plate, make, model)")
    .eq("customer_id", customerId)
    .order("rental_start_datetime", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as MyBookingRow[];
}

/**
 * The one pending (awaiting-approval) reservation this customer has, if
 * any — a customer may only ever have one at a time (create_reservation,
 * 0024, enforces this at the database layer too, so this is a UI-level
 * mirror of that rule, not the only place it's checked). Null when
 * there isn't one — either because they have none, or their existing
 * reservation has already moved past "pending" (approved/denied/
 * cancelled/completed).
 */
export async function getMyPendingReservation(customerId: string | undefined): Promise<MyBookingRow | null> {
  if (!customerId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rentals")
    .select("*, vehicle:vehicles(license_plate, make, model)")
    .eq("customer_id", customerId)
    .eq("rental_status", "reserved")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as MyBookingRow | null) ?? null;
}

/** Empty if the account isn't linked to a customers record yet — reads via payments_select_own (0018). */
export async function getMyPayments(customerId: string | undefined): Promise<Payment[]> {
  if (!customerId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("customer_id", customerId)
    .order("payment_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Payment[];
}

export interface MyBookingDetail extends Rental {
  vehicle: Vehicle | null;
  photos: VehiclePhotoWithUrl[];
  payments: Payment[];
  issues: VehicleIssue[];
}

/**
 * Everything the booking detail screen (/account/rentals/[id]) needs, in
 * one call. Scoped to the caller's own customer_id up front — never
 * trusts rentalId alone — same belt-and-suspenders as
 * getMyDocumentAccessUrl(): RLS (rentals_select_own, 0014) would already
 * block a foreign booking, this just returns a clean null instead of an
 * empty-looking page.
 */
export async function getMyBookingById(
  customerId: string | undefined,
  rentalId: string
): Promise<MyBookingDetail | null> {
  if (!customerId) return null;

  const supabase = await createClient();
  const { data: rental, error } = await supabase
    .from("rentals")
    .select("*")
    .eq("id", rentalId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) throw error;
  if (!rental) return null;

  const [{ data: vehicle }, photos, { data: payments }, { data: issues }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", (rental as Rental).vehicle_id).maybeSingle(),
    getVehiclePhotos((rental as Rental).vehicle_id),
    supabase
      .from("payments")
      .select("*")
      .eq("rental_id", rentalId)
      .order("payment_date", { ascending: false }),
    supabase
      .from("vehicle_issues")
      .select("*")
      .eq("rental_id", rentalId)
      .order("reported_date", { ascending: false }),
  ]);

  return {
    ...(rental as Rental),
    vehicle: (vehicle as Vehicle | null) ?? null,
    photos,
    payments: (payments as Payment[] | null) ?? [],
    issues: (issues as VehicleIssue[] | null) ?? [],
  };
}
