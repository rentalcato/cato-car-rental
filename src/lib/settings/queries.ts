import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AppSettings, Profile, Vehicle } from "@/types/database.types";

export type WebsiteVehicleRow = Pick<
  Vehicle,
  "id" | "license_plate" | "make" | "model" | "year" | "vehicle_status" | "is_featured" | "website_display_order"
>;

export const LOGO_BUCKET = "business-assets";

/** Always returns a row — 0010 migration seeds the singleton on creation. */
export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data as AppSettings;
}

export async function getBusinessLogoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  return supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function listStaffAccounts(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Profile[];
}

/** Non-archived vehicles, for the "Website" curation table — which of these are eligible to appear never matters here; that's the public_vehicle_listings view's job. */
export async function listWebsiteVehicles(): Promise<WebsiteVehicleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, license_plate, make, model, year, vehicle_status, is_featured, website_display_order")
    .is("archived_at", null)
    .order("make", { ascending: true })
    .order("model", { ascending: true });
  if (error) throw error;
  return data as WebsiteVehicleRow[];
}
