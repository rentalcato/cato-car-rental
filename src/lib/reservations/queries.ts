import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { RentalListRow } from "@/lib/rentals/queries";
import type { Customer } from "@/types/database.types";

export interface ReservationRow extends Omit<RentalListRow, "customer"> {
  // Includes `status` (unlike RentalListRow's customer pick) so the
  // Check-In dialog can show the blacklist-override warning inline.
  customer: Pick<Customer, "id" | "customer_number" | "first_name" | "last_name" | "status"> | null;
}

/** Upcoming bookings — `rentals` rows still in the 'reserved' state. */
export async function listReservations(): Promise<ReservationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rentals")
    .select(
      "*, customer:customers(id, customer_number, first_name, last_name, status), vehicle:vehicles(license_plate, make, model)"
    )
    .eq("rental_status", "reserved")
    .order("rental_start_datetime", { ascending: true });

  if (error) throw error;
  return data as unknown as ReservationRow[];
}
