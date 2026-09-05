import "server-only";

import { createClient } from "@/lib/supabase/server";
import { VEHICLE_STATUSES } from "@/lib/constants";
import type {
  Customer,
  Maintenance,
  Rental,
  Vehicle,
  VehicleIssue,
  VehicleStatus,
} from "@/types/database.types";

export interface VehicleListFilters {
  search?: string;
  status?: VehicleStatus | "all";
  showArchived?: boolean;
}

export interface VehiclePhotoWithUrl {
  id: string;
  storage_path: string;
  created_at: string;
  url: string;
}

const PHOTO_BUCKET = "vehicle-photos";

/** Fleet-wide counts by status, for the dashboard status cards. Archived vehicles excluded. */
export async function getVehicleStatusCounts(): Promise<Record<VehicleStatus, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("vehicle_status")
    .is("archived_at", null);

  const counts = Object.fromEntries(
    VEHICLE_STATUSES.map((status) => [status, 0])
  ) as Record<VehicleStatus, number>;

  if (error || !data) return counts;

  for (const row of data as Pick<Vehicle, "vehicle_status">[]) {
    counts[row.vehicle_status] += 1;
  }
  return counts;
}

export async function listVehicles(filters: VehicleListFilters): Promise<Vehicle[]> {
  const supabase = await createClient();
  let query = supabase.from("vehicles").select("*");

  if (!filters.showArchived) {
    query = query.is("archived_at", null);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("vehicle_status", filters.status);
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, "");
    query = query.or(
      `license_plate.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%`
    );
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data as Vehicle[];
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
  return data as Vehicle | null;
}

export async function getVehiclePhotos(vehicleId: string): Promise<VehiclePhotoWithUrl[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_photos")
    .select("id, storage_path, created_at")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((photo) => ({
    ...photo,
    url: supabase.storage.from(PHOTO_BUCKET).getPublicUrl(photo.storage_path).data.publicUrl,
  }));
}

export interface CurrentRentalInfo extends Rental {
  customer: Pick<Customer, "id" | "customer_number" | "first_name" | "last_name" | "primary_phone"> | null;
}

export interface RentalHistoryRow extends Rental {
  customer: Pick<Customer, "id" | "first_name" | "last_name"> | null;
}

export interface VehicleProfile {
  vehicle: Vehicle;
  photos: VehiclePhotoWithUrl[];
  currentRental: CurrentRentalInfo | null;
  pendingReservation: CurrentRentalInfo | null;
  totalRentals: number;
  lifetimeRevenue: number;
  rentalHistory: RentalHistoryRow[];
  maintenanceHistory: Maintenance[];
  issueHistory: VehicleIssue[];
}

/** Everything the vehicle profile page needs, in parallel. */
export async function getVehicleProfile(id: string): Promise<VehicleProfile | null> {
  const supabase = await createClient();

  const vehicle = await getVehicle(id);
  if (!vehicle) return null;

  const [
    photos,
    currentRentalResult,
    pendingReservationResult,
    rentalHistoryResult,
    maintenanceHistoryResult,
    issueHistoryResult,
  ] = await Promise.all([
    getVehiclePhotos(id),
    supabase
      .from("rentals")
      .select("*, customer:customers(id, customer_number, first_name, last_name, primary_phone)")
      .eq("vehicle_id", id)
      .in("rental_status", ["active", "overdue"])
      .order("rental_start_datetime", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rentals")
      .select("*, customer:customers(id, customer_number, first_name, last_name, primary_phone)")
      .eq("vehicle_id", id)
      .eq("rental_status", "reserved")
      .order("rental_start_datetime", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rentals")
      .select("*, customer:customers(id, first_name, last_name)")
      .eq("vehicle_id", id)
      .order("rental_start_datetime", { ascending: false }),
    supabase
      .from("maintenance")
      .select("*")
      .eq("vehicle_id", id)
      .order("service_date", { ascending: false }),
    supabase
      .from("vehicle_issues")
      .select("*")
      .eq("vehicle_id", id)
      .order("reported_date", { ascending: false }),
  ]);

  if (currentRentalResult.error) throw currentRentalResult.error;
  if (pendingReservationResult.error) throw pendingReservationResult.error;
  if (rentalHistoryResult.error) throw rentalHistoryResult.error;
  if (maintenanceHistoryResult.error) throw maintenanceHistoryResult.error;
  if (issueHistoryResult.error) throw issueHistoryResult.error;

  const rentalHistory = (rentalHistoryResult.data ?? []) as unknown as RentalHistoryRow[];
  const lifetimeRevenue = rentalHistory.reduce(
    (sum, rental) => sum + (rental.amount_paid ?? 0),
    0
  );

  return {
    vehicle,
    photos,
    currentRental: (currentRentalResult.data as unknown as CurrentRentalInfo | null) ?? null,
    pendingReservation: (pendingReservationResult.data as unknown as CurrentRentalInfo | null) ?? null,
    totalRentals: rentalHistory.length,
    lifetimeRevenue,
    rentalHistory,
    maintenanceHistory: (maintenanceHistoryResult.data ?? []) as Maintenance[],
    issueHistory: (issueHistoryResult.data ?? []) as VehicleIssue[],
  };
}

export async function isLicensePlateTaken(
  licensePlate: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .ilike("license_plate", licensePlate);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
}
