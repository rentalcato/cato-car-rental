import "server-only";

import { createClient } from "@/lib/supabase/server";
import { LOGO_BUCKET } from "@/lib/settings/queries";
import { BODY_TYPE_LABELS, TRANSMISSION_LABELS } from "@/lib/vehicles/labels";
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

/** Hashes on the vehicle's own id (not list position) so a given vehicle always gets the same stand-in photo, on the homepage card and its detail page alike. */
function assignFallbackImage(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return FALLBACK_VEHICLES[hash % FALLBACK_VEHICLES.length]!.imageUrl;
}

function toFleetCard(v: PublicVehicleListing, storagePublicUrl: (path: string) => string): FleetCard {
  // Real values when a vehicle has them set (Vehicles -> Add/Edit); a
  // sensible generic fallback otherwise so older vehicles that predate
  // these fields (0017) still display something reasonable.
  const category = v.body_type
    ? BODY_TYPE_LABELS[v.body_type]
    : v.fuel_type === "electric"
      ? "Electric"
      : "Sedan / SUV";

  return {
    id: v.id,
    make: v.make || "Vehicle",
    model: v.model || "",
    year: v.year,
    category,
    seats: v.seats ?? 5,
    transmission: v.transmission ? TRANSMISSION_LABELS[v.transmission] : "Automatic",
    dailyRate: v.daily_rental_rate,
    imageUrl: v.photo_storage_path ? storagePublicUrl(v.photo_storage_path) : assignFallbackImage(v.id),
    isDemo: false,
  };
}

/**
 * Anonymous-readable — reads the public_vehicle_listings view (0012), not
 * the RLS-locked vehicles table. No cap: an admin already controls what's
 * in this pool at all via Settings -> Website (is_featured, 0013), and
 * capping further on top of that would fight the homepage's own search
 * box — a vehicle the search box can't find because it got cut for being
 * 9th-by-price would look like a bug, not a feature.
 */
export async function getFleetShowcase(): Promise<FleetCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_vehicle_listings")
    .select("*")
    .order("website_display_order", { ascending: true })
    .order("daily_rental_rate", { ascending: true });

  if (error) throw error;
  const listings = (data ?? []) as PublicVehicleListing[];

  if (listings.length === 0) {
    return FALLBACK_VEHICLES;
  }

  return listings.map((v) =>
    toFleetCard(
      v,
      (path) => supabase.storage.from(VEHICLE_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
    )
  );
}

/**
 * The full bookable catalog for a signed-in customer's "Browse Fleet"
 * screen (src/app/account/fleet) — same view as getFleetShowcase(), but
 * no .limit(8) (that cap is a homepage-hero concern, not a real
 * catalog) and no demo-fallback (an authenticated booking screen says
 * "nothing available" plainly, never shows fake cars to book).
 *
 * `search` matches make/model only — this view never exposes the
 * license plate (that's still internal-only), unlike the staff-side
 * vehicle search in lib/vehicles/queries.ts.
 */
export async function getBookableVehicles(search?: string): Promise<FleetCard[]> {
  const supabase = await createClient();
  let query = supabase.from("public_vehicle_listings").select("*");

  if (search?.trim()) {
    const term = search.trim().replace(/[%,]/g, "");
    query = query.or(`make.ilike.%${term}%,model.ilike.%${term}%`);
  }

  const { data, error } = await query
    .order("website_display_order", { ascending: true })
    .order("daily_rental_rate", { ascending: true });

  if (error) throw error;
  const listings = (data ?? []) as PublicVehicleListing[];

  return listings.map((v) =>
    toFleetCard(
      v,
      (path) => supabase.storage.from(VEHICLE_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
    )
  );
}

/**
 * A single real vehicle's public detail page data. Reads the same
 * anon-readable public_vehicle_listings view as getFleetShowcase() — never
 * the RLS-locked vehicles table — so it can only ever return what's
 * currently featured, available and non-archived (see 0012/0013).
 * Returns null if the id doesn't match any such row (bad id, or the
 * vehicle since got rented/archived/unfeatured).
 */
export async function getVehicleListingById(
  id: string
): Promise<(FleetCard & { colour: string | null }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_vehicle_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    // 22P02 = invalid input syntax for uuid — a malformed id in the URL,
    // not a real backend failure. Treat it the same as "no such vehicle"
    // instead of surfacing a 500 for what's really a bad/stale link.
    if (error.code === "22P02") return null;
    throw error;
  }
  if (!data) return null;

  const listing = data as PublicVehicleListing;
  const card = toFleetCard(
    listing,
    (path) => supabase.storage.from(VEHICLE_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
  );
  return { ...card, colour: listing.colour };
}

/** Anonymous-readable — reads the public_business_info view (0012). */
export async function getPublicBusinessInfo(): Promise<PublicBusinessInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("public_business_info").select("*").maybeSingle();
  if (error) throw error;
  return data as PublicBusinessInfo | null;
}

/** business-assets is a public bucket (same one Settings' logo uploader writes to) — safe to resolve anonymously. */
export async function getPublicBusinessLogoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  return supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
}
