import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { PublicBusinessInfo, PublicVehicleListing } from "@/types/database.types";

const VEHICLE_PHOTO_BUCKET = "vehicle-photos";

export interface FleetCard {
  id: string;
  make: string;
  model: string;
  year: number | null;
  category: string;
  seats: number;
  transmission: string;
  dailyRate: number | null;
  imageUrl: string;
  isDemo: boolean;
}

/**
 * Curated, verified-working stock photography (Unsplash License — free
 * for commercial use) used whenever there's no real fleet data yet, and
 * to fill in a photo for any real vehicle that hasn't had one uploaded.
 * Includes two distinct Mercedes-Benz shots (also used as the hero) so
 * the brand shows up prominently even before any real vehicles exist.
 */
export const FALLBACK_VEHICLES: FleetCard[] = [
  {
    id: "demo-1",
    make: "Mercedes-Benz",
    model: "AMG C63S",
    year: null,
    category: "Luxury Sedan",
    seats: 5,
    transmission: "Automatic",
    dailyRate: 28000,
    imageUrl:
      "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?w=1200&q=80&auto=format&fit=crop",
    isDemo: true,
  },
  {
    id: "demo-2",
    make: "Mercedes-Benz",
    model: "GLE SUV",
    year: null,
    category: "Luxury SUV",
    seats: 5,
    transmission: "Automatic",
    dailyRate: 32000,
    imageUrl:
      "https://images.unsplash.com/photo-1559511206-f5ade67b8484?w=1200&q=80&auto=format&fit=crop",
    isDemo: true,
  },
  {
    id: "demo-3",
    make: "BMW",
    model: "5 Series",
    year: null,
    category: "Executive Sedan",
    seats: 5,
    transmission: "Automatic",
    dailyRate: 18000,
    imageUrl:
      "https://images.unsplash.com/photo-1578245601540-19edcdc12e7f?w=1200&q=80&auto=format&fit=crop",
    isDemo: true,
  },
  {
    id: "demo-4",
    make: "Premium",
    model: "Urban SUV",
    year: null,
    category: "SUV",
    seats: 5,
    transmission: "Automatic",
    dailyRate: 20000,
    imageUrl:
      "https://images.unsplash.com/photo-1529971204705-2f67a87d3552?w=1200&q=80&auto=format&fit=crop",
    isDemo: true,
  },
];

export const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?w=2400&q=80&auto=format&fit=crop";

function assignFallbackImage(index: number): string {
  return FALLBACK_VEHICLES[index % FALLBACK_VEHICLES.length]!.imageUrl;
}

/** Anonymous-readable — reads the public_vehicle_listings view (0012), not the RLS-locked vehicles table. */
export async function getFleetShowcase(): Promise<FleetCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_vehicle_listings")
    .select("*")
    .order("website_display_order", { ascending: true })
    .order("daily_rental_rate", { ascending: true })
    .limit(8);

  if (error) throw error;
  const listings = (data ?? []) as PublicVehicleListing[];

  if (listings.length === 0) {
    return FALLBACK_VEHICLES;
  }

  return listings.map((v, index) => ({
    id: v.id,
    make: v.make || "Vehicle",
    model: v.model || "",
    year: v.year,
    category: v.fuel_type === "electric" ? "Electric" : "Sedan / SUV",
    seats: 5,
    transmission: "Automatic",
    dailyRate: v.daily_rental_rate,
    imageUrl: v.photo_storage_path
      ? supabase.storage.from(VEHICLE_PHOTO_BUCKET).getPublicUrl(v.photo_storage_path).data.publicUrl
      : assignFallbackImage(index),
    isDemo: false,
  }));
}

/** Anonymous-readable — reads the public_business_info view (0012). */
export async function getPublicBusinessInfo(): Promise<PublicBusinessInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("public_business_info").select("*").maybeSingle();
  if (error) throw error;
  return data as PublicBusinessInfo | null;
}
