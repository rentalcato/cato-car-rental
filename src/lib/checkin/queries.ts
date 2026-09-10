import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { RentalCheckin } from "@/types/database.types";

export async function getRentalCheckin(rentalId: string): Promise<RentalCheckin | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_checkins")
    .select("*")
    .eq("rental_id", rentalId)
    .maybeSingle();

  if (error) throw error;
  return (data as RentalCheckin | null) ?? null;
}
