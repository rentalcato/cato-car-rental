"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export interface FavoriteActionState {
  error?: string;
  isFavorited?: boolean;
}

/**
 * Toggles a vehicle in/out of the caller's saved list. Scoped to their own
 * linked customer record via customer_favorites_insert_own/_delete_own
 * (0022) — fails closed with a clear message for an unlinked account,
 * matching requestReservation()'s pattern.
 */
export async function toggleFavorite(vehicleId: string): Promise<FavoriteActionState> {
  const { id: userId } = await requireUser();

  const supabase = await createClient();
  const { data: customer, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();
  if (lookupError) return { error: lookupError.message };
  if (!customer) {
    return { error: "Your account isn't connected to a customer record yet — contact us to get set up first." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("customer_favorites")
    .select("id")
    .eq("customer_id", customer.id)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();
  if (existingError) return { error: existingError.message };

  if (existing) {
    const { error } = await supabase.from("customer_favorites").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/account/favorites");
    return { isFavorited: false };
  }

  const { error } = await supabase
    .from("customer_favorites")
    .insert({ customer_id: customer.id, vehicle_id: vehicleId });
  if (error) return { error: error.message };

  revalidatePath("/account/favorites");
  return { isFavorited: true };
}
