"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import { getCustomer } from "@/lib/customers/queries";
import { PHOTO_BUCKET } from "@/lib/customers/photo";

const PHOTO_MANAGERS = ["super_admin", "manager", "staff"] as const;

export interface PhotoActionState {
  error?: string;
  success?: boolean;
}

export async function uploadCustomerPhoto(
  customerId: string,
  _prevState: PhotoActionState,
  formData: FormData
): Promise<PhotoActionState> {
  const { id: userId } = await requireRole(PHOTO_MANAGERS);

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed." };
  }

  const customer = await getCustomer(customerId);
  const supabase = await createClient();
  const path = `${customerId}/${crypto.randomUUID()}.${file.type.split("/")[1] || "jpg"}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update({ photo_storage_path: path })
    .eq("id", customerId);

  if (updateError) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    return { error: updateError.message };
  }

  if (customer?.photo_storage_path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([customer.photo_storage_path]);
  }

  await logAudit({
    actorId: userId,
    action: "customer_photo_updated",
    entityType: "customer",
    entityId: customerId,
  });

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}
