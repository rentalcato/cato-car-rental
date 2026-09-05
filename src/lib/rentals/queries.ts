import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Customer, Rental, RentalStatus, Vehicle } from "@/types/database.types";

export interface RentalListFilters {
  search?: string;
  status?: RentalStatus | "all";
}

export interface RentalListRow extends Rental {
  customer: Pick<Customer, "id" | "customer_number" | "first_name" | "last_name"> | null;
  vehicle: Pick<Vehicle, "license_plate" | "make" | "model"> | null;
}

export async function listRentals(filters: RentalListFilters): Promise<RentalListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("rentals")
    .select(
      "*, customer:customers(id, customer_number, first_name, last_name), vehicle:vehicles(license_plate, make, model)"
    );

  if (filters.status && filters.status !== "all") {
    query = query.eq("rental_status", filters.status);
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, "");
    query = query.ilike("rental_number", `%${term}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data as unknown as RentalListRow[];
}

export interface AvailableVehicle {
  id: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  daily_rental_rate: number | null;
}

/** Vehicles a new rental can be checked out against. */
export async function getAvailableVehicles(): Promise<AvailableVehicle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("id, license_plate, make, model, year, daily_rental_rate")
    .eq("vehicle_status", "available")
    .is("archived_at", null)
    .order("license_plate", { ascending: true });

  return (data ?? []) as AvailableVehicle[];
}
