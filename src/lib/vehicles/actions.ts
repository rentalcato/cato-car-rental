"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import { dailyRateSchema, fieldErrors, vehicleFormSchema } from "@/lib/vehicles/schema";
import { isLicensePlateTaken } from "@/lib/vehicles/queries";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const FLEET_MANAGERS = ["super_admin", "manager"] as const;
const PHOTO_BUCKET = "vehicle-photos";

export interface VehicleActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  /**
   * Echoes back whatever was submitted so the form can redisplay it after
   * a failed attempt — a Server Action round trip re-renders this form
   * from scratch, so relying on the browser to keep unsaved input would
   * silently lose it the moment one field fails validation.
   */
  values?: Record<string, string>;
}

/** FormData -> plain string map, for echoing values back on a failed submission. */
function formValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    Array.from(formData.entries())
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

/** Postgres unique-violation code, kept in case of a race with the DB constraint. */
function dbErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "A vehicle with this license plate or VIN already exists.";
  }
  return error.message;
}

/** Shared by uploadVehiclePhotos() and createVehicle()'s optional at-creation photo(s). */
async function uploadVehiclePhotoFiles(
  supabase: SupabaseServerClient,
  vehicleId: string,
  files: File[]
): Promise<{ error?: string }> {
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${vehicleId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type || "image/jpeg" });

    if (uploadError) {
      return { error: `Upload failed: ${uploadError.message}` };
    }

    const { error: insertError } = await supabase
      .from("vehicle_photos")
      .insert({ vehicle_id: vehicleId, storage_path: path });

    if (insertError) {
      return { error: dbErrorMessage(insertError) };
    }
  }

  return {};
}

export async function createVehicle(
  _prevState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  await requireRole(FLEET_MANAGERS);

  const values = formValues(formData);
  const parsed = vehicleFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values };
  }

  if (await isLicensePlateTaken(parsed.data.license_plate)) {
    return {
      fieldErrors: {
        license_plate: ["A vehicle with this license plate already exists."],
      },
      values,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return { error: dbErrorMessage(error ?? { message: "Could not create vehicle." }), values };
  }

  // Optional photo(s) chosen on the Add Vehicle form itself. Best-effort:
  // the vehicle record is already safely created at this point, so a
  // photo upload failure shouldn't undo that — it's surfaced as a banner
  // on the vehicle's profile page instead (?photoError=1), where Photos
  // already has its own retry upload control.
  const photoFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  let photoError = false;
  if (photoFiles.length > 0) {
    const photoResult = await uploadVehiclePhotoFiles(supabase, data.id, photoFiles);
    photoError = Boolean(photoResult.error);
  }

  revalidatePath("/vehicles");
  redirect(`/vehicles/${data.id}${photoError ? "?photoError=1" : ""}`);
}

export async function updateVehicle(
  vehicleId: string,
  _prevState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  await requireRole(FLEET_MANAGERS);

  const values = formValues(formData);
  const parsed = vehicleFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values };
  }

  if (await isLicensePlateTaken(parsed.data.license_plate, vehicleId)) {
    return {
      fieldErrors: {
        license_plate: ["Another vehicle already uses this license plate."],
      },
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update(parsed.data)
    .eq("id", vehicleId);

  if (error) {
    return { error: dbErrorMessage(error), values };
  }

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(`/vehicles/${vehicleId}`);
}

export async function updateDailyRate(
  vehicleId: string,
  _prevState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  await requireRole(FLEET_MANAGERS);

  const parsed = dailyRateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ daily_rental_rate: parsed.data.daily_rental_rate })
    .eq("id", vehicleId);

  if (error) {
    return { error: dbErrorMessage(error) };
  }

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
  return { success: true };
}

export interface VehicleMutationResult {
  error?: string;
}

export async function archiveVehicle(vehicleId: string): Promise<VehicleMutationResult> {
  await requireRole(FLEET_MANAGERS);

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", vehicleId);

  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
  return {};
}

export async function restoreVehicle(vehicleId: string): Promise<VehicleMutationResult> {
  await requireRole(FLEET_MANAGERS);

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ archived_at: null })
    .eq("id", vehicleId);

  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
  return {};
}

export interface DeleteVehicleResult {
  error?: string;
  success?: boolean;
}

/**
 * Permanently removes a vehicle — distinct from archiveVehicle(), which
 * just hides it while keeping every record intact. rentals.vehicle_id is
 * "on delete restrict" (0001), so the database itself refuses this if
 * the vehicle has any rental or reservation history at all; that's
 * surfaced here as a clear message pointing at Archive instead, rather
 * than a raw constraint error. vehicle_issues/maintenance/vehicle_photos
 * all cascade-delete with the vehicle (existing schema, unchanged) —
 * the confirmation dialog warns about that before this ever runs.
 */
export async function deleteVehicle(vehicleId: string): Promise<DeleteVehicleResult> {
  const { id: userId } = await requireRole(FLEET_MANAGERS);

  const supabase = await createClient();

  // Photo storage_paths are metadata cascade-deleted with the vehicle,
  // but the actual files in Storage are not — collected first so they
  // can be cleaned up after a successful delete.
  const { data: photos } = await supabase
    .from("vehicle_photos")
    .select("storage_path")
    .eq("vehicle_id", vehicleId);

  const { error, data } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .select("license_plate")
    .maybeSingle();

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "This vehicle has rental or reservation history and can't be deleted. Archive it instead to remove it from the active fleet without losing that history.",
      };
    }
    return { error: dbErrorMessage(error) };
  }
  if (!data) return { error: "Vehicle not found." };

  if (photos?.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.storage_path));
  }

  await logAudit({
    actorId: userId,
    action: "vehicle_deleted",
    entityType: "vehicle",
    entityId: vehicleId,
    entityLabel: data.license_plate,
  });

  revalidatePath("/vehicles");
  return { success: true };
}

export async function uploadVehiclePhotos(
  vehicleId: string,
  _prevState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  await requireRole(FLEET_MANAGERS);

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return { error: "Choose at least one photo to upload." };
  }

  const supabase = await createClient();
  const result = await uploadVehiclePhotoFiles(supabase, vehicleId, files);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/vehicles/${vehicleId}`);
  return { success: true };
}

export async function deleteVehiclePhoto(
  vehicleId: string,
  photoId: string,
  storagePath: string
): Promise<VehicleMutationResult> {
  await requireRole(FLEET_MANAGERS);

  const supabase = await createClient();
  const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
  if (storageError) return { error: storageError.message };

  // Scoped by vehicle_id too — a photo id alone isn't enough to trust it
  // belongs to the vehicle the caller thinks it does.
  const { error } = await supabase
    .from("vehicle_photos")
    .delete()
    .eq("id", photoId)
    .eq("vehicle_id", vehicleId);
  if (error) return { error: error.message };

  revalidatePath(`/vehicles/${vehicleId}`);
  return {};
}

/**
 * Shared "close the loop" action for both Maintenance and Issues — sets a
 * vehicle back to Available. Kept vehicle-status-owned rather than under
 * either sub-feature. The protect_vehicle_status_transition trigger (0008)
 * still applies: this is rejected if the vehicle genuinely has an open
 * rental/reservation.
 */
export async function returnVehicleToService(vehicleId: string): Promise<VehicleMutationResult> {
  await requireRole(FLEET_MANAGERS);

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ vehicle_status: "available" })
    .eq("id", vehicleId);

  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/maintenance");
  return {};
}
