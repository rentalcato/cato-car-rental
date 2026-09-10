import "server-only";

import { createClient } from "@/lib/supabase/server";
import { BODY_TYPE_LABELS, TRANSMISSION_LABELS } from "@/lib/vehicles/labels";
import { assignFallbackImage } from "@/lib/marketing/queries";
import type { CustomerFavorite, Vehicle, VehiclePhoto } from "@/types/database.types";

const VEHICLE_PHOTO_BUCKET = "vehicle-photos";

/** Just the vehicle ids — cheap enough to fetch on every fleet/detail page to drive a heart toggle's initial state. */
export async function getMyFavoriteVehicleIds(customerId: string | undefined): Promise<Set<string>> {
  if (!customerId) return new Set();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_favorites")
    .select("vehicle_id")
    .eq("customer_id", customerId);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.vehicle_id));
}

export interface FavoriteVehicleCard {
  favoriteId: string;
  savedAt: string;
  vehicleId: string;
  make: string;
  model: string;
  year: number | null;
  category: string;
  seats: number;
  transmission: string;
  dailyRate: number | null;
  imageUrl: string;
  /** The vehicle's live status — a favorite can point at something no longer bookable right now. */
  isBookable: boolean;
}

/**
 * A favorited vehicle can have drifted out of public_vehicle_listings
 * (rented by someone else, in for maintenance, archived) — reads the real
 * `vehicles`/`vehicle_photos` tables instead, scoped by
 * vehicles_select_own_favorite / vehicle_photos_select_own_favorite
 * (0022), so this still shows something even then.
 */
export async function getMyFavoriteVehicles(customerId: string | undefined): Promise<FavoriteVehicleCard[]> {
  if (!customerId) return [];

  const supabase = await createClient();
  const { data: favorites, error } = await supabase
    .from("customer_favorites")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (favorites ?? []) as CustomerFavorite[];
  if (rows.length === 0) return [];

  const vehicleIds = rows.map((row) => row.vehicle_id);
  const [{ data: vehicles }, { data: photos }] = await Promise.all([
    supabase.from("vehicles").select("*").in("id", vehicleIds),
    supabase.from("vehicle_photos").select("*").in("vehicle_id", vehicleIds).order("created_at", { ascending: true }),
  ]);

  const vehicleById = new Map((vehicles as Vehicle[] | null ?? []).map((v) => [v.id, v]));
  const firstPhotoByVehicle = new Map<string, string>();
  for (const photo of (photos as VehiclePhoto[] | null) ?? []) {
    if (!firstPhotoByVehicle.has(photo.vehicle_id)) {
      firstPhotoByVehicle.set(photo.vehicle_id, photo.storage_path);
    }
  }

  const cards: FavoriteVehicleCard[] = [];
  for (const row of rows) {
    const vehicle = vehicleById.get(row.vehicle_id);
    if (!vehicle) continue; // archived/deleted since favoriting — quietly skip rather than showing a broken card

    const photoPath = firstPhotoByVehicle.get(vehicle.id);
    const category = vehicle.body_type
      ? BODY_TYPE_LABELS[vehicle.body_type]
      : vehicle.fuel_type === "electric"
        ? "Electric"
        : "Sedan / SUV";

    cards.push({
      favoriteId: row.id,
      savedAt: row.created_at,
      vehicleId: vehicle.id,
      make: vehicle.make || "Vehicle",
      model: vehicle.model || "",
      year: vehicle.year,
      category,
      seats: vehicle.seats ?? 5,
      transmission: vehicle.transmission ? TRANSMISSION_LABELS[vehicle.transmission] : "Automatic",
      dailyRate: vehicle.daily_rental_rate,
      imageUrl: photoPath
        ? supabase.storage.from(VEHICLE_PHOTO_BUCKET).getPublicUrl(photoPath).data.publicUrl
        : assignFallbackImage(vehicle.id),
      isBookable: vehicle.vehicle_status === "available" && vehicle.archived_at === null,
    });
  }
  return cards;
}
