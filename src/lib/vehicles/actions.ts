"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { dailyRateSchema, fieldErrors, vehicleFormSchema } from "@/lib/vehicles/schema";
import { isLicensePlateTaken } from "@/lib/vehicles/queries";

const FLEET_MANAGERS = ["super_admin", "manager"] as const;
const PHOTO_BUCKET = "vehicle-photos";

export interface VehicleActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

/** Postgres unique-violation code, kept in case of a race with the DB constraint. */
function dbErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "A vehicle with this license plate or VIN already exists.";
  }
  return error.message;
}

export async function createVehicle(
  _prevState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  await requireRole(FLEET_MANAGERS);

  const parsed = vehicleFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  if (await isLicensePlateTaken(parsed.data.license_plate)) {
    return {
      fieldErrors: {
        license_plate: ["A vehicle with this license plate already exists."],
      },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return { error: dbErrorMessage(error ?? { message: "Could not create vehicle." }) };
  }

  revalidatePath("/vehicles");
  redirect(`/vehicles/${data.id}`);
}

export async function updateVehicle(
  vehicleId: string,
  _prevState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  await requireRole(FLEET_MANAGERS);

  const parsed = vehicleFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  if (await isLicensePlateTaken(parsed.data.license_plate, vehicleId)) {
    return {
      fieldErrors: {
        license_plate: ["Another vehicle already uses this license plate."],
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update(parsed.data)
    .eq("id", vehicleId);

  if (error) {
    return { error: dbErrorMessage(error) };
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
