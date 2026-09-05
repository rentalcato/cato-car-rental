import "server-only";

import { getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { Customer, Profile, Rental, Vehicle } from "@/types/database.types";

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
