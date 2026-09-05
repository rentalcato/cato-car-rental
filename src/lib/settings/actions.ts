"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import {
  businessSettingsFormSchema,
  fieldErrors,
  profileRoleSchema,
  rentalSettingsFormSchema,
} from "@/lib/settings/schema";
import { LOGO_BUCKET, getAppSettings } from "@/lib/settings/queries";
import type { UserRole } from "@/types/database.types";

const SETTINGS_ADMINS = ["super_admin"] as const;

export interface SettingsActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function updateBusinessSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireRole(SETTINGS_ADMINS);

  const parsed = businessSettingsFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").update(parsed.data).eq("id", 1);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateRentalSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireRole(SETTINGS_ADMINS);

  const parsed = rentalSettingsFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      default_daily_rate: parsed.data.default_daily_rate ?? null,
      grace_period_hours: parsed.data.grace_period_hours,
      late_fee_per_day: parsed.data.late_fee_per_day,
      default_security_deposit: parsed.data.default_security_deposit,
      mileage_limit_per_day: parsed.data.mileage_limit_per_day ?? null,
      mileage_overage_fee: parsed.data.mileage_overage_fee ?? null,
      fuel_policy: parsed.data.fuel_policy ?? null,
    })
    .eq("id", 1);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function uploadBusinessLogo(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireRole(SETTINGS_ADMINS);

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a logo image to upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed." };
  }

  const settings = await getAppSettings();
  const supabase = await createClient();
  const path = `logo-${crypto.randomUUID()}.${file.type.split("/")[1] || "png"}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { error } = await supabase
    .from("app_settings")
    .update({ logo_storage_path: path })
    .eq("id", 1);
  if (error) {
    await supabase.storage.from(LOGO_BUCKET).remove([path]);
    return { error: error.message };
  }

  if (settings.logo_storage_path) {
    await supabase.storage.from(LOGO_BUCKET).remove([settings.logo_storage_path]);
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateProfileRole(
  profileId: string,
  role: UserRole
): Promise<SettingsActionState> {
  const { id: actorId } = await requireRole(SETTINGS_ADMINS);

  const parsedRole = profileRoleSchema.safeParse(role);
  if (!parsedRole.success) return { error: "Invalid role." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsedRole.data })
    .eq("id", profileId);
  if (error) return { error: error.message };

  await logAudit({
    actorId,
    action: "profile_role_changed",
    entityType: "profile",
    entityId: profileId,
    metadata: { role: parsedRole.data },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function setVehicleFeatured(
  vehicleId: string,
  isFeatured: boolean
): Promise<SettingsActionState> {
  await requireRole(SETTINGS_ADMINS);

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ is_featured: isFeatured })
    .eq("id", vehicleId);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function setVehicleDisplayOrder(
  vehicleId: string,
  order: number
): Promise<SettingsActionState> {
  await requireRole(SETTINGS_ADMINS);

  if (!Number.isInteger(order)) return { error: "Order must be a whole number." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ website_display_order: order })
    .eq("id", vehicleId);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function setProfileActive(
  profileId: string,
  isActive: boolean
): Promise<SettingsActionState> {
  const { id: actorId } = await requireRole(SETTINGS_ADMINS);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);
  if (error) return { error: error.message };

  await logAudit({
    actorId,
    action: isActive ? "profile_reactivated" : "profile_deactivated",
    entityType: "profile",
    entityId: profileId,
  });

  revalidatePath("/settings");
  return { success: true };
}
