"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, issueFormSchema } from "@/lib/issues/schema";
import { ISSUE_PHOTO_BUCKET } from "@/lib/issues/queries";

const ISSUE_MANAGERS = ["super_admin", "manager"] as const;

export interface IssueActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function reportDamage(
  _prevState: IssueActionState,
  formData: FormData
): Promise<IssueActionState> {
  await requireRole(ISSUE_MANAGERS);

  const parsed = issueFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }
  const values = parsed.data;

  const supabase = await createClient();

  let photoPath: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${values.vehicle_id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(ISSUE_PHOTO_BUCKET)
      .upload(path, photo, { contentType: photo.type || "application/octet-stream" });
    if (uploadError) return { error: `Photo upload failed: ${uploadError.message}` };
    photoPath = path;
  }

  const { data, error } = await supabase
    .from("vehicle_issues")
    .insert({
      vehicle_id: values.vehicle_id,
      issue_type: values.issue_type ?? null,
      description: values.description ?? null,
      severity: values.severity,
      repair_cost: values.repair_cost ?? null,
      photo_storage_path: photoPath,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) {
    if (photoPath) await supabase.storage.from(ISSUE_PHOTO_BUCKET).remove([photoPath]);
    return { error: error?.message ?? "Could not save the issue report." };
  }

  if (values.take_out_of_service) {
    const { error: vehicleError } = await supabase
      .from("vehicles")
      .update({ vehicle_status: "damaged" })
      .eq("id", values.vehicle_id);
    if (vehicleError) return { error: vehicleError.message };
  }

  revalidatePath("/maintenance");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${values.vehicle_id}`);
  redirect(`/vehicles/${values.vehicle_id}`);
}

export interface IssueMutationResult {
  error?: string;
}

export async function resolveIssue(issueId: string, vehicleId: string): Promise<IssueMutationResult> {
  await requireRole(ISSUE_MANAGERS);

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicle_issues")
    .update({ status: "resolved", resolved_date: new Date().toISOString() })
    .eq("id", issueId);

  if (error) return { error: error.message };

  revalidatePath("/maintenance");
  revalidatePath(`/vehicles/${vehicleId}`);
  return {};
}

export interface SignedUrlResult {
  url?: string;
  error?: string;
}

export async function getIssuePhotoUrl(storagePath: string): Promise<SignedUrlResult> {
  await requireRole(ISSUE_MANAGERS);

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(ISSUE_PHOTO_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error || !data) {
    return { error: error?.message ?? "Could not generate a link to this file." };
  }
  return { url: data.signedUrl };
}
