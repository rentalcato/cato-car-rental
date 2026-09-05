"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, maintenanceFormSchema } from "@/lib/maintenance/schema";
import { MAINTENANCE_BUCKET } from "@/lib/maintenance/queries";

const MAINTENANCE_MANAGERS = ["super_admin", "manager"] as const;

export interface MaintenanceActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function recordMaintenance(
  _prevState: MaintenanceActionState,
  formData: FormData
): Promise<MaintenanceActionState> {
  await requireRole(MAINTENANCE_MANAGERS);

  const parsed = maintenanceFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }
  const values = parsed.data;

  const supabase = await createClient();

  let receiptPath: string | null = null;
  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const safeName = receipt.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${values.vehicle_id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(MAINTENANCE_BUCKET)
      .upload(path, receipt, { contentType: receipt.type || "application/octet-stream" });
    if (uploadError) return { error: `Receipt upload failed: ${uploadError.message}` };
    receiptPath = path;
  }

  const { data, error } = await supabase
    .from("maintenance")
    .insert({
      vehicle_id: values.vehicle_id,
      maintenance_type: values.maintenance_type,
      description: values.description ?? null,
      service_date: values.service_date ?? null,
      next_service_date: values.next_service_date ?? null,
      mileage_at_service: values.mileage_at_service ?? null,
      next_service_mileage: values.next_service_mileage ?? null,
      cost: values.cost ?? null,
      service_provider: values.service_provider ?? null,
      notes: values.notes ?? null,
      receipt_storage_path: receiptPath,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (receiptPath) await supabase.storage.from(MAINTENANCE_BUCKET).remove([receiptPath]);
    return { error: error?.message ?? "Could not save the maintenance record." };
  }

  if (values.send_to_maintenance) {
    const { error: vehicleError } = await supabase
      .from("vehicles")
      .update({ vehicle_status: "maintenance" })
      .eq("id", values.vehicle_id);
    if (vehicleError) return { error: vehicleError.message };
  }

  revalidatePath("/maintenance");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${values.vehicle_id}`);
  redirect(`/vehicles/${values.vehicle_id}`);
}

export interface SignedUrlResult {
  url?: string;
  error?: string;
}

export async function getMaintenanceAttachmentUrl(storagePath: string): Promise<SignedUrlResult> {
  await requireRole(MAINTENANCE_MANAGERS);

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(MAINTENANCE_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error || !data) {
    return { error: error?.message ?? "Could not generate a link to this file." };
  }
  return { url: data.signedUrl };
}
