import "server-only";

import { createClient } from "@/lib/supabase/server";

export const PHOTO_BUCKET = "customer-photos";

export async function getCustomerPhotoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}
