import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AppSettings, Profile } from "@/types/database.types";

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
